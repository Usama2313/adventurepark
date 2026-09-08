/**
 * SHARED 3D GAME ENGINE UTILITIES & ARCADE BRIDGES
 * Provides:
 * - 5-Angle Camera Rig (Chase/Back, Front, Left-Side, Right-Side, Top-Down/Drone)
 * - 3 Dynamic Environments: 🌊 Underwater Reef, 🏜️ Sand Desert Dunes, 🌪️ Tornado Storm
 * - WebAudio Sound Effects Engine
 * - Interactive AI Tactical Companion Agent
 * - Smart NFC Card & Ticket Payout Synchronization
 */

// ==========================================
// 1. WEBAUDIO PROCEDURAL SOUND SYNTHESIZER
// ==========================================
class ArcadeSoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.15, pitchBend = 0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (pitchBend !== 0) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + pitchBend), now + duration);
      }

      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  }

  // Pre-configured sound effects
  playCoin() {
    this.playTone(987.77, 'triangle', 0.08, 0.2, 330);
    setTimeout(() => this.playTone(1318.51, 'triangle', 0.15, 0.25), 60);
  }

  playJump() {
    this.playTone(220, 'square', 0.18, 0.15, 400);
  }

  playLaser() {
    this.playTone(1200, 'sawtooth', 0.12, 0.18, -900);
  }

  playExplosion() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.35);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch (e) {}
  }

  playBoost() {
    this.playTone(150, 'sawtooth', 0.35, 0.2, 500);
  }

  playKiBlast() {
    this.playTone(450, 'sawtooth', 0.22, 0.25, 600);
    setTimeout(() => this.playTone(850, 'sine', 0.15, 0.2, -400), 50);
  }

  playWebShoot() {
    this.playTone(800, 'sine', 0.1, 0.2, -500);
  }

  playHit() {
    this.playTone(180, 'square', 0.1, 0.2, -100);
  }

  playRescue() {
    this.playTone(523.25, 'sine', 0.1, 0.2);
    setTimeout(() => this.playTone(659.25, 'sine', 0.1, 0.2), 80);
    setTimeout(() => this.playTone(783.99, 'sine', 0.1, 0.2), 160);
    setTimeout(() => this.playTone(1046.50, 'sine', 0.25, 0.3), 240);
  }

  playWinFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.2, 0.25), idx * 90);
    });
  }

  playSound(name) {
    const soundKey = (name || '').toLowerCase();
    if (soundKey === 'coin' || soundKey === 'ring' || soundKey === 'collect' || soundKey === 'gem') {
      this.playCoin();
    } else if (soundKey === 'jump' || soundKey === 'glide' || soundKey === 'bounce') {
      this.playJump();
    } else if (soundKey === 'laser' || soundKey === 'shoot' || soundKey === 'web' || soundKey === 'blast') {
      this.playLaser();
    } else if (soundKey === 'kiblast' || soundKey === 'ki') {
      this.playKiBlast();
    } else if (soundKey === 'explosion' || soundKey === 'hit' || soundKey === 'damage' || soundKey === 'crash') {
      this.playExplosion();
    } else if (soundKey === 'boost' || soundKey === 'turbo' || soundKey === 'speed' || soundKey === 'start') {
      this.playBoost();
    } else if (soundKey === 'rescue' || soundKey === 'door' || soundKey === 'powerup') {
      this.playRescue();
    } else if (soundKey === 'win' || soundKey === 'victory' || soundKey === 'gameover' || soundKey === 'levelup') {
      this.playWinFanfare();
    } else {
      this.playTone(440, 'sine', 0.1, 0.2);
    }
  }
}

window.arcadeSound = new ArcadeSoundFX();

