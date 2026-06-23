# ChipCut — UI Kit

A high-fidelity, interactive recreation of the **ChipCut** web app (Grupo
GoldenSat). It is a cosmetic click-through, not the real Django backend — capture
and OCR are simulated in the browser.

Open `index.html`. It boots at the **login** screen (any credentials work) and
lets you walk the real product flow.

## Flow
1. **Login** → centered card, ✂️ ChipCut wordmark.
2. **Dashboard** → KPI cards, real Chart.js line + doughnut, "últimas leituras" table, date presets.
3. **Lotes** → batches grouped by status (aberto / em revisão / fechados / cancelados); click a row to open.
4. **Lote (review)** → status header + conditional actions, per-status chip tables, inline ICCID correction (edit + blur), remove chip, approve / cancel, image lightbox (click a thumbnail).
5. **Leitura (capture)** → mobile-first: "📷 Tirar foto do chip" loads a sample SIM photo, "Ler ICCID" simulates the PRD's 2-step AI validation (≈80% 1st try / 15% 2nd try / 5% error) and appends the read to the open lote.

## Files
| File | Component(s) |
|------|--------------|
| `index.html` | Shell CSS, CDN loads, mounts all scripts |
| `data.jsx` | `window.CC_DATA` — fake lotes/chips/KPIs/series |
| `badges.jsx` | `StatusBadge`, `AttemptBadge` + status maps (from `chipcut_tags.py`) |
| `shell.jsx` | `Sidebar`, `MobileTopbar` |
| `login.jsx` | `LoginScreen` |
| `dashboard.jsx` | `Dashboard`, `KpiCard` (Chart.js) |
| `lotes.jsx` | `LotesList` |
| `review.jsx` | `LoteReview`, `ChipTable` |
| `capture.jsx` | `CaptureScreen` |
| `app.jsx` | `App` root — routing + in-memory mutations |

Components are shared across Babel scripts via `window.CC`.

## Fidelity notes
- Visuals come straight from the codebase: Bootstrap 5.3 classes, the navy/amber
  sidebar from `app.css`, Bootstrap Icons, Inter, monospace ICCIDs.
- The **Logs / audit** screen is intentionally a placeholder (the real `audit`
  app exists but no template ships a full UI worth recreating).
- Sidebar is a hand-rolled flex layout (not Bootstrap offcanvas) so it works
  without the Bootstrap JS bundle; behavior matches (sticky desktop, slide-in mobile).
