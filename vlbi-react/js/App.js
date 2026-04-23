// App root — manages all state, wires worker, renders layout.
import { html, useState, useEffect, useCallback, useRef, useMemo } from './core.js';
import { IMAGE_SIZE, TELESCOPE_COLORS, EHT_PRESETS, ARRAY_PRESETS, STATION_SEFD, BHEX_PRESET } from './constants.js';
import { computeUVPoints, computeUVPointsGl, computeUVFill, computeBaseline } from './uvCompute.js';
import { loadImagePresetAsync } from './presets.js';
import { Globe } from './Globe.js';
import { InfoTooltip } from './InfoTooltip.js';
import { InfoModal } from './InfoModal.js';
import { PhysicsNotesModal } from './PhysicsNotesModal.js';
import { CitationModal } from './CitationModal.js';
import { UVMap } from './UVMap.js';
import { ImageCanvas, OriginalImagePanel } from './ImageCanvas.js';
import { ContourMap } from './ContourMap.js';
import { StatusBar } from './StatusBar.js';
import { AppSidebar } from './AppSidebar.js';
import { A11yPanel } from './A11yPanel.js';
import { Tour } from './Tour.js';

export function App() {
  const [telescopes, setTelescopes] = useState([]);
  const [showCountryLabels, setShowCountryLabels] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState('blackhole');
  const [selectedArrayPreset, setSelectedArrayPreset] = useState('EHT 2017');
  const [grayscale, setGrayscale] = useState(null);
  const [originalCanvas, setOriginalCanvas] = useState(null);
  const [uvPoints, setUvPoints] = useState([]);
  const [stationPairs, setStationPairs] = useState([]);
  const [uvPointsGl, setUvPointsGl] = useState([]);
  const [uvFill, setUvFill] = useState(0);
  const [dirty, setDirty] = useState(null);
  const [restored, setRestored] = useState(null);
  const [controls, setControls] = useState({
    declination: 30, duration: 12, frequency: 230,
    noise: 0, dishDiameter: 25, method: 'clean',
    fovMuas: 80, sourceFraction: 0.50,
  });
  const [infoKey, setInfoKey] = useState(null);
  const [physicsNotesOpen, setPhysicsNotesOpen] = useState(false);
  const [citationOpen, setCitationOpen] = useState(false);
  // Accessibility settings — persisted in localStorage, applied via data attributes on <html>
  const [a11y, setA11y] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('vlbi-a11y') || 'null') || {};
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return {
      highContrast:  saved.highContrast  ?? false,
      fontSize:      saved.fontSize      ?? 'small',
      reducedMotion: saved.reducedMotion ?? prefersReducedMotion,
    };
  });
  const [a11yOpen, setA11yOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [tourActIndex, setTourActIndex] = useState(0);
  const [status, setStatus] = useState({ msg: 'Select an image and place telescopes to begin', type: '' });
  const [isComputing, setIsComputing] = useState(false);

  const workerRef = useRef(null);
  const reqIdRef = useRef(0);
  const computeTimerRef = useRef(null);
  const telIdRef = useRef(0);

  // Init worker once
  useEffect(() => {
    const worker = new Worker(new URL('./worker.js', import.meta.url));
    worker.onmessage = (e) => {
      if (e.data.type === 'result') {
        setDirty(e.data.dirty);
        setRestored(e.data.restored);
        setIsComputing(false);
        setStatus({ msg: `Reconstruction complete — ${e.data.uvCount ?? ''} UV samples`, type: 'success' });
      } else if (e.data.type === 'error') {
        setIsComputing(false);
        setStatus({ msg: 'Error: ' + e.data.message, type: 'error' });
      }
    };
    worker.onerror = (err) => {
      setIsComputing(false);
      setStatus({ msg: 'Worker error: ' + (err.message || 'failed to start'), type: 'error' });
    };
    workerRef.current = worker;
    return () => { worker.terminate(); };
  }, []);

  // Apply a11y data attributes to <html> and persist to localStorage
  useEffect(() => {
    const root = document.documentElement;
    a11y.highContrast  ? root.setAttribute('data-high-contrast', '') : root.removeAttribute('data-high-contrast');
    a11y.reducedMotion ? root.setAttribute('data-reduced-motion', '') : root.removeAttribute('data-reduced-motion');
    root.dataset.fontSize = a11y.fontSize;
    localStorage.setItem('vlbi-a11y', JSON.stringify(a11y));
  }, [a11y]);

  // Auto-load blackhole preset on mount
  useEffect(() => {
    loadImagePresetAsync('../assets/black-hole.png').then(({ previewCanvas, grayscale: gs }) => {
      setGrayscale(gs);
      setOriginalCanvas(previewCanvas);
      setSelectedPreset('blackhole');
    });
  }, []);

  // Load EHT presets on mount (after short delay)
  useEffect(() => {
    const timer = setTimeout(() => { loadEHTPresets(); }, 500);
    return () => clearTimeout(timer);
  }, []);

  function loadEHTPresets(presetName = 'EHT 2017') {
    telIdRef.current = 0;
    const stations = ARRAY_PRESETS[presetName] || ARRAY_PRESETS['EHT 2017'];
    setTelescopes(stations.map((s, idx) => ({
      id: telIdRef.current++,
      name: s.name,
      lat: s.lat,
      lon: s.lon,
      color: TELESCOPE_COLORS[idx % TELESCOPE_COLORS.length],
      visible: true,
    })));
  }

  const handleLoadArrayPreset = useCallback(() => {
    loadEHTPresets(selectedArrayPreset);
  }, [selectedArrayPreset]);

  const bhexAdded = telescopes.some(t => t.name === 'BHEX');

  const handleAddBHEX = useCallback(() => {
    if (telescopes.some(t => t.name === 'BHEX')) return;
    setTelescopes(prev => [...prev, {
      id: telIdRef.current++,
      ...BHEX_PRESET,
      visible: true,
    }]);
  }, [telescopes]);

  const handleTelescopeAdd = useCallback((lat, lon) => {
    setTelescopes(prev => {
      if (prev.length >= 50) return prev;
      const id = telIdRef.current++;
      // Non-T telescopes (EHT presets like ALMA, APEX) occupy the first N slots,
      // so T-numbering must start above them to avoid T1 appearing alongside ALMA.
      const nonTCount = prev.filter(t => isNaN(parseInt(t.name.slice(1)))).length;
      const usedNums = new Set(
        prev.map(t => parseInt(t.name.slice(1))).filter(n => !isNaN(n))
      );
      let displayNum = nonTCount + 1;
      while (usedNums.has(displayNum) && displayNum <= 50) displayNum++;
      return [...prev, {
        id, name: 'T' + displayNum, lat, lon,
        color: TELESCOPE_COLORS[id % TELESCOPE_COLORS.length],
        visible: true,
      }];
    });
  }, []);

  const handleTelescopeRemove = useCallback((id) => {
    setTelescopes(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleToggleVisibility = useCallback((id) => {
    setTelescopes(prev => prev.map(t => t.id === id ? { ...t, visible: !t.visible } : t));
  }, []);

  // Recompute UV points whenever telescopes or relevant controls change
  useEffect(() => {
    const { uvPoints: uvPts, stationPairs: pairs } = computeUVPoints(telescopes, { ...controls, N: IMAGE_SIZE });
    setUvPoints(uvPts);
    setStationPairs(pairs);
    setUvFill(computeUVFill(uvPts, IMAGE_SIZE));
    setUvPointsGl(computeUVPointsGl(telescopes, { declination: controls.declination, duration: controls.duration, frequency: controls.frequency }));
  }, [telescopes, controls.declination, controls.duration, controls.frequency, controls.fovMuas]);

  // Scale the source to occupy sourceFraction of the image, zero-pad the rest.
  // originalCanvas is always shown unscaled — only the worker input is affected.
  const scaledGrayscale = useMemo(() => {
    if (!grayscale) return null;
    const N = IMAGE_SIZE;
    const sourcePx = Math.max(1, Math.round(controls.sourceFraction * N));
    if (sourcePx === N) return grayscale; // no scaling needed
    const output = new Float64Array(N * N); // zeros = empty sky
    const outX0 = Math.floor((N - sourcePx) / 2);
    const outY0 = Math.floor((N - sourcePx) / 2);
    for (let oy = 0; oy < sourcePx; oy++) {
      for (let ox = 0; ox < sourcePx; ox++) {
        // Nearest-neighbor downsample: map each output pixel to source pixel
        const sx = Math.min(Math.floor(ox * N / sourcePx), N - 1);
        const sy = Math.min(Math.floor(oy * N / sourcePx), N - 1);
        output[(outY0 + oy) * N + (outX0 + ox)] = grayscale[sy * N + sx];
      }
    }
    return output;
  }, [grayscale, controls.sourceFraction]);

  // Debounced reconstruction
  useEffect(() => {
    clearTimeout(computeTimerRef.current);
    if (!scaledGrayscale || uvPoints.length === 0) {
      setDirty(null);
      setRestored(null);
      if (telescopes.length < 2) {
        setStatus({ msg: 'Place at least 2 telescopes to reconstruct', type: '' });
      } else {
        setStatus({ msg: 'Load an image to begin', type: '' });
      }
      return;
    }
    computeTimerRef.current = setTimeout(() => {
      setIsComputing(true);
      setStatus({ msg: 'Computing reconstruction…', type: 'loading' });
      const id = ++reqIdRef.current;
      const gs = scaledGrayscale.slice();
      const uv = uvPoints.map(p => ({ u: p.u, v: p.v }));
      const sp = stationPairs;
      const sefdMap = {};
      telescopes.forEach(t => { sefdMap[t.name] = STATION_SEFD[t.name] ?? 10000; });
      workerRef.current.postMessage(
        { type: 'reconstruct', id, grayscale: gs, uvPoints: uv, params: {
            N: IMAGE_SIZE,
            noise: controls.noise,
            method: controls.method,
            dishDiameter: controls.dishDiameter,
            frequency: controls.frequency,
            fovRad: controls.fovMuas * (Math.PI / (180 * 3.6e9)),
            stationPairs: sp,
            sefdMap,
          }
        },
        [gs.buffer]
      );
    }, 100);
    return () => clearTimeout(computeTimerRef.current);
  }, [uvPoints, stationPairs, scaledGrayscale, controls.noise, controls.method, controls.dishDiameter, controls.frequency, telescopes]);

  const IMAGE_PRESETS = { 'blackhole': '../assets/black-hole.png', 'wfu-seal': '../assets/wfu-seal.png' };

  const handlePresetSelect = useCallback((name) => {
    const url = IMAGE_PRESETS[name];
    if (url) {
      loadImagePresetAsync(url).then(({ previewCanvas, grayscale: gs }) => {
        setGrayscale(gs);
        setOriginalCanvas(previewCanvas);
        setSelectedPreset(name);
      }).catch(() => {
        setStatus({ msg: 'Failed to load image: ' + name, type: 'error' });
      });
    } else {
      const { previewCanvas, grayscale: gs } = generatePreset(name);
      setGrayscale(gs);
      setOriginalCanvas(previewCanvas);
      setSelectedPreset(name);
    }
  }, []);

  const handleFileUpload = useCallback((file) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = IMAGE_SIZE; canvas.height = IMAGE_SIZE;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, IMAGE_SIZE, IMAGE_SIZE);
      const imageData = ctx.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE);
      const gs = new Float64Array(IMAGE_SIZE * IMAGE_SIZE);
      for (let i = 0; i < IMAGE_SIZE * IMAGE_SIZE; i++) {
        gs[i] = 0.299 * imageData.data[i*4] + 0.587 * imageData.data[i*4+1] + 0.114 * imageData.data[i*4+2];
      }
      setGrayscale(gs);
      setOriginalCanvas(canvas);
      setSelectedPreset(null);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }, []);

  const handleTourAction = useCallback((action) => {
    switch (action.type) {
      case 'resetForTour':
        setTelescopes([]);
        telIdRef.current = 0;
        break;
      case 'addTelescope':
        handleTelescopeAdd(action.lat, action.lon);
        break;
      case 'loadEHT':
        loadEHTPresets();
        break;
      case 'setMethod':
        setControls(p => ({ ...p, method: action.method }));
        break;
      case 'setPreset':
        handlePresetSelect(action.preset);
        break;
      default:
        break;
    }
  }, [handleTelescopeAdd, handlePresetSelect]);

  function handleReset() {
    setTelescopes([]);
    telIdRef.current = 0;
    setSelectedArrayPreset('EHT 2017');
    loadImagePresetAsync('../assets/black-hole.png').then(({ previewCanvas, grayscale: gs }) => {
      setGrayscale(gs);
      setOriginalCanvas(previewCanvas);
      setSelectedPreset('blackhole');
    });
    setControls({ declination: 30, duration: 12, frequency: 230, noise: 0, dishDiameter: 25, method: 'clean', fovMuas: 80, sourceFraction: 0.50 });
    setStatus({ msg: 'Reset. Place telescopes to begin.', type: '' });
    setDirty(null);
    setRestored(null);
  }

  const angularRes = useMemo(() => {
    if (telescopes.length < 2) return null;
    let maxKm = 0;
    for (let i = 0; i < telescopes.length; i++) {
      for (let j = i+1; j < telescopes.length; j++) {
        const b = computeBaseline(telescopes[i], telescopes[j]);
        const km = Math.sqrt(b.bx*b.bx + b.by*b.by + b.bz*b.bz);
        if (km > maxKm) maxKm = km;
      }
    }
    if (maxKm === 0) return null;
    const lambdaM = 299792458 / (controls.frequency * 1e9);
    const thetaRad = lambdaM / (maxKm * 1e3);
    const thetaMuas = thetaRad * 206265e6;
    return thetaMuas < 1000
      ? thetaMuas.toFixed(0) + ' μas'
      : (thetaMuas/1000).toFixed(2) + ' mas';
  }, [telescopes, controls.frequency]);

  const restoredLabel = controls.method === 'clean' ? 'CLEAN'
    : controls.method === 'mem' ? 'Max Entropy'
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
          ${telescopes.length >= 2 ? html`
            <span className="stat"><span className="stat-val">${telescopes.length}</span>telescopes</span>
            <span className="stat"><span className="stat-val">${telescopes.length*(telescopes.length-1)/2}</span>baselines</span>
            <span className="stat"><span className="stat-val">${uvFill.toFixed(1)}%</span>UV fill</span>
            ${angularRes ? html`<span className="stat"><span className="stat-val">${angularRes}</span>resolution</span>` : null}
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
          selectedPreset=${selectedPreset}
          onPresetSelect=${handlePresetSelect}
          onFileUpload=${handleFileUpload}
          telescopes=${telescopes}
          onTelescopeRemove=${handleTelescopeRemove}
          onToggleVisibility=${handleToggleVisibility}
          onLoadEHT=${loadEHTPresets}
          selectedArrayPreset=${selectedArrayPreset}
          onArrayPresetChange=${setSelectedArrayPreset}
          onLoadArray=${handleLoadArrayPreset}
          bhexAdded=${bhexAdded}
          onAddBHEX=${handleAddBHEX}
          onClearAll=${() => { setTelescopes([]); telIdRef.current = 0; }}
          showCountryLabels=${showCountryLabels}
          onToggleCountryLabels=${() => setShowCountryLabels(v => !v)}
          controls=${controls}
          onControlChange=${(k, v) => setControls(p => ({ ...p, [k]: v }))}
          onOpenInfo=${setInfoKey}
          onReset=${handleReset}
        />

        <main id="tour-globe" className="globe-wrapper" aria-label="Main visualization — 3D interactive globe">
          <${Globe} telescopes=${telescopes} onTelescopeAdd=${handleTelescopeAdd} showCountryLabels=${showCountryLabels} reducedMotion=${a11y.reducedMotion} tourActive=${tourActive} />
          <${StatusBar} status=${status} isComputing=${isComputing} />
        </main>

        <aside className="right-panel" aria-label="Analysis outputs">
          <section id="tour-uv" className="panel-section">
            <h2>UV Coverage <${InfoTooltip} infoKey="uvmap" onOpen=${setInfoKey} /></h2>
            <${UVMap} uvPoints=${uvPointsGl} N=${IMAGE_SIZE} />
            <p className="caption">Fill: ${uvFill.toFixed(2)}% of spatial frequencies sampled · ${uvPoints.length} samples</p>
          </section>

          <section id="tour-images" className="panel-section">
            <h2>Image Reconstruction</h2>
            <div className="images-row">
              <${OriginalImagePanel}
                canvas=${originalCanvas}
                label="Ground Truth"
                infoKey="ground"
                onOpenInfo=${setInfoKey}
              />
              <${ImageCanvas}
                data=${dirty}
                N=${IMAGE_SIZE}
                label="Dirty Image"
                infoKey="dirty"
                onOpenInfo=${setInfoKey}
              />
              <${ImageCanvas}
                data=${restored}
                N=${IMAGE_SIZE}
                label=${restoredLabel}
                infoKey="restored"
                onOpenInfo=${setInfoKey}
              />
            </div>
            <${ContourMap}
              dirtyData=${dirty}
              restoredData=${restored}
              N=${IMAGE_SIZE}
              angularResolution=${angularRes}
              fovMuas=${controls.fovMuas}
              controls=${controls}
              onOpenInfo=${setInfoKey}
            />
          </section>
        </aside>
      </div>

      <${InfoModal} infoKey=${infoKey} onClose=${() => setInfoKey(null)} />
      <${PhysicsNotesModal} open=${physicsNotesOpen} onClose=${() => setPhysicsNotesOpen(false)} />
      <${CitationModal} open=${citationOpen} onClose=${() => setCitationOpen(false)} telescopes=${telescopes} controls=${controls} />
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
