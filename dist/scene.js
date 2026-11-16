import * as THREE from './vendor/three.module.js';

const stage = document.getElementById('scene-canvas');
const story = document.querySelector('.story');
const progressFill = document.getElementById('route-indicator-fill');
const progressTip = document.getElementById('route-indicator-tip');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const motion = { progress: 0 };

function setProgress(value) {
  motion.progress = THREE.MathUtils.clamp(value, 0, 1);
  progressFill.style.height = `${motion.progress * 100}%`;
  progressTip.style.top = `${motion.progress * 100}%`;
}

if (!reducedMotion && window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.to(motion, {
    progress: 1,
    ease: 'none',
    scrollTrigger: { trigger: story, start: 'top top', end: 'bottom bottom', scrub: 1.1 },
    onUpdate: () => setProgress(motion.progress)
  });
  document.querySelectorAll('.story-panel').forEach((panel, index) => {
    const lines = panel.querySelectorAll('.mask > span');
    gsap.from(lines, {
      yPercent: 110,
      duration: 1.05,
      ease: 'power3.out',
      stagger: 0.09,
      scrollTrigger: { trigger: panel, start: index ? 'top 67%' : 'top 98%', toggleActions: 'play none none reverse' }
    });
    gsap.from(panel.querySelectorAll('.section-kicker, .lede, .text-action'), {
      autoAlpha: 0,
      y: 16,
      duration: 0.75,
      ease: 'power2.out',
      stagger: 0.12,
      delay: index ? 0 : 0.18,
      scrollTrigger: { trigger: panel, start: index ? 'top 65%' : 'top 98%', toggleActions: 'play none none reverse' }
    });
  });
  gsap.from('.service-list > div', {
    y: 20,
    autoAlpha: 0,
    duration: 0.7,
    stagger: 0.075,
    ease: 'power2.out',
    scrollTrigger: { trigger: '.service-list', start: 'top 80%' }
  });
} else {
  const update = () => {
    const max = Math.max(1, story.offsetHeight - innerHeight);
    setProgress(scrollY / max);
  };
  addEventListener('scroll', update, { passive: true });
  update();
}

const heightAt = (x, z) => {
  const peak = (cx, cz, sx, sz, power) => power * Math.exp(-(((x - cx) / sx) ** 2 + ((z - cz) / sz) ** 2));
  const edge = Math.min(1, Math.max(0, (8 - Math.abs(x)) / 1.7)) * Math.min(1, Math.max(0, (8 - Math.abs(z)) / 1.7));
  const hills = peak(-4.1, -1.5, 3.0, 3.5, 1.55) + peak(3.3, 2.5, 3.8, 2.7, 1.12) + peak(3.5, -4.7, 2.7, 2.5, 1.28);
  const folds = 0.13 * Math.sin(x * 1.35 + z * .48) * Math.sin(z * .94 - x * .3);
  return Math.max(0, (hills + folds + .06) * edge);
};

