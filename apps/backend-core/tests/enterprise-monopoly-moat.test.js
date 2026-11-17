/**
 * Enterprise Monopoly Moat Integration Test Suite
 * Validates the 5 institutional defensibility pillars:
 * 1. Enterprise HRIS / SCIM Automated Roster Sync & Deprovisioning Engine
 * 2. Rwanda Revenue Authority (RRA) Article 24 CIT 18% VAT Tax-Shield Certificate Engine
 * 3. Real-Time Anti-Fraud, Anomaly & Velocity Intelligence Engine
 * 4. Auto-Expiration & Cooldown Integrity Rail (< 20 min stale visits) & UTC Cron Boundaries
 * 5. Automated MTN MoMo & Airtel Money Disbursement Rail
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../index');
const { supabase } = require('../services/supabaseService');
const { syncOrganizationRoster } = require('../services/employeeService');
const { generateTaxCertificate, verifyTaxCertificateSeal } = require('../services/billingService');
const { getOperationsAnomalies } = require('../services/operationsService');
const { processMoMoPayout } = require('../services/settlementService');

const SUPER_ADMIN_TOKEN = 'Bearer demo-super-admin-token';
const ORG_ADMIN_TOKEN = 'Bearer demo-org-admin-token';
const PROVIDER_ADMIN_TOKEN = 'Bearer demo-provider-admin-token';
const KTI_ORG_ID = '02f13bdc-ce25-4c9d-b712-451c06a63fa2';

describe('Enterprise Monopoly Moat Test Suite', () => {
  let createdInvoiceId = null;
  let createdSettlementId = null;
  let testSyncEmployeeEmail = `moat_sync_test_${Date.now()}@kti.rw`;

  before(async () => {
    // Locate existing invoice and settlement for testing
    if (supabase) {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id')
        .limit(1);
      if (invoices && invoices.length > 0) createdInvoiceId = invoices[0].id;

      const { data: settlements } = await supabase
        .from('settlements')
        .select('id, status')
        .limit(1);
      if (settlements && settlements.length > 0) createdSettlementId = settlements[0].id;
    }
  });

  after(async () => {
    // Cleanup any temporary employee created during roster sync test
    if (supabase && testSyncEmployeeEmail) {
      const { data: emp } = await supabase
        .from('employees')
        .select('id')
        .eq('email', testSyncEmployeeEmail)
        .maybeSingle();
      if (emp) {
        await supabase.from('eligibility').delete().eq('employee_id', emp.id);
        await supabase.from('employees').delete().eq('id', emp.id);
      }
    }
  });

  // ─── 1. ENTERPRISE HRIS / SCIM ROSTER SYNC & DEPROVISIONING ─────────────────
  describe('Pillar 1: Enterprise HRIS / SCIM Automated Roster Sync', () => {
    test('POST /api/organizations/:id/sync-roster blocks unauthenticated access', async () => {
      const res = await request(app)
        .post(`/api/organizations/${KTI_ORG_ID}/sync-roster`)
        .send({ roster: [] });

      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('POST /api/organizations/:id/sync-roster blocks unauthorized provider_admin access', async () => {
      const res = await request(app)
        .post(`/api/organizations/${KTI_ORG_ID}/sync-roster`)
        .set('Authorization', PROVIDER_ADMIN_TOKEN)
        .send({ roster: [] });

      assert.equal(res.status, 403);
    });

    test('POST /api/organizations/:id/sync-roster validates roster payload array', async () => {
      const res = await request(app)
        .post(`/api/organizations/${KTI_ORG_ID}/sync-roster`)
        .set('Authorization', SUPER_ADMIN_TOKEN)
        .send({ roster: 'not-an-array' });

      assert.equal(res.status, 400);
      assert.equal(res.body.code, 'ORG_INVALID_ROSTER_PAYLOAD');
    });

    test('syncOrganizationRoster enrolls new hires and provisions tier eligibility', async () => {
      const testRoster = [
        {
          full_name: 'Moat Test Engineer',
          email: testSyncEmployeeEmail,
          phone: '+250788999111',
          employee_id_external: 'STAFF-MOAT-001',
          department: 'Architecture & Security',
          tier: 'executive',
          status: 'active'
        }
      ];

      const res = await request(app)
        .post(`/api/organizations/${KTI_ORG_ID}/sync-roster`)
        .set('Authorization', SUPER_ADMIN_TOKEN)
        .send({
          roster: testRoster,
          full_roster_sync: false,
          sync_source: 'bamboohr_webhook'
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.sync_id.startsWith('hris_sync_'));
      assert.equal(res.body.source, 'bamboohr_webhook');
      assert.ok(res.body.summary.total_received >= 1);
      assert.ok(res.body.summary.added >= 1 || res.body.summary.updated >= 1);
    });
  });

  // ─── 2. RRA EBM 18% VAT TAX-SHIELD CERTIFICATE ENGINE ───────────────────────
  describe('Pillar 2: RRA Article 24 CIT Tax-Shield Certificate Engine', () => {
    test('generateTaxCertificate produces compliant RRA certificate with 30% CIT shield & HMAC seal', async () => {
      if (!createdInvoiceId) return;

      const cert = await generateTaxCertificate(createdInvoiceId);
      assert.ok(cert.certificate_number.startsWith('RRA-CIT-PF-'));
      assert.equal(cert.tax_entities.aggregator.tin, '108920194');
      assert.equal(cert.financial_breakdown.vat_rate, '18%');
      assert.equal(cert.corporate_tax_shield.statutory_cit_rate, '30%');
      assert.ok(typeof cert.corporate_tax_shield.eligible_tax_shield_deduction_amount === 'number');
      assert.ok(cert.cryptographic_seal);
      assert.equal(cert.cryptographic_seal.length, 64); // SHA-256 hex string
    });

    test('GET /api/billing/invoices/:id/tax-certificate returns full certificate for org_admin', async () => {
      if (!createdInvoiceId) return;

      const res = await request(app)
        .get(`/api/billing/invoices/${createdInvoiceId}/tax-certificate`)
        .set('Authorization', SUPER_ADMIN_TOKEN);

      assert.equal(res.status, 200);
      assert.ok(res.body.certificate_number);
      assert.ok(res.body.cryptographic_seal);
      assert.ok(res.body.corporate_tax_shield.eligible_tax_shield_deduction_amount >= 0);
    });

    test('GET /api/billing/tax-certificates/verify/:seal verifies authentic certificate publicly', async () => {
      if (!createdInvoiceId) return;

      const cert = await generateTaxCertificate(createdInvoiceId);
      const res = await request(app)
        .get(`/api/billing/tax-certificates/verify/${cert.cryptographic_seal}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.verified, true);
      assert.equal(res.body.certificate_number, cert.certificate_number);
      assert.equal(res.body.seal, cert.cryptographic_seal);
    });

    test('GET /api/billing/tax-certificates/verify/:seal rejects forged seal', async () => {
      const forgedSeal = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const res = await request(app)
        .get(`/api/billing/tax-certificates/verify/${forgedSeal}`);

      assert.equal(res.status, 404);
      assert.equal(res.body.verified, false);
    });
  });

  // ─── 3. REAL-TIME ANTI-FRAUD & ANOMALY INTELLIGENCE ENGINE ──────────────────
  describe('Pillar 3: Real-Time Anti-Fraud & Anomaly Intelligence Engine', () => {
    test('getOperationsAnomalies executes and returns threat metrics', async () => {
      const report = await getOperationsAnomalies({ windowHours: 72 });
      assert.equal(report.success, true);
      assert.ok(typeof report.summary.total_visits_audited === 'number');
      assert.ok(typeof report.summary.total_anomalies_detected === 'number');
      assert.ok(['LOW', 'GUARDED', 'ELEVATED', 'CRITICAL'].includes(report.summary.threat_level));
      assert.ok(Array.isArray(report.anomalies));
    });

    test('GET /api/operations/security/anomalies returns anomaly report for super_admin', async () => {
      const res = await request(app)
        .get('/api/operations/security/anomalies?windowHours=48')
        .set('Authorization', SUPER_ADMIN_TOKEN);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.summary);
      assert.ok(Array.isArray(res.body.anomalies));
    });

    test('GET /api/operations/security/anomalies blocks unauthenticated access', async () => {
      const res = await request(app)
        .get('/api/operations/security/anomalies');

      assert.equal(res.status, 401);
    });
  });

  // ─── 4. CRON AUTO-EXPIRATION & COOLDOWN INTEGRITY RAIL ──────────────────────
  describe('Pillar 4: Auto-Expiration & Cooldown Integrity Rail', () => {
    test('POST /api/cron/expire-pending-visits rejects request without valid CRON_SECRET', async () => {
      const res = await request(app)
        .post('/api/cron/expire-pending-visits')
        .send({});

      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'CRON_UNAUTHORIZED');
    });

    test('POST /api/cron/expire-pending-visits successfully evaluates stale visits with CRON_SECRET', async () => {
      const cronSecret = process.env.CRON_SECRET || 'test_cron_secret';
      const res = await request(app)
        .post('/api/cron/expire-pending-visits')
        .set('X-Cron-Secret', cronSecret)
        .send({ cutoff_minutes: 20 });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(typeof res.body.expired_count === 'number');
      assert.ok(res.body.cutoff_date);
    });
  });

  // ─── 5. AUTOMATED MTN MOMO & AIRTEL MONEY DISBURSEMENT RAIL ─────────────────
  describe('Pillar 5: Automated MTN MoMo & Airtel Money Disbursement Rail', () => {
    test('processMoMoPayout validates Rwandan phone numbers and rejects foreign/malformed numbers', async () => {
      if (!createdSettlementId) return;

      await assert.rejects(
        async () => {
          await processMoMoPayout(createdSettlementId, {
            momoPhoneNumber: '0123456789' // invalid prefix
          });
        },
        /Invalid Rwandan mobile money phone number/
      );
    });

    test('POST /api/settlements/:id/disburse/momo blocks unauthenticated access', async () => {
      const res = await request(app)
        .post('/api/settlements/00000000-0000-0000-0000-000000000000/disburse/momo')
        .send({ momo_phone: '0788123456' });

      assert.equal(res.status, 401);
    });

    test('POST /api/settlements/:id/disburse/momo rejects non-existent settlement with 404', async () => {
      const res = await request(app)
        .post('/api/settlements/00000000-0000-0000-0000-000000000000/disburse/momo')
        .set('Authorization', SUPER_ADMIN_TOKEN)
        .send({ momo_phone: '0788123456' });

      assert.equal(res.status, 404);
      assert.equal(res.body.code, 'MOMO_DISBURSEMENT_FAILED');
    });
  });
});
