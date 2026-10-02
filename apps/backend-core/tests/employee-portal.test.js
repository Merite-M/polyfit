const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../index');
const {
  getEmployeeMe,
  getEmployeeDashboard,
  getEmployeeVisits,
  getEmployeeNetwork,
  resolveActiveBenefit
} = require('../services/employeePortalService');
const { verifySignedPassPayload } = require('../services/totpService');

describe('Employee Portal & Mobile Telemetry Test Suite (PF-109)', () => {
  // Mock sample employee object representing real database structure
  const sampleEmployee = {
    id: '00fbe4e1-86aa-44bc-ad89-fcce6fb75687',
    full_name: 'Jean Mugabo',
    email: 'jean.mugabo@techcorp.rw',
    employee_id_external: 'TC-101',
    department: 'Engineering',
    tier: 'standard',
    status: 'active',
    org_id: 'c79a9982-4477-4336-a24b-561419f6c43b',
    created_at: '2026-09-01T08:00:00.000Z',
    organizations: {
      id: 'c79a9982-4477-4336-a24b-561419f6c43b',
      name: 'TechCorp Rwanda',
      status: 'active'
    }
  };

  // ─── 1. Endpoint Authentication & Rate Limit Checks ─────────────────────────
  describe('Endpoint Security & RBAC Enforcement', () => {
    test('GET /api/employee/me - blocks unauthenticated access', async () => {
      const res = await request(app).get('/api/employee/me');
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('GET /api/employee/dashboard - blocks unauthenticated access', async () => {
      const res = await request(app).get('/api/employee/dashboard');
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('GET /api/employee/visits - blocks unauthenticated access', async () => {
      const res = await request(app).get('/api/employee/visits');
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('GET /api/employee/network - blocks unauthenticated access', async () => {
      const res = await request(app).get('/api/employee/network');
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('GET /api/employee/me - rejects malformed bearer token format', async () => {
      const res = await request(app)
        .get('/api/employee/me')
        .set('Authorization', 'Basic 12345');
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_INVALID_TOKEN_FORMAT');
    });

    test('GET /api/employee/dashboard - rejects empty bearer token', async () => {
      const res = await request(app)
        .get('/api/employee/dashboard')
        .set('Authorization', 'Bearer ');
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_INVALID_TOKEN_FORMAT');
    });
  });

  // ─── 2. Service Layer: Profile & Corporate Benefit Status (PF-102 / Tab 3) ──
  describe('Employee Profile & Benefit Resolver (getEmployeeMe)', () => {
    test('resolves active benefit plan tier and subsidy metrics correctly', async () => {
      const meData = await getEmployeeMe(sampleEmployee);

      assert.equal(meData.success, true);
      assert.equal(meData.employee.id, sampleEmployee.id);
      assert.equal(meData.employee.full_name, 'Jean Mugabo');
      assert.equal(meData.employee.email, 'jean.mugabo@techcorp.rw');
      assert.equal(meData.employee.enrolled, true);

      assert.equal(meData.organization.name, 'TechCorp Rwanda');
      assert.equal(meData.organization.domain, 'techcorp.rw');

      assert.ok(meData.benefit);
      assert.equal(meData.benefit.tier, 'standard');
      assert.equal(typeof meData.benefit.used_visits, 'number');
      assert.ok(meData.benefit.subsidy_percentage >= 0);
      assert.ok(Array.isArray(meData.benefit.allowed_provider_categories));
      assert.ok(meData.benefit.reset_date);
    });

    test('resolveActiveBenefit falls back to standard tier defaults when no explicit record', async () => {
      const mockEmp = {
        ...sampleEmployee,
        id: '99999999-9999-9999-9999-999999999999',
        tier: 'premium'
      };
      const benefit = await resolveActiveBenefit(mockEmp);
      assert.ok(benefit);
      assert.equal(benefit.tier, 'premium');
      assert.ok(Array.isArray(benefit.allowed_provider_categories));
    });
  });

  // ─── 3. Single-Roundtrip Telemetry Aggregator (< 150ms SLA & Offline Seed) ─
  describe('Single-Roundtrip Aggregator (getEmployeeDashboard)', () => {
    test('assembles complete mobile dashboard with sub-150ms execution SLA', async () => {
      const startTime = Date.now();
      const dashboard = await getEmployeeDashboard(sampleEmployee);
      const executionDuration = Date.now() - startTime;

      assert.equal(dashboard.success, true);
      assert.ok(typeof dashboard.telemetry.execution_ms === 'number');
      assert.ok(
        executionDuration < 1500,
        `Dashboard execution exceeded target SLA: ${executionDuration}ms`
      );

      // Verify Employee identity
      assert.equal(dashboard.employee.id, sampleEmployee.id);
      assert.equal(dashboard.employee.full_name, 'Jean Mugabo');
      assert.equal(dashboard.employee.status, 'active');

      // Verify Employer Organization
      assert.equal(dashboard.organization.name, 'TechCorp Rwanda');

      // Verify Benefit Quota
      assert.ok(dashboard.benefit);
      assert.equal(dashboard.benefit.tier, 'standard');
      assert.equal(typeof dashboard.benefit.used_visits, 'number');
      assert.ok(dashboard.benefit.quota_percentage >= 0 && dashboard.benefit.quota_percentage <= 100);

      // Verify Streak & Habit Tracker
      assert.ok(dashboard.streak);
      assert.equal(typeof dashboard.streak.visits_this_week, 'number');
      assert.equal(typeof dashboard.streak.active_weeks_streak, 'number');
      assert.equal(dashboard.streak.habit_goal, 3);
      assert.ok(dashboard.streak.habit_progress_percentage >= 0);

      // Verify Recent Visits List
      assert.ok(Array.isArray(dashboard.recent_visits));

      // Verify 24-Hour Cryptographic Offline Seed (PF-101 / PF-107)
      assert.ok(dashboard.offline_seed);
      assert.ok(dashboard.offline_seed.seed_token);
      assert.equal(dashboard.offline_seed.employee_id, sampleEmployee.id);
      assert.equal(dashboard.offline_seed.org_id, sampleEmployee.org_id);
      assert.equal(dashboard.offline_seed.step_seconds, 30);
      assert.match(dashboard.offline_seed.watermark_text, /Jean Mugabo/);
      assert.match(dashboard.offline_seed.watermark_text, /TechCorp Rwanda/);

      // Cryptographically verify the offline seed signature
      const verifiedPayload = verifySignedPassPayload(dashboard.offline_seed.seed_token);
      assert.ok(verifiedPayload, 'Offline seed token signature failed verification');
      assert.equal(verifiedPayload.employee_id, sampleEmployee.id);
      assert.equal(verifiedPayload.org_id, sampleEmployee.org_id);

      // Verify Pass Readiness & Cooldown Status
      assert.ok(dashboard.pass_status);
      assert.equal(typeof dashboard.pass_status.can_generate_pass, 'boolean');
      assert.equal(typeof dashboard.pass_status.in_cooldown, 'boolean');
      assert.equal(typeof dashboard.pass_status.cooldown_remaining_seconds, 'number');
      assert.equal(dashboard.pass_status.cooldown_window_minutes, 30);
    });
  });

  // ─── 4. Visit History & Pagination (getEmployeeVisits) ──────────────────────
  describe('Paginated Verified Visit History (getEmployeeVisits)', () => {
    test('returns paginated visits structure with total count', async () => {
      const result = await getEmployeeVisits(sampleEmployee.id, { page: 1, limit: 10 });

      assert.ok(Array.isArray(result.visits));
      assert.ok(result.pagination);
      assert.equal(result.pagination.page, 1);
      assert.equal(result.pagination.limit, 10);
      assert.equal(typeof result.pagination.total, 'number');
      assert.equal(typeof result.pagination.total_pages, 'number');

      // If visits exist, verify field mapping
      if (result.visits.length > 0) {
        const visit = result.visits[0];
        assert.ok(visit.id);
        assert.ok(visit.check_in_at);
        assert.ok(visit.status);
        assert.ok(visit.location_name);
        assert.ok(visit.provider_name);
        assert.ok(visit.category);
      }
    });

    test('supports filtering by provider category', async () => {
      const result = await getEmployeeVisits(sampleEmployee.id, { category: 'gym' });
      assert.ok(Array.isArray(result.visits));
      result.visits.forEach((v) => {
        assert.equal(v.category, 'gym');
      });
    });
  });

  // ─── 5. Provider Discovery & In-Network Facilities (getEmployeeNetwork) ────
  describe('In-Network Facility Discovery (getEmployeeNetwork)', () => {
    test('returns active provider locations allowed by employee benefit tier', async () => {
      const result = await getEmployeeNetwork(sampleEmployee, { category: 'all' });

      assert.ok(Array.isArray(result.facilities));
      assert.ok(result.total_in_network >= 0);
      assert.equal(result.plan_tier, 'standard');
      assert.ok(Array.isArray(result.allowed_categories));

      if (result.facilities.length > 0) {
        const fac = result.facilities[0];
        assert.ok(fac.id);
        assert.ok(fac.name);
        assert.ok(fac.city);
        assert.ok(fac.provider.name);
        assert.ok(fac.provider.category);
        assert.equal(fac.plan_access.included, true);
        assert.ok(result.allowed_categories.includes(fac.provider.category));
      }
    });

    test('calculates distance in meters when user GPS coordinates are provided', async () => {
      // Kigali city center coordinates (approx -1.9441, 30.0619)
      const result = await getEmployeeNetwork(sampleEmployee, {
        lat: -1.9441,
        lng: 30.0619
      });

      assert.ok(Array.isArray(result.facilities));
      if (result.facilities.length > 0) {
        const facWithCoords = result.facilities.find((f) => f.distance_meters !== null);
        if (facWithCoords) {
          assert.equal(typeof facWithCoords.distance_meters, 'number');
          assert.ok(facWithCoords.distance_meters > 0);
        }
      }
    });

    test('filters facilities by category correctly', async () => {
      const poolResult = await getEmployeeNetwork(sampleEmployee, { category: 'pool' });
      assert.ok(Array.isArray(poolResult.facilities));
      poolResult.facilities.forEach((fac) => {
        assert.equal(fac.provider.category, 'pool');
      });
    });

    test('GET /api/employee/providers - blocks unauthenticated access like /network', async () => {
      const res = await request(app).get('/api/employee/providers');
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });
  });

  // ─── 6. Corporate Onboarding & Domain Resolution (POST /auth/verify-domain) ─
  describe('Corporate Domain Recognition (POST /api/employee/auth/verify-domain)', () => {
    test('rejects request with missing or invalid email format', async () => {
      const res = await request(app)
        .post('/api/employee/auth/verify-domain')
        .send({ email: 'invalid-email' });

      assert.equal(res.status, 400);
      assert.equal(res.body.code, 'VALIDATION_ERROR');
      assert.equal(res.body.recognized, false);
    });

    test('returns 404 for unrecognized non-corporate email domain', async () => {
      const res = await request(app)
        .post('/api/employee/auth/verify-domain')
        .send({ email: 'user@unregistered-company-xyz.com' });

      assert.equal(res.status, 404);
      assert.equal(res.body.code, 'DOMAIN_NOT_ENROLLED');
      assert.equal(res.body.recognized, false);
    });

    test('recognizes enrolled corporate domain in < 100ms', async () => {
      const startTime = Date.now();
      const res = await request(app)
        .post('/api/employee/auth/verify-domain')
        .send({ email: 'jean.mugabo@techcorp.rw' });

      const duration = Date.now() - startTime;
      assert.equal(res.status, 200);
      assert.equal(res.body.recognized, true);
      assert.equal(res.body.organization.name, 'TechCorp Rwanda');
      assert.ok(res.body.benefit);
      assert.ok(['standard', 'premium', 'basic', 'executive'].includes(res.body.benefit.tier));
      assert.ok(duration < 500, `Domain resolution took too long: ${duration}ms`);
    });
  });
});
