/**
 * SHIN-CHAN: THE GREAT KASUKABE RUN! 🏃‍♂️💨
 * Next-Gen 3D Platform Runner with Real-World Telemetry, Kasukabe GPS Radar,
 * Moving Modular City Chunks, Comprehensive Villains & Hurdles Roster.
 */

/* ─── STATE ─── */
let scene, camera, renderer;
let clock;
let shinchanGroup, shiroGroup;
let isRunning = false;
let score = 0;
let chocobiCount = 0;
let momAnger = 0;
let isMomActive = false;
let isDadActive = false;
let isButtDashing = false;
let momCooldown = 0;
let dadCooldown = 0;
let baseSpeed = 0.42;
let currentSpeed = 0.42;
let distanceTraveled = 0;
let comboCount = 0;
let comboTimer = 0;
let currentLevel = 1;

let currentLane = 0;
const LANE_WIDTH = 3.2;
let playerY = 0;
let playerVelY = 0;
let isGrounded = true;
let isSliding = false;
let slideTimer = 0;
const GRAVITY = -0.022;
const JUMP_FORCE = 0.38;

const streetChunks = [];
const CHUNK_SIZE = 50;
const TOTAL_CHUNKS = 6;

const obstacles = [];
const cookies = [];
const particles = [];
const ambientLights = [];

let cameraMode = 'chase';
let audioCtx;

/* ─── INIT ENGINE ─── */
function initEngine() {
  const canvas = document.getElementById('three-canvas');

  scene = new THREE.Scene();
  // Japanese sunset/evening atmosphere with warm glow and atmospheric fog
  scene.background = new THREE.Color(0xf6aa76);
  scene.fog = new THREE.FogExp2(0xf6aa76, 0.008);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 260);
  camera.position.set(0, 4.8, 9.5);

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  // Real-world Natural Lighting
  const hemiLight = new THREE.HemisphereLight(0xfff1e0, 0x443355, 0.7);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xffb87a, 1.25);
  sunLight.position.set(30, 45, 25);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 140;
  sunLight.shadow.camera.left = -30;
  sunLight.shadow.camera.right = 30;
  sunLight.shadow.camera.top = 30;
  sunLight.shadow.camera.bottom = -30;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  const ambientSky = new THREE.AmbientLight(0xffd5b5, 0.35);
  scene.add(ambientSky);

  // Build Real-World Modular Kasukabe Street Chunks
  buildModularCity();

  // Create High-Fidelity Shin-chan and Shiro
  shinchanGroup = createShinchan();
  scene.add(shinchanGroup);

  shiroGroup = createShiro();
  scene.add(shiroGroup);

  // Seed Initial Obstacles & Cookies
  for (let i = 0; i < 14; i++) {
    spawnObstacle(-24 - i * 16);
    if (i % 2 === 0) spawnCookieRow(-16 - i * 14);
  }

  // Event Listeners
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('resize', onResize);

  if ('ontouchstart' in window) {
    const tc = document.getElementById('touch-controls');
    if (tc) tc.style.display = 'flex';
  }

  clock = new THREE.Clock();
  animate();
}

/* ─── REAL-WORLD MODULAR KASUKABE CITY ─── */
function buildModularCity() {
  for (let i = 0; i < TOTAL_CHUNKS; i++) {
    const chunk = createStreetChunk();
    chunk.position.z = -i * CHUNK_SIZE;
    scene.add(chunk);
    streetChunks.push(chunk);
  }
}

function createStreetChunk() {
  const chunk = new THREE.Group();

  // Asphalt Road
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x2b2e35,
    roughness: 0.88,
    metalness: 0.08
  });
  const roadGeo = new THREE.PlaneGeometry(13.5, CHUNK_SIZE);
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.receiveShadow = true;
  chunk.add(road);

  // White Center Dashed Lanes
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let z = -CHUNK_SIZE / 2; z < CHUNK_SIZE / 2; z += 6) {
    for (const lx of [-LANE_WIDTH * 0.5, LANE_WIDTH * 0.5]) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 3.2), dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(lx, 0.015, z + 1.6);
      chunk.add(dash);
    }
  }

  // Yellow Road Shoulder Edge Lines
  const yellowMat = new THREE.MeshBasicMaterial({ color: 0xf5b700 });
  for (const lx of [-6.4, 6.4]) {
    const shoulder = new THREE.Mesh(new THREE.PlaneGeometry(0.24, CHUNK_SIZE), yellowMat);
    shoulder.rotation.x = -Math.PI / 2;
    shoulder.position.set(lx, 0.015, 0);
    chunk.add(shoulder);
  }

  // Concrete Sidewalks & Curbs
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.8 });
  const walkMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.9 });

  for (const side of [-1, 1]) {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, CHUNK_SIZE), curbMat);
    curb.position.set(side * 6.7, 0.175, 0);
    curb.receiveShadow = true;
    chunk.add(curb);

    const sidewalk = new THREE.Mesh(new THREE.BoxGeometry(7, 0.3, CHUNK_SIZE), walkMat);
    sidewalk.position.set(side * 10.4, 0.15, 0);
    sidewalk.receiveShadow = true;
    chunk.add(sidewalk);
  }

  // Japanese Suburban Houses
  const houseWallColors = [0xf8fafc, 0xfef3c7, 0xe0e7ff, 0xfce7f3, 0xf1f5f9, 0xfae8ff];
  const roofColors = [0x1e293b, 0x831843, 0x14532d, 0x1e3a8a, 0x78350f];

  for (let z = -CHUNK_SIZE / 2 + 10; z < CHUNK_SIZE / 2; z += 20) {
    for (const side of [-1, 1]) {
      const houseGroup = new THREE.Group();
      const hW = 6 + Math.random() * 2;
      const hH = 4.5 + Math.random() * 2;
      const hD = 8 + Math.random() * 2;
      const wColor = houseWallColors[Math.floor(Math.random() * houseWallColors.length)];
      const rColor = roofColors[Math.floor(Math.random() * roofColors.length)];

      // Main Structure
      const wallMat = new THREE.MeshStandardMaterial({ color: wColor, roughness: 0.85 });
      const wall = new THREE.Mesh(new THREE.BoxGeometry(hW, hH, hD), wallMat);
      wall.position.y = hH / 2 + 0.3;
      wall.castShadow = true;
      wall.receiveShadow = true;
      houseGroup.add(wall);

      // Traditional Japanese Slanted Tiled Roof
      const roofMat = new THREE.MeshStandardMaterial({ color: rColor, roughness: 0.5 });
      const roof = new THREE.Mesh(new THREE.ConeGeometry(hW * 0.85, 2.2, 4), roofMat);
      roof.position.y = hH + 1.2;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      houseGroup.add(roof);

      // Windows with soft interior warm light
      const winMat = new THREE.MeshStandardMaterial({
        color: 0xffedd5,
        emissive: 0xfbbf24,
        emissiveIntensity: 0.25
      });
      for (let wy = 0; wy < 2; wy++) {
        for (let wx = -1; wx <= 1; wx += 2) {
          const win = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.1), winMat);
          win.position.set(wx * 1.5, 1.6 + wy * 2.0, (hD / 2) * (side > 0 ? -1 : 1));
          houseGroup.add(win);
        }
      }

      // Air Conditioner Unit & Japanese Balcony
      const acMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
      const ac = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.4), acMat);
      ac.position.set(hW / 2 * 0.7, 1.2, (hD / 2 + 0.2) * (side > 0 ? -1 : 1));
      houseGroup.add(ac);

      houseGroup.position.set(side * (12.5 + hW / 2), 0, z);
      chunk.add(houseGroup);
    }
  }

  // Japanese Vending Machine along sidewalk
  const vendColors = [0xd90429, 0x0077b6, 0x38b000];
  const vColor = vendColors[Math.floor(Math.random() * vendColors.length)];
  const vendGroup = new THREE.Group();
  const vendMat = new THREE.MeshStandardMaterial({ color: vColor, roughness: 0.4 });
  const vend = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.9), vendMat);
  vend.position.y = 1.25;
  vend.castShadow = true;
  vendGroup.add(vend);

  const displayMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.4
  });
  const display = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.05), displayMat);
  display.position.set(0, 1.45, 0.46);
  vendGroup.add(display);

  vendGroup.position.set(-7.6, 0, 8);
  chunk.add(vendGroup);

  // Japanese Utility / Telephone Pole with Cables
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 7.5, 8), poleMat);
  pole.position.set(7.3, 3.75, 0);
  pole.castShadow = true;
  chunk.add(pole);

  // Crossarm
  const cross = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.12), poleMat);
  cross.position.set(7.3, 6.8, 0);
  chunk.add(cross);

  // Street Trees (Sakura / Cherry Blossom / Japanese Pine)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
  const sakuraMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.7 });
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });

  for (let z = -CHUNK_SIZE / 2 + 5; z < CHUNK_SIZE / 2; z += 22) {
    const isSakura = Math.random() > 0.4;
    const treeGroup = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 3, 8), trunkMat);
    trunk.position.y = 1.5;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const foliage = new THREE.Mesh(
      new THREE.SphereGeometry(1.8, 8, 8),
      isSakura ? sakuraMat : greenMat
    );
    foliage.position.y = 3.6;
    foliage.scale.set(1.1, 0.9, 1.1);
    foliage.castShadow = true;
    treeGroup.add(foliage);

    treeGroup.position.set(Math.random() > 0.5 ? -8.2 : 8.2, 0, z);
    chunk.add(treeGroup);
  }

  // Streetlight with Warm Night Beam
  const lightGroup = new THREE.Group();
  const poleL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5.5, 8), poleMat);
  poleL.position.y = 2.75;
  lightGroup.add(poleL);

  const armL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.08), poleMat);
  armL.position.set(-0.6, 5.4, 0);
  lightGroup.add(armL);

  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), bulbMat);
  bulb.position.set(-1.1, 5.3, 0);
  lightGroup.add(bulb);

  lightGroup.position.set(7.5, 0, -14);
  chunk.add(lightGroup);

  return chunk;
}

