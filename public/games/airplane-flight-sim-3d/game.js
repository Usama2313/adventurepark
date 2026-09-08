/**
 * GLOBAL AIRPLANE FLIGHT SIMULATOR ✈️
 * Commercial Jetliner Glass Cockpit Avionics, ATC Radar Corridors,
 * Precision Runway Streaming, Crosswind Turbulence & ILS Glideslope.
 */

let scene, camera, renderer, clock;
let planeGroup, leftTurbineDisk, rightTurbineDisk, landingGearGroup;
let isPlaying = false;
let isGearDown = true;
let isFlapsDown = true;
let airspeedKnots = 180;
let targetKnots = 180;
let flightAltitude = 200;
let pitchAngle = 0;
let planeX = 0;
let targetX = 0;
const keys = {};

const flightChunks = [];
const CHUNK_SIZE = 80;
const TOTAL_CHUNKS = 6;

const airspaceThreats = [];
let cameraView = 'back';
let audioCtx;

function initEngine() {
  const canvas = document.getElementById('three-canvas');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x60a5fa);
  scene.fog = new THREE.FogExp2(0x60a5fa, 0.006);

  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1200);
  camera.position.set(0, 5, 14);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Daylight Skies
  const ambient = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff7ed, 1.4);
  sun.position.set(60, 100, 40);
  sun.castShadow = true;
  scene.add(sun);

  // Commercial Jetliner Model
  planeGroup = createJetlinerMesh();
  scene.add(planeGroup);

  // Modular Runway & Oceanic Flight Corridor
  buildModularFlightPath();

  // Spawn Airspace Hazards (Turbulence, Mountain Peaks, Traffic)
  spawnAirspaceHazards();

  // Listeners
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'g' || e.key === 'G') toggleLandingGear();
    if (e.key === 'f' || e.key === 'F') toggleFlaps();
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') targetX = Math.max(-14, targetX - 4.5);
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') targetX = Math.min(14, targetX + 4.5);
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
  });
  window.addEventListener('resize', onWindowResize);

  clock = new THREE.Clock();
  requestAnimationFrame(animate);
}

/* ─── 3D MODEL: COMMERCIAL JETLINER (BOEING / AIRBUS STYLE) ─── */
function createJetlinerMesh() {
  const g = new THREE.Group();
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.3 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });

  // Fuselage Body
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 12.5, 18), whiteMat);
  body.rotation.x = Math.PI / 2;
  body.castShadow = true;
  g.add(body);

  // Nose Cone
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1.38, 16, 16), whiteMat);
  nose.position.set(0, 0, -6.2);
  nose.scale.set(1.0, 0.9, 1.6);
  g.add(nose);

  // Cockpit Windows
  const cock = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.6), glassMat);
  cock.position.set(0, 0.65, -5.8);
  g.add(cock);

  // Swept Main Wings
  const wingGeo = new THREE.BoxGeometry(18, 0.16, 3.2);
  const wings = new THREE.Mesh(wingGeo, whiteMat);
  wings.position.set(0, -0.2, 0.5);
  wings.castShadow = true;
  g.add(wings);

  // Wingtip Blue Liveries
  for (const x of [-9.0, 9.0]) {
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.8, 1.2), blueMat);
    tip.position.set(x, 0.2, 0.5);
    g.add(tip);
  }

  // Twin Turbofan Jet Engines
  for (const x of [-4.5, 4.5]) {
    const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.65, 2.6, 16), whiteMat);
    nacelle.rotation.x = Math.PI / 2;
    nacelle.position.set(x, -0.9, 0.2);
    g.add(nacelle);

    const fanDisk = new THREE.Mesh(new THREE.CircleGeometry(0.6, 8), metalMat);
    fanDisk.position.set(x, -0.9, -1.1);
    g.add(fanDisk);
  }

  // Tail Vertical Stabilizer Fin
  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.5, 2.5), blueMat);
  tailFin.position.set(0, 2.1, 5.2);
  tailFin.rotation.x = -Math.PI / 8;
  g.add(tailFin);

  // Horizontal Tailplanes
  const hTail = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.12, 1.6), whiteMat);
  hTail.position.set(0, 0.8, 5.8);
  g.add(hTail);

  // Retractable Landing Gear Group
  landingGearGroup = new THREE.Group();
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
  const strutMat = metalMat;

  // Nose Gear
  const nStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8), strutMat);
  nStrut.position.set(0, -1.4, -4.5);
  landingGearGroup.add(nStrut);
  const nTire = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.25, 12), tireMat);
  nTire.rotation.z = Math.PI / 2;
  nTire.position.set(0, -2.0, -4.5);
  landingGearGroup.add(nTire);

  // Main Gears
  for (const x of [-1.8, 1.8]) {
    const mStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), strutMat);
    mStrut.position.set(x, -1.4, 0.5);
    landingGearGroup.add(mStrut);
    const mTire = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.4, 12), tireMat);
    mTire.rotation.z = Math.PI / 2;
    mTire.position.set(x, -2.0, 0.5);
    landingGearGroup.add(mTire);
  }

  g.add(landingGearGroup);

  return g;
}

