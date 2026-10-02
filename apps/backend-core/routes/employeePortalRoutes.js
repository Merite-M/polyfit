const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { requireAuth } = require('../middleware/authMiddleware');
const {
  getEmployeeForAuthUser,
  getEmployeeMe,
  getEmployeeDashboard,
  getEmployeeVisits,
  getEmployeeNetwork
} = require('../services/employeePortalService');

const router = express.Router();

/**
 * Mobile-tuned Rate Limiter
 * Allows 200 requests per 15 minutes per IP to comfortably accommodate mobile app foregrounding & navigation
 */
const mobileApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this device. Please wait a moment before trying again.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

router.use(mobileApiLimiter);

/**
 * Middleware: Attach timing headers to track sub-150ms execution SLA
 */
router.use((req, res, next) => {
  const start = Date.now();
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const duration = Date.now() - start;
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${duration}ms`);
      res.setHeader('Server-Timing', `total;dur=${duration}`);
    }
    return originalJson(body);
  };
  next();
});

/**
 * GET /api/employee/me
 * Beneficiary Profile & Corporate Benefit Status (Tab 3: Me)
 */
router.get('/me', requireAuth, async (req, res) => {
  const startTime = Date.now();
  try {
    const { employee_id } = req.query;
    const { employee, error, status, code } = await getEmployeeForAuthUser(req, employee_id);

    if (error || !employee) {
      return res.status(status || 404).json({
        error: error || 'Employee profile not found',
        code: code || 'EMPLOYEE_NOT_FOUND'
      });
    }

    const meData = await getEmployeeMe(employee);
    return res.status(200).json(meData);
  } catch (err) {
    console.error('[employeePortal/me] Error:', err);
    return res.status(500).json({
      error: 'Internal server error fetching employee profile',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/employee/dashboard
 * Single-Roundtrip Telemetry Aggregator (< 150ms SLA)
 * Returns benefit quota, streak, recent visits, cooldown state, and 24h offline cryptographic pass seed.
 */
router.get('/dashboard', requireAuth, async (req, res) => {
  const startTime = Date.now();
  try {
    const { employee_id } = req.query;
    const { employee, error, status, code } = await getEmployeeForAuthUser(req, employee_id);

    if (error || !employee) {
      return res.status(status || 404).json({
        error: error || 'Employee profile not found',
        code: code || 'EMPLOYEE_NOT_FOUND'
      });
    }

    const dashboardData = await getEmployeeDashboard(employee);
    res.setHeader('Cache-Control', 'private, no-cache, no-transform');

    return res.status(200).json(dashboardData);
  } catch (err) {
    console.error('[employeePortal/dashboard] Error:', err);
    return res.status(500).json({
      error: 'Internal server error assembling employee dashboard',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/employee/visits
 * Paginated verified visit history (Tab 3: Me)
 */
router.get('/visits', requireAuth, async (req, res) => {
  const startTime = Date.now();
  try {
    const { employee_id, page, limit, category, status } = req.query;
    const { employee, error, status: empStatus, code } = await getEmployeeForAuthUser(req, employee_id);

    if (error || !employee) {
      return res.status(empStatus || 404).json({
        error: error || 'Employee profile not found',
        code: code || 'EMPLOYEE_NOT_FOUND'
      });
    }

    const result = await getEmployeeVisits(employee.id, { page, limit, category, status });
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    if (err.status && err.code) {
      return res.status(err.status).json({ error: err.message, code: err.code });
    }
    console.error('[employeePortal/visits] Error:', err);
    return res.status(500).json({
      error: 'Internal server error fetching visit history',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/employee/network
 * In-Network Wellness Provider Facilities (Tab 2: Explore Network)
 */
router.get('/network', requireAuth, async (req, res) => {
  try {
    const { employee_id, category, city, search, lat, lng } = req.query;
    const { employee, error, status: empStatus, code } = await getEmployeeForAuthUser(req, employee_id);

    if (error || !employee) {
      return res.status(empStatus || 404).json({
        error: error || 'Employee profile not found',
        code: code || 'EMPLOYEE_NOT_FOUND'
      });
    }

    const result = await getEmployeeNetwork(employee, { category, city, search, lat, lng });
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    if (err.status && err.code) {
      return res.status(err.status).json({ error: err.message, code: err.code });
    }
    console.error('[employeePortal/network] Error:', err);
    return res.status(500).json({
      error: 'Internal server error discovering network facilities',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/employee/providers
 * Alias for /api/employee/network (Explore Tab)
 */
router.get('/providers', requireAuth, async (req, res) => {
  try {
    const { employee_id, category, city, search, lat, lng } = req.query;
    const { employee, error, status: empStatus, code } = await getEmployeeForAuthUser(req, employee_id);

    if (error || !employee) {
      return res.status(empStatus || 404).json({
        error: error || 'Employee profile not found',
        code: code || 'EMPLOYEE_NOT_FOUND'
      });
    }

    const result = await getEmployeeNetwork(employee, { category, city, search, lat, lng });
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('[employeePortal/providers] Error:', err);
    return res.status(500).json({
      error: 'Internal server error discovering providers',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/employee/auth/verify-domain
 * Unauthenticated domain resolver for Frictionless Corporate Onboarding (PF-105)
 * Takes work email (e.g. user@bk.rw), resolves employer organization and subsidy package in < 50ms
 */
router.post(['/auth/verify-domain', '/verify-domain'], async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !String(email).includes('@')) {
      return res.status(400).json({
        recognized: false,
        error: 'Valid corporate work email is required',
        code: 'VALIDATION_ERROR'
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const domain = cleanEmail.split('@')[1];

    const { supabase } = require('../services/supabaseService');
    if (!supabase) {
      return res.status(503).json({
        recognized: false,
        error: 'Database service unavailable',
        code: 'DB_UNAVAILABLE'
      });
    }

    // 1. Search organizations by allowed_domains containing domain
    let { data: org } = await supabase
      .from('organizations')
      .select('id, name, slug, allowed_domains, status')
      .contains('allowed_domains', [domain])
      .eq('status', 'active')
      .maybeSingle();

    // 2. Fallback: match organization from pre-enrolled employees with this domain
    if (!org) {
      const { data: empOrg } = await supabase
        .from('employees')
        .select('org_id, organizations(id, name, slug, status)')
        .ilike('email', `%@${domain}`)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (empOrg && empOrg.organizations) {
        org = empOrg.organizations;
      }
    }

    if (!org) {
      return res.status(404).json({
        recognized: false,
        domain,
        error: `Company domain @${domain} is not currently enrolled in PolyFit Corporate Network`,
        code: 'DOMAIN_NOT_ENROLLED'
      });
    }

    // 3. Resolve active corporate benefit plan tier
    const { data: benefit } = await supabase
      .from('benefits')
      .select('id, name, tier, max_monthly_visits, co_pay_percentage, allowed_provider_categories')
      .eq('org_id', org.id)
      .eq('status', 'active')
      .order('max_monthly_visits', { ascending: false })
      .limit(1)
      .maybeSingle();

    const coPayPct = Number(benefit?.co_pay_percentage || 0);

    return res.status(200).json({
      recognized: true,
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        domain
      },
      benefit: {
        tier: benefit?.tier || 'standard',
        name: benefit?.name || 'Standard Corporate Wellness Tier',
        max_monthly_visits: benefit?.max_monthly_visits || 12,
        subsidy_percentage: Math.max(0, 100 - coPayPct),
        is_fully_sponsored: coPayPct === 0,
        allowed_categories: benefit?.allowed_provider_categories || ['gym', 'pool', 'studio', 'clinic', 'wellness_center']
      },
      message: `Welcome! ${org.name} proudly sponsors your PolyFit wellness benefit.`
    });
  } catch (err) {
    console.error('[employeePortal/verify-domain] Error:', err);
    return res.status(500).json({
      recognized: false,
      error: 'Internal server error resolving corporate domain',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
