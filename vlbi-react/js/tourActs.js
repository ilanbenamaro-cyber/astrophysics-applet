// tourActs.js — the five engine-real acts as DATA (master prompt §1.1 schema).
// No physics literal is typed here: every displayed number is read from tourPhysics.js
// (the single source of computed truth). Heavy per-act canvas choreography lives in the
// scene modules registered in tourScenes.js; this file is the act spine the host reads.
//
// Presentation order is A→E. Build order was B first (flagship, pure geometry).
import { TOUR_PHYSICS as P, TOUR_FREQ_GHZ, TOUR_FOV_MUAS, TOUR_DURATION_HR } from './tourPhysics.js';
import { ARRAY_PRESETS, SKY_TARGETS, BHEX_PRESET } from './constants.js';

const M87 = SKY_TARGETS['M87*'];

// Shared engine params (mirror useSimulation DEFAULT_CONTROLS where relevant;
// frequency/FOV/duration come from tourPhysics so narration and scenes agree).
const baseParams = {
  freqGHz: TOUR_FREQ_GHZ, decDeg: M87.dec, durationHr: TOUR_DURATION_HR,
  noise: 0, fovMuas: TOUR_FOV_MUAS,
};

// The opening baseline of Act B — one engine pair, named both in the scene and the prose.
const PAIR = ['ALMA', 'IRAM'];

