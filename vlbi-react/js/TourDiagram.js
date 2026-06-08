// TourDiagram.js — Canvas 2D cinematic diagrams for the VLBI tour.
// Each d01–d08 is a React component with useRef/useEffect + RAF loop.
import { html, useRef, useEffect } from './core.js';
import { TOUR_PHYSICS } from './tourPhysics.js';

// ── Color palette ─────────────────────────────────────────────────────────────
const BG   = '#02020a';
const GOLD = '#ffd166';
const AM   = '#C4A555';
const TEAL = '#06d6a0';
const BLUE = '#4cc9f0';
const GLOW = '#ff9f43';
const RED  = '#ff3311';
const DIM  = '#8888b0';

// ── Math helpers ──────────────────────────────────────────────────────────────
function prog(T, start, dur) { return Math.max(0, Math.min(1, (T - start) / dur)); }
function ease(t) { return t < .5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2; }
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function lerp(a, b, t) { return a + (b - a) * t; }
function rgba(hex, a) {
  const r = parseInt(hex.slice(1,3),16), gv = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${gv},${b},${a.toFixed(3)})`;
}

// ── Star field ────────────────────────────────────────────────────────────────
function makeStars(W, H, count, x0=0, x1=1) {
  const COLS = ['#ffffff','#ffe8d6','#d0e8ff','#ffd0ff','#d0fff8','#fff8d0'];
  return Array.from({length: count}, () => ({
    x:   lerp(W*x0, W*x1, Math.random()),
    y:   Math.random() * H * 0.82,
    r:   Math.random() * 1.9 + 0.12,
    a:   Math.random() * 0.9 + 0.08,
    tw:  Math.random() * Math.PI * 2,
    sp:  Math.random() * 0.022 + 0.004,
    col: COLS[Math.floor(Math.random() * COLS.length)],
  }));
}

function drawStars(g, stars, T, alpha) {
  if (alpha <= 0) return;
  stars.forEach(s => {
    const tw = 0.72 + 0.28 * Math.sin(s.tw + T * s.sp * 10);
    const ea = s.a * alpha * tw;
    if (ea <= 0.01) return;
    if (s.r > 1.4 && ea > 0.5) {
      [0, Math.PI/2].forEach(ang => {
        g.save(); g.translate(s.x, s.y); g.rotate(ang);
        const sg = g.createLinearGradient(-s.r*5.5, 0, s.r*5.5, 0);
        sg.addColorStop(0, 'rgba(255,255,255,0)');
        sg.addColorStop(0.5, s.col);
        sg.addColorStop(1, 'rgba(255,255,255,0)');
        g.globalAlpha = ea;
        g.beginPath(); g.moveTo(-s.r*5.5, 0); g.lineTo(s.r*5.5, 0);
        g.strokeStyle = sg; g.lineWidth = 0.6; g.stroke();
        g.restore();
      });
    }
    g.globalAlpha = ea;
    g.beginPath(); g.arc(s.x, s.y, s.r, 0, Math.PI*2);
    g.fillStyle = s.col; g.fill();
  });
  g.globalAlpha = 1;
}

// ── Nebulae ───────────────────────────────────────────────────────────────────
function drawNebulae(g, W, H, side, alpha) {
  if (alpha <= 0) return;
  const clouds = side === 'left' ? [
    [W*.13, H*.18, 235, 138, '#cc00ff', 0.33, -0.3],
    [W*.27, H*.36, 198, 112, '#ff0066', 0.27,  0.2],
    [W*.07, H*.50, 172,  98, '#6600ee', 0.25, -0.1],
    [W*.05, H*.27, 122,  70, '#aa00ff', 0.23,  0.15],
    [W*.21, H*.10, 152,  86, '#ff2299', 0.20,  0.4],
    [W*.32, H*.55, 130,  75, '#ff0044', 0.15, -0.25],
  ] : [
    [W*.74, H*.22, 228, 128, '#0044ff', 0.31,  0.2],
    [W*.84, H*.44, 182, 106, '#00ddcc', 0.27, -0.15],
    [W*.66, H*.48, 162,  92, '#0088ff', 0.25,  0.3],
    [W*.88, H*.24, 132,  76, '#00ffee', 0.21, -0.2],
    [W*.70, H*.08, 118,  68, '#4400ff', 0.23,  0.1],
  ];
  clouds.forEach(([x, y, rx, ry, col, op, rot]) => {
    g.save(); g.translate(x, y); g.rotate(rot);
    const maxR = Math.max(rx, ry);
    const gr = g.createRadialGradient(0,0,0, 0,0,maxR);
    gr.addColorStop(0,    rgba(col, op*alpha*1.35));
    gr.addColorStop(0.3,  rgba(col, op*alpha*0.72));
    gr.addColorStop(0.68, rgba(col, op*alpha*0.18));
    gr.addColorStop(1,    'rgba(0,0,0,0)');
    g.scale(rx/maxR, ry/maxR);
    g.beginPath(); g.arc(0,0,maxR,0,Math.PI*2); g.fillStyle = gr; g.fill();
    g.restore();
  });
}

function drawMilkyWay(g, W, H, alpha) {
  if (alpha <= 0) return;
  g.save(); g.globalAlpha = alpha * 0.30;
  const grad = g.createLinearGradient(W*.04, H*.04, W*.44, H*.90);
  grad.addColorStop(0,    'rgba(190,150,255,0)');
  grad.addColorStop(0.20, 'rgba(212,172,255,0.78)');
  grad.addColorStop(0.44, 'rgba(232,202,255,1)');
  grad.addColorStop(0.70, 'rgba(202,167,255,0.72)');
  grad.addColorStop(1,    'rgba(170,140,255,0)');
  g.beginPath();
  g.moveTo(0, H*.04); g.lineTo(W*.46, H*.16); g.lineTo(W*.46, H*.74); g.lineTo(0, H*.96);
  g.closePath(); g.fillStyle = grad; g.fill();
  g.globalAlpha = alpha * 0.10;
  g.fillStyle = 'rgba(6,4,14,0.95)';
  g.beginPath();
  g.moveTo(0, H*.30);
  g.quadraticCurveTo(W*.20, H*.39, W*.46, H*.34);
  g.quadraticCurveTo(W*.20, H*.46, 0, H*.40);
  g.closePath(); g.fill();
  g.restore();
}

// ── Atacama terrain ───────────────────────────────────────────────────────────
function drawAtacama(g, cW, H, groundY, alpha) {
  if (alpha <= 0) return;
  g.save(); g.globalAlpha = alpha;

  const farGrad = g.createLinearGradient(0, groundY-H*.28, 0, groundY);
  farGrad.addColorStop(0, '#0e091e'); farGrad.addColorStop(1, '#070512');
  g.fillStyle = farGrad;
  g.beginPath(); g.moveTo(0, groundY);
  g.bezierCurveTo(cW*.06,groundY-H*.12, cW*.12,groundY-H*.22, cW*.18,groundY-H*.24);
  g.bezierCurveTo(cW*.22,groundY-H*.26, cW*.26,groundY-H*.20, cW*.31,groundY-H*.23);
  g.bezierCurveTo(cW*.36,groundY-H*.26, cW*.40,groundY-H*.28, cW*.45,groundY-H*.26);
  g.bezierCurveTo(cW*.49,groundY-H*.24, cW*.51,groundY-H*.20, cW*.54,groundY-H*.18);
  g.lineTo(cW, groundY); g.closePath(); g.fill();

  const nearGrad = g.createLinearGradient(0, groundY-H*.20, 0, groundY);
  nearGrad.addColorStop(0, '#050310'); nearGrad.addColorStop(1, '#030208');
  g.fillStyle = nearGrad;
  g.beginPath(); g.moveTo(0, groundY);
  g.bezierCurveTo(cW*.04,groundY-H*.07, cW*.09,groundY-H*.14, cW*.14,groundY-H*.16);
  g.bezierCurveTo(cW*.18,groundY-H*.18, cW*.21,groundY-H*.12, cW*.25,groundY-H*.15);
  g.bezierCurveTo(cW*.29,groundY-H*.18, cW*.33,groundY-H*.20, cW*.37,groundY-H*.18);
  g.bezierCurveTo(cW*.41,groundY-H*.16, cW*.44,groundY-H*.12, cW*.47,groundY-H*.15);
  g.bezierCurveTo(cW*.50,groundY-H*.17, cW*.52,groundY-H*.14, cW*.55,groundY-H*.11);
  g.lineTo(cW, groundY); g.closePath(); g.fill();

  const floorGrad = g.createLinearGradient(0, groundY, 0, H);
  floorGrad.addColorStop(0, '#0a0615'); floorGrad.addColorStop(1, '#020108');
  g.fillStyle = floorGrad; g.fillRect(0, groundY, cW, H - groundY);

  const hazeGrad = g.createLinearGradient(0, groundY-H*.06, 0, groundY);
  hazeGrad.addColorStop(0, 'rgba(80,20,120,0)');
  hazeGrad.addColorStop(1, 'rgba(80,20,120,0.20)');
  g.fillStyle = hazeGrad; g.fillRect(0, groundY-H*.06, cW, H*.06);

  g.globalAlpha = alpha * 0.15; g.fillStyle = '#2a1840';
  [[cW*.08,groundY+H*.02,18,5],[cW*.19,groundY+H*.03,12,4],
   [cW*.33,groundY+H*.015,22,6],[cW*.44,groundY+H*.025,14,4]].forEach(([ex,ey,erx,ery]) => {
    g.beginPath(); g.ellipse(ex,ey,erx,ery,0,0,Math.PI*2); g.fill();
  });

  g.globalAlpha = alpha * 0.20; g.strokeStyle = '#1a0c2e'; g.lineWidth = 1.2;
  [[cW*.10,groundY-2,0.45],[cW*.23,groundY-2,0.38],[cW*.41,groundY-2,0.42]].forEach(([dx,dy,dsc]) => {
    g.beginPath(); g.arc(dx, dy-dsc*14, dsc*14, Math.PI, Math.PI*2); g.stroke();
    g.beginPath(); g.moveTo(dx,dy); g.lineTo(dx,dy-dsc*14); g.stroke();
  });

  g.restore();
}

// ── Three-pass glow ───────────────────────────────────────────────────────────
function glow3(g, x, y, col, r, alpha) {
  [[r*3.5, 0.06], [r*1.8, 0.15], [r, 0.55]].forEach(([rad, op]) => {
    const gr = g.createRadialGradient(x,y,0, x,y,rad);
    gr.addColorStop(0, rgba(col, op*alpha));
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.beginPath(); g.arc(x,y,rad,0,Math.PI*2); g.fillStyle = gr; g.fill();
  });
}

// ── Radio telescope dish ──────────────────────────────────────────────────────
// Returns {fx, fy} — feed horn position. Dish opens upward (∪ shape).
function drawDish(g, cx, groundY, sc, tintGold, glowCol, alpha) {
  const fx = cx, fy = groundY - 78*sc;
  if (alpha <= 0) return { fx, fy };
  g.save(); g.globalAlpha = alpha;

  let gr = g.createRadialGradient(cx, groundY, 0, cx, groundY, 55*sc);
  gr.addColorStop(0, rgba(glowCol, 0.15)); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.beginPath(); g.ellipse(cx,groundY,55*sc,11*sc,0,0,Math.PI*2); g.fill();

  g.fillStyle = tintGold ? '#1a1428' : '#12141e';
  g.strokeStyle = tintGold ? '#3a2e18' : '#1e2035'; g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(cx-14*sc, groundY); g.lineTo(cx+14*sc, groundY);
  g.lineTo(cx+10*sc, groundY-10*sc); g.lineTo(cx-10*sc, groundY-10*sc);
  g.closePath(); g.fill(); g.stroke();

  g.fillStyle = tintGold ? '#221c30' : '#181828';
  g.fillRect(cx-5*sc, groundY-36*sc, 10*sc, 26*sc);
  g.fillStyle = 'rgba(255,255,255,0.05)';
  g.fillRect(cx+1*sc, groundY-36*sc, 2*sc, 26*sc);

  const azGrad = g.createLinearGradient(cx-12*sc,0, cx+12*sc,0);
  azGrad.addColorStop(0,'#101020'); azGrad.addColorStop(0.5,'#202040'); azGrad.addColorStop(1,'#101020');
  g.fillStyle = azGrad;
  g.beginPath(); g.ellipse(cx,groundY-36*sc,12*sc,3*sc,0,0,Math.PI*2); g.fill();
  g.strokeStyle = '#303050'; g.lineWidth = 0.5;
  g.beginPath(); g.ellipse(cx,groundY-36*sc,12*sc,3*sc,0,0,Math.PI*2); g.stroke();

  g.strokeStyle = tintGold ? '#2e2414' : '#1e2030';
  g.lineWidth = 3.5*sc; g.lineCap = 'round';
  g.beginPath(); g.moveTo(cx,groundY-36*sc);
  g.quadraticCurveTo(cx-28*sc,groundY-38*sc, cx-40*sc,groundY-42*sc); g.stroke();
  g.beginPath(); g.moveTo(cx,groundY-36*sc);
  g.quadraticCurveTo(cx+28*sc,groundY-38*sc, cx+40*sc,groundY-42*sc); g.stroke();
  g.lineCap = 'butt';

  // Parabola: vertex at bottom (groundY-42), rim at top (groundY-74)
  const pts = [];
  for (let i = 0; i <= 80; i++) {
    const t = (i/80)*2 - 1;
    pts.push([cx + t*68*sc, groundY - 42*sc - t*t*32*sc]);
  }

  g.strokeStyle = 'rgba(180,180,200,0.12)'; g.lineWidth = 0.6;
  for (let i = 0; i < 7; i++) {
    const t2 = (i/6)*2 - 1;
    g.beginPath(); g.moveTo(cx, groundY-42*sc);
    g.lineTo(cx+t2*68*sc, groundY-42*sc-t2*t2*32*sc); g.stroke();
  }

  g.save();
  // Clip to dish interior (∪ bowl: parabola path + horizontal close at rim level)
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  pts.slice(1).forEach(([px,py]) => g.lineTo(px,py));
  g.closePath(); g.clip();
  const dishGrad = g.createRadialGradient(cx-5*sc, groundY-64*sc, 0, cx, groundY-58*sc, 70*sc);
  dishGrad.addColorStop(0, tintGold ? '#2e2a18' : '#18182e');
  dishGrad.addColorStop(0.6, tintGold ? '#1a1610' : '#10101e');
  dishGrad.addColorStop(1, tintGold ? '#0e0c08' : '#08080e');
  g.fillStyle = dishGrad; g.fillRect(cx-80*sc, groundY-78*sc, 160*sc, 40*sc);
  g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 0.5;
  [0.3, 0.6, 0.9].forEach(f => {
    // Upper-semicircle arcs (above vertex = inside bowl face)
    g.beginPath(); g.arc(cx, groundY-42*sc, f*68*sc, 0, Math.PI, true); g.stroke();
  });
  for (let i = 1; i < 8; i++) {
    const ang = (i/8)*Math.PI, t2 = Math.cos(Math.PI - ang);
    g.beginPath(); g.moveTo(cx, groundY-42*sc);
    g.lineTo(cx+t2*68*sc, groundY-42*sc-t2*t2*32*sc); g.stroke();
  }
  g.restore();

  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  pts.slice(1).forEach(([px,py]) => g.lineTo(px,py)); g.stroke();

  g.strokeStyle = 'rgba(200,200,220,0.38)'; g.lineWidth = 0.9;
  [[-54,-63],[-34,-50],[34,-50],[54,-63]].forEach(([dx,dy]) => {
    g.beginPath(); g.moveTo(cx+dx*sc, groundY+dy*sc); g.lineTo(fx, fy); g.stroke();
  });

  g.fillStyle = tintGold ? '#3a2e18' : '#202030';
  g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 0.7;
  g.fillRect(fx-4*sc, fy-3*sc, 8*sc, 6*sc);
  g.strokeRect(fx-4*sc, fy-3*sc, 8*sc, 6*sc);
  glow3(g, fx, fy, glowCol, 12*sc, 1.0);

  g.restore();
  return { fx, fy };
}

// ── Beam cone ─────────────────────────────────────────────────────────────────
function drawBeam(g, fx, fy, topY, hw, col, alpha) {
  if (alpha <= 0) return;
  [[hw*1.7,0.03],[hw,0.14],[hw*0.55,0.25],[hw*0.28,0.12]].forEach(([hwm,op]) => {
    const grad = g.createLinearGradient(fx,fy, fx,topY);
    grad.addColorStop(0, rgba(col, op*alpha));
    grad.addColorStop(0.4, rgba(col, op*alpha*0.36));
    grad.addColorStop(1, rgba(col, 0));
    g.beginPath(); g.moveTo(fx-7,fy); g.lineTo(fx-hwm,topY);
    g.lineTo(fx+hwm,topY); g.lineTo(fx+7,fy); g.closePath();
    g.fillStyle = grad; g.fill();
  });
}

// ── Blurry source (unresolved M87*) ──────────────────────────────────────────
function drawBlurry(g, x, y, alpha) {
  if (alpha <= 0) return;
  [[95,0.02,'#ff2200'],[72,0.04,'#ff4400'],[52,0.07,'#ff6600'],
   [38,0.12,'#ff8800'],[28,0.20,'#ffaa22'],[18,0.38,'#ffcc55'],
   [10,0.65,'#fff5aa'],[4,0.85,'#ffffff'],[2.2,1.0,'#ffffff']].forEach(([r,op,col]) => {
    const gr = g.createRadialGradient(x,y,0, x,y,r);
    gr.addColorStop(0, rgba(col, op*alpha));
    gr.addColorStop(0.6, rgba(col, op*alpha*0.3));
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fillStyle = gr; g.fill();
  });
  [['#ff00aa',62,0.08],['#0055ff',55,0.07]].forEach(([col,r,op]) => {
    const gr = g.createRadialGradient(x,y,r*0.6, x,y,r);
    gr.addColorStop(0,'rgba(0,0,0,0)'); gr.addColorStop(1, rgba(col,op*alpha));
    g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fillStyle = gr; g.fill();
  });
}

// ── Sharp source (resolved, 6-spike diffraction) ─────────────────────────────
function drawSharp(g, x, y, alpha) {
  if (alpha <= 0) return;
  const spikeL = [48,31,48,31,48,31];
  for (let i = 0; i < 6; i++) {
    const ang = (i/6)*Math.PI*2, len = spikeL[i];
    const sg = g.createLinearGradient(x,y, x+Math.cos(ang)*len, y+Math.sin(ang)*len);
    sg.addColorStop(0, rgba(TEAL,0.65*alpha));
    sg.addColorStop(0.4, rgba(TEAL,0.22*alpha));
    sg.addColorStop(1,'rgba(0,0,0,0)');
    g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(ang)*len, y+Math.sin(ang)*len);
    g.strokeStyle = sg; g.lineWidth = i%2===0 ? 1.6 : 1.1; g.stroke();
  }
  [[42,0.06,'#4cc9f0'],[34,0.10,'#4cc9f0'],[27,0.18,'#70d4f5'],
   [20,0.28,'#90e0ff'],[14,0.45,'#b0eeff'],[8,0.68,'#d0f6ff'],
   [3,0.90,'#e8fcff'],[1.8,1.0,'#ffffff']].forEach(([r,op,col]) => {
    const gr = g.createRadialGradient(x,y,0, x,y,r);
    gr.addColorStop(0, rgba(col,op*alpha)); gr.addColorStop(1,'rgba(0,0,0,0)');
    g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fillStyle = gr; g.fill();
  });
  g.fillStyle = `rgba(255,255,255,${alpha})`;
  g.beginPath(); g.arc(x,y,1.8,0,Math.PI*2); g.fill();
}

// ── Glowing baseline with traveling pulse ─────────────────────────────────────
function drawBaseline(g, x1, y1, x2, y2, T, alpha) {
  if (alpha <= 0) return;
  g.globalAlpha = alpha*0.14; g.strokeStyle = TEAL; g.lineWidth = 9;
  g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke();
  g.globalAlpha = alpha;
  const lg = g.createLinearGradient(x1,y1,x2,y2);
  lg.addColorStop(0, rgba(TEAL,0.65)); lg.addColorStop(0.5, rgba(TEAL,0.85)); lg.addColorStop(1, rgba(TEAL,0.65));
  g.strokeStyle = lg; g.lineWidth = 2.2;
  g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke();
  const pt = (T%3.0)/3.0, px = lerp(x1,x2,pt), py = lerp(y1,y2,pt);
  const pg = g.createRadialGradient(px,py,0, px,py,14);
  pg.addColorStop(0, rgba(TEAL,0.9*alpha)); pg.addColorStop(0.5, rgba(TEAL,0.35*alpha)); pg.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle = pg; g.beginPath(); g.arc(px,py,14,0,Math.PI*2); g.fill();
  [[x1,y1],[x2,y2]].forEach(([ex,ey]) => {
    glow3(g,ex,ey,TEAL,8,0.7*alpha);
    g.fillStyle = TEAL; g.beginPath(); g.arc(ex,ey,3,0,Math.PI*2); g.fill();
  });
  g.globalAlpha = 1;
}

// ── VS divider ────────────────────────────────────────────────────────────────
function drawDivider(g, x, H, alpha) {
  if (alpha <= 0) return;
  const cg = g.createLinearGradient(x-30,0,x+30,0);
  cg.addColorStop(0,'rgba(255,209,102,0)');
  cg.addColorStop(0.5,`rgba(255,209,102,${(0.06*alpha).toFixed(3)})`);
  cg.addColorStop(1,'rgba(255,209,102,0)');
  g.fillStyle = cg; g.fillRect(x-30,0,60,H);
  g.strokeStyle = rgba(GOLD,0.25*alpha); g.lineWidth = 5;
  g.beginPath(); g.moveTo(x,0); g.lineTo(x,H); g.stroke();
  g.strokeStyle = rgba(GOLD,0.88*alpha); g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(x,0); g.lineTo(x,H); g.stroke();
  for (let i=0.05; i<1; i+=0.08) {
    g.strokeStyle = rgba(GOLD,0.35*alpha); g.lineWidth = 1;
    g.beginPath(); g.moveTo(x-4,H*i); g.lineTo(x+4,H*i); g.stroke();
  }
  const by = H*0.5, br = 22;
  g.fillStyle = rgba(GOLD,0.9*alpha);
  g.beginPath(); g.arc(x,by,br,0,Math.PI*2); g.fill();
  g.strokeStyle = rgba(GOLD,0.3*alpha); g.lineWidth = 2;
  g.beginPath(); g.arc(x,by,br+4,0,Math.PI*2); g.stroke();
  g.fillStyle = BG;
  g.font = `bold ${Math.round(br*0.9)}px "Inter","Helvetica Neue",sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('VS', x, by);
}

