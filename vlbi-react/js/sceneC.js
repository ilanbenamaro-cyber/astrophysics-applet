// sceneC.js — ACT C: From Data to Image (the real deconvolution pipeline).
// Staged as a left→right CAUSAL story in three live panels, all engine output:
//   [SPARSE DATA]  real (u,v) coverage (computeUVPointsGl) — the few threads we have
//        │ FFT⁻¹
//   [DIRTY IMAGE]  the actual inverse transform of that coverage (runReconstruction)
//        │ CLEAN
//   [RESTORED]     Högbom CLEAN's ring, emerging over the dirty image, with the live
//                  residual sparkline (real worker progress messages) beneath it.
// CLEAN ≈ 100 ms at N=512 (audit §2) so it recomputes LIVE in both modes.
// Guided: a labeled THERMAL NOISE slider under the dirty panel (hit-tested to the
// track — no whole-panel drag); CLEAN recomputes on release, old canvases held so
// nothing flickers (never-stall: hard timeout falls back to cache). Numbers via
// tourPhysics; the ring is sized to its true 42 μas by measureRingFraction (W1.3).
import { computeUVPoints, computeUVPointsGl } from './uvCompute.js';
import { runReconstruction, buildSefdMap, computeDynamicRange, scaleSource } from './simCore.js';
import { loadImagePresetAsync } from './presets.js';
import { STATION_SEFD } from './constants.js';
import { TOUR_PHYSICS as P } from './tourPhysics.js';
import { TOKENS } from './tourTokens.js';
import { drawHot } from './simRender.js';
import { clearScene, beatT, ease, clamp01, hexA, toTelescopes,
         measureRingFraction, zoomSource, drawUVAxes, uvExtentGl } from './tourScene.js';
import { ensureGalaxy, drawGalaxy } from './tourGalaxy.js';
import { drawResidualSparkline, drawUVPoints, roundRect } from './tourAnnotations.js';

const N = 512;
const RECOMPUTE_TIMEOUT_MS = 2500;
// Slider range 0…0.25× visibility RMS, measured against this act's 42 μas source:
// the ring survives to ~0.15 and dissolves by 0.25 (CLEAN's 3σ floor rises above the
// peak — it finds nothing). The breakdown IS the lesson, so the range ends exactly
// where the engine says the image is noise-limited; the sparkline names that state.
const NOISE_MAX = 0.25;
const mono = (px, w = 500) => `${w} ${px}px ${TOKENS.fontMono}`;

function render512(draw) {
  const c = document.createElement('canvas');
  c.width = N; c.height = N;
  draw(c.getContext('2d'));
  return c;
}

// Run one CLEAN, collecting real progress, and rebuild the cached canvases on `data`.
// Both panels render with the same hot colormap Act D uses — one image, before/after.
async function recomputeCLEAN(data) {
  const series = [];
  const r = await runReconstruction(
    data.srcMaster.slice(),
    data.uvLite,
    // progressEvery 1: CLEAN on the true-size ring stops in ~10 iters (the 3σ floor
    // rises with the brighter dirty border); coarser sampling would starve the sparkline.
    { N, noise: data.noise, method: 'clean', dishDiameter: 25, frequency: data.freqGHz,
      fovRad: data.fovRad, stationPairs: data.stationPairs, sefdMap: data.sefdMap, progressEvery: 1 },
    (p) => series.push({ iter: p.iter, residual: p.residual }),
  );
  data.dirtyCanvas    = render512(ctx => drawHot(ctx, r.dirty, N));
  data.restoredCanvas = render512(ctx => drawHot(ctx, r.restored, N));
  data.series = series.length ? series : [{ iter: 0, residual: 1 }];
  data.dynamicRange = computeDynamicRange(r.restored, N);
  data.computedNoise = data.noise;
  return data;
}

