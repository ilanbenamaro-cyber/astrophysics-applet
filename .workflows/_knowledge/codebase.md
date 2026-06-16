# Project Knowledge Base — Codebase
# _knowledge/codebase.md
#
# What Claude knows about this project's structure, patterns, and conventions.
# Updated automatically after significant changes.
# Last full reconstruction: 2026-04-12

---

## Two Independent UIs

This repo contains two separate, non-sharing UIs in the same directory tree:

1. **Root app** (`index.html` + `js/` + `css/`) — Plain JS, Leaflet map, no build step. Stable, not under active development.
2. **vlbi-react** (`vlbi-react/index.html` + `vlbi-react/js/` + `vlbi-react/css/`) — React 18 + htm/preact via import maps, Three.js globe, Web Worker. **Primary active codebase.**

**IMPORTANT:** The live deployed version is `vlbi-react/`. Never edit root `js/`, `css/`, or `index.html` for user-facing fixes. See gotchas.md #3.

---

## Root App (stable — unchanged since 2026-03-16)

### Stack
- Plain JavaScript (ES6, no TypeScript, no bundler)
- Leaflet 1.9.4 (CDN) — interactive 2D map
- math.js 12.4.0 (CDN) — 1D FFT/IFFT via `math.fft`, `math.ifft`
- Plain CSS, dark theme

### Script load order (hard dependency — do not reorder)
```
math.js → Leaflet → fft2d.js → interferometry.js → imageProcessor.js → sampleImages.js → mapController.js → infoModal.js → app.js
```

### Files
```
index.html              # App shell; DOM structure
css/style.css           # Dark astronomy theme; three-column responsive grid
js/fft2d.js             # 2D FFT/IFFT + fftShift (wraps math.js 1D transforms)
js/interferometry.js    # ECEF coords, baseline→UV, UV coverage synthesis, conjugate symmetry
js/imageProcessor.js    # Image I/O (resize to 256×256), UV mask, reconstruction pipeline, canvas render
js/sampleImages.js      # Procedural synthetic sources: ring, double, gaussian, jet
js/mapController.js     # Leaflet map, telescope markers, EHT presets, baseline table
js/infoModal.js         # Info/help modal logic
js/app.js               # Coordinator: event wiring, debounced runReconstruction() (50ms)
```

### Reconstruction pipeline
```
fft2d(grayscale) → buildUVMask(uvPoints) → applyUVMask → ifft2d → grayscaleToCanvas
```

### Key invariants
- All functions are global (`function` declarations) — required for Leaflet popup `onclick` handlers
- `IMAGE_SIZE = 256` (power-of-2, hardcoded in imageProcessor.js)
- Every UV point (u,v) is paired with conjugate (-u,-v) in `computeUVCoverage`
- UV index wrapping: `((value % N) + N) % N` — handles negative coordinates
- `grayscaleToCanvas` auto-normalizes using data min/max — do not pre-normalize before passing
- `removeTelescope` in mapController.js must remain a `function` declaration — called from Leaflet HTML string

---

## vlbi-react (primary active codebase)

### Stack
- React 18 via htm/preact (no bundler, no npm — ES import maps in vlbi-react/index.html)
- Three.js — 3D globe for telescope placement
- Web Worker (`worker.js`) — FFT + CLEAN + MEM off main thread
- Plain CSS (`vlbi-react/css/app.css`) — dark theme, CSS custom properties

### Entry point
`vlbi-react/index.html` — loads import map, mounts React app

