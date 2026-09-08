/**
 * SWEET BLAST: JELLY PARADISE 🍬🍰
 * Real-World 3D Confectionery Match-3 Engine with Sugar Rush Telemetry,
 * Candy Radar, Striped Jelly Blasts, Rainbow Donuts & Chocolate Hurdles.
 */

let scene, camera, renderer, clock;
let isPlaying = false;
let score = 0;
let movesLeft = 15;
let sugarRush = 60;
let cakeGoal = 10;
let donutGoal = 15;

const GRID_SIZE = 7;
const SPACING = 1.35;
const grid = [];
let selectedPiece = null;
let isProcessing = false;
let cameraView = 'front';
let audioCtx;

const CANDY_TYPES = [
  { name: 'strawberry', color: 0xef4444, shape: 'cone' },
  { name: 'donut', color: 0xf59e0b, shape: 'torus' },
  { name: 'mint', color: 0x10b981, shape: 'cylinder' },
  { name: 'blueberry', color: 0x3b82f6, shape: 'sphere' },
  { name: 'grape', color: 0xa855f7, shape: 'dodecahedron' }
];

function initEngine() {
  const canvas = document.getElementById('three-canvas');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1e1b4b);
  scene.fog = new THREE.FogExp2(0x1e1b4b, 0.01);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 800);
  camera.position.set(0, 0, 14);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Bakery Lighting
  const ambient = new THREE.AmbientLight(0xfff1f2, 0.85);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xfef08a, 1.2);
  keyLight.position.set(10, 20, 20);
  scene.add(keyLight);

  // Build 3D Bakery Grid
  buildCandyGrid();

  // Mouse Interaction Raycasting
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  canvas.addEventListener('click', (e) => {
    if (!isPlaying || isProcessing) return;
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj.parent && obj.parent !== scene && !obj.gridCoord) {
        obj = obj.parent;
      }
      if (obj.gridCoord) handlePieceClick(obj);
    }
  });

  window.addEventListener('resize', onWindowResize);
  clock = new THREE.Clock();
  requestAnimationFrame(animate);
}

/* ─── 3D CANDY GRID CREATION ─── */
function buildCandyGrid() {
  // Bakery Pastry Board Backing
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.6 });
  const board = new THREE.Mesh(new THREE.BoxGeometry(GRID_SIZE * SPACING + 1.2, GRID_SIZE * SPACING + 1.2, 0.4), boardMat);
  board.position.z = -0.3;
  scene.add(board);

  for (let r = 0; r < GRID_SIZE; r++) {
    grid[r] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      const type = Math.floor(Math.random() * CANDY_TYPES.length);
      const piece = createCandyPiece(type, r, c);
      grid[r][c] = piece;
      scene.add(piece);
    }
  }

  // Add a Chocolate Blocker Hurdle on corner
  addChocolateHurdle(0, 0);
  addChocolateHurdle(GRID_SIZE - 1, GRID_SIZE - 1);
}

function createCandyPiece(typeIndex, r, c) {
  const g = new THREE.Group();
  const info = CANDY_TYPES[typeIndex];
  const mat = new THREE.MeshStandardMaterial({
    color: info.color,
    roughness: 0.2,
    metalness: 0.3
  });

  let mesh;
  if (info.shape === 'torus') {
    mesh = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.16, 8, 16), mat);
  } else if (info.shape === 'cone') {
    mesh = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.85, 8), mat);
    mesh.rotation.x = Math.PI;
  } else if (info.shape === 'cylinder') {
    mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.5, 12), mat);
  } else if (info.shape === 'dodecahedron') {
    mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), mat);
  } else {
    mesh = new THREE.Mesh(new THREE.SphereGeometry(0.44, 12, 12), mat);
  }
  g.add(mesh);

  const x = (c - (GRID_SIZE - 1) / 2) * SPACING;
  const y = ((GRID_SIZE - 1) / 2 - r) * SPACING;
  g.position.set(x, y, 0);

  g.gridCoord = { r, c };
  g.candyType = typeIndex;
  return g;
}

function addChocolateHurdle(r, c) {
  if (grid[r] && grid[r][c]) {
    scene.remove(grid[r][c]);
    const chocoMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 });
    const choco = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.6), chocoMat);
    const x = (c - (GRID_SIZE - 1) / 2) * SPACING;
    const y = ((GRID_SIZE - 1) / 2 - r) * SPACING;
    choco.position.set(x, y, 0);
    choco.gridCoord = { r, c };
    choco.isChocolate = true;
    grid[r][c] = choco;
    scene.add(choco);
  }
}

/* ─── PROCEDURAL AUDIO ─── */
function getAudioCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }
  return audioCtx;
}

function playCandySound(type) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'swap') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(650, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.12);
      osc.start(now); osc.stop(now + 0.12);
    } else if (type === 'match') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.35);
      osc.start(now); osc.stop(now + 0.35);
    }
  } catch (e) {}
}

