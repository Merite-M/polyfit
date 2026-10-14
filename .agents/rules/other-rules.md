---
trigger: always_on
---

# PolyFit Core Operational Directives

1. **Foundational Context**: Always read and strictly adhere to [AGENTS.md](file:///e:/PolyFit/polyfit/AGENTS.md) and all rules in [`.agents/rules/`](file:///e:/PolyFit/polyfit/.agents/rules/). PolyFit is a B2B2C Corporate Wellness Aggregator, NOT gym-management software.

2. **Unified Ecosystem & Mandatory Cross-Portal Synchronization**:
   - PolyFit's portals (`/operations`, `/corporate`, `/partner`), public pages (`/`, `/pricing`, `/network`), mobile employee app (`apps/mobile-employee-app`), backend (`apps/backend-core`), and shared packages (`packages/shared-types`, `packages/shared-utils`) are **interconnected and unified**.
   - **Never treat any portal as an isolated silo.**
   - When editing or updating code in one portal or sub-repo (for example, `/operations` - Super Admin), you **MUST proactively search and synchronize related code, pricing, types, and UI in other portals and sub-repos, including the public marketing website (`/pricing`, `/`) and mobile app.**
   - Example: Updating corporate plan tiers, visit limits, or pricing in `/operations/plans` requires immediate synchronization with `/pricing` (cards, tier comparison table, calculator, FAQ), `/corporate` (employer tier assignment), `/partner` (provider rate cards), `packages/shared-types`, `apps/backend-core`, and `apps/mobile-employee-app`.

3. **Pre-Launch Completeness & Zero-Placeholder Mandate**:
   - PolyFit is in the pre-launch phase of polishing, finalizing, completeness, and debugging.
   - **Full functionality is mandatory** for both updating existing features and adding new features.
   - **Zero Placeholders Allowed**:
     - ❌ NO `// TODO: implement later`, `// FIXME`, or dummy stubs.
     - ❌ NO empty handlers like `onClick={() => {}}` or buttons that do nothing.
     - ❌ NO `alert("Coming soon")` or mock alert messages.
     - ❌ NO hardcoded dummy arrays where live Supabase or backend API queries exist.
   - Every interactive control (button, input, form, dropdown, modal, filter) must work end-to-end with real state, real API/DB integration, complete validation, and polished user feedback (toasts, dialogs, loading spinners, empty states, and error handling).

4. **Production-Readiness Standards**:
   - Zero runtime console errors, zero uncaught promise rejections, zero React hydration errors.
   - Clean TypeScript builds with zero type errors.
   - Adhere to modern web platform standards (`modern-web-guidance`): native dialogs, container queries, zero layout shifts, full responsiveness across mobile, tablet, and desktop viewports.