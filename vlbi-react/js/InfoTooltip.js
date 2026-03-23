import { html } from './core.js';

export function InfoTooltip({ infoKey, onOpen }) {
  return html`<button
    className="info-btn"
    onClick=${() => onOpen(infoKey)}
    aria-label=${'Learn about ' + infoKey}
    title="Click for explanation"
  >ⓘ</button>`;
}
