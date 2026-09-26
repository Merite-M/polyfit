const express = require('express');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const {
  createContract,
  listContracts,
  getContractById,
  updateContract,
  activateContract,
  terminateContract
} = require('../services/contractService');

const router = express.Router();

/**
 * POST /api/provider-contracts
 * Create a new contract between an organization and a provider.
 * Admin only (super_admin, polyfit_ops).
 */
router.post('/', requireAuth, requireRole('super_admin', 'polyfit_ops'), async (req, res) => {
  try {
    const {
      org_id,
      provider_id,
      per_visit_rate,
      monthly_cap,
      access_hours,
      effective_from,
      effective_to,
      status
    } = req.body;

    const contract = await createContract({
      orgId: org_id,
      providerId: provider_id,
      perVisitRate: per_visit_rate,
      monthlyCap: monthly_cap,
      accessHours: access_hours,
      effectiveFrom: effective_from,
      effectiveTo: effective_to,
      status: status || 'draft'
    });

    return res.status(201).json({
      success: true,
      message: 'Provider contract created successfully',
      contract
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message,
      code: error.code || 'CONTRACT_CREATE_FAILED'
    });
  }
});

/**
 * GET /api/provider-contracts
 * List provider contracts with role-scoped isolation.
 * Admin sees all; org_admin sees org's contracts; provider_admin sees provider's contracts.
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const {
      org_id,
      provider_id,
      status,
      page = 1,
      limit = 50
    } = req.query;

    const result = await listContracts({
      userRoles: req.roles,
      userOrgId: req.orgId,
      userProviderId: req.providerId,
      filterOrgId: org_id,
      filterProviderId: provider_id,
      status,
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
      code: error.code || 'CONTRACT_LIST_FAILED'
    });
  }
});

/**
 * GET /api/provider-contracts/:id
 * Retrieve contract details by ID with role-scoped access control.
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const contract = await getContractById(req.params.id, {
      userRoles: req.roles,
      userOrgId: req.orgId,
      userProviderId: req.providerId
    });

    return res.status(200).json({
      success: true,
      contract
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message,
      code: error.code || 'CONTRACT_GET_FAILED'
    });
  }
});

/**
 * PATCH /api/provider-contracts/:id
 * Update terms of an existing contract. Admin only.
 */
router.patch('/:id', requireAuth, requireRole('super_admin', 'polyfit_ops'), async (req, res) => {
  try {
    const updated = await updateContract(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Contract terms updated successfully',
      contract: updated
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message,
      code: error.code || 'CONTRACT_UPDATE_FAILED'
    });
  }
});

/**
 * PATCH /api/provider-contracts/:id/activate
 * Activate a provider contract. Admin only.
 */
router.patch('/:id/activate', requireAuth, requireRole('super_admin', 'polyfit_ops'), async (req, res) => {
  try {
    const activated = await activateContract(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Contract activated successfully',
      contract: activated
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message,
      code: error.code || 'CONTRACT_ACTIVATE_FAILED'
    });
  }
});

/**
 * PATCH /api/provider-contracts/:id/terminate
 * Terminate a provider contract. Admin only.
 */
router.patch('/:id/terminate', requireAuth, requireRole('super_admin', 'polyfit_ops'), async (req, res) => {
  try {
    const terminated = await terminateContract(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Contract terminated successfully',
      contract: terminated
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message,
      code: error.code || 'CONTRACT_TERMINATE_FAILED'
    });
  }
});

module.exports = router;
