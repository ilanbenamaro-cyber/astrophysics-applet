// ContourMap.js — Professional radio astronomy contour map with viridis colormap.
// Drawing primitives live in simRender.js (drawContour); this component owns canvas
// lifecycle + React state + the HTML chrome around the canvas.
import { html, useState, useEffect, useRef } from './core.js';
import { InfoTooltip } from './InfoTooltip.js';
import { drawContour, CONTOUR_LEVELS, fmtVal } from './simRender.js';

// ── ContourMap ────────────────────────────────────────────────────────────────
export function ContourMap({ dirtyData, restoredData, N, angularResolution, fovMuas, controls,
                             onOpenInfo, beamSigmaU = 2, beamSigmaV = 2, beamPA = 0,
                             dynamicRange = 0 }) {
  const [displayMode, setDisplayMode]   = useState('dirty');
  const [stats, setStats]               = useState(null);
  const [activeLevels, setActiveLevels] = useState([]);
  const [isEmpty, setIsEmpty]           = useState(true);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const activeData = displayMode === 'clean' ? restoredData : dirtyData;
    const { isEmpty: empty, stats: s, activeLevels: levels } =
      drawContour(ctx, activeData, { N, beamSigmaU, beamSigmaV, beamPA, dynamicRange });
    setIsEmpty(empty);
    setStats(s);
    setActiveLevels(levels);
  }, [dirtyData, restoredData, displayMode, N, controls.frequency]);

  const drText = dynamicRange > 0
    ? (!isFinite(dynamicRange) ? '>1000:1' : dynamicRange.toFixed(0) + ':1')
    : '—';

  const statsText = stats
    ? `Peak: ${fmtVal(stats.maxV)} · σ: ${fmtVal(stats.sigma)} · DR: ${drText} · ${activeLevels.length} contour level${activeLevels.length !== 1 ? 's' : ''}`
    : '—';

  const activeLevelPcts = stats?.activeLevelPcts;

  return html`
    <div className="contour-map-panel">
      <div className="contour-map-header">
        <span>Contour Map</span>
        <div className="contour-map-controls">
          <button
            className=${'btn btn-xs' + (displayMode === 'dirty' ? ' btn-active' : '')}
            onClick=${() => setDisplayMode('dirty')}
            aria-pressed=${displayMode === 'dirty'}
          >Dirty</button>
          <button
            className=${'btn btn-xs' + (displayMode === 'clean' ? ' btn-active' : '')}
            onClick=${() => setDisplayMode('clean')}
            aria-pressed=${displayMode === 'clean'}
          >CLEAN</button>
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
          ${isEmpty ? html`
            <div style=${{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'rgba(136,136,176,0.4)', fontSize: '1.1rem',
              pointerEvents: 'none' }}>No data yet</div>
          ` : null}
          <div className="contour-tick-overlay" aria-hidden="true">
            <span className="ctick ctick-top-left">+${(fovMuas / 2).toFixed(1)} <span style=${{ textTransform: 'none' }}>uas</span></span>
            <span className="ctick ctick-top-right">−${(fovMuas / 2).toFixed(1)} <span style=${{ textTransform: 'none' }}>uas</span></span>
            <span className="ctick ctick-mid-left">+${(fovMuas / 4).toFixed(1)} <span style=${{ textTransform: 'none' }}>uas</span></span>
            <span className="ctick ctick-mid-right">−${(fovMuas / 4).toFixed(1)} <span style=${{ textTransform: 'none' }}>uas</span></span>
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
