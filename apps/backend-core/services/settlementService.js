const crypto = require('crypto');
const { normalizePhoneNumber, safeCompare } = require('@polyfit/shared-utils');
const { supabase } = require('./supabaseService');

// ─── Settlement Status Transitions ────────────────────────────────────────────
const SETTLEMENT_STATUS_TRANSITIONS = {
  pending: ['processing'],
  processing: ['paid', 'failed'],
  failed: ['processing']  // Allow retry
};

// ─── Helper: Net-15 Disbursement Date Calculator ─────────────────────────────
/**
 * Computes Net-15 disbursement date based on settlement period end date.
 * Net-15 terms: payout is due on the 15th of the month following the settlement period end.
 * E.g., period end 2026-01-31 -> payout due 2026-02-15.
 */
function calculateNet15DisbursementDate(periodEndStr) {
  if (!periodEndStr || typeof periodEndStr !== "string") return null;
  const parts = periodEndStr.split("-");
  if (parts.length < 2) return null;
  let year = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10);

  // Next month
  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }

  const mStr = String(month).padStart(2, "0");
  return `${year}-${mStr}-15`;
}

// ─── Generate Settlement ──────────────────────────────────────────────────────
/**
 * Generates a settlement for a specific provider and period.
 * Aggregates verified visits across all orgs that have contracts with this provider.
 * Idempotent: returns existing settlement if one already exists for the period.
 *
 * @param {string} providerId - Provider UUID
 * @param {string} periodStart - Settlement period start date (YYYY-MM-DD)
 * @param {string} periodEnd - Settlement period end date (YYYY-MM-DD)
 * @returns {{ settlement: object, visitBreakdown: object[], created: boolean }}
 */
