/**
 * 3D AEROPLANE & HELICOPTER SKY DEFENDER
 * Pilot high-tech park patrol fighters and helicopters, dogfight enemy drones & defend airspace!
 */

window.initSkyDogfightGame = function(canvasId, onGameOver) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let animationId;
  let score = 0;
  let health = 100;
  let dronesDestroyed = 0;
  let isGameOver = false;

  let plane = {
    x: canvas.width / 2,
    y: canvas.height * 0.7,
    tilt: 0,
    type: 'jet' // 'jet' or 'heli'
  };

  let crosshair = { x: canvas.width / 2, y: canvas.height * 0.4 };
  let bullets = [];
  let targets = [];
  let clouds = [];

  // Spawn Initial Clouds for 3D depth
  for (let i = 0; i < 8; i++) {
    clouds.push({
      x: Math.random() * canvas.width,
      y: Math.random() * (canvas.height * 0.6),
      z: 200 + Math.random() * 800,
      size: 40 + Math.random() * 60
    });
  }

  function spawnDrone() {
    if (isGameOver) return;
    targets.push({
      x: (Math.random() - 0.5) * (canvas.width * 0.8),
      y: (Math.random() - 0.5) * (canvas.height * 0.4),
      z: 900 + Math.random() * 300,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 2,
      hp: 2,
      size: 50
    });
  }

  let spawnTimer = setInterval(spawnDrone, 1400);

  function handleMove(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    crosshair.x = ((clientX - rect.left) / rect.width) * canvas.width;
    crosshair.y = ((clientY - rect.top) / rect.height) * canvas.height;

    plane.x += (crosshair.x - plane.x) * 0.08;
    plane.tilt = (crosshair.x - plane.x) * 0.4;
  }

  function fireGuns() {
    if (isGameOver) return;
    if (window.parkAudio) window.parkAudio.playLaserSound();

    bullets.push({
      x: plane.x - 18,
      y: plane.y,
      z: 50,
      targetX: crosshair.x,
      targetY: crosshair.y
    });
    bullets.push({
      x: plane.x + 18,
      y: plane.y,
      z: 50,
      targetX: crosshair.x,
      targetY: crosshair.y
    });
  }

  canvas.addEventListener('mousemove', handleMove);
  canvas.addEventListener('touchmove', handleMove, { passive: true });
  canvas.addEventListener('mousedown', fireGuns);
  canvas.addEventListener('touchstart', (e) => { handleMove(e); fireGuns(); }, { passive: true });

  function update() {
    if (isGameOver) return;

    // Move Clouds towards camera
    clouds.forEach(c => {
      c.z -= 4;
      if (c.z <= 50) c.z = 1000;
    });

    // Move Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.z += 35;
      b.x += (b.targetX - b.x) * 0.15;
      b.y += (b.targetY - b.y) * 0.15;

      // Check target hits
      for (let j = targets.length - 1; j >= 0; j--) {
        const t = targets[j];
        if (Math.abs(b.z - t.z) < 60) {
          const scale = 400 / Math.max(1, t.z);
          const screenX = canvas.width / 2 + t.x * scale;
          const screenY = canvas.height * 0.4 + t.y * scale;
          if (Math.hypot(b.x - screenX, b.y - screenY) < t.size * scale) {
            t.hp--;
            bullets.splice(i, 1);
            if (window.parkAudio) window.parkAudio.playZombieHit();

            if (t.hp <= 0) {
              score += 250;
              dronesDestroyed++;
              targets.splice(j, 1);
            }
            break;
          }
        }
      }

      if (b.z > 1000) bullets.splice(i, 1);
    }

    // Move Drones
    for (let i = targets.length - 1; i >= 0; i--) {
      const t = targets[i];
      t.z -= 3;
      t.x += t.vx;
      t.y += t.vy;

      if (t.z <= 60) {
        // Drone flew past or struck aircraft
        health -= 20;
        targets.splice(i, 1);

        if (health <= 0) {
          isGameOver = true;
          clearInterval(spawnTimer);
          const ticketsWon = Math.max(10, Math.floor(score / 40));
          if (onGameOver) onGameOver({ score, ticketsWon, dronesDestroyed });
          return;
        }
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 3D Sunset Sky
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, '#0f172a');
    sky.addColorStop(0.5, '#ea580c');
    sky.addColorStop(1, '#ffd700');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3D Clouds
    clouds.forEach(c => {
      const scale = 400 / Math.max(1, c.z);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size * scale, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3D Drones (Sorted by depth)
    targets.sort((a, b) => b.z - a.z);
    targets.forEach(t => {
      const scale = 400 / Math.max(1, t.z);
      const screenX = canvas.width / 2 + t.x * scale;
      const screenY = canvas.height * 0.4 + t.y * scale;
      const size = t.size * scale;

      ctx.save();
      ctx.translate(screenX, screenY);

      // Enemy Drone / Fighter
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.5);
      ctx.lineTo(size * 0.6, size * 0.4);
      ctx.lineTo(0, size * 0.2);
      ctx.lineTo(-size * 0.6, size * 0.4);
      ctx.closePath();
      ctx.fill();

      // Energy Shield Circle
      ctx.strokeStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.55, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    });

    // Render Laser Bullets
    bullets.forEach(b => {
      ctx.fillStyle = '#00f59b';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Render Player Jet Cockpit / Aircraft
    ctx.save();
    ctx.translate(plane.x, plane.y);
    ctx.rotate((plane.tilt * Math.PI) / 180);

    // Jet Wings
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(0, -50);
    ctx.lineTo(60, 30);
    ctx.lineTo(20, 30);
    ctx.lineTo(0, 40);
    ctx.lineTo(-20, 30);
    ctx.lineTo(-60, 30);
    ctx.closePath();
    ctx.fill();

    // Jet Cockpit Canopy
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.ellipse(0, -10, 10, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // Afterburner Flames
    ctx.fillStyle = '#ff007f';
    ctx.beginPath();
    ctx.moveTo(-10, 40);
    ctx.lineTo(0, 65);
    ctx.lineTo(10, 40);
    ctx.fill();

    ctx.restore();

    // Crosshair
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(crosshair.x, crosshair.y, 22, 0, Math.PI * 2);
    ctx.moveTo(crosshair.x - 30, crosshair.y);
    ctx.lineTo(crosshair.x + 30, crosshair.y);
    ctx.moveTo(crosshair.x, crosshair.y - 30);
    ctx.lineTo(crosshair.x, crosshair.y + 30);
    ctx.stroke();

    // HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Orbitron, sans-serif';
    ctx.fillText(`AIR DEFENSE SCORE: ${score}`, 20, 35);
    ctx.fillText(`DRONES DOWNED: ${dronesDestroyed}`, 20, 60);

    // Shield Bar
    ctx.fillStyle = '#334155';
    ctx.fillRect(canvas.width - 160, 20, 140, 16);
    ctx.fillStyle = health > 40 ? '#00f59b' : '#ff0055';
    ctx.fillRect(canvas.width - 160, 20, (140 * health) / 100, 16);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(canvas.width - 160, 20, 140, 16);

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
      canvas.removeEventListener('mousedown', fireGuns);
    }
  };
};
