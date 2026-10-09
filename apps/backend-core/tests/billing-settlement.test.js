const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { describe, it, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');

// ─── Mock Supabase ────────────────────────────────────────────────────────────
// We mock the supabase client at the service level to test business logic
// without hitting the live database.

const mockSupabase = {
  from: () => mockSupabase,
  select: () => mockSupabase,
  insert: () => mockSupabase,
  update: () => mockSupabase,
  delete: () => mockSupabase,
  eq: () => mockSupabase,
  in: () => mockSupabase,
  gte: () => mockSupabase,
  lte: () => mockSupabase,
  lt: () => mockSupabase,
  like: () => mockSupabase,
  order: () => mockSupabase,
  range: () => mockSupabase,
  single: () => mockSupabase,
  maybeSingle: () => mockSupabase,
};

// ─── Billing Service Unit Tests ───────────────────────────────────────────────

describe('Billing Service - Invoice Status Transitions', () => {
  const { INVOICE_STATUS_TRANSITIONS } = require('../services/billingService');

  it('should define valid transitions from draft', () => {
    assert.deepStrictEqual(INVOICE_STATUS_TRANSITIONS.draft, ['sent']);
  });

  it('should define valid transitions from sent', () => {
    const transitions = INVOICE_STATUS_TRANSITIONS.sent;
    assert.ok(transitions.includes('paid'));
    assert.ok(transitions.includes('overdue'));
    assert.ok(transitions.includes('disputed'));
  });

  it('should define valid transitions from overdue', () => {
    const transitions = INVOICE_STATUS_TRANSITIONS.overdue;
    assert.ok(transitions.includes('paid'));
    assert.ok(transitions.includes('disputed'));
  });

  it('should define valid transitions from disputed', () => {
    const transitions = INVOICE_STATUS_TRANSITIONS.disputed;
    assert.ok(transitions.includes('sent'));
    assert.ok(transitions.includes('paid'));
  });

  it('should not allow transition from paid (terminal state)', () => {
    assert.strictEqual(INVOICE_STATUS_TRANSITIONS.paid, undefined);
  });
});

describe('Billing Service - VAT Rate', () => {
  const { VAT_RATE } = require('../services/billingService');

  it('should use 18% VAT rate for Rwanda', () => {
    assert.strictEqual(VAT_RATE, 0.18);
  });

  it('should calculate correct tax for a known amount', () => {
    const subtotal = 100000; // 100,000 RWF
    const tax = parseFloat((subtotal * VAT_RATE).toFixed(2));
    assert.strictEqual(tax, 18000);
  });

  it('should produce correct total with tax', () => {
    const subtotal = 50000;
    const tax = parseFloat((subtotal * VAT_RATE).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));
    assert.strictEqual(total, 59000);
  });
});

// ─── Settlement Service Unit Tests ────────────────────────────────────────────

describe('Settlement Service - Status Transitions', () => {
  const { SETTLEMENT_STATUS_TRANSITIONS } = require('../services/settlementService');

  it('should define valid transitions from pending', () => {
    assert.deepStrictEqual(SETTLEMENT_STATUS_TRANSITIONS.pending, ['processing']);
  });

  it('should define valid transitions from processing', () => {
    const transitions = SETTLEMENT_STATUS_TRANSITIONS.processing;
    assert.ok(transitions.includes('paid'));
    assert.ok(transitions.includes('failed'));
  });

  it('should allow retry from failed', () => {
    assert.deepStrictEqual(SETTLEMENT_STATUS_TRANSITIONS.failed, ['processing']);
  });

  it('should not allow transition from paid (terminal state)', () => {
    assert.strictEqual(SETTLEMENT_STATUS_TRANSITIONS.paid, undefined);
  });
});

// ─── Route-Level Tests ────────────────────────────────────────────────────────

