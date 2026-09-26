---
trigger: always_on
---

# MCP Tool Usage — Mandatory Full-Context Rule

## Core Directive

**You MUST proactively use every connected MCP tool to its fullest capability before writing any code, making any plan, or answering any question that touches this project.**

Never assume, guess, or work from memory when a live data source is available via MCP. Fetching real context is always faster and safer than hallucinating stale state.

---

## Required MCP Behaviors by Tool

### 🔵 Linear (`linear/*`)
- Before working on ANY issue: call `get_issue` with `fields: [title, description, priority, estimate, status, labels, assignee, createdAt, updatedAt]` to get the **complete, untruncated** issue spec.
- Before auditing or planning: call `list_issues` across all relevant states to understand the full backlog.
- After completing work: always call `save_issue` to update `state` (Done / In Progress), set `assignee`, and append implementation notes to the description via `patch`.
- Use `list_issue_statuses` to understand the exact valid state names for the workspace before updating statuses.
- Use `save_comment` to leave implementation summaries on issues for team visibility.

### 🟢 Supabase (`supabase/*`)
- Before writing any backend route, migration, or query: call `list_tables` to inspect the **live schema** for the relevant project.
- Use `execute_sql` to verify column names, constraints, indexes, and existing data before writing DML or DDL.
- Use `list_migrations` to understand what migrations already exist and avoid duplicating schema changes.
- Use `get_project_url` and `get_publishable_keys` to get live connection details rather than assuming .env values.
- Use `query_logs` to investigate runtime errors before guessing at root cause.
- Use `get_advisors` to surface performance and security warnings.

### 🟠 Render (`render/*`)
- Before deploying or touching infra: call `list_services` and `get_service` to understand the live deployment state.
- **Active Services**: The active backend web service is `polyfit-backend` (`srv-daq3ojrtqb8s73e7r9o0`) deployed at `https://polyfit-backend.onrender.com`. The frontend static site is `polyfit` (`srv-dadc8egae00c739lio4g`) at `https://polyfit.onrender.com`.
- Use `list_deploys` and `get_deploy` to check whether recent changes are live before debugging.
- Use `list_logs` to read actual runtime logs when diagnosing errors, instead of guessing.
- Use `get_metrics` to understand real CPU/memory usage before recommending infrastructure changes.
- Use `update_environment_variables` when adding new secrets rather than asking the user to do it manually.
- Use `trigger_deploy` after code changes are committed to kick off a fresh deploy.

### 🟣 Postman (`postman-mcp-server/*`)
- Before building a new API route: call `getCollections` and `getCollection` to check for existing documented contracts.
- Use `getSpec` / `getSpecDefinition` to read the OpenAPI spec for the project before implementing clients.
- Use `createCollectionRequest` to document new routes as you implement them.
- Use `runCollection` to validate that existing API contracts still pass after code changes.

### 🔶 Stitch (`stitch/*`)
- Before implementing any UI screen: call `list_screens` and `get_screen` to retrieve the design spec.
- **Active Project**: Always use the **PolyFit Design Center** (`projects/16498663316307719095`). Ignore the archived `Gym SaaS Design System` project (`projects/11473264703669051919`).
- Reference Stitch screen designs for component layout, color tokens, and interaction patterns.
- Use `list_design_systems` and `apply_design_system` to ensure every new component uses the established design system (`PolyFit Design System v1.0`).
- Generate screens from stitch project of this project using tools like generate_screens_from_text or other for a consistent design.

---

## General Rules

1. **Never truncate MCP responses.** If a result says "use `get_issue` for full description", do so before proceeding.
2. **Chain MCP calls in parallel** when the results are independent (e.g., fetch the issue + list the schema simultaneously).
3. **Always close the loop on Linear.** Every issue worked on must have its Linear status updated to reflect actual work state.
4. **Cross-reference across MCPs.** Read the Linear issue → check the Supabase schema → read the Render logs — then implement.
5. **Prefer live data over assumptions.** If a table column, env variable, API route, or design spec can be fetched via MCP, fetch it.
6. **Document as you go.** After implementing, update Postman collections, Linear descriptions, and leave comments so future context fetches are richer.
7. You can use all the tools depending on the task or context you have, because we need to act as a team at a corporate organization or a team of cofounders who can't afford any mistakes.
---

## Codebase Hygiene — Non-Redundancy Rules

### Before Writing Any New Code
1. **Search first.** Use `grep_search` or `list_dir` to check if equivalent logic already exists before implementing anything new. Duplicate utility functions, helpers, middleware, and DB queries are forbidden.
2. **Reuse, don't reinvent.** If a function does 90% of what you need, extend it — do not create a parallel version alongside it.
3. **One source of truth per concern.** Each piece of logic (e.g., anti-passback check, HMAC verification, Supabase client init) must live in exactly one place. If it needs to be used in multiple routes/files, extract it to a shared helper or middleware.

### When Adding to Existing Files
1. **Read the entire file first.** Never add to a file without reading it fully. Adding a function that already exists is a regression.
2. **Consolidate before you add.** If you see near-duplicate code blocks during a read, refactor them into one before adding new functionality.
3. **No copy-paste between routes.** Logic duplicated across `/unlock` and `/scanner/checkin` (and any future route) must be extracted into a shared helper, not copy-pasted.

### Schema & Migrations
1. **Check `list_tables` and `list_migrations` before any schema change.** A column that already exists must never be re-added.
2. **Migrations are append-only.** Never modify an existing migration file. Always create a new one for changes.
3. **No redundant indexes.** Verify via `execute_sql` that an index does not already exist before creating one.

### Dependencies
1. **Check `package.json` before installing.** Never `npm install` a package that is already listed as a dependency.
2. **Prefer existing packages.** If `node-fetch` is already installed, do not add `axios` to do the same job.

