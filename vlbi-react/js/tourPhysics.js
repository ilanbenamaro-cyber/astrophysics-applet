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
import { latLonToECEF, computeElevation, MIN_ELEVATION_RAD, computeUVPoints, computeUVFill } from './uvCompute.js';

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

// Longest baseline that can actually OBSERVE a source at declination `decDeg`,
// reusing the simulator's OWN elevation filter (imported, never re-implemented):
// a pair counts only if both stations clear MIN_ELEVATION_RAD at the same hour
// angle somewhere in a full track. This is what excludes SPT for M87* in the live
// tool, so the tour and tool agree on the observing geometry, not just array geometry.
export function maxBaselineKmVisible(stations, decDeg, steps = 480) {
  const decRad = decDeg * Math.PI / 180;
  const sees = lat => {                                  // ∃H with elevation ≥ cutoff
    for (let k = 0; k <= steps; k++) {
      const H = -Math.PI + (2 * Math.PI * k) / steps;
      if (computeElevation(lat, H, decRad) >= MIN_ELEVATION_RAD) return true;
    }
    return false;
  };
  const coVisible = (latA, latB) => {                    // ∃H with BOTH ≥ cutoff
    for (let k = 0; k <= steps; k++) {
      const H = -Math.PI + (2 * Math.PI * k) / steps;
      if (computeElevation(latA, H, decRad) >= MIN_ELEVATION_RAD &&
          computeElevation(latB, H, decRad) >= MIN_ELEVATION_RAD) return true;
    }
    return false;
  };
  let max = 0, pair = null;
  for (let i = 0; i < stations.length; i++) {
    if (!sees(stations[i].lat)) continue;
    for (let j = i + 1; j < stations.length; j++) {
      if (!sees(stations[j].lat)) continue;
      if (!coVisible(stations[i].lat, stations[j].lat)) continue;
      const a = latLonToECEF(stations[i].lat, stations[i].lon);
      const b = latLonToECEF(stations[j].lat, stations[j].lon);
      const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      if (d > max) { max = d; pair = [stations[i].name, stations[j].name]; }
    }
  }
  return { km: max, pair };
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
const M87_DEC  = SKY_TARGETS['M87*'].dec;

// HEADLINE = the longest baseline that can actually observe M87* (SPT excluded by
// the elevation filter). The geometric array max (incl. IRAM–SPT) is kept separately
// but is never presented as the resolution. See TOUR-PHYSICS-AUDIT.md.
const ehtArrayMaxKm = maxBaselineKm(EHT2017);                       // ~11,406 (geometry)
const ehtM87        = maxBaselineKmVisible(EHT2017, M87_DEC);        // ~10,883 IRAM–JCMT
const ehtMaxM87Km   = ehtM87.km;
const thetaEht = thetaUas(ehtMaxM87Km, LAM);
const thetaDsh = thetaArcsec(SINGLE_DISH_D_M, LAM);
const uMax     = uGl(ehtMaxM87Km, LAM);
const improve  = (thetaDsh * 1e6) / thetaEht;     // (arcsec→μas) / μas, dimensionless ratio
const nBase    = EHT2017.length * (EHT2017.length - 1) / 2;

// ngEHT Phase 1 — for the Act 8 side-by-side comparison, on the SAME M87* geometry.
const NGEHT   = ARRAY_PRESETS['ngEHT Phase 1'];
const ngMaxKm = maxBaselineKmVisible(NGEHT, M87_DEC).km;
const ngTheta = thetaUas(ngMaxKm, LAM);
const ngN     = NGEHT.length * (NGEHT.length - 1) / 2;

// UV-plane fill of the canonical tour observation (EHT 2017 → M87*, 12 h, 230 GHz,
// 80 μas FOV at N=512 — the same engineState every act narrates). Computed through
// the engine's own computeUVPoints/computeUVFill so the "how sparse is sparse"
// number in the narration can never drift from what the scenes draw.
export const TOUR_FOV_MUAS = 80;
export const TOUR_DURATION_HR = 12;
const TOUR_GRID_N = 512;
const uvFillPct = computeUVFill(
  computeUVPoints(
    // color is required by computeUVPoints (it lerps pair colours); the value is
    // irrelevant here — only the sampled cell positions feed computeUVFill.
    EHT2017.map((s, i) => ({ id: i, name: s.name, lat: s.lat, lon: s.lon, color: '#C4A555', visible: true })),
    { declination: M87_DEC, duration: TOUR_DURATION_HR, frequency: TOUR_FREQ_GHZ,
      fovMuas: TOUR_FOV_MUAS, N: TOUR_GRID_N },
  ).uvPoints,
  TOUR_GRID_N,
);

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
  ehtMaxBaselineM87Km:  ehtMaxM87Km,    // headline — M87*-observing (SPT excluded)
  ehtArrayMaxBaselineKm: ehtArrayMaxKm, // geometric array max (incl. IRAM–SPT) — never shown as θ
  ehtM87MaxPair:    ehtM87.pair,        // e.g. ['IRAM','JCMT']
  thetaEhtUas:      thetaEht,
  uMaxGl:           uMax,
  improvementFactor: improve,
  ehtStationCount:  EHT2017.length,
  ehtBaselineCount: nBase,
  uvFillPct:        uvFillPct,
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
  // Single-source symbolic formulas — so Act 5 and Act 6 can never diverge again.
  bcFormula:        '√27 · GM/c²',        // critical impact parameter = shadow RADIUS
  shadowDiamFormula:'2√27 · GM/(c²d)',    // angular DIAMETER (the 42 μas the image shows)
  // Pre-formatted strings the acts read directly (keeps draw code literal-free).
  str: Object.freeze({
    lambda:       fmt.mm(LAM * 1000),                 // "1.3 mm"
    thetaDish:    fmt.arcsec(thetaDsh),               // "2.7″"
    thetaEht:     fmt.uas(thetaEht),                  // "25 μas" (M87*-observing)
    ehtBaseline:  fmt.km(ehtMaxM87Km),                // "10,883 km" (M87*-observing)
    ehtArrayMax:  fmt.km(ehtArrayMaxKm),              // "11,406 km" (geometric array max)
    uMax:         fmt.gl(uMax),                        // "8.4 Gλ"
    improvement:  fmt.pow(improve),                   // "1.1 × 10⁵×"
    nBaselines:   `${nBase} baselines`,               // "28 baselines"
    uvFill:       `${uvFillPct.toFixed(3)} %`,         // "0.010 %" — grid cells sampled
    nStations:    `${EHT2017.length} stations`,        // "8 stations"
    ngTheta:      fmt.uas(ngTheta),                    // ngEHT θ=λ/B (M87*)
    ngBaselines:  `${ngN} baselines`,                  // "136 baselines"
    ngStations:   `${NGEHT.length} stations`,          // "17 stations"
    almaSefd:     `${STATION_SEFD['ALMA']} Jy`,        // "94 Jy"
    m87Shadow:    fmt.uas(SKY_TARGETS['M87*'].shadowUas),  // "42 μas"
    sgrAShadow:   fmt.uas(SKY_TARGETS['Sgr A*'].shadowUas),// "50 μas"
    bhexRadius:   fmt.km(bhexCharKm),                 // "32,933 km"
    bhexTheta:    fmt.uas(bhexTheta),                 // "8 μas"
  }),
});
