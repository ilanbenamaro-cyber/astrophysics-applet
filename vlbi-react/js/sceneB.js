// sceneB.js — ACT B: The Synthesized Aperture (flagship, LIVE-60FPS).
// One instrument at escalating scale, every datum from real station ECEF:
//   beat 1 — ALMA+IRAM baseline on a turning Earth → the single (u,v) sample it measures
//   beat 2 — Earth rotates (HA clock); the REAL ellipse is drawn point by point
//   beat 3 — full EHT 2017 coverage fades in; real UV-fill gauge; θ = λ/B callout
// Guided mode: two decoupled labeled controls — an HOUR ANGLE track under the UV
// panel and a vertical DECLINATION slider beside it; the ellipse recomputes live
// (sub-ms, audit §2). Once the intro beats finish, the Earth keeps turning on its
// own at a CONSTANT, CONTINUOUS pace — a real hour-angle clock advanced by elapsed
// time (rate × dt from the RAF timestamp), wrapping seamlessly at ±12 h so it spins
// like the main page's globe with no stutter and no slow-down. The (u,v) head traces
// while the source is co-visible and parks at the arc end while it is below the
// horizon, then resumes as the spin brings it back. Dragging HA takes direct control;
// releasing resumes the constant advance from the current angle (no eased ramp, no
// snap). Declination drags never affect the spin. All numbers via tourPhysics.js.
import { computeBaseline, baselineToUV, computeElevation, MIN_ELEVATION_RAD,
         computeUVPointsGl, computeUVFillGl, computeUVMaxExtentGl } from './uvCompute.js';
import { TOUR_PHYSICS as P } from './tourPhysics.js';
import { TOKENS } from './tourTokens.js';
import { getTourEarth } from './tourEarth.js';
import { clearScene, drawUVAxes, beatT, ease, clamp01, hexA, toTelescopes, uvExtentGl } from './tourScene.js';
import { ensureGalaxy, drawGalaxy } from './tourGalaxy.js';
import { drawBaselineVector, drawUVTrace, drawUVPoints, drawFillGauge,
         drawResolutionCallout, drawSliderControl } from './tourAnnotations.js';

const C_M_S = 299792458;

