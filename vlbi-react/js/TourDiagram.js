// TourDiagram — per-act hand-drawn canvas diagrams using Rough.js.
// Each act gets a 400×340 canvas. Animations use timestamp-based requestAnimationFrame.
import { html, useRef, useEffect } from './core.js';

// ── Helper: draw a text label ──────────────────────────────────────────────
function label(ctx, text, x, y, { color = '#C4A555', size = 13, align = 'center' } = {}) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px 'Inter', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

// ── Helper: draw an arrow ──────────────────────────────────────────────────
function arrow(ctx, x1, y1, x2, y2, { color = '#8888b0', width = 2 } = {}) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 9;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(angle - 0.4), y2 - size * Math.sin(angle - 0.4));
  ctx.lineTo(x2 - size * Math.cos(angle + 0.4), y2 - size * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ── Helper: draw a sine wave ───────────────────────────────────────────────
function sineWave(ctx, startX, endX, baseY, amplitude, phase, { color = '#C4A555', width = 2 } = {}) {
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
  const W = 400, H = 340;
  // Dish arc — large parabola at bottom
  rc.arc(W / 2, H - 42, 120, 85, Math.PI * 0.1, Math.PI * 0.9, false, {
    stroke: '#C4A555', strokeWidth: 2.5, roughness: 0.5,
  });
  // Focal point
  const cx = W / 2, cy = H - 132;
  rc.circle(cx, cy, 12, { fill: '#C4A555', fillStyle: 'solid', stroke: '#C4A555', roughness: 0.5 });
  // Resolution lines
  rc.line(cx, cy, cx - 69, 24, { stroke: '#8888b0', strokeWidth: 1.5, roughness: 0.5, strokeLineDash: [5, 4] });
  rc.line(cx, cy, cx + 69, 24, { stroke: '#8888b0', strokeWidth: 1.5, roughness: 0.5, strokeLineDash: [5, 4] });
  // Arc showing angle
  ctx.save();
  ctx.strokeStyle = '#9E7E38';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 44, -1.47, -0.58);
  ctx.stroke();
  ctx.restore();
  label(ctx, 'θ', cx + 52, cy - 28, { color: '#C4A555', size: 18 });
  label(ctx, 'D', cx, H - 8, { color: '#8888b0', size: 14 });
  label(ctx, 'θ ≈ λ/D', cx, 32, { color: '#e8e8f0', size: 15 });
}

// ── Act 2: Two dishes + baseline + animated sine waves ────────────────────
function drawBaseline(rc, ctx, canvas, rafRef, reducedMotion) {
  const W = 400, H = 340;
  // Static: two dish arcs at bottom
  rc.arc(75, H - 38, 75, 51, Math.PI * 0.1, Math.PI * 0.9, false, {
    stroke: '#C4A555', strokeWidth: 2.5, roughness: 0.5,
  });
  rc.arc(325, H - 38, 75, 51, Math.PI * 0.1, Math.PI * 0.9, false, {
    stroke: '#C4A555', strokeWidth: 2.5, roughness: 0.5,
  });
  // Baseline dashes
  rc.line(75, H - 90, 325, H - 90, {
    stroke: '#8888b0', strokeWidth: 2, roughness: 0.5, strokeLineDash: [7, 5],
  });
  label(ctx, 'B', 200, H - 72, { color: '#8888b0', size: 14 });
  label(ctx, 'ALMA', 75, H - 14, { color: '#9E7E38', size: 12 });
  label(ctx, 'IRAM', 325, H - 14, { color: '#9E7E38', size: 12 });

  if (reducedMotion) {
    sineWave(ctx, 20, 178, 115, 28, 0, { color: '#C4A555' });
    sineWave(ctx, 222, 380, 115, 28, 0.8, { color: '#9E7E38' });
    label(ctx, 'E₁', 14, 115, { color: '#C4A555', size: 13, align: 'left' });
    label(ctx, 'E₂', 216, 115, { color: '#9E7E38', size: 13, align: 'left' });
    label(ctx, 'τ', 200, 152, { color: '#8888b0', size: 13 });
    return;
  }

  function frame(ts) {
    // phase advances at ~0.0027 rad/ms (same perceptual speed as original)
    const phase = ts * 0.0027;
    ctx.clearRect(0, 0, W, 190);
    sineWave(ctx, 20, 178, 115, 28, phase, { color: '#C4A555' });
    sineWave(ctx, 222, 380, 115, 28, phase - 0.9, { color: '#9E7E38' });
    label(ctx, 'E₁', 14, 115, { color: '#C4A555', size: 13, align: 'left' });
    label(ctx, 'E₂', 216, 115, { color: '#9E7E38', size: 13, align: 'left' });
    label(ctx, 'delay τ', 200, 152, { color: '#8888b0', size: 12 });
    rafRef.current = requestAnimationFrame(frame);
  }
  rafRef.current = requestAnimationFrame(frame);
}

