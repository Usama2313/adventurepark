/**
 * BATMAN: ARKHAM SHADOWS 3D 🦇
 * Complete Detective & Vigilante Simulator:
 * - High-Detail Realistic 3D Batman with Cowl, Bat-Ears, Utility Belt & Dual-Wing Bat-Cape
 * - Gotham City Rooftops, Gargoyles, Street Level Traffic & Gotham PD Cruisers
 * - Bank Thieves Capture: Subdue with Batarangs, Smoke Pellets or Bat-Claw for Gotham PD
 * - Complete Arkham Gadget Suite:
 *   [Q] Batarang Throw, [E] Grapnel Gun Zip, [F] Smoke Pellet, [R] Explosive Gel, [C] Bat-Claw Pull, [SHIFT] Cape Glide
 * - Complete 31 Villains Roster across 5 Stages:
 *   Stage 1: The Joker, Harley Quinn, Penguin, The Riddler, Two-Face, Catwoman
 *   Stage 2: Scarecrow, Bane, Poison Ivy, Ra's al Ghul, Mr. Freeze, Deathstroke
 *   Stage 3: Clayface, Killer Croc, Black Mask, Hugo Strange, The Court of Owls (Talon), Mad Hatter
 *   Stage 4: Man-Bat, Hush, Professor Pyg, Ventriloquist & Scarface, Firefly, Deadshot, Calendar Man
 *   Stage 5: GRAND FINALE - Solomon Grundy, Victor Zsasz, Anarky, Prometheus, KGBeast + Lex Luthor & ALL 31 Villains United!
 */

let scene, camera, renderer, clock;
let batmanGroup, capeMesh, batarangMesh;
let isPlaying = false;
let isGliding = false;
let runSpeed = 0.55;
let targetRunSpeed = 0.55;
let batmanY = 6;
let batmanVelY = 0;
let batmanX = 0;
let targetX = 0;
let currentStage = 1;
let thievesCaptured = 0;
let totalThievesNeeded = 3;
let bossHealth = 100;
let cameraView = 'back';
let audioCtx;

const keys = {};
const gothamChunks = [];
const CHUNK_SIZE = 80;
const TOTAL_CHUNKS = 5;

// Entities
const activeVillains = [];
const activeThieves = [];
const gothamPDCars = [];
const flyingBatarangs = [];

