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

### MEM removed from UI; ContourMap has Dirty/CLEAN toggle only
DATE: 2026-04-24
LAST_VERIFIED: 2026-04-24
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: ControlsPanel.js no longer shows method buttons. ContourMap.js shows a two-button toggle: "Dirty" and "CLEAN" (displayMode values: `'dirty'` / `'clean'`). MEM code remains in worker.js. Export FITS button removed from ContourMap UI; `fitsExport.js` and `handleExportFITS` in useSimulation preserved.
RATIONALE: MEM is algorithmically correct but produces visually similar output to CLEAN for demo purposes. Removing it simplifies the UI and avoids user confusion. The displayMode key was renamed from `'restored'` to `'clean'` for clarity; the data source (`restoredData` from worker) is unchanged. Export FITS is preserved in code for future use.
ALTERNATIVES_REJECTED: Keeping MEM button behind a disclosure — adds visual noise for no educational gain at a live demo.
TRIGGERS_REVIEW_IF: A demo scenario requires showing MEM/CLEAN comparison, or FITS export is re-added as a primary workflow.

---

### Tour: 12-act full-screen overlay with SVG+CSS diagrams
DATE: 2026-04-24
LAST_VERIFIED: 2026-04-24
EXPIRES: NEVER
STATUS: SUPERSEDED — see "Tour: 8-act cinematic" below (2026-04-26)

DECISION: Tour.js/TourCard.js/TourDiagram.js fully rewritten (P3). Layout: fixed full-screen overlay, 2-column body (60% SVG diagram / 40% text), progress dots, keyboard nav (← → Esc). 12 acts. CSS-animated Acts 2/4/8.
NOTE: This was an intermediate state. The 12-act tour was further refined in this same session and replaced with the 8-act cinematic version documented below.

---

### Tour: 8-act cinematic — animPhase state machine, deep-space visual language
DATE: 2026-04-26
LAST_VERIFIED: 2026-04-26
EXPIRES: NEVER
STATUS: SUPERSEDED 2026-06-10 — see "Tour rebuilt: 5 engine-real acts" above. The 8-act count, animPhase
        three-state machine, chapter cards, and TourCard/TourDiagram are all gone. The Tour exported
        signature + autoAction contract it established is preserved by the rebuild.

DECISION: Tour fully rewritten to 8 acts across 3 chapters: Ch I The Problem (acts 1–2), Ch II The Solution (acts 3–5), Ch III The Frontier (acts 6–8). animPhase 3-state machine: 'visual' (SVG animation plays, → arrow disabled) → 'text' (paragraphs reveal 1/800ms, → skips to 'ready') → 'ready' (continue hint pulses, → advances). Chapter title cards (2.2s overlay) appear before acts at actIndex 2 and 5. Tour.js holds all 3 timers as refs (animTimerRef, textTimerRef, chapterTimerRef); all cleared + setChapterCard(false) at the top of every actIndex effect. TourCard.js: visibleCount driven by a single consolidated useEffect (not two separate effects — prevents flash on visual→ready transitions). TourDiagram.js: 8 SVG functions d01()–d08(), viewBox 1200×700, #010103 bg. Real EHT M87* JPEG (assets/eht-m87-2019.jpg, 36KB) used in Act 6 via href="../assets/eht-m87-2019.jpg". Deep-space visual language: gold equations (#FFD700), teal data (#4ecdc4), dark backgrounds. Tour App.js contract unchanged (exported function signature, autoAction types).
RATIONALE: 12-act tour was too long for a live EHT demo. 8 acts covers the complete physics story (single dish → UV sampling → aperture synthesis → EHT → deconvolution → first light → BHEX → simulator) without overrunning attention. The animPhase machine gives each act a cinematic rhythm matching how planetarium shows and science films present concepts: visual first, then prose, then advance. Three explicit timer refs with clearTimeout at effect start prevents stale overlapping timers when the user navigates quickly between acts.
ALTERNATIVES_REJECTED: Pure CSS transitions (no state machine) — cannot conditionally disable the → arrow during visual phase; 12-act tour — too many acts for a live demo; canvas overlay for diagrams — overengineered for mostly-static educational diagrams.
CONSEQUENCES: assets/eht-m87-2019.jpg added at project root (not vlbi-react/assets/ — vlbi-react references root assets as ../assets/); tour.css stores keyframes separate from app.css; SVG camelCase attributes throughout TourDiagram.js.
TRIGGERS_REVIEW_IF: Acts need to be added for ngEHT Phase 1 comparison (increase act count); live UV plane simulation inside the tour is needed (requires canvas overlay in SVG panel); tour needs audio narration (requires audio sync layer).

---

### AppSidebar: compare button at top; array preset auto-loads on select
DATE: 2026-04-24
LAST_VERIFIED: 2026-04-24
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: Compare Mode button is at the top of the sidebar (above all sections), teal-bordered when active. The array preset `<select>` auto-triggers `onLoadArray(value)` in its onChange handler — the separate "Load Array" button is removed. `handleLoadArrayPreset` accepts a `nameOverride` string parameter; guard: `typeof nameOverride === 'string'` prevents SyntheticEvent passthrough when called without args.
RATIONALE: Compare mode is the primary advanced feature and should be visually prominent. Auto-load on select reduces clicks and makes the preset selector behave like every other preset UI in the app. The `nameOverride` type guard is necessary because React onChange fires before state settles — the newly selected value must be passed directly, not read from state.
TRIGGERS_REVIEW_IF: Array preset selection needs a confirmation step (e.g. "this will clear current telescopes — confirm?"). At that point, a two-step select + button flow would be warranted again.

---

### SVG bloom filter architecture: per-diagram scoped IDs
DATE: 2026-04-26
LAST_VERIFIED: 2026-04-26
EXPIRES: NEVER
STATUS: SUPERSEDED — see "TourDiagram.js: Canvas 2D rewrite" below (2026-04-28). TourDiagram.js no longer uses SVG or filters. Pattern still applies if SVG diagrams are ever re-introduced elsewhere.

