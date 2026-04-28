// TourDiagram.js — 8 SVG hero diagrams for the cinematic VLBI tour.
// All diagrams: viewBox="0 0 1200 700", background #08080f.
// CSS animations via className — see tour.css. Filter IDs are diagram-scoped.
// htm safety: NEVER use bare < or > in SVG text content.
import { html } from './core.js';

const BG   = '#08080f';  // deep space, slightly warm
const DRK  = '#0d0d1a';  // panel backgrounds
const GOLD = '#FFD700';
const AM   = '#C4A555';
const TEAL = '#4ecdc4';
const DIM  = '#8888b0';
const TX   = '#f0f0f8';
const GLOW = '#ff9f43';
const RED  = '#ff6b6b';
const BLUE = '#4488cc';

// Pre-computed star positions: 20 cols × 9 rows = 180 stars, deterministic
// x_i = min((i%20)*62 + (i*17%43), 1195), y_i = min(floor(i/20)*82 + (i*13%37), 695)
const STARS = Array.from({ length: 180 }, (_, i) => ({
  x: Math.min((i % 20) * 62 + ((i * 17) % 43), 1195),
  y: Math.min(Math.floor(i / 20) * 82 + ((i * 13) % 37), 695),
  r: i < 60 ? 1.2 : i < 140 ? 0.8 : 0.5,
  op: i < 60 ? 0.8 : i < 140 ? 0.45 : 0.25,
}));

export function TourDiagram({ diagramId }) {
  switch (diagramId) {
    case 1: return d01();
    case 2: return d02();
    case 3: return d03();
    case 4: return d04();
    case 5: return d05();
    case 6: return d06();
    case 7: return d07();
    case 8: return d08();
    default: return null;
  }
}

// ── d01: The Resolution Problem ──────────────────────────────────────────────
function d01() {
  return html`
    <svg viewBox="0 0 1200 700" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="bloom-d01" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="hardblur-d01" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="24" />
        </filter>
        <radialGradient id="beamGrad1-d01" cx="50%" cy="100%" r="70%" gradientUnits="userSpaceOnUse" fx="240" fy="490">
          <stop offset="0%"   stopColor=${AM} stopOpacity="0.18" />
          <stop offset="100%" stopColor=${AM} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="beamGrad2-d01" cx="50%" cy="100%" r="70%" gradientUnits="userSpaceOnUse" fx="900" fy="490">
          <stop offset="0%"   stopColor=${TEAL} stopOpacity="0.10" />
          <stop offset="100%" stopColor=${TEAL} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1200" height="700" fill=${BG} />

      <!-- Star field -->
      ${STARS.map((s, i) => html`<circle key=${'s'+i} cx=${s.x} cy=${s.y} r=${s.r} fill=${TX} fillOpacity=${s.op} />`)}

      <!-- Divider -->
      <line x1="600" y1="40" x2="600" y2="660" stroke="#1a1a2e" strokeWidth="1" />

      <!-- ── LEFT: single dish — 70,000× too blurry ── -->
      <!-- Blurry M87* smear at top (not a circle — soft blur) -->
      <circle cx="240" cy="52" r="50" fill=${GLOW} fillOpacity="0.08" filter="url(#hardblur-d01)" className="beam-left" />
      <circle cx="240" cy="52" r="32" fill=${GLOW} fillOpacity="0.15" filter="url(#hardblur-d01)" className="beam-left" />
      <circle cx="240" cy="52" r="18" fill=${GOLD} fillOpacity="0.18" filter="url(#hardblur-d01)" className="beam-left" />

      <!-- Beam cone (volumetric) -->
      <polygon points="240,490 60,60 420,60" fill="url(#beamGrad1-d01)" className="beam-left" />

      <!-- θ inside cone -->
      <text x="240" y="240" textAnchor="middle" fill=${DIM} fontSize="17" className="beam-left">θ ≈ 2.7 arcsec</text>

      <!-- Dish parabola — 3-stroke metallic technique -->
      <path d="M 80,490 Q 240,360 400,490" stroke="#12122a" strokeWidth="10" fill="none" strokeOpacity="0.9" className="beam-left" />
      <path d="M 82,490 Q 240,362 398,490" stroke="#3a3a60" strokeWidth="5"  fill="none" strokeOpacity="0.85" className="beam-left" />
      <path d="M 88,492 Q 240,368 392,492" stroke=${AM}     strokeWidth="1.8" fill="none" strokeOpacity="0.6" className="beam-left" />
      <line x1="240" y1="362" x2="240" y2="490" stroke=${AM} strokeWidth="2" className="beam-left" />
      <circle cx="240" cy="358" r="6" fill=${AM} className="beam-left" />

      <!-- Failure label -->
      <text x="240" y="560" textAnchor="middle" fill=${RED} fontSize="22" fontWeight="600" className="beam-left">70,000× too blurry</text>
      <text x="240" y="610" textAnchor="middle" fill=${DIM} fontSize="14" className="beam-left">100 m dish</text>

      <!-- ── RIGHT: interferometry — two dishes + baseline ── -->
      <!-- M87* as sharp gold point -->
      <circle cx="905" cy="50" r="5" fill=${GOLD} filter="url(#bloom-d01)" className="gold-dot" style=${{ transformBox:'fill-box', transformOrigin:'center' }} />

      <!-- θ label right -->
      <text x="905" y="130" textAnchor="middle" fill=${TEAL} fontSize="22" fontWeight="600" className="beam-right">θ ≈ 20 μas</text>

      <!-- Left dish (cx=760) -->
      <path d="M 640,490 Q 760,360 880,490" stroke="#12122a" strokeWidth="10" fill="none" strokeOpacity="0.9" className="beam-right" />
      <path d="M 642,490 Q 760,362 878,490" stroke="#3a3a60" strokeWidth="5"  fill="none" strokeOpacity="0.85" className="beam-right" />
      <path d="M 648,492 Q 760,368 872,492" stroke=${AM}     strokeWidth="1.8" fill="none" strokeOpacity="0.6" className="beam-right" />
      <line x1="760" y1="362" x2="760" y2="490" stroke=${AM} strokeWidth="2" className="beam-right" />
      <circle cx="760" cy="358" r="6" fill=${AM} className="beam-right" />

      <!-- Right dish (cx=1040) -->
      <path d="M 920,490 Q 1040,360 1160,490" stroke="#12122a" strokeWidth="10" fill="none" strokeOpacity="0.9" className="beam-right" />
      <path d="M 922,490 Q 1040,362 1158,490" stroke="#3a3a60" strokeWidth="5"  fill="none" strokeOpacity="0.85" className="beam-right" />
      <path d="M 928,492 Q 1040,368 1152,492" stroke=${AM}     strokeWidth="1.8" fill="none" strokeOpacity="0.6" className="beam-right" />
      <line x1="1040" y1="362" x2="1040" y2="490" stroke=${AM} strokeWidth="2" className="beam-right" />
      <circle cx="1040" cy="358" r="6" fill=${AM} className="beam-right" />

      <!-- Beam cone (narrow, razor-thin lines to source) -->
      <line x1="758" y1="358" x2="896" y2="55" stroke=${TEAL} strokeWidth="1.2" strokeOpacity="0.7" className="beam-right" />
      <line x1="762" y1="358" x2="906" y2="55" stroke=${TEAL} strokeWidth="1.2" strokeOpacity="0.7" className="beam-right" />
      <line x1="1038" y1="358" x2="906" y2="55" stroke=${TEAL} strokeWidth="1.2" strokeOpacity="0.7" className="beam-right" />
      <line x1="1042" y1="358" x2="916" y2="55" stroke=${TEAL} strokeWidth="1.2" strokeOpacity="0.7" className="beam-right" />

      <!-- Baseline (draws itself) -->
      <line x1="760" y1="380" x2="1040" y2="380" stroke=${TEAL} strokeWidth="6" strokeOpacity="0.15" className="beam-right" />
      <line x1="760" y1="380" x2="1040" y2="380" stroke=${AM} strokeWidth="1.5" className="beam-right bl-draw" />

      <!-- Triumph label -->
      <text x="900" y="560" textAnchor="middle" fill=${TEAL} fontSize="22" fontWeight="600" className="beam-right">Resolves 42 μas shadow</text>

      <!-- Bottom equation — always visible -->
      <text x="600" y="660" textAnchor="middle" fill=${GOLD} fontSize="30" fontWeight="700">θ = 1.22 λ/D</text>
    </svg>
  `;
}

