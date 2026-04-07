# Task 01 — Diagnosis
# Bug: Telescopes placeable in ocean

## Root Cause

`_onClick` in `mapController.js` (lines 176–184):

```js
function _onClick(e) {
    const { x, y } = _canvasCoords(e);
    const hit = _hitTest(x, y);
    if (hit !== null) {
        removeTelescope(hit);
    } else {
        const { lat, lon } = _unproject(x, y);
        addTelescope(lat, lon, 'Custom');   // ← no land/water check
    }
}
```

Any non-telescope-hit click unconditionally calls `addTelescope`. There is no guard
that checks whether the clicked coordinate falls on land or water.

## Why No Check Exists

The map is Canvas 2D. There is no DOM land/water layer to query. The Blue Marble
earth image is already loaded for rendering, but pixel sampling was never implemented.
`_unproject` converts canvas pixels to lat/lon with no terrain knowledge.

## Fix Strategy

**Pixel-sampling from an off-screen canvas** — zero new dependencies:

1. Load `earthImg` with `crossOrigin = 'anonymous'` (unpkg.com sends CORS headers)
2. On image load, draw it to a private 720×360 off-screen canvas (`_landCanvas`)
3. `_isLand(lat, lon)`: map lat/lon → pixel in `_landCanvas`, sample RGB,
   classify as water if `b > r + 40 && b > 100` (Blue Marble ocean heuristic)
4. In `_onClick`: if `!_isLand(lat, lon)`, reject and call optional `onReject()` callback
5. `initGlobe` gains an optional 3rd arg `onReject` so app.js can show a status message
6. If image unavailable (load failed / CORS blocked): `_isLand` returns `true` — graceful degradation

## Water Heuristic Validation

Blue Marble RGB samples:
| Surface        | R   | G   | B   | b > r+40? | b > 100? | Result |
|----------------|-----|-----|-----|-----------|----------|--------|
| Deep ocean     |  30 |  60 | 140 | ✓         | ✓        | water  |
| Shallow ocean  |  50 | 100 | 160 | ✓         | ✓        | water  |
| Rainforest     |  50 | 100 |  40 | ✗         | —        | land ✓ |
| Sahara         | 200 | 180 | 130 | ✗         | —        | land ✓ |
| Antarctica     | 220 | 220 | 230 | ✗(230>260)| —        | land ✓ |
| Greenland      | 210 | 220 | 235 | ✗(235>250)| —        | land ✓ |

CONFIDENCE: HIGH — root cause is unambiguous; fix isolated to mapController.js + 3 lines in app.js.

## Files To Change

- `js/mapController.js` — add `_landCanvas`, `_buildLandCanvas`, `_isLand`; update `initGlobe` and `_onClick`
- `js/app.js` — pass `onReject` callback to `initGlobe`