DECISION: Each d0N() diagram in TourDiagram.js defines its own `<defs>` block with filter IDs scoped to that diagram: `bloom-d01` through `bloom-d08`, `softglow-d01..d08`, `hardblur-d01`, `hardblur-d05`, `starblur-d04`, `starblur-d07`, gradient IDs likewise scoped (e.g. `earthGrad-d03`, `beamGlow1-d01`). Applied via `filter="url(#bloom-d01)"` not via style.
RATIONALE: React may keep prior act SVGs in the DOM during transitions. Shared filter IDs (`bloom`, `softglow`) across multiple inline SVGs would reference whichever `<filter>` the browser encounters first — visually wrong. Diagram-scoped IDs guarantee each SVG references its own filter definition. `filter` is an SVG attribute string, not a style property — must not be placed in a camelCase style object.
ALTERNATIVES_REJECTED: Single shared `<defs>` block at document level — conflicts with React rendering model where each TourDiagram SVG is self-contained; class-level filter override — SVG doesn't support inheriting filter from class selector in the same way.
TRIGGERS_REVIEW_IF: Tour diagrams are refactored into individual files and each gets its own `<defs>` scoped naturally to its file scope.

---

### d05: single-canvas sidelobe→photon-ring transformation (replacing scrubber wipe)
DATE: 2026-04-26
LAST_VERIFIED: 2026-04-26
EXPIRES: NEVER
STATUS: SUPERSEDED 2026-06-10 — TourDiagram.js (incl. d05) deleted in the engine-real rebuild. The
        deconvolution concept now lives in sceneC.js as a REAL CLEAN run (dirty→restored, live residual
        sparkline), not a drawn transformation.

DECISION: Act 5 (CLEAN deconvolution) replaced the scrubber-wipe animation (a rect sliding over a dirty/CLEAN two-panel layout) with a single-canvas transformation: 5 concentric rings (sl-ring-1..5) fade out in staggered sequence via `sidelobeRingFade1–5` keyframes, a gold photon ring emerges via `photonRingReveal`, a black interior appears via `shadowReveal`, and the label transitions from "Dirty Image" (`labelDirtyFade`) to "CLEAN Image" (`labelCleanFade`). All centered at cx=600, cy=330.
RATIONALE: The scrubber wipe was visually flat and didn't convey the physics of deconvolution. The sidelobe→photon-ring transformation visually encodes the key concept: CLEAN removes sidelobes and reveals the true photon ring structure. Five staggered rings give a sense of layers being peeled away. The single-canvas approach avoids the geometry coupling between SVG coordinates and CSS translateX distance that caused gotcha #d05-scrubber.
ALTERNATIVES_REJECTED: Scrubber wipe — retained as CSS code (scrubberMove keyframe preserved in tour.css) but unused; side-by-side dirty/CLEAN panels — less dramatic and doesn't express the transformation concept.
TRIGGERS_REVIEW_IF: A more physically accurate deconvolution animation is developed (e.g. iterative CLEAN steps as separate frames).

---

### Tour animation: one motion per act, documentary pacing
DATE: 2026-04-27
LAST_VERIFIED: 2026-04-27
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: Each tour act in TourDiagram.js is governed by three design laws: (1) THE LAW — one motion per act; every animated element must teach something or it is cut; (2) EASING LAW — all animations use `cubic-bezier(0.25, 0.46, 0.45, 0.94)` throughout — no linear, no bounce; (3) FILTER LAW — SVG filter IDs must be diagram-scoped (`bloom-d01`..`bloom-d08`). CSS class names for d05 photon ring/shadow/labels are `.photon-ring`, `.bh-shadow`, `.lbl-dirty`, `.lbl-clean` (not the older `.photon-ring-emerge` etc.). CSS class names for d08 panels are `.panel-left`, `.panel-right`, `.fits-panel`, `.metrics-panel-tour`, `.cta-reveal`.
RATIONALE: Smithsonian Art Pass (2026-04-27). Previous tour animations were decorative — multiple concurrent motions competed for attention and didn't teach the physics. Documentary pacing (slow-start-graceful-settle easing, one focal motion per act) matches how science films and planetarium shows present concepts. Class name changes for d05/d08 align with the new single-motion architecture and separate animated from non-animated elements cleanly.
ALTERNATIVES_REJECTED: Multiple concurrent animations — visually distracting; linear easing — feels mechanical, not cinematic; scrubber wipe for d05 — geometry-coupled, fragile, doesn't convey deconvolution physics.
TRIGGERS_REVIEW_IF: A new tour act is added (must define exactly one teaching motion); an act's animation is found to be unclear in user testing (replace with different single motion, not additional motion).

---

### TourDiagram.js: Canvas 2D with requestAnimationFrame (replacing SVG/CSS)
DATE: 2026-04-28
LAST_VERIFIED: 2026-04-28
EXPIRES: NEVER
STATUS: SUPERSEDED 2026-06-10 — TourDiagram.js deleted in the engine-real rebuild. The Canvas-2D-with-RAF
        technique CARRIES FORWARD though: the new per-act scenes (sceneA–E.js) use the same single-canvas
        RAF pattern (setupCanvas at offsetWidth×dpr, cancelAnimationFrame on unmount, reduced-motion final
        frame) via tourScene.js — now drawing REAL engine output instead of illustrations.

