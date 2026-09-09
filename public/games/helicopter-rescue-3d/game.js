/**
 * HELICOPTER: EMERGENCY RESPONSE 3D 🚁
 * Real-World Search & Rescue Flight Simulation with Barometric Altimeters,
 * Beacon Sonar, Alpine Canyon Streaming, Winch Cable Extractions & Storm Hazards.
 */

let scene, camera, renderer, clock;
let chopperGroup, mainRotorMesh, tailRotorMesh, winchCable;
let isPlaying = false;
let isWinchDeployed = false;
let flightSpeed = 0.55;
let chopperY = 6;
let chopperVelY = 0;
let chopperX = 0;
let targetX = 0;
let rescuedCount = 0;
const keys = {};

const canyonChunks = [];
const CHUNK_SIZE = 65;
const TOTAL_CHUNKS = 6;

const hazardsAndSurvivors = [];
let cameraView = 'back';
let audioCtx;

function initEngine() {
  const canvas = document.getElementById('three-canvas');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x334155);
  scene.fog = new THREE.FogExp2(0x334155, 0.009);

  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 800);
  camera.position.set(0, 4.5, 9.5);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Alpine Daylight
  const ambient = new THREE.AmbientLight(0xe2e8f0, 0.75);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffedd5, 1.3);
  sun.position.set(30, 80, 30);
  sun.castShadow = true;
  scene.add(sun);

  // Helicopter Model
  chopperGroup = createChopperMesh();
  scene.add(chopperGroup);

  // Winch Cable
  const lineMat = new THREE.LineBasicMaterial({ color: 0xfacc15, linewidth: 2, transparent: true, opacity: 0 });
  const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  winchCable = new THREE.Line(lineGeo, lineMat);
  scene.add(winchCable);

  // Modular Alpine Canyon
  buildModularCanyon();

  // Spawn Hazards & Survivors
  spawnHazards();

  // Listeners
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'w' || e.key === 'W') adjustCollective(1);
    if (e.key === 's' || e.key === 'S') adjustCollective(-1);
    if (e.key === 'e' || e.key === 'E') triggerRescueWinch();
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') targetX = Math.max(-6.5, targetX - 2.8);
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') targetX = Math.min(6.5, targetX + 2.8);
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
  });
  window.addEventListener('resize', onWindowResize);

  clock = new THREE.Clock();
  requestAnimationFrame(animate);
}

/* ─── 3D MODEL: RESCUE HELICOPTER ─── */
function createChopperMesh() {
  const g = new THREE.Group();
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.8 });

  // Fuselage
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.75, 3.8, 14), yellowMat);
  body.rotation.x = Math.PI / 2;
  body.castShadow = true;
  g.add(body);

  // Cockpit Glass Bubble
  const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 12), glassMat);
  bubble.position.set(0, 0.2, -1.5);
  bubble.scale.set(1.0, 1.0, 1.2);
  g.add(bubble);

  // Tail Boom & Fin
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.35, 3.6, 8), yellowMat);
  boom.rotation.x = Math.PI / 2;
  boom.position.set(0, 0.4, 3.2);
  g.add(boom);

  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.4, 0.8), yellowMat);
  fin.position.set(0, 0.9, 5.0);
  g.add(fin);

  // Landing Skids
  const skidMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
  for (const x of [-0.9, 0.9]) {
    const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.5, 8), skidMat);
    skid.rotation.x = Math.PI / 2;
    skid.position.set(x, -0.9, 0);
    g.add(skid);

    // Struts
    for (const z of [-0.9, 0.9]) {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), skidMat);
      strut.position.set(x, -0.5, z);
      g.add(strut);
    }
  }

  // Main Rotor Hub & Blades
  const hubMat = new THREE.MeshStandardMaterial({ color: 0x18181b });
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8), hubMat);
  hub.position.set(0, 1.2, 0);
  g.add(hub);

  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.4 });
  mainRotorMesh = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.04, 0.3), bladeMat);
  mainRotorMesh.position.set(0, 1.45, 0);
  g.add(mainRotorMesh);

  // Tail Rotor
  tailRotorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.4, 0.15), bladeMat);
  tailRotorMesh.position.set(0.15, 0.9, 5.0);
  g.add(tailRotorMesh);

  return g;
}

