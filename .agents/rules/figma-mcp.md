# Figma MCP Universal Workflow Rules

## Core Directive
Figma MCP is a multi-purpose design and engineering bridge for PolyFit across:
1. **Competitor / Web UI Ingestion (Design-to-Code)**:
   - When the user captures components from the web using the Figma Chrome Extension (e.g. HTML to Figma) into a Figma file:
   - Use `get_selection`, `get_node_info`, or `read_my_design` to inspect typography, layout hierarchy, padding, borders, and colors.
   - Map captured Figma nodes directly to production code (React / Next.js or React Native Expo) adhering to PolyFit design tokens.

2. **B2B Client, Provider & Beneficiary Sales Decks**:
   - Create high-impact slide decks tailored specifically to each PolyFit actor:
     - **Employer / HR Sales Pitch**: Emphasize employee wellness ROI, consolidated billing, single vendor contract, and real-time attendance analytics.
     - **Provider Network Pitch**: Emphasize incremental corporate foot traffic, monetization of off-peak hours, zero payment collection risk, and automated bi-weekly settlement.
     - **Employee / Beneficiary Guide**: Lean onboarding, dynamic TOTP mobile pass, and multi-category facility discovery.

3. **Marketing Assets & Platform Mockups**:
   - Create marketing collateral, banner graphics, platform screenshots, and device frames directly in Figma when Stitch is not in use.
   - Export rendered assets using `export_node_as_image`.

4. **Technical & Execution Rules**:
   - **Socket Connection**: Always maintain sync with `bunx cursor-talk-to-figma-socket` on port 3055 and channel `main`.
   - **Local Relative Coordinates**: When creating children inside frames, always use local relative coordinates `(x, y)` relative to parent `(0, 0)`.
   - **Official Skill**: Consult [`figma-use`](file:///e:/PolyFit/polyfit/.agents/skills/figma-use/SKILL.md) for plugin API rules, text loading recipes, and auto-layout enums.
