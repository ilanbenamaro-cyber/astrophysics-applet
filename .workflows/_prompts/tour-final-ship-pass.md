# VLBI SIMULATOR — FINAL SHIP PASS  (Claude Fable 5)
# Fable 5 · Plan Mode · maximum effort · frontend-design skill ON · DESIGN-LANGUAGE.md governs
# Run from the astrophysics-applet repo. Read the context files, then WRITE THE PLAN.
# This pass ENDS WITH main DEPLOYED. Order is enforced: physics → bugs → visuals →
# stress test → push. Later phases MUST NOT reopen earlier ones.

<mandate>
Physics and bug correctness are ABSOLUTE and come FIRST. They must be beyond reproach
before any visual work begins. Then — and only then — a brutally honest visual pass to
make the site a stunning work of art with no corners cut. Then a brutal full-site stress
test. Only when everything passes: commit and push to main (public deploy).
Authority: Ilan holds delegated final decision authority from Prof. Cárdenas-Avendaño
for all remaining physics choices (P1–P5 below are DECIDED — implement as specified).
</mandate>

<read_first>
.workflows/_system/SITE-AUDIT.md · ALEJANDRO-REVIEW.md · TOUR-ENGINE-AUDIT.md ·
DESIGN-LANGUAGE.md · decisions.md · gotchas.md · codebase.md · MEMORY.md ·
SESSION-CONTINUITY.md — plus uvCompute.js, useSimulation.js, simCore.js, constants.js,
UVMap.js, App.js, worker.js, and the compare-mode path. Confirm branch
feature/alejandro-physics-pass is the base (7 commits, not merged).
</read_first>

<invariants>
vlbi-react/ only; root app immutable; worker.js classic + ZERO imports (P3 defers any
worker edit). tourPhysics.js + app compute are single sources of truth; every number
computed, never a literal. Frozen anchors intact: 10,883 km / 25 μas (M87*-observing
headline) / 42 μas / 2√27 / BHEX "B~R⊕+h pending" hedge / SpaceX parity record. Public
Tour signature, autoActions, App.js wiring unchanged. offsetWidth/Height × dpr;
ctx.filter='none' after blur; RAF cleanup; reduced-motion static. VERIFY ON A NEVER-USED
PORT every run (stale-module gotcha). Use the full stack: writing-plans /
executing-plans for the staged build; dispatching-parallel-agents where work is
independent (if the subagent budget dies, continue inline and note coverage — prior
lesson); test-driven + verification-before-completion for gates; /redteam in Phase 4;
Playwright for every visual + interaction gate; vision self-critique on every visual
against the explicit targets — DO NOT hand back visuals you have not looked at.
</invariants>

╔═══════════════════════════════════════════════════════════════════════════╗
║ PHASE 1 — PHYSICS: MAKE IT BEYOND REPROACH  (implement the decided P1–P5)  ║
║ No visual work in this phase. Commit per item with its diagnosis.          ║
╚═══════════════════════════════════════════════════════════════════════════╝
These are DECIDED (Ilan, delegated authority, 2026-07-07). Implement exactly:

P1 — PER-TARGET RESOLUTION (adopt). Replace the geometric-array-max θ (simCore.js:185
  angularRes, the header/metrics "Resolution") with θ derived from the ACTUALLY-SAMPLED
  coverage: θ = λ / |uv|max of the computed tracks for the current target. Expected:
  M87* 24.7 μas · Sgr A* 23.6 · 3C 279 24.8 · Cen A 26.7. CONSTRAINT: the tour's
  canonical headline "EHT resolves M87* → 25 μas" (10,883 km co-visible) STAYS. Ensure
  the app's per-target 24.7 for M87* and the tour's 25 never appear adjacent without the
  distinction legible (sampled-coverage vs co-visible-baseline) — no in-frame collision.

P2 — MAX-BASELINE OVER THE TRACK (fix). StatusBar/metrics "Max Baseline"
  (useSimulation.js:229,244) currently samples BHEX at H=0 (~33,543 km). Take the max
  over the full observed track: expected 39,291 km (30.1 Gλ) with BHEX on. Earth-only
  unaffected.

P4 — DISH TABLE (confirm + unflag). Keep DISH_DIAMETERS (constants.js:73) as reviewed;
  element-dish for phased stations (ALMA/SMA/NOEMA) — correct because the worker models
  primary-beam FOV per element; full-aperture for LMT (50) and SPT (10) as the stable
  version-independent value (keep the 2017-illuminated caveat as a comment, do not bake
  it in). Preset means 18.1 / 16.7 / 15.6 stand. Change the `⚠ PENDING` comment to
  `confirmed (Ilan, delegated authority from A. Cárdenas-Avendaño, 2026-07-07)`.

