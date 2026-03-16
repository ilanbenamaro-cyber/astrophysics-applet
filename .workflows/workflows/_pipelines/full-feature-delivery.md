# Pipeline: Full Feature Delivery
# _pipelines/full-feature-delivery.md
# Trigger: Feature needs to be built, secured, and documented end-to-end

---

## Goal

Chain multiple workflows to take a feature request all the way to
production-ready code in a single invocation. No manual handoffs.

---

## Sequence

```
STEP 1: feature-development
  INPUT:  ./data/request.md
  OUTPUT: committed code on feature branch

STEP 2: security-audit  [runs after step 1]
  INPUT:  files changed in step 1 (read from step 1 _log)
  OUTPUT: security findings — HIGH severity = GATE (see below)

STEP 3 + STEP 4: run in parallel after step 2 clears
  STEP 3: write-tests    INPUT: files changed in step 1
  STEP 4: [future: write-documentation]
```

---

## Gates

### Security Gate (after step 2)
```
If security-audit finds HIGH severity issues:
  → STOP pipeline
  → Report findings to user
  → Do not proceed until HIGH issues are resolved
  → User must explicitly approve resumption

If MEDIUM severity only:
  → Flag findings in report
  → Continue pipeline
  → Add findings to _knowledge/gotchas.md

If no issues or LOW only:
  → Continue pipeline
```

---

## Invocation

```bash
claude "run full-feature-delivery pipeline for [feature description]"
```

Or write feature to `./data/request.md` first, then:

```bash
claude "execute .workflows/_pipelines/full-feature-delivery.md"
```

---

## Output Contract

```
□ Feature committed and tests passing (from step 1)
□ Security audit completed with no unresolved HIGH issues (from step 2)
□ Additional tests written if coverage gaps found (from step 3)
□ Pipeline run log written to _pipelines/_logs/<date>-run.md
□ MANIFEST.md updated with run stats for all three workflows
```
