# Task 02: Update
# Workflow: knowledge-review
# Purpose: Apply all corrections identified in the audit

---

## Inputs

- `../01-audit/_outputs/audit.md` — complete audit findings

---

## Never

```
✗ Do not silently delete entries — always leave an audit comment
✗ Do not resolve contradictions without user input — escalate them
✗ Do not update an entry you haven't re-verified against the actual codebase
✗ Do not add new knowledge entries without verifying them first
```

---

## Instructions

Work through each file flagged in audit.md.

### For codebase.md entries marked STALE or INCORRECT
1. Open the file or directory the entry references
2. Verify what is actually there now
3. Rewrite the entry to reflect current reality
4. Add update marker: `<!-- UPDATED [date]: [what changed] -->`

### For codebase.md entries marked MISSING
1. Verify the pattern/directory/structure actually exists
2. Add a properly formatted entry
3. Add: `<!-- ADDED [date]: identified during knowledge review -->`

### For decisions.md entries marked STALE (expired)
1. Check if the decision still holds in the current codebase
   - YES, still valid → update LAST_VERIFIED and EXPIRES dates, keep entry
   - NO, no longer valid → mark SUPERSEDED, add what replaced it
2. Add: `<!-- REVIEWED [date]: [outcome] -->`

### For decisions.md entries marked CONTRADICTED
**STOP.** Do not resolve this autonomously.
Write to `_outputs/update.md` under CONTRADICTIONS_REQUIRING_USER_INPUT:
```
CONTRADICTION: [decision A] at line N conflicts with [decision B] at line M
DESCRIPTION: [exactly how they conflict]
QUESTION: Which takes precedence, or should both be updated?
```
Present to user and wait for explicit resolution before touching either entry.

### For gotchas.md entries marked REOCCURRED
1. Find the existing entry
2. Add recurrence note: `REOCCURRED: [date] — [brief context]`
3. If it has reoccurred 3+ times, elevate severity by one level

### For gotchas.md entries marked OUTDATED
1. Verify the fix still exists in code
2. If yes → mark RESOLVED: YES, add verification date
3. If no → mark RESOLVED: REGRESSION, add note

### For DEVELOPER-PROFILE.md marked UPDATE_NEEDED
1. Update the specific fields identified in audit
2. Add: `<!-- UPDATED [date]: [what changed and why] -->`

---

## Output Contract

```
File: ./_outputs/update.md
Required sections:
  - FILES_UPDATED:     list of knowledge files touched with change counts
  - CHANGES_MADE:      summary of each meaningful change
  - CONTRADICTIONS_REQUIRING_USER_INPUT: list (can be NONE)
  - ENTRIES_REMOVED:   list with audit comments (can be NONE)
  - ENTRIES_ADDED:     list of new entries (can be NONE)
  - LAST_REVIEWED_SET: confirm LAST_REVIEWED date set on each file touched

Validation:
  □ Every STALE/INCORRECT entry from audit is addressed
  □ No contradictions silently resolved
  □ LAST_REVIEWED updated on every file touched
```

---

## Commit

```
chore(knowledge): monthly review — [N entries updated, N stale, N added]

[list major changes if >3]
```

---

## After Commit

```
1. Write run log: ../../_log/<YYYY-MM-DD>-run-001.md
2. Update ../../_meta/quality-scores.md
3. Task report:
   WHAT CHANGED: N knowledge files updated, N entries corrected
   WHAT TO KNOW: any contradictions that need user input
   SUGGESTED NEXT: if DEVELOPER-PROFILE was updated significantly,
                   review CLAUDE.md Section 3 (Orchestration) for calibration
```
