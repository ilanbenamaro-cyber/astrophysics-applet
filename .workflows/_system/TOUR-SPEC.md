# TOUR-SPEC.md — Authoritative spec for the tour overhaul

> Single ground truth for implementation. Every displayed number is COMPUTED in `tourPhysics.js`
> from the same constants/formulas the live app uses. Zero hardcoded physics literals in acts.

## The arc (one spine, eight answers)

A single dish — however large — cannot resolve M87*'s 42 μas shadow, because θ=λ/D and even a
100 m dish yields only ~2.7″ (Act 1 → *how do we do better?*). So we pair two dishes; but a
baseline doesn't make a picture, it makes a single Fourier-mode **measurement** — one complex
visibility V(u,v), van Cittert–Zernike (Act 2 → *one point isn't an image*). One measurement is
almost nothing, so we let Earth rotate: the projected baseline sweeps an **ellipse** through the
(u,v) plane — aperture synthesis (Act 3 → *still gaps*). So we add dishes across the planet:
eight telescopes at six sites become one Earth-sized aperture, θ=λ/B_max ≈ **24 μas** (Act 4 →
*sparse samples → ugly image?*). The sparse sampling yields a sidelobe-riddled dirty image, so
CLEAN deconvolves it into the true photon ring, b_c=√27·GM/c² (Act 5 → *does it work?*). On
**2019-04-10** it stopped being theory — M87*'s 42±3 μas ring, M≈6.5×10⁹ M☉ (Act 6 → *sharper?*).
Yes: leave Earth, where a space baseline ~ R⊕+h beats any ground baseline (Act 7 → *how do I
explore this?*). In this simulator — place your first telescope (Act 8).

## The four laws

1. **Depth** — single key light upper-left across all acts; contact shadows under every object;
   far layers desaturated + blurred; one near-plane foreground accent per act; occlusion.
2. **Derivation** — symbol → substitution → result → meaning, in a glass derivation panel. One
   named concept per act, rendered in the HUD (legible even muted).
3. **Convention** — θ=λ/B, θ=λ/D, **no 1.22** (matches `useSimulation.js`). 1.22 may be footnoted.
4. **Filled frame** — 12×8 grid over 1200×700; ≤12% empty; fill dead cells with panel / inset /
   labeled axis / scale bar.

## Computed-number table (authoritative — from constants + canonical formulas)

| Quantity | Value (230 GHz) | Source / formula | Displayed as |
|---|---|---|---|
| λ | 1.3034 mm | c/(230e9) | "1.3 mm" |
| θ single dish (D=100 m) | 2.689″ | λ/D × 206265 | "2.7″" |
| EHT 2017 max baseline | **11,406 km** (IRAM↔SPT) | max ECEF pairwise, `ARRAY_PRESETS['EHT 2017']` | "≈ 11,400 km" |
| θ_EHT | **23.57 μas** | λ/B_max × 206265e6 | "24 μas" (`.toFixed(0)`, == app) |
| u_max | 8.75 Gλ | B_max/λ | "≈ 8.8 Gλ" |
| improvement θ_dish/θ_EHT | 114,063× | ratio | "≈ 1.1 × 10⁵×" |
| EHT 2017 baselines | C(8,2)=28 | combinatorial | "28 baselines" |
| ALMA SEFD | 94 Jy | `STATION_SEFD.ALMA` | "94 Jy" |
| M87* shadow | 42 μas | `SKY_TARGETS['M87*'].shadowUas` | "42 μas" |
| Sgr A* shadow | 50 μas | `SKY_TARGETS['Sgr A*'].shadowUas` | "50 μas" |
| BHEX char. radius R⊕+h | 32,933 km | `EARTH_RADIUS_KM + BHEX_PRESET.orbitalAltitudeKm` | "~32,900 km ⚠ pending" |
| θ ~ λ/(R⊕+h) | 8.16 μas | oversimplified | "~8 μas ⚠ pending" |

> **Note:** B_max is **11,406 km**, not the loose "10,900 km" / "25 μas" some sources cite. The
> tour shows the tool's own value so they never disagree. All three of Act 1 / Act 4 / Act 8 read
> the same `TOUR_PHYSICS.thetaEhtUas`.

## tourPhysics.js (the one source of truth)

- Import `latLonToECEF` from `uvCompute.js` (add `export` there — do **not** copy it).
- Import `EARTH_RADIUS_KM, ARRAY_PRESETS, SKY_TARGETS, BHEX_PRESET` from `constants.js`.
- Helpers: `lambdaM(fGHz)`, `thetaUas(km, λm)`, `uGl(km, λm)`, `maxBaselineKm(stations)`.
- Export frozen `TOUR_PHYSICS` (computed at load, 230 GHz, D=100 m) + a `fmt` helper namespace.
- BHEX fields carry `pending:true`; the **relation itself** is "characteristic baseline ~ orbital
  radius", shown with "~" and a pending tag — never `B = R⊕+h` as a clean equality.

## Appended shared utilities (TourDiagram.js — append only)

`drawDerivationPanel`, `drawContactShadow`, `drawAxisTicks`, `drawScaleBar`,
`drawForegroundAccent`, `drawConceptTag`, `drawHudFrame`. Reset `g.filter='none'` after blur
(gotcha #484); upper-semicircle arcs anticlockwise (gotcha #479); `ctx.fillText` allowed.

## Per-act motion + verify checklist

- **d01** — dishes ground in → beams fire → sources resolve. Derivation panel: θ=λ/D=2.7″ and
  θ=λ/B=24 μas, improvement ~1.1e5×, payoff "24 μas resolves 42 μas; 2.7″ cannot". Concept
  "ANGULAR RESOLUTION". VERIFY: both θ shown, derived, consistent; 1.22 footnoted.
- **d02** — wavefront descends (τ_g) → u=B/λ builds → UV point appears. Panel: VCZ
  `V(u,v)=∬I(l,m)e^{−2πi(ul+vm)}dl dm`, τ_g=(B·ŝ)/c, u=B/λ ⇒ 8.8 Gλ. UV inset axis-labeled (Gλ).
  Concept "ONE FOURIER MODE". VERIFY: B computed (~11,400), not "10,900"; ≤12% blank.
- **d03** — Earth rotates, 3 baselines sweep 3 labeled ellipse arcs filling the plane. Panel:
  u,v(H,δ); ellipse center v=B_Z cosδ/λ labeled. Concept "APERTURE SYNTHESIS". VERIFY: plane fills.
- **d04** — 8 stations bloom → baselines glow → UV inset. θ_EHT=24 μas (== Act 1); 28 baselines;
  ALMA SEFD=94 Jy from `STATION_SEFD`. Concept "EARTH-SIZED APERTURE". VERIFY: coords from
  constants (none invented); SPT south, IRAM in Spain.
- **d05** — sidelobes dissolve outer-first as photon ring emerges; Dirty→CLEAN morph. Panel:
  dirty=sky⊛dirty-beam; CLEAN (Högbom) steps; b_c=√27 GM/c²; shadow 42 μas. Comparison inset.
  Concept "DECONVOLUTION". VERIFY: causal, not crossfade.
- **d06** — real M87* fades up; scale bar (42 μas) + provenance. 2019-04-10, 42±3 μas, 6.5×10⁹ M☉.
  Concept "FIRST LIGHT". VERIFY: image not in a void (filled margins).
- **d07** — BHEX orbit; data pulse satellite→ALMA; steady baseline; 3 star-depth layers. Panel:
  "characteristic baseline ~ R⊕+h ⚠ pending sign-off (Marrone/Alejandro)", θ~λ/(R⊕+h)~8 μas
  pending; **never a clean equality**. Concept "SPACE BASELINE". VERIFY: formula carries the
  pending mark; nothing asserted as fact.
- **d08** — two result panels rise; FITS/metrics slide in; CTA glows. EHT 2017 vs ngEHT Phase 1
  metrics consistent with app derivations (resolve 24-vs-20 contradiction — single source).
  Concept "THE SIMULATOR". VERIFY: CTA luminous; no dead corners.

## Verify harness

Fresh port 8092 each pass (gotcha #238). Playwright screenshots per act; zero console errors; RAF
cleanup on unmount; reduced-motion draws a complete static frame and never starts RAF.
