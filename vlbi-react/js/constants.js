// App-wide constants shared across components and worker.
export const IMAGE_SIZE = 512;
export const EARTH_RADIUS_KM = 6371;

// Globe camera distance (Earth radius = 1 world unit; OrbitControls clamps 1.4–6).
// Compare-mode panes are narrower, so they start further out to frame the whole array.
export const COMPARE_CAMERA_DISTANCE = 4.2;

// When a space telescope (BHEX) is toggled on, ease the globe camera out to here so
// the full orbit ring (drawn at radius 1.5 in globeHelpers) is visible, not clipped.
export const BHEX_VIEW_DISTANCE = 4.5;

export const TELESCOPE_COLORS = [
  '#ff6b6b','#4ecdc4','#feca57','#48dbfb',
  '#ff9f43','#a29bfe','#55efc4','#fd79a8',
  '#e17055','#74b9ff','#00cec9','#6c5ce7',
  '#fdcb6e','#00b894','#d63031','#e84393','#0984e3',
];

export const ARRAY_PRESETS = {
  'EHT 2017': [
    { name: 'ALMA',  lat: -23.0229, lon:  -67.7552 },
    { name: 'APEX',  lat: -23.0057, lon:  -67.7592 },
    { name: 'SMA',   lat:  19.8232, lon: -155.4780 },
    { name: 'LMT',   lat:  18.9858, lon:  -97.3147 },
    { name: 'IRAM',  lat:  37.0662, lon:   -3.3924 },
    { name: 'SMT',   lat:  32.7016, lon: -109.8719 },
    { name: 'SPT',   lat: -89.9944, lon:  -44.6502 },
    { name: 'JCMT',  lat:  19.8228, lon: -155.4772 },
  ],
  'EHT 2022': [
    { name: 'ALMA',  lat: -23.0229, lon:  -67.7552 },
    { name: 'APEX',  lat: -23.0057, lon:  -67.7592 },
    { name: 'SMA',   lat:  19.8232, lon: -155.4780 },
    { name: 'LMT',   lat:  18.9858, lon:  -97.3147 },
    { name: 'IRAM',  lat:  37.0662, lon:   -3.3924 },
    { name: 'SMT',   lat:  32.7016, lon: -109.8719 },
    { name: 'SPT',   lat: -89.9944, lon:  -44.6502 },
    { name: 'JCMT',  lat:  19.8228, lon: -155.4772 },
    { name: 'GLT',   lat:  76.5351, lon:  -68.7031 },
    { name: 'NOEMA', lat:  44.6338, lon:    5.9079 },
    { name: 'KP12m', lat:  31.9563, lon: -111.6149 },
  ],
  'ngEHT Phase 1': [
    { name: 'ALMA',  lat: -23.0229, lon:  -67.7552 },
    { name: 'APEX',  lat: -23.0057, lon:  -67.7592 },
    { name: 'SMA',   lat:  19.8232, lon: -155.4780 },
    { name: 'LMT',   lat:  18.9858, lon:  -97.3147 },
    { name: 'IRAM',  lat:  37.0662, lon:   -3.3924 },
    { name: 'SMT',   lat:  32.7016, lon: -109.8719 },
    { name: 'SPT',   lat: -89.9944, lon:  -44.6502 },
    { name: 'JCMT',  lat:  19.8228, lon: -155.4772 },
    { name: 'GLT',   lat:  76.5351, lon:  -68.7031 },
    { name: 'NOEMA', lat:  44.6338, lon:    5.9079 },
    { name: 'KP12m', lat:  31.9563, lon: -111.6149 },
    { name: 'BAJA',  lat:  31.0443, lon: -115.4567 },
    { name: 'OVRO',  lat:  37.2314, lon: -118.2822 },
    { name: 'HAY',   lat:  42.6233, lon:  -71.4882 },
    { name: 'GAM',   lat: -23.3472, lon:   16.2317 },
    { name: 'CNI',   lat:  28.7624, lon:  -17.8920 },
    { name: 'SGO',   lat: -33.4005, lon:  -70.6692 },
  ],
};