### Component tree
```
App.js                        — global UI only: compareMode, infoKey, a11y, tour, modals
│                               Instantiates left=useSimulation() + right=useSimulation()
│                               Single-pane: uses left.* throughout
│                               Compare mode: renders two <SimPane> components
├── AppSidebar.js             — sidebar: compare toggle button at TOP (teal-bordered when active),
│   │                           image gallery, telescope list, controls; array preset auto-loads on select
│   └── ControlsPanel.js      — all sliders: noise, frequency, duration, declination, dish (no method buttons — removed P1)
├── Globe.js                  — Three.js 3D globe; click → telescope placement; ResizeObserver handles compact pane
├── SimPane.js                — compact simulation pane for compare mode; collapsible telescope section (with BHEX button)
├── UVMap.js                  — canvas: UV coverage arcs; two color modes: pair (default) and SNR
├── MetricsPanel.js           — collapsible panel: beam FWHM, DR, UV fill %, UV samples, baseline stats
├── ImageCanvas.js            — dirty/restored side-by-side canvas panels
├── OriginalImagePanel.js     — source image display
├── ContourMap.js             — professional contour map (viridis, marching squares, beam ellipse, Dirty/CLEAN toggle)
├── StatusBar.js              — reconstruction status
├── TelescopeList.js          — list of placed telescopes with remove buttons
├── InfoModal.js              — panel info popup
├── InfoTooltip.js            — hover tooltip on ? icons
├── Tour.js                   — ENGINE-REAL cinematic tour host (rebuilt 2026-06-10). 5 acts (A–E) whose
│   │                           visuals are genuine uvCompute/worker output, not drawings. Signature
│   │                           UNCHANGED: Tour({actIndex,onActChange,onClose,onTourAction,reducedMotion}).
│   │                           mode 'presenter'|'guided' (?mode=presenter or 'P' key, default guided).
│   │                           visual→ready state machine drives a single canvas RAF (one scene per act);
│   │                           cancelAnimationFrame on every act change/unmount; reducedMotion draws one
│   │                           static final frame, no RAF. Pointer events on the canvas forward to
│   │                           scene.onPointer (guided interactivity). NEVER mutates app state mid-act →
│   │                           Skip/Esc preserves the user's pre-tour state for free; only the closing
│   │                           "Enter the simulator" beat dispatches loadEHT (handoff). NB: old TourCard.js
│   │                           and TourDiagram.js were DELETED in this rebuild.
│   ├── tourActs.js            — the 5 acts as DATA (master schema): actId A–E, engineState{stations,params}
│   │                           from constants (freq/FOV/duration via tourPhysics exports), liveEquation
│   │                           {tex,values()} bound to tourPhysics, ONE unified `narrative` per act
│   │                           (polish pass 2026-06-11: the artist/scientist/layperson triple + tier tabs
│   │                           were REMOVED — one voice, exact and evocative), compute class, durations,
│   │                           transition, closing flag. NO physics literal — all numbers via TOUR_PHYSICS.
│   ├── tourScenes.js          — per-act scene registry SCENES[actId]→{init,drawFrame,onPointer?} +
│   │                           a generic real-coverage fallback. toTelescopes/uvExtentGl live in tourScene.
│   ├── sceneA.js              — ACT A Resolution: one-dish diffraction blur (θ=λ/D) vs the REAL EHT dirty
│   │                           beam (point source through EHT u,v via runReconstruction method:'dirty',
│   │                           drawn with drawHot). live-on-input.
│   ├── sceneB.js              — ACT B Synthesized Aperture (flagship, live-60fps): ALMA+IRAM baseline on a
│   │                           turning Earth → real (u,v) sample → real ellipse drawn point-by-point → full
│   │                           EHT coverage + FillGauge + θ=λ/B callout. Idle spin = a CONTINUOUS hour-angle
│   │                           clock (2026-06-16): idle.haRad advances IDLE_RATE×dt from the RAF timestamp,
│   │                           wraps at ±12h, so the globe spins fully + smoothly like the main globe
│   │                           (IDLE_DAY_S=40). Globe rotation, u,v head, HA readout all derive from haRad;
│   │                           the head traces during the ±4.85h co-visible window and holds the ellipse full
│   │                           off-window ("source below horizon" caption). Guided: decoupled HOUR ANGLE track
│   │                           + vertical DECLINATION slider (drawSliderControl, rect hit-tested); HA drag =
│   │                           direct control, release resumes the constant spin from the current angle (no
│   │                           ramp/snap). Replaced the old quantized track[headIdx] lookup + eased ramp.
│   ├── sceneC.js              — ACT C From Data to Image, CAUSAL three-panel pipeline: [SPARSE DATA real (u,v)
│   │                           + computed fill %] —FFT⁻¹→ [DIRTY] —CLEAN→ [RESTORED ring over the dirty base],
│   │                           both image panels drawHot (Act D's colormap). Source sized by
│   │                           measureRingFraction/zoomSource so the ring truly spans 42 μas. Guided control
│   │                           (2026-06-16): THREE engine-honest THERMAL-NOISE presets {0, 0.015, 0.03} ×
│   │                           visibility RMS as a segmented button bar (default 0); each recomputes via the
│   │                           real engine (own worker), caches dirty+restored, never-stall timeout + spinner.
│   │                           Replaced the noise slider + residual sparkline + DR/component-count readouts —
│   │                           Högbom on EHT-sparse coverage is near-inert (~12 components even at noise 0;
│   │                           restored ≈ dirty+residual), so the component count was an erratic, misleading
│   │                           proxy (see gotchas.md / SITE-AUDIT addendum). Worker untouched.
│   ├── sceneD.js              — ACT D First Light: real assets/eht-m87-2019.jpg paired with the simulator's
│   │                           own CLEAN reconstruction (same measured ring sizing as C), which RESOLVES in
│   │                           (blur 14px→0, filter reset per draw); computed shadow scale bars; the dated
│   │                           moment "10 APRIL 2019" letter-spaced beneath. static/precompute.
│   ├── sceneE.js              — ACT E Beyond Earth (closing): real BHEX ground–space coverage
│   │                           (computeSatelliteECEF + space branch of computeUVPointsGl). Dim gold ground
│   │                           coverage INSIDE a solid amber Earth-diameter ring; orange space arcs +
│   │                           annulus wash beyond it (per-pair colours stripped — BHEX preset is itself
│   │                           gold). Hedge stated ONCE, in the equation status row. CTA + handoff.
│   ├── tourEarth.js           — READ-ONLY textured Three.js Earth (polish pass): module singleton matching
│   │                           the main globe by construction (loadEarthTextures + Globe.js material/light/
│   │                           atmosphere/fresnel register, syncTelescopeMarkers-style markers). No controls,
│   │                           no placement; rotation = group.rotation.y. Scenes drawImage(render(H)) and
│   │                           place 2D overlays via project(); Tour.js disposes it on tour unmount.
│   ├── tourGalaxy.js          — shared deep-space background (polish pass): 3 parallax star layers + nebula
│   │                           wash pre-rendered once at half-res (slate/amber/neutral family) + vignette;
│   │                           subordinate to the gold data layer by design; T=0 → fully static (reduced
│   │                           motion). ensureGalaxy(slot,w,h,{seed,intensity}) caches per canvas size.
│   ├── tourScene.js           — shared canvas primitives: setupCanvas (offsetWidth×dpr), ease
│   │                           cubic-bezier(.25,.46,.45,.94), beatT, measureRingFraction/zoomSource
│   │                           (ring-source sizing), drawUVAxes (Gλ), hexA, toTelescopes, uvExtentGl.
│   │                           (makeStars/drawStarfield + the hand-drawn drawEarth were retired.)
│   ├── tourAnnotations.js     — physics-annotation draws (ON the act canvas, so they can't intercept
│   │                           pointer events): drawBaselineVector (labeled by IDENTITY, e.g. "|B| ALMA–IRAM"),
│   │                           drawUVTrace, drawUVPoints, drawFillGauge, drawResolutionCallout,
│   │                           drawResidualSparkline (states "no components above 3σ — noise-limited" when
│   │                           CLEAN stops at iter 0), roundRect. Gold accent = the live/active data layer.
│   ├── TourEquation.js        — LiveEquation: renders KaTeX into a ref (window.katex, already loaded in
│   │                           index.html); plain-tex fallback if KaTeX missing (never blocks). + bound-value list.
│   └── TourSpine.js           — MiniUVSpine: the progress indicator IS a tiny REAL EHT UV track that fills
│                               as acts complete (computeUVPointsGl computed once at module load).
├── A11yPanel.js              — accessibility settings panel
├── PhysicsNotesModal.js      — static modal: UV formula, CLEAN/MEM algorithms, EHT sources
└── CitationModal.js          — BibTeX + APA citation generator from live sim state
```

