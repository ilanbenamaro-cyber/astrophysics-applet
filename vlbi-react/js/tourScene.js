// tourScene.js — shared canvas primitives for the engine-real tour acts.
// Low-level only: DPR-correct canvas setup, the site easing curve,
// ring-source sizing, and UV-plane axes. Higher-level physics annotations live in
// tourAnnotations.js; the textured Earth lives in tourEarth.js. All colour comes
// from tourTokens.js (so the tour follows the app's theme + a11y).
import { TOKENS } from './tourTokens.js';
import { TELESCOPE_COLORS } from './constants.js';

// Turn an ARRAY_PRESETS station list into the engine's {id,name,lat,lon,color,visible}
// shape (same mapping useSimulation.loadEHTPresets uses). Optional satellite appended.
export function toTelescopes(stations, satellite) {
  const tels = stations.map((s, idx) => ({
    id: idx, name: s.name, lat: s.lat, lon: s.lon,
    color: TELESCOPE_COLORS[idx % TELESCOPE_COLORS.length], visible: true,
  }));
  if (satellite) tels.push({ id: tels.length, ...satellite, visible: true });
  return tels;
}

// ── Ring-source sizing (Acts C & D) ─────────────────────────────────────────────
// measureRingFraction + zoomSource now live in simCore.js (the live app uses them
// too — one shared truth for ring-true source sizing). Re-exported here so the
// tour scenes' imports are unchanged.
export { measureRingFraction, zoomSource } from './simCore.js';

// Max |u|,|v| extent (Gλ) × 1.2 — matches the app's UV auto-scale intent.
export function uvExtentGl(pts) {
  let m = 0;
  for (const p of pts) m = Math.max(m, Math.abs(p.u), Math.abs(p.v));
  return (m || 1) * 1.2;
}

// The site's single easing curve (DESIGN-LANGUAGE / master prompt). cubic-bezier(.25,.46,.45,.94).
export function ease(t) {
  // Newton-solve the bezier x(t)=t param, then evaluate y. Cheap + accurate enough for animation.
  const cx = 0.25, cy = 0.46, ex = 0.45, ey = 0.94;
  const bx = (u) => { const v = 1 - u; return 3*v*v*u*cx + 3*v*u*u*ex + u*u*u; };
  const by = (u) => { const v = 1 - u; return 3*v*v*u*cy + 3*v*u*u*ey + u*u*u; };
  if (t <= 0) return 0; if (t >= 1) return 1;
  let u = t;
  for (let i = 0; i < 5; i++) {
    const x = bx(u) - t;
    const dx = 3*(1-u)*(1-u)*cx + 6*(1-u)*u*(ex-cx) + 3*u*u*(1-ex);
    if (Math.abs(dx) < 1e-6) break;
    u -= x / dx;
    u = Math.max(0, Math.min(1, u));
  }
  return by(u);
}

export const clamp01 = (x) => Math.max(0, Math.min(1, x));
// Normalised progress of a beat: how far T (s) is through [start, start+dur].
export const beatT = (T, start, dur) => clamp01((T - start) / dur);

// DPR-correct sizing from the element's CSS box (constraint: offsetWidth × dpr).
// Returns { ctx, w, h, dpr } in CSS pixels (ctx is pre-scaled so you draw in CSS px).
export function setupCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.offsetWidth || canvas.clientWidth || 960;
  const h = canvas.offsetHeight || canvas.clientHeight || 540;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h, dpr };
}

export function clearScene(ctx, w, h, color) {
  ctx.fillStyle = color || TOKENS.bg1;
  ctx.fillRect(0, 0, w, h);
}

// (The single-layer starfield that lived here was superseded by tourGalaxy.js —
//  multi-layer parallax + nebula wash, one shared background for every act.)

// (The hand-drawn Earth model that lived here was retired in the polish pass —
//  Acts B & E now reuse the main page's textured Three.js globe via tourEarth.js.)

// ── UV-plane axes ─────────────────────────────────────────────────────────────
// Draws centered axes for a UV panel of half-extent `maxGl` gigawavelengths into the
// rect (x,y,size). Returns a mapper uv→screen so callers can plot real points.
export function drawUVAxes(ctx, x, y, size, maxGl, opts = {}) {
  const { label = 'u, v  (Gλ)' } = opts;
  const cx = x + size / 2, cy = y + size / 2;
  const scale = (size / 2) / (maxGl || 1);
  ctx.save();
  // frame
  ctx.strokeStyle = hexA(TOKENS.border, 1);
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, size, size);
  // crosshair
  ctx.strokeStyle = hexA(TOKENS.textSecondary, 0.3);
  ctx.beginPath();
  ctx.moveTo(x, cy); ctx.lineTo(x + size, cy);
  ctx.moveTo(cx, y); ctx.lineTo(cx, y + size);
  ctx.stroke();
  // ring ticks at 25/50/75%
  ctx.strokeStyle = hexA(TOKENS.textSecondary, 0.16);
  for (const f of [0.25, 0.5, 0.75, 1]) {
    ctx.beginPath();
    ctx.arc(cx, cy, (size / 2) * f, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = TOKENS.textSecondary;
  ctx.font = `500 11px ${TOKENS.fontMono}`;
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 6, y + size - 8);
  ctx.restore();
  return (u, v) => ({ x: cx + u * scale, y: cy - v * scale });
}

// ── colour helpers ──────────────────────────────────────────────────────────────
// "#rrggbb" + alpha → "rgba(...)". Tolerates already-rgba strings (returns as-is).
export function hexA(hex, a) {
  if (!hex || hex[0] !== '#') return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
