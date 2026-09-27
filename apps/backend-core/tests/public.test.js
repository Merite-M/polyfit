const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../index');

describe('Public Lead & Demo Pipeline Test Suite (PF-88)', () => {
  describe('POST /api/public/demo - Validation & Security', () => {
    test('rejects request with missing company_name', async () => {
      const res = await request(app)
        .post('/api/public/demo')
        .send({
          contact_name: 'Test Contact',
          work_email: 'contact@corp.rw',
          phone: '+250788111222',
          company_size: '50-200'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.code, 'VALIDATION_ERROR');
      assert.match(res.body.error, /Company name is required/i);
    });

    test('rejects request with invalid email format', async () => {
      const res = await request(app)
        .post('/api/public/demo')
        .send({
          company_name: 'Acme Rwanda',
          contact_name: 'Test Contact',
          work_email: 'not-an-email',
          phone: '+250788111222',
          company_size: '50-200'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.code, 'VALIDATION_ERROR');
      assert.match(res.body.error, /valid work email/i);
    });

    test('rejects request with phone number under 8 digits', async () => {
      const res = await request(app)
        .post('/api/public/demo')
        .send({
          company_name: 'Acme Rwanda',
          contact_name: 'Test Contact',
          work_email: 'contact@acme.rw',
          phone: '12345',
          company_size: '50-200'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.code, 'VALIDATION_ERROR');
      assert.match(res.body.error, /phone number is required/i);
    });

    test('silently discards spam bots with honeypot field filled', async () => {
      const res = await request(app)
        .post('/api/public/demo')
        .send({
          company_name: 'Spam Bot LLC',
          contact_name: 'Bot Runner',
          work_email: 'bot@spam.com',
          phone: '+250788999888',
          company_size: '50-200',
          website_url_hp: 'http://spam-link.ru'
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    test('accepts valid demo request and inserts into demo_requests', async () => {
      const uniqueEmail = `hr-${Date.now()}@polyfit-client.rw`;
      const res = await request(app)
        .post('/api/public/demo')
        .send({
          company_name: 'Bank of Kigali Test Corp',
          contact_name: 'Corporate Benefits Lead',
          work_email: uniqueEmail,
          phone: '+250788123456',
          country: 'Rwanda',
          company_size: '200-500',
          interest_tier: 'Professional',
          message: 'Interested in wellness benefit for 350 staff members in Kigali and Musanze.'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.id);
      assert.match(res.body.message, /24 hours/i);
    });
  });

  describe('POST /api/public/lead - Legacy Compatibility', () => {
    test('accepts employer lead and returns 201 with id', async () => {
      const uniqueEmail = `lead-${Date.now()}@corp.rw`;
      const res = await request(app)
        .post('/api/public/lead')
        .send({
          type: 'employer',
          name: 'Jane Uwase',
          organization: 'Rwanda Tech Labs',
          email: uniqueEmail,
          phone: '+250788654321',
          employees: '50-200',
          message: 'Requesting pilot info'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.id);
    });
  });
});