// ── d02: The Baseline ─────────────────────────────────────────────────────────
function d02() {
  return html`
    <svg viewBox="0 0 1200 700" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="bloom-d02" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <rect width="1200" height="700" fill=${BG} />

      <!-- Stars in upper zone -->
      ${STARS.filter(s => s.y < 420).map((s, i) => html`<circle key=${'s'+i} cx=${s.x} cy=${s.y} r=${s.r} fill=${TX} fillOpacity=${s.op} />`)}

      <!-- M87* source point -->
      <circle cx="600" cy="42" r="5" fill=${GOLD} filter="url(#bloom-d02)" />
      <text x="600" y="30" textAnchor="middle" fill=${GOLD} fontSize="13">M87*</text>

      <!-- Static wavefront ghost lines (phase context) -->
      <line x1="80" y1="172" x2="1120" y2="172" stroke="#1e1e38" strokeWidth="1" />
      <line x1="80" y1="186" x2="1120" y2="186" stroke="#1e1e38" strokeWidth="1" />
      <line x1="80" y1="200" x2="1120" y2="200" stroke="#1e1e38" strokeWidth="1" />

      <!-- Animated wavefront (descends, loops) -->
      <line x1="80" y1="185" x2="1120" y2="185" stroke=${AM} strokeWidth="1.8" strokeOpacity="0.7" className="wf-line" />

      <!-- Left dish (ALMA, cx=180) — 3-stroke metallic -->
      <path d="M 60,360 Q 180,268 300,360" stroke="#12122a" strokeWidth="8"  fill="none" strokeOpacity="0.8" />
      <path d="M 62,360 Q 180,270 298,360" stroke="#3a3a60" strokeWidth="5"  fill="none" strokeOpacity="0.85" />
      <path d="M 68,362 Q 180,276 292,362" stroke=${AM}     strokeWidth="1.8" fill="none" strokeOpacity="0.6" />
      <line x1="180" y1="270" x2="180" y2="360" stroke=${AM} strokeWidth="2" />
      <circle cx="180" cy="264" r="6" fill=${AM} filter="url(#bloom-d02)" />
      <text x="180" y="408" textAnchor="middle" fill=${TX}  fontSize="15" fontWeight="600">Telescope 1</text>
      <text x="180" y="428" textAnchor="middle" fill=${DIM} fontSize="12">ALMA · Chile</text>

      <!-- Right dish (JCMT, cx=1020) — 3-stroke metallic -->
      <path d="M 900,360 Q 1020,268 1140,360" stroke="#12122a" strokeWidth="8"  fill="none" strokeOpacity="0.8" />
      <path d="M 902,360 Q 1020,270 1138,360" stroke="#3a3a60" strokeWidth="5"  fill="none" strokeOpacity="0.85" />
      <path d="M 908,362 Q 1020,276 1132,362" stroke=${AM}     strokeWidth="1.8" fill="none" strokeOpacity="0.6" />
      <line x1="1020" y1="270" x2="1020" y2="360" stroke=${AM} strokeWidth="2" />
      <circle cx="1020" cy="264" r="6" fill=${AM} filter="url(#bloom-d02)" />
      <text x="1020" y="408" textAnchor="middle" fill=${TX}  fontSize="15" fontWeight="600">Telescope 2</text>
      <text x="1020" y="428" textAnchor="middle" fill=${DIM} fontSize="12">JCMT · Hawaii</text>

      <!-- Phase tick marks (appear in sequence) -->
      <line x1="180" y1="160" x2="180" y2="190" stroke=${GOLD} strokeWidth="2.5" className="tick-1" style=${{ transformBox:'fill-box', transformOrigin:'left center' }} />
      <line x1="1020" y1="175" x2="1020" y2="205" stroke=${GOLD} strokeWidth="2.5" className="tick-2" style=${{ transformBox:'fill-box', transformOrigin:'left center' }} />

      <!-- τ_g annotation (brace + label) -->
      <path d="M 185,168 C 600,120 600,120 1015,183" fill="none" stroke=${GLOW} strokeWidth="1.2" strokeDasharray="4 3" className="tau-label" />
      <text x="600" y="108" textAnchor="middle" fill=${GLOW} fontSize="28" fontWeight="700" className="tau-label">τ_g</text>
      <text x="600" y="136" textAnchor="middle" fill=${GLOW} fontSize="16" className="tau-label">= B·ŝ/c</text>

      <!-- Baseline measurement bar -->
      <line x1="188" y1="458" x2="1012" y2="458" stroke=${AM} strokeWidth="1.2" />
      <line x1="188" y1="452" x2="188" y2="464" stroke=${AM} strokeWidth="1.2" />
      <line x1="1012" y1="452" x2="1012" y2="464" stroke=${AM} strokeWidth="1.2" />
      <text x="600" y="480" textAnchor="middle" fill=${AM} fontSize="15">B = 10,900 km  →  u = B/λ = 8.4 Gλ</text>

      <!-- UV plane panel (bottom) -->
      <rect x="60" y="500" width="1080" height="180" fill=${DRK} stroke=${AM} strokeWidth="0.8" strokeOpacity="0.4" rx="6" />
      <text x="110" y="522" fill=${AM} fontSize="13" fontWeight="600">UV Plane</text>

      <!-- UV axes -->
      <line x1="70" y1="590" x2="1130" y2="590" stroke="#222245" strokeWidth="0.8" />
      <line x1="600" y1="508" x2="600" y2="672" stroke="#222245" strokeWidth="0.8" />
      <text x="1118" y="605" fill=${DIM} fontSize="12">u</text>
      <text x="608" y="518" fill=${DIM} fontSize="12">v</text>

      <!-- Conjugate UV point (appears after main) -->
      <circle cx="490" cy="630" r="4" fill=${AM} fillOpacity="0.35" className="uv-pt-conj" />
      <text x="468" y="635" fill=${DIM} fontSize="11" className="uv-pt-conj">(-u,-v)</text>

      <!-- Main UV point with pulse -->
      <circle cx="710" cy="550" r="6" fill=${AM} filter="url(#bloom-d02)" className="uv-pt-main" style=${{ transformBox:'fill-box', transformOrigin:'center' }} />
      <text x="728" y="548" fill=${TX} fontSize="11" className="uv-pt-main">(u,v)</text>

      <text x="600" y="668" textAnchor="middle" fill=${DIM} fontSize="12">One baseline = one Fourier component of the sky</text>
    </svg>
  `;
}

