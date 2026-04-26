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

**Tour Cinematic Rewrite: COMPLETE** — committed 2026-04-25/26
> `8eb63cb`: tour diagram upgrade — richer SVG, more math, 700×500 viewBox, 12 acts with 3 paragraphs each
> `2c9f59b`: tour diagram fixes — elliptic UV arcs (SVG A arc syntax), equirectangular grid world map, CLEAN animation fix
> `d3b13b0`: cinematic 8-act tour full rewrite — animPhase state machine (visual→text→ready); chapter title cards before Ch II (act 3) and Ch III (act 6); 1200×700 viewBox; deep-space visual language (#010103 bg, gold equations, teal data); real EHT M87* image Act 6 (assets/eht-m87-2019.jpg 36KB JPEG); Tour contract (App.js wiring + exported function signature + autoAction types) unchanged

**ALL PLANNED SESSIONS COMPLETE — S1 through P3 + Tour Cinematic Rewrite + Tour Art Pass**

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

**No current blockers** — All S1–S12 features complete and live.

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

All S1–S12 + P1/P2/P3 are complete. The simulator is feature-complete for the Harvard EHT talk.

1. **Demo session with Prof. Cárdenas-Avendaño** — walk through tour (8 acts, cinematic), compare mode (EHT 2017 vs ngEHT Phase 1), metrics panel, SNR color coding.
2. **Harvard EHT talk preparation** — prepare a reference screenshot of compare mode: EHT 2017 (left) vs ngEHT Phase 1 (right), both CLEAN on M87* at 230 GHz.
3. **Future enhancements** (no specific session planned):
   - Multi-component sources (model with multiple point sources or Gaussians)
   - Dynamic source structure (accretion disk animation)
   - Frequency-dependent source size (spectral index)
   - Re-expose Export FITS button (code in fitsExport.js is intact — just needs button in ContourMap or toolbar)
   - These all require Alejandro sign-off before implementation.
4. **Knowledge base is current as of 2026-04-26** — synced post Tour Cinematic Rewrite.

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
614932a  feat(vlbi-react): tour art pass — bloom filters, star fields, painted Earth, sidelobe→photon transformation, BHEX data beam, luminous CTA
f12d196  fix(vlbi-react): tour layout — visual top 68vh, text panel bottom, zero overlap
bb81ed1  chore: sync knowledge files post-session 2026-04-26
d3b13b0  feat(vlbi-react): cinematic 8-act tour — full rewrite
2c9f59b  fix(vlbi-react): tour diagram fixes — elliptic UV arcs, grid world map, CLEAN animation
8eb63cb  feat(vlbi-react): tour diagram upgrade — richer SVG, more math, 700×500 viewBox, no text overlaps
be577e3  chore: sync knowledge files post-session 2026-04-24
24ae8b6  feat(vlbi-react): P3 — full-screen 12-act tour with SVG diagrams
```

Files modified in Tour Art Pass (614932a):
- `vlbi-react/js/TourDiagram.js` — complete rewrite of d01()–d08(): color constants, STARS[180] array, bloom filter defs (diagram-scoped), metallic dishes, painted Earth spheres, continent outlines, 9 stations (d04), sidelobe→photon transformation (d05), BHEX data beam + 3-layer star field (d07), luminous CTA (d08)
- `vlbi-react/css/tour.css` — additive: .earth-group-cinema transform-origin 290×350; station-dot-9/label-9; 14 new @keyframes (pulseTravel, uvPointAppear, stationPulse, baselinePulse, sidelobeRingFade1–5, photonRingReveal, shadowReveal, labelDirtyFade, labelCleanFade, dataPulse); 10 new animation classes; transform-box: fill-box on .baseline-pulse; full reduced-motion block extension

Files modified in Tour Cinematic Rewrite (d3b13b0):
- `assets/eht-m87-2019.jpg` — new: real EHT M87* image, 36KB JPEG, from Wikimedia Commons
- `vlbi-react/css/tour.css` — full rewrite: .tour-cinematic full-viewport, .tour-hero SVG bg, .tour-text-overlay (right 32%), animPhase CSS; @keyframes: waveSweepCinema, earthRotateCinema, drawArc, stationReveal, lineReveal, scrubberMove, cleanHighlight, imageReveal, panelSlideIn, chapterReveal; .uv-draw-1/2/3 stroke-dashoffset; .station-dot-1..8 sequential stagger; .scrubber-reveal translateX(422px); full reduced-motion suppression
- `vlbi-react/js/Tour.js` — full rewrite: 8-act TOUR_ACTS; animPhase state machine (visual→text→ready); CHAPTER_CARDS at actIndex 2 and 5; setChapterCard(false) guard at top of animPhase effect; 3 timer refs (animTimerRef, textTimerRef, chapterTimerRef); ranAutoRef autoAction dedup
- `vlbi-react/js/TourCard.js` — full rewrite: visibleCount single useEffect; .tour-hero SVG + .tour-text-overlay layout; .text-right for act.diagramId===6; chapter badge; progress bar width=(actIndex/(totalActs-1))*100%
- `vlbi-react/js/TourDiagram.js` — full rewrite: 8 SVG functions d01()–d08(), viewBox="0 0 1200 700", #010103 bg; d06 uses ../assets/eht-m87-2019.jpg

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