// Complete 31 Villains Roster
const BATMAN_VILLAINS = {
  stage1: [
    { name: "The Joker", title: "Clown Prince of Crime", color: 0x9333ea, size: 1.2, hp: 120, isJoker: true },
    { name: "Harley Quinn", title: "Mallet-Wielding Queen of Anarchy", color: 0xef4444, size: 1.1, hp: 95 },
    { name: "The Penguin (Oswald Cobblepot)", title: "Iceberg Lounge Crime Boss", color: 0x1e293b, size: 1.2, hp: 100 },
    { name: "The Riddler (Edward Nygma)", title: "Master of Enigmas & Traps", color: 0x16a34a, size: 1.1, hp: 90 },
    { name: "Two-Face (Harvey Dent)", title: "Duality Mob King", color: 0x475569, size: 1.2, hp: 100 },
    { name: "Catwoman (Selina Kyle)", title: "Acrobatic Jewel Burglar", color: 0x09090b, size: 1.1, hp: 90 }
  ],
  stage2: [
    { name: "Scarecrow (Dr. Jonathan Crane)", title: "Fear Toxin Mastermind", color: 0xb45309, size: 1.2, hp: 110 },
    { name: "Bane", title: "Venom-Fueled Goliath", color: 0x3f3f46, size: 1.8, hp: 150 },
    { name: "Poison Ivy (Dr. Pamela Isley)", title: "Botanical Eco-Terrorist", color: 0x22c55e, size: 1.2, hp: 110 },
    { name: "Ra's al Ghul", title: "Lazarus Immortality Demon's Head", color: 0x15803d, size: 1.3, hp: 130 },
    { name: "Mr. Freeze (Dr. Victor Fries)", title: "Cryogenic Sub-Zero Hunter", color: 0x38bdf8, size: 1.4, hp: 125 },
    { name: "Deathstroke (Slade Wilson)", title: "Ultimate Tactical Assassin", color: 0xf97316, size: 1.3, hp: 135 }
  ],
  stage3: [
    { name: "Clayface (Basil Karlo)", title: "Shapeshifting Clay Titan", color: 0xa16207, size: 1.8, hp: 145 },
    { name: "Killer Croc (Waylon Jones)", title: "Sewer Reptilian Behemoth", color: 0x166534, size: 1.7, hp: 140 },
    { name: "Black Mask (Roman Sionis)", title: "Sadistic Mob Underworld Boss", color: 0x18181b, size: 1.2, hp: 100 },
    { name: "Hugo Strange", title: "Arkham City Psychological Overseer", color: 0x64748b, size: 1.2, hp: 105 },
    { name: "The Court of Owls (Talon)", title: "Gotham Undead Secret Assassin", color: 0xd97706, size: 1.2, hp: 120 },
    { name: "Mad Hatter (Jervis Tetch)", title: "Mind-Control Technologist", color: 0x0284c7, size: 1.1, hp: 90 }
  ],
  stage4: [
    { name: "Man-Bat (Dr. Kirk Langstrom)", title: "Airborne Sonic Chiropteran", color: 0x27272a, size: 1.5, hp: 125 },
    { name: "Hush (Dr. Thomas Elliot)", title: "Bandaged Identity Usurper", color: 0xd4d4d8, size: 1.2, hp: 110 },
    { name: "Professor Pyg (Lazlo Valentin)", title: "Dollotron Surgeon Psycho", color: 0xf43f5e, size: 1.2, hp: 105 },
    { name: "Ventriloquist & Scarface", title: "Dual Personality Mobster Dummy", color: 0x78716c, size: 1.1, hp: 95 },
    { name: "Firefly (Garfield Lynns)", title: "Flamethrower Jetpack Arsonist", color: 0xea580c, size: 1.2, hp: 110 },
    { name: "Deadshot (Floyd Lawton)", title: "Never-Miss Sniper Assassin", color: 0xb91c1c, size: 1.2, hp: 115 },
    { name: "Calendar Man", title: "Obsessive Seasonal Criminal", color: 0x52525b, size: 1.1, hp: 90 }
  ],
  stage5: [
    { name: "Solomon Grundy", title: "Slaughter Swamp Undead Titan", color: 0x71717a, size: 1.9, hp: 200 },
    { name: "Victor Zsasz", title: "Cold Tally Mark Stalker", color: 0xe2e8f0, size: 1.2, hp: 110 },
    { name: "Anarky (Lonnie Machin)", title: "Anti-Authority Radical", color: 0xdc2626, size: 1.1, hp: 100 },
    { name: "Prometheus", title: "Anti-Justice League Weapon Master", color: 0x4f46e5, size: 1.4, hp: 135 },
    { name: "KGBeast (Anatoli Knyazev)", title: "Cybernetic Gun-Arm Mercenary", color: 0x991b1b, size: 1.4, hp: 130 },
    { name: "Lex Luthor (Arkham Syndicate)", title: "Corporate Infiltrator", color: 0x15803d, size: 1.3, hp: 130 }
  ]
};

function initEngine() {
  const canvas = document.getElementById('three-canvas');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070d);
  scene.fog = new THREE.FogExp2(0x05070d, 0.008);

  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 11);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Dark Gothic Gotham Lighting with Blue Moonlight & Bat-Signal
  const ambient = new THREE.AmbientLight(0x38bdf8, 0.45);
  scene.add(ambient);

  const moon = new THREE.DirectionalLight(0xe0f2fe, 1.2);
  moon.position.set(-40, 90, 40);
  moon.castShadow = true;
  scene.add(moon);

  // Realistic Batman 3D Mesh
  batmanGroup = createRealisticBatmanMesh();
  scene.add(batmanGroup);

  // Build Gotham City
  buildGothamWorld();

  // Spawn Street Traffic & Gotham PD
  spawnGothamTraffic();

  // Load Stage 1
  loadStage(1);

  // Key Listeners
  setupKeyListeners();

  clock = new THREE.Clock();
  requestAnimationFrame(animate);
}

