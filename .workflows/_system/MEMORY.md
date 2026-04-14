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

### Phase 2 blocked on angular size
DATE: 2026-04-12
CATEGORY: workflow
APPLIES_TO: vlbi-react/ — Phase 2 features

LEARNING: Source always fills full FOV regardless of any source size parameter. Not physically correct. Phase 2 features must not be implemented until this is resolved with Prof. Cárdenas-Avendaño.
EVIDENCE: Prof. discussion identified this as the fundamental physics blocker for Phase 2 (source angular size → μas scale → physically correct FOV).
IMPLICATION: If user asks for Phase 2 features (source size slider, multi-component sources, etc.), flag this blocker before implementing anything.

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

## Last Updated
2026-04-12 — Initial population (10 entries covering Phase 1 learnings)