export const sceneC = {
  async init(engineState) {
    const tels = toTelescopes(engineState.stations);
    const { params } = engineState;
    const { uvPoints, stationPairs } = computeUVPoints(tels, {
      declination: params.decDeg, duration: params.durationHr, frequency: params.freqGHz,
      fovMuas: params.fovMuas, N,
    });
    const uvGl = computeUVPointsGl(tels, {
      declination: params.decDeg, duration: params.durationHr, frequency: params.freqGHz,
    });
    const { grayscale } = await loadImagePresetAsync(engineState.params.photo || '../assets/black-hole.png');
    // Size the source so its measured bright ring spans the TRUE shadow diameter
    // (42 μas) of the act's FOV — computed, never assumed (W1.3).
    const ringFrac = measureRingFraction(grayscale, N);
    const sizeFactor = (P.m87ShadowUas / params.fovMuas) / ringFrac;
    const srcMaster = sizeFactor >= 1
      ? zoomSource(grayscale, sizeFactor, N)
      : scaleSource(grayscale, sizeFactor, N);

    const data = {
      tels, srcMaster, uvGl, maxGl: uvExtentGl(uvGl),
      uvLite: uvPoints.map(p => ({ u: p.u, v: p.v })),
      nSamples: uvPoints.length,
      stationPairs, sefdMap: buildSefdMap(tels, STATION_SEFD),
      freqGHz: params.freqGHz, fovRad: params.fovMuas * (Math.PI / (180 * 3.6e9)),
      noise: 0, computedNoise: 0, _recomputing: false, _recomputeToken: 0,
      _layout: null,
    };
    await recomputeCLEAN(data);   // first CLEAN before the act shows (computation-complete)
    return data;
  },

  drawFrame(ctx, frame, data) {
    const { w, h, T, reducedMotion, mode } = frame;
    clearScene(ctx, w, h);
    drawGalaxy(ctx, ensureGalaxy(data, w, h, { seed: 5, intensity: 0.45 }), reducedMotion ? 0 : T);

    // Three-panel pipeline layout
    const S = Math.min(h * 0.52, w * 0.21);
    const G = S * 0.26;
    const x0 = (w - (3 * S + 2 * G)) / 2;
    const py = h * 0.40 - S / 2;
    const cyP = py + S / 2;
    const xs = [x0, x0 + S + G, x0 + 2 * (S + G)];

    // Noise slider geometry (under the dirty panel) — stored for onPointer hit-tests
    const slider = {
      x: xs[1] + S * 0.08, y: py + S + 56, w: S * 0.84,
    };
    data._layout = { xs, py, S, w, h, slider };

    const b1 = reducedMotion ? 1 : beatT(T, 0.2, 1.8);   // sparse coverage
    const b2 = reducedMotion ? 1 : beatT(T, 2.2, 1.8);   // FFT⁻¹ → dirty
    const b3 = reducedMotion ? 1 : beatT(T, 4.6, 3.4);   // CLEAN → ring + sparkline

    // ── Panel 1: the sparse (u,v) data ──
    ctx.save();
    ctx.globalAlpha = ease(b1);
    const mapUV = drawUVAxes(ctx, xs[0], py, S, data.maxGl, { label: 'u, v (Gλ)' });
    drawUVPoints(ctx, mapUV, data.uvGl, b1, { radius: 0.9 });
    panelCaption(ctx, xs[0], py, S, 'SPARSE DATA',
      `${data.nSamples.toLocaleString('en-US')} samples · ${P.str.uvFill} of the plane`);
    ctx.restore();

    // ── Arrow 1 + Panel 2: the dirty image ──
    if (b2 > 0) {
      ctx.save();
      ctx.globalAlpha = ease(b2);
      stageArrow(ctx, xs[0] + S, xs[1], cyP, 'FFT⁻¹');
      panelFrame(ctx, xs[1], py, S);
      ctx.save();
      roundRect(ctx, xs[1], py, S, S, 4); ctx.clip();
      ctx.drawImage(data.dirtyCanvas, xs[1], py, S, S);
      ctx.restore();
      panelCaption(ctx, xs[1], py, S, 'DIRTY IMAGE', 'I_D = I_sky ⊛ B_D');
      ctx.restore();
    }

    // ── Arrow 2 + Panel 3: CLEAN's ring emerging over the dirty base ──
    if (b3 > 0) {
      ctx.save();
      ctx.globalAlpha = ease(b3);
      stageArrow(ctx, xs[1] + S, xs[2], cyP, 'CLEAN');
      panelFrame(ctx, xs[2], py, S);
      ctx.save();
      roundRect(ctx, xs[2], py, S, S, 4); ctx.clip();
      ctx.drawImage(data.dirtyCanvas, xs[2], py, S, S);
      ctx.globalAlpha = ease(b3) * ease(clamp01(b3 * 1.4));
      ctx.drawImage(data.restoredCanvas, xs[2], py, S, S);
      ctx.restore();
      const drTxt = !isFinite(data.dynamicRange) ? '>1000' : data.dynamicRange.toFixed(0);
      panelCaption(ctx, xs[2], py, S, 'RESTORED (CLEAN)',
        b3 > 0.6 ? `DR ${drTxt}:1` : '…');
      ctx.restore();

      // Live residual sparkline (real worker progress), revealed across beat 3
      const revealN = reducedMotion ? data.series.length
        : Math.max(2, Math.floor(data.series.length * clamp01(b3 + 0.05)));
      drawResidualSparkline(ctx, xs[2], py + S + 46, S, 62, data.series.slice(0, revealN));
      ctx.save();
      ctx.globalAlpha = ease(b3);
      ctx.fillStyle = hexA(TOKENS.textSecondary, 0.85);
      ctx.font = mono(10, 500); ctx.textAlign = 'center';
      ctx.fillText('peak → subtract γ·B_D → repeat · stop at 3σ', xs[2] + S / 2, py + S + 124);
      ctx.restore();
    }

    // ── Thermal-noise slider (guided): a real control, not an invisible drag ──
    if (mode === 'guided') {
      drawNoiseSlider(ctx, slider, data, reducedMotion ? 0 : T);
    }
  },

  onPointer(data, { type, nx, ny, mode }) {
    if (mode !== 'guided' || !data._layout) return;
    const { slider, w, h } = data._layout;
    const x = nx * w, y = ny * h;
    const onTrack = x >= slider.x - 10 && x <= slider.x + slider.w + 10 &&
                    y >= slider.y - 18 && y <= slider.y + 18;
    if (type === 'down' && onTrack) data._dragging = true;
    if ((type === 'move' && data._dragging) || (type === 'down' && onTrack)) {
      const fx = clamp01((x - slider.x) / slider.w);
      data.noise = +(fx * NOISE_MAX).toFixed(2);
    }
    if (type === 'up' || type === 'leave') {
      if (data._dragging && data.noise !== data.computedNoise) scheduleRecompute(data);
      data._dragging = false;
    }
  },
};

