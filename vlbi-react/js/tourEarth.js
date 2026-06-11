// tourEarth.js — READ-ONLY textured Earth for the tour (Acts B & E).
//
// Matches the main page's globe BY CONSTRUCTION: the same Three.js pipeline —
// loadEarthTextures (NASA blue-marble diffuse + bump, with the same CDN fallbacks),
// the same Phong material / ambient light / atmosphere / fresnel-glow register from
// Globe.js, and station markers built the way syncTelescopeMarkers builds them.
// CRUCIAL DIFFERENCE: no OrbitControls, no raycast, no telescope placement — the
// tour shows a fixed configuration; placement belongs to the live tool. Rotation is
// a single group.rotation.y set per frame (the hour-angle scrub), which is stable by
// construction — no hand-drawn graticule to tear.
//
// Rendered offscreen to a square canvas; scenes drawImage() it into their 2D canvas
// each RAF frame and place 2D overlays (baseline vector, labels, satellite orbit)
// via project(). Module singleton — Acts B and E never mount simultaneously, and the
// host (Tour.js) calls disposeTourEarth() when the tour unmounts.
import * as THREE from 'three';
import { loadEarthTextures } from './globeHelpers.js';

const SIZE = 640;          // offscreen render square, CSS px (buffer is SIZE × dpr)
const MARKER_R = 1.012;    // marker shell radius — same as syncTelescopeMarkers

let inst = null;

// Same lat/lon → Three.js mapping the main globe uses (globeHelpers lonLatToVec3).
function latLonToVec(latDeg, lonDeg, R) {
  const phi = latDeg * Math.PI / 180;
  const lam = lonDeg * Math.PI / 180;
  return new THREE.Vector3(
    R * Math.cos(phi) * Math.cos(lam),
    R * Math.sin(phi),
    -R * Math.cos(phi) * Math.sin(lam),
  );
}

export function getTourEarth() {
  if (inst) return inst;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(dpr);
  renderer.setSize(SIZE, SIZE);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();   // alpha renderer → transparent around the limb

  // Everything that turns with the planet lives in this group.
  const group = new THREE.Group();
  scene.add(group);

  // Earth — ocean-navy fallback until the photo textures load (same as Globe.js)
  const earthMat = new THREE.MeshPhongMaterial({ color: 0x071628, shininess: 12 });
  const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), earthMat);
  group.add(earthMesh);

  // Atmosphere (static rim — doesn't rotate)
  const atmoMat = new THREE.MeshBasicMaterial({
    color: 0x6699dd, transparent: true, opacity: 0.06,
    side: THREE.FrontSide, depthWrite: false,
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.02, 64, 64), atmoMat));

  // Outer fresnel glow — shader verbatim from Globe.js
  const glowMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    uniforms: {},
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vViewPos)));
        float intensity = pow(rim, 2.5);
        float outerFade = smoothstep(0.0, 0.4, rim);
        vec3 innerColor = vec3(0.6, 0.8, 1.0);
        vec3 outerColor = vec3(0.15, 0.4, 0.8);
        vec3 color = mix(outerColor, innerColor, pow(rim, 4.0));
        gl_FragColor = vec4(color, intensity * outerFade * 0.7);
      }
    `,
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.06, 64, 64), glowMat));

  scene.add(new THREE.AmbientLight(0xffffff, 1.8));

  let cancelled = false;
  loadEarthTextures(earthMat, () => cancelled);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(0, 0, 2.8);

  // Station markers — same construction as syncTelescopeMarkers (emissive spheres)
  const markerGroup = new THREE.Group();
  group.add(markerGroup);

  function setStations(tels) {
    while (markerGroup.children.length) {
      const child = markerGroup.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      markerGroup.remove(child);
    }
    for (const tel of tels) {
      if (tel.type === 'space') continue;   // satellites are 2D overlays in the tour
      const color = new THREE.Color(tel.color);
      const mat = new THREE.MeshPhongMaterial({
        color, emissive: color, emissiveIntensity: 0.6,
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), mat);
      mesh.position.copy(latLonToVec(tel.lat, tel.lon, MARKER_R));
      markerGroup.add(mesh);
    }
  }

  // Projected silhouette radius of the r=1 sphere in canvas px: the limb is the
  // tangent cone, so NDC radius = (1/√(z²−1)) / tan(fov/2). Scenes use this to
  // scale the offscreen square onto their own globe rect exactly.
  const z = camera.position.z;
  const radiusPx = ((1 / Math.sqrt(z * z - 1)) / Math.tan(45 / 2 * Math.PI / 180)) * (SIZE / 2);

  function render(rotation) {
    group.rotation.y = rotation;
    renderer.render(scene, camera);
    return renderer.domElement;
  }

  // Project (lat, lon) at the current rotation → {x, y, front} in the SIZE square.
  const _v = new THREE.Vector3();
  const _yAxis = new THREE.Vector3(0, 1, 0);
  function project(latDeg, lonDeg, rotation) {
    _v.copy(latLonToVec(latDeg, lonDeg, MARKER_R));
    _v.applyAxisAngle(_yAxis, rotation);
    const front = _v.dot(camera.position) > 0;   // same occlusion test as Globe.js
    _v.project(camera);
    return { x: (_v.x * 0.5 + 0.5) * SIZE, y: (-_v.y * 0.5 + 0.5) * SIZE, front };
  }

  function dispose() {
    cancelled = true;
    setStations([]);
    renderer.dispose();
    inst = null;
  }

  inst = { setStations, render, project, dispose, SIZE, radiusPx };
  return inst;
}

// Host-level cleanup: called when the tour unmounts (Tour.js), not per act —
// Acts B and E share the singleton.
export function disposeTourEarth() {
  if (inst) inst.dispose();
}