// ── Act 3: Fourier connection ──────────────────────────────────────────────
function drawFourier(rc, ctx) {
  const W = 400, H = 340;
  // Left panel: sky
  rc.rectangle(12, 30, 148, 255, { stroke: '#2d2200', strokeWidth: 2, roughness: 0.8 });
  rc.ellipse(86, 157, 62, 76, {
    fill: 'rgba(196,165,85,0.25)', fillStyle: 'solid', stroke: '#C4A555', strokeWidth: 2, roughness: 1.2,
  });
  label(ctx, 'I(x,y)', 86, 294, { color: '#8888b0', size: 12 });
  label(ctx, 'Sky', 86, 18, { color: '#9E7E38', size: 13 });

  // Fourier arrow
  arrow(ctx, 178, 157, 212, 157, { color: '#C4A555', width: 2.5 });
  label(ctx, 'ℱ', 195, 140, { color: '#C4A555', size: 17 });

  // Right panel: UV plane
  rc.rectangle(228, 30, 160, 255, { stroke: '#2d2200', strokeWidth: 2, roughness: 0.8 });
  // Axes
  ctx.save();
  ctx.strokeStyle = '#2d2200';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(308, 32); ctx.lineTo(308, 284); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(230, 157); ctx.lineTo(386, 157); ctx.stroke();
  ctx.restore();
  // UV points (9 visibility measurements)
  const pts = [
    [308, 157], [272, 113], [344, 201], [286, 193],
    [330, 127], [308, 110], [308, 204], [260, 157], [356, 157],
  ];
  pts.forEach(([x, y]) => {
    rc.circle(x, y, 8, { fill: '#C4A555', fillStyle: 'solid', stroke: '#9E7E38', strokeWidth: 1, roughness: 0.5 });
  });
  label(ctx, 'V(u,v)', 308, 294, { color: '#8888b0', size: 12 });
  label(ctx, 'UV Plane', 308, 18, { color: '#9E7E38', size: 13 });
  label(ctx, 'u', 390, 157, { color: '#8888b0', size: 13 });
  label(ctx, 'v', 310, 36, { color: '#8888b0', size: 13, align: 'left' });
}

// ── Act 4: Earth rotation synthesis ───────────────────────────────────────
function drawEarthRotation(rc, ctx, canvas, rafRef, reducedMotion) {
  const W = 400, H = 340;
  const cx = W / 2, cy = H / 2;

  if (reducedMotion) {
    rc.circle(cx, cy, 56, { fill: '#0a1628', fillStyle: 'solid', stroke: '#C4A555', strokeWidth: 2.5, roughness: 0.8 });
    label(ctx, '🌍', cx, cy, { color: '#fff', size: 28 });
    ctx.save();
    ctx.strokeStyle = '#9E7E38';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#9E7E38';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, 93, -Math.PI / 2, Math.PI * 0.6);
    ctx.stroke();
    ctx.restore();
    label(ctx, 'UV arc', cx + 100, cy - 26, { color: '#8888b0', size: 12 });
    return;
  }

  function frame(ts) {
    // angle cycles once every ~5.6s (0.00018 rad/ms × 5556ms = 1 revolution)
    const angle = (ts * 0.00018) % 1;
    ctx.clearRect(0, 0, W, H);
    // Earth
    rc.circle(cx, cy, 56, { fill: '#0a1628', fillStyle: 'solid', stroke: '#C4A555', strokeWidth: 2.5, roughness: 0.8 });
    // Continent hint
    rc.ellipse(cx - 8, cy - 5, 18, 28, {
      fill: 'rgba(34,100,60,0.6)', fillStyle: 'solid', stroke: 'rgba(34,100,60,0.8)', strokeWidth: 1, roughness: 1.5,
    });
    // Growing UV arc
    ctx.save();
    ctx.strokeStyle = '#C4A555';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#C4A555';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, 93, -Math.PI / 2, -Math.PI / 2 + angle * Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // Conjugate arc (dimmer)
    ctx.save();
    ctx.strokeStyle = '#9E7E38';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 93, Math.PI / 2, Math.PI / 2 + angle * Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // Moving baseline dot
    const dotAngle = -Math.PI / 2 + angle * Math.PI * 2;
    const dx = cx + 93 * Math.cos(dotAngle);
    const dy = cy + 93 * Math.sin(dotAngle);
    rc.circle(dx, dy, 9, { fill: '#fff', fillStyle: 'solid', stroke: '#C4A555', strokeWidth: 1.5, roughness: 0.5 });
    label(ctx, 'Earth rotation →', cx, H - 10, { color: '#8888b0', size: 12 });
    rafRef.current = requestAnimationFrame(frame);
  }
  rafRef.current = requestAnimationFrame(frame);
}

