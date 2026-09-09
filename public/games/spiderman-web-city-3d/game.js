/**
 * SPIDER-MAN: NEW YORK SWING & CRIME DEFENDER 3D 🕷️
 * Full Superhero Experience:
 * - Red Suit (Classic Agility) & Black Suit (Symbiote Rage & Tendril Strike)
 * - Wall-Climbing & Wall-Running with hand/finger grip mechanics
 * - 3D Real-World Traffic: Yellow Taxis, Sedans, NYPD Cruisers & Elevated Subway Trains
 * - Running directly over train roofs and moving car rooftops
 * - Web-Net Shooting: Trap street thieves in glowing webs for NYPD capture
 * - Rescue Mary Jane mission events with rooftop cutscenes
 * - Complete 30+ Villain Cast across 5 progressive stages:
 *   Stage 1: Street Crime (Kingpin, Tombstone, Hammerhead, Chameleon, Shocker, Mister Negative)
 *   Stage 2: Science & Elemental (Sandman, Electro, Mysterio, Lizard, Hydro-Man, Morbius)
 *   Stage 3: Predators & Symbiotes (Kraven, Vulture, Rhino, Scorpion, Black Cat, Venom, Carnage)
 *   Stage 4: Masters of Evil (Doc Ock, Hobgoblin, Beetle, Prowler, Tinkerer, Jack O'Lantern, Spot, Morlun, Smythe)
 *   Stage 5: GRAND FINALE - Green Goblin leads ALL 30+ villains united in Manhattan!
 */

let scene, camera, renderer, clock;
let spideyGroup, spideyMeshParts = {};
let webLine;
let isPlaying = false;
let isSwinging = false;
let isWallClimbing = false;
let wallClimbDir = 1; // 1 = climbing up, -1 = down
let wallRunningSide = 0; // -1 = left wall, 1 = right wall
let currentSuitMode = 'red'; // 'red' or 'black'

let swingSpeed = 0.65;
let targetSwingSpeed = 0.65;
let swingAngle = 0;
let spideyY = 8;
let spideyVelY = 0;
let spideyX = 0;
let targetX = 0;
let spideyZ = 0;
let webAnchor = new THREE.Vector3();
const keys = {};

// City & World Objects
const manhattanChunks = [];
const CHUNK_SIZE = 80;
const TOTAL_CHUNKS = 5;

// Traffic & Trains
const cityCars = [];
const subwayTrains = [];
let trainTrack;

// Active Gameplay Entities
const activeThieves = [];
const activePoliceCars = [];
let maryJaneTarget = null;
let activeBosses = [];
let webNetsInFlight = [];

// Game Progression
let currentStage = 1;
let thievesCaptured = 0;
let totalThievesNeeded = 3;
let mjSaved = false;
let bossHealth = 100;
let cameraView = 'back';
let audioCtx;

// 50-Second Stage Timer
let stageTimeLeft = 50;
let stageTimerInterval = null;

// ── 30 STAGES COMPLETE ROSTER ──
const ALL_30_STAGES = [
  // Stage 1-5: Street Gangs
  { name:'STREET SYNDICATE',     boss:'Kingpin',                 color:0xffffff, size:1.4, hp:80,  theme:'🏙️ Midtown Manhattan — Street Crime' },
  { name:'TOMBSTONE TURF',       boss:'Tombstone',               color:0xe2e8f0, size:1.3, hp:90,  theme:'🌆 Brooklyn Bridge — Gang Territory' },
  { name:'HAMMERHEAD HEIST',     boss:'Hammerhead',              color:0x64748b, size:1.2, hp:95,  theme:'💰 Times Square — Adamantium Robbery' },
  { name:'CHAMELEON CHASE',      boss:'The Chameleon',           color:0x94a3b8, size:1.1, hp:85,  theme:'🎭 Central Park — Impersonation Chaos' },
  { name:'SHOCKER SHOCK',        boss:'The Shocker',             color:0xeab308, size:1.1, hp:90,  theme:'⚡ Grand Central — Vibro Shock Assault' },
  // Stage 6-10: Elemental
  { name:'SANDSTORM SURGE',      boss:'Sandman',                 color:0xd97706, size:1.5, hp:110, theme:'🏖️ Coney Island — Molecular Sand Storm' },
  { name:'ELECTRO GRID',         boss:'Electro',                 color:0x38bdf8, size:1.2, hp:100, theme:'⚡ Empire State — Electrical Grid Takeover' },
  { name:'MYSTERIO MAZE',        boss:'Mysterio',                color:0x10b981, size:1.2, hp:95,  theme:'🎩 Hollywood Backlot — Illusion Maze' },
  { name:'LIZARD LABS',          boss:'The Lizard',              color:0x15803d, size:1.4, hp:110, theme:'🐊 Oscorp Labs — Reptilian Mutation' },
  { name:'HYDRO FLOOD',          boss:'Hydro-Man',               color:0x0284c7, size:1.4, hp:105, theme:'🌊 Manhattan Waterfront — Liquid Giant' },
  // Stage 11-15: Hunters
  { name:'KRAVEN HUNT',          boss:'Kraven the Hunter',       color:0xb45309, size:1.3, hp:115, theme:'🦁 Central Park Zoo — Apex Predator Hunt' },
  { name:'VULTURE SKIES',        boss:'The Vulture',             color:0x166534, size:1.3, hp:110, theme:'🦅 Avengers Tower Airspace — Sky Assault' },
  { name:'RHINO RAMPAGE',        boss:'The Rhino',               color:0x475569, size:1.6, hp:130, theme:'🦏 Fifth Avenue — Unstoppable Stampede' },
  { name:'SCORPION STING',       boss:'The Scorpion',            color:0x22c55e, size:1.3, hp:115, theme:'🦂 Subway Tunnels — Mechanical Stinger' },
  { name:'BLACK CAT HEIST',      boss:'Black Cat',               color:0x1e1b4b, size:1.1, hp:90,  theme:'🐱 Jewelry District — Bad-Luck Thieves' },
  // Stage 16-20: Symbiotes
  { name:'VENOM RISING',         boss:'Venom',                   color:0x09090b, size:1.6, hp:140, theme:'🖤 Daily Bugle — Lethal Symbiote Rage' },
  { name:'CARNAGE CARNAGE',      boss:'Carnage',                 color:0x991b1b, size:1.4, hp:135, theme:'🔴 Ravencroft — Symbiote Blade Frenzy' },
  { name:'MORBIUS NIGHT',        boss:'Morbius',                 color:0x881337, size:1.2, hp:100, theme:'🦇 Greenwich Village — Living Vampire' },
  { name:'NEGATIVE ENERGY',      boss:'Mister Negative',         color:0x0f172a, size:1.2, hp:95,  theme:'☯️ Chinatown — Dark Energy Corruption' },
  { name:'SHOCKER RETURNS',      boss:'Shocker + Beetle',        color:0x7c3aed, size:1.2, hp:110, theme:'💜 Brooklyn — Double Villain Alliance' },
  // Stage 21-25: Masters of Evil
  { name:'OCTO TERROR',          boss:'Doctor Octopus',          color:0x065f46, size:1.3, hp:140, theme:'🐙 Oscorp — Four Tentacle Siege' },
  { name:'HOBGOBLIN HAVOC',      boss:'Hobgoblin',               color:0xf97316, size:1.3, hp:120, theme:'🎃 Queensboro Bridge — Demonic Glider Raid' },
  { name:'SINISTER SIX',         boss:'Prowler',                 color:0x581c87, size:1.2, hp:110, theme:'😈 Hell\'s Kitchen — Sinister Syndicate' },
  { name:'JACK LANTERN',         boss:'Jack O\' Lantern',        color:0xea580c, size:1.2, hp:110, theme:'🎃 Halloween Manhattan — Flaming Pumpkins' },
  { name:'MORLUN ANCIENT',       boss:'Morlun',                  color:0x450a0a, size:1.3, hp:130, theme:'🕸️ Astral Plane — Ancient Totem War' },
  // Stage 26-29: Pre-Finale
  { name:'SPOT DIMENSION',       boss:'Spot',                    color:0xf8fafc, size:1.2, hp:115, theme:'⚫ Quantum Dimension — Portal Ambush' },
  { name:'SMYTHE SPIDERS',       boss:'Alistair Smythe',         color:0x334155, size:1.5, hp:125, theme:'🤖 SHIELD Helicarrier — Spider-Slayer Army' },
  { name:'SYMBIOTE ARMY',        boss:'Carnage Army',            color:0x7f1d1d, size:1.4, hp:145, theme:'🩸 Venom Planet — Mass Symbiote Invasion' },
  { name:'GOBLIN NATION',        boss:'Hobgoblin Army',          color:0x431407, size:1.4, hp:150, theme:'🔥 New York Skyline — Glider Armada' },
  // Stage 30: Green Goblin GRAND FINALE
  { name:'GREEN GOBLIN FINALE',  boss:'Green Goblin (Norman Osborn)', color:0x16a34a, size:1.8, hp:200, theme:'🎃 GRAND FINALE — ALL VILLAINS UNITED!', isFinalGoblin:true }
];

