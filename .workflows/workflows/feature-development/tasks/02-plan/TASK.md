# Task 02: Plan
# Workflow: feature-development
# Purpose: Build a falsified implementation plan before writing code

---

## Inputs

- `../01-explore/_outputs/explore.md` — required, must exist
- `../../data/request.md` — original feature request
- `../../../_knowledge/decisions.md` — architectural constraints

---

## Never (Task-Specific)

```
✗ Do not write implementation code in this task
✗ Do not produce a plan you haven't tried to break
✗ Do not skip the falsification step — it is the most important part
✗ Do not present a plan with unresolved BLOCKING unknowns from explore output
```

---

## Instructions

1. Read `../01-explore/_outputs/explore.md` fully

2. Draft the implementation plan:
   - Exact changes to each file in FILES TO MODIFY
   - Exact structure for each file in FILES TO CREATE
   - Order of operations (what must be done before what)
   - What tests are required and what they verify

3. **Falsify the plan** — actively attempt to break it:
   ```
   Ask for each step:
   - What happens if this fails halfway through?
   - What edge cases does this not handle?
   - What assumption am I making that could be wrong?
   - What happens under concurrent access / high load?
   - What is the security surface of this change?
   - What happens if the external dependency is unavailable?
   ```

4. For each failure mode found:
   - If addressable: modify the plan to address it
   - If acceptable risk: document it explicitly
   - If blocking: surface to user before proceeding

5. Produce the final plan only after falsification is complete

---

## Example Output

```markdown
## IMPLEMENTATION PLAN

### Order of Operations
1. Create src/api/handlers/userPreferences.ts
2. Add repository method in src/db/repositories/userRepository.ts
3. Add route in src/api/routes/users.ts
4. Update auth middleware to recognize new token scope
5. Write tests

### File Changes

**CREATE: src/api/handlers/userPreferences.ts**
- Function: getUserPreferences(userId: string): Promise<UserPreferences>
- Function: updateUserPreferences(userId: string, prefs: Partial<UserPreferences>): Promise<void>
- Follows pattern from: src/api/handlers/userProfile.ts
- Error handling: 404 if user not found, 422 if prefs schema invalid

**MODIFY: src/db/repositories/userRepository.ts**
- Add: findPreferences(userId: string): Promise<UserPreferences | null>
- Add: updatePreferences(userId: string, prefs: Partial<UserPreferences>): void
- Insert after line ~87 (end of existing user methods)

[... for each file ...]

### Test Plan
- getUserPreferences: happy path, user not found, DB error
- updateUserPreferences: valid input, invalid schema, partial update
- Route integration: auth required, correct status codes

### Falsification Results
ADDRESSED:
  - Concurrent update race condition → using DB transaction in updatePreferences
  - Invalid prefs schema → Zod validation at handler entry

ACCEPTED RISKS (documented):
  - No pagination on preferences if array grows large
    → acceptable for v1, flagged as future debt

ASSUMPTIONS MADE:
  - User always exists when preferences are fetched (validated by auth middleware)
  - Preferences schema is stable for this release
```

---

## Output Contract

```
File: ./_outputs/plan.md
Required sections:
  - ORDER OF OPERATIONS         numbered list
  - FILE CHANGES                entry per file with specific changes described
  - TEST PLAN                   what tests, what they verify
  - FALSIFICATION RESULTS       ADDRESSED list + ACCEPTED RISKS list
  - ASSUMPTIONS MADE            list (can be empty, not omitted)

Validation:
  □ Every file in explore's FILES TO MODIFY has a corresponding FILE CHANGES entry
  □ FALSIFICATION RESULTS is present and not empty
  □ No BLOCKING unknowns unresolved
  □ Test plan covers at least: happy path + one failure path per new function
```

---

## Confidence Gate

If any ACCEPTED RISKS are marked HIGH severity:
→ Present to user before proceeding. Get explicit acknowledgment.

If plan requires making 5+ file changes:
→ Present plan summary to user: "Implementing this touches X files. Proceeding unless you want to review first."
