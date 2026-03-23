import { html } from './core.js';

export function TelescopeList({ telescopes, onRemove, onToggleVisibility }) {
  const visible = telescopes.filter(t => t.visible !== false).length;
  const baselines = telescopes.length * (telescopes.length - 1) / 2;

  if (telescopes.length === 0) {
    return html`<div>
      <p className="tel-empty">Click the globe to place radio telescopes</p>
    </div>`;
  }

  return html`<div>
    <div className="tel-list">
      ${telescopes.map(tel => html`
        <div className="tel-item" key=${tel.id}>
          <span className="tel-dot" style=${{ backgroundColor: tel.color }}></span>
          <span className="tel-name" style=${{ opacity: tel.visible === false ? 0.4 : 1 }}>${tel.name}</span>
          <span className="tel-coords">${tel.lat.toFixed(1)}°, ${tel.lon.toFixed(1)}°</span>
          <div className="tel-actions">
            <button
              className=${'tel-btn' + (tel.visible === false ? ' dim' : '')}
              onClick=${() => onToggleVisibility(tel.id)}
              title=${tel.visible === false ? 'Show telescope' : 'Hide telescope'}
              aria-label=${(tel.visible === false ? 'Show ' : 'Hide ') + tel.name}
            >${tel.visible === false ? '○' : '👁'}</button>
            <button
              className="tel-btn danger"
              onClick=${() => onRemove(tel.id)}
              title="Remove telescope"
              aria-label=${'Remove ' + tel.name}
            >×</button>
          </div>
        </div>
      `)}
    </div>
    <p className="caption">${visible} active · ${baselines} baseline${baselines !== 1 ? 's' : ''}</p>
  </div>`;
}
