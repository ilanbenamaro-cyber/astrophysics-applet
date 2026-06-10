# VLBI TOUR — CONFORM TO THE SITE'S OWN DESIGN LANGUAGE
# Opus · Plan Mode · Ultrathink · invoke the frontend-design skill
# Run from the astrophysics-applet repo. Read this whole file before planning.

## WHY THIS PASS IS DIFFERENT

The tour has been visually iterated many times and keeps landing on "better but
still not right." The reason is not effort or missing tooling — it is that every
pass aimed at an ASPIRATION ("world-class," "Apple-level"), which is unmeasurable, so
each pass chased a moving target. Meanwhile the REST OF THE SITE already looks
coherent and intentional. That coherence is the target we have never used.

This pass inverts the method: instead of "make the tour look better," the goal is
"make the tour look like it belongs to this site." That is checkable. The site's
own CSS and rendered pages are the ground truth. The tour must defer to them.

The physics got solid the moment it had a single source of truth and a concrete
gate (tourPhysics.js). The visuals have had neither. This pass gives them both:
a single source of visual truth (DESIGN-LANGUAGE.md, extracted from the real site)
and a concrete gate (every tour surface conforms to it, verified side-by-side).

Use the frontend-design skill for execution quality — but the skill provides generic
taste; the DESIGN-LANGUAGE.md provides THIS site's specific taste. The file governs.

Branch: continue on feature/tour-world-class-overhaul (unmerged). main/live untouched.
Contract unchanged: Tour signature, TOUR_ACTS, autoActions, d01–d08, tourPhysics.js
as single source of computed physics, per-act RAF/cleanup/reduced-motion pattern.

═══════════════════════════════════════════════════════════════════════════════
PHASE A — EXTRACT THE SITE'S DESIGN LANGUAGE  (no tour edits in this phase)
═══════════════════════════════════════════════════════════════════════════════

