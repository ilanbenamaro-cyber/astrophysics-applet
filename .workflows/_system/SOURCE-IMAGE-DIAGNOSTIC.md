# Source-Image Pipeline Diagnostic — VLBI Simulator

**Date:** 2026-07-13 · **Scope:** vlbi-react/ · **Phase 1 (diagnose only — no code changed, worker diff empty)**
**Trigger:** Prof. Cárdenas-Avendaño uploaded the Wake Forest seal and got a structureless orange
blob ("not even getting the square"), asking whether the site is broken.

All numbers below are **measured** through the app's own pipeline (browser, on a fresh never-used
port), not estimated. FFT of every 512×512 grayscale array was computed and radially binned; a
radix-2 FFT validated against a constant (→ all power at DC) and a unit cosine (→ correct bins).

---

## VERDICT — (C) BOTH, but overwhelmingly PHYSICS

**The seal's poor reconstruction is correct physics the app is honestly displaying (category A).**
The Wake Forest seal is close to the worst-case source for a sparse millimetre-VLBI array:
**97.6% of its power is zero-spacing (total-power) flux the interferometer never samples, and only
0.5% of its total power falls in the spatial-frequency band the array actually measures.** Its
legible features are ~1–2 orders of magnitude finer than the beam. No array configuration (even
with BHEX) can recover it. This is the fundamental limit of aperture synthesis, not an error.

**AND there are real defects in the custom/upload path (category B)** — they do **not** cause the
blob (physics does), but they mis-handle uploaded images and make the tool look broken rather than
instructive. The most important is a genuine bug: **an uploaded image is silently imaged as M87\***
**(42 μas), because the upload/preset handlers never set `selectedTarget = 'Custom'`.** Confirmed
live: with the seal loaded, the app's own readout still says *"Dec: 12.391° · Distance: 16.8 Mpc"* —
it is literally treating the Wake Forest seal as the M87\* black hole 55 million light-years away.

Fixing every category-B defect would **not** make the seal reconstruct well. The headline for
Alejandro is: **this is physics.** The category-B items are the Phase-2 opportunity to turn that
limit into a teaching moment (and to stop mislabeling the upload as M87\*).

---

## 1.1 — The path (file:line)

```
select "WFU Seal" / upload  →  decode to 512² canvas  →  Rec.601 grayscale  →
measureRingFraction + effectiveSourceFraction  →  scaleSource/zoomSource  →
postMessage → worker.js: ×primary-beam taper → FFT → UV mask → IFFT (dirty) → CLEAN → display
```

- **Upload:** `js/useSimulation.js:351-371` — `new Image()` → `drawImage(img,0,0,512,512)` (stretched
  to square) → `getImageData` → grayscale `gs[i]=0.299R+0.587G+0.114B` (`:362`) → `setGrayscale(gs)`.
  Sets `selectedPreset=null` but **never sets `selectedTarget='Custom'`** (`:366`).
- **Presets** (`blackhole`, `wfu-seal`): `IMAGE_PRESETS` `useSimulation.js:26-29` → `handlePresetSelect`
  `:338-349` → `loadImagePresetAsync(url)` `js/presets.js:6-25` (same Rec.601 grayscale, `presets.js:18`).
  The WFU-seal preset loads `../assets/wfu-seal.png` through the identical path as an upload.
- **Scaling branch:** `effectiveSourceFraction` `useSimulation.js:151-157` keys off **`selectedTarget`,
  not the image**: if the target has `shadowUas` it returns `(shadowUas/fovMuas)/ringFraction`, else
  `controls.sourceFraction` (0.50, `:23`). `ringFraction` = `measureRingFraction(grayscale)`
  `:141-145` / `simCore.js:87-101`, banded to `[0.2,0.95]` else 1. `scaleSource`/`zoomSource`
  `simCore.js:61-76 / 105-117`, dispatched `:160-164`. **No normalization/clipping before the worker.**
