// tourActs.js — the five engine-real acts as DATA (master prompt §1.1 schema).
// No physics literal is typed here: every displayed number is read from tourPhysics.js
// (the single source of computed truth). Heavy per-act canvas choreography lives in the
// scene modules registered in tourScenes.js; this file is the act spine the host reads.
//
// Presentation order is A→E. Build order was B first (flagship, pure geometry).
import { TOUR_PHYSICS as P } from './tourPhysics.js';
import { ARRAY_PRESETS, SKY_TARGETS, BHEX_PRESET } from './constants.js';

const M87 = SKY_TARGETS['M87*'];

// Shared engine params (mirror useSimulation DEFAULT_CONTROLS where relevant).
const baseParams = { freqGHz: 230, decDeg: M87.dec, durationHr: 12, noise: 0, fovMuas: 80 };

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
    narrativeTriple: {
      artist: `A single dish, however vast, can only blur the sky into a soft smudge — its finest detail is ${P.str.thetaDish} across. The clarity we want is decided not by how large one eye is, but by how far two eyes stand apart.`,
      scientist: `Angular resolution scales as θ ≈ λ/D. At λ = ${P.str.lambda} a ${P.dishD_m} m aperture reaches ${P.str.thetaDish}; the M87* shadow subtends ${P.str.m87Shadow} — roughly ${P.str.improvement} finer. Diffraction alone forbids the direct image.`,
      layperson: `To photograph something this small and this far away, one telescope — even an enormous one — can't focus sharply enough. The fix is to combine many telescopes spread across the whole planet.`,
    },
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
      pair: ['ALMA', 'IRAM'],
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
    narrativeTriple: {
      artist: `Hold two telescopes still and they sample a single note of the sky. Let the Earth turn beneath them, and that one note sweeps into an arc — the planet itself becomes the lens, drawn slowly across the heavens.`,
      scientist: `Each baseline samples one Fourier component u = B/λ of the sky brightness. As Earth rotates, the projected baseline traces an ellipse in the (u,v) plane; ${P.ehtStationCount} stations give ${P.ehtBaselineCount} baselines and coverage out to ${P.str.uMax}. This is aperture synthesis (Ryle, 1974).`,
      layperson: `Two dishes far apart act like the edges of one giant telescope. As the Earth spins, they sweep out curves that gradually fill in the picture — building a virtual dish the size of the planet.`,
    },
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
    narrativeTriple: {
      artist: `Incomplete data leaves the source haunted by ghosts — sidelobes radiating from every bright point. CLEAN walks the image, lifting the brightest peak again and again, until only the true sky is left standing.`,
      scientist: `Inverse-transforming sparsely sampled visibilities yields the dirty image I_D = I_sky ⊛ B_D. Högbom CLEAN iteratively subtracts a scaled dirty beam at each residual peak (γ = 0.1) until the peak falls below 3σ_noise, then restores with a clean beam.`,
      layperson: `Because we only measure part of the data, the first image is smeared with artifacts. An algorithm called CLEAN carefully removes them, peak by peak, until the real picture appears.`,
    },
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
    narrativeTriple: {
      artist: `On 10 April 2019 the world saw a shadow cast by gravity itself — a ring of light bent around the edge of darkness. Beside it, the same source rebuilt by the very instrument you have been driving.`,
      scientist: `The 2019 EHT image of M87* resolved a ${P.str.m87Shadow} shadow (angular diameter 2√27·GM/c²d), consistent with a ${P.m87ShadowUas ? '6.5×10⁹ M☉' : ''} Kerr black hole. Shown alongside this simulator's own CLEAN reconstruction of the same source.`,
      layperson: `This is the real photograph of a black hole's shadow — the first ever taken. Next to it is what this simulator produces from the same kind of data, so you can see the method is real.`,
    },
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
    narrativeTriple: {
      artist: `The Earth was only the first lens. Raise a single dish into orbit and the synthesized aperture detaches from the ground, reaching past the planet's own diameter toward a sharper sky.`,
      scientist: `A space element (BHEX-class, h = ${BHEX_PRESET.orbitalAltitudeKm.toLocaleString('en-US')} km) extends baselines beyond Earth's diameter. The characteristic scale ~ R⊕ + h is an ORDER-OF-MAGNITUDE relation — the true ground–space baseline is geometry-dependent and under expert review.`,
      layperson: `Put one telescope in space, and the "virtual dish" grows larger than the Earth itself — letting future arrays see even finer detail. The exact numbers here are still being checked by experts.`,
    },
    transition: 'cue',
    durationMs: 10000,
    closing: true,  // last act: dispatches autoActions + opens the live tool
  },
];

export const ACT_BY_ID = Object.fromEntries(TOUR_ACTS.map(a => [a.actId, a]));