try {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f6f7f3');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);

  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, .1, 100);
  const ambient = new THREE.HemisphereLight(0xffffff, 0xc6d2cf, 2.25);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffffff, 3.2);
  sun.position.set(-7, 15, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -20;
  sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 20;
  sun.shadow.camera.bottom = -20;
  sun.shadow.normalBias = .03;
  scene.add(sun);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({ opacity: .16 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -.55;
  floor.receiveShadow = true;
  scene.add(floor);

  const slab = new THREE.Mesh(new THREE.BoxGeometry(16, .45, 16), new THREE.MeshStandardMaterial({ color: '#d4dad9', roughness: 1 }));
  slab.position.y = -.275;
  slab.castShadow = true;
  slab.receiveShadow = true;
  scene.add(slab);
  const slabEdge = new THREE.LineSegments(new THREE.EdgesGeometry(slab.geometry), new THREE.LineBasicMaterial({ color: '#aebcbe', transparent: true, opacity: .48 }));
  slabEdge.position.copy(slab.position);
  scene.add(slabEdge);

  const terrainGeometry = new THREE.PlaneGeometry(16, 16, 150, 150);
  terrainGeometry.rotateX(-Math.PI / 2);
  const position = terrainGeometry.attributes.position;
  const colors = [];
  const low = new THREE.Color('#e9eeeb');
  const mid = new THREE.Color('#cbdcd7');
  const high = new THREE.Color('#abc9c4');
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), z = position.getZ(i), y = heightAt(x, z);
    position.setY(i, y);
    const color = y < .65 ? low.clone().lerp(mid, y / .65) : mid.clone().lerp(high, Math.min(1, (y - .65) / 1.1));
    colors.push(color.r, color.g, color.b);
  }
  terrainGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  terrainGeometry.computeVertexNormals();
  const terrain = new THREE.Mesh(terrainGeometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .93, metalness: 0, side: THREE.DoubleSide }));
  terrain.receiveShadow = true;
  terrain.castShadow = true;
  scene.add(terrain);

  // Marching squares trace the terrain at real elevation levels.
  const contourVertices = [];
  const grid = 112, size = 16;
  for (let level = .12; level <= 1.9; level += .16) {
    for (let ix = 0; ix < grid; ix++) for (let iz = 0; iz < grid; iz++) {
      const x0 = -8 + ix * size / grid, x1 = -8 + (ix + 1) * size / grid;
      const z0 = -8 + iz * size / grid, z1 = -8 + (iz + 1) * size / grid;
      const corners = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
      const values = corners.map(([x, z]) => heightAt(x, z));
      const crossings = [];
      for (let edge = 0; edge < 4; edge++) {
        const next = (edge + 1) % 4, a = values[edge], b = values[next];
        if ((a < level && b >= level) || (b < level && a >= level)) {
          const t = (level - a) / (b - a);
          crossings.push([corners[edge][0] + (corners[next][0] - corners[edge][0]) * t, level + .024, corners[edge][1] + (corners[next][1] - corners[edge][1]) * t]);
        }
      }
      for (let k = 0; k + 1 < crossings.length; k += 2) contourVertices.push(...crossings[k], ...crossings[k + 1]);
    }
  }
  const contourGeometry = new THREE.BufferGeometry();
  contourGeometry.setAttribute('position', new THREE.Float32BufferAttribute(contourVertices, 3));
  const contours = new THREE.LineSegments(contourGeometry, new THREE.LineBasicMaterial({ color: '#64858e', transparent: true, opacity: .42, depthWrite: false }));
  scene.add(contours);

  const controls = [[-5.4, 5.9], [-4.3, 3.9], [-2.4, 2.5], [-1.1, .5], [.5, -1.3], [2.3, -2.7], [1.2, -4.4], [3.6, -6.2]];
  const groundCurve = new THREE.CatmullRomCurve3(controls.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'catmullrom', .35);
  class SurfaceCurve extends THREE.Curve {
    getPoint(t, target = new THREE.Vector3()) {
      const p = groundCurve.getPoint(t);
      return target.set(p.x, heightAt(p.x, p.z) + .18, p.z);
    }
  }
  const routeCurve = new SurfaceCurve();
  const routeBase = new THREE.Mesh(new THREE.TubeGeometry(routeCurve, 500, .057, 10, false), new THREE.MeshStandardMaterial({ color: '#a2b4d4', roughness: .45, transparent: true, opacity: .7 }));
  scene.add(routeBase);
  const activeGeometry = new THREE.TubeGeometry(routeCurve, 500, .068, 10, false);
  const route = new THREE.Mesh(activeGeometry, new THREE.MeshStandardMaterial({ color: '#214bd4', roughness: .3, metalness: .13, emissive: '#092388', emissiveIntensity: .12 }));
  route.castShadow = true;
  scene.add(route);
  const totalRouteIndices = activeGeometry.index.count;

  const pinMaterial = new THREE.MeshStandardMaterial({ color: '#173d70', roughness: .35, metalness: .25 });
  const pinCore = new THREE.MeshStandardMaterial({ color: '#2454e1', roughness: .25, metalness: .2 });
  for (const t of [.22, .51, .81]) {
    const p = routeCurve.getPoint(t);
    const group = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.19, .018, 8, 40), pinMaterial);
    ring.rotation.x = -Math.PI / 2;
    group.add(ring);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .48, 10), pinMaterial);
    stem.position.y = .24;
    stem.castShadow = true;
    group.add(stem);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.09, 18, 12), pinCore);
    head.position.y = .51;
    head.castShadow = true;
    group.add(head);
    group.position.set(p.x, heightAt(p.x, p.z) + .09, p.z);
    scene.add(group);
  }
  const traveler = new THREE.Mesh(new THREE.SphereGeometry(.14, 24, 16), new THREE.MeshStandardMaterial({ color: '#1c4bdf', roughness: .19, metalness: .22, emissive: '#1435a0', emissiveIntensity: .2 }));
  traveler.castShadow = true;
  scene.add(traveler);

  const cameraStates = [
    { at: 0, pos: [13.5, 16, 18], look: [-2.1, .2, 0], zoom: .86 },
    { at: .29, pos: [10.7, 11.5, 13], look: [-3.4, .2, 2.5], zoom: 1.14 },
    { at: .61, pos: [10.5, 11.4, 10], look: [-.3, .2, -.6], zoom: 1.21 },
    { at: .91, pos: [10, 10.4, 8.5], look: [2.2, .2, -4.1], zoom: 1.28 },
    { at: 1, pos: [13.5, 16, 18], look: [-1.1, .2, -.2], zoom: .93 }
  ];
  const mix = (a, b, t) => a + (b - a) * t;
  function cameraAt(p) {
    let i = 0;
    while (i < cameraStates.length - 2 && p > cameraStates[i + 1].at) i++;
    const a = cameraStates[i], b = cameraStates[i + 1];
    let t = THREE.MathUtils.clamp((p - a.at) / (b.at - a.at), 0, 1);
    t = t * t * (3 - 2 * t);
    const position = a.pos.map((v, k) => mix(v, b.pos[k], t));
    const target = a.look.map((v, k) => mix(v, b.look[k], t));
    camera.position.set(...position);
    camera.lookAt(...target);
    camera.zoom = mix(a.zoom, b.zoom, t);
    camera.updateProjectionMatrix();
  }
  function resize() {
    const width = Math.max(1, stage.clientWidth), height = Math.max(1, stage.clientHeight);
    const aspect = width / height;
    const extent = width < 700 ? 19.5 : 21.5;
    camera.left = -extent * aspect / 2;
    camera.right = extent * aspect / 2;
    camera.top = extent / 2;
    camera.bottom = -extent / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  addEventListener('resize', resize);
  resize();
  if (reducedMotion) setProgress(1);
  let firstFrame = true;
  function render(time) {
    const p = reducedMotion ? 1 : motion.progress;
    cameraAt(p);
    const drawn = Math.max(.06, Math.min(1, .06 + p * .98));
    activeGeometry.setDrawRange(0, Math.floor(totalRouteIndices * drawn / 6) * 6);
    const marker = routeCurve.getPoint(drawn);
    traveler.position.copy(marker);
    traveler.position.y += .09 + (reducedMotion ? 0 : Math.sin(time * .0022) * .025);
    renderer.render(scene, camera);
    if (firstFrame) { document.body.classList.add('webgl-ready'); firstFrame = false; }
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
} catch (error) {
  console.warn('3D scene unavailable:', error);
}
