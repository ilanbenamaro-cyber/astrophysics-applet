// simRender.js — pure canvas renderers for engine output, lifted from ContourMap.js
// and ImageCanvas.js with ZERO behavior change. Components import these back; tour acts
// import the same functions to draw real dirty/restored images onto their own canvases.
// (Audit §4.2 / §1.3: the draw routines were trapped inside component useEffects.)

// ── Viridis colormap LUT — 256 entries built at module load (from ContourMap.js) ──
const VIRIDIS_ANCHORS = [
  [68,1,84], [72,28,109], [61,74,137], [38,130,142],
  [31,158,137], [53,183,121], [110,206,88], [181,222,43], [253,231,37],
];
const VIRIDIS = (() => {
  const lut = [];
  const n = VIRIDIS_ANCHORS.length - 1;
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    const seg = Math.min(Math.floor(t * n), n - 1);
    const f = t * n - seg;
    const a = VIRIDIS_ANCHORS[seg];
    const b = VIRIDIS_ANCHORS[seg + 1];
    lut.push([
      Math.round(a[0] + f * (b[0] - a[0])),
      Math.round(a[1] + f * (b[1] - a[1])),
      Math.round(a[2] + f * (b[2] - a[2])),
    ]);
  }
  return lut;
})();

// ── Bilinear upscale srcN×srcN → dstSize×dstSize ──
function bilinearUpscale(data, srcN, dstSize) {
  const out = new Float64Array(dstSize * dstSize);
  for (let dy = 0; dy < dstSize; dy++) {
    const sy = dy * (srcN - 1) / (dstSize - 1);
    const sy0 = Math.floor(sy);
    const sy1 = Math.min(sy0 + 1, srcN - 1);
    const fy  = sy - sy0;
    for (let dx = 0; dx < dstSize; dx++) {
      const sx  = dx * (srcN - 1) / (dstSize - 1);
      const sx0 = Math.floor(sx);
      const sx1 = Math.min(sx0 + 1, srcN - 1);
      const fx  = sx - sx0;
      const tl  = data[sy0 * srcN + sx0];
      const tr  = data[sy0 * srcN + sx1];
      const bl  = data[sy1 * srcN + sx0];
      const br  = data[sy1 * srcN + sx1];
      out[dy * dstSize + dx] = tl*(1-fx)*(1-fy) + tr*fx*(1-fy) + bl*(1-fx)*fy + br*fx*fy;
    }
  }
  return out;
}

// ── Marching squares — returns segments for a threshold in N×N data space ──
function marchingSquares(data, N, threshold) {
  const segments = [];
  function interp(a, b) {
    if (Math.abs(b - a) < 1e-12) return 0.5;
    return (threshold - a) / (b - a);
  }
  for (let row = 0; row < N - 1; row++) {
    for (let col = 0; col < N - 1; col++) {
      const tl = data[row       * N + col];
      const tr = data[row       * N + col + 1];
      const br = data[(row + 1) * N + col + 1];
      const bl = data[(row + 1) * N + col];
      const mask =
        (tl >= threshold ? 8 : 0) |
        (tr >= threshold ? 4 : 0) |
        (br >= threshold ? 2 : 0) |
        (bl >= threshold ? 1 : 0);
      if (mask === 0 || mask === 15) continue;
      const top    = { x: col + interp(tl, tr), y: row };
      const right  = { x: col + 1,              y: row + interp(tr, br) };
      const bottom = { x: col + interp(bl, br), y: row + 1 };
      const left   = { x: col,                  y: row + interp(tl, bl) };
      const cases = {
        1:  [[bottom, left]],
        2:  [[right, bottom]],
        3:  [[right, left]],
        4:  [[top, right]],
        5:  [[top, right], [bottom, left]],
        6:  [[top, bottom]],
        7:  [[top, left]],
        8:  [[top, left]],
        9:  [[top, bottom]],
        10: [[top, left], [right, bottom]],
        11: [[top, right]],
        12: [[right, left]],
        13: [[right, bottom]],
        14: [[bottom, left]],
      };
      const segs = cases[mask];
      if (!segs) continue;
      for (const [p0, p1] of segs) {
        segments.push({ x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y });
      }
    }
  }
  return segments;
}

