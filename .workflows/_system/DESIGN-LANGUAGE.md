# DESIGN-LANGUAGE.md — the site's visual single source of truth

Extracted verbatim from the live host app **`vlbi-react/css/app.css`** `:root` and rendered UI
(screenshot: tour CLOSED). This file governs the tour's chrome/type/color/spacing. It is to visuals
what `tourPhysics.js` is to numbers. Where the frontend-design skill's generic taste differs, **this
file wins** — the site is deliberately restrained.

> Authority note: the tour's host is **vlbi-react** (the app the tour launches from). The root
> `css/style.css` is a SEPARATE older applet with a different blue theme (`--accent #00aaff`,
> `--bg #0d0d1a`) — NOT the reference. Conform to vlbi-react only.

---

## 1. COLOR (verbatim `:root` tokens)

| Token | Hex | Role / where used |
|---|---|---|
| `--bg-0` | `#000000` | deepest background (app body) |
| `--bg-1` | `#0a0a0a` | base surface / canvas backdrop |
| `--bg-2` | `#111111` | panel fill |
| `--bg-3` | `#1a1a1a` | raised surface / hover fill |
| `--border` | `#2d2200` | flat hairline (dark olive-amber) — ALL panel/control borders |
| `--accent-teal` / `--accent-blue` | **`#C4A555`** | THE accent (muted gold). One accent for the whole UI. |
| `--accent-amber` | `#9E7E38` | secondary bronze/amber |
| `--accent-orange` | `#ff9f43` | warm highlight (e.g. reconstruction ring glow) |
| `--text-primary` | `#e8e8f0` | primary text |
| `--text-secondary` | `#8888b0` | labels, captions, muted text |
| `--danger` | `#ff6b6b` | error/negative |
| `--success` | `#55efc4` | success/positive (used sparingly) |

