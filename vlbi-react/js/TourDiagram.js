// TourDiagram.js — 12 SVG tour diagrams. viewBox="0 0 700 500" for all.
// CSS animations (waveSweep, earthRotate, cleanStep) defined in tour.css.
// htm safety: NEVER use bare < or > in SVG text content — use ${'<'} and ${'>'}
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
  return html`<svg viewBox="0 0 700 500" width="100%" height="100%">
    <rect width="700" height="500" fill=${BG} />
    <line x1="350" y1="30" x2="350" y2="480" stroke="#2d2200" strokeWidth="1" />

    <text x="175" y="45" textAnchor="middle" style=${{ fontSize: '13px', fontWeight: '700', fill: TX }}>Single Dish</text>
    <path d="M 88,310 Q 175,230 262,310" fill="none" stroke=${G} strokeWidth="3.5" />
    <line x1="175" y1="230" x2="175" y2="310" stroke=${G} strokeWidth="2" />
    <circle cx="175" cy="226" r="5" fill=${G} />
    <line x1="175" y1="226" x2="60" y2="60" stroke=${DIM} strokeWidth="1.5" strokeDasharray="5 3" />
    <line x1="175" y1="226" x2="290" y2="60" stroke=${DIM} strokeWidth="1.5" strokeDasharray="5 3" />
    <path d="M 108,155 A 76,76 0 0 1 242,155" fill="none" stroke=${DIM} strokeWidth="1" />
    <text x="175" y="178" textAnchor="middle" style=${{ fontSize: '11px', fill: DIM }}>θ ≈ 3.3 arcsec</text>
    <circle cx="175" cy="52" r="7" fill=${OR} />
    <text x="175" y="42" textAnchor="middle" style=${{ fontSize: '10px', fill: OR }}>M87*</text>
    <rect x="88" y="338" width="174" height="60" fill="rgba(196,165,85,0.06)" stroke=${G} strokeWidth="1" rx="4" />
    <text x="175" y="357" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>λ = 1.3 mm, D = 100 m</text>
    <text x="175" y="375" textAnchor="middle" style=${{ fontSize: '11px', fill: TX }}>θ_min = 1.22λ/D ≈ 3.3 arcsec</text>
    <text x="175" y="392" textAnchor="middle" style=${{ fontSize: '11px', fill: '#ff6b6b' }}>70,000× too blurry</text>

    <text x="525" y="45" textAnchor="middle" style=${{ fontSize: '13px', fontWeight: '700', fill: TX }}>VLBI Array</text>
    <circle cx="525" cy="270" r="105" fill="rgba(20,40,90,0.3)" stroke=${BL} strokeWidth="2" />
    <text x="525" y="274" textAnchor="middle" style=${{ fontSize: '11px', fill: BL }}>Earth</text>
    <circle cx="420" cy="270" r="7" fill=${G} stroke=${BG} strokeWidth="1.5" />
    <circle cx="618" cy="270" r="7" fill=${G} stroke=${BG} strokeWidth="1.5" />
    <line x1="427" y1="270" x2="611" y2="270" stroke=${G} strokeWidth="1.5" strokeDasharray="4 2" />
    <text x="519" y="292" textAnchor="middle" style=${{ fontSize: '10px', fill: G }}>B ≈ 12,742 km</text>
    <line x1="525" y1="165" x2="519" y2="52" stroke=${G} strokeWidth="1.5" />
    <line x1="525" y1="165" x2="531" y2="52" stroke=${G} strokeWidth="1.5" />
    <path d="M 509,130 A 20,20 0 0 1 541,130" fill="none" stroke=${G} strokeWidth="1" />
    <text x="525" y="118" textAnchor="middle" style=${{ fontSize: '11px', fill: G }}>θ ≈ 20 μas</text>
    <circle cx="525" cy="52" r="7" fill=${OR} />
    <text x="525" y="42" textAnchor="middle" style=${{ fontSize: '10px', fill: OR }}>M87*</text>
    <rect x="438" y="338" width="174" height="60" fill="rgba(68,187,136,0.06)" stroke=${GN} strokeWidth="1" rx="4" />
    <text x="525" y="357" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>λ = 1.3 mm, D = 12,742 km</text>
    <text x="525" y="375" textAnchor="middle" style=${{ fontSize: '11px', fill: TX }}>θ_synth ≈ 20 μas</text>
    <text x="525" y="392" textAnchor="middle" style=${{ fontSize: '11px', fill: GN }}>Resolves 42 μas shadow</text>

    <text x="350" y="470" textAnchor="middle" style=${{ fontSize: '11px', fill: DIM }}>Rayleigh criterion: θ_min = 1.22 λ/D</text>
  </svg>`;
}

function d02() {
  return html`<svg viewBox="0 0 700 500" width="100%" height="100%">
    <rect width="700" height="500" fill=${BG} />
    <text x="350" y="35" textAnchor="middle" style=${{ fontSize: '13px', fontWeight: '700', fill: TX }}>Two Telescopes — One Visibility</text>

    <circle cx="350" cy="65" r="10" fill=${OR} />
    <text x="350" y="55" textAnchor="middle" style=${{ fontSize: '10px', fill: OR }}>Radio source</text>

    <line x1="80" y1="148" x2="620" y2="148" stroke="#1a1a38" strokeWidth="0.8" />
    <line x1="80" y1="162" x2="620" y2="162" stroke="#1a1a38" strokeWidth="0.8" />
    <line x1="80" y1="176" x2="620" y2="176" stroke="#1a1a38" strokeWidth="0.8" />
    <line className="wave-line" x1="80" y1="155" x2="620" y2="155" stroke=${PH} strokeWidth="2.5" strokeOpacity="0.85" />

    <path d="M 98,288 Q 168,230 238,288" fill="none" stroke=${G} strokeWidth="3.5" />
    <line x1="168" y1="230" x2="168" y2="288" stroke=${G} strokeWidth="2" />
    <circle cx="168" cy="226" r="6" fill=${G} />
    <text x="168" y="318" textAnchor="middle" style=${{ fontSize: '11px', fill: TX }}>Telescope 1</text>
    <text x="168" y="334" textAnchor="middle" style=${{ fontSize: '9px', fill: DIM }}>(ALMA, Chile)</text>

    <path d="M 462,288 Q 532,230 602,288" fill="none" stroke=${G} strokeWidth="3.5" />
    <line x1="532" y1="230" x2="532" y2="288" stroke=${G} strokeWidth="2" />
    <circle cx="532" cy="226" r="6" fill=${G} />
    <text x="532" y="318" textAnchor="middle" style=${{ fontSize: '11px', fill: TX }}>Telescope 2</text>
    <text x="532" y="334" textAnchor="middle" style=${{ fontSize: '9px', fill: DIM }}>(JCMT, Hawaii)</text>

    <line x1="168" y1="75" x2="168" y2="222" stroke=${OR} strokeWidth="1" strokeDasharray="3 2" />
    <line x1="532" y1="75" x2="532" y2="222" stroke=${OR} strokeWidth="1" strokeDasharray="3 2" />
    <text x="350" y="172" textAnchor="middle" style=${{ fontSize: '11px', fill: OR }}>τ_g = B·ŝ/c</text>
    <line x1="350" y1="179" x2="350" y2="196" stroke=${OR} strokeWidth="1.5" />

    <line x1="174" y1="378" x2="526" y2="378" stroke=${DIM} strokeWidth="1.5" />
    <line x1="174" y1="373" x2="174" y2="383" stroke=${DIM} strokeWidth="1.5" />
    <line x1="526" y1="373" x2="526" y2="383" stroke=${DIM} strokeWidth="1.5" />
    <text x="350" y="396" textAnchor="middle" style=${{ fontSize: '11px', fill: G }}>Baseline B → spatial frequency u = B/λ</text>

    <rect x="556" y="48" width="128" height="108" fill="rgba(8,10,30,0.92)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <text x="620" y="67" textAnchor="middle" style=${{ fontSize: '10px', fill: G }}>UV plane</text>
    <line x1="560" y1="99" x2="680" y2="99" stroke="#1a1a38" strokeWidth="0.5" />
    <line x1="620" y1="54" x2="620" y2="150" stroke="#1a1a38" strokeWidth="0.5" />
    <circle cx="642" cy="78" r="4" fill=${G} />
    <circle cx="598" cy="120" r="4" fill=${G} fillOpacity="0.4" />
    <text x="648" y="82" style=${{ fontSize: '8px', fill: TX }}>(u,v)</text>
    <text x="562" y="130" style=${{ fontSize: '8px', fill: DIM }}>(-u,-v)</text>

    <rect x="18" y="415" width="220" height="54" fill="rgba(8,10,25,0.9)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <text x="128" y="437" textAnchor="middle" style=${{ fontSize: '11px', fill: G }}>V₁₂ = ⟨E₁(t) · E₂*(t+τ)⟩</text>
    <text x="128" y="455" textAnchor="middle" style=${{ fontSize: '9px', fill: DIM }}>Visibility = one Fourier component</text>
  </svg>`;
}