function panelFrame(ctx, x, y, s) {
  ctx.save();
  ctx.fillStyle = hexA(TOKENS.bg0, 0.6);
  ctx.strokeStyle = hexA(TOKENS.border, 1);
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, s, s, 4); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function panelCaption(ctx, x, y, s, label, value) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = TOKENS.textSecondary; ctx.font = mono(10, 600);
  ctx.fillText(label, x + s / 2, y + s + 16);
  ctx.fillStyle = TOKENS.accent; ctx.font = mono(11, 600);
  ctx.fillText(value, x + s / 2, y + s + 32);
  ctx.restore();
}

// A labeled stage arrow between two panels: ──label──▶
function stageArrow(ctx, xFrom, xTo, cy, label) {
  ctx.save();
  ctx.strokeStyle = hexA(TOKENS.accent, 0.8);
  ctx.fillStyle = TOKENS.accent;
  ctx.lineWidth = 1.4;
  const a = xFrom + 8, b = xTo - 8;
  ctx.beginPath();
  ctx.moveTo(a, cy); ctx.lineTo(b - 7, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(b, cy); ctx.lineTo(b - 8, cy - 4.5); ctx.lineTo(b - 8, cy + 4.5);
  ctx.closePath(); ctx.fill();
  ctx.font = mono(11, 600); ctx.textAlign = 'center';
  ctx.fillText(label, (a + b) / 2, cy - 9);
  ctx.restore();
}

// The thermal-noise control: track + fill + handle + label; a small spinner while
// CLEAN reruns (old canvases stay up — no flicker).
function drawNoiseSlider(ctx, slider, data, T) {
  const { x, y, w } = slider;
  const f = data.noise / NOISE_MAX;
  ctx.save();
  // label + value
  ctx.font = mono(10, 600);
  ctx.fillStyle = TOKENS.textSecondary;
  ctx.textAlign = 'left';
  ctx.fillText('THERMAL NOISE — drag', x, y - 12);
  ctx.textAlign = 'right';
  ctx.fillStyle = data.noise > 0 ? TOKENS.accent : TOKENS.textSecondary;
  ctx.fillText(`× ${data.noise.toFixed(2)}`, x + w, y - 12);
  // track
  ctx.strokeStyle = hexA(TOKENS.border, 1);
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
  // fill
  ctx.strokeStyle = TOKENS.accent;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w * f, y); ctx.stroke();
  // handle
  ctx.fillStyle = TOKENS.accent;
  ctx.beginPath(); ctx.arc(x + w * f, y, 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = hexA(TOKENS.bg0, 0.9);
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x + w * f, y, 5.5, 0, Math.PI * 2); ctx.stroke();
  // recompute spinner (right of the value)
  if (data._recomputing) {
    const sx = x + w + 18, r = 5;
    ctx.strokeStyle = TOKENS.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, y - 16, r, T * 6, T * 6 + Math.PI * 1.4);
    ctx.stroke();
  }
  ctx.restore();
}

function scheduleRecompute(data) {
  const token = ++data._recomputeToken;
  data._recomputing = true;
  let settled = false;
  const finish = () => { if (token === data._recomputeToken) data._recomputing = false; };
  // Never-stall (G5): if the worker hangs past the timeout, drop the spinner and keep cache.
  const timeout = setTimeout(() => { if (!settled) finish(); }, RECOMPUTE_TIMEOUT_MS);
  recomputeCLEAN(data).then(() => { settled = true; clearTimeout(timeout); finish(); })
                      .catch(() => { settled = true; clearTimeout(timeout); finish(); });
}
