## 2025-05-18 - Accessibility on Hover-Overlay Photo Gallery Grids
**Learning:** In photo gallery management components (such as partner facility onboarding grids), action buttons (like delete) are often hidden inside hover overlays (`opacity-0 group-hover:opacity-100`). Keyboard users navigating via Tab cannot reveal or focus these actions unless `group-focus-within:opacity-100` or explicit focus styles are attached to the container. Additionally, icon-only delete buttons within gallery cards must provide indexed dynamic ARIA labels (e.g. `aria-label="Delete facility photo #1"`) rather than generic titles.
**Action:** Always include `group-focus-within:opacity-100` on overlay containers, dynamic `aria-label` attributes on card actions, and `focus-visible:ring-2` on interactive elements in image grid components.

## 2026-11-04 - Ecosystem Switcher Dropdown Keyboard Dismissal & ARIA Semantics
**Learning:** Cross-portal navigation switchers (e.g., `PlatformSuiteLauncher`) that render floating custom dropdown menus trap keyboard users unless an explicit `Escape` key event listener is bound when open. Furthermore, trigger buttons require explicit `aria-controls` referencing the menu's ID and clear `focus-visible:ring-2` styles so keyboard navigators do not lose orientation.
**Action:** Always bind `keydown` for `Escape` alongside outside-click listeners in custom dropdown menus, pair trigger `aria-controls` with menu ID, and provide explicit `aria-orientation="vertical"` for `role="menu"` containers.

## 2026-10-30 - Dialog and Selection Radiogroup Semantics in Financial Modals
**Learning:** Financial export modals (such as disbursement batch generators) containing multiple button-based filter selectors lack screen reader context without `role="radiogroup"` containers and `role="radio"` with `aria-checked` states. Furthermore, `<dialog>` elements must declare `aria-labelledby` referencing their title header, and date filters require explicit `htmlFor`/`id` bindings so screen readers correctly identify each boundary input.
**Action:** Always equip multi-button filter groups with `role="radiogroup"` / `role="radio"`, pair `<dialog>` with `aria-labelledby`, and provide visible focus rings (`focus-visible:ring-2`) and cursor-pointer on all interactive modal actions.

## 2026-11-05 - Multi-Digit Passcode & Verification Modality Accessibility
**Learning:** In fast-paced front-desk verification terminals with segmented multi-input passcodes (e.g. 6 individual digit fields), screen readers without explicit dynamic position indicators (e.g. `aria-label="Digit 1 of 6"`) provide disorienting feedback as cursor auto-advances. Similarly, custom modality switchers require explicit `role="tablist"`/`role="tab"` attributes with `aria-selected` so keyboard users perceive active mode state, and live telemetry cards require `aria-live="polite"` so check-in outcomes are immediately voiced.
**Action:** Always wrap segmented code inputs with `role="group"` and provide `aria-label="Digit X of Y"`, use proper tab ARIA roles on modality toggles, and use `aria-live="polite"` on async check-in result telemetry.

## 2026-11-04 - Direct Stakeholder Action Flow Bypass
**Learning:** Re-prompting users with an intent/disambiguation modal ("Which best describes you?") when they have already selected a persona-specific CTA (e.g. "I am an employer" or "I am a fitness provider") adds cognitive friction and redundant interactions. Persona-targeted buttons should route directly to the intended flow or open the targeted modal pre-selected to that role.
**Action:** Default trigger wrappers like LeadModalTrigger to intent=false when persona is explicit (type="employer" or type="provider"), reserving generic multi-actor disambiguation modals exclusively for top-level, persona-agnostic entry points like "Get Started".

## 2026-10-29 - Modal Tabs and Top-Layer Dismiss Semantics
**Learning:** In native `<dialog>` modals with multi-view controls (e.g., Marketing Toolkit asset generators), tab buttons commonly omit ARIA tablist/tab/tabpanel semantics and focus indicators. Screen readers fail to convey which asset section is active or how panels relate, and the icon-only modal close button lacks an accessible name.
**Action:** When implementing modal tab switchers, wrap the header in `role="tablist"` with `aria-label`, bind each tab trigger with `role="tab"`, `id`, `aria-selected`, and `aria-controls`, pair them with `role="tabpanel"`, `id`, and `aria-labelledby`, and ensure the close button has an explicit `aria-label` and `focus-visible` ring.

