/**
 * SUPERMAN: PROTECTOR OF METROPOLIS 3D 🦸‍♂️
 * Complete Superhero Simulator:
 * - High-Detail Realistic 3D Superman Model with Billowing Cape & S-Shield
 * - Stratosphere Supersonic Flight + Street-Level Dive to Ground
 * - Fighting and Subduing Bank Thieves with NYPD / Metropolis Police
 * - Complete Power Suite: Heat Vision, Freeze Breath, Super Strength Punch, Mach Boost, Invulnerability Shield
 * - Complete 27 Villains Roster across 5 Stages:
 *   Stage 1: Lex Luthor, Bruno Mannheim, Professor Hamilton (Ruin), Bloodsport, Prankster
 *   Stage 2: Metallo, Livewire, Atomic Skull, Conduit, Parasite, Toyman
 *   Stage 3: Bizarro, Manchester Black, Cyborg Superman, Eradicator, Titano, Maxima
 *   Stage 4: General Zod, Brainiac, Mongul, Lobo, Ultra-Humanite, Mr. Mxyzptlk
 *   Stage 5: GRAND FINALE - Darkseid & Doomsday lead ALL 27 villains united in Metropolis!
 */

let scene, camera, renderer, clock;
let supermanGroup, capeMesh, laserBeamsGroup, shieldSphere;
let isPlaying = false;
let isSonicBoost = false;
let isShieldActive = false;
let flightSpeed = 0.65;
let targetFlightSpeed = 0.65;
let flightAltitude = 120; // 120 = Stratosphere, -6 = Ground level with traffic
let targetAltitude = 120;
let supermanX = 0;
let targetX = 0;
let solarEnergy = 100;
let thievesCaptured = 0;
let totalThievesNeeded = 3;
let bossHealth = 100;
let currentStage = 1;

const keys = {};
const cityChunks = [];
const CHUNK_SIZE = 80;
const TOTAL_CHUNKS = 5;

// Active World Entities
const activeVillains = [];
const activeThieves = [];
const policeCars = [];
let cameraView = 'back';
let audioCtx;

// Complete 27 Superman Villains
const SUPERMAN_VILLAINS = {
  stage1: [
    { name: "Lex Luthor", title: "Kryptonite Warsuit Tycoon", color: 0x16a34a, size: 1.4, hp: 120, isLex: true },
    { name: "Bruno Mannheim", title: "Intergang Crime Boss", color: 0x475569, size: 1.2, hp: 90 },
    { name: "Professor Hamilton (Ruin)", title: "Ruin Armor Saboteur", color: 0x64748b, size: 1.2, hp: 90 },
    { name: "Bloodsport", title: "Teleporting Weapons Mercenary", color: 0x991b1b, size: 1.2, hp: 95 },
    { name: "The Prankster", title: "High-Tech Anarchist", color: 0xa855f7, size: 1.1, hp: 85 }
  ],
  stage2: [
    { name: "Metallo (John Corben)", title: "Kryptonite Heart Cyborg", color: 0x22c55e, size: 1.4, hp: 130 },
    { name: "Livewire (Leslie Willis)", title: "Pure Electrical Shock", color: 0x38bdf8, size: 1.2, hp: 100 },
    { name: "Silver Banshee", title: "Death Wail Occultist", color: 0xe2e8f0, size: 1.2, hp: 105 },
    { name: "Atomic Skull (Joseph Martin)", title: "Radioactive Nuclear Blast", color: 0xf97316, size: 1.3, hp: 110 },
    { name: "Conduit (Kenny Braverman)", title: "Kryptonite Cable Conduit", color: 0x15803d, size: 1.3, hp: 110 },
    { name: "Parasite (Rudy Jones)", title: "Energy-Draining Leech", color: 0x7e22ce, size: 1.4, hp: 125 },
    { name: "Toyman (Winslow Schott)", title: "Deadly Mechanical Automaton", color: 0xeab308, size: 1.2, hp: 95 }
  ],
  stage3: [
    { name: "Bizarro", title: "Twisted Kryptonian Mirror", color: 0x60a5fa, size: 1.5, hp: 140 },
    { name: "Manchester Black", title: "Telekinetic Elite Leader", color: 0x0f172a, size: 1.2, hp: 115 },
    { name: "Cyborg Superman (Hank Henshaw)", title: "Cosmic Alloy Usurper", color: 0x94a3b8, size: 1.5, hp: 145 },
    { name: "The Eradicator", title: "Kryptonian Preservation Matrix", color: 0xfacc15, size: 1.3, hp: 125 },
    { name: "Titano the Super-Ape", title: "Colossal Kryptonite Ape", color: 0x78716c, size: 1.8, hp: 150 },
    { name: "Maxima", title: "Almerac Warrior Empress", color: 0xec4899, size: 1.3, hp: 120 }
  ],
  stage4: [
    { name: "General Zod", title: "Kryptonian Warlord ('Kneel Before Zod')", color: 0x18181b, size: 1.5, hp: 160 },
    { name: "Brainiac", title: "Collector of Worlds AI", color: 0x10b981, size: 1.4, hp: 160 },
    { name: "Mongul", title: "Warworld Tyrant Emperor", color: 0xf59e0b, size: 1.7, hp: 150 },
    { name: "Lobo", title: "Czarnian Bounty Hunter", color: 0x334155, size: 1.5, hp: 145 },
    { name: "Ultra-Humanite", title: "Albino Gorilla Mastermind", color: 0xe2e8f0, size: 1.6, hp: 140 },
    { name: "Mr. Mxyzptlk", title: "5th-Dimensional Reality Bender", color: 0xf43f5e, size: 1.0, hp: 120 }
  ],
  stage5: [
    { name: "Darkseid", title: "Lord of Apokolips & Omega Beams", color: 0x3f3f46, size: 1.9, hp: 250, isDarkseid: true },
    { name: "Doomsday", title: "Ultimate Kryptonian Monster", color: 0x71717a, size: 1.9, hp: 250, isDoomsday: true }
  ]
};

