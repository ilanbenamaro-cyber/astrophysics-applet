# Task 02: Report
# Workflow: red-team
# Purpose: Translate attack findings into a cold, prioritized, actionable report

---

## Inputs

- `../01-attack/_outputs/attack.md` — all raw findings

---

## Never

```
✗ Do not implement any fixes in this workflow — red team finds, developer fixes
✗ Do not soften findings to be polite — report exactly what was found
✗ Do not include theoretical findings with no realistic trigger
✗ Do not skip the VERDICT — it is the most important line in the report
```

---

## Instructions

### Step 1: Filter Raw Findings
Read every finding in attack.md.
Apply this filter to each:

**Include** — realistic, triggerable under conditions that could actually occur
**Downgrade to INFO** — theoretically possible but requires an implausible sequence
**Remove** — already caught and handled by existing tests (note this in CLEAN_AREAS)

### Step 2: Prioritize

```
CRITICAL — data loss, security breach, authentication bypass, remote code execution
           → Must fix before any deploy. Block the PR.

HIGH     — silent incorrect behavior, partial data corruption, auth edge cases,
           potential data exposure under specific conditions
           → Fix before next release.

MEDIUM   — degraded behavior under unusual but plausible conditions,
           error handling gaps that don't expose data
           → Schedule for this sprint.

LOW      — minor inconsistencies, cosmetic edge cases
           → Log, monitor, fix opportunistically.

INFO     — theoretical, low probability, no realistic exploit path
           → Awareness only.
```

### Step 3: Write Fix Recommendations
For every CRITICAL and HIGH finding, write a specific, actionable fix recommendation:
- Which file, which line or function
- What the fix looks like in code (pseudocode is fine)
- What the fix prevents

Generic recommendations ("add input validation") are not acceptable.
Specific recommendations ("validate filename with `path.basename()` before
joining to uploadDir on line 47 of upload.ts") are required.

### Step 4: Write Executive Summary
One paragraph. Honest assessment of overall risk posture.
Does not minimize. Does not catastrophize. States facts.

---

## Output Contract

```
File: ./_outputs/report.md
Required sections:
  - EXECUTIVE_SUMMARY:      1 paragraph, honest overall assessment
  - CRITICAL_FINDINGS:      list (each with FIX_RECOMMENDATION)
  - HIGH_FINDINGS:          list (each with FIX_RECOMMENDATION)
  - MEDIUM_FINDINGS:        list
  - LOW_FINDINGS:           list
  - INFO_FINDINGS:          list (can be empty)
  - RECOMMENDED_ACTIONS:    ordered list — what to do first, second, third
  - VERDICT:                one of:
                            DEPLOY_READY — no CRITICAL or HIGH findings
                            FIX_FIRST — CRITICAL or HIGH findings present
                            SIGNIFICANT_REWORK — systemic issues found

Validation:
  □ Every CRITICAL finding has a FIX_RECOMMENDATION
  □ Every HIGH finding has a FIX_RECOMMENDATION
  □ VERDICT is present and matches the findings
  □ RECOMMENDED_ACTIONS is ordered (most urgent first)
```

---

## After Report Is Written

```
1. Present report to user immediately
   If CRITICAL findings: prefix response with ⚠ CRITICAL RED TEAM FINDINGS

2. Do NOT fix anything in this workflow
   The fix happens via feature-development or bug-fix workflow

3. If VERDICT = FIX_FIRST or SIGNIFICANT_REWORK:
   Suggest: "Run bug-fix workflow for each CRITICAL finding before deploying"

4. Write run log: ../../_log/<YYYY-MM-DD>-run-001.md

5. Update ../../_meta/quality-scores.md

6. If findings match patterns in _knowledge/gotchas.md:
   Note the recurrence — add REOCCURRED: [date] to the relevant entry
```
