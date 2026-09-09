/**
 * THIEF CAPTURE: DISTRICT PATROL 👮‍♂️🚓
 * Real-World Police Tactical MDT Pursuit with Highway Interceptors,
 * Tactical GPS Radar, Spike Strips, Roadblock Cruiser Barricades & Siren Audio.
 */

let scene, camera, renderer, clock;
let policeCruiser, lightbarMesh;
let isPlaying = false;
let pursuitSpeed = 110;
let suspectSpeed = 95;
let spikeCount = 3;
let suspectsLeft = 3;
let laneX = 0;
let targetX = 0;
const keys = {};

const roadSegments = [];
const SEGMENT_LENGTH = 45;
const TOTAL_SEGMENTS = 7;

const suspectVehicles = [];
const deployedSpikes = [];
const deployedBarricades = [];
let cameraView = 'back';
let audioCtx;

function initEngine() {
  const canvas = document.getElementById('three-canvas');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0e1a);
  scene.fog = new THREE.FogExp2(0x0a0e1a, 0.009);

  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 800);
  camera.position.set(0, 3.8, 8.2);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Night Street Pursuit Lighting
  const ambient = new THREE.AmbientLight(0xdbeafe, 0.6);
  scene.add(ambient);

  const moon = new THREE.DirectionalLight(0x60a5fa, 1.2);
  moon.position.set(20, 50, 20);
  moon.castShadow = true;
  scene.add(moon);

  // Player Police Interceptor Cruiser
  policeCruiser = createPoliceInterceptorMesh();
  scene.add(policeCruiser);

  // Modular Highway
  buildModularHighway();

  // Spawn Fleeing Suspect Vehicles
  spawnSuspects();

  // Listeners
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') deploySpikeStrip();
    if (e.key === 'e' || e.key === 'E') deploySquadBlockade();
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

/* ─── 3D MODEL: LEAD POLICE INTERCEPTOR ─── */
function createPoliceInterceptorMesh() {
  const g = new THREE.Group();
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.3, metalness: 0.8 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });

  // Cruiser Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.72, 4.8), blackMat);
  body.position.y = 0.58;
  body.castShadow = true;
  g.add(body);

  // White Doors & Roof
  const doors = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.65, 2.2), whiteMat);
  doors.position.set(0, 0.58, 0);
  g.add(doors);

  // Bullbar Ram Bumper on Front
  const ramMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.9 });
  const ram = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 0.2), ramMat);
  ram.position.set(0, 0.55, -2.45);
  g.add(ram);

  // Police LED Lightbar (Red/Blue Strobe)
  const barMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  lightbarMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.14, 0.3), barMat);
  lightbarMesh.position.set(0, 1.38, 0);
  g.add(lightbarMesh);

  // 4 Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.36, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheels = [
    [-1.2, 0.44, -1.5], [1.2, 0.44, -1.5],
    [-1.2, 0.44, 1.5], [1.2, 0.44, 1.5]
  ];
  wheels.forEach(pos => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.position.set(...pos);
    g.add(w);
  });

  return g;
}

/* ─── MODULAR HIGHWAY ─── */
function buildModularHighway() {
  for (let i = 0; i < TOTAL_SEGMENTS; i++) {
    const chunk = createHighwayChunk();
    chunk.position.z = -i * SEGMENT_LENGTH;
    scene.add(chunk);
    roadSegments.push(chunk);
  }
}

function createHighwayChunk() {
  const chunk = new THREE.Group();

  // 4-Lane Asphalt Road
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(16, SEGMENT_LENGTH), roadMat);
  road.rotation.x = -Math.PI / 2;
  road.receiveShadow = true;
  chunk.add(road);

  // Dashed White Lines
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let z = -SEGMENT_LENGTH / 2; z < SEGMENT_LENGTH / 2; z += 6) {
    for (const lx of [-4, 0, 4]) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 3.2), dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(lx, 0.015, z + 1.6);
      chunk.add(dash);
    }
  }

  // Steel Guardrails
  const railMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7 });
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, SEGMENT_LENGTH), railMat);
    rail.position.set(side * 8.2, 0.4, 0);
    chunk.add(rail);
  }

  return chunk;
}

/* ─── VILLAINS: FLEEING GETAWAY VEHICLES ─── */
function spawnSuspects() {
  const colors = [0xdc2626, 0x7c3aed, 0x059669];
  for (let i = 0; i < 3; i++) {
    const suspect = createGetawayCarMesh(colors[i]);
    suspect.position.set((i % 2 === 0 ? -3 : 3), 0, -45 - i * 40);
    scene.add(suspect);
    suspectVehicles.push(suspect);
  }
}

