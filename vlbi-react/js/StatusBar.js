import { html } from './core.js';

export function StatusBar({ status, isComputing, baselineStats }) {
  return html`<div className=${'status-bar ' + status.type}>
    ${isComputing ? html`<span className="spinner"></span>` : null}
    <span>${status.msg}</span>
    ${baselineStats ? html`<span className="status-baseline"> · Max baseline: ${baselineStats.maxKm.toFixed(0)} km / ${baselineStats.maxGl.toFixed(1)} Gλ</span>` : null}
  </div>`;
}
