// Tour — orchestrates the 8-act physics guided tour.
// Manages act definitions, auto-actions, spotlight elevation, and navigation.
import { html, useEffect, useRef, useCallback } from './core.js';
import { useLayoutEffect } from 'react';
import { TourCard } from './TourCard.js';

// ── Act definitions ────────────────────────────────────────────────────────
// Each act: { title, spotlightId, diagramAct, text, mathLatex, terms, autoActions, userHint }
// spotlightId: null = full dim overlay, string = elevate that DOM element above overlay
// autoActions: array of { type, ...params } dispatched to onTourAction prop
const ACTS = [
  {
    title: 'Single-Dish Resolution',
    spotlightId: null,
    diagramAct: 1,
    text: 'A single radio dish has angular resolution θ ≈ λ/D, where λ is the observing wavelength and D is the dish diameter. For the EHT\'s 1.3 mm observations, even a 100 m dish gives only ~2.7 arcsecond resolution — far too coarse to image a black hole shadow.',
    mathLatex: '\\theta \\approx \\frac{\\lambda}{D}',
    terms: [
      { sym: 'θ', desc: 'Angular resolution (radians) — how small a detail you can see' },
      { sym: 'λ', desc: 'Observing wavelength (1.3 mm for the EHT)' },
      { sym: 'D', desc: 'Dish diameter — larger dishes give finer resolution' },
    ],
    autoActions: [],
    userHint: null,
  },
  {
    title: 'Baselines & Correlations',
    spotlightId: 'tour-globe',
    diagramAct: 2,
    text: 'Two telescopes separated by baseline B correlate their received signals. The key measurement is the visibility V₁₂ — the time-averaged product of the two electric fields. The phase of V₁₂ encodes the direction of the source.',
    mathLatex: 'V_{12} \\sim \\langle E_1(t)\\,E_2(t-\\tau) \\rangle',
    terms: [
      { sym: 'V₁₂', desc: 'Visibility — the measured correlation between telescope 1 and 2' },
      { sym: 'E₁, E₂', desc: 'Electric field (radio signal) at each telescope' },
      { sym: 'τ', desc: 'Geometric delay — the extra path length difference' },
      { sym: '⟨ ⟩', desc: 'Time average — integrated over many wave cycles' },
    ],
    autoActions: [
      { type: 'resetForTour' },
      { type: 'addTelescope', lat: -23.029, lon: -67.755 }, // ALMA
      { type: 'addTelescope', lat: 37.066, lon: -3.392 },   // IRAM
    ],
    userHint: null,
  },
  {
    title: 'The Fourier Connection',
    spotlightId: 'tour-uv',
    diagramAct: 3,
    text: 'The van Cittert-Zernike theorem is the foundation of radio interferometry: the visibility measured by a baseline at (u, v) equals one Fourier coefficient of the sky brightness distribution I(x, y). Each baseline samples one point in the 2D Fourier domain.',
    mathLatex: 'V(u,v) = \\iint I(x,y)\\,e^{-2\\pi i(ux+vy)}\\,dx\\,dy',
    terms: [
      { sym: 'V(u,v)', desc: 'Visibility at spatial frequency (u, v) — what we measure' },
      { sym: 'I(x,y)', desc: 'Sky brightness at position (x, y) — what we want' },
      { sym: 'u, v', desc: 'Spatial frequencies = baseline length ÷ wavelength' },
      { sym: 'x, y', desc: 'Angular sky coordinates (radians from phase centre)' },
      { sym: 'e^{−2πi·}', desc: 'Fourier kernel — complex exponential oscillating across the sky' },
    ],
    autoActions: [],
    userHint: null,
  },
  {
    title: 'Earth-Rotation Synthesis',
    spotlightId: 'tour-uv',
    diagramAct: 4,
    text: 'As Earth rotates, the projected separation between each telescope pair changes direction and length. Each baseline sweeps an elliptical arc through UV space. The longer the observation, the denser the UV coverage and the sharper the reconstructed image.',
    mathLatex: 'u = \\frac{B_x \\sin H + B_y \\cos H}{\\lambda}',
    terms: [
      { sym: 'u', desc: 'East-West spatial frequency sampled at hour angle H' },
      { sym: 'Bₓ', desc: 'East-West component of baseline vector (metres)' },
      { sym: 'Bᵧ', desc: 'North-South component of baseline vector (metres)' },
      { sym: 'H', desc: 'Hour angle — how far Earth has rotated during the observation' },
      { sym: 'λ', desc: 'Observing wavelength' },
    ],
    autoActions: [
      { type: 'loadEHT' },
    ],
    userHint: 'Try dragging the Duration slider in the sidebar — watch the UV arcs fill in.',
  },
  {
    title: 'The Dirty Image',
    spotlightId: 'tour-images',
    diagramAct: 5,
    text: 'Inverse-Fourier-transforming the incomplete UV data gives the dirty image — the true sky brightness convolved with the point spread function (PSF) of the array, called the dirty beam. Sidelobes from missing UV coverage create ringing artefacts throughout the image.',
    mathLatex: 'I^D = I_{\\text{true}} * B',
    terms: [
      { sym: 'I^D', desc: 'Dirty image — the raw reconstruction with artefacts' },
      { sym: 'I_true', desc: 'True sky brightness — what we are trying to recover' },
      { sym: '*', desc: 'Convolution — the smearing operation' },
      { sym: 'B', desc: 'Dirty beam (PSF) — determined by which UV points are sampled' },
    ],
    autoActions: [
      { type: 'setMethod', method: 'dirty' },
    ],
    userHint: null,
  },
  {
    title: 'Max Entropy Reconstruction',
    spotlightId: 'tour-controls',
    diagramAct: 6,
    text: 'Maximum Entropy Method (MEM) finds the smoothest (highest entropy) image that is consistent with the measured visibilities. It maximises the information entropy subject to a chi-squared data-fidelity constraint. The result is the most unbiased image the data can support.',
    mathLatex: '\\max\\; S(I) = -\\sum_i I_i \\ln\\!\\frac{I_i}{M_i} \\quad \\text{s.t.}\\; \\chi^2 \\leq 1',
    terms: [
      { sym: 'S(I)', desc: 'Image entropy — higher means smoother, fewer assumptions' },
      { sym: 'Iᵢ', desc: 'Brightness of pixel i in the reconstruction' },
      { sym: 'Mᵢ', desc: 'Prior model pixel — default is a uniform flat image' },
      { sym: 'χ² ≤ 1', desc: 'Data constraint — residuals must match the noise level' },
    ],
    autoActions: [
      { type: 'setMethod', method: 'mem' },
    ],
    userHint: null,
  },
  {
    title: 'CLEAN Deconvolution',
    spotlightId: 'tour-controls',
    diagramAct: 7,
    text: 'CLEAN iteratively finds the brightest peak in the dirty image, subtracts a fraction of the dirty beam centred there, and accumulates a model. After convergence, the model is convolved with a clean Gaussian beam and residuals are added back. CLEAN typically gives sharper results on compact sources than MEM.',
    mathLatex: 'r \\leftarrow r - \\gamma\\,\\hat{r}_{\\max}\\, B(x - x_{\\max})',
    terms: [
      { sym: 'r', desc: 'Residual image — updated after each CLEAN iteration' },
      { sym: 'γ', desc: 'Loop gain — fraction of peak subtracted per step (~0.1)' },
      { sym: 'r̂_max', desc: 'Amplitude of the brightest remaining point' },
      { sym: 'B', desc: 'Dirty beam — subtracted centred on the peak location' },
      { sym: 'x_max', desc: 'Position of the current peak in the residual image' },
    ],
    autoActions: [
      { type: 'setMethod', method: 'clean' },
    ],
    userHint: null,
  },
  {
    title: 'Black Hole Imaging',
    spotlightId: null,
    diagramAct: 8,
    text: 'The Event Horizon Telescope used 8 stations spanning Earth\'s diameter to achieve ~20 microarcsecond resolution at 230 GHz. On April 10, 2019, it released the first image of a black hole: the shadow of M87*, 6.5 billion solar masses, 55 million light-years away. You just simulated how it was done.',
    mathLatex: '\\theta_{\\min} = \\frac{\\lambda}{D_\\oplus} \\approx 20\\,\\mu\\text{as}',
    terms: [
      { sym: 'θ_min', desc: 'Minimum angular resolution achievable with Earth-baseline VLBI' },
      { sym: 'λ', desc: '1.3 mm — the EHT observing wavelength (230 GHz)' },
      { sym: 'D⊕', desc: 'Earth\'s diameter (12,742 km) — the maximum possible baseline' },
      { sym: 'μas', desc: 'Microarcseconds — millionths of an arcsecond' },
    ],
    autoActions: [
      { type: 'loadEHT' },
      { type: 'setPreset', preset: 'blackhole' },
      { type: 'setMethod', method: 'clean' },
    ],
    userHint: null,
  },
];