describe('Billing Routes - Input Validation', () => {
  const request = require('supertest');
  const app = require('../index');

  it('should reject generate request without auth', async () => {
    const res = await request(app)
      .post('/api/billing/generate')
      .send({ org_id: 'test', period_start: '2026-01-01', period_end: '2026-01-31' });

    assert.strictEqual(res.status, 401);
    assert.ok(res.body.code);
  });

  it('should reject cron billing without cron secret', async () => {
    const res = await request(app)
      .post('/api/cron/billing')
      .send({});

    // Should be 401 (no secret) or 503 (secret not configured)
    assert.ok([401, 503].includes(res.status));
  });

  it('should reject cron settlements without cron secret', async () => {
    const res = await request(app)
      .post('/api/cron/settlements')
      .send({});

    assert.ok([401, 503].includes(res.status));
  });

  it('should reject cron overdue-check without cron secret', async () => {
    const res = await request(app)
      .post('/api/cron/overdue-check')
      .send({});

    assert.ok([401, 503].includes(res.status));
  });

  it('should reject billing summary without auth', async () => {
    const res = await request(app)
      .get('/api/billing/summary?org_id=test-org');

    assert.strictEqual(res.status, 401);
  });

  it('should reject invoice audit trail request without auth', async () => {
    const res = await request(app)
      .get('/api/billing/invoices/test-inv-id/audit-trail');

    assert.strictEqual(res.status, 401);
  });

  it('should reject invoice audit CSV export without auth', async () => {
    const res = await request(app)
      .get('/api/billing/invoices/test-inv-id/export-audit');

    assert.strictEqual(res.status, 401);
  });

  it('should reject dispute submission without auth', async () => {
    const res = await request(app)
      .post('/api/billing/invoices/test-inv-id/dispute')
      .send({ reason: 'Duplicate visit' });

    assert.strictEqual(res.status, 401);
  });
});

describe('Settlement Routes - Input Validation', () => {
  const request = require('supertest');
  const app = require('../index');

  it('should reject generate request without auth', async () => {
    const res = await request(app)
      .post('/api/settlements/generate')
      .send({ period_start: '2026-01-01', period_end: '2026-01-31' });

    assert.strictEqual(res.status, 401);
  });

  it('should reject list without auth', async () => {
    const res = await request(app)
      .get('/api/settlements');

    assert.strictEqual(res.status, 401);
  });
});

describe('Health Check', () => {
  const request = require('supertest');
  const app = require('../index');

  it('should return health status', async () => {
    const res = await request(app).get('/health');
    assert.ok([200, 503].includes(res.status));
    assert.ok(res.body.status);
    assert.ok(res.body.timestamp);
  });
});

// ─── PF-121 Operations Finance Integration Tests ──────────────────────────────

describe('PF-121: Operations Marketplace Finance Endpoints', () => {
  const request = require('supertest');
  const app = require('../index');

  it('GET /api/operations/finance/overview should return financial ticker metrics', async () => {
    const res = await request(app).get('/api/operations/finance/overview');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.success);
    assert.strictEqual(res.body.currency, 'RWF');
    assert.ok(res.body.ticker);
    assert.ok(res.body.ticker.grossInvoicedGmv >= 0);
    assert.ok(res.body.ticker.providerPayoutLiabilities >= 0);
    assert.ok(typeof res.body.ticker.netGrossMarginSpread === 'number');
    assert.ok(typeof res.body.ticker.netGrossMarginPercentage === 'number');
  });

  it('GET /api/operations/finance/invoices should return paginated invoices list', async () => {
    const res = await request(app).get('/api/operations/finance/invoices?page=1&limit=10');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.success);
    assert.ok(Array.isArray(res.body.invoices));
    assert.ok(typeof res.body.total === 'number');
  });

  it('GET /api/operations/finance/settlements should return settlements list', async () => {
    const res = await request(app).get('/api/operations/finance/settlements?page=1&limit=10');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.success);
    assert.ok(Array.isArray(res.body.settlements));
    assert.ok(typeof res.body.total === 'number');
  });

  it('GET /api/operations/finance/ledger should return margin ledger by employer and category', async () => {
    const res = await request(app).get('/api/operations/finance/ledger');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.success);
    assert.ok(Array.isArray(res.body.employerLedger));
    assert.ok(Array.isArray(res.body.categoryLedger));
  });

  it('GET /api/operations/finance/disbursements?type=momo should return valid CSV', async () => {
    const res = await request(app).get('/api/operations/finance/disbursements?type=momo');
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers['content-type'].includes('text/csv'));
    assert.ok(res.text.includes('Phone Number'));
    assert.ok(res.text.includes('Amount (RWF)'));
  });

  it('GET /api/operations/finance/disbursements?type=bank should return valid CSV', async () => {
    const res = await request(app).get('/api/operations/finance/disbursements?type=bank');
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers['content-type'].includes('text/csv'));
    assert.ok(res.text.includes('Beneficiary Account Number'));
    assert.ok(res.text.includes('SWIFT / BIC Code'));
  });

  it('POST /api/operations/finance/billing-run should require date period', async () => {
    const res = await request(app)
      .post('/api/operations/finance/billing-run')
      .send({});
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.code, 'OPERATIONS_BILLING_RUN_FAILED');
  });

  it('POST /api/operations/finance/settlement-run should require date period', async () => {
    const res = await request(app)
      .post('/api/operations/finance/settlement-run')
      .send({});
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.code, 'OPERATIONS_SETTLEMENT_RUN_FAILED');
  });
});
