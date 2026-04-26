// TourDiagram.js — 8 SVG hero diagrams for the cinematic VLBI tour.
// All diagrams: viewBox="0 0 1200 700", background #010103.
// CSS animations are handled via className — see tour.css for keyframes.
// htm safety: NEVER use bare < or > in SVG text content.
import { html } from './core.js';

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
// Left: single dish, wide beam, unresolved source.
// Right: Earth-baseline array, narrow beam, resolved shadow.
function d01() {
  return html`
    <svg viewBox="0 0 1200 700" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="700" fill="#010103" />

      <!-- divider -->
      <line x1="600" y1="30" x2="600" y2="670" stroke="#1e1800" strokeWidth="1" />

      <!-- ─── LEFT: single dish ─── -->
      <!-- M87* source (unresolved — just a ring) -->
      <circle cx="300" cy="58" r="11" fill="none" stroke="#FFD700" strokeWidth="2" />
      <text x="300" y="40" textAnchor="middle" fill="#FFD700" fontSize="13" fontWeight="600">M87*</text>

      <!-- Wide beam cone (dashed) -->
      <line x1="300" y1="296" x2="148" y2="68" stroke="#8888b0" strokeWidth="1.5" strokeDasharray="8 4" strokeOpacity="0.7" />
      <line x1="300" y1="296" x2="452" y2="68" stroke="#8888b0" strokeWidth="1.5" strokeDasharray="8 4" strokeOpacity="0.7" />
      <!-- Beam arc showing angular width -->
      <path d="M 210,195 A 104,32 0 0 1 390,195" stroke="#8888b0" strokeWidth="1" fill="none" strokeOpacity="0.8" />
      <text x="300" y="238" textAnchor="middle" fill="#8888b0" fontSize="16">θ ≈ 2.7 arcsec</text>

      <!-- Dish parabola -->
      <path d="M 130,425 Q 300,295 470,425" stroke="#C4A555" strokeWidth="4" fill="none" />
      <!-- Stub -->
      <line x1="300" y1="295" x2="300" y2="425" stroke="#C4A555" strokeWidth="3" />
      <!-- Receiver -->
      <circle cx="300" cy="291" r="9" fill="#C4A555" />

      <!-- Labels -->
      <text x="300" y="504" textAnchor="middle" fill="#8888b0" fontSize="13">100 m dish</text>
      <text x="300" y="558" textAnchor="middle" fill="#ff6b6b" fontSize="15" fontWeight="700">70,000× too blurry</text>

      <!-- ─── RIGHT: Earth-baseline array ─── -->
      <!-- M87* source (resolved — solid gold dot) -->
      <circle cx="900" cy="48" r="6" fill="#FFD700" />
      <text x="900" y="32" textAnchor="middle" fill="#FFD700" fontSize="13" fontWeight="600">M87*</text>

      <!-- Narrow beam lines -->
      <line x1="900" y1="250" x2="893" y2="58" stroke="#C4A555" strokeWidth="1.5" strokeOpacity="0.9" />
      <line x1="900" y1="250" x2="907" y2="58" stroke="#C4A555" strokeWidth="1.5" strokeOpacity="0.9" />
      <text x="900" y="100" textAnchor="middle" fill="#4ecdc4" fontSize="19" fontWeight="700">θ ≈ 20 μas</text>

      <!-- Atmosphere glow -->
      <circle cx="900" cy="380" r="148" fill="none" stroke="rgba(78,205,196,0.12)" strokeWidth="14" />
      <!-- Earth -->
      <circle cx="900" cy="380" r="130" fill="rgba(12,25,75,0.65)" stroke="#4ecdc4" strokeWidth="2.5" />

      <!-- Station dots -->
      <circle cx="772" cy="380" r="9" fill="#C4A555" />
      <circle cx="1028" cy="380" r="9" fill="#C4A555" />
      <!-- Baseline dashed -->
      <line x1="781" y1="380" x2="1019" y2="380" stroke="#C4A555" strokeWidth="2" strokeDasharray="6 3" strokeOpacity="0.8" />
      <text x="900" y="430" textAnchor="middle" fill="#C4A555" fontSize="14">B ≈ 10,900 km</text>

      <!-- Result label -->
      <text x="900" y="558" textAnchor="middle" fill="#4ecdc4" fontSize="15" fontWeight="600">Resolves 42 μas shadow</text>

      <!-- Bottom equation -->
      <text x="600" y="640" textAnchor="middle" fill="#FFD700" fontSize="20" fontWeight="800">λ / D_Earth ≈ 20 μas</text>
    </svg>
  `;
}