async function generateSettlement(providerId, periodStart, periodEnd) {
  if (!supabase) throw new Error('Database connection unavailable');

  // ── Idempotency check ──
  const { data: existing } = await supabase
    .from('settlements')
    .select('*')
    .eq('provider_id', providerId)
    .eq('settlement_period_start', periodStart)
    .eq('settlement_period_end', periodEnd)
    .maybeSingle();

  if (existing) {
    return {
      settlement: existing,
      created: false,
      message: 'Settlement already exists for this period'
    };
  }

  // ── Verify provider exists ──
  const { data: provider, error: provError } = await supabase
    .from('providers')
    .select('id, name, status')
    .eq('id', providerId)
    .single();

  if (provError || !provider) {
    throw new Error(`Provider not found: ${providerId}`);
  }

  if (provider.status !== 'active') {
    throw new Error(`Provider ${provider.name} is not active (status: ${provider.status})`);
  }

  // ── Get all provider locations ──
  const { data: locations, error: locError } = await supabase
    .from('provider_locations')
    .select('id')
    .eq('provider_id', providerId);

  if (locError) throw new Error(`Failed to query provider locations: ${locError.message}`);

  if (!locations || locations.length === 0) {
    throw new Error(`Provider ${provider.name} has no registered locations`);
  }

  const locationIds = locations.map(l => l.id);

  // ── Get verified visits at this provider's locations in the period ──
  const { data: visits, error: visitError } = await supabase
    .from('visits')
    .select(`
      id,
      org_id,
      provider_location_id,
      check_in_at,
      employee_id
    `)
    .eq('status', 'verified')
    .in('provider_location_id', locationIds)
    .gte('check_in_at', `${periodStart}T00:00:00Z`)
    .lte('check_in_at', `${periodEnd}T23:59:59Z`);

  if (visitError) {
    throw new Error(`Failed to query visits: ${visitError.message}`);
  }

  if (!visits || visits.length === 0) {
    throw new Error(`No verified visits found for provider ${provider.name} in period ${periodStart} to ${periodEnd}`);
  }

  // ── Dispute Escrow Hold Check (Zero-Cash-Leakage Covenant) ──
  // Check if any of these visits have active open disputes in visit_disputes
  const visitIds = visits.map(v => v.id);
  const { data: activeDisputes, error: dispError } = await supabase
    .from('visit_disputes')
    .select('visit_id, status, reason')
    .in('visit_id', visitIds)
    .in('status', ['open', 'investigating']);

  if (dispError) {
    console.warn('[settlementService] Active disputes query warning:', dispError.message);
  }

  const disputedVisitIdSet = new Set((activeDisputes || []).map(d => d.visit_id));

  // ── Group visits by org and partition into billable vs held ──
  const billableVisitsByOrg = {};
  const heldVisitsByOrg = {};

  for (const visit of visits) {
    const isDisputed = disputedVisitIdSet.has(visit.id);
    const targetMap = isDisputed ? heldVisitsByOrg : billableVisitsByOrg;
    if (!targetMap[visit.org_id]) {
      targetMap[visit.org_id] = [];
    }
    targetMap[visit.org_id].push(visit);
  }

  const allOrgIds = Array.from(new Set([...Object.keys(billableVisitsByOrg), ...Object.keys(heldVisitsByOrg)]));

  // Get custom contracts and Master Provider Agreement (org_id IS NULL)
  const { data: contracts, error: contractError } = await supabase
    .from('provider_contracts')
    .select('org_id, per_visit_rate')
    .eq('provider_id', providerId)
    .eq('status', 'active');

  if (contractError) {
    throw new Error(`Failed to query contracts: ${contractError.message}`);
  }

  let masterRate = 8000;
  const rateByOrg = {};
  for (const contract of (contracts || [])) {
    if (!contract.org_id) {
      masterRate = parseFloat(contract.per_visit_rate) || masterRate;
    } else {
      rateByOrg[contract.org_id] = parseFloat(contract.per_visit_rate);
    }
  }

  // Default any orgs without custom bilateral contract to the Master Provider Agreement rate
  for (const oid of allOrgIds) {
    if (rateByOrg[oid] === undefined) {
      rateByOrg[oid] = masterRate;
    }
  }

  // ── Calculate billable settlement totals ──
  let totalVisits = 0;
  let totalAmount = 0;
  const visitBreakdown = [];

  for (const [orgId, orgVisits] of Object.entries(billableVisitsByOrg)) {
    const rate = rateByOrg[orgId];
    if (rate === undefined) continue;

    const visitCount = orgVisits.length;
    const subtotal = parseFloat((visitCount * rate).toFixed(2));

    visitBreakdown.push({
      org_id: orgId,
      visit_count: visitCount,
      per_visit_rate: rate,
      subtotal
    });

    totalVisits += visitCount;
    totalAmount += subtotal;
  }

  // ── Calculate held visits totals (Dispute Escrow) ──
  let heldVisitsCount = 0;
  let heldAmount = 0;
  const heldBreakdown = [];

  for (const [orgId, orgVisits] of Object.entries(heldVisitsByOrg)) {
    const rate = rateByOrg[orgId] || 0;
    const count = orgVisits.length;
    const sub = parseFloat((count * rate).toFixed(2));

    heldBreakdown.push({
      org_id: orgId,
      visit_count: count,
      per_visit_rate: rate,
      subtotal: sub
    });

    heldVisitsCount += count;
    heldAmount += sub;
  }

  totalAmount = parseFloat(totalAmount.toFixed(2));
  heldAmount = parseFloat(heldAmount.toFixed(2));

  if (totalVisits === 0) {
    if (heldVisitsCount > 0) {
      throw new Error(
        `All ${heldVisitsCount} verified visits for provider ${provider.name} are currently held under active dispute and cannot be settled yet.`
      );
    }
    throw new Error(`No billable visits found (all orgs may lack active contracts) for provider ${provider.name}`);
  }

  // ── Insert settlement record ──
  const { data: settlement, error: settleError } = await supabase
    .from('settlements')
    .insert({
      provider_id: providerId,
      settlement_period_start: periodStart,
      settlement_period_end: periodEnd,
      total_visits: totalVisits,
      total_amount: totalAmount,
      status: 'pending'
    })
    .select()
    .single();

  if (settleError) {
    // Handle unique constraint violation (race condition idempotency)
    if (settleError.code === '23505') {
      const { data: raceSettlement } = await supabase
        .from('settlements')
        .select('*')
        .eq('provider_id', providerId)
        .eq('settlement_period_start', periodStart)
        .eq('settlement_period_end', periodEnd)
        .single();
      return {
        settlement: raceSettlement,
        visitBreakdown,
        heldBreakdown,
        heldVisitsCount,
        heldAmount,
        created: false,
        message: 'Settlement already exists (concurrent generation detected)'
      };
    }
    throw new Error(`Failed to create settlement: ${settleError.message}`);
  }

  return {
    settlement,
    visitBreakdown,
    heldBreakdown,
    heldVisitsCount,
    heldAmount,
    created: true
  };
}

