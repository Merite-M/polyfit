const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../index');

describe('CORS Policy Security Test Suite', () => {
  test('allows requests with no Origin header (server-to-server / mobile)', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
  });

  test('allows requests from http://localhost:3000', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:3000');

    assert.equal(res.status, 200);
    assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:3000');
    assert.equal(res.headers['access-control-allow-credentials'], 'true');
  });

  test('allows requests from https://polyfit.onrender.com', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'https://polyfit.onrender.com');

    assert.equal(res.status, 200);
    assert.equal(res.headers['access-control-allow-origin'], 'https://polyfit.onrender.com');
    assert.equal(res.headers['access-control-allow-credentials'], 'true');
  });

  test('blocks requests from unconfigured subdomains (e.g. polyfit-preview-123.onrender.com)', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'https://polyfit-preview-123.onrender.com');

    assert.equal(res.status, 200);
    assert.equal(res.headers['access-control-allow-origin'], undefined);
  });

  test('blocks requests from arbitrary onrender.com domains (e.g. attacker.onrender.com)', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'https://attacker.onrender.com');

    assert.equal(res.status, 200);
    assert.equal(res.headers['access-control-allow-origin'], undefined);
  });

  test('blocks requests from unauthorized external origins (e.g. http://evil.com)', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://evil.com');

    assert.equal(res.status, 200);
    assert.equal(res.headers['access-control-allow-origin'], undefined);
  });

  test('handles preflight OPTIONS request correctly for allowed origin', async () => {
    const res = await request(app)
      .options('/api/public/platform-config')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET');

    assert.equal(res.status, 200);
    assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:3000');
  });

  test('blocks preflight OPTIONS request for unauthorized origin', async () => {
    const res = await request(app)
      .options('/api/public/platform-config')
      .set('Origin', 'http://unauthorized-domain.com')
      .set('Access-Control-Request-Method', 'GET');

    assert.equal(res.headers['access-control-allow-origin'], undefined);
  });
});
