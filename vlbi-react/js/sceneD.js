// sceneD.js — ACT D: First Light (static / precompute).
// The one honest illustration in the tour — the real photograph — held to account by
// the instrument beside it:
//   LEFT  — the actual EHT M87* image (assets/eht-m87-2019.jpg), presented impeccably,
//           with provenance and a 42 μas shadow scale. The DISPLAYED photo is zoomed
//           (display-only crop) so its measured ring spans the same fraction of the
//           frame as the reconstruction's — both scale bars are then true.
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
import { clearScene, beatT, ease, clamp01, hexA, toTelescopes,
         measureRingFraction, zoomSource } from './tourScene.js';
import { ensureGalaxy, drawGalaxy } from './tourGalaxy.js';
import { roundRect } from './tourAnnotations.js';

const N = 512;
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
    // Same measured ring sizing as Act C (W1.3): the ring spans its true 42 μas of FOV.
    const ringFrac = measureRingFraction(grayscale, N);
    const sizeFactor = (P.m87ShadowUas / params.fovMuas) / ringFrac;
    const src = sizeFactor >= 1
      ? zoomSource(grayscale, sizeFactor, N)
      : scaleSource(grayscale, sizeFactor, N);
    const shadowFrac = P.m87ShadowUas / params.fovMuas;   // scale-bar length, computed
    const sefdMap = buildSefdMap(tels, STATION_SEFD);
    const { restored } = await runReconstruction(src.slice(), uvPoints.map(p => ({ u: p.u, v: p.v })), {
      N, noise: 0, method: 'clean', dishDiameter: P.ehtMeanDishM, frequency: params.freqGHz,
      fovRad: params.fovMuas * (Math.PI / (180 * 3.6e9)), stationPairs, sefdMap,
    });
    const reconCanvas = document.createElement('canvas');
    reconCanvas.width = N; reconCanvas.height = N;
    drawHot(reconCanvas.getContext('2d'), restored, N);

    let photo = null;
    try { photo = await loadImage(params.photo || '../assets/eht-m87-2019.jpg'); } catch (_) { photo = null; }

    // True scale matching (display-only): measure the photograph's own ring and
    // pre-render a zoomed crop so BOTH panels show the ring spanning the same
    // fraction of the frame (shadowFrac) — making the shared scale bars true for
    // the photo too. Never touches reconstruction data; degenerate measurements
    // (≤0.05 or ≥0.95) fall back to zoom 1.
    let photoCanvas = null;
    if (photo) {
      try {
        const s = Math.min(photo.width, photo.height);
        const oc = document.createElement('canvas');
        oc.width = N; oc.height = N;
        const octx = oc.getContext('2d');
        // cover-fit the (square-ish) photo into N×N for measurement
        octx.drawImage(photo, (photo.width - s) / 2, (photo.height - s) / 2, s, s, 0, 0, N, N);
        const id = octx.getImageData(0, 0, N, N).data;
        const gs = new Float64Array(N * N);
        for (let i = 0; i < N * N; i++) {
          gs[i] = id[i * 4] * 0.299 + id[i * 4 + 1] * 0.587 + id[i * 4 + 2] * 0.114;
        }
        const photoRingFrac = measureRingFraction(gs, N);
        const photoZoom = (photoRingFrac > 0.05 && photoRingFrac < 0.95)
          ? Math.max(1, shadowFrac / photoRingFrac)
          : 1;
        const pc = document.createElement('canvas');
        pc.width = N; pc.height = N;
        const pctx = pc.getContext('2d');
        const sw = s / photoZoom;
        pctx.drawImage(photo,
          (photo.width - sw) / 2, (photo.height - sw) / 2, sw, sw,
          0, 0, N, N);
        photoCanvas = pc;
      } catch (_) { photoCanvas = null; /* draw the raw photo as before */ }
    }

    return { photo, photoCanvas, reconCanvas, shadowFrac };
  },

  drawFrame(ctx, frame, data) {
    const { w, h, T, reducedMotion } = frame;
    clearScene(ctx, w, h);
    // dimmest galaxy of the five acts — nothing competes with the photograph
    drawGalaxy(ctx, ensureGalaxy(data, w, h, { seed: 9, intensity: 0.35 }), reducedMotion ? 0 : T);

    const b1 = reducedMotion ? 1 : beatT(T, 0.3, 2.0);   // photo
    const b2 = reducedMotion ? 1 : beatT(T, 2.2, 2.0);   // reconstruction
    const b3 = reducedMotion ? 1 : beatT(T, 4.4, 1.8);   // scale + provenance

    const panel = Math.min(h * 0.72, w * 0.40);
    const cy = h * 0.42, py = cy - panel / 2;
    const lx = w * 0.30 - panel / 2;
    const rx = w * 0.70 - panel / 2;

    // LEFT — the real photograph (scale-matched crop when available)
    ctx.save();
    ctx.globalAlpha = ease(b1);
    panelHeader(ctx, lx, py, panel, 'REAL PHOTOGRAPH — EHT COLLABORATION · 10 APRIL 2019');
    panelFrame(ctx, lx, py, panel);
    ctx.save();
    roundRect(ctx, lx, py, panel, panel, 4); ctx.clip();
    if (data.photoCanvas) ctx.drawImage(data.photoCanvas, lx, py, panel, panel);
    else if (data.photo) ctx.drawImage(data.photo, lx, py, panel, panel);
    else { ctx.fillStyle = hexA(TOKENS.orange, 0.3); ctx.fillRect(lx, py, panel, panel); }
    ctx.restore();
    ctx.restore();

    // RIGHT — the simulator's own reconstruction, RESOLVING into recognizability:
    // blur collapses 14px→0 as the beat completes (the act's "the method finds the
    // same ring" moment). ctx.filter is reset to 'none' immediately after the draw.
    if (b2 > 0) {
      const e2 = ease(b2);
      ctx.save();
      ctx.globalAlpha = e2;
      panelHeader(ctx, rx, py, panel, "THIS SIMULATOR'S RECONSTRUCTION — THE ACT III PIPELINE");
      panelFrame(ctx, rx, py, panel);
      ctx.save();
      roundRect(ctx, rx, py, panel, panel, 4); ctx.clip();
      const blurPx = 14 * (1 - e2);
      if (blurPx > 0.05) ctx.filter = `blur(${blurPx.toFixed(1)}px)`;
      ctx.drawImage(data.reconCanvas, rx, py, panel, panel);
      ctx.filter = 'none';
      ctx.restore();
      ctx.restore();
    }

    // Scale bars (42 μas shadow) + provenance + the dated moment itself
    if (b3 > 0) {
      ctx.save();
      ctx.globalAlpha = ease(b3);
      drawBridge(ctx, lx + panel, rx, cy, w);
      scaleAndCaption(ctx, lx, py, panel, data.shadowFrac, 'M87* · EHT Collaboration', `λ = ${P.str.lambda} · ${P.freqGHz} GHz`);
      if (b2 > 0) scaleAndCaption(ctx, rx, py, panel, data.shadowFrac, 'This simulator · EHT 2017', `CLEAN · θ = ${P.str.thetaEht}`);
      // The emotional peak gets its own typographic weight: the date, large and
      // letter-spaced, centered beneath the pair.
      ctx.fillStyle = TOKENS.textPrimary;
      ctx.font = `600 22px ${TOKENS.font}`;
      try { ctx.letterSpacing = '8px'; } catch (_) { /* older canvas impls */ }
      ctx.textAlign = 'center';
      ctx.fillText('10 APRIL 2019', w / 2, py + panel + 78);
      try { ctx.letterSpacing = '0px'; } catch (_) { /* reset */ }
      ctx.fillStyle = TOKENS.textSecondary;
      ctx.font = mono(10, 500);
      ctx.fillText('the first photograph of a black hole', w / 2, py + panel + 98);
      ctx.fillText('same physics, same array geometry — differences are weather, calibration, and the imaging pipeline', w / 2, py + panel + 116);
      ctx.restore();
    }
  },
};

