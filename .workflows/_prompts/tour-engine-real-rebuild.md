# VLBI TOUR — ENGINE-REAL REBUILD (master prompt)
# Opus · Plan Mode · Ultrathink · frontend-design skill ON
# Run from the astrophysics-applet repo. Read this entire file, then the audit at
# .workflows/_system/TOUR-ENGINE-AUDIT.md, before planning anything.

<role>
You are a senior creative technologist and science communicator with dual mastery in
(1) radio astrophysics and computational signal processing — VLBI interferometry,
aperture synthesis, Fourier reconstruction per Thompson, Moran & Swenson — and
(2) museum-grade interactive choreography in React/htm + Canvas 2D + Web Workers.
You are rebuilding the guided tour of the vlbi-react VLBI Interferometry Simulator so
that EVERY act is a real, engine-driven instrument — genuine computation rendered
beautifully — not an illustration of computation. The tour must be breathtaking to an
artist, rigorous to a scientist, and lucid to a curious stranger, simultaneously.
</role>

═══════════════════════════════════════════════════════════════════════════════
MANDATORY CORRECTIONS — this prompt supersedes any prior template you may infer
═══════════════════════════════════════════════════════════════════════════════
1. TARGET CODEBASE IS vlbi-react/ ONLY. Never touch root js/, root css/, root
   index.html, or any "SECTION A–E" single-file structure. The active app is the
   multi-file vlbi-react app (uvCompute.js, worker.js, useSimulation.js,
   ContourMap.js, ImageCanvas.js, constants.js, presets.js, tourPhysics.js,
   Tour.js, TourCard.js, TourDiagram.js, App.js).
2. FIVE ACTS, NOT TWELVE. The engine audit (TOUR-ENGINE-AUDIT.md §4.1) concluded
   ~5 deep instruments beat 8–12 shallow steps. The act set is fixed below (A–E).
3. DECONVOLUTION METHODS ARE dirty / CLEAN (Högbom) / MEM (worker.js:181–390).
   There is NO Richardson-Lucy in this engine. Do not reference or build RL.
4. ALL NUMBERS COME FROM tourPhysics.js — computed, never hardcoded. Headline
   baseline is the M87*-observing max (ehtMaxBaselineM87Km ≈ 10,883 km → θ ≈ 25 μas,
   SPT excluded via the imported elevation filter). Shadow coefficient is 2√27
   (diameter), single-sourced. Never type a physics literal into an act.
5. BHEX INTEGRITY: coverage geometry (computeSatelliteECEF) may be presented as
   real; the baseline relation stays "characteristic ~ R⊕+h", pending sign-off
   (Marrone/Alejandro), never a clean equality. Preserve every pending/⚠ label.
6. THE TOUR IS A STANDALONE CINEMATIC EXPERIENCE hosting engine-driven canvases —
   NOT a spotlight/tooltip overlay of the live app's panels. Act E hands off to the
   live tool at the end (the autoActions plumbing in App.js:58–80 already exists).
7. ONE BUILD, ONE FLAG: mode: 'presenter' | 'guided' (audit §4.3). Presenter =
   Harvard talk (minimal on-screen text, advance-on-cue, guaranteed-smooth);
   Guided = public site (self-paced, narrative tiers, live interaction).

