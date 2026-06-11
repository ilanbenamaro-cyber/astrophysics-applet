// tourGalaxy.js — the shared deep-space background behind every tour act.
//
// Three parallax star layers (far→near at increasing drift speed) over a nebula
// wash pre-rendered ONCE at half resolution (soft by construction — no per-frame
// blur, so ctx.filter is never touched at draw time). SUBORDINATE by design
// (DESIGN-LANGUAGE: gold = live computation stays the brightest, sharpest thing
// on screen): nebula effective alpha ≤ ~0.08, stars dim and small, motion slow.
// Colours from the licensed cinematic family only (deep slate / amber / neutral
// darks). Reduced motion: pass T = 0 every frame → a static field, no drift.
import { TOKENS } from './tourTokens.js';
import { hexA } from './tourScene.js';

// Deterministic PRNG (same LCG scheme the old makeStars used) — per-act seeds
// give each act its own sky without any per-frame randomness.
function mulberry(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// far → near: more stars far (dim, slow), fewer near (brighter, faster drift)
const LAYERS = [
  { n: 170, rMin: 0.30, rMax: 0.80, alpha: 0.48, drift: 1.2 },
  { n: 100, rMin: 0.45, rMax: 1.10, alpha: 0.65, drift: 2.8 },
  { n: 50,  rMin: 0.70, rMax: 1.55, alpha: 0.85, drift: 5.5 },
];

const NEBULA_PALETTE = ['#3a4a6a', '#9E7E38', '#262630', '#3a4a6a', '#202836'];

export function createGalaxy(w, h, { seed = 1, intensity = 1 } = {}) {
  const rand = mulberry(seed * 9973 + 17);
  const layers = LAYERS.map(L => ({
    alpha: L.alpha, drift: L.drift,
    stars: Array.from({ length: L.n }, () => ({
      x: rand() * w, y: rand() * h,
      r: L.rMin + rand() * (L.rMax - L.rMin),
      tw: rand() * Math.PI * 2, sp: 0.4 + rand() * 1.2,
    })),
  }));

  // Nebula + vignette, half-res (upscaling at draw = free softness).
  const neb = document.createElement('canvas');
  neb.width = Math.max(2, Math.round(w / 2));
  neb.height = Math.max(2, Math.round(h / 2));
  const nctx = neb.getContext('2d');
  for (let i = 0; i < 5; i++) {
    const bx = rand() * neb.width, by = rand() * neb.height;
    const br = (0.25 + rand() * 0.45) * Math.max(neb.width, neb.height);
    const g = nctx.createRadialGradient(bx, by, 0, bx, by, br);
    g.addColorStop(0, hexA(NEBULA_PALETTE[i % NEBULA_PALETTE.length], 0.26));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    nctx.fillStyle = g;
    nctx.fillRect(0, 0, neb.width, neb.height);
  }
  const vg = nctx.createRadialGradient(
    neb.width / 2, neb.height / 2, Math.min(neb.width, neb.height) * 0.35,
    neb.width / 2, neb.height / 2, Math.max(neb.width, neb.height) * 0.75,
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.35)');
  nctx.fillStyle = vg;
  nctx.fillRect(0, 0, neb.width, neb.height);

  return { w, h, intensity, layers, neb };
}

// Cache-or-rebuild helper: scenes keep the galaxy on their data object and the
// field rebuilds itself deterministically if the canvas size changes.
export function ensureGalaxy(slot, w, h, opts) {
  if (!slot._galaxy || slot._galaxy.w !== w || slot._galaxy.h !== h) {
    slot._galaxy = createGalaxy(w, h, opts);
  }
  return slot._galaxy;
}

export function drawGalaxy(ctx, gal, T) {
  const { w, h, intensity, layers, neb } = gal;
  ctx.save();
  // Nebula: a slow breath instead of lateral drift (a non-tiling wash would seam).
  ctx.globalAlpha = (0.58 + 0.10 * Math.sin(T * 0.05)) * intensity;
  ctx.drawImage(neb, 0, 0, w, h);
  // Star layers: parallax via per-layer drift speed, gentle twinkle.
  ctx.fillStyle = '#e8e8f0';
  for (const L of layers) {
    const off = (T * L.drift) % w;
    for (const st of L.stars) {
      let x = st.x - off;
      if (x < 0) x += w;
      const tw = 0.55 + 0.45 * Math.sin(T * st.sp + st.tw);
      ctx.globalAlpha = L.alpha * intensity * tw;
      ctx.beginPath();
      ctx.arc(x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
