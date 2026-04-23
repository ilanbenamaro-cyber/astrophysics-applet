// Sidebar panel — image gallery, telescope list, and observation controls.
import { html } from './core.js';
import { InfoTooltip } from './InfoTooltip.js';
import { ImageGallery } from './ImageGallery.js';
import { TelescopeList } from './TelescopeList.js';
import { ControlsPanel } from './ControlsPanel.js';

export function AppSidebar({
  selectedPreset, onPresetSelect, onFileUpload,
  telescopes, onTelescopeRemove, onToggleVisibility,
  onLoadEHT, selectedArrayPreset, onArrayPresetChange, onLoadArray,
  bhexAdded, onAddBHEX,
  onClearAll, showCountryLabels, onToggleCountryLabels,
  controls, onControlChange, onOpenInfo, onReset,
  selectedTarget, onTargetChange, effectiveSourceFraction,
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
        <div className="preset-selector-row">
          <select
            className="preset-select"
            value=${selectedArrayPreset}
            onChange=${e => onArrayPresetChange(e.target.value)}
          >
            <option value="EHT 2017">EHT 2017 (8 stations)</option>
            <option value="EHT 2022">EHT 2022 (11 stations)</option>
            <option value="ngEHT Phase 1">ngEHT Phase 1 (17 stations)</option>
          </select>
          <button className="btn btn-primary" onClick=${onLoadArray}>Load Array</button>
        </div>
        ${selectedArrayPreset === 'ngEHT Phase 1' ? html`<span className="preset-note">† Reference array — coordinates approximate</span>` : null}
        <button
          className=${'btn bhex-button' + (bhexAdded ? ' bhex-added' : '')}
          onClick=${onAddBHEX}
          disabled=${bhexAdded}
        >
          ${bhexAdded ? 'BHEX Added ✓' : '＋ BHEX Satellite'}
        </button>
        <div className="telescope-actions">
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
          selectedTarget=${selectedTarget}
          onTargetChange=${onTargetChange}
          effectiveSourceFraction=${effectiveSourceFraction}
        />
      </section>

      <button className="btn btn-reset" onClick=${onReset}>↺ Reset All</button>
    </aside>
  `;
}
