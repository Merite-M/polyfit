## 2026-10-29 - Timing Side-Channel Attacks on Secret Token Comparison
**Vulnerability:** Comparing secret API keys and webhook/cron secrets (`CRON_SECRET`, `TURNSTILE_API_KEY`) using standard JavaScript equality operators (`===` / `!==`) allows timing side-channel attacks by returning early on first mismatched byte.
**Learning:** `crypto.timingSafeEqual` requires equal buffer lengths and throws `RangeError` if byte lengths differ, which could itself leak length or crash endpoints if strings are directly buffered without normalization.
**Prevention:** Always hash candidate and reference secrets with a fixed-length cryptographic digest (e.g. SHA-256) before passing them into `crypto.timingSafeEqual` via `@polyfit/shared-utils`'s `safeCompare`.

## 2025-05-18 - PostgREST Filter Injection in Supabase .or() Queries
**Vulnerability:** User-supplied search/filter strings interpolated directly into Supabase PostgREST `.or(...)` query strings allowed PostgREST filter injection via structural syntax control characters (`,`, `(`, `)`).
**Learning:** Supabase PostgREST parses string arguments passed to `.or()` using specific structural delimiters (where `,` separates clauses and `()` groups logic). Unsanitized user inputs containing these characters alter query syntax or inject arbitrary conditions.
**Prevention:** Always sanitize user inputs before passing them into Supabase `.or()` strings by stripping structural delimiters (`() , : . % _` and quotes) using `sanitizePostgrestFilter`.
