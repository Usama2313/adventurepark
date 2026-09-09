/**
 * ROBO BOMBERMAN: ALIEN BLAST & CUTE ANIMAL RESCUE 3D - REAL-WORLD ORDNANCE EDITION
 * Smooth 60 FPS physics, tactical sonar blips, blast temperature gauge & voice speech
 */

let scene, camera, renderer, cameraRig, envManager;
const ARENA_W = 13;
const ARENA_H = 11;
const TILE_SIZE = 2.0;

let robotPlayer;
let grid = []; // 0: Empty, 1: Solid Pillar, 2: Destructible Block, 3: Trapped Animal
let blockMeshes = {};
let activeBombs = [];
let enemies = [];
let animals = [];
let rescuedCount = 0;
let totalAnimals = 4;
let score = 0;
let blastTemp = 850;
let isGameOver = false;

const clock = new THREE.Clock();
const keys = { up: false, down: false, left: false, right: false };

function initGame() {
  const canvas = document.getElementById('three-canvas');

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0f1d, 0.012);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  cameraRig = new ArcadeCameraRig(camera);
  cameraRig.offsets = {
    top: new THREE.Vector3(0, 24, 6),
    back: new THREE.Vector3(0, 8, 12),
    front: new THREE.Vector3(0, 6, -12),
    left: new THREE.Vector3(-16, 8, 0),
    right: new THREE.Vector3(16, 8, 0)
  };
  cameraRig.setMode('top');

  envManager = new StageEnvironmentManager(scene, renderer);
  envManager.applyStage('water');

  window.gameAIAgent = new ArcadeAIAgent('Robo Bomberman 3D', 'game-container');

  buildArena();
  buildRobotPlayer();
  spawnEnemies();
  spawnTrappedAnimals();

  setupControls();
  window.addEventListener('resize', onWindowResize);

  if (window.speakCartoonLine) {
    setTimeout(() => window.speakCartoonLine('bomberman', 0), 1000);
  }

  // Apply Stage 1 UI theme
  if (window.StageUI) window.StageUI.apply(1, 'bomberman-rescue-3d', false);

  animate();
}

function gridToWorld(gx, gy) {
  const wx = (gx - (ARENA_W - 1) / 2) * TILE_SIZE;
  const wz = (gy - (ARENA_H - 1) / 2) * TILE_SIZE;
  return { x: wx, z: wz };
}

function worldToGrid(wx, wz) {
  const gx = Math.round(wx / TILE_SIZE + (ARENA_W - 1) / 2);
  const gy = Math.round(wz / TILE_SIZE + (ARENA_H - 1) / 2);
  return { x: Math.max(0, Math.min(ARENA_W - 1, gx)), y: Math.max(0, Math.min(ARENA_H - 1, gy)) };
}

function buildArena() {
  const groundGeo = new THREE.BoxGeometry(ARENA_W * TILE_SIZE + 2, 0.5, ARENA_H * TILE_SIZE + 2);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a233a, roughness: 0.7 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = -0.25;
  scene.add(ground);

  for (let x = 0; x < ARENA_W; x++) {
    grid[x] = [];
    for (let y = 0; y < ARENA_H; y++) {
      if (x === 0 || x === ARENA_W - 1 || y === 0 || y === ARENA_H - 1 || (x % 2 === 0 && y % 2 === 0)) {
        grid[x][y] = 1;
        createSolidPillar(x, y);
      } else if (Math.random() < 0.55 && !(x <= 2 && y <= 2)) {
        grid[x][y] = 2;
        createDestructibleBlock(x, y);
      } else {
        grid[x][y] = 0;
      }
    }
  }
}

function createSolidPillar(gx, gy) {
  const pGeo = new THREE.BoxGeometry(TILE_SIZE * 0.95, 1.8, TILE_SIZE * 0.95);
  const pMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.8, roughness: 0.2 });
  const pillar = new THREE.Mesh(pGeo, pMat);
  const pos = gridToWorld(gx, gy);
  pillar.position.set(pos.x, 0.9, pos.z);
  scene.add(pillar);
}

function createDestructibleBlock(gx, gy) {
  const bGeo = new THREE.BoxGeometry(TILE_SIZE * 0.9, 1.5, TILE_SIZE * 0.9);
  const bMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.8 });
  const block = new THREE.Mesh(bGeo, bMat);
  const pos = gridToWorld(gx, gy);
  block.position.set(pos.x, 0.75, pos.z);
  scene.add(block);
  blockMeshes[`${gx},${gy}`] = block;
}