### Support modules
```
core.js           — htm/preact re-exports (html, useState, useEffect, useRef, useMemo, useCallback)
constants.js      — IMAGE_SIZE=512, EARTH_RADIUS_KM=6371, TELESCOPE_COLORS[17], EHT_PRESETS[8],
                    ARRAY_PRESETS {'EHT 2017':8, 'EHT 2022':11, 'ngEHT Phase 1':17},
                    STATION_SEFD (per-station Jy at 230 GHz: ALMA=94, NOEMA=700, …, SMT=17100, SPT=19300),
                    BHEX_PRESET (type:'space', alt 26562 km, inc 86°, RAAN 277.7°, period 12h),
                    SKY_TARGETS {M87*: dec 12.391° shadowUas 42, Sgr A*: dec -29.008° shadowUas 50,
                                 3C 279: dec -5.789° shadowUas null, Cen A: dec -43.019° shadowUas null,
                                 Custom: dec null shadowUas null},
                    INFO (tooltip text keyed by panel name), ISO_COUNTRY_NAMES (numeric→display)
useSimulation.js  — custom React hook; all simulation state, effects, memos, and handlers.
                    App.js calls left=useSimulation() and right=useSimulation() (always both — hooks cannot be conditional).
                    Returns: telescopes, showCountryLabels, selectedPreset, selectedArrayPreset,
                      grayscale, originalCanvas, uvPoints, stationPairs, uvPointsGl, uvFill,
                      dirty, restored, controls, status, isComputing, uvCount, beamDims, selectedTarget,
                      effectiveSourceFraction, angularRes, baselineStats, sefdMap, pairSefdMap,
                      dynamicRange, beamFwhm, bhexAdded,
                      setControls, setSelectedArrayPreset, setShowCountryLabels,
                      handleTelescopeAdd/Remove/Toggle, handleTargetChange, handleAddBHEX,
                      handleLoadArrayPreset, handlePresetSelect, handleFileUpload, handleReset,
                      handleExportFITS, handleClearTelescopes, handleLoadDefaultEHT, loadEHTPresets
fitsExport.js     — exportFITS(restoredData, N, controls, selectedTarget, beamDims)
                    Writes FITS binary with WCS headers: CRVAL1/2 (RA/Dec), CDELT1 (negative), CDELT2,
                    CRPIX1/2 = N/2+0.5, FREQ, BMAJ/BMIN, BUNIT='JY/BEAM', OBJECT.
                    Float32 big-endian, rows flipped (FITS row 0 = bottom). Header+data padded to 2880-byte blocks.
                    Peak finding uses for-loop (NOT Math.max spread — stack overflow at N=512).
uvCompute.js      — latLonToECEF, computeBaseline, computeSatelliteECEF (Keplerian orbit → ECEF),
                    baselineToUV (TMS eq 4.1),
                    MIN_ELEVATION_RAD = 10° (elevation cutoff constant),
                    computeElevation(lat_deg, ha_rad, dec_rad) → elevation angle,
                    computeUVPoints (pixel coords, FOV-scaled — reconstruction input)
                      → returns { uvPoints, stationPairs }; applies 10° elevation cutoff per telescope per HA step
                    computeUVPointsGl (Gλ coords, FOV-independent — display only)
                      → same elevation cutoff logic as computeUVPoints
                    computeUVFill, lerpColor
globeHelpers.js   — Three.js mesh helpers for globe, atmosphere, markers;
                    syncTelescopeMarkers (skips space telescopes; ground baselines only),
                    syncSatelliteMarkers (gold sphere at ascending node + orbital ring at 1.5× globe radius; CSS2DObject label)
                    Globe.js has a ResizeObserver on its container div — works correctly in compact 280px SimPane pane.
presets.js        — IMAGE_PRESETS: { 'blackhole': '../assets/black-hole.png', 'wfu-seal': '../assets/wfu-seal.png' }
worker.js         — self-contained Web Worker (no imports — cannot use import maps).
                    Each useSimulation instance spawns its own worker — two workers run in compare mode.
                    Opt-in `params.progressEvery`: when set, the CLEAN loop posts {type:'progress',iter,residual}
                    every K iters. No imports added; absent flag ⇒ byte-identical. (Capability retained; Act C
                    no longer consumes it after the 2026-06-16 slider→presets change — no current caller.)
simCore.js        — pure simulation core lifted from useSimulation.js (behavior-neutral; the hook imports
                    them back). runReconstruction(grayscale, uvPoints, params, onProgress?) → Promise — owns
                    its OWN classic worker per call (non-singleton, proven by App.js left/right), resolves
                    {dirty,restored,beamSigmaU/V,beamPA,uvCount}; TRANSFERS grayscale.buffer (pass a .slice()).
                    Also scaleSource, buildSefdMap/buildPairSefdMap, computeDynamicRange, beamFwhm, angularRes.
                    The hook's persistent-worker dispatch effect is UNCHANGED (only the pure memos call these).
                    Tour acts import runReconstruction directly to drive real engine output.
simRender.js      — pure canvas renderers lifted from ContourMap/ImageCanvas (components import them back):
                    drawContour(ctx, data, {N,beamSigmaU,beamSigmaV,beamPA,dynamicRange}) → {isEmpty,stats,
                    activeLevels} (viridis + marching-squares contours + colorbar + beam); drawHot(ctx,data,N)
                    (hot colormap); exports CONTOUR_LEVELS, fmtVal. Tour scenes render engine output via these.
```

