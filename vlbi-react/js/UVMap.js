import { html, useRef, useEffect, useState } from './core.js';

export function UVMap({ uvPoints, N }) {
  const canvasRef = useRef(null);
  const [axisLabel, setAxisLabel] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const DST = N;
    ctx.fillStyle = '#070718';
    ctx.fillRect(0, 0, DST, DST);

    // Find max UV distance in Gλ
    let maxUV_Gl = 0;
    for (const p of uvPoints) {
      const dist = Math.sqrt(p.u*p.u + p.v*p.v);
      if (dist > maxUV_Gl) maxUV_Gl = dist;
    }
    if (maxUV_Gl === 0) maxUV_Gl = 10;

    const displayMax_Gl = maxUV_Gl * 1.2;

    const toCanvas = (u, v) => ({
      x: (u / displayMax_Gl + 0.5) * DST,
      y: (v / displayMax_Gl + 0.5) * DST,
    });

    // Grid circles
    ctx.strokeStyle = 'rgba(30,30,80,0.6)';
    ctx.lineWidth = 0.5;
    for (const frac of [0.25, 0.5, 0.75, 1.0]) {
      const r = frac * DST / 2;
      ctx.beginPath();
      ctx.arc(DST/2, DST/2, r, 0, 2*Math.PI);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(40,40,100,0.8)';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(DST/2, 0); ctx.lineTo(DST/2, DST); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, DST/2); ctx.lineTo(DST, DST/2); ctx.stroke();

    if (uvPoints.length === 0) {
      setAxisLabel('');
      return;
    }

    const byColor = {};
    for (const p of uvPoints) {
      if (!byColor[p.color]) byColor[p.color] = [];
      byColor[p.color].push(p);
    }
    for (const [color, pts] of Object.entries(byColor)) {
      ctx.fillStyle = color;
      for (const p of pts) {
        const { x, y } = toCanvas(p.u, p.v);
        const ix = Math.round(x);
        const iy = Math.round(y);
        if (ix >= 0 && ix < DST && iy >= 0 && iy < DST) {
          ctx.fillRect(ix, iy, 1, 1);
        }
      }
    }

    setAxisLabel(displayMax_Gl.toFixed(1));
  }, [uvPoints, N]);

  return html`
    <div style=${{ position: 'relative', display: 'inline-block', width: '100%' }}>
      <canvas
        ref=${canvasRef}
        width=${N}
        height=${N}
        className="uv-canvas"
        aria-label="UV plane coverage map"
      ></canvas>
      ${axisLabel ? html`
        <span style=${{
          position: 'absolute', top: '2px', left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '9px', color: 'rgba(255,255,255,0.6)',
          pointerEvents: 'none', fontFamily: 'monospace',
          textShadow: '0 0 4px rgba(0,0,0,0.9)'
        }}>+${axisLabel} Gλ</span>
        <span style=${{
          position: 'absolute', bottom: '2px', left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '9px', color: 'rgba(255,255,255,0.6)',
          pointerEvents: 'none', fontFamily: 'monospace',
          textShadow: '0 0 4px rgba(0,0,0,0.9)'
        }}>−${axisLabel} Gλ</span>
        <span style=${{
          position: 'absolute', top: '50%', left: '2px',
          transform: 'translateY(-50%)',
          fontSize: '9px', color: 'rgba(255,255,255,0.6)',
          pointerEvents: 'none', fontFamily: 'monospace',
          textShadow: '0 0 4px rgba(0,0,0,0.9)'
        }}>+${axisLabel} Gλ</span>
        <span style=${{
          position: 'absolute', top: '50%', right: '2px',
          transform: 'translateY(-50%)',
          fontSize: '9px', color: 'rgba(255,255,255,0.6)',
          pointerEvents: 'none', fontFamily: 'monospace',
          textShadow: '0 0 4px rgba(0,0,0,0.9)'
        }}>−${axisLabel} Gλ</span>
      ` : null}
    </div>
  `;
}
