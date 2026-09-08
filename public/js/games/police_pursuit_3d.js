/**
 * 3D POLICE HIGHWAY PURSUIT & THIEF CAPTURE
 * Drive high-speed police cruiser, catch escaping bandits, activate siren boosts & keep city safe
 */

window.initPolicePursuitGame = function(canvasId, onGameOver) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let animationId;
  let score = 0;
  let thievesCaptured = 0;
  let distance = 0;
  let speed = 12;
  let maxSpeed = 28;
  let nitro = 100;
  let isGameOver = false;

  let player = {
    x: 0, // -1 to 1 across lanes
    y: canvas.height - 110,
    width: 64,
    height: 100,
    sirenAngle: 0
  };

  let keys = { left: false, right: false, up: false, down: false };
  let traffic = [];
  let roadOffset = 0;

  function spawnTraffic() {
    if (isGameOver) return;
    const isThief = Math.random() > 0.45;
    traffic.push({
      x: (Math.random() * 1.6) - 0.8, // Lane coordinate
      z: 1000,
      speed: isThief ? 7 : 4,
      isThief: isThief,
      color: isThief ? '#ef4444' : '#3b82f6',
      hp: isThief ? 3 : 1
    });
  }

  let trafficTimer = setInterval(spawnTraffic, 1200);

  function handleKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') keys.up = true; // Nitro
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = true;
  }

  function handleKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') keys.up = false;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = false;
  }

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  // Touch controls
  let touchStartX = 0;
  canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    keys.up = true; // Auto accelerate on touch
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    const diff = e.touches[0].clientX - touchStartX;
    if (diff < -20) { keys.left = true; keys.right = false; }
    else if (diff > 20) { keys.right = true; keys.left = false; }
    else { keys.left = false; keys.right = false; }
  }, { passive: true });

  canvas.addEventListener('touchend', () => {
    keys.left = false; keys.right = false; keys.up = false;
  });

  function update() {
    if (isGameOver) return;

    // Movement
    if (keys.left) player.x = Math.max(-0.85, player.x - 0.035);
    if (keys.right) player.x = Math.min(0.85, player.x + 0.035);

    // Speed & Nitro
    if (keys.up && nitro > 0) {
      speed = Math.min(maxSpeed, speed + 0.4);
      nitro -= 0.6;
      if (Math.random() > 0.6 && window.parkAudio) window.parkAudio.playEngineRev();
    } else {
      speed = Math.max(10, speed - 0.2);
      nitro = Math.min(100, nitro + 0.2);
    }

    roadOffset = (roadOffset + speed) % 100;
    distance += Math.floor(speed / 5);
    score += Math.floor(speed / 8);

    player.sirenAngle += 0.2;

    // Traffic update
    for (let i = traffic.length - 1; i >= 0; i--) {
      const car = traffic[i];
      car.z -= (speed - car.speed);

      // Collision check near player
      if (car.z <= 60 && car.z >= -30) {
        const laneDiff = Math.abs(player.x - car.x);
        if (laneDiff < 0.28) {
          if (car.isThief) {
            // Captured thief!
            thievesCaptured++;
            score += 500;
            if (window.parkAudio) window.parkAudio.playCoinSound();
            traffic.splice(i, 1);
            continue;
          } else {
            // Hit civilian car
            isGameOver = true;
            clearInterval(trafficTimer);
            const ticketsWon = Math.max(8, Math.floor(score / 50) + thievesCaptured * 15);
            if (onGameOver) onGameOver({ score, ticketsWon, distance, thievesCaptured });
            return;
          }
        }
      }

      if (car.z < -100) {
        traffic.splice(i, 1);
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 3D Horizon Sky & City Skyline
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.45);
    skyGrad.addColorStop(0, '#090d21');
    skyGrad.addColorStop(1, '#1b244d');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.45);

    // City Silhouette
    ctx.fillStyle = '#0a0e24';
    for (let x = 0; x < canvas.width; x += 35) {
      const h = 40 + Math.sin(x) * 30;
      ctx.fillRect(x, canvas.height * 0.45 - h, 30, h);
    }

    // 3D Road Perspective
    const horizonY = canvas.height * 0.45;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.35, horizonY);
    ctx.lineTo(canvas.width * 0.65, horizonY);
    ctx.lineTo(canvas.width * 0.95, canvas.height);
    ctx.lineTo(canvas.width * 0.05, canvas.height);
    ctx.closePath();
    ctx.fill();

    // Road Markings (Animated)
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 20]);
    ctx.lineDashOffset = -roadOffset;
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.5, horizonY);
    ctx.lineTo(canvas.width * 0.5, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Sort traffic by depth
    traffic.sort((a, b) => b.z - a.z);

    // Render Traffic
    traffic.forEach(car => {
      const scale = 250 / Math.max(1, car.z);
      const roadWidthAtZ = (canvas.width * 0.3) + ((canvas.width * 0.9 - canvas.width * 0.3) * ((1000 - car.z) / 1000));
      const screenX = canvas.width / 2 + car.x * (roadWidthAtZ * 0.4);
      const screenY = horizonY + (canvas.height - horizonY) * ((1000 - car.z) / 1000);
      const width = 50 * scale;
      const height = 40 * scale;

      ctx.save();
      ctx.translate(screenX, screenY);

      // Car body
      ctx.fillStyle = car.color;
      ctx.fillRect(-width / 2, -height, width, height);

      // Car Roof
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-width * 0.35, -height * 1.3, width * 0.7, height * 0.4);

      // Taillights
      ctx.fillStyle = car.isThief ? '#ff0055' : '#ef4444';
      ctx.fillRect(-width * 0.4, -height * 0.3, width * 0.2, height * 0.2);
      ctx.fillRect(width * 0.2, -height * 0.3, width * 0.2, height * 0.2);

      if (car.isThief) {
        // "WANTED" Indicator
        ctx.fillStyle = '#ff0055';
        ctx.font = `bold ${Math.max(10, 14 * scale)}px Orbitron, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText("⚠️ THIEF", 0, -height * 1.5);
      }

      ctx.restore();
    });

    // Render Player Police Cruiser
    const pScreenX = canvas.width / 2 + player.x * (canvas.width * 0.38);
    const pScreenY = player.y;

    ctx.save();
    ctx.translate(pScreenX, pScreenY);

    // Police Cruiser Body (Gloss White & Dark Blue)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-player.width / 2, 0, player.width, player.height * 0.7);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-player.width * 0.4, -player.height * 0.25, player.width * 0.8, player.height * 0.4);

    // "POLICE" Decal
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 10px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("POLICE", 0, 20);

    // Flashing Red/Blue Siren Light Bar
    const redGlow = Math.sin(player.sirenAngle) > 0;
    ctx.fillStyle = redGlow ? '#ff0055' : '#1e293b';
    ctx.fillRect(-18, -player.height * 0.35, 16, 8);
    ctx.fillStyle = !redGlow ? '#00f0ff' : '#1e293b';
    ctx.fillRect(2, -player.height * 0.35, 16, 8);

    // Siren Light Beam Flash
    ctx.fillStyle = redGlow ? 'rgba(255, 0, 85, 0.25)' : 'rgba(0, 240, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(0, -player.height * 0.35, 60, 0, Math.PI * 2);
    ctx.fill();

    // Wheels & Exhaust
    ctx.fillStyle = '#020617';
    ctx.fillRect(-player.width * 0.55, 10, 8, 20);
    ctx.fillRect(player.width * 0.45, 10, 8, 20);

    if (keys.up) {
      // Nitro Flame Exhaust
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.moveTo(-10, player.height * 0.7);
      ctx.lineTo(-5, player.height * 0.7 + 25);
      ctx.lineTo(0, player.height * 0.7);
      ctx.moveTo(0, player.height * 0.7);
      ctx.lineTo(5, player.height * 0.7 + 25);
      ctx.lineTo(10, player.height * 0.7);
      ctx.fill();
    }

    ctx.restore();

    // HUD Dashboard
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SPEED: ${Math.floor(speed * 8)} KM/H`, 20, 35);
    ctx.fillText(`BANDITS CAPTURED: ${thievesCaptured}`, 20, 60);

    // Nitro Bar
    ctx.fillStyle = '#334155';
    ctx.fillRect(canvas.width - 160, 20, 140, 16);
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(canvas.width - 160, 20, (140 * nitro) / 100, 16);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(canvas.width - 160, 20, 140, 16);
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText("NITRO BOOST [SPACE/UP]", canvas.width - 160, 50);

    update();
    if (!isGameOver) {
      animationId = requestAnimationFrame(render);
    }
  }

  render();

  return {
    destroy: () => {
      cancelAnimationFrame(animationId);
      clearInterval(trafficTimer);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    }
  };
};
