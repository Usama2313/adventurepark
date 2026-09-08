/**
 * KITERETSU & KOROSUKE KARAKURI ROBO 3D - REAL-WORLD EDO TELEMETRY EDITION
 * Smooth 60 FPS physics, modular streaming track, Karakuri Katana slashes & voice speech
 */

let scene, camera, renderer, cameraRig, envManager;
let korosukeGroup, katanaMesh, slashArc;
let trackChunks = [];
let clockworkGears = [];
let mechanicalEnemies = [];
let gearsCollected = 0;
let score = 0;
let gearRPM = 120;
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
    back: new THREE.Vector3(0, 4, 9),
    front: new THREE.Vector3(0, 3, -9),
    left: new THREE.Vector3(-11, 4, 2),
    right: new THREE.Vector3(11, 4, 2),
    top: new THREE.Vector3(0, 16, 4)
  };

  envManager = new StageEnvironmentManager(scene, renderer);
  envManager.applyStage('water');

  window.gameAIAgent = new ArcadeAIAgent('Korosuke Robo 3D', 'game-container');

  buildKorosukeModel();
  buildModularTrack();
  spawnGearsAndEnemies();

  setupControls();
  window.addEventListener('resize', onWindowResize);

  if (window.speakCartoonLine) {
    setTimeout(() => window.speakCartoonLine('korosuke', 0), 1000);
  }

  animate();
}

function buildKorosukeModel() {
  korosukeGroup = new THREE.Group();

  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffd60a, roughness: 0.3 });
  const orangeMat = new THREE.MeshStandardMaterial({ color: 0xff7b00, roughness: 0.4 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x0099ff, roughness: 0.4 });

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 16), yellowMat);
  head.position.y = 1.6;
  korosukeGroup.add(head);

  // Topknot Hair (Chonmage)
  const topknot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.08, 0.5, 8),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
  );
  topknot.position.set(0, 2.6, 0);
  korosukeGroup.add(topknot);

  // Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const lEye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), eyeMat);
  lEye.position.set(-0.32, 1.65, 0.78);
  const rEye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), eyeMat);
  rEye.position.set(0.32, 1.65, 0.78);
  korosukeGroup.add(lEye, rEye);

  // Nose
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xff0022 })
  );
  nose.position.set(0, 1.55, 0.9);
  korosukeGroup.add(nose);

  // Body
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.65, 0.8, 16), orangeMat);
  body.position.y = 0.8;
  korosukeGroup.add(body);

  // Blue Round Feet
  const lFoot = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), blueMat);
  lFoot.position.set(-0.35, 0.3, 0);
  const rFoot = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), blueMat);
  rFoot.position.set(0.35, 0.3, 0);
  korosukeGroup.add(lFoot, rFoot);

  // Samurai Katana Sword
  katanaMesh = new THREE.Group();
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 1.4, 0.18),
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95, roughness: 0.1 })
  );
  blade.position.y = 0.7;
  const guard = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xffd60a })
  );
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x990000 })
  );
  grip.position.y = -0.2;
  katanaMesh.add(blade, guard, grip);
  katanaMesh.rotation.z = -Math.PI / 4;
  katanaMesh.position.set(0.7, 1.0, 0.4);
  korosukeGroup.add(katanaMesh);

  // Slash Arc Particle Trail
  const arcGeo = new THREE.RingGeometry(1.0, 1.4, 16, 1, 0, Math.PI);
  const arcMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0 });
  slashArc = new THREE.Mesh(arcGeo, arcMat);
  slashArc.rotation.x = Math.PI / 2;
  slashArc.position.set(0, 1.2, -0.8);
  korosukeGroup.add(slashArc);

  scene.add(korosukeGroup);
}

