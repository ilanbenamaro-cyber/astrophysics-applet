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
import { SimPane } from './SimPane.js';

export function App() {
  const left  = useSimulation();
  const right = useSimulation();

  // ── Global UI state (not simulation-specific) ───────────────────────────────
  const [compareMode, setCompareMode]       = useState(false);
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

  const handleToggleCompare = useCallback(() => {
    setCompareMode(m => {
      if (!m) setTourActive(false);  // exit tour when entering compare
      return !m;
    });
  }, []);

  const handleTourAction = useCallback((action) => {
    if (compareMode) return;
    switch (action.type) {
      case 'resetForTour':
        left.handleClearTelescopes();
        break;
      case 'addTelescope':
        left.handleTelescopeAdd(action.lat, action.lon);
        break;
      case 'loadEHT':
        left.handleLoadDefaultEHT();
        break;
      case 'setMethod':
        left.setControls(p => ({ ...p, method: action.method }));
        break;
      case 'setPreset':
        left.handlePresetSelect(action.preset);
        break;
      default:
        break;
    }
  }, [compareMode, left.handleClearTelescopes, left.handleTelescopeAdd, left.handleLoadDefaultEHT,
      left.setControls, left.handlePresetSelect]);

  const restoredLabel = left.controls.method === 'clean' ? 'CLEAN'
    : left.controls.method === 'mem' ? 'Max Entropy'
    : 'Restored';

  return html`
    <div className="app">
      <header className="header" style=${{ position: 'relative' }}>
        <div className="header-inner">
          <h1>VLBI Interferometry Simulator by Ilan Benjamin Amaro (Wake Forest University)</h1>
          <p>Built with AI assistance and guidance by Prof. Alejandro Cárdenas-Avendaño</p>
          <p>Click the globe to place radio telescopes · Earth rotation synthesizes a virtual aperture the size of Earth</p>
        </div>
        ${!compareMode && html`
          <button
            className="tour-launch-btn"
            style=${{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}
            onClick=${() => { setTourActive(true); setTourActIndex(0); }}
            aria-label="Start guided physics tour"
          >◉ Tour</button>
        `}
        <div className="header-stats">
          ${!compareMode && html`
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
          `}
          ${compareMode && html`
            <button
              className="btn btn-ghost"
              onClick=${handleToggleCompare}
              style=${{ fontWeight: 600 }}
            >✕ Exit Compare</button>
            <span style=${{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Compare mode — two independent simulations running simultaneously
            </span>
          `}
          ${!compareMode && left.telescopes.length >= 2 ? html`
            <span className="stat"><span className="stat-val">${left.telescopes.length}</span>telescopes</span>
            <span className="stat"><span className="stat-val">${left.telescopes.length*(left.telescopes.length-1)/2}</span>baselines</span>
            <span className="stat"><span className="stat-val">${left.uvFill.toFixed(1)}%</span>UV fill</span>
            ${left.angularRes ? html`<span className="stat"><span className="stat-val">${left.angularRes}</span>resolution</span>` : null}
          ` : null}
          ${!compareMode && html`
            <${A11yPanel}
              settings=${a11y}
              isOpen=${a11yOpen}
              onToggle=${() => setA11yOpen(v => !v)}
              onToggleHighContrast=${() => setA11y(s => ({ ...s, highContrast: !s.highContrast }))}
              onSetFontSize=${(size) => setA11y(s => ({ ...s, fontSize: size }))}
              onToggleReducedMotion=${() => setA11y(s => ({ ...s, reducedMotion: !s.reducedMotion }))}
            />
          `}
        </div>
      </header>

      ${compareMode ? html`
        <div className="compare-layout">
          <${SimPane} key="left"  sim=${left}  onOpenInfo=${setInfoKey} label="Config A" reducedMotion=${a11y.reducedMotion} />
          <div className="compare-divider"></div>
          <${SimPane} key="right" sim=${right} onOpenInfo=${setInfoKey} label="Config B" reducedMotion=${a11y.reducedMotion} />
        </div>
      ` : html`
        <div className="layout">
          <${AppSidebar}
            selectedPreset=${left.selectedPreset}
            onPresetSelect=${left.handlePresetSelect}
            onFileUpload=${left.handleFileUpload}
            telescopes=${left.telescopes}
            onTelescopeRemove=${left.handleTelescopeRemove}
            onToggleVisibility=${left.handleToggleVisibility}
            onLoadEHT=${left.loadEHTPresets}
            selectedArrayPreset=${left.selectedArrayPreset}
            onArrayPresetChange=${left.setSelectedArrayPreset}
            onLoadArray=${left.handleLoadArrayPreset}
            bhexAdded=${left.bhexAdded}
            onAddBHEX=${left.handleAddBHEX}
            onClearAll=${left.handleClearTelescopes}
            showCountryLabels=${left.showCountryLabels}
            onToggleCountryLabels=${() => left.setShowCountryLabels(v => !v)}
            controls=${left.controls}
            onControlChange=${(k, v) => left.setControls(p => ({ ...p, [k]: v }))}
            onOpenInfo=${setInfoKey}
            onReset=${left.handleReset}
            selectedTarget=${left.selectedTarget}
            onTargetChange=${left.handleTargetChange}
            effectiveSourceFraction=${left.effectiveSourceFraction}
            compareMode=${compareMode}
            onToggleCompare=${handleToggleCompare}
          />

          <main id="tour-globe" className="globe-wrapper" aria-label="Main visualization — 3D interactive globe">
            <${Globe} telescopes=${left.telescopes} onTelescopeAdd=${left.handleTelescopeAdd} showCountryLabels=${left.showCountryLabels} reducedMotion=${a11y.reducedMotion} tourActive=${tourActive} />
            <${StatusBar} status=${left.status} isComputing=${left.isComputing} baselineStats=${left.baselineStats} />
            <${MetricsPanel}
              beamFwhm=${left.beamFwhm}
              dynamicRange=${left.dynamicRange}
              uvFill=${left.uvFill}
              uvCount=${left.uvCount}
              baselineStats=${left.baselineStats}
              angularRes=${left.angularRes}
            />
          </main>

          <aside className="right-panel" aria-label="Analysis outputs">
            <section id="tour-uv" className="panel-section">
              <h2>UV Coverage <${InfoTooltip} infoKey="uvmap" onOpen=${setInfoKey} /></h2>
              <${UVMap} uvPoints=${left.uvPointsGl} N=${IMAGE_SIZE} pairSefdMap=${left.pairSefdMap} />
              <p className="caption">Fill: ${left.uvFill.toFixed(2)}% of spatial frequencies sampled · ${left.uvPoints.length} samples</p>
            </section>

            <section id="tour-images" className="panel-section">
              <h2>Image Reconstruction</h2>
              <div className="images-row">
                <${OriginalImagePanel}
                  canvas=${left.originalCanvas}
                  label="Ground Truth"
                  infoKey="ground"
                  onOpenInfo=${setInfoKey}
                />
                <${ImageCanvas}
                  data=${left.dirty}
                  N=${IMAGE_SIZE}
                  label="Dirty Image"
                  infoKey="dirty"
                  onOpenInfo=${setInfoKey}
                />
                <${ImageCanvas}
                  data=${left.restored}
                  N=${IMAGE_SIZE}
                  label=${restoredLabel}
                  infoKey="restored"
                  onOpenInfo=${setInfoKey}
                />
              </div>
              <${ContourMap}
                dirtyData=${left.dirty}
                restoredData=${left.restored}
                N=${IMAGE_SIZE}
                angularResolution=${left.angularRes}
                fovMuas=${left.controls.fovMuas}
                controls=${left.controls}
                onOpenInfo=${setInfoKey}
                beamSigmaU=${left.beamDims.sigmaU}
                beamSigmaV=${left.beamDims.sigmaV}
                beamPA=${left.beamDims.pa}
                dynamicRange=${left.dynamicRange}
                onExportFITS=${left.handleExportFITS}
              />
            </section>
          </aside>
        </div>
      `}

      <${InfoModal} infoKey=${infoKey} onClose=${() => setInfoKey(null)} />
      ${!compareMode && html`
        <${PhysicsNotesModal} open=${physicsNotesOpen} onClose=${() => setPhysicsNotesOpen(false)} fovMuas=${left.controls.fovMuas} />
        <${CitationModal} open=${citationOpen} onClose=${() => setCitationOpen(false)} telescopes=${left.telescopes} controls=${left.controls} selectedArrayPreset=${left.selectedArrayPreset} bhexAdded=${left.bhexAdded} />
      `}
      ${tourActive && !compareMode && html`
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
