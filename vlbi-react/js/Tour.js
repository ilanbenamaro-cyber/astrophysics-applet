// Tour.js — cinematic 8-act VLBI physics tour.
// animPhase state machine: 'visual' (SVG plays) → 'text' (paragraphs reveal) → 'ready' (advance).
// Chapter title cards appear before acts 3 and 6 (chapter transitions).
import { html, useState, useEffect, useRef } from './core.js';
import { TourCard } from './TourCard.js';

// ─── Act data ─────────────────────────────────────────────────────────────────
const TOUR_ACTS = [
  // ─── Chapter I: THE PROBLEM ──────────────────────────────────────────────
  {
    chapter: 1,
    title: 'The Resolution Problem',
    visualDuration: 3500,
    paragraphs: [
      '55 million light-years away, a black hole the mass of 6.5 billion suns casts a shadow 42 microarcseconds wide.',
      'A 100-meter dish — the largest steerable radio telescope on Earth — resolves 2.7 arcseconds at 230 GHz.',
      'The shadow of M87* is 70,000 times smaller than what any single dish can see. No physically plausible telescope could image it directly.',
    ],
    equation: 'θ_min = 1.22 λ/D',
    subtext: 'Rayleigh criterion · λ = 1.3 mm, D = 100 m → θ ≈ 2.7 arcsec',
    diagramId: 1,
    autoActions: [{ type: 'resetForTour' }, { type: 'loadEHT' }],
  },
  {
    chapter: 1,
    title: 'The Baseline',
    visualDuration: 3000,
    paragraphs: [
      'Two telescopes on opposite sides of the Earth compare their signals. Each records the electric field E(t), timestamped by atomic clocks accurate to femtoseconds.',
      'The visibility V₁₂ is the time-averaged product of the two fields — one delayed by τ_g to account for the geometric path length difference.',
      'Each baseline measures exactly one Fourier component of the sky brightness distribution. The spatial frequency it samples is u = B/λ.',
    ],
    equation: 'V₁₂(u,v) = ⟨E₁(t) · E₂*(t + τ_g)⟩',
    subtext: 'τ_g = B·ŝ/c  ·  u = B/λ  ·  van Cittert-Zernike theorem',
    diagramId: 2,
    autoActions: [
      { type: 'resetForTour' },
      { type: 'addTelescope', lat: -23.029, lon: -67.755 },
      { type: 'addTelescope', lat: 19.823, lon: -155.478 },
    ],
  },
  // ─── Chapter II: THE SOLUTION ─────────────────────────────────────────────
  {
    chapter: 2,
    title: 'Earth Rotation Synthesis',
    visualDuration: 5000,
    paragraphs: [
      'As Earth rotates, the projected baseline traces a different point in the UV plane.',
      'Over 12 hours, one baseline traces a complete elliptical arc. Eight stations and 28 baselines yield 11,000+ UV samples per observation night.',
      'Martin Ryle called this aperture synthesis. It earned him the Nobel Prize in Physics in 1974. The technique is used in every radio image produced today.',
    ],
    equation: 'u(H) = (Bₓ sinH + Bᵧ cosH) / λ',
    subtext: 'TMS equation 4.1  ·  H = hour angle  ·  δ = declination',
    diagramId: 3,
    autoActions: [{ type: 'resetForTour' }, { type: 'loadEHT' }],
  },
  {
    chapter: 2,
    title: 'The Event Horizon Telescope',
    visualDuration: 4500,
    paragraphs: [
      'Eight observatories. Four continents. One instrument — the Event Horizon Telescope. The maximum baseline of 10,900 km approaches Earth\'s full diameter.',
      'ALMA anchors the array with an SEFD of 94 Jy — 180 times more sensitive than the South Pole Telescope. Per-baseline noise scales as √(SEFD_i × SEFD_j).',
      'The achieved resolution of ~20 microarcseconds is sufficient to resolve a 42 μas shadow — comparable to reading a newspaper in New York from Paris.',
    ],
    equation: 'θ_synth ≈ λ / B_max ≈ 20 μas',
    subtext: 'B_max = 10,900 km  ·  λ = 1.3 mm  ·  230 GHz',
    diagramId: 4,
    autoActions: [{ type: 'resetForTour' }, { type: 'loadEHT' }],
  },
  {
    chapter: 2,
    title: 'From Noise to Image',
    visualDuration: 4000,
    paragraphs: [
      'Inverse Fourier transforming incomplete UV data produces the dirty image — the true sky convolved with the array\'s point spread function, riddled with sidelobe artifacts.',
      'The CLEAN algorithm (Högbom 1974) iteratively finds the brightest peak, subtracts a fraction of the dirty beam centered on it, and accumulates clean components.',
      'Convergence stops when the residual peak falls below 3σ_noise. The model is convolved with a smooth restore beam. Sidelobes vanish. The source emerges.',
    ],
    equation: 'r ← r − γ · r_max · B^D(l − l₀)',
    subtext: 'loop gain γ = 0.1  ·  stop at 3σ_noise (MAD estimator)',
    diagramId: 5,
    autoActions: [{ type: 'setMethod', method: 'clean' }],
  },
  // ─── Chapter III: THE FRONTIER ───────────────────────────────────────────
  {
    chapter: 3,
    title: 'First Light',
    visualDuration: 4000,
    paragraphs: [
      'April 10, 2019. The Event Horizon Telescope Collaboration released the first image of a black hole — M87*, 55 million light-years away.',
      'Four independent imaging teams, using different algorithms, all recovered consistent ring structure. General Relativity confirmed to within measurement uncertainty.',
      'The shadow diameter of 42 ± 3 microarcseconds matches the prediction of the Schwarzschild metric for a 6.5 billion solar mass black hole.',
    ],
    equation: 'θ_shadow = 3√3 · GM / (c² · D_L) ≈ 42 μas',
    subtext: 'EHT Collaboration 2019 · ApJL 875, L1 · Confirmed by GR',
    diagramId: 6,
    autoActions: [{ type: 'setPreset', preset: 'blackhole' }],
  },
  {
    chapter: 3,
    title: 'Beyond Earth: The BHEX Mission',
    visualDuration: 4500,
    paragraphs: [
      'Earth\'s diameter sets a hard limit: 12,742 km of maximum baseline. At 230 GHz, that resolves 20 μas — sufficient for the shadow but not its internal structure.',
      'The Black Hole Explorer (BHEX) is a proposed NASA mission: a 3.4m dish in a 26,562 km altitude orbit, extending baselines to 32,933 km and resolution to 6 μas.',
      'At 6 μas, the photon ring — the sharp lensed image of photons orbiting the black hole — becomes directly resolvable. This is the next test of General Relativity.',
    ],
    equation: 'θ_BHEX = λ / B_max = 1.0 mm / 32,933 km ≈ 6 μas',
    subtext: 'BHEX · altitude 26,562 km · period 12 h · launch 2032',
    diagramId: 7,
    autoActions: [],
  },
  {
    chapter: 3,
    title: 'The Simulator',
    visualDuration: 3000,
    paragraphs: [
      'This simulator implements the complete VLBI pipeline with physical accuracy: per-baseline SEFD thermal noise, 10° elevation cutoffs, elliptical CLEAN restore beam, and Keplerian space telescope orbits.',
      'Compare EHT 2017 against ngEHT Phase 1 side-by-side. Add BHEX and watch the UV coverage extend to 33 Gλ. Export valid FITS files with WCS headers compatible with CASA, Astropy, and ds9.',
    ],
    equation: 'DR = S_peak / (1.4826 · median|border − median|)',
    subtext: 'Dynamic range · MAD estimator · EHT 2017: ~50:1 · ngEHT Ph.1: ~200:1',
    diagramId: 8,
    autoActions: [],
    finalAct: true,
  },
];