// ── Act 5: Dirty image (convolution diagram) ──────────────────────────────
function drawDirtyBeam(rc, ctx) {
  const W = 400, H = 340;
  const panels = [17, 147, 277];
  const pw = 100, ph = 190, py = 50;
  const pcy = py + ph / 2; // 145

  panels.forEach(px => {
    rc.rectangle(px, py, pw, ph, { stroke: '#2d2200', strokeWidth: 2, roughness: 0.8 });
  });

  const c1x = panels[0] + pw / 2; // 67
  const c2x = panels[1] + pw / 2; // 197
  const c3x = panels[2] + pw / 2; // 327

  // Panel 1: true sky source
  rc.ellipse(c1x, pcy, 40, 52, {
    fill: 'rgba(196,165,85,0.5)', fillStyle: 'solid', stroke: '#C4A555', strokeWidth: 2, roughness: 1.2,
  });
  label(ctx, 'I_true', c1x, py + ph + 16, { color: '#8888b0', size: 12 });

  // Convolution symbol
  label(ctx, '⊛', 132, pcy, { color: '#C4A555', size: 26 });

  // Panel 2: dirty beam (PSF) with sidelobes
  rc.circle(c2x, pcy, 14, { fill: 'rgba(196,165,85,0.9)', fillStyle: 'solid', stroke: '#C4A555', strokeWidth: 1.5, roughness: 0.5 });
  for (let r of [28, 46, 66]) {
    ctx.save();
    ctx.strokeStyle = `rgba(196,165,85,${0.35 - r * 0.003})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(c2x, pcy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  label(ctx, 'B (PSF)', c2x, py + ph + 16, { color: '#8888b0', size: 12 });

  // Equals symbol
  label(ctx, '=', 262, pcy, { color: '#C4A555', size: 26 });

  // Panel 3: dirty image (blurred + rings)
  rc.ellipse(c3x, pcy, 52, 68, {
    fill: 'rgba(196,165,85,0.2)', fillStyle: 'solid', stroke: '#C4A555', strokeWidth: 1.5, roughness: 2,
  });
  for (let r of [34, 52]) {
    ctx.save();
    ctx.strokeStyle = `rgba(196,165,85,${0.22 - r * 0.002})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(c3x, pcy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  label(ctx, 'I^D', c3x, py + ph + 16, { color: '#8888b0', size: 12 });

  label(ctx, 'Dirty Image = True Sky ⊛ PSF', W / 2, 28, { color: '#9E7E38', size: 12 });
}

// ── Act 6: Max Entropy curve ───────────────────────────────────────────────
function drawMEM(rc, ctx) {
  const W = 400, H = 340;
  // Axes
  rc.line(37, 297, 362, 297, { stroke: '#2d2200', strokeWidth: 2, roughness: 0.5 });
  rc.line(37, 42, 37, 297, { stroke: '#2d2200', strokeWidth: 2, roughness: 0.5 });
  label(ctx, 'I (image)', 356, 316, { color: '#8888b0', size: 12, align: 'right' });
  label(ctx, 'S(I)', 28, 44, { color: '#8888b0', size: 12, align: 'right' });

  // Entropy curve (concave parabola)
  ctx.save();
  ctx.strokeStyle = '#C4A555';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#C4A555';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.moveTo(56, 276);
  ctx.bezierCurveTo(112, 64, 288, 64, 344, 276);
  ctx.stroke();
  ctx.restore();

  // Peak marker
  const peakX = 200, peakY = 76;
  ctx.save();
  ctx.strokeStyle = '#9E7E38';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(peakX, peakY);
  ctx.lineTo(peakX, 297);
  ctx.stroke();
  ctx.restore();
  rc.circle(peakX, peakY, 12, { fill: '#C4A555', fillStyle: 'solid', stroke: '#C4A555', roughness: 0.5 });
  label(ctx, 'max S(I)', peakX, 56, { color: '#C4A555', size: 12 });

  // χ² constraint annotation
  rc.line(280, 178, 348, 178, { stroke: '#9E7E38', strokeWidth: 1.5, roughness: 0.5, strokeLineDash: [4, 3] });
  label(ctx, 'χ²≤1', 356, 178, { color: '#9E7E38', size: 12, align: 'left' });
  label(ctx, 'Max Entropy: smoothest consistent image', W / 2, H - 10, { color: '#8888b0', size: 11 });
}

// ── Act 7: CLEAN loop animation ────────────────────────────────────────────
function drawCLEAN(rc, ctx, canvas, rafRef, reducedMotion) {
  const W = 400, H = 340;
  const cx = W / 2, cy = H / 2;

  function drawStage(stage) {
    ctx.clearRect(0, 0, W, H);
    if (stage === 0) {
      label(ctx, 'Residual Image', W / 2, 20, { color: '#9E7E38', size: 14 });
      rc.ellipse(cx, cy, 87, 108, {
        fill: 'rgba(196,165,85,0.12)', fillStyle: 'solid', stroke: '#2d2200', strokeWidth: 1.5, roughness: 1.5,
      });
      for (let r of [63, 90]) {
        ctx.save();
        ctx.strokeStyle = 'rgba(196,165,85,0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      rc.circle(cx, cy, 18, { fill: '#C4A555', fillStyle: 'solid', stroke: '#C4A555', strokeWidth: 1, roughness: 0.5 });
      rc.circle(cx, cy, 33, { stroke: '#ff6b6b', strokeWidth: 2.5, roughness: 1.2 });
      label(ctx, 'find peak →', cx + 28, cy - 18, { color: '#ff6b6b', size: 13, align: 'left' });
    } else if (stage === 1) {
      label(ctx, 'Subtract γ · B', W / 2, 20, { color: '#9E7E38', size: 14 });
      rc.ellipse(cx, cy, 87, 108, {
        fill: 'rgba(196,165,85,0.12)', fillStyle: 'solid', stroke: '#2d2200', strokeWidth: 1.5, roughness: 1.5,
      });
      rc.circle(cx, cy, 42, { stroke: '#9E7E38', strokeWidth: 2, roughness: 0.8, strokeLineDash: [4, 3] });
      arrow(ctx, cx, cy - 53, cx, cy - 84, { color: '#9E7E38', width: 2.5 });
      label(ctx, '-γ·B centered here', cx, cy - 96, { color: '#9E7E38', size: 13 });
      rc.circle(cx, cy, 11, { fill: '#C4A555', fillStyle: 'solid', stroke: '#C4A555', roughness: 0.5 });
    } else {
      label(ctx, 'Smaller Residual', W / 2, 20, { color: '#9E7E38', size: 14 });
      rc.ellipse(cx, cy, 55, 68, {
        fill: 'rgba(196,165,85,0.1)', fillStyle: 'solid', stroke: '#2d2200', strokeWidth: 1.5, roughness: 1.5,
      });
      rc.circle(cx, cy, 11, { fill: '#9E7E38', fillStyle: 'solid', stroke: '#9E7E38', roughness: 0.5 });
      ctx.save();
      ctx.strokeStyle = '#C4A555';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(cx + 75, cy, 45, -0.5, 3.8);
      ctx.stroke();
      ctx.restore();
      arrow(ctx, cx + 70, cy - 44, cx + 54, cy - 52, { color: '#C4A555', width: 2 });
      label(ctx, 'repeat', cx + 100, cy, { color: '#C4A555', size: 13 });
    }
    label(ctx, `Step ${stage + 1}/3`, 20, H - 12, { color: '#2d2200', size: 12, align: 'left' });
  }

  if (reducedMotion) {
    drawStage(0);
    return;
  }

  function frame(ts) {
    // stage switches every 1 second
    const stage = Math.floor(ts / 1000) % 3;
    drawStage(stage);
    rafRef.current = requestAnimationFrame(frame);
  }
  rafRef.current = requestAnimationFrame(frame);
}

// ── Act 8: EHT summary (three panels) ─────────────────────────────────────
function drawSummary(rc, ctx, canvas, rafRef, reducedMotion) {
  const W = 400, H = 340;
  const py = 40, ph = 190, pw = 95;
  const px1 = 12, px2 = 122, px3 = 232;
  const pcy = py + ph / 2; // 135

  [px1, px2, px3].forEach(px => {
    rc.rectangle(px, py, pw, ph, { stroke: '#2d2200', strokeWidth: 2, roughness: 0.8 });
  });

  const c1x = px1 + pw / 2; // 59
  const c2x = px2 + pw / 2; // 169
  const c3x = px3 + pw / 2; // 279

  // Panel 1: UV coverage arcs
  ctx.save();
  ctx.translate(c1x, pcy);
  const uvArcs = [
    [35, -1.1, 0.2],
    [28, 0.8, 2.1],
    [42, 1.8, 3.0],
    [22, -0.3, 1.2],
    [32, 2.4, 3.8],
  ];
  uvArcs.forEach(([r, a1, a2], i) => {
    ctx.strokeStyle = `hsl(${40 + i * 20},65%,58%)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, a1, a2);
    ctx.stroke();
  });
  ctx.restore();
  label(ctx, 'UV', c1x, py + ph + 14, { color: '#8888b0', size: 12 });

  // Arrow 1→2
  arrow(ctx, px1 + pw + 5, pcy, px2 - 5, pcy, { color: '#2d2200', width: 2 });

  // Panel 2: dirty image (ring artifact)
  rc.ellipse(c2x, pcy, 30, 26, {
    fill: 'rgba(196,165,85,0.15)', fillStyle: 'solid', stroke: '#C4A555', strokeWidth: 1.5, roughness: 1.2,
  });
  for (let r of [20, 32, 44]) {
    ctx.save();
    ctx.strokeStyle = `rgba(196,165,85,${0.28 - r * 0.004})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(c2x, pcy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  label(ctx, 'Dirty', c2x, py + ph + 14, { color: '#8888b0', size: 12 });

  // Arrow 2→3
  arrow(ctx, px2 + pw + 5, pcy, px3 - 5, pcy, { color: '#2d2200', width: 2 });

  // Panel 3: CLEAN result (animated pulse or static)
  if (reducedMotion) {
    rc.circle(c3x, pcy, 10, { fill: '#C4A555', fillStyle: 'solid', stroke: '#C4A555', strokeWidth: 1, roughness: 0.5 });
    label(ctx, 'CLEAN', c3x, py + ph + 14, { color: '#8888b0', size: 12 });
    label(ctx, '8 telescopes · 20 μas', W / 2, H - 10, { color: '#9E7E38', size: 11 });
    return;
  }

  // Draw static elements outside loop
  label(ctx, '8 telescopes · 20 μas', W / 2, H - 10, { color: '#9E7E38', size: 11 });

  function frame(ts) {
    // pulse = oscillation based on timestamp
    const pulse = ts * 0.0036;
    ctx.clearRect(px3, py, pw, ph);
    rc.rectangle(px3, py, pw, ph, { stroke: '#2d2200', strokeWidth: 2, roughness: 0.8 });
    ctx.save();
    ctx.shadowColor = '#C4A555';
    ctx.shadowBlur = 8 + 10 * Math.sin(pulse);
    rc.circle(c3x, pcy, 10, { fill: '#C4A555', fillStyle: 'solid', stroke: '#C4A555', strokeWidth: 1, roughness: 0.5 });
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = `rgba(196,165,85,${0.18 + 0.12 * Math.sin(pulse)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(c3x, pcy, 20 + 6 * Math.sin(pulse), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    label(ctx, 'CLEAN', c3x, py + ph + 14, { color: '#8888b0', size: 12 });
    rafRef.current = requestAnimationFrame(frame);
  }
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
      width="400"
      height="340"
      className="tour-diagram-canvas"
      aria-label=${'Physics diagram for tour act ' + diagramAct}
    ></canvas>
  `;
}
