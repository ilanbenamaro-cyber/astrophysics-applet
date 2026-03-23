// Procedural synthetic source image generators for the image gallery.
import { IMAGE_SIZE } from './constants.js';

export function generatePreset(name) {
  const N = IMAGE_SIZE;
  const canvas = (typeof OffscreenCanvas !== 'undefined')
    ? new OffscreenCanvas(N, N)
    : document.createElement('canvas');
  canvas.width = N;
  canvas.height = N;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(N, N);
  const d = imageData.data;
  const cx = N / 2, cy = N / 2;
  const grayscale = new Float64Array(N * N);

  function setPixel(x, y, v) {
    if (x < 0 || x >= N || y < 0 || y >= N) return;
    const idx = (y * N + x);
    grayscale[idx] = Math.max(grayscale[idx], v);
  }

  function addGaussian(px, py, sigma, amp) {
    const r = Math.ceil(4*sigma);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const v = amp * Math.exp(-(dx*dx+dy*dy)/(2*sigma*sigma));
        setPixel(Math.round(px+dx), Math.round(py+dy), v);
      }
    }
  }

  if (name === 'blackhole') {
    const ringR = 45, ringW = 18, shadowR = 25;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const dx = x - cx, dy = y - cy;
        const r = Math.sqrt(dx*dx + dy*dy);
        const theta = Math.atan2(dy, dx);
        if (r < shadowR) {
          grayscale[y*N+x] = 0;
        } else {
          const ring = Math.exp(-Math.pow(r - ringR, 2) / (2 * (ringW/2.5) * (ringW/2.5)));
          // Doppler brightening: brighter on approaching side
          const doppler = 0.5 + 0.5 * Math.cos(theta + Math.PI);
          grayscale[y*N+x] = ring * (0.3 + 0.7 * doppler);
        }
      }
    }
  } else if (name === 'point') {
    addGaussian(cx, cy, 3, 1.0);
  } else if (name === 'binary') {
    addGaussian(cx - 25, cy, 4, 1.0);
    addGaussian(cx + 25, cy, 3, 0.7);
  } else if (name === 'jet') {
    // Core
    addGaussian(cx, cy, 6, 1.0);
    // One-sided jet along +x axis (exponential decay)
    for (let x = cx+5; x < N-5; x++) {
      const dist = x - cx;
      const amp = Math.exp(-dist / 40);
      const jetWidth = 2 + dist * 0.04;
      for (let y = Math.floor(cy - jetWidth); y <= Math.ceil(cy + jetWidth); y++) {
        const dy = y - cy;
        const v = amp * Math.exp(-dy*dy / (2*jetWidth*jetWidth));
        setPixel(x, y, v);
      }
    }
  } else if (name === 'ring') {
    const ringR = 50, sigma = 8;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const dx = x - cx, dy = y - cy;
        const r = Math.sqrt(dx*dx + dy*dy);
        grayscale[y*N+x] = Math.exp(-Math.pow(r - ringR, 2) / (2 * sigma * sigma));
      }
    }
  } else if (name === 'galaxy') {
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const dx = (x - cx) / 1.6;  // stretch horizontally
        const dy = y - cy;
        const r = Math.sqrt(dx*dx + dy*dy);
        grayscale[y*N+x] = Math.exp(-r / 30);
      }
    }
  } else {
    // Fallback: point
    addGaussian(cx, cy, 3, 1.0);
  }

  // Normalize to 0-255 and render
  let maxV = 0;
  for (let i = 0; i < N*N; i++) if (grayscale[i] > maxV) maxV = grayscale[i];
  if (maxV > 0) {
    for (let i = 0; i < N*N; i++) {
      const v = Math.round((grayscale[i] / maxV) * 255);
      d[i*4]   = v;
      d[i*4+1] = v;
      d[i*4+2] = v;
      d[i*4+3] = 255;
    }
  } else {
    for (let i = 0; i < N*N*4; i += 4) { d[i]=d[i+1]=d[i+2]=0; d[i+3]=255; }
  }
  ctx.putImageData(imageData, 0, 0);

  // Return a regular canvas for display (OffscreenCanvas can't be placed in DOM)
  let previewCanvas;
  if (typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas) {
    previewCanvas = document.createElement('canvas');
    previewCanvas.width = N; previewCanvas.height = N;
    const pCtx = previewCanvas.getContext('2d');
    pCtx.drawImage(canvas, 0, 0);
  } else {
    previewCanvas = canvas;
  }

  // Re-normalize grayscale to 0..255 range
  if (maxV > 0) {
    for (let i = 0; i < N*N; i++) grayscale[i] = (grayscale[i] / maxV) * 255;
  }

  return { previewCanvas, grayscale };
}
