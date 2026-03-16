# Workflow Manifest
# _system/MANIFEST.md
#
# READ THIS BEFORE SELECTING ANY WORKFLOW.
# This is the routing table for all structured work in this project.
# If a task matches a workflow here, use the workflow. Always.

---

## How To Use This File

1. Read the user's request
2. Scan the TRIGGER field of each workflow below
3. Select the best match
4. Load that workflow's WORKFLOW.md and execute it
5. If no match exists → execute with reasoning protocol, then run the
   CREATE-WORKFLOW meta-task afterward

If multiple workflows partially match, choose the one whose INPUT
most closely matches what you have, not the one whose OUTPUT sounds best.

---

## Workflow Index

### feature-development
```
TRIGGER:        User wants to build, add, or implement something new
INPUT:          Feature description (natural language or spec)
OUTPUT:         Committed, tested, PR-ready code + updated docs
AVG DURATION:   20-45 min
LAST RUN:       2026-03-16 (run-001)
QUALITY SCORE:  9/10
PATH:           ../feature-development/WORKFLOW.md
PIPELINE:       Can be chained into full-feature-delivery pipeline
```

### bug-fix
```
TRIGGER:        Something is broken, producing errors, or behaving wrong
INPUT:          Bug description, error message, or reproduction steps
OUTPUT:         Root cause documented, fix committed, regression test added
AVG DURATION:   10-30 min
LAST RUN:       —
QUALITY SCORE:  —
PATH:           ../bug-fix/WORKFLOW.md
```

### security-audit
```
TRIGGER:        Review for vulnerabilities, pre-deploy check, post-incident review
INPUT:          Scope: module name, directory path, or "full" — written to ./data/scope.md
OUTPUT:         Prioritized vulnerability report, P0/P1 fixes committed or escalated
AVG DURATION:   20-60 min
LAST RUN:       —
QUALITY SCORE:  —
PATH:           ../security-audit/WORKFLOW.md
FLAG THRESHOLD: <8.0 (higher bar than other workflows)
```

### red-team
```
TRIGGER:        Auto: after feature-development on auth/payments/data features,
                or any change touching >5 files.
                Manual: "red team [scope]"
INPUT:          Changed files from triggering workflow
OUTPUT:         Adversarial findings report — does NOT fix, only reports
AVG DURATION:   15-30 min
LAST RUN:       —
QUALITY SCORE:  —
PATH:           ../red-team/WORKFLOW.md
NOTE:           Read-only workflow. Findings must be actioned separately.
```

### knowledge-review
```
TRIGGER:        Monthly (automatic). Also when a decision is challenged
                or a major refactor changes established patterns.
INPUT:          All _knowledge/ and _system/ files
OUTPUT:         Updated knowledge base with stale entries corrected
AVG DURATION:   15-30 min
LAST RUN:       —
QUALITY SCORE:  —
PATH:           ../knowledge-review/WORKFLOW.md
SCHEDULE:       Run first of every month
```

### meta-cognitive-review
```
TRIGGER:        Quarterly. Or when workflows score consistently below 8.0.
INPUT:          Entire .workflows/ directory
OUTPUT:         Structural restructuring proposal (NOT implementation)
AVG DURATION:   30-60 min
LAST RUN:       —
QUALITY SCORE:  —
PATH:           ../meta-cognitive-review/WORKFLOW.md
NOTE:           Produces proposals only. Human approval required before changes.
```

---

## Pipeline Index

### full-feature-delivery
```
TRIGGER:        Feature needs to be built, secured, and documented end-to-end
SEQUENCE:       feature-development → security-audit → write-tests (parallel)
PATH:           ./_pipelines/full-feature-delivery.md
```

---

## Manifest Maintenance

Claude updates this file automatically:
- After every workflow run: update LAST RUN and QUALITY SCORE
- After creating a new workflow: add its entry here
- After deprecating a workflow: mark DEPRECATED, do not delete
- Monthly: review all scores and flag workflows below 7.0 for improvement
