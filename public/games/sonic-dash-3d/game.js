/**
 * SONIC SEGA DASH: GENERATIONS 🦔⚡
 * Real-World Supersonic 3D Running Engine with Green Hill Zone Modular Streaming,
 * Loop-de-Loop Speedometers, Badnik Motobugs, Spin Dash Revs & Chaos Emeralds.
 */

let scene, camera, renderer, clock;
let sonicGroup, sonicBallMesh;
let isPlaying = false;
let isSpinDashing = false;
let isBallForm = false;
let sonicSpeed = 0.55;
let targetSonicSpeed = 0.55;
let ringCount = 0;
let distanceMeters = 0;
let stageStartTime = 0;
let sonicLaneX = 0;
let targetLaneX = 0;
let sonicY = 0;
let sonicVelY = 0;
let isGrounded = true;
const keys = {};

const zoneChunks = [];
const CHUNK_SIZE = 55;
const TOTAL_CHUNKS = 6;

const badniksAndSpikes = [];
const goldenRings = [];
let cameraView = 'back';
let audioCtx;

function initEngine() {
  const canvas = document.getElementById('three-canvas');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x38bdf8);
  scene.fog = new THREE.FogExp2(0x38bdf8, 0.008);

  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 800);
  camera.position.set(0, 3.8, 8.2);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Tropical Green Hill Sun
  const ambient = new THREE.AmbientLight(0xffedd5, 0.75);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfef08a, 1.35);
  sun.position.set(30, 60, 20);
  sun.castShadow = true;
  scene.add(sun);

  // Sonic 3D Model & Spin Dash Ball
  sonicGroup = createSonicMesh();
  scene.add(sonicGroup);

  // Modular Green Hill Zone
  buildModularGreenHill();

  // Spawn Badniks & Golden Rings
  spawnBadniksAndRings();

  // Listeners
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') triggerJump();
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') triggerSpinDash(true);
    if (e.key === ' ' && isPlaying) triggerHomingAttack();
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') targetLaneX = Math.max(-4.5, targetLaneX - 2.8);
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') targetLaneX = Math.min(4.5, targetLaneX + 2.8);
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') triggerSpinDash(false);
  });
  window.addEventListener('resize', onWindowResize);

  clock = new THREE.Clock();
  requestAnimationFrame(animate);
}

/* ─── 3D MODEL: SONIC THE HEDGEHOG ─── */
function createSonicMesh() {
  const g = new THREE.Group();
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const blackMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

  // Running Sonic Body Group
  const runBody = new THREE.Group();

  // Torso
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 14), blueMat);
  torso.position.y = 1.1;
  torso.castShadow = true;
  runBody.add(torso);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 12), skinMat);
  belly.position.set(0, 1.1, 0.22);
  belly.scale.set(1.0, 1.0, 0.5);
  runBody.add(belly);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.58, 16, 16), blueMat);
  head.position.y = 1.85;
  head.castShadow = true;
  runBody.add(head);

  // Spikes (3 Back Quills)
  const quillGeo = new THREE.ConeGeometry(0.24, 0.9, 8);
  for (let k = 0; k < 3; k++) {
    const quill = new THREE.Mesh(quillGeo, blueMat);
    quill.position.set(0, 1.95 - k * 0.28, -0.6 - k * 0.1);
    quill.rotation.x = -Math.PI / 2.3;
    runBody.add(quill);
  }

  // Muzzle & Black Nose
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), skinMat);
  muzzle.position.set(0, 1.75, 0.45);
  muzzle.scale.set(1.0, 0.8, 0.8);
  runBody.add(muzzle);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), blackMat);
  nose.position.set(0, 1.85, 0.72);
  runBody.add(nose);

  // Iconic Red Power Sneakers with White Buckle Strap
  const shoeGeo = new THREE.BoxGeometry(0.38, 0.22, 0.65);
  for (const x of [-0.28, 0.28]) {
    const shoe = new THREE.Mesh(shoeGeo, redMat);
    shoe.position.set(x, 0.2, 0.08);
    runBody.add(shoe);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.12), whiteMat);
    buckle.position.set(x, 0.28, 0.1);
    runBody.add(buckle);
  }

  g.add(runBody);
  g.runBody = runBody;

  // Spin Dash Blue Sphere Ball
  const ballMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, wireframe: true });
  sonicBallMesh = new THREE.Mesh(new THREE.SphereGeometry(0.85, 14, 14), ballMat);
  sonicBallMesh.position.y = 0.85;
  sonicBallMesh.visible = false;
  g.add(sonicBallMesh);

  return g;
}

