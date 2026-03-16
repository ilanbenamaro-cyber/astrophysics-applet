# Workflow: Red Team
# Trigger: Automatically after feature-development or security-audit on significant changes.
#          Also invokable manually: "red team [feature/module name]"

---

## Goal

This workflow's entire job is to find failure modes in code that just passed
every standard quality gate. You are not looking for obvious bugs.
You are looking for the failure the developer didn't think of.

Adversarial mindset is required. Optimism is a defect in this workflow.

---

## When This Runs

Automatically triggered by:
- feature-development workflow after any auth, payments, or data-handling feature
- Any change touching >5 files
- Pre-deploy review

Manually triggered by:
- "red team [scope]"

---

## Task Dependency Graph

```
01-attack ──→ 02-report
```

These are not collaborative tasks. Task 01 is an adversarial investigation.
Task 02 is a cold-eyed assessment of what was found.

---

## Critical Mindset Instruction

In task 01, you are not Claude the helpful engineer.
You are an adversary who wants this system to fail.
You know the implementation. You are trying to break it.

Specifically:
- Assume the developer made at least one wrong assumption
- Assume at least one edge case was not considered
- Assume the happy path was tested but the failure paths were not
- Your job is to find the assumption that breaks the system

---

## Tools Available

- Filesystem: read access to all changed files and their dependencies
- Bash: run edge case tests, boundary condition tests

## Tools Explicitly Unavailable

- Do not make external network calls
- Do not write to production systems
- Do not commit anything — red team is read-only except for test files

---

## Output Contract

```
□ Attack report written with all findings
□ Each finding includes: reproducible test case or exact trigger condition
□ Findings prioritized by: would this cause data loss, security breach, or
  silent incorrect behavior?
□ Findings reported to user — do not silently fix in this workflow
□ If critical finding: flag immediately, do not wait for full report
```

---

## Quality Rubric

```
OBJECTIVE (4 pts):
  Every finding includes a reproducible trigger condition   2 pts
  No finding was already caught by existing tests           2 pts
  (findings caught by tests = the attack was not adversarial enough)

SUBJECTIVE (6 pts):
  Depth of adversarial thinking                             3 pts  [subjective]
  Findings are genuinely non-obvious                        2 pts  [subjective]
  Report is actionable (developer can act on each finding)  1 pt   [subjective]

MAX: 10
A score of 6+ means the system is more secure for having run this workflow.
A score below 6 means the red team was not adversarial enough.
```
