# Task 03: Verify
# Workflow: bug-fix
# Purpose: Confirm the fix works, no regressions, regression test in place

---

## Inputs

- `../01-diagnose/_outputs/diagnosis.md` — original root cause
- `../02-fix/_outputs/fix.md` — what was changed

---

## Never (Task-Specific)

```
✗ Do not self-certify — run every command and record actual output
✗ Do not commit if the original bug still reproduces
✗ Do not commit if regression test is missing
✗ Do not commit if existing tests regressed
```

---

## Instructions

### Check 1: Bug No Longer Reproduces
Run the exact reproduction steps from diagnosis.md.
Record the result. Expected: bug does not occur.

### Check 2: Regression Test Exists And Passes
Confirm the test added in task 02 exists at the path specified in fix.md.
Run it in isolation. Record result.

### Check 3: Full Test Suite
```bash
[project test command]
```
Zero failures required. Record actual output — do not summarize.

### Check 4: Types
```bash
# TypeScript: npx tsc --noEmit
# Python: mypy [changed files]
```

### Check 5: Lint
```bash
[project lint command]
```

### Check 6: No Collateral Damage
Review changed files one more time:
- No debug statements left in
- No TODO/FIXME introduced
- No unrelated changes snuck in
- Minimal diff — fix is surgical

---

## Output Contract

```
File: ./_outputs/verify.md
Required fields:
  - BUG_REPRODUCED_AFTER_FIX:  NO | YES (if YES — return to task 02)
  - REGRESSION_TEST:           PASS | FAIL | MISSING
  - FULL_TEST_SUITE:           PASS | FAIL + failure count
  - TYPES:                     PASS | FAIL + error count
  - LINT:                      PASS | FAIL + error count
  - COLLATERAL_DAMAGE:         NONE | [list of issues found]
  - COMMIT_READY:              YES | NO
  - COMMIT_MESSAGE:            fix(<scope>): <root cause fixed — ≤72 chars>

Validation:
  □ BUG_REPRODUCED_AFTER_FIX = NO
  □ REGRESSION_TEST = PASS
  □ FULL_TEST_SUITE = PASS
  □ COMMIT_READY = YES
  All four must be true before committing.
```

---

## After All Checks Pass

```
1. Commit using COMMIT_MESSAGE exactly as written
2. Assess: is this bug a symptom of a broader systemic pattern?
   YES → Add entry to .workflows/_knowledge/gotchas.md:
         AREA, SEVERITY, WHAT HAPPENED, ROOT CAUSE, HOW TO AVOID, DETECTION
3. Write run log: ../../_log/<YYYY-MM-DD>-run-001.md
4. Update ../../_meta/quality-scores.md with this run's score
5. Write task report using CLAUDE.md Section 12 format
```
