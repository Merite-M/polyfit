const express = require('express');
const {
  requireAuth,
  requireRole,
  requireOrgAccess,
  requireProviderAccess
} = require('../middleware/authMiddleware');
const {
  getEmployerUtilizationReport,
  getEmployerTrends,
  exportEmployerReport,
  getProviderAnalyticsReport,
  exportProviderReport,
  getPlatformOverviewReport
} = require('../services/reportingService');

const router = express.Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ─── Employer Utilization Handler ─────────────────────────────────────────────
async function handleEmployerUtilization(req, res) {
  try {
    const { orgId } = req.params;
    if (!orgId || !UUID_REGEX.test(orgId)) {
      return res.status(400).json({
        error: 'Invalid organization ID format. Expected UUID.',
        code: 'REPORTING_INVALID_ORG_ID'
      });
    }

    const startDate = req.query.start_date || req.query.startDate;
    const endDate = req.query.end_date || req.query.endDate;
    const department = req.query.department;
    const tier = req.query.tier;

    const report = await getEmployerUtilizationReport(orgId, {
      startDate,
      endDate,
      department,
      tier
    });

    return res.status(200).json(report);
  } catch (err) {
    console.error('[reportingRoutes] Employer utilization error:', err.message);
    const status = err.message.includes('not found') ? 404 : 400;
    return res.status(status).json({
      error: err.message,
      code: 'REPORTING_UTILIZATION_FAILED'
    });
  }
}

// ─── Employer Trends Handler ──────────────────────────────────────────────────
async function handleEmployerTrends(req, res) {
  try {
    const { orgId } = req.params;
    if (!orgId || !UUID_REGEX.test(orgId)) {
      return res.status(400).json({
        error: 'Invalid organization ID format. Expected UUID.',
        code: 'REPORTING_INVALID_ORG_ID'
      });
    }

    const months = req.query.months ? parseInt(req.query.months, 10) : 6;
    if (isNaN(months) || months < 1 || months > 24) {
      return res.status(400).json({
        error: 'months parameter must be an integer between 1 and 24',
        code: 'REPORTING_INVALID_MONTHS'
      });
    }

    const trends = await getEmployerTrends(orgId, { months });
    return res.status(200).json(trends);
  } catch (err) {
    console.error('[reportingRoutes] Employer trends error:', err.message);
    const status = err.message.includes('not found') ? 404 : 400;
    return res.status(status).json({
      error: err.message,
      code: 'REPORTING_TRENDS_FAILED'
    });
  }
}

