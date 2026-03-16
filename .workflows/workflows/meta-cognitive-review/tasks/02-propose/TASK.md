# Task 02: Propose
# Workflow: meta-cognitive-review
# Purpose: Convert examination findings into a structured restructuring proposal

---

## Inputs

- `../01-examine/_outputs/examination.md` — all findings

---

## Never

```
✗ Do not implement any proposals — this task produces a document, not changes
✗ Do not propose changes without a direct link to an examination finding
✗ Do not propose changes just because they seem clever or elegant
✗ Do not underestimate effort — honest sizing prevents abandoned improvements
```

---

## Instructions

### Step 1: Triage Findings By Type

Group all findings from examination.md:
```
GROUP A: Missing workflows (patterns observed with no workflow)
GROUP B: Decomposition issues (tasks that need splitting or merging)
GROUP C: Failed assumptions (system behaving differently than designed)
GROUP D: Friction points (elements with cost but no observable value)
GROUP E: What's working (do not propose changes to these)
```

### Step 2: Write Proposals

For each finding that warrants a change, write a structured proposal:

**New Workflow Proposal:**
```markdown
### PROPOSAL-001: Create [workflow-name] Workflow
TYPE: New workflow
TRIGGERED_BY: [specific finding from examination — quote it]
PROBLEM BEING SOLVED: [what keeps happening without this workflow]
ROUGH STRUCTURE:
  - Task 01: [name] — [what it does in one sentence]
  - Task 02: [name] — [what it does]
  [...]
ESTIMATED_EFFORT: Small (1-2 hours) | Medium (half day) | Large (full day)
PRIORITY: NOW | NEXT_QUARTER | BACKLOG
SUCCESS_METRIC: [how will we know this proposal worked after implementation]
```

**Decomposition Change Proposal:**
```markdown
### PROPOSAL-002: [Split|Merge] [task] in [workflow]
TYPE: Decomposition change
TRIGGERED_BY: [finding]
CURRENT PROBLEM: [what goes wrong with current structure]
PROPOSED STRUCTURE: [exactly what it becomes]
ESTIMATED_EFFORT: Small | Medium | Large
PRIORITY: NOW | NEXT_QUARTER | BACKLOG
```

**System Behavior Proposal:**
```markdown
### PROPOSAL-003: [Description]
TYPE: Assumption fix | Friction removal | Process change
TRIGGERED_BY: [finding]
FAILED ASSUMPTION: [what we assumed that wasn't true]
PROPOSED FIX: [specific change to CLAUDE.md, MANIFEST, or workflow file]
ESTIMATED_EFFORT: Small | Medium | Large
PRIORITY: NOW | NEXT_QUARTER | BACKLOG
```

### Step 3: Prioritize All Proposals

Rank by: (impact if done) × (cost of not doing it) ÷ (effort)

High-impact, low-effort proposals go first regardless of category.

### Step 4: Write Defer List

Some valid proposals shouldn't be done now. Capture them explicitly:
```
DEFERRED: [proposal title]
REASON: [too speculative | too much churn right now | blocked by X]
REVISIT: [when to reconsider]
```

### Step 5: Write The User-Facing Section

This is what Ilan actually reads. Clean, no jargon, honest.

```markdown
## Proposed System Changes

After reviewing [N] months of workflow usage, here's what I think should change:

**Do now:**
[2-3 highest priority proposals in plain language]

**Do next quarter:**
[lower priority items]

**Deferred:**
[what's being consciously skipped and why]

The most important change is [PROPOSAL-X] because [reason].
Which of these would you like to implement?
```

---

## Output Contract

```
File: ./_outputs/proposal.md
Required sections:
  - PROPOSALS:              all proposals using templates above
  - PRIORITY_RANKING:       ordered list of all proposals with rationale
  - DEFER_LIST:             explicit deferred items
  - USER_FACING_SECTION:    clean summary written for the developer

Validation:
  □ Every proposal traces to a specific finding in examination.md
  □ Every proposal has ESTIMATED_EFFORT and PRIORITY
  □ USER_FACING_SECTION is present and readable without technical context
  □ DEFER_LIST is present (NONE is valid — omission is not)
```

---

## After Proposal Is Written

```
1. Present USER_FACING_SECTION to user — not the full proposal document
   Full document is available at ./_outputs/proposal.md if they want detail

2. Wait for user input on which proposals to implement

3. When approved: implementation happens via the appropriate workflow
   New workflows → CREATE-WORKFLOW meta-task
   CLAUDE.md changes → direct edit + changelog entry
   Workflow changes → IMPROVE-WORKFLOW meta-task

4. Write run log: ../../_log/<YYYY-MM-DD>-run-001.md
5. Update ../../_meta/quality-scores.md
```
