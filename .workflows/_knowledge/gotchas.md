# Known Gotchas & Failure Modes
# _knowledge/gotchas.md
#
# A running record of things that have gone wrong or are known to be tricky.
# This is episodic memory — what happened, not just what is known.
# Claude reads this at session start and before any task in a related area.

---

## Gotcha Log

---

### Telescope T-numbering ignores non-T names
DATE_DISCOVERED: 2026-03-23
AREA: vlbi-react/js/App.js — handleTelescopeAdd
SEVERITY: MEDIUM

WHAT HAPPENED: After loading EHT presets (ALMA, APEX, etc.), clicking the globe to add a manual telescope produced "T1" instead of "T9". The EHT telescopes were present but invisible to the numbering logic.

ROOT CAUSE: `parseInt(name.slice(1))` returns NaN for named telescopes (ALMA → "LMA" → NaN), so they were filtered out of `usedNums`. The T-number floor was hardcoded to 1, ignoring that 8 slots were already occupied by named telescopes.

HOW TO AVOID: When computing the next T-number, count non-T telescopes separately and use that count as the floor: `let nonTCount = prev.filter(t => isNaN(parseInt(t.name.slice(1)))).length; let displayNum = nonTCount + 1`.

DETECTION: Load EHT presets, click globe. New telescope should be T(n+1) where n = number of EHT telescopes loaded.

RESOLVED: YES — commit bb679d0

---

### unpkg.com CDN does not send CORS headers on redirects
DATE_DISCOVERED: 2026-04-06
AREA: mapController.js — any image loaded from unpkg.com
SEVERITY: HIGH

WHAT HAPPENED: Set `crossOrigin = 'anonymous'` on an Image element loading from unpkg.com. The CDN redirects to a versioned URL which returns 404, and the redirect carries no `Access-Control-Allow-Origin` header. Image fails to load entirely.

ROOT CAUSE: `crossOrigin = 'anonymous'` causes browser to enforce CORS. If any redirect in the chain doesn't send `Access-Control-Allow-Origin`, the load fails completely.

HOW TO AVOID: Never use `crossOrigin = 'anonymous'` on images from unpkg.com. Use precomputed offline data instead (e.g. bundled lookup table).

DETECTION: Console: "has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header." Map falls back to grid.

RESOLVED: YES — replaced with precomputed landMask.js lookup table (commit e396074).

---

### Fixes repeatedly applied to root app instead of vlbi-react
DATE_DISCOVERED: 2026-04-07
AREA: All vlbi-react features — Globe.js, worker.js, App.js, css/app.css
SEVERITY: HIGH

WHAT HAPPENED: Two consecutive bug fixes were implemented in root `js/`, `css/`, `index.html` files. The live deployed version is `vlbi-react/` — root files are an older standalone version not deployed.

ROOT CAUSE: Root files look like the "main" app at a glance. Developer muscle memory edits root files. Deployed URL is vlbi-react/index.html, not root index.html.

HOW TO AVOID: Before editing any JS/CSS/HTML, confirm which version is live by checking CLAUDE.md. Never edit root js/, css/, index.html for features targeting the live app.

DETECTION: git status — if only root files modified for a user-facing fix, the fix is in the wrong place.

RESOLVED: YES (both fixes ported to vlbi-react in that session)

---

### world-atlas countries-110m.json omits small islands
DATE_DISCOVERED: 2026-04-07
AREA: vlbi-react/js/globeHelpers.js — isOnLand polygon check
SEVERITY: LOW

WHAT HAPPENED: Point-in-polygon check against countries-110m.json correctly fixed most bitmap false negatives, but 3 test sites remained ocean: Canary Islands, Greek island chains (Cyclades, Rhodes), and NYC at the exact coastal coordinate.

ROOT CAUSE: Natural Earth 1:110M dataset omits island territories too small to render at that scale. Coastal polygon precision is ~0.1°.

HOW TO AVOID: If island/coastal accuracy matters, switch fetch URL to `countries-50m.json` (~280kb vs ~120kb). No algorithm change needed. EHT presets bypass land check — they're added directly.

DETECTION: A telescope site on a small island cannot be placed by globe click.

RESOLVED: PARTIAL — 110m polygon is much better than 1° bitmap; island gaps remain.

---

### htm template literals don't decode HTML entities
DATE_DISCOVERED: 2026-04-12
AREA: vlbi-react/js/ — all htm-rendered JSX
SEVERITY: MEDIUM

WHAT HAPPENED: `&amp;` written in an htm template literal rendered as the literal string "& amp;" in the browser, not as the `&` character. HTML entities are not decoded in htm template strings.

ROOT CAUSE: htm processes template literals as JS string values, not as HTML. HTML entity decoding is an HTML parser feature — it doesn't apply to JS string content.

HOW TO AVOID: Use plain `&` in htm template strings. If you need `<`, `>`, `"` etc., use the literal character or a Unicode escape, not HTML entities.

DETECTION: Check rendered text in browser for literal entity strings like "&amp;", "&lt;", etc.

RESOLVED: YES — all &amp; replaced with plain & in PhysicsNotesModal.js.

---

### Canvas text clips at CSS-scaled widths
DATE_DISCOVERED: 2026-04-12
AREA: vlbi-react/js/ContourMap.js — canvas rendering
SEVERITY: HIGH

WHAT HAPPENED: ctx.fillText labels placed near the right or bottom edge of the 512×512 canvas were invisible — clipping outside the panel bounds. Moving text further inward helped briefly but the problem recurred at different panel widths.

ROOT CAUSE: The canvas renders at 512×512px internal resolution. CSS scales it to fit the panel (~350-400px). Text placed at canvas coordinate x=480 renders at CSS ~320px — which may be inside or outside the panel border depending on exact width. No amount of inset tuning is reliable.

HOW TO AVOID: Do not add ctx.fillText calls to ContourMap. Use HTML overlay elements (`position:absolute` on a div over the canvas with `pointer-events:none`). This is the established pattern — see `.contour-tick-overlay`, `.contour-cb-labels`, `.contour-cb-levels`.

DETECTION: Labels disappear at certain browser window widths, or are consistently invisible despite being placed "inside" the canvas.

RESOLVED: YES — all canvas text removed and replaced with HTML overlay (2026-04-12).

---

### Web Worker cannot use import maps
DATE_DISCOVERED: 2026-04-01
AREA: vlbi-react/js/worker.js
SEVERITY: HIGH

WHAT HAPPENED: Attempting to add `import { html } from './core.js'` or any import statement in worker.js would throw "Failed to load module script" or silently fail.

ROOT CAUSE: `new Worker(url)` creates a classic worker (not a module worker). Classic workers cannot use ES import or the page's import map. Module workers (`new Worker(url, { type: 'module' })`) work but require serving via HTTP — they don't work on `file://` URLs.

HOW TO AVOID: Keep worker.js self-contained. All helpers (fft1d, gaussConvolve, etc.) must be defined inline in the worker file. Never add import statements.

DETECTION: Worker silently stops working; console shows module load errors from the worker.

RESOLVED: YES — worker.js is and must remain self-contained.

---

### Transferable buffer detaches on postMessage
DATE_DISCOVERED: 2026-04-01
AREA: vlbi-react/js/worker.js + App.js — postMessage with transferable buffers
SEVERITY: HIGH

WHAT HAPPENED: After `postMessage({ dirty, restored }, [dirty.buffer, restored.buffer])`, the worker's `dirty` and `restored` Float64Arrays are detached. Any subsequent read/write throws a TypeError: "Cannot perform %TypedArray%.prototype.slice on a detached ArrayBuffer".

