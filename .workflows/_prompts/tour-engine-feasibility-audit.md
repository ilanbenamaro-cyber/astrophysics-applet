# VLBI TOUR — ENGINE FEASIBILITY AUDIT (read-only; produces ONE document)
# Opus · Ultrathink · NO code changes, NO commits to source, NO design work
# Run from the astrophysics-applet repo. Read this whole file before starting.

## WHY THIS IS AUDIT-ONLY

The tour is being rebuilt on a new premise: each act stops being a hand-drawn
illustration of a concept and becomes a REAL, simulation-backed instrument driven by
the same engine as the live simulator (uvCompute / the worker / the contour
renderer / real station + sky data). The tour will be "impressive for the same reason
the site is impressive — because it is real," not because it competes on decoration.

Before any of that can be scoped, ONE thing must be known with file-level certainty:
what can the existing engine actually drive from a standalone act, and at what cost?
The act count, the dual-venue (talk + site) strategy, and the build effort all fall
OUT of that answer. Guessing it wrong turns a 2-week effort into a 2-month one.

So this pass writes NOTHING but a report. No engine refactor, no tour edits, no new
components, no commits to source files. The single deliverable is:
  .workflows/_system/TOUR-ENGINE-AUDIT.md
Read every file before concluding anything. Cite file:line for every claim. Where you
cannot determine something statically, say so and propose the smallest experiment that
would settle it — do not assert.

## THE TWO VENUES THIS MUST SERVE (hold both in mind while auditing)

  • THE TALK — Harvard EHT talk, projected, presenter-driven. Wants: big legible
    visuals, dramatic timing, advance-on-cue, minimal on-screen text (the presenter
    narrates), must hold at projector resolution and framerate in a live room.
  • THE SITE — public live site, self-guided, no narrator. Wants: self-explaining
    acts, more on-screen text, self-paced, interactive (hover/click), robust to a
    stranger poking at them.
  These pull in opposite directions. The audit must assess, per candidate act,
  whether one build can serve both (e.g. a presenter/self-guided mode toggle) or
  whether some acts need two modes. Flag the tension explicitly; do not paper over it.

