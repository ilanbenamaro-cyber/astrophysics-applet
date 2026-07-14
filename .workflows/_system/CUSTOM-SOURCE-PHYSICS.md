# Custom-Source Physics — The Recovery Experiment

**Date:** 2026-07-14 · **Scope:** vlbi-react/ · **Phase 1 deliverable (measurement only; no product change)**
**Prompted by:** Prof. Cárdenas-Avendaño's rejection of our zero-spacing explanation — he is right,
and this experiment tests his counter-claim: *"a user-supplied image must not inherit the target's
astrophysical units… in principle it must be recovered if there are enough elements."*

**The correction we owe first:** our shipped notice attributed the seal's failure to unsampled
DC/"extended brightness." That was wrong. The DC bin is one Fourier coefficient — the image mean.
Losing u=0 costs the **absolute zero level (a constant offset)**, not structure; every real VLBI
observation lacks it and images fine. The 97.6%-of-power-in-DC statistic was near-tautological for
any bright-background image and explained nothing. That notice has been removed (Phase 0, commit
2c3b188). What follows is what is actually true, measured.

---

## VERDICT — Alejandro CONFIRMED, with a measured refinement

**Given its own angular scale, the seal IS recoverable by this engine, and recovery improves with
elements — exactly as he said.** At the scale we were imposing (an M87\*-shadow-sized field), *no*
array recovers it, including ngEHT+BHEX: the failure was the imposed scale, not the instrument.

The refinement the sweep adds: recovery is a function of **angular scale AND element count
jointly**, and for a sparse array more scale eventually *hurts* — the u,v cell size shrinks as
1/FOV, so the same tracks occupy a collapsing fraction of the sampled disk (EHT 2017: 82% → 4.4%
occupancy from 80 → 3,200 μas) and sidelobe striping takes over. Each array has a sweet spot;
denser arrays push it further out and recover more before hitting it.

Headline cells (full grid below; montages committed beside this file):

- **Today's behavior (80 μas field): mush for every array.** Even ngEHT Phase 1 + BHEX gives
  4-blob structure (NCC 0.787). *"We are putting the seal in another Galaxy"* — confirmed.
- **EHT 2017 (8 stations), seal at 800 μas:** the square and coarse banding recover
  (NCC 0.824, its optimum); text never resolves; beyond 800 μas it degrades (0.704 @3,200).
- **ngEHT Phase 1 (17), seal at 1,600 μas:** the seal is *unmistakable* — text ring, shield,
  Chi-Rho, "1834" (NCC 0.953). +BHEX: 0.954, visibly crisper lettering.
- **Elements at fixed scale (400 μas):** 2017 → 2022 → ngEHT → ngEHT+BHEX =
  NCC 0.751 → 0.884 → 0.919 → 0.933. Monotone. Same at every FOV column.
- **Coarse control (bold "W", EHT 2017 only):** recognizable at 200 μas, crisp at 800
  (NCC 0.878), then *collapses* at 1,600–3,200 (0.613 → 0.456; DR 33 → 12). With detail ~20×
  coarser than the seal's, 8 stations suffice — isolating fine detail (not polarity, not DC)
  as what the seal additionally demands.

**One-line version for Alejandro:** *You were right — at its own scale the seal reconstructs
(ngEHT@1,600 μas: NCC 0.95, lettering legible), it fails only when forced into an M87\*-sized
field, and recovery scales with elements at every field size; the one addition from the sweep is
a measured ceiling — for a sparse array, coverage occupancy falls as 1/FOV², so each array has an
optimal scale beyond which striping returns (EHT 2017 peaks near 800 μas).*

---

## 1.1 — How the seal gets its (wrong) scale today

