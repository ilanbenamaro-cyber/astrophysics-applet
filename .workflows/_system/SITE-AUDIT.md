# SITE-AUDIT.md — full site audit, final pass (2026-06-12)

> Produced during the tour final pass (`.workflows/_prompts/tour-final-pass-fable.md` Stage 3).
> Method: live console/network/responsive/perf probes on a fresh-port no-cache server
> (Playwright, viewports 1440×900 / 1280×800 / 1024×768) + grep sweeps of `vlbi-react/`.
> Format: `[severity] [fix|flag] [file:line]` — all FIX items are resolved in commits 8–10
> of this pass; FLAG items need a human decision.
> Note: planned parallel audit sub-agents were unavailable (account subagent spend limit);
> this audit was run inline by the main session. Coverage of §3.3 is the three viewports
> above — a true 4K projector pass remains a HUMAN TODO alongside the existing
> projector-timing gate (gotchas.md).

## 3.1 Physics integrity

- [HIGH] [fix] [useSimulation.js:123–129 + ControlsPanel.js:107–110] The live-app sidebar
  says "Source: 42 μas (52.5% of FOV)" assuming the source RING fills the image frame.
  black-hole.png's ring spans only ~42.6% of its frame, so the displayed/reconstructed
  ring is ~2.3× undersized (~18 μas labeled 42 μas) — the exact bug the tour fixed with
  measureRingFraction (tourScene.js:26). FIX: ring-fraction-corrected
  `effectiveSourceFraction` (commit 8, user-approved with pre-commit pause; changes
  reconstruction input for named targets — that is the point).
- [MEDIUM] [fix] [constants.js:112] `sourceSize` info tooltip repeats the ring-fills-frame
  assumption ("The source occupies shadowUas / FOV of the image diameter"). FIX with 3.1
  (commit 8).
- [OK] tour ↔ tourPhysics single-sourcing verified: all 19 `P.*` references in
  tourActs.js resolve; 10,883 km / 25 μas / 42 μas / 2√27 / single BHEX hedge intact.

## 3.2 Console errors / CDN

All console errors app-wide trace to four sources (verified across app load, tour, all
five acts, compare mode, 5× tour open/close):

- [HIGH] [fix] [Globe.js:103] Clouds texture from unpkg.com → CORS-blocked (unpkg sends no
  ACAO header on redirects — known gotcha). 2 console errors per globe instantiation.
  FIX: jsdelivr URL (commit 9).
- [HIGH] [fix] [globeHelpers.js:75] Specular map `three@0.163.0/examples/textures/planets/
  earth_specular_2048.jpg` → 404 (that path does not exist in three 0.163). Fires on main
  globe AND tourEarth. FIX: remove the load cleanly (no working CDN equivalent in the
  pinned three-globe/three versions; ocean glint loss is imperceptible — screenshot-
  compared) (commit 9).
- [LOW] [fix] [index.html] favicon.ico 404 on every load. FIX: inline data-URI favicon
  link (commit 9).
- [LOW] [flag] [globeHelpers.js:63] Bump map also loads from unpkg WITHOUT crossOrigin —
  plain <img>-style texture load currently succeeds (no CORS needed for WebGL upload via
  TextureLoader? it sets crossOrigin='anonymous' internally in three — verify). No console
  error observed today; swap to jsdelivr opportunistically in commit 9 since the clouds
  fix touches the adjacent line.

## 3.3 Responsive

- [OK] 1440×900, 1280×800, 1024×768: tour text panel scrolls with pinned equation fully in
  view (incl. Act E hedge row); Act B controls collision-free at 1024×768; app shell grid
  intact at all three.
- [FLAG] True 4K (3840×2160) and the projector laptop not exercised in this environment —
  HUMAN TODO with the projector timing gate.

## 3.4 Design language

- [MEDIUM] [fix] [ImageCanvas.js:15, simRender.js:166] Canvas backdrop `#0a0a20`
  (blue-purple, off-token) → `--bg-1` neutral `#0a0a0a` (commit 9).
