# Run Log: Physics Guided Tour
**Date:** 2026-04-08
**Score:** 9/10
**Commit:** 67cdc1a

## Feature Delivered
8-act physics guided tour for `vlbi-react/`:
- Act 1: Single-Dish Resolution (no spotlight, dish diagram, θ≈λ/D)
- Act 2: Baselines & Correlations (globe spotlight, auto-places ALMA+IRAM)
- Act 3: The Fourier Connection (UV panel spotlight, van Cittert-Zernike)
- Act 4: Earth-Rotation Synthesis (UV panel spotlight, loads EHT, UV arc animation)
- Act 5: The Dirty Image (image panel spotlight, sets method=dirty)
- Act 6A: Max Entropy Reconstruction (controls spotlight, sets method=mem)
- Act 6B: CLEAN Deconvolution (controls spotlight, sets method=clean)
- Act 7: Black Hole Imaging (no spotlight, loads EHT+blackhole+clean)

## Files Created
- `vlbi-react/css/tour.css` (290 lines)
- `vlbi-react/js/Tour.js` (211 lines)
- `vlbi-react/js/TourCard.js` (122 lines)
- `vlbi-react/js/TourDiagram.js` (536 lines)

## Files Modified
- `vlbi-react/index.html` — KaTeX + Rough.js CDN defer scripts, tour.css link
- `vlbi-react/js/App.js` — tourActive/tourActIndex state, handleTourAction, Tour render, IDs, Tour button
- `vlbi-react/js/AppSidebar.js` — id="tour-controls" on observation parameters section

## Fix Applied Mid-Implementation
`core.js` does not export `useLayoutEffect`. Tour.js was updated to import it directly from `'react'` instead of `'./core.js'`.

## Playwright Results
- KaTeX loaded: true
- Rough.js loaded: true
- Tour button found: true
- All 8 act titles correct
- KaTeX renders in collapsible math section
- Back disabled on Act 1
- Finish ✓ button on Act 8
- Tour card closes after finish
- Tour restarts correctly
- Skip works correctly
- No new JS errors (pre-existing unpkg CORS for earth texture — documented in gotchas.md)
