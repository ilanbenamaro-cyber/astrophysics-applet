import { html, useEffect } from './core.js';
import { INFO } from './constants.js';

export function InfoModal({ infoKey, onClose }) {
  useEffect(() => {
    if (!infoKey) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [infoKey, onClose]);

  if (!infoKey) return null;
  const info = INFO[infoKey];
  if (!info) return null;

  return html`
    <div className="modal-overlay" onClick=${onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-card" onClick=${(e) => e.stopPropagation()}>
        <button className="modal-close" onClick=${onClose} aria-label="Close">×</button>
        <h3 className="modal-title" id="modal-title">${info.title}</h3>
        <p className="modal-body">${info.body}</p>
      </div>
    </div>
  `;
}
