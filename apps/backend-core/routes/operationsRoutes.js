const express = require('express');
const {
  getOperationsOverview,
  searchOperationsUniversal,
  getOperationsLocations,
  getOperationsClients,
  getOperationsClientDetail,
  createOperationsClient,
  updateOperationsClient,
  updateClientRosterEmployee,
  syncClientDomains,
  getOperationsProviders,
  getOperationsProviderDetail,
  createOperationsProvider,
  updateOperationsProvider,
  addOperationsProviderLocation,
  updateOperationsProviderLocation,
  updateOperationsProviderKyc,
  updateOperationsProviderPayoutMatrix,
  getOperationsVisits,
  getOperationsDisputes,
  executeTurnstileEmergencyBypass,
  adjudicateVisitDispute,
  getOperationsFinanceOverview,
  getOperationsFinanceInvoices,
  getOperationsFinanceSettlements,
  getOperationsFinanceLedger,
  runOperationsMonthlyBilling,
  runOperationsProviderReconciliation,
  approveOperationsSettlement,
  disburseOperationsSettlement,
  adjustOperationsInvoice,
  updateOperationsInvoiceStatus,
  exportOperationsDisbursementCsv,
  // PF-122 User 360 Support, Device Lock Reset, RBAC & Audit Trail Methods
  getOperationsSupportBeneficiaries,
  getOperationsSupportBeneficiaryDetail,
  resetOperationsDeviceLock,
  updateOperationsBeneficiaryStatus,
  updateOperationsBeneficiaryTier,
  getOperationsAuditLogs,
  getOperationsPlatformSettings,
  updateOperationsPlatformSetting,
  getOperationsTeamDirectory,
  assignOperationsTeamRole
} = require('../services/operationsService');

const router = express.Router();

/**
 * GET /api/operations/overview
 * Executive network dashboard overview:
 * Scaled counts, beneficiary engagement, today's visit velocity,
 * hourly 24h trend, and marketplace gross margin ticker.
 * SLA: < 200ms
 */
router.get('/overview', async (req, res) => {
  try {
    const overview = await getOperationsOverview();
    return res.status(200).json(overview);
  } catch (error) {
    console.error('[operationsRoutes] Overview error:', error.message);
    return res.status(500).json({
      error: error.message,
      code: 'OPERATIONS_OVERVIEW_FAILED'
    });
  }
});

/**
 * GET /api/operations/search?q={term}
 * Universal search Omnibar indexing across all aggregator domains:
 * Organizations, Providers, Facilities, Employees, Visits, Invoices.
 * SLA: < 200ms
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    const searchResults = await searchOperationsUniversal(q);
    return res.status(200).json({
      success: true,
      ...searchResults
    });
  } catch (error) {
    console.error('[operationsRoutes] Search error:', error.message);
    return res.status(500).json({
      error: error.message,
      code: 'OPERATIONS_SEARCH_FAILED'
    });
  }
});

/**
 * GET /api/operations/locations
 * Geolocation-indexed list of all contracted provider facilities
 * with latitude, longitude, category, address, and status.
 */
router.get('/locations', async (req, res) => {
  try {
    const locations = await getOperationsLocations();
    return res.status(200).json({
      success: true,
      count: locations.length,
      locations
    });
  } catch (error) {
    console.error('[operationsRoutes] Locations error:', error.message);
    return res.status(500).json({
      error: error.message,
      code: 'OPERATIONS_LOCATIONS_FAILED'
    });
  }
});

/**
 * GET /api/operations/clients
 * Corporate client directory with real-time seat utilization,
 * capacity warnings, and subsidy matrix stats.
 * SLA: < 150ms
 */
router.get('/clients', async (req, res) => {
  try {
    const clients = await getOperationsClients();
    return res.status(200).json({
      success: true,
      count: clients.length,
      clients
    });
  } catch (error) {
    console.error('[operationsRoutes] Clients list error:', error.message);
    return res.status(500).json({
      error: error.message,
      code: 'OPERATIONS_CLIENTS_FAILED'
    });
  }
});

/**
 * GET /api/operations/clients/:id
 * Complete 360-degree client cockpit detail for EmployerContractDrawer.
 */
router.get('/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const clientDetail = await getOperationsClientDetail(id);
    return res.status(200).json({
      success: true,
      ...clientDetail
    });
  } catch (error) {
    console.error('[operationsRoutes] Client detail error:', error.message);
    const status = error.message.includes('not found') ? 404 : 500;
    return res.status(status).json({
      error: error.message,
      code: 'OPERATIONS_CLIENT_DETAIL_FAILED'
    });
  }
});

