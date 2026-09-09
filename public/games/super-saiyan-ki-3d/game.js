/**
 * SUPER SAIYAN KI FIGHTER ⚡
 * Real-World Scouter Combat Telemetry, Kamehameha Beams,
 * Planet Namek Modular Streaming, Lord Frieza Boss Attacks & Instant Transmission.
 */

let scene, camera, renderer, clock;
let saiyanGroup, auraMesh, beamGroup;
let isPlaying = false;
let isAuraCharging = false;
let forwardSpeed = 0.6;
let kiEnergy = 100;
let bossHealth = 100;
let powerLevel = 9001;
let saiyanX = 0;
let targetX = 0;
const keys = {};

const namekChunks = [];
const CHUNK_SIZE = 65;
const TOTAL_CHUNKS = 6;

const bossAttacks = [];
const dragonBalls = [];
let cameraView = 'back';
let audioCtx;

function initEngine() {
  const canvas = document.getElementById('three-canvas');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x164e63);
  scene.fog = new THREE.FogExp2(0x164e63, 0.008);

  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 800);
  camera.position.set(0, 4.2, 8.5);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Namekian Green Sun Lighting
  const ambient = new THREE.AmbientLight(0xccfbf1, 0.8);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0x22d3ee, 1.3);
  sun.position.set(40, 70, 30);
  sun.castShadow = true;
  scene.add(sun);

  // Super Saiyan 3D Model & Aura
  saiyanGroup = createSuperSaiyanMesh();
  scene.add(saiyanGroup);

  beamGroup = new THREE.Group();
  scene.add(beamGroup);

  // Modular Namek Terrain
  buildModularNamek();

  // Spawn Boss Attacks & Dragon Balls
  spawnCombatHazards();

  // Listeners
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') triggerKiBlast();
    if (e.key === 'e' || e.key === 'E') triggerAuraCharge();
    if (e.key === 'f' || e.key === 'F') triggerInstantTransmission();
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') targetX = Math.max(-5.5, targetX - 2.8);
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') targetX = Math.min(5.5, targetX + 2.8);
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
  });
  window.addEventListener('resize', onWindowResize);

  clock = new THREE.Clock();
  requestAnimationFrame(animate);
}

/* ─── 3D MODEL: SUPER SAIYAN (GOKU) ─── */
function createSuperSaiyanMesh() {
  const g = new THREE.Group();
  const orangeMat = new THREE.MeshStandardMaterial({ color: 0xea580c });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 });
  const goldHair = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.4, roughness: 0.2, emissive: 0xeab308, emissiveIntensity: 0.3 });

  // Torso & Orange Martial Arts Gi
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.15, 0.55), orangeMat);
  body.position.y = 1.15;
  body.castShadow = true;
  g.add(body);

  const undershirt = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.58), blueMat);
  undershirt.position.set(0, 1.45, 0);
  g.add(undershirt);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 14), skinMat);
  head.position.y = 1.95;
  head.castShadow = true;
  g.add(head);

  // Spiky Super Saiyan Golden Hair
  const spikeGeo = new THREE.ConeGeometry(0.18, 0.9, 6);
  const spikeOffsets = [
    [0, 2.5, 0, 0, 0, 0],
    [-0.25, 2.4, 0, 0, 0, 0.35],
    [0.25, 2.4, 0, 0, 0, -0.35],
    [0, 2.35, -0.25, -0.35, 0, 0],
    [-0.35, 2.2, 0, 0, 0, 0.6],
    [0.35, 2.2, 0, 0, 0, -0.6]
  ];
  spikeOffsets.forEach(pos => {
    const spike = new THREE.Mesh(spikeGeo, goldHair);
    spike.position.set(pos[0], pos[1], pos[2]);
    spike.rotation.set(pos[3], pos[4], pos[5]);
    g.add(spike);
  });

  // Blue Belt Sash
  const sash = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.16, 0.6), blueMat);
  sash.position.set(0, 0.65, 0);
  g.add(sash);

  // Orange Pants & Blue Boots
  for (const x of [-0.28, 0.28]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.8, 8), orangeMat);
    leg.position.set(x, 0.25, 0);
    g.add(leg);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.45), blueMat);
    boot.position.set(x, -0.15, 0.05);
    g.add(boot);
  }

  // Golden Ki Aura Dome
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0xfacc15,
    wireframe: true,
    transparent: true,
    opacity: 0.4
  });
  auraMesh = new THREE.Mesh(new THREE.SphereGeometry(1.45, 12, 12), auraMat);
  auraMesh.position.y = 1.2;
  g.add(auraMesh);

  return g;
}

