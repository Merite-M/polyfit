const { supabase } = require('./supabaseService');

// ─── Constants ────────────────────────────────────────────────────────────────
const VAT_RATE = 0.18; // 18% Rwanda VAT
const DEFAULT_DUE_DATE_DAYS = 30; // Net-30 payment terms
const INVOICE_NUMBER_PREFIX = 'PF-INV';

// ─── Invoice Number Generator ─────────────────────────────────────────────────
/**
 * Generates a unique, human-readable invoice number.
 * Format: PF-INV-YYYY-MM-XXXX (e.g. PF-INV-2026-09-0001)
 */
async function generateInvoiceNumber(billingPeriodEnd) {
  const date = new Date(billingPeriodEnd);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `${INVOICE_NUMBER_PREFIX}-${year}-${month}`;

  // Count existing invoices for this month to generate sequence
  const { count, error } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .like('invoice_number', `${prefix}%`);

  if (error) {
    console.error('[billingService] Failed to count invoices for numbering:', error.message);
  }

  const sequence = String((count || 0) + 1).padStart(4, '0');
  return `${prefix}-${sequence}`;
}

// ─── Generate Invoice ─────────────────────────────────────────────────────────
/**
 * Generates an invoice for a specific organization and billing period.
 * Idempotent: returns existing invoice if one already exists for the period.
 *
 * @param {string} orgId - Organization UUID
 * @param {string} periodStart - Billing period start date (YYYY-MM-DD)
 * @param {string} periodEnd - Billing period end date (YYYY-MM-DD)
 * @returns {{ invoice: object, lineItems: object[], created: boolean }}
 */