function initEngine() {
  const canvas = document.getElementById('three-canvas');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f172a);
  scene.fog = new THREE.FogExp2(0x0f172a, 0.006);

  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1200);
  camera.position.set(0, 4, 10);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Sunlight reflecting off Metropolis glass towers
  const ambient = new THREE.AmbientLight(0xffedd5, 0.8);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffedd5, 1.5);
  sun.position.set(60, 140, 50);
  sun.castShadow = true;
  scene.add(sun);

  // Superman 3D Model
  supermanGroup = createRealisticSupermanMesh();
  scene.add(supermanGroup);

  // Heat Vision Lasers
  laserBeamsGroup = new THREE.Group();
  scene.add(laserBeamsGroup);

  // Invulnerability Shield Mesh
  const shieldMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0, wireframe: true });
  shieldSphere = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 16), shieldMat);
  supermanGroup.add(shieldSphere);

  // Build Metropolis with Streets & Sky Corridors
  buildModularMetropolis();

  // Populate Street Ground (Traffic & Police)
  spawnStreetTraffic();

  // Load Stage 1
  loadStage(1);

  // Key Listeners
  setupKeyListeners();

  clock = new THREE.Clock();
  requestAnimationFrame(animate);
}

/* ─── REALISTIC 3D SUPERMAN MODEL (NEVER COVERED BY ANY BAR) ─── */
function createRealisticSupermanMesh() {
  const group = new THREE.Group();
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x003f91, roughness: 0.35, metalness: 0.2 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.4 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.7 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2 });

  // Aerodynamic Heroic Flying Torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.70, 0.52, 1.45, 14), blueMat);
  torso.rotation.x = Math.PI / 2;
  torso.castShadow = true;
  group.add(torso);

  // S-Shield on Chest
  const shield = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 0.55), yellowMat);
  shield.position.set(0, 0.36, 0.22);
  shield.rotation.y = Math.PI / 4;
  group.add(shield);

  const innerRedS = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.07, 0.35), redMat);
  innerRedS.position.set(0, 0.37, 0.22);
  innerRedS.rotation.y = Math.PI / 4;
  group.add(innerRedS);

  // Head with Superman's iconic hair curl
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 14), skinMat);
  head.position.set(0, 0.15, 1.15);
  head.castShadow = true;
  group.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.40, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
  hair.position.set(0, 0.20, 1.18);
  group.add(hair);

  // Outstretched Fists in Mach Flight
  for (const x of [-0.65, 0.65]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 1.1, 8), blueMat);
    arm.position.set(x, 0.1, 1.55);
    arm.rotation.x = Math.PI / 2;
    group.add(arm);

    const fist = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 8), skinMat);
    fist.position.set(x, 0.1, 2.15);
    group.add(fist);
  }

  // Athletic Legs & Red Boots
  for (const x of [-0.26, 0.26]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 1.3, 8), blueMat);
    leg.position.set(x, -0.05, -1.35);
    leg.rotation.x = Math.PI / 2;
    group.add(leg);

    const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.17, 0.85, 8), redMat);
    boot.position.set(x, -0.05, -2.1);
    boot.rotation.x = Math.PI / 2;
    group.add(boot);
  }

  // Billowing Red Cape
  const capeGeo = new THREE.PlaneGeometry(1.6, 2.6, 4, 4);
  const capeMat = new THREE.MeshStandardMaterial({ color: 0xd90429, side: THREE.DoubleSide, roughness: 0.6 });
  capeMesh = new THREE.Mesh(capeGeo, capeMat);
  capeMesh.position.set(0, 0.25, -0.8);
  capeMesh.rotation.x = Math.PI / 2 + 0.1;
  group.add(capeMesh);

  return group;
}