function createGetawayCarMesh(color) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.6 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.68, 4.6), bodyMat);
  body.position.y = 0.55;
  g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.52, 2.2), new THREE.MeshStandardMaterial({ color: 0x18181b }));
  cabin.position.set(0, 1.05, -0.2);
  g.add(cabin);

  g.isSuspect = true;
  g.hitRadius = 2.4;
  return g;
}

/* ─── PROCEDURAL POLICE SIREN AUDIO ─── */
function getAudioCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }
  return audioCtx;
}

function playPoliceSound(type) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'siren') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.linearRampToValueAtTime(950, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.35);
      osc.start(now); osc.stop(now + 0.35);
    } else if (type === 'spike') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.25);
      osc.start(now); osc.stop(now + 0.25);
    }
  } catch (e) {}
}

/* ─── MAIN PURSUIT ENGINE LOOP ─── */
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  if (isPlaying) {
    const forwardStep = (pursuitSpeed / 18) * delta * 60;

    // Move Highway
    for (let i = 0; i < roadSegments.length; i++) {
      const seg = roadSegments[i];
      seg.position.z += forwardStep;
      if (seg.position.z > SEGMENT_LENGTH) {
        seg.position.z -= TOTAL_SEGMENTS * SEGMENT_LENGTH;
      }
    }

    // Lightbar Strobe
    if (lightbarMesh) {
      const isRed = Math.floor(Date.now() / 120) % 2 === 0;
      lightbarMesh.material.color.setHex(isRed ? 0xef4444 : 0x00f0ff);
    }

    // Lane Steering
    laneX += (targetX - laneX) * Math.min(1.0, 12.0 * delta);
    policeCruiser.position.x = laneX;
    policeCruiser.rotation.y = (targetX - laneX) * -0.12;

    // Speedometer Needle
    const needle = document.getElementById('speedo-needle');
    if (needle) {
      const angle = -120 + Math.min(1, pursuitSpeed / 160) * 240;
      needle.style.transform = `rotate(${angle}deg)`;
    }

    // Radar & Suspect Updates
    const radarBlips = document.getElementById('radar-blips');
    if (radarBlips) radarBlips.innerHTML = '';

    let closestSuspectDist = 999;

    suspectVehicles.forEach((suspect, idx) => {
      suspect.position.z += forwardStep * 0.75;
      suspect.position.x += Math.sin(Date.now() * 0.003 + idx) * 0.04;

      const relZ = suspect.position.z - policeCruiser.position.z;
      if (relZ < 0 && relZ > -90) {
        const distM = Math.round(Math.abs(relZ));
        if (distM < closestSuspectDist) closestSuspectDist = distM;

        if (radarBlips) {
          const blipX = 68 + (suspect.position.x / 8.0) * 44;
          const blipY = 112 + (relZ / 90) * 85;
          const blip = document.createElement('div');
          blip.style.position = 'absolute';
          blip.style.left = `${blipX}px`;
          blip.style.top = `${blipY}px`;
          blip.style.width = '7px';
          blip.style.height = '7px';
          blip.style.borderRadius = '50%';
          blip.style.background = '#ef4444';
          blip.style.boxShadow = '0 0 6px #ef4444';
          blip.style.transform = 'translate(-50%, -50%)';
          radarBlips.appendChild(blip);
        }
      }

      // Check collision with deployed spike strips
      deployedSpikes.forEach(spike => {
        const sdx = Math.abs(suspect.position.x - spike.position.x);
        const sdz = Math.abs(suspect.position.z - spike.position.z);
        if (sdx < 2.5 && sdz < 2.0) {
          playPoliceSound('spike');
          suspectsLeft = Math.max(0, suspectsLeft - 1);
          document.getElementById('hud-suspects-left').textContent = `${suspectsLeft} SUSPECTS`;
          showDialogue('Dispatcher', '"10-4! Suspect vehicle tires shredded by spike strip! Unit contained!"', '🚨');
          suspect.position.z = -140 - Math.random() * 40;
        }
      });

      // Pit Maneuver / Ram
      const dx = suspect.position.x - policeCruiser.position.x;
      const dz = suspect.position.z - policeCruiser.position.z;
      if (Math.sqrt(dx * dx + dz * dz) < (suspect.hitRadius || 2.4)) {
        playPoliceSound('spike');
        showDialogue('Dispatcher', '"Tactical PIT maneuver executed! Suspect boxed in!"', '🚨');
        suspect.position.z = -140 - Math.random() * 40;
      } else if (suspect.position.z > 30) {
        suspect.position.z = -140 - Math.random() * 50;
      }
    });

    // Move Deployed Spikes backwards
    deployedSpikes.forEach((spike, sIdx) => {
      spike.position.z += forwardStep;
      if (spike.position.z > 40) {
        scene.remove(spike);
        deployedSpikes.splice(sIdx, 1);
      }
    });

    // Flasher alert
    const flasher = document.getElementById('hazard-flasher');
    if (flasher) {
      flasher.style.display = closestSuspectDist <= 38 ? 'flex' : 'none';
    }
  }

  // Camera Tracking
  updateCamera(delta);

  renderer.render(scene, camera);
}

