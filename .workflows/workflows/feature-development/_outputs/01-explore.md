# Task 01 — Explore Output
# Feature: CLEAN deconvolution algorithm

## Files In Scope

- `js/imageProcessor.js` — add `cleanDeconvolve(dirtyImage, dirtyBeam, opts)`
- `js/app.js` — wire CLEAN checkbox; update `_reconstruct()` to run CLEAN when toggled
- `index.html` — add CLEAN checkbox to controls; make reconstruction label dynamic
- `css/style.css` — no changes required (checkbox inherits existing control-group style)

## Key Findings

### Infrastructure already present
- `computeDirtyBeam(uvPoints, N)` — returns N×N real array; PSF peak at [0][0] (IFFT convention)
- `reconstructImage(grayscale, uvPoints)` — returns dirty image N×N real array
- `fft2d` / `ifft2d` — available globally; `ifft2d` normalizes by 1/N² (correct for convolution theorem)
- In `_reconstruct()` (app.js:56-72): dirty image and dirty beam are computed sequentially and already available

### No existing CLEAN button
The request's claim that a CLEAN button already exists is incorrect. The controls have:
load-presets, clear-telescopes, save-uv, save-reconstruction — no CLEAN toggle.
Must add one (small checkbox in controls bar).

### Reconstruction label
Currently hardcoded as "Reconstructed" in HTML. Needs to be a dynamic `<span>` updated by JS
to show "Dirty Image" (default) or "CLEAN Output" (when CLEAN is on).

### CLEAN algorithm parameters (from request)
- Gain: 0.1
- Max iterations: 1000
- Stop threshold: 5% of initial peak
- Restore beam: Gaussian, width auto-calculated from dirty beam FWHM

### Dirty beam orientation
`computeDirtyBeam` returns `ifft2d(mask)`. In math.js IFFT convention, the zero-frequency
(DC) term lands at index [0][0], making [0][0] the PSF peak. To subtract the beam at
position (r,c) in the dirty image: `beam[((i-r)%N+N)%N][((j-c)%N+N)%N]` — periodic wrap. ✓

### FFT convolution normalization
`ifft2d(fft2d(f) .* fft2d(g))` = circular convolution of f and g (math.js 1/N normalization
per ifft pass = 1/N² total = correct IDFT normalization). No extra scaling needed. ✓

## Invariants To Preserve
- UV coverage pipeline untouched
- Dirty image still computed and dirty beam still displayed in PSF canvas
- `reconstructImage()` signature unchanged — CLEAN is a post-processing layer
- `computeDirtyBeam()` unchanged
