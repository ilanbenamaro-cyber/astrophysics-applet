# Task 01: Diagnose
# Workflow: bug-fix
# Purpose: Confirm root cause before touching anything

---

## Never
```
✗ Do not modify any files in this task
✗ Do not form a fix plan until root cause is CONFIRMED, not hypothesized
✗ Do not proceed with PROBABLE root cause — confirm it
```

## Instructions

1. Read `../../data/bug-report.md`

2. Reproduce the bug (if reproduction steps exist):
   - Run the reproduction command
   - Confirm the error occurs
   - Note exact error message, stack trace, line numbers

3. Hypothesize 2-3 possible root causes ranked by likelihood

4. Test each hypothesis cheapest-first:
   - Add logging/print to confirm execution path
   - Check relevant files for the suspected issue
   - Run targeted tests to isolate the failure

5. Confirm root cause:
   - CONFIRMED = you can explain exactly why the error occurs and predict it will stop after your fix
   - PROBABLE = your best theory but not yet verified
   - Do not proceed to task 02 with PROBABLE

## Output Contract

```
File: ./_outputs/diagnosis.md
Required fields:
  - BUG_SUMMARY:       what the bug is (1-2 sentences)
  - REPRODUCTION:      CONFIRMED | CANNOT_REPRODUCE + steps taken
  - ROOT_CAUSE:        CONFIRMED | PROBABLE + exact explanation
  - ROOT_CAUSE_FILE:   exact file path + line number
  - HYPOTHESES_RULED_OUT: list of what was checked and eliminated
  - FIX_APPROACH:      high-level description of the fix
  - REGRESSION_TEST:   what test will prevent this from returning

Validation:
  □ ROOT_CAUSE is CONFIRMED (not PROBABLE) before proceeding
  □ ROOT_CAUSE_FILE references a real file at a real line
```
