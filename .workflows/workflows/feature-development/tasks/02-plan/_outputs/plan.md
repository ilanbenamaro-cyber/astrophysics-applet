## IMPLEMENTATION PLAN

### Order of Operations

1. Create `js/fft2d.js` — foundational math, no dependencies on other app files
2. Create `js/interferometry.js` — pure functions, no DOM dependencies
3. Create `js/imageProcessor.js` — depends on fft2d.js (calls fft2d, ifft2d, drawUVPlane)
4. Create `js/mapController.js` — depends on Leaflet only
5. Create `js/app.js` — depends on all of the above
6. Create `css/style.css`
7. Create `index.html` — loads all scripts, defines DOM structure

### File Changes

**CREATE: js/fft2d.js**
- `fft2d(real: number[][]) → Complex[][]` — row FFT then column FFT using math.js
- `ifft2d(complex: Complex[][]) → number[][]` — column IFFT then row IFFT; extract `.re`
- `fftShift(arr: any[][]) → any[][]` — moves zero-freq to center (for display)
- All inputs are N×N plain Arrays. N must be power-of-2.
- Use `Array.from(math.fft(...))` to guarantee plain Array return type.

**CREATE: js/interferometry.js**
- `EARTH_RADIUS_KM = 6371` constant
- `latLonToECEF(lat, lon) → {x, y, z}` — geographic → ECEF km
- `computeBaseline(tel1, tel2) → {bx, by, bz}` — ECEF difference in km
- `baselineToUV(baseline, hourAngle, declinationDeg) → {u, v}` — standard radio astronomy
  formula: u = sin(H)*Bx + cos(H)*By; v = -sin(δ)cos(H)*Bx + sin(δ)sin(H)*By + cos(δ)*Bz
- `computeUVCoverage(telescopes, decl, haRangeDeg, steps, N) → {u,v}[]`
  Iterates all baseline pairs × all hour angle steps. Adds both (u,v) and (-u,-v) for
  conjugate symmetry. Normalizes to pixel units: scale = (N/2) / (2 * R_earth).
  Filters out-of-bounds points.

**CREATE: js/imageProcessor.js**
- `IMAGE_SIZE = 256` global constant (power of 2)
- `loadImageData(file) → Promise<ImageData>` — creates offscreen canvas, draws image at
  IMAGE_SIZE×IMAGE_SIZE, returns ImageData
- `imageDataToGrayscale(imageData) → number[][]` — luminance = 0.299R + 0.587G + 0.114B
- `imageDataToCanvas(imageData, canvas)` — puts RGBA data onto a canvas element
- `grayscaleToCanvas(pixels, canvas)` — auto-normalizes to [0,255], draws grayscale
- `buildUVMask(uvPoints, N) → boolean[][]` — converts centered (u,v) to array indices
  via `((v + N) % N + N) % N` (handles negative values correctly)
- `applyUVMask(fftData, mask) → Complex[][]` — zeros unsampled frequencies
- `drawUVPlane(uvPoints, N, canvas)` — dark background, axis lines, 1×1px dots per sample
- `reconstructImage(grayscale, uvPoints) → number[][]` — full pipeline: fft2d → buildUVMask
  → applyUVMask → ifft2d

**CREATE: js/mapController.js**
- `PRESET_TELESCOPES` array: 6 EHT-equivalent locations (ALMA, IRAM, SMA, SPT, JCMT, LMT)
- `map`, `telescopes`, `nextId`, `onChangeCallback` — module-level globals
- `initMap(divId, onChange)` — creates Leaflet map, binds click handler to `addTelescope`
- `addTelescope(lat, lon, name)` — creates draggable marker, popup with Remove button
  calling `removeTelescope(id)`. Triggers `onChangeCallback`.
- `removeTelescope(id)` — MUST be a function declaration (not const) for Leaflet popup
  inline onclick access via window scope
- `loadPresets()` — clears then adds all PRESET_TELESCOPES
- `clearTelescopes()` — removes all markers
- `getTelescopes() → {lat, lon, name}[]`

**CREATE: js/app.js**
- `currentImageData`, `currentGrayscale` — module-level state
- `runReconstruction()` — guard: needs ≥2 telescopes AND loaded image. Reads declination
  and HA range from sliders. Calls computeUVCoverage → drawUVPlane → setTimeout(reconstruct, 10).
  setTimeout prevents UI freeze during status update.
- `updateStatus(msg)` — sets `#status` text
- Event listeners (bound after DOM ready):
  - `#image-upload change` → loadImageData → imageDataToCanvas → runReconstruction
  - `#declination input` → update label + runReconstruction
  - `#ha-range input` → update label + runReconstruction
  - `#load-presets click` → loadPresets()
  - `#clear-telescopes click` → clearTelescopes()
- `DOMContentLoaded` → initMap('map', () => runReconstruction())

**CREATE: css/style.css**
- CSS custom properties for dark theme (--bg, --surface, --border, --text, --accent)
- Three-column grid for panels, collapses to 2-col at 1100px, 1-col at 700px
- Map div: height 320px
- Canvases: max-width 100%, aspect-ratio 1

**CREATE: index.html**
- Loads via CDN: Leaflet CSS+JS (1.9.4), math.js (12.4.0 min)
- Loads in order: fft2d.js, interferometry.js, imageProcessor.js, mapController.js, app.js
- DOM: `<header>`, `<section.controls>` (file input + 2 sliders + 2 buttons + status),
  `<div.panels>` containing 3 `<section.panel>` (map | UV-plane | image comparison)
- Image comparison panel: two canvas columns (original + reconstructed)

### Test Plan

No automated test runner in this project (pure static JS, no build toolchain).
Verification is manual via browser:

- Upload a recognizable image (e.g., a letter "A") → original renders in canvas
- With 0-1 telescopes → status warns, reconstructed canvas stays black
- Load EHT presets (6 telescopes) → UV-plane fills with arcs → reconstructed image
  shows a blurry but recognizable version of the original
- Drag a telescope marker → reconstruction updates automatically
- Adjust declination slider → UV arcs change shape → reconstruction updates
- Adjust HA range slider → more/fewer UV samples → reconstruction quality changes
- Clear telescopes → UV-plane clears, reconstruction goes black

### Falsification Results

ADDRESSED:
- FFT non-power-of-2 failure → IMAGE_SIZE=256 fixed; all images resized on load
- UI thread blocking during FFT → `setTimeout(reconstruct, 10)` allows status render
- Leaflet popup `removeTelescope` not accessible → use function declaration, not const/let
- Negative UV indices in mask → `((v + N) % N + N) % N` handles all negative values
- Reconstructed image has imaginary residuals → extract `.re` from ifft2d output
- math.js fft return type variance → wrap all returns in `Array.from()`
- No telescopes / 1 telescope guard → check `tels.length < 2` before running

ACCEPTED RISKS (documented):
- FFT blocks main thread for ~100-300ms on slow devices. For an educational tool this is
  acceptable; a Web Worker refactor is a v2 consideration.
- UV normalization assumes max baseline = Earth diameter. Telescopes very close together
  produce low-frequency-only sampling; reconstruction will look very blurry. This is
  physically correct and educationally valuable.
- Leaflet tiles require internet. Noted in README/header; app is still functional
  without tiles (map shows blank background, telescope placement still works).

ASSUMPTIONS MADE:
- No build toolchain, no linting, no test runner — verification is manual in-browser
- Plain scripts (not ES modules) — simplest approach for a single-file educational app
- IMAGE_SIZE=256 is sufficient resolution for the educational demonstration
- Wavelength normalized out — UV coordinates in units of baseline/Earth-radius, not wavelengths