ROOT CAUSE: Transferable semantics: the buffer's "ownership" transfers to the recipient. The sender's ArrayBuffer becomes zero-length/detached immediately after postMessage.

HOW TO AVOID: Never read transferred arrays after postMessage. Compute any needed stats (min/max/sigma) before transferring. App.js must not retain references to these arrays after passing them to the worker either — when the worker result arrives, App.js owns the buffers until the next postMessage.

DETECTION: TypeError about detached ArrayBuffer in worker console or App.js.

RESOLVED: YES — confirmed in architecture.

---

### groupSegments tolerance must stay at 0.1
DATE_DISCOVERED: 2026-04-12
AREA: vlbi-react/js/ContourMap.js — island filter
SEVERITY: MEDIUM

WHAT HAPPENED: Setting groupSegments tolerance to 1.5 (larger proximity radius) caused a real contour arc and nearby false noise islands to merge into one large group. The group then passed the maxDim filter and the false islands were rendered.

ROOT CAUSE: At tol=1.5, segment endpoints within 1.5 source pixels are considered adjacent. This is wide enough to bridge the gap between a real arc and a nearby noise island, merging them. The merged group's maxDim reflects the real arc's size, not the island's.

HOW TO AVOID: Keep `tol=0.1` in the groupSegments call. This was determined by measurement (console.table showing actual group dimensions). The threshold should only be reconsidered with new measurement data.

DETECTION: False contour islands appear in reconstructions that previously showed clean arcs only.

RESOLVED: YES — tol=0.1 is the active value (2026-04-12).

---

### EHT telescope longitude sign convention
DATE_DISCOVERED: 2026-03-22
AREA: vlbi-react/js/constants.js — EHT_PRESETS
SEVERITY: MEDIUM

WHAT HAPPENED: JCMT (Hawaii) was initially placed in the wrong hemisphere — mirrored longitude sign — which produced incorrect UV coverage and a globe position in the Atlantic. Dan Marrone (EHT scientist) identified the error.

ROOT CAUSE: Some published EHT coordinate tables use positive-West convention (West longitude as positive). This codebase uses standard geographic convention (East-positive, West-negative). A sign flip was missed during data entry.

HOW TO AVOID: When adding any new telescope from a published source, verify the longitude convention. Standard geographic: IRAM at lon=-3.392 (3.392° West) is correct. Check against published EHT UV coverage figures before committing.

DETECTION: Globe position obviously wrong (telescope in ocean when it should be on land); UV coverage arcs mirror-imaged compared to published EHT results.

RESOLVED: YES — commit 54c855b.

---

### recoId stale-result check — NOT currently implemented
DATE_DISCOVERED: 2026-04-01
UPDATED: 2026-04-23
AREA: vlbi-react/js/App.js — worker.onmessage handler
SEVERITY: LOW (documented for awareness)

WHAT HAPPENED: The plan described this check but it was never implemented. App.js uses a single worker with a simple onmessage handler that accepts all results. Because React setState batching and the worker's synchronous-per-postMessage nature keep results in order in practice, stale results have not been observed.

ROOT CAUSE: N/A — design decision to keep it simple.

HOW TO AVOID: If rapid-fire control changes produce flickering, add a monotonic `recoIdRef = useRef(0)` incremented in the postMessage call, and skip setState in onmessage if `e.data.id !== recoIdRef.current`.

DETECTION: UI flickers or briefly shows stale reconstruction when controls change rapidly.

RESOLVED: N/A — not yet a problem. Document if it becomes one.

---

### Marching squares generates boundary-terminating segments that draw edge lines
DATE_DISCOVERED: 2026-04-16
AREA: vlbi-react/js/ContourMap.js — contour segment drawing loop
SEVERITY: MEDIUM

WHAT HAPPENED: Contour arcs that reached the image boundary produced a visible connecting line drawn across the canvas edge (most visible at the bottom). The marching squares algorithm generates legitimate segments for boundary cells, but drawing them with moveTo/lineTo connects endpoints along the canvas perimeter.

ROOT CAUSE: Marching squares terminates arcs at the grid boundary by emitting segments whose endpoints land on row=0, row=N-1, col=0, or col=N-1. When scaled to canvas coordinates and drawn, these endpoint-to-endpoint paths trace the canvas edge.

HOW TO AVOID: In the segment drawing loop, discard any segment where either endpoint has scaled canvas coordinate `< 1` or `> DST - 1` (epsilon=1px). Do NOT change the marching squares algorithm itself — the fix is in the rendering layer only.

FIX: `const onBoundary = (x, y) => x < 1 || x > DST - 1 || y < 1 || y > DST - 1; if (onBoundary(x0,y0) || onBoundary(x1,y1)) continue;`

DETECTION: Visible straight line(s) along canvas edges that don't correspond to real source structure.

RESOLVED: YES — commit 335497a

---

### UV pixel coordinates become sub-pixel at small FOV — never use for display
DATE_DISCOVERED: 2026-04-20
AREA: vlbi-react/js/UVMap.js, vlbi-react/js/uvCompute.js
SEVERITY: HIGH

WHAT HAPPENED: After changing fovMuas default from 538 to 80 μas (M87* physical scale), UV arcs disappeared entirely from the UV coverage canvas. Points were rendered but all landed at the canvas center pixel (256, 256).

ROOT CAUSE: `computeUVPoints` pixel coords: `pu = uv.u * scale` where `scale = (1e3/lambda_m) * fovRad`. At fovMuas=80, fovRad ≈ 3.88e-10 rad, so scale ≈ 0.03 pixels/km. For a 10,000 km baseline, pu ≈ 0.3px — sub-pixel. All UV samples round to N/2 = 256.

HOW TO AVOID: Never use `computeUVPoints` pixel coordinates for display. Use `computeUVPointsGl` which returns Gλ coordinates independent of FOV and grid size. UVMap.js now receives `uvPointsGl` (Gλ, centered at 0,0) and auto-scales to max UV extent.

DETECTION: UV coverage canvas is blank (dark) or all arcs appear as a single point at the center despite telescopes being placed.

RESOLVED: YES — commit 8c6ba01. `computeUVPointsGl` added to uvCompute.js; App.js passes `uvPointsGl` to UVMap; UVMap rewrote to use direct Gλ coords.

---

### Playwright ES module registry persists across navigations — use a different port
DATE_DISCOVERED: 2026-04-22
AREA: Playwright browser session — any ES module served via HTTP
SEVERITY: HIGH (development only — does not affect production)

WHAT HAPPENED: After editing `uvCompute.js` (changed `computeUVPoints` return type from array to `{uvPoints, stationPairs}`), Playwright browser continued to use the old module from cache. Navigating to `about:blank` and back, closing the page with `browser_close`, and reloading all failed to clear the stale module. The error `Cannot read properties of undefined (reading 'length') at computeUVFill` persisted despite the file being correct on disk.

ROOT CAUSE: Chromium's ES module registry is per-browsing-context (not per-page). `browser_close` closes the tab but not the context. The Playwright MCP server maintains a single browser context for the entire session, so the module registry survives all navigations.

HOW TO AVOID: When a module's export signature changes (not just internal logic), use one of:
1. **Different port**: `pkill -f "http.server PORT"; python3 -m http.server NEW_PORT &` — new origin = fresh module registry
2. **Version query param**: change `import { ... } from './module.js'` to `./module.js?v=2` in ALL files that import it — remove before committing
Option 1 is cleaner; option 2 is fine for a single file but must be reverted before commit.

DETECTION: Error stack trace points to a line number that doesn't match the actual file (e.g., error at line 98 but function is at line 100 in current file — 2-line diff indicates old cached version).

