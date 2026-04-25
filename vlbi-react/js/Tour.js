// Tour.js — 12-act full-screen physics tour with SVG diagrams.
import { html, useEffect, useRef } from './core.js';
import { TourCard } from './TourCard.js';

const TOUR_ACTS = [
  {
    title: "Why We Can't Just Build a Bigger Dish",
    paragraphs: [
      "A single radio dish resolves angular detail down to θ ≈ λ/D, where λ is wavelength and D is dish diameter. At 1.3 mm (230 GHz), even a 100 m dish — the largest steerable dish on Earth — yields only ~2.7 arcsecond resolution.",
      "The shadow of M87* subtends 42 microarcseconds: 70,000 times smaller than a 100 m dish can resolve. No physically plausible single dish could image a black hole shadow. The only solution is to make D effectively Earth's diameter — by linking many dishes into an interferometric array.",
      "The Rayleigh criterion gives the minimum resolvable angle: θ_min = 1.22 λ/D. At λ = 1.3 mm and D = 100 m, θ_min ≈ 3.3 arcsec = 11.9 × 10⁶ μas. M87*'s shadow of 42 μas requires D_eff ≥ 1.22 × 1.3 mm / 42 μas ≈ 9,500 km — only achievable with Earth-spanning VLBI.",
    ],
    hint: "Load the EHT 2017 array and notice how 28 baselines synthesize a virtual aperture the size of Earth.",
    diagramId: 1,
    autoActions: [{ type: 'resetForTour' }, { type: 'loadEHT' }],
  },
  {
    title: "Two Telescopes, One Fourier Component",
    paragraphs: [
      "Two telescopes separated by baseline B correlate their radio signals. Each telescope records the electric field E(t), timestamped with atomic clocks accurate to femtoseconds. The key observable is the visibility V₁₂ — the time-averaged product of the two fields, one delayed by τ to account for the extra path length.",
      "Each baseline measures exactly one Fourier coefficient of the sky brightness distribution. The angular scale it probes is set by baseline length divided by wavelength: u = B/λ. This is the fundamental sampling equation of aperture synthesis.",
      "The measured visibility is V₁₂(u,v) = ⟨A₁ · A₂*⟩ where A₁ and A₂ are the complex amplitudes recorded at each telescope. The geometric delay τ_g = B·ŝ/c compensates the path length difference between stations. The fringe rate ω_f = dφ/dt = (2π/λ) · B·(dŝ/dt) is the rate at which interference fringes cycle as Earth rotates.",
    ],
    hint: "Two telescopes are placed on the globe. Watch the single UV arc they trace as Earth rotates.",
    diagramId: 2,
    autoActions: [
      { type: 'resetForTour' },
      { type: 'addTelescope', lat: -23.029, lon: -67.755 },
      { type: 'addTelescope', lat: 19.823, lon: -155.478 },
    ],
  },
  {
    title: "Building the Fourier Plane",
    paragraphs: [
      "The van Cittert–Zernike theorem is the mathematical heart of interferometry: the visibility V(u,v) is exactly one Fourier coefficient of the sky brightness I(x,y). Each baseline samples one point in Fourier space (the UV plane). Conjugate symmetry gives us V*(u,v) = V(-u,-v), doubling our coverage.",
      "Short baselines measure large-scale structure; long baselines resolve fine detail. To recover the full image I(x,y), enough UV points must be sampled, then inverse-Fourier-transformed. With only a handful of baselines the reconstruction is incomplete — this is the fundamental challenge of sparse aperture synthesis.",
      "The van Cittert-Zernike theorem states: V(u,v) = ∫∫ I(l,m) exp(-2πi(ul+vm)) dl dm, where (l,m) are direction cosines and (u,v) = B/λ. This is a 2D Fourier transform — measuring V at enough (u,v) points and inverting gives I(l,m). Conjugate symmetry V(-u,-v) = V*(u,v) doubles coverage for real-valued I.",
    ],
    hint: "Load the EHT array and observe how each of the 28 baselines traces its own arc in the UV plane.",
    diagramId: 3,
    autoActions: [{ type: 'resetForTour' }, { type: 'loadEHT' }],
  },
  {
    title: "Earth Rotation Synthesis",
    paragraphs: [
      "As Earth rotates, the projected separation between each telescope pair changes in both length and direction. In the UV plane, each baseline traces an elliptical arc — its shape determined by baseline length, orientation, and source declination.",
      "The EHT observes M87* for ~4 hours per night, during which each baseline sweeps a substantial arc. With 8 stations there are 28 baselines, each sweeping its own arc — yielding 11,000+ UV samples per observation night. Longer observations mean denser UV coverage and sharper images.",
      "The UV coordinates at hour angle H for a baseline with components (Bx,By,Bz) in Earth-centered coords: u = (Bx·sin H + By·cos H) / λ, v = (-Bx·sin δ·cos H + By·sin δ·sin H + Bz·cos δ) / λ. As H advances over 12 hours, (u,v) traces an ellipse whose shape depends on declination δ and baseline orientation. This is TMS equation 4.1.",
    ],
    hint: "Drag the Duration slider — watch the UV arcs fill in as observation time increases.",
    diagramId: 4,
    autoActions: [],
  },
  {
    title: "Eight Telescopes, One Earth-Sized Dish",
    paragraphs: [
      "The EHT 2017 array linked 8 stations spanning Earth's full diameter: from the South Pole (SPT) to Greenland (GLT) and from Chile (ALMA/APEX) to Hawaii (SMA/JCMT). The maximum baseline exceeds 10,000 km, close to Earth's diameter.",
      "ALMA — the Atacama Large Millimeter/submillimeter Array — anchors the EHT array as its most sensitive station, with SEFD ~70 Jy. The longest ALMA baselines set the ultimate angular resolution: ~20 microarcseconds, sufficient to image the shadow of M87*.",
      "The angular resolution of an interferometer is θ_synth ≈ λ/B_max. For B_max = 10,900 km at λ = 1.3 mm: θ_synth ≈ 1.3×10⁻³/(1.09×10⁷) ≈ 1.2×10⁻¹⁰ rad ≈ 24 μas. The EHT achieved 20 μas resolution in 2017 — sufficient to resolve M87*'s 42 μas shadow with a beam-to-shadow ratio of ~2.1, comparable to imaging a grapefruit on the Moon.",
    ],
    hint: "Select EHT 2017 in the sidebar — all 8 stations load and the UV coverage fills in over 12 hours.",
    diagramId: 5,
    autoActions: [{ type: 'resetForTour' }, { type: 'loadEHT' }],
  },
  {
    title: "Not All Baselines Are Equal",
    paragraphs: [
      "Each telescope has a System Equivalent Flux Density (SEFD) — its noise floor. ALMA has SEFD ~70 Jy; the South Pole Telescope ~13,000 Jy. Per-baseline thermal noise scales as σ ∝ √(SEFD_i × SEFD_j): a baseline linking two ALMA-class dishes would be ~180× more sensitive than an SPT–JCMT baseline.",
      "This sensitivity structure shapes which Fourier components are measured reliably. Short, sensitive baselines constrain large-scale flux; long, noisy baselines resolve fine structure with large error bars. The SNR color mode on the UV map shows gold for ALMA-anchored baselines and grey for high-SEFD pairs.",
      "The thermal noise on baseline (i,j) is: σᵢⱼ = √(SEFDᵢ · SEFDⱼ) / √(2 · Δν · Δt). For Δν = 4 GHz bandwidth and Δt = 10 s integration: σ_ALMA-ALMA ≈ 10 mJy, σ_SPT-SMT ≈ 1,400 mJy. ALMA baselines are ~140× more sensitive — this is why almost every published EHT result depends on ALMA-anchored measurements.",
    ],
    hint: "Toggle SNR Color Mode on the UV map — gold arcs are ALMA-anchored; grey arcs have high thermal noise.",
    diagramId: 6,
    autoActions: [],
  },
  {
    title: "The Dirty Image",
    paragraphs: [
      "Inverse Fourier transforming the incomplete UV data produces the 'dirty image' — the true sky convolved with the array's point spread function (PSF), called the dirty beam. The dirty beam has a narrow central peak (the angular resolution) surrounded by sidelobes from missing UV coverage.",
      "For the EHT, dirty beam sidelobes are severe because UV coverage is sparse — 28 baselines versus millions for a filled aperture. These sidelobes create ringing artefacts that can mimic real source structure. Deconvolution algorithms like CLEAN remove them.",
      "The dirty image is I^D(l,m) = ∫∫ V(u,v)·S(u,v)·exp(+2πi(ul+vm)) du dv, where S(u,v) is the sampling function (1 where measured, 0 elsewhere). The dirty beam B^D is the Fourier transform of S(u,v). For EHT, peak sidelobes reach 30–50% of the main beam — a source with 1 Jy/beam flux creates ghost emission of 0.3–0.5 Jy/beam at every sidelobe position.",
    ],
    hint: "Click 'Dirty' in the Contour Map panel to see the raw reconstruction with sidelobe artefacts visible.",
    diagramId: 7,
    autoActions: [],
  },
  {
    title: "CLEAN Deconvolution",
    paragraphs: [
      "CLEAN, developed by Jan Högbom in 1974, iteratively finds the brightest peak in the dirty image, subtracts a fraction γ ≈ 0.1 of the dirty beam centred on that peak, and accumulates the subtracted flux as a 'clean component'. This repeats until residuals approach the noise floor.",
      "The clean components are then convolved with a smooth Gaussian 'clean beam' (sized to match the PSF's central peak) and residuals are added back. This removes sidelobes while preserving angular resolution. CLEAN is still used in virtually every radio image produced today.",
      "Convergence criterion: CLEAN stops when max|r| < 3σ_noise, where σ_noise is estimated from the outer 10% border pixels of the residual image (the MAD estimator: σ ≈ 1.4826 · median(|r − r̃|)). The restore beam is a Gaussian fitted to the dirty beam FWHM: for EHT + M87*, the beam is elliptical with major axis ~25 μas (N-S, less UV coverage) and minor axis ~18 μas (E-W, better coverage).",
    ],
    hint: "Click 'CLEAN' in the Contour Map to compare the deconvolved reconstruction against the dirty image.",
    diagramId: 8,
    autoActions: [{ type: 'setMethod', method: 'clean' }],
  },
  {
    title: "The Photon Ring of M87*",
    paragraphs: [
      "The shadow of M87* — a 6.5-billion solar mass black hole 55 million light-years away — subtends 42 microarcseconds. Surrounding it is a bright emission ring caused by photons spiralling near the event horizon before escaping toward us.",
      "On April 10, 2019, the EHT released the first image of a black hole. Four independent imaging teams using different algorithms all recovered consistent images. The 2022 EHT papers added polarimetric structure revealing the magnetic field threading the accretion flow at the event horizon.",
      "The shadow diameter is set by the photon sphere radius: r_shadow = 3√3 · GM/c² (Schwarzschild). At cosmological distance D_L: θ_shadow = 3√3 · GM/(c² · D_L). For M87*: M = 6.5×10⁹ M_☉, D_L = 16.8 Mpc → θ_shadow ≈ 42 μas. This matches the 2019 EHT result to within measurement uncertainty, providing one of the strongest tests of General Relativity to date.",
    ],
    hint: "The blackhole source is loaded. Run CLEAN and look for the ring structure in the Contour Map.",
    diagramId: 9,
    autoActions: [{ type: 'setPreset', preset: 'blackhole' }],
  },
  {
    title: "From EHT to ngEHT",
    paragraphs: [
      "The next-generation EHT (ngEHT) will add up to 10 new stations — filling geographic gaps in East Asia, Africa, South America, and the Arctic — growing from 8 to 17+ stations and from 28 to 136+ baselines.",
      "Denser UV coverage translates directly to reduced sidelobes, higher dynamic range, and the ability to reconstruct extended emission like the M87 jet base. The ngEHT also targets movie-mode imaging of Sgr A* — tracking structural changes across a single night as the accretion flow orbits the black hole.",
      "The number of baselines scales as N(N-1)/2: 8 stations → 28 baselines, 17 stations → 136 baselines — roughly as N². The ngEHT achieves ~4.9× more baselines and ~24× better UV sampling. Dynamic range scales approximately as √(N_baselines) × sensitivity, enabling movie-mode imaging of Sgr A* — resolving structural changes on timescales of minutes as the accretion flow orbits at ~6 Schwarzschild radii.",
    ],
    hint: "Switch to 'ngEHT Phase 1' in the array selector and compare UV coverage density against EHT 2017.",
    diagramId: 10,
    autoActions: [],
  },
  {
    title: "Beyond Earth: The BHEX Mission",
    paragraphs: [
      "The Black Hole Explorer (BHEX) is a proposed space-VLBI mission placing a 3.5 m dish in medium Earth orbit, extending baselines to ~35 Gigaλ — roughly 3× longer than Earth's diameter allows.",
      "At these baselines BHEX would resolve the photon ring of M87* at ~6 microarcseconds, enabling direct measurement of the ring's sharp lensed structure predicted by General Relativity. Ground-space baselines link the orbiting antenna to the full EHT ground array.",
      "Maximum baseline B_BHEX ≈ 26,562 + 6,371 = 32,933 km. At 300 GHz (λ = 1.0 mm): u_max = 32,933 km / 1.0 mm = 3.3×10¹⁰ λ = 33 Gλ. Angular resolution: θ = λ/B = 1.0 mm / 32,933 km ≈ 6.3 μas. The photon ring of M87* has diameter ~42 μas; at 6 μas resolution the ring is resolved with a beam-to-ring ratio of 7:1, enabling measurement of the ring's brightness asymmetry predicted by GR.",
    ],
    hint: "Click '+ BHEX Satellite' in the sidebar — watch the UV coverage extend to 35 Gλ baselines.",
    diagramId: 11,
    autoActions: [],
  },
  {
    title: "From Visibilities to Science",
    paragraphs: [
      "The full VLBI pipeline: raw visibilities → calibration → UV coverage → deconvolution → image quality metrics (dynamic range, beam FWHM, UV fill %) → FITS export with WCS headers for follow-up analysis in CASA, AIPS, or Astropy.",
      "The MetricsPanel shows key diagnostics: dynamic range (MAD estimator), beam FWHM in microarcseconds, UV fill percentage, and baseline count. Compare mode lets you run EHT 2017 and ngEHT Phase 1 side-by-side — seeing directly how improved UV coverage translates to sharper, higher dynamic-range images.",
      "Dynamic range is estimated as DR = S_peak / σ_MAD, where σ_MAD = 1.4826 · median(|border pixels − median|). For EHT 2017 + M87*, DR ≈ 50:1. For ngEHT Phase 1, DR ≈ 200:1 — sufficient to detect the counter-jet and resolve extended M87 jet structure. The FITS export with WCS headers allows direct import into CASA (importfits), Astropy (fits.open), and ds9 for side-by-side comparison with real EHT data.",
    ],
    hint: "Open the metrics panel (bottom-right of the globe) and try compare mode: EHT 2017 vs ngEHT Phase 1.",
    diagramId: 12,
    autoActions: [],
  },
];

