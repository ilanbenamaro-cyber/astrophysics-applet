// tourScenes.js — per-act scene registry. Each scene is:
//   { init(engineState) -> Promise<engineData>, drawFrame(ctx, frame, engineData),
//     interactive? }   where frame = { w, h, T, animPhase, mode, reducedMotion, beat }
// The host (Tour.js) looks up SCENES[actId]; acts without a bespoke scene fall back to
// genericScene, which still renders REAL coverage (never a fake). Phase 2 fills SCENES.
import { computeUVPointsGl, computeUVFill, computeUVPoints } from './uvCompute.js';
import { TELESCOPE_COLORS } from './constants.js';
import { setupCanvas, clearScene, makeStars, drawStarfield, drawUVAxes, beatT } from './tourScene.js';
import { drawUVPoints, drawFillGauge } from './tourAnnotations.js';
import { TOKENS } from './tourTokens.js';

// Turn an ARRAY_PRESETS station list into the {id,name,lat,lon,color,visible} shape the
// engine expects (same mapping useSimulation.loadEHTPresets uses).
export function toTelescopes(stations, satellite) {
  const tels = stations.map((s, idx) => ({
    id: idx, name: s.name, lat: s.lat, lon: s.lon,
    color: TELESCOPE_COLORS[idx % TELESCOPE_COLORS.length], visible: true,
  }));
  if (satellite) tels.push({ id: tels.length, ...satellite, visible: true });
  return tels;
}

// Max |u|,|v| extent (Gλ) × 1.2, matching the app's UV auto-scale intent.
export function uvExtentGl(pts) {
  let m = 0;
  for (const p of pts) { m = Math.max(m, Math.abs(p.u), Math.abs(p.v)); }
  return (m || 1) * 1.2;
}

// ── Generic real scene (fallback) ───────────────────────────────────────────────
const genericScene = {
  async init(engineState) {
    const tels = toTelescopes(engineState.stations, engineState.satellite);
    const { params } = engineState;
    const uvGl = computeUVPointsGl(tels, {
      declination: params.decDeg, duration: params.durationHr, frequency: params.freqGHz,
    });
    const uvPx = computeUVPoints(tels, {
      declination: params.decDeg, duration: params.durationHr, frequency: params.freqGHz,
      fovMuas: params.fovMuas, N: 512,
    }).uvPoints;
    return { tels, uvGl, maxGl: uvExtentGl(uvGl), fillPct: computeUVFill(uvPx, 512) };
  },
  drawFrame(ctx, frame, data) {
    const { w, h, T, reducedMotion } = frame;
    if (!frame._stars) frame._stars = makeStars(110, w, h, 7);
    clearScene(ctx, w, h);
    drawStarfield(ctx, frame._stars, reducedMotion ? 0 : T, 0.7);
    const size = Math.min(h * 0.74, w * 0.5);
    const x = w / 2 - size / 2, y = h * 0.1;
    const mapUV = drawUVAxes(ctx, x, y, size, data.maxGl);
    const reveal = reducedMotion ? 1 : beatT(T, 0.3, 2.4);
    drawUVPoints(ctx, mapUV, data.uvGl, reveal, { radius: 1.2 });
    drawFillGauge(ctx, w / 2, y + size + 46, 30, data.fillPct, reveal);
  },
};

// Bespoke scenes register here in Phase 2 (SCENES.B = ..., etc.).
export const SCENES = {};

export function getScene(actId) {
  return SCENES[actId] || genericScene;
}
