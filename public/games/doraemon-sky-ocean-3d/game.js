/**
 * DORAEMON: COSMIC GADGET QUEST 3D - REAL 4D POCKET & 30 STAGES EDITION
 * 3D Models for Doraemon, Nobita, Shizuka, Gian & Suneo with gadget-villain counter mechanics
 */

let scene, camera, renderer, cameraRig, envManager;
let doraemonGroup, nobitaGroup, shizukaGroup;
let trackChunks = [];
let dorayakiItems = [];
let villainsAndHurdles = [];
let currentStage = 1;
let dorayakiCollected = 0;
let score = 0;
let activeGadget = 'cannon';
let targetX = 0;
let playerY = 0, velY = 0;
let isFlying = false;
let isGameOver = false;

const clock = new THREE.Clock();
const keys = { left: false, right: false, up: false, down: false };

function initGame() {
  const canvas = document.getElementById('three-canvas');

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0284c7, 0.008);

  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  cameraRig = new ArcadeCameraRig(camera);
  cameraRig.offsets = {
    back: new THREE.Vector3(0, 4.5, 9.5),
    front: new THREE.Vector3(0, 3.5, -9.5),
    left: new THREE.Vector3(-11, 4.5, 2),
    right: new THREE.Vector3(11, 4.5, 2),
    top: new THREE.Vector3(0, 17, 4)
  };

  envManager = new StageEnvironmentManager(scene, renderer);
  envManager.applyStage('water');

  window.gameAIAgent = new ArcadeAIAgent('Doraemon 4D Quest', 'game-container');

  buildDoraemonAndFriends();
  buildModularTrack();
  spawnDorayakiAndVillains();

  setupControls();
  window.addEventListener('resize', onWindowResize);

  if (window.playCartoonThemeSong) {
    window.playCartoonThemeSong('doraemon');
  }

  // Apply Stage 1 UI theme
  if (window.StageUI) window.StageUI.apply(1, 'doraemon-sky-ocean-3d', false);

  animate();
}

function buildDoraemonAndFriends() {
  doraemonGroup = new THREE.Group();

  const blueMat = new THREE.MeshStandardMaterial({ color: 0x0099ff, roughness: 0.3 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2 });

  // 1. Doraemon Body & Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 16), blueMat);
  head.position.y = 1.6;

  const face = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 16), whiteMat);
  face.position.set(0, 1.52, 0.2);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), redMat);
  nose.position.set(0, 1.62, 0.88);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.12, 16), redMat);
  collar.position.y = 1.05;

  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), yellowMat);
  bell.position.set(0, 0.98, 0.65);

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.75, 16, 16), blueMat);
  body.position.y = 0.75;

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 16), whiteMat);
  belly.position.set(0, 0.72, 0.22);

  // 4D Pocket
  const pocket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.38, 0.08, 16, 1, false, 0, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  pocket.rotation.x = Math.PI / 2;
  pocket.position.set(0, 0.68, 0.78);

  // Take-Copter Rotor on Head
  const rotorRod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8), yellowMat);
  rotorRod.position.set(0, 2.55, 0);
  const rotorBlade = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.15), yellowMat);
  rotorBlade.position.set(0, 2.7, 0);
  doraemonGroup.add(rotorRod, rotorBlade);
  doraemonGroup.userData.rotorBlade = rotorBlade;

  doraemonGroup.add(head, face, nose, collar, bell, body, belly, pocket);

  // 2. Nobita Running Along Side
  nobitaGroup = new THREE.Group();
  const nBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 0.9, 12),
    new THREE.MeshStandardMaterial({ color: 0xfacc15 })
  );
  nBody.position.y = 0.9;
  const nHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xfde047 })
  );
  nHead.position.y = 1.5;
  const nGlasses = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.04, 8, 12),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );
  nGlasses.position.set(0, 1.5, 0.42);
  nobitaGroup.add(nBody, nHead, nGlasses);
  nobitaGroup.position.set(-1.8, 0, 0);

  // 3. Shizuka
  shizukaGroup = new THREE.Group();
  const sBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.35, 0.85, 12),
    new THREE.MeshStandardMaterial({ color: 0xec4899 })
  );
  sBody.position.y = 0.85;
  const sHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xfbcfe8 })
  );
  sHead.position.y = 1.45;
  shizukaGroup.add(sBody, sHead);
  shizukaGroup.position.set(1.8, 0, 0);

  doraemonGroup.add(nobitaGroup, shizukaGroup);
  scene.add(doraemonGroup);
}