// Chapter title cards shown before the first act of chapters II and III
const CHAPTER_CARDS = {
  2: { number: 'Chapter II', title: 'THE SOLUTION', subtitle: 'Aperture synthesis and the Earth-sized array' },
  5: { number: 'Chapter III', title: 'THE FRONTIER', subtitle: 'Space baselines and the next generation' },
};

// ─── Tour component ───────────────────────────────────────────────────────────
export function Tour({ actIndex, onActChange, onClose, onTourAction, reducedMotion }) {
  const [animPhase, setAnimPhase] = useState('visual');
  const [chapterCard, setChapterCard] = useState(false);
  const animTimerRef = useRef(null);
  const textTimerRef = useRef(null);
  const chapterTimerRef = useRef(null);
  const ranAutoRef = useRef(-1);

  // Fire autoActions once per act change (90ms stagger between actions)
  useEffect(() => {
    if (ranAutoRef.current === actIndex) return;
    ranAutoRef.current = actIndex;
    const act = TOUR_ACTS[actIndex];
    act.autoActions?.forEach((action, i) => {
      setTimeout(() => onTourAction(action), i * 90);
    });
  }, [actIndex, onTourAction]);

  // animPhase state machine + chapter cards
  useEffect(() => {
    clearTimeout(animTimerRef.current);
    clearTimeout(textTimerRef.current);
    clearTimeout(chapterTimerRef.current);
    setChapterCard(false); // always reset before showing new chapter card

    setAnimPhase(reducedMotion ? 'ready' : 'visual');

    if (reducedMotion) return;

    // Show chapter card if this is the first act of a new chapter
    if (CHAPTER_CARDS[actIndex]) {
      setChapterCard(true);
      chapterTimerRef.current = setTimeout(() => setChapterCard(false), 2200);
    }

    const act = TOUR_ACTS[actIndex];
    animTimerRef.current = setTimeout(() => {
      setAnimPhase('text');
      const textDur = act.paragraphs.length * 800 + 1200;
      textTimerRef.current = setTimeout(() => setAnimPhase('ready'), textDur);
    }, act.visualDuration);

    return () => {
      clearTimeout(animTimerRef.current);
      clearTimeout(textTimerRef.current);
      clearTimeout(chapterTimerRef.current);
    };
  }, [actIndex, reducedMotion]);

  // handleNext: respects animPhase (→ during 'text' skips to 'ready', not next act)
  const handleNext = () => {
    if (animPhase === 'text') {
      clearTimeout(textTimerRef.current);
      setAnimPhase('ready');
      return;
    }
    if (animPhase === 'ready') {
      actIndex < TOUR_ACTS.length - 1 ? onActChange(actIndex + 1) : onClose();
    }
  };

  const handleBack = () => {
    if (animPhase !== 'visual' && actIndex > 0) onActChange(actIndex - 1);
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowRight') { handleNext(); return; }
      if (e.key === 'ArrowLeft') { handleBack(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [actIndex, animPhase, onClose, onActChange]);

  const card = CHAPTER_CARDS[actIndex];

  return html`
    <div className="tour-cinematic" role="dialog" aria-modal="true" aria-label="VLBI Physics Tour">

      <!-- Chapter title card (appears at chapter transitions) -->
      ${chapterCard && card ? html`
        <div className="chapter-card">
          <div className="chapter-number">${card.number}</div>
          <div className="chapter-title-card">${card.title}</div>
          <div className="chapter-subtitle">${card.subtitle}</div>
        </div>
      ` : null}

      <!-- Per-act content (hero SVG + text overlay + navigation) -->
      <${TourCard}
        act=${TOUR_ACTS[actIndex]}
        animPhase=${animPhase}
        actIndex=${actIndex}
        totalActs=${TOUR_ACTS.length}
        onNext=${handleNext}
        onBack=${handleBack}
        onSkip=${onClose}
        onJump=${onActChange}
        reducedMotion=${reducedMotion}
      />
    </div>
  `;
}
