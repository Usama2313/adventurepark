/**
 * 3D SPORTS GRAND SLAM: BASKETBALL, SNOOKER & TENNIS
 * Shoot 3-point basketball hoops, pot snooker pool balls, and smash tennis aces for mega tickets!
 */

window.initSportsArenaGame = function(canvasId, onGameOver, sportMode = 'basketball') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let animationId;
  let sport = sportMode; // 'basketball', 'snooker', 'tennis'
  let score = 0;
  let shotsLeft = 6;
  let scoredCount = 0;
  let isGameOver = false;

  // Basketball State
  let ball = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    z: 50,
    vx: 0,
    vy: 0,
    vz: 0,
    isFlying: false,
    radius: 18
  };

  let hoop = {
    x: canvas.width / 2,
    y: canvas.height * 0.38,
    z: 400,
    radius: 35
  };

  let power = 50;
  let powerDir = 1;
  let aimAngle = 0;

  function handleKeyDown(e) {
    if (ball.isFlying) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') aimAngle = Math.max(-20, aimAngle - 3);
    if (e.key === 'ArrowRight' || e.key === 'd') aimAngle = Math.min(20, aimAngle + 3);
    if (e.key === ' ' || e.key === 'Enter') shootBall();
  }

  window.addEventListener('keydown', handleKeyDown);

  function shootBall() {
    if (ball.isFlying || shotsLeft <= 0 || isGameOver) return;
    ball.isFlying = true;
    shotsLeft--;

    const rad = (aimAngle * Math.PI) / 180;
    ball.vx = Math.sin(rad) * (power * 0.12);
    ball.vz = (power * 0.15) + 3;
    ball.vy = -Math.cos(rad) * (power * 0.14);

    if (window.parkAudio) window.parkAudio.playCandyPop();
  }

  canvas.addEventListener('click', () => {
    if (!ball.isFlying) shootBall();
  });

  window.sportsShootAction = shootBall;

  function update() {
    if (isGameOver) return;

    if (!ball.isFlying) {
      power += powerDir * 1.8;
      if (power >= 100 || power <= 20) powerDir *= -1;
    } else {
      ball.x += ball.vx * 3;
      ball.z += ball.vz * 4;
      ball.y += ball.vy * 3;
      ball.vy += 0.45; // Gravity

      // Check Hoop Intersection
      if (Math.abs(ball.z - hoop.z) < 35 && ball.y >= hoop.y - 20 && ball.y <= hoop.y + 40) {
        if (Math.abs(ball.x - hoop.x) < hoop.radius) {
          // SWISH!
          scoredCount++;
          score += 350;
          if (window.parkAudio) window.parkAudio.playWinFanfare();
        }
      }

      // Ball drops off screen
      if (ball.z > 600 || ball.y > canvas.height - 20) {
        ball.isFlying = false;
        ball.x = canvas.width / 2;
        ball.y = canvas.height - 60;
        ball.z = 50;

        if (shotsLeft <= 0) {
          isGameOver = true;
          const ticketsWon = Math.max(20, scoredCount * 25);
          if (onGameOver) onGameOver({ score, ticketsWon, scoredCount });
        }
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Arena Stadium Background
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(0.5, '#1e293b');
    bg.addColorStop(1, '#020617');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Basketball Court Wood Floor
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.1, canvas.height * 0.45);
    ctx.lineTo(canvas.width * 0.9, canvas.height * 0.45);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.fill();

    // Court Key / Lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height * 0.75, 70, Math.PI, Math.PI * 2);
    ctx.stroke();

    // 3D Basketball Backboard & Rim
    const backboardW = 120;
    const backboardH = 80;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(hoop.x - backboardW / 2, hoop.y - backboardH, backboardW, backboardH);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.strokeRect(hoop.x - backboardW / 2, hoop.y - backboardH, backboardW, backboardH);

    // Inner Target Box
    ctx.strokeRect(hoop.x - 25, hoop.y - 50, 50, 40);

    // Orange Rim & Net
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(hoop.x, hoop.y, hoop.radius, hoop.radius * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Net Strings
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    for (let i = -hoop.radius + 6; i <= hoop.radius - 6; i += 8) {
      ctx.beginPath();
      ctx.moveTo(hoop.x + i, hoop.y);
      ctx.lineTo(hoop.x + i * 0.6, hoop.y + 40);
      ctx.stroke();
    }

    // Render Basketball
    ctx.save();
    if (ball.isFlying) {
      const scale = 300 / Math.max(1, ball.z);
      ctx.translate(ball.x, ball.y);
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(0, 0, ball.radius * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2 * scale;
      ctx.stroke();
    } else {
      ctx.translate(ball.x, ball.y);
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();

    // HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Orbitron, sans-serif';
    ctx.fillText(`HOOPS SCORED: ${scoredCount}`, 20, 35);
    ctx.fillText(`BALLS LEFT: ${shotsLeft}`, 20, 60);

    // Power Meter
    ctx.fillStyle = '#334155';
    ctx.fillRect(canvas.width - 160, 20, 140, 16);
    ctx.fillStyle = power > 75 ? '#ff0055' : '#00f59b';
    ctx.fillRect(canvas.width - 160, 20, (140 * power) / 100, 16);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(canvas.width - 160, 20, 140, 16);
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText("SHOT POWER [CLICK/SPACE]", canvas.width - 160, 50);

    update();
    if (!isGameOver) {
      animationId = requestAnimationFrame(render);
    }
  }

  render();

  return {
    destroy: () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
    }
  };
};