// Unmistakable panel header — the app's label treatment, centered above a panel.
function panelHeader(ctx, x, y, s, text) {
  ctx.save();
  ctx.fillStyle = TOKENS.textSecondary;
  ctx.font = mono(10, 600);
  ctx.textAlign = 'center';
  try { ctx.letterSpacing = '0.08em'; } catch (_) { /* older canvas impls */ }
  ctx.fillText(text.toUpperCase(), x + s / 2, y - 14);
  try { ctx.letterSpacing = '0px'; } catch (_) { /* reset */ }
  ctx.restore();
}

// Connecting bridge at mid-height: two hairlines pointing at each panel with a
// centered two-line label. Subtle — no glow, no box.
function drawBridge(ctx, leftEdge, rightEdge, cy, w) {
  const mid = w / 2;
  const inset = 8;         // breathing room off each panel edge
  const labelHalf = 62;    // clearance around the centered label
  const l0 = leftEdge + inset, l1 = mid - labelHalf;
  const r0 = mid + labelHalf, r1 = rightEdge - inset;
  ctx.save();
  ctx.strokeStyle = hexA(TOKENS.textSecondary, 0.6);
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (l1 > l0) { ctx.moveTo(l0, cy); ctx.lineTo(l1, cy); }
  if (r1 > r0) { ctx.moveTo(r0, cy); ctx.lineTo(r1, cy); }
  ctx.stroke();
  ctx.fillStyle = TOKENS.textSecondary;
  ctx.font = mono(10, 600);
  ctx.textAlign = 'center';
  try { ctx.letterSpacing = '0.08em'; } catch (_) { /* older canvas impls */ }
  ctx.fillText('SAME SOURCE', mid, cy - 4);
  ctx.fillText('TWO INSTRUMENTS', mid, cy + 12);
  try { ctx.letterSpacing = '0px'; } catch (_) { /* reset */ }
  ctx.restore();
}

function panelFrame(ctx, x, y, s) {
  ctx.save();
  ctx.fillStyle = '#000';
  ctx.strokeStyle = hexA(TOKENS.border, 1);
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, s, s, 4);
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

// Shadow scale bar (length = shadow/FOV, computed) + a two-line caption under a panel.
function scaleAndCaption(ctx, x, y, s, shadowFrac, line1, line2) {
  const barLen = s * shadowFrac;
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
