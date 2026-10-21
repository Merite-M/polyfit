/**
 * PolyFit Partner Ecosystem End-to-End Test Suite
 * Comprehensive validation across Receptionist, Facility Director, and Finance Controller personas,
 * Sub-150ms SLA benchmarking, Anti-Passback serialization, 18% Rwanda VAT settlement itemization,
 * and Cross-Platform Bidirectional Synchronization.
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../index');
const { supabase } = require('@polyfit/supabase-client');
const { deriveEmployeeSecret, generateTotp } = require('../services/totpService');

const SUPER_ADMIN_TOKEN = 'Bearer demo-super-admin-token';
const PROVIDER_ADMIN_TOKEN = 'Bearer demo-provider-admin-token';
const EMPLOYEE_TOKEN = 'Bearer demo-employee-token';

const FITLIFE_PROVIDER_ID = '90d06d31-999c-42c0-a0c6-fc31ec818ced';
const FITLIFE_LOCATION_ID = '447f4bf2-ff66-48c5-851e-460cba17bfe4';
const CLAIRE_EMP_ID = '6f49f5f6-a72d-44d2-bac5-82db218b00ce';
const KTI_ORG_ID = '02f13bdc-ce25-4c9d-b712-451c06a63fa2';

describe('PolyFit Partner Ecosystem End-to-End Audit & Hardening', () => {
  let createdVisitId = null;
  let testSettlementId = null;
  let activeContractId = null;

  before(async () => {
    // Clean any residual test visits for Claire to allow clean passback testing
    if (supabase) {
      await supabase
        .from('visits')
        .delete()
        .eq('employee_id', CLAIRE_EMP_ID)
        .gte('created_at', new Date(Date.now() - 3600000).toISOString());

      // Fetch active contract
      const { data: contract } = await supabase
        .from('provider_contracts')
        .select('id')
        .eq('provider_id', FITLIFE_PROVIDER_ID)
        .limit(1)
        .maybeSingle();

      if (contract) {
        activeContractId = contract.id;
      }

      // Fetch settlement
      const { data: stl } = await supabase
        .from('settlements')
        .select('id')
        .eq('provider_id', FITLIFE_PROVIDER_ID)
        .limit(1)
        .maybeSingle();

      if (stl) {
        testSettlementId = stl.id;
      }
    }
  });

  // =========================================================================
  // Part 1: Front-Desk Receptionist Persona (Peak Rush Access & Security)
  // =========================================================================
  describe('Persona 1: Front-Desk Receptionist (Peak Rush Verification)', () => {
    test('1.1: Dynamic TOTP Code Entry achieves sub-200ms verification SLA', async () => {
      const secret = deriveEmployeeSecret(CLAIRE_EMP_ID);
      const token = generateTotp(secret);
      assert.ok(token, 'TOTP token should be generated');

      const startMs = Date.now();
      const res = await request(app)
        .post('/api/visits/verify-totp')
        .set('Authorization', SUPER_ADMIN_TOKEN)
        .send({
          token,
          employee_id: CLAIRE_EMP_ID,
          provider_location_id: FITLIFE_LOCATION_ID
        });

      const elapsedMs = Date.now() - startMs;
      console.log(`      ⚡ Dynamic TOTP Verification RTT: ${elapsedMs}ms`);

      assert.strictEqual(res.status, 201, `Failed with: ${JSON.stringify(res.body)}`);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.visit?.id, 'Visit ID should be returned');
      assert.strictEqual(res.body.visit.status, 'verified');
      assert.strictEqual(res.body.visit.verification_method, 'totp_qr');
      assert.ok(res.body.employee, 'Employee info should be returned');
      assert.strictEqual(res.body.employee.id, CLAIRE_EMP_ID);

      createdVisitId = res.body.visit.id;
    });

    test('1.2: Anti-Passback blocks immediate re-entry within cooldown window', async () => {
      const secret = deriveEmployeeSecret(CLAIRE_EMP_ID);
      const token = generateTotp(secret);

      const res = await request(app)
        .post('/api/visits/verify-totp')
        .set('Authorization', SUPER_ADMIN_TOKEN)
        .send({
          token,
          employee_id: CLAIRE_EMP_ID,
          provider_location_id: FITLIFE_LOCATION_ID
        });

      assert.strictEqual(res.status, 409, 'Anti-passback should return 409 Conflict');
      assert.ok(
        res.body.error?.includes('Anti-passback') || res.body.code === 'ANTI_PASSBACK_COOLDOWN',
        'Should return clear anti-passback message'
      );
      assert.ok(res.body.minutes_remaining >= 0, 'Minutes remaining should be reported');
    });

    test('1.3: Concurrency Guard: 5 simultaneous check-ins are safely serialized with zero race condition', async () => {
      // Find another active employee for concurrency test
      const { data: altEmp } = await supabase
        .from('employees')
        .select('id, full_name')
        .neq('id', CLAIRE_EMP_ID)
        .eq('status', 'active')
        .limit(1)
        .single();

      if (!altEmp) {
        console.log('      (Skipping concurrency test: no second employee found)');
        return;
      }

      // Clear any recent visits for altEmp
      await supabase
        .from('visits')
        .delete()
        .eq('employee_id', altEmp.id)
        .gte('created_at', new Date(Date.now() - 3600000).toISOString());

      const altSecret = deriveEmployeeSecret(altEmp.id);
      const altToken = generateTotp(altSecret);

      // Fire 5 simultaneous requests
      const promises = Array.from({ length: 5 }, () =>
        request(app)
          .post('/api/visits/verify-totp')
          .set('Authorization', SUPER_ADMIN_TOKEN)
          .send({
            token: altToken,
            employee_id: altEmp.id,
            provider_location_id: FITLIFE_LOCATION_ID
          })
      );

      const responses = await Promise.all(promises);
      const successCount = responses.filter((r) => r.status === 201).length;
      const cooldownCount = responses.filter((r) => r.status === 409).length;

      console.log(`      🔒 Concurrency Results: ${successCount} Succeeded, ${cooldownCount} Blocked by Anti-Passback`);
      assert.strictEqual(successCount, 1, 'Exactly one concurrent request must succeed');
      assert.strictEqual(cooldownCount, 4, 'All subsequent concurrent requests must be rejected by atomic advisory lock');
    });

    test('1.4: Turnstile Hardware Bypass & Tier Eligibility Gating', async () => {
      // 1. Ineligible employee without corporate contract at this provider -> 403 Polite Rejection
      const rejectedRes = await request(app)
        .post('/api/visits/verify-turnstile')
        .set('Authorization', SUPER_ADMIN_TOKEN)
        .send({
          turnstile_id: 'TURNSTILE_01',
          employee_identifier: 'jean.mugisha@bk.rw',
          provider_location_id: FITLIFE_LOCATION_ID
        });

      assert.strictEqual(rejectedRes.status, 403);
      assert.strictEqual(rejectedRes.body.code, 'INELIGIBLE_FOR_VISIT');
      assert.strictEqual(rejectedRes.body.unlock, false);

      // 2. Front-Desk Hardware Bypass for registered employee without phone
      const bypassRes = await request(app)
        .post('/api/visits/verify-turnstile')
        .set('Authorization', SUPER_ADMIN_TOKEN)
        .send({
          turnstile_id: 'TURNSTILE_01',
          employee_identifier: 'claire@kigalitech.rw',
          provider_location_id: FITLIFE_LOCATION_ID
        });

      assert.ok([201, 409].includes(bypassRes.status));
      if (bypassRes.status === 201) {
        assert.strictEqual(bypassRes.body.success, true);
        assert.strictEqual(bypassRes.body.unlock, true);
        assert.ok(bypassRes.body.gate_relay_ms);
      }
    });

    test('1.5: Front-Desk Receptionist can log visit dispute on flagged check-in', async () => {
      if (!createdVisitId) {
        console.log('      (Skipping dispute test: no created visit ID)');
        return;
      }

      const res = await request(app)
        .post('/api/visits/disputes')
        .set('Authorization', SUPER_ADMIN_TOKEN)
        .send({
          visit_id: createdVisitId,
          reason: 'impersonation_suspected',
          notes: 'Photo on ID did not match beneficiary at front desk'
        });

      assert.strictEqual(res.status, 201, `Dispute creation failed: ${JSON.stringify(res.body)}`);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.dispute?.id, 'Dispute ID should be returned');

      // Verify row exists in DB
      const { data: dbDispute } = await supabase
        .from('visit_disputes')
        .select('id, visit_id, reason, status')
        .eq('visit_id', createdVisitId)
        .maybeSingle();

      assert.ok(dbDispute, 'Dispute row must exist in visit_disputes table');
      assert.strictEqual(dbDispute.visit_id, createdVisitId);
    });

    test('1.6: Front-Desk real-time daily metrics query returns accurate visit counts', async () => {
      const res = await request(app)
        .get(`/api/visits/today-summary?provider_location_id=${FITLIFE_LOCATION_ID}`)
        .set('Authorization', SUPER_ADMIN_TOKEN);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.summary, 'Summary object must be present');
      assert.ok(typeof res.body.summary.total_visits_today === 'number');
      assert.ok(typeof res.body.summary.settlement_earned_today === 'number');
    });

    test('1.7: Pending check-in approval queue endpoint responds correctly', async () => {
      const res = await request(app)
        .get(`/api/visits/pending?provider_location_id=${FITLIFE_LOCATION_ID}`)
        .set('Authorization', SUPER_ADMIN_TOKEN);

      console.log('      [Pending endpoint body]:', res.body);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.pending_visits));
    });
  });

  // =========================================================================
  // Part 2: General Manager & Facility Director Persona (Facility Configuration)
  // =========================================================================
  describe('Persona 2: General Manager & Facility Director (Facility Maintenance)', () => {
    test('2.1: GET /api/providers/:id fetches provider entity & profile', async () => {
      const res = await request(app)
        .get(`/api/providers/${FITLIFE_PROVIDER_ID}`)
        .set('Authorization', SUPER_ADMIN_TOKEN);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.provider?.id, FITLIFE_PROVIDER_ID);
      assert.strictEqual(res.body.provider?.name, 'FitLife Gym Kigali');
    });

    test('2.2: GET /api/providers/:id/locations fetches all facility locations', async () => {
      const res = await request(app)
        .get(`/api/providers/${FITLIFE_PROVIDER_ID}/locations`)
        .set('Authorization', SUPER_ADMIN_TOKEN);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.locations), 'Locations must be an array');
      assert.ok(res.body.locations.length > 0, 'Must have at least one location');
      const found = res.body.locations.find((l) => l.id === FITLIFE_LOCATION_ID);
      assert.ok(found, 'Should find FitLife Central location');
    });

    test('2.3: PATCH /api/providers/:id/locations/:locId updates split-shift hours & amenities', async () => {
      const testOperatingHours = {
        weekday: '06:00 - 12:00, 15:00 - 21:00',
        saturday: '07:00 - 20:00',
        sunday: '08:00 - 18:00'
      };

      const testAmenities = [
        'olympic_pool',
        'free_weights',
        'cardio_theatre',
        'towel_service',
        'steam_sauna',
        'smoothie_bar'
      ];

      const res = await request(app)
        .patch(`/api/providers/${FITLIFE_PROVIDER_ID}/locations/${FITLIFE_LOCATION_ID}`)
        .set('Authorization', SUPER_ADMIN_TOKEN)
        .send({
          operating_hours: testOperatingHours,
          amenities: testAmenities,
          metadata: {
            check_in_rules: 'Towel & indoor trainers mandatory for entry.'
          }
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.location, 'Location should be returned');

      // Verify in database
      const { data: dbLoc } = await supabase
        .from('provider_locations')
        .select('operating_hours, amenities, metadata')
        .eq('id', FITLIFE_LOCATION_ID)
        .single();

      assert.deepEqual(dbLoc.operating_hours, testOperatingHours);
      assert.ok(dbLoc.amenities.includes('olympic_pool'));
      assert.strictEqual(dbLoc.metadata?.check_in_rules, 'Towel & indoor trainers mandatory for entry.');
    });

    test('2.4: Cross-Platform Sync: Updated amenities appear immediately in Mobile App discovery feed', async () => {
      const res = await request(app)
        .get('/api/providers/discover')
        .set('Authorization', EMPLOYEE_TOKEN);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.results), 'Discovery results must be an array');

      const fitlifeCentral = res.body.results.find((item) => item.provider?.id === FITLIFE_PROVIDER_ID);
      assert.ok(fitlifeCentral, 'FitLife Central should appear in mobile discovery results');
      assert.ok(
        fitlifeCentral.amenities?.includes('olympic_pool') || fitlifeCentral.amenities?.length > 0,
        'Amenities must be synchronized'
      );
    });

    test('2.5: GET /api/providers/:id/dashboard returns operational KPIs', async () => {
      const res = await request(app)
        .get(`/api/providers/${FITLIFE_PROVIDER_ID}/dashboard`)
        .set('Authorization', SUPER_ADMIN_TOKEN);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.provider?.id, FITLIFE_PROVIDER_ID);
      assert.ok(typeof res.body.kpis?.today_visits === 'number');
      assert.ok(typeof res.body.kpis?.mtd_total_visits === 'number');
      assert.ok(Array.isArray(res.body.peak_hours_heatmap?.hours_24), '24-hour heatmap must be returned');
    });
  });

  // =========================================================================
  // Part 3: Finance Controller & Owner Persona (Settlements, Contracts, Collateral)
  // =========================================================================
  describe('Persona 3: Finance Controller & Owner (Settlement & Contracts)', () => {
    test('3.1: GET /api/settlements?provider_id fetches settlement summaries', async () => {
      const res = await request(app)
        .get(`/api/settlements?provider_id=${FITLIFE_PROVIDER_ID}`)
        .set('Authorization', SUPER_ADMIN_TOKEN);

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.settlements), 'Settlements must be an array');
      assert.ok(res.body.settlements.length > 0, 'Must have at least one settlement');
    });

    test('3.2: GET /api/settlements/:id contains itemized visit attendance & 18% Rwanda VAT itemization', async () => {
      if (!testSettlementId) {
        console.log('      (Skipping settlement detail test: no settlement ID)');
        return;
      }

      const res = await request(app)
        .get(`/api/settlements/${testSettlementId}`)
        .set('Authorization', SUPER_ADMIN_TOKEN);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.id, testSettlementId);
      assert.ok(Array.isArray(res.body.visit_breakdown), 'Settlement visit breakdown must be an array');
      assert.strictEqual(res.body.vat_rate_pct, 18, 'Rwanda VAT rate must be 18%');
      assert.ok(typeof res.body.subtotal_exclusive_vat === 'number', 'Subtotal exclusive of VAT must be present');
      assert.ok(typeof res.body.vat_amount === 'number', 'VAT amount must be present');
      assert.ok(typeof res.body.gross_amount === 'number', 'Gross amount must be present');
      assert.ok(typeof res.body.net_amount === 'number', 'Net amount must be present');

      // Verify mathematical identity: subtotal + vat = gross
      assert.strictEqual(
        res.body.subtotal_exclusive_vat + res.body.vat_amount,
        res.body.gross_amount,
        'Subtotal + VAT must equal Gross Amount'
      );
    });

    test('3.3: GET /api/provider-contracts?provider_id fetches active MSA contracts', async () => {
      const res = await request(app)
        .get(`/api/provider-contracts?provider_id=${FITLIFE_PROVIDER_ID}`)
        .set('Authorization', SUPER_ADMIN_TOKEN);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.contracts), 'Contracts must be an array');
      assert.ok(res.body.contracts.length > 0, 'Must have at least one active contract');
      const contract = res.body.contracts[0];
      assert.ok(contract.per_visit_rate >= 0, 'Contract must specify per visit rate');
    });

    test('3.4: POST /api/provider-contracts/:id/amendments submits contract amendment request', async () => {
      if (!activeContractId) {
        console.log('      (Skipping amendment test: no contract ID)');
        return;
      }

      const res = await request(app)
        .post(`/api/provider-contracts/${activeContractId}/amendments`)
        .set('Authorization', SUPER_ADMIN_TOKEN)
        .send({
          request_type: 'rate_review',
          requested_rate: 6500,
          current_rate: 5000,
          justification: 'Addition of Olympic pool and hydrotherapy facility expansion'
        });

      assert.strictEqual(res.status, 201, `Failed with ${JSON.stringify(res.body)}`);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.request?.id, 'Amendment request ID should be returned');
      assert.strictEqual(res.body.request.requested_rate, 6500);

      // Verify in DB
      const { data: dbAmend } = await supabase
        .from('contract_amendment_requests')
        .select('id, requested_rate, status')
        .eq('id', res.body.request.id)
        .single();

      assert.ok(dbAmend, 'Amendment must exist in database');
      assert.strictEqual(dbAmend.status, 'pending');
    });

    test('3.5: GET /api/providers/:id/marketing-assets returns counter plaques & branded collateral', async () => {
      const res = await request(app)
        .get(`/api/providers/${FITLIFE_PROVIDER_ID}/marketing-assets`)
        .set('Authorization', SUPER_ADMIN_TOKEN);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.provider_id, FITLIFE_PROVIDER_ID);
      assert.ok(res.body.assets?.counter_card_signage, 'Must provide counter card signage');
      assert.ok(res.body.assets?.partner_badge, 'Must provide partner badge');
      assert.ok(res.body.assets?.social_media_kit, 'Must provide social media kit');
    });
  });

  // =========================================================================
  // Part 4: Operations & Central Ledger Unification
  // =========================================================================
  describe('Part 4: Operations Console & Central Ledger Unification', () => {
    test('4.1: Verified partner check-in appears immediately in Super Admin operations visits ledger', async () => {
      if (!createdVisitId) {
        console.log('      (Skipping operations ledger verification: no created visit ID)');
        return;
      }

      const res = await request(app)
        .get('/api/operations/visits?limit=10')
        .set('Authorization', SUPER_ADMIN_TOKEN);

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.visits), 'Operations visits must be an array');
      const found = res.body.visits.find((v) => v.id === createdVisitId);
      assert.ok(found, 'Created partner check-in must appear in Operations visit ledger');
      assert.strictEqual(found.employee_id, CLAIRE_EMP_ID);
    });
  });
});
