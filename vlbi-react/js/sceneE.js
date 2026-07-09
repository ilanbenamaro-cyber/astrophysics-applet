// sceneE.js — ACT E: Beyond Earth & the Instrument (closing act, LIVE-60FPS).
// Real space-VLBI coverage: the BHEX element (computeSatelliteECEF + the ground–space
// branch of computeUVPointsGl) extends baselines BEYOND Earth's diameter. The Earth-only
// limit is drawn as a ring; the space baselines (orange) reach past it.
// INTEGRITY (master prompt §5, G3): geometry is real, but the baseline relation is hedged
// — characteristic ~ R⊕ + h, never a clean equality. The sign-off hedge is stated ONCE,
// in the act's equation box (tourActs.js). Final beat hands off to the live simulator.
import { computeUVPointsGl, computeSatelliteECEF } from './uvCompute.js';
import { BHEX_PRESET } from './constants.js';
import { TOUR_PHYSICS as P } from './tourPhysics.js';
import { TOKENS } from './tourTokens.js';
import { getTourEarth } from './tourEarth.js';
import { clearScene, drawUVAxes, beatT, ease, clamp01, hexA, toTelescopes, uvExtentGl } from './tourScene.js';
import { ensureGalaxy, drawGalaxy } from './tourGalaxy.js';
import { drawUVPoints, drawResolutionCallout, drawLegend, roundRect } from './tourAnnotations.js';

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

    const uvGroundRaw = computeUVPointsGl(ground, opts);
    const uvAll = computeUVPointsGl(all, opts);
    // GROUND arcs keep their per-pair colours (the blend of the two stations'
    // colours — exactly how the main app paints baselines) so the viewer can
    // connect an arc to the stations that produced it. SPACE points are stripped
    // and drawn in a fixed orange CLASS colour instead: the BHEX preset colour is
    // itself gold, and per-pair blending would collide with the gold data
    // reservation — the orange class keeps ground-vs-space instantly legible.
    const uvGround = uvGroundRaw.map(p => ({ u: p.u, v: p.v, color: p.color }));
    const uvSpace = uvAll.filter(p => p.pairId && p.pairId.startsWith(satId + '-'))
                         .map(p => ({ u: p.u, v: p.v }));

    // Textured read-only Earth (main-page look) with the ground array marked.
    const earth = getTourEarth();
    earth.setStations(ground);

    // Legend rows: the stations in toTelescopes order (their assigned colours),
    // then the two class entries the panel layers add.
    const legend = ground.map(t => ({ color: t.color, label: t.name, shape: 'dot' }));
    legend.push({ color: TOKENS.orange, label: 'BHEX–ground', shape: 'square' });
    legend.push({ color: TOKENS.amber, label: 'Earth limit', shape: 'ring' });

    return {
      uvGround, uvSpace, satellite, earth, legend,
      groundMax: maxExtent(uvGround),
      maxGl: uvExtentGl(uvAll),
    };
  },

  drawFrame(ctx, frame, data) {
    const { w, h, T, reducedMotion } = frame;
    clearScene(ctx, w, h);
    drawGalaxy(ctx, ensureGalaxy(data, w, h, { seed: 13, intensity: 0.6 }), reducedMotion ? 0 : T);

    const b1 = reducedMotion ? 1 : beatT(T, 0.3, 2.0);   // ground coverage + Earth limit
    const b2 = reducedMotion ? 1 : beatT(T, 2.4, 3.0);   // space baselines extend
    const b3 = reducedMotion ? 1 : beatT(T, 6.0, 2.5);   // integrity callout + CTA

    // ── UV panel (right) ──
    const panel = Math.min(h * 0.78, w * 0.44);
    const px = w * 0.54, py = (h - panel) * 0.40;
    const mapUV = drawUVAxes(ctx, px, py, panel, data.maxGl);
    const cx = px + panel / 2, cyP = py + panel / 2;
    const scale = (panel / 2) / data.maxGl;

    // The one thing this act exists to show (W1.4): coverage EXCEEDING Earth's limit.
    // Three visually separated layers — dim gold ground coverage INSIDE a solid amber
    // reference ring, bright orange space baselines crossing OUT past it.
    const limitR = data.groundMax * scale;
    if (b1 > 0) {
      // ground coverage — station-coloured (per-pair blends), small radius keeps
      // it subordinate to the larger orange space points layered on top
      drawUVPoints(ctx, mapUV, data.uvGround, b1, { radius: 0.9 });
      // Earth-diameter limit: a clear solid reference ring
      ctx.save();
      ctx.globalAlpha = ease(b1);
      ctx.strokeStyle = hexA(TOKENS.amber, 0.9);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cyP, limitR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = TOKENS.amber;
      ctx.font = mono(10, 600); ctx.textAlign = 'center';
      // below the ring — the beyond-Earth annotation owns the NE corner above it
      ctx.fillText('EARTH-DIAMETER LIMIT', cx, cyP + limitR + 16);
      ctx.restore();
    }
    // Space baselines reaching beyond the ring (orange = beyond-Earth)
    if (b2 > 0) {
      // faint orange wash over the beyond-Earth annulus — "we left the planet"
      ctx.save();
      ctx.globalAlpha = ease(b2) * 0.10;
      ctx.fillStyle = TOKENS.orange;
      ctx.beginPath();
      ctx.arc(cx, cyP, Math.min(panel / 2, data.maxGl * scale), 0, Math.PI * 2);
      ctx.arc(cx, cyP, limitR, 0, Math.PI * 2, true);
      ctx.fill();
      ctx.restore();
      drawUVPoints(ctx, mapUV, data.uvSpace, b2, { radius: 1.4, defaultColor: TOKENS.orange });
      if (b2 > 0.5) {
        ctx.save();
        ctx.globalAlpha = ease(beatT(b2, 0.5, 0.4));
        ctx.fillStyle = TOKENS.orange;
        ctx.font = mono(10, 600); ctx.textAlign = 'left';
        const lx2 = cx + limitR * Math.SQRT1_2 + 10, ly2 = cyP - limitR * Math.SQRT1_2 - 10;
        ctx.fillText('coverage beyond', lx2, ly2);
        ctx.fillText("Earth's diameter ↗", lx2, ly2 + 13);
        ctx.restore();
      }
    }

    // ── Mini Earth + orbiting BHEX (left) — main-page textured globe, read-only ──
    const gR = Math.min(h * 0.20, w * 0.11);
    const gcx = w * 0.26, gcy = h * 0.40;
    const earth = data.earth;
    const eScale = gR / earth.radiusPx;
    const eHalf = (earth.SIZE / 2) * eScale;
    ctx.drawImage(earth.render(reducedMotion ? 0 : T * 0.15), gcx - eHalf, gcy - eHalf,
                  earth.SIZE * eScale, earth.SIZE * eScale);
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
    // Skip the sat label while it sweeps the altitude caption's line (bottom of
    // the orbit) — the two texts fused ("…kmBHEX"); the glowing dot still marks it.
    const capY = gcy + gR + 18;
    if (!(Math.abs((syp - 9) - capY) < 14 && Math.abs(sxp - gcx) < 120)) {
      ctx.fillText('BHEX', sxp, syp - 9);
    }
    ctx.fillText(`h = ${data.satellite.orbitalAltitudeKm.toLocaleString('en-US')} km`, gcx, capY);
    ctx.restore();

    // ── Relation callout + CTA. The pending-sign-off hedge lives ONCE, in the act's
    // equation box (tourActs.js liveEquation) — not repeated here (W1.4). ──
    if (b3 > 0) {
      ctx.save();
      ctx.globalAlpha = ease(b3);
      drawResolutionCallout(ctx, gcx - 120, gcy + gR + 30, [
        `B characteristic ~ R⊕ + h`,
        `≈ ${P.str.bhexRadius}`,
        `order-of-magnitude relation`,
      ], { w: 240, title: 'Space VLBI' });
      // colour → station legend, top-left (clear of the Earth inset at all sizes)
      drawLegend(ctx, 20, 18, data.legend, {
        title: 'stations', w: 190, cols: 2,
        footnote: 'arc = blend of its 2 stations',
        alpha: ease(b3),
      });
      // CTA
      ctx.fillStyle = TOKENS.accent; ctx.font = mono(14, 700); ctx.textAlign = 'center';
      ctx.fillText('Place your first telescope.', w / 2, py + panel + 32);
      ctx.restore();
    }
  },
};