- [MEDIUM] [fix] [UVMap.js:19] Backdrop `#070718` (off-token) → `#0a0a0a` (commit 9).
- [LOW] [flag] [css/app.css:603–604] `.bhex-button` uses literal `#FFD700` (matches
  BHEX_PRESET.color, constants.js:86). Deliberate BHEX branding in the MAIN APP (the
  tour's gold reservation does not govern the app chrome) — left as-is; flag for a future
  token (`--bhex-gold`) if BHEX UI grows.
- [NOTE] Final-pass licensed divergences (recorded in decisions.md, commit 10): tour
  galaxy multi-hue palette beyond DESIGN-LANGUAGE Phase B's single slate; Act E arcs use
  the app's saturated TELESCOPE_COLORS (spec S1.6 explicitly requires matching the app).

## 3.5 Accessibility

- [MEDIUM] [fix] [Tour.js] `role="dialog" aria-modal="true"` without a focus trap: Tab
  escapes into the app behind the overlay. FIX: focus container on mount, trap Tab/
  Shift+Tab within the overlay, restore the previously-focused element on close
  (commit 9).
- [LOW] [fix] [css/tour.css] No :focus-visible styles on .tour-nav-btn / .tour-skip /
  mode toggle. FIX: app-pattern outline (commit 9).
- [LOW] [flag] Act B/C canvas slider controls have no keyboard alternative (canvas
  hit-testing only). Tour keyboard covers navigation (←/→/Esc/P) but not the in-scene
  controls. Acceptable for the talk; a future pass could map ↑/↓ to the focused act's
  primary control.
- [LOW] [flag] `--text-secondary #8888b0` on `--bg-1` ≈ 4.7:1 — passes WCAG AA for normal
  text with little margin; high-contrast mode remaps it to #ccc. No change.
- [OK] reduced-motion: app-wide CSS kill switch (app.css:49–53); tour renders final static
  frames, RAF never starts; galaxy static at T=0.

## 3.6 Performance

- [OK] 5× tour open/close on one page: zero WebGL context warnings, no error accumulation
  → tourEarth singleton dispose/recreate does not leak.
- [OK] Act C CLEAN live recompute ≈ 100 ms class (drag feels live; one in flight,
  never-stall fallback).
- [FLAG] ⚠ HUMAN TODO (pre-existing, gotchas.md): re-run the CLEAN timing gate on the
  actual projector laptop; if > 300 ms switch presenter Act C to cached playback.

## 3.7 Dead code

- [MEDIUM] [fix] [worker.js:141–178] `gaussConvolve` defined, zero references (grep-
  verified) — remove (commit 10; G-APP re-verified after).
- [MEDIUM] [fix] [css/tour.css] ~80 orphan class selectors + their keyframes from the
  DELETED TourDiagram/TourCard tour (chapter-card, scrubber-reveal, sl-ring-1..5,
  station-dot/label-1..9, photon-ring, uv-draw-*, beam-*, fits-/metrics-/cta-reveal,
  lbl-/label-dirty/clean, …). Grep-verified: none of these class strings occur anywhere
  in js/. Remove the blocks (commit 10).
- [LOW] [fix] [tourScene.js:107–111] Retired-code tombstone comments — remove (commit 10).

## Quality-gate ledger (this pass)

| Gate | Status |
|---|---|
| G-VIBRANCE | PASS (5 acts screenshot-verified; gold layer dominant; squint test) |
| G-TEXT | PASS (scroll + pinned equation @1440×900, 1280×800; presenter 0 paragraphs) |
| G-EARTH-B | PASS (idle spin verified across frames; HA/dec drags live; resume verified) |
| G-NOISE-C | PASS (0/0.12/0.25 probe: crisp → degraded+DR/components falling → noise-limited) |
| G-PAIR-D | PASS (headers, photoZoom scale match, bridge, why-line, climax intact) |
| G-COLOR-E | PASS (station-colored arcs, legible legend, orange space class, 1 hedge) |
| G-DEPTH | PASS (post-galaxy review of all acts; no structural changes needed) |
| G-PHYSICS | commit 8 (pause-gated) |
| G-AUDIT | this file; fixes in commits 9–10 |
| G-PERF | PASS (no GL leak; live recompute) + projector HUMAN TODO |
| G-APP / G-CONTRACT | verified at Stage 0 + re-verified after commits 8–10 |

---

## ADDENDUM 2026-06-16 — Act B + Act C fix pass (diagnosis, G4)

**Act C "CLEAN looks broken / noise-limited" — ROOT CAUSE (not a regression).**
Empirical probe (replicated Act C's exact path via dynamic import, never-used port 8791,
EHT 2017 + black-hole.png, ring-sized to 42 μas, sizeFactor 1.233):

| noise ×RMS | 0 | 0.01 | 0.02 | 0.03 | 0.04 | 0.05 | 0.06 | 0.08 | 0.10 | 0.12 | 0.25 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CLEAN comps | 12 | 15 | 1 | 12 | 0 | 0 | 0 | 5 | 0 | 2 | 0 |
| DR | 100 | 100 | 100 | 100 | 100 | 100 | 100 | 100 | 100 | 100 | 100 |

Findings: (1) Vanilla Högbom with the worker's 3σ-border-RMS stop barely runs on
EHT-sparse coverage of a ring — only ~12 components even at noise 0 (the dirty image's
heavy sidelobe border sets a high stop floor). The restored image is therefore dominated
by dirty+residual, NOT the CLEAN model. (2) The injected thermal noise is a random
Gaussian realization per run, so the component count is erratic (12,15,1,12,0,0,0,5,0,2,0
— not monotonic) and frequently 0. The old UI surfaced this count + a "noise-limited"
label, so a working-but-modest reconstruction looked broken/flickering during the
live-drag. (3) `computeDynamicRange` saturates at the `maxV*0.01` fallback → DR = 100
exactly at every level (the sparse-coverage border MAD-σ exceeds maxV*0.1), so DR was an
uninformative readout. **Conclusion: NOT a recompute-path regression — CLEAN is correct;
the 3σ stop (CASA-standard, worker-internal, decisions.md — not touched) simply makes
Högbom inert on this source. Component-count and DR were the wrong proxies to surface.**
The restored IMAGE does degrade gracefully with noise (verified by rendering 0→0.10).

**Fix:** removed the noise slider, the residual sparkline (`drawResidualSparkline`
deleted from tourAnnotations.js — Act C was its only consumer), the "noise-limited"
readout, the DR-bar + component-count readouts, and the live-recompute-on-drag. Replaced
with three engine-honest σ presets `{0, 0.015, 0.03} × visibility RMS` (chosen from the
probe: each reliably shows a recognizable shadow/ring degrading visibly; none lands in the
blank/dead regime; verified in-act over two noise realizations). Each preset recomputes
via the real engine (own worker) and renders with drawHot; default opens on 0 σ. Worker
diff empty. **Act B** idle spin: replaced the quantized track[headIdx] lookup + eased
resume ramp (the jerk/slowness sources) with a continuous hour-angle clock (rate×dt,
±12 h wrap) so it spins smoothly like the main globe.

---

## ADDENDUM 2026-07-07 — Alejandro physics pass (5 authorized notes + fenced audit)

Spec: five P0 notes from Prof. Cárdenas-Avendaño (authority to change core behavior),
everything else diagnose/propose-only for physics. Instrument-first: all N3/N4 numbers
below were measured (Node probe on the pure modules, `probe-n3-n4.mjs`) BEFORE any change.

### N1 — UV map rescaled with BHEX [HIGH][fix][UVMap.js:23-30]
UVMap auto-scaled to the current coverage's radial max ×1.2, so the BHEX toggle rezoomed
the axes. FIX: `computeUVMaxExtentGl` (uvCompute.js) = extent of coverage AS IF BHEX were
present (telescopes ∪ BHEX_PRESET, radial max ×1.2) — toggle-invariant (measured 34.635 Gλ
with BHEX on AND off; 52.0 Gλ at 345 GHz — still physically responsive). Exposed as
`uvDisplayMaxGl` (useSimulation), passed to UVMap in App + SimPane.
Tour panels intentionally NOT changed: sceneB/C/E frame their own instruments via
`uvExtentGl` (fixed engineState → static frames), and sceneE already presents the N1
relationship (ground-limit ring inside the BHEX-extent frame). [FLAG][low] Act B/C panel
frames are Earth-scaled while the Act B fill gauge / Act C caption % is locked-frame
(see N3) — wording kept frame-agnostic; a future polish could sublabel the gauge.

### N3 — UV fill 0.0%/0.1% [HIGH][fix][uvCompute.js:181-190 old, useSimulation.js:114, tourPhysics.js:129-138]
MEASURED INTERMEDIATES (before change, EHT 2017 → M87*, 12 h, 230 GHz, FOV 80 μas, N=512):
7,298 samples → 27 unique cells of 262,144 (entire coverage inside a ±3.2 px disk; Gλ max
8.35 vs 660 Gλ Nyquist half-grid) → 0.0103% → displayed "0.0%". +BHEX: 9,828 samples →
271 cells → 0.1034% → "0.1%". ngEHT: 42,176 samples → 47 cells → 0.018%. ROOT CAUSE: the
metric gridded FOV-scaled pixel-space points on the full Nyquist grid — sub-pixel collapse
(the documented UV-display gotcha) applied to the fill; a rounding artifact, not coverage.
The tour's "0.010 %" was the SAME computation (not a divergence).
FIX (definition chosen by Ilan from measured candidates): `computeUVFillGl(ptsGl,
halfExtentGl, M=200)` — % of cells sampled on a fixed M×M grid spanning the N1-locked
frame, in Gλ. One frame for axes AND fill. Old computeUVFill removed (all 4 callers
switched: useSimulation, tourPhysics, sceneB, tourScenes genericScene).
MEASURED AFTER (locked frame 34.63 Gλ, M=200): EHT 2017 = 442 cells → 1.10%; +BHEX =
2,098 → 5.24%; EHT 2022 = 658 → 1.65%; ngEHT = 1,250 → 3.13%; Sgr A* 1.55%, 3C 279 1.19%,
Cen A 0.86%. Fill now grows with coverage and never jumps on toggle. App == tour verified
to machine precision for the same observation (TOUR_PHYSICS.uvFillPct = 1.1050 = app path).
Frozen anchors re-verified: 10,883 km / 25 μas / 42 μas.