Study the REST OF THE SITE — the root app and the live simulator UI, NOT the tour.
Read the actual source; do not infer from memory:
  • Root + app CSS: css/*.css and vlbi-react/css/*.css EXCEPT tour.css
    (app.css, the controls/sidebar/panel styles, global tokens, resets).
  • The rendered app: open http://localhost:<fresh>/vlbi-react/ with the tour CLOSED
    and screenshot the live simulator UI — sidebar, controls, panels, buttons,
    contour map, typography in situ.
  • Any :root custom properties / CSS variables (the real design tokens).
  • Font loading (index.html / @font-face / font-family stacks).

Extract — with EXACT values, copied not approximated — into
.workflows/_system/DESIGN-LANGUAGE.md:

  1. COLOR — every token actually used: backgrounds (the real #111110 / #02020a
     family — confirm which), surfaces/panels, the amber accent (#c47f3a? confirm),
     borders, text primary/secondary/dim, semantic colors. Hex values verbatim.
     Note where each is used (bg vs surface vs accent vs hairline).
  2. TYPOGRAPHY — font stacks (system-ui? a specific face? the mono used in panels),
     the actual size scale in px/rem, weights, letter-spacing, line-heights, and
     where each step is used (label vs body vs heading vs numeric/mono).
  3. SPACING & RHYTHM — the real spacing scale, paddings, gaps, the grid/margins
     the app uses.
  4. SHAPE — border-radius values (12px panes / 8px buttons? confirm), border/
     hairline widths and colors, the actual shadow/elevation treatment (or its
     deliberate absence).
  5. MOTION — transition durations/easings the app uses, if any.
  6. VOICE — the qualitative character in one paragraph: is it restrained Apple-dark
     with warm amber and generous negative space? high-contrast? quiet hairlines vs
     heavy borders? This paragraph is the tiebreaker when a token decision is
     ambiguous.

Then add a TOUR-DELTA section: list every place the CURRENT tour VIOLATES the
extracted language — wrong accent hue, different radius, heavier/glassier panels
than the app uses, different type scale, saturated nebula palette vs the app's
restraint, mono/serif mixing the app never does, etc. Be specific and per-act.

Gate: DESIGN-LANGUAGE.md contains real extracted values (not guesses) and a concrete
per-act delta list. Human reviews this file before Phase B. Commit.

═══════════════════════════════════════════════════════════════════════════════
PHASE B — RECONCILE: where the tour may legitimately diverge  (decision, with human)
═══════════════════════════════════════════════════════════════════════════════

The tour is a cinematic full-bleed experience; the app is a working tool. Some
divergence is intentional, some is the drift that makes it feel foreign. Classify
every delta from Phase A into:
  • CONFORM — must match the site exactly: accent hue, text colors, font stack,
    type scale, border-radius, hairline/border treatment, panel/surface fills,
    the derivation-panel styling (it must read as a site panel, not a sci-fi card),
    button/CTA styling, concept-tag/label styling, spacing rhythm.
  • LICENSED DIVERGENCE — deliberately different because the tour is cinematic:
    full-bleed dark canvas, the astrophysical scene art (dishes/Earth/rings/nebulae),
    motion. These stay expressive — but their PALETTE still derives from the site's
    accent/neutral family so they read as the same product, not a different app.
Write the classification into DESIGN-LANGUAGE.md. The principle: the tour can have
its own cinematic CONTENT, but its CHROME, TYPE, COLOR SYSTEM, and SPACING must be
indistinguishable from the rest of the site. Human signs off on the split. Commit.

═══════════════════════════════════════════════════════════════════════════════
PHASE C — CONFORM THE TOUR  (sequential, single file; frontend-design skill on)
═══════════════════════════════════════════════════════════════════════════════

Make every tour surface obey DESIGN-LANGUAGE.md. This is NOT a redesign of the
scenes (the depth/subject/clarity work from pass 2 stays) — it is a systematic
re-skinning so the tour's color system, type, shape, and chrome match the site.

  C.1 — Tokenize. Pull the extracted values into tour-facing constants so the tour
        references the SAME tokens as the app, not its own hardcoded palette.
        Reconcile the tour's BG/GOLD/AM/TEAL/etc. constants against the site tokens:
        replace tour-only values with the site's real ones where they should match
        (esp. the accent — the tour's GOLD/AM must equal the app's amber, exactly).
  C.2 — Chrome to site spec. The derivation panels (Acts 1 & 5), the slim d07
        integrity panel, concept tags, the d08 FITS/metrics panels, and the CTA must
        all adopt the site's panel fill, border/hairline, radius, type, and spacing.
        If the app uses quiet hairlines and flat surfaces, the tour's "glass cards"
        must lose the glassy drop-shadow/glow and become site panels.
  C.3 — Typography. Every text element in every act uses the site's font stack,
        scale, weight, and letter-spacing. Kill any serif/mono usage the app doesn't
        use; match the app's numeric/mono treatment for equations if it has one.
  C.4 — Scene palette derivation. The cinematic scene art keeps its drama but its
        colors derive from the site's neutral + accent family (per Phase B). If the
        site is restrained and the tour's nebulae are candy-saturated, pull them
        toward the site's register so the tour reads as the same product.
  C.5 — The text panel below the canvas (TourCard) must match the site's panel/
        type/spacing exactly — this is the surface most directly adjacent to the
        site shell and most damaging when it differs.

  Sequence — small, verifiable commits:
    C-1 tokens + TourCard panel + global tour chrome  (the highest-leverage commit;
        re-skins the shared furniture once) → verify → commit
    C-2 d06 + d01 → verify → commit
    C-3 d03 + d07 → verify → commit
    C-4 d04 + d02 → verify → commit
    C-5 d05 + d08 → verify → commit
  Each: implement → Playwright screenshot → commit. Single file, no parallel edits.

═══════════════════════════════════════════════════════════════════════════════
PHASE D — SIDE-BY-SIDE VERIFICATION  (the gate that makes this checkable)
═══════════════════════════════════════════════════════════════════════════════

After each batch, fresh port (gotcha #238):
  pkill -f "http.server"; python3 -m http.server <fresh> --directory "<repo>"

  1. CONFORMANCE PASS (the point of this whole effort): screenshot a tour surface
     and the analogous app surface side by side. Confirm IDENTICAL: accent hue,
     text colors, font + scale, border-radius, hairline/border, panel fill, spacing.
     If a tour panel and an app panel sat next to each other, a designer could not
     tell they came from different screens. Any mismatch = not done.
  2. TOKEN PASS: grep the tour for hardcoded colors/sizes that bypass the shared
     tokens; every value traces to DESIGN-LANGUAGE.md or is a Phase-B licensed
     divergence. No orphan palette.
  3. PHYSICS UNCHANGED: this pass must not alter any number. Confirm 10,883 km /
     25 μas / 2√27 coefficient / BHEX pending labels are all still intact and
     identical across Acts 1/2/4/7/8 (re-run the physics check; it must be a no-op).
  4. NO REGRESSION on pass-2 gains: 0 HUD frames; depth/subject-scale intact; Act 5
     dirty→clean still plays; Earths still modeled; ngEHT still visibly sharper.
  5. CONSOLE/RAF: zero JS errors; cancelAnimationFrame fires per act.
  6. REDUCED MOTION: complete static final frame; RAF never starts.

  Human review at the end: open the tour, then open the app, and alt-tab between
  them. They must feel like one product. That is the acceptance test — not "is the
  tour beautiful" but "does the tour belong to this site."

═══════════════════════════════════════════════════════════════════════════════
CONSTRAINTS
═══════════════════════════════════════════════════════════════════════════════
  • vlbi-react/ only; never root js/ index.html (you READ root css for extraction,
    you do not edit it).
  • DESIGN-LANGUAGE.md is the single source of visual truth, mirroring how
    tourPhysics.js is the single source of computed truth. Tour references tokens,
    never re-hardcodes them.
  • Physics is frozen this pass — zero number changes; the physics check is a no-op.
  • Pass-2 visual gains (depth, subject scale, clarity, modeled Earth, dirty→clean)
    are preserved, only re-skinned to the site's language.
  • frontend-design skill informs execution quality; DESIGN-LANGUAGE.md overrides it
    wherever they differ (the site's specific taste beats generic taste).
  • Tour exported signature + App.js wiring + autoAction types unchanged.
  • Every act useEffect returns cancelAnimationFrame; pixel positions from
    offsetWidth/Height × dpr; reduced-motion draws final static frame; reset
    g.filter='none' after any blur.

═══════════════════════════════════════════════════════════════════════════════
COMMIT (final)
═══════════════════════════════════════════════════════════════════════════════
  feat(vlbi-react): tour — conform to site design language (extracted real tokens to
  DESIGN-LANGUAGE.md; unified accent/type/shape/spacing with the app; cinematic
  scenes re-skinned to the site palette; physics unchanged)