P5 — FILL DEFINITION (confirm (a), label honestly). Keep the locked-frame Gλ grid
  definition (M=200 frozen as a display constant, commented as such). Relabel the metric
  so the absolute number isn't over-read — e.g. "Relative coverage" (or equivalent) —
  since the meaningful properties are that it rises with coverage and orders arrays
  correctly (ngEHT>2022>2017), not the absolute %. App + tour share the one function.

Gate P (all must pass before Phase 2 starts):
  - Per-target θ correct (table above); tour 25 μas headline intact; no 25-vs-24.7
    collision anywhere.
  - Max baseline = track max (39,291 km w/ BHEX).
  - Dish table confirmed/unflagged; preset means drive the default; θ=λ/D displays
    consistent; nothing downstream hardcodes old 25.
  - Fill relabeled; app==tour to machine precision; orders arrays correctly.
  - Frozen anchors re-verified by a regression probe; worker diff EMPTY.

╔═══════════════════════════════════════════════════════════════════════════╗
║ PHASE 2 — BUGS: EVERY DEFECT, FOUND AND FIXED  (still no visual polish)    ║
╚═══════════════════════════════════════════════════════════════════════════╝
Fix the user-reported defects; then hunt for more. Diagnose root cause before fixing
(instrument-first). Commit per fix.

B1 — BHEX UV COVERAGE CUT OFF IN THE UV MAP. The BHEX coverage is clipped at the frame
  edge. Diagnose: is the N1 locked extent (34.6 Gλ) SMALLER than the actual BHEX track
  |uv|max? If BHEX coverage exceeds the locked frame, the lock is under-sized. Reconcile
  N1 with the true BHEX extent so the full BHEX coverage FITS inside the fixed frame
  (recompute the locked half-extent from the real BHEX-on |uv|max × margin), and confirm
  Earth-only still renders correctly small within it. The axes must still be
  toggle-invariant (N1) — just sized to actually contain BHEX.

B2 — TELESCOPE BASELINES SOMETIMES DON'T FULLY CONNECT. Baseline vectors/arcs
  intermittently fail to render fully. Diagnose: is it a co-visibility/elevation cull
  dropping a segment mid-track, a UV-point generation gap, a render clip, or an
  off-by-one in the pair loop? Instrument which pairs/segments drop and when. Fix so all
  valid baselines render completely; confirm no regression to the elevation filter
  (dropping a genuinely non-co-visible segment is CORRECT — distinguish that from a bug).

B3 — COMPARE MODE: NO INDIVIDUAL TELESCOPE PLACEMENT. In compare mode the user must NOT
  place/remove individual telescopes; they compare EHT PRESETS only, with a BHEX on/off
  toggle per pane. Remove/disable per-telescope placement interaction in compare panes;
  keep preset selection + the N2 BHEX toggle. Confirm the two compare workers
  (App.js:21–22) still run independently and neither pane leaks placement state.

B4+ — HUNT FOR MORE (dispatch parallel agents). Systematically exercise: every array
  preset × every target × BHEX on/off × single vs compare × both tour modes × reduced
  motion × projector/laptop/tablet viewports. Catalog EVERY defect (console errors,
  render glitches, state leaks, layout breaks, interaction dead-ends, physics/display
  mismatches) in SITE-AUDIT.md and FIX all in-scope. Anything physics-touching beyond
  P1–P5: STOP and surface (Alejandro-authority fence still applies to NEW physics).

Gate B: all reported + discovered bugs fixed or surfaced; BHEX fits the frame; all
valid baselines connect; compare mode is preset-only + BHEX toggle; zero console errors
app-wide across the full matrix; live app reconstructs unchanged; worker diff empty.

>>> HARD CHECKPOINT: Phases 1–2 are now FROZEN. Phase 3 MUST NOT alter any physics value,
>>> computation, or the bug fixes. If a visual change appears to require a physics/logic
>>> change, STOP and surface — do not silently reopen. <<<

╔═══════════════════════════════════════════════════════════════════════════╗
║ PHASE 3 — VISUALS: A STUNNING WORK OF ART  (brutal honesty, no corners)    ║
╚═══════════════════════════════════════════════════════════════════════════╝
Now make the entire site — live app AND tour — as breathtaking as possible, within
DESIGN-LANGUAGE.md and the "gold = live computation" law. Method: for each surface,
SCREENSHOT it, critique it BRUTALLY against the bar below in writing, then improve, then
re-screenshot to confirm. No self-flattery; if it's not gallery-grade, say so and fix it.

