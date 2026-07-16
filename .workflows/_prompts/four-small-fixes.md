# VLBI SIMULATOR — FOUR SMALL POST-DEPLOY FIXES
# Opus or Fable · Plan Mode · ultrathink · frontend-design skill ON
# Run from the astrophysics-applet repo. Small surgical pass — four isolated changes.
# Base: main (deployed). Branch, verify, merge, pause for push.

<scope_and_invariants>
Four isolated fixes. Fixes 1–3 change NO physics values. Fix 4 ADDS new physical
constants (target distances) — these must be SOURCED, never invented (physics-before-
validation rule). vlbi-react/ only; worker.js untouched (diff empty); existing
tourPhysics values untouched. Frozen anchors intact (10,883 / 25 μas / 42 μas / 2√27).
Public Tour signature, autoActions, App.js wiring unchanged. Verify on a NEVER-USED
port. Commit per fix; pause before the push to main.
</scope_and_invariants>

═══════════════════════════════════════════════════════════════════════════
FIX 1 — REMOVE THE BHEX "PENDING SIGN-OFF" MARKER  (approved; framing stays)
═══════════════════════════════════════════════════════════════════════════
Marrone/Alejandro APPROVED the BHEX framing. Remove ONLY the "pending sign-off" marker.
DO NOT change the physical relation — it STAYS "characteristic ~ R⊕ + h" because that is
the physically honest framing (the relation genuinely is characteristic, not an exact
equality). Approval clears the sign-off gate; it does NOT upgrade the relation.
  • GREP for every occurrence: "pending sign-off", "pending", "Marrone/Alejandro", the ⚠
    marker tied to BHEX. It was single-sourced but renders on several surfaces (Act E
    card / caption / equation-status row, the tourPhysics string, any StatusBar note).
    LIST them all before removing.
  • Remove the pending clause / ⚠ marker in each; if single-sourced (e.g.
    P.str.bhexHedge), edit the source so all surfaces update together.
  • KEEP "characteristic ~ R⊕ + h" verbatim. Never state B = R⊕ + h as an equality.
  Verify: no "pending" language anywhere; the ~ (characteristic, not =) preserved.

═══════════════════════════════════════════════════════════════════════════
FIX 2 — COMPARE MODE: ZOOM OUT ON LOAD + BHEX TOGGLE PER PANE
═══════════════════════════════════════════════════════════════════════════
2a — Compare mode's globe starts too zoomed in. Set the INITIAL compare camera/scale
  more zoomed out so both panes frame the full Earth + array with margin from load.
  View/scale default only — no change to UV computation or any physics. Both panes match.
2b — Add the SAME BHEX on/off toggle from single mode (the N2 toggle) to compare mode,
  ONE PER PANE, so each pane independently shows its preset with/without BHEX. REUSE the
  existing toggle component + handleToggleBHEX — do not rebuild. Compare stays preset+
  BHEX only (the B3 no-placement rule holds). Confirm the two compare workers
  (App.js:21–22) each honor their own pane's BHEX state with no cross-leak. Preserve the
  current default (BHEX off).
  Verify: independent working toggle per pane; toggling one doesn't affect the other;
  placement still disabled; both panes reconstruct with BHEX on/off.

═══════════════════════════════════════════════════════════════════════════
FIX 3 — TOUR TEXT LOADS AT THE TOP, NOT THE MIDDLE
═══════════════════════════════════════════════════════════════════════════
Tour act text panels load scrolled to the middle instead of the first line. Reset the
scrollable prose container's scrollTop to 0 on act mount / act change, AFTER the new
act's text renders (so it lands on the new content's top, not the old). Every act, both
guided and presenter modes. The pinned equation/hedge outside the scroller is unaffected.
  Verify: advance through all five acts in both modes; each starts at the first line.

═══════════════════════════════════════════════════════════════════════════
FIX 4 — TARGET DISTANCES IN THE TOUR  (new physical constants — MUST BE SOURCED)
═══════════════════════════════════════════════════════════════════════════
Add each target's distance from Earth and surface it in the TOUR (not the live app's
stat bar). Displayed in DUAL UNITS — the physicist's parsecs AND the general reader's
light-years — consistent with the tour's one-voice, both-audiences principle.

