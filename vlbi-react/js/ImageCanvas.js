// Renders Float64Array data as hot-colormap canvas; also holds OriginalImagePanel.
// The hot-colormap renderer lives in simRender.js (drawHot).
import { html, useRef, useEffect } from './core.js';
import { InfoTooltip } from './InfoTooltip.js';
import { drawHot } from './simRender.js';

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
    drawHot(ctx, data, N);
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
