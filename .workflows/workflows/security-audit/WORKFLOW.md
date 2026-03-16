# Workflow: Security Audit
# Trigger: Review for vulnerabilities, pre-deploy check, post-incident audit

---

## Goal

Systematically identify vulnerabilities across a defined scope, prioritize by
severity and exploitability, fix what can be fixed now, document what cannot.
Do not produce a superficial checklist. Find real exploitable issues.

---

## Inputs Required

- [ ] Scope defined: module name, directory path, or "full"
      Write to `./data/scope.md` before starting
- [ ] ENVIRONMENT.md loaded — audit mode constraints apply

---

## Audit Mode Constraints

During security audit:
- Read access is unrestricted within scope
- Do NOT modify any files during scan phase (tasks 01-02)
- Fixes in task 03 are surgical — minimum change to close vulnerability
- Never introduce new patterns or refactors while fixing security issues

---

## Task Dependency Graph

```
01-scan ──→ 02-prioritize ──→ 03-fix
                │
                └──→ [GATE: HIGH severity found?]
                         YES → present to user before task 03
                         NO  → proceed to task 03 automatically
```

---

## Tools Available

- Filesystem: read access within scope
- Bash: static analysis tools (bandit for Python, eslint security plugins for JS/TS)
- Bash: dependency audit (pip-audit, npm audit)
- Web search: CVE database lookups for identified dependency versions

## Tools Explicitly Unavailable

- No writes to production configs during audit
- No deployment operations
- No external API calls that could leak code content

---

## Output Contract

```
□ Vulnerability report written to _outputs/ (task 02)
□ All HIGH severity issues either fixed or documented with explicit owner + deadline
□ Dependency audit completed and findings logged
□ Fixes committed on security/<slug> branch
□ _knowledge/gotchas.md updated with systemic patterns found
□ Run log written
□ Quality scores updated
```

---

## Quality Rubric

```
OBJECTIVE (6 pts):
  All HIGH severity issues addressed (fix or documented decision)  3 pts
  Dependency audit completed                                       1 pt
  All fixes verified (no regressions)                              2 pts

SUBJECTIVE (4 pts):
  Scan was thorough (not just obvious OWASP top 10)                2 pts  [subjective]
  Fixes are minimal / don't over-engineer                          1 pt  [subjective]
  Systemic patterns documented in gotchas.md                       1 pt  [subjective]

MAX: 10
```
