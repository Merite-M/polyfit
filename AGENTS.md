# PolyFit Agent Rules

## Product Context

**PolyFit is a B2B2C corporate wellness network.**

**PolyFit is NOT gym-management software.**

The platform connects employers with a network of independent wellness providers and manages:
- Corporate wellness benefits
- Employee eligibility
- Provider access
- Verified visits
- Utilization tracking
- Provider contracts and pricing
- Billing
- Provider settlement
- Employer reporting

A gym is a type of wellness provider, not the center of the system. PolyFit does not operate or manage the gyms themselves.

---

## Business Model

```
Employer
    ↓
PolyFit
    ↓
Wellness Provider Network
    ↓
Employees / Beneficiaries
```

### Current Phase

Initial focus:
- Corporate fitness
- Gyms as providers
- Employer-funded wellness benefits
- Provider network
- Verified visits
- Employer reporting
- Provider settlement

### Future Categories

May expand to include:
- Swimming
- Yoga
- Mental wellness
- Physiotherapy
- Nutrition
- Other wellness services

---

## Anti-Bias Rules

### Before Implementing Any Feature

Determine which PolyFit actor it serves:

1. **Employer** - HR/Procurement/Finance at client companies
2. **Employee/Beneficiary** - Corporate employees using wellness benefits
3. **Wellness Provider** - Independent facilities (gyms, pools, studios, etc.)
4. **PolyFit Operations** - Internal platform management
5. **Finance/Settlement** - Billing and provider settlement

### Preferred Terminology

| Old (Gym Software) | New (PolyFit Aggregator) |
|-------------------|---------------------------|
| Gym | Provider / Wellness Provider |
| Member | Beneficiary / Employee |
| Membership | Benefit / Corporate Benefit |
| Attendance | Visit / Verified Visit |
| Membership Plan | Benefit Access Rule |
| Gym Payment | Provider Settlement |
| Tenant | Organization / Employer |
| Gym Branch | Provider Location |
| Gym Staff | Provider Staff (if applicable) |

---

## Development Rules

### 1. Architecture First

**Always think in terms of the aggregator model:**
- Organization → Benefit → Employee → Provider → Visit → Settlement
- NOT: Gym → Member → Membership → Attendance

### 2. Provider is One of Many

A gym is just one type of wellness provider. The system must work for:
- Gyms
- Swimming pools
- Yoga studios
- Mental wellness providers
- Physiotherapy clinics
- Nutrition services

Never assume the provider is a gym.

### 3. PolyFit is Infrastructure

PolyFit is an aggregation and infrastructure layer. We do not:
- Operate provider facilities
- Manage provider staff
- Handle provider day-to-day operations
- Control provider pricing directly
- Manage provider inventory

We do:
- Connect employers to providers
- Manage eligibility and access
- Track verified usage
- Handle billing and settlement
- Provide reporting and analytics

### 4. Multi-Actor Design

Every feature should consider multiple actors:
- How does this serve employers?
- How does this serve employees?
- How does this serve providers?
- How does this serve PolyFit operations?

### 5. Data Model Design

**Center the model on the aggregator:**
- `organizations` (employers)
- `providers` (wellness providers)
- `provider_locations` (provider facilities)
- `employees` (beneficiaries)
- `benefits` (corporate benefit configurations)
- `eligibility` (employee benefit eligibility)
- `provider_contracts` (provider agreements)
- `visits` (verified employee visits)
- `utilization` (usage analytics)
- `invoices` (employer billing)
- `settlements` (provider settlement)

**NOT:**
- `gyms`
- `gym_members`
- `memberships`
- `gym_attendance`
- `gym_payments`

### 6. API Design

**Routes should reflect the aggregator model:**
- `/api/organizations` - Employer management
- `/api/providers` - Provider management
- `/api/employees` - Employee management
- `/api/benefits` - Benefit configuration
- `/api/eligibility` - Eligibility verification
- `/api/visits` - Visit tracking
- `/api/utilization` - Usage analytics
- `/api/settlements` - Provider settlement
- `/api/reporting` - Employer/provider reporting

