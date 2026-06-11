// sceneB.js — ACT B: The Synthesized Aperture (flagship, LIVE-60FPS).
// One instrument at escalating scale, every datum from real station ECEF:
//   beat 1 — ALMA+IRAM baseline on a turning Earth → the single (u,v) sample it measures
//   beat 2 — Earth rotates (HA clock); the REAL ellipse is drawn point by point
//   beat 3 — full EHT 2017 coverage fades in; real UV-fill gauge; θ = λ/B callout
// Guided mode: drag across the UV panel to scrub hour angle (↔) and declination (↕);
// the ellipse recomputes live (sub-ms, audit §2). All numbers via tourPhysics.js.
import { computeBaseline, baselineToUV, computeElevation, MIN_ELEVATION_RAD,
         computeUVPointsGl, computeUVPoints, computeUVFill } from './uvCompute.js';
import { TOUR_PHYSICS as P } from './tourPhysics.js';
import { TOKENS } from './tourTokens.js';
import { getTourEarth } from './tourEarth.js';
import { clearScene, drawUVAxes, beatT, ease, clamp01, hexA, toTelescopes, uvExtentGl } from './tourScene.js';
import { ensureGalaxy, drawGalaxy } from './tourGalaxy.js';
import { drawBaselineVector, drawUVTrace, drawUVPoints, drawFillGauge,
         drawResolutionCallout } from './tourAnnotations.js';

const C_M_S = 299792458;

// One baseline's real (u,v) track in Gλ over a full synthesis, with hour angle kept.
// Mirrors computeUVPointsGl's per-pair math (elevation-filtered, ground stations).
function pairTrackGl(t1, t2, decDeg, freqGHz, durHr, steps = 220) {
  const b = computeBaseline(t1, t2);
  const lambda_m = C_M_S / (freqGHz * 1e9);
  const kmToGl = 1e3 / lambda_m / 1e9;
  const decRad = decDeg * Math.PI / 180;
  const halfDur = durHr * Math.PI / 24;
  const pts = [];
  for (let s = 0; s <= steps; s++) {
    const H = -halfDur + (s / steps) * 2 * halfDur;
    if (computeElevation(t1.lat, H, decRad) < MIN_ELEVATION_RAD) continue;
    if (computeElevation(t2.lat, H, decRad) < MIN_ELEVATION_RAD) continue;
    const uv = baselineToUV(b, H, decDeg);
    pts.push({ u: uv.u * kmToGl, v: uv.v * kmToGl, H });
  }
  return pts;
}

const mono = (px, w = 500) => `${w} ${px}px ${TOKENS.fontMono}`;

