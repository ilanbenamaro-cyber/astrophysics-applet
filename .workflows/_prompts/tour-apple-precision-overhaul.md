# VLBI TOUR — APPLE-PRECISION OVERHAUL (all 8 acts)
# Opus · Plan Mode · Ultrathink
# Run from the astrophysics-applet repo. Read this whole file before planning.

## MISSION

The tour is physically correct but visually templated. A human reviewer described
it as "cookie-cutter, lacking depth, fullness, and clarity." The diagnosis is exact
and it maps onto Apple's own three Human Interface principles — which is the bar
we are now holding this to:

  • CLARITY  — every quantity and every comparison is instantly legible. Nothing
    requires squinting; nothing reads as decorative noise.
  • DEFERENCE — chrome serves content and disappears. The subject owns the frame.
    Repeated UI furniture (HUD brackets, concept tags, identical glass cards) is
    the enemy of deference and is the source of the "cookie-cutter" feeling.
  • DEPTH — real dimensional layering and a single consistent light source give
    every scene physical presence. Flat subjects on a gradient are forbidden.

The previous pass tried to fix "blank" and "flat" by ADDING chrome. That is why it
looks templated: the same four-layer UI shell (corner brackets + concept tag +
glass derivation card + footer stats) is stamped onto all eight acts, and a card
floating in a void does not fill the frame — it labels the void. This pass does the
opposite of uniform: each act's hero subject grows until it commands the space, the
repeated card chrome is reduced to the two acts that genuinely need it, and depth is
built per-act the way Act 1 already does well.

Outcome: an EHT scientist screenshots any single frame and finds (1) correct,
self-consistent, self-deriving physics, inside (2) a composed, dimensional image
with one clear subject and one clear idea. Apple-level precision and restraint.

The public contract is unchanged: Tour({actIndex,onActChange,onClose,onTourAction,
reducedMotion}), TOUR_ACTS shape, autoActions, diagramId→d01–d08, and the per-act
useRef+useEffect+RAF+cleanup+reduced-motion pattern. tourPhysics.js remains the
single source of computed truth.

═══════════════════════════════════════════════════════════════════════════════
PHASE 0 — PHYSICS CONFIRMATION  (do this FIRST; no visual work until it passes)
═══════════════════════════════════════════════════════════════════════════════

The computed numbers were unified last pass, but the SYMBOLIC formulas drawn in the
cards were never audited. There is at least one real error. Fix the physics before
touching a pixel, and write the result to .workflows/_system/TOUR-PHYSICS-AUDIT.md.

P0.1 — SHADOW COEFFICIENT BUG (confirmed, must fix)
  Act 5 (d05) renders:  shadow ≈ 2√27 · GM/(c²d)        — CORRECT (diameter)
  Act 6 (d06) renders:  θ_shadow = 3√3 · GM/(c²·D_L) ≈ 42 μas  — WRONG
  Reason: b_c = √27 GM/c² = 3√3 GM/c² is the critical impact parameter = shadow
  RADIUS. The angular DIAMETER (the 42 μas figure) is 2·b_c/d = 2√27 GM/(c²d)
  = 6√3 GM/(c²d). Act 6 pairs the RADIUS coefficient (3√3) with the DIAMETER value
  (42 μas) — a factor-of-2 inconsistency, and it disagrees with Act 5.
  Numerical check to reproduce: M=6.5e9 M☉, d=16.8 Mpc ⇒ GM/(c²d) ≈ 3.8 μas;
  2√27 × 3.8 ≈ 40 μas (✓ diameter), 3√3 × 3.8 ≈ 20 μas (radius).
  FIX: make Act 6 use the diameter form 2√27 GM/(c²d) (= 6√3) so it equals Act 5,
  OR relabel as radius with ≈21 μas. Use the DIAMETER (42 μas) — it's the ring the
  image shows. Both acts must render the identical coefficient. Add b_c/shadow as
  computed fields in tourPhysics.js (m87ShadowUas already exists — derive the
  coefficient symbol from one constant so the two acts can never diverge again).

