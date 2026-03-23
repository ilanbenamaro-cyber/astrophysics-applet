// Renders Float64Array data as hot-colormap canvas; also holds OriginalImagePanel.
import { html, useRef, useEffect } from './core.js';
import { InfoTooltip } from './InfoTooltip.js';

// Render a Float64Array as a hot-colormap canvas
function renderImageData(data, N, ctx) {
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
    // Hot colormap: black → dark red → orange → yellow → white
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

export function ImageCanvas({ data, N, label, infoKey, onOpenInfo }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!data) {
      ctx.fillStyle = '#0a0a20';
      ctx.fillRect(0, 0, N, N);
      ctx.fillStyle = 'rgba(136,136,176,0.3)';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Awaiting data…', N/2, N/2);
      return;
    }
    renderImageData(data, N, ctx);
  }, [data, N]);

  return html`<div className="image-panel">
    <div className="image-panel-header">
      <p className="image-label">${label}</p>
      ${infoKey ? html`<${InfoTooltip} infoKey=${infoKey} onOpen=${onOpenInfo} />` : null}
    </div>
    <canvas ref=${canvasRef} width=${N} height=${N} aria-label=${label}></canvas>
  </div>`;
}

export function OriginalImagePanel({ canvas, label, infoKey, onOpenInfo }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    while (container.firstChild) container.removeChild(container.firstChild);
    if (canvas) {
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      canvas.style.display = 'block';
      canvas.style.border = '1px solid var(--border)';
      canvas.style.borderRadius = '4px';
      container.appendChild(canvas);
    }
  }, [canvas]);

  return html`<div className="image-panel">
    <div className="image-panel-header">
      <p className="image-label">${label}</p>
      ${infoKey ? html`<${InfoTooltip} infoKey=${infoKey} onOpen=${onOpenInfo} />` : null}
    </div>
    <div ref=${containerRef} aria-label=${label} style=${{ minHeight: '40px' }}></div>
  </div>`;
}
