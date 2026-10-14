---
name: polyfit-ecosystem-sync
description: Cross-portal synchronization and pre-launch production readiness for PolyFit. Use when editing or refactoring code in any portal (Operations, Corporate, Partner, Marketing/Pricing, Mobile App, Backend Core, Shared Packages) to audit ripple effects, keep pricing and data models in sync, enforce zero-placeholder completeness, and ensure launch readiness.
version: 1.0.0
---

# PolyFit Unified Ecosystem & Cross-Portal Synchronization Guide

## Core Directive

**PolyFit is an interconnected, multi-actor B2B2C corporate wellness aggregator.**
Portals, apps, backend services, shared packages, and public marketing surfaces are **NEVER isolated silos**.

Whenever modifying, adding, or refactoring logic, pricing, data models, or features in ANY portal or sub-repo (especially `/operations` - Super Admin), you **MUST proactively audit and synchronize all related portals, public pricing, marketing copy, and mobile apps.**

---

## 1. Portal & Sub-Repo Synchronization Matrix

| Domain Concept | Canonical Source | Operations Portal | Corporate Portal | Partner Portal | Public Marketing & Pricing | Mobile Employee App | Backend Core API |
|---|---|---|---|---|---|---|---|
| **Benefit Plans & Tiers** (Starter, Standard, Executive) | `packages/shared-types` (`Benefit`) | `/operations/plans` (definition, pricing, rules, margins) | `/corporate/plans`, `/corporate/employees` (plan selection & tier assignment) | `/partner/settlements` (rate tiers) | `/pricing` (cards, tier comparison table, ROI calculator, FAQ), `/` (landing page callouts) | `apps/mobile-employee-app` (tier badge, visit caps, category badges) | `/api/benefits`, `/api/billing` (tier validation & invoice math) |
| **Pricing & Subsidy Structure** (Per-employee monthly, co-pays) | `packages/shared-types` (`Benefit.co_pay_percentage`) | `/operations/plans`, `/operations/finance` | `/corporate/billing`, `/corporate/settings` | `/partner/partnership` | `/pricing` (price cards, billing toggle, ROI calculator) | `apps/mobile-employee-app` (co-pay balance / top-up) | `/api/billing`, `/api/invoices` |
| **Provider Categories & Amenities** (Gym, Pool, Yoga, Spa, etc.) | `packages/shared-types` (`ProviderCategory`) | `/operations/providers` (network directory, category badges) | `/corporate` (benefit coverage overview) | `/partner/locations`, `/partner/setup` (amenity forms) | `/network` (filter chips, map legends), `/` (category highlights) | `apps/mobile-employee-app` (category filter tabs, icon mapping) | `/api/providers`, `/api/eligibility` |
| **Verified Visits & Check-in** | `packages/shared-types` (`Visit`) | `/operations/visits` (fraud detection, audit logs, manual override) | `/corporate` (utilization metrics & employee check-in count) | `/partner/checkins` (reception scanner & TOTP verification) | `/` (live verified visit counters / social proof) | `apps/mobile-employee-app` (dynamic TOTP pass, QR code, visit history) | `/api/visits` (anti-passback, HMAC, geo-fencing) |
| **Settlement Payouts & Invoices** | `packages/shared-types` (`Invoice`, `Settlement`) | `/operations/finance` (invoicing, payout batches, RRA EBM) | `/corporate/billing` (invoices, receipts, PDF export) | `/partner/settlements` (payout history, bank details) | `/pricing` (tax compliance notices, RRA EBM 18% VAT) | N/A (Beneficiary does not see B2B billing) | `/api/settlements`, `/api/invoices` |

---

## 2. Mandatory Cross-Portal Impact Workflow

Before declaring any task complete:

### Step 1: Identify Entity & Cross-Portal Dependencies
Ask:
1. *Does this change alter pricing, plan tiers, visit limits, or subsidy percentages?*
   → If YES: Sync `/pricing`, `/corporate/plans`, `/operations/plans`, `packages/shared-types`, `apps/backend-core`, and `apps/mobile-employee-app`.
2. *Does this change alter provider categories, amenities, or location data?*
   → If YES: Sync `/network`, `/partner/locations`, `/operations/providers`, `apps/mobile-employee-app`, and `packages/shared-types`.
3. *Does this change alter visit verification, QR/TOTP, or check-in rules?*
   → If YES: Sync `/partner/checkins`, `apps/mobile-employee-app`, `/operations/visits`, and `apps/backend-core/routes/visits.js`.

### Step 2: Monorepo Grep Audit
Run `grep_search` across the entire workspace for affected keys, types, or copy:
```bash
# Example: If editing plan tier names or pricing:
grep_search Query="Starter" SearchPath="apps/web/src"
grep_search Query="Standard" SearchPath="apps/web/src"
grep_search Query="Executive" SearchPath="apps/web/src"
grep_search Query="starter" SearchPath="packages/shared-types"
grep_search Query="tier" SearchPath="apps/mobile-employee-app/src"
```

### Step 3: Synchronize Atomically
Never leave one portal updated while another displays obsolete values or broken assumptions. Commit and test all affected consumer surfaces in the same change.

---

## 3. Pre-Launch Completeness & Zero-Placeholder Mandate

PolyFit is currently in the pre-launch phase of polishing, finalizing, completeness, and debugging before launch.

### Strict Anti-Placeholder Policy
- ❌ **NO Placeholder Comments**: `// TODO: implement later`, `// FIXME`, `// Stub for now`.
- ❌ **NO Dummy Handlers**: Empty click handlers `onClick={() => {}}`, non-functional buttons, dead links.
- ❌ **NO Alert Stubs**: `alert("Coming soon")`, temporary toasts claiming a feature is unavailable.
- ❌ **NO Hardcoded Mock Stubs**: Using hardcoded arrays where live Supabase or backend API queries exist.
- ❌ **NO Half-Baked UI**: Every interactive element (buttons, forms, modals, filters, tabs, search inputs) must work end-to-end.

### Complete Feature Lifecycle Checklist
Every feature must include:
1. **Loading State**: Clean skeletons or spinner feedback while data loads.
2. **Empty State**: Clear empty-state illustration or icon, helpful description, and actionable trigger button.
3. **Error State**: User-friendly error message with retry button (no raw stack dumps).
4. **Validation**: Client-side validation using modern pseudo-classes (`:user-invalid`) or zod, with clear inline errors.
5. **Action Feedback**: Disable buttons with loading state on submit to prevent double-submits; show toast/notification on success.
6. **Data Wiring**: Wired directly to Supabase PostgREST or Express backend with proper types and explicit Data API grants.

---

## 4. Production-Readiness Standards

1. **Zero Runtime Errors**: Check browser console for errors, unhandled rejections, or React hydration warnings.
2. **Type Safety**: Run `pnpm run build` or `tsc --noEmit` across touched packages/apps to guarantee zero type errors.
3. **Security & PostgREST Grants**:
   - Ensure RLS policies exist on tables touched.
   - For any new tables in `public`, verify explicit PostgREST grants:
     ```sql
     GRANT SELECT ON public.table_name TO authenticated;
     GRANT ALL ON public.table_name TO service_role;
     ```
4. **Responsive Layouts**: Ensure cards and tables adapt using CSS container queries (`@container`) and look flawless on mobile (375px), tablet (768px), and desktop (1440px).