// ── d03: Earth Rotation Synthesis ────────────────────────────────────────────
function d03() {
  return html`
    <svg viewBox="0 0 1200 700" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="bloom-d03" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="softglow-d03" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="earthGrad-d03" cx="38%" cy="32%" r="65%">
          <stop offset="0%"   stopColor="#1e4a8a" />
          <stop offset="42%"  stopColor="#0d1f3d" />
          <stop offset="100%" stopColor="#04080e" />
        </radialGradient>
        <radialGradient id="nightSide-d03" cx="76%" cy="50%" r="58%">
          <stop offset="0%"   stopColor="#000000" stopOpacity="0.65" />
          <stop offset="58%"  stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1200" height="700" fill=${BG} />

      <!-- ── LEFT: Rotating Earth (cx=310 cy=350) ── -->
      <!-- Atmosphere layers (earned — Earth rotation is the story) -->
      <circle cx="310" cy="350" r="234" fill="none" stroke=${TEAL} strokeWidth="30" strokeOpacity="0.04" filter="url(#softglow-d03)" />
      <circle cx="310" cy="350" r="220" fill="none" stroke=${TEAL} strokeWidth="14" strokeOpacity="0.08" filter="url(#bloom-d03)" />
      <circle cx="310" cy="350" r="210" fill="none" stroke=${TEAL} strokeWidth="5"  strokeOpacity="0.16" />

      <!-- Earth body + night shadow -->
      <circle cx="310" cy="350" r="196" fill="url(#earthGrad-d03)" />
      <circle cx="310" cy="350" r="196" fill="url(#nightSide-d03)" />

      <!-- Rotating group (CSS transform-origin: 310px 350px) -->
      <g className="earth-group-cinema">
        <line x1="310" y1="163" x2="310" y2="537" stroke=${TEAL} strokeWidth="7" strokeOpacity="0.18" filter="url(#softglow-d03)" />
        <line x1="310" y1="163" x2="310" y2="537" stroke=${TX}   strokeWidth="1.2" strokeOpacity="0.75" />
        <circle cx="310" cy="154" r="9" fill=${AM} filter="url(#bloom-d03)" />
        <circle cx="310" cy="546" r="9" fill=${AM} filter="url(#bloom-d03)" />
      </g>

      <!-- Labels below Earth -->
      <text x="310" y="600" textAnchor="middle" fill=${TEAL} fontSize="15">H = −6h → +6h</text>
      <text x="310" y="622" textAnchor="middle" fill=${DIM}  fontSize="13">12 hour observation</text>

      <!-- Divider arrow -->
      <text x="575" y="358" textAnchor="middle" fill="#2a2a50" fontSize="32">→</text>

      <!-- ── RIGHT: UV plane (cx=915 cy=350) ── -->
      <rect x="630" y="50" width="550" height="600" fill=${DRK} stroke=${AM} strokeWidth="0.8" strokeOpacity="0.3" rx="6" />

      <!-- Axes -->
      <line x1="638" y1="350" x2="1172" y2="350" stroke="#222245" strokeWidth="0.8" />
      <line x1="915" y1="58"  x2="915"  y2="642" stroke="#222245" strokeWidth="0.8" />
      <text x="1158" y="365" fill=${DIM} fontSize="12">u (Gλ)</text>
      <text x="923"  y="72"  fill=${DIM} fontSize="12">v (Gλ)</text>

      <!-- Scale circles -->
      <circle cx="915" cy="350" r="90"  fill="none" stroke="#1a1a38" strokeWidth="0.5" />
      <circle cx="915" cy="350" r="180" fill="none" stroke="#1a1a38" strokeWidth="0.5" />
      <circle cx="915" cy="350" r="270" fill="none" stroke="#1a1a38" strokeWidth="0.5" />

      <!-- Arc family 1 (rx=240 ry=150, unrotated) -->
      <path d="M 675,350 A 240,150 0 0 0 1155,350" stroke=${AM} strokeWidth="6" strokeOpacity="0.18" fill="none" filter="url(#bloom-d03)" className="uv-draw-1" />
      <path d="M 675,350 A 240,150 0 0 0 1155,350" stroke=${AM} strokeWidth="2" strokeOpacity="0.9"  fill="none" className="uv-draw-1" />
      <path d="M 675,350 A 240,150 0 0 1 1155,350" stroke=${AM} strokeWidth="1" strokeOpacity="0.3"  fill="none" className="uv-draw-1-conj" />

      <!-- Arc family 2 (rx=190 ry=118, rotated 28°) -->
      <g transform="rotate(28, 915, 350)">
        <path d="M 725,350 A 190,118 0 0 0 1105,350" stroke=${AM} strokeWidth="4" strokeOpacity="0.14" fill="none" filter="url(#bloom-d03)" className="uv-draw-2" />
        <path d="M 725,350 A 190,118 0 0 0 1105,350" stroke=${AM} strokeWidth="1.8" strokeOpacity="0.8" fill="none" className="uv-draw-2" />
        <path d="M 725,350 A 190,118 0 0 1 1105,350" stroke=${AM} strokeWidth="1"   strokeOpacity="0.28" fill="none" className="uv-draw-2-conj" />
      </g>

      <!-- Arc family 3 (rx=148 ry=92, rotated -22°) -->
      <g transform="rotate(-22, 915, 350)">
        <path d="M 767,350 A 148,92 0 0 0 1063,350" stroke=${AM} strokeWidth="3" strokeOpacity="0.12" fill="none" filter="url(#bloom-d03)" className="uv-draw-3" />
        <path d="M 767,350 A 148,92 0 0 0 1063,350" stroke=${AM} strokeWidth="1.6" strokeOpacity="0.75" fill="none" className="uv-draw-3" />
        <path d="M 767,350 A 148,92 0 0 1 1063,350" stroke=${AM} strokeWidth="0.9" strokeOpacity="0.24" fill="none" className="uv-draw-3-conj" />
      </g>

      <text x="915" y="668" textAnchor="middle" fill=${AM}  fontSize="14">One baseline → one elliptical arc</text>
      <text x="915" y="686" textAnchor="middle" fill=${DIM} fontSize="12">28 baselines × 12h → 11,000+ UV samples per night</text>
    </svg>
  `;
}