- **Worker** (`js/worker.js`, classic, zero imports): grayscale × centered Gaussian primary-beam taper
  (`:147-162`, source-independent) → FFT (`:165`) → UV mask (`:71-84`, `:173-180`) → per-baseline
  noise (`:171`) → IFFT dirty (`:182-189`) → CLEAN Högbom 1000 iter (`:239-341`). **Never renormalizes.**
- **Display:** Ground-Truth panel shows the **unscaled** original (`App.js:200`); Dirty/CLEAN
  auto-normalize by min/max (`simRender.js:341-346`), discarding absolute brightness.

**Divergence from the ring path:** the ring got expert-tuned handling (measured ring fraction,
shadow-based angular scale, bright-on-dark polarity). Custom gets **none of that as intended** — it
silently *inherits* M87\*'s scaling while violating every assumption behind it. Custom also still runs
`measureRingFraction` (meaningless for a logo) and has no polarity handling.

---

## 1.2–1.4 — Measured comparison table

Array = EHT 2017, M87\* dec, 12 h, 230 GHz. Beam **8.4 × 10.3 μas** (fitted); nominal resolution
**24.7 μas** (λ/B_max, B_max = 10,883 km = 8.3 Gλ); FOV 80 μas; grid 512². FFT bin = 2.578 Gλ, so
the array measures only radial Fourier bins **~1–3** (u_min ≈ 0.0015 Gλ → DC is unsampled; u_max =
8.35 Gλ → bin 3.24). uv points = 7,298; relative coverage 1.1%.

| Quantity | **Seal (as an image)** | Seal (as the app images it)¹ | **Black-hole ring** | white□/black | black□/white² | thin ring |
|---|---|---|---|---|---|---|
| Mean brightness /255 | **233.7** | 81.3 | 7.9 | 63.8 | 191.3 | 8.9 |
| % pixels near-white (≥240) | **70.0%** | — | 0% | — | — | — |
| % pixels near-black (≤15) | **0%** (darkest=97) | — | 85.4% | — | — | — |
| **DC / zero-spacing power** | **97.6%** | 34.0% | 26.0% | 25.0% | 75.0% | 3.5% |
| **Power in sampled band** (0<u≤8.35 Gλ) | **0.5%** | 51.5% | **39.5%** | 65.1% | 21.7% | 19.5% |
| Power beyond resolution (u>8.35 Gλ) | 1.9% | 14.6% | 34.5% | 9.9% | 3.3% | 77.0% |
| Sampled ÷ (non-DC structure) | **21%** | — | **53%** | — | — | — |
| measureRingFraction | **0.89 (bogus, accepted)** | — | 0.43 (real) | — | — | — |
| Reconstruction (central-concentration³) | **1.11 → central blob** | — | **0.32 → ring** | — | — | — |
| Dynamic range (app metric) | **14:1** | — | 100:1 | — | — | — |

¹ After the app's `scaleSource(0.59)` surrounds the seal with black, it becomes a *bright box on
black*; that box's low frequencies are sampled — but they encode the **box**, not the logo. The
honest measure of the seal-as-an-image is the 0.5% column. ² Black square on white = the seal's
polarity; flipping polarity alone moves **40%** of power from the sampled band into unmeasurable DC
(25%→75%). ³ mean(inner 20% radius) ÷ mean(0.5–0.7 radius): <1 = structured (dark-centre ring),
>1 = featureless central lump.

**Resolution budget.** FOV/beam = 80/24.7 ≈ **3.2** resolution elements across the whole image (≈8.6
using the 9.3 μas fitted beam). The seal's finest legible strokes (ring lettering, "1834") are ≈2.8
μas — needing a beam ≲1.4 μas, i.e. **~9–18× finer**; legible ring text needs **hundreds** of
elements around the ring vs 3–9 available. The black-hole shadow is 42 μas ≈ **1.7×** the nominal
beam (4.5× the fitted beam) — marginally-to-adequately resolved, which is exactly why it works (and
why the tour calls it "a margin of barely a factor of two").

**Visual (rendered by the app).** Ground Truth: the full, legible Wake Forest seal. CLEAN: ~6
featureless orange blobs on a dark field — not the seal, not its outline. Matches Alejandro's report.

