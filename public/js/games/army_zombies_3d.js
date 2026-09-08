/**
 * 3D TACTICAL ARMY & ZOMBIE SURVIVAL FPS SHOOTER
 * Defend country borders & rescue bombing shelters from incoming zombie waves
 */

window.initArmyZombiesGame = function(canvasId, onGameOver) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let animationId;
  let score = 0;
  let health = 100;
  let ammo = 30;
  let maxAmmo = 30;
  let wave = 1;
  let zombiesKilled = 0;
  let isGameOver = false;
  let isScope = false;
  let gunKick = 0;
  let crosshair = { x: canvas.width / 2, y: canvas.height / 2 };

  // Targets & Zombies
  let enemies = [];
  let bloodParticles = [];
  let muzzleFlashes = [];

  function spawnEnemy() {
    if (isGameOver) return;
    const isZombie = Math.random() > 0.3;
    const isShelterThreat = Math.random() > 0.7;

    enemies.push({
      x: (Math.random() - 0.5) * (canvas.width * 0.8),
      y: 0,
      z: 800 + Math.random() * 400, // Distance in 3D
      speed: 2.2 + wave * 0.5,
      type: isZombie ? 'zombie' : (isShelterThreat ? 'drone' : 'infiltrator'),
      hp: isZombie ? 2 : 3,
      maxHp: isZombie ? 2 : 3,
      size: 60,
      bobble: Math.random() * Math.PI
    });
  }

  // Pre-spawn initial wave
  for (let i = 0; i < 5; i++) {
    spawnEnemy();
  }

  let spawnTimer = setInterval(spawnEnemy, 1600);

  // Mouse / Touch Aiming
  function handleMove(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    crosshair.x = ((clientX - rect.left) / rect.width) * canvas.width;
    crosshair.y = ((clientY - rect.top) / rect.height) * canvas.height;
  }

  function shoot() {
    if (isGameOver) return;
    if (ammo <= 0) {
      // Auto reload
      reload();
      return;
    }

    ammo--;
    gunKick = 18;
    if (window.parkAudio) window.parkAudio.playLaserSound();

    muzzleFlashes.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 40,
      y: canvas.height - 60,
      life: 6
    });

    // Check hit
    let hitSomething = false;
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      const scale = 500 / Math.max(1, e.z);
      const screenX = canvas.width / 2 + e.x * scale;
      const screenY = canvas.height / 2 + (e.y + Math.sin(e.bobble) * 10) * scale;
      const hitRadius = (e.size * scale) * (isScope ? 1.5 : 1.0);

      const dist = Math.hypot(crosshair.x - screenX, crosshair.y - screenY);
      if (dist < hitRadius) {
        e.hp--;
        hitSomething = true;
        if (window.parkAudio) window.parkAudio.playZombieHit();

        // Blood particles
        for (let p = 0; p < 8; p++) {
          bloodParticles.push({
            x: screenX,
            y: screenY,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: e.type === 'zombie' ? '#00f59b' : '#ff0055',
            life: 20
          });
        }

        if (e.hp <= 0) {
          score += (e.type === 'zombie' ? 150 : 250) * wave;
          zombiesKilled++;
          enemies.splice(i, 1);

          if (zombiesKilled % 8 === 0) {
            wave++;
            ammo = maxAmmo;
          }
        }
        break;
      }
    }
  }

  function reload() {
    ammo = maxAmmo;
    if (window.parkAudio) window.parkAudio.playCoinSound();
  }

  canvas.addEventListener('mousemove', handleMove);
  canvas.addEventListener('touchmove', handleMove, { passive: true });
  canvas.addEventListener('mousedown', shoot);
  canvas.addEventListener('touchstart', (e) => { handleMove(e); shoot(); }, { passive: true });

  // Game Loop
  function update() {
    if (isGameOver) return;

    gunKick *= 0.85;

    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.z -= e.speed;
      e.bobble += 0.08;

      if (e.z <= 40) {
        // Enemy reached barrier
        health -= 15;
        enemies.splice(i, 1);
        if (window.parkAudio) window.parkAudio.playZombieHit();

        if (health <= 0) {
          health = 0;
          isGameOver = true;
          clearInterval(spawnTimer);
          const ticketsWon = Math.max(5, Math.floor(score / 40));
          if (onGameOver) onGameOver({ score, ticketsWon, wave, kills: zombiesKilled });
          return;
        }
      }
    }

    // Update blood particles
    for (let i = bloodParticles.length - 1; i >= 0; i--) {
      const p = bloodParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) bloodParticles.splice(i, 1);
    }

    // Update muzzle flashes
    for (let i = muzzleFlashes.length - 1; i >= 0; i--) {
      muzzleFlashes[i].life--;
      if (muzzleFlashes[i].life <= 0) muzzleFlashes.splice(i, 1);
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 3D Background - Military Outpost & Desert Bunker at Night
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#060a17');
    grad.addColorStop(0.5, '#121936');
    grad.addColorStop(1, '#080d1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid Floor
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, canvas.height / 2);
      ctx.lineTo((x - canvas.width / 2) * 3 + canvas.width / 2, canvas.height);
      ctx.stroke();
    }
    for (let y = canvas.height / 2; y <= canvas.height; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw Shelter & Country Defense Barricades
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    ctx.strokeStyle = '#00f0ff';
    ctx.strokeRect(0, canvas.height - 40, canvas.width, 40);

    // Sort enemies by depth (back to front)
    enemies.sort((a, b) => b.z - a.z);

    // Render 3D Enemies
    enemies.forEach(e => {
      const scale = 500 / Math.max(1, e.z);
      const screenX = canvas.width / 2 + e.x * scale;
      const screenY = canvas.height / 2 + (e.y + Math.sin(e.bobble) * 12) * scale;
      const size = e.size * scale;

      ctx.save();
      ctx.translate(screenX, screenY);

      if (e.type === 'zombie') {
        // Glowing Zombie Monster
        ctx.fillStyle = '#059669';
        ctx.beginPath();
        ctx.arc(0, -size * 0.4, size * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(-size * 0.12, -size * 0.42, size * 0.08, 0, Math.PI * 2);
        ctx.arc(size * 0.12, -size * 0.42, size * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Torso
        ctx.fillStyle = '#047857';
        ctx.fillRect(-size * 0.3, -size * 0.05, size * 0.6, size * 0.6);

        // Claws
        ctx.strokeStyle = '#a7f3d0';
        ctx.lineWidth = 3 * scale;
        ctx.beginPath();
        ctx.moveTo(-size * 0.3, 0);
        ctx.lineTo(-size * 0.5, size * 0.2);
        ctx.moveTo(size * 0.3, 0);
        ctx.lineTo(size * 0.5, size * 0.2);
        ctx.stroke();
      } else if (e.type === 'drone') {
        // Bombing Drone
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.4);
        ctx.lineTo(size * 0.4, size * 0.2);
        ctx.lineTo(-size * 0.4, size * 0.2);
        ctx.closePath();
        ctx.fill();

        // Rotor Glow
        ctx.strokeStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Hostile Infiltrator
        ctx.fillStyle = '#475569';
        ctx.fillRect(-size * 0.25, -size * 0.5, size * 0.5, size * 0.9);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-size * 0.15, -size * 0.4, size * 0.3, size * 0.15);
      }

      // Health Bar above enemy
      const hpPct = e.hp / e.maxHp;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-size * 0.3, -size * 0.7, size * 0.6, 6);
      ctx.fillStyle = hpPct > 0.5 ? '#10b981' : '#ef4444';
      ctx.fillRect(-size * 0.3, -size * 0.7, size * 0.6 * hpPct, 6);

      ctx.restore();
    });

    // Render Blood Particles
    bloodParticles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Gun Model at bottom screen
    ctx.save();
    ctx.translate(canvas.width / 2 + 60, canvas.height - gunKick);
    // Assault Rifle Barrel
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-20, -120, 40, 120);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-15, -140, 30, 20);
    // Scope Laser Sight
    ctx.strokeStyle = 'rgba(255, 0, 80, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -140);
    ctx.lineTo(crosshair.x - (canvas.width / 2 + 60), crosshair.y - (canvas.height - gunKick));
    ctx.stroke();
    ctx.restore();

    // Muzzle Flash
    muzzleFlashes.forEach(f => {
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(f.x, f.y - 140, 30, 0, Math.PI * 2);
      ctx.fill();
    });

    // Crosshair HUD
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(crosshair.x, crosshair.y, 18, 0, Math.PI * 2);
    ctx.moveTo(crosshair.x - 26, crosshair.y);
    ctx.lineTo(crosshair.x + 26, crosshair.y);
    ctx.moveTo(crosshair.x, crosshair.y - 26);
    ctx.lineTo(crosshair.x, crosshair.y + 26);
    ctx.stroke();

    // HUD Display
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Orbitron, sans-serif';
    ctx.fillText(`SCORE: ${score}`, 20, 35);
    ctx.fillText(`WAVE: ${wave}`, 20, 60);

    // Ammo Counter
    ctx.fillStyle = ammo > 5 ? '#00f0ff' : '#ff0055';
    ctx.fillText(`AMMO: ${ammo}/${maxAmmo}`, canvas.width - 150, 35);

    // Country Defense Barricade Health Bar
    ctx.fillStyle = '#64748b';
    ctx.fillRect(canvas.width / 2 - 120, 20, 240, 16);
    ctx.fillStyle = health > 40 ? '#00f59b' : '#ff2a5f';
    ctx.fillRect(canvas.width / 2 - 120, 20, (240 * health) / 100, 16);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(canvas.width / 2 - 120, 20, 240, 16);
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`BASE INTEGRITY: ${health}%`, canvas.width / 2, 33);
    ctx.textAlign = 'left';

    // Game Loop
    update();
    if (!isGameOver) {
      animationId = requestAnimationFrame(render);
    }
  }

  render();

  return {
    destroy: () => {
      cancelAnimationFrame(animationId);
      clearInterval(spawnTimer);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mousedown', shoot);
    },
    reload: () => reload()
  };
};