RESOLVED: YES — port switch to 8081 fixed it for S3. `?v=2` fixed it for S2. For S4-S7 verification, used a no-cache Python server on a fresh port (8083):
```python
class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()
```
This is the most reliable fix — forces Chrome to re-fetch every module on every navigation.

---

### Space telescope objects have no lat/lon — guard all coordinate renders
DATE_DISCOVERED: 2026-04-22
AREA: vlbi-react/js/TelescopeList.js, any component rendering telescope coordinates
SEVERITY: MEDIUM

WHAT HAPPENED: After adding BHEX via `handleAddBHEX`, TelescopeList.js crashed: `TypeError: Cannot read properties of undefined (reading 'toFixed')` at `tel.lat.toFixed(1)`. BHEX_PRESET has no `lat` or `lon` fields.

ROOT CAUSE: TelescopeList assumed all telescope objects had `lat` and `lon`. Space telescopes (type === 'space') have orbital parameters instead.

HOW TO AVOID: Any component rendering telescope coordinates must guard on `tel.type === 'space'`. Pattern:
```js
tel.type === 'space'
  ? `${tel.orbitalAltitudeKm} km orbit`
  : `${tel.lat.toFixed(1)}°, ${tel.lon.toFixed(1)}°`
```
Also: any UV computation receiving the full telescope array must split into `groundTels` and `spaceTels` before applying lat/lon-based ECEF conversion.

DETECTION: Crash when BHEX is added to the array; `toFixed` of undefined.

RESOLVED: YES — TelescopeList.js patched (2026-04-22); uvCompute.js splits arrays correctly.

---

### Math.max spread on Float64Array(N=512) causes stack overflow
DATE_DISCOVERED: 2026-04-24
AREA: vlbi-react/js/fitsExport.js, any code needing max of a large typed array
SEVERITY: HIGH

WHAT HAPPENED: `Math.max(...restoredData)` where `restoredData` is a Float64Array of 512×512=262144 elements throws "Maximum call stack size exceeded" — the spread operator pushes all 262144 values as function arguments, exhausting the call stack.

ROOT CAUSE: JavaScript's function call stack has a limited number of arguments. Spreading a 262144-element array exceeds this limit universally across all browsers and Node.js.

HOW TO AVOID: Always use a for-loop for peak-finding on large typed arrays:
```js
let peak = 0;
for (let i = 0; i < data.length; i++) if (data[i] > peak) peak = data[i];
```
Same applies to any typed array of N=512 size (262144 elements for a 2D image).

DETECTION: "Maximum call stack size exceeded" or "RangeError: too many arguments" from Math.max spread in worker or export code.

RESOLVED: YES — fitsExport.js uses for-loop peak finding. All useMemo MAD computations also use for-loops.

---

### pairId is a string key, not an array index
DATE_DISCOVERED: 2026-04-24
AREA: vlbi-react/js/UVMap.js, vlbi-react/js/useSimulation.js — pairSefdMap
SEVERITY: MEDIUM

WHAT HAPPENED: Plan draft said "look up stationPairs[p.pairId]" — would fail because pairId is a string like "3-7" and stationPairs is a parallel array indexed 0,1,2... not by id strings.

ROOT CAUSE: `uvPointsGl` points have `{ u, v, color, pairId }` where `pairId = \`${t1.id}-${t2.id}\`` (a string). The stationPairs array is parallel to uvPoints (pixel space) but NOT to uvPointsGl. Building a dedicated `pairSefdMap` keyed on the pairId string is the only correct lookup approach.

HOW TO AVOID: `pairSefdMap` in useSimulation is built as: `m[\`${a.id}-${b.id}\`] = { sefdA, sefdB }`. UVMap looks up via `pairSefdMap[p.pairId] ?? { sefdA: 10000, sefdB: 10000 }`. Never try to use pairId as a numeric array index.

DETECTION: SNR mode shows all baselines identical color (all hitting the 10000/10000 fallback).

RESOLVED: YES — pairSefdMap built correctly in useSimulation useMemo (S10).

---

### Tour animPhase: chapter card stale state if navigation is fast
DATE_DISCOVERED: 2026-04-26
AREA: vlbi-react/js/Tour.js — animPhase useEffect
SEVERITY: MEDIUM

WHAT HAPPENED: When the user navigated away before the 2200ms chapter card timer fired, `chapterCard` state remained `true` on the new act. If the new act has no chapter card, the stale card overlay persisted indefinitely.

ROOT CAUSE: The animPhase useEffect only called `setChapterCard(true)` when `CHAPTER_CARDS[actIndex]` exists. It never reset to `false` when navigating to an act without a chapter card. The 2200ms cleanup timer from the previous act was running on the old actIndex and did nothing useful.

HOW TO AVOID: Always call `setChapterCard(false)` unconditionally at the **start** of the animPhase useEffect (before the CHAPTER_CARDS[actIndex] check). Pattern:
```js
useEffect(() => {
  clearTimeout(animTimerRef.current);
  clearTimeout(textTimerRef.current);
  clearTimeout(chapterTimerRef.current);
  setChapterCard(false);           // ← MUST be first, always resets
  setAnimPhase(...);
  if (CHAPTER_CARDS[actIndex]) {
    setChapterCard(true);
    chapterTimerRef.current = setTimeout(() => setChapterCard(false), 2200);
  }
  ...
}, [actIndex, reducedMotion]);
```

DETECTION: Chapter title card ("Chapter II / THE SOLUTION") persists on an act that should not show a chapter card, especially when navigating quickly with the ← / → arrows.

RESOLVED: YES — Tour.js setChapterCard(false) guard added (2026-04-26).

---

### Tour TourCard: visibleCount must use a single consolidated useEffect
DATE_DISCOVERED: 2026-04-26
AREA: vlbi-react/js/TourCard.js — visibleCount useEffect
SEVERITY: MEDIUM

WHAT HAPPENED: A two-effect approach (one effect resetting count to 0 when animPhase !== 'text', a separate effect setting count to `all` when animPhase === 'ready') caused a brief visual flash: count was set to 0 first, then to `all` on the next render. Paragraphs briefly disappeared before reappearing.

ROOT CAUSE: React batches state updates within a single effect, but updates from two separate effects can render as two separate frames. The sequence was: Effect 1 fires (animPhase='ready') → count=0 renders → Effect 2 fires → count=all renders. One extra render shows all paragraphs gone momentarily.

HOW TO AVOID: Use a single switch-style useEffect for visibleCount. All three animPhase cases must be handled in one effect:
```js
useEffect(() => {
  const all = act.paragraphs.length + 1;
  if (animPhase === 'visual') { setVisibleCount(0); return; }
  if (animPhase === 'ready' || reducedMotion) { setVisibleCount(all); return; }
  // 'text': reveal items one by one
  let i = 0;
  const iv = setInterval(() => { i++; setVisibleCount(i); if (i >= all) clearInterval(iv); }, 800);
  return () => clearInterval(iv);
}, [animPhase, act, reducedMotion]);
```

DETECTION: Paragraphs briefly flash invisible when the animPhase transitions from 'visual' → 'ready' (reduced motion / skip).

RESOLVED: YES — TourCard.js consolidated to single effect (2026-04-26).

---

### SVG filter IDs must be scoped per diagram — no shared filter IDs across inline SVGs
DATE_DISCOVERED: 2026-04-26
AREA: vlbi-react/js/TourDiagram.js — all d0N() SVG <defs> blocks
SEVERITY: HIGH

WHAT HAPPENED: If two TourDiagram SVGs both define `<filter id="bloom">`, the browser uses the first one in DOM order for both. When React keeps a prior act's SVG in the DOM during transitions, the wrong filter applies to the next act's elements — bloom intensity, blur radius, or color matrix from the wrong diagram.

