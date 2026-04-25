// TourDiagram.js — 12 SVG diagrams for the tour. No canvas, no requestAnimationFrame.
// CSS animations (waveSweep, earthRotate, cleanStep) defined in tour.css.
// All SVGs use viewBox="0 0 600 400". Colors are literal hex (CSS custom props unavailable in SVG attrs).
import { html } from './core.js';

const G   = '#C4A555';  // gold
const AM  = '#9E7E38';  // amber
const DIM = '#8888b0';  // dim text
const TX  = '#e8e8f0';  // primary text
const BG  = '#080810';  // dark bg
const OR  = '#ff9f43';  // orange
const PH  = '#FFD700';  // photon gold
const BL  = '#4488cc';  // blue
const GN  = '#44bb88';  // green

export function TourDiagram({ diagramId }) {
  switch (diagramId) {
    case 1:  return d01();
    case 2:  return d02();
    case 3:  return d03();
    case 4:  return d04();
    case 5:  return d05();
    case 6:  return d06();
    case 7:  return d07();
    case 8:  return d08();
    case 9:  return d09();
    case 10: return d10();
    case 11: return d11();
    case 12: return d12();
    default: return null;
  }
}

function d01() {
  return html`<svg viewBox="0 0 600 400" width="100%" height="100%">
    <rect width="600" height="400" fill=${BG} />
    <line x1="300" y1="20" x2="300" y2="385" stroke="#2d2200" strokeWidth="1" />

    <text x="145" y="32" textAnchor="middle" style=${{ fontSize: '13px', fontWeight: '700', fill: TX }}>Single Dish</text>
    <path d="M 68 270 Q 145 200 222 270" fill="none" stroke=${G} strokeWidth="3" />
    <line x1="145" y1="200" x2="145" y2="270" stroke=${G} strokeWidth="2" />
    <circle cx="145" cy="196" r="4" fill=${G} />
    <line x1="145" y1="196" x2="38" y2="68" stroke=${DIM} strokeWidth="1.5" strokeDasharray="5 3" />
    <line x1="145" y1="196" x2="252" y2="68" stroke=${DIM} strokeWidth="1.5" strokeDasharray="5 3" />
    <path d="M 93 128 A 62 62 0 0 1 197 128" fill="none" stroke=${DIM} strokeWidth="1" />
    <text x="145" y="152" textAnchor="middle" style=${{ fontSize: '11px', fill: DIM }}>θ ≈ 2.7 arcsec</text>
    <circle cx="145" cy="56" r="6" fill=${OR} />
    <text x="145" y="49" textAnchor="middle" style=${{ fontSize: '10px', fill: OR }}>M87*</text>
    <text x="145" y="305" textAnchor="middle" style=${{ fontSize: '12px', fill: TX }}>100 m dish</text>
    <text x="145" y="322" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>λ/D = 1.3 mm / 100 m</text>
    <text x="145" y="342" textAnchor="middle" style=${{ fontSize: '11px', fill: '#ff6b6b' }}>70,000× too blurry</text>

    <text x="455" y="32" textAnchor="middle" style=${{ fontSize: '13px', fontWeight: '700', fill: TX }}>VLBI Array</text>
    <circle cx="455" cy="198" r="85" fill="rgba(20,40,90,0.3)" stroke=${BL} strokeWidth="2" />
    <text x="455" y="202" textAnchor="middle" style=${{ fontSize: '11px', fill: BL }}>Earth</text>
    <circle cx="370" cy="198" r="6" fill=${G} />
    <circle cx="540" cy="198" r="6" fill=${G} />
    <line x1="376" y1="208" x2="534" y2="208" stroke=${G} strokeWidth="1.5" strokeDasharray="4 2" />
    <text x="455" y="224" textAnchor="middle" style=${{ fontSize: '10px', fill: G }}>B ≈ 12,742 km</text>
    <line x1="455" y1="113" x2="451" y2="58" stroke=${G} strokeWidth="1.5" />
    <line x1="455" y1="113" x2="459" y2="58" stroke=${G} strokeWidth="1.5" />
    <circle cx="455" cy="55" r="5" fill=${OR} />
    <text x="455" y="49" textAnchor="middle" style=${{ fontSize: '10px', fill: OR }}>M87*</text>
    <text x="455" y="82" textAnchor="middle" style=${{ fontSize: '11px', fill: G }}>θ ≈ 20 μas</text>
    <text x="455" y="305" textAnchor="middle" style=${{ fontSize: '12px', fill: TX }}>Earth-baseline array</text>
    <text x="455" y="322" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>λ/D⊕ = 1.3 mm / 12,742 km</text>
    <text x="455" y="342" textAnchor="middle" style=${{ fontSize: '11px', fill: GN }}>Resolves 42 μas shadow</text>
  </svg>`;
}

