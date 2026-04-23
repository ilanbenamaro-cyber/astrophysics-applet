// App-wide constants shared across components and worker.
export const IMAGE_SIZE = 512;
export const EARTH_RADIUS_KM = 6371;

export const TELESCOPE_COLORS = [
  '#ff6b6b','#4ecdc4','#feca57','#48dbfb',
  '#ff9f43','#a29bfe','#55efc4','#fd79a8',
  '#e17055','#74b9ff','#00cec9','#6c5ce7',
  '#fdcb6e','#00b894','#d63031','#e84393','#0984e3',
];

export const EHT_PRESETS = [
  { name:'ALMA',  lat:-23.029, lon:-67.755 },
  { name:'APEX',  lat:-23.006, lon:-67.759 },
  { name:'SPT',   lat:-89.99,  lon:-44.65  },
  { name:'JCMT',  lat: 19.823, lon:-155.478},
  { name:'SMT',   lat: 32.702, lon:-109.891},
  { name:'IRAM',  lat: 37.066, lon: -3.392 },
  { name:'LMT',   lat: 18.985, lon: -97.315},
  { name:'NOEMA', lat: 44.634, lon:  5.909 },
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

export const SKY_TARGETS = {
  'M87*':   { ra: 187.706, dec: 12.391,  description: 'Supermassive BH in Virgo A — primary EHT target', shadowUas: 42   },
  'Sgr A*': { ra: 266.417, dec: -29.008, description: 'Milky Way galactic center BH',                     shadowUas: 50   },
  '3C 279': { ra: 194.047, dec: -5.789,  description: 'Bright blazar, primary EHT calibrator',            shadowUas: null },
  'Cen A':  { ra: 201.365, dec: -43.019, description: 'Nearest radio galaxy (NGC 5128)',                  shadowUas: null },
  'Custom': { ra: null,    dec: null,     description: 'Set declination and source size manually',         shadowUas: null },
};

export const INFO = {
  globe:       { title: 'Radio Telescope Globe',    body: 'Click anywhere on Earth to place a radio telescope. Every pair of telescopes forms a "baseline" — like a giant antenna spanning the distance between them. More telescopes = more baselines = sharper images.' },
  uvmap:       { title: 'UV-Plane Coverage',        body: 'As Earth rotates, each telescope pair sweeps an arc through Fourier space (the UV-plane). Each point sampled corresponds to one spatial frequency of the sky. The axis range auto-scales to the current UV coverage extent (max baseline × 1.2) and is labeled in gigawavelengths (Gλ) — the standard unit in radio astronomy publications. Dense, uniform coverage produces higher-fidelity reconstruction.' },
  dirty:       { title: 'Dirty Image',              body: 'The raw result of taking the inverse Fourier transform of only the sampled UV points (with zeros elsewhere). Artifacts called "sidelobes" appear because we only measured some Fourier frequencies.' },
  restored:    { title: 'Restored Image',           body: 'After applying a deconvolution algorithm (Max Entropy or CLEAN), many sidelobes are suppressed. This is closer to the true sky, but resolution is still limited by the longest baseline.' },
  ground:      { title: 'Ground Truth',             body: 'The original image we are trying to reconstruct. In real radio astronomy, we never have this — only the raw telescope data. This simulator lets you compare what we recover vs. the actual source.' },
  noise:       { title: 'Thermal Noise',            body: 'Radio receivers add random electronic noise to every measurement. Noise scales as sqrt(SEFD_i × SEFD_j) per baseline — ALMA (94 Jy) produces ~0.15× the noise of SMT (17,100 Jy) on shared baselines, reflecting its much larger collecting area. Higher noise amplitude makes the reconstruction blurrier and noisier.' },
  frequency:   { title: 'Observing Frequency',      body: 'Higher frequencies (shorter wavelengths) give finer resolution because the UV coordinates scale as u = baseline/λ. The EHT observes at 230 GHz (1.3 mm wavelength) for maximum resolution.' },
  duration:    { title: 'Synthesis Duration',       body: 'Earth rotates 360° in 24 hours. Longer observations allow each baseline to sweep more of the UV-plane, improving image quality. The EHT typically observes a source for 6–12 hours per night.' },
  declination: { title: 'Source Declination',       body: 'The angular distance of the target source from the celestial equator. Sources near the equator (δ ≈ 0°) produce roughly circular UV tracks; polar sources produce more compact, circular tracks. Elevation cutoffs (min 10°) are applied per telescope — stations that cannot see the source at a given hour angle contribute no UV samples.' },
  method:      { title: 'Reconstruction Method',    body: '"Dirty only": raw IFFT with no cleanup. "CLEAN": iteratively subtracts the PSF to remove sidelobe artifacts — the standard method in radio astronomy. "Max Entropy": gradient descent maximising image entropy under a data-fidelity constraint — favours smooth, positive images used by the EHT team alongside CLEAN.' },
  dish:        { title: 'Dish Diameter',            body: 'Larger dishes collect more signal (better sensitivity). The angular field of view of each telescope is roughly λ/D radians. This does not change the UV coverage but affects sensitivity and how much sky is imaged at once.' },
  contours:    { title: 'Contour Overlays',         body: 'Logarithmic contour lines drawn over the reconstructed image at three brightness levels: 50% of peak (solid white), 10% of peak (semi-transparent white), and 1% of peak (dashed white). This is the standard display format in radio astronomy publications. Contours reveal the dynamic range of the reconstruction — how much faint structure exists around the bright central source.' },
  contourmap:  { title: 'Contour Map',              body: 'A professional radio astronomy contour map showing the brightness distribution. The viridis colormap (blue→green→yellow) is perceptually uniform and colorblind-safe — the standard in modern astronomy publications. White contour lines are drawn at 50%, 10%, and 2% of the peak brightness, filtered to only show where signal exceeds 2× the noise floor (estimated from border pixels). The beam ellipse in the lower-right shows the angular resolution of the array. Toggle between the CLEAN/Max Entropy reconstruction and the dirty image to see how deconvolution removes sidelobe artifacts. Angular axis labels show the true physical scale of the image in microarcseconds (μas).' },
  fov:         { title: 'Image Field of View',       body: 'The total angular size of the image in microarcseconds (μas). Sets the physical pixel scale: pixel scale = FOV / N μas/pixel. Default is 80 μas — M87* physical scale. The 2019 EHT M87* images used an ~80 μas FOV at 1–2 μas/pixel. EHT baselines sample the inner portion of the UV grid at this scale.' },
  sourceSize:  { title: 'Source Angular Size',       body: 'The angular diameter of the source in microarcseconds. The source image is scaled to occupy this fraction of the FOV and zero-padded with empty sky. At the default FOV of 538 uas, the default source size of 25% = 134 uas is approximately 3x the real M87* shadow (42 uas) for pedagogical clarity. Reduce source size toward 42 uas to simulate physically realistic M87* imaging conditions — reconstruction becomes genuinely harder as UV coverage gaps matter more for compact sources.' },
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
