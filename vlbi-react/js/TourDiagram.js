// TourDiagram — per-act clean vector canvas diagrams.
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

// ── Helper: filled circle ──────────────────────────────────────────────────
function filledCircle(ctx, x, y, r, fill, stroke = null) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
  ctx.restore();
}

// ── Helper: stroke-only circle ────────────────────────────────────────────
function strokeCircle(ctx, x, y, r, color, lw = 1.5, dash = []) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  if (dash.length) ctx.setLineDash(dash);
  ctx.stroke();
  ctx.restore();
}

// ── Helper: stroke rectangle ──────────────────────────────────────────────
function drawRect(ctx, x, y, w, h, stroke, lw = 2) {
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

// ── Helper: filled+stroked ellipse ────────────────────────────────────────
function filledEllipse(ctx, cx, cy, rx, ry, fill, stroke = null, lw = 1.5) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  ctx.restore();
}

// ── Helper: parabolic dish via bezier ────────────────────────────────────
function parabolicDish(ctx, cx, bottom, width, height, { color = '#C4A555', lw = 2.5 } = {}) {
  ctx.save();
  const left = cx - width / 2;
  const right = cx + width / 2;
  const top = bottom - height;
  ctx.beginPath();
  ctx.moveTo(left, bottom);
  ctx.bezierCurveTo(left, top + height * 0.15, right, top + height * 0.15, right, bottom);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.stroke();
  ctx.restore();
}

// ── Act 1: Single-dish resolution ─────────────────────────────────────────
function drawDish(ctx) {
  const W = 400, H = 340;
  // Main dish
  parabolicDish(ctx, W / 2, H - 42, 120, 85);
  // Focal point
  const cx = W / 2, cy = H - 132;
  filledCircle(ctx, cx, cy, 6, '#C4A555', '#C4A555');
  // Resolution diverging dashed lines
  ctx.save();
  ctx.strokeStyle = '#8888b0';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - 69, 24); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 69, 24); ctx.stroke();
  ctx.restore();
  // Arc showing angle θ — computed from the exact line endpoint coordinates
  const leftAngle  = Math.atan2(24 - cy, (cx - 69) - cx); // angle to left line tip
  const rightAngle = Math.atan2(24 - cy, (cx + 69) - cx); // angle to right line tip
  const midAngle   = (leftAngle + rightAngle) / 2;         // -π/2, straight up
  ctx.save();
  ctx.strokeStyle = '#9E7E38';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 44, leftAngle, rightAngle);
  ctx.stroke();
  ctx.restore();
  // Label at midpoint angle, 55px from focal point — sits between the lines
  label(ctx, 'θ', cx + 55 * Math.cos(midAngle), cy + 55 * Math.sin(midAngle), { color: '#C4A555', size: 18 });
  // D double-headed arrow
  ctx.save();
  ctx.strokeStyle = '#8888b0';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(W / 2 - 60, H - 16); ctx.lineTo(W / 2 + 60, H - 16); ctx.stroke();
  ctx.restore();
  arrow(ctx, W / 2 - 60, H - 16, W / 2 - 58, H - 16, { color: '#8888b0', width: 1.5 });
  arrow(ctx, W / 2 + 60, H - 16, W / 2 + 58, H - 16, { color: '#8888b0', width: 1.5 });
  label(ctx, 'D', W / 2, H - 4, { color: '#8888b0', size: 13 });
  // Equation
  label(ctx, 'θ ≈ λ/D', cx, 32, { color: '#e8e8f0', size: 15 });
  // Second smaller dish (larger D → smaller θ)
  parabolicDish(ctx, W * 0.82, H - 28, 60, 40, { color: '#9E7E38', lw: 2 });
  filledCircle(ctx, W * 0.82, H - 28 - 30, 4, '#9E7E38', '#9E7E38');
  ctx.save();
  ctx.strokeStyle = '#9E7E3880';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  const scx = W * 0.82, scy = H - 58;
  ctx.beginPath(); ctx.moveTo(scx, scy); ctx.lineTo(scx - 20, 40); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(scx, scy); ctx.lineTo(scx + 20, 40); ctx.stroke();
  ctx.restore();
  label(ctx, 'larger D → smaller θ', W * 0.72, 22, { color: '#9E7E38', size: 11, align: 'center' });
}

