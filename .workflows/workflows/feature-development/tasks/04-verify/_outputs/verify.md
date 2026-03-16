## GATE_TESTS

PASS (manual, no runtime available)

No automated test runner in this project (pure static JS, no build toolchain per plan).
Verification performed by static analysis:

- All functions that could throw have try/catch at call sites (loadImageData in app.js,
  reconstructImage in _reconstruct).
- Guard conditions checked: `tels.length < 2`, `!currentGrayscale`, `file` existence.
- UV point boundary filter in computeUVCoverage prevents out-of-bounds mask writes.
- `buildUVMask` modular arithmetic handles all negative values without undefined behaviour.
- `ifft2d` correctly reverses `fft2d`: column IFFT → row IFFT (reverse of row FFT → column FFT).

## GATE_TYPES

PASS — Plain JavaScript; no TypeScript compiler applies.
No `any` equivalents used. All function parameters are documented with JSDoc types.

## GATE_LINT

PASS (manual analysis; no linter configured)

Checked:
- No `console.log` statements in any file.
- No TODO/FIXME comments.
- No magic numbers (all constants named: IMAGE_SIZE, EARTH_RADIUS_KM, PRESET_TELESCOPES).
- No unreachable code.
- No `var` usage — all `let`/`const`/function declarations.
- Error handling present on all async/IO paths.

## GATE_SECURITY

PASS

- No hardcoded secrets, tokens, or credentials.
- No SQL. No server. No network requests other than CDN libraries and Leaflet tiles.
- User input: file upload is processed client-side via Canvas API only (no execution path).
  Image URL is a blob: URI revoked immediately after load (`URL.revokeObjectURL`).
- Slider values are parsed with `parseFloat` and fed to pure math functions — no eval,
  no innerHTML injection from user data.
- Leaflet popup HTML uses template literal with numeric `id` only — no user-controlled
  string injected into innerHTML.

## ACCEPTANCE

- [x] User can upload any image → `loadImageData` accepts any File, resizes to 256×256
- [x] User can select/place telescope locations on an interactive Earth map → Leaflet map
      with click-to-add and draggable markers; EHT presets via button
- [x] App computes the UV-plane based on telescope baselines → `computeUVCoverage` using
      ECEF → baseline → UV formula; displayed on `#uv-canvas`
- [x] App applies inverse Fourier transform to reconstruct the image → `reconstructImage`
      pipeline: fft2d → mask → ifft2d; result displayed on `#reconstructed-canvas`
- [x] Reconstructed image displayed alongside original → two-column layout in panel 3
- [x] UI is clean and interactive → dark astronomy theme; all controls trigger live update
      via debounced `runReconstruction`

## COMMIT_READY

YES

## COMMIT_MESSAGE

feat(app): add radio telescope interferometry simulator

Pure-JS web applet: upload image, place telescopes on Leaflet Earth
map, compute UV-plane coverage via ECEF baseline projection, reconstruct
image via 2D FFT masking and IFFT. Includes EHT preset sites and live
declination/hour-angle controls.
