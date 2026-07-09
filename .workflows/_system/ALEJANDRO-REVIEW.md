# Physics Review — VLBI Simulator, Alejandro Pass (2026-07-07)

**For:** Prof. Alejandro Cárdenas-Avendaño
**From:** Ilan (implementation by Claude, instrument-first: every number below was
measured before anything was changed)
**Scope:** your five notes (N1–N5) as built, plus five proposals (P1–P5) found during
the pass. **P1, P4, and P5 need your explicit sign-off.** Nothing here is deployed —
the branch is held pending this review.

All settings below, unless stated otherwise: EHT 2017 (8 stations), M87*
(dec +12.391°), 12 h synthesis, 230 GHz (λ = 1.3 mm), FOV 80 μas, N = 512.

---

## PART A — The five notes, as built

### N1 — UV coverage map no longer rescales with BHEX
The map's axes previously auto-scaled to whatever coverage was drawn, so toggling BHEX
zoomed the whole frame. Now the axes are **fixed to the BHEX-enabled coverage extent**
computed whether or not BHEX is on: the code takes the current ground array ∪ the BHEX
preset, computes the full Gλ coverage, and locks the half-extent at (radial max × 1.2).

- Locked half-extent at the default configuration: **34.6 Gλ** — measured identical
  with BHEX on and off.
- The frame still responds to real physics (frequency: 34.6 → 52.0 Gλ at 345 GHz;
  declination/duration through the projection) — just never to the toggle.
- Earth-only coverage now renders small inside the fixed frame; adding BHEX fills it.
- Tour panels intentionally keep their own per-act framing (each act is a fixed
  instrument); Act E already draws the Earth-diameter limit ring inside the BHEX frame.
- Code: `vlbi-react/js/uvCompute.js:185` (computeUVMaxExtentGl),
  `useSimulation.js:211` (uvDisplayMaxGl), `UVMap.js:9,24`.

### N2 — BHEX on/off toggle
One labeled toggle ("BHEX Satellite: ON/OFF") in the sidebar and in each compare pane;
never disabled; default **OFF** (unchanged). Loading a different array preset now
**preserves** the BHEX state (previously any preset load silently deleted BHEX).
- Code: `useSimulation.js:271` (handleToggleBHEX), `:95` (preset preservation).

