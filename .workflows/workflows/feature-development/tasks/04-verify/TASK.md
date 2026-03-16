# Task 04: Verify
# Workflow: feature-development
# Purpose: Confirm quality gates pass before committing anything

---

## Inputs

- `../03-implement/_outputs/implementation.md`
- `../02-plan/_outputs/plan.md` (test plan section)

---

## Never (Task-Specific)

```
✗ Do not self-certify — actually run every command
✗ Do not commit if any gate fails
✗ Do not mark tests as passing without running them
✗ Do not skip the security check
```

---

## Instructions

Run every gate. Record actual command output.

### Gate 1: Tests
```bash
[run project test command from CLAUDE.md Section 8 Commands]
```
PASS = zero failures. FAIL = any failure.

### Gate 2: Types
```bash
# TypeScript:
npx tsc --noEmit
# Python:
mypy [changed files]
```

### Gate 3: Lint
```bash
[run project lint command]
```

### Gate 4: Security Check
For every changed file, manually verify:
- No hardcoded secrets, tokens, or credentials
- No SQL string concatenation (use parameterized queries)
- All user input validated before use
- No new dependencies with known vulnerabilities

### Gate 5: Acceptance Criteria
Re-read `../../data/request.md`.
For each requirement stated or implied: does the implementation satisfy it?
List each requirement and mark SATISFIED | NOT SATISFIED.

### Gate 6: Commit Readiness
```
□ No TODO/FIXME in changed files
□ No console.log / print in changed files
□ All new functions have docstring/comment
□ Commit message drafted (typed correctly, ≤72 chars)
```

---

## Output Contract

```
File: ./_outputs/verify.md
Required fields:
  - GATE_TESTS:       PASS | FAIL + output summary
  - GATE_TYPES:       PASS | FAIL + error count
  - GATE_LINT:        PASS | FAIL + error count
  - GATE_SECURITY:    PASS | FAIL + findings
  - ACCEPTANCE:       list of requirements with SATISFIED | NOT SATISFIED
  - COMMIT_READY:     YES | NO
  - COMMIT_MESSAGE:   the exact commit message to use

Validation:
  □ All gates present
  □ COMMIT_READY is YES before any commit happens
```

---

## On Gate Failure

**Tests fail**: Return to task 03. Fix failures. Re-run verify.
**Types fail**: Return to task 03. Fix type errors. Re-run verify.
**Lint fails**: Fix inline. Re-run lint to confirm. Continue.
**Security finding**: Return to task 03. Fix before committing. Non-negotiable.
**Acceptance not met**: Return to task 03. Implement missing requirement.

Do not commit anything until COMMIT_READY = YES.

---

## After All Gates Pass

1. Commit using the message from COMMIT_MESSAGE field
2. Write run log to `../../_log/<date>-run-XXX.md`
3. Score the run in `../../_meta/quality-scores.md`
4. Update `../../../_knowledge/codebase.md` with any new patterns
5. Write task report (CLAUDE.md Section 12 format)