function d03() {
  return html`<svg viewBox="0 0 700 500" width="100%" height="100%">
    <rect width="700" height="500" fill=${BG} />
    <text x="350" y="35" textAnchor="middle" style=${{ fontSize: '13px', fontWeight: '700', fill: TX }}>UV Plane — Fourier Space</text>

    <rect x="60" y="52" width="580" height="380" fill="rgba(8,10,25,0.9)" stroke="#2d2200" strokeWidth="1" rx="6" />

    <circle cx="350" cy="242" r="60"  fill="none" stroke="#1a1a48" strokeWidth="0.4" />
    <circle cx="350" cy="242" r="120" fill="none" stroke="#1a1a48" strokeWidth="0.4" />
    <circle cx="350" cy="242" r="180" fill="none" stroke="#1a1a48" strokeWidth="0.4" />
    <circle cx="350" cy="242" r="240" fill="none" stroke="#1a1a48" strokeWidth="0.4" />
    <circle cx="350" cy="242" r="282" fill="none" stroke="#1a1a48" strokeWidth="0.3" />

    <line x1="65" y1="242" x2="635" y2="242" stroke="#222245" strokeWidth="1" />
    <line x1="350" y1="57" x2="350" y2="427" stroke="#222245" strokeWidth="1" />
    <text x="624" y="258" style=${{ fontSize: '11px', fill: TX }}>u (Gλ)</text>
    <text x="358" y="70" style=${{ fontSize: '11px', fill: TX }}>v (Gλ)</text>
    <text x="355" y="258" style=${{ fontSize: '10px', fill: DIM }}>0</text>
    <text x="112" y="258" style=${{ fontSize: '9px', fill: DIM }}>-8</text>
    <text x="232" y="258" style=${{ fontSize: '9px', fill: DIM }}>-4</text>
    <text x="466" y="258" style=${{ fontSize: '9px', fill: DIM }}>+4</text>
    <text x="586" y="258" style=${{ fontSize: '9px', fill: DIM }}>+8</text>

    <path d="M 120,242 A 230,148 0 0 0 580,242" fill="none" stroke=${G} strokeWidth="2.5" strokeOpacity="0.9" />
    <path d="M 120,242 A 230,148 0 0 1 580,242" fill="none" stroke=${G} strokeWidth="2.5" strokeOpacity="0.4" />

    <g transform="rotate(28, 350, 242)">
      <path d="M 155,242 A 195,125 0 0 0 545,242" fill="none" stroke=${G} strokeWidth="2.0" strokeOpacity="0.7" />
      <path d="M 155,242 A 195,125 0 0 1 545,242" fill="none" stroke=${G} strokeWidth="1.5" strokeOpacity="0.28" />
    </g>

    <g transform="rotate(-22, 350, 242)">
      <path d="M 182,242 A 168,108 0 0 0 518,242" fill="none" stroke=${G} strokeWidth="1.8" strokeOpacity="0.65" />
      <path d="M 182,242 A 168,108 0 0 1 518,242" fill="none" stroke=${G} strokeWidth="1.4" strokeOpacity="0.25" />
    </g>

    <g transform="rotate(52, 350, 242)">
      <path d="M 220,242 A 130,83 0 0 0 480,242" fill="none" stroke=${G} strokeWidth="1.5" strokeOpacity="0.55" />
      <path d="M 220,242 A 130,83 0 0 1 480,242" fill="none" stroke=${G} strokeWidth="1.2" strokeOpacity="0.22" />
    </g>

    <g transform="rotate(75, 350, 242)">
      <path d="M 262,242 A 88,56 0 0 0 438,242" fill="none" stroke=${G} strokeWidth="1.2" strokeOpacity="0.45" />
      <path d="M 262,242 A 88,56 0 0 1 438,242" fill="none" stroke=${G} strokeWidth="1.0" strokeOpacity="0.18" />
    </g>

    <rect x="158" y="408" width="384" height="24" fill="rgba(0,0,0,0.5)" rx="3" />
    <text x="350" y="424" textAnchor="middle" style=${{ fontSize: '11px', fill: G }}>V(u,v) = ∫∫ I(l,m) · exp(-2πi(ul+vm)) dl dm</text>

    <text x="68" y="446" style=${{ fontSize: '10px', fill: DIM }}>V(-u,-v) = V*(u,v)  →  double coverage for real sky</text>
    <text x="350" y="468" textAnchor="middle" style=${{ fontSize: '9px', fill: DIM }}>van Cittert-Zernike · TMS eq. 1.4</text>
  </svg>`;
}

