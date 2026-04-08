## What To Build

Two improvements to vlbi-react:

### 1. Fix info tooltip text
In the restored image info tooltip, replace "Wiener filter" with "Max Entropy".
The text currently reads: "After applying a deconvolution algorithm (Wiener filter or CLEAN)..."
It should read: "After applying a deconvolution algorithm (Max Entropy or CLEAN)..."
Find the info tooltip definitions file and update only this string.

### 2. WCAG 2.1 AA Accessibility Settings Panel
Add an accessibility settings panel to the vlbi-react app with the following controls:

- High contrast mode toggle — increases contrast of UI elements, changes accent colors to meet WCAG AA contrast ratio (4.5:1 minimum)
- Font size control — three options: Small (default), Medium (+2px), Large (+4px)
- Reduced motion toggle — disables globe auto-rotation and any CSS animations/transitions
- All existing interactive elements must have proper labels if missing

Implementation:
- Add an accessibility button (♿ or "A11y") in the header/controls area
- Clicking it opens a small settings panel
- Settings persist in localStorage so they survive page refresh
- Use CSS custom properties (already in use) to implement high contrast and font size changes
- Reduced motion: check prefers-reduced-motion media query on load as default, allow manual override

## Acceptance Criteria
- [ ] Tooltip text updated — "Max Entropy" not "Wiener filter"
- [ ] Accessibility panel opens and closes
- [ ] High contrast mode visually changes the UI
- [ ] Font size control works across all text elements
- [ ] Reduced motion toggle stops globe animation
- [ ] All interactive elements have aria-labels
- [ ] Settings persist across page refresh
- [ ] Passes basic WCAG 2.1 AA checks (contrast ratios, keyboard navigation, labels)
- [ ] Playwright confirms panel opens and controls work

## Context / Constraints
- vlbi-react at http://localhost:8765/vlbi-react/index.html
- Use existing CSS custom property system — do not hardcode colors
- Do not change any scientific functionality
- Do not change layout significantly — panel should be compact

## Out Of Scope
- Screen reader full audit
- WCAG AAA compliance
- Changes to reconstruction logic