/**
 * POST /api/operations/clients
 * 3-Step Streamlined Employer Account Provisioning.
 */
router.post('/clients', async (req, res) => {
  try {
    const created = await createOperationsClient(req.body);
    return res.status(201).json({
      success: true,
      message: 'Corporate client provisioned successfully',
      ...created
    });
  } catch (error) {
    console.error('[operationsRoutes] Client create error:', error.message);
    return res.status(400).json({
      error: error.message,
      code: 'OPERATIONS_CLIENT_CREATE_FAILED'
    });
  }
});

/**
 * PATCH /api/operations/clients/:id
 * Update corporate client identity, tax TIN, contracted seats, or status.
 */
router.patch('/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await updateOperationsClient(id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Corporate client updated successfully',
      organization: updated
    });
  } catch (error) {
    console.error('[operationsRoutes] Client update error:', error.message);
    return res.status(400).json({
      error: error.message,
      code: 'OPERATIONS_CLIENT_UPDATE_FAILED'
    });
  }
});

/**
 * PATCH /api/operations/clients/:id/employees/:employeeId
 * Super Admin 1-Click Census Roster Status Toggle or Tier Override.
 */
router.patch('/clients/:id/employees/:employeeId', async (req, res) => {
  try {
    const { id, employeeId } = req.params;
    const updated = await updateClientRosterEmployee(id, employeeId, req.body);
    return res.status(200).json({
      success: true,
      message: 'Employee roster record updated successfully',
      employee: updated
    });
  } catch (error) {
    console.error('[operationsRoutes] Employee update error:', error.message);
    return res.status(400).json({
      error: error.message,
      code: 'OPERATIONS_ROSTER_UPDATE_FAILED'
    });
  }
});

/**
 * PATCH /api/operations/clients/:id/domains
 * Whitelisted Domains Instant Sync.
 */
router.patch('/clients/:id/domains', async (req, res) => {
  try {
    const { id } = req.params;
    const { allowed_domains } = req.body;
    const updated = await syncClientDomains(id, allowed_domains);
    return res.status(200).json({
      success: true,
      message: 'Whitelisted domains updated successfully',
      organization: updated
    });
  } catch (error) {
    console.error('[operationsRoutes] Domains sync error:', error.message);
    return res.status(400).json({
      error: error.message,
      code: 'OPERATIONS_DOMAINS_SYNC_FAILED'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PF-119: SUPER ADMIN PROVIDER NETWORK OPERATIONS & PAYOUT MATRIX
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/operations/providers
 * Provider network directory with real-time location metrics,
 * today's check-in velocity, KYC badges, and fleet telemetry.
 * SLA: < 150ms
 */
router.get('/providers', async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const result = await getOperationsProviders({ status, category, search });
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[operationsRoutes] Providers list error:', error.message);
    return res.status(500).json({
      error: error.message,
      code: 'OPERATIONS_PROVIDERS_FAILED'
    });
  }
});

/**
 * GET /api/operations/providers/:id
 * Complete 360-degree provider cockpit detail for ProviderDossierDrawer.
 */
router.get('/providers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const providerDetail = await getOperationsProviderDetail(id);
    return res.status(200).json({
      success: true,
      ...providerDetail
    });
  } catch (error) {
    console.error('[operationsRoutes] Provider detail error:', error.message);
    const status = error.message.includes('not found') ? 404 : 500;
    return res.status(status).json({
      error: error.message,
      code: 'OPERATIONS_PROVIDER_DETAIL_FAILED'
    });
  }
});

/**
 * POST /api/operations/providers
 * 3-Step Streamlined Provider Account & Facility Provisioning.
 */
router.post('/providers', async (req, res) => {
  try {
    const created = await createOperationsProvider(req.body);
    return res.status(201).json({
      success: true,
      message: 'Wellness provider provisioned successfully into network',
      ...created
    });
  } catch (error) {
    console.error('[operationsRoutes] Provider create error:', error.message);
    return res.status(400).json({
      error: error.message,
      code: 'OPERATIONS_PROVIDER_CREATE_FAILED'
    });
  }
});

/**
 * PATCH /api/operations/providers/:id
 * Update provider profile identity, tax TIN, contact info, or operational status.
 */
router.patch('/providers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await updateOperationsProvider(id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Provider profile updated successfully',
      provider: updated
    });
  } catch (error) {
    console.error('[operationsRoutes] Provider update error:', error.message);
    return res.status(400).json({
      error: error.message,
      code: 'OPERATIONS_PROVIDER_UPDATE_FAILED'
    });
  }
});

