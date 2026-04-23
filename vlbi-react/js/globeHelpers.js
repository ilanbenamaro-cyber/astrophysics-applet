// Three.js async helpers: earth textures, country boundaries, telescope markers.
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import * as topojson from 'topojson-client';
import { ISO_COUNTRY_NAMES } from './constants.js';
import { lerpColor } from './uvCompute.js';

// Module-level ref so the Globe resize handler can update LineMaterial resolution
export let borderLineMat = null;


export const OCEAN_LABELS = [
  { name: 'Pacific Ocean',     lat:   0, lon: -160 },
  { name: 'Atlantic Ocean',    lat:   0, lon:  -30 },
  { name: 'Indian Ocean',      lat: -20, lon:   80 },
  { name: 'Arctic Ocean',      lat:  85, lon:    0 },
  { name: 'Southern Ocean',    lat: -65, lon:    0 },
  { name: 'Mediterranean Sea', lat:  35, lon:   18 },
  { name: 'Caribbean Sea',     lat:  15, lon:  -75 },
];

/**
 * Load NASA Blue Marble photo textures (diffuse, bump, specular) onto earthMat.
 * Falls back gracefully — tries multiple CDN URLs for diffuse; skips bump/specular on failure.
 * @param {THREE.MeshPhongMaterial} earthMat
 * @param {() => boolean} isCancelled
 */
export async function loadEarthTextures(earthMat, isCancelled) {
  const loader = new THREE.TextureLoader();
  const tryLoad = (url) => new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });

  // Diffuse map — try 3 CDN URLs in sequence
  const diffuseUrls = [
    'https://unpkg.com/three-globe@2.41.12/example/img/earth-blue-marble.jpg',
    'https://cdn.jsdelivr.net/npm/three-globe@2.41.12/example/img/earth-blue-marble.jpg',
    'https://cdn.jsdelivr.net/npm/three@0.163.0/examples/textures/planets/earth_atmos_2048.jpg',
  ];
  for (const url of diffuseUrls) {
    if (isCancelled()) return;
    try {
      const tex = await tryLoad(url);
      if (isCancelled()) { tex.dispose(); return; }
      tex.colorSpace = THREE.SRGBColorSpace;
      earthMat.map = tex;
      earthMat.color.setHex(0xffffff);
      earthMat.needsUpdate = true;
      console.log('[Globe] diffuse loaded:', url);
      break;
    } catch (_) {
      console.warn('[Globe] diffuse failed:', url);
    }
  }

  if (isCancelled()) return;

  // Bump map
  try {
    const bumpTex = await tryLoad('https://unpkg.com/three-globe@2.41.12/example/img/earth-topology.png');
    if (!isCancelled()) {
      earthMat.bumpMap = bumpTex;
      earthMat.bumpScale = 0.05;
      earthMat.needsUpdate = true;
    }
  } catch (_) {}

  if (isCancelled()) return;

  // Specular map
  try {
    const specTex = await tryLoad('https://cdn.jsdelivr.net/npm/three@0.163.0/examples/textures/planets/earth_specular_2048.jpg');
    if (!isCancelled()) {
      earthMat.specularMap = specTex;
      earthMat.specular = new THREE.Color(0x333333);
      earthMat.shininess = 60;
      earthMat.needsUpdate = true;
    }
  } catch (_) {}
}

/**
 * Fetch world-atlas TopoJSON and add country borders + labels to the scene.
 * Degrades gracefully — catches all errors silently.
 * @param {THREE.Scene} scene
 * @param {THREE.Group} labelGroup
 * @param {() => boolean} isCancelled
 */