function buildModularTrack() {
  const CHUNK_COUNT = 6;
  const CHUNK_LEN = 60;

  for (let i = 0; i < CHUNK_COUNT; i++) {
    const chunk = new THREE.Group();
    chunk.position.z = -i * CHUNK_LEN;

    // Track surface
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(14, CHUNK_LEN),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
    );
    floor.rotation.x = -Math.PI / 2;
    chunk.add(floor);

    // Glowing Edo-era lanterns along borders
    for (let z = -CHUNK_LEN/2 + 5; z < CHUNK_LEN/2; z += 15) {
      [-7.5, 7.5].forEach(x => {
        const lantern = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 1.8, 0.6),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.6 })
        );
        lantern.position.set(x, 0.9, z);
        chunk.add(lantern);
      });
    }

    scene.add(chunk);
    trackChunks.push(chunk);
  }
}

function spawnGearsAndEnemies() {
  for (let i = 0; i < 35; i++) {
    const gear = new THREE.Group();
    const disk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 0.15, 16),
      new THREE.MeshStandardMaterial({ color: 0xffd60a, metalness: 0.9, roughness: 0.2 })
    );
    gear.add(disk);

    for (let t = 0; t < 8; t++) {
      const tooth = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.15, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xffd60a, metalness: 0.9 })
      );
      tooth.position.set(Math.cos(t * Math.PI / 4) * 0.75, 0, Math.sin(t * Math.PI / 4) * 0.75);
      gear.add(tooth);
    }

    const lanes = [-4, -1.3, 1.3, 4];
    gear.position.set(lanes[i % 4], 0.9, -20 - i * 18);
    scene.add(gear);
    clockworkGears.push(gear);
  }

  for (let i = 0; i < 15; i++) {
    const mech = new THREE.Group();

    // Spider Karakuri Robot Body
    const mBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.2, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x884422, metalness: 0.4, roughness: 0.5 })
    );
    mBody.position.y = 0.8;
    mech.add(mBody);

    // Glowing Eye
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    eye.position.set(0, 1.0, 0.75);
    mech.add(eye);

    const lanes = [-4, -1.3, 1.3, 4];
    mech.position.set(lanes[Math.floor(Math.random() * lanes.length)], 0, -35 - i * 36);
    scene.add(mech);
    mechanicalEnemies.push(mech);
  }
}

