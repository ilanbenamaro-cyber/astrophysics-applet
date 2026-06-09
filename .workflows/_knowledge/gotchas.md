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