// ==========================================
// 2. UNIVERSAL 5-ANGLE CAMERA RIG
// ==========================================
class ArcadeCameraRig {
  constructor(camera) {
    this.camera = camera;
    this.target = null;
    this.modes = ['back', 'front', 'left', 'right', 'top'];
    this.currentModeIndex = 0; // 0: Back Chase, 1: Front, 2: Left, 3: Right, 4: Top
    this.offsets = {
      back: new THREE.Vector3(0, 5, 12),
      front: new THREE.Vector3(0, 4, -12),
      left: new THREE.Vector3(-14, 5, 2),
      right: new THREE.Vector3(14, 5, 2),
      top: new THREE.Vector3(0, 22, 3)
    };
    this.lerpSpeed = 0.08;
  }

  setTarget(target) {
    this.target = target;
  }

  setAngle(angleName) {
    this.setMode(angleName);
  }

  cycleAngle() {
    return this.cycleMode();
  }

  getCurrentMode() {
    return this.modes[this.currentModeIndex];
  }

  getModeLabel() {
    const labels = {
      back: "🎥 3D CHASE (BACK)",
      front: "📸 FRONTAL HERO VIEW",
      left: "📐 LEFT PROFILE CAM",
      right: "📐 RIGHT PROFILE CAM",
      top: "🚁 TOP-DOWN TACTICAL"
    };
    return labels[this.getCurrentMode()];
  }

  cycleMode() {
    this.currentModeIndex = (this.currentModeIndex + 1) % this.modes.length;
    window.arcadeSound.playTone(600, 'sine', 0.08, 0.1, 200);
    return this.getCurrentMode();
  }

  setMode(modeName) {
    const idx = this.modes.indexOf(modeName);
    if (idx !== -1) {
      this.currentModeIndex = idx;
      window.arcadeSound.playTone(600, 'sine', 0.08, 0.1, 200);
    }
  }

  update(targetPosition = null, targetRotationY = 0, customOffsets = null) {
    const rawTarget = targetPosition || (this.target ? (this.target.position || this.target) : null);
    if (!this.camera || !rawTarget) return;
    const targetPos = rawTarget.isVector3 ? rawTarget : (rawTarget.position || rawTarget);

    const activeOffsets = customOffsets || this.offsets;
    const mode = this.getCurrentMode();
    const offset = activeOffsets[mode] || activeOffsets.back;

    // Rotate offset with target orientation if needed
    const rotatedOffset = offset.clone();
    if (mode !== 'top') {
      rotatedOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), targetRotationY);
    }

    const desiredPosition = targetPos.clone().add(rotatedOffset);
    this.camera.position.lerp(desiredPosition, this.lerpSpeed);

    // Look slightly ahead or at target
    const lookTarget = targetPos.clone();
    if (mode === 'back') {
      lookTarget.y += 1.5;
    } else if (mode === 'front') {
      lookTarget.y += 1.2;
    } else {
      lookTarget.y += 1.0;
    }
    this.camera.lookAt(lookTarget);
  }
}