/* ─── MODULAR NAMEK TERRAIN ─── */
function buildModularNamek() {
  for (let i = 0; i < TOTAL_CHUNKS; i++) {
    const chunk = createNamekChunk();
    chunk.position.z = -i * CHUNK_SIZE;
    scene.add(chunk);
    namekChunks.push(chunk);
  }
}

function createNamekChunk() {
  const chunk = new THREE.Group();

  // Namekian Green Grass Crater
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.85 });
  const grass = new THREE.Mesh(new THREE.BoxGeometry(14, 0.5, CHUNK_SIZE), grassMat);
  grass.position.y = -0.25;
  grass.receiveShadow = true;
  chunk.add(grass);

  // Namekian Teal Water Trenches
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.1, metalness: 0.7 });
  for (const side of [-1, 1]) {
    const water = new THREE.Mesh(new THREE.PlaneGeometry(8, CHUNK_SIZE), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(side * 11, -0.2, 0);
    chunk.add(water);
  }

  // Namekian Spires & Rock Pillars
  const spireMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.9 });
  for (let z = -CHUNK_SIZE / 2 + 12; z < CHUNK_SIZE / 2; z += 24) {
    for (const side of [-1, 1]) {
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.8, 8, 8), spireMat);
      spire.position.set(side * 8.5, 4, z);
      spire.castShadow = true;
      chunk.add(spire);
    }
  }

  return chunk;
}

/* ─── VILLAINS: FRIEZA FORCE ATTACKS & DRAGON BALLS ─── */
function spawnCombatHazards() {
  // Frieza Death Beam Laser Hurdles
  for (let i = 0; i < 4; i++) {
    const beam = createDeathBeam();
    beam.position.set((i % 2 === 0 ? -3 : 3), 1.2, -45 - i * 38);
    scene.add(beam);
    bossAttacks.push(beam);
  }

  // Glowing 7-Star Dragon Balls
  for (let k = 0; k < 7; k++) {
    const ball = createDragonBallMesh();
    ball.position.set((Math.random() - 0.5) * 6, 1.2, -25 - k * 28);
    scene.add(ball);
    dragonBalls.push(ball);
  }
}

function createDeathBeam() {
  const g = new THREE.Group();
  const purpleGlow = new THREE.MeshBasicMaterial({ color: 0xc084fc });
  const redCore = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 12, 8), redCore);
  core.rotation.x = Math.PI / 2;
  g.add(core);

  const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 12, 8), purpleGlow);
  glow.rotation.x = Math.PI / 2;
  g.add(glow);

  g.isDeathBeam = true;
  g.hitRadius = 2.0;
  return g;
}

function createDragonBallMesh() {
  const g = new THREE.Group();
  const orbMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.1,
    metalness: 0.9,
    emissive: 0xfbbf24,
    emissiveIntensity: 0.5
  });
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 14), orbMat);
  g.add(orb);
  return g;
}

/* ─── PROCEDURAL KI AUDIO SYNTHESIZER ─── */
function getAudioCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }
  return audioCtx;
}

function playKiSound(type) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'kamehameha') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(250, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.35);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
    } else if (type === 'teleport') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.12);
      osc.start(now); osc.stop(now + 0.12);
    } else if (type === 'ball') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.25);
      osc.start(now); osc.stop(now + 0.25);
    }
  } catch (e) {}
}

