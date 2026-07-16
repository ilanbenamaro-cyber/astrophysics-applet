# VLBI SIMULATOR — CUSTOM-SOURCE PHYSICS CORRECTION  (Claude Fable 5)
# Fable 5 · Plan Mode · maximum effort · frontend-design skill ON
# Run from the astrophysics-applet repo. Base: main (deployed).
# PHASE 0 IS URGENT (wrong physics is LIVE). PHASE 1 IS AN EXPERIMENT — measure before
# you conclude, and conclude before you write a single word of new explanatory copy.

## WHY THIS PASS EXISTS — AND WHAT WE GOT WRONG

Prof. Cárdenas-Avendaño reviewed our explanation of why the Wake Forest seal
reconstructs as a blob and **rejected our framing. He is right. We were wrong.**

WHAT WE SAID (WRONG): "97.6% of the seal's power is zero-spacing / DC flux the array
can never sample; the bright white background is the problem."

WHY THAT'S WRONG: the DC term is the image *mean* — one Fourier bin. Any image with a
bright background puts nearly all its |FFT|² power there; the statistic is close to a
tautology. Losing the zero-spacing measurement costs you the **absolute zero level (a
constant offset)**, NOT the structure. Real VLBI loses the DC term on every observation
and still produces images. We over-weighted a misleading number.

WHAT'S ACTUALLY TRUE (Alejandro's correction):
  • The seal's information lives at **HIGH spatial frequencies** — it is finely detailed,
    and fine detail requires LONG baselines. The black hole is *easier*: a smooth,
    low-frequency ring, marginally resolved at ~1.7× the beam, with its power sitting
    exactly where the array samples.
  • **The real defect is that we are imaging the seal at an astrophysical angular scale
    that isn't its own** — 42–80 μas, i.e. the size of an M87* shadow 16.8 Mpc away.
    In his words: "we are putting the seal in another Galaxy." At that scale the
    lettering is sub-μas, far below the ~3–7 μas beam: ~10–25 resolution elements across
    the entire field when the seal needs hundreds.
  • His prescription: **a user-supplied image must NOT inherit the target's
    astrophysical units.** Give it its own angular scale. "In principle it must be
    recovered if there are enough elements."

This is the same root cause as the bug already found (selectedTarget never becoming
'Custom'; measureRingFraction scaling a non-ring source) — but we only fixed the
LABELING. We did not follow the implication: custom images must be decoupled from
target-derived angular scaling entirely.

<invariants>
vlbi-react/ only; root app immutable; worker.js classic + zero imports — the worker diff
has been EMPTY across every pass; keep it that way (surface for authorization if a worker
change ever seems needed). ALL existing physics untouched: frozen anchors 10,883 km /
25 μas / 42 μas / 2√27; per-target θ (M87* 24.7 etc.); target-observing max baseline;
"Relative coverage" fill; dish means; BHEX characteristic framing. **THE BLACK-HOLE /
RING PATH MUST REMAIN BYTE-IDENTICAL** — it is the scientifically validated path and the
tour depends on it (hash-verify: CLEAN 2154452775 / Dirty 1389367993, 42 μas, DR, beam).
This pass touches the CUSTOM/UPLOAD path only. Public Tour signature, autoActions,
App.js wiring unchanged. Verify on a NEVER-USED port (stale-module gotcha). Use vision
self-critique on every visual. Commit per phase; PAUSE before the push.
</invariants>

═══════════════════════════════════════════════════════════════════════════
PHASE 0 — URGENT: PULL THE WRONG EXPLANATION  (it is live right now)
═══════════════════════════════════════════════════════════════════════════
The "zero-spacing / extended-emission" notice we shipped explains the WRONG physics and
is on the public site. A confidently-wrong explanation is worse than none.
  • REMOVE (or disable) the zero-spacing notice and any copy attributing the seal's
    failure to DC flux / bright backgrounds / "holes in emission" / uniform extended
    emission. Grep for all of it — the notice component, its threshold logic (the
    >50%-unsampled / <10%-measurable trigger), and any strings.
  • The INVERT control may STAY (it is a legitimate, honestly-labeled option — a logo's
    ink becoming the emitter is a real choice), but strip any copy that justifies it via
    the wrong DC story. Re-label neutrally (e.g. "Invert (dark ink → emission)").
  • Do NOT replace it with new explanatory copy yet. Phase 1 must establish the correct
    physics FIRST. Ship nothing that explains anything until we have measured it.
  Commit this alone, immediately. This is the one change that should not wait.