DECISION: TourDiagram.js fully rewritten from SVG/htm template literals to Canvas 2D `requestAnimationFrame` loops. d01–d08 are React components rendered via `html\`<${Comp} reducedMotion=${reducedMotion}/>\`` — never called as plain functions. Each uses `useRef` + `useEffect` with mandatory `cancelAnimationFrame` cleanup. `reducedMotion=true` draws T=999 static frame without starting RAF.
RATIONALE: SVG filters cannot achieve additive blending (`ctx.globalCompositeOperation='screen'`), multi-pass glow rendering, organic bezier terrain, or per-pixel diffraction spikes. Canvas 2D can. The design requires: three-pass glow system, chromatic aberration bloom for unresolved sources, 6-spike diffraction for resolved sources, animated star field with twinkle and diffraction spikes for bright stars, Atacama terrain with organic bezier curves. None of these are achievable at quality in SVG without heavy filter chains that break in Safari and fight the browser compositor.
CRITICAL CONSTRAINT: d01–d08 MUST be rendered as `<${d01}/>` (React component invocation), never `d01()` (plain function call). They use `useRef`/`useEffect` — calling as plain functions breaks React's Rules of Hooks. The TourDiagram export uses `comps[diagramId]` array and renders `html\`<${Comp}/>\``.
ALTERNATIVES_REJECTED: SVG with filters — cannot achieve additive blending; Three.js — overkill for 2D diagrams; WebGL — too low-level for the drawing operations needed; keeping SVG — confirmed wrong tool after Smithsonian Art Pass quality bar was set.
TRIGGERS_REVIEW_IF: WebGPU becomes available and the additive blending requirement grows; or a diagram needs 3D rendering that only Three.js can provide (at which point that specific diagram could use a Three.js canvas while others remain Canvas 2D).

---

### tourPhysics.js: single source of computed truth for the tour
DATE: 2026-06-08
LAST_VERIFIED: 2026-06-08
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: Every physics number the tour displays is computed in `vlbi-react/js/tourPhysics.js` from the same constants and formulas the live simulator uses — never hardcoded in the act draw code. `tourPhysics.js` imports `latLonToECEF` from `uvCompute.js` (NOT a copy), `ARRAY_PRESETS`/`SKY_TARGETS`/`BHEX_PRESET`/`STATION_SEFD`/`EARTH_RADIUS_KM` from `constants.js`, and exports a frozen `TOUR_PHYSICS` object with raw values + a `str` namespace of pre-formatted strings + a `fmt` helper. Convention: θ=λ/B and θ=λ/D with NO 1.22 factor (matches `useSimulation.js:224-225`); the 1.22 Rayleigh factor is footnoted only.
RATIONALE: Pre-overhaul the tour hardcoded ~30 physics strings; several were wrong or mutually contradictory (d04 "20 μas" vs d08 "24 μas"/"20 μas" in one act; d02 "B=10,900 km" asserted). Computing from the same source the tool uses makes tour and tool incapable of disagreeing. The EHT 2017 max baseline is actually 11,406 km (IRAM↔SPT) → θ=23.6 μas (displays "24"), not the loose "25"/"20" some sources cite.
CRITICAL CONSTRAINT: latLonToECEF is the one place coordinate drift cannot be allowed (Marrone caught a longitude sign error here, fixed in 54c855b) — import it, never replicate. BHEX figures carry `pending:true`; the characteristic baseline is presented as "B ~ R⊕ + h" (an orbital-radius simplification) with a pending-sign-off tag — NEVER as a clean equality, because the true ground-to-satellite baseline is geometry-dependent (≤ 2R⊕+h).
ALTERNATIVES_REJECTED: Hardcoding numbers in acts (the original approach — produced the contradictions); replicating ECEF math in tourPhysics (drift risk on the one function we can least afford to drift).
TRIGGERS_REVIEW_IF: a new array preset becomes the tour's reference array; BHEX gets expert-validated numbers (remove pending tags); the simulator's resolution convention changes (must update tourPhysics to match).

---

### Tour headline baseline = M87*-observing max (SPT excluded), + Apple-precision deference
DATE: 2026-06-09
LAST_VERIFIED: 2026-06-09
EXPIRES: NEVER
STATUS: ACTIVE

DECISION (refines the tourPhysics decision above): the tour headlines the M87*-OBSERVING max baseline, not the geometric array max. SPT (South Pole) cannot observe M87* (dec +12°), so `tourPhysics.maxBaselineKmVisible` filters stations through the simulator's OWN elevation filter (`computeElevation`+`MIN_ELEVATION_RAD`, now exported from uvCompute.js and imported — never re-implemented) and takes the pairwise max among simultaneously-visible pairs → IRAM–JCMT 10,883 km → θ≈25 μas. Both values are exposed: `ehtMaxBaselineM87Km` (headline) and `ehtArrayMaxBaselineKm` (11,406, geometric, never shown as resolution). Every act labels it with the mandatory "M87*" qualifier. Also fixed a real physics bug: the shadow coefficient is now single-sourced (`bcFormula` radius √27, `shadowDiamFormula` diameter 2√27) so d05/Act6 can't pair the radius coeff with the 42 μas diameter again.
RATIONALE: a reviewer found the prior pass "cookie-cutter, lacking depth/clarity"; an EHT scientist would also balk at 24 μas headlined off a station pair (IRAM–SPT) that never co-observed M87*. 25 μas / Spain–Hawaii matches the published EHT figure and the live tool. The deference half of this pass REMOVED chrome (all HUD corner frames deleted; glass cards cut from 6 acts to just Acts 1 & 5 + a slim integrity panel in d07; concept tags quieted) and built per-act depth (modeled rotating Earth via new `drawPlanet`; subject-owns-frame scale; dirty→clean transformation in d05; visibly-different rings in d07/d08) — the opposite of pass 1's "fix blankness by adding chrome," which was the source of the templated feel.
CRITICAL CONSTRAINT: coordinate set is Marrone-owned — `TOUR-PHYSICS-AUDIT.md` flags the 10,883 vs 11,406 distinction and the coordinate set for sign-off. The elevation/visibility filter must stay imported from uvCompute.js, never copied (same rule as latLonToECEF).
ALTERNATIVES_REJECTED: headlining the geometric array max (11,406/24 μas — misleads, pairs non-co-observing stations); hardcoding 10,883 (would not track coordinate revisions); keeping uniform per-act chrome (the cookie-cutter cause).
TRIGGERS_REVIEW_IF: Marrone revises EHT 2017 coordinates; the tour's reference source changes from M87*; BHEX figures get validated.

