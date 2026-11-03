## 2026-10-30 - Timing Side-Channel Vulnerability in Secret Token Verification
**Vulnerability:** Comparing `CRON_SECRET` and `TURNSTILE_API_KEY` using standard JavaScript equality operators (`===` or `!==`) short-circuits on the first differing character, leaking information about the secret via timing variations.
**Learning:** Even fast in-memory string checks can exhibit measurable timing differences over repeated requests, allowing attackers to incrementally discover sensitive secrets or relay API keys character by character.
**Prevention:** Always compare secret keys and authentication tokens in constant time using `safeCompare` from `@polyfit/shared-utils`, which hashes inputs to fixed-length SHA-256 digests before evaluating with `crypto.timingSafeEqual`.

## 2025-05-18 - PostgREST Filter Injection in Supabase .or() Queries
**Vulnerability:** User-supplied search/filter strings interpolated directly into Supabase PostgREST `.or(...)` query strings allowed PostgREST filter injection via structural syntax control characters (`,`, `(`, `)`).
**Learning:** Supabase PostgREST parses string arguments passed to `.or()` using specific structural delimiters (where `,` separates clauses and `()` groups logic). Unsanitized user inputs containing these characters alter query syntax or inject arbitrary conditions.
**Prevention:** Always sanitize user inputs before passing them into Supabase `.or()` strings by stripping structural delimiters (`() , : . % _` and quotes) using `sanitizePostgrestFilter`.