ROOT CAUSE: Inline SVG `<filter>` elements are scoped to the document (not to the SVG element). Multiple SVGs with the same filter ID in one HTML document reference whichever `<defs>` block the browser parsed first.

HOW TO AVOID: Always use diagram-scoped filter IDs in TourDiagram.js: `bloom-d01` through `bloom-d08`, `softglow-d03`, `hardblur-d05`, etc. Apply as `filter="url(#bloom-d01)"` (SVG attribute, not a style object). Gradient IDs likewise: `earthGrad-d03`, `beamGlow1-d01`, etc.

DETECTION: Bloom or filter effect looks wrong on an act — different blur radius or unexpected color. SVG renders but filters appear to apply the wrong parameters.

RESOLVED: YES — all 8 diagram defs blocks use scoped IDs (2026-04-26, commit 614932a).

---

### CSS `transform` on SVG elements requires `transform-box: fill-box`
DATE_DISCOVERED: 2026-04-26
AREA: vlbi-react/css/tour.css — .baseline-pulse; any CSS-animated SVG element using translateX/Y
SEVERITY: MEDIUM

WHAT HAPPENED: `.baseline-pulse` CSS animation uses `translateX(760px)` on an SVG `<circle>`. In SVG, the CSS transform origin defaults to `0 0` (top-left of the SVG viewport), not the element's center. The circle was translating from the wrong origin, overshooting or missing its target position.

ROOT CAUSE: CSS `transform-origin` behaves differently in SVG vs HTML. In HTML, `transform-origin: 50% 50%` refers to the element's own bounding box. In SVG, `%` values are relative to the SVG viewport, not the element — so `50% 50%` means the center of the whole SVG canvas. Setting `transform-box: fill-box` makes `%` values relative to the element's fill bounding box, restoring HTML-like behavior.

HOW TO AVOID: Any SVG element animated via CSS `transform` (translate, rotate, scale) must have:
```css
transform-box: fill-box;
transform-origin: center;
```
This is not needed for SVG `transform` attribute animations (which use the SVG coordinate system natively).

DETECTION: CSS-animated SVG element moves to the wrong position or wrong angle. The animation plays but the element ends up offset from the intended target.

RESOLVED: YES — `.baseline-pulse` in tour.css has `transform-box: fill-box; transform-origin: center` (2026-04-26, commit 614932a).

---

### Tour d05 CLEAN scrubber: translateX distance must match SVG panel geometry exactly
DATE_DISCOVERED: 2026-04-26
AREA: vlbi-react/css/tour.css — @keyframes scrubberMove; vlbi-react/js/TourDiagram.js — d05()
SEVERITY: LOW

WHAT HAPPENED: CSS keyframe `scrubberMove` initially used `translateX(580px)` (a rough estimate). The CLEAN panel in d05 starts at x=710 and ends at x=1132, giving an exact width of 422px. At 580px the scrubber rect overshot the panel boundary and left a visible gap.

ROOT CAUSE: The scrubber rect starts at x=710 (left edge of CLEAN panel) with width=422. Its starting position coincides with the dirty/CLEAN dividing line. To reveal the CLEAN panel the rect must slide exactly 422px to the right. Any deviation either leaves dirty panel artifacts or clips into the next visual zone.

HOW TO AVOID: When changing d05's CLEAN panel width or x-position, update `scrubberMove` translateX to match: `CLEAN panel width = (CLEAN panel x2) - (CLEAN panel x1)`. The value must be consistent in the @keyframes definition, the `.scrubber-reveal` reduced-motion override, AND the `[data-reduced-motion]` override.

FIX: `@keyframes scrubberMove { from { transform: translateX(0); } to { transform: translateX(422px); } }` — and the scrubber rect starts at x=710 (the dividing line between dirty and CLEAN panels).

DETECTION: CLEAN panel not fully revealed (scrubber stops short), or scrubber overshoots into surrounding content.

RESOLVED: YES — corrected to translateX(422px) (2026-04-26).

---

### TourDiagram d01–d08 must be React components, never plain function calls
DATE_DISCOVERED: 2026-04-28
AREA: vlbi-react/js/TourDiagram.js — TourDiagram export
SEVERITY: HIGH

WHAT HAPPENED: Each d0N function uses `useRef` and `useEffect`. If called as a plain function (`d01(props)` inside a switch), React's Rules of Hooks are violated — hooks can only be called inside React function components or custom hooks. The result is a cryptic "hooks called in wrong order" error or silent misbehavior.

ROOT CAUSE: Canvas 2D RAF loop requires useRef (canvas DOM node + RAF id). These are hooks. Plain function calls bypass React's hook tracking.

HOW TO AVOID: The TourDiagram export must render via component syntax:
```js
const comps = [null, d01, d02, d03, d04, d05, d06, d07, d08];
const Comp = comps[diagramId];
return html`<${Comp} reducedMotion=${reducedMotion}/>`;
```
Never use `case 1: return d01({ reducedMotion })` or any direct call pattern.

DETECTION: "Invalid hook call" React error; or hooks work in isolation but fire wrong in tour navigation.

RESOLVED: YES — TourDiagram export uses component array + html`<${Comp}/>` (2026-04-28, commit bed2d45).

---

### Canvas 2D dish panel grid: arc direction must be counterclockwise (upper semicircle)
DATE_DISCOVERED: 2026-04-28
AREA: vlbi-react/js/TourDiagram.js — drawDish()
SEVERITY: MEDIUM

WHAT HAPPENED: Panel grid arcs inside the dish bowl were drawing on the BACK of the dish (lower semicircle, outside the bowl) instead of the face (upper semicircle, inside the bowl). The clip path looked correct but the arcs were invisible because they fell outside the clipped region.

ROOT CAUSE: `g.arc(cx, groundY-42*sc, f*68*sc, Math.PI, Math.PI*2)` — clockwise from π to 2π = lower semicircle (ground-side, outside the bowl). The dish parabola opens upward (vertex at bottom, rim at top). The interior face is the UPPER region (y < groundY-42). The correct call is counterclockwise 0 to π: `g.arc(cx, groundY-42*sc, f*68*sc, 0, Math.PI, true)`.

HOW TO AVOID: In screen coordinates (y increases downward), "upper semicircle" = the top half = counterclockwise from 0 to π (anticlockwise flag = true). "Lower semicircle" = clockwise from 0 to π or clockwise from π to 2π.

DETECTION: Panel grid concentric arcs invisible, or clip produces empty region instead of dish face.

RESOLVED: YES — changed to `g.arc(..., 0, Math.PI, true)` in drawDish (2026-04-28, commit bed2d45).

---

### Canvas 2D: g.filter must be reset to 'none' after every blur effect
DATE_DISCOVERED: 2026-04-28
AREA: vlbi-react/js/TourDiagram.js — d05 artifact blobs, d07 star layers, d08 CTA
SEVERITY: HIGH

WHAT HAPPENED: If `g.filter='blur(Npx)'` is set and not subsequently reset to `'none'`, every subsequent canvas draw operation in that frame also renders blurred — including text, lines, and shapes that should be crisp.

ROOT CAUSE: Canvas 2D filter state persists until changed. Unlike `g.globalAlpha` which is commonly reset, `g.filter` is easy to forget.

HOW TO AVOID: Always reset immediately after the blurred draw:
```js
g.save(); g.filter='blur(8px)';
// ... draw blurred content ...
g.filter='none'; g.restore();  // or just g.filter='none' if not using save/restore
```
`g.restore()` alone is insufficient — the filter is part of save/restore state, but inside the save block the filter change applies. Reset explicitly before drawing crisp content.

