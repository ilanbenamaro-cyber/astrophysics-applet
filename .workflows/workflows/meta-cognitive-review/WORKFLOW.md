# Workflow: Meta-Cognitive Review
# Trigger: Quarterly. Also triggered manually when the system feels wrong
#          or workflows are consistently scoring below 8.0.

---

## Goal

This is the system examining its own assumptions — not its execution quality.

Every other workflow asks: "how can we do this better?"
This workflow asks: "should we be doing this at all, and is our structure
for thinking about it correct?"

This workflow does not improve existing workflows.
It produces a proposal for restructuring the system itself.

---

## The Core Question

After running for N months, the workflow structure reflects how you
thought about the problem when you designed it. That thinking had gaps.
Experience has revealed better decompositions, missing workflows,
and workflows that are solving the wrong problem entirely.

This review surfaces all of that and proposes a new structure.
It does not implement the new structure — it proposes it.
Human approval required before any structural changes.

---

## Task Dependency Graph

```
01-examine ──→ 02-propose
```

---

## What This Is NOT

```
✗ Not a quality check on individual workflow runs
✗ Not a bug fix for workflows that fail
✗ Not an optimization of existing task sequences
   (that's IMPROVE-WORKFLOW.md)
```

## What This IS

```
✓ A structural audit: is the system organized correctly?
✓ A completeness audit: what workflows are missing?
✓ A relevance audit: what workflows should be retired?
✓ A decomposition audit: are tasks split at the right level?
✓ An assumption audit: what did we assume when building this
  that experience has shown to be wrong?
```

---

## Output Contract

```
□ Examination report written (task 01)
□ Restructuring proposal written (task 02)
□ Proposal presented to user — NOT implemented without approval
□ Run log written
```
