# Custom-Regime Audit — 2026-07-21 (READ-ONLY findings)

**Base:** `main @ c5331da` · **Scope:** vlbi-react/ only · **This pass changed no behavior.**
Prompted by two shipped numbers that don't reconcile (guided moment 24.7→6.8 μas vs sweep-table
beam 10.5→2.9 μas). Six checks, all **measured** — real worker via `simCore.runReconstruction`,
fresh never-used port 8329, the point-spread function measured directly from a point source.

**Integrity re-verified after all measurements:** `worker.js` diff EMPTY · ring/BH hashes
CLEAN `2154452775` / Dirty `1389367993` unchanged (round-trip verified) · no source file modified.

## Summary

| Check | Expected | Observed | Verdict |
|---|---|---|---|
| 1 — is the Custom "24.7" computed or inherited? | must move with dec + array | 24.7 @12.4° → **27.0 @−45°**; EHT 2022 24.7 → **ngEHT 21.2** | **CLEAN** — computed live |
| 2 — beam sigma/HWHM vs FWHM | Beam FWHM ≈ λ/B (~24.7) | displayed "Beam FWHM" **10.3 μas = the HWHM = ½ the true FWHM (20.5)** | **DEFECT** (pre-existing) |
| 3 — ΔNCC at the shipped 350 | doc's +0.044 | **+0.034** @350 (0% aliased); +0.044 was measured @**300** | **CLEAN** + doc-accuracy note |
| 4 — why 350 and not 300? | a documented reason | none; 300 had the larger delta | **UNDOCUMENTED** |
| 5 — does the seal caveat reach an uploader? | in-UI honesty | docs only; the guide promises "watch it resolve" for every image | **DEFECT** (honesty gap) |
| 6 — is the aliasing caveat silent at 350? | quiet at the default | silent; 1,410 μas below the 1,760 ceiling | **CLEAN** |

---

## CHECK 1 — the Custom-regime "24.7 μas" is COMPUTED, not inherited (hypothesis a)

**Call chain (static):** header stat + MetricsPanel "Resolution" → `angularRes` (useSimulation.js:268)
→ `angularResFromUV(uvPointsGl)` (simCore.js:187) → `206.265 / maxGl` = λ/B_max, where `uvPointsGl`
comes from `computeUVPointsGl` with elevation filtering (`computeElevation >= MIN_ELEVATION_RAD`).
So it is derived live from the Custom regime's own station set + declination + elevation filter —
hypothesis (d) "geometric max across all stations" is ruled out at source (the filter is applied).

**Empirical (must move if computed):**

| sweep | values |
|---|---|
| declination (EHT 2022) | 24.7 μas @12.391° · **27.0 μas @−45°** · 24.7 μas @60° |
| array (dec 12.391°) | EHT 2017 24.7 · EHT 2022 24.7 · **ngEHT 21.2** |

It moves with both → **not hardcoded, not inherited**. The 24.7 in Custom is a genuine coincidence:
IRAM–JCMT (10,883 km) is the limiting M87*-observing baseline in **both** EHT 2017 and EHT 2022 at
dec 12.391°, so both arrays yield 24.7; ngEHT adds a longer one (→ 21.2), and dec −45° changes the
elevation-filtered set (→ 27.0). **Falsification test passed.**