4a — DATA (add to SKY_TARGETS in constants.js; single-sourced, cited in comments):
  FIRST: check whether SKY_TARGETS already carries distance. If it does, reuse it —
  do not duplicate. If not, add these SOURCED values (cite each in a comment; do NOT
  invent or approximate beyond the source):
    • M87*    — 16.8 Mpc  ≈ 55 million light-years   [EHT 2019 Paper VI]
    • Sgr A*  — 8.15 kpc  ≈ 26,700 light-years        [GRAVITY Collaboration]
    • Cen A   — 3.8 Mpc   ≈ 12 million light-years    [published distance]
    • 3C 279  — SEE 4b (cosmological — handle with care)
  Verify each value against its source before committing. If any source is uncertain,
  FLAG it rather than shipping an invented number.

4b — 3C 279 IS THE SUBTLE ONE — DO NOT PAPER OVER IT. It is a cosmological-redshift
  quasar (z ≈ 0.536), where "distance" is ambiguous: luminosity distance, comoving
  distance, and light-travel time all differ substantially. Do NOT silently pick one and
  label it "distance" — that is exactly the class of error this project has corrected
  repeatedly. Instead: state the redshift (z ≈ 0.536) AND a light-travel-time figure
  (~5.4 billion years), and LABEL which measure is shown. If a single "distance" number
  is displayed for it, the measure must be named explicitly (e.g. "light-travel time").
  Reason from the source; do not compute a cosmology-dependent value without stating the
  cosmology assumed.

4c — DISPLAY (tour only): surface the distance where the target matters — ESPECIALLY
  Act D (First Light), where "42 μas shadow, 55 million light-years away" is the whole
  emotional point. Also surface it wherever an act names its target (Act B's dec/target
  readout, Act C's source, Act E if target-dependent). Format: dual units, e.g.
  "16.8 Mpc · 55 million light-years". Use the DESIGN-LANGUAGE numeric/mono treatment;
  the distance is context, not the hero — it must not out-bright the gold live-computation
  layer. Single-source the formatted strings through tourPhysics (never a literal typed
  into a scene), same as every other number.
  Verify: each act shows its target's distance in dual units; 3C 279's measure is labeled;
  formatting is consistent; nothing is a hardcoded literal in a scene.

═══════════════════════════════════════════════════════════════════════════
GATES  (binary, never-used port, both tour modes)
═══════════════════════════════════════════════════════════════════════════
  G1  No "pending" language anywhere; "characteristic ~ R⊕ + h" preserved; not an equality.
  G2  Compare starts zoomed out; independent BHEX toggle per pane; no placement; no
      worker cross-leak; both panes reconstruct with BHEX on/off.
  G3  All five acts' text panels load at the top, both modes.
  G4  Target distances present in the tour in dual units, single-sourced via tourPhysics,
      cited in constants; 3C 279's distance measure explicitly labeled (redshift +
      light-travel time, cosmology stated if computed); no invented values.
  G5  No EXISTING physics value changed (frozen anchors, per-target θ, max-baseline, fill
      all unchanged); worker diff EMPTY; app + tour reconstruct unchanged; zero console
      errors; reduced-motion static.

═══════════════════════════════════════════════════════════════════════════
SHIP
═══════════════════════════════════════════════════════════════════════════
Commit per fix (4 commits). Update knowledge (decisions.md: BHEX approved / hedge
removed / framing retained + target-distance sources; codebase.md: compare BHEX toggle,
SKY_TARGETS distances; gotchas.md: tour scroll-reset), /sync. Merge to main and PAUSE
for Ilan's "push" — present the gate ledger, then push on his word (~60s deploy).

## STARTING INSTRUCTION
First: (a) grep and LIST every BHEX pending-marker occurrence, and (b) report whether
SKY_TARGETS already carries distance data. Then present the plan for all four fixes.
Execute per fix, verify each on a never-used port, pause before the push.
