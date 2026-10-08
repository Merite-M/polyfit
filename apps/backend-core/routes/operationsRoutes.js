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
  syncClientDomains
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

module.exports = router;