// Complete 30+ Villains Roster (legacy 5-stage groups used in spawnBosses)
const VILLAIN_ROSTER = {
  stage1: [
    { name: "Kingpin (Wilson Fisk)", title: "Crime Syndicate Mastermind", color: 0xffffff, size: 1.4, hp: 100 },
    { name: "Tombstone (Lonnie Lincoln)", title: "Chalk-White Enforcer", color: 0xe2e8f0, size: 1.3, hp: 90 },
    { name: "Hammerhead", title: "Adamantium Skull Mobster", color: 0x64748b, size: 1.2, hp: 85 },
    { name: "The Chameleon", title: "Master Impersonator", color: 0x94a3b8, size: 1.1, hp: 80 },
    { name: "The Shocker (Herman Schultz)", title: "Vibro-Shock Blaster", color: 0xeab308, size: 1.1, hp: 85 },
    { name: "Mister Negative (Martin Li)", title: "Negative Energy Lord", color: 0x0f172a, size: 1.2, hp: 95 }
  ],
  stage2: [
    { name: "Sandman (Flint Marko)", title: "Molecular Sand Shifter", color: 0xd97706, size: 1.5, hp: 110 },
    { name: "Electro (Max Dillon)", title: "Living Electrical Capacitor", color: 0x38bdf8, size: 1.2, hp: 100 },
    { name: "Mysterio (Quentin Beck)", title: "Master of Illusions", color: 0x10b981, size: 1.2, hp: 95 },
    { name: "The Lizard (Dr. Curt Connors)", title: "Reptilian Mutant", color: 0x15803d, size: 1.4, hp: 110 },
    { name: "Hydro-Man (Morris Bench)", title: "Liquid Water Giant", color: 0x0284c7, size: 1.4, hp: 105 },
    { name: "Morbius (Dr. Michael Morbius)", title: "Living Vampire", color: 0x881337, size: 1.2, hp: 100 }
  ],
  stage3: [
    { name: "Kraven the Hunter (Sergei Kravinoff)", title: "Apex Predator", color: 0xb45309, size: 1.3, hp: 115 },
    { name: "The Vulture (Adrian Toomes)", title: "Magnetic Flying Raptor", color: 0x166534, size: 1.3, hp: 110 },
    { name: "The Rhino (Aleksei Sytsevich)", title: "Impenetrable Brute", color: 0x475569, size: 1.6, hp: 130 },
    { name: "The Scorpion (Mac Gargan)", title: "Mechanical Stinger Assassin", color: 0x22c55e, size: 1.3, hp: 115 },
    { name: "Black Cat (Felicia Hardy)", title: "Master Thief & Bad Luck", color: 0x1e1b4b, size: 1.1, hp: 90 },
    { name: "Venom (Eddie Brock)", title: "Lethal Symbiote Protector", color: 0x09090b, size: 1.6, hp: 140 },
    { name: "Carnage (Cletus Kasady)", title: "Symbiote Blade Killer", color: 0x991b1b, size: 1.4, hp: 135 }
  ],
  stage4: [
    { name: "Doctor Octopus (Dr. Otto Octavius)", title: "Tentacled Genius", color: 0x065f46, size: 1.3, hp: 140 },
    { name: "Hobgoblin", title: "Demonic Glider Terror", color: 0xf97316, size: 1.3, hp: 120 },
    { name: "Beetle (Abner Jenkins)", title: "High-Tech Powered Armor", color: 0x7c3aed, size: 1.2, hp: 110 },
    { name: "Prowler (Aaron Davis)", title: "Stealth Gauntlet Infiltrator", color: 0x581c87, size: 1.2, hp: 110 },
    { name: "The Tinkerer (Phineas Mason)", title: "Weapons Engineering Rogue", color: 0x78716c, size: 1.1, hp: 100 },
    { name: "Jack O'Lantern", title: "Flaming Pumpkin Spectre", color: 0xea580c, size: 1.2, hp: 110 },
    { name: "Spot (Dr. Jonathan Ohnn)", title: "Dimensional Portal Shifter", color: 0xf8fafc, size: 1.2, hp: 115 },
    { name: "Morlun", title: "Ancient Totem Devourer", color: 0x450a0a, size: 1.3, hp: 130 },
    { name: "Alistair Smythe", title: "Spider-Slayer Architect", color: 0x334155, size: 1.5, hp: 125 }
  ],
  stage5: [
    { name: "Green Goblin (Norman Osborn)", title: "Ultimate Nemesis & Goblin Formula Tyrant", color: 0x16a34a, size: 1.5, hp: 200, isFinalGoblin: true }
  ]
};