function d02() {
  return html`<svg viewBox="0 0 600 400" width="100%" height="100%">
    <rect width="600" height="400" fill=${BG} />
    <text x="300" y="30" textAnchor="middle" style=${{ fontSize: '12px', fill: DIM }}>Baseline: two telescopes, one Fourier component</text>

    <circle cx="300" cy="55" r="8" fill=${OR} />
    <text x="300" y="48" textAnchor="middle" style=${{ fontSize: '10px', fill: OR }}>Radio source</text>

    <line x1="100" y1="168" x2="500" y2="168" stroke="#1a1a38" strokeWidth="0.8" />
    <line x1="100" y1="182" x2="500" y2="182" stroke="#1a1a38" strokeWidth="0.8" />
    <line x1="100" y1="196" x2="500" y2="196" stroke="#1a1a38" strokeWidth="0.8" />
    <line className="wave-line" x1="100" y1="175" x2="500" y2="175" stroke=${PH} strokeWidth="2.5" strokeOpacity="0.85" />

    <path d="M 88 318 Q 148 272 208 318" fill="none" stroke=${G} strokeWidth="3" />
    <line x1="148" y1="272" x2="148" y2="318" stroke=${G} strokeWidth="2" />
    <circle cx="148" cy="268" r="5" fill=${G} />
    <text x="148" y="350" textAnchor="middle" style=${{ fontSize: '11px', fill: TX }}>Telescope 1</text>

    <path d="M 392 318 Q 452 272 512 318" fill="none" stroke=${G} strokeWidth="3" />
    <line x1="452" y1="272" x2="452" y2="318" stroke=${G} strokeWidth="2" />
    <circle cx="452" cy="268" r="5" fill=${G} />
    <text x="452" y="350" textAnchor="middle" style=${{ fontSize: '11px', fill: TX }}>Telescope 2</text>

    <line x1="153" y1="370" x2="447" y2="370" stroke=${DIM} strokeWidth="1.5" />
    <line x1="153" y1="365" x2="153" y2="375" stroke=${DIM} strokeWidth="1.5" />
    <line x1="447" y1="365" x2="447" y2="375" stroke=${DIM} strokeWidth="1.5" />
    <text x="300" y="388" textAnchor="middle" style=${{ fontSize: '11px', fill: G }}>Baseline B → u = B/λ</text>

    <line x1="148" y1="268" x2="300" y2="220" stroke=${OR} strokeWidth="1" strokeDasharray="3 2" />
    <text x="210" y="235" textAnchor="middle" style=${{ fontSize: '10px', fill: OR }}>delay τ</text>

    <rect x="480" y="55" width="105" height="85" fill="rgba(10,12,30,0.9)" stroke="#2d2200" strokeWidth="1" rx="3" />
    <text x="532" y="73" textAnchor="middle" style=${{ fontSize: '10px', fill: G }}>UV plane</text>
    <line x1="487" y1="97" x2="578" y2="97" stroke="#1a1a38" strokeWidth="0.5" />
    <line x1="532" y1="60" x2="532" y2="133" stroke="#1a1a38" strokeWidth="0.5" />
    <circle cx="555" cy="82" r="3" fill=${G} />
    <circle cx="509" cy="112" r="3" fill=${G} fillOpacity="0.45" />
    <text x="532" y="126" textAnchor="middle" style=${{ fontSize: '9px', fill: DIM }}>(u,v) + (−u,−v)</text>
  </svg>`;
}

function d03() {
  return html`<svg viewBox="0 0 600 400" width="100%" height="100%">
    <rect width="600" height="400" fill=${BG} />
    <text x="300" y="30" textAnchor="middle" style=${{ fontSize: '13px', fontWeight: '700', fill: TX }}>UV Plane — Fourier Space</text>

    <rect x="65" y="48" width="470" height="300" fill="rgba(8,10,25,0.9)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <line x1="65" y1="198" x2="535" y2="198" stroke="#222245" strokeWidth="1" />
    <line x1="300" y1="48" x2="300" y2="348" stroke="#222245" strokeWidth="1" />
    <text x="528" y="212" style=${{ fontSize: '11px', fill: DIM }}>u</text>
    <text x="306" y="62" style=${{ fontSize: '11px', fill: DIM }}>v</text>
    <text x="305" y="213" style=${{ fontSize: '10px', fill: DIM }}>0</text>

    <path d="M 120 108 Q 300 75 480 108" fill="none" stroke=${G} strokeWidth="2.5" />
    <path d="M 120 288 Q 300 321 480 288" fill="none" stroke=${G} strokeWidth="2.5" strokeOpacity="0.45" />
    <path d="M 148 85 Q 165 198 172 311" fill="none" stroke=${G} strokeWidth="2" strokeOpacity="0.65" />
    <path d="M 452 85 Q 435 198 428 311" fill="none" stroke=${G} strokeWidth="2" strokeOpacity="0.3" />
    <path d="M 198 122 Q 300 98 402 122" fill="none" stroke=${G} strokeWidth="1.8" strokeOpacity="0.75" />
    <path d="M 198 274 Q 300 298 402 274" fill="none" stroke=${G} strokeWidth="1.8" strokeOpacity="0.35" />
    <path d="M 108 155 Q 118 198 112 241" fill="none" stroke=${G} strokeWidth="1.2" strokeOpacity="0.5" />
    <path d="M 492 155 Q 482 198 488 241" fill="none" stroke=${G} strokeWidth="1.2" strokeOpacity="0.25" />
    <path d="M 235 138 Q 300 120 365 138" fill="none" stroke=${G} strokeWidth="1.5" strokeOpacity="0.55" />
    <path d="M 235 258 Q 300 276 365 258" fill="none" stroke=${G} strokeWidth="1.5" strokeOpacity="0.28" />

    <text x="300" y="372" textAnchor="middle" style=${{ fontSize: '11px', fill: DIM }}>V(u,v) = ∫∫ I(x,y) exp(−2πi(ux+vy)) dx dy</text>
    <text x="80" y="342" style=${{ fontSize: '10px', fill: G }}>V(u,v) = V*(−u,−v)  conjugate symmetry</text>
  </svg>`;
}

