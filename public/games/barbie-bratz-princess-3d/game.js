/**
 * BARBIE, BRATZ & PRINCESS: RUNWAY & SPY ADVENTURE 3D 💖
 * Complete Multi-Franchise Experience:
 * - Real-world Beverly Hills / Rodeo Drive boulevard with palm trees & catwalk spotlights
 * - Realistic Pink Luxury Convertible Sports Car with chrome wheels & headlights
 * - Franchises supported:
 *   1. Barbie (Dreamhouse Fashion Icon)
 *   2. Bratz (Cloe, Sasha, Jade, Yasmin - Y2K Teen Magazine Teamwork)
 *   3. Cinderella (Royal Palace Gown & Glass Slippers)
 *   4. Winx Club (Bloom & Glitter Fairy Wings)
 *   5. Totally Spies! (Sam, Clover, Alex - Laser Lipstick, Compowder, Jetpack)
 *   6. Monster High (Draculaura Gothic-Chic Fashion)
 *   7. Jem and the Holograms (80s Holographic Pop-Star Transformation)
 */

let scene, camera, renderer, clock;
let carGroup, heroineMesh, fairyWingsMesh;
let isPlaying = false;
let carSpeed = 0.65;
let targetSpeed = 0.65;
let carX = 0;
let targetX = 0;
let score = 0;
let currentFranchise = 'barbie';
let cameraView = 'back';
let audioCtx;

const chunks = [];
const CHUNK_SIZE = 80;
const TOTAL_CHUNKS = 5;
const collectibles = [];
const paparazzi = [];
const keys = {};

function initEngine() {
  const canvas = document.getElementById('three-canvas');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfdf2f8);
  scene.fog = new THREE.FogExp2(0xfdf2f8, 0.006);

  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 4.5, 10);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // California Sun & Golden Hour Glow
  const ambient = new THREE.AmbientLight(0xffedd5, 0.85);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffedd5, 1.4);
  sun.position.set(40, 100, 40);
  sun.castShadow = true;
  scene.add(sun);

  // Build Pink Luxury Convertible & Heroine
  carGroup = createLuxuryConvertible();
  scene.add(carGroup);

  // Build Beverly Hills / Rodeo Drive Modular Avenue
  buildModularBoulevard();

  // Spawn Glamour Collectibles (Hearts, Gems, Spy Compowders)
  spawnCollectibles();

  // Key Listeners
  setupControls();

  clock = new THREE.Clock();
  requestAnimationFrame(animate);
}

/* ─── REALISTIC PINK LUXURY CONVERTIBLE SPORTS CAR ─── */
function createLuxuryConvertible() {
  const g = new THREE.Group();
  const pinkMat = new THREE.MeshStandardMaterial({ color: 0xec4899, metalness: 0.7, roughness: 0.2 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.95, roughness: 0.1 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45, roughness: 0.1 });
  const interiorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });

  // Streamlined Aerodynamic Chassis
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.85, 6.2), pinkMat);
  body.position.y = 0.55;
  body.castShadow = true;
  g.add(body);

  // Slanted Windshield
  const shield = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.7, 0.08), glassMat);
  shield.position.set(0, 1.25, 0.6);
  shield.rotation.x = 0.45;
  g.add(shield);

  // Leather Interior Seats
  for (const sx of [-0.6, 0.6]) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), interiorMat);
    seat.position.set(sx, 0.85, -0.2);
    g.add(seat);
  }

  // 4 Chrome Alloy Wheels
  for (const wx of [-1.35, 1.35]) {
    for (const wz of [-1.8, 1.8]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.35, 16), tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.48, wz);
      wheel.castShadow = true;
      g.add(wheel);

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.38, 8), chromeMat);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(wx, 0.48, wz);
      g.add(rim);
    }
  }

  // Heroine Character Mesh in Driver Seat
  heroineMesh = createHeroineFigure('barbie');
  heroineMesh.position.set(-0.6, 0.85, -0.2);
  g.add(heroineMesh);

  return g;
}