---

### DESIGN-LANGUAGE.md + tourTokens.js: the tour conforms to the site, doesn't aspire
DATE: 2026-06-09
LAST_VERIFIED: 2026-06-09
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: The tour's visuals are governed by a single source of visual truth —
`.workflows/_system/DESIGN-LANGUAGE.md` (extracted verbatim from `vlbi-react/css/app.css`), the
visual analogue of `tourPhysics.js`. `vlbi-react/js/tourTokens.js` reads the app's `:root` tokens
at load (`getComputedStyle`, with verbatim fallbacks) and the tour draws from those, never its own
palette. The site is a restrained warm-neutral dark theme with ONE muted-gold accent `#C4A555`
(amber `#9E7E38`, orange `#ff9f43`), Inter + `--font-mono`, flat 1px `#2d2200` panels, 4–6px radii,
no serif/glassy chrome. The tour's CHROME, TYPE, COLOR SYSTEM and SPACING are made indistinguishable
from the app; only the cinematic SCENE ART is licensed to diverge — and even that derives its palette
from the same family (MODERATE: desaturated to gold/amber/orange + neutral + one slate cool `#3a4a6a`;
Earth keeps realistic blue, matching the app's globe).
RATIONALE: prior passes chased an unmeasurable aspiration ("world-class") and kept landing on "better
but not right." The site's own coherence is a checkable target: a tour panel beside an app panel
should be indistinguishable. This fixed the "feels foreign" problem (blue-black bg, bright gold/cyan/
teal, Georgia serif, glassy cards) by re-skinning, NOT redesigning — pass-2 composition gains
(depth, subject scale, modeled Earth, dirty→clean, ngEHT-sharper) were preserved.
CRITICAL CONSTRAINT: this pass changed ZERO physics (the physics check is a no-op). The tour must
reference tokens, never re-hardcode them. The app never uses serif — Georgia/Courier are banned in
the tour; use Inter (text) and `--font-mono` (numeric/equations).
ALTERNATIVES_REJECTED: aspiration-driven restyling (unmeasurable, the root cause); hardcoding the
palette in the tour (drifts from the app); a separate tour theme (the goal is one product).
TRIGGERS_REVIEW_IF: the app's `:root` tokens change meaningfully (tourTokens fallbacks should be
updated to match); a deliberate decision to give the tour its own identity (would supersede this).

---

### Tour rebuilt: 5 engine-real acts (supersedes the 8-act Canvas-2D tour)
DATE: 2026-06-10
LAST_VERIFIED: 2026-06-10
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: The guided tour is rebuilt so EVERY act is a real, engine-driven instrument — genuine
uvCompute/worker output rendered on a canvas — not a hand-drawn illustration. 5 acts (A Resolution,
B Synthesized Aperture, C From Data to Image, D First Light, E Beyond Earth) replace the 8 hand-drawn
TourDiagram scenes. `TourCard.js` and `TourDiagram.js` (1,697 lines) were DELETED. New architecture:
`Tour.js` host + `tourActs.js` (act schema as data) + `tourScenes.js` (registry SCENES[actId]) + per-act
`sceneA–E.js` + `tourScene.js` (canvas primitives) + `tourAnnotations.js` (physics annotations drawn ON
the canvas) + `TourEquation.js` (KaTeX) + `TourSpine.js` (real-UV progress). The Tour exported signature,
App.js wiring, and autoAction types are UNCHANGED. Build order was B first (flagship, pure geometry);
presentation order is A→E. Preceded by the feasibility audit `.workflows/_system/TOUR-ENGINE-AUDIT.md`.
RATIONALE: the prior tour's NUMBERS were already engine-real (tourPhysics.js) but its VISUALS were
illustration — it never called computeUVPoints or the worker. The audit found the engine could drive the
tour for real at small refactor cost (the worker is a classic, non-singleton module — App.js already runs
two). "Impressive because it is real" beats decorative. ~5 deep instruments beat 8 shallow ones (audit §4.1).
The tour never mutates app state mid-act (hosts its own canvases), so a stranger's pre-tour state is
preserved on Skip/Esc for free; only Act E's "Enter the simulator" dispatches loadEHT (deliberate handoff).
ALTERNATIVES_REJECTED: keeping the 8-act Canvas-2D illustrations (the thing being replaced); a spotlight/
overlay of the live app's panels (master prompt §6 — the tour is a standalone cinematic, not a tooltip tour);
two separate builds for talk vs site (one mode flag is simpler — see dual-venue decision).
CONSEQUENCES: supersedes "Tour: 8-act cinematic", "TourDiagram.js: Canvas 2D", "d05 sidelobe→photon-ring",
and "SVG bloom filter architecture" decisions below (all TourDiagram-specific; TourDiagram is gone).
tourPhysics.js (numbers), tourTokens.js (colours), DESIGN-LANGUAGE.md (visual law) remain the SSOTs and
govern the new tour unchanged. Branch feature/tour-world-class-overhaul — NOT yet merged to main.
TRIGGERS_REVIEW_IF: an act needs WebGL/3D (that scene could use a Three.js canvas while others stay 2D);
the act count needs to change (the count must fall out of what can be made real, not the reverse).

---

