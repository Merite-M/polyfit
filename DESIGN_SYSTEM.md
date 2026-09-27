# PolyFit Master Design System v1.0
*Canonical brand, design token, and component constitution for PolyFit engineers, designers, and AI coding agents.*

---

## 1. Product & Strategic Context

- **Platform:** PolyFit
- **Category:** B2B2C Corporate Wellness Aggregator Network
- **Descriptor:** Corporate Wellness Network
- **Proposition:** One Benefit. Multiple Providers. Healthier Teams.
- **Architectural Flow:** Organization (Employer) → Benefit Policy → Employee (Beneficiary) → Wellness Provider → Verified Visit → Settlement

PolyFit is **enterprise infrastructure for corporate wellness**, not gym management software.

---

## 2. Core Brand Identity & Logo Architecture

### 2.1 Primary Identity Mark: 3D Isometric Hexagonal 'P'
- **Concept:** Network Hexagon (Multiple Facilities) + Letter 'P' (PolyFit) + Flow Portal = PolyFit Mark.
- **Construction & Angles:** 30° true axonometric/isometric projection.
- **Negative Space Rule:** The loop of the 'P' features an open, clean hexagonal negative space counter — no solid multifaceted inner block.
- **Facet Color Mapping:**
  - Top Horizontal Plane: PolyFit Electric Green (`#28D17C`)
  - Left Vertical Plane: Dynamic Emerald (`#22C55E` / `#10B981`)
  - Right Angled Plane: Deep Emerald (`#00A86B`)
  - Inner Drop Plane: PolyFit Midnight Navy (`#0B1F33`)
- **Wordmark:** Inter Bold (700), `-0.02em` tracking. Two-tone: **Poly** (Midnight Navy `#0B1F33` / White `#FFFFFF` in dark mode) + **Fit** (Electric Green `#28D17C`).
- **Descriptor:** `CORPORATE WELLNESS NETWORK` in Inter SemiBold (600), uppercase, `+0.12em` tracking, flanked by horizontal line rules.

### 2.2 Secondary Digital Motif: Constellation Connected Nodes
- Constellation network forming the letter 'P' with 14 luminous circular vertices and connecting edges.
- Used for dynamic QR check-in passes, real-time graph visualization, network telemetry, and background geometric watermarks.

---

## 3. Master Design Tokens

### 3.1 Color Tokens

```yaml
brand:
  primary: "#0B1F33"          # PolyFit Midnight Navy: Headers, authority, dark surfaces
  accent: "#28D17C"           # PolyFit Electric Green: Primary CTA, verified visits, active states
  accent-hover: "#22BC6E"     # Hover state for primary buttons
  accent-subtle: "#E9FAF2"    # 10% green background for success tags and highlights
  secondary: "#00D2B4"        # Kinetic Teal: Network lines, wellness balance, data accents
  highlight: "#B8F36B"        # Accent Lime: Promotional badges, kinetic gradient spark
  tertiary: "#3B82F6"         # Electric Blue: Informational states, secondary analytic accents

neutral:
  background: "#F7F9FC"       # Clean enterprise canvas
  surface: "#FFFFFF"          # Pure white card surface
  surface-dim: "#F1F4F8"      # Recessed container surface
  border: "#E2E8F0"           # 1px hairline border on light surfaces
  text-primary: "#0B1F33"     # High-contrast reading text
  text-secondary: "#526173"   # Muted descriptions and table headers
  text-muted: "#8491A3"       # Captions and disabled states
  text-inverse: "#FFFFFF"     # Text on navy and dark backgrounds

dark:
  background: "#071521"       # Deep midnight dark mode canvas
  surface: "#0D2235"          # Dark card surface
  surface-elevated: "#132D43" # Floating dropdowns and modals
  border: "#21405A"           # Hairline border on dark surfaces

semantic:
  success: "#28D17C"          # Verified visit, active coverage, approved settlement
  warning: "#F59E0B"          # Capacity threshold, expiring plan, pending review
  error: "#EF4444"            # Access denied, payment failed, dispute opened
  info: "#00D2B4"             # System notice, contract update
```

### 3.2 Gradient Tokens
```css
--pf-gradient-flow: linear-gradient(135deg, #28D17C 0%, #00D2B4 100%);
--pf-gradient-vitality: linear-gradient(135deg, #28D17C 0%, #B8F36B 100%);
--pf-gradient-executive: linear-gradient(180deg, #0D2235 0%, #071521 100%);
```

