// Globe React component — Three.js 3D interactive earth with telescope placement.
import { html, useRef, useEffect } from './core.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { borderLineMat, loadEarthTextures, loadCountryBoundaries, syncTelescopeMarkers } from './globeHelpers.js';

export function Globe({ telescopes, onTelescopeAdd, showCountryLabels }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const labelRendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const earthMeshRef = useRef(null);
  const markerGroupRef = useRef(null);
  const baselineGroupRef = useRef(null);
  const animFrameRef = useRef(null);
  const autoRotateTimerRef = useRef(null);
  const countryLabelGroupRef = useRef(null);
  const onAddRef = useRef(onTelescopeAdd);
  const showCountryLabelsRef = useRef(showCountryLabels);

  useEffect(() => { onAddRef.current = onTelescopeAdd; }, [onTelescopeAdd]);
  useEffect(() => { showCountryLabelsRef.current = showCountryLabels; }, [showCountryLabels]);

  // Effect 1: Initialize Three.js scene ONCE
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // CSS2D Renderer for labels
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(W, H);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.left = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);
    labelRendererRef.current = labelRenderer;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#000000');
    sceneRef.current = scene;

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starPositions = [];
    const starColors = [];
    for (let i = 0; i < 8000; i++) {
      const r = 70 + Math.random() * 20;
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = 2 * Math.PI * Math.random();
      starPositions.push(
        r * Math.sin(theta) * Math.cos(phi),
        r * Math.sin(theta) * Math.sin(phi),
        r * Math.cos(theta)
      );
      const v = 0.4 + Math.random() * 0.6;
      starColors.push(v, v, v);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({ size: 0.12, sizeAttenuation: true, vertexColors: true });
    scene.add(new THREE.Points(starGeo, starMat));

    // Earth — ocean-navy fallback color until textures load
    const earthGeo = new THREE.SphereGeometry(1, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({ color: 0x071628, shininess: 12 });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);
    earthMeshRef.current = earthMesh;

    // Cloud layer
    const cloudGeo = new THREE.SphereGeometry(1.01, 64, 64);
    const cloudMat = new THREE.MeshPhongMaterial({
      transparent: true, opacity: 0.10, depthWrite: false, side: THREE.DoubleSide,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    scene.add(cloudMesh);
    new THREE.TextureLoader().load(
      'https://unpkg.com/three-globe@2.41.12/example/img/earth-clouds.png',
      (tex) => { cloudMat.map = tex; cloudMat.needsUpdate = true; },
      undefined,
      () => { scene.remove(cloudMesh); }
    );

    // Atmosphere
    const atmoGeo = new THREE.SphereGeometry(1.02, 64, 64);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x6699dd, transparent: true, opacity: 0.06,
      side: THREE.FrontSide, depthWrite: false,
    });
    scene.add(new THREE.Mesh(atmoGeo, atmoMat));

    // Outer glow — Fresnel ShaderMaterial
    const glowGeo = new THREE.SphereGeometry(1.06, 64, 64);
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
    scene.add(new THREE.Mesh(glowGeo, glowMat));

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 1.8));

    // Groups
    const markerGroup = new THREE.Group();
    const baselineGroup = new THREE.Group();
    const countryLabelGroup = new THREE.Group();
    scene.add(markerGroup);
    scene.add(baselineGroup);
    scene.add(countryLabelGroup);
    markerGroupRef.current = markerGroup;
    baselineGroupRef.current = baselineGroup;
    countryLabelGroupRef.current = countryLabelGroup;

    // Load photo textures + country borders; track cancellation for unmount
    let cancelled = false;
    loadEarthTextures(earthMat, () => cancelled);
    loadCountryBoundaries(scene, countryLabelGroup, () => cancelled);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.set(0, 0, 2.8);
    cameraRef.current = camera;

    // OrbitControls
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.06;
    orbitControls.minDistance = 1.4;
    orbitControls.maxDistance = 6;
    orbitControls.autoRotate = true;
    orbitControls.autoRotateSpeed = 0.3;
    controlsRef.current = orbitControls;

    // Stop autorotate on user interaction, resume after 3s
    const stopAutoRotate = () => {
      orbitControls.autoRotate = false;
      clearTimeout(autoRotateTimerRef.current);
      autoRotateTimerRef.current = setTimeout(() => {
        orbitControls.autoRotate = true;
      }, 3000);
    };
    renderer.domElement.addEventListener('pointerdown', stopAutoRotate);

    // Click-to-place
    let downX = 0, downY = 0;
    const onPointerDown = (e) => { downX = e.clientX; downY = e.clientY; };
    const onPointerUp = (e) => {
      const dx = e.clientX - downX;
      const dy = e.clientY - downY;
      if (Math.abs(dx) >= 5 || Math.abs(dy) >= 5) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const hits = raycaster.intersectObject(earthMesh);
      if (hits.length > 0) {
        const pt = hits[0].point;
        const lat = Math.asin(pt.y) * 180 / Math.PI;
        const lon = Math.atan2(pt.z, pt.x) * 180 / Math.PI;
        onAddRef.current(lat, lon);
      }
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      labelRenderer.setSize(w, h);
      if (borderLineMat) borderLineMat.resolution.set(w, h);
    });
    resizeObserver.observe(container);

    // Animation loop
    const _occVec = new THREE.Vector3();
    function animate() {
      animFrameRef.current = requestAnimationFrame(animate);
      orbitControls.update();
      cloudMesh.rotation.y += 0.0001;

      for (const group of [markerGroup, countryLabelGroup]) {
        const isCountryGroup = group === countryLabelGroup;
        for (const child of group.children) {
          child.getWorldPosition(_occVec);
          const onFront = _occVec.dot(camera.position) > 0;
          const visible = isCountryGroup
            ? showCountryLabelsRef.current && onFront
            : onFront;
          child.traverse(obj => {
            if (obj.isCSS2DObject) obj.visible = visible;
          });
          if (child.isCSS2DObject) child.visible = visible;
        }
      }

      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animFrameRef.current);
      clearTimeout(autoRotateTimerRef.current);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', stopAutoRotate);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      countryLabelGroup.traverse(obj => {
        if (obj.isCSS2DObject && obj.element) obj.element.remove();
      });
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      if (container.contains(labelRenderer.domElement)) container.removeChild(labelRenderer.domElement);
    };
  }, []);

  // Effect 2: Update markers when telescopes change
  useEffect(() => {
    const markerGroup = markerGroupRef.current;
    const baselineGroup = baselineGroupRef.current;
    if (!markerGroup || !baselineGroup) return;
    syncTelescopeMarkers(markerGroup, baselineGroup, telescopes);
  }, [telescopes]);

  return html`<div
    ref=${containerRef}
    className="globe-container"
    aria-label="3D Earth globe — click to place radio telescopes"
  ></div>`;
}