/* ─── MODULAR GREEN HILL ZONE TRACK ─── */
function buildModularGreenHill() {
  for (let i = 0; i < TOTAL_CHUNKS; i++) {
    const chunk = createGreenHillChunk();
    chunk.position.z = -i * CHUNK_SIZE;
    scene.add(chunk);
    zoneChunks.push(chunk);
  }
}

function createGreenHillChunk() {
  const chunk = new THREE.Group();

  // Green Grassy Running Surface
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 });
  const grass = new THREE.Mesh(new THREE.BoxGeometry(13, 0.4, CHUNK_SIZE), grassMat);
  grass.position.y = -0.2;
  grass.receiveShadow = true;
  chunk.add(grass);

  // Checkerboard Dirt Cliffs on Left & Right
  const dirtMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9 });
  for (const side of [-1, 1]) {
    const cliff = new THREE.Mesh(new THREE.BoxGeometry(6, 8, CHUNK_SIZE), dirtMat);
    cliff.position.set(side * 9.5, 3.8, 0);
    chunk.add(cliff);
  }

  // Iconic Tropical Palm Trees
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
  const frondMat = new THREE.MeshStandardMaterial({ color: 0x15803d });
  for (let z = -CHUNK_SIZE / 2 + 10; z < CHUNK_SIZE / 2; z += 26) {
    for (const side of [-1, 1]) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 6, 8), trunkMat);
      trunk.position.y = 3;
      tree.add(trunk);

      const top = new THREE.Mesh(new THREE.ConeGeometry(2.5, 1.2, 6), frondMat);
      top.position.y = 6.2;
      tree.add(top);

      tree.position.set(side * 6.5, 0, z);
      chunk.add(tree);
    }
  }

  // Giant Loop-de-Loop Track Arch
  const loopMat = new THREE.MeshStandardMaterial({ color: 0xb45309 });
  const loop = new THREE.Mesh(new THREE.TorusGeometry(8.5, 1.2, 8, 24), loopMat);
  loop.position.set(0, 8.5, 0);
  chunk.add(loop);

  return chunk;
}

/* ─── VILLAINS: BADNIKS & GOLDEN RINGS ─── */
function spawnBadniksAndRings() {
  // Motobug Badniks (Dr. Eggman's Caterpillars)
  for (let i = 0; i < 4; i++) {
    const badnik = createMotobugMesh();
    badnik.position.set((i % 2 === 0 ? -3 : 3), 0, -45 - i * 38);
    scene.add(badnik);
    badniksAndSpikes.push(badnik);
  }

  // Spike Barricade Hurdles
  for (let k = 0; k < 3; k++) {
    const spike = createSpikeHurdle();
    spike.position.set(0, 0, -65 - k * 50);
    scene.add(spike);
    badniksAndSpikes.push(spike);
  }

  // Golden Rings
  for (let r = 0; r < 14; r++) {
    const ring = createRingMesh();
    ring.position.set((r % 3 === 0 ? -3 : r % 3 === 1 ? 0 : 3), 1.0, -18 - r * 14);
    scene.add(ring);
    goldenRings.push(ring);
  }
}

function createMotobugMesh() {
  const g = new THREE.Group();
  const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.6 });
  const grayMat = new THREE.MeshStandardMaterial({ color: 0x475569 });

  // Chassis
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 12), redMat);
  body.position.y = 0.7;
  g.add(body);

  // Single Wheel under body
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.25, 12), grayMat);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.y = 0.4;
  g.add(wheel);

  // Antennae
  for (const x of [-0.3, 0.3]) {
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8), grayMat);
    ant.position.set(x, 1.4, 0.2);
    g.add(ant);
  }

  g.isBadnik = true;
  g.hitRadius = 1.8;
  return g;
}

