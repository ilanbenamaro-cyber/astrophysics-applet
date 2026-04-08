## IMPLEMENTATION PLAN

### Order of Operations
1. Fix tooltip string in constants.js (trivial, isolated)
2. Add CSS font-size custom properties and replace key px values in app.css
3. Add high-contrast, reduced-motion, and a11y panel CSS rules in app.css
4. Create A11yPanel.js component
5. Modify App.js: a11y state + effects + render A11yPanel + pass reducedMotion to Globe
6. Modify Globe.js: accept reducedMotion prop, second useEffect for autoRotate

### File Changes

**MODIFY: vlbi-react/js/constants.js**
- Line 25: INFO.restored.body — replace "Wiener filter" with "Max Entropy"

**MODIFY: vlbi-react/css/app.css — Part A: font-size CSS variables**
Add to :root:
  --fs-2xs: 9px; --fs-xs: 10px; --fs-sm: 11px; --fs-base: 12px;
  --fs-md: 13px; --fs-lg: 14px; --fs-xl: 16px;
Override for medium (+2px):
  [data-font-size="medium"] { --fs-2xs:11px; --fs-xs:12px; --fs-sm:13px; --fs-base:14px; --fs-md:15px; --fs-lg:16px; --fs-xl:18px; }
Override for large (+4px):
  [data-font-size="large"] { --fs-2xs:13px; --fs-xs:14px; --fs-sm:15px; --fs-base:16px; --fs-md:17px; --fs-lg:18px; --fs-xl:20px; }
Replace key font-size px values with var() throughout CSS (~15 declarations targeting
sidebar h2, header, stats, labels, modal, buttons, gallery text).

**MODIFY: vlbi-react/css/app.css — Part B: high-contrast**
[data-high-contrast] overrides: --border:#555; --text-secondary:#cccccc; --accent-teal:#ffd700;
--accent-amber:#ffa500; --accent-blue:#ffd700. All exceed 4.5:1 ratio on #000000.

**MODIFY: vlbi-react/css/app.css — Part C: reduced motion**
[data-reduced-motion] rule: animation-duration:0.01ms, transition-duration:0.01ms on all children.

**MODIFY: vlbi-react/css/app.css — Part D: A11y panel styles**
.a11y-wrap (relative container in header), .a11y-btn, .a11y-panel (absolute dropdown,
top: 100%, right: 0, z-index:200), .a11y-section, .a11y-row, .a11y-size-btns,
.a11y-size-btn (.selected state), toggle row styles.

**CREATE: vlbi-react/js/A11yPanel.js**
Props: { settings, onToggleHighContrast, onSetFontSize, onToggleReducedMotion, isOpen, onToggle }
- Toggle button "A11y" with aria-expanded, aria-controls
- Panel: role="region", aria-label="Accessibility settings"
  - Three rows: High Contrast (checkbox), Font Size (S/M/L buttons), Reduced Motion (checkbox)
  - "Settings auto-saved" note
- useEffect on mount/unmount: close on Escape key + click-outside (pointerdown on document)

**MODIFY: vlbi-react/js/App.js**
- Import A11yPanel
- Add a11y state initialized from localStorage + prefers-reduced-motion:
  useState(() => { ... JSON.parse(localStorage.getItem('vlbi-a11y')) ... })
- Add a11yOpen state (boolean)
- useEffect([a11y]): apply data attributes to document.documentElement + localStorage.setItem
- Pass reducedMotion={a11y.reducedMotion} to <Globe>
- Render <A11yPanel> inside .header div, after .header-stats

**MODIFY: vlbi-react/js/Globe.js**
- Destructure reducedMotion from props
- Add useEffect([reducedMotion]): if (controlsRef.current) controlsRef.current.autoRotate = !reducedMotion

### Test Plan
- Tooltip: page.evaluate(() => !document.body.innerHTML.includes('Wiener filter')) → true
- Panel: click A11y btn → panel visible, aria-expanded=true
- High contrast: toggle HC → documentElement.hasAttribute('data-high-contrast') === true
- Font size: set Large → documentElement.dataset.fontSize === 'large'
- Reduced motion: toggle → documentElement.hasAttribute('data-reduced-motion') === true
- Persistence: set HC on, reload → still has data-high-contrast attribute
- No JS errors throughout

### Falsification Results
ADDRESSED:
- Globe controlsRef null before init effect: null-check in second useEffect
- localStorage parse failure: || 'null' fallback + || {} default
- Panel click-outside: pointerdown listener on document, close if not inside .a11y-panel
- font-size="small" attribute not needed: CSS vars at :root stay default when no attribute

ACCEPTED RISKS:
- Font size vars cover ~15 declarations; any missed declarations stay at original px (visual
  inconsistency at edges, not a functional failure)
- Globe texture/Three.js colors unchanged in high contrast (acceptable — canvas visualization)

ASSUMPTIONS MADE:
- Globe autoRotate=true is the correct default on initialization
- a11y state is initialized once from localStorage/OS on mount; not live-synced across tabs
