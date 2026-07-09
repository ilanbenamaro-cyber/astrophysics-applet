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
        ['D (one dish)', `${P.dishD_m} m → θ = ${P.str.thetaDish}`],
        ['B (Earth-wide)', `${P.str.ehtBaseline} → θ = ${P.str.thetaEht}`],
        ['gain', P.str.improvement],
      ],
    },
    // One voice for every reader (W2.1): the physics exact, the language earned by it.
    // narrative is an ARRAY of paragraphs (S1.2) — Tour.js maps each to its own <p>.
    narrative: [
      `On the canvas a single point of light — the simplest source the sky can offer — passes through two instruments at once. Through one dish it spreads into a wide, soft disc; through an Earth-spanning array it stays nearly a point. Nothing about the source differs between the two views. What differs is the aperture, and the blur is not a flaw to be polished away: it is diffraction, the wave nature of light itself, setting a hard floor on how finely any aperture can see.`,
      `That floor is the equation below, θ ≈ λ/D. At λ = ${P.str.lambda} — the millimetre band where the atmosphere turns transparent to a black hole's glow — even a ${P.dishD_m} m dish, among the largest instruments a human hand can steer, blurs everything finer than ${P.str.thetaDish} into a single soft glow. The shadow of M87* subtends ${P.str.m87Shadow}: some ${P.str.improvement} finer still. This is no engineering shortfall; sharpness is bought only with diameter, and no buildable dish closes that gap.`,
      `What closes it is distance. Trade one aperture's diameter for the separation B between two, and the scale a pair resolves becomes λ/B — kilometers of glass exchanged for thousands of kilometers of empty air. Stretch B to ${P.str.ehtBaseline}, the longest ground separation that can hold M87* in view, and θ falls to ${P.str.thetaEht}: fine enough that the shadow stops being a point and becomes a shape. This is precisely the wager the Event Horizon Telescope made — not a larger dish, but a planet's worth of distance between modest ones, all observing together at ${P.freqGHz} GHz.`,
    ],
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
    narrative: [
      `Hold two dishes still — ${PAIR[0]} in the Atacama, ${PAIR[1]} in the Spanish Sierra — and together they measure one spatial tone of the sky: a single Fourier component of the brightness, at spatial frequency u = B/λ. Not a picture; one coefficient of one. An interferometer never photographs the sky. It samples the sky's Fourier transform, one projected baseline at a time, and the image must be earned afterward, by mathematics.`,
      `But the ground beneath them refuses to hold still. As Earth turns, the baseline's projection toward M87* swings and stretches — that is what the equation below records: u(H) is nothing more than the shadow the baseline casts on the sky's plane as the hour angle H advances. The lone tone glides along an ellipse through the (u,v) plane, a curve drawn by nothing moving except the planet. On the globe above, that geometry runs live; drag across the scene and you are scrubbing the hour angle yourself, steering the same projection the equation describes.`,
      `Now multiply the trick. ${P.ehtStationCount} stations form ${P.ehtBaselineCount} such pairs, each tracing its own ellipse at its own orientation and scale, and ${TOUR_DURATION_HR} hours of rotation stretch them into ${P.str.uMax} of coverage. The widest of them — ${P.ehtM87MaxPair[0]} to ${P.ehtM87MaxPair[1]}, ${P.str.ehtBaseline} — sets the finest detail the whole array can recover, the ${P.str.thetaEht} the first chapter promised. Notice what was purchased without building anything: no dish moved, no part was machined; the coverage was paid for in patience while the planet rotated.`,
      `The synthesized aperture is therefore not a metaphor. Point by computed point, the array assembles what a dish the size of Earth would have seen — the insight for which Martin Ryle shared the Nobel Prize (1974), carried by the EHT from arrays kilometers across to one the width of the planet. Every ellipse on this screen is real geometry from the real ${P.str.nStations} of April 2017, and the coverage accumulating before you is, pair for pair, the kind of record from which the first image of a black hole was computed.`,
    ],
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
      params: { ...baseParams, method: 'clean', sourcePreset: 'blackhole' },
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
    narrative: [
      `Begin with what the array actually records. ${P.ehtBaselineCount} baselines, even stretched by ${TOUR_DURATION_HR} hours of rotation, chart just ${P.str.uvFill} of the surveyed (u,v) frame — a few bright threads pulled from an infinite weave. The left panel shows exactly those threads: every visibility this array measures of the ring, and nothing else. Everything between the threads is simply unknown, and no algorithm can be permitted to forget that.`,
      `Invert that sparse record and the result is honest but haunted. The middle panel is the dirty image, I_D = I_sky ⊛ B_D: every true feature convolved with the instrument's own ghost, the dirty beam B_D — the pattern this exact coverage would record for a perfect point of light. Sidelobes radiate from each bright spot; rings that are not in the sky braid through rings that are. The corruption is not noise. It is structure: the precise, computable signature of the holes in the coverage.`,
      `CLEAN (Högbom, 1974) is the exorcism, and it is almost embarrassingly simple. Find the brightest point in the dirty image; trust a fraction of it; subtract γ = 0.1 of the dirty beam centred there; repeat, hundreds upon hundreds of times, until what remains sinks below 3σ of the noise. The accumulated point model, re-convolved with a clean elliptical beam and rejoined to the residual, is the image in the right panel. Each step of the falling residual you watch is the algorithm running live in this array's actual coverage — not a recording of it.`,
      `Real visibilities also arrive wearing thermal noise, the receivers' own warmth stirred into the signal. Drag the noise control and watch the reconstruction degrade gracefully, then collapse: CLEAN can subtract the instrument's signature, but it cannot subtract ignorance. This is why the EHT anchors itself on raw sensitivity — ALMA's system-equivalent flux density of ${P.str.almaSefd} is the quietest in the array, and pairing every station with it lifts the faintest fringes above the floor.`,
      `Hold the scale in mind while the residual falls: the ring being recovered spans ${P.str.m87Shadow} inside a field of view only ${TOUR_FOV_MUAS} μas wide, resolved by a beam near ${P.str.thetaEht}. The 2019 M87* analysis ran this same logic — alongside newer methods that independently agree with it — through its ${P.str.nBaselines} of real data over months of careful work; here the whole pipeline, transform to deconvolution, completes in about a tenth of a second.`,
    ],
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
    narrative: [
      `On 10 April 2019 the Event Horizon Telescope released the first image humanity has ever made of a black hole: M87*, the central mass of the galaxy Messier 87, 55 million light-years away in the Virgo cluster. The left panel is that measurement — radio light gathered across one April week in 2017 by ${P.str.nStations} scattered over the planet, correlated, calibrated, and reconstructed. No artist drew any part of it.`,
      `The dark centre is not the event horizon itself but its shadow: the silhouette gravity casts when spacetime bends light around a mass. General relativity fixes its angular diameter at ${P.shadowDiamFormula} — the mass M sets the physical size, the distance d projects it onto our sky, and the strange coefficient 2√27 is pure geometry, the capture cross-section for photons that skim the hole. For six and a half billion suns at M87*'s distance the prediction is ${P.str.m87Shadow}. The bright ring around the darkness is lensed light, bent through the hole's vicinity and flung toward us, brighter on the side rotating our way.`,
      `${P.str.m87Shadow} deserves a pause. It is roughly the angle an orange would subtend on the surface of the Moon, seen from Earth — and it is not much larger than the ${P.str.thetaEht} the array can resolve at all. The image exists inside a margin of barely a factor of two between the size of the thing and the sharpest scale a planet-wide instrument reaches. A slightly smaller Earth, a slightly longer wavelength, and there would have been no ring — only an unresolved smudge where a prediction went untested.`,
      `The right panel is this simulator — the instrument you have been driving through every act — given the same ring and the same ${P.str.nStations}, run through the same sparse coverage and the same deconvolution, finding the same shadow. Neither side is an artist's impression: one is measured light; the other is the same mathematics, executed before your eyes. The image was not taken. It was computed — and the computation is small enough to hold in your hands.`,
    ],
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
    narrative: [
      `Every baseline so far has been bounded by the planet that carries it — no two ground stations can stand farther apart than Earth's diameter, and for M87* the practical ceiling is ${P.str.ehtBaseline}, set by the last pair of dishes that can hold the source above both horizons at once. The amber circle on screen marks that ceiling. Ground-based millimetre VLBI has, in the strictest sense, finished growing: to see finer you must either shorten the wavelength or leave.`,
      `Leaving is the proposal called BHEX, the Black Hole Explorer: a ${BHEX_PRESET.dishDiameter} m dish lifted to an orbit ${BHEX_PRESET.orbitalAltitudeKm.toLocaleString('en-US')} km up, forming baselines not between two points of rock but between rock and spacecraft. The relation below is deliberately rough — the characteristic baseline grows toward the orbital radius, R⊕ + h ≈ ${P.str.bhexRadius}, but a true ground-to-space separation swings with the geometry of every pass: an order of magnitude, not an equality. What the screen draws, though, is exact. Every orange arc is the computed (u,v) track of a real orbit over the real ${P.str.nStations}, sweeping past the limit no ground pair can cross.`,
      `The prize is resolution near ${P.str.bhexTheta} — a few times finer than the ${P.str.thetaEht} the ground array reaches. At that sharpness the ring of M87* stops being a single band of light: theory predicts it resolves into nested sub-rings, each traced by photons that completed one more half-orbit of the black hole before escaping, each a sharper and purer engraving of the spacetime that bent them. Reading that substructure would test general relativity not at the edge of a blur but in its own handwriting.`,
      `The pattern is the one this whole story has obeyed: when the aperture you have is too small, you stop building dishes and start claiming distance. The next aperture is not a place; it is the volume of space we choose to thread with telescopes. And what follows this act is not another act — it is the simulator itself, the same engine that drew every scene you have watched, with every station, orbit, and slider now yours.`,
    ],
    transition: 'cue',
    durationMs: 10000,
    closing: true,  // last act: dispatches autoActions + opens the live tool
  },
];

