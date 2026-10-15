const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

describe('Turnstile Emergency Bypass Code Cryptographic Security Test Suite', () => {
  test('generates 6-digit emergency bypass code with cryptographic randomness', () => {
    // Test crypto.randomInt bounds and output format matching EP-XXXXXX
    for (let i = 0; i < 100; i++) {
      const randomVal = crypto.randomInt(100000, 1000000);
      assert.ok(randomVal >= 100000 && randomVal <= 999999, 'Generated code must be a 6-digit integer');
      const bypassCode = `EP-${randomVal}`;
      assert.match(bypassCode, /^EP-\d{6}$/, 'Bypass code must match EP-XXXXXX pattern');
    }
  });
});
