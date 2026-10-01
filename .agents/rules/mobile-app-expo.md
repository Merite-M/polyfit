# PolyFit Mobile Application — Architecture & Implementation Rules

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

## Core Mobile Feature Pillars

1. **Frictionless Corporate Onboarding**:
   * Automatic employer recognition via work email domain (`@bk.rw`, `@equitybank.co.ke`).
   * Alternative HR invite code / external employee ID flow for deskless staff.
   * Transparent corporate subsidy card presentation before entering main app.
2. **Multi-Category Wellness Discovery**:
   * Interactive Map + low-bandwidth List View toggle.
   * Multi-category taxonomy chips: Fitness, Swimming, Yoga & Pilates, Sauna & Recovery, Padel & Tennis, Physiotherapy.
   * Accurate GPS distance calculation and *"Included in your Plan"* badge indicators.
3. **Dynamic Anti-Screenshot Access Pass**:
   * Dynamic RFC 6238 TOTP QR code rotating every 15 seconds.
   * Circular animated SVG countdown ring.
   * Continuous animated gradient ripple overlay with embedded dynamic watermark (employee name, company, live timestamp).
   * Dual-modality support: Show dynamic QR to turnstile/scanner OR scan partner desk QR plaque with camera.
4. **100% Offline Cryptographic Pass Vault**:
   * Pre-cached 24-hour token seed stored in SecureStore.
   * App must successfully generate valid, rotating TOTP passes even in subterranean basements or Airplane Mode.
   * Optimistic local visit queue syncing automatically in the background when connectivity returns.
5. **Mobile Money Co-Pay Wallet (MTN MoMo / Airtel Money)**:
   * Native USSD/STK push prompt for copays and top-ups without credit cards.
   * Auto-deduct copay when accessing higher-tier facilities.
6. **Class & Session Booking**:
   * Timetable schedule browser with real-time room capacity quotas (`3 spots left`).
   * 30-minute pre-session check-in unlock window.
   * Anti-no-show cooldown enforcement.
7. **Family & Dependents Plan**:
   * Corporate-negotiated spouse/child add-on passes.
   * 1-tap profile switcher on Pass screen (`My Pass` ↔ `Dependent Pass`).

---

## Code Hygiene & Coding Standards
* Prefer functional components with hooks. Never use class components.
* Use early returns to keep component bodies clean and readable.
* Always enforce safe area handling (`react-native-safe-area-context`).
* Never hardcode magic numbers; extract design tokens and constants (e.g. `TOTP_STEP_SECONDS = 15`, `GEOFENCE_RADIUS_METERS = 200`).
* Keep mobile bundles lean: avoid bloated heavy libraries when native or lightweight alternatives exist.
