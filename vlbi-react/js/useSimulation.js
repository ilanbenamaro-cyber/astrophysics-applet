// useSimulation — all simulation-specific state, effects, and handlers.
// App.js keeps only global UI state (modals, a11y, tour).
import { useState, useEffect, useCallback, useRef, useMemo } from './core.js';
import { IMAGE_SIZE, TELESCOPE_COLORS, ARRAY_PRESETS, STATION_SEFD,
         BHEX_PRESET, SKY_TARGETS } from './constants.js';
import { computeUVPoints, computeUVPointsGl, computeUVFill, computeBaseline,
         latLonToECEF, computeSatelliteECEF } from './uvCompute.js';
import { loadImagePresetAsync } from './presets.js';
import { exportFITS } from './fitsExport.js';

const DEFAULT_CONTROLS = {
  declination: 12.391, duration: 12, frequency: 230,
  noise: 0, dishDiameter: 25, method: 'clean',
  fovMuas: 80, sourceFraction: 0.50,
};

const IMAGE_PRESETS = {
  'blackhole': '../assets/black-hole.png',
  'wfu-seal':  '../assets/wfu-seal.png',
};

export function useSimulation() {
  const [telescopes, setTelescopes]             = useState([]);
  const [showCountryLabels, setShowCountryLabels] = useState(true);
  const [selectedPreset, setSelectedPreset]     = useState('blackhole');
  const [selectedArrayPreset, setSelectedArrayPreset] = useState('EHT 2017');
  const [grayscale, setGrayscale]               = useState(null);
  const [originalCanvas, setOriginalCanvas]     = useState(null);
  const [uvPoints, setUvPoints]                 = useState([]);
  const [stationPairs, setStationPairs]         = useState([]);
  const [uvPointsGl, setUvPointsGl]             = useState([]);
  const [uvFill, setUvFill]                     = useState(0);
  const [dirty, setDirty]                       = useState(null);
  const [restored, setRestored]                 = useState(null);
  const [controls, setControls]                 = useState(DEFAULT_CONTROLS);
  const [status, setStatus]                     = useState({ msg: 'Select an image and place telescopes to begin', type: '' });
  const [isComputing, setIsComputing]           = useState(false);
  const [uvCount, setUvCount]                   = useState(0);
  const [beamDims, setBeamDims]                 = useState({ sigmaU: 2, sigmaV: 2, pa: 0 });
  const [selectedTarget, setSelectedTarget]     = useState('M87*');

  const workerRef       = useRef(null);
  const reqIdRef        = useRef(0);
  const computeTimerRef = useRef(null);
  const telIdRef        = useRef(0);

  // ── Worker lifecycle ────────────────────────────────────────────────────────
  useEffect(() => {
    const worker = new Worker(new URL('./worker.js', import.meta.url));
    worker.onmessage = (e) => {
      if (e.data.type === 'result') {
        setDirty(e.data.dirty);
        setRestored(e.data.restored);
        if (e.data.beamSigmaU !== undefined) {
          setBeamDims({ sigmaU: e.data.beamSigmaU, sigmaV: e.data.beamSigmaV, pa: e.data.beamPA });
        }
        setUvCount(e.data.uvCount ?? 0);
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

  // ── Auto-load default image on mount ───────────────────────────────────────
  useEffect(() => {
    loadImagePresetAsync('../assets/black-hole.png').then(({ previewCanvas, grayscale: gs }) => {
      setGrayscale(gs);
      setOriginalCanvas(previewCanvas);
      setSelectedPreset('blackhole');
    });
  }, []);

  // ── Array preset helpers ────────────────────────────────────────────────────
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

  // Load EHT 2017 on mount (after short delay for worker init)
  useEffect(() => {
    const timer = setTimeout(() => { loadEHTPresets(); }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleLoadArrayPreset = useCallback(() => {
    loadEHTPresets(selectedArrayPreset);
  }, [selectedArrayPreset]);

  // ── UV recomputation ────────────────────────────────────────────────────────
  useEffect(() => {
    const { uvPoints: uvPts, stationPairs: pairs } = computeUVPoints(telescopes, { ...controls, N: IMAGE_SIZE });
    setUvPoints(uvPts);
    setStationPairs(pairs);
    setUvFill(computeUVFill(uvPts, IMAGE_SIZE));
    setUvPointsGl(computeUVPointsGl(telescopes, {
      declination: controls.declination,
      duration:    controls.duration,
      frequency:   controls.frequency,
    }));
  }, [telescopes, controls.declination, controls.duration, controls.frequency, controls.fovMuas]);

  // ── Derived source fraction ─────────────────────────────────────────────────
  const effectiveSourceFraction = useMemo(() => {
    const target = SKY_TARGETS[selectedTarget];
    if (target && target.shadowUas !== null) {
      return Math.min(0.95, Math.max(0.05, target.shadowUas / controls.fovMuas));
    }
    return controls.sourceFraction;
  }, [selectedTarget, controls.fovMuas, controls.sourceFraction]);

  // ── Scaled source image ─────────────────────────────────────────────────────
  const scaledGrayscale = useMemo(() => {
    if (!grayscale) return null;
    const N = IMAGE_SIZE;
    const sourcePx = Math.max(1, Math.round(effectiveSourceFraction * N));
    if (sourcePx === N) return grayscale;
    const output = new Float64Array(N * N);
    const outX0 = Math.floor((N - sourcePx) / 2);
    const outY0 = Math.floor((N - sourcePx) / 2);
    for (let oy = 0; oy < sourcePx; oy++) {
      for (let ox = 0; ox < sourcePx; ox++) {
        const sx = Math.min(Math.floor(ox * N / sourcePx), N - 1);
        const sy = Math.min(Math.floor(oy * N / sourcePx), N - 1);
        output[(outY0 + oy) * N + (outX0 + ox)] = grayscale[sy * N + sx];
      }
    }
    return output;
  }, [grayscale, effectiveSourceFraction]);

  // ── SEFD maps ───────────────────────────────────────────────────────────────
  const sefdMap = useMemo(() => {
    const m = {};
    telescopes.forEach(t => { m[t.name] = STATION_SEFD[t.name] ?? 10000; });
    return m;
  }, [telescopes]);

  const pairSefdMap = useMemo(() => {
    const m = {};
    const visible = telescopes.filter(t => t.visible !== false);
    const ground  = visible.filter(t => t.type !== 'space');
    const space   = visible.filter(t => t.type === 'space');
    for (let i = 0; i < ground.length; i++) {
      for (let j = i + 1; j < ground.length; j++) {
        const a = ground[i], b = ground[j];
        m[`${a.id}-${b.id}`] = { sefdA: sefdMap[a.name] ?? 10000, sefdB: sefdMap[b.name] ?? 10000 };
      }
    }
    for (const sat of space) {
      for (const g of ground) {
        m[`${sat.id}-${g.id}`] = { sefdA: sefdMap[sat.name] ?? 10000, sefdB: sefdMap[g.name] ?? 10000 };
      }
    }
    return m;
  }, [telescopes, sefdMap]);

  // ── Debounced reconstruction ────────────────────────────────────────────────
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
      workerRef.current.postMessage(
        { type: 'reconstruct', id, grayscale: gs, uvPoints: uv, params: {
            N: IMAGE_SIZE,
            noise:        controls.noise,
            method:       controls.method,
            dishDiameter: controls.dishDiameter,
            frequency:    controls.frequency,
            fovRad:       controls.fovMuas * (Math.PI / (180 * 3.6e9)),
            stationPairs: sp,
            sefdMap,
          }
        },
        [gs.buffer]
      );
    }, 100);
    return () => clearTimeout(computeTimerRef.current);
  }, [uvPoints, stationPairs, scaledGrayscale, controls.noise, controls.method, controls.dishDiameter, controls.frequency, sefdMap]);

  // ── Derived display metrics ─────────────────────────────────────────────────
  const angularRes = useMemo(() => {
    if (telescopes.length < 2) return null;
    let maxKm = 0;
    for (let i = 0; i < telescopes.length; i++) {
      for (let j = i + 1; j < telescopes.length; j++) {
        const b = computeBaseline(telescopes[i], telescopes[j]);
        const km = Math.sqrt(b.bx*b.bx + b.by*b.by + b.bz*b.bz);
        if (km > maxKm) maxKm = km;
      }
    }
    if (maxKm === 0) return null;
    const lambdaM = 299792458 / (controls.frequency * 1e9);
    const thetaMuas = (lambdaM / (maxKm * 1e3)) * 206265e6;
    return thetaMuas < 1000
      ? thetaMuas.toFixed(0) + ' μas'
      : (thetaMuas / 1000).toFixed(2) + ' mas';
  }, [telescopes, controls.frequency]);

  const baselineStats = useMemo(() => {
    const groundTels = telescopes.filter(t => t.type !== 'space');
    const spaceTels  = telescopes.filter(t => t.type === 'space');
    if (groundTels.length < 2) return null;
    let maxKm = 0, minKm = Infinity;
    for (let i = 0; i < groundTels.length; i++) {
      for (let j = i + 1; j < groundTels.length; j++) {
        const pA = latLonToECEF(groundTels[i].lat, groundTels[i].lon);
        const pB = latLonToECEF(groundTels[j].lat, groundTels[j].lon);
        const d = Math.sqrt((pA.x-pB.x)**2 + (pA.y-pB.y)**2 + (pA.z-pB.z)**2);
        if (d > maxKm) maxKm = d;
        if (d > 0.1 && d < minKm) minKm = d;
      }
    }
    for (const sat of spaceTels) {
      const satPos = computeSatelliteECEF(sat, 0);
      for (const g of groundTels) {
        const gPos = latLonToECEF(g.lat, g.lon);
        const d = Math.sqrt((satPos.x-gPos.x)**2 + (satPos.y-gPos.y)**2 + (satPos.z-gPos.z)**2);
        if (d > maxKm) maxKm = d;
      }
    }
    const lambdaM = 299792458 / (controls.frequency * 1e9);
    const maxGl = maxKm * 1e3 / lambdaM / 1e9;
    const minGl = minKm < Infinity ? minKm * 1e3 / lambdaM / 1e9 : 0;
    return { maxKm, maxGl, minGl };
  }, [telescopes, controls.frequency]);

  const dynamicRange = useMemo(() => {
    if (!restored || restored.length === 0) return 0;
    let maxV = 0;
    for (let i = 0; i < restored.length; i++) if (restored[i] > maxV) maxV = restored[i];
    if (maxV === 0) return 0;
    const Nm = IMAGE_SIZE;
    const margin = Math.floor(Nm * 0.1);
    const border = [];
    for (let r = 0; r < Nm; r++) {
      for (let c = 0; c < Nm; c++) {
        if (r < margin || r >= Nm - margin || c < margin || c >= Nm - margin)
          border.push(restored[r * Nm + c]);
      }
    }
    const sorted = border.slice().sort((a, b) => a - b);
    const med = sorted[Math.floor(sorted.length / 2)];
    const absDevs = border.map(v => Math.abs(v - med)).sort((a, b) => a - b);
    const madSigma = 1.4826 * absDevs[Math.floor(absDevs.length / 2)];
    const safeSigma = (isFinite(madSigma) && madSigma > 0 && madSigma < maxV * 0.1)
      ? madSigma : (maxV > 0 ? maxV * 0.01 : 0);
    return safeSigma > 0 ? maxV / safeSigma : 0;
  }, [restored]);

  const beamFwhm = useMemo(() => {
    const pixelScale = controls.fovMuas / IMAGE_SIZE;
    return {
      major: beamDims.sigmaU * 2.355 * pixelScale,
      minor: beamDims.sigmaV * 2.355 * pixelScale,
    };
  }, [beamDims, controls.fovMuas]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleTargetChange = useCallback((name) => {
    setSelectedTarget(name);
    if (name !== 'Custom') {
      setControls(c => ({ ...c, declination: SKY_TARGETS[name].dec }));
    }
  }, []);

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
      const nonTCount = prev.filter(t => isNaN(parseInt(t.name.slice(1)))).length;
      const usedNums = new Set(prev.map(t => parseInt(t.name.slice(1))).filter(n => !isNaN(n)));
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

  // Exposed for Tour's resetForTour action
  const handleClearTelescopes = useCallback(() => {
    setTelescopes([]);
    telIdRef.current = 0;
  }, []);

  // Exposed for Tour's loadEHT action
  const handleLoadDefaultEHT = useCallback(() => {
    loadEHTPresets('EHT 2017');
  }, []);

  function handleReset() {
    setTelescopes([]);
    telIdRef.current = 0;
    setSelectedArrayPreset('EHT 2017');
    loadImagePresetAsync('../assets/black-hole.png').then(({ previewCanvas, grayscale: gs }) => {
      setGrayscale(gs);
      setOriginalCanvas(previewCanvas);
      setSelectedPreset('blackhole');
    });
    setSelectedTarget('M87*');
    setControls(DEFAULT_CONTROLS);
    setStatus({ msg: 'Reset. Place telescopes to begin.', type: '' });
    setDirty(null);
    setRestored(null);
  }

  const handleExportFITS = useCallback(() => {
    if (!restored) return;
    exportFITS(restored, IMAGE_SIZE, controls, selectedTarget, beamDims);
  }, [restored, controls, selectedTarget, beamDims]);

  const bhexAdded = telescopes.some(t => t.name === 'BHEX');

  return {
    // State
    telescopes, showCountryLabels, selectedPreset, selectedArrayPreset,
    grayscale, originalCanvas,
    uvPoints, stationPairs, uvPointsGl, uvFill,
    dirty, restored,
    controls, status, isComputing, uvCount, beamDims, selectedTarget,
    // Derived
    effectiveSourceFraction, angularRes, baselineStats,
    sefdMap, pairSefdMap, dynamicRange, beamFwhm,
    bhexAdded,
    // Setters needed by App.js
    setControls, setSelectedArrayPreset, setShowCountryLabels,
    // Handlers
    handleTelescopeAdd, handleTelescopeRemove, handleToggleVisibility,
    handleTargetChange, handleAddBHEX, handleLoadArrayPreset,
    handlePresetSelect, handleFileUpload, handleReset, handleExportFITS,
    handleClearTelescopes, handleLoadDefaultEHT,
    loadEHTPresets,
  };
}
