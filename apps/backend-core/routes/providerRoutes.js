const express = require('express');
const { requireAuth, requireRole, requireProviderAccess } = require('../middleware/authMiddleware');
const {
  registerProvider,
  listProviders,
  getProviderById,
  updateProvider,
  approveProvider,
  rejectProvider,
  addLocation,
  listLocations,
  getLocationById,
  updateLocation,
  deactivateLocation,
  discoverProviders,
  getMarketingAssets
} = require('../services/providerService');

const router = express.Router();

/**
 * GET /api/providers/discover
 * Public & Beneficiary provider discovery endpoint.
 * Geolocation-sorted search with category, amenities, city, and radius filters.
 * Target SLA: < 500ms.
 * Note: Placed BEFORE /:id route to prevent collision.
 */
router.get('/discover', async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius_km,
      category,
      city,
      amenities,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const result = await discoverProviders({
      lat,
      lng,
      radius_km,
      category,
      city,
      amenities,
      search,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message,
      code: error.code || 'DISCOVERY_FAILED'
    });
  }
});

/**
 * POST /api/providers
 * Register a new wellness provider application.
 * Default status: 'pending_review'.
 * Accessible publicly for inbound provider onboarding.
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      category,
      contact_email,
      settlement_email,
      tax_id,
      bank_details,
      pricing_expectations,
      onboarding_details,
      services_provided,
      locations,
      status
    } = req.body;

    // Merge services_provided into onboarding_details if provided separately
    const mergedOnboardingDetails = {
      ...(onboarding_details || {}),
      ...(services_provided ? { services_provided } : {})
    };

    const provider = await registerProvider({
      name,
      category,
      contact_email,
      settlement_email,
      tax_id,
      bank_details,
      pricing_expectations,
      onboarding_details: Object.keys(mergedOnboardingDetails).length > 0 ? mergedOnboardingDetails : null,
      locations: Array.isArray(locations) ? locations : [],
      status: status || 'pending_review'
    });

    return res.status(201).json({
      success: true,
      message: 'Provider registration submitted successfully. Application is pending review.',
      provider
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message,
      code: error.code || 'PROVIDER_REGISTRATION_FAILED'
    });
  }
});

/**
 * GET /api/providers
 * List providers (Admin only: super_admin, polyfit_ops).
 * Supports status, category, search, and pagination.
 */
router.get('/', requireAuth, requireRole('super_admin', 'polyfit_ops'), async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 50 } = req.query;

    const result = await listProviders({
      status,
      category,
      search,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message,
      code: error.code || 'PROVIDER_LIST_FAILED'
    });
  }
});

/**
 * GET /api/providers/:id
 * Retrieve provider profile.
 * Accessible by admins or provider_admin belonging to this provider.
 */
router.get('/:id', requireAuth, requireProviderAccess((req) => req.params.id), async (req, res) => {
  try {
    const provider = await getProviderById(req.params.id);

    return res.status(200).json({
      success: true,
      provider
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message,
      code: error.code || 'PROVIDER_GET_FAILED'
    });
  }
});

/**
 * PATCH /api/providers/:id
 * Update provider details.
 * Accessible by admins or provider_admin belonging to this provider.
 */
router.patch('/:id', requireAuth, requireProviderAccess((req) => req.params.id), async (req, res) => {
  try {
    // Only admins can change status via PATCH /:id
    const isPlatformAdmin = req.roles.includes('super_admin') || req.roles.includes('polyfit_ops');
    const updatePayload = { ...req.body };
    if (!isPlatformAdmin && updatePayload.status) {
      delete updatePayload.status;
    }

    const updated = await updateProvider(req.params.id, updatePayload);

    return res.status(200).json({
      success: true,
      message: 'Provider profile updated successfully',
      provider: updated
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message,
      code: error.code || 'PROVIDER_UPDATE_FAILED'
    });
  }
});

/**
 * PATCH /api/providers/:id/approve
 * Approve provider application (admin only).
 */
router.patch('/:id/approve', requireAuth, requireRole('super_admin', 'polyfit_ops'), async (req, res) => {
  try {
    const approved = await approveProvider(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Provider approved and activated successfully',
      provider: approved
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message,
      code: error.code || 'PROVIDER_APPROVE_FAILED'
    });
  }
});

/**
 * PATCH /api/providers/:id/reject
 * Reject provider application with reason (admin only).
 */
router.patch('/:id/reject', requireAuth, requireRole('super_admin', 'polyfit_ops'), async (req, res) => {
  try {
    const { reason } = req.body;
    const rejected = await rejectProvider(req.params.id, reason);

    return res.status(200).json({
      success: true,
      message: 'Provider application rejected',
      provider: rejected
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message,
      code: error.code || 'PROVIDER_REJECT_FAILED'
    });
  }
});

// ─── Location Sub-Routes ─────────────────────────────────────────────────────

/**
 * POST /api/providers/:id/locations
 * Add a facility location to a provider.
 * Admin or provider_admin.
 */
router.post('/:id/locations', requireAuth, requireProviderAccess((req) => req.params.id), async (req, res) => {
  try {
    const location = await addLocation(req.params.id, req.body);

    return res.status(201).json({
      success: true,
      message: 'Location added successfully',
      location
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message,
      code: error.code || 'LOCATION_CREATE_FAILED'
    });
  }
});

/**
 * GET /api/providers/:id/locations
 * List locations for a provider.
 */
router.get('/:id/locations', requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const locations = await listLocations(req.params.id, { status });

    return res.status(200).json({
      success: true,
      locations
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message,
      code: error.code || 'LOCATION_LIST_FAILED'
    });
  }
});

/**
 * GET /api/providers/:id/locations/:locId
 * Get single location details.
 */
router.get('/:id/locations/:locId', requireAuth, async (req, res) => {
  try {
    const location = await getLocationById(req.params.id, req.params.locId);

    return res.status(200).json({
      success: true,
      location
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message,
      code: error.code || 'LOCATION_GET_FAILED'
    });
  }
});

/**
 * PATCH /api/providers/:id/locations/:locId
 * Update facility location.
 * Admin or provider_admin.
 */
router.patch('/:id/locations/:locId', requireAuth, requireProviderAccess((req) => req.params.id), async (req, res) => {
  try {
    const updated = await updateLocation(req.params.id, req.params.locId, req.body);

    return res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      location: updated
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message,
      code: error.code || 'LOCATION_UPDATE_FAILED'
    });
  }
});

/**
 * DELETE /api/providers/:id/locations/:locId
 * Deactivate facility location (soft delete).
 * Admin or provider_admin.
 */
router.delete('/:id/locations/:locId', requireAuth, requireProviderAccess((req) => req.params.id), async (req, res) => {
  try {
    const deactivated = await deactivateLocation(req.params.id, req.params.locId);

    return res.status(200).json({
      success: true,
      message: 'Location deactivated successfully',
      location: deactivated
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message,
      code: error.code || 'LOCATION_DELETE_FAILED'
    });
  }
});

// ─── Wellhub Marketing Toolkit ───────────────────────────────────────────────

/**
 * GET /api/providers/:id/marketing-assets
 * Downloadable co-branded partner assets (partner badge SVG, in-facility signage, social media kit).
 * Accessible by admins or provider_admin.
 */
router.get('/:id/marketing-assets', requireAuth, requireProviderAccess((req) => req.params.id), async (req, res) => {
  try {
    const toolkit = await getMarketingAssets(req.params.id);

    return res.status(200).json({
      success: true,
      ...toolkit
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message,
      code: error.code || 'MARKETING_ASSETS_FAILED'
    });
  }
});

module.exports = router;
