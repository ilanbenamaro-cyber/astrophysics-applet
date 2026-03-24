import { html, useRef } from './core.js';

export function ImageGallery({ selected, onSelect, onUpload }) {
  const fileRef = useRef(null);
  const presets = [
    { name: 'blackhole', label: 'Black Hole', icon: '⬤' },
    { name: 'wfu-seal',  label: 'WFU Seal',   icon: null },
  ];

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) onUpload(file);
    e.target.value = '';
  };

  return html`<div>
    <div className="gallery-grid">
      ${presets.map(p => html`
        <button
          key=${p.name}
          className=${'gallery-btn' + (selected === p.name ? ' selected' : '')}
          onClick=${() => onSelect(p.name)}
          aria-label=${'Load ' + p.label + ' preset'}
          aria-pressed=${selected === p.name}
        >
          ${p.icon ? html`<span className="icon">${p.icon}</span>` : null}
          <span className=${p.icon ? 'glabel' : 'glabel-bold'}>${p.label}</span>
        </button>
      `)}
    </div>
    <div
      className="upload-zone"
      onClick=${() => fileRef.current && fileRef.current.click()}
      role="button"
      tabIndex="0"
      aria-label="Upload your own image"
      onKeyDown=${(e) => e.key === 'Enter' && fileRef.current && fileRef.current.click()}
    >
      ↑ Upload your own image
    </div>
    <input
      ref=${fileRef}
      type="file"
      accept="image/*"
      style=${{ display: 'none' }}
      onChange=${handleFileChange}
    />
    <p style=${{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', margin: '4px 0 0' }}>
      Images are processed locally and never stored or transmitted
    </p>
  </div>`;
}
