# Quality Scores — Bug Fix Workflow
# _meta/quality-scores.md

---

## Scoring Rubric

```
OBJECTIVE (7 pts — binary, verifiable):
  Root cause correctly identified (fix works)    3 pts
  Regression test added and passing              2 pts
  No regressions in existing test suite          2 pts

SUBJECTIVE (3 pts — labeled as subjective):
  Fix is minimal / doesn't over-solve            1 pt  [subjective]
  Root cause documented with clarity             1 pt  [subjective]
  Gotchas.md updated when systemic pattern found 1 pt  [subjective]

MAX: 10
FLAG THRESHOLD: <7.0 triggers mandatory workflow review
```

---

## Run Log

| Date | Score | Bug Summary | Root Cause Confirmed? | Regression Test Added? | What Failed | Improvements Made |
|------|-------|-------------|----------------------|----------------------|-------------|-------------------|
| 2026-04-07 | 9/10 | Ocean telescope placement in vlbi-react | YES | YES (Playwright land/ocean check) | — | Added gotcha: fixes applied to root instead of vlbi-react |

---

## Derived Improvements
<!-- Format: [DATE] — [file changed] — [what changed] — [triggered by: run date, score] -->