// ==========================================
// 3. UNIVERSAL 3-STAGE ENVIRONMENTS
// (🌊 Underwater Ocean, 🏜️ Sand Desert, 🌪️ Tornado Storm)
// ==========================================
class StageEnvironmentManager {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.currentStage = 'water'; // 'water', 'sand', 'tornado'
    this.particles = null;
    this.tornadoGroup = null;
    this.envObjects = [];
  }

  setStage(stageName) {
    this.applyStage(stageName);
  }

  clearEnvironment() {
    // Remove previous stage-specific objects
    this.envObjects.forEach(obj => this.scene.remove(obj));
    this.envObjects = [];
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles = null;
    }
    if (this.tornadoGroup) {
      this.scene.remove(this.tornadoGroup);
      this.tornadoGroup = null;
    }
  }

  applyStage(stageName) {
    this.currentStage = stageName;
    this.clearEnvironment();

    if (stageName === 'water') {
      this.buildUnderwaterStage();
    } else if (stageName === 'sand') {
      this.buildSandDesertStage();
    } else if (stageName === 'tornado') {
      this.buildTornadoStage();
    }
  }

  buildUnderwaterStage() {
    this.scene.background = new THREE.Color(0x02162e);
    this.scene.fog = new THREE.FogExp2(0x032347, 0.015);

    const ambLight = new THREE.AmbientLight(0x00d2ff, 0.65);
    const sunLight = new THREE.DirectionalLight(0x55ffff, 1.2);
    sunLight.position.set(20, 60, 20);
    this.scene.add(ambLight, sunLight);
    this.envObjects.push(ambLight, sunLight);

    const floorGeo = new THREE.PlaneGeometry(400, 400, 32, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x053052,
      roughness: 0.8,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.envObjects.push(floor);

    // Corals
    for (let i = 0; i < 45; i++) {
      const coralGeo = new THREE.CylinderGeometry(0.3, 1.2, 4 + Math.random() * 5, 8);
      const coralMat = new THREE.MeshStandardMaterial({
        color: [0x00f0ff, 0xff007f, 0x00f59b, 0xff7b00][i % 4],
        roughness: 0.4,
        emissive: [0x004466, 0x550022, 0x004422, 0x442200][i % 4],
        emissiveIntensity: 0.4
      });
      const coral = new THREE.Mesh(coralGeo, coralMat);
      coral.position.set(
        (Math.random() - 0.5) * 200,
        2,
        (Math.random() - 0.5) * 200
      );
      this.scene.add(coral);
      this.envObjects.push(coral);
    }

    // Floating Bubble Particles
    const bubbleCount = 400;
    const bubbleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(bubbleCount * 3);
    for (let i = 0; i < bubbleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 150;
      positions[i + 1] = Math.random() * 40;
      positions[i + 2] = (Math.random() - 0.5) * 150;
    }
    bubbleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const bubbleMat = new THREE.PointsMaterial({
      color: 0x88ffff,
      size: 0.7,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    this.particles = new THREE.Points(bubbleGeo, bubbleMat);
    this.scene.add(this.particles);
  }

  buildSandDesertStage() {
    this.scene.background = new THREE.Color(0x2d1704);
    this.scene.fog = new THREE.FogExp2(0x452309, 0.012);

    const ambLight = new THREE.AmbientLight(0xffa726, 0.5);
    const sunLight = new THREE.DirectionalLight(0xffd54f, 1.4);
    sunLight.position.set(40, 80, -30);
    this.scene.add(ambLight, sunLight);
    this.envObjects.push(ambLight, sunLight);

    const floorGeo = new THREE.PlaneGeometry(400, 400, 32, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xc68a4c,
      roughness: 0.95,
      metalness: 0.05
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.envObjects.push(floor);

    for (let i = 0; i < 25; i++) {
      const pillarGeo = new THREE.BoxGeometry(3, 8 + Math.random() * 12, 3);
      const pillarMat = new THREE.MeshStandardMaterial({
        color: 0x996533,
        roughness: 0.9
      });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(
        (Math.random() - 0.5) * 220,
        4,
        (Math.random() - 0.5) * 220
      );
      pillar.rotation.y = Math.random() * Math.PI;
      this.scene.add(pillar);
      this.envObjects.push(pillar);
    }

    const sandCount = 600;
    const sandGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(sandCount * 3);
    for (let i = 0; i < sandCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 160;
      positions[i + 1] = Math.random() * 25;
      positions[i + 2] = (Math.random() - 0.5) * 160;
    }
    sandGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const sandMat = new THREE.PointsMaterial({
      color: 0xffd180,
      size: 0.5,
      transparent: true,
      opacity: 0.8
    });
    this.particles = new THREE.Points(sandGeo, sandMat);
    this.scene.add(this.particles);
  }

  buildTornadoStage() {
    this.scene.background = new THREE.Color(0x0b0d18);
    this.scene.fog = new THREE.FogExp2(0x111628, 0.016);

    const ambLight = new THREE.AmbientLight(0x4a148c, 0.45);
    const stormLight = new THREE.DirectionalLight(0x00f0ff, 1.2);
    stormLight.position.set(0, 100, 0);
    this.scene.add(ambLight, stormLight);
    this.envObjects.push(ambLight, stormLight);

    const floorGeo = new THREE.PlaneGeometry(400, 400, 32, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x080c1d,
      roughness: 0.7,
      metalness: 0.3
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.envObjects.push(floor);

    this.tornadoGroup = new THREE.Group();
    const ringCount = 18;
    for (let i = 0; i < ringCount; i++) {
      const radius = 2 + (i * 1.8);
      const ringGeo = new THREE.TorusGeometry(radius, 0.4, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x00f0ff : 0xaa00ff,
        transparent: true,
        opacity: 0.65,
        wireframe: true
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = i * 2.5;
      this.tornadoGroup.add(ring);
    }
    this.tornadoGroup.position.set(0, 0, -40);
    this.scene.add(this.tornadoGroup);
    this.envObjects.push(this.tornadoGroup);

    const windCount = 700;
    const windGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(windCount * 3);
    for (let i = 0; i < windCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 140;
      positions[i + 1] = Math.random() * 45;
      positions[i + 2] = (Math.random() - 0.5) * 140;
    }
    windGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const windMat = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.6,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.particles = new THREE.Points(windGeo, windMat);
    this.scene.add(this.particles);
  }

  animate(delta = 0.016) {
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      if (this.currentStage === 'water') {
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] += delta * 6;
          if (positions[i] > 40) positions[i] = 0;
        }
      } else if (this.currentStage === 'sand') {
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += delta * 15;
          if (positions[i] > 80) positions[i] = -80;
        }
      } else if (this.currentStage === 'tornado') {
        this.particles.rotation.y += delta * 1.5;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    if (this.tornadoGroup) {
      this.tornadoGroup.rotation.y += delta * 3.0;
      this.tornadoGroup.children.forEach((ring, idx) => {
        ring.rotation.z += delta * (idx % 2 === 0 ? 1 : -1) * 2;
      });
    }
  }
}

// ==========================================
// 4. IN-GAME AI TACTICAL AGENT COMPANION
// ==========================================
class ArcadeAIAgent {
  constructor(gameName, containerId) {
    this.gameName = gameName;
    this.container = document.getElementById(containerId);
    this.active = true;
    this.hints = {
      water: [
        "🌊 Ocean currents active! Keep watch for submerged obstacle reefs!",
        "💡 Tactical Hint: Collect glowing aqua orbs for speed and ticket multipliers!"
      ],
      sand: [
        "🏜️ Desert sandstorm detected! Watch your traction over dunes!",
        "💡 Tactical Hint: Use nitro / power jumps to clear deep sand pits!"
      ],
      tornado: [
        "🌪️ Warning: Category-5 Tornado vortex ahead! Steer into wind pockets!",
        "💡 Tactical Hint: High risk, 2X mega tickets rewarded in the eye of the storm!"
      ]
    };
    this.render();
  }

  render() {
    if (!this.container) return;
    let agentEl = document.getElementById('ai-agent-hud');
    if (!agentEl) {
      agentEl = document.createElement('div');
      agentEl.id = 'ai-agent-hud';
      agentEl.className = 'arcade-ai-companion';
      agentEl.innerHTML = `
        <div class="agent-avatar" onclick="window.gameAIAgent.triggerCheer()">🤖</div>
        <div class="agent-dialog">
          <div class="agent-title">AI TACTICAL COMPANION</div>
          <div class="agent-msg" id="agent-msg-text">Ready for action in ${this.gameName}! Choose your stage & camera angle.</div>
        </div>
      `;
      this.container.appendChild(agentEl);
    }
  }

  speak(msg, duration = 4000) {
    const textEl = document.getElementById('agent-msg-text');
    if (textEl) {
      textEl.innerText = msg;
      textEl.parentElement.classList.add('agent-speaking');
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        if (textEl && textEl.parentElement) {
          textEl.parentElement.classList.remove('agent-speaking');
        }
      }, duration);
    }
  }

  onStageChange(stage) {
    const list = this.hints[stage] || [];
    const pick = list[Math.floor(Math.random() * list.length)] || `Entering ${stage.toUpperCase()} realm!`;
    this.speak(pick);
  }

  triggerCheer() {
    const cheers = [
      "🔥 Excellent reflexes! Keep your combo streak rolling!",
      "⚡ Super boost primed! You're dominating the leaderboard!",
      "🎁 Tickets are piling up fast! Beyblades await in the Prize Store!"
    ];
    this.speak(cheers[Math.floor(Math.random() * cheers.length)]);
    window.arcadeSound.playCoin();
  }
}

// ==========================================
// 5. SMART NFC CARD & TICKET PAYOUT BRIDGE
// ==========================================
const SmartCardBridge = {
  getUser() {
    try {
      const saved = localStorage.getItem('ADV_PARK_USER_DATA');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      cardId: "PK-ADV-8899",
      name: "Adventurer",
      tickets: 100,
      cashCredits: 100,
      bonusCredits: 50
    };
  },

  saveUser(user) {
    try {
      localStorage.setItem('ADV_PARK_USER_DATA', JSON.stringify(user));
    } catch (e) {}
  },

  async claimPayout(gameTitle, score, ticketsWon) {
    const user = this.getUser();
    user.tickets = (user.tickets || 0) + ticketsWon;
    this.saveUser(user);

    try {
      await fetch('/api/games/claim-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: user.cardId,
          gameName: gameTitle,
          score,
          ticketsWon
        })
      });
    } catch (e) {}

    window.arcadeSound.playWinFanfare();
    return user;
  },

  async claimTickets(gameTitle, ticketsWon, score = 0) {
    return this.claimPayout(gameTitle, score, ticketsWon);
  }
};