/* ─── MAIN COMBAT ENGINE LOOP ─── */
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  if (isPlaying) {
    const forwardStep = forwardSpeed * delta * 60;

    // Move Namek Chunks
    for (let i = 0; i < namekChunks.length; i++) {
      const chunk = namekChunks[i];
      chunk.position.z += forwardStep;
      if (chunk.position.z > CHUNK_SIZE) {
        chunk.position.z -= TOTAL_CHUNKS * CHUNK_SIZE;
      }
    }

    // Aura Pulsing
    if (auraMesh) {
      auraMesh.rotation.y += 0.04;
      auraMesh.scale.setScalar(1 + Math.sin(Date.now() * 0.01) * 0.12);
    }

    // Lateral Movement
    saiyanX += (targetX - saiyanX) * Math.min(1.0, 14.0 * delta);
    saiyanGroup.position.x = saiyanX;
    saiyanGroup.rotation.y = (targetX - saiyanX) * -0.12;

    // Scouter Power Needle
    const needle = document.getElementById('speedo-needle');
    if (needle) {
      const angle = -120 + Math.min(1, powerLevel / 15000) * 240;
      needle.style.transform = `rotate(${angle}deg)`;
    }

    // Dragon Ball Collection
    for (let j = dragonBalls.length - 1; j >= 0; j--) {
      const ball = dragonBalls[j];
      ball.position.z += forwardStep;
      ball.rotation.y += 0.05;

      const dx = ball.position.x - saiyanGroup.position.x;
      const dz = ball.position.z - saiyanGroup.position.z;
      if (Math.sqrt(dx * dx + dz * dz) < 1.6) {
        playKiSound('ball');
        powerLevel += 500;
        document.getElementById('hud-ki-num').textContent = powerLevel.toLocaleString();
        ball.position.z = -130 - Math.random() * 40;
        showDialogue('Goku', '"Dragon Ball collected! The wish is within reach!"', '⭐');
      } else if (ball.position.z > 25) {
        ball.position.z = -130 - Math.random() * 40;
      }
    }

    // Radar & Boss Attacks
    const radarBlips = document.getElementById('radar-blips');
    if (radarBlips) radarBlips.innerHTML = '';

    let closestThreatDist = 999;

    bossAttacks.forEach((atk, idx) => {
      atk.position.z += forwardStep * 1.2;

      const relZ = atk.position.z - saiyanGroup.position.z;
      if (relZ < 0 && relZ > -85) {
        const distM = Math.round(Math.abs(relZ));
        if (distM < closestThreatDist) closestThreatDist = distM;

        if (radarBlips) {
          const blipX = 68 + (atk.position.x / 8.0) * 44;
          const blipY = 112 + (relZ / 85) * 85;
          const blip = document.createElement('div');
          blip.style.position = 'absolute';
          blip.style.left = `${blipX}px`;
          blip.style.top = `${blipY}px`;
          blip.style.width = '7px';
          blip.style.height = '7px';
          blip.style.borderRadius = '50%';
          blip.style.background = '#ef4444';
          blip.style.boxShadow = '0 0 8px #ef4444';
          blip.style.transform = 'translate(-50%, -50%)';
          radarBlips.appendChild(blip);
        }
      }

      // Proximity check
      const dx = atk.position.x - saiyanGroup.position.x;
      const dz = atk.position.z - saiyanGroup.position.z;
      if (Math.sqrt(dx * dx + dz * dz) < (atk.hitRadius || 2.0)) {
        kiEnergy = Math.max(0, kiEnergy - 20);
        document.getElementById('hud-ki').textContent = `${kiEnergy}% CHARGE`;
        showDialogue('Goku', '"That Death Beam was dangerously fast! Dodge with Instant Transmission!"', '⚡');
        atk.position.z = -130 - Math.random() * 40;
      } else if (atk.position.z > 25) {
        atk.position.z = -130 - Math.random() * 40;
      }
    });

    // Flasher alert
    const flasher = document.getElementById('hazard-flasher');
    if (flasher) {
      flasher.style.display = closestThreatDist <= 35 ? 'flex' : 'none';
    }
  }

  // Camera Tracking
  updateCamera(delta);

  renderer.render(scene, camera);
}

function updateCamera(delta) {
  let tx, ty, tz;
  if (cameraView === 'front') {
    tx = saiyanGroup.position.x * 0.35;
    ty = 2.4; tz = -5;
    camera.position.set(tx, ty, tz);
    camera.lookAt(saiyanGroup.position.x, 1.4, 20);
  } else if (cameraView === 'top') {
    tx = saiyanGroup.position.x;
    ty = 16; tz = 2;
    camera.position.set(tx, ty, tz);
    camera.lookAt(saiyanGroup.position.x, 0, -15);
  } else { // chase
    tx = saiyanGroup.position.x * 0.45;
    ty = 3.8; tz = 8.5;
    camera.position.x += (tx - camera.position.x) * Math.min(1.0, 10.0 * delta);
    camera.position.y += (ty - camera.position.y) * Math.min(1.0, 10.0 * delta);
    camera.position.z += (tz - camera.position.z) * Math.min(1.0, 10.0 * delta);
    camera.lookAt(saiyanGroup.position.x * 0.5, 1.4, -20);
  }
}

