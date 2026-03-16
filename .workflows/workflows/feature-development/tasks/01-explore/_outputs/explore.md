## FEATURE REQUEST SUMMARY

A pure-JS web applet that simulates VLBI (Very Long Baseline Interferometry) image
reconstruction. Users upload an image, place telescopes on an interactive Earth map,
and the app demonstrates how sparse Fourier sampling + IFFT reconstructs the original —
replicating the mathematical core of how the Event Horizon Telescope works.

## FILES TO MODIFY

None — project is at inception. No existing source to modify.

## FILES TO CREATE

- `index.html` — app shell, three-panel layout (map | UV-plane | image comparison)
- `css/style.css` — dark astronomy-themed UI
- `js/fft2d.js` — 2D FFT/IFFT built on math.js 1D transforms; fftShift utility
- `js/interferometry.js` — ECEF coordinate math, baseline→UV projection, UV coverage synthesis
- `js/imageProcessor.js` — image loading/resizing, grayscale conversion, UV mask application, canvas I/O
- `js/mapController.js` — Leaflet map, telescope markers, EHT preset locations
- `js/app.js` — main coordinator, event wiring, reconstruction pipeline orchestration

## REUSABLE PATTERNS FOUND

None — greenfield project.

## ARCHITECTURAL CONSTRAINTS

- No backend. Everything runs in the browser.
- Pure JavaScript (no TypeScript, no bundler). Plain `<script>` tags.
- Libraries via CDN: Leaflet 1.9.4 (map), math.js 12.4.0 (FFT).
- image size fixed at 256×256 (power-of-2 required by Cooley-Tukey FFT).
- `let`/`const` at top-level non-module scripts are in global scope (accessible cross-file)
  but not on `window`. Function declarations ARE on `window` — needed for Leaflet popup
  inline `onclick` handlers (specifically `removeTelescope`).

## RISKS

- MEDIUM: math.js `fft` requires power-of-2 length input. Enforced by resizing all
  images to IMAGE_SIZE=256 on load. Must not be bypassed.
- LOW: Leaflet tiles require internet access. App degrades gracefully (map is
  non-functional without tiles but all other panels work).
- LOW: 2D FFT on 256×256 is ~1M operations via math.js — acceptable in modern browsers
  but will block the UI thread briefly. Wrapped in `setTimeout(..., 10)` to allow status
  message to render first.
- LOW: Conjugate symmetry of FFT (F[-u,-v] = conj(F[u,v])) must be maintained for the
  reconstructed image to be real-valued. Both (u,v) and (-u,-v) points are added in
  `computeUVCoverage` to ensure this.

## UNKNOWNS REQUIRING DECISION

None blocking. Two assumptions documented:
1. Source declination defaults to 45° (adjustable via slider).
2. UV normalization scale: Earth diameter (2 × 6371 km) → N/2 pixels. This means
   the longest possible baseline fills the Nyquist frequency. Reasonable for educational
   purposes.

## ESTIMATED SCOPE

Medium — 7 files, ~700 lines total. Novel math (VLBI UV projection) but well-defined
algorithm from radio astronomy literature. No external APIs, no auth, no persistence.
