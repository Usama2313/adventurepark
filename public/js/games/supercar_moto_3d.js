/**
 * 3D HYPER SUPERCAR & MOTORBIKE HIGHWAY RACER
 * Switch between Hypercar & Superbike, trigger nitro boosts and weave through neon highway traffic
 */

window.initSupercarMotoGame = function(canvasId, onGameOver, vehicleChoice = 'car') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let animationId;
  let vehicleType = vehicleChoice; // 'car' or 'bike'
  let score = 0;
  let distance = 0;
  let speed = 14;
  let maxSpeed = 32;
  let nitro = 100;
  let isGameOver = false;

  let player = {
    x: 0,
    y: canvas.height - 100,
    width: vehicleType === 'car' ? 68 : 34,
    height: vehicleType === 'car' ? 100 : 75,
    tilt: 0
  };

  let keys = { left: false, right: false, up: false, down: false };
  let obstacles = [];
  let coinOrbs = [];
  let roadOffset = 0;

  function spawnEntities() {
    if (isGameOver) return;
    
    // Spawn Obstacle Vehicle
    if (Math.random() > 0.3) {
      obstacles.push({
        x: (Math.random() * 1.5) - 0.75,
        z: 1100,
        speed: 5 + Math.random() * 4,
        type: Math.random() > 0.5 ? 'truck' : 'sedan',
        color: ['#e11d48', '#8b5cf6', '#ea580c', '#06b6d4'][Math.floor(Math.random() * 4)]
      });
    }

    // Spawn Bonus Arcade Gold Rings
    if (Math.random() > 0.4) {
      coinOrbs.push({
        x: (Math.random() * 1.4) - 0.7,
        z: 1100,
        collected: false
      });
    }
  }

  let spawnTimer = setInterval(spawnEntities, 1100);

  function handleKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') keys.up = true;
    if (e.key === 'v' || e.key === 'V') {
      // Toggle vehicle
      vehicleType = vehicleType === 'car' ? 'bike' : 'car';
      player.width = vehicleType === 'car' ? 68 : 34;
      player.height = vehicleType === 'car' ? 100 : 75;
    }
  }

  function handleKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') keys.up = false;
  }

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  // Touch controls
  let touchStartX = 0;
  canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    keys.up = true;
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

    if (keys.left) {
      player.x = Math.max(-0.85, player.x - 0.04);
      player.tilt = Math.max(-15, player.tilt - 2);
    } else if (keys.right) {
      player.x = Math.min(0.85, player.x + 0.04);
      player.tilt = Math.min(15, player.tilt + 2);
    } else {
      player.tilt *= 0.8;
    }

    if (keys.up && nitro > 0) {
      speed = Math.min(maxSpeed, speed + 0.5);
      nitro -= 0.65;
      if (Math.random() > 0.6 && window.parkAudio) window.parkAudio.playEngineRev();
    } else {
      speed = Math.max(12, speed - 0.25);
      nitro = Math.min(100, nitro + 0.25);
    }

    roadOffset = (roadOffset + speed) % 100;
    distance += Math.floor(speed / 4);
    score += Math.floor(speed / 6);

    // Update Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.z -= (speed - obs.speed);

      if (obs.z <= 60 && obs.z >= -30) {
        const laneDiff = Math.abs(player.x - obs.x);
        if (laneDiff < (vehicleType === 'car' ? 0.28 : 0.20)) {
          // Crash!
          isGameOver = true;
          clearInterval(spawnTimer);
          const ticketsWon = Math.max(10, Math.floor(score / 45));
          if (onGameOver) onGameOver({ score, ticketsWon, distance, vehicle: vehicleType });
          return;
        }
      }

      if (obs.z < -100) obstacles.splice(i, 1);
    }

    // Update Coins
    for (let i = coinOrbs.length - 1; i >= 0; i--) {
      const coin = coinOrbs[i];
      coin.z -= speed;

      if (coin.z <= 60 && coin.z >= -30 && !coin.collected) {
        const laneDiff = Math.abs(player.x - coin.x);
        if (laneDiff < 0.25) {
          coin.collected = true;
          score += 300;
          if (window.parkAudio) window.parkAudio.playCoinSound();
          coinOrbs.splice(i, 1);
          continue;
        }
      }

      if (coin.z < -100) coinOrbs.splice(i, 1);
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Neon Cyberpunk Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.45);
    skyGrad.addColorStop(0, '#0a0217');
    skyGrad.addColorStop(0.6, '#240046');
    skyGrad.addColorStop(1, '#ff007f');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.45);

    // Cyber Sun
    ctx.fillStyle = '#ffd60a';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height * 0.45, 55, Math.PI, Math.PI * 2);
    ctx.fill();

    // 3D Neon Highway
    const horizonY = canvas.height * 0.45;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.38, horizonY);
    ctx.lineTo(canvas.width * 0.62, horizonY);
    ctx.lineTo(canvas.width * 0.96, canvas.height);
    ctx.lineTo(canvas.width * 0.04, canvas.height);
    ctx.closePath();
    ctx.fill();

    // Neon Edge Rails
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.38, horizonY);
    ctx.lineTo(canvas.width * 0.04, canvas.height);
    ctx.moveTo(canvas.width * 0.62, horizonY);
    ctx.lineTo(canvas.width * 0.96, canvas.height);
    ctx.stroke();

    // Road Dashes
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 4;
    ctx.setLineDash([25, 25]);
    ctx.lineDashOffset = -roadOffset;
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.5, horizonY);
    ctx.lineTo(canvas.width * 0.5, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Sort entities by Z
    const allEntities = [...obstacles.map(o => ({ ...o, isCoin: false })), ...coinOrbs.map(c => ({ ...c, isCoin: true }))];
    allEntities.sort((a, b) => b.z - a.z);

    // Render 3D Entities
    allEntities.forEach(ent => {
      const scale = 260 / Math.max(1, ent.z);
      const roadWidthAtZ = (canvas.width * 0.24) + ((canvas.width * 0.92 - canvas.width * 0.24) * ((1100 - ent.z) / 1100));
      const screenX = canvas.width / 2 + ent.x * (roadWidthAtZ * 0.42);
      const screenY = horizonY + (canvas.height - horizonY) * ((1100 - ent.z) / 1100);

      ctx.save();
      ctx.translate(screenX, screenY);

      if (ent.isCoin) {
        // Glowing Gold Ring
        ctx.strokeStyle = '#ffd60a';
        ctx.lineWidth = 4 * scale;
        ctx.beginPath();
        ctx.arc(0, -25 * scale, 18 * scale, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Vehicle
        const w = (ent.type === 'truck' ? 65 : 50) * scale;
        const h = (ent.type === 'truck' ? 55 : 38) * scale;

        ctx.fillStyle = ent.color;
        ctx.fillRect(-w / 2, -h, w, h);

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-w * 0.35, -h * 1.3, w * 0.7, h * 0.35);

        // Lights
        ctx.fillStyle = '#ff2a5f';
        ctx.fillRect(-w * 0.4, -h * 0.3, w * 0.2, h * 0.2);
        ctx.fillRect(w * 0.2, -h * 0.3, w * 0.2, h * 0.2);
      }

      ctx.restore();
    });

    // Render Player Vehicle
    const pScreenX = canvas.width / 2 + player.x * (canvas.width * 0.39);
    const pScreenY = player.y;

    ctx.save();
    ctx.translate(pScreenX, pScreenY);
    ctx.rotate((player.tilt * Math.PI) / 180);

    if (vehicleType === 'car') {
      // Hyper Supercar (Lamborghini Style)
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(-player.width / 2, 0, player.width, player.height * 0.7);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-player.width * 0.38, -player.height * 0.25, player.width * 0.76, player.height * 0.4);

      // Carbon Wing
      ctx.fillStyle = '#020617';
      ctx.fillRect(-player.width * 0.55, player.height * 0.65, player.width * 1.1, 10);

      // Taillight Neon Strip
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(-player.width * 0.45, player.height * 0.55, player.width * 0.9, 6);
    } else {
      // Superbike (Ducati Style)
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(-player.width / 2, 0, player.width, player.height * 0.8);

      // Rider Helmet
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(0, -15, 14, 0, Math.PI * 2);
      ctx.fill();

      // Exhaust Pipe
      ctx.fillStyle = '#475569';
      ctx.fillRect(player.width * 0.4, 20, 6, 25);
    }

    // Nitro Flames
    if (keys.up) {
      ctx.fillStyle = '#00f59b';
      ctx.beginPath();
      ctx.moveTo(-8, player.height * 0.75);
      ctx.lineTo(0, player.height * 0.75 + 30);
      ctx.lineTo(8, player.height * 0.75);
      ctx.fill();
    }

    ctx.restore();

    // HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Orbitron, sans-serif';
    ctx.fillText(`VEHICLE: ${vehicleType.toUpperCase()} [KEY: V]`, 20, 35);
    ctx.fillText(`SCORE: ${score}`, 20, 60);

    // Speedometer
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(`SPEED: ${Math.floor(speed * 7.5)} KM/H`, canvas.width - 200, 35);

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
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    }
  };
};
