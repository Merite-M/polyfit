## 2026-11-05 - Timing Side-Channel Vulnerability in Secret Comparisons
**Vulnerability:** Comparing sensitive authentication tokens and keys (such as `CRON_SECRET`, `TURNSTILE_API_KEY`, and dynamic pass signatures) using standard string equality operators (`===` and `!==`) exposed endpoints to timing side-channel attacks.
**Learning:** V8 and JavaScript string comparisons short-circuit upon the first mismatched character, causing response latency to vary depending on matching characters. Direct usage of `crypto.timingSafeEqual` throws `RangeError` if input buffer lengths differ, which can leak secret length or crash endpoints. Pre-hashing both inputs with SHA-256 guarantees equal 32-byte buffers and ensures true constant-time comparison without length leakage.
**Prevention:** Always use `safeCompare` from `@polyfit/shared-utils` for comparing secret keys, API tokens, webhook secrets, and signatures instead of standard equality operators.

## 2025-05-18 - PostgREST Filter Injection in Supabase .or() Queries
**Vulnerability:** User-supplied search/filter strings interpolated directly into Supabase PostgREST `.or(...)` query strings allowed PostgREST filter injection via structural syntax control characters (`,`, `(`, `)`).
**Learning:** Supabase PostgREST parses string arguments passed to `.or()` using specific structural delimiters (where `,` separates clauses and `()` groups logic). Unsanitized user inputs containing these characters alter query syntax or inject arbitrary conditions.
**Prevention:** Always sanitize user inputs before passing them into Supabase `.or()` strings by stripping structural delimiters (`() , : . % _` and quotes) using `sanitizePostgrestFilter`.
