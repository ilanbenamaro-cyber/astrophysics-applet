// simCore.js — pure simulation core, lifted out of useSimulation.js with ZERO
// behavior change so it can be driven from anywhere (the live app's hook AND the
// engine-real tour acts) without React.
//
// WHY THIS EXISTS: the audit (.workflows/_system/TOUR-ENGINE-AUDIT.md §4.2) found the
// reconstruction pipeline was only reachable through useSimulation's effects. These
// functions are the same logic expressed as plain calls. useSimulation.js imports them
// back, so the live app is unchanged; tour acts import the same functions to drive real
// engine output. The worker stays a classic, non-singleton module (one per call here).
import { IMAGE_SIZE } from './constants.js';
import { computeBaseline } from './uvCompute.js';

const C_M_S = 299792458;

// ── Reconstruction ───────────────────────────────────────────────────────────
// Runs one reconstruction in its OWN worker and resolves with the result. Mirrors the
// dispatch + result handling previously inline in useSimulation.js:175–210.
//
// IMPORTANT: grayscale.buffer is TRANSFERRED to the worker (zero-copy, matches the app).
// The passed array is detached on return — pass a fresh `.slice()` if you must keep the
// source (the live hook does exactly this).
//
// onProgress (optional) receives {type:'progress', id, iter, residual} messages emitted
// by the worker's CLEAN loop when params.progressEvery is set (opt-in; see worker.js).
export function runReconstruction(grayscale, uvPoints, params, onProgress) {
  return new Promise((resolve, reject) => {
    let worker;
    try {
      worker = new Worker(new URL('./worker.js', import.meta.url));
    } catch (err) {
      reject(new Error('Failed to start worker: ' + (err && err.message)));
      return;
    }
    const id = 1;
    worker.onmessage = (e) => {
      const d = e.data;
      if (d.type === 'progress') { if (onProgress) onProgress(d); return; }
      if (d.type === 'result') {
        worker.terminate();
        resolve({
          dirty: d.dirty, restored: d.restored,
          beamSigmaU: d.beamSigmaU, beamSigmaV: d.beamSigmaV, beamPA: d.beamPA,
          uvCount: d.uvCount,
        });
      } else if (d.type === 'error') {
        worker.terminate();
        reject(new Error(d.message || 'reconstruction failed'));
      }
    };
    worker.onerror = (err) => {
      worker.terminate();
      reject(new Error((err && err.message) || 'worker failed to start'));
    };
    worker.postMessage(
      { type: 'reconstruct', id, grayscale, uvPoints, params },
      [grayscale.buffer]
    );
  });
}

// ── Source scaling ───────────────────────────────────────────────────────────
// Crop/scale the source image to occupy `fraction` of the N×N field, centered.
// Verbatim logic from useSimulation.js:130–146 (the scaledGrayscale memo body).
export function scaleSource(grayscale, fraction, N = IMAGE_SIZE) {
  if (!grayscale) return null;
  const sourcePx = Math.max(1, Math.round(fraction * N));
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
}

// ── SEFD maps ──────────────────────────────────────────────────────────────────
// Per-station SEFD lookup. Verbatim from useSimulation.js:149–153.
export function buildSefdMap(telescopes, stationSefd) {
  const m = {};
  telescopes.forEach(t => { m[t.name] = stationSefd[t.name] ?? 10000; });
  return m;
}

// Per-baseline {sefdA, sefdB} keyed by pairId. Verbatim from useSimulation.js:155–172.
export function buildPairSefdMap(telescopes, sefdMap) {
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
}

// ── Derived metrics ─────────────────────────────────────────────────────────────
// Dynamic range = peak / robust-σ (MAD on outer 10% border). From useSimulation.js:259–280.
export function computeDynamicRange(restored, N = IMAGE_SIZE) {
  if (!restored || restored.length === 0) return 0;
  let maxV = 0;
  for (let i = 0; i < restored.length; i++) if (restored[i] > maxV) maxV = restored[i];
  if (maxV === 0) return 0;
  const margin = Math.floor(N * 0.1);
  const border = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (r < margin || r >= N - margin || c < margin || c >= N - margin)
        border.push(restored[r * N + c]);
    }
  }
  const sorted = border.slice().sort((a, b) => a - b);
  const med = sorted[Math.floor(sorted.length / 2)];
  const absDevs = border.map(v => Math.abs(v - med)).sort((a, b) => a - b);
  const madSigma = 1.4826 * absDevs[Math.floor(absDevs.length / 2)];
  const safeSigma = (isFinite(madSigma) && madSigma > 0 && madSigma < maxV * 0.1)
    ? madSigma : (maxV > 0 ? maxV * 0.01 : 0);
  return safeSigma > 0 ? maxV / safeSigma : 0;
}

// Beam FWHM in μas from worker-measured PSF sigmas. From useSimulation.js:282–288.
export function beamFwhm(beamDims, fovMuas, N = IMAGE_SIZE) {
  const pixelScale = fovMuas / N;
  return {
    major: beamDims.sigmaU * 2.355 * pixelScale,
    minor: beamDims.sigmaV * 2.355 * pixelScale,
  };
}

// Angular resolution string (θ = λ/B_max), or null with < 2 stations.
// From useSimulation.js:213–229 (uses the imported computeBaseline, never a copy).
export function angularRes(telescopes, frequency) {
  if (telescopes.length < 2) return null;
  let maxKm = 0;
  for (let i = 0; i < telescopes.length; i++) {
    for (let j = i + 1; j < telescopes.length; j++) {
      const b = computeBaseline(telescopes[i], telescopes[j]);
      const km = Math.sqrt(b.bx * b.bx + b.by * b.by + b.bz * b.bz);
      if (km > maxKm) maxKm = km;
    }
  }
  if (maxKm === 0) return null;
  const lambdaM = C_M_S / (frequency * 1e9);
  const thetaMuas = (lambdaM / (maxKm * 1e3)) * 206265e6;
  return thetaMuas < 1000
    ? thetaMuas.toFixed(0) + ' μas'
    : (thetaMuas / 1000).toFixed(2) + ' mas';
}
