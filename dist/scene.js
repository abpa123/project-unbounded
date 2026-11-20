import * as THREE from './vendor/three.module.js';

const stage = document.getElementById('scene-canvas');
const story = document.querySelector('.story');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const motion = { progress: 0 };
const clamp = THREE.MathUtils.clamp;
const panels = [...document.querySelectorAll('.story-panel')];
const trailScroll = document.querySelector('.trail-sign');
let updateArchSign = () => {};
const CHEST_STOP = 1;
const chestState = { reveal: 0, hover: 0, lid: 0, burst: 0, opened: false };
let stops = [0, .25, .5, .75];
let activeStop = -1;
let siteLenis = null;
const animate = !reducedMotion && !!window.gsap;
function measureStops() { const range = Math.max(1, story.scrollHeight - innerHeight); stops = panels.map(panel => clamp(panel.offsetTop / range, 0, 1)); }
function updateChestStop() { activeStop = stops.reduce((best, stop, i) => Math.abs(stop - motion.progress) < Math.abs(stops[best] - motion.progress) ? i : best, 0); if (activeStop === CHEST_STOP && chestState.reveal === 0) { if (animate) gsap.to(chestState, { reveal: 1, duration: 1, ease: 'back.out(1.5)' }); else chestState.reveal = 1; } }
addEventListener('resize', measureStops);
addEventListener('scroll', updateChestStop, { passive: true });
measureStops();
const header = document.querySelector('.site-header');
const nav = header.querySelector('nav');
const navLinks = [...nav.querySelectorAll('a')];
let hoveredNavLink = null;

function positionNavIndicator(link) {
  if (!link || getComputedStyle(link).display === 'none') {
    nav.style.setProperty('--indicator-opacity', '0');
    return;
  }
  nav.style.setProperty('--indicator-x', `${link.offsetLeft}px`);
  nav.style.setProperty('--indicator-width', `${link.offsetWidth}px`);
  nav.style.setProperty('--indicator-opacity', '1');
}

function updateNavigation() {
  header.classList.toggle('is-scrolled', window.scrollY > 90);
  const capabilitiesRect = document.getElementById('capabilities').getBoundingClientRect();
  const capabilitiesVisible = capabilitiesRect.top < innerHeight * .55 && capabilitiesRect.bottom > 80;
  const methodRect = document.getElementById('method').getBoundingClientRect();
  const methodVisible = methodRect.top < innerHeight * .55 && methodRect.bottom > 80;
  const practiceRect = document.getElementById('practice').getBoundingClientRect();
  const practiceVisible = practiceRect.top < innerHeight * .55 && practiceRect.bottom > 80;
  header.classList.toggle('on-capabilities', practiceRect.top < innerHeight * .55);
  const active = capabilitiesVisible || methodVisible ? '#capabilities' : practiceVisible ? '#practice' : document.getElementById('approach').getBoundingClientRect().top < innerHeight * .52 ? '#approach' : '';
  navLinks.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === active));
  positionNavIndicator(hoveredNavLink || navLinks.find(link => link.classList.contains('is-active')));
}
addEventListener('scroll', updateNavigation, { passive: true });
addEventListener('resize', updateNavigation, { passive: true });
navLinks.forEach(link => link.addEventListener('mouseenter', () => {
  hoveredNavLink = link;
  positionNavIndicator(link);
}));
nav.addEventListener('mouseleave', () => {
  hoveredNavLink = null;
  updateNavigation();
});
updateNavigation();

const momentsRoute = document.querySelector('.moments-route path');
const routeStops = [...document.querySelectorAll('.moments-route circle')];
const moments = [...document.querySelectorAll('.moment')];
const routeLength = momentsRoute.getTotalLength();
routeStops.forEach(stop => {
  const x = Number(stop.getAttribute('cx'));
  let low = 0, high = routeLength;
  for (let i = 0; i < 24; i++) {
    const middle = (low + high) / 2;
    if (momentsRoute.getPointAtLength(middle).x < x) low = middle;
    else high = middle;
  }
  stop.setAttribute('cy', momentsRoute.getPointAtLength((low + high) / 2).y.toFixed(2));
});

const headlineSelector = '.story-panel h1, .story-panel h2, .practice h2, .capabilities h2, .method h2, .moments h2, .engagement h2';
function wrapHeadlineWords(root) {
  for (const node of [...root.childNodes]) {
    if (node.nodeType === Node.TEXT_NODE) {
      const fragment = document.createDocumentFragment();
      for (const token of node.textContent.match(/\S+|\s+/g) || []) {
        if (/^\s+$/.test(token)) { fragment.append(token); continue; }
        const outer = document.createElement('span');
        const inner = document.createElement('span');
        outer.className = 'headline-word';
        inner.className = 'headline-word-inner';
        inner.textContent = token;
        outer.append(inner);
        fragment.append(outer);
      }
      node.replaceWith(fragment);
    } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('headline-word')) {
      wrapHeadlineWords(node);
    }
  }
}
if (!reducedMotion) document.querySelectorAll(headlineSelector).forEach(wrapHeadlineWords);

const exploreButton = document.querySelector('.explore-button');
if (!reducedMotion && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  exploreButton.addEventListener('pointermove', event => {
    const rect = exploreButton.getBoundingClientRect();
    exploreButton.style.setProperty('--mag-x', `${((event.clientX - rect.left) / rect.width - .5) * 9}px`);
    exploreButton.style.setProperty('--mag-y', `${((event.clientY - rect.top) / rect.height - .5) * 6}px`);
  });
  exploreButton.addEventListener('pointerleave', () => {
    exploreButton.style.setProperty('--mag-x', '0px');
    exploreButton.style.setProperty('--mag-y', '0px');
  });
}

function revealHeading(heading, trigger) {
  const words = [...heading.querySelectorAll('.headline-word-inner')];
  const regular = words.filter(word => !word.closest('em'));
  const accent = words.filter(word => word.closest('em'));
  const timeline = gsap.timeline(trigger ? { scrollTrigger: { trigger, start: 'top 83%', once: true } } : {});
  timeline.from(regular, { yPercent: 105, opacity: 0, duration: .72, stagger: .075, ease: 'power3.out' });
  if (accent.length) timeline.from(accent, { yPercent: 105, opacity: 0, duration: .82, stagger: .075, ease: 'power3.out' }, '-=.37');
  return timeline;
}

