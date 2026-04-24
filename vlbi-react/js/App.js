// App root — global UI state only. All simulation logic lives in useSimulation.
import { html, useState, useEffect, useCallback } from './core.js';
import { IMAGE_SIZE } from './constants.js';
import { useSimulation } from './useSimulation.js';
import { Globe } from './Globe.js';
import { InfoTooltip } from './InfoTooltip.js';
import { InfoModal } from './InfoModal.js';
import { PhysicsNotesModal } from './PhysicsNotesModal.js';
import { CitationModal } from './CitationModal.js';
import { UVMap } from './UVMap.js';
import { ImageCanvas, OriginalImagePanel } from './ImageCanvas.js';
import { ContourMap } from './ContourMap.js';
import { StatusBar } from './StatusBar.js';
import { MetricsPanel } from './MetricsPanel.js';
import { AppSidebar } from './AppSidebar.js';
import { A11yPanel } from './A11yPanel.js';
import { Tour } from './Tour.js';

export function App() {
  const sim = useSimulation();

  // ── Global UI state (not simulation-specific) ───────────────────────────────
  const [infoKey, setInfoKey]               = useState(null);
  const [physicsNotesOpen, setPhysicsNotesOpen] = useState(false);
  const [citationOpen, setCitationOpen]     = useState(false);
  const [a11y, setA11y] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('vlbi-a11y') || 'null') || {};
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return {
      highContrast:  saved.highContrast  ?? false,
      fontSize:      saved.fontSize      ?? 'small',
      reducedMotion: saved.reducedMotion ?? prefersReducedMotion,
    };
  });
  const [a11yOpen, setA11yOpen]     = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [tourActIndex, setTourActIndex] = useState(0);

  // Apply a11y data attributes to <html> and persist to localStorage
  useEffect(() => {
    const root = document.documentElement;
    a11y.highContrast  ? root.setAttribute('data-high-contrast', '') : root.removeAttribute('data-high-contrast');
    a11y.reducedMotion ? root.setAttribute('data-reduced-motion', '') : root.removeAttribute('data-reduced-motion');
    root.dataset.fontSize = a11y.fontSize;
    localStorage.setItem('vlbi-a11y', JSON.stringify(a11y));
  }, [a11y]);

  const handleTourAction = useCallback((action) => {
    switch (action.type) {
      case 'resetForTour':
        sim.handleClearTelescopes();
        break;
      case 'addTelescope':
        sim.handleTelescopeAdd(action.lat, action.lon);
        break;
      case 'loadEHT':
        sim.handleLoadDefaultEHT();
        break;
      case 'setMethod':
        sim.setControls(p => ({ ...p, method: action.method }));
        break;
      case 'setPreset':
        sim.handlePresetSelect(action.preset);
        break;
      default:
        break;
    }
  }, [sim.handleClearTelescopes, sim.handleTelescopeAdd, sim.handleLoadDefaultEHT,
      sim.setControls, sim.handlePresetSelect]);

  const restoredLabel = sim.controls.method === 'clean' ? 'CLEAN'
    : sim.controls.method === 'mem' ? 'Max Entropy'
    : 'Restored';

  return html`
    <div className="app">
      <header className="header" style=${{ position: 'relative' }}>
        <div className="header-inner">
          <h1>VLBI Interferometry Simulator by Ilan Benjamin Amaro (Wake Forest University)</h1>
          <p>Built with AI assistance and guidance by Prof. Alejandro Cárdenas-Avendaño</p>
          <p>Click the globe to place radio telescopes · Earth rotation synthesizes a virtual aperture the size of Earth</p>
        </div>
        <button
          className="tour-launch-btn"
          style=${{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}
          onClick=${() => { setTourActive(true); setTourActIndex(0); }}
          aria-label="Start guided physics tour"
        >◉ Tour</button>
        <div className="header-stats">
          <button
            className="btn btn-ghost"
            onClick=${() => setPhysicsNotesOpen(true)}
            aria-label="View implementation notes and references"
          >📋 Physics Notes</button>
          <button
            className="btn btn-ghost"
            onClick=${() => setCitationOpen(true)}
            aria-label="Generate citation for this simulation"
          >📄 Cite</button>
          ${sim.telescopes.length >= 2 ? html`
            <span className="stat"><span className="stat-val">${sim.telescopes.length}</span>telescopes</span>
            <span className="stat"><span className="stat-val">${sim.telescopes.length*(sim.telescopes.length-1)/2}</span>baselines</span>
            <span className="stat"><span className="stat-val">${sim.uvFill.toFixed(1)}%</span>UV fill</span>
            ${sim.angularRes ? html`<span className="stat"><span className="stat-val">${sim.angularRes}</span>resolution</span>` : null}
          ` : null}
          <${A11yPanel}
            settings=${a11y}
            isOpen=${a11yOpen}
            onToggle=${() => setA11yOpen(v => !v)}
            onToggleHighContrast=${() => setA11y(s => ({ ...s, highContrast: !s.highContrast }))}
            onSetFontSize=${(size) => setA11y(s => ({ ...s, fontSize: size }))}
            onToggleReducedMotion=${() => setA11y(s => ({ ...s, reducedMotion: !s.reducedMotion }))}
          />
        </div>
      </header>

      <div className="layout">
        <${AppSidebar}
          selectedPreset=${sim.selectedPreset}
          onPresetSelect=${sim.handlePresetSelect}
          onFileUpload=${sim.handleFileUpload}
          telescopes=${sim.telescopes}
          onTelescopeRemove=${sim.handleTelescopeRemove}
          onToggleVisibility=${sim.handleToggleVisibility}
          onLoadEHT=${sim.loadEHTPresets}
          selectedArrayPreset=${sim.selectedArrayPreset}
          onArrayPresetChange=${sim.setSelectedArrayPreset}
          onLoadArray=${sim.handleLoadArrayPreset}
          bhexAdded=${sim.bhexAdded}
          onAddBHEX=${sim.handleAddBHEX}
          onClearAll=${sim.handleClearTelescopes}
          showCountryLabels=${sim.showCountryLabels}
          onToggleCountryLabels=${() => sim.setShowCountryLabels(v => !v)}
          controls=${sim.controls}
          onControlChange=${(k, v) => sim.setControls(p => ({ ...p, [k]: v }))}
          onOpenInfo=${setInfoKey}
          onReset=${sim.handleReset}
          selectedTarget=${sim.selectedTarget}
          onTargetChange=${sim.handleTargetChange}
          effectiveSourceFraction=${sim.effectiveSourceFraction}
        />

        <main id="tour-globe" className="globe-wrapper" aria-label="Main visualization — 3D interactive globe">
          <${Globe} telescopes=${sim.telescopes} onTelescopeAdd=${sim.handleTelescopeAdd} showCountryLabels=${sim.showCountryLabels} reducedMotion=${a11y.reducedMotion} tourActive=${tourActive} />
          <${StatusBar} status=${sim.status} isComputing=${sim.isComputing} baselineStats=${sim.baselineStats} />
          <${MetricsPanel}
            beamFwhm=${sim.beamFwhm}
            dynamicRange=${sim.dynamicRange}
            uvFill=${sim.uvFill}
            uvCount=${sim.uvCount}
            baselineStats=${sim.baselineStats}
            angularRes=${sim.angularRes}
          />
        </main>

        <aside className="right-panel" aria-label="Analysis outputs">
          <section id="tour-uv" className="panel-section">
            <h2>UV Coverage <${InfoTooltip} infoKey="uvmap" onOpen=${setInfoKey} /></h2>
            <${UVMap} uvPoints=${sim.uvPointsGl} N=${IMAGE_SIZE} pairSefdMap=${sim.pairSefdMap} />
            <p className="caption">Fill: ${sim.uvFill.toFixed(2)}% of spatial frequencies sampled · ${sim.uvPoints.length} samples</p>
          </section>

          <section id="tour-images" className="panel-section">
            <h2>Image Reconstruction</h2>
            <div className="images-row">
              <${OriginalImagePanel}
                canvas=${sim.originalCanvas}
                label="Ground Truth"
                infoKey="ground"
                onOpenInfo=${setInfoKey}
              />
              <${ImageCanvas}
                data=${sim.dirty}
                N=${IMAGE_SIZE}
                label="Dirty Image"
                infoKey="dirty"
                onOpenInfo=${setInfoKey}
              />
              <${ImageCanvas}
                data=${sim.restored}
                N=${IMAGE_SIZE}
                label=${restoredLabel}
                infoKey="restored"
                onOpenInfo=${setInfoKey}
              />
            </div>
            <${ContourMap}
              dirtyData=${sim.dirty}
              restoredData=${sim.restored}
              N=${IMAGE_SIZE}
              angularResolution=${sim.angularRes}
              fovMuas=${sim.controls.fovMuas}
              controls=${sim.controls}
              onOpenInfo=${setInfoKey}
              beamSigmaU=${sim.beamDims.sigmaU}
              beamSigmaV=${sim.beamDims.sigmaV}
              beamPA=${sim.beamDims.pa}
              dynamicRange=${sim.dynamicRange}
              onExportFITS=${sim.handleExportFITS}
            />
          </section>
        </aside>
      </div>

      <${InfoModal} infoKey=${infoKey} onClose=${() => setInfoKey(null)} />
      <${PhysicsNotesModal} open=${physicsNotesOpen} onClose=${() => setPhysicsNotesOpen(false)} fovMuas=${sim.controls.fovMuas} />
      <${CitationModal} open=${citationOpen} onClose=${() => setCitationOpen(false)} telescopes=${sim.telescopes} controls=${sim.controls} selectedArrayPreset=${sim.selectedArrayPreset} bhexAdded=${sim.bhexAdded} />
      ${tourActive && html`
        <${Tour}
          actIndex=${tourActIndex}
          onActChange=${setTourActIndex}
          onClose=${() => { setTourActive(false); setTourActIndex(0); }}
          onTourAction=${handleTourAction}
          reducedMotion=${a11y.reducedMotion}
        />
      `}
    </div>
  `;
}