// ── Tour component ──────────────────────────────────────────────────────────
export function Tour({ actIndex, onActChange, onClose, onTourAction, reducedMotion }) {
  const ranAutoRef = useRef(new Set());

  // Fire auto-actions once per act (on first visit)
  useEffect(() => {
    if (ranAutoRef.current.has(actIndex)) return;
    ranAutoRef.current.add(actIndex);
    const act = ACTS[actIndex];
    act.autoActions.forEach((action, i) => {
      setTimeout(() => onTourAction(action), i * 90);
    });
  }, [actIndex, onTourAction]);

  // Spotlight: elevate the target DOM element above the overlay
  useLayoutEffect(() => {
    const spotId = ACTS[actIndex].spotlightId;
    if (!spotId) return;
    const el = document.getElementById(spotId);
    if (!el) return;
    const prevPosition = el.style.position;
    const prevZIndex = el.style.zIndex;
    el.style.position = 'relative';
    el.style.zIndex = '101';
    return () => {
      el.style.position = prevPosition;
      el.style.zIndex = prevZIndex;
    };
  }, [actIndex]);

  const handleNext = useCallback(() => {
    if (actIndex < ACTS.length - 1) {
      onActChange(actIndex + 1);
    } else {
      onClose();
    }
  }, [actIndex, onActChange, onClose]);

  const handleBack = useCallback(() => {
    if (actIndex > 0) onActChange(actIndex - 1);
  }, [actIndex, onActChange]);

  const hasSpot = !!ACTS[actIndex].spotlightId;

  return html`
    <div>
      <div className=${'tour-overlay' + (hasSpot ? '' : ' tour-overlay--dim')}></div>
      <${TourCard}
        key=${actIndex}
        act=${ACTS[actIndex]}
        actIndex=${actIndex}
        totalActs=${ACTS.length}
        onNext=${handleNext}
        onBack=${handleBack}
        onSkip=${onClose}
        reducedMotion=${reducedMotion}
      />
    </div>
  `;
}