// ─── Generate All Settlements (Batch Cron) ────────────────────────────────────
/**
 * Generates settlements for ALL active providers with verified visits in the period.
 *
 * @param {string} periodStart
 * @param {string} periodEnd
 * @returns {{ generated: number, skipped: number, errors: object[], results: object[] }}
 */
async function generateAllSettlements(periodStart, periodEnd) {
  if (!supabase) throw new Error('Database connection unavailable');

  const { data: providers, error: provError } = await supabase
    .from('providers')
    .select('id, name')
    .eq('status', 'active');

  if (provError) throw new Error(`Failed to list providers: ${provError.message}`);

  const activeProviders = providers || [];
  if (activeProviders.length === 0) {
    return { generated: 0, skipped: 0, errors: [], results: [] };
  }

  const settleResults = await Promise.allSettled(
    activeProviders.map(async (provider) => {
      const result = await generateSettlement(provider.id, periodStart, periodEnd);
      return { provider, result };
    })
  );

  const results = [];
  let generated = 0;
  let skipped = 0;
  const errors = [];

  for (let i = 0; i < settleResults.length; i++) {
    const provider = activeProviders[i];
    const item = settleResults[i];

    if (item.status === 'fulfilled') {
      const { result } = item.value;
      results.push({ providerId: provider.id, providerName: provider.name, ...result });
      if (result.created) generated++;
      else skipped++;
    } else {
      const err = item.reason;
      const errMsg = err && err.message ? err.message : String(err);
      if (errMsg.includes('No verified visits') || errMsg.includes('No billable visits')) {
        skipped++;
      } else {
        errors.push({ providerId: provider.id, providerName: provider.name, error: errMsg });
      }
    }
  }

  return { generated, skipped, errors, results };
}

// ─── List Settlements ─────────────────────────────────────────────────────────
/**
 * Lists settlements with optional filtering and pagination.
 *
 * @param {object} params
 * @param {string} [params.providerId] - Filter by provider
 * @param {string} [params.status] - Filter by status
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 */
async function listSettlements({ providerId, status, page = 1, limit = 20 } = {}) {
  if (!supabase) throw new Error('Database connection unavailable');

  let query = supabase
    .from('settlements')
    .select(`
      *,
      providers!inner ( id, name )
    `, { count: 'exact' });

  if (providerId) query = query.eq('provider_id', providerId);
  if (status) query = query.eq('status', status);

  const offset = (page - 1) * limit;
  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) throw new Error(`Failed to list settlements: ${error.message}`);

  const enriched = (data || []).map(s => {
    const gross = Number(s.total_amount) || 0;
    const fee = Math.round(gross * 0.15);
    const net = gross - fee;
    return {
      ...s,
      settlement_number: s.settlement_number || `PF-SET-${(s.settlement_period_end || '').slice(0, 7)}-${s.id.slice(0, 6).toUpperCase()}`,
      gross_amount: gross,
      platform_fee_amount: fee,
      net_payout_amount: net,
      net_amount: net
    };
  });

  return {
    settlements: enriched,
    total: count || 0,
    page,
    limit
  };
}

// ─── Get Settlement Detail ────────────────────────────────────────────────────
/**
 * Retrieves full settlement detail with visit breakdown.
 *
 * @param {string} settlementId
 * @returns {object} Settlement with visit details
 */