export function Tour({ actIndex, onActChange, onClose, onTourAction, reducedMotion }) {
  const ranAutoRef = useRef(-1);

  useEffect(() => {
    if (ranAutoRef.current === actIndex) return;
    ranAutoRef.current = actIndex;
    const act = TOUR_ACTS[actIndex];
    act.autoActions?.forEach((action, i) => {
      setTimeout(() => onTourAction(action), i * 90);
    });
  }, [actIndex, onTourAction]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && actIndex < TOUR_ACTS.length - 1) onActChange(actIndex + 1);
      if (e.key === 'ArrowLeft' && actIndex > 0) onActChange(actIndex - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [actIndex, onClose, onActChange]);

  return html`
    <div className="tour-overlay" role="dialog" aria-modal="true" aria-label="VLBI Physics Tour">
      <${TourCard}
        act=${TOUR_ACTS[actIndex]}
        actIndex=${actIndex}
        totalActs=${TOUR_ACTS.length}
        onNext=${() => actIndex < TOUR_ACTS.length - 1 ? onActChange(actIndex + 1) : onClose()}
        onBack=${() => actIndex > 0 && onActChange(actIndex - 1)}
        onSkip=${onClose}
        onJump=${onActChange}
        reducedMotion=${reducedMotion}
      />
    </div>
  `;
}