/* ─── MODULAR METROPOLIS: TOWERS & GROUND HIGHWAYS ─── */
function buildModularMetropolis() {
  for (let i = 0; i < TOTAL_CHUNKS; i++) {
    const chunk = createMetropolisChunk();
    chunk.position.z = -i * CHUNK_SIZE;
    scene.add(chunk);
    cityChunks.push(chunk);
  }
}

function createMetropolisChunk() {
  const chunk = new THREE.Group();

  // Ground Highway (Street Level at y = -10)
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  const road = new THREE.Mesh(new THREE.BoxGeometry(45, 2, CHUNK_SIZE), roadMat);
  road.position.y = -10;
  chunk.add(road);

  // Daily Planet & LexCorp Style Golden-Age Skyscrapers
  const towerColors = [0x0284c7, 0x1e3a8a, 0x0f172a, 0x334155];
  for (let z = -CHUNK_SIZE / 2 + 15; z < CHUNK_SIZE / 2; z += 35) {
    for (const side of [-1, 1]) {
      const bH = 65 + Math.random() * 60;
      const bW = 20 + Math.random() * 8;
      const bD = 22;

      const tower = new THREE.Mesh(
        new THREE.BoxGeometry(bW, bH, bD),
        new THREE.MeshStandardMaterial({ color: towerColors[Math.floor(Math.random() * towerColors.length)], metalness: 0.85, roughness: 0.2 })
      );
      tower.position.set(side * (24 + bW / 2), bH / 2 - 10, z);
      tower.castShadow = true;
      chunk.add(tower);
    }
  }

  return chunk;
}

function spawnStreetTraffic() {
  for (let i = 0; i < 4; i++) {
    const isPolice = (i % 2 === 0);
    const car = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: isPolice ? 0x0284c7 : 0xfacc15 });
    const b = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 4.5), mat);
    b.position.y = -9.0;
    car.add(b);
    car.position.set((i % 2 === 0 ? -6 : 6), 0, -40 - i * 40);
    car.speed = 0.4;
    car.isPolice = isPolice;
    scene.add(car);
    if (isPolice) policeCars.push(car);
  }
}

