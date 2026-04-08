# Session Primer

## PROJECT: VLBI Astrophysics Applet — pure-JS interferometry simulator + React 3D companion

## LAST_COMPLETED
Tour overhaul (5 changes) — committed e60ebc0 to main.
- Rough.js removed from index.html; TourDiagram.js fully rewritten with pure Canvas 2D API
- New helpers: filledCircle, strokeCircle, drawRect, filledEllipse, parabolicDish (bezier)
- All 8 acts redrawn in crisp vector style — no sketch texture
- Math always visible (removed toggle button + mathOpen state from TourCard.js)
- All 8 act texts expanded to 4-6 sentences with physics depth
- Spotlight upgraded: 4-layer gold glow + tourSpotlightPulse 2s keyframe animation
- Terms grid: serif 15px symbols, 13px descriptions, roomier padding/gap

## EXACT_NEXT_STEP
Deploy: git push origin main to publish to GitHub Pages

## OPEN_BLOCKERS
None

## KEY_DECISIONS_THIS_SESSION
- Rough.js diameter convention (rc.circle takes diameter, ctx.arc takes radius) — all sizes halved
- parabolicDish uses bezierCurveTo with control points at (left, top + height*0.15) and (right, top + height*0.15)
- CLEAN animation stage timer: 1.5s per stage (was 1s — felt rushed)
- toggle styles (.tour-math-toggle, .tour-math-arrow) removed from CSS entirely
- [data-reduced-motion] override added for tourSpotlightPulse animation
