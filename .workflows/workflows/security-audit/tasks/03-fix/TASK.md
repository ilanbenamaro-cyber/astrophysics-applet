# Task 03: Fix
# Workflow: security-audit
# Purpose: Apply surgical fixes for all code-fixable vulnerabilities

---

## Inputs

- `../02-prioritize/_outputs/prioritized.md` — FIXABLE_IN_CODE list
- `../01-scan/_outputs/scan.md` — full context per vulnerability

---

## Never

```
✗ Do not fix issues not in FIXABLE_IN_CODE — those require infrastructure changes
✗ Do not refactor or improve code while fixing security issues
✗ Do not introduce new dependencies unless there is genuinely no alternative
✗ Do not commit anything until ALL fixes are verified via retest
✗ Do not proceed if GATE_STATUS = BLOCKED in prioritized.md
```

---

## Instructions

Work through FIXABLE_IN_CODE list P0 first, then P1, then P2.

For each vulnerability:

### Step 1: Re-read the finding
Load the original finding from `../01-scan/_outputs/scan.md`.
Understand exactly what the vulnerable code path is.

### Step 2: Apply the minimal fix
The fix closes the vulnerability. Nothing more.
No "while I'm here" improvements.
Common fix patterns:
```
Path traversal    → path.basename() + extension allowlist
SQL injection     → parameterized query / ORM method
XSS               → output encoding / template escaping
Hardcoded secret  → move to environment variable
Insecure random   → crypto.randomBytes() / secrets.token_bytes()
Auth bypass       → add explicit auth check at route/function entry
CORS too wide     → restrict to specific origins
```

### Step 3: Verify the specific fix
- Does the original EVIDENCE line from the scan still exist? It should not.
- If the evidence was `path.join(uploadDir, req.body.filename)` — that line is gone.
- Run a targeted test for this specific vulnerability if possible.

### Step 4: Run full test suite
After all fixes applied:
```bash
[project test command]
```
Security fixes must not break existing behavior.

### Step 5: Retest with static analysis
Re-run the tools from task 01:
```bash
# Python
bandit -r [scope]
pip-audit

# JavaScript/TypeScript  
npx eslint --rulesdir security-rules [scope]
npm audit
```
Confirm finding count has decreased.

---

## Output Contract

```
File: ./_outputs/fixes.md
Required sections:
  - FIXES_APPLIED:
      Per entry: VULN-ID | FILE:LINE | WHAT CHANGED | VERIFICATION METHOD | VERIFIED
  - NOT_FIXED:
      Per entry: VULN-ID | REASON | OWNER | DEADLINE (for escalated issues)
  - TEST_SUITE:        PASS | FAIL + count
  - RETEST_RESULTS:   tool output summary showing reduced findings
  - COMMIT_MESSAGES:  one per logical group (e.g., all input validation fixes together)

Validation:
  □ Every P0 item from FIXABLE_IN_CODE appears in FIXES_APPLIED or NOT_FIXED
  □ VERIFIED = YES for every item in FIXES_APPLIED
  □ TEST_SUITE = PASS
  □ RETEST_RESULTS shows net reduction in findings
```

---

## Commit Strategy

Group related fixes into logical commits:
```
security(input-validation): sanitize all user-supplied file paths
security(auth): enforce token expiry on all protected routes
security(deps): resolve 3 moderate CVEs in dependencies
```

Never commit all security fixes in one mega-commit — it obscures what changed.

---

## After All Fixes Committed

```
1. Update _knowledge/gotchas.md with any systemic patterns discovered
   Format: [area] — [vulnerability class] — what to check — [date]

2. Write run log: ../../_log/<YYYY-MM-DD>-run-001.md
   Include: scope, total findings, P0/P1/P2 counts, fixed count, not-fixed count

3. Update ../../_meta/quality-scores.md

4. Task report (CLAUDE.md Section 12):
   WHAT CHANGED: N vulnerabilities fixed across N files
   WHAT TO KNOW: any NOT_FIXED items with HIGH severity — needs attention
   DEBT INTRODUCED: none (security fixes should introduce no new debt)
   SUGGESTED NEXT: red-team the fixed code if changes were significant
```
