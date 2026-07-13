// simCore.js — pure simulation core, lifted out of useSimulation.js with ZERO
// behavior change so it can be driven from anywhere (the live app's hook AND the
// engine-real tour acts) without React.
//
// WHY THIS EXISTS: the audit (.workflows/_system/TOUR-ENGINE-AUDIT.md §4.2) found the
// reconstruction pipeline was only reachable through useSimulation's effects. These
// functions are the same logic expressed as plain calls. useSimulation.js imports them
// back, so the live app is unchanged; tour acts import the same functions to drive real
// engine output. The worker stays a classic, non-singleton module (one per call here).
import { IMAGE_SIZE, ARRAY_PRESETS, DISH_DIAMETERS } from './constants.js';

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

// ── Ring-source measurement + zoom ──────────────────────────────────────────────
// The M87* photograph does NOT fill its frame — its bright ring spans only a
// fraction of the image. Displaying/reconstructing the ring at its TRUE angular
// size requires measuring that fraction from the data, never assuming it.
// (Moved here from tourScene.js so the LIVE APP and the tour share one truth;
// tourScene re-exports them.)

// Radial-profile peak: the bright-ring diameter as a fraction of the N×N field.
// Only meaningful for ring-like sources — callers should sanity-band the result.
export function measureRingFraction(gs, N) {
  const c = N / 2, maxR = Math.floor(N / 2) - 2;
  const sum = new Float64Array(maxR + 1), cnt = new Uint32Array(maxR + 1);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const r = Math.round(Math.hypot(x - c, y - c));
      if (r <= maxR) { sum[r] += gs[y * N + x]; cnt[r]++; }
    }
  }
  let peakR = 1;
  for (let r = 1; r <= maxR; r++) {
    if (cnt[r] && sum[r] / cnt[r] > sum[peakR] / (cnt[peakR] || 1)) peakR = r;
  }
  return (2 * peakR) / N;
}

// Center-crop zoom (factor ≥ 1), nearest-sample — the enlargement counterpart of
// scaleSource (which only shrinks). Returns the input unchanged for zoom ≤ 1.
export function zoomSource(gs, zoom, N) {
  if (!gs || zoom <= 1) return gs;
  const out = new Float64Array(N * N);
  const x0 = (N - N / zoom) / 2;
  for (let oy = 0; oy < N; oy++) {
    const sy = Math.max(0, Math.min(N - 1, Math.floor(x0 + oy / zoom)));
    for (let ox = 0; ox < N; ox++) {
      const sx = Math.max(0, Math.min(N - 1, Math.floor(x0 + ox / zoom)));
      out[oy * N + ox] = gs[sy * N + sx];
    }
  }
  return out;
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

// Angular resolution from the ACTUALLY-SAMPLED coverage (P1, Ilan delegated
// authority from A. Cárdenas-Avendaño, 2026-07-07): θ = λ/|uv|max of the computed
// tracks for the current target — consistent with the UV map and the tour's
// headline rule (the geometric array max is never shown as resolution; a pair
// that cannot co-observe the source contributes no |uv|). uvPointsGl is already
// in Gλ, so θ[μas] = 206.265/|uv|maxGl. One decimal below 100 μas so per-target
// values (24.7 / 23.6 / 26.7 …) stay distinguishable from the tour's rounded 25.
export function angularResFromUV(uvPointsGl) {
  if (!uvPointsGl || uvPointsGl.length === 0) return null;
  let maxGl = 0;
  for (const p of uvPointsGl) {
    const r = Math.hypot(p.u, p.v);
    if (r > maxGl) maxGl = r;
  }
  if (maxGl === 0) return null;
  const thetaMuas = 206.265 / maxGl;   // (206265e6 μas/rad) / (1e9 λ/Gλ)
  if (thetaMuas < 100)  return thetaMuas.toFixed(1) + ' μas';
  if (thetaMuas < 1000) return thetaMuas.toFixed(0) + ' μas';
  return (thetaMuas / 1000).toFixed(2) + ' mas';
}

// Default dish diameter (Alejandro note N5): the mean physical dish of the stations
// in an array preset (constants.DISH_DIAMETERS), rounded to 0.1 m. The EHT 2022 mean
// is the canonical fallback when the preset is unknown or carries no station with a
// known dish — the note's "no EHT stations present" default.
export function presetMeanDish(presetName) {
  const dishes = (ARRAY_PRESETS[presetName] || [])
    .map(s => DISH_DIAMETERS[s.name])
    .filter(Number.isFinite);
  if (dishes.length === 0) {
    // Recursion guard: if EHT 2022 itself ever lacked dish data, keep the historical 25 m.
    return presetName === 'EHT 2022' ? 25 : presetMeanDish('EHT 2022');
  }
  return Math.round(dishes.reduce((a, b) => a + b, 0) / dishes.length * 10) / 10;
}

// ── Source suitability: how much of an image an interferometer can recover ────────────
// An interferometer never samples the zero-spacing (total-power) baseline and samples
// only out to its longest baseline. These functions measure — from the real grayscale
// array, not from assumptions — what fraction of an image's power is unmeasurable smooth
// emission (DC), inside the array's sampled band, or finer than the beam. They drive an
// honest, computed notice when an upload is ill-suited (e.g. a logo on a white field).
// Separable radix-2 FFT; N is a power of two (IMAGE_SIZE = 512).
function fft1dInPlace(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { const tr = re[i]; re[i] = re[j]; re[j] = tr; const ti = im[i]; im[i] = im[j]; im[j] = ti; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cwr = 1, cwi = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const xr = re[b] * cwr - im[b] * cwi, xi = re[b] * cwi + im[b] * cwr;
        re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
        const nr = cwr * wr - cwi * wi; cwi = cwr * wi + cwi * wr; cwr = nr;
      }
    }
  }
}