function buildRobotPlayer() {
  robotPlayer = new THREE.Group();

  const torsoGeo = new THREE.BoxGeometry(0.9, 1.0, 0.7);
  const torsoMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.8 });
  const torso = new THREE.Mesh(torsoGeo, torsoMat);
  torso.position.y = 0.8;
  robotPlayer.add(torso);

  const headGeo = new THREE.BoxGeometry(0.65, 0.65, 0.65);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.6;
  robotPlayer.add(head);

  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.2, 0.1),
    new THREE.MeshBasicMaterial({ color: 0x00ffcc })
  );
  visor.position.set(0, 1.6, 0.33);
  robotPlayer.add(visor);

  const ant = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.4),
    new THREE.MeshBasicMaterial({ color: 0xff0055 })
  );
  ant.position.set(0, 2.05, 0);
  robotPlayer.add(ant);

  const startPos = gridToWorld(1, 1);
  robotPlayer.position.set(startPos.x, 0, startPos.z);
  scene.add(robotPlayer);
}

function spawnEnemies() {
  for (let i = 0; i < 3; i++) {
    const alien = new THREE.Group();
    const aBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x9d4edd, metalness: 0.5 })
    );
    aBody.position.y = 0.8;
    alien.add(aBody);

    const gx = ARENA_W - 2 - i * 2;
    const gy = ARENA_H - 2;
    const pos = gridToWorld(gx, gy);
    alien.position.set(pos.x, 0, pos.z);
    alien.userData = { type: 'alien', dir: { x: 0, y: 1 }, speed: 2.2, alive: true };
    scene.add(alien);
    enemies.push(alien);
  }

  for (let i = 0; i < 2; i++) {
    const chicken = new THREE.Group();
    const cBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    cBody.position.y = 0.6;
    const beak = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.3, 8),
      new THREE.MeshStandardMaterial({ color: 0xff7b00 })
    );
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.6, 0.45);
    chicken.add(cBody, beak);

    const gx = ARENA_W - 3;
    const gy = 2 + i * 3;
    const pos = gridToWorld(gx, gy);
    chicken.position.set(pos.x, 0, pos.z);
    chicken.userData = { type: 'chicken', dir: { x: 1, y: 0 }, speed: 3.2, alive: true };
    scene.add(chicken);
    enemies.push(chicken);
  }
}

function spawnTrappedAnimals() {
  const animalDefs = [
    { name: 'Dolphin 🐬', color: 0x00b4d8 },
    { name: 'Sea Turtle 🐢', color: 0x2b9348 },
    { name: 'Baby Otter 🦦', color: 0x8b5a2b },
    { name: 'Cute Duckling 🦆', color: 0xffd166 }
  ];

  const locations = [
    { x: 3, y: 5 },
    { x: 9, y: 3 },
    { x: 5, y: 7 },
    { x: 7, y: 5 }
  ];

  locations.forEach((loc, idx) => {
    const def = animalDefs[idx];
    const group = new THREE.Group();

    const aMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 12, 12),
      new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.3 })
    );
    aMesh.position.y = 0.5;

    const cage = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.2, 1.2),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true })
    );
    cage.position.y = 0.6;

    group.add(aMesh, cage);
    const pos = gridToWorld(loc.x, loc.y);
    group.position.set(pos.x, 0, pos.z);
    group.userData = { gx: loc.x, gy: loc.y, name: def.name, rescued: false, cage };

    grid[loc.x][loc.y] = 3;
    scene.add(group);
    animals.push(group);
  });
}

function dropBomb() {
  if (activeBombs.length >= 3 || isGameOver) return;

  const g = worldToGrid(robotPlayer.position.x, robotPlayer.position.z);
  const pos = gridToWorld(g.x, g.y);

  if (activeBombs.some(b => b.gx === g.x && b.gy === g.y)) return;

  const bombMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 })
  );
  bombMesh.position.set(pos.x, 0.55, pos.z);

  const fuseFlame = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff0055 })
  );
  fuseFlame.position.set(0, 0.65, 0);
  bombMesh.add(fuseFlame);

  scene.add(bombMesh);
  if (window.arcadeSound) window.arcadeSound.playTone(880, 'sine', 0.1, 0.2);

  if (window.speakCartoonLine && Math.random() < 0.35) {
    window.speakCartoonLine('bomberman', 0);
  }

  const bombObj = {
    gx: g.x,
    gy: g.y,
    mesh: bombMesh,
    timer: 2.5,
    fuse: fuseFlame
  };
  activeBombs.push(bombObj);
  document.getElementById('hud-bombs').innerText = `${activeBombs.length} / 3`;
}

