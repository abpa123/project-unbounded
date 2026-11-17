import * as THREE from './vendor/three.module.js';

const stage = document.getElementById('scene-canvas');
const story = document.querySelector('.story');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const motion = { progress: 0 };
const clamp = THREE.MathUtils.clamp;

function updateNavigation() {
  const header = document.querySelector('.site-header');
  header.classList.toggle('is-scrolled', window.scrollY > 45);
  const capabilitiesVisible = document.getElementById('capabilities').getBoundingClientRect().top < innerHeight * .55;
  const practiceVisible = document.getElementById('practice').getBoundingClientRect().top < innerHeight * .55;
  header.classList.toggle('on-capabilities', practiceVisible);
  const active = capabilitiesVisible ? '#capabilities' : practiceVisible ? '' : document.getElementById('approach').getBoundingClientRect().top < innerHeight * .52 ? '#approach' : '';
  document.querySelectorAll('.site-header nav a').forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === active));
}
addEventListener('scroll', updateNavigation, { passive: true });
updateNavigation();

if (window.gsap && window.ScrollTrigger && !reducedMotion) {
  gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis) {
    const lenis = new Lenis({ lerp: .2, wheelMultiplier: 1.08, anchors: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  gsap.to(motion, {
    progress: 1,
    ease: 'none',
    scrollTrigger: { trigger: story, start: 'top top', end: 'bottom bottom', scrub: .2 }
  });

  const hero = document.querySelector('.hero');
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from(hero.querySelector('.eyebrow'), { opacity: 0, y: 14, duration: .65 })
    .from(hero.querySelectorAll('.type-line'), { opacity: 0, y: 38, rotationX: -10, transformOrigin: '50% 100%', stagger: .12, duration: 1.05 }, '-=.3')
    .from(hero.querySelector('.lede'), { opacity: 0, y: 18, duration: .75 }, '-=.45')
    .from(hero.querySelector('.explore-button'), { opacity: 0, y: 16, duration: .7 }, '-=.4');

  document.querySelectorAll('.story-panel:not(.hero)').forEach(panel => {
    const timeline = gsap.timeline({
      scrollTrigger: { trigger: panel, start: 'top 80%', end: 'top 28%', scrub: .85 }
    });
    timeline.from(panel.querySelector('.story-rule'), { scaleX: 0, duration: 1 }, 0)
      .from(panel.querySelector('.eyebrow'), { opacity: 0, y: 17, duration: .65 }, .05)
      .from(panel.querySelectorAll('.type-line'), { opacity: 0, y: 46, rotationX: -9, transformOrigin: '50% 100%', stagger: .11, duration: .85 }, .16)
      .from(panel.querySelector('.lede'), { opacity: 0, y: 18, duration: .7 }, .48);
  });
  if (innerWidth > 700) {
    document.querySelectorAll('.story-panel').forEach(panel => {
      gsap.to(panel.querySelector('.story-copy'), {
        opacity: 0, y: -18, ease: 'none',
        scrollTrigger: { trigger: panel, start: 'bottom 84%', end: 'bottom 52%', scrub: .25 }
      });
    });
  }

  gsap.from('.capabilities-heading > *', {
    opacity: 0, y: 25, duration: .75, stagger: .12, ease: 'power2.out',
    scrollTrigger: { trigger: '.capabilities', start: 'top 72%' }
  });
  gsap.from('.practice-intro > *', {
    opacity: 0, y: 24, duration: .72, stagger: .11, ease: 'power2.out',
    scrollTrigger: { trigger: '.practice', start: 'top 72%' }
  });
  gsap.from('.practice-list > div', {
    opacity: 0, y: 18, duration: .64, stagger: .1, ease: 'power2.out',
    scrollTrigger: { trigger: '.practice-list', start: 'top 83%' }
  });
  gsap.from('.service-list > div', {
    opacity: 0, y: 20, duration: .62, stagger: .075, ease: 'power2.out',
    scrollTrigger: { trigger: '.service-list', start: 'top 82%' }
  });
} else {
  const updateProgress = () => {
    const length = Math.max(1, story.offsetHeight - innerHeight);
    motion.progress = clamp(scrollY / length, 0, 1);
  };
  addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
}

// All positions are deterministic so the same trail remains recognizable on return visits.
function randomGenerator(seed) {
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}
const random = randomGenerator(20261116);
const pathX = z => 2 * Math.sin((z - 12) * .072) + .65 * Math.sin(z * .16 + 1);
const pathWidth = z => 1.5 + .16 * Math.sin(z * .073);
const bridgeNear = -39.4;
const bridgeFar = -46.6;
const trailHeight = z => .38 * Math.sin(z * .065 + 1) + .12 * Math.sin(z * .19 - .4);
const riverCenter = x => -43 + .67 * Math.sin(x * .32) + .24 * Math.sin(x * .72);
const bridgeHeight = z => {
  const t = clamp((bridgeNear - z) / (bridgeNear - bridgeFar), 0, 1);
  return trailHeight(z) + .035 + .75 * Math.sin(Math.PI * t);
};
const walkHeight = z => z <= bridgeNear && z >= bridgeFar ? bridgeHeight(z) : trailHeight(z) + .035;
function groundHeight(x, z) {
  const away = clamp((Math.abs(x - pathX(z)) - 1.5) / 4, 0, 1);
  const rolls = .22 * Math.sin(x * .22 + z * .055) + .13 * Math.sin(z * .27 - x * .16) + .09 * Math.cos(x * .54 + z * .19);
  const riverDistance = Math.abs(z - riverCenter(x));
  const channel = .96 * Math.exp(-Math.pow(riverDistance / 2.35, 4));
  return trailHeight(z) + rolls * away - channel;
}

try {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#eaf3f8');
  scene.fog = new THREE.FogExp2('#eaf3f8', .011);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = false;
  stage.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(61, 1, .1, 145);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x90a9b1, 1.45));
  const sun = new THREE.DirectionalLight(0xffffff, 1.3);
  sun.position.set(-12, 21, 14);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536);
  sun.shadow.camera.left = -22;
  sun.shadow.camera.right = 22;
  sun.shadow.camera.top = 22;
  sun.shadow.camera.bottom = -22;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 60;
  sun.shadow.normalBias = .045;
  sun.shadow.radius = 4;
  scene.add(sun);
  scene.add(sun.target);

  // A rolling ground surface leaves a quiet clearing around the walkable path.
  const groundGeometry = new THREE.PlaneGeometry(70, 150, 110, 220);
  groundGeometry.rotateX(-Math.PI / 2);
  groundGeometry.translate(0, 0, -45);
  const groundPosition = groundGeometry.attributes.position;
  const groundColors = [];
  const groundNear = new THREE.Color('#dce9ec');
  const groundFar = new THREE.Color('#aec8ca');
  const riverBank = new THREE.Color('#91aeb7');
  for (let i = 0; i < groundPosition.count; i++) {
    const x = groundPosition.getX(i), z = groundPosition.getZ(i);
    const h = groundHeight(x, z);
    groundPosition.setY(i, h);
    const mix = clamp((Math.abs(x - pathX(z)) - 2) / 20, 0, 1) * .68 + clamp(h * .35, 0, .25);
    const color = groundNear.clone().lerp(groundFar, mix);
    color.lerp(riverBank, clamp(1 - Math.abs(z - riverCenter(x)) / 3.2, 0, 1) * .34);
    groundColors.push(color.r, color.g, color.b);
  }
  groundGeometry.setAttribute('color', new THREE.Float32BufferAttribute(groundColors, 3));
  groundGeometry.computeVertexNormals();
  const ground = new THREE.Mesh(groundGeometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, side: THREE.DoubleSide }));
  ground.receiveShadow = true;
  scene.add(ground);

  // The trail is a continuous surface, interrupted only where it crosses a stream.
  const trailVertices = [], trailIndices = [];
  for (let i = 0; i <= 520; i++) {
    const z = 19 - i * 140 / 520;
    const x = pathX(z), w = pathWidth(z);
    const y = trailHeight(z) + .035;
    trailVertices.push(x - w, y, z, x + w, y, z);
    if (i > 0 && !(z < bridgeNear && z > bridgeFar)) {
      const a = (i - 1) * 2, b = i * 2;
      trailIndices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const trailGeometry = new THREE.BufferGeometry();
  trailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(trailVertices, 3));
  trailGeometry.setIndex(trailIndices);
  trailGeometry.computeVertexNormals();
  const trail = new THREE.Mesh(trailGeometry, new THREE.MeshStandardMaterial({ color: '#eef7f9', roughness: 1, metalness: 0, side: THREE.DoubleSide }));
  trail.receiveShadow = true;
  scene.add(trail);

  // The river sits below the banks; soft moving lines suggest a slow current.
  const streamVertices = [], streamIndices = [], streamUvs = [], streamColors = [];
  const waterDeep = new THREE.Color('#70a8ba');
  const waterEdge = new THREE.Color('#a9cbd3');
  const waterColumns = 9;
  for (let i = 0; i <= 80; i++) {
    const x = -35 + i * 70 / 80;
    const center = riverCenter(x);
    const halfWidth = 3.1 + .18 * Math.sin(x * .36);
    const surface = trailHeight(center) - .66;
    for (let j = 0; j < waterColumns; j++) {
      const v = j / (waterColumns - 1);
      streamVertices.push(x, surface, center + (v * 2 - 1) * halfWidth);
      streamUvs.push(i / 80, v);
      const color = waterDeep.clone().lerp(waterEdge, Math.abs(v - .5) * .9);
      color.offsetHSL(0, 0, .025 * Math.sin(x * .91 + v * 11));
      streamColors.push(color.r, color.g, color.b);
      if (i && j) {
        const a = (i - 1) * waterColumns + j - 1, b = i * waterColumns + j - 1;
        streamIndices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const streamGeometry = new THREE.BufferGeometry();
  streamGeometry.setAttribute('position', new THREE.Float32BufferAttribute(streamVertices, 3));
  streamGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(streamUvs, 2));
  streamGeometry.setAttribute('color', new THREE.Float32BufferAttribute(streamColors, 3));
  streamGeometry.setIndex(streamIndices);
  streamGeometry.computeVertexNormals();
  scene.add(new THREE.Mesh(streamGeometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, side: THREE.DoubleSide })));
  const rippleCanvas = document.createElement('canvas');
  rippleCanvas.width = 512;
  rippleCanvas.height = 256;
  const rippleContext = rippleCanvas.getContext('2d');
  for (let i = 0; i < 48; i++) {
    const x = random() * 512, y = random() * 256, length = 28 + random() * 95;
    rippleContext.strokeStyle = `rgba(235, 250, 252, ${.24 + random() * .32})`;
    rippleContext.lineWidth = 1 + random() * 1.6;
    rippleContext.lineCap = 'round';
    rippleContext.beginPath();
    rippleContext.moveTo(x, y);
    rippleContext.bezierCurveTo(x + length * .3, y - 3, x + length * .7, y + 3, x + length, y);
    rippleContext.stroke();
  }
  const rippleTexture = new THREE.CanvasTexture(rippleCanvas);
  rippleTexture.colorSpace = THREE.SRGBColorSpace;
  rippleTexture.wrapS = THREE.RepeatWrapping;
  rippleTexture.repeat.set(6, 1);
  const rippleGeometry = streamGeometry.clone();
  const ripplePosition = rippleGeometry.attributes.position;
  for (let i = 0; i < ripplePosition.count; i++) ripplePosition.setY(i, ripplePosition.getY(i) + .012);
  rippleGeometry.computeVertexNormals();
  scene.add(new THREE.Mesh(rippleGeometry, new THREE.MeshBasicMaterial({ map: rippleTexture, transparent: true, opacity: .85, depthWrite: false, side: THREE.DoubleSide })));
  const currentMaterial = new THREE.MeshBasicMaterial({ color: '#d9edf0', transparent: true, opacity: .53, depthWrite: false });
  for (let i = 0; i < 38; i++) {
    const startX = (random() - .5) * 25;
    const length = .45 + random() * 1.1;
    const offset = (random() - .5) * 2.7;
    const points = [];
    for (let step = 0; step <= 6; step++) {
      const x = startX + length * step / 6;
      const center = riverCenter(x);
      points.push(new THREE.Vector3(x, trailHeight(center) - .635, center + offset + .045 * Math.sin(step * .9 + i)));
    }
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 12, .008, 5, false), currentMaterial));
  }
  const riverStoneGeometry = new THREE.SphereGeometry(1, 14, 10);
  const riverStoneMaterial = new THREE.MeshStandardMaterial({ color: '#a9c3c9', roughness: 1, metalness: 0 });
  for (let i = 0; i < 27; i++) {
    const x = (random() - .5) * 20;
    if (Math.abs(x - pathX(-43)) < 2.1) continue;
    const center = riverCenter(x);
    const z = center + (random() - .5) * 2.5;
    const stone = new THREE.Mesh(riverStoneGeometry, riverStoneMaterial);
    stone.position.set(x, trailHeight(center) - .65, z);
    stone.scale.set(.12 + random() * .22, .10 + random() * .13, .13 + random() * .24);
    stone.rotation.y = random() * Math.PI;
    scene.add(stone);
  }

  // A gently arched deck makes the crossing legible from the walking camera.
  const bridgeVertices = [], bridgeIndices = [];
  for (let i = 0; i <= 72; i++) {
    const z = bridgeNear + (bridgeFar - bridgeNear) * i / 72;
    const x = pathX(z), width = pathWidth(z) + .14, y = bridgeHeight(z);
    bridgeVertices.push(x - width, y, z, x + width, y, z, x - width, y - .13, z, x + width, y - .13, z);
    if (i) {
      const a = (i - 1) * 4, b = i * 4;
      bridgeIndices.push(a, a + 1, b, a + 1, b + 1, b, a, b, a + 2, a + 2, b, b + 2, a + 1, a + 3, b + 1, a + 3, b + 3, b + 1);
    }
  }
  const bridgeGeometry = new THREE.BufferGeometry();
  bridgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(bridgeVertices, 3));
  bridgeGeometry.setIndex(bridgeIndices);
  bridgeGeometry.computeVertexNormals();
  scene.add(new THREE.Mesh(bridgeGeometry, new THREE.MeshStandardMaterial({ color: '#b8cbd0', roughness: 1, metalness: 0, side: THREE.DoubleSide })));
  const abutmentMaterial = new THREE.MeshStandardMaterial({ color: '#a2b9bf', roughness: 1, metalness: 0 });
  for (const z of [bridgeNear, bridgeFar]) {
    for (const side of [-1, 1]) {
      const x = pathX(z) + side * (pathWidth(z) + .2);
      const stone = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), abutmentMaterial);
      stone.scale.set(.29, .18, .44);
      stone.position.set(x, groundHeight(x, z) + .065, z);
      scene.add(stone);
    }
  }
  const railMaterial = new THREE.MeshStandardMaterial({ color: '#829fa7', roughness: 1, metalness: 0 });
  const seamMaterial = new THREE.MeshStandardMaterial({ color: '#9fb8bf', roughness: 1, metalness: 0 });
  for (let i = 1; i < 21; i++) {
    const z = bridgeNear + (bridgeFar - bridgeNear) * i / 21;
    const x = pathX(z), width = pathWidth(z) + .1, y = bridgeHeight(z) + .009;
    const curve = new THREE.LineCurve3(new THREE.Vector3(x - width, y, z), new THREE.Vector3(x + width, y, z));
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 2, .008, 5, false), seamMaterial));
  }
  for (const side of [-1, 1]) {
    const lower = [], upper = [];
    for (let i = 0; i <= 36; i++) {
      const z = bridgeNear + (bridgeFar - bridgeNear) * i / 36;
      const x = pathX(z) + side * (pathWidth(z) + .15);
      lower.push(new THREE.Vector3(x, bridgeHeight(z) + .04, z));
      upper.push(new THREE.Vector3(x, bridgeHeight(z) + .74, z));
    }
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lower), 48, .065, 8, false), railMaterial));
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(upper), 48, .052, 8, false), railMaterial));
    for (let i = 0; i <= 8; i++) {
      const z = bridgeNear + (bridgeFar - bridgeNear) * i / 8;
      const x = pathX(z) + side * (pathWidth(z) + .15);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(.048, .048, .7, 10), railMaterial);
      post.position.set(x, bridgeHeight(z) + .39, z);
      scene.add(post);
    }
  }

  // Sculpt one irregular canopy shape, then compose hundreds of distinct trees from it.
  const blobGeometry = new THREE.SphereGeometry(1, 24, 18);
  const blobPosition = blobGeometry.attributes.position;
  for (let i = 0; i < blobPosition.count; i++) {
    const x = blobPosition.getX(i), y = blobPosition.getY(i), z = blobPosition.getZ(i);
    const shape = 1 + .052 * Math.sin(x * 5.1 + z * 3.7) + .035 * Math.cos(y * 7.3 - x * 2.2);
    blobPosition.setXYZ(i, x * shape, y * shape, z * shape);
  }
  blobGeometry.computeVertexNormals();
  const canopyMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, metalness: 0 });
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#78969c', roughness: 1, metalness: 0 });
  const branchMaterial = new THREE.MeshStandardMaterial({ color: '#7f9ca1', roughness: 1, metalness: 0 });
  const rockMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, metalness: 0 });
  const canopyColors = ['#5e8790', '#6f9a9f', '#82aeb0', '#9cc3c4', '#688e97'].map(value => new THREE.Color(value));
  const shrubColors = ['#7da6a9', '#8eb4b5', '#a3c5c4'].map(value => new THREE.Color(value));
  const rockColors = ['#a7bec8', '#b5cbd2', '#8faeb8'].map(value => new THREE.Color(value));
  const trees = [];
  for (let i = 0; i < (innerWidth < 700 ? 180 : 275); i++) {
    const z = 19 - random() * 137;
    if (Math.abs(z + 43) < 4) continue;
    if (z < -76 && random() < .38) continue; // the final stretch opens into a clearing
    const side = i % 2 ? 1 : -1;
    const distance = 3.15 + Math.pow(random(), 1.45) * 21;
    const x = pathX(z) + side * distance;
    const scale = .74 + random() * 1.02;
    trees.push({ x, z, y: groundHeight(x, z), height: (2.8 + random() * 1.7) * scale, radius: (1.02 + random() * .52) * scale, color: canopyColors[Math.floor(random() * canopyColors.length)], turn: random() * Math.PI * 2 });
  }
  const dummy = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0);
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.13, .2, 1, 7), trunkMaterial, trees.length);
  trunks.castShadow = true;
  trunks.receiveShadow = true;
  const branches = new THREE.InstancedMesh(new THREE.CylinderGeometry(.06, .095, 1, 6), branchMaterial, trees.length * 2);
  branches.castShadow = true;
  const crowns = new THREE.InstancedMesh(blobGeometry, canopyMaterial, trees.length * 3);
  crowns.castShadow = true;
  crowns.receiveShadow = true;
  trees.forEach((tree, index) => {
    const { x, y, z, height, radius, turn } = tree;
    dummy.position.set(x, y + height / 2, z);
    dummy.quaternion.identity();
    dummy.rotation.set(0, turn, 0);
    dummy.scale.set(1, height, 1);
    dummy.updateMatrix();
    trunks.setMatrixAt(index, dummy.matrix);
    for (let lobe = 0; lobe < 3; lobe++) {
      const angle = turn + lobe * Math.PI * 2 / 3;
      const offset = lobe === 0 ? 0 : radius * .58;
      dummy.position.set(x + Math.cos(angle) * offset, y + height + radius * (lobe === 0 ? .52 : .16), z + Math.sin(angle) * offset);
      dummy.quaternion.identity();
      dummy.rotation.set(0, angle, .05 * Math.sin(angle));
      const size = lobe === 0 ? radius : radius * .76;
      dummy.scale.set(size * 1.04, size * .92, size);
      dummy.updateMatrix();
      crowns.setMatrixAt(index * 3 + lobe, dummy.matrix);
      crowns.setColorAt(index * 3 + lobe, tree.color);
      if (lobe > 0) {
        const start = new THREE.Vector3(x, y + height * .76, z);
        const end = new THREE.Vector3(x + Math.cos(angle) * offset * .72, y + height + radius * .05, z + Math.sin(angle) * offset * .72);
        const direction = end.clone().sub(start);
        dummy.position.copy(start.add(end).multiplyScalar(.5));
        dummy.quaternion.setFromUnitVectors(up, direction.clone().normalize());
        dummy.scale.set(1, direction.length(), 1);
        dummy.updateMatrix();
        branches.setMatrixAt(index * 2 + lobe - 1, dummy.matrix);
      }
    }
  });
  trunks.instanceMatrix.needsUpdate = true;
  branches.instanceMatrix.needsUpdate = true;
  crowns.instanceMatrix.needsUpdate = true;
  crowns.instanceColor.needsUpdate = true;
  scene.add(trunks, branches, crowns);

  // Young trees along the trail make the walk feel planted at several scales.
  const youngCount = innerWidth < 700 ? 42 : 68;
  const youngTrunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.055, .09, 1, 10), trunkMaterial, youngCount);
  const youngCrowns = new THREE.InstancedMesh(blobGeometry, canopyMaterial, youngCount * 2);
  for (let i = 0; i < youngCount; i++) {
    let z = 17 - random() * 132;
    if (Math.abs(z + 43) < 4) z -= 8;
    const side = i % 2 ? 1 : -1;
    const x = pathX(z) + side * (2.45 + random() * 5.3);
    const y = groundHeight(x, z);
    const height = .92 + random() * .85;
    const crownSize = .39 + random() * .2;
    dummy.position.set(x, y + height * .5, z);
    dummy.quaternion.identity();
    dummy.scale.set(1, height, 1);
    dummy.updateMatrix();
    youngTrunks.setMatrixAt(i, dummy.matrix);
    for (let lobe = 0; lobe < 2; lobe++) {
      dummy.position.set(x + (lobe ? crownSize * .4 : 0), y + height + (lobe ? .1 : .22), z + (lobe ? crownSize * .3 : 0));
      dummy.quaternion.identity();
      dummy.scale.set(crownSize * (lobe ? .82 : 1), crownSize * .81, crownSize * (lobe ? .86 : 1));
      dummy.updateMatrix();
      youngCrowns.setMatrixAt(i * 2 + lobe, dummy.matrix);
      youngCrowns.setColorAt(i * 2 + lobe, shrubColors[Math.floor(random() * shrubColors.length)]);
    }
  }
  youngTrunks.instanceMatrix.needsUpdate = true;
  youngCrowns.instanceMatrix.needsUpdate = true;
  youngCrowns.instanceColor.needsUpdate = true;
  scene.add(youngTrunks, youngCrowns);

  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 64;
  const shadowContext = shadowCanvas.getContext('2d');
  const shadowFade = shadowContext.createRadialGradient(32, 32, 3, 32, 32, 32);
  shadowFade.addColorStop(0, 'rgba(38, 78, 86, .25)');
  shadowFade.addColorStop(1, 'rgba(38, 78, 86, 0)');
  shadowContext.fillStyle = shadowFade;
  shadowContext.fillRect(0, 0, 64, 64);
  const shadowGeometry = new THREE.PlaneGeometry(1, 1);
  shadowGeometry.rotateX(-Math.PI / 2);
  const contactShadows = new THREE.InstancedMesh(shadowGeometry, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, opacity: .55, depthWrite: false, side: THREE.DoubleSide }), trees.length);
  trees.forEach((tree, index) => {
    dummy.position.set(tree.x, tree.y + .035, tree.z);
    dummy.quaternion.identity();
    dummy.scale.set(tree.radius * 2.6, 1, tree.radius * 2.6);
    dummy.updateMatrix();
    contactShadows.setMatrixAt(index, dummy.matrix);
  });
  contactShadows.instanceMatrix.needsUpdate = true;
  scene.add(contactShadows);

  // Undergrowth gives the walk its scale without putting objects in the trail.
  const shrubs = new THREE.InstancedMesh(blobGeometry, canopyMaterial, innerWidth < 700 ? 200 : 330);
  const grass = new THREE.InstancedMesh(blobGeometry, new THREE.MeshStandardMaterial({ color: '#86afb0', roughness: 1 }), innerWidth < 700 ? 250 : 430);
  const rocks = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), rockMaterial, innerWidth < 700 ? 110 : 180);
  for (let i = 0; i < shrubs.count; i++) {
    let z = 20 - random() * 138;
    if (Math.abs(z + 43) < 4) z -= 8;
    const side = random() < .5 ? -1 : 1;
    const x = pathX(z) + side * (2.1 + random() * 15);
    const size = .22 + random() * .54;
    dummy.position.set(x, groundHeight(x, z) + size * .31, z);
    dummy.quaternion.identity();
    dummy.rotation.set(0, random() * Math.PI * 2, 0);
    dummy.scale.set(size * 1.25, size * .62, size);
    dummy.updateMatrix();
    shrubs.setMatrixAt(i, dummy.matrix);
    shrubs.setColorAt(i, shrubColors[Math.floor(random() * shrubColors.length)]);
  }
  for (let i = 0; i < grass.count; i++) {
    let z = 20 - random() * 138;
    if (Math.abs(z + 43) < 4) z -= 8;
    const side = random() < .5 ? -1 : 1;
    const x = pathX(z) + side * (1.8 + random() * 10);
    const height = .24 + random() * .42;
    dummy.position.set(x, groundHeight(x, z) + height * .28, z);
    dummy.quaternion.identity();
    dummy.rotation.set(0, random() * Math.PI * 2, (random() - .5) * .4);
    dummy.scale.set(.10 + random() * .09, height * .55, .10 + random() * .09);
    dummy.updateMatrix();
    grass.setMatrixAt(i, dummy.matrix);
  }
  for (let i = 0; i < rocks.count; i++) {
    let z = 20 - random() * 138;
    if (Math.abs(z + 43) < 4) z -= 8;
    const side = random() < .5 ? -1 : 1;
    const x = pathX(z) + side * (1.65 + random() * 9);
    const size = .1 + random() * .27 + Math.pow(random(), 9) * .5;
    dummy.position.set(x, groundHeight(x, z) + size * .28, z);
    dummy.quaternion.identity();
    dummy.rotation.set(random() * .25, random() * Math.PI * 2, random() * .2);
    dummy.scale.set(size * 1.2, size * .55, size);
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
    rocks.setColorAt(i, rockColors[Math.floor(random() * rockColors.length)]);
  }
  shrubs.instanceMatrix.needsUpdate = true;
  shrubs.instanceColor.needsUpdate = true;
  grass.instanceMatrix.needsUpdate = true;
  rocks.instanceMatrix.needsUpdate = true;
  rocks.instanceColor.needsUpdate = true;
  scene.add(shrubs, grass, rocks);

  const trailStones = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), rockMaterial, innerWidth < 700 ? 220 : 360);
  const trailStoneColors = ['#c3d8df', '#d2e3e9', '#b7d0d8'].map(value => new THREE.Color(value));
  for (let i = 0; i < trailStones.count; i++) {
    let z = 17 - random() * 132;
    if (z < bridgeNear && z > bridgeFar) z -= 8;
    const x = pathX(z) + (random() - .5) * pathWidth(z) * 1.65;
    const size = .035 + random() * .07;
    dummy.position.set(x, trailHeight(z) + .046, z);
    dummy.quaternion.identity();
    dummy.rotation.set(0, random() * Math.PI * 2, 0);
    dummy.scale.set(size * 1.4, size * .22, size);
    dummy.updateMatrix();
    trailStones.setMatrixAt(i, dummy.matrix);
    trailStones.setColorAt(i, trailStoneColors[Math.floor(random() * trailStoneColors.length)]);
  }
  trailStones.instanceMatrix.needsUpdate = true;
  trailStones.instanceColor.needsUpdate = true;
  scene.add(trailStones);

  const ferns = new THREE.InstancedMesh(blobGeometry, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 }), innerWidth < 700 ? 130 : 220);
  const fernColors = ['#8cb1b5', '#9ec0c2', '#afcdce'].map(value => new THREE.Color(value));
  for (let i = 0; i < ferns.count; i++) {
    let z = 17 - random() * 134;
    if (Math.abs(z + 43) < 4) z -= 8;
    const side = random() < .5 ? -1 : 1;
    const x = pathX(z) + side * (2.2 + random() * 6.5);
    const size = .42 + random() * .64;
    dummy.position.set(x, groundHeight(x, z) + .015, z);
    dummy.quaternion.identity();
    dummy.rotation.set(0, random() * Math.PI * 2, 0);
    dummy.scale.set(size * .45, size * .28, size * .65);
    dummy.updateMatrix();
    ferns.setMatrixAt(i, dummy.matrix);
    ferns.setColorAt(i, fernColors[Math.floor(random() * fernColors.length)]);
  }
  ferns.instanceMatrix.needsUpdate = true;
  ferns.instanceColor.needsUpdate = true;
  scene.add(ferns);

  const fallenLogs = new THREE.InstancedMesh(new THREE.CylinderGeometry(.105, .14, 1, 8), trunkMaterial, 24);
  for (let i = 0; i < fallenLogs.count; i++) {
    let z = 16 - random() * 130;
    if (Math.abs(z + 43) < 4) z -= 8;
    const side = random() < .5 ? -1 : 1;
    const x = pathX(z) + side * (3.1 + random() * 11);
    const angle = random() * Math.PI * 2;
    const length = 1.1 + random() * 2.2;
    const halfX = Math.cos(angle) * length * .5, halfZ = Math.sin(angle) * length * .5;
    const endA = new THREE.Vector3(x - halfX, groundHeight(x - halfX, z - halfZ) + .11, z - halfZ);
    const endB = new THREE.Vector3(x + halfX, groundHeight(x + halfX, z + halfZ) + .11, z + halfZ);
    const direction = endB.clone().sub(endA);
    dummy.position.copy(endA.add(endB).multiplyScalar(.5));
    dummy.quaternion.setFromUnitVectors(up, direction.clone().normalize());
    dummy.scale.set(1, direction.length(), 1);
    dummy.updateMatrix();
    fallenLogs.setMatrixAt(i, dummy.matrix);
  }
  fallenLogs.instanceMatrix.needsUpdate = true;
  scene.add(fallenLogs);

  function resize() {
    const width = Math.max(1, stage.clientWidth), height = Math.max(1, stage.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  addEventListener('resize', resize);
  resize();

  let firstFrame = true;
  function render() {
    const progress = reducedMotion ? 0 : clamp(motion.progress, 0, 1);
    const z = 12 - progress * 92;
    const x = pathX(z);
    camera.position.set(x, 1.77 + walkHeight(z), z);
    camera.lookAt(pathX(z - 10), 1.66 + walkHeight(z - 10), z - 10);
    sun.position.set(x - 13, 21, z + 8);
    sun.target.position.set(x, 0, z - 10);
    sun.target.updateMatrixWorld();
    if (!reducedMotion) {
      const time = performance.now() * .001;
      const waterPosition = streamGeometry.attributes.position;
      for (let i = 0; i < waterPosition.count; i++) {
        const x = waterPosition.getX(i), z = waterPosition.getZ(i);
        const base = streamVertices[i * 3 + 1];
        const wave = .025 * Math.sin(x * 1.45 - time * 1.3 + z * .8) + .013 * Math.sin(x * 2.6 + time * .8 - z * 1.1);
        waterPosition.setY(i, base + wave);
        ripplePosition.setY(i, base + wave + .012);
      }
      waterPosition.needsUpdate = true;
      ripplePosition.needsUpdate = true;
      streamGeometry.computeVertexNormals();
      rippleTexture.offset.x = (time * .012) % 1;
    }
    renderer.render(scene, camera);
    if (firstFrame) { document.body.classList.add('webgl-ready'); firstFrame = false; }
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
} catch (error) {
  console.warn('Forest scene unavailable:', error);
}