function d04() {
  return html`<svg viewBox="0 0 600 400" width="100%" height="100%">
    <rect width="600" height="400" fill=${BG} />
    <text x="165" y="30" textAnchor="middle" style=${{ fontSize: '12px', fontWeight: '700', fill: TX }}>Earth Rotation</text>
    <text x="460" y="30" textAnchor="middle" style=${{ fontSize: '12px', fontWeight: '700', fill: TX }}>UV Arc Synthesis</text>
    <line x1="305" y1="20" x2="305" y2="385" stroke="#2d2200" strokeWidth="1" />

    <circle cx="185" cy="210" r="100" fill="rgba(20,40,90,0.25)" stroke=${BL} strokeWidth="2" />
    <text x="185" y="214" textAnchor="middle" style=${{ fontSize: '11px', fill: BL }}>Earth</text>

    <g className="earth-group">
      <circle cx="185" cy="110" r="7" fill=${G} />
      <circle cx="185" cy="310" r="7" fill=${G} />
      <line x1="185" y1="117" x2="185" y2="303" stroke=${G} strokeWidth="1.5" strokeDasharray="4 3" />
    </g>

    <text x="185" y="362" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>12 h observation → full arc</text>

    <rect x="328" y="55" width="248" height="270" fill="rgba(8,10,25,0.9)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <line x1="328" y1="190" x2="576" y2="190" stroke="#222245" strokeWidth="0.8" />
    <line x1="452" y1="55" x2="452" y2="325" stroke="#222245" strokeWidth="0.8" />
    <text x="568" y="200" style=${{ fontSize: '10px', fill: DIM }}>u</text>
    <text x="457" y="68" style=${{ fontSize: '10px', fill: DIM }}>v</text>

    <path d="M 352 120 Q 452 82 552 120 Q 524 190 552 260 Q 452 298 352 260 Q 380 190 352 120" fill="none" stroke=${G} strokeWidth="2.5" />
    <path d="M 365 125 Q 452 92 539 125 Q 516 190 539 255 Q 452 288 365 255 Q 388 190 365 125" fill="none" stroke=${G} strokeWidth="1.5" strokeOpacity="0.4" />

    <text x="452" y="350" textAnchor="middle" style=${{ fontSize: '10px', fill: G }}>One baseline → one elliptical arc</text>
    <text x="452" y="366" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>28 baselines → 11,000+ UV samples</text>
  </svg>`;
}

function d05() {
  const sts = [
    { x: 202, y: 248, name: 'ALMA', gold: true  },
    { x:  78, y: 162, name: 'JCMT',  gold: false },
    { x: 160, y: 163, name: 'LMT',   gold: false },
    { x: 140, y: 134, name: 'SMT',   gold: false },
    { x: 294, y: 126, name: 'IRAM',  gold: false },
    { x: 218, y: 220, name: 'APEX',  gold: false },
    { x: 298, y: 375, name: 'SPT',   gold: false },
    { x: 420, y: 130, name: 'GLT',   gold: false },
  ];
  const pairs = [];
  for (let i = 0; i < sts.length; i++) {
    for (let j = i + 1; j < sts.length; j++) {
      pairs.push([sts[i], sts[j]]);
    }
  }
  return html`<svg viewBox="0 0 600 400" width="100%" height="100%">
    <rect width="600" height="400" fill=${BG} />
    <text x="300" y="28" textAnchor="middle" style=${{ fontSize: '13px', fontWeight: '700', fill: TX }}>EHT 2017 — 8 Stations, 28 Baselines</text>

    <ellipse cx="300" cy="212" rx="272" ry="168" fill="rgba(12,22,55,0.35)" stroke="#1a2a5a" strokeWidth="1.5" />
    <line x1="28" y1="212" x2="572" y2="212" stroke="#1a2a5a" strokeWidth="0.5" strokeDasharray="3 5" />

    ${pairs.map((p, i) => html`
      <line key=${i} x1=${p[0].x} y1=${p[0].y} x2=${p[1].x} y2=${p[1].y}
        stroke=${p[0].gold || p[1].gold ? G : BL}
        strokeWidth=${p[0].gold || p[1].gold ? 1.5 : 0.8}
        strokeOpacity=${p[0].gold || p[1].gold ? 0.55 : 0.2} />
    `)}

    ${sts.map(s => html`
      <circle key=${s.name} cx=${s.x} cy=${s.y} r="6" fill=${s.gold ? G : BL} stroke="#080810" strokeWidth="1.5" />
    `)}

    <text x="202" y="264" textAnchor="middle" style=${{ fontSize: '11px', fontWeight: '700', fill: G }}>ALMA</text>
    <text x="68"  y="154" textAnchor="middle" style=${{ fontSize: '9px', fill: TX }}>JCMT</text>
    <text x="150" y="155" textAnchor="middle" style=${{ fontSize: '9px', fill: TX }}>LMT</text>
    <text x="140" y="126" textAnchor="middle" style=${{ fontSize: '9px', fill: TX }}>SMT</text>
    <text x="294" y="118" textAnchor="middle" style=${{ fontSize: '9px', fill: TX }}>IRAM</text>
    <text x="298" y="368" textAnchor="middle" style=${{ fontSize: '9px', fill: TX }}>SPT</text>
    <text x="430" y="122" textAnchor="middle" style=${{ fontSize: '9px', fill: TX }}>GLT</text>

    <text x="300" y="390" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>Max baseline: ~10,900 km — Resolution: ~20 μas</text>
  </svg>`;
}