async function generateInvoice(orgId, periodStart, periodEnd) {
  if (!supabase) throw new Error('Database connection unavailable');

  // ── Idempotency check: return existing invoice if already generated ──
  const { data: existing } = await supabase
    .from('invoices')
    .select('*, invoice_line_items(*)')
    .eq('org_id', orgId)
    .eq('billing_period_start', periodStart)
    .eq('billing_period_end', periodEnd)
    .maybeSingle();

  if (existing) {
    return {
      invoice: existing,
      lineItems: existing.invoice_line_items || [],
      created: false,
      message: 'Invoice already exists for this billing period'
    };
  }

  // ── Verify organization exists ──
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, status')
    .eq('id', orgId)
    .single();

  if (orgError || !org) {
    throw new Error(`Organization not found: ${orgId}`);
  }

  if (org.status !== 'active') {
    throw new Error(`Organization ${org.name} is not active (status: ${org.status})`);
  }

  // ── Get all verified visits for this org in the billing period ──
  const { data: visits, error: visitError } = await supabase
    .from('visits')
    .select(`
      id,
      provider_location_id,
      check_in_at,
      provider_locations!inner (
        id,
        provider_id,
        name,
        providers!inner (
          id,
          name
        )
      )
    `)
    .eq('org_id', orgId)
    .eq('status', 'verified')
    .gte('check_in_at', `${periodStart}T00:00:00Z`)
    .lte('check_in_at', `${periodEnd}T23:59:59Z`);

  if (visitError) {
    throw new Error(`Failed to query visits: ${visitError.message}`);
  }

  if (!visits || visits.length === 0) {
    throw new Error(`No verified visits found for organization ${org.name} in period ${periodStart} to ${periodEnd}`);
  }

  // ── Group visits by provider ──
  const visitsByProvider = {};
  for (const visit of visits) {
    const providerId = visit.provider_locations.provider_id;
    const providerName = visit.provider_locations.providers.name;
    if (!visitsByProvider[providerId]) {
      visitsByProvider[providerId] = {
        providerId,
        providerName,
        visits: []
      };
    }
    visitsByProvider[providerId].visits.push(visit);
  }

  // ── Look up contract rates for each provider ──
  const providerIds = Object.keys(visitsByProvider);
  const { data: contracts, error: contractError } = await supabase
    .from('provider_contracts')
    .select('provider_id, per_visit_rate')
    .eq('org_id', orgId)
    .in('provider_id', providerIds)
    .eq('status', 'active');

  if (contractError) {
    throw new Error(`Failed to query provider contracts: ${contractError.message}`);
  }

  // Build rate lookup map
  const rateByProvider = {};
  for (const contract of (contracts || [])) {
    rateByProvider[contract.provider_id] = parseFloat(contract.per_visit_rate);
  }

  // Verify all providers have active contracts
  const missingContracts = providerIds.filter(pid => rateByProvider[pid] === undefined);
  if (missingContracts.length > 0) {
    const names = missingContracts.map(pid => visitsByProvider[pid].providerName).join(', ');
    throw new Error(`No active contract found for providers: ${names}. Cannot generate invoice.`);
  }

  // ── Calculate line items ──
  const lineItems = [];
  let totalVisits = 0;
  let subtotalBeforeTax = 0;

  for (const [providerId, group] of Object.entries(visitsByProvider)) {
    const visitCount = group.visits.length;
    const rate = rateByProvider[providerId];
    const subtotal = parseFloat((visitCount * rate).toFixed(2));

    lineItems.push({
      provider_id: providerId,
      visit_count: visitCount,
      per_visit_rate: rate,
      subtotal
    });

    totalVisits += visitCount;
    subtotalBeforeTax += subtotal;
  }

  // ── Calculate tax and total ──
  const taxAmount = parseFloat((subtotalBeforeTax * VAT_RATE).toFixed(2));
  const totalAmount = parseFloat((subtotalBeforeTax + taxAmount).toFixed(2));

  // ── Generate invoice number ──
  const invoiceNumber = await generateInvoiceNumber(periodEnd);

  // ── Calculate due date ──
  const dueDate = new Date(periodEnd);
  dueDate.setDate(dueDate.getDate() + DEFAULT_DUE_DATE_DAYS);
  const dueDateStr = dueDate.toISOString().split('T')[0];

  // ── Insert invoice ──
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      org_id: orgId,
      invoice_number: invoiceNumber,
      billing_period_start: periodStart,
      billing_period_end: periodEnd,
      total_visits: totalVisits,
      total_amount: totalAmount,
      tax_amount: taxAmount,
      status: 'draft',
      due_date: dueDateStr
    })
    .select()
    .single();

  if (invoiceError) {
    // Handle unique constraint violation (race condition idempotency)
    if (invoiceError.code === '23505') {
      const { data: raceInvoice } = await supabase
        .from('invoices')
        .select('*, invoice_line_items(*)')
        .eq('org_id', orgId)
        .eq('billing_period_start', periodStart)
        .eq('billing_period_end', periodEnd)
        .single();
      return {
        invoice: raceInvoice,
        lineItems: raceInvoice?.invoice_line_items || [],
        created: false,
        message: 'Invoice already exists (concurrent generation detected)'
      };
    }
    throw new Error(`Failed to create invoice: ${invoiceError.message}`);
  }

  // ── Insert line items ──
  const lineItemRecords = lineItems.map(li => ({
    ...li,
    invoice_id: invoice.id
  }));

  const { data: insertedLineItems, error: lineItemError } = await supabase
    .from('invoice_line_items')
    .insert(lineItemRecords)
    .select();

  if (lineItemError) {
    console.error('[billingService] Failed to insert line items:', lineItemError.message);
    // Clean up the invoice if line items fail
    await supabase.from('invoices').delete().eq('id', invoice.id);
    throw new Error(`Failed to create invoice line items: ${lineItemError.message}`);
  }

  return {
    invoice,
    lineItems: insertedLineItems,
    created: true
  };
}

// ─── List Invoices ────────────────────────────────────────────────────────────
/**
 * Lists invoices with optional filtering and pagination.
 *
 * @param {object} params
 * @param {string} [params.orgId] - Filter by organization
 * @param {string} [params.status] - Filter by status
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @returns {{ invoices: object[], total: number, page: number, limit: number }}
 */
async function listInvoices({ orgId, status, page = 1, limit = 20 } = {}) {
  if (!supabase) throw new Error('Database connection unavailable');

  let query = supabase
    .from('invoices')
    .select(`
      *,
      organizations!inner ( id, name )
    `, { count: 'exact' });

  if (orgId) query = query.eq('org_id', orgId);
  if (status) query = query.eq('status', status);

  const offset = (page - 1) * limit;
  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) throw new Error(`Failed to list invoices: ${error.message}`);

  return {
    invoices: data || [],
    total: count || 0,
    page,
    limit
  };
}

