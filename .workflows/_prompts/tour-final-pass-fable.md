# VLBI TOUR + SITE — FINAL MAJOR PASS  (written for Claude Fable 5)
# Fable 5 · Plan Mode · maximum effort · frontend-design skill ON · DESIGN-LANGUAGE.md governs
# Run from the astrophysics-applet repo. Read this whole file, then TOUR-ENGINE-AUDIT.md,
# DESIGN-LANGUAGE.md, gotchas.md, and decisions.md, before planning.

## INTENT & MODEL POSTURE

This is the FINAL major pass. The engine-real 5-act tour works and is scientifically
honest; the bones are right. What remains is (1) six specific enhancements, (2) my
standing notes, and (3) a full site audit that finds every bug and every
below-standard surface and raises it. Goal: an exhibition-grade product that impresses
an artist (visuals/aesthetics) AND a physicist (rigor/explanation) in the same breath,
for both the Harvard talk and the public site.

You are Fable 5. Use your strengths deliberately:
- LONG AUTONOMY: this is multi-stage; plan across stages, execute without needing a
  human between every step. Commit per item.
- SUB-AGENTS (superpowers:dispatching-parallel-agents): parallelize the independent
  work — the site audit, the per-slide enhancements, and the galaxy/text systems are
  separable. Use writing-plans + executing-plans for the staged build.
- VISION SELF-CRITIQUE (your defining capability): after building each visual, SCREENSHOT
  it and judge it against the explicit visual targets in this prompt BEFORE moving on.
  Do not hand back work you have not looked at. The recurring failure of every prior
  pass was building blind; you can see. Use it. If a built act does not meet the target
  on your own visual inspection, iterate before commit.