function d04() {
  return html`<svg viewBox="0 0 700 500" width="100%" height="100%">
    <rect width="700" height="500" fill=${BG} />
    <line x1="355" y1="20" x2="355" y2="485" stroke="#2d2200" strokeWidth="1" />

    <text x="177" y="35" textAnchor="middle" style=${{ fontSize: '12px', fontWeight: '700', fill: TX }}>Earth Rotation</text>
    <circle cx="177" cy="255" r="112" fill="rgba(20,40,90,0.25)" stroke=${BL} strokeWidth="2.5" />
    <text x="177" y="259" textAnchor="middle" style=${{ fontSize: '11px', fill: BL }}>Earth</text>
    <line x1="65" y1="255" x2="289" y2="255" stroke=${BL} strokeWidth="0.5" strokeOpacity="0.4" />

    <g className="earth-group" style=${{ transformOrigin: '177px 255px' }}>
      <circle cx="177" cy="143" r="8" fill=${G} />
      <circle cx="177" cy="367" r="8" fill=${G} />
      <line x1="177" y1="151" x2="177" y2="359" stroke=${G} strokeWidth="1.5" strokeDasharray="4 3" />
    </g>

    <text x="177" y="406" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>H = -6h → +6h</text>
    <text x="177" y="422" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>12 h baseline sweep</text>

    <text x="528" y="35" textAnchor="middle" style=${{ fontSize: '12px', fontWeight: '700', fill: TX }}>UV Arc Synthesis</text>
    <rect x="368" y="52" width="314" height="330" fill="rgba(8,10,25,0.9)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <line x1="372" y1="217" x2="678" y2="217" stroke="#222245" strokeWidth="0.8" />
    <line x1="525" y1="56" x2="525" y2="378" stroke="#222245" strokeWidth="0.8" />
    <text x="668" y="229" style=${{ fontSize: '10px', fill: DIM }}>u</text>
    <text x="530" y="68" style=${{ fontSize: '10px', fill: DIM }}>v</text>

    <path d="M 380,142 Q 525,96 670,142 Q 646,217 670,292 Q 525,338 380,292 Q 404,217 380,142" fill="none" stroke=${G} strokeWidth="2.5" />
    <path d="M 392,148 Q 525,108 658,148 Q 636,217 658,286 Q 525,326 392,286 Q 414,217 392,148" fill="none" stroke=${G} strokeWidth="1.5" strokeOpacity="0.35" />

    <text x="525" y="362" textAnchor="middle" style=${{ fontSize: '11px', fill: G }}>One baseline</text>
    <text x="525" y="378" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>→ one elliptical arc</text>

    <rect x="368" y="397" width="314" height="72" fill="rgba(8,10,25,0.85)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <text x="378" y="416" style=${{ fontSize: '10px', fill: G }}>u = (Bx·sinH + By·cosH) / λ</text>
    <text x="378" y="434" style=${{ fontSize: '9.5px', fill: G }}>v = (-Bx·sinδ·cosH + By·sinδ·sinH + Bz·cosδ) / λ</text>
    <text x="378" y="453" style=${{ fontSize: '9px', fill: DIM }}>TMS equation 4.1</text>

    <text x="350" y="482" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>28 baselines × 12 hours → 11,000+ UV samples per night</text>
  </svg>`;
}

function d05() {
  // Equirectangular projection: lat [-70,80], lon [-180,180]
  // x = 25 + (lon+180)/360*650,  y = 45 + (80-lat)/150*390
  const sts = [
    { x: 229, y: 332, name: 'ALMA',     gold: true  },
    { x:  70, y: 213, name: 'SMA/JCMT', gold: false },
    { x: 175, y: 215, name: 'LMT',      gold: false },
    { x: 344, y: 165, name: 'IRAM',     gold: false },
    { x: 361, y: 143, name: 'NOEMA',    gold: false },
    { x: 152, y: 177, name: 'SMT',      gold: false },
    { x: 227, y:  55, name: 'GLT',      gold: false },
    { x: 270, y: 435, name: 'SPT',      gold: false, pole: true },
  ];
  const almaX = 229, almaY = 332;
  const pairs = [];
  for (let i = 0; i < sts.length; i++) {
    for (let j = i + 1; j < sts.length; j++) {
      pairs.push([sts[i], sts[j]]);
    }
  }
  // Vertical grid lines (longitude every 30°)
  const vLons = [-180,-150,-120,-90,-60,-30,0,30,60,90,120,150,180];
  const vXs   = vLons.map(l => Math.round(25 + (l+180)/360*650));
  // Horizontal grid lines (latitude every 30° within [-60,80])
  const hLats = [60, 30, 0, -30, -60];
  const hYs   = hLats.map(l => Math.round(45 + (80-l)/150*390));

  return html`<svg viewBox="0 0 700 500" width="100%" height="100%">
    <rect width="700" height="500" fill=${BG} />
    <text x="350" y="25" textAnchor="middle" style=${{ fontSize: '13px', fontWeight: '700', fill: TX }}>EHT 2017 Array</text>

    <rect x="25" y="45" width="650" height="390" fill="rgba(8,10,25,0.6)" stroke="#2d2200" strokeWidth="1" />

    ${vXs.map((x, i) => html`<line key=${'v'+i} x1=${x} y1="45" x2=${x} y2="435" stroke="#1a1a48" strokeWidth="0.6" strokeOpacity=${vLons[i] === 0 ? 0.9 : 0.6} />`)}
    ${hYs.map((y, i) => html`<line key=${'h'+i} x1="25" y1=${y} x2="675" y2=${y} stroke="#1a1a48" strokeWidth="0.6" strokeOpacity=${hLats[i] === 0 ? 0.9 : 0.6} />`)}

    <text x="354" y="262" style=${{ fontSize: '8px', fill: '#2a2a68' }}>0°</text>
    <text x="350" y="275" textAnchor="middle" style=${{ fontSize: '8px', fill: '#2a2a68' }}>equator</text>

    ${pairs.map((p, i) => {
      const isAlma = p[0].name === 'ALMA' || p[1].name === 'ALMA';
      return html`<line key=${i} x1=${p[0].x} y1=${p[0].y} x2=${p[1].x} y2=${p[1].y}
        stroke=${isAlma ? G : BL}
        strokeWidth=${isAlma ? 1.1 : 0.6}
        strokeOpacity=${isAlma ? 0.45 : 0.12} />`;
    })}

    ${sts.map(s => html`<circle key=${s.name} cx=${s.x} cy=${s.y} r=${s.gold ? 7 : 5}
      fill=${s.gold ? G : BL} stroke=${BG} strokeWidth="1.2"
      fillOpacity=${s.pole ? 0.7 : 1} />`)}

    <text x="239" y="328" style=${{ fontSize: '10px', fill: G }}>ALMA</text>
    <text x="40"  y="225" style=${{ fontSize: '9px',  fill: TX }}>SMA/JCMT</text>
    <text x="180" y="208" style=${{ fontSize: '9px',  fill: TX }}>LMT</text>
    <text x="307" y="162" style=${{ fontSize: '9px',  fill: TX }}>IRAM</text>
    <text x="367" y="140" style=${{ fontSize: '9px',  fill: TX }}>NOEMA</text>
    <text x="158" y="170" style=${{ fontSize: '9px',  fill: TX }}>SMT</text>
    <text x="233" y="68"  style=${{ fontSize: '9px',  fill: TX }}>GLT</text>
    <text x="250" y="448" style=${{ fontSize: '9px',  fill: DIM }}>SPT ↓</text>

    <rect x="25" y="445" width="650" height="24" fill="rgba(0,0,0,0.5)" rx="3" />
    <text x="350" y="461" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>Max baseline: ~10,900 km · Resolution: ~20 μas · N(N-1)/2 = 28 baselines · ALMA baselines in gold</text>
  </svg>`;
}

