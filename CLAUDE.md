# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

Pure-JS web applet — radio telescope interferometry (VLBI) image reconstruction simulator.
No backend, no build step. Open `index.html` directly in a browser.

## Workflow System

This project uses a structured workflow system in `.workflows/`. **Always check `.workflows/_system/MANIFEST.md` before starting any non-trivial task** to route correctly.

### Available Workflows
- `feature-development/` — Build new features end-to-end (explore → plan → implement → test → commit)
- `bug-fix/` — Root cause analysis → fix → regression test → commit
- `security-audit/` — Vulnerability scanning and remediation
- `red-team/` — Adversarial testing after feature delivery
- `_pipelines/full-feature-delivery.md` — Composed pipeline: feature → security audit → tests

### System Files (read at session start)
- `.workflows/_system/MANIFEST.md` — Workflow routing table
- `.workflows/_system/DEVELOPER-PROFILE.md` — Developer preferences and trust levels
- `.workflows/_system/ENVIRONMENT.md` — Permission matrix per environment
- `.workflows/_knowledge/gotchas.md` — Known failure modes (populate as they are discovered)

## Developer Context

- **Developer:** Ilan — full-stack, Python + TypeScript/JavaScript
- **Auto-proceed:** tests, docs, lint fixes, single-file edits with HIGH confidence
- **Pause and confirm:** schema changes, auth modifications, multi-file refactors, anything at LOW confidence

## Knowledge Base

- `.workflows/_knowledge/codebase.md` — stack, data flow, patterns, entry points (populated)
- `.workflows/_knowledge/decisions.md` — architectural decisions with rationale and date
- `.workflows/_knowledge/gotchas.md` — failure modes and prevention steps

## Deployment

Live at: https://ilanbenamaro-cyber.github.io/astrophysics-applet/
Deployed via GitHub Pages from `main` branch root. Push to `main` to redeploy.

## Architecture

Two independent UIs share the same scientific domain:

**`index.html` (primary)** — Plain JS, no build step. Script load order is a hard dependency:
```
math.js (CDN) → Leaflet (CDN) → fft2d.js → interferometry.js → imageProcessor.js → sampleImages.js → mapController.js → infoModal.js → app.js
```

- `fft2d.js` — 2D FFT/IFFT + fftShift (wraps math.js 1D transforms)
- `interferometry.js` — ECEF coords, baseline→UV conversion, UV coverage synthesis, conjugate symmetry
- `imageProcessor.js` — image I/O (resize to 256×256), UV mask builder, reconstruction pipeline, canvas rendering
- `sampleImages.js` — procedural synthetic sources (`ring`, `double`, `gaussian`, `jet`); exposes `loadSampleImage(name)`
- `mapController.js` — Leaflet map, telescope markers, EHT presets, baseline table
- `infoModal.js` — info/help modal logic
- `app.js` — coordinator: event wiring, debounced `runReconstruction()` (50ms), status updates

**`vlbi-react/index.html` (companion)** — Standalone React 18 + Three.js app using ES import maps (no npm/build). Renders a 3D globe with telescope placement. Fully self-contained; shares no code with the primary app.

**Reconstruction pipeline** (`app.js` → `reconstructImage` in `imageProcessor.js`):
```
fft2d(grayscale) → buildUVMask(uvPoints) → applyUVMask → ifft2d → grayscaleToCanvas
```
All callers must use `runReconstruction()`, never `_reconstruct()` directly (debounce collapses batched updates from `loadPresets`).

**Key invariants:**
- All functions are global (`function` declarations, not `const`) — required for Leaflet popup `onclick` handlers
- `IMAGE_SIZE = 256` (power-of-2, hardcoded in `imageProcessor.js`) — changing requires verifying the new value is also power-of-2
- `removeTelescope` in `mapController.js` must remain a `function` declaration — called from Leaflet popup HTML string
- Every UV point (u,v) is paired with conjugate (-u,-v) in `computeUVCoverage` — mathematical requirement for real IFFT output
- UV index wrapping: `((value % N) + N) % N` (handles negative coordinates)
- `grayscaleToCanvas` auto-normalizes using data min/max — do not pre-normalize outputs before passing to it

## Build / Run / Test

**Primary app:** Open `index.html` in a browser. No server, no build step.
**React companion:** Open `vlbi-react/index.html` in a browser (requires internet for ESM CDN imports).

**Manual verification checklist** (no automated test runner):
1. Upload a recognizable image → original renders in the right panel
2. Click a sample image button → image loads and reconstruction runs
3. Click "Load EHT Presets" → 6 telescope markers appear; UV arcs fill the UV-plane canvas
4. Drag a marker → reconstruction updates automatically
5. Adjust declination / HA range sliders → UV arcs change; reconstruction updates
6. Clear telescopes → reconstructed canvas goes dark; status message warns about ≥2 telescopes
7. Place 1 telescope only → same warning; no reconstruction attempted
