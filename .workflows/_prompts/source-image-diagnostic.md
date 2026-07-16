# VLBI SIMULATOR — SOURCE-IMAGE PIPELINE DIAGNOSTIC
# Opus or Fable · Plan Mode · ultrathink
# Run from the astrophysics-applet repo. Base: main (deployed).
# PHASE 1 IS DIAGNOSTIC ONLY — INSTRUMENT AND REPORT BEFORE CHANGING ANYTHING.

## WHY THIS EXISTS

Prof. Cárdenas-Avendaño uploaded the Wake Forest seal as a custom source and the
reconstruction produced a structureless orange blob — "not even getting the square."
He is asking whether the site is broken.

THE HYPOTHESIS TO TEST (do not assume it — MEASURE it): the array is fine and the
SOURCE is pathological for an interferometer. Three physical reasons, each of which
must be quantified:
  (a) ZERO-SPACING FLUX: an interferometer never samples the DC / zero-baseline
      component. The seal is dark ink on a WHITE background — i.e. a uniformly BRIGHT
      square field with the logo as *holes* in the emission. Uniform extended brightness
      is almost entirely low-spatial-frequency power, which this array cannot measure.
      Expect the interior to mush out and only edges to partially survive.
  (b) RESOLUTION BUDGET: beam is ~3.0 × 2.3 μas in an 80 μas FOV ⇒ only ~27 resolution
      elements across the image. The seal's lettering needs HUNDREDS of elements across
      to be legible. Off by >1 order of magnitude — no array here (even + BHEX) can
      resolve it.
  (c) CONTRAST POLARITY: the source is inverted vs. a real astrophysical object —
      emission should be the OBJECT on empty dark sky; here the "sky" glows white and
      the object is dark.

BUT: the custom/upload path is the LEAST-TESTED code in this app. Every physics pass
(P1–P5), every stress test, and the ring-fraction fix explicitly scoped AROUND it
("non-ring sources and Custom are byte-identical via the sanity band"). Nobody has ever
stress-tested the source-image pipeline. So a real bug could be hiding there, and we do
NOT get to tell a physics advisor "that's just physics" until we have measured it.

INSTRUMENT FIRST. This is the project's hardest-won rule (threshold/valued guessing costs
10+ iterations). Do not "fix" anything in Phase 1.

<invariants>
vlbi-react/ only; root app immutable; worker.js classic + ZERO imports (do not modify in
Phase 1). tourPhysics/app compute are single sources of truth; frozen anchors intact
(10,883 / 25 μas / 42 μas / 2√27 / BHEX characteristic framing). Public Tour signature,
autoActions, App.js wiring unchanged. Verify on a NEVER-USED port (stale-module gotcha).
Any change that would alter reconstruction behavior for EXISTING sources (black-hole
ring, synthetic presets) must be surfaced, not made silently.
</invariants>

═══════════════════════════════════════════════════════════════════════════
PHASE 1 — DIAGNOSE  (measure only; write a report; change NOTHING)
═══════════════════════════════════════════════════════════════════════════

Trace and instrument the FULL custom-source path, end to end:
  upload → decode → grayscale conversion → scaling / SOURCE_FRACTION / FOV placement →
  normalization → FFT (worker) → UV mask → dirty image → CLEAN → display

1.1 — READ THE PATH. Document every step with file:line: how an uploaded image becomes
  the `grayscale` Float array the worker consumes (presets.js loaders, the upload
  handler in useSimulation.js, scaleSource in simCore.js, SOURCE_FRACTION handling, any
  normalization). Note exactly where the custom path DIVERGES from the black-hole-ring
  path — the ring path got measureRingFraction; what does Custom get?

1.2 — MEASURE THE INPUT (the seal, as the app actually ingests it). Report:
  • The pixel-value HISTOGRAM of the grayscale array the worker receives. What fraction
    of pixels are near-max (the white background)? Near-min (the ink)?
  • MEAN / DC level. What fraction of TOTAL FLUX sits in the zero-spatial-frequency
    component? (This is the crux of hypothesis (a) — quantify it.)
  • What fraction of the FOV does the image span (the effective source fraction)? Is it
    being scaled sensibly, or is SOURCE_FRACTION 0.525 (the ring-era value) being applied
    to a source it doesn't fit?
  • Is the white background SATURATING / clipping? Is normalization dividing by a max
    that the background sets, crushing the ink's dynamic range?