P0.2 — MAX BASELINE VERIFICATION (suspicious; confirm against validated coords)
  Every act shows B_max = 11,406 km (ECEF-derived from constants.js). The accepted
  EHT 2017 longest baseline is ~10,700 km. 11,406 is high enough to question.
  ACTIONS:
   • Confirm tourPhysics.js computes the pairwise max via the IMPORTED latLonToECEF
     from uvCompute.js (NOT a replicated copy). If it still replicates, fix that —
     coordinate math is the function Marrone caught a longitude sign error in
     (54c855b); a copy can silently drift. Single source on coordinates, always.
   • Print the per-pair baselines to console; identify which station pair yields the
     max and its value. Confirm the ECEF chord distance math is right (straight-line
     through Earth, not great-circle — VLBI baselines are chord/vector length).
   • Cross-check the max against a known reference. If constants.js coords produce
     11,406 and that disagrees with Marrone's validated set, flag it in the audit;
     do NOT silently "correct" coordinates — they are physics-critical and
     Marrone-owned. Report the discrepancy for sign-off.
   • Whatever the confirmed value, it must appear IDENTICALLY in Acts 1, 2, 4, 7, 8
     (all already read tourPhysics.js — verify after any change).

P0.3 — RATIO CLARITY (not wrong, but must not read as contradiction)
  Act 1 card: "1.1×10⁵× sharper" (= θ_dish/θ_EHT = 2.7″/24 μas ≈ 112,500).
  Act 1 prose: "more than 60,000 times smaller" (= θ_dish/shadow = 2.7″/42 μas ≈ 64,000).
  Both correct, different comparisons. FIX: label them so the distinction is explicit
  — e.g. card says "×1.1e5 finer resolution than one dish"; prose keeps "the shadow is
  ~64,000× smaller than a single dish can resolve." Never show two unexplained ratios.

P0.4 — FULL VALUE TABLE (recompute each from tourPhysics.js; confirm cross-act identity)
  λ(230 GHz)=1.30 mm ; D=100 m ; θ_dish=λ/D=2.68″≈2.7″ ; B_max=[P0.2 result] ;
  θ_EHT=λ/B_max (≈24 μas if B=11,406) ; u_max=B_max/λ (≈8.8 Gλ) ;
  improvement=θ_dish/θ_EHT (≈1.1e5) ; m87Shadow=42 μas (diameter) ; sgrA=50 μas ;
  M_M87≈6.5e9 M☉ ; b_c=√27 GM/c² (radius) ; shadowDiam=2√27 GM/(c²d) ;
  BHEX: B_space~R⊕+h from BHEX_PRESET.orbitalAltitudeKm, θ~λ/B_space — ALL BHEX
  figures + the B~R⊕+h relation itself stay marked "pending sign-off (Marrone/
  Alejandro)" and "orbital-radius simplification." Do not promote them to fact.
  Gate: every displayed number == its formula; identical values appear identically
  across acts. If any check fails, fix before Phase 1.

═══════════════════════════════════════════════════════════════════════════════
THE THREE LAWS  (these REPLACE the prior "four laws" — apply per-act, not uniformly)
═══════════════════════════════════════════════════════════════════════════════

LAW 1 — DEFERENCE (kills cookie-cutter)
  • Corner HUD brackets (drawHudFrame): REMOVE from all acts. They are the single
    biggest source of the templated look and add zero information.
  • Concept tag (drawConceptTag): keep, but make it quiet — one small line, low
    opacity, top-left. It is a chapter marker, not a UI chrome element.
  • Glass derivation card (drawDerivationPanel): keep ONLY in Act 1 and Act 5, where
    a side-by-side formula comparison is the actual content. In ALL other acts,
    DELETE the floating card and integrate its physics into the scene as labels:
      – Act 2: VCZ + u=B/λ become a caption beneath the UV plane and a label on the
        baseline itself, not a boxed card.
      – Act 3: the u,v(H,δ) lines become a small ticked annotation beside the ellipse
        axes (where v₀ already labels the center), not a bottom card.
      – Act 4: the θ=λ/B line lives in the footer stat strip only.
      – Act 7: keep ONLY the integrity-labeled BHEX relation (it must stay visible);
        slim it to two lines + the pending tag.
      – Act 8: metrics live in the panel chrome and FITS terminal, no extra card.
  • Result: cards appear in 2 of 8 acts. The repetition that read as "template"
    is gone. The screen defers to the subject.

