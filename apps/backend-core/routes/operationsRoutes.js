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
  updateOperationsProviderPayoutMatrix
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

module.exports = router;