// ── d04: The Event Horizon Telescope ─────────────────────────────────────────
function d04() {
  const proj = (lon, lat) => ({
    x: Math.round(40 + (lon + 180) / 360 * 1120),
    y: Math.round(Math.min(60 + (80 - lat) / 150 * 520, 575)),
  });

  const stations = [
    { ...proj(-67.755, -23.029),           name: 'ALMA', isAlma: true },
    { ...proj(-67.759, -23.006), dx:5,dy:-4, name: 'APEX', isAlma: true },
    { ...proj(-155.478, 19.823),           name: 'SMA',  isAlma: false },
    { ...proj(-155.472, 19.824), dx:5,dy:-5, name: 'JCMT', isAlma: false },
    { ...proj(-97.314,  18.986),           name: 'LMT',  isAlma: false },
    { ...proj(-3.392,   37.066),           name: 'IRAM', isAlma: false },
    { ...proj(-109.891, 32.701),           name: 'SMT',  isAlma: false },
    { ...proj(-44.65,  -89.991),           name: 'SPT',  isAlma: false },
    { ...proj(-68.703,  76.535),           name: 'GLT',  isAlma: false },
  ].map(s => ({ ...s, x: s.x + (s.dx || 0), y: s.y + (s.dy || 0) }));

  const baselines = [];
  for (let i = 0; i < stations.length; i++) {
    for (let j = i + 1; j < stations.length; j++) {
      baselines.push({
        x1: stations[i].x, y1: stations[i].y,
        x2: stations[j].x, y2: stations[j].y,
        isAlma: stations[i].isAlma || stations[j].isAlma,
      });
    }
  }

  const latLines = [-60, -30, 0, 30, 60].map(lat => ({
    y: Math.round(60 + (80 - lat) / 150 * 520),
    isEquator: lat === 0,
  }));
  const lonLines = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map(lon => ({
    x: Math.round(40 + (lon + 180) / 360 * 1120),
  }));

  const alma = stations[0];

  return html`
    <svg viewBox="0 0 1200 700" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="bloom-d04" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="softglow-d04" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <rect width="1200" height="700" fill=${BG} />

      <!-- Map background -->
      <rect x="40" y="60" width="1120" height="520" fill=${DRK} rx="4" />

      <!-- Continent outlines (equirectangular, dark navy fill) -->
      <path d="M 95,68 L 185,45 L 248,58 L 285,95 L 295,145 L 268,195 L 238,225 L 212,248 L 188,272 L 165,285 L 142,268 L 118,235 L 96,198 L 78,162 L 72,125 L 80,90 Z" fill="#0d1a30" stroke="#1a2a4a" strokeWidth="1" />
      <path d="M 188,272 L 218,255 L 248,278 L 278,308 L 292,355 L 298,415 L 285,468 L 262,510 L 238,528 L 212,515 L 195,478 L 182,428 L 178,375 L 182,318 Z" fill="#0d1a30" stroke="#1a2a4a" strokeWidth="1" />
      <path d="M 488,68 L 545,55 L 578,68 L 592,88 L 575,108 L 548,118 L 522,128 L 505,115 L 492,95 Z" fill="#0d1a30" stroke="#1a2a4a" strokeWidth="1" />
      <path d="M 492,95 L 548,118 L 582,145 L 605,185 L 618,245 L 612,308 L 592,365 L 562,408 L 528,428 L 495,415 L 468,378 L 452,328 L 448,268 L 455,215 L 468,168 L 478,128 Z" fill="#0d1a30" stroke="#1a2a4a" strokeWidth="1" />
      <path d="M 578,68 L 688,42 L 798,38 L 885,52 L 945,72 L 978,105 L 962,138 L 915,155 L 868,162 L 815,148 L 762,145 L 715,132 L 672,118 L 625,108 L 592,88 Z" fill="#0d1a30" stroke="#1a2a4a" strokeWidth="1" />
      <path d="M 878,345 L 945,332 L 995,355 L 1012,398 L 1005,445 L 972,468 L 928,472 L 892,448 L 872,408 L 868,368 Z" fill="#0d1a30" stroke="#1a2a4a" strokeWidth="1" />
      <rect x="40" y="630" width="1120" height="20" fill="#0a1525" fillOpacity="0.6" />

      <!-- Lat grid -->
      ${latLines.map((l, i) => html`
        <line key=${'lat'+i} x1="40" y1=${l.y} x2="1160" y2=${l.y}
          stroke=${l.isEquator ? '#1c1c3a' : '#12122a'}
          strokeWidth=${l.isEquator ? 1 : 0.5}
          strokeOpacity=${l.isEquator ? 0.9 : 0.6} />
      `)}

      <!-- Lon grid -->
      ${lonLines.map((l, i) => html`
        <line key=${'lon'+i} x1=${l.x} y1="60" x2=${l.x} y2="580"
          stroke="#12122a" strokeWidth="0.5" strokeOpacity="0.5" />
      `)}

      <!-- Non-ALMA baselines (subtle, appear after ALMA) -->
      ${baselines.filter(b => !b.isAlma).map((b, i) => html`
        <line key=${'obl'+i}
          x1=${b.x1} y1=${b.y1} x2=${b.x2} y2=${b.y2}
          className="other-baseline"
          stroke=${BLUE} strokeWidth="0.6" strokeOpacity="0.15" />
      `)}

      <!-- ALMA baselines — glow + animated flow -->
      ${baselines.filter(b => b.isAlma).map((b, i) => html`
        <line key=${'agl'+i}
          x1=${b.x1} y1=${b.y1} x2=${b.x2} y2=${b.y2}
          className="alma-baseline"
          stroke=${AM} strokeWidth="3" strokeOpacity="0.2"
          filter="url(#softglow-d04)" />
      `)}
      ${baselines.filter(b => b.isAlma).map((b, i) => html`
        <line key=${'abl'+i}
          x1=${b.x1} y1=${b.y1} x2=${b.x2} y2=${b.y2}
          className="alma-baseline baseline-flow"
          stroke=${AM} strokeWidth="1.5" strokeOpacity="0.7" />
      `)}

      <!-- Station bloom auras -->
      ${stations.map((s, i) => html`
        <circle key=${'aura'+i}
          cx=${s.x} cy=${s.y} r="18"
          fill=${AM} fillOpacity="0.15"
          filter="url(#softglow-d04)"
          className=${'station-dot-'+(i+1)} />
      `)}

      <!-- Station dots -->
      ${stations.map((s, i) => html`
        <circle key=${'dot'+i}
          cx=${s.x} cy=${s.y} r=${s.isAlma ? 10 : 7}
          fill=${s.isAlma ? GOLD : TEAL}
          filter="url(#bloom-d04)"
          className=${'station-dot-'+(i+1)} />
      `)}

      <!-- Station labels -->
      ${stations.map((s, i) => html`
        <text key=${'lbl'+i}
          x=${s.x + (s.isAlma ? 0 : 12)} y=${s.y - 16}
          textAnchor=${s.isAlma ? 'middle' : 'start'}
          fill=${s.isAlma ? GOLD : TX}
          fontSize=${s.isAlma ? 13 : 11}
          fontWeight=${s.isAlma ? '700' : '400'}
          className=${'station-label-'+(i+1)}
        >${s.name}</text>
      `)}

      <!-- ALMA callout -->
      <rect x="15" y=${alma.y - 12} width="155" height="38" fill="rgba(196,165,85,0.08)" stroke=${AM} strokeWidth="0.8" rx="4" className="alma-baseline" />
      <text x="25" y=${alma.y + 5}  fill=${AM}  fontSize="10" className="alma-baseline">SEFD: 94 Jy</text>
      <text x="25" y=${alma.y + 20} fill=${DIM} fontSize="9"  fontStyle="italic" className="alma-baseline">Most sensitive</text>

      <!-- Map border -->
      <rect x="40" y="60" width="1120" height="520" fill="none" stroke="#2a2200" strokeWidth="1.5" rx="4" />

      <!-- UV inset (bottom-right, appears last) -->
      <g className="uv-inset">
        <rect x="850" y="490" width="330" height="190" fill=${DRK} stroke=${AM} strokeWidth="1" rx="6" />
        <text x="1015" y="514" textAnchor="middle" fill=${AM} fontSize="13" fontWeight="600">UV Coverage</text>
        <path d="M 895,600 A 120,72 0 0 0 1135,600" stroke=${AM} strokeWidth="1.8" fill="none" strokeOpacity="0.8" />
        <path d="M 895,600 A 120,72 0 0 1 1135,600" stroke=${AM} strokeWidth="1"   fill="none" strokeOpacity="0.3" />
        <g transform="rotate(28, 1015, 600)">
          <path d="M 930,600 A 85,52 0 0 0 1100,600" stroke=${AM} strokeWidth="1.4" fill="none" strokeOpacity="0.6" />
          <path d="M 930,600 A 85,52 0 0 1 1100,600" stroke=${AM} strokeWidth="0.8" fill="none" strokeOpacity="0.25" />
        </g>
        <g transform="rotate(-22, 1015, 600)">
          <path d="M 960,600 A 55,34 0 0 0 1070,600" stroke=${AM} strokeWidth="1"   fill="none" strokeOpacity="0.45" />
          <path d="M 960,600 A 55,34 0 0 1 1070,600" stroke=${AM} strokeWidth="0.6" fill="none" strokeOpacity="0.2" />
        </g>
      </g>

      <!-- Footer -->
      <text x="600" y="650" textAnchor="middle" fill=${DIM} fontSize="14">Max baseline: 10,900 km  ·  θ_synth ≈ 20 μas  ·  28 baselines</text>
    </svg>
  `;
}