`useSimulation.js`: Custom sources take `effectiveSourceFraction = controls.sourceFraction`
(0.50) of `controls.fovMuas` (default **80 μas**) ⇒ the seal is imaged **40 μas** across — the
size of an M87\* shadow at 16.8 Mpc. The earlier 'Custom' fix stopped the *shadow formula* and
*ring-fraction* from leaking, but the **FOV default itself is the remaining astrophysical-unit
leak**: 80 μas is an M87\*-field number, and a logo inherits it. (Post-fix path:
`effectiveSourceFraction` memo → `scaleSource(grayscale, 0.5, 512)`; dec stays 12.391° which is
harmless for coverage but is also M87\*'s.)

## 1.2 — Resolution-element budget (the decisive quantity)

Measured from the actual 512² seal grayscale (ink threshold at the min/max midpoint; 4,863
horizontal ink runs): finest strokes **p10 = 2 px, median = 5 px** ⇒ the seal's legible detail
needs the beam ≲ 5/512 of the image ⇒ **≳ 100 resolution elements across the image** (≈ 256 for
the very finest strokes).

Available today (image = 40 μas, EHT 2017): beam 8.4×10.3 μas fitted (λ/B_max = 24.7 μas nominal)
⇒ **~4–5 elements** across the seal. **Gap ≈ 20–60×.** The sweep's empirical turn-on matches the
budget: ring text emerges at N_res(image) ≈ 66 (ngEHT @800 μas) and is fully legible at
N_res ≈ 115 (ngEHT @1,600 μas) — right at the ~100-element prediction from stroke width.

## 1.3 — The sweep (full grid)

Method: real engine end-to-end per cell — `computeUVPoints` (dec 12.391°, 12 h, 230 GHz, N=512)
→ `scaleSource(src, 0.9, 512)` → the **actual worker** (`simCore.runReconstruction`; CLEAN, 1,000
iters, noise 0, dish = preset mean) → `beamFwhm` fit, distinct-mask-cell fill (worker's exact
round-and-wrap quantization), DR (engine metric, clamps at 100 — non-discriminating here), and
**NCC** = zero-mean normalized cross-correlation of CLEAN vs the scaled truth (recovery score).
39 cells in ~25 s. Montages: `custom-source-sweep-seal.jpg` (6 arrays × 6 FOVs),
`custom-source-sweep-controls.jpg` (coarse W + truths).

| Source | Array | FOV μas | Beam μas (fit) | N_res(img) | Mask cells | Occupancy¹ | NCC | Visual verdict² |
|---|---|---|---|---|---|---|---|---|
| seal | EHT 2017 | 80 | 8.4×10.3 | 8.5 | 27 | 82% | 0.573 | blobs (today's live behavior) |
| seal | EHT 2017 | 200 | 9.0×12.1 | 20 | 95 | 46% | 0.750 | square + bands |
| seal | EHT 2017 | 400 | 10.2×12.5 | 35 | 257 | 31% | 0.751 | square, banded interior |
| seal | EHT 2017 | 800 | 10.9×14.1 | 66 | 603 | 18% | **0.824** | square + coarse structure — 2017's optimum |
| seal | EHT 2017 | 1600 | 12.5×15.6 | 115 | 1,339 | 10% | 0.761 | striping grows |
| seal | EHT 2017 | 3200 | 22.1×22.1 | 130 | 2,335 | 4.4% | 0.704 | stripe-dominated |
| seal | 2017+BHEX | 80 | 3.0×2.3 | 24 | 271 | — | 0.733 | textured blobs |
| seal | 2017+BHEX | 200 | 3.1×2.3 | 58 | 945 | — | 0.773 | circular outline appears |
| seal | 2017+BHEX | 400 | 3.9×2.8 | 92 | 1,725 | — | 0.758 | ring hints |
| seal | 2017+BHEX | 800 | 5.5×5.5 | 130 | 2,341 | — | 0.825 | ring + interior hints |
| seal | 2017+BHEX | 1600 | 11×11 | 130 | 3,155 | — | 0.761 | bands return |
| seal | EHT 2022 | 80 | 8.8×8.8 | 8.2 | 33 | — | 0.631 | blobs |
| seal | EHT 2022 | 200 | 9.4×10.5 | 19 | 143 | — | 0.819 | square |
| seal | EHT 2022 | 400 | 10.2×11.7 | 35 | 419 | — | 0.884 | square + interior structure |
| seal | EHT 2022 | 800 | 10.9×14.1 | 66 | 1,079 | — | 0.839 | ring emerging |
| seal | EHT 2022 | 1600 | 12.5×15.6 | 115 | 2,587 | — | 0.857 | faint seal ring + monogram |
| seal | EHT 2022 | 3200 | 22.1×22.1 | 130 | 5,321 | — | 0.784 | seal through stripes |
| seal | 2022+BHEX | 80 | 3.0×2.3 | 24 | 289 | — | 0.780 | textured blobs |
| seal | 2022+BHEX | 200 | 3.1×2.3 | 58 | 1,169 | — | 0.866 | circle + interior |
| seal | 2022+BHEX | 400 | 3.9×2.8 | 92 | 2,433 | — | 0.894 | seal outline clear |
| seal | 2022+BHEX | 800 | 5.5×5.5 | 130 | 3,669 | — | 0.841 | ring + shield hint |
| seal | 2022+BHEX | 1600 | 11×11 | 130 | 5,441 | — | 0.858 | seal visible |
| seal | ngEHT Ph1 | 80 | 7.0×7.7 | 10 | 47 | — | 0.642 | blobs |
| seal | ngEHT Ph1 | 200 | 8.2×8.6 | 22 | 217 | — | 0.892 | disc + structure |
| seal | ngEHT Ph1 | 400 | 9.4×9.4 | 38 | 689 | — | 0.919 | seal ring visible |
| seal | ngEHT Ph1 | 800 | 10.9×9.4 | 66 | 2,157 | — | 0.940 | text ring + Chi-Rho visible |
| seal | ngEHT Ph1 | 1600 | 12.5×12.5 | 115 | 5,841 | — | **0.953** | **unmistakable seal — text, shield, "1834"** |
| seal | ngEHT Ph1 | 3200 | 22.1×22.1 | 130 | 13,277 | — | 0.893 | seal through stripes |
| seal | ngEHT+BHEX | 80 | 2.8×2.3 | 26 | 319 | — | 0.787 | textured blobs |
| seal | ngEHT+BHEX | 200 | 3.1×2.3 | 58 | 1,449 | — | 0.922 | seal ring clear |
| seal | ngEHT+BHEX | 400 | 3.9×2.8 | 92 | 3,627 | — | 0.933 | seal + interior detail |
| seal | ngEHT+BHEX | 800 | 5.5×5.5 | 130 | 6,395 | — | 0.943 | lettering approaching legible |
| seal | ngEHT+BHEX | 1600 | 11×11 | 130 | 10,689 | — | **0.954** | crisp seal |
| coarse W | EHT 2017 | 80 | 8.4×10.3 | 8.5 | 27 | 82% | 0.723 | blobs |
| coarse W | EHT 2017 | 200 | 9.0×12.1 | 20 | 95 | 46% | 0.828 | clearly a "W" |
| coarse W | EHT 2017 | 400 | 10.2×12.5 | 35 | 257 | 31% | 0.828 | sharp W |
| coarse W | EHT 2017 | 800 | 10.9×14.1 | 66 | 603 | 18% | **0.878** | crisp W — optimum |
| coarse W | EHT 2017 | 1600 | 12.5×15.6 | 115 | 1,339 | 10% | 0.613 | ghosted/striped |
| coarse W | EHT 2017 | 3200 | 22.1×22.1 | 130 | 2,335 | 4.4% | 0.456 | stripe-dominated |

¹ Occupancy = distinct mask cells ÷ area of the sampled u,v disk (π·r_max²) — the honest sparsity
measure; it collapses as FOV grows because Δu = 1/FOV (shown for EHT 2017; same trend all arrays).
² From the committed montages, judged against the truth row.

**Engine limits noted (not physics):** (i) BHEX baselines (~30 Gλ) map off the 512 uv grid above
FOV ≈ 1,760 μas — the mask wraps (aliasing), so BHEX @3,200 is excluded; capping keeps every
reported cell honest. (ii) The fitted CLEAN beam under-reads λ/B at small FOV (few-px dirty-beam
core), which is why fitted N_res saturates ~130; the λ/B budget in §1.2 is the physical anchor.
(iii) Engine DR clamps at 100 — reported but not used as evidence.

## 1.4 — Controls

- **Black hole at validated settings**: byte-identical throughout this pass (canvas FNV hashes
  CLEAN 2154452775 / Dirty 1389367993 re-verified on this branch after Phase 0). The ring's own
  physics is untouched by everything measured here.
- **Coarse W**: recovers with 8 stations where the seal cannot — same polarity handling, same
  pipeline, only detail differs. Cause isolated: **fine detail below the beam at the imposed
  scale**, not DC, not polarity, not a code bug.

---

## What Phase 2 should do (informed by these numbers)

1. Sever the last astrophysical-unit leak: a Custom image's scale must come from its own
   labeled "image size on sky" control, not the 80 μas target field.
2. Default that control near the default array's measured sweet spot (EHT 2017: ~800 μas — the
   square recovers on first upload; power users scale up + add elements to chase lettering).
3. Teach the true lesson with live numbers: detail ⇒ high spatial frequencies ⇒ long baselines /
   more elements — and the 2017→2022→ngEHT→+BHEX ladder demonstrably resolves an uploaded logo.