The rendered globe is a realistic **blue-ocean / brown-land Earth** — so a cool/blue tone is
legitimately on-brand *for the Earth specifically* (it is the app's own globe), not a free license
for cyan UI.

## 2. TYPOGRAPHY

- `--font: 'Inter', system-ui, sans-serif` — **only Inter is loaded** (`index.html`, weights 300–700).
- `--font-mono: 'JetBrains Mono', monospace` — declared but NOT loaded → resolves to system monospace.
  Use this stack for numeric/equation text (matches the app's intent).
- **No serif anywhere.** (The tour's Georgia is foreign.)
- Size scale (px; bumps at `[data-font-size=medium|large]`): `--fs-2xs 9 · --fs-xs 10 · --fs-sm 11 ·
  --fs-base 12 · --fs-md 13 · --fs-lg 14 · --fs-xl 16`.
- **Label treatment (canonical — `.panel-section h2`):** `--fs-sm` (11px), `text-transform:uppercase`,
  `letter-spacing:0.08em`, `color:var(--text-secondary)`, `font-weight:600`. Headings: weight 700,
  letter-spacing 0.02em. Captions: `--fs-xs`, `--text-secondary`.

## 3. SPACING & RHYTHM

Steps of **2 / 4 / 6 / 8 / 10 / 12 / 16 px**. Common: `gap:6px` (most), `gap:4px/8px`; panel padding
`12px 16px`; pill padding `2px 8px`; control padding `8px 12px`; section bottom margins `4/8/10/12px`.

## 4. SHAPE

- Border-radius: **4px** (canvases/inputs/uv-canvas), 5px, 6px (gallery/controls), **10px** (modal only).
  Small radii — the tour's 14/16 are too round.
- Borders: **`1px solid var(--border)`** everywhere. Flat.
- Elevation: **panels are FLAT — no shadow.** Only `.modal` uses `box-shadow:0 20px 60px rgba(0,0,0,.6)`.
  No glassy sheen, no glow on chrome.

## 5. MOTION

`transition: … 150ms ease` (color / background / border-color). Reduced-motion → `0.01ms`. Quiet.

## 6. VOICE (the tiebreaker)

Restrained, warm-neutral **dark** UI built on near-black neutrals with a **single muted-gold accent
(`#C4A555`)** and a darker amber/orange supporting it. Flat surfaces, quiet 1px olive-amber hairlines,
small uppercase letter-spaced labels in muted grey, Inter throughout, **no serif, no glassy glow on
chrome**, generous negative space, 150ms transitions. It reads as a precise scientific instrument,
not a sci-fi dashboard. When a token choice is ambiguous, choose the quieter, flatter, more
neutral option.

## Accessibility (the tour should respect these too)

`[data-high-contrast]` remaps `--accent-teal/-blue → #ffd700`, `--border → #555`, `--text-secondary
→ #ccc`. `[data-font-size]` scales the `--fs-*`. **Reading these tokens at runtime via
`getComputedStyle` (the planned `tourTokens.js`) means the tour automatically follows high-contrast
and font-size changes — a strong reason to read vars, not hardcode.**

---

## TOUR-DELTA — where the current tour violates the language

**Global / shared (TourDiagram.js constants + tour.css):**
- `BG #02020a` (blue-black) → must be `--bg-1 #0a0a0a` (neutral).
- `GOLD #ffd166` (bright yellow) → no such token; map to accent `#C4A555`.
- `TEAL #06d6a0`, `BLUE #4cc9f0` (saturated) → site maps both to `#C4A555`; structural use → accent,
  cool/Earth use → one restrained slate (licensed, Phase B).
- `RED #ff3311` → `--danger #ff6b6b` (softer).
- `AM #C4A555` ✓, `GLOW #ff9f43` ✓ (=orange), `DIM #8888b0` ✓ (=text-secondary) — already match.
- `drawDerivationPanel`: glassy (drop-shadow + white sheen + radius 14) → flat `--bg-2/3` fill, `1px
  solid --border`, radius 6, no shadow/sheen.
- Georgia **serif** (panel symbol lines, axis labels) → Inter / `--font-mono`. Courier mono → `--font-mono`.
- `drawConceptTag`: accent-colored → should be `--text-secondary`, uppercase, `letter-spacing 0.08em`,
  `--fs-sm`, weight 600 (the app's label treatment).
- tour.css `.tour-equation-block`: `rgba(255,215,0,.06)` + `#FFD700` + Courier + `border-left #FFD700`
  → site panel: `var(--bg-2)`, `1px solid var(--border)`, radius 4, `#C4A555`, `--font-mono`.
- tour.css `.tour-cinematic background:#010103` → `var(--bg-1)`; stray `border-radius:16px` → 6.

**Per-act scene art (recolor to the family; keep pass-2 composition):**
- d01: red/teal beams + bright sources → orange (warm beam) vs accent (resolved); UNRESOLVED `--danger`.
- d02: blue dish + saturated wavefront → accent/cool; UV point accent.
- d03: blue/amber stations, teal ellipse → accent + amber; Earth keeps realistic blue (on-brand).
- d04: gold/blue stations + `#2a2200` map border → accent/amber + `--border`; ocean neutral-cool.
- d05: `#7070a0` sidelobes / `GLOW` smear / gold ring → neutral-grey sidelobes + orange/accent ring.
- d06: title `#ffd166`/gold glow → accent; (provenance already plain). 
- d07: orange satellite + gold orbit + blue stations → orange (sat) + accent (orbit) + amber/cool.
- d08: bright-gold rings + `#9E7E38` already → accent/orange ring family; FITS Courier → `--font-mono`.
- Nebulae (`drawNebulae`): candy purple/magenta/cyan → desaturated neutral + faint accent/cool wash.
- Stars: keep (white/warm points read as space; fine).

**Already compliant:** TourCard buttons (`#C4A555`, `var(--font)`); no HUD frames (pass-2); concept-tag
copy is quiet (only its color/spacing needs the label treatment).

---

## PHASE B — CONFORM vs LICENSED DIVERGENCE (signed off: MODERATE scene palette)

**CONFORM — must be indistinguishable from the app:**
- Color SYSTEM: accent = `#C4A555` exactly; amber `#9E7E38`; orange `#ff9f43`; text `#e8e8f0` /
  `#8888b0`; danger `#ff6b6b`; surfaces `--bg-1/2/3`; hairline `--border #2d2200`.
- Typography: Inter for all text; `--font-mono` for numeric/equations; **no serif**; label treatment
  (uppercase, 0.08em, fs-sm, text-secondary, 600) for concept tags + panel titles.
- Shape: radius 4–6px; flat 1px `--border`; **no shadow/sheen/glow on chrome**.
- Chrome surfaces: derivation panels, d07 integrity panel, d08 FITS/metrics panels, the text panel
  (TourCard), buttons, CTA, labels — all read as **site panels**, not sci-fi cards.
- Spacing rhythm + 150ms ease motion.

**LICENSED DIVERGENCE — cinematic, but palette derives from the site family (MODERATE):**
- Full-bleed dark canvas (`--bg-1`), the scene ART (dishes, Earth, rings, beams, nebulae, stars),
  and motion stay expressive and deep.
- BUT their colors derive from {neutral darks + `#C4A555` accent + `#9E7E38` amber + `#ff9f43`
  orange + `#ff6b6b` danger} plus **ONE restrained cool tone** `#3a4a6a` (deep slate) for
  space/cold/Earth-night — never candy cyan/teal/bright-gold. Keep glow/depth via opacity & value,
  not saturated hue. The Earth may use realistic blue (it matches the app's own globe).
- Net: the tour's CONTENT is cinematic; its CHROME, TYPE, COLOR SYSTEM, SPACING are the app's.

---

## FINAL-PASS LICENSES (2026-06-12 — spec `.workflows/_prompts/tour-final-pass-fable.md` overrides Phase B in two places)

1. **Tour galaxy (tourGalaxy.js):** licensed multi-hue deep-space nebula —
   slate `#4a5e8a` → indigo `#46549e` → violet `#6a4a9e` → teal `#3a7a7e` → faint
   magenta `#7a4472` + amber `#B8924A` — value-controlled (core stops 0.38–0.50 ×
   breath × per-act intensity ⇒ effective ~0.10–0.18), gold data layer remains the
   brightest/sharpest element in every act (vision-verified). Supersedes the single
   slate-cool rule FOR THE GALAXY ONLY.
2. **Act E coverage arcs (sceneE.js):** ground arcs use the APP'S own per-pair
   TELESCOPE_COLORS blends (S1.6: the viewer must connect arcs to stations exactly as
   in the main app). Space class stays fixed orange; gold remains reserved for data.
   A drawLegend panel maps colour → station.
Do not "fix" either back to Phase B in a future conformance pass.