function createSpikeHurdle() {
  const g = new THREE.Group();
  const silverMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
  for (let x = -2.5; x <= 2.5; x += 1.0) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.2, 6), silverMat);
    cone.position.set(x, 0.6, 0);
    g.add(cone);
  }
  g.isSpike = true;
  g.hitRadius = 2.0;
  return g;
}

function createRingMesh() {
  const g = new THREE.Group();
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xeab308,
    emissiveIntensity: 0.4,
    metalness: 0.9,
    roughness: 0.1
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.09, 8, 16), goldMat);
  g.add(ring);
  return g;
}

/* ─── PROCEDURAL AUDIO SYNTHESIZER ─── */
function getAudioCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }
  return audioCtx;
}

function playSonicSfx(type) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'ring') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'jump') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.16);
      osc.start(now); osc.stop(now + 0.16);
    } else if (type === 'spindash') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.25);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    }
  } catch (e) {}
}

/* ─── MAIN SUPERSONIC ENGINE LOOP ─── */
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  if (isPlaying) {
    targetSonicSpeed = isSpinDashing ? 1.55 : 0.65;
    sonicSpeed += (targetSonicSpeed - sonicSpeed) * Math.min(1.0, 6.0 * delta);

    const speedMPH = Math.round(sonicSpeed * 120);
    document.getElementById('hud-sonic-speed').textContent = speedMPH;
    document.getElementById('hud-sonic-gear').textContent = isSpinDashing ? 'SPIN DASH ⚡' : 'MACH RUN';

    const needle = document.getElementById('speedo-needle');
    if (needle) {
      const angle = -120 + Math.min(1, speedMPH / 220) * 240;
      needle.style.transform = `rotate(${angle}deg)`;
    }

    // Distance and Timer
    distanceMeters += sonicSpeed * delta * 60 * 1.5;
    document.getElementById('hud-distance').textContent = `${(distanceMeters / 1000).toFixed(2)} KM`;

    const elapsed = (Date.now() - stageStartTime) / 1000;
    const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const secs = String(Math.floor(elapsed % 60)).padStart(2, '0');
    const ms = String(Math.floor((elapsed * 100) % 100)).padStart(2, '0');
    document.getElementById('hud-timer').textContent = `${mins}:${secs}.${ms}`;

    const forwardStep = sonicSpeed * delta * 60;

    // Move Green Hill Chunks
    for (let i = 0; i < zoneChunks.length; i++) {
      const chunk = zoneChunks[i];
      chunk.position.z += forwardStep;
      if (chunk.position.z > CHUNK_SIZE) {
        chunk.position.z -= TOTAL_CHUNKS * CHUNK_SIZE;
      }
    }

    // Jump Physics
    if (!isGrounded) {
      sonicVelY -= 0.02;
      sonicY += sonicVelY;
      if (sonicY <= 0) {
        sonicY = 0;
        sonicVelY = 0;
        isGrounded = true;
      }
    }
    sonicGroup.position.y = sonicY;

    // Lateral Steering
    sonicLaneX += (targetLaneX - sonicLaneX) * Math.min(1.0, 14.0 * delta);
    sonicGroup.position.x = sonicLaneX;
    sonicGroup.rotation.y = (targetLaneX - sonicLaneX) * -0.12;

    // Collect Rings
    for (let j = goldenRings.length - 1; j >= 0; j--) {
      const ring = goldenRings[j];
      ring.position.z += forwardStep;
      ring.rotation.y += 0.06;

      const dx = ring.position.x - sonicGroup.position.x;
      const dy = ring.position.y - sonicGroup.position.y;
      const dz = ring.position.z - sonicGroup.position.z;
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 1.4) {
        ringCount++;
        document.getElementById('hud-rings').textContent = `🪙 x${ringCount}`;
        playSonicSfx('ring');
        ring.position.z = -120 - Math.random() * 40;
      } else if (ring.position.z > 25) {
        ring.position.z = -120 - Math.random() * 40;
      }
    }

    // Radar & Badniks
    const radarBlips = document.getElementById('radar-blips');
    if (radarBlips) radarBlips.innerHTML = '';

    let closestThreatDist = 999;
    let threatName = '';

    badniksAndSpikes.forEach((threat, idx) => {
      threat.position.z += forwardStep;

      const relZ = threat.position.z - sonicGroup.position.z;
      if (relZ < 0 && relZ > -85) {
        const distM = Math.round(Math.abs(relZ));
        if (distM < closestThreatDist) {
          closestThreatDist = distM;
          threatName = threat.isBadnik ? `MOTOBUG BADNIK [${distM}M]` : `SPIKE BARRICADE [${distM}M]`;
        }

        if (radarBlips) {
          const blipX = 68 + (threat.position.x / 8.0) * 44;
          const blipY = 112 + (relZ / 85) * 85;
          const blip = document.createElement('div');
          blip.style.position = 'absolute';
          blip.style.left = `${blipX}px`;
          blip.style.top = `${blipY}px`;
          blip.style.width = '7px';
          blip.style.height = '7px';
          blip.style.borderRadius = '50%';
          blip.style.background = threat.isBadnik ? '#ef4444' : '#facc15';
          blip.style.boxShadow = threat.isBadnik ? '0 0 6px #ef4444' : '0 0 6px #facc15';
          blip.style.transform = 'translate(-50%, -50%)';
          radarBlips.appendChild(blip);
        }
      }

      // Proximity
      const dx = threat.position.x - sonicGroup.position.x;
      const dz = threat.position.z - sonicGroup.position.z;
      if (Math.sqrt(dx * dx + dz * dz) < (threat.hitRadius || 1.8)) {
        if (isSpinDashing || !isGrounded) {
          // Smashed Badnik!
          threat.position.z = -130 - Math.random() * 40;
          ringCount += 5;
          document.getElementById('hud-rings').textContent = `🪙 x${ringCount}`;
          showDialogue('Sonic', '"Another Badnik trashed! Keep moving!"', '🦔');
        } else {
          // Lost rings!
          ringCount = Math.max(0, ringCount - 10);
          document.getElementById('hud-rings').textContent = `🪙 x${ringCount}`;
          showDialogue('Sonic', '"Ouch! Watch those spikes!"', '🦔');
          threat.position.z = -130 - Math.random() * 40;
        }
      } else if (threat.position.z > 25) {
        threat.position.z = -130 - Math.random() * 40;
      }
    });

    // Flasher alert
    const flasher = document.getElementById('hazard-flasher');
    const flasherText = document.getElementById('hazard-text');
    if (flasher && flasherText) {
      if (closestThreatDist <= 35) {
        flasher.style.display = 'flex';
        flasherText.textContent = `⚠️ ALERT: ${threatName}!`;
      } else {
        flasher.style.display = 'none';
      }
    }
  }

  // Camera Tracking
  updateCamera(delta);

  renderer.render(scene, camera);
}

