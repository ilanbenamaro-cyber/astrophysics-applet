// TourDiagram.js — Canvas 2D cinematic diagrams for the VLBI tour.
// Each d01–d08 is a React component with useRef/useEffect + RAF loop.
import { html, useRef, useEffect } from './core.js';
import { TOUR_PHYSICS } from './tourPhysics.js';
import { ARRAY_PRESETS } from './constants.js';
import { TOKENS as TK } from './tourTokens.js';

// ── Color palette — all from the site's design tokens (see tourTokens.js /
//    DESIGN-LANGUAGE.md). The legacy constant names are kept and remapped to the
//    site family so per-act draw code needs no renames; saturated tour-only hues
//    (bright gold/teal/cyan) collapse onto the one accent + amber + cool. ─────────
const BG   = TK.bg1;            // neutral near-black canvas backdrop
const GOLD = TK.accent;         // the one muted-gold accent (#C4A555)
const AM   = TK.accent;
const TEAL = TK.accent;         // structural "teal" → accent (differentiate via amber/cool)
const BLUE = TK.cool;           // licensed cinematic cool (space / Earth night)
const GLOW = TK.orange;         // warm highlight
const RED  = TK.danger;         // softened danger
const DIM  = TK.textSecondary;
const TXT  = TK.textPrimary;    // primary text
const AMBER  = TK.amber;        // secondary in-family differentiation
const BG2    = TK.bg2;
const BG3    = TK.bg3;
const BORDER = TK.border;
const FONT   = TK.font;
const MONO   = TK.fontMono;

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
  // Moderate (DESIGN-LANGUAGE Phase B): cosmic dust desaturated to the site family —
  // warm amber/bronze on the left, the licensed cool slate on the right. No candy hues.
  const clouds = side === 'left' ? [
    [W*.13, H*.18, 235, 138, '#6e5430', 0.30, -0.3],
    [W*.27, H*.36, 198, 112, '#7a5a38', 0.24,  0.2],
    [W*.07, H*.50, 172,  98, '#5a4628', 0.22, -0.1],
    [W*.05, H*.27, 122,  70, '#6a5030', 0.20,  0.15],
    [W*.21, H*.10, 152,  86, '#7c5a3a', 0.17,  0.4],
    [W*.32, H*.55, 130,  75, '#5a4024', 0.13, -0.25],
  ] : [
    [W*.74, H*.22, 228, 128, '#3a4a6a', 0.28,  0.2],
    [W*.84, H*.44, 182, 106, '#34506a', 0.24, -0.15],
    [W*.66, H*.48, 162,  92, '#2e4058', 0.22,  0.3],
    [W*.88, H*.24, 132,  76, '#3a4a6a', 0.18, -0.2],
    [W*.70, H*.08, 118,  68, '#324460', 0.20,  0.1],
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
  grad.addColorStop(0,    'rgba(140,130,110,0)');
  grad.addColorStop(0.20, 'rgba(150,140,118,0.72)');
  grad.addColorStop(0.44, 'rgba(170,158,132,0.95)');
  grad.addColorStop(0.70, 'rgba(150,140,118,0.66)');
  grad.addColorStop(1,    'rgba(140,130,110,0)');
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
  farGrad.addColorStop(0, '#16110a'); farGrad.addColorStop(1, '#0c0905');
  g.fillStyle = farGrad;
  g.beginPath(); g.moveTo(0, groundY);
  g.bezierCurveTo(cW*.06,groundY-H*.12, cW*.12,groundY-H*.22, cW*.18,groundY-H*.24);
  g.bezierCurveTo(cW*.22,groundY-H*.26, cW*.26,groundY-H*.20, cW*.31,groundY-H*.23);
  g.bezierCurveTo(cW*.36,groundY-H*.26, cW*.40,groundY-H*.28, cW*.45,groundY-H*.26);
  g.bezierCurveTo(cW*.49,groundY-H*.24, cW*.51,groundY-H*.20, cW*.54,groundY-H*.18);
  g.lineTo(cW, groundY); g.closePath(); g.fill();

  const nearGrad = g.createLinearGradient(0, groundY-H*.20, 0, groundY);
  nearGrad.addColorStop(0, '#0e0a06'); nearGrad.addColorStop(1, '#070503');
  g.fillStyle = nearGrad;
  g.beginPath(); g.moveTo(0, groundY);
  g.bezierCurveTo(cW*.04,groundY-H*.07, cW*.09,groundY-H*.14, cW*.14,groundY-H*.16);
  g.bezierCurveTo(cW*.18,groundY-H*.18, cW*.21,groundY-H*.12, cW*.25,groundY-H*.15);
  g.bezierCurveTo(cW*.29,groundY-H*.18, cW*.33,groundY-H*.20, cW*.37,groundY-H*.18);
  g.bezierCurveTo(cW*.41,groundY-H*.16, cW*.44,groundY-H*.12, cW*.47,groundY-H*.15);
  g.bezierCurveTo(cW*.50,groundY-H*.17, cW*.52,groundY-H*.14, cW*.55,groundY-H*.11);
  g.lineTo(cW, groundY); g.closePath(); g.fill();

  const floorGrad = g.createLinearGradient(0, groundY, 0, H);
  floorGrad.addColorStop(0, '#0a0805'); floorGrad.addColorStop(1, '#030202');
  g.fillStyle = floorGrad; g.fillRect(0, groundY, cW, H - groundY);

  const hazeGrad = g.createLinearGradient(0, groundY-H*.06, 0, groundY);
  hazeGrad.addColorStop(0, 'rgba(150,110,50,0)');
  hazeGrad.addColorStop(1, 'rgba(150,110,50,0.18)');
  g.fillStyle = hazeGrad; g.fillRect(0, groundY-H*.06, cW, H*.06);

  g.globalAlpha = alpha * 0.15; g.fillStyle = '#241c10';
  [[cW*.08,groundY+H*.02,18,5],[cW*.19,groundY+H*.03,12,4],
   [cW*.33,groundY+H*.015,22,6],[cW*.44,groundY+H*.025,14,4]].forEach(([ex,ey,erx,ery]) => {
    g.beginPath(); g.ellipse(ex,ey,erx,ery,0,0,Math.PI*2); g.fill();
  });

  g.globalAlpha = alpha * 0.20; g.strokeStyle = '#1a140a'; g.lineWidth = 1.2;
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
  [['#9E7E38',62,0.08],['#3a4a6a',55,0.07]].forEach(([col,r,op]) => {
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
  [[42,0.06,'#C4A555'],[34,0.10,'#C4A555'],[27,0.18,'#d4b96a'],
   [20,0.28,'#e6cf8e'],[14,0.45,'#f0e3b8'],[8,0.68,'#f8f2dc'],
   [3,0.90,'#fefdf6'],[1.8,1.0,'#ffffff']].forEach(([r,op,col]) => {
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

// Deterministic land masses (lat/lon in radians) for the modeled planet.
const PLANET_BLOBS = [
  { lon:-1.4, lat: 0.6, size:0.42 }, { lon:-1.1, lat:-0.3, size:0.50 },
  { lon: 0.2, lat: 0.7, size:0.30 }, { lon: 0.5, lat: 0.05,size:0.55 },
  { lon: 0.45,lat:-0.6, size:0.32 }, { lon: 1.9, lat: 0.2, size:0.46 },
  { lon: 2.6, lat:-0.35,size:0.30 }, { lon:-2.4, lat: 0.15,size:0.34 },
];

// A planet that reads as a planet: lit from upper-left (the tour's single key
// light), day/night terminator, rotating surface land masses, lit limb + limb
// atmosphere. `opts.rot` (radians) spins the surface; `opts.glow` tints the rim.
function drawPlanet(g, cx, cy, r, opts={}) {
  const rot = opts.rot || 0;
  g.save();
  g.beginPath(); g.arc(cx,cy,r,0,Math.PI*2); g.clip();
  // Ocean base, lit upper-left.
  const base = g.createRadialGradient(cx-r*0.38, cy-r*0.38, r*0.08, cx, cy, r*1.15);
  base.addColorStop(0,'#2f74b0'); base.addColorStop(0.55,'#184674'); base.addColorStop(1,'#081d33');
  g.fillStyle = base; g.fillRect(cx-r, cy-r, 2*r, 2*r);
  // Rotating land masses (front hemisphere only, perspective-scaled).
  for (const b of PLANET_BLOBS) {
    const lon = b.lon + rot;
    const z = Math.cos(b.lat) * Math.cos(lon);
    if (z <= 0.04) continue;                       // back hemisphere → skip
    const x = cx + r * Math.cos(b.lat) * Math.sin(lon);
    const y = cy - r * Math.sin(b.lat);
    const rr = r * b.size * (0.45 + 0.55 * z);
    const gr = g.createRadialGradient(x, y, 0, x, y, rr);
    gr.addColorStop(0, rgba('#3c6e42', 0.62 * z)); gr.addColorStop(0.7, rgba('#2c5536', 0.30 * z)); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, Math.PI*2); g.fill();
  }
  // Day/night terminator — night side falls to the lower-right of the key light.
  const sh = g.createRadialGradient(cx-r*0.5, cy-r*0.5, r*0.15, cx+r*0.35, cy+r*0.35, r*1.45);
  sh.addColorStop(0,'rgba(2,4,10,0)'); sh.addColorStop(0.48,'rgba(2,4,10,0.12)');
  sh.addColorStop(0.78,'rgba(2,4,10,0.66)'); sh.addColorStop(1,'rgba(1,2,6,0.93)');
  g.fillStyle = sh; g.fillRect(cx-r, cy-r, 2*r, 2*r);
  g.restore();
  // Lit limb (upper-left rim catches the light).
  const limb = g.createLinearGradient(cx-r, cy-r, cx+r, cy+r);
  limb.addColorStop(0, rgba(BLUE,0.75)); limb.addColorStop(0.5, rgba(BLUE,0.10)); limb.addColorStop(1,'rgba(0,0,0,0)');
  g.strokeStyle = limb; g.lineWidth = 2.4; g.beginPath(); g.arc(cx, cy, r-1, 0, Math.PI*2); g.stroke();
  // Limb atmosphere glow.
  [[r+20,7,0.10],[r+11,5,0.18],[r+4,3,0.30]].forEach(([ar,lw,op]) => {
    g.strokeStyle = rgba(BLUE,op); g.lineWidth = lw; g.beginPath(); g.arc(cx,cy,ar,0,Math.PI*2); g.stroke();
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
  const pad = 14, lh = 25, titleH = opts.title ? 22 : 0;
  const h = pad*2 + titleH + lines.length*lh - 3;
  const reveal = opts.reveal == null ? 1 : opts.reveal;
  g.save();
  g.globalAlpha = alpha;
  // Flat site panel — --bg-2 fill, 1px --border, small radius, NO shadow/sheen/glow.
  roundRect(g, x, y, w, h, 6); g.fillStyle = rgba(BG2, 0.96); g.fill();
  roundRect(g, x+0.5, y+0.5, w-1, h-1, 6); g.strokeStyle = BORDER; g.lineWidth = 1; g.stroke();
  g.textBaseline = 'top'; g.textAlign = 'left';
  let ty = y + pad;
  if (opts.title) {
    g.font = `600 11px ${FONT}`; g.fillStyle = DIM;        // app label treatment
    try { g.letterSpacing = '0.6px'; } catch (_) {}
    g.fillText(opts.title.toUpperCase(), x+pad, ty);
    try { g.letterSpacing = '0px'; } catch (_) {}
    ty += titleH;
  }
  for (let i = 0; i < lines.length; i++) {
    const la = Math.max(0, Math.min(1, reveal*lines.length - i));
    if (la <= 0) break;
    g.globalAlpha = alpha * la;
    const ln = lines[i];
    if      (ln.kind === 'symbol') { g.font = `500 17px ${MONO}`; g.fillStyle = TXT; }
    else if (ln.kind === 'sub')    { g.font = `13px ${MONO}`;     g.fillStyle = DIM; }
    else if (ln.kind === 'result') { g.font = `600 14px ${MONO}`; g.fillStyle = AM; }
    else if (ln.kind === 'note')   { g.font = `11px ${FONT}`;     g.fillStyle = DIM; }
    else                           { g.font = `12px ${FONT}`;     g.fillStyle = TXT; }
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
  g.fillStyle = rgba(AM, 0.92); g.font = `600 13px ${MONO}`; g.textBaseline = 'alphabetic';
  if (opts.xlabel) { g.textAlign = 'right'; g.fillText(opts.xlabel, x+w-4, cy-7); }
  if (opts.ylabel) { g.textAlign = 'left';  g.fillText(opts.ylabel, cx+7, y+15); }
  if (opts.units)  { g.font = `10px ${MONO}`; g.fillStyle = rgba(DIM, 0.95); g.textAlign='left'; g.textBaseline='bottom'; g.fillText(opts.units, x+2, y+h-3); }
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
  g.fillStyle = '#ffffff'; g.font = `600 13px ${FONT}`;
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

// Quiet chapter marker — one small low-opacity line, top-left. NOT chrome: it
// names the act's single idea without competing with the subject (deference).
function drawConceptTag(g, x, y, name, alpha=1) {
  if (alpha <= 0) return;
  g.save();
  g.globalAlpha = alpha * 0.9;
  g.font = `600 11px ${FONT}`;                 // app label treatment: uppercase, spaced, secondary
  try { g.letterSpacing = '0.9px'; } catch (_) {}
  g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillStyle = DIM;
  g.fillText(name.toUpperCase(), x, y);
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
      concept:[0.5, 1.0], hud:    [0.3, 1.5], fg: [0.9, 1.5],
      panelL: [3.4, 1.4], panelR: [6.0, 1.6],
    };
    const P = TOUR_PHYSICS;

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

      // Terrain spans the full frame so the right (interferometer) side has the
      // same ground/depth as the left — closes the old right-side dead band.
      drawAtacama(g, W, H, GY, pa('latmo'));

      const lda = pa('ldish');
      drawContactShadow(g, W*.265, GY+10, 76, 13, lda*0.85);
      const { fx: lfx, fy: lfy } = drawDish(g, W*.265, GY, 1.0, true, GLOW, lda);
      drawBeam(g, lfx, lfy, H*.10+40, 178, RED, pa('lbeam'));
      drawBlurry(g, W*.265, H*.10, pa('lsrc'));
      if (pa('lsrc') > 0) {
        g.save(); g.globalAlpha = pa('lsrc');
        g.fillStyle = rgba(RED, 0.92); g.font = `600 13px ${FONT}`;
        g.textAlign = 'center'; g.textBaseline = 'top';
        g.fillText('UNRESOLVED', W*.265, H*.185);
        g.restore();
      }

      const rda = pa('rdish');
      drawContactShadow(g, W*.610, GY+10, 58, 11, rda*0.85);
      drawContactShadow(g, W*.855, GY+10, 54, 10, rda*0.85);
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
      const rsA = pa('rsrc');
      if (rsA > 0) glow3(g, W*.735, H*.10, BLUE, 28, rsA*0.85);
      drawSharp(g, W*.735, H*.10, rsA);
      if (rsA > 0) {
        g.save(); g.globalAlpha = rsA;
        g.fillStyle = rgba(TEAL, 0.97); g.font = `600 13px ${FONT}`;
        g.textAlign = 'center'; g.textBaseline = 'top';
        g.fillText('RESOLVED', W*.735, H*.185);
        g.restore();
      }

      // Derivation — the single dish cannot resolve the shadow; the baseline can.
      drawDerivationPanel(g, W*.045, H*.30, W*.40, [
        { kind:'symbol', text:'θ = λ / D' },
        { kind:'sub',    text:`= ${P.str.lambda} / ${P.dishD_m} m` },
        { kind:'result', text:`= ${P.str.thetaDish}  — far too coarse` },
      ], pa('panelL'), { title:'Single dish (D = 100 m)', reveal: pa('panelL') });

      drawDerivationPanel(g, W*.545, H*.30, W*.41, [
        { kind:'symbol', text:'θ = λ / B' },
        { kind:'sub',    text:`= ${P.str.lambda} / ${P.str.ehtBaseline}` },
        { kind:'result', text:`= ${P.str.thetaEht}  →  resolves ${P.str.m87Shadow}` },
        { kind:'note',   text:`${P.str.improvement} finer resolution than one dish · (Rayleigh ×1.22)` },
      ], pa('panelR'), { title:'EHT 2017 · M87* · baseline B', reveal: pa('panelR') });

      drawConceptTag(g, W*.045, H*.085, 'Angular Resolution', pa('concept'));
      drawForegroundAccent(g, W, H, 'rail', pa('fg'));
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
    const GY = H*0.50;
    const stars = makeStars(W, H, 200);
    const P = TOUR_PHYSICS;

    const draw = T => {
      const pa = (s,d) => ease(prog(T,s,d));
      g.fillStyle = BG; g.fillRect(0,0,W,H);
      drawNebulae(g,W,H,'left',0.45); drawNebulae(g,W,H,'right',0.45);
      drawStars(g, stars, T, pa(0,2.0));

      // One plane wavefront sweeps down; it reaches the two dishes at different
      // times — the geometric delay τ_g that encodes one Fourier mode of the sky.
      const sceneTop = H*0.07;
      const wfA = pa(0.8,1.0);
      if (wfA > 0) {
        const wl = T < 0.8 ? 0 : T - 0.8;
        const wy = lerp(sceneTop, GY-28, (wl % 3.2)/3.2);
        g.globalAlpha = wfA;
        g.strokeStyle = rgba(BLUE,0.20); g.lineWidth = 1;
        [-15,-30].forEach(o => { g.beginPath(); g.moveTo(0,wy+o); g.lineTo(W,wy+o); g.stroke(); });
        g.strokeStyle = rgba(BLUE,0.78); g.lineWidth = 2.4;
        g.beginPath(); g.moveTo(0,wy); g.lineTo(W,wy); g.stroke();
        g.globalAlpha = 1;
      }

      // Two large dishes with contact shadows — the baseline geometry dominates.
      const da = pa(0.5,1.4);
      drawContactShadow(g, W*.205, GY+12, 90, 15, da*0.85);
      drawContactShadow(g, W*.795, GY+12, 84, 14, da*0.85);
      const { fx: afx, fy: afy } = drawDish(g, W*.205, GY, 1.18, true, GLOW, da);
      const { fx: jfx, fy: jfy } = drawDish(g, W*.795, GY, 1.10, false, BLUE, pa(0.7,1.4));

      // Geometric-delay ray between the two feeds.
      const tickA = pa(2.0,0.8);
      if (tickA > 0) {
        g.globalAlpha = tickA;
        g.strokeStyle = rgba(GOLD,0.85); g.lineWidth = 1.6; g.setLineDash([5,4]);
        g.beginPath(); g.moveTo(afx,afy); g.lineTo(jfx,jfy); g.stroke(); g.setLineDash([]);
        g.fillStyle = AM; g.font = 'italic 16px Georgia, serif';
        g.textAlign = 'center'; g.textBaseline = 'bottom';
        g.fillText('τ_g', (afx+jfx)/2, (afy+jfy)/2 - 7);
        g.globalAlpha = 1;
      }

      // Baseline B bar — value computed, never asserted.
      const bA = pa(2.6,0.8);
      if (bA > 0) {
        g.globalAlpha = bA; const barY = GY+34;
        g.strokeStyle = DIM; g.lineWidth = 1;
        g.beginPath(); g.moveTo(afx,barY); g.lineTo(jfx,barY); g.stroke();
        g.beginPath(); g.moveTo(afx,barY-5); g.lineTo(afx,barY+5); g.stroke();
        g.beginPath(); g.moveTo(jfx,barY-5); g.lineTo(jfx,barY+5); g.stroke();
        g.fillStyle = AM; g.font = '13px "Inter",sans-serif';
        g.textAlign = 'center'; g.textBaseline = 'top';
        g.fillText(`B = ${P.str.ehtBaseline} (M87*)   ·   |u| = B/λ ≈ ${P.str.uMax}`, (afx+jfx)/2, barY+8);
        g.globalAlpha = 1;
      }

      // ── Lower strip: the measurement (enlarged UV plane) beside the math (caption) ──
      const stripY = H*.555, uvS = H*.40, uvX = W*.055;
      const uvA = pa(3.0,1.0);
      if (uvA > 0) {
        g.globalAlpha = uvA;
        g.fillStyle = 'rgba(4,6,20,0.92)'; roundRect(g, uvX, stripY, uvS, uvS, 10); g.fill();
        g.strokeStyle = rgba(AM,0.4); g.lineWidth = 1; g.stroke();
        g.globalAlpha = 1;
        drawAxisTicks(g, uvX, stripY, uvS, uvS, { xlabel:'u', ylabel:'v', units:'Gλ' });
        const ucx = uvX+uvS/2, ucy = stripY+uvS/2, off = uvS*0.30;
        const ptA = pa(3.8,0.9);
        if (ptA > 0) {
          glow3(g, ucx+off, ucy-uvS*0.13, AM, 18, ptA);
          g.fillStyle = AM; g.beginPath(); g.arc(ucx+off, ucy-uvS*0.13, 5.5, 0, Math.PI*2); g.fill();
          glow3(g, ucx-off, ucy+uvS*0.13, AM, 12, ptA*0.55);
          g.fillStyle = rgba(AM,0.55*ptA); g.beginPath(); g.arc(ucx-off, ucy+uvS*0.13, 4.5, 0, Math.PI*2); g.fill();
          g.globalAlpha=ptA; g.fillStyle=rgba(AM,0.9); g.font='italic 11px Georgia,serif';
          g.textAlign='left'; g.textBaseline='bottom'; g.fillText('one (u,v) sample + conjugate', ucx+off+9, ucy-uvS*0.13-6);
          g.globalAlpha=1;
        }
      }
      // Van Cittert–Zernike as a quiet caption beside the plane — no glass card (LAW 1).
      const cxx = uvX + uvS + W*0.05;
      const capA = pa(3.2,1.6);
      g.save(); g.globalAlpha = capA; g.textAlign='left'; g.textBaseline='top';
      g.fillStyle=rgba(AM,0.95); g.font='600 12px ui-sans-serif,system-ui,sans-serif';
      g.fillText('VAN CITTERT–ZERNIKE', cxx, stripY+24);
      g.fillStyle=GOLD; g.font='italic 21px Georgia, serif';
      g.fillText('V(u,v) = ∬ I(l,m) e^(−2πi(ul+vm)) dl dm', cxx, stripY+46);
      g.fillStyle='#cfcfe6'; g.font='14px "Courier New",monospace';
      g.fillText('one baseline → one complex visibility', cxx, stripY+84);
      g.fillStyle=rgba(TEAL,0.95); g.font='600 14px "Courier New",monospace';
      g.fillText('= a single Fourier mode of the sky', cxx, stripY+106);
      g.restore();

      drawConceptTag(g, W*.045, H*.075, 'One Fourier Mode', pa(0.5,1.0));
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
    const P = TOUR_PHYSICS;
    const ex = W*.25, ey = H*.38, er = H*.26;
    const pvx = W*.52, pvy = H*.04, pvw = W*.45, pvh = H*.62;
    const uvCx = pvx + pvw*.52, uvCy = pvy + pvh*.46;
    const voff = pvh*0.07;   // ellipse-centre offset, v0 = B_Z cosδ/λ (illustrative)

    const draw = T => {
      const pa = (s,d) => ease(prog(T,s,d));
      g.fillStyle = BG; g.fillRect(0,0,W,H);
      drawNebulae(g,W,H,'right',0.40); drawNebulae(g,W,H,'left',0.28);
      drawStars(g,stars,T,pa(0,2.0));

      // Rotating, modeled planet (terminator + surface + limb) — the rotation IS the
      // mechanism that sweeps the baseline through the (u,v) plane.
      const earthAngle = T * (2*Math.PI/10);
      drawPlanet(g, ex, ey, er, { rot: earthAngle });

      // Station pair carried by the spin; the baseline is drawn TEAL so it can be
      // colour-matched to the teal ellipse it traces in (u,v).
      const s1x = ex + Math.sin(earthAngle)*er*.82, s1y = ey - Math.cos(earthAngle)*er*.35;
      const s2x = ex - Math.sin(earthAngle)*er*.82, s2y = ey + Math.cos(earthAngle)*er*.35;
      const s1vis = Math.cos(earthAngle) > -0.2, s2vis = Math.cos(earthAngle+Math.PI) > -0.2;
      if (s1vis && s2vis) { glow3(g,(s1x+s2x)/2,(s1y+s2y)/2,TEAL,8,0.4); g.strokeStyle=rgba(TEAL,0.85); g.lineWidth=2; g.beginPath(); g.moveTo(s1x,s1y); g.lineTo(s2x,s2y); g.stroke(); }
      if (s1vis) { glow3(g,s1x,s1y,TEAL,11,0.9); g.fillStyle='#f0e3b8'; g.beginPath(); g.arc(s1x,s1y,4,0,Math.PI*2); g.fill(); }
      if (s2vis) { glow3(g,s2x,s2y,TEAL,11,0.9); g.fillStyle='#f0e3b8'; g.beginPath(); g.arc(s2x,s2y,4,0,Math.PI*2); g.fill(); }

      // UV panel
      g.fillStyle=rgba(BG2,0.88); roundRect(g,pvx,pvy,pvw,pvh,10); g.fill();
      g.strokeStyle=rgba(AM,0.4); g.lineWidth=1; g.stroke();
      drawAxisTicks(g, pvx, pvy, pvw, pvh, { xlabel:'u', ylabel:'v', units:'Gλ' });

      // Ellipse-centre reference: v0 = B_Z cosδ/λ.
      g.save(); g.setLineDash([4,4]); g.strokeStyle=rgba(TEAL,0.45); g.lineWidth=1;
      g.beginPath(); g.moveTo(pvx+12, uvCy-voff); g.lineTo(pvx+pvw-12, uvCy-voff); g.stroke();
      g.setLineDash([]);
      g.fillStyle=rgba(TEAL,0.9); g.font=`12px ${MONO}`; g.textAlign='left'; g.textBaseline='bottom';
      g.fillText('v₀ = B_Z cosδ / λ', pvx+16, uvCy-voff-3);
      g.restore();

      // Three baselines → three ellipse arcs (centred on v0), drawn in over H.
      // The primary arc is TEAL — colour-matched to the baseline drawn on the globe.
      const drawArc = (rx, ry, rot, startT, op, col) => {
        const circ = 2*Math.PI*Math.sqrt((rx*rx+ry*ry)/2);
        const drawn = circ * easeOut(prog(T,startT,2.0));
        if (drawn <= 0) return;
        g.save(); g.translate(uvCx,uvCy-voff); g.rotate(rot);
        g.setLineDash([drawn, circ*2]);
        g.beginPath(); g.ellipse(0,0,rx,ry,0,0,Math.PI*2); g.strokeStyle=rgba(col,op*0.18); g.lineWidth=8; g.stroke();
        g.beginPath(); g.ellipse(0,0,rx,ry,0,0,Math.PI*2); g.strokeStyle=rgba(col,op); g.lineWidth=1.8; g.stroke();
        g.setLineDash([drawn*.35, circ]);
        g.beginPath(); g.ellipse(0,0,rx,ry,0,0,Math.PI,true); g.strokeStyle=rgba(col,op*0.28); g.lineWidth=1.0; g.stroke();
        g.setLineDash([]); g.restore();
      };
      drawArc(pvw*.40, pvh*.30, 0,             1.5, 0.90, TEAL);    // ← matches the accent baseline
      drawArc(pvw*.33, pvh*.24, 28*Math.PI/180, 2.0, 0.62, AMBER); // other baselines: darker amber
      drawArc(pvw*.27, pvh*.18, -22*Math.PI/180,2.5, 0.48, AMBER);

      // Quiet annotation (no glass card) — the exact u,v(H,δ) that trace the ellipse.
      const ay = H*0.74, axx = W*0.06, anA = pa(2.6,1.6);
      g.save(); g.globalAlpha = anA; g.textAlign='left'; g.textBaseline='top';
      g.fillStyle=rgba(TEAL,0.92); g.font=`600 11px ${FONT}`;
      g.fillText('ONE BASELINE → ONE ELLIPSE  ·  colour-matched above', axx, ay);
      g.fillStyle=TXT; g.font=`14px ${MONO}`;
      g.fillText('u =  B_X sin H + B_Y cos H', axx, ay+22);
      g.fillText('v = −B_X sinδ cos H + B_Y sinδ sin H + B_Z cosδ        (each ÷ λ)', axx, ay+44);
      g.fillStyle=rgba(DIM,0.95); g.font=`11px ${FONT}`;
      g.fillText('→ over hour angle H the (u,v) point traces an ellipse centred at v₀ = B_Z cosδ / λ', axx, ay+68);
      g.restore();

      drawConceptTag(g, W*.04, H*.05, 'Aperture Synthesis', pa(0.5,1.0));
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

    // Equirectangular map. Bounds in 1200×700 space; tall enough to fill the frame.
    const scx = W/1200, scy = H/700;
    const MX0 = 40*scx, MY0 = 44*scy, MW = 1120*scx, MH = 602*scy;
    const proj = (lon, lat) => ({
      x: MX0 + (lon+180)/360*MW,
      y: MY0 + Math.min(Math.max((84-lat)/162, 0), 1) * MH,
    });

    // EHT 2017 — 8 telescopes at 6 sites, read from constants.js (no invented
    // coordinates; GLT joined in 2018 and is intentionally excluded here).
    const P = TOUR_PHYSICS;
    const ATACAMA = new Set(['ALMA','APEX']);   // the sensitivity anchor site
    const stations = ARRAY_PRESETS['EHT 2017'].map(s => ({
      ...proj(s.lon, s.lat), name: s.name, isAlma: ATACAMA.has(s.name),
    }));

    const baselines = [];
    for (let i=0;i<stations.length;i++)
      for (let j=i+1;j<stations.length;j++)
        baselines.push({ x1:stations[i].x,y1:stations[i].y,x2:stations[j].x,y2:stations[j].y,
          isAlma:stations[i].isAlma||stations[j].isAlma });

    // Landmass helper — takes [lon,lat] vertices and projects them, so the shapes
    // are recognizable continents rather than arbitrary screen-space blobs.
    const land = lonlat => {
      g.beginPath();
      lonlat.forEach(([lon,lat],i) => { const p = proj(lon,lat); i===0 ? g.moveTo(p.x,p.y) : g.lineTo(p.x,p.y); });
      g.closePath(); g.fill(); g.stroke();
    };

    const draw = T => {
      g.fillStyle = BG; g.fillRect(0,0,W,H);
      drawNebulae(g,W,H,'left',0.25); drawNebulae(g,W,H,'right',0.25);

      // Map background — ocean gradient (lit faintly upper-left) fills the frame.
      const oc = g.createLinearGradient(MX0, MY0, MX0+MW, MY0+MH);
      oc.addColorStop(0,'#0a1a30'); oc.addColorStop(0.5,'#071426'); oc.addColorStop(1,'#040d1c');
      g.fillStyle=oc; g.fillRect(MX0, MY0, MW, MH);
      g.strokeStyle=rgba(AM,0.28); g.lineWidth=1; g.strokeRect(MX0, MY0, MW, MH);

      // Lat/Lon grid (subtle, behind continents).
      g.lineWidth=0.5;
      [-60,-30,0,30,60].forEach(lat => {
        const p = proj(-180,lat);
        g.strokeStyle = lat===0 ? '#1c2c46' : '#101a30';
        g.beginPath(); g.moveTo(MX0,p.y); g.lineTo(MX0+MW,p.y); g.stroke();
      });
      g.strokeStyle='#101a30';
      [-120,-60,0,60,120].forEach(lon => {
        const p = proj(lon,84); g.beginPath(); g.moveTo(p.x,MY0); g.lineTo(p.x,MY0+MH); g.stroke();
      });

      // Recognizable continents (clipped to the map rect).
      g.save(); g.beginPath(); g.rect(MX0,MY0,MW,MH); g.clip();
      g.fillStyle='#15273f'; g.strokeStyle=rgba('#3a5478',0.7); g.lineWidth=1;
      land([[-168,66],[-150,71],[-120,72],[-95,73],[-80,68],[-60,60],[-52,47],[-66,44],[-72,41],[-76,34],[-81,25],[-90,29],[-97,21],[-105,23],[-115,31],[-124,40],[-126,48],[-140,58],[-155,60]]); // N. America
      land([[-50,60],[-42,68],[-28,72],[-20,70],[-24,62],[-40,59]]);                                              // Greenland
      land([[-80,9],[-66,11],[-50,0],[-44,-3],[-40,-22],[-50,-26],[-60,-38],[-70,-50],[-74,-52],[-72,-40],[-70,-30],[-77,-15],[-81,-4]]); // S. America
      land([[-16,15],[-10,28],[0,33],[11,37],[24,32],[33,31],[43,12],[51,11],[49,0],[40,-12],[33,-26],[24,-34],[18,-35],[11,-18],[8,4],[-8,5]]); // Africa
      land([[-9,44],[-2,49],[5,52],[10,56],[22,60],[30,59],[40,52],[30,46],[18,45],[10,40],[0,42]]);              // Europe
      land([[34,48],[45,56],[60,62],[85,70],[110,73],[140,72],[165,68],[178,66],[160,56],[142,52],[140,40],[122,30],[120,22],[105,18],[95,22],[82,8],[74,18],[60,26],[48,38],[38,42]]); // Asia
      land([[114,-22],[124,-16],[136,-12],[145,-16],[150,-25],[148,-38],[138,-37],[128,-32],[116,-34]]);          // Australia
      // Antarctica — wavy band across the bottom.
      g.beginPath();
      for (let lon=-180; lon<=180; lon+=20) { const p=proj(lon, -68 + 4*Math.sin(lon/30)); lon===-180?g.moveTo(p.x,p.y):g.lineTo(p.x,p.y); }
      g.lineTo(MX0+MW, MY0+MH); g.lineTo(MX0, MY0+MH); g.closePath(); g.fill(); g.stroke();
      g.restore();

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

      // Station dots (appear one by one).
      stations.forEach((s,i) => {
        const sA = ease(prog(T,0.8+i*0.4,0.5));
        if (sA <= 0) return;
        glow3(g,s.x,s.y,s.isAlma?GOLD:TEAL,16,sA*0.6);
        g.globalAlpha=sA; g.fillStyle = s.isAlma?GOLD:TEAL;
        g.beginPath(); g.arc(s.x,s.y,s.isAlma?7:4.5,0,Math.PI*2); g.fill();
        g.globalAlpha=1;
      });
      // Dodged labels — co-located sites (ALMA+APEX, SMA+JCMT) share ONE label, so
      // nothing overprints. Each label sits clear of its dot with a short leader.
      const SITES = [];
      stations.forEach((s,i) => {
        const G = SITES.find(g0 => Math.hypot(g0.x-s.x, g0.y-s.y) < 16);
        if (G) { G.names.push(s.name); G.appear = Math.max(G.appear, 0.8+i*0.4); }
        else SITES.push({ x:s.x, y:s.y, names:[s.name], isAlma:s.isAlma, appear:0.8+i*0.4 });
      });
      SITES.forEach(G => {
        const a = ease(prog(T, G.appear, 0.5));
        if (a<=0) return;
        const dy = (G.y < MY0+24) ? 16 : -13;     // dodge below only near the top edge
        g.globalAlpha=a;
        g.strokeStyle=rgba(G.isAlma?GOLD:TEAL,0.5); g.lineWidth=0.8;
        g.beginPath(); g.moveTo(G.x, G.y); g.lineTo(G.x, G.y+dy*0.55); g.stroke();
        g.fillStyle = G.isAlma ? GOLD : '#eef0f8';
        g.font = `${G.isAlma?'bold ':''}11px "Inter",sans-serif`;
        g.textAlign='center'; g.textBaseline = dy<0 ? 'bottom' : 'top';
        g.fillText(G.names.join('·'), G.x, G.y+dy);
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
        g.fillText(`SEFD: ${P.str.almaSefd}`, 22, alma.y+3);
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
        g.fillStyle=rgba(AM,0.85*uvA); g.font='italic 11px Georgia, serif';
        g.textAlign='right'; g.textBaseline='bottom'; g.fillText('u', ix+iw-6, ucy-4);
        g.textAlign='left'; g.fillText('v', ucx+5, iy+22);
        g.globalAlpha=1;
      }

      // Footer — all values computed from the EHT 2017 array (matches Act 1 & the tool).
      g.fillStyle=DIM; g.font=`${Math.round(13*scy)}px "Inter",sans-serif`;
      g.textAlign='center'; g.textBaseline='bottom';
      g.fillText(`8 telescopes · 6 sites · M87*  ·  B_max ${P.str.ehtBaseline}  ·  θ = λ/B = ${P.str.thetaEht}  ·  ${P.str.nBaselines}`, W*.5, H-7);

      drawConceptTag(g, W*.035, H*.05, 'Earth-Sized Aperture', ease(prog(T,0.5,1.0)));    };

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
    const P = TOUR_PHYSICS;
    // Deterministic dirty-beam structure: sidelobe rays + speckle (the noise the
    // sparse (u,v) sampling produces, which CLEAN must remove).
    const RAYS  = Array.from({length:18}, (_,i) => ({ ang: i*Math.PI/9 + (i%3)*0.18, len: 0.75 + ((i*37)%50)/100 }));
    const SPECK = Array.from({length:70}, (_,i) => { const a=i*2.39996, r=Math.sqrt(((i*53)%100)/100); return { x:Math.cos(a)*r, y:Math.sin(a)*r, b:((i*17)%100)/100 }; });

    const draw = T => {
      g.fillStyle = BG; g.fillRect(0,0,W,H);
      drawNebulae(g,W,H,'left',0.35); drawNebulae(g,W,H,'right',0.35);
      drawStars(g,stars,T,0.6);

      const RR = H*0.145;                                  // photon-ring radius (enlarged)
      // ── The DIRTY image: a sidelobe-riddled smear that dissolves as CLEAN runs ──
      const dirtyA = 1 - easeOut(prog(T,1.2,2.8));
      if (dirtyA > 0) {
        g.save();
        const Rd = RR*1.15;
        // smeared central source
        const bg = g.createRadialGradient(cx,cy,0,cx,cy,Rd*1.4);
        bg.addColorStop(0, rgba(GLOW,0.55*dirtyA)); bg.addColorStop(0.5, rgba(GLOW,0.16*dirtyA)); bg.addColorStop(1,'rgba(0,0,0,0)');
        g.fillStyle=bg; g.beginPath(); g.arc(cx,cy,Rd*1.4,0,Math.PI*2); g.fill();
        // sidelobe rays (the dirty beam's response)
        RAYS.forEach(ry => {
          const ex2 = cx+Math.cos(ry.ang)*Rd*2.3*ry.len, ey2 = cy+Math.sin(ry.ang)*Rd*2.3*ry.len;
          const grad = g.createLinearGradient(cx,cy,ex2,ey2);
          grad.addColorStop(0,'rgba(120,120,190,0)'); grad.addColorStop(0.35, rgba('#7a7ac8',0.5*dirtyA)); grad.addColorStop(1,'rgba(0,0,0,0)');
          g.strokeStyle=grad; g.lineWidth=2; g.beginPath(); g.moveTo(cx,cy); g.lineTo(ex2,ey2); g.stroke();
        });
        // concentric sidelobe rings
        [0.55,0.85,1.15,1.5].forEach((f,i) => { g.globalAlpha=dirtyA*0.4/(i*0.5+1); g.strokeStyle='#5a5a90'; g.lineWidth=2; g.beginPath(); g.arc(cx,cy,Rd*f,0,Math.PI*2); g.stroke(); });
        // speckle noise
        SPECK.forEach(s => { g.globalAlpha=dirtyA*s.b*0.55; g.fillStyle='#9090c8'; g.beginPath(); g.arc(cx+s.x*Rd*1.9, cy+s.y*Rd*1.9, 1.3,0,Math.PI*2); g.fill(); });
        g.restore(); g.globalAlpha=1;
        g.fillStyle=rgba(RED,0.8*dirtyA); g.font='italic 12px "Inter",sans-serif'; g.textAlign='left'; g.textBaseline='top';
        g.fillText('sidelobe artifacts', cx+RR*1.9, cy-RR*1.6); g.globalAlpha=1;
      }

      // ── The CLEAN image emerging: accretion glow → photon ring → shadow ──
      const reveal = easeOut(prog(T,2.0,2.8));
      if (reveal > 0) {
        [[RR*1.5,0.06,'255,110,0'],[RR*1.31,0.10,'255,145,0'],[RR*1.14,0.16,'255,182,30'],[RR*1.02,0.22,'255,208,40']].forEach(([r,op,col]) => {
          g.globalAlpha=reveal; g.strokeStyle=`rgba(${col},${op})`; g.lineWidth=r*.18;
          g.beginPath(); g.arc(cx,cy,r,0,Math.PI*2); g.stroke();
        });
        glow3(g,cx,cy,GOLD,RR*1.05,reveal);
        g.globalAlpha=reveal; g.strokeStyle=GOLD; g.lineWidth=5.5;
        g.beginPath(); g.arc(cx,cy,RR,0,Math.PI*2); g.stroke();
        g.fillStyle='#040408'; g.beginPath(); g.arc(cx,cy,RR*0.89,0,Math.PI*2); g.fill();
        g.fillStyle='#020204'; g.beginPath(); g.arc(cx,cy,RR*0.76,0,Math.PI*2); g.fill();
      }
      g.globalAlpha=1;

      // Title morphs Dirty → CLEAN; the restore-beam identity sits under the ring.
      g.font='bold 22px "Inter",sans-serif'; g.textAlign='center'; g.textBaseline='middle';
      if (dirtyA > 0) { g.globalAlpha=dirtyA; g.fillStyle=RED; g.fillText('Dirty Image',cx,cy-H*.40); }
      const cleanA = ease(prog(T,3.0,1.0));
      if (cleanA > 0) {
        g.globalAlpha=cleanA; g.fillStyle=TEAL; g.fillText('CLEAN Image',cx,cy-H*.40);
        g.font='15px "Courier New",monospace'; g.fillStyle=rgba(GOLD,0.95);
        g.fillText('I^C = (M ⊛ G) + r_final', cx, cy+RR+26);
      }
      g.globalAlpha=1;

      // Left panel: the dirty image is a convolution; CLEAN inverts it.
      drawDerivationPanel(g, W*.025, H*.30, W*.30, [
        { kind:'symbol', text:'I_D = I_sky ⊛ B_D' },
        { kind:'sub',    text:'① peak  → ② subtract γ·B_D' },
        { kind:'sub',    text:'③ restore with clean beam' },
        { kind:'result', text:'stop at 3σ (MAD noise)' },
      ], ease(prog(T,1.5,1.4)), { title:'CLEAN — Högbom 1974', reveal: ease(prog(T,1.5,1.8)) });

      // Right panel: what the recovered ring physically is.
      drawDerivationPanel(g, W*.675, H*.30, W*.30, [
        { kind:'symbol', text:`b_c = ${P.bcFormula}` },
        { kind:'sub',    text:`shadow ≈ ${P.shadowDiamFormula}` },
        { kind:'result', text:`≈ ${P.str.m87Shadow} for M87*` },
      ], ease(prog(T,3.0,1.4)), { title:'Photon ring (Schwarzschild)', reveal: ease(prog(T,3.0,1.6)) });

      drawConceptTag(g, W*.025, H*.075, 'Deconvolution', ease(prog(T,0.5,1.0)));    };

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
    const P = TOUR_PHYSICS;

    const draw = T => {
      g.fillStyle = BG; g.fillRect(0,0,W,H);
      if (!loaded) return;
      // Hero photo — large square (undistorted), left-anchored. The image owns the frame.
      const s = H*0.92, ix = W*0.035, iy = H*0.04, icx = ix+s/2, icy = iy+s/2;
      g.globalAlpha = reducedMotion ? 1 : ease(prog(T,0,3.5));
      g.drawImage(img, ix, iy, s, s);
      g.globalAlpha = 1;
      // Vignette centred on the ring.
      const vg = g.createRadialGradient(icx,icy,s*0.16, icx,icy,s*0.62);
      vg.addColorStop(0,'rgba(2,2,10,0)'); vg.addColorStop(1,'rgba(2,2,10,0.82)');
      g.fillStyle=vg; g.fillRect(ix-12, iy-12, s+24, s+24);

      // Scale bar on the image (bottom-left) — the angular size the ring subtends.
      const sbA = reducedMotion ? 1 : ease(prog(T,2.0,1.5));
      const sbx = ix+26, sby = iy+s-30, sbw = 120;
      g.save(); g.globalAlpha=sbA; g.lineCap='round';
      g.strokeStyle='#fff'; g.lineWidth=2.5;
      g.beginPath(); g.moveTo(sbx,sby); g.lineTo(sbx+sbw,sby); g.stroke();
      g.lineWidth=2; g.beginPath(); g.moveTo(sbx,sby-5); g.lineTo(sbx,sby+5); g.moveTo(sbx+sbw,sby-5); g.lineTo(sbx+sbw,sby+5); g.stroke();
      g.fillStyle='#fff'; g.font=`600 13px ${FONT}`; g.textAlign='center'; g.textBaseline='bottom';
      g.fillText(P.str.m87Shadow, sbx+sbw/2, sby-8);
      g.restore();

      // Quiet annotation column in the right margin — purposeful content, not a glass box.
      const cx = ix + s + W*0.045;
      const colA = reducedMotion ? 1 : ease(prog(T,1.4,1.6));
      g.save(); g.globalAlpha=colA; g.textAlign='left';
      drawConceptTag(g, cx, iy+12, 'First Light', colA);
      g.fillStyle=GOLD; g.font=`bold 23px ${FONT}`; g.textBaseline='top';
      g.fillText('M87*', cx, iy+30);
      g.fillStyle=rgba(AM,0.9); g.font=`13px ${FONT}`;
      g.fillText('April 10, 2019', cx, iy+64);
      const facts = [
        ['RING DIAMETER',    `${P.m87ShadowUas} ± 3 μas`],
        ['BLACK-HOLE MASS',  '≈ 6.5 × 10⁹ M☉'],
        ['OBSERVED',         '2017 April'],
        ['RELEASED',         '2019-04-10'],
      ];
      let fy = iy+108;
      facts.forEach(([k,v]) => {
        g.fillStyle=rgba(DIM,0.95); g.font=`11px ${FONT}`; g.textBaseline='top'; g.fillText(k, cx, fy);
        g.fillStyle=TXT; g.font=`600 15px ${MONO}`; g.fillText(v, cx, fy+15);
        fy += 48;
      });
      g.fillStyle=rgba(DIM,0.85); g.font=`11px ${FONT}`;
      g.fillText('EHT Collaboration 2019', cx, iy+s-32);
      g.fillText('ApJL 875, L1 · confirmed by GR', cx, iy+s-16);
      g.restore();
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
    const P = TOUR_PHYSICS;
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

      drawPlanet(g, ex, ey, er, { rot: T*0.18 });

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

      // Characteristic baseline — an orbital-radius simplification, pending sign-off.
      g.globalAlpha=ease(prog(T,2.5,1.0));
      g.fillStyle=AM; g.font=`15px ${MONO}`;
      g.textAlign='center'; g.textBaseline='bottom';
      g.fillText('B ~ R⊕ + h',(almaX+bx)/2,(almaY+by)/2-8);
      g.fillStyle=DIM; g.font=`11px ${FONT}`;
      g.fillText(`≈ ${P.str.bhexRadius} · pending sign-off`,(almaX+bx)/2,(almaY+by)/2+10);
      g.globalAlpha=1;

      // Resolution comparison panels
      const panA = ease(prog(T,0.5,1.5));
      g.globalAlpha=panA;
      // Left panel (EHT Ground)
      g.fillStyle=rgba(BG2,0.92); g.strokeStyle=BORDER; g.lineWidth=1;
      g.fillRect(12,22,W*.22,H*.24); g.strokeRect(12,22,W*.22,H*.24);
      const lpc=12+W*.11, lpcy=22+H*.12;
      // EHT-Ground: a FUZZY, thick ring — Earth-limited resolution can't sharpen it.
      g.save(); g.filter='blur(3.5px)'; g.globalAlpha=panA*0.85;
      g.strokeStyle=GOLD; g.lineWidth=H*.045;
      g.beginPath(); g.arc(lpc,lpcy,H*.058,0,Math.PI*2); g.stroke();
      g.filter='none'; g.restore();
      g.globalAlpha=panA; g.fillStyle='#050308'; g.beginPath(); g.arc(lpc,lpcy,H*.040,0,Math.PI*2); g.fill();
      g.fillStyle=TXT; g.font='bold 13px "Inter",sans-serif'; g.textAlign='center'; g.textBaseline='top';
      g.fillText('EHT Ground',lpc,26);
      g.fillStyle=TEAL; g.font='11px "Inter",sans-serif';
      g.fillText(`θ ≈ ${P.str.thetaEht}`,lpc,22+H*.20);
      // Right panel (BHEX) — accent border marks the highlighted comparison (app pattern)
      g.fillStyle=rgba(BG2,0.92); g.strokeStyle=AM; g.lineWidth=1;
      g.fillRect(W-W*.22-12,22,W*.22,H*.24); g.strokeRect(W-W*.22-12,22,W*.22,H*.24);
      const rpc=W-W*.11-12, rpcy=22+H*.12;
      // EHT+BHEX: a SHARP, thin ring with finer photon-ring substructure — the
      // longer space baseline resolves detail the ground array cannot.
      glow3(g,rpc,rpcy,GOLD,H*.075,panA*0.55);
      g.globalAlpha=panA; g.strokeStyle=GOLD; g.lineWidth=2.2;
      g.beginPath(); g.arc(rpc,rpcy,H*.062,0,Math.PI*2); g.stroke();
      g.strokeStyle=rgba('#fff0c0',0.9); g.lineWidth=1;
      g.beginPath(); g.arc(rpc,rpcy,H*.058,0,Math.PI*2); g.stroke();
      g.fillStyle='#ffe9a8';
      for (let a=0;a<6;a++){ const an=a*Math.PI/3 - 0.4; g.beginPath(); g.arc(rpc+Math.cos(an)*H*.062, rpcy+Math.sin(an)*H*.062, 1.4, 0, Math.PI*2); g.fill(); }
      g.fillStyle='#020204'; g.beginPath(); g.arc(rpc,rpcy,H*.050,0,Math.PI*2); g.fill();
      g.fillStyle=GLOW; g.font='bold 13px "Inter",sans-serif'; g.textAlign='center'; g.textBaseline='top';
      g.fillText('EHT + BHEX',rpc,26);
      g.fillStyle=TEAL; g.font='11px "Inter",sans-serif';
      g.fillText(`θ ~ ${P.str.bhexTheta} · pending`,rpc,22+H*.20);
      g.globalAlpha=1;

      // Integrity relation — slimmed to two lines + the pending tag (the LAW-1 card
      // exception). Never presented as a clean equality; every ⚠/pending marker kept.
      drawDerivationPanel(g, W*.05, H*.80, W*.66, [
        { kind:'symbol', text:'B_space ~ R⊕ + h   ·   θ ~ λ / B_space' },
        { kind:'note',   text:`⚠ orbital-radius simplification · ≈ ${P.str.bhexTheta} · pending sign-off (Marrone / Alejandro)` },
      ], panA, { reveal: panA });
      drawConceptTag(g, W*.05, H*.745, 'Space Baseline', panA);
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
    const P = TOUR_PHYSICS;
    const bmajDeg = (P.thetaEhtUas/3.6e9).toExponential(2).toUpperCase().replace(/E(-?)(\d)$/,'E$10$2');

    // `sharp` makes the ngEHT ring visibly crisper + higher-DR than the EHT-2017
    // one — the entire point of the comparison must be SEEN, not just printed.
    const drawRingMockup = (ccx, ccy, sharp) => {
      const R = H*0.135;
      // Faint extended emission fills the panel interior.
      const halo = g.createRadialGradient(ccx,ccy,R*0.6,ccx,ccy,R*2.0);
      halo.addColorStop(0, sharp ? 'rgba(255,185,50,0.12)' : 'rgba(255,160,40,0.06)');
      halo.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=halo; g.beginPath(); g.arc(ccx,ccy,R*2.0,0,Math.PI*2); g.fill();
      if (sharp) {
        glow3(g,ccx,ccy,GOLD,R*1.05,0.55);
        [[R*1.20,0.10],[R*1.06,0.17]].forEach(([r,op]) => { g.strokeStyle=`rgba(255,205,70,${op})`; g.lineWidth=r*.12; g.beginPath(); g.arc(ccx,ccy,r,0,Math.PI*2); g.stroke(); });
        g.strokeStyle=GOLD; g.lineWidth=3.4; g.beginPath(); g.arc(ccx,ccy,R,0,Math.PI*2); g.stroke();
        g.strokeStyle='rgba(255,242,205,0.92)'; g.lineWidth=1.2; g.beginPath(); g.arc(ccx,ccy,R*0.94,0,Math.PI*2); g.stroke();
        g.fillStyle='#fff0c8'; for (let a=0;a<8;a++){ const an=a*Math.PI/4+0.3; g.beginPath(); g.arc(ccx+Math.cos(an)*R, ccy+Math.sin(an)*R, 1.6,0,Math.PI*2); g.fill(); }
        g.fillStyle='#02040c'; g.beginPath(); g.arc(ccx,ccy,R*0.80,0,Math.PI*2); g.fill();
      } else {
        g.save(); g.filter='blur(5px)';
        [[R*1.28,0.10],[R*1.05,0.18]].forEach(([r,op]) => { g.strokeStyle=`rgba(255,170,45,${op})`; g.lineWidth=r*.30; g.beginPath(); g.arc(ccx,ccy,r,0,Math.PI*2); g.stroke(); });
        g.strokeStyle=rgba(GOLD,0.8); g.lineWidth=R*0.22; g.beginPath(); g.arc(ccx,ccy,R,0,Math.PI*2); g.stroke();
        g.filter='none'; g.restore();
        g.fillStyle='#04060f'; g.beginPath(); g.arc(ccx,ccy,R*0.60,0,Math.PI*2); g.fill();
      }
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
      g.fillText(`${P.str.nStations} · ${P.str.nBaselines}`, lPX+panW*.5, lPY-4+14);
      // Ring inside left panel
      g.fillStyle='#050818'; g.fillRect(lPX+20,lPY+60,panW-40,panH*.55);
      drawRingMockup(lPX+panW*.5, lPY+panH*.40, false);
      g.fillStyle=DIM; g.font='11px "Inter",sans-serif'; g.textAlign='center'; g.textBaseline='top';
      g.fillText(`θ ≈ ${P.str.thetaEht}  ·  DR ~50:1  ·  UV fill ~0.8%`, lPX+panW*.5, lPY+panH*.74);
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
      g.fillText(`${P.str.ngStations} · ${P.str.ngBaselines}`, rPX+panW*.5, rPY-4+14);
      g.fillStyle='#050818'; g.fillRect(rPX+20,rPY+60,panW-40,panH*.55);
      drawRingMockup(rPX+panW*.5, rPY+panH*.40, true);
      g.fillStyle=AM; g.font='11px "Inter",sans-serif'; g.textAlign='center'; g.textBaseline='top';
      g.fillText(`θ ≈ ${P.str.ngTheta}  ·  DR ~200:1  ·  UV fill ~3.5%`, rPX+panW*.5, rPY+panH*.74);
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
        g.fillStyle=TEAL; g.fillText(`CRVAL1 = ${P.m87RaDeg}`,fitsX+8,ft);
        g.fillStyle=AM;   g.fillText(`BMAJ   = ${bmajDeg}`,fitsX+8,ft+H*.025);
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
        row('Beam θ ≈',P.str.thetaEht,0); row('Dynamic Range','~50:1',1);
        row('UV Fill','~0.8%',2); row('Max baseline',P.str.ehtBaseline,3);
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

      drawConceptTag(g, W*.02, H*.02, 'The Simulator', ease(prog(T,0.2,1.0)));    };

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
