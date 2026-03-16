# Project Knowledge Base — Codebase
# _knowledge/codebase.md
#
# What Claude knows about this project's structure, patterns, and conventions.
# Updated automatically after significant changes.
# Stale entries marked with STALE: [date] prefix.

---

## Stack

- **Language**: Plain JavaScript (ES6, no TypeScript, no bundler)
- **Runtime**: Browser only — no server, no Node.js
- **Libraries**:
  - Leaflet 1.9.4 (CDN) — interactive map
  - math.js 12.4.0 (CDN) — 1D FFT/IFFT (`math.fft`, `math.ifft`, `math.complex`)
- **Styling**: Plain CSS with custom properties (dark theme)
- **No build step** — open `index.html` directly in browser

## Directory Structure

```
/Users/ilanamaro/Astrophysics Applet/
├── index.html                  # App shell; loads all scripts; defines DOM
├── css/
│   └── style.css               # Dark astronomy theme; three-column responsive grid
├── js/
│   ├── fft2d.js                # 2D FFT/IFFT + fftShift (depends on math.js only)
│   ├── interferometry.js       # ECEF coords, baseline→UV, UV coverage synthesis
│   ├── imageProcessor.js       # Image I/O, UV mask, reconstruction pipeline (depends on fft2d.js)
│   ├── mapController.js        # Leaflet map, telescope markers, EHT presets
│   └── app.js                  # Coordinator: event wiring, debounced reconstruction
└── .workflows/                 # Workflow system (see MANIFEST.md)
```

**Script load order** (matters — dependencies before dependents):
```
math.js → Leaflet → fft2d.js → interferometry.js → imageProcessor.js → mapController.js → app.js
```

## Established Patterns

- **Global functions, not modules**: Scripts use plain `<script>` tags. All top-level
  `function` declarations are globally accessible (needed for Leaflet popup `onclick`).
  Top-level `let`/`const` are globally scoped but not on `window`.
- **Debounced reconstruction**: Any change that should trigger reconstruction calls
  `runReconstruction()` (debounced at 50ms), never `_reconstruct()` directly.
- **Auto-normalize for display**: `grayscaleToCanvas` normalizes using actual data
  min/max — do not pre-normalize outputs before passing to it.
- **UV index conversion**: Centered pixel coordinates → array indices via
  `((value % N) + N) % N`. Handles negative values. See `buildUVMask`.
- **Conjugate symmetry**: Every UV point (u,v) is paired with (-u,-v) in
  `computeUVCoverage`. Required for real-valued IFFT output.

## Entry Points

- **User**: Open `index.html` in any modern browser (no server required).
- **Reconstruction pipeline**: `runReconstruction()` in `app.js` → `computeUVCoverage`
  → `drawUVPlane` → `reconstructImage` (which calls `fft2d` → `buildUVMask` →
  `applyUVMask` → `ifft2d`).

## Data Flow

```
File upload
  → loadImageData(file)         [imageProcessor.js] → ImageData (256×256 RGBA)
  → imageDataToGrayscale()      [imageProcessor.js] → number[][] (256×256 luminance)
  → stored as currentGrayscale  [app.js]

Map click / preset load
  → addTelescope(lat, lon)      [mapController.js]
  → getTelescopes()             [mapController.js] → {lat,lon,name}[]
  → computeUVCoverage()         [interferometry.js] → {u,v}[] pixel coords
  → drawUVPlane()               [imageProcessor.js] → renders to #uv-canvas

Reconstruction
  → reconstructImage(gray, uvPts)
      fft2d(gray)               [fft2d.js]         → Complex[][]
      buildUVMask(uvPts, N)     [imageProcessor.js] → boolean[][]
      applyUVMask(fft, mask)    [imageProcessor.js] → Complex[][]
      ifft2d(masked)            [fft2d.js]          → number[][]
  → grayscaleToCanvas()        [imageProcessor.js] → renders to #reconstructed-canvas
```

## External Integrations

- **OpenStreetMap tiles** (via Leaflet) — requires internet; app still functional without
- **CDN libraries**: unpkg.com (Leaflet), cdnjs.cloudflare.com (math.js)

## Known Constraints

- `IMAGE_SIZE = 256` (power-of-2, hardcoded in imageProcessor.js) — math.js FFT requires
  power-of-2 length. Changing this requires verifying the new value is also a power of 2.
- FFT runs on main thread. For N=256, expect ~100-300ms on slow devices.
- `EARTH_RADIUS_KM = 6371` in interferometry.js — used for UV normalization scale.

## Last Updated

2026-03-16 — Initial population after first feature implementation (run-001).
