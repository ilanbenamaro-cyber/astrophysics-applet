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
| 2026-04-07 | 9/10 | Land mask too coarse (1° bitmap) | YES (hard data: 5/15 sites wrong) | YES (Playwright polygon check) | 3 island data gaps in 110m dataset | Added gotcha: 110m world-atlas limits |
| 2026-04-07 | 10/10 | Coastal land blocked + ocean during load + MEM removed | YES (all 3 confirmed before code touch) | YES (Playwright: 14 land/ocean assertions + UI checkbox check) | — | Existing gotcha covers 110m; vertex buffer is the documented fix |

---

## Derived Improvements
<!-- Format: [DATE] — [file changed] — [what changed] — [triggered by: run date, score] -->
