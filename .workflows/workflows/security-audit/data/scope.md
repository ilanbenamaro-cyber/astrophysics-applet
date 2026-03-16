# Security Audit Scope
# Fill this in before running the security-audit workflow.
# ─────────────────────────────────────────────────────────────────────────────

## Scope

[Choose one:]
- [ ] Full codebase
- [ ] Specific module: [path]
- [ ] Specific feature: [name]
- [ ] Pre-deploy review for: [branch/PR]
- [ ] Post-incident review: [incident description]

## Focus Areas

[Any specific vulnerability classes you're particularly concerned about:]
- [ ] Authentication / Authorization
- [ ] Input validation / Injection
- [ ] Data exposure
- [ ] Dependency vulnerabilities
- [ ] Other: [specify]

## Known Context

[Anything relevant Claude should know before starting:]
- Recent changes to audit: [list if applicable]
- Previously found issues: [any prior audit findings]
- High-risk areas you already know about: [list]

## Acceptable Risk Level

[What severity level requires immediate action vs. scheduling:]
- Block deploy on: HIGH and above | CRITICAL only | [other]
- Schedule fix for: MEDIUM | [other]
