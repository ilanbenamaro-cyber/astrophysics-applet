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
    text: 'A single radio dish has angular resolution θ ≈ λ/D, where λ is the observing wavelength and D is the dish diameter. For the EHT\'s 1.3 mm observations, even a 100 m dish — the largest on Earth — gives only ~2.7 arcsecond resolution. A black hole shadow subtends roughly 40 microarcseconds on the sky: 70,000 times smaller than a 100 m dish can resolve. No single dish on Earth, or any plausible Earth-based dish, can image a black hole. The only solution is to make D effectively the size of Earth itself — by linking many dishes together into an interferometric array.',
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
    text: 'Two telescopes separated by a baseline B correlate their received radio signals. Each telescope records the electric field E(t) of incoming radio waves, timestamped with atomic clocks accurate to femtoseconds. The key observable is the visibility V₁₂ — the time-averaged product of the two electric fields, with one delayed by τ to account for the extra path length. This delay τ encodes the direction of the source: as the source moves across the sky (due to Earth\'s rotation), τ changes, allowing us to reconstruct angular structure. The EHT correlates signals recorded on hard drives that are physically flown between continents — no real-time connection is fast enough for the data rates involved.',
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
    text: 'The van Cittert-Zernike theorem is the mathematical heart of interferometry: the visibility V(u,v) measured by a baseline is exactly one Fourier coefficient of the sky brightness distribution I(x,y). Each baseline samples one point (u,v) in \'Fourier space\', also called the UV plane. The spatial frequency u = B_EW/λ determines which angular scale on the sky that baseline is sensitive to — short baselines see large-scale structure, long baselines resolve fine details. To recover the full sky image I(x,y), we need to sample enough UV points and then inverse Fourier transform. With only a handful of baselines, the reconstruction is incomplete — this is the fundamental challenge of sparse aperture synthesis.',
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
    text: 'As Earth rotates over the course of an observation, the projected separation between each telescope pair changes in both length and direction. In the UV plane, each baseline traces an elliptical arc — the shape determined by the baseline\'s length, orientation, and the declination of the target source. The EHT observes M87* for roughly 4 hours per night, during which each baseline sweeps a substantial arc. With 8 stations there are 28 baselines, each sweeping its own arc — giving 11,000+ UV samples per observation night. More rotation time means denser UV coverage, which means a sharper, more faithful image reconstruction.',
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
    text: 'Inverse Fourier transforming the incomplete UV data does not give a clean image — it gives the \'dirty image\', which is the true sky convolved with the array\'s point spread function (PSF), called the dirty beam. The dirty beam has a narrow central peak (the actual resolution) surrounded by sidelobes from the missing UV coverage. These sidelobes create ringing artefacts that can look like real structure but are purely instrumental. For the EHT, the dirty beam sidelobes are severe because UV coverage is sparse — only 28 baselines compared to the millions a filled aperture would have. The goal of image reconstruction is to deconvolve the dirty beam from the dirty image and recover something close to the true sky.',
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
    text: 'Maximum Entropy Method (MEM) finds the image that is most consistent with the measured visibilities while making the fewest additional assumptions about the sky. It maximises the information entropy S(I) — a measure of image smoothness and uniformity — subject to the data-fidelity constraint χ² ≤ 1, which requires the reconstructed image\'s predicted visibilities to match the measured ones within noise. The prior model Mᵢ is typically a flat, uniform image — encoding \'I know nothing beyond what the data tells me\'. MEM naturally suppresses sidelobes without explicit deconvolution, because the maximum-entropy image has no unnecessary structure. The EHT team used MEM-based methods as one of four independent imaging pipelines to validate the 2019 image.',
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
    text: 'CLEAN is the workhorse deconvolution algorithm of radio astronomy, developed by Jan Högbom in 1974 and used in virtually every radio image since. It iteratively finds the brightest peak in the dirty image, subtracts a fraction γ (the loop gain, typically 0.1) of the dirty beam centred on that peak, and accumulates the subtracted flux as a \'clean component\'. After many iterations — typically hundreds to thousands — the residual approaches the noise floor. The clean components are then convolved with a smooth Gaussian \'clean beam\' (whose width matches the central peak of the dirty beam) and the residuals are added back. This two-step process removes sidelobes while preserving the angular resolution of the array. CLEAN works best on compact sources; for extended emission, MEM often outperforms it.',
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
    text: 'The Event Horizon Telescope used 8 stations spanning Earth\'s diameter to achieve ~20 microarcsecond angular resolution at 230 GHz (1.3 mm wavelength). On April 10, 2019, it released the first image of a black hole: the shadow of M87*, a 6.5-billion solar mass black hole 55 million light-years away in the Virgo galaxy cluster. The image shows a bright emission ring surrounding a central dark region — the photon sphere and shadow caused by the black hole\'s immense gravity bending light. Four independent imaging teams used different algorithms (including MEM and CLEAN variants) and all recovered consistent images, confirming the result is robust. The EHT collaboration processed 5 petabytes of data recorded on half a ton of hard drives flown from the South Pole. You just simulated the core physics that made this possible.',
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

  // Spotlight: add glow class to target DOM element
  useLayoutEffect(() => {
    const spotId = ACTS[actIndex].spotlightId;
    if (!spotId) return;
    const el = document.getElementById(spotId);
    if (!el) return;
    el.classList.add('tour-spotlight-active');
    return () => el.classList.remove('tour-spotlight-active');
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
