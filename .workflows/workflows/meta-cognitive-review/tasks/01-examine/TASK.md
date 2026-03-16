# Task 01: Examine
# Workflow: meta-cognitive-review
# Purpose: Systematic structural audit of the entire workflow system

---

## Never

```
✗ Do not propose solutions in this task — examine only
✗ Do not defend existing structures — examine them honestly
✗ Do not skip workflows that seem fine — examine all of them
```

---

## Examination Protocol

### 1. Workflow Inventory
List every workflow in .workflows/. For each:
```
□ What problem does it solve?
□ How many times has it run? (from run logs)
□ Average quality score? (from _meta/quality-scores.md)
□ What is its most common failure mode?
□ Is it actually used, or was it created speculatively?
```

### 2. Completeness Audit
Review the last 90 days of work done in this project.
What tasks were performed WITHOUT a matching workflow?
Each of those is either:
- A missing workflow (should be created)
- A one-off that doesn't warrant a workflow

### 3. Decomposition Audit
For each workflow, examine its task breakdown:
```
□ Are the task boundaries at the right level?
   (tasks that are always done together → merge them)
   (tasks that sometimes need splitting → add subtask support)
□ Is any task doing two distinct things? (split it)
□ Is any task so small it adds overhead without value? (merge it)
□ Are output contracts actually being used to gate execution?
   Or are they decorative?
```

### 4. Assumption Audit
When this workflow system was designed, what assumptions were made?
Check each against observed reality:
```
□ "Claude will always read MANIFEST.md first"
   → Is this actually happening? (check session patterns)
□ "Quality scores will drive improvement"
   → Are scores improving over time?
□ "Knowledge files will stay current"
   → When were they last meaningfully updated?
□ "Subagents will be used for exploration"
   → Is this happening in practice?
```

### 5. Friction Points
What in the system creates friction without adding value?
```
□ Files that are maintained but never read
□ Output contracts so strict they're being worked around
□ Workflows so complex they're avoided
□ Naming or structure that causes confusion
```

---

## Output Contract

```
File: ./_outputs/examination.md
Required sections:
  - WORKFLOW_INVENTORY:    table with name, run count, avg score, status
  - MISSING_WORKFLOWS:     list of patterns observed without workflows
  - DECOMPOSITION_ISSUES:  list of tasks that need splitting or merging
  - FAILED_ASSUMPTIONS:    list of assumptions that didn't hold
  - FRICTION_POINTS:       list of system elements that aren't pulling weight
  - WORKING_WELL:          what the system gets right (honest assessment)
```

---

---

# Task 02: Propose
# Workflow: meta-cognitive-review
# Purpose: Concrete restructuring proposal based on examination findings

---

## Inputs

- `../01-examine/_outputs/examination.md`

---

## Never

```
✗ Do not implement any proposals — write proposals only
✗ Do not propose changes not supported by examination findings
✗ Do not propose changes just because they seem clever
   Every proposal must trace back to a specific finding
```

---

## Instructions

For each finding category in the examination, produce concrete proposals:

### For Missing Workflows
```
PROPOSAL: Create [workflow-name] workflow
TRIGGERED_BY: [finding in examination]
WHAT IT SOLVES: [specific problem observed]
ROUGH STRUCTURE: [3-5 sentences on what tasks it would have]
PRIORITY: NOW | NEXT_QUARTER | BACKLOG
```

### For Decomposition Issues
```
PROPOSAL: [Split|Merge] [task name] in [workflow]
TRIGGERED_BY: [finding]
CURRENT PROBLEM: [what's wrong with current structure]
PROPOSED CHANGE: [what the new structure looks like]
```

### For Failed Assumptions
```
FINDING: [assumption that failed]
IMPLICATION: [what this means for the system]
PROPOSAL: [structural change to address it]
```

### For Friction Points
```
PROPOSAL: Remove|Simplify [element]
TRIGGERED_BY: [finding]
RATIONALE: [why removing/simplifying improves outcomes]
```

---

## Output Contract

```
File: ./_outputs/proposal.md
Required sections:
  - PROPOSALS:           complete list as structured above
  - PRIORITY_RANKING:    ordered list of what to implement first + why
  - ESTIMATED_EFFORT:    for each proposal — Small|Medium|Large
  - DEFER_LIST:          proposals that are valid but not worth doing now

Final section: PRESENTATION TO USER
  Write this as a clean proposal to be read by the developer.
  No jargon. Clear rationale. Specific asks.
  End with: "Which of these would you like to implement?"
```
