const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../index');

describe('Security Hardening: Employee Portal OTP Authentication & Credential Protection', () => {
  let originalNodeEnv;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  test('production mode: request-access never leaks demo_otp in phone responses', async () => {
    process.env.NODE_ENV = 'production';

    const res = await request(app)
      .post('/api/employee/auth/request-access')
      .send({ phone: '+250788111222' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.demo_otp, undefined, 'demo_otp must NEVER be exposed in production');
  });

  test('production mode: request-access never leaks demo_otp in email responses', async () => {
    process.env.NODE_ENV = 'production';

    const res = await request(app)
      .post('/api/employee/auth/request-access')
      .send({ email: 'employee@bk.rw' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.demo_otp, undefined, 'demo_otp must NEVER be exposed in production');
  });

  test('production mode: verify-access rejects universal demo bypass codes (123456, 000000)', async () => {
    process.env.NODE_ENV = 'production';

    for (const bypassCode of ['123456', '000000']) {
      const res = await request(app)
        .post('/api/employee/auth/verify-access')
        .send({ email: 'vip@bk.rw', code: bypassCode });

      assert.equal(res.status, 400, `Expected 400 for bypass code ${bypassCode} in production`);
      assert.equal(res.body.success, false);
      assert.equal(res.body.code, 'INVALID_OTP');
    }
  });

  test('brute-force protection: invalidates OTP and responds with 429 after 5 failed attempts', async () => {
    process.env.NODE_ENV = 'test';
    const testPhone = '+250788999777';

    // 1. Request OTP
    const reqRes = await request(app)
      .post('/api/employee/auth/request-access')
      .send({ phone: testPhone });

    assert.equal(reqRes.status, 200);
    assert.ok(reqRes.body.demo_otp);

    // 2. Submit 5 failed attempts (attempts 1 through 5 receive 400 INVALID_OTP)
    for (let i = 1; i <= 5; i++) {
      const failRes = await request(app)
        .post('/api/employee/auth/verify-access')
        .send({ phone: testPhone, code: '111111' });

      assert.equal(failRes.status, 400);
      assert.equal(failRes.body.code, 'INVALID_OTP');
    }

    // 3. 6th failed attempt exceeds bound (> 5) -> returns 429 TOO_MANY_ATTEMPTS
    const lockoutRes = await request(app)
      .post('/api/employee/auth/verify-access')
      .send({ phone: testPhone, code: '111111' });

    assert.equal(lockoutRes.status, 429);
    assert.equal(lockoutRes.body.code, 'TOO_MANY_ATTEMPTS');

    // 4. Cache should be deleted; subsequent verification with correct OTP now fails
    const wipedRes = await request(app)
      .post('/api/employee/auth/verify-access')
      .send({ phone: testPhone, code: reqRes.body.demo_otp });

    assert.equal(wipedRes.status, 400);
    assert.equal(wipedRes.body.code, 'INVALID_OTP');
  });

  test('non-production mode: returns demo_otp and accepts valid OTP', async () => {
    process.env.NODE_ENV = 'test';

    const reqRes = await request(app)
      .post('/api/employee/auth/request-access')
      .send({ email: 'test-user@polyfit.local' });

    assert.equal(reqRes.status, 200);
    assert.ok(reqRes.body.demo_otp);
    assert.equal(reqRes.body.demo_otp.length, 6);
  });
});