function initEngine() {
  const canvas = document.getElementById('three-canvas');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0f1d);
  scene.fog = new THREE.FogExp2(0x0a0f1d, 0.007);

  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 6, 12);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Manhattan Lighting: Sunset / Twilight with neon skyline reflections
  const ambient = new THREE.AmbientLight(0xfef08a, 0.6);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xf97316, 1.4);
  sun.position.set(50, 100, 30);
  sun.castShadow = true;
  scene.add(sun);

  const blueFill = new THREE.DirectionalLight(0x38bdf8, 0.7);
  blueFill.position.set(-50, 40, -40);
  scene.add(blueFill);

  // Build 3D Realistic Spider-Man Mesh
  spideyGroup = createRealisticSpidermanMesh('red');
  scene.add(spideyGroup);

  // Dynamic 3D Web-Line
  const webMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3, transparent: true, opacity: 0 });
  const webGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  webLine = new THREE.Line(webGeo, webMat);
  scene.add(webLine);

  // Build Modular Manhattan: Skyscrapers, Roads, Elevated Subway
  buildManhattanWorld();

  // Populate Traffic: Cars, Cabs, Police Cars, Subway Trains
  spawnCityTraffic();

  // Initialize Stage 1
  loadStage(1);

  // Setup Event Listeners
  setupKeyListeners();

  clock = new THREE.Clock();
  requestAnimationFrame(animate);
}

/* ─── REALISTIC 3D HERO MESH: SPIDER-MAN (RED & BLACK SUITS) ─── */
function createRealisticSpidermanMesh(mode = 'red') {
  const g = new THREE.Group();
  spideyMeshParts = {};

  const isBlack = (mode === 'black');
  
  // High quality PBR materials
  const suitColor = isBlack ? 0x111115 : 0xd90429;
  const secondaryColor = isBlack ? 0x050508 : 0x003f91;
  const spiderSymbolColor = isBlack ? 0xffffff : 0x111827;
  const eyeColor = 0xffffff;

  const suitMat = new THREE.MeshStandardMaterial({
    color: suitColor,
    roughness: isBlack ? 0.25 : 0.45,
    metalness: isBlack ? 0.4 : 0.1
  });
  const secMat = new THREE.MeshStandardMaterial({
    color: secondaryColor,
    roughness: 0.4,
    metalness: 0.15
  });
  const spiderMat = new THREE.MeshBasicMaterial({ color: spiderSymbolColor });
  const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
  const fingerMat = new THREE.MeshStandardMaterial({ color: suitColor, roughness: 0.3 });

  // 1. Muscular Chest / Torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.42, 1.25, 12), suitMat);
  torso.position.y = 1.2;
  torso.castShadow = true;
  g.add(torso);
  spideyMeshParts.torso = torso;

  // Blue / Black Side Flanks
  const flanks = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.95, 0.4), secMat);
  flanks.position.y = 1.15;
  g.add(flanks);
  spideyMeshParts.flanks = flanks;

  // Spider Emblem on Chest
  const chestSpider = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.3, 4), spiderMat);
  chestSpider.position.set(0, 1.35, 0.32);
  chestSpider.rotation.x = Math.PI / 2;
  g.add(chestSpider);
  spideyMeshParts.chestSpider = chestSpider;

  // 2. Sculpted Hero Mask / Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), suitMat);
  head.position.y = 2.05;
  head.scale.set(0.95, 1.15, 1.0);
  head.castShadow = true;
  g.add(head);
  spideyMeshParts.head = head;

  // Iconic Angled White Spidey Lenses
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.08), eyeMat);
    eye.position.set(side * 0.15, 2.08, 0.34);
    eye.rotation.z = side * -0.25;
    g.add(eye);

    // Black eyeliner rim
    const eyeRim = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.06), spiderMat);
    eyeRim.position.set(side * 0.15, 2.08, 0.32);
    eyeRim.rotation.z = side * -0.25;
    g.add(eyeRim);
  }

  // 3. Athletic Arms & Hands with Defined Fingers
  const leftArm = createDetailedArm(-1, suitMat, secMat, fingerMat);
  leftArm.position.set(-0.65, 1.5, 0);
  g.add(leftArm);
  spideyMeshParts.leftArm = leftArm;

  const rightArm = createDetailedArm(1, suitMat, secMat, fingerMat);
  rightArm.position.set(0.65, 1.5, 0);
  g.add(rightArm);
  spideyMeshParts.rightArm = rightArm;

  // 4. Athletic Legs & Boots
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    // Thigh
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.7, 8), secMat);
    thigh.position.y = -0.35;
    leg.add(thigh);
    // Boot (Red/Black)
    const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.65, 8), suitMat);
    boot.position.y = -0.9;
    leg.add(boot);

    leg.position.set(side * 0.26, 0.7, 0);
    g.add(leg);
    if (side === -1) spideyMeshParts.leftLeg = leg;
    else spideyMeshParts.rightLeg = leg;
  }

  // Symbiote Aura (Glow for Black suit)
  const auraMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: isBlack ? 0.25 : 0 });
  const aura = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 12), auraMat);
  aura.position.y = 1.2;
  g.add(aura);
  spideyMeshParts.aura = aura;

  return g;
}

function createDetailedArm(side, suitMat, secMat, fingerMat) {
  const arm = new THREE.Group();

  // Shoulder & Bicep
  const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.55, 8), suitMat);
  bicep.position.y = -0.28;
  arm.add(bicep);

  // Forearm & Web Shooter Gauntlet
  const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.10, 0.5, 8), suitMat);
  forearm.position.y = -0.7;
  arm.add(forearm);

  // Hand Palm
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.08), suitMat);
  palm.position.y = -1.0;
  arm.add(palm);

  // Individual Fingers (Used for wall-climb visual fidelity)
  for (let f = -2; f <= 2; f++) {
    const finger = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.03), fingerMat);
    finger.position.set(f * 0.035, -1.1, 0);
    arm.add(finger);
  }

  return arm;
}

/* ─── SUIT MODE SWITCH (RED vs BLACK SUIT) ─── */
function toggleSuitMode() {
  currentSuitMode = (currentSuitMode === 'red') ? 'black' : 'red';

  const isBlack = (currentSuitMode === 'black');
  const suitColor = isBlack ? 0x111115 : 0xd90429;
  const secColor = isBlack ? 0x08080c : 0x003f91;
  const spiderColor = isBlack ? 0xffffff : 0x111827;

  if (spideyMeshParts.torso) spideyMeshParts.torso.material.color.setHex(suitColor);
  if (spideyMeshParts.head) spideyMeshParts.head.material.color.setHex(suitColor);
  if (spideyMeshParts.flanks) spideyMeshParts.flanks.material.color.setHex(secColor);
  if (spideyMeshParts.chestSpider) spideyMeshParts.chestSpider.material.color.setHex(spiderColor);
  if (spideyMeshParts.aura) spideyMeshParts.aura.material.opacity = isBlack ? 0.35 : 0;

  const modeBadge = document.getElementById('hud-suit-mode');
  const modeBtn = document.getElementById('btn-suit-mode');
  const radarPlayer = document.getElementById('radar-player-dot');

  if (isBlack) {
    playSynthSound('symbioteRage');
    modeBadge.textContent = '🖤 SYMBIOTE BLACK';
    modeBadge.className = 'real-telem-val purple';
    modeBtn.textContent = '🔴 SWITCH TO CLASSIC RED';
    modeBtn.style.borderColor = '#ef4444';
    modeBtn.style.color = '#f87171';
    if (radarPlayer) radarPlayer.style.background = '#c084fc';
    showDialogue('Spider-Man (Black Suit)', '"The Symbiote gives me limitless power! Web-nets and strikes hit with triple force!"', '🖤');
  } else {
    playSynthSound('thwip');
    modeBadge.textContent = '🔴 CLASSIC RED';
    modeBadge.className = 'real-telem-val red';
    modeBtn.textContent = '⚡ SWITCH TO BLACK SUIT';
    modeBtn.style.borderColor = '#a855f7';
    modeBtn.style.color = '#c084fc';
    if (radarPlayer) radarPlayer.style.background = '#ff007f';
    showDialogue('Spider-Man', '"Back to classic red & blue! Agility, precision web-slinging and Spider-Sense!"', '🕷️');
  }
}

