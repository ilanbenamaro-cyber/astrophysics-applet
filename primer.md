# Session Primer

## PROJECT: VLBI Astrophysics Applet — pure-JS interferometry simulator + React 3D companion

## LAST_COMPLETED
Tour visual redesign (6 problems fixed) — committed a174c46 to main.
- Tour button: gold gradient, centered absolute in header (not buried in stats)
- Country labels: CSS2DRenderer div hidden via tourActive prop on Globe
- Tour card: full-width bottom sheet, 2-column grid (text left, diagram right)
- Diagrams: 400x340 canvas, scaled coordinates, timestamp-based RAF animations
- Spotlight: .tour-spotlight-active class with gold glow box-shadow
- Overlay: backdrop-filter removed (was causing label bleed-through)

## EXACT_NEXT_STEP
Deploy: git push origin main to publish to GitHub Pages

## OPEN_BLOCKERS
None

## KEY_DECISIONS_THIS_SESSION
- tourActive prop is passed App to Globe to hide CSS2DRenderer.domElement directly
  (not through Three.js scene graph -- more reliable, no flicker)
- Spotlight uses CSS class instead of inline style mutation -- cleaner, reversible
- TourCard grid is on .tour-card itself (2 direct children: left col and right col)
- TourDiagram canvas internal size 400x340; CSS width:100%/height:360px scales it
- Animated diagrams use RAF timestamp parameter instead of mutable closure variables
