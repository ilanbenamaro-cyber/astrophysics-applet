## FILES_CHANGED

- `index.html`              — 73 lines. App shell, three-panel layout, CDN script tags.
- `css/style.css`           — 194 lines. Dark astronomy theme, responsive grid.
- `js/fft2d.js`             — 69 lines. 2D FFT/IFFT + fftShift using math.js.
- `js/interferometry.js`    — 113 lines. ECEF coordinates, baseline→UV, UV coverage synthesis.
- `js/imageProcessor.js`    — 181 lines. Image I/O, grayscale, UV mask, reconstruction pipeline.
- `js/mapController.js`     — 107 lines. Leaflet map, telescope markers, EHT presets.
- `js/app.js`               — 115 lines. Coordinator, event wiring, debounced reconstruction.

Total: ~852 lines across 7 files.

## DEVIATIONS

1. **Debounce added to `runReconstruction`**: Plan did not mention debouncing. Added after
   realising `loadPresets()` triggers `addTelescope` 6 times in rapid succession, each
   firing the onChange callback. Without debouncing, 6+ FFT jobs would queue via
   `setTimeout`. Fixed with a 50ms debounce wrapper (`reconstructionTimer`).

2. **`_reconstruct` helper function**: Internal detail of the debounce — the plan described
   `runReconstruction` as the single entry point. Splitting into `runReconstruction`
   (debounce) and `_reconstruct` (the actual work) is a consequence of deviation #1.

## DECISIONS_MADE

- Used `((value % N) + N) % N` for UV→index conversion rather than a conditional branch.
  Handles all negative values correctly in a single expression.
- `grayscaleToCanvas` auto-normalizes using the actual min/max of the reconstructed data
  rather than clamping to [0, 255]. This ensures the reconstruction is visible even when
  the amplitude is very small (as happens with sparse UV coverage).
- `applyUVMask` creates a single shared `zero = math.complex(0, 0)` before the loop to
  avoid allocating one Complex object per unsampled frequency bin.

## READY_FOR_VERIFY

YES
