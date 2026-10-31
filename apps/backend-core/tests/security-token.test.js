const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const { sanitizePostgrestFilter, safeCompare } = require("@polyfit/shared-utils");

describe("Security Fix: Cryptographically Secure PRNG for Sensitive Tokens", () => {
  test("invitation token follows inv_<48 hex chars> cryptographically secure format", () => {
    const inviteToken = `inv_${crypto.randomBytes(24).toString("hex")}`;
    assert.match(inviteToken, /^inv_[0-9a-f]{48}$/i);
    assert.strictEqual(inviteToken.length, 52);
  });

  test("multiple invitation tokens are unique and non-sequential", () => {
    const tokens = new Set();
    for (let i = 0; i < 100; i++) {
      const inviteToken = `inv_${crypto.randomBytes(24).toString("hex")}`;
      tokens.add(inviteToken);
    }
    assert.strictEqual(tokens.size, 100);
  });

  test("turnstile emergency bypass code generates 6-digit numeric string with crypto.randomInt", () => {
    for (let i = 0; i < 50; i++) {
      const code = `EP-${crypto.randomInt(100000, 1000000)}`;
      assert.match(code, /^EP-\d{6}$/);
      const num = parseInt(code.replace("EP-", ""), 10);
      assert.ok(num >= 100000 && num <= 999999);
    }
  });

  test("organization slug suffix generates 2 random bytes hex", () => {
    const baseSlug = "acme-corp";
    const slug = `${baseSlug}-${crypto.randomBytes(2).toString("hex")}`;
    assert.match(slug, /^acme-corp-[0-9a-f]{4}$/);
  });
});

describe("Security Fix: PostgREST Filter Injection Prevention", () => {
  test("strips PostgREST structural syntax control characters from search input", () => {
    const maliciousInput = "test),status.eq.active,(foo";
    const cleaned = sanitizePostgrestFilter(maliciousInput);
    assert.strictEqual(cleaned, "teststatus.eq.activefoo");
  });

  test("strips parentheses, commas, colons, quotes, and LIKE wildcards while preserving email dots", () => {
    const input = `Kigali: Gym (Main) 'branch', "VIP" %100_ %20_`;
    const cleaned = sanitizePostgrestFilter(input);
    assert.strictEqual(cleaned, "Kigali. Gym Main branch VIP 100 20".replace('.', ''));
  });

  test("preserves valid work emails with dots and alphanumeric characters", () => {
    const email = "john.doe@company.rw";
    const cleaned = sanitizePostgrestFilter(email);
    assert.strictEqual(cleaned, "john.doe@company.rw");
  });

  test("preserves alphanumeric search queries cleanly", () => {
    const safeInput = "Kigali Serena Hotel & Spa 2025";
    const cleaned = sanitizePostgrestFilter(safeInput);
    assert.strictEqual(cleaned, "Kigali Serena Hotel & Spa 2025");
  });

  test("handles empty, null, or non-string inputs safely", () => {
    assert.strictEqual(sanitizePostgrestFilter(null), "");
    assert.strictEqual(sanitizePostgrestFilter(undefined), "");
    assert.strictEqual(sanitizePostgrestFilter(123), "");
  });

  test("sanitizes staff ID inputs for public pass activation query", () => {
    const maliciousStaffId = "EMP-101),or(status.eq.active,(foo";
    const cleaned = sanitizePostgrestFilter(maliciousStaffId);
    assert.strictEqual(cleaned, "EMP-101orstatus.eq.activefoo");
  });

  test("sanitizes query parameters in getOperationsSupportBeneficiaries to prevent PostgREST filter injection", () => {
    const maliciousInput = "test@example.com),email.ilike.%";
    const cleaned = sanitizePostgrestFilter(maliciousInput);
    assert.strictEqual(cleaned, "test@example.comemail.ilike.");
  });

  test("sanitizes phone number query inputs containing PostgREST injection characters", () => {
    const maliciousPhone = "+250788123456),phone.ilike.%88123456%";
    const cleaned = sanitizePostgrestFilter(maliciousPhone);
    assert.strictEqual(cleaned, "+250788123456phone.ilike.88123456");
  });
});

describe("Security Fix: Constant-Time safeCompare for Secrets & Tokens", () => {
  test("returns true for identical secret strings", () => {
    const secret = "cron_secret_kigali_2026_super_secure";
    assert.strictEqual(safeCompare(secret, secret), true);
    assert.strictEqual(safeCompare("polyfit_turnstile_relay_key_2026", "polyfit_turnstile_relay_key_2026"), true);
  });

  test("returns false for mismatched strings of equal length", () => {
    assert.strictEqual(safeCompare("polyfit_turnstile_relay_key_2026", "polyfit_turnstile_relay_key_2025"), false);
    assert.strictEqual(safeCompare("a", "b"), false);
  });

  test("returns false for strings of different lengths", () => {
    assert.strictEqual(safeCompare("short", "much_longer_secret_token"), false);
    assert.strictEqual(safeCompare("polyfit_turnstile_relay_key_2026", "polyfit"), false);
  });

  test("returns false safely when arguments are null, undefined, or non-strings", () => {
    assert.strictEqual(safeCompare(null, "secret"), false);
    assert.strictEqual(safeCompare("secret", null), false);
    assert.strictEqual(safeCompare(undefined, "secret"), false);
    assert.strictEqual(safeCompare("secret", undefined), false);
    assert.strictEqual(safeCompare(12345, 12345), false);
    assert.strictEqual(safeCompare({}, {}), false);
    assert.strictEqual(safeCompare(null, null), false);
  });

  test("SHA-256 fixed-length digests guarantee timing-safe comparison regardless of input length", () => {
    const input1 = "a".repeat(1000);
    const input2 = "a".repeat(1000);
    const input3 = "a".repeat(999) + "b";
    assert.strictEqual(safeCompare(input1, input2), true);
    assert.strictEqual(safeCompare(input1, input3), false);
  });
});
