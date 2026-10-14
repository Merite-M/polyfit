import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatRwf, formatInvoiceDate } from "./invoice-pdf.ts";

describe("formatRwf", () => {
  it("formats integer amounts with RWF suffix and comma separators", () => {
    assert.strictEqual(formatRwf(2271500), "2,271,500 RWF");
    assert.strictEqual(formatRwf(5000), "5,000 RWF");
    assert.strictEqual(formatRwf(100), "100 RWF");
  });

  it("handles zero correctly", () => {
    assert.strictEqual(formatRwf(0), "0 RWF");
  });

  it("rounds decimal values to the nearest integer", () => {
    assert.strictEqual(formatRwf(1234.4), "1,234 RWF");
    assert.strictEqual(formatRwf(1234.5), "1,235 RWF");
    assert.strictEqual(formatRwf(1234.89), "1,235 RWF");
  });

  it("handles negative values correctly", () => {
    assert.strictEqual(formatRwf(-5000), "-5,000 RWF");
    assert.strictEqual(formatRwf(-1234.6), "-1,235 RWF");
  });

  it("formats large numbers correctly", () => {
    assert.strictEqual(formatRwf(1000000000), "1,000,000,000 RWF");
  });
});

describe("formatInvoiceDate", () => {
  it("returns '-' when date string is undefined or empty", () => {
    assert.strictEqual(formatInvoiceDate(undefined), "-");
    assert.strictEqual(formatInvoiceDate(""), "-");
  });

  it("returns original string when date string is invalid", () => {
    assert.strictEqual(formatInvoiceDate("invalid-date"), "invalid-date");
  });

  it("formats valid ISO date string correctly", () => {
    const formatted = formatInvoiceDate("2026-09-01T00:00:00.000Z");
    assert.match(formatted, /Sep 0?1, 2026/);
  });
});
