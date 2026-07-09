// tourScenes.js — per-act scene registry. Each scene is:
//   { init(engineState) -> Promise<engineData>, drawFrame(ctx, frame, engineData),
//     interactive? }   where frame = { w, h, T, animPhase, mode, reducedMotion, beat }
// The host (Tour.js) looks up SCENES[actId]; acts without a bespoke scene fall back to
// genericScene, which still renders REAL coverage (never a fake). Phase 2 fills SCENES.
import { computeUVPointsGl, computeUVFillGl, computeUVMaxExtentGl } from './uvCompute.js';
import { clearScene, drawUVAxes, beatT, toTelescopes, uvExtentGl } from './tourScene.js';
import { ensureGalaxy, drawGalaxy } from './tourGalaxy.js';
import { drawUVPoints, drawFillGauge } from './tourAnnotations.js';
import { sceneB } from './sceneB.js';
import { sceneA } from './sceneA.js';
import { sceneC } from './sceneC.js';
import { sceneD } from './sceneD.js';
import { sceneE } from './sceneE.js';

// ── Generic real scene (fallback) ───────────────────────────────────────────────
const genericScene = {
  async init(engineState) {
    const tels = toTelescopes(engineState.stations, engineState.satellite);
    const { params } = engineState;
    const uvOpts = {
      declination: params.decDeg, duration: params.durationHr, frequency: params.freqGHz,
    };
    const uvGl = computeUVPointsGl(tels, uvOpts);
    // Fill on the locked (BHEX-enabled) frame — same definition as the live app (N3).
    const fillPct = computeUVFillGl(uvGl, computeUVMaxExtentGl(tels, uvOpts));
    return { tels, uvGl, maxGl: uvExtentGl(uvGl), fillPct };
  },
  drawFrame(ctx, frame, data) {
    const { w, h, T, reducedMotion } = frame;
    clearScene(ctx, w, h);
    drawGalaxy(ctx, ensureGalaxy(data, w, h, { seed: 7, intensity: 0.6 }), reducedMotion ? 0 : T);
    const size = Math.min(h * 0.74, w * 0.5);
    const x = w / 2 - size / 2, y = h * 0.1;
    const mapUV = drawUVAxes(ctx, x, y, size, data.maxGl);
    const reveal = reducedMotion ? 1 : beatT(T, 0.3, 2.4);
    drawUVPoints(ctx, mapUV, data.uvGl, reveal, { radius: 1.2 });
    drawFillGauge(ctx, w / 2, y + size + 46, 30, data.fillPct, reveal);
  },
};

// Bespoke scenes register here in Phase 2.
export const SCENES = {
  A: sceneA,
  B: sceneB,
  C: sceneC,
  D: sceneD,
  E: sceneE,
};

export function getScene(actId) {
  return SCENES[actId] || genericScene;
}
