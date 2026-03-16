# Task 01: Scan
# Workflow: security-audit
# Purpose: Systematic vulnerability discovery — no modifications, only findings

---

## Inputs

- `../../data/scope.md` — what to scan
- `../../../_knowledge/codebase.md` — project structure reference

---

## Never (Task-Specific)

```
✗ Do not modify any files — read only
✗ Do not attempt to exploit vulnerabilities to confirm them
✗ Do not skip the dependency audit — it finds real issues every time
✗ Do not only check OWASP Top 10 — go deeper
```

---

## Scan Categories

Work through each category systematically. Mark each N/A if genuinely not applicable.

### 1. Input Validation & Injection
```
□ All user-controlled input validated before use
□ SQL queries use parameterized queries / ORM — no string concatenation
□ NoSQL queries sanitized
□ File paths from user input restricted (path traversal)
□ HTML output escaped (XSS)
□ Command execution with user input (command injection)
□ XML/JSON parsing with untrusted input (XXE, prototype pollution)
```

### 2. Authentication & Authorization
```
□ Auth checks on every protected route/endpoint
□ Authorization checks (not just authentication) — can user A access user B's data?
□ Session tokens: generation, storage, expiry, invalidation on logout
□ Password handling: hashing algorithm, salt, reset flow
□ JWT: algorithm pinned (no 'none'), expiry enforced, signature verified
□ API keys: rotation policy, scope limits, not logged
```

### 3. Secrets & Credentials
```
□ No hardcoded secrets in source code (grep: password=, secret=, api_key=, token=)
□ No secrets in git history (check recent commits)
□ .env not committed or exposed
□ Secrets not logged (grep log calls near auth/token handling)
□ External service credentials scoped to minimum permissions
```

### 4. Data Exposure
```
□ Error messages don't leak stack traces, file paths, or DB schema to clients
□ API responses don't include fields the caller shouldn't see
□ Logging doesn't capture PII or credentials
□ Debug endpoints/routes removed or restricted
```

### 5. Dependencies
```bash
# Run:
npm audit --audit-level=moderate   # Node.js
pip-audit                          # Python
```
Document all findings with CVE numbers where available.

### 6. Configuration
```
□ CORS configured restrictively (not *)
□ Security headers present (CSP, HSTS, X-Frame-Options, etc.)
□ Debug mode disabled in any production-facing config
□ Database connection strings not in source
□ Unused ports/services not exposed
```

### 7. Code-Specific Patterns
```
□ eval() or equivalent — flag every instance
□ Dynamic require/import with user input
□ Unsafe deserialization
□ Race conditions in auth flows or financial operations
□ Insecure randomness (Math.random() for tokens — should be crypto.randomBytes)
```

---

## Example Output Entry

```markdown
### VULN-003: Path Traversal in File Upload Handler
FILE: src/api/handlers/upload.ts:L47
CATEGORY: Input Validation
SEVERITY: HIGH
EXPLOITABILITY: High — no authentication required to reach this endpoint
DESCRIPTION: User-supplied filename is joined directly to upload directory path
  without sanitization. Attacker can write to ../../../etc/crontab or similar.
EVIDENCE: `path.join(uploadDir, req.body.filename)` — filename not validated
RECOMMENDED FIX: Use path.basename() to strip directory components, then
  validate remaining filename against allowlist of extensions
REFERENCE: CWE-22
```

---

## Output Contract

```
File: ./_outputs/scan.md
Required sections:
  - SCAN_SCOPE:         what was examined
  - SCAN_DATE:          today's date
  - FINDINGS:           list of vulnerability entries (template above)
                        Empty list is valid — write "No findings in this category"
                        per category, not just omit the section
  - DEPENDENCY_AUDIT:   output summary from npm audit / pip-audit
  - SCAN_COVERAGE:      which categories were checked, which were N/A and why

Each finding must include: FILE, CATEGORY, SEVERITY (HIGH|MEDIUM|LOW|INFO),
EXPLOITABILITY, DESCRIPTION, EVIDENCE, RECOMMENDED FIX

Validation:
  □ All 7 scan categories are present in output (even if empty)
  □ Every HIGH finding has FILE and line number
  □ Dependency audit section is present
```