function d06() {
  const data = [
    { name: 'ALMA',  sefd:    70, color: G   },
    { name: 'LMT',   sefd:   560, color: GN  },
    { name: 'NOEMA', sefd:  1100, color: BL  },
    { name: 'IRAM',  sefd:  2000, color: BL  },
    { name: 'SMA',   sefd:  4900, color: DIM },
    { name: 'APEX',  sefd:  5200, color: DIM },
    { name: 'SMT',   sefd: 11900, color: '#555585' },
    { name: 'SPT',   sefd: 13200, color: '#555585' },
  ];
  const minL = Math.log10(70);
  const maxL = Math.log10(14000);
  const BAR_W = 370;
  return html`<svg viewBox="0 0 600 400" width="100%" height="100%">
    <rect width="600" height="400" fill=${BG} />
    <text x="300" y="28" textAnchor="middle" style=${{ fontSize: '13px', fontWeight: '700', fill: TX }}>Station Sensitivity (SEFD)</text>
    <text x="300" y="46" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>Lower SEFD = more sensitive — scales as √(SEFD_i × SEFD_j) per baseline</text>
    ${data.map((d, i) => {
      const y = 62 + i * 38;
      const frac = (Math.log10(d.sefd) - minL) / (maxL - minL);
      const w = Math.round(frac * BAR_W) + 20;
      return html`
        <g key=${d.name}>
          <text x="88" y=${y + 15} textAnchor="end" style=${{ fontSize: '11px', fill: TX }}>${d.name}</text>
          <rect x="94" y=${y} width=${w} height="26" fill=${d.color} fillOpacity="0.65" rx="3" />
          <text x=${94 + w + 7} y=${y + 16} style=${{ fontSize: '10px', fill: DIM }}>${d.sefd.toLocaleString()} Jy</text>
        </g>
      `;
    })}
    <text x="300" y="378" textAnchor="middle" style=${{ fontSize: '11px', fill: G }}>ALMA baseline: ~180× lower noise than SPT-JCMT</text>
  </svg>`;
}