function d06() {
  const minLog = Math.log10(94);
  const maxLog = Math.log10(14000);
  const data = [
    { name: 'ALMA',  sefd: 94,    color: G,         isBhex: false },
    { name: 'LMT',   sefd: 560,   color: GN,        isBhex: false },
    { name: 'NOEMA', sefd: 700,   color: BL,        isBhex: false },
    { name: 'IRAM',  sefd: 1900,  color: BL,        isBhex: false },
    { name: 'SMA',   sefd: 4900,  color: DIM,       isBhex: false },
    { name: 'APEX',  sefd: 5200,  color: DIM,       isBhex: false },
    { name: 'BHEX',  sefd: 10000, color: OR,        isBhex: true  },
    { name: 'SMT',   sefd: 11900, color: '#555585', isBhex: false },
    { name: 'SPT',   sefd: 13200, color: '#555585', isBhex: false },
  ];
  return html`<svg viewBox="0 0 700 500" width="100%" height="100%">
    <rect width="700" height="500" fill=${BG} />
    <text x="350" y="35" textAnchor="middle" style=${{ fontSize: '13px', fontWeight: '700', fill: TX }}>Station Sensitivity at 230 GHz</text>

    ${data.map((d, i) => {
      const rowY = 52 + i * 44;
      const frac = (Math.log10(d.sefd) - minLog) / (maxLog - minLog);
      const w = Math.round(frac * 480) + 20;
      const label = d.isBhex ? '★ BHEX' : d.name;
      return html`<g key=${d.name}>
        <text x="114" y=${rowY + 21} textAnchor="end" style=${{ fontSize: '11px', fill: d.isBhex ? OR : TX }}>${label}</text>
        <rect x="120" y=${rowY} width=${w} height="30" fill=${d.color} fillOpacity="0.7" rx="3" />
        <text x=${120 + w + 7} y=${rowY + 20} style=${{ fontSize: '10px', fill: DIM }}>${d.sefd.toLocaleString()} Jy</text>
      </g>`;
    })}

    <text x="120" y="460" style=${{ fontSize: '9px', fill: DIM }}>100</text>
    <text x="232" y="460" style=${{ fontSize: '9px', fill: DIM }}>1,000</text>
    <text x="490" y="460" style=${{ fontSize: '9px', fill: DIM }}>10,000</text>

    <rect x="50" y="464" width="600" height="28" fill="rgba(8,10,25,0.9)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <text x="350" y="480" textAnchor="middle" style=${{ fontSize: '10px', fill: G }}>σᵢⱼ = √(SEFDᵢ · SEFDⱼ) / √(2 · Δν · Δt)</text>
  </svg>`;
}

function d07() {
  return html`<svg viewBox="0 0 700 500" width="100%" height="100%">
    <rect width="700" height="500" fill=${BG} />
    <text x="350" y="35" textAnchor="middle" style=${{ fontSize: '13px', fontWeight: '700', fill: TX }}>Dirty Image Formation</text>

    <rect x="55" y="62" width="170" height="200" fill="rgba(8,10,25,0.92)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <line x1="55" y1="162" x2="225" y2="162" stroke="#1a1a38" strokeWidth="0.5" />
    <line x1="140" y1="62" x2="140" y2="262" stroke="#1a1a38" strokeWidth="0.5" />
    <path d="M 75,112 Q 140,90 205,112 Q 192,162 205,212 Q 140,234 75,212 Q 88,162 75,112" fill="none" stroke=${G} strokeWidth="2" />
    <path d="M 88,100 Q 140,82 192,100 Q 180,162 192,224 Q 140,242 88,224 Q 100,162 88,100" fill="none" stroke=${G} strokeWidth="1.5" strokeOpacity="0.5" />
    <path d="M 98,124 Q 140,110 182,124" fill="none" stroke=${G} strokeWidth="1.2" strokeOpacity="0.6" />
    <path d="M 98,200 Q 140,214 182,200" fill="none" stroke=${G} strokeWidth="1.2" strokeOpacity="0.3" />

    <text x="235" y="158" textAnchor="middle" style=${{ fontSize: '26px', fill: DIM }}>⊛</text>
    <text x="235" y="178" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>convolve</text>

    <rect x="265" y="62" width="170" height="200" fill="rgba(8,10,25,0.92)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <circle cx="350" cy="162" r="3" fill=${G} />
    <circle cx="350" cy="162" r="10" fill="none" stroke=${G} strokeWidth="2" strokeOpacity="0.9" />
    <circle cx="350" cy="162" r="18" fill="none" stroke=${G} strokeWidth="1.5" strokeOpacity="0.6" />
    <circle cx="350" cy="162" r="28" fill="none" stroke=${G} strokeWidth="1" strokeOpacity="0.35" />
    <circle cx="350" cy="162" r="42" fill="none" stroke=${G} strokeWidth="1" strokeOpacity="0.2" />
    <circle cx="350" cy="162" r="58" fill="none" stroke=${DIM} strokeWidth="0.8" strokeOpacity="0.15" />
    <circle cx="350" cy="162" r="75" fill="none" stroke=${DIM} strokeWidth="0.6" strokeOpacity="0.1" />
    <text x="390" y="215" style=${{ fontSize: '8px', fill: DIM }}>sidelobes</text>

    <text x="447" y="158" textAnchor="middle" style=${{ fontSize: '24px', fill: DIM }}>=</text>

    <rect x="475" y="62" width="170" height="200" fill="rgba(8,10,25,0.92)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <circle cx="560" cy="162" r="5" fill=${G} fillOpacity="0.8" />
    <circle cx="560" cy="162" r="13" fill="none" stroke=${G} strokeWidth="1.6" strokeOpacity="0.6" />
    <circle cx="560" cy="162" r="24" fill="none" stroke=${PH} strokeWidth="3" strokeOpacity="0.7" />
    <circle cx="560" cy="162" r="34" fill="none" stroke=${OR} strokeWidth="1.5" strokeOpacity="0.3" />
    <circle cx="560" cy="162" r="48" fill="none" stroke=${G} strokeWidth="0.8" strokeOpacity="0.2" />
    <circle cx="560" cy="162" r="64" fill="none" stroke=${G} strokeWidth="0.6" strokeOpacity="0.15" />
    <circle cx="560" cy="162" r="80" fill="none" stroke=${G} strokeWidth="0.4" strokeOpacity="0.1" />

    <text x="140" y="279" textAnchor="middle" style=${{ fontSize: '11px', fill: DIM }}>UV Sampling S(u,v)</text>
    <text x="350" y="279" textAnchor="middle" style=${{ fontSize: '11px', fill: DIM }}>Dirty Beam B^D</text>
    <text x="560" y="279" textAnchor="middle" style=${{ fontSize: '11px', fill: DIM }}>Dirty Image I^D</text>

    <rect x="55" y="296" width="590" height="30" fill="rgba(0,0,0,0.4)" rx="3" />
    <text x="350" y="316" textAnchor="middle" style=${{ fontSize: '12px', fill: TX }}>I^D(l,m) = I_true(l,m) ⊛ B^D(l,m)</text>

    <rect x="55" y="340" width="590" height="56" fill="rgba(196,165,85,0.08)" stroke=${G} strokeWidth="1" rx="4" />
    <text x="350" y="362" textAnchor="middle" style=${{ fontSize: '11px', fill: G }}>Peak sidelobes reach 30–50% of main beam intensity</text>
    <text x="350" y="381" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>A 1 Jy/beam source generates ~0.5 Jy/beam ghost emission</text>

    <text x="350" y="420" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>CLEAN deconvolution removes these artifacts</text>
    <text x="350" y="440" textAnchor="middle" style=${{ fontSize: '16px', fill: G }}>→</text>
  </svg>`;
}