/**
 * POST /api/operations/providers/:id/locations
 * Add a new branch/facility location to provider with GPS and amenities.
 */
router.post('/providers/:id/locations', async (req, res) => {
  try {
    const { id } = req.params;
    const location = await addOperationsProviderLocation(id, req.body);
    return res.status(201).json({
      success: true,
      message: 'Facility location added successfully to provider network',
      location
    });
  } catch (error) {
    console.error('[operationsRoutes] Location create error:', error.message);
    return res.status(400).json({
      error: error.message,
      code: 'OPERATIONS_LOCATION_CREATE_FAILED'
    });
  }
});

/**
 * PATCH /api/operations/providers/:id/locations/:locId
 * Update facility location (geofence radius slider 50m-500m, maintenance mode, operating hours, amenities).
 */
router.patch('/providers/:id/locations/:locId', async (req, res) => {
  try {
    const { id, locId } = req.params;
    const location = await updateOperationsProviderLocation(id, locId, req.body);
    return res.status(200).json({
      success: true,
      message: 'Facility location updated successfully',
      location
    });
  } catch (error) {
    console.error('[operationsRoutes] Location update error:', error.message);
    return res.status(400).json({
      error: error.message,
      code: 'OPERATIONS_LOCATION_UPDATE_FAILED'
    });
  }
});

/**
 * PATCH /api/operations/providers/:id/kyc
 * Super Admin 1-Click KYC Compliance Transition (Approve & Issue Contract, Request Revision, Reject).
 */
router.patch('/providers/:id/kyc', async (req, res) => {
  try {
    const { id } = req.params;
    const provider = await updateOperationsProviderKyc(id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Provider KYC compliance status updated successfully',
      provider
    });
  } catch (error) {
    console.error('[operationsRoutes] KYC update error:', error.message);
    return res.status(400).json({
      error: error.message,
      code: 'OPERATIONS_KYC_UPDATE_FAILED'
    });
  }
});

/**
 * PATCH /api/operations/providers/:id/payout-matrix
 * Super Admin: Negotiated Per-Visit Payout Matrix & Banking/MoMo Rails.
 */