if (window.gsap && window.ScrollTrigger && !reducedMotion) {
  gsap.registerPlugin(ScrollTrigger);
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  if (window.Lenis) {
    const lenis = new Lenis({ lerp: .16, wheelMultiplier: 1.12, anchors: true });
    siteLenis = lenis;
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
  const heroTimeline = revealHeading(hero.querySelector('h1'));
  heroTimeline.from(hero.querySelector('.lede'), { opacity: 0, y: 14, duration: .68, ease: 'power2.out' }, '-=.4')
    .from(hero.querySelector('.explore-button'), { opacity: 0, y: 15, duration: .68, ease: 'power2.out' }, '-=.43');
  gsap.from('.scene-canvas', { opacity: 0, duration: 1.45, delay: .14, ease: 'power2.out' });

  document.querySelectorAll('.story-panel:not(.hero)').forEach(panel => {
    revealHeading(panel.querySelector('h2'), panel);
    gsap.from([panel.querySelector('.eyebrow'), panel.querySelector('.lede')], {
      opacity: 0, y: 12, duration: .65, stagger: .1, ease: 'power2.out',
      scrollTrigger: { trigger: panel, start: 'top 82%', once: true }
    });
  });

  for (const selector of ['.practice-intro', '.capabilities-heading', '.method-heading', '.moments-heading', '.engagement-copy']) {
    const heading = document.querySelector(selector);
    revealHeading(heading.querySelector('h2'), heading);
    gsap.from([...heading.children].filter(child => child.tagName !== 'H2'), {
      opacity: 0, y: 12, duration: .65, stagger: .09, ease: 'power2.out',
      scrollTrigger: { trigger: heading, start: 'top 84%', once: true }
    });
  }
  document.querySelectorAll('.practice-list > div, .method-steps > article').forEach(row => {
    gsap.from(row, {
      opacity: 0, y: 18, duration: .7, ease: 'power2.out',
      scrollTrigger: { trigger: row, start: 'top 90%', once: true }
    });
  });
  gsap.from('.service-list > div', {
    clipPath: 'inset(0 0 100% 0)', opacity: 0, y: 24,
    duration: 1.05, stagger: .12, ease: 'power3.out',
    scrollTrigger: { trigger: '.service-list', start: 'top 82%', once: true }
  });
  const routeTimeline = gsap.timeline({ scrollTrigger: { trigger: '.moments', start: 'top 70%', end: 'top -15%', scrub: 2.4 } });
  routeTimeline.fromTo(momentsRoute, { strokeDasharray: routeLength, strokeDashoffset: routeLength }, { strokeDashoffset: 0, duration: 1, ease: 'none' }, 0);
  routeStops.forEach((stop, index) => {
    const at = [.09, .47, .88][index];
    routeTimeline.fromTo(stop, { opacity: 0, scale: .4, transformOrigin: 'center' }, { opacity: 1, scale: 1, duration: .12, ease: 'power2.out' }, at);
  });
  gsap.from(moments, {
    opacity: 0, y: 18, duration: .85, stagger: .16, ease: 'power2.out',
    scrollTrigger: { trigger: '.moments-grid', start: 'top 90%', once: true }
  });
  gsap.from('.engagement-terms > div', {
    opacity: 0, y: 22, duration: .85, stagger: .16, ease: 'power3.out',
    scrollTrigger: { trigger: '.engagement-terms', start: 'top 85%' }
  });
  gsap.from('.site-footer > *', {
    opacity: 0, y: 12, duration: .65, stagger: .1, ease: 'power2.out',
    scrollTrigger: { trigger: '.site-footer', start: 'top 95%' }
  });
  gsap.from('.footer-brand', {
    opacity: 0, y: 30, duration: 1.1, ease: 'power3.out',
    scrollTrigger: { trigger: '.site-footer', start: 'top 78%', once: true }
  });
  gsap.from('.footer-meta > *', {
    opacity: 0, y: 16, duration: .8, stagger: .16, ease: 'power2.out',
    scrollTrigger: { trigger: '.site-footer', start: 'top 75%', once: true }
  });
  const practicePath = document.querySelector('.practice-route path');
  const practicePathLength = practicePath.getTotalLength();
  gsap.fromTo(practicePath, { strokeDasharray: practicePathLength, strokeDashoffset: practicePathLength }, {
    strokeDashoffset: 0, ease: 'none',
    scrollTrigger: { trigger: '.practice', start: 'top 78%', end: 'top 30%', scrub: .55 }
  });
  gsap.fromTo('.practice-route', { xPercent: -4 }, {
    xPercent: 4, ease: 'none',
    scrollTrigger: { trigger: '.practice', start: 'top bottom', end: 'bottom top', scrub: .6 }
  });
  for (const [selector, from, to] of [
    ['.practice', '#e6f2fa', '#dcecf7'],
    ['.method', '#e0f1fb', '#d2e9f8'],
    ['.moments', '#f0f8fd', '#e5f3fb'],
    ['.engagement', '#e0f0fa', '#d7eaf7']
  ]) {
    gsap.fromTo(selector, { backgroundColor: from }, {
      backgroundColor: to, ease: 'none',
      scrollTrigger: { trigger: selector, start: 'top bottom', end: 'bottom top', scrub: .7 }
    });
  }
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
const sidePathX = (z, side) => {
  const t = clamp((3 - z) / 29, 0, 1);
  return pathX(z) + side * 3.8 * Math.pow(Math.sin(Math.PI * t), .9);
};
const crossesSidePath = (x, z, clearance = 0) => z < 3 && z > -26 && Math.abs(x - sidePathX(z, 1)) < 1.05 + clearance;
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
  scene.background = new THREE.Color('#e6f4fb');
  scene.fog = new THREE.FogExp2('#e6f4fb', .011);
  const fogStops = ['#e6f4fb', '#dfedf7', '#e9f5f9', '#dfedf8'].map(color => new THREE.Color(color));
  const currentFog = new THREE.Color();
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = false;
  stage.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(61, 1, .1, 145);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x95b9d0, 1.52));
  const sun = new THREE.DirectionalLight(0xffffff, 1.18);
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
  const groundGeometry = new THREE.PlaneGeometry(70, 210, 110, 280);
  groundGeometry.rotateX(-Math.PI / 2);
  groundGeometry.translate(0, 0, -70);
  const groundPosition = groundGeometry.attributes.position;
  const groundColors = [];
  const groundNear = new THREE.Color('#dcecf6');
  const groundFar = new THREE.Color('#a9cde1');
  const riverBank = new THREE.Color('#94bdd4');
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
  const hillGeometry = new THREE.SphereGeometry(1, 32, 18);
  const hillMaterial = new THREE.MeshStandardMaterial({ color: '#bfd5e2', roughness: 1, metalness: 0 });
  for (const [x, y, z, width, height, depth] of [
    [-25, -5.2, -151, 26, 9.4, 25],
    [25, -5.9, -154, 27, 9.8, 27],
    [0, -4.4, -186, 26, 6.2, 19]
  ]) {
    const hill = new THREE.Mesh(hillGeometry, hillMaterial);
    hill.position.set(x, y, z);
    hill.scale.set(width, height, depth);
    scene.add(hill);
  }

  // The trail blends into the ground at its shoulders and joins two quieter routes.
  const trailVertices = [], trailIndices = [], trailColors = [];
  const trailOffsets = [-1.25, -1, -.62, 0, .62, 1, 1.25];
  const trailCenter = new THREE.Color('#f5fbfe');
  const trailShoulder = new THREE.Color('#e7f3fa');
  const trailEdge = new THREE.Color('#dcecf6');
  for (let i = 0; i <= 700; i++) {
    const z = 19 - i * 190 / 700;
    const x = pathX(z), w = pathWidth(z);
    for (let j = 0; j < trailOffsets.length; j++) {
      const offset = trailOffsets[j], px = x + offset * w, edge = Math.abs(offset);
      const y = edge > 1 ? groundHeight(px, z) + .009 : trailHeight(z) + .035 - edge * .01;
      const color = edge > 1 ? trailEdge : trailCenter.clone().lerp(trailShoulder, edge * .7);
      trailVertices.push(px, y, z);
      trailColors.push(color.r, color.g, color.b);
      if (i && j) {
        const a = (i - 1) * trailOffsets.length + j - 1, b = i * trailOffsets.length + j - 1;
        if (!(z < bridgeNear && z > bridgeFar)) trailIndices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }
  const trailGeometry = new THREE.BufferGeometry();
  trailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(trailVertices, 3));
  trailGeometry.setAttribute('color', new THREE.Float32BufferAttribute(trailColors, 3));
  trailGeometry.setIndex(trailIndices);
  trailGeometry.computeVertexNormals();
  const trailMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, side: THREE.DoubleSide });
  const trail = new THREE.Mesh(trailGeometry, trailMaterial);
  trail.receiveShadow = true;
  scene.add(trail);
  for (const side of [1]) {
    const vertices = [], colors = [], indices = [];
    for (let i = 0; i <= 160; i++) {
      const z = 3 - i * 29 / 160, t = i / 160;
      const x = sidePathX(z, side);
      const width = Math.max(.005, .82 * Math.pow(Math.sin(Math.PI * t), .58));
      for (let j = 0; j < 5; j++) {
        const offset = (j - 2) / 2, px = x + offset * width;
        const edge = Math.abs(offset);
        const y = groundHeight(px, z) + (1 - edge) * .026 + .009;
        const color = new THREE.Color('#f0f8fc').lerp(trailEdge, edge * .82);
        vertices.push(px, y, z);
        colors.push(color.r, color.g, color.b);
        if (i && j) {
          const a = (i - 1) * 5 + j - 1, b = i * 5 + j - 1;
          indices.push(a, a + 1, b, a + 1, b + 1, b);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    scene.add(new THREE.Mesh(geometry, trailMaterial));
  }
  const routeStoneGeometry = new THREE.SphereGeometry(1, 14, 10);
  const routeStoneMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, metalness: 0 });
  const routeStones = new THREE.InstancedMesh(routeStoneGeometry, routeStoneMaterial, 25);
  const routeDummy = new THREE.Object3D();
  const routeColors = ['#bfd5e2', '#cbdfe9', '#b4cfde'].map(value => new THREE.Color(value));
  for (let i = 0; i < routeStones.count; i++) {
    const z = 1 - i * 1.03;
    const x = sidePathX(z, 1) + .11 * Math.sin(i * 2.2);
    const size = .22 + .09 * Math.sin(Math.PI * i / routeStones.count);
    routeDummy.position.set(x, groundHeight(x, z) + .025, z);
    routeDummy.rotation.set(0, .25 * Math.sin(i), 0);
    routeDummy.scale.set(size * 1.15, .07, size * 1.5);
    routeDummy.updateMatrix();
    routeStones.setMatrixAt(i, routeDummy.matrix);
    routeStones.setColorAt(i, routeColors[i % routeColors.length]);
  }
  routeStones.instanceMatrix.needsUpdate = true;
  routeStones.instanceColor.needsUpdate = true;
  scene.add(routeStones);

  // The river sits below the banks; soft moving lines suggest a slow current.
  const streamVertices = [], streamIndices = [], streamUvs = [], streamColors = [];
  const waterDeep = new THREE.Color('#6a9dc2');
  const waterEdge = new THREE.Color('#afd0e4');
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
    rippleContext.strokeStyle = `rgba(237, 249, 255, ${.24 + random() * .32})`;
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
  const currentMaterial = new THREE.MeshBasicMaterial({ color: '#e1f2fc', transparent: true, opacity: .53, depthWrite: false });
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
  const riverStoneMaterial = new THREE.MeshStandardMaterial({ color: '#adc7d8', roughness: 1, metalness: 0 });
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
  scene.add(new THREE.Mesh(bridgeGeometry, new THREE.MeshStandardMaterial({ color: '#bdcfde', roughness: 1, metalness: 0, side: THREE.DoubleSide })));
  const abutmentMaterial = new THREE.MeshStandardMaterial({ color: '#a9c0d0', roughness: 1, metalness: 0 });
  for (const z of [bridgeNear, bridgeFar]) {
    for (const side of [-1, 1]) {
      const x = pathX(z) + side * (pathWidth(z) + .2);
      const stone = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), abutmentMaterial);
      stone.scale.set(.29, .18, .44);
      stone.position.set(x, groundHeight(x, z) + .065, z);
      scene.add(stone);
    }
  }
  const railMaterial = new THREE.MeshStandardMaterial({ color: '#829fb2', roughness: 1, metalness: 0 });
  const seamMaterial = new THREE.MeshStandardMaterial({ color: '#a8bdcc', roughness: 1, metalness: 0 });
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
  const blobGeometry = new THREE.SphereGeometry(1, 18, 14);
  const blobPosition = blobGeometry.attributes.position;
  for (let i = 0; i < blobPosition.count; i++) {
    const x = blobPosition.getX(i), y = blobPosition.getY(i), z = blobPosition.getZ(i);
    const shape = 1 + .052 * Math.sin(x * 5.1 + z * 3.7) + .035 * Math.cos(y * 7.3 - x * 2.2);
    blobPosition.setXYZ(i, x * shape, y * shape, z * shape);
  }
  blobGeometry.computeVertexNormals();
  const canopyMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, metalness: 0 });
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#6c90a8', roughness: 1, metalness: 0 });
  const branchMaterial = new THREE.MeshStandardMaterial({ color: '#7497ad', roughness: 1, metalness: 0 });
  const rockMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, metalness: 0 });
  const canopyColors = ['#4f83a7', '#6494b5', '#7facbe', '#aacbdd', '#5d8eaf'].map(value => new THREE.Color(value));
  const shrubColors = ['#79a8c2', '#91b8ce', '#a7c9da'].map(value => new THREE.Color(value));
  const rockColors = ['#a9c2d2', '#bcd1df', '#93b2c7'].map(value => new THREE.Color(value));
  const trees = [];
  for (let i = 0; i < (innerWidth < 700 ? 180 : 275); i++) {
    const z = 19 - random() * 137;
    if (Math.abs(z + 43) < 4) continue;
    if (z < -76 && random() < .38) continue; // the final stretch opens into a clearing
    const side = i % 2 ? 1 : -1;
    const distance = 3.15 + Math.pow(random(), 1.45) * 21;
    const x = pathX(z) + side * distance;
    if (crossesSidePath(x, z, .75)) continue;
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

  // Three grounded pairs of trees lean into the trail, giving the walk a changing canopy.
  for (const [index, z] of [-18, -66, -103].entries()) {
    for (const side of [-1, 1]) {
      const baseX = pathX(z) + side * (3.25 + index * .15);
      const baseY = groundHeight(baseX, z);
      const tipX = pathX(z) + side * (1.25 + index * .08);
      const tipY = trailHeight(z) + 4.7 + index * .16;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(baseX, baseY, z),
        new THREE.Vector3(baseX - side * .12, baseY + 1.8, z - .12),
        new THREE.Vector3(tipX + side * .55, tipY - .55, z - .5),
        new THREE.Vector3(tipX, tipY, z - .75)
      ]);
      const trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, .16, 8, false), trunkMaterial);
      trunk.castShadow = true;
      scene.add(trunk);
      for (let lobe = 0; lobe < 3; lobe++) {
        const crown = new THREE.Mesh(blobGeometry, new THREE.MeshStandardMaterial({ color: canopyColors[(index * 2 + lobe + (side > 0 ? 1 : 0)) % canopyColors.length], roughness: 1 }));
        crown.position.set(tipX + side * (lobe - 1) * .46, tipY + (lobe === 0 ? .48 : .07), z - .75 + (lobe - 1) * .34);
        crown.scale.set(lobe === 0 ? 1.18 : .88, lobe === 0 ? .92 : .7, lobe === 0 ? 1.07 : .87);
        crown.castShadow = true;
        scene.add(crown);
      }
    }
  }

  // Hang the sign directly beneath the second arch, with both ropes rooted in its canopy.
  const signZ = -66.75;
  const signPivot = new THREE.Group();
  signPivot.position.set(pathX(-66), trailHeight(-66) + 4.75, signZ);
  signPivot.visible = false;
  scene.add(signPivot);
  const signMotion = { length: 0, swing: .035 };
  let signInView = false;
  const ropeMaterial = new THREE.MeshStandardMaterial({ color: '#8faab8', roughness: 1, metalness: 0 });
  const plankMaterial = new THREE.MeshStandardMaterial({ color: '#92b5c9', roughness: 1, metalness: 0 });
  const signEdgeMaterial = new THREE.MeshStandardMaterial({ color: '#5d829b', roughness: 1, metalness: 0 });
  const signRopes = [-.57, .57].map(x => {
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(.023, .023, 1, 6), ropeMaterial);
    rope.position.x = x;
    rope.position.z = .08;
    signPivot.add(rope);
    const anchor = new THREE.Mesh(new THREE.IcosahedronGeometry(.065, 0), signEdgeMaterial);
    anchor.position.set(x, 0, .08);
    signPivot.add(anchor);
    return rope;
  });
  const signBoard = new THREE.Group();
  signPivot.add(signBoard);
  const signPlank = new THREE.Mesh(new THREE.BoxGeometry(2.36, .76, .1), plankMaterial);
  signPlank.castShadow = true;
  signBoard.add(signPlank);
  for (const x of [-.57, .57]) {
    const peg = new THREE.Mesh(new THREE.IcosahedronGeometry(.045, 0), signEdgeMaterial);
    peg.position.set(x, .32, .064);
    signBoard.add(peg);
  }
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024;
  signCanvas.height = 256;
  const signContext = signCanvas.getContext('2d');
  const signTexture = new THREE.CanvasTexture(signCanvas);
  signTexture.colorSpace = THREE.SRGBColorSpace;
  function paintSign() {
    signContext.clearRect(0, 0, 1024, 256);
    signContext.fillStyle = '#173f59';
    signContext.textAlign = 'center';
    signContext.textBaseline = 'middle';
    signContext.font = '150px "Instrument Serif", Georgia, serif';
    signContext.fillText('Read me', 512, 126);
    signTexture.needsUpdate = true;
  }
  paintSign();
  document.fonts?.ready.then(paintSign);
  const signLettering = new THREE.Mesh(new THREE.PlaneGeometry(2.12, .52), new THREE.MeshBasicMaterial({ map: signTexture, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  signLettering.position.set(0, 0, .057);
  signBoard.add(signLettering);
  const signScreenCenter = new THREE.Vector3();
  const signScreenLeft = new THREE.Vector3();
  const signScreenRight = new THREE.Vector3();
  updateArchSign = () => {
    const rect = panels[2].getBoundingClientRect();
    const inView = rect.top < innerHeight * .65 && rect.bottom > innerHeight * .2;
    if (inView && !signInView) {
      signInView = true;
      signPivot.visible = true;
      if (animate) {
        gsap.getTweensOf(signMotion).forEach(tween => tween.kill());
        gsap.fromTo(signMotion, { length: 0, swing: .035 }, { length: 1.32, swing: -.025, duration: 1.15, ease: 'power3.out' });
        gsap.to(signMotion, { swing: 0, duration: .65, delay: 1.12, ease: 'sine.out' });
      } else { signMotion.length = 1.32; signMotion.swing = 0; }
    } else if (!inView && signInView) {
      signInView = false;
      if (animate) gsap.getTweensOf(signMotion).forEach(tween => tween.kill());
      signMotion.length = 0;
      signMotion.swing = .035;
      signPivot.visible = false;
    }
    if (!inView) { trailScroll.classList.remove('is-visible'); trailScroll.inert = true; return; }
    const length = Math.max(.001, signMotion.length);
    signPivot.rotation.z = signMotion.swing;
    signRopes.forEach(rope => { rope.position.y = -length * .5; rope.scale.y = length; });
    signBoard.position.y = -length - .37;
    signPivot.updateMatrixWorld(true);
    signScreenCenter.set(0, 0, .08); signBoard.localToWorld(signScreenCenter); signScreenCenter.project(camera);
    signScreenLeft.set(-1.2, -.4, .08); signBoard.localToWorld(signScreenLeft); signScreenLeft.project(camera);
    signScreenRight.set(1.2, .4, .08); signBoard.localToWorld(signScreenRight); signScreenRight.project(camera);
    const visible = length > 1.15 && signScreenCenter.z > -1 && signScreenCenter.z < 1 && Math.abs(signScreenCenter.x) < 1.2 && trailNote.hidden && treasure.hidden;
    trailScroll.classList.toggle('is-visible', visible);
    trailScroll.inert = !visible;
    if (visible) {
      trailScroll.style.left = `${(signScreenCenter.x * .5 + .5) * stage.clientWidth}px`;
      trailScroll.style.top = `${(-signScreenCenter.y * .5 + .5) * stage.clientHeight}px`;
      trailScroll.style.width = `${Math.max(85, Math.abs(signScreenRight.x - signScreenLeft.x) * stage.clientWidth * .5 + 20)}px`;
      trailScroll.style.height = `${Math.max(45, Math.abs(signScreenRight.y - signScreenLeft.y) * stage.clientHeight * .5 + 18)}px`;
    }
  };

  // Young trees along the trail make the walk feel planted at several scales.
  const youngCount = innerWidth < 700 ? 42 : 68;
  const youngTrunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.055, .09, 1, 10), trunkMaterial, youngCount);
  const youngCrowns = new THREE.InstancedMesh(blobGeometry, canopyMaterial, youngCount * 2);
  for (let i = 0; i < youngCount; i++) {
    let z = 17 - random() * 132;
    if (Math.abs(z + 43) < 4) z -= 8;
    const side = i % 2 ? 1 : -1;
    let x = pathX(z) + side * (2.45 + random() * 5.3);
    if (crossesSidePath(x, z, .45)) x += side * 2.4;
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

  // A sapling takes root beyond the hanging sign. Its growth follows the final
  // stretch of the walk, so the third scene has a grounded destination.
  const growthZ = -79;
  const growthX = pathX(growthZ) + 1.25;
  const growthY = groundHeight(growthX, growthZ);
  const growthTree = new THREE.Group();
  growthTree.position.set(growthX, growthY, growthZ);
  scene.add(growthTree);
  const growthWood = new THREE.MeshStandardMaterial({ color: '#6d91a7', roughness: 1, metalness: 0 });
  const growthLeaves = ['#a9d5e4', '#d2e9ee', '#80b9d3', '#c1e0e9'].map(color => new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0 }));
  const growthStem = new THREE.Group();
  growthTree.add(growthStem);
  const mainStem = new THREE.Mesh(new THREE.CylinderGeometry(.12, .19, 3.45, 7), growthWood);
  mainStem.position.y = 1.725;
  growthStem.add(mainStem);
  const growthBranches = [
    { side: -1, y: 2.22, length: 1.05, angle: .77 },
    { side: 1, y: 2.55, length: 1.15, angle: -.73 },
    { side: -1, y: 2.92, length: .78, angle: .66 }
  ];
  for (const branch of growthBranches) {
    const limb = new THREE.Mesh(new THREE.CylinderGeometry(.055, .09, branch.length, 6), growthWood);
    limb.position.set(-branch.side * Math.sin(branch.angle) * branch.length * .43, branch.y, 0);
    limb.rotation.z = branch.angle;
    growthStem.add(limb);
  }
  const growthCrowns = [
    { x: 0, y: 3.62, z: 0, size: 1.08, phase: .28 },
    { x: -.82, y: 2.88, z: .12, size: .77, phase: .42 },
    { x: .9, y: 3.12, z: -.12, size: .84, phase: .5 },
    { x: .25, y: 4.12, z: -.22, size: .72, phase: .61 }
  ].map((leaf, index) => {
    const crown = new THREE.Mesh(blobGeometry, growthLeaves[index]);
    crown.position.set(leaf.x, leaf.y, leaf.z);
    growthStem.add(crown);
    return { crown, ...leaf };
  });
  const growthBaseMaterial = new THREE.MeshStandardMaterial({ color: '#a6c8d8', roughness: 1, metalness: 0 });
  for (let i = 0; i < 7; i++) {
    const angle = i * Math.PI * 2 / 7;
    const stone = new THREE.Mesh(new THREE.IcosahedronGeometry(.16 + (i % 3) * .025, 0), growthBaseMaterial);
    stone.position.set(Math.cos(angle) * .42, .08, Math.sin(angle) * .39);
    stone.scale.y = .5;
    growthTree.add(stone);
  }
  function updateGrowthTree(progress) {
    const start = Math.max(stops[2] + .04, stops[3] - .31);
    const end = Math.min(1, stops[3] - .12);
    const t = clamp((progress - start) / Math.max(.01, end - start), 0, 1);
    const grown = t * t * (3 - 2 * t);
    growthStem.scale.y = Math.max(.025, grown);
    growthCrowns.forEach(({ crown, size, phase }, index) => {
      const unfurl = clamp((t - phase) / .38, 0, 1);
      const open = unfurl * unfurl * (3 - 2 * unfurl);
      crown.scale.setScalar(Math.max(.001, size * open));
      crown.rotation.y = open * (.14 + index * .08);
    });
  }

  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 64;
  const shadowContext = shadowCanvas.getContext('2d');
  const shadowFade = shadowContext.createRadialGradient(32, 32, 3, 32, 32, 32);
  shadowFade.addColorStop(0, 'rgba(50, 78, 104, .25)');
  shadowFade.addColorStop(1, 'rgba(50, 78, 104, 0)');
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
  const bladeVertices = [], bladeIndices = [];
  for (let blade = 0; blade < 5; blade++) {
    const angle = blade * Math.PI * 2 / 5 + .18 * Math.sin(blade * 3);
    const outwardX = Math.cos(angle), outwardZ = Math.sin(angle);
    const acrossX = -outwardZ, acrossZ = outwardX;
    const height = .24 + (blade % 3) * .055;
    const bend = .055 + (blade % 2) * .035;
    const width = .015 + (blade % 2) * .004;
    const base = bladeVertices.length / 3;
    for (let segment = 0; segment <= 5; segment++) {
      const t = segment / 5;
      const centerX = outwardX * (.025 + bend * t * t);
      const centerZ = outwardZ * (.025 + bend * t * t);
      const halfWidth = width * (1 - .83 * t);
      const y = height * t - .012 * t * t;
      bladeVertices.push(centerX - acrossX * halfWidth, y, centerZ - acrossZ * halfWidth);
      bladeVertices.push(centerX + acrossX * halfWidth, y, centerZ + acrossZ * halfWidth);
      if (segment) {
        const a = base + (segment - 1) * 2, b = base + segment * 2;
        bladeIndices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }
  const grassGeometry = new THREE.BufferGeometry();
  grassGeometry.setAttribute('position', new THREE.Float32BufferAttribute(bladeVertices, 3));
  grassGeometry.setIndex(bladeIndices);
  grassGeometry.computeVertexNormals();
  const shrubs = new THREE.InstancedMesh(blobGeometry, canopyMaterial, innerWidth < 700 ? 200 : 330);
  const grass = new THREE.InstancedMesh(grassGeometry, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, metalness: 0, side: THREE.DoubleSide }), innerWidth < 700 ? 1400 : 2400);
  const grassColors = ['#789aae', '#8cabbc', '#9fbac8', '#b1c9d4'].map(value => new THREE.Color(value));
  const rocks = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), rockMaterial, innerWidth < 700 ? 110 : 180);
  for (let i = 0; i < shrubs.count; i++) {
    let z = 20 - random() * 138;
    if (Math.abs(z + 43) < 4) z -= 8;
    const side = random() < .5 ? -1 : 1;
    let x = pathX(z) + side * (2.1 + random() * 15);
    if (crossesSidePath(x, z)) x += side * 2.1;
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
    let x = pathX(z) + side * (1.7 + Math.pow(random(), 1.5) * 16);
    if (crossesSidePath(x, z)) x += side * 1.7;
    dummy.position.set(x, groundHeight(x, z) - .018, z);
    dummy.quaternion.identity();
    dummy.rotation.set(0, random() * Math.PI * 2, (random() - .5) * .1);
    dummy.scale.setScalar(.7 + random() * .85);
    dummy.updateMatrix();
    grass.setMatrixAt(i, dummy.matrix);
    grass.setColorAt(i, grassColors[Math.floor(random() * grassColors.length)]);
  }
  for (let i = 0; i < rocks.count; i++) {
    let z = 20 - random() * 138;
    if (Math.abs(z + 43) < 4) z -= 8;
    const side = random() < .5 ? -1 : 1;
    let x = pathX(z) + side * (1.65 + random() * 9);
    if (crossesSidePath(x, z)) x += side * 2;
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
  grass.instanceColor.needsUpdate = true;
  rocks.instanceMatrix.needsUpdate = true;
  rocks.instanceColor.needsUpdate = true;
  scene.add(shrubs, grass, rocks);

  const trailStones = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), rockMaterial, innerWidth < 700 ? 220 : 360);
  const trailStoneColors = ['#c9dbe7', '#d8e6ef', '#bed4e1'].map(value => new THREE.Color(value));
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
  const fernColors = ['#94b2c5', '#a8c4d3', '#bad1dc'].map(value => new THREE.Color(value));
  for (let i = 0; i < ferns.count; i++) {
    let z = 17 - random() * 134;
    if (Math.abs(z + 43) < 4) z -= 8;
    const side = random() < .5 ? -1 : 1;
    let x = pathX(z) + side * (2.2 + random() * 6.5);
    if (crossesSidePath(x, z)) x += side * 2;
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
    let x = pathX(z) + side * (3.1 + random() * 11);
    if (crossesSidePath(x, z, 1)) x += side * 2.7;
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

  // The first stop's find: a treasure chest that rises out of the trail ahead, glowing gold.
  let chestStopZ = 12 - stops[CHEST_STOP] * 92;
  let chestZ = chestStopZ - 4.4;
  let chestX = pathX(chestZ) + .15;
  let chestY = trailHeight(chestZ) + .02;
  const chest = new THREE.Group();
  chest.position.set(chestX, chestY, chestZ);
  chest.rotation.y = Math.atan2(pathX(chestStopZ) - chestX, chestStopZ - chestZ);
  chest.scale.setScalar(.0001);
  scene.add(chest);
  const chestBody = new THREE.Group();
  chest.add(chestBody);
  const woodMaterial = new THREE.MeshStandardMaterial({ color: '#2e5b80', roughness: .72, metalness: .05 });
  const woodDarkMaterial = new THREE.MeshStandardMaterial({ color: '#21476a', roughness: .8, metalness: .05 });
  const goldMaterial = new THREE.MeshStandardMaterial({ color: '#d7ae73', emissive: '#a57539', emissiveIntensity: .12, roughness: .78, metalness: .08 });
  const treasureMaterial = new THREE.MeshStandardMaterial({ color: '#e6cda6', roughness: .88 });
  const W = .92, D = .6, H = .46;
  const box = (w, h, d, material, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    return mesh;
  };
  chestBody.add(box(W, H, D, woodMaterial, 0, H / 2, 0));
  chestBody.add(box(W + .03, .06, D + .03, woodDarkMaterial, 0, .03, 0));
  for (const x of [-W / 2 + .1, W / 2 - .1]) chestBody.add(box(.07, H + .01, D + .025, goldMaterial, x, H / 2, 0));
  chestBody.add(box(W + .02, .05, D + .02, goldMaterial, 0, H - .03, 0));
  chestBody.add(box(.14, .17, .05, goldMaterial, 0, H - .09, D / 2 + .02));
  chestBody.add(box(W - .08, .02, D - .08, treasureMaterial, 0, H - .015, 0));
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, H, -D / 2);
  chest.add(lidPivot);
  lidPivot.add(box(W + .04, .13, D + .04, woodMaterial, 0, .065, D / 2));
  lidPivot.add(box(W - .12, .012, D - .13, woodDarkMaterial, 0, .137, D / 2));
  for (const x of [-W / 2 + .1, W / 2 - .1]) {
    lidPivot.add(box(.07, .145, D + .055, goldMaterial, x, .073, D / 2));
  }
  const lidClasp = box(.12, .15, .045, goldMaterial, 0, .015, D + .035);
  lidPivot.add(lidClasp);

  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 128;
  const glowContext = glowCanvas.getContext('2d');
  const glowGradient = glowContext.createRadialGradient(64, 64, 3, 64, 64, 62);
  glowGradient.addColorStop(0, 'rgba(255, 234, 199, .48)');
  glowGradient.addColorStop(.3, 'rgba(241, 208, 162, .17)');
  glowGradient.addColorStop(.72, 'rgba(241, 208, 162, .035)');
  glowGradient.addColorStop(1, 'rgba(241, 208, 162, 0)');
  glowContext.fillStyle = glowGradient;
  glowContext.fillRect(0, 0, 128, 128);
  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  glowTexture.colorSpace = THREE.SRGBColorSpace;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, toneMapped: false }));
  glow.position.set(0, .95, 0);
  chest.add(glow);
  const chestLight = new THREE.PointLight('#e4c49b', 0, 7, 2);
  chestLight.position.set(0, .9, .2);
  chest.add(chestLight);
  const chestHitArea = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.32, 1.18), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  chestHitArea.position.set(0, .57, 0);
  chest.add(chestHitArea);

  const chestHint = document.querySelector('.chest-hint');
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const hitChest = event => {
    if (activeStop !== CHEST_STOP || chestState.reveal < .6 || chestState.opened) return false;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObject(chestHitArea).length > 0;
  };
  let hovering = false;
  renderer.domElement.addEventListener('pointermove', event => {
    hovering = hitChest(event);
    renderer.domElement.style.cursor = hovering ? 'pointer' : '';
  });
  renderer.domElement.addEventListener('pointerleave', () => { hovering = false; renderer.domElement.style.cursor = ''; });
  const openChest = event => {
    if (chestState.opened) return;
    const hintBounds = chestHint?.getBoundingClientRect();
    const origin = event?.clientX && event?.clientY
      ? { x: event.clientX, y: event.clientY }
      : { x: hintBounds ? hintBounds.left + hintBounds.width / 2 : innerWidth * .75, y: hintBounds ? hintBounds.top + hintBounds.height / 2 : innerHeight * .5 };
    chestState.opened = true;
    hovering = false;
    renderer.domElement.style.cursor = '';
    if (animate) {
      gsap.to(chestState, { lid: 1, duration: .65, ease: 'power2.inOut' });
      gsap.fromTo(chestState, { burst: 1.4 }, { burst: 0, duration: 1.4, ease: 'power2.out' });
      gsap.delayedCall(.62, () => openTreasure(origin));
    } else {
      chestState.lid = 1;
      openTreasure(origin);
    }
  };
  renderer.domElement.addEventListener('click', event => { if (hitChest(event)) openChest(event); });
  chestHint?.addEventListener('click', openChest);
  document.addEventListener('treasure:closed', () => {
    chestState.opened = false;
    if (animate) gsap.to(chestState, { lid: 0, duration: .65, ease: 'power2.inOut' });
    else chestState.lid = 0;
  });
  const projected = new THREE.Vector3();
  function updateChest(time) {
    const reveal = chestState.reveal;
    chestState.hover += ((hovering ? 1 : 0) - chestState.hover) * .12;
    chest.visible = reveal > .001;
    if (!chest.visible) { if (chestHint) chestHint.hidden = true; return; }
    const pulse = .5 + .5 * Math.sin(time * 2.4);
    chest.scale.setScalar(Math.max(.0001, reveal) * (1 + chestState.hover * .05));
    chest.position.y = chestY - (1 - Math.min(reveal, 1)) * .5;
    lidPivot.rotation.x = -chestState.lid * 1.55;
    const glowStrength = Math.min(reveal, 1) * (.42 + pulse * .12 + chestState.hover * .17 + chestState.burst * .25 + chestState.lid * .2);
    glow.scale.setScalar(1.35 + chestState.hover * .12 + chestState.burst * .22 + chestState.lid * .12);
    glow.material.opacity = clamp(glowStrength, 0, .58);
    chestLight.intensity = glowStrength * .9;
    goldMaterial.emissiveIntensity = .12 + chestState.hover * .06 + chestState.burst * .1;
    if (chestHint) {
      projected.set(chestX, chestY + 1.05, chestZ).project(camera);
      const show = activeStop === CHEST_STOP && reveal > .8 && !chestState.opened && projected.z < 1 && Math.abs(projected.x) < 1.1;
      chestHint.hidden = !show;
      if (show) {
        chestHint.style.left = `${(projected.x * .5 + .5) * stage.clientWidth}px`;
        chestHint.style.top = `${(-projected.y * .5 + .5) * stage.clientHeight}px`;
      }
    }
  }
  const lookTarget = new THREE.Vector3();
  const chestFocus = new THREE.Vector3(chestX, chestY + .3, chestZ);

  function placeChest() {
    chestStopZ = 12 - stops[CHEST_STOP] * 92;
    chestZ = chestStopZ - 4.4;
    chestX = pathX(chestZ) + .15;
    chestY = trailHeight(chestZ) + .02;
    chest.position.set(chestX, chestY, chestZ);
    chest.rotation.y = Math.atan2(pathX(chestStopZ) - chestX, chestStopZ - chestZ);
    chestFocus.set(chestX, chestY + .3, chestZ);
  }
  document.fonts?.ready.then(() => { measureStops(); placeChest(); });

  function resize() {
    placeChest();
    signPivot.scale.setScalar(innerWidth < 850 ? 1.45 : 1);
    const width = Math.max(1, stage.clientWidth), height = Math.max(1, stage.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  addEventListener('resize', resize);
  resize();

  let firstFrame = true;
  let previousProgress = 0;
  let walkingEnergy = 0;
  let rendering = false;
  const sceneIsVisible = () => {
    const rect = story.getBoundingClientRect();
    return document.visibilityState === 'visible' && rect.bottom > 0 && rect.top < innerHeight;
  };
  function queueRender() {
    if (!rendering && sceneIsVisible()) {
      rendering = true;
      requestAnimationFrame(render);
    }
  }
  function render() {
    if (!sceneIsVisible()) { rendering = false; return; }
    const progress = reducedMotion ? 0 : clamp(motion.progress, 0, 1);
    const fogPosition = progress * (fogStops.length - 1);
    const fogIndex = Math.min(fogStops.length - 2, Math.floor(fogPosition));
    currentFog.copy(fogStops[fogIndex]).lerp(fogStops[fogIndex + 1], fogPosition - fogIndex);
    scene.background.copy(currentFog);
    scene.fog.color.copy(currentFog);
    const step = Math.abs(progress - previousProgress);
    walkingEnergy += (clamp(step * 90, 0, 1) - walkingEnergy) * .14;
    previousProgress = progress;
    const z = 12 - progress * 92;
    const x = pathX(z);
    const stride = reducedMotion ? 0 : Math.sin(progress * 400) * walkingEnergy;
    camera.position.set(x + stride * .012, 1.77 + walkHeight(z) + stride * .018, z);
    const nearChest = 1 - clamp(Math.abs(progress - stops[CHEST_STOP]) / .09, 0, 1);
    const focus = nearChest * nearChest * (3 - 2 * nearChest) * .72;
    lookTarget.set(pathX(z - 10), 1.66 + walkHeight(z - 10), z - 10).lerp(chestFocus, focus);
    camera.lookAt(lookTarget);
    updateChest(performance.now() * .001);
    updateArchSign();
    updateGrowthTree(progress);
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
    if (reducedMotion) { rendering = false; return; }
    requestAnimationFrame(render);
  }
  if (!reducedMotion) addEventListener('scroll', queueRender, { passive: true });
  addEventListener('visibilitychange', queueRender);
  addEventListener('resize', queueRender);
  new IntersectionObserver(queueRender).observe(story);
  queueRender();
} catch (error) {
  document.body.classList.add('webgl-unavailable');
  console.warn('Forest scene unavailable:', error);
}

const treasure = document.getElementById('treasure');
let treasureReturnFocus = null;
let treasureClosing = false;
let treasureOrigin = null;
function openTreasure(origin) {
  if (!treasure || !treasure.hidden) return;
  const x = origin?.x ?? (innerWidth * .75);
  const y = origin?.y ?? (innerHeight * .5);
  const radius = Math.ceil(Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))) + 2;
  treasureOrigin = `circle(0px at ${x}px ${y}px)`;
  treasureReturnFocus = document.activeElement === document.body ? document.querySelector('.chest-hint') : document.activeElement;
  treasure.hidden = false;
  treasure.scrollTop = 0;
  document.body.classList.add('treasure-open');
  const items = treasure.querySelectorAll('[data-reveal]');
  if (animate) {
    gsap.killTweensOf(treasure);
    gsap.fromTo(treasure, { clipPath: treasureOrigin }, { clipPath: `circle(${radius}px at ${x}px ${y}px)`, duration: .85, ease: 'power3.inOut' });
    gsap.fromTo(items, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .55, stagger: .06, ease: 'power2.out', delay: .34 });
  } else {
    treasure.style.clipPath = '';
  }
  treasure.querySelector('.treasure-close').focus({ preventScroll: true });
}
function closeTreasure(next) {
  if (!treasure || treasure.hidden || treasureClosing) return;
  treasureClosing = true;
  const finish = () => {
    treasure.hidden = true;
    treasure.style.clipPath = '';
    document.body.classList.remove('treasure-open');
    document.dispatchEvent(new CustomEvent('treasure:closed'));
    treasureClosing = false;
    if (next) {
      const top = story.offsetTop + panels[CHEST_STOP + 1].offsetTop;
      if (siteLenis) siteLenis.scrollTo(top, { duration: 1.6 });
      else scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
    } else treasureReturnFocus?.focus?.({ preventScroll: true });
  };
  if (animate) {
    gsap.killTweensOf(treasure);
    gsap.to(treasure, { clipPath: treasureOrigin, duration: .68, ease: 'power3.inOut', onComplete: finish });
  } else finish();
}
treasure?.querySelector('.treasure-close').addEventListener('click', () => closeTreasure(false));
treasure?.querySelector('.treasure-next').addEventListener('click', () => closeTreasure(true));
document.querySelector('.chest-fallback-action')?.addEventListener('click', openTreasure);
document.addEventListener('keydown', event => {
  if (!treasure || treasure.hidden) return;
  if (event.key === 'Escape') { event.preventDefault(); closeTreasure(false); }
  if (event.key === 'Tab') {
    const focusable = [...treasure.querySelectorAll('button, a[href]')];
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});

const trailNote = document.getElementById('trail-note');
const trailNoteSheet = trailNote?.querySelector('.trail-note-sheet');
let trailNoteClosing = false;
let trailNoteReturnFocus = trailScroll;
function updateTrailScroll() {
  updateArchSign();
}
function openTrailNote() {
  if (!trailNote.hidden) return;
  trailNoteReturnFocus = document.activeElement;
  trailNote.hidden = false;
  trailNote.scrollTop = 0;
  document.body.classList.add('trail-note-open');
  updateTrailScroll();
  if (animate) {
    gsap.killTweensOf(trailNote);
    gsap.fromTo(trailNote, { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0)', duration: .72, ease: 'power3.inOut' });
    gsap.fromTo(trailNoteSheet.children, { opacity: 0, x: 22 }, { opacity: 1, x: 0, duration: .55, stagger: .07, delay: .22, ease: 'power2.out' });
  }
  trailNote.querySelector('.trail-note-close').focus({ preventScroll: true });
}
function closeTrailNote() {
  if (trailNote.hidden || trailNoteClosing) return;
  trailNoteClosing = true;
  const finish = () => {
    trailNote.hidden = true;
    trailNote.style.clipPath = '';
    document.body.classList.remove('trail-note-open');
    trailNoteClosing = false;
    updateTrailScroll();
    trailNoteReturnFocus?.focus?.({ preventScroll: true });
  };
  if (animate) {
    gsap.killTweensOf(trailNote);
    gsap.to(trailNote, { clipPath: 'inset(0 0 0 100%)', duration: .56, ease: 'power3.inOut', onComplete: finish });
  }
  else finish();
}
trailScroll.addEventListener('click', openTrailNote);
document.querySelector('.trail-note-fallback')?.addEventListener('click', openTrailNote);
trailNote.querySelector('.trail-note-close').addEventListener('click', closeTrailNote);
addEventListener('scroll', updateTrailScroll, { passive: true });
addEventListener('resize', updateTrailScroll, { passive: true });
document.addEventListener('keydown', event => {
  if (trailNote.hidden) return;
  if (event.key === 'Escape') { event.preventDefault(); closeTrailNote(); }
  if (event.key === 'Tab') { event.preventDefault(); trailNote.querySelector('.trail-note-close').focus(); }
});
updateTrailScroll();
