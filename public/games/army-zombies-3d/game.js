/**
 * PROJECT IGI & ARMY ZOMBIE APOKALYYPSE 3D - TACTICAL COMMANDO EDITION
 * Rifle shooting, zombie headshots, IGI enemy soldiers & 30 stages
 */

let scene, camera, renderer, cameraRig, envManager;
let commandoGroup, rifleMesh;
let trackChunks = [];
let zombiesKilled = 0;
let ammoCount = 30;
let zombieEnemies = [];
let currentStage = 1;
let score = 0;
let targetX = 0;
let playerY = 0, velY = 0;
let isJumping = false;
let isShooting = false;
let isGameOver = false;

const clock = new THREE.Clock();
const keys = { left: false, right: false, up: false, down: false };

function initGame() {
  const canvas = document.getElementById('three-canvas');

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0f1d, 0.01);

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

  window.gameAIAgent = new ArcadeAIAgent('Project IGI Commando', 'game-container');

  buildCommandoModel();
  buildModularTrack();
  spawnZombies();

  setupControls();
  window.addEventListener('resize', onWindowResize);

  if (window.playCartoonThemeSong) {
    window.playCartoonThemeSong('zombie_igi');
  }

  // Apply Stage 1 UI theme
  if (window.StageUI) window.StageUI.apply(1, 'army-zombies-3d', false);

  animate();
}

function buildCommandoModel() {
  commandoGroup = new THREE.Group();

  const camoMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf87171, roughness: 0.3 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 16), skinMat);
  head.position.y = 1.6;

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.78, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), camoMat);
  helmet.position.y = 1.65;

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 0.7), camoMat);
  body.position.y = 0.8;

  // Assault Rifle
  rifleMesh = new THREE.Group();
  const barrel = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.12, 1.4),
    blackMat
  );
  barrel.position.z = -0.7;
  const mag = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.4, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b })
  );
  mag.position.set(0, -0.2, -0.3);
  rifleMesh.add(barrel, mag);
  rifleMesh.position.set(0.6, 0.9, -0.2);

  commandoGroup.add(head, helmet, body, rifleMesh);
  scene.add(commandoGroup);
}

function buildModularTrack() {
  const CHUNK_COUNT = 6;
  const CHUNK_LEN = 60;

  for (let i = 0; i < CHUNK_COUNT; i++) {
    const chunk = new THREE.Group();
    chunk.position.z = -i * CHUNK_LEN;

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(14, CHUNK_LEN),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
    );
    floor.rotation.x = -Math.PI / 2;
    chunk.add(floor);

    scene.add(chunk);
    trackChunks.push(chunk);
  }
}

function spawnZombies() {
  for (let i = 0; i < 15; i++) {
    const zGroup = new THREE.Group();

    const zBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.6, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 })
    );
    zBody.position.y = 0.8;

    const zHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x166534 })
    );
    zHead.position.y = 1.6;

    const eyes = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.12, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    eyes.position.set(0, 1.62, 0.48);

    zGroup.add(zBody, zHead, eyes);
    const lanes = [-4, -1.3, 1.3, 4];
    zGroup.position.set(lanes[Math.floor(Math.random() * lanes.length)], 0, -35 - i * 36);
    zGroup.userData = { active: true };

    scene.add(zGroup);
    zombieEnemies.push(zGroup);
  }
}

function fireRifle() {
  if (isShooting || ammoCount <= 0) return;
  isShooting = true;
  ammoCount--;
  document.getElementById('hud-ammo').innerText = `${ammoCount} / 120`;

  if (window.arcadeSound) window.arcadeSound.playTone(850, 'sawtooth', 0.08, 0.3, -400);

  // Muzzle Flash
  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffd60a })
  );
  flash.position.set(0.6, 0.9, -1.2);
  commandoGroup.add(flash);
  setTimeout(() => commandoGroup.remove(flash), 80);

  zombieEnemies.forEach(z => {
    if (z.userData.active && z.position.distanceTo(commandoGroup.position) < 14.0) {
      z.userData.active = false;
      z.visible = false;
      zombiesKilled++;
      score += 350;
      if (window.arcadeSound) window.arcadeSound.playExplosion();
      if (window.gameAIAgent) window.gameAIAgent.speak("💥 Headshot! Zombie eliminated!");
      document.getElementById('hud-kills').innerText = `${zombiesKilled} KILLS`;
    }
  });

  setTimeout(() => { isShooting = false; }, 120);
}