DETECTION: Text or lines appear soft/blurry when they should be sharp, especially following a blur effect earlier in the frame's draw function.

RESOLVED: YES — all three blur sites in TourDiagram.js have explicit `g.filter='none'` resets (2026-04-28, commit bed2d45).

---

### Tour engine-real rebuild — several TourDiagram/TourCard gotchas are now OBSOLETE; new invariants
DATE_DISCOVERED: 2026-06-10
AREA: vlbi-react/js tour subsystem
SEVERITY: INFO

WHAT CHANGED: The tour was rebuilt (commits 2fd3bea..64480e5). `TourDiagram.js` and `TourCard.js` were
DELETED. The following historical gotchas above are now OBSOLETE (kept for provenance, do not act on them):
- "Tour animPhase: chapter card stale state" — chapter cards removed; Tour.js rebuilt.
- "Tour TourCard: visibleCount single consolidated useEffect" — TourCard deleted.
- "SVG filter IDs must be scoped per diagram" — already obsolete (Canvas 2D); TourDiagram now deleted.
- "Tour d05 CLEAN scrubber translateX" — d05 gone.
- "TourDiagram d01–d08 must be React components" — deleted. (New scenes are PLAIN objects {init,drawFrame,
  onPointer}, not React components — only the Tour.js host uses hooks. Do not add hooks to scene modules.)
- "Canvas 2D dish panel grid arc direction" — drawDish deleted.
STILL ACTIVE & now also apply to the new tour: worker no-imports; Math.max-spread→for-loop; Playwright
fresh-port on module-signature change; pairId is a string key; space telescopes have no lat/lon;
g.filter='none' after any blur (general Canvas 2D rule).

NEW INVARIANTS (this rebuild):
1. `simCore.runReconstruction` TRANSFERS `grayscale.buffer` to its worker (zero-copy). The passed array is
   DETACHED on return — always pass a fresh `.slice()` if you need to keep the source (scenes do this).
2. Tour scene annotations are drawn ON the act canvas (tourAnnotations.js), never as DOM overlays, so they
   can't intercept pointer events (G8 holds by construction). The host forwards canvas pointer events to
   `scene.onPointer(data, {type,nx,ny,mode,phase})` — guided interactivity mutates the init-returned `data`.
3. The hook's persistent-worker dispatch effect was deliberately NOT rewired to runReconstruction — keep it
   that way (rewiring changes worker lifecycle + stale-result ordering = behavior change).
4. worker.js `progressEvery` is opt-in; never make it default — absent flag must stay byte-identical.

DETECTION: "detached ArrayBuffer" from a scene re-running reconstruction without slicing; guided drag not
responding (scene.onPointer not wired or data._layout not set); app reconstruction regressions after touching
useSimulation memos (re-verify G12 on a fresh port).

RESOLVED: N/A — invariants to preserve.

---

## Pattern: Things To Always Check