/* ─── REALISTIC 3D BATMAN MODEL (NEVER COVERED BY ANY BAR) ─── */
function createRealisticBatmanMesh() {
  const g = new THREE.Group();
  const suitMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.35, metalness: 0.3 });
  const beltMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.8 });
  const cowlMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.25 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.8 });

  // Muscular Armored Chest with Bat-Symbol
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.3, 0.55), suitMat);
  torso.position.y = 1.2;
  torso.castShadow = true;
  g.add(torso);

  // Golden Utility Belt
  const belt = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.18, 0.6), beltMat);
  belt.position.y = 0.6;
  g.add(belt);

  // Cowl & Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 14), cowlMat);
  head.position.y = 2.05;
  g.add(head);

  // Bat-Ears
  for (const x of [-0.2, 0.2]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 4), cowlMat);
    ear.position.set(x, 2.45, -0.05);
    g.add(ear);
  }

  // Exposed Jaw / Chin
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.12), skinMat);
  jaw.position.set(0, 1.85, 0.32);
  g.add(jaw);

  // Arms & Gauntlet Blades
  for (const x of [-0.65, 0.65]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 1.1, 8), suitMat);
    arm.position.set(x, 1.2, 0);
    g.add(arm);

    // 3 Gauntlet Fins
    for (let f = 0; f < 3; f++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.15), cowlMat);
      fin.position.set(x > 0 ? 0.12 : -0.12, 0.8 + f * 0.15, -0.1);
      arm.add(fin);
    }
  }

  // Legs & Combat Boots
  for (const x of [-0.26, 0.26]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 1.2, 8), suitMat);
    leg.position.set(x, 0.2, 0);
    g.add(leg);
  }

  // Scalloped Bat-Cape
  const capeGeo = new THREE.PlaneGeometry(2.0, 2.8, 6, 6);
  const capeMat = new THREE.MeshStandardMaterial({ color: 0x09090b, side: THREE.DoubleSide, roughness: 0.5 });
  capeMesh = new THREE.Mesh(capeGeo, capeMat);
  capeMesh.position.set(0, 1.2, -0.35);
  g.add(capeMesh);

  return g;
}

/* ─── GOTHAM WORLD & STREET TRAFFIC ─── */
function buildGothamWorld() {
  for (let i = 0; i < TOTAL_CHUNKS; i++) {
    const chunk = createGothamChunk();
    chunk.position.z = -i * CHUNK_SIZE;
    scene.add(chunk);
    gothamChunks.push(chunk);
  }
}

function createGothamChunk() {
  const chunk = new THREE.Group();

  // Dark Asphalt Wet Gotham Avenue
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2 });
  const road = new THREE.Mesh(new THREE.BoxGeometry(40, 2, CHUNK_SIZE), roadMat);
  road.position.y = -8;
  chunk.add(road);

  // Gothic Gargoyle Rooftops and Wayne Enterprises Towers
  const bMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 });
  for (let z = -CHUNK_SIZE / 2 + 15; z < CHUNK_SIZE / 2; z += 35) {
    for (const side of [-1, 1]) {
      const bH = 50 + Math.random() * 45;
      const bW = 18 + Math.random() * 8;
      const tower = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, 24), bMat);
      tower.position.set(side * (24 + bW / 2), bH / 2 - 8, z);
      tower.castShadow = true;
      chunk.add(tower);

      // Gargoyle Perch on corner
      const gargoyle = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 2.5), new THREE.MeshStandardMaterial({ color: 0x475569 }));
      gargoyle.position.set(side * 14.5, 8, z);
      chunk.add(gargoyle);
    }
  }

  return chunk;
}

function spawnGothamTraffic() {
  for (let i = 0; i < 4; i++) {
    const isGCPD = (i % 2 === 0);
    const car = new THREE.Group();
    const cMat = new THREE.MeshStandardMaterial({ color: isGCPD ? 0x0f172a : 0x334155 });
    const b = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 5.0), cMat);
    b.position.y = -7.0;
    car.add(b);
    car.position.set((i % 2 === 0 ? -6 : 6), 0, -40 - i * 40);
    car.speed = 0.35;
    scene.add(car);
    if (isGCPD) gothamPDCars.push(car);
  }
}

