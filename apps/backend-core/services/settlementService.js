const { supabase } = require('./supabaseService');

// ─── Settlement Status Transitions ────────────────────────────────────────────
const SETTLEMENT_STATUS_TRANSITIONS = {
  pending: ['processing'],
  processing: ['paid', 'failed'],
  failed: ['processing']  // Allow retry
};

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

  // ── Group visits by org and look up contract rates ──
  const visitsByOrg = {};
  for (const visit of visits) {
    if (!visitsByOrg[visit.org_id]) {
      visitsByOrg[visit.org_id] = [];
    }
    visitsByOrg[visit.org_id].push(visit);
  }

  const orgIds = Object.keys(visitsByOrg);

  // Get contract rates for each org
  const { data: contracts, error: contractError } = await supabase
    .from('provider_contracts')
    .select('org_id, per_visit_rate')
    .eq('provider_id', providerId)
    .in('org_id', orgIds)
    .eq('status', 'active');

  if (contractError) {
    throw new Error(`Failed to query contracts: ${contractError.message}`);
  }

  const rateByOrg = {};
  for (const contract of (contracts || [])) {
    rateByOrg[contract.org_id] = parseFloat(contract.per_visit_rate);
  }

  // Check for missing contracts
  const missingContracts = orgIds.filter(oid => rateByOrg[oid] === undefined);
  if (missingContracts.length > 0) {
    console.warn(`[settlementService] Skipping orgs without active contract for provider ${provider.name}: ${missingContracts.join(', ')}`);
  }

  // ── Calculate total settlement ──
  let totalVisits = 0;
  let totalAmount = 0;
  const visitBreakdown = [];

  for (const [orgId, orgVisits] of Object.entries(visitsByOrg)) {
    const rate = rateByOrg[orgId];
    if (rate === undefined) continue; // Skip orgs without contracts

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

  totalAmount = parseFloat(totalAmount.toFixed(2));

  if (totalVisits === 0) {
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
        created: false,
        message: 'Settlement already exists (concurrent generation detected)'
      };
    }
    throw new Error(`Failed to create settlement: ${settleError.message}`);
  }

  return {
    settlement,
    visitBreakdown,
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

  const results = [];
  let generated = 0;
  let skipped = 0;
  const errors = [];

  for (const provider of (providers || [])) {
    try {
      const result = await generateSettlement(provider.id, periodStart, periodEnd);
      results.push({ providerId: provider.id, providerName: provider.name, ...result });
      if (result.created) generated++;
      else skipped++;
    } catch (err) {
      // "No verified visits" is not an error — just means this provider had no traffic
      if (err.message.includes('No verified visits') || err.message.includes('No billable visits')) {
        skipped++;
      } else {
        errors.push({ providerId: provider.id, providerName: provider.name, error: err.message });
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

  return {
    settlements: data || [],
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

  return {
    ...settlement,
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

module.exports = {
  generateSettlement,
  generateAllSettlements,
  listSettlements,
  getSettlementDetail,
  updateSettlementStatus,
  SETTLEMENT_STATUS_TRANSITIONS
};