// Idle-spin pace (UX timing, not physics): seconds for the Earth's hour-angle clock
// to advance a full 24 h / 360°. The main globe (Globe.js) auto-rotates at a very
// calm ~200 s/rev; here we run a touch brisker so the act reads as "clearly turning"
// without being sluggish — vision-tuned. Constant rate, no easing.
const IDLE_DAY_S = 40;
const IDLE_RATE = (2 * Math.PI) / IDLE_DAY_S;   // rad of hour angle per second
// Declination drag span: slider top = +40°, bottom = −40° (same mapping as before).
const DEC_SPAN_DEG = 80;

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
    const uvOpts = {
      declination: params.decDeg, duration: params.durationHr, frequency: params.freqGHz,
    };
    const uvGl = computeUVPointsGl(tels, uvOpts);
    // Fill on the locked (BHEX-enabled) frame — same definition as the live app (N3).
    const fillPct = computeUVFillGl(uvGl, computeUVMaxExtentGl(tels, uvOpts));

    // The main page's textured globe, read-only, with this act's stations marked.
    const earth = getTourEarth();
    earth.setStations(tels);

    return {
      tels, t1, t2, baselineKm, params, earth,
      uvGl, maxGl: uvExtentGl(uvGl), fillPct,
      scrub: { dragging: null, haFrac: 0.5, decDeg: params.decDeg },
      scrubTrack: pairTrack, scrubDec: params.decDeg,
      // Continuous hour-angle clock (radians). lastT = last RAF timestamp (s).
      idle: { haRad: 0, lastT: null, seeded: false },
      _touched: false,
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

    // recompute the scrub track only when declination actually changed (sub-ms, but tidy)
    if (data.scrubDec !== data.scrub.decDeg) {
      data.scrubTrack = pairTrackGl(data.t1, data.t2, data.scrub.decDeg, data.params.freqGHz, data.params.durationHr);
      data.scrubDec = data.scrub.decDeg;
    }

    const sweep = reducedMotion ? 1 : beatT(T, 2.6, 5.0);
    const b3    = reducedMotion ? 1 : beatT(T, 7.8, 3.0);

    const track = data.scrubTrack;
    // Co-visible hour-angle window (track is ascending in H, elevation-filtered).
    const Hmin = track.length ? track[0].H : 0;
    const Hmax = track.length ? track[track.length - 1].H : 0;
    const haSpan = Hmax - Hmin || 1;
    const haFracToRad = (f) => Hmin + clamp01(f) * haSpan;
    const radToHeadFrac = (h) => clamp01((h - Hmin) / haSpan);

    // ── Continuous idle spin = a real hour-angle clock ──
    // Constant angular rate advanced by elapsed time (rate × dt) — smooth like the
    // main globe, no quantized track stepping, no eased ramp. Wraps at ±π (±12 h)
    // seamlessly (continuous on the circle → no snap). The HA handle takes direct
    // control while dragged; releasing just resumes the constant advance from the
    // current angle. Reduced motion: idle never runs — the static frame falls
    // through to sweep = 1 (full ellipse + coverage).
    const idleActive = animPhase === 'ready' && !reducedMotion;
    if (idleActive) {
      const dt = data.idle.lastT == null ? 0 : Math.min(0.1, T - data.idle.lastT);
      data.idle.lastT = T;
      if (!data.idle.seeded) { data.idle.haRad = haFracToRad(sweep % 1); data.idle.seeded = true; }  // seamless hand-off from intro sweep
      if (data.scrub.dragging === 'ha') {
        data.idle.haRad = haFracToRad(data.scrub.haFrac);   // direct control while dragging
      } else {
        data.idle.haRad += IDLE_RATE * dt;
        if (data.idle.haRad > Math.PI) data.idle.haRad -= 2 * Math.PI;   // wrap ±12 h
      }
    }

    const inBeat1 = !idleActive && !reducedMotion && T < 2.6;
    // Globe rotation = the continuous hour angle (smooth full-circle spin). The
    // (u,v) head follows the same angle, saturating 0/1 off the co-visible window
    // (trace holds full while the source is "down", restarts as the next transit
    // begins — the globe never snaps, only the trace resets, which is honest).
    const sourceUp = !idleActive || (data.idle.haRad >= Hmin && data.idle.haRad <= Hmax);
    // Co-visible: trace progressively with the head. Source down: hold the ellipse
    // FULL (frac 1) through the far-side passage, so it only resets to 0 at the next
    // rise (when sourceUp flips true → radToHeadFrac(Hmin)=0) — no mid-passage snap.
    const headFrac = idleActive ? (sourceUp ? radToHeadFrac(data.idle.haRad) : 1)
      : (inBeat1 ? 0 : sweep);
    const rotation = idleActive ? data.idle.haRad
      : (track.length ? track[Math.max(0, Math.min(track.length - 1, Math.floor(track.length * headFrac)))].H : 0);

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

    // Off-window affordance: while the idle clock has the source below the horizon,
    // the (u,v) head parks — say so, so the pause reads as physics, not a stall.
    if (idleActive && !sourceUp && !data.scrub.dragging) {
      ctx.save();
      ctx.fillStyle = hexA(TOKENS.textSecondary, 0.8);
      ctx.font = mono(10, 600); ctx.textAlign = 'center';
      ctx.fillText('source below horizon — sampling resumes as it rises',
        px + panelSize / 2, py + panelSize - 12);
      ctx.restore();
    }

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

    // ── Guided controls: decoupled HA track (below panel) + dec slider (left) ──
    // Each control carries its own label + live readout (replaces the old combined
    // 'H … · δ …' scrub readout). Hit rects are stashed on _layout for onPointer;
    // fractions are computed against the raw track rects (also stashed).
    if (mode === 'guided' && animPhase === 'ready' && !reducedMotion) {
      const haH = rotation * 12 / Math.PI;  // continuous hour angle (radians → hours)
      const haTrack  = { x: px + 0.06 * panelSize, y: py + panelSize + 26, w: 0.88 * panelSize };
      const decTrack = { x: px - 40, y: py + 0.06 * panelSize, h: 0.88 * panelSize, vertical: true };
      data._layout.haTrack = haTrack;
      data._layout.decTrack = decTrack;
      data._layout.haCtl = drawSliderControl(ctx, haTrack, headFrac, {
        label: 'HOUR ANGLE — DRAG',
        value: `H = ${haH.toFixed(1)} h`,
        active: data.scrub.dragging === 'ha',
      });
      data._layout.decCtl = drawSliderControl(ctx, decTrack, 0.5 - data.scrub.decDeg / DEC_SPAN_DEG, {
        label: 'DECLINATION',
        value: `δ = ${data.scrub.decDeg.toFixed(1)}°`,
        active: data.scrub.dragging === 'dec',
      });
      // affordance caption, hidden once the visitor has interacted
      if (!data._touched) {
        ctx.save();
        ctx.fillStyle = TOKENS.textSecondary;
        ctx.font = mono(11, 500); ctx.textAlign = 'center';
        ctx.fillText('steer the array — hour angle turns the Earth · declination tilts the source',
          px + panelSize / 2, py + panelSize + 56);
        ctx.restore();
      }
    }
  },

  // Guided interactivity: rect-scoped drags on the two labeled controls only.
  // Hit-test against the padded hit rects drawSliderControl returned; compute the
  // drag fraction against the raw track geometry. Releasing the HA handle simply
  // hands back to the constant idle advance from the current angle (no ramp, no
  // snap — drawFrame reads data.idle.haRad which the drag kept in lock-step).
  // Declination drags never affect the spin.
  onPointer(data, ev) {
    if (ev.mode !== 'guided' || !data._layout) return;
    const L = data._layout;
    const x = ev.nx * L.w, y = ev.ny * L.h;
    const hit = (r) => r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    if (ev.type === 'down') data.scrub.dragging = hit(L.haCtl) ? 'ha' : hit(L.decCtl) ? 'dec' : null;
    if (data.scrub.dragging && (ev.type === 'down' || ev.type === 'move')) {
      data._touched = true;
      if (data.scrub.dragging === 'ha')
        data.scrub.haFrac = clamp01((x - L.haTrack.x) / L.haTrack.w);
      else
        data.scrub.decDeg = DEC_SPAN_DEG * (0.5 - clamp01((y - L.decTrack.y) / L.decTrack.h));  // top = +40°, bottom = −40°
    }
    if (ev.type === 'up' || ev.type === 'leave') {
      data.scrub.dragging = null;
    }
  },
};