function d07() {
  return html`<svg viewBox="0 0 600 400" width="100%" height="100%">
    <rect width="600" height="400" fill=${BG} />
    <text x="300" y="28" textAnchor="middle" style=${{ fontSize: '13px', fontWeight: '700', fill: TX }}>Dirty Image Formation</text>

    <rect x="18" y="55" width="148" height="148" fill="rgba(8,10,25,0.9)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <text x="92" y="218" textAnchor="middle" style=${{ fontSize: '11px', fill: DIM }}>UV Coverage</text>
    <line x1="18" y1="129" x2="166" y2="129" stroke="#1a1a38" strokeWidth="0.5" />
    <line x1="92" y1="55" x2="92" y2="203" stroke="#1a1a38" strokeWidth="0.5" />
    <path d="M 34  88 Q  92 70 150  88" fill="none" stroke=${G} strokeWidth="2" />
    <path d="M 34 170 Q  92 188 150 170" fill="none" stroke=${G} strokeWidth="2" strokeOpacity="0.45" />
    <path d="M 50  72 Q  60 129 55 186" fill="none" stroke=${G} strokeWidth="1.5" strokeOpacity="0.55" />
    <path d="M 134 72 Q 124 129 129 186" fill="none" stroke=${G} strokeWidth="1.5" strokeOpacity="0.28" />

    <text x="183" y="130" textAnchor="middle" style=${{ fontSize: '20px', fill: DIM }}>*</text>
    <text x="183" y="152" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>convolve</text>

    <rect x="200" y="55" width="148" height="148" fill="rgba(8,10,25,0.9)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <text x="274" y="218" textAnchor="middle" style=${{ fontSize: '11px', fill: DIM }}>Dirty Beam (PSF)</text>
    <circle cx="274" cy="129" r="42" fill="none" stroke=${G} strokeWidth="0.6" strokeOpacity="0.2" />
    <circle cx="274" cy="129" r="29" fill="none" stroke=${G} strokeWidth="0.8" strokeOpacity="0.3" />
    <circle cx="274" cy="129" r="18" fill="none" stroke=${G} strokeWidth="1.4" strokeOpacity="0.5" />
    <circle cx="274" cy="129" r="9"  fill="none" stroke=${G} strokeWidth="2" strokeOpacity="0.75" />
    <circle cx="274" cy="129" r="3"  fill=${G} />

    <text x="365" y="130" textAnchor="middle" style=${{ fontSize: '18px', fill: DIM }}>=</text>

    <rect x="382" y="55" width="200" height="148" fill="rgba(8,10,25,0.9)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <text x="482" y="218" textAnchor="middle" style=${{ fontSize: '11px', fill: DIM }}>Dirty Image I^D</text>
    <circle cx="482" cy="129" r="55" fill="none" stroke=${G} strokeWidth="0.5" strokeOpacity="0.12" />
    <circle cx="482" cy="129" r="38" fill="none" stroke=${G} strokeWidth="0.7" strokeOpacity="0.18" />
    <circle cx="482" cy="129" r="24" fill="none" stroke=${G} strokeWidth="1" strokeOpacity="0.35" />
    <circle cx="482" cy="129" r="13" fill="none" stroke=${G} strokeWidth="1.6" strokeOpacity="0.6" />
    <circle cx="482" cy="129" r="5"  fill=${G} fillOpacity="0.8" />

    <text x="300" y="252" textAnchor="middle" style=${{ fontSize: '13px', fill: TX }}>I^D = I_true * B</text>
    <text x="300" y="275" textAnchor="middle" style=${{ fontSize: '11px', fill: DIM }}>dirty = sky brightness convolved with dirty beam (PSF)</text>

    <rect x="220" y="295" width="160" height="30" fill="rgba(196,165,85,0.12)" stroke=${G} strokeWidth="1" rx="4" />
    <text x="300" y="315" textAnchor="middle" style=${{ fontSize: '11px', fill: G }}>CLEAN removes sidelobes</text>

    <text x="300" y="368" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>Sidelobes mimic real source structure — deconvolution is essential</text>
  </svg>`;
}

function d08() {
  return html`<svg viewBox="0 0 600 400" width="100%" height="100%">
    <rect width="600" height="400" fill=${BG} />
    <text x="300" y="28" textAnchor="middle" style=${{ fontSize: '13px', fontWeight: '700', fill: TX }}>CLEAN Algorithm (Hogbom 1974)</text>

    <g className="clean-step-1">
      <rect x="80" y="50" width="440" height="62" fill="rgba(196,165,85,0.1)" stroke=${G} strokeWidth="1.5" rx="6" />
      <text x="105" y="72" style=${{ fontSize: '13px', fontWeight: '700', fill: G }}>1. Find brightest peak</text>
      <text x="105" y="96" style=${{ fontSize: '11px', fill: DIM }}>Locate maximum in residual image: position x_max, value r_max</text>
    </g>

    <g className="clean-step-2">
      <rect x="80" y="128" width="440" height="62" fill="rgba(255,159,67,0.1)" stroke=${OR} strokeWidth="1.5" rx="6" />
      <text x="105" y="150" style=${{ fontSize: '13px', fontWeight: '700', fill: OR }}>2. Subtract dirty beam</text>
      <text x="105" y="174" style=${{ fontSize: '11px', fill: DIM }}>r ← r − γ · r_max · B(x − x_max)   loop gain γ ≈ 0.1</text>
    </g>

    <g className="clean-step-3">
      <rect x="80" y="206" width="440" height="62" fill="rgba(68,136,204,0.1)" stroke=${BL} strokeWidth="1.5" rx="6" />
      <text x="105" y="228" style=${{ fontSize: '13px', fontWeight: '700', fill: BL }}>3. Save clean component</text>
      <text x="105" y="252" style=${{ fontSize: '11px', fill: DIM }}>Add γ · r_max delta function to model at x_max</text>
    </g>

    <g className="clean-step-4">
      <rect x="80" y="284" width="440" height="62" fill="rgba(68,187,136,0.1)" stroke=${GN} strokeWidth="1.5" rx="6" />
      <text x="105" y="306" style=${{ fontSize: '13px', fontWeight: '700', fill: GN }}>4. Repeat then restore</text>
      <text x="105" y="330" style=${{ fontSize: '11px', fill: DIM }}>Iterate until |r| < 3σ_noise, then convolve model with clean beam</text>
    </g>

    <text x="300" y="375" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>Sidelobes removed · Resolution preserved · Used in every radio image since 1974</text>
  </svg>`;
}

