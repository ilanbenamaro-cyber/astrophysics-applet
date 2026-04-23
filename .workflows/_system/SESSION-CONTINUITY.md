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

**Phase 2: BLOCKED** — pending meeting with Prof. Cárdenas-Avendaño on angular size
> Do not implement any Phase 2 features until the blocker is resolved.
> The three-session physics upgrade was orthogonal to Phase 2 — it did not unblock Phase 2.

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

**1. Angular size** — source always fills the entire FOV regardless of any source size parameter. This is physically incorrect. A radio source at a given angular size should subtend a specific angle in the image.

- This blocks Phase 2 features: source size slider, multi-component sources, physically-scaled reconstruction, μas-accurate displays.
- Do not implement Phase 2 until this is resolved.
- Resolution requires a meeting with Prof. Cárdenas-Avendaño.

**2. IMAGE_SIZE = N** — RESOLVED for N=512. N=512 benchmarked at 414–690ms CLEAN (acceptable for demo). IMAGE_SIZE is now permanently 512 in constants.js. N=1024 question deferred to Alejandro meeting — only needed if beam must reach 8+ pixels at M87* physical scale.

---

## WHAT'S WORKING

Full VLBI simulation pipeline + three-session physics upgrade (S1/S2/S3):
- 3D globe (Three.js) for telescope placement by globe click or array preset load
- **Array presets**: EHT 2017 (8 stations), EHT 2022 (11), ngEHT Phase 1 (17) — dropdown + Load Array button; STATION_SEFD table at 230 GHz
- **BHEX space telescope**: + BHEX Satellite button; Keplerian orbit (alt 26562 km, inc 86°); gold sphere + orbital ring on globe; UV extends to ~35 Gλ vs ~10 Gλ EHT-only
- UV coverage synthesis (TMS eq. 4.1, conjugate symmetry); ground-ground and ground-space baselines
- Web Worker for off-main-thread reconstruction (CLEAN, Max Entropy, dirty-only)
- **Physical beam taper**: FWHM = 1.02λ/D; fwhm_px = (fwhm_rad/fovRad)×N
- **CLEAN stopping**: 3×noiseRms (outer 10% border estimator) — standard radio astronomy practice
- **Per-baseline SEFD noise**: σ ∝ sqrt(SEFD_i × SEFD_j)/sefdGeomMean × visRms (ALMA 0.15×, SMT/SPT 2.1×)
- ContourMap: viridis colormap, marching squares, beam ellipse, adaptive DR thresholds, HTML overlay labels
- Tour, A11y panel, Physics Notes modal, Citation modal
- Angular resolution display (μas), info tooltips, contour overlays

---

## WHAT TO DO NEXT

1. **Push to main** — `git push origin main` to deploy three-session physics upgrade to GitHub Pages
2. **Get Alejandro's answers to blocking physics questions before any Phase 2 implementation** (see MEMORY.md)
3. **Schedule/attend meeting with Prof. Cárdenas-Avendaño** — angular size is the Phase 2 blocker
4. **Phase 2 feature list is TBD** from that meeting — do not spec or build Phase 2 in advance
5. If user asks for small improvements to existing features (UI polish, copy tweaks, bug fixes) — those are safe to implement without waiting for the meeting
6. **Knowledge base is current as of 2026-04-22** — synced post three-session physics upgrade

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

2026-04-22 — Three-session physics upgrade complete (S1/S2/S3); WHERE WE ARE, WHAT'S WORKING, WHAT TO DO NEXT, LAST SIGNIFICANT COMMITS all updated
2026-04-20 — fovMuas default 538→80 (M87* physical scale); UV display now uses independent Gλ pipeline (computeUVPointsGl); UVMap auto-scales to UV extent in Gλ; last commits updated
2026-04-16 — N=512 benchmark resolved; IMAGE_SIZE permanently 512; sourceFraction default 0.50; contour boundary fix; last commits updated
2026-04-15 — Added session tooling section (new slash commands, multi-instance structure); updated last commit and knowledge base date
2026-04-15 — Elevated project scope to Harvard EHT talk / research-grade standard; added N benchmark blocker; updated WHAT TO DO NEXT
