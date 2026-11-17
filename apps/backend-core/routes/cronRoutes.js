const express = require('express');
const { safeCompare } = require('@polyfit/shared-utils');
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
  // Constant-time comparison to prevent timing side-channel attacks on CRON_SECRET
  if (!safeCompare(provided, CRON_SECRET)) {
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
  const utcMonth = now.getUTCMonth(); // 0-indexed (0 = Jan, 11 = Dec)
  const utcYear = now.getUTCFullYear();
  const year = utcMonth === 0 ? utcYear - 1 : utcYear;
  const month = utcMonth === 0 ? 12 : utcMonth; // Previous month 1-12
  const periodStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
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

// ─── POST /api/cron/expire-pending-visits ─────────────────────────────────────
// Auto-expire abandoned/pending check-in visits older than 20 minutes.
// Recommended schedule: Every 5-15 minutes
router.post('/expire-pending-visits', verifyCronSecret, async (req, res) => {
  const startTime = Date.now();
  console.log('[cronRoutes] Starting pending visit auto-expiration check...');

  try {
    const { supabase } = require('../services/supabaseService');
    if (!supabase) throw new Error('Database service unavailable');

    const cutoffMinutes = parseInt(req.body?.cutoff_minutes, 10) || 20;
    const cutoffDate = new Date(Date.now() - cutoffMinutes * 60 * 1000).toISOString();

    const { data: staleVisits, error: fetchErr } = await supabase
      .from('visits')
      .select('id, employee_id, provider_location_id, check_in_at')
      .eq('status', 'pending')
      .lt('check_in_at', cutoffDate);

    if (fetchErr) throw fetchErr;

    const staleIds = (staleVisits || []).map(v => v.id);
    let expiredCount = 0;

    if (staleIds.length > 0) {
      const { error: updErr } = await supabase
        .from('visits')
        .update({
          status: 'rejected',
          metadata: {
            rejection_reason: 'EXPIRED_UNCLAIMED_AT_DESK',
            auto_expired_at: new Date().toISOString(),
            cutoff_minutes: cutoffMinutes
          }
        })
        .in('id', staleIds);

      if (updErr) throw updErr;
      expiredCount = staleIds.length;
    }

    const duration = Date.now() - startTime;
    console.log(`[cronRoutes] Stale visits auto-expiration complete: ${expiredCount} expired in ${duration}ms`);

    return res.status(200).json({
      success: true,
      expired_count: expiredCount,
      cutoff_date: cutoffDate,
      duration_ms: duration,
      triggered_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('[cronRoutes] Stale visits expiration error:', err.message);
    return res.status(500).json({
      error: err.message,
      code: 'CRON_EXPIRE_VISITS_FAILED',
      duration_ms: Date.now() - startTime
    });
  }
});

module.exports = router;
