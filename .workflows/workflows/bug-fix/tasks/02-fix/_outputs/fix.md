# Fix — Three vlbi-react Bugs

**FILES_CHANGED:**
- `vlbi-react/js/globeHelpers.js` — isOnLand improvements: null→false fallback, vertex buffer check, _landVertices cache, catch sets empty arrays
- `vlbi-react/js/App.js` — controls.method→useClean/useMem booleans, computed method before worker send, updated restoredLabel, updated useEffect deps, updated handleReset
- `vlbi-react/js/ControlsPanel.js` — added Max Entropy checkbox alongside CLEAN checkbox

**FIX_DESCRIPTION:**

Issue 1 (land blocked): Added vertex proximity buffer in isOnLand(). After the polygon
check, iterates all polygon vertices; if any vertex is within LAND_BUFFER_DEG=3° of the
click, returns true. Handles Canary Islands, Greek islands, and all coastal edges where
the 110m polygon boundary is imprecise. Continental interiors still pass the polygon
check; deep ocean is > 3° from any vertex and remains blocked.

Issue 2 (ocean through during load): Changed null-state fallback from `return true` to
`return false`. Brief loading window (< 500ms) now blocks all clicks rather than allowing
ocean. In catch block, sets _landPolygons=[] and _landVertices=[] so isOnLand resolves
after a failed fetch rather than staying permanently null.

Issue 3 (MEM removed): Replaced controls.method string with two independent booleans
(useClean, useMem). Effective method derived just before worker postMessage: CLEAN takes
precedence over MEM over dirty. ControlsPanel now renders two checkboxes. restoredLabel
covers all three cases: 'CLEAN', 'Max Entropy', 'Dirty Image'.

**REGRESSION_TEST_ADDED:**
Playwright script: verify isOnLand returns false when _landPolygons is null; verify
Canary Islands and Greek islands return true after load; verify Atlantic center returns
false; verify all three method values reach worker correctly via controls state.