*Observation (not a defect):* the Custom regime inherits the previous target's **declination**
(12.391° = M87*'s) because `handleTargetChange('Custom')` seeds FOV/array but leaves dec. Declination
is a user-adjustable coverage parameter (not a property of an uploaded image), so this is defensible —
but it is why the default Custom view reads exactly 24.7.

---

## CHECK 2 — DEFECT: the "Beam FWHM" number is actually the HWHM (½ the true FWHM)

**Call chain (static):** MetricsPanel "Beam FWHM" (MetricsPanel.js:24) = `beamFwhm.major`
(useSimulation.js:334) = `sigmaU · 2.355 · (fov/N)` (simCore.js:175). `sigmaU` = worker
`beamSigmaU = max(1.5, halfWidthU / 2.355)` (worker.js:307). `halfWidthU` scans **from the PSF peak
to the first half-max point** (worker.js:298–302) — i.e. the **half-width at half-maximum (HWHM)** —
even though the comment at worker.js:295 calls it "dirty-beam FWHM". The two 2.355 factors cancel:

> displayed "Beam FWHM" = (HWHM / 2.355) · 2.355 · pixelScale = **HWHM · pixelScale**.

**Empirical (point source at center → dirty image = the PSF; EHT 2022 @ 350 μas, dec 12.391°):**

| quantity | value |
|---|---|
| worker `halfWidthU` (= `beamSigmaU` · 2.355) | 15 px |
| **independently-measured PSF HWHM** | **15 px** — matches, confirming `halfWidthU` is the HWHM |
| measured true PSF FWHM (= 2 · HWHM) | 30 px = **20.5 μas** |
| **displayed "Beam FWHM"** | **10.25 μas** — equals the HWHM, *not* the FWHM |
| angularRes (λ/B) | 24.7 μas |

So the beam is understated by a factor of exactly **2.0** (HWHM shown where FWHM is claimed). The
original report's "sigma→FWHM 2.355" framing is close but imprecise: 24.7 / 10.3 = 2.4 =
2.0 (the HWHM defect) × 1.20 (λ/B 24.7 ÷ true-FWHM 20.5). The true beam FWHM (20.5) is within ~20% of
λ/B (24.7), as physics requires; the *displayed* value is half of that.

**Alternative hypotheses, ruled out:**
- *Frequency not 230 GHz?* No — `DEFAULT_CONTROLS.frequency = 230` (useSimulation.js:19), kept in Custom.
- *Only the prose called a sigma a beam?* No — MetricsPanel **labels** it "Beam FWHM"; the value isn't
  even a sigma, it's the HWHM.
- *Sweep-table row measured on a different config?* No — it is `beamFwhm(worker σ)` at the stated config
  (doc's 10.5 vs this 10.25: same quantity, minor config/rounding difference).

**Two coupled consequences of the single root line (worker.js:307):**
- **(display)** every "Beam FWHM" consumer is ~2× too small / resolution ~2× too optimistic:
  MetricsPanel.js:24; ResolutionBudget beam + N_res (the panel's "resolves about **31** elements" is
  ~2× too high — the true count at this config is ~15); ContourMap beam-ellipse glyph (simRender.js:332);
  `fitsExport.js:12` BMAJ/BMIN in exported FITS.
- **(reconstruction — FROZEN)** the CLEAN restore beam is built with `beamSigmaU = σ_true / 2`
  (worker.js:310–322), so it is **2× too narrow** → CLEAN restores detail finer than the data support.
  This is baked into the ring hash `2154452775`.

**Smoking gun (see `audit-assets/audit-simultaneous-display.png`):** one Image Metrics panel shows
`MAX BASELINE 10883 km / 8.3 Gλ` and `RESOLUTION 24.7 μas` (mutually consistent — 24.7 = 206.265/8.3)
right next to `BEAM FWHM 10.3 × 11.6 μas`. A 10.3 μas beam would require ~20 Gλ — 2.4× the max
baseline the *same panel* reports. A physicist reading this will spot it immediately.

**Provenance:** pre-existing since S4 (decisions.md, elliptical restore beam, 2026-04-23). The
guided-moment pass merely placed "Beam FWHM 10.3" and "Resolution 24.7" side by side, surfacing it.

---

## CHECK 3 — ΔNCC at the shipped 350 μas (CLEAN, with a doc-accuracy note)

Resolution Target, EHT 2022 @ 350 μas, real worker: ground-only NCC **0.723** → BHEX-on **0.758** =
**ΔNCC +0.034**, BHEX **0% aliased** (on-grid). The window genuinely works at the shipped default.
However, CUSTOM-SOURCE-PHYSICS.md's headline **+0.044 was measured at 300 μas**, not 350 — the
documented figure does not describe the shipped default (which is +0.034).

---

## CHECK 4 — UNDOCUMENTED: no rationale for 350 over 300

`CUSTOM_DEFAULT_FOV_UAS = 350` (constants.js). The docs describe the window as a **range**
("EHT 2022 @ ~300–350 μas") and the constant's comment says "at ~350 μas" — but nothing (constant
comment, commit bodies `eef4dcd..f6eb5e4`, decisions.md, CUSTOM-SOURCE-PHYSICS.md) justifies choosing
**350 specifically**, and **300 had the larger measured delta** (+0.044 vs +0.035/+0.034). The
specific default value is an undocumented constant.

---

## CHECK 5 — DEFECT: the content-dependence caveat never reaches an uploader

Upload path: `handleFileUpload` → `handleTargetChange('Custom')` → the ResolutionBudget guided moment.
The only resolution-related copy a user sees on upload is the guide, verbatim:

> "This Earth-sized array leaves fine detail **unresolved** at this scale. Add the space baseline —
> **BHEX** — below and watch the finer structure resolve."

This is an implied promise ("watch the finer structure resolve") that holds for the bold Resolution
Target but **not** for a detailed logo/photo — the last pass measured that the WFU seal shows only a
modest, speckly BHEX refinement (ΔNCC ≈ +0.015) because it needs *coverage*, not *resolution*. That
finding lives only in CUSTOM-SOURCE-PHYSICS.md / decisions.md; **no in-surface string** conveys it to
someone who uploads their own image and sees the demo's clean resolve as the implied outcome.

---

## CHECK 6 — CLEAN: the aliasing caveat is correctly silent at the default

`CUSTOM_DEFAULT_FOV_UAS` 350 ≤ `BHEX_ONGRID_CEILING_UAS` 1760 (margin **1,410 μas**); BHEX **0% aliased**
at 350; live check — `.res-budget-note-warn` is absent at the default and the guide is present. It fires
correctly above the ceiling (G3, verified the prior pass). A caveat that always fires would be as useless
as one that never does; this one is quiet at the default and speaks above the ceiling.

---

## Fixes — DESCRIBED, NOT APPLIED

- **CHECK 2 (primary):** `worker.js:307–308` `halfWidthU / 2.355` → `halfWidthU / 1.1774`
  (correct HWHM→σ; 1.1774 = √(2 ln 2) = 2.355/2). ⚠ This changes `beamSigmaU` → the CLEAN restore beam
  → **breaks the frozen ring hash `2154452775`**; needs re-baseline + Alejandro sign-off. It is the
  physics-correct fix (both the reconstruction *and* every display become right).
  *Display-only alternative:* multiply the output of `simCore.beamFwhm` by 2 — fixes the label
  everywhere (MetricsPanel, ResolutionBudget, ellipse, FITS) and leaves the frozen reconstruction
  untouched, but then the displayed FWHM no longer equals the (too-narrow) restore beam's actual FWHM.
  **Decision for Ilan/Alejandro** — fix the physics (restore beam) or only the label.
- **CHECK 5:** add one honest line to the custom/upload surface (e.g. in ResolutionBudget), such as:
  "Bold, simple shapes resolve most clearly; fine detail may stay soft — it needs more ground stations,
  not just BHEX."
- **CHECK 4:** document the 350-vs-300 rationale in the constant comment / doc, or change the default to 300.
- **CHECK 3:** correct CUSTOM-SOURCE-PHYSICS.md so the shipped-default figure (+0.034 @350 μas) is stated
  alongside the +0.044 @300 μas window peak.
