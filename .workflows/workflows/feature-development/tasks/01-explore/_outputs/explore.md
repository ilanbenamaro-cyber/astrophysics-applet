## FEATURE REQUEST SUMMARY
Two changes to vlbi-react: (1) fix one tooltip string ("Wiener filter" → "Max Entropy") in
constants.js, and (2) add a WCAG 2.1 AA accessibility settings panel with high contrast mode,
font size control (S/M/L), and reduced motion toggle — persisted in localStorage, applied via
CSS custom properties and document attributes, with manual reduced-motion override of Globe.js
OrbitControls autoRotate.

## FILES TO MODIFY
- `vlbi-react/js/constants.js:25` — single string replacement in INFO.restored.body
- `vlbi-react/css/app.css` — add CSS custom property font-size variables, high-contrast
  overrides, reduced-motion suppression; replace key font-size px values with vars
- `vlbi-react/js/App.js` — add a11y state (useState), initialization useEffect (localStorage
  + prefers-reduced-motion), data-attribute application useEffect, pass reducedMotion to Globe,
  render A11yPanel in header
- `vlbi-react/js/Globe.js` — accept reducedMotion prop; second useEffect to update
  controlsRef.current.autoRotate when reducedMotion changes

## FILES TO CREATE
- `vlbi-react/js/A11yPanel.js` — new React component: toggle button + collapsible panel with
  three controls (high contrast, font size, reduced motion); reads/writes via props, no internal
  state (state lives in App.js)

## REUSABLE PATTERNS FOUND
- Component pattern: `import { html } from './core.js'` + export named function — used by all components
- Prop-driven state: all state in App.js, passed as props; handlers passed as callbacks (e.g.
  `onControlChange`, `onToggleCountryLabels`)
- Ref pattern for post-mount reactive props: `showCountryLabelsRef` in Globe.js — ref updated by
  effect when prop changes; animation loop reads ref. Same pattern for reducedMotion.
- CSS custom properties: `:root` in app.css already defines `--bg-*`, `--accent-*`, `--text-*` —
  high contrast mode overrides these on `html[data-high-contrast]`
- localStorage: no existing usage, but pattern is straightforward
- `useEffect` to apply side effects to document: see existing pattern for autoRotate timer

## ARCHITECTURAL CONSTRAINTS APPLYING
- ES import maps, no bundler — new files must be `.js`, added to index.html importmap if they
  import external libs (A11yPanel only imports from core.js, no new entries needed)
- No TypeScript — plain JS, no type annotations needed
- No build step — changes take effect immediately on file save
- Globe.js initialization useEffect runs once (`[]` dep array) — cannot change OrbitControls
  `autoRotate` from inside it. Must use second useEffect with `[reducedMotion]` dep that writes
  to `controlsRef.current`.
- CSS animations exist on `.modal-overlay` (@keyframes fadeIn) and `.spinner` — reduced motion
  must suppress these

## RISKS
- LOW: Globe.js second useEffect fires before controlsRef.current is populated (first render
  before init effect completes). Mitigated by null check: `if (controlsRef.current)`.
- LOW: `prefers-reduced-motion` media query read on mount may not match user's actual preference
  if they changed it after load. Acceptable — manual override is the fix.
- LOW: High-contrast color choices must actually achieve WCAG AA (4.5:1). Need to verify chosen
  values. Using #ffffff and #ffd700 on #000000 — both exceed 4.5:1.
- LOW: Font size variables require replacing specific px values in CSS with var(). Risk of
  missing some declarations. Mitigated by targeting only sidebar/panel/controls text (the UI
  elements users interact with).

## UNKNOWNS REQUIRING DECISION
None — all decisions resolved above.

## ESTIMATED SCOPE
Medium (5 files: 1 modified, 4 modified/created). The tooltip fix is trivial. The A11y panel
is ~80 lines of JS + ~60 lines of CSS. The Globe change is ~8 lines. The App.js integration is
~30 lines. The CSS font-size variable replacement is mechanical (~20 declarations).