// ── Group segments into connected components by endpoint adjacency ──
// Linear-time spatial-hash + union-find. The previous rescan-until-stable clustering was
// worst-case O(S²·|group|) and froze the main thread for 20.6 s on the 9,836-segment
// striped dirty image (EHT 2017 @ FOV 2000 μas — measured 15.45e9 comparisons; SITE-AUDIT
// 2026-07-16). Its proximity test also compared only x-coordinates, bridging distant rows
// into one giant group. Adjacency here is the intended 2-D test: endpoints within tol on
// BOTH axes connect (marching squares emits exactly-shared endpoints on shared cell edges,
// so tol — unchanged at 0.1 — only absorbs float noise).
function groupSegments(segments, tol) {
  const n = segments.length;
  if (n === 0) return [];
  const parent = new Int32Array(n);
  for (let i = 0; i < n; i++) parent[i] = i;
  const find = (i) => {
    while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; }
    return i;
  };
  // Hash each endpoint into a tol-sized grid cell; candidates for adjacency can only
  // live in the endpoint's own or the 8 neighboring cells.
  const cells = new Map();   // "cx,cy" → [{x, y, seg}, …]
  const addEndpoint = (x, y, seg) => {
    const cx = Math.round(x / tol), cy = Math.round(y / tol);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = cells.get((cx + dx) + ',' + (cy + dy));
        if (!bucket) continue;
        for (const p of bucket) {
          if (Math.abs(p.x - x) < tol && Math.abs(p.y - y) < tol) {
            const ra = find(p.seg), rb = find(seg);
            if (ra !== rb) parent[rb] = ra;
          }
        }
      }
    }
    const key = cx + ',' + cy;
    let own = cells.get(key);
    if (!own) { own = []; cells.set(key, own); }
    own.push({ x, y, seg });
  };
  for (let i = 0; i < n; i++) {
    addEndpoint(segments[i].x0, segments[i].y0, i);
    addEndpoint(segments[i].x1, segments[i].y1, i);
  }
  const byRoot = new Map();
  const groups = [];
  for (let i = 0; i < n; i++) {
    const root = find(i);
    let group = byRoot.get(root);
    if (!group) { group = []; byRoot.set(root, group); groups.push(group); }
    group.push(segments[i]);
  }
  return groups;
}

function groupBBoxMaxDim(group) {
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for (const s of group) {
    minX=Math.min(minX,s.x0,s.x1);
    maxX=Math.max(maxX,s.x0,s.x1);
    minY=Math.min(minY,s.y0,s.y1);
    maxY=Math.max(maxY,s.y0,s.y1);
  }
  return Math.max(maxX-minX, maxY-minY);
}

// ── fmtVal — scientific notation for very small / very large values ──
export function fmtVal(v) {
  if (Math.abs(v) < 0.001 || Math.abs(v) > 9999) return v.toExponential(2);
  return v.toFixed(4);
}

// ── Contour levels — exported so ContourMap's JSX legend can map over them ──
export const CONTOUR_LEVELS = [
  { frac: 0.5,  label: '½ peak',    pct: '50%', lw: 2.5, dash: [],     alpha: 1.0  },
  { frac: 0.1,  label: '¹⁄₁₀ peak', pct: '10%', lw: 1.8, dash: [],     alpha: 0.85 },
  { frac: 0.02, label: '¹⁄₅₀ peak', pct: '2%',  lw: 1.2, dash: [4, 4], alpha: 0.65 },
];

