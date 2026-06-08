# TOUR-AUDIT.md — Phase A Diagnosis (pre-overhaul)

Audit of `vlbi-react/js/TourDiagram.js` (Canvas 2D, d01–d08) against four questions per act:
(1) FLAT? (2) wrong/asserted physics? (3) numbers consistent with the live tool? (4) blank-space %.

Frame = 1200×700 visual area. Canonical formulas (the ground truth tour numbers must match):
- θ = λ/B and θ = λ/D, **no 1.22 factor** — `useSimulation.js:224-225`
- primary beam FWHM = 1.02 λ/D — `worker.js:188-191`
- u,v from TMS eq 4.1 — `uvCompute.js:34-39`; baseline from ECEF — `uvCompute.js:4-18`
- DR = maxV / (1.4826·MAD of outer-10% border) — `useSimulation.js:259-280`

---

## Per-act diagnosis

### d01 — The Resolution Problem
- **FLAT:** No. Good depth (terrain, shaded dishes, glows, star layers).
- **PHYSICS:** **Missing entirely.** No θ=λ/D, no θ=λ/B, no improvement factor. The act's whole
  thesis (single dish can't resolve; interferometer can) is shown only as blurry-vs-sharp blobs,
  never quantified. This is the single biggest pedagogical gap in the tour.
- **CONSISTENCY:** N/A — nothing displayed.
- **BLANK:** ~35% (acceptable), but the open quadrants beg for the derivation panel.

### d02 — The Baseline
- **FLAT:** Partly. Two ground dishes + flat UV panel; shallow.
- **PHYSICS:** `τ_g` labeled but no defining equation. **No van Cittert–Zernike** (the heart of
  the tour). **No u=B/λ derivation.** `'B = 10,900 km'` is a hardcoded literal (line ~543).
- **CONSISTENCY:** B is asserted, not computed from `ARRAY_PRESETS`.
- **BLANK:** ~50% — worst-tied. Large dead band above the dishes and beside the UV panel.

### d03 — Earth-Rotation Synthesis
- **FLAT:** No. Earth sphere + UV panel separate well; rings give depth.
- **PHYSICS:** Shows `'One baseline → one elliptical arc'` but **no u,v(H,δ) equations**, no
  ellipse-center label `v=B_Z cosδ/λ`. The "why an ellipse" is unexplained.
- **CONSISTENCY:** No numbers shown; arcs are decorative, not parameterized.
- **BLANK:** ~40%.

### d04 — The EHT Array
- **FLAT:** Yes — flat 2D map + grid.
- **PHYSICS / CONSISTENCY:** **WRONG.** Footer reads `'… θ_synth ≈ 20 μas …'` (line ~843); the
  canonical EHT 2017 value is **~25 μas** (and Act 1's intended payoff). Tour contradicts itself
  across acts. `'SEFD: 94 Jy'` is hardcoded (matches `STATION_SEFD.ALMA` by luck, not by read).
- **CONSISTENCY:** Station coords *are* projected from real lon/lat (good), but baseline/resolution
  are asserted strings.
- **BLANK:** ~25% (map fills well).

### d05 — From Noise to Image
- **FLAT:** No. Strong radial depth (nested rings, photon ring, shadow).
- **PHYSICS:** Shows `'I^C = (M ⊛ G) + r_final'` (good) but **no "dirty = sky ⊛ dirty beam"**, no
  CLEAN step captions, **no b_c=√27 GM/c²**, no 42 μas shadow number. Transformation reads as a
  crossfade, not a causal deconvolution.
- **CONSISTENCY:** No shadow number shown (should be `SKY_TARGETS['M87*'].shadowUas = 42`).
- **BLANK:** ~45% — second-worst. Center ring floats in a void; corners empty.

### d06 — First Light
- **FLAT:** No (real photograph).
- **PHYSICS:** `'42 μas'`, `'M87* · April 10, 2019'`, citation — all hardcoded; **mass 6.5×10⁹ M☉
  missing**; the ±3 μas uncertainty missing.
- **CONSISTENCY:** 42 μas hardcoded, not from `SKY_TARGETS`.
- **BLANK:** ~20% but the right margin beside the image is dead (no scale context).

### d07 — Beyond Earth (BHEX)
- **FLAT:** No. Best depth in the tour (3-layer parallax stars, orbit, satellite).
- **PHYSICS:** **INTEGRITY VIOLATION.** `'~32,900 km'`, `'~33 Gλ at 300 GHz'`, `'~6 μas beam'`,
  `'~20 μas beam'` are hardcoded mission-design numbers presented as fact. BHEX is unvalidated
  (`BHEX_PRESET` is explicitly placeholder; SEFD "pending validation"). Also conflates orbital
  radius with the ground-to-satellite baseline (the latter is geometry-dependent, up to ~2R⊕+h).
- **CONSISTENCY:** None — invented relative to the simulator.
- **BLANK:** ~30%.

### d08 — The Simulator
- **FLAT:** Yes — text/UI panels, little depth.
- **PHYSICS / CONSISTENCY:** **SELF-CONTRADICTORY.** `'DR ≈ 50:1 · beam ~24 μas · UV fill 0.8%'`
  (line ~1201) vs metrics table `'Beam FWHM', '~20 μas'` (line ~1249) — **24 vs 20 μas in the same
  act.** `'28 baselines'`, `'136 baselines'`, `'10,900 km'`, FITS `CRVAL1/BMAJ` all hardcoded.
- **CONSISTENCY:** Should pull DR / beam / UV-fill / max-baseline from the same derivations the
  app uses (`useSimulation.js`), for EHT 2017 vs ngEHT Phase 1.
- **BLANK:** ~15% (panels fill), but composition is flat.

---

## Summary of defects (priority order)

1. **Physics asserted, not derived; numbers wrong/inconsistent** — d04 (20 vs 25 μas), d08 (24 vs
   20 μas), d07 (invented BHEX figures), d01 (no numbers at all). → fixed by `tourPhysics.js`
   computing every value from the same constants/formulas the tool uses.
2. **Missing key equations** — VCZ (d02), u,v(H,δ) (d03), dirty-beam convolution + b_c (d05).
3. **Flat acts** — d02, d04, d08 → depth/lighting model + derivation panels + foreground accents.
4. **Blank frame** — d02 (~50%), d05 (~45%), d03 (~40%) → derivation panels, labeled axes, insets.

Every act also lacks a legible **concept name** in the visual frame (only prose carries it).