function d09() {
  return html`<svg viewBox="0 0 600 400" width="100%" height="100%">
    <rect width="600" height="400" fill="#020208" />
    <text x="300" y="28" textAnchor="middle" style=${{ fontSize: '13px', fontWeight: '700', fill: TX }}>M87* Shadow and Photon Ring</text>

    <circle cx="300" cy="210" r="128" fill="none" stroke="rgba(255,120,0,0.1)" strokeWidth="22" />
    <circle cx="300" cy="210" r="110" fill="none" stroke="rgba(255,150,0,0.18)" strokeWidth="14" />
    <circle cx="300" cy="210" r="95"  fill="none" stroke="rgba(255,200,40,0.28)" strokeWidth="8" />

    <circle cx="300" cy="210" r="82" fill="none" stroke=${PH} strokeWidth="3.5" />
    <circle cx="300" cy="210" r="78" fill="none" stroke=${PH} strokeWidth="1" strokeOpacity="0.4" />

    <circle cx="300" cy="210" r="70" fill="#020208" />
    <circle cx="300" cy="210" r="58" fill="#010103" />

    <path d="M 192 95  C 250 118 285 162 280 210 C 275 258 252 295 278 348" fill="none" stroke="rgba(255,215,0,0.5)" strokeWidth="1.5" />
    <path d="M 408 80  C 352 130 312 162 318 210 C 324 258 348 298 302 362" fill="none" stroke="rgba(255,215,0,0.4)" strokeWidth="1.5" />
    <path d="M 145 240 C 188 228 232 218 258 214 C 284 210 308 202 340 196" fill="none" stroke="rgba(255,215,0,0.35)" strokeWidth="1.5" />

    <rect x="415" y="62" width="168" height="82" fill="rgba(2,2,10,0.85)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <text x="499" y="82" textAnchor="middle" style=${{ fontSize: '11px', fontWeight: '700', fill: TX }}>Scale</text>
    <circle cx="435" cy="114" r="14" fill="none" stroke=${PH} strokeWidth="2.5" />
    <text x="462" y="118" style=${{ fontSize: '10px', fill: TX }}>42 μas shadow</text>
    <circle cx="435" cy="95"  r="7"  fill="none" stroke=${G} strokeWidth="1.5" />
    <text x="456" y="99" style=${{ fontSize: '10px', fill: G }}>~20 μas beam</text>

    <text x="300" y="362" textAnchor="middle" style=${{ fontSize: '11px', fill: DIM }}>M87* · 6.5 billion M_sun · 55 million light-years</text>
    <text x="300" y="380" textAnchor="middle" style=${{ fontSize: '10px', fill: G }}>First imaged April 10, 2019 — EHT Collaboration</text>
  </svg>`;
}

function d10() {
  const leftArcs = [
    "M 50 112 Q 145 82 240 112 Q 220 172 240 232 Q 145 262 50 232 Q 70 172 50 112",
    "M 68 100 Q 145 76 222 100 Q 208 172 222 244 Q 145 268 68 244 Q 82 172 68 100",
    "M 88 128 Q 145 108 202 128",
    "M 88 216 Q 145 236 202 216",
    "M 44 148 Q 54 172 46 196",
    "M 246 148 Q 236 172 244 196",
  ];
  const rightArcs = [];
  for (let r = 0; r < 7; r++) {
    const shrink = r * 6;
    rightArcs.push(`M ${342 + shrink} ${110 + r * 2} Q 452 ${80 + r * 5} ${562 - shrink} ${110 + r * 2} Q ${545 - r * 4} 172 ${562 - shrink} ${234 - r * 2} Q 452 ${264 - r * 5} ${342 + shrink} ${234 - r * 2} Q ${359 + r * 4} 172 ${342 + shrink} ${110 + r * 2}`);
  }
  for (let a = 0; a < 5; a++) {
    rightArcs.push(`M ${375 + a * 18} ${102 + a * 4} Q ${390 + a * 14} 172 ${382 + a * 16} ${242 - a * 4}`);
    rightArcs.push(`M ${529 - a * 18} ${102 + a * 4} Q ${514 - a * 14} 172 ${522 - a * 16} ${242 - a * 4}`);
  }
  return html`<svg viewBox="0 0 600 400" width="100%" height="100%">
    <rect width="600" height="400" fill=${BG} />
    <text x="300" y="28" textAnchor="middle" style=${{ fontSize: '13px', fontWeight: '700', fill: TX }}>EHT 2017 vs ngEHT Phase 1</text>

    <rect x="18" y="48" width="260" height="264" fill="rgba(8,10,25,0.9)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <text x="148" y="68" textAnchor="middle" style=${{ fontSize: '12px', fontWeight: '700', fill: TX }}>EHT 2017</text>
    <text x="148" y="85" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>8 stations · 28 baselines</text>
    <line x1="18" y1="172" x2="278" y2="172" stroke="#1a1a38" strokeWidth="0.5" />
    <line x1="148" y1="48" x2="148" y2="312" stroke="#1a1a38" strokeWidth="0.5" />
    ${leftArcs.map((d, i) => html`<path key=${i} d=${d} fill="none" stroke=${G} strokeWidth=${i < 2 ? 2 : 1.5} strokeOpacity=${i < 2 ? 0.75 : 0.5} />`)}
    <text x="148" y="325" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>UV fill: ~0.8%</text>
    <text x="148" y="342" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>Dynamic range: ~50:1</text>

    <rect x="322" y="48" width="260" height="264" fill="rgba(8,10,25,0.9)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <text x="452" y="68" textAnchor="middle" style=${{ fontSize: '12px', fontWeight: '700', fill: G }}>ngEHT Phase 1</text>
    <text x="452" y="85" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>17 stations · 136 baselines</text>
    <line x1="322" y1="172" x2="582" y2="172" stroke="#1a1a38" strokeWidth="0.5" />
    <line x1="452" y1="48" x2="452" y2="312" stroke="#1a1a38" strokeWidth="0.5" />
    ${rightArcs.map((d, i) => html`<path key=${i} d=${d} fill="none" stroke=${G} strokeWidth="1" strokeOpacity=${Math.max(0.08, 0.55 - i * 0.03)} />`)}
    <text x="452" y="325" textAnchor="middle" style=${{ fontSize: '10px', fill: G }}>UV fill: ~3.5%</text>
    <text x="452" y="342" textAnchor="middle" style=${{ fontSize: '10px', fill: G }}>Dynamic range: ~200:1</text>

    <text x="300" y="382" textAnchor="middle" style=${{ fontSize: '11px', fill: G }}>4.4× more baselines — sharper images, higher dynamic range</text>
  </svg>`;
}