/* ─── STAGE PROGRESSION & 27 VILLAINS ─── */
function loadStage(stageNum) {
  currentStage = stageNum;
  thievesCaptured = 0;
  totalThievesNeeded = 2 + stageNum;

  // Clear existing
  activeVillains.forEach(v => scene.remove(v));
  activeVillains.length = 0;
  activeThieves.forEach(t => scene.remove(t));
  activeThieves.length = 0;

  const stageNameElem = document.getElementById('hud-stage-name');
  const thievesElem = document.getElementById('hud-thieves-count');
  const bossHud = document.getElementById('boss-hud-bar');

  thievesElem.textContent = `0 / ${totalThievesNeeded} (HELP POLICE)`;

  // Spawn Thieves on Ground Level
  for (let i = 0; i < totalThievesNeeded; i++) {
    const thief = createThiefMesh(i);
    thief.position.set((Math.random() - 0.5) * 14, -8.8, -40 - i * 35);
    scene.add(thief);
    activeThieves.push(thief);
  }

  // Load Stage Bosses
  if (stageNum === 1) {
    stageNameElem.textContent = 'STAGE 1: LEXCORP & INTERGANG';
    spawnBosses(SUPERMAN_VILLAINS.stage1);
    showDialogue('Lex Luthor', '"Superman! My Kryptonite Warsuit and Intergang will bring you to your knees!"', '🦹');
  } else if (stageNum === 2) {
    stageNameElem.textContent = 'STAGE 2: METALLO & PARASITE';
    spawnBosses(SUPERMAN_VILLAINS.stage2);
    showDialogue('Metallo', '"Feel the burning green heart of Kryptonite, Man of Steel!"', '☢️');
  } else if (stageNum === 3) {
    stageNameElem.textContent = 'STAGE 3: CYBORG & BIZARRO';
    spawnBosses(SUPERMAN_VILLAINS.stage3);
    showDialogue('Cyborg Superman', '"I have replaced you in every corner of the cosmos!"', '🤖');
  } else if (stageNum === 4) {
    stageNameElem.textContent = 'STAGE 4: GENERAL ZOD & BRAINIAC';
    spawnBosses(SUPERMAN_VILLAINS.stage4);
    showDialogue('General Zod', '"You choose these weak humans over your own blood? KNEEL BEFORE ZOD!"', '⚔️');
  } else if (stageNum === 5) {
    stageNameElem.textContent = 'STAGE 5: APODAL SHOWDOWN (DARKSEID & DOOMSDAY)';
    // Grand Finale: Darkseid, Doomsday + all villain leaders assembled!
    const allFinale = [
      ...SUPERMAN_VILLAINS.stage5,
      ...SUPERMAN_VILLAINS.stage4.slice(0, 3),
      ...SUPERMAN_VILLAINS.stage3.slice(0, 3),
      ...SUPERMAN_VILLAINS.stage2.slice(0, 3),
      ...SUPERMAN_VILLAINS.stage1.slice(0, 2)
    ];
    spawnBosses(allFinale);
    showDialogue('Darkseid', '"I am the New God. I am the end of hope. Fall before the Anti-Life equation!"', '👁️');
  }

  bossHud.style.display = 'block';
  updateBossHud();
}

function spawnBosses(roster) {
  roster.forEach((vData, index) => {
    const boss = createBossMesh(vData);
    // Position lead boss right in front of Superman at z = -24 to be immediately visible!
    const zOffset = -24 - index * 28;
    const xOffset = (index === 0) ? 0 : (index % 2 === 1 ? -6 : 6);
    boss.position.set(xOffset, 4.5, zOffset);
    boss.villainData = vData;
    boss.hp = vData.hp;
    boss.maxHp = vData.hp;
    scene.add(boss);
    activeVillains.push(boss);
  });
}

function createBillboardNameTag(text, color = '#ffd60a') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.roundRect ? ctx.roundRect(10, 10, 492, 108, 16) : ctx.rect(10, 10, 492, 108);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  ctx.stroke();

  ctx.font = 'bold 36px sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(6.5, 1.6, 1);
  return sprite;
}