- SELF-VERIFICATION (superpowers:verification-before-completion + test-driven): write
  the checks, run them, screenshot both modes on a fresh port (gotcha #238).
- RED-TEAM: after the build, run a /redteam pass over physics integrity + the audit.

INVARIANTS (never violate — see decisions.md/gotchas.md):
- vlbi-react/ only; root app immutable; worker.js stays classic, zero imports.
- tourPhysics.js is the single source of computed truth; every number computed, never a
  literal. The ring-fraction fix (measureRingFraction → true 42 μas) stays; scale bars
  computed. 10,883 / 25 μas / 42 μas / 2√27 / BHEX hedge all intact.
- "Gold = live computation": the data layer stays the brightest, sharpest thing on
  screen — even with a more vibrant galaxy (see G-VIBRANCE).
- Reuse over rebuild: tourEarth (main-globe textures), drawHot/drawContour, simCore,
  tourGalaxy. Extend, don't duplicate.
- Public Tour({actIndex,…}) signature, autoAction types, App.js wiring unchanged.
- offsetWidth/Height × dpr; reset ctx.filter='none' after blur; RAF cleanup per act;
  reduced-motion renders the final static frame (galaxy included), RAF never starts.

═══════════════════════════════════════════════════════════════════════════════
STAGE 1 — THE SIX REQUESTED ENHANCEMENTS  (explicit visual targets; vision-verify each)
═══════════════════════════════════════════════════════════════════════════════

S1.1 — GALAXY: MORE VIBRANT AND COLORFUL (all acts)
  Current nebula is α 0.04–0.08, near-monochrome — too timid. Make it vibrant and
  colorful while STILL subordinate to the data. Target: deep-space color — band the
  nebula across the DESIGN-LANGUAGE family PLUS richer cosmic hues (slate→indigo→violet
  →teal→faint magenta), multiple colored clouds, brighter cores (raise α to ~0.10–0.18
  on cores, soft falloff), more visible/varied stars, subtle parallax depth.
  HARD CONSTRAINT (vision-verify): the gold live-computation layer must remain the
  brightest, highest-contrast, sharpest element in every frame. The galaxy is rich but
  sits BEHIND a clear value/contrast gap. Screenshot each act; confirm by eye the data
  reads instantly as foreground. If the galaxy competes, pull luminance/saturation down
  until it doesn't. Vibrant ≠ loud.

S1.2 — MORE DETAIL IN EVERY ACT'S TEXT (scrolling allowed)
  The unified narratives are good but thin. Expand each act's explanation to be genuinely
  exhaustive — the physicist gets the full mechanism, the curious reader gets the full
  story — in the one unified voice (beautiful AND exact; never "like a telescope").
  Scrolling the text panel is explicitly ALLOWED: make the panel scrollable rather than
  truncating content. Each act should teach its concept completely: what's happening,
  why, the equation in context, the physical scale, the connection to the real EHT.
  Vision-verify the panel scrolls cleanly and the equation stays put while prose scrolls.

S1.3 — ACT B (slide 2): EARTH ROTATES CONTINUOUSLY + DRAG REWORK
  (a) The Earth must CONTINUOUSLY rotate on its own (idle animation) — a slow, constant
      spin via tourEarth rotation, independent of user input, so the globe always feels
      alive. (Reduced-motion: static.)
  (b) The HA/declination drag is unclear and unfriendly — REWORK it. Problems: it isn't
      obvious what's draggable, what each axis does, or where you are. Fix with clear
      affordance + decoupled controls:
      - Make the interaction legible: a labeled control surface — e.g. horizontal drag =
        hour angle (with an HA readout + a visible track/handle), a separate control for
        declination (slider or vertical drag, clearly labeled), NOT one ambiguous
        whole-canvas drag doing both. Hit-test the control rects (like Act C's reworked
        slider), not the whole panel.
      - Show state: current HA and dec values displayed; the live u,v ellipse updates as
        they change (sub-ms recompute — keep it live). The continuous idle spin pauses or
        blends while the user is actively scrubbing HA, then resumes.
      - Make it discoverable: a clear "drag to rotate the array's view / set declination"
        affordance, not the current cryptic "drag ↔ hour angle  ⇅ declination" line.
      Vision-verify: a first-time user understands what to drag and what it does.

S1.4 — ACT C (slide 3): THERMAL NOISE STILL CONFUSING / APPEARS BROKEN — DEEP FIX
  This is the act that needs the most. The noise control reads as confusing and partly
  broken. Diagnose ROOT CAUSE with fresh eyes (do not assume prior framing):
  - Is the slider's effect visible? If 0–0.25× RMS produces no perceptible change in the
    dirty/CLEAN images, the control feels broken even when it's working. Make the noise's
    EFFECT visibly legible — the dirty image should visibly degrade and the CLEAN result
    visibly struggle as noise rises, with a readout of the noise level and its consequence
    (e.g. dynamic range dropping, or "noise-limited" when components fall below 3σ).
  - Is the range right? Choose a range where the user SEES the science happen (low noise →
    clean ring; high noise → ring degrades), driven by the real engine, not cosmetics.
  - Is the interaction smooth? No flicker on recompute (hold prior canvases), clear
    handle/track, recompute-on-release with an inline spinner, hit-test the track only.
  - Restage the whole act so the causal story reads: SPARSE u,v → DIRTY image → CLEAN ring,
    left-to-right with the noise control clearly governing the transformation.
  Vision-verify: dragging noise produces an obvious, physically-honest change; a stranger
  understands "more noise → harder to recover the ring."

S1.5 — ACT D (slide 4): FLESH OUT PHOTO vs SIMULATION SO IT'S NOT CONFUSING
  The real-photo / our-reconstruction pairing needs more scaffolding so audiences grasp
  what they're comparing. Add text AND visual structure:
  - Label both panels unmistakably: LEFT = the real 2019 EHT photograph of M87*
    (provenance: EHT Collaboration, 10 April 2019); RIGHT = THIS simulator's own
    reconstruction of the same source, via the pipeline the viewer just watched in Act C.
    Make the "same source, two instruments" relationship explicit in prose + a connecting
    visual (a labeled bridge/arrow, matched scale bars at identical μas scale so the ring
    sizes are visibly comparable).
  - Explain WHY they differ and WHY they agree — what the match demonstrates (the
    simulator reproduces the real measurement). This is the emotional + scientific peak;
    the text should land both.
  - Keep the climax staging (reconstruction resolving from blur, "10 APRIL 2019" weight),
    enlarge, dimmest galaxy here.
  Vision-verify: the two panels are clearly labeled, scale-matched, and the takeaway
  ("our instrument reproduces the real photograph") is unmistakable.

S1.6 — ACT E (slide 5): UV COVERAGE ARCS MATCH STATION COLORS
  Each baseline's u,v arc should be drawn in a color tied to its station(s), consistent
  with how the main app colors stations/baselines (TELESCOPE_COLORS / the app's
  per-station palette). The viewer should visually connect an arc to the station(s) that
  produced it. Resolve the earlier collision (BHEX preset color was gold) by giving the
  space baseline a distinct, clearly-labeled color OUTSIDE the gold data reservation if
  needed, or reconcile via the legend. Keep ground-vs-space legibility (W1.4) and the
  single BHEX hedge. Provide a small legend mapping color → station.
  Vision-verify: arcs are visibly station-colored and a legend makes the mapping clear.

═══════════════════════════════════════════════════════════════════════════════
STAGE 2 — MY STANDING NOTES  (depth/composition; fold in with Stage 1)
═══════════════════════════════════════════════════════════════════════════════
- Composition depth: no act should read as "rectangles on black." With the vibrant
  galaxy + enlarged subjects + per-act staging, verify each act has genuine foreground/
  midground/background depth. Vision-verify against this explicitly.
- Consistency: one visual language across all five acts (chrome, type scale, hairlines,
  motion) — alt-tab between acts and the site shell; they must feel like one product.
- Motion discipline: one primary motion per act + the new continuous Earth spin; eased
  cubic-bezier(0.25,0.46,0.45,0.94); nothing decorative that competes with the data.

═══════════════════════════════════════════════════════════════════════════════
STAGE 3 — COMPLETE SITE AUDIT  (find every bug + every below-standard surface)
═══════════════════════════════════════════════════════════════════════════════
Dispatch sub-agents to audit in parallel; produce .workflows/_system/SITE-AUDIT.md, then
FIX what's in scope (vlbi-react/) and FLAG what isn't. Cover:

  3.1  PHYSICS INTEGRITY (whole app, not just tour): the live-app sidebar still says
       "Source: 42 μas (52.5% of FOV)" — the SAME ring-fills-frame assumption the tour
       just fixed (gotchas.md). This mislabels the source by >2×. FIX IT in the live app
       too (the tour's measureRingFraction approach), so tour and tool agree. Audit for
       any other place a physics literal or stale assumption diverges from tourPhysics.
  3.2  KNOWN DEFECTS from this session's flags: CDN failures (clouds CORS, specular 404)
       logging errors on main + tour — fix or cleanly suppress (graceful, no console
       errors). Any other console errors anywhere → catalog + fix.
  3.3  CROSS-BROWSER / RESPONSIVE: the tour + app at common viewport sizes (projector
       1080p/4K, laptop, tablet); layout breaks, overflow, illegible scaling → fix.
  3.4  DESIGN BELOW STANDARD: audit every surface — main app controls, panels, sidebar,
       buttons, the simulator UI — against DESIGN-LANGUAGE.md. Where the main app itself
       is below the tour's new bar, raise it (within reason; flag anything large).
  3.5  ACCESSIBILITY: reduced-motion across the whole app, contrast ratios, keyboard
       reachability of controls, focus states.
  3.6  PERFORMANCE: the offscreen-WebGL tourEarth composited per-frame — confirm no
       framerate regression, GL contexts disposed on tour close (no leak across
       open/close). Presenter mode holds at projector pacing.
  3.7  DEAD CODE: after this pass, remove anything orphaned (old galaxy/star routines,
       drawConvolutionReveal if unused, any retired scene helpers). Grep before delete.

  SITE-AUDIT.md lists every finding as [severity][in-scope? fix/flag][file:line]. Fix all
  in-scope; flag root-app or large items for human decision.

═══════════════════════════════════════════════════════════════════════════════
QUALITY GATES  (binary; vision-verify each; both modes; fresh port per run)
═══════════════════════════════════════════════════════════════════════════════
  G-VIBRANCE  Galaxy is visibly vibrant/colorful AND the gold data layer is still the
              brightest/sharpest element in every act (screenshot-confirmed).
  G-TEXT      Every act's text is exhaustive; panel scrolls cleanly; equation pinned.
  G-EARTH-B   Act B Earth continuously rotates (idle), textured/marked, stable; HA + dec
              controls are legible, discoverable, decoupled, with live readouts; live u,v
              ellipse updates; reduced-motion static.
  G-NOISE-C   Act C noise control visibly changes the result in a physically-honest way;
              smooth, labeled, non-glitchy; sparse→dirty→CLEAN reads left-to-right.
  G-PAIR-D    Act D panels clearly labeled (real photo vs this simulator), scale-matched,
              with explicit "same source, two instruments" framing; takeaway unmistakable.
  G-COLOR-E   Act E arcs are station-colored with a legend; ground vs space legible;
              single BHEX hedge intact.
  G-DEPTH     No act reads as rectangles-on-black; genuine depth; one product feel.
  G-PHYSICS   tourPhysics single-source intact (10,883 / 25 μas / 42 μas / 2√27 / hedge);
              the LIVE-APP sidebar μas mislabel is FIXED; tour and app agree.
  G-AUDIT     SITE-AUDIT.md exists; all in-scope findings fixed; zero console errors app-
              wide (CDN failures resolved/suppressed); flags recorded.
  G-PERF      No framerate regression; tourEarth GL disposed on close; presenter holds at
              projector pacing.
  G-APP       The live simulator still reconstructs unchanged; compare-mode dual workers
              unaffected; reduced-motion static app-wide.
  G-CONTRACT  Tour signature / autoAction / App.js wiring unchanged; worker.js still
              classic zero-imports.

═══════════════════════════════════════════════════════════════════════════════
EXECUTION SHAPE & COMMITS
═══════════════════════════════════════════════════════════════════════════════
Plan across stages (writing-plans). Parallelize independent work via sub-agents
(galaxy+text systems; per-slide S1.3/4/5/6; the Stage-3 audit). Build → vision-verify →
test → commit per item. After the full build, run /redteam over physics + audit, then a
final both-modes screenshot sweep. Suggested commit sequence (adapt as needed):
  1. feat: tour galaxy — vibrant multi-hue nebula, data layer still dominant
  2. feat: tour — exhaustive scrollable narratives (all acts)
  3. feat: tour Act B — continuous Earth spin + reworked legible HA/dec controls
  4. feat: tour Act C — physically-legible noise control + restaged pipeline
  5. feat: tour Act D — labeled scale-matched photo/reconstruction + framing
  6. feat: tour Act E — station-colored coverage arcs + legend
  7. feat: tour — composition depth pass (all acts, vision-verified)
  8. fix: app — correct sidebar μas (ring-fraction) so tool matches tour
  9. fix: app — resolve CDN errors + audit fixes (SITE-AUDIT.md)
  10. chore: remove dead code; sync knowledge files (gotchas/codebase/decisions/memory)
  Final commit message:
  feat(vlbi-react): final pass — vibrant galaxy, exhaustive narratives, live-rotating
  Earth + reworked Act B controls, legible Act C noise, labeled Act D pairing,
  station-colored Act E arcs, full site audit + app physics-label fix

## STARTING INSTRUCTION
Begin by reading the four context files, then WRITE THE PLAN across all three stages
(use writing-plans). Identify what parallelizes. Present the plan for approval before
building. Then execute autonomously, vision-verifying every visual against the explicit
targets above and committing per item — but PAUSE and surface to me if: (a) the live-app
μas fix risks changing reconstruction behavior, (b) any physics value would have to
change (not just a label), or (c) the audit finds a severe defect needing a scope
decision. Otherwise run to completion and report with screenshots.
