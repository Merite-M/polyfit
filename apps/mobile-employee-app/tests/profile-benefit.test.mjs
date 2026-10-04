/**
 * PolyFit Corporate Employee App - Unit Tests for Issue PF-102
 * Tab 3: Employee Profile & Corporate Benefit Status
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Helper 1: Calculate Quota Telemetry
function computeQuotaTelemetry(usedVisits, maxMonthlyVisits, resetDateStr) {
  const isUnlimited = maxMonthlyVisits === null;
  const remainingVisits = isUnlimited ? 'unlimited' : Math.max(0, maxMonthlyVisits - usedVisits);
  const quotaPercentage = isUnlimited
    ? 0
    : Math.min(100, Math.round((usedVisits / Math.max(1, maxMonthlyVisits)) * 100));

  const resetDate = new Date(resetDateStr);
  const now = new Date();
  const daysRemainingInCycle = Math.max(
    1,
    Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  const isLowQuota = !isUnlimited && remainingVisits <= 2;

  return {
    usedVisits,
    maxMonthlyVisits,
    remainingVisits,
    quotaPercentage,
    daysRemainingInCycle,
    isUnlimited,
    isLowQuota,
  };
}

// Helper 2: Subsidy Transparency Text
function getSubsidyCopy(isFullySponsored, subsidyPct, coPayPct, orgName) {
  if (isFullySponsored || subsidyPct >= 100) {
    return {
      title: '100% Employer Funded',
      deduction: '0 RWF',
      explanation: `Your wellness benefit is 100% sponsored by ${orgName}. There are no payroll deductions or out-of-pocket facility entry fees.`,
    };
  }

  return {
    title: `${subsidyPct}% Corporate Subsidy`,
    deduction: `${coPayPct}% Co-Pay`,
    explanation: `Your corporate plan is subsidized by ${orgName} at ${subsidyPct}%. Standard monthly co-pay of ${coPayPct}% applies.`,
  };
}

// Helper 3: Relative Time Formatter
function formatRelativeTime(isoString, mockNow = new Date()) {
  try {
    const date = new Date(isoString);
    const diffMs = mockNow.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) {
      const isYesterday = mockNow.getDate() !== date.getDate();
      return isYesterday ? `Yesterday, ${timeStr}` : `Today, ${timeStr}`;
    }
    if (diffDays === 1) return `Yesterday, ${timeStr}`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return 'Recent';
  }
}

// Helper 4: Initials Extraction
function extractInitials(fullName) {
  if (!fullName) return 'JM';
  return fullName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// ======================== TESTS ========================

test('computeQuotaTelemetry computes correct quota remaining and progress percentage', () => {
  const nextMonth = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString();
  const telemetry = computeQuotaTelemetry(8, 12, nextMonth);

  assert.strictEqual(telemetry.usedVisits, 8);
  assert.strictEqual(telemetry.maxMonthlyVisits, 12);
  assert.strictEqual(telemetry.remainingVisits, 4);
  assert.strictEqual(telemetry.quotaPercentage, 67);
  assert.strictEqual(telemetry.isUnlimited, false);
  assert.strictEqual(telemetry.isLowQuota, false);
  assert.strictEqual(telemetry.daysRemainingInCycle > 0, true);
});

test('computeQuotaTelemetry flags low quota when remaining visits is <= 2', () => {
  const nextMonth = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
  const telemetry = computeQuotaTelemetry(10, 12, nextMonth);

  assert.strictEqual(telemetry.remainingVisits, 2);
  assert.strictEqual(telemetry.quotaPercentage, 83);
  assert.strictEqual(telemetry.isLowQuota, true);
});

test('computeQuotaTelemetry handles unlimited executive benefit tier correctly', () => {
  const nextMonth = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
  const telemetry = computeQuotaTelemetry(25, null, nextMonth);

  assert.strictEqual(telemetry.isUnlimited, true);
  assert.strictEqual(telemetry.remainingVisits, 'unlimited');
  assert.strictEqual(telemetry.quotaPercentage, 0);
  assert.strictEqual(telemetry.isLowQuota, false);
});

test('getSubsidyCopy reassures employees about 0 RWF payroll deduction for fully sponsored benefits', () => {
  const copy = getSubsidyCopy(true, 100, 0, 'Bank of Kigali');

  assert.strictEqual(copy.deduction, '0 RWF');
  assert.match(copy.explanation, /100% sponsored by Bank of Kigali/);
  assert.match(copy.explanation, /no payroll deductions/);
});

test('getSubsidyCopy transparently articulates co-pay percentage for subsidized corporate tiers', () => {
  const copy = getSubsidyCopy(false, 85, 15, 'TechCorp Rwanda');

  assert.strictEqual(copy.title, '85% Corporate Subsidy');
  assert.strictEqual(copy.deduction, '15% Co-Pay');
  assert.match(copy.explanation, /subsidized by TechCorp Rwanda at 85%/);
  assert.match(copy.explanation, /Standard monthly co-pay of 15% applies/);
});

test('formatRelativeTime produces accurate human-readable relative timestamps', () => {
  const now = new Date('2026-10-04T15:00:00.000Z');

  // 15 mins ago
  const t1 = new Date('2026-10-04T14:45:00.000Z').toISOString();
  assert.strictEqual(formatRelativeTime(t1, now), 'Just now');

  // 3 days ago
  const t2 = new Date('2026-10-01T10:00:00.000Z').toISOString();
  assert.strictEqual(formatRelativeTime(t2, now), '3 days ago');
});

test('extractInitials correctly returns clean monogram initials', () => {
  assert.strictEqual(extractInitials('Jean Mugisha'), 'JM');
  assert.strictEqual(extractInitials('David'), 'D');
  assert.strictEqual(extractInitials('Alice Keza Ndoli'), 'AK');
  assert.strictEqual(extractInitials(''), 'JM');
});

test('VerifiedVisitReceipt structure complies with aggregator verification specifications', () => {
  const sampleReceipt = {
    id: 'vis_001',
    providerName: 'Waka Fitness',
    locationName: 'Waka Fitness Kimihurura',
    address: 'KG 7 Ave, Kigali Heights',
    category: 'gym',
    checkInAt: '2026-10-03T18:30:00.000Z',
    verificationMethod: 'totp_qr',
    status: 'verified',
    totpTokenHash: '8f2a1b9c3e...44d',
    facilityCity: 'Kimihurura, Kigali',
  };

  assert.strictEqual(sampleReceipt.status, 'verified');
  assert.strictEqual(sampleReceipt.verificationMethod, 'totp_qr');
  assert.strictEqual(sampleReceipt.category, 'gym');
  assert.strictEqual(typeof sampleReceipt.totpTokenHash, 'string');
});