function d11() {
  return html`<svg viewBox="0 0 600 400" width="100%" height="100%">
    <rect width="600" height="400" fill="#020208" />
    <text x="300" y="28" textAnchor="middle" style=${{ fontSize: '13px', fontWeight: '700', fill: TX }}>BHEX Space VLBI</text>

    <circle cx="300" cy="205" r="52" fill="rgba(20,50,120,0.5)" stroke=${BL} strokeWidth="2" />
    <text x="300" y="209" textAnchor="middle" style=${{ fontSize: '11px', fill: BL }}>Earth</text>

    <circle cx="258" cy="180" r="5" fill=${G} />
    <text x="245" y="172" style=${{ fontSize: '9px', fill: G }}>ALMA</text>
    <circle cx="294" cy="156" r="4" fill=${BL} />
    <text x="284" y="148" style=${{ fontSize: '9px', fill: BL }}>IRAM</text>
    <circle cx="328" cy="172" r="4" fill=${BL} />
    <text x="334" y="164" style=${{ fontSize: '9px', fill: BL }}>JCMT</text>
    <circle cx="300" cy="255" r="4" fill=${BL} />
    <text x="288" y="270" style=${{ fontSize: '9px', fill: BL }}>SPT</text>

    <ellipse cx="300" cy="205" rx="225" ry="92" fill="none" stroke="#2a2a55" strokeWidth="1.5" strokeDasharray="6 3" transform="rotate(-22,300,205)" />

    <circle cx="506" cy="158" r="9" fill=${OR} stroke=${G} strokeWidth="2" />
    <text x="524" y="150" style=${{ fontSize: '10px', fill: OR }}>BHEX</text>
    <rect x="497" y="149" width="4" height="18" fill=${OR} fillOpacity="0.5" />
    <rect x="501" y="149" width="14" height="4" fill=${OR} fillOpacity="0.3" />

    <line x1="499" y1="164" x2="262" y2="181" stroke=${G} strokeWidth="1.5" strokeDasharray="5 3" strokeOpacity="0.7" />
    <line x1="499" y1="162" x2="332" y2="174" stroke=${BL} strokeWidth="1"   strokeDasharray="5 3" strokeOpacity="0.5" />
    <line x1="499" y1="164" x2="302" y2="251" stroke=${DIM} strokeWidth="1"  strokeDasharray="5 3" strokeOpacity="0.4" />

    <rect x="15" y="52" width="175" height="92" fill="rgba(2,2,12,0.85)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <text x="103" y="72" textAnchor="middle" style=${{ fontSize: '11px', fontWeight: '700', fill: TX }}>Angular Resolution</text>
    <text x="28"  y="92"  style=${{ fontSize: '11px', fill: DIM }}>EHT ground: ~20 μas</text>
    <text x="28"  y="114" style=${{ fontSize: '11px', fill: OR }}>BHEX space: ~6 μas</text>
    <text x="28"  y="133" style=${{ fontSize: '10px', fill: DIM }}>~3.5× improvement</text>

    <text x="300" y="358" textAnchor="middle" style=${{ fontSize: '11px', fill: DIM }}>Orbital baselines: up to ~35 Gigaλ</text>
    <text x="300" y="376" textAnchor="middle" style=${{ fontSize: '11px', fill: G }}>Resolves photon ring at sub-shadow scales</text>
  </svg>`;
}

