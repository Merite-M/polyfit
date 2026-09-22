const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { rateLimit } = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const { getLiveOccupancy, getDistanceFromLatLonInM } = require('@polyfit/shared-utils');
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

// ─── Health Check Endpoint ───────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    let dbStatus = 'disconnected';
    if (supabase) {
      const { error } = await supabase.from('organizations').select('id').limit(1);
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

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn("Supabase credentials not found, endpoints using supabase will fail.");
}

const eventEmitter = require("./events");
const upload = multer({ storage: multer.memoryStorage() });

// NOTE: Gym-specific routes removed during PolyFit pivot to corporate wellness aggregator
// Infrastructure kept: auth, events, sync, communications (to be adapted)
// Removed: pos, staff, membership_holds, calendar, iot, member-crm, contracts, tier_proration, staff_tasks, drip_engine, waivers, checkin

const initCron = require("./cron");

const adminRoutes = require("./admin");
app.use("/api/admin", adminRoutes);

const paymentsRoutes = require("./payments");
app.use("/api/payments", paymentsRoutes);

const publicRoutes = require("./public");
app.use("/api/public", publicRoutes);
app.use("/widgets", publicRoutes);

const syncRoutes = require("./sync");
app.use("/api/sync", syncRoutes);

const corporateRoutes = require("./corporate");
app.use("/api/corporate", corporateRoutes);

const communicationsRoutes = require("./communications");
app.use("/api/communications", communicationsRoutes);

initCron(supabase);

// ─── Server Start ─────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`PolyFit Aggregator API server running on port ${port}`);
  console.log(`Health check available at http://localhost:${port}/health`);
});
// ─────────────────────────────────────────────────────────────────────────────