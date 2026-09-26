# Completion Checklist — Mandatory Close-Out Steps

## Core Directive

**Every implementation task MUST complete ALL of the following steps before reporting "done" to the user. No exceptions. No shortcuts. These are not optional follow-ups — they are part of the work itself.**

---

## Mandatory Steps (In Order)

### 1. Tests Pass
- Run all relevant tests (`node --test`, `npm test`, etc.)
- Confirm **zero failures** before proceeding
- If tests fail, fix them — do not proceed with failures

### 2. Git Commit & Push
- Stage only the files related to the current task
- Write a detailed, conventional commit message: `feat(PF-XX):`, `fix(PF-XX):`, etc.
- Push to the correct branch (usually `main` unless told otherwise)
- **Verify the push succeeded** — check `git status` shows "up to date with origin"

### 3. CI/CD Pipeline Verification
- Check if `.github/workflows/` exists — if so, verify GitHub Actions pass
- If using Render auto-deploy: call `list_deploys` to verify the deploy status is `live`
- If deploy fails: read `list_logs` to diagnose and fix before marking done
- **Do NOT mark done if the deploy is still building or has failed**

### 4. Linear Issue Update
- Update the issue status to **Done** (not "In Review", not "In Progress" — **Done**)
- Leave a **detailed implementation comment** on the issue via `save_comment` containing:
  - What was built (files, endpoints, schema changes)
  - What was deferred and why
  - Test results summary
  - Any infrastructure changes (env vars, deploys, schema migrations)

### 5. Render Deployment Verification
- After pushing, call `trigger_deploy` if auto-deploy didn't fire
- Call `list_deploys` and confirm the latest deploy has `status: "live"`
- If the deploy failed, read logs via `list_logs` and fix the issue

### 6. Environment & Infrastructure
- If new env vars were added: set them on Render via `update_environment_variables`
- Update `.env.example` with any new variables
- If schema changes were made: verify via `execute_sql` that they took effect

---

## What "Done" Means

A task is **done** when:
- [x] Code is written and tested locally
- [x] Tests pass (zero failures)
- [x] Changes are committed and pushed to remote
- [x] Deploy is live on Render (verified via `list_deploys`)
- [x] Linear issue is marked **Done** with implementation summary comment
- [x] Any new env vars are set on Render
- [x] Any schema changes are verified in Supabase

If ANY of these are incomplete, the task is **not done**. Do not tell the user it's done.

---

## Anti-Patterns (Never Do These)

- ❌ Marking Linear as "In Review" instead of "Done" when work is complete
- ❌ Pushing code but not checking if the deploy succeeded
- ❌ Telling the user "deploy triggered" without waiting to see if it went live
- ❌ Skipping tests because "they should pass"
- ❌ Leaving env vars for the user to set manually when MCP can do it
- ❌ Forgetting to commit/push after implementation
- ❌ Writing code but not wiring it (e.g., creating routes but not registering them in index.js)