function d12() {
  return html`<svg viewBox="0 0 600 400" width="100%" height="100%">
    <rect width="600" height="400" fill=${BG} />
    <text x="300" y="28" textAnchor="middle" style=${{ fontSize: '13px', fontWeight: '700', fill: TX }}>From Visibilities to Science</text>

    <rect x="12" y="46" width="270" height="158" fill="rgba(8,10,25,0.9)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <text x="147" y="66" textAnchor="middle" style=${{ fontSize: '11px', fill: G }}>UV Coverage</text>
    <line x1="12" y1="122" x2="282" y2="122" stroke="#1a1a38" strokeWidth="0.5" />
    <line x1="147" y1="46" x2="147" y2="204" stroke="#1a1a38" strokeWidth="0.5" />
    <path d="M 40 90 Q 147 68 254 90 Q 232 122 254 154 Q 147 176 40 154 Q 62 122 40 90" fill="none" stroke=${G} strokeWidth="2" />
    <path d="M 58 78 Q 147 62 236 78 Q 220 122 236 166 Q 147 182 58 166 Q 74 122 58 78"  fill="none" stroke=${G} strokeWidth="1.5" strokeOpacity="0.5" />
    <path d="M 80 94 Q 147 78 214 94" fill="none" stroke=${G} strokeWidth="1.2" strokeOpacity="0.6" />
    <path d="M 80 150 Q 147 166 214 150" fill="none" stroke=${G} strokeWidth="1.2" strokeOpacity="0.3" />

    <rect x="318" y="46" width="270" height="158" fill="rgba(8,10,25,0.9)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <text x="453" y="66" textAnchor="middle" style=${{ fontSize: '11px', fill: G }}>Image Metrics</text>
    <text x="330"  y="90"  style=${{ fontSize: '11px', fill: TX }}>Beam FWHM</text>
    <text x="580"  y="90"  textAnchor="end" style=${{ fontSize: '11px', fill: G }}>~20 μas</text>
    <text x="330"  y="112" style=${{ fontSize: '11px', fill: TX }}>Dynamic Range</text>
    <text x="580"  y="112" textAnchor="end" style=${{ fontSize: '11px', fill: G }}>~50:1</text>
    <text x="330"  y="134" style=${{ fontSize: '11px', fill: TX }}>UV Fill</text>
    <text x="580"  y="134" textAnchor="end" style=${{ fontSize: '11px', fill: G }}>0.8%</text>
    <text x="330"  y="156" style=${{ fontSize: '11px', fill: TX }}>Baselines</text>
    <text x="580"  y="156" textAnchor="end" style=${{ fontSize: '11px', fill: G }}>28</text>
    <text x="330"  y="178" style=${{ fontSize: '11px', fill: TX }}>Max baseline</text>
    <text x="580"  y="178" textAnchor="end" style=${{ fontSize: '11px', fill: G }}>10,900 km</text>

    <rect x="12" y="218" width="270" height="158" fill="rgba(8,10,25,0.9)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <text x="147" y="238" textAnchor="middle" style=${{ fontSize: '11px', fill: G }}>FITS Export (WCS)</text>
    <text x="24" y="260" style=${{ fontSize: '9px', fill: DIM, fontFamily: 'monospace' }}>SIMPLE  = T</text>
    <text x="24" y="276" style=${{ fontSize: '9px', fill: TX,  fontFamily: 'monospace' }}>CRVAL1  = 187.7059</text>
    <text x="24" y="292" style=${{ fontSize: '9px', fill: TX,  fontFamily: 'monospace' }}>CDELT1  = 1.94E-09</text>
    <text x="24" y="308" style=${{ fontSize: '9px', fill: TX,  fontFamily: 'monospace' }}>FREQ    = 2.30E+11</text>
    <text x="24" y="324" style=${{ fontSize: '9px', fill: G,   fontFamily: 'monospace' }}>BMAJ    = 5.56E-09</text>
    <text x="24" y="340" style=${{ fontSize: '9px', fill: DIM, fontFamily: 'monospace' }}>BUNIT   = 'JY/BEAM'</text>
    <text x="24" y="358" style=${{ fontSize: '10px', fill: DIM }}>Import in CASA, AIPS, Astropy</text>

    <rect x="318" y="218" width="270" height="158" fill="rgba(8,10,25,0.9)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <text x="453" y="238" textAnchor="middle" style=${{ fontSize: '11px', fill: G }}>Dynamic Range</text>
    <text x="330"  y="266" style=${{ fontSize: '10px', fill: DIM }}>EHT 2017</text>
    <rect x="330" y="270" width="98" height="20" fill=${G} fillOpacity="0.65" rx="3" />
    <text x="436" y="284" style=${{ fontSize: '10px', fill: G }}>~50:1</text>
    <text x="330"  y="308" style=${{ fontSize: '10px', fill: DIM }}>EHT 2022</text>
    <rect x="330" y="312" width="144" height="20" fill=${G} fillOpacity="0.65" rx="3" />
    <text x="482" y="326" style=${{ fontSize: '10px', fill: G }}>~100:1</text>
    <text x="330"  y="350" style=${{ fontSize: '10px', fill: DIM }}>ngEHT Ph1</text>
    <rect x="330" y="354" width="216" height="20" fill=${G} fillOpacity="0.85" rx="3" />
    <text x="554" y="368" style=${{ fontSize: '10px', fill: G }}>~200:1</text>
  </svg>`;
}
