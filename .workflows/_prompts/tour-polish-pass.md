# VLBI TOUR — POLISH PASS (engine-real rebuild → exhibition quality)
# Opus · Plan Mode · Ultrathink · frontend-design skill ON (DESIGN-LANGUAGE.md governs)
# Run from the astrophysics-applet repo. The engine-real rebuild is on
# feature/tour-world-class-overhaul (8 commits). This pass refines it. Read the
# whole file, plus TOUR-ENGINE-AUDIT.md and DESIGN-LANGUAGE.md, before planning.

## WHERE THIS STANDS

The 5-act engine-real tour shipped and works: real uvCompute/worker output, the
"gold = live computation" rule, presenter|guided modes, real CLEAN at 98ms. The
bones are right. This pass fixes concrete defects and closes the one thing six
passes never fully delivered — visual RICHNESS and DEPTH to match the rest of the
site. No architecture changes; tourPhysics.js stays the single source of computed
truth; the public Tour contract is unchanged.

Work in two waves: WAVE 1 = objective bugs (an afternoon, ship-blocking before
Harvard). WAVE 2 = richness (narration merge, Earth reuse, galaxy depth, per-act
composition). Commit per item; verify on a fresh port each time (gotcha #238).

═══════════════════════════════════════════════════════════════════════════════
WAVE 1 — OBJECTIVE BUGS  (fix and commit before any richness work)
═══════════════════════════════════════════════════════════════════════════════

W1.1 — IN-FRAME BASELINE COLLISION (Act B / "The Synthesized Aperture"). The frame
  shows THREE different baselines with no distinction: |B| = 8,633 km (the live
  ALMA–IRAM pair), B = 10,883 km (the array M87*-observing max, in the derivation
  box), and "8.3 Gλ coverage" (which derives from 10,883). Each is individually
  correct but together they read as a contradiction — the exact thing
  tourPhysics.js exists to prevent, now happening WITHIN one frame.
  FIX: label every baseline by what it is. The live pair → "|B|_ALMA–IRAM = 8,633 km".
  The array max → "B_max (M87*) = 10,883 km". Make the relationship explicit in the
  copy: this pair is ONE baseline; the array's longest is B_max; rotation fills
  coverage to |u|_max = 8.3 Gλ. All three still computed from tourPhysics — only the
  labeling changes. An EHT scientist must read zero contradiction.

W1.2 — NARRATIVE DUPLICATION BUG. The scientist text renders "8 stations stations
  give 28 baselines baselines …" — a variable bound adjacent to the literal word it
  already contains. Grep ALL narrative strings for doubled tokens (`(\b\w+\b) \1`)
  and fix the interpolation so the bound value and the literal noun don't repeat.
  This is in the most-scrutinized copy; it must be clean.

W1.3 — ACT C RESTORED IMAGE DOESN'T READ AS A BLACK HOLE. The CLEAN math is real and
  ran, but the output is a viridis field with a white blob and contours that don't
  enclose a recognizable ring — while Act D's reconstruction (same engine) clearly
  shows ring structure. Real is not enough; it must be LEGIBLY real.
  DIAGNOSE then FIX: (a) confirm the source preset is the ring/black-hole source,
  not a generic test pattern; (b) the colormap — viridis on a low-DR reconstruction
  buries the ring that the hot colormap (drawHot) reveals; switch Act C's restored
  panel to the same rendering Act D uses so the payoff is visible; (c) confirm the
  DR and the restore beam produce a ring, not a blob. Acceptance: a stranger sees
  "sparse data became a black-hole ring," unmistakably.

W1.4 — ACT E LABEL REPETITION + ARC LEGIBILITY. "pending sign-off" currently appears
  FOUR times on one screen (card, caption, equation box, metrics row). State it
  ONCE, prominently (keep it on the equation/relation, drop the other three). And
  the right panel's dotted arcs are a tangle — the ONE thing the act exists to show,
  coverage EXCEEDING Earth's limit, is muddy. FIX: make the Earth-diameter-limit
  circle a clear reference ring (distinct weight/color), and make the space
  extension visibly cross beyond it — contrast the ground coverage vs the BHEX
  extension by color/opacity so "we left the planet" is instantly legible. Geometry
  stays real (computeSatelliteECEF); only the visual separation improves. Keep the
  BHEX integrity hedge intact (just not four times).

Commit Wave 1 (may be one commit or four). Verify both modes, zero console errors,
numbers still cross-consistent (10,883 / 25 μas / 42 μas / 2√27 intact).

═══════════════════════════════════════════════════════════════════════════════
WAVE 2 — RICHNESS  (the part six passes under-delivered)
═══════════════════════════════════════════════════════════════════════════════

W2.1 — ONE UNIFIED VOICE, NOT THREE TABS  (corrects a literal misread)
  Remove the ARTIST / SCIENTIST / YOU tab switcher entirely. The intent was never
  three audiences to toggle — it was ONE exhaustive explanation per act that lands
  on both an artist AND a physicist simultaneously: the artist won by the visual and
  aesthetic language, the physicist by the scientific rigor, in the SAME text. This
  is a MERGE into a single richer register, NOT a deletion down to the dry
  scientist tier.
  • Delete the tier switcher UI (TourEquation/tier state, the tab control) and the
    three-key narrativeTriple schema.
  • Replace with a single `narrative` per act: exhaustive, precise, and genuinely
    evocative — real physics stated correctly, woven with real sensory/visual
    language, in one voice. Let the FORM find itself per act (flowing paragraph, or
    an evocative lead into precise detail — whatever serves that act), as long as
    the voice is unified and neither audience is shortchanged. The equation stays
    (KaTeX, live-bound). Never the phrase "like a telescope."
  • Test: an MFA reader finds it beautiful AND a radio astronomer finds it exact —
    from the same words, no toggle.

W2.2 — REUSE THE MAIN-PAGE EARTH  (Acts B and E; fixes the flat/glitching globe)
  Acts B and E render a flat blue sphere with no landmass that glitches on rotation.
  The main app already has a correct, textured, stable Earth with marked telescope
  sites. REUSE ITS LOOK — read the main Earth component (the Three.js globe in the
  app: texture/material, land, station markers, rotation handling) and bring that
  look into the tour, rebuilt minimally for the tour's needs:
  • Textured Earth with visible landmasses and the same material/lighting register
    as the main page — NOT a flat sphere.
  • Telescope sites marked the same way the main page marks them.
  • Stable rotation (the tour Earth must not glitch/tear on rotate — match the main
    page's rotation behavior).
  • CRUCIAL DIFFERENCE: the tour Earth is READ-ONLY — NO ability to place additional
    telescopes (the tour shows a fixed configuration; placement belongs to the live
    tool the tour hands off to). Strip the placement interaction; keep look + stable
    rotation + (Act B) the hour-angle scrub that drives the live u,v ellipse.
  • "Rebuild minimally" = reuse the look and the proven rotation, not necessarily the
    exact component wholesale; if importing the main globe read-only is cleanest, do
    that — the decision is whichever gives a textured, stable, placement-free Earth
    that matches the main page by construction. Do not invent a new globe look.

W2.3 — KILL THE DEAD BLACK SPACE  (both levers, equally — your call)
  Every act has too much empty black. Apply BOTH:
  (a) GALAXY FIELD — a deep, parallaxed starfield + subtle nebula background behind
      every act. It must add DEPTH (multiple parallax layers, slow drift, soft
      nebula gradients in the DESIGN-LANGUAGE neutral+accent family), and it must
      stay SUBORDINATE: low contrast, low luminance, slow motion — the live data
      layer (gold) remains the brightest, sharpest thing on screen at all times.
      The galaxy fills the void with richness; it never competes with the
      computation. One shared background module, tuned per act.
  (b) ENLARGE SUBJECTS — scale up the hero visuals and the text so the composition
      fills the frame. The side-by-side panels that read as "two rectangles on
      black" should grow until the frame feels inhabited. Bigger globe, bigger
      contour panels, bigger equation, more generous type — within the
      DESIGN-LANGUAGE scale.
  Together these are the DEPTH fix that's been missing since pass 1: galaxy gives
  background depth, larger subjects give foreground presence, and the gold data
  sits crisp in front of both.

W2.4 — PER-ACT COMPOSITION  (depth + the specific notes)
  • Act B — already the strongest; apply galaxy + the W1.1 labels + the reused Earth.
  • Act A (Resolution) — fine; galaxy + enlarge.
  • Act C (From Data to Image) — needs the most. Beyond W1.3's legibility fix: the
    layout is confusing and the noise control is unintuitive + glitchy. Redesign the
    interaction so "drag = thermal noise" is obvious (clear affordance, label, and a
    smooth non-glitchy response — debounce/clamp the drag, no flicker on recompute),
    and stage the dirty→clean transformation so the causal story (sparse data →
    dirty → CLEAN → ring) reads in sequence, not as two static rectangles. This act
    carries the "does it actually work" payoff; it must be the clearest, not the
    muddiest.
  • Act D (First Light) — content is strong (real photo vs the simulator's own
    reconstruction); it's missing "a layer of depth and excitement" — that's
    COMPOSITION and MOTION, not content. Stage the reveal (the real image present,
    the simulator's reconstruction resolving INTO recognizability beside it),
    enlarge both panels, add the galaxy behind, and give the moment weight — this is
    the emotional peak ("we photographed it"). Make it feel like the climax it is.
  • Act E — apply W1.4 + galaxy; the orbit is good, the coverage panel needs the
    legibility separation.

═══════════════════════════════════════════════════════════════════════════════
CONSTRAINTS  (unchanged from the rebuild)
═══════════════════════════════════════════════════════════════════════════════
  • vlbi-react/ only; root app immutable. worker.js stays classic, zero imports.
  • tourPhysics.js single source of computed truth — every number computed, never a
    literal; W1.1 fixes LABELING, not the values.
  • Reuse over rebuild: the main-page Earth look, drawHot/drawContour, the engine.
  • "Gold = live computation" holds — the galaxy and enlarged chrome never out-bright
    the data layer.
  • Tour exported signature + App.js wiring + autoAction types unchanged.
  • Pixel positions from offsetWidth/offsetHeight × dpr; reset ctx.filter='none'
    after blur; RAF cleanup on every act unmount; reduced-motion renders the final
    real frame, RAF never starts (galaxy parallax included — static when reduced).
  • frontend-design skill informs polish; DESIGN-LANGUAGE.md overrides it.
  • Sequential, commit per item, Playwright-verified per commit on a fresh port.

═══════════════════════════════════════════════════════════════════════════════
QUALITY GATES  (binary; run after each wave + at end, both modes)
═══════════════════════════════════════════════════════════════════════════════
  G1  Act B: every baseline labeled by identity; an EHT reader sees no in-frame
      contradiction; all three values still trace to tourPhysics.
  G2  No doubled words anywhere in narrative (grep clean).
  G3  Act C restored image reads as a recognizable black-hole ring; colormap matches
      Act D; the dirty→clean story reads in sequence; noise drag is smooth, labeled,
      non-glitchy.
  G4  Act E: "pending sign-off" appears once; Earth-diameter limit vs space
      extension visually separated; "coverage exceeds Earth" is instantly legible.
  G5  Single unified narrative per act (no tabs); reads as beautiful AND exact;
      equation still live-bound via KaTeX.
  G6  Acts B & E Earth: textured with landmasses + marked sites, matches the main
      page's look, stable on rotation (no glitch/tear), READ-ONLY (no telescope
      placement).
  G7  Galaxy background present on all acts, multi-layer parallax, subordinate (data
      layer remains brightest/sharpest); subjects + text enlarged; no act reads as
      "rectangles on black."
  G8  Numbers intact and cross-consistent (10,883 / 25 μas / 42 μas / 2√27 / BHEX
      hedge); the live app still reconstructs unchanged; zero tour console errors;
      reduced-motion static (galaxy included); RAF cleanup verified.

═══════════════════════════════════════════════════════════════════════════════
COMMIT (final)
═══════════════════════════════════════════════════════════════════════════════
  feat(vlbi-react): tour — polish pass (in-frame baseline labels, narrative dedup,
  Act C legible ring + smooth noise, Act E coverage clarity, unified single-voice
  narration, reused textured Earth read-only, galaxy depth + enlarged subjects)
