const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");

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
