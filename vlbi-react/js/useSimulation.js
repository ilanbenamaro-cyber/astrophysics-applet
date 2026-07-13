// useSimulation — all simulation-specific state, effects, and handlers.
// App.js keeps only global UI state (modals, a11y, tour).
import { useState, useEffect, useCallback, useRef, useMemo } from './core.js';
import { IMAGE_SIZE, TELESCOPE_COLORS, ARRAY_PRESETS, STATION_SEFD,
         BHEX_PRESET, SKY_TARGETS } from './constants.js';
import { computeUVPoints, computeUVPointsGl, computeUVFillGl,
         computeUVMaxExtentGl,
         latLonToECEF, computeSatelliteECEF,
         computeElevation, MIN_ELEVATION_RAD } from './uvCompute.js';
import { scaleSource, zoomSource, measureRingFraction, buildSefdMap, buildPairSefdMap,
         computeDynamicRange, beamFwhm as beamFwhmFn, angularResFromUV,
         presetMeanDish, computeSourceRadialPower, assessSourceSuitability } from './simCore.js';
import { loadImagePresetAsync } from './presets.js';
import { drawHot } from './simRender.js';
import { exportFITS } from './fitsExport.js';

const DEFAULT_CONTROLS = {
  declination: SKY_TARGETS['M87*'].dec, duration: 12, frequency: 230,
  noise: 0,
  // N5: default dish = mean dish of the initial preset's stations (EHT 2017),
  // recomputed on every preset load; EHT 2022 mean when no EHT stations remain.
  dishDiameter: presetMeanDish('EHT 2017'),
  method: 'clean',
  fovMuas: 80, sourceFraction: 0.50,
  invert: false,   // when true, dark ink becomes the emitter on dark sky (custom sources)
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
    const stations = ARRAY_PRESETS[presetName] || ARRAY_PRESETS['EHT 2017'];
    setTelescopes(prev => {
      // BHEX is an independent toggle (N2): preset changes swap the ground
      // array but must not silently drop the space element.
      const keepBhex = prev.some(t => t.name === BHEX_PRESET.name);
      telIdRef.current = 0;
      const next = stations.map((s, idx) => ({
        id: telIdRef.current++,
        name: s.name,
        lat: s.lat,
        lon: s.lon,
        color: TELESCOPE_COLORS[idx % TELESCOPE_COLORS.length],
        visible: true,
      }));
      if (keepBhex) next.push({ id: telIdRef.current++, ...BHEX_PRESET, visible: true });
      return next;
    });
    // N5: the default dish tracks the selected EHT version's mean dish.
    setControls(c => ({ ...c, dishDiameter: presetMeanDish(presetName) }));
  }

  // Load EHT 2017 on mount (after short delay for worker init)
  useEffect(() => {
    const timer = setTimeout(() => { loadEHTPresets(); }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleLoadArrayPreset = useCallback((nameOverride) => {
    const name = (typeof nameOverride === 'string') ? nameOverride : selectedArrayPreset;
    loadEHTPresets(name);
  }, [selectedArrayPreset]);

  // ── UV recomputation ────────────────────────────────────────────────────────
  useEffect(() => {
    const { uvPoints: uvPts, stationPairs: pairs } = computeUVPoints(telescopes, { ...controls, N: IMAGE_SIZE });
    setUvPoints(uvPts);
    setStationPairs(pairs);
    setUvPointsGl(computeUVPointsGl(telescopes, {
      declination: controls.declination,
      duration:    controls.duration,
      frequency:   controls.frequency,
    }));
  }, [telescopes, controls.declination, controls.duration, controls.frequency, controls.fovMuas]);

  // ── Measured ring fraction ──────────────────────────────────────────────────
  // The loaded image's bright ring does NOT fill its frame (black-hole.png: ~0.43).
  // Radial-peak measurement is only meaningful for ring-like sources, so the value
  // is sanity-banded — outside [0.2, 0.95] (point-like / extended sources) it falls
  // back to 1 and the legacy frame-fraction behavior is preserved unchanged.
  // Invert (Item 3): dark-on-light logos are the inverse of a real source. When on,
  // reflect brightness so the ink becomes the emitter on dark sky. Returns the SAME
  // array reference when off, so every downstream memo (and the ring path) is untouched.
  const effectiveGrayscale = useMemo(() => {
    if (!grayscale || !controls.invert) return grayscale;
    let mx = 0;
    for (let i = 0; i < grayscale.length; i++) if (grayscale[i] > mx) mx = grayscale[i];
    const out = new Float64Array(grayscale.length);
    for (let i = 0; i < grayscale.length; i++) out[i] = mx - grayscale[i];
    return out;
  }, [grayscale, controls.invert]);

  const ringFraction = useMemo(() => {
    if (!effectiveGrayscale) return 1;
    // Only meaningful for a ring/black-hole target. Radial-peak measurement returned a
    // spurious ~0.89 for the WFU seal (a logo has no ring), which then mis-scaled it.
    // Skip it for non-shadow targets (Custom/arbitrary uploads) — they scale by frame.
    const target = SKY_TARGETS[selectedTarget];
    if (!target || target.shadowUas == null) return 1;
    const f = measureRingFraction(effectiveGrayscale, IMAGE_SIZE);
    return (f >= 0.2 && f <= 0.95) ? f : 1;
  }, [effectiveGrayscale, selectedTarget]);

  // ── Derived source fraction ─────────────────────────────────────────────────
  // For named targets the RING (not the frame) must span shadowUas of the FOV:
  // frame factor = (shadowUas / fov) / measured ring fraction. Factors > 1 zoom
  // (center-crop) the source; < 1 shrink it — same math the tour's Acts C/D use.
  const effectiveSourceFraction = useMemo(() => {
    const target = SKY_TARGETS[selectedTarget];
    if (target && target.shadowUas !== null) {
      return Math.min(3, Math.max(0.05, (target.shadowUas / controls.fovMuas) / ringFraction));
    }
    return controls.sourceFraction;
  }, [selectedTarget, controls.fovMuas, controls.sourceFraction, ringFraction]);

  // ── Scaled source image ─────────────────────────────────────────────────────
  const scaledGrayscale = useMemo(
    () => effectiveSourceFraction >= 1
      ? zoomSource(effectiveGrayscale, effectiveSourceFraction, IMAGE_SIZE)
      : scaleSource(effectiveGrayscale, effectiveSourceFraction, IMAGE_SIZE),
    [effectiveGrayscale, effectiveSourceFraction]);

  // Ground-truth preview: what the array actually images (the scaled/positioned source),
  // rendered in the same hot colormap as the reconstruction so the two are honestly
  // comparable — not the raw, unscaled upload the user dropped in.
  const scaledSourceCanvas = useMemo(() => {
    if (!scaledGrayscale) return null;
    const cv = document.createElement('canvas');
    cv.width = IMAGE_SIZE; cv.height = IMAGE_SIZE;
    drawHot(cv.getContext('2d'), scaledGrayscale, IMAGE_SIZE);
    return cv;
  }, [scaledGrayscale]);

  // ── Source suitability (computed diagnostic) ─────────────────────────────────
  // FFT the RAW image once per source (what the user actually uploaded, before the
  // frame-scaling that would mask the problem); the array-dependent band split is cheap.
  const sourceRadialPower = useMemo(
    () => computeSourceRadialPower(effectiveGrayscale, IMAGE_SIZE, controls.fovMuas),
    [effectiveGrayscale, controls.fovMuas]);

  const sourceSuitability = useMemo(() => {
    if (!sourceRadialPower || uvPointsGl.length === 0) return null;
    let uMax = 0;
    for (const p of uvPointsGl) { const r = Math.hypot(p.u, p.v); if (r > uMax) uMax = r; }
    return assessSourceSuitability(sourceRadialPower, uMax, controls.fovMuas);
  }, [sourceRadialPower, uvPointsGl, controls.fovMuas]);

  // ── SEFD maps ───────────────────────────────────────────────────────────────
  const sefdMap = useMemo(() => buildSefdMap(telescopes, STATION_SEFD), [telescopes]);

  const pairSefdMap = useMemo(() => buildPairSefdMap(telescopes, sefdMap), [telescopes, sefdMap]);

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
  // Fixed UV-map scale (N1): the BHEX-enabled coverage extent, independent of
  // whether BHEX is toggled — the UV axes must not move when BHEX toggles.
  const uvDisplayMaxGl = useMemo(
    () => computeUVMaxExtentGl(telescopes, {
      declination: controls.declination,
      duration:    controls.duration,
      frequency:   controls.frequency,
    }),
    [telescopes, controls.declination, controls.duration, controls.frequency]);

  // Relative coverage (N3, relabeled per P5): % of cells sampled on a fixed grid
  // spanning the locked display extent above — one frame for both the axes and
  // the metric's denominator. Comparative, not absolute completeness.
  const uvFill = useMemo(
    () => computeUVFillGl(uvPointsGl, uvDisplayMaxGl),
    [uvPointsGl, uvDisplayMaxGl]);

  // P1: resolution from the sampled coverage (λ/|uv|max of the computed tracks),
  // never the geometric array max — frequency/declination/duration flow in
  // through uvPointsGl itself.
  const angularRes = useMemo(() => angularResFromUV(uvPointsGl), [uvPointsGl]);

  const baselineStats = useMemo(() => {
    const groundTels = telescopes.filter(t => t.type !== 'space');
    const spaceTels  = telescopes.filter(t => t.type === 'space');
    // A baseline exists with 2+ ground stations OR 1+ ground and a satellite
    // (1 ground + BHEX reconstructs — 354 UV samples — so its ground–space
    // baseline must show in the stats too, not just with 2+ ground).
    if (groundTels.length < 2 && !(groundTels.length >= 1 && spaceTels.length >= 1)) return null;
    // P2 (Ilan, delegated authority, 2026-07-07; refined at pre-push review
    // 2026-07-09): the stats count only TARGET-OBSERVING baselines — same
    // principle as P1. Ground pairs must be CO-VISIBLE (both stations clear the
    // elevation cutoff at the same hour angle) somewhere in the observation
    // window; ground–space samples require the ground station to see the target.
    // M87* Earth-only: 10,883 km IRAM–JCMT (matches the tour headline), never
    // the geometric 11,406 IRAM–SPT (SPT can't see M87*). With BHEX at M87*:
    // 39,109 km LMT–BHEX over the observed track (H=0 snapshot understated ~15%).
    const STEPS = 200;
    const halfDur = controls.duration * Math.PI / 24;
    const decRad = controls.declination * Math.PI / 180;
    const seesAt = groundTels.map(g => {
      const row = new Uint8Array(STEPS + 1);
      for (let s = 0; s <= STEPS; s++) {
        const H = -halfDur + (s / STEPS) * 2 * halfDur;
        row[s] = computeElevation(g.lat, H, decRad) >= MIN_ELEVATION_RAD ? 1 : 0;
      }
      return row;
    });
    let maxKm = 0, minKm = Infinity;
    for (let i = 0; i < groundTels.length; i++) {
      for (let j = i + 1; j < groundTels.length; j++) {
        let coVisible = false;
        for (let s = 0; s <= STEPS; s++) {
          if (seesAt[i][s] && seesAt[j][s]) { coVisible = true; break; }
        }
        if (!coVisible) continue;
        const pA = latLonToECEF(groundTels[i].lat, groundTels[i].lon);
        const pB = latLonToECEF(groundTels[j].lat, groundTels[j].lon);
        const d = Math.sqrt((pA.x-pB.x)**2 + (pA.y-pB.y)**2 + (pA.z-pB.z)**2);
        if (d > maxKm) maxKm = d;
        if (d > 0.1 && d < minKm) minKm = d;
      }
    }
    for (const sat of spaceTels) {
      for (const g of groundTels) {
        const gPos = latLonToECEF(g.lat, g.lon);
        for (let s = 0; s <= STEPS; s++) {
          const H = -halfDur + (s / STEPS) * 2 * halfDur;
          if (computeElevation(g.lat, H, decRad) < MIN_ELEVATION_RAD) continue;
          const satPos = computeSatelliteECEF(sat, H / (2 * Math.PI) * 24);
          const d = Math.sqrt((satPos.x-gPos.x)**2 + (satPos.y-gPos.y)**2 + (satPos.z-gPos.z)**2);
          if (d > maxKm) maxKm = d;
        }
      }
    }
    // No target-observing baseline at all (e.g. an all-northern array at dec −90):
    // hide the stat, consistent with the resolution stat (no UV samples exist).
    if (maxKm === 0) return null;
    const lambdaM = 299792458 / (controls.frequency * 1e9);
    const maxGl = maxKm * 1e3 / lambdaM / 1e9;
    const minGl = minKm < Infinity ? minKm * 1e3 / lambdaM / 1e9 : 0;
    return { maxKm, maxGl, minGl };
  }, [telescopes, controls.frequency, controls.duration, controls.declination]);

  const dynamicRange = useMemo(() => computeDynamicRange(restored, IMAGE_SIZE), [restored]);

  const beamFwhm = useMemo(
    () => beamFwhmFn(beamDims, controls.fovMuas, IMAGE_SIZE),
    [beamDims, controls.fovMuas]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleTargetChange = useCallback((name) => {
    setSelectedTarget(name);
    if (name !== 'Custom') {
      setControls(c => ({ ...c, declination: SKY_TARGETS[name].dec }));
    }
  }, []);

  const handleToggleInvert = useCallback(() => {
    setControls(c => ({ ...c, invert: !c.invert }));
  }, []);

  const handleToggleBHEX = useCallback(() => {
    setTelescopes(prev => prev.some(t => t.name === BHEX_PRESET.name)
      ? prev.filter(t => t.name !== BHEX_PRESET.name)
      : [...prev, { id: telIdRef.current++, ...BHEX_PRESET, visible: true }]);
  }, []);

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
        // The black-hole image IS the M87* target; the WFU seal is a logo, not a sky
        // source — image it as Custom so it is never scaled or labeled as M87*.
        handleTargetChange(name === 'blackhole' ? 'M87*' : 'Custom');
      }).catch(() => {
        setStatus({ msg: 'Failed to load image: ' + name, type: 'error' });
      });
    }
  }, [handleTargetChange]);

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
      // A user upload is never the M87* target — do not scale it to the 42 μas shadow
      // or label it with M87*'s dec/distance (it keeps the current declination).
      setSelectedTarget('Custom');
      URL.revokeObjectURL(url);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }, []);

  // Exposed for Tour's resetForTour action
  const handleClearTelescopes = useCallback(() => {
    setTelescopes([]);
    telIdRef.current = 0;
    // N5: with no EHT stations present, the default dish is the EHT 2022 mean.
    setControls(c => ({ ...c, dishDiameter: presetMeanDish('EHT 2022') }));
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
    grayscale, originalCanvas, scaledSourceCanvas,
    uvPoints, stationPairs, uvPointsGl, uvFill,
    dirty, restored,
    controls, status, isComputing, uvCount, beamDims, selectedTarget,
    // Derived
    uvDisplayMaxGl,
    effectiveSourceFraction, ringFraction, angularRes, baselineStats, sourceSuitability,
    sefdMap, pairSefdMap, dynamicRange, beamFwhm,
    bhexAdded,
    // Setters needed by App.js
    setControls, setSelectedArrayPreset, setShowCountryLabels,
    // Handlers
    handleTelescopeAdd, handleTelescopeRemove, handleToggleVisibility,
    handleTargetChange, handleToggleInvert, handleToggleBHEX, handleLoadArrayPreset,
    handlePresetSelect, handleFileUpload, handleReset, handleExportFITS,
    handleClearTelescopes, handleLoadDefaultEHT,
    loadEHTPresets,
  };
}
