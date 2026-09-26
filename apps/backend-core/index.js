const express = require('express');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

const corsOptions = {
  origin: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? false : 'http://localhost:3000'),
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ type: ['text/csv', 'text/plain'], limit: '10mb' }));

// ─── Rate Limiters ───────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later', code: 'RATE_LIMIT_EXCEEDED' },
  skip: (req) => req.path.includes('/webhook') || req.path.includes('/cron') || req.path === '/health'
});

app.use('/api/', apiLimiter);

// ─── Supabase Client ─────────────────────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn("Supabase credentials not found, endpoints using supabase will fail.");
}

// ─── Health Check Endpoint ───────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    let dbStatus = 'disconnected';
    if (supabase) {
      const { error } = await supabase.rpc('version');
      dbStatus = error ? 'error' : 'connected';
    }
    const isHealthy = dbStatus === 'connected' || !supabase;
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      database: dbStatus,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'error',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});
// ─────────────────────────────────────────────────────────────────────────────

// ─── Aggregator API Routes ──────────────────────────────────────────────────
// PF-78: Multi-Role Auth & RBAC routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// PF-79: Visit Verification Engine routes (TOTP QR, Anti-Passback, Geofence, Disputes)
const visitRoutes = require('./routes/visitRoutes');
app.use('/api/visits', visitRoutes);

// PF-80: Billing & Settlement Engine routes
const billingRoutes = require('./routes/billingRoutes');
app.use('/api/billing', billingRoutes);

const settlementRoutes = require('./routes/settlementRoutes');
app.use('/api/settlements', settlementRoutes);

// PF-80: Cron trigger endpoints (protected by CRON_SECRET, not JWT)
const cronRoutes = require('./routes/cronRoutes');
app.use('/api/cron', cronRoutes);

// PF-82: Organization, Employee Roster, Benefit Configuration & Eligibility routes
const organizationRoutes = require('./routes/organizationRoutes');
app.use('/api/organizations', organizationRoutes);

const employeeRoutes = require('./routes/employeeRoutes');
app.use('/api/organizations/:orgId/employees', employeeRoutes);

const benefitRoutes = require('./routes/benefitRoutes');
app.use('/api/organizations/:orgId/benefits', benefitRoutes);

const eligibilityRoutes = require('./routes/eligibilityRoutes');
app.use('/api/eligibility', eligibilityRoutes);

// PF-81: Reporting & Analytics API (Employer Utilization, Provider Analytics, Platform KPIs)
const reportingRoutes = require('./routes/reportingRoutes');
app.use('/api/reporting', reportingRoutes);
// ─────────────────────────────────────────────────────────────────────────────

// ─── Server Start ─────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(port, () => {
    console.log(`PolyFit Aggregator API server running on port ${port}`);
    console.log(`Health check available at http://localhost:${port}/health`);
  });
}

module.exports = app;
// ─────────────────────────────────────────────────────────────────────────────