### Worker protocol
**IN (from App.js):**
```js
{
  type: 'reconstruct',
  id: number,                    // monotonic request ID — stale results discarded if id !== recoId.current
  grayscale: Float64Array,       // N×N flattened pixel values [0,1]
  uvPoints: [{u: number, v: number}],   // UV sample coordinates (already offset by N/2)
  params: {
    N: number,           // IMAGE_SIZE (512)
    noise: number,       // noise amplitude [0,1]
    method: string,      // 'none' | 'clean' | 'mem'
    dishDiameter: number, // meters
    frequency: number,   // GHz
    fovRad: number,      // image FOV in radians (fovMuas * π/(180*3.6e9))
    stationPairs: [{a: string, b: string}],  // parallel to uvPoints; station name pairs for SEFD lookup
    sefdMap: { [stationName]: number },      // per-station SEFD in Jy at observing frequency
    progressEvery?: number                   // OPT-IN: emit CLEAN progress every K iters (Act C). Omit = no progress.
  }
}
```

**OUT (to App.js):**
```js
// Success:
{ type: 'result', id: number, dirty: Float64Array, restored: Float64Array, uvCount: number,
  beamSigmaU: number, beamSigmaV: number, beamPA: number }
// Transferable buffers — dirty.buffer and restored.buffer are transferred (zero-copy)
// beamSigmaU/V: elliptical restore beam sigma (pixels) from dual-axis PSF scan (S4)
// For MEM/dirty: theoretical beam computed from 1.02*lambda/dish/fovRad (fallback)

// Error:
{ type: 'error', id: number, message: string }

// Progress (only when params.progressEvery is set — Act C live sparkline):
{ type: 'progress', id: number, iter: number, residual: number }
```

