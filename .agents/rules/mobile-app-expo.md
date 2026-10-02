# PolyFit Mobile Application — Architecture & Implementation Rules

## Mandatory Agent Skills Directive
Before generating, refactoring, or reviewing any mobile code in `apps/mobile-employee-app`, every agent **MUST proactively consult the installed workspace skills**:
1. **[`expo-native-ui`](file:///e:/PolyFit/polyfit/.agents/skills/expo-native-ui/SKILL.md)**: For Apple HIG / Material styling, `@expo/ui` native controls, SF Symbols/Material icons, blur effects (`expo-blur`), and storage (`expo-secure-store`).
2. **[`expo-router`](file:///e:/PolyFit/polyfit/.agents/skills/expo-router/SKILL.md)**: For file-based routing, native stacks, tabs, sheet modals (`presentation: 'formSheet'`), and route params.
3. **[`expo-animation`](file:///e:/PolyFit/polyfit/.agents/skills/expo-animation/SKILL.md)**: For Reanimated spring physics, gesture handling, entering/exiting micro-animations, and haptics.
4. **[`vercel-react-native-skills`](file:///e:/PolyFit/polyfit/.agents/skills/vercel-react-native-skills/SKILL.md)**: For list virtualization, GPU-accelerated transforms, and render performance.

---

## Product & Actor Context

**The PolyFit Mobile Application (`apps/mobile-employee-app`) serves the Corporate Employee / Beneficiary.**

It is NOT a gym-member app. PolyFit is a B2B2C corporate wellness aggregator connecting employers with a network of independent wellness providers (fitness clubs, swimming pools, yoga/pilates studios, steam/sauna centers, sports courts, and physiotherapy clinics) across East Africa (Rwanda, Kenya, etc.).

### Terminology Enforcement (Strict Anti-Bias)
| Forbidden (Gym Software Bias) | Required (PolyFit Aggregator) |
|---|---|
| Member / Gym Member | Employee / Beneficiary |
| Gym / Fitness Center (as default) | Wellness Provider / Provider Facility |
| Membership / Gym Plan | Corporate Benefit / Plan Tier |
| Attendance / Check-in (as attendance) | Verified Visit / Access Pass |
| Gym Payment | Co-Pay Settlement / Top-Up |
| Class Member | Beneficiary Participant |

---

## Technical Stack & Framework Standards

1. **Framework & Runtime**:
   * **Expo SDK 56** + React Native.
   * **Routing**: Expo Router (file-based routing inside `app/`).
   * **Language**: TypeScript (`strict: true`).
   * **Engine**: Hermes.
2. **State & Data Fetching**:
   * Global state: Zustand.
   * Server cache: TanStack Query (React Query) for optimistic updates and automatic cache invalidation.
   * Local storage: `expo-secure-store` for cryptographic token seeds, and MMKV / AsyncStorage for cached offline metadata.
3. **Icons & Assets**:
   * Lucide Icons (`lucide-react-native`).
   * Image optimization: `expo-image` with WebP and progressive caching.
4. **Monorepo & Package Management**:
   * Managed via **pnpm** in `apps/mobile-employee-app`.
   * Metro configured via `@expo/metro-config` with `watchFolders` pointing to workspace root and `nodeModulesPaths` resolving both app and root node_modules.

---

## Design System Integration (PolyFit Design System v1.0)

All UI components must strictly match the Stitch Design System (`projects/16498663316307719095`):

### Color Tokens
* **Midnight Navy (`#0B1F33`)**: Primary structural surfaces, headers, high-contrast text.
* **Electric Green (`#28D17C`)**: Primary action CTAs, verified badges, active pass timers.
* **Kinetic Teal (`#00D2B4`)**: Secondary telemetry highlights, amenity chips, category markers.
* **Surface Background (`#F7F9FC`)**: Light mode canvas background.
* **Card Surface (`#FFFFFF`)**: Pure white cards with hairline border (`#E2E8F0`).
* **Dark Surface Elevated (`#132D43`)**: Elevated dark components and pass modals.
* **Text Primary (`#0B1F33`)**, **Text Secondary (`#526173`)**, **Text Muted (`#8491A3`)**.

### Critical Accessibility & Contrast Rules
* **NEVER put white text on Electric Green (`#28D17C`)**. Always use Midnight Navy (`#0B1F33`) text on green action buttons and active status badges.
* Use `Inter` font family for all UI controls, body text, and headings.
* Use `JetBrains Mono` exclusively for Pass TOTP digits, countdown counters, and currency amounts (`RWF`, `KES`).

---

## Core Mobile Architecture (Lean 3-Tab Model)

The V1 application is intentionally lean and distraction-free. It has exactly **3 tabs** and **1 onboarding gate**:

1. **Frictionless Corporate Onboarding (`PF-105`)**:
   * Automatic employer recognition via work email domain (`@bk.rw`, `@equitybank.co.ke`).
   * Clean corporate subsidy card presentation before entering the main app.
2. **Tab 1: Access Pass (`PF-101`)**:
   * 1-tap dynamic RFC 6238 TOTP QR code rotating every 15 seconds.
   * Built-in **100% Offline Cryptographic Pass Vault**: pre-cached token seed in `SecureStore` ensures passes work in basements with zero cellular data.
   * Circular animated countdown ring and animated watermark overlay to prevent static screenshot sharing.
   * Dual-modality support: display QR to receptionist scanner OR scan partner desk QR plaque with camera.
3. **Tab 2: Provider Discovery (`PF-100`)**:
   * Clean Map + low-bandwidth List View toggle.
   * Simple category chips: All, Fitness, Swimming, Yoga, Spa/Recovery.
   * GPS distance calculation and *"Included in your Plan"* badge indicators.
4. **Tab 3: Profile & Benefit Status (`PF-102`)**:
   * Beneficiary name, corporate email, employer badge (`Bank of Kigali`).
   * Active Benefit Card: Plan Tier, remaining monthly visit count, renewal date.
   * Simple recent visit history and clean sign-out.

### Features Excluded from V1 (Zero-Bloat Rule)
* ❌ **NO Corporate Social Challenges / Leaderboards**: Kept out to prevent social feed clutter.
* ❌ **NO In-App Co-Pay Wallets**: Employer subsidizes standard plans; payment screens are unnecessary.
* ❌ **NO Class Booking Engine**: Early partner facilities operate on drop-in access; waitlists and seat reservation penalties add friction.
* ❌ **NO Family / Dependent Switchers**: Deferred until corporate accounts complete primary employee onboarding.

---

## Code Hygiene & Coding Standards
* Prefer functional components with hooks. Never use class components.
* Use early returns to keep component bodies clean and readable.
* Always enforce safe area handling (`react-native-safe-area-context`).
* Never hardcode magic numbers; extract design tokens and constants (e.g. `TOTP_STEP_SECONDS = 15`, `GEOFENCE_RADIUS_METERS = 200`).
* Keep mobile bundles lean: avoid bloated heavy libraries when native or lightweight alternatives exist.
