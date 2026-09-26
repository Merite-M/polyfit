const express = require('express');
const {
  requireAuth,
  requireRole,
  requireProviderAccess
} = require('../middleware/authMiddleware');
const {
  generateSettlement,
  generateAllSettlements,
  listSettlements,
  getSettlementDetail,
  updateSettlementStatus
} = require('../services/settlementService');

const router = express.Router();

// ─── POST /api/settlements/generate ───────────────────────────────────────────
// Generate a settlement for a specific provider (or all providers).
// Only polyfit_ops/super_admin can trigger settlement generation.
router.post(
  '/generate',
  requireAuth,
  requireRole('polyfit_ops', 'super_admin'),
  async (req, res) => {
    try {
      const { provider_id, period_start, period_end } = req.body;

      if (!period_start || !period_end) {
        return res.status(400).json({
          error: 'period_start and period_end are required (YYYY-MM-DD)',
          code: 'SETTLEMENT_PERIOD_REQUIRED'
        });
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(period_start) || !dateRegex.test(period_end)) {
        return res.status(400).json({
          error: 'period_start and period_end must be in YYYY-MM-DD format',
          code: 'SETTLEMENT_INVALID_DATE_FORMAT'
        });
      }

      if (period_start > period_end) {
        return res.status(400).json({
          error: 'period_start must be before or equal to period_end',
          code: 'SETTLEMENT_INVALID_PERIOD'
        });
      }

      // If provider_id is specified, generate for that provider only
      // Otherwise, generate for all active providers (batch mode)
      if (provider_id) {
        const result = await generateSettlement(provider_id, period_start, period_end);
        const statusCode = result.created ? 201 : 200;
        return res.status(statusCode).json(result);
      }

      // Batch mode: generate for all providers
      const result = await generateAllSettlements(period_start, period_end);
      return res.status(200).json(result);
    } catch (err) {
      console.error('[settlementRoutes] Generate settlement error:', err.message);
      return res.status(400).json({
        error: err.message,
        code: 'SETTLEMENT_GENERATION_FAILED'
      });
    }
  }
);

// ─── GET /api/settlements ─────────────────────────────────────────────────────
// List settlements. provider_admin sees own only. polyfit_ops/super_admin sees all.
router.get(
  '/',
  requireAuth,
  requireRole('provider_admin', 'polyfit_ops', 'super_admin'),
  async (req, res) => {
    try {
      const { status, page, limit } = req.query;

      // Scope provider_admin to their own provider
      let providerId = req.query.provider_id;
      if (req.primaryRole === 'provider_admin') {
        providerId = req.providerId;
      }

      const result = await listSettlements({
        providerId,
        status,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20
      });

      return res.status(200).json(result);
    } catch (err) {
      console.error('[settlementRoutes] List settlements error:', err.message);
      return res.status(500).json({
        error: err.message,
        code: 'SETTLEMENT_LIST_FAILED'
      });
    }
  }
);

// ─── GET /api/settlements/:id ─────────────────────────────────────────────────
// Get settlement detail with visit breakdown.
router.get(
  '/:id',
  requireAuth,
  requireRole('provider_admin', 'polyfit_ops', 'super_admin'),
  async (req, res) => {
    try {
      const settlement = await getSettlementDetail(req.params.id);

      // provider_admin can only view their own settlements
      if (req.primaryRole === 'provider_admin' && settlement.provider_id !== req.providerId) {
        return res.status(403).json({
          error: 'You can only view settlements for your own provider',
          code: 'SETTLEMENT_FORBIDDEN_PROVIDER'
        });
      }

      return res.status(200).json(settlement);
    } catch (err) {
      console.error('[settlementRoutes] Get settlement error:', err.message);
      const statusCode = err.message.includes('not found') ? 404 : 500;
      return res.status(statusCode).json({
        error: err.message,
        code: 'SETTLEMENT_GET_FAILED'
      });
    }
  }
);

// ─── PATCH /api/settlements/:id/status ────────────────────────────────────────
// Update settlement status. Only polyfit_ops/super_admin can change status.
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('polyfit_ops', 'super_admin'),
  async (req, res) => {
    try {
      const { status: newStatus, payment_reference } = req.body;

      if (!newStatus) {
        return res.status(400).json({
          error: 'status is required in request body',
          code: 'SETTLEMENT_STATUS_REQUIRED'
        });
      }

      const updated = await updateSettlementStatus(req.params.id, newStatus, payment_reference);
      return res.status(200).json(updated);
    } catch (err) {
      console.error('[settlementRoutes] Update settlement status error:', err.message);
      const statusCode = err.message.includes('not found') ? 404 : 400;
      return res.status(statusCode).json({
        error: err.message,
        code: 'SETTLEMENT_STATUS_UPDATE_FAILED'
      });
    }
  }
);

module.exports = router;