/* ─── SHIN-CHAN 3D MODEL ─── */
function createShinchan() {
  const g = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.65 });
  const blackMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.72, 24, 24), skinMat);
  head.position.y = 1.65;
  head.scale.set(1.12, 0.96, 1.02);
  head.castShadow = true;
  g.add(head);

  // Hair
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.44),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 })
  );
  hair.position.y = 1.78;
  hair.scale.set(1.14, 0.96, 1.04);
  g.add(hair);

  // Iconic Thick Eyebrows
  const browGeo = new THREE.BoxGeometry(0.36, 0.12, 0.07);
  const lBrow = new THREE.Mesh(browGeo, blackMat);
  lBrow.position.set(-0.33, 1.88, 0.64);
  lBrow.rotation.z = 0.14;
  g.add(lBrow);
  const rBrow = new THREE.Mesh(browGeo, blackMat);
  rBrow.position.set(0.33, 1.88, 0.64);
  rBrow.rotation.z = -0.14;
  g.add(rBrow);

  // Eyes with White & Pupils
  const eyeWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyeBlack = new THREE.MeshBasicMaterial({ color: 0x000000 });
  for (const [x, mult] of [[-0.28, -1], [0.28, 1]]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.135, 12, 12), eyeWhite);
    eye.position.set(x, 1.68, 0.62);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), eyeBlack);
    pupil.position.z = 0.085;
    eye.add(pupil);
    g.add(eye);
  }

  // Mouth
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.05), blackMat);
  mouth.position.set(0, 1.45, 0.68);
  g.add(mouth);
  g.mouth = mouth;

  // Red T-Shirt
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.55 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.54, 0.88, 16), shirtMat);
  body.position.y = 0.98;
  body.castShadow = true;
  g.add(body);

  // Yellow Shorts
  const shortsMat = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.5 });
  const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.5, 0.42, 16), shortsMat);
  shorts.position.y = 0.56;
  shorts.castShadow = true;
  g.add(shorts);

  // Arms
  const armGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.52, 8);
  const lArm = new THREE.Mesh(armGeo, skinMat);
  lArm.position.set(-0.56, 1.05, 0);
  lArm.rotation.z = 0.28;
  g.add(lArm);
  g.leftArm = lArm;

  const rArm = new THREE.Mesh(armGeo, skinMat);
  rArm.position.set(0.56, 1.05, 0);
  rArm.rotation.z = -0.28;
  g.add(rArm);
  g.rightArm = rArm;

  // Legs & Yellow Shoes
  const legGeo = new THREE.CylinderGeometry(0.12, 0.11, 0.44, 8);
  const shoeGeo = new THREE.BoxGeometry(0.28, 0.15, 0.38);
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0xffbe0b, roughness: 0.4 });

  const lLeg = new THREE.Mesh(legGeo, skinMat);
  lLeg.position.set(-0.23, 0.26, 0);
  const lShoe = new THREE.Mesh(shoeGeo, shoeMat);
  lShoe.position.set(0, -0.23, 0.07);
  lLeg.add(lShoe);
  lLeg.castShadow = true;
  g.add(lLeg);
  g.leftLeg = lLeg;

  const rLeg = new THREE.Mesh(legGeo, skinMat);
  rLeg.position.set(0.23, 0.26, 0);
  const rShoe = new THREE.Mesh(shoeGeo, shoeMat);
  rShoe.position.set(0, -0.23, 0.07);
  rLeg.add(rShoe);
  rLeg.castShadow = true;
  g.add(rLeg);
  g.rightLeg = rLeg;

  // Butt-Dash Aura Dome
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0xffd166,
    wireframe: true,
    transparent: true,
    opacity: 0
  });
  const aura = new THREE.Mesh(new THREE.SphereGeometry(1.3, 16, 16), auraMat);
  aura.position.y = 1.0;
  g.add(aura);
  g.aura = aura;

  return g;
}

