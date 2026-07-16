# VLBI SIMULATOR — RECOVER-DETAIL FREEZE + INVERT STRESS TEST
# Opus or Fable · Plan Mode · ultrathink/max effort · frontend-design skill ON
# Run from the astrophysics-applet repo. Base: main (deployed).
# PHASE 1 IS DIAGNOSIS. Confirm the freeze's root cause before prescribing the fix.

## WHY THIS PASS EXISTS
Two issues in the recently-shipped custom-source features:
1. THE FREEZE (serious): in the "how much detail can this array recover?" panel,
   changing the telescope array (the 2017 → 2022 → ngEHT → +BHEX ladder) makes the
   ENTIRE SITE glitch and freeze. Confirmed behavior: each array step recomputes
   IMMEDIATELY on click.
2. INVERT (verify): the Invert-brightness control needs a real stress test — we kept it
   deliberately (it's a legitimate emission-polarity control), so confirm it's actually
   robust, not just simple-looking.

STRONG HYPOTHESIS for the freeze (confirm, don't assume): the ladder runs reconstruction
SYNCHRONOUSLY ON THE MAIN THREAD, or fires a CASCADE of reconstructions per click, so a
heavy CLEAN/MEM (measured: CLEAN ~98 ms, MEM ~2,350 ms; worse at the large custom FOVs
this panel uses) blocks the UI thread and the page locks until it finishes — or loops.
The app's normal reconstruction path is ASYNC via the worker with a debounce + spinner
(useSimulation.js:187–208). The ladder likely bypasses that. But a freeze can also be an
infinite render loop (state → recompute → state) or workers spun up without disposal —
so MEASURE which it is first.

<invariants>
vlbi-react/ only; worker.js classic + zero imports (diff must stay EMPTY). Black-hole/
ring path byte-identical (CLEAN 2154452775 / Dirty 1389367993). All frozen anchors +
per-target θ + max baseline + fill + dish means intact. The corrected custom-source
physics (own-scale, the true detail→high-frequency→elements teaching, the 1/FOV² optimum)
stays correct — this pass fixes PERFORMANCE/STABILITY, not the physics. Public Tour
signature, autoActions, App.js wiring unchanged. Verify on a NEVER-USED port. Commit per
item; PAUSE before push.
</invariants>

═══════════════════════════════════════════════════════════════════════════
PHASE 1 — DIAGNOSE THE FREEZE  (measure the real cause; change nothing yet)
═══════════════════════════════════════════════════════════════════════════
Read the recover-detail panel's code and its array-change handler. Determine EXACTLY
what one array-step click triggers. Instrument and REPORT:
  1.1 Is reconstruction SYNCHRONOUS on the main thread, or async via the worker? If a
      CLEAN/MEM runs inline in the click handler / a render path, that alone explains the
      freeze. Report the call path (handler → reconstruct → where it runs).
  1.2 How MANY reconstructions does one array change fire? One? All ladder rungs at once
      (2017+2022+ngEHT+BHEX = several heavy CLEANs back-to-back)? Does a state update
      retrigger the effect (a render loop)? Count them.
  1.3 What METHOD + FOV does the panel use? MEM at a large custom FOV (2,350 ms × N) would
      freeze hard. Report method, FOV, N, and the measured per-reconstruction cost in
      this panel specifically.
  1.4 Worker lifecycle: does each recompute spin up a Worker? Are they terminated? Check
      for leaked workers / GL contexts across repeated array changes (memory growth →
      eventual hang).
  1.5 Reproduce and time it: click through the ladder, record where the main thread
      blocks and for how long, and whether it recovers or hangs permanently.
  DELIVERABLE: a short diagnosis (in the commit message or appended to SITE-AUDIT.md):
  the exact cause (sync-main-thread / cascade / render-loop / worker-leak), with the
  measured evidence. STOP and state the cause before Phase 2's fix.

═══════════════════════════════════════════════════════════════════════════
PHASE 2 — FIX THE FREEZE  (fix-if-clean; explicit fallback to simplify/cut)
═══════════════════════════════════════════════════════════════════════════
Ilan's directive: FIX IT IF THE FIX IS CLEAN; if the fix proves fragile, he is open to
reworking or removing the ladder. Choose based on Phase 1:

  PATH A — CLEAN FIX (preferred if the cause is sync/cascade, which is very fixable):
    • Route the panel's reconstruction through the SAME async worker path the main app
      uses (runReconstruction / the worker) so it NEVER blocks the UI thread. Show the
      existing spinner/loading state while it computes.
    • DEBOUNCE / SERIALIZE: one array change = at most one reconstruction; cancel or
      ignore in-flight computes when the user steps again (latest-wins), so rapid ladder
      clicks don't pile up. No recompute fires on intermediate/transient state.
    • Kill any render loop: the reconstruction result must not retrigger the effect that
      launched it (stable deps, guard the effect).
    • Reuse/serialize the worker rather than spawning uncontrolled instances; terminate
      on unmount / panel close (no leak across repeated changes).
    • Consider precomputing or caching the ladder rungs (the sweep already measured them)
      so stepping the array is instant playback of cached real results rather than a live
      CLEAN each time — if that's cleaner than live async, prefer it (it's still real
      engine output, just cached). Method choice: if the panel uses MEM, switch to CLEAN
      (or cached) — MEM at large FOV is the worst case and unnecessary for the teaching
      point.

  PATH B — REWORK LIGHTER (if live recompute is inherently fragile here):
    Keep the LESSON (add elements → detail returns; the 1/FOV² optimum) but make it
    lightweight — e.g. precomputed/cached reconstructions per array rung shown as
    instant image swaps, no live compute on click at all. The teaching is identical; the
    cost goes to zero.

  PATH C — REMOVE (only if A and B are both fragile/not worth the complexity):
    Remove the array-ladder affordance from the panel. KEEP the corrected physics copy
    (detail → high frequencies → baselines/elements, the computed N_res/beam/fill, the
    1/FOV² optimum) — that teaching stays; only the interactive ladder goes. The panel
    still teaches the right lesson statically.

  Whichever path: the site must NEVER freeze on an array change or a rapid sequence of
  them. That is the acceptance bar.

═══════════════════════════════════════════════════════════════════════════
PHASE 3 — STRESS TEST THE INVERT SYSTEM
═══════════════════════════════════════════════════════════════════════════
Exercise Invert across the full matrix and fix anything found:
  • Invert ON/OFF × {black-hole source, WFU seal, uploaded custom image} × {EHT 2017,
    2022, ngEHT} × {±BHEX} × {single mode, compare mode} × {small + large "Image size on
    sky"} × rapid toggling.
  • Verify: Invert reconstructs live without freezing (same async discipline as Phase 2 —
    if Invert also recomputes synchronously, fix it the same way); the inverted result is
    correct (emission polarity actually flips); it interacts correctly with the size
    control and the array ladder (no stale/mismatched state); it never leaks state
    between compare panes; label stays neutral ("Invert (dark ink → emission)", no
    DC/zero-spacing language).
  • Confirm Invert on the RING source doesn't corrupt the byte-identical ring path (it
    shouldn't apply, or applies harmlessly — verify hashes).
  Catalog any defect; fix in-scope.

═══════════════════════════════════════════════════════════════════════════
GATES  (binary; never-used port; single + compare)
═══════════════════════════════════════════════════════════════════════════
  G1  Freeze diagnosed with measured evidence (cause named); the recover-detail panel
      NEVER freezes/glitches on array change or rapid array-stepping (Path A/B/C).
  G2  If the ladder is kept: reconstruction is async (UI never blocks), debounced/latest-
      wins, no render loop, no worker/GL leak across repeated changes; spinner shows.
  G3  Invert stress matrix passes: live, correct polarity, no freeze, no compare-pane
      leak, correct interaction with size + array; neutral label; never breaks the ring.
  G4  Ring byte-identical (hashes, twice, fresh ports); frozen anchors/θ/baseline/fill/
      dish intact; worker diff EMPTY; corrected custom-source physics unchanged.
  G5  Zero console errors across the full matrix; tour untouched; reduced-motion static;
      no memory growth across repeated array/Invert changes.

═══════════════════════════════════════════════════════════════════════════
SHIP
═══════════════════════════════════════════════════════════════════════════
Commit per item (diagnosis → freeze fix → Invert fixes). Update knowledge (gotchas.md:
the freeze root cause — heavy reconstruction must never run synchronously on the main
thread; always async worker + debounce; SITE-AUDIT.md; decisions.md if the ladder was
reworked/cut). /sync. Merge to main and PAUSE for Ilan's "push" — present the gate ledger
and which path (A/B/C) was taken and why.

## STARTING INSTRUCTION
Do PHASE 1 first: reproduce the freeze, instrument the array-change handler, and REPORT
THE MEASURED CAUSE before touching anything. Then recommend Path A/B/C with reasoning and
present the plan.
