# primer.md — session handoff (2026-07-21)

ACTIVE_PROJECT: Astrophysics Applet — VLBI simulator (vlbi-react/), Harvard EHT talk fall 2026

LAST_COMPLETED: P0 restore-beam HWHM/FWHM fix — MERGED + PUSHED + LIVE on main (8bcbc30,
2026-07-21). worker.js restore-beam scan measured the PSF HWHM but divided by 2.3548 as if
FWHM → beam 2× too small since S4. Fixed (fwhm=2·halfWidth → sigma=fwhm/2.3548). Deliberately
re-baselined the CLEAN ring hash (Alejandro signed off). Displayed Beam FWHM now = true FWHM
(20.5 μas, was 10.25 = HWHM); M87* ~2 beams across the 42 μas shadow (physically correct).

CRITICAL HASH STATE: CLEAN ring hash is now **1397912851** (NOT the old 2154452775 — any
assertion of 2154452775 as the current gate is STALE/WRONG). Dirty UNCHANGED **1389367993**
(the control; restore is post-deconvolution). Ground Truth 1904227387 unchanged.

EXACT_NEXT_STEP: PASS 2 — re-measure the user-image BHEX window with the corrected beam. The
CUSTOM-SOURCE-PHYSICS.md "USER-IMAGE BHEX WINDOW" sweep is INVALIDATED (old 2×-narrow beam):
re-run the seal + ring-target sweep, re-find the honest window, then set + DOCUMENT the Custom
default FOV (audit Check 4; N_res is now ~15 not 31; 350 is still undocumented) and add the seal
content-dependence caveat to the upload UI (audit Check 5, cleared to ship, no sign-off).
Read .workflows/_shared/handoff-2026-07-21-2015.md first.

OPEN_BLOCKERS: none code-side (fix is live). Projector-laptop CLEAN timing gate remains the only
standing human TODO before the talk (CLEAN 119 ms on dev, well under budget).

KEY_DECISIONS_THIS_SESSION: CLEAN ring-hash re-baseline 2154452775 → 1397912851 (restore beam
was 2× too narrow since S4; HWHM mislabelled FWHM; Alejandro sign-off; Dirty control held).
Locked anchors that must NEVER move: θ 24.7/23.6/24.8/26.7 μas, max baseline 10,883 km, shadow
coeff 2√27, ring 42 μas, BHEX "characteristic ~ R⊕+h".