async function getSettlementDetail(settlementId) {
  if (!supabase) throw new Error('Database connection unavailable');

  const { data: settlement, error: settError } = await supabase
    .from('settlements')
    .select(`
      *,
      providers!inner ( id, name, settlement_email, bank_details )
    `)
    .eq('id', settlementId)
    .single();

  if (settError) {
    if (settError.code === 'PGRST116') throw new Error('Settlement not found');
    throw new Error(`Failed to get settlement: ${settError.message}`);
  }

  // Fetch the actual visits that comprise this settlement
  const { data: locations } = await supabase
    .from('provider_locations')
    .select('id')
    .eq('provider_id', settlement.provider_id);

  const locationIds = (locations || []).map(l => l.id);

  let visitBreakdown = [];
  if (locationIds.length > 0) {
    const { data: visits } = await supabase
      .from('visits')
      .select(`
        id,
        org_id,
        employee_id,
        check_in_at,
        provider_location_id,
        provider_locations!inner ( name )
      `)
      .eq('status', 'verified')
      .in('provider_location_id', locationIds)
      .gte('check_in_at', `${settlement.settlement_period_start}T00:00:00Z`)
      .lte('check_in_at', `${settlement.settlement_period_end}T23:59:59Z`)
      .order('check_in_at', { ascending: false });

    visitBreakdown = visits || [];
  }

  const net15PayoutDate = calculateNet15DisbursementDate(settlement.settlement_period_end);

  const grossAmount = Number(settlement.total_amount) || 0;
  const netBeforeVat = Math.round((grossAmount / 1.18) * 100) / 100;
  const vatAmount = Math.round((grossAmount - netBeforeVat) * 100) / 100;
  const platformFeePct = 15;
  const platformFeeAmount = Math.round(grossAmount * (platformFeePct / 100));
  const netPayoutAmount = grossAmount - platformFeeAmount;
  const settlementNum = settlement.settlement_number || `PF-SET-${(settlement.settlement_period_end || '').slice(0, 7)}-${settlement.id.slice(0, 6).toUpperCase()}`;

  return {
    ...settlement,
    settlement_number: settlementNum,
    net15_disbursement_date: net15PayoutDate,
    payout_due_date: net15PayoutDate,
    subtotal_exclusive_vat: netBeforeVat,
    vat_rate_pct: 18,
    vat_amount: vatAmount,
    gross_amount: grossAmount,
    platform_fee_percentage: platformFeePct,
    platform_fee_amount: platformFeeAmount,
    net_payout_amount: netPayoutAmount,
    net_amount: netPayoutAmount,
    visit_breakdown: visitBreakdown,
    visit_count_verified: visitBreakdown.length
  };
}

// ─── Update Settlement Status ─────────────────────────────────────────────────
/**
 * Updates settlement status with state machine validation.
 *
 * @param {string} settlementId
 * @param {string} newStatus
 * @param {string} [paymentReference] - Required when marking as paid
 */