// ── d02: The Baseline ─────────────────────────────────────────────────────────
// Two dishes, sweeping wavefront, geometric delay, UV plane inset.
function d02() {
  return html`
    <svg viewBox="0 0 1200 700" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="700" fill="#010103" />

      <!-- Radio source (top center) -->
      <circle cx="600" cy="52" r="14" fill="rgba(255,215,0,0.18)" stroke="#FFD700" strokeWidth="2" />
      <circle cx="600" cy="52" r="7" fill="#FFD700" />
      <text x="600" y="34" textAnchor="middle" fill="#FFD700" fontSize="13" fontWeight="600">Radio Source (M87*)</text>

      <!-- Static wavefront background lines (very dim) -->
      <line x1="60" y1="178" x2="1140" y2="178" stroke="#1a1a38" strokeWidth="0.8" />
      <line x1="60" y1="193" x2="1140" y2="193" stroke="#1a1a38" strokeWidth="0.8" />
      <line x1="60" y1="208" x2="1140" y2="208" stroke="#1a1a38" strokeWidth="0.8" />

      <!-- Animated wavefront -->
      <line className="wave-line-cinema" x1="60" y1="190" x2="1140" y2="190" stroke="#FFD700" strokeWidth="2.5" strokeOpacity="0.8" />

      <!-- ─── Telescope 1 (left) ─── -->
      <path d="M 90,530 Q 220,425 350,530" stroke="#C4A555" strokeWidth="5" fill="none" />
      <line x1="220" y1="425" x2="220" y2="530" stroke="#C4A555" strokeWidth="3" />
      <circle cx="220" cy="421" r="10" fill="#C4A555" />
      <text x="220" y="588" textAnchor="middle" fill="#f0f0f8" fontSize="16" fontWeight="600">Telescope 1</text>
      <text x="220" y="608" textAnchor="middle" fill="#8888b0" fontSize="13">ALMA · Chile</text>

      <!-- ─── Telescope 2 (right) ─── -->
      <path d="M 850,530 Q 980,425 1110,530" stroke="#C4A555" strokeWidth="5" fill="none" />
      <line x1="980" y1="425" x2="980" y2="530" stroke="#C4A555" strokeWidth="3" />
      <circle cx="980" cy="421" r="10" fill="#C4A555" />
      <text x="980" y="588" textAnchor="middle" fill="#f0f0f8" fontSize="16" fontWeight="600">Telescope 2</text>
      <text x="980" y="608" textAnchor="middle" fill="#8888b0" fontSize="13">JCMT · Hawaii</text>

      <!-- Geometric delay lines (vertical dashes) -->
      <line x1="220" y1="66" x2="220" y2="413" stroke="#ff9f43" strokeWidth="1.5" strokeDasharray="5 3" strokeOpacity="0.8" />
      <line x1="980" y1="66" x2="980" y2="413" stroke="#ff9f43" strokeWidth="1.5" strokeDasharray="5 3" strokeOpacity="0.8" />
      <text x="588" y="315" textAnchor="middle" fill="#ff9f43" fontSize="26" fontWeight="700">τ_g</text>
      <text x="600" y="345" textAnchor="middle" fill="#ff9f43" fontSize="18">= B·ŝ/c</text>

      <!-- Baseline measurement bar -->
      <line x1="226" y1="650" x2="974" y2="650" stroke="#C4A555" strokeWidth="2" />
      <line x1="226" y1="643" x2="226" y2="657" stroke="#C4A555" strokeWidth="2" />
      <line x1="974" y1="643" x2="974" y2="657" stroke="#C4A555" strokeWidth="2" />
      <text x="600" y="672" textAnchor="middle" fill="#C4A555" fontSize="14">Baseline B = 10,900 km  →  u = B/λ = 8.4 Gλ</text>

      <!-- UV plane inset (top right) -->
      <rect x="938" y="36" width="244" height="204" fill="rgba(6,8,22,0.96)" stroke="#2d2200" strokeWidth="1.5" rx="6" />
      <text x="1060" y="60" textAnchor="middle" fill="#C4A555" fontSize="13" fontWeight="600">UV plane</text>
      <!-- Grid lines in UV inset -->
      <line x1="944" y1="138" x2="1176" y2="138" stroke="#111130" strokeWidth="0.7" />
      <line x1="1060" y1="42" x2="1060" y2="234" stroke="#111130" strokeWidth="0.7" />
      <!-- UV points (conjugate pair) -->
      <circle cx="1098" cy="106" r="5" fill="#C4A555" />
      <text x="1110" y="110" fill="#f0f0f8" fontSize="11">(u,v)</text>
      <circle cx="1022" cy="170" r="5" fill="#C4A555" fillOpacity="0.35" />
      <text x="966" y="174" fill="#8888b0" fontSize="11">(-u,-v)</text>
      <text x="1060" y="230" textAnchor="middle" fill="#8888b0" fontSize="11">conjugate symmetry</text>
    </svg>
  `;
}

