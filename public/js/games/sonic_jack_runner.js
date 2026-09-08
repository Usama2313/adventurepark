/**
 * SONIC SPEED DASH & JACK THE RUNNER
 * High-velocity platform runner with Sonic, Mario & Jack characters collecting golden rings & tickets!
 */

window.initSonicRunnerGame = function(canvasId, onGameOver, heroChoice = 'sonic') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let animationId;
  let hero = heroChoice; // 'sonic', 'jack', or 'mario'
  let score = 0;
  let rings = 0;
  let distance = 0;
  let speed = 8;
  let isGameOver = false;

  let player = {
    x: 100,
    y: canvas.height - 120,
    vy: 0,
    width: 44,
    height: 52,
    isJumping: false,
    isRolling: false,
    legAngle: 0
  };

  let groundY = canvas.height - 70;
  let obstacles = [];
  let goldRings = [];
  let bgOffset = 0;

  function spawnWorldObjects() {
    if (isGameOver) return;
    
    // Spawn Obstacle Spikes / Robots
    if (Math.random() > 0.35) {
      obstacles.push({
        x: canvas.width + 50,
        y: groundY - 32,
        width: 32,
        height: 32,
        type: Math.random() > 0.5 ? 'spikes' : 'crabBot'
      });
    }

    // Spawn Ring Arc
    if (Math.random() > 0.4) {
      const baseY = groundY - 60 - Math.random() * 40;
      for (let i = 0; i < 4; i++) {
        goldRings.push({
          x: canvas.width + 120 + i * 35,
          y: baseY,
          collected: false
        });
      }
    }
  }

  let spawnTimer = setInterval(spawnWorldObjects, 1300);

  function jump() {
    if (!player.isJumping && !isGameOver) {
      player.vy = -14;
      player.isJumping = true;
      player.isRolling = true;
      if (window.parkAudio) window.parkAudio.playCoinSound();
    }
  }

  function handleKeyDown(e) {
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      jump();
    }
  }

  window.addEventListener('keydown', handleKeyDown);
  canvas.addEventListener('click', jump);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); jump(); }, { passive: false });

  function update() {
    if (isGameOver) return;

    speed += 0.002;
    distance += Math.floor(speed / 2);
    score += Math.floor(speed / 3);
    bgOffset = (bgOffset + speed) % canvas.width;

    // Player Physics
    player.y += player.vy;
    player.vy += 0.75; // Gravity
    player.legAngle += 0.4;

    if (player.y >= groundY - player.height) {
      player.y = groundY - player.height;
      player.vy = 0;
      player.isJumping = false;
      player.isRolling = false;
    }

    // Update Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= speed;

      // Hitbox
      if (
        player.x < obs.x + obs.width &&
        player.x + player.width > obs.x &&
        player.y < obs.y + obs.height &&
        player.y + player.height > obs.y
      ) {
        // Crash
        isGameOver = true;
        clearInterval(spawnTimer);
        const ticketsWon = Math.max(12, Math.floor(score / 40) + rings * 2);
        if (onGameOver) onGameOver({ score, ticketsWon, rings, distance });
        return;
      }

      if (obs.x < -100) obstacles.splice(i, 1);
    }

    // Update Rings
    for (let i = goldRings.length - 1; i >= 0; i--) {
      const r = goldRings[i];
      r.x -= speed;

      if (!r.collected && Math.hypot(player.x + 20 - r.x, player.y + 25 - r.y) < 36) {
        r.collected = true;
        rings++;
        score += 200;
        if (window.parkAudio) window.parkAudio.playCoinSound();
      }

      if (r.x < -100) goldRings.splice(i, 1);
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Green Hill & Retro Sega Sky Background
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, '#0284c7');
    sky.addColorStop(0.6, '#38bdf8');
    sky.addColorStop(1, '#bae6fd');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Parallax Hills
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(canvas.width * 0.3 - (bgOffset * 0.2) % canvas.width, groundY + 100, 200, 0, Math.PI * 2);
    ctx.arc(canvas.width * 0.8 - (bgOffset * 0.2) % canvas.width, groundY + 120, 220, 0, Math.PI * 2);
    ctx.fill();

    // Checkered Green Hill Ground
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(0, groundY, canvas.width, 16);

    // Render Gold Rings
    goldRings.forEach(r => {
      if (r.collected) return;
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 14, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Render Obstacles
    obstacles.forEach(obs => {
      if (obs.type === 'spikes') {
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.fill();
      } else {
        // Badnik Crab Robot
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(obs.x + obs.width / 2, obs.y + 10, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Render Hero (Sonic Spin or Run)
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

    if (player.isRolling) {
      // Fast Spin Ball (Sonic Blue or Mario Red)
      ctx.fillStyle = hero === 'sonic' ? '#2563eb' : (hero === 'mario' ? '#dc2626' : '#f59e0b');
      ctx.beginPath();
      ctx.arc(0, 0, player.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      // Running Character
      ctx.fillStyle = hero === 'sonic' ? '#2563eb' : (hero === 'mario' ? '#dc2626' : '#f59e0b');
      // Body
      ctx.beginPath();
      ctx.arc(0, -8, 16, 0, Math.PI * 2);
      ctx.fill();

      // Running Legs
      const legOffset = Math.sin(player.legAngle) * 12;
      ctx.fillStyle = '#ef4444'; // Red shoes
      ctx.fillRect(-10, 8, 8, 16 + legOffset);
      ctx.fillRect(4, 8, 8, 16 - legOffset);
    }

    ctx.restore();

    // HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Orbitron, sans-serif';
    ctx.fillText(`SCORE: ${score}`, 20, 35);
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`RINGS: ${rings}`, 20, 60);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(`DISTANCE: ${distance}M`, canvas.width - 180, 35);

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
    }
  };
};