---

## 1.5 — Bug hunt (category-B defects, with file:line)

1. **Target-inheritance bug — CONFIRMED LIVE.** `handleFileUpload` (`useSimulation.js:351-371`) and
   `handlePresetSelect` never set `selectedTarget='Custom'`; it stays at the mount default `'M87*'`
   (`:48`). So an uploaded/seal image is scaled by M87\*'s 42 μas shadow branch (`:153-154`) and the
   readout displays "Dec 12.391° · 16.8 Mpc" for the seal. **The app tells the user their logo is the
   M87\* black hole.**
2. **`measureRingFraction` applied to non-ring sources** (`useSimulation.js:141-145`,
   `simCore.js:87-101`): returns **0.89** for the seal, inside the accepted `[0.2,0.95]` band, so a
   meaningless "ring size" mis-scales the image (`effectiveSourceFraction = (42/80)/0.89 = 0.59`).
3. **No polarity handling anywhere.** Dark-ink-on-white logos enter inverted (bright "sky"); the
   control shows this alone pushes power 25%→75% into unmeasurable DC.
4. **Ground-truth display mismatch** (`App.js:200`): the user compares the reconstruction against the
   **unscaled** original, not the scaled/tapered array that was actually imaged.
5. **Aspect-ratio squash** (`useSimulation.js:358`, `presets.js:14`): `drawImage(...,512,512)` stretches
   non-square logos before anything else.

None of these causes the blob — physics does. But they are real, and (1) is a clear bug worth fixing.

---

## Plain-language explanation for Prof. Cárdenas-Avendaño

> The site is working correctly — the seal is simply the hardest possible thing to show an
> interferometer, for three physical reasons we measured on your exact image:
>
> 1. **An interferometer is blind to total power (the zero-spacing baseline).** The seal is dark ink
>    on a bright white field, so it is almost entirely *uniform brightness*. We measured that **97.6%
>    of its signal sits in that zero-spacing component the EHT can never sample** — only **0.5%** of
>    the image's power lands in the range of baselines the array actually measures. (The black-hole
>    image, by contrast, is bright emission on empty dark sky: 40% of its power is in the measurable
>    band, ~80× more.)
> 2. **The lettering is far finer than the beam.** The array resolves ~25 μas across an 80 μas field —
>    about 3 resolution elements across the whole picture. The seal's text needs *hundreds*. It is
>    off by one to two orders of magnitude; even adding the space telescope would not close that gap.
> 3. **The polarity is inverted.** Real sources are a bright object on dark sky; the seal is a dark
>    object on a bright field, which maximizes exactly the total-power component the array cannot see.
>
> So the blob is the honest answer: the few low-order Fourier modes the array can measure, and
> nothing else. It is the fundamental limit of aperture synthesis, demonstrated live on your own
> image — arguably the best teaching moment in the whole tool.
>
> Two caveats on our side, which we will fix: the app currently (a) mislabels an uploaded image as
> the M87\* target (so it says your seal is "16.8 Mpc away"), and (b) gives no explanation or
> "invert" option. Those are UI bugs, not physics — the physics above stands on its own.

---

## Phase-2 options (proposed, NOT built — awaiting approval)

- **Fix the target-inheritance bug** (`selectedTarget='Custom'` on upload/preset-select) and stop
  running `measureRingFraction` on non-ring sources. *Touches scaling → must re-verify the ring/preset
  reconstructions stay byte-identical before shipping.*
- **A computed diagnostic notice** when an uploaded image is ill-suited: derive the numbers above from
  the real pipeline (DC fraction, sampled fraction, beam vs feature size) and state them honestly — no
  invented values.
- **A labeled "Invert" option** (off by default) so a logo's ink becomes the emitter on dark sky.
- **A scaling/normalization pass** for arbitrary images (analogous to what `measureRingFraction` did
  for the ring) — surfaced separately since it touches physics.

**STOP — presenting the verdict. No Phase-2 change will be made until approved.**