function d08() {
  return html`<svg viewBox="0 0 700 500" width="100%" height="100%">
    <rect width="700" height="500" fill=${BG} />
    <text x="350" y="38" textAnchor="middle" style=${{ fontSize: '13px', fontWeight: '700', fill: TX }}>CLEAN Algorithm (Högbom 1974)</text>

    <g className="clean-step-1">
      <rect x="60" y="52" width="580" height="84" fill="rgba(196,165,85,0.10)" stroke=${G} strokeWidth="1.5" rx="6" />
      <text x="85" y="76" style=${{ fontSize: '13px', fontWeight: '700', fill: G }}>1. Find brightest peak</text>
      <text x="85" y="96" style=${{ fontSize: '11px', fill: DIM }}>Locate maximum of residual |r(l,m)|</text>
      <text x="85" y="114" style=${{ fontSize: '11px', fill: DIM }}>→ position (l_max, m_max), amplitude r_max</text>
    </g>

    <g className="clean-step-2">
      <rect x="60" y="152" width="580" height="84" fill="rgba(255,159,67,0.10)" stroke=${OR} strokeWidth="1.5" rx="6" />
      <text x="85" y="176" style=${{ fontSize: '13px', fontWeight: '700', fill: OR }}>2. Subtract scaled dirty beam</text>
      <text x="85" y="196" style=${{ fontSize: '11px', fill: DIM }}>r(l,m) ← r(l,m) − γ · r_max · B^D(l − l_max, m − m_max)</text>
      <text x="85" y="214" style=${{ fontSize: '11px', fill: DIM }}>Loop gain γ = 0.1 — conservative subtraction for stability</text>
    </g>

    <g className="clean-step-3">
      <rect x="60" y="252" width="580" height="84" fill="rgba(68,136,204,0.10)" stroke=${BL} strokeWidth="1.5" rx="6" />
      <text x="85" y="276" style=${{ fontSize: '13px', fontWeight: '700', fill: BL }}>3. Save clean component</text>
      <text x="85" y="296" style=${{ fontSize: '11px', fill: DIM }}>Add δ-function of flux γ · r_max at (l_max, m_max) to model</text>
      <text x="85" y="314" style=${{ fontSize: '11px', fill: DIM }}>Model M(l,m) accumulates point sources across iterations</text>
    </g>

    <g className="clean-step-4">
      <rect x="60" y="352" width="580" height="84" fill="rgba(68,187,136,0.10)" stroke=${GN} strokeWidth="1.5" rx="6" />
      <text x="85" y="376" style=${{ fontSize: '13px', fontWeight: '700', fill: GN }}>4. Repeat until convergence, then restore</text>
      <text x="85" y="396" style=${{ fontSize: '11px', fill: DIM }}>Stop when max|r| ${'<'} 3σ_noise (MAD border estimator)</text>
      <text x="85" y="414" style=${{ fontSize: '11px', fill: DIM }}>Convolve model with clean beam G; add residual: I^C = M⊛G + r_final</text>
    </g>

    <text x="350" y="470" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>Högbom (1974) · loop gain γ ≈ 0.1 · used in every radio image since 1974</text>
  </svg>`;
}

