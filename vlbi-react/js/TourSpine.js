// TourSpine.js — the progress indicator IS a miniature real instrument: a tiny UV track
// (computed once from the real EHT 2017 array) that fills as acts complete. Not decorative
// — every dot is genuine computeUVPointsGl output (master prompt §1.5).
import { html, useRef, useEffect } from './core.js';
import { computeUVPointsGl } from './uvCompute.js';
import { ARRAY_PRESETS, SKY_TARGETS, TELESCOPE_COLORS } from './constants.js';
import { TOKENS } from './tourTokens.js';
import { hexA, clamp01 } from './tourScene.js';

// Computed once: real EHT 2017 coverage in Gλ, sorted by hour-angle order as produced.
const SPINE_PTS = (() => {
  const tels = ARRAY_PRESETS['EHT 2017'].map((s, i) => ({
    id: i, name: s.name, lat: s.lat, lon: s.lon, color: TELESCOPE_COLORS[i % TELESCOPE_COLORS.length], visible: true,
  }));
  const pts = computeUVPointsGl(tels, { declination: SKY_TARGETS['M87*'].dec, duration: 12, frequency: 230 });
  let max = 1;
  for (const p of pts) max = Math.max(max, Math.abs(p.u), Math.abs(p.v));
  return { pts, max };
})();

export function MiniUVSpine({ frac }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = 132, H = 32;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, r = (H / 2 - 2);
    const scale = r / SPINE_PTS.max;
    const f = clamp01(frac);
    const n = Math.floor(SPINE_PTS.pts.length * f);
    for (let i = 0; i < SPINE_PTS.pts.length; i++) {
      const p = SPINE_PTS.pts[i];
      const x = cx + p.u * scale, y = cy - p.v * scale;
      const on = i < n;
      ctx.fillStyle = on ? hexA(TOKENS.accent, 0.9) : hexA(TOKENS.textSecondary, 0.18);
      ctx.beginPath();
      ctx.arc(x, y, on ? 0.9 : 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [frac]);

  return html`<canvas ref=${ref} className="tour-spine-canvas"
    style=${{ width: '132px', height: '32px' }} aria-hidden="true"></canvas>`;
}
