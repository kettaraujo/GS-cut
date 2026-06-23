# ChipCut — Design System

A branded design system for **ChipCut**, an internal operations tool built by
**Grupo GoldenSat**. ChipCut reads the **ICCID** number printed on SIM cards
from a photo (phone camera or a USB capture rig), validates it, groups reads
into **lotes** (batches), routes them through an internal review/approval flow,
and exports the results to Excel — with a full audit trail.

> In one line: a Portuguese-language, Bootstrap-themed internal web app for
> high-throughput SIM-card ICCID capture, batch approval, and SIM deactivation.

---

## Sources

This system was reverse-engineered from the ChipCut codebase (read-only,
mounted locally):

| Source | Path | Notes |
|--------|------|-------|
| Codebase | `chipcut/` | Django 5.2 project (the product) |
| Product spec | `chipcut/specs/PRD.md` | Full PRD v1.1 (MVP), author "Grupo GoldenSat" |
| Other specs | `chipcut/specs/{spec.md, spec2.md, ESCOPO_MVP.md, CLAUDE.md}` | Implementation specs |
| Theme tokens | `chipcut/templates/base.html` | `:root` brand vars (navy/amber + Bootstrap theme) |
| App CSS | `chipcut/static/css/app.css` | Sidebar, KPI cards, ICCID, capture styles |
| Templates | `chipcut/{dashboard,lotes,chips,core}/templates/` | Real rendered screens |
| Sample SIM photos | `chipcut/media/chips/**` | Real captured chip images (copied into `assets/sample-chips/`) |

No Figma file, brand book, or slide deck was provided. **Brand colors, type,
and components below are taken directly from the code**, not invented. The two
GoldenSat brand colors are documented in `base.html` as the "padrão GoldenSat".

---

## Product & context

- **Company:** Grupo GoldenSat (Brazilian telecom / satellite-connectivity operator).
- **Users:** Internal operators (capture chips at high volume) and authorized
  supervisors (review + approve batches before deactivation). RNF005 stresses
  the UI must be usable by operators *with no technical training*.
- **Language:** Brazilian Portuguese throughout (`lang="pt-br"`). All UI copy,
  labels, and status names are in Portuguese.
- **Platform:** Responsive web app. Desktop = fixed sidebar shell; mobile =
  offcanvas sidebar + native camera capture (`<input capture="environment">`).
- **Tech stack (the "design system of record"):**
  - Django 5.2 server-rendered templates
  - **Bootstrap 5.3.3** (the entire visual language is themed Bootstrap)
  - **Bootstrap Icons 1.11** (the only icon set)
  - **Inter** (Google Fonts) for all text
  - HTMX + Alpine.js for interactivity; DataTables for tables; Chart.js for the dashboard
- **Core flow:** capture chip → AI/OCR extracts ICCID → Luhn-validate (auto 2nd
  attempt on failure) → chip lands in a batch's review table → supervisor
  approves/rejects/removes → mass deactivation → Excel export. Every step is
  audit-logged.

### The product surfaces (screens)
1. **Login** — minimal centered card.
2. **Dashboard** — KPI cards, line + doughnut charts, "últimas leituras" table, date filters.
3. **Lotes (list)** — batches grouped by status, each a card with a DataTable.
4. **Lote (review)** — batch header with status + actions, per-status chip tables, inline ICCID correction, image lightbox.
5. **Capture** — mobile-first camera screen: big photo button, preview, recent reads list.

---

## CONTENT FUNDAMENTALS

How ChipCut writes copy. Match this exactly when producing ChipCut text.

- **Language:** Brazilian Portuguese, always. Never mix in English UI words.
- **Tone:** Plain, operational, instructional. This is a tool for getting work
  done fast — copy is functional, never marketing-y, never playful. No jokes.
