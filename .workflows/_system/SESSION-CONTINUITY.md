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

**Phase 2: BLOCKED** — pending meeting with Prof. Cárdenas-Avendaño on angular size
> Do not implement any Phase 2 features until the blocker is resolved.

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

## WHAT'S WORKING (Phase 1 complete)

Full VLBI simulation pipeline:
- 3D globe (Three.js) for telescope placement by globe click or EHT preset load
- UV coverage synthesis (Thompson, Moran & Swenson eq. 4.1, conjugate symmetry)
- Web Worker for off-main-thread reconstruction (CLEAN, Max Entropy, dirty-only)
- Dirty image (raw IFFT), CLEAN deconvolution (Högbom), Max Entropy Method
- ContourMap: viridis colormap, marching squares contours, beam ellipse, adaptive dynamic range thresholds, HTML overlay labels (no canvas text)
- Tour: guided walkthrough of the simulation
- A11y panel: screen-reader descriptions of sim state
- Physics Notes modal: UV formula, CLEAN/MEM algorithms, EHT station sources
- Citation modal: BibTeX + APA generator from live sim state
- Angular resolution display (μas)
- Contour overlays on dirty/restored image panels
- Info tooltips on all panels

---

## WHAT TO DO NEXT

1. **Get Alejandro's answers to three blocking physics questions before any Phase 2 implementation** (see MEMORY.md entry "Project scope elevated to Harvard EHT talk standard")
2. **Schedule/attend meeting with Prof. Cárdenas-Avendaño** — angular size, N benchmark, FOV approach
3. **Benchmark N=512 and N=1024** in Web Worker — measure CLEAN ms/iteration before committing to IMAGE_SIZE
4. **Phase 2 feature list is TBD** from that meeting — do not spec or build Phase 2 in advance
5. If user asks for small improvements to Phase 1 features (UI polish, copy tweaks, bug fixes) — those are safe to implement without waiting for the meeting
6. **Knowledge base is current as of 2026-04-20** — all files reconstructed 2026-04-12, synced 2026-04-20

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
8c6ba01  feat(vlbi-react): M87* physical defaults, UV Gλ auto-scale, independent UV display pipeline
f92e721  chore: add .gitignore — exclude playwright artifacts and screenshots
335497a  feat(vlbi-react): N=512, FOV-derived UV scale, M87* physical defaults, contour boundary fix
394fbb2  system: document Stop hook fix and /handoff primer.md ownership
bc212cb  feat(vlbi-react): Phase 1 complete — contour map, physics notes, citation modal
```

Files modified in 2026-04-20 session (8c6ba01):
- `vlbi-react/js/App.js` — fovMuas default: 538→80; added `uvPointsGl` state; imports `computeUVPointsGl`; useEffect computes uvPointsGl; UVMap now receives uvPointsGl (not uvPoints)
- `vlbi-react/js/UVMap.js` — full rewrite: receives Gλ coords (centered at 0,0); auto-scales canvas to max UV × 1.2; axis labels in Gλ; no FOV/frequency props
- `vlbi-react/js/uvCompute.js` — added `computeUVPointsGl` (Gλ display pipeline); removed temporary diagnostic console.log
- `vlbi-react/js/constants.js` — INFO.uvmap body updated to describe Gλ auto-scaling

Files modified in 2026-04-16 session (335497a):
- `vlbi-react/js/constants.js` — IMAGE_SIZE confirmed 512 (was already set)
- `vlbi-react/js/worker.js` — removed console.time/timeEnd benchmark instrumentation
- `vlbi-react/js/App.js` — sourceFraction default: 0.25 → 0.50 (both useState and handleReset)
- `vlbi-react/js/ContourMap.js` — boundary clip check on segment drawing loop (onBoundary epsilon=1px)
- `.workflows/_knowledge/decisions.md` — IMAGE_SIZE→512 decision added, 256 entry SUPERSEDED
- `.gitignore` — created (excludes .playwright-mcp/, test-results/, *.png)

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

2026-04-20 — fovMuas default 538→80 (M87* physical scale); UV display now uses independent Gλ pipeline (computeUVPointsGl); UVMap auto-scales to UV extent in Gλ; last commits updated
2026-04-16 — N=512 benchmark resolved; IMAGE_SIZE permanently 512; sourceFraction default 0.50; contour boundary fix; last commits updated
2026-04-15 — Added session tooling section (new slash commands, multi-instance structure); updated last commit and knowledge base date
2026-04-15 — Elevated project scope to Harvard EHT talk / research-grade standard; added N benchmark blocker; updated WHAT TO DO NEXT
