# Global Memory — Astrophysics Applet
# _system/MEMORY.md
#
# Cross-session learnings specific to this project.
# Read at session start. Updated when something durable is learned.
# For project-specific gotchas, see _knowledge/gotchas.md.
# For architectural decisions, see _knowledge/decisions.md.

---

## Memory Log

### ContourMap island filter is settled
DATE: 2026-04-12
CATEGORY: pattern
APPLIES_TO: vlbi-react/js/ContourMap.js

LEARNING: The island filter `groupSegments(tol=0.1)` + `groupBBoxMaxDim < 15` was reached after 10+ measurement iterations and should not be re-litigated without new measurement data showing real arc maxDim < 15.
EVIDENCE: console.table diagnostic showed real arcs have maxDim 37-188px; false islands have maxDim 5-13px. tol=1.5 caused merge; tol=0.1 preserves separation.
IMPLICATION: Never increase tol above 0.1. Never lower MIN_MAX_DIM below 15. If contour quality seems wrong, instrument first — don't adjust thresholds by feel.

---

### Canvas text → HTML overlay is the established ContourMap pattern
DATE: 2026-04-12
CATEGORY: pattern
APPLIES_TO: vlbi-react/js/ContourMap.js, vlbi-react/css/app.css

LEARNING: Zero ctx.fillText calls in ContourMap. All labels are HTML elements (`.contour-tick-overlay`, `.contour-cb-labels`, `.contour-cb-levels`, `.contour-beam-label`).
EVIDENCE: Canvas text clips at CSS-scaled panel widths with no reliable inset solution. HTML overlay is immune to canvas CSS scaling.
IMPLICATION: Any future label added to ContourMap must use an HTML overlay element, not ctx.fillText. This is non-negotiable — canvas text will always clip somewhere.

---

### Phase 2 angular size blocker — RESOLVED 2026-04-24
DATE: 2026-04-12
UPDATED: 2026-04-24
CATEGORY: workflow
APPLIES_TO: vlbi-react/ — Phase 2 features

LEARNING: Angular size blocker resolved in S8. `effectiveSourceFraction = shadowUas / fovMuas` for named targets (M87* 42 μas, Sgr A* 50 μas). Phase 2 features are now unblocked.
EVIDENCE: S8 commit `5a002b6` — verified in browser: M87* shows "Source: 42 μas (52.5% of FOV)", Sgr A* shows "Source: 50 μas (62.5% of FOV)".
IMPLICATION: Phase 2 features can proceed with Alejandro sign-off. No longer a blocker.

---

### worker.js must remain self-contained
DATE: 2026-04-12
CATEGORY: pattern
APPLIES_TO: vlbi-react/js/worker.js

