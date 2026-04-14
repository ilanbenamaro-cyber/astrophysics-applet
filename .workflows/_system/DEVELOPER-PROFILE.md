# Developer Profile
# _system/DEVELOPER-PROFILE.md
#
# This file calibrates HOW Claude operates, not just WHAT it does.
# A system that models the developer produces dramatically better outcomes
# than one that treats every developer identically.
# Update this file as preferences are expressed or inferred.

---

## Identity

```
NAME:           Ilan
EXPERIENCE:     Full-stack developer
STACK:          Python + TypeScript/JavaScript
BUILDS:         Web apps, APIs, automation tooling, scripts, educational applets
WORKS:          Solo
PROJECT:        Educational astrophysics (VLBI) applet with Prof. Alejandro Cárdenas-Avendaño (WFU)
```

---

## Trust Levels By Operation Type

These govern how much Claude pauses vs. proceeds autonomously.

```
AUTO-PROCEED (no pause needed):
  - Test-only changes
  - Documentation updates
  - Lint/format fixes
  - Commit message writing
  - New file creation in established patterns
  - Single-file edits with HIGH confidence

PROCEED + FLAG (do it, but mention it):
  - New dependencies being added
  - New patterns not established in codebase
  - Medium-confidence implementation decisions

PAUSE + CONFIRM (stop and explain before doing):
  - Database schema changes
  - Auth system modifications
  - Multi-file refactors touching >5 files
  - Any operation with LOW confidence
  - Anything outside established codebase patterns
  - Phase 2 vlbi-react features (blocked — see decisions.md #19)
```

---

## Communication Preferences

```
REPORT LENGTH:      Terse — key facts only, no padding
EXPLANATION DEPTH:  Show reasoning for non-obvious decisions only
                    Do not explain things self-evident from the code
CODE COMMENTS:      Why it exists, not what it does
QUESTION STYLE:     One question max. State your default assumption.
ALTERNATIVES:       Only present when the choice has meaningful tradeoffs
                    Prefer one recommendation over a menu of options
TRAILING SUMMARIES: Never — Ilan can read the diff
FILLER PHRASES:     Never — no "Great question!", "Absolutely!", "Certainly!"
```

---

## Expertise Map

Calibrate explanation depth based on this. Don't over-explain strengths.
Add context and flag tradeoffs in weaker areas.

```
STRONG (bring full trust, minimal explanation):
  - Python
  - JavaScript / TypeScript
  - API design
  - System architecture
  - Automation / scripting
  - Full-stack web development
  - Debugging via instrumentation (console.table, targeted logging)
  - Iterative visual QA — patient with multi-step refinement cycles

GROWING (learning on this project — add context, explain tradeoffs):
  - React / htm patterns (first React project beyond basics)
  - Web Worker communication and transferable buffer semantics
  - Canvas 2D rendering pipeline (viridis, marching squares, beam rendering)
  - Radio astronomy domain knowledge (UV coverage, CLEAN, MEM, EHT geometry)

WEAKER:
  - None identified yet
```

---

## Known Preferences

```
STYLE:
  - Explicit over implicit
  - Readable over clever
  - Named constants over magic numbers
  - Verbose error messages over silent failures

WORKFLOW:
  - Claude commits everything — do not wait to be asked
  - Prefers to see the plan before large multi-file implementations
  - Wants debt flagged immediately, not buried
  - Prefers one recommended approach rather than a list of options
  - Happy with multi-iteration refinement when visual QA requires it

ANTI-PATTERNS (things that cause friction — never do these):
  - Presenting multiple approaches when one is clearly best
  - Asking for confirmation on single-file HIGH confidence edits
  - Adding unsolicited refactors or "improvements" outside task scope
  - Summarizing what was just done at end of response
  - Adding canvas text for labels in CSS-scaled canvas contexts
  - Adding comments that describe what code does rather than why it exists
  - Asking more than one question at a time
```

---

## Current Project Phase

```
PHASE:          active-dev (vlbi-react)
IMPLICATION:    Balanced: quality + speed. Tests are manual (browser verification).
                Phase 2 blocked pending physics meeting — do not implement Phase 2 features.
                Root app is in maintenance mode — only touch if explicitly asked.
```

---

## Profile Changelog
[2026-03-16] — Initial population from first session
[2026-04-12] — Full reconstruction: populated GROWING/WEAKER/Anti-patterns from observed session behavior; added project context (Prof. collaboration, phase status); added communication anti-patterns from direct feedback