□ After any change to telescope naming logic — verify EHT preset + manual click produces T(n+1) not T1
□ Never use crossOrigin='anonymous' on unpkg.com images — CDN redirects block load entirely
□ All live-app changes go to vlbi-react/ — never root js/, css/, index.html
□ No import statements in worker.js — classic worker, cannot use import maps
□ No ctx.fillText in ContourMap — use HTML overlay pattern (established 2026-04-12)
□ New EHT coordinates: verify longitude sign (East-positive standard) against published UV coverage
□ groupSegments tolerance stays at 0.1 — only change with new measurement data
□ Contour boundary segments: any segment with endpoint at canvas edge must be discarded (epsilon=1px) — do not fix in marching squares, fix in drawing loop
□ Playwright module cache: if a module's export signature changed, switch HTTP server port or use ?v=N query param (remove before commit)
□ Any component rendering telescope lat/lon must guard on type==='space' — BHEX has no lat/lon
□ computeUVPoints/computeUVPointsGl must split telescopes into groundTels/spaceTels before ECEF conversion — space telescopes use computeSatelliteECEF, not latLonToECEF
□ Math.max spread on Float64Array of N=512 (262144 elements) → stack overflow. Always use for-loop for peak-finding.
□ pairId is a string key ("3-7"), not an array index. Use pairSefdMap[p.pairId], never stationPairs[p.pairId].
□ Tour.js animPhase useEffect: setChapterCard(false) must be the FIRST statement — before any CHAPTER_CARDS[actIndex] check. Prevents stale chapter card on acts without a card.
□ TourCard.js visibleCount: single consolidated useEffect (not two separate effects) — prevents flash on visual→ready transition.
□ Tour d05 scrubberMove translateX must equal the CLEAN panel width in d05() SVG geometry. If d05 panel layout changes, update CSS keyframe and both reduced-motion overrides to match.
□ SVG filter IDs in TourDiagram.js must be diagram-scoped (bloom-d01..d08, not "bloom"). Multiple inline SVGs in one document share the same filter ID namespace — a shared ID resolves to the first defs block in DOM order.
□ CSS-animated SVG elements using translateX/Y/rotate must have `transform-box: fill-box; transform-origin: center` — otherwise % transform-origin values resolve to SVG viewport, not element bounding box.
□ TourDiagram d01–d08 are React components — always render via `html\`<${Comp}/>\``, never call as plain functions. Rules of Hooks apply.
□ Canvas 2D: `g.filter` must be reset to `'none'` after every blur effect — it persists across draw calls unlike globalAlpha (which at least gets reset at frame end).
□ Canvas 2D dish arc direction: counterclockwise (anticlockwise=true) for upper semicircle (inside bowl face). `g.arc(cx,y,r, 0,Math.PI, true)` = upper; `g.arc(cx,y,r, Math.PI,2*Math.PI)` = lower (outside bowl).
□ Tour physics numbers: NEVER hardcode in TourDiagram.js act code — read from TOUR_PHYSICS (tourPhysics.js). HEADLINE baseline = the M87*-OBSERVING max (SPT excluded by the imported elevation filter): IRAM↔JCMT 10,883 km → θ=λ/B≈24.7 μas → displays "25" (matches published EHT + the live tool). The geometric array max (11,406 km, IRAM↔SPT) is exposed as `ehtArrayMaxBaselineKm` but NEVER shown as resolution. Every act that shows it carries the mandatory "M87*" qualifier. Acts 1/2/4/7/8 read the same `P.str.thetaEht`/`P.str.ehtBaseline`.
□ Tour shadow coefficient: single-sourced in tourPhysics — `P.bcFormula='√27·GM/c²'` (RADIUS), `P.shadowDiamFormula='2√27·GM/(c²d)'` (DIAMETER = the 42 μas the image shows). d05 canvas AND Tour.js First Light equation must both use shadowDiamFormula. Never pair 3√3 (radius coeff) with the 42 μas diameter — that was the bug.
□ Tour M87*-baseline filter: tourPhysics `maxBaselineKmVisible` imports `computeElevation`+`MIN_ELEVATION_RAD` from uvCompute.js (now exported) — the SAME filter the live tool uses. Never re-implement elevation/visibility; same single-source rule as latLonToECEF.
□ Tour BHEX figures: always tagged "pending sign-off" and shown as "B ~ R⊕ + h" with "~", never "B = R⊕ + h". The orbital radius is NOT the ground-to-satellite baseline (which is geometry-dependent, ≤2R⊕+h). Applies to canvas (d07) AND Tour.js prose (act 7).
□ ctx.fillText IS allowed on the tour canvas (the "no fillText" rule is only for ContourMap's HTML-overlay pattern). Tour canvas internal res = offsetWidth*dpr, so no CSS-scale clipping. Derivation panels, axis ticks, concept tags all use fillText.
□ Tour deference (Apple-precision pass): NO HUD corner frames (drawHudFrame deleted); glass `drawDerivationPanel` only in Acts 1 & 5 (+ a slim 2-line integrity panel in d07). Other acts integrate physics as inline captions/labels. drawConceptTag is a quiet low-opacity line, not a bracketed chrome element. Don't re-add per-act cards/HUD — that was the "cookie-cutter" regression.
□ Tour Earth: use `drawPlanet(g,cx,cy,r,{rot})` (modeled — terminator aligned to upper-left key light, rotating PLANET_BLOBS land masses, lit limb) in d03/d07. The old flat `drawEarth` reads as a button; don't use it for hero globes.
□ Tour d05 dirty→clean: `dirtyA` (sidelobe field) fades over T∈[1.2,4.0]; clean ring `reveal` over T∈[2.0,4.8]. The dirty field is FULL at mount (T=0). Playwright can't freeze a mid-RAF frame (RAF advances during the seconds of screenshot-tool latency between calls) — verify the transformation by logic/early-frame, not a single late screenshot.
□ TourDiagram shared utils (drawDerivationPanel/drawContactShadow/drawAxisTicks/drawScaleBar/drawForegroundAccent/drawConceptTag/drawPlanet/roundRect) are APPEND-ONLY helpers after drawEarth — reused across acts. Reset g.filter='none' after any blur inside them (drawForegroundAccent, drawPlanet path, d05 dirty, d07/d08 fuzzy rings all use blur).
□ Tour COLOURS/TYPE come from tourTokens.js (reads app :root via getComputedStyle, verbatim fallbacks) — the single source of VISUAL truth, like tourPhysics.js for numbers. NEVER hardcode a tour palette hex; reference the palette constants (BG/GOLD/AM/TEAL/BLUE/GLOW/RED/DIM/TXT/AMBER/BG2/BG3/BORDER/FONT/MONO), all remapped to site tokens. The site = warm-neutral dark + ONE muted-gold accent #C4A555. Banned in the tour: bright gold #ffd166/#FFD700, saturated teal #06d6a0, cyan #4cc9f0, candy nebula hues, blue-black panel fills, Georgia/Courier (the app has NO serif; use Inter + --font-mono). Governed by DESIGN-LANGUAGE.md.
□ Tour scene art (nebulae/beams/Earth/rings): LICENSED to be cinematic but its palette must derive from the site family (MODERATE) — desaturated gold/amber/orange + neutral + ONE slate cool #3a4a6a; Earth keeps realistic blue (matches the app globe). Don't reintroduce saturated cosmic colour.
□ Conformance is the gate, not beauty: a tour panel beside an app panel must be indistinguishable (accent/text/font/radius/hairline/fill/spacing). Re-skin, never redesign. (Tour now = engine-real scenes; the conformance/tourTokens/tourPhysics/DESIGN-LANGUAGE rules below STILL apply to scene chrome + colour + numbers.)
□ ENGINE-REAL TOUR (post 2026-06-10 rebuild): TourDiagram.js + TourCard.js are DELETED — checklist items above that name d01–d08, drawDish, drawPlanet, chapter cards, scrubberMove, SVG filters are OBSOLETE. The tour is Tour.js (host) + tourActs.js (data) + tourScenes.js (registry) + sceneA–E.js + tourScene/tourAnnotations/TourEquation/TourSpine.
□ simCore.runReconstruction transfers grayscale.buffer — pass a `.slice()`, never the array you want to keep.
□ Scene modules are plain objects {init,drawFrame,onPointer} — NO React hooks inside them (only Tour.js host uses hooks). Annotations draw on the act canvas, not DOM overlays (G8 by construction).
□ Do NOT rewire useSimulation's persistent-worker dispatch effect to runReconstruction — it would change worker lifecycle + stale-result ordering. Only the pure memos call simCore fns.
□ worker.js progressEvery is opt-in and must stay byte-identical when absent. Worker stays import-free.
□ After touching useSimulation/ContourMap/ImageCanvas (they import simCore/simRender back), re-verify the live app reconstructs on a fresh port (G12) — these are behavior-neutral extractions and must remain so.
□ UV fill/extent: metrics use computeUVFillGl + computeUVMaxExtentGl (Gλ, locked BHEX frame). Never grid pixel-space uvPoints for a metric (sub-pixel collapse). Axes and fill share ONE frame (uvDisplayMaxGl).
□ BHEX toggle: loadEHTPresets must re-append BHEX when it was on (N2) — a preset swap silently dropping BHEX is a regression.
□ DISH_DIAMETERS (constants.js) CONFIRMED 2026-07-09 (Ilan, delegated authority from A. Cárdenas-Avendaño); presetMeanDish drives the default dish (EHT 2017→18.1, 2022→16.7, ngEHT→15.6; 2022-mean fallback). The BHEX "pending sign-off" hedge is a SEPARATE flag and remains.
□ htm strips whitespace-only text at line breaks next to ${…} holes — keep "word ${…}" on one line in prose templates.
□ ⚠ Tour timing gate must be re-run on the projector laptop before the Harvard talk: if CLEAN > 300 ms there, switch presenter-mode Act C to cached-frame playback (numbers in TOUR-ENGINE-AUDIT.md §2).
□ computeUVPoints/computeUVPointsGl REQUIRE `color` on every telescope object (they call lerpColor on pair colours) — a station list without color crashes at module load. tourPhysics's fill computation passes a dummy '#C4A555'.
□ black-hole.png's bright ring spans only ~42.6% of its frame — NEVER assume the ring fills the image. A fixed sourceFraction of 0.525 displayed an ~18 μas ring labeled "42 μas" (2.3× undersized → ~2 restore beams → blob, the Act C/D "doesn't read as a black hole" bug). Measure with measureRingFraction + size with zoomSource (tourScene.js); scale bars computed from shadow/FOV, never 42/80 literals. ⚠ FLAGGED: the LIVE APP sidebar still says "Source: 42 μas (52.5% of FOV)" under the same assumption — out of tour scope, not yet fixed.
□ CLEAN + noise on the tour's 42 μas source: ANY noise > 0 raises the dirty-border 3σ floor above the peak → ZERO CLEAN components (restored == dirty), and ≥0.25× visibility RMS erases the ring entirely. Hence Act C's slider range is 0…0.25 and drawResidualSparkline must say "no components above 3σ — noise-limited" when series < 2 (an empty plot reads as a bug).
□ Tour Act C progressEvery must be 1 — CLEAN on the true-size ring stops ~iter 11, so iter-20 progress sampling starves the residual sparkline.
□ KaTeX displayMode ships 1em top/bottom margins (.katex-display) — at a 38vh tour text panel that pushes the bound-values row (incl. the Act E hedge) below the fold. Kept at margin:2px 0 in tour.css; after ANY narrative copy change, verify .tour-body scrollHeight == clientHeight on every act at 1440×900.
□ tourEarth.js is a module SINGLETON (one WebGL context shared by Acts B & E). Never instantiate per act; Tour.js calls disposeTourEarth() on tour unmount. Earth look must stay derived from globeHelpers.loadEarthTextures + the Globe.js register — do not invent a separate globe style.
□ tourGalaxy nebula must not drift laterally (non-tiling wash → visible seam) — it breathes (alpha oscillation); parallax comes from the star layers only. Galaxy luminance stays below the gold data layer (DESIGN-LANGUAGE: gold = live computation is brightest).
□ ENGINE-REAL TOUR additions now also OBSOLETE: tier tabs/narrativeTriple (single `narrative` since 2026-06-11), tourScene drawEarth/sphereProject/stationOnGlobe + makeStars/drawStarfield (tourEarth.js / tourGalaxy.js), drawConvolutionReveal (Act C pipeline restage).

---

### localhost port reuse poisons the Playwright browser via the HTTP disk cache
DATE_DISCOVERED: 2026-06-12
AREA: All Playwright verification — any module served over localhost
SEVERITY: HIGH (development only)

WHAT HAPPENED: During the final pass, ports 8101–8103 served STALE module versions
(AppSidebar/ControlsPanel pre-edit) while fetch() of the same URL returned fresh bytes
and other modules (useSimulation) were current — a MIXED-version page. New ports 8102/
8103 did not help; a never-before-used port (8777) instantly fixed it.

ROOT CAUSE: The persistent browser profile's HTTP disk cache held entries for those
localhost:PORT origins from PREVIOUS sessions (older plain `python3 -m http.server`
runs without no-cache headers → heuristic freshness from Last-Modified can be hours/
days). A "fresh port this session" can still be a cached origin from last week.

HOW TO AVOID: "Fresh port" must mean NEVER USED on this machine — pick a random high
port (e.g. 87xx) per verification run, keep the no-cache handler, and if any module
behaves stale, IMMEDIATELY verify with
`await import(url); fn.toString().includes('<new code marker>')` instead of theorizing.
Mixed-version symptoms: one module shows new behavior while another renders old output.

DETECTION: in-page `fetch(url)` returns new source while `import(url)` returns old code.

RESOLVED: YES — port 8777; servers on poisoned ports killed.

---

### Runtime-generated CSS classes must survive dead-code sweeps
DATE_DISCOVERED: 2026-06-12
AREA: vlbi-react/css/tour.css — KaTeX (.katex-display), any library-injected class
SEVERITY: MEDIUM

WHAT HAPPENED: A grep-driven orphan-class sweep ("class string not found in js/ ⇒ dead")
deleted `.tour-equation-katex .katex-display { margin: 2px 0; }` — the rule that keeps
the equation's bound-values row (incl. the Act E hedge) above the fold. `.katex-display`
is generated by the KaTeX LIBRARY at runtime and never appears in our source.

HOW TO AVOID: Before deleting a CSS rule on a "not in source" grep, check whether any
selector class is library-generated (KaTeX `katex*`, Three/Leaflet injected DOM, etc.).
The restored rule now carries a do-not-sweep comment.

RESOLVED: YES — rule restored with warning comment (commit 10 of the final pass).

---

### Högbom CLEAN is near-inert on EHT-sparse coverage — component count is a misleading proxy
DATE_DISCOVERED: 2026-06-16
AREA: vlbi-react/worker.js CLEAN loop; Act C (sceneC.js); any UI surfacing CLEAN component count
SEVERITY: MEDIUM (drove the Act C "looks broken" report)

WHAT HAPPENED: Act C's noise slider drove the residual graph to "no components above 3σ —
noise-limited" and the restored image looked broken across much of the 0–0.25× RMS range.
A probe (replicating Act C's exact path, EHT 2017 + black-hole.png ring-sized to 42 μas)
measured CLEAN component count vs noise: 12, 15, 1, 12, 0, 0, 0, 5, 0, 2, 0 across
{0,.01,.02,.03,.04,.05,.06,.08,.10,.12,.25}. DR was pinned at exactly 100 at EVERY level.

ROOT CAUSE: vanilla Högbom with the worker's 3σ-border-RMS stop (worker.js:263-264) barely
runs on EHT-sparse coverage of a ring — the dirty image's heavy sidelobe border sets a high
stop floor, so CLEAN extracts only ~12 components EVEN AT NOISE 0. The restored image is
therefore dominated by dirty+residual, not the CLEAN model. Thermal noise is a random
Gaussian realization per run (Math.random in addPerBaselineNoise), so the per-iteration
component count is erratic and frequently 0 — NOT a monotonic function of noise, and NOT a
regression. computeDynamicRange saturates at its maxV*0.01 fallback (border MAD-σ > maxV*0.1
on these sidelobe-heavy images) → DR=100 constant, also uninformative.

HOW TO AVOID: Do NOT surface CLEAN component count or this DR as a quality/noise indicator
for sparse-coverage reconstructions — both are misleading. Judge the restored IMAGE visually
(it DOES degrade gracefully with noise). The 3σ stop is CASA-standard and worker-internal —
do not "fix" it to force more components. Act C now uses three engine-honest σ presets
(0/0.015/0.03 × RMS) chosen by rendering the restored ring, not by component count.

RESOLVED: YES — Act C slider+sparkline replaced by presets (2026-06-16, commit 04e58b4);
diagnosis in SITE-AUDIT.md addendum.

---

### htm strips whitespace-only text before interpolation holes at line breaks
DATE_DISCOVERED: 2026-07-07
AREA: vlbi-react/js — any htm template mixing prose text with ${…} interpolations
SEVERITY: MEDIUM

WHAT HAPPENED: PhysicsNotesModal prose "…mission at\n          ${P.bhex.altitudeKm…}"
rendered as "mission at26,562 km" — the newline+indent between "at" and the hole was
dropped entirely.

ROOT CAUSE: htm trims whitespace-only text nodes containing newlines when parsing the
template, including ones adjacent to interpolation holes — so the separating space
between a word and a following ${…} vanishes if it sits at a line break.

HOW TO AVOID: keep the word and its interpolation on the SAME line with an explicit
space ("at ${…}"). Break lines elsewhere in the sentence.

DETECTION: rendered text shows a word fused to an interpolated number ("at26,562").

RESOLVED: YES — PhysicsNotesModal reflowed (Alejandro pass, Stage 2).

---

### UV fill metric collapsed on the pixel grid — metrics must use Gλ space too
DATE_DISCOVERED: 2026-07-07
AREA: vlbi-react/js/uvCompute.js (old computeUVFill), useSimulation.js, tourPhysics.js
SEVERITY: HIGH (physics display)

WHAT HAPPENED: UV fill showed 0.0% (Earth) / 0.1% (BHEX) at every array. The old
computeUVFill gridded FOV-scaled PIXEL-space points onto the full 512² Nyquist grid:
at 80 μas FOV the whole EHT coverage lives in a ±3.2 px disk → 27 unique cells /
262,144 → 0.0103%. ngEHT (17 stations) read 0.018% — the metric couldn't distinguish
arrays. Same number in the tour ("0.010 %") — one broken path, not a divergence.

ROOT CAUSE: the documented sub-pixel-collapse gotcha ("UV pixel coordinates become
sub-pixel at small FOV — never use for display") applies to METRICS as much as to
canvases. Any per-cell statistic on computeUVPoints output is FOV-quantization, not
coverage.

HOW TO AVOID: compute coverage statistics from computeUVPointsGl (Gλ) on an explicit
frame — computeUVFillGl(ptsGl, halfExtentGl, M) over the locked computeUVMaxExtentGl
frame. Never grid pixel-space uvPoints for a displayed metric.

DETECTION: fill ~0.0% regardless of array; cells-sampled ≪ sample count.

RESOLVED: YES — commit 486aff9 (N3); intermediates in SITE-AUDIT.md.

---

### Gλ→px canvas mappings: computeUVMaxExtentGl is a HALF-extent
DATE_DISCOVERED: 2026-07-09
AREA: vlbi-react/js/UVMap.js (fixed); any future canvas drawing Gλ coordinates
SEVERITY: HIGH (display)

WHAT HAPPENED: BHEX UV coverage clipped at all four frame edges (B1). UVMap's
toCanvas mapped x=(u/displayMax+0.5)·DST — the visible span was ±displayMax/2
(±17.3 Gλ of the locked 34.6 frame) while the edge labels claimed ±34.6. Present
since the original Gλ pipeline (8c6ba01); Earth-only coverage (8.35 Gλ) happened to
fit, masking it until BHEX (28.9 Gλ).

HOW TO AVOID: computeUVMaxExtentGl (and uvDisplayMaxGl) is the frame's HALF-extent —
edges at ±extent. Mapping: x=(u/(2·extent)+0.5)·DST, or scale=(size/2)/extent like
the tour's drawUVAxes (which was always correct). computeUVFillGl also treats it as
a half-extent. When adding any Gλ canvas, cross-check a point at the extent lands at
the frame edge, not outside.

RESOLVED: YES — commit 83e7fcd (before/after screenshots in session artifacts).

---

### Globe great-circle arcs: chord-lerp under-samples near-antipodal pairs; 0.5-alpha lines vanish over ice
DATE_DISCOVERED: 2026-07-09
AREA: vlbi-react/js/globeHelpers.js syncTelescopeMarkers baseline arcs
SEVERITY: MEDIUM (display)

WHAT HAPPENED: "Baselines sometimes don't fully connect" (B2). Two causes:
(1) uniform chord-space lerp+normalize packs a near-antipodal pair's angular travel
into the middle few segments — SPT–GLT (166.5°) had 18.7°-long chords sagging to
radius 1.0015 vs the globe's 1.0, so the arc's middle broke at the limb,
camera-angle-dependent. (2) 1px LineBasicMaterial at 0.5 alpha faded out over the
bright Antarctic ice approaching SPT.

HOW TO AVOID: slerp (equal ANGULAR steps) for on-sphere polylines — worst chord
Ω/STEPS for any pair; guard sinΩ≈0 with a lerp fallback (co-located stations). Keep
arc opacity ≥0.85 over photo terrain. Do NOT confuse far-side limb occlusion
(correct) with these defects — rotate the globe to distinguish.

RESOLVED: YES — commit 09c006e.

---

GOTCHA: Tour act text opened scrolled to the middle, not the top.
CAUSE: .tour-body (Tour.js) is a single PERSISTENT scroll container — no `key`, the
Tour component stays mounted across acts (only actIndex changes). Its scrollTop
carried over from the previous act; a new, shorter act's content swapped in place and
browser scroll anchoring held a mid-content position.
HOW TO AVOID: when content swaps inside a persistent scroll container (no per-item
key/remount), explicitly reset scrollTop on the keying change. Here: bodyRef +
useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = 0; }, [actIndex]).
Runs after the new act's DOM commits; narrative <p>s render synchronously (independent
of the phase fade), so it lands on the new content's top. Same element in guided and
presenter modes → one reset covers both. Presenter mode has no scrollable prose, so
it's a harmless no-op there.
RESOLVED: YES — branch fix/three-small-post-deploy.