function updateCamera(delta) {
  let tx, ty, tz;
  if (cameraView === 'front') {
    tx = policeCruiser.position.x;
    ty = 1.4; tz = -1.5;
    camera.position.set(tx, ty, tz);
    camera.lookAt(policeCruiser.position.x, 1.2, -30);
  } else if (cameraView === 'top') {
    tx = policeCruiser.position.x * 0.5;
    ty = 18; tz = 2;
    camera.position.set(tx, ty, tz);
    camera.lookAt(policeCruiser.position.x, 0, -20);
  } else { // chase
    tx = policeCruiser.position.x * 0.45;
    ty = 3.8; tz = 8.2;
    camera.position.x += (tx - camera.position.x) * Math.min(1.0, 10.0 * delta);
    camera.position.y += (ty - camera.position.y) * Math.min(1.0, 10.0 * delta);
    camera.position.z += (tz - camera.position.z) * Math.min(1.0, 10.0 * delta);
    camera.lookAt(policeCruiser.position.x * 0.5, 1.2, -25);
  }
}

/* ─── TACTICAL ABILITIES: SPIKES & BARRICADES ─── */
function deploySpikeStrip() {
  if (spikeCount <= 0) return;
  spikeCount--;
  document.getElementById('hud-spikes-count').textContent = `${spikeCount} READY ⛓️`;
  playPoliceSound('spike');

  const stripMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
  const strip = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.12, 0.8), stripMat);
  strip.position.set(policeCruiser.position.x, 0.05, policeCruiser.position.z - 4);
  scene.add(strip);
  deployedSpikes.push(strip);

  showDialogue('Dispatcher', '"Spike strip deployed in lane! Pulling off to observe tire blowout!"', '⛓️');
}

function deploySquadBlockade() {
  playPoliceSound('siren');
  showDialogue('Dispatcher', '"Barricade units deployed at the highway toll plaza!"', '🚧');
  document.getElementById('hud-perimeter').textContent = 'CONTAINED 100%';
}

function setCameraView(view) {
  cameraView = view;
  document.querySelectorAll('.camera-control-bar .hud-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`cam-${view}`);
  if (btn) btn.classList.add('active');
}

function showDialogue(speaker, msg, avatar = '🚨') {
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
  document.getElementById('police-radar').style.display = 'block';
  document.getElementById('speedo-cluster').style.display = 'flex';
  document.getElementById('ability-bar').style.display = 'flex';

  isPlaying = true;
  playPoliceSound('siren');
  showDialogue('Dispatcher', '"All units, Code 3 pursuit authorized on Interstate 95. Capture suspect vehicles!"', '🚨');
}

function openCriminalDatabase() {
  const modal = document.getElementById('custom-modal');
  document.getElementById('modal-body').innerHTML = `
    <h2 class="modal-title-glow">📂 CRIMINAL RECORD ARCHIVES</h2>
    <div style="font-size:0.9rem;color:#94a3b8;margin:12px 0;">District 09 Most Wanted Getaway Drivers:</div>
    <div style="background:rgba(255,255,255,0.05);padding:14px;border-radius:12px;text-align:left;font-family:'Chakra Petch';">
      <div style="color:#ef4444;">1. "VIPER" - RED GETAWAY SEDAN (FELONY SPEEDING)</div>
      <div style="color:#7c3aed;">2. "GHOST" - PURPLE COUPE (ARMED ROBBERY)</div>
      <div style="color:#059669;">3. "SHADOW" - GREEN HATCHBACK (EVADING ARREST)</div>
    </div>
    <button class="real-btn real-btn-primary" style="margin-top:16px;width:100%;" onclick="closeCustomModal()">CLOSE DATABASE</button>
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