function createHeroineFigure(franchise) {
  const g = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 });
  const hairColor = (franchise === 'cinderella' || franchise === 'barbie') ? 0xfde047 : (franchise === 'bratz' ? 0x92400e : 0xea580c);
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.3 });
  const outfitColor = franchise === 'cinderella' ? 0x38bdf8 : (franchise === 'bratz' ? 0x9333ea : (franchise === 'totallyspies' ? 0x10b981 : 0xf43f5e));
  const outfitMat = new THREE.MeshStandardMaterial({ color: outfitColor, roughness: 0.3 });

  // Torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.8, 8), outfitMat);
  torso.position.y = 0.55;
  g.add(torso);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), skinMat);
  head.position.y = 1.15;
  g.add(head);

  // Hair
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 12), hairMat);
  hair.position.set(0, 1.25, -0.08);
  g.add(hair);

  // Winx Fairy Wings (Toggled in Winx mode)
  const wingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: franchise === 'winx' ? 0.75 : 0, side: THREE.DoubleSide });
  fairyWingsMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.4), wingMat);
  fairyWingsMesh.position.set(0, 0.8, -0.3);
  g.add(fairyWingsMesh);

  return g;
}

/* ─── MODULAR BEVERLY HILLS BOULEVARD & RUNWAY ─── */
function buildModularBoulevard() {
  for (let i = 0; i < TOTAL_CHUNKS; i++) {
    const chunk = createBoulevardChunk();
    chunk.position.z = -i * CHUNK_SIZE;
    scene.add(chunk);
    chunks.push(chunk);
  }
}

function createBoulevardChunk() {
  const chunk = new THREE.Group();

  // Polished Marble Catwalk & Palm Tree Highway
  const roadMat = new THREE.MeshStandardMaterial({ color: 0xfdf2f8, roughness: 0.3 });
  const road = new THREE.Mesh(new THREE.BoxGeometry(32, 1.5, CHUNK_SIZE), roadMat);
  road.position.y = -0.75;
  chunk.add(road);

  // Runway Magenta Center Glow Strip
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xec4899 });
  const strip = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, CHUNK_SIZE), glowMat);
  strip.position.y = 0.02;
  chunk.add(strip);

  // Palm Trees along sidewalk
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a });
  for (let z = -CHUNK_SIZE / 2 + 10; z < CHUNK_SIZE / 2; z += 25) {
    for (const side of [-1, 1]) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 8, 8), trunkMat);
      trunk.position.y = 4;
      tree.add(trunk);

      for (let l = 0; l < 5; l++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3.5, 4), leafMat);
        leaf.position.set(0, 8, 0);
        leaf.rotation.z = (l - 2) * 0.4;
        tree.add(leaf);
      }
      tree.position.set(side * 14, 0, z);
      chunk.add(tree);
    }
  }

  // Designer Boutiques & Fashion Houses
  const bMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  for (let z = -CHUNK_SIZE / 2 + 15; z < CHUNK_SIZE / 2; z += 35) {
    for (const side of [-1, 1]) {
      const bld = new THREE.Mesh(new THREE.BoxGeometry(14, 18, 22), bMat);
      bld.position.set(side * 24, 9, z);
      chunk.add(bld);
    }
  }

  return chunk;
}

function spawnCollectibles() {
  for (let i = 0; i < 15; i++) {
    const item = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.5, 0),
      new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xbe185d, roughness: 0.2, metalness: 0.8 })
    );
    item.position.set((Math.random() - 0.5) * 16, 1.2, -30 - i * 25);
    scene.add(item);
    collectibles.push(item);
  }
}