/* ─── MODULAR RUNWAY & OCEANIC CORRIDOR ─── */
function buildModularFlightPath() {
  for (let i = 0; i < TOTAL_CHUNKS; i++) {
    const chunk = createFlightChunk(i === 0 || i === 1);
    chunk.position.z = -i * CHUNK_SIZE;
    scene.add(chunk);
    flightChunks.push(chunk);
  }
}

function createFlightChunk(hasRunway = false) {
  const chunk = new THREE.Group();

  // Ocean Surface Base
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.15, metalness: 0.8 });
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(160, CHUNK_SIZE), waterMat);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = -18;
  chunk.add(ocean);

  if (hasRunway) {
    // Illuminated Airport Runway Strip (Runway 04L)
    const runMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const runway = new THREE.Mesh(new THREE.BoxGeometry(16, 2, CHUNK_SIZE), runMat);
    runway.position.set(0, -17, 0);
    chunk.add(runway);

    // Runway Centerline Lights (Green & White)
    const lightMat = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
    for (let z = -CHUNK_SIZE / 2; z < CHUNK_SIZE / 2; z += 8) {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 3.0), lightMat);
      lamp.position.set(0, -15.9, z);
      chunk.add(lamp);
    }
  }

  return chunk;
}

/* ─── AIRSPACE HAZARDS & CROSSING CHECKPOINT RINGS ─── */
let crossingsCompleted = 0;
let hurdlesAvoided = 0;
const crossingRings = [];

function spawnAirspaceHazards() {
  // 1. Golden Glowing Crossing Checkpoint Rings
  for (let r = 0; r < 4; r++) {
    const ring = createCrossingRing();
    ring.position.set((Math.random() - 0.5) * 16, 2 + (r % 3) * 2.5, -45 - r * 55);
    scene.add(ring);
    crossingRings.push(ring);
  }

  // 2. Crosswind Turbulence Cloud Hurdles
  for (let i = 0; i < 3; i++) {
    const cloud = createTurbulenceCloud();
    cloud.position.set((i % 2 === 0 ? -10 : 10), 4 + Math.random() * 6, -70 - i * 60);
    scene.add(cloud);
    airspaceThreats.push(cloud);
  }

  // 3. Radio Tower Hurdle Pylons with Warning Beacon Lights
  for (let k = 0; k < 2; k++) {
    const pylon = createRadioTowerHurdle();
    pylon.position.set((k % 2 === 0 ? -16 : 16), -5, -95 - k * 75);
    scene.add(pylon);
    airspaceThreats.push(pylon);
  }

  // 4. Coastal Mountain Ridge Hurdles
  for (let m = 0; m < 2; m++) {
    const peak = createMountainRidge();
    peak.position.set((m % 2 === 0 ? -22 : 22), -8, -130 - m * 80);
    scene.add(peak);
    airspaceThreats.push(peak);
  }
}

function createCrossingRing() {
  const g = new THREE.Group();
  // Outer Torus Ring
  const torusMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    roughness: 0.2,
    metalness: 0.8
  });
  const torus = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.45, 12, 28), torusMat);
  g.add(torus);

  // Inner Crossing Target Glow
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
  const innerGlow = new THREE.Mesh(new THREE.CircleGeometry(4.8, 24), glowMat);
  g.add(innerGlow);

  g.isCrossingRing = true;
  g.isCleared = false;
  g.hitRadius = 5.0;
  return g;
}

