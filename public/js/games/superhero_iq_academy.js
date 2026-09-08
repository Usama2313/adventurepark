/**
 * SUPERHERO BATTLE & ARMY TACTICAL IQ ACADEMY
 * Test reflex aiming + cognitive pattern memory used in military IQ and tactical alertness training!
 */

window.initSuperheroIQGame = function(canvasId, onGameOver) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let animationId;
  let score = 0;
  let round = 1;
  let maxRounds = 10;
  let currentMode = 'iq_memory'; // 'iq_memory' or 'hero_target'
  let isGameOver = false;

  // IQ Matrix State (Military Pattern Test)
  let matrixGrid = [
    { id: 0, active: false, symbol: '▲', color: '#00f0ff' },
    { id: 1, active: false, symbol: '●', color: '#ff007f' },
    { id: 2, active: false, symbol: '■', color: '#ffd60a' },
    { id: 3, active: false, symbol: '◆', color: '#00f59b' }
  ];

  let sequence = [];
  let playerSequence = [];
  let isShowingSequence = false;
  let targetFaces = [];

  function startNextRound() {
    if (round > maxRounds) {
      isGameOver = true;
      const ticketsWon = Math.max(30, Math.floor(score / 25));
      if (onGameOver) onGameOver({ score, ticketsWon, roundsCompleted: maxRounds });
      return;
    }

    if (round % 2 === 1) {
      // IQ Matrix Memory Round
      currentMode = 'iq_memory';
      sequence.push(Math.floor(Math.random() * 4));
      playerSequence = [];
      playSequence();
    } else {
      // Superhero Target Shooting Round
      currentMode = 'hero_target';
      spawnTargets();
    }
  }

  function playSequence() {
    isShowingSequence = true;
    let step = 0;

    const interval = setInterval(() => {
      // Reset all
      matrixGrid.forEach(m => m.active = false);

      if (step < sequence.length) {
        const activeIdx = sequence[step];
        matrixGrid[activeIdx].active = true;
        if (window.parkAudio) window.parkAudio.playCoinSound();
        step++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          matrixGrid.forEach(m => m.active = false);
          isShowingSequence = false;
        }, 500);
      }
    }, 600);
  }

  function spawnTargets() {
    targetFaces = [];
    for (let i = 0; i < 4; i++) {
      targetFaces.push({
        id: i,
        x: 80 + (i % 2) * (canvas.width - 240),
        y: 120 + Math.floor(i / 2) * 140,
        size: 55,
        type: Math.random() > 0.3 ? 'villain' : 'robot',
        hit: false
      });
    }
  }

  startNextRound();

  // Click Interaction
  canvas.addEventListener('click', (e) => {
    if (isGameOver || isShowingSequence) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (currentMode === 'iq_memory') {
      // Check which quadrant was clicked
      const boxW = 120;
      const startX = canvas.width / 2 - boxW - 10;
      const startY = canvas.height / 2 - boxW - 10;

      for (let i = 0; i < 4; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = startX + col * (boxW + 20);
        const y = startY + row * (boxW + 20);

        if (clickX >= x && clickX <= x + boxW && clickY >= y && clickY <= y + boxW) {
          // Player selected this item
          playerSequence.push(i);
          matrixGrid[i].active = true;
          if (window.parkAudio) window.parkAudio.playLaserSound();

          setTimeout(() => { matrixGrid[i].active = false; }, 200);

          // Verify sequence
          const currIdx = playerSequence.length - 1;
          if (playerSequence[currIdx] !== sequence[currIdx]) {
            // Mistake!
            score = Math.max(0, score - 50);
            playerSequence = [];
            playSequence();
            return;
          }

          if (playerSequence.length === sequence.length) {
            // Completed sequence!
            score += 300 * round;
            round++;
            if (window.parkAudio) window.parkAudio.playWinFanfare();
            setTimeout(startNextRound, 800);
          }
          break;
        }
      }
    } else if (currentMode === 'hero_target') {
      // Shoot Targets
      for (let t of targetFaces) {
        if (!t.hit && Math.hypot(clickX - (t.x + t.size / 2), clickY - (t.y + t.size / 2)) < t.size) {
          t.hit = true;
          score += 250;
          if (window.parkAudio) window.parkAudio.playLaserSound();
          break;
        }
      }

      if (targetFaces.every(t => t.hit)) {
        round++;
        if (window.parkAudio) window.parkAudio.playWinFanfare();
        setTimeout(startNextRound, 800);
      }
    }
  });

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Tactical High-Tech Grid Background
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, '#020617');
    bg.addColorStop(0.5, '#0f172a');
    bg.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Laser Grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    if (currentMode === 'iq_memory') {
      // IQ Matrix Render
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`MILITARY IQ TACTICAL MATRIX (ROUND ${round}/${maxRounds})`, canvas.width / 2, 45);
      ctx.font = '13px Inter, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(isShowingSequence ? "MEMORIZE PATTERN..." : "REPEAT PATTERN IN CORRECT ORDER!", canvas.width / 2, 70);

      const boxW = 120;
      const startX = canvas.width / 2 - boxW - 10;
      const startY = canvas.height / 2 - boxW - 10;

      for (let i = 0; i < 4; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = startX + col * (boxW + 20);
        const y = startY + row * (boxW + 20);
        const item = matrixGrid[i];

        ctx.save();
        ctx.translate(x, y);

        ctx.fillStyle = item.active ? item.color : '#1e293b';
        ctx.fillRect(0, 0, boxW, boxW);
        ctx.strokeStyle = item.color;
        ctx.lineWidth = item.active ? 4 : 2;
        ctx.strokeRect(0, 0, boxW, boxW);

        // Symbol
        ctx.fillStyle = item.active ? '#000000' : '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.symbol, boxW / 2, boxW / 2);

        ctx.restore();
      }
    } else {
      // Superhero Target Range
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`SUPERHERO TARGET RANGE (ROUND ${round}/${maxRounds})`, canvas.width / 2, 45);
      ctx.font = '13px Inter, sans-serif';
      ctx.fillStyle = '#ffd60a';
      ctx.fillText("CLICK / TAP ALL RIDICULOUS VILLAIN FACES!", canvas.width / 2, 70);

      targetFaces.forEach(t => {
        if (t.hit) return;

        ctx.save();
        ctx.translate(t.x, t.y);

        // Target Board
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(t.size / 2, t.size / 2, t.size / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(t.size / 2, t.size / 2, t.size * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Funny Face Emoji
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("👺", t.size / 2, t.size / 2);

        ctx.restore();
      });
    }

    // HUD Footer
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`TACTICAL SCORE: ${score}`, 20, canvas.height - 25);

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