/* ─── SHIRO 3D MODEL ─── */
function createShiro() {
  const g = new THREE.Group();
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
  const blackMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 12), whiteMat);
  body.scale.set(1.3, 0.85, 0.9);
  body.position.y = 0.34;
  body.castShadow = true;
  g.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), whiteMat);
  head.position.set(0.34, 0.52, 0);
  head.castShadow = true;
  g.add(head);

  // Ears
  const earGeo = new THREE.ConeGeometry(0.11, 0.22, 8);
  for (const [z, rot] of [[-0.12, -0.3], [0.12, -0.3]]) {
    const ear = new THREE.Mesh(earGeo, whiteMat);
    ear.position.set(0.32, 0.8, z);
    ear.rotation.z = rot;
    g.add(ear);
  }

  // Eyes & Nose
  for (const z of [-0.1, 0.1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), blackMat);
    eye.position.set(0.58, 0.56, z);
    g.add(eye);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), blackMat);
  nose.position.set(0.64, 0.5, 0);
  g.add(nose);

  // Blue Collar
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.19, 0.038, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0x0284c7 })
  );
  collar.position.set(0.19, 0.44, 0);
  collar.rotation.y = Math.PI / 2;
  g.add(collar);

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.22, 8);
  g.legs = [];
  for (const [x, z] of [[0.2, 0.15], [0.2, -0.15], [-0.16, 0.15], [-0.16, -0.15]]) {
    const leg = new THREE.Mesh(legGeo, whiteMat);
    leg.position.set(x, 0.11, z);
    g.add(leg);
    g.legs.push(leg);
  }

  // Tail
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.28, 8), whiteMat);
  tail.position.set(-0.4, 0.44, 0);
  tail.rotation.z = Math.PI / 3;
  g.add(tail);
  g.tail = tail;

  g.position.set(1.6, 0, 0.4);
  return g;
}

/* ─── REAL-WORLD VILLAINS & HURDLES FACTORY ─── */
function createObstacleMesh(type) {
  const g = new THREE.Group();
  g.obsType = type;

  if (type === 'misae') {
    // Angry Misae (Mom) with Rolling Pin / Pan & Fiery Steam
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x854d0e });
    const dressMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
    const apronMat = new THREE.MeshStandardMaterial({ color: 0x16a34a });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 1.25, 12), dressMat);
    body.position.y = 1.15;
    body.castShadow = true;
    g.add(body);

    const apron = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.85, 0.16), apronMat);
    apron.position.set(0, 1.15, 0.3);
    g.add(apron);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 14), skinMat);
    head.position.y = 2.05;
    head.castShadow = true;
    g.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.44, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
    hair.position.y = 2.2;
    g.add(hair);

    // Glowing Red Angry Eyes
    const redEye = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    const le = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), redEye);
    le.position.set(-0.16, 2.1, 0.38);
    g.add(le);
    const re = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), redEye);
    re.position.set(0.16, 2.1, 0.38);
    g.add(re);

    // Rolling Pin Weapon
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.85, 8), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
    pin.position.set(0.55, 1.7, 0.25);
    pin.rotation.z = -0.7;
    g.add(pin);

    g.hitRadius = 1.35;
    g.damage = 30;
    g.label = 'ANGRY MISAE';
    g.category = 'villain';

  } else if (type === 'hiroshi') {
    // Hiroshi (Dad) - Rushing Salaryman in Brown Suit with Briefcase
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.48, 1.3, 12), suitMat);
    body.position.y = 1.2;
    body.castShadow = true;
    g.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 12), skinMat);
    head.position.y = 2.15;
    head.castShadow = true;
    g.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.43, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), hairMat);
    hair.position.y = 2.28;
    g.add(hair);

    // Leather Briefcase
    const caseMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.4 });
    const bcase = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.2), caseMat);
    bcase.position.set(-0.55, 0.95, 0.1);
    g.add(bcase);

    g.hitRadius = 1.25;
    g.damage = 20;
    g.label = 'DAD HIROSHI';
    g.category = 'villain';

  } else if (type === 'kazama') {
    // Toru Kazama with Prep School Books & Flashcards
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const blazerMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8 });
    const shortsMat = new THREE.MeshStandardMaterial({ color: 0x334155 });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.75, 12), blazerMat);
    body.position.y = 0.9;
    body.castShadow = true;
    g.add(body);

    const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.38, 0.4, 12), shortsMat);
    shorts.position.y = 0.52;
    g.add(shorts);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12), skinMat);
    head.position.y = 1.55;
    head.castShadow = true;
    g.add(head);

    // Stack of Textbook Hurdles
    const bookMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.15), bookMat);
    book.position.set(0.45, 1.15, 0.2);
    book.rotation.z = -0.3;
    g.add(book);

    g.hitRadius = 1.15;
    g.damage = 20;
    g.label = 'TORU KAZAMA';
    g.category = 'villain';

  } else if (type === 'director') {
    // Principal Enchou-Sensei (The Kumicho / Gangster-Faced Principal)
    const suitMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const glassMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.56, 1.45, 14), suitMat);
    body.position.y = 1.35;
    body.castShadow = true;
    g.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.46, 14, 14), skinMat);
    head.position.y = 2.35;
    head.castShadow = true;
    g.add(head);

    // Sunglasses
    const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.12), glassMat);
    glasses.position.set(0, 2.38, 0.44);
    g.add(glasses);

    g.hitRadius = 1.45;
    g.damage = 25;
    g.label = 'ENCHOU SENSEI';
    g.category = 'villain';

  } else if (type === 'dog') {
    // Stray Shiba Inu barking obstacle
    const coatMat = new THREE.MeshStandardMaterial({ color: 0xb45309 });
    const redMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.46, 12, 12), coatMat);
    body.scale.set(1.4, 0.88, 0.88);
    body.position.y = 0.52;
    body.castShadow = true;
    g.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), coatMat);
    head.position.set(0.54, 0.68, 0);
    g.add(head);

    for (const z of [0.12, -0.12]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), redMat);
      eye.position.set(0.76, 0.74, z);
      g.add(eye);
    }

    g.hitRadius = 1.05;
    g.damage = 15;
    g.label = 'FIERCE SHIBA DOG';
    g.category = 'villain';

  } else if (type === 'construction') {
    // Real-World Japanese Roadworks Barricade (工事中 Barricade)
    const barMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
    const blackTapeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });

    const rail = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.28, 0.1), barMat);
    rail.position.y = 0.85;
    rail.castShadow = true;
    g.add(rail);

    // Chevron stripes
    for (let x = -1.1; x <= 1.1; x += 0.55) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.3, 0.12), blackTapeMat);
      stripe.position.set(x, 0.85, 0);
      stripe.rotation.z = 0.45;
      g.add(stripe);
    }

    // Legs
    for (const lx of [-1.2, 1.2]) {
      const legA = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 8), barMat);
      legA.position.set(lx, 0.45, 0);
      legA.castShadow = true;
      g.add(legA);
    }

    // Flashing Hazard Beacon
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xff9900 });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), lampMat);
    lamp.position.set(0, 1.12, 0);
    g.add(lamp);
    g.lamp = lamp;

    g.hitRadius = 1.3;
    g.damage = 18;
    g.label = 'ROADWORKS BARRICADE';
    g.category = 'hurdle';
    g.jumpable = true;

  } else if (type === 'fence') {
    // Real-World Japanese Garden Wooden Fence Hurdle (Jumpable!)
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.85 });
    for (const x of [-1.2, 0, 1.2]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.2, 0.14), woodMat);
      post.position.set(x, 0.6, 0);
      post.castShadow = true;
      g.add(post);
    }
    for (const y of [0.5, 0.95]) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.14, 0.1), woodMat);
      plank.position.set(0, y, 0);
      plank.castShadow = true;
      g.add(plank);
    }

    g.hitRadius = 1.3;
    g.damage = 15;
    g.label = 'WOODEN FENCE';
    g.category = 'hurdle';
    g.jumpable = true;

  } else if (type === 'awning') {
    // Low Overhead Street Awning / Bamboo Hurdle (Slidable!)
    const bambooMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.7 });
    const signMat = new THREE.MeshStandardMaterial({ color: 0x991b1b });

    // High side posts
    for (const x of [-1.4, 1.4]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8), bambooMat);
      post.position.set(x, 1.3, 0);
      g.add(post);
    }
    // Overhead Low Beam at Shin-chan's head height!
    const beam = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.5, 0.4), signMat);
    beam.position.set(0, 1.5, 0);
    beam.castShadow = true;
    g.add(beam);

    g.hitRadius = 1.35;
    g.damage = 20;
    g.label = 'LOW AWNING BARRIER';
    g.category = 'hurdle';
    g.slidable = true;

  } else if (type === 'trash') {
    // Municipal Metal Dumpster & Recycle Cans
    const canMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.35, roughness: 0.5 });
    const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.48, 1.05, 12), canMat);
    bin.position.y = 0.52;
    bin.castShadow = true;
    g.add(bin);

    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.12, 12), canMat);
    lid.position.y = 1.1;
    g.add(lid);

    g.hitRadius = 1.0;
    g.damage = 12;
    g.label = 'RECYCLE CANISTER';
    g.category = 'hurdle';

  } else if (type === 'oil') {
    // Spilled Ramen & Oil Slick Hazard
    const oilMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });
    const slick = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.04, 16), oilMat);
    slick.position.y = 0.02;
    g.add(slick);

    g.hitRadius = 1.1;
    g.damage = 10;
    g.label = 'OIL / RAMEN SPILL';
    g.category = 'hazard';
    g.slippery = true;

  } else {
    // 15 Movie Villains Factory
    const villainNames = {
      haigure: { name: 'Leotard Devil (Haigure Mao)', color: 0xdb2777, icon: '🩱' },
      anaconda: { name: 'Mr. Anaconda (Buri Buri Kingdom)', color: 0xd97706, icon: '🐍' },
      macaoma: { name: 'Macao & Joma (Henderland)', color: 0x9333ea, icon: '🩰' },
      hexon: { name: 'Mr. Hexon (Dark Tama Tama)', color: 0x475569, icon: '🔮' },
      paradise: { name: 'Paradise King (Jungle Lord)', color: 0x15803d, icon: '👑' },
      kenchako: { name: 'Ken & Chako (Yesterday Once More)', color: 0xb45309, icon: '📼' },
      kuroiwa: { name: 'Kuroiwa Jintarou (Robo Dad)', color: 0x1e293b, icon: '🤖' },
      kaneari: { name: 'Masuzo Kaneari (Bride of Future)', color: 0xca8a04, icon: '⚡' },
      asedaku: { name: 'Ase Daku Dark (Golden Sword)', color: 0x0f172a, icon: '🗡️' },
      mappoi: { name: 'Gourmet Mappoi (B-Class Gourmet)', color: 0xe11d48, icon: '🍷' },
      naraoyosuru: { name: 'Narao & Yosuru (Golden Spy)', color: 0x334155, icon: '🕶️' },
      goronesuki: { name: 'Sunday Goronesuki', color: 0xf59e0b, icon: '👑' },
      shizime: { name: 'Mamoru Shizime (Animal Mayor)', color: 0x166534, icon: '🦁' },
      cactus: { name: 'The Giant Cactus Monster', color: 0x22c55e, icon: '🌵' },
      bochan: { name: 'Bo-chan (Possessed Mystic)', color: 0x0284c7, icon: '🗿' }
    };

    const vInfo = villainNames[type] || { name: 'Kasukabe Villain', color: 0xd90429, icon: '🦹' };
    const mat = new THREE.MeshStandardMaterial({ color: vInfo.color, roughness: 0.35, metalness: 0.6 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.8), mat);
    body.position.y = 1.0;
    body.castShadow = true;
    g.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 12), mat);
    head.position.y = 2.1;
    g.add(head);

    // Glowing Overhead 3D Billboard Tag for Movie Villains
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.roundRect ? ctx.roundRect(10, 10, 492, 108, 16) : ctx.rect(10, 10, 492, 108);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffd60a';
    ctx.stroke();
    ctx.font = 'bold 34px sans-serif';
    ctx.fillStyle = '#ffd60a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`⚔️ ${vInfo.icon} ${vInfo.name}`, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(6.0, 1.5, 1);
    sprite.position.set(0, 3.0, 0);
    g.add(sprite);

    // PointLight
    const vLight = new THREE.PointLight(vInfo.color, 1.5, 20);
    vLight.position.set(0, 2.0, 0);
    g.add(vLight);

    g.hitRadius = 1.6;
    g.damage = 25;
    g.label = vInfo.name;
    g.category = 'movie_villain';
  }

  return g;
}

