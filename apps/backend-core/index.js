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
app.use(express.json());

// ─── Rate Limiters ───────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later', code: 'RATE_LIMIT_EXCEEDED' },
  skip: (req) => req.path.includes('/webhook') || req.path === '/health'
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
// New aggregator routes will be registered here as they are built:
// - /api/organizations  — Employer management
// - /api/providers      — Provider management
// - /api/employees      — Employee/beneficiary management
// - /api/benefits       — Benefit configuration
// - /api/eligibility    — Eligibility verification
// - /api/visits         — Visit tracking
// - /api/utilization    — Usage analytics
// - /api/settlements    — Provider settlement
// - /api/reporting      — Employer/provider reporting
// ─────────────────────────────────────────────────────────────────────────────

// ─── Server Start ─────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`PolyFit Aggregator API server running on port ${port}`);
  console.log(`Health check available at http://localhost:${port}/health`);
});
// ─────────────────────────────────────────────────────────────────────────────