/* ─── KI COMBAT ACTIONS ─── */
function triggerKiBlast() {
  playKiSound('kamehameha');

  // Fire Blue Energy Beam
  const beamMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 30, 8), beamMat);
  beam.rotation.x = Math.PI / 2;
  beam.position.set(saiyanGroup.position.x, 1.4, saiyanGroup.position.z - 15);
  beamGroup.add(beam);

  setTimeout(() => { beamGroup.remove(beam); }, 180);

  // Damage Boss Attacks
  bossAttacks.forEach(atk => {
    if (Math.abs(atk.position.x - saiyanGroup.position.x) < 2.5 && atk.position.z < saiyanGroup.position.z) {
      bossHealth = Math.max(0, bossHealth - 15);
      document.getElementById('hud-boss-hp').textContent = `${bossHealth}% (LORD FRIEZA)`;
      atk.position.z = -130 - Math.random() * 40;
      showDialogue('Goku', '"KAMEHAMEHA! Direct hit on Frieza\'s attack!"', '⚡');
    }
  });
}

function triggerAuraCharge() {
  playKiSound('kamehameha');
  kiEnergy = 100;
  powerLevel += 1000;
  document.getElementById('hud-ki').textContent = '100% MAXIMUM';
  document.getElementById('hud-ki-num').textContent = powerLevel.toLocaleString();
  document.getElementById('speed-streaks').classList.add('active');
  setTimeout(() => { document.getElementById('speed-streaks').classList.remove('active'); }, 1200);
  showDialogue('Goku', '"HAAAA! Powering up past my limits!"', '🔥');
}

function triggerInstantTransmission() {
  playKiSound('teleport');
  targetX = targetX > 0 ? -4 : 4;
  showDialogue('Goku', '"Instant Transmission! Vanished from targeting locks!"', '🌀');
}

function setCameraView(view) {
  cameraView = view;
  document.querySelectorAll('.camera-control-bar .hud-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`cam-${view}`);
  if (btn) btn.classList.add('active');
}

function showDialogue(speaker, msg, avatar = '⚡') {
  const dlg = document.getElementById('dialogue-box');
  document.getElementById('dialogue-speaker').textContent = speaker;
  document.getElementById('dialogue-text').textContent = msg;
  document.getElementById('dialogue-avatar').textContent = avatar;
  dlg.style.display = 'flex';
  setTimeout(() => { dlg.style.display = 'none'; }, 4000);
}

function startGame() {
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('in-game-hud').style.display = 'flex';
  document.getElementById('scouter-radar').style.display = 'block';
  document.getElementById('speedo-cluster').style.display = 'flex';
  document.getElementById('ability-bar').style.display = 'flex';

  isPlaying = true;
  showDialogue('Goku', '"Planet Namek defense initiated! Frieza\'s forces are approaching!"', '⚡');
}

function openScouterDatabase() {
  const modal = document.getElementById('custom-modal');
  document.getElementById('modal-body').innerHTML = `
    <h2 class="modal-title-glow">📟 SCOUTER POWER ARCHIVES</h2>
    <div style="font-size:0.9rem;color:#94a3b8;margin:12px 0;">Battle Power Readings over Sector 07:</div>
    <div style="background:rgba(255,255,255,0.05);padding:14px;border-radius:12px;text-align:left;font-family:'Chakra Petch';">
      <div style="color:#22c55e;">GOKU (BASE): 3,000,000</div>
      <div style="color:#ffd60a;">GOKU (SUPER SAIYAN 1): 150,000,000</div>
      <div style="color:#ef4444;">LORD FRIEZA (100%): 120,000,000</div>
    </div>
    <button class="real-btn real-btn-primary" style="margin-top:16px;width:100%;" onclick="closeCustomModal()">CLOSE SCOUTER</button>
  `;
  modal.style.display = 'flex';
}

function closeCustomModal() {
  document.getElementById('custom-modal').style.display = 'none';
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

