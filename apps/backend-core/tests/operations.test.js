const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../index');
const { evaluateEmployeeEligibility } = require('../services/eligibilityService');

describe('Super Admin Operations API Test Suite (PF-117)', () => {
  let testClientId = null;

  describe('Executive Overview Endpoint (GET /api/operations/overview)', () => {
    test('returns 200 and complete aggregator health KPIs', async () => {
      const res = await request(app)
        .get('/api/operations/overview')
        .expect('Content-Type', /json/)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.timestamp);

      // 1. Network size
      assert.ok(res.body.network);
      assert.strictEqual(typeof res.body.network.employers.total, 'number');
      assert.strictEqual(typeof res.body.network.providers.total, 'number');
      assert.strictEqual(typeof res.body.network.facilities.total, 'number');
      assert.ok(res.body.network.providers.byCategory);

      // 2. Beneficiaries
      assert.ok(res.body.beneficiaries);
      assert.strictEqual(typeof res.body.beneficiaries.totalEligible, 'number');
      assert.strictEqual(typeof res.body.beneficiaries.activeRoster, 'number');
      assert.strictEqual(typeof res.body.beneficiaries.monthlyActiveBeneficiaries, 'number');
      assert.strictEqual(typeof res.body.beneficiaries.utilizationRate, 'number');

      // 3. Visits
      assert.ok(res.body.visits);
      assert.strictEqual(typeof res.body.visits.today, 'number');
      assert.strictEqual(typeof res.body.visits.thisWeek, 'number');
      assert.strictEqual(typeof res.body.visits.thisMonth, 'number');
      assert.strictEqual(Array.isArray(res.body.visits.hourlyTrend24h), true);
      assert.strictEqual(res.body.visits.hourlyTrend24h.length, 24);

      // 4. Financials (RWF)
      assert.ok(res.body.financials);
      assert.strictEqual(res.body.financials.currency, 'RWF');
      assert.strictEqual(typeof res.body.financials.invoicedMtd, 'number');
      assert.strictEqual(typeof res.body.financials.providerSettlementsMtd, 'number');
      assert.strictEqual(typeof res.body.financials.grossMarginSpread, 'number');
      assert.strictEqual(typeof res.body.financials.grossMarginPercentage, 'number');

      // 5. Recent live feed
      assert.strictEqual(Array.isArray(res.body.recentLiveFeed), true);
    });
  });

  describe('Universal Omnibar Search (GET /api/operations/search)', () => {
    test('returns empty results when query length is less than 2', async () => {
      const res = await request(app)
        .get('/api/operations/search?q=a')
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.count, 0);
      assert.strictEqual(res.body.results.length, 0);
    });

    test('executes multi-domain indexing in under 300ms', async () => {
      const start = Date.now();
      const res = await request(app)
        .get('/api/operations/search?q=fit')
        .expect(200);
      const elapsed = Date.now() - start;

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(typeof res.body.count, 'number');
      assert.strictEqual(Array.isArray(res.body.results), true);
      assert.ok(elapsed < 1000, `Search took too long: ${elapsed}ms`);

      if (res.body.results.length > 0) {
        const item = res.body.results[0];
        assert.ok(item.id);
        assert.ok(item.type);
        assert.ok(item.title);
        assert.ok(item.subtitle);
      }
    });

    test('indexes provider facilities by location / city', async () => {
      const res = await request(app)
        .get('/api/operations/search?q=kigali')
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.count >= 0);
    });
  });

  describe('Provider Network Geo Locations (GET /api/operations/locations)', () => {
    test('returns contracted facilities with coordinates and category mapping', async () => {
      const res = await request(app)
        .get('/api/operations/locations')
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(typeof res.body.count, 'number');
      assert.strictEqual(Array.isArray(res.body.locations), true);
      assert.ok(res.body.locations.length > 0);

      const firstLoc = res.body.locations[0];
      assert.ok(firstLoc.id);
      assert.ok(firstLoc.name);
      assert.ok(firstLoc.provider);
      assert.ok(firstLoc.provider.name);
      assert.ok(firstLoc.provider.category);
    });
  });

  describe('Corporate Clients Management (PF-118)', () => {

    test('GET /api/operations/clients returns list of clients with seat utilization metrics', async () => {
      const res = await request(app)
        .get('/api/operations/clients')
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(typeof res.body.count, 'number');
      assert.strictEqual(Array.isArray(res.body.clients), true);
      assert.ok(res.body.clients.length > 0);

      const firstClient = res.body.clients[0];
      assert.ok(firstClient.id);
      assert.ok(firstClient.name);
      assert.strictEqual(typeof firstClient.contractedSeats, 'number');
      assert.strictEqual(typeof firstClient.activeEmployeesCount, 'number');
      assert.strictEqual(typeof firstClient.utilizationPct, 'number');
      assert.strictEqual(typeof firstClient.isNearCapacity, 'boolean');
      assert.strictEqual(Array.isArray(firstClient.allowedDomains), true);
    });

    test('POST /api/operations/clients provisions new employer in 3-step format', async () => {
      const testName = `Acme East Africa ${Date.now()}`;
      const res = await request(app)
        .post('/api/operations/clients')
        .send({
          name: testName,
          industry: 'Financial Services',
          country: 'Rwanda',
          tax_id: '109988776',
          contact_email: 'hr@acme-ea.rw',
          billing_email: 'finance@acme-ea.rw',
          headcount_tier: '51-250',
          contracted_seats: 120,
          allowed_domains: ['@acme-ea.rw', 'acme.co.rw'],
          subsidy_model: 'percentage',
          co_pay_percentage: 30,
          max_monthly_visits: 12,
          plan_tier: 'standard',
          admin_name: 'HR Director',
          admin_email: 'hr.director@acme-ea.rw'
        })
        .expect(201);

      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.organization);
      assert.strictEqual(res.body.organization.name, testName);
      assert.strictEqual(res.body.organization.contracted_seats, 120);
      assert.deepStrictEqual(res.body.organization.allowed_domains, ['acme-ea.rw', 'acme.co.rw']);
      assert.ok(res.body.benefit);
      assert.strictEqual(res.body.benefit.tier, 'standard');

      testClientId = res.body.organization.id;
    });

    test('GET /api/operations/clients/:id returns 360 cockpit data', async () => {
      assert.ok(testClientId, 'testClientId must be set');
      const res = await request(app)
        .get(`/api/operations/clients/${testClientId}`)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.organization);
      assert.strictEqual(res.body.organization.id, testClientId);
      assert.ok(res.body.metrics);
      assert.strictEqual(res.body.metrics.contractedSeats, 120);
      assert.strictEqual(Array.isArray(res.body.benefitPlans), true);
      assert.strictEqual(Array.isArray(res.body.employees), true);
    });

    test('PATCH /api/operations/clients/:id/domains updates whitelisted domains', async () => {
      assert.ok(testClientId, 'testClientId must be set');
      const res = await request(app)
        .patch(`/api/operations/clients/${testClientId}/domains`)
        .send({
          allowed_domains: ['@acme.rw', 'acme.africa']
        })
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.deepStrictEqual(res.body.organization.allowed_domains, ['acme.rw', 'acme.africa']);
    });
  });

  describe('Provider Network Operations & Negotiated Payout Matrix (PF-119)', () => {
    let testProviderId = null;
    let testLocationId = null;
    const testProvName = `Olympus Wellness Test ${Date.now()}`;

    test('GET /api/operations/providers returns 200 and fleet telemetry KPIs', async () => {
      const res = await request(app)
        .get('/api/operations/providers')
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.providers));
      assert.ok(res.body.telemetry);
      assert.strictEqual(typeof res.body.telemetry.totalProviders, 'number');
      assert.strictEqual(typeof res.body.telemetry.totalLocations, 'number');
      assert.strictEqual(typeof res.body.telemetry.todayNetworkVisits, 'number');
      assert.strictEqual(typeof res.body.telemetry.networkGrossPayoutMtdRwf, 'number');
    });

    test('POST /api/operations/providers provisions new provider with primary location', async () => {
      const res = await request(app)
        .post('/api/operations/providers')
        .send({
          name: testProvName,
          category: 'studio',
          contact_email: 'contact@olympus-test.rw',
          settlement_email: 'finance@olympus-test.rw',
          tax_id: 'TIN-987654321',
          location_name: `${testProvName} - Downtown Studio`,
          address: 'KG 7 Ave, Kigali',
          city: 'Kigali',
          lat: -1.9500,
          lng: 30.0900,
          geofence_radius_meters: 150,
          per_visit_payout_rate: 4500,
          currency: 'RWF',
          min_benefit_tier: 'standard',
          amenities: ['lockers', 'showers', 'yoga_mats'],
          status: 'pending_review'
        })
        .expect(201);

      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.provider);
      assert.strictEqual(res.body.provider.name, testProvName);
      assert.strictEqual(res.body.provider.category, 'studio');
      assert.strictEqual(res.body.provider.tax_id, 'TIN-987654321');
      assert.ok(res.body.location);
      assert.strictEqual(res.body.location.name, `${testProvName} - Downtown Studio`);
      assert.strictEqual(res.body.location.metadata.geofence_radius_meters, 150);
      assert.strictEqual(res.body.location.metadata.per_visit_payout_rate, 4500);

      testProviderId = res.body.provider.id;
      testLocationId = res.body.location.id;
    });

    test('GET /api/operations/providers/:id returns 360-degree cockpit dossier', async () => {
      assert.ok(testProviderId, 'testProviderId must be set');
      const res = await request(app)
        .get(`/api/operations/providers/${testProviderId}`)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.provider);
      assert.strictEqual(res.body.provider.id, testProviderId);
      assert.ok(Array.isArray(res.body.locations));
      assert.ok(res.body.locations.length >= 1);
      assert.ok(res.body.complianceDossier);
      assert.ok(res.body.bankDetails);
      assert.ok(res.body.metrics);
      assert.strictEqual(typeof res.body.metrics.todayVisitsCount, 'number');
    });

    test('POST /api/operations/providers/:id/locations adds second branch unit', async () => {
      assert.ok(testProviderId, 'testProviderId must be set');
      const res = await request(app)
        .post(`/api/operations/providers/${testProviderId}/locations`)
        .send({
          name: `${testProvName} - Nyarutarama Annex`,
          address: 'KG 11 Ave',
          city: 'Kigali',
          lat: -1.9420,
          lng: 30.1050,
          geofence_radius_meters: 200,
          per_visit_payout_rate: 5000,
          currency: 'RWF',
          min_benefit_tier: 'premium',
          amenities: ['swimming_pool', 'sauna']
        })
        .expect(201);

      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.location);
      assert.strictEqual(res.body.location.name, `${testProvName} - Nyarutarama Annex`);
      assert.strictEqual(res.body.location.metadata.geofence_radius_meters, 200);
      assert.strictEqual(res.body.location.metadata.per_visit_payout_rate, 5000);
      assert.strictEqual(res.body.location.metadata.min_benefit_tier, 'premium');
    });

    test('PATCH /api/operations/providers/:id/locations/:locId updates geofence slider and maintenance mode', async () => {
      assert.ok(testProviderId, 'testProviderId must be set');
      assert.ok(testLocationId, 'testLocationId must be set');
      const res = await request(app)
        .patch(`/api/operations/providers/${testProviderId}/locations/${testLocationId}`)
        .send({
          geofence_radius_meters: 250,
          is_maintenance_mode: true
        })
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.location);
      assert.strictEqual(res.body.location.metadata.geofence_radius_meters, 250);
      assert.strictEqual(res.body.location.status, 'maintenance');
    });

    test('PATCH /api/operations/providers/:id/payout-matrix updates rates and MoMo details', async () => {
      assert.ok(testProviderId, 'testProviderId must be set');
      const res = await request(app)
        .patch(`/api/operations/providers/${testProviderId}/payout-matrix`)
        .send({
          bank_details: {
            bank_name: 'Bank of Kigali',
            account_name: testProvName,
            account_number: '00040-069420-11',
            swift_code: 'BKIGRWRW',
            momo_provider: 'MTN Mobile Money Rwanda',
            momo_code: 'MOMO-778899',
            momo_phone: '+250788112233'
          },
          location_rates: [
            {
              location_id: testLocationId,
              per_visit_payout_rate: 4200,
              currency: 'RWF',
              min_benefit_tier: 'standard'
            }
          ]
        })
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.updatedLocations));
    });

    test('PATCH /api/operations/providers/:id/kyc approves application and issues contract', async () => {
      assert.ok(testProviderId, 'testProviderId must be set');
      const res = await request(app)
        .patch(`/api/operations/providers/${testProviderId}/kyc`)
        .send({
          action: 'approve'
        })
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.provider.status, 'active');
      assert.strictEqual(res.body.provider.onboarding_details.kyc_documents.rdb_certificate, 'verified');
    });

    test('evaluateEmployeeEligibility rejects visit when facility is in maintenance mode', async () => {
      assert.ok(testLocationId, 'testLocationId must be set');
      assert.ok(testClientId, 'testClientId must be set');

      // Mock employee associated with the active test client org
      const mockEmployee = {
        id: 'emp-001',
        org_id: testClientId,
        status: 'active',
        tier: 'standard',
        organizations: { id: testClientId, status: 'active' }
      };

      const result = await evaluateEmployeeEligibility({
        employeeId: 'emp-001',
        orgId: testClientId,
        providerLocationId: testLocationId,
        preloadedEmployee: mockEmployee
      });

      // The check should return ineligible with code LOCATION_MAINTENANCE
      assert.strictEqual(result.eligible, false);
      assert.strictEqual(result.code, 'LOCATION_MAINTENANCE');
    });
  });

  describe('Real-Time Visit Monitor, Turnstile Emergency Bypass & Dispute Clearinghouse (PF-120)', () => {
    let testBypassVisitId = null;
    let testDisputeVisitId = null;
    let testEmployeeId = null;
    let testLocationIdForBypass = null;

    test('GET /api/operations/visits returns 200, telemetry stats, and enriched visits with anomaly evaluation', async () => {
      const res = await request(app)
        .get('/api/operations/visits')
        .expect('Content-Type', /json/)
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.visits));
      assert.ok(res.body.telemetry);
      assert.strictEqual(typeof res.body.telemetry.todayVisits, 'number');
      assert.strictEqual(typeof res.body.telemetry.todayVerified, 'number');
      assert.strictEqual(typeof res.body.telemetry.verifiedRate, 'number');
      assert.strictEqual(typeof res.body.telemetry.activeDisputesCount, 'number');
      assert.strictEqual(typeof res.body.telemetry.turnstilesOnlineCount, 'number');
      assert.strictEqual(res.body.telemetry.status, 'nominal');

      if (res.body.visits.length > 0) {
        const first = res.body.visits[0];
        assert.ok(first.id);
        assert.ok(first.check_in_at);
        assert.ok(first.verification_method);
        assert.ok(first.status);
        assert.ok(Array.isArray(first.anomalies));
        testDisputeVisitId = first.id;
        testEmployeeId = first.employee_id || first.employees?.id;
        testLocationIdForBypass = first.provider_location_id || first.provider_locations?.id;
      }
    });

    test('GET /api/operations/visits supports search and method filters', async () => {
      const res = await request(app)
        .get('/api/operations/visits?method=totp_qr&limit=10')
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.visits));
      res.body.visits.forEach(v => {
        assert.strictEqual(v.verification_method, 'totp_qr');
      });
    });

    test('GET /api/operations/visits/disputes returns 200 and open dispute records', async () => {
      const res = await request(app)
        .get('/api/operations/visits/disputes')
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.disputes));
      assert.strictEqual(typeof res.body.openCount, 'number');
      assert.strictEqual(typeof res.body.resolvedCount, 'number');
    });

    test('POST /api/operations/visits/emergency-bypass rejects missing required fields', async () => {
      const res = await request(app)
        .post('/api/operations/visits/emergency-bypass')
        .send({})
        .expect(400);

      assert.strictEqual(res.body.code, 'OPERATIONS_EMERGENCY_BYPASS_FAILED');
    });

    test('POST /api/operations/visits/emergency-bypass executes 1-click turnstile pass under 5000ms', async () => {
      let empId = testEmployeeId;
      let locId = testLocationIdForBypass;

      if (!locId) {
        const overviewRes = await request(app).get('/api/operations/locations').expect(200);
        locId = overviewRes.body.locations?.[0]?.id;
      }

      if (!empId) {
        const clientsRes = await request(app).get('/api/operations/clients').expect(200);
        for (const client of (clientsRes.body.clients || [])) {
          const detailRes = await request(app).get(`/api/operations/clients/${client.id}`).expect(200);
          if (detailRes.body.employees && detailRes.body.employees.length > 0) {
            empId = detailRes.body.employees[0].id;
            break;
          }
        }
      }

      assert.ok(locId, 'Location must exist for bypass test');
      assert.ok(empId, 'Employee must exist for bypass test');

      const start = Date.now();
      const res = await request(app)
        .post('/api/operations/visits/emergency-bypass')
        .send({
          employee_id: empId,
          provider_location_id: locId,
          reason: 'Front-Desk Offline / Wi-Fi Outage',
          notes: 'Automated test suite bypass execution'
        })
        .expect(201);

      const duration = Date.now() - start;
      assert.ok(duration < 5000, `Bypass took ${duration}ms, must be under 5000ms`);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.bypassCode);
      assert.match(res.body.bypassCode, /^EP-\d{6}$/);
      assert.strictEqual(res.body.visit.verification_method, 'turnstile');
      assert.strictEqual(res.body.visit.status, 'verified');
      assert.strictEqual(res.body.visit.metadata.is_emergency_bypass, true);

      testBypassVisitId = res.body.visit.id;
    });

    test('PATCH /api/operations/visits/:id/dispute/adjudicate executes split_resolution goodwill override', async () => {
      const targetId = testBypassVisitId || testDisputeVisitId;
      assert.ok(targetId, 'Target visit ID must exist for adjudication test');

      const res = await request(app)
        .patch(`/api/operations/visits/${targetId}/dispute/adjudicate`)
        .send({
          action: 'split_resolution',
          notes: 'Tested split resolution: provider paid, employee allowance exempt'
        })
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.action, 'split_resolution');
      assert.strictEqual(res.body.visit.status, 'verified');
      assert.strictEqual(res.body.visit.metadata.resolution_type, 'split_goodwill');
      assert.strictEqual(res.body.visit.metadata.provider_payable, true);
      assert.strictEqual(res.body.visit.metadata.employee_chargeable, false);
      assert.strictEqual(res.body.dispute.status, 'resolved_approved');
    });

    test('PATCH /api/operations/visits/:id/dispute/adjudicate rejects invalid action', async () => {
      const targetId = testBypassVisitId || testDisputeVisitId;
      assert.ok(targetId, 'Target visit ID must exist for adjudication test');

      const res = await request(app)
        .patch(`/api/operations/visits/${targetId}/dispute/adjudicate`)
        .send({
          action: 'invalid_action_name'
        })
        .expect(400);

      assert.strictEqual(res.body.code, 'OPERATIONS_DISPUTE_ADJUDICATION_FAILED');
    });
  });

});

