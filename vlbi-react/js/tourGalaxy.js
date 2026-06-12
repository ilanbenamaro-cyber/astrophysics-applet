// tourGalaxy.js — the shared deep-space background behind every tour act.
//
// Four parallax star layers (far→near at increasing drift speed) over a nebula
// wash pre-rendered ONCE at half resolution (soft by construction — no per-frame
// blur, so ctx.filter is never touched at draw time). Vibrant but SUBORDINATE
// (DESIGN-LANGUAGE: gold = live computation stays the brightest, sharpest thing
// on screen): nebula cores reach effective alpha ~0.10–0.18 (rawStop × breath
// × per-act intensity), always behind a clear value/contrast gap to the data.
// Palette: the site family widened with deep cosmic hues (slate → indigo →
// violet → teal → faint magenta + amber) — final-pass license, value-controlled,
// never candy-bright. Reduced motion: pass T = 0 every frame → static field.
import { hexA } from './tourScene.js';

// Deterministic PRNG (same LCG scheme the old makeStars used) — per-act seeds
// give each act its own sky without any per-frame randomness.
function mulberry(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// far → near: more stars far (dim, slow), fewer near (brighter, faster drift).
// The last layer is a sparse "hero" field: a handful of larger, tinted stars
// that give the sky depth without competing with the gold data layer.
const STAR_TINTS = ['#e8e8f0', '#f0e0c8', '#c8d4f0'];
const LAYERS = [
  { n: 220, rMin: 0.30, rMax: 0.80, alpha: 0.48, drift: 1.2 },
  { n: 130, rMin: 0.45, rMax: 1.10, alpha: 0.65, drift: 2.8 },
  { n: 70,  rMin: 0.70, rMax: 1.55, alpha: 0.85, drift: 5.5 },
  { n: 22,  rMin: 1.10, rMax: 2.20, alpha: 0.95, drift: 8.0, tinted: true },
];

// Deep-space hue band: slate → indigo → violet → teal → faint magenta + amber.
// Stops are one notch brighter than the site's chrome darks so the hue still
// reads through the low draw alpha — the alpha budget keeps them subordinate.
const NEBULA_PALETTE = [
  '#4a5e8a', // deep slate (the licensed cool)
  '#46549e', // indigo
  '#6a4a9e', // violet
  '#3a7a7e', // deep teal
  '#7a4472', // faint magenta
  '#B8924A', // amber (site family)
];

export function createGalaxy(w, h, { seed = 1, intensity = 1 } = {}) {
  const rand = mulberry(seed * 9973 + 17);
  const layers = LAYERS.map(L => ({
    alpha: L.alpha, drift: L.drift,
    stars: Array.from({ length: L.n }, () => ({
      x: rand() * w, y: rand() * h,
      r: L.rMin + rand() * (L.rMax - L.rMin),
      tw: rand() * Math.PI * 2, sp: 0.4 + rand() * 1.2,
      tint: L.tinted ? STAR_TINTS[Math.floor(rand() * STAR_TINTS.length)] : STAR_TINTS[0],
    })),
  }));

  // Nebula + vignette, half-res (upscaling at draw = free softness).
  // Each cloud is two-stop: a tight bright core inside a wide soft halo —
  // multiple coloured clouds at varied scales read as genuine depth.
  const neb = document.createElement('canvas');
  neb.width = Math.max(2, Math.round(w / 2));
  neb.height = Math.max(2, Math.round(h / 2));
  const nctx = neb.getContext('2d');
  const maxDim = Math.max(neb.width, neb.height);
  const BLOBS = 12;
  for (let i = 0; i < BLOBS; i++) {
    const bx = rand() * neb.width, by = rand() * neb.height;
    const br = (0.20 + rand() * 0.42) * maxDim;
    const coreA = 0.38 + rand() * 0.12;        // raw core stop 0.38–0.50
    const hue = NEBULA_PALETTE[i % NEBULA_PALETTE.length];
    const g = nctx.createRadialGradient(bx, by, 0, bx, by, br);
    g.addColorStop(0, hexA(hue, coreA));
    g.addColorStop(0.28, hexA(hue, 0.14));     // soft halo falloff
    g.addColorStop(0.60, hexA(hue, 0.07));     // wide coloured skirt
    g.addColorStop(1, 'rgba(0,0,0,0)');
    nctx.fillStyle = g;
    nctx.fillRect(0, 0, neb.width, neb.height);
  }
  const vg = nctx.createRadialGradient(
    neb.width / 2, neb.height / 2, Math.min(neb.width, neb.height) * 0.35,
    neb.width / 2, neb.height / 2, maxDim * 0.75,
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
  ctx.globalAlpha = (0.70 + 0.10 * Math.sin(T * 0.05)) * intensity;
  ctx.drawImage(neb, 0, 0, w, h);
  // Star layers: parallax via per-layer drift speed, gentle twinkle.
  for (const L of layers) {
    const off = (T * L.drift) % w;
    for (const st of L.stars) {
      let x = st.x - off;
      if (x < 0) x += w;
      const tw = 0.55 + 0.45 * Math.sin(T * st.sp + st.tw);
      ctx.globalAlpha = L.alpha * intensity * tw;
      ctx.fillStyle = st.tint;
      ctx.beginPath();
      ctx.arc(x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