/* ─── MODULAR MANHATTAN WITH ELEVATED SUBWAY & ROADS ─── */
function buildManhattanWorld() {
  for (let i = 0; i < TOTAL_CHUNKS; i++) {
    const chunk = createManhattanChunk();
    chunk.position.z = -i * CHUNK_SIZE;
    scene.add(chunk);
    manhattanChunks.push(chunk);
  }
}

function createManhattanChunk() {
  const chunk = new THREE.Group();

  // Asphalt Main Avenue
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x171923, roughness: 0.8 });
  const road = new THREE.Mesh(new THREE.BoxGeometry(40, 1.5, CHUNK_SIZE), roadMat);
  road.position.y = -8;
  chunk.add(road);

  // Sidewalks
  const walkMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
  for (const s of [-1, 1]) {
    const walk = new THREE.Mesh(new THREE.BoxGeometry(6, 1.7, CHUNK_SIZE), walkMat);
    walk.position.set(s * 20, -7.9, 0);
    chunk.add(walk);
  }

  // Elevated Subway Train Rails (Parallel Track at x = 15, y = 1.0)
  const trackMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
  const trackPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 10, 8), trackMat);
  trackPillar.position.set(15, -3, 0);
  chunk.add(trackPillar);

  const rails = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.5, CHUNK_SIZE), trackMat);
  rails.position.set(15, 1.8, 0);
  chunk.add(rails);

  // Glass & Steel Skyscraper Blocks (Left and Right Walls for Climbing)
  const buildingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.85 });
  const windowGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  for (let z = -CHUNK_SIZE / 2 + 15; z < CHUNK_SIZE / 2; z += 35) {
    for (const side of [-1, 1]) {
      const bH = 50 + Math.random() * 40;
      const bW = 20 + Math.random() * 8;
      const bD = 24;

      const tower = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), buildingMat);
      tower.position.set(side * (24 + bW / 2), bH / 2 - 8, z);
      tower.castShadow = true;
      chunk.add(tower);

      // Window illumination grids
      const win = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 30), windowGlowMat);
      win.position.set(side * (24 + 0.1), bH / 2 - 8, z);
      win.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      chunk.add(win);
    }
  }

  return chunk;
}

/* ─── REAL-WORLD TRAFFIC: CARS, CABS, POLICE & TRAINS ─── */
function spawnCityTraffic() {
  // Spawn Moving Cars (Taxis, Sedans, Police Cruisers)
  for (let i = 0; i < 6; i++) {
    const isPolice = (i % 3 === 0);
    const car = createCarMesh(isPolice);
    car.position.set((i % 2 === 0 ? -6 : 6), -7.0, -30 - i * 35);
    car.speed = 0.35 + Math.random() * 0.2;
    car.isPolice = isPolice;
    scene.add(car);
    cityCars.push(car);
    if (isPolice) activePoliceCars.push(car);
  }

  // Spawn Elevated Subway Train (Spidey can land and run on top)
  const train = createSubwayTrainMesh();
  train.position.set(15, 3.2, -60);
  train.speed = 0.55;
  scene.add(train);
  subwayTrains.push(train);
}

function createCarMesh(isPolice = false) {
  const car = new THREE.Group();
  const color = isPolice ? 0x0f172a : (Math.random() > 0.5 ? 0xfacc15 : 0xef4444); // Yellow cab or red sedan
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.4 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1 });

  // Chassis
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 4.8), bodyMat);
  body.position.y = 0.6;
  body.castShadow = true;
  car.add(body);

  // Roof / Cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.85, 2.6), glassMat);
  cabin.position.set(0, 1.45, -0.2);
  car.add(cabin);

  // Police Siren Light Bar
  if (isPolice) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 0.4), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    bar.position.set(0, 1.95, -0.2);
    car.add(bar);
    car.sirenBar = bar;
  }

  car.isCar = true;
  car.hitRadius = 2.4;
  return car;
}

function createSubwayTrainMesh() {
  const train = new THREE.Group();
  const silverMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });
  const blueStripe = new THREE.MeshBasicMaterial({ color: 0x0284c7 });

  // Long Subway Car Body (18m long)
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.6, 22), silverMat);
  body.position.y = 1.3;
  body.castShadow = true;
  train.add(body);

  // Roof Platform for Spider-Man Running
  const roof = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.2, 21.6), new THREE.MeshStandardMaterial({ color: 0x334155 }));
  roof.position.y = 2.7;
  train.add(roof);

  train.isTrain = true;
  train.hitRadius = 4.0;
  return train;
}

/* ─── STAGE PROGRESSION: ALL 30 STAGES ─── */
function startStageTimer() {
  if (stageTimerInterval) clearInterval(stageTimerInterval);
  stageTimeLeft = 50;
  updateTimerUI();
  stageTimerInterval = setInterval(() => {
    if (!isPlaying) return;
    stageTimeLeft--;
    updateTimerUI();
    if (stageTimeLeft <= 0) {
      clearInterval(stageTimerInterval);
      stageTimerInterval = null;
      // Time's up — auto-advance if thieves captured, else show defeat
      if (thievesCaptured >= totalThievesNeeded) {
        showStageResult(true);
      } else {
        // Partial credit — still advance but with warning
        showDialogue('Spider-Man', '"Time\'s up! Moving to next district!"', '⏰');
        setTimeout(() => showStageResult(true), 2000);
      }
    }
  }, 1000);
}

function updateTimerUI() {
  const el = document.getElementById('stage-timer');
  if (!el) return;
  el.textContent = stageTimeLeft;
  el.className = stageTimeLeft <= 10 ? 'urgent' : '';
}

function showStageResult(won) {
  if (stageTimerInterval) { clearInterval(stageTimerInterval); stageTimerInterval = null; }
  const modal = document.getElementById('result-modal');
  const icon  = document.getElementById('result-icon');
  const title = document.getElementById('result-title');
  const sub   = document.getElementById('result-sub');
  if (!modal) return;
  if (won) {
    icon.textContent  = currentStage >= 30 ? '🏆' : '✅';
    title.textContent = currentStage >= 30 ? '🌟 NEW YORK SAVED!' : `STAGE ${currentStage} CLEARED!`;
    sub.textContent   = currentStage >= 30
      ? 'Spider-Man defeated all 30 stages and Green Goblin! New York is safe!'
      : `${ALL_30_STAGES[currentStage-1].theme}`;
  } else {
    icon.textContent  = '💀';
    title.textContent = 'STAGE FAILED!';
    sub.textContent   = 'Time ran out before all thieves were netted. Try again!';
  }
  modal.style.display = 'flex';
}