### General Cleanliness
- Dead code (commented-out blocks, unused imports, unreachable branches) must be removed, not left in place.
- Every new function must have a single, clearly named responsibility. No god-functions.
- Constants (e.g., `ANTI_PASSBACK_WINDOW_MS`) must be defined once at module scope, never magic-numbered inline.

---

## Supabase Migrations & Scripts — Execution-Only Policy

### Absolute Rules
1. **Never write migration files to disk.** Do not create `.sql` files, migration scripts, or seed files in the repository. The `supabase/migrations/` directory must remain empty unless a file was placed there by the user directly.
2. **Never write temporary or test scripts to disk.** Do not create `test.js`, `seed.sql`, `fix.sql`, `temp.js`, `debug.js`, or any equivalent one-off script file anywhere in the codebase.
3. **Execute immediately via MCP.** All SQL changes (schema alterations, data fixes, index creation, RLS policies, seed data) must be run live using `supabase/execute_sql` or `supabase/apply_migration` at the time they are needed — not saved for later.

### Why
- Migration files left on disk without being applied create a false sense of progress and cause schema drift.
- Temporary scripts accumulate and pollute the codebase with dead, untested code.
- The Supabase MCP gives direct execution access — there is no reason to write intermediate files.

### Correct Workflow for Schema Changes
```
1. supabase/list_tables        → verify current schema state
2. supabase/list_migrations    → check what has already been applied
3. supabase/execute_sql        → run the change live against the database
4. supabase/execute_sql        → verify the change took effect (SELECT / \d)
```

### Correct Workflow for Data Fixes / Seeds
```
1. supabase/execute_sql  → run INSERT / UPDATE / DELETE directly
2. supabase/execute_sql  → verify rows with a SELECT
```

Never intermediately write these statements to a file. Run them directly.

---

## Startup Context — Read Before You Code

### Before Starting ANY Task
1. **Read `docs/` folder.** The `docs/` directory contains critical domain context:
   - `PRODUCT_CONTEXT.md` — Business model, market position, competitive landscape
   - `DOMAIN_MODEL.md` — Data model relationships and entity definitions
   - `BUSINESS_MODEL.md` — Revenue model, pricing strategy, unit economics
   - `research/` — Investor memos and market research
2. **Read `AGENTS.md`** at the project root — it defines terminology, anti-bias rules, and the aggregator architecture. Every coding decision must align with it.
3. **Read existing code before writing.** Use `list_dir`, `view_file`, and `grep_search` to understand what already exists. Never create parallel implementations.
4. **Read existing rules.** All files in `.agents/rules/` are mandatory — they define how we work.

### Why
Without domain context, agents default to generic software patterns. PolyFit is a specific business with specific terminology, actors, and architecture. Reading the docs first prevents gym-software bias, wrong naming, and features that don't serve the aggregator model.

---

## Completion Checklist — Mandatory Close-Out Steps

**Every implementation task MUST complete ALL of the following steps before reporting "done" to the user. No exceptions. These are not optional follow-ups — they are part of the work itself.**

### 1. Tests Pass
- Run all relevant tests (`node --test`, `npm test`, etc.)
- Confirm **zero failures** before proceeding
- If tests fail, fix them — do not proceed with failures

### 2. Git Commit & Push
- Stage only the files related to the current task
- Write a detailed conventional commit: `feat(PF-XX):`, `fix(PF-XX):`, etc.
- Push to the correct branch (usually `main` unless told otherwise)
- **Verify the push succeeded** — check `git status` shows "up to date with origin"

### 3. CI/CD & Deploy Verification
- Check if `.github/workflows/` exists — if so, verify GitHub Actions pass
- Render auto-deploy: call `list_deploys` and confirm status is **`live`** — not just "triggered"
- If deploy fails: read `list_logs`, diagnose, fix, and re-deploy before marking done
- **Do NOT tell the user "deploy triggered" without confirming it went live**

### 4. Linear Issue → Done
- Update the issue status to **Done** (not "In Review", not "In Progress" — **Done**)
- Leave a **detailed implementation comment** via `save_comment` containing:
  - What was built (files, endpoints, schema changes)
  - What was deferred and why
  - Test results summary
  - Any infrastructure changes (env vars, deploys, schema migrations)

### 5. Environment & Infrastructure
- If new env vars were added: set them on Render via `update_environment_variables` — never leave this for the user
- Update `.env.example` with any new variables
- If schema changes were made: verify via `execute_sql` that they took effect

### What "Done" Means
A task is **done** when ALL of these are true:
- [x] Code is written and tested locally (zero test failures)
- [x] Changes are committed and pushed to remote
- [x] Deploy is **live** on Render (verified via `list_deploys`)
- [x] Linear issue is marked **Done** with implementation summary comment
- [x] Any new env vars are set on Render
- [x] Any schema changes are verified in Supabase

If ANY are incomplete, the task is **not done**. Do not tell the user it's done.

---

## Anti-Patterns (Never Do These)

- ❌ Starting to code without reading `docs/`, `AGENTS.md`, and existing codebase
- ❌ Creating new rule files when content belongs in an existing file
- ❌ Marking Linear as "In Review" instead of "Done" when work is complete
- ❌ Pushing code but not checking if the deploy succeeded
- ❌ Telling the user "deploy triggered" without confirming it went **live**
- ❌ Skipping tests because "they should pass"
- ❌ Leaving env vars for the user to set manually when MCP can do it
- ❌ Writing migration `.sql` files to disk instead of executing via MCP
- ❌ Forgetting to commit/push after implementation
- ❌ Writing code but not wiring it (e.g., creating routes but not registering them in index.js)
- ❌ Assuming schema, env vars, or deployment state instead of fetching live data via MCP