### Key computations

**UV coordinate scaling — reconstruction** (in `uvCompute.js` → `computeUVPoints`):
```
lambda_m = c / (frequency * 1e9)
fovRad = fovMuas * (π / (180 * 3.6e9))
scale = (1e3 / lambda_m) * fovRad    ← pixels per km of baseline
uvPoints pushed as: (pu + N/2, pv + N/2) AND (-pu + N/2, -pv + N/2)  ← conjugate symmetry
```
Used by: reconstruction worker (passes pixel-coord UV points to worker.js)

**UV coordinate scaling — display** (in `uvCompute.js` → `computeUVPointsGl`):
```
lambda_m = c / (frequency * 1e9)
kmToGl = 1e3 / lambda_m / 1e9       ← km → gigawavelengths
uvPoints pushed as: (uGl, vGl) AND (-uGl, -vGl)  — centered at (0,0)
```
Used by: UVMap.js display only — independent of FOV and image grid size. UVMap auto-scales canvas to max UV extent × 1.2, labels axes in Gλ.

**Primary beam taper** (in `worker.js` → `reconstruct`):
```
lambda_m = 3e8 / (frequency * 1e9)
fwhm_rad = 1.02 * lambda_m / dishDiameter      ← physical Airy disk approximation
fwhm_px  = (fwhm_rad / fovRad) * N
sigmaPx  = fwhm_px / 2.355
Applied as Gaussian envelope to dirty image (multiplication in image space before IFFT masking)
```

**CLEAN** (Högbom algorithm in `worker.js`):
- 1000 iterations max, loop gain = 0.1
- Stop at 3×noiseRms (estimated from outer 10% border pixels of dirty image)
- PSF peak at index 0 (not N/2 — worker FFT convention)
- Restore beam: **elliptical Gaussian** measured from dirty beam PSF via dual-axis half-max scan
  - U-axis: scan `psf[j]` for j=1..N/2 → `sigmaU = max(1.5, halfWidthU / 2.355)`
  - V-axis: scan `psf[j*N]` for j=1..N/2 → `sigmaV = max(1.5, halfWidthV / 2.355)`
  - Memory layout: row index `i` = v-direction, column index `j` = u-direction
- Final: FFT-convolve model with elliptical Gaussian kernel, add residual
- Returns beamSigmaU, beamSigmaV, beamPA (always 0 — axis-aligned)

**MEM** (Max Entropy in `worker.js`):
- 120 gradient-descent iterations
- alpha = 0.01 (entropy weight)
- Prior = mean(|dirty|) (flat, uniform prior)

**ContourMap rendering** (`vlbi-react/js/ContourMap.js`):
- Viridis colormap on canvas (bilinearUpscale from N×N source to canvas DST=512; at N=512 this is identity)
- Contours via marching squares (`marchingSquares`)
- Island filter: `groupSegments(segs, tol=0.1)` → discard groups where `groupBBoxMaxDim < 15`
- Boundary clip: segments where either endpoint has scaled canvas coord < 1 or > DST-1 are discarded (prevents edge-connecting artifacts from boundary marching-squares cells)
- Adaptive DR thresholds: DR<80 → 50% only; DR 80-200 → 50%+10%; DR>200 → all three levels
- Canvas draws: viridis pixels, contour line segments, beam ellipse shape, axis tick marks, colorbar gradient, colorbar intermediate ticks, contour level tick marks above bar
- HTML overlays (not canvas text): tick axis labels (`.ctick`), colorbar values (`.contour-cb-labels`), contour level badges (`.contour-cb-levels`), beam label (`.contour-beam-label`)
- Default displayMode: `'dirty'`; second button is `'clean'` (uses `restoredData`; key was renamed from `'restored'` in P1)

