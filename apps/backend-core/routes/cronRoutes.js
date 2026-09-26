const express = require('express');
const { generateAllInvoices, markOverdueInvoices } = require('../services/billingService');
const { generateAllSettlements } = require('../services/settlementService');

const router = express.Router();

// ─── Cron Secret Validation ───────────────────────────────────────────────────
// All cron endpoints are protected by a shared secret header.
// External schedulers (Render Cron Jobs, pg_cron, etc.) must include this.
const CRON_SECRET = process.env.CRON_SECRET;

function verifyCronSecret(req, res, next) {
  if (!CRON_SECRET) {
    console.error('[cronRoutes] CRON_SECRET not configured. Cron endpoints disabled.');
    return res.status(503).json({
      error: 'Cron service not configured',
      code: 'CRON_NOT_CONFIGURED'
    });
  }

  const provided = req.headers['x-cron-secret'] || req.headers['authorization']?.replace('Bearer ', '');
  if (provided !== CRON_SECRET) {
    return res.status(401).json({
      error: 'Invalid cron secret',
      code: 'CRON_UNAUTHORIZED'
    });
  }

  next();
}

// ─── Helper: Compute Previous Month Period ────────────────────────────────────
function getPreviousMonthPeriod() {
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 12 : now.getMonth(); // getMonth() is 0-indexed
  const periodStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const periodEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { periodStart, periodEnd };
}

// ─── POST /api/cron/billing ───────────────────────────────────────────────────
// Monthly invoice generation for all active organizations.
// Generates invoices for the previous month.
// Recommended schedule: 1st of each month at 02:00 UTC
router.post('/billing', verifyCronSecret, async (req, res) => {
  const startTime = Date.now();
  console.log('[cronRoutes] Starting monthly billing generation...');

  try {
    // Allow override via body, otherwise use previous month
    const { period_start, period_end } = req.body || {};
    const period = (period_start && period_end)
      ? { periodStart: period_start, periodEnd: period_end }
      : getPreviousMonthPeriod();

    const result = await generateAllInvoices(period.periodStart, period.periodEnd);

    const duration = Date.now() - startTime;
    console.log(
      `[cronRoutes] Billing generation complete: ${result.generated} generated, ${result.skipped} skipped, ${result.errors.length} errors. Duration: ${duration}ms`
    );

    return res.status(200).json({
      ...result,
      period: period,
      duration_ms: duration,
      triggered_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('[cronRoutes] Billing cron error:', err.message);
    return res.status(500).json({
      error: err.message,
      code: 'CRON_BILLING_FAILED',
      duration_ms: Date.now() - startTime
    });
  }
});

// ─── POST /api/cron/settlements ───────────────────────────────────────────────
// Monthly settlement generation for all active providers.
// Generates settlements for the previous month.
// Recommended schedule: 5th of each month at 02:00 UTC
router.post('/settlements', verifyCronSecret, async (req, res) => {
  const startTime = Date.now();
  console.log('[cronRoutes] Starting monthly settlement generation...');

  try {
    const { period_start, period_end } = req.body || {};
    const period = (period_start && period_end)
      ? { periodStart: period_start, periodEnd: period_end }
      : getPreviousMonthPeriod();

    const result = await generateAllSettlements(period.periodStart, period.periodEnd);

    const duration = Date.now() - startTime;
    console.log(
      `[cronRoutes] Settlement generation complete: ${result.generated} generated, ${result.skipped} skipped, ${result.errors.length} errors. Duration: ${duration}ms`
    );

    return res.status(200).json({
      ...result,
      period: period,
      duration_ms: duration,
      triggered_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('[cronRoutes] Settlement cron error:', err.message);
    return res.status(500).json({
      error: err.message,
      code: 'CRON_SETTLEMENT_FAILED',
      duration_ms: Date.now() - startTime
    });
  }
});

// ─── POST /api/cron/overdue-check ─────────────────────────────────────────────
// Check for and mark overdue invoices.
// Recommended schedule: Daily at 06:00 UTC
router.post('/overdue-check', verifyCronSecret, async (req, res) => {
  const startTime = Date.now();
  console.log('[cronRoutes] Starting overdue invoice check...');

  try {
    const result = await markOverdueInvoices();

    const duration = Date.now() - startTime;
    console.log(
      `[cronRoutes] Overdue check complete: ${result.markedOverdue} invoices marked overdue. Duration: ${duration}ms`
    );

    return res.status(200).json({
      ...result,
      duration_ms: duration,
      triggered_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('[cronRoutes] Overdue check error:', err.message);
    return res.status(500).json({
      error: err.message,
      code: 'CRON_OVERDUE_CHECK_FAILED',
      duration_ms: Date.now() - startTime
    });
  }
});

module.exports = router;