// ── d03: Earth Rotation Synthesis ────────────────────────────────────────────
// Earth rotating (left) + UV arcs drawing via stroke-dashoffset (right).
function d03() {
  return html`
    <svg viewBox="0 0 1200 700" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="700" fill="#010103" />

      <!-- ─── LEFT: Rotating Earth ─── -->
      <!-- Atmosphere glow -->
      <circle cx="330" cy="370" r="192" fill="none" stroke="rgba(78,205,196,0.1)" strokeWidth="18" />
      <!-- Earth -->
      <circle cx="330" cy="370" r="172" fill="rgba(10,20,65,0.72)" stroke="#4ecdc4" strokeWidth="2.5" />

      <!-- Rotating group: telescope dots + baseline line -->
      <g className="earth-group-cinema">
        <line x1="330" y1="200" x2="330" y2="540" stroke="#C4A555" strokeWidth="2" strokeDasharray="7 4" strokeOpacity="0.7" />
        <circle cx="330" cy="200" r="10" fill="#C4A555" />
        <circle cx="330" cy="540" r="10" fill="#C4A555" />
      </g>

      <!-- Hour angle labels -->
      <text x="138" y="618" fill="#8888b0" fontSize="14">H = −6h</text>
      <text x="440" y="638" fill="#8888b0" fontSize="14">→ +6h</text>
      <text x="330" y="598" textAnchor="middle" fill="#4ecdc4" fontSize="14">12h observation</text>
      <text x="330" y="78" textAnchor="middle" fill="#f0f0f8" fontSize="17" fontWeight="700">Earth Rotation</text>

      <!-- ─── RIGHT: UV plane ─── -->
      <rect x="720" y="60" width="440" height="520" fill="rgba(4,5,16,0.97)" stroke="#1e1800" strokeWidth="1.5" rx="6" />

      <!-- UV axes -->
      <line x1="726" y1="320" x2="1154" y2="320" stroke="#1e1e40" strokeWidth="1" />
      <line x1="940" y1="66" x2="940" y2="574" stroke="#1e1e40" strokeWidth="1" />
      <text x="1148" y="338" fill="#8888b0" fontSize="13">u</text>
      <text x="948" y="82" fill="#8888b0" fontSize="13">v</text>
      <text x="940" y="42" textAnchor="middle" fill="#C4A555" fontSize="14" fontWeight="600">UV Plane</text>

      <!-- UV arc 1 (largest, angle 0°) — upper + conjugate -->
      <path className="uv-draw-1" d="M 726,320 A 214,136 0 0 0 1154,320" stroke="#C4A555" strokeWidth="2.5" fill="none" />
      <path className="uv-draw-1-conj" d="M 726,320 A 214,136 0 0 1 1154,320" stroke="#C4A555" strokeWidth="2.5" fill="none" strokeOpacity="0.35" />

      <!-- UV arc 2 (medium, rotated 30°) -->
      <g transform="rotate(30, 940, 320)">
        <path className="uv-draw-2" d="M 770,320 A 170,108 0 0 0 1110,320" stroke="#C4A555" strokeWidth="2" fill="none" />
        <path className="uv-draw-2-conj" d="M 770,320 A 170,108 0 0 1 1110,320" stroke="#C4A555" strokeWidth="1.5" fill="none" strokeOpacity="0.3" />
      </g>

      <!-- UV arc 3 (smaller, rotated -25°) -->
      <g transform="rotate(-25, 940, 320)">
        <path className="uv-draw-3" d="M 800,320 A 140,88 0 0 0 1080,320" stroke="#C4A555" strokeWidth="1.8" fill="none" />
        <path className="uv-draw-3-conj" d="M 800,320 A 140,88 0 0 1 1080,320" stroke="#C4A555" strokeWidth="1.4" fill="none" strokeOpacity="0.28" />
      </g>

      <!-- UV panel labels -->
      <text x="940" y="605" textAnchor="middle" fill="#C4A555" fontSize="14">One baseline → one elliptical arc</text>
      <text x="940" y="628" textAnchor="middle" fill="#8888b0" fontSize="12">28 baselines × 12 hours → 11,000+ UV samples</text>

      <!-- Arrow linking left to right -->
      <text x="600" y="340" textAnchor="middle" fill="#555570" fontSize="28">→</text>
    </svg>
  `;
}

