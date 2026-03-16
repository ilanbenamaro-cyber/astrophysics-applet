# Meta-Task: Evaluate A Workflow
# _system/meta/EVALUATE-WORKFLOW.md
#
# Run this after any workflow run where something felt off,
# or automatically when a workflow scores below 7.0.

---

## Trigger Conditions

- Workflow quality score < 7.0 after any run
- User expresses dissatisfaction with a workflow's output
- A workflow run produced a significant regression or error
- Manual request: "evaluate the [workflow] workflow"

---

## Instructions

### Step 1: Gather Evidence
```
Read: workflow's _meta/quality-scores.md — all run history
Read: workflow's _log/ — last 3 run logs
Read: each TASK.md in the workflow
Identify: what specifically scored low, what failed, what the user said
```

### Step 2: Root Cause The Score
For each low-scoring area, determine which is true:
```
A. The TASK.md instructions were unclear or incomplete
B. The output contract didn't capture what matters
C. The task sequence was wrong (wrong order, wrong split)
D. The quality rubric was measuring the wrong things
E. Claude executed correctly but the workflow design is flawed
F. One-off execution error (not a workflow design problem)
```

Only A-E warrant workflow changes. F does not.

### Step 3: Produce Evaluation Report

```
File: .workflows/[workflow-name]/_meta/evaluation-[date].md

Required sections:
  - TRIGGER:           why this evaluation was run
  - EVIDENCE:          what the scores and logs showed
  - ROOT_CAUSES:       list of A-F classifications with specifics
  - RECOMMENDED_CHANGES: specific edits to specific files
  - ESTIMATED_IMPACT:  how much the score should improve
```

### Step 4: Hand Off To IMPROVE-WORKFLOW
If ROOT_CAUSES contains any A-E:
→ Run IMPROVE-WORKFLOW.md with this evaluation report as input

---

---

# Meta-Task: Improve A Workflow
# _system/meta/IMPROVE-WORKFLOW.md
#
# Applies changes to workflow files based on evaluation findings.
# Never run this without a completed evaluation report as input.

---

## Never

```
✗ Do not change a workflow without a completed evaluation report
✗ Do not make changes not supported by the evaluation findings
✗ Do not change WORKFLOW.md structure without considering downstream
  effects on all TASK.md files that reference it
✗ Do not remove output contract fields — only add or clarify
```

---

## Instructions

### Step 1: Read Evaluation Report
Load the evaluation report from `_meta/evaluation-[date].md`

### Step 2: For Each Recommended Change
Classify the change type:
```
INSTRUCTION_CLARIFICATION → edit the relevant TASK.md instructions section
OUTPUT_CONTRACT_ADDITION  → add field to output contract (never remove)
EXAMPLE_ADDITION          → add or improve the example output in TASK.md
SEQUENCE_CHANGE           → update WORKFLOW.md dependency graph + affected TASKs
RUBRIC_CALIBRATION        → update quality-scores.md rubric
NEGATIVE_CONSTRAINT       → add to NEVER section of relevant TASK.md
```

### Step 3: Apply Changes
Make each change. For each:
- Write a one-line comment above the change:
  `<!-- IMPROVED [date]: [why this was added] — triggered by run [date] score [N] -->`

### Step 4: Verify The Changes Make Sense
Re-read the entire workflow top to bottom after changes.
Does it still flow logically?
Are there contradictions introduced?

### Step 5: Commit And Log
```
Commit message: chore(workflows): improve [workflow-name] — [what changed]

Add to _meta/quality-scores.md Derived Improvements section:
[DATE] — [file changed] — [what changed] — [triggered by: run date, score]
```

### Step 6: Update MANIFEST.md
If the workflow's average quality score has changed materially,
update the QUALITY SCORE field in MANIFEST.md.