**Angular resolution** (in `useSimulation.js` → `useMemo`):
```
maxBaseline = max Euclidean distance between any two telescope ECEF positions (km)
angularResolution = (λ_mm / (maxBaseline × 1e6)) × (180/π) × 3.6e9  [μas]
```
Passed as prop to ContourMap for μas axis labels.

**Dynamic range** (in `useSimulation.js` → `useMemo`):
```
border = outer 10% pixels of restored image (margin = floor(N × 0.1) = 51px for N=512)
med = median(border)
madSigma = 1.4826 × median(|border[i] - med|)
safeSigma = madSigma if finite & > 0 & < maxV×0.1, else maxV×0.01
dynamicRange = maxV / safeSigma
```
Previously computed inside ContourMap.js (where it drove adaptive thresholds). Lifted to hook so MetricsPanel and ContourMap both receive it as a prop. ContourMap still computes its own sigma for the statsText σ: display line only.

**UVMap SNR color mode** (in `UVMap.js`):
```
snrColor(sefdA, sefdB, minSnr, maxSnr):
  snr = 1 / sqrt(sefdA × sefdB)
  t = (snr - minSnr) / (maxSnr - minSnr)   [0..1]
  hsl(45, t×100%, 30+t×30%)                [grey→gold]
```
Toggle button visible when `pairSefdMap` has entries. Default mode: pair-color (unchanged).
pairId key format: `"${tel_a.id}-${tel_b.id}"` (string, e.g. "3-7"). Never use as array index.

### State architecture — useSimulation hook vs App.js

**useSimulation hook** (all simulation-specific state):
- `telescopes` — array of `{ id, name, lat, lon, color }` for ground; `{ id, name, type:'space', orbitalAltitudeKm, inclinationDeg, raanDeg, periodHours, color }` for BHEX
- `dirty`, `restored` — Float64Array results from worker
- `uvPoints` — pixel space, FOV-scaled — passed to worker
- `stationPairs` — `[{a, b}]` parallel to uvPoints — station name pairs for SEFD noise
- `uvPointsGl` — Gλ coords, display only — passed to UVMap
- `uvCount` — number of UV samples from latest worker result
- `controls` — all slider/toggle values (noise, frequency, duration, declination [default 12.391 = M87*], method, dishDiameter, fovMuas [default 80], sourceFraction [default 0.50 — only used when selectedTarget=Custom])
- `selectedPreset` — current image preset key (blackhole/wfu-seal)
- `selectedArrayPreset` — 'EHT 2017' | 'EHT 2022' | 'ngEHT Phase 1'
- `selectedTarget` — 'M87*' | 'Sgr A*' | '3C 279' | 'Cen A' | 'Custom'
- `beamDims` — `{ sigmaU, sigmaV, pa }` from latest worker result
- `showCountryLabels`, `grayscale`, `originalCanvas`, `status`, `isComputing`

**Derived (useMemo in useSimulation, never in state):**
- `effectiveSourceFraction` — `shadowUas/fovMuas` for named targets; `controls.sourceFraction` for Custom
- `dynamicRange` — MAD-based: `maxPeak / (1.4826 × median(|border − median(border)|))`, 10% margin border
- `beamFwhm` — `{ major: sigmaU×2.355×pixelScale, minor: sigmaV×2.355×pixelScale }` in μas
- `sefdMap` — `{ stationName: SEFD_Jy }` per telescope
- `pairSefdMap` — `{ "id1-id2": { sefdA, sefdB } }` keyed on pairId string (e.g. "3-7")
- `angularRes` — string (e.g. "20 μas") or null; from max ECEF baseline + wavelength
- `baselineStats` — `{ maxKm, maxGl, minGl }` or null
- `bhexAdded` — `telescopes.some(t => t.name === 'BHEX')`

**App.js** (global UI only — 7 state pieces):
- `compareMode` — boolean; switches between single-pane and two-SimPane layout
- `infoKey`, `physicsNotesOpen`, `citationOpen` — modal state
- `a11y` — `{ highContrast, fontSize, reducedMotion }` (persisted to localStorage)
- `a11yOpen`, `tourActive`, `tourActIndex`