// ── Earth sphere ──────────────────────────────────────────────────────────────
function drawEarth(g, cx, cy, r) {
  const bg = g.createRadialGradient(cx-r*.3,cy-r*.25,0, cx,cy,r);
  bg.addColorStop(0,'#2a7cc0'); bg.addColorStop(0.5,'#1e4a90'); bg.addColorStop(1,'#04080e');
  g.beginPath(); g.arc(cx,cy,r,0,Math.PI*2); g.fillStyle = bg; g.fill();
  const sh = g.createRadialGradient(cx+r*.6,cy,r*.3, cx+r*.3,cy,r*1.2);
  sh.addColorStop(0,'rgba(2,2,10,0.82)'); sh.addColorStop(0.7,'rgba(2,2,10,0.30)'); sh.addColorStop(1,'rgba(2,2,10,0)');
  g.beginPath(); g.arc(cx,cy,r,0,Math.PI*2); g.fillStyle = sh; g.fill();
  [[r+60,36,0.04],[r+42,18,0.09],[r+24,7,0.18]].forEach(([ar,lw,op]) => {
    g.strokeStyle = rgba(TEAL,op); g.lineWidth = lw;
    g.beginPath(); g.arc(cx,cy,ar,0,Math.PI*2); g.stroke();
  });
}

