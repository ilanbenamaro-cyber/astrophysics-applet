// Sidebar panel — image gallery, telescope list, and observation controls.
import { html } from './core.js';
import { InfoTooltip } from './InfoTooltip.js';
import { ImageGallery } from './ImageGallery.js';
import { TelescopeList } from './TelescopeList.js';
import { ControlsPanel } from './ControlsPanel.js';

export function AppSidebar({
  selectedPreset, onPresetSelect, onFileUpload,
  telescopes, onTelescopeRemove, onToggleVisibility,
  onLoadEHT, onClearAll, showCountryLabels, onToggleCountryLabels,
  controls, onControlChange, onOpenInfo, onReset,
}) {
  return html`
    <aside className="sidebar" aria-label="Controls and image selection">
      <section className="sidebar-section">
        <h2>Source Image <${InfoTooltip} infoKey="ground" onOpen=${onOpenInfo} /></h2>
        <${ImageGallery} selected=${selectedPreset} onSelect=${onPresetSelect} onUpload=${onFileUpload} />
      </section>

      <section className="sidebar-section">
        <h2>Telescope Array <${InfoTooltip} infoKey="globe" onOpen=${onOpenInfo} /></h2>
        <${TelescopeList}
          telescopes=${telescopes}
          onRemove=${onTelescopeRemove}
          onToggleVisibility=${onToggleVisibility}
        />
        <div className="telescope-actions">
          <button className="btn btn-primary" onClick=${onLoadEHT}>Load EHT Array</button>
          <button className="btn btn-ghost" onClick=${onClearAll}>Clear All</button>
        </div>
        <div style=${{ marginTop: '6px' }}>
          <button
            className="btn btn-ghost"
            style=${{ width: '100%', justifyContent: 'center' }}
            onClick=${onToggleCountryLabels}
          >
            ${showCountryLabels ? 'Hide Country Names' : 'Show Country Names'}
          </button>
        </div>
      </section>

      <section id="tour-controls" className="sidebar-section">
        <h2>Observation Parameters</h2>
        <${ControlsPanel}
          controls=${controls}
          onChange=${onControlChange}
          onOpenInfo=${onOpenInfo}
        />
      </section>

      <button className="btn btn-reset" onClick=${onReset}>↺ Reset All</button>
    </aside>
  `;
}
