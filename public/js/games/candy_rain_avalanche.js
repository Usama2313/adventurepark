/**
 * CANDY CRUNCH MANIA & RAIN OF CHOCOLATES / CANDIES
 * Catch and match cascading candies, chocolates, and glowing bouncy balls in a sweet avalanche!
 */

window.initCandyRainGame = function(canvasId, onGameOver) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let animationId;
  let score = 0;
  let combo = 0;
  let timeLeft = 45; // 45 second sugar rush
  let candiesPopped = 0;
  let isGameOver = false;

  let candies = [];
  let candyTypes = [
    { type: 'choc', name: 'Chocolate Bar', color: '#78350f', icon: '🍫', points: 30 },
    { type: 'lollipop', name: 'Rainbow Pop', color: '#ec4899', icon: '🍭', points: 20 },
    { type: 'jelly', name: 'Jelly Bean', color: '#8b5cf6', icon: '🍬', points: 15 },
    { type: 'cookie', name: 'Golden Cookie', color: '#f59e0b', icon: '🍪', points: 40 },
    { type: 'bouncy', name: 'Neon Ball', color: '#00f0ff', icon: '🔮', points: 50 }
  ];

  let particles = [];

  function spawnCandy() {
    if (isGameOver) return;
    const template = candyTypes[Math.floor(Math.random() * candyTypes.length)];
    candies.push({
      x: 40 + Math.random() * (canvas.width - 80),
      y: -40,
      vx: (Math.random() - 0.5) * 2,
      vy: 2.5 + Math.random() * 3,
      size: 36,
      rot: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 0.05,
      ...template
    });
  }

  // Rapid candy rain
  let spawnInterval = setInterval(() => {
    spawnCandy();
    if (Math.random() > 0.4) spawnCandy();
  }, 400);

  let timerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      isGameOver = true;
      clearInterval(spawnInterval);
      clearInterval(timerInterval);
      const ticketsWon = Math.max(15, Math.floor(score / 35));
      if (onGameOver) onGameOver({ score, ticketsWon, candiesPopped, maxCombo: combo });
    }
  }, 1000);

  // Click / Tap to pop candies & create sweet combos
  function handlePop(clientX, clientY) {
    if (isGameOver) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    for (let i = candies.length - 1; i >= 0; i--) {
      const c = candies[i];
      const dist = Math.hypot(x - c.x, y - c.y);
      if (dist < c.size) {
        // Popped!
        combo++;
        const pts = c.points * Math.min(5, combo);
        score += pts;
        candiesPopped++;

        if (window.parkAudio) window.parkAudio.playCandyPop();

        // Explosion Particles
        for (let p = 0; p < 12; p++) {
          particles.push({
            x: c.x,
            y: c.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            color: c.color,
            size: 4 + Math.random() * 5,
            life: 25
          });
        }

        candies.splice(i, 1);
        break;
      }
    }
  }

  canvas.addEventListener('mousedown', (e) => handlePop(e.clientX, e.clientY));
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) handlePop(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  function update() {
    if (isGameOver) return;

    // Move Candies
    for (let i = candies.length - 1; i >= 0; i--) {
      const c = candies[i];
      c.x += c.vx;
      c.y += c.vy;
      c.rot += c.rotSpeed;

      if (c.y > canvas.height + 50) {
        combo = 0; // Missed resets combo
        candies.splice(i, 1);
      }
    }

    // Move Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sweet Sugar Kingdom Background
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#2e1065');
    grad.addColorStop(0.5, '#701a75');
    grad.addColorStop(1, '#831843');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render Falling Candies & Chocolates
    candies.forEach(c => {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);

      // Glow Aura
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(0, 0, c.size * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Emoji
      ctx.font = `${c.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.icon, 0, 0);

      ctx.restore();
    });

    // Render Particles
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // HUD Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Orbitron, sans-serif';
    ctx.fillText(`SCORE: ${score}`, 20, 35);
    ctx.fillText(`COMBO: x${combo}`, 20, 60);

    ctx.fillStyle = timeLeft <= 10 ? '#ff0055' : '#00f59b';
    ctx.fillText(`TIME: ${timeLeft}s`, canvas.width - 130, 35);
    ctx.fillStyle = '#ffd60a';
    ctx.fillText(`POPPED: ${candiesPopped}`, canvas.width - 150, 60);

    update();
    if (!isGameOver) {
      animationId = requestAnimationFrame(render);
    }
  }

  render();

  return {
    destroy: () => {
      cancelAnimationFrame(animationId);
      clearInterval(spawnInterval);
      clearInterval(timerInterval);
    }
  };
};