// ── Act 2: Two dishes + baseline + animated sine waves ────────────────────
function drawBaseline(ctx, canvas, rafRef, reducedMotion) {
  const W = 400, H = 340;

  if (reducedMotion) {
    parabolicDish(ctx, 75, H - 38, 75, 51);
    parabolicDish(ctx, 325, H - 38, 75, 51);
    ctx.save();
    ctx.strokeStyle = '#8888b0';
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath(); ctx.moveTo(75, H - 90); ctx.lineTo(325, H - 90); ctx.stroke();
    ctx.restore();
    label(ctx, 'B', 200, H - 72, { color: '#8888b0', size: 14 });
    label(ctx, 'ALMA', 75, H - 14, { color: '#9E7E38', size: 12 });
    label(ctx, 'IRAM', 325, H - 14, { color: '#9E7E38', size: 12 });
    sineWave(ctx, 20, 178, 115, 28, 0, { color: '#C4A555' });
    sineWave(ctx, 222, 380, 115, 28, 0.8, { color: '#9E7E38' });
    label(ctx, 'E₁', 14, 115, { color: '#C4A555', size: 13, align: 'left' });
    label(ctx, 'E₂', 216, 115, { color: '#9E7E38', size: 13, align: 'left' });
    label(ctx, 'τ', 200, 152, { color: '#8888b0', size: 13 });
    return;
  }

  function frame(ts) {
    const phase = ts * 0.0027;
    ctx.clearRect(0, 0, W, H);
    parabolicDish(ctx, 75, H - 38, 75, 51);
    parabolicDish(ctx, 325, H - 38, 75, 51);
    ctx.save();
    ctx.strokeStyle = '#8888b0';
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath(); ctx.moveTo(75, H - 90); ctx.lineTo(325, H - 90); ctx.stroke();
    ctx.restore();
    label(ctx, 'B', 200, H - 72, { color: '#8888b0', size: 14 });
    label(ctx, 'ALMA', 75, H - 14, { color: '#9E7E38', size: 12 });
    label(ctx, 'IRAM', 325, H - 14, { color: '#9E7E38', size: 12 });
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
function drawFourier(ctx) {
  const W = 400, H = 340;
  // Left panel: sky
  drawRect(ctx, 12, 30, 148, 255, '#333');
  filledEllipse(ctx, 86, 157, 31, 38, 'rgba(196,165,85,0.25)', '#C4A555', 2);
  label(ctx, 'I(x,y)', 86, 294, { color: '#8888b0', size: 12 });
  label(ctx, 'Sky', 86, 18, { color: '#9E7E38', size: 13 });

  // Fourier arrow
  arrow(ctx, 178, 157, 212, 157, { color: '#C4A555', width: 2.5 });
  label(ctx, 'ℱ', 195, 140, { color: '#C4A555', size: 17 });

  // Right panel: UV plane
  drawRect(ctx, 228, 30, 160, 255, '#333');
  // Axes
  ctx.save();
  ctx.strokeStyle = '#333';
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
    filledCircle(ctx, x, y, 4, '#C4A555', '#9E7E38');
  });
  label(ctx, 'V(u,v)', 308, 294, { color: '#8888b0', size: 12 });
  label(ctx, 'UV Plane', 308, 18, { color: '#9E7E38', size: 13 });
  label(ctx, 'u', 390, 157, { color: '#8888b0', size: 13 });
  label(ctx, 'v', 310, 36, { color: '#8888b0', size: 13, align: 'left' });
}

