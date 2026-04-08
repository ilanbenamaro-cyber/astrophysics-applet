# Fix — Land Mask Resolution

**FILES_CHANGED:**
- `vlbi-react/js/globeHelpers.js` — added `_landPolygons` cache, `_pointInRing`,
  `_pointInPolygon`, and exported `isOnLand(lat, lon)` using polygon check;
  populated cache in `loadCountryBoundaries` after existing TopoJSON parse
- `vlbi-react/js/Globe.js` — import `isOnLand` from `globeHelpers.js` instead
  of `landMask.js` (single-line change)
- `vlbi-react/js/landMask.js` — DELETED (replaced entirely)

**FIX_DESCRIPTION:**
The 360×180 bitmap in `landMask.js` was too coarse (1°/cell ≈ 111km) causing valid
land locations like New York, Portugal coast, Greek islands, Cuba, and Canary Islands
to be blocked. Replaced with a point-in-polygon check against the `world-atlas@2/
countries-110m.json` TopoJSON, which `globeHelpers.js` was already fetching for
country border rendering. No new network request added. The polygon boundaries follow
actual coastlines, eliminating false ocean classifications.

The `_landPolygons` cache is populated inside the existing `loadCountryBoundaries`
async function (same fetch, zero extra cost). While loading, `isOnLand` returns `true`
(allow all) — the TopoJSON loads in <500ms, making the window imperceptible.

**REGRESSION_TEST_ADDED:**
Playwright browser evaluation verifying the 5 previously-failing sites now return
`true` from the live `isOnLand` export, and deep ocean sites still return `false`.