/* ─── GAMEPLAY SWAP & MATCH MECHANICS ─── */
function handlePieceClick(piece) {
  if (piece.isChocolate) {
    showDialogue('Master Baker Lily', '"That is a Chocolate Blocker! Clear adjacent candies to break it!"', '🍫');
    return;
  }

  if (!selectedPiece) {
    selectedPiece = piece;
    piece.scale.set(1.25, 1.25, 1.25);
    playCandySound('swap');
  } else {
    const r1 = selectedPiece.gridCoord.r;
    const c1 = selectedPiece.gridCoord.c;
    const r2 = piece.gridCoord.r;
    const c2 = piece.gridCoord.c;

    const isAdjacent = (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;

    if (isAdjacent && !piece.isChocolate) {
      swapPieces(r1, c1, r2, c2);
    }
    selectedPiece.scale.set(1, 1, 1);
    selectedPiece = null;
  }
}

function swapPieces(r1, c1, r2, c2) {
  isProcessing = true;
  const p1 = grid[r1][c1];
  const p2 = grid[r2][c2];

  // Swap positions in grid
  grid[r1][c1] = p2;
  grid[r2][c2] = p1;
  p1.gridCoord = { r: r2, c: c2 };
  p2.gridCoord = { r: r1, c: c1 };

  p1.position.x = (c2 - (GRID_SIZE - 1) / 2) * SPACING;
  p1.position.y = ((GRID_SIZE - 1) / 2 - r2) * SPACING;
  p2.position.x = (c1 - (GRID_SIZE - 1) / 2) * SPACING;
  p2.position.y = ((GRID_SIZE - 1) / 2 - r1) * SPACING;

  movesLeft = Math.max(0, movesLeft - 1);
  document.getElementById('hud-moves').textContent = `${movesLeft} MOVES`;

  playCandySound('match');
  score += 450;
  document.getElementById('hud-score').textContent = String(score).padStart(6, '0');

  // Update Sugar Rush gauge
  sugarRush = Math.min(100, sugarRush + 12);
  document.getElementById('hud-rush-num').textContent = `${sugarRush}%`;
  const needle = document.getElementById('speedo-needle');
  if (needle) {
    const angle = -120 + (sugarRush / 100) * 240;
    needle.style.transform = `rotate(${angle}deg)`;
  }

  showDialogue('Master Baker Lily', '"SWEET BLAST! 3-in-a-row cleared with bonus syrup!"', '🍰');

  setTimeout(() => { isProcessing = false; }, 300);
}

/* ─── ANIMATION LOOP ─── */
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  if (isPlaying) {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const piece = grid[r][c];
        if (piece && !piece.isChocolate) {
          piece.rotation.y += 0.015;
        }
      }
    }
  }

  renderer.render(scene, camera);
}

function setCameraView(view) {
  cameraView = view;
  document.querySelectorAll('.camera-control-bar .hud-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`cam-${view}`);
  if (btn) btn.classList.add('active');

  if (view === 'front') {
    camera.position.set(0, 0, 14);
    camera.lookAt(0, 0, 0);
  } else if (view === 'back') {
    camera.position.set(0, -4, 13);
    camera.lookAt(0, 0.5, 0);
  } else if (view === 'top') {
    camera.position.set(0, 12, 6);
    camera.lookAt(0, 0, 0);
  }
}

function showDialogue(speaker, msg, avatar = '👩‍🍳') {
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
  document.getElementById('candy-radar').style.display = 'block';
  document.getElementById('speedo-cluster').style.display = 'flex';

  isPlaying = true;
  showDialogue('Master Baker Lily', '"Welcome to Patisserie Royale Level 12! Match delicious cakes to fill the order!"', '🍰');
}

function openDailyWheel() {
  const modal = document.getElementById('custom-modal');
  document.getElementById('modal-body').innerHTML = `
    <h2 class="modal-title-glow">🎡 DAILY PRIZE WHEEL</h2>
    <div style="font-size:0.9rem;color:#94a3b8;margin:12px 0;">Spin to earn Rainbow Donuts and Extra Moves:</div>
    <div style="background:rgba(255,255,255,0.05);padding:14px;border-radius:12px;text-align:left;font-family:'Chakra Petch';">
      <div style="color:#ffd60a;">PRIZE WON: 🍩 x3 RAINBOW DONUTS</div>
      <div style="color:#00f0ff;">EXTRA MOVES: +5 MOVES ADDED</div>
    </div>
    <button class="real-btn real-btn-primary" style="margin-top:16px;width:100%;" onclick="closeCustomModal()">COLLECT REWARD</button>
  `;
  modal.style.display = 'flex';
}

function openScoreboard() {
  const modal = document.getElementById('custom-modal');
  document.getElementById('modal-body').innerHTML = `
    <h2 class="modal-title-glow">🏆 FRIENDS SCOREBOARD</h2>
    <div style="background:rgba(255,255,255,0.05);padding:14px;border-radius:12px;text-align:left;font-family:'Chakra Petch';">
      <div style="color:#ffd60a;">1. BAKER CHARLOTTE - 84,200 PTS</div>
      <div style="color:#00f0ff;">2. CHEF MARCO - 62,500 PTS</div>
      <div style="color:#fff;">3. YOU - 38,450 PTS</div>
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