**NOT:**
- `/api/gym`
- `/api/members`
- `/api/memberships`
- `/api/attendance`

### 7. UI Design

**Applications should serve specific actors:**
- `/corporate` - Employer dashboard & HR administration
- `/partner` - Provider / partner portal (check-in desk, locations, settlements)
- `/operations` - PolyFit operations & Super Admin console
- `apps/mobile-employee-app` - Beneficiary / employee mobile application
- Public site (`/`, `/pricing`, `/network`, `/demo`) - Prospective employers, providers, and public discovery

**NOT:**
- `/gym` - Gym-specific interface
- `/members` - Gym member management
- `/reception` - Gym reception desk

### 8. Unified Ecosystem & Mandatory Cross-Portal Synchronization

**PolyFit is an interconnected, synchronized monorepo ecosystem. Portals, apps, backend services, shared packages, and public websites are NEVER isolated silos.**

The platform comprises synchronized consumer surfaces:
- **Operations / Super Admin (`apps/web/src/app/operations`)**: Global plan definitions, provider management, contract pricing, billing, and settlements.
- **Corporate / Employer Portal (`apps/web/src/app/corporate`)**: Employer HR portal for employee roster, corporate plan enrollment, subsidy allocations, billing invoices.
- **Partner / Provider Portal (`apps/web/src/app/partner`)**: Provider locations, check-in validation, payout history, negotiated rate cards.
- **Public Marketing Website & Pricing (`apps/web/src/app/pricing`, `/`, `/corporate`, `/partner`, `/network`)**: Public plan tiers (Starter, Standard, Executive), ROI calculators, feature matrices, provider network directory.
- **Mobile Employee App (`apps/mobile-employee-app`)**: Beneficiary experience, tier eligibility, dynamic TOTP access pass, facility discovery.
- **Backend API (`apps/backend-core`)**: Central business logic, verification, billing calculations, anti-passback.
- **Shared Packages (`packages/shared-types`, `packages/shared-utils`, `packages/ui-theme`)**: Canonical source of truth for interfaces, helpers, and tokens.
- **Database (`supabase`)**: Unified database schema, RLS, and PostgREST grants.

**MANDATORY CROSS-PORTAL SYNC RULE**:
Whenever modifying, adding, or refactoring logic, pricing, data models, or features in ANY portal or sub-repo (especially `/operations`), every AI agent MUST proactively grep across all other portals and public pages to audit and synchronize related state.

**Common Cross-Portal Ripple Effects:**
1. **Plan Tiers, Pricing, or Perks Updated (e.g., in `/operations/plans` or DB)**:
   - Immediately audit and synchronize:
     - `/pricing` (pricing cards, ROI calculator, FAQ, comparison table).
     - `/corporate` (employer plan selection and employee tier allocation).
     - `/partner` (provider reimbursement rates or tier requirements).
     - `/` (landing page feature highlights, benefit callouts).
     - `packages/shared-types` (Benefit / Plan tier types).
     - `apps/backend-core` (validation, billing, limits).
     - `apps/mobile-employee-app` (tier labels, visit caps, category badges).
2. **Provider Categories or Amenities Updated (e.g., in `/operations/providers` or DB)**:
   - Immediately audit and synchronize:
     - `/network` (filter chips, map legends, search options).
     - `/partner` (onboarding and location forms).
     - `apps/mobile-employee-app` (category tabs and icons).
     - `packages/shared-types` (`ProviderCategory` enums).
3. **Visit Verification or Check-in Logic Updated**:
   - Immediately audit and synchronize:
     - `/partner/checkins` (scanner interface).
     - `apps/mobile-employee-app` (TOTP generation and QR rendering).
     - `apps/backend-core` (visit validation routes, anti-passback).
     - `/operations/visits` (audit and fraud detection tables).

**Rule**: Never leave any portal, public page, or sub-repo with stale, conflicting, or desynchronized data.

### 9. Pre-Launch Completeness & Zero-Placeholder Policy (Full End-to-End Functionality)

**PolyFit is currently in the pre-launch polishing, finalizing, completeness, and debugging phase.**

