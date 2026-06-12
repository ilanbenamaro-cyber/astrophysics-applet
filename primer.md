# primer.md — session handoff (2026-06-12, tour final pass)

## Where things stand
Branch `feature/tour-world-class-overhaul`, NOT yet merged to main. The FINAL major
pass (.workflows/_prompts/tour-final-pass-fable.md) is complete: 10 commits on top of
`fd79fa4`, all stages delivered.

- Commit 1  galaxy: vibrant multi-hue nebula (gold data layer still dominant)
- Commit 2  (chore) shared drawSliderControl/drawLegend/sparkline-3σ helpers
- Commits 3–7  S1.2–S1.6: exhaustive scrollable narratives + pinned equation;
  Act B continuous Earth spin + decoupled labeled HA/dec controls; Act C legible
  noise (live drag recompute, DR bar, component count, 3σ line, NOISE-LIMITED);
  Act D labeled scale-matched photo/reconstruction pairing (photoZoom); Act E
  station-colored arcs + legend
- Commit 8  ⚠ APP BEHAVIOR CHANGE (user-approved at pause gate): ring-fraction-
  corrected effectiveSourceFraction — the live app now reconstructs the TRUE 42 μas
  ring (was an ~18 μas blob). Sidebar: "Ring: 42 μas (52.5% of FOV, measured)".
- Commit 9  zero console errors (dead cloud layer + specular removed, bump → jsdelivr,
  favicon), off-token canvas colors → neutral, tour focus trap + focus-visible
- Commit 10  dead code (gaussConvolve, ~480 lines orphan tour.css) + knowledge sync

Stage 2 depth pass needed no changes (verified per act, post-galaxy). SITE-AUDIT.md
(.workflows/_system/) has every finding with fix/flag status.

## Open items (human)
1. MERGE to main when ready (push = live in ~60 s). Suggested: review commit 8's
   before/after first (t8-before-clean.png / t8-after-clean.png if kept, or re-run).
2. ⚠ Projector laptop: re-run the Act C CLEAN timing gate (gotchas.md) + a true 4K pass.
3. BHEX sign-off (Marrone/Alejandro) still pending — hedge intact in Act E.
4. Subagent spend limit was hit mid-session — parallel audit agents were replaced by an
   inline audit; /redteam ran inline (see final session report).

## Sharp edges discovered this session (gotchas.md has full entries)
- "Fresh port" for Playwright must be NEVER-USED on this machine (browser disk cache
  poisons reused localhost ports across sessions → mixed-version module loads).
- `.katex-display` (library-generated) must never be removed by orphan-class sweeps.