// ─── Get Invoice Detail ───────────────────────────────────────────────────────
/**
 * Retrieves full invoice detail including line items with provider names.
 *
 * @param {string} invoiceId
 * @returns {object} Invoice with line items
 */
async function getInvoiceDetail(invoiceId) {
  if (!supabase) throw new Error('Database connection unavailable');

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      organizations!inner ( id, name, billing_email, tax_id, country ),
      invoice_line_items (
        *,
        providers!inner ( id, name )
      )
    `)
    .eq('id', invoiceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') throw new Error('Invoice not found');
    throw new Error(`Failed to get invoice: ${error.message}`);
  }

  return data;
}

// ─── Update Invoice Status ────────────────────────────────────────────────────
/**
 * Updates invoice status with state machine validation.
 *
 * Valid transitions:
 *   draft → sent
 *   sent  → paid | overdue | disputed
 *   overdue → paid | disputed
 *   disputed → sent | paid
 *
 * @param {string} invoiceId
 * @param {string} newStatus
 * @returns {object} Updated invoice
 */
const INVOICE_STATUS_TRANSITIONS = {
  draft: ['sent'],
  sent: ['paid', 'overdue', 'disputed'],
  overdue: ['paid', 'disputed'],
  disputed: ['sent', 'paid']
};

async function updateInvoiceStatus(invoiceId, newStatus) {
  if (!supabase) throw new Error('Database connection unavailable');

  // Fetch current invoice
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('id, status')
    .eq('id', invoiceId)
    .single();

  if (fetchError || !invoice) {
    throw new Error('Invoice not found');
  }

  const currentStatus = invoice.status;
  const allowedTransitions = INVOICE_STATUS_TRANSITIONS[currentStatus];

  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    throw new Error(
      `Invalid status transition: ${currentStatus} → ${newStatus}. Allowed: ${(allowedTransitions || []).join(', ')}`
    );
  }

  const updatePayload = {
    status: newStatus,
    updated_at: new Date().toISOString()
  };

  // Set paid_at timestamp when marking as paid
  if (newStatus === 'paid') {
    updatePayload.paid_at = new Date().toISOString();
  }

  const { data: updated, error: updateError } = await supabase
    .from('invoices')
    .update(updatePayload)
    .eq('id', invoiceId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update invoice status: ${updateError.message}`);
  }

  return updated;
}

// ─── Mark Overdue Invoices ────────────────────────────────────────────────────
/**
 * Finds all invoices that are past due and marks them as overdue.
 * Called by the cron trigger endpoint.
 *
 * @returns {{ markedOverdue: number, invoices: object[] }}
 */
async function markOverdueInvoices() {
  if (!supabase) throw new Error('Database connection unavailable');

  const today = new Date().toISOString().split('T')[0];

  // Find sent invoices past their due date
  const { data: overdueInvoices, error: queryError } = await supabase
    .from('invoices')
    .select('id, invoice_number, org_id, due_date, total_amount')
    .eq('status', 'sent')
    .lt('due_date', today);

  if (queryError) {
    throw new Error(`Failed to query overdue invoices: ${queryError.message}`);
  }

  if (!overdueInvoices || overdueInvoices.length === 0) {
    return { markedOverdue: 0, invoices: [] };
  }

  const overdueIds = overdueInvoices.map(inv => inv.id);

  const { error: updateError } = await supabase
    .from('invoices')
    .update({ status: 'overdue', updated_at: new Date().toISOString() })
    .in('id', overdueIds);

  if (updateError) {
    throw new Error(`Failed to mark invoices as overdue: ${updateError.message}`);
  }

  return {
    markedOverdue: overdueInvoices.length,
    invoices: overdueInvoices
  };
}

// ─── Generate All Invoices (Batch Cron) ───────────────────────────────────────
/**
 * Generates invoices for ALL active organizations for the given billing period.
 * Designed to be called by monthly cron trigger.
 *
 * @param {string} periodStart
 * @param {string} periodEnd
 * @returns {{ generated: number, skipped: number, errors: object[], results: object[] }}
 */