export const sceneB = {
  async init(engineState) {
    const tels = toTelescopes(engineState.stations);
    const { params, pair } = engineState;
    const t1 = tels.find(t => t.name === pair[0]) || tels[0];
    const t2 = tels.find(t => t.name === pair[1]) || tels[1];
    const b = computeBaseline(t1, t2);
    const baselineKm = Math.hypot(b.bx, b.by, b.bz);

    const pairTrack = pairTrackGl(t1, t2, params.decDeg, params.freqGHz, params.durationHr);
    const uvGl = computeUVPointsGl(tels, {
      declination: params.decDeg, duration: params.durationHr, frequency: params.freqGHz,
    });
    const uvPx = computeUVPoints(tels, {
      declination: params.decDeg, duration: params.durationHr, frequency: params.freqGHz,
      fovMuas: params.fovMuas, N: 512,
    }).uvPoints;

    // The main page's textured globe, read-only, with this act's stations marked.
    const earth = getTourEarth();
    earth.setStations(tels);

    return {
      tels, t1, t2, baselineKm, params, earth,
      pairTrack, uvGl, maxGl: uvExtentGl(uvGl), fillPct: computeUVFill(uvPx, 512),
      scrub: { active: false, haFrac: 0.5, decDeg: params.decDeg },
      scrubTrack: pairTrack, scrubDec: params.decDeg,
      _layout: null,
    };
  },

  drawFrame(ctx, frame, data) {
    const { w, h, T, reducedMotion, mode, animPhase } = frame;
    clearScene(ctx, w, h);
    drawGalaxy(ctx, ensureGalaxy(data, w, h, { seed: 11, intensity: 0.6 }), reducedMotion ? 0 : T);

    // Layout: turning Earth (left), UV panel (right)
    const gR  = Math.min(h * 0.34, w * 0.18);
    const gcx = w * 0.26, gcy = h * 0.42;
    const panelSize = Math.min(h * 0.80, w * 0.44);
    const px = w * 0.53, py = (h - panelSize) * 0.42;
    data._layout = { px, py, panelSize, w, h, gcx, gcy, gR };
    const mapUV = drawUVAxes(ctx, px, py, panelSize, data.maxGl);

    const scrubbing = data.scrub.active && mode === 'guided';
    // recompute the scrub track only when declination actually changed (cheap, but tidy)
    if (scrubbing && data.scrubDec !== data.scrub.decDeg) {
      data.scrubTrack = pairTrackGl(data.t1, data.t2, data.scrub.decDeg, data.params.freqGHz, data.params.durationHr);
      data.scrubDec = data.scrub.decDeg;
    }

    const sweep = reducedMotion ? 1 : beatT(T, 2.6, 5.0);
    const b3    = reducedMotion ? 1 : beatT(T, 7.8, 3.0);
    const inBeat1 = !scrubbing && !reducedMotion && T < 2.6;

    const track = scrubbing ? data.scrubTrack : data.pairTrack;
    const headFrac = scrubbing ? data.scrub.haFrac : (inBeat1 ? 0 : sweep);
    const headIdx = track.length ? Math.max(0, Math.min(track.length - 1, Math.floor(track.length * headFrac))) : 0;
    const rotation = track.length ? track[headIdx].H : 0;

    // ── Earth + stations (the main page's textured globe, read-only) ──
    const earth = data.earth;
    const eScale = gR / earth.radiusPx;
    const eHalf = (earth.SIZE / 2) * eScale;
    ctx.drawImage(earth.render(rotation), gcx - eHalf, gcy - eHalf,
                  earth.SIZE * eScale, earth.SIZE * eScale);
    const mapE = (q) => ({ x: gcx + (q.x - earth.SIZE / 2) * eScale,
                           y: gcy + (q.y - earth.SIZE / 2) * eScale, front: q.front });
    const p1 = mapE(earth.project(data.t1.lat, data.t1.lon, rotation));
    const p2 = mapE(earth.project(data.t2.lat, data.t2.lon, rotation));
    if (p1.front && p2.front) drawBaselineVector(ctx, p1, p2, data.baselineKm,
      { showLabel: !reducedMotion, label: `|B| ${data.t1.name}–${data.t2.name}` });
    // pair station labels
    ctx.save();
    ctx.font = mono(10, 600); ctx.fillStyle = TOKENS.textSecondary; ctx.textAlign = 'center';
    if (p1.front) ctx.fillText(data.t1.name, p1.x, p1.y - 8);
    if (p2.front) ctx.fillText(data.t2.name, p2.x, p2.y - 8);
    ctx.restore();

    // ── UV panel ──
    if (b3 > 0) drawUVPoints(ctx, mapUV, data.uvGl, b3, { radius: 1.0 });
    if (track.length) drawUVTrace(ctx, mapUV, track, headFrac, { width: 1.8 });

    // beat 1 emphasis: the single (u,v) sample this one baseline measures right now
    if (inBeat1 && track.length) {
      const s = mapUV(track[0].u, track[0].v);
      ctx.save();
      ctx.strokeStyle = TOKENS.accent; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(s.x, s.y, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = TOKENS.textPrimary; ctx.font = mono(11, 600); ctx.textAlign = 'left';
      ctx.fillText('one baseline → one (u,v) sample', px + 8, py + 20);
      ctx.restore();
    }

    // beat 3: real fill gauge + θ=λ/B_max callout. Every baseline in frame is named
    // by identity (W1.1): the live pair |B| t1–t2 on the globe, the array's
    // M87*-observing max B_max here, and the coverage extent |u|max on the panel —
    // three different quantities, zero in-frame contradiction.
    if (b3 > 0.02) {
      drawFillGauge(ctx, px + panelSize - 34, py + panelSize - 34, 28, data.fillPct, b3);
    }
    if (b3 > 0.35) {
      drawResolutionCallout(ctx, gcx - 115, gcy + gR + 20, [
        `λ = ${P.str.lambda}`,
        `B_max (M87*) = ${P.str.ehtBaseline}`,
        `θ = λ/B_max = ${P.str.thetaEht}`,
      ], { w: 230, title: 'θ = λ / B_max' });
      ctx.save();
      ctx.globalAlpha = ease(beatT(b3, 0.35, 0.4));
      ctx.fillStyle = hexA(TOKENS.textSecondary, 0.9);
      ctx.font = mono(11, 500); ctx.textAlign = 'center';
      ctx.fillText(`one pair = one baseline · rotation fills coverage to |u|max = ${P.str.uMax}`,
        px + panelSize / 2, py - 10);
      ctx.restore();
    }

    // guided affordance hint
    if (mode === 'guided' && animPhase === 'ready' && !reducedMotion) {
      ctx.save();
      ctx.fillStyle = hexA(TOKENS.textSecondary, scrubbing ? 0.4 : 0.85);
      ctx.font = mono(11, 500); ctx.textAlign = 'center';
      ctx.fillText('drag ↔ hour angle    ↕ declination', px + panelSize / 2, py + panelSize + 22);
      if (scrubbing) {
        ctx.fillStyle = TOKENS.accent;
        ctx.fillText(`H ${(track[headIdx]?.H * 12 / Math.PI || 0).toFixed(1)} h   ·   δ ${data.scrub.decDeg.toFixed(1)}°`,
          px + panelSize / 2, py + panelSize + 38);
      }
      ctx.restore();
    }
  },

  // Guided interactivity: drag over the UV panel → scrub HA (x) + declination (y).
  onPointer(data, { type, nx, ny, mode, phase }) {
    if (mode !== 'guided' || !data._layout) return;
    if (type === 'down') data.scrub.active = true;
    if (type === 'leave' || type === 'up') { /* keep last manual state; stop tracking moves */ if (type === 'leave') data.scrub.dragging = false; }
    if (type === 'down') data.scrub.dragging = true;
    if (type === 'up') data.scrub.dragging = false;
    if ((type === 'move' && data.scrub.dragging) || type === 'down') {
      const { px, py, panelSize, w, h } = data._layout;
      const x = nx * w, y = ny * h;
      const fx = clamp01((x - px) / panelSize);
      const fy = clamp01((y - py) / panelSize);
      data.scrub.haFrac = fx;
      data.scrub.decDeg = 80 * (0.5 - fy);  // map panel y → dec ∈ [+40°, −40°]
    }
  },
};
