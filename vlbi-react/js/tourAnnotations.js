// tourAnnotations.js — the reusable physics-annotation layer for the tour.
// Each function draws ONE annotation type over REAL engine output onto a CSS-pixel ctx.
// Because they draw onto the act's own canvas (not a DOM overlay), they can never
// intercept pointer events (gate G8 is satisfied by construction). Colour semantics:
// gold accent = the live, being-computed data layer; amber = structure; orange = warm
// physical phenomena. All from tourTokens.js.
import { TOKENS } from './tourTokens.js';
import { hexA, ease, clamp01 } from './tourScene.js';

const mono = (px, w = 500) => `${w} ${px}px ${TOKENS.fontMono}`;

// ── BaselineVector ───────────────────────────────────────────────────────────
// A real baseline between two station screen points, labeled by IDENTITY in km.
// `label` names WHICH baseline this is (e.g. "|B| ALMA–IRAM") so it can never be
// confused with the array max or the coverage extent shown in the same frame (W1.1).
export function drawBaselineVector(ctx, p1, p2, baselineKm, opts = {}) {
  const { color = TOKENS.amber, alpha = 1, showLabel = true, label = '|B|' } = opts;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = hexA(color, 0.9);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
  ctx.setLineDash([]);
  for (const p of [p1, p2]) {
    ctx.fillStyle = TOKENS.accent;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (showLabel && baselineKm != null) {
    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
    ctx.fillStyle = TOKENS.textPrimary;
    ctx.font = mono(12, 600);
    ctx.textAlign = 'center';
    ctx.fillText(`${label} = ${Math.round(baselineKm).toLocaleString('en-US')} km`, mx, my - 8);
  }
  ctx.restore();
}

// ── UVTrace ───────────────────────────────────────────────────────────────────
// Animated path of REAL (u,v) points. `mapUV(u,v)→{x,y}` from drawUVAxes.
// `points` = [{u,v}] in Gλ. `frac` ∈ [0,1] reveals the path; a gold dot marks the head.
export function drawUVTrace(ctx, mapUV, points, frac = 1, opts = {}) {
  if (!points || points.length === 0) return;
  const { color = TOKENS.accent, width = 1.6, dot = true, mirror = true } = opts;
  const n = Math.max(1, Math.floor(points.length * clamp01(frac)));
  ctx.save();
  ctx.strokeStyle = hexA(color, 0.95);
  ctx.lineWidth = width;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const p = mapUV(points[i].u, points[i].v);
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  if (mirror) {
    // conjugate (-u,-v) — the physically-required Hermitian half
    ctx.strokeStyle = hexA(color, 0.4);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p = mapUV(-points[i].u, -points[i].v);
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
  if (dot && n > 0) {
    const head = mapUV(points[n - 1].u, points[n - 1].v);
    ctx.fillStyle = TOKENS.accent;
    ctx.shadowColor = hexA(TOKENS.accent, 0.8);
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(head.x, head.y, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

// ── UV coverage scatter (full array) ──────────────────────────────────────────
// `points` may carry per-point `color`; reveal with `frac`.
export function drawUVPoints(ctx, mapUV, points, frac = 1, opts = {}) {
  if (!points || points.length === 0) return;
  const { radius = 1.1, defaultColor = TOKENS.accent } = opts;
  const n = Math.floor(points.length * clamp01(frac));
  ctx.save();
  for (let i = 0; i < n; i++) {
    const pt = points[i];
    const s = mapUV(pt.u, pt.v);
    ctx.fillStyle = hexA(pt.color || defaultColor, 0.85);
    ctx.beginPath();
    ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ── FillGauge ─────────────────────────────────────────────────────────────────
// Arc gauge animating to a real UV-fill percentage. `pct` is the target (0–100),
// `frac` eases the sweep in.
export function drawFillGauge(ctx, cx, cy, r, pct, frac = 1, opts = {}) {
  const { label = 'UV fill' } = opts;
  const a0 = -Math.PI / 2;
  const shown = pct * ease(clamp01(frac));
  const a1 = a0 + (shown / 100) * Math.PI * 2;
  ctx.save();
  ctx.lineWidth = Math.max(3, r * 0.16);
  ctx.lineCap = 'round';
  ctx.strokeStyle = hexA(TOKENS.border, 1);
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = TOKENS.accent;
  ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke();
  ctx.fillStyle = TOKENS.textPrimary;
  ctx.font = mono(Math.round(r * 0.42), 600);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(shown < 0.1 ? shown.toFixed(3) + '%' : shown.toFixed(2) + '%', cx, cy - 2);
  ctx.font = mono(Math.round(r * 0.2), 500);
  ctx.fillStyle = TOKENS.textSecondary;
  ctx.fillText(label.toUpperCase(), cx, cy + r * 0.34);
  ctx.restore();
}

// ── ResolutionCallout ──────────────────────────────────────────────────────────
// A flat site-panel showing θ = λ/B with live substitution. `lines` = array of strings.
export function drawResolutionCallout(ctx, x, y, lines, opts = {}) {
  const { w = 230, pad = 12, title = 'θ = λ / B' } = opts;
  const lh = 18;
  const h = pad * 2 + lh + lines.length * lh;
  ctx.save();
  ctx.fillStyle = hexA(TOKENS.bg2, 0.92);
  ctx.strokeStyle = hexA(TOKENS.border, 1);
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill(); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = TOKENS.accent;
  ctx.font = mono(13, 600);
  ctx.fillText(title, x + pad, y + pad + 13);
  ctx.fillStyle = TOKENS.textSecondary;
  ctx.font = mono(12, 500);
  lines.forEach((ln, i) => ctx.fillText(ln, x + pad, y + pad + 13 + (i + 1) * lh));
  ctx.restore();
}

// ── ResidualSparkline ──────────────────────────────────────────────────────────
// Live CLEAN convergence: plots {iter, residual} from worker progress messages.
// `series` = [{iter, residual}]. Log-y, normalised to the first residual.
export function drawResidualSparkline(ctx, x, y, w, h, series, opts = {}) {
  const { title = 'CLEAN residual' } = opts;
  ctx.save();
  ctx.fillStyle = hexA(TOKENS.bg2, 0.92);
  ctx.strokeStyle = hexA(TOKENS.border, 1);
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = TOKENS.textSecondary;
  ctx.font = mono(10, 600);
  ctx.textAlign = 'left';
  ctx.fillText(title.toUpperCase(), x + 10, y + 16);
  if (!series || series.length < 2) {
    // CLEAN stopped before its first subtraction: every residual peak was already
    // below the 3σ noise floor. State it — an empty plot would read as a bug.
    ctx.fillStyle = hexA(TOKENS.textSecondary, 0.75);
    ctx.font = mono(10, 500);
    ctx.textAlign = 'center';
    ctx.fillText('no components above 3σ — noise-limited', x + w / 2, y + h / 2 + 8);
  }
  if (series && series.length >= 2) {
    const r0 = Math.max(series[0].residual, 1e-9);
    const plot = series.map(s => Math.log10(Math.max(s.residual, 1e-9) / r0)); // ≤ 0
    const lo = Math.min(...plot, -0.1), hi = 0;
    const padX = 12, padTop = 24, padBot = 10;
    const px = (i) => x + padX + (w - 2 * padX) * (i / (series.length - 1));
    const py = (val) => y + padTop + (h - padTop - padBot) * (1 - (val - lo) / (hi - lo));
    ctx.strokeStyle = TOKENS.accent;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    plot.forEach((v, i) => i === 0 ? ctx.moveTo(px(i), py(v)) : ctx.lineTo(px(i), py(v)));
    ctx.stroke();
    const last = plot.length - 1;
    ctx.fillStyle = TOKENS.accent;
    ctx.beginPath(); ctx.arc(px(last), py(plot[last]), 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = TOKENS.textSecondary;
    ctx.font = mono(10, 500);
    ctx.textAlign = 'right';
    ctx.fillText(`iter ${series[last].iter}`, x + w - 10, y + 16);
  }
  ctx.restore();
}

// (ConvolutionReveal was retired with Act C's pipeline restage — the causal
//  sparse→dirty→CLEAN sequence replaced the swept-beam intro.)

// rounded-rect path helper
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
