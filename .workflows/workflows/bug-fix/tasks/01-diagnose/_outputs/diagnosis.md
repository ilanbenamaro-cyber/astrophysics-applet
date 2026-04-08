# Diagnosis — Ocean Telescope Placement

**BUG_SUMMARY:**
Telescopes can be placed in the ocean because `vlbi-react/js/Globe.js` click handler
calls `onAddRef.current(lat, lon)` for any raycaster hit on the Earth sphere mesh,
with no land/ocean guard. The same bug was fixed in the root app (commit e396074)
but the fix was applied to root files only — not to the vlbi-react live version.

**REPRODUCTION: CONFIRMED**
Verified by reading `Globe.js` lines 199–205: raycasts against `earthMesh`
(a perfect sphere), converts hit point to lat/lon, immediately calls `onAddRef.current`.
No land check present. Any click on the globe surface — land or ocean — triggers placement.

**ROOT_CAUSE: CONFIRMED**
`onPointerUp` in `Globe.js` performs raycasting against the Earth sphere (lines 190–206).
The sphere geometry is uniform — there is no surface attribute distinguishing land from
ocean. The handler has no guard and calls `onAddRef.current(lat, lon)` unconditionally
on every surface hit.

**ROOT_CAUSE_FILE:** `vlbi-react/js/Globe.js` lines 199–205

```js
const hits = raycaster.intersectObject(earthMesh);
if (hits.length > 0) {
  const pt = hits[0].point;
  const lat = Math.asin(pt.y) * 180 / Math.PI;
  const lon = Math.atan2(pt.z, pt.x) * 180 / Math.PI;
  onAddRef.current(lat, lon);   // ← called even for ocean clicks
}
```

**HYPOTHESES_RULED_OUT:**
- H1: App uses topojson country features for point-in-polygon check — RULED OUT.
  `loadCountryBoundaries` in `globeHelpers.js` only uses the topojson data for
  rendering border lines and labels; it never exports a land-test function.
- H2: Specular map / texture sampling used to detect water — RULED OUT.
  Textures are loaded asynchronously and `getImageData` is blocked by CORS
  (known from commit e396074 investigation). Not in the codebase.
- H3: App delegates land check to `handleTelescopeAdd` in `App.js` — RULED OUT.
  `handleTelescopeAdd` adds any telescope without coordinate validation.

**FIX_APPROACH:**
Port the precomputed 360×180 land/water bit array from `js/landMask.js` to a new
ES-module file `vlbi-react/js/landMask.js` that exports `isOnLand(lat, lon)`.
Import it in `Globe.js` and guard `onAddRef.current(lat, lon)` with the check.
Same data, same O(1) lookup, zero async dependencies.

**REGRESSION_TEST:**
Manual browser verification via Playwright:
1. Click mid-Atlantic (lat~20, lon~-40) → no marker placed
2. Click over continental Africa (lat~0, lon~20) → marker placed
3. Load EHT presets — all 6 sites still placed correctly (all are on land)