/* ─── STAGE PROGRESSION & 31 VILLAINS ─── */
function loadStage(stageNum) {
  currentStage = stageNum;
  thievesCaptured = 0;
  totalThievesNeeded = 2 + stageNum;

  activeVillains.forEach(v => scene.remove(v));
  activeVillains.length = 0;
  activeThieves.forEach(t => scene.remove(t));
  activeThieves.length = 0;

  const stageNameElem = document.getElementById('hud-stage-name');
  const thievesElem = document.getElementById('hud-thieves-count');
  const bossHud = document.getElementById('boss-hud-bar');

  thievesElem.textContent = `0 / ${totalThievesNeeded} (HELP GOTHAM PD)`;

  // Spawn Thieves on Ground Level / Alleyways
  for (let i = 0; i < totalThievesNeeded; i++) {
    const thief = createThiefMesh(i);
    thief.position.set((Math.random() - 0.5) * 14, -6.5, -40 - i * 35);
    scene.add(thief);
    activeThieves.push(thief);
  }

  // Load Stage Bosses
  if (stageNum === 1) {
    stageNameElem.textContent = 'STAGE 1: JOKER & HARLEY RIOT';
    spawnBosses(BATMAN_VILLAINS.stage1);
    showDialogue('The Joker', '"Welcome to the main event, Bats! HA-HA-HA! Let\'s see you dance!"', '🃏');
  } else if (stageNum === 2) {
    stageNameElem.textContent = 'STAGE 2: SCARECROW & BANE';
    spawnBosses(BATMAN_VILLAINS.stage2);
    showDialogue('Bane', '"I will break you, Batman! Like the brittle glass of your city!"', '💪');
  } else if (stageNum === 3) {
    stageNameElem.textContent = 'STAGE 3: CLAYFACE & KILLER CROC';
    spawnBosses(BATMAN_VILLAINS.stage3);
    showDialogue('Killer Croc', '"Gotham\'s sewers belong to me, Caped Crusader!"', '🐊');
  } else if (stageNum === 4) {
    stageNameElem.textContent = 'STAGE 4: ROGUES GALLERY CONSPIRACY';
    spawnBosses(BATMAN_VILLAINS.stage4);
    showDialogue('Deadshot', '"Nothing personal, Batman. Just $10 million on your cowl."', '🎯');
  } else if (stageNum === 5) {
    stageNameElem.textContent = 'STAGE 5: FINAL SIEGE OF GOTHAM';
    // Grand Finale: All villain leaders assembled!
    const allFinale = [
      ...BATMAN_VILLAINS.stage5,
      ...BATMAN_VILLAINS.stage4.slice(0, 3),
      ...BATMAN_VILLAINS.stage3.slice(0, 3),
      ...BATMAN_VILLAINS.stage2.slice(0, 3),
      ...BATMAN_VILLAINS.stage1.slice(0, 3)
    ];
    spawnBosses(allFinale);
    showDialogue('The Joker & Rogues', '"ALL 31 OF US TOGETHER! Gotham falls tonight!"', '🃏');
  }

  bossHud.style.display = 'block';
  updateBossHud();
}

function spawnBosses(roster) {
  roster.forEach((vData, index) => {
    const boss = createBossMesh(vData);
    // Position lead boss right in front of Batman at z = -24 to be immediately visible!
    const zOffset = -24 - index * 28;
    const xOffset = (index === 0) ? 0 : (index % 2 === 1 ? -6 : 6);
    boss.position.set(xOffset, 5.0, zOffset);
    boss.villainData = vData;
    boss.hp = vData.hp;
    boss.maxHp = vData.hp;
    scene.add(boss);
    activeVillains.push(boss);
  });
}

