/**
 * PolyFit Comprehensive Full-Spectrum Database Wiring Audit
 * Dynamically queries real IDs from Supabase and tests ALL operational read, 
 * reporting, search, finance, provider, and employee endpoints across all 15 router modules.
 */

const request = require('supertest');
const app = require('../index');
const { supabase } = require('@polyfit/supabase-client');

const SUPER_ADMIN_TOKEN = 'Bearer demo-super-admin-token';
const KTI_ORG_ID = '02f13bdc-ce25-4c9d-b712-451c06a63fa2';
const CLAIRE_EMP_ID = '6f49f5f6-a72d-44d2-bac5-82db218b00ce';
const FITLIFE_PROVIDER_ID = '90d06d31-999c-42c0-a0c6-fc31ec818ced';
const FITLIFE_LOCATION_ID = '447f4bf2-ff66-48c5-851e-460cba17bfe4';

async function runComprehensiveAudit() {
  console.log('='.repeat(75));
  console.log(' POLYFIT FULL-SPECTRUM DATABASE WIRING & SCHEMA VERIFICATION');
  console.log('='.repeat(75));
  console.log('Target Supabase Database: meszhexftehllnsyhbha');

  // Fetch real entity IDs directly from Supabase for deterministic endpoint tests
  const { data: orgs } = await supabase.from('organizations').select('id, slug').limit(2);
  const { data: emps } = await supabase.from('employees').select('id').eq('org_id', KTI_ORG_ID).limit(2);
  const { data: benefits } = await supabase.from('benefits').select('id').eq('org_id', KTI_ORG_ID).limit(2);
  const { data: visits } = await supabase.from('visits').select('id').limit(2);
  const { data: invoices } = await supabase.from('invoices').select('id').limit(2);
  const { data: contracts } = await supabase.from('provider_contracts').select('id').limit(2);
  const { data: settlements } = await supabase.from('settlements').select('id').limit(2);
  const { data: plans } = await supabase.from('master_plans').select('id').limit(2);

  const testOrgId = orgs?.[0]?.id || KTI_ORG_ID;
  const testOrgSlug = orgs?.[0]?.slug || 'kigali-tech-innovations';
  const testEmpId = emps?.[0]?.id || CLAIRE_EMP_ID;
  const testBenefitId = benefits?.[0]?.id;
  const testVisitId = visits?.[0]?.id;
  const testInvoiceId = invoices?.[0]?.id;
  const testContractId = contracts?.[0]?.id;
  const testSettlementId = settlements?.[0]?.id;
  const testPlanId = plans?.[0]?.id;

  console.log('Discovered Live Entity IDs from Supabase:');
  console.log(` - Org: ${testOrgId} (${testOrgSlug})`);
  console.log(` - Employee: ${testEmpId}`);
  console.log(` - Benefit: ${testBenefitId || 'none'}`);
  console.log(` - Visit: ${testVisitId || 'none'}`);
  console.log(` - Invoice: ${testInvoiceId || 'none'}`);
  console.log(` - Contract: ${testContractId || 'none'}`);
  console.log(` - Settlement: ${testSettlementId || 'none'}`);
  console.log(` - Master Plan: ${testPlanId || 'none'}\n`);

  const tests = [
    // ─── 1. Health & Platform Config ───
    {
      domain: 'Core Health',
      name: 'GET /health',
      fn: () => request(app).get('/health'),
      validate: (res) => res.status === 200 && res.body.database === 'connected'
    },
    {
      domain: 'Public Router',
      name: 'GET /api/public/platform-config',
      fn: () => request(app).get('/api/public/platform-config'),
      validate: (res) => res.status === 200 && res.body.settings && res.body.pricing?.length > 0
    },
    {
      domain: 'Public Router',
      name: 'GET /api/public/pricing',
      fn: () => request(app).get('/api/public/pricing'),
      validate: (res) => res.status === 307 || (res.status === 200 && Array.isArray(res.body.pricing))
    },
    {
      domain: 'Public Router',
      name: 'GET /api/public/verify-company',
      fn: () => request(app).get('/api/public/verify-company?query=kigalitech.rw'),
      validate: (res) => res.status === 200 && (res.body.recognized || res.body.enrolled)
    },
    {
      domain: 'Public Router',
      name: `GET /api/public/organizations/${testOrgSlug}`,
      fn: () => request(app).get(`/api/public/organizations/${testOrgSlug}`),
      validate: (res) => res.status === 200 && res.body.organization?.slug === testOrgSlug
    },
    {
      domain: 'Public Router',
      name: 'GET /api/public/corporate/organizations',
      fn: () => request(app).get('/api/public/corporate/organizations'),
      validate: (res) => res.status === 200 && Array.isArray(res.body.organizations)
    },
    {
      domain: 'Public Router',
      name: `GET /api/public/corporate/portal-data?slug=${testOrgSlug}`,
      fn: () => request(app).get(`/api/public/corporate/portal-data?slug=${testOrgSlug}`),
      validate: (res) => res.status === 200 && res.body.organization?.id === testOrgId
    },
    {
      domain: 'Public Router',
      name: `GET /api/public/locations/${FITLIFE_LOCATION_ID}`,
      fn: () => request(app).get(`/api/public/locations/${FITLIFE_LOCATION_ID}`),
      validate: (res) => res.status === 200 && res.body.location?.id === FITLIFE_LOCATION_ID
    },

    // ─── 2. Auth & Beneficiary Portal ───
    {
      domain: 'Auth Router',
      name: 'GET /api/auth/me (Super Admin Profile & user_roles)',
      fn: () => request(app).get('/api/auth/me').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && (res.body.primaryRole === 'super_admin' || res.body.roles?.includes('super_admin'))
    },
    {
      domain: 'Employee Portal',
      name: 'POST /api/employee/auth/verify-domain',
      fn: () => request(app).post('/api/employee/auth/verify-domain').send({ email: 'claire@kigalitech.rw' }),
      validate: (res) => res.status === 200 && res.body.recognized === true
    },
    {
      domain: 'Employee Portal',
      name: 'POST /api/employee/auth/request-access',
      fn: () => request(app).post('/api/employee/auth/request-access').send({ email: 'claire@kigalitech.rw' }),
      validate: (res) => res.status === 200 && res.body.success === true
    },
    {
      domain: 'Employee Portal',
      name: `GET /api/employee/me?employee_id=${CLAIRE_EMP_ID}`,
      fn: () => request(app).get(`/api/employee/me?employee_id=${CLAIRE_EMP_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.employee?.id === CLAIRE_EMP_ID
    },
    {
      domain: 'Employee Portal',
      name: `GET /api/employee/dashboard?employee_id=${CLAIRE_EMP_ID}`,
      fn: () => request(app).get(`/api/employee/dashboard?employee_id=${CLAIRE_EMP_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && (res.body.success || res.body.employee || res.body.benefit)
    },
    {
      domain: 'Employee Portal',
      name: `GET /api/employee/visits?employee_id=${CLAIRE_EMP_ID}`,
      fn: () => request(app).get(`/api/employee/visits?employee_id=${CLAIRE_EMP_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.visits)
    },
    {
      domain: 'Employee Portal',
      name: `GET /api/employee/network?employee_id=${CLAIRE_EMP_ID}`,
      fn: () => request(app).get(`/api/employee/network?employee_id=${CLAIRE_EMP_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && (Array.isArray(res.body.facilities) || Array.isArray(res.body.locations))
    },
    {
      domain: 'Employee Portal',
      name: `GET /api/employee/providers?employee_id=${CLAIRE_EMP_ID}`,
      fn: () => request(app).get(`/api/employee/providers?employee_id=${CLAIRE_EMP_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && (Array.isArray(res.body.providers) || Array.isArray(res.body.facilities) || Array.isArray(res.body.results))
    },

    // ─── 3. Organizations & Employees ───
    {
      domain: 'Organization Router',
      name: 'GET /api/organizations',
      fn: () => request(app).get('/api/organizations').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.organizations)
    },
    {
      domain: 'Organization Router',
      name: `GET /api/organizations/${KTI_ORG_ID}`,
      fn: () => request(app).get(`/api/organizations/${KTI_ORG_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.organization?.id === KTI_ORG_ID
    },
    {
      domain: 'Employee Router',
      name: `GET /api/organizations/${KTI_ORG_ID}/employees`,
      fn: () => request(app).get(`/api/organizations/${KTI_ORG_ID}/employees`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.employees)
    },
    {
      domain: 'Employee Router',
      name: `GET /api/organizations/${KTI_ORG_ID}/employees/${CLAIRE_EMP_ID}`,
      fn: () => request(app).get(`/api/organizations/${KTI_ORG_ID}/employees/${CLAIRE_EMP_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.employee?.id === CLAIRE_EMP_ID
    },

    // ─── 4. Benefits & Eligibility ───
    {
      domain: 'Benefit Router',
      name: `GET /api/organizations/${KTI_ORG_ID}/benefits`,
      fn: () => request(app).get(`/api/organizations/${KTI_ORG_ID}/benefits`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.benefits)
    },
    ...(testBenefitId ? [{
      domain: 'Benefit Router',
      name: `GET /api/organizations/${KTI_ORG_ID}/benefits/${testBenefitId}`,
      fn: () => request(app).get(`/api/organizations/${KTI_ORG_ID}/benefits/${testBenefitId}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.benefit?.id === testBenefitId
    }] : []),
    {
      domain: 'Benefit Router',
      name: `GET /api/organizations/${KTI_ORG_ID}/benefits/forecast`,
      fn: () => request(app).get(`/api/organizations/${KTI_ORG_ID}/benefits/forecast`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.forecast !== undefined
    },
    {
      domain: 'Eligibility Router',
      name: 'POST /api/eligibility/check',
      fn: () => request(app).post('/api/eligibility/check').set('Authorization', SUPER_ADMIN_TOKEN).send({
        employee_id: CLAIRE_EMP_ID,
        provider_location_id: FITLIFE_LOCATION_ID
      }),
      validate: (res) => res.status === 200 && typeof res.body.eligible === 'boolean'
    },
    {
      domain: 'Eligibility Router',
      name: `GET /api/eligibility/employee/${CLAIRE_EMP_ID}`,
      fn: () => request(app).get(`/api/eligibility/employee/${CLAIRE_EMP_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.employee?.id === CLAIRE_EMP_ID
    },

    // ─── 5. Providers & Contracts ───
    {
      domain: 'Provider Router',
      name: 'GET /api/providers/discover',
      fn: () => request(app).get('/api/providers/discover?category=gym'),
      validate: (res) => res.status === 200
    },
    {
      domain: 'Provider Router',
      name: 'GET /api/providers',
      fn: () => request(app).get('/api/providers').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.providers)
    },
    {
      domain: 'Provider Router',
      name: `GET /api/providers/${FITLIFE_PROVIDER_ID}`,
      fn: () => request(app).get(`/api/providers/${FITLIFE_PROVIDER_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.provider?.id === FITLIFE_PROVIDER_ID
    },
    {
      domain: 'Provider Router',
      name: `GET /api/providers/${FITLIFE_PROVIDER_ID}/locations`,
      fn: () => request(app).get(`/api/providers/${FITLIFE_PROVIDER_ID}/locations`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.locations)
    },
    {
      domain: 'Provider Router',
      name: `GET /api/providers/${FITLIFE_PROVIDER_ID}/locations/${FITLIFE_LOCATION_ID}`,
      fn: () => request(app).get(`/api/providers/${FITLIFE_PROVIDER_ID}/locations/${FITLIFE_LOCATION_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.location?.id === FITLIFE_LOCATION_ID
    },
    {
      domain: 'Provider Router',
      name: `GET /api/providers/${FITLIFE_PROVIDER_ID}/dashboard`,
      fn: () => request(app).get(`/api/providers/${FITLIFE_PROVIDER_ID}/dashboard`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.provider?.id === FITLIFE_PROVIDER_ID
    },
    {
      domain: 'Provider Router',
      name: `GET /api/providers/${FITLIFE_PROVIDER_ID}/marketing-assets`,
      fn: () => request(app).get(`/api/providers/${FITLIFE_PROVIDER_ID}/marketing-assets`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.assets !== undefined
    },
    {
      domain: 'Contract Router',
      name: 'GET /api/provider-contracts',
      fn: () => request(app).get('/api/provider-contracts').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.contracts)
    },
    ...(testContractId ? [{
      domain: 'Contract Router',
      name: `GET /api/provider-contracts/${testContractId}`,
      fn: () => request(app).get(`/api/provider-contracts/${testContractId}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.contract?.id === testContractId
    }] : []),

    // ─── 6. Visits, Check-ins & Anti-Fraud ───
    {
      domain: 'Visit Router',
      name: `GET /api/visits/today-summary?provider_location_id=${FITLIFE_LOCATION_ID}`,
      fn: () => request(app).get(`/api/visits/today-summary?provider_location_id=${FITLIFE_LOCATION_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.success === true
    },
    {
      domain: 'Visit Router',
      name: `GET /api/visits/pending?provider_location_id=${FITLIFE_LOCATION_ID}`,
      fn: () => request(app).get(`/api/visits/pending?provider_location_id=${FITLIFE_LOCATION_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && (Array.isArray(res.body.visits) || Array.isArray(res.body.pending_visits))
    },
    {
      domain: 'Visit Router',
      name: 'GET /api/visits?limit=10',
      fn: () => request(app).get('/api/visits?limit=10').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.visits)
    },
    ...(testVisitId ? [{
      domain: 'Visit Router',
      name: `GET /api/visits/${testVisitId}`,
      fn: () => request(app).get(`/api/visits/${testVisitId}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.visit?.id === testVisitId
    }] : []),
    {
      domain: 'Visit Router',
      name: 'GET /api/visits/retroactive-claims',
      fn: () => request(app).get('/api/visits/retroactive-claims').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.claims)
    },

    // ─── 7. Billing & Settlements ───
    {
      domain: 'Billing Router',
      name: `GET /api/billing/summary?org_id=${KTI_ORG_ID}`,
      fn: () => request(app).get(`/api/billing/summary?org_id=${KTI_ORG_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.ytd_total_spent !== undefined
    },
    {
      domain: 'Billing Router',
      name: `GET /api/billing/invoices?org_id=${KTI_ORG_ID}`,
      fn: () => request(app).get(`/api/billing/invoices?org_id=${KTI_ORG_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.invoices)
    },
    ...(testInvoiceId ? [
      {
        domain: 'Billing Router',
        name: `GET /api/billing/invoices/${testInvoiceId}`,
        fn: () => request(app).get(`/api/billing/invoices/${testInvoiceId}`).set('Authorization', SUPER_ADMIN_TOKEN),
        validate: (res) => res.status === 200 && (res.body.id === testInvoiceId || res.body.invoice?.id === testInvoiceId)
      },
      {
        domain: 'Billing Router',
        name: `GET /api/billing/invoices/${testInvoiceId}/audit-trail`,
        fn: () => request(app).get(`/api/billing/invoices/${testInvoiceId}/audit-trail`).set('Authorization', SUPER_ADMIN_TOKEN),
        validate: (res) => res.status === 200 && (res.body.invoice?.id === testInvoiceId || Array.isArray(res.body.audit_trail))
      },
      {
        domain: 'Billing Router',
        name: `GET /api/billing/invoices/${testInvoiceId}/export-audit`,
        fn: () => request(app).get(`/api/billing/invoices/${testInvoiceId}/export-audit`).set('Authorization', SUPER_ADMIN_TOKEN),
        validate: (res) => res.status === 200
      }
    ] : []),
    {
      domain: 'Settlement Router',
      name: `GET /api/settlements?provider_id=${FITLIFE_PROVIDER_ID}`,
      fn: () => request(app).get(`/api/settlements?provider_id=${FITLIFE_PROVIDER_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.settlements)
    },
    ...(testSettlementId ? [{
      domain: 'Settlement Router',
      name: `GET /api/settlements/${testSettlementId}`,
      fn: () => request(app).get(`/api/settlements/${testSettlementId}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && (res.body.id === testSettlementId || res.body.settlement?.id === testSettlementId)
    }] : []),

    // ─── 8. Operations Console Telemetry & Controls ───
    {
      domain: 'Operations Router',
      name: 'GET /api/operations/overview',
      fn: () => request(app).get('/api/operations/overview').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.success === true
    },
    {
      domain: 'Operations Router',
      name: 'GET /api/operations/search?q=kigali',
      fn: () => request(app).get('/api/operations/search?q=kigali').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.results !== undefined
    },
    {
      domain: 'Operations Router',
      name: 'GET /api/operations/locations',
      fn: () => request(app).get('/api/operations/locations').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.locations)
    },
    {
      domain: 'Operations Router',
      name: 'GET /api/operations/clients',
      fn: () => request(app).get('/api/operations/clients').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.clients)
    },
    {
      domain: 'Operations Router',
      name: `GET /api/operations/clients/${KTI_ORG_ID}`,
      fn: () => request(app).get(`/api/operations/clients/${KTI_ORG_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && (res.body.client?.id === KTI_ORG_ID || res.body.organization?.id === KTI_ORG_ID)
    },
    {
      domain: 'Operations Router',
      name: 'GET /api/operations/providers',
      fn: () => request(app).get('/api/operations/providers').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.providers)
    },
    {
      domain: 'Operations Router',
      name: `GET /api/operations/providers/${FITLIFE_PROVIDER_ID}`,
      fn: () => request(app).get(`/api/operations/providers/${FITLIFE_PROVIDER_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.provider?.id === FITLIFE_PROVIDER_ID
    },
    {
      domain: 'Operations Router',
      name: 'GET /api/operations/visits',
      fn: () => request(app).get('/api/operations/visits').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.visits)
    },
    {
      domain: 'Operations Router',
      name: 'GET /api/operations/visits/disputes',
      fn: () => request(app).get('/api/operations/visits/disputes').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.disputes)
    },
    {
      domain: 'Operations Router',
      name: 'GET /api/operations/finance/overview',
      fn: () => request(app).get('/api/operations/finance/overview').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && (res.body.overview !== undefined || res.body.ticker !== undefined)
    },
    {
      domain: 'Operations Router',
      name: 'GET /api/operations/finance/invoices',
      fn: () => request(app).get('/api/operations/finance/invoices').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.invoices)
    },
    {
      domain: 'Operations Router',
      name: 'GET /api/operations/finance/settlements',
      fn: () => request(app).get('/api/operations/finance/settlements').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.settlements)
    },
    {
      domain: 'Operations Router',
      name: 'GET /api/operations/finance/ledger',
      fn: () => request(app).get('/api/operations/finance/ledger').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && (Array.isArray(res.body.entries) || Array.isArray(res.body.employerLedger))
    },
    {
      domain: 'Operations Router',
      name: 'GET /api/operations/finance/disbursements',
      fn: () => request(app).get('/api/operations/finance/disbursements').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200
    },
    {
      domain: 'Operations Router',
      name: 'GET /api/operations/support/beneficiaries',
      fn: () => request(app).get('/api/operations/support/beneficiaries').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.beneficiaries)
    },
    {
      domain: 'Operations Router',
      name: `GET /api/operations/support/beneficiaries/${CLAIRE_EMP_ID}`,
      fn: () => request(app).get(`/api/operations/support/beneficiaries/${CLAIRE_EMP_ID}`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.beneficiary?.id === CLAIRE_EMP_ID
    },
    {
      domain: 'Operations Router',
      name: 'GET /api/operations/audit-logs',
      fn: () => request(app).get('/api/operations/audit-logs').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.logs)
    },
    {
      domain: 'Operations Router',
      name: 'GET /api/operations/settings',
      fn: () => request(app).get('/api/operations/settings').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.settings?.anti_passback_window_minutes !== undefined
    },
    {
      domain: 'Operations Router',
      name: 'GET /api/operations/team',
      fn: () => request(app).get('/api/operations/team').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.operators)
    },
    {
      domain: 'Operations Router',
      name: 'GET /api/operations/plans',
      fn: () => request(app).get('/api/operations/plans').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && Array.isArray(res.body.plans)
    },

    // ─── 9. Reporting Analytics & Exports ───
    {
      domain: 'Reporting Router',
      name: `GET /api/reporting/employer/${KTI_ORG_ID}/utilization`,
      fn: () => request(app).get(`/api/reporting/employer/${KTI_ORG_ID}/utilization`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.organization?.id === KTI_ORG_ID
    },
    {
      domain: 'Reporting Router',
      name: `GET /api/reporting/employer/${KTI_ORG_ID}/trends`,
      fn: () => request(app).get(`/api/reporting/employer/${KTI_ORG_ID}/trends`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.trends !== undefined
    },
    {
      domain: 'Reporting Router',
      name: `GET /api/reporting/employer/${KTI_ORG_ID}/export`,
      fn: () => request(app).get(`/api/reporting/employer/${KTI_ORG_ID}/export`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200
    },
    {
      domain: 'Reporting Router',
      name: `GET /api/reporting/provider/${FITLIFE_PROVIDER_ID}/visits`,
      fn: () => request(app).get(`/api/reporting/provider/${FITLIFE_PROVIDER_ID}/visits`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.provider?.id === FITLIFE_PROVIDER_ID
    },
    {
      domain: 'Reporting Router',
      name: `GET /api/reporting/provider/${FITLIFE_PROVIDER_ID}/export`,
      fn: () => request(app).get(`/api/reporting/provider/${FITLIFE_PROVIDER_ID}/export`).set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200
    },
    {
      domain: 'Reporting Router',
      name: 'GET /api/reporting/platform/overview',
      fn: () => request(app).get('/api/reporting/platform/overview').set('Authorization', SUPER_ADMIN_TOKEN),
      validate: (res) => res.status === 200 && res.body.networkScale !== undefined
    }
  ];

  console.log(`Executing ${tests.length} database-wired endpoint checks across all router families...\n`);

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    const start = Date.now();
    try {
      const res = await t.fn();
      const duration = Date.now() - start;
      const ok = t.validate(res);
      if (ok) {
        console.log(`[PASS] [${(i + 1).toString().padStart(2, '0')}/${tests.length}] [${t.domain}] ${t.name} (${duration}ms) [HTTP ${res.status}]`);
        passed++;
      } else {
        console.error(`[FAIL] [${(i + 1).toString().padStart(2, '0')}/${tests.length}] [${t.domain}] ${t.name} (${duration}ms) [HTTP ${res.status}]`);
        console.error('       Body preview:', JSON.stringify(res.body).slice(0, 180));
        failed++;
        failures.push({ name: t.name, status: res.status, body: res.body });
      }
    } catch (err) {
      const duration = Date.now() - start;
      console.error(`[ERR ] [${(i + 1).toString().padStart(2, '0')}/${tests.length}] [${t.domain}] ${t.name} (${duration}ms):`, err.message);
      failed++;
      failures.push({ name: t.name, error: err.message });
    }
  }

  console.log('\n' + '='.repeat(75));
  console.log(` FULL AUDIT REPORT: ${passed}/${tests.length} ENDPOINTS VERIFIED WIRED TO DB (${failed} FAILED)`);
  console.log('='.repeat(75));

  if (failed > 0) {
    console.error('\nFailures summary:');
    failures.forEach(f => console.error(` - ${f.name}: HTTP ${f.status || 'ERR'} ->`, f.body || f.error));
    process.exit(1);
  } else {
    console.log('\n>>> ALL TESTED ENDPOINTS CONFIRMED PROPERLY WIRED TO SUPABASE POSTGRESQL! <<<');
    process.exit(0);
  }
}

runComprehensiveAudit();
