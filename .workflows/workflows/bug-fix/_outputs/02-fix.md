# Task 02 — Fix Log
# Bug: Telescopes placeable in ocean

## Approach Pivots

**Attempt 1 (rejected):** Pixel-sampling from Blue Marble via `crossOrigin='anonymous'`.
Failed because unpkg.com redirects the image to a versioned URL that doesn't send
`Access-Control-Allow-Origin` headers — image load fails entirely, worse than the bug.

**Attempt 2 (shipped):** Precomputed land/water lookup table from Natural Earth 110m polygons.
- Python script downloads `ne_110m_land.geojson` (127 polygons, public domain)
- Point-in-polygon at 1° resolution → 360×180 = 64,800 cells
- Outputs as base64-packed bit array in `js/landMask.js`
- Zero CORS concerns, zero external runtime dependencies, O(1) lookup per click

## Files Changed

### js/landMask.js (new)
- 10,800-char base64 bit array (8,100 bytes of land/water data)
- Exposes `window._isLand(lat, lon)` — returns true for land, false for ocean
- IIFE wraps Uint8Array decode; no globals leaked except `_isLand`

### js/mapController.js
- Added `onRejectCallback` module variable
- `initGlobe()` accepts optional 3rd arg `onReject`
- `_onClick()`: calls `_isLand(lat, lon)` before `addTelescope`;
  calls `onRejectCallback()` and returns early on ocean click
- Removed `_landCanvas`, `_buildLandCanvas` (pixel approach abandoned)
- Restored original image loading (no crossOrigin attribute)

### js/app.js
- `initGlobe` call passes `onReject` → `updateStatus('Telescopes can only be placed on land.')`

### index.html
- Added `<script src="js/landMask.js">` before mapController.js

## Spot-Check Results (13/13 pass)
Africa, Brazil, Siberia, Antarctica, Greenland → land ✓
Atlantic, Pacific, Indian Ocean → ocean ✓
ALMA, IRAM 30m, SMA, JCMT, LMT, SMT → land ✓

## Playwright Verification
- `_isLand` defined: true
- Atlantic, Pacific, Indian Ocean: false ✓
- Africa, Brazil, Siberia: true ✓
- All 6 EHT sites: true ✓
- Ocean click blocked, land click adds telescope ✓
- Zero console errors ✓
