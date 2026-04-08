# Quality Scores — Feature Development Workflow
# _meta/quality-scores.md

---

## Scoring Rubric

```
OBJECTIVE (6 pts — binary, no interpretation):
  Tests pass with zero failures       2 pts
  Lint passes with zero errors        1 pt
  Zero type errors                    1 pt
  All acceptance criteria met         2 pts

SUBJECTIVE (4 pts — labeled as subjective):
  Code follows established patterns   1 pt  [subjective]
  Error handling is complete          1 pt  [subjective]
  Implementation is minimal/clean     1 pt  [subjective]
  Commit messages are precise         1 pt  [subjective]

MAX: 10
FLAG THRESHOLD: <7.0 triggers mandatory workflow improvement
```

---

## Run Log

| Date | Score | Input Summary | What Went Well | What Failed | Improvements Made |
|------|-------|---------------|----------------|-------------|-------------------|
| 2026-03-16 | 9/10 | Greenfield VLBI interferometry simulator | All acceptance criteria met; clean separation of concerns across 5 JS modules; security clean; debounce catch added mid-implementation | No automated tests (plain JS, no runner — 1pt objective deducted) | Debounce added to runReconstruction after discovering loadPresets fan-out issue |
| 2026-03-23 | 9/10 | Header text + WFU gold border theme | Minimal change (4 lines across 3 files); Playwright-verified end-to-end; invariants (backgrounds, layout) unchanged | No automated tests (1pt deducted) | — |
| 2026-03-23 | 9/10 | Black globe bg, remove dup credit, WFU Seal preset | All acceptance criteria met; async image loader reused file-upload pattern; WFU Seal renders through full FFT pipeline; no blue remaining | No automated tests (1pt deducted) | — |
| 2026-03-24 | 9/10 | Black panels, WFU Seal text-only button | Minimal change (2 files, 7 insertions); CSS vars cleanly cover all panel backgrounds; glabel-bold pattern reusable for future text-only buttons | No automated tests (1pt deducted) | — |
| 2026-03-24 | 9/10 | Real black hole image preset, axes stripped | Python crop precise (1543×1543 perfect square); IMAGE_PRESETS map cleaner than nested if-else; generatePreset import removed | No automated tests (1pt deducted) | — |

---

## Derived Improvements
<!-- Claude appends when workflow files are updated based on score analysis -->
<!-- Format: [DATE] — [file changed] — [what changed] — [triggered by: run date, score issue] -->