### Phase 0: simCore.js / simRender.js extraction — behavior-neutral, hook dispatch unchanged
DATE: 2026-06-10
LAST_VERIFIED: 2026-06-10
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: The reconstruction pipeline and renderers were lifted into pure modules so tour acts can drive
them without React. `simCore.js`: `runReconstruction(grayscale,uvPoints,params,onProgress?)` owns its OWN
classic worker per call and resolves a Promise; plus scaleSource, buildSefdMap/buildPairSefdMap,
computeDynamicRange, beamFwhm, angularRes. `simRender.js`: drawContour, drawHot (+ CONTOUR_LEVELS, fmtVal).
useSimulation.js, ContourMap.js, ImageCanvas.js import them back — net behavior identical. CRITICALLY, the
hook's **persistent-worker dispatch effect was left UNCHANGED**: only the pure useMemo bodies now call the
extracted functions. runReconstruction (per-call worker) is for the acts + the timing gate, not the hook.
RATIONALE: "behavior-neutral" was the higher-priority constraint. Rewiring the hook to runReconstruction's
per-call worker would change worker lifecycle and lose the stale-request-id ordering of the existing
debounced dispatch — a real behavior change. The worker being non-singleton (App.js already runs left+right)
is what makes per-call workers safe for the acts. runReconstruction TRANSFERS grayscale.buffer (zero-copy,
matches the app) — callers pass a fresh `.slice()`.
ALTERNATIVES_REJECTED: rewiring the hook to use runReconstruction (alters lifecycle + stale-result handling);
duplicating the pipeline logic in the tour (drift from the tool — the whole point is shared truth).
TRIGGERS_REVIEW_IF: the app is permanently served over HTTP and module workers become viable (could unify).

---

### Tour dual-venue: one build, presenter|guided flag; Act C live per timing gate; worker progressEvery opt-in
DATE: 2026-06-10
LAST_VERIFIED: 2026-06-10
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: One tour build serves both venues via a `mode: 'presenter' | 'guided'` flag (`?mode=presenter`
URL param or the 'P' key; default guided). presenter = minimal text (headline + live equation), advance on
cue; guided = narrative-tier switcher (artist/scientist/layperson), self-paced, interactive affordances.
Act C's architecture was decided by the Phase-0 timing gate (recorded in TOUR-ENGINE-AUDIT.md §2): measured
CLEAN ≈ 98 ms at N=512 (< 300 ms threshold) ⇒ CLEAN recomputes LIVE in both modes; MEM (2350 ms) is
guided-only on-input. The worker gained an OPT-IN `params.progressEvery` that posts {type:'progress',iter,
residual} from the CLEAN loop (powers Act C's live residual sparkline); absent flag ⇒ byte-identical output,
no imports added (classic worker preserved).
RATIONALE: the engine is identical for both venues; only text density, pacing, and the heavy-compute path
differ — a single flag is cheaper than two builds. The timing gate converts the live-vs-precomputed Act C
question from a guess into a measured decision.
ALTERNATIVES_REJECTED: two separate builds (double maintenance for one differing compute); precomputed Act C
playback in all cases (unnecessary — CLEAN is fast enough to be live on dev hardware).
CRITICAL / ⚠ HUMAN TODO: re-run the timing gate on the actual projector-class laptop before the Harvard talk.
If CLEAN there exceeds 300 ms, switch presenter-mode Act C to precomputed playback of cached real frames
(the never-stall timeout→cache fallback already exists in sceneC). BHEX baseline relation stays hedged.
TRIGGERS_REVIEW_IF: projector timing shows CLEAN > 300 ms; a third venue/mode is needed.

---

## Contradiction Scanner

Claude runs this check when adding a new decision:
1. Read all ACTIVE decisions
2. Check if new decision conflicts with any existing one
3. If conflict found: FLAG before adding — do not silently overwrite
4. Format: ⚠ CONFLICT: [new decision] conflicts with [existing decision] — resolve before proceeding

---

### Tour polish pass — measured ring sizing, one narrative voice, reused Earth, galaxy depth
DATE: 2026-06-11
LAST_VERIFIED: 2026-06-11
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: (1) Ring-source sizing in Acts C/D is MEASURED, never assumed: measureRingFraction
radially profiles the loaded image and zoomSource scales it so the bright ring spans exactly
P.m87ShadowUas of the act's FOV (the fixed 0.525 fraction had displayed an ~18 μas ring labeled
42 μas — the "blob" bug). (2) The three-register narrativeTriple + tier tabs are replaced by ONE
unified narrative per act — exact physics in genuinely evocative language; the original intent was
always one text serving both audiences, not a toggle. (3) Acts B/E reuse the main page's globe via
tourEarth.js, a read-only offscreen Three.js singleton built from the same loadEarthTextures +
material register — the tour Earth matches the app BY CONSTRUCTION and cannot drift. (4) One shared
tourGalaxy.js background (parallax stars + half-res nebula wash) fills the dead black on all acts,
luminance-capped below the gold data layer. (5) Act C noise slider range is 0…0.25× visibility RMS
because the engine itself says the 42 μas source is noise-limited there; the breakdown is presented
as the lesson ("no components above 3σ — noise-limited"), not hidden.
ALTERNATIVES_REJECTED: per-act 2D textured-sphere sampling (re-invents the globe look, perf risk);
keeping viridis drawContour for Act C's restored panel (buries the ring at low DR); noise range 0…3
(erases the source halfway along the track); lateral nebula drift (non-tiling seam).
TRIGGERS_REVIEW_IF: black-hole.png is replaced (re-check measureRingFraction's radial-peak
assumption); the live app's "Source: 42 μas (52.5% of FOV)" label is revisited (same flawed
assumption, still unfixed there); BHEX sign-off lands (Act E hedge wording).

---

