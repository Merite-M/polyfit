const { test, describe, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../index');

describe('Security Hardening: Employee Portal OTP Authentication (PF-Sentinel)', () => {
  const origEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = origEnv;
  });

  test('POST /api/employee/auth/verify-access rejects universal demo OTP (123456) in production', async () => {
    process.env.NODE_ENV = 'production';

    const res = await request(app)
      .post('/api/employee/auth/verify-access')
      .send({
        email: 'victim.employee@bankofkigali.rw',
        code: '123456'
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'INVALID_OTP');
  });

  test('POST /api/employee/auth/verify-access rejects universal demo OTP (000000) in production', async () => {
    process.env.NODE_ENV = 'production';

    const res = await request(app)
      .post('/api/employee/auth/verify-access')
      .send({
        email: 'victim.employee@bankofkigali.rw',
        code: '000000'
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'INVALID_OTP');
  });

  test('POST /api/employee/auth/verify-access allows universal demo OTP in non-production for local/demo testing', async () => {
    process.env.NODE_ENV = 'development';

    const res = await request(app)
      .post('/api/employee/auth/verify-access')
      .send({
        email: 'test.user@bankofkigali.rw',
        code: '123456'
      });

    // In dev, 123456 is recognized as valid OTP; proceeds to session creation (200 or DB 500/503 depending on live DB)
    assert.notEqual(res.body.code, 'INVALID_OTP');
  });

  test('POST /api/employee/auth/verify-access locks out after 5 consecutive failed attempts with 429', async () => {
    process.env.NODE_ENV = 'production';
    const testEmail = `bruteforce.target.${Date.now()}@example.rw`;

    // 1. Request access to seed a real OTP in otpCache
    await request(app)
      .post('/api/employee/auth/request-access')
      .send({ email: testEmail });

    // 2. Submit 4 wrong attempts -> each returns 400 INVALID_OTP
    for (let i = 0; i < 4; i++) {
      const failRes = await request(app)
        .post('/api/employee/auth/verify-access')
        .send({ email: testEmail, code: `99999${i}` });
      assert.equal(failRes.status, 400);
      assert.equal(failRes.body.code, 'INVALID_OTP');
    }

    // 3. 5th wrong attempt triggers brute-force lockout (429 AUTH_RATE_LIMIT_EXCEEDED)
    const lockoutRes = await request(app)
      .post('/api/employee/auth/verify-access')
      .send({ email: testEmail, code: '999999' });

    assert.equal(lockoutRes.status, 429);
    assert.equal(lockoutRes.body.code, 'AUTH_RATE_LIMIT_EXCEEDED');
    assert.ok(lockoutRes.body.error.includes('Too many failed verification attempts'));
  });
});