═══════════════════════════════════════════════════════════════════════════
PHASE 1 — THE EXPERIMENT: DOES THE SEAL RECOVER WITH ENOUGH ELEMENTS?
═══════════════════════════════════════════════════════════════════════════
Alejandro's claim, to be tested with measurement, not asserted: *given its own sensible
angular scale, a detailed image IS recoverable, and recovery improves with more elements
(denser u,v coverage / longer baselines).* Run this as a real experiment and report
before changing product behavior.

  1.1 UNDERSTAND THE SCALING PATH. Read exactly how a custom image's angular size is
      currently determined (FOV, SOURCE_FRACTION, scaleSource, the measureRingFraction
      gate, useSimulation's source path). Document the current effective angular size of
      the seal in μas, and WHY it is that size (which target-derived quantity leaks in).

  1.2 THE RESOLUTION-ELEMENT BUDGET (the decisive quantity). For a given array + FOV,
      compute the number of resolution elements across the image:
        N_res ≈ FOV / beam_FWHM   (report both axes; beam from the real engine)
      Report N_res for the seal as currently imaged (expect ~10–25), and estimate how
      many the seal's finest feature (letter stroke width, measured from the actual
      image) would require. Quantify the gap.

  1.3 THE SWEEP — this is the heart of the pass. Reconstruct the seal across a grid and
      record, for each cell: the beam, N_res, the fill %, the recovered image, DR, and a
      HONEST visual verdict (is the square recovered? the ring of text? individual
      letters?). Screenshot every cell.
        • ANGULAR SCALE: image the seal at a sensible own-scale, NOT the BH shadow.
          Sweep the FOV / image angular size across a meaningful range (e.g. the current
          80 μas up through progressively larger fields) so the seal spans increasingly
          many beams.
        • ARRAY / ELEMENTS: EHT 2017 (8) → EHT 2022 → ngEHT Phase 1 (17) → each ± BHEX.
      NOTE THE REAL TENSION and report it explicitly: a larger FOV gives MORE beams
      across the image, but it also shrinks the u,v cell size (Δu = 1/FOV), so the fill %
      DROPS and the coverage gets relatively sparser. Recovery therefore depends on BOTH
      enough angular scale AND enough elements — which is precisely Alejandro's "if there
      are enough elements." Find where recovery actually turns on.

  1.4 CONTROLS. Same sweep on (i) the black-hole ring (must stay byte-identical at its
      validated settings), (ii) a coarse high-contrast shape (e.g. a bold letter or
      simple bright square on dark sky) — something with the seal's *character* but far
      coarser detail. If the coarse shape recovers where the fine seal does not, that
      isolates DETAIL/RESOLUTION as the cause, cleanly, with no DC hand-waving.

  DELIVERABLE: .workflows/_system/CUSTOM-SOURCE-PHYSICS.md — every measured number, the
  full sweep table, all screenshots, and a clear evidence-backed VERDICT:
    "Alejandro confirmed: the seal recovers once it spans ≥ N_res resolution elements
     with ≥ X coverage — recovery is a function of angular scale AND element count.
     Evidence: …"
    OR "Alejandro's expectation does not hold in this engine because … (measured)."
  STOP and surface this verdict to Ilan BEFORE Phase 2. He is sending it to Alejandro.

═══════════════════════════════════════════════════════════════════════════
PHASE 2 — DECOUPLE USER IMAGES FROM ASTROPHYSICAL UNITS  (the real fix)
═══════════════════════════════════════════════════════════════════════════
Implement Alejandro's prescription, informed by Phase 1's measurements.
  2.1 A custom/user image gets its OWN angular scale — it must NEVER inherit the target's
      angular size, shadow scaling, ring-fraction logic, distance, or declination-derived
      sizing. Sever every path by which target-derived scale leaks into a custom source.
      (The 'Custom' target fix landed; this is the deeper decoupling it implied.)
  2.2 Give the user honest control of that scale: a clearly-labeled angular-size control
      for custom images (e.g. "Image size on sky" in μas/mas), with a DEFAULT chosen from
      Phase 1 — a scale at which a typical uploaded image is actually recoverable by the
      default array, so the first-run experience demonstrates the physics working rather
      than failing. Reconstruct live on change.
  2.3 The RING/BLACK-HOLE path keeps its scientifically-correct target-derived units
      (42 μas measured ring, M87* distance/dec) — byte-identical, hash-verified. Two
      regimes, cleanly separated: astrophysical targets use astrophysical units; user
      images use user-set units. Make that distinction legible in the UI, not implicit.

