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

module.exports = router;
