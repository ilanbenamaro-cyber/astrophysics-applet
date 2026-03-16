# Workflow: Knowledge Review
# Trigger: Monthly. Also triggered when a decision is challenged or a
#          major refactor changes established patterns.

---

## Goal

The _knowledge/ directory accumulates truth over time. But codebases change.
Decisions made six months ago may be actively wrong today.
This workflow audits all knowledge files, identifies stale entries,
and either verifies or corrects them against the current codebase.

A stale knowledge file is worse than no knowledge file.
It tells Claude to follow patterns that no longer exist.

---

## Task Dependency Graph

```
01-audit ──→ 02-update
```

---

## Files Reviewed

```
.workflows/_knowledge/codebase.md
.workflows/_knowledge/decisions.md
.workflows/_knowledge/gotchas.md
.workflows/_system/DEVELOPER-PROFILE.md
.workflows/_system/ENVIRONMENT.md
```

---

## Output Contract

```
□ Every entry in decisions.md verified against current codebase
□ Stale entries marked STALE: [date] and updated or removed
□ codebase.md reflects current directory structure
□ gotchas.md cross-referenced with current code — resolved issues marked RESOLVED
□ DEVELOPER-PROFILE.md updated with any preference drift observed
□ Commit: chore(knowledge): monthly review — N entries updated, N marked stale
```
