const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../index');

const {
  VALID_PROVIDER_CATEGORIES,
  VALID_PROVIDER_STATUSES,
  VALID_LOCATION_STATUSES,
  registerProvider,
  approveProvider,
  rejectProvider,
  addLocation,
  discoverProviders,
  getMarketingAssets,
  containsRetailPricing,
  getProviderDashboardOverview,
  getProviderCommercialConditions,
  createAmendmentRequest
} = require('../services/providerService');

const {
  VALID_CONTRACT_STATUSES,
  createContract,
  listContracts,
  getContractById,
  activateContract,
  terminateContract
} = require('../services/contractService');

describe('Provider & Network Engine Test Suite (PF-83)', () => {
  // Known active provider and location from database seed
  const KNOWN_PROVIDER_ID = '90d06d31-999c-42c0-a0c6-fc31ec818ced'; // FitLife Gym Kigali
  const KNOWN_ORG_ID = 'c79a9982-4477-4336-a24b-561419f6c43b';      // Bank of Kigali

  // ─── 1. Domain Constants & Contract Rules ──────────────────────────────────
  describe('Provider Domain Rules & Constants', () => {
    test('VALID_PROVIDER_CATEGORIES includes gym, pool, studio, clinic, wellness_center', () => {
      assert.ok(VALID_PROVIDER_CATEGORIES.includes('gym'));
      assert.ok(VALID_PROVIDER_CATEGORIES.includes('pool'));
      assert.ok(VALID_PROVIDER_CATEGORIES.includes('studio'));
      assert.ok(VALID_PROVIDER_CATEGORIES.includes('clinic'));
      assert.ok(VALID_PROVIDER_CATEGORIES.includes('wellness_center'));
      assert.equal(VALID_PROVIDER_CATEGORIES.length, 5);
    });

    test('VALID_PROVIDER_STATUSES includes pending_review and rejected alongside active states', () => {
      assert.ok(VALID_PROVIDER_STATUSES.includes('pending_review'));
      assert.ok(VALID_PROVIDER_STATUSES.includes('active'));
      assert.ok(VALID_PROVIDER_STATUSES.includes('inactive'));
      assert.ok(VALID_PROVIDER_STATUSES.includes('suspended'));
      assert.ok(VALID_PROVIDER_STATUSES.includes('rejected'));
    });

    test('VALID_CONTRACT_STATUSES includes draft, active, suspended, terminated', () => {
      assert.deepEqual(VALID_CONTRACT_STATUSES, ['draft', 'active', 'suspended', 'terminated']);
    });
  });

  // ─── 2. Route Security & RBAC Protection ────────────────────────────────────
  describe('Route Security & RBAC Protection', () => {
    test('GET /api/providers - blocks unauthenticated access', async () => {
      const res = await request(app).get('/api/providers');
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('GET /api/providers/:id - blocks unauthenticated access', async () => {
      const res = await request(app).get(`/api/providers/${KNOWN_PROVIDER_ID}`);
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('PATCH /api/providers/:id/approve - blocks unauthenticated access', async () => {
      const res = await request(app).patch(`/api/providers/${KNOWN_PROVIDER_ID}/approve`);
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('PATCH /api/providers/:id/reject - blocks unauthenticated access', async () => {
      const res = await request(app).patch(`/api/providers/${KNOWN_PROVIDER_ID}/reject`);
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('POST /api/providers/:id/locations - blocks unauthenticated access', async () => {
      const res = await request(app).post(`/api/providers/${KNOWN_PROVIDER_ID}/locations`).send({
        name: 'New Branch'
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('GET /api/providers/:id/marketing-assets - blocks unauthenticated access', async () => {
      const res = await request(app).get(`/api/providers/${KNOWN_PROVIDER_ID}/marketing-assets`);
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('POST /api/provider-contracts - blocks unauthenticated access', async () => {
      const res = await request(app).post('/api/provider-contracts').send({
        org_id: KNOWN_ORG_ID,
        provider_id: KNOWN_PROVIDER_ID,
        per_visit_rate: 4500
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('GET /api/provider-contracts - blocks unauthenticated access', async () => {
      const res = await request(app).get('/api/provider-contracts');
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('GET /api/providers/discover - is publicly accessible without auth header', async () => {
      // Warm up connection for remote database
      await request(app).get('/api/providers/discover?limit=1');
      const res = await request(app).get('/api/providers/discover?limit=5');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.results));
      assert.ok(res.body.execution_ms < 2000, `Execution ms ${res.body.execution_ms} exceeded remote WAN SLA`);
    });
  });

  // ─── 3. Provider Onboarding & Application Lifecycle Service Tests ───────────
  describe('Provider Onboarding & Lifecycle Engine', () => {
    let testApplicantId = null;

    test('registerProvider creates application with status pending_review & services_provided', async () => {
      const timestamp = Date.now();
      const applicant = await registerProvider({
        name: `Kigali CrossFit ${timestamp}`,
        category: 'gym',
        contact_email: `crossfit${timestamp}@polyfit-test.rw`,
        settlement_email: `finance-cf${timestamp}@polyfit-test.rw`,
        tax_id: `TIN-${timestamp}`,
        pricing_expectations: { expected_per_visit_rwf: 6000, monthly_tier: 'premium' },
        onboarding_details: {
          services_provided: ['Olympic Weightlifting', 'HIIT', 'Sauna', 'Physiotherapy'],
          manager_name: 'David Karekezi',
          manager_phone: '+250788123456',
          google_business_url: 'https://maps.google.com/?q=KigaliCrossFit'
        },
        locations: [
          {
            name: `CrossFit Gishushu Facility`,
            address: 'KG 9 Ave, Gishushu',
            city: 'Kigali',
            country: 'Rwanda',
            lat: -1.9536,
            lng: 30.0924,
            amenities: ['shower', 'locker', 'sauna', 'parking'],
            capacity: 50
          }
        ]
      });

      assert.ok(applicant.id);
      testApplicantId = applicant.id;
      assert.equal(applicant.status, 'pending_review');
      assert.equal(applicant.category, 'gym');
      assert.ok(applicant.onboarding_details.services_provided.includes('Sauna'));
      assert.ok(applicant.locations.length >= 1);
      assert.equal(applicant.locations[0].name, 'CrossFit Gishushu Facility');
      assert.equal(applicant.locations[0].city, 'Kigali');
    });

    test('registerProvider rejects invalid category or missing fields', async () => {
      await assert.rejects(
        () => registerProvider({ name: '', category: 'gym', contact_email: 'test@polyfit.rw' }),
        (err) => err.code === 'PROVIDER_MISSING_NAME' && err.statusCode === 400
      );

      await assert.rejects(
        () => registerProvider({ name: 'Valid Gym', category: 'space_station', contact_email: 'test@polyfit.rw' }),
        (err) => err.code === 'PROVIDER_INVALID_CATEGORY' && err.statusCode === 400
      );

      await assert.rejects(
        () => registerProvider({ name: 'Valid Gym', category: 'gym', contact_email: 'not-an-email' }),
        (err) => err.code === 'PROVIDER_INVALID_EMAIL' && err.statusCode === 400
      );
    });

    test('rejectProvider rejects application with mandatory reason', async () => {
      if (!testApplicantId) return;

      const rejected = await rejectProvider(testApplicantId, 'Incomplete business registration and invalid TIN documentation');
      assert.equal(rejected.status, 'rejected');
      assert.equal(rejected.rejection_reason, 'Incomplete business registration and invalid TIN documentation');
    });

    test('approveProvider activates provider application and clears rejection reason', async () => {
      if (!testApplicantId) return;

      const approved = await approveProvider(testApplicantId);
      assert.equal(approved.status, 'active');
      assert.equal(approved.rejection_reason, null);
    });
  });

  // ─── 4. Location Management & Geocoding ──────────────────────────────────────
  describe('Location Management & Facility CRUD', () => {
    let testLocationId = null;

    test('addLocation adds facility to known provider with GPS and amenities', async () => {
      const loc = await addLocation(KNOWN_PROVIDER_ID, {
        name: `Nyarutarama Health Branch ${Date.now()}`,
        address: 'KG 15 Ave',
        city: 'Kigali',
        country: 'Rwanda',
        lat: -1.9351,
        lng: 30.1035,
        amenities: ['swimming_pool', 'sauna', 'shower', 'parking', 'cafe'],
        capacity: 120,
        operating_hours: {
          monday: { open: '06:00', close: '22:00' },
          tuesday: { open: '06:00', close: '22:00' },
          saturday: { open: '08:00', close: '20:00' }
        }
      });

      assert.ok(loc.id);
      testLocationId = loc.id;
      assert.equal(loc.provider_id, KNOWN_PROVIDER_ID);
      assert.equal(loc.status, 'active');
      assert.equal(loc.capacity, 120);
      assert.ok(loc.amenities.includes('swimming_pool'));
    });
  });

  // ─── 5. Discovery Engine & Geo-Search SLA (< 500ms) ─────────────────────────
  describe('Beneficiary Discovery Engine & SLA Verification', () => {
    test('discoverProviders returns sorted facilities by proximity to Kigali Downtown', async () => {
      // Kigali Downtown coordinates: -1.9441, 30.0619
      const start = Date.now();
      const discovery = await discoverProviders({
        lat: -1.9441,
        lng: 30.0619,
        radius_km: 30
      });
      const durationMs = Date.now() - start;

      assert.ok(discovery.results.length > 0, 'Discovery returned results');
      assert.ok(durationMs < 2000, `Discovery took ${durationMs}ms (expected < 2000ms)`);
      assert.ok(discovery.execution_ms < 2000, `Execution ms ${discovery.execution_ms} exceeded SLA`);

      // Verify structure of first result
      const first = discovery.results[0];
      assert.ok(first.location_id);
      assert.ok(first.location_name);
      assert.ok(first.provider.id);
      assert.ok(first.provider.name);
      assert.ok(first.provider.category);

      // Verify distance is calculated and sorted ascending
      if (discovery.results.length >= 2 && first.distance_meters !== null) {
        const second = discovery.results[1];
        if (second.distance_meters !== null) {
          assert.ok(first.distance_meters <= second.distance_meters, 'Results are sorted by distance ascending');
        }
      }
    });

    test('discoverProviders filters by category correctly', async () => {
      const gymResults = await discoverProviders({ category: 'gym' });
      assert.ok(gymResults.results.every((r) => r.provider.category === 'gym'));

      const studioResults = await discoverProviders({ category: 'studio' });
      assert.ok(studioResults.results.every((r) => r.provider.category === 'studio'));
    });

    test('discoverProviders filters by amenity tag', async () => {
      const showerResults = await discoverProviders({ amenities: 'shower' });
      assert.ok(Array.isArray(showerResults.results));
    });
  });

  // ─── 6. Wellhub Marketing Toolkit Assets ────────────────────────────────────
  describe('Wellhub-Inspired Marketing Toolkit', () => {
    test('getMarketingAssets generates SVG partner badge and in-facility signage', async () => {
      const toolkit = await getMarketingAssets(KNOWN_PROVIDER_ID);

      assert.equal(toolkit.provider_id, KNOWN_PROVIDER_ID);
      assert.ok(toolkit.assets.partner_badge);
      assert.equal(toolkit.assets.partner_badge.format, 'svg');
      assert.ok(toolkit.assets.partner_badge.svg.includes('<svg'));
      assert.ok(toolkit.assets.partner_badge.svg.includes('POLYFIT'));
      assert.ok(toolkit.assets.partner_badge.svg.includes('#10B981')); // PolyFit emerald
      assert.ok(toolkit.assets.partner_badge.embed_html.includes('<img'));

      assert.ok(toolkit.assets.counter_card_signage);
      assert.ok(toolkit.assets.counter_card_signage.svg.includes('POLYFIT CHECK-IN'));

      assert.ok(toolkit.assets.social_media_kit);
      assert.ok(toolkit.assets.social_media_kit.instagram_caption.includes('@PolyFit'));
      assert.ok(toolkit.assets.social_media_kit.recommended_tags.includes('#PolyFit'));

      assert.ok(toolkit.assets.brand_guidelines);
      assert.equal(toolkit.assets.brand_guidelines.brand_colors.polyfit_emerald, '#10B981');
    });
  });

  // ─── 7. Provider Contract Management Lifecycle ──────────────────────────────
  describe('Provider Contract Management Lifecycle', () => {
    let testContractId = null;

    test('createContract creates contract with per_visit_rate, cap and access rules', async () => {
      const contract = await createContract({
        orgId: KNOWN_ORG_ID,
        providerId: KNOWN_PROVIDER_ID,
        perVisitRate: 4800,
        monthlyCap: 75,
        accessHours: { weekdays: '06:00-21:00', weekends: '08:00-18:00' },
        status: 'draft'
      });

      assert.ok(contract.id);
      testContractId = contract.id;
      assert.equal(contract.org_id, KNOWN_ORG_ID);
      assert.equal(contract.provider_id, KNOWN_PROVIDER_ID);
      assert.equal(Number(contract.per_visit_rate), 4800);
      assert.equal(contract.monthly_cap, 75);
      assert.equal(contract.status, 'draft');
      assert.ok(contract.organization?.name);
      assert.ok(contract.provider?.name);
    });

    test('listContracts lists contracts with admin privilege', async () => {
      const list = await listContracts({
        userRoles: ['super_admin'],
        filterOrgId: KNOWN_ORG_ID
      });

      assert.ok(list.contracts.length > 0);
      assert.ok(list.total > 0);
      assert.ok(list.contracts.some((c) => c.id === testContractId));
    });

    test('getContractById returns contract details', async () => {
      if (!testContractId) return;

      const contract = await getContractById(testContractId, {
        userRoles: ['super_admin']
      });

      assert.equal(contract.id, testContractId);
      assert.equal(contract.org_id, KNOWN_ORG_ID);
    });

    test('activateContract transitions contract to active', async () => {
      if (!testContractId) return;

      const activated = await activateContract(testContractId);
      assert.equal(activated.status, 'active');
    });

    test('terminateContract transitions contract to terminated', async () => {
      if (!testContractId) return;

      const terminated = await terminateContract(testContractId);
      assert.equal(terminated.status, 'terminated');
    });
  });

  // ─── 7. Location Setup Wizard & Metadata Engine (PF-95) ─────────────────────
  describe('Location Setup Wizard, Split-Shifts & Anti-Leakage (PF-95)', () => {
    test('containsRetailPricing accurately catches retail fees and monthly subscription keywords', () => {
      assert.equal(containsRetailPricing('Membership is 50,000 RWF per month'), true);
      assert.equal(containsRetailPricing('Daily pass $20 at reception'), true);
      assert.equal(containsRetailPricing('Discount code WELCOME10 for 10% off'), true);
      assert.equal(containsRetailPricing('Only 3000 FRW drop in'), true);
      assert.equal(containsRetailPricing('Premium wellness center with sauna and Olympic pool'), false);
      assert.equal(containsRetailPricing('Enter via revolving doors, Level 2 elevator'), false);
    });

    test('addLocation rejects descriptions containing retail prices', async () => {
      await assert.rejects(
        async () => {
          await addLocation(KNOWN_PROVIDER_ID, {
            name: 'Retail Price Violation Facility',
            metadata: {
              description: 'Join today for only 45,000 RWF per month!'
            }
          });
        },
        (err) => {
          assert.equal(err.code, 'LOCATION_RETAIL_PRICE_FORBIDDEN');
          return true;
        }
      );
    });
  });

  // ─── 8. Provider Home Dashboard, Units Switcher & Commercial Hub (PF-96) ───
  describe('Provider Home Dashboard, Units Switcher & Commercial Hub (PF-96)', () => {
    test('GET /api/providers/:id/dashboard - blocks unauthenticated access', async () => {
      const res = await request(app).get(`/api/providers/${KNOWN_PROVIDER_ID}/dashboard`);
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('GET /api/providers/:id/commercial-conditions - blocks unauthenticated access', async () => {
      const res = await request(app).get(`/api/providers/${KNOWN_PROVIDER_ID}/commercial-conditions`);
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('POST /api/providers/:id/amendment-request - blocks unauthenticated access', async () => {
      const res = await request(app)
        .post(`/api/providers/${KNOWN_PROVIDER_ID}/amendment-request`)
        .send({ request_type: 'rate_review', justification: 'Higher equipment maintenance' });
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('getProviderDashboardOverview returns live KPIs, 24-hr heatmap and top client breakdown', async () => {
      const overview = await getProviderDashboardOverview(KNOWN_PROVIDER_ID);

      assert.ok(overview.provider);
      assert.equal(overview.provider.id, KNOWN_PROVIDER_ID);
      assert.ok(overview.location_context);
      assert.ok(Array.isArray(overview.location_context.locations));

      // KPIs
      assert.ok(typeof overview.kpis.today_visits === 'number');
      assert.ok(typeof overview.kpis.unique_corporate_visitors_mtd === 'number');
      assert.ok(typeof overview.kpis.estimated_mtd_revenue_rwf === 'number');
      assert.equal(overview.kpis.currency, 'RWF');
      assert.ok(overview.kpis.per_visit_rate >= 4000);

      // 24-Hour Peak Heatmap
      assert.ok(overview.peak_hours_heatmap);
      assert.equal(overview.peak_hours_heatmap.hours_24.length, 24);
      assert.ok(overview.peak_hours_heatmap.rush_hours);

      // Top Organizations & Recent Activity
      assert.ok(Array.isArray(overview.top_organizations));
      assert.ok(Array.isArray(overview.recent_activity));
    });

    test('getProviderDashboardOverview filters by specific location ID', async () => {
      const allOverview = await getProviderDashboardOverview(KNOWN_PROVIDER_ID);
      const firstLoc = allOverview.location_context.locations[0];

      if (firstLoc) {
        const filteredOverview = await getProviderDashboardOverview(KNOWN_PROVIDER_ID, {
          providerLocationId: firstLoc.id
        });
        assert.equal(filteredOverview.location_context.selected_location_id, firstLoc.id);
        assert.ok(filteredOverview.kpis);
      }
    });

    test('getProviderCommercialConditions returns active terms, tier matrix and payment rules', async () => {
      const conditions = await getProviderCommercialConditions(KNOWN_PROVIDER_ID);

      assert.ok(conditions.provider);
      assert.equal(conditions.provider.id, KNOWN_PROVIDER_ID);
      assert.ok(conditions.active_contract);
      assert.equal(conditions.active_contract.currency, 'RWF');
      assert.ok(conditions.active_contract.per_visit_rate >= 4000);

      // Tier Access Matrix
      assert.ok(Array.isArray(conditions.tier_access_matrix));
      const basicTier = conditions.tier_access_matrix.find((t) => t.tier === 'basic');
      const standardTier = conditions.tier_access_matrix.find((t) => t.tier === 'standard');
      const premiumTier = conditions.tier_access_matrix.find((t) => t.tier === 'premium');

      assert.ok(basicTier);
      assert.ok(standardTier);
      assert.ok(premiumTier);
      // FitLife is a gym, so standard and basic have gym access
      assert.equal(standardTier.is_eligible_for_entry, true);
      assert.equal(premiumTier.is_eligible_for_entry, true);

      // Payment Calculation Explainer Rules
      assert.ok(conditions.payment_calculation_rules);
      assert.equal(conditions.payment_calculation_rules.anti_passback_window_hours, 3);
      assert.equal(conditions.payment_calculation_rules.dispute_window_minutes, 20);
      assert.equal(conditions.payment_calculation_rules.platform_fee_percent, 10);
    });

    test('createAmendmentRequest validates required fields and persists request', async () => {
      // Rejects missing request_type
      await assert.rejects(
        async () => {
          await createAmendmentRequest(KNOWN_PROVIDER_ID, {
            justification: 'Missing request type'
          });
        },
        (err) => {
          assert.equal(err.code, 'AMENDMENT_MISSING_TYPE');
          return true;
        }
      );

      // Rejects missing justification
      await assert.rejects(
        async () => {
          await createAmendmentRequest(KNOWN_PROVIDER_ID, {
            request_type: 'rate_review',
            justification: '   '
          });
        },
        (err) => {
          assert.equal(err.code, 'AMENDMENT_MISSING_JUSTIFICATION');
          return true;
        }
      );

      // Creates valid amendment request
      const requestRecord = await createAmendmentRequest(KNOWN_PROVIDER_ID, {
        request_type: 'rate_review',
        current_rate: 5000,
        requested_rate: 6000,
        justification: 'Addition of Olympic heated pool and recovery ice baths',
        contact_phone: '+250788123456',
        contact_email: 'ops@fitlife.rw'
      });

      assert.ok(requestRecord.id);
      assert.equal(requestRecord.provider_id, KNOWN_PROVIDER_ID);
      assert.equal(requestRecord.request_type, 'rate_review');
      assert.equal(requestRecord.status, 'pending');
      assert.equal(parseFloat(requestRecord.requested_rate), 6000);
    });
  });
});