The bar (vision-verify each):
  3.1 WHOLE-SITE COHESION — the live app and the tour must feel like ONE designed
      product. Alt-tab between the app shell and each tour act; chrome, type scale,
      hairlines, spacing rhythm, motion language must be unmistakably the same hand.
      Raise the live app to the tour's bar where it lags (controls, sidebar, panels,
      buttons, the UV map, the image panels) — without changing what they DO.
  3.2 DEPTH, NOT RECTANGLES — no surface reads as flat boxes on black. Galaxy depth
      (vibrant but subordinate — gold stays brightest/sharpest), foreground/midground/
      background separation, generous scale. Every tour act and the app's main stage.
  3.3 THE DATA IS THE HERO — the "gold = live computation" grammar is enforced
      everywhere: the actively-computed layer is always the brightest, sharpest, most
      saturated thing in frame; chrome recedes; nothing decorative competes with it.
  3.4 TYPOGRAPHY & DETAIL — equation rendering, numeric mono, labels, legends, scale
      bars, the N2 BHEX toggle, the P5 coverage label — all crisp, aligned, intentional.
      Micro-detail is where "art" lives; hunt sloppy spacing, misalignment, orphaned px.
  3.5 MOTION — one primary motion per surface, eased cubic-bezier(0.25,0.46,0.45,0.94);
      the Act B Earth spins constant/smooth (main-globe pace); nothing janky; reduced
      motion fully static.
  3.6 THE MOMENTS — Act D (First Light) lands as the emotional peak; Act B's synthesized
      aperture and Act E's leaving-Earth read as awe. Stage them like a gallery would.

Brutal-honesty protocol: after each surface, write a 2–4 line critique naming the
weakest thing still present, then fix it before moving on. Do not advance on "good
enough." Commit per coherent visual batch.

Gate V: alt-tab app↔tour = one product; no flat-rectangle surfaces; gold dominance
verified by screenshot on every surface; typography/detail crisp; motion disciplined;
reduced-motion static; and — critically — Phases 1–2 UNCHANGED (re-run Gate P + Gate B
spot-checks; any drift = fail).

╔═══════════════════════════════════════════════════════════════════════════╗
║ PHASE 4 — BRUTAL STRESS TEST  (everything, at once, adversarially)         ║
╚═══════════════════════════════════════════════════════════════════════════╝
Run /redteam over physics + bugs + the fence. Then a full adversarial sweep on a
never-used port via Playwright:
  - MATRIX: every preset × every target × BHEX on/off × single/compare × guided/
    presenter × reduced-motion × rapid toggling/preset-thrashing × projector 1080p/4K +
    laptop + tablet. Screenshot representative states.
  - PHYSICS REGRESSION: the frozen-anchor probe (10,883 / 25 / 42 / 2√27 / hedge), the
    per-target θ table, the fill values, max-baseline, dish means — all still exact.
  - RESILIENCE: rapid mode switches, tour open/close cycles (tourEarth GL disposed, no
    leak), compare-mode dual workers, CDN-fail paths still graceful, no memory growth.
  - PERF: presenter holds pacing; no framerate regression from Phase 3; the WebGL-into-2D
    compositing (tourEarth) stays smooth.
  - ZERO console errors anywhere. ZERO placement in compare mode. BHEX never clipped.
    All baselines connect.
  Any failure → fix → re-run the affected gate. Do not proceed to Phase 5 with any open
  failure.

╔═══════════════════════════════════════════════════════════════════════════╗
║ PHASE 5 — SHIP  (only when every gate above is green)                      ║
╚═══════════════════════════════════════════════════════════════════════════╝
  1. Final knowledge sync: update SITE-AUDIT.md (all fixes + stress-test ledger),
     decisions.md (P1–P5 confirmed + delegated authority note), gotchas.md (B1/B2 root
     causes), codebase.md (BHEX toggle, compare-mode change, per-target θ), MEMORY.md,
     SESSION-CONTINUITY.md. Commit.
  2. Merge feature/alejandro-physics-pass → main (no-ff), then push. This DEPLOYS
     PUBLICLY (~60s via GitHub Pages). Confirm the working tree is clean and every gate
     is green BEFORE the push.
  3. Report: the deployed commit hash, the gate ledger (P/B/V + stress matrix all green),
     and the two remaining HUMAN TODOs that this pass cannot close:
       ⚠ projector-laptop CLEAN timing gate (run on the actual talk machine; if CLEAN
         >300 ms there, flip presenter Act C to cached playback).
       ⚠ BHEX baseline sign-off (hedge stays until Marrone/Alejandro confirm).

<pause_and_surface>
STOP and surface if: any Phase-3 visual change would require a physics/logic change; any
NEW physics issue appears beyond P1–P5; the stress test reveals a defect whose correct
physics value you cannot derive without Alejandro; or a dish/target value is missing
rather than merely needing confirmation. Otherwise execute autonomously through Phase 4,
and PAUSE before the Phase 5 push for Ilan's final go — present the full gate ledger and
await "push" before deploying to main.
</pause_and_surface>

## STARTING INSTRUCTION
Read everything in <read_first>. Then WRITE THE STAGED PLAN (all 5 phases, what
parallelizes, the frozen checkpoints). Present it for approval. Then execute in strict
phase order — physics beyond reproach first, visuals never reopening them, stress test,
and PAUSE for the final push confirmation before deploying to main.