function jump() {
  if (isJumping) return;
  isJumping = true;
  velY = 11.5;
  if (window.arcadeSound) window.arcadeSound.playJump();
}

function setupControls() {
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if ((e.key === 'ArrowUp' || e.key === 'w') && !isJumping) jump();
    if (e.key === ' ' || e.key === 'Enter') fireRifle();
  });

  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  });

  const tLeft = document.getElementById('touch-left');
  const tRight = document.getElementById('touch-right');
  const tJump = document.getElementById('touch-jump');
  const tFire = document.getElementById('touch-fire');
  if (tLeft) {
    tLeft.ontouchstart = (e) => { e.preventDefault(); keys.left = true; };
    tLeft.ontouchend = () => { keys.left = false; };
  }
  if (tRight) {
    tRight.ontouchstart = (e) => { e.preventDefault(); keys.right = true; };
    tRight.ontouchend = () => { keys.right = false; };
  }
  if (tJump) tJump.ontouchstart = (e) => { e.preventDefault(); jump(); };
  if (tFire) tFire.ontouchstart = (e) => { e.preventDefault(); fireRifle(); };
}

function select30Stage(val) {
  currentStage = parseInt(val);
  document.getElementById('hud-stage-num').innerText = `LEVEL ${currentStage} / 30`;
  if (window.StageUI && typeof currentStage !== 'undefined') window.StageUI.apply(currentStage, 'army-zombies-3d');
  if (window.gameAIAgent) window.gameAIAgent.onStageChange(`Level ${currentStage}`);
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

  zombieEnemies.forEach(z => {
    if (!z.userData.active) return;
    const relZ = z.position.z - commandoGroup.position.z;
    const relX = z.position.x - commandoGroup.position.x;
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

  if (keys.left) targetX = Math.max(-5, targetX - delta * 12);
  if (keys.right) targetX = Math.min(5, targetX + delta * 12);
  commandoGroup.position.x += (targetX - commandoGroup.position.x) * Math.min(1.0, 16.0 * delta);

  if (isJumping) {
    playerY += velY * delta;
    velY -= 30 * delta;
    if (playerY <= 0) {
      playerY = 0;
      velY = 0;
      isJumping = false;
    }
  }
  commandoGroup.position.y = playerY;

  const scrollSpeed = (50 + currentStage * 2) * delta;
  trackChunks.forEach(chunk => {
    chunk.position.z += scrollSpeed;
    if (chunk.position.z > 60) {
      chunk.position.z -= 60 * trackChunks.length;
    }
  });

  let hazardActive = false;
  zombieEnemies.forEach(z => {
    z.position.z += scrollSpeed;
    if (z.position.z > 15) {
      z.position.z = -240 - Math.random() * 90;
      z.userData.active = true;
      z.visible = true;
    }

    if (z.userData.active) {
      const relZ = z.position.z - commandoGroup.position.z;
      if (relZ < 0 && relZ > -25) hazardActive = true;

      if (z.position.distanceTo(commandoGroup.position) < 1.3) {
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
  cameraRig.update(commandoGroup.position, 0);

  document.getElementById('hud-score').innerText = score;
  renderer.render(scene, camera);
}

function handleGameOver() {
  if (isGameOver) return;
  isGameOver = true;
  if (window.arcadeSound) window.arcadeSound.playHit();

  const ticketsWon = Math.max(30, zombiesKilled * 10 + Math.floor(score / 50));
  if (window.SmartCardBridge) SmartCardBridge.claimPayout('Project IGI Zombie Commando', score, ticketsWon);

  const modal = document.createElement('div');
  modal.className = 'game-modal-overlay';
  modal.innerHTML = `
    <div class="game-modal-card">
      <div class="game-modal-icon">🧟 🔫 🏆</div>
      <h2 class="game-modal-title">MISSION CLEAR!</h2>
      <p style="color: #94a3b8; margin-top: 6px;">Zombies Kills: ${zombiesKilled}</p>
      <div class="payout-box">
        <div style="color: #fff; font-size: 1.1rem;">COMMANDO SCORE: <strong style="color: var(--neon-gold);">${score}</strong></div>
        <div class="payout-tickets">+${ticketsWon} ARCADE TICKETS WON!</div>
      </div>
      <div class="modal-actions">
        <button class="btn-action-primary" onclick="restartGame()">🔄 RE-ENTER OUTPOST</button>
        <button class="btn-action-secondary" onclick="exitToHub()">🏰 RETURN TO PARK</button>
      </div>
    </div>
  `;
  document.getElementById('game-container').appendChild(modal);
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

