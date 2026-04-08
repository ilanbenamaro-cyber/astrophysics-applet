# Fix — Ocean Telescope Placement

**FILES_CHANGED:**
- `vlbi-react/js/landMask.js` — NEW FILE: ES module exporting `isOnLand(lat, lon)`
- `vlbi-react/js/Globe.js` — added import + land guard in `onPointerUp`

**FIX_DESCRIPTION:**
Created `vlbi-react/js/landMask.js` as an ES module version of the root app's
`js/landMask.js`. It exports a single `isOnLand(lat, lon)` function backed by the
same precomputed 360×180 bit-packed land/water lookup table (Natural Earth 110m,
public domain). O(1) lookup, no network request, no async dependency.

In `Globe.js`, imported `isOnLand` and wrapped the `onAddRef.current(lat, lon)` call
in an `if (isOnLand(lat, lon))` guard. Ocean clicks now silently do nothing —
consistent with the root app's behavior after commit e396074.

The fix is 2 lines of code change in Globe.js (import + if-guard).

**REGRESSION_TEST_ADDED:**
Manual Playwright verification:
- Ocean click (Atlantic ~20°N, 40°W) → no telescope placed
- Land click (Africa ~0°N, 20°E) → telescope placed
- EHT presets (Load EHT Array) → all 6 sites placed correctly