// ==========================================
// 6. LEVEL MANAGER SYSTEM (30 LEVELS)
// ==========================================
class LevelManager {
  constructor(maxLevel = 30) {
    this.level = 1;
    this.maxLevel = maxLevel;
    this.score = 0;
    this.scoreToNextLevel = 500;
    this.speedMultiplier = 1.0;
  }

  addScore(points) {
    this.score += points;
    if (this.score >= this.scoreToNextLevel && this.level < this.maxLevel) {
      this.levelUp();
      return true; // Leveled up
    }
    return false;
  }

  levelUp() {
    this.level++;
    this.scoreToNextLevel += 500 + (this.level * 100);
    this.speedMultiplier = 1.0 + (this.level * 0.05); // Speed increases by 5% each level
  }
}

// ==========================================
// 7. GAME AGENT (AUTONOMOUS OBSTACLE / ENEMY AI)
// ==========================================
class GameAgent {
  constructor(mesh, options = {}) {
    this.mesh = mesh;
    this.speed = options.speed || 0.05;
    this.type = options.type || 'chase';
    this.initialPos = mesh ? mesh.position.clone() : new THREE.Vector3();
    this.angle = Math.random() * Math.PI * 2;
  }

  update(target) {
    if (!this.mesh) return;
    const targetPos = target ? (target.position || target) : null;
    if (this.type === 'chase' && targetPos) {
      const dir = targetPos.clone().sub(this.mesh.position).normalize();
      this.mesh.position.add(dir.multiplyScalar(this.speed));
    } else if (this.type === 'patrol') {
      this.angle += 0.02;
      this.mesh.position.x = this.initialPos.x + Math.sin(this.angle) * 12;
      this.mesh.position.z = this.initialPos.z + Math.cos(this.angle) * 12;
    }
  }
}

window.GameAgent = GameAgent;
window.ArcadeSoundFX = ArcadeSoundFX;
window.ArcadeAudioManager = ArcadeSoundFX;
window.SmartCardBridge = SmartCardBridge;
window.ArcadeCameraRig = ArcadeCameraRig;
window.StageEnvironmentManager = StageEnvironmentManager;
window.ArcadeAIAgent = ArcadeAIAgent;
window.LevelManager = LevelManager;
