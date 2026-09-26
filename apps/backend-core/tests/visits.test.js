const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../index');
const {
  deriveEmployeeSecret,
  generateTotp,
  verifyTotp,
  signPassPayload,
  verifySignedPassPayload,
  getSecondsRemainingInStep,
  getDistanceFromLatLonInM,
  DEFAULT_TIME_STEP_SECONDS
} = require('../services/totpService');

describe('Visit Verification Engine Test Suite (PF-79)', () => {
  // ─── 1. TOTP & Cryptography Service Tests ────────────────────────────────────
  test('deriveEmployeeSecret returns deterministic 32-byte Buffer', () => {
    const secret1 = deriveEmployeeSecret('emp-1234');
    const secret2 = deriveEmployeeSecret('emp-1234');
    const secret3 = deriveEmployeeSecret('emp-5678');

    assert.ok(Buffer.isBuffer(secret1));
    assert.equal(secret1.length, 32);
    assert.equal(secret1.toString('hex'), secret2.toString('hex'));
    assert.notEqual(secret1.toString('hex'), secret3.toString('hex'));
  });

  test('generateTotp produces valid 6-digit numeric string', () => {
    const secret = deriveEmployeeSecret('emp-test-01');
    const token = generateTotp(secret);

    assert.equal(typeof token, 'string');
    assert.equal(token.length, 6);
    assert.match(token, /^\d{6}$/);
  });

  test('verifyTotp correctly validates token within 30-sec window and grace period', () => {
    const secret = deriveEmployeeSecret('emp-test-02');
    const now = Date.now();
    const tokenNow = generateTotp(secret, 30, now);

    // Exact current step
    const resNow = verifyTotp(tokenNow, secret, 30, 1, now);
    assert.equal(resNow.valid, true);
    assert.equal(resNow.stepOffset, 0);

    // Previous step (-1 grace offset = 30 seconds ago)
    const tokenPast = generateTotp(secret, 30, now - 30 * 1000);
    const resPast = verifyTotp(tokenPast, secret, 30, 1, now);
    assert.equal(resPast.valid, true);
    assert.equal(resPast.stepOffset, -1);

    // Future step (+1 grace offset = 30 seconds ahead)
    const tokenFuture = generateTotp(secret, 30, now + 30 * 1000);
    const resFuture = verifyTotp(tokenFuture, secret, 30, 1, now);
    assert.equal(resFuture.valid, true);
    assert.equal(resFuture.stepOffset, 1);

    // Expired step (-3 steps = 90 seconds ago, outside grace)
    const tokenExpired = generateTotp(secret, 30, now - 90 * 1000);
    const resExpired = verifyTotp(tokenExpired, secret, 30, 1, now);
    assert.equal(resExpired.valid, false);

    // Completely bogus token
    const resBogus = verifyTotp('999999', secret, 30, 1, now);
    assert.equal(resBogus.valid, false);
  });

  test('signPassPayload & verifySignedPassPayload creates and validates tamper-proof QR payload', () => {
    const payload = {
      employee_id: 'emp-uuid-1',
      org_id: 'org-uuid-1',
      provider_location_id: 'loc-uuid-1',
      token: '123456',
      timestamp: Date.now()
    };

    const signed = signPassPayload(payload);
    assert.equal(typeof signed, 'string');
    assert.ok(signed.includes('.'));

    const decoded = verifySignedPassPayload(signed);
    assert.deepEqual(decoded, payload);

    // Tampered payload must fail verification
    const [encodedData, sig] = signed.split('.');
    const tamperedData = Buffer.from(
      JSON.stringify({ ...payload, employee_id: 'attacker-id' })
    ).toString('base64url');
    const tampered = `${tamperedData}.${sig}`;
    const failedDecoded = verifySignedPassPayload(tampered);
    assert.equal(failedDecoded, null);
  });

  test('getSecondsRemainingInStep returns value between 1 and timeStepSeconds', () => {
    const remaining = getSecondsRemainingInStep(30);
    assert.ok(remaining >= 1 && remaining <= 30);
  });

  test('getDistanceFromLatLonInM calculates accurate distances in meters', () => {
    // Kigali City Hall (-1.9536, 30.0605) to Kigali Heights (-1.9515, 30.0925) ~ 3.5 km
    const dist = getDistanceFromLatLonInM(-1.9536, 30.0605, -1.9515, 30.0925);
    assert.ok(dist > 3000 && dist < 4000);

    // Same point must be 0 meters
    const zeroDist = getDistanceFromLatLonInM(-1.9536, 30.0605, -1.9536, 30.0605);
    assert.equal(Math.round(zeroDist), 0);
  });

  // ─── 2. Endpoint Authorization & Validation Tests ───────────────────────────
  test('POST /api/visits/generate-pass - blocks unauthenticated access', async () => {
    const res = await request(app)
      .post('/api/visits/generate-pass')
      .send({ provider_location_id: 'a0000000-0000-0000-0000-000000000001' });

    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
  });

  test('POST /api/visits/verify - blocks unauthenticated access', async () => {
    const res = await request(app)
      .post('/api/visits/verify')
      .send({
        token: '123456',
        employee_id: 'a0000000-0000-0000-0000-000000000001',
        provider_location_id: 'b0000000-0000-0000-0000-000000000001'
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
  });

  test('POST /api/visits/manual-checkin - blocks unauthenticated access', async () => {
    const res = await request(app)
      .post('/api/visits/manual-checkin')
      .send({
        provider_location_id: 'b0000000-0000-0000-0000-000000000001',
        employee_id: 'a0000000-0000-0000-0000-000000000001',
        reason: 'Customer phone died'
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
  });

  test('POST /api/visits/123/dispute - blocks unauthenticated access', async () => {
    const res = await request(app)
      .post('/api/visits/123/dispute')
      .send({ reason: 'Dispute test' });

    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
  });

  test('PATCH /api/visits/123/dispute - blocks unauthenticated access', async () => {
    const res = await request(app)
      .patch('/api/visits/123/dispute')
      .send({ resolution: 'resolved_approved' });

    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
  });

  test('GET /api/visits - blocks unauthenticated access', async () => {
    const res = await request(app).get('/api/visits');
    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
  });

  test('GET /api/visits/123 - blocks unauthenticated access', async () => {
    const res = await request(app).get('/api/visits/123');
    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
  });
});
