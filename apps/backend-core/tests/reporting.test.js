const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../index');
const {
  VALID_CATEGORIES,
  DAYS_OF_WEEK,
  WELLBEING_ROI_FACTORS,
  toCsv,
  resolveDateRange,
  getEmployerUtilizationReport,
  getEmployerTrends,
  exportEmployerReport,
  getProviderAnalyticsReport,
  exportProviderReport,
  getPlatformOverviewReport
} = require('../services/reportingService');

const KNOWN_ORG_ID = 'c79a9982-4477-4336-a24b-561419f6c43b'; // TechCorp Rwanda
const KNOWN_PROVIDER_ID = '90d06d31-999c-42c0-a0c6-fc31ec818ced'; // FitLife Gym Kigali

describe('Reporting & Analytics Engine Test Suite (PF-81)', () => {
  // ─── 1. CSV Generator Utility Tests ─────────────────────────────────────────
  describe('CSV Generation & RFC 4180 Formatting', () => {
    test('toCsv produces valid CSV with standard headers and rows', () => {
      const headers = ['Metric', 'Value', 'Unit'];
      const rows = [
        ['Eligible Employees', 150, 'count'],
        ['Participation Rate', '64.5%', 'percent'],
        ['Total Spend', 1250000, 'RWF']
      ];

      const csv = toCsv(headers, rows);
      const lines = csv.split('\r\n');
      assert.equal(lines.length, 4);
      assert.equal(lines[0], 'Metric,Value,Unit');
      assert.equal(lines[1], 'Eligible Employees,150,count');
      assert.equal(lines[2], 'Participation Rate,64.5%,percent');
      assert.equal(lines[3], 'Total Spend,1250000,RWF');
    });

    test('toCsv correctly escapes cells with commas, quotes, and newlines', () => {
      const headers = ['Department', 'Notes'];
      const rows = [
        ['Operations, Logistics & Facilities', 'Requires "high" priority\nreview'],
        ['Engineering', 'Normal']
      ];

      const csv = toCsv(headers, rows);
      assert.ok(csv.includes('"Operations, Logistics & Facilities"'));
      assert.ok(csv.includes('"Requires ""high"" priority\nreview"'));
      assert.ok(csv.includes('Engineering,Normal'));
    });

    test('toCsv handles null and undefined values cleanly', () => {
      const headers = ['Col1', 'Col2'];
      const rows = [[null, undefined], ['Val', null]];
      const csv = toCsv(headers, rows);
      const lines = csv.split('\r\n');
      assert.equal(lines[1], ',');
      assert.equal(lines[2], 'Val,');
    });
  });

  // ─── 2. Date Utilities & Domain Constants ───────────────────────────────────
  describe('Date Utilities & Aggregator Constants', () => {
    test('resolveDateRange defaults to 1st of month to today when empty', () => {
      const { startDate, endDate } = resolveDateRange();
      const today = new Date().toISOString().split('T')[0];
      assert.ok(/^\d{4}-\d{2}-01$/.test(startDate));
      assert.equal(endDate, today);
    });

    test('resolveDateRange preserves provided custom date range', () => {
      const { startDate, endDate } = resolveDateRange('2026-01-01', '2026-03-31');
      assert.equal(startDate, '2026-01-01');
      assert.equal(endDate, '2026-03-31');
    });

    test('VALID_CATEGORIES includes all aggregator wellness categories', () => {
      assert.deepEqual(VALID_CATEGORIES, ['gym', 'pool', 'studio', 'clinic', 'wellness_center']);
    });

    test('DAYS_OF_WEEK contains 7 days from Sunday to Saturday', () => {
      assert.equal(DAYS_OF_WEEK.length, 7);
      assert.equal(DAYS_OF_WEEK[0], 'Sunday');
      assert.equal(DAYS_OF_WEEK[6], 'Saturday');
    });

    test('WELLBEING_ROI_FACTORS conforms to corporate wellness benchmarks', () => {
      assert.equal(WELLBEING_ROI_FACTORS.HEALTHCARE_SAVINGS_MULTIPLIER, 2.5);
      assert.ok(WELLBEING_ROI_FACTORS.HOURS_PRODUCTIVITY_PER_ACTIVE_BENEFICIARY > 0);
      assert.ok(WELLBEING_ROI_FACTORS.AVERAGE_HOURLY_COST_RWF > 0);
    });
  });

  // ─── 3. HTTP Security & RBAC Enforcement ────────────────────────────────────
  describe('Route Security & RBAC Isolation', () => {
    test('GET /api/reporting/employer/:orgId/utilization - blocks unauthenticated access', async () => {
      const res = await request(app).get(`/api/reporting/employer/${KNOWN_ORG_ID}/utilization`);
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('GET /api/reporting/organization/:orgId/utilization (alias) - blocks unauthenticated access', async () => {
      const res = await request(app).get(`/api/reporting/organization/${KNOWN_ORG_ID}/utilization`);
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('GET /api/reporting/employer/:orgId/trends - blocks unauthenticated access', async () => {
      const res = await request(app).get(`/api/reporting/employer/${KNOWN_ORG_ID}/trends`);
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('GET /api/reporting/employer/:orgId/export - blocks unauthenticated access', async () => {
      const res = await request(app).get(`/api/reporting/employer/${KNOWN_ORG_ID}/export`);
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('GET /api/reporting/provider/:providerId/visits - blocks unauthenticated access', async () => {
      const res = await request(app).get(`/api/reporting/provider/${KNOWN_PROVIDER_ID}/visits`);
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('GET /api/reporting/provider/:providerId/export - blocks unauthenticated access', async () => {
      const res = await request(app).get(`/api/reporting/provider/${KNOWN_PROVIDER_ID}/export`);
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('GET /api/reporting/platform/overview - blocks unauthenticated access', async () => {
      const res = await request(app).get('/api/reporting/platform/overview');
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_MISSING_HEADER');
    });

    test('Reject requests with malformed Authorization header', async () => {
      const res = await request(app)
        .get(`/api/reporting/employer/${KNOWN_ORG_ID}/utilization`)
        .set('Authorization', 'Basic invalidcredentials');
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_INVALID_TOKEN_FORMAT');
    });

    test('Reject requests with invalid Bearer token', async () => {
      const res = await request(app)
        .get(`/api/reporting/employer/${KNOWN_ORG_ID}/utilization`)
        .set('Authorization', 'Bearer invalid.jwt.token');
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'AUTH_INVALID_TOKEN');
    });
  });

  // ─── 4. Live DB / Services Integration & SLA Benchmarks (< 2s) ───────────────
  describe('Live Analytics Engine & Performance SLA (< 200ms)', () => {
    test('getEmployerUtilizationReport returns comprehensive Wellhub metrics for known org', async () => {
      const start = Date.now();
      const report = await getEmployerUtilizationReport(KNOWN_ORG_ID, {
        startDate: '2026-09-01',
        endDate: '2026-09-30'
      });
      const durationMs = Date.now() - start;

      // Performance SLA check: must complete in < 2000ms (issue criterion: < 2s)
      assert.ok(durationMs < 2000, `Utilization report took ${durationMs}ms (expected < 2000ms)`);

      // Verify structure
      assert.equal(report.organization.id, KNOWN_ORG_ID);
      assert.equal(report.organization.name, 'TechCorp Rwanda');
      assert.ok(report.workforceEngagement.totalEligibleEmployees >= 5);
      assert.equal(typeof report.workforceEngagement.participationRate, 'number');
      assert.equal(typeof report.financialEconomics.totalSpend, 'number');
      assert.equal(report.financialEconomics.currency, 'RWF');

      // Peak engagement / Wellness Hour
      assert.ok(report.peakEngagement.wellnessHour);
      assert.ok(report.peakEngagement.peakDay);
      assert.equal(report.peakEngagement.heatmapMatrix.data.length, 7);
      assert.equal(report.peakEngagement.heatmapMatrix.data[0].length, 24);

      // Return on Wellbeing ROI metrics
      assert.equal(typeof report.returnOnWellbeing.estimatedHealthcareSavings, 'number');
      assert.equal(typeof report.returnOnWellbeing.estimatedProductivityValueRWF, 'number');
      assert.equal(typeof report.returnOnWellbeing.netWellnessROIValue, 'number');

      // Wellness dimensions
      assert.ok(Array.isArray(report.visitMetrics.wellnessDimensions));
      assert.ok(Array.isArray(report.departmentBreakdown));
    });

    test('getEmployerUtilizationReport filters by department correctly', async () => {
      const report = await getEmployerUtilizationReport(KNOWN_ORG_ID, {
        department: 'Engineering'
      });
      assert.ok(report.workforceEngagement.totalEligibleEmployees >= 1);
    });

    test('getEmployerUtilizationReport throws informative 404 for non-existent org', async () => {
      const nonExistentOrgId = '00000000-0000-0000-0000-000000000000';
      await assert.rejects(
        async () => {
          await getEmployerUtilizationReport(nonExistentOrgId);
        },
        /Organization not found/
      );
    });

    test('getEmployerTrends returns 6-month historical trends array', async () => {
      const start = Date.now();
      const trendData = await getEmployerTrends(KNOWN_ORG_ID, { months: 6 });
      const durationMs = Date.now() - start;

      assert.ok(durationMs < 2000, `Trends took ${durationMs}ms (expected < 2000ms)`);
      assert.equal(trendData.organization.id, KNOWN_ORG_ID);
      assert.equal(trendData.trends.length, 6);
      assert.ok(trendData.trends[0].month);
      assert.ok(trendData.trends[0].monthLabel);
      assert.equal(typeof trendData.summary.averageMonthlyVisits, 'number');
      assert.equal(typeof trendData.summary.momGrowthRate, 'number');
    });

    test('exportEmployerReport produces CSV for utilization summary', async () => {
      const { csv, filename } = await exportEmployerReport(KNOWN_ORG_ID, { type: 'utilization' });
      assert.ok(filename.startsWith('polyfit-employer-utilization-'));
      assert.ok(filename.endsWith('.csv'));
      assert.ok(csv.includes('Metric,Value,Unit / Notes'));
      assert.ok(csv.includes('TechCorp Rwanda'));
    });

    test('exportEmployerReport produces CSV for department breakdown', async () => {
      const { csv, filename } = await exportEmployerReport(KNOWN_ORG_ID, { type: 'departments' });
      assert.ok(filename.startsWith('polyfit-employer-departments-'));
      assert.ok(filename.includes('.csv'));
      assert.ok(csv.includes('Department,Eligible Employees,Active Beneficiaries'));
    });

    test('exportEmployerReport produces CSV for raw visits log', async () => {
      const { csv, filename } = await exportEmployerReport(KNOWN_ORG_ID, { type: 'visits' });
      assert.ok(filename.startsWith('polyfit-employer-visits-'));
      assert.ok(csv.includes('Visit ID,Date,Time (UTC),Staff ID,Department,Tier,Provider,Category,Location,Method,Status'));
    });

    test('getProviderAnalyticsReport returns visit analytics & 7x24 heatmap for known provider', async () => {
      const start = Date.now();
      const report = await getProviderAnalyticsReport(KNOWN_PROVIDER_ID);
      const durationMs = Date.now() - start;

      assert.ok(durationMs < 2000, `Provider analytics took ${durationMs}ms (expected < 2000ms)`);
      assert.equal(report.provider.id, KNOWN_PROVIDER_ID);
      assert.equal(report.provider.name, 'FitLife Gym Kigali');
      assert.equal(typeof report.overview.totalVisits, 'number');
      assert.equal(typeof report.overview.totalEarnings, 'number');
      assert.equal(report.overview.currency, 'RWF');
      assert.equal(report.peakHoursHeatmap.data.length, 7);
      assert.equal(report.peakHoursHeatmap.data[0].length, 24);
      assert.ok(Array.isArray(report.visitsByOrganization));
      assert.ok(Array.isArray(report.visitsByLocation));
      assert.ok(Array.isArray(report.settlementHistory));
    });

    test('exportProviderReport generates provider visits CSV', async () => {
      const { csv, filename } = await exportProviderReport(KNOWN_PROVIDER_ID);
      assert.ok(filename.startsWith('polyfit-provider-visits-'));
      assert.ok(csv.includes('Visit ID,Date,Time (UTC),Facility Location,Client Employer,Beneficiary External ID,Verification Method,Settlement Rate (RWF),Status'));
    });

    test('getPlatformOverviewReport returns network GMV, take-rate and KPIs', async () => {
      const start = Date.now();
      const overview = await getPlatformOverviewReport();
      const durationMs = Date.now() - start;

      assert.ok(durationMs < 2000, `Platform overview took ${durationMs}ms (expected < 2000ms)`);
      assert.ok(overview.networkScale.totalOrganizations >= 1);
      assert.ok(overview.networkScale.totalProviders >= 2);
      assert.ok(overview.networkScale.totalEligibleEmployees >= 5);
      assert.equal(typeof overview.financialEconomics.totalGrossVisitsValue, 'number');
      assert.equal(typeof overview.financialEconomics.platformGrossMargin, 'number');
      assert.equal(typeof overview.financialEconomics.takeRatePercentage, 'number');
      assert.equal(typeof overview.operationalMetrics.verificationSuccessRate, 'number');
      assert.ok(overview.networkCategoryBreakdown.gym !== undefined);
      assert.ok(overview.networkCategoryBreakdown.studio !== undefined);
      assert.ok(Array.isArray(overview.topOrganizationsByVolume));
      assert.ok(Array.isArray(overview.topProvidersByVolume));
    });
  });
});