/* ─── MODULAR ALPINE CANYON STREAMING ─── */
function buildModularCanyon() {
  for (let i = 0; i < TOTAL_CHUNKS; i++) {
    const chunk = createCanyonChunk();
    chunk.position.z = -i * CHUNK_SIZE;
    scene.add(chunk);
    canyonChunks.push(chunk);
  }
}

function createCanyonChunk() {
  const chunk = new THREE.Group();

  // Canyon Valley Floor with River
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(40, 2, CHUNK_SIZE), rockMat);
  floor.position.y = -6;
  chunk.add(floor);

  const riverMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.8 });
  const river = new THREE.Mesh(new THREE.PlaneGeometry(8, CHUNK_SIZE), riverMat);
  river.rotation.x = -Math.PI / 2;
  river.position.y = -4.95;
  chunk.add(river);

  // Granite Mountain Peaks on Left and Right
  const mountainMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });

  for (let z = -CHUNK_SIZE / 2 + 15; z < CHUNK_SIZE / 2; z += 30) {
    for (const side of [-1, 1]) {
      const peak = new THREE.Group();
      const mH = 20 + Math.random() * 25;
      const base = new THREE.Mesh(new THREE.ConeGeometry(12, mH, 6), mountainMat);
      base.position.y = mH / 2 - 5;
      base.castShadow = true;
      peak.add(base);

      // Snowcap
      const snow = new THREE.Mesh(new THREE.ConeGeometry(5, 7, 6), snowMat);
      snow.position.y = mH - 5;
      peak.add(snow);

      peak.position.set(side * 22, 0, z);
      chunk.add(peak);
    }
  }

  return chunk;
}

/* ─── RESCUE TARGETS & CLIFF HAZARDS ─── */
function spawnHazards() {
  // Stranded Climber Survivors with Orange Smoke Flares
  for (let i = 0; i < 3; i++) {
    const survivor = createSurvivorMesh();
    survivor.position.set((i % 2 === 0 ? -3.5 : 3.5), 1.5, -45 - i * 42);
    scene.add(survivor);
    hazardsAndSurvivors.push(survivor);
  }

  // Turbulent Mountain Storm Clouds
  for (let k = 0; k < 3; k++) {
    const storm = createStormCloud();
    storm.position.set((k % 2 === 0 ? 3 : -3), 7, -65 - k * 55);
    scene.add(storm);
    hazardsAndSurvivors.push(storm);
  }
}

function createSurvivorMesh() {
  const g = new THREE.Group();
  const jacketMat = new THREE.MeshStandardMaterial({ color: 0xf97316 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });

  const rockLedge = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2, 3.5), new THREE.MeshStandardMaterial({ color: 0x64748b }));
  rockLedge.position.y = -1.0;
  g.add(rockLedge);

  const person = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8), jacketMat);
  person.position.y = 0.6;
  g.add(person);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), skinMat);
  head.position.y = 1.4;
  g.add(head);

  // Orange Distress Smoke Flare
  const flare = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
  flare.position.set(0.6, 0.3, 0);
  g.add(flare);

  g.isSurvivor = true;
  g.hitRadius = 2.4;
  return g;
}

function createStormCloud() {
  const g = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0x475569, transparent: true, opacity: 0.8 });
  for (let i = 0; i < 4; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(1.8 + Math.random(), 8, 8), cloudMat);
    puff.position.set((i - 1.5) * 1.6, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8);
    g.add(puff);
  }
  g.isStorm = true;
  g.hitRadius = 2.8;
  return g;
}

/* ─── PROCEDURAL TURBINE AUDIO ─── */
function getAudioCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }
  return audioCtx;
}

function playChopperSound(type) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'winch') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.linearRampToValueAtTime(700, now + 0.25);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'rescue') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(1046.5, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
    }
  } catch (e) {}
}