function updateCamera(delta) {
  let tx, ty, tz;
  if (cameraView === 'front') {
    tx = sonicGroup.position.x * 0.35;
    ty = sonicGroup.position.y + 1.8; tz = -6;
    camera.position.set(tx, ty, tz);
    camera.lookAt(sonicGroup.position.x, sonicGroup.position.y + 1.0, 20);
  } else if (cameraView === 'top') {
    tx = sonicGroup.position.x;
    ty = sonicGroup.position.y + 14; tz = 2;
    camera.position.set(tx, ty, tz);
    camera.lookAt(sonicGroup.position.x, 0, -15);
  } else { // chase
    tx = sonicGroup.position.x * 0.45;
    ty = sonicGroup.position.y + 3.4; tz = 8.2;
    camera.position.x += (tx - camera.position.x) * Math.min(1.0, 10.0 * delta);
    camera.position.y += (ty - camera.position.y) * Math.min(1.0, 10.0 * delta);
    camera.position.z += (tz - camera.position.z) * Math.min(1.0, 10.0 * delta);
    camera.lookAt(sonicGroup.position.x * 0.5, sonicGroup.position.y + 1.0, -20);
  }
}

/* ─── ABILITIES: JUMP, SPIN DASH, HOMING ATTACK ─── */
function triggerJump() {
  if (isGrounded) {
    sonicVelY = 0.36;
    isGrounded = false;
    playSonicSfx('jump');
  }
}

