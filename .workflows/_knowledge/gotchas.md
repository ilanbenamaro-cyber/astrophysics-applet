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

## Pattern: Things To Always Check

<!-- Short reminders derived from gotchas above -->
<!-- Format: □ [check] — [why] -->
□ After any change to telescope naming logic — verify EHT preset + manual click produces T(n+1) not T1
