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

**Phase 2: UNBLOCKED** — angular size blocker resolved 2026-04-24
> Prof. Cárdenas-Avendaño approved approach: sourceFraction = shadowUas / fovMuas
> Phase 2 features can now proceed — see WHAT TO DO NEXT below.

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

---

## WHAT'S WORKING

Full VLBI simulation pipeline — S1 through S8 complete:
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
- ContourMap: viridis colormap, marching squares, HTML overlays, axis ticks ±FOV/2 and ±FOV/4
- StatusBar: baseline stats (km + Gλ); PhysicsNotesModal: SEFD + BHEX sections; CitationModal: conditional refs
- Tour, A11y panel, Physics Notes modal, Citation modal

---

## WHAT TO DO NEXT

1. **Phase 2 is now unblocked** — angular size resolved in S8. Phase 2 features can proceed with Alejandro sign-off.
2. **Discuss Phase 2 scope with Prof. Cárdenas-Avendaño** — what features are next? Multi-component sources? Dynamic range metrics? Source structure variations?
3. **INFO.sourceSize tooltip** in constants.js is stale — it still references the old 538 μas / 25% / 134 μas text. Update to reflect the new 80 μas / physically-derived approach.
4. **Knowledge base is current as of 2026-04-24** — synced post S8.

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
1f9682c  feat(vlbi-react): S3 — BHEX space telescope, Keplerian orbit UV, globe satellite rendering
c87b715  feat(vlbi-react): S2 — physical beam taper, noise-floor CLEAN, per-baseline SEFD noise
3522052  feat(vlbi-react): S1 — EHT 2017/2022/ngEHT presets, SEFD constants table
e0385fc  chore: sync knowledge files post-session 2026-04-20
8c6ba01  feat(vlbi-react): M87* physical defaults, UV Gλ auto-scale, independent UV display pipeline
```

Files modified in 2026-04-22 session — S1 (3522052):
- `vlbi-react/js/constants.js` — TELESCOPE_COLORS extended to 17 entries; ARRAY_PRESETS added (3 presets); STATION_SEFD added
- `vlbi-react/js/App.js` — selectedArrayPreset state; loadEHTPresets delegates to ARRAY_PRESETS; handleLoadArrayPreset callback
- `vlbi-react/js/AppSidebar.js` — array preset dropdown replaces single "Load EHT Array" button; "† Reference array" note for ngEHT
- `vlbi-react/css/app.css` — .preset-selector-row, .preset-select, .preset-note, .bhex-button styles added

Files modified in 2026-04-22 session — S2 (c87b715):
- `vlbi-react/js/uvCompute.js` — computeUVPoints now returns {uvPoints, stationPairs}; stationPairs pushed in parallel
- `vlbi-react/js/App.js` — stationPairs state added; UV useEffect destructures new return; worker postMessage adds fovRad, stationPairs, sefdMap
- `vlbi-react/js/worker.js` — physical beam taper (1.02λ/D+fovRad); estimateNoiseRms (border estimator); CLEAN stop→3×RMS; addPerBaselineNoise replaces addNoise

Files modified in 2026-04-22 session — S3 (1f9682c):
- `vlbi-react/js/constants.js` — BHEX_PRESET added
- `vlbi-react/js/uvCompute.js` — computeSatelliteECEF added; ground-space baseline loops in computeUVPoints + computeUVPointsGl
- `vlbi-react/js/App.js` — BHEX_PRESET import; bhexAdded computed; handleAddBHEX callback; bhexAdded+onAddBHEX props passed to AppSidebar
- `vlbi-react/js/AppSidebar.js` — BHEX button (disables when added)
- `vlbi-react/js/Globe.js` — satelliteGroupRef; syncSatelliteMarkers imported and called; satelliteGroup in cleanup
- `vlbi-react/js/globeHelpers.js` — syncSatelliteMarkers added; syncTelescopeMarkers guards space telescopes; baseline arcs exclude space
- `vlbi-react/js/TelescopeList.js` — space telescopes show "N km orbit" instead of lat/lon

---

## QUICK ORIENTATION: vlbi-react Component Map

```
App.js ─── root state, worker lifecycle, layout
├── Globe.js ─────────── Three.js 3D globe
├── ControlsPanel.js ─── sliders: noise, freq, duration, decl, dish, method
├── UVMap.js ─────────── UV coverage canvas
├── ImageCanvas.js ───── dirty/restored canvas panels
├── ContourMap.js ─────── viridis + marching squares (see decisions.md #13, #14, #15)
├── PhysicsNotesModal.js  static: UV formula, CLEAN/MEM, EHT sources
├── CitationModal.js ──── BibTeX + APA from live sim state
├── Tour.js ─────────── guided walkthrough
└── A11yPanel.js ──────── screen-reader descriptions

worker.js ─ self-contained (no imports). Handles 'reconstruct' messages.
uvCompute.js ─ UV math (baselineToUV, computeUVPoints [pixel/reconstruction], computeUVPointsGl [Gλ/display], computeUVFill)
constants.js ─ IMAGE_SIZE, EARTH_RADIUS_KM, TELESCOPE_COLORS, EHT_PRESETS, INFO, ISO_COUNTRY_NAMES
```

---

## LAST UPDATED

2026-04-24 — S8 complete (angular size blocker resolved); Phase 2 unblocked; all sections updated
2026-04-22 — Three-session physics upgrade complete (S1/S2/S3); WHERE WE ARE, WHAT'S WORKING, WHAT TO DO NEXT, LAST SIGNIFICANT COMMITS all updated
2026-04-20 — fovMuas default 538→80 (M87* physical scale); UV display now uses independent Gλ pipeline (computeUVPointsGl); UVMap auto-scales to UV extent in Gλ; last commits updated
2026-04-16 — N=512 benchmark resolved; IMAGE_SIZE permanently 512; sourceFraction default 0.50; contour boundary fix; last commits updated
2026-04-15 — Added session tooling section (new slash commands, multi-instance structure); updated last commit and knowledge base date
2026-04-15 — Elevated project scope to Harvard EHT talk / research-grade standard; added N benchmark blocker; updated WHAT TO DO NEXT
