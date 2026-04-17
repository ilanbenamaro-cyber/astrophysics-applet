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

### recoId stale-result check must not be removed
DATE_DISCOVERED: 2026-04-01
AREA: vlbi-react/js/App.js — worker.onmessage handler
SEVERITY: MEDIUM

WHAT HAPPENED: N/A — documented proactively from design review.

ROOT CAUSE: Worker runs async. If user changes controls rapidly, multiple reconstruction requests are in flight simultaneously. The most recent result might not arrive last.

HOW TO AVOID: App.js maintains `recoId` as a `useRef` counter, incremented with each reconstruction request. The worker message handler checks `if (result.id !== recoId.current) return` before updating state. Never remove this check.

DETECTION: UI shows flickering or reverts to stale reconstruction results when controls are changed quickly.

RESOLVED: YES — part of original design.

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

## Pattern: Things To Always Check

□ After any change to telescope naming logic — verify EHT preset + manual click produces T(n+1) not T1
□ Never use crossOrigin='anonymous' on unpkg.com images — CDN redirects block load entirely
□ All live-app changes go to vlbi-react/ — never root js/, css/, index.html
□ No import statements in worker.js — classic worker, cannot use import maps
□ No ctx.fillText in ContourMap — use HTML overlay pattern (established 2026-04-12)
□ New EHT coordinates: verify longitude sign (East-positive standard) against published UV coverage
□ groupSegments tolerance stays at 0.1 — only change with new measurement data
□ Contour boundary segments: any segment with endpoint at canvas edge must be discarded (epsilon=1px) — do not fix in marching squares, fix in drawing loop
