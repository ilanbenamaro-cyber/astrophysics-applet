// tourPhysics.js — Single source of computed truth for the VLBI tour.
//
// WHY THIS EXISTS: every number the tour displays is derived HERE from the same
// constants and formulas the live simulator uses (constants.js, uvCompute.js,
// useSimulation.js). The tour and the tool can therefore never disagree. The
// tour's draw code contains zero physics literals — it reads strings from here.
//
// Coordinate math (latLonToECEF) is IMPORTED from uvCompute.js, never copied:
// it is the one place we cannot allow drift (Dan Marrone caught a longitude
// sign error there once — fixed in 54c855b — and a copy could silently diverge).
import { EARTH_RADIUS_KM, ARRAY_PRESETS, SKY_TARGETS, BHEX_PRESET, STATION_SEFD } from './constants.js';
import { latLonToECEF } from './uvCompute.js';

const C_M_S        = 299792458;   // speed of light [m/s]
const RAD_TO_UAS   = 206265e6;    // radians → microarcseconds (matches useSimulation.js:225)
const RAD_TO_ARCSEC = 206265;     // radians → arcseconds

// The setup the tour narrates: EHT primary band + a GBT-class single aperture.
export const TOUR_FREQ_GHZ   = 230;
export const SINGLE_DISH_D_M = 100;

// ── Canonical formulas (kept identical to the simulator) ────────────────────────
export function lambdaM(freqGHz)            { return C_M_S / (freqGHz * 1e9); }
// θ = λ/B (NO 1.22 factor) — matches useSimulation.js:224-225
export function thetaUas(baselineKm, lam)   { return (lam / (baselineKm * 1e3)) * RAD_TO_UAS; }
export function thetaArcsec(apertureM, lam) { return (lam / apertureM) * RAD_TO_ARCSEC; }
// |u| = B/λ in gigawavelengths — matches uvCompute.js kmToGl
export function uGl(baselineKm, lam)        { return (baselineKm * 1e3) / lam / 1e9; }

// Longest baseline among a station list, via the canonical imported ECEF function.
export function maxBaselineKm(stations) {
  let max = 0;
  for (let i = 0; i < stations.length; i++) {
    for (let j = i + 1; j < stations.length; j++) {
      const a = latLonToECEF(stations[i].lat, stations[i].lon);
      const b = latLonToECEF(stations[j].lat, stations[j].lon);
      const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      if (d > max) max = d;
    }
  }
  return max;
}

// ── Display formatting (all number→string logic lives here) ─────────────────────
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
function powTimes(v) {                       // 114063 → "1.1 × 10⁵×"
  const exp = Math.floor(Math.log10(v));
  const mant = v / Math.pow(10, exp);
  const sup = String(exp).replace(/\d/g, d => SUP[d]);
  return `${mant.toFixed(1)} × 10${sup}×`;
}
export const fmt = {
  uas:    v => `${v.toFixed(0)} μas`,        // integer μas — matches app angularRes .toFixed(0)
  uas1:   v => `${v.toFixed(1)} μas`,
  arcsec: v => `${v.toFixed(1)}″`,
  km:     v => `${Math.round(v).toLocaleString('en-US')} km`,
  gl:     v => `${v.toFixed(1)} Gλ`,
  mm:     v => `${v.toFixed(1)} mm`,
  pow:    powTimes,
};

// ── Computed-at-load truth ──────────────────────────────────────────────────────
const LAM      = lambdaM(TOUR_FREQ_GHZ);
const EHT2017  = ARRAY_PRESETS['EHT 2017'];
const ehtMaxKm = maxBaselineKm(EHT2017);
const thetaEht = thetaUas(ehtMaxKm, LAM);
const thetaDsh = thetaArcsec(SINGLE_DISH_D_M, LAM);
const uMax     = uGl(ehtMaxKm, LAM);
const improve  = (thetaDsh * 1e6) / thetaEht;     // (arcsec→μas) / μas, dimensionless ratio
const nBase    = EHT2017.length * (EHT2017.length - 1) / 2;

// ngEHT Phase 1 — for the Act 8 side-by-side comparison (geometry only).
const NGEHT   = ARRAY_PRESETS['ngEHT Phase 1'];
const ngMaxKm = maxBaselineKm(NGEHT);
const ngTheta = thetaUas(ngMaxKm, LAM);
const ngN     = NGEHT.length * (NGEHT.length - 1) / 2;

// BHEX: characteristic baseline ~ orbital RADIUS. This is an oversimplification —
// the true ground-to-satellite baseline is geometry-dependent (up to ~2R⊕+h).
// PENDING expert sign-off (Marrone / Alejandro). Never present as a clean equality.
const bhexCharKm = EARTH_RADIUS_KM + BHEX_PRESET.orbitalAltitudeKm;
const bhexTheta  = thetaUas(bhexCharKm, LAM);

export const TOUR_PHYSICS = Object.freeze({
  freqGHz:          TOUR_FREQ_GHZ,
  lambdaM:          LAM,
  lambdaMm:         LAM * 1000,
  dishD_m:          SINGLE_DISH_D_M,
  thetaDishArcsec:  thetaDsh,
  ehtMaxBaselineKm: ehtMaxKm,
  thetaEhtUas:      thetaEht,
  uMaxGl:           uMax,
  improvementFactor: improve,
  ehtStationCount:  EHT2017.length,
  ehtBaselineCount: nBase,
  almaSefdJy:       STATION_SEFD['ALMA'],
  m87ShadowUas:     SKY_TARGETS['M87*'].shadowUas,
  sgrAShadowUas:    SKY_TARGETS['Sgr A*'].shadowUas,
  m87RaDeg:         SKY_TARGETS['M87*'].ra,
  ngeht: Object.freeze({
    stationCount:    NGEHT.length,
    baselineCount:   ngN,
    maxBaselineKm:   ngMaxKm,
    thetaUas:        ngTheta,
  }),
  bhex: Object.freeze({
    altitudeKm:   BHEX_PRESET.orbitalAltitudeKm,
    charRadiusKm: bhexCharKm,
    thetaUas:     bhexTheta,
    pending:      true,
  }),
  // Pre-formatted strings the acts read directly (keeps draw code literal-free).
  str: Object.freeze({
    lambda:       fmt.mm(LAM * 1000),                 // "1.3 mm"
    thetaDish:    fmt.arcsec(thetaDsh),               // "2.7″"
    thetaEht:     fmt.uas(thetaEht),                  // "24 μas"
    ehtBaseline:  fmt.km(ehtMaxKm),                   // "11,406 km"
    uMax:         fmt.gl(uMax),                        // "8.8 Gλ"
    improvement:  fmt.pow(improve),                   // "1.1 × 10⁵×"
    nBaselines:   `${nBase} baselines`,               // "28 baselines"
    nStations:    `${EHT2017.length} stations`,        // "8 stations"
    ngTheta:      fmt.uas(ngTheta),                    // ngEHT θ=λ/B
    ngBaselines:  `${ngN} baselines`,                  // "136 baselines"
    ngStations:   `${NGEHT.length} stations`,          // "17 stations"
    almaSefd:     `${STATION_SEFD['ALMA']} Jy`,        // "94 Jy"
    m87Shadow:    fmt.uas(SKY_TARGETS['M87*'].shadowUas),  // "42 μas"
    sgrAShadow:   fmt.uas(SKY_TARGETS['Sgr A*'].shadowUas),// "50 μas"
    bhexRadius:   fmt.km(bhexCharKm),                 // "32,933 km"
    bhexTheta:    fmt.uas(bhexTheta),                 // "8 μas"
  }),
});
