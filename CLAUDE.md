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

- `_knowledge/codebase.md` — stack, data flow, patterns, entry points (populated)
- `_knowledge/decisions.md` — architectural decisions with rationale and date
- `_knowledge/gotchas.md` — failure modes and prevention steps

## Build / Run / Test

**Run:** Open `index.html` in a browser. No server or build step required.

**Manual verification checklist** (no automated test runner):
1. Upload a recognizable image → original renders in the right panel
2. Click "Load EHT Presets" → 6 telescope markers appear; UV arcs fill the UV-plane canvas
3. Drag a marker → reconstruction updates automatically
4. Adjust declination / HA range sliders → UV arcs change; reconstruction updates
5. Clear telescopes → reconstructed canvas goes dark; status message warns about ≥2 telescopes
6. Place 1 telescope only → same warning; no reconstruction attempted

**Key constraints:**
- `IMAGE_SIZE = 256` in `js/imageProcessor.js` — must be a power of 2
- Script load order in `index.html` matters: `fft2d.js` → `interferometry.js` → `imageProcessor.js` → `mapController.js` → `app.js`
- `removeTelescope` in `mapController.js` must remain a `function` declaration (not `const`) — called from Leaflet popup `onclick`
