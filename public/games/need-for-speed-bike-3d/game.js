/**
 * NEED FOR SPEED: NEON DRIFT 🏎️💨
 * Real-World Automotive Street Racing Engine with Modular Highway Streaming,
 * Analog Speedometer, GPS Circuit Radar, Police Interceptors & Spike Hurdles.
 */

let scene, camera, renderer, clock;
let carGroup, leftExhaustFlame, rightExhaustFlame;
let isPlaying = false;
let isDrifting = false;
let isNitroActive = false;
let currentSpeedMPH = 160;
let targetSpeedMPH = 160;
let gear = 4;
let nitroFuel = 100;
let carLaneX = 0;
let targetLaneX = 0;
const keys = {};

const roadSegments = [];
const SEGMENT_LENGTH = 40;
const TOTAL_SEGMENTS = 8;

const opponentCars = [];
const policeCruisers = [];
const roadHurdles = [];
const particles = [];

let cameraView = 'back';
let audioCtx;
let raceStartTime = 0;

function initEngine() {
  const canvas = document.getElementById('three-canvas');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050814);
  scene.fog = new THREE.FogExp2(0x050814, 0.009);

  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 800);
  camera.position.set(0, 3.8, 7.8);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Real-World Lighting
  const ambient = new THREE.AmbientLight(0xdbeafe, 0.65);
  scene.add(ambient);

  const moonLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
  moonLight.position.set(20, 40, 20);
  moonLight.castShadow = true;
  scene.add(moonLight);

  // Build Supercar Model
  carGroup = createSupercarMesh();
  scene.add(carGroup);

  // Build Infinite Modular Highway Track
  buildHighwayTrack();

  // Seed Opponent Racers & Police Interceptors
  spawnOpponentsAndPolice();

  // Listeners
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') triggerHandbrakeDrift(true);
    if (e.key === 'Shift' || e.key === 'n' || e.key === 'N') triggerNitrousBoost();
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') targetLaneX = Math.max(-4.5, targetLaneX - 2.5);
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') targetLaneX = Math.min(4.5, targetLaneX + 2.5);
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    if (e.key === ' ') triggerHandbrakeDrift(false);
  });
  window.addEventListener('resize', onWindowResize);

  clock = new THREE.Clock();
  requestAnimationFrame(animate);
}

/* ─── 3D MODEL: REALISTIC SUPERCAR ─── */
function createSupercarMesh() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 });
  const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  const neonPinkMat = new THREE.MeshBasicMaterial({ color: 0xff007f });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.9 });

  // Chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.65, 4.8), bodyMat);
  chassis.position.y = 0.55;
  chassis.castShadow = true;
  group.add(chassis);

  // Cockpit Glass Roof
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.58, 2.3), glassMat);
  cabin.position.set(0, 1.1, -0.2);
  cabin.castShadow = true;
  group.add(cabin);

  // Headlights & Tail Light Bar
  const headLightMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
  const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
  for (const x of [-0.85, 0.85]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.1), headLightMat);
    hl.position.set(x, 0.6, -2.4);
    group.add(hl);
  }
  const tl = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.1), tailLightMat);
  tl.position.set(0, 0.72, 2.41);
  group.add(tl);

  // Neon Underglow Strip
  const underglow = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 5.0), neonCyanMat);
  underglow.rotation.x = -Math.PI / 2;
  underglow.position.y = 0.12;
  group.add(underglow);

  // Carbon Fiber Rear Wing
  const wing = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 0.45), neonCyanMat);
  wing.position.set(0, 1.3, 2.2);
  group.add(wing);

  // 4 Performance Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.38, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheels = [
    [-1.2, 0.44, -1.5], [1.2, 0.44, -1.5],
    [-1.2, 0.44, 1.5], [1.2, 0.44, 1.5]
  ];
  wheels.forEach(pos => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.position.set(...pos);
    w.castShadow = true;
    group.add(w);
  });

  // Twin Exhausts with Nitro Flame Emitters
  const exhaustMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0 });
  leftExhaustFlame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.2, 8), exhaustMat);
  leftExhaustFlame.position.set(-0.45, 0.4, 2.8);
  leftExhaustFlame.rotation.x = -Math.PI / 2;
  group.add(leftExhaustFlame);

  rightExhaustFlame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.2, 8), exhaustMat);
  rightExhaustFlame.position.set(0.45, 0.4, 2.8);
  rightExhaustFlame.rotation.x = -Math.PI / 2;
  group.add(rightExhaustFlame);

  return group;
}