function d09() {
  return html`<svg viewBox="0 0 700 500" width="100%" height="100%">
    <rect width="700" height="500" fill="#020208" />
    <text x="350" y="30" textAnchor="middle" style=${{ fontSize: '13px', fontWeight: '700', fill: TX }}>M87* Shadow and Photon Ring</text>

    <circle cx="350" cy="270" r="200" fill="none" stroke="rgba(255,80,0,0.05)"  strokeWidth="30" />
    <circle cx="350" cy="270" r="175" fill="none" stroke="rgba(255,100,0,0.08)" strokeWidth="22" />
    <circle cx="350" cy="270" r="155" fill="none" stroke="rgba(255,130,0,0.12)" strokeWidth="18" />
    <circle cx="350" cy="270" r="138" fill="none" stroke="rgba(255,160,0,0.18)" strokeWidth="12" />
    <circle cx="350" cy="270" r="124" fill="none" stroke="rgba(255,190,30,0.25)" strokeWidth="8" />
    <circle cx="350" cy="270" r="112" fill="none" stroke="rgba(255,210,40,0.32)" strokeWidth="5" />

    <circle cx="350" cy="270" r="99" fill="none" stroke=${PH} strokeWidth="4.5" />
    <circle cx="350" cy="270" r="94" fill="none" stroke=${PH} strokeWidth="1" strokeOpacity="0.4" />

    <circle cx="350" cy="270" r="86" fill="#010104" />
    <circle cx="350" cy="270" r="72" fill="#010103" />
    <circle cx="350" cy="270" r="52" fill="#000001" />

    <path d="M 215,110 C 268,148 308,194 304,270 C 300,346 326,380 345,440" fill="none" stroke="rgba(255,215,0,0.55)" strokeWidth="1.8" />
    <path d="M 485,95 C 434,148 394,194 396,270 C 398,346 372,382 355,445" fill="none" stroke="rgba(255,215,0,0.45)" strokeWidth="1.8" />
    <path d="M 168,300 C 212,282 258,272 280,270" fill="none" stroke="rgba(255,215,0,0.3)" strokeWidth="1.5" strokeDasharray="4 2" />

    <rect x="490" y="48" width="194" height="116" fill="rgba(1,1,8,0.9)" stroke="#2d2200" strokeWidth="1" rx="5" />
    <text x="587" y="70" textAnchor="middle" style=${{ fontSize: '11px', fontWeight: '700', fill: TX }}>Scale Comparison</text>
    <circle cx="524" cy="100" r="18" fill="none" stroke=${PH} strokeWidth="2.5" />
    <text x="550" y="104" style=${{ fontSize: '10px', fill: TX }}>42 μas shadow</text>
    <circle cx="524" cy="100" r="9" fill="none" stroke=${G} strokeWidth="1.5" />
    <text x="548" y="88" style=${{ fontSize: '10px', fill: G }}>~20 μas beam</text>
    <text x="550" y="138" style=${{ fontSize: '9px', fill: PH }}>photon ring</text>
    <line x1="549" y1="130" x2="537" y2="112" stroke=${PH} strokeWidth="0.8" strokeOpacity="0.6" />

    <rect x="18" y="48" width="180" height="110" fill="rgba(1,1,8,0.9)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <text x="108" y="68" textAnchor="middle" style=${{ fontSize: '11px', fontWeight: '700', fill: TX }}>M87* Black Hole</text>
    <text x="28" y="88"  style=${{ fontSize: '10px', fill: DIM }}>Mass: 6.5 × 10⁹ M_⊙</text>
    <text x="28" y="106" style=${{ fontSize: '10px', fill: DIM }}>Distance: 55 Mly</text>
    <text x="28" y="124" style=${{ fontSize: '10px', fill: G }}>Shadow: 42 μas</text>
    <text x="28" y="142" style=${{ fontSize: '9px',  fill: DIM }}>Imaged: April 10, 2019</text>

    <rect x="60" y="436" width="580" height="46" fill="rgba(8,10,25,0.9)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <text x="350" y="457" textAnchor="middle" style=${{ fontSize: '12px', fill: G }}>θ_shadow = 3√3 · GM / (c² · D_L)  ≈  42 μas</text>
    <text x="350" y="474" textAnchor="middle" style=${{ fontSize: '9px',  fill: DIM }}>Schwarzschild shadow radius — confirmed by GR to within measurement uncertainty</text>
  </svg>`;
}

function d10() {
  return html`<svg viewBox="0 0 700 500" width="100%" height="100%">
    <rect width="700" height="500" fill=${BG} />
    <text x="350" y="32" textAnchor="middle" style=${{ fontSize: '13px', fontWeight: '700', fill: TX }}>EHT 2017 vs ngEHT Phase 1</text>

    <rect x="18" y="48" width="322" height="330" fill="rgba(8,10,25,0.9)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <text x="179" y="68" textAnchor="middle" style=${{ fontSize: '12px', fontWeight: '700', fill: TX }}>EHT 2017</text>
    <text x="179" y="84" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>8 stations · 28 baselines</text>
    <line x1="22"  y1="213" x2="336" y2="213" stroke="#1a1a38" strokeWidth="0.5" />
    <line x1="179" y1="52"  x2="179" y2="374" stroke="#1a1a38" strokeWidth="0.5" />

    <path d="M 52,213 A 127,82 0 0 0 306,213" fill="none" stroke=${G} strokeWidth="2.0" strokeOpacity="0.75" />
    <path d="M 52,213 A 127,82 0 0 1 306,213" fill="none" stroke=${G} strokeWidth="2.0" strokeOpacity="0.35" />

    <g transform="rotate(30, 179, 213)">
      <path d="M 71,213 A 108,70 0 0 0 287,213" fill="none" stroke=${G} strokeWidth="1.6" strokeOpacity="0.65" />
      <path d="M 71,213 A 108,70 0 0 1 287,213" fill="none" stroke=${G} strokeWidth="1.4" strokeOpacity="0.28" />
    </g>

    <g transform="rotate(58, 179, 213)">
      <path d="M 97,213 A 82,52 0 0 0 261,213" fill="none" stroke=${G} strokeWidth="1.4" strokeOpacity="0.55" />
      <path d="M 97,213 A 82,52 0 0 1 261,213" fill="none" stroke=${G} strokeWidth="1.2" strokeOpacity="0.22" />
    </g>

    <text x="179" y="392" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>UV fill: ~0.8%  ·  DR: ~50:1</text>

    <rect x="360" y="48" width="322" height="330" fill="rgba(8,10,25,0.9)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <text x="521" y="68" textAnchor="middle" style=${{ fontSize: '12px', fontWeight: '700', fill: G }}>ngEHT Phase 1</text>
    <text x="521" y="84" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>17 stations · 136 baselines</text>
    <line x1="364" y1="213" x2="678" y2="213" stroke="#1a1a38" strokeWidth="0.5" />
    <line x1="521" y1="52"  x2="521" y2="374" stroke="#1a1a38" strokeWidth="0.5" />

    <path d="M 394,213 A 127,82 0 0 0 648,213" fill="none" stroke=${G} strokeWidth="2.0" strokeOpacity="0.75" />
    <path d="M 394,213 A 127,82 0 0 1 648,213" fill="none" stroke=${G} strokeWidth="2.0" strokeOpacity="0.35" />

    <g transform="rotate(20, 521, 213)">
      <path d="M 403,213 A 118,76 0 0 0 639,213" fill="none" stroke=${G} strokeWidth="1.7" strokeOpacity="0.68" />
      <path d="M 403,213 A 118,76 0 0 1 639,213" fill="none" stroke=${G} strokeWidth="1.5" strokeOpacity="0.3" />
    </g>

    <g transform="rotate(42, 521, 213)">
      <path d="M 413,213 A 108,70 0 0 0 629,213" fill="none" stroke=${G} strokeWidth="1.6" strokeOpacity="0.62" />
      <path d="M 413,213 A 108,70 0 0 1 629,213" fill="none" stroke=${G} strokeWidth="1.4" strokeOpacity="0.27" />
    </g>

    <g transform="rotate(-18, 521, 213)">
      <path d="M 421,213 A 100,64 0 0 0 621,213" fill="none" stroke=${G} strokeWidth="1.5" strokeOpacity="0.56" />
      <path d="M 421,213 A 100,64 0 0 1 621,213" fill="none" stroke=${G} strokeWidth="1.3" strokeOpacity="0.24" />
    </g>

    <g transform="rotate(62, 521, 213)">
      <path d="M 433,213 A 88,56 0 0 0 609,213" fill="none" stroke=${G} strokeWidth="1.3" strokeOpacity="0.50" />
      <path d="M 433,213 A 88,56 0 0 1 609,213" fill="none" stroke=${G} strokeWidth="1.1" strokeOpacity="0.21" />
    </g>

    <g transform="rotate(-40, 521, 213)">
      <path d="M 445,213 A 76,48 0 0 0 597,213" fill="none" stroke=${G} strokeWidth="1.2" strokeOpacity="0.44" />
      <path d="M 445,213 A 76,48 0 0 1 597,213" fill="none" stroke=${G} strokeWidth="1.0" strokeOpacity="0.18" />
    </g>

    <g transform="rotate(10, 521, 213)">
      <path d="M 466,213 A 55,35 0 0 0 576,213" fill="none" stroke=${G} strokeWidth="1.0" strokeOpacity="0.38" />
      <path d="M 466,213 A 55,35 0 0 1 576,213" fill="none" stroke=${G} strokeWidth="0.9" strokeOpacity="0.16" />
    </g>

    <g transform="rotate(50, 521, 213)">
      <path d="M 473,213 A 48,30 0 0 0 569,213" fill="none" stroke=${G} strokeWidth="0.9" strokeOpacity="0.33" />
      <path d="M 473,213 A 48,30 0 0 1 569,213" fill="none" stroke=${G} strokeWidth="0.8" strokeOpacity="0.14" />
    </g>

    <text x="521" y="392" textAnchor="middle" style=${{ fontSize: '10px', fill: G }}>UV fill: ~3.5%  ·  DR: ~200:1</text>

    <rect x="100" y="410" width="500" height="28" fill="rgba(8,10,25,0.9)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <text x="350" y="428" textAnchor="middle" style=${{ fontSize: '11px', fill: G }}>N(N-1)/2: 8 stations → 28, 17 stations → 136 baselines</text>

    <text x="350" y="468" textAnchor="middle" style=${{ fontSize: '9px', fill: DIM }}>ngEHT targets movie-mode imaging of Sgr A* — minute-scale structural changes</text>
  </svg>`;
}

