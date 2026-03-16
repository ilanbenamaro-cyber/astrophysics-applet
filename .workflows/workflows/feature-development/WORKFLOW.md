# Workflow: Feature Development
# Trigger: User wants to build, add, or implement something new

---

## Goal

Take a feature request from description to committed, tested, PR-ready code.
Every task in this workflow gates the next — do not skip steps.
Quality is verified at the workflow level, not just per-task.

---

## Inputs Required

Before starting, verify these exist:
- [ ] Feature description written to: `./data/request.md`
      (If it doesn't exist, write the user's description there before proceeding)
- [ ] _knowledge/codebase.md is populated (if not, do an explore pass first)
- [ ] ENVIRONMENT.md is loaded and environment is `development`

---

## Task Dependency Graph

```
01-explore ──→ 02-plan ──→ 03-implement ──→ 04-verify
```

Sequential. Each task reads the previous task's output from `_outputs/`.
Do NOT proceed to next task if current task output fails its contract.

---

## Tools Available

- Filesystem: read + write access to codebase
- Bash: run tests, lint, build commands
- GitHub MCP: create branches, open PRs (if configured)

## Tools Explicitly Unavailable

- No writes to .env, production configs, secrets
- No force git operations

---

## Output Contract

Final output of this workflow:
```
□ All changed files committed on a feature branch
□ Tests pass (command output attached to _log entry)
□ Lint passes clean
□ PR opened (if GitHub MCP available) or branch pushed
□ _log/<date>-run-XXX.md written with session summary
□ _meta/quality-scores.md updated
□ _knowledge/codebase.md updated with any new patterns
```

---

## On Failure

If any task fails:
1. Write current state to `./_recovery/task-0N-state.md`
2. Document: what succeeded, what failed, exact error
3. Do NOT proceed to next task
4. Report to user with exact recovery instruction:
   "Resume by loading ./_recovery/task-0N-state.md and restarting task 0N"

---

## Quality Rubric

Scored after every run. Written to `_meta/quality-scores.md`.

```
Objective (6 points):
  □ Tests pass with zero failures        — 2 pts
  □ Lint passes with zero errors         — 1 pt
  □ Zero type errors                     — 1 pt
  □ All acceptance criteria from request — 2 pts

Subjective (4 points):
  □ Code follows established patterns    — 1 pt  [subjective]
  □ Error handling is complete           — 1 pt  [subjective]
  □ Implementation is minimal/clean      — 1 pt  [subjective]
  □ Commit messages are precise          — 1 pt  [subjective]

MAX: 10
```
