# VLBI SIMULATOR — PUBLIC REPO CLEANUP  (safe: no history rewrite, no force-push)
# Opus · Plan Mode · ultrathink · frontend-design skill for the README polish
# Run from the astrophysics-applet repo. Base: main. This repo is about to be displayed
# PUBLICLY. Job order: SAFETY SCAN → working-tree cleanup → README → verify → normal push.

<hard_safety_rules>
ABSOLUTE — violating any of these fails the pass:
  • DO NOT rewrite git history. No rebase, no squash, no filter-branch/filter-repo, no
    amending old commits, no `git reset` that discards commits. History stays intact.
  • DO NOT force-push. Only a normal `git push` of new commits, and only after Ilan's go.
  • DO NOT delete anything from git HISTORY. This pass changes the WORKING TREE only.
  • DO NOT touch vlbi-react/ application code, physics, the worker, or tourPhysics — this
    is repo hygiene, not a code change. Ring path / anchors must stay byte-identical
    (they won't be touched at all).
  • Every deletion is of an untracked/scratch artifact or a deliberate move — list them
    for Ilan before removing; nothing surprising vanishes.
  • Back up nothing destructive happens, so no backup needed — but confirm `git status`
    is clean and history is unchanged at the end (same commit count + hashes for all
    existing commits; only NEW commits added).
</hard_safety_rules>

<invariants>
vlbi-react/ app code untouched. Keep the .workflows/ prompts + knowledge docs PUBLIC
(Ilan's decision — they show how it was built and are an asset). Full git history
preserved. Normal push only, after approval. Verify the live site still deploys
unchanged (this is a docs/hygiene pass; GitHub Pages output must be identical).
</invariants>

═══════════════════════════════════════════════════════════════════════════
PHASE 1 — SAFETY & SECRETS SWEEP  (do this FIRST; a public repo demands it)
═══════════════════════════════════════════════════════════════════════════
Before any cosmetic change, scan the ENTIRE repo — working tree AND full history — for
anything that must not be public. Report findings; do NOT auto-purge history (that would
require a rewrite, which is forbidden) — instead, SURFACE anything sensitive to Ilan with
options, because a secret in history needs a deliberate decision.
  1.1 Secrets/credentials: API keys, tokens, passwords, .env files, private keys,
      service credentials — scan tracked files, untracked files, AND `git log -p`
      history. Report any hit with file + commit.
  1.2 Personal/local leakage: absolute paths with the username (e.g.
      /Users/ilanamaro/...), the git committer identity fallback
      (ilanamaro@Ilans-MacBook-Air.local — already flagged), any email/handle Ilan may
      not want public, machine names.
  1.3 Anything embarrassing or out-of-place: TODO/FIXME with sensitive context, debug
      dumps, commented-out credentials, internal URLs.
  DELIVERABLE: a findings list. If NOTHING sensitive is found (likely — a PreToolUse
  secret scanner has been active), say so explicitly. If something IS in history and must
  go, STOP and present Ilan the options (he decided against history rewrite, so this is a
  conscious re-decision only if a real secret is found). Do not rewrite history to remove
  something without his explicit re-approval.

═══════════════════════════════════════════════════════════════════════════
PHASE 2 — WORKING-TREE CLEANUP  (tidy what a visitor sees; reversible)
═══════════════════════════════════════════════════════════════════════════
  2.1 .gitignore: add/complete a proper .gitignore for this stack (node_modules, .next,
      OS cruft like .DS_Store, editor dirs, local server artifacts, .playwright-mcp/
      scratch if it's not meant to be tracked, /mnt or _tmp scratch). For anything
      currently TRACKED that should be ignored going forward, `git rm --cached` it (keeps
      the local file, stops tracking) — this is a new commit, not a history edit.
  2.2 Scratch/artifact removal (working tree): list then remove genuine scratch —
      .workflows/_tmp/ screenshot dumps, montage JPEGs no longer needed, stray test
      outputs, dead files. KEEP: .workflows/_prompts/, _system/, _knowledge/, _shared/
      (the handoff/queue) — those are the public "how it was built" story Ilan wants
      shown. When unsure whether something is scratch vs. keeper, ASK — don't guess.
  2.3 Structure: ensure the repo reads clearly — the app in vlbi-react/, the process docs
      in .workflows/, a clear top level. Don't reorganize aggressively; just make sure
      nothing looks accidental. Note (don't fix without asking) if the root app vs
      vlbi-react/ split would confuse a visitor.
  2.4 Prompt files: the 5 untracked .workflows/_prompts/*.md — since Ilan wants them
      public, `git add` them so they're tracked and visible (they've been riding
      untracked). Confirm with Ilan they should all be committed.

═══════════════════════════════════════════════════════════════════════════
PHASE 3 — THE README  (the thing visitors actually judge the repo by)
═══════════════════════════════════════════════════════════════════════════
Write a strong top-level README.md (frontend-design sensibility for structure/clarity;
it's the front door). It should make a technical visitor immediately get what this is and
why it's impressive. Include:
  • What it is: a research-grade VLBI interferometry simulator + guided tour — real
    aperture-synthesis math (real u,v sampling, CLEAN/MEM deconvolution in a Web Worker),
    reconstructing astronomical images from sparse radio-telescope arrays. Built with
    physics guidance from Prof. Alejandro Cárdenas-Avendaño; coordinate validation input
    from Dan Marrone (EHT).
  • A live link (the GitHub Pages URL) and ideally a screenshot or two (use existing
    montages/screenshots if suitable — check they're not scratch being deleted in 2.2).
  • The science, briefly and correctly: what VLBI/aperture synthesis is, the M87*
    context (42 μas shadow, EHT), what the simulator actually computes. Pull the real
    numbers from the knowledge files — do NOT invent; keep the frozen anchors correct
    (10,883 km / 25 μas / 42 μas / 2√27).
  • The two regimes worth highlighting: the guided engine-real tour, and the interactive
    tool (arrays, targets, BHEX, custom images with their own angular scale + the
    detail↔elements teaching).
  • Tech: React + htm + Three.js, no bundler, Web Worker for the FFT/deconvolution.
  • A pointer to .workflows/ for the curious: "development notes, prompts, and physics
    decision records live in .workflows/ — this project was built iteratively with AI
    assistance and expert physics review." Frame the process as a feature.
  • Honest credits + license (add a LICENSE if none exists — ASK which license Ilan
    wants; don't pick one silently).
  Accuracy over hype: every physics claim must be correct and match the app. A physicist
  will read this.

═══════════════════════════════════════════════════════════════════════════
GATES
═══════════════════════════════════════════════════════════════════════════
  G1  Secret/PII sweep done (tree + history); findings reported; nothing sensitive
      remains in the WORKING TREE; anything in history surfaced to Ilan, not silently
      rewritten.
  G2  git HISTORY UNCHANGED: every pre-existing commit has the same hash; only new
      commits added; no force-push; `git log` shows the full story intact.
  G3  .gitignore proper; scratch artifacts removed from the tree (listed before removal);
      .workflows/ prompts + knowledge kept and now tracked.
  G4  README is accurate (physics correct, anchors intact, live link works), clear, and
      makes the repo legible + impressive to a technical visitor; LICENSE added per Ilan's
      choice.
  G5  vlbi-react/ app code, physics, worker, tourPhysics UNTOUCHED; the live GitHub Pages
      site deploys identically (hygiene pass only); zero app changes.

═══════════════════════════════════════════════════════════════════════════
SHIP
═══════════════════════════════════════════════════════════════════════════
Commit the cleanup as normal new commits (e.g. "chore: gitignore + remove scratch
artifacts", "docs: add README + LICENSE", "chore: track workflow prompts"). Update
knowledge if relevant. Then PAUSE and present to Ilan: the secret-sweep findings, the
list of removed files, the README for review, and confirmation history is intact. Push
only on his "push" (normal push, no force).

## STARTING INSTRUCTION
Do PHASE 1 (secret/PII sweep of tree AND history) FIRST and report findings before
touching anything. Then present the cleanup plan + the proposed removed-files list + a
README draft for approval. Make NO history-altering operation and NO force-push at any
point.