function explodeBomb(bomb) {
  scene.remove(bomb.mesh);
  if (window.arcadeSound) window.arcadeSound.playExplosion();

  const blastDirs = [
    { x: 0, y: 0 },
    { x: 1, y: 0 }, { x: -1, y: 0 },
    { x: 0, y: 1 }, { x: 0, y: -1 }
  ];

  blastDirs.forEach(dir => {
    const tx = bomb.gx + dir.x;
    const ty = bomb.gy + dir.y;
    if (tx >= 0 && tx < ARENA_W && ty >= 0 && ty < ARENA_H) {
      createBlastVisual(tx, ty);

      if (grid[tx][ty] === 2) {
        grid[tx][ty] = 0;
        const b = blockMeshes[`${tx},${ty}`];
        if (b) {
          scene.remove(b);
          delete blockMeshes[`${tx},${ty}`];
          score += 120;
        }
      }

      animals.forEach(anim => {
        if (!anim.userData.rescued && anim.userData.gx === tx && anim.userData.gy === ty) {
          rescueAnimal(anim);
        }
      });

      enemies.forEach(enemy => {
        if (enemy.userData.alive) {
          const eg = worldToGrid(enemy.position.x, enemy.position.z);
          if (eg.x === tx && eg.y === ty) {
            enemy.userData.alive = false;
            scene.remove(enemy);
            score += 300;
            if (window.gameAIAgent) window.gameAIAgent.triggerCheer();
          }
        }
      });

      const pg = worldToGrid(robotPlayer.position.x, robotPlayer.position.z);
      if (pg.x === tx && pg.y === ty) {
        handleGameOver(false);
      }
    }
  });

  document.getElementById('hud-score').innerText = score;
}

function createBlastVisual(gx, gy) {
  const pos = gridToWorld(gx, gy);
  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff3300, wireframe: true })
  );
  flame.position.set(pos.x, 0.7, pos.z);
  scene.add(flame);
  setTimeout(() => scene.remove(flame), 350);
}

function rescueAnimal(animalGroup) {
  animalGroup.userData.rescued = true;
  animalGroup.remove(animalGroup.userData.cage);
  rescuedCount++;
  score += 600;
  if (window.arcadeSound) window.arcadeSound.playRescue();
  if (window.gameAIAgent) window.gameAIAgent.speak(`🎉 Rescued cute ${animalGroup.userData.name}! Outstanding hero work!`);
  
  if (window.speakCartoonLine) window.speakCartoonLine('bomberman', 2);

  document.getElementById('hud-rescued').innerText = `${rescuedCount} / ${totalAnimals}`;

  if (rescuedCount >= totalAnimals) {
    handleGameOver(true);
  }
}

function setupControls() {
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if (e.key === 'ArrowUp' || e.key === 'w') keys.up = true;
    if (e.key === 'ArrowDown' || e.key === 's') keys.down = true;
    if (e.key === ' ' || e.key === 'Enter') dropBomb();
    if (e.key === 'c' || e.key === 'C') {
      const mode = cameraRig.cycleMode();
      setCameraView(mode);
    }
  });

  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    if (e.key === 'ArrowUp' || e.key === 'w') keys.up = false;
    if (e.key === 'ArrowDown' || e.key === 's') keys.down = false;
  });

  const setupTouch = (id, key) => {
    const el = document.getElementById(id);
    if (el) {
      el.ontouchstart = (e) => { e.preventDefault(); keys[key] = true; };
      el.ontouchend = () => { keys[key] = false; };
    }
  };
  setupTouch('touch-up', 'up');
  setupTouch('touch-down', 'down');
  setupTouch('touch-left', 'left');
  setupTouch('touch-right', 'right');
  const tBomb = document.getElementById('touch-bomb');
  if (tBomb) tBomb.ontouchstart = (e) => { e.preventDefault(); dropBomb(); };
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

  enemies.forEach(enemy => {
    if (!enemy.userData.alive) return;
    const blip = document.createElement('div');
    blip.className = 'real-radar-blip enemy';
    const mapX = 50 + (enemy.position.x / (ARENA_W * TILE_SIZE)) * 80;
    const mapY = 50 + (enemy.position.z / (ARENA_H * TILE_SIZE)) * 80;
    blip.style.left = `${Math.max(10, Math.min(90, mapX))}%`;
    blip.style.top = `${Math.max(10, Math.min(90, mapY))}%`;
    container.appendChild(blip);
  });
}