export async function loadCountryBoundaries(scene, labelGroup, isCancelled) {
  try {
    const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
    if (!res.ok || isCancelled()) return;
    const topo = await res.json();
    if (isCancelled()) return;

    const R = 1.001;
    const lonLatToVec3 = (lon, lat) => {
      const phi = lat * Math.PI / 180;
      const lam = lon * Math.PI / 180;
      return [
        R * Math.cos(phi) * Math.cos(lam),
        R * Math.sin(phi),
        -R * Math.cos(phi) * Math.sin(lam),
      ];
    };

    // Border LineSegments
    const borderMesh = topojson.mesh(topo, topo.objects.countries);
    const positions = [];
    for (const line of borderMesh.coordinates) {
      for (let i = 0; i < line.length - 1; i++) {
        positions.push(...lonLatToVec3(line[i][0],   line[i][1]));
        positions.push(...lonLatToVec3(line[i+1][0], line[i+1][1]));
      }
    }

    const geo = new LineSegmentsGeometry();
    geo.setPositions(positions);
    borderLineMat = new LineMaterial({
      color: 0xffff88, transparent: true, opacity: 0.75, depthWrite: false,
      linewidth: 1.5,
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
    });
    scene.add(new LineSegments2(geo, borderLineMat));

    const countryFeatures = topojson.feature(topo, topo.objects.countries);
    for (const feature of countryFeatures.features) {
      if (isCancelled()) return;
      const name = ISO_COUNTRY_NAMES[+feature.id];
      if (!name) continue;

      const allRings = feature.geometry.type === 'Polygon'
        ? [feature.geometry.coordinates[0]]
        : feature.geometry.coordinates.map(p => p[0]);
      let ring = allRings[0];
      for (const r of allRings) { if (r.length > ring.length) ring = r; }

      let sumLon = 0, sumLat = 0;
      for (const [lon, lat] of ring) { sumLon += lon; sumLat += lat; }
      const cLon = sumLon / ring.length;
      const cLat = sumLat / ring.length;

      const [x, y, z] = lonLatToVec3(cLon, cLat);
      const div = document.createElement('div');
      div.className = 'country-label';
      div.textContent = name;
      const obj = new CSS2DObject(div);
      obj.position.set(x, y, z);
      labelGroup.add(obj);
    }

    // Ocean labels
    for (const ocean of OCEAN_LABELS) {
      const [x, y, z] = lonLatToVec3(ocean.lon, ocean.lat);
      const div = document.createElement('div');
      div.className = 'ocean-label';
      div.textContent = ocean.name;
      const obj = new CSS2DObject(div);
      obj.position.set(x, y, z);
      labelGroup.add(obj);
    }
  } catch (_) {
    // Degrade gracefully — no borders or labels rendered
  }
}

/**
 * Rebuild telescope sphere markers + great-circle baseline arcs.
 * Clears both groups before rebuilding, disposing GPU resources correctly.
 * @param {THREE.Group} markerGroup
 * @param {THREE.Group} baselineGroup
 * @param {Array} telescopes
 */
