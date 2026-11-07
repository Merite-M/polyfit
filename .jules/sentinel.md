## 2025-05-18 - PostgREST Filter Injection in Supabase .or() Queries
**Vulnerability:** User-supplied search/filter strings interpolated directly into Supabase PostgREST `.or(...)` query strings allowed PostgREST filter injection via structural syntax control characters (`,`, `(`, `)`).
**Learning:** Supabase PostgREST parses string arguments passed to `.or()` using specific structural delimiters (where `,` separates clauses and `()` groups logic). Unsanitized user inputs containing these characters alter query syntax or inject arbitrary conditions.
**Prevention:** Always sanitize user inputs before passing them into Supabase `.or()` strings by stripping structural delimiters (`() , : . % _` and quotes) using `sanitizePostgrestFilter`.

## 2026-11-07 - Timing Side-Channel Attacks in Secret Key Comparison
**Vulnerability:** Authentication for `CRON_SECRET` (`x-cron-secret`) and `TURNSTILE_API_KEY` (`x-polyfit-turnstile-key`) used standard JavaScript string equality operators (`!==` and `===`), allowing remote attackers to determine secret tokens byte-by-byte via timing side-channels.
**Learning:** Standard string equality comparisons terminate early at the first non-matching byte, resulting in measurable execution time differences. Additionally, `crypto.timingSafeEqual` throws a TypeError if compared buffers differ in byte length, which leaks secret length information if not normalized.
**Prevention:** Always use `safeCompare` from `@polyfit/shared-utils`, which hashes both inputs with SHA-256 to produce fixed-length (32-byte) digests before executing `crypto.timingSafeEqual`, preventing both timing side-channels and buffer length mismatch errors.