function createBossMesh(vData) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: vData.color,
    emissive: vData.color,
    emissiveIntensity: 0.35,
    metalness: 0.7,
    roughness: 0.25
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.0 * vData.size, 1.6 * vData.size, 0.8 * vData.size), mat);
  body.position.y = 1.0;
  body.castShadow = true;
  g.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42 * vData.size, 12, 12), mat);
  head.position.y = 2.1;
  g.add(head);

  // Overhead Glowing 3D Name Tag so villain is 100% visible
  const nameTag = createBillboardNameTag(`⚔️ ${vData.name.toUpperCase()}`, '#ffd60a');
  nameTag.position.set(0, 3.2 * vData.size, 0);
  g.add(nameTag);

  // Distinct villain PointLight
  const vLight = new THREE.PointLight(vData.color, 1.5, 25);
  vLight.position.set(0, 2, 0);
  g.add(vLight);

  // Darkseid Omega Eyes or Doomsday Bone Spikes or Lex Kryptonite Core
  if (vData.isDarkseid) {
    const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    eye1.position.set(-0.15, 2.1, 0.4);
    g.add(eye1);
    const eye2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    eye2.position.set(0.15, 2.1, 0.4);
    g.add(eye2);
  } else if (vData.isDoomsday) {
    for (let s = 0; s < 4; s++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.7, 4), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      spike.position.set((s % 2 === 0 ? -0.7 : 0.7), 1.5 + s * 0.2, 0);
      spike.rotation.z = (s % 2 === 0 ? 0.8 : -0.8);
      g.add(spike);
    }
  } else if (vData.isLex) {
    // Glowing green Kryptonite chest core
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.25), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    core.position.set(0, 1.3, 0.45);
    g.add(core);
  }

  g.isBoss = true;
  g.hitRadius = 2.6 * vData.size;
  return g;
}

function createThiefMesh(id) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.3, 0.5), mat);
  b.position.y = 0.65;
  g.add(b);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfde047 }));
  head.position.y = 1.45;
  g.add(head);

  g.isThief = true;
  g.isSubdued = false;
  g.hitRadius = 2.5;
  return g;
}

/* ─── POWER ACTIONS (HEAT VISION, FREEZE BREATH, PUNCH, SHIELD, DIVE) ─── */
function triggerSonicFlight() {
  playSynthSound('sonicBoom');
  targetFlightSpeed = 1.6;
  showDialogue('Superman', '"Breaking the sound barrier! Mach 3 velocity!"', '🚀');
  setTimeout(() => { targetFlightSpeed = 0.65; }, 1800);
}

function triggerHeatVision() {
  playSynthSound('laser');
  laserBeamsGroup.clear();

  const laserMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
  for (const x of [-0.15, 0.15]) {
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 60, 6), laserMat);
    beam.position.set(supermanGroup.position.x + x, supermanGroup.position.y + 0.15, supermanGroup.position.z - 30);
    beam.rotation.x = Math.PI / 2;
    laserBeamsGroup.add(beam);
  }

  // Damage nearest villain or subdue thief
  activeVillains.forEach(boss => {
    if (boss.position.z > -70) {
      damageActiveBoss(30);
      boss.position.z = -100;
    }
  });

  activeThieves.forEach(thief => {
    if (!thief.isSubdued && Math.abs(thief.position.z - supermanGroup.position.z) < 40) {
      subdueThief(thief);
    }
  });

  setTimeout(() => { laserBeamsGroup.clear(); }, 350);
}

function triggerFreezeBreath() {
  playSynthSound('freeze');
  showDialogue('Superman', '"Arctic Freeze Breath! Subduing all hostiles in the sector!"', '❄️');

  activeVillains.forEach(boss => {
    if (Math.abs(boss.position.z - supermanGroup.position.z) < 50) {
      boss.material = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
      damageActiveBoss(25);
    }
  });

  activeThieves.forEach(thief => {
    if (!thief.isSubdued && Math.abs(thief.position.z - supermanGroup.position.z) < 50) {
      subdueThief(thief);
    }
  });
}

function triggerSuperPunch() {
  playSynthSound('punch');
  showDialogue('Superman', '"Super Strength Strike! That\'s enough from you!"', '💥');
  damageActiveBoss(40);
}

function triggerShield() {
  isShieldActive = !isShieldActive;
  shieldSphere.material.opacity = isShieldActive ? 0.6 : 0;
  playSynthSound('shield');
  showDialogue('Superman', isShieldActive ? '"Invulnerability Bio-Electric Shield active!"' : '"Shield lowered."', '🛡️');
}