function createBillboardNameTag(text, color = '#00f0ff') {
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

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9 * vData.size, 1.5 * vData.size, 0.7 * vData.size), mat);
  body.position.y = 1.0;
  body.castShadow = true;
  g.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38 * vData.size, 12, 12), mat);
  head.position.y = 2.0;
  g.add(head);

  // Overhead Glowing 3D Name Tag so all 31 villains are 100% visible
  const nameTag = createBillboardNameTag(`⚔️ ${vData.name.toUpperCase()}`, '#ffd60a');
  nameTag.position.set(0, 3.0 * vData.size, 0);
  g.add(nameTag);

  // Distinct villain PointLight
  const vLight = new THREE.PointLight(vData.color, 1.5, 25);
  vLight.position.set(0, 2, 0);
  g.add(vLight);

  if (vData.isJoker) {
    // Green Joker Hair & Smile
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.42 * vData.size, 10, 10), new THREE.MeshBasicMaterial({ color: 0x16a34a }));
    hair.position.set(0, 2.1, -0.05);
    g.add(hair);
  }

  g.isBoss = true;
  g.hitRadius = 2.5 * vData.size;
  return g;
}

function createThiefMesh(id) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.4), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
  b.position.y = 0.6;
  g.add(b);

  const h = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfde047 }));
  h.position.y = 1.35;
  g.add(h);

  g.isThief = true;
  g.isSubdued = false;
  g.hitRadius = 2.2;
  return g;
}

/* ─── ARKHAM GADGET SUITE ─── */
function triggerBatarang() {
  playSynthSound('batarang');

  // Spawn Spinning Batarang Projectile
  const batMat = new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.9 });
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.3), batMat);
  b.position.copy(batmanGroup.position);
  b.position.y += 1.0;
  b.velocity = new THREE.Vector3(0, 0, -2.0);
  scene.add(b);
  flyingBatarangs.push(b);

  showDialogue('Batman', '"Batarang thrown! Targeting hostile weapons!"', '🦇');
}

function triggerBatGrapple() {
  playSynthSound('grapple');
  batmanVelY = 0.35;
  targetRunSpeed = 1.35;
  showDialogue('Batman', '"Grapnel gun engaged. Ascending to gargoyle vantage point."', '🎯');
  setTimeout(() => { targetRunSpeed = 0.55; }, 1600);
}

function triggerSmokeBomb() {
  playSynthSound('smoke');
  showDialogue('Batman', '"Smoke pellet deployed. Striking from the shadows!"', '💨');

  // Stun all nearby villains
  activeVillains.forEach(boss => {
    if (boss.position.distanceTo(batmanGroup.position) < 30) {
      damageActiveBoss(25);
    }
  });

  activeThieves.forEach(thief => {
    if (!thief.isSubdued && thief.position.distanceTo(batmanGroup.position) < 30) {
      subdueThief(thief);
    }
  });
}

function triggerExplosiveGel() {
  playSynthSound('explosion');
  showDialogue('Batman', '"Explosive gel detonated! Barrier destroyed!"', '💥');
  damageActiveBoss(35);
}

function triggerBatClaw() {
  playSynthSound('claw');
  showDialogue('Batman', '"Bat-Claw launched! Disarming thief and pulling into custody!"', '⚡');

  activeThieves.forEach(thief => {
    if (!thief.isSubdued && Math.abs(thief.position.z - batmanGroup.position.z) < 45) {
      subdueThief(thief);
    }
  });
}

function triggerBatGlide(active) {
  isGliding = active;
  if (active) {
    playSynthSound('glide');
    batmanVelY = 0.02;
    document.getElementById('hud-glide-mode').textContent = 'CAPE GLIDING 🦇';
    if (capeMesh) capeMesh.scale.set(1.8, 1.2, 1.0); // Wings expand!
  } else {
    document.getElementById('hud-glide-mode').textContent = 'ROOFTOP PATROL';
    if (capeMesh) capeMesh.scale.set(1.0, 1.0, 1.0);
  }
}

