# Task 03: Implement
# Workflow: feature-development
# Purpose: Execute the plan precisely

---

## Inputs

- `../02-plan/_outputs/plan.md` — required, must exist and be complete
- `../01-explore/_outputs/explore.md` — reference for patterns

---

## Never (Task-Specific)

```
✗ Do not deviate from the plan without flagging it
✗ Do not add "nice to have" improvements outside the plan
✗ Do not modify files not listed in plan's FILE CHANGES
✗ Do not commit until task 04 (verify) passes
✗ Do not leave console.log / print statements in code
✗ Do not use any — TypeScript strict mode required
```

---

## Instructions

1. Read `../02-plan/_outputs/plan.md` fully before writing anything

2. Execute ORDER OF OPERATIONS exactly as specified

3. For each file change:
   - Follow the patterns identified in explore output
   - Apply global code standards from CLAUDE.md Section 8
   - Handle all failure modes identified in the plan's falsification
   - Write inline comments only where non-obvious

4. After all files are written:
   - Do NOT commit yet
   - Write a summary of what was implemented to `./_outputs/implementation.md`

5. Check against the plan:
   - Every item in ORDER OF OPERATIONS completed?
   - Every file in FILE CHANGES touched?
   - Every falsification fix implemented?

---

## Output Contract

```
File: ./_outputs/implementation.md
Required fields:
  - FILES_CHANGED:   list of actual files modified with line counts
  - DEVIATIONS:      list of any deviations from plan (can be NONE)
  - DECISIONS_MADE:  list of implementation decisions not in plan
  - READY_FOR_VERIFY: YES | NO (with reason if NO)

Validation:
  □ Every file in plan's FILE CHANGES exists and has been modified
  □ DEVIATIONS section is present (NONE is valid, omission is not)
```

---

## On Deviation From Plan

If implementation reveals the plan needs to change:
→ Stop implementing
→ Document what was discovered and why the plan needs updating
→ Return to task 02 and update the plan
→ Then re-execute task 03 from the updated plan

Do not silently deviate. Plans exist for a reason.
