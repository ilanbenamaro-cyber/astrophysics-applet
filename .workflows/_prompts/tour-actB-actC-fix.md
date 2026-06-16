# VLBI TOUR — ACT B + ACT C FIX PASS
# Opus or Fable · Plan Mode · ultrathink/max effort · frontend-design skill ON
# Run from the astrophysics-applet repo. Read this whole file, plus the Act B and Act C
# scene code and tourPhysics.js, before planning. Small, surgical pass — two acts only.

## SCOPE
The final pass landed; six enhancements are good. Two bugs remain, both isolated:
Act B's Earth rotation is slow/jerky, and Act C's CLEAN step appears broken when the
noise slider moves. Fix ONLY these two acts. Everything else (galaxy, narratives, Act
D/E, the app μas fix, audit cleanup) is DONE — do not touch it. Invariants from
decisions.md/gotchas.md still hold: vlbi-react/ only; worker.js classic/zero-imports;
tourPhysics.js single source of truth; numbers computed never literal; gold = live
computation; reduced-motion static; public Tour contract unchanged. Verify on a
NEVER-USED port (the stale-module gotcha from last session: "fresh port" = never used).

═══════════════════════════════════════════════════════════════════════════════
FIX 1 — ACT B: SMOOTH CONSTANT EARTH ROTATION (like the main globe)
═══════════════════════════════════════════════════════════════════════════════
SYMPTOM: the Earth's idle spin is too slow and jerky; the user wants constant rotation
like the main page's globe.

ROOT CAUSE (diagnose to confirm): the idle spin currently auto-advances the hour angle
with an eased pause/resume ramp on drag. The easing ramp + the HA-advance coupling +
whatever frame cadence is driving it produce the jerk and the sluggishness.