═══════════════════════════════════════════════════════════════════════════════
PHASE 0 — ENGINE EXTRACTIONS + THE TIMING GATE  (small; nothing visual)
═══════════════════════════════════════════════════════════════════════════════
Per audit §4.2, lift these as pure functions with ZERO behavior change — the live
app continues to use them (refactor-in-place, app keeps working):
  0.1  runReconstruction(grayscale, uvPoints, params): Promise<result>
       — extracted from the dispatch effect (useSimulation.js:175–210). Owns its
       own Worker instance per call-site (new Worker(new URL('./worker.js',
       import.meta.url)) — classic, no {type:'module'}; non-singleton is proven by
       App.js:21–22 already running two).
  0.2  scaleSource (useSimulation.js:130–146), buildSefdMap (149–172),
       computeDynamicRange / beamFwhm / angularRes (213–288) → pure module
       (suggest vlbi-react/js/simCore.js). useSimulation imports them back.
  0.3  drawContour(ctx, data, opts) extracted from ContourMap.js:171–383 and
       drawHot(ctx, data, N) from ImageCanvas.js:6–40 — so acts can render engine
       output onto their own canvases. ContourMap/ImageCanvas import them back.
  0.4  WORKER PROGRESS (the one worker change, opt-in, non-breaking): add a
       params.progressEvery option; when set, the CLEAN loop (worker.js:306–328)
       posts {type:'progress', id, iter, residual} every K iterations. No imports
       added (classic worker preserved); when the flag is absent, behavior is
       byte-identical to today. This powers Act C's live residual sparkline.
  0.5  THE TIMING GATE (decides Act C's architecture — do not skip):
       wrap runReconstruction with performance.now(); log elapsed ms for EHT 2017 +
       black-hole.png at N=512 for each method ∈ {dirty, clean, mem}, and time
       computeUVPoints alone. Record numbers in TOUR-ENGINE-AUDIT.md §2 (replacing
       the estimates) for BOTH: (a) this dev machine, (b) — flag for the human to
       run on a projector-class laptop before the talk.
       DECISION RULE for Act C: clean ≤ 300 ms → guided AND presenter both
       recompute live; 300 ms–1 s → guided live, presenter precomputed playback of
       cached real output; > 1 s → both use precomputed playback, guided gets an
       explicit "recompute live" button with the spinner pattern the app already
       uses (useSimulation.js:187–208).
  Verify the app is pixel/behavior-identical after extractions (Playwright on a
  fresh port — gotcha #238). Commit Phase 0 alone.

═══════════════════════════════════════════════════════════════════════════════
PHASE 1 — THE ACT FRAMEWORK  (state machine, modes, narration, equations, chrome)
═══════════════════════════════════════════════════════════════════════════════
Public contract preserved: Tour({actIndex, onActChange, onClose, onTourAction,
reducedMotion}) and the autoAction types App.js already handles. Internals are
rebuilt. TourCard layout (visual ~68vh / text panel below) remains the shell.

1.1  THE ACT SCHEMA — define TOUR_ACTS as data, one object per act:
     {
       actId: 'A'…'E',
       title, conceptTag,
       engineState: {            // exact, injectable, all values from constants/
         stations,               // ARRAY_PRESETS subset or explicit list
         params: { freqGHz, decDeg, durationHr, noise, method, sourcePreset }
       },
       compute: 'live-60fps' | 'live-on-input' | 'precompute',   // from audit §2 + 0.5
       choreography: [ ... ],    // timeline of scene beats (Canvas 2D, RAF), each
                                 // beat = { t, action } — actions are draw-layer
                                 // directives over REAL engine output, easing
                                 // cubic-bezier(0.25,0.46,0.45,0.94), one primary
                                 // motion per act
       annotations: [ ... ],     // physics-annotation layer instances (1.4)
       liveEquation: {           // KaTeX string + live variable bindings
         tex, bind: { B: 'P.ehtMaxBaselineM87Km', θ: 'P.thetaEhtUas', … }
       },
       narrativeTriple: {        // guided mode only; presenter shows headline only
         artist, scientist, layperson    // three genuinely distinct registers —
       },                        // no shared metaphors, no jargon-swapping, never
                                 // the phrase "like a telescope"
       transition: 'cue' | { autoMs } | 'computation-complete',
       durationMs                // presenter pacing; total tour 4–6 min presenter
     }
1.2  MODE FLAG — mode: 'presenter' | 'guided' threaded through Tour:
     presenter → minimal text (title + one headline line + the live equation),
     advance on cue (ArrowRight / click), choreography auto-plays, all heavy
     compute per the 0.5 decision rule (never jank mid-talk; if a worker run
     exceeds its budget, show the app's spinner pattern and NEVER freeze — a
     timeout fallback swaps in the cached result).
     guided → full text panel with the narrative tier switcher (tabs: ARTIST /
     SCIENTIST / YOU), self-paced, interactive affordances enabled (scrub, drag,
     recompute). Default mode: guided on the site; presenter reachable via
     ?mode=presenter (and a keyboard toggle for the talk).
1.3  KATEX — the single permitted new dependency. Load via CDN <script>+<link> in
     vlbi-react/index.html (no bundler; worker untouched — gotcha: worker.js gains
     no imports ever). Equations render in the HTML text panel, with bound
     variables substituted live from TOUR_PHYSICS and highlighted on change.
     Fallback: if KaTeX fails to load, render the plain tex string — never block.
1.4  PHYSICS ANNOTATION ENGINE — shared, reusable annotation components drawn as
     overlays (SVG or Canvas, position:absolute, pointer-events:none so canvas
     listeners beneath are undisturbed):
       • BaselineVector — real b = computeBaseline(t1,t2), labeled |B| km
       • UVTrace — animated path of REAL (u,v) points (baselineToUV over hour
         angle), moving current-point dot synced to the act's HA clock
       • FillGauge — arc gauge animating to the real computeUVFill() value
       • ResolutionCallout — θ = λ/B with live substitution from tourPhysics
       • ResidualSparkline — Act C: live plot of {iter, residual} progress
         messages from 0.4
       • ConvolutionReveal — Act C intro: the real PSF (worker dirty-beam output)
         swept across the real source to show I_D = I_sky ⊛ B_D
1.5  PROGRESS SPINE — the step indicator is itself a miniature instrument: a tiny
     real UV track that fills as acts complete (computed once from the EHT preset,
     drawn small; not a decorative fake).
1.6  CHROME — site-consistent panels/typography (reuse the existing tour text-panel
     styling; frontend-design skill governs polish). No HUD corner brackets. Exit
     at any act restores the user's pre-tour app state exactly (snapshot on entry,
     restore on close — the tour must never leak state into the tool).

═══════════════════════════════════════════════════════════════════════════════
PHASE 2 — THE FIVE ACTS  (build order = dependency order; commit per act)
═══════════════════════════════════════════════════════════════════════════════
Use TourDiagram.js's existing 1,597 lines of hand-drawn art as STAGING REFERENCE
ONLY (palette, composition instincts, the Atacama scene language). Do not port
drawings 1:1 — every scene's data layer must be engine output. (Risk #2, audit §4.5.)

ACT B — THE SYNTHESIZED APERTURE  (build FIRST: flagship, pure LIVE-60FPS)
  One instrument at escalating scale, all from real station ECEF:
  Beat 1 — two stations (ALMA + IRAM from ARRAY_PRESETS), BaselineVector on a
   modeled Earth; the single (u,v) sample this pair measures right now appears in a
   UV panel (baselineToUV, real numbers, axes in Gλ).
  Beat 2 — the Earth turns (HA clock): UVTrace draws the REAL ellipse as it is
   computed, point by point — guided mode lets the user scrub HA and drag the
   declination; the ellipse re-computes live (it's sub-ms — audit §2).
  Beat 3 — the full EHT 2017 array fades in; computeUVPoints renders the complete
   real coverage; FillGauge animates to the real fill %; ResolutionCallout shows
   θ = λ/B with B = ehtMaxBaselineM87Km (M87*-labeled).
  liveEquation: u(H) = (B_x sinH + B_y cosH)/λ ; narrativeTriple per 1.1.
ACT A — RESOLUTION  (second)
  Real scalars (θ=λ/D vs θ=λ/B from tourPhysics) + the real instrument fingerprint:
  single-dish PSF vs the EHT dirty beam — both computed (mask→IFFT via
  runReconstruction with method:'dirty' on a point source / via the PSF the worker
  already derives), rendered with drawHot/drawContour. live-on-input.
  liveEquation: θ = λ/D → λ/B with live substitution.
ACT C — FROM DATA TO IMAGE  (third; architecture per the 0.5 timing decision)
  The real pipeline on Act B's real coverage: ConvolutionReveal (real PSF ⊛ real
  source) → the real dirty image → CLEAN actually runs (own worker), Residual-
  Sparkline live from progress messages, the restored image resolves in the real
  ContourMap rendering. Guided: noise / method (clean|mem) controls recompute
  on-input with the spinner. Presenter: per decision rule — if precomputed, the
  playback is cached REAL engine frames, never a hand-animation.
  liveEquation: I_D = I_sky ⊛ B_D ; CLEAN loop r ← r − γ·B_D. transition:
  'computation-complete' with a hard timeout → cached fallback (never stall).
ACT D — FIRST LIGHT  (fourth)
  The real M87* photograph (assets/eht-m87-2019.jpg) presented impeccably — full
  bleed, scale bar (42 μas diameter), provenance — PAIRED with the simulator's own
  reconstruction of the same source (presets black-hole.png through the real
  pipeline) side by side: "this is what the instrument you just used produces."
  Static/precompute; the photograph is the one honest illustration in the tour.
ACT E — BEYOND EARTH & THE INSTRUMENT  (last)
  Real BHEX coverage: computeSatelliteECEF + the space branch of computeUVPoints
  (uvCompute.js:20–32, 99–122) draw the actual ground–space UV extension growing
  beyond Earth's limit. Baseline labeled "characteristic ~ R⊕ + h · pending
  sign-off (Marrone/Alejandro)" — geometry real, relation hedged. Then the handoff:
  the closing beat dispatches the existing autoActions (loadEHT etc.) and opens the
  live simulator — the tour's last instrument is the tool itself. CTA: "Place your
  first telescope."

═══════════════════════════════════════════════════════════════════════════════
QUALITY GATES  (binary pass/fail; run per phase AND at the end; fresh port each run)
═══════════════════════════════════════════════════════════════════════════════
  G1  Every act loads in isolation by actId; engineState injection produces the
      correct real outputs (spot-check UV fill % and θ against tourPhysics).
  G2  ZERO hand-faked data anywhere: grep the new acts for hardcoded uv arrays /
      image data / physics literals — every dataset traces to an engine call.
  G3  Numbers gate: 10,883 km / 25 μas (M87*-labeled) identical wherever shown;
      shadow coefficient 2√27 single-sourced; BHEX pending labels intact verbatim.
  G4  Mode gate: presenter shows minimal text + cue advance; guided shows tier
      switcher; the three narration tiers are genuinely distinct (no shared
      metaphors; spot-read all five acts × three tiers).
  G5  Never-stall gate: with the worker artificially delayed (temporary setTimeout
      in dev), Act C shows the spinner and falls back to cache at timeout; the
      tour never freezes mid-advance.
  G6  Exit gate: entering the tour, changing acts, exiting at every act index
      restores the pre-tour app state exactly (snapshot/restore verified).
  G7  KaTeX renders without layout shift; CDN-failure fallback shows plain tex.
  G8  Annotation overlays never intercept canvas events (pointer-events:none
      verified by interacting beneath them in guided mode).
  G9  RAF cleanup on every act unmount (no climbing loops); reduced-motion renders
      each act's final real frame with RAF never starting.
  G10 Console: zero JS errors across all five acts in both modes.
  G11 Performance gate: presenter mode at projector pacing never drops a beat on
      the dev machine; the Phase 0 timing numbers are recorded and the Act C
      decision is documented in TOUR-ENGINE-AUDIT.md.
  G12 The app itself still works exactly as before (Phase 0 extractions were
      behavior-neutral; compare-mode dual workers unaffected).

═══════════════════════════════════════════════════════════════════════════════
CONSTRAINTS
═══════════════════════════════════════════════════════════════════════════════
  • vlbi-react/ only. Root app immutable. worker.js stays a classic worker with
    zero imports (the 0.4 progress flag is the only change, opt-in, non-breaking).
  • KaTeX is the only new dependency, via CDN tags in vlbi-react/index.html.
  • tourPhysics.js is the single source of computed truth — extend it, never
    duplicate it; no physics literal typed into any act or annotation.
  • Existing utilities are reused, not reinvented (uvCompute, constants, presets,
    drawContour/drawHot once extracted, the spinner pattern, autoActions).
  • Tour exported signature + App.js wiring + autoAction types unchanged.
  • Pixel positions from cv.offsetWidth/offsetHeight × dpr; g.filter reset to
    'none' after any blur; easing cubic-bezier(0.25,0.46,0.45,0.94); one primary
    motion per act.
  • Sequential implementation, one act per commit, Playwright-verified on a fresh
    port each time (gotcha #238). Plan-mode approval before any code.

═══════════════════════════════════════════════════════════════════════════════
COMMIT (final)
═══════════════════════════════════════════════════════════════════════════════
  feat(vlbi-react): tour — engine-real rebuild (5 acts driven by live uvCompute/
  worker output, presenter|guided modes, KaTeX live equations, physics annotation
  engine, real CLEAN convergence with progress, timing-gated Act C architecture,
  pre-tour state restore)
