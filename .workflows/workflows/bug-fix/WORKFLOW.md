# Workflow: Bug Fix
# Trigger: Something is broken, producing errors, or behaving incorrectly

---

## Goal

Identify root cause, fix it precisely, verify the fix, add a regression test
so the bug cannot silently return. Do not guess. Do not patch symptoms.

---

## Inputs Required

- [ ] Bug description, error message, or reproduction steps
      Written to `./data/bug-report.md` (write it there if not present)

---

## Task Dependency Graph

```
01-diagnose ──→ 02-fix ──→ 03-verify
```

Gate rule: Do not proceed to 02-fix without a confirmed root cause in 01-diagnose output.
A fix without a diagnosed cause is a guess. Guesses are not acceptable.

---

## Tools Available

- Filesystem: read + write
- Bash: run reproduction commands, tests, logs
- GitHub MCP: read issue history if bug was reported there

---

## Output Contract

```
□ Root cause documented in 01-diagnose/_outputs/diagnosis.md
□ Fix committed on fix/<slug> branch
□ Regression test added and passing
□ Bug cannot be reproduced after fix
□ _log entry written
□ quality-scores.md updated
□ If bug reveals a systemic pattern: _knowledge/gotchas.md updated
```

---

## On Failure

If root cause cannot be confirmed after exhausting diagnosis steps:
→ Write partial diagnosis to _recovery/diagnosis-partial.md
→ Report to user with exact findings and what additional info is needed
→ Do not guess and fix without a confirmed root cause

---

## Quality Rubric

```
OBJECTIVE (7 pts):
  Root cause correctly identified (fix works)    3 pts
  Regression test added and passing              2 pts
  No regressions in existing tests               2 pts

SUBJECTIVE (3 pts):
  Fix is minimal (doesn't over-solve)            1 pt  [subjective]
  Root cause documented clearly                  1 pt  [subjective]
  Gotchas.md updated if systemic                 1 pt  [subjective]

MAX: 10
```
