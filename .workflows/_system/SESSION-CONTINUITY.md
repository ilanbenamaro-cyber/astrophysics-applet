# Session Continuity — Astrophysics Applet
# _system/SESSION-CONTINUITY.md
#
# Zero-context resume document. If you are starting a new session with no prior
# context, read this file first. It tells you exactly where work left off and
# what to do next. Updated after each phase completes.
#
# PROJECT SCOPE: Research-grade demonstration tool for EHT scientific audience.
# Target: Harvard EHT talk, fall 2026. Audience: EHT scientists and radio astronomers.
# Physical accuracy is non-negotiable. All physics decisions require Alejandro sign-off.

---

## WHERE WE ARE

**Phase 1: COMPLETE** — committed 2026-04-12 as `bc212cb`
> feat(vlbi-react): Phase 1 complete — contour map, physics notes, citation modal

**Three-Session Physics Upgrade: COMPLETE** — committed 2026-04-22 as S1/S2/S3
> S1 `3522052`: EHT 2017/2022/ngEHT Phase 1 presets + STATION_SEFD table
> S2 `c87b715`: Physical beam taper (1.02λ/D), noise-floor CLEAN (3×RMS), per-baseline SEFD noise
> S3 `1f9682c`: BHEX space telescope, Keplerian orbit UV, globe satellite rendering

**Four-Session Display+Physics Upgrade: COMPLETE** — committed 2026-04-23 as S4/S5/S6/S7
> S4 `79b49a9`: Elliptical CLEAN restore beam (dual-axis PSF scan → sigmaU/sigmaV)
> S5 `ba2c024`: Elevation cutoffs (10°) — SPT excluded at M87*, GLT excluded at Sgr A*
> S6 `6f74122`: Axis tick fix, baseline stats in StatusBar, modal updates (SEFD/BHEX/ngEHT refs)
> S7 `c938dca`: Sky target selector — M87*, Sgr A*, 3C 279, Cen A, Custom; auto-sets declination

**S8: COMPLETE** — committed 2026-04-24 as `5a002b6`
> feat(vlbi-react): S8 — physically correct source angular size (M87* 42μas, Sgr A* 50μas)
> Angular size blocker RESOLVED. effectiveSourceFraction = shadowUas/fovMuas for named targets.
> SOURCE SIZE slider hidden for named targets; shown for Custom only.

**S9–S12: COMPLETE** — committed 2026-04-24 as 4 commits on main
> S9  `542c7db`: INFO.sourceSize tooltip fixed (42/50 μas); MetricsPanel (beam FWHM, DR, UV fill, baselines); dynamicRange lifted to useSimulation hook (MAD-based)
> S10 `940349b`: Per-baseline SNR color coding in UVMap (hsl 45 grey→gold); pairSefdMap built in hook; toggle button
> S11 `4f32794`: FITS export with WCS headers (fitsExport.js); Export FITS button in ContourMap
> S12a `4a09670`: useSimulation hook extracted; App.js global UI only
> S12b `81b1610`: Compare mode — SimPane.js; two useSimulation instances; compare layout; AppSidebar compare toggle
> S12c `5b65d84`: Globe ResizeObserver confirmed correct in 280px pane; .btn-ghost.btn-active CSS

**UI Polish + Tour Rework: COMPLETE** — committed 2026-04-24 as P1/P2/P3
> P1 `a090153`: compare button top, auto-load preset, remove export button, dirty/CLEAN only, telescope list in compare
> P2 `9b1705f`: transitions, hover states, spacing polish (CSS only)
> P3 `24ae8b6`: full-screen 12-act tour with SVG diagrams (intermediate — superseded below)

**Tour Art Pass: COMPLETE** — committed 2026-04-26
> `614932a`: Complete art rewrite of TourDiagram.js (d01–d08) + tour.css additive update.
> Bloom/softglow/hardblur SVG filter system (per-diagram scoped IDs bloom-d01..d08); metallic dish parabolas; volumetric beam cone (radialGradient polygon); painted Earth spheres (radialGradient + night shadow overlay); STARS[180] deterministic star field; continent outlines in d04; d04 expanded to 9 stations (added GLT at -68.703°, 76.535°); d05 replaced scrubber-wipe with single-canvas sidelobe→photon-ring transformation (5 sl-ring-* staggered fade, photon-ring-emerge, shadow-emerge, label-dirty→label-clean); BHEX data beam (.data-beam pulse) in d07; 280-star 3-depth-layer field in d07; luminous gold CTA (fontSize=36, fontWeight=900, bloom) in d08; 14 new CSS keyframes + 10 new animation classes; earth-group-cinema transform-origin updated 330×370→290×350; station-dot-9/label-9 rules added; uv-draw-* arc lengths recalculated (693/548/427); transform-box: fill-box on .baseline-pulse; full reduced-motion coverage.
> `f12d196`: Tour layout fix — visual area top 68vh, text panel bottom 32vh, zero overlap.