/* ─── MODULAR HIGHWAY SCROLLING SYSTEM ─── */
function buildHighwayTrack() {
  for (let i = 0; i < TOTAL_SEGMENTS; i++) {
    const seg = createHighwaySegment();
    seg.position.z = -i * SEGMENT_LENGTH;
    scene.add(seg);
    roadSegments.push(seg);
  }
}

function createHighwaySegment() {
  const seg = new THREE.Group();

  // 4-Lane Asphalt Roadbed
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x181e29, roughness: 0.8, metalness: 0.1 });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(16, SEGMENT_LENGTH), roadMat);
  road.rotation.x = -Math.PI / 2;
  road.receiveShadow = true;
  seg.add(road);

  // Dashed White Lane Markings
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let z = -SEGMENT_LENGTH / 2; z < SEGMENT_LENGTH / 2; z += 6) {
    for (const lx of [-4, 0, 4]) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 3.2), dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(lx, 0.015, z + 1.6);
      seg.add(dash);
    }
  }

  // Guardrails with Neon Reflectors
  const railMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6 });
  const neonBarMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, SEGMENT_LENGTH), railMat);
    rail.position.set(side * 8.2, 0.4, 0);
    seg.add(rail);

    const glowBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, SEGMENT_LENGTH), neonBarMat);
    glowBar.position.set(side * 8.0, 0.75, 0);
    seg.add(glowBar);
  }

  // Overhead High-Tech Street Gantry with Amber Floodlights
  const gantryGroup = new THREE.Group();
  const gantryMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 0.4), gantryMat);
  beam.position.y = 6.2;
  gantryGroup.add(beam);

  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 6.2, 8), gantryMat);
    leg.position.set(side * 8.8, 3.1, 0);
    gantryGroup.add(leg);
  }
  gantryGroup.position.z = 0;
  seg.add(gantryGroup);

  // Cyber Skyscrapers in Background
  for (const side of [-1, 1]) {
    const bW = 8 + Math.random() * 6;
    const bH = 25 + Math.random() * 35;
    const bD = 10 + Math.random() * 10;
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x0a0e1a,
      roughness: 0.9,
      emissive: Math.random() > 0.5 ? 0x00f0ff : 0xff007f,
      emissiveIntensity: 0.08
    });
    const bld = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), buildingMat);
    bld.position.set(side * (18 + bW / 2), bH / 2, (Math.random() - 0.5) * 10);
    seg.add(bld);
  }

  return seg;
}

/* ─── VILLAINS, HURDLES & POLICE INTERCEPTORS ─── */
function spawnOpponentsAndPolice() {
  // Opponent Racers
  const colors = [0xdc2626, 0x16a34a, 0xfacc15, 0x9333ea];
  for (let i = 0; i < 4; i++) {
    const opp = createCompetitorMesh(colors[i % colors.length]);
    opp.position.set((i % 2 === 0 ? -3 : 3), 0, -40 - i * 35);
    scene.add(opp);
    opponentCars.push(opp);
  }

  // Police Interceptor Cruiser (Flashing Red/Blue Siren)
  const police = createPoliceCruiserMesh();
  police.position.set(0, 0, -110);
  scene.add(police);
  policeCruisers.push(police);

  // Road Construction Barrier Hurdles
  for (let k = 0; k < 3; k++) {
    const hurdle = createRoadblockMesh();
    hurdle.position.set((Math.random() > 0.5 ? -3.5 : 3.5), 0, -70 - k * 65);
    scene.add(hurdle);
    roadHurdles.push(hurdle);
  }
}

