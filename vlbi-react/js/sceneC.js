// sceneC.js — ACT C: From Data to Image (the real deconvolution pipeline).
// Staged as a left→right CAUSAL story in three live panels, all engine output:
//   [SPARSE DATA]  real (u,v) coverage (computeUVPointsGl) — the few threads we have
//        │ FFT⁻¹
//   [DIRTY IMAGE]  the actual inverse transform of that coverage (runReconstruction)
//        │ CLEAN
//   [RESTORED]     Högbom CLEAN's recovered ring (model⊛beam + residual).
// CLEAN ≈ 100 ms at N=512 (audit §2). Guided: THREE thermal-noise PRESETS (segmented
// buttons under the dirty panel) replace the old slider+residual-graph. WHY (diagnosis,
// SITE-AUDIT 2026-06-16): vanilla Högbom with the worker's 3σ-border stop barely runs on
// EHT-sparse coverage of a ring (~12 components even at noise 0 — the dirty image's
// sidelobe border sets a high stop floor), so the restored image is dominated by
// dirty+residual and the per-iteration component count is erratic (and 0 across much of
// the old 0–0.25× range). Surfacing that count (and a DR readout that saturates at the
// 100 fallback) made a working-but-modest reconstruction look broken. The restored IMAGE,
// however, degrades gracefully with noise. So: present three engine-chosen σ levels at
// which the ring is recognizable and degrades visibly; recompute each via the real engine
// (own worker), render with drawHot. Worker untouched (3σ stop is CASA-standard). Numbers
// via tourPhysics; ring sized to its true 42 μas by measureRingFraction (W1.3).
import { computeUVPoints, computeUVPointsGl } from './uvCompute.js';
import { runReconstruction, buildSefdMap, scaleSource } from './simCore.js';
import { loadImagePresetAsync } from './presets.js';
import { STATION_SEFD } from './constants.js';
import { TOUR_PHYSICS as P } from './tourPhysics.js';
import { TOKENS } from './tourTokens.js';
import { drawHot } from './simRender.js';
import { clearScene, beatT, ease, clamp01, hexA, toTelescopes,
         measureRingFraction, zoomSource, drawUVAxes, uvExtentGl } from './tourScene.js';
import { ensureGalaxy, drawGalaxy } from './tourGalaxy.js';
import { drawUVPoints, roundRect } from './tourAnnotations.js';

const N = 512;
const RECOMPUTE_TIMEOUT_MS = 2500;
// Three thermal-noise presets in units of the engine's own visibility RMS (the worker
// scales injected σ by visRms). Chosen from the 2026-06-16 engine probe: each level
// still yields a recognizable ring that degrades visibly; none lands in the
// zero-component regime that made the old slider look dead. Default = 0 (cleanest).
const PRESET_NOISE  = [0, 0.015, 0.03];
const PRESET_LABELS = ['0 σ', '0.015 σ', '0.03 σ'];
const mono = (px, w = 500) => `${w} ${px}px ${TOKENS.fontMono}`;

function render512(draw) {
  const c = document.createElement('canvas');
  c.width = N; c.height = N;
  draw(c.getContext('2d'));
  return c;
}

