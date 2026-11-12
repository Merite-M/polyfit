const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../index');
const { supabase } = require('../services/supabaseService');
const {
  getDimensionalCorporateKpis,
  getDimensionalPartnerKpis,
  getDimensionalExecutiveAnalytics,
  refreshExecutiveAnalytics
} = require('../services/reportingService');

const KNOWN_ORG_ID = 'c79a9982-4477-4336-a24b-561419f6c43b'; // TechCorp Rwanda
const KNOWN_PROVIDER_ID = '90d06d31-999c-42c0-a0c6-fc31ec818ced'; // FitLife Gym Kigali

describe('Database Normalization (1NF-3NF), Dimensional Views & Anomaly Stress-Testing', () => {

  // ─── 1. 1NF - 3NF DATA ANOMALY PREVENTION & CANONICAL TIER INTEGRITY ───────────
  describe('1NF-3NF Anomaly Prevention & Canonical Tier Synchronization', () => {
    test('Verifies zero update anomalies between employee tier and active benefit tier', async () => {
      // Query employees with active eligibility and active benefits
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          full_name,
          tier,
          eligibility!inner (
            id,
            status,
            benefits!inner (
              id,
              name,
              tier
            )
          )
        `)
        .eq('eligibility.status', 'active');

      assert.equal(error, null, 'Querying employee and active eligibility should succeed');
      assert.ok(Array.isArray(data) && data.length > 0, 'Active employees with benefits should exist');

      // Verify each employee's tier matches their benefit tier
      for (const row of data) {
        for (const el of row.eligibility) {
          if (el.benefits && el.benefits.tier) {
            assert.equal(
              row.tier,
              el.benefits.tier,
              `Employee ${row.full_name} tier (${row.tier}) must match active benefit tier (${el.benefits.tier})`
            );
          }
        }
      }
    });

    test('view_dim_employees resolves canonical_tier with 100% referential consistency', async () => {
      const { data: dimEmployees, error } = await supabase
        .from('view_dim_employees')
        .select('employee_id, full_name, stored_tier, active_benefit_tier, canonical_tier')
        .limit(20);

      assert.equal(error, null, 'view_dim_employees query should succeed');
      assert.ok(Array.isArray(dimEmployees) && dimEmployees.length > 0);

      for (const emp of dimEmployees) {
        assert.ok(emp.canonical_tier, 'Every employee must have a valid canonical_tier');
        if (emp.active_benefit_tier) {
          assert.equal(
            emp.canonical_tier,
            emp.active_benefit_tier,
            'Canonical tier must equal active benefit tier when benefit exists'
          );
        }
      }
    });
  });

  // ─── 2. DIMENSIONAL MODELING STAR & SNOWFLAKE SCHEMA INTEGRITY ────────────────
  describe('Dimensional Views (Star Schema & Date Dimension)', () => {
    test('view_dim_date_dimension provides unbroken calendar keys and accurate flags', async () => {
      const { data: dateRows, error } = await supabase
        .from('view_dim_date_dimension')
        .select('*')
        .gte('calendar_date', '2026-11-01')
        .lte('calendar_date', '2026-11-07')
        .order('calendar_date', { ascending: true });

      assert.equal(error, null, 'Date dimension query should succeed');
      assert.equal(dateRows.length, 7, 'Should return exactly 7 calendar days');

      // Check structure of first day
      const day = dateRows[0];
      assert.equal(day.calendar_date, '2026-11-01');
      assert.equal(day.date_key, 20261101);
      assert.equal(day.year_number, 2026);
      assert.equal(day.month_number, 11);
      assert.equal(typeof day.is_weekend, 'boolean');
    });

    test('view_dim_organizations aggregates employee count and active benefits accurately', async () => {
      const { data: orgs, error } = await supabase
        .from('view_dim_organizations')
        .select('org_id, org_name, total_employees, active_employees, active_benefits_count')
        .eq('org_id', KNOWN_ORG_ID);

      assert.equal(error, null);
      assert.ok(orgs.length > 0);
      const techCorp = orgs[0];
      assert.equal(techCorp.org_name, 'TechCorp Rwanda');
      assert.ok(techCorp.total_employees >= techCorp.active_employees, 'Total employees >= active employees');
      assert.ok(techCorp.active_benefits_count >= 1, 'TechCorp must have at least 1 active benefit');
    });

    test('view_dim_providers and view_dim_provider_locations preserve hierarchy', async () => {
      const { data: locations, error } = await supabase
        .from('view_dim_provider_locations')
        .select('location_id, provider_id, provider_name, provider_category, location_name, city, country, location_status')
        .limit(10);

      assert.equal(error, null);
      assert.ok(locations.length > 0);

      for (const loc of locations) {
        assert.ok(loc.location_name, 'Location name required');
        assert.ok(loc.provider_name, 'Provider name must be pre-joined');
        assert.ok(loc.city, 'City must be present');
        assert.ok(loc.country, 'Country must be present');
      }
    });

    test('view_fact_visits computes additive measures and platform margins correctly', async () => {
      const { data: factVisits, error } = await supabase
        .from('view_fact_visits')
        .select('visit_id, date_key, employee_key, location_key, org_key, visit_count, provider_reimbursement_rate, estimated_billed_rate, estimated_platform_margin')
        .limit(10);

      assert.equal(error, null);
      assert.ok(factVisits.length > 0);

      for (const fv of factVisits) {
        assert.equal(fv.visit_count, 1, 'Visit count measure must be 1');
        assert.ok(fv.date_key >= 20240101, 'Valid date key required');
        assert.ok(fv.provider_reimbursement_rate >= 0, 'Reimbursement rate >= 0');
        assert.ok(fv.estimated_billed_rate >= fv.provider_reimbursement_rate, 'Billed rate >= Reimbursement rate');
        assert.ok(fv.estimated_platform_margin >= 0, 'Platform margin must be positive');
      }
    });
  });

  // ─── 3. ANALYTICAL PRE-AGGREGATION & MATERIALIZED VIEW REFRESH ───────────────
  describe('Analytical KPIs & Materialized View Integrity', () => {
    test('view_corporate_hr_utilization_kpis returns valid metrics for known organization', async () => {
      const kpis = await getDimensionalCorporateKpis(KNOWN_ORG_ID);
      assert.ok(kpis, 'KPIs for TechCorp must exist');
      assert.equal(kpis.org_name, 'TechCorp Rwanda');
      assert.ok(typeof kpis.enrolled_employees === 'number');
      assert.ok(typeof kpis.mtd_verified_visits === 'number');
      assert.ok(typeof kpis.mtd_utilization_rate_pct === 'number');
      assert.ok(kpis.mtd_utilization_rate_pct >= 0 && kpis.mtd_utilization_rate_pct <= 100);
    });

    test('view_partner_settlement_kpis returns valid provider metrics', async () => {
      const kpis = await getDimensionalPartnerKpis(KNOWN_PROVIDER_ID);
      assert.ok(kpis !== undefined);
      if (kpis) {
        assert.ok(typeof kpis.total_locations === 'number');
        assert.ok(typeof kpis.pending_settlement_visits === 'number');
      }
    });

    test('mv_monthly_executive_analytics returns historical period breakdowns', async () => {
      const analytics = await getDimensionalExecutiveAnalytics();
      assert.ok(Array.isArray(analytics));
      assert.ok(analytics.length > 0, 'Executive materialized analytics must contain rows');

      for (const row of analytics) {
        assert.match(row.month_key, /^\d{4}-\d{2}$/, 'Month key must match YYYY-MM');
        assert.ok(row.verified_visits_count >= 1);
        assert.ok(row.total_reimbursement_rwf >= 0);
        assert.ok(row.gross_margin_rwf >= 0);
      }
    });
  });

  // ─── 4. SECURITY, DATA GOVERNANCE & PII MASKING ──────────────────────────────
  describe('Data Governance, PII Masking & Access Control', () => {
    test('view_providers_public_directory masks sensitive tax_id and excludes bank details', async () => {
      const { data: publicProviders, error } = await supabase
        .from('view_providers_public_directory')
        .select('*')
        .limit(10);

      assert.equal(error, null);
      assert.ok(publicProviders.length > 0);

      for (const p of publicProviders) {
        // bank_details must NOT exist in the public view
        assert.equal(p.bank_details, undefined, 'bank_details must not be exposed in public directory');
        // tax_id if present must be masked
        if (p.masked_tax_id) {
          assert.match(p.masked_tax_id, /^\*\*\*-\*\*\*-\w{3}$/, 'Tax ID must be masked');
        }
      }
    });

    test('view_employees_safe_directory masks device hardware hashes', async () => {
      const { data: safeEmployees, error } = await supabase
        .from('view_employees_safe_directory')
        .select('*')
        .limit(10);

      assert.equal(error, null);
      assert.ok(safeEmployees.length > 0);

      for (const emp of safeEmployees) {
        assert.equal(emp.device_fingerprint, undefined, 'Raw hardware fingerprint must not be exposed in safe directory');
        assert.ok(typeof emp.is_device_bound === 'boolean');
      }
    });
  });

  // ─── 5. API ROUTES VERIFICATION ──────────────────────────────────────────────
  describe('Dimensional Reporting Endpoints', () => {
    test('GET /api/reporting/dimensional/corporate-kpis/:orgId returns 401 without auth', async () => {
      const res = await request(app).get(`/api/reporting/dimensional/corporate-kpis/${KNOWN_ORG_ID}`);
      assert.equal(res.status, 401);
    });

    test('GET /api/reporting/dimensional/partner-kpis/:providerId returns 401 without auth', async () => {
      const res = await request(app).get(`/api/reporting/dimensional/partner-kpis/${KNOWN_PROVIDER_ID}`);
      assert.equal(res.status, 401);
    });

    test('GET /api/reporting/dimensional/executive-analytics returns 401 without auth', async () => {
      const res = await request(app).get('/api/reporting/dimensional/executive-analytics');
      assert.equal(res.status, 401);
    });
  });

});
