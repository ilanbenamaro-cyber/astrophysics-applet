// Accessibility settings panel — high contrast, font size, reduced motion.
// State lives in App.js; this component is purely presentational.
import { html, useEffect, useRef } from './core.js';

export function A11yPanel({ settings, onToggleHighContrast, onSetFontSize, onToggleReducedMotion, isOpen, onToggle }) {
  const wrapRef = useRef(null);

  // Close on Escape key or click outside the panel wrapper
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onToggle(); };
    const handlePointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) onToggle();
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen, onToggle]);

  const sizes = [
    { key: 'small',  label: 'S' },
    { key: 'medium', label: 'M' },
    { key: 'large',  label: 'L' },
  ];

  return html`
    <div className="a11y-wrap" ref=${wrapRef}>
      <button
        className="a11y-btn"
        onClick=${onToggle}
        aria-expanded=${isOpen}
        aria-controls="a11y-panel"
        aria-label="Accessibility settings"
        title="Accessibility settings"
      >♿ A11y</button>

      ${isOpen && html`
        <div
          id="a11y-panel"
          className="a11y-panel"
          role="region"
          aria-label="Accessibility settings"
        >
          <p className="a11y-panel-title">Accessibility</p>

          <div className="a11y-row">
            <span className="a11y-label">High Contrast</span>
            <label className="a11y-toggle" aria-label="Toggle high contrast mode">
              <input
                type="checkbox"
                checked=${settings.highContrast}
                onChange=${onToggleHighContrast}
              />
              <span className="a11y-toggle-track"></span>
            </label>
          </div>

          <div className="a11y-row">
            <span className="a11y-label">Font Size</span>
            <div className="a11y-size-btns" role="group" aria-label="Font size">
              ${sizes.map(s => html`
                <button
                  key=${s.key}
                  className=${'a11y-size-btn' + (settings.fontSize === s.key ? ' selected' : '')}
                  onClick=${() => onSetFontSize(s.key)}
                  aria-pressed=${settings.fontSize === s.key}
                  aria-label=${'Font size ' + s.key}
                >${s.label}</button>
              `)}
            </div>
          </div>

          <div className="a11y-row">
            <span className="a11y-label">Reduced Motion</span>
            <label className="a11y-toggle" aria-label="Toggle reduced motion">
              <input
                type="checkbox"
                checked=${settings.reducedMotion}
                onChange=${onToggleReducedMotion}
              />
              <span className="a11y-toggle-track"></span>
            </label>
          </div>

          <p className="a11y-note">Settings saved automatically</p>
        </div>
      `}
    </div>
  `;
}
