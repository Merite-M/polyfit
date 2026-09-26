const express = require('express');
const { requireAuth, requireRole, requireOrgAccess } = require('../middleware/authMiddleware');
const {
  createBenefitPlan,
  getBenefitPlans,
  getBenefitPlanById,
  updateBenefitPlan
} = require('../services/benefitService');

// Merge params to access :orgId from parent router
const router = express.Router({ mergeParams: true });

const orgScope = requireOrgAccess((req) => req.params.orgId);

/**
 * POST /api/organizations/:orgId/benefits
 * Create benefit plan (supports Wellhub-style multi-tier plans)
 */
router.post('/', requireAuth, orgScope, requireRole('super_admin', 'polyfit_ops', 'org_admin'), async (req, res) => {
  try {
    const { orgId } = req.params;
    const {
      name,
      tier,
      max_monthly_visits,
      co_pay_percentage,
      allowed_provider_categories,
      allowed_locations,
      budget_cap_per_employee,
      is_family_eligible,
      description
    } = req.body;

    const benefit = await createBenefitPlan(orgId, {
      name,
      tier,
      max_monthly_visits,
      co_pay_percentage,
      allowed_provider_categories,
      allowed_locations,
      budget_cap_per_employee,
      is_family_eligible,
      description
    });

    return res.status(201).json({
      success: true,
      message: 'Benefit plan created successfully',
      benefit
    });
  } catch (error) {
    if (error.status && error.code) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }
    console.error('[benefitRoutes/create] Error:', error);
    return res.status(500).json({
      error: 'Internal server error creating benefit plan',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/organizations/:orgId/benefits
 * List all benefit plans for the organization
 */
router.get('/', requireAuth, orgScope, async (req, res) => {
  try {
    const { orgId } = req.params;
    const benefits = await getBenefitPlans(orgId);

    return res.status(200).json({
      benefits: benefits || [],
      total: benefits.length
    });
  } catch (error) {
    if (error.status && error.code) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }
    console.error('[benefitRoutes/list] Error:', error);
    return res.status(500).json({
      error: 'Internal server error listing benefit plans',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/organizations/:orgId/benefits/:id
 * Get details of a single benefit plan
 */
router.get('/:id', requireAuth, orgScope, async (req, res) => {
  try {
    const { orgId, id } = req.params;
    const benefit = await getBenefitPlanById(orgId, id);

    return res.status(200).json({ benefit });
  } catch (error) {
    if (error.status && error.code) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }
    console.error('[benefitRoutes/get] Error:', error);
    return res.status(500).json({
      error: 'Internal server error retrieving benefit plan',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * PATCH /api/organizations/:orgId/benefits/:id
 * Update benefit rules (max monthly visits, co-pay %, allowed categories, budget cap, tier)
 */
router.patch('/:id', requireAuth, orgScope, requireRole('super_admin', 'polyfit_ops', 'org_admin'), async (req, res) => {
  try {
    const { orgId, id } = req.params;
    const updated = await updateBenefitPlan(orgId, id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Benefit plan updated successfully',
      benefit: updated
    });
  } catch (error) {
    if (error.status && error.code) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }
    console.error('[benefitRoutes/update] Error:', error);
    return res.status(500).json({
      error: 'Internal server error updating benefit plan',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
