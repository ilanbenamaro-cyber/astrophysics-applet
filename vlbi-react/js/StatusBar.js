import { html } from './core.js';

export function StatusBar({ status, isComputing }) {
  return html`<div className=${'status-bar ' + status.type}>
    ${isComputing ? html`<span className="spinner"></span>` : null}
    <span>${status.msg}</span>
  </div>`;
}
