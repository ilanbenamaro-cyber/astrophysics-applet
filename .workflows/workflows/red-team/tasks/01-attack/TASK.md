# Task 01: Attack
# Workflow: red-team
# Purpose: Find every failure mode the implementation didn't anticipate

---

## Inputs

- Changed files from the workflow that triggered this red team run
- `../../../_knowledge/gotchas.md` — known historical failure patterns

---

## Never

```
✗ Do not be charitable — assume the worst about edge cases
✗ Do not stop at one finding per category — look for the second one
✗ Do not test what was already tested — find what wasn't tested
✗ Do not modify any source files — write only to _outputs/ and test files
```

---

## Attack Vectors — Work Through All Of These

### 1. Boundary Conditions
```
□ What happens at exactly the limit (not under, not over — AT the limit)?
□ What happens with empty input where input is expected?
□ What happens with null/undefined/None where an object is expected?
□ What happens with zero where a positive number is expected?
□ What happens with negative numbers where positives are assumed?
□ What happens with maximum length strings?
□ What happens with unicode, special characters, emoji in string fields?
```

### 2. State & Timing
```
□ What happens if this operation is called twice simultaneously?
□ What happens if the database write succeeds but the response fails?
□ What happens if this is called before initialization is complete?
□ What happens if an upstream dependency goes down mid-operation?
□ What is the state of the system if this fails at step 3 of 5?
   Is that state recoverable? Is it consistent?
```

### 3. Authorization Edge Cases
```
□ Can user A trigger this operation on user B's data?
□ What happens with an expired but syntactically valid token?
□ What happens with a valid token for a deleted account?
□ Can this endpoint be called without the expected prior step?
   (e.g., checkout without a cart, payment without auth)
□ What if the same request is replayed (replay attack)?
```

### 4. Data Integrity
```
□ What is stored in the database if this operation fails halfway?
□ Are there any writes that happen without a transaction?
□ If the same data is written twice, is the result correct?
□ If the response is cached, is the cache correctly invalidated on update?
```

### 5. Wrong Assumptions
```
Identify every implicit assumption in the implementation:
  - "This will always be called after X"
  - "This value will always be non-null"
  - "The user will always be authenticated here"
  - "This file will always exist"
For each: what happens if the assumption is wrong?
```

### 6. Observed Pattern Matching
Check _knowledge/gotchas.md — has any similar pattern caused problems before?
If yes: test specifically for that recurrence.

---

## Output Contract

```
File: ./_outputs/attack.md
Required sections:
  - ATTACK_SCOPE:     what was examined
  - FINDINGS:         list of findings
  - ASSUMPTIONS_FOUND: list of implicit assumptions identified
  - CLEAN_AREAS:      attack vectors checked with no findings

Each finding entry:
  FINDING-ID:         ATK-001, ATK-002, etc.
  VECTOR:             which attack category
  TRIGGER:            exact condition that causes the failure
  IMPACT:             what goes wrong — data loss / security breach /
                      incorrect behavior / crash / silent error
  SEVERITY:           CRITICAL | HIGH | MEDIUM | LOW
  PROOF:              test case or exact code path that demonstrates it

Validation:
  □ At least one finding per attack vector (or explicit "NONE FOUND — [evidence]")
  □ Every CRITICAL and HIGH finding has a PROOF entry
  □ CLEAN_AREAS section is present and honest
```

---

---

# Task 02: Report
# Workflow: red-team
# Purpose: Cold assessment — prioritize findings, make them actionable

---

## Inputs

- `../01-attack/_outputs/attack.md`

---

## Instructions

1. Read all findings from attack output

2. For each finding, assess:
   - Is this a real, exploitable issue or a theoretical edge case?
   - Real and exploitable → include
   - Purely theoretical with no realistic trigger → downgrade to INFO

3. Prioritize:
   ```
   CRITICAL: data loss, security breach, auth bypass — fix before any deploy
   HIGH:     silent incorrect behavior, partial data corruption — fix this sprint
   MEDIUM:   degraded experience under unusual conditions — schedule
   LOW:      minor inconsistency — log and monitor
   ```

4. For each CRITICAL/HIGH: write the specific fix recommendation
   (what to change, where, why it closes the issue)

---

## Output Contract

```
File: ./_outputs/report.md
Required sections:
  - EXECUTIVE_SUMMARY:  1 paragraph — how serious is the overall picture?
  - CRITICAL_FINDINGS:  list (can be empty)
  - HIGH_FINDINGS:      list
  - MEDIUM_FINDINGS:    list
  - LOW_FINDINGS:       list
  - RECOMMENDED_ACTIONS: ordered list — what to do first, second, third
  - VERDICT:            DEPLOY_READY | NEEDS_FIXES_BEFORE_DEPLOY | SIGNIFICANT_REWORK_NEEDED
```

---

## After Report Is Written

```
1. Present report to user — do not act on findings in this workflow
   Red team finds. Developer (or feature-development workflow) fixes.
2. If CRITICAL findings exist: flag immediately with ⚠ CRITICAL RED TEAM FINDING
3. Write run log
4. Update quality scores
5. If patterns found match past gotchas: note the recurrence in gotchas.md
```