function restartShinChanGame() {
  closeModal();
  score = 0;
  chocobiCount = 0;
  momAnger = 0;
  distanceTraveled = 0;
  currentLane = 0;
  shinchanGroup.position.set(0, 0, 0);
  obstacles.forEach(o => scene.remove(o));
  obstacles.length = 0;
  cookies.forEach(c => scene.remove(c));
  cookies.length = 0;
  for (let i = 0; i < 14; i++) {
    spawnObstacle(-24 - i * 16);
    if (i % 2 === 0) spawnCookieRow(-16 - i * 14);
  }
  isRunning = true;
  showDialogue('Shin-chan', '"Starting fresh run across Kasukabe! Chocobi cookies here I come!"', '👦');
}
window.restartShinChanGame = restartShinChanGame;

function spawnObstacle(zPos) {
  const lanes = [-LANE_WIDTH, 0, LANE_WIDTH];
  const laneX = lanes[Math.floor(Math.random() * lanes.length)];

  // Dynamic Probabilities: Japanese Street Obstacles + All 15 Major Movie Villains
  const types = [
    'construction', 'fence', 'awning', 'trash', 'oil',
    'misae', 'hiroshi', 'kazama', 'director', 'dog',
    // 15 Movie Villains
    'haigure', 'anaconda', 'macaoma', 'hexon', 'paradise',
    'kenchako', 'kuroiwa', 'kaneari', 'asedaku', 'mappoi',
    'naraoyosuru', 'goronesuki', 'shizime', 'cactus', 'bochan'
  ];
  const type = types[Math.floor(Math.random() * types.length)];

  const obs = createObstacleMesh(type);
  obs.position.set(laneX, 0, zPos);
  scene.add(obs);
  obstacles.push(obs);
}

function spawnCookieRow(zPos) {
  const lanes = [-LANE_WIDTH, 0, LANE_WIDTH];
  const laneX = lanes[Math.floor(Math.random() * lanes.length)];

  for (let k = 0; k < 4; k++) {
    const cGeo = new THREE.DodecahedronGeometry(0.32, 0);
    const cMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.35,
      roughness: 0.35,
      metalness: 0.15
    });
    const cookie = new THREE.Mesh(cGeo, cMat);
    cookie.position.set(laneX, 0.85, zPos - k * 2.2);
    cookie.castShadow = true;
    scene.add(cookie);
    cookies.push(cookie);
  }
}

/* ─── PARTICLES SYSTEM ─── */
function spawnParticles(pos, color = 0xffd166, count = 16) {
  for (let i = 0; i < count; i++) {
    const geo = new THREE.SphereGeometry(0.08 + Math.random() * 0.08, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
    const p = new THREE.Mesh(geo, mat);
    p.position.copy(pos);
    p.userData.vel = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      Math.random() * 0.25 + 0.08,
      (Math.random() - 0.5) * 0.3
    );
    p.userData.life = 1.0;
    p.userData.decay = 0.02 + Math.random() * 0.02;
    scene.add(p);
    particles.push(p);
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.userData.life -= p.userData.decay;
    if (p.userData.life <= 0) {
      scene.remove(p);
      particles.splice(i, 1);
      continue;
    }
    p.position.add(p.userData.vel);
    p.userData.vel.y -= 0.005;
    p.material.opacity = p.userData.life;
    p.scale.setScalar(p.userData.life);
  }
}

