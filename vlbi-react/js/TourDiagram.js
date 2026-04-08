// TourDiagram — per-act hand-drawn canvas diagrams using Rough.js.
// Each act gets a 320×160 canvas. Animations use requestAnimationFrame.
import { html, useRef, useEffect } from './core.js';

// ── Helper: draw a text label ──────────────────────────────────────────────
function label(ctx, text, x, y, { color = '#C4A555', size = 11, align = 'center' } = {}) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px 'Inter', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

// ── Helper: draw an arrow ──────────────────────────────────────────────────
function arrow(ctx, x1, y1, x2, y2, { color = '#8888b0', width = 1.5 } = {}) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 7;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(angle - 0.4), y2 - size * Math.sin(angle - 0.4));
  ctx.lineTo(x2 - size * Math.cos(angle + 0.4), y2 - size * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ── Helper: draw a sine wave ───────────────────────────────────────────────
function sineWave(ctx, startX, endX, baseY, amplitude, phase, { color = '#C4A555', width = 1.5 } = {}) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  for (let x = startX; x <= endX; x += 2) {
    const t = ((x - startX) / (endX - startX)) * Math.PI * 4;
    const y = baseY + amplitude * Math.sin(t + phase);
    x === startX ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

// ── Act 1: Single-dish resolution ─────────────────────────────────────────
function drawDish(rc, ctx) {
  const W = 320, H = 160;
  // Dish arc
  rc.arc(W / 2, H - 20, 90, 40, Math.PI * 0.1, Math.PI * 0.9, false, {
    stroke: '#C4A555', strokeWidth: 2, roughness: 1.4,
  });
  // Focal point
  rc.circle(W / 2, H - 62, 6, { fill: '#C4A555', fillStyle: 'solid', stroke: '#C4A555', roughness: 0.8 });
  // Resolution lines
  const cx = W / 2, cy = H - 62;
  rc.line(cx, cy, cx - 55, 10, { stroke: '#8888b0', strokeWidth: 1.2, roughness: 1, strokeLineDash: [4, 3] });
  rc.line(cx, cy, cx + 55, 10, { stroke: '#8888b0', strokeWidth: 1.2, roughness: 1, strokeLineDash: [4, 3] });
  // Arc showing angle
  ctx.save();
  ctx.strokeStyle = '#9E7E38';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 28, -1.47, -0.58);
  ctx.stroke();
  ctx.restore();
  label(ctx, 'θ', cx + 34, cy - 20, { color: '#C4A555', size: 14 });
  label(ctx, 'D', cx, H - 4, { color: '#8888b0', size: 11 });
  label(ctx, 'θ ≈ λ/D', cx, 20, { color: '#e8e8f0', size: 10 });
}

// ── Act 2: Two dishes + baseline + animated sine waves ────────────────────
function drawBaseline(rc, ctx, canvas, rafRef, reducedMotion) {
  const W = 320, H = 160;
  // Static elements: two dish arcs
  rc.arc(60, H - 18, 60, 24, Math.PI * 0.1, Math.PI * 0.9, false, {
    stroke: '#C4A555', strokeWidth: 2, roughness: 1.3,
  });
  rc.arc(260, H - 18, 60, 24, Math.PI * 0.1, Math.PI * 0.9, false, {
    stroke: '#C4A555', strokeWidth: 2, roughness: 1.3,
  });
  // Baseline
  rc.line(60, H - 40, 260, H - 40, {
    stroke: '#8888b0', strokeWidth: 1.5, roughness: 0.5, strokeLineDash: [5, 4],
  });
  label(ctx, 'B', 160, H - 32, { color: '#8888b0', size: 11 });
  label(ctx, 'ALMA', 60, H - 6, { color: '#9E7E38', size: 9 });
  label(ctx, 'IRAM', 260, H - 6, { color: '#9E7E38', size: 9 });

  if (reducedMotion) {
    // Static fallback
    sineWave(ctx, 20, 140, 45, 14, 0, { color: '#C4A555' });
    sineWave(ctx, 180, 300, 45, 14, 0.8, { color: '#9E7E38' });
    label(ctx, 'E₁', 14, 45, { color: '#C4A555', size: 10, align: 'left' });
    label(ctx, 'E₂', 174, 45, { color: '#9E7E38', size: 10, align: 'left' });
    label(ctx, 'τ', 160, 58, { color: '#8888b0', size: 10 });
    return;
  }

  let phase = 0;
  const staticCanvas = document.createElement('canvas');
  staticCanvas.width = canvas.width;
  staticCanvas.height = canvas.height;
  // Copy static elements to a backing canvas (we re-draw waves over a cropped region)
  function frame() {
    // Clear only the wave region
    ctx.clearRect(0, 0, W, 80);
    // Redraw dishes and baseline in the wave region (since we cleared it)
    // (actually just draw waves on the cleared area — static below won't be erased)
    sineWave(ctx, 20, 140, 45, 14, phase, { color: '#C4A555' });
    sineWave(ctx, 180, 300, 45, 14, phase - 0.9, { color: '#9E7E38' });
    label(ctx, 'E₁', 14, 45, { color: '#C4A555', size: 10, align: 'left' });
    label(ctx, 'E₂', 174, 45, { color: '#9E7E38', size: 10, align: 'left' });
    label(ctx, 'delay τ', 155, 62, { color: '#8888b0', size: 9 });
    phase += 0.045;
    rafRef.current = requestAnimationFrame(frame);
  }
  rafRef.current = requestAnimationFrame(frame);
}

// ── Act 3: Fourier connection ──────────────────────────────────────────────
function drawFourier(rc, ctx) {
  const W = 320, H = 160;
  // Left panel: sky
  rc.rectangle(10, 20, 120, 120, { stroke: '#2d2200', strokeWidth: 1.5, roughness: 1.2 });
  rc.ellipse(70, 80, 50, 36, {
    fill: 'rgba(196,165,85,0.25)', fillStyle: 'solid', stroke: '#C4A555', strokeWidth: 1.5, roughness: 1.5,
  });
  label(ctx, 'I(x,y)', 70, 148, { color: '#8888b0', size: 10 });
  label(ctx, 'Sky', 70, 10, { color: '#9E7E38', size: 10 });

  // Arrow in middle
  arrow(ctx, 150, 80, 178, 80, { color: '#C4A555', width: 2 });
  label(ctx, 'ℱ', 164, 68, { color: '#C4A555', size: 13 });

  // Right panel: UV plane
  rc.rectangle(188, 20, 120, 120, { stroke: '#2d2200', strokeWidth: 1.5, roughness: 1.2 });
  // Axes
  ctx.save();
  ctx.strokeStyle = '#2d2200';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(248, 22); ctx.lineTo(248, 138); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(190, 80); ctx.lineTo(306, 80); ctx.stroke();
  ctx.restore();
  // UV points
  const pts = [
    [248, 80], [220, 58], [276, 102], [232, 95], [264, 65],
    [248, 55], [248, 105], [210, 80], [286, 80],
  ];
  pts.forEach(([x, y]) => {
    rc.circle(x, y, 5, { fill: '#C4A555', fillStyle: 'solid', stroke: '#9E7E38', strokeWidth: 0.8, roughness: 0.8 });
  });
  label(ctx, 'V(u,v)', 248, 148, { color: '#8888b0', size: 10 });
  label(ctx, 'UV Plane', 248, 10, { color: '#9E7E38', size: 10 });
  label(ctx, 'u', 308, 80, { color: '#8888b0', size: 9 });
  label(ctx, 'v', 248, 20, { color: '#8888b0', size: 9 });
}

// ── Act 4: Earth rotation synthesis ───────────────────────────────────────
function drawEarthRotation(rc, ctx, canvas, rafRef, reducedMotion) {
  const W = 320, H = 160;
  const cx = W / 2, cy = H / 2;

  if (reducedMotion) {
    rc.circle(cx, cy, 38, { fill: '#0a1628', fillStyle: 'solid', stroke: '#C4A555', strokeWidth: 2, roughness: 1 });
    label(ctx, '🌍', cx, cy, { color: '#fff', size: 20 });
    ctx.save();
    ctx.strokeStyle = '#9E7E38';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(cx, cy, 62, -Math.PI / 2, Math.PI * 0.6);
    ctx.stroke();
    ctx.restore();
    label(ctx, 'UV arc', cx + 68, cy - 20, { color: '#8888b0', size: 9 });
    return;
  }

  let angle = 0;
  function frame() {
    ctx.clearRect(0, 0, W, H);
    // Earth
    rc.circle(cx, cy, 38, { fill: '#0a1628', fillStyle: 'solid', stroke: '#C4A555', strokeWidth: 2, roughness: 1 });
    // Continent suggestion
    rc.ellipse(cx - 6, cy - 4, 14, 20, { fill: 'rgba(34,100,60,0.6)', fillStyle: 'solid', stroke: 'rgba(34,100,60,0.8)', strokeWidth: 0.8, roughness: 2 });
    // Growing arc
    ctx.save();
    ctx.strokeStyle = '#C4A555';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#C4A555';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 62, -Math.PI / 2, -Math.PI / 2 + angle * Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // Conjugate arc (dimmer)
    ctx.save();
    ctx.strokeStyle = '#9E7E38';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 62, Math.PI / 2, Math.PI / 2 + angle * Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // Moving baseline dot
    const dotAngle = -Math.PI / 2 + angle * Math.PI * 2;
    const dx = cx + 62 * Math.cos(dotAngle);
    const dy = cy + 62 * Math.sin(dotAngle);
    rc.circle(dx, dy, 6, { fill: '#fff', fillStyle: 'solid', stroke: '#C4A555', strokeWidth: 1, roughness: 0.5 });
    label(ctx, 'Earth rotation →', cx, H - 8, { color: '#8888b0', size: 9 });
    angle = (angle + 0.003) % 1;
    rafRef.current = requestAnimationFrame(frame);
  }
  rafRef.current = requestAnimationFrame(frame);
}

// ── Act 5: Dirty image (convolution diagram) ──────────────────────────────
function drawDirtyBeam(rc, ctx) {
  const W = 320, H = 160;
  // Three panels
  const panels = [14, 118, 222];
  const pw = 80, ph = 90, py = 35;

  panels.forEach(px => {
    rc.rectangle(px, py, pw, ph, { stroke: '#2d2200', strokeWidth: 1.5, roughness: 1.3 });
  });

  // Panel 1: true sky (clean source)
  rc.ellipse(54, 80, 28, 22, {
    fill: 'rgba(196,165,85,0.5)', fillStyle: 'solid', stroke: '#C4A555', strokeWidth: 1.5, roughness: 1.5,
  });
  label(ctx, 'I_true', 54, 134, { color: '#8888b0', size: 9 });

  // Convolution symbol
  label(ctx, '⊛', 110, 80, { color: '#C4A555', size: 18 });

  // Panel 2: dirty beam (PSF)
  rc.circle(158, 80, 8, { fill: 'rgba(196,165,85,0.9)', fillStyle: 'solid', stroke: '#C4A555', strokeWidth: 1, roughness: 0.8 });
  // Sidelobes
  for (let r of [18, 30, 44]) {
    ctx.save();
    ctx.strokeStyle = `rgba(196,165,85,${0.35 - r * 0.006})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(158, 80, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  label(ctx, 'B (PSF)', 158, 134, { color: '#8888b0', size: 9 });

  // Equals symbol
  label(ctx, '=', 214, 80, { color: '#C4A555', size: 18 });

  // Panel 3: dirty image (blurred + rings)
  rc.ellipse(302, 80, 38, 30, {
    fill: 'rgba(196,165,85,0.2)', fillStyle: 'solid', stroke: '#C4A555', strokeWidth: 1, roughness: 2.5,
  });
  for (let r of [22, 36]) {
    ctx.save();
    ctx.strokeStyle = `rgba(196,165,85,${0.2 - r * 0.003})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.arc(302, 80, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  label(ctx, 'I^D', 302, 134, { color: '#8888b0', size: 9 });

  label(ctx, 'Dirty Image = True Sky ⊛ PSF', W / 2, 16, { color: '#9E7E38', size: 9 });
}

// ── Act 6: Max Entropy curve ───────────────────────────────────────────────
function drawMEM(rc, ctx) {
  const W = 320, H = 160;
  // Axes
  rc.line(30, 140, 290, 140, { stroke: '#2d2200', strokeWidth: 1.5, roughness: 0.8 });
  rc.line(30, 20, 30, 140, { stroke: '#2d2200', strokeWidth: 1.5, roughness: 0.8 });
  label(ctx, 'I (image)', 290, 148, { color: '#8888b0', size: 9, align: 'right' });
  label(ctx, 'S(I)', 22, 24, { color: '#8888b0', size: 9, align: 'right' });

  // Entropy curve (concave, parabola-like)
  ctx.save();
  ctx.strokeStyle = '#C4A555';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#C4A555';
  ctx.shadowBlur = 3;
  ctx.beginPath();
  // Quadratic bezier: starts low-left, peaks at center-top, ends low-right
  ctx.moveTo(45, 130);
  ctx.bezierCurveTo(90, 30, 220, 30, 275, 130);
  ctx.stroke();
  ctx.restore();

  // Peak marker
  const peakX = 160, peakY = 36;
  ctx.save();
  ctx.strokeStyle = '#9E7E38';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(peakX, peakY);
  ctx.lineTo(peakX, 140);
  ctx.stroke();
  ctx.restore();
  rc.circle(peakX, peakY, 7, { fill: '#C4A555', fillStyle: 'solid', stroke: '#C4A555', strokeWidth: 1, roughness: 0.5 });
  label(ctx, 'max S(I)', peakX, 18, { color: '#C4A555', size: 9 });

  // Constraint annotation
  rc.line(220, 80, 270, 80, { stroke: '#9E7E38', strokeWidth: 1.2, roughness: 0.8, strokeLineDash: [3, 2] });
  label(ctx, 'χ²≤1', 276, 80, { color: '#9E7E38', size: 9, align: 'left' });
  label(ctx, 'Max Entropy: smoothest consistent image', W / 2, H - 4, { color: '#8888b0', size: 8 });
}

// ── Act 7: CLEAN loop animation ────────────────────────────────────────────
function drawCLEAN(rc, ctx, canvas, rafRef, reducedMotion) {
  const W = 320, H = 160;
  let frameCount = 0;
  const STAGE_FRAMES = 60;

  function drawStage(stage) {
    ctx.clearRect(0, 0, W, H);
    if (stage === 0) {
      // Dirty image with bright peak
      label(ctx, 'Residual Image', W / 2, 14, { color: '#9E7E38', size: 9 });
      rc.ellipse(160, 82, 70, 50, {
        fill: 'rgba(196,165,85,0.12)', fillStyle: 'solid', stroke: '#2d2200', strokeWidth: 1, roughness: 2,
      });
      // Sidelobes
      for (let r of [42, 60]) {
        ctx.save();
        ctx.strokeStyle = 'rgba(196,165,85,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(160, 82, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      // Bright peak
      rc.circle(160, 82, 12, { fill: '#C4A555', fillStyle: 'solid', stroke: '#C4A555', strokeWidth: 1, roughness: 0.6 });
      // Circle the peak
      rc.circle(160, 82, 22, { stroke: '#ff6b6b', strokeWidth: 2, roughness: 1.5 });
      label(ctx, 'find peak →', 196, 72, { color: '#ff6b6b', size: 9, align: 'left' });
    } else if (stage === 1) {
      // Subtract dirty beam
      label(ctx, 'Subtract γ · B', W / 2, 14, { color: '#9E7E38', size: 9 });
      rc.ellipse(160, 82, 70, 50, {
        fill: 'rgba(196,165,85,0.12)', fillStyle: 'solid', stroke: '#2d2200', strokeWidth: 1, roughness: 2,
      });
      rc.circle(160, 82, 28, { stroke: '#9E7E38', strokeWidth: 1.5, roughness: 1, strokeLineDash: [3, 2] });
      arrow(ctx, 160, 55, 160, 30, { color: '#9E7E38', width: 2 });
      label(ctx, '-γ·B centered here', 160, 22, { color: '#9E7E38', size: 9 });
      // Smaller peak remaining
      rc.circle(160, 82, 7, { fill: '#C4A555', fillStyle: 'solid', stroke: '#C4A555', strokeWidth: 1, roughness: 0.5 });
    } else {
      // Smaller residual
      label(ctx, 'Smaller Residual', W / 2, 14, { color: '#9E7E38', size: 9 });
      rc.ellipse(160, 82, 44, 32, {
        fill: 'rgba(196,165,85,0.1)', fillStyle: 'solid', stroke: '#2d2200', strokeWidth: 1, roughness: 2,
      });
      rc.circle(160, 82, 7, { fill: '#9E7E38', fillStyle: 'solid', stroke: '#9E7E38', strokeWidth: 1, roughness: 0.5 });
      // Repeat arrow
      ctx.save();
      ctx.strokeStyle = '#C4A555';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.arc(260, 82, 30, -0.5, 3.8);
      ctx.stroke();
      ctx.restore();
      arrow(ctx, 256, 53, 220, 48, { color: '#C4A555', width: 1.5 });
      label(ctx, 'repeat', 274, 82, { color: '#C4A555', size: 9 });
    }
    // Step counter
    label(ctx, `Step ${stage + 1}/3`, 16, H - 8, { color: '#2d2200', size: 8, align: 'left' });
  }

  if (reducedMotion) {
    drawStage(0);
    return;
  }

  function frame() {
    const stage = Math.floor(frameCount / STAGE_FRAMES) % 3;
    drawStage(stage);
    frameCount++;
    rafRef.current = requestAnimationFrame(frame);
  }
  rafRef.current = requestAnimationFrame(frame);
}

// ── Act 8: EHT summary (three panels) ─────────────────────────────────────
function drawSummary(rc, ctx, canvas, rafRef, reducedMotion) {
  const W = 320, H = 160;
  const py = 30, ph = 90, pw = 76;
  const px1 = 12, px2 = 122, px3 = 232;

  [px1, px2, px3].forEach(px => {
    rc.rectangle(px, py, pw, ph, { stroke: '#2d2200', strokeWidth: 1.5, roughness: 1.2 });
  });

  // Panel 1: UV coverage arcs
  ctx.save();
  ctx.translate(px1 + pw / 2, py + ph / 2);
  const uvArcs = [
    [0, 0, 28, -1.1, 0.2],
    [0, 0, 22, 0.8, 2.1],
    [0, 0, 32, 1.8, 3.0],
    [0, 0, 18, -0.3, 1.2],
    [0, 0, 25, 2.4, 3.8],
  ];
  uvArcs.forEach(([, , r, a1, a2], i) => {
    ctx.strokeStyle = `hsl(${40 + i * 20},60%,55%)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, a1, a2);
    ctx.stroke();
  });
  ctx.restore();
  label(ctx, 'UV', px1 + pw / 2, py + ph + 12, { color: '#8888b0', size: 9 });

  // Arrow
  arrow(ctx, px1 + pw + 4, py + ph / 2, px2 - 4, py + ph / 2, { color: '#2d2200', width: 1.5 });

  // Panel 2: dirty image (ring artifact)
  const c2x = px2 + pw / 2, c2y = py + ph / 2;
  rc.ellipse(c2x, c2y, 26, 22, { fill: 'rgba(196,165,85,0.15)', fillStyle: 'solid', stroke: '#C4A555', strokeWidth: 1, roughness: 1.5 });
  for (let r of [16, 26, 36]) {
    ctx.save();
    ctx.strokeStyle = `rgba(196,165,85,${0.3 - r * 0.006})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(c2x, c2y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  label(ctx, 'Dirty', px2 + pw / 2, py + ph + 12, { color: '#8888b0', size: 9 });

  // Arrow
  arrow(ctx, px2 + pw + 4, py + ph / 2, px3 - 4, py + ph / 2, { color: '#2d2200', width: 1.5 });

  // Panel 3: CLEAN result with pulse animation
  const c3x = px3 + pw / 2, c3y = py + ph / 2;

  if (reducedMotion) {
    rc.circle(c3x, c3y, 8, { fill: '#C4A555', fillStyle: 'solid', stroke: '#C4A555', strokeWidth: 1, roughness: 0.6 });
    label(ctx, 'CLEAN', px3 + pw / 2, py + ph + 12, { color: '#8888b0', size: 9 });
    label(ctx, '8 telescopes · 20 μas', W / 2, H - 4, { color: '#9E7E38', size: 8 });
    return;
  }

  let pulse = 0;
  function frame() {
    // Only redraw panel 3 region
    ctx.clearRect(px3, py, pw, ph);
    rc.rectangle(px3, py, pw, ph, { stroke: '#2d2200', strokeWidth: 1.5, roughness: 1.2 });
    // Pulsing glow
    ctx.save();
    ctx.shadowColor = '#C4A555';
    ctx.shadowBlur = 6 + 8 * Math.sin(pulse);
    rc.circle(c3x, c3y, 8, { fill: '#C4A555', fillStyle: 'solid', stroke: '#C4A555', strokeWidth: 1, roughness: 0.6 });
    ctx.restore();
    // Outer glow ring
    ctx.save();
    ctx.strokeStyle = `rgba(196,165,85,${0.15 + 0.1 * Math.sin(pulse)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(c3x, c3y, 16 + 4 * Math.sin(pulse), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    label(ctx, 'CLEAN', px3 + pw / 2, py + ph + 12, { color: '#8888b0', size: 9 });
    pulse += 0.06;
    rafRef.current = requestAnimationFrame(frame);
  }
  // Draw static parts first
  label(ctx, '8 telescopes · 20 μas', W / 2, H - 4, { color: '#9E7E38', size: 8 });
  rafRef.current = requestAnimationFrame(frame);
}

// ── Main component ──────────────────────────────────────────────────────────
export function TourDiagram({ diagramAct, reducedMotion }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Cancel any running animation from a previous act
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (!window.rough) return; // guard if CDN not loaded yet

    const rc = window.rough.canvas(canvas);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (diagramAct) {
      case 1: drawDish(rc, ctx); break;
      case 2: drawBaseline(rc, ctx, canvas, rafRef, reducedMotion); break;
      case 3: drawFourier(rc, ctx); break;
      case 4: drawEarthRotation(rc, ctx, canvas, rafRef, reducedMotion); break;
      case 5: drawDirtyBeam(rc, ctx); break;
      case 6: drawMEM(rc, ctx); break;
      case 7: drawCLEAN(rc, ctx, canvas, rafRef, reducedMotion); break;
      case 8: drawSummary(rc, ctx, canvas, rafRef, reducedMotion); break;
      default: break;
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [diagramAct, reducedMotion]);

  return html`
    <canvas
      ref=${canvasRef}
      width="320"
      height="160"
      className="tour-diagram-canvas"
      aria-label=${'Physics diagram for tour act ' + diagramAct}
    ></canvas>
  `;
}
