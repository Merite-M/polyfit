const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { safeCompare } = require('@polyfit/shared-utils');
const app = require('../index');

describe('Security Hardening: Constant-Time safeCompare & Secret Auth', () => {
  describe('safeCompare unit tests', () => {
    test('returns true for identical secret strings', () => {
      assert.equal(safeCompare('super-secret-token-1234', 'super-secret-token-1234'), true);
      assert.equal(safeCompare('polyfit_turnstile_relay_key_2026', 'polyfit_turnstile_relay_key_2026'), true);
    });

    test('returns false for mismatched strings of identical length', () => {
      assert.equal(safeCompare('super-secret-token-1234', 'super-secret-token-1235'), false);
    });

    test('returns false for mismatched strings of different length without throwing', () => {
      assert.equal(safeCompare('short', 'longer-secret-token'), false);
      assert.equal(safeCompare('longer-secret-token', 'short'), false);
    });

    test('returns false for empty strings', () => {
      assert.equal(safeCompare('', 'secret'), false);
      assert.equal(safeCompare('secret', ''), false);
      assert.equal(safeCompare('', ''), false);
    });

    test('returns false safely for non-string / non-buffer types without throwing', () => {
      assert.equal(safeCompare(null, 'secret'), false);
      assert.equal(safeCompare(undefined, 'secret'), false);
      assert.equal(safeCompare(12345, 'secret'), false);
      assert.equal(safeCompare({}, 'secret'), false);
      assert.equal(safeCompare('secret', null), false);
      assert.equal(safeCompare('secret', undefined), false);
    });

    test('supports Buffer comparisons safely in constant time', () => {
      const bufA = Buffer.from('secret-bytes');
      const bufB = Buffer.from('secret-bytes');
      const bufC = Buffer.from('different-b');
      assert.equal(safeCompare(bufA, bufB), true);
      assert.equal(safeCompare(bufA, bufC), false);
    });
  });

  describe('Integration: Turnstile Key constant-time verification', () => {
    test('POST /api/visits/turnstile-verify - rejects mismatched key with 401', async () => {
      const res = await request(app)
        .post('/api/visits/turnstile-verify')
        .set('X-PolyFit-Turnstile-Key', 'wrong-key-guess')
        .send({ employee_id: 'emp-123' });

      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'TURNSTILE_AUTH_INVALID');
    });

    test('POST /api/visits/turnstile-verify - accepts valid key via safeCompare', async () => {
      const configuredKey = process.env.TURNSTILE_API_KEY || 'polyfit_turnstile_relay_key_2026';
      const res = await request(app)
        .post('/api/visits/turnstile-verify')
        .set('X-PolyFit-Turnstile-Key', configuredKey)
        .send({ employee_id: 'emp-123' });

      // Valid turnstile authentication passes auth check (fails at missing fields, not 401)
      assert.notEqual(res.status, 401);
      assert.equal(res.status, 400);
      assert.equal(res.body.code, 'TURNSTILE_MISSING_FIELDS');
    });
  });

  describe('Integration: Cron Secret constant-time verification', () => {
    test('POST /api/cron/billing - rejects invalid cron secret', async () => {
      const res = await request(app)
        .post('/api/cron/billing')
        .set('X-Cron-Secret', 'invalid-cron-secret-123')
        .send({});

      // Either 503 (not configured) or 401 (unauthorized)
      assert.ok([401, 503].includes(res.status));
      if (res.status === 401) {
        assert.equal(res.body.code, 'CRON_UNAUTHORIZED');
      }
    });

    test('POST /api/cron/billing - accepts valid secret via safeCompare', async () => {
      const originalSecret = process.env.CRON_SECRET;
      process.env.CRON_SECRET = 'test-cron-secret-polyfit-2026';

      try {
        const res = await request(app)
          .post('/api/cron/billing')
          .set('X-Cron-Secret', 'test-cron-secret-polyfit-2026')
          .send({});

        // Auth passes; response is either 200 or 500/503 depending on database, but definitely not 401
        assert.notEqual(res.status, 401);
      } finally {
        if (originalSecret) {
          process.env.CRON_SECRET = originalSecret;
        } else {
          delete process.env.CRON_SECRET;
        }
      }
    });
  });
});
