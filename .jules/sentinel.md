## 2025-05-19 - Timing Side-Channel Vulnerability in Auth Secret Comparisons
**Vulnerability:** Comparing sensitive authentication tokens and cron trigger secrets using standard string equality operators (`===`, `!==`) leaks timing information based on character-by-character mismatch early exits.
**Learning:** Standard JavaScript string equality comparisons return early upon finding the first differing byte. In high-stakes API authorization contexts like `X-PolyFit-Turnstile-Key` and `CRON_SECRET`, timing discrepancies allow adversaries to execute timing attacks to infer secret values byte-by-byte. Additionally, `crypto.timingSafeEqual` throws an exception if buffer lengths differ. Hashing both inputs with SHA-256 prior to comparison ensures equal buffer lengths and constant-time execution.
**Prevention:** Use `safeCompare` from `@polyfit/shared-utils` which digests both strings with SHA-256 before running `crypto.timingSafeEqual` and safely handles undefined/non-string values.

## 2025-05-18 - PostgREST Filter Injection in Supabase .or() Queries
**Vulnerability:** User-supplied search/filter strings interpolated directly into Supabase PostgREST `.or(...)` query strings allowed PostgREST filter injection via structural syntax control characters (`,`, `(`, `)`).
**Learning:** Supabase PostgREST parses string arguments passed to `.or()` using specific structural delimiters (where `,` separates clauses and `()` groups logic). Unsanitized user inputs containing these characters alter query syntax or inject arbitrary conditions.
**Prevention:** Always sanitize user inputs before passing them into Supabase `.or()` strings by stripping structural delimiters (`() , : . % _` and quotes) using `sanitizePostgrestFilter`.
