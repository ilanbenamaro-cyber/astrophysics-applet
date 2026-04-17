// ContourMap.js — Professional radio astronomy contour map with viridis colormap.
import { html, useState, useEffect, useRef } from './core.js';
import { InfoTooltip } from './InfoTooltip.js';

// ── Viridis colormap LUT — 256 entries built at module load ───────────────────
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

// ── Bilinear upscale from srcN×srcN to dstSize×dstSize ───────────────────────
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

// ── Marching squares — verbatim copy from ImageCanvas.js ─────────────────────
// Returns [{x0,y0,x1,y1}] segments for the given threshold in N×N data space.
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

// ── Group segments into connected components by proximity ─────────────────────
// Uses bounding-box max dimension to filter sidelobe islands: small islands have
// tiny extents (~5-13 px), real arcs span ~37-188 px.
function groupSegments(segments, tol) {
  const groups = [];
  const used = new Array(segments.length).fill(false);
  for (let i = 0; i < segments.length; i++) {
    if (used[i]) continue;
    const group = [segments[i]];
    used[i] = true;
    let added = true;
    while (added) {
      added = false;
      for (let j = 0; j < segments.length; j++) {
        if (used[j]) continue;
        const s = segments[j];
        for (const g of group) {
          if (
            Math.abs(s.x0 - g.x0) < tol || Math.abs(s.x0 - g.x1) < tol ||
            Math.abs(s.x1 - g.x0) < tol || Math.abs(s.x1 - g.x1) < tol
          ) {
            group.push(s);
            used[j] = true;
            added = true;
            break;
          }
        }
        if (added) break;
      }
    }
    groups.push(group);
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

// ── fmtVal — scientific notation for very small or very large values ──────────
function fmtVal(v) {
  if (Math.abs(v) < 0.001 || Math.abs(v) > 9999) return v.toExponential(2);
  return v.toFixed(4);
}

// ── Contour levels — module-level so JSX can reference them ──────────────────
const CONTOUR_LEVELS = [
  { frac: 0.5,  label: '½ peak',    pct: '50%', lw: 2.5, dash: [],     alpha: 1.0  },
  { frac: 0.1,  label: '¹⁄₁₀ peak', pct: '10%', lw: 1.8, dash: [],     alpha: 0.85 },
  { frac: 0.02, label: '¹⁄₅₀ peak', pct: '2%',  lw: 1.2, dash: [4, 4], alpha: 0.65 },
];

// ── ContourMap ────────────────────────────────────────────────────────────────
export function ContourMap({ dirtyData, restoredData, N, angularResolution, fovMuas, controls, onOpenInfo }) {
  const [displayMode, setDisplayMode]   = useState('dirty');
  const [stats, setStats]               = useState(null);
  const [activeLevels, setActiveLevels] = useState([]);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const DST = 512;

    const activeData = displayMode === 'dirty' ? dirtyData : restoredData;

    // Placeholder when no data is available
    if (!activeData || activeData.length === 0) {
      ctx.fillStyle = '#0a0a20';
      ctx.fillRect(0, 0, DST, DST);
      ctx.fillStyle    = 'rgba(136,136,176,0.4)';
      ctx.font         = '22px Inter, sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No data yet', DST / 2, DST / 2);
      setStats(null);
      setActiveLevels([]);
      return;
    }

    // ── Bilinear upscale to 512×512 ──
    const upscaled = bilinearUpscale(activeData, N, DST);

    // ── Normalize upscaled to [0,1] ──
    let upMin = Infinity, upMax = -Infinity;
    for (let i = 0; i < upscaled.length; i++) {
      if (upscaled[i] < upMin) upMin = upscaled[i];
      if (upscaled[i] > upMax) upMax = upscaled[i];
    }
    const upRange = upMax - upMin || 1;

    // ── Apply viridis LUT and draw image ──
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

    // ── Compute stats from N×N source data ──
    let minV = Infinity, maxV = -Infinity;
    for (let i = 0; i < N * N; i++) {
      if (activeData[i] < minV) minV = activeData[i];
      if (activeData[i] > maxV) maxV = activeData[i];
    }
    // ── Robust sigma via MAD on outer 8px border strip ──
    const borderVals = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (r < 8 || r >= N - 8 || c < 8 || c >= N - 8) {
          borderVals.push(activeData[r * N + c]);
        }
      }
    }
    borderVals.sort((a, b) => a - b);
    const med     = borderVals[Math.floor(borderVals.length / 2)];
    const absDevs = borderVals.map(v => Math.abs(v - med)).sort((a, b) => a - b);
    const madSigma = 1.4826 * absDevs[Math.floor(absDevs.length / 2)];
    // If sigma is unrealistically large (>10% of peak, e.g. noiseless simulation
    // where border still contains sidelobe energy), floor it to 1% of peak.
    const safeSigma    = (isFinite(madSigma) && madSigma > 0 && madSigma < maxV * 0.1)
      ? madSigma
      : (maxV > 0 ? maxV * 0.01 : 0);
    const dynamicRange = safeSigma > 0 ? maxV / safeSigma : (maxV > 0 ? Infinity : 0);
    const dataRange    = maxV - minV || 1;

    // Helper: map a data value to its x position on the inset colorbar
    const cbX = (v) => 8 + Math.max(0, Math.min(DST - 16, (v - minV) / dataRange * (DST - 16)));

    // ── Contour lines (scaled ×2 for 512 canvas) ──
    // Filter by longest bbox dimension:
    // False islands: max dim ~5-13 px
    // Real arcs: max dim ~37-188 px
    // Threshold at 15 sits cleanly between them.
    const MIN_MAX_DIM = 15;

    // Adaptive level selection based on dynamic range to suppress sidelobe noise:
    // DR < 80:1  → 50% only   DR 80–200:1 → 50% + 10%   DR > 200:1 → all three
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
        const segs   = marchingSquares(activeData, N, threshold);
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

    // ── Axis tick marks (labels rendered in HTML overlay) ──
    // Pixel scale from UV normalization: λ / (2 × Earth_diameter_m)
    const EARTH_DIAM_M   = 6371 * 2 * 1000;
    const lambda_m       = 299792458 / (controls.frequency * 1e9);
    const pixelScale_rad = lambda_m / (2 * EARTH_DIAM_M);
    const pixelScale_uas = pixelScale_rad * (180 / Math.PI) * 3600 * 1e6;
    const val1           = (N / 4 * pixelScale_uas).toFixed(1);  // offset at ±N/4 source px

    const center = DST / 2;   // 256
    const TICK   = 8;
    // Canvas tick positions: ±128px (quarter canvas = N/4 src px) and ±256px (edge)
    const tickPx = [128, 256];

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth   = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    for (const off of tickPx) {
      // Top edge (X axis)
      ctx.moveTo(center - off, 0);    ctx.lineTo(center - off, TICK);
      ctx.moveTo(center + off, 0);    ctx.lineTo(center + off, TICK);
      // Left edge (Y axis)
      ctx.moveTo(0, center - off);    ctx.lineTo(TICK, center - off);
      ctx.moveTo(0, center + off);    ctx.lineTo(TICK, center + off);
    }
    ctx.stroke();
    ctx.restore();

    // ── Colorbar gradient bar and tick marks ──
    // Layout: contour level ticks above bar, gradient bar, value labels in HTML below.
    const CB_Y = 455, CB_H = 28, CB_TICK_H = 18;

    // Gradient strip
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

    // Intermediate tick marks at 25%, 50%, 75% inside the bar
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth   = 1;
    for (const f of [0.25, 0.5, 0.75]) {
      const x = f * DST;
      ctx.beginPath();
      ctx.moveTo(x, CB_Y + CB_H * 0.35);
      ctx.lineTo(x, CB_Y + CB_H);
      ctx.stroke();
    }

    // Contour level tick marks above the bar (labels rendered in HTML)
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

    // ── Beam ellipse — bottom-right corner, label rendered in HTML ──
    // Estimate beam FWHM from dirty image: find actual peak, scan that row.
    let beamRadPx = 8;
    if (dirtyData && dirtyData.length > 0) {
      let dPeakIdx = 0;
      for (let i = 1; i < N * N; i++) {
        if (dirtyData[i] > dirtyData[dPeakIdx]) dPeakIdx = i;
      }
      const dPeakRow = Math.floor(dPeakIdx / N);
      const dPeakCol = dPeakIdx % N;
      const peakVal  = dirtyData[dPeakRow * N + dPeakCol];
      const halfMax  = peakVal / 2;
      if (halfMax > 0) {
        let halfWidth = 0;
        for (let col = dPeakCol; col < N; col++) {
          if (dirtyData[dPeakRow * N + col] < halfMax) { halfWidth = col - dPeakCol; break; }
        }
        if (halfWidth > 0 && halfWidth < N / 4) {
          beamRadPx = (halfWidth / 2.355) * (DST / N);
        }
      }
    }
    beamRadPx = Math.max(8, Math.min(beamRadPx, 20));

    const BEAM_CX = DST - 80, BEAM_CY = CB_Y - 35;
    ctx.save();
    ctx.fillStyle   = 'rgba(255,255,255,1.0)';
    ctx.strokeStyle = 'white';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.ellipse(BEAM_CX, BEAM_CY, beamRadPx, beamRadPx * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    setStats({
      minV, maxV, sigma: safeSigma, dynamicRange,
      val1,
      cbMin:  fmtVal(minV),
      cbMax:  fmtVal(maxV),
      cbQ1:   fmtVal(minV + dataRange * 0.25),
      cbMid:  fmtVal(minV + dataRange * 0.5),
      cbQ3:   fmtVal(minV + dataRange * 0.75),
      activeLevelPcts: passed.map(l => l.pct),
    });
    setActiveLevels(passed);
  }, [dirtyData, restoredData, displayMode, N, controls.frequency]);

  const drText = stats
    ? (!isFinite(stats.dynamicRange) ? '>1000:1' : stats.dynamicRange.toFixed(0) + ':1')
    : '—';

  const statsText = stats
    ? `Peak: ${fmtVal(stats.maxV)} · σ: ${fmtVal(stats.sigma)} · DR: ${drText} · ${activeLevels.length} contour level${activeLevels.length !== 1 ? 's' : ''}`
    : '—';

  const restoredBtnLabel = controls.method === 'clean' ? 'CLEAN'
    : controls.method === 'mem' ? 'Max Entropy'
    : 'Dirty';

  const activeLevelPcts = stats?.activeLevelPcts;

  return html`
    <div className="contour-map-panel">
      <div className="contour-map-header">
        <span>Contour Map</span>
        <div className="contour-map-controls">
          <button
            className=${'btn btn-xs' + (displayMode === 'restored' ? ' btn-active' : '')}
            onClick=${() => setDisplayMode('restored')}
          >${restoredBtnLabel}</button>
          <button
            className=${'btn btn-xs' + (displayMode === 'dirty' ? ' btn-active' : '')}
            onClick=${() => setDisplayMode('dirty')}
          >Dirty</button>
          <${InfoTooltip} infoKey="contourmap" onOpen=${onOpenInfo} />
        </div>
      </div>
      <div className="contour-map-stats">${statsText}</div>
      <div className="contour-map-canvas-wrap">
        <div className="contour-axis-y">Dec offset (<span style=${{ textTransform: 'none' }}>uas</span>)</div>
        <div style=${{ position: 'relative', flex: 1 }}>
          <canvas
            ref=${canvasRef}
            width="512"
            height="512"
            className="contour-map-canvas"
            style=${{ width: '100%', height: 'auto', aspectRatio: '1/1', display: 'block' }}
            aria-label="Professional contour map of radio interferometry reconstruction"
          ></canvas>
          <div className="contour-tick-overlay" aria-hidden="true">
            <span className="ctick ctick-top-left">+${(fovMuas / 2).toFixed(1)} <span style=${{ textTransform: 'none' }}>uas</span></span>
            <span className="ctick ctick-top-right">−${(fovMuas / 2).toFixed(1)} <span style=${{ textTransform: 'none' }}>uas</span></span>
            <span className="ctick ctick-mid-left">+${(fovMuas / 2).toFixed(1)} <span style=${{ textTransform: 'none' }}>uas</span></span>
            <span className="ctick ctick-mid-right">−${(fovMuas / 2).toFixed(1)} <span style=${{ textTransform: 'none' }}>uas</span></span>
          </div>
        </div>
      </div>
      <div className="contour-cb-labels">
        <span>${stats?.cbMin ?? ''}</span>
        <span>${stats?.cbQ1 ?? ''}</span>
        <span>${stats?.cbMid ?? ''}</span>
        <span>${stats?.cbQ3 ?? ''}</span>
        <span>${stats?.cbMax ?? ''}</span>
      </div>
      <div className="contour-cb-title">Brightness (normalized)</div>
      <div className="contour-axis-x">RA offset (<span style=${{ textTransform: 'none' }}>uas</span>)</div>
      <div className="contour-cb-levels">
        ${CONTOUR_LEVELS.map(l => html`
          <span key=${l.pct} className=${'contour-cb-level' + (activeLevelPcts?.includes(l.pct) ? ' active' : '')}>
            ${l.pct}
          </span>
        `)}
        <span className="contour-beam-label">⬤ beam</span>
      </div>
    </div>
  `;
}
