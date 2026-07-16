# VLBI SIMULATOR — THREE SMALL POST-DEPLOY FIXES
# Opus or Fable · Plan Mode · ultrathink · frontend-design skill ON
# Run from the astrophysics-applet repo. Small surgical pass — three isolated changes,
# no physics values touched. Read this whole file + the relevant files before planning.
# Base: main (deployed, e6b5ad0). Work on a short-lived branch, verify, merge, push.

<scope_and_invariants>
Three isolated fixes. NONE changes a physics value or computation. vlbi-react/ only;
worker.js untouched (diff must stay empty); tourPhysics.js values untouched. Frozen
anchors intact (10,883 / 25 μas / 42 μas / 2√27). Public Tour signature, autoActions,
App.js wiring unchanged. Verify on a NEVER-USED port (stale-module gotcha). Commit per
fix; this ends with a push to main (public deploy) after your go.
</scope_and_invariants>

═══════════════════════════════════════════════════════════════════════════
FIX 1 — REMOVE THE BHEX "PENDING SIGN-OFF" MARKER  (approved; framing stays)
═══════════════════════════════════════════════════════════════════════════
Marrone/Alejandro have APPROVED the BHEX framing. Remove ONLY the "pending sign-off"
marker wherever it appears. DO NOT change the physical relation — it STAYS as
"characteristic ~ R⊕ + h" because that is the physically honest framing (the relation
is genuinely characteristic, not an exact equality); approval clears the sign-off gate,
it does NOT upgrade the relation to an equality.

  • Grep the codebase for every occurrence of the pending hedge — the exact phrase and
    its variants: "pending sign-off", "pending", "Marrone/Alejandro", the ⚠ marker tied
    to BHEX. It was single-sourced but appears in a few surfaces (Act E card/caption/
    equation-status row, tourPhysics string, any StatusBar/BHEX note). Find ALL of them.
  • REMOVE the "pending sign-off" / ⚠ marker in each.
  • KEEP the relation text: "characteristic ~ R⊕ + h" (or the existing exact wording of
    the characteristic framing) stays verbatim, just without the pending clause.
  • If the pending clause is single-sourced in tourPhysics (e.g. P.str.bhexHedge),
    edit the source string so all surfaces update together; verify each rendered surface.
  • Do NOT state B = R⊕ + h as an equality anywhere. The "~ characteristic" framing is
    deliberate and stays.
  Verify: Act E and any StatusBar BHEX note read as the confident characteristic relation
  with no "pending" language; the ~ (characteristic, not =) is preserved everywhere.

═══════════════════════════════════════════════════════════════════════════
FIX 2 — COMPARE MODE: START MORE ZOOMED OUT + BHEX TOGGLE PER PANE
═══════════════════════════════════════════════════════════════════════════
2a — ZOOM: compare mode's Earth/globe starts too zoomed in. Set the compare-mode
  initial camera/scale to start MORE ZOOMED OUT, so both panes show the full array
  comfortably from the start. This is a default view/scale change only — no change to
  the UV computation or any physics. Match the two panes to each other. Pick a
  zoom level that frames the whole Earth + array with margin; confirm it's the initial
  state (not something the user must adjust to).

2b — BHEX TOGGLE IN COMPARE MODE: add the SAME BHEX on/off toggle that exists in single
  mode (the N2 toggle) to compare mode — one per pane, so each pane can independently
  show its preset with or without BHEX. Reuse the existing toggle component + the
  handleToggleBHEX path; do NOT rebuild it. Compare mode stays preset+BHEX only (no
  individual telescope placement — the B3 rule holds). Confirm the two compare workers
  (App.js:21–22) each honor their pane's BHEX state independently and neither leaks.
  Default: match single mode's default (BHEX off) unless the pane's preset implies
  otherwise — confirm and preserve current default behavior.
  Verify: each compare pane has a working BHEX toggle; toggling one pane doesn't affect
  the other; placement still disabled; both panes reconstruct correctly with BHEX on/off.

═══════════════════════════════════════════════════════════════════════════
FIX 3 — TOUR TEXT LOADS SCROLLED TO THE TOP, NOT THE MIDDLE
═══════════════════════════════════════════════════════════════════════════
When a tour act (slide) loads, its scrollable text panel appears scrolled to the middle
of the text instead of the start. FIX: on act mount / act change, reset the text panel's
scroll position to the TOP (scrollTop = 0) so every act begins reading at the first line.
  • Diagnose: the scrollable prose container isn't resetting scrollTop when the act
    changes (likely the container persists across acts, or content swaps without a scroll
    reset). Reset on act entry — every act, both guided and presenter modes.
  • Ensure it fires AFTER the new act's text renders (so it resets to the new content's
    top, not the old). The pinned equation/hedge outside the scroller is unaffected.
  Verify: advance through all five acts; each one's text panel starts at the first line,
  every time, in both modes.

═══════════════════════════════════════════════════════════════════════════
GATES  (binary, verified on a never-used port, both tour modes)
═══════════════════════════════════════════════════════════════════════════
  G1  No "pending sign-off" / ⚠-pending language anywhere; "characteristic ~ R⊕ + h"
      framing preserved verbatim; the relation is NOT stated as an equality.
  G2  Compare mode starts zoomed out (full array visible both panes from load); each
      pane has an independent working BHEX toggle; placement still disabled; workers
      don't cross-leak; both panes reconstruct with BHEX on/off.
  G3  Every tour act's text panel loads scrolled to the top, both modes, all five acts.
  G4  No physics values changed (frozen anchors intact; per-target θ, max-baseline, fill
      all unchanged); worker diff EMPTY; live app + tour reconstruct unchanged; zero
      console errors.

═══════════════════════════════════════════════════════════════════════════
SHIP
═══════════════════════════════════════════════════════════════════════════
Commit per fix (3 commits). Then update knowledge (decisions.md: BHEX approved, hedge
removed, framing retained; codebase.md: compare BHEX toggle; gotchas.md: tour scroll-
reset), /sync. Merge to main and PAUSE for Ilan's "push" — present the gate ledger, then
push on his word (public deploy, ~60s).

## STARTING INSTRUCTION
Grep for every BHEX pending-marker occurrence first and list them. Then present the
plan for all three fixes. Execute per fix, verify each on a never-used port, and pause
before the push.