router.patch('/providers/:id/payout-matrix', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await updateOperationsProviderPayoutMatrix(id, req.body);
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[operationsRoutes] Payout matrix update error:', error.message);
    return res.status(400).json({
      error: error.message,
      code: 'OPERATIONS_PAYOUT_MATRIX_UPDATE_FAILED'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PF-120: REAL-TIME VISIT TELEMETRY, ANOMALY ENGINE & DISPUTE CLEARINGHOUSE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/operations/visits
 * Real-time visit telemetry stream with anti-passback, velocity, and geofence anomaly evaluation.
 * SLA: < 150ms
 */
router.get('/visits', async (req, res) => {
  try {
    const result = await getOperationsVisits(req.query);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[operationsRoutes] Visits telemetry stream error:', error.message);
    return res.status(500).json({
      error: error.message,
      code: 'OPERATIONS_VISITS_STREAM_FAILED'
    });
  }
});

/**
 * GET /api/operations/visits/disputes
 * Central dispute clearinghouse queue for ops leads.
 */
router.get('/visits/disputes', async (req, res) => {
  try {
    const result = await getOperationsDisputes(req.query);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[operationsRoutes] Visits disputes queue error:', error.message);
    return res.status(500).json({
      error: error.message,
      code: 'OPERATIONS_DISPUTES_QUEUE_FAILED'
    });
  }
});

/**
 * POST /api/operations/visits/emergency-bypass
 * 1-Click Turnstile Emergency Bypass Tool for Front-Desk Escalations.
 * Generates verified visit & single-use EP-XXXXXX emergency code in < 5 seconds.
 */
router.post('/visits/emergency-bypass', async (req, res) => {
  try {
    const adminUserId = req.user?.id || null;
    const result = await executeTurnstileEmergencyBypass(req.body, adminUserId);
    return res.status(201).json(result);
  } catch (error) {
    console.error('[operationsRoutes] Emergency bypass error:', error.message);
    return res.status(400).json({
      error: error.message,
      code: 'OPERATIONS_EMERGENCY_BYPASS_FAILED'
    });
  }
});

/**
 * PATCH /api/operations/visits/:id/dispute/adjudicate
 * Dispute Adjudication Clearinghouse Action:
 * - force_validate: honors provider payout, marks visit verified
 * - void: refunds employee allowance, marks visit rejected
 * - split_resolution: goodwill override (PolyFit absorbs per-visit liability)
 */
router.patch('/visits/:id/dispute/adjudicate', async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user?.id || null;
    const result = await adjudicateVisitDispute(id, req.body, adminUserId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[operationsRoutes] Dispute adjudication error:', error.message);
    return res.status(400).json({
      error: error.message,
      code: 'OPERATIONS_DISPUTE_ADJUDICATION_FAILED'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PF-121: MARKETPLACE FINANCIAL CLEARINGHOUSE, INVOICING & MARGIN LEDGER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/operations/finance/overview
 * Executive financial margin ticker, GMV, COGS liability, and closing schedule.
 * SLA: < 150ms
 */
router.get('/finance/overview', async (req, res) => {
  try {
    const overview = await getOperationsFinanceOverview();
    return res.status(200).json(overview);
  } catch (error) {
    console.error('[operationsRoutes] Finance overview error:', error.message);
    return res.status(500).json({
      error: error.message,
      code: 'OPERATIONS_FINANCE_OVERVIEW_FAILED'
    });
  }
});

/**
 * GET /api/operations/finance/invoices
 * Paginated corporate invoices with search and RRA tax breakdown.
 */
router.get('/finance/invoices', async (req, res) => {
  try {
    const result = await getOperationsFinanceInvoices(req.query);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[operationsRoutes] Finance invoices error:', error.message);
    return res.status(500).json({
      error: error.message,
      code: 'OPERATIONS_FINANCE_INVOICES_FAILED'
    });
  }
});

/**
 * GET /api/operations/finance/settlements
 * Paginated provider settlements with dispute escrow hold indicators.
 */
router.get('/finance/settlements', async (req, res) => {
  try {
    const result = await getOperationsFinanceSettlements(req.query);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[operationsRoutes] Finance settlements error:', error.message);
    return res.status(500).json({
      error: error.message,
      code: 'OPERATIONS_FINANCE_SETTLEMENTS_FAILED'
    });
  }
});

/**
 * GET /api/operations/finance/ledger
 * Real-time Gross Margin Ledger sliced by Employer and Provider Category.
 */
router.get('/finance/ledger', async (req, res) => {
  try {
    const result = await getOperationsFinanceLedger(req.query);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[operationsRoutes] Finance ledger error:', error.message);
    return res.status(500).json({
      error: error.message,
      code: 'OPERATIONS_FINANCE_LEDGER_FAILED'
    });
  }
});

/**
 * GET /api/operations/finance/disbursements
 * Formatted CSV file export for MTN MoMo Bulk or Commercial Bank Batch EFT/RTGS.
 */
router.get('/finance/disbursements', async (req, res) => {
  try {
    const { type = 'momo', format = 'download' } = req.query;
    const result = await exportOperationsDisbursementCsv(type, req.query);

    if (format === 'json') {
      return res.status(200).json(result);
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.status(200).send(result.content);
  } catch (error) {
    console.error('[operationsRoutes] Finance disbursement export error:', error.message);
    return res.status(500).json({
      error: error.message,
      code: 'OPERATIONS_DISBURSEMENT_EXPORT_FAILED'
    });
  }
});

/**
 * POST /api/operations/finance/billing-run
 * 1-Click Monthly Billing Run for all active corporate employers.
 */
router.post('/finance/billing-run', async (req, res) => {
  try {
    const adminUserId = req.user?.id || null;
    const result = await runOperationsMonthlyBilling(req.body, adminUserId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[operationsRoutes] Monthly billing run error:', error.message);
    return res.status(400).json({
      error: error.message,
      code: 'OPERATIONS_BILLING_RUN_FAILED'
    });
  }
});

/**
 * POST /api/operations/finance/settlement-run
 * 1-Click Monthly Provider Settlement Reconciliation with Dispute Escrow Holds.
 */
router.post('/finance/settlement-run', async (req, res) => {
  try {
    const adminUserId = req.user?.id || null;
    const result = await runOperationsProviderReconciliation(req.body, adminUserId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[operationsRoutes] Settlement reconciliation run error:', error.message);
    return res.status(400).json({
      error: error.message,
      code: 'OPERATIONS_SETTLEMENT_RUN_FAILED'
    });
  }
});

/**
 * POST /api/operations/finance/settlements/:id/approve
 * Approves a settlement for payout.
 */
router.post('/finance/settlements/:id/approve', async (req, res) => {
  try {
    const adminUserId = req.user?.id || null;
    const result = await approveOperationsSettlement(req.params.id, adminUserId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[operationsRoutes] Approve settlement error:', error.message);
    return res.status(400).json({
      error: error.message,
      code: 'OPERATIONS_SETTLEMENT_APPROVE_FAILED'
    });
  }
});

/**
 * POST /api/operations/finance/settlements/:id/disburse
 * Disburses settlement with payment reference.
 */
router.post('/finance/settlements/:id/disburse', async (req, res) => {
  try {
    const adminUserId = req.user?.id || null;
    const result = await disburseOperationsSettlement(req.params.id, req.body, adminUserId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[operationsRoutes] Disburse settlement error:', error.message);
    return res.status(400).json({
      error: error.message,
      code: 'OPERATIONS_SETTLEMENT_DISBURSE_FAILED'
    });
  }
});

/**
 * POST /api/operations/finance/invoices/:id/adjustment
 * Issues credit note or debit adjustment on an invoice.
 */
router.post('/finance/invoices/:id/adjustment', async (req, res) => {
  try {
    const adminUserId = req.user?.id || null;
    const result = await adjustOperationsInvoice(req.params.id, req.body, adminUserId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[operationsRoutes] Adjust invoice error:', error.message);
    return res.status(400).json({
      error: error.message,
      code: 'OPERATIONS_INVOICE_ADJUSTMENT_FAILED'
    });
  }
});

/**
 * PATCH /api/operations/finance/invoices/:id/status
 * Updates invoice status (e.g. issued, paid, void).
 */
router.patch('/finance/invoices/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    const adminUserId = req.user?.id || null;
    const result = await updateOperationsInvoiceStatus(req.params.id, status, adminUserId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[operationsRoutes] Update invoice status error:', error.message);
    return res.status(400).json({
      error: error.message,
      code: 'OPERATIONS_INVOICE_STATUS_UPDATE_FAILED'
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PF-122: Super Admin: User 360 Support, Device Lock Reset, RBAC & Audit Trail
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/operations/support/beneficiaries
 * Master Beneficiary Directory with sub-200ms query resolution.
 */
router.get('/support/beneficiaries', async (req, res) => {
  try {
    const { q, status, tier, orgId, page, limit } = req.query;
    const result = await getOperationsSupportBeneficiaries({ q, status, tier, orgId, page, limit });
    return res.status(200).json(result);
  } catch (error) {
    console.error('[operationsRoutes] Beneficiaries directory error:', error.message);
    return res.status(500).json({
      error: error.message,
      code: 'OPERATIONS_BENEFICIARIES_FETCH_FAILED'
    });
  }
});

/**
 * GET /api/operations/support/beneficiaries/:id
 * Full User 360 Support Cockpit Detail: Quota, Device Binding, Live TOTP & Diagnostics.
 */
router.get('/support/beneficiaries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getOperationsSupportBeneficiaryDetail(id);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[operationsRoutes] Beneficiary 360 error:', error.message);
    const status = error.message.includes('not found') ? 404 : 500;
    return res.status(status).json({
      error: error.message,
      code: 'OPERATIONS_BENEFICIARY_DETAIL_FAILED'
    });
  }
});

/**
 * POST /api/operations/support/beneficiaries/:id/device-reset
 * 1-Click Hardware Unbinding with 30-day rate-limiting guardrail & manager override.
 */
router.post('/support/beneficiaries/:id/device-reset', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, isManagerOverride } = req.body || {};
    const adminUser = req.user || { id: null, role: 'super_admin', name: 'Ops Super Admin' };
    const result = await resetOperationsDeviceLock(id, { reason, isManagerOverride }, adminUser);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[operationsRoutes] Device reset error:', error.message);
    const statusCode = error.statusCode || (error.code === 'DEVICE_RESET_LIMIT_EXCEEDED' ? 400 : 500);
    return res.status(statusCode).json({
      error: error.message,
      code: error.code || 'OPERATIONS_DEVICE_RESET_FAILED'
    });
  }
});

/**
 * PATCH /api/operations/support/beneficiaries/:id/status
 * 1-Click Employee Status Override with immutable audit logging.
 */
router.patch('/support/beneficiaries/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body || {};
    if (!status) {
      return res.status(400).json({ error: 'Status is required', code: 'STATUS_REQUIRED' });
    }
    const adminUser = req.user || { id: null, role: 'super_admin', name: 'Ops Super Admin' };
    const result = await updateOperationsBeneficiaryStatus(id, { status, reason }, adminUser);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[operationsRoutes] Beneficiary status update error:', error.message);
    return res.status(400).json({
      error: error.message,
      code: 'OPERATIONS_BENEFICIARY_STATUS_FAILED'
    });
  }
});

/**
 * PATCH /api/operations/support/beneficiaries/:id/tier
 * 1-Click Employee Benefit Tier Override with immutable audit logging.
 */
router.patch('/support/beneficiaries/:id/tier', async (req, res) => {
  try {
    const { id } = req.params;
    const { tier, reason } = req.body || {};
    if (!tier) {
      return res.status(400).json({ error: 'Tier is required', code: 'TIER_REQUIRED' });
    }
    const adminUser = req.user || { id: null, role: 'super_admin', name: 'Ops Super Admin' };
    const result = await updateOperationsBeneficiaryTier(id, { tier, reason }, adminUser);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[operationsRoutes] Beneficiary tier update error:', error.message);
    return res.status(400).json({
      error: error.message,
      code: 'OPERATIONS_BENEFICIARY_TIER_FAILED'
    });
  }
});

/**
 * GET /api/operations/audit-logs
 * Immutable system audit trail search & filter.
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const { eventType, search, limit, page } = req.query;
    const result = await getOperationsAuditLogs({ eventType, search, limit, page });
    return res.status(200).json(result);
  } catch (error) {
    console.error('[operationsRoutes] Audit logs error:', error.message);
    return res.status(500).json({
      error: error.message,
      code: 'OPERATIONS_AUDIT_LOGS_FAILED'
    });
  }
});

/**
 * GET /api/operations/settings
 * Retrieves active dynamic platform settings knobs.
 */
router.get('/settings', async (req, res) => {
  try {
    const result = await getOperationsPlatformSettings();
    return res.status(200).json(result);
  } catch (error) {
    console.error('[operationsRoutes] Platform settings fetch error:', error.message);
    return res.status(500).json({
      error: error.message,
      code: 'OPERATIONS_SETTINGS_FETCH_FAILED'
    });
  }
});

/**
 * PATCH /api/operations/settings
 * Updates a dynamic platform knob in real time with validation & audit logging.
 */
router.patch('/settings', async (req, res) => {
  try {
    const { key, value } = req.body || {};
    if (!key || value === undefined) {
      return res.status(400).json({
        error: 'Key and numeric value are required',
        code: 'SETTING_PARAMS_REQUIRED'
      });
    }
    const adminUser = req.user || { id: null, role: 'super_admin', name: 'Ops Super Admin' };
    const result = await updateOperationsPlatformSetting(key, value, adminUser);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[operationsRoutes] Platform setting update error:', error.message);
    return res.status(400).json({
      error: error.message,
      code: 'OPERATIONS_SETTING_UPDATE_FAILED'
    });
  }
});

/**
 * GET /api/operations/team
 * Internal PolyFit team directory and RBAC permissions matrix.
 */
router.get('/team', async (req, res) => {
  try {
    const result = await getOperationsTeamDirectory();
    return res.status(200).json(result);
  } catch (error) {
    console.error('[operationsRoutes] Team directory error:', error.message);
    return res.status(500).json({
      error: error.message,
      code: 'OPERATIONS_TEAM_FETCH_FAILED'
    });
  }
});

/**
 * POST /api/operations/team/roles
 * Assigns or updates internal operator role with audit record.
 */
router.post('/team/roles', async (req, res) => {
  try {
    const { userId, email, role, operatorName } = req.body || {};
    if (!role) {
      return res.status(400).json({ error: 'Role is required', code: 'ROLE_REQUIRED' });
    }
    const adminUser = req.user || { id: null, role: 'super_admin', name: 'Ops Super Admin' };
    const result = await assignOperationsTeamRole({ userId, email, role, operatorName }, adminUser);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[operationsRoutes] Team role assign error:', error.message);
    return res.status(400).json({
      error: error.message,
      code: 'OPERATIONS_ROLE_ASSIGN_FAILED'
    });
  }
});

module.exports = router;