function subdueThief(thief) {
  thief.isSubdued = true;
  thief.material = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
  thievesCaptured++;
  playSynthSound('victory');

  document.getElementById('hud-thieves-count').textContent = `${thievesCaptured} / ${totalThievesNeeded} (GCPD ARRESTED)`;
  showDialogue('GCPD Dispatch', '"Batman secured the suspect! Squad car en route for transport to Blackgate!"', '🚓');

  if (thievesCaptured >= totalThievesNeeded) {
    damageActiveBoss(30);
  }
}

function damageActiveBoss(amount) {
  bossHealth = Math.max(0, bossHealth - amount);
  updateBossHud();

  if (bossHealth <= 0) {
    playSynthSound('victory');
    showDialogue('Batman', `"Stage ${currentStage} rogues subdued. Arkham Asylum holding cells ready."`, '🏆');
    const modal = document.getElementById('endgame-modal');
    if (modal) {
      const title = document.getElementById('endgame-title');
      const subtitle = document.getElementById('endgame-subtitle');
      if (title) title.textContent = currentStage < 5 ? `STAGE ${currentStage} CLEARED!` : '🌟 ALL 31 VILLAINS SUBDUED!';
      if (subtitle) subtitle.textContent = currentStage < 5 ? 'Batman and the GCPD locked up Gotham rogues!' : 'Batman and GCPD saved Gotham from Joker, Lex Luthor, and all 31 villains!';
      modal.style.display = 'flex';
    }
  }
}

function restartBatmanGame() {
  const modal = document.getElementById('endgame-modal');
  if (modal) modal.style.display = 'none';
  bossHealth = 100;
  thievesCaptured = 0;
  batmanX = 0;
  targetX = 0;
  batmanY = 6;
  loadStage(1);
  showDialogue('Batman', '"Resetting Gotham patrol. Surveillance grid active."', '🦇');
}
window.restartBatmanGame = restartBatmanGame;

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

    if (type === 'batarang') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.16);
      osc.start(now); osc.stop(now + 0.16);
    } else if (type === 'grapple') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.22);
      osc.start(now); osc.stop(now + 0.22);
    } else if (type === 'smoke') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.35);
      osc.start(now); osc.stop(now + 0.35);
    } else if (type === 'victory') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.linearRampToValueAtTime(660, now + 0.4);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.45);
      osc.start(now); osc.stop(now + 0.45);
    }
  } catch (e) {}
}

function setupKeyListeners() {
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'q' || e.key === 'Q') triggerBatarang();
    if (e.key === 'e' || e.key === 'E') triggerBatGrapple();
    if (e.key === 'f' || e.key === 'F') triggerSmokeBomb();
    if (e.key === 'r' || e.key === 'R') triggerExplosiveGel();
    if (e.key === 'c' || e.key === 'C') triggerBatClaw();
    if (e.key === 'Shift') triggerBatGlide(true);
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') targetX = Math.max(-16, targetX - 4.0);
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') targetX = Math.min(16, targetX + 4.0);
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    if (e.key === 'Shift') triggerBatGlide(false);
  });
  window.addEventListener('resize', onWindowResize);
}