---

GOTCHA: Uploaded/custom source images were silently imaged (and labeled) as M87*.
CAUSE: handleFileUpload / handlePresetSelect set the source but never set
selectedTarget, so it stayed at the mount default 'M87*'. effectiveSourceFraction keys
off the TARGET (shadowUas), so a logo got force-scaled to the 42 μas shadow and the
readout claimed "Dec 12.391° · 16.8 Mpc." Also measureRingFraction ran on every source
(bogus ~0.89 "ring" for the seal).
HOW TO AVOID: on any custom/upload source, setSelectedTarget('Custom'); map presets to
their true target (blackhole→M87*, wfu-seal→Custom). Gate measureRingFraction to shadow
targets. RESOLVED: YES — branch fix/custom-source-path.

GOTCHA: htm drops the space between text and a <strong>/element when a NEWLINE sits at
the boundary (e.g. "only\n  <strong>0.5%</strong>" renders "only0.5%"). Word-to-word
newlines collapse to a space fine; only text↔element boundaries lose it.
HOW TO AVOID: keep the needed space on the SAME source line as the tag
("only <strong>…</strong> of"), or interpolate ${' '}. Seen building SourceNotice.js.

TECHNIQUE: byte-identical reconstruction gate. At noise=0 the worker + CLEAN are
deterministic, so hash the rendered CLEAN/Dirty canvas ImageData (FNV-1a over the bytes)
before and after a scaling-touching change; compare on a FRESH never-used port. Used to
prove the ring path was untouched by the custom-source fixes.