FIX (per the chosen design): KEEP the spin coupled to HA — the idle rotation continues
to advance the hour angle so the live u,v trace stays honest — but make that advance
CONSTANT, CONTINUOUS, and SMOOTH like the main globe:
  • Drive the rotation from a steady per-frame delta tied to elapsed time
    (delta = rate × dt using the RAF timestamp), NOT a fixed per-frame increment that
    stutters when frames vary. Pick a rate that reads as a calm, continuous spin
    (reference the main globe's rotation speed in Globe.js and match its felt pace).
  • Remove the jerk source: drop the eased pause/resume RAMP. When the user grabs the
    HA control, the idle advance simply yields to direct control; on release it resumes
    constant advance from the current HA — no easing curve, no visible catch-up snap.
  • The HOUR ANGLE track and DECLINATION slider stay as the explicit controls (those
    were fixed last pass and work); only the idle-spin behavior changes. The HA readout
    should update continuously as the idle spin advances it.
  • Confirm the u,v ellipse still updates live as HA advances (sub-ms; it already does).
  • Reduced motion: static final frame, no idle spin (unchanged rule).
VISION-VERIFY: the globe rotates at a constant, smooth pace with no stutter and no
slow-down; grabbing/releasing the HA control transitions cleanly with no snap; it feels
like the main page's globe.

═══════════════════════════════════════════════════════════════════════════════
FIX 2 — ACT C: ROOT-CAUSE THE CLEAN FAILURE, THEN REPLACE CONTROL WITH 3 PRESETS
═══════════════════════════════════════════════════════════════════════════════
SYMPTOM: text + UV coverage + dirty image all work. But moving the noise slider drives
the residual graph to "no components above 3σ — noise-limited" and the CLEAN image
looks broken/not working across much of the slider's range.

STEP 1 — DIAGNOSE FIRST (do not skip; the product change below may otherwise mask a
real bug). Last pass reported clean probes at 0 / 0.12 / 0.25× RMS, yet in use the CLEAN
output collapses to zero components across much of the range. Determine WHY:
  • Is the 0–0.25× RMS noise range pushing the source below the worker's 3σ CLEAN stop
    threshold (worker.js CLEAN loop) at most slider positions? If modest noise zeroes the
    component count, CLEAN is *correctly* finding nothing — physically honest, but it
    makes the act look dead. That is the likely root cause.
  • Confirm by logging, at a few noise levels: the dirty-image RMS, the 3σ threshold, and
    the CLEAN component count returned. Establish the noise level at which components → 0.
  • Rule out an actual regression in the Act C recompute path (the live-recompute-during-
    drag added last pass) vs. a legitimate noise-limited result. Report which it is.

STEP 2 — REDESIGN THE CONTROL (the requested product change):
  • REMOVE the noise slider entirely.
  • REMOVE the CLEAN residual sparkline/graph entirely (and the "noise-limited" readout
    tied to it). Grep for and delete the now-orphaned sparkline drawing + state.
  • REPLACE with THREE THERMAL-NOISE PRESETS as labeled buttons/segments. Per the chosen
    approach ("let the engine decide"): choose three noise levels — using the STEP-1
    findings — at which CLEAN VISIBLY SUCCEEDS, i.e. each preset produces a recognizable
    reconstruction, degrading gracefully across the three. Do NOT pick levels that land
    in the zero-component noise-limited regime. Label each preset HONESTLY by what it
    actually shows (e.g. the engine's real σ or a true descriptor of the recovered
    image), not by an invented scale. The labels must be truthful to the engine output.
  • Each preset recomputes via the real engine (runReconstruction, own worker) and
    renders the restored ring with drawHot (same as Act D — keep the legible colormap).
    Default to the cleanest preset on act entry so the act opens on a clear ring.
  • Keep the sparse→dirty→CLEAN left-to-right staging and the real numbers; only the
    control and the graph change.

STEP 3 — if STEP 1 reveals CLEAN is genuinely broken in the recompute path (not merely
noise-limited), FIX that too — the act must show a real working reconstruction at each
preset. The presets are not a way to hide a broken CLEAN; they are a cleaner control
over a working one.

VISION-VERIFY: each of the three presets shows a real, recognizable reconstructed ring
that degrades gracefully; no "noise-limited" dead state; no residual graph; the CLEAN
image is demonstrably working at every preset. Screenshot all three.

═══════════════════════════════════════════════════════════════════════════════
CONSTRAINTS & GATES
═══════════════════════════════════════════════════════════════════════════════
  • Touch only Act B and Act C scene code + any shared annotation helpers they own
    (remove orphaned sparkline code). Do not alter other acts, the galaxy, narratives,
    tourPhysics values, the worker (no new behavior; if CLEAN needs a fix it's in the
    Act C call path, not worker.js), or the app.
  • tourPhysics.js stays single source; preset noise levels derive from real engine
    quantities (× RMS / SEFD-driven), not magic numbers in the scene.
  • RAF cleanup intact; reset ctx.filter='none' after any blur; reduced-motion static.
  • Public Tour signature, autoActions, App.js wiring unchanged.
  • GATES (binary, vision-verified, both modes, never-used port):
    G1  Act B Earth spins constant + smooth (no jerk, no slow-down), main-globe-like;
        HA grab/release clean with no snap; HA readout + u,v ellipse update live.
    G2  Act C: slider gone, residual graph gone, three honest presets present.
    G3  Act C: all three presets render a real, recognizable, gracefully-degrading ring
        via the live engine; no dead/noise-limited state; CLEAN demonstrably works.
    G4  Diagnosis recorded: why CLEAN collapsed before (noise-range/3σ vs regression),
        in the commit message or a short note appended to SITE-AUDIT.md.
    G5  No orphaned code left (sparkline/slider state removed); zero console errors.
    G6  Nothing else changed: galaxy/narratives/Act A/D/E/app reconstruct unchanged;
        worker diff empty; Tour contract intact.

## COMMITS
  1. fix(vlbi-react): tour Act B — constant smooth HA-coupled Earth spin (no eased-ramp jerk)
  2. fix(vlbi-react): tour Act C — diagnose CLEAN noise-limit, replace slider with three
     engine-honest presets, remove residual graph
  (Append the Act C diagnosis to SITE-AUDIT.md; /sync + re-upload knowledge files after.)

## STARTING INSTRUCTION
Read the Act B + Act C scene code and the worker CLEAN loop. DIAGNOSE Act C's
zero-component cause FIRST and report it. Then present a short plan for both fixes before
building. Build → vision-verify each against the gates on a never-used port → commit.