### Final pass (2026-06-12): app ring-fraction fix, two licensed palette divergences, dead-code sweep
DATE: 2026-06-12
LAST_VERIFIED: 2026-06-12
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: (1) The LIVE APP now measures the loaded image's bright-ring fraction
(measureRingFraction, moved tourScene→simCore with tourScene re-exporting) and corrects
effectiveSourceFraction = (shadowUas/FOV) ÷ ringFraction — zooming (zoomSource, ≥1) or
shrinking (<1) so the RING, not the frame, spans the physical size. Sanity band
[0.2, 0.95]: outside it (gaussian/jet/double/point-like) ringFraction=1 and legacy
behavior is byte-identical; Custom slider path untouched. Sidebar reads "Ring: 42 μas
(52.5% of FOV, measured)". This CHANGES reconstruction output for ring-like sources on
named targets — user-approved at an explicit pause gate (before/after screenshots:
unresolved blob → resolved shadow + ring matching tour Acts C/D and published EHT
morphology). (2) DESIGN-LANGUAGE Phase B is OVERRIDDEN in two places by the final-pass
spec: the tour galaxy uses a multi-hue deep-space palette (slate/indigo/violet/teal/
faint-magenta/amber, value-controlled, gold data layer still dominant) and Act E ground
arcs use the app's saturated TELESCOPE_COLORS per-pair blends (spec S1.6: match the main
app). Both recorded in DESIGN-LANGUAGE.md so a future conformance audit doesn't revert
them. (3) Dead code removed: worker.js gaussConvolve (never referenced), ~480 lines of
orphaned tour.css (chapter cards, scrubber, sl-rings, station dots — all from the
deleted TourDiagram era), tourScene tombstone comments. The cloud layer in Globe.js was
deleted outright: earth-clouds.png exists at NO CDN — the app had never displayed
clouds, only console errors.
RATIONALE: tour and tool must agree (G-PHYSICS); the spec's explicit visual targets
post-date and override the MODERATE palette license; grep-proven dead code.
TRIGGERS_REVIEW_IF: black-hole.png replaced (re-measure assumption holds via the band);
a working cloud texture CDN is found (reintroduce behind a verified URL); BHEX sign-off.

---

### Act B idle spin = continuous hour-angle clock; Act C control = three engine-honest noise presets
DATE: 2026-06-16
LAST_VERIFIED: 2026-06-16
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: Two surgical interaction fixes on the engine-real tour (branch
feature/tour-world-class-overhaul; spec .workflows/_prompts/tour-actB-actC-fix.md).
(1) ACT B idle spin: replace the quantized `rotation = track[floor(len·haFrac)].H` lookup +
eased pause/resume ramp with a CONTINUOUS hour-angle clock — `idle.haRad += IDLE_RATE·dt`
(dt from the RAF timestamp, clamped 0.1), wrapping at ±π (±12 h) so the globe spins fully and
smoothly like the main page's globe (OrbitControls autoRotate, ~200 s/rev; tour IDLE_DAY_S=40,
vision-tuned). Globe rotation, u,v head (radToHeadFrac, saturating 0/1 off the ±4.85 h
co-visible window, ellipse held full off-window with a "source below horizon" caption), and the
HA readout all derive from the single continuous haRad. HA drag = direct control; release
resumes the constant advance from the current angle (no ramp, no snap). Stays HA-coupled so the
live u,v trace remains honest. Reduced-motion unchanged (idle gated off → static final frame).
(2) ACT C control: REMOVE the noise slider + residual sparkline + DR-bar/component-count
readouts + live-recompute-on-drag; REPLACE with three engine-honest σ presets {0, 0.015, 0.03}
× visibility RMS (segmented buttons, default 0 = cleanest; each recomputes via the real engine
in its own worker, caches dirty+restored, drawHot, never-stall spinner). `drawResidualSparkline`
deleted from tourAnnotations.js (Act C was its only consumer); `progressEvery` capability kept in
the worker but no longer consumed.
RATIONALE: (B) the quantized track stepping + eased ramp were the jerk/slowness sources; a
time-based rate×dt clock is the canonical smooth fix and matches the main globe's felt pace.
(C) DIAGNOSIS (not a regression): vanilla Högbom with the 3σ-border stop is near-inert on
EHT-sparse coverage of a ring (~12 components even at noise 0 → restored ≈ dirty+residual), and
the per-iteration component count is an erratic, often-zero Gaussian-realization artifact; DR
saturates at the 100 fallback. Surfacing those proxies made a working-but-modest reconstruction
look broken. The restored IMAGE degrades gracefully with noise, so present three levels chosen by
rendering the ring (verified over two realizations), labeled honestly by σ×RMS. See gotchas.md.
CONSTRAINT: worker.js untouched (zero diff) — the 3σ stop is CASA-standard (see "CLEAN stopping"
decision); Tour signature / autoActions / App.js wiring unchanged. Refines the Act C half of the
2026-06-11 "Tour polish pass" decision (which introduced the now-removed 0–0.25× slider + sparkline).
ALTERNATIVES_REJECTED: (B) ping-pong across the transit (user chose full continuous spin); keeping
the eased ramp (the jerk source). (C) widening/relabeling the slider range (most of any range is
noise-limited for this source); lowering the worker's 3σ stop to force more components (forbidden —
worker-internal, would change app behavior); switching Act C to MEM (contradicts the CLEAN narrative).
TRIGGERS_REVIEW_IF: black-hole.png replaced or array changed (re-pick preset σ by rendering);
tour duration/FOV changed (re-derive the co-visible window / IDLE pacing); a regularized imager
replaces Högbom (the component-count proxy could become meaningful again).

---

### Alejandro physics pass (N1–N5): locked UV frame, BHEX toggle, Gλ fill metric, preset-mean dish
DATE: 2026-07-07
LAST_VERIFIED: 2026-07-07
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: Five P0 notes from Prof. Cárdenas-Avendaño, implemented with pre-approved authority over
core behavior (branch feature/alejandro-physics-pass; everything else that pass touched was fenced
to copy/design/a11y/dead-code):
(1) N1 — the UV map's axes are LOCKED to the BHEX-enabled coverage extent: `computeUVMaxExtentGl`
    (uvCompute.js) computes the extent of telescopes ∪ BHEX_PRESET (radial max ×1.2) regardless of
    the toggle, exposed as `uvDisplayMaxGl`, passed to UVMap as `displayMaxGl`. Toggling BHEX changes
    what is drawn, never the axes; the frame still responds to frequency/dec/duration (u=B/λ).
(2) N2 — BHEX is a true toggle (`handleToggleBHEX`, aria-pressed, never disabled); `loadEHTPresets`
    re-appends BHEX after swapping the ground array, so preset changes preserve the toggle. Default OFF.
