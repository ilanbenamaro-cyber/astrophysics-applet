// sceneA.js — ACT A: The Resolution Problem (live-on-input).
// The instrument fingerprint, both sides engine-true:
//   LEFT  — one 100 m dish: its diffraction beam θ = λ/D (FWHM 1.02 λ/D — the SAME
//           primary-beam formula worker.js applies), rendered to scale as an
//           unresolved blur of a point source.
//   RIGHT — the REAL EHT dirty beam: a point source reconstructed through the real
//           EHT 2017 (u,v) sampling (runReconstruction, method 'dirty') → the actual
//           PSF with sidelobes, drawn with the engine's hot colormap.
// Numbers (2.7″, 25 μas, 1.1×10⁵×) all from tourPhysics.js.
import { computeUVPoints } from './uvCompute.js';
import { runReconstruction, buildSefdMap } from './simCore.js';
import { generatePreset } from './presets.js';
import { STATION_SEFD } from './constants.js';
import { TOUR_PHYSICS as P } from './tourPhysics.js';
import { drawHot } from './simRender.js';
import { TOKENS } from './tourTokens.js';
import { clearScene, beatT, ease, clamp01, hexA, toTelescopes } from './tourScene.js';
import { ensureGalaxy, drawGalaxy } from './tourGalaxy.js';
import { roundRect } from './tourAnnotations.js';

const N = 512;
const mono = (px, w = 500) => `${w} ${px}px ${TOKENS.fontMono}`;

export const sceneA = {
  async init(engineState) {
    const tels = toTelescopes(engineState.stations);
    const { params } = engineState;
    const { uvPoints, stationPairs } = computeUVPoints(tels, {
      declination: params.decDeg, duration: params.durationHr, frequency: params.freqGHz,
      fovMuas: params.fovMuas, N,
    });
    const src = generatePreset('point').grayscale;     // a real point source
    const sefdMap = buildSefdMap(tels, STATION_SEFD);
    const { dirty } = await runReconstruction(src.slice(), uvPoints.map(p => ({ u: p.u, v: p.v })), {
      N, noise: 0, method: 'dirty', dishDiameter: P.ehtMeanDishM, frequency: params.freqGHz,
      fovRad: params.fovMuas * (Math.PI / (180 * 3.6e9)), stationPairs, sefdMap,
    });
    // Pre-render the dirty beam (the EHT PSF) once — it is static.
    const beamCanvas = document.createElement('canvas');
    beamCanvas.width = N; beamCanvas.height = N;
    drawHot(beamCanvas.getContext('2d'), dirty, N);
    return { beamCanvas };
  },

  drawFrame(ctx, frame, data) {
    const { w, h, T, reducedMotion } = frame;
    clearScene(ctx, w, h);
    drawGalaxy(ctx, ensureGalaxy(data, w, h, { seed: 3, intensity: 0.55 }), reducedMotion ? 0 : T);

    const b1 = reducedMotion ? 1 : beatT(T, 0.3, 2.2);    // single dish blur
    const b2 = reducedMotion ? 1 : beatT(T, 3.0, 2.4);    // EHT dirty beam
    const b3 = reducedMotion ? 1 : beatT(T, 6.0, 2.4);    // the gain

    const panel = Math.min(h * 0.62, w * 0.32);
    const cy = h * 0.42;
    const lx = w * 0.27 - panel / 2;
    const rx = w * 0.73 - panel / 2;
    const py = cy - panel / 2;

    // ── LEFT: one dish — the diffraction blur of a point (θ = λ/D) ──
    ctx.save();
    ctx.globalAlpha = ease(b1);
    drawPanelFrame(ctx, lx, py, panel);
    // unresolved blur: a broad Gaussian — the dish cannot localise at this scale
    const g = ctx.createRadialGradient(lx + panel / 2, py + panel / 2, 1,
                                       lx + panel / 2, py + panel / 2, panel * 0.6);
    g.addColorStop(0, hexA(TOKENS.orange, 0.55));
    g.addColorStop(0.5, hexA(TOKENS.orange, 0.16));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(lx, py, panel, panel);
    panelCaption(ctx, lx, py, panel, `ONE ${P.dishD_m} m DISH`, `θ = ${P.str.thetaDish}`);
    ctx.restore();

    // ── RIGHT: the real EHT dirty beam (point reconstructed through EHT u,v) ──
    if (b2 > 0) {
      ctx.save();
      ctx.globalAlpha = ease(b2);
      drawPanelFrame(ctx, rx, py, panel);
      // clip to panel and draw the real PSF (sharp peak + sidelobes)
      ctx.save();
      roundRect(ctx, rx, py, panel, panel, 4); ctx.clip();
      ctx.drawImage(data.beamCanvas, rx, py, panel, panel);
      ctx.restore();
      panelCaption(ctx, rx, py, panel, 'EARTH-SIZED ARRAY · EHT', `θ = ${P.str.thetaEht}`);
      ctx.restore();
    }

    // ── CENTER: θ = λ/D → λ/B and the gain ──
    if (b3 > 0) {
      ctx.save();
      ctx.globalAlpha = ease(b3);
      ctx.textAlign = 'center';
      ctx.fillStyle = TOKENS.accent;
      ctx.font = mono(17, 600);
      ctx.fillText('θ = λ/D  →  λ/B', w / 2, cy - 18);
      ctx.fillStyle = TOKENS.textPrimary;
      ctx.font = mono(30, 700);
      ctx.fillText(P.str.improvement, w / 2, cy + 22);
      ctx.fillStyle = TOKENS.textSecondary;
      ctx.font = mono(11, 500);
      ctx.fillText('SHARPER', w / 2, cy + 44);
      // arrow — split around the gain figure so it never strikes through the text
      const gap = 130;
      ctx.strokeStyle = hexA(TOKENS.accent, 0.7);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(lx + panel + 8, cy); ctx.lineTo(w / 2 - gap, cy);
      ctx.moveTo(w / 2 + gap, cy); ctx.lineTo(rx - 8, cy);
      ctx.stroke();
      ctx.restore();
    }
  },
};

function drawPanelFrame(ctx, x, y, s) {
  ctx.save();
  ctx.fillStyle = hexA(TOKENS.bg0, 0.6);
  ctx.strokeStyle = hexA(TOKENS.border, 1);
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, s, s, 4);
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

function panelCaption(ctx, x, y, s, label, value) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = TOKENS.textSecondary;
  ctx.font = mono(10, 600);
  ctx.fillText(label, x + s / 2, y + s + 16);
  ctx.fillStyle = TOKENS.accent;
  ctx.font = mono(13, 600);
  ctx.fillText(value, x + s / 2, y + s + 33);
  ctx.restore();
}