export const STATION_SEFD = {
  'ALMA':  94,    'APEX':  4700,  'JCMT':  4500,  'SMA':   6200,
  'LMT':   1000,  'IRAM':  1900,  'SMT':   17100, 'SPT':   19300,
  'GLT':   12000, 'NOEMA': 700,   'KP12m': 13000,
  // ngEHT/BHEX: estimated 10,000 Jy pending validation
  'BAJA':  10000, 'OVRO':  10000, 'HAY':   10000,
  'GAM':   10000, 'CNI':   10000, 'SGO':   10000, 'BHEX':  10000,
};

// Physical single-dish diameters [m] per station (Alejandro note N5). For phased
// stations (ALMA, SMA, NOEMA) this is the ELEMENT dish: the primary-beam FOV the
// worker's θ≈λ/D taper models is set per element, not by the phased sum.
// Sources: EHT 2019 Paper II Table 1 (2017/2022 stations); ngEHT Reference Array,
// arXiv:2306.08787 (OVRO = 10.4 m Leighton, HAY = 37 m Haystack, GAM = 15 m Africa
// Millimetre Telescope, BAJA/CNI/SGO = refurbished 6.1 m BIMA dishes).
// Confirmed (Ilan, delegated authority from A. Cárdenas-Avendaño, 2026-07-07).
// LMT 50 m / SPT 10 m are full apertures — the stable version-independent values
// (2017 ops illuminated ~32.5 m / ~6 m respectively; caveat kept here, not baked in).
export const DISH_DIAMETERS = {
  'ALMA': 12,   'APEX': 12,   'SMA': 6,    'LMT': 50,
  'IRAM': 30,   'SMT': 10,    'SPT': 10,   'JCMT': 15,
  'GLT': 12,    'NOEMA': 15,  'KP12m': 12,
  'BAJA': 6.1,  'OVRO': 10.4, 'HAY': 37,   'GAM': 15,
  'CNI': 6.1,   'SGO': 6.1,
  'BHEX': 3.4,  // matches BHEX_PRESET.dishDiameter
};

// Custom-image regime (Alejandro's prescription, CUSTOM-SOURCE-PHYSICS.md): a user image
// never inherits a target's astrophysical units — it gets its own angular scale. The image
// fills a fixed fraction of the field.
export const CUSTOM_SOURCE_FRACTION = 0.9;
// The default field is the measured on-grid "BHEX window" (USER-IMAGE BHEX WINDOW section):
// at ~350 μas with EHT 2022 the Earth-only reconstruction is legibly partial and adding
// BHEX visibly completes it (the two-regime landing point; handleTargetChange also loads
// EHT 2022 there). Users can rescale via the size slider.
export const CUSTOM_DEFAULT_FOV_UAS = 350;
// The EHT 2017 coverage sweet spot (recovery peaks near here; occupancy ∝ 1/FOV² degrades
// larger fields) — used only in the ResolutionBudget coverage lesson, NOT as the default.
export const EHT2017_SWEETSPOT_FOV_UAS = 800;
// Above this custom field, BHEX's ~30 Gλ baselines alias off the N=512 grid (measured,
// CUSTOM-SOURCE-PHYSICS.md "BHEX CONTRIBUTION"). The guided "add BHEX" prompt only appears
// at/below it, where enabling BHEX genuinely helps on-grid.
export const BHEX_ONGRID_CEILING_UAS = 1760;

export const BHEX_PRESET = {
  name: 'BHEX',
  type: 'space',
  orbitalAltitudeKm: 26562,
  inclinationDeg: 86,
  raanDeg: 277.7,
  periodHours: 12,
  dishDiameter: 3.4,
  sefd: 10000,
  color: '#FFD700',
};

