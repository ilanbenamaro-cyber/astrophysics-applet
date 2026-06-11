// sceneC.js — ACT C: From Data to Image (the real deconvolution pipeline).
// Architecture per the Phase-0 timing gate: CLEAN ≈ 98 ms at N=512 (audit §2), so it
// recomputes LIVE in both modes. Choreography over REAL engine output:
//   beat 1 — ConvolutionReveal: the real source with the dirty beam B_D swept across it
//   beat 2 — the real dirty image (runReconstruction) appears, riddled with sidelobes
//   beat 3 — CLEAN runs: the live residual sparkline (worker progress messages) fills as
//            the dirty image crossfades to the restored ContourMap render
// Guided: drag the image left↔right to set thermal noise; CLEAN recomputes on release
// (never-stall: a hard timeout falls back to the cached frame). Equation/labels via KaTeX
// in the panel; numbers via tourPhysics.
import { computeUVPoints } from './uvCompute.js';
import { runReconstruction, buildSefdMap, computeDynamicRange, scaleSource } from './simCore.js';
import { loadImagePresetAsync } from './presets.js';
import { STATION_SEFD } from './constants.js';
import { TOUR_PHYSICS as P } from './tourPhysics.js';
import { TOKENS } from './tourTokens.js';
import { drawContour, drawHot } from './simRender.js';
import { clearScene, beatT, ease, clamp01, hexA, toTelescopes,
         measureRingFraction, zoomSource } from './tourScene.js';
import { ensureGalaxy, drawGalaxy } from './tourGalaxy.js';
import { drawConvolutionReveal, drawResidualSparkline, roundRect } from './tourAnnotations.js';

const N = 512;
const RECOMPUTE_TIMEOUT_MS = 2500;
const mono = (px, w = 500) => `${w} ${px}px ${TOKENS.fontMono}`;

function render512(draw) {
  const c = document.createElement('canvas');
  c.width = N; c.height = N;
  draw(c.getContext('2d'));
  return c;
}

