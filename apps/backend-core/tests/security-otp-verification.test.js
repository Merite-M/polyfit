const { test, describe, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../index');

describe('Security Hardening: Employee Portal OTP Verification', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  test('universal demo OTP codes (123456, 000000) are strictly rejected in production', async () => {
    process.env.NODE_ENV = 'production';

    const testEmail = 'sec-test@bankofkigali.rw';
    const res = await request(app)
      .post('/api/employee/auth/verify-access')
      .send({ email: testEmail, code: '123456' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'INVALID_OTP');

    const res2 = await request(app)
      .post('/api/employee/auth/verify-access')
      .send({ email: testEmail, code: '000000' });

    assert.equal(res2.status, 400);
    assert.equal(res2.body.success, false);
    assert.equal(res2.body.code, 'INVALID_OTP');
  });

  test('bounds OTP verification attempts to 5 and invalidates cached OTP upon exceeding limit', async () => {
    const testPhone = '+250788999888';

    // 1. Request OTP
    const reqRes = await request(app)
      .post('/api/employee/auth/request-access')
      .send({ phone: testPhone });

    assert.equal(reqRes.status, 200);
    assert.equal(reqRes.body.success, true);
    const validOtp = reqRes.body.demo_otp;
    assert.ok(validOtp, 'Expected generated OTP to be returned in test/dev environment');

    // 2. Submit 5 incorrect attempts
    for (let i = 1; i <= 5; i++) {
      const failRes = await request(app)
        .post('/api/employee/auth/verify-access')
        .send({ phone: testPhone, code: '999999' });

      assert.equal(failRes.status, 400);
      assert.equal(failRes.body.code, 'INVALID_OTP');
    }

    // 3. The 6th attempt should trigger 429 Too Many Requests & invalidation
    const lockoutRes = await request(app)
      .post('/api/employee/auth/verify-access')
      .send({ phone: testPhone, code: '999999' });

    assert.equal(lockoutRes.status, 429);
    assert.equal(lockoutRes.body.code, 'OTP_MAX_ATTEMPTS_EXCEEDED');

    // 4. Submitting the previously valid OTP must now fail because cache was invalidated
    const postLockoutRes = await request(app)
      .post('/api/employee/auth/verify-access')
      .send({ phone: testPhone, code: validOtp });

    assert.equal(postLockoutRes.status, 400);
    assert.equal(postLockoutRes.body.code, 'INVALID_OTP');
  });
});
