# Quality Scores — Security Audit Workflow
# _meta/quality-scores.md

---

## Scoring Rubric

```
OBJECTIVE (6 pts):
  All HIGH severity findings addressed (fix or documented)   3 pts
  Dependency audit completed with output recorded           1 pt
  All fixes verified via retest (finding count reduced)     2 pts

SUBJECTIVE (4 pts):
  Scan was thorough — went beyond obvious checks            2 pts  [subjective]
  Fixes are minimal / surgical                              1 pt  [subjective]
  Systemic patterns logged in gotchas.md                    1 pt  [subjective]

MAX: 10
FLAG THRESHOLD: <8.0 — security audits have a higher bar
```

---

## Run Log

| Date | Score | Scope | P0 Count | P1 Count | Fixed Count | What Was Missed | Improvements Made |
|------|-------|-------|----------|----------|-------------|-----------------|-------------------|

---

## Derived Improvements
<!-- Format: [DATE] — [file changed] — [what changed] — [triggered by: run date, missed finding] -->
