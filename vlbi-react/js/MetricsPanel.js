import { html, useState } from './core.js';

export function MetricsPanel({ beamFwhm, dynamicRange, uvFill, uvCount, baselineStats, angularRes }) {
  const [open, setOpen] = useState(true);

  if (uvCount === 0) return null;

  return html`
    <div className="metrics-panel">
      <div className="metrics-header" onClick=${() => setOpen(o => !o)}>
        <span>Image Metrics</span>
        <span className="metrics-toggle">${open ? '▴' : '▾'}</span>
      </div>
      ${open ? html`
        <div className="metrics-grid">
          <span className="metrics-label">Beam FWHM</span>
          <span className="metrics-value">${beamFwhm.major.toFixed(1)} × ${beamFwhm.minor.toFixed(1)} μas</span>
          <span className="metrics-label">Dynamic Range</span>
          <span className="metrics-value">${dynamicRange > 0 ? dynamicRange.toFixed(0) + ':1' : '—'}</span>
          <span className="metrics-label">UV Fill</span>
          <span className="metrics-value">${uvFill.toFixed(2)}%</span>
          <span className="metrics-label">UV Samples</span>
          <span className="metrics-value">${uvCount.toLocaleString()}</span>
          ${baselineStats ? html`
            <span className="metrics-label">Max Baseline</span>
            <span className="metrics-value">${baselineStats.maxKm.toFixed(0)} km / ${baselineStats.maxGl.toFixed(1)} Gλ</span>
          ` : null}
          ${angularRes ? html`
            <span className="metrics-label">Resolution</span>
            <span className="metrics-value">${angularRes}</span>
          ` : null}
        </div>
      ` : null}
    </div>
  `;
}