// Run one CLEAN at the given preset's noise; cache its dirty+restored canvases on
// data.cache[idx]. Same hot colormap as Act D. No progress/series — the (erratic)
// component count is deliberately not surfaced.
async function computePreset(data, idx) {
  const r = await runReconstruction(
    data.srcMaster.slice(),
    data.uvLite,
    { N, noise: PRESET_NOISE[idx], method: 'clean', dishDiameter: 25, frequency: data.freqGHz,
      fovRad: data.fovRad, stationPairs: data.stationPairs, sefdMap: data.sefdMap },
  );
  data.cache[idx] = {
    dirtyCanvas:    render512(ctx => drawHot(ctx, r.dirty, N)),
    restoredCanvas: render512(ctx => drawHot(ctx, r.restored, N)),
  };
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
      preset: 0, cache: {}, _recomputing: false, _recomputeToken: 0,
      _layout: null,
    };
    await computePreset(data, 0);   // open on the cleanest preset (computation-complete)
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

    // Preset-control geometry (under the dirty panel) — stored for onPointer hit-tests
    const presetBar = { x: xs[1] + S * 0.08, y: py + S + 52, w: S * 0.84 };
    data._layout = { xs, py, S, w, h, presetBar };

    // Hold the last good canvases while a freshly-selected preset is still computing,
    // so nothing flickers or blanks (init always seeds cache[0]).
    const cur = data.cache[data.preset];
    if (cur) data._shown = cur;
    const shown = cur || data._shown;

    const b1 = reducedMotion ? 1 : beatT(T, 0.2, 1.8);   // sparse coverage
    const b2 = reducedMotion ? 1 : beatT(T, 2.2, 1.8);   // FFT⁻¹ → dirty
    const b3 = reducedMotion ? 1 : beatT(T, 4.6, 3.4);   // CLEAN → restored ring

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
      ctx.drawImage(shown.dirtyCanvas, xs[1], py, S, S);
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
      ctx.drawImage(shown.dirtyCanvas, xs[2], py, S, S);
      ctx.globalAlpha = ease(b3) * ease(clamp01(b3 * 1.4));
      ctx.drawImage(shown.restoredCanvas, xs[2], py, S, S);
      ctx.restore();
      panelCaption(ctx, xs[2], py, S, 'RESTORED (CLEAN)', b3 > 0.6 ? '' : '…');
      ctx.restore();

      // One honest line describing what CLEAN does (no sparkline/graph).
      ctx.save();
      ctx.globalAlpha = ease(b3);
      ctx.fillStyle = hexA(TOKENS.textSecondary, 0.85);
      ctx.font = mono(10, 500); ctx.textAlign = 'center';
      ctx.fillText('peak → subtract γ·B_D → repeat · stop at 3σ', xs[2] + S / 2, py + S + 30);
      ctx.restore();
    }

    // ── Thermal-noise PRESETS (guided): three engine-honest σ levels; the returned
    // hit rects are what onPointer tests against. Default opens on the cleanest. ──
    if (mode === 'guided') {
      data._layout.presetHits = drawPresets(ctx, presetBar, data, reducedMotion ? 0 : T);
    }
  },

  // Click a preset segment → select it; compute on first selection (cached after).
  onPointer(data, { type, nx, ny, mode }) {
    if (mode !== 'guided' || type !== 'down' || !data._layout) return;
    const hits = data._layout.presetHits;
    if (!hits) return;
    const x = nx * data._layout.w, y = ny * data._layout.h;
    for (let i = 0; i < hits.length; i++) {
      const r = hits[i];
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        if (i !== data.preset || !data.cache[i]) {
          data.preset = i;
          if (!data.cache[i]) selectPreset(data, i);   // engine recompute (cached after)
        }
        break;
      }
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

// Three thermal-noise presets as a labeled segmented control (THERMAL NOISE, under
// the dirty panel). Active segment in gold; a small spinner shows while the chosen
// preset's CLEAN computes (held canvases stay up — no flicker). Each segment is
// labeled by its real σ (× visibility RMS). Returns one hit rect per segment.
function drawPresets(ctx, bar, data, T) {
  const { x, y, w } = bar;
  const n = PRESET_NOISE.length;
  const gap = 6;
  const segW = (w - gap * (n - 1)) / n;
  const segH = 22;
  ctx.save();
  ctx.font = mono(10, 600); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = TOKENS.textSecondary;
  ctx.fillText('THERMAL NOISE', x, y - 8);
  const hits = [];
  for (let i = 0; i < n; i++) {
    const sx = x + i * (segW + gap);
    const on = i === data.preset;
    roundRect(ctx, sx, y, segW, segH, 4);
    ctx.fillStyle = on ? hexA(TOKENS.accent, 0.18) : hexA(TOKENS.bg0, 0.6);
    ctx.fill();
    ctx.strokeStyle = on ? TOKENS.accent : hexA(TOKENS.border, 1);
    ctx.lineWidth = on ? 1.5 : 1;
    ctx.stroke();
    ctx.fillStyle = on ? TOKENS.accent : TOKENS.textSecondary;
    ctx.font = mono(11, on ? 600 : 500); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(PRESET_LABELS[i], sx + segW / 2, y + segH / 2 + 0.5);
    hits.push({ x: sx, y, w: segW, h: segH });
  }
  // spinner while the selected preset is still computing
  if (data._recomputing) {
    ctx.strokeStyle = TOKENS.accent; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + w + 16, y + segH / 2, 5, T * 6, T * 6 + Math.PI * 1.4);
    ctx.stroke();
  }
  // unit note
  ctx.fillStyle = hexA(TOKENS.textSecondary, 0.7);
  ctx.font = mono(9, 500); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('× visibility RMS', x, y + segH + 13);
  ctx.restore();
  return hits;
}

// Compute the selected preset via the real engine (own worker), caching the result.
// Never-stall (G5): if the worker hangs past the timeout, drop the spinner; the held
// canvases stay up. A later re-select recomputes (cache still empty).
function selectPreset(data, idx) {
  const token = ++data._recomputeToken;
  data._recomputing = true;
  let settled = false;
  const finish = () => { if (token === data._recomputeToken) data._recomputing = false; };
  const timeout = setTimeout(() => { if (!settled) finish(); }, RECOMPUTE_TIMEOUT_MS);
  computePreset(data, idx).then(() => { settled = true; clearTimeout(timeout); finish(); })
                          .catch(() => { settled = true; clearTimeout(timeout); finish(); });
}