### IMAGE_PRESETS (asset paths relative to vlbi-react/)
```js
{ blackhole: '../assets/black-hole.png', 'wfu-seal': '../assets/wfu-seal.png' }
```

---

## Deployment

| Target | URL |
|--------|-----|
| Root app | https://ilanbenamaro-cyber.github.io/astrophysics-applet/ |
| vlbi-react | https://ilanbenamaro-cyber.github.io/astrophysics-applet/vlbi-react/ |

GitHub Pages from `main` branch root. Push to `main` = live within ~60 seconds.

---

## Last Updated

2026-06-10 — Tour engine-real rebuild complete (2fd3bea..64480e5, branch feature/tour-world-class-overhaul, NOT yet merged to main):
  The guided tour was rebuilt from 8 hand-drawn TourDiagram scenes into 5 engine-driven acts (A–E) whose
  visuals are genuine uvCompute/worker output. **TourCard.js and TourDiagram.js DELETED** (1,697 lines).
  Phase 0 (behavior-neutral): new simCore.js (runReconstruction + scaleSource/buildSefdMap/buildPairSefdMap/
  computeDynamicRange/beamFwhm/angularRes) and simRender.js (drawContour/drawHot) extracted from
  useSimulation/ContourMap/ImageCanvas — which import them back; worker.js gained opt-in progressEvery.
  Timing gate (recorded in TOUR-ENGINE-AUDIT.md §2, N=512 dev): computeUVPoints 0.5ms, dirty 41ms,
  CLEAN 98ms, MEM 2350ms → Act C runs CLEAN live in both modes. Phase 1: Tour.js host (presenter|guided
  mode, scene RAF, KaTeX live equations via TourEquation.js, narrative tiers, real-UV progress spine via
  TourSpine.js, pointer→scene). New: tourActs.js (act schema data), tourScenes.js (registry), tourScene.js
  (canvas primitives), tourAnnotations.js (physics annotations), sceneA–E.js. Numbers via tourPhysics.js,
  colours via tourTokens.js. All 12 quality gates verified on fresh port; app reconstructs unchanged (G12).
  ⚠ HUMAN TODO: re-run the timing gate on the projector laptop before the talk (if CLEAN >300ms there,
  switch presenter Act C to cached-frame playback).

2026-04-28 — Canvas 2D cinematic rewrite complete (bed2d45):
  TourDiagram.js completely rewritten from SVG/htm to Canvas 2D requestAnimationFrame loops.
  d01–d08 are now React components with useRef+useEffect+RAF. Shared utilities (makeStars, drawStars,
  drawNebulae, drawMilkyWay, drawAtacama, glow3, drawDish, drawBeam, drawBlurry, drawSharp,
  drawBaseline, drawDivider, drawEarth). tour.css adds `.tour-visual canvas` rule.

2026-04-26 — Tour Art Pass complete:
  614932a: TourDiagram.js full art rewrite — bloom/softglow/hardblur SVG filter system (diagram-scoped IDs), painted Earth spheres, continent outlines, 9 stations in d04 (+GLT), d05 sidelobe→photon-ring transformation, BHEX data beam, luminous CTA, 14 new CSS keyframes in tour.css, earth-group-cinema transform-origin updated to 290×350.
  f12d196: Tour layout fix — visual area 68vh top, text panel at bottom, zero overlap.

2026-04-26 — Tour Cinematic Rewrite complete:
  d3b13b0: Tour reduced from 12 to 8 acts. New animPhase state machine (visual→text→ready) in Tour.js; 3 timer refs (animTimerRef/textTimerRef/chapterTimerRef) all cleared at start of each actIndex effect. Chapter title cards (2.2s overlay) before acts 3 and 6. TourCard.js: visibleCount single-effect (not two effects — prevents flash). TourDiagram.js: 8 SVG functions, viewBox 1200×700, deep-space visual language. Real EHT M87* JPEG added as assets/eht-m87-2019.jpg (36KB). tour.css: new keyframes (waveSweepCinema, earthRotateCinema, drawArc, stationReveal, scrubberMove, imageReveal, panelSlideIn), UV arc stroke-dashoffset classes, sequential station-dot stagger.