export function syncTelescopeMarkers(markerGroup, baselineGroup, telescopes) {
  const R = 1.012;
  const latLonToThreeJS = (lat, lon) => {
    const phi = lat * Math.PI / 180;
    const lam = lon * Math.PI / 180;
    return new THREE.Vector3(
      R * Math.cos(phi) * Math.cos(lam),
      R * Math.sin(phi),
      -R * Math.cos(phi) * Math.sin(lam),
    );
  };

  // Clear — must explicitly remove CSS2DObject DOM nodes before unlinking
  while (markerGroup.children.length) {
    const child = markerGroup.children[0];
    child.traverse(obj => {
      if (obj.isCSS2DObject && obj.element) obj.element.remove();
    });
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
    markerGroup.remove(child);
  }
  while (baselineGroup.children.length) {
    const child = baselineGroup.children[0];
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
    baselineGroup.remove(child);
  }

  // Add markers (ground telescopes only — space handled by syncSatelliteMarkers)
  for (const tel of telescopes) {
    if (tel.type === 'space') continue;
    const pos = latLonToThreeJS(tel.lat, tel.lon);
    const geo = new THREE.SphereGeometry(0.022, 12, 12);
    const color = new THREE.Color(tel.color);
    const mat = new THREE.MeshPhongMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.6,
    });
    if (!tel.visible) { mat.opacity = 0.3; mat.transparent = true; }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    markerGroup.add(mesh);

    const labelDiv = document.createElement('div');
    labelDiv.className = 'tel-label';
    labelDiv.textContent = tel.name;
    labelDiv.style.backgroundColor = tel.color;
    if (!tel.visible) labelDiv.style.opacity = '0.3';
    const label = new CSS2DObject(labelDiv);
    label.position.set(0, 0.04, 0);
    mesh.add(label);
  }

  // Add baselines (great-circle arcs, ground-only)
  const visibleTels = telescopes.filter(t => t.visible !== false && t.type !== 'space');
  for (let i = 0; i < visibleTels.length; i++) {
    for (let j = i + 1; j < visibleTels.length; j++) {
      const t1 = visibleTels[i], t2 = visibleTels[j];
      const p1 = latLonToThreeJS(t1.lat, t1.lon);
      const p2 = latLonToThreeJS(t2.lat, t2.lon);
      const STEPS = 50;
      const points = [];
      for (let s = 0; s <= STEPS; s++) {
        const t = s / STEPS;
        const v = new THREE.Vector3().lerpVectors(p1, p2, t).normalize().multiplyScalar(1.015);
        points.push(v);
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const blendColor = new THREE.Color(lerpColor(t1.color, t2.color, 0.5));
      const mat = new THREE.LineBasicMaterial({ color: blendColor, opacity: 0.5, transparent: true });
      baselineGroup.add(new THREE.Line(geo, mat));
    }
  }
}

export function syncSatelliteMarkers(satelliteGroup, telescopes) {
  while (satelliteGroup.children.length) {
    const child = satelliteGroup.children[0];
    child.traverse(obj => {
      if (obj.isCSS2DObject && obj.element) obj.element.remove();
    });
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
    satelliteGroup.remove(child);
  }

  const VISUAL_R = 1.5;

  for (const sat of telescopes.filter(t => t.type === 'space')) {
    const raan = sat.raanDeg * Math.PI / 180;
    const inc  = sat.inclinationDeg * Math.PI / 180;

    // Static marker at ascending node (theta=0): ECEF → Three.js
    const xe = VISUAL_R * Math.cos(raan);
    const ye = VISUAL_R * Math.sin(raan);
    const ze = 0;
    const pos = new THREE.Vector3(xe, ze, -ye);

    const color = new THREE.Color(sat.color);
    const geo = new THREE.SphereGeometry(0.03, 12, 12);
    const mat = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    satelliteGroup.add(mesh);

    const labelDiv = document.createElement('div');
    labelDiv.className = 'tel-label';
    labelDiv.textContent = sat.name;
    labelDiv.style.backgroundColor = sat.color;
    labelDiv.style.color = '#000';
    const label = new CSS2DObject(labelDiv);
    label.position.set(0, 0.05, 0);
    mesh.add(label);

    // Orbital ring — 64 segments in perifocal → ECEF frame
    const ringPoints = [];
    for (let i = 0; i <= 64; i++) {
      const theta = (2 * Math.PI * i) / 64;
      const xOrb = VISUAL_R * Math.cos(theta);
      const yOrb = VISUAL_R * Math.sin(theta);
      const rxe = xOrb * Math.cos(raan) - yOrb * Math.cos(inc) * Math.sin(raan);
      const rye = xOrb * Math.sin(raan) + yOrb * Math.cos(inc) * Math.cos(raan);
      const rze = yOrb * Math.sin(inc);
      ringPoints.push(new THREE.Vector3(rxe, rze, -rye));
    }
    const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPoints);
    const ringMat = new THREE.LineBasicMaterial({ color: sat.color, opacity: 0.4, transparent: true });
    satelliteGroup.add(new THREE.Line(ringGeo, ringMat));
  }
}