// ── Overhaul utility library (depth / derivation / labelled-axis / framing) ─────
// All numbers these render come from TOUR_PHYSICS; these helpers only typeset and
// compose. Single key light is upper-left, so every cast shadow falls lower-right.

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x+r, y);
  g.arcTo(x+w, y,   x+w, y+h, r);
  g.arcTo(x+w, y+h, x,   y+h, r);
  g.arcTo(x,   y+h, x,   y,   r);
  g.arcTo(x,   y,   x+w, y,   r);
  g.closePath();
}

// Glass derivation card: symbol → substitution → result → meaning. `reveal` (0..1)
// types the lines in as the act's motion produces the number. Returns its height.
function drawDerivationPanel(g, x, y, w, lines, alpha, opts={}) {
  if (alpha <= 0) return 0;
  const pad = 16, lh = 27, titleH = opts.title ? 24 : 0;
  const h = pad*2 + titleH + lines.length*lh - 4;
  const reveal = opts.reveal == null ? 1 : opts.reveal;
  g.save();
  g.globalAlpha = alpha;
  g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 22; g.shadowOffsetY = 9;
  roundRect(g, x, y, w, h, 14); g.fillStyle = 'rgba(8,10,26,0.92)'; g.fill();
  g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0;
  roundRect(g, x+0.5, y+0.5, w-1, h-1, 14); g.strokeStyle = rgba(AM, 0.55); g.lineWidth = 1; g.stroke();
  const sheen = g.createLinearGradient(x, y, x, y+h*0.5);
  sheen.addColorStop(0, 'rgba(255,255,255,0.06)'); sheen.addColorStop(1, 'rgba(255,255,255,0)');
  roundRect(g, x, y, w, h, 14); g.fillStyle = sheen; g.fill();
  g.textBaseline = 'top'; g.textAlign = 'left';
  let ty = y + pad;
  if (opts.title) {
    g.font = '600 12px ui-sans-serif, system-ui, sans-serif'; g.fillStyle = rgba(AM, 0.95);
    g.fillText(opts.title.toUpperCase(), x+pad, ty); ty += titleH;
  }
  for (let i = 0; i < lines.length; i++) {
    const la = Math.max(0, Math.min(1, reveal*lines.length - i));
    if (la <= 0) break;
    g.globalAlpha = alpha * la;
    const ln = lines[i];
    if      (ln.kind === 'symbol') { g.font = 'italic 21px Georgia, "Times New Roman", serif'; g.fillStyle = rgba(GOLD, 1); }
    else if (ln.kind === 'sub')    { g.font = '15px "Courier New", monospace'; g.fillStyle = '#d8d8ec'; }
    else if (ln.kind === 'result') { g.font = '600 16px "Courier New", monospace'; g.fillStyle = rgba(TEAL, 1); }
    else if (ln.kind === 'note')   { g.font = 'italic 12px ui-sans-serif, sans-serif'; g.fillStyle = rgba(DIM, 1); }
    else                           { g.font = '13px ui-sans-serif, sans-serif'; g.fillStyle = '#c9c9e0'; }
    g.fillText(ln.text, x+pad, ty + i*lh);
  }
  g.restore();
  return h;
}

// Soft contact shadow (key light upper-left ⇒ shadow offset lower-right).
function drawContactShadow(g, cx, baseY, rx, ry, alpha=0.5) {
  if (alpha <= 0) return;
  const ox = cx + rx*0.15;
  g.save();
  g.translate(ox, baseY); g.scale(1, ry/rx); g.translate(-ox, -baseY);
  const grad = g.createRadialGradient(ox, baseY, 0, ox, baseY, rx);
  grad.addColorStop(0,   `rgba(0,0,0,${(0.5*alpha).toFixed(3)})`);
  grad.addColorStop(0.6, `rgba(0,0,0,${(0.26*alpha).toFixed(3)})`);
  grad.addColorStop(1,   'rgba(0,0,0,0)');
  g.beginPath(); g.arc(ox, baseY, rx, 0, Math.PI*2); g.fillStyle = grad; g.fill();
  g.restore();
}

// Ticked, labelled axes for a Fourier/sky plot occupying [x,x+w]×[y,y+h].
function drawAxisTicks(g, x, y, w, h, opts={}) {
  const cx = x + w/2, cy = y + h/2;
  g.save();
  g.strokeStyle = rgba(AM, 0.32); g.lineWidth = 1;
  g.beginPath(); g.moveTo(x, cy); g.lineTo(x+w, cy); g.moveTo(cx, y); g.lineTo(cx, y+h); g.stroke();
  g.strokeStyle = rgba(AM, 0.45);
  [0.25, 0.5, 0.75, 1].forEach(t => {
    const dx = (w/2)*t, dy = (h/2)*t;
    [cx+dx, cx-dx].forEach(px => { g.beginPath(); g.moveTo(px, cy-4); g.lineTo(px, cy+4); g.stroke(); });
    [cy+dy, cy-dy].forEach(py => { g.beginPath(); g.moveTo(cx-4, py); g.lineTo(cx+4, py); g.stroke(); });
  });
  g.fillStyle = rgba(AM, 0.92); g.font = 'italic 14px Georgia, serif'; g.textBaseline = 'alphabetic';
  if (opts.xlabel) { g.textAlign = 'right'; g.fillText(opts.xlabel, x+w-4, cy-7); }
  if (opts.ylabel) { g.textAlign = 'left';  g.fillText(opts.ylabel, cx+7, y+15); }
  if (opts.units)  { g.font = '10px "Courier New", monospace'; g.fillStyle = rgba(DIM, 0.95); g.textAlign='left'; g.textBaseline='bottom'; g.fillText(opts.units, x+2, y+h-3); }
  g.restore();
}

// Labelled scale bar with end caps.
function drawScaleBar(g, x, y, px, label, alpha=1) {
  if (alpha <= 0) return;
  g.save(); g.globalAlpha = alpha; g.lineCap = 'round';
  g.strokeStyle = '#ffffff'; g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(x, y); g.lineTo(x+px, y); g.stroke();
  g.lineWidth = 2;
  g.beginPath(); g.moveTo(x, y-5); g.lineTo(x, y+5); g.moveTo(x+px, y-5); g.lineTo(x+px, y+5); g.stroke();
  g.fillStyle = '#ffffff'; g.font = '600 13px ui-sans-serif, system-ui, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText(label, x+px/2, y-8);
  g.restore();
}