(3) N3 — UV fill is `computeUVFillGl(uvPointsGl, halfExtentGl, M=200)`: % of cells sampled on a fixed
    M×M grid spanning the N1-locked frame, in Gλ. The old pixel-space computeUVFill was REMOVED — at
    80 μas FOV it collapsed all EHT coverage into ~27 cells of the 512² Nyquist grid ("0.0%", a rounding
    artifact). App, tourPhysics, sceneB, and the generic tour scene share the one new function (app==tour
    to machine precision). Measured: EHT 2017 1.10%, +BHEX 5.24%, EHT 2022 1.65%, ngEHT 3.13%.
    Definition chosen by Ilan from measured candidates (locked-frame grid vs own-aperture disk).
(4) N4 — target subsystem stress-tested (TARGET-STRESS-TEST in SITE-AUDIT.md): no defects in scope;
    two core-formula defects OUTSIDE the notes were PROPOSED not fixed (app angularRes uses the
    geometric array max — dec-independent "24 μas"; baselineStats samples the satellite at H=0 only).
(5) N5 — default dishDiameter = mean physical dish of the selected preset's stations
    (`presetMeanDish` in simCore.js over new `DISH_DIAMETERS` in constants.js): EHT 2017 → 18.1 m,
    EHT 2022 → 16.7 m, ngEHT P1 → 15.6 m; EHT-2022 mean when no EHT stations (Clear All / unknown);
    recomputed on preset load; manual slider edits persist until then. Tour scene engine calls use
    `P.ehtMeanDishM` (sceneA/C/D — was hardcoded 25). Dish slider min 3 m / step 0.5 m.