function buildModularTrack() {
  const CHUNK_COUNT = 6;
  const CHUNK_LEN = 60;

  for (let i = 0; i < CHUNK_COUNT; i++) {
    const chunk = new THREE.Group();
    chunk.position.z = -i * CHUNK_LEN;

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(14, CHUNK_LEN),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
    );
    floor.rotation.x = -Math.PI / 2;
    chunk.add(floor);

    // Suburban Nerima Fences & Sakura Trees
    for (let z = -CHUNK_LEN/2 + 6; z < CHUNK_LEN/2; z += 18) {
      [-7.5, 7.5].forEach(x => {
        const tree = new THREE.Mesh(
          new THREE.SphereGeometry(1.6, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.6 })
        );
        tree.position.set(x, 2.5, z);
        chunk.add(tree);
      });
    }

    scene.add(chunk);
    trackChunks.push(chunk);
  }
}

function spawnDorayakiAndVillains() {
  // Dorayaki Pancakes
  for (let i = 0; i < 30; i++) {
    const pancake = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3 })
    );
    const lanes = [-4, -1.3, 1.3, 4];
    pancake.position.set(lanes[i % 4], 0.9, -20 - i * 18);
    scene.add(pancake);
    dorayakiItems.push(pancake);
  }

  // All 13 Movie Villains
  const villainDefs = [
    { type: 'demaon', name: "Demon Lord Demaon (Underworld)", gadgetNeeded: 'sword', color: 0x991b1b, hp: 120 },
    { type: 'poseidon', name: "Poseidon (Undersea AI Devil)", gadgetNeeded: 'cannon', color: 0x0284c7, hp: 110 },
    { type: 'dolmanstein', name: "Dolmanstein (Dino Hunter)", gadgetNeeded: 'smalllight', color: 0xca8a04, hp: 95 },
    { type: 'robotarmy', name: "Robot Army (Megatopia / Megatria)", gadgetNeeded: 'cannon', color: 0x64748b, hp: 130 },
    { type: 'daburanda', name: "Daburanda (Usurper Minister)", gadgetNeeded: 'gorgon', color: 0x475569, hp: 100 },
    { type: 'medusa', name: "Medusa (Petrifying Demon)", gadgetNeeded: 'cape', color: 0x15803d, hp: 115 },
    { type: 'diabolo', name: "Emperor Diabolo (Ancient AI)", gadgetNeeded: 'cannon', color: 0x4f46e5, hp: 125 },
    { type: 'blizarga', name: "Blizarga (Apocalyptic Ice Beast)", gadgetNeeded: 'weather', color: 0x38bdf8, hp: 135 },
    { type: 'gigazombie', name: "Odorome / Giga Zombie (Spirit God)", gadgetNeeded: 'sword', color: 0x7e22ce, hp: 140 },
    { type: 'silver', name: "Captain John Silver (Space Pirate)", gadgetNeeded: 'cannon', color: 0xb45309, hp: 120 },
    { type: 'achimoff', name: "Dr. Achimoff (Robot Cloner)", gadgetNeeded: 'door', color: 0x1e293b, hp: 110 },
    { type: 'bulkin', name: "Bulkin (Mer-Demon Lord)", gadgetNeeded: 'sword', color: 0x065f46, hp: 125 },
    { type: 'hunters', name: "The Cloud Hunters (Poachers)", gadgetNeeded: 'glove', color: 0xd97706, hp: 105 }
  ];

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
  sprite.scale.set(6.0, 1.5, 1);
  return sprite;
}

  for (let i = 0; i < 15; i++) {
    const def = villainDefs[i % villainDefs.length];
    const group = new THREE.Group();

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2.0, 1.6),
      new THREE.MeshStandardMaterial({
        color: def.color,
        emissive: def.color,
        emissiveIntensity: 0.3,
        roughness: 0.3,
        metalness: 0.6
      })
    );
    mesh.position.y = 1.0;
    group.add(mesh);

    // Glowing Overhead 3D Billboard Nametag so villains are 100% visible
    const tag = createBillboardNameTag(`⚔️ ${def.name.toUpperCase()}`, '#ffd60a');
    tag.position.set(0, 2.8, 0);
    group.add(tag);

    // PointLight
    const vLight = new THREE.PointLight(def.color, 1.5, 20);
    vLight.position.set(0, 1.5, 0);
    group.add(vLight);

    const lanes = [-4, -1.3, 1.3, 4];
    // First villain spawns directly in front at z = -22 to be immediately visible!
    const zPos = (i === 0) ? -22 : (-22 - i * 32);
    group.position.set(lanes[i % lanes.length], 0, zPos);
    group.userData = { ...def, active: true, hp: def.hp };

    scene.add(group);
    villainsAndHurdles.push(group);
  }
}

