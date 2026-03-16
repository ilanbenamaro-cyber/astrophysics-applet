# Meta-Task: Create A New Workflow
# _system/meta/CREATE-WORKFLOW.md
#
# Execute this after completing any novel multi-step task that has no
# existing workflow. This is how the workflow library grows automatically.

---

## Trigger Condition

A task was completed using the reasoning protocol with no matching workflow
in MANIFEST.md.

---

## Instructions

### Step 1 — Reconstruct The Task As A Workflow

Review what you just did. Extract the pattern:

```
QUESTIONS TO ANSWER:
- What was the trigger for this task? (what user statement maps to it)
- What inputs were required?
- What was the natural sequence of steps?
- What did each step need as input?
- What did each step produce as output?
- What could have gone wrong at each step?
- What would success look like for this workflow overall?
```

### Step 2 — Create The Workflow Directory

```
.workflows/<workflow-name>/
  WORKFLOW.md
  tasks/
    01-<first-step>/
      TASK.md
      _outputs/       ← empty dir, created for future runs
    02-<second-step>/
      TASK.md
      _outputs/
    [... for each step ...]
  _log/               ← empty dir, created for future runs
  _meta/
    quality-scores.md ← initialize with first run's score
```

Naming convention: `<verb>-<noun>` in kebab-case. Examples:
- `feature-development`, `bug-fix`, `security-audit`, `write-tests`

### Step 3 — Write WORKFLOW.md

Use this template:
```markdown
# Workflow: [Name]
# Trigger: [exact condition that should invoke this workflow]

## Goal
[One paragraph. What does this workflow produce and why does it matter?]

## Inputs Required
[List. What must exist before this workflow can start?]

## Task Sequence
[Dependency graph or ordered list]
Sequential: 01 → 02 → 03 → ...
Parallel:   01-A ──┐
                    ├──→ 03
            01-B ──┘

## Tools Available
[List MCPs, bash commands, file access scope]

## Tools Explicitly Unavailable
[Anything that should be blocked for safety/scope reasons]

## Output Contract
[What the workflow produces, where it writes it, what format]

## On Failure
[What to do if any task fails — checkpoint, recovery instructions]

## Quality Rubric
[Scoring criteria — must be ≥50% objectively verifiable]
```

### Step 4 — Write Each TASK.md

Use this template for every task:
```markdown
# Task: [Name]
# Part of: [workflow name]

## Inputs
[What this task reads — file paths, outputs from prior tasks]

## Instructions
[Precise steps. Use numbered list for sequence-dependent actions.]
[Include NEGATIVE constraints: what NOT to do in this specific task]

## Example Output
[One concrete example of a high-quality output for this task]
[This is the most important section for output consistency]

## Output Contract
File: [exact path]
Required fields:
  - FIELD_NAME: type (constraints)
  - FIELD_NAME: type (constraints)
Validation: Claude verifies output matches contract before proceeding.

## Confidence Gate
If confidence is LOW on any element of this task's output:
[specify: pause and ask | flag and proceed | escalate to user]

## On Failure
[specific recovery steps for this task]

## Never (Task-Specific)
[constraints specific to this task, not just global rules]
```

### Step 5 — Initialize Quality Scores

Write to `.workflows/<name>/_meta/quality-scores.md`:

```markdown
# Quality Scores — [Workflow Name]

## Scoring Rubric
[Objective criteria — 0 to N points each]
[Subjective criteria — labeled as subjective]
MAX: [total]

## Run Log
| Date | Score | Input Summary | What Went Well | What Failed | Improvements Made |
|------|-------|---------------|----------------|-------------|-------------------|
| [today] | [score] | [brief] | [brief] | [brief] | — |

## Derived Improvements
<!-- Claude adds entries when workflow is modified based on scores -->
<!-- Format: [DATE] — [what changed in workflow] — [triggered by score issue] -->
```

### Step 6 — Update MANIFEST.md

Add entry to `.workflows/_system/MANIFEST.md`:
```markdown
### [workflow-name]
TRIGGER:        [condition]
INPUT:          [what it needs]
OUTPUT:         [what it produces]
AVG DURATION:   [estimate]
LAST RUN:       [today's date]
QUALITY SCORE:  [first run score]/10
PATH:           ../[workflow-name]/WORKFLOW.md
```

### Step 7 — Commit

```
chore(workflows): add [workflow-name] workflow

Derived from [date] session completing [task description].
First run quality score: [X]/10.
```