// Distances are SOURCED (physics-before-validation rule) and cited per entry. 3C 279 is a
// cosmological-redshift source: "distance" is ambiguous (luminosity/comoving/light-travel
// differ), so it carries redshift + light-travel time, explicitly NOT a metric distance.
// Only the tour's M87* distance is displayed today; the rest enrich the shared target model.
export const SKY_TARGETS = {
  // Distance 16.8 (-0.7/+0.8) Mpc ≈ 55 Mly — EHT 2019 Paper VI (arXiv:1906.11243)
  'M87*':   { ra: 187.706, dec: 12.391,  description: 'Supermassive BH in Virgo A — primary EHT target', shadowUas: 42,   distanceMpc: 16.8, distanceMly: 55 },
  // Distance 8.15 kpc ≈ 26,700 ly — GRAVITY Collaboration (Galactic-center R0)
  'Sgr A*': { ra: 266.417, dec: -29.008, description: 'Milky Way galactic center BH',                     shadowUas: 50,   distanceKpc: 8.15, distanceLy: 26700 },
  // z ≈ 0.536; light-travel time ~5.4 Gyr (standard ΛCDM, H0≈70) — NOT a metric distance
  '3C 279': { ra: 194.047, dec: -5.789,  description: 'Bright blazar, primary EHT calibrator',            shadowUas: null, redshift: 0.536, lightTravelGyr: 5.4 },
  // Distance 3.8 ± 0.1 Mpc ≈ 12 Mly — Harris, Rejkuba & Harris 2010 (arXiv:0911.3180)
  'Cen A':  { ra: 201.365, dec: -43.019, description: 'Nearest radio galaxy (NGC 5128)',                  shadowUas: null, distanceMpc: 3.8,  distanceMly: 12 },
  'Custom': { ra: null,    dec: null,     description: 'Set declination and source size manually',         shadowUas: null },
};

// Formats a target's distance for display, honestly per measure: a metric distance in
// dual units for the galaxies / Galactic center, and light-travel (never a metric
// "distance") for the cosmological-redshift quasar 3C 279. Returns { label, value, ly }
// or null when no distance data exists (e.g. Custom). Single source for both the tour
// and the live-app target readout.
export function formatTargetDistance(target) {
  if (!target) return null;
  if (target.distanceMpc != null)
    return { label: 'Distance', value: `${target.distanceMpc} Mpc or ${target.distanceMly} million light-years`, ly: `${target.distanceMly} million light-years` };
  if (target.distanceKpc != null)
    return { label: 'Distance', value: `${target.distanceKpc} kpc or ${target.distanceLy.toLocaleString('en-US')} light-years`, ly: `${target.distanceLy.toLocaleString('en-US')} light-years` };
  if (target.redshift != null)
    return { label: 'Light-travel', value: `~${target.lightTravelGyr} billion light-years (z ≈ ${target.redshift})`, ly: `~${target.lightTravelGyr} billion light-years` };
  return null;
}