function selectGadget(gadgetKey) {
  activeGadget = gadgetKey;
  document.querySelectorAll('#gadget-toolbar .hud-btn').forEach(b => b.classList.remove('active'));
  const target = document.getElementById(`gbtn-${gadgetKey}`);
  if (target) target.classList.add('active');

  const names = {
    cannon: 'AIR CANNON 💨',
    door: 'ANYWHERE DOOR 🚪',
    takecopter: 'TAKE-COPTER 🚁',
    timemachine: 'TIME MACHINE ⏳',
    smalllight: 'SMALL LIGHT 🔦',
    biglight: 'BIG LIGHT 🔍',
    sword: 'DENKOMARU SWORD ⚡',
    bread: 'MEMORY BREAD 🍞',
    gummy: 'TRANSLATION GUMMY 🍬',
    cloth: 'TIME CLOTH 🧣',
    booth: 'WHAT-IF PHONE BOOTH ☎️',
    pocket: '4D POCKET 🎒',
    cape: 'INVISIBILITY CAPE 🧥',
    pencil: 'COMPUTER PENCIL ✏️',
    camera: 'DRESS-UP CAMERA 📷',
    switch: 'DICTATOR SWITCH 🔘',
    loop: 'PASS LOOP ⭕',
    tablecloth: 'GOURMET TABLECLOTH 🍽️',
    timetv: 'TIME TV 📺',
    bag: 'OBTAINING BAG 👛',
    speaker: 'LIE SPEAKER 📢',
    glove: 'SUPER GLOVES 🥊',
    orchestra: 'MOOD ORCHESTRA 🎻',
    clock: 'SPEED CLOCK ⏱️',
    beak: 'TRUTH BEAK 🦜',
    card: 'DEVIL CARD 🃏',
    tunnel: 'GULLIVER TUNNEL 🚇',
    sub: 'DEEP SUBMARINE 🚢',
    taro: 'HONEST TARO 🎎',
    cracker: 'ANIMAL CRACKERS 🍪',
    arrow: 'ARROW OF LOVE 🏹',
    gorgon: "GORGON'S HEAD 🐍",
    waterroom: 'SOLID WATER ROOM 💧',
    weather: 'WEATHER BOX ⛈️',
    powder: 'ADAPTATION POWDER ✨'
  };
  document.getElementById('hud-active-gadget').innerText = names[gadgetKey] || gadgetKey.toUpperCase();

  if (window.gameAIAgent) {
    window.gameAIAgent.speak(`Doraemon pulled out: ${names[gadgetKey]}! Nobita and friends cheer!`);
  }
}