2026-04-24 — P1/P2/P3 UI polish + tour rewrite:
  P1: compare button moved to top of AppSidebar; array preset auto-loads on select (Load Array button removed); Export FITS button removed from ContourMap UI (fitsExport.js code preserved); MEM removed from UI — ContourMap has Dirty/CLEAN toggle (state key 'clean', data source restoredData unchanged); SimPane: collapsible telescope section with BHEX inside; ControlsPanel: method-row removed entirely.
  P2: CSS transitions (buttons lift/snap), MetricsPanel/modal fadeSlideIn, select hover border, slider thumb highlight. All transitions suppressed by media query + [data-reduced-motion]. --accent-orange: #ff9f43 added to :root.
  P3: Tour.js rewritten (12-act intermediate), TourCard.js rewritten (full-screen layout), TourDiagram.js rewritten (canvas+rAF→SVG). tour.css rewritten for full-screen overlay. Superseded by d3b13b0 above.

2026-04-24 — S9–S12 complete:
  S9: INFO.sourceSize tooltip updated (42/50 μas). MetricsPanel.js (new). dynamicRange lifted to useSimulation useMemo (MAD). beamFwhm useMemo. uvCount state added. ContourMap accepts dynamicRange as prop.
  S10: UVMap.js: SNR color mode (hsl 45, grey→gold). pairSefdMap prop (keyed on pairId string). Toggle button. pairSefdMap built in useSimulation useMemo.
  S11: fitsExport.js (new): FITS binary, WCS headers, big-endian float32, 2880-byte blocks, row-flipped. handleExportFITS in useSimulation. Export FITS button in ContourMap.
  S12a: useSimulation.js (new): all sim state, effects, memos, handlers extracted from App.js. App.js now global UI only.
  S12b: SimPane.js (new): compact pane for compare mode (Globe+controls+UVMap+images+ContourMap). App.js: two useSimulation instances (left/right), compareMode state, compare layout. AppSidebar: compare button.
  S12c: Globe ResizeObserver confirmed correct in 280px compact pane. .btn-ghost.btn-active CSS added.

2026-04-24 — S8 complete: physically correct source angular size. effectiveSourceFraction useMemo in App.js; SKY_TARGETS.shadowUas (M87*=42, Sgr A*=50, others null); SOURCE SIZE slider hidden for named targets; read-only info line shows shadowUas and % of FOV.

2026-04-23 — Four-session physics+display upgrade complete (S4/S5/S6/S7):
  S4: worker.js: elliptical CLEAN restore beam (dual-axis PSF scan → sigmaU/sigmaV); ContourMap: beam ellipse uses measured sigmaU/sigmaV props; App.js: beamDims state
  S5: uvCompute.js: MIN_ELEVATION_RAD=10°, computeElevation(); 10° elevation cutoff applied in both computeUVPoints AND computeUVPointsGl — SPT excluded at M87* (dec=+12°), GLT excluded at Sgr A* (dec=-29°)
  S6: ContourMap inner ticks fixed (fovMuas/4 not fovMuas/2); dead EARTH_DIAM_M/pixelScale_uas code removed; StatusBar baseline stats (km + Gλ); PhysicsNotesModal: SEFD + BHEX sections; CitationModal: conditional BHEX (arXiv:2406.12917) + ngEHT (arXiv:2306.08787) references; ctx.fillText replaced with HTML overlay for empty state
  S7: SKY_TARGETS added to constants.js; App.js: selectedTarget state (default M87*), declination default 12.391°; ControlsPanel: Target dropdown hides declination slider for named targets, shows read-only Dec value

2026-04-22 — Three-session physics upgrade complete (S1/S2/S3):
  S1: constants.js: TELESCOPE_COLORS extended to 17, ARRAY_PRESETS (3 presets), STATION_SEFD added; App.js+AppSidebar.js: array preset dropdown + Load Array button replaces single "Load EHT Array" button
  S2: computeUVPoints returns {uvPoints, stationPairs}; worker: physical beam taper (1.02λ/D+fovRad), CLEAN stops at 3×noiseRms, per-baseline SEFD noise model (addPerBaselineNoise); worker protocol extended with fovRad, stationPairs, sefdMap
  S3: BHEX_PRESET added; computeSatelliteECEF (Keplerian); ground-space baseline loops in both UV pipelines; globeHelpers: syncSatelliteMarkers (orbital ring + gold sphere); Globe.js: satelliteGroupRef; TelescopeList: handles type==='space'
2026-04-20 — uvCompute.js: added computeUVPointsGl (Gλ display pipeline); UVMap: rewrote to use Gλ coords with auto-scale; App.js: uvPointsGl state added, fovMuas default 538→80; UV display and reconstruction pipelines are now fully independent.
2026-04-16 — IMAGE_SIZE updated to 512; ContourMap boundary clip noted; sourceFraction default updated to 0.50; worker protocol N updated.
2026-04-12 — Full reconstruction to cover vlbi-react as live active codebase (post Phase-1 commit bc212cb).
