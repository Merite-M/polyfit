const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { optionalAuth, requireAuth } = require('../middleware/authMiddleware');

describe('Security Hardening: optionalAuth & Demo Tokens', () => {
  test('optionalAuth sets req.user to null and req.roles to [] when no token provided', async () => {
    const req = { headers: {} };
    const res = {};
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    await optionalAuth(req, res, next);

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user, null);
    assert.deepStrictEqual(req.roles, []);
    assert.strictEqual(req.primaryRole, null);
  });

  test('optionalAuth sets req.user to null and req.roles to [] when invalid bearer token provided', async () => {
    const req = { headers: { authorization: 'Bearer invalid-junk-token-123' } };
    const res = {};
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    await optionalAuth(req, res, next);

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user, null);
    assert.deepStrictEqual(req.roles, []);
    assert.strictEqual(req.primaryRole, null);
  });

  test('requireAuth rejects demo tokens when NODE_ENV is production', async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const req = { headers: { authorization: 'Bearer demo-super-admin-token' } };
    let statusCode = null;
    let responseBody = null;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseBody = data;
        return this;
      }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    try {
      await requireAuth(req, res, next);
      assert.strictEqual(nextCalled, false);
      assert.ok([401, 503].includes(statusCode), `Expected 401 or 503, got ${statusCode}`);
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });
});
