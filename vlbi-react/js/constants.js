// App-wide constants shared across components and worker.
export const IMAGE_SIZE = 256;
export const EARTH_RADIUS_KM = 6371;

export const TELESCOPE_COLORS = [
  '#ff6b6b','#4ecdc4','#feca57','#48dbfb',
  '#ff9f43','#a29bfe','#55efc4','#fd79a8'
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

export const INFO = {
  globe:       { title: 'Radio Telescope Globe',    body: 'Click anywhere on Earth to place a radio telescope. Every pair of telescopes forms a "baseline" — like a giant antenna spanning the distance between them. More telescopes = more baselines = sharper images.' },
  uvmap:       { title: 'UV-Plane Coverage',        body: 'As Earth rotates, each telescope pair sweeps an arc through "Fourier space" (the UV-plane). Each point sampled here corresponds to one spatial frequency of the sky. Dense, uniform coverage → high-fidelity reconstruction.' },
  dirty:       { title: 'Dirty Image',              body: 'The raw result of taking the inverse Fourier transform of only the sampled UV points (with zeros elsewhere). Artifacts called "sidelobes" appear because we only measured some Fourier frequencies.' },
  restored:    { title: 'Restored Image',           body: 'After applying a deconvolution algorithm (Max Entropy or CLEAN), many sidelobes are suppressed. This is closer to the true sky, but resolution is still limited by the longest baseline.' },
  ground:      { title: 'Ground Truth',             body: 'The original image we are trying to reconstruct. In real radio astronomy, we never have this — only the raw telescope data. This simulator lets you compare what we recover vs. the actual source.' },
  noise:       { title: 'Thermal Noise',            body: 'Radio receivers add random electronic noise to every measurement. Higher noise amplitude makes the reconstruction blurrier and noisier. Real arrays average many measurements to reduce this.' },
  frequency:   { title: 'Observing Frequency',      body: 'Higher frequencies (shorter wavelengths) give finer resolution because the UV coordinates scale as u = baseline/λ. The EHT observes at 230 GHz (1.3 mm wavelength) for maximum resolution.' },
  duration:    { title: 'Synthesis Duration',       body: 'Earth rotates 360° in 24 hours. Longer observations allow each baseline to sweep more of the UV-plane, improving image quality. The EHT typically observes a source for 6–12 hours per night.' },
  declination: { title: 'Source Declination',       body: 'The angular distance of the target source from the celestial equator. Sources near the equator (δ ≈ 0°) produce roughly circular UV tracks; polar sources produce more compact, circular tracks.' },
  method:      { title: 'Reconstruction Method',    body: '"Dirty only": raw IFFT with no cleanup. "CLEAN": iteratively subtracts the PSF to remove sidelobe artifacts — the standard method in radio astronomy. "Max Entropy": gradient descent maximising image entropy under a data-fidelity constraint — favours smooth, positive images used by the EHT team alongside CLEAN.' },
  dish:        { title: 'Dish Diameter',            body: 'Larger dishes collect more signal (better sensitivity). The angular field of view of each telescope is roughly λ/D radians. This does not change the UV coverage but affects sensitivity and how much sky is imaged at once.' },
  contours:    { title: 'Contour Overlays',         body: 'Logarithmic contour lines drawn over the reconstructed image at three brightness levels: 50% of peak (solid white), 10% of peak (semi-transparent white), and 1% of peak (dashed white). This is the standard display format in radio astronomy publications. Contours reveal the dynamic range of the reconstruction — how much faint structure exists around the bright central source.' },
  contourmap:  { title: 'Contour Map',              body: 'A professional radio astronomy contour map showing the brightness distribution. The viridis colormap (blue→green→yellow) is perceptually uniform and colorblind-safe — the standard in modern astronomy publications. White contour lines are drawn at 50%, 10%, and 2% of the peak brightness, filtered to only show where signal exceeds 2× the noise floor (estimated from border pixels). The beam ellipse in the lower-right shows the angular resolution of the array. Toggle between the CLEAN/Max Entropy reconstruction and the dirty image to see how deconvolution removes sidelobe artifacts. Angular axis labels show the true physical scale of the image in microarcseconds (μas).' },
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