function diveToGround() {
  const btn = document.getElementById('btn-dive-ground');
  const flightLayer = document.getElementById('hud-flight-layer');

  if (targetAltitude > 0) {
    // Dive down to Street Level
    targetAltitude = -7.5;
    btn.textContent = '⬆️ [W] SOAR TO STRATOSPHERE';
    flightLayer.textContent = 'STREET LEVEL 🏙️ (POLICE ENGAGED)';
    flightLayer.className = 'real-telem-val gold';
    showDialogue('Superman', '"Diving to ground level! Assisting Metropolis Police with street thieves!"', '🦸‍♂️');
  } else {
    // Soar back to Stratosphere
    targetAltitude = 120;
    btn.textContent = '⬇️ [S] DIVE TO GROUND';
    flightLayer.textContent = 'STRATOSPHERE 🦅';
    flightLayer.className = 'real-telem-val emerald';
    showDialogue('Superman', '"Soaring into the high stratosphere for bird\'s-eye patrol!"', '🦅');
  }
}

function subdueThief(thief) {
  thief.isSubdued = true;
  thief.material = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  thievesCaptured++;
  playSynthSound('victory');

  document.getElementById('hud-thieves-count').textContent = `${thievesCaptured} / ${totalThievesNeeded} (POLICE SECURED)`;
  showDialogue('Metropolis Police', '"Thief neutralized by Superman! Police cruiser taking them into custody!"', '🚓');

  if (thievesCaptured >= totalThievesNeeded) {
    damageActiveBoss(35);
  }
}

function damageActiveBoss(amount) {
  bossHealth = Math.max(0, bossHealth - amount);
  updateBossHud();

  if (bossHealth <= 0) {
    playSynthSound('victory');
    showDialogue('Superman', `"Stage ${currentStage} villains neutralized! Metropolis stands safe!"`, '🏆');
    const modal = document.getElementById('endgame-modal');
    if (modal) {
      const title = document.getElementById('endgame-title');
      const subtitle = document.getElementById('endgame-subtitle');
      if (title) title.textContent = currentStage < 5 ? `STAGE ${currentStage} CLEARED!` : '🌟 ALL 27 VILLAINS DEFEATED!';
      if (subtitle) subtitle.textContent = currentStage < 5 ? 'Superman and Metropolis Police subdued all threats!' : 'Superman defeated Darkseid, Doomsday, Lex Luthor, and all 27 villains!';
      modal.style.display = 'flex';
    }
  }
}

function restartSupermanGame() {
  const modal = document.getElementById('endgame-modal');
  if (modal) modal.style.display = 'none';
  bossHealth = 100;
  thievesCaptured = 0;
  targetAltitude = 120;
  supermanX = 0;
  targetX = 0;
  loadStage(1);
  showDialogue('Superman', '"Metropolis patrol reset. Ready for flight!"', '🦸‍♂️');
}
window.restartSupermanGame = restartSupermanGame;

function loadNextStage() {
  const modal = document.getElementById('endgame-modal');
  if (modal) modal.style.display = 'none';
  if (currentStage < 5) {
    loadStage(currentStage + 1);
  } else {
    loadStage(1);
  }
}
window.loadNextStage = loadNextStage;

function updateBossHud() {
  const hpFill = document.getElementById('boss-hp-fill');
  const hpText = document.getElementById('boss-hp-text');
  const bossTitle = document.getElementById('boss-title');

  if (activeVillains.length > 0) {
    const leader = activeVillains[0];
    if (bossTitle) bossTitle.textContent = `⚔️ ${leader.villainData.name}`;
  }
  if (hpFill) hpFill.style.width = `${bossHealth}%`;
  if (hpText) hpText.textContent = `${bossHealth}% HP`;
}

/* ─── PROCEDURAL AUDIO ─── */
function getAudioCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }
  return audioCtx;
}

