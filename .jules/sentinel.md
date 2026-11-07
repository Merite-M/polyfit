## 2025-05-19 - Timing Side-Channel Attacks in Secret Key Comparison
**Vulnerability:** Comparing sensitive shared secrets (`CRON_SECRET`, `TURNSTILE_API_KEY`) using standard equality (`!==` or `===`) leaks character-by-character execution time, allowing timing side-channel attacks.
**Learning:** Standard string comparisons terminate early on the first mismatched byte, creating measurable timing discrepancies that attackers can exploit to brute-force shared secrets remotely.
**Prevention:** Always compare sensitive secrets and tokens using constant-time comparison (`crypto.timingSafeEqual` over SHA-256 digests via `safeCompare`) to ensure fixed-time execution regardless of input or match position.

## 2025-05-18 - PostgREST Filter Injection in Supabase .or() Queries
**Vulnerability:** User-supplied search/filter strings interpolated directly into Supabase PostgREST `.or(...)` query strings allowed PostgREST filter injection via structural syntax control characters (`,`, `(`, `)`).
**Learning:** Supabase PostgREST parses string arguments passed to `.or()` using specific structural delimiters (where `,` separates clauses and `()` groups logic). Unsanitized user inputs containing these characters alter query syntax or inject arbitrary conditions.
**Prevention:** Always sanitize user inputs before passing them into Supabase `.or()` strings by stripping structural delimiters (`() , : . % _` and quotes) using `sanitizePostgrestFilter`.
