const express = require('express');
const {
  getOperationsOverview,
  searchOperationsUniversal,
  getOperationsLocations
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

module.exports = router;
