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
BUILDS:         Web apps, APIs, automation tooling, scripts
WORKS:          Solo
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
```

---

## Communication Preferences

```
REPORT LENGTH:      Concise — key facts only, no padding
EXPLANATION DEPTH:  Show reasoning for non-obvious decisions only
                    Do not explain things that are self-evident from the code
CODE COMMENTS:      Why it exists, not what it does
QUESTION STYLE:     One question max. State your default assumption.
ALTERNATIVES:       Only present alternatives when the choice has meaningful tradeoffs
```

---

## Expertise Map

Calibrate explanation depth based on this. Don't over-explain strengths.
Do add extra context and flag tradeoffs in weaker areas.

```
STRONG:
  - Python
  - JavaScript / TypeScript
  - API design
  - System architecture
  - Automation / scripting

GROWING:
  - [Add as identified]

WEAKER:
  - [Add as identified]
  → For weaker areas: explain decisions, show alternatives, flag tradeoffs explicitly
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

ANTI-PATTERNS (things that have caused friction):
  - [Claude adds these as they are expressed]
```

---

## Current Project Phase

```
PHASE:          [Update per project: exploration | early-dev | active-dev | maintenance]
IMPLICATION:
  exploration  → understand > build, ask more questions, document findings
  early-dev    → speed matters, skip exhaustive edge cases, ship and iterate
  active-dev   → balanced: quality + speed, tests required
  maintenance  → quality > speed, full test coverage, no shortcuts
```

---

## Profile Changelog
<!-- Claude appends when preferences are expressed or updated -->
<!-- Format: [DATE] — [what was learned] — [source: explicit/inferred] -->
