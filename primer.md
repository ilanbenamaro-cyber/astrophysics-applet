# Session Primer

## PROJECT: VLBI Astrophysics Applet — pure-JS interferometry simulator + React 3D companion

## LAST_COMPLETED
Physics guided tour (8 acts, KaTeX, Rough.js, spotlight, auto-actions), WCAG 2.1 AA panel, ocean fix, CLEAN algorithm improvements — all merged to main (e62a524)

## EXACT_NEXT_STEP
None queued. Push to GitHub Pages to deploy: `git push origin main`

## OPEN_BLOCKERS
None

## KEY_DECISIONS_THIS_SESSION
- Tour.js imports `useLayoutEffect` directly from `'react'` — core.js does not re-export it; do not change core.js for this (would affect all components)
- Spotlight uses z-index elevation (target gets z-index:101, overlay at z-index:100) rather than CSS clip/hole — confirmed this works with backdrop-filter
- KaTeX and Rough.js loaded as classic `defer` scripts (not importmap) — they execute before ES modules per spec, so `window.katex`/`window.rough` are always available on first render