═══════════════════════════════════════════════════════════════════════════
PHASE 3 — REBUILD THE TEACHING MOMENT ON THE CORRECT PHYSICS
═══════════════════════════════════════════════════════════════════════════
Only now, with Phase 1's measurements in hand, write the explanation — and make it the
lesson that is actually true and genuinely better than what we had:
  **Detailed images demand many resolution elements, and resolution elements come from
  baselines. Fine structure lives at high spatial frequencies → long baselines. Add
  elements (2017 → 2022 → ngEHT → BHEX) and the detail comes back.**
  3.1 Surface the REAL computed quantities for the current source + array: the beam, the
      number of resolution elements across the image (N_res), the finest feature the
      array can resolve at this scale, and the fill. All computed from the engine, never
      literals, single-sourced.
  3.2 When an uploaded image's detail is finer than the beam at its current scale, say so
      HONESTLY and ACTIONABLY — name the physics (fine detail ⇒ high spatial frequencies
      ⇒ longer baselines / more elements) and point at the levers that actually help
      (enlarge the image's angular size, add stations, enable BHEX, denser array). Never
      re-introduce the DC/zero-spacing story as the cause.
  3.3 Optional and only if Phase 1 supports it: a small "add elements → watch it resolve"
      affordance that lets the user step 2017 → 2022 → ngEHT → +BHEX on their own image
      and SEE the detail return. If the sweep shows this works, it is the single best
      teaching moment in the app — the physics of aperture synthesis, demonstrated on the
      user's own logo. Vision-verify it lands.
  Copy discipline: the site's one unified voice; DESIGN-LANGUAGE governs; informational
  chrome must not out-bright the gold live-computation layer.

═══════════════════════════════════════════════════════════════════════════
GATES  (binary; vision-verified; never-used port; single + compare modes)
═══════════════════════════════════════════════════════════════════════════
  G0  The wrong zero-spacing notice/copy is GONE from the live path (grep clean); no
      explanatory copy attributes the seal's failure to DC/bright backgrounds anywhere.
  G1  CUSTOM-SOURCE-PHYSICS.md exists with the full measured sweep (angular scale ×
      array), screenshots, N_res budget, the FOV↔fill tension quantified, and an
      evidence-backed verdict. No conclusion without measurement.
  G2  Custom images inherit NO target-derived angular scale (no shadow scaling, no
      ring-fraction, no distance/dec-derived sizing); a labeled angular-size control
      exists with a Phase-1-informed default that actually reconstructs well by default.
  G3  RING PATH BYTE-IDENTICAL: black-hole reconstruction hashes unchanged
      (CLEAN 2154452775 / Dirty 1389367993), 42 μas ring, DR, beam — verified twice on
      fresh ports, before and after every scaling-touching change.
  G4  ALL frozen anchors + per-target θ + max baseline + fill + dish means intact
      (regression probe). Worker diff EMPTY.
  G5  New explanatory copy states ONLY the corrected physics (detail ⇒ high spatial
      frequencies ⇒ long baselines / more elements), with real computed numbers; it is
      actionable; it never fires on the ring.
  G6  If 3.3 ships: stepping the array on a user image visibly recovers detail, and the
      sweep data backs it.
  G7  Zero console errors; app + tour reconstruct unchanged; reduced-motion static.

═══════════════════════════════════════════════════════════════════════════
SHIP
═══════════════════════════════════════════════════════════════════════════
Commit per phase (Phase 0 alone, immediately). Update knowledge: CUSTOM-SOURCE-PHYSICS.md;
gotchas.md — record the CORRECTION ("DC/zero-spacing is NOT why detailed images fail;
losing u=0 costs the zero level, not the structure. The cause is detail below the beam at
the imposed angular scale. Never let a user image inherit a target's astrophysical
units."); decisions.md (two-regime scaling: astrophysical targets vs user images);
codebase.md. /sync. Merge to main and PAUSE for Ilan's "push" — present the gate ledger
AND the Phase-1 verdict (he is sending it to Alejandro), then push on his word.

## STARTING INSTRUCTION
Do PHASE 0 FIRST and commit it — the wrong explanation is live. Then run PHASE 1 as a
real experiment and REPORT THE VERDICT with the full sweep table and screenshots. Change
no product behavior and write no new explanatory copy until that verdict is on the table.
Then present the plan for Phases 2–3.