// ── Act 4: Earth rotation synthesis ───────────────────────────────────────
function drawEarthRotation(ctx, canvas, rafRef, reducedMotion) {
  const W = 400, H = 340;
  const cx = W / 2, cy = H / 2;

  if (reducedMotion) {
    filledCircle(ctx, cx, cy, 28, '#0a1628', null);
    strokeCircle(ctx, cx, cy, 28, '#C4A555', 2.5);
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
    const angle = (ts * 0.00018) % 1;
    ctx.clearRect(0, 0, W, H);
    filledCircle(ctx, cx, cy, 28, '#0a1628', null);
    strokeCircle(ctx, cx, cy, 28, '#C4A555', 2.5);
    filledEllipse(ctx, cx - 8, cy - 5, 9, 14, 'rgba(34,100,60,0.6)', 'rgba(34,100,60,0.8)', 1);
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
    filledCircle(ctx, dx, dy, 4.5, '#fff', '#C4A555');
    label(ctx, 'Earth rotation →', cx, H - 10, { color: '#8888b0', size: 12 });
    rafRef.current = requestAnimationFrame(frame);
  }
  rafRef.current = requestAnimationFrame(frame);
}

// ── Act 5: Dirty image (convolution diagram) ──────────────────────────────
function drawDirtyBeam(ctx) {
  const W = 400, H = 340;
  const panels = [17, 147, 277];
  const pw = 100, ph = 190, py = 50;
  const pcy = py + ph / 2; // 145

  panels.forEach(px => {
    drawRect(ctx, px, py, pw, ph, '#333');
  });

  const c1x = panels[0] + pw / 2; // 67
  const c2x = panels[1] + pw / 2; // 197
  const c3x = panels[2] + pw / 2; // 327

  // Panel 1: true sky source
  filledEllipse(ctx, c1x, pcy, 20, 26, 'rgba(196,165,85,0.5)', '#C4A555', 2);
  label(ctx, 'I_true', c1x, py + ph + 16, { color: '#8888b0', size: 12 });

  // Convolution symbol
  label(ctx, '⊛', 132, pcy, { color: '#C4A555', size: 26 });

  // Panel 2: dirty beam (PSF) with sidelobes
  filledCircle(ctx, c2x, pcy, 7, 'rgba(196,165,85,0.9)', '#C4A555');
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
  filledEllipse(ctx, c3x, pcy, 26, 34, 'rgba(196,165,85,0.2)', '#C4A555', 1.5);
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
function drawMEM(ctx) {
  const W = 400, H = 340;
  // Axes
  ctx.save();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(37, 297); ctx.lineTo(362, 297); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(37, 42); ctx.lineTo(37, 297); ctx.stroke();
  ctx.restore();
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
  filledCircle(ctx, peakX, peakY, 6, '#C4A555', '#C4A555');
  label(ctx, 'max S(I)', peakX, 56, { color: '#C4A555', size: 12 });

  // χ² constraint annotation
  ctx.save();
  ctx.strokeStyle = '#9E7E38';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(280, 178); ctx.lineTo(348, 178); ctx.stroke();
  ctx.restore();
  label(ctx, 'χ²≤1', 356, 178, { color: '#9E7E38', size: 12, align: 'left' });
  label(ctx, 'Max Entropy: smoothest consistent image', W / 2, H - 10, { color: '#8888b0', size: 11 });
}

// ── Act 7: CLEAN loop animation ────────────────────────────────────────────
function drawCLEAN(ctx, canvas, rafRef, reducedMotion) {
  const W = 400, H = 340;
  const cx = W / 2, cy = H / 2;

  function drawStage(stage) {
    ctx.clearRect(0, 0, W, H);
    if (stage === 0) {
      label(ctx, 'Residual Image', W / 2, 20, { color: '#9E7E38', size: 14 });
      filledEllipse(ctx, cx, cy, 43.5, 54, 'rgba(196,165,85,0.12)', '#333', 1.5);
      for (let r of [63, 90]) {
        ctx.save();
        ctx.strokeStyle = 'rgba(196,165,85,0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      filledCircle(ctx, cx, cy, 9, '#C4A555', '#C4A555');
      strokeCircle(ctx, cx, cy, 16.5, '#ff6b6b', 2.5);
      label(ctx, 'find peak →', cx + 28, cy - 18, { color: '#ff6b6b', size: 13, align: 'left' });
    } else if (stage === 1) {
      label(ctx, 'Subtract γ · B', W / 2, 20, { color: '#9E7E38', size: 14 });
      filledEllipse(ctx, cx, cy, 43.5, 54, 'rgba(196,165,85,0.12)', '#333', 1.5);
      strokeCircle(ctx, cx, cy, 21, '#9E7E38', 2, [4, 3]);
      arrow(ctx, cx, cy - 53, cx, cy - 84, { color: '#9E7E38', width: 2.5 });
      label(ctx, '-γ·B centered here', cx, cy - 96, { color: '#9E7E38', size: 13 });
      filledCircle(ctx, cx, cy, 5.5, '#C4A555', '#C4A555');
    } else {
      label(ctx, 'Smaller Residual', W / 2, 20, { color: '#9E7E38', size: 14 });
      filledEllipse(ctx, cx, cy, 27.5, 34, 'rgba(196,165,85,0.1)', '#333', 1.5);
      filledCircle(ctx, cx, cy, 5.5, '#9E7E38', '#9E7E38');
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
    // stage switches every 1.5 seconds
    const stage = Math.floor(ts / 1500) % 3;
    drawStage(stage);
    rafRef.current = requestAnimationFrame(frame);
  }
  rafRef.current = requestAnimationFrame(frame);
}

// ── Act 8: EHT summary (three panels) ─────────────────────────────────────
function drawSummary(ctx, canvas, rafRef, reducedMotion) {
  const W = 400, H = 340;
  const py = 40, ph = 190, pw = 95;
  const px1 = 12, px2 = 122, px3 = 232;
  const pcy = py + ph / 2; // 135

  [px1, px2, px3].forEach(px => {
    drawRect(ctx, px, py, pw, ph, '#333');
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
  arrow(ctx, px1 + pw + 5, pcy, px2 - 5, pcy, { color: '#555', width: 2 });

  // Panel 2: dirty image (ring artifact)
  filledEllipse(ctx, c2x, pcy, 15, 13, 'rgba(196,165,85,0.15)', '#C4A555', 1.5);
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
  arrow(ctx, px2 + pw + 5, pcy, px3 - 5, pcy, { color: '#555', width: 2 });

  // Panel 3: CLEAN result (animated pulse or static)
  if (reducedMotion) {
    filledCircle(ctx, c3x, pcy, 5, '#C4A555', '#C4A555');
    label(ctx, 'CLEAN', c3x, py + ph + 14, { color: '#8888b0', size: 12 });
    label(ctx, '8 telescopes · 20 μas', W / 2, H - 10, { color: '#9E7E38', size: 11 });
    return;
  }

  // Draw static elements outside loop
  label(ctx, '8 telescopes · 20 μas', W / 2, H - 10, { color: '#9E7E38', size: 11 });

  function frame(ts) {
    const pulse = ts * 0.0036;
    ctx.clearRect(px3, py, pw, ph);
    drawRect(ctx, px3, py, pw, ph, '#333');
    ctx.save();
    ctx.shadowColor = '#C4A555';
    ctx.shadowBlur = 8 + 10 * Math.sin(pulse);
    filledCircle(ctx, c3x, pcy, 5, '#C4A555', '#C4A555');
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

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (diagramAct) {
      case 1: drawDish(ctx); break;
      case 2: drawBaseline(ctx, canvas, rafRef, reducedMotion); break;
      case 3: drawFourier(ctx); break;
      case 4: drawEarthRotation(ctx, canvas, rafRef, reducedMotion); break;
      case 5: drawDirtyBeam(ctx); break;
      case 6: drawMEM(ctx); break;
      case 7: drawCLEAN(ctx, canvas, rafRef, reducedMotion); break;
      case 8: drawSummary(ctx, canvas, rafRef, reducedMotion); break;
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