function animate() {
  requestAnimationFrame(animate);
  if (isGameOver) return;

  const delta = Math.min(clock.getDelta(), 0.05);

  let moveX = 0;
  let moveZ = 0;
  const speed = 7.5 * delta;

  if (keys.left) moveX -= speed;
  if (keys.right) moveX += speed;
  if (keys.up) moveZ -= speed;
  if (keys.down) moveZ += speed;

  if (moveX !== 0 || moveZ !== 0) {
    const targetX = robotPlayer.position.x + moveX;
    const targetZ = robotPlayer.position.z + moveZ;
    const g = worldToGrid(targetX, targetZ);

    if (grid[g.x] && (grid[g.x][g.y] === 0 || grid[g.x][g.y] === 3)) {
      robotPlayer.position.x = targetX;
      robotPlayer.position.z = targetZ;
      robotPlayer.rotation.y = Math.atan2(moveX, moveZ);
    }
  }

  // Update Blast Temp Gauge
  blastTemp = 850 + activeBombs.length * 280 + Math.floor(Math.sin(Date.now() * 0.01) * 60);
  const needle = document.getElementById('speedo-needle');
  const progress = document.getElementById('speedo-progress');
  const tempVal = document.getElementById('hud-temp');
  if (needle) {
    const angle = -120 + (blastTemp / 2000) * 240;
    needle.style.transform = `translateX(-50%) rotate(${angle}deg)`;
  }
  if (progress) {
    const dash = 264 - (blastTemp / 2000) * 264;
    progress.style.strokeDashoffset = dash;
  }
  if (tempVal) tempVal.innerText = blastTemp;

  // Bombs timer
  let hazardActive = false;
  for (let i = activeBombs.length - 1; i >= 0; i--) {
    const b = activeBombs[i];
    b.timer -= delta;
    b.fuse.scale.setScalar(1 + Math.sin(Date.now() * 0.02) * 0.5);

    if (b.timer < 0.8) hazardActive = true;

    if (b.timer <= 0) {
      explodeBomb(b);
      activeBombs.splice(i, 1);
      document.getElementById('hud-bombs').innerText = `${activeBombs.length} / 3`;
    }
  }

  // Enemies AI Patrol
  enemies.forEach(enemy => {
    if (!enemy.userData.alive) return;
    const eSpeed = enemy.userData.speed * delta;
    const nextX = enemy.position.x + enemy.userData.dir.x * eSpeed;
    const nextZ = enemy.position.z + enemy.userData.dir.y * eSpeed;
    const eg = worldToGrid(nextX, nextZ);

    if (grid[eg.x] && grid[eg.x][eg.y] === 0) {
      enemy.position.x = nextX;
      enemy.position.z = nextZ;
    } else {
      const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
      enemy.userData.dir = dirs[Math.floor(Math.random() * dirs.length)];
    }

    if (enemy.position.distanceTo(robotPlayer.position) < 1.0) {
      hazardActive = true;
      handleGameOver(false);
    }
  });

  const hazardEl = document.getElementById('hazard-flasher');
  if (hazardEl) {
    hazardEl.style.display = hazardActive ? 'block' : 'none';
  }

  animals.forEach(anim => {
    if (anim.userData.rescued) {
      anim.rotation.y += delta * 4;
      anim.position.y = Math.sin(Date.now() * 0.006) * 0.4;
    }
  });

  updateRadarBlips();
  envManager.animate(delta);
  cameraRig.update(robotPlayer.position, 0);

  renderer.render(scene, camera);
}

function handleGameOver(isWin) {
  if (isGameOver) return;
  isGameOver = true;

  if (!isWin && window.arcadeSound) window.arcadeSound.playHit();
  if (window.speakCartoonLine) window.speakCartoonLine('universal', 0);

  const ticketsWon = Math.max(20, rescuedCount * 25 + Math.floor(score / 50));
  if (window.SmartCardBridge) SmartCardBridge.claimPayout('Robo Bomberman 3D', score, ticketsWon);

  const modal = document.createElement('div');
  modal.className = 'game-modal-overlay';
  modal.innerHTML = `
    <div class="game-modal-card">
      <div class="game-modal-icon">${isWin ? '🐬 🐢 🏆 🎉' : '💥 🤖'}</div>
      <h2 class="game-modal-title">${isWin ? 'ALL ANIMALS SAVED!' : 'ROBOT OVERHEAT!'}</h2>
      <p style="color: #94a3b8; margin-top: 6px;">Cute Animals Rescued: ${rescuedCount} / ${totalAnimals}</p>
      <div class="payout-box">
        <div style="color: #fff; font-size: 1.1rem;">HERO SCORE: <strong style="color: var(--neon-emerald);">${score}</strong></div>
        <div class="payout-tickets">+${ticketsWon} ARCADE TICKETS WON!</div>
      </div>
      <div class="modal-actions">
        <button class="btn-action-primary" onclick="restartGame()">🔄 RESCUE AGAIN</button>
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

