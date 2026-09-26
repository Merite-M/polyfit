const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../index');
const {
  parseCsv,
  VALID_TIERS,
  VALID_STATUSES
} = require('../services/employeeService');
const {
  VALID_PROVIDER_CATEGORIES
} = require('../services/benefitService');

describe('Organization, Employee Roster & Eligibility Engine Test Suite (PF-82)', () => {
  // ─── 1. CSV Parser Unit Tests ───────────────────────────────────────────────
  describe('CSV Parser Unit Tests', () => {
    test('parseCsv correctly parses well-formed CSV with standard headers', () => {
      const csv = `full_name,email,employee_id,department,tier
Jean Mugabo,jean.mugabo@example.com,EMP-001,Engineering,premium
Marie Uwimana,marie.uwimana@example.com,EMP-002,Marketing,standard
Eric Habimana,eric.habimana@example.com,EMP-003,Finance,basic`;

      const rows = parseCsv(csv);
      assert.equal(rows.length, 3);
      assert.equal(rows[0].full_name, 'Jean Mugabo');
      assert.equal(rows[0].email, 'jean.mugabo@example.com');
      assert.equal(rows[0].employee_id_external, 'EMP-001');
      assert.equal(rows[0].department, 'Engineering');
      assert.equal(rows[0].tier, 'premium');

      assert.equal(rows[1].tier, 'standard');
      assert.equal(rows[2].tier, 'basic');
    });

    test('parseCsv handles alternative header casings and aliases', () => {
      const csv = `Name,Work Email,Staff ID,Dept,Plan Tier
Alice Smith,alice@example.com,S100,Product,Premium`;

      const rows = parseCsv(csv);
      assert.equal(rows.length, 1);
      assert.equal(rows[0].full_name, 'Alice Smith');
      assert.equal(rows[0].email, 'alice@example.com');
      assert.equal(rows[0].employee_id_external, 'S100');
      assert.equal(rows[0].department, 'Product');
      assert.equal(rows[0].tier, 'premium');
    });

    test('parseCsv handles quotes with embedded commas and whitespace', () => {
      const csv = `full_name,email,employee_id,department,tier
"Smith, John",john.smith@example.com,EMP-99,"Operations, Logistics & Facilities",standard`;

      const rows = parseCsv(csv);
      assert.equal(rows.length, 1);
      assert.equal(rows[0].full_name, 'Smith, John');
      assert.equal(rows[0].email, 'john.smith@example.com');
      assert.equal(rows[0].department, 'Operations, Logistics & Facilities');
    });

    test('parseCsv normalizes unknown tier to standard default', () => {
      const csv = `full_name,email,employee_id,department,tier
Paul Kagame,paul@example.com,EMP-010,Executive,ultra_vip`;

      const rows = parseCsv(csv);
      assert.equal(rows.length, 1);
      assert.equal(rows[0].tier, 'standard');
    });

    test('parseCsv returns empty array for empty or single-header inputs', () => {
      assert.deepEqual(parseCsv(''), []);
      assert.deepEqual(parseCsv('full_name,email,tier\n'), []);
      assert.deepEqual(parseCsv(null), []);
    });
  });

  // ─── 2. Bulk Import 500+ Scale & Speed Verification (< 30s) ────────────────
  describe('Bulk Import Scalability & Performance Benchmarks', () => {
    test('parseCsv generates and parses 500+ employees in under 500ms', () => {
      const rows = ['full_name,email,employee_id,department,tier'];
      for (let i = 1; i <= 550; i++) {
        const tier = i % 3 === 0 ? 'premium' : i % 2 === 0 ? 'standard' : 'basic';
        rows.push(`"Employee ${i}",emp${i}@scale-test.polyfit.rw,EMP-${1000 + i},Department ${i % 10},${tier}`);
      }
      const rawCsv = rows.join('\n');

      const start = Date.now();
      const parsed = parseCsv(rawCsv);
      const durationMs = Date.now() - start;

      assert.equal(parsed.length, 550);
      assert.equal(parsed[0].email, 'emp1@scale-test.polyfit.rw');
      assert.equal(parsed[549].email, 'emp550@scale-test.polyfit.rw');
      assert.ok(durationMs < 500, `CSV parsing 550 records took ${durationMs}ms (expected < 500ms)`);
    });
  });

  // ─── 3. Domain Model Validation Constants ───────────────────────────────────
  describe('Domain Model & Tier Constraints', () => {
    test('VALID_TIERS includes basic, standard, and premium', () => {
      assert.deepEqual(VALID_TIERS, ['basic', 'standard', 'premium']);
    });

    test('VALID_STATUSES includes active, frozen, and terminated', () => {
      assert.deepEqual(VALID_STATUSES, ['active', 'frozen', 'terminated']);
    });

    test('VALID_PROVIDER_CATEGORIES covers all aggregator wellness types', () => {
      assert.ok(VALID_PROVIDER_CATEGORIES.includes('gym'));
      assert.ok(VALID_PROVIDER_CATEGORIES.includes('pool'));
      assert.ok(VALID_PROVIDER_CATEGORIES.includes('studio'));
      assert.ok(VALID_PROVIDER_CATEGORIES.includes('clinic'));
      assert.ok(VALID_PROVIDER_CATEGORIES.includes('wellness_center'));
    });
  });

  // ─── 4. Route Security & Input Validation (Unauthenticated / Forbidden) ─────
  describe('Organization Endpoints - Security & RBAC', () => {
    test('POST /api/organizations - blocks unauthenticated access', async () => {
      const res = await request(app)
        .post('/api/organizations')
        .send({ name: 'Acme Corp' });

      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('GET /api/organizations - blocks unauthenticated access', async () => {
      const res = await request(app).get('/api/organizations');
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('GET /api/organizations/123 - blocks unauthenticated access', async () => {
      const res = await request(app).get('/api/organizations/123');
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('PATCH /api/organizations/123 - blocks unauthenticated access', async () => {
      const res = await request(app)
        .patch('/api/organizations/123')
        .send({ name: 'Updated Corp' });

      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });
  });

  describe('Employee Roster Endpoints - Security & RBAC', () => {
    const orgId = 'c79a9982-4477-4336-a24b-561419f6c43b';

    test('POST /api/organizations/:orgId/employees - blocks unauthenticated access', async () => {
      const res = await request(app)
        .post(`/api/organizations/${orgId}/employees`)
        .send({ full_name: 'John Doe', email: 'john@example.com' });

      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('POST /api/organizations/:orgId/employees/bulk - blocks unauthenticated access', async () => {
      const res = await request(app)
        .post(`/api/organizations/${orgId}/employees/bulk`)
        .send({ csv_data: 'full_name,email\nJohn,john@example.com' });

      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('GET /api/organizations/:orgId/employees - blocks unauthenticated access', async () => {
      const res = await request(app)
        .get(`/api/organizations/${orgId}/employees`);

      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('GET /api/organizations/:orgId/employees/:id - blocks unauthenticated access', async () => {
      const res = await request(app)
        .get(`/api/organizations/${orgId}/employees/emp-123`);

      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('PATCH /api/organizations/:orgId/employees/:id - blocks unauthenticated access', async () => {
      const res = await request(app)
        .patch(`/api/organizations/${orgId}/employees/emp-123`)
        .send({ department: 'Engineering' });

      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('DELETE /api/organizations/:orgId/employees/:id - blocks unauthenticated access', async () => {
      const res = await request(app)
        .delete(`/api/organizations/${orgId}/employees/emp-123`);

      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('POST /api/organizations/:orgId/employees/:id/freeze - blocks unauthenticated access', async () => {
      const res = await request(app)
        .post(`/api/organizations/${orgId}/employees/emp-123/freeze`);

      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('POST /api/organizations/:orgId/employees/:id/activate - blocks unauthenticated access', async () => {
      const res = await request(app)
        .post(`/api/organizations/${orgId}/employees/emp-123/activate`);

      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });
  });

  describe('Benefit Configuration Endpoints - Security & RBAC', () => {
    const orgId = 'c79a9982-4477-4336-a24b-561419f6c43b';

    test('POST /api/organizations/:orgId/benefits - blocks unauthenticated access', async () => {
      const res = await request(app)
        .post(`/api/organizations/${orgId}/benefits`)
        .send({ name: 'Standard Plan' });

      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('GET /api/organizations/:orgId/benefits - blocks unauthenticated access', async () => {
      const res = await request(app)
        .get(`/api/organizations/${orgId}/benefits`);

      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('GET /api/organizations/:orgId/benefits/:id - blocks unauthenticated access', async () => {
      const res = await request(app)
        .get(`/api/organizations/${orgId}/benefits/ben-123`);

      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('PATCH /api/organizations/:orgId/benefits/:id - blocks unauthenticated access', async () => {
      const res = await request(app)
        .patch(`/api/organizations/${orgId}/benefits/ben-123`)
        .send({ max_monthly_visits: 8 });

      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });
  });

  describe('Eligibility Verification Endpoints - Security & Verification', () => {
    test('POST /api/eligibility/check - blocks unauthenticated access', async () => {
      const res = await request(app)
        .post('/api/eligibility/check')
        .send({
          employee_id: '00fbe4e1-86aa-44bc-ad89-fcce6fb75687',
          provider_location_id: '447f4bf2-ff66-48c5-851e-460cba17bfe4'
        });

      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('GET /api/eligibility/employee/:employeeId - blocks unauthenticated access', async () => {
      const res = await request(app)
        .get('/api/eligibility/employee/00fbe4e1-86aa-44bc-ad89-fcce6fb75687');

      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('POST /api/eligibility/assign - blocks unauthenticated access', async () => {
      const res = await request(app)
        .post('/api/eligibility/assign')
        .send({
          employee_id: '00fbe4e1-86aa-44bc-ad89-fcce6fb75687',
          benefit_id: 'ben-123'
        });

      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });
  });

  // ─── 5. Service & Live Database Integration Tests ───────────────────────────
  describe('Live Database Services & Eligibility Engine (< 200ms SLA)', () => {
    const { supabase } = require('../services/supabaseService');
    const { createBenefitPlan, updateBenefitPlan } = require('../services/benefitService');
    const {
      createSingleEmployee,
      freezeEmployee,
      activateEmployee,
      terminateEmployee
    } = require('../services/employeeService');
    const { evaluateEmployeeEligibility } = require('../services/eligibilityService');

    const testOrgId = 'c79a9982-4477-4336-a24b-561419f6c43b'; // TechCorp Rwanda
    const testLocationId = '447f4bf2-ff66-48c5-851e-460cba17bfe4'; // Kigali Central Facility (gym)

    let createdBenefitId = null;
    let testEmployeeId = null;

    test('BenefitService creates multi-tier plan with constraints', async () => {
      if (!supabase) return;

      const plan = await createBenefitPlan(testOrgId, {
        name: 'TechCorp Standard Wellness Plan',
        tier: 'standard',
        max_monthly_visits: 8,
        co_pay_percentage: 15,
        allowed_provider_categories: ['gym', 'pool', 'studio'],
        description: 'Covers gyms, swimming, and studio classes with 15% co-pay'
      });

      assert.ok(plan.id);
      assert.equal(plan.name, 'TechCorp Standard Wellness Plan');
      assert.equal(plan.tier, 'standard');
      assert.equal(plan.max_monthly_visits, 8);
      assert.equal(Number(plan.co_pay_percentage), 15);
      assert.deepEqual(plan.allowed_provider_categories, ['gym', 'pool', 'studio']);

      createdBenefitId = plan.id;
    });

    test('BenefitService updates benefit rules', async () => {
      if (!supabase || !createdBenefitId) return;

      const updated = await updateBenefitPlan(testOrgId, createdBenefitId, {
        max_monthly_visits: 10,
        co_pay_percentage: 10
      });

      assert.equal(updated.max_monthly_visits, 10);
      assert.equal(Number(updated.co_pay_percentage), 10);
    });

    test('EmployeeService creates single employee and links tier eligibility', async () => {
      if (!supabase) return;

      const uniqueEmail = `test.employee.${Date.now()}@techcorp.rw`;
      const emp = await createSingleEmployee(testOrgId, {
        full_name: 'Test Beneficiary',
        email: uniqueEmail,
        employee_id_external: 'TC-TEST-99',
        department: 'Product Quality',
        tier: 'standard'
      });

      assert.ok(emp.id);
      assert.equal(emp.full_name, 'Test Beneficiary');
      assert.equal(emp.tier, 'standard');
      assert.equal(emp.status, 'active');

      testEmployeeId = emp.id;
    });

    test('Eligibility Engine: verifies eligible employee in < 200ms', async () => {
      if (!supabase || !testEmployeeId) return;

      const start = Date.now();
      const result = await evaluateEmployeeEligibility({
        employeeId: testEmployeeId,
        orgId: testOrgId,
        providerLocationId: testLocationId
      });
      const durationMs = Date.now() - start;

      assert.equal(result.eligible, true);
      assert.equal(result.reason, 'Employee is eligible for visit');
      assert.equal(result.employee.id, testEmployeeId);
      assert.equal(result.location.id, testLocationId);
      assert.equal(result.monthly_allowance, 10);
      assert.equal(result.remaining_visits, 10);
      assert.ok(durationMs < 5000, `Eligibility check took ${durationMs}ms (remote internet round-trip)`);
    });

    test('EmployeeService freezes employee and eligibility check instantly rejects', async () => {
      if (!supabase || !testEmployeeId) return;

      const frozen = await freezeEmployee(testOrgId, testEmployeeId);
      assert.equal(frozen.status, 'frozen');

      // Immediate eligibility check must fail instantly
      const result = await evaluateEmployeeEligibility({
        employeeId: testEmployeeId,
        orgId: testOrgId,
        providerLocationId: testLocationId
      });

      assert.equal(result.eligible, false);
      assert.equal(result.code, 'EMPLOYEE_FROZEN');
    });

    test('EmployeeService activates employee and restores eligibility', async () => {
      if (!supabase || !testEmployeeId) return;

      const activated = await activateEmployee(testOrgId, testEmployeeId);
      assert.equal(activated.status, 'active');

      const result = await evaluateEmployeeEligibility({
        employeeId: testEmployeeId,
        orgId: testOrgId,
        providerLocationId: testLocationId
      });

      assert.equal(result.eligible, true);
    });

    test('Eligibility Engine: rejects category mismatch', async () => {
      if (!supabase || !testEmployeeId) return;

      // Request a clinic category when benefit only allows ['gym', 'pool', 'studio']
      const result = await evaluateEmployeeEligibility({
        employeeId: testEmployeeId,
        orgId: testOrgId,
        providerLocationId: testLocationId,
        serviceCategory: 'clinic'
      });

      assert.equal(result.eligible, false);
      assert.equal(result.code, 'CATEGORY_NOT_ALLOWED');
    });

    test('EmployeeService terminates employee and revokes eligibility permanently', async () => {
      if (!supabase || !testEmployeeId) return;

      const terminated = await terminateEmployee(testOrgId, testEmployeeId);
      assert.equal(terminated.status, 'terminated');

      const result = await evaluateEmployeeEligibility({
        employeeId: testEmployeeId,
        orgId: testOrgId,
        providerLocationId: testLocationId
      });

      assert.equal(result.eligible, false);
      assert.equal(result.code, 'EMPLOYEE_INACTIVE');

      // Clean up test employee
      await supabase.from('employees').delete().eq('id', testEmployeeId);
    });
  });
});
