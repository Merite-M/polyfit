## 2025-05-18 - PostgREST Filter Injection in Supabase .or() Queries
**Vulnerability:** User-supplied search/filter strings interpolated directly into Supabase PostgREST `.or(...)` query strings allowed PostgREST filter injection via structural syntax control characters (`,`, `(`, `)`).
**Learning:** Supabase PostgREST parses string arguments passed to `.or()` using specific structural delimiters (where `,` separates clauses and `()` groups logic). Unsanitized user inputs containing these characters alter query syntax or inject arbitrary conditions.
**Prevention:** Always sanitize user inputs before passing them into Supabase `.or()` strings by stripping structural delimiters (`() , : . % _` and quotes) using `sanitizePostgrestFilter`.

## 2026-03-30 - Secret Verification Timing Side-Channel Vulnerability
**Vulnerability:** System-level API secrets (CRON_SECRET in cronRoutes and TURNSTILE_API_KEY in visitRoutes) were compared using standard string equality (`!==` and `===`), creating timing side-channel vulnerabilities.
**Learning:** Standard JavaScript string equality operators bail out at the first mismatched byte, and `crypto.timingSafeEqual` directly throws `RangeError` if byte lengths differ. Hashing both inputs with SHA-256 before `timingSafeEqual` normalizes operands to equal 32-byte buffers, completely preventing timing side-channels and length leaks.
**Prevention:** Always verify secrets, webhook tokens, and device keys using constant-time `safeCompare` from `@polyfit/shared-utils`.
