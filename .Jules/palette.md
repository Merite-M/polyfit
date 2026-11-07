## 2025-05-18 - Accessibility on Hover-Overlay Photo Gallery Grids
**Learning:** In photo gallery management components (such as partner facility onboarding grids), action buttons (like delete) are often hidden inside hover overlays (`opacity-0 group-hover:opacity-100`). Keyboard users navigating via Tab cannot reveal or focus these actions unless `group-focus-within:opacity-100` or explicit focus styles are attached to the container. Additionally, icon-only delete buttons within gallery cards must provide indexed dynamic ARIA labels (e.g. `aria-label="Delete facility photo #1"`) rather than generic titles.
**Action:** Always include `group-focus-within:opacity-100` on overlay containers, dynamic `aria-label` attributes on card actions, and `focus-visible:ring-2` on interactive elements in image grid components.

## 2026-11-04 - Ecosystem Switcher Dropdown Keyboard Dismissal & ARIA Semantics
**Learning:** Cross-portal navigation switchers (e.g., `PlatformSuiteLauncher`) that render floating custom dropdown menus trap keyboard users unless an explicit `Escape` key event listener is bound when open. Furthermore, trigger buttons require explicit `aria-controls` referencing the menu's ID and clear `focus-visible:ring-2` styles so keyboard navigators do not lose orientation.
**Action:** Always bind `keydown` for `Escape` alongside outside-click listeners in custom dropdown menus, pair trigger `aria-controls` with menu ID, and provide explicit `aria-orientation="vertical"` for `role="menu"` containers.

## 2026-10-30 - Dialog and Selection Radiogroup Semantics in Financial Modals
**Learning:** Financial export modals (such as disbursement batch generators) containing multiple button-based filter selectors lack screen reader context without `role="radiogroup"` containers and `role="radio"` with `aria-checked` states. Furthermore, `<dialog>` elements must declare `aria-labelledby` referencing their title header, and date filters require explicit `htmlFor`/`id` bindings so screen readers correctly identify each boundary input.
**Action:** Always equip multi-button filter groups with `role="radiogroup"` / `role="radio"`, pair `<dialog>` with `aria-labelledby`, and provide visible focus rings (`focus-visible:ring-2`) and cursor-pointer on all interactive modal actions.

