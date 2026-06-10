// tourScene.js — shared canvas primitives for the engine-real tour acts.
// Low-level only: DPR-correct canvas setup, the site easing curve, a starfield, a
// shaded Earth model, and UV-plane axes. Higher-level physics annotations live in
// tourAnnotations.js and build on these. All colour comes from tourTokens.js (so the
// tour follows the app's theme + a11y), all geometry from uvCompute.js.
import { TOKENS } from './tourTokens.js';
import { latLonToECEF } from './uvCompute.js';
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

// ── Starfield (space backdrop) ──────────────────────────────────────────────────
export function makeStars(n, w, h, seed = 1) {
  let s = seed >>> 0;
  const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const stars = [];
  for (let i = 0; i < n; i++) {
    stars.push({ x: rand() * w, y: rand() * h, r: 0.3 + rand() * 1.1, tw: rand() * Math.PI * 2, sp: 0.6 + rand() * 1.4 });
  }
  return stars;
}

export function drawStarfield(ctx, stars, T, alpha = 1) {
  ctx.save();
  for (const st of stars) {
    const a = alpha * (0.35 + 0.45 * (0.5 + 0.5 * Math.sin(T * st.sp + st.tw)));
    ctx.globalAlpha = a;
    ctx.fillStyle = '#e8e8f0';
    ctx.beginPath();
    ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ── Earth model ─────────────────────────────────────────────────────────────────
// A shaded sphere with a day/night terminator. `rotation` (rad) spins longitude.
// Realistic blue ocean is on-brand for the globe specifically (DESIGN-LANGUAGE §1).
export function drawEarth(ctx, cx, cy, r, rotation = 0, opts = {}) {
  const { nightShade = TOKENS.cool } = opts;
  ctx.save();
  // Ocean sphere with subtle radial shade
  const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
  g.addColorStop(0, '#2a4a72');
  g.addColorStop(0.7, '#1b3350');
  g.addColorStop(1, '#0f1f33');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Night side wash (right limb)
  const ng = ctx.createLinearGradient(cx, cy, cx + r, cy);
  ng.addColorStop(0, 'rgba(0,0,0,0)');
  ng.addColorStop(1, hexA(nightShade, 0.55));
  ctx.fillStyle = ng;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Limb
  ctx.strokeStyle = hexA(TOKENS.textSecondary, 0.35);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  // Graticule (a few meridians/parallels for rotation cue)
  ctx.strokeStyle = hexA('#5a7aa0', 0.18);
  ctx.lineWidth = 0.75;
  for (let m = 0; m < 6; m++) {
    const lon = rotation + m * Math.PI / 6;
    ctx.beginPath();
    for (let k = 0; k <= 40; k++) {
      const lat = -Math.PI / 2 + (k / 40) * Math.PI;
      const p = sphereProject(cx, cy, r, lat, lon);
      if (p.front) (k === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    }
    ctx.stroke();
  }
  for (let pa = 1; pa < 4; pa++) {
    const lat = -Math.PI / 2 + pa * Math.PI / 4;
    ctx.beginPath();
    let started = false;
    for (let k = 0; k <= 60; k++) {
      const lon = rotation + (k / 60) * Math.PI * 2;
      const p = sphereProject(cx, cy, r, lat, lon);
      if (p.front) { p.front && (started ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); started = true; }
      else started = false;
    }
    ctx.stroke();
  }
  ctx.restore();
}

// Orthographic projection of (lat,lon) onto a sphere centered (cx,cy) radius r.
// Viewer looks down +z; `front` is true when the point faces the viewer.
export function sphereProject(cx, cy, r, lat, lon) {
  const x = Math.cos(lat) * Math.sin(lon);
  const y = Math.sin(lat);
  const z = Math.cos(lat) * Math.cos(lon);
  return { x: cx + r * x, y: cy - r * y, front: z >= 0, z };
}

// Place a station (deg lat/lon) on the drawn globe, with `rotation` applied.
export function stationOnGlobe(cx, cy, r, latDeg, lonDeg, rotation) {
  const lat = latDeg * Math.PI / 180;
  const lon = lonDeg * Math.PI / 180 + rotation;
  return sphereProject(cx, cy, r, lat, lon);
}

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
