## 2025-05-18 - PostgREST Filter Injection in Supabase .or() Queries
**Vulnerability:** User-supplied search/filter strings interpolated directly into Supabase PostgREST `.or(...)` query strings allowed PostgREST filter injection via structural syntax control characters (`,`, `(`, `)`).
**Learning:** Supabase PostgREST parses string arguments passed to `.or()` using specific structural delimiters (where `,` separates clauses and `()` groups logic). Unsanitized user inputs containing these characters alter query syntax or inject arbitrary conditions.
**Prevention:** Always sanitize user inputs before passing them into Supabase `.or()` strings by stripping structural delimiters (`() , : . % _` and quotes) using `sanitizePostgrestFilter`.

## 2026-03-30 - Constant-Time Secret Comparison for API & Cron Secret Headers
**Vulnerability:** Comparing secret headers (`CRON_SECRET` and `TURNSTILE_API_KEY`) using standard equality operators (`!==` / `===`) created a timing side-channel leak. Furthermore, raw `crypto.timingSafeEqual` throws a `TypeError` when byte lengths differ.
**Learning:** Comparing secrets character-by-character returns early on mismatch, allowing character brute-forcing via latency micro-variations. Using `crypto.timingSafeEqual` directly on raw string buffers throws if buffer lengths differ.
**Prevention:** Always digest secret strings into fixed-length SHA-256 hashes (`crypto.createHash('sha256')`) before executing `crypto.timingSafeEqual` so length checks and comparison execute in constant time regardless of input lengths.