// ─── Employer Export Handler ──────────────────────────────────────────────────
async function handleEmployerExport(req, res) {
  try {
    const { orgId } = req.params;
    if (!orgId || !UUID_REGEX.test(orgId)) {
      return res.status(400).json({
        error: 'Invalid organization ID format. Expected UUID.',
        code: 'REPORTING_INVALID_ORG_ID'
      });
    }

    const exportType = (req.query.type || 'utilization').toLowerCase();
    const startDate = req.query.start_date || req.query.startDate;
    const endDate = req.query.end_date || req.query.endDate;
    const department = req.query.department;

    const { csv, filename } = await exportEmployerReport(orgId, {
      type: exportType,
      startDate,
      endDate,
      department
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  } catch (err) {
    console.error('[reportingRoutes] Employer export error:', err.message);
    const status = err.message.includes('not found') ? 404 : 400;
    return res.status(status).json({
      error: err.message,
      code: 'REPORTING_EXPORT_FAILED'
    });
  }
}

// ─── Employer Routes & Aliases ────────────────────────────────────────────────
// GET /api/reporting/employer/:orgId/utilization
router.get(
  '/employer/:orgId/utilization',
  requireAuth,
  requireRole('org_admin', 'polyfit_ops', 'super_admin'),
  requireOrgAccess(),
  handleEmployerUtilization
);

// Alias: /organization/:orgId/utilization
router.get(
  '/organization/:orgId/utilization',
  requireAuth,
  requireRole('org_admin', 'polyfit_ops', 'super_admin'),
  requireOrgAccess(),
  handleEmployerUtilization
);

// GET /api/reporting/employer/:orgId/trends
router.get(
  '/employer/:orgId/trends',
  requireAuth,
  requireRole('org_admin', 'polyfit_ops', 'super_admin'),
  requireOrgAccess(),
  handleEmployerTrends
);

// Alias: /organization/:orgId/trends
router.get(
  '/organization/:orgId/trends',
  requireAuth,
  requireRole('org_admin', 'polyfit_ops', 'super_admin'),
  requireOrgAccess(),
  handleEmployerTrends
);

// GET /api/reporting/employer/:orgId/export
router.get(
  '/employer/:orgId/export',
  requireAuth,
  requireRole('org_admin', 'polyfit_ops', 'super_admin'),
  requireOrgAccess(),
  handleEmployerExport
);

// Alias: /organization/:orgId/export
router.get(
  '/organization/:orgId/export',
  requireAuth,
  requireRole('org_admin', 'polyfit_ops', 'super_admin'),
  requireOrgAccess(),
  handleEmployerExport
);

// ─── Provider Routes ──────────────────────────────────────────────────────────
// GET /api/reporting/provider/:providerId/visits
router.get(
  '/provider/:providerId/visits',
  requireAuth,
  requireRole('provider_admin', 'polyfit_ops', 'super_admin'),
  requireProviderAccess(),
  async (req, res) => {
    try {
      const { providerId } = req.params;
      if (!providerId || !UUID_REGEX.test(providerId)) {
        return res.status(400).json({
          error: 'Invalid provider ID format. Expected UUID.',
          code: 'REPORTING_INVALID_PROVIDER_ID'
        });
      }

      const startDate = req.query.start_date || req.query.startDate;
      const endDate = req.query.end_date || req.query.endDate;

      const report = await getProviderAnalyticsReport(providerId, {
        startDate,
        endDate
      });

      return res.status(200).json(report);
    } catch (err) {
      console.error('[reportingRoutes] Provider analytics error:', err.message);
      const status = err.message.includes('not found') ? 404 : 400;
      return res.status(status).json({
        error: err.message,
        code: 'REPORTING_PROVIDER_ANALYTICS_FAILED'
      });
    }
  }
);

// GET /api/reporting/provider/:providerId/export
router.get(
  '/provider/:providerId/export',
  requireAuth,
  requireRole('provider_admin', 'polyfit_ops', 'super_admin'),
  requireProviderAccess(),
  async (req, res) => {
    try {
      const { providerId } = req.params;
      if (!providerId || !UUID_REGEX.test(providerId)) {
        return res.status(400).json({
          error: 'Invalid provider ID format. Expected UUID.',
          code: 'REPORTING_INVALID_PROVIDER_ID'
        });
      }

      const startDate = req.query.start_date || req.query.startDate;
      const endDate = req.query.end_date || req.query.endDate;

      const { csv, filename } = await exportProviderReport(providerId, {
        startDate,
        endDate
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csv);
    } catch (err) {
      console.error('[reportingRoutes] Provider export error:', err.message);
      const status = err.message.includes('not found') ? 404 : 400;
      return res.status(status).json({
        error: err.message,
        code: 'REPORTING_EXPORT_FAILED'
      });
    }
  }
);

// ─── Platform Analytics (Admin / PolyFit Ops) ─────────────────────────────────
// GET /api/reporting/platform/overview
router.get(
  '/platform/overview',
  requireAuth,
  requireRole('polyfit_ops', 'super_admin'),
  async (req, res) => {
    try {
      const startDate = req.query.start_date || req.query.startDate;
      const endDate = req.query.end_date || req.query.endDate;

      const overview = await getPlatformOverviewReport({
        startDate,
        endDate
      });

      return res.status(200).json(overview);
    } catch (err) {
      console.error('[reportingRoutes] Platform overview error:', err.message);
      return res.status(500).json({
        error: err.message,
        code: 'REPORTING_PLATFORM_OVERVIEW_FAILED'
      });
    }
  }
);

module.exports = router;
