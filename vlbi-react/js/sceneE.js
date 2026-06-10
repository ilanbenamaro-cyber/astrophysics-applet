// sceneE.js — ACT E: Beyond Earth & the Instrument (closing act, LIVE-60FPS).
// Real space-VLBI coverage: the BHEX element (computeSatelliteECEF + the ground–space
// branch of computeUVPointsGl) extends baselines BEYOND Earth's diameter. The Earth-only
// limit is drawn as a ring; the space baselines (orange) reach past it.
// INTEGRITY (master prompt §5, G3): geometry is real, but the baseline relation is hedged
// — "characteristic ~ R⊕ + h · pending sign-off (Marrone/Alejandro)" verbatim, never a
// clean equality. The final beat hands off to the live simulator (host dispatches loadEHT).
import { computeUVPointsGl, computeSatelliteECEF } from './uvCompute.js';
import { BHEX_PRESET } from './constants.js';
import { TOUR_PHYSICS as P } from './tourPhysics.js';
import { TOKENS } from './tourTokens.js';
import { clearScene, makeStars, drawStarfield, drawEarth, drawUVAxes,
         beatT, ease, clamp01, hexA, toTelescopes, uvExtentGl } from './tourScene.js';
import { drawUVPoints, drawResolutionCallout, roundRect } from './tourAnnotations.js';

const mono = (px, w = 500) => `${w} ${px}px ${TOKENS.fontMono}`;

function maxExtent(pts) {
  let m = 0;
  for (const p of pts) m = Math.max(m, Math.hypot(p.u, p.v));
  return m;
}

export const sceneE = {
  async init(engineState) {
    const { params, satellite } = engineState;
    const ground = toTelescopes(engineState.stations);
    const all = toTelescopes(engineState.stations, satellite);
    const satId = engineState.stations.length;   // appended last by toTelescopes
    const opts = { declination: params.decDeg, duration: params.durationHr, frequency: params.freqGHz };

    const uvGround = computeUVPointsGl(ground, opts);
    const uvAll = computeUVPointsGl(all, opts);
    const uvSpace = uvAll.filter(p => p.pairId && p.pairId.startsWith(satId + '-'));

    return {
      uvGround, uvSpace, satellite,
      groundMax: maxExtent(uvGround),
      maxGl: uvExtentGl(uvAll),
      _stars: null,
    };
  },

  drawFrame(ctx, frame, data) {
    const { w, h, T, reducedMotion } = frame;
    if (!data._stars) data._stars = makeStars(140, w, h, 13);
    clearScene(ctx, w, h);
    drawStarfield(ctx, data._stars, reducedMotion ? 0 : T, 0.7);

    const b1 = reducedMotion ? 1 : beatT(T, 0.3, 2.0);   // ground coverage + Earth limit
    const b2 = reducedMotion ? 1 : beatT(T, 2.4, 3.0);   // space baselines extend
    const b3 = reducedMotion ? 1 : beatT(T, 6.0, 2.5);   // integrity callout + CTA

    // ── UV panel (right) ──
    const panel = Math.min(h * 0.70, w * 0.42);
    const px = w * 0.54, py = (h - panel) * 0.40;
    const mapUV = drawUVAxes(ctx, px, py, panel, data.maxGl);
    const cx = px + panel / 2, cyP = py + panel / 2;
    const scale = (panel / 2) / data.maxGl;

    // Earth-diameter limit ring (max ground baseline extent)
    if (b1 > 0) {
      ctx.save();
      ctx.globalAlpha = ease(b1);
      ctx.strokeStyle = hexA(TOKENS.textSecondary, 0.45);
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.arc(cx, cyP, data.groundMax * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = TOKENS.textSecondary;
      ctx.font = mono(9, 600); ctx.textAlign = 'center';
      ctx.fillText('EARTH-DIAMETER LIMIT', cx, cyP - data.groundMax * scale - 6);
      ctx.restore();
      drawUVPoints(ctx, mapUV, data.uvGround, b1, { radius: 1.0, defaultColor: TOKENS.accent });
    }
    // Space baselines reaching beyond the ring (orange = beyond-Earth)
    if (b2 > 0) {
      drawUVPoints(ctx, mapUV, data.uvSpace, b2, { radius: 1.2, defaultColor: TOKENS.orange });
    }

    // ── Mini Earth + orbiting BHEX (left) ──
    const gR = Math.min(h * 0.16, w * 0.09);
    const gcx = w * 0.26, gcy = h * 0.40;
    drawEarth(ctx, gcx, gcy, gR, reducedMotion ? 0 : T * 0.15);
    // schematic orbit (radius labelled real; px radius capped for the inset)
    const orbitR = gR * 2.3;
    ctx.save();
    ctx.strokeStyle = hexA(TOKENS.orange, 0.5);
    ctx.setLineDash([2, 5]);
    ctx.beginPath(); ctx.ellipse(gcx, gcy, orbitR, orbitR * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    // real orbital phase from computeSatelliteECEF (period-driven angle)
    const tHours = reducedMotion ? 3 : (T * 1.2) % data.satellite.periodHours;
    const theta = 2 * Math.PI / data.satellite.periodHours * tHours;
    const sxp = gcx + orbitR * Math.cos(theta), syp = gcy + orbitR * 0.55 * Math.sin(theta);
    ctx.fillStyle = TOKENS.orange;
    ctx.shadowColor = hexA(TOKENS.orange, 0.8); ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(sxp, syp, 4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = TOKENS.textSecondary; ctx.font = mono(10, 600); ctx.textAlign = 'center';
    ctx.fillText('BHEX', sxp, syp - 9);
    ctx.fillText(`h = ${data.satellite.orbitalAltitudeKm.toLocaleString('en-US')} km`, gcx, gcy + gR + 18);
    ctx.restore();

    // ── Integrity callout (hedged) + CTA ──
    if (b3 > 0) {
      ctx.save();
      ctx.globalAlpha = ease(b3);
      drawResolutionCallout(ctx, gcx - 120, gcy + gR + 30, [
        `B characteristic ~ R⊕ + h`,
        `≈ ${P.str.bhexRadius}`,
        `⚠ pending sign-off`,
      ], { w: 240, title: 'Space VLBI' });
      // integrity note (verbatim)
      ctx.fillStyle = hexA(TOKENS.textSecondary, 0.85);
      ctx.font = mono(10, 500); ctx.textAlign = 'center';
      ctx.fillText('characteristic ~ R⊕ + h · pending sign-off (Marrone/Alejandro)', w / 2, py + panel + 26);
      // CTA
      ctx.fillStyle = TOKENS.accent; ctx.font = mono(14, 700);
      ctx.fillText('Place your first telescope.', w / 2, py + panel + 50);
      ctx.restore();
    }
  },
};
