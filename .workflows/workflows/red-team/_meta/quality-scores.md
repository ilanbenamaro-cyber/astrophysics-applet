# Quality Scores — Red Team Workflow
# _meta/quality-scores.md

---

## Scoring Rubric

```
OBJECTIVE (4 pts):
  Every finding includes a reproducible trigger condition     2 pts
  Findings were not already caught by existing tests          2 pts
  (if findings are all already tested = attack wasn't adversarial enough)

SUBJECTIVE (6 pts):
  Depth of adversarial thinking — went beyond surface checks  3 pts  [subjective]
  Findings are genuinely non-obvious                          2 pts  [subjective]
  Report is actionable (each finding has a clear fix path)    1 pt   [subjective]

MAX: 10
NOTE: A score below 6 means the red team was not adversarial enough, not that
      the code is good. Low scores here require deeper attack methodology.
```

---

## Run Log

| Date | Score | Scope | CRITICAL Found | HIGH Found | VERDICT | What Attack Missed | Improvements Made |
|------|-------|-------|----------------|------------|---------|-------------------|-------------------|

---

## Derived Improvements
<!-- Format: [DATE] — [file changed] — [what changed] — [triggered by: run date, missed finding type] -->