/* ─── FRANCHISE SWITCHING & ABILITIES ─── */
function switchFranchise(f) {
  currentFranchise = f;
  playSynthSound('glamour');

  const heroineTag = document.getElementById('hud-active-heroine');
  const franchiseTag = document.getElementById('hud-franchise');
  const venueTitle = document.getElementById('hud-venue-title');

  if (f === 'barbie') {
    heroineTag.textContent = 'BARBIE DREAMHOUSE 💖';
    franchiseTag.textContent = 'MALIBU & BEVERLY HILLS';
    venueTitle.textContent = 'RODEO DRIVE & BEVERLY HILLS BOULEVARD';
    showDialogue('Barbie', '"You can be an astronaut, a doctor, a designer, or a secret agent!"', '💖');
  } else if (f === 'bratz') {
    heroineTag.textContent = 'BRATZ: CLOE, SASHA, JADE & YASMIN ✨';
    franchiseTag.textContent = 'Y2K TEEN MAGAZINE RUNWAY';
    venueTitle.textContent = 'TEEN MAGAZINE WORLD PREMIERE CATWALK';
    showDialogue('Bratz (Cloe)', '"Passion for fashion! Teamwork and high style take over the city!"', '✨');
  } else if (f === 'cinderella') {
    heroineTag.textContent = 'PRINCESS CINDERELLA 👑';
    franchiseTag.textContent = 'ROYAL PALACE BALLROOM';
    venueTitle.textContent = 'ROYAL CARRIAGE CORRIDOR & GOLDEN GATES';
    showDialogue('Cinderella', '"A dream is a wish your heart makes when you are fast asleep."', '👑');
  } else if (f === 'winx') {
    heroineTag.textContent = 'WINX CLUB: BLOOM 🧚';
    franchiseTag.textContent = 'ALFEA MAGIC FAIRY ACADEMY';
    venueTitle.textContent = 'GLITTER PARADISE FAIRY SKYWAY';
    if (fairyWingsMesh) fairyWingsMesh.material.opacity = 0.85;
    showDialogue('Bloom (Winx Club)', '"Dragon Flame Magic! Glitter fairy wings engaged!"', '🧚');
  } else if (f === 'totallyspies') {
    heroineTag.textContent = 'TOTALLY SPIES: SAM, CLOVER, ALEX 🕶️';
    franchiseTag.textContent = 'WHOOP INTERNATIONAL ESPIONAGE';
    venueTitle.textContent = 'BEVERLY HILLS WHOOP HIGH-TECH SECTOR';
    showDialogue('Clover (Totally Spies)', '"Like, totally fabulous! Laser lipstick and jetpacks ready!"', '💄');
  } else if (f === 'monsterhigh') {
    heroineTag.textContent = 'MONSTER HIGH: DRACULAURA 🦇';
    franchiseTag.textContent = 'GOTHIC-CHIC RUNWAY ACADEMY';
    venueTitle.textContent = 'MONSTER HIGH CATWALK PAVILION';
    showDialogue('Draculaura', '"Embrace your freaky flaws and gothic-chic style!"', '🦇');
  } else if (f === 'jem') {
    heroineTag.textContent = 'JEM AND THE HOLOGRAMS 🎸';
    franchiseTag.textContent = 'STLIGHT MUSIC & HOLOGRAPHIC COMPUTER';
    venueTitle.textContent = 'GLAMOUR POP-STAR CONCERT ARENA';
    showDialogue('Jem', '"Showtime Synergy! Hologram transformation active!"', '🎸');
  } else if (f === 'myscene') {
    heroineTag.textContent = 'MY SCENE: WEST VILLAGE NYC 🏙️';
    franchiseTag.textContent = 'MANHATTAN HIGH-FASHION SCENE';
    venueTitle.textContent = '5TH AVENUE METROPOLITAN RUNWAY';
    showDialogue('My Scene Girls', '"New York City is our personal runway!"', '🏙️');
  } else if (f === 'lolsurprise') {
    heroineTag.textContent = 'L.O.L. SURPRISE! HOUSE OF SURPRISES 🎀';
    franchiseTag.textContent = 'COLORFUL MODERN DOLL RUNWAY';
    venueTitle.textContent = 'HOUSE OF SURPRISES WATER SLIDE BOULEVARD';
    showDialogue('L.O.L. Girls', '"Fashion, fierce fun, and fabulous surprises!"', '🎀');
  } else if (f === 'legofriends') {
    heroineTag.textContent = 'LEGO FRIENDS: HEARTLAKE CITY 🧱';
    franchiseTag.textContent = 'HEARTLAKE CITY FRIENDSHIP ADVENTURE';
    venueTitle.textContent = 'HEARTLAKE HARBOR DRIVE & CAFE BOULEVARD';
    showDialogue('Lego Friends', '"Teamwork and friendship make anything possible!"', '🧱');
  } else if (f === 'glitterforce') {
    heroineTag.textContent = 'GLITTER FORCE: MAGICAL PRINCESSES ✨';
    franchiseTag.textContent = 'PRETTY CURE PINK PARADISE DEFENDERS';
    venueTitle.textContent = 'GLITTER REALM RADIANT SKYWAY';
    showDialogue('Glitter Lucky', '"A fabulous shimmer, a glow in your heart! I\'m Glitter Lucky!"', '✨');
  }

  // Update Heroine model colors
  if (heroineMesh) {
    carGroup.remove(heroineMesh);
    heroineMesh = createHeroineFigure(f);
    heroineMesh.position.set(-0.6, 0.85, -0.2);
    carGroup.add(heroineMesh);
  }
}

