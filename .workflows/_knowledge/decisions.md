# Architectural Decisions
# _knowledge/decisions.md
#
# Every significant architectural decision, when it was made, and why.
# This prevents re-litigating settled decisions and documents tradeoffs.
# Claude checks this before proposing architectural changes.

---

## Decision Log

<!-- Template for each entry:
### [Decision Title]
DATE: YYYY-MM-DD
LAST_VERIFIED: YYYY-MM-DD
EXPIRES: YYYY-MM-DD (or NEVER)
STATUS: ACTIVE | SUPERSEDED | UNDER_REVIEW

DECISION: [What was decided]
RATIONALE: [Why this was chosen over alternatives]
ALTERNATIVES_REJECTED: [What else was considered and why it lost]
TRIGGERS_REVIEW_IF: [Conditions that would make this worth revisiting]
SUPERSEDED_BY: [if STATUS=SUPERSEDED, what replaced it]
-->

---

## Contradiction Scanner

Claude runs this check when adding a new decision:
1. Read all ACTIVE decisions
2. Check if new decision conflicts with any existing one
3. If conflict found: FLAG before adding — do not silently overwrite
4. Format: ⚠ CONFLICT: [new decision] conflicts with [existing decision] — resolve before proceeding
