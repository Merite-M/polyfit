import test from 'node:test';
import assert from 'node:assert/strict';

// Import pure JS cryptographic TOTP engine
import {
  generateClientTotp,
  getClientSecondsRemaining,
  createDynamicPassPayload,
  base64UrlEncode,
  TOTP_STEP_SECONDS,
} from '../src/services/totp.ts';

test('generateClientTotp produces valid 6-digit zero-padded numeric string', () => {
  const seed = 'polyfit_secure_totp_seed_2026_default';
  const now = 1710000000000;
  const token = generateClientTotp(seed, 30, now);

  assert.equal(typeof token, 'string');
  assert.equal(token.length, 6);
  assert.match(token, /^\d{6}$/);
});

test('generateClientTotp is idempotent within the same 30-second window', () => {
  const seed = 'polyfit_corporate_seed_secret';
  const baseTime = 1710000010000; // t = 10s
  const token1 = generateClientTotp(seed, 30, baseTime);
  const token2 = generateClientTotp(seed, 30, baseTime + 15000); // t = 25s (same 30s window)

  assert.equal(token1, token2);
});

test('generateClientTotp rotates to a new code across 30-second window boundaries', () => {
  const seed = 'polyfit_corporate_seed_secret';
  const baseTime = 1710000010000; // window 1
  const nextWindowTime = baseTime + 35000; // window 2 (+35s)
  const token1 = generateClientTotp(seed, 30, baseTime);
  const token2 = generateClientTotp(seed, 30, nextWindowTime);

  assert.notEqual(token1, token2);
});

test('getClientSecondsRemaining returns bounded countdown within [1, 30]', () => {
  const step = 30;
  for (let s = 0; s < 60; s++) {
    const timestamp = s * 1000;
    const remaining = getClientSecondsRemaining(step, timestamp);
    assert.ok(remaining >= 1 && remaining <= step, `Remaining ${remaining} should be in [1, 30]`);
  }
});

test('createDynamicPassPayload structures base64url payload with signature suffix', () => {
  const employeeId = 'emp-jean-mugisha-4091';
  const token = '482910';
  const payload = createDynamicPassPayload({
    employeeId,
    orgId: 'org-bk',
    token,
    offline: false,
  });

  assert.ok(payload.includes('.'), 'Dynamic QR pass must contain dot separator for payload.signature');
  const [encodedPart, sigPart] = payload.split('.');
  assert.ok(encodedPart.length > 20);
  assert.equal(sigPart.length, 16);

  // Decode base64url payload
  const padded = encodedPart.replace(/-/g, '+').replace(/_/g, '/');
  const jsonStr = Buffer.from(padded, 'base64').toString('utf-8');
  const data = JSON.parse(jsonStr);

  assert.equal(data.type, 'polyfit_totp_pass');
  assert.equal(data.employee_id, employeeId);
  assert.equal(data.org_id, 'org-bk');
  assert.equal(data.token, token);
  assert.equal(data.offline, false);
});

test('createDynamicPassPayload encodes offline=true flag for offline cryptographic vault', () => {
  const payload = createDynamicPassPayload({
    employeeId: 'emp-jean-mugisha-4091',
    token: '123456',
    offline: true,
  });

  const [encodedPart] = payload.split('.');
  const padded = encodedPart.replace(/-/g, '+').replace(/_/g, '/');
  const jsonStr = Buffer.from(padded, 'base64').toString('utf-8');
  const data = JSON.parse(jsonStr);

  assert.equal(data.offline, true);
  assert.ok(new Date(data.expires_at).getTime() > Date.now() - 5000);
});
