/**
 * 3D WHALE OCEAN ODYSSEY & SHARK REEF FEEDING
 * Ride majestic blue whales, feed sharks & magical ocean creatures across glowing deep-sea coral reefs!
 */

window.initOceanOdysseyGame = function(canvasId, onGameOver) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let animationId;
  let score = 0;
  let foodLeft = 20;
  let creaturesFed = 0;
  let isGameOver = false;

  let foodPellets = [];
  let creatures = [];
  let bubbles = [];

  // Spawn Initial Bubbles
  for (let i = 0; i < 25; i++) {
    bubbles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 2 + Math.random() * 6,
      speed: 1 + Math.random() * 2
    });
  }

  function spawnCreature() {
    if (isGameOver) return;
    const isWhale = Math.random() > 0.75;
    const isShark = !isWhale && Math.random() > 0.5;

    creatures.push({
      x: Math.random() > 0.5 ? -100 : canvas.width + 100,
      y: 60 + Math.random() * (canvas.height - 180),
      dir: 1, // Will set below
      speed: isWhale ? 1.5 : (isShark ? 3.0 : 2.2),
      type: isWhale ? 'whale' : (isShark ? 'shark' : 'fish'),
      color: isWhale ? '#1d4ed8' : (isShark ? '#475569' : '#f97316'),
      size: isWhale ? 100 : (isShark ? 65 : 40),
      fed: false,
      tailAngle: 0
    });

    const last = creatures[creatures.length - 1];
    last.dir = last.x < 0 ? 1 : -1;
  }

  let spawnTimer = setInterval(spawnCreature, 1500);

  // Click / Tap to drop nutrient food pellets
  function dropFood(e) {
    if (isGameOver || foodLeft <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    foodLeft--;
    foodPellets.push({ x, y, vy: 2.5, radius: 8 });

    if (window.parkAudio) window.parkAudio.playOceanSplash();

    if (foodLeft <= 0 && foodPellets.length === 0) {
      checkEndGame();
    }
  }

  function checkEndGame() {
    setTimeout(() => {
      if (foodLeft <= 0 && !isGameOver) {
        isGameOver = true;
        clearInterval(spawnTimer);
        const ticketsWon = Math.max(15, Math.floor(score / 35));
        if (onGameOver) onGameOver({ score, ticketsWon, creaturesFed });
      }
    }, 2000);
  }

  canvas.addEventListener('mousedown', dropFood);
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) dropFood(e.touches[0]);
  }, { passive: true });

  function update() {
    if (isGameOver) return;

    // Bubbles float up
    bubbles.forEach(b => {
      b.y -= b.speed;
      if (b.y < -10) b.y = canvas.height + 10;
    });

    // Move Food Pellets
    for (let i = foodPellets.length - 1; i >= 0; i--) {
      const f = foodPellets[i];
      f.y += f.vy;

      // Check collision with creatures
      for (let c of creatures) {
        if (!c.fed && Math.hypot(f.x - c.x, f.y - c.y) < c.size * 0.7) {
          c.fed = true;
          creaturesFed++;
          score += c.type === 'whale' ? 400 : (c.type === 'shark' ? 250 : 150);
          foodPellets.splice(i, 1);
          if (window.parkAudio) window.parkAudio.playWinFanfare();
          break;
        }
      }

      if (f.y > canvas.height) foodPellets.splice(i, 1);
    }

    // Move Marine Creatures
    for (let i = creatures.length - 1; i >= 0; i--) {
      const c = creatures[i];
      c.x += c.dir * c.speed;
      c.tailAngle += 0.15;

      if ((c.dir === 1 && c.x > canvas.width + 150) || (c.dir === -1 && c.x < -150)) {
        creatures.splice(i, 1);
      }
    }

    if (foodLeft <= 0 && foodPellets.length === 0) {
      checkEndGame();
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Deep Sea Gradient Background
    const ocean = ctx.createLinearGradient(0, 0, 0, canvas.height);
    ocean.addColorStop(0, '#0c4a6e');
    ocean.addColorStop(0.5, '#075985');
    ocean.addColorStop(1, '#082f49');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Coral Reef Silhouettes at bottom
    ctx.fillStyle = '#164e63';
    for (let x = 0; x < canvas.width; x += 40) {
      const h = 50 + Math.sin(x * 0.1) * 30;
      ctx.fillRect(x, canvas.height - h, 35, h);
    }

    // Floating Bubbles
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    bubbles.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Render Marine Creatures
    creatures.forEach(c => {
      ctx.save();
      ctx.translate(c.x, c.y);
      if (c.dir === -1) ctx.scale(-1, 1);

      // Body
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, c.size * 0.6, c.size * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tail
      const tailWiggle = Math.sin(c.tailAngle) * 8;
      ctx.beginPath();
      ctx.moveTo(-c.size * 0.5, 0);
      ctx.lineTo(-c.size * 0.8, -c.size * 0.25 + tailWiggle);
      ctx.lineTo(-c.size * 0.8, c.size * 0.25 + tailWiggle);
      ctx.closePath();
      ctx.fill();

      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(c.size * 0.35, -c.size * 0.08, c.size * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(c.size * 0.37, -c.size * 0.08, c.size * 0.04, 0, Math.PI * 2);
      ctx.fill();

      if (c.fed) {
        // Heart emoji / fed indicator
        ctx.fillStyle = '#ff007f';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText("💖 FED!", 0, -c.size * 0.4);
      }

      ctx.restore();
    });

    // Render Food Pellets
    ctx.fillStyle = '#ffd60a';
    foodPellets.forEach(f => {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Orbitron, sans-serif';
    ctx.fillText(`SCORE: ${score}`, 20, 35);
    ctx.fillText(`CREATURES FED: ${creaturesFed}`, 20, 60);

    ctx.fillStyle = foodLeft > 4 ? '#00f0ff' : '#ff0055';
    ctx.fillText(`FOOD PELLETS: ${foodLeft}`, canvas.width - 200, 35);

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
      canvas.removeEventListener('mousedown', dropFood);
    }
  };
};