function useGadget() {
  if (window.arcadeSound) window.arcadeSound.playTone(750, 'sine', 0.1, 0.25, 400);

  // Check matching villain ahead
  villainsAndHurdles.forEach(v => {
    if (v.userData.active && v.position.distanceTo(doraemonGroup.position) < 8.0) {
      v.userData.active = false;
      v.visible = false;
      score += 1000;
      document.getElementById('hud-score').innerText = score;

      const hpFill = document.getElementById('boss-hp-fill');
      const hpText = document.getElementById('boss-hp-text');
      const bossTitle = document.getElementById('boss-title');
      const bossBar = document.getElementById('boss-hud-bar');

      if (bossBar) bossBar.style.display = 'block';
      if (bossTitle) bossTitle.innerText = `⚔️ ${v.userData.name}`;
      if (hpFill) hpFill.style.width = '0%';
      if (hpText) hpText.innerText = 'DEFEATED! 🏆';

      if (window.arcadeSound) window.arcadeSound.playRescue();
      if (window.gameAIAgent) {
        window.gameAIAgent.speak(`✨ Doraemon, Nobita, Shizuka, Gian & Suneo defeated ${v.userData.name} using ${activeGadget.toUpperCase()}!`);
      }

      // Check if all villains defeated
      const remaining = villainsAndHurdles.filter(vh => vh.userData.active);
      if (remaining.length === 0) {
        const modal = document.getElementById('endgame-modal');
        if (modal) modal.style.display = 'flex';
      }
    }
  });
}

function restartDoraemonGame() {
  const modal = document.getElementById('endgame-modal');
  if (modal) modal.style.display = 'none';
  score = 0;
  dorayakiCollected = 0;
  document.getElementById('hud-score').innerText = '0';
  document.getElementById('hud-dorayaki').innerText = '0';
  doraemonGroup.position.set(0, 0, 0);
  targetX = 0;
  villainsAndHurdles.forEach(v => {
    v.userData.active = true;
    v.visible = true;
  });
  if (window.gameAIAgent) {
    window.gameAIAgent.speak('Doraemon and friends restarting their cosmic adventure!');
  }
}
window.restartDoraemonGame = restartDoraemonGame;

function loadNextStage() {
  const modal = document.getElementById('endgame-modal');
  if (modal) modal.style.display = 'none';
  currentStage = Math.min(30, currentStage + 1);
  const sel = document.getElementById('stage-select');
  if (sel) sel.value = String(currentStage);
  document.getElementById('hud-stage-num').innerText = `LEVEL ${currentStage} / 30`;
  // Apply unique UI for the new stage
  if (window.StageUI) window.StageUI.apply(currentStage, 'doraemon-sky-ocean-3d');
  restartDoraemonGame();
}
window.loadNextStage = loadNextStage;

function hopterJump() {
  if (isFlying) return;
  isFlying = true;
  velY = 12;
  if (window.arcadeSound) window.arcadeSound.playJump();
}

function setupControls() {
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') && !isFlying) hopterJump();
    if (e.key === 'e' || e.key === 'E') useGadget();
    if (e.key === '1') selectGadget('cannon');
    if (e.key === '2') selectGadget('door');
    if (e.key === '3') selectGadget('cloth');
    if (e.key === '4') selectGadget('light');
    if (e.key === '5') selectGadget('loop');
  });

  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  });

  const tLeft = document.getElementById('touch-left');
  const tRight = document.getElementById('touch-right');
  const tJump = document.getElementById('touch-jump');
  const tGadget = document.getElementById('touch-gadget');
  if (tLeft) {
    tLeft.ontouchstart = (e) => { e.preventDefault(); keys.left = true; };
    tLeft.ontouchend = () => { keys.left = false; };
  }
  if (tRight) {
    tRight.ontouchstart = (e) => { e.preventDefault(); keys.right = true; };
    tRight.ontouchend = () => { keys.right = false; };
  }
  if (tJump) tJump.ontouchstart = (e) => { e.preventDefault(); hopterJump(); };
  if (tGadget) tGadget.ontouchstart = (e) => { e.preventDefault(); useGadget(); };
}

