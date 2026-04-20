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
App.js
├── Globe.js                  — Three.js 3D globe; click → telescope placement
├── AppSidebar.js
│   └── ControlsPanel.js      — all sliders: noise, frequency, duration, declination, dish, method
├── UVMap.js                  — canvas: UV coverage arcs (colored by baseline)
├── ImageCanvas.js            — dirty/restored side-by-side canvas panels
├── OriginalImagePanel.js     — source image display
├── ContourMap.js             — professional contour map (viridis, marching squares, beam ellipse)
├── StatusBar.js              — reconstruction status, UV fill %, dynamic range
├── TelescopeList.js          — list of placed telescopes with remove buttons
├── InfoModal.js              — panel info popup
├── InfoTooltip.js            — hover tooltip on ? icons
├── Tour.js                   — guided walkthrough orchestrator
│   ├── TourCard.js           — tour step card UI
│   └── TourDiagram.js        — inline SVG diagrams for tour steps
├── A11yPanel.js              — screen-reader descriptions of current sim state
├── PhysicsNotesModal.js      — static modal: UV formula, CLEAN/MEM algorithms, EHT sources
└── CitationModal.js          — BibTeX + APA citation generator from live sim state
```

### Support modules
```
core.js          — htm/preact re-exports (html, useState, useEffect, useRef, useMemo, useCallback)
constants.js     — IMAGE_SIZE=512, EARTH_RADIUS_KM=6371, TELESCOPE_COLORS[8], EHT_PRESETS[8],
                   INFO (tooltip text keyed by panel name), ISO_COUNTRY_NAMES (numeric→display)
uvCompute.js     — latLonToECEF, computeBaseline, baselineToUV (TMS eq 4.1),
                   computeUVPoints (pixel coords, FOV-scaled — reconstruction input),
                   computeUVPointsGl (Gλ coords, FOV-independent — display only),
                   computeUVFill, lerpColor
globeHelpers.js  — Three.js mesh helpers for globe, atmosphere, markers
presets.js       — IMAGE_PRESETS: { 'blackhole': '../assets/black-hole.png', 'wfu-seal': '../assets/wfu-seal.png' }
worker.js        — self-contained Web Worker (no imports — cannot use import maps)
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
    frequency: number    // GHz
  }
}
```

**OUT (to App.js):**
```js
// Success:
{ type: 'result', id: number, dirty: Float64Array, restored: Float64Array, uvCount: number }
// Transferable buffers — dirty.buffer and restored.buffer are transferred (zero-copy)
// App.js MUST NOT read these arrays after they are passed to worker

// Error:
{ type: 'error', id: number, message: string }
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
sigmaPx = (N/2) × (25 / dishDiameter) × (230 / frequency) × 1.5
Applied as Gaussian envelope to dirty image before mask
```

**CLEAN** (Högbom algorithm in `worker.js`):
- 1000 iterations, loop gain = 0.1
- Stop at 5% of initial peak
- PSF peak at index 0 (not N/2 — worker FFT convention)
- Restore beam sigma = `max(1.5, halfWidth / 2.355)` where halfWidth estimated from dirty beam
- Final: FFT-convolve model with restore beam, add residual

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
- Default displayMode: `'dirty'`

**Angular resolution** (in `App.js` → `useMemo`):
```
maxBaseline = max Euclidean distance between any two telescope ECEF positions (km)
angularResolution = (λ_mm / (maxBaseline × 1e6)) × (180/π) × 3.6e9  [μas]
```
Passed as prop to ContourMap for μas axis labels.

### State managed in App.js
- `telescopes` — array of `{ id, name, lat, lon, color }`
- `dirtyData`, `restoredData` — Float64Array results from worker
- `uvPoints` — current UV sample coordinates (pixel space, FOV-scaled — passed to worker)
- `uvPointsGl` — current UV sample coordinates in Gλ (display only — passed to UVMap)
- `controls` — all slider/toggle values (noise, frequency, duration, declination, method, dishDiameter, fovMuas [default 80], sourceFraction [default 0.50])
- `selectedImage` — current source image key
- `physicsNotesOpen`, `citationOpen` — modal state
- `recoId` — monotonic ref for stale result detection

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

2026-04-20 — uvCompute.js: added computeUVPointsGl (Gλ display pipeline); UVMap: rewrote to use Gλ coords with auto-scale; App.js: uvPointsGl state added, fovMuas default 538→80; UV display and reconstruction pipelines are now fully independent.
2026-04-16 — IMAGE_SIZE updated to 512; ContourMap boundary clip noted; sourceFraction default updated to 0.50; worker protocol N updated.
2026-04-12 — Full reconstruction to cover vlbi-react as live active codebase (post Phase-1 commit bc212cb).