function createCompetitorMesh(color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.3 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.65, 4.6), mat);
  body.position.y = 0.55;
  g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 2.2), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
  cabin.position.set(0, 1.05, -0.2);
  g.add(cabin);
  g.hitRadius = 2.2;
  return g;
}

function createPoliceCruiserMesh() {
  const g = new THREE.Group();
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x09090b });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.7, 4.8), blackMat);
  body.position.y = 0.55;
  g.add(body);

  const doors = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.6, 2.0), whiteMat);
  doors.position.set(0, 0.55, 0);
  g.add(doors);

  // Police Flashing Lightbar
  const barMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const lightbar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.25), barMat);
  lightbar.position.set(0, 1.35, 0);
  g.add(lightbar);
  g.lightbar = lightbar;

  g.hitRadius = 2.4;
  g.isPolice = true;
  return g;
}

function createRoadblockMesh() {
  const g = new THREE.Group();
  const barMat = new THREE.MeshStandardMaterial({ color: 0xfacc15 });
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

  const rail = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.4, 0.15), barMat);
  rail.position.y = 0.75;
  g.add(rail);

  for (let x = -1.2; x <= 1.2; x += 0.6) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.18), stripeMat);
    st.position.set(x, 0.75, 0);
    st.rotation.z = 0.45;
    g.add(st);
  }
  g.hitRadius = 2.0;
  return g;
}

/* ─── PROCEDURAL RACING AUDIO SYNTHESIZER ─── */
function getAudioCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }
  return audioCtx;
}

function playRacingSound(type) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'nitro') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(850, now + 0.35);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.45);
      osc.start(now); osc.stop(now + 0.45);
    } else if (type === 'drift') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(320, now + 0.2);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.25);
      osc.start(now); osc.stop(now + 0.25);
    } else if (type === 'crash') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(30, now + 0.25);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    }
  } catch (e) {}
}