### 3.3 Typography Tokens (Inter + JetBrains Mono)

| Token | Size | Weight | Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display-2xl` | 60px | 700 Bold | 66px (1.1) | -0.025em | Marketing hero headline |
| `display-xl` | 48px | 700 Bold | 56px (1.15) | -0.02em | Major portal splash title |
| `headline-lg` | 36px | 700 Bold | 44px (1.2) | -0.015em | Section headers |
| `headline-md` | 24px | 700 Bold | 32px (1.3) | -0.01em | Card and module titles |
| `headline-sm` | 20px | 600 SemiBold | 28px (1.35) | -0.005em | Subsections, modal titles |
| `body-lg` | 18px | 400 Regular | 28px (1.55) | 0 | Lead paragraphs, callouts |
| `body-base` | 16px | 400 / 500 | 24px (1.5) | 0 | Standard body text, form inputs |
| `body-sm` | 14px | 400 / 500 | 20px (1.45) | 0 | Secondary descriptions, tables |
| `caption` | 12px | 600 SemiBold | 16px (1.35) | +0.02em | Status badges, timestamps |
| `mono-id` | 12px | 500 Medium | 16px (1.35) | 0 | Member IDs, RWF amounts, hashes |

### 3.4 Spacing System (4px Base Unit)
- `space-1`: 4px
- `space-2`: 8px
- `space-3`: 12px
- `space-4`: 16px
- `space-5`: 20px
- `space-6`: 24px
- `space-8`: 32px
- `space-10`: 40px
- `space-12`: 48px
- `space-16`: 64px
- `space-20`: 80px
- `space-24`: 96px
- `space-32`: 128px

### 3.5 Border Radius Constants
```yaml
radius:
  card: "14px"       # Standard for all content cards, tables, and dialogs
  button: "10px"     # Interactive controls, inputs, selects
  inner: "8px"       # Sub-elements nested inside cards
  badge: "9999px"    # Status chips, pill tags, member avatars
```

### 3.6 Elevation & Shadows
```css
--pf-shadow-ambient: 0 1px 3px 0 rgba(11, 31, 51, 0.05), 0 1px 2px -1px rgba(11, 31, 51, 0.03);
--pf-shadow-elevated: 0 8px 20px -4px rgba(11, 31, 51, 0.08), 0 4px 6px -2px rgba(11, 31, 51, 0.04);
--pf-shadow-modal: 0 20px 25px -5px rgba(11, 31, 51, 0.15), 0 8px 10px -6px rgba(11, 31, 51, 0.1);
```

---

## 4. Component Rules

### Buttons
- **Primary:** Background `#28D17C`, text `#0B1F33` (Bold), radius `10px`, min-height `44px`. Hover: `#22BC6E`.
- **Secondary:** Background `#FFFFFF`, border `1px solid #0B1F33`, text `#0B1F33`, radius `10px`.
- **Ghost:** Transparent background, text `#0B1F33`, hover `#F1F4F8`, radius `10px`.
- **Destructive:** Background `#EF4444`, text `#FFFFFF`, radius `10px`.

### Status Badges & Chips
- `9999px` full pill, `4px 10px` padding, `12px` font size, `600` weight.
- **Active / Verified:** Green `#E9FAF2` bg, `#008A4B` text, `#B7F1D2` border, with `BadgeCheck` icon.
- **Pending:** Amber `#FEF3C7` bg, `#D97706` text, `#FDE68A` border, with `Clock` icon.
- **Suspended:** Red `#FEE2E2` bg, `#DC2626` text, `#FECACA` border, with `AlertCircle` icon.

---

## 5. Non-Negotiable Directives
1. **Never use pure black (`#000000`).** Use PolyFit Midnight Navy (`#0B1F33`).
2. **Never place white text on PolyFit Green (`#28D17C`).** Use Midnight Navy (`#0B1F33`) for proper WCAG AAA contrast.
3. **No gym software legacy language.** Use Beneficiary, Benefit Policy, Verified Visit, Wellness Provider, Settlement.
4. **Cards strictly 14px, Buttons strictly 10px, Badges strictly 9999px.**
5. **No multifaceted solid block inside the 'P' counter.** Clean negative space counter only.
6. **Inter for UI, JetBrains Mono for data.** No random third fonts.
7. **Lucide icons exclusively with 1.75px–2px stroke.**
