// SimPane — compact single-simulation pane for compare mode.
import { html, useState } from './core.js';
import { IMAGE_SIZE, SKY_TARGETS } from './constants.js';
import { Globe } from './Globe.js';
import { UVMap } from './UVMap.js';
import { ImageCanvas, OriginalImagePanel } from './ImageCanvas.js';
import { ContourMap } from './ContourMap.js';
import { StatusBar } from './StatusBar.js';
import { MetricsPanel } from './MetricsPanel.js';
import { ControlsPanel } from './ControlsPanel.js';
import { TelescopeList } from './TelescopeList.js';
import { InfoTooltip } from './InfoTooltip.js';

export function SimPane({ sim, onOpenInfo, label, reducedMotion = false }) {
  const [showTels, setShowTels] = useState(false);

  return html`
    <div className="sim-pane">
      <div className="sim-pane-header">
        <span className="sim-pane-label">${label}</span>
        <select
          className="preset-select"
          value=${sim.selectedArrayPreset}
          onChange=${e => {
            const v = e.target.value;
            sim.setSelectedArrayPreset(v);
            sim.handleLoadArrayPreset(v);
          }}
          style=${{ flex: '1', minWidth: '0' }}
        >
          <option value="EHT 2017">EHT 2017 (8)</option>
          <option value="EHT 2022">EHT 2022 (11)</option>
          <option value="ngEHT Phase 1">ngEHT Ph1 (17)</option>
        </select>
        <select
          className="preset-select"
          value=${sim.selectedTarget}
          onChange=${e => sim.handleTargetChange(e.target.value)}
          style=${{ flex: '1', minWidth: '0' }}
        >
          ${Object.keys(SKY_TARGETS).map(k => html`<option key=${k} value=${k}>${k}</option>`)}
        </select>
      </div>

      <div className="sim-pane-globe">
        <${Globe}
          telescopes=${sim.telescopes}
          onTelescopeAdd=${sim.handleTelescopeAdd}
          showCountryLabels=${false}
          reducedMotion=${reducedMotion}
          tourActive=${false}
        />
        <${StatusBar} status=${sim.status} isComputing=${sim.isComputing} baselineStats=${sim.baselineStats} />
        <${MetricsPanel}
          beamFwhm=${sim.beamFwhm}
          dynamicRange=${sim.dynamicRange}
          uvFill=${sim.uvFill}
          uvCount=${sim.uvCount}
          baselineStats=${sim.baselineStats}
          angularRes=${sim.angularRes}
        />
      </div>

      <div className="sim-pane-controls">
        <${ControlsPanel}
          controls=${sim.controls}
          onChange=${(k, v) => sim.setControls(p => ({ ...p, [k]: v }))}
          onOpenInfo=${onOpenInfo}
          selectedTarget=${sim.selectedTarget}
          onTargetChange=${sim.handleTargetChange}
          effectiveSourceFraction=${sim.effectiveSourceFraction}
        />
      </div>

      <div className="sim-pane-telescope-section">
        <button
          className="btn btn-ghost btn-xs"
          style=${{ width: '100%', justifyContent: 'space-between', padding: '6px 12px' }}
          onClick=${() => setShowTels(s => !s)}
        >
          <span>Telescopes (${sim.telescopes.length})</span>
          <span>${showTels ? '▲' : '▼'}</span>
        </button>
        ${showTels ? html`
          <div style=${{ padding: '0 12px 8px' }}>
            <button
              className=${'btn btn-xs bhex-button' + (sim.bhexAdded ? ' bhex-added' : '')}
              onClick=${sim.handleAddBHEX}
              disabled=${sim.bhexAdded}
              style=${{ width: '100%', marginBottom: '6px' }}
            >${sim.bhexAdded ? 'BHEX Added ✓' : '＋ BHEX Satellite'}</button>
            <${TelescopeList}
              telescopes=${sim.telescopes}
              onRemove=${sim.handleTelescopeRemove}
              onToggleVisibility=${sim.handleToggleVisibility}
            />
          </div>
        ` : null}
      </div>

      <div className="sim-pane-outputs">
        <div className="panel-section">
          <h2>UV Coverage <${InfoTooltip} infoKey="uvmap" onOpen=${onOpenInfo} /></h2>
          <${UVMap} uvPoints=${sim.uvPointsGl} N=${IMAGE_SIZE} pairSefdMap=${sim.pairSefdMap} />
          <p className="caption">Fill: ${sim.uvFill.toFixed(2)}% · ${sim.uvPoints.length} samples</p>
        </div>

        <div className="panel-section">
          <h2>Image Reconstruction</h2>
          <div className="images-row">
            <${OriginalImagePanel}
              canvas=${sim.originalCanvas}
              label="Ground Truth"
              infoKey="ground"
              onOpenInfo=${onOpenInfo}
            />
            <${ImageCanvas}
              data=${sim.dirty}
              N=${IMAGE_SIZE}
              label="Dirty Image"
              infoKey="dirty"
              onOpenInfo=${onOpenInfo}
            />
            <${ImageCanvas}
              data=${sim.restored}
              N=${IMAGE_SIZE}
              label="CLEAN"
              infoKey="restored"
              onOpenInfo=${onOpenInfo}
            />
          </div>
          <${ContourMap}
            dirtyData=${sim.dirty}
            restoredData=${sim.restored}
            N=${IMAGE_SIZE}
            angularResolution=${sim.angularRes}
            fovMuas=${sim.controls.fovMuas}
            controls=${sim.controls}
            onOpenInfo=${onOpenInfo}
            beamSigmaU=${sim.beamDims.sigmaU}
            beamSigmaV=${sim.beamDims.sigmaV}
            beamPA=${sim.beamDims.pa}
            dynamicRange=${sim.dynamicRange}
          />
        </div>
      </div>
    </div>
  `;
}
