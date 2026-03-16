# Task 01: Explore
# Workflow: feature-development
# Purpose: Map the full scope before touching anything

---

## Inputs

- `../../data/request.md` — the feature description
- `../../../_knowledge/codebase.md` — project knowledge
- `../../../_knowledge/decisions.md` — prior architectural decisions
- `../../../_knowledge/gotchas.md` — known failure modes

---

## Never (Task-Specific)

```
✗ Do not write any implementation code in this task
✗ Do not form a final implementation plan yet — only map what exists
✗ Do not read more than 3 files per area before forming a hypothesis
   (if you need more, note it as an unknown — don't rabbit hole)
✗ Do not modify any files
```

---

## Instructions

1. Read the feature request from `../../data/request.md`

2. Identify the primary areas of the codebase this touches:
   - What directories are affected?
   - What files will likely need modification?
   - What files will likely need to be created?

3. For each affected area, read the relevant files (use Haiku subagent if >3 files):
   - What patterns exist that must be followed?
   - What interfaces or contracts must be respected?
   - What dependencies exist between components?

4. Check for existing solutions:
   - Does any part of this feature already exist?
   - Is there reusable code that handles any part of it?
   - Are there similar features to reference for pattern consistency?

5. Check decisions.md for any architectural constraints that apply

6. Identify risks and unknowns:
   - What could break unexpectedly?
   - What requires a decision that isn't obvious?
   - What requires user input before implementation can proceed?

---

## Example Output

```markdown
## FEATURE REQUEST SUMMARY
[2-sentence summary of what was asked for]

## FILES TO MODIFY
- src/api/routes/users.ts — add new endpoint (line ~45, after existing POST)
- src/api/middleware/auth.ts — extend to handle new token type
- tests/api/users.test.ts — add test cases

## FILES TO CREATE
- src/api/handlers/userPreferences.ts — new handler extracted per project pattern

## REUSABLE PATTERNS FOUND
- Auth middleware pattern: see src/api/middleware/auth.ts:L12-45
- Handler structure: matches src/api/handlers/userProfile.ts exactly

## ARCHITECTURAL CONSTRAINTS APPLYING
- Decision [2025-01-15]: All new endpoints must go through auth middleware
- Pattern: handlers do not directly query DB — use repository layer

## RISKS
- MEDIUM: Changing auth.ts affects all authenticated routes — regression test scope is large
- LOW: New endpoint naming conflicts with future planned /preferences endpoint

## UNKNOWNS REQUIRING DECISION
- Should user preferences be persisted per-session or per-account?
  → Blocking decision. Will pause at plan stage if not resolved.

## ESTIMATED SCOPE
Small (2-3 files, 1-2 hours)
```

---

## Output Contract

```
File: ./_outputs/explore.md
Required sections:
  - FEATURE REQUEST SUMMARY     string
  - FILES TO MODIFY             list of strings with descriptions
  - FILES TO CREATE             list of strings with descriptions
  - REUSABLE PATTERNS FOUND     list (can be empty)
  - ARCHITECTURAL CONSTRAINTS   list (can be empty)
  - RISKS                       list with severity: HIGH|MEDIUM|LOW
  - UNKNOWNS REQUIRING DECISION list (can be empty)
  - ESTIMATED SCOPE             Small|Medium|Large with justification

Validation before proceeding:
  □ All listed files actually exist (check filesystem)
  □ No unknowns marked blocking without resolution path
  □ RISKS section is present even if empty
```

---

## Confidence Gate

If UNKNOWNS REQUIRING DECISION contains any BLOCKING item:
→ Stop. Present the unknown to the user. Get a decision. Update output. Then proceed.

If confidence on scope estimate is LOW:
→ Flag in output and in task report. Do not block, but note it.

---

## On Failure

If codebase is too large to map in one pass:
→ Focus on files directly touched by the feature
→ Note "PARTIAL EXPLORE — focused on [areas]" at top of output
→ Proceed with what is known, flag gaps in RISKS