═══════════════════════════════════════════════════════════════════════════════
SECTION 1 — ENGINE INVENTORY (what exists, what it computes, how it's invoked)
═══════════════════════════════════════════════════════════════════════════════

Read and document the real computational core. For EACH engine piece below, record:
its public surface (exported functions + signatures), its inputs/outputs, its
dependencies, and — critically — whether it is PURE (callable with plain args,
returns a value) or ENTANGLED (bound to React state, app singletons, the DOM, or a
specific canvas/worker instance).

  1.1  uvCompute.js — latLonToECEF, computeElevation, MIN_ELEVATION_RAD, the u,v
       projection math, baseline computation. Pure functions or app-coupled? Can a
       standalone act import and call them with its own inputs today, unchanged?
  1.2  worker.js — what does it compute (gridding, FFT, dirty image, CLEAN)? How is
       it instantiated and messaged? Is it a singleton the app owns, or can a tour
       act spin up its own worker instance? What's the message latency for a single
       run? Does it assume import maps / module context the tour can't provide
       (gotcha: classic Worker, no imports)?
  1.3  The contour renderer / image pipeline — what draws the simulator's black-hole
       contour maps? Can it render to an ARBITRARY canvas the tour supplies, or only
       to the app's own canvas/DOM node? What inputs does one render need?
  1.4  useSimulation.js — the state/orchestration layer. Identify which computations
       live HERE (entangled in the hook) vs in pure modules. Anything important that
       only exists inside the hook is a refactor cost the build will inherit.
  1.5  constants.js — ARRAY_PRESETS, station coords, SKY_TARGETS, SEFD, BHEX_PRESET,
       freq/λ. Confirm everything an act would need is data the act can import
       directly.

  Output: an ENGINE SURFACE TABLE — one row per capability (e.g. "compute u,v track
  for a baseline over a transit", "dirty image from a u,v sampling", "CLEAN a dirty
  image", "render contour map"), columns: [where it lives] [pure or entangled]
  [callable standalone today? yes/no/with-refactor] [single-run cost: ms / needs
  worker / needs precompute].

═══════════════════════════════════════════════════════════════════════════════
SECTION 2 — REAL-TIME BUDGET (what survives a live projector at framerate)
═══════════════════════════════════════════════════════════════════════════════

For the talk, acts must hold in a live room. For each engine capability in the
Section 1 table, classify the achievable interaction model:

  • LIVE-60FPS — cheap enough to recompute every frame (e.g. u,v ellipse points as a
    source transits; geometric projections). These can be genuinely interactive.
  • LIVE-ON-INPUT — too heavy for every frame but fast enough to recompute on a user
    action / slider release within ~100–300 ms (e.g. a single dirty-image pass).
  • PRECOMPUTE — must be computed ahead of time and played back (e.g. a full CLEAN
    convergence, or a high-res image sequence). Still "real" (real engine output),
    just baked.

  Where you cannot measure statically, propose the minimal timing experiment (e.g.
  "instrument worker.js round-trip for one 256² dirty image, report ms") rather than
  guessing. Note projector realities: likely 1080p/4K, possibly weaker GPU than dev
  machine, must not jank mid-talk.

═══════════════════════════════════════════════════════════════════════════════
SECTION 3 — THE EIGHT CONCEPTS, RE-IMAGINED AS REAL INSTRUMENTS
═══════════════════════════════════════════════════════════════════════════════

The current tour teaches 8 concepts (resolution, baseline/visibility, earth-rotation
synthesis, the EHT array, deconvolution/CLEAN, first light, BHEX/space VLBI, the
simulator). For EACH, answer: what would the REAL, engine-driven version be, and is
it feasible?

  For each concept record:
   • THE REAL VERSION — what genuine computation would drive it (not an illustration).
     e.g. Earth-rotation synthesis = live u,v ellipse computed from real station ECEF
     as a chosen source transits, not a drawn ellipse. Deconvolution = a real dirty
     image from real sparse u,v, actually CLEANed, not a crossfade.
   • ENGINE PATH — which Section 1 capabilities it needs.
   • INTERACTION MODEL — live-60fps / live-on-input / precompute (from Section 2).
   • STANDALONE TEST — could this single act be lifted out and published on its own
     as a correct, self-contained explainer? If not, why not.
   • DUAL-VENUE FIT — does one build serve talk + site, or does it need a mode split?
   • VERDICT — TRULY REAL (engine-driven, feasible), HYBRID (real core + some staged
     framing), or ILLUSTRATION-BOUND (cannot be made engine-real at reasonable cost —
     say why).

  Be honest about Illustration-Bound cases. "First Light" is a real photograph —
  its real version may just be presenting the actual image impeccably, and that's
  fine. The point is to know which acts are real instruments and which are not.

═══════════════════════════════════════════════════════════════════════════════
SECTION 4 — THE RECOMMENDATION (the answers the build pass needs)
═══════════════════════════════════════════════════════════════════════════════

From Sections 1–3, conclude:

  4.1  ACT COUNT — how many acts SHOULD there be, given the bar is "breathtaking +
       standalone + engine-real"? If 4–5 deep real instruments beat 8 shallow ones,
       say so and say which concepts merge or drop. The count must fall out of what
       can be made real, not out of preserving the current structure.
  4.2  ENGINE READINESS — what is callable standalone TODAY vs what needs a refactor
       to become callable. Estimate each refactor's size (e.g. "extract dirty-image
       compute from useSimulation into a pure module — small" vs "decouple worker
       from app singleton — medium"). This is the build's true cost driver.
  4.3  DUAL-VENUE STRATEGY — one build with a presenter/self-guided toggle, two
       modes, or per-act decisions. Recommend one, with reasoning.
  4.4  BUILD SHAPE — the phase plan the eventual build prompt should follow
       (e.g. "Phase 0: extract these N pure modules from the engine; Phase 1: act
       framework that hosts engine-driven canvases; Phase 2: build acts in order X").
       Do NOT build it — just specify the shape so the next prompt can be written
       against real ground truth.
  4.5  RISKS — the top 3 things most likely to blow up scope (worker entanglement,
       projector performance, the talk/site tension), each with a mitigation.

═══════════════════════════════════════════════════════════════════════════════
CONSTRAINTS (this pass)
═══════════════════════════════════════════════════════════════════════════════
  • READ-ONLY on all source. The ONLY file written is
    .workflows/_system/TOUR-ENGINE-AUDIT.md. No edits to engine, tour, or app. No
    commits to source. (Committing the audit doc itself is fine.)
  • Every capability claim cites file:line. No assertion without evidence; where
    static reading can't settle it, propose the smallest experiment instead of
    guessing.
  • Timing numbers: if measured, say how; if estimated, label as estimate and give
    the experiment that would confirm.
  • Physics is not touched here, but note if the rebuild would let any act inherit
    the engine's real numbers directly (so the tour and tool share computed truth by
    construction, not by manual sync) — that's a design win to flag for the build.
  • Hold both venues (talk + site) in view throughout; never optimize one silently.

## DELIVERABLE
A single document, .workflows/_system/TOUR-ENGINE-AUDIT.md, containing Sections 1–4.
At the end, a one-paragraph bottom line: is the "every act is a real engine-driven
instrument" vision feasible, at what act count, with what refactor cost, and what is
the single biggest risk. Then STOP — do not propose or write the build. We read this
first.
