/**
 * NINJA SHADOW BLADE 3D - SHINOBI STEALTH EDITION
 * Katana sword slashes, Shuriken star throws, Samurai warlord bosses & 30 stages
 */

let scene, camera, renderer, cameraRig, envManager;
let ninjaGroup, katanaMesh, slashArc;
let trackChunks = [];
let shurikensCollected = 25;
let samuraiEnemies = [];
let currentStage = 1;
let score = 0;
let targetX = 0;
let playerY = 0, velY = 0;
let isJumping = false;
let isSlashing = false;
let isGameOver = false;

const clock = new THREE.Clock();
const keys = { left: false, right: false, up: false, down: false };

function initGame() {
  const canvas = document.getElementById('three-canvas');

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0f172a, 0.008);

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

  window.gameAIAgent = new ArcadeAIAgent('Ninja Shadow Blade', 'game-container');

  buildNinjaModel();
  buildModularTrack();
  spawnSamuraiEnemies();

  setupControls();
  window.addEventListener('resize', onWindowResize);

  if (window.playCartoonThemeSong) {
    window.playCartoonThemeSong('ninja');
  }

  // Apply Stage 1 UI theme
  if (window.StageUI) window.StageUI.apply(1, 'ninja-shadow-blade-3d', false);

  animate();
}

function buildNinjaModel() {
  ninjaGroup = new THREE.Group();

  const blackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });

  // Head with Ninja Mask
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.75, 16, 16), blackMat);
  head.position.y = 1.6;

  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.18, 0.1),
    new THREE.MeshBasicMaterial({ color: 0xff0055 })
  );
  visor.position.set(0, 1.62, 0.72);

  // Body
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.5, 1.0, 12), blackMat);
  body.position.y = 0.8;

  // Red Shinobi Sash
  const sash = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.15, 12), redMat);
  sash.position.y = 0.8;

  // Katana Sword
  katanaMesh = new THREE.Group();
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 1.5, 0.18),
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95, roughness: 0.1 })
  );
  blade.position.y = 0.75;
  const guard = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b })
  );
  katanaMesh.add(blade, guard);
  katanaMesh.rotation.z = -Math.PI / 4;
  katanaMesh.position.set(0.7, 1.0, 0.4);

  const arcGeo = new THREE.RingGeometry(1.0, 1.4, 16, 1, 0, Math.PI);
  const arcMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0 });
  slashArc = new THREE.Mesh(arcGeo, arcMat);
  slashArc.rotation.x = Math.PI / 2;
  slashArc.position.set(0, 1.2, -0.8);

  ninjaGroup.add(head, visor, body, sash, katanaMesh, slashArc);
  scene.add(ninjaGroup);
}

function buildModularTrack() {
  const CHUNK_COUNT = 6;
  const CHUNK_LEN = 60;

  for (let i = 0; i < CHUNK_COUNT; i++) {
    const chunk = new THREE.Group();
    chunk.position.z = -i * CHUNK_LEN;

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(14, CHUNK_LEN),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
    );
    floor.rotation.x = -Math.PI / 2;
    chunk.add(floor);

    scene.add(chunk);
    trackChunks.push(chunk);
  }
}

function spawnSamuraiEnemies() {
  for (let i = 0; i < 15; i++) {
    const samurai = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.6, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x990000, metalness: 0.6 })
    );
    body.position.y = 0.8;
    samurai.add(body);

    const lanes = [-4, -1.3, 1.3, 4];
    samurai.position.set(lanes[Math.floor(Math.random() * lanes.length)], 0, -35 - i * 36);
    samurai.userData = { active: true };

    scene.add(samurai);
    samuraiEnemies.push(samurai);
  }
}

function katanaSlash() {
  if (isSlashing) return;
  isSlashing = true;
  if (window.arcadeSound) window.arcadeSound.playTone(720, 'sawtooth', 0.1, 0.25, -300);

  slashArc.material.opacity = 0.9;
  let frame = 0;
  function slashAnim() {
    frame++;
    katanaMesh.rotation.x = Math.sin(frame * 0.4) * 2.0;
    slashArc.material.opacity = Math.max(0, 0.9 - frame * 0.08);

    if (frame < 12) {
      requestAnimationFrame(slashAnim);
    } else {
      katanaMesh.rotation.x = 0;
      isSlashing = false;
    }
  }
  slashAnim();

  samuraiEnemies.forEach(s => {
    if (s.userData.active && s.position.distanceTo(ninjaGroup.position) < 3.8) {
      s.userData.active = false;
      s.visible = false;
      score += 450;
      if (window.arcadeSound) window.arcadeSound.playExplosion();
      if (window.gameAIAgent) window.gameAIAgent.speak("⚔️ Ippon! Katana sliced the Samurai Warlord!");
    }
  });
}