// ── d05: From Noise to Image (sidelobe → photon ring transformation) ──────────
function d05() {
  const cx = 600, cy = 320;
  return html`
    <svg viewBox="0 0 1200 700" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="bloom-d05" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="hardblur-d05" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="22" />
        </filter>
      </defs>

      <rect width="1200" height="700" fill=${BG} />

      <!-- Sparse star field -->
      ${STARS.filter((_, i) => i < 80).map((s, i) => html`<circle key=${'s'+i} cx=${s.x} cy=${s.y} r=${s.r} fill=${TX} fillOpacity=${s.op * 0.6} />`)}

      <!-- Sidelobe rings (3 rings, start visible, fade in sequence) -->
      <circle cx=${cx} cy=${cy} r="285" fill="none" stroke="#4a4a70" strokeWidth="0.7" strokeOpacity="0.6" className="sl-ring-3" />
      <circle cx=${cx} cy=${cy} r="285" fill="none" stroke="#4a4a70" strokeWidth="4"   strokeOpacity="0.2" filter="url(#bloom-d05)" className="sl-ring-3" />
      <circle cx=${cx} cy=${cy} r="225" fill="none" stroke="#5a5a88" strokeWidth="1"   strokeOpacity="0.65" className="sl-ring-2" />
      <circle cx=${cx} cy=${cy} r="225" fill="none" stroke="#5a5a88" strokeWidth="5"   strokeOpacity="0.18" filter="url(#bloom-d05)" className="sl-ring-2" />
      <circle cx=${cx} cy=${cy} r="165" fill="none" stroke="#7070a0" strokeWidth="1.4" strokeOpacity="0.7" className="sl-ring-1" />
      <circle cx=${cx} cy=${cy} r="165" fill="none" stroke="#7070a0" strokeWidth="6"   strokeOpacity="0.15" filter="url(#bloom-d05)" className="sl-ring-1" />

      <!-- Artifact blobs (fade with sidelobes) -->
      <circle cx="420" cy="220" r="18" fill=${GLOW} fillOpacity="0.12" filter="url(#hardblur-d05)" className="sl-ring-2" />
      <circle cx="780" cy="420" r="14" fill=${GLOW} fillOpacity="0.10" filter="url(#hardblur-d05)" className="sl-ring-3" />
      <circle cx="390" cy="430" r="12" fill=${GLOW} fillOpacity="0.08" filter="url(#hardblur-d05)" className="sl-ring-2" />

      <!-- Sidelobe annotation (fades with rings) -->
      <text x="840" y="185" fill=${DIM} fontSize="13" fontStyle="italic" className="sl-ring-2">sidelobe artifacts</text>
      <line x1="830" y1="192" x2="778" y2="230" stroke=${DIM} strokeWidth="0.8" className="sl-ring-2" />

      <!-- Accretion disk glow (emerges as sidelobes fade) — new class name -->
      <circle cx=${cx} cy=${cy} r="118" fill="none" stroke="rgba(255,110,0,0.06)"  strokeWidth="28" className="photon-ring" />
      <circle cx=${cx} cy=${cy} r="108" fill="none" stroke="rgba(255,145,0,0.10)"  strokeWidth="18" className="photon-ring" />
      <circle cx=${cx} cy=${cy} r="99"  fill="none" stroke="rgba(255,182,30,0.16)" strokeWidth="11" className="photon-ring" />
      <circle cx=${cx} cy=${cy} r="91"  fill="none" stroke="rgba(255,208,40,0.22)" strokeWidth="6"  className="photon-ring" />

      <!-- Photon ring core -->
      <circle cx=${cx} cy=${cy} r="83" fill="none" stroke=${GOLD} strokeWidth="4.5" filter="url(#bloom-d05)" className="photon-ring" />
      <circle cx=${cx} cy=${cy} r="79" fill="none" stroke=${GOLD} strokeWidth="1"   strokeOpacity="0.35" className="photon-ring" />

      <!-- Shadow interior (event horizon) — new class name -->
      <circle cx=${cx} cy=${cy} r="71" fill="#040408" className="bh-shadow" />
      <circle cx=${cx} cy=${cy} r="60" fill="#020204" className="bh-shadow" />

      <!-- Label: Dirty Image → CLEAN Image (new class names) -->
      <text x="600" y="570" textAnchor="middle" fill=${RED}  fontSize="22" fontWeight="600" className="lbl-dirty">Dirty Image</text>
      <text x="600" y="570" textAnchor="middle" fill=${TEAL} fontSize="22" fontWeight="600" className="lbl-clean">CLEAN Image</text>

      <!-- CLEAN equation (appears with clean label) -->
      <text x="600" y="618" textAnchor="middle" fill=${GOLD} fontSize="18" fontFamily="'Courier New', monospace" className="lbl-clean">I^C = (M ⊛ G) + r_final</text>
      <text x="600" y="644" textAnchor="middle" fill=${DIM}  fontSize="12" className="lbl-clean">model convolved with restore beam, plus residuals</text>
    </svg>
  `;
}

