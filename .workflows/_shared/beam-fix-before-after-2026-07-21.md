# Restore-Beam Fix — Before / After (for Alejandro)

**Fix:** the CLEAN restore-beam sigma was built from the PSF **HWHM** divided by 2.3548 as if it
were the FWHM, so the beam was 2× too narrow since S4 (over-sharpened). Corrected (commit
`2f7b258`): `fwhm = 2·halfWidth` (HWHM→FWHM) → `sigma = fwhm/2.3548` (FWHM→sigma). This is a
**deliberate, signed-off reconstruction change** — the CLEAN ring hash is re-baselined. Settings:
default (EHT 2017, BHEX off, noise 0, 230 GHz, N=512).

## Numbers

| target | Beam FWHM before | Beam FWHM after | beams across shadow (before → after) | CLEAN hash before → after | Dirty hash |
|---|---|---|---|---|---|
| **M87\*** (42 μas) | 8.4 × 10.3 μas | **16.9 × 20.6 μas** | ~4–5 → **~2.0–2.5** | 2154452775 → **1397912851** | 1389367993 (unchanged) |
| **Sgr A\*** (50 μas) | 9.4 × 7.5 μas | **18.8 × 15.0 μas** | ~5–7 → **~2.7–3.3** | 564716905 → 2189176350 | 2975553241 (unchanged) |

The beam FWHM **doubles** for both targets (the fix); the **Dirty hash does not move** for either
(the restore beam is applied post-deconvolution — the dirty image is the control). λ/B "Resolution"
(24.7 / 23.6 μas) and every geometry anchor are unchanged (beam-independent). Point-source PSF
check: displayed "Beam FWHM" is now **20.5 μas = the directly-measured true FWHM** (was 10.25 = the
HWHM). ResolutionBudget element count **halved** (31 → 15), as expected.

## What the images show (`beam-fix-assets/`)

- **Ground Truth and Dirty Image: byte-identical before/after** (the fix is purely in the restore
  step). Confirmed by hashes and visually.
- **M87\* CLEAN** (`before-m87.png` → `after-m87.png`): the bright asymmetric crescent + dark
  central shadow are present in both, but **after the fix the ring is visibly softer** (a wider,
  honest restore beam). The before was over-sharpened. **The ring still reads unmistakably as a
  black-hole shadow** — now at ~2 beams across the 42 μas shadow, which is **physically correct:
  the EHT only marginally resolves M87\***. Compared to the real EHT image
  (`assets/eht-m87-2019.jpg`), the reconstruction is coarser (as it must be — a demo with fewer
  effective constraints) but structurally the same (crescent + shadow).
- **Sgr A\* CLEAN** (`before-sgra.png` → `after-sgra.png`): same systematic change — softer ring,
  structure intact. This confirms the fix is **systematic, not M87\*-specific**.

**Honest statement:** the reconstructions are now less sharp than every previously-approved
screenshot. That is the point — the old sharpness was a factor-2 artifact of the HWHM/FWHM error.
The rings remain legibly resolved; they are now honestly beam-limited.

## Regression (STEP 7)

- **Tour Acts A–E render**, no console errors. **Act C** (dirty→CLEAN pipeline) and **Act D**
  (First Light — real EHT photo vs the simulator's reconstruction) both still **read correctly**:
  the CLEAN ring is softer but clearly a ring + shadow; all physics labels intact (42 μas, 2√27,
  θ = 25 μas, EHT 2017 · 8 stations).
- **CLEAN timing:** 119 ms (3-run: 132/119/116) at N=512 — well under the ~300 ms presenter budget;
  unchanged (a wider Gaussian does not increase the FFT-convolution cost).
- **Custom 350 default** loads without error (Beam FWHM 20.5 μas, N_res 15 — the corrected values).
  The ΔNCC window sweep used the old beam and is now invalidated; **not re-tuned this pass** (deferred).
- **Zero console errors.** worker.js diff = the sigma conversion + its comment only.

## Hash re-baseline ceremony
CLEAN 2154452775 → **1397912851**, reproduced identically on two never-used ports (8543, 8467) from
clean loads; Dirty 1389367993 held on both. Forward-looking invariant assertions updated; dated
historical records left as-is. See decisions.md 2026-07-21 + gotchas.md.