function loadStage(stageNum) {
  currentStage = Math.max(1, Math.min(30, stageNum));
  thievesCaptured = 0;
  totalThievesNeeded = Math.min(3 + Math.floor(currentStage / 5), 8);
  mjSaved = false;
  bossHealth = 100;

  // Clear existing entities
  activeBosses.forEach(b => scene.remove(b));
  activeBosses.length = 0;
  activeThieves.forEach(t => scene.remove(t));
  activeThieves.length = 0;
  if (maryJaneTarget) { scene.remove(maryJaneTarget); maryJaneTarget = null; }

  const stageData = ALL_30_STAGES[currentStage - 1];

  // Update HUD (new IDs)
  const hudStage   = document.getElementById('hud-stage');
  const hudThieves = document.getElementById('hud-thieves');
  const hudMj      = document.getElementById('hud-mj');
  const bossBar    = document.getElementById('boss-bar');
  const bossName   = document.getElementById('boss-name');
  if (hudStage)   hudStage.textContent   = `${currentStage}/30`;
  if (hudThieves) hudThieves.textContent = `0/${totalThievesNeeded}`;
  if (hudMj)      hudMj.textContent      = 'SAFE';
  if (bossBar)    bossBar.style.display  = 'block';
  if (bossName)   bossName.textContent   = `⚔️ ${stageData.boss.toUpperCase()}`;

  // Show stage banner for 2.5 seconds
  const banner = document.getElementById('stage-banner');
  if (banner) {
    document.getElementById('stage-banner-num').textContent    = `STAGE ${currentStage} / 30`;
    document.getElementById('stage-banner-title').textContent  = stageData.name;
    document.getElementById('stage-banner-villain').textContent= `⚔️ Boss: ${stageData.boss}`;
    document.getElementById('stage-banner-tip').textContent    = stageData.theme;
    banner.style.display = 'block';
    setTimeout(() => { banner.style.display = 'none'; }, 2500);
  }

  // Spawn thieves
  for (let i = 0; i < totalThievesNeeded; i++) {
    const thief = createThiefMesh(i);
    thief.position.set((Math.random() - 0.5) * 14, -6.5, -35 - i * 28);
    scene.add(thief);
    activeThieves.push(thief);
  }

  // MJ appears on every 5th stage
  const mjStages = [5, 10, 15, 20, 25, 30];
  if (mjStages.includes(currentStage)) {
    maryJaneTarget = createMaryJaneMesh();
    maryJaneTarget.position.set(15, 6.0, -100);
    scene.add(maryJaneTarget);
    const btnMj = document.getElementById('btn-mj');
    if (btnMj) btnMj.style.display = 'inline-flex';
    if (hudMj) hudMj.textContent = 'TRAPPED! 🚨';
    showDialogue('Mary Jane', '"Peter! Help me! The villains have me trapped!"', '❤️');
  } else {
    const btnMj = document.getElementById('btn-mj');
    if (btnMj) btnMj.style.display = 'none';
  }

  // Spawn this stage's boss using stageData
  const bossEntity = createBossMesh(stageData);
  bossEntity.position.set(0, 6.0, -28);
  bossEntity.villainData = stageData;
  bossEntity.hp = stageData.hp;
  bossEntity.maxHp = stageData.hp;
  scene.add(bossEntity);
  activeBosses.push(bossEntity);

  // Extra villains from 5-group roster for variety
  const group = ['stage1','stage2','stage3','stage4','stage5'][Math.floor((currentStage-1)/6) % 5];
  const extras = (VILLAIN_ROSTER[group] || []).slice(0, Math.floor(currentStage/8));
  extras.forEach((v, idx) => {
    const e = createBossMesh(v);
    e.position.set((idx%2===0?-8:8), 5, -60 - idx*25);
    e.villainData = v; e.hp = v.hp; e.maxHp = v.hp;
    scene.add(e);
    activeBosses.push(e);
  });

  updateBossHud();
  showDialogue('Spider-Man', `"Stage ${currentStage}: ${stageData.name}! Boss: ${stageData.boss}!"`, '🕷️');

  // Start 50-second stage timer
  startStageTimer();
}

function spawnBosses(roster) {
  roster.forEach((vData, index) => {
    const boss = createBossMesh(vData);
    // Position lead boss right in front of Spider-Man at z = -24 to be immediately visible!
    const zOffset = -24 - index * 26;
    const xOffset = (index === 0) ? 0 : (index % 2 === 1 ? -6 : 6);
    boss.position.set(xOffset, 6.0, zOffset);
    boss.villainData = vData;
    boss.hp = vData.hp;
    boss.maxHp = vData.hp;
    scene.add(boss);
    activeBosses.push(boss);
  });
}

function createBillboardNameTag(text, color = '#ffd60a') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
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
  sprite.scale.set(6, 1.5, 1);
  return sprite;
}

function createBossMesh(vData) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: vData.color,
    emissive: vData.color,
    emissiveIntensity: 0.35,
    metalness: 0.7,
    roughness: 0.2
  });

  // Main villain body
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.2 * vData.size, 1.8 * vData.size, 0.9 * vData.size), mat);
  body.position.y = 1.0;
  body.castShadow = true;
  g.add(body);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.48 * vData.size, 14, 14), mat);
  head.position.y = 2.2 * vData.size;
  head.castShadow = true;
  g.add(head);

  // Glowing Overhead Nametag Billboard (100% visible to player)
  const tag = createBillboardNameTag(`⚔️ ${vData.name.toUpperCase()}`);
  tag.position.set(0, 3.8 * vData.size, 0);
  g.add(tag);

  // Unique villain features:
  if (vData.isFinalGoblin) {
    // Green Goblin Glider
    const glider = new THREE.Mesh(new THREE.ConeGeometry(3.6, 0.6, 4), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 }));
    glider.rotation.x = Math.PI / 2;
    g.add(glider);
    // Pumpkin Bomb
    const bomb = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
    bomb.position.set(0.7, 1.4, 0.5);
    g.add(bomb);
  } else if (vData.name.includes("Doctor Octopus")) {
    // 4 Mechanical Tentacles
    for (let t = 0; t < 4; t++) {
      const tentacle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.2, 6), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 }));
      tentacle.position.set((t % 2 === 0 ? -1.2 : 1.2), 1.4, -0.4);
      tentacle.rotation.z = (t < 2 ? 0.8 : -0.8);
      g.add(tentacle);
    }
  } else if (vData.name.includes("Venom")) {
    // Giant white venom eyes
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.15), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    eye.position.set(0, 2.2, 0.45);
    g.add(eye);
  }

  // Villain Point Light so they glow in the city!
  const vLight = new THREE.PointLight(vData.color, 1.2, 18);
  vLight.position.set(0, 2.0, 0);
  g.add(vLight);

  g.isBoss = true;
  g.hitRadius = 2.8 * vData.size;
  return g;
}