function jump() {
  if (isJumping) return;
  isJumping = true;
  velY = 12;
  if (window.arcadeSound) window.arcadeSound.playJump();
}

function setupControls() {
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') && !isJumping) jump();
    if (e.key === 'f' || e.key === 'F' || e.key === 'Enter') katanaSlash();
  });

  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  });

  const tLeft = document.getElementById('touch-left');
  const tRight = document.getElementById('touch-right');
  const tJump = document.getElementById('touch-jump');
  const tSlash = document.getElementById('touch-slash');
  if (tLeft) {
    tLeft.ontouchstart = (e) => { e.preventDefault(); keys.left = true; };
    tLeft.ontouchend = () => { keys.left = false; };
  }
  if (tRight) {
    tRight.ontouchstart = (e) => { e.preventDefault(); keys.right = true; };
    tRight.ontouchend = () => { keys.right = false; };
  }
  if (tJump) tJump.ontouchstart = (e) => { e.preventDefault(); jump(); };
  if (tSlash) tSlash.ontouchstart = (e) => { e.preventDefault(); katanaSlash(); };
}

function select30Stage(val) {
  currentStage = parseInt(val);
  document.getElementById('hud-stage-num').innerText = `LEVEL ${currentStage} / 30`;
  if (window.StageUI && typeof currentStage !== 'undefined') window.StageUI.apply(currentStage, 'ninja-shadow-blade-3d');
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

  samuraiEnemies.forEach(s => {
    if (!s.userData.active) return;
    const relZ = s.position.z - ninjaGroup.position.z;
    const relX = s.position.x - ninjaGroup.position.x;
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
  ninjaGroup.position.x += (targetX - ninjaGroup.position.x) * Math.min(1.0, 16.0 * delta);

  if (isJumping) {
    playerY += velY * delta;
    velY -= 30 * delta;
    if (playerY <= 0) {
      playerY = 0;
      velY = 0;
      isJumping = false;
    }
  }
  ninjaGroup.position.y = playerY;

  const scrollSpeed = (55 + currentStage * 2) * delta;
  trackChunks.forEach(chunk => {
    chunk.position.z += scrollSpeed;
    if (chunk.position.z > 60) {
      chunk.position.z -= 60 * trackChunks.length;
    }
  });

  let hazardActive = false;
  samuraiEnemies.forEach(s => {
    s.position.z += scrollSpeed;
    if (s.position.z > 15) {
      s.position.z = -240 - Math.random() * 90;
      s.userData.active = true;
      s.visible = true;
    }

    if (s.userData.active) {
      const relZ = s.position.z - ninjaGroup.position.z;
      if (relZ < 0 && relZ > -25) hazardActive = true;

      if (s.position.distanceTo(ninjaGroup.position) < 1.3) {
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
  cameraRig.update(ninjaGroup.position, 0);

  document.getElementById('hud-score').innerText = score;
  renderer.render(scene, camera);
}

function handleGameOver() {
  if (isGameOver) return;
  isGameOver = true;
  if (window.arcadeSound) window.arcadeSound.playHit();

  const ticketsWon = Math.max(30, Math.floor(score / 50));
  if (window.SmartCardBridge) SmartCardBridge.claimPayout('Ninja Shadow Blade 3D', score, ticketsWon);

  const modal = document.createElement('div');
  modal.className = 'game-modal-overlay';
  modal.innerHTML = `
    <div class="game-modal-card">
      <div class="game-modal-icon">🥷 ⚔️ 🏆</div>
      <h2 class="game-modal-title">SHINOBI MISSION COMPLETE!</h2>
      <div class="payout-box">
        <div style="color: #fff; font-size: 1.1rem;">NINJA SCORE: <strong style="color: var(--neon-gold);">${score}</strong></div>
        <div class="payout-tickets">+${ticketsWon} ARCADE TICKETS WON!</div>
      </div>
      <div class="modal-actions">
        <button class="btn-action-primary" onclick="restartGame()">🔄 STAGE AGAIN</button>
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

