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
STATUS: ACTIVE

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
LAST_VERIFIED: 2026-04-12
EXPIRES: UNTIL_MEETING
STATUS: ACTIVE — BLOCKING

DECISION: No Phase 2 features to be implemented until angular size is resolved with Prof. Cárdenas-Avendaño.
RATIONALE: Current implementation always fills the full FOV with the source, regardless of source size parameter. This is not physically correct — a source at a given declination and distance should subtend a specific angle. Phase 2 features (source size slider, multi-source, etc.) built on top of incorrect FOV behavior will need to be rewritten.
TRIGGERS_REVIEW_IF: Meeting with Prof. occurs and angular size implementation is agreed upon.

---

## Contradiction Scanner

Claude runs this check when adding a new decision:
1. Read all ACTIVE decisions
2. Check if new decision conflicts with any existing one
3. If conflict found: FLAG before adding — do not silently overwrite
4. Format: ⚠ CONFLICT: [new decision] conflicts with [existing decision] — resolve before proceeding