function createThiefMesh(id) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x1e293b }); // Black burglar outfit
  const moneyBagMat = new THREE.MeshStandardMaterial({ color: 0x15803d });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.4), mat);
  body.position.y = 0.6;
  g.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfde047 }));
  head.position.y = 1.4;
  g.add(head);

  // Stolen Cash Bag
  const bag = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), moneyBagMat);
  bag.position.set(0.45, 0.7, 0.2);
  g.add(bag);

  g.isThief = true;
  g.isCaptured = false;
  g.thiefId = `thief_${Date.now()}_${id}`;
  g.hitRadius = 2.2;
  return g;
}

function createMaryJaneMesh() {
  const g = new THREE.Group();
  const dressMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.4 }); // Red/Pink dress
  const hairMat = new THREE.MeshStandardMaterial({ color: 0xea580c }); // Redhead Mary Jane hair

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 1.2, 8), dressMat);
  body.position.y = 0.7;
  g.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), new THREE.MeshBasicMaterial({ color: 0xfcd34d }));
  head.position.y = 1.5;
  g.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 10), hairMat);
  hair.position.set(0, 1.55, -0.1);
  g.add(hair);

  g.isMaryJane = true;
  return g;
}

/* ─── SHOOT WEB-NET (CAPTURE THIEVES & ASSIST POLICE) ─── */
function shootWebNet() {
  playSynthSound('thwip');

  // Spawn Expanding 3D Web-Net Projectile
  const netMat = new THREE.MeshBasicMaterial({
    color: currentSuitMode === 'black' ? 0xa855f7 : 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.85
  });
  const net = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 12), netMat);
  net.position.copy(spideyGroup.position);
  net.position.y += 0.8;
  net.velocity = new THREE.Vector3(0, -0.05, -1.8);
  scene.add(net);
  webNetsInFlight.push(net);

  showDialogue('Spider-Man', '"Web-Net deployed! Wrap up that thief for the police!"', '🕸️');
}

/* ─── WALL-CLIMBING & FINGER WALL-RUNNING MECHANICS ─── */
function toggleWallClimb() {
  isWallClimbing = !isWallClimbing;

  if (isWallClimbing) {
    playSynthSound('zip');
    wallRunningSide = (spideyX >= 0) ? 1 : -1;
    targetX = wallRunningSide * 18;
    spideyVelY = 0;
    const suitEl = document.getElementById('hud-suit');
    if (suitEl) suitEl.textContent = '🧗 CLIMBING';
    showDialogue('Spider-Man', '"Micro-finger grip engaged! Running up the wall!"', '🧗');
  } else {
    isWallClimbing = false;
    spideyVelY = 0.2;
    const suitEl = document.getElementById('hud-suit');
    if (suitEl) suitEl.textContent = currentSuitMode === 'black' ? '🖤 BLACK' : '🔴 RED';
  }
}

/* ─── SAVE MARY JANE ACTION ─── */
function saveMaryJaneAction() {
  if (!maryJaneTarget || mjSaved) return;
  const dist = spideyGroup.position.distanceTo(maryJaneTarget.position);
  if (dist < 12) {
    mjSaved = true;
    playSynthSound('victory');
    const hudMj = document.getElementById('hud-mj');
    if (hudMj) { hudMj.textContent = 'RESCUED! ❤️'; hudMj.className = 'hud-pill-value green'; }
    const btnMj = document.getElementById('btn-mj');
    if (btnMj) btnMj.style.display = 'none';
    showDialogue('Mary Jane', '"You saved me, Spider-Man! I always believed in you!"', '❤️');
    damageActiveBoss(40);
  } else {
    showDialogue('Spider-Man', '"I need to get closer to Mary Jane on that rooftop!"', '🕷️');
  }
}

/* ─── WEB-SWING & SLINGSHOT ─── */
function triggerWebSwing(active) {
  if (isWallClimbing) isWallClimbing = false;
  isSwinging = active;
  if (active) {
    playSynthSound('thwip');
    webAnchor.set(spideyX > 0 ? 16 : -16, 25, -20);
    swingAngle = -Math.PI / 3;
  } else {
    spideyVelY = 0.32;
  }
}

function triggerWebZip() {
  playSynthSound('zip');
  spideyVelY = 0.18;
  targetSwingSpeed = 1.5;
  showDialogue('Spider-Man', '"Web-Zip forward! Maximum city velocity!"', '⚡');
}

/* ─── KEY LISTENERS ─── */
function setupKeyListeners() {
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' && isPlaying) triggerWebZip();
    if (e.key === 'q' || e.key === 'Q') triggerWebSwing(true);
    if (e.key === 'e' || e.key === 'E') shootWebNet();
    if (e.key === 'c' || e.key === 'C') toggleSuitMode();
    if (e.key === 'w' || e.key === 'W') toggleWallClimb();
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') targetX = Math.max(-16, targetX - 4.0);
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') targetX = Math.min(16, targetX + 4.0);
  });

  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    if (e.key === 'q' || e.key === 'Q') triggerWebSwing(false);
  });

  window.addEventListener('mousedown', (e) => {
    if (isPlaying && e.button === 0) triggerWebSwing(true);
  });
  window.addEventListener('mouseup', (e) => {
    if (isPlaying && e.button === 0) triggerWebSwing(false);
  });

  // Native Touch Drag Steering & Gestures for Mobile
  let touchStartX = 0, touchStartY = 0, lastTouchX = 0;
  window.addEventListener('touchstart', (e) => {
    if (!isPlaying || e.touches.length === 0) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    lastTouchX = touchStartX;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isPlaying || e.touches.length === 0) return;
    const currentX = e.touches[0].clientX;
    const dx = currentX - lastTouchX;
    const sensitivity = (window.innerWidth < 650) ? 0.08 : 0.05;
    targetX = Math.max(-16, Math.min(16, targetX + dx * sensitivity));
    lastTouchX = currentX;
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (!isPlaying) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const dy = touch.clientY - touchStartY;
    const dx = touch.clientX - touchStartX;
    if (dy < -40 && Math.abs(dy) > Math.abs(dx)) {
      triggerWebZip(); // Swipe up = Zip
    } else if (Math.abs(dx) < 15 && Math.abs(dy) < 15) {
      shootWebNet(); // Tap = Web Net
    }
  }, { passive: true });

  // Hook into Universal Touch Controller for Action Buttons
  if (window.arcadeTouchController) {
    window.arcadeTouchController.callbacks.steer = (dx, dy) => {
      const factor = (window.innerWidth < 650) ? 0.08 : 0.05;
      targetX = Math.max(-16, Math.min(16, targetX + dx * factor));
    };
    window.arcadeTouchController.callbacks.jump = () => {
      if (isPlaying) triggerWebZip();
    };
    window.arcadeTouchController.callbacks.swing = () => {
      if (isPlaying) {
        triggerWebSwing(true);
        setTimeout(() => triggerWebSwing(false), 500);
      }
    };
    window.arcadeTouchController.callbacks.action1 = () => {
      if (isPlaying) shootWebNet();
    };
    window.arcadeTouchController.createMobileActionCluster({
      primary: { icon: '🕸️', color: '#10b981', action: () => shootWebNet() },
      secondary: { icon: '⚡', color: '#38bdf8', action: () => triggerWebZip() }
    });
  }

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('orientationchange', onWindowResize);
}