// ── d06: First Light (real EHT image) ────────────────────────────────────────
function d06() {
  return html`
    <svg viewBox="0 0 1200 700" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="bloom-d06" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="vig-d06" cx="35%" cy="50%" r="55%">
          <stop offset="50%" stopColor="transparent" />
          <stop offset="100%" stopColor=${BG} stopOpacity="0.88" />
        </radialGradient>
      </defs>

      <rect width="1200" height="700" fill=${BG} />

      <!-- Real EHT M87* image, large centered-left -->
      <image
        href="../assets/eht-m87-2019.jpg"
        x="20" y="15"
        width="840" height="670"
        preserveAspectRatio="xMidYMid meet"
        className="eht-image-reveal"
      />

      <!-- Dramatic vignette -->
      <rect width="1200" height="700" fill="url(#vig-d06)" />

      <!-- Scale bar -->
      <line x1="48" y1="648" x2="168" y2="648" stroke=${AM} strokeWidth="2" />
      <line x1="48" y1="642" x2="48"  y2="654" stroke=${AM} strokeWidth="2" />
      <line x1="168" y1="642" x2="168" y2="654" stroke=${AM} strokeWidth="2" />
      <text x="108" y="668" textAnchor="middle" fill=${AM} fontSize="14">42 μas</text>

      <!-- Title watermark -->
      <text x="60" y="52" fill=${GOLD} fontSize="18" fontWeight="700" filter="url(#bloom-d06)">M87*  ·  April 10, 2019</text>

      <!-- Citation -->
      <text x="600" y="688" textAnchor="middle" fill=${DIM} fontSize="13" fontStyle="italic">EHT Collaboration 2019  ·  ApJL 875, L1</text>
    </svg>
  `;
}

