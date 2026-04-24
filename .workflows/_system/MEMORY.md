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

## Last Updated
2026-04-24 — S9–S12 complete: useSimulation hook pattern, compare mode architecture, peak-finding constraint
2026-04-24 — Angular size blocker resolved; effectiveSourceFraction pattern added
2026-04-20 — Added UV display pipeline independence pattern
2026-04-16 — Added N=512 benchmark result and contour boundary artifact pattern
2026-04-16 — Added Stop hook fix entry: primer.md rewrite moved to /handoff, claude -p removed from Stop hook
2026-04-15 — Added 4 entries: new slash commands, multi-instance structure, Obsidian vault layout, Harvard EHT scope elevation
