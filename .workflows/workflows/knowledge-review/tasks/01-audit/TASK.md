# Task 01: Audit
# Workflow: knowledge-review
# Purpose: Find every stale, incorrect, or outdated entry across all knowledge files

---

## Never

```
✗ Do not update files in this task — audit only, update in task 02
✗ Do not assume an entry is correct because it sounds plausible
   Verify every factual claim against the actual codebase
✗ Do not skip entries because they seem recent
```

---

## Audit Protocol Per File

### codebase.md
For each entry:
- Does the directory/file it references actually exist? (`ls` to verify)
- Does the pattern it describes still appear in the codebase?
- Is the stack description still accurate? (check package.json / pyproject.toml)

Mark: VERIFIED | STALE | INCORRECT | MISSING (something in codebase not documented)

### decisions.md
For each decision entry:
- Check EXPIRES date — has it passed?
- Check TRIGGERS_REVIEW_IF — has any of those conditions occurred?
- Check if the decision is still reflected in the actual code
- Check for conflicts with other ACTIVE decisions (contradiction scan)

Mark: VERIFIED | STALE (expired) | CONTRADICTED | SUPERSEDED

### gotchas.md
For each entry:
- Is RESOLVED = YES? → Verify the fix still exists in code
- Is RESOLVED = NO? → Is the underlying condition still present?
- Has this pattern recurred? → Update recurrence count

Mark: ACTIVE | RESOLVED_VERIFIED | REOCCURRED | OUTDATED

### DEVELOPER-PROFILE.md
Review last 30 days of session patterns (from workflow run logs):
- Did any preferences expressed contradict documented preferences?
- Did expertise in any area demonstrably change?
- Did project phase change?

Mark: CURRENT | UPDATE_NEEDED

---

## Output Contract

```
File: ./_outputs/audit.md
Required sections:
  - CODEBASE_MD:      list of entries with VERIFIED|STALE|INCORRECT|MISSING status
  - DECISIONS_MD:     list of entries with status + reason
  - GOTCHAS_MD:       list of entries with status
  - PROFILE:          CURRENT | list of updates needed
  - SUMMARY:          N entries verified, N stale, N incorrect, N missing
```

---

---

# Task 02: Update
# Workflow: knowledge-review
# Purpose: Apply all corrections found in audit

---

## Inputs

- `../01-audit/_outputs/audit.md`

---

## Instructions

For each entry marked STALE, INCORRECT, SUPERSEDED, or UPDATE_NEEDED:

1. Re-verify by reading the actual current codebase files
2. Update the knowledge file with accurate information
3. If an entry is being removed (truly outdated), add a comment:
   `<!-- REMOVED [date]: [what was here] — reason: [why removed] -->`
   Do not silently delete — keep the audit trail

For MISSING entries (things in codebase not documented):
- Add them to the appropriate knowledge file

For contradicted decisions:
- Do NOT silently resolve — flag to user:
  `⚠ CONTRADICTION FOUND: [decision A] conflicts with [decision B]`
  Present both. Get explicit resolution before updating either.

---

## Output Contract

```
□ All STALE entries updated or removed with audit comment
□ All INCORRECT entries corrected
□ All MISSING entries added
□ No contradictions silently resolved — all escalated to user
□ LAST_REVIEWED date updated at top of each file touched
□ Commit: chore(knowledge): review update — [summary of changes]
□ Run log written
```