---

CORRECTION (2026-07-14, from Prof. Cárdenas-Avendaño — we shipped wrong physics):
DC/zero-spacing is NOT why detailed images fail to reconstruct. The DC bin is one Fourier
coefficient — the image mean; losing u=0 costs the absolute zero level (a constant
offset), NOT the structure. Real VLBI lacks it on every observation and images fine. The
"97.6% of power in DC" statistic is near-tautological for any bright-background image and
explains nothing. THE ACTUAL CAUSE: detail below the beam at the imposed angular scale —
the seal was being imaged inside an M87*-shadow-sized field ("putting the seal in another
Galaxy"). NEVER let a user image inherit a target's astrophysical units. Measured proof:
CUSTOM-SOURCE-PHYSICS.md — at its own scale the seal reconstructs (ngEHT@1600 μas NCC
0.953, lettering legible), improving monotonically with elements; and there is an OPTIMUM
(coverage occupancy ∝ 1/FOV², EHT 2017 peaks ≈800 μas — enlarging past it degrades).
LESSON FOR US: a statistic that is near-tautological for the input class (bright
background ⇒ dominant DC) explains nothing — test explanations against controls that
differ only in the suspected property (the coarse-W control isolated detail as the cause).

---

### groupSegments contour clustering froze the site for 20+ s — per-result display work must be linear
DATE_DISCOVERED: 2026-07-16
AREA: vlbi-react/js/simRender.js — groupSegments (ContourMap island filter)
SEVERITY: HIGH

WHAT HAPPENED: Stepping the ResolutionBudget array ladder "froze the entire site."
Measured (never-used port, Worker.postMessage wrap + longtask observer + rAF-gap
monitor): reconstruction was NOT the cause — the async worker path fired exactly one
reconstruction per click (86–175 ms in-worker). The freeze was a single synchronous
main-thread task AFTER each result: groupSegments, the contour island filter, at
20,585 ms on the striped seal dirty image (EHT 2017 @ FOV 2000 μas — 9,836 segments,
15.45e9 comparisons).

ROOT CAUSE: two defects compounding. (1) rescan-until-stable clustering is worst-case
O(S²·|group|); (2) its proximity test compared ONLY x-coordinates (y never checked),
bridging distant rows into one giant group (8,706 of 9,836 segments) — making every
scan worst-case AND defeating the island filter's purpose. Cost scales with SEGMENT
COUNT, which explodes exactly in the physically-interesting striped regime the panel
teaches, so the teaching control was the trigger, never the culprit.

HOW TO AVOID: (1) Any work that runs per reconstruction result on the main thread
(ContourMap/effects) must be near-linear in its input — measure the worst case
(sparse array + max custom FOV + detail-rich source), not the default. (2) When a
"freeze on X" is reported, instrument BEFORE hypothesizing: count worker posts/results,
longtask durations, rAF gaps — here the obvious suspect (sync reconstruction) was
disproven in one measurement. (3) groupSegments is now spatial-hash + union-find on
tol-quantized endpoints (true 2-D adjacency, tol=0.1 unchanged); keep it linear —
never reintroduce pairwise group scans.

DETECTION: page freezes right AFTER "Reconstruction complete", duration grows with
FOV/striping; longtask entry matching the ContourMap effect.

RESOLVED: YES — commit 04dcca4 (measured 20,585 ms → ≤64 ms on the identical recipe).