async function generateAllInvoices(periodStart, periodEnd) {
  if (!supabase) throw new Error('Database connection unavailable');

  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('status', 'active');

  if (orgError) throw new Error(`Failed to list organizations: ${orgError.message}`);

  const results = [];
  let generated = 0;
  let skipped = 0;
  const errors = [];

  for (const org of (orgs || [])) {
    try {
      const result = await generateInvoice(org.id, periodStart, periodEnd);
      results.push({ orgId: org.id, orgName: org.name, ...result });
      if (result.created) generated++;
      else skipped++;
    } catch (err) {
      errors.push({ orgId: org.id, orgName: org.name, error: err.message });
    }
  }

  return { generated, skipped, errors, results };
}

// ─── Get Invoice Audit Trail ──────────────────────────────────────────────────
/**
 * Retrieves full audit trail for an invoice, including line items and granular
 * per-employee verified visits during the invoice billing period.
 *
 * @param {string} invoiceId
 * @returns {object} Invoice with line items and itemized employee visits
 */
async function getInvoiceAuditTrail(invoiceId) {
  if (!supabase) throw new Error('Database connection unavailable');

  const invoice = await getInvoiceDetail(invoiceId);

  // Fetch granular verified visits within the billing period for this organization
  const { data: visits, error: visitError } = await supabase
    .from('visits')
    .select(`
      id,
      check_in_at,
      check_out_at,
      verification_method,
      status,
      employee_id,
      provider_location_id,
      employees (
        id,
        full_name,
        email,
        department
      ),
      provider_locations (
        id,
        name,
        provider_id,
        providers (
          id,
          name,
          category
        )
      )
    `)
    .eq('org_id', invoice.org_id)
    .eq('status', 'verified')
    .gte('check_in_at', `${invoice.billing_period_start}T00:00:00Z`)
    .lte('check_in_at', `${invoice.billing_period_end}T23:59:59Z`)
    .order('check_in_at', { ascending: false });

  if (visitError) {
    console.error('[billingService] Failed to query invoice visit audit trail:', visitError.message);
  }

  // Format flattened visit records for easy tabular and audit consumption
  const formattedVisits = (visits || []).map(v => ({
    id: v.id,
    check_in_at: v.check_in_at,
    check_out_at: v.check_out_at,
    verification_method: v.verification_method,
    status: v.status,
    employee_id: v.employee_id,
    employee_name: v.employees?.full_name || 'Corporate Beneficiary',
    employee_email: v.employees?.email || '',
    department: v.employees?.department || 'General',
    location_id: v.provider_location_id,
    location_name: v.provider_locations?.name || 'Main Facility',
    provider_id: v.provider_locations?.providers?.id,
    provider_name: v.provider_locations?.providers?.name || 'Wellness Provider',
    provider_category: v.provider_locations?.providers?.category || 'wellness'
  }));

  return {
    invoice,
    visits: formattedVisits,
    total_audit_visits: formattedVisits.length
  };
}

// ─── Get Billing Summary ──────────────────────────────────────────────────────
/**
 * Calculates corporate billing summary, YTD spend, verified visits, average cost,
 * overdue balance alert, and monthly trendline for an organization.
 *
 * @param {string} orgId
 * @param {number|string} [year]
 * @returns {object} Billing summary metrics
 */