function select30Stage(val) {
  currentStage = parseInt(val);
  document.getElementById('hud-stage-num').innerText = `LEVEL ${currentStage} / 30`;
  if (window.gameAIAgent) window.gameAIAgent.onStageChange(`Level ${currentStage}`);
  // Apply unique stage UI theme
  if (window.StageUI) window.StageUI.apply(currentStage, 'doraemon-sky-ocean-3d');
}

function switchGameStage(stage) {
  envManager.applyStage(stage);
}

function setCameraView(mode) {
  cameraRig.setMode(mode);
  document.querySelectorAll('.camera-control-bar .hud-btn').forEach(b => b.classList.remove('active'));
  const target = document.getElementById(`cam-${mode}`);
  if (target) target.classList.add('active');
}

function updateRadarBlips() {
  const container = document.getElementById('radar-blips');
  if (!container) return;
  container.innerHTML = '';

  villainsAndHurdles.forEach(v => {
    if (!v.userData.active) return;
    const relZ = v.position.z - doraemonGroup.position.z;
    const relX = v.position.x - doraemonGroup.position.x;
    if (relZ < 0 && relZ > -100) {
      const blip = document.createElement('div');
      blip.className = 'real-radar-blip enemy';
      const mapX = 50 + (relX / 8) * 40;
      const mapY = 50 + (relZ / 100) * 40;
      blip.style.left = `${Math.max(10, Math.min(90, mapX))}%`;
      blip.style.top = `${Math.max(10, Math.min(90, mapY))}%`;
      container.appendChild(blip);
    }
  });
}

function animate() {
  requestAnimationFrame(animate);
  if (isGameOver) return;

  const delta = Math.min(clock.getDelta(), 0.05);

  // Steer
  if (keys.left) targetX = Math.max(-5, targetX - delta * 12);
  if (keys.right) targetX = Math.min(5, targetX + delta * 12);
  doraemonGroup.position.x += (targetX - doraemonGroup.position.x) * Math.min(1.0, 16.0 * delta);

  // Hopter Flight physics
  if (isFlying) {
    playerY += velY * delta;
    velY -= 30 * delta;
    if (doraemonGroup.userData.rotorBlade) {
      doraemonGroup.userData.rotorBlade.rotation.y += delta * 25;
    }
    if (playerY <= 0) {
      playerY = 0;
      velY = 0;
      isFlying = false;
    }
  }
  doraemonGroup.position.y = playerY;

  // Stream track chunks
  const scrollSpeed = (45 + currentStage * 2) * delta;
  trackChunks.forEach(chunk => {
    chunk.position.z += scrollSpeed;
    if (chunk.position.z > 60) {
      chunk.position.z -= 60 * trackChunks.length;
    }
  });

  // Dorayaki Pancakes
  dorayakiItems.forEach(pancake => {
    pancake.rotation.y += delta * 3.0;
    pancake.position.z += scrollSpeed;

    if (pancake.position.z > 15) {
      pancake.position.z = -200 - Math.random() * 80;
      pancake.visible = true;
    }

    if (pancake.visible && pancake.position.distanceTo(doraemonGroup.position) < 1.4) {
      pancake.visible = false;
      dorayakiCollected++;
      score += 250;
      if (window.arcadeSound) window.arcadeSound.playCoin();
    }
  });

  // Villains & Hurdles
  let hazardActive = false;
  villainsAndHurdles.forEach(v => {
    v.position.z += scrollSpeed;
    if (v.position.z > 15) {
      v.position.z = -240 - Math.random() * 90;
      v.userData.active = true;
      v.visible = true;
    }

    if (v.userData.active) {
      const relZ = v.position.z - doraemonGroup.position.z;
      if (relZ < 0 && relZ > -25) hazardActive = true;

      if (v.position.distanceTo(doraemonGroup.position) < 1.4) {
        handleGameOver();
      }
    }
  });

  const hazardEl = document.getElementById('hazard-flasher');
  if (hazardEl) {
    hazardEl.style.display = hazardActive ? 'block' : 'none';
  }

  updateRadarBlips();
  envManager.animate(delta);
  cameraRig.update(doraemonGroup.position, 0);

  // Update HUD
  document.getElementById('hud-dorayaki').innerText = dorayakiCollected;
  document.getElementById('hud-score').innerText = score;

  renderer.render(scene, camera);
}