function triggerLaserLipstick() {
  playSynthSound('laser');
  showDialogue('Totally Spies', '"Laser lipstick beam fired! Obstacle melted with high-fashion accuracy!"', '💄');
  score += 500;
  document.getElementById('hud-fame-score').textContent = `${score} PTS`;
}

function triggerConvertibleBoost() {
  playSynthSound('boost');
  targetSpeed = 1.45;
  document.getElementById('hud-drive-mode').textContent = 'TURBO NITRO 🚀';
  document.getElementById('speed-streaks').classList.add('active');
  showDialogue('Barbie', '"Convertible Turbo Boost engaged! Gliding down the boulevard in style!"', '💖');
  setTimeout(() => {
    targetSpeed = 0.65;
    document.getElementById('hud-drive-mode').textContent = 'CRUISING BEVERLY HILLS';
    document.getElementById('speed-streaks').classList.remove('active');
  }, 2000);
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

    if (type === 'glamour') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.linearRampToValueAtTime(1174.66, now + 0.3); // D6
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.35);
      osc.start(now); osc.stop(now + 0.35);
    } else if (type === 'laser') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.18);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'boost') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.4);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.45);
      osc.start(now); osc.stop(now + 0.45);
    } else if (type === 'gem') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.18);
      osc.start(now); osc.stop(now + 0.18);
    }
  } catch (e) {}
}

function setupControls() {
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' && isPlaying) triggerConvertibleBoost();
    if (e.key === 'e' || e.key === 'E') triggerLaserLipstick();
    if (e.key === '1') switchFranchise('barbie');
    if (e.key === '2') switchFranchise('bratz');
    if (e.key === '3') switchFranchise('cinderella');
    if (e.key === '4') switchFranchise('winx');
    if (e.key === '5') switchFranchise('totallyspies');
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') targetX = Math.max(-12, targetX - 3.5);
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') targetX = Math.min(12, targetX + 3.5);
  });
  window.addEventListener('keyup', (e) => { keys[e.key] = false; });
  window.addEventListener('resize', onWindowResize);
}