LAW 2 — CLARITY (every comparison legible at a glance)
  • Act 1: the RIGHT-side resolved source is currently missing/invisible. The act is
    blurry-vs-sharp; both must be unmistakable. Draw the sharp 6-spike + Airy source
    at the beam convergence, clearly distinct from the left blurry smear.
  • Act 4: FIX label collisions — ALMA/APEX overprint into "APEX", and SMT/another
    overprint into "SGMT". Implement label dodging (offset co-located stations,
    leader lines if needed). Co-located pairs (ALMA+APEX, SMA+JCMT) get one dodged
    label each. Continents are unrecognizable blobs — redraw as recognizable (even
    stylized) landmasses so the frame reads unambiguously as Earth.
  • Act 7: the two corner insets (EHT-Ground vs EHT+BHEX) show identical black holes.
    The whole point is the difference. Make EHT-Ground a visibly FUZZIER / thicker
    ring and EHT+BHEX a visibly SHARPER / thinner ring with finer structure. The
    24 μas vs ~8 μas difference must be obvious without reading the numbers.
  • Act 8: the EHT 2017 vs ngEHT Phase 1 rings look identical. ngEHT must look
    measurably sharper — crisper ring, finer photon-ring substructure, higher
    apparent dynamic range (more contrast, more visible faint extended emission).
    DR ~50:1 vs ~200:1 must be SEEN, not just printed.

