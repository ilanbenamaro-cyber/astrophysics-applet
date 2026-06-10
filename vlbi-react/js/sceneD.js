// sceneD.js — ACT D: First Light (static / precompute).
// The one honest illustration in the tour — the real photograph — held to account by
// the instrument beside it:
//   LEFT  — the actual EHT M87* image (assets/eht-m87-2019.jpg), presented impeccably,
//           with provenance and a 42 μas shadow scale.
//   RIGHT — this simulator's OWN reconstruction of the same source (black-hole.png
//           through the real CLEAN pipeline), rendered in the hot colormap that echoes
//           the published image: "this is what the instrument you just used produces."
// Shadow scale (42 μas) and θ from tourPhysics.
import { computeUVPoints } from './uvCompute.js';
import { runReconstruction, buildSefdMap, scaleSource } from './simCore.js';
import { loadImagePresetAsync } from './presets.js';
import { STATION_SEFD } from './constants.js';
import { TOUR_PHYSICS as P } from './tourPhysics.js';
import { drawHot } from './simRender.js';
import { TOKENS } from './tourTokens.js';
import { clearScene, makeStars, drawStarfield, beatT, ease, clamp01, hexA, toTelescopes } from './tourScene.js';
import { roundRect } from './tourAnnotations.js';

const N = 512;
const SOURCE_FRACTION = 0.525;   // 42 μas shadow / 80 μas FOV
const mono = (px, w = 500) => `${w} ${px}px ${TOKENS.fontMono}`;

function loadImage(url) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error('image load failed: ' + url));
    im.src = url;
  });
}

export const sceneD = {
  async init(engineState) {
    const tels = toTelescopes(engineState.stations);
    const { params } = engineState;
    const { uvPoints, stationPairs } = computeUVPoints(tels, {
      declination: params.decDeg, duration: params.durationHr, frequency: params.freqGHz,
      fovMuas: params.fovMuas, N,
    });
    const { grayscale } = await loadImagePresetAsync('../assets/black-hole.png');
    const src = scaleSource(grayscale, SOURCE_FRACTION, N);
    const sefdMap = buildSefdMap(tels, STATION_SEFD);
    const { restored } = await runReconstruction(src.slice(), uvPoints.map(p => ({ u: p.u, v: p.v })), {
      N, noise: 0, method: 'clean', dishDiameter: 25, frequency: params.freqGHz,
      fovRad: params.fovMuas * (Math.PI / (180 * 3.6e9)), stationPairs, sefdMap,
    });
    const reconCanvas = document.createElement('canvas');
    reconCanvas.width = N; reconCanvas.height = N;
    drawHot(reconCanvas.getContext('2d'), restored, N);

    let photo = null;
    try { photo = await loadImage(params.photo || '../assets/eht-m87-2019.jpg'); } catch (_) { photo = null; }

    return { photo, reconCanvas, _stars: null };
  },

  drawFrame(ctx, frame, data) {
    const { w, h, T, reducedMotion } = frame;
    if (!data._stars) data._stars = makeStars(70, w, h, 9);
    clearScene(ctx, w, h);
    drawStarfield(ctx, data._stars, reducedMotion ? 0 : T, 0.4);

    const b1 = reducedMotion ? 1 : beatT(T, 0.3, 2.0);   // photo
    const b2 = reducedMotion ? 1 : beatT(T, 2.2, 2.0);   // reconstruction
    const b3 = reducedMotion ? 1 : beatT(T, 4.4, 1.8);   // scale + provenance

    const panel = Math.min(h * 0.62, w * 0.34);
    const cy = h * 0.40, py = cy - panel / 2;
    const lx = w * 0.30 - panel / 2;
    const rx = w * 0.70 - panel / 2;

    // LEFT — the real photograph
    ctx.save();
    ctx.globalAlpha = ease(b1);
    panelFrame(ctx, lx, py, panel);
    ctx.save();
    roundRect(ctx, lx, py, panel, panel, 4); ctx.clip();
    if (data.photo) ctx.drawImage(data.photo, lx, py, panel, panel);
    else { ctx.fillStyle = hexA(TOKENS.orange, 0.3); ctx.fillRect(lx, py, panel, panel); }
    ctx.restore();
    ctx.restore();

    // RIGHT — the simulator's own reconstruction
    if (b2 > 0) {
      ctx.save();
      ctx.globalAlpha = ease(b2);
      panelFrame(ctx, rx, py, panel);
      ctx.save();
      roundRect(ctx, rx, py, panel, panel, 4); ctx.clip();
      ctx.drawImage(data.reconCanvas, rx, py, panel, panel);
      ctx.restore();
      ctx.restore();
    }

    // Scale bars (42 μas shadow) + provenance
    if (b3 > 0) {
      ctx.save();
      ctx.globalAlpha = ease(b3);
      scaleAndCaption(ctx, lx, py, panel, 'M87* · EHT Collaboration', '10 April 2019');
      if (b2 > 0) scaleAndCaption(ctx, rx, py, panel, 'This simulator · EHT 2017', `CLEAN · θ = ${P.str.thetaEht}`);
      ctx.restore();
    }
  },
};

function panelFrame(ctx, x, y, s) {
  ctx.save();
  ctx.fillStyle = '#000';
  ctx.strokeStyle = hexA(TOKENS.border, 1);
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, s, s, 4);
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

// 42 μas shadow scale bar + a two-line caption under a panel.
function scaleAndCaption(ctx, x, y, s, line1, line2) {
  const barLen = s * (42 / 80);   // shadow / FOV
  const bx = x + (s - barLen) / 2, by = y + s + 12;
  ctx.save();
  ctx.strokeStyle = TOKENS.textPrimary;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(bx, by); ctx.lineTo(bx + barLen, by);
  ctx.moveTo(bx, by - 4); ctx.lineTo(bx, by + 4);
  ctx.moveTo(bx + barLen, by - 4); ctx.lineTo(bx + barLen, by + 4);
  ctx.stroke();
  ctx.fillStyle = TOKENS.textSecondary;
  ctx.font = mono(10, 600); ctx.textAlign = 'center';
  ctx.fillText(`${P.str.m87Shadow} shadow`, x + s / 2, by + 16);
  ctx.fillStyle = TOKENS.textSecondary;
  ctx.font = mono(10, 600);
  ctx.fillText(line1.toUpperCase(), x + s / 2, by + 34);
  ctx.fillStyle = hexA(TOKENS.textSecondary, 0.7);
  ctx.font = mono(10, 500);
  ctx.fillText(line2, x + s / 2, by + 50);
  ctx.restore();
}