function triggerSpinDash(active) {
  isSpinDashing = active;
  if (active) {
    playSonicSfx('spindash');
    sonicGroup.runBody.visible = false;
    sonicBallMesh.visible = true;
    document.getElementById('hud-spin-status').textContent = 'REVVED UP 🔥';
    document.getElementById('speed-streaks').classList.add('active');
  } else {
    sonicGroup.runBody.visible = true;
    sonicBallMesh.visible = false;
    document.getElementById('hud-spin-status').textContent = 'READY ⚡';
    document.getElementById('speed-streaks').classList.remove('active');
  }
}

function triggerHomingAttack() {
  playSonicSfx('jump');
  targetSonicSpeed = 1.8;
  showDialogue('Sonic', '"Homing Attack! Target locked!"', '⚡');
  setTimeout(() => { targetSonicSpeed = 0.65; }, 1200);
}

function setCameraView(view) {
  cameraView = view;
  document.querySelectorAll('.camera-control-bar .hud-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`cam-${view}`);
  if (btn) btn.classList.add('active');
}

function showDialogue(speaker, msg, avatar = '🦔') {
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
  document.getElementById('sonic-radar').style.display = 'block';
  document.getElementById('speedo-cluster').style.display = 'flex';
  document.getElementById('ability-bar').style.display = 'flex';

  isPlaying = true;
  stageStartTime = Date.now();
  showDialogue('Sonic', '"Green Hill Zone Act 1! Let\'s show Eggman what supersonic speed looks like!"', '🦔');
}

function openEmeraldVault() {
  const modal = document.getElementById('custom-modal');
  document.getElementById('modal-body').innerHTML = `
    <h2 class="modal-title-glow">💎 CHAOS EMERALD VAULT</h2>
    <div style="font-size:0.9rem;color:#94a3b8;margin:12px 0;">Collect all 7 Chaos Emeralds to transform into Super Sonic:</div>
    <div style="background:rgba(255,255,255,0.05);padding:14px;border-radius:12px;text-align:left;font-family:'Chakra Petch';">
      <div style="color:#22c55e;">1. GREEN EMERALD - UNLOCKED</div>
      <div style="color:#00f0ff;">2. CYAN EMERALD - UNLOCKED</div>
      <div style="color:#ffd60a;">3. YELLOW EMERALD - UNLOCKED</div>
      <div style="color:#ff007f;">4. PURPLE EMERALD - COLLECT 100 RINGS</div>
    </div>
    <button class="real-btn real-btn-primary" style="margin-top:16px;width:100%;" onclick="closeCustomModal()">CLOSE VAULT</button>
  `;
  modal.style.display = 'flex';
}

function openSonicShop() {
  const modal = document.getElementById('custom-modal');
  document.getElementById('modal-body').innerHTML = `
    <h2 class="modal-title-glow">🛍️ RING POWER-UP SHOP</h2>
    <div style="background:rgba(255,255,255,0.05);padding:14px;border-radius:12px;text-align:left;font-family:'Chakra Petch';">
      <div>TOTAL RINGS: <strong style="color:#ffd60a;">🪙 x${ringCount}</strong></div>
      <div>MAGNET SHIELD: <strong style="color:#00f0ff;">AVAILABLE</strong></div>
      <div>SUPER SNEAKERS: <strong style="color:#22c55e;">READY</strong></div>
    </div>
    <button class="real-btn real-btn-primary" style="margin-top:16px;width:100%;" onclick="closeCustomModal()">CLOSE</button>
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