// One near-plane element per act — higher contrast + slight blur to seat mid-plane back.
function drawForegroundAccent(g, W, H, kind, alpha=1) {
  if (alpha <= 0) return;
  g.save(); g.globalAlpha = alpha;
  if (kind === 'rail') {
    g.filter = 'blur(2px)';
    const grad = g.createLinearGradient(0, H-28, 0, H);
    grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,0.62)');
    g.fillStyle = grad; g.fillRect(0, H-28, W, 28);
    g.filter = 'none';
    g.strokeStyle = rgba(AM, 0.5); g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(0, H-23); g.lineTo(W, H-23); g.stroke();
    g.strokeStyle = rgba(AM, 0.28);
    for (let i = 0; i <= W; i += 58) { g.beginPath(); g.moveTo(i, H-23); g.lineTo(i, H-9); g.stroke(); }
  } else if (kind === 'rock') {
    g.filter = 'blur(3px)';
    g.fillStyle = 'rgba(4,3,8,0.94)';
    g.beginPath(); g.moveTo(0, H); g.lineTo(0, H-44);
    g.quadraticCurveTo(W*0.05, H-78, W*0.12, H-52);
    g.quadraticCurveTo(W*0.17, H-30, W*0.23, H); g.closePath(); g.fill();
    g.filter = 'none';
  }
  g.restore();
}

// Small HUD-framed concept name — keeps the act's ONE idea legible even muted.
function drawConceptTag(g, x, y, name, alpha=1) {
  if (alpha <= 0) return;
  g.save(); g.globalAlpha = alpha;
  g.font = '600 12px ui-sans-serif, system-ui, sans-serif';
  g.textBaseline = 'middle'; g.textAlign = 'left';
  const label = name.toUpperCase();
  const tw = g.measureText(label).width;
  const bx = x, by = y-11, bh = 22, bw = tw + 34;
  g.strokeStyle = rgba(AM, 0.7); g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(bx, by+6); g.lineTo(bx, by); g.lineTo(bx+12, by);
  g.moveTo(bx, by+bh-6); g.lineTo(bx, by+bh); g.lineTo(bx+12, by+bh);
  g.moveTo(bx+bw, by+6); g.lineTo(bx+bw, by); g.lineTo(bx+bw-12, by);
  g.moveTo(bx+bw, by+bh-6); g.lineTo(bx+bw, by+bh); g.lineTo(bx+bw-12, by+bh);
  g.stroke();
  g.fillStyle = rgba(TEAL, 0.95); g.beginPath(); g.arc(bx+11, y, 2.6, 0, Math.PI*2); g.fill();
  g.fillStyle = rgba(AM, 0.95); g.fillText(label, bx+20, y+1);
  g.restore();
}

// Thin corner brackets framing the 1200×700 composition.
function drawHudFrame(g, W, H, alpha=1) {
  if (alpha <= 0) return;
  g.save(); g.globalAlpha = alpha*0.5; g.strokeStyle = rgba(AM, 0.5); g.lineWidth = 1.5;
  const m = 18, L = 26;
  [[m,m,1,1],[W-m,m,-1,1],[m,H-m,1,-1],[W-m,H-m,-1,-1]].forEach(([cx,cy,sx,sy]) => {
    g.beginPath(); g.moveTo(cx, cy+sy*L); g.lineTo(cx, cy); g.lineTo(cx+sx*L, cy); g.stroke();
  });
  g.restore();
}

// ── D01: The Resolution Problem ───────────────────────────────────────────────
function d01({ reducedMotion }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const W = cv.offsetWidth, H = cv.offsetHeight;
    if (!W || !H) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = W*dpr; cv.height = H*dpr;
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);
    const GY = H * 0.855;

    const lStars = makeStars(W, H, 280, 0, 0.47);
    const rStars = makeStars(W, H, 100, 0.53, 1.0);

    const TL = {
      cosmos: [0,   2.5], milky:  [0.3, 2.0],
      lstars: [0,   2.0], rstars: [0,   2.0],
      div:    [0.5, 1.2], latmo:  [0.8, 1.8],
      ldish:  [1.0, 2.2], lbeam:  [2.5, 1.4],
      lsrc:   [3.1, 1.2], rdish:  [3.8, 2.0],
      rbase:  [5.0, 1.2], rbeam:  [5.2, 1.2],
      rsrc:   [5.8, 1.2],
    };

    const draw = T => {
      const pa = k => ease(prog(T, TL[k][0], TL[k][1]));
      g.fillStyle = BG; g.fillRect(0,0,W,H);

      const nebA = pa('cosmos');
      g.save(); g.beginPath(); g.rect(0,0,W/2,H); g.clip();
      drawNebulae(g,W,H,'left',nebA); drawMilkyWay(g,W,H,pa('milky'));
      g.restore();
      g.save(); g.beginPath(); g.rect(W/2,0,W/2,H); g.clip();
      drawNebulae(g,W,H,'right',nebA);
      g.restore();

      drawStars(g, lStars, T, pa('lstars'));
      drawStars(g, rStars, T, pa('rstars'));
      drawDivider(g, W/2, H, pa('div'));

      g.save(); g.beginPath(); g.rect(0,0,W/2,H); g.clip();
      drawAtacama(g, W/2, H, GY, pa('latmo'));
      g.restore();

      const lda = pa('ldish');
      const { fx: lfx, fy: lfy } = drawDish(g, W*.265, GY, 1.0, true, GLOW, lda);
      drawBeam(g, lfx, lfy, H*.10+40, 178, RED, pa('lbeam'));
      drawBlurry(g, W*.265, H*.10, pa('lsrc'));

      const rda = pa('rdish');
      const { fx: r1fx, fy: r1fy } = drawDish(g, W*.610, GY, 0.78, false, TEAL, rda);
      const { fx: r2fx, fy: r2fy } = drawDish(g, W*.855, GY, 0.72, false, TEAL, rda);

      drawBaseline(g, r1fx, GY, r2fx, GY, T, pa('rbase'));

      const rbA = pa('rbeam');
      if (rbA > 0) {
        const SRCX = W*.735, SRCY = H*.10;
        [[r1fx,r1fy],[r2fx,r2fy]].forEach(([bfx,bfy]) => {
          const glg = g.createLinearGradient(bfx,bfy,SRCX,SRCY);
          glg.addColorStop(0, rgba(TEAL,0.15*rbA)); glg.addColorStop(1,'rgba(0,0,0,0)');
          g.strokeStyle=glg; g.lineWidth=8;
          g.beginPath(); g.moveTo(bfx,bfy); g.lineTo(SRCX,SRCY); g.stroke();
          const clg = g.createLinearGradient(bfx,bfy,SRCX,SRCY);
          clg.addColorStop(0, rgba(TEAL,0.72*rbA)); clg.addColorStop(1,'rgba(0,0,0,0)');
          g.strokeStyle=clg; g.lineWidth=2.2;
          g.beginPath(); g.moveTo(bfx,bfy); g.lineTo(SRCX,SRCY); g.stroke();
        });
      }
      drawSharp(g, W*.735, H*.10, pa('rsrc'));
    };

    if (reducedMotion) { draw(999); return; }
    let T = 0;
    const frame = () => { rafRef.current = requestAnimationFrame(frame); T += 1/60; draw(T); };
    frame();
    return () => cancelAnimationFrame(rafRef.current);
  }, [reducedMotion]);
  return html`<canvas ref=${canvasRef} style=${{width:'100%',height:'100%',display:'block'}}/>`;
}

// ── D02: The Baseline ─────────────────────────────────────────────────────────
function d02({ reducedMotion }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const W = cv.offsetWidth, H = cv.offsetHeight;
    if (!W || !H) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = W*dpr; cv.height = H*dpr;
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);
    const GY = H*0.56;
    const stars = makeStars(W, H, 200);

    const draw = T => {
      g.fillStyle = BG; g.fillRect(0,0,W,H);
      drawNebulae(g,W,H,'left',0.5); drawNebulae(g,W,H,'right',0.5);
      drawStars(g, stars, T, ease(prog(T,0,2.0)));

      const { fx: afx, fy: afy } = drawDish(g, W*.18, GY, 0.88, true, GLOW, ease(prog(T,0.5,1.5)));
      const { fx: jfx, fy: jfy } = drawDish(g, W*.82, GY, 0.84, false, BLUE, ease(prog(T,0.7,1.5)));

      // Wavefront (sweeping down repeatedly)
      const wfA = ease(prog(T,1.0,1.0));
      if (wfA > 0) {
        const wloopT = T < 1.0 ? 0 : T - 1.0;
        const wy = lerp(H*.08, H*.54, (wloopT % 3.5) / 3.5);
        // Ghost lines
        g.strokeStyle = '#1a1a3a'; g.lineWidth = 0.7;
        [H*.17,H*.19,H*.21].forEach(gy => {
          g.beginPath(); g.moveTo(0,gy); g.lineTo(W,gy); g.stroke();
        });
        g.globalAlpha = wfA;
        g.strokeStyle = rgba(BLUE,0.72); g.lineWidth = 2.2;
        g.beginPath(); g.moveTo(0,wy); g.lineTo(W,wy); g.stroke();
        // JCMT offset (geometric delay)
        g.strokeStyle = rgba(BLUE,0.40); g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(0,wy+15); g.lineTo(W,wy+15); g.stroke();
        g.globalAlpha = 1;
      }

      // Tick marks showing geometric delay
      const tickA = ease(prog(T,2.2,0.8));
      if (tickA > 0) {
        g.globalAlpha = tickA;
        g.strokeStyle = GOLD; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(afx,afy-6); g.lineTo(afx,afy+6); g.stroke();
        g.beginPath(); g.moveTo(jfx,jfy-6+15); g.lineTo(jfx,jfy+6+15); g.stroke();
        g.beginPath(); g.moveTo(afx,afy); g.lineTo(jfx,jfy+15); g.stroke();
        g.fillStyle = AM; g.font = '13px "Inter",sans-serif';
        g.textAlign = 'center'; g.textBaseline = 'bottom';
        g.fillText('τ_g', (afx+jfx)/2, afy-8);
        g.globalAlpha = 1;
      }

      // Baseline bar
      const bA = ease(prog(T,3.2,0.8));
      if (bA > 0) {
        g.globalAlpha = bA;
        const barY = GY+30;
        g.strokeStyle = DIM; g.lineWidth = 1;
        g.beginPath(); g.moveTo(afx,barY); g.lineTo(jfx,barY); g.stroke();
        g.beginPath(); g.moveTo(afx,barY-5); g.lineTo(afx,barY+5); g.stroke();
        g.beginPath(); g.moveTo(jfx,barY-5); g.lineTo(jfx,barY+5); g.stroke();
        g.fillStyle = DIM; g.font = '13px "Inter",sans-serif';
        g.textAlign = 'center'; g.textBaseline = 'top';
        g.fillText('B = 10,900 km', (afx+jfx)/2, barY+8);
        g.globalAlpha = 1;
      }

      // UV plane panel
      const uvA = ease(prog(T,1.5,1.0));
      if (uvA > 0) {
        const px=W*.08, py=H*.64, pw=W*.84, ph=H*.34;
        g.globalAlpha = uvA;
        g.fillStyle = 'rgba(4,6,20,0.95)';
        g.strokeStyle = DIM; g.lineWidth = 0.8;
        g.fillRect(px,py,pw,ph); g.strokeRect(px,py,pw,ph);
        const ucx=px+pw*.6, ucy=py+ph*.5;
        g.strokeStyle = '#1a1a2e'; g.lineWidth = 0.5;
        [0.3,0.6,0.9].forEach(f => {
          g.beginPath(); g.arc(ucx,ucy,pw*0.35*f,0,Math.PI*2); g.stroke();
        });
        g.strokeStyle = '#1a1a2e'; g.lineWidth = 0.7;
        g.beginPath(); g.moveTo(px+10,ucy); g.lineTo(px+pw-10,ucy); g.stroke();
        g.beginPath(); g.moveTo(ucx,py+10); g.lineTo(ucx,py+ph-10); g.stroke();
        g.fillStyle = DIM; g.font = '12px "Inter",sans-serif';
        g.textAlign = 'left'; g.textBaseline = 'middle';
        g.fillText('u', px+pw-20, ucy-12);
        g.fillText('v', ucx+8, py+15);
        const ptA = ease(prog(T,3.6,0.9));
        if (ptA > 0) {
          const scale = lerp(1.4, 1, ease(prog(T,3.6,0.9)));
          g.save(); g.translate(ucx+pw*.18, ucy); g.scale(scale,scale);
          glow3(g,0,0,AM,20,ptA); g.fillStyle=AM;
          g.beginPath(); g.arc(0,0,6,0,Math.PI*2); g.fill(); g.restore();
        }
        const cjA = ease(prog(T,4.2,0.7));
        if (cjA > 0) {
          glow3(g,ucx-pw*.18,ucy,AM,12,cjA*0.6); g.fillStyle=rgba(AM,0.6*cjA);
          g.beginPath(); g.arc(ucx-pw*.18,ucy,4,0,Math.PI*2); g.fill();
        }
        g.globalAlpha = 1;
      }
    };

    if (reducedMotion) { draw(999); return; }
    let T = 0;
    const frame = () => { rafRef.current = requestAnimationFrame(frame); T += 1/60; draw(T); };
    frame();
    return () => cancelAnimationFrame(rafRef.current);
  }, [reducedMotion]);
  return html`<canvas ref=${canvasRef} style=${{width:'100%',height:'100%',display:'block'}}/>`;
}