// ── d07: Beyond Earth — BHEX ─────────────────────────────────────────────────
function d07() {
  // Larger star field with 3 depth layers (280 stars) using STARS array + extra pass
  const stars280 = Array.from({ length: 280 }, (_, i) => ({
    x: Math.min((i % 20) * 62 + ((i * 47) % 31), 1195),
    y: Math.min(Math.floor(i / 20) * 26 + ((i * 23) % 19), 695),
    layer: i < 120 ? 0 : i < 220 ? 1 : 2,
  }));

  return html`
    <svg viewBox="0 0 1200 700" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="bloom-d07" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="softglow-d07" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="starblur-d07" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" />
        </filter>
        <radialGradient id="earthGrad-d07" cx="38%" cy="32%" r="60%">
          <stop offset="0%"   stopColor="#1e4a90" />
          <stop offset="40%"  stopColor="#0d1f3d" />
          <stop offset="100%" stopColor="#030810" />
        </radialGradient>
        <radialGradient id="nightSide-d07" cx="78%" cy="50%" r="60%">
          <stop offset="0%"   stopColor="#000000" stopOpacity="0.7" />
          <stop offset="55%"  stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1200" height="700" fill=${BG} />

      <!-- Background stars (blurred) -->
      <g filter="url(#starblur-d07)">
        ${stars280.filter(s => s.layer === 0).map((s, i) => html`<circle key=${'sb'+i} cx=${s.x} cy=${s.y} r="0.6" fill=${TX} fillOpacity="0.3" />`)}
      </g>
      <!-- Mid-field stars -->
      ${stars280.filter(s => s.layer === 1).map((s, i) => html`<circle key=${'sm'+i} cx=${s.x} cy=${s.y} r="1.0" fill=${TX} fillOpacity="0.5" />`)}
      <!-- Foreground stars -->
      ${stars280.filter(s => s.layer === 2).map((s, i) => html`<circle key=${'sf'+i} cx=${s.x} cy=${s.y} r="1.5" fill=${TX} fillOpacity="0.8" />`)}

      <!-- Earth atmosphere (cx=450 cy=380 r=140) -->
      <circle cx="450" cy="380" r="192" fill="none" stroke=${TEAL} strokeWidth="36" strokeOpacity="0.05" filter="url(#softglow-d07)" />
      <circle cx="450" cy="380" r="178" fill="none" stroke=${TEAL} strokeWidth="18" strokeOpacity="0.10" filter="url(#bloom-d07)" />
      <circle cx="450" cy="380" r="165" fill="none" stroke=${TEAL} strokeWidth="8"  strokeOpacity="0.18" />
      <circle cx="450" cy="380" r="140" fill="url(#earthGrad-d07)" />
      <circle cx="450" cy="380" r="140" fill="url(#nightSide-d07)" />

      <!-- Ground stations -->
      <circle cx="395" cy="405" r="7" fill=${AM}   filter="url(#bloom-d07)" />
      <text x="370" y="425" fill=${AM}   fontSize="10" fontWeight="700">ALMA</text>
      <circle cx="468" cy="345" r="5" fill=${BLUE}  filter="url(#bloom-d07)" />
      <text x="476" y="340" fill=${DIM}  fontSize="10">IRAM</text>
      <circle cx="452" cy="518" r="5" fill=${BLUE}  filter="url(#bloom-d07)" />
      <text x="460" y="533" fill=${DIM}  fontSize="10">SPT</text>

      <!-- BHEX orbit (inclined, large) -->
      <ellipse cx="450" cy="380" rx="500" ry="200" fill="none" stroke=${AM} strokeWidth="6" strokeOpacity="0.15" transform="rotate(-22, 450, 380)" filter="url(#softglow-d07)" />
      <ellipse cx="450" cy="380" rx="500" ry="200" fill="none" stroke=${AM} strokeWidth="1.2" strokeOpacity="0.6" transform="rotate(-22, 450, 380)" />

      <!-- BHEX satellite (at ascending node ~920,220) -->
      <circle cx="920" cy="220" r="18" fill=${GLOW} fillOpacity="0.4" filter="url(#softglow-d07)" />
      <circle cx="920" cy="220" r="9"  fill=${GLOW} stroke=${GOLD} strokeWidth="2" filter="url(#bloom-d07)" />
      <!-- Solar panels -->
      <rect x="897" y="217" width="8"  height="6" rx="1" fill=${GLOW} fillOpacity="0.7" />
      <rect x="934" y="217" width="8"  height="6" rx="1" fill=${GLOW} fillOpacity="0.7" />
      <rect x="905" y="210" width="30" height="4" rx="1" fill=${GLOW} fillOpacity="0.4" />
      <text x="938" y="214" fill=${GLOW} fontSize="14" fontWeight="700" filter="url(#bloom-d07)">BHEX</text>

      <!-- Data beam: ALMA → BHEX (glow + pulsing core) -->
      <line x1="395" y1="405" x2="920" y2="220" stroke=${GOLD} strokeWidth="6" strokeOpacity="0.12" filter="url(#softglow-d07)" />
      <line x1="395" y1="405" x2="920" y2="220" stroke=${GOLD} strokeWidth="1.5" strokeOpacity="0.8" className="data-beam" />

      <!-- Baseline annotation -->
      <text x="658" y="300" textAnchor="middle" fill=${AM} fontSize="15" filter="url(#bloom-d07)">~32,900 km</text>
      <text x="658" y="320" textAnchor="middle" fill=${DIM} fontSize="12">~33 Gλ at 300 GHz</text>

      <!-- Left panel: EHT Ground -->
      <rect x="15" y="25" width="260" height="165" fill=${DRK} stroke="#2d2200" strokeWidth="1" rx="6" />
      <text x="145" y="50" textAnchor="middle" fill=${TX}   fontSize="14" fontWeight="700">EHT Ground</text>
      <rect x="30" y="65" width="120" height="20" fill=${BLUE} fillOpacity="0.7" rx="3" />
      <text x="158" y="80" fill=${TEAL} fontSize="12">~20 μas beam</text>
      <rect x="30" y="95" width="220" height="20" fill=${AM} fillOpacity="0.5" rx="3" />
      <text x="258" y="110" textAnchor="end" fill=${AM} fontSize="12">42 μas shadow</text>
      <text x="145" y="140" textAnchor="middle" fill=${DIM} fontSize="11" fontStyle="italic">resolves shadow</text>
      <text x="145" y="160" textAnchor="middle" fill=${RED} fontSize="11" fontStyle="italic">cannot resolve ring</text>

      <!-- Right panel: BHEX -->
      <rect x="925" y="25" width="260" height="165" fill=${DRK} stroke=${AM} strokeWidth="1" rx="6" />
      <text x="1055" y="50" textAnchor="middle" fill=${GLOW} fontSize="14" fontWeight="700" filter="url(#bloom-d07)">EHT + BHEX</text>
      <rect x="940" y="65" width="36" height="20" fill=${GLOW} fillOpacity="0.8" rx="3" filter="url(#bloom-d07)" />
      <text x="984" y="80" fill=${GLOW} fontSize="12">~6 μas beam</text>
      <rect x="940" y="95" width="220" height="20" fill=${AM} fillOpacity="0.5" rx="3" />
      <text x="1168" y="110" textAnchor="end" fill=${AM} fontSize="12">42 μas shadow</text>
      <text x="1055" y="140" textAnchor="middle" fill=${DIM}  fontSize="11" fontStyle="italic">resolves shadow</text>
      <text x="1055" y="160" textAnchor="middle" fill=${TEAL} fontSize="11" fontStyle="italic" filter="url(#bloom-d07)">resolves photon ring</text>
    </svg>
  `;
}

