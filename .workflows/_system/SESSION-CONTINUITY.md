# Session Continuity — Astrophysics Applet
# _system/SESSION-CONTINUITY.md
#
# Zero-context resume document. If you are starting a new session with no prior
# context, read this file first. It tells you exactly where work left off and
# what to do next. Updated after each phase completes.

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

## OPEN BLOCKER

**Angular size** — source always fills the entire FOV regardless of any source size parameter. This is physically incorrect. A radio source at a given angular size should subtend a specific angle in the image.

- This blocks Phase 2 features: source size slider, multi-component sources, physically-scaled reconstruction, μas-accurate displays.
- Do not implement Phase 2 until this is resolved.
- Resolution requires a meeting with Prof. Cárdenas-Avendaño.

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

1. **Schedule/attend meeting with Prof. Cárdenas-Avendaño** on angular size implementation
2. **Phase 2 feature list is TBD** from that meeting — do not spec or build Phase 2 in advance
3. If user asks for small improvements to Phase 1 features (UI polish, copy tweaks, bug fixes) — those are safe to implement without waiting for the meeting
4. **Knowledge base is current as of 2026-04-15** — all files reconstructed 2026-04-12, synced 2026-04-15

---

## SESSION TOOLING (added 2026-04-15)

- `/journal` — load today's Obsidian daily note and check blockers
- `/handoff` — write structured handoff to `.workflows/_shared/handoff-[timestamp].md`
- `/sync` — update knowledge files from git diff, commit changes
- All 9 slash commands documented in Obsidian: `Claude-Stack/Commands.md`
- Multi-instance structure live: `.workflows/_instance-1/2/3/` + `.workflows/_shared/`
- CLAUDE.md Section 15 documents multi-instance coordination rules

---

## LAST SIGNIFICANT COMMITS

```
784e35a  chore: add multi-instance coordination structure
38653a7  system: reconstruct knowledge base to reflect April 2026 state
bc212cb  feat(vlbi-react): Phase 1 complete — contour map, physics notes, citation modal
```

Files modified in Phase 1 (bc212cb):
- `vlbi-react/js/ContourMap.js` (new) — professional contour map
- `vlbi-react/js/PhysicsNotesModal.js` (new) — physics notes
- `vlbi-react/js/CitationModal.js` (new) — citation generator
- `vlbi-react/js/App.js` — added ContourMap, modal wiring, image presets
- `vlbi-react/js/constants.js` — added INFO.contours, INFO.contourmap
- `vlbi-react/css/app.css` — ContourMap styles, modal styles

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
uvCompute.js ─ UV math (baselineToUV, computeUVPoints, computeUVFill)
constants.js ─ IMAGE_SIZE, EARTH_RADIUS_KM, TELESCOPE_COLORS, EHT_PRESETS, INFO, ISO_COUNTRY_NAMES
```

---

## LAST UPDATED

2026-04-15 — Added session tooling section (new slash commands, multi-instance structure); updated last commit and knowledge base date
