# Architectural Decisions
# _knowledge/decisions.md
#
# Every significant architectural decision, when it was made, and why.
# This prevents re-litigating settled decisions and documents tradeoffs.
# Claude checks this before proposing architectural changes.

---

## Decision Log

### Plain scripts — no ES modules, no bundler (root app)
DATE: 2026-03-16
LAST_VERIFIED: 2026-03-16
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: All JS files use plain `<script>` tags loaded in dependency order in index.html. No `type="module"`, no Webpack/Vite/Rollup.
RATIONALE: The app is a self-contained educational tool. Zero build toolchain means anyone can clone and open index.html directly — no npm install, no node version management.
ALTERNATIVES_REJECTED: ES modules — would require a local server (CORS restrictions on file:// for module imports); bundler — adds complexity with no benefit for a 5-file project.
TRIGGERS_REVIEW_IF: Project grows to 10+ JS files and cross-file imports become hard to track manually; or a test runner is introduced.

---

### math.js for FFT (not a dedicated FFT library)
DATE: 2026-03-16
LAST_VERIFIED: 2026-03-16
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: Use math.js `math.fft` / `math.ifft` for the 1D transforms that underpin the 2D FFT.
RATIONALE: math.js is a general-purpose math library already needed for complex number arithmetic (`math.complex`). Using one library instead of two reduces CDN dependencies.
ALTERNATIVES_REJECTED: `fft.js` (no complex number type); `ndarray-fft` (adds ndarray as transitive dependency).
TRIGGERS_REVIEW_IF: FFT performance becomes a bottleneck; or Web Worker refactor is attempted (at which point lightweight inlined FFT is attractive).

---

### Fixed IMAGE_SIZE = 256 (power-of-2, not user-configurable)
DATE: 2026-03-16
LAST_VERIFIED: 2026-03-16
EXPIRES: NEVER
STATUS: SUPERSEDED — see "IMAGE_SIZE increased to 512" below

DECISION: All uploaded images are resized to 256×256 on load. Hardcoded in both root `imageProcessor.js` and `vlbi-react/js/constants.js`.
RATIONALE: FFT requires power-of-2 input. Fixing size at load time avoids runtime validation and keeps mask/FFT array dimensions constant. 256 is large enough for educational demonstration while keeping FFT time under ~300ms.
ALTERNATIVES_REJECTED: 512×512 — 4× slower FFT; dynamic sizing — requires power-of-2 enforcement and dynamic mask sizing.
TRIGGERS_REVIEW_IF: 256 looks too pixelated; Web Worker is introduced (removing blocking concern, making 512 viable).

---

### UV normalization: Earth diameter → N/2 pixels
DATE: 2026-03-16
LAST_VERIFIED: 2026-03-16
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: UV coordinates normalized so Earth's diameter (2 × 6371 km) maps to N/2 image pixels (Nyquist frequency). Scale = `(N/2) / (2 × R_earth)`. In vlbi-react, additionally scaled by `freqRatio = frequency/230` to support the frequency slider.
RATIONALE: Normalizing to Earth geometry makes telescope placement the only variable, which is the educational point.
ALTERNATIVES_REJECTED: Per-session auto-scaling to max baseline — UV plane shifts as telescopes are added, which is confusing.
TRIGGERS_REVIEW_IF: Angular size feature added (would require wavelength-based normalization for μas axis to be meaningful).

---

### Conjugate symmetry enforced in computeUVCoverage / computeUVPoints
DATE: 2026-03-16
LAST_VERIFIED: 2026-04-12
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: For every UV point (u,v), its conjugate pair (-u,-v) is also added. In root app: in `computeUVCoverage`. In vlbi-react: in `computeUVPoints` (uvCompute.js).
RATIONALE: FFT of a real-valued image has conjugate symmetry: F[-u,-v] = conj(F[u,v]). Sampling only one of a pair produces non-trivial imaginary output from IFFT, introducing artifacts.
TRIGGERS_REVIEW_IF: Never — mathematical requirement.

---

### Debounce runReconstruction at 50ms (root app)
DATE: 2026-03-16
LAST_VERIFIED: 2026-03-16
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: `runReconstruction()` in root `app.js` is a debounce wrapper. Web Worker in vlbi-react uses `recoId` stale-result detection instead (worker runs async, debounce via useEffect dependency).
RATIONALE: `loadPresets()` calls `addTelescope` 6 times in rapid succession; debounce collapses batched updates into a single reconstruction run.
TRIGGERS_REVIEW_IF: onChange pattern replaced with explicit "compute" button.

---

### FFT runs on main thread (root app only)
DATE: 2026-03-16
LAST_VERIFIED: 2026-03-16
EXPIRES: NEVER
STATUS: ACTIVE (root app only — vlbi-react uses Web Worker)

DECISION: Root app wraps FFT in `setTimeout(..., 10)` to allow "Reconstructing…" to render before block.
NOTE: vlbi-react supersedes this with a proper Web Worker. This decision applies only to the legacy root app.
TRIGGERS_REVIEW_IF: Root app is brought to feature parity with vlbi-react (would warrant Web Worker migration).

---

### htm/preact via import maps — no bundler for vlbi-react
DATE: 2026-03-16
LAST_VERIFIED: 2026-04-12
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: vlbi-react uses React 18 + htm/preact via `<script type="importmap">` in index.html. No npm, no bundler, no build step.
RATIONALE: Preserves zero-install open-in-browser DX established by root app. Import maps allow ES module syntax without a build step.
ALTERNATIVES_REJECTED: Vite/CRA — adds build step and npm dependency; true React from CDN with UMD — no JSX without Babel transform.
TRIGGERS_REVIEW_IF: Project needs tree-shaking or npm ecosystem features (at which point Vite migration is warranted).

---

### Web Worker for reconstruction in vlbi-react
DATE: 2026-03-16
LAST_VERIFIED: 2026-04-12
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: All FFT + CLEAN + MEM computation runs in `worker.js` (a dedicated Web Worker).
RATIONALE: CLEAN runs 1000 iterations; MEM runs 120. Both block main thread for 500-2000ms without a worker. Web Worker keeps globe and controls responsive during reconstruction.
ALTERNATIVES_REJECTED: setTimeout deferral (root app approach) — still blocks main thread; requestIdleCallback — no guarantee of timely execution for compute-heavy tasks.
TRIGGERS_REVIEW_IF: SharedArrayBuffer becomes available with COOP/COEP headers (would enable more efficient data sharing).

---

### Worker is self-contained — no import statements
DATE: 2026-03-16
LAST_VERIFIED: 2026-04-12
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: `worker.js` defines its own `fft1d`, `fft2d`, and all helpers inline. No import statements.
RATIONALE: `new Worker(url)` creates a classic worker that cannot use import maps. Adding `type:'module'` to the worker would require a server (CORS on `file://`). Self-contained = zero friction.
ALTERNATIVES_REJECTED: `new Worker(url, { type: 'module' })` — requires serving via HTTP, breaks file:// usage.
TRIGGERS_REVIEW_IF: App is permanently served via HTTP (at which point module workers become viable).

---

### Transferable buffers in worker postMessage
DATE: 2026-03-16
LAST_VERIFIED: 2026-04-12
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: Worker posts `dirty` and `restored` Float64Arrays using the transferable buffers API: `postMessage({...}, [dirty.buffer, restored.buffer])`.
RATIONALE: At N=256, each Float64Array is 256×256×8 = 524KB. Structured clone would copy both, totaling ~1MB per reconstruction. Transferable is zero-copy.
CONSEQUENCE: After transfer, `dirty.buffer.byteLength === 0` in the worker. App.js receives detached-free copies. App must not retain references to these arrays after passing them to the worker.
TRIGGERS_REVIEW_IF: Never — performance requirement.

---

### Marching squares for contours (not d3-contour)
DATE: 2026-04-01
LAST_VERIFIED: 2026-04-12
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: ContourMap.js implements marching squares from scratch (~80 lines) for isocontour extraction.
RATIONALE: No bundler = no d3 tree-shaking. d3-contour + d3-geo ≈ 70KB CDN weight for a single feature. Pure implementation has no dependencies.
ALTERNATIVES_REJECTED: d3-contour via CDN — heavy; conrec.js — older, less maintained.
TRIGGERS_REVIEW_IF: Contour quality needs to improve significantly and pure implementation reaches its limit.

---

### Island filter: groupSegments(tol=0.1) + maxDim < 15
DATE: 2026-04-12
LAST_VERIFIED: 2026-04-12
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: After marching squares, segments are grouped by proximity using `groupSegments(segs, tol=0.1)`. Groups where `groupBBoxMaxDim(group) < 15` are discarded as false islands.
RATIONALE: Reached after 10+ measurement iterations. At tol=0.1, real contour arcs and false noise islands form separate groups (islands don't touch real arcs at sub-pixel proximity). Real arcs have maxDim 37-188px; false islands have maxDim 5-13px. Threshold at 15 cleanly separates them.
DO NOT CHANGE: tol to any value > 0.1 — at tol=1.5, islands merge with real arcs into one group that passes the filter. maxDim threshold below 15 — leaves visible noise islands; above 20 — may clip real short arcs at low DR.
TRIGGERS_REVIEW_IF: Source images with very compact structure produce short legitimate arcs that are filtered; only revisit with measurement data showing real arc maxDim < 15.

---

### All canvas text → HTML overlay (ContourMap)
DATE: 2026-04-12
LAST_VERIFIED: 2026-04-12
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: ContourMap.js uses zero ctx.fillText calls. All text labels (axis ticks, colorbar values, contour level badges, beam label) are rendered as HTML elements overlaid on the canvas.
RATIONALE: Canvas renders at 512×512px; CSS scales it to panel width (~350-400px). Text placed near canvas edges clips outside the visible CSS-scaled area at any panel width. HTML overlay elements are immune to canvas CSS scaling — they position relative to the container div.
IMPLEMENTATION: `.contour-tick-overlay` (position:absolute, pointer-events:none) for axis tick labels; `.contour-cb-labels` flex row for colorbar values; `.contour-cb-levels` flex row for level badges.
TRIGGERS_REVIEW_IF: Never — architectural pattern for this rendering approach.

---

### Adaptive dynamic range thresholds for contour levels
DATE: 2026-04-12
LAST_VERIFIED: 2026-04-12
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: ContourMap.js shows contour levels adaptively based on dynamic range:
- DR < 80: show 50% only
- DR 80-200: show 50% + 10%
- DR > 200: show all three (50%, 10%, 2%)
RATIONALE: Low-DR arrays (few telescopes, short observation) produce noise-dominated images where 2% and 10% contours would trace noise structure rather than real signal. Adaptive switching prevents misleading displays.
TRIGGERS_REVIEW_IF: A sigma-based threshold proves more robust than DR-based (would require computing actual noise floor and comparing to contour level).

---

### Default displayMode = 'dirty' in ContourMap
DATE: 2026-04-12
LAST_VERIFIED: 2026-04-12
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: ContourMap shows the dirty image (raw IFFT) by default. User switches to CLEAN or MEM to see deconvolution.
RATIONALE: Pedagogically, the dirty image is the honest starting point — it shows what you get without deconvolution. CLEAN/MEM improvements are then visible as a deliberate user action, reinforcing the educational message.
TRIGGERS_REVIEW_IF: User research suggests visitors find dirty image confusing as a starting state.

---

### Phase 2 blocked on angular size
DATE: 2026-04-12
LAST_VERIFIED: 2026-04-24
EXPIRES: UNTIL_MEETING
STATUS: SUPERSEDED — see "Physically correct source angular size" decision below. Phase 2 unblocked 2026-04-24.

DECISION: No Phase 2 features to be implemented until angular size is resolved with Prof. Cárdenas-Avendaño.
RATIONALE: Current implementation always fills the full FOV with the source, regardless of source size parameter. This is not physically correct — a source at a given declination and distance should subtend a specific angle. Phase 2 features (source size slider, multi-source, etc.) built on top of incorrect FOV behavior will need to be rewritten.
TRIGGERS_REVIEW_IF: Meeting with Prof. occurs and angular size implementation is agreed upon.

---

### IMAGE_SIZE increased to 512
DATE: 2026-04-16
LAST_VERIFIED: 2026-04-16
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: IMAGE_SIZE changed from 256 to 512 in `vlbi-react/js/constants.js`.
RATIONALE: At N=256 with FOV=538 μas, the synthesized beam is 2.3 pixels — insufficient for CLEAN to restore ring structure meaningfully. At N=512 the beam becomes 4.6 pixels, M87* source becomes 40 pixels, and reconstruction quality improves substantially. Worker benchmark: N=512 CLEAN runs in 414ms — acceptable for a Harvard EHT demo audience.
CONSEQUENCES: Memory per reconstruction doubles (Float64Array goes from 512KB to 2MB). Worker transfer time increases proportionally but remains imperceptible.
TRIGGERS_REVIEW_IF: N=1024 is needed for beam to reach 8+ pixels at M87* physical scale.

---

### UV display uses independent Gλ pipeline (separate from reconstruction UV)
DATE: 2026-04-20
LAST_VERIFIED: 2026-04-20
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: `computeUVPointsGl` in uvCompute.js produces UV coordinates in gigawavelengths (Gλ) centered at (0,0), independent of FOV and image grid size. UVMap.js receives these Gλ points and auto-scales the canvas to the max UV extent × 1.2, labeling axes in Gλ. The reconstruction pipeline continues to use `computeUVPoints` which returns pixel-space coordinates (offset by N/2) scaled to the image FOV.
RATIONALE: At small FOV (e.g. 80 μas for M87*), `computeUVPoints` pixel coordinates are sub-pixel (~0.001px). Using them for canvas display produces all points clustering at canvas center — completely invisible. FOV-independent Gλ coordinates scale correctly at any FOV.
ALTERNATIVES_REJECTED: Adjusting `computeUVPoints` to produce display-friendly coordinates — would contaminate reconstruction inputs; separate scaling factor in UVMap — still mixes pixel-space and physical-space causing the same clustering bug.
TRIGGERS_REVIEW_IF: UV display needs to show axis labels in a different unit (Mλ, kλ) — trivial scale change in computeUVPointsGl.

---

### Per-baseline SEFD noise model — RMS-relative scaling
DATE: 2026-04-22
LAST_VERIFIED: 2026-04-22
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: Worker noise uses `σ ∝ sqrt(SEFD_i × SEFD_j) / sefdGeomMean × visRms × noiseScale`. Noise is injected in the UV domain per-point using the stationPairs array parallel to uvPoints. The SEFD geometric mean across all pairs is used to preserve the slider's absolute noise level (noiseScale=1 ≈ same total noise as before).
RATIONALE: The spec's literal formula (σ = sqrt(SEFD_i × SEFD_j) / sqrt(2 × BW × t_int)) gives σ in Jy (~0.002 Jy), incompatible with normalized vis values (~1.0). RMS-relative scaling makes ALMA baselines ~0.15× quieter and SMT/SPT ~2.1× noisier — physically correct relative differences — while keeping the slider behavior unchanged. Confirmed by Prof. Cárdenas-Avendaño.
ALTERNATIVES_REJECTED: Literal Jy formula — would produce near-zero noise regardless of slider setting; flat noise (same σ all baselines) — physically incorrect, misses the key educational point about SEFD differences.
TRIGGERS_REVIEW_IF: Absolute thermal noise in Jy/beam is needed for quantitative publications (would require proper bandwidth and integration time parameters).

---

### Physical beam taper: 1.02λ/D with fovRad
DATE: 2026-04-22
LAST_VERIFIED: 2026-04-22
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: Primary beam taper in worker.js uses `FWHM = 1.02λ/D` (Airy disk approximation). `fwhm_px = (fwhm_rad / fovRad) * N`. Worker receives `fovRad` explicitly in params (computed from fovMuas in App.js).
RATIONALE: Previous formula `sigmaPx = (N/2) × (25/D) × (230/f) × 1.5` was empirically calibrated and broke at non-default FOV/dish combinations. Physical formula is correct at any parameter setting. fovRad is passed explicitly to avoid recomputing from fovMuas inside the worker.
TRIGGERS_REVIEW_IF: Dish shape or illumination pattern changes (e.g. ALMA 12m vs 7m subarray mixing).

---

### CLEAN stopping: 3×noiseRms (border estimator)
DATE: 2026-04-22
LAST_VERIFIED: 2026-04-22
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: CLEAN stops when the residual peak falls below `3 × estimateNoiseRms(dirty, N)`. `estimateNoiseRms` samples the outer 10% border pixels and returns `sqrt(mean(px²))`.
RATIONALE: 5%-of-peak stopping was noise-level dependent — high noise images over-cleaned (chasing noise peaks past the signal), low noise images under-cleaned (stopped too early when peak was still large). Border-based noise floor estimation is standard in radio astronomy (CASA CLEAN default). 3σ is the canonical detection threshold.
TRIGGERS_REVIEW_IF: Very compact sources where border pixels contain significant source flux — the noise estimator would over-estimate noise. Only revisit if very high-resolution M87* imaging is required.

---

### Space telescope UV: Keplerian circular orbit, per-step ECEF position
DATE: 2026-04-22
LAST_VERIFIED: 2026-04-22
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: BHEX orbit is modeled as a Keplerian circular orbit. At each hour-angle step, `computeSatelliteECEF(sat, t_hours)` returns the ECEF position via perifocal-frame rotation: `x_orb = r*cos(θ), y_orb = r*sin(θ)`, then RAAN+inclination rotation. Ground-space baselines are computed per step (not as a fixed baseline vector) because the satellite position changes significantly over a 12h observation.
RATIONALE: At 26,562 km altitude, the satellite moves ~230 km/hr. Using a fixed baseline vector would give a single UV point instead of a sweep arc. Per-step computation produces physically correct UV tracks showing the space-baseline's varying projection.
ALTERNATIVES_REJECTED: Fixed baseline vector (uses average position) — correct only for geostationary satellites; full orbit propagation (J2, drag) — unnecessary precision for educational demonstration.
TRIGGERS_REVIEW_IF: Non-circular orbit (BHEX is circular by design). If orbital parameters change from the approved values (alt=26562, inc=86, RAAN=277.7, period=12h), update BHEX_PRESET.

---

### Globe satellite rendering: 1.5× visual radius, ascending node position
DATE: 2026-04-22
LAST_VERIFIED: 2026-04-22
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: `syncSatelliteMarkers` places the BHEX sphere at the ascending node (θ=0) at `VISUAL_R = 1.5` (1.5× globe unit radius). The orbital ring is drawn as 64 line segments in the orbital plane (perifocal→ECEF rotation), also at 1.5× radius. ECEF→Three.js mapping: `three_x=ECEF_x, three_y=ECEF_z, three_z=-ECEF_y`.
RATIONALE: 26,562 km / 6,371 km ≈ 4.2× real scale — displaying at true scale would put the marker far off-screen. 1.5× is visually informative (clearly "in orbit" above the globe) while fitting the viewport. Ascending node is a well-defined, reproducible position. ECEF→Three.js mapping follows Three.js Y-up convention (Three.js Y = geographic Z; Three.js Z = negative geographic Y).
TRIGGERS_REVIEW_IF: Multiple space telescopes added at different altitudes — would need altitude-proportional visual scaling.

---

### Physically correct source angular size: effectiveSourceFraction = shadowUas / fovMuas
DATE: 2026-04-24
LAST_VERIFIED: 2026-04-24
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: Source angular size for named targets is derived as `effectiveSourceFraction = shadowUas / fovMuas`, clamped to [0.05, 0.95]. This is a `useMemo` in App.js, never stored in state. `controls.sourceFraction` is preserved for the Custom target path and the reset handler.
RATIONALE: Physical radio source sizes are fixed angular quantities (M87* shadow = 42 μas, Sgr A* = 50 μas per EHT 2019/2022). The source must occupy the correct fraction of the FOV to be scientifically defensible at a Harvard EHT talk. Deriving it from shadowUas/fovMuas makes it automatically correct at any FOV, which eliminates the "source fills entire FOV" artifact that was Phase 2's primary blocker. Approved by Prof. Alejandro Cárdenas-Avendaño.
ALTERNATIVES_REJECTED: Static sourceFraction per target (doesn't auto-scale with FOV); keeping user slider for all targets (physically wrong for named sources).
TRIGGERS_REVIEW_IF: Shadow size measurements are revised by EHT publications (update shadowUas in SKY_TARGETS); new named target added (must include shadowUas or null).

---

### SOURCE SIZE slider hidden for named targets; shown only for Custom
DATE: 2026-04-24
LAST_VERIFIED: 2026-04-24
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: ControlsPanel.js shows the SOURCE SIZE range slider only when `selectedTarget === 'Custom'`. For named targets with `shadowUas !== null`, a read-only info line shows `"Source: N μas (X% of FOV)"`. For named targets with `shadowUas === null` (3C 279, Cen A — point-like/extended), neither slider nor info line is shown.
RATIONALE: Exposing a source size slider for physically constrained targets (M87*, Sgr A*) would let users set scientifically wrong values — incompatible with the Harvard EHT talk standard. Point sources (3C 279) have no meaningful shadow size to display.
TRIGGERS_REVIEW_IF: A named target is added that has a range of plausible shadow sizes (would warrant a "shadow uncertainty" display rather than a fixed value).

---

---

### All simulation state in useSimulation hook, not App.js
DATE: 2026-04-24
LAST_VERIFIED: 2026-04-24
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: All simulation state, effects, memos, and handlers live in `useSimulation.js`. App.js holds only 7 global UI state pieces (compareMode, infoKey, physicsNotesOpen, citationOpen, a11y, a11yOpen, tourActive/Index).
RATIONALE: S12b required two independent simulation instances for compare mode. React hooks cannot be called conditionally — both instances must always be instantiated. Extracting all sim logic to a hook (S12a) made the two-instance pattern clean and testable. App.js became a thin layout shell.
ALTERNATIVES_REJECTED: Keep sim state in App.js and duplicate/share — would require lifting all state to a parent that doesn't exist, or creating a global context (overkill for 2 panes); prop drilling from App.js — would require all sub-components to accept both left/right sim states.
TRIGGERS_REVIEW_IF: More than 2 simultaneous sim panes are needed (would warrant a sim array or context).

---

### Compare mode: two useSimulation instances always instantiated
DATE: 2026-04-24
LAST_VERIFIED: 2026-04-24
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: App.js always calls `const left = useSimulation()` and `const right = useSimulation()`, even in single-pane mode. In single-pane, `right` is idle (zero telescopes). In compare mode, both render as `SimPane` components. The `right` sim starts with EHT 2017 loaded (from its auto-load effect) — this is intentional.
RATIONALE: React hooks cannot be called conditionally. Always instantiating both means `right.telescopes` accumulates EHT 2017 on mount, so when the user enters compare mode Config B is immediately usable rather than empty. Two Web Workers run in the background regardless — acceptable performance cost.
CONSEQUENCE: Two Web Workers always running. Memory cost ~4MB (two 2MB Float64Array sets). This is noted in the UI header in compare mode.
TRIGGERS_REVIEW_IF: Memory or CPU concern on low-end hardware during demos.

---

### dynamicRange computed in useSimulation hook, passed as prop to ContourMap
DATE: 2026-04-24
LAST_VERIFIED: 2026-04-24
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: Dynamic range (DR) is computed as a `useMemo` in `useSimulation.js` and passed as a prop to both ContourMap and MetricsPanel. ContourMap still computes its own local sigma for the statsText σ: display line, but does NOT re-derive DR from it. The prop-sourced DR drives adaptive contour thresholds.
RATIONALE: MetricsPanel needed DR for the `DR:1` metric. Computing it twice (once in ContourMap internally, once in App.js/hook) would risk divergence. Single source of truth in the hook is canonical.
ALGORITHM: MAD-based, 10% border margin. `madSigma = 1.4826 × median(|border − median(border)|)`. safeSigma guard: if madSigma is non-finite, zero, or > maxV×0.1, use maxV×0.01 fallback.
TRIGGERS_REVIEW_IF: A sigma-based contour threshold (2σ, 3σ) proves more physical than DR-based (would require passing the noise sigma itself as a prop alongside DR).

---

### FITS export: WCS headers, big-endian float32, 2880-byte blocks
DATE: 2026-04-24
LAST_VERIFIED: 2026-04-24
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: `fitsExport.js` writes a valid FITS file with WCS headers using `application/fits` MIME type downloaded via Blob URL. FITS standard requires: big-endian float32 (`dv.setFloat32(offset, value, false)`), 80-char fixed-width header cards, padding to 2880-byte block boundaries (both header and data sections), row 0 = bottom of image (rows flipped: `fitsRow = N - 1 - row`). CDELT1 is negative (RA increases left).
RATIONALE: FITS is the standard radio astronomy image format. WCS headers (CRVAL1/2, CDELT1/2, CRPIX1/2) are required for any downstream tool (CASA, ds9, astropy) to display the image with correct sky coordinates.
CRITICAL: Peak finding uses a for-loop — NEVER `Math.max(...Float64Array)` which stack-overflows at N=512 (262144 elements).
TRIGGERS_REVIEW_IF: 4D FITS (NAXIS=4, RA/Dec/frequency/Stokes) is needed for full radio astronomy compatibility.

---

## Contradiction Scanner

Claude runs this check when adding a new decision:
1. Read all ACTIVE decisions
2. Check if new decision conflicts with any existing one
3. If conflict found: FLAG before adding — do not silently overwrite
4. Format: ⚠ CONFLICT: [new decision] conflicts with [existing decision] — resolve before proceeding