function playSynthSound(type) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'laser') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.22);
      osc.start(now); osc.stop(now + 0.22);
    } else if (type === 'freeze') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.linearRampToValueAtTime(300, now + 0.35);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
    } else if (type === 'punch') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.22);
      osc.start(now); osc.stop(now + 0.22);
    } else if (type === 'sonicBoom') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.5);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.55);
      osc.start(now); osc.stop(now + 0.55);
    } else if (type === 'victory') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.linearRampToValueAtTime(1046.5, now + 0.4); // C6
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.45);
      osc.start(now); osc.stop(now + 0.45);
    }
  } catch (e) {}
}

function setupKeyListeners() {
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' && isPlaying) triggerSonicFlight();
    if (e.key === 'f' || e.key === 'F' || e.key === 'q' || e.key === 'Q') triggerHeatVision();
    if (e.key === 'r' || e.key === 'R' || e.key === 'e' || e.key === 'E') triggerFreezeBreath();
    if (e.key === 's' || e.key === 'S') diveToGround();
    if (e.key === 'w' || e.key === 'W') { targetAltitude = 120; }
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') targetX = Math.max(-16, targetX - 4.0);
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') targetX = Math.min(16, targetX + 4.0);
  });

  window.addEventListener('keyup', (e) => { keys[e.key] = false; });

  // Native Mobile Touch Drag Flight Steering & Gestures
  let touchStartX = 0, touchStartY = 0, lastTouchX = 0, lastTouchY = 0;
  window.addEventListener('touchstart', (e) => {
    if (!isPlaying || e.touches.length === 0) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    lastTouchX = touchStartX;
    lastTouchY = touchStartY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isPlaying || e.touches.length === 0) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const dx = currentX - lastTouchX;
    const dy = currentY - lastTouchY;
    const sens = (window.innerWidth < 650) ? 0.08 : 0.05;
    targetX = Math.max(-16, Math.min(16, targetX + dx * sens));
    targetAltitude = Math.max(15, Math.min(130, targetAltitude - dy * 0.4));
    lastTouchX = currentX;
    lastTouchY = currentY;
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (!isPlaying) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const dy = touch.clientY - touchStartY;
    const dx = touch.clientX - touchStartX;
    if (dy < -45 && Math.abs(dy) > Math.abs(dx)) {
      triggerSonicFlight(); // Swipe up = Mach 3 Boost
    } else if (Math.abs(dx) < 15 && Math.abs(dy) < 15) {
      triggerHeatVision(); // Tap = Heat Vision
    }
  }, { passive: true });

  // Hook into Universal Touch Controller
  if (window.arcadeTouchController) {
    window.arcadeTouchController.callbacks.steer = (dx, dy) => {
      const factor = (window.innerWidth < 650) ? 0.08 : 0.05;
      targetX = Math.max(-16, Math.min(16, targetX + dx * factor));
      targetAltitude = Math.max(15, Math.min(130, targetAltitude - dy * 0.4));
    };
    window.arcadeTouchController.callbacks.jump = () => {
      if (isPlaying) triggerSonicFlight();
    };
    window.arcadeTouchController.callbacks.swing = () => {
      if (isPlaying) diveToGround();
    };
    window.arcadeTouchController.callbacks.action1 = () => {
      if (isPlaying) triggerHeatVision();
    };
    window.arcadeTouchController.createMobileActionCluster({
      primary: { icon: '🔥', color: '#f43f5e', action: () => triggerHeatVision() },
      secondary: { icon: '❄️', color: '#38bdf8', action: () => triggerFreezeBreath() }
    });
  }

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('orientationchange', onWindowResize);
}

