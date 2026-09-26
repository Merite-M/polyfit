const express = require('express');
const {
  requireAuth,
  requireRole,
  requireOrgAccess
} = require('../middleware/authMiddleware');
const {
  generateInvoice,
  listInvoices,
  getInvoiceDetail,
  updateInvoiceStatus
} = require('../services/billingService');

const router = express.Router();

// ─── POST /api/billing/generate ───────────────────────────────────────────────
// Generate an invoice for a specific organization and billing period.
// Requires: org_admin (own org) or polyfit_ops/super_admin (any org)
router.post(
  '/generate',
  requireAuth,
  requireRole('org_admin', 'polyfit_ops', 'super_admin'),
  async (req, res) => {
    try {
      const { org_id, period_start, period_end } = req.body;

      // Determine target org: org_admin can only generate for own org
      const targetOrgId = org_id || req.orgId;

      if (!targetOrgId) {
        return res.status(400).json({
          error: 'org_id is required',
          code: 'BILLING_ORG_REQUIRED'
        });
      }

      // Org-scoping: org_admin can only bill their own org
      if (req.primaryRole === 'org_admin' && targetOrgId !== req.orgId) {
        return res.status(403).json({
          error: 'org_admin can only generate invoices for their own organization',
          code: 'BILLING_FORBIDDEN_ORG'
        });
      }

      if (!period_start || !period_end) {
        return res.status(400).json({
          error: 'period_start and period_end are required (YYYY-MM-DD)',
          code: 'BILLING_PERIOD_REQUIRED'
        });
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(period_start) || !dateRegex.test(period_end)) {
        return res.status(400).json({
          error: 'period_start and period_end must be in YYYY-MM-DD format',
          code: 'BILLING_INVALID_DATE_FORMAT'
        });
      }

      if (period_start > period_end) {
        return res.status(400).json({
          error: 'period_start must be before or equal to period_end',
          code: 'BILLING_INVALID_PERIOD'
        });
      }

      const result = await generateInvoice(targetOrgId, period_start, period_end);

      const statusCode = result.created ? 201 : 200;
      return res.status(statusCode).json(result);
    } catch (err) {
      console.error('[billingRoutes] Generate invoice error:', err.message);
      return res.status(400).json({
        error: err.message,
        code: 'BILLING_GENERATION_FAILED'
      });
    }
  }
);

// ─── GET /api/billing/invoices ────────────────────────────────────────────────
// List invoices. org_admin sees own org only. polyfit_ops/super_admin sees all.
router.get(
  '/invoices',
  requireAuth,
  requireRole('org_admin', 'polyfit_ops', 'super_admin'),
  async (req, res) => {
    try {
      const { status, page, limit } = req.query;

      // Scope org_admin to their own org
      let orgId = req.query.org_id;
      if (req.primaryRole === 'org_admin') {
        orgId = req.orgId;
      }

      const result = await listInvoices({
        orgId,
        status,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20
      });

      return res.status(200).json(result);
    } catch (err) {
      console.error('[billingRoutes] List invoices error:', err.message);
      return res.status(500).json({
        error: err.message,
        code: 'BILLING_LIST_FAILED'
      });
    }
  }
);

// ─── GET /api/billing/invoices/:id ────────────────────────────────────────────
// Get invoice detail with line items and provider breakdown.
router.get(
  '/invoices/:id',
  requireAuth,
  requireRole('org_admin', 'polyfit_ops', 'super_admin'),
  async (req, res) => {
    try {
      const invoice = await getInvoiceDetail(req.params.id);

      // org_admin can only view their own org's invoices
      if (req.primaryRole === 'org_admin' && invoice.org_id !== req.orgId) {
        return res.status(403).json({
          error: 'You can only view invoices for your own organization',
          code: 'BILLING_FORBIDDEN_ORG'
        });
      }

      return res.status(200).json(invoice);
    } catch (err) {
      console.error('[billingRoutes] Get invoice error:', err.message);
      const statusCode = err.message.includes('not found') ? 404 : 500;
      return res.status(statusCode).json({
        error: err.message,
        code: 'BILLING_GET_FAILED'
      });
    }
  }
);

// ─── PATCH /api/billing/invoices/:id/status ───────────────────────────────────
// Update invoice status. Only polyfit_ops/super_admin can change status.
// org_admin can only mark as 'disputed'.
router.patch(
  '/invoices/:id/status',
  requireAuth,
  requireRole('org_admin', 'polyfit_ops', 'super_admin'),
  async (req, res) => {
    try {
      const { status: newStatus } = req.body;

      if (!newStatus) {
        return res.status(400).json({
          error: 'status is required in request body',
          code: 'BILLING_STATUS_REQUIRED'
        });
      }

      // org_admin can only dispute invoices
      if (req.primaryRole === 'org_admin' && newStatus !== 'disputed') {
        return res.status(403).json({
          error: 'org_admin can only mark invoices as disputed',
          code: 'BILLING_FORBIDDEN_STATUS'
        });
      }

      // Verify org_admin owns this invoice
      if (req.primaryRole === 'org_admin') {
        const invoice = await getInvoiceDetail(req.params.id);
        if (invoice.org_id !== req.orgId) {
          return res.status(403).json({
            error: 'You can only update invoices for your own organization',
            code: 'BILLING_FORBIDDEN_ORG'
          });
        }
      }

      const updated = await updateInvoiceStatus(req.params.id, newStatus);
      return res.status(200).json(updated);
    } catch (err) {
      console.error('[billingRoutes] Update invoice status error:', err.message);
      const statusCode = err.message.includes('not found') ? 404 : 400;
      return res.status(statusCode).json({
        error: err.message,
        code: 'BILLING_STATUS_UPDATE_FAILED'
      });
    }
  }
);

module.exports = router;
