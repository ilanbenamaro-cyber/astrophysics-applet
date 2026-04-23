// UV-plane coverage computation: ECEF coordinates, baseline → UV, conjugate symmetry.
import { EARTH_RADIUS_KM } from './constants.js';

export function latLonToECEF(lat, lon) {
  const phi = lat * Math.PI / 180;
  const lam = lon * Math.PI / 180;
  return {
    x: EARTH_RADIUS_KM * Math.cos(phi) * Math.cos(lam),
    y: EARTH_RADIUS_KM * Math.cos(phi) * Math.sin(lam),
    z: EARTH_RADIUS_KM * Math.sin(phi),
  };
}

export function computeBaseline(t1, t2) {
  const p1 = latLonToECEF(t1.lat, t1.lon);
  const p2 = latLonToECEF(t2.lat, t2.lon);
  return { bx: p2.x - p1.x, by: p2.y - p1.y, bz: p2.z - p1.z };
}

export function computeSatelliteECEF(satellite, observationHourAngle) {
  const r = EARTH_RADIUS_KM + satellite.orbitalAltitudeKm;
  const inc = satellite.inclinationDeg * Math.PI / 180;
  const raan = satellite.raanDeg * Math.PI / 180;
  const omega = 2 * Math.PI / satellite.periodHours;
  const theta = omega * observationHourAngle;
  const x_orb = r * Math.cos(theta);
  const y_orb = r * Math.sin(theta);
  const x = x_orb * Math.cos(raan) - y_orb * Math.cos(inc) * Math.sin(raan);
  const y = x_orb * Math.sin(raan) + y_orb * Math.cos(inc) * Math.cos(raan);
  const z = y_orb * Math.sin(inc);
  return { x, y, z };
}

export function baselineToUV(b, H, decDeg) {
  const d = decDeg * Math.PI / 180;
  const u =  Math.sin(H) * b.bx + Math.cos(H) * b.by;
  const v = -Math.sin(d) * Math.cos(H) * b.bx + Math.sin(d) * Math.sin(H) * b.by + Math.cos(d) * b.bz;
  return { u, v };
}