/* ─── SMOOTH GAME LOOP (60FPS DELTA-INDEPENDENT) ─── */
function animate() {
  requestAnimationFrame(animate);
  const rawDelta = clock.getDelta();
  const delta = Math.min(rawDelta, 0.05);

  if (isRunning) {
    // Speed adjustments
    const targetSpeed = isButtDashing ? baseSpeed * 2.2 : baseSpeed;
    currentSpeed += (targetSpeed - currentSpeed) * Math.min(1.0, 8.0 * delta);

    const frameStep = currentSpeed * delta * 60;
    distanceTraveled += frameStep;
    score += Math.floor(frameStep * 8);

    // Update Telemetry Displays
    document.getElementById('hud-score').textContent = String(score).padStart(6, '0');
    document.getElementById('hud-distance').textContent = `${(distanceTraveled / 120).toFixed(1)} KM`;

    // Speedometer Needle & KM/H Calculation
    const kmh = Math.round(currentSpeed * 75);
    const speedoNeedle = document.getElementById('speedo-needle');
    const speedoVal = document.getElementById('speedo-val');
    const speedoGear = document.getElementById('speedo-gear');
    if (speedoVal) speedoVal.textContent = kmh;
    if (speedoNeedle) {
      // Map 0 - 80 km/h to -120deg -> 120deg
      const angle = -120 + Math.min(1, kmh / 80) * 240;
      speedoNeedle.style.transform = `rotate(${angle}deg)`;
    }
    if (speedoGear) {
      speedoGear.textContent = isButtDashing ? 'NITRO 🔥' : `GEAR: D${Math.min(5, currentLevel)}`;
    }

    // Progression Levels
    const newLevel = Math.floor(distanceTraveled / 140) + 1;
    if (newLevel > currentLevel && newLevel <= 10) {
      currentLevel = newLevel;
      baseSpeed = 0.42 + currentLevel * 0.035;
      showLevelPopup(currentLevel);
      document.getElementById('hud-speed').textContent = `LVL ${currentLevel}`;
    }

    // ─── MOVE MODULAR KASUKABE STREET CHUNKS ───
    for (let i = 0; i < streetChunks.length; i++) {
      const chunk = streetChunks[i];
      chunk.position.z += frameStep;
      if (chunk.position.z > CHUNK_SIZE) {
        chunk.position.z -= TOTAL_CHUNKS * CHUNK_SIZE;
      }
    }

    // ─── PLAYER CONTROLS & SMOOTH PHYSICS ───
    const targetX = currentLane * LANE_WIDTH;
    shinchanGroup.position.x += (targetX - shinchanGroup.position.x) * Math.min(1.0, 16.0 * delta);
    // Dynamic banking lean into turns
    shinchanGroup.rotation.z = -(targetX - shinchanGroup.position.x) * 0.12;

    // Slide Timer
    if (isSliding) {
      slideTimer -= delta;
      if (slideTimer <= 0) {
        isSliding = false;
        shinchanGroup.scale.set(1, 1, 1);
      }
    }

    // Jump Physics
    if (!isGrounded) {
      playerVelY += GRAVITY * delta * 60;
      playerY += playerVelY * delta * 60;
      if (playerY <= 0) {
        playerY = 0;
        playerVelY = 0;
        isGrounded = true;
        // Landing dust particles
        spawnParticles(shinchanGroup.position.clone(), 0xd1d5db, 8);
      }
    }
    shinchanGroup.position.y = playerY;

    // Running Anim (scaled by speed)
    const runCycle = distanceTraveled * 0.45;
    if (shinchanGroup.leftLeg) shinchanGroup.leftLeg.rotation.x = Math.sin(runCycle) * 0.55;
    if (shinchanGroup.rightLeg) shinchanGroup.rightLeg.rotation.x = -Math.sin(runCycle) * 0.55;
    if (shinchanGroup.leftArm) shinchanGroup.leftArm.rotation.x = -Math.sin(runCycle) * 0.4;
    if (shinchanGroup.rightArm) shinchanGroup.rightArm.rotation.x = Math.sin(runCycle) * 0.4;

    // Bobbing
    if (isGrounded && !isSliding) {
      shinchanGroup.position.y = Math.abs(Math.sin(runCycle * 1.5)) * 0.08;
    }

    // Shiro Smooth Follow
    shiroGroup.position.x += (shinchanGroup.position.x + 1.5 - shiroGroup.position.x) * Math.min(1.0, 10.0 * delta);
    shiroGroup.position.y = shinchanGroup.position.y;
    if (shiroGroup.tail) shiroGroup.tail.rotation.y = Math.sin(runCycle * 2) * 0.6;
    if (shiroGroup.legs) {
      shiroGroup.legs.forEach((leg, idx) => {
        leg.rotation.x = Math.sin(runCycle * 1.5 + (idx % 2) * Math.PI) * 0.35;
      });
    }

    // ─── RADAR & HAZARD DETECTION ───
    let closestHazardDist = 999;
    let closestHazardText = '';
    const radarBlips = document.getElementById('radar-blips');
    if (radarBlips) radarBlips.innerHTML = '';

    // ─── OBSTACLES UPDATE ───
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.position.z += frameStep;

      // Lamp blink on construction barriers
      if (obs.lamp) {
        obs.lamp.material.color.setHex(Math.floor(Date.now() / 200) % 2 === 0 ? 0xff9900 : 0x331a00);
      }

      // Check distance for hazard flasher & radar blips
      const relZ = obs.position.z - shinchanGroup.position.z;
      if (relZ < 0 && relZ > -70) {
        const distM = Math.round(Math.abs(relZ));
        if (distM < closestHazardDist) {
          closestHazardDist = distM;
          closestHazardText = `${obs.label || 'HAZARD'} [${distM}M]`;
        }

        // Project onto Radar
        if (radarBlips) {
          const blipX = 70 + (obs.position.x / (LANE_WIDTH * 1.6)) * 40;
          const blipY = 115 + (relZ / 70) * 85;
          const isVillain = obs.category === 'villain';
          const blip = document.createElement('div');
          blip.style.position = 'absolute';
          blip.style.left = `${blipX}px`;
          blip.style.top = `${blipY}px`;
          blip.style.width = '7px';
          blip.style.height = '7px';
          blip.style.borderRadius = '50%';
          blip.style.background = isVillain ? '#ef4444' : '#facc15';
          blip.style.boxShadow = isVillain ? '0 0 6px #ef4444' : '0 0 6px #facc15';
          blip.style.transform = 'translate(-50%, -50%)';
          radarBlips.appendChild(blip);
        }
      }

      // Collision Check
      const dx = obs.position.x - shinchanGroup.position.x;
      const dz = obs.position.z - shinchanGroup.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const hitR = obs.hitRadius || 1.25;

      if (dist < hitR) {
        // Jumpable hurdle success
        if (obs.jumpable && playerY > 0.75) {
          score += 60;
          comboCount++;
          comboTimer = 2.5;
          updateCombo();
          continue;
        }

        // Slidable hurdle success
        if (obs.slidable && isSliding) {
          score += 80;
          comboCount++;
          comboTimer = 2.5;
          updateCombo();
          continue;
        }

        // Butt-Dash or Mom Active -> Smash through!
        if (isButtDashing || isMomActive) {
          spawnParticles(obs.position.clone(), 0xffd166, 22);
          scene.remove(obs);
          obstacles.splice(i, 1);
          score += 100;
          comboCount++;
          comboTimer = 2.5;
          updateCombo();
          playSound('smash');
          continue;
        }

        // Dad Active -> Sock wave knocks out villains!
        if (isDadActive && obs.category === 'villain') {
          spawnParticles(obs.position.clone(), 0x10b981, 20);
          scene.remove(obs);
          obstacles.splice(i, 1);
          score += 80;
          playSound('smash');
          continue;
        }

        // Slippery ramen spill -> spin out
        if (obs.slippery) {
          shinchanGroup.rotation.y += 1.5;
          playSound('slide');
          spawnParticles(shinchanGroup.position.clone(), 0x3b82f6, 10);
        }

        // HIT DAMAGE!
        const dmg = obs.damage || 15;
        momAnger = Math.min(100, momAnger + dmg);
        updateAngerMeter();
        spawnParticles(shinchanGroup.position.clone(), 0xef4444, 14);
        playSound('hit');
        comboCount = 0;
        updateCombo();

        // Dialogue triggers based on obstacle
        if (obs.obsType === 'misae') {
          showDialogue('Misae', '"Shinnosuke!! Where do you think you are running without finishing lunch?!"', '👩‍🦰');
        } else if (obs.obsType === 'kazama') {
          showDialogue('Kazama', '"Look at you, Nohara! You\'ll never pass the cram school exam!"', '🧒');
        } else if (obs.obsType === 'director') {
          showDialogue('Principal Enchou', '"Shinnosuke! Remember that safety comes first on school roads!"', '👔');
        }

        scene.remove(obs);
        obstacles.splice(i, 1);

        if (momAnger >= 100) {
          triggerGameOver();
          return;
        }
      } else if (obs.position.z > 20) {
        scene.remove(obs);
        obstacles.splice(i, 1);
        spawnObstacle(-140 - Math.random() * 30);
      }
    }

    // Update Hazard Flasher Indicator
    const flasher = document.getElementById('hazard-flasher');
    const flasherText = document.getElementById('hazard-text');
    if (flasher && flasherText) {
      if (closestHazardDist <= 35) {
        flasher.style.display = 'flex';
        flasherText.textContent = `⚠️ CAUTION: ${closestHazardText}!`;
      } else {
        flasher.style.display = 'none';
      }
    }

    // ─── CHOCOBI COOKIES UPDATE ───
    for (let j = cookies.length - 1; j >= 0; j--) {
      const ck = cookies[j];
      ck.position.z += frameStep;
      ck.rotation.y += 0.05;

      // Shiro Magnet Attraction
      const cdx = ck.position.x - shinchanGroup.position.x;
      const cdz = ck.position.z - shinchanGroup.position.z;
      const cdist = Math.sqrt(cdx * cdx + cdz * cdz);

      if (cdist < 6.0) {
        ck.position.lerp(shinchanGroup.position, 0.09);
      }

      if (cdist < 1.1) {
        chocobiCount++;
        document.getElementById('hud-chocobi').textContent = `x${chocobiCount}`;
        playSound('coin');
        spawnParticles(ck.position.clone(), 0x10b981, 8);
        scene.remove(ck);
        cookies.splice(j, 1);
        spawnCookieRow(-120 - Math.random() * 20);

        // Milestones
        if (chocobiCount === 20) {
          showPrizeToast('Action Kamen Tickets Unlocked!');
        } else if (chocobiCount === 50) {
          showPrizeToast('Gold Action Kamen Ultra Rare Figure!');
        } else if (chocobiCount === 80) {
          showPrizeToast('Custom Shin-chan Kindergarten Backpack!');
        }
      } else if (ck.position.z > 20) {
        scene.remove(ck);
        cookies.splice(j, 1);
        spawnCookieRow(-120 - Math.random() * 20);
      }
    }

    // Cooldowns
    if (momCooldown > 0) momCooldown -= delta;
    if (dadCooldown > 0) dadCooldown -= delta;

    const momBtn = document.getElementById('btn-mom');
    const dadBtn = document.getElementById('btn-dad');
    if (momBtn) momBtn.classList.toggle('disabled', momCooldown > 0 || isMomActive);
    if (dadBtn) dadBtn.classList.toggle('disabled', dadCooldown > 0 || isDadActive);

    // Combo Timer
    if (comboTimer > 0) {
      comboTimer -= delta;
      if (comboTimer <= 0) {
        comboCount = 0;
        updateCombo();
      }
    }

    // Butt-Dash Aura & Speed Streaks
    const streaks = document.getElementById('speed-streaks');
    if (streaks) streaks.classList.toggle('active', isButtDashing);

    if (isButtDashing && shinchanGroup.aura) {
      shinchanGroup.aura.material.opacity = 0.55 + Math.sin(Date.now() * 0.015) * 0.35;
      shinchanGroup.aura.rotation.y += 0.08;
    }
  }

  // Particles
  updateParticles();

  // Smooth Camera Tracking
  updateCamera(delta);

  renderer.render(scene, camera);
}