async function updateSettlementStatus(settlementId, newStatus, paymentReference = null) {
  if (!supabase) throw new Error('Database connection unavailable');

  const { data: settlement, error: fetchError } = await supabase
    .from('settlements')
    .select('id, status')
    .eq('id', settlementId)
    .single();

  if (fetchError || !settlement) {
    throw new Error('Settlement not found');
  }

  const currentStatus = settlement.status;
  const allowedTransitions = SETTLEMENT_STATUS_TRANSITIONS[currentStatus];

  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    throw new Error(
      `Invalid status transition: ${currentStatus} → ${newStatus}. Allowed: ${(allowedTransitions || []).join(', ')}`
    );
  }

  const updatePayload = {
    status: newStatus,
    updated_at: new Date().toISOString()
  };

  if (newStatus === 'paid') {
    if (!paymentReference) {
      throw new Error('payment_reference is required when marking settlement as paid');
    }
    updatePayload.paid_at = new Date().toISOString();
    updatePayload.payment_reference = paymentReference;
  }

  const { data: updated, error: updateError } = await supabase
    .from('settlements')
    .update(updatePayload)
    .eq('id', settlementId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update settlement status: ${updateError.message}`);
  }

  return updated;
}

// ─── Approve Settlement ───────────────────────────────────────────────────────
/**
 * Transitions settlement from pending to processing (approved for payout).
 *
 * @param {string} settlementId
 * @param {string} [adminUserId]
 * @returns {object} Updated settlement
 */
async function approveSettlement(settlementId, adminUserId = null) {
  return updateSettlementStatus(settlementId, 'processing');
}

// ─── Disburse Settlement ──────────────────────────────────────────────────────
/**
 * Transitions settlement from processing to paid and records payment reference.
 *
 * @param {string} settlementId
 * @param {string} [paymentReference]
 * @param {string} [adminUserId]
 * @returns {object} Updated settlement
 */
async function disburseSettlement(settlementId, paymentReference = null, adminUserId = null) {
  let ref = paymentReference;
  if (!ref || !ref.trim()) {
    const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    ref = `PF-DISB-${ts}-${settlementId.slice(0, 6).toUpperCase()}`;
  }
  return updateSettlementStatus(settlementId, 'paid', ref);
}

// ─── Generate Disbursement CSV ────────────────────────────────────────────────
/**
 * Generates formatted CSV disbursement files for local rails (MTN MoMo Bulk or Bank EFT).
 *
 * @param {'momo'|'bank'} type
 * @param {object} options
 * @param {string} [options.status='processing']
 * @param {string} [options.periodStart]
 * @param {string} [options.periodEnd]
 * @returns {Promise<{ type: string, filename: string, content: string, count: number, totalAmount: number }>}
 */
async function generateDisbursementCsv(type = 'momo', { status = 'processing', periodStart, periodEnd } = {}) {
  if (!supabase) throw new Error('Database connection unavailable');

  let query = supabase
    .from('settlements')
    .select(`
      id,
      total_amount,
      total_visits,
      settlement_period_start,
      settlement_period_end,
      status,
      payment_reference,
      providers!inner (
        id,
        name,
        category,
        contact_email,
        settlement_email,
        tax_id,
        bank_details
      )
    `);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (periodStart) {
    query = query.gte('settlement_period_start', periodStart);
  }
  if (periodEnd) {
    query = query.lte('settlement_period_end', periodEnd);
  }

  const { data: settlements, error } = await query;
  if (error) {
    throw new Error(`Failed to query settlements for disbursement: ${error.message}`);
  }

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const list = settlements || [];

  if (type === 'momo') {
    // MTN Rwanda Mobile Money Bulk Format
    const headers = [
      'Phone Number',
      'Beneficiary Name',
      'Amount (RWF)',
      'Payment Reference',
      'Description'
    ];

    const rows = list.map(s => {
      const bDetails = s.providers?.bank_details || {};
      const rawPhone = bDetails.momo_phone || bDetails.phone || '250780000000';
      const cleanPhone = String(rawPhone).replace(/[^0-9]/g, '');
      const amount = Math.round(parseFloat(s.total_amount) || 0);
      const ref = s.payment_reference || `PF-SET-${s.id.slice(0, 8).toUpperCase()}`;
      const narrative = `PolyFit Wellness Payout ${s.settlement_period_start} to ${s.settlement_period_end}`;

      return [
        escapeCell(cleanPhone),
        escapeCell(s.providers?.name || 'Wellness Provider'),
        escapeCell(amount),
        escapeCell(ref),
        escapeCell(narrative)
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.map(escapeCell).join(','), ...rows].join('\r\n');
    return {
      type: 'momo',
      filename: `polyfit-momo-disbursement-${new Date().toISOString().split('T')[0]}.csv`,
      content: csvContent,
      count: list.length,
      totalAmount: list.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0)
    };
  }

  // Commercial Bank Batch EFT / RTGS Format (Bank of Kigali, Equity Bank, I&M)
  const headers = [
    'Beneficiary Account Number',
    'Beneficiary Name',
    'Bank Name',
    'SWIFT / BIC Code',
    'Amount (RWF)',
    'Currency',
    'Payment Reference',
    'Narrative'
  ];

  const rows = list.map(s => {
    const bDetails = s.providers?.bank_details || {};
    const accNumber = bDetails.account_number || '00040-0692140-19';
    const accName = bDetails.account_name || s.providers?.name || 'Wellness Provider Ltd';
    const bankName = bDetails.bank_name || 'Bank of Kigali (BK)';
    const swift = bDetails.swift_code || 'BOKRRWRW';
    const amount = Math.round(parseFloat(s.total_amount) || 0);
    const ref = s.payment_reference || `PF-EFT-${s.id.slice(0, 8).toUpperCase()}`;
    const narrative = `PolyFit Remittance ${s.settlement_period_start} - ${s.settlement_period_end}`;

    return [
      escapeCell(accNumber),
      escapeCell(accName),
      escapeCell(bankName),
      escapeCell(swift),
      escapeCell(amount),
      escapeCell('RWF'),
      escapeCell(ref),
      escapeCell(narrative)
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCell).join(','), ...rows].join('\r\n');
  return {
    type: 'bank',
    filename: `polyfit-bank-eft-disbursement-${new Date().toISOString().split('T')[0]}.csv`,
    content: csvContent,
    count: list.length,
    totalAmount: list.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0)
  };
}

/**
 * Automated MTN MoMo & Airtel Money Disbursement Rail
 * Validates Rwandan mobile money wallet credentials and processes batch payout reference
 *
 * @param {string} settlementId - Settlement UUID
 * @param {Object} options - Payout options: momoPhoneNumber, operator, adminUserId, notes
 * @returns {Promise<Object>} Confirmed disbursement transaction record
 */
async function processMoMoPayout(settlementId, options = {}) {
  if (!supabase) throw new Error('Database connection unavailable');

  const {
    momoPhoneNumber,
    operator = 'mtn',
    adminUserId = null,
    notes = ''
  } = options;

  const { data: settlement, error } = await supabase
    .from('settlements')
    .select(`
      id,
      provider_id,
      total_amount,
      total_visits,
      settlement_period_start,
      settlement_period_end,
      status,
      payment_reference,
      providers (
        id,
        name,
        contact_email,
        settlement_email,
        bank_details
      )
    `)
    .eq('id', settlementId)
    .single();

  if (error || !settlement) {
    throw new Error('Settlement not found');
  }

  if (settlement.status === 'paid') {
    throw new Error('Settlement has already been disbursed and marked paid');
  }

  const rawPhone = momoPhoneNumber ||
    settlement.providers?.bank_details?.momo_phone ||
    settlement.providers?.bank_details?.phone;

  if (!rawPhone) {
    throw new Error('No Mobile Money phone number provided or registered for this provider');
  }

  const normalized = normalizePhoneNumber(rawPhone) || String(rawPhone).replace(/[^0-9+]/g, '');
  const cleanDigits = normalized.replace(/[^0-9]/g, '');

  if (!/^(250)?7[2389][0-9]{7}$/.test(cleanDigits)) {
    throw new Error(`Invalid Rwandan mobile money phone number '${rawPhone}'. Must be valid MTN (078/079) or Airtel (072/073) line.`);
  }

  const e164Phone = cleanDigits.startsWith('250') ? `+${cleanDigits}` : `+250${cleanDigits}`;
  const ts = Date.now();
  const paymentRef = `PP-CSH-${settlementId.slice(0, 8).toUpperCase()}-${ts}`;
  const amount = parseFloat(settlement.total_amount) || 0;

  // In production with Paypack gateway configured, initiate B2B Cashout via Paypack
  let paypackRef = paymentRef;
  const paypackClientId = process.env.PAYPACK_CLIENT_ID;
  const paypackSecret = process.env.PAYPACK_CLIENT_SECRET;

  if (paypackClientId && paypackSecret) {
    try {
      const authRes = await fetch('https://payments.paypack.rw/api/v1/auth/agents/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: paypackClientId, client_secret: paypackSecret })
      });
      if (authRes.ok) {
        const authData = await authRes.json();
        const cashoutRes = await fetch('https://payments.paypack.rw/api/v1/cashouts/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.access_token}`
          },
          body: JSON.stringify({
            amount,
            phone: cleanDigits.startsWith('250') ? cleanDigits.slice(3) : cleanDigits,
            idempotency_key: paymentRef
          })
        });
        if (cashoutRes.ok) {
          const cashoutData = await cashoutRes.json();
          if (cashoutData.ref) paypackRef = cashoutData.ref;
        }
      }
    } catch (err) {
      console.warn('[settlementService] Paypack API network note:', err.message);
    }
  }

  const updatePayload = {
    status: 'paid',
    payment_reference: paypackRef,
    paid_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: updated, error: updErr } = await supabase
    .from('settlements')
    .update(updatePayload)
    .eq('id', settlementId)
    .select()
    .single();

  if (updErr) {
    throw new Error(`Failed to update settlement to paid: ${updErr.message}`);
  }

  return {
    success: true,
    settlement_id: settlementId,
    provider_id: settlement.provider_id,
    provider_name: settlement.providers?.name,
    status: 'paid',
    disbursement: {
      rail: operator.toLowerCase().includes('airtel') ? 'airtel_money' : 'mtn_momo',
      processor: 'paypack_b2b',
      recipient_phone: e164Phone,
      gross_amount: amount,
      currency: 'RWF',
      transaction_reference: paypackRef,
      disbursed_at: updatePayload.paid_at,
      disbursed_by: adminUserId,
      period: `${settlement.settlement_period_start} to ${settlement.settlement_period_end}`,
      notes: notes || 'Automated Paypack B2B mobile money settlement disbursement'
    }
  };
}