// ── d08: The Simulator (product showcase) ────────────────────────────────────
function d08() {
  const lCx = 290, lCy = 310;
  const rCx = 910, rCy = 310;

  return html`
    <svg viewBox="0 0 1200 700" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="bloom-d08" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="softglow-d08" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <rect width="1200" height="700" fill=${BG} />

      <!-- Sparse background stars -->
      ${STARS.filter((_, i) => i % 3 === 0).map((s, i) => html`<circle key=${'s'+i} cx=${s.x} cy=${s.y} r=${s.r * 0.7} fill=${TX} fillOpacity=${s.op * 0.4} />`)}

      <!-- ── LEFT panel: EHT 2017 ── -->
      <rect x="30" y="60" width="520" height="500" fill=${DRK} stroke="#2d2200" strokeWidth="1.5" rx="8" className="panel-left" />
      <text x="290" y="44" textAnchor="middle" fill=${DIM} fontSize="16" fontWeight="700" className="panel-left">EHT 2017</text>
      <text x="290" y="60" textAnchor="middle" fill="#555585" fontSize="12" className="panel-left">8 stations · 28 baselines</text>

      <!-- Map bg -->
      <rect x="50" y="130" width="480" height="340" fill="#050818" rx="4" className="panel-left" />

      <!-- Ring structure (EHT quality) -->
      <circle cx=${lCx} cy=${lCy} r="90" fill="none" stroke="rgba(255,120,0,0.06)" strokeWidth="20" className="panel-left" />
      <circle cx=${lCx} cy=${lCy} r="82" fill="none" stroke="rgba(255,160,0,0.10)" strokeWidth="14" className="panel-left" />
      <circle cx=${lCx} cy=${lCy} r="75" fill="none" stroke="rgba(255,195,30,0.16)" strokeWidth="8" className="panel-left" />
      <circle cx=${lCx} cy=${lCy} r="68" fill="none" stroke=${GOLD} strokeWidth="3.5" filter="url(#bloom-d08)" className="panel-left" />
      <circle cx=${lCx} cy=${lCy} r="58" fill="#020510" className="panel-left" />

      <!-- Contour levels -->
      <circle cx=${lCx} cy=${lCy} r="90"  fill="none" stroke=${GOLD} strokeWidth="1.5" strokeOpacity="0.7" className="panel-left" />
      <circle cx=${lCx} cy=${lCy} r="115" fill="none" stroke=${AM}   strokeWidth="1"   strokeOpacity="0.45" className="panel-left" />

      <!-- Beam ellipse -->
      <ellipse cx="488" cy="448" rx="22" ry="16" transform="rotate(15, 488, 448)" stroke=${TEAL} strokeWidth="1.5" fill="rgba(78,205,196,0.1)" className="panel-left" />

      <!-- Left stats -->
      <text x="290" y="505" textAnchor="middle" fill=${DIM} fontSize="12" className="panel-left">DR ≈ 50:1  ·  beam FWHM ~24 μas  ·  UV fill 0.8%</text>

      <!-- ── RIGHT panel: ngEHT Phase 1 ── -->
      <rect x="650" y="60" width="520" height="500" fill=${DRK} stroke=${AM} strokeWidth="1.5" rx="8" filter="url(#bloom-d08)" className="panel-right" />
      <text x="910" y="44" textAnchor="middle" fill=${AM}  fontSize="16" fontWeight="700" filter="url(#bloom-d08)" className="panel-right">ngEHT Phase 1</text>
      <text x="910" y="60" textAnchor="middle" fill="#9E7E38" fontSize="12" className="panel-right">17 stations · 136 baselines</text>

      <!-- Map bg -->
      <rect x="670" y="130" width="480" height="340" fill="#050818" rx="4" className="panel-right" />

      <!-- Ring structure (ngEHT — sharper) -->
      <circle cx=${rCx} cy=${rCy} r="90" fill="none" stroke="rgba(255,120,0,0.08)" strokeWidth="20" className="panel-right" />
      <circle cx=${rCx} cy=${rCy} r="82" fill="none" stroke="rgba(255,160,0,0.14)" strokeWidth="14" className="panel-right" />
      <circle cx=${rCx} cy=${rCy} r="75" fill="none" stroke="rgba(255,200,40,0.22)" strokeWidth="8" className="panel-right" />
      <circle cx=${rCx} cy=${rCy} r="68" fill="none" stroke=${GOLD} strokeWidth="5" filter="url(#bloom-d08)" className="panel-right" />
      <circle cx=${rCx} cy=${rCy} r="65" fill="none" stroke=${GOLD} strokeWidth="1" strokeOpacity="0.3" className="panel-right" />
      <circle cx=${rCx} cy=${rCy} r="58" fill="#020510" className="panel-right" />

      <!-- Contour levels -->
      <circle cx=${rCx} cy=${rCy} r="90"  fill="none" stroke=${GOLD} strokeWidth="2"   strokeOpacity="0.9" className="panel-right" />
      <circle cx=${rCx} cy=${rCy} r="118" fill="none" stroke=${GOLD} strokeWidth="1.5" strokeOpacity="0.65" className="panel-right" />
      <circle cx=${rCx} cy=${rCy} r="145" fill="none" stroke=${AM}   strokeWidth="1"   strokeOpacity="0.4" className="panel-right" />

      <!-- Jet hint -->
      <line x1=${rCx} y1=${rCy - 24} x2=${rCx + 58} y2=${rCy - 78} stroke=${AM} strokeWidth="1.2" strokeOpacity="0.4" className="panel-right" />

      <!-- Beam ellipse (smaller) -->
      <ellipse cx="1108" cy="448" rx="15" ry="13" stroke=${TEAL} strokeWidth="1.5" fill="rgba(78,205,196,0.1)" className="panel-right" />

      <!-- Right stats -->
      <text x="910" y="505" textAnchor="middle" fill=${AM} fontSize="12" filter="url(#bloom-d08)" className="panel-right">DR ≈ 200:1  ·  beam FWHM ~18 μas  ·  UV fill 3.5%</text>

      <!-- FITS terminal (bottom-left, slides from left) -->
      <g className="fits-panel">
        <rect x="30" y="582" width="220" height="100" fill="#020208" stroke="#1a1a28" strokeWidth="0.8" rx="4" />
        <text x="42" y="602" fill=${TEAL} fontSize="9" fontFamily="'Courier New', monospace">CRVAL1 = 187.7059308</text>
        <text x="42" y="618" fill=${AM}   fontSize="9" fontFamily="'Courier New', monospace">BMAJ   = 5.56E-09</text>
        <text x="42" y="634" fill=${DIM}  fontSize="9" fontFamily="'Courier New', monospace">BUNIT  = 'JY/BEAM'</text>
        <text x="42" y="650" fill="#333355" fontSize="9" fontFamily="'Courier New', monospace">END</text>
      </g>

      <!-- Metrics panel (bottom-right, slides from right) -->
      <g className="metrics-panel-tour">
        <rect x="950" y="582" width="220" height="100" fill="#020208" stroke="#1a1a28" strokeWidth="0.8" rx="4" />
        <text x="962" y="602" fill=${DIM} fontSize="9">Beam FWHM</text>
        <text x="1162" y="602" textAnchor="end" fill=${AM} fontSize="9">~20 μas</text>
        <text x="962" y="618" fill=${DIM} fontSize="9">Dynamic Range</text>
        <text x="1162" y="618" textAnchor="end" fill=${AM} fontSize="9">~50:1</text>
        <text x="962" y="634" fill=${DIM} fontSize="9">UV Fill</text>
        <text x="1162" y="634" textAnchor="end" fill=${AM} fontSize="9">0.8%</text>
        <text x="962" y="650" fill=${DIM} fontSize="9">Max baseline</text>
        <text x="1162" y="650" textAnchor="end" fill=${AM} fontSize="9">10,900 km</text>
      </g>

      <!-- CTA — luminous, appears last -->
      <text x="600" y="664" textAnchor="middle" className="cta-reveal" fill=${GOLD} fontSize="36" fontWeight="900" filter="url(#bloom-d08)">Place your first telescope.</text>
    </svg>
  `;
}