/* ─── PROCEDURAL AUDIO SYNTHESIZER ─── */
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

    if (type === 'thwip') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.14);
      osc.start(now); osc.stop(now + 0.14);
    } else if (type === 'zip') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.22);
      osc.start(now); osc.stop(now + 0.22);
    } else if (type === 'siren') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.linearRampToValueAtTime(900, now + 0.25);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'symbioteRage') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.35);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
    } else if (type === 'victory') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.4);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
    }
  } catch (e) {}
}

/* ─── BACKEND SYNC HELPER ─── */
function sendBackendGameAction(actionType, payload) {
  try {
    fetch('/api/game/spiderman/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: actionType, payload })
    }).catch(() => {});
  } catch (e) {}
}

/* ─── MAIN SIMULATION LOOP ─── */
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  if (isPlaying) {
    // 1. Mobility Speed Calculation
    targetSwingSpeed = isSwinging ? 1.35 : (isWallClimbing ? 0.95 : 0.65);
    swingSpeed += (targetSwingSpeed - swingSpeed) * Math.min(1.0, 5.0 * delta);

    const speedMPH = Math.round(swingSpeed * 68);
    const speedElem = document.getElementById('hud-swing-speed');
    if (speedElem) speedElem.textContent = speedMPH;
    const needle = document.getElementById('speedo-needle');
    if (needle) {
      const angle = -120 + Math.min(1, speedMPH / 100) * 240;
      needle.style.transform = `rotate(${angle}deg)`;
    }

    const forwardStep = swingSpeed * delta * 65;

    // 2. Stream Manhattan World Chunks
    for (let i = 0; i < manhattanChunks.length; i++) {
      const chunk = manhattanChunks[i];
      chunk.position.z += forwardStep;
      if (chunk.position.z > CHUNK_SIZE) {
        chunk.position.z -= TOTAL_CHUNKS * CHUNK_SIZE;
      }
    }

    // 3. Wall-Climbing vs Pendulum Web-Swing Physics
    if (isWallClimbing) {
      // Finger Wall-Climbing & Vertical Running
      spideyY += 4.5 * delta;
      if (spideyY > 32) spideyY = 6; // Loop height along skyscrapers
      spideyGroup.position.set(wallRunningSide * 17.5, spideyY, 0);
      spideyGroup.rotation.x = Math.PI / 2; // Sticking to wall horizontally
      spideyGroup.rotation.y = wallRunningSide > 0 ? -Math.PI / 2 : Math.PI / 2;
      webLine.material.opacity = 0;
    } else if (isSwinging) {
      // Pendulum Web-Swinging Arc
      swingAngle += 0.065;
      spideyY = 7 + Math.cos(swingAngle) * 4.2;
      spideyGroup.rotation.x = Math.sin(swingAngle) * 0.5;
      spideyGroup.rotation.y = 0;
      spideyGroup.rotation.z = (spideyX - webAnchor.x) * 0.07;

      const points = [
        new THREE.Vector3(spideyGroup.position.x, spideyGroup.position.y + 1.2, spideyGroup.position.z),
        webAnchor
      ];
      webLine.geometry.setFromPoints(points);
      webLine.material.opacity = 0.95;
    } else {
      // Free flight or running on rooftops/trains
      spideyVelY -= 0.016;
      spideyY = Math.max(-5.5, spideyY + spideyVelY);
      spideyGroup.rotation.x *= 0.9;
      spideyGroup.rotation.y *= 0.9;
      spideyGroup.rotation.z *= 0.9;
      webLine.material.opacity = 0;
    }

    // Lateral Steering
    if (!isWallClimbing) {
      spideyX += (targetX - spideyX) * Math.min(1.0, 9.0 * delta);
      spideyGroup.position.set(spideyX, spideyY, 0);
    }

    // 4. Update Traffic (Cars & Subway Trains) + Running Over Tops
    let onVehicleRoof = false;
    cityCars.forEach(car => {
      car.position.z += (car.speed + swingSpeed) * 0.5;
      if (car.position.z > 30) car.position.z = -160 - Math.random() * 40;

      // Check if Spidey lands on car roof
      const dx = Math.abs(spideyGroup.position.x - car.position.x);
      const dz = Math.abs(spideyGroup.position.z - car.position.z);
      if (dx < 1.6 && dz < 2.5 && spideyY <= -5.0 && spideyY >= -6.5) {
        spideyY = -5.0; // Running right on the car roof!
        spideyVelY = 0;
        onVehicleRoof = true;
        document.getElementById('hud-swing-mode').textContent = 'RUNNING ON CAR ROOF 🚕';
      }
    });

    subwayTrains.forEach(train => {
      train.position.z += (train.speed + swingSpeed) * 0.5;
      if (train.position.z > 40) train.position.z = -220;

      // Check if Spidey lands on Subway Train roof
      const dx = Math.abs(spideyGroup.position.x - train.position.x);
      const dz = Math.abs(spideyGroup.position.z - train.position.z);
      if (dx < 2.2 && dz < 11.0 && spideyY <= 5.8 && spideyY >= 4.0) {
        spideyY = 5.8; // Running on elevated subway train!
        spideyVelY = 0;
        onVehicleRoof = true;
        document.getElementById('hud-swing-mode').textContent = 'RUNNING ON SUBWAY TRAIN 🚆';
      }
    });

    // 5. Update Web-Nets in Flight & Check Thief Capture
    for (let i = webNetsInFlight.length - 1; i >= 0; i--) {
      const net = webNetsInFlight[i];
      net.position.add(net.velocity);
      net.scale.multiplyScalar(1.04); // Web-Net expands as it flies!

      // Check collision with running thieves
      activeThieves.forEach(thief => {
        if (!thief.isCaptured && net.position.distanceTo(thief.position) < 3.2) {
          thief.isCaptured = true;
          thief.material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
          thievesCaptured++;
          playSynthSound('siren');

          const htEl = document.getElementById('hud-thieves');
          if (htEl) htEl.textContent = `${thievesCaptured}/${totalThievesNeeded}`;
          showDialogue('NYPD Police Dispatch', '"Spider-Man webbed a thief! Officer unit en route for arrest!"', '🚓');

          // Police Cruiser sirens flash
          activePoliceCars.forEach(p => {
            if (p.sirenBar) p.sirenBar.material.color.setHex(Math.random() > 0.5 ? 0xef4444 : 0x38bdf8);
          });

          sendBackendGameAction('capture', { thiefId: thief.thiefId });

          // If all thieves captured, unlock next boss phase or next stage
          if (thievesCaptured >= totalThievesNeeded) {
            damageActiveBoss(35);
          }
        }
      });

      // Remove expired nets
      if (net.position.z < -140 || net.position.y < -8) {
        scene.remove(net);
        webNetsInFlight.splice(i, 1);
      }
    }

    // 6. Update Active Bosses
    activeBosses.forEach(boss => {
      boss.position.z += forwardStep * 0.7;

      // Boss floats and shoots attacks
      if (boss.position.z > 15) boss.position.z = -120 - Math.random() * 30;

      // Spidey-Sense Hazard Check
      const dist = boss.position.distanceTo(spideyGroup.position);
      if (dist < 18) {
        const flasher = document.getElementById('hazard-flasher');
        const fText = document.getElementById('hazard-text');
        const sStatus = document.getElementById('hud-spidey-status');
        if (flasher) {
          flasher.style.display = 'flex';
          fText.textContent = `⚡ SPIDEY-SENSE: ${boss.villainData.name} ATTACKING!`;
          sStatus.textContent = 'DANGER! 🔴';
          sStatus.className = 'real-telem-val red';
        }
      }

      // Hit boss with Web-Net or Melee Slingshot
      if (dist < 4.0) {
        damageActiveBoss(currentSuitMode === 'black' ? 25 : 15);
        boss.position.z = -100;
      }
    });

    // 7. Radar Update
    updateSpideyRadar();
  }

  // Camera Tracking
  updateCamera(delta);
  renderer.render(scene, camera);
}