// ── d04: The Event Horizon Telescope (world map + station reveal) ─────────────
function d04() {
  // Equirectangular projection: x = 40 + (lon+180)/360*1120, y = 60 + (80-lat)/150*520
  const proj = (lon, lat) => ({
    x: Math.round(40 + (lon + 180) / 360 * 1120),
    y: Math.round(Math.min(60 + (80 - lat) / 150 * 520, 575)),
  });

  const stations = [
    { ...proj(-67.755, -23.029), name: 'ALMA', isAlma: true },
    { ...proj(-67.759, -23.006), dx: 4, dy: -3, name: 'APEX', isAlma: true },
    { ...proj(-155.478, 19.823), name: 'SMA', isAlma: false },
    { ...proj(-155.472, 19.824), dx: 5, dy: -5, name: 'JCMT', isAlma: false },
    { ...proj(-97.314, 18.986), name: 'LMT', isAlma: false },
    { ...proj(-3.392, 37.066), name: 'IRAM', isAlma: false },
    { ...proj(-109.891, 32.701), name: 'SMT', isAlma: false },
    { ...proj(-44.65, -89.991), name: 'SPT', isAlma: false },
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

  return html`
    <svg viewBox="0 0 1200 700" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="700" fill="#010103" />

      <!-- Map background -->
      <rect x="40" y="60" width="1120" height="520" fill="rgba(4,6,20,0.9)" rx="4" />

      <!-- Grid lines (lat) -->
      ${latLines.map((l, i) => html`
        <line key=${'lat'+i} x1="40" y1=${l.y} x2="1160" y2=${l.y}
          stroke=${l.isEquator ? '#1c1c3a' : '#12122a'}
          strokeWidth=${l.isEquator ? 1 : 0.5}
          strokeOpacity=${l.isEquator ? 0.9 : 0.6} />
      `)}

      <!-- Grid lines (lon) -->
      ${lonLines.map((l, i) => html`
        <line key=${'lon'+i} x1=${l.x} y1="60" x2=${l.x} y2="580"
          stroke="#12122a" strokeWidth="0.5" strokeOpacity="0.5" />
      `)}

      <!-- Baselines (appear after stations) -->
      ${baselines.map((b, i) => html`
        <line key=${'bl'+i}
          x1=${b.x1} y1=${b.y1} x2=${b.x2} y2=${b.y2}
          className=${b.isAlma ? 'alma-baseline' : 'other-baseline'}
          stroke=${b.isAlma ? '#C4A555' : '#3366aa'}
          strokeWidth=${b.isAlma ? 1.4 : 0.7}
          strokeOpacity=${b.isAlma ? 0.55 : 0.2} />
      `)}

      <!-- Station dots (sequential reveal) -->
      ${stations.map((s, i) => html`
        <circle key=${'dot'+i}
          cx=${s.x} cy=${s.y} r=${s.isAlma ? 11 : 8}
          fill=${s.isAlma ? '#C4A555' : '#4ecdc4'}
          className=${'station-dot-'+(i+1)} />
      `)}

      <!-- Station labels (sequential reveal) -->
      ${stations.map((s, i) => html`
        <text key=${'lbl'+i}
          x=${s.x + (s.isAlma ? 0 : 12)} y=${s.y - 14}
          textAnchor=${s.isAlma ? 'middle' : 'start'}
          fill=${s.isAlma ? '#C4A555' : '#8888b0'}
          fontSize=${s.isAlma ? 13 : 11}
          fontWeight=${s.isAlma ? '700' : '400'}
          className=${'station-label-'+(i+1)}
        >${s.name}</text>
      `)}

      <!-- Map border -->
      <rect x="40" y="60" width="1120" height="520" fill="none" stroke="#2a2200" strokeWidth="1.5" rx="4" />

      <!-- UV coverage inset (appears last) -->
      <g className="uv-inset">
        <rect x="900" y="386" width="256" height="184" fill="rgba(4,5,18,0.97)" stroke="#C4A555" strokeWidth="1" rx="4" />
        <text x="1028" y="408" textAnchor="middle" fill="#C4A555" fontSize="12" fontWeight="600">UV Coverage</text>
        <ellipse cx="1028" cy="480" rx="88" ry="48" fill="none" stroke="#C4A555" strokeWidth="1.2" strokeOpacity="0.7" strokeDasharray="3 2" />
        <ellipse cx="1028" cy="480" rx="60" ry="34" fill="none" stroke="#C4A555" strokeWidth="0.9" strokeOpacity="0.5" transform="rotate(25, 1028, 480)" strokeDasharray="3 2" />
        <ellipse cx="1028" cy="480" rx="40" ry="22" fill="none" stroke="#C4A555" strokeWidth="0.8" strokeOpacity="0.4" transform="rotate(-20, 1028, 480)" strokeDasharray="3 2" />
      </g>

      <!-- Footer -->
      <text x="600" y="636" textAnchor="middle" fill="#8888b0" fontSize="14">Max baseline: 10,900 km  ·  θ_synth ≈ 20 μas  ·  28 baselines</text>
    </svg>
  `;
}

// ── d05: From Noise to Image (CLEAN scrubber) ─────────────────────────────────
// Dirty image panel (left) and CLEAN image panel (right).
// Dark overlay on CLEAN panel slides away to reveal it.
function d05() {
  const dCx = 280, dCy = 330;
  const cCx = 920, cCy = 330;

  return html`
    <svg viewBox="0 0 1200 700" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="700" fill="#010103" />

      <!-- ─── LEFT: Dirty image panel ─── -->
      <rect x="70" y="116" width="420" height="424" fill="rgba(4,5,18,0.95)" stroke="#ff6b6b" strokeWidth="1.5" rx="6" />
      <text x="280" y="104" textAnchor="middle" fill="#ff6b6b" fontSize="17" fontWeight="700">Dirty Image</text>

      <!-- Sidelobe rings (artifacts) -->
      <circle cx=${dCx} cy=${dCy} r="158" fill="none" stroke="#555585" strokeWidth="0.5" strokeOpacity="0.15" />
      <circle cx=${dCx} cy=${dCy} r="128" fill="none" stroke="#8888b0" strokeWidth="0.6" strokeOpacity="0.22" />
      <circle cx=${dCx} cy=${dCy} r="98"  fill="none" stroke="#8888b0" strokeWidth="0.8" strokeOpacity="0.3" />
      <circle cx=${dCx} cy=${dCy} r="68"  fill="none" stroke="#C4A555" strokeWidth="1"   strokeOpacity="0.42" />
      <!-- True ring (faint under sidelobes) -->
      <circle cx=${dCx} cy=${dCy} r="38"  fill="none" stroke="#FFD700" strokeWidth="2.5" strokeOpacity="0.6" />
      <!-- Shadow center -->
      <circle cx=${dCx} cy=${dCy} r="18" fill="#020408" />
      <!-- Artifact blobs -->
      <circle cx="170" cy="234" r="12" fill="none" stroke="#8888b0" strokeWidth="1" strokeOpacity="0.3" />
      <circle cx="390" cy="424" r="9"  fill="none" stroke="#8888b0" strokeWidth="0.8" strokeOpacity="0.25" />
      <circle cx="178" cy="432" r="8"  fill="none" stroke="#555585" strokeWidth="0.8" strokeOpacity="0.2" />
      <text x="348" y="454" fill="#8888b0" fontSize="12" fontStyle="italic">sidelobes</text>

      <!-- ─── RIGHT: CLEAN image panel ─── -->
      <rect x="710" y="116" width="420" height="424" fill="rgba(4,5,18,0.95)" stroke="#4ecdc4" strokeWidth="1.5" rx="6" />
      <text x="920" y="104" textAnchor="middle" fill="#4ecdc4" fontSize="17" fontWeight="700">CLEAN Image</text>

      <!-- Clean ring (no sidelobes) -->
      <circle cx=${cCx} cy=${cCy} r="38" fill="rgba(255,215,0,0.07)" stroke="#FFD700" strokeWidth="4" strokeOpacity="0.9" />
      <!-- Shadow -->
      <circle cx=${cCx} cy=${cCy} r="18" fill="#010206" />
      <!-- Clean beam ellipse -->
      <ellipse cx="1082" cy="494" rx="14" ry="10" stroke="#4ecdc4" strokeWidth="1.5" fill="rgba(78,205,196,0.1)" />
      <text x="1082" y="524" textAnchor="middle" fill="#4ecdc4" fontSize="11">restore beam</text>

      <!-- Scrubber: dark overlay slides right to reveal CLEAN panel -->
      <rect x="710" y="114" width="422" height="428" fill="#010103" className="scrubber-reveal" />
      <!-- Scrubber leading line -->
      <line x1="710" y1="114" x2="710" y2="542" stroke="#FFD700" strokeWidth="3" strokeOpacity="0.9" className="scrubber-reveal" />

      <!-- Center arrow -->
      <text x="600" y="340" textAnchor="middle" fill="#555570" fontSize="28">→</text>

      <!-- CLEAN equation at bottom -->
      <text x="600" y="592" textAnchor="middle" fill="#FFD700" fontSize="17" fontFamily="'Courier New', monospace">r ← r − γ · r_max · B^D(l − l₀)</text>
      <text x="600" y="620" textAnchor="middle" fill="#8888b0" fontSize="13">loop gain γ = 0.1  ·  stop at 3σ_noise</text>
    </svg>
  `;
}

// ── d06: First Light (real EHT image) ────────────────────────────────────────
// Real EHT M87* image fills the left portion.
// Text overlay is positioned right by TourCard (.text-right class on overlay).
function d06() {
  return html`
    <svg viewBox="0 0 1200 700" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="700" fill="#010103" />

      <!-- Real EHT image, left-center -->
      <image
        href="../assets/eht-m87-2019.jpg"
        x="60" y="55"
        width="660" height="600"
        preserveAspectRatio="xMidYMid meet"
        className="eht-image-reveal"
      />

      <!-- Radial vignette blending image edges -->
      <defs>
        <radialGradient id="vig06" cx="38%" cy="50%" r="52%">
          <stop offset="52%" stopColor="transparent" />
          <stop offset="100%" stopColor="#010103" />
        </radialGradient>
      </defs>
      <rect width="1200" height="700" fill="url(#vig06)" />

      <!-- Scale bar -->
      <line x1="62" y1="618" x2="162" y2="618" stroke="#C4A555" strokeWidth="2" />
      <line x1="62" y1="611" x2="62" y2="625" stroke="#C4A555" strokeWidth="2" />
      <line x1="162" y1="611" x2="162" y2="625" stroke="#C4A555" strokeWidth="2" />
      <text x="112" y="642" textAnchor="middle" fill="#C4A555" fontSize="13">42 μas</text>

      <!-- Caption labels -->
      <text x="390" y="42" textAnchor="middle" fill="#FFD700" fontSize="15" fontWeight="600">M87*   ·   April 10, 2019</text>
      <text x="390" y="672" textAnchor="middle" fill="#8888b0" fontSize="12" fontStyle="italic">EHT Collaboration 2019  ·  ApJL 875, L1</text>
    </svg>
  `;
}

// ── d07: Beyond Earth — BHEX ─────────────────────────────────────────────────
// Earth small at center, BHEX orbit, ground-space baselines, comparison panels.
function d07() {
  return html`
    <svg viewBox="0 0 1200 700" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="700" fill="#010103" />

      <!-- Decorative stars -->
      <circle cx="80"  cy="90"  r="1.5" fill="#f0f0f8" fillOpacity="0.4" />
      <circle cx="250" cy="180" r="1"   fill="#f0f0f8" fillOpacity="0.3" />
      <circle cx="1100" cy="120" r="1.5" fill="#f0f0f8" fillOpacity="0.35" />
      <circle cx="1050" cy="580" r="1"   fill="#f0f0f8" fillOpacity="0.3" />
      <circle cx="150" cy="520"  r="1.5" fill="#f0f0f8" fillOpacity="0.25" />
      <circle cx="900" cy="200"  r="1"   fill="#f0f0f8" fillOpacity="0.4" />
      <circle cx="440" cy="80"   r="1"   fill="#f0f0f8" fillOpacity="0.3" />
      <circle cx="760" cy="620"  r="1.5" fill="#f0f0f8" fillOpacity="0.25" />

      <!-- Earth (center) -->
      <circle cx="600" cy="380" r="94" fill="none" stroke="rgba(78,205,196,0.12)" strokeWidth="14" />
      <circle cx="600" cy="380" r="78" fill="rgba(14,28,85,0.75)" stroke="#4ecdc4" strokeWidth="2.5" />

      <!-- Ground stations on Earth surface -->
      <circle cx="547" cy="427" r="7" fill="#C4A555" />
      <text x="530" y="450" fill="#C4A555" fontSize="11" fontWeight="700">ALMA</text>
      <circle cx="572" cy="308" r="5" fill="#8888b0" />
      <text x="540" y="300" fill="#8888b0" fontSize="10">IRAM</text>
      <circle cx="612" cy="457" r="5" fill="#8888b0" />
      <text x="620" y="472" fill="#8888b0" fontSize="10">SPT</text>

      <!-- BHEX orbit ellipse (inclined 22°) -->
      <ellipse cx="600" cy="380" rx="420" ry="172"
        fill="none" stroke="#C4A555" strokeWidth="1.8"
        strokeDasharray="8 5" strokeOpacity="0.45"
        transform="rotate(-22, 600, 380)" />

      <!-- Ground-space baselines (to BHEX at ~x=1008, y=246) -->
      <line x1="1004" y1="252" x2="551" y2="423" stroke="#C4A555" strokeWidth="2" strokeDasharray="9 5" strokeOpacity="0.72" />
      <line x1="1004" y1="250" x2="574" y2="312" stroke="#8888b0" strokeWidth="1.2" strokeDasharray="9 5" strokeOpacity="0.45" />
      <line x1="1005" y1="255" x2="614" y2="453" stroke="#8888b0" strokeWidth="1" strokeDasharray="9 5" strokeOpacity="0.36" />

      <!-- Baseline length label -->
      <text x="790" y="316" textAnchor="middle" fill="#C4A555" fontSize="13" transform="rotate(-18, 790, 316)">~32,900 km</text>

      <!-- BHEX satellite body -->
      <rect x="995" y="240" width="22" height="14" rx="2" fill="#ff9f43" stroke="#FFD700" strokeWidth="1.5" />
      <!-- Solar panels -->
      <rect x="972" y="244" width="22" height="6" rx="1" fill="#ff9f43" fillOpacity="0.6" />
      <rect x="1018" y="244" width="22" height="6" rx="1" fill="#ff9f43" fillOpacity="0.6" />
      <text x="1006" y="228" textAnchor="middle" fill="#ff9f43" fontSize="12" fontWeight="700">BHEX</text>

      <!-- ─── Comparison panels ─── -->
      <!-- Left: EHT Ground -->
      <rect x="28" y="44" width="236" height="152" fill="rgba(2,2,12,0.94)" stroke="#222245" strokeWidth="1.5" rx="5" />
      <text x="146" y="72" textAnchor="middle" fill="#8888b0" fontSize="14" fontWeight="700">EHT Ground</text>
      <rect x="48" y="86" width="96" height="22" fill="#4488cc" fillOpacity="0.7" rx="3" />
      <text x="152" y="102" fill="#4ecdc4" fontSize="12">~20 μas beam</text>
      <rect x="48" y="116" width="196" height="22" fill="#C4A555" fillOpacity="0.45" rx="3" />
      <text x="252" y="132" textAnchor="end" fill="#C4A555" fontSize="12">42 μas shadow</text>
      <text x="146" y="178" textAnchor="middle" fill="#8888b0" fontSize="11" fontStyle="italic">resolves shadow</text>

      <!-- Right: BHEX -->
      <rect x="936" y="44" width="236" height="152" fill="rgba(2,2,12,0.94)" stroke="#C4A555" strokeWidth="1.5" rx="5" />
      <text x="1054" y="72" textAnchor="middle" fill="#ff9f43" fontSize="14" fontWeight="700">EHT + BHEX</text>
      <rect x="956" y="86" width="30" height="22" fill="#ff9f43" fillOpacity="0.8" rx="3" />
      <text x="994" y="102" fill="#ff9f43" fontSize="12">~6 μas beam</text>
      <rect x="956" y="116" width="196" height="22" fill="#C4A555" fillOpacity="0.45" rx="3" />
      <text x="1158" y="132" textAnchor="end" fill="#C4A555" fontSize="12">42 μas shadow</text>
      <text x="1054" y="160" textAnchor="middle" fill="#FFD700" fontSize="12" fontWeight="700">3.3× finer resolution</text>
      <text x="1054" y="178" textAnchor="middle" fill="#8888b0" fontSize="11" fontStyle="italic">resolves photon ring</text>

      <!-- Formula box at bottom -->
      <rect x="190" y="584" width="820" height="84" fill="rgba(6,8,22,0.96)" stroke="#1e1800" strokeWidth="1" rx="6" />
      <text x="600" y="612" textAnchor="middle" fill="#C4A555" fontSize="15">B_max = R_Earth + h_orbit = 6,371 + 26,562 = 32,933 km</text>
      <text x="600" y="640" textAnchor="middle" fill="#8888b0" fontSize="13">θ = λ / B_max = 1.0 mm / 32,933 km ≈ 6.3 μas at 300 GHz</text>
    </svg>
  `;
}

// ── d08: The Simulator (product showcase) ────────────────────────────────────
// Two contour map panels (EHT 2017 vs ngEHT Ph.1), FITS terminal, metrics.
function d08() {
  const lCx = 280, lCy = 310;
  const rCx = 880, rCy = 310;

  return html`
    <svg viewBox="0 0 1200 700" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="700" fill="#010103" />

      <!-- ─── LEFT panel: EHT 2017 ─── -->
      <rect x="28" y="72" width="504" height="440" fill="rgba(4,5,18,0.97)" stroke="#1e2040" strokeWidth="1.5" rx="6" />
      <text x="280" y="54" textAnchor="middle" fill="#8888b0" fontSize="15" fontWeight="700">EHT 2017</text>
      <text x="280" y="70" textAnchor="middle" fill="#555570" fontSize="12">8 stations · 28 baselines</text>

      <!-- Map background -->
      <rect x="36" y="84" width="488" height="296" fill="#080615" rx="4" />

      <!-- EHT 2017 contour rings (fewer, less sharp) -->
      <circle cx=${lCx} cy=${lCy} r="52" fill="none" stroke="#FFD700" strokeWidth="2.5" strokeOpacity="0.85" />
      <circle cx=${lCx} cy=${lCy} r="78" fill="none" stroke="#C4A555" strokeWidth="1.5" strokeOpacity="0.55" />
      <circle cx=${lCx} cy=${lCy} r="26" fill="rgba(255,215,0,0.07)" />
      <circle cx=${lCx} cy=${lCy} r="18" fill="#020408" />

      <!-- EHT beam ellipse (less circular) -->
      <ellipse cx="478" cy="354" rx="22" ry="16" stroke="#4ecdc4" strokeWidth="1.5" fill="rgba(78,205,196,0.1)" transform="rotate(15, 478, 354)" />
      <text x="478" y="376" textAnchor="middle" fill="#4ecdc4" fontSize="10">beam</text>

      <!-- LEFT metrics -->
      <text x="280" y="418" textAnchor="middle" fill="#C4A555" fontSize="13">DR ≈ 50:1</text>
      <text x="280" y="438" textAnchor="middle" fill="#8888b0" fontSize="11">beam FWHM ~24 μas</text>
      <text x="280" y="458" textAnchor="middle" fill="#8888b0" fontSize="11">UV fill 0.8%</text>

      <!-- ─── RIGHT panel: ngEHT Phase 1 ─── -->
      <rect x="668" y="72" width="504" height="440" fill="rgba(4,5,18,0.97)" stroke="#C4A555" strokeWidth="1.5" rx="6" />
      <text x="920" y="54" textAnchor="middle" fill="#C4A555" fontSize="15" fontWeight="700">ngEHT Phase 1</text>
      <text x="920" y="70" textAnchor="middle" fill="#9E7E38" fontSize="12">17 stations · 136 baselines</text>

      <!-- Map background -->
      <rect x="676" y="84" width="488" height="296" fill="#080615" rx="4" />

      <!-- ngEHT contour rings (more, sharper) -->
      <circle cx=${rCx} cy=${rCy} r="52" fill="none" stroke="#FFD700" strokeWidth="3" strokeOpacity="0.95" />
      <circle cx=${rCx} cy=${rCy} r="78" fill="none" stroke="#FFD700" strokeWidth="2" strokeOpacity="0.72" />
      <circle cx=${rCx} cy=${rCy} r="104" fill="none" stroke="#C4A555" strokeWidth="1.4" strokeOpacity="0.48" />
      <circle cx=${rCx} cy=${rCy} r="26" fill="rgba(255,215,0,0.09)" />
      <circle cx=${rCx} cy=${rCy} r="18" fill="#010206" />
      <!-- Hint of jet structure -->
      <path d="M ${rCx},${rCy-24} L ${rCx+58},${rCy-78}" stroke="#C4A555" strokeWidth="1.2" strokeOpacity="0.4" />

      <!-- ngEHT beam ellipse (smaller, more circular) -->
      <ellipse cx="1118" cy="354" rx="13" ry="11" stroke="#4ecdc4" strokeWidth="1.5" fill="rgba(78,205,196,0.1)" />
      <text x="1118" y="376" textAnchor="middle" fill="#4ecdc4" fontSize="10">beam</text>

      <!-- RIGHT metrics -->
      <text x="920" y="418" textAnchor="middle" fill="#C4A555" fontSize="13">DR ≈ 200:1</text>
      <text x="920" y="438" textAnchor="middle" fill="#8888b0" fontSize="11">beam FWHM ~14 μas</text>
      <text x="920" y="458" textAnchor="middle" fill="#8888b0" fontSize="11">UV fill 3.2%</text>

      <!-- ─── Animated floating panels ─── -->

      <!-- FITS terminal (bottom-left) -->
      <g className="fits-reveal">
        <rect x="28" y="530" width="250" height="118" fill="rgba(2,2,12,0.97)" stroke="#1e2040" strokeWidth="1" rx="4" />
        <text x="42" y="554" fill="#4ecdc4" fontSize="9" fontFamily="'Courier New', monospace">CRVAL1 = 187.7059308</text>
        <text x="42" y="572" fill="#C4A555" fontSize="9" fontFamily="'Courier New', monospace">BMAJ   = 5.56E-09</text>
        <text x="42" y="590" fill="#8888b0" fontSize="9" fontFamily="'Courier New', monospace">BUNIT  = 'JY/BEAM'</text>
        <text x="42" y="608" fill="#4ecdc4" fontSize="9" fontFamily="'Courier New', monospace">NAXIS1 = 512</text>
        <text x="42" y="626" fill="#555570" fontSize="9" fontFamily="'Courier New', monospace">END</text>
        <text x="42" y="640" fill="#555570" fontSize="8" fontFamily="'Courier New', monospace" fontStyle="italic">valid FITS · WCS · CASA/Astropy/ds9</text>
      </g>

      <!-- Metrics panel (bottom-right) -->
      <g className="metrics-reveal">
        <rect x="922" y="530" width="250" height="118" fill="rgba(4,5,18,0.97)" stroke="#1e2040" strokeWidth="1" rx="4" />
        <text x="936" y="556" fill="#8888b0" fontSize="10">Beam FWHM</text>
        <text x="1164" y="556" textAnchor="end" fill="#C4A555" fontSize="10">~20 μas</text>
        <text x="936" y="576" fill="#8888b0" fontSize="10">Dynamic Range</text>
        <text x="1164" y="576" textAnchor="end" fill="#C4A555" fontSize="10">~50:1</text>
        <text x="936" y="596" fill="#8888b0" fontSize="10">UV Fill</text>
        <text x="1164" y="596" textAnchor="end" fill="#C4A555" fontSize="10">0.8%</text>
        <text x="936" y="616" fill="#8888b0" fontSize="10">Baselines</text>
        <text x="1164" y="616" textAnchor="end" fill="#C4A555" fontSize="10">28</text>
        <text x="936" y="636" fill="#8888b0" fontSize="10">Max baseline</text>
        <text x="1164" y="636" textAnchor="end" fill="#C4A555" fontSize="10">10,900 km</text>
      </g>

      <!-- Call to action -->
      <text x="600" y="664" textAnchor="middle" className="cta-text" fill="#FFD700" fontSize="22" fontWeight="800">Place your first telescope.</text>
    </svg>
  `;
}
