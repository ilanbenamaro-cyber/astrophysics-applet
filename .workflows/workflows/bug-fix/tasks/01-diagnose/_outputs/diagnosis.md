# Diagnosis — Land Mask Too Coarse

**BUG_SUMMARY:**
`vlbi-react/js/landMask.js` uses a 360×180 (1° per cell) precomputed bitmap. Each cell
is ~111km × 111km at the equator. Coastal areas, islands, and peninsulas narrower than
~55km fall into cells the bitmap classifies as ocean, blocking valid telescope placement.

**REPRODUCTION: CONFIRMED**
Tested 15 known coordinates against the bitmap. 5 land sites incorrectly return false:
- New York (40.7°N, 74.0°W)     → false  [should be true]
- Portugal coast (38.7°N, 9.1°W) → false  [should be true]
- Canary Islands (28.3°N, 16.5°W)→ false  [should be true]
- Greek islands (37.4°N, 25.3°E) → false  [should be true]
- Caribbean Cuba (22.0°N, 80.0°W)→ false  [should be true]

**ROOT_CAUSE: CONFIRMED**
`landMask.js` line 22-25 — the lookup function maps lat/lon to a 1°×1° grid cell and
returns the precomputed bit. At 1° resolution, any land feature narrower than ~1 degree
(~111km) can be lost or misrepresented. New York City — one of the most famous cities
on Earth — returns ocean. The data is structurally too coarse to be reliable.

**ROOT_CAUSE_FILE:** `vlbi-react/js/landMask.js` lines 22–25

**HYPOTHESES_RULED_OUT:**
- H1: The lookup algorithm is wrong (wrong index math) — RULED OUT. The row/col math
  is correct; New York and Portugal are simply in cells the bitmap marks as ocean.
- H2: The base64 data was corrupted — RULED OUT. Ocean sites correctly return false;
  large land masses (Japan, UK, Indonesia) return true. The data itself is just too low-res.
- H3: A 2-3° buffer zone would fix it — RULED OUT as an approach. A buffer large enough
  to fix coastal areas would allow ocean placement within ~300km of any coast.

**FIX_APPROACH:**
Replace the bitmap with a point-in-polygon check against the `world-atlas@2/countries-110m.json`
TopoJSON already loaded by `globeHelpers.js`. Add `_landPolygons` module-level cache to
`globeHelpers.js`, populate it inside `loadCountryBoundaries` after parsing features, and
export `isOnLand(lat, lon)` using the ray-casting algorithm. Update `Globe.js` to import
from `globeHelpers.js` instead of `landMask.js`. Delete `landMask.js`.

Fallback while TopoJSON loads: return `true` (allow all clicks) — the async load
completes in <500ms, and the false-positive window is imperceptible to users.

**REGRESSION_TEST:**
Playwright browser evaluation: verify same 5 previously-failing sites now return `true`,
verify deep ocean sites still return `false`, verify all EHT presets remain land-classified.
