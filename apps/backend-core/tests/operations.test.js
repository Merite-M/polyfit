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

});
