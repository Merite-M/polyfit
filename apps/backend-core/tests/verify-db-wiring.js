/**
 * PolyFit Complete Endpoint Database Wiring Audit Script
 * Runs end-to-end verification against all 33 endpoints across 15 router modules
 * verifying live database connectivity, real data retrieval, and status codes.
 */

const request = require('supertest');
const app = require('../index');
const { supabase } = require('@polyfit/supabase-client');

const SUPER_ADMIN_TOKEN = 'Bearer demo-super-admin-token';
const ORG_ADMIN_TOKEN = 'Bearer demo-org-admin-token';
const PROVIDER_ADMIN_TOKEN = 'Bearer demo-provider-admin-token';

const KTI_ORG_ID = '02f13bdc-ce25-4c9d-b712-451c06a63fa2';
const CLAIRE_EMP_ID = '6f49f5f6-a72d-44d2-bac5-82db218b00ce';
const FITLIFE_PROVIDER_ID = '90d06d31-999c-42c0-a0c6-fc31ec818ced';
const FITLIFE_LOCATION_ID = '447f4bf2-ff66-48c5-851e-460cba17bfe4';

async function runAudit() {
  console.log('='.repeat(70));
  console.log(' POLYFIT COMPLETE ENDPOINT DATABASE WIRING AUDIT');
  console.log('='.repeat(70));
  console.log('Target Supabase DB Project: meszhexftehllnsyhbha');
  console.log('Testing 33 endpoints across 15 router domains...\n');

  // Obtain real live authenticated beneficiary token for Claire Mukamana
  let claireAuthToken = null;
  try {
    await request(app).post('/api/employee/auth/request-access').send({ email: 'claire@kigalitech.rw' });
    const verifyRes = await request(app).post('/api/employee/auth/verify-access').send({
      email: 'claire@kigalitech.rw',
      code: '123456'
    });
    if (verifyRes.body && verifyRes.body.token) {
      claireAuthToken = `Bearer ${verifyRes.body.token}`;
      console.log('✓ Successfully authenticated Claire Mukamana with real DB JWT session\n');
    }
  } catch (err) {
    console.warn('Note: Could not get dynamic Claire session, will fallback to super admin token');
  }

  const beneficiaryToken = claireAuthToken || SUPER_ADMIN_TOKEN;

  const tests = [
    // 1. Health
    {
      name: '1. GET /health (Supabase RPC version check)',
      fn: () => request(app).get('/health'),
      validate: (res) => res.status === 200 && res.body.database === 'connected'
    },
    // 2. Public Platform Config
    {
      name: '2. GET /api/public/platform-config (platform_settings, counts, master_plans)',
      fn: () => request(app).get('/api/public/platform-config'),
      validate: (res) => res.status === 200 && res.body.settings && Array.isArray(res.body.pricing) && res.body.pricing.length > 0
    },
    // 3. Public Verify Company
    {
      name: '3. GET /api/public/verify-company (organizations & domain search)',
      fn: () => request(app).get('/api/public/verify-company?query=kigalitech.rw'),
      validate: (res) => res.status === 200 && (res.body.recognized === true || res.body.enrolled === true)
    },
    // 4. Public Corporate Portal Data
    {
      name: '4. GET /api/public/corporate/portal-data (org, benefits, employees, visits, invoice)',
      fn: () => request(app).get('/api/public/corporate/portal-data?slug=kigali-tech-innovations'),
      validate: (res) => res.status === 200 && res.body.organization?.id === KTI_ORG_ID && res.body.employees?.length >= 5
    },
    // 5. Employee Portal Verify Domain
    {
      name: '5. POST /api/employee/auth/verify-domain (organizations allowed_domains query)',
      fn: () => request(app).post('/api/employee/auth/verify-domain').send({ email: 'claire@kigalitech.rw' }),
      validate: (res) => res.status === 200 && res.body.recognized === true && res.body.organization?.name.includes('Kigali Tech')
    },
    // 6. Employee Portal Request Access
    {
      name: '6. POST /api/employee/auth/request-access (OTP creation & signInWithOtp dispatch)',
      fn: () => request(app).post('/api/employee/auth/request-access').send({ email: 'claire@kigalitech.rw' }),
      validate: (res) => res.status === 200 && res.body.success === true
    },
    // 7. Employee Portal Me Profile
    {
      name: '7. GET /api/employee/me (employee profile, active benefit & remaining quota)',
      fn: () => request(app).get(`/api/employee/me?employee_id=${CLAIRE_EMP_ID}`).set('Authorization', beneficiaryToken),
      validate: (res) => res.status === 200 && res.body.employee?.id === CLAIRE_EMP_ID && res.body.benefit?.name !== undefined
    },
    // 8. Employee Portal Network
    {
      name: '8. GET /api/employee/network (provider_locations & providers catalogue query)',
      fn: () => request(app).get(`/api/employee/network?employee_id=${CLAIRE_EMP_ID}`).set('Authorization', beneficiaryToken),
      validate: (res) => res.status === 200 && (Array.isArray(res.body.facilities) || Array.isArray(res.body.locations) || res.body.success === true)
    },
    // 9. Organizations List
    {
      name: '9. GET /api/organizations (organizations table query with count)',
      fn: () => request(app).get('/api/organizations').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.organizations?.length > 0
    },
    // 10. Organization Detail
    {
      name: '10. GET /api/organizations/:id (organization profile + active employees count)',
      fn: () => request(app).get(`/api/organizations/${KTI_ORG_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.organization?.id === KTI_ORG_ID
    },
    // 11. Employees List
    {
      name: '11. GET /api/organizations/:orgId/employees (employees table query for org)',
      fn: () => request(app).get(`/api/organizations/${KTI_ORG_ID}/employees`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.employees) && res.body.employees.length >= 5
    },
    // 12. Benefits List
    {
      name: '12. GET /api/organizations/:orgId/benefits (benefits plans table query for org)',
      fn: () => request(app).get(`/api/organizations/${KTI_ORG_ID}/benefits`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.benefits) && res.body.benefits.length >= 1
    },
    // 13. Eligibility Check
    {
      name: '13. POST /api/eligibility/check (real-time eligibility & quota evaluation engine)',
      fn: () => request(app).post('/api/eligibility/check')
        .set('Authorization', SUPER_ADMIN_TOKEN)
        .send({ employee_id: CLAIRE_EMP_ID, provider_location_id: FITLIFE_LOCATION_ID }),
      validate: (res) => res.status === 200 && typeof res.body.eligible === 'boolean'
    },
    // 14. Eligibility Employee Summary
    {
      name: '14. GET /api/eligibility/employee/:employeeId (eligibility, benefits & visits count)',
      fn: () => request(app).get(`/api/eligibility/employee/${CLAIRE_EMP_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.employee?.id === CLAIRE_EMP_ID && res.body.quota
    },
    // 15. Providers Discover
    {
      name: '15. GET /api/providers/discover (geo & category discovery across provider_locations)',
      fn: () => request(app).get('/api/providers/discover?category=gym'),
      validate: (res) => res.status === 200 && (Array.isArray(res.body.results) || Array.isArray(res.body.locations))
    },
    // 16. Providers List
    {
      name: '16. GET /api/providers (providers table query)',
      fn: () => request(app).get('/api/providers').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.providers) && res.body.providers.length > 0
    },
    // 17. Provider Detail
    {
      name: '17. GET /api/providers/:id (provider profile query)',
      fn: () => request(app).get(`/api/providers/${FITLIFE_PROVIDER_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.provider?.id === FITLIFE_PROVIDER_ID
    },
    // 18. Provider Locations
    {
      name: '18. GET /api/providers/:id/locations (locations query for provider)',
      fn: () => request(app).get(`/api/providers/${FITLIFE_PROVIDER_ID}/locations`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.locations) && res.body.locations.length > 0
    },
    // 19. Provider Contracts List
    {
      name: '19. GET /api/provider-contracts (provider_contracts table query)',
      fn: () => request(app).get('/api/provider-contracts').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.contracts) && res.body.contracts.length > 0
    },
    // 20. Visits Today Summary
    {
      name: '20. GET /api/visits/today-summary (visits table aggregation for today)',
      fn: () => request(app).get(`/api/visits/today-summary?provider_location_id=${FITLIFE_LOCATION_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.success === true && typeof res.body.summary?.total_visits_today === 'number'
    },
    // 21. Visits Pending Queue
    {
      name: '21. GET /api/visits/pending (visits table with status=pending)',
      fn: () => request(app).get(`/api/visits/pending?provider_location_id=${FITLIFE_LOCATION_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && (Array.isArray(res.body.visits) || Array.isArray(res.body.pending_visits))
    },
    // 22. Visits History Feed
    {
      name: '22. GET /api/visits (visits table query with pagination)',
      fn: () => request(app).get('/api/visits?limit=10').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.visits)
    },
    // 23. Billing Summary
    {
      name: '23. GET /api/billing/summary (invoices & visits aggregation for employer)',
      fn: () => request(app).get(`/api/billing/summary?org_id=${KTI_ORG_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.ytd_total_spent !== undefined
    },
    // 24. Billing Invoices
    {
      name: '24. GET /api/billing/invoices (invoices table query for employer)',
      fn: () => request(app).get(`/api/billing/invoices?org_id=${KTI_ORG_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.invoices)
    },
    // 25. Settlements List
    {
      name: '25. GET /api/settlements (settlements table query for provider)',
      fn: () => request(app).get(`/api/settlements?provider_id=${FITLIFE_PROVIDER_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.settlements)
    },
    // 26. Operations Overview Telemetry
    {
      name: '26. GET /api/operations/overview (8-table cross-portal platform telemetry)',
      fn: () => request(app).get('/api/operations/overview').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.success === true && res.body.network?.employers?.total !== undefined
    },
    // 27. Operations Omnibar Search
    {
      name: '27. GET /api/operations/search (full-text search across orgs, providers, visits)',
      fn: () => request(app).get('/api/operations/search?q=kigali').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.results !== undefined
    },
    // 28. Operations Locations Map
    {
      name: '28. GET /api/operations/locations (provider_locations geo coordinates)',
      fn: () => request(app).get('/api/operations/locations').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.locations) && res.body.locations.length > 0
    },
    // 29. Operations Platform Settings
    {
      name: '29. GET /api/operations/settings (platform_settings table query)',
      fn: () => request(app).get('/api/operations/settings').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.settings?.anti_passback_window_minutes !== undefined
    },
    // 30. Operations Team Directory
    {
      name: '30. GET /api/operations/team (user_roles table & RBAC directory)',
      fn: () => request(app).get('/api/operations/team').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.operators) && Array.isArray(res.body.roleMatrix)
    },
    // 31. Operations Master Plans
    {
      name: '31. GET /api/operations/plans (master_plans table query & enrollment metrics)',
      fn: () => request(app).get('/api/operations/plans').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.plans) && res.body.plans.length > 0
    },
    // 32. Reporting Employer Utilization
    {
      name: '32. GET /api/reporting/employer/:orgId/utilization (visits & employees utilization stats)',
      fn: () => request(app).get(`/api/reporting/employer/${KTI_ORG_ID}/utilization`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.organization?.id === KTI_ORG_ID
    },
    // 33. Reporting Platform Overview
    {
      name: '33. GET /api/reporting/platform/overview (platform-wide KPIs & category breakdown)',
      fn: () => request(app).get('/api/reporting/platform/overview').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.networkScale?.totalOrganizations !== undefined
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    const start = Date.now();
    try {
      const res = await t.fn();
      const duration = Date.now() - start;
      const ok = t.validate(res);
      if (ok) {
        console.log(`[PASS] ${t.name} (${duration}ms) [HTTP ${res.status}]`);
        passed++;
      } else {
        console.error(`[FAIL] ${t.name} (${duration}ms) [HTTP ${res.status}]`);
        console.error('       Response Body:', JSON.stringify(res.body).slice(0, 200));
        failed++;
      }
    } catch (err) {
      const duration = Date.now() - start;
      console.error(`[ERROR] ${t.name} (${duration}ms):`, err.message);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(` AUDIT SUMMARY: ${passed}/${tests.length} ENDPOINTS PASSED (${failed} FAILED)`);
  console.log('='.repeat(70));

  if (failed > 0) {
    process.exit(1);
  }
}

runAudit();