/* ─── MAIN ENGINE LOOP ─── */
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  if (isPlaying) {
    const forwardStep = flightSpeed * delta * 60;

    // Move Canyon Chunks
    for (let i = 0; i < canyonChunks.length; i++) {
      const chunk = canyonChunks[i];
      chunk.position.z += forwardStep;
      if (chunk.position.z > CHUNK_SIZE) {
        chunk.position.z -= TOTAL_CHUNKS * CHUNK_SIZE;
      }
    }

    // Rotor Spins
    if (mainRotorMesh) mainRotorMesh.rotation.y += 0.45;
    if (tailRotorMesh) tailRotorMesh.rotation.x += 0.55;

    // Flight Dynamics & Steering
    chopperY += chopperVelY;
    chopperVelY *= 0.92;
    chopperY = Math.max(2.5, Math.min(14, chopperY));
    chopperX += (targetX - chopperX) * Math.min(1.0, 10.0 * delta);

    chopperGroup.position.set(chopperX, chopperY, 0);
    chopperGroup.rotation.z = (targetX - chopperX) * -0.15;
    chopperGroup.rotation.x = isWinchDeployed ? 0.05 : 0.18; // Nose down in forward cruise

    // Altimeter readout
    document.getElementById('hud-altitude').textContent = `${Math.round(1200 + chopperY * 45)} FT`;

    // Speedometer needle
    const knots = Math.round(flightSpeed * 160);
    document.getElementById('hud-air-speed').textContent = knots;
    const needle = document.getElementById('speedo-needle');
    if (needle) {
      const angle = -120 + Math.min(1, knots / 150) * 240;
      needle.style.transform = `rotate(${angle}deg)`;
    }

    // Winch Cable geometry update
    if (isWinchDeployed) {
      const points = [
        new THREE.Vector3(chopperGroup.position.x, chopperGroup.position.y - 0.8, chopperGroup.position.z),
        new THREE.Vector3(chopperGroup.position.x, 1.0, chopperGroup.position.z)
      ];
      winchCable.geometry.setFromPoints(points);
      winchCable.material.opacity = 0.9;
    } else {
      winchCable.material.opacity = 0;
    }

    // Radar & Hazards
    const radarBlips = document.getElementById('radar-blips');
    if (radarBlips) radarBlips.innerHTML = '';

    let closestThreatDist = 999;
    let threatName = '';

    hazardsAndSurvivors.forEach(haz => {
      haz.position.z += forwardStep * 0.85;

      const relZ = haz.position.z - chopperGroup.position.z;
      if (relZ < 0 && relZ > -90) {
        const distM = Math.round(Math.abs(relZ));
        if (distM < closestThreatDist) {
          closestThreatDist = distM;
          threatName = haz.isSurvivor ? `DISTRESS SMOKE FLARE [${distM}M]` : `STORM DOWNDRAFT [${distM}M]`;
        }

        if (radarBlips) {
          const blipX = 68 + (haz.position.x / 8.0) * 44;
          const blipY = 112 + (relZ / 90) * 85;
          const blip = document.createElement('div');
          blip.style.position = 'absolute';
          blip.style.left = `${blipX}px`;
          blip.style.top = `${blipY}px`;
          blip.style.width = '7px';
          blip.style.height = '7px';
          blip.style.borderRadius = '50%';
          blip.style.background = haz.isSurvivor ? '#00f59b' : '#ef4444';
          blip.style.boxShadow = haz.isSurvivor ? '0 0 8px #00f59b' : '0 0 6px #ef4444';
          blip.style.transform = 'translate(-50%, -50%)';
          radarBlips.appendChild(blip);
        }
      }

      // Proximity check
      const dx = haz.position.x - chopperGroup.position.x;
      const dz = haz.position.z - chopperGroup.position.z;
      if (Math.sqrt(dx * dx + dz * dz) < (haz.hitRadius || 2.4)) {
        if (haz.isSurvivor && isWinchDeployed) {
          // Rescued Civilian!
          rescuedCount++;
          document.getElementById('hud-rescued').textContent = `${rescuedCount} CIVILIANS`;
          playChopperSound('rescue');
          showDialogue('Pilot', '"Survivor secured in rescue basket! Winching back to cabin!"', '👨‍✈️');
          haz.position.z = -130 - Math.random() * 40;
        } else if (haz.isStorm) {
          // Turbulence hit
          chopperVelY = -0.3;
          showDialogue('Pilot', '"Severe downdraft! Pull collective lift now!"', '⚠️');
          haz.position.z = -130 - Math.random() * 40;
        }
      } else if (haz.position.z > 25) {
        haz.position.z = -130 - Math.random() * 40;
      }
    });

    // Flasher alert
    const flasher = document.getElementById('hazard-flasher');
    const flasherText = document.getElementById('hazard-text');
    if (flasher && flasherText) {
      if (closestThreatDist <= 38) {
        flasher.style.display = 'flex';
        flasherText.textContent = `🚨 ALERT: ${threatName}!`;
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
    tx = chopperGroup.position.x;
    ty = chopperGroup.position.y + 0.4; tz = -2.5;
    camera.position.set(tx, ty, tz);
    camera.lookAt(chopperGroup.position.x, chopperGroup.position.y, 25);
  } else if (cameraView === 'top') {
    tx = chopperGroup.position.x;
    ty = chopperGroup.position.y + 15; tz = 2;
    camera.position.set(tx, ty, tz);
    camera.lookAt(chopperGroup.position.x, 0, -15);
  } else { // chase
    tx = chopperGroup.position.x * 0.45;
    ty = chopperGroup.position.y + 3.6; tz = 9.5;
    camera.position.x += (tx - camera.position.x) * Math.min(1.0, 10.0 * delta);
    camera.position.y += (ty - camera.position.y) * Math.min(1.0, 10.0 * delta);
    camera.position.z += (tz - camera.position.z) * Math.min(1.0, 10.0 * delta);
    camera.lookAt(chopperGroup.position.x * 0.5, chopperGroup.position.y, -20);
  }
}

/* ─── CONTROLS: COLLECTIVE PITCH & WINCH ─── */
function adjustCollective(dir) {
  chopperVelY += dir * 0.18;
}

function triggerRescueWinch() {
  isWinchDeployed = !isWinchDeployed;
  playChopperSound('winch');
  document.getElementById('hud-winch-status').textContent = isWinchDeployed ? 'DEPLOYED 🪢' : 'STOWED';
  document.getElementById('hud-flight-mode').textContent = isWinchDeployed ? 'HOVER WINCH' : 'FORWARD CRUISE';
  showDialogue('Pilot', isWinchDeployed ? '"Winch cable deployed. Maintaining steady hover."' : '"Winch retracted."', '👨‍✈️');
}

function setCameraView(view) {
  cameraView = view;
  document.querySelectorAll('.camera-control-bar .hud-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`cam-${view}`);
  if (btn) btn.classList.add('active');
}

function showDialogue(speaker, msg, avatar = '👨‍✈️') {
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
  document.getElementById('beacon-radar').style.display = 'block';
  document.getElementById('speedo-cluster').style.display = 'flex';
  document.getElementById('ability-bar').style.display = 'flex';

  isPlaying = true;
  showDialogue('Pilot', '"Cascade Alpine Search & Rescue airborne. Distress beacon locked in canyon sector."', '🚁');
}

function openHangarModal() {
  const modal = document.getElementById('custom-modal');
  document.getElementById('modal-body').innerHTML = `
    <h2 class="modal-title-glow">🔧 ALPINE RESCUE HANGAR</h2>
    <div style="font-size:0.9rem;color:#94a3b8;margin:12px 0;">Eurocopter EC145 Medevac modifications, FLIR infrared pods & hoist winch ratings:</div>
    <div style="background:rgba(255,255,255,0.05);padding:14px;border-radius:12px;text-align:left;font-family:'Chakra Petch';">
      <div>WINCH HOIST RATING: <strong style="color:#00f59b;">600 LBS (DUAL RESCUE)</strong></div>
      <div>MAX OPERATING CEILING: <strong style="color:#ffd60a;">18,000 FT</strong></div>
      <div>FLIGHT STABILIZER: <strong style="color:#00f0ff;">DIGITAL 4-AXIS AUTOPILOT</strong></div>
    </div>
    <button class="real-btn real-btn-primary" style="margin-top:16px;width:100%;" onclick="closeCustomModal()">CLOSE HANGAR</button>
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