function createRadioTowerHurdle() {
  const g = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  // Lattice Pylon
  const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 2.5, 28, 4), steelMat);
  pylon.position.y = 14;
  g.add(pylon);

  // Flashing Red Aviation Warning Beacon
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), beaconMat);
  beacon.position.y = 28.5;
  g.add(beacon);

  g.isHurdle = true;
  g.hitRadius = 4.5;
  return g;
}

function createTurbulenceCloud() {
  const g = new THREE.Group();
  const cMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.75 });
  for (let i = 0; i < 4; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(3 + Math.random() * 2, 8, 8), cMat);
    puff.position.set((i - 1.5) * 2.8, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5);
    g.add(puff);
  }
  g.isTurbulence = true;
  g.hitRadius = 4.5;
  return g;
}

function createMountainRidge() {
  const g = new THREE.Group();
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
  const mountain = new THREE.Mesh(new THREE.ConeGeometry(18, 30, 6), rockMat);
  mountain.position.y = 5;
  g.add(mountain);
  g.isMountain = true;
  g.hitRadius = 8.0;
  return g;
}

/* ─── PROCEDURAL JET ENGINE AUDIO ─── */
function getAudioCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }
  return audioCtx;
}

function playJetSound(type) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'gear') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.35);
      osc.start(now); osc.stop(now + 0.35);
    }
  } catch (e) {}
}

