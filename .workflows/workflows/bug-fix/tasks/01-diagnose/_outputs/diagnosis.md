# Diagnosis — Three vlbi-react Bugs

**DATE:** 2026-04-07
**STATUS:** ALL THREE ROOT CAUSES CONFIRMED

---

## Issue 1: Valid land areas blocked by telescope placement

**BUG_SUMMARY:** `isOnLand()` in globeHelpers.js uses strict point-in-polygon against
countries-110m.json. Small islands are absent from the 1:110M dataset, and coastal polygon
edges have ~0.1° granularity. Clicks on small islands or near coasts fail the polygon test
and are blocked even though the user is clicking on real land.

**REPRODUCTION:** CONFIRMED via prior session Playwright tests — Canary Islands, Greek
island chains, and NYC exact coastal coordinate all returned false despite being land.

**ROOT_CAUSE:** CONFIRMED
`globeHelpers.js:45-57` — `isOnLand()` returns `false` for any point not strictly inside
a country polygon. No buffer around polygon edges. Coastal and island sites near or between
polygon vertices fall in the gap. The 110m dataset simply has no polygons for territories
smaller than ~100km.

**ROOT_CAUSE_FILE:** `vlbi-react/js/globeHelpers.js:45-57`

**HYPOTHESES_RULED_OUT:**
- Algorithm bug in ray-casting: NO — the algorithm is correct, confirmed by all 6 EHT sites passing
- Coordinate mismatch between click and polygon: NO — click handler and GeoJSON both use geographic lon/lat

**FIX_APPROACH:** Add a vertex proximity buffer (3 degrees) after the polygon check. Any click
within 3 degrees of any polygon vertex is treated as land. Continental interiors still pass via
polygon check. Coastal edges and small islands hit the buffer. Deep ocean (Pacific/Atlantic center)
is far from all vertices and remains blocked.

**REGRESSION_TEST:** After fix: Canary Islands (~28.3N, -16.5W) and Greek island Santorini
(~36.4N, 25.4E) should return true from isOnLand. Atlantic center (0, -30) should return false.

---

## Issue 2: Deep ocean clicks getting through the land check

**BUG_SUMMARY:** During the async loading window for countries-110m.json, `isOnLand()` returns
`true` for all coordinates — including open ocean. Users clicking quickly after page load can
place telescopes in the Pacific, Atlantic, or Indian Ocean.

**REPRODUCTION:** CONFIRMED — globeHelpers.js line 46: `if (!_landPolygons) return true`.
`loadCountryBoundaries` is async (fetch + JSON parse). Until it resolves, `_landPolygons` is
null and every click is allowed.

**ROOT_CAUSE:** CONFIRMED
`globeHelpers.js:46` — `return true` fallback during null state = allow-all during load window.

**ROOT_CAUSE_FILE:** `vlbi-react/js/globeHelpers.js:46`

**HYPOTHESES_RULED_OUT:**
- Persistent polygon logic gap: NO — after load the polygon check correctly blocks open ocean.
  Only the null loading window allows ocean through.

**FIX_APPROACH:** Change loading fallback from `return true` to `return false`. Brief window
(< 500ms) now blocks all clicks. If fetch fails, set `_landPolygons = []` and `_landVertices = []`
in the catch block — blocked-after-failure is acceptable since we cannot know what is land.

**REGRESSION_TEST:** With _landPolygons = null, isOnLand must return false (not true).

---

## Issue 3: Max Entropy reconstruction method removed from UI

**BUG_SUMMARY:** ControlsPanel.js was changed to a single CLEAN checkbox, removing Max Entropy
from the UI entirely. worker.js MEM implementation is intact.

**REPRODUCTION:** CONFIRMED — ControlsPanel.js:14-23 renders only a CLEAN checkbox.
No MEM toggle or button exists anywhere in the UI.

**ROOT_CAUSE:** CONFIRMED
`vlbi-react/js/ControlsPanel.js:14-23` — The 3-method button row was replaced wholesale with a
single CLEAN checkbox. The `method` control was changed to a binary dirty|clean toggle. MEM was
never re-exposed.

Supporting evidence:
- `vlbi-react/js/App.js:231` — restoredLabel lost the 'mem' branch
- `vlbi-react/js/App.js:24-27` — initial state is `method: 'clean'` (no MEM option)
- `vlbi-react/js/worker.js:201-244` — MEM code is 100% intact and working

**ROOT_CAUSE_FILE:** `vlbi-react/js/ControlsPanel.js:14-23`

**HYPOTHESES_RULED_OUT:**
- MEM removed from worker: NO — worker.js:201-244 has full MEM implementation

**FIX_APPROACH:**
- Replace `controls.method` string with two booleans: `useClean: true, useMem: false`
- Compute effective method before sending to worker (CLEAN wins if on, else MEM if on, else dirty)
- ControlsPanel.js: two checkboxes (CLEAN + Max Entropy) using existing .clean-toggle CSS
- App.js: update restoredLabel for all three cases

**REGRESSION_TEST:** Verify all three method values reach worker:
  useClean=true → method='clean'; useClean=false+useMem=true → method='mem';
  useClean=false+useMem=false → method='dirty'
