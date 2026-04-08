# Task 03 — Implement Output
# Feature: black panels, WFU Seal text-only button

## Changes Made

### vlbi-react/css/app.css
- `--bg-1: #0a0a1e` → `#0a0a0a`
- `--bg-2: #0f0f2e` → `#111111`
- `--bg-3: #161634` → `#1a1a1a`
- Added `.gallery-btn .glabel-bold { font-size: 11px; font-weight: 600; color: var(--text-primary); text-align: center; }`

### vlbi-react/js/ImageGallery.js
- wfu-seal preset: `icon: '⚡'` → `icon: null`
- Render: `${p.icon ? html\`<span class="icon">\` : null}` — skip icon span when null
- Label span: class is `glabel-bold` when no icon, `glabel` otherwise

## Invariants Maintained
- Scientific logic untouched
- Layout and spacing unchanged
- Data viz colors (UV coverage arcs, reconstruction) unchanged
- --border, --accent-*, --text-secondary unchanged