async function getBillingSummary(orgId, year = new Date().getFullYear()) {
  if (!supabase) throw new Error('Database connection unavailable');

  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      billing_period_start,
      billing_period_end,
      total_visits,
      total_amount,
      tax_amount,
      status,
      due_date,
      paid_at,
      created_at
    `)
    .eq('org_id', orgId)
    .gte('billing_period_start', startDate)
    .lte('billing_period_start', endDate)
    .order('billing_period_start', { ascending: true });

  if (error) {
    throw new Error(`Failed to get billing summary: ${error.message}`);
  }

  const invoiceList = invoices || [];

  let ytdTotalSpent = 0;
  let ytdTotalVisits = 0;
  let currentBalance = 0;
  let overdueAmount = 0;
  let overdueCount = 0;

  const monthlyTrendMap = {};

  for (const inv of invoiceList) {
    const amount = parseFloat(inv.total_amount) || 0;
    const visits = parseInt(inv.total_visits, 10) || 0;

    ytdTotalSpent += amount;
    ytdTotalVisits += visits;

    if (inv.status === 'sent' || inv.status === 'overdue') {
      currentBalance += amount;
    }

    if (inv.status === 'overdue') {
      overdueCount++;
      overdueAmount += amount;
    }

    const monthKey = (inv.billing_period_start || '').substring(0, 7);
    if (monthKey) {
      monthlyTrendMap[monthKey] = {
        month: monthKey,
        amount,
        visits,
        status: inv.status,
        invoice_number: inv.invoice_number
      };
    }
  }

  const avgCostPerVisit = ytdTotalVisits > 0 ? parseFloat((ytdTotalSpent / ytdTotalVisits).toFixed(2)) : 0;
  const citTaxShieldRwf = parseFloat((ytdTotalSpent * 0.30).toFixed(2)); // Rwanda 30% CIT wellness deduction

  return {
    year: parseInt(year, 10),
    ytd_total_spent: ytdTotalSpent,
    ytd_total_visits: ytdTotalVisits,
    average_cost_per_visit: avgCostPerVisit,
    current_balance: currentBalance,
    overdue_amount: overdueAmount,
    overdue_count: overdueCount,
    has_overdue: overdueCount > 0,
    cit_tax_shield_rwf: citTaxShieldRwf,
    invoices_count: invoiceList.length,
    monthly_trends: Object.values(monthlyTrendMap)
  };
}

// ─── Dispute Invoice ──────────────────────────────────────────────────────────
/**
 * Records a formal dispute on an invoice with reason and notes.
 *
 * @param {string} invoiceId
 * @param {object} payload
 * @param {string} payload.reason
 * @param {string} [payload.notes]
 * @returns {object} Updated invoice
 */
async function disputeInvoice(invoiceId, { reason, notes } = {}) {
  if (!supabase) throw new Error('Database connection unavailable');

  if (!reason || !reason.trim()) {
    throw new Error('Dispute reason is required');
  }

  // Fetch current invoice
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('id, status, org_id')
    .eq('id', invoiceId)
    .single();

  if (fetchError || !invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.status !== 'sent' && invoice.status !== 'overdue') {
    throw new Error(`Cannot dispute invoice with status "${invoice.status}". Invoices can only be disputed when sent or overdue.`);
  }

  const now = new Date().toISOString();
  const updatePayload = {
    status: 'disputed',
    dispute_reason: reason.trim(),
    dispute_notes: notes ? notes.trim() : null,
    disputed_at: now,
    updated_at: now
  };

  const { data: updated, error: updateError } = await supabase
    .from('invoices')
    .update(updatePayload)
    .eq('id', invoiceId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to record invoice dispute: ${updateError.message}`);
  }

  return updated;
}

// ─── Export Invoice Audit CSV ─────────────────────────────────────────────────
/**
 * Exports invoice verified visits audit trail as standard RFC 4180 CSV string.
 *
 * @param {string} invoiceId
 * @returns {Promise<string>} CSV string
 */
async function exportInvoiceAuditCsv(invoiceId) {
  const audit = await getInvoiceAuditTrail(invoiceId);
  const headers = [
    'Visit ID',
    'Date',
    'Time',
    'Employee ID',
    'Employee Name',
    'Work Email',
    'Department',
    'Provider Name',
    'Category',
    'Facility Location',
    'Verification Method',
    'Status'
  ];

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = audit.visits.map(v => {
    const dateObj = new Date(v.check_in_at);
    const dateStr = isNaN(dateObj.getTime()) ? '' : dateObj.toISOString().split('T')[0];
    const timeStr = isNaN(dateObj.getTime()) ? '' : dateObj.toISOString().split('T')[1].substring(0, 5);

    return [
      escapeCell(v.id),
      escapeCell(dateStr),
      escapeCell(timeStr),
      escapeCell(v.employee_id),
      escapeCell(v.employee_name),
      escapeCell(v.employee_email),
      escapeCell(v.department),
      escapeCell(v.provider_name),
      escapeCell(v.provider_category),
      escapeCell(v.location_name),
      escapeCell(v.verification_method),
      escapeCell(v.status)
    ].join(',');
  });

  return [headers.map(escapeCell).join(','), ...rows].join('\r\n');
}

module.exports = {
  generateInvoice,
  listInvoices,
  getInvoiceDetail,
  getInvoiceAuditTrail,
  getBillingSummary,
  disputeInvoice,
  exportInvoiceAuditCsv,
  updateInvoiceStatus,
  markOverdueInvoices,
  generateAllInvoices,
  VAT_RATE,
  INVOICE_STATUS_TRANSITIONS
};