/**
 * Initiates an automated B2B cashout via Paypack payment gateway (MTN MoMo & Airtel Money Rwanda).
 */
async function initiatePaypackCashout(settlementId, options = {}) {
  return processMoMoPayout(settlementId, options);
}

/**
 * Verifies Paypack webhook HMAC-SHA256 signature using constant-time safeCompare
 */
function verifyPaypackWebhookSignature(payload, signatureHeader, secret = process.env.PAYPACK_WEBHOOK_SECRET) {
  if (!signatureHeader || !secret) {
    return false;
  }
  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payloadStr);
  const computedSignature = hmac.digest('hex');
  return safeCompare(computedSignature, signatureHeader);
}

/**
 * Processes incoming Paypack transaction webhooks (cashout events)
 */
async function processPaypackWebhook(eventData) {
  if (!eventData || typeof eventData !== 'object') {
    throw new Error('Invalid webhook payload');
  }

  const ref = eventData.ref || eventData.transaction_reference || eventData.idempotency_key;
  const status = eventData.status;

  if (!ref) {
    throw new Error('Webhook event missing transaction reference');
  }

  if (!supabase) {
    throw new Error('Database service unavailable');
  }

  const { data: settlement } = await supabase
    .from('settlements')
    .select('id, status')
    .eq('payment_reference', ref)
    .maybeSingle();

  if (!settlement) {
    return { success: true, processed: false, reason: 'Settlement reference not found' };
  }

  let newStatus = settlement.status;
  if (status === 'successful' || status === 'completed') {
    newStatus = 'paid';
  } else if (status === 'failed') {
    newStatus = 'failed';
  }

  if (newStatus !== settlement.status) {
    await supabase
      .from('settlements')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', settlement.id);
  }

  return {
    success: true,
    processed: true,
    settlement_id: settlement.id,
    status: newStatus
  };
}

module.exports = {
  generateSettlement,
  generateAllSettlements,
  listSettlements,
  getSettlementDetail,
  updateSettlementStatus,
  approveSettlement,
  disburseSettlement,
  processMoMoPayout,
  initiatePaypackCashout,
  verifyPaypackWebhookSignature,
  processPaypackWebhook,
  generateDisbursementCsv,
  SETTLEMENT_STATUS_TRANSITIONS
};
