const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../index');
const { requireRole, requireOrgAccess, requireProviderAccess } = require('../middleware/authMiddleware');

describe('Auth & RBAC Test Suite (PF-78)', () => {
  // ─── 1. Health Check ────────────────────────────────────────────────────────
  test('GET /health returns health status', async () => {
    const res = await request(app).get('/health');
    assert.ok([200, 503].includes(res.status));
    assert.ok(res.body.status);
    assert.ok(res.body.timestamp);
  });

  // ─── 2. Auth Endpoint Validation ────────────────────────────────────────────
  test('POST /api/auth/signup - rejects missing email and password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .set('x-skip-rate-limit', 'true')
      .send({});

    assert.equal(res.status, 400);
    assert.equal(res.body.code, 'AUTH_MISSING_CREDENTIALS');
  });

  test('POST /api/auth/signup - rejects invalid role', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .set('x-skip-rate-limit', 'true')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        role: 'invalid_gym_role'
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, 'AUTH_INVALID_ROLE');
    assert.ok(res.body.error.includes('Allowed roles: super_admin, polyfit_ops, org_admin, provider_admin, employee'));
  });

  test('POST /api/auth/signup - requires org_id for org_admin', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .set('x-skip-rate-limit', 'true')
      .send({
        email: 'orgadmin@example.com',
        password: 'Password123!',
        role: 'org_admin'
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, 'AUTH_ORG_REQUIRED');
  });

  test('POST /api/auth/signup - requires provider_id for provider_admin', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .set('x-skip-rate-limit', 'true')
      .send({
        email: 'provideradmin@example.com',
        password: 'Password123!',
        role: 'provider_admin'
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, 'AUTH_PROVIDER_REQUIRED');
  });

  test('POST /api/auth/login - rejects missing credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('x-skip-rate-limit', 'true')
      .send({ email: 'test@example.com' });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, 'AUTH_MISSING_CREDENTIALS');
  });

  test('POST /api/auth/magic-link - rejects missing email', async () => {
    const res = await request(app)
      .post('/api/auth/magic-link')
      .set('x-skip-rate-limit', 'true')
      .send({});

    assert.equal(res.status, 400);
    assert.equal(res.body.code, 'AUTH_MISSING_EMAIL');
  });

  test('POST /api/auth/refresh - rejects missing refresh_token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});

    assert.equal(res.status, 400);
    assert.equal(res.body.code, 'AUTH_MISSING_REFRESH_TOKEN');
  });

  test('POST /api/auth/password-reset - rejects missing email', async () => {
    const res = await request(app)
      .post('/api/auth/password-reset')
      .set('x-skip-rate-limit', 'true')
      .send({});

    assert.equal(res.status, 400);
    assert.equal(res.body.code, 'AUTH_MISSING_EMAIL');
  });

  test('POST /api/auth/accept-invite - rejects missing token and password', async () => {
    const res = await request(app)
      .post('/api/auth/accept-invite')
      .set('x-skip-rate-limit', 'true')
      .send({ token: 'abc' });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, 'AUTH_MISSING_FIELDS');
  });

  // ─── 3. Middleware requireAuth ──────────────────────────────────────────────
  test('GET /api/auth/me - blocks request without authorization header', async () => {
    const res = await request(app).get('/api/auth/me');
    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
  });

  test('GET /api/auth/me - blocks request with malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer ');
    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'AUTH_INVALID_TOKEN_FORMAT');
  });

  test('POST /api/auth/password-update - blocks unauthenticated access', async () => {
    const res = await request(app)
      .post('/api/auth/password-update')
      .send({ password: 'NewPassword123!' });
    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
  });

  test('POST /api/auth/invite - blocks unauthenticated access', async () => {
    const res = await request(app)
      .post('/api/auth/invite')
      .send({ email: 'new@example.com', role: 'employee' });
    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
  });

  test('POST /api/auth/logout - blocks unauthenticated access', async () => {
    const res = await request(app).post('/api/auth/logout');
    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
  });

  // ─── 4. Unit Test Middleware Helpers: requireRole & Scoping ─────────────────
  test('requireRole middleware blocks disallowed roles', () => {
    const middleware = requireRole('super_admin', 'polyfit_ops');
    let statusCalled = null;
    let jsonCalled = null;
    let nextCalled = false;

    const req = {
      user: { id: 'user-1' },
      roles: ['employee'],
      primaryRole: 'employee'
    };
    const res = {
      status: (s) => {
        statusCalled = s;
        return {
          json: (j) => {
            jsonCalled = j;
          }
        };
      }
    };
    const next = () => {
      nextCalled = true;
    };

    middleware(req, res, next);
    assert.equal(statusCalled, 403);
    assert.equal(jsonCalled.code, 'AUTH_FORBIDDEN_ROLE');
    assert.equal(nextCalled, false);
  });

  test('requireRole middleware allows authorized roles', () => {
    const middleware = requireRole('org_admin');
    let nextCalled = false;

    const req = {
      user: { id: 'user-2' },
      roles: ['org_admin'],
      primaryRole: 'org_admin'
    };
    const res = {};
    const next = () => {
      nextCalled = true;
    };

    middleware(req, res, next);
    assert.equal(nextCalled, true);
  });

  test('requireRole middleware super_admin bypasses any restriction', () => {
    const middleware = requireRole('provider_admin');
    let nextCalled = false;

    const req = {
      user: { id: 'super-user' },
      roles: ['super_admin'],
      primaryRole: 'super_admin'
    };
    const res = {};
    const next = () => {
      nextCalled = true;
    };

    middleware(req, res, next);
    assert.equal(nextCalled, true);
  });

  test('requireOrgAccess blocks access to other organizations for org_admin', () => {
    const middleware = requireOrgAccess((req) => req.params.orgId);
    let statusCalled = null;
    let jsonCalled = null;
    let nextCalled = false;

    const req = {
      user: { id: 'user-3' },
      roles: ['org_admin'],
      primaryRole: 'org_admin',
      orgId: 'org-aaa',
      params: { orgId: 'org-bbb' }
    };
    const res = {
      status: (s) => {
        statusCalled = s;
        return {
          json: (j) => {
            jsonCalled = j;
          }
        };
      }
    };
    const next = () => {
      nextCalled = true;
    };

    middleware(req, res, next);
    assert.equal(statusCalled, 403);
    assert.equal(jsonCalled.code, 'AUTH_FORBIDDEN_ORG');
    assert.equal(nextCalled, false);
  });

  test('requireOrgAccess allows super_admin and polyfit_ops cross-org access', () => {
    const middleware = requireOrgAccess((req) => req.params.orgId);
    let nextCalled = false;

    const req = {
      user: { id: 'ops-user' },
      roles: ['polyfit_ops'],
      primaryRole: 'polyfit_ops',
      orgId: null,
      params: { orgId: 'org-target' }
    };
    const res = {};
    const next = () => {
      nextCalled = true;
    };

    middleware(req, res, next);
    assert.equal(nextCalled, true);
  });

  test('requireProviderAccess blocks access to other providers for provider_admin', () => {
    const middleware = requireProviderAccess((req) => req.params.providerId);
    let statusCalled = null;
    let jsonCalled = null;
    let nextCalled = false;

    const req = {
      user: { id: 'user-4' },
      roles: ['provider_admin'],
      primaryRole: 'provider_admin',
      providerId: 'provider-111',
      params: { providerId: 'provider-222' }
    };
    const res = {
      status: (s) => {
        statusCalled = s;
        return {
          json: (j) => {
            jsonCalled = j;
          }
        };
      }
    };
    const next = () => {
      nextCalled = true;
    };

    middleware(req, res, next);
    assert.equal(statusCalled, 403);
    assert.equal(jsonCalled.code, 'AUTH_FORBIDDEN_PROVIDER');
    assert.equal(nextCalled, false);
  });

  // ─── 5. Rate Limiting ───────────────────────────────────────────────────────
  test('Rate limiting triggers 429 when exceeding 5 attempts on auth endpoint', async () => {
    // Send 5 requests to hit limit
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/signup')
        .set('x-enforce-rate-limit', 'true')
        .send({});
    }

    // 6th request must trigger rate limit
    const limitedRes = await request(app)
      .post('/api/auth/signup')
      .set('x-enforce-rate-limit', 'true')
      .send({});
    assert.equal(limitedRes.status, 429);
    assert.equal(limitedRes.body.code, 'AUTH_RATE_LIMIT_EXCEEDED');
  });
});