// ── D03: Earth Rotation Synthesis ─────────────────────────────────────────────
function d03({ reducedMotion }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const W = cv.offsetWidth, H = cv.offsetHeight;
    if (!W || !H) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = W*dpr; cv.height = H*dpr;
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);
    const stars = makeStars(W, H, 150);
    const ex = W*.26, ey = H*.50, er = H*.34;
    const uvCx = W*.76, uvCy = H*.50;

    const draw = T => {
      g.fillStyle = BG; g.fillRect(0,0,W,H);
      drawNebulae(g,W,H,'right',0.45);
      drawStars(g,stars,T,ease(prog(T,0,2.0)));
      drawEarth(g,ex,ey,er);

      // Rotating stations
      const earthAngle = T * (2*Math.PI/10);
      const s1x = ex + Math.sin(earthAngle)*er*.82;
      const s1y = ey - Math.cos(earthAngle)*er*.35;
      const s1vis = Math.cos(earthAngle) > -0.2;
      const s2x = ex - Math.sin(earthAngle)*er*.82;
      const s2y = ey + Math.cos(earthAngle)*er*.35;
      const s2vis = Math.cos(earthAngle+Math.PI) > -0.2;

      if (s1vis) { glow3(g,s1x,s1y,BLUE,10,0.8); g.fillStyle=BLUE; g.beginPath(); g.arc(s1x,s1y,4,0,Math.PI*2); g.fill(); }
      if (s2vis) { glow3(g,s2x,s2y,AM,10,0.8); g.fillStyle=AM; g.beginPath(); g.arc(s2x,s2y,4,0,Math.PI*2); g.fill(); }
      if (s1vis && s2vis) {
        g.strokeStyle = rgba(TEAL,0.55); g.lineWidth=1.5;
        g.beginPath(); g.moveTo(s1x,s1y); g.lineTo(s2x,s2y); g.stroke();
      }

      // UV panel
      const pvx = W*.54, pvy = H*.08, pvw = W*.44, pvh = H*.84;
      g.fillStyle = 'rgba(4,6,20,0.80)'; g.strokeStyle=DIM; g.lineWidth=0.8;
      g.fillRect(pvx,pvy,pvw,pvh); g.strokeRect(pvx,pvy,pvw,pvh);

      // Grid circles
      g.strokeStyle = '#1a1a2e'; g.lineWidth=0.5;
      [W*.08,W*.16,W*.20].forEach(r => { g.beginPath(); g.arc(uvCx,uvCy,r,0,Math.PI*2); g.stroke(); });
      g.strokeStyle = '#1a1a2e'; g.lineWidth=0.8;
      g.beginPath(); g.moveTo(pvx+10,uvCy); g.lineTo(pvx+pvw-10,uvCy); g.stroke();
      g.beginPath(); g.moveTo(uvCx,pvy+10); g.lineTo(uvCx,pvy+pvh-10); g.stroke();
      g.fillStyle=DIM; g.font='12px "Inter",sans-serif';
      g.textAlign='left'; g.textBaseline='middle';
      g.fillText('u',pvx+pvw-20,uvCy-12); g.fillText('v',uvCx+8,pvy+15);

      // UV arcs with lineDash draw-in
      const drawArc = (rx, ry, rot, startT, op) => {
        const circ = 2*Math.PI*Math.sqrt((rx*rx+ry*ry)/2);
        const drawn = circ * easeOut(prog(T,startT,2.0));
        if (drawn <= 0) return;
        g.save(); g.translate(uvCx,uvCy); g.rotate(rot);
        // Full arc glow
        g.setLineDash([drawn, circ*2]); g.lineDashOffset=0;
        g.beginPath(); g.ellipse(0,0,rx,ry,0,0,Math.PI*2);
        g.strokeStyle=rgba(AM,op*0.18); g.lineWidth=8; g.stroke();
        // Core arc
        g.setLineDash([drawn, circ*2]); g.lineDashOffset=0;
        g.beginPath(); g.ellipse(0,0,rx,ry,0,0,Math.PI*2);
        g.strokeStyle=rgba(AM,op); g.lineWidth=1.8; g.stroke();
        // Conjugate (lower opacity, upper half)
        g.setLineDash([drawn*.35, circ]); g.lineDashOffset=0;
        g.beginPath(); g.ellipse(0,0,rx,ry,0,0,Math.PI,true);
        g.strokeStyle=rgba(AM,op*0.28); g.lineWidth=1.0; g.stroke();
        g.setLineDash([]); g.restore();
      };
      drawArc(W*.19,H*.21,0,           1.5,0.85);
      drawArc(W*.16,H*.17,28*Math.PI/180, 2.0,0.70);
      drawArc(W*.13,H*.13,-22*Math.PI/180,2.5,0.55);

      g.fillStyle=AM; g.font='13px "Inter",sans-serif';
      g.textAlign='center'; g.textBaseline='top';
      g.globalAlpha = ease(prog(T,3.0,1.0));
      g.fillText('One baseline → one elliptical arc', uvCx, pvy+pvh-28);
      g.globalAlpha=1;
    };

    if (reducedMotion) { draw(999); return; }
    let T = 0;
    const frame = () => { rafRef.current = requestAnimationFrame(frame); T += 1/60; draw(T); };
    frame();
    return () => cancelAnimationFrame(rafRef.current);
  }, [reducedMotion]);
  return html`<canvas ref=${canvasRef} style=${{width:'100%',height:'100%',display:'block'}}/>`;
}