/* ─── CAMERA SYSTEM (SMOOTH SPRING RIG) ─── */
function updateCamera(delta) {
  let tx, ty, tz, lx, ly, lz, targetFov;

  switch (cameraMode) {
    case 'front':
      tx = shinchanGroup.position.x * 0.35;
      ty = 3.2; tz = -8;
      lx = shinchanGroup.position.x * 0.5;
      ly = 1.6; lz = 6;
      targetFov = 60;
      break;
    case 'top':
      tx = shinchanGroup.position.x * 0.5;
      ty = 15; tz = 3;
      lx = shinchanGroup.position.x * 0.5;
      ly = 0; lz = -6;
      targetFov = 65;
      break;
    case 'side':
      tx = shinchanGroup.position.x + 8.5;
      ty = 4.2; tz = 2;
      lx = shinchanGroup.position.x;
      ly = 1.2; lz = -4;
      targetFov = 60;
      break;
    default: // chase
      tx = shinchanGroup.position.x * 0.4;
      ty = 4.8 + (isButtDashing ? 0.6 : 0);
      tz = 9.2;
      lx = shinchanGroup.position.x * 0.5;
      ly = 1.6; lz = -6;
      targetFov = isButtDashing ? 70 : 60;
  }

  // Smooth exponential lerp
  const damp = Math.min(1.0, 10.0 * delta);
  camera.position.x += (tx - camera.position.x) * damp;
  camera.position.y += (ty - camera.position.y) * damp;
  camera.position.z += (tz - camera.position.z) * damp;
  camera.lookAt(lx, ly, lz);

  if (Math.abs(camera.fov - targetFov) > 0.1) {
    camera.fov += (targetFov - camera.fov) * damp;
    camera.updateProjectionMatrix();
  }
}