LEARNING: No import statements can be added to worker.js. It is loaded as a classic Worker (`new Worker(url)`), which cannot use import maps or ES module imports.
EVIDENCE: Classic workers predate ES module workers. Module workers require HTTP serving (breaks file:// usage which is a project invariant).
IMPLICATION: Any helper function needed in the worker must be defined inline in worker.js. Never add `import` to this file.

---

### htm template literals: use plain & not &amp;
DATE: 2026-04-12
CATEGORY: pattern
APPLIES_TO: vlbi-react/js/*.js — all htm-rendered JSX

LEARNING: HTML entities (`&amp;`, `&lt;`, `&gt;`) are not decoded in htm template strings. They render as literal text.
EVIDENCE: PhysicsNotesModal.js rendered `&amp;` as the string "& amp;" until replaced with plain `&`.
IMPLICATION: Write template literal content as plain text with Unicode characters, not HTML entities.

---

### T-numbering: filter named telescopes before counting
DATE: 2026-04-12
CATEGORY: pattern
APPLIES_TO: vlbi-react/js/App.js — handleTelescopeAdd

LEARNING: `isNaN(parseInt(t.name.slice(1)))` correctly identifies EHT named telescopes (ALMA → "LMA" → NaN). Manual T-telescopes count from `nonTCount + 1`, not from 1.
EVIDENCE: Bug where loading EHT presets + clicking globe produced T1 instead of T9 (commit bb679d0).
IMPLICATION: Whenever T-numbering logic is modified, test by loading all 8 EHT presets then clicking globe — should produce T9.

---

### Knowledge base reconstructed 2026-04-12
DATE: 2026-04-12
CATEGORY: workflow
APPLIES_TO: .workflows/_knowledge/, .workflows/_system/

LEARNING: codebase.md, decisions.md, gotchas.md, DEVELOPER-PROFILE.md, MEMORY.md, SESSION-CONTINUITY.md were all rewritten on 2026-04-12 to cover vlbi-react as the live primary codebase. This is the reliable baseline.
EVIDENCE: All previous knowledge files only covered root app (last updated 2026-03-16). vlbi-react was 80% undocumented.
IMPLICATION: Trust knowledge files as accurate from 2026-04-12 onward. Earlier session summaries may reference stale codebase.md content.

---

### Deployment: push to main = live
DATE: 2026-04-12
CATEGORY: workflow
APPLIES_TO: git workflow, deployment

LEARNING: GitHub Pages from main branch root. Both the root app (/) and vlbi-react (/vlbi-react/) are live from main. No separate deploy step.
EVIDENCE: CLAUDE.md and project configuration.
IMPLICATION: Any commit pushed to main is immediately live. Be deliberate about what goes on main. Feature branches are appropriate for multi-step work.

---

### Dan Marrone validated EHT coordinates
DATE: 2026-04-12
CATEGORY: other
APPLIES_TO: vlbi-react/js/constants.js — EHT_PRESETS

LEARNING: Dan Marrone (EHT scientist) externally validated the array geometry and caught a longitude sign error. Any coordinate changes should be cross-checked against published EHT UV coverage figures before committing.
EVIDENCE: commit 54c855b "fix(vlbi-react): correct telescope longitude sign on 3D globe"
IMPLICATION: EHT_PRESETS are now correct. Treat them as validated data — don't modify without a specific reason and cross-check.

---

### ContourMap default displayMode = 'dirty'
DATE: 2026-04-12
CATEGORY: pattern
APPLIES_TO: vlbi-react/js/ContourMap.js

LEARNING: Default displayMode is 'dirty' (raw IFFT). This is intentional — pedagogically shows unprocessed data first so deconvolution improvement is visible as a user action.
EVIDENCE: Explicit design choice (2026-04-12 session).
IMPLICATION: If ContourMap is refactored, preserve this default. Don't change to 'clean' or 'restored' by default.

---

### /journal, /handoff, /sync slash commands exist
DATE: 2026-04-15
CATEGORY: workflow
APPLIES_TO: all sessions

LEARNING: Three session-management commands are installed in `~/.claude/commands/`:
- `/journal` — loads today's Obsidian daily note and checks SESSION-CONTINUITY.md blockers
- `/handoff` — writes structured handoff doc to `.workflows/_shared/handoff-[timestamp].md`
- `/sync` — reads git diff, updates knowledge files as warranted, commits them
EVIDENCE: Created 2026-04-15 session.
IMPLICATION: Use `/journal` at session start, `/sync` at session end, `/handoff` when passing work to another instance. All 9 slash commands documented in Obsidian vault at Claude-Stack/Commands.md.

---

### Multi-instance coordination structure exists
DATE: 2026-04-15
CATEGORY: workflow
APPLIES_TO: complex multi-step features

LEARNING: `.workflows/_instance-1/`, `_instance-2/`, `_instance-3/` each have `role.md`, `inbox.md`, `outbox.md`. Shared state in `.workflows/_shared/state.json`, `queue.md`, `completed.md`. Instance roles: 1=Explorer/Haiku (research only), 2=Implementer/Sonnet (writes code), 3=Reviewer/Opus (validates).
EVIDENCE: Created commit 784e35a. Documented in CLAUDE.md Section 15 and Obsidian Workflows.md.
IMPLICATION: For complex features, route through Explorer → human review → Implementer → human review → Reviewer. Human must approve handoffs between instances — never skip.

---

### Obsidian vault structure for Claude Stack
DATE: 2026-04-15
CATEGORY: workflow
APPLIES_TO: session tooling

LEARNING: Obsidian vault at `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/claude-stack/`. Key files in `Claude-Stack/`: `Commands.md` (all 9 slash commands), `Workflows.md` (patterns + multi-instance), `Skills.md`, `Agents.md`, `MCP-Servers.md`, `System-Overview.md`. Daily notes at `Daily/YYYY-MM-DD.md`.
EVIDENCE: Vault explored 2026-04-15. Commands.md created this session.
IMPLICATION: `/journal` depends on Daily/YYYY-MM-DD.md existing. Create it in Obsidian before running `/journal`, or tell Claude the session goal directly.

---

### Project scope elevated to Harvard EHT talk standard
DATE: 2026-04-15
CATEGORY: workflow
APPLIES_TO: entire project

LEARNING: Project scope elevated to research-grade demonstration tool for Harvard EHT fall 2026 talk. Audience is EHT scientists and radio astronomers. Physical accuracy is now non-negotiable. Option 2 FOV simplification is off the table. All physics decisions require Alejandro sign-off before implementation.
EVIDENCE: Explicit scope change from "educational applet" to research-grade tool targeting EHT scientific audience.
IMPLICATION: Every feature must be evaluated against "would an EHT scientist find this physically correct?" Standard has changed from pedagogical to scientifically defensible. This means: (1) angular size must be physically correct at M87* scale, not approximated; (2) N=256 may be insufficient — benchmark N=512/1024 before deciding; (3) no Phase 2 feature ships without Alejandro sign-off.

---

### Stop hook fixed — primer.md rewrite moved to /handoff
DATE: 2026-04-16
CATEGORY: workflow
APPLIES_TO: ~/.claude/settings.json, ~/.claude/commands/handoff.md

LEARNING: Stop hook previously spawned a full Claude API call (claude -p) on every
agent turn to rewrite primer.md — causing 4-10 minute delays after every response.
Removed the API call from Stop hook entirely. Stop hook now only runs git diff
check (~50ms). primer.md rewrite moved into /handoff as its final step.
IMPLICATION: Run /handoff at every session end — it now owns primer.md updates.
Never add claude -p calls back to the Stop hook.

---

### N=512 benchmark complete — 414ms CLEAN is acceptable
DATE: 2026-04-16
CATEGORY: pattern
APPLIES_TO: vlbi-react/js/worker.js, vlbi-react/js/constants.js

LEARNING: N=512 CLEAN reconstruction benchmarked at 414ms (first run), 420-690ms under repeated rapid changes. This is acceptable for an EHT demo audience. N=512 is now permanent (IMAGE_SIZE in constants.js). N=1024 benchmark is only needed if beam needs to reach 8+ pixels at M87* physical scale — not currently required.
EVIDENCE: console.timeEnd instrumentation added then removed after benchmark (commit 335497a). Benchmark runs logged in Playwright console during session.
IMPLICATION: The N benchmark blocker in SESSION-CONTINUITY.md is resolved for N=512. N=1024 question is deferred to Alejandro meeting. Remove benchmark timing from worker.js going forward — it served its purpose.

---

### Contour boundary artifacts: fix in drawing layer, not marching squares
DATE: 2026-04-16
CATEGORY: pattern
APPLIES_TO: vlbi-react/js/ContourMap.js — segment drawing loop

LEARNING: Marching squares emits valid segments terminating at grid boundary cells. Drawing these produces visible lines along canvas edges. The fix is a 1px epsilon boundary discard in the drawing loop — never touch the marching squares algorithm itself.
EVIDENCE: Visible bottom-edge line in ContourMap; fixed by `onBoundary` check (commit 335497a).
IMPLICATION: If contour edge artifacts recur after any ContourMap refactor, check that the `onBoundary` guard survived. It belongs directly inside the segment drawing loop, applied before every moveTo/lineTo call.

---

### UV display requires FOV-independent Gλ pipeline
DATE: 2026-04-20
CATEGORY: pattern
APPLIES_TO: vlbi-react/js/uvCompute.js, vlbi-react/js/UVMap.js, vlbi-react/js/App.js

LEARNING: `computeUVPoints` pixel coordinates become sub-pixel (~0.001px) at small FOV (80 μas M87* scale), causing all UV samples to cluster invisibly at canvas center. UV display must use `computeUVPointsGl` which returns Gλ coordinates independent of FOV. These two pipelines must remain separate — reconstruction uses pixel coords, display uses Gλ.
EVIDENCE: Bug where UV canvas went blank when fovMuas changed 538→80. Fixed by adding `computeUVPointsGl` (commit 8c6ba01).
IMPLICATION: Never pass `uvPoints` (pixel space) to UVMap. Always pass `uvPointsGl` (Gλ). If UVMap is ever refactored, verify it receives the Gλ array, not the pixel array.

---

### effectiveSourceFraction is derived, never stored in state
DATE: 2026-04-24
CATEGORY: pattern
APPLIES_TO: vlbi-react/js/App.js

LEARNING: `effectiveSourceFraction` is a `useMemo` computed from `SKY_TARGETS[selectedTarget].shadowUas / controls.fovMuas`. It is never stored in state. `controls.sourceFraction` remains in state only for the Custom target path and the reset handler. This separation keeps the controls reset handler clean and avoids stale state when switching between targets.
EVIDENCE: S8 implementation — passing effectiveSourceFraction as prop through AppSidebar → ControlsPanel confirms the pattern works without state pollution.
IMPLICATION: Any future derived-from-target value should follow this pattern: useMemo in App.js, prop-drilled, never setState.

---

### useSimulation hook: all sim logic out of App.js
DATE: 2026-04-24
CATEGORY: pattern
APPLIES_TO: vlbi-react/js/useSimulation.js, vlbi-react/js/App.js

LEARNING: All simulation state, effects, memos, and handlers live in `useSimulation.js`. App.js holds only global UI state (modals, a11y, tour, compareMode). This split was required for compare mode (two independent sim instances) and improved testability.
IMPLICATION: If App.js ever starts accumulating simulation logic again, move it back to the hook. The rule: if it would need to be duplicated in compare mode, it belongs in the hook.

---

### React hooks cannot be conditional — always instantiate both sim instances
DATE: 2026-04-24
CATEGORY: pattern
APPLIES_TO: vlbi-react/js/App.js — compare mode

LEARNING: `const left = useSimulation()` and `const right = useSimulation()` are ALWAYS called, even in single-pane mode. React prohibits conditional hook calls. The `right` sim auto-loads EHT 2017 on mount — intentional, so Config B is ready when user enters compare mode.
IMPLICATION: Adding a third sim instance for a third pane would follow the same always-instantiated pattern. Never guard `useSimulation()` calls with an `if`.

---

### Peak-finding on typed arrays: for-loop only, never Math.max spread
DATE: 2026-04-24
CATEGORY: pattern
APPLIES_TO: vlbi-react/js/fitsExport.js, any N=512 computation

LEARNING: `Math.max(...Float64Array(262144))` throws "Maximum call stack size exceeded". Always use a for-loop for max/peak finding on large typed arrays. Confirmed at N=512 (512×512=262144 elements).
IMPLICATION: Any future code that needs max/min of a reconstruction-sized array must use an explicit for-loop. This includes export, DR computation, normalization.

---

### SVG attributes in htm/preact use camelCase, not kebab-case
DATE: 2026-04-24
CATEGORY: pattern
APPLIES_TO: vlbi-react/js/TourDiagram.js — any SVG rendered via htm template literals

LEARNING: SVG attributes in preact/htm templates follow React camelCase convention: `strokeWidth`, `strokeDasharray`, `textAnchor`, `fillOpacity`, `fontSize` (via inline style). Kebab-case (`stroke-width`, `text-anchor`) is HTML/SVG attribute syntax — not used in JSX/htm. Font properties are set via `style={{ fontSize: '14px', fontFamily: ... }}` not as SVG attributes.
EVIDENCE: TourDiagram.js confirmed working across all 8 act diagrams (d01–d08) in the cinematic rewrite.
IMPLICATION: When writing SVG in any htm file, always use camelCase attribute names. If SVG renders but attributes appear ignored, check for kebab-case attributes.

---

### tour.css is a separate file from app.css
DATE: 2026-04-24
CATEGORY: pattern
APPLIES_TO: vlbi-react/css/tour.css, vlbi-react/css/app.css

LEARNING: Tour-specific CSS (full-screen overlay, hero SVG container, text overlay, animation keyframes, chapter card, reduced-motion overrides) lives in `vlbi-react/css/tour.css`, not in `app.css`. Both are loaded by `vlbi-react/index.html`. `--accent-orange` was added to `:root` in `app.css` since CSS variables must be declared on `:root`, but all `.tour-*` class rules belong in `tour.css`.
EVIDENCE: Confirmed across P3 + cinematic rewrite — tour.css holds all 8-act diagram keyframes (drawArc, stationReveal, scrubberMove, imageReveal, panelSlideIn, etc.) and the animPhase CSS classes.
IMPLICATION: When adding new tour styles, edit `tour.css` not `app.css`. When adding new global CSS custom properties, add to `:root` in `app.css`.

---

### Tour animPhase state machine: clear-all-then-set pattern
DATE: 2026-04-26
CATEGORY: pattern
APPLIES_TO: vlbi-react/js/Tour.js — animPhase useEffect

LEARNING: The animPhase useEffect must follow a strict pattern: (1) clearTimeout all 3 timers first, (2) setChapterCard(false) unconditionally, (3) setAnimPhase, (4) then conditionally set new timers. Any deviation — even calling setChapterCard(false) after the CHAPTER_CARDS check — produces stale overlays or overlapping timers when users navigate quickly between acts.
EVIDENCE: Stale chapter card bug discovered during cinematic rewrite: navigating away before 2200ms caused the chapter card to persist on an act that shouldn't show one. Fixed by moving setChapterCard(false) above all conditional logic.
IMPLICATION: Whenever adding state managed by timers in a component that responds to actIndex changes, always follow: clearAll → resetAll → conditionallySet. Never assume a cleanup return alone is sufficient — the cleanup only runs on the *next* render, not synchronously.

---

### SVG filter IDs in TourDiagram.js must be diagram-scoped
DATE: 2026-04-26
UPDATED: 2026-04-28 — OBSOLETE for TourDiagram.js (now Canvas 2D). Still applies if SVG diagrams are introduced elsewhere.
CATEGORY: pattern
APPLIES_TO: vlbi-react/js/ — any inline SVG rendered in the tour or elsewhere

LEARNING: Each diagram's `<filter>` and gradient IDs must include the diagram number. Inline SVG filters are scoped to the HTML document — shared IDs resolve to the first defs block in DOM order.
IMPLICATION: TourDiagram.js is now Canvas 2D (no SVG, no filters). Pattern remains relevant for any other inline SVG in the codebase.

---

### CSS `transform-box: fill-box` required for CSS-animated SVG elements
DATE: 2026-04-26
CATEGORY: pattern
APPLIES_TO: vlbi-react/css/tour.css — any class animating transform on SVG elements

LEARNING: CSS `transform-origin: center` on an SVG element resolves to the center of the entire SVG viewport, not the element's bounding box. `transform-box: fill-box` makes `transform-origin` relative to the element's own fill bounding box — restoring the HTML-expected behavior. This is required for `translateX` (`.baseline-pulse`), rotations, and scales applied via CSS to SVG elements.
EVIDENCE: .baseline-pulse bug discovered during art pass (2026-04-26, commit 614932a). Fixed by adding `transform-box: fill-box; transform-origin: center` to the class rule.
IMPLICATION: Any new CSS animation class targeting an SVG element that uses transform must include these two declarations. This does not apply to SVG `transform` attribute animations.

---

### TourDiagram.js: Canvas 2D is the right technology; SVG was the wrong tool
DATE: 2026-04-28
SUPERSEDED: 2026-06-10 — TourDiagram.js DELETED in the engine-real rebuild. The Canvas-2D-with-RAF
            conclusion still holds and carries forward: the new sceneA–E.js use the same single-canvas RAF
            approach (via tourScene.setupCanvas), now drawing REAL engine output instead of illustrations.
CATEGORY: pattern
APPLIES_TO: vlbi-react/js/ (was TourDiagram.js; now sceneA–E.js + tourScene.js)

LEARNING: SVG/CSS cannot achieve additive blending, multi-pass glow, organic bezier terrain, or per-pixel chromatic aberration. The Smithsonian Art Pass quality bar required Canvas 2D with `requestAnimationFrame`. The rewrite (bed2d45) confirmed: ~1280 lines of Canvas 2D produces visually richer results than any SVG filter chain.
EVIDENCE: Three sessions of iterative SVG art passes culminated in Canvas 2D rewrite — the quality ceiling was SVG's fundamental limitation, not the art direction.
IMPLICATION: Any future diagram requiring bloom, terrain, or cinematic animation should use Canvas 2D from the start, not SVG. SVG is appropriate for static or simple animated diagrams only.

---

### Canvas 2D RAF components: hooks require component invocation, not plain function calls
DATE: 2026-04-28
SUPERSEDED: 2026-06-10 — TourDiagram.js deleted. INVERTED in the rebuild: the new scene modules
            (sceneA–E.js) are PLAIN objects {init,drawFrame,onPointer} with NO hooks — only the Tour.js
            host holds the useRef/useEffect/RAF. Do not put hooks in scene modules.
CATEGORY: pattern
APPLIES_TO: vlbi-react/js/ tour scenes

LEARNING: d01–d08 use `useRef`/`useEffect` — React hooks. They MUST be rendered as React components (`html\`<${Comp}/>\``), not called as plain functions (`Comp({ props })`). The export uses a `comps[diagramId]` array and renders the selected component. Calling as a plain function breaks Rules of Hooks silently or with cryptic errors.
EVIDENCE: Architectural requirement discovered during Canvas 2D rewrite (2026-04-28).
IMPLICATION: Any future Canvas 2D diagram added to TourDiagram.js must follow the same component pattern.

---

### Tour rebuilt as engine-real 5-act cinematic — visuals are now genuine engine output
DATE: 2026-06-10
CATEGORY: pattern
APPLIES_TO: vlbi-react/ tour subsystem; simCore.js; simRender.js

LEARNING: The guided tour was rebuilt (2fd3bea..64480e5) from 8 hand-drawn TourDiagram scenes into 5
engine-driven acts (A–E). Every act's visual is real uvCompute/worker output. TourCard.js + TourDiagram.js
DELETED. Architecture: Tour.js (host, presenter|guided mode) + tourActs.js (act schema as data) +
tourScenes.js (registry) + sceneA–E.js + tourScene.js (canvas primitives) + tourAnnotations.js + TourEquation.js
(KaTeX) + TourSpine.js (real-UV progress). Phase 0 added pure simCore.js (runReconstruction + scaleSource/
buildSefdMap/computeDynamicRange/beamFwhm/angularRes) and simRender.js (drawContour/drawHot), extracted
behavior-neutrally from useSimulation/ContourMap/ImageCanvas (which import them back). worker.js gained
opt-in progressEvery for Act C's live CLEAN sparkline. The full architecture + the projector-TODO are in
the project memory file `tour-engine-real-architecture.md` and `.workflows/_system/TOUR-ENGINE-AUDIT.md`.
EVIDENCE: 12 quality gates verified on a fresh port; app reconstructs unchanged (G12). Screenshots of all
5 acts confirmed real coverage/dirty-beam/CLEAN/photo+reconstruction/BHEX coverage.
IMPLICATION: When working on the tour, edit the new files — TourDiagram/TourCard are gone. Scenes are plain
objects (no hooks). runReconstruction transfers grayscale.buffer (pass a slice). Keep the worker import-free
and progressEvery opt-in. Re-verify G12 after touching the simCore/simRender consumers.

---

### Tour engine timing measured at N=512 (Phase-0 gate) — CLEAN is live-capable
DATE: 2026-06-10
CATEGORY: pattern
APPLIES_TO: vlbi-react/js/worker.js, simCore.js; Harvard talk prep

LEARNING: Measured on the dev machine (Chromium, 10-core, N=512, EHT 2017 + black-hole.png):
computeUVPoints 0.5 ms · dirty 41 ms · CLEAN 97.5 ms · MEM 2350 ms (recorded in TOUR-ENGINE-AUDIT.md §2).
CLEAN < 300 ms ⇒ Act C recomputes live in both presenter and guided modes; MEM is guided-only on-input.
IMPLICATION: ⚠ This is dev-hardware. Re-run the gate on the actual projector-class laptop before the talk
(CPU-bound JS — single-thread clock dominates, GPU irrelevant). If CLEAN exceeds 300 ms there, flip
presenter-mode Act C to precomputed playback of cached real frames (the never-stall timeout→cache fallback
in sceneC.js already exists). Supersedes the older "N=512 ~414ms CLEAN" benchmark for the tour's purposes
(same order of magnitude; the new number is per-call-worker-inclusive).

---

## Last Updated
2026-06-10 — Tour engine-real rebuild: new 5-act architecture + simCore/simRender + measured timing memories added; TourDiagram Canvas-2D memories marked superseded
2026-04-28 — Canvas 2D rewrite: TourDiagram SVG pattern updated to obsolete, Canvas 2D patterns added
2026-04-26 — Tour Art Pass: SVG filter scoping pattern, transform-box pattern added
2026-04-26 — Tour Cinematic Rewrite: animPhase pattern, stale "12 act" references corrected to 8 acts
2026-04-24 — P1/P2/P3 complete: SVG-in-htm camelCase pattern, tour.css separation pattern
2026-04-24 — S9–S12 complete: useSimulation hook pattern, compare mode architecture, peak-finding constraint
2026-04-24 — Angular size blocker resolved; effectiveSourceFraction pattern added
2026-04-20 — Added UV display pipeline independence pattern
2026-04-16 — Added N=512 benchmark result and contour boundary artifact pattern
2026-04-16 — Added Stop hook fix entry: primer.md rewrite moved to /handoff, claude -p removed from Stop hook
2026-04-15 — Added 4 entries: new slash commands, multi-instance structure, Obsidian vault layout, Harvard EHT scope elevation

---

### CLEAN component count / DR are misleading on EHT-sparse coverage — judge the image
DATE: 2026-06-16
CATEGORY: pattern
APPLIES_TO: vlbi-react/worker.js CLEAN; sceneC.js; any UI showing CLEAN component count or DR

LEARNING: Vanilla Högbom CLEAN with the worker's 3σ-border-RMS stop is near-inert on
EHT-sparse coverage of a ring — it extracts only ~12 components even at noise 0, so the
restored image is dominated by dirty+residual, and the per-iteration component count is an
erratic, often-zero Gaussian-noise-realization artifact (NOT monotonic in noise). DR
saturates at computeDynamicRange's maxV*0.01 fallback (=100) for these sidelobe-heavy images.
EVIDENCE: probe across noise 0→0.25× RMS → comps {12,15,1,12,0,0,0,5,0,2,0}, DR=100 throughout.
This is the same worker the live app uses (same 3σ stop, CASA-standard) — not a tour bug.
IMPLICATION: Never surface CLEAN component count or this DR as a quality/noise readout for
sparse reconstructions — both mislead and made Act C look broken. Judge the restored IMAGE
(it degrades gracefully with noise). Act C now uses three σ presets chosen by rendering the
ring, not by component count. Don't lower the worker's 3σ stop to force components (worker is
shared with the live app). See gotchas.md "Högbom CLEAN is near-inert…" + decisions.md.