export const INFO = {
  globe:       { title: 'Radio Telescope Globe',    body: 'Click anywhere on Earth to place a radio telescope. Every pair of telescopes forms a "baseline" — like a giant antenna spanning the distance between them. More telescopes = more baselines = sharper images.' },
  uvmap:       { title: 'UV-Plane Coverage',        body: 'As Earth rotates, each telescope pair sweeps an arc through Fourier space (the UV-plane). Each point sampled corresponds to one spatial frequency of the sky. The axis range is fixed to the array’s BHEX-enabled coverage extent, labeled in gigawavelengths (Gλ) — so toggling BHEX changes the coverage drawn, never the axes. The relative-coverage percentage counts sampled cells on the same fixed frame: it rises as coverage grows and ranks arrays against each other, but is not an absolute completeness. Dense, uniform coverage produces higher-fidelity reconstruction.' },
  dirty:       { title: 'Dirty Image',              body: 'The raw result of taking the inverse Fourier transform of only the sampled UV points (with zeros elsewhere). Artifacts called "sidelobes" appear because we only measured some Fourier frequencies.' },
  restored:    { title: 'Restored Image',           body: 'After applying a deconvolution algorithm (Max Entropy or CLEAN), many sidelobes are suppressed. This is closer to the true sky, but resolution is still limited by the longest sampled baseline.' },
  ground:      { title: 'Ground Truth',             body: 'The original image we are trying to reconstruct. In real radio astronomy, we never have this — only the raw telescope data. This simulator lets you compare what we recover vs. the actual source.' },
  noise:       { title: 'Thermal Noise',            body: 'Radio receivers add random electronic noise to every measurement. Noise scales as sqrt(SEFD_i × SEFD_j) per baseline — ALMA (94 Jy) produces ~0.07× the noise of SMT (17,100 Jy) on shared baselines, reflecting its much larger collecting area. Higher noise amplitude makes the reconstruction blurrier and noisier.' },
  frequency:   { title: 'Observing Frequency',      body: 'Higher frequencies (shorter wavelengths) give finer resolution because the UV coordinates scale as u = baseline/λ. The EHT observes at 230 GHz (1.3 mm wavelength) for maximum resolution.' },
  duration:    { title: 'Synthesis Duration',       body: 'Earth rotates 360° in 24 hours. Longer observations allow each baseline to sweep more of the UV-plane, improving image quality. The EHT typically observes a source for 6–12 hours per night.' },
  declination: { title: 'Source Declination',       body: 'The angular distance of the target source from the celestial equator. Sources near the equator (δ ≈ 0°) produce roughly circular UV tracks; polar sources produce more compact, circular tracks. Elevation cutoffs (min 10°) are applied per telescope — stations that cannot see the source at a given hour angle contribute no UV samples.' },
  method:      { title: 'Reconstruction Method',    body: '"Dirty only": raw IFFT with no cleanup. "CLEAN": iteratively subtracts the PSF to remove sidelobe artifacts — the standard method in radio astronomy. "Max Entropy": gradient descent maximising image entropy under a data-fidelity constraint — favours smooth, positive images used by the EHT team alongside CLEAN.' },
  dish:        { title: 'Dish Diameter',            body: 'Larger dishes collect more signal (better sensitivity). The angular field of view of each telescope is roughly λ/D radians. This does not change the UV coverage but affects sensitivity and how much sky is imaged at once. The default is the mean physical dish diameter of the selected array preset (the EHT 2022 mean when no EHT stations are loaded).' },
  contours:    { title: 'Contour Overlays',         body: 'Logarithmic contour lines drawn over the reconstructed image at three brightness levels: 50% of peak (solid white), 10% of peak (semi-transparent white), and 1% of peak (dashed white). This is the standard display format in radio astronomy publications. Contours reveal the dynamic range of the reconstruction — how much faint structure exists around the bright central source.' },
  contourmap:  { title: 'Contour Map',              body: 'A professional radio astronomy contour map showing the brightness distribution. The viridis colormap (blue→green→yellow) is perceptually uniform and colorblind-safe — the standard in modern astronomy publications. White contour lines are drawn at 50%, 10%, and 2% of the peak brightness, filtered to only show where signal exceeds 2× the noise floor (estimated from border pixels). The beam ellipse in the lower-right shows the angular resolution of the array. Toggle between the CLEAN/Max Entropy reconstruction and the dirty image to see how deconvolution removes sidelobe artifacts. Angular axis labels show the true physical scale of the image in microarcseconds (μas).' },
  fov:         { title: 'Image Field of View',       body: 'The total angular size of the image in microarcseconds (μas). Sets the physical pixel scale: pixel scale = FOV / N μas/pixel. Default is 80 μas — M87* physical scale. The 2019 EHT M87* images used an ~80 μas FOV at 1–2 μas/pixel. EHT baselines sample the inner portion of the UV grid at this scale.' },
  sourceSize:  { title: 'Source Angular Size',       body: 'Source angular size. For named targets (M87*, Sgr A*), physically derived: M87* shadow = 42 μas, Sgr A* = 50 μas. The image is scaled so its MEASURED bright ring (radial-profile peak) spans shadowUas / FOV of the field — the ring, not the image frame, carries the physical size. For point-like or extended sources (no measurable ring) and Custom targets, the frame fraction is used directly.' },
};