function katanaSlash() {
  if (isSlashing) return;
  isSlashing = true;
  if (window.arcadeSound) window.arcadeSound.playTone(680, 'sawtooth', 0.1, 0.25, -300);

  if (window.speakCartoonLine && Math.random() < 0.4) {
    window.speakCartoonLine('korosuke', 0);
  }

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

  mechanicalEnemies.forEach(mech => {
    if (mech.visible && mech.position.distanceTo(korosukeGroup.position) < 3.8) {
      mech.visible = false;
      score += 450;
      if (window.arcadeSound) window.arcadeSound.playExplosion();
      if (window.gameAIAgent) window.gameAIAgent.speak("⚔️ Ippon! Katana sliced the Karakuri bot!");
    }
  });
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
    if (e.key === ' ' || e.key === 'Enter') katanaSlash();
    if (e.key === 'c' || e.key === 'C') {
      const mode = cameraRig.cycleMode();
      setCameraView(mode);
    }
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

function switchGameStage(stage) {
  envManager.applyStage(stage);
  document.querySelectorAll('.stage-control-bar .hud-btn').forEach(b => b.classList.remove('active'));
  const target = document.getElementById(`btn-stage-${stage}`);
  if (target) target.classList.add('active');
  if (window.gameAIAgent) window.gameAIAgent.onStageChange(stage);
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

  mechanicalEnemies.forEach(mech => {
    if (!mech.visible) return;
    const relZ = mech.position.z - korosukeGroup.position.z;
    const relX = mech.position.x - korosukeGroup.position.x;
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
  korosukeGroup.position.x += (targetX - korosukeGroup.position.x) * Math.min(1.0, 16.0 * delta);

  // Jump physics
  if (isJumping) {
    playerY += velY * delta;
    velY -= 32 * delta;
    if (playerY <= 0) {
      playerY = 0;
      velY = 0;
      isJumping = false;
    }
  }
  korosukeGroup.position.y = playerY;

  // Stream track chunks
  const scrollSpeed = 50 * delta;
  trackChunks.forEach(chunk => {
    chunk.position.z += scrollSpeed;
    if (chunk.position.z > 60) {
      chunk.position.z -= 60 * trackChunks.length;
    }
  });

  // Gear RPM updates
  gearRPM = 120 + Math.floor(Math.abs(targetX) * 25) + Math.floor(gearsCollected * 2);
  const needle = document.getElementById('speedo-needle');
  const progress = document.getElementById('speedo-progress');
  const rpmVal = document.getElementById('hud-rpm');
  if (needle) {
    const angle = -120 + (gearRPM / 300) * 240;
    needle.style.transform = `translateX(-50%) rotate(${angle}deg)`;
  }
  if (progress) {
    const dash = 264 - (gearRPM / 300) * 264;
    progress.style.strokeDashoffset = dash;
  }
  if (rpmVal) rpmVal.innerText = gearRPM;

  // Clockwork Gears
  clockworkGears.forEach(gear => {
    gear.rotation.y += delta * 3.5;
    gear.position.z += scrollSpeed;

    if (gear.position.z > 15) {
      gear.position.z = -200 - Math.random() * 80;
      gear.visible = true;
    }

    if (gear.visible && gear.position.distanceTo(korosukeGroup.position) < 1.4) {
      gear.visible = false;
      gearsCollected++;
      score += 200;
      if (window.arcadeSound) window.arcadeSound.playCoin();
      if (gearsCollected % 10 === 0 && window.speakCartoonLine) {
        window.speakCartoonLine('korosuke', 1);
      }
    }
  });

  // Mechanical Obstacles
  let hazardActive = false;
  mechanicalEnemies.forEach(mech => {
    mech.position.z += scrollSpeed;
    if (mech.position.z > 15) {
      mech.position.z = -240 - Math.random() * 90;
      mech.visible = true;
    }

    if (mech.visible) {
      const relZ = mech.position.z - korosukeGroup.position.z;
      if (relZ < 0 && relZ > -25) hazardActive = true;

      if (mech.position.distanceTo(korosukeGroup.position) < 1.3) {
        handleGameOver();
      }
    }
  });

  // Hazard flasher
  const hazardEl = document.getElementById('hazard-flasher');
  if (hazardEl) {
    hazardEl.style.display = hazardActive ? 'block' : 'none';
  }

  updateRadarBlips();
  envManager.animate(delta);
  cameraRig.update(korosukeGroup.position, 0);

  // Update HUD
  document.getElementById('hud-gears').innerText = gearsCollected;
  document.getElementById('hud-score').innerText = score;

  renderer.render(scene, camera);
}

function handleGameOver() {
  if (isGameOver) return;
  isGameOver = true;
  if (window.arcadeSound) window.arcadeSound.playHit();

  if (window.speakCartoonLine) window.speakCartoonLine('shinchan', 0);

  const ticketsWon = Math.max(15, gearsCollected * 3 + Math.floor(score / 70));
  if (window.SmartCardBridge) SmartCardBridge.claimPayout('Kiteretsu & Korosuke 3D', score, ticketsWon);

  const modal = document.createElement('div');
  modal.className = 'game-modal-overlay';
  modal.innerHTML = `
    <div class="game-modal-card">
      <div class="game-modal-icon">🤖 ⚙️ 🏆</div>
      <h2 class="game-modal-title">INVENTION COMPLETE!</h2>
      <p style="color: #94a3b8; margin-top: 6px;">Clockwork Gears Collected: ${gearsCollected}</p>
      <div class="payout-box">
        <div style="color: #fff; font-size: 1.1rem;">HERO SCORE: <strong style="color: var(--neon-gold);">${score}</strong></div>
        <div class="payout-tickets">+${ticketsWon} ARCADE TICKETS WON!</div>
      </div>
      <div class="modal-actions">
        <button class="btn-action-primary" onclick="restartGame()">🔄 PLAY AGAIN</button>
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