RATIONALE: physics-advisor authority; instrument-first diagnosis (all N3/N4 intermediates measured in
Node BEFORE changes and recorded in SITE-AUDIT.md). One frame for axes AND fill denominator keeps the
two displays mutually consistent by construction.
CRITICAL CONSTRAINT: DISH_DIAMETERS values are PENDING Alejandro confirmation (element dish for phased
ALMA/SMA/NOEMA; ngEHT sites from arXiv:2306.08787 — BAJA/CNI/SGO 6.1 m BIMA, OVRO 10.4, HAY 37, GAM 15).
worker.js untouched (zero diff; its `dishDiameter = 25` destructure default is unreachable — P3 proposal).
ALTERNATIVES_REJECTED: fill on the array's own aperture disk at Δu=1/FOV (physically rigorous but the %
DROPS when BHEX is added — reads backwards; measured 82%→69%); auto-scaling axes (the N1 defect);
keeping the Nyquist-grid fill with more decimals (still a rounding artifact, can't distinguish arrays).
TRIGGERS_REVIEW_IF: Alejandro revises DISH_DIAMETERS or the fill definition/M; BHEX orbit changes
(locked extent derives from BHEX_PRESET); P1/P2/P3 proposals get sign-off (then fix angularRes/
baselineStats/worker default).

### Final ship pass: P1–P5 decided under delegated authority; B1 factor-2 root cause
DATE: 2026-07-09
CONTEXT: Ilan held delegated final decision authority from Prof. Cárdenas-Avendaño for
the five fenced physics proposals (spec .workflows/_prompts/tour-final-ship-pass.md).
DECISIONS:
- P1 ADOPTED: displayed Resolution = θ = λ/|uv|max of the SAMPLED coverage
  (simCore.angularResFromUV; one decimal < 100 μas). Per-target: M87* 24.7 ·
  Sgr A* 23.6 · 3C 279 24.8 · Cen A 26.7. The geometric array max is never shown as
  resolution (the tour's rule, now the app's too). BHEX ON honestly drops the stat.
- P2 FIXED (final form, two pre-push overrides by Ilan 2026-07-09): Max Baseline
  counts only TARGET-OBSERVING baselines — same principle as P1.
  · Ground–space: max over the observed track (STEPS=200, ground station must see
    the target): 39,109 km / 30.0 Gλ with BHEX at M87* (LMT–BHEX; 39,110 at finer
    stepping). Supersedes the geometric-unfiltered 39,291 (SPT–BHEX — SPT never
    sees M87*) implemented earlier the same day.
  · Ground–ground: pairs must be CO-VISIBLE within the observation window (both
    stations clear the 10° cutoff at the same hour angle). M87* Earth-only:
    10,883 km / 8.3 Gλ IRAM–JCMT — StatusBar now matches the tour headline;
    Sgr A*: 11,406 (IRAM–SPT co-visible there). If no target-observing baseline
    exists at all, the stat hides (null), consistent with the resolution stat.
  Verified live per target (port 8118) + probe (M87* 10,883 / Sgr A* 11,406 /
  dec −90 southern-pairs 7,032 / BHEX 39,109).
- P3 DEFERRED (worker diff zero this pass; remove the 25 m destructure default at the
  next authorized worker change).
- P4 CONFIRMED: DISH_DIAMETERS as reviewed (element dish for phased stations; LMT/SPT
  full aperture with illuminated-aperture caveat as comment). Flag removed.
- P5 CONFIRMED (a): locked-frame Gλ grid fill, M=200 FROZEN as a display constant;
  relabeled "Relative coverage" everywhere so the absolute % isn't over-read.
- B1 ROOT CAUSE recorded: UVMap toCanvas mapped x=(u/displayMax+0.5)·DST — treating
  the half-extent as a full width — clipping everything beyond displayMax/2 since
  8c6ba01. Rule: any canvas mapping Gλ→px must treat computeUVMaxExtentGl's value as
  the HALF-extent (edges at ±extent).
- Globe baseline arcs: slerp (equal-angle steps), never chord-space lerp — uniform-t
  lerp sags near-antipodal arcs into the globe (SPT–GLT). Arc opacity 0.85 (0.5 faded
  out over bright terrain).
- JetBrains Mono is now LOADED (400/500/600) — the declared-not-loaded status quo is
  over; --font-mono renders JetBrains everywhere.

--- 2026-07-10 · Three small post-deploy fixes (branch fix/three-small-post-deploy) ---
- BHEX framing APPROVED (Marrone/Alejandro). The "pending sign-off"/⚠ marker is
  removed from every rendered surface (Act E liveEquation status row in tourActs.js;
  Physics Notes modal parenthetical) plus the dead `pending` flag in tourPhysics.js.
  DECISION: approval clears the sign-off gate; it does NOT upgrade the relation to an
  equality. "B_char ∼ R⊕ + h" stays a CHARACTERISTIC (order-of-magnitude) relation,
  never "=", everywhere (tourActs equation, sceneE callout, PhysicsNotesModal).
- Compare-mode globe starts more zoomed out: Globe gained an initialCameraDistance
  prop (default 2.8 = single mode unchanged); compare panes pass
  COMPARE_CAMERA_DISTANCE=4.2 (constants.js), within OrbitControls' 1.4–6 clamp.
  View-only; no UV/physics change.
- Compare-mode BHEX toggle was already per-pane but buried in the collapsed Telescopes
  accordion. DECISION: promote one always-visible BHEX toggle per pane (under the pane
  header), remove the accordion duplicate. Each pane stays independent (own
  useSimulation → own worker); default OFF; placement still disabled (B3).

--- 2026-07-13 · Tour target distances (branch fix/tour-target-distances) ---
- SOURCED target distances added to SKY_TARGETS (physics-before-validation rule):
  M87* 16.8 Mpc / 55 Mly [EHT 2019 Paper VI, arXiv:1906.11243]; Sgr A* 8.15 kpc /
  26,700 ly [GRAVITY Collaboration]; Cen A 3.8 Mpc / 12 Mly [Harris et al. 2010,
  arXiv:0911.3180]. Each cited in a constants.js comment.
- 3C 279 DECISION: it is a cosmological-redshift quasar (z≈0.536) — "distance" is
  ambiguous (luminosity/comoving/light-travel differ). Stored as redshift +
  light-travel time ~5.4 Gyr (standard ΛCDM, H0≈70), explicitly labeled NOT a metric
  distance. No distanceMpc field. Do not paper over cosmological distance again.
- The guided tour is HARDWIRED to M87* (tourActs.js:10, every act), so only M87*'s
  distance is displayed (Act D / First Light). The other three targets are sourced
  data enriching the shared model; they have no tour display surface today. If the
  tour is ever made target-aware, the data + formatting pattern is already in place.
- Distance rendered in the muted prose tier (dual units "16.8 Mpc · 55 million
  light-years"), never the gold live-computation layer. The two former hardcoded
  "55 million light-years" literals are now single-sourced via P.str.m87Distance /
  m87DistLy. Frozen anchors (10,883 / 25 / 42 μas / 2√27) untouched.

--- 2026-07-13 · Source-image pipeline (branch fix/custom-source-path) ---
- DIAGNOSTIC (see .workflows/_system/SOURCE-IMAGE-DIAGNOSTIC.md): the WFU-seal "blob" is
  measured, correct physics — 97.6% of the seal's power is zero-spacing (DC) flux the
  array never samples; only 0.5% is measurable (vs 39.5% for the black-hole ring). Verdict
  (C): physics-dominant, PLUS real custom-path bugs.
- FIX (Item 1): uploads + the WFU-seal preset now set selectedTarget='Custom' (blackhole
  preset → M87*), so a custom image is never scaled to the 42 μas shadow nor labeled with
  M87*'s dec/distance. measureRingFraction is gated to shadow targets (it returned a bogus
  ~0.89 for the seal). Ground Truth panel now shows the SCALED source (drawHot), not the
  raw upload. HARD GATE met: black-hole ring reconstructs byte-identically (CLEAN/Dirty
  canvas hashes unchanged at noise=0).
- TEACHING (Items 2-3): a computed suitability notice (simCore.computeSourceRadialPower +
  assessSourceSuitability) states measured numbers (DC%, measurable%, resolution elements,
  beam) and explains the aperture-synthesis limit. Triggers are PHYSICAL not tuned: fires
  only when DC>50% OR measurable<10% — the ring (26%/40%) never trips it. A labeled Invert
  toggle (default OFF) reflects brightness so ink becomes the emitter; inverting the seal
  clears the notice. All routed through effectiveGrayscale (same ref when off → ring
  byte-identical). worker.js untouched throughout.
  [SUPERSEDED 2026-07-14: the zero-spacing/DC explanation above was WRONG (Alejandro's
  correction) — the notice was removed; see the 2026-07-14 entry + gotchas CORRECTION.]

--- 2026-07-14 · Custom-source physics correction (branch fix/custom-source-physics-correction) ---
- Alejandro REJECTED our zero-spacing framing; he is right (see gotchas CORRECTION). The
  wrong notice was pulled from the live site first (Phase 0, pushed alone).
- MEASURED (CUSTOM-SOURCE-PHYSICS.md, 39-cell sweep through the real worker): at its own
  angular scale the seal reconstructs; recovery = f(scale, elements) jointly; occupancy
  ∝ 1/FOV² gives each array an optimum (EHT 2017 ≈ 800 μas).
- DECISION — TWO-REGIME SCALING: astrophysical targets keep target-derived units (shadow
  scaling, ring fraction, dec — ring path byte-identical, hash-verified twice); Custom
  images carry NO astrophysical units — entering the regime seeds fovMuas=800 (measured
  sweet spot) + sourceFraction=0.9 via handleTargetChange; leaving restores astrophysical
  defaults (regime switch = unit switch; named→named preserves user FOV). The Custom size
  slider is labeled "Image size on sky" (μas/mas).
- TEACHING: ResolutionBudget panel (Custom only, never the ring) surfaces live computed
  N_res, beam, and occupancy, and teaches the OPTIMUM (not "more is better") + an
  add-elements ladder (2017→2022→ngEHT→+BHEX) that demonstrably resolves the user's
  image (verified: one click to ngEHT makes the seal legible). No DC language anywhere.