export const TOUR_ACTS = [
  // ─── ACT A — RESOLUTION ────────────────────────────────────────────────────
  {
    actId: 'A',
    chapter: 'Chapter I · The Problem',
    title: 'The Resolution Problem',
    conceptTag: 'Resolution',
    headline: `One dish resolves ${P.str.thetaDish}. The shadow is ${P.str.m87Shadow}.`,
    compute: 'live-on-input',
    engineState: {
      stations: ARRAY_PRESETS['EHT 2017'],
      params: { ...baseParams, method: 'dirty', sourcePreset: 'point' },
    },
    liveEquation: {
      tex: '\\theta \\;\\approx\\; \\frac{\\lambda}{D} \\;\\longrightarrow\\; \\frac{\\lambda}{B}',
      values: () => [
        ['λ', P.str.lambda],
        ['D (one dish)', `100 m → θ = ${P.str.thetaDish}`],
        ['B (Earth-wide)', `${P.str.ehtBaseline} → θ = ${P.str.thetaEht}`],
        ['gain', P.str.improvement],
      ],
    },
    // One voice for every reader (W2.1): the physics exact, the language earned by it.
    narrative: `At λ = ${P.str.lambda}, even a ${P.dishD_m} m dish — among the largest instruments a human hand can steer — blurs everything finer than ${P.str.thetaDish} into a single soft glow. The shadow of M87* subtends ${P.str.m87Shadow}: some ${P.str.improvement} finer still. This is no engineering shortfall but diffraction itself, θ ≈ λ/D — sharpness is bought only with diameter, and no buildable dish closes that gap. What closes it is distance: trade one aperture's diameter for the separation B between two, and the scale a pair resolves becomes λ/B — kilometers of glass exchanged for thousands of kilometers of empty air.`,
    transition: 'cue',
    durationMs: 9000,
  },

  // ─── ACT B — THE SYNTHESIZED APERTURE (flagship) ─────────────────────────────
  {
    actId: 'B',
    chapter: 'Chapter II · The Solution',
    title: 'The Synthesized Aperture',
    conceptTag: 'Aperture Synthesis',
    headline: `Earth's spin turns ${P.str.nBaselines} into ${P.str.uMax} of coverage.`,
    compute: 'live-60fps',
    engineState: {
      stations: ARRAY_PRESETS['EHT 2017'],
      params: { ...baseParams },
      // The opening single baseline (real ARRAY_PRESETS coords).
      pair: PAIR,
    },
    liveEquation: {
      tex: 'u(H) \\;=\\; \\frac{B_x \\sin H + B_y \\cos H}{\\lambda}',
      values: () => [
        // bare counts — the row key already carries the noun (W1.2: no doubled tokens)
        ['stations', String(P.ehtStationCount)],
        ['baselines', String(P.ehtBaselineCount)],
        ['B_max (M87*)', P.str.ehtBaseline],
        ['|u|_max', P.str.uMax],
      ],
    },
    narrative: `Hold two dishes still — ${PAIR[0]} in the Atacama, ${PAIR[1]} in the Spanish Sierra — and together they measure one spatial tone of the sky: a single Fourier component of the brightness, at u = B/λ. Not a picture; one coefficient of one. But the ground beneath them refuses to hold still. As Earth turns, the baseline's projection toward M87* swings and stretches, and that lone tone glides along an ellipse through the (u,v) plane — a curve drawn by nothing moving except the planet. ${P.ehtStationCount} stations form ${P.ehtBaselineCount} such pairs; ${TOUR_DURATION_HR} hours of rotation stretch their ellipses to ${P.str.uMax} of coverage. The synthesized aperture is not a metaphor: point by computed point, the array assembles what a dish the size of Earth would have seen (Ryle, 1974).`,
    transition: 'cue',
    durationMs: 11000,
  },

  // ─── ACT C — FROM DATA TO IMAGE ──────────────────────────────────────────────
  {
    actId: 'C',
    chapter: 'Chapter II · The Solution',
    title: 'From Data to Image',
    conceptTag: 'Deconvolution',
    headline: 'Sparse data makes a dirty image. CLEAN recovers the source.',
    compute: 'live-on-input',  // CLEAN ≈ 98 ms on dev (audit §2) — live in both modes
    engineState: {
      stations: ARRAY_PRESETS['EHT 2017'],
      params: { ...baseParams, method: 'clean', sourcePreset: 'blackhole', progressEvery: 1 },
    },
    liveEquation: {
      tex: 'I_D = I_{sky} \\circledast B_D \\qquad r \\leftarrow r - \\gamma\\, B_D',
      values: () => [
        ['gain γ', '0.1'],
        ['stop', '3 σ_noise'],
        ['method', 'Högbom CLEAN'],
        ['samples', `${P.ehtBaselineCount} baselines`],
      ],
    },
    narrative: `${P.ehtBaselineCount} baselines sample just ${P.str.uvFill} of the (u,v) plane — a few bright threads pulled from an infinite weave. Invert that sparse record and the result is honest but haunted: the dirty image, I_D = I_sky ⊛ B_D, every true feature convolved with the instrument's own ghost, sidelobes radiating from each bright point. CLEAN (Högbom, 1974) is the exorcism, and it is almost embarrassingly simple — find the brightest point, subtract γ = 0.1 of the dirty beam there, repeat until what remains sinks below 3σ of the noise; the accumulated point model, re-convolved with a clean elliptical beam, is the image. Every subtraction on this screen, each step of the falling residual, runs live in this array's actual coverage — in about a tenth of a second.`,
    transition: 'computation-complete',
    durationMs: 12000,
  },

  // ─── ACT D — FIRST LIGHT ──────────────────────────────────────────────────────
  {
    actId: 'D',
    chapter: 'Chapter III · The Frontier',
    title: 'First Light',
    conceptTag: 'M87* · April 2019',
    headline: `A ${P.str.m87Shadow} shadow, 55 million light-years away.`,
    compute: 'precompute',
    engineState: {
      stations: ARRAY_PRESETS['EHT 2017'],
      params: { ...baseParams, method: 'clean', sourcePreset: 'blackhole' },
      photo: '../assets/eht-m87-2019.jpg',
    },
    liveEquation: {
      tex: '\\theta_{shadow} = \\frac{2\\sqrt{27}\\,GM}{c^2 d}',
      values: () => [
        ['shadow', P.str.m87Shadow],
        ['coefficient', '2√27'],
        ['array', `EHT 2017 · ${P.str.nStations}`],
        ['θ achieved', P.str.thetaEht],
      ],
    },
    narrative: `On 10 April 2019 the Event Horizon Telescope released the first photograph of a black hole: M87*, 55 million light-years away, its ring of lensed light ${P.str.m87Shadow} across — gravity's own silhouette, the shadow general relativity predicts at angular diameter ${P.shadowDiamFormula} for a mass of six and a half billion suns. The left panel is that photograph. The right is this simulator — the instrument you have been driving — given the same ring and the same ${P.str.nStations}, finding the same shadow. Neither side is an artist's impression: one is measured light; the other is the same mathematics, run before your eyes.`,
    transition: 'cue',
    durationMs: 9000,
  },

  // ─── ACT E — BEYOND EARTH & THE INSTRUMENT ───────────────────────────────────
  {
    actId: 'E',
    chapter: 'Chapter III · The Frontier',
    title: 'Beyond Earth',
    conceptTag: 'Space VLBI · BHEX',
    headline: `Lift one station to orbit and the aperture leaves the planet.`,
    compute: 'live-60fps',
    engineState: {
      stations: ARRAY_PRESETS['EHT 2017'],
      satellite: BHEX_PRESET,
      params: { ...baseParams },
    },
    liveEquation: {
      tex: 'B_{char} \\;\\sim\\; R_\\oplus + h',
      values: () => [
        ['altitude h', `${BHEX_PRESET.orbitalAltitudeKm.toLocaleString('en-US')} km`],
        ['B characteristic', P.str.bhexRadius],
        ['θ (characteristic)', P.str.bhexTheta],
        // The ONE place the integrity hedge is stated (W1.4) — on the relation itself.
        ['status', '⚠ pending sign-off (Marrone/Alejandro)'],
      ],
    },
    narrative: `Every baseline so far has been bounded by the planet that carries it — no two ground stations can stand farther apart than Earth's diameter. Lift one ${BHEX_PRESET.dishDiameter} m dish to orbit — BHEX — and that ceiling breaks: ground-to-space baselines sweep past the amber ring, toward a characteristic scale of order R⊕ + h ≈ ${P.str.bhexRadius} and a resolution near ${P.str.bhexTheta}. The relation is an order of magnitude, not an equality — true ground–space baselines are geometry-dependent, the numbers under expert review — but the geometry on screen is exact: every orange arc is the computed track of a real orbit over a real array. The next aperture is not a place; it is the volume of space we choose to thread with telescopes.`,
    transition: 'cue',
    durationMs: 10000,
    closing: true,  // last act: dispatches autoActions + opens the live tool
  },
];

export const ACT_BY_ID = Object.fromEntries(TOUR_ACTS.map(a => [a.actId, a]));