// ── D04: The Event Horizon Telescope ─────────────────────────────────────────
function d04({ reducedMotion }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const W = cv.offsetWidth, H = cv.offsetHeight;
    if (!W || !H) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = W*dpr; cv.height = H*dpr;
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);

    // Scale from 1200×700 SVG space
    const scx = W/1200, scy = H/700;
    const proj = (lon, lat) => ({
      x: (40 + (lon+180)/360*1120) * scx,
      y: Math.min((60 + (80-lat)/150*520) * scy, 575*scy),
    });

    const stations = [
      { ...proj(-67.755,-23.029), name:'ALMA', isAlma:true  },
      { ...proj(-67.759,-23.006), name:'APEX', isAlma:true  },
      { ...proj(-155.478,19.823), name:'SMA',  isAlma:false },
      { ...proj(-155.472,19.824), name:'JCMT', isAlma:false },
      { ...proj(-97.314, 18.986), name:'LMT',  isAlma:false },
      { ...proj(-3.392,  37.066), name:'IRAM', isAlma:false },
      { ...proj(-109.891,32.701), name:'SMT',  isAlma:false },
      { ...proj(-44.65, -89.991), name:'SPT',  isAlma:false },
      { ...proj(-68.703, 76.535), name:'GLT',  isAlma:false },
    ];

    const baselines = [];
    for (let i=0;i<stations.length;i++)
      for (let j=i+1;j<stations.length;j++)
        baselines.push({ x1:stations[i].x,y1:stations[i].y,x2:stations[j].x,y2:stations[j].y,
          isAlma:stations[i].isAlma||stations[j].isAlma });

    // Continent outline drawing helper
    const cs = pts => {
      g.beginPath();
      pts.forEach(([x,y],i) => i===0 ? g.moveTo(x*scx,y*scy) : g.lineTo(x*scx,y*scy));
      g.closePath(); g.fill(); g.stroke();
    };

    const draw = T => {
      g.fillStyle = BG; g.fillRect(0,0,W,H);
      drawNebulae(g,W,H,'left',0.25); drawNebulae(g,W,H,'right',0.25);

      // Map background
      g.fillStyle='#050a1e'; g.fillRect(40*scx,60*scy,1120*scx,520*scy);
      g.strokeStyle='#2a2200'; g.lineWidth=1.5*Math.min(scx,scy);
      g.strokeRect(40*scx,60*scy,1120*scx,520*scy);

      // Continent outlines
      g.fillStyle='#0d1a30'; g.strokeStyle='#1a2a4a'; g.lineWidth=0.8;
      // North America west
      cs([[95,68],[185,45],[248,58],[285,95],[295,145],[268,195],[238,225],[212,248],[188,272],[165,285],[142,268],[118,235],[96,198],[78,162],[72,125],[80,90]]);
      // South America west
      cs([[188,272],[218,255],[248,278],[278,308],[292,355],[298,415],[285,468],[262,510],[238,528],[212,515],[195,478],[182,428],[178,375],[182,318]]);
      // Europe/Greenland
      cs([[488,68],[545,55],[578,68],[592,88],[575,108],[548,118],[522,128],[505,115],[492,95]]);
      // Africa/Europe/Middle East
      cs([[492,95],[548,118],[582,145],[605,185],[618,245],[612,308],[592,365],[562,408],[528,428],[495,415],[468,378],[452,328],[448,268],[455,215],[468,168],[478,128]]);
      // Eurasia
      cs([[578,68],[688,42],[798,38],[885,52],[945,72],[978,105],[962,138],[915,155],[868,162],[815,148],[762,145],[715,132],[672,118],[625,108],[592,88]]);
      // Australia
      cs([[878,345],[945,332],[995,355],[1012,398],[1005,445],[972,468],[928,472],[892,448],[872,408],[868,368]]);
      // Antarctica
      g.fillStyle='#0d1a30'; g.fillRect(40*scx,618*scy,1120*scx,22*scy);

      // Lat/Lon grid
      g.strokeStyle='#12122a'; g.lineWidth=0.5;
      [-60,-30,0,30,60].forEach(lat => {
        const y=(60+(80-lat)/150*520)*scy;
        g.strokeStyle = lat===0 ? '#1c1c3a' : '#12122a';
        g.lineWidth = lat===0 ? 1 : 0.5;
        g.beginPath(); g.moveTo(40*scx,y); g.lineTo(1160*scx,y); g.stroke();
      });
      g.strokeStyle='#12122a'; g.lineWidth=0.5;
      [-150,-120,-90,-60,-30,0,30,60,90,120,150].forEach(lon => {
        const x=(40+(lon+180)/360*1120)*scx;
        g.beginPath(); g.moveTo(x,60*scy); g.lineTo(x,580*scy); g.stroke();
      });

      // Baselines
      const alma = stations[0];
      const blA = ease(prog(T,3.6,1.0));
      if (blA > 0) {
        baselines.filter(b=>b.isAlma).forEach(b => {
          g.globalAlpha=blA*0.18; g.strokeStyle=AM; g.lineWidth=3;
          g.beginPath(); g.moveTo(b.x1,b.y1); g.lineTo(b.x2,b.y2); g.stroke();
          g.globalAlpha=blA*0.65; g.strokeStyle=AM; g.lineWidth=1.4;
          g.beginPath(); g.moveTo(b.x1,b.y1); g.lineTo(b.x2,b.y2); g.stroke();
        });
        baselines.filter(b=>!b.isAlma).forEach(b => {
          g.globalAlpha=blA*0.12; g.strokeStyle=BLUE; g.lineWidth=0.7;
          g.beginPath(); g.moveTo(b.x1,b.y1); g.lineTo(b.x2,b.y2); g.stroke();
        });
        g.globalAlpha=1;
      }

      // Stations appearing one by one
      stations.forEach((s,i) => {
        const sA = ease(prog(T,0.8+i*0.4,0.5));
        if (sA <= 0) return;
        glow3(g,s.x,s.y,s.isAlma?AM:BLUE,18,sA*0.6);
        g.globalAlpha=sA; g.fillStyle = s.isAlma?GOLD:TEAL;
        g.beginPath(); g.arc(s.x,s.y,s.isAlma?8:5,0,Math.PI*2); g.fill();
        g.fillStyle=s.isAlma?GOLD:'#f0f0f8';
        g.font=`${s.isAlma?'bold ':''}`+`${s.isAlma?12:10}px "Inter",sans-serif`;
        g.textAlign=s.isAlma?'center':'start'; g.textBaseline='bottom';
        g.fillText(s.name, s.x+(s.isAlma?0:10), s.y-14);
        g.globalAlpha=1;
      });

      // ALMA callout box
      const caA = ease(prog(T,0.8,0.5));
      if (caA > 0) {
        g.globalAlpha=caA;
        g.fillStyle='rgba(196,165,85,0.08)'; g.strokeStyle=AM; g.lineWidth=0.8;
        g.fillRect(12,alma.y-12,150,38); g.strokeRect(12,alma.y-12,150,38);
        g.fillStyle=AM; g.font='10px "Inter",sans-serif';
        g.textAlign='left'; g.textBaseline='middle';
        g.fillText('SEFD: 94 Jy', 22, alma.y+3);
        g.fillStyle=DIM; g.font='italic 9px "Inter",sans-serif';
        g.fillText('Most sensitive', 22, alma.y+18);
        g.globalAlpha=1;
      }

      // UV inset
      const uvA = ease(prog(T,4.5,1.0));
      if (uvA > 0) {
        const ix=850*scx, iy=490*scy, iw=330*scx, ih=190*scy;
        g.globalAlpha=uvA;
        g.fillStyle='rgba(5,5,20,0.95)'; g.strokeStyle=AM; g.lineWidth=1;
        g.fillRect(ix,iy,iw,ih); g.strokeRect(ix,iy,iw,ih);
        const ucx=ix+iw*.5, ucy=iy+ih*.6;
        g.strokeStyle='#202040'; g.lineWidth=0.5;
        [[120*scx,72*scy,0],[85*scx,52*scy,28*Math.PI/180],[55*scx,34*scy,-22*Math.PI/180]].forEach(([rx,ry,rot],fi) => {
          const op = [0.8,0.6,0.45][fi];
          g.save(); g.translate(ucx,ucy); g.rotate(rot);
          g.beginPath(); g.moveTo(-rx,0); g.ellipse(0,0,rx,ry,0,Math.PI,Math.PI*2);
          g.strokeStyle=rgba(AM,op*uvA); g.lineWidth=1.5; g.stroke();
          g.beginPath(); g.moveTo(-rx,0); g.ellipse(0,0,rx,ry,0,0,Math.PI);
          g.strokeStyle=rgba(AM,op*0.28*uvA); g.lineWidth=0.8; g.stroke();
          g.restore();
        });
        g.fillStyle=AM; g.font=`bold ${Math.round(12*Math.min(scx,scy)*1.5)}px "Inter",sans-serif`;
        g.textAlign='center'; g.textBaseline='top'; g.fillText('UV Coverage', ucx, iy+8);
        g.globalAlpha=1;
      }

      // Footer
      g.fillStyle=DIM; g.font=`${Math.round(13*scy)}px "Inter",sans-serif`;
      g.textAlign='center'; g.textBaseline='bottom';
      g.fillText('Max baseline: 10,900 km  ·  θ_synth ≈ 20 μas  ·  28 baselines', W*.5, H-6);
    };

    if (reducedMotion) { draw(999); return; }
    let T = 0;
    const frame = () => { rafRef.current = requestAnimationFrame(frame); T += 1/60; draw(T); };
    frame();
    return () => cancelAnimationFrame(rafRef.current);
  }, [reducedMotion]);
  return html`<canvas ref=${canvasRef} style=${{width:'100%',height:'100%',display:'block'}}/>`;
}

// ── D05: From Noise to Image ───────────────────────────────────────────────────
function d05({ reducedMotion }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const W = cv.offsetWidth, H = cv.offsetHeight;
    if (!W || !H) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = W*dpr; cv.height = H*dpr;
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);
    const cx = W*.50, cy = H*.48;
    const stars = makeStars(W,H,80);

    const draw = T => {
      g.fillStyle = BG; g.fillRect(0,0,W,H);
      drawNebulae(g,W,H,'left',0.35); drawNebulae(g,W,H,'right',0.35);
      drawStars(g,stars,T,0.6);

      // Sidelobe rings (start visible, fade sequentially)
      const sl3 = 1 - ease(prog(T,0.5,2.7));
      const sl2 = 1 - ease(prog(T,1.2,2.6));
      const sl1 = 1 - ease(prog(T,2.0,2.4));
      const rings = [
        [H*.38,'#4a4a72',0.7,0.7,1.2,sl3],
        [H*.30,'#5a5a88',0.8,1.0,0.65,sl2],
        [H*.22,'#7070a0',0.9,1.2,0.7,sl1],
      ];
      rings.forEach(([r,col,op1,lw1,op2,alpha]) => {
        if (alpha<=0) return;
        g.globalAlpha=alpha*op2*0.18; g.strokeStyle=col; g.lineWidth=lw1*5;
        g.beginPath(); g.arc(cx,cy,r,0,Math.PI*2); g.stroke();
        g.globalAlpha=alpha*op1; g.strokeStyle=col; g.lineWidth=lw1;
        g.beginPath(); g.arc(cx,cy,r,0,Math.PI*2); g.stroke();
      });

      // Artifact blobs (fade with sl-ring-2)
      if (sl2 > 0) {
        g.save(); g.filter='blur(8px)';
        [[cx+160,cy-140,22,0.12],[cx-180,cy+120,16,0.10],[cx-140,cy-160,12,0.08]].forEach(([bx,by,br,op]) => {
          const bgr = g.createRadialGradient(bx,by,0,bx,by,br);
          bgr.addColorStop(0,rgba(GLOW,op*sl2)); bgr.addColorStop(1,'rgba(0,0,0,0)');
          g.beginPath(); g.arc(bx,by,br,0,Math.PI*2); g.fillStyle=bgr; g.fill();
        });
        g.filter='none';
        g.globalAlpha=sl2*0.7; g.fillStyle=DIM;
        g.font='italic 13px "Inter",sans-serif'; g.textAlign='left'; g.textBaseline='top';
        g.fillText('sidelobe artifacts', cx+200, cy-180);
        g.restore();
      }
      g.globalAlpha=1;

      // True source reveals as sidelobes fade
      const reveal = easeOut(prog(T,1.5,3.0));
      if (reveal > 0) {
        // Accretion glow
        [[H*.155,0.06,'rgba(255,110,0'],[H*.135,0.10,'rgba(255,145,0'],[H*.118,0.16,'rgba(255,182,30'],[H*.105,0.22,'rgba(255,208,40']].forEach(([r,op,col]) => {
          g.globalAlpha=reveal; g.strokeStyle=`${col},${op})`; g.lineWidth=r*.18;
          g.beginPath(); g.arc(cx,cy,r,0,Math.PI*2); g.stroke();
        });
        // Photon ring
        glow3(g,cx,cy,GOLD,H*.108,reveal);
        g.globalAlpha=reveal; g.strokeStyle=GOLD; g.lineWidth=4.5;
        g.beginPath(); g.arc(cx,cy,H*.103,0,Math.PI*2); g.stroke();
        // Shadow
        g.fillStyle='#040408'; g.beginPath(); g.arc(cx,cy,H*.092,0,Math.PI*2); g.fill();
        g.fillStyle='#020204'; g.beginPath(); g.arc(cx,cy,H*.078,0,Math.PI*2); g.fill();
      }
      g.globalAlpha=1;

      // Labels
      g.font='bold 22px "Inter",sans-serif'; g.textAlign='center'; g.textBaseline='middle';
      const dirtyA = 1 - ease(prog(T,1.0,2.0));
      if (dirtyA > 0) { g.globalAlpha=dirtyA; g.fillStyle=RED; g.fillText('Dirty Image',cx,cy-H*.44); }
      const cleanA = ease(prog(T,3.0,1.0));
      if (cleanA > 0) {
        g.globalAlpha=cleanA; g.fillStyle=TEAL; g.fillText('CLEAN Image',cx,cy-H*.44);
        g.font='17px "Courier New",monospace'; g.fillStyle=GOLD;
        g.fillText('I^C = (M ⊛ G) + r_final',cx,cy+H*.44);
      }
      g.globalAlpha=1;
    };

    if (reducedMotion) { draw(999); return; }
    let T = 0;
    const frame = () => { rafRef.current = requestAnimationFrame(frame); T += 1/60; draw(T); };
    frame();
    return () => cancelAnimationFrame(rafRef.current);
  }, [reducedMotion]);
  return html`<canvas ref=${canvasRef} style=${{width:'100%',height:'100%',display:'block'}}/>`;
}

