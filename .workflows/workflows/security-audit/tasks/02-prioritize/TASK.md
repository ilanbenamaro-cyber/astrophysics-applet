# Task 02: Prioritize
# Workflow: security-audit
# Purpose: Rank findings by real-world risk, not just severity label

---

## Inputs

- `../01-scan/_outputs/scan.md` — all findings

---

## Never

```
✗ Do not re-rank based on difficulty to fix — rank by actual risk
✗ Do not omit LOW/INFO findings — they compound
✗ Do not proceed to task 03 if HIGH findings exist without user acknowledgment
```

---

## Instructions

1. Read all findings from scan output

2. Score each finding on two axes:
   - **Severity**: impact if exploited (HIGH / MEDIUM / LOW / INFO)
   - **Exploitability**: how easy to exploit in practice (Easy / Moderate / Hard)

3. Build the priority matrix:
   ```
   HIGH + Easy      → P0: Fix immediately, block deploy
   HIGH + Moderate  → P1: Fix before next release
   HIGH + Hard      → P1: Fix before next release
   MEDIUM + Easy    → P2: Fix this sprint
   MEDIUM + Moderate→ P2: Fix this sprint
   MEDIUM + Hard    → P3: Schedule
   LOW              → P3: Schedule
   INFO             → P4: Awareness only
   ```

4. For each P0/P1: determine if fixable in task 03 (code change) or requires
   infrastructure/process change (escalate to user)

5. **GATE**: If any P0 findings exist → present to user before proceeding.
   Write findings to output, then STOP and report.

---

## Output Contract

```
File: ./_outputs/prioritized.md
Required sections:
  - PRIORITY_MATRIX:   findings grouped by P0/P1/P2/P3/P4
  - FIXABLE_IN_CODE:   list of P0+P1 issues fixable with code changes
  - REQUIRES_ESCALATION: list of P0+P1 issues needing infra/process change
  - TOTAL_COUNTS:      P0: N, P1: N, P2: N, P3: N, P4: N
  - GATE_STATUS:       CLEAR (no P0) | BLOCKED (P0 found — awaiting user)

Validation:
  □ Every finding from scan.md appears in exactly one priority tier
  □ GATE_STATUS is present
  □ If BLOCKED: do not write task-03 TASK.md execution — stop here
```

---

---

# Task 03: Fix
# Workflow: security-audit
# Purpose: Surgical fixes for prioritized vulnerabilities

---

## Inputs

- `../02-prioritize/_outputs/prioritized.md` — fix list
- `../01-scan/_outputs/scan.md` — full context per vulnerability

---

## Never

```
✗ Do not fix issues not in FIXABLE_IN_CODE list — those require escalation
✗ Do not refactor or improve code beyond the security fix
✗ Do not introduce new patterns or dependencies to fix security issues
   unless there is genuinely no alternative
✗ Do not commit before verifying fix actually closes the vulnerability
```

---

## Instructions

For each item in FIXABLE_IN_CODE (P0 first, then P1, then P2):

1. Re-read the original finding in scan.md
2. Apply the minimal code change that closes the vulnerability
3. Verify: does the original evidence line still exist? It should not.
4. Check: did the fix introduce any new issues?
5. Run tests — security fixes must not break existing behavior

After all fixes:
- Run the static analysis tools again (from task 01) to confirm findings are resolved
- Document each fix with before/after

---

## Output Contract

```
File: ./_outputs/fixes.md
Required sections:
  - FIXES_APPLIED:     one entry per vulnerability fixed
    Each entry: VULN-ID, FILE, WHAT CHANGED, VERIFICATION (how confirmed closed)
  - NOT_FIXED:         vulnerabilities from list not fixed + reason
  - RETEST_RESULTS:    re-run of static analysis tools — output summary
  - COMMIT_MESSAGES:   one per logical group of fixes

Validation:
  □ Every P0 and P1 from FIXABLE_IN_CODE is in FIXES_APPLIED or NOT_FIXED
  □ RETEST_RESULTS shows reduced finding count
  □ Tests pass after all fixes
```

---

## After Fixes Complete

```
1. Commit each logical group with: security(<scope>): <what was fixed>
2. Update _knowledge/gotchas.md for any systemic patterns found
3. Write run log
4. Update quality scores
5. Task report: include TOTAL vulnerabilities found, P0/P1 count, fixed count
```