Every feature—whether modifying existing functionality or introducing new capabilities—must be **100% fully functioning end-to-end**.

**Strict Anti-Placeholder Rules**:
- ❌ **NO Placeholder Comments**: `// TODO: implement later`, `// FIXME`, `// Stub for now`.
- ❌ **NO Dummy Handlers**: Empty click handlers `onClick={() => {}}`, non-functional buttons, dead links.
- ❌ **NO Alert Stubs**: `alert("Coming soon")`, temporary toasts claiming a feature is unavailable.
- ❌ **NO Hardcoded Mock Stubs**: Using hardcoded arrays where live Supabase or backend API queries exist.
- ❌ **NO Half-Baked UI**: Every interactive element (buttons, forms, modals, filters, tabs, search inputs) must work end-to-end.

**Complete Feature Lifecycle Requirements**:
1. **Comprehensive UI States**: Every component, card, and table must handle Loading (skeletons/spinners), Empty (helpful empty states with action triggers), and Error (clear user-facing recovery messages).
2. **Interactive Controls & Forms**: Robust client validation, disabled/loading states during submission to prevent double-submits, clear feedback (toasts, success banners).
3. **Real Data Wiring**: Wired directly to Supabase PostgREST or Express backend with proper types and explicit Data API grants.
4. **Resilient Edge Cases**: Graceful handling of network timeouts, unauthorized states, empty result sets, boundary numbers.

### 10. Production-Readiness Standards

1. **Zero Runtime Console Errors**: Zero uncaught exceptions, zero unhandled promise rejections, zero React hydration warnings.
2. **Strict Type Safety**: TypeScript compiles cleanly without errors or regressions (`tsc --noEmit`).
3. **Security & Authorization**: PostgREST grants explicit (`GRANT ... TO authenticated`), RLS enabled, inputs sanitized, no exposed secrets.
4. **Modern Web Standards**: Use native `<dialog>` and Popover API, container queries (`@container`), zero layout shifts (CLS), fully responsive across desktop, tablet, and mobile.
5. **No Half-Implemented Refactors**: If a component or function is modified, all calling sites across the monorepo must be updated in the same changeset.

---

## Legacy Product Handling

### The Previous Repository

The repository previously contained gym-management software. That product has been discontinued.

**Do NOT:**
- Recreate, extend, or optimize gym management features
- Reference gym-software patterns unless explicitly requested
- Assume gym-software domain models are relevant
- Use gym-software terminology in new code

**Treat legacy code as deprecated** unless explicitly referenced by current PolyFit requirements.

### Legacy Database

The old database contains gym-software schema:
- `tenants` (gym tenants)
- `memberships` (gym memberships)
- `check_ins` (gym attendance)
- etc.

**Do NOT:**
- Reference old database tables in new code
- Migrate old schema to new architecture
- Assume old database patterns are relevant

The new PolyFit aggregator uses a completely fresh database schema.

---

## Competitive Landscape

### Competitors

PolyFit competes in the **corporate wellness benefits** space, not gym management:

**Corporate Wellness Platforms:**
- RibiRewards
- Benefits Wallet
- Wellness-specific aggregators

**NOT:**
- Mindbody (gym management)
- Gym CRM systems
- Gym POS systems
- Gym scheduling software

### Differentiation

PolyFit is:
- B2B2C (employer-funded)
- Network-based (multiple providers)
- Aggregation-focused (not single-gym)
- East Africa-focused (Rwanda, Kenya, etc.)

---

## Current Phase Priorities

### Focus Areas

1. **Employer Acquisition** - Landing page, demo process, onboarding
2. **Provider Network** - Provider onboarding, contracts, location data
3. **Core Infrastructure** - Eligibility, visits, utilization tracking
4. **Billing & Settlement** - Employer invoicing, provider settlement
5. **Basic Reporting** - Employer utilization reports, provider settlement reports
6. **Mobile Employee Application (EPIC-06)** - Lean 3-tab Expo 56 app for dynamic TOTP access, offline pass vault, and provider discovery

### Deferred

- Advanced analytics
- Multi-category expansion (beyond gyms, pools, studios)
- Provider self-service portal
- Employee wellness challenges and social feeds

