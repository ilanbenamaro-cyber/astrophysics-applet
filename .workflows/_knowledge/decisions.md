# Architectural Decisions
# _knowledge/decisions.md
#
# Every significant architectural decision, when it was made, and why.
# This prevents re-litigating settled decisions and documents tradeoffs.
# Claude checks this before proposing architectural changes.

---

## Decision Log

### Plain scripts — no ES modules, no bundler
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
RATIONALE: math.js is a general-purpose math library already needed for complex number arithmetic (`math.complex`). Using one library instead of two reduces CDN dependencies and bundle weight.
ALTERNATIVES_REJECTED: `fft.js` (lightweight, fast — but no complex number type, would require parallel real/imaginary arrays throughout); `ndarray-fft` (2D-native but adds ndarray as a transitive dependency).
TRIGGERS_REVIEW_IF: FFT performance becomes a bottleneck and profiling shows math.js overhead is the cause; or a Web Worker refactor is attempted (at which point a lightweight pure-function FFT library becomes attractive).

---

### Fixed IMAGE_SIZE = 256 (power-of-2, not user-configurable)
DATE: 2026-03-16
LAST_VERIFIED: 2026-03-16
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: All uploaded images are resized to 256×256 on load. This value is hardcoded in `imageProcessor.js`.
RATIONALE: math.js FFT requires power-of-2 input length. Fixing the size at load time avoids runtime validation and keeps the mask/FFT array dimensions constant throughout the pipeline. 256 is large enough for a clear educational demonstration while keeping FFT time under ~300ms on slow devices.
ALTERNATIVES_REJECTED: 512×512 — 4× slower FFT, noticeable UI block on mobile; dynamic sizing — requires power-of-2 enforcement, dynamic mask sizing, and complicates the pipeline.
TRIGGERS_REVIEW_IF: 256 looks too pixelated for a specific demo use case; Web Worker is introduced (removing the blocking concern, making 512 viable).

---

### UV normalization: Earth diameter → N/2 pixels
DATE: 2026-03-16
LAST_VERIFIED: 2026-03-16
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: UV coordinates (in km) are normalized so that Earth's diameter (2 × 6371 km) maps to N/2 image pixels — the Nyquist frequency. Scale = `(N/2) / (2 × R_earth)`.
RATIONALE: Real VLBI uses wavelength units (u, v in units of λ). Wavelength is frequency-dependent and would require an additional slider with non-intuitive effect. Normalizing to Earth geometry instead makes telescope placement the only variable, which is the educational point of the app.
ALTERNATIVES_REJECTED: Wavelength-based normalization — physically correct but adds complexity and the absolute scale is meaningless to non-specialists; per-session auto-scaling to max baseline — makes the UV plane shift visually as telescopes are added, which is confusing.
TRIGGERS_REVIEW_IF: A wavelength/frequency slider is added as a feature (at which point wavelength-based normalization becomes appropriate).

---

### Conjugate symmetry enforced in computeUVCoverage
DATE: 2026-03-16
LAST_VERIFIED: 2026-03-16
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: For every UV point (u,v), its conjugate pair (-u,-v) is also added in `computeUVCoverage` before the array is returned.
RATIONALE: The FFT of a real-valued image has conjugate symmetry: F[-u,-v] = conj(F[u,v]). If only one of a conjugate pair is sampled and the other is zeroed in `applyUVMask`, the IFFT output has a non-trivial imaginary component. Taking `.re` would then discard real signal, producing artefacts. Adding both points ensures the masked spectrum respects this symmetry.
ALTERNATIVES_REJECTED: Enforcing symmetry in `buildUVMask` directly (also viable, but placing it at the source — `computeUVCoverage` — means callers get correct data without needing to know about this constraint).
TRIGGERS_REVIEW_IF: Never — this is a mathematical requirement, not a design choice.

---

### Debounce runReconstruction at 50ms
DATE: 2026-03-16
LAST_VERIFIED: 2026-03-16
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: `runReconstruction()` in `app.js` is a debounce wrapper; actual work runs in `_reconstruct()`. Any caller (map onChange, slider input) calls `runReconstruction()` only.
RATIONALE: `loadPresets()` calls `addTelescope` 6 times in rapid succession, each triggering the onChange callback. Without debouncing, 6 FFT jobs queue via `setTimeout` and run back-to-back. The 50ms debounce collapses batched updates into a single reconstruction.
ALTERNATIVES_REJECTED: Calling `_reconstruct()` directly from `loadPresets` — breaks the single-callback contract and couples mapController to app logic; flag-based suppression in mapController — leaks reconstruction concerns into the wrong module.
TRIGGERS_REVIEW_IF: The onChange pattern is replaced with an explicit "compute" button (debounce becomes irrelevant); or Web Worker is introduced (queuing behaviour changes).

---

### FFT runs on main thread with setTimeout(fn, 10) deferral
DATE: 2026-03-16
LAST_VERIFIED: 2026-03-16
EXPIRES: NEVER
STATUS: ACTIVE

DECISION: The FFT computation inside `_reconstruct` is wrapped in `setTimeout(..., 10)`. No Web Worker.
RATIONALE: For N=256, FFT takes ~100-300ms — acceptable for an educational tool. A 10ms deferral lets the "Reconstructing…" status message render before the main thread is blocked, giving the user feedback. A Web Worker would be the correct fix for larger N but adds significant complexity (message passing, transferable arrays) for a v1.
ALTERNATIVES_REJECTED: Web Worker — correct long-term solution but out of scope for v1; requestAnimationFrame — fires too quickly to guarantee the status renders first.
TRIGGERS_REVIEW_IF: IMAGE_SIZE is increased beyond 256; or user feedback indicates the freeze is disruptive.

---

## Contradiction Scanner

Claude runs this check when adding a new decision:
1. Read all ACTIVE decisions
2. Check if new decision conflicts with any existing one
3. If conflict found: FLAG before adding — do not silently overwrite
4. Format: ⚠ CONFLICT: [new decision] conflicts with [existing decision] — resolve before proceeding