- **Address:** Mostly **impersonal / imperative** ("Tirar foto do chip",
  "Aprovar lote", "Concluir e revisar lote"). Confirmations address the user
  with implied "você" ("Aprovar este lote? Os ICCIDs ficarão prontos para
  exportação."). No first person.
- **Casing:** **Sentence case** for almost everything — buttons, labels, headers
  ("Novo lote", "Em revisão", "Últimas leituras"). Status *badges* are an
  exception and use Title Case ("Aguardando Aprovação", "Erro de Leitura").
- **Buttons:** verb-first and short — "Filtrar", "Entrar", "Sair", "Exportar
  Excel", "Ler chip", "Ler ICCID", "Aprovar lote", "Cancelar".
- **Domain vocabulary (keep verbatim):** `ICCID`, `lote` (batch), `chip`,
  `leitura` (read), `revisão` (review), `desligamento` / `desativação`
  (deactivation), `tentativa` (attempt, "1ª"/"2ª"), `operador`, `responsável`.
- **Status language:** lote → `Aberto`, `Em Revisão`, `Aprovado`, `Exportado`,
  `Cancelado`. Review → `Aguardando Aprovação`, `Aprovado`, `Rejeitado`.
  Read → `Lido`, `Erro de Leitura`, `Pendente`.
- **Numbers / ordinals:** Portuguese ordinals with the superscript-style "ª"
  ("1ª", "2ª" tentativa). Dates `d/m/Y H:i` (e.g. `03/06/2026 14:20`).
- **Confirmations:** destructive actions use a `confirm()` sentence ending in a
  consequence ("Cancelar o lote inteiro? Nenhum chip será exportado.").
- **Empty states:** a muted inbox icon + one calm sentence ("Nenhuma leitura no
  período.", "Nenhum chip nesta seção.").
- **Emoji:** Used **sparingly and only two**: the scissors **✂️** in the
  "✂️ ChipCut" wordmark, and a camera **📷** on the capture button. Treat these
  two as semi-official. Do **not** introduce other emoji.
- **Vibe:** trustworthy, auditable, fast. "Confirme antes de desligar." Every
  destructive action is gated and logged.

---

## VISUAL FOUNDATIONS

ChipCut is **stock Bootstrap 5.3, lightly themed**. The personality lives almost
entirely in the **navy + amber sidebar**; the content area is clean, white,
card-based Bootstrap. Lean into that restraint — do not over-design.

- **Colors:**
  - Brand: **GoldenSat Gold `#efc319`** (the vivid gold of the eagle logo) +
    **Navy `#1a2332`** (sidebar) + a warm **Amber `#d4a574`** (sidebar text /
    accent tint). Logo black is `#111`. Gold + navy are the primary identity
    pair; amber is the softer in-app sidebar text. (Confirmed by the client:
    "dourado, azul marinho e as que vocês mostraram.")
  - The working palette is **Bootstrap's theme**: primary `#0d6efd` (actions,
    links, line chart), success `#198754` (read OK / approved / export),
    warning `#ffc107` (awaiting approval / 2nd attempt), danger `#dc3545`
    (errors / destructive), info `#0dcaf0` (batch approved), secondary
    `#6c757d` (muted / cancelled).
  - Canvas is **`bg-light` `#f8f9fa`**; cards are white. Body text `#212529`,
    muted `#6c757d`.
- **Type:** **Inter** for everything (400/500/600/700). Page titles use `.h3`,
  card/lote titles `.h4`, card section headers `.h6` in muted grey. KPI values
  are 2rem/700. ICCID numbers are **monospace** (`ui-monospace`) with 0.5px
  letter-spacing — the one place type breaks from Inter.
- **Spacing & layout:** Bootstrap spacer rhythm (`g-3` = 1rem gutters, `mb-4`
  between blocks, `p-3`/`p-lg-4` page padding). **Fixed 250px sidebar** sticky
  full-height on desktop; offcanvas on mobile with a `bg-dark` topbar. Content
  is a fluid container.
- **Backgrounds:** Flat solid colors only. **No** gradients, **no** hero images,
  **no** patterns, textures, or illustrations. The only imagery in the product
  is the **captured SIM-chip photos** (square thumbnails, 40–64px, object-fit
  cover) and their lightbox enlargements. Chip photos are neutral/grey,
  unstyled, as-shot.
- **Cards:** white background, `border-radius .5rem`, **`shadow-sm`**
  (`0 .125rem .25rem rgba(0,0,0,.075)`), usually borderless body; section
  headers use a **white** `card-header` (`bg-white`). This soft-shadow white
  card is *the* dominant container.
- **Borders:** subtle `#dee2e6` 1px on tables, thumbnails, dividers. Inputs use
  Bootstrap's `#ced4da`. Sidebar footer divider is a faint white at 8% opacity.
  The capture preview uses a **2px dashed `#adb5bd`** placeholder frame.
- **Radii:** badges/sm `4px`; buttons & inputs & thumbnails `6px`; cards &
  capture preview `8–10px`; pills for nothing by default.
- **Shadows / elevation:** essentially one level — `shadow-sm` on every card.
  Modals use Bootstrap's larger `.shadow`. No colored glows, no inner shadows.
- **Hover states:** Bootstrap defaults — buttons darken ~10% on hover; nav links
  get a `rgba(255,255,255,.06)` wash and brighten to white; table rows use
  `table-hover` grey. Links are primary blue, underline-on-hover (many use
  `text-decoration-none` and rely on color).
- **Active state (nav):** amber text + amber `0.15` background + a **3px amber
  left-border** on the active sidebar link. This left-accent is the signature
  GoldenSat interaction detail.
- **Press states:** Bootstrap default (no custom shrink/scale).
- **Animation:** Minimal. Bootstrap transitions only (offcanvas slide, modal
  fade, button color). A global HTMX spinner (`spinner-border text-primary`)
  pinned top-center during requests. No bounces, no parallax, no decorative
  motion. Respect `prefers-reduced-motion`.
- **Transparency / blur:** none to speak of — only the amber `0.15` nav wash and
  white `0.06–0.08` sidebar overlays. No glassmorphism / backdrop blur.
- **Status badges:** Bootstrap `badge text-bg-{color}`, each paired with a
  Bootstrap Icon and a Title-Case label (see Iconography). This is the primary
  way state is communicated across the app.
- **Tables:** `table table-hover table-sm align-middle`, upgraded to DataTables
  (pt-BR locale, 25/page, search + length controls). Dense, monospace ICCID
  column, small chip thumbnails, inline correction inputs.
- **Imagery color vibe:** the only images are raw SIM-chip photos — neutral,
  cool grey, slightly noisy phone-camera shots. No filters, no grain overlay,
  no duotone.

---

## ICONOGRAPHY

- **Icon set:** **Bootstrap Icons 1.11** (`bootstrap-icons` web font via CDN) —
  the single, consistent icon system across the entire app. Loaded as
  `<link href=".../bootstrap-icons.min.css">` and used as `<i class="bi bi-…">`.
  This system uses the **same CDN link** (no local files); recreations should
  link Bootstrap Icons from CDN, not hand-draw SVGs.
- **Style:** Bootstrap Icons are a uniform-weight, lightly-rounded, mostly
  outline set (some solid variants). Match that — never mix in another icon
  family.
- **Common icons in use (verbatim):**
  - Nav: `bi-speedometer2` (Dashboard), `bi-collection` (Lotes),
    `bi-camera` (Leitura), `bi-clipboard-data` (Logs), `bi-gear` (Config),
    `bi-person-circle`, `bi-box-arrow-right` (Sair).
  - KPIs: `bi-card-checklist`, `bi-clock-history`, `bi-exclamation-triangle`,
    `bi-folder2-open`.
  - Status badges: `bi-clock-history` (awaiting), `bi-check-circle` /
    `bi-check2` / `bi-check-all` / `bi-clipboard-check` (approved/exported),
    `bi-x-circle` (rejected), `bi-exclamation-triangle` (error),
    `bi-hourglass` (pending), `bi-eye` (in review), `bi-slash-circle` (cancelled).
  - Actions: `bi-plus-lg`, `bi-funnel`, `bi-camera`, `bi-check2-circle`,
    `bi-x-circle`, `bi-file-earmark-excel`, `bi-trash`, `bi-check-lg`,
    `bi-arrow-left`, `bi-inbox` (empty states), `bi-list` (mobile menu).
- **Emoji as icon:** Two, intentional — **✂️** in the "ChipCut" wordmark and
  **📷** on the capture button. No others.
- **Logo:** The **GoldenSat eagle-on-shield emblem** (gold `#efc319` + black,
  golden falcon over a winged crest shield) is the corporate mark. Files:
  `assets/logo-goldensat.png` (background removed, for placing on navy/light)
  and `assets/logo-goldensat-original.png` (as supplied). Pair the emblem with
  the **"ChipCut" wordmark** for the product lockup — the emblem is GoldenSat
  (the company), ChipCut is the product. In the app sidebar/login, use the
  emblem next to the bold "ChipCut" wordmark. The ✂️ scissors emoji was the
  original placeholder mark and may still appear in legacy templates; prefer the
  real emblem going forward. See `assets/wordmark.html` for the text lockup.
- **Unicode:** the "ª" ordinal indicator (1ª/2ª) and "—" em dash for empty cells.

---

## Index — what's in this system

| File / folder | What it is |
|---------------|-----------|
| `README.md` | This document — context, content, visual & icon foundations |
| `SKILL.md` | Agent-Skill manifest for using this system in Claude Code |
| `colors_and_type.css` | All design tokens (CSS vars) — colors, type, radii, shadows, spacing |
| `assets/sample-chips/` | Real captured SIM-card photos (for thumbnails / lightbox) |
| `assets/wordmark.html` | The "✂️ ChipCut" wordmark reproduction |
| `preview/` | Design-system cards shown in the Design System tab |
| `ui_kits/chipcut/` | High-fidelity recreation of the ChipCut web app (login → dashboard → lotes → review → capture) |

### Fonts & icons
- **Inter** and **Bootstrap Icons** are loaded from CDN by the real app, so no
  font files are vendored here. If you need offline copies, pull Inter from
  Google Fonts and Bootstrap Icons from its release — both are the exact families
  the product uses (no substitution was required).