/* ─── MAIN FLIGHT SIM ENGINE LOOP ─── */
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  if (isPlaying) {
    targetKnots = isGearDown ? 210 : 285;
    airspeedKnots += (targetKnots - airspeedKnots) * Math.min(1.0, 4.0 * delta);

    document.getElementById('hud-knots').textContent = `${Math.round(airspeedKnots)} KTS`;
    document.getElementById('hud-airspeed-num').textContent = Math.round(airspeedKnots);

    const needle = document.getElementById('speedo-needle');
    if (needle) {
      const angle = -120 + Math.min(1, airspeedKnots / 350) * 240;
      needle.style.transform = `rotate(${angle}deg)`;
    }

    const forwardStep = (airspeedKnots / 16) * delta * 60;

    // Move Flight Chunks
    for (let i = 0; i < flightChunks.length; i++) {
      const chunk = flightChunks[i];
      chunk.position.z += forwardStep;
      if (chunk.position.z > CHUNK_SIZE) {
        chunk.position.z -= TOTAL_CHUNKS * CHUNK_SIZE;
      }
    }

    // Pitch Control (Takeoff / Climb)
    if (keys['s'] || keys['S'] || keys['ArrowDown']) {
      pitchAngle = Math.min(0.35, pitchAngle + 0.02);
      flightAltitude = Math.min(32000, flightAltitude + 35);
    } else if (keys['w'] || keys['W'] || keys['ArrowUp']) {
      pitchAngle = Math.max(-0.25, pitchAngle - 0.02);
      flightAltitude = Math.max(500, flightAltitude - 35);
    } else {
      pitchAngle *= 0.95;
    }

    // Roll & Yaw
    planeX += (targetX - planeX) * Math.min(1.0, 8.0 * delta);
    planeGroup.position.set(planeX, 0, 0);
    planeGroup.rotation.x = pitchAngle;
    planeGroup.rotation.z = (targetX - planeX) * -0.08;

    // Altitude indicator
    document.getElementById('hud-flight-alt').textContent = `${Math.round(flightAltitude).toLocaleString()} FT`;

    // 1. Process Crossing Checkpoint Rings
    crossingRings.forEach(ring => {
      ring.position.z += forwardStep * 0.9;
      ring.rotation.z += 0.02; // Dynamic slow spin

      // Proximity check for flying through the ring
      const dx = ring.position.x - planeGroup.position.x;
      const dy = ring.position.y - planeGroup.position.y;
      const dz = Math.abs(ring.position.z - planeGroup.position.z);

      if (!ring.isCleared && dz < 3.0 && Math.sqrt(dx * dx + dy * dy) < (ring.hitRadius || 5.0)) {
        ring.isCleared = true;
        crossingsCompleted++;
        const crossElem = document.getElementById('hud-crossings-count');
        if (crossElem) crossElem.textContent = `${crossingsCompleted} / 8 CLEARED 🎯`;

        showDialogue('Tokyo Tower ATC', `"Flight 702 heavy cleared air corridor crossing gate #${crossingsCompleted}! Perfect altitude alignment!"`, '🗼');
        
        // Ring flashes green success
        ring.children.forEach(c => {
          if (c.material) c.material.color.setHex(0x10b981);
        });

        if (crossingsCompleted >= 8) {
          const modal = document.getElementById('endgame-modal');
          if (modal) modal.style.display = 'flex';
        }
      }

      if (ring.position.z > 30) {
        ring.position.z = -180 - Math.random() * 40;
        ring.position.x = (Math.random() - 0.5) * 16;
        ring.isCleared = false;
        ring.children.forEach(c => {
          if (c.material) c.material.color.setHex(0x38bdf8);
        });
      }
    });

    // 2. Radar Scanning & Airspace Hazards / Hurdles
    const radarBlips = document.getElementById('radar-blips');
    if (radarBlips) radarBlips.innerHTML = '';

    let closestThreatDist = 999;
    let threatName = '';

    airspaceThreats.forEach(threat => {
      threat.position.z += forwardStep * 0.85;

      const relZ = threat.position.z - planeGroup.position.z;
      if (relZ < 0 && relZ > -100) {
        const distM = Math.round(Math.abs(relZ));
        if (distM < closestThreatDist) {
          closestThreatDist = distM;
          threatName = threat.isTurbulence ? `WIND SHEAR TURBULENCE [${distM}M]` : (threat.isHurdle ? `TOWER HURDLE [${distM}M]` : `TERRAIN OBSTACLE [${distM}M]`);
        }

        if (radarBlips) {
          const blipX = 68 + (threat.position.x / 18.0) * 44;
          const blipY = 112 + (relZ / 100) * 85;
          const blip = document.createElement('div');
          blip.style.position = 'absolute';
          blip.style.left = `${blipX}px`;
          blip.style.top = `${blipY}px`;
          blip.style.width = '7px';
          blip.style.height = '7px';
          blip.style.borderRadius = '50%';
          blip.style.background = threat.isTurbulence ? '#facc15' : '#ef4444';
          blip.style.boxShadow = threat.isTurbulence ? '0 0 6px #facc15' : '0 0 6px #ef4444';
          blip.style.transform = 'translate(-50%, -50%)';
          radarBlips.appendChild(blip);
        }
      }

      // Proximity & Hurdle Clearing
      const dx = threat.position.x - planeGroup.position.x;
      const dz = threat.position.z - planeGroup.position.z;
      if (Math.sqrt(dx * dx + dz * dz) < (threat.hitRadius || 4.0)) {
        showDialogue('Tokyo Tower ATC', '"Caution Flight 702! Obstacle / Hurdle proximity alert! Adjust flight vector!"', '⚠️');
        threat.position.z = -140 - Math.random() * 50;
      } else if (threat.position.z > 30) {
        hurdlesAvoided++;
        const hElem = document.getElementById('hud-hurdles-status');
        if (hElem) hElem.textContent = `${hurdlesAvoided} AVOIDED ⚠️`;
        threat.position.z = -140 - Math.random() * 50;
      }
    });

    // Flasher alert
    const flasher = document.getElementById('hazard-flasher');
    const flasherText = document.getElementById('hazard-text');
    if (flasher && flasherText) {
      if (closestThreatDist <= 45) {
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
    tx = planeGroup.position.x;
    ty = 1.8; tz = -5.5;
    camera.position.set(tx, ty, tz);
    camera.lookAt(planeGroup.position.x, 1.4, -40);
  } else if (cameraView === 'top') {
    tx = planeGroup.position.x;
    ty = 22; tz = 4;
    camera.position.set(tx, ty, tz);
    camera.lookAt(planeGroup.position.x, 0, -20);
  } else { // chase
    tx = planeGroup.position.x * 0.45;
    ty = 4.8; tz = 14;
    camera.position.x += (tx - camera.position.x) * Math.min(1.0, 8.0 * delta);
    camera.position.y += (ty - camera.position.y) * Math.min(1.0, 8.0 * delta);
    camera.position.z += (tz - camera.position.z) * Math.min(1.0, 8.0 * delta);
    camera.lookAt(planeGroup.position.x * 0.5, 0.5, -25);
  }
}

/* ─── AVIONICS ACTIONS ─── */
function triggerPitch(val) {
  pitchAngle = val * 0.25;
}

function toggleLandingGear() {
  isGearDown = !isGearDown;
  landingGearGroup.visible = isGearDown;
  playJetSound('gear');
  document.getElementById('hud-gear').textContent = isGearDown ? 'DOWN & LOCKED 🛞' : 'RETRACTED ✈️';
  showDialogue('Cockpit Crew', isGearDown ? '"Landing gear down and locked for approach."' : '"Positive rate of climb. Gear up."', '✈️');
}

function toggleFlaps() {
  isFlapsDown = !isFlapsDown;
  document.getElementById('hud-flaps').textContent = isFlapsDown ? 'POSITION 1 (TAKEOFF)' : 'RETRACTED (CRUISE)';
  showDialogue('Cockpit Crew', isFlapsDown ? '"Flaps extended to position 1."' : '"Flaps retracted."', '✈️');
}

function setCameraView(view) {
  cameraView = view;
  document.querySelectorAll('.camera-control-bar .hud-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`cam-${view}`);
  if (btn) btn.classList.add('active');
}

function showDialogue(speaker, msg, avatar = '🗼') {
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
  document.getElementById('atc-radar').style.display = 'block';
  document.getElementById('speedo-cluster').style.display = 'flex';
  document.getElementById('ability-bar').style.display = 'flex';

  isPlaying = true;
  flightAltitude = 500;
  showDialogue('Tokyo Tower ATC', '"Flight PA-702 heavy, wind 040 at 8 knots, runway 04L cleared for takeoff."', '🗼');
}

function openWeatherModal() {
  const modal = document.getElementById('custom-modal');
  document.getElementById('modal-body').innerHTML = `
    <h2 class="modal-title-glow">🌤️ METAR AVIATION WEATHER</h2>
    <div style="font-size:0.9rem;color:#94a3b8;margin:12px 0;">RJTT (Tokyo Haneda) Automated Terminal Information Service:</div>
    <div style="background:rgba(255,255,255,0.05);padding:14px;border-radius:12px;text-align:left;font-family:'Chakra Petch';">
      <div>VISIBILITY: <strong style="color:#00f0ff;">10+ STATUTE MILES</strong></div>
      <div>ALTIMETER SETTING: <strong style="color:#ffd60a;">29.92 IN HG (STANDARD)</strong></div>
      <div>EN-ROUTE WINDS: <strong style="color:#22c55e;">JETSTREAM 280° AT 65 KNOTS</strong></div>
    </div>
    <button class="real-btn real-btn-primary" style="margin-top:16px;width:100%;" onclick="closeCustomModal()">CLOSE METAR</button>
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

function triggerBoost() {
  targetSpeed = 1.4;
  showDialogue('Flight 702', '"Maximum throttle engaged! Afterburners active!"', '✈️');
  setTimeout(() => { targetSpeed = 0.65; }, 2000);
}
window.triggerBoost = triggerBoost;

function restartFlightGame() {
  const modal = document.getElementById('endgame-modal');
  if (modal) modal.style.display = 'none';
  crossingsCompleted = 0;
  hurdlesAvoided = 0;
  planeGroup.position.set(0, 10, 0);
  planeBank = 0;
  targetBank = 0;
  flightAltitude = 500;
  const crossElem = document.getElementById('hud-crossings-count');
  if (crossElem) crossElem.textContent = '0 / 8 CLEARED 🎯';
  const hElem = document.getElementById('hud-hurdles-status');
  if (hElem) hElem.textContent = '0 AVOIDED ⚠️';
  showDialogue('Tokyo Tower ATC', '"Flight reset. Runway 04L cleared for departure."', '🗼');
}
window.restartFlightGame = restartFlightGame;

window.addEventListener('DOMContentLoaded', initEngine);