// Run one CLEAN, collecting real progress, and rebuild the cached canvases on `data`.
async function recomputeCLEAN(data) {
  const series = [];
  const r = await runReconstruction(
    data.srcMaster.slice(),
    data.uvLite,
    // progressEvery 1: CLEAN on the true-size ring stops well before iter 20 (the 3σ
    // floor rises with the brighter dirty border), so coarser sampling starves the
    // residual sparkline. Per-iteration messages are still only ~10-100 posts.
    { N, noise: data.noise, method: 'clean', dishDiameter: 25, frequency: data.freqGHz,
      fovRad: data.fovRad, stationPairs: data.stationPairs, sefdMap: data.sefdMap, progressEvery: 1 },
    (p) => series.push({ iter: p.iter, residual: p.residual }),
  );
  const dr = computeDynamicRange(r.restored, N);
  data.dirtyCanvas    = render512(ctx => drawContour(ctx, r.dirty, { N, beamSigmaU: r.beamSigmaU, beamSigmaV: r.beamSigmaV, beamPA: 0, dynamicRange: 0 }));
  // Restored panel renders with the SAME hot colormap Act D uses (W1.3): viridis on a
  // low-DR reconstruction buries the ring; drawHot makes the payoff unmistakable.
  data.restoredCanvas = render512(ctx => drawHot(ctx, r.restored, N));
  data.series = series.length ? series : [{ iter: 0, residual: 1 }];
  data.dynamicRange = dr;
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
    const { grayscale } = await loadImagePresetAsync(engineState.params.photo || '../assets/black-hole.png');
    // Size the source so its measured bright ring spans the TRUE shadow diameter
    // (42 μas) of the act's FOV — computed, never assumed (W1.3: the previous fixed
    // fraction assumed the ring filled the photograph and under-sized it ~2.3×,
    // leaving it barely 2 restore beams across — a blob, not a ring).
    const ringFrac = measureRingFraction(grayscale, N);
    const sizeFactor = (P.m87ShadowUas / params.fovMuas) / ringFrac;
    const srcMaster = sizeFactor >= 1
      ? zoomSource(grayscale, sizeFactor, N)
      : scaleSource(grayscale, sizeFactor, N);

    const data = {
      tels, srcMaster,
      uvLite: uvPoints.map(p => ({ u: p.u, v: p.v })),
      stationPairs, sefdMap: buildSefdMap(tels, STATION_SEFD),
      freqGHz: params.freqGHz, fovRad: params.fovMuas * (Math.PI / (180 * 3.6e9)),
      noise: 0, _recomputing: false, _recomputeToken: 0,
      sourceCanvas: render512(ctx => drawHot(ctx, srcMaster, N)),
      _layout: null,
    };
    await recomputeCLEAN(data);   // first CLEAN before the act shows (computation-complete)
    return data;
  },

  drawFrame(ctx, frame, data) {
    const { w, h, T, reducedMotion, mode } = frame;
    clearScene(ctx, w, h);
    drawGalaxy(ctx, ensureGalaxy(data, w, h, { seed: 5, intensity: 0.45 }), reducedMotion ? 0 : T);

    const panel = Math.min(h * 0.66, w * 0.40);
    const ix = w * 0.30 - panel / 2, iy = (h - panel) * 0.42;
    const spX = w * 0.56, spW = w * 0.36, spY = iy + panel * 0.12, spH = panel * 0.5;
    data._layout = { ix, iy, panel, w, h };

    const b1 = reducedMotion ? 1 : beatT(T, 0.2, 2.3);   // convolution reveal
    const b2 = reducedMotion ? 1 : beatT(T, 2.6, 2.0);   // dirty image
    const b3 = reducedMotion ? 1 : beatT(T, 5.0, 4.0);   // CLEAN convergence + restore

    // image panel frame
    ctx.save();
    ctx.fillStyle = hexA(TOKENS.bg0, 0.6);
    ctx.strokeStyle = hexA(TOKENS.border, 1);
    ctx.lineWidth = 1;
    roundRect(ctx, ix, iy, panel, panel, 4); ctx.fill(); ctx.stroke();
    ctx.restore();

    ctx.save();
    roundRect(ctx, ix, iy, panel, panel, 4); ctx.clip();
    if (b3 <= 0 && b2 <= 0) {
      // beat 1: convolution reveal (real source + swept beam)
      drawConvolutionReveal(ctx, { x: ix, y: iy, w: panel, h: panel }, data.sourceCanvas, null, b1);
    } else {
      // dirty fades in, then crossfades to restored as CLEAN converges
      ctx.globalAlpha = 1;
      ctx.drawImage(data.dirtyCanvas, ix, iy, panel, panel);
      if (b3 > 0) {
        ctx.globalAlpha = ease(clamp01(b3));
        ctx.drawImage(data.restoredCanvas, ix, iy, panel, panel);
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();

    // image caption
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = TOKENS.textSecondary; ctx.font = mono(10, 600);
    const cap = b3 > 0.5 ? 'RESTORED (CLEAN)' : b2 > 0 ? 'DIRTY IMAGE' : 'I_sky ⊛ B_D';
    ctx.fillText(cap, ix + panel / 2, iy + panel + 16);
    if (b3 > 0.5) {
      ctx.fillStyle = TOKENS.accent; ctx.font = mono(11, 600);
      ctx.fillText(`DR ${!isFinite(data.dynamicRange) ? '>1000' : data.dynamicRange.toFixed(0)}:1`, ix + panel / 2, iy + panel + 32);
    }
    ctx.restore();

    // residual sparkline (real worker progress), revealed across beat 3
    if (b2 > 0.2) {
      const revealN = reducedMotion ? data.series.length
        : Math.max(2, Math.floor(data.series.length * clamp01(b3 + 0.05)));
      drawResidualSparkline(ctx, spX, spY, spW, spH, data.series.slice(0, revealN));
      // CLEAN update rule label under the sparkline
      ctx.save();
      ctx.fillStyle = TOKENS.textSecondary; ctx.font = mono(11, 500); ctx.textAlign = 'left';
      ctx.fillText('peak found → subtract γ·B_D → repeat', spX, spY + spH + 22);
      ctx.fillText('stop at 3σ noise floor', spX, spY + spH + 40);
      ctx.restore();
    }

    // guided affordance + recompute state
    if (mode === 'guided' && !reducedMotion) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = hexA(TOKENS.textSecondary, 0.8); ctx.font = mono(11, 500);
      ctx.fillText('drag ↔ thermal noise', ix + panel / 2, iy - 10);
      if (data._recomputing) {
        ctx.fillStyle = TOKENS.accent;
        ctx.fillText('recomputing…', ix + panel / 2, iy + panel / 2);
      } else if (data.noise > 0) {
        ctx.fillStyle = TOKENS.accent; ctx.font = mono(10, 600);
        ctx.fillText(`noise ×${data.noise.toFixed(2)}`, ix + panel / 2, iy - 24);
      }
      ctx.restore();
    }
  },

  onPointer(data, { type, nx, ny, mode }) {
    if (mode !== 'guided' || !data._layout) return;
    if (type === 'down') data._dragging = true;
    if (type === 'up' || type === 'leave') {
      if (data._dragging && type === 'up') scheduleRecompute(data);
      data._dragging = false;
    }
    if ((type === 'move' && data._dragging) || type === 'down') {
      const { ix, panel, w } = data._layout;
      const fx = clamp01((nx * w - ix) / panel);
      data.noise = +(fx * 3).toFixed(2);   // 0 … 3 × visibility RMS
    }
  },
};

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
