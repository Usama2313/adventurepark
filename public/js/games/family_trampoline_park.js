/**
 * FAMILY 3D PLAY PARK, SPRING TRAMPOLINE & NET CROSSING
 * Bounce on high-spring trampolines, dodge rotator obstacle beams and navigate the family adventure playground!
 */

window.initFamilyTrampolineGame = function(canvasId, onGameOver) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let animationId;
  let score = 0;
  let jumps = 0;
  let rotatorAngle = 0;
  let isGameOver = false;

  let player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    vy: 0,
    bounceHeight: 0,
    isAirborne: false,
    radius: 20
  };

  let trampolines = [
    { x: canvas.width * 0.25, width: 80, springForce: 16 },
    { x: canvas.width * 0.50, width: 90, springForce: 19 },
    { x: canvas.width * 0.75, width: 80, springForce: 16 }
  ];

  let stars = [];
  function spawnStars() {
    for (let i = 0; i < 5; i++) {
      stars.push({
        x: canvas.width * 0.15 + Math.random() * (canvas.width * 0.7),
        y: canvas.height * 0.2 + Math.random() * (canvas.height * 0.4),
        collected: false
      });
    }
  }
  spawnStars();

  // Controls: Touch / Keys to jump and steer
  let keys = { left: false, right: false };
  function handleKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if (e.key === ' ' || e.key === 'ArrowUp') triggerSpringJump();
  }
  function handleKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  }

  function triggerSpringJump() {
    if (!player.isAirborne && !isGameOver) {
      player.vy = -18;
      player.isAirborne = true;
      jumps++;
      score += 100;
      if (window.parkAudio) window.parkAudio.playCoinSound();
    }
  }

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  canvas.addEventListener('click', triggerSpringJump);

  function update() {
    if (isGameOver) return;

    rotatorAngle += 0.04;

    if (keys.left) player.x = Math.max(40, player.x - 5);
    if (keys.right) player.x = Math.min(canvas.width - 40, player.x + 5);

    // Physics
    player.y += player.vy;
    player.vy += 0.65; // Gravity

    // Check Trampoline Bounce
    const floorY = canvas.height - 90;
    if (player.y >= floorY) {
      player.y = floorY;
      // Find trampoline underneath
      let onTrampoline = trampolines.find(t => Math.abs(player.x - t.x) < t.width / 2);
      if (onTrampoline) {
        player.vy = -onTrampoline.springForce;
        player.isAirborne = true;
        jumps++;
        score += 80;
        if (window.parkAudio) window.parkAudio.playCandyPop();
      } else {
        player.vy = -10; // small ground bounce
      }
    }

    // Check Star Collections in the air
    stars.forEach(s => {
      if (!s.collected && Math.hypot(player.x - s.x, player.y - s.y) < 30) {
        s.collected = true;
        score += 250;
        if (window.parkAudio) window.parkAudio.playWinFanfare();
      }
    });

    // Check Rotator Beam Collision
    const rotatorCenterX = canvas.width / 2;
    const rotatorCenterY = canvas.height * 0.55;
    const beamLength = 140;
    const beamEndX1 = rotatorCenterX + Math.cos(rotatorAngle) * beamLength;
    const beamEndY1 = rotatorCenterY + Math.sin(rotatorAngle) * beamLength;

    // Line collision with player
    const distToCenter = Math.hypot(player.x - rotatorCenterX, player.y - rotatorCenterY);
    if (distToCenter < beamLength) {
      const angleToPlayer = Math.atan2(player.y - rotatorCenterY, player.x - rotatorCenterX);
      const angleDiff = Math.abs((angleToPlayer - rotatorAngle) % Math.PI);
      if (angleDiff < 0.18 || angleDiff > (Math.PI - 0.18)) {
        // Hit by rotator obstacle
        isGameOver = true;
        const ticketsWon = Math.max(15, Math.floor(score / 30) + jumps * 2);
        if (onGameOver) onGameOver({ score, ticketsWon, jumps });
        return;
      }
    }

    if (stars.every(s => s.collected)) {
      spawnStars(); // infinite stars
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Wonderland Play Park Gradient
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, '#065f46');
    bg.addColorStop(0.6, '#047857');
    bg.addColorStop(1, '#064e3b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Safety Net Crossing in Background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Render Trampolines with Springs
    trampolines.forEach(t => {
      // Spring coils
      ctx.strokeStyle = '#ffd60a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(t.x - t.width * 0.35, canvas.height - 90);
      ctx.lineTo(t.x - t.width * 0.35, canvas.height - 50);
      ctx.moveTo(t.x + t.width * 0.35, canvas.height - 90);
      ctx.lineTo(t.x + t.width * 0.35, canvas.height - 50);
      ctx.stroke();

      // Trampoline Mat
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(t.x - t.width / 2, canvas.height - 94, t.width, 10);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(t.x - t.width / 2, canvas.height - 94, t.width, 10);
    });

    // Render Floating Stars
    stars.forEach(s => {
      if (s.collected) return;
      ctx.fillStyle = '#ffd700';
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("⭐", s.x, s.y);
    });

    // Render Rotating Obstacle Beam (Rotator Zone)
    const rotatorCenterX = canvas.width / 2;
    const rotatorCenterY = canvas.height * 0.55;
    const beamLength = 140;

    ctx.save();
    ctx.translate(rotatorCenterX, rotatorCenterY);
    ctx.rotate(rotatorAngle);

    // Central Hub
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();

    // Foam Sweeper Beams
    ctx.fillStyle = '#f97316';
    ctx.fillRect(-beamLength, -8, beamLength * 2, 16);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(-beamLength, -8, beamLength * 2, 16);

    ctx.restore();

    // Render Player (Kids Trampoline Jumper)
    ctx.save();
    ctx.translate(player.x, player.y);

    // Jumping Kid Emoji / Avatar
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, -10, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Happy Face
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-6, -12, 4, 0, Math.PI * 2);
    ctx.arc(6, -12, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`FAMILY SCORE: ${score}`, 20, 35);
    ctx.fillText(`SPRING JUMPS: ${jumps}`, 20, 60);

    ctx.fillStyle = '#ffd60a';
    ctx.fillText(`[SPACE/CLICK] JUMP | [ARROWS] STEER`, canvas.width - 340, 35);

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
      window.removeEventListener('keyup', handleKeyUp);
    }
  };
};
