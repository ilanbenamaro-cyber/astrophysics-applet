# Known Gotchas & Failure Modes
# _knowledge/gotchas.md
#
# A running record of things that have gone wrong or are known to be tricky.
# This is episodic memory — what happened, not just what is known.
# Claude reads this at session start and before any task in a related area.

---

## Gotcha Log

<!-- Template:
### [Short Title]
DATE_DISCOVERED: YYYY-MM-DD
AREA: [module, pattern, or domain this affects]
SEVERITY: HIGH | MEDIUM | LOW

WHAT HAPPENED: [brief description of the failure or near-miss]
ROOT CAUSE: [why it happened]
HOW TO AVOID: [specific check or step to prevent recurrence]
DETECTION: [how to tell if this is happening again]
RESOLVED: YES | NO | PARTIAL
-->

---

### Telescope T-numbering ignores non-T names
DATE_DISCOVERED: 2026-03-23
AREA: vlbi-react/js/App.js — handleTelescopeAdd
SEVERITY: MEDIUM

WHAT HAPPENED: After loading EHT presets (ALMA, APEX, etc.), clicking the globe
to add a manual telescope produced "T1" instead of "T9". The EHT telescopes were
present but invisible to the numbering logic.

ROOT CAUSE: `parseInt(name.slice(1))` returns NaN for named telescopes (ALMA →
"LMA" → NaN), so they were filtered out of `usedNums`. The T-number floor was
hardcoded to 1, ignoring that 8 slots were already occupied by named telescopes.

HOW TO AVOID: When computing the next T-number, count non-T telescopes separately
and use that count as the floor: `let displayNum = nonTCount + 1`.

DETECTION: Load EHT presets, click globe. New telescope should be T(n+1) where
n = number of EHT telescopes loaded.

RESOLVED: YES — commit bb679d0

---

### unpkg.com CDN does not send CORS headers on redirects
DATE_DISCOVERED: 2026-04-06
AREA: mapController.js — any image loaded from unpkg.com
SEVERITY: HIGH

WHAT HAPPENED: Set `crossOrigin = 'anonymous'` on an Image element loading
`https://unpkg.com/globe.gl/example/img/earth-blue-marble.jpg`. The CDN
redirects to a versioned URL (`@2.45.3/...`) which returns 404, and the
redirect itself carries no `Access-Control-Allow-Origin` header. The image
fails to load entirely (not just `getImageData` — the whole image is blocked),
breaking the map display.

ROOT CAUSE: `crossOrigin = 'anonymous'` causes the browser to enforce CORS on
the image request. If the server (or any redirect in the chain) doesn't send
`Access-Control-Allow-Origin`, the load fails completely. Without the attribute,
the image loads fine but the canvas becomes "tainted" (getImageData blocked).

HOW TO AVOID: Never use `crossOrigin = 'anonymous'` on images from unpkg.com.
For any feature requiring pixel data from an external image, use a precomputed
offline data source instead (e.g., a bundled lookup table generated at build time).

DETECTION: Console error: "has been blocked by CORS policy: No
'Access-Control-Allow-Origin' header is present on the requested resource."
Map falls back to grid — earth image missing.

RESOLVED: YES — replaced pixel sampling with precomputed landMask.js lookup table
(commit e396074).

---

### Fixes repeatedly applied to root app instead of vlbi-react
DATE_DISCOVERED: 2026-04-07
AREA: All vlbi-react features and fixes — Globe.js, worker.js, App.js, css/app.css
SEVERITY: HIGH

WHAT HAPPENED: Two consecutive bug fixes (ocean placement, CLEAN deconvolution)
were implemented in root `js/`, `css/`, `index.html` files. The live deployed
version is `vlbi-react/` — the root files are an older standalone version that
is not deployed.

ROOT CAUSE: The root app and vlbi-react share the same repo. Root files look like
the "main" app at a glance (index.html in root). Developer muscle memory edits
root files. The deployed URL is vlbi-react/index.html, not the root index.html.

HOW TO AVOID: Before editing any JS/CSS/HTML, confirm which version is live by
checking CLAUDE.md — it explicitly states "The current live version of the app
is in vlbi-react/". Never edit root js/, css/, index.html for features targeting
the live app.

DETECTION: Check git status — if only root files are modified (js/app.js,
css/style.css, index.html) for a user-facing bug fix, the fix is in the wrong place.

RESOLVED: YES (both fixes ported to vlbi-react in this session)

---

## Pattern: Things To Always Check

<!-- Short reminders derived from gotchas above -->
<!-- Format: □ [check] — [why] -->
□ After any change to telescope naming logic — verify EHT preset + manual click produces T(n+1) not T1
□ Never use crossOrigin='anonymous' on unpkg.com images — CDN redirects block load entirely; use bundled data instead
□ All live-app changes go to vlbi-react/ — never root js/, css/, index.html (see gotcha above)