/* ─── ANIMATION LOOP ─── */
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  if (isPlaying) {
    carSpeed += (targetSpeed - carSpeed) * Math.min(1.0, 5.0 * delta);
    const forwardStep = carSpeed * delta * 65;

    // Move boulevard chunks
    chunks.forEach(chunk => {
      chunk.position.z += forwardStep;
      if (chunk.position.z > CHUNK_SIZE) chunk.position.z -= TOTAL_CHUNKS * CHUNK_SIZE;
    });

    // Lateral Steering
    carX += (targetX - carX) * Math.min(1.0, 8.0 * delta);
    carGroup.position.set(carX, 0, 0);
    carGroup.rotation.y = (targetX - carX) * -0.05;

    // Speedometer Needle
    const mph = Math.round(carSpeed * 95);
    document.getElementById('hud-car-speed').textContent = mph;
    const needle = document.getElementById('speedo-needle');
    if (needle) {
      const angle = -120 + Math.min(1, mph / 140) * 240;
      needle.style.transform = `rotate(${angle}deg)`;
    }

    // Collectibles & Gems
    collectibles.forEach(gem => {
      gem.position.z += forwardStep;
      gem.rotation.y += 0.04;

      if (gem.position.distanceTo(carGroup.position) < 3.0) {
        playSynthSound('gem');
        score += 250;
        document.getElementById('hud-fame-score').textContent = `${score} PTS`;
        gem.position.z = -140 - Math.random() * 40;
        gem.position.x = (Math.random() - 0.5) * 16;

        if (score >= 3000) {
          const modal = document.getElementById('endgame-modal');
          if (modal) modal.style.display = 'flex';
        }
      } else if (gem.position.z > 20) {
        gem.position.z = -140 - Math.random() * 40;
      }
    });
  }

  updateCamera(delta);
  renderer.render(scene, camera);
}

function updateCamera(delta) {
  let tx, ty, tz;
  if (cameraView === 'front') {
    tx = carGroup.position.x;
    ty = 2.2;
    tz = carGroup.position.z - 6;
    camera.position.set(tx, ty, tz);
    camera.lookAt(carGroup.position.x, 1.2, 20);
  } else if (cameraView === 'top') {
    tx = carGroup.position.x;
    ty = 18;
    tz = carGroup.position.z + 4;
    camera.position.set(tx, ty, tz);
    camera.lookAt(carGroup.position.x, 0, -10);
  } else {
    // Chase
    tx = carGroup.position.x * 0.45;
    ty = 3.5;
    tz = carGroup.position.z + 9.5;
    camera.position.x += (tx - camera.position.x) * Math.min(1.0, 10.0 * delta);
    camera.position.y += (ty - camera.position.y) * Math.min(1.0, 10.0 * delta);
    camera.position.z += (tz - camera.position.z) * Math.min(1.0, 10.0 * delta);
    camera.lookAt(carGroup.position.x * 0.5, 1.0, -20);
  }
}

function setCameraView(view) {
  cameraView = view;
  document.querySelectorAll('.camera-control-bar .hud-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`cam-${view}`);
  if (btn) btn.classList.add('active');
}

function showDialogue(speaker, msg, avatar = '💖') {
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
  document.getElementById('fashion-radar').style.display = 'block';
  document.getElementById('speedo-cluster').style.display = 'flex';
  document.getElementById('ability-bar').style.display = 'flex';

  isPlaying = true;
  showDialogue('Barbie', '"Let\'s cruise Beverly Hills! Press [1-5] to switch franchises, [SPACE] for Turbo Nitro, [E] for Laser Lipstick!"', '💖');
}

function exitToHub() {
  window.location.href = '../../index.html';
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function restartBarbieGame() {
  const modal = document.getElementById('endgame-modal');
  if (modal) modal.style.display = 'none';
  score = 0;
  carX = 0;
  targetX = 0;
  carGroup.position.set(0, 0, 0);
  document.getElementById('hud-fame-score').textContent = '0 PTS';
  showDialogue('Barbie', '"Starting a fresh glamorous lap down Rodeo Drive!"', '💖');
}
window.restartBarbieGame = restartBarbieGame;

window.addEventListener('DOMContentLoaded', initEngine);

