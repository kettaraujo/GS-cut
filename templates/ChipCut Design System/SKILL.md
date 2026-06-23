---
name: chipcut-design
description: Use this skill to generate well-branded interfaces and assets for ChipCut (Grupo GoldenSat), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick facts
- **Brand:** Grupo GoldenSat · **Product:** ChipCut (internal SIM-card ICCID reader, batch approval & deactivation).
- **Language:** Brazilian Portuguese. **Stack:** Django + Bootstrap 5.3 + Bootstrap Icons + Inter.
- **Look:** stock Bootstrap, lightly themed. Personality = navy `#1a2332` + amber `#d4a574` sidebar; clean white `shadow-sm` cards on `#f8f9fa`.
- **Tokens:** `colors_and_type.css`. **Icons:** Bootstrap Icons (CDN, `bi bi-…`). **ICCIDs:** monospace.
- **UI kit:** `ui_kits/chipcut/` — copy components to recreate real screens. Don't invent new layouts; match the existing app.

## Key files
- `README.md` — full context, content & visual foundations, iconography.
- `colors_and_type.css` — all design tokens.
- `assets/sample-chips/` — real SIM photos · `assets/wordmark.html` — the ✂️ ChipCut wordmark.
- `preview/` — design-system specimen cards.
- `ui_kits/chipcut/` — interactive recreation of the web app.
