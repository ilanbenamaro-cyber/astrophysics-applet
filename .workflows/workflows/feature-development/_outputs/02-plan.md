# Task 02 — Plan Output
# Feature: CLEAN deconvolution algorithm

## Change 1 — js/imageProcessor.js (new function, append after reconstructImage)

Add `cleanDeconvolve(dirtyImage, dirtyBeam, opts)`:

Steps:
1. Copy dirty image to `residual[][]`; init `components[][]` = 0
2. Normalize: find beam peak at [0][0] (the PSF maximum)
3. Find initial peak of residual for stop threshold = 0.05 × initialPeak
4. CLEAN loop (max 1000 iters):
   a. Find peak (r,c) in residual
   b. Break if |peak| < stopLevel
   c. Subtract `gain × peak × beam` (beam rolled to align center with (r,c)) from residual
   d. Accumulate `gain × peak / beamPeak` into components[r][c]
5. Estimate restore beam FWHM: walk row 0 of dirty beam until value ≤ halfMax; sigma = halfWidth/2.355
6. Build Gaussian restore beam G[i][j] centered at [0][0] (periodic wrap for i,j)
7. FFT-convolve components with G: ifft2d(fft2d(components) .* fft2d(G))
8. Return restored + residual

## Change 2 — index.html

In `<div class="control-group buttons">`:
- Add after "Save Image" button:
  ```html
  <label class="clean-toggle">
      <input type="checkbox" id="use-clean"> CLEAN
  </label>
  ```

In Panel 3 (Image Reconstruction):
- Change `<p class="image-label">Reconstructed</p>`
  to `<p class="image-label" id="recon-label">Dirty Image</p>`

## Change 3 — js/app.js

In `_reconstruct()`:
1. Compute dirty image (existing) → `pixels`
2. Compute dirty beam (existing) → `beam`
3. Read `document.getElementById('use-clean').checked`
4. If CLEAN enabled: call `cleanDeconvolve(pixels, beam, {gain:0.1, maxIter:1000, threshold:0.05})`
   → `finalPixels`; update label to "CLEAN Output"
   Else: `finalPixels = pixels`; update label to "Dirty Image"
5. Render `finalPixels` to `reconstructed-canvas`

Add event listener:
```js
document.getElementById('use-clean').addEventListener('change', runReconstruction);
```

## Change 4 — css/style.css

Add `.clean-toggle` rule:
```css
.clean-toggle {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    font-size: 0.85rem;
    user-select: none;
}
```

## Invariants
- `computeDirtyBeam()` — unchanged
- `reconstructImage()` — unchanged (still computes dirty image internally; _reconstruct re-uses it)
- UV pipeline — untouched
- dirty-beam-canvas — still shows PSF regardless of CLEAN mode
