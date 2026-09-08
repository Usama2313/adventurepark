/**
 * 3D GHOSTLY HORROR SWING & 3D CINEMA THRILL
 * Realistic swinging pendulum physics, eerie apparitions, 3D cinema screen & courage survival score!
 */

window.initHorrorSwingGame = function(canvasId, onGameOver) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let animationId;
  let score = 0;
  let swingAngle = 0;
  let swingSpeed = 0.04;
  let swingMax = 70; // degrees
  let timeSurvived = 0;
  let bravery = 100;
  let isGameOver = false;

  let lightningFlash = 0;
  let ghosts = [];

  function spawnGhost() {
    if (isGameOver) return;
    ghosts.push({
      x: (Math.random() - 0.5) * (canvas.width * 0.7),
      y: (Math.random() - 0.5) * (canvas.height * 0.5),
      z: 800,
      opacity: 0,
      targetOpacity: 0.85,
      type: Math.random() > 0.5 ? 'skull' : 'phantom'
    });

    if (Math.random() > 0.6) {
      lightningFlash = 8;
      if (window.parkAudio) window.parkAudio.playHorrorDrone();
    }
  }

  let ghostTimer = setInterval(spawnGhost, 1800);
  let surviveTimer = setInterval(() => {
    timeSurvived++;
    score += 40;
    if (timeSurvived >= 35) { // 35 seconds survived!
      isGameOver = true;
      clearInterval(ghostTimer);
      clearInterval(surviveTimer);
      const ticketsWon = 60 + Math.floor(bravery / 2);
      if (onGameOver) onGameOver({ score, ticketsWon, timeSurvived, bravery: Math.floor(bravery) });
    }
  }, 1000);

  // Click / Flashlight to banish ghosts
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    for (let i = ghosts.length - 1; i >= 0; i--) {
      const g = ghosts[i];
      const scale = 450 / Math.max(1, g.z);
      const screenX = canvas.width / 2 + g.x * scale;
      const screenY = canvas.height / 2 + g.y * scale;

      if (Math.hypot(clickX - screenX, clickY - screenY) < 60 * scale) {
        // Banished!
        score += 300;
        ghosts.splice(i, 1);
        if (window.parkAudio) window.parkAudio.playWinFanfare();
        break;
      }
    }
  });

  function update() {
    if (isGameOver) return;

    // Swing Pendulum Math
    swingAngle = Math.sin(Date.now() * 0.002) * swingMax;

    if (lightningFlash > 0) lightningFlash--;

    // Update ghosts
    for (let i = ghosts.length - 1; i >= 0; i--) {
      const g = ghosts[i];
      g.z -= 4;
      g.opacity = Math.min(g.targetOpacity, g.opacity + 0.03);

      if (g.z <= 60) {
        // Jumpscare!
        bravery -= 25;
        ghosts.splice(i, 1);
        if (window.parkAudio) window.parkAudio.playHorrorDrone();

        if (bravery <= 0) {
          bravery = 0;
          isGameOver = true;
          clearInterval(ghostTimer);
          clearInterval(surviveTimer);
          const ticketsWon = Math.max(15, Math.floor(score / 35));
          if (onGameOver) onGameOver({ score, ticketsWon, timeSurvived, bravery: 0 });
          return;
        }
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Horror Night Sky & Haunted Theme Park
    if (lightningFlash > 0) {
      ctx.fillStyle = '#e2e8f0'; // Lightning Strike!
    } else {
      const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bg.addColorStop(0, '#020617');
      bg.addColorStop(0.6, '#0f051d');
      bg.addColorStop(1, '#05020a');
      ctx.fillStyle = bg;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3D Haunted Cinema Screen in Background
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height * 0.35);
    ctx.rotate((-swingAngle * 0.02 * Math.PI) / 180);

    // Cinema Screen Frame
    ctx.fillStyle = '#020617';
    ctx.fillRect(-220, -110, 440, 220);
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;
    ctx.strokeRect(-220, -110, 440, 220);

    // Cinema Screen Horror Projection
    ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
    ctx.fillRect(-210, -100, 420, 200);

    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 22px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("3D HORROR CINEMA RIDE", 0, -20);
    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText("CLICK GHOSTS TO BANISH WITH FLASHLIGHT!", 0, 20);

    ctx.restore();

    // 3D Swinging Pendulum Chains (Foreground)
    const rad = (swingAngle * Math.PI) / 180;
    const pivotX = canvas.width / 2;
    const pivotY = 0;
    const chainLen = canvas.height * 0.75;
    const seatX = pivotX + Math.sin(rad) * (chainLen * 0.4);
    const seatY = pivotY + Math.cos(rad) * (chainLen * 0.4);

    // Swing Chains
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pivotX - 50, pivotY);
    ctx.lineTo(seatX - 40, seatY);
    ctx.moveTo(pivotX + 50, pivotY);
    ctx.lineTo(seatX + 40, seatY);
    ctx.stroke();

    // Swing Gondola Seat
    ctx.fillStyle = '#3b0764';
    ctx.fillRect(seatX - 50, seatY, 100, 20);
    ctx.strokeStyle = '#c084fc';
    ctx.strokeRect(seatX - 50, seatY, 100, 20);

    // Render Ghosts in 3D Depth
    ghosts.forEach(g => {
      const scale = 450 / Math.max(1, g.z);
      const screenX = canvas.width / 2 + g.x * scale;
      const screenY = canvas.height / 2 + g.y * scale;
      const size = 60 * scale;

      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.globalAlpha = g.opacity;

      // Spooky Skull / Phantom
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(0, -size * 0.2, size * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Hollow Glowing Eyes
      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.arc(-size * 0.15, -size * 0.25, size * 0.1, 0, Math.PI * 2);
      ctx.arc(size * 0.15, -size * 0.25, size * 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Ghost Tail
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(-size * 0.35, -size * 0.1);
      ctx.lineTo(-size * 0.2, size * 0.5);
      ctx.lineTo(0, size * 0.3);
      ctx.lineTo(size * 0.2, size * 0.5);
      ctx.lineTo(size * 0.35, -size * 0.1);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });
    ctx.globalAlpha = 1.0;

    // HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SURVIVED: ${timeSurvived}S`, 20, 35);
    ctx.fillText(`HORROR SCORE: ${score}`, 20, 60);

    // Bravery Meter
    ctx.fillStyle = '#334155';
    ctx.fillRect(canvas.width - 160, 20, 140, 16);
    ctx.fillStyle = bravery > 40 ? '#c084fc' : '#ff0055';
    ctx.fillRect(canvas.width - 160, 20, (140 * bravery) / 100, 16);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(canvas.width - 160, 20, 140, 16);
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(`BRAVERY: ${Math.floor(bravery)}%`, canvas.width - 160, 50);

    update();
    if (!isGameOver) {
      animationId = requestAnimationFrame(render);
    }
  }

  render();

  return {
    destroy: () => {
      cancelAnimationFrame(animationId);
      clearInterval(ghostTimer);
      clearInterval(surviveTimer);
    }
  };
};