export function lerpColor(h1, h2, t) {
  const parse = h => [
    parseInt(h.slice(1,3),16),
    parseInt(h.slice(3,5),16),
    parseInt(h.slice(5,7),16),
  ];
  const c1 = parse(h1), c2 = parse(h2);
  const r = Math.round(c1[0] + (c2[0]-c1[0])*t);
  const g = Math.round(c1[1] + (c2[1]-c1[1])*t);
  const b = Math.round(c1[2] + (c2[2]-c1[2])*t);
  return '#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}

export function computeUVPoints(telescopes, { declination, duration, frequency, N, fovMuas }) {
  const groundTels = telescopes.filter(t => t.visible !== false && t.type !== 'space');
  const spaceTels  = telescopes.filter(t => t.visible !== false && t.type === 'space');
  if (groundTels.length < 2 && spaceTels.length === 0) return { uvPoints: [], stationPairs: [] };
  const STEPS = 200;
  const halfDur = (duration * Math.PI / 24);
  const c_ms = 299792458;
  const lambda_m = c_ms / (frequency * 1e9);
  const fovRad = fovMuas * (Math.PI / (180 * 3.6e9));
  const scale = (1e3 / lambda_m) * fovRad;
  const uvPoints = [];
  const stationPairs = [];

  // Ground-ground pairs
  for (let i = 0; i < groundTels.length; i++) {
    for (let j = i+1; j < groundTels.length; j++) {
      const t1 = groundTels[i], t2 = groundTels[j];
      const b = computeBaseline(t1, t2);
      const color = lerpColor(t1.color, t2.color, 0.5);
      const pairId = `${t1.id}-${t2.id}`;
      for (let s = 0; s <= STEPS; s++) {
        const H = -halfDur + (s / STEPS) * 2 * halfDur;
        const uv = baselineToUV(b, H, declination);
        const pu = uv.u * scale;
        const pv = uv.v * scale;
        uvPoints.push({ u:  pu + N/2, v:  pv + N/2, color, pairId });
        stationPairs.push({ a: t1.name, b: t2.name });
        uvPoints.push({ u: -pu + N/2, v: -pv + N/2, color, pairId });
        stationPairs.push({ a: t1.name, b: t2.name });
      }
    }
  }

  // Ground-space pairs
  for (const sat of spaceTels) {
    for (const ground of groundTels) {
      const color = lerpColor(sat.color, ground.color, 0.5);
      const pairId = `${sat.id}-${ground.id}`;
      const groundPos = latLonToECEF(ground.lat, ground.lon);
      for (let s = 0; s <= STEPS; s++) {
        const H = -halfDur + (s / STEPS) * 2 * halfDur;
        const t_hours = H / (2 * Math.PI) * 24;
        const satPos = computeSatelliteECEF(sat, t_hours);
        const bx = satPos.x - groundPos.x;
        const by = satPos.y - groundPos.y;
        const bz = satPos.z - groundPos.z;
        const uv = baselineToUV({ bx, by, bz }, H, declination);
        const pu = uv.u * scale;
        const pv = uv.v * scale;
        uvPoints.push({ u:  pu + N/2, v:  pv + N/2, color, pairId });
        stationPairs.push({ a: sat.name, b: ground.name });
        uvPoints.push({ u: -pu + N/2, v: -pv + N/2, color, pairId });
        stationPairs.push({ a: sat.name, b: ground.name });
      }
    }
  }

  return { uvPoints, stationPairs };
}

export function computeUVPointsGl(telescopes, { declination, duration, frequency }) {
  const groundTels = telescopes.filter(t => t.visible !== false && t.type !== 'space');
  const spaceTels  = telescopes.filter(t => t.visible !== false && t.type === 'space');
  if (groundTels.length < 2 && spaceTels.length === 0) return [];
  const STEPS = 200;
  const halfDur = (duration * Math.PI / 24);
  const c_ms = 299792458;
  const lambda_m = c_ms / (frequency * 1e9);
  const kmToGl = 1e3 / lambda_m / 1e9;
  const pts = [];

  // Ground-ground pairs
  for (let i = 0; i < groundTels.length; i++) {
    for (let j = i+1; j < groundTels.length; j++) {
      const t1 = groundTels[i], t2 = groundTels[j];
      const b = computeBaseline(t1, t2);
      const color = lerpColor(t1.color, t2.color, 0.5);
      const pairId = `${t1.id}-${t2.id}`;
      for (let s = 0; s <= STEPS; s++) {
        const H = -halfDur + (s / STEPS) * 2 * halfDur;
        const uv = baselineToUV(b, H, declination);
        pts.push({ u:  uv.u * kmToGl, v:  uv.v * kmToGl, color, pairId });
        pts.push({ u: -uv.u * kmToGl, v: -uv.v * kmToGl, color, pairId });
      }
    }
  }

  // Ground-space pairs
  for (const sat of spaceTels) {
    for (const ground of groundTels) {
      const color = lerpColor(sat.color, ground.color, 0.5);
      const pairId = `${sat.id}-${ground.id}`;
      const groundPos = latLonToECEF(ground.lat, ground.lon);
      for (let s = 0; s <= STEPS; s++) {
        const H = -halfDur + (s / STEPS) * 2 * halfDur;
        const t_hours = H / (2 * Math.PI) * 24;
        const satPos = computeSatelliteECEF(sat, t_hours);
        const bx = satPos.x - groundPos.x;
        const by = satPos.y - groundPos.y;
        const bz = satPos.z - groundPos.z;
        const uv = baselineToUV({ bx, by, bz }, H, declination);
        pts.push({ u:  uv.u * kmToGl, v:  uv.v * kmToGl, color, pairId });
        pts.push({ u: -uv.u * kmToGl, v: -uv.v * kmToGl, color, pairId });
      }
    }
  }

  return pts;
}

export function computeUVFill(uvPoints, N) {
  if (uvPoints.length === 0) return 0;
  const seen = new Set();
  for (const p of uvPoints) {
    const iu = ((Math.round(p.u)) % N + N) % N;
    const iv = ((Math.round(p.v)) % N + N) % N;
    seen.add(iv * N + iu);
  }
  return (seen.size / (N * N)) * 100;
}