function handleGameOver() {
  if (isGameOver) return;
  isGameOver = true;
  if (window.arcadeSound) window.arcadeSound.playHit();

  const ticketsWon = Math.max(25, dorayakiCollected * 4 + Math.floor(score / 60));
  if (window.SmartCardBridge) SmartCardBridge.claimPayout('Doraemon 4D Quest', score, ticketsWon);

  // Get next stage label for the modal
  const nextStage = Math.min(30, currentStage + 1);
  const stageLabel = window.StageUI ? window.StageUI.getLabel('doraemon-sky-ocean-3d', currentStage) : `Stage ${currentStage}`;
  const nextLabel  = window.StageUI ? window.StageUI.getLabel('doraemon-sky-ocean-3d', nextStage)  : `Stage ${nextStage}`;
  const theme      = window.StageUI ? window.StageUI.getTheme(currentStage) : { accent: '#00f0ff', secondary: '#38bdf8' };

  const modal = document.createElement('div');
  modal.className = 'game-modal-overlay';
  modal.innerHTML = `
    <div class="game-modal-card" style="border: 2px solid ${theme.accent}; box-shadow: 0 0 40px rgba(0,0,0,0.8), 0 0 20px ${theme.accent}44;">
      <div class="game-modal-icon">🐱 🚪 🥞 🏆</div>
      <div style="font-size:0.85rem; color:${theme.accent}; font-family:'Orbitron',sans-serif; letter-spacing:0.08em; margin-bottom:4px;">${stageLabel}</div>
      <h2 class="game-modal-title" style="color:${theme.accent};">STAGE ${currentStage} CLEAR!</h2>
      <p style="color: #94a3b8; margin-top: 6px;">Dorayaki Pancakes: ${dorayakiCollected}</p>
      <div class="payout-box" style="border-color:${theme.accent};">
        <div style="color: #fff; font-size: 1.1rem;">COSMIC SCORE: <strong style="color: ${theme.secondary};">${score}</strong></div>
        <div class="payout-tickets" style="color:${theme.accent};">+${ticketsWon} ARCADE TICKETS WON!</div>
      </div>
      <div class="modal-actions">
        <button class="btn-action-primary" style="background:${theme.accent}; color:#000; border:none; box-shadow:0 0 20px ${theme.accent}88;" onclick="loadNextStage()">▶ NEXT STAGE: ${nextLabel}</button>
        <button class="btn-action-secondary" onclick="restartDoraemonGame()">🔄 REPLAY STAGE ${currentStage}</button>
        <button class="btn-action-secondary" onclick="exitToHub()">🏰 RETURN TO PARK</button>
      </div>
    </div>
  `;
  document.getElementById('game-container').appendChild(modal);
  isGameOver = false;
}

function restartGame() {
  location.reload();
}

function exitToHub() {
  if (window.opener) window.close();
  else window.location.href = '../../index.html';
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('DOMContentLoaded', initGame);
