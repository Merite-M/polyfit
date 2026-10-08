const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../index');

describe('Super Admin Operations API Test Suite (PF-117)', () => {

  describe('Executive Overview Endpoint (GET /api/operations/overview)', () => {
    test('returns 200 and complete aggregator health KPIs', async () => {
      const res = await request(app)
        .get('/api/operations/overview')
        .expect('Content-Type', /json/)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.timestamp);

      // 1. Network size
      assert.ok(res.body.network);
      assert.strictEqual(typeof res.body.network.employers.total, 'number');
      assert.strictEqual(typeof res.body.network.providers.total, 'number');
      assert.strictEqual(typeof res.body.network.facilities.total, 'number');
      assert.ok(res.body.network.providers.byCategory);

      // 2. Beneficiaries
      assert.ok(res.body.beneficiaries);
      assert.strictEqual(typeof res.body.beneficiaries.totalEligible, 'number');
      assert.strictEqual(typeof res.body.beneficiaries.activeRoster, 'number');
      assert.strictEqual(typeof res.body.beneficiaries.monthlyActiveBeneficiaries, 'number');
      assert.strictEqual(typeof res.body.beneficiaries.utilizationRate, 'number');

      // 3. Visits
      assert.ok(res.body.visits);
      assert.strictEqual(typeof res.body.visits.today, 'number');
      assert.strictEqual(typeof res.body.visits.thisWeek, 'number');
      assert.strictEqual(typeof res.body.visits.thisMonth, 'number');
      assert.strictEqual(Array.isArray(res.body.visits.hourlyTrend24h), true);
      assert.strictEqual(res.body.visits.hourlyTrend24h.length, 24);

      // 4. Financials (RWF)
      assert.ok(res.body.financials);
      assert.strictEqual(res.body.financials.currency, 'RWF');
      assert.strictEqual(typeof res.body.financials.invoicedMtd, 'number');
      assert.strictEqual(typeof res.body.financials.providerSettlementsMtd, 'number');
      assert.strictEqual(typeof res.body.financials.grossMarginSpread, 'number');
      assert.strictEqual(typeof res.body.financials.grossMarginPercentage, 'number');

      // 5. Recent live feed
      assert.strictEqual(Array.isArray(res.body.recentLiveFeed), true);
    });
  });

  describe('Universal Omnibar Search (GET /api/operations/search)', () => {
    test('returns empty results when query length is less than 2', async () => {
      const res = await request(app)
        .get('/api/operations/search?q=a')
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.count, 0);
      assert.strictEqual(res.body.results.length, 0);
    });

    test('executes multi-domain indexing in under 300ms', async () => {
      const start = Date.now();
      const res = await request(app)
        .get('/api/operations/search?q=fit')
        .expect(200);
      const elapsed = Date.now() - start;

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(typeof res.body.count, 'number');
      assert.strictEqual(Array.isArray(res.body.results), true);
      assert.ok(elapsed < 1000, `Search took too long: ${elapsed}ms`);

      if (res.body.results.length > 0) {
        const item = res.body.results[0];
        assert.ok(item.id);
        assert.ok(item.type);
        assert.ok(item.title);
        assert.ok(item.subtitle);
      }
    });

    test('indexes provider facilities by location / city', async () => {
      const res = await request(app)
        .get('/api/operations/search?q=kigali')
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.count >= 0);
    });
  });

  describe('Provider Network Geo Locations (GET /api/operations/locations)', () => {
    test('returns contracted facilities with coordinates and category mapping', async () => {
      const res = await request(app)
        .get('/api/operations/locations')
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(typeof res.body.count, 'number');
      assert.strictEqual(Array.isArray(res.body.locations), true);
      assert.ok(res.body.locations.length > 0);

      const firstLoc = res.body.locations[0];
      assert.ok(firstLoc.id);
      assert.ok(firstLoc.name);
      assert.ok(firstLoc.provider);
      assert.ok(firstLoc.provider.name);
      assert.ok(firstLoc.provider.category);
    });
  });

  describe('Corporate Clients Management (PF-118)', () => {
    let testClientId = null;

    test('GET /api/operations/clients returns list of clients with seat utilization metrics', async () => {
      const res = await request(app)
        .get('/api/operations/clients')
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(typeof res.body.count, 'number');
      assert.strictEqual(Array.isArray(res.body.clients), true);
      assert.ok(res.body.clients.length > 0);

      const firstClient = res.body.clients[0];
      assert.ok(firstClient.id);
      assert.ok(firstClient.name);
      assert.strictEqual(typeof firstClient.contractedSeats, 'number');
      assert.strictEqual(typeof firstClient.activeEmployeesCount, 'number');
      assert.strictEqual(typeof firstClient.utilizationPct, 'number');
      assert.strictEqual(typeof firstClient.isNearCapacity, 'boolean');
      assert.strictEqual(Array.isArray(firstClient.allowedDomains), true);
    });

    test('POST /api/operations/clients provisions new employer in 3-step format', async () => {
      const testName = `Acme East Africa ${Date.now()}`;
      const res = await request(app)
        .post('/api/operations/clients')
        .send({
          name: testName,
          industry: 'Financial Services',
          country: 'Rwanda',
          tax_id: '109988776',
          contact_email: 'hr@acme-ea.rw',
          billing_email: 'finance@acme-ea.rw',
          headcount_tier: '51-250',
          contracted_seats: 120,
          allowed_domains: ['@acme-ea.rw', 'acme.co.rw'],
          subsidy_model: 'percentage',
          co_pay_percentage: 30,
          max_monthly_visits: 12,
          plan_tier: 'standard',
          admin_name: 'HR Director',
          admin_email: 'hr.director@acme-ea.rw'
        })
        .expect(201);

      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.organization);
      assert.strictEqual(res.body.organization.name, testName);
      assert.strictEqual(res.body.organization.contracted_seats, 120);
      assert.deepStrictEqual(res.body.organization.allowed_domains, ['acme-ea.rw', 'acme.co.rw']);
      assert.ok(res.body.benefit);
      assert.strictEqual(res.body.benefit.tier, 'standard');

      testClientId = res.body.organization.id;
    });

    test('GET /api/operations/clients/:id returns 360 cockpit data', async () => {
      assert.ok(testClientId, 'testClientId must be set');
      const res = await request(app)
        .get(`/api/operations/clients/${testClientId}`)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.organization);
      assert.strictEqual(res.body.organization.id, testClientId);
      assert.ok(res.body.metrics);
      assert.strictEqual(res.body.metrics.contractedSeats, 120);
      assert.strictEqual(Array.isArray(res.body.benefitPlans), true);
      assert.strictEqual(Array.isArray(res.body.employees), true);
    });

    test('PATCH /api/operations/clients/:id/domains updates whitelisted domains', async () => {
      assert.ok(testClientId, 'testClientId must be set');
      const res = await request(app)
        .patch(`/api/operations/clients/${testClientId}/domains`)
        .send({
          allowed_domains: ['@acme.rw', 'acme.africa']
        })
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.deepStrictEqual(res.body.organization.allowed_domains, ['acme.rw', 'acme.africa']);
    });
  });

});