1.3 — MEASURE THE FOURIER TRUTH. For the seal's grayscale array:
  • Compute the power spectrum. What fraction of total power lies BELOW the shortest
    baseline the array samples (i.e. in the unsampled zero-spacing hole)? What fraction
    lies ABOVE the longest baseline (i.e. beyond the array's resolution)?
  • Quantify: how much of the seal's information is in spatial frequencies this array
    can actually measure? Give a percentage.
  • Compare the SAME analysis for the black-hole ring source (which reconstructs well).
    The contrast between the two IS the answer to Alejandro's question — make it a table.

1.4 — MEASURE THE RESOLUTION BUDGET. Beam FWHM (3.0 × 2.3 μas) vs FOV (80 μas) ⇒
  resolution elements across the image. Then: how many elements across does the seal's
  finest legible feature (the ring lettering, the "1834") require? State the ratio.
  Do the same for the ring (42 μas shadow vs 3 μas beam) to show why IT works.

1.5 — HUNT FOR AN ACTUAL BUG (this is why we don't assume). Check specifically:
  • Does the custom path apply the ring-era SOURCE_FRACTION / scaling assumptions that
    only make sense for a ring? (The ring fix measured the ring's true extent — Custom
    may still be using a value that mis-scales arbitrary images.)
  • Is grayscale conversion sane (luminance-weighted, not a naive channel pick)?
  • Is there an inversion/polarity assumption anywhere?
  • Any normalization, clipping, or dtype bug that only bites non-ring sources?
  • Does the primary-beam taper (now D-dependent post-N5) interact badly with a
    full-frame source?
  • Test 2–3 CONTROL images to isolate: (i) a filled white square on black, (ii) a black
    square on white (the seal's polarity), (iii) a simple ring. Report how each
    reconstructs. This cleanly separates "polarity/DC problem" from "code bug."

DELIVERABLE (Phase 1): .workflows/_system/SOURCE-IMAGE-DIAGNOSTIC.md containing:
  • The path trace (file:line).
  • All measured numbers above (histograms, DC fraction, power-spectrum split, resolution
    ratio) for the SEAL vs the RING vs the control images — as a comparison table.
  • THE VERDICT, stated plainly: is the seal's poor reconstruction (A) correct physics
    the app is honestly displaying, (B) a real bug in the custom-source path, or
    (C) both — and if (B) or (C), the exact defect with file:line.
  • A plain-language explanation suitable to send to Alejandro, grounded in the measured
    numbers, not in hand-waving.
THEN STOP. Present the verdict before proposing or making any change.

═══════════════════════════════════════════════════════════════════════════
PHASE 2 — FIX / IMPROVE  (only after I approve the Phase-1 verdict)
═══════════════════════════════════════════════════════════════════════════
Scope depends on the verdict. Propose, do not pre-build:

2.1 — IF A REAL BUG EXISTS: fix it. Any fix that could change reconstruction for the
  ring/presets must be surfaced first (the ring's behavior is expert-verified and frozen).

2.2 — IF IT IS PHYSICS (likely, per the hypothesis): the app currently LOOKS broken to a
  user who uploads a logo — including a physicist. Turn the limitation into the teaching
  moment it deserves to be. Propose (with reasoning, for my approval):
  • A DIAGNOSTIC NOTICE when an uploaded image is poorly suited: detect the condition
    from the MEASURED quantities (e.g. large fraction of flux in the unsampled
    zero-spacing hole, and/or finest features far below the beam), and surface an honest,
    specific explanation — "Interferometers do not sample the zero-spacing (total power)
    component. This image's flux is X% smooth extended emission, which the array cannot
    recover. Fine features require ~N× finer resolution than this beam. This is a physical
    limitation of aperture synthesis, not an error." Numbers COMPUTED, never invented.
  • An explicit, LABELED INVERT option so a logo's ink becomes the emitter on dark sky
    (physically sensible: emission = object, background = empty sky), letting a custom
    image behave like a real source. Off by default; clearly explained.
  • Any scaling/normalization improvement for arbitrary images (analogous to what
    measureRingFraction did for the ring) — surfaced separately since it touches physics.
  This is potentially the best teaching surface in the whole tool: the fundamental limit
  of aperture synthesis, demonstrated live on the user's own image.

═══════════════════════════════════════════════════════════════════════════
GATES
═══════════════════════════════════════════════════════════════════════════
  G1  SOURCE-IMAGE-DIAGNOSTIC.md exists with EVERY number measured (not estimated), the
      seal-vs-ring-vs-controls table, and a plain verdict (A/B/C) with file:line for any
      defect.
  G2  No change made in Phase 1. Worker diff EMPTY. Frozen anchors intact.
  G3  (Phase 2, if approved) Existing sources — black-hole ring, synthetic presets, all
      targets — reconstruct BYTE-IDENTICALLY unless a change was explicitly approved;
      re-run the physics probe.
  G4  (Phase 2) Any notice/invert feature computes its numbers from the real pipeline;
      zero invented values; zero console errors; a11y + reduced-motion respected.

## STARTING INSTRUCTION
Read the source-image path end to end. Then INSTRUMENT and MEASURE per Phase 1 — the
seal, the ring, and the control images. Write SOURCE-IMAGE-DIAGNOSTIC.md and PRESENT THE
VERDICT. Do not fix, do not propose UI, do not touch the worker until I approve.