/* ─── MAIN RACING GAME LOOP ─── */
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  if (isPlaying) {
    // Speed adjustments
    targetSpeedMPH = isNitroActive ? 245 : isDrifting ? 130 : 185;
    currentSpeedMPH += (targetSpeedMPH - currentSpeedMPH) * Math.min(1.0, 6.0 * delta);
    gear = currentSpeedMPH > 220 ? 6 : currentSpeedMPH > 170 ? 5 : currentSpeedMPH > 130 ? 4 : 3;

    // Update Telemetry Cluster
    document.getElementById('hud-speed-num').textContent = Math.round(currentSpeedMPH);
    document.getElementById('hud-gear').textContent = isNitroActive ? 'NITRO 🔥' : `GEAR: ${gear}`;

    // Speedometer Needle (-120deg to +120deg)
    const needle = document.getElementById('speedo-needle');
    if (needle) {
      const angle = -120 + Math.min(1, currentSpeedMPH / 260) * 240;
      needle.style.transform = `rotate(${angle}deg)`;
    }

    // Race Timer
    const elapsed = (Date.now() - raceStartTime) / 1000;
    const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const secs = String(Math.floor(elapsed % 60)).padStart(2, '0');
    const ms = String(Math.floor((elapsed * 100) % 100)).padStart(2, '0');
    document.getElementById('hud-timer').textContent = `${mins}:${secs}.${ms}`;

    // Forward Step
    const forwardStep = (currentSpeedMPH / 18) * delta * 60;

    // Move Road Segments continuously
    for (let i = 0; i < roadSegments.length; i++) {
      const seg = roadSegments[i];
      seg.position.z += forwardStep;
      if (seg.position.z > SEGMENT_LENGTH) {
        seg.position.z -= TOTAL_SEGMENTS * SEGMENT_LENGTH;
      }
    }

    // Car Steer Smooth Lerp
    carLaneX += (targetLaneX - carLaneX) * Math.min(1.0, 12.0 * delta);
    carGroup.position.x = carLaneX;
    carGroup.rotation.y = (targetLaneX - carLaneX) * -0.15;
    carGroup.rotation.z = isDrifting ? (targetLaneX < carLaneX ? -0.25 : 0.25) : (targetLaneX - carLaneX) * -0.08;

    // Radar blip projections
    const radarBlips = document.getElementById('radar-blips');
    if (radarBlips) radarBlips.innerHTML = '';

    let closestThreatDist = 999;
    let closestThreatText = '';

    // Move Opponents & Police
    const allEnemies = [...opponentCars, ...policeCruisers, ...roadHurdles];
    allEnemies.forEach((enemy, idx) => {
      enemy.position.z += forwardStep * 0.7;

      // Police Siren Strobe
      if (enemy.lightbar) {
        const isRed = Math.floor(Date.now() / 150) % 2 === 0;
        enemy.lightbar.material.color.setHex(isRed ? 0xef4444 : 0x00f0ff);
      }

      const relZ = enemy.position.z - carGroup.position.z;
      if (relZ < 0 && relZ > -90) {
        const distM = Math.round(Math.abs(relZ));
        if (distM < closestThreatDist) {
          closestThreatDist = distM;
          closestThreatText = enemy.isPolice ? `POLICE CRUISER [${distM}M]` : `TRAFFIC HURDLE [${distM}M]`;
        }

        if (radarBlips) {
          const blipX = 68 + (enemy.position.x / 8.0) * 44;
          const blipY = 112 + (relZ / 90) * 85;
          const blip = document.createElement('div');
          blip.style.position = 'absolute';
          blip.style.left = `${blipX}px`;
          blip.style.top = `${blipY}px`;
          blip.style.width = '7px';
          blip.style.height = '7px';
          blip.style.borderRadius = '50%';
          blip.style.background = enemy.isPolice ? '#ef4444' : '#38bdf8';
          blip.style.boxShadow = enemy.isPolice ? '0 0 6px #ef4444' : '0 0 6px #38bdf8';
          blip.style.transform = 'translate(-50%, -50%)';
          radarBlips.appendChild(blip);
        }
      }

      // Collision Check
      const dx = enemy.position.x - carGroup.position.x;
      const dz = enemy.position.z - carGroup.position.z;
      if (Math.sqrt(dx * dx + dz * dz) < (enemy.hitRadius || 2.0)) {
        playRacingSound('crash');
        currentSpeedMPH = Math.max(80, currentSpeedMPH - 50);
        showDialogue('Crew Chief', '"Watch the contact! You just clipped a roadblock! Keep your line!"', '📻');
        enemy.position.z = -140 - Math.random() * 40;
      } else if (enemy.position.z > 30) {
        enemy.position.z = -140 - Math.random() * 60;
        enemy.position.x = (Math.random() - 0.5) * 8;
      }
    });

    // Hazard Flasher
    const flasher = document.getElementById('hazard-flasher');
    const flasherText = document.getElementById('hazard-text');
    if (flasher && flasherText) {
      if (closestThreatDist <= 40) {
        flasher.style.display = 'flex';
        flasherText.textContent = `🚨 ALERT: ${closestThreatText}!`;
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
    tx = carGroup.position.x;
    ty = 1.6; tz = carGroup.position.z - 1.2;
    camera.position.set(tx, ty, tz);
    camera.lookAt(carGroup.position.x, 1.4, -40);
  } else if (cameraView === 'top') {
    tx = carGroup.position.x * 0.5;
    ty = 16; tz = carGroup.position.z + 2;
    camera.position.set(tx, ty, tz);
    camera.lookAt(carGroup.position.x, 0, -20);
  } else { // chase
    tx = carGroup.position.x * 0.45;
    ty = 3.8; tz = 7.8;
    camera.position.x += (tx - camera.position.x) * Math.min(1.0, 10.0 * delta);
    camera.position.y += (ty - camera.position.y) * Math.min(1.0, 10.0 * delta);
    camera.position.z += (tz - camera.position.z) * Math.min(1.0, 10.0 * delta);
    camera.lookAt(carGroup.position.x * 0.5, 1.2, -25);
  }
}

/* ─── ABILITIES & ACTIONS ─── */
function triggerHandbrakeDrift(active) {
  isDrifting = active;
  if (active) playRacingSound('drift');
}

function triggerNitrousBoost() {
  if (isNitroActive || nitroFuel < 20) return;
  isNitroActive = true;
  nitroFuel -= 35;
  playRacingSound('nitro');

  document.getElementById('hud-nitro-val').textContent = `${nitroFuel}% BOOSTING`;
  document.getElementById('speed-streaks').classList.add('active');
  leftExhaustFlame.material.opacity = 0.9;
  rightExhaustFlame.material.opacity = 0.9;

  showDialogue('Crew Chief', '"NITROUS INJECTED! Hold on to the wheel!"', '🔥');

  setTimeout(() => {
    isNitroActive = false;
    document.getElementById('speed-streaks').classList.remove('active');
    leftExhaustFlame.material.opacity = 0;
    rightExhaustFlame.material.opacity = 0;
    document.getElementById('hud-nitro-val').textContent = `${nitroFuel}% CHARGING`;
  }, 3200);
}

function setCameraView(view) {
  cameraView = view;
  document.querySelectorAll('.camera-control-bar .hud-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`cam-${view}`);
  if (btn) btn.classList.add('active');
}

function showDialogue(speaker, msg, avatar = '📻') {
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
  document.getElementById('circuit-radar').style.display = 'block';
  document.getElementById('speedo-cluster').style.display = 'flex';
  document.getElementById('ability-bar').style.display = 'flex';

  isPlaying = true;
  raceStartTime = Date.now();
  targetLaneX = 0;
  carLaneX = 0;
  currentSpeedMPH = 160;

  showDialogue('Crew Chief', '"Green flag! Shuto Expressway circuit is live! Show them what this engine can do!"', '🏁');
  playRacingSound('nitro');
}

function exitToHub() {
  window.location.href = '../../index.html';
}

function openGarageModal() {
  const modal = document.getElementById('custom-modal');
  document.getElementById('modal-body').innerHTML = `
    <h2 class="modal-title-glow">🔧 PERFORMANCE GARAGE</h2>
    <div style="font-size:0.9rem;color:#94a3b8;margin:12px 0;">Customize ECU Mapping, Twin-Turbo PSI, Suspension Camber & Nitrous Flow Rate.</div>
    <div style="background:rgba(255,255,255,0.05);padding:14px;border-radius:12px;text-align:left;font-family:'Chakra Petch';">
      <div>TURBO BOOST: <strong style="color:#00f0ff;">2.4 BAR (MAX)</strong></div>
      <div>TOP SPEED: <strong style="color:#ffd60a;">245 MPH</strong></div>
      <div>DRIFT ANGLE RATIO: <strong style="color:#ff007f;">42 DEGREES</strong></div>
    </div>
    <button class="real-btn real-btn-primary" style="margin-top:16px;width:100%;" onclick="closeCustomModal()">CLOSE GARAGE</button>
  `;
  modal.style.display = 'flex';
}

function openLeaderboardModal() {
  const modal = document.getElementById('custom-modal');
  document.getElementById('modal-body').innerHTML = `
    <h2 class="modal-title-glow">🏆 METROPOLITAN SPEED RECORDS</h2>
    <div style="background:rgba(255,255,255,0.05);padding:14px;border-radius:12px;text-align:left;font-family:'Chakra Petch';">
      <div style="color:#ffd60a;">1. RYOSUKE - RX7 - 01:14.22 (251 MPH)</div>
      <div style="color:#00f0ff;">2. TAKUMI - AE86 - 01:15.05 (248 MPH)</div>
      <div style="color:#fff;">3. YOU - NEON GT - 01:16.80 (245 MPH)</div>
    </div>
    <button class="real-btn real-btn-primary" style="margin-top:16px;width:100%;" onclick="closeCustomModal()">CLOSE</button>
  `;
  modal.style.display = 'flex';
}

function closeCustomModal() {
  document.getElementById('custom-modal').style.display = 'none';
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('DOMContentLoaded', initEngine);