function d11() {
  return html`<svg viewBox="0 0 700 500" width="100%" height="100%">
    <rect width="700" height="500" fill="#020208" />
    <text x="350" y="30" textAnchor="middle" style=${{ fontSize: '13px', fontWeight: '700', fill: TX }}>BHEX Space VLBI</text>

    <ellipse cx="350" cy="280" rx="280" ry="115" fill="none" stroke="#2a2a66" strokeWidth="1.5" strokeDasharray="6 3" transform="rotate(-22, 350, 280)" />

    <circle cx="350" cy="280" r="80" fill="rgba(20,50,120,0.4)" stroke=${BL} strokeWidth="2.5" />
    <text x="350" y="284" textAnchor="middle" style=${{ fontSize: '12px', fill: BL }}>Earth</text>

    <circle cx="295" cy="262" r="7" fill=${G} stroke="#020208" strokeWidth="1.5" />
    <text x="282" y="278" style=${{ fontSize: '9px', fill: DIM }}>ALMA</text>
    <circle cx="350" cy="225" r="5" fill=${BL} />
    <text x="357" y="222" style=${{ fontSize: '9px', fill: DIM }}>IRAM</text>
    <circle cx="405" cy="250" r="5" fill=${BL} />
    <text x="412" y="248" style=${{ fontSize: '9px', fill: DIM }}>JCMT</text>
    <circle cx="350" cy="358" r="5" fill=${BL} />
    <text x="357" y="370" style=${{ fontSize: '9px', fill: DIM }}>SPT</text>

    <circle cx="588" cy="185" r="11" fill=${OR} stroke=${G} strokeWidth="2.5" />
    <rect x="580" y="178" width="5" height="14" fill=${OR} fillOpacity="0.6" />
    <rect x="582" y="178" width="16" height="5" fill=${OR} fillOpacity="0.4" />
    <text x="606" y="178" style=${{ fontSize: '11px', fill: OR }}>BHEX</text>

    <line x1="582" y1="189" x2="300" y2="264" stroke=${G}   strokeWidth="1.8" strokeDasharray="5 3" strokeOpacity="0.7" />
    <line x1="582" y1="187" x2="352" y2="228" stroke=${BL}  strokeWidth="1.2" strokeDasharray="5 3" strokeOpacity="0.5" />
    <line x1="582" y1="189" x2="352" y2="354" stroke=${DIM} strokeWidth="1"   strokeDasharray="5 3" strokeOpacity="0.4" />

    <line x1="350" y1="280" x2="588" y2="185" stroke=${G} strokeWidth="1" strokeOpacity="0.5" strokeDasharray="3 3" />
    <text x="490" y="218" textAnchor="middle" style=${{ fontSize: '9px', fill: G }}>~33,000 km / ~33 Gλ</text>

    <rect x="15" y="45" width="210" height="130" fill="rgba(2,2,12,0.9)" stroke="#2d2200" strokeWidth="1" rx="5" />
    <text x="120" y="68" textAnchor="middle" style=${{ fontSize: '12px', fontWeight: '700', fill: TX }}>Angular Resolution</text>
    <line x1="20" y1="76" x2="220" y2="76" stroke="#2d2200" strokeWidth="1" />
    <rect x="25" y="83"  width="80" height="22" fill=${BL} fillOpacity="0.6" rx="2" />
    <text x="112" y="98" style=${{ fontSize: '10px', fill: TX }}>EHT: ~20 μas</text>
    <rect x="25" y="113" width="24" height="22" fill=${OR} fillOpacity="0.7" rx="2" />
    <text x="56"  y="128" style=${{ fontSize: '10px', fill: OR }}>BHEX: ~6 μas</text>
    <text x="25"  y="156" style=${{ fontSize: '10px', fill: G }}>3.3× finer resolution</text>

    <rect x="475" y="45" width="210" height="100" fill="rgba(2,2,12,0.9)" stroke="#2d2200" strokeWidth="1" rx="5" />
    <text x="580" y="68" textAnchor="middle" style=${{ fontSize: '12px', fontWeight: '700', fill: TX }}>Max Baseline</text>
    <text x="488" y="90"  style=${{ fontSize: '10px', fill: DIM }}>EHT:  ~10,900 km / 8.1 Gλ</text>
    <text x="488" y="112" style=${{ fontSize: '10px', fill: OR }}>BHEX: ~32,900 km / 33 Gλ</text>
    <text x="580" y="134" textAnchor="middle" style=${{ fontSize: '10px', fill: G }}>At 300 GHz: θ ≈ 6 μas</text>

    <rect x="60" y="435" width="580" height="48" fill="rgba(8,10,25,0.9)" stroke="#2d2200" strokeWidth="1" rx="4" />
    <text x="350" y="455" textAnchor="middle" style=${{ fontSize: '11px', fill: G }}>B_max = R_Earth + h_orbit = 6,371 + 26,562 = 32,933 km</text>
    <text x="350" y="473" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>θ = λ / B_max = 1.0 mm / 32,933 km ≈ 6.3 μas at 300 GHz</text>
  </svg>`;
}

