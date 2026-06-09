# TOUR-PHYSICS-AUDIT.md — Phase 0 (Apple-precision overhaul, pass 2)

Audit of the symbolic formulas and headline numbers drawn in the tour. The computed numbers
were unified in pass 1; this pass audits the **symbolic formulas** (never checked before) and
corrects the **headline baseline** to the M87*-observing geometry. All values are computed in
`vlbi-react/js/tourPhysics.js`; the tour draws zero physics literals.

Date: 2026-06-09. Reproduce: `node --input-type=module -e "import {TOUR_PHYSICS} from './tourPhysics.js'; ..."`

---

## P0.1 — Shadow coefficient bug (FIXED)

The Schwarzschild photon-ring geometry:
- Critical impact parameter (shadow **radius**): `b_c = √27 · GM/c² = 3√3 · GM/c²`.
- Shadow angular **diameter** (the 42 μas the image shows): `2·b_c/d = 2√27 · GM/(c²d) = 6√3 · GM/(c²d)`.

Numerical check (M=6.5×10⁹ M☉, d=16.8 Mpc): `GM/(c²d) ≈ 3.8 μas`;
`2√27 × 3.8 ≈ 40 μas` (✓ diameter), `3√3 × 3.8 ≈ 20 μas` (radius).

**Bug:** `Tour.js` First Light rendered `θ_shadow = 3√3 · GM/(c²·D_L) ≈ 42 μas` — the *radius*
coefficient (3√3 = √27) paired with the *diameter* value (42 μas): a factor-of-2 inconsistency,
and it disagreed with d05 (which correctly drew `2√27`).

**Fix:** both acts now read one source in `tourPhysics.js`:
- `TOUR_PHYSICS.bcFormula = '√27 · GM/c²'` (radius / critical impact parameter)
- `TOUR_PHYSICS.shadowDiamFormula = '2√27 · GM/(c²d)'` (angular diameter)
d05 canvas renders `b_c = √27·GM/c²` and `shadow ≈ 2√27·GM/(c²d)`; `Tour.js` First Light equation is
`θ_shadow = 2√27·GM/(c²d) ≈ 42 μas`. Identical diameter coefficient in both — cannot diverge again.

---

## P0.2 — Max baseline → M87*-observing (CORRECTED; flagged for sign-off)

The geometric array max over all 8 EHT-2017 stations is **IRAM–SPT = 11,406 km**. But **SPT
(South Pole, lat −89.99°) cannot observe M87*** (dec +12.39°): its elevation for M87* is ≈ −12°,
always below the horizon. The live tool already excludes SPT for M87* via its 10° elevation cutoff.

Reusing the tool's **own** filter (`computeElevation` + `MIN_ELEVATION_RAD`, now exported from
`uvCompute.js` and imported into `tourPhysics.js` — never re-implemented), the longest baseline
with **simultaneous** M87* visibility (both stations ≥ 10° at a common hour angle over a full track):

| Quantity | Value | Pair |
|---|---|---|
| Geometric array max | 11,406 km → 23.6 μas | IRAM–SPT (SPT can't see M87*) |
| **M87*-observing max (headline)** | **10,883 km → 24.7 μas ("25")** | **IRAM–JCMT (Spain–Hawaii)** |

This matches the published EHT M87* nominal resolution (~25 μas) and the live tool's M87* behaviour.
Per-station M87* visibility confirmed: all of ALMA, APEX, SMA, LMT, IRAM, SMT, JCMT see M87*; **only
SPT is excluded.**

Exposed as distinct fields (computed, never hardcoded):
- `ehtMaxBaselineM87Km ≈ 10,883` — the headline (with `ehtM87MaxPair = ['IRAM','JCMT']`).
- `ehtArrayMaxBaselineKm ≈ 11,406` — geometric array max, available but never shown as resolution.

The headline value and `θ ≈ 25 μas` appear identically in Acts 1, 2, 4, 7, 8, each carrying the
mandatory **"M87*"** qualifier (observing geometry, not array geometry).

> **FLAG FOR SIGN-OFF (Marrone / Alejandro):** the M87* max is computed from the `constants.js`
> coordinate set via the imported `latLonToECEF` + elevation filter. If the validated coordinate set
> differs, the headline updates itself — but the coordinate set itself is Marrone-owned and should be
> confirmed. The IRAM–SPT geometric max (11,406) is retained for reference only.

---

## P0.3 — Ratio clarity (FIXED)

Two correct-but-different ratios were both shown unlabeled:
- Act 1 card "1.1×10⁵× sharper" = θ_dish/θ_EHT = 2.7″ / 25 μas ≈ 1.1×10⁵ (resolution gain vs one dish).
- Act 1 prose "60,000× smaller" = θ_dish/shadow = 2.7″ / 42 μas ≈ 64,000 (shadow size vs dish resolution).

Now labeled distinctly: card → "×1.1e5 finer resolution than one dish · (Rayleigh ×1.22)"; prose →
"the shadow of M87* is ~64,000 times smaller than a single dish can resolve."

---

## P0.4 — Full value table (computed; cross-act identical)

| Quantity | Value | Formula / source |
|---|---|---|
| λ (230 GHz) | 1.3 mm | c/(230e9) |
| θ single dish (D=100 m) | 2.7″ | λ/D |
| **B_max (M87*)** | **10,883 km** | M87*-visible pairwise max (IRAM–JCMT) |
| B_max (array geometry) | 11,406 km | all-pairs max (IRAM–SPT), reference only |
| **θ_EHT** | **25 μas** | λ/B_max(M87*) (24.70, `.toFixed(0)`) |
| u_max | 8.3 Gλ | B_max(M87*)/λ |
| improvement | 1.1 × 10⁵× | θ_dish/θ_EHT |
| EHT baselines | 28 | C(8,2) |
| M87* shadow (diameter) | 42 μas | `SKY_TARGETS['M87*'].shadowUas` |
| Sgr A* shadow | 50 μas | `SKY_TARGETS['Sgr A*'].shadowUas` |
| ngEHT Phase 1 θ (M87*) | 21 μas | λ/B_max(M87*, ngEHT) |
| BHEX char. radius | 32,933 km | R⊕ + `BHEX_PRESET.orbitalAltitudeKm` — ⚠ pending sign-off |
| BHEX θ ~ λ/(R⊕+h) | 8 μas | oversimplified — ⚠ pending sign-off, never a clean equality |

**Gate result: PASS** — every displayed number equals its formula; the M87* baseline and θ are
identical across Acts 1/2/4/7/8; Act 5 and Act 6 render the identical `2√27` shadow coefficient;
all BHEX figures and the `B ~ R⊕+h` relation remain pending-labeled.

(Canvas "M87*" qualifier labels on d02/d07/d08 are applied during the per-act visual passes;
the numbers themselves already flow from the single source.)