// ── D06: First Light ───────────────────────────────────────────────────────────
function d06({ reducedMotion }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const W = cv.offsetWidth, H = cv.offsetHeight;
    if (!W || !H) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = W*dpr; cv.height = H*dpr;
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);
    const img = new Image();
    img.src = '../assets/eht-m87-2019.jpg';
    let loaded = false;
    img.onload = () => { loaded = true; };

    const draw = T => {
      g.fillStyle = BG; g.fillRect(0,0,W,H);
      if (!loaded) return;
      g.globalAlpha = reducedMotion ? 1 : ease(prog(T,0,4));
      g.drawImage(img, 20, 15, W*.70, H*.95);
      g.globalAlpha = 1;
      // Vignette
      const vg = g.createRadialGradient(W*.35,H*.5,0, W*.35,H*.5,W*.55);
      vg.addColorStop(0.5,'rgba(2,2,10,0)'); vg.addColorStop(1,'rgba(2,2,10,0.90)');
      g.fillStyle=vg; g.fillRect(0,0,W,H);
      // Scale bar
      const sbA = reducedMotion ? 1 : ease(prog(T,2.0,1.5));
      g.globalAlpha=sbA;
      g.strokeStyle=AM; g.lineWidth=2;
      g.beginPath(); g.moveTo(48,H*.93); g.lineTo(168,H*.93); g.stroke();
      g.beginPath(); g.moveTo(48,H*.93-5); g.lineTo(48,H*.93+5); g.stroke();
      g.beginPath(); g.moveTo(168,H*.93-5); g.lineTo(168,H*.93+5); g.stroke();
      g.fillStyle=AM; g.font='14px "Inter",sans-serif';
      g.textAlign='center'; g.textBaseline='top';
      g.fillText('42 μas',108,H*.93+8);
      // Title
      glow3(g,60+W*.08,H*.06,GOLD,80,sbA*0.4);
      g.fillStyle=GOLD; g.font='bold 18px "Inter",sans-serif';
      g.textAlign='left'; g.textBaseline='top';
      g.fillText('M87*  ·  April 10, 2019',60,H*.04);
      // Citation
      g.fillStyle=DIM; g.font='italic 13px "Inter",sans-serif';
      g.textAlign='center'; g.textBaseline='bottom';
      g.fillText('EHT Collaboration 2019  ·  ApJL 875, L1',W*.5,H*.99);
      g.globalAlpha=1;
    };

    if (reducedMotion) { if (loaded) draw(999); else { img.onload = () => { loaded=true; draw(999); }; } return; }
    let T = 0;
    const frame = () => { rafRef.current = requestAnimationFrame(frame); T += 1/60; draw(T); };
    frame();
    return () => cancelAnimationFrame(rafRef.current);
  }, [reducedMotion]);
  return html`<canvas ref=${canvasRef} style=${{width:'100%',height:'100%',display:'block'}}/>`;
}

// ── D07: Beyond Earth — BHEX ──────────────────────────────────────────────────
function d07({ reducedMotion }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const W = cv.offsetWidth, H = cv.offsetHeight;
    if (!W || !H) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = W*dpr; cv.height = H*dpr;
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);
    const starsBack  = makeStars(W,H,80);
    const starsMid   = makeStars(W,H,120);
    const starsFront = makeStars(W,H,80);
    const ex=W*.38, ey=H*.50, er=H*.20;
    const orx=W*.42, ory=H*.22, oRot=-22*Math.PI/180;
    const bx = ex + orx*Math.cos(oRot);
    const by = ey + orx*Math.sin(oRot);
    const almaX=ex-er*.30, almaY=ey+er*.25;

    const draw = T => {
      g.fillStyle=BG; g.fillRect(0,0,W,H);
      drawNebulae(g,W,H,'right',0.35);
      // 3-layer stars
      g.save(); g.filter='blur(1px)';
      drawStars(g,starsBack,T,0.32);
      g.filter='none'; g.restore();
      drawStars(g,starsMid,T,0.50);
      drawStars(g,starsFront,T,0.80);

      drawEarth(g,ex,ey,er);

      // Ground station markers on Earth
      glow3(g,almaX,almaY,AM,10,0.9);
      g.fillStyle=AM; g.beginPath(); g.arc(almaX,almaY,5,0,Math.PI*2); g.fill();
      g.fillStyle=AM; g.font='bold 10px "Inter",sans-serif';
      g.textAlign='right'; g.textBaseline='middle';
      g.fillText('ALMA',almaX-8,almaY);

      const iramX=ex+er*.18, iramY=ey-er*.38;
      glow3(g,iramX,iramY,BLUE,7,0.7);
      g.fillStyle=BLUE; g.beginPath(); g.arc(iramX,iramY,3.5,0,Math.PI*2); g.fill();
      g.fillStyle=DIM; g.font='10px "Inter",sans-serif';
      g.textAlign='left'; g.textBaseline='middle';
      g.fillText('IRAM',iramX+6,iramY);

      // Orbit ellipse
      g.save(); g.translate(ex,ey); g.rotate(oRot);
      g.strokeStyle=rgba(AM,0.58); g.lineWidth=1.3;
      g.beginPath(); g.ellipse(0,0,orx,ory,0,0,Math.PI*2); g.stroke();
      g.strokeStyle=rgba(AM,0.12); g.lineWidth=6;
      g.beginPath(); g.ellipse(0,0,orx,ory,0,0,Math.PI*2); g.stroke();
      g.restore();

      // BHEX satellite
      glow3(g,bx,by,GLOW,22,0.8);
      g.fillStyle=GLOW; g.strokeStyle=GOLD; g.lineWidth=2;
      g.beginPath(); g.arc(bx,by,9,0,Math.PI*2); g.fill(); g.stroke();
      // Solar panels
      g.fillStyle=rgba(GLOW,0.65);
      g.fillRect(bx-23,by-3,7,5); g.fillRect(bx+16,by-3,7,5);
      g.fillRect(bx-16,by-7,32,4);
      g.fillStyle=GLOW; g.font='bold 14px "Inter",sans-serif';
      g.textAlign='left'; g.textBaseline='bottom';
      g.fillText('BHEX',bx+18,by-6);

      // Data beam animation
      const phase1 = ease(prog(T,1.5,2.0));
      const phase2 = ease(prog(T,3.5,0.8));
      if (phase1 > 0 && phase2 < 1) {
        const pt = phase1;
        const dbx=lerp(almaX,bx,pt), dby=lerp(almaY,by,pt);
        glow3(g,dbx,dby,GOLD,16,phase1*(1-phase2));
      }
      if (phase2 > 0) {
        g.globalAlpha=phase2*0.80;
        g.strokeStyle=GOLD; g.lineWidth=1.5;
        g.setLineDash([6,8]); g.lineDashOffset = -(T*12)%14;
        g.beginPath(); g.moveTo(almaX,almaY); g.lineTo(bx,by); g.stroke();
        g.setLineDash([]);
        g.strokeStyle=rgba(GOLD,0.12); g.lineWidth=5;
        g.beginPath(); g.moveTo(almaX,almaY); g.lineTo(bx,by); g.stroke();
        g.globalAlpha=1;
      }

      // Baseline distance label
      g.globalAlpha=ease(prog(T,2.5,1.0));
      g.fillStyle=AM; g.font='15px "Inter",sans-serif';
      g.textAlign='center'; g.textBaseline='bottom';
      g.fillText('~32,900 km',(almaX+bx)/2,(almaY+by)/2-8);
      g.fillStyle=DIM; g.font='12px "Inter",sans-serif';
      g.fillText('~33 Gλ at 300 GHz',(almaX+bx)/2,(almaY+by)/2+10);
      g.globalAlpha=1;

      // Resolution comparison panels
      const panA = ease(prog(T,0.5,1.5));
      g.globalAlpha=panA;
      // Left panel (EHT Ground)
      g.fillStyle='rgba(5,5,20,0.92)'; g.strokeStyle='#2d2200'; g.lineWidth=1;
      g.fillRect(12,22,W*.22,H*.24); g.strokeRect(12,22,W*.22,H*.24);
      const lpc=12+W*.11, lpcy=22+H*.12;
      // Small photon ring mockup
      g.strokeStyle=GOLD; g.lineWidth=3; g.globalAlpha=panA*0.9;
      g.beginPath(); g.arc(lpc,lpcy,H*.06,0,Math.PI*2); g.stroke();
      g.fillStyle='#020204'; g.beginPath(); g.arc(lpc,lpcy,H*.05,0,Math.PI*2); g.fill();
      g.globalAlpha=panA;
      g.fillStyle='#f0f0f8'; g.font='bold 13px "Inter",sans-serif'; g.textAlign='center'; g.textBaseline='top';
      g.fillText('EHT Ground',lpc,26);
      g.fillStyle=TEAL; g.font='11px "Inter",sans-serif';
      g.fillText('~20 μas beam',lpc,22+H*.20);
      // Right panel (BHEX)
      g.fillStyle='rgba(5,5,20,0.92)'; g.strokeStyle=AM; g.lineWidth=1;
      g.fillRect(W-W*.22-12,22,W*.22,H*.24); g.strokeRect(W-W*.22-12,22,W*.22,H*.24);
      const rpc=W-W*.11-12, rpcy=22+H*.12;
      g.strokeStyle=GOLD; g.lineWidth=4.5; g.globalAlpha=panA*0.9;
      glow3(g,rpc,rpcy,GOLD,H*.07,panA*0.6);
      g.beginPath(); g.arc(rpc,rpcy,H*.062,0,Math.PI*2); g.stroke();
      g.fillStyle='#020204'; g.beginPath(); g.arc(rpc,rpcy,H*.052,0,Math.PI*2); g.fill();
      g.globalAlpha=panA;
      g.fillStyle=GLOW; g.font='bold 13px "Inter",sans-serif'; g.textAlign='center'; g.textBaseline='top';
      g.fillText('EHT + BHEX',rpc,26);
      g.fillStyle=TEAL; g.font='11px "Inter",sans-serif';
      g.fillText('~6 μas beam',rpc,22+H*.20);
      g.globalAlpha=1;
    };

    if (reducedMotion) { draw(999); return; }
    let T = 0;
    const frame = () => { rafRef.current = requestAnimationFrame(frame); T += 1/60; draw(T); };
    frame();
    return () => cancelAnimationFrame(rafRef.current);
  }, [reducedMotion]);
  return html`<canvas ref=${canvasRef} style=${{width:'100%',height:'100%',display:'block'}}/>`;
}