function d12() {
  return html`<svg viewBox="0 0 700 500" width="100%" height="100%">
    <rect width="700" height="500" fill=${BG} />
    <text x="350" y="30" textAnchor="middle" style=${{ fontSize: '13px', fontWeight: '700', fill: TX }}>From Visibilities to Science</text>

    <rect x="18" y="48" width="320" height="190" fill="rgba(8,10,25,0.9)" stroke="#2d2200" strokeWidth="1" rx="5" />
    <text x="178" y="68" textAnchor="middle" style=${{ fontSize: '11px', fontWeight: '700', fill: G }}>UV Coverage</text>
    <line x1="24" y1="145" x2="332" y2="145" stroke="#1a1a38" strokeWidth="0.5" />
    <line x1="178" y1="54" x2="178" y2="232" stroke="#1a1a38" strokeWidth="0.5" />
    <path d="M 50,100 Q 178,68 306,100 Q 284,145 306,190 Q 178,222 50,190 Q 72,145 50,100" fill="none" stroke=${G} strokeWidth="2" />
    <path d="M 72,90 Q 178,62 284,90 Q 266,145 284,200 Q 178,228 72,200 Q 90,145 72,90" fill="none" stroke=${G} strokeWidth="1.5" strokeOpacity="0.45" />
    <path d="M 98,108 Q 178,90 258,108" fill="none" stroke=${G} strokeWidth="1.2" strokeOpacity="0.6" />
    <text x="306" y="158" style=${{ fontSize: '9px', fill: DIM }}>Gλ</text>

    <rect x="362" y="48" width="320" height="190" fill="rgba(8,10,25,0.9)" stroke="#2d2200" strokeWidth="1" rx="5" />
    <text x="522" y="68" textAnchor="middle" style=${{ fontSize: '11px', fontWeight: '700', fill: G }}>Image Metrics</text>
    <text x="372" y="90"  style=${{ fontSize: '10px', fill: TX }}>Beam FWHM (major)</text>
    <text x="672" y="90"  textAnchor="end" style=${{ fontSize: '10px', fill: G }}>~25 μas</text>
    <line x1="372" y1="98" x2="672" y2="98" stroke="#1a1a38" strokeWidth="0.3" />
    <text x="372" y="112" style=${{ fontSize: '10px', fill: TX }}>Beam FWHM (minor)</text>
    <text x="672" y="112" textAnchor="end" style=${{ fontSize: '10px', fill: G }}>~18 μas</text>
    <line x1="372" y1="120" x2="672" y2="120" stroke="#1a1a38" strokeWidth="0.3" />
    <text x="372" y="134" style=${{ fontSize: '10px', fill: TX }}>Dynamic Range</text>
    <text x="672" y="134" textAnchor="end" style=${{ fontSize: '10px', fill: G }}>~50:1</text>
    <line x1="372" y1="142" x2="672" y2="142" stroke="#1a1a38" strokeWidth="0.3" />
    <text x="372" y="156" style=${{ fontSize: '10px', fill: TX }}>UV Fill %</text>
    <text x="672" y="156" textAnchor="end" style=${{ fontSize: '10px', fill: G }}>0.8%</text>
    <line x1="372" y1="164" x2="672" y2="164" stroke="#1a1a38" strokeWidth="0.3" />
    <text x="372" y="178" style=${{ fontSize: '10px', fill: TX }}>UV Samples</text>
    <text x="672" y="178" textAnchor="end" style=${{ fontSize: '10px', fill: G }}>11,000+</text>
    <line x1="372" y1="186" x2="672" y2="186" stroke="#1a1a38" strokeWidth="0.3" />
    <text x="372" y="200" style=${{ fontSize: '10px', fill: TX }}>Max baseline</text>
    <text x="672" y="200" textAnchor="end" style=${{ fontSize: '10px', fill: G }}>10,900 km</text>

    <rect x="18" y="256" width="320" height="190" fill="rgba(8,10,25,0.9)" stroke="#2d2200" strokeWidth="1" rx="5" />
    <text x="178" y="276" textAnchor="middle" style=${{ fontSize: '11px', fontWeight: '700', fill: G }}>FITS Export (WCS Headers)</text>
    <text x="28" y="296" style=${{ fontSize: '9px', fill: DIM,  fontFamily: 'monospace' }}>SIMPLE  = T</text>
    <text x="28" y="312" style=${{ fontSize: '9px', fill: DIM,  fontFamily: 'monospace' }}>NAXIS   = 2</text>
    <text x="28" y="328" style=${{ fontSize: '9px', fill: TX,   fontFamily: 'monospace' }}>CRVAL1  = 187.7059</text>
    <text x="28" y="344" style=${{ fontSize: '9px', fill: TX,   fontFamily: 'monospace' }}>CRVAL2  =  12.3911</text>
    <text x="28" y="360" style=${{ fontSize: '9px', fill: TX,   fontFamily: 'monospace' }}>CDELT1  = -1.94E-09</text>
    <text x="28" y="376" style=${{ fontSize: '9px', fill: G,    fontFamily: 'monospace' }}>BMAJ    = 5.56E-09</text>
    <text x="28" y="392" style=${{ fontSize: '9px', fill: DIM,  fontFamily: 'monospace' }}>BUNIT   = 'JY/BEAM'</text>
    <text x="28" y="408" style=${{ fontSize: '9px', fill: DIM,  fontFamily: 'monospace' }}>END</text>
    <text x="178" y="430" textAnchor="middle" style=${{ fontSize: '9px', fill: DIM }}>Compatible: CASA · Astropy · ds9</text>

    <rect x="362" y="256" width="320" height="190" fill="rgba(8,10,25,0.9)" stroke="#2d2200" strokeWidth="1" rx="5" />
    <text x="522" y="276" textAnchor="middle" style=${{ fontSize: '11px', fontWeight: '700', fill: G }}>Dynamic Range</text>
    <text x="372" y="305" style=${{ fontSize: '10px', fill: DIM }}>EHT 2017</text>
    <rect x="372" y="310" width="56"  height="24" fill=${G} fillOpacity="0.6" rx="3" />
    <text x="434" y="326" style=${{ fontSize: '9px', fill: G }}>~50:1</text>
    <text x="372" y="344" style=${{ fontSize: '10px', fill: DIM }}>EHT 2022</text>
    <rect x="372" y="349" width="112" height="24" fill=${G} fillOpacity="0.65" rx="3" />
    <text x="490" y="365" style=${{ fontSize: '9px', fill: G }}>~100:1</text>
    <text x="372" y="383" style=${{ fontSize: '10px', fill: DIM }}>ngEHT Ph.1</text>
    <rect x="372" y="388" width="224" height="24" fill=${G} fillOpacity="0.8" rx="3" />
    <text x="602" y="404" style=${{ fontSize: '9px', fill: G }}>~200:1</text>
    <text x="372" y="428" style=${{ fontSize: '8px', fill: DIM }}>DR = S_peak / (1.4826 · median|border − median|)</text>

    <text x="350" y="476" textAnchor="middle" style=${{ fontSize: '10px', fill: DIM }}>VLBI pipeline: calibration → imaging → deconvolution → science</text>
  </svg>`;
}