LAW 3 — DEPTH + SUBJECT SCALE (kills flat + blank)
  • Single key light, upper-left, across ALL acts → consistent highlight side and
    contact shadow side on every dish, sphere, ring, panel.
  • Three depth planes per act: far (nebulae/stars, desaturated, ctx.filter blur —
    reset to 'none' after, gotcha #484), mid (the subject, lit + contact-shadowed),
    near (one foreground accent at higher contrast). Act 1 already does this — match
    its standard everywhere.
  • EARTH IS DEAD in Acts 3 and 7 — a flat teal sphere reading as a button. Model it:
    day/night terminator aligned to the key light, subtle surface (faint land/ocean
    tonal variation or a soft texture), limb atmosphere glow (already present), and a
    rotation cue in Act 3. It must read as a planet.
  • SUBJECT OWNS THE FRAME. The recurring failure is a tiny subject marooned in black
    with chrome compensating. Mandate per weak act:
      – Act 2: dishes are specks with ~50% empty sky above. Enlarge the two dishes
        substantially; bring the wavefront sweep to life across the (now purposeful)
        upper space; enlarge the UV plane. The baseline geometry should dominate.
      – Act 5: the ring floats mid-canvas with large voids top and bottom and only a
        clean result shown. (a) Enlarge the ring. (b) SHOW THE TRANSFORMATION: the
        dirty, sidelobe-riddled image must be visible dissolving INTO the clean ring
        — "From Noise to Image" requires showing the noise. (c) Integrate the
        stranded bottom formula into the scene.
      – Act 8: ring panels are mostly empty interior. Let each ring fill its panel;
        add faint extended structure so the panels feel inhabited.
  • "Filled" means the hero subject is large and dimensional — NOT more boxes.

═══════════════════════════════════════════════════════════════════════════════
PER-ACT BRIEFS  (ordered easiest→hardest; each preserves RAF/cleanup/reduced-motion)
═══════════════════════════════════════════════════════════════════════════════

d06 First Light — STRONGEST, light touch.
  Keep the real JPEG as hero, scale bar (42 μas — verify it's the diameter), and
  provenance. Only fix: the info card floats in a large empty right margin. Either
  widen the image to reduce the void or reposition the card to sit against the image.
  Remove HUD brackets.

d01 Resolution Problem — SECOND STRONGEST.
  Keep the Atacama depth (it's the reference standard). FIXES: (1) add the missing
  sharp resolved source on the right — 6-spike + Airy at the beam convergence,
  unmistakably distinct from the left blurry smear (LAW 2). (2) Close the dead band
  between the right card and the dishes — rebalance the right composition.
  (3) Apply P0.3 ratio-clarity wording. (4) Remove HUD brackets. Keep the glass cards
  here (this is a legitimate comparison act). Confirm 2.7″ and θ_EHT read from
  tourPhysics.js.

d03 Earth-Rotation Synthesis — ellipses are the best Fourier visual; Earth is dead.
  FIXES: (1) model the Earth (LAW 3) — terminator, surface, rotation cue. (2) Draw an
  actual station PAIR + baseline VECTOR on the globe, colored. (3) Color-link that
  baseline to the specific ellipse it traces in the (u,v) plane — left and right are
  currently two unrelated pictures; this single colored thread IS the concept.
  (4) Convert the bottom glass card to a slim annotation beside the ellipse axes
  (LAW 1). (5) Remove HUD brackets. Keep v₀=B_Z cosδ/λ center label.

d07 BHEX — dramatic orbit is good; Earth dead; insets illegible; integrity labels
  PERFECT and must be preserved verbatim.
  FIXES: (1) model the Earth (LAW 3). (2) Make the two insets show an OBVIOUS
  difference (LAW 2): EHT-Ground = fuzzy thick ring; EHT+BHEX = sharp thin ring with
  finer detail. (3) Slim the big bottom card to the integrity-labeled relation only
  (B_space~R⊕+h characteristic radius, θ~λ/B_space, ⚠ orbital-radius simplification,
  pending sign-off Marrone/Alejandro) — keep every pending/⚠ marker; never present
  B~R⊕+h as a clean equality. (4) Remove HUD brackets.

d04 EHT Array — busy but unclear.
  FIXES: (1) recognizable continents (LAW 2). (2) label dodging for ALMA/APEX and the
  SMT collision (LAW 2). (3) kill the empty dark-blue band at the bottom of the map.
  (4) verify station coords are read from constants.js, none invented; verify
  baseline count (28 = C(8,2); "21 independent" if matching EHT phrasing — confirm
  against constants.js). (5) θ=λ/B in the footer strip only; delete any floating card.
  (6) Remove HUD brackets. (7) confirm B_max == P0.2 value, == Acts 1/2/7/8.

d02 The Baseline — WEAK: tiny dishes, ~50% empty top, boxed card.
  FIXES: (1) enlarge the two dishes so the baseline geometry dominates (LAW 3).
  (2) animate the wavefront sweep meaningfully across the upper space so it is
  purposeful, not blank. (3) enlarge the UV plane and label its axes in Gλ.
  (4) convert the VCZ glass card into an integrated caption + a label on the baseline
  (LAW 1); keep V(u,v)=∬I(l,m)e^{−2πi(ul+vm)}dl dm, τ_g=(B·ŝ)/c, u=B/λ⇒~8.8 Gλ.
  (5) Remove HUD brackets.

d05 Deconvolution — WEAK: only the CLEAN result shown; two flanking cards; big voids.
  FIXES: (1) SHOW THE TRANSFORMATION (LAW 3) — render the dirty, sidelobe-riddled
  image and dissolve it into the clean photon ring over the act's motion. The act is
  "From Noise to Image"; the noise must appear. (2) enlarge the ring. (3) keep the two
  comparison cards (this is the second legitimate card act) but tighten them; apply
  the P0.1 corrected shadow coefficient (2√27, == Act 6). (4) integrate the stranded
  bottom formula I^C=(M⊛G)+r_final into the scene or remove it. (5) Remove HUD brackets.

d08 The Simulator — WEAK: identical rings, empty panel interiors.
  FIXES: (1) make ngEHT Phase 1 visibly sharper + higher-DR than EHT 2017 (LAW 2) —
  this is the entire purpose of the act. (2) let each ring fill its panel with faint
  extended structure (LAW 3). (3) keep the FITS terminal + metrics chrome (good, on-
  brand); no extra floating card. (4) confirm all four metrics per array trace to the
  same derivations the live app uses (no invented DR/beam/fill); confirm beam values
  are self-consistent (the old 24-vs-20 contradiction must stay resolved). (5) keep
  the luminous CTA. (6) Remove HUD brackets.

═══════════════════════════════════════════════════════════════════════════════
EXECUTION  (sequential, single file — no parallel edits to TourDiagram.js)
═══════════════════════════════════════════════════════════════════════════════
  Phase 0 — Physics audit + fixes in tourPhysics.js and the symbolic formula strings.
            Write TOUR-PHYSICS-AUDIT.md. Verify console values. Commit.
  Phase 1 — Deference + chrome removal across all 8 (remove HUD brackets; delete the
            6 floating cards; quiet the concept tags). One commit — this alone will
            transform the templated feel and is low-risk.
  Phase 2 — Depth + subject scale + Earth modeling, in 4 checkpoint commits:
            d06+d01 → d03+d07 → d04+d02 → d05+d08. Each: implement → Playwright
            verify → commit.
  Phase 3 — Clarity pass: comparison legibility (Acts 1,4,7,8), label dodging (4),
            transformation reveal (5). Verify → commit.
  Phase 4 — Review: physics recompute + visual checklist + console/RAF pass on all 8.

═══════════════════════════════════════════════════════════════════════════════
VERIFICATION  (after each batch, not just at the end)
═══════════════════════════════════════════════════════════════════════════════
  1. Fresh port (gotcha #238 — ES-module cache survives navigation):
     pkill -f "http.server"; python3 -m http.server 8092 --directory "<repo>"
  2. Playwright: open tour, step each act (ArrowRight), screenshot per act.
  3. PHYSICS PASS: recompute every displayed number against tourPhysics.js; confirm
     B_max identical across Acts 1/2/4/7/8; confirm Act 5 and Act 6 render the SAME
     shadow coefficient (2√27); confirm BHEX figures all carry pending labels.
  4. DEFERENCE PASS: zero HUD corner brackets anywhere; glass cards present in ONLY
     Acts 1 and 5; concept tags quiet.
  5. CLARITY PASS: Act 1 sharp source visible & distinct; Act 4 no overlapping labels,
     continents recognizable; Act 7 insets visibly different; Act 8 ngEHT visibly
     sharper than EHT 2017.
  6. DEPTH PASS: every act has 3 planes + upper-left key light + contact shadows;
     Earth modeled (not flat) in Acts 3 and 7; weak acts' subjects now own the frame.
  7. CONSOLE/RAF: zero JS errors; advancing past each act fires cancelAnimationFrame
     (no climbing frame counters / leaked loops).
  8. REDUCED MOTION: a11y.reducedMotion → complete static final frame, RAF never starts.

═══════════════════════════════════════════════════════════════════════════════
CONSTRAINTS
═══════════════════════════════════════════════════════════════════════════════
  • vlbi-react/ only; never root js/ css/ index.html.
  • tourPhysics.js stays the single source of computed physics; symbolic formula
    coefficients also derived from one place so Act 5/Act 6 can't diverge again.
  • latLonToECEF imported from uvCompute.js, never replicated.
  • Zero invented physics; BHEX figures AND the B~R⊕+h relation stay pending-labeled.
  • Every act useEffect returns cancelAnimationFrame cleanup; no RAF leaks.
  • All pixel positions from cv.offsetWidth/offsetHeight × dpr.
  • Reduced-motion draws final static frame only (existing draw(999) gate).
  • Append-only for shared utils; don't edit a sibling act's body within a batch.
  • Tour exported signature + App.js wiring + autoAction types unchanged.

═══════════════════════════════════════════════════════════════════════════════
COMMIT (final)
═══════════════════════════════════════════════════════════════════════════════
  feat(vlbi-react): tour — Apple-precision overhaul (shadow-coefficient physics fix,
  baseline verification, chrome removal for deference, per-act depth + Earth modeling,
  subject-owns-frame scale, legible comparisons, dirty→clean transformation)