function damageActiveBoss(amount) {
  bossHealth = Math.max(0, bossHealth - amount);
  playSynthSound(currentSuitMode === 'black' ? 'symbioteRage' : 'zip');
  updateBossHud();

  if (bossHealth <= 0) {
    playSynthSound('victory');
    showDialogue('Spider-Man', `"Stage ${currentStage} cleared! Victory!"`, '🏆');
    showStageResult(true);
  }
}

function restartSpiderManGame() {
  const modal = document.getElementById('result-modal');
  if (modal) modal.style.display = 'none';
  if (stageTimerInterval) { clearInterval(stageTimerInterval); stageTimerInterval = null; }
  bossHealth = 100;
  thievesCaptured = 0;
  mjSaved = false;
  spideyGroup.position.set(0, 8, 0);
  targetX = 0;
  spideyX = 0;
  spideyY = 8;
  loadStage(1);
  showDialogue('Spider-Man', '"New game! All 30 stages await — let\'s go!"', '🕷️');
}
window.restartSpiderManGame = restartSpiderManGame;

function loadNextStage() {
  const modal = document.getElementById('result-modal');
  if (modal) modal.style.display = 'none';
  if (currentStage < 30) {
    loadStage(currentStage + 1);
  } else {
    loadStage(1); // Loop back after all 30 stages
  }
}
window.loadNextStage = loadNextStage;

function updateBossHud() {
  const hpFill = document.getElementById('boss-hp-fill');
  const hpText = document.getElementById('boss-hp-text');
  const bossTitle = document.getElementById('boss-title');

  if (activeBosses.length > 0) {
    const leader = activeBosses[0];
    if (bossTitle) bossTitle.textContent = `⚔️ ${leader.villainData.name}`;
  }
  if (hpFill) hpFill.style.width = `${bossHealth}%`;
  if (hpText) hpText.textContent = `${bossHealth}% HP`;
}

function updateSpideyRadar() {
  const blips = document.getElementById('radar-blips');
  if (!blips) return;
  blips.innerHTML = '';

  activeBosses.forEach(b => {
    const relZ = b.position.z - spideyGroup.position.z;
    if (relZ < 0 && relZ > -90) {
      const blipX = 68 + (b.position.x / 18.0) * 45;
      const blipY = 112 + (relZ / 90) * 85;
      const blip = document.createElement('div');
      blip.style.position = 'absolute';
      blip.style.left = `${blipX}px`;
      blip.style.top = `${blipY}px`;
      blip.style.width = '8px';
      blip.style.height = '8px';
      blip.style.borderRadius = '50%';
      blip.style.background = '#ef4444';
      blip.style.boxShadow = '0 0 8px #ef4444';
      blip.style.transform = 'translate(-50%, -50%)';
      blips.appendChild(blip);
    }
  });

  activeThieves.forEach(t => {
    if (!t.isCaptured) {
      const relZ = t.position.z - spideyGroup.position.z;
      if (relZ < 0 && relZ > -90) {
        const blipX = 68 + (t.position.x / 18.0) * 45;
        const blipY = 112 + (relZ / 90) * 85;
        const blip = document.createElement('div');
        blip.style.position = 'absolute';
        blip.style.left = `${blipX}px`;
        blip.style.top = `${blipY}px`;
        blip.style.width = '6px';
        blip.style.height = '6px';
        blip.style.borderRadius = '50%';
        blip.style.background = '#eab308';
        blip.style.boxShadow = '0 0 6px #eab308';
        blip.style.transform = 'translate(-50%, -50%)';
        blips.appendChild(blip);
      }
    }
  });
}

function updateCamera(delta) {
  let tx, ty, tz;
  const isMobile = window.innerWidth < 650;
  if (cameraView === 'front') {
    tx = spideyGroup.position.x;
    ty = spideyGroup.position.y + 0.6;
    tz = spideyGroup.position.z - 4.5;
    camera.position.set(tx, ty, tz);
    camera.lookAt(spideyGroup.position.x, spideyGroup.position.y, 20);
  } else if (cameraView === 'top') {
    tx = spideyGroup.position.x;
    ty = spideyGroup.position.y + 18;
    tz = spideyGroup.position.z + 4;
    camera.position.set(tx, ty, tz);
    camera.lookAt(spideyGroup.position.x, spideyGroup.position.y, -15);
  } else {
    // Cinematic Third-Person behind Spider-Man with generous clearance so hero is never blocked
    tx = spideyGroup.position.x * 0.4;
    ty = spideyGroup.position.y + (isMobile ? 2.5 : 3.6);
    tz = spideyGroup.position.z + (isMobile ? 6.5 : 9.8);
    camera.position.x += (tx - camera.position.x) * Math.min(1.0, 10.0 * delta);
    camera.position.y += (ty - camera.position.y) * Math.min(1.0, 10.0 * delta);
    camera.position.z += (tz - camera.position.z) * Math.min(1.0, 10.0 * delta);
    camera.lookAt(spideyGroup.position.x * 0.4, spideyGroup.position.y + 1.2, -20);
  }
}

function setCameraView(view) {
  cameraView = view;
  document.querySelectorAll('.camera-control-bar .hud-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`cam-${view}`);
  if (btn) btn.classList.add('active');
}

function showDialogue(speaker, msg, avatar = '🕷️') {
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
  const bottomHud = document.getElementById('bottom-hud');
  if (hudStrip)  hudStrip.style.display  = 'flex';
  if (bottomHud) bottomHud.style.display = 'flex';

  isPlaying = true;
  bossHealth = 100;
  loadStage(1);
  showDialogue('Spider-Man', 'Stage 1: Protect New York! Net all syndicate thieves!', '🕷️');
}

function exitToHub() {
  window.location.href = '../../index.html';
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('DOMContentLoaded', initEngine);

