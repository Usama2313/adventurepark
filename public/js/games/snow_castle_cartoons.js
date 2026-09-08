/**
 * 3D SNOW QUEEN CASTLE & CARTOON WONDERLAND
 * Cast Elsa ice magic crystals & join Shinchan, Doraemon, Kiteretsu & Hijabi Princess in royal wonderland!
 */

window.initSnowCastleGame = function(canvasId, onGameOver) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let animationId;
  let score = 0;
  let crystalsBuilt = 0;
  let targetCrystals = 15;
  let isGameOver = false;

  let snowFlakes = [];
  let characters = [
    { name: 'Elsa Snow Queen', icon: '❄️', x: 80, y: canvas.height - 110, spell: 'Ice Blast' },
    { name: 'Doraemon Magic', icon: '🐱', x: 200, y: canvas.height - 110, spell: 'Anywhere Gate' },
    { name: 'Shinchan Fun', icon: '👦', x: 320, y: canvas.height - 110, spell: 'Choco Star' },
    { name: 'Hijabi Princess', icon: '🧕', x: 440, y: canvas.height - 110, spell: 'Royal Radiance' }
  ];

  let selectedChar = characters[0];
  let activeIceSpells = [];

  // Spawn Snow Particles
  for (let i = 0; i < 40; i++) {
    snowFlakes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 1.5 + Math.random() * 3,
      vy: 1 + Math.random() * 2,
      vx: (Math.random() - 0.5) * 1
    });
  }

  // Click to cast ice crystal magic towards the castle
  canvas.addEventListener('click', (e) => {
    if (isGameOver) return;
    const rect = canvas.getBoundingClientRect();
    const targetX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const targetY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    activeIceSpells.push({
      x: selectedChar.x,
      y: selectedChar.y,
      targetX,
      targetY,
      color: '#00f0ff',
      progress: 0
    });

    crystalsBuilt++;
    score += 180;
    if (window.parkAudio) window.parkAudio.playCandyPop();

    if (crystalsBuilt >= targetCrystals) {
      isGameOver = true;
      const ticketsWon = 50 + crystalsBuilt * 2;
      if (onGameOver) onGameOver({ score, ticketsWon, crystalsBuilt });
    }
  });

  function update() {
    if (isGameOver) return;

    // Snow Flurry
    snowFlakes.forEach(s => {
      s.y += s.vy;
      s.x += s.vx;
      if (s.y > canvas.height) s.y = -10;
      if (s.x > canvas.width) s.x = 0;
    });

    // Move Active Spells
    for (let i = activeIceSpells.length - 1; i >= 0; i--) {
      const sp = activeIceSpells[i];
      sp.progress += 0.08;
      if (sp.progress >= 1) activeIceSpells.splice(i, 1);
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Frozen Snow Night Sky
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, '#0f172a');
    sky.addColorStop(0.5, '#1e3a8a');
    sky.addColorStop(1, '#0284c7');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3D Ice Castle Silhouette
    ctx.fillStyle = '#bae6fd';
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.3, canvas.height * 0.7);
    ctx.lineTo(canvas.width * 0.35, canvas.height * 0.35); // Spire Left
    ctx.lineTo(canvas.width * 0.4, canvas.height * 0.5);
    ctx.lineTo(canvas.width * 0.5, canvas.height * 0.2);  // Main Crystal Spire
    ctx.lineTo(canvas.width * 0.6, canvas.height * 0.5);
    ctx.lineTo(canvas.width * 0.65, canvas.height * 0.35); // Spire Right
    ctx.lineTo(canvas.width * 0.7, canvas.height * 0.7);
    ctx.closePath();
    ctx.fill();

    // Snow Ground
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, canvas.height - 70, canvas.width, 70);

    // Snow Flakes
    ctx.fillStyle = '#ffffff';
    snowFlakes.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Render Characters at Bottom
    characters.forEach(c => {
      ctx.save();
      ctx.translate(c.x, c.y);

      // Character Aura
      ctx.fillStyle = selectedChar === c ? '#ffd700' : 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();

      // Emoji
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.icon, 0, 0);

      // Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px Orbitron, sans-serif';
      ctx.fillText(c.name, 0, 36);

      ctx.restore();
    });

    // Render Ice Spells
    activeIceSpells.forEach(sp => {
      const curX = sp.x + (sp.targetX - sp.x) * sp.progress;
      const curY = sp.y + (sp.targetY - sp.y) * sp.progress;

      ctx.fillStyle = '#00f0ff';
      ctx.font = '24px sans-serif';
      ctx.fillText("✨", curX, curY);
    });

    // HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`FROZEN SCORE: ${score}`, 20, 35);
    ctx.fillText(`CRYSTALS BUILT: ${crystalsBuilt} / ${targetCrystals}`, 20, 60);

    ctx.fillStyle = '#00f0ff';
    ctx.fillText("CLICK CASTLE TO BUILD ICE CRYSTALS!", canvas.width - 340, 35);

    update();
    if (!isGameOver) {
      animationId = requestAnimationFrame(render);
    }
  }

  render();

  return {
    destroy: () => {
      cancelAnimationFrame(animationId);
    }
  };
};