**Smithsonian Art Pass: COMPLETE** — committed 2026-04-27 as `467b979`
> Complete rewrite of d01–d08 with documentary-paced animation (one motion per act, every element teaches something). New: two-halves d01 (single dish vs interferometry — left blurry smear, right baseline draws + gold dot appears); descending wavefront d02 (loops) with sequential tick marks + τ_g label + UV point pulse; Earth center cx=290→310 d03 + CSS transform-origin updated; 3-ring sidelobe→photon d05 with new CSS class names (.photon-ring, .bh-shadow, .lbl-dirty, .lbl-clean); panel-rise d08 with new class names (.panel-left, .panel-right, .fits-panel, .metrics-panel-tour, .cta-reveal). BG #010103→#08080f (deep space warm), DRK=#0d0d1a constant added. 10 new CSS keyframes (beamFadeIn, baselineDraw, dotAppear, wavefrontDescend, tickAppear, uvPointPulse, panelRise, slideFromLeft, slideFromRight, ctaReveal) + 19 new animation classes. All use cubic-bezier(0.25,0.46,0.45,0.94) easing (documentary pacing). Full reduced-motion coverage for all new classes.

**Tour Cinematic Rewrite: COMPLETE** — committed 2026-04-25/26
> `8eb63cb`: tour diagram upgrade — richer SVG, more math, 700×500 viewBox, 12 acts with 3 paragraphs each
> `2c9f59b`: tour diagram fixes — elliptic UV arcs (SVG A arc syntax), equirectangular grid world map, CLEAN animation fix
> `d3b13b0`: cinematic 8-act tour full rewrite — animPhase state machine (visual→text→ready); chapter title cards before Ch II (act 3) and Ch III (act 6); 1200×700 viewBox; deep-space visual language (#010103 bg, gold equations, teal data); real EHT M87* image Act 6 (assets/eht-m87-2019.jpg 36KB JPEG); Tour contract (App.js wiring + exported function signature + autoAction types) unchanged

**Canvas 2D Cinematic Rewrite: COMPLETE** — committed 2026-04-28 as `bed2d45`
> feat(vlbi-react): tour — canvas 2D cinematic rewrite
> TourDiagram.js fully rewritten from SVG/htm to Canvas 2D requestAnimationFrame loops.
> d01–d08 are now React components (useRef+useEffect+RAF). Shared utilities: makeStars, drawStars, drawNebulae, drawMilkyWay, drawAtacama (organic bezier terrain), glow3, drawDish (parabola+clip), drawBeam, drawBlurry (chromatic aberration), drawSharp (6-spike diffraction), drawBaseline (traveling pulse), drawDivider, drawEarth. D03 Earth rotation in JS. D06 loads real EHT photo. D08 panel-rise + CTA bloom. tour.css: `.tour-visual canvas` rule added.

**Tour World-Class Overhaul: COMPLETE** — committed 2026-06-08 (feature/tour-world-class-overhaul)
> New `tourPhysics.js`: single source of computed truth — every tour number derived from the same
> constants/formulas the simulator uses (θ=λ/B no 1.22; imports canonical latLonToECEF, never copies).
> Fixed the pre-overhaul defects: d04 "20 μas" and d08 "24 vs 20 μas" contradictions resolved (all
> read computed θ≈24 μas); d02 "B=10,900" → computed 11,406 km; d07 BHEX figures reframed as
> "B ~ R⊕+h … pending sign-off" (orbital-radius simplification, never a clean equality).
> Added depth/derivation utility library to TourDiagram.js (glass derivation panels, contact shadows,
> labelled axes, scale bars, foreground accents, concept tags, HUD frames) — appended, no act-body
> drift. All 8 acts (d01–d08) now carry: a named concept, a derivation panel showing symbol→sub→
> result→meaning, labelled axes/scale bars, key-light-upper-left depth, and a filled frame. Tour.js
> prose aligned (act 1 θ≈λ/D not 1.22λ/D; act 4 24 μas/11,400 km; act 7 BHEX proposed/pending).
> Contract unchanged (Tour signature, autoActions, diagramId→d01–d08). 5 batch commits + audit/spec
> docs (.workflows/_system/TOUR-AUDIT.md, TOUR-SPEC.md). Verified per-act via Playwright; zero new
> console errors; 8 RAF cleanups + 8 reduced-motion gates intact.

**Tour Apple-Precision Overhaul (pass 2): COMPLETE** — committed 2026-06-09 (feature/tour-world-class-overhaul)
> Pass 2, against Apple's 3 HI principles (deference/clarity/depth) after a reviewer called pass 1
> "cookie-cutter." Phase 0 physics: fixed the shadow-coefficient bug (single-sourced bcFormula=√27
> radius / shadowDiamFormula=2√27 diameter so d05 & First Light can't diverge); corrected the
> HEADLINE baseline to the M87*-observing max (SPT can't see M87*; tourPhysics.maxBaselineKmVisible
> reuses the tool's imported elevation filter → IRAM–JCMT 10,883 km → θ≈25 μas, matches published EHT
> + live tool); both values exposed (M87* headline + geometric 11,406 for reference); mandatory "M87*"
> qualifier swept across Acts 1/2/4/7/8; TOUR-PHYSICS-AUDIT.md written (flags coords for Marrone).
> Phase 1 deference: deleted all HUD corner frames + the util; quieted concept tags. Phase 2 depth (4
> batches): new drawPlanet (modeled rotating Earth — terminator/limb/land) in d03+d07; d06 hero photo +
> annotation column; d01 RESOLVED source + full-width terrain; d03 baseline colour-matched to its
> ellipse; d07 fuzzy-vs-sharp BHEX insets + slim integrity panel; d04 recognizable continents + label
> dodging + filled map; d02 enlarged dishes/UV + VCZ caption; d05 dirty→clean transformation; d08
> ngEHT visibly sharper than EHT. Cards now only in Acts 1 & 5 (+ slim d07). Contract unchanged; 8 RAF
> cleanups + 8 reduced-motion gates intact; per-act Playwright-verified; env-only console errors.

**Tour Design-Language Conformance (pass 3): COMPLETE** — committed 2026-06-09 (feature/tour-world-class-overhaul)
> Inverted the method: instead of chasing an aspiration, make the tour LOOK LIKE IT BELONGS to the
> site (checkable). Extracted the host app's real tokens (vlbi-react/css/app.css :root) into
> `.workflows/_system/DESIGN-LANGUAGE.md` (single source of visual truth) — restrained warm-neutral
> dark, ONE muted-gold accent #C4A555, Inter + --font-mono, flat #2d2200 hairline panels, 4–6px radii,
> no serif. New `vlbi-react/js/tourTokens.js` reads app :root (getComputedStyle + verbatim fallbacks);
> TourDiagram palette constants remapped to it. Re-skinned (NOT redesigned) all chrome + scene art to
> the family: glassy cards → flat site panels, Georgia/Courier → Inter/--font-mono, candy nebulae →
> warm-amber/cool-slate dust, cyan/bright-gold → accent, blue-black fills → --bg-2, concept tags →
> app label treatment. Scene art MODERATE-desaturated; Earth keeps realistic blue (matches app globe).
> 7 commits (docs A+B, C-1..C-5). Phase D verified: zero orphan/foreign hexes, no serif/Courier,
> physics a NO-OP (25 μas/10,883 km/2√27 intact), 0 HUD frames, 8 RAF cleanups + 8 reduced-motion
> gates. Tour now indistinguishable from the app in chrome/type/colour/spacing. NOT yet merged to main.

**Tour Engine-Real Rebuild: COMPLETE** — committed 2026-06-10 (feature/tour-world-class-overhaul, 8 commits, NOT merged to main)
> The tour was rebuilt so EVERY act is a real, engine-driven instrument (genuine uvCompute/worker output),
> not a hand-drawn illustration. 5 acts (A Resolution, B Synthesized Aperture, C From Data to Image,
> D First Light, E Beyond Earth) replace the 8 Canvas-2D TourDiagram scenes. **TourCard.js + TourDiagram.js
> DELETED** (1,697 lines). Preceded by a read-only feasibility audit (`.workflows/_system/TOUR-ENGINE-AUDIT.md`).
> Phase 0 `2fd3bea` (behavior-neutral): new `simCore.js` (runReconstruction owns its own worker per call +
> scaleSource/buildSefdMap/buildPairSefdMap/computeDynamicRange/beamFwhm/angularRes) and `simRender.js`
> (drawContour/drawHot) extracted from useSimulation/ContourMap/ImageCanvas, which import them back; worker.js
> gained opt-in `progressEvery`. TIMING GATE measured (TOUR-ENGINE-AUDIT.md §2, N=512 dev): computeUVPoints
> 0.5ms, dirty 41ms, CLEAN 98ms, MEM 2350ms → Act C runs CLEAN live in both modes.
> Phase 1 `8b0466d`: Tour.js host — presenter|guided mode (?mode=presenter / 'P', default guided), visual→ready
> scene RAF, KaTeX live equations (TourEquation.js, fallback to plain tex), narrative-tier switcher, real-UV
> progress spine (TourSpine.js), pointer→scene forwarding. New tourActs.js (act schema as data), tourScenes.js
> (registry + generic real fallback), tourScene.js (canvas primitives), tourAnnotations.js (physics annotations
> drawn ON the canvas). Phase 2: sceneB `170b7c6` (flagship — live HA-scrub ellipse), sceneA `22ae0e3` (real
> EHT dirty beam vs one-dish blur), sceneC `31f7c38` (real CLEAN + live residual sparkline, DR matches app),
> sceneD `0d39bac` (real M87 photo + own reconstruction), sceneE `facf32e` (real BHEX ground–space coverage +
> handoff). Cleanup `64480e5`: TourCard/TourDiagram removed. All 12 quality gates verified on a fresh port in
> both modes; the live app reconstructs unchanged (G12). Numbers via tourPhysics.js, colours via tourTokens.js,
> visual law via DESIGN-LANGUAGE.md — all preserved. The tour never mutates app state mid-act (Skip/Esc
> preserves pre-tour state for free; only Act E's "Enter the simulator" dispatches loadEHT).

**ALL PLANNED SESSIONS COMPLETE — S1 through P3 + Tour Cinematic Rewrite + Tour Art Passes + Canvas 2D Rewrite + Tour World-Class Overhaul + Tour Apple-Precision Overhaul + Tour Design-Language Conformance + Tour Engine-Real Rebuild**

---

## LIVE WORKING AREA

**Active codebase:** `vlbi-react/`
**Root app** (`index.html`, `js/`, `css/`): stable, not under active development — do not touch for user-facing changes.

Deployed at:
- https://ilanbenamaro-cyber.github.io/astrophysics-applet/ (root)
- https://ilanbenamaro-cyber.github.io/astrophysics-applet/vlbi-react/ (active)

Push to `main` → live within ~60 seconds.

---

## KEY PEOPLE

| Person | Role | Context |
|--------|------|---------|
| Prof. Alejandro Cárdenas-Avendaño | Physics advisor, Wake Forest University | Meeting needed before Phase 2. Angular size is the open question. |
| Dan Marrone | EHT scientist | External validator of array geometry. Caught longitude sign error (fixed in 54c855b). |

---

## OPEN BLOCKERS

**1. Angular size** — RESOLVED 2026-04-24 (S8). Named targets now use physically correct source size: M87* 42 μas, Sgr A* 50 μas. effectiveSourceFraction = shadowUas/fovMuas, auto-rescales with FOV. Phase 2 is unblocked.

**2. IMAGE_SIZE = N** — RESOLVED for N=512. N=512 benchmarked at 414–690ms CLEAN (acceptable for demo). IMAGE_SIZE is now permanently 512 in constants.js. N=1024 question deferred to Alejandro meeting — only needed if beam must reach 8+ pixels at M87* physical scale.

**3. Tour projector timing — OPEN (soft, before the talk).** The engine-real tour's Act C runs CLEAN live in both modes because the dev-machine gate measured CLEAN ≈ 98 ms (< 300 ms). This must be re-measured on the actual projector-class laptop (CPU-bound JS). If CLEAN > 300 ms there, switch presenter-mode Act C to precomputed playback of cached real frames (the never-stall timeout→cache fallback in sceneC.js already exists). Numbers + decision rule in TOUR-ENGINE-AUDIT.md §2.

**4. feature/tour-world-class-overhaul NOT merged to main — OPEN.** The entire tour overhaul (world-class → apple-precision → design-language → engine-real rebuild) lives on this branch and is NOT yet live. Merge/push to main to deploy. Recommend a demo/sign-off with Alejandro first.

**No code blockers** — simulator + engine-real tour are feature-complete on the branch.

---

## WHAT'S WORKING

Full VLBI simulation pipeline — S1 through S12c complete:
- 3D globe (Three.js) for telescope placement by globe click or array preset load
- **Array presets**: EHT 2017 (8 stations), EHT 2022 (11), ngEHT Phase 1 (17); STATION_SEFD table
- **BHEX space telescope**: Keplerian orbit UV, globe satellite rendering; UV extends to ~35 Gλ
- UV coverage synthesis (TMS eq. 4.1, conjugate symmetry); ground-ground and ground-space baselines
- **Elevation cutoffs**: 10° minimum per telescope per HA step — SPT excluded at M87*, GLT at Sgr A*
- Web Worker: CLEAN (elliptical restore beam from PSF), Max Entropy, dirty-only
- **Physical beam taper**: FWHM = 1.02λ/D; fwhm_px = (fwhm_rad/fovRad)×N
- **CLEAN stopping**: 3×noiseRms (outer 10% border estimator)
- **Per-baseline SEFD noise**: σ ∝ sqrt(SEFD_i × SEFD_j)/sefdGeomMean × visRms
- **Elliptical restore beam**: dual-axis PSF scan → sigmaU/sigmaV; displayed in ContourMap
- **Sky target selector**: M87*, Sgr A*, 3C 279, Cen A, Custom — auto-sets declination
- **Physically correct source size**: M87* 42 μas, Sgr A* 50 μas; effectiveSourceFraction = shadowUas/fovMuas; auto-scales with FOV
- **Image quality metrics panel**: beam FWHM, dynamic range (MAD), UV fill %, UV samples, max baseline (km/Gλ), angular resolution
- **UV SNR color mode**: toggle button; gold = ALMA-anchored baselines, grey = high-SEFD; hsl(45, sat%, light%)
- **FITS export**: valid WCS headers (CRVAL1/2, CDELT1/2, CRPIX, FREQ, BMAJ/BMIN, BUNIT); big-endian float32; 2880-byte blocks; row-flipped for FITS convention
- **useSimulation hook**: all sim state extracted; App.js is global UI only (compareMode, a11y, tour, modals)
- **Compare mode**: two independent simulation panes side-by-side; each with its own Globe, controls, UVMap, images, ContourMap; toggle from AppSidebar; Exit via header button
- ContourMap: viridis colormap, marching squares, HTML overlays, axis ticks ±FOV/2 and ±FOV/4, adaptive DR contour levels
- StatusBar: reconstruction status; MetricsPanel: floating collapsible over globe bottom-right
- Tour, A11y panel, Physics Notes modal, Citation modal (all hidden in compare mode)

---

## WHAT TO DO NEXT

The simulator AND the engine-real tour are feature-complete on `feature/tour-world-class-overhaul`.

1. **⚠ Re-run the tour timing gate on the projector laptop** before the talk (Blocker #3). If CLEAN > 300 ms there, flip presenter-mode Act C to cached-frame playback.
2. **Demo session with Prof. Cárdenas-Avendaño** — walk through the new engine-real tour (5 acts A–E, presenter mode via ?mode=presenter), compare mode (EHT 2017 vs ngEHT Phase 1), metrics panel. Confirm the BHEX "characteristic ~ R⊕+h · pending sign-off" framing in Act E with Marrone/Alejandro.
3. **Merge `feature/tour-world-class-overhaul` → main** (Blocker #4) to deploy the tour overhaul. Nothing on this branch is live yet.
4. **Harvard EHT talk preparation** — presenter-mode tour for the talk; a reference compare-mode screenshot (EHT 2017 vs ngEHT Phase 1, both CLEAN on M87* @ 230 GHz).
5. **Future enhancements** (no specific session planned; all require Alejandro sign-off): multi-component sources; dynamic source structure; frequency-dependent source size; re-expose Export FITS button.
6. **Knowledge base is current as of 2026-06-10** — synced post Tour Engine-Real Rebuild.

---

## SESSION TOOLING (added 2026-04-15)

- `/journal` — load today's Obsidian daily note and check blockers
- `/handoff` — run at session end. Writes structured handoff doc AND rewrites primer.md. This is the only place primer.md gets updated — do not skip it.
- `/sync` — update knowledge files from git diff, commit changes
- All 9 slash commands documented in Obsidian: `Claude-Stack/Commands.md`
- Multi-instance structure live: `.workflows/_instance-1/2/3/` + `.workflows/_shared/`
- CLAUDE.md Section 15 documents multi-instance coordination rules

---

## LAST SIGNIFICANT COMMITS

```
64480e5  chore(vlbi-react): tour — retire hand-drawn TourCard/TourDiagram
facf32e  feat(vlbi-react): tour Act E — Beyond Earth & the Instrument (real BHEX coverage)
0d39bac  feat(vlbi-react): tour Act D — First Light (real photo + own reconstruction)
31f7c38  feat(vlbi-react): tour Act C — From Data to Image (real CLEAN pipeline)
22ae0e3  feat(vlbi-react): tour Act A — Resolution (engine-real dirty beam)
170b7c6  feat(vlbi-react): tour Act B — The Synthesized Aperture (engine-real)
8b0466d  feat(vlbi-react): tour Phase 1 — engine-real act framework
2fd3bea  feat(vlbi-react): tour Phase 0 — simCore/simRender extraction + timing gate
2abace3  chore: sync knowledge — tour design-language conformance (pass 3)
1051e69  feat(vlbi-react): tour C-5 — re-skin d05 + d08 to site palette + Phase D gates
```

Files in Tour Engine-Real Rebuild (2fd3bea..64480e5):
- NEW: `vlbi-react/js/simCore.js`, `simRender.js`, `tourActs.js`, `tourScenes.js`, `tourScene.js`, `tourAnnotations.js`, `sceneA.js`, `sceneB.js`, `sceneC.js`, `sceneD.js`, `sceneE.js`, `TourEquation.js`, `TourSpine.js`; `.workflows/_system/TOUR-ENGINE-AUDIT.md`
- REWRITTEN: `vlbi-react/js/Tour.js`; `vlbi-react/css/tour.css` (+engine-tour chrome)
- BEHAVIOR-NEUTRAL EDITS: `useSimulation.js`, `ContourMap.js`, `ImageCanvas.js` (import simCore/simRender back), `worker.js` (+opt-in progressEvery)
- DELETED: `vlbi-react/js/TourCard.js`, `vlbi-react/js/TourDiagram.js`

Files modified in Tour Art Pass (614932a):
- `vlbi-react/js/TourDiagram.js` — complete rewrite of d01()–d08(): color constants, STARS[180] array, bloom filter defs (diagram-scoped), metallic dishes, painted Earth spheres, continent outlines, 9 stations (d04), sidelobe→photon transformation (d05), BHEX data beam + 3-layer star field (d07), luminous CTA (d08)
- `vlbi-react/css/tour.css` — additive: .earth-group-cinema transform-origin 290×350; station-dot-9/label-9; 14 new @keyframes (pulseTravel, uvPointAppear, stationPulse, baselinePulse, sidelobeRingFade1–5, photonRingReveal, shadowReveal, labelDirtyFade, labelCleanFade, dataPulse); 10 new animation classes; transform-box: fill-box on .baseline-pulse; full reduced-motion block extension

Files modified in Tour Cinematic Rewrite (d3b13b0):
- `assets/eht-m87-2019.jpg` — new: real EHT M87* image, 36KB JPEG, from Wikimedia Commons
- `vlbi-react/css/tour.css` — full rewrite: .tour-cinematic full-viewport, .tour-hero SVG bg, .tour-text-overlay (right 32%), animPhase CSS; @keyframes: waveSweepCinema, earthRotateCinema, drawArc, stationReveal, lineReveal, scrubberMove, cleanHighlight, imageReveal, panelSlideIn, chapterReveal; .uv-draw-1/2/3 stroke-dashoffset; .station-dot-1..8 sequential stagger; .scrubber-reveal translateX(422px); full reduced-motion suppression
- `vlbi-react/js/Tour.js` — full rewrite: 8-act TOUR_ACTS; animPhase state machine (visual→text→ready); CHAPTER_CARDS at actIndex 2 and 5; setChapterCard(false) guard at top of animPhase effect; 3 timer refs (animTimerRef, textTimerRef, chapterTimerRef); ranAutoRef autoAction dedup
- `vlbi-react/js/TourCard.js` — full rewrite: visibleCount single useEffect; .tour-hero SVG + .tour-text-overlay layout; .text-right for act.diagramId===6; chapter badge; progress bar width=(actIndex/(totalActs-1))*100%
- `vlbi-react/js/TourDiagram.js` — Canvas 2D rewrite (bed2d45): d01–d08 React components with RAF. Supersedes all prior SVG/CSS versions.

---

## QUICK ORIENTATION: vlbi-react Component Map

```
App.js ─── global UI only (compareMode, modals, a11y, tour)
│           const left = useSimulation()   ← always instantiated
│           const right = useSimulation()  ← always instantiated (idle when not in compare mode)
├── AppSidebar.js ─────── sidebar (single-pane only); compare toggle at TOP; preset auto-loads on select
├── Globe.js ─────────── Three.js 3D globe; ResizeObserver handles any container size
├── SimPane.js ─────────── compact pane for compare mode; collapsible telescope section (BHEX inside)
├── MetricsPanel.js ────── collapsible floating panel: beam FWHM, DR, UV fill, baselines
├── UVMap.js ─────────── UV coverage canvas; pair-color mode + SNR-color mode
├── ImageCanvas.js ───── dirty/restored canvas panels
├── ContourMap.js ─────── viridis + marching squares + Dirty/CLEAN toggle (no Export FITS button in UI)
├── PhysicsNotesModal.js  static: UV formula, CLEAN/MEM, EHT sources (hidden in compare mode)
├── CitationModal.js ──── BibTeX + APA from live sim state (hidden in compare mode)
├── Tour.js ─────────── 8-act cinematic tour; animPhase state machine (visual→text→ready); chapter title cards before Ch II/III; keyboard nav; autoActions; SVG diagrams
└── A11yPanel.js ──────── accessibility settings (hidden in compare mode)

useSimulation.js ─ custom hook. All sim state, effects, memos, handlers. Each call = one worker.
worker.js ─ self-contained (no imports). Handles 'reconstruct' messages. (MEM code preserved)
fitsExport.js ─ exportFITS(): FITS binary writer with WCS headers. (Button removed from UI in P1)
uvCompute.js ─ UV math (computeUVPoints [pixel/reconstruction], computeUVPointsGl [Gλ/display])
constants.js ─ IMAGE_SIZE=512, TELESCOPE_COLORS, ARRAY_PRESETS, STATION_SEFD, SKY_TARGETS, INFO
```

---

## LAST UPDATED

2026-06-11 — Tour Polish Pass complete (feature/tour-world-class-overhaul, 7 commits): WAVE 1 bugs — Act B baselines labeled by identity (|B| ALMA–IRAM vs B_max (M87*) vs |u|max relation line); narrative dedup ("8 stations stations" interpolation fixed, rendered-text regex clean); Act C/D ring legibility ROOT-CAUSED to source sizing (png ring spans 42.6% of frame, fixed 0.525 fraction undersized the displayed ring 2.3× → blob) — now measured via measureRingFraction + zoomSource, restored panel drawHot, scale bars computed; Act E hedge stated once (equation status row) + solid amber Earth-limit ring vs orange space arcs (per-pair colours stripped). WAVE 2 richness — ONE unified narrative per act (tier tabs/narrativeTriple deleted; tourPhysics gains computed uvFillPct + TOUR_FOV_MUAS/TOUR_DURATION_HR; layout 62vh visual + wider column); tourEarth.js read-only textured Three.js singleton (main-globe look by construction, Acts B/E, disposed on tour unmount); tourGalaxy.js parallax-starfield + nebula background on all acts (subordinate to gold data layer; static under reduced motion — frame-diff verified pixel-identical); subjects + text enlarged; Act C restaged as causal sparse→dirty→CLEAN pipeline with labeled THERMAL NOISE slider (range 0…0.25× RMS, engine-measured noise-limit; sparkline names the noise-limited state); Act D resolve-in reveal + "10 APRIL 2019" typographic moment. Gates G1–G8 Playwright-verified on fresh no-cache ports. decisions.md (+1), gotchas.md (+8, obsolescence note), codebase.md tour section updated. ⚠ FLAGGED: live app sidebar "Source: 42 μas (52.5% of FOV)" carries the same ring-fills-frame assumption (out of tour scope). NOT merged to main.

2026-06-09 — Tour Design-Language Conformance (pass 3) complete (feature/tour-world-class-overhaul): DESIGN-LANGUAGE.md extracted from vlbi-react/css/app.css (single source of visual truth); new tourTokens.js reads app :root tokens; whole tour re-skinned to the site (warm-neutral + muted-gold #C4A555, Inter/--font-mono, flat #2d2200 panels, no serif) — glassy cards→site panels, candy nebulae→amber/cool dust, cyan/bright-gold→accent. Scene art moderate-desaturated; Earth keeps realistic blue. 7 commits (docs + C-1..C-5). Physics a no-op; pass-2 gains preserved; 0 HUD/8 RAF/8 r-m intact. decisions.md (DESIGN-LANGUAGE/tourTokens decision) + gotchas.md (4 entries) updated. NOT merged to main.

2026-06-09 — Tour Apple-Precision Overhaul (pass 2) complete (feature/tour-world-class-overhaul): Phase 0 physics — shadow-coefficient bug fixed + single-sourced (2√27 diameter); HEADLINE baseline corrected to M87*-observing max (SPT excluded via imported elevation filter → IRAM–JCMT 10,883 km/25 μas), both values exposed, "M87*" qualifier swept Acts 1/2/4/7/8, TOUR-PHYSICS-AUDIT.md written. Deference — all HUD frames removed, glass cards cut to Acts 1&5 (+slim d07), tags quieted. Depth — new drawPlanet modeled Earth (d03/d07), subject-scale enlargements, d05 dirty→clean transformation, d08 ngEHT-sharper, d04 recognizable continents + label dodging, d06 hero photo. 6 commits (Phase 0,1,2a–2d) + this sync. decisions.md (M87*-baseline+deference decision) + gotchas.md (updated baseline/shadow/deference/drawPlanet entries). Contract unchanged. NOT yet merged to main.
2026-06-08 — Tour World-Class Overhaul complete (feature/tour-world-class-overhaul): new tourPhysics.js single-source-of-truth (every tour number computed, θ=λ/B no 1.22, imports canonical latLonToECEF); fixed all asserted/contradictory numbers (d04 20→24 μas, d08 24-vs-20 resolved, d02 B computed 11,406 km); BHEX integrity reframe (d07 "B ~ R⊕+h … pending sign-off"); depth/derivation utility library appended to TourDiagram.js; all 8 acts get derivation panels + concept tags + labelled axes + filled frames; Tour.js prose aligned; contract unchanged. decisions.md (tourPhysics decision) + gotchas.md (4 entries) + this file updated. Audit/spec in _system/TOUR-AUDIT.md + TOUR-SPEC.md.
2026-04-28 — Canvas 2D cinematic rewrite complete (bed2d45): TourDiagram.js fully rewritten from SVG/htm to Canvas 2D RAF loops. d01–d08 React components. Shared Canvas 2D utilities. tour.css canvas rule. decisions.md SVG bloom filter decision marked SUPERSEDED. gotchas.md 3 new Canvas 2D entries. MEMORY.md updated. SESSION-CONTINUITY updated.
2026-04-27 — Smithsonian Art Pass complete (documentary-paced animation, one motion per act, new CSS class names for d05/d08, BG color update, 10 new keyframes + 19 new classes); WHERE WE ARE, commits, LAST UPDATED all updated
2026-04-26 — Tour Art Pass complete (bloom filters, star fields, painted Earth, sidelobe→photon transformation, BHEX data beam, CTA); WHERE WE ARE, commits, LAST UPDATED all updated
2026-04-26 — Tour Cinematic Rewrite complete (8-act, animPhase machine, chapter cards, real EHT image); WHERE WE ARE, component map, commits, what to do next all updated
2026-04-24 — P1/P2/P3 complete (UI polish + tour rework); component map, commits, what to do next all updated
2026-04-24 — S9–S12c complete (all planned sessions done); component map, what's working, what to do next all updated
2026-04-24 — S8 complete (angular size blocker resolved); Phase 2 unblocked; all sections updated
2026-04-22 — Three-session physics upgrade complete (S1/S2/S3); WHERE WE ARE, WHAT'S WORKING, WHAT TO DO NEXT, LAST SIGNIFICANT COMMITS all updated
2026-04-20 — fovMuas default 538→80 (M87* physical scale); UV display now uses independent Gλ pipeline (computeUVPointsGl); UVMap auto-scales to UV extent in Gλ; last commits updated
2026-04-16 — N=512 benchmark resolved; IMAGE_SIZE permanently 512; sourceFraction default 0.50; contour boundary fix; last commits updated
2026-04-15 — Added session tooling section (new slash commands, multi-instance structure); updated last commit and knowledge base date
2026-04-15 — Elevated project scope to Harvard EHT talk / research-grade standard; added N benchmark blocker; updated WHAT TO DO NEXT