const RAD_PER_UAS = Math.PI / (180 * 3600 * 1e6);   // radians per micro-arcsecond

// Radial power profile of the image (one FFT per source). profile[kr] = summed |FFT|² at
// integer radius kr; glPerBin converts an FFT radial index to a baseline in Gλ
// (u = kr / FOV[rad], 1 Gλ = 1e9 λ). Kept separate from the band split so telescope
// drags re-split cheaply without re-running the FFT.
export function computeSourceRadialPower(grayscale, N = IMAGE_SIZE, fovMuas = 80) {
  if (!grayscale) return null;
  const re = new Float64Array(N * N), im = new Float64Array(N * N);
  for (let i = 0; i < N * N; i++) re[i] = grayscale[i];
  const rr = new Float64Array(N), ri = new Float64Array(N);
  for (let y = 0; y < N; y++) {
    const o = y * N;
    for (let x = 0; x < N; x++) { rr[x] = re[o + x]; ri[x] = im[o + x]; }
    fft1dInPlace(rr, ri);
    for (let x = 0; x < N; x++) { re[o + x] = rr[x]; im[o + x] = ri[x]; }
  }
  const cr = new Float64Array(N), ci = new Float64Array(N);
  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) { cr[y] = re[y * N + x]; ci[y] = im[y * N + x]; }
    fft1dInPlace(cr, ci);
    for (let y = 0; y < N; y++) { re[y * N + x] = cr[y]; im[y * N + x] = ci[y]; }
  }
  const maxR = Math.ceil(Math.SQRT2 * (N / 2)) + 1;
  const profile = new Float64Array(maxR);
  let total = 0;
  for (let ky = 0; ky < N; ky++) {
    const fy = ky < N / 2 ? ky : ky - N;
    for (let kx = 0; kx < N; kx++) {
      const fx = kx < N / 2 ? kx : kx - N;
      const P = re[ky * N + kx] ** 2 + im[ky * N + kx] ** 2;
      total += P;
      profile[Math.min(maxR - 1, Math.round(Math.hypot(fx, fy)))] += P;
    }
  }
  return { profile, total, glPerBin: (1 / (fovMuas * RAD_PER_UAS)) / 1e9 };
}

// Physically-motivated triggers (not tuned magic numbers): the notice fires only when
// the MAJORITY of the image's power is the single unsampled zero-spacing mode, or when
// almost none of its power lands in the array's sampled band — conditions a normal
// compact source never meets (the black-hole ring measures 26% DC / ~40% sampled).
const DC_DOMINANT = 0.5;      // >50% of power is unmeasurable total-power flux
const LOW_MEASURABLE = 0.10;  // <10% of power is inside the sampled band
export function assessSourceSuitability(radial, uMaxGl, fovMuas = 80) {
  if (!radial || !radial.total || uMaxGl <= 0) return null;
  const { profile, total, glPerBin } = radial;
  const krMax = uMaxGl / glPerBin;
  let sampled = 0, beyond = 0;
  for (let kr = 1; kr < profile.length; kr++) {
    if (kr <= krMax) sampled += profile[kr]; else beyond += profile[kr];
  }
  const dcFrac = profile[0] / total, sampledFrac = sampled / total, beyondFrac = beyond / total;
  const angResUas = 206.265 / uMaxGl;              // λ/B_max in μas (206265e6/1e9)
  const resElements = fovMuas / angResUas;
  return {
    dcFrac, sampledFrac, beyondFrac,
    dcPct: Math.round(dcFrac * 100),
    measurablePct: sampledFrac < 0.01 ? +(sampledFrac * 100).toFixed(1) : Math.round(sampledFrac * 100),
    resElements: Math.max(1, Math.round(resElements)),
    beamUas: +angResUas.toFixed(1),
    poor: dcFrac > DC_DOMINANT || sampledFrac < LOW_MEASURABLE,
  };
}