/* ─── CONTROLS ─── */
function handleKeyDown(e) {
  if (!isRunning && (e.key === 'Enter' || e.key === ' ')) {
    startGame();
    return;
  }
  if (!isRunning) return;

  switch (e.key) {
    case 'ArrowLeft': case 'a': case 'A':
      if (currentLane > -1) { currentLane--; playSound('swipe'); }
      break;
    case 'ArrowRight': case 'd': case 'D':
      if (currentLane < 1) { currentLane++; playSound('swipe'); }
      break;
    case 'ArrowUp': case 'w': case 'W':
      if (isGrounded) {
        playerVelY = JUMP_FORCE;
        isGrounded = false;
        playSound('jump');
      }
      break;
    case 'ArrowDown': case 's': case 'S':
      triggerSlide();
      break;
    case ' ':
      triggerButtDash();
      break;
    case 'm': case 'M':
      triggerCallMom();
      break;
    case 'd': case 'D': case 'f': case 'F':
      triggerCallDad();
      break;
  }
}

function doAction(action) {
  if (!isRunning) { startGame(); return; }
  switch (action) {
    case 'left': if (currentLane > -1) { currentLane--; playSound('swipe'); } break;
    case 'right': if (currentLane < 1) { currentLane++; playSound('swipe'); } break;
    case 'jump':
      if (isGrounded) { playerVelY = JUMP_FORCE; isGrounded = false; playSound('jump'); }
      break;
    case 'slide': triggerSlide(); break;
  }
}

function triggerSlide() {
  if (isSliding) return;
  isSliding = true;
  slideTimer = 0.85;
  shinchanGroup.scale.set(1, 0.48, 1);
  playSound('slide');
}

/* ─── FAMILY ABILITIES ─── */
function triggerCallMom() {
  if (isMomActive || momCooldown > 0) return;
  isMomActive = true;
  momCooldown = 16;
  playSound('powerup');

  showDialogue('Misae', '"Hold on, Shinnosuke! Mom\'s bicycle rollout is clearing the lane!"', '👩‍🦰');

  // Clear upcoming obstacles
  setTimeout(() => {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (obstacles[i].position.z > -45 && obstacles[i].position.z < 15) {
        spawnParticles(obstacles[i].position.clone(), 0xff6b9d, 16);
        scene.remove(obstacles[i]);
        obstacles.splice(i, 1);
      }
    }
  }, 250);

  setTimeout(() => {
    isMomActive = false;
  }, 5000);
}

function triggerCallDad() {
  if (isDadActive || dadCooldown > 0) return;
  isDadActive = true;
  dadCooldown = 14;
  playSound('powerup');

  showDialogue('Hiroshi', '"Smell this! The legendary overtime sock shockwave of a salaryman!"', '👨');

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    if (obs.category === 'villain') {
      spawnParticles(obs.position.clone(), 0x10b981, 18);
      scene.remove(obs);
      obstacles.splice(i, 1);
      score += 70;
    }
  }

  setTimeout(() => {
    isDadActive = false;
  }, 4000);
}

function triggerButtDash() {
  if (isButtDashing) return;
  isButtDashing = true;
  playSound('boost');

  const statusEl = document.getElementById('dash-status');
  if (statusEl) statusEl.textContent = '[🔥 ACTIVE]';

  showDialogue('Shin-chan', '"ULTIMATE BUTT-DASH! Nothing can catch the great Shinnosuke!"', '👦');

  setTimeout(() => {
    isButtDashing = false;
    if (shinchanGroup.aura) shinchanGroup.aura.material.opacity = 0;
    if (statusEl) statusEl.textContent = '[READY]';
  }, 3800);
}

function triggerActionKamenBeam() {
  playSound('boost');
  showDialogue('Action Kamen & Shin-chan', '"ACTION BEAM FIRE! Bwahahaha! Vanish, evil movie villains!"', '🦸‍♂️');

  // Spawn visual beam
  const beamMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.9 });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 60, 8), beamMat);
  beam.rotation.x = Math.PI / 2;
  beam.position.set(shinchanGroup.position.x, 1.2, shinchanGroup.position.z - 30);
  scene.add(beam);

  // Obliterate all obstacles and movie villains in front
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    if (obs.position.z > -60 && obs.position.z < 10) {
      spawnParticles(obs.position.clone(), 0x00f0ff, 20);
      scene.remove(obs);
      obstacles.splice(i, 1);
      score += 150;
    }
  }

  setTimeout(() => { scene.remove(beam); }, 400);
}

function triggerBuriBuriZaimon() {
  playSound('powerup');
  showDialogue('Buri Buri Zaimon', '"I am the legendary heroic pig! I always side with whoever pays me 10 billion yen!"', '🐷');

  // Clear enemies and grant cookies
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    if (obs.category === 'movie_villain' || obs.category === 'villain') {
      spawnParticles(obs.position.clone(), 0xf43f5e, 22);
      scene.remove(obs);
      obstacles.splice(i, 1);
      chocobiCount += 5;
      score += 200;
    }
  }
}

/* ─── REAL-WORLD UI TELEMETRY UPDATES ─── */
function updateAngerMeter() {
  const circle = document.getElementById('anger-circle');
  const label = document.getElementById('hud-anger');
  const icon = document.getElementById('gauge-icon');

  if (circle) {
    // Dasharray is 100
    const offset = 100 - momAnger;
    circle.style.strokeDashoffset = offset;
  }
  if (label) {
    const status = momAnger >= 80 ? 'CRITICAL!' : momAnger >= 50 ? 'WARNING' : 'CALM';
    label.textContent = `${momAnger}% (${status})`;
    label.className = `gauge-status ${momAnger >= 80 ? 'danger' : momAnger >= 50 ? 'warning' : ''}`;
  }
  if (icon) {
    icon.textContent = momAnger >= 80 ? '💥' : momAnger >= 50 ? '😡' : '👩‍🦰';
  }
}

function updateCombo() {
  const el = document.getElementById('combo-display');
  if (comboCount >= 3) {
    el.style.display = 'block';
    el.textContent = `🔥 SPEED COMBO x${comboCount}!`;
    el.style.transform = 'scale(1.25)';
    setTimeout(() => el.style.transform = 'scale(1)', 150);
  } else {
    el.style.display = 'none';
  }
}

function showDialogue(speaker, text, avatar = '👦') {
  const box = document.getElementById('dialogue-box');
  document.getElementById('dlg-name').textContent = speaker;
  document.getElementById('dlg-msg').textContent = text;
  document.getElementById('dlg-ava').textContent = avatar;
  box.style.display = 'flex';
  setTimeout(() => box.style.display = 'none', 4200);
}

function showPrizeToast(text) {
  const toast = document.getElementById('prize-toast');
  document.getElementById('prize-text').textContent = text;
  toast.style.display = 'flex';
  playSound('prize');
  setTimeout(() => toast.style.display = 'none', 4500);
}

function showLevelPopup(level) {
  const el = document.getElementById('level-indicator');
  el.textContent = `ZONE LEVEL ${level}!`;
  el.style.display = 'block';
  el.style.opacity = '1';
  setTimeout(() => { el.style.display = 'none'; }, 2000);
}

/* ─── PROCEDURAL AUDIO SYNTHESIZER ─── */
function getAudioCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }
  return audioCtx;
}