---

## Testing & Verification

### Before Marking Features Complete

1. **Terminology Check**: No gym-specific terms in UI, API, or database
2. **Actor Check**: Feature serves clear PolyFit actor(s)
3. **Architecture Check**: Fits aggregator model, not gym-software model
4. **Anti-Bias Check**: Would this feature exist in gym software? If yes, reconsider.

### Code Review Checklist

- [ ] No references to "gym", "member", "membership", "attendance"
- [ ] Uses "provider", "beneficiary/employee", "benefit", "visit"
- [ ] Serves clear PolyFit actor(s)
- [ ] Fits aggregator architecture
- [ ] Database schema uses new model
- [ ] API routes follow aggregator conventions
- [ ] UI serves specific actor(s)
- [ ] **Cross-Portal Sync Check**: Audited and synchronized related portals (`operations`, `corporate`, `partner`), public pricing (`/pricing`), marketing site, mobile app, and shared types
- [ ] **Zero-Placeholder Check**: Zero TODOs, zero dummy alerts, all buttons and forms have 100% full end-to-end working functionality
- [ ] **Production-Readiness Check**: Clean console (zero errors/warnings), full loading/empty/error states, typed contracts, responsive layouts

---

## Emergency Override

If you find yourself implementing gym-software features:

**STOP.**

Ask:
1. Is this feature specific to operating a single gym?
2. Would this exist in gym-management software?
3. Does this assume PolyFit operates the provider?

If YES to any:
- This is likely gym-software bias
- Reconsider the feature
- Adapt to aggregator model
- Or defer if not core to current phase

---

## Summary

**PolyFit = Corporate Wellness Aggregator**
**NOT = Gym Management Software**

When in doubt, ask: "Does this serve the aggregator model or a single gym?"

---

## Mobile Application Standards & Skills Directive

Whenever working on the mobile employee application (`apps/mobile-employee-app`):
1. **Always read [`.agents/rules/mobile-app-expo.md`](file:///e:/PolyFit/polyfit/.agents/rules/mobile-app-expo.md)** for architecture, design tokens, and aggregator rules.
2. **Proactively consult installed workspace skills** in `.agents/skills/`:
   - [`expo-native-ui`](file:///e:/PolyFit/polyfit/.agents/skills/expo-native-ui/SKILL.md) — Native UI components, Apple HIG & Material design, visual effects, and storage.
   - [`expo-router`](file:///e:/PolyFit/polyfit/.agents/skills/expo-router/SKILL.md) — File-based navigation, typed routes, modals, and sheets.
   - [`expo-animation`](file:///e:/PolyFit/polyfit/.agents/skills/expo-animation/SKILL.md) — 60/120 FPS Reanimated spring physics, gestures, and transitions.
   - [`vercel-react-native-skills`](file:///e:/PolyFit/polyfit/.agents/skills/vercel-react-native-skills/SKILL.md) — Performance rules, list virtualization, and zero-stutter rendering.

---

## Core Ecosystem Skills Directive

Whenever working across portals, pricing, backend, database, or shared packages:
1. **Always read [`.agents/rules/other-rules.md`](file:///e:/PolyFit/polyfit/.agents/rules/other-rules.md)** and [`.agents/rules/mcp-full-context.md`](file:///e:/PolyFit/polyfit/.agents/rules/mcp-full-context.md) for mandatory sync rules and closeout checklists.
2. **Proactively consult installed workspace skills** in `.agents/skills/`:
   - [`polyfit-ecosystem-sync`](file:///e:/PolyFit/polyfit/.agents/skills/polyfit-ecosystem-sync/SKILL.md) — Cross-portal synchronization matrix, ripple-effect audits, and pre-launch production-readiness standards.
   - [`supabase`](file:///e:/PolyFit/polyfit/.agents/skills/supabase/SKILL.md) — Live schema inspection, RLS policies, PostgREST explicit grants, and migrations.
   - [`supabase-postgres-best-practices`](file:///e:/PolyFit/polyfit/.agents/skills/supabase-postgres-best-practices/SKILL.md) — Postgres performance optimization and query architecture.