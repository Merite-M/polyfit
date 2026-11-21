const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const request = require('supertest');
const app = require('../index');
const {
  verifyPaypackWebhookSignature,
  processPaypackWebhook
} = require('../services/settlementService');

describe('Paypack B2B Cashout & Webhook HMAC Verification Test Suite', () => {
  const testSecret = 'test_paypack_webhook_secret_key_12345';

  test('verifyPaypackWebhookSignature validates authentic HMAC-SHA256 signature', () => {
    const payload = { ref: 'PP-CSH-TEST-001', status: 'successful', amount: 50000 };
    const payloadStr = JSON.stringify(payload);
    const validSignature = crypto.createHmac('sha256', testSecret).update(payloadStr).digest('hex');

    const isValid = verifyPaypackWebhookSignature(payload, validSignature, testSecret);
    assert.strictEqual(isValid, true, 'Valid signature must be verified as true');
  });

  test('verifyPaypackWebhookSignature rejects forged or tampered HMAC signature', () => {
    const payload = { ref: 'PP-CSH-TEST-001', status: 'successful', amount: 50000 };
    const forgedSignature = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    const isValid = verifyPaypackWebhookSignature(payload, forgedSignature, testSecret);
    assert.strictEqual(isValid, false, 'Forged signature must be rejected');
  });

  test('verifyPaypackWebhookSignature rejects missing signature header or secret', () => {
    assert.strictEqual(verifyPaypackWebhookSignature({ ref: '123' }, null, testSecret), false);
    assert.strictEqual(verifyPaypackWebhookSignature({ ref: '123' }, 'sig', null), false);
  });

  test('POST /api/settlements/webhook/paypack rejects invalid signature with 401', async () => {
    const origSecret = process.env.PAYPACK_WEBHOOK_SECRET;
    process.env.PAYPACK_WEBHOOK_SECRET = testSecret;

    try {
      const res = await request(app)
        .post('/api/settlements/webhook/paypack')
        .set('X-Paypack-Signature', 'invalid-tampered-signature')
        .send({ ref: 'PP-CSH-TEST-999', status: 'successful' });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.code, 'UNAUTHORIZED_WEBHOOK');
    } finally {
      process.env.PAYPACK_WEBHOOK_SECRET = origSecret;
    }
  });

  test('POST /api/settlements/webhook/paypack processes verified webhook event', async () => {
    const origSecret = process.env.PAYPACK_WEBHOOK_SECRET;
    process.env.PAYPACK_WEBHOOK_SECRET = testSecret;

    const payload = { ref: 'PP-NONEXISTENT-REF-001', status: 'successful' };
    const payloadStr = JSON.stringify(payload);
    const validSignature = crypto.createHmac('sha256', testSecret).update(payloadStr).digest('hex');

    try {
      const res = await request(app)
        .post('/api/settlements/webhook/paypack')
        .set('X-Paypack-Signature', validSignature)
        .send(payload);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    } finally {
      process.env.PAYPACK_WEBHOOK_SECRET = origSecret;
    }
  });
});