function playSound(type) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    switch (type) {
      case 'jump':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(840, now + 0.14);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.16);
        osc.start(now); osc.stop(now + 0.16);
        break;
      case 'coin':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
        break;
      case 'hit':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.22);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.25);
        osc.start(now); osc.stop(now + 0.25);
        break;
      case 'smash':
        osc.type = 'square';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.18);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
        break;
      case 'powerup':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(1100, now + 0.35);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.38);
        osc.start(now); osc.stop(now + 0.38);
        break;
      case 'boost':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.25);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.35);
        osc.start(now); osc.stop(now + 0.35);
        break;
      case 'prize':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        osc.frequency.setValueAtTime(1046.50, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.55);
        osc.start(now); osc.stop(now + 0.55);
        break;
      case 'swipe':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(480, now + 0.07);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.08);
        osc.start(now); osc.stop(now + 0.08);
        break;
      case 'slide':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.16);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.18);
        osc.start(now); osc.stop(now + 0.18);
        break;
    }
  } catch (e) {}
}

/* ─── GAME FLOW ─── */
function startGame() {
  document.getElementById('main-menu').classList.add('hidden');
  document.getElementById('game-hud').style.display = 'flex';
  document.getElementById('ability-bar').style.display = 'flex';
  document.getElementById('camera-bar').style.display = 'flex';

  isRunning = true;
  score = 0;
  chocobiCount = 0;
  momAnger = 0;
  baseSpeed = 0.42;
  currentSpeed = 0.42;
  currentLevel = 1;
  distanceTraveled = 0;
  comboCount = 0;
  isMomActive = false;
  isDadActive = false;
  isButtDashing = false;
  momCooldown = 0;
  dadCooldown = 0;
  currentLane = 0;
  playerY = 0;
  playerVelY = 0;
  isGrounded = true;
  isSliding = false;

  document.getElementById('hud-score').textContent = '000000';
  document.getElementById('hud-chocobi').textContent = 'x0';
  document.getElementById('hud-speed').textContent = 'LVL 1';
  document.getElementById('hud-distance').textContent = '0.0 KM';
  updateAngerMeter();

  showDialogue('Shin-chan', '"Action Kamen is waiting! Let the Kasukabe adventure begin!"', '👦');
  playSound('boost');
}

function triggerGameOver() {
  isRunning = false;
  const prizes = chocobiCount >= 80 ? 3 : chocobiCount >= 50 ? 2 : chocobiCount >= 20 ? 1 : 0;
  playSound('hit');

  const mc = document.getElementById('modal-content');
  mc.innerHTML = `
    <div class="modal-ico">🏁 🏆 🍪</div>
    <h2 class="modal-title">RUN COMPLETED!</h2>
    <div class="modal-row">MOM'S ANGER LEVEL: <strong style="color:${momAnger >= 80 ? '#ef4444' : '#4ade80'}">${momAnger}%</strong> (${momAnger >= 100 ? 'CAUGHT!' : 'SAFE!'})</div>
    <div class="modal-payout">
      <div class="modal-row">FINAL SCORE: <strong>${score.toLocaleString()} PTS</strong></div>
      <div class="modal-row">DISTANCE COVERED: <strong>${(distanceTraveled / 120).toFixed(2)} KM</strong></div>
      <div class="modal-row">CHOCOBI COOKIES: <strong style="color:#ffd166">🍪 x${chocobiCount}</strong></div>
      <div class="modal-big" style="margin-top:12px;">TOTAL REWARDS: ${prizes} PRIZES!</div>
    </div>
    <div class="modal-actions">
      <button class="btn-real btn-real-primary" onclick="restartGame()">🔄 PLAY AGAIN</button>
      <button class="btn-real btn-real-secondary" onclick="exitToHub()">EXIT TO PARK</button>
    </div>
  `;
  document.getElementById('modal-overlay').style.display = 'flex';
}

function restartGame() {
  document.getElementById('modal-overlay').style.display = 'none';

  obstacles.forEach(o => scene.remove(o));
  obstacles.length = 0;
  cookies.forEach(c => scene.remove(c));
  cookies.length = 0;

  for (let i = 0; i < 14; i++) {
    spawnObstacle(-24 - i * 16);
    if (i % 2 === 0) spawnCookieRow(-16 - i * 14);
  }

  startGame();
}

function exitToHub() {
  window.location.href = '../../index.html';
}

/* ─── MODALS ─── */
function openModal(type) {
  const mc = document.getElementById('modal-content');

  if (type === 'roster') {
    mc.innerHTML = `
      <h2 class="modal-title">👨‍👩‍👦 NOHARA FAMILY ROSTER</h2>
      <div class="roster-card">
        <div class="roster-avatar">👦</div>
        <div class="roster-details">
          <div class="roster-head">Shin-chan (Kasukabe Hero)</div>
          <div class="roster-desc">Sprint, Jump, Slide & Ultimate Butt-Dash burst. Unstoppable 5-year-old power!</div>
        </div>
      </div>
      <div class="roster-card">
        <div class="roster-avatar">👩‍🦰</div>
        <div class="roster-details">
          <div class="roster-head">Misae (Mom) — Press [M]</div>
          <div class="roster-desc">Bicycle Rollout! Rushes through to clear all road obstacles for 5 seconds.</div>
        </div>
      </div>
      <div class="roster-card">
        <div class="roster-avatar">👨</div>
        <div class="roster-details">
          <div class="roster-head">Hiroshi (Dad) — Press [D]</div>
          <div class="roster-desc">Smelly Sock Blast! Knocks out villain characters with salaryman foot odor.</div>
        </div>
      </div>
      <div class="roster-card">
        <div class="roster-avatar">🐕</div>
        <div class="roster-details">
          <div class="roster-head">Shiro (Loyal Companion)</div>
          <div class="roster-desc">Runs alongside and magnetically draws nearby Chocobi cookies to you!</div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn-real btn-real-primary" onclick="closeModal()">CLOSE</button>
      </div>
    `;
  } else if (type === 'prizes') {
    mc.innerHTML = `
      <h2 class="modal-title">🏆 ARCADE PRIZE VAULT</h2>
      <div class="roster-card" style="border-color:rgba(255,209,102,0.5);">
        <div class="roster-avatar">🎫</div>
        <div class="roster-details">
          <div class="roster-head" style="color:#ffd166;">Action Kamen Movie Passes</div>
          <div class="roster-desc">Unlocked at 20 Chocobi cookies collected!</div>
        </div>
      </div>
      <div class="roster-card" style="border-color:rgba(255,209,102,0.5);">
        <div class="roster-avatar">🏆</div>
        <div class="roster-details">
          <div class="roster-head" style="color:#ffd166;">Gold Action Kamen Figure (Ultra Rare)</div>
          <div class="roster-desc">Unlocked at 50 Chocobi cookies collected!</div>
        </div>
      </div>
      <div class="roster-card" style="border-color:rgba(0,240,255,0.5);">
        <div class="roster-avatar">🎒</div>
        <div class="roster-details">
          <div class="roster-head" style="color:#00f0ff;">Custom Shin-chan Kindergarten Backpack</div>
          <div class="roster-desc">Unlocked at 80 Chocobi cookies collected!</div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn-real btn-real-primary" onclick="closeModal()">BACK TO MENU</button>
      </div>
    `;
  }

  document.getElementById('modal-overlay').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
}

/* ─── CAMERA ANGLES ─── */
function setCamera(mode) {
  cameraMode = mode;
  document.querySelectorAll('.cbtn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`cam-${mode}`);
  if (btn) btn.classList.add('active');
}

/* ─── RESIZE ─── */
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/* ─── BOOTSTRAP ─── */
window.addEventListener('DOMContentLoaded', initEngine);
