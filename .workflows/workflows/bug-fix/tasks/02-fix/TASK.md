# Task 02: Fix
# Workflow: bug-fix

---

## Never
```
✗ Do not fix more than what the diagnosis identified
✗ Do not refactor surrounding code while fixing
✗ Do not commit until task 03 passes
```

## Instructions

1. Read `../01-diagnose/_outputs/diagnosis.md`
2. Apply the minimal fix that addresses the confirmed root cause
3. Add the regression test specified in diagnosis
4. Write `_outputs/fix.md`:
   - FILES_CHANGED: list
   - FIX_DESCRIPTION: what was changed and why
   - REGRESSION_TEST_ADDED: file path + what it tests

---

# Task 03: Verify
# Workflow: bug-fix

---

## Never
```
✗ Do not self-certify — run every command
✗ Do not commit if bug still reproduces
```

## Instructions

1. Reproduce the original bug → confirm it NO LONGER OCCURS
2. Run full test suite → confirm no regressions
3. Run lint and types → confirm clean
4. Verify regression test exists and passes

## Output Contract

```
File: ./_outputs/verify.md
Required fields:
  - BUG_REPRODUCED_AFTER_FIX: NO (if YES, return to task 02)
  - TESTS:                    PASS | FAIL + count
  - REGRESSION_TEST:          PASS | FAIL
  - LINT:                     PASS | FAIL
  - COMMIT_READY:             YES | NO
  - COMMIT_MESSAGE:           fix(<scope>): <what was fixed and root cause>
```

## After Gates Pass

1. Commit with message from COMMIT_MESSAGE
2. Check: is this bug a symptom of a systemic pattern?
   YES → Add entry to `../../../_knowledge/gotchas.md`
3. Write `../../_log/<date>-run-XXX.md`
4. Update `../../_meta/quality-scores.md`