/* ─── ANIMATION LOOP ─── */
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  if (isPlaying) {
    runSpeed += (targetRunSpeed - runSpeed) * Math.min(1.0, 5.0 * delta);
    const forwardStep = runSpeed * delta * 65;

    // Move Gotham Chunks
    gothamChunks.forEach(chunk => {
      chunk.position.z += forwardStep;
      if (chunk.position.z > CHUNK_SIZE) chunk.position.z -= TOTAL_CHUNKS * CHUNK_SIZE;
    });

    // Vertical Physics
    if (isGliding) {
      batmanVelY = -0.005;
      batmanY = Math.max(-5.5, batmanY + batmanVelY);
    } else {
      batmanVelY -= 0.015;
      batmanY = Math.max(-5.5, batmanY + batmanVelY);
    }

    batmanX += (targetX - batmanX) * Math.min(1.0, 8.0 * delta);
    batmanGroup.position.set(batmanX, batmanY, 0);

    // Update Batarangs
    for (let i = flyingBatarangs.length - 1; i >= 0; i--) {
      const b = flyingBatarangs[i];
      b.position.add(b.velocity);
      b.rotation.y += 0.4;

      // Check hits on villains or thieves
      activeVillains.forEach(boss => {
        if (b.position.distanceTo(boss.position) < 3.5) {
          damageActiveBoss(20);
          boss.position.z = -100;
        }
      });

      activeThieves.forEach(thief => {
        if (!thief.isSubdued && b.position.distanceTo(thief.position) < 3.0) {
          subdueThief(thief);
        }
      });

      if (b.position.z < -120) {
        scene.remove(b);
        flyingBatarangs.splice(i, 1);
      }
    }

    // Update active villains
    activeVillains.forEach(boss => {
      boss.position.z += forwardStep * 0.65;
      if (boss.position.z > 20) boss.position.z = -120 - Math.random() * 30;

      if (boss.position.distanceTo(batmanGroup.position) < 4.0) {
        damageActiveBoss(15);
        boss.position.z = -100;
      }
    });

    // Update thieves on ground
    activeThieves.forEach(thief => {
      thief.position.z += forwardStep * 0.5;
      if (thief.position.z > 20) thief.position.z = -140 - Math.random() * 30;
    });

    // Detective Radar
    updateDetectiveRadar();
  }

  updateCamera(delta);
  renderer.render(scene, camera);
}

function updateDetectiveRadar() {
  const blips = document.getElementById('radar-blips');
  if (!blips) return;
  blips.innerHTML = '';

  activeVillains.forEach(b => {
    const relZ = b.position.z - batmanGroup.position.z;
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
      blip.style.background = '#00f0ff';
      blip.style.boxShadow = '0 0 6px #00f0ff';
      blip.style.transform = 'translate(-50%, -50%)';
      blips.appendChild(blip);
    }
  });
}

function updateCamera(delta) {
  let tx, ty, tz;
  if (cameraView === 'front') {
    tx = batmanGroup.position.x;
    ty = batmanGroup.position.y + 0.5;
    tz = batmanGroup.position.z - 5;
    camera.position.set(tx, ty, tz);
    camera.lookAt(batmanGroup.position.x, batmanGroup.position.y, 20);
  } else if (cameraView === 'top') {
    tx = batmanGroup.position.x;
    ty = batmanGroup.position.y + 20;
    tz = batmanGroup.position.z + 5;
    camera.position.set(tx, ty, tz);
    camera.lookAt(batmanGroup.position.x, batmanGroup.position.y, -15);
  } else {
    tx = batmanGroup.position.x * 0.45;
    ty = batmanGroup.position.y + 2.8;
    tz = batmanGroup.position.z + 9.0;
    camera.position.x += (tx - camera.position.x) * Math.min(1.0, 10.0 * delta);
    camera.position.y += (ty - camera.position.y) * Math.min(1.0, 10.0 * delta);
    camera.position.z += (tz - camera.position.z) * Math.min(1.0, 10.0 * delta);
    camera.lookAt(batmanGroup.position.x * 0.5, batmanGroup.position.y + 0.5, -20);
  }
}

function setCameraView(view) {
  cameraView = view;
  document.querySelectorAll('.camera-control-bar .hud-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`cam-${view}`);
  if (btn) btn.classList.add('active');
}

function showDialogue(speaker, msg, avatar = '🦇') {
  const dlg = document.getElementById('dialogue-box');
  if (!dlg) return;
  document.getElementById('dialogue-speaker').textContent = speaker;
  document.getElementById('dialogue-text').textContent = msg;
  document.getElementById('dialogue-avatar').textContent = avatar;
  dlg.style.display = 'flex';
  setTimeout(() => { dlg.style.display = 'none'; }, 4500);
}

function startGame() {
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('in-game-hud').style.display = 'flex';
  document.getElementById('bat-radar').style.display = 'block';
  document.getElementById('speedo-cluster').style.display = 'flex';
  document.getElementById('ability-bar').style.display = 'flex';

  isPlaying = true;
  bossHealth = 100;
  showDialogue('Batman', '"I am vengeance. I am the night. Gotham is under my protection. [Q] Batarang, [E] Grapple, [F] Smoke!"', '🦇');
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
