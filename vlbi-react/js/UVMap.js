import { html, useRef, useEffect } from './core.js';

export function UVMap({ uvPoints, N }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#070718';
    ctx.fillRect(0, 0, N, N);

    // Grid circles
    ctx.strokeStyle = 'rgba(30,30,80,0.6)';
    ctx.lineWidth = 0.5;
    for (const r of [N/4, N/2]) {
      ctx.beginPath();
      ctx.arc(N/2, N/2, r, 0, 2*Math.PI);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(40,40,100,0.8)';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(N/2, 0); ctx.lineTo(N/2, N); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, N/2); ctx.lineTo(N, N/2); ctx.stroke();

    if (uvPoints.length === 0) return;
    const byColor = {};
    for (const p of uvPoints) {
      if (!byColor[p.color]) byColor[p.color] = [];
      byColor[p.color].push(p);
    }
    for (const [color, pts] of Object.entries(byColor)) {
      ctx.fillStyle = color;
      for (const p of pts) {
        const x = Math.round(p.u);
        const y = Math.round(p.v);
        if (x >= 0 && x < N && y >= 0 && y < N) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }, [uvPoints, N]);

  return html`<canvas
    ref=${canvasRef}
    width=${N}
    height=${N}
    className="uv-canvas"
    aria-label="UV plane coverage map"
  ></canvas>`;
}