// ISO 3166-1 numeric → display name for dynamic country label generation
export const ISO_COUNTRY_NAMES = {
  4:'Afghanistan', 8:'Albania', 12:'Algeria', 24:'Angola', 32:'Argentina',
  36:'Australia', 40:'Austria', 50:'Bangladesh', 56:'Belgium', 64:'Bhutan',
  68:'Bolivia', 72:'Botswana', 76:'Brazil', 100:'Bulgaria', 104:'Myanmar',
  116:'Cambodia', 120:'Cameroon', 124:'Canada', 140:'C. African Rep.',
  144:'Sri Lanka', 152:'Chile', 156:'China', 170:'Colombia', 178:'Congo',
  180:'DR Congo', 188:'Costa Rica', 192:'Cuba', 196:'Cyprus', 203:'Czech Rep.',
  204:'Benin', 208:'Denmark', 218:'Ecuador', 222:'El Salvador', 231:'Ethiopia',
  232:'Eritrea', 246:'Finland', 250:'France', 266:'Gabon', 276:'Germany',
  288:'Ghana', 300:'Greece', 304:'Greenland', 320:'Guatemala', 324:'Guinea',
  332:'Haiti', 340:'Honduras', 348:'Hungary', 356:'India', 360:'Indonesia',
  364:'Iran', 368:'Iraq', 372:'Ireland', 376:'Israel', 380:'Italy',
  388:'Jamaica', 392:'Japan', 398:'Kazakhstan', 400:'Jordan', 404:'Kenya',
  408:'N. Korea', 410:'S. Korea', 414:'Kuwait', 418:'Laos', 422:'Lebanon',
  426:'Lesotho', 428:'Latvia', 430:'Liberia', 434:'Libya', 440:'Lithuania',
  442:'Luxembourg', 450:'Madagascar', 454:'Malawi', 458:'Malaysia', 466:'Mali',
  484:'Mexico', 496:'Mongolia', 498:'Moldova', 504:'Morocco', 508:'Mozambique',
  516:'Namibia', 524:'Nepal', 528:'Netherlands', 540:'New Caledonia',
  554:'New Zealand', 558:'Nicaragua', 562:'Niger', 566:'Nigeria', 578:'Norway',
  586:'Pakistan', 591:'Panama', 598:'Papua NG', 600:'Paraguay', 604:'Peru',
  608:'Philippines', 616:'Poland', 620:'Portugal', 634:'Qatar', 642:'Romania',
  643:'Russia', 682:'Saudi Arabia', 686:'Senegal', 694:'Sierra Leone',
  703:'Slovakia', 705:'Slovenia', 706:'Somalia', 710:'S. Africa', 716:'Zimbabwe',
  724:'Spain', 729:'Sudan', 740:'Suriname', 748:'Eswatini', 752:'Sweden',
  756:'Switzerland', 760:'Syria', 762:'Tajikistan', 764:'Thailand',
  780:'Trinidad', 788:'Tunisia', 792:'Turkey', 795:'Turkmenistan',
  800:'Uganda', 804:'Ukraine', 784:'UAE', 818:'Egypt', 826:'UK',
  840:'USA', 858:'Uruguay', 860:'Uzbekistan', 862:'Venezuela', 887:'Yemen',
  894:'Zambia', 704:'Vietnam', 158:'Taiwan', 807:'N. Macedonia',
  70:'Bosnia & Herz.', 191:'Croatia', 499:'Montenegro', 688:'Serbia',
  51:'Armenia', 31:'Azerbaijan', 268:'Georgia', 112:'Belarus',
  233:'Estonia', 630:'Puerto Rico', 736:'Chad',
  174:'Comoros', 262:'Djibouti', 226:'Eq. Guinea', 270:'Gambia',
  384:'Ivory Coast', 478:'Mauritania', 646:'Rwanda',
  728:'S. Sudan', 768:'Togo',
};