// ── D08: The Simulator ────────────────────────────────────────────────────────
function d08({ reducedMotion }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const W = cv.offsetWidth, H = cv.offsetHeight;
    if (!W || !H) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = W*dpr; cv.height = H*dpr;
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);
    const stars = makeStars(W,H,60);

    const drawRingMockup = (cx, cy, quality) => {
      [[H*.13,0.06,'rgba(255,120,0'],[H*.118,0.10,'rgba(255,160,0'],[H*.107,0.17,'rgba(255,195,30']].forEach(([r,op,col]) => {
        g.strokeStyle=`${col},${op})`; g.lineWidth=r*.16;
        g.beginPath(); g.arc(cx,cy,r,0,Math.PI*2); g.stroke();
      });
      if (quality === 'ng') { glow3(g,cx,cy,GOLD,H*.10,0.6); }
      g.strokeStyle=GOLD; g.lineWidth=quality==='ng'?5:3.5;
      g.beginPath(); g.arc(cx,cy,H*.098,0,Math.PI*2); g.stroke();
      g.fillStyle='#020510'; g.beginPath(); g.arc(cx,cy,H*.084,0,Math.PI*2); g.fill();
      // Contours
      const nContours = quality==='ng' ? 3 : 2;
      [[H*.098,0.8],[H*.122,0.55],[H*.148,0.35]].slice(0,nContours).forEach(([r,op]) => {
        g.strokeStyle=rgba(GOLD,op*(quality==='ng'?0.9:0.7)); g.lineWidth=quality==='ng'?2:1.5;
        g.beginPath(); g.arc(cx,cy,r,0,Math.PI*2); g.stroke();
      });
    };

    const draw = T => {
      g.fillStyle=BG; g.fillRect(0,0,W,H);
      drawStars(g,stars,T,0.4);

      // Panel rise animation
      const lRise = ease(prog(T,0,1.2));
      const rRise = ease(prog(T,0.3,1.2));
      const lPY = H*.08 + (1-lRise)*20;
      const rPY = H*.08 + (1-rRise)*20;
      const panH = H*.76, lPX=W*.02, rPX=W*.52, panW=W*.46;

      // Left panel (EHT 2017)
      g.globalAlpha=lRise;
      g.fillStyle='rgba(5,6,18,0.95)'; g.strokeStyle='#2d2200'; g.lineWidth=1.5;
      g.fillRect(lPX,lPY,panW,panH); g.strokeRect(lPX,lPY,panW,panH);
      g.fillStyle=DIM; g.font='bold 15px "Inter",sans-serif';
      g.textAlign='center'; g.textBaseline='bottom';
      g.fillText('EHT 2017', lPX+panW*.5, lPY-4);
      g.fillStyle='#555585'; g.font='11px "Inter",sans-serif';
      g.fillText('8 stations · 28 baselines', lPX+panW*.5, lPY-4+14);
      // Ring inside left panel
      g.fillStyle='#050818'; g.fillRect(lPX+20,lPY+60,panW-40,panH*.55);
      drawRingMockup(lPX+panW*.5, lPY+panH*.40, 'eht');
      g.fillStyle=DIM; g.font='11px "Inter",sans-serif'; g.textAlign='center'; g.textBaseline='top';
      g.fillText('DR ≈ 50:1  ·  beam ~24 μas  ·  UV fill 0.8%', lPX+panW*.5, lPY+panH*.74);
      g.globalAlpha=1;

      // Right panel (ngEHT)
      g.globalAlpha=rRise;
      glow3(g,rPX+panW*.5,rPY+panH*.5,AM,panW*.4,0.04*rRise);
      g.fillStyle='rgba(5,6,18,0.95)'; g.strokeStyle=AM; g.lineWidth=1.5;
      g.fillRect(rPX,rPY,panW,panH); g.strokeRect(rPX,rPY,panW,panH);
      g.fillStyle=AM; g.font='bold 15px "Inter",sans-serif';
      g.textAlign='center'; g.textBaseline='bottom';
      g.fillText('ngEHT Phase 1', rPX+panW*.5, rPY-4);
      g.fillStyle='#9E7E38'; g.font='11px "Inter",sans-serif';
      g.fillText('17 stations · 136 baselines', rPX+panW*.5, rPY-4+14);
      g.fillStyle='#050818'; g.fillRect(rPX+20,rPY+60,panW-40,panH*.55);
      drawRingMockup(rPX+panW*.5, rPY+panH*.40, 'ng');
      g.fillStyle=AM; g.font='11px "Inter",sans-serif'; g.textAlign='center'; g.textBaseline='top';
      g.fillText('DR ≈ 200:1  ·  beam ~18 μas  ·  UV fill 3.5%', rPX+panW*.5, rPY+panH*.74);
      g.globalAlpha=1;

      // FITS terminal slides from left
      const fitsA = ease(prog(T,2.1,0.9));
      const fitsX = lerp(-W*.22, lPX, fitsA);
      if (fitsA > 0) {
        g.globalAlpha=fitsA;
        g.fillStyle='#020208'; g.strokeStyle='#1a1a28'; g.lineWidth=0.8;
        g.fillRect(fitsX,H*.86,W*.20,H*.12); g.strokeRect(fitsX,H*.86,W*.20,H*.12);
        const ft = H*.86+H*.025;
        g.font='8px "Courier New",monospace'; g.textAlign='left'; g.textBaseline='top';
        g.fillStyle=TEAL; g.fillText('CRVAL1 = 187.7059308',fitsX+8,ft);
        g.fillStyle=AM;   g.fillText('BMAJ   = 5.56E-09',fitsX+8,ft+H*.025);
        g.fillStyle=DIM;  g.fillText('BUNIT  = \'JY/BEAM\'',fitsX+8,ft+H*.05);
        g.fillStyle='#333355'; g.fillText('END',fitsX+8,ft+H*.075);
        g.globalAlpha=1;
      }

      // Metrics panel slides from right
      const metA = ease(prog(T,2.4,0.9));
      const metX = lerp(W, W*.76, metA);
      if (metA > 0) {
        g.globalAlpha=metA;
        g.fillStyle='#020208'; g.strokeStyle='#1a1a28'; g.lineWidth=0.8;
        g.fillRect(metX,H*.86,W*.22,H*.12); g.strokeRect(metX,H*.86,W*.22,H*.12);
        const ml=metX+8, mr=metX+W*.22-8, mt=H*.86+H*.015;
        const row = (label,val,n) => {
          g.font='9px "Inter",sans-serif'; g.fillStyle=DIM;
          g.textAlign='left'; g.textBaseline='top'; g.fillText(label,ml,mt+n*H*.025);
          g.fillStyle=AM; g.textAlign='right'; g.fillText(val,mr,mt+n*H*.025);
        };
        row('Beam FWHM','~20 μas',0); row('Dynamic Range','~50:1',1);
        row('UV Fill','0.8%',2); row('Max baseline','10,900 km',3);
        g.globalAlpha=1;
      }

      // CTA
      const ctaA = ease(prog(T,3.6,1.2));
      if (ctaA > 0) {
        const ctaY = H*.92 + (1-ctaA)*12;
        g.save(); g.filter='blur(6px)'; g.globalAlpha=ctaA*0.45;
        g.fillStyle=GOLD; g.font='bold 36px "Inter","Helvetica Neue",sans-serif';
        g.textAlign='center'; g.textBaseline='middle';
        g.fillText('Place your first telescope.',W*.5,ctaY);
        g.filter='none'; g.globalAlpha=ctaA;
        g.fillText('Place your first telescope.',W*.5,ctaY);
        g.restore();
      }
    };

    if (reducedMotion) { draw(999); return; }
    let T = 0;
    const frame = () => { rafRef.current = requestAnimationFrame(frame); T += 1/60; draw(T); };
    frame();
    return () => cancelAnimationFrame(rafRef.current);
  }, [reducedMotion]);
  return html`<canvas ref=${canvasRef} style=${{width:'100%',height:'100%',display:'block'}}/>`;
}

// ── TourDiagram export ────────────────────────────────────────────────────────
export function TourDiagram({ diagramId, reducedMotion }) {
  const comps = [null, d01, d02, d03, d04, d05, d06, d07, d08];
  const Comp = comps[diagramId];
  if (!Comp) return null;
  return html`<${Comp} reducedMotion=${reducedMotion}/>`;
}