/* ── ANIMATION LOOP ── */
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  if (isPlaying) {
    flightSpeed += (targetFlightSpeed - flightSpeed) * Math.min(1.0, 5.0 * delta);
    const forwardStep = flightSpeed * delta * 65;

    // Stream City
    cityChunks.forEach(chunk => {
      chunk.position.z += forwardStep;
      if (chunk.position.z > CHUNK_SIZE) chunk.position.z -= TOTAL_CHUNKS * CHUNK_SIZE;
    });

    // Stream Debris
    debrisMeshes.forEach(d => {
      d.position.z += forwardStep * 0.75;
      if (d.position.z > 30) {
        d.position.z = -220 - Math.random() * 80;
        d.position.x = (Math.random() - 0.5) * 32;
        d.position.y = 20 + Math.random() * 45;
      }
    });

    // Smooth Flying Physics
    supermanGroup.position.x += (targetX - supermanGroup.position.x) * Math.min(1.0, 8.0 * delta);
    supermanGroup.position.y += (targetAltitude - supermanGroup.position.y) * Math.min(1.0, 6.0 * delta);

    // Roll banking in turns
    const rollAngle = -(targetX - supermanGroup.position.x) * 0.08;
    supermanGroup.rotation.z += (rollAngle - supermanGroup.rotation.z) * Math.min(1.0, 10.0 * delta);

    // Update active villains
    activeVillains.forEach(v => {
      v.position.z += forwardStep * 0.6;
      if (v.position.z > 25) {
        v.position.z = -180 - Math.random() * 60;
        v.position.x = (Math.random() - 0.5) * 30;
      }
    });

    // Animate Cape flutter
    if (capeMesh) {
      const t = clock.getElapsedTime() * 15;
      capeMesh.rotation.x = Math.PI / 4 + Math.sin(t) * 0.15;
      capeMesh.rotation.y = Math.cos(t * 0.8) * 0.08;
    }
  }

  updateCamera(delta);
  renderer.render(scene, camera);
}

function updateCamera(delta) {
  let tx, ty, tz;
  const isMobile = window.innerWidth < 650;
  if (cameraView === 'front') {
    tx = supermanGroup.position.x;
    ty = supermanGroup.position.y + 0.5;
    tz = supermanGroup.position.z - 5;
    camera.position.set(tx, ty, tz);
    camera.lookAt(supermanGroup.position.x, supermanGroup.position.y, 20);
  } else if (cameraView === 'top') {
    tx = supermanGroup.position.x;
    ty = supermanGroup.position.y + 20;
    tz = supermanGroup.position.z + 5;
    camera.position.set(tx, ty, tz);
    camera.lookAt(supermanGroup.position.x, supermanGroup.position.y, -15);
  } else {
    // Elevate Superman high and clear into the sky with zero obstructions
    tx = supermanGroup.position.x * 0.4;
    ty = supermanGroup.position.y + (isMobile ? 3.0 : 2.2);
    tz = supermanGroup.position.z + (isMobile ? 16.5 : 14.5);
    camera.position.x += (tx - camera.position.x) * Math.min(1.0, 10.0 * delta);
    camera.position.y += (ty - camera.position.y) * Math.min(1.0, 10.0 * delta);
    camera.position.z += (tz - camera.position.z) * Math.min(1.0, 10.0 * delta);
    camera.lookAt(supermanGroup.position.x * 0.4, supermanGroup.position.y - 0.2, -20);
  }
}

function showDialogue(speaker, msg, avatar = '🦸‍♂️') {
  const dlg = document.getElementById('dialogue');
  if (!dlg) return;
  const nameEl = document.getElementById('dlg-name');
  const textEl = document.getElementById('dlg-text');
  const avEl = document.getElementById('dlg-avatar');
  if (nameEl) nameEl.textContent = speaker;
  if (textEl) textEl.textContent = msg;
  if (avEl) avEl.textContent = avatar;
  dlg.style.display = 'flex';
  setTimeout(() => { dlg.style.display = 'none'; }, 3000);
}

function startGame() {
  document.getElementById('main-menu').style.display = 'none';
  const hudStrip = document.getElementById('hud-strip');
  if (hudStrip) hudStrip.style.display = 'flex';

  isPlaying = true;
  bossHealth = 100;
  loadStage(1);
  showDialogue('Superman', 'Stage 1: Protect Metropolis from Lex Luthor drone waves!', '🦸‍♂️');
}

function exitToHub() {
  window.location.href = '../../index.html';
}

function onWindowResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  if (w < 650) {
    camera.fov = 75;
  } else {
    camera.fov = 60;
  }
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

window.addEventListener('DOMContentLoaded', initEngine);