### N3 — UV fill % (this was the real computation bug)
**What was wrong (measured before the fix):** the fill gridded the FOV-scaled
*pixel-space* UV points onto the full 512² Nyquist grid. At 80 μas FOV that grid spans
±660 Gλ while the EHT spans ±8.35 Gλ — so all **7,298** samples collapsed into a
±3.2-pixel disk: **27 unique cells / 262,144 = 0.0103% → displayed "0.0%"**. With BHEX:
9,828 samples → 271 cells → "0.1%". ngEHT (17 stations, 42,176 samples) read 0.018% —
the metric could not distinguish arrays. It was a rounding artifact, not coverage.
(The tour's "0.010 %" was the same computation shown with more decimals.)

**What it is now:** fill = % of cells sampled on a fixed **200×200 grid in Gλ spanning
the N1-locked frame** — the axes and the fill share one frame by construction.
Ilan selected this definition from two measured candidates (see P5).

**Measured after (locked frame 34.63 Gλ, M = 200):**

| Configuration | cells sampled | fill |
|---|---|---|
| EHT 2017, M87* | 442 | **1.10 %** |
| EHT 2017 + BHEX | 2,098 | **5.24 %** |
| EHT 2022 | 658 | 1.65 % |
| ngEHT Phase 1 | 1,250 | 3.13 % |
| EHT 2017 → Sgr A* | 622 | 1.55 % |
| EHT 2017 → 3C 279 | 474 | 1.19 % |
| EHT 2017 → Cen A | 346 | 0.86 % |

The app and the tour now compute this through the same function — verified equal to
machine precision (1.1050 %).
- Code: `uvCompute.js:205` (computeUVFillGl), `useSimulation.js:221`,
  `tourPhysics.js:136`.

### N4 — target subsystem stress test (no defects in scope)
Per-target verification, analytic + live browser (full table in SITE-AUDIT.md,
"TARGET-STRESS-TEST"):

| Target | dec | excluded by 10° elevation | co-visible \|B\|max | θ = λ/B (co-vis) | θ from sampled UV |
|---|---|---|---|---|---|
| M87* | +12.391° | SPT | 10,883 km (IRAM–JCMT) | 24.7 μas | 24.7 μas |
| Sgr A* | −29.008° | none | 11,406 km (IRAM–SPT) | 23.6 μas | 23.6 μas |
| 3C 279 | −5.789° | SPT | 10,883 km (IRAM–JCMT) | 24.7 μas | 24.8 μas |
| Cen A | −43.019° | IRAM | 11,182 km (SMT–SPT) | 24.0 μas | 26.7 μas* |

\* Cen A's sampled-UV θ legitimately differs from the full-track co-visible value: the
SMT–SPT co-visibility window falls outside the ±6 h observation (12 h duration ⇒
HA ∈ [−6h, +6h]). Physics, not a bug. Also verified: edge declinations ±60°/±90° sane;
BHEX max ground–space baseline over the track = 39,291 km ≤ the 2R⊕+h bound
(39,304 km); every target reconstructs live with the correct declination readout and
zero console errors. Two defects found *outside* the notes were **not** fixed — they
are P1 and P2 below.

### N5 — default dish diameter = mean of the selected EHT version's dishes
Per-station dish data did not exist anywhere in the code (only SEFDs), so a table was
added — **these values need your confirmation (P4)**. The default dish is now the mean
physical dish of the selected preset's stations, recomputed on every preset change
(manual slider edits persist until then); with no EHT stations loaded (Clear All), the
default is the EHT 2022 mean, per your note.

- Defaults: **EHT 2017 → 18.1 m · EHT 2022 → 16.7 m · ngEHT Phase 1 → 15.6 m**
  (previously a flat 25 m). This widens the worker's primary-beam taper
  (FWHM = 1.02 λ/D) accordingly — the intended effect of the note.
- Tour acts that model the app's array (A, C, D) now use the computed EHT 2017 mean
  instead of a hardcoded 25.
- Code: `constants.js:73` (DISH_DIAMETERS), `simCore.js:207` (presetMeanDish).

---

## PART B — Proposals (nothing below was changed; current behavior ships as-is until you decide)

### P1 — displayed "Resolution" uses the geometric array max ⚠ NEEDS YOUR SIGN-OFF
- **Current:** the header stat and metrics panel compute θ = λ/B from the longest
  baseline between any two *placed* stations, ignoring whether they can co-observe the
  target. Result: **"24 μas" for every target** (from IRAM–SPT, 11,406 km — a pair
  that never sees M87* simultaneously). `simCore.js:185` (angularRes).
- **Proposed:** derive θ from the *actually sampled* coverage (λ / |uv|max of the
  computed tracks) — consistent with the UV map and the tour's own headline rule
  ("the geometric max is never shown as resolution").
- **The numbers:** M87* 24.7 μas · Sgr A* 23.6 · 3C 279 24.8 · Cen A 26.7 (vs the
  current flat 24).

### P2 — max-baseline stat samples the satellite at one instant
- **Current:** the StatusBar/metrics "Max Baseline" evaluates the BHEX ground–space
  distance only at hour angle 0. With BHEX on it currently reads ~33,500 km.
  `useSimulation.js:229,244`.
- **Proposed:** take the maximum over the full observed track.
- **The numbers:** true track max = **39,291 km (30.1 Gλ)** vs the H=0 snapshot —
  an ~15% understatement of the space baseline.

### P3 — worker's leftover 25 m default (latent only)
- **Current:** `worker.js:142` destructures `dishDiameter = 25` as a fallback. Every
  caller passes the real value, so it is unreachable today; it was left untouched to
  keep the worker diff at zero for this pass.
- **Proposed:** at the next authorized worker change, remove the numeric default so a
  future caller that forgets the parameter fails loudly instead of silently using the
  pre-N5 taper.

### P4 — the DISH_DIAMETERS table ⚠ NEEDS YOUR SIGN-OFF (values, not mechanism)
Physical single-dish diameters, in meters. For phased stations (ALMA, SMA, NOEMA) the
**element** dish is used, on the reasoning that the primary-beam FOV modeled by the
worker's θ ≈ λ/D taper is set per element, not by the phased sum — please confirm
that convention too.

| Station | D (m) | Basis |
|---|---|---|
| ALMA | 12 | phased-array element dish (EHT 2019 Paper II) |
| APEX | 12 | EHT 2019 Paper II |
| SMA | 6 | phased element dish |
| LMT | 50 | full aperture (2017 ops used ~32.5 m illuminated — flag if you prefer that) |
| IRAM 30m | 30 | — |
| SMT | 10 | — |
| SPT | 10 | full aperture (2017 used ~6 m illuminated — same question as LMT) |
| JCMT | 15 | — |
| GLT | 12 | — |
| NOEMA | 15 | phased element dish |
| KP12m | 12 | — |
| OVRO | 10.4 | Leighton telescope (ngEHT Reference Array, arXiv:2306.08787) |
| HAY | 37 | Haystack (arXiv:2306.08787) |
| GAM | 15 | Africa Millimetre Telescope (arXiv:2306.08787) |
| BAJA / CNI / SGO | 6.1 | refurbished BIMA dishes (arXiv:2306.08787) |
| BHEX | 3.4 | mission concept (already in BHEX_PRESET) |

Resulting preset means (what the default dish becomes): 18.1 / 16.7 / 15.6 m.
The table carries a `⚠ PENDING` comment in `constants.js:73` until you confirm.

### P5 — the fill definition itself ⚠ NEEDS YOUR SIGN-OFF
Two physically defensible definitions were measured; Ilan chose (a). Please confirm
or override:

- **(a) Locked-frame grid — implemented.** % of cells sampled on a 200×200 Gλ grid
  spanning the fixed BHEX-enabled frame. EHT 2017 → 1.10%, +BHEX → 5.24%. The number
  grows when coverage grows and shares the map's axes. (Grid resolution M = 200 is a
  display choice — say the word if you prefer another M or a disk denominator.)
- **(b) Own-aperture disk at the natural cell size Δu = 1/FOV.** "How completely does
  the array sample its own aperture at this FOV's resolution": EHT 2017 → 82%
  (27 of 33 cells), +BHEX → 69%. Rigorous, but the percentage *drops* when BHEX is
  added (bigger disk), which reads backwards in the UI.

---

## Where to look
- Branch `feature/alejandro-physics-pass` (7 commits, c5dc4ad..c490521) — not merged,
  not deployed.
- Full measured evidence + audit trail: `.workflows/_system/SITE-AUDIT.md`
  (ADDENDUM 2026-07-07: N1/N3 intermediates, TARGET-STRESS-TEST, Stage-2 findings).
- Frozen anchors re-verified intact throughout: 10,883 km / 25 μas (M87*-observing
  headline), 42 μas shadow, 2√27 diameter formula, BHEX "B ~ R⊕ + h, pending
  sign-off" hedge.