// ── drawContour ────────────────────────────────────────────────────────────────
// Draws a professional radio-astronomy contour map of `data` (N×N Float64Array) onto a
// 512×512 canvas context. Returns { isEmpty, stats, activeLevels } so the caller can mirror
// the React state ContourMap previously set inline. Logic verbatim from ContourMap.js:171–383.
export function drawContour(ctx, data, { N, beamSigmaU = 2, beamSigmaV = 2, beamPA = 0, dynamicRange = 0 }) {
  const DST = 512;

  if (!data || data.length === 0) {
    ctx.fillStyle = '#0a0a0a';  // --bg-1 neutral (was off-token blue-purple; SITE-AUDIT 3.4)
    ctx.fillRect(0, 0, DST, DST);
    return { isEmpty: true, stats: null, activeLevels: [] };
  }

  // ── Bilinear upscale + normalize + viridis ──
  const upscaled = bilinearUpscale(data, N, DST);
  let upMin = Infinity, upMax = -Infinity;
  for (let i = 0; i < upscaled.length; i++) {
    if (upscaled[i] < upMin) upMin = upscaled[i];
    if (upscaled[i] > upMax) upMax = upscaled[i];
  }
  const upRange = upMax - upMin || 1;
  const imgData = ctx.createImageData(DST, DST);
  const px = imgData.data;
  for (let i = 0; i < DST * DST; i++) {
    const t   = (upscaled[i] - upMin) / upRange;
    const idx = Math.min(Math.floor(t * 255), 255);
    const [r, g, b] = VIRIDIS[idx];
    px[i*4]   = r;
    px[i*4+1] = g;
    px[i*4+2] = b;
    px[i*4+3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  // ── Stats from N×N source data ──
  let minV = Infinity, maxV = -Infinity;
  for (let i = 0; i < N * N; i++) {
    if (data[i] < minV) minV = data[i];
    if (data[i] > maxV) maxV = data[i];
  }
  const borderVals = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (r < 8 || r >= N - 8 || c < 8 || c >= N - 8) borderVals.push(data[r * N + c]);
    }
  }
  borderVals.sort((a, b) => a - b);
  const med     = borderVals[Math.floor(borderVals.length / 2)];
  const absDevs = borderVals.map(v => Math.abs(v - med)).sort((a, b) => a - b);
  const madSigma = 1.4826 * absDevs[Math.floor(absDevs.length / 2)];
  const safeSigma = (isFinite(madSigma) && madSigma > 0 && madSigma < maxV * 0.1)
    ? madSigma
    : (maxV > 0 ? maxV * 0.01 : 0);
  const dataRange = maxV - minV || 1;
  const cbX = (v) => 8 + Math.max(0, Math.min(DST - 16, (v - minV) / dataRange * (DST - 16)));

  // ── Contour lines (×2 for 512 canvas) ──
  const MIN_MAX_DIM = 15;
  const dr = dynamicRange;
  const activeCandidates = CONTOUR_LEVELS.filter(l => {
    if (l.frac === 0.5)  return true;
    if (l.frac === 0.1)  return dr > 80;
    if (l.frac === 0.02) return dr > 200;
    return false;
  });

  const passed = [];
  if (maxV > 0) {
    for (const level of activeCandidates) {
      const threshold = maxV * level.frac;
      if (threshold <= 2 * safeSigma) continue;
      passed.push(level);
      const segs   = marchingSquares(data, N, threshold);
      const groups = groupSegments(segs, 0.1);
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${level.alpha})`;
      ctx.lineWidth   = level.lw;
      ctx.setLineDash(level.dash);
      ctx.beginPath();
      const onBoundary = (x, y) => x < 1 || x > DST - 1 || y < 1 || y > DST - 1;
      for (const group of groups) {
        if (groupBBoxMaxDim(group) < MIN_MAX_DIM) continue;
        for (const seg of group) {
          const x0 = seg.x0 * 2, y0 = seg.y0 * 2;
          const x1 = seg.x1 * 2, y1 = seg.y1 * 2;
          if (onBoundary(x0, y0) || onBoundary(x1, y1)) continue;
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
        }
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  // ── Axis tick marks ──
  const center = DST / 2;
  const TICK   = 8;
  const tickPx = [128, 256];
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth   = 1;
  ctx.setLineDash([]);
  ctx.beginPath();
  for (const off of tickPx) {
    ctx.moveTo(center - off, 0);    ctx.lineTo(center - off, TICK);
    ctx.moveTo(center + off, 0);    ctx.lineTo(center + off, TICK);
    ctx.moveTo(0, center - off);    ctx.lineTo(TICK, center - off);
    ctx.moveTo(0, center + off);    ctx.lineTo(TICK, center + off);
  }
  ctx.stroke();
  ctx.restore();

  // ── Colorbar gradient + ticks ──
  const CB_Y = 455, CB_H = 28, CB_TICK_H = 18;
  const grad = ctx.createLinearGradient(8, CB_Y, DST - 8, CB_Y);
  for (let i = 0; i <= 10; i++) {
    const [r, g, b] = VIRIDIS[Math.round(i / 10 * 255)];
    grad.addColorStop(i / 10, `rgb(${r},${g},${b})`);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(8, CB_Y, DST - 16, CB_H);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth   = 0.5;
  ctx.setLineDash([]);
  ctx.strokeRect(8, CB_Y, DST - 16, CB_H);

  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth   = 1;
  for (const f of [0.25, 0.5, 0.75]) {
    const x = f * DST;
    ctx.beginPath();
    ctx.moveTo(x, CB_Y + CB_H * 0.35);
    ctx.lineTo(x, CB_Y + CB_H);
    ctx.stroke();
  }

  ctx.save();
  for (const level of CONTOUR_LEVELS) {
    const x        = cbX(maxV * level.frac);
    const isActive = passed.some(p => p.frac === level.frac);
    ctx.strokeStyle = isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth   = isActive ? 1.8 : 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x, CB_Y - CB_TICK_H);
    ctx.lineTo(x, CB_Y);
    ctx.stroke();
  }
  ctx.restore();

  // ── Beam ellipse ──
  const scale    = DST / N;
  const rxCanvas = Math.max(4, beamSigmaU * scale * 2.355 / 2);
  const ryCanvas = Math.max(4, beamSigmaV * scale * 2.355 / 2);
  const BEAM_CX = DST - 80, BEAM_CY = CB_Y - 35;
  ctx.save();
  ctx.fillStyle   = 'rgba(255,255,255,1.0)';
  ctx.strokeStyle = 'white';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.ellipse(BEAM_CX, BEAM_CY, rxCanvas, ryCanvas, beamPA, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  const stats = {
    minV, maxV, sigma: safeSigma,
    cbMin:  fmtVal(minV),
    cbMax:  fmtVal(maxV),
    cbQ1:   fmtVal(minV + dataRange * 0.25),
    cbMid:  fmtVal(minV + dataRange * 0.5),
    cbQ3:   fmtVal(minV + dataRange * 0.75),
    activeLevelPcts: passed.map(l => l.pct),
  };
  return { isEmpty: false, stats, activeLevels: passed };
}

// ── drawHot ──────────────────────────────────────────────────────────────────
// Render an N×N Float64Array as a hot-colormap image (black→red→orange→yellow→white)
// onto `ctx`. Verbatim from ImageCanvas.js:6–40 (renderImageData).
export function drawHot(ctx, data, N) {
  if (!data) return;
  let minV = Infinity, maxV = -Infinity;
  for (let i = 0; i < N*N; i++) {
    if (data[i] < minV) minV = data[i];
    if (data[i] > maxV) maxV = data[i];
  }
  const range = maxV - minV || 1;
  const imgData = ctx.createImageData(N, N);
  const d = imgData.data;
  for (let i = 0; i < N*N; i++) {
    const t = (data[i] - minV) / range;
    let r, g, b;
    if (t < 0.33) {
      r = Math.round(t / 0.33 * 200);
      g = 0; b = 0;
    } else if (t < 0.66) {
      const tt = (t - 0.33) / 0.33;
      r = Math.round(200 + tt * 55);
      g = Math.round(tt * 140);
      b = 0;
    } else {
      const tt = (t - 0.66) / 0.34;
      r = 255;
      g = Math.round(140 + tt * 115);
      b = Math.round(tt * 255);
    }
    d[i*4]   = r;
    d[i*4+1] = g;
    d[i*4+2] = b;
    d[i*4+3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
}
