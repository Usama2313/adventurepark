/**
 * 3D E-CLAW MASTER CRANE MACHINE
 * Maneuver 3D claw crane with joystick, drop claw to grab Beyblades, Yo-Yos, Plushies & win massive prizes!
 */

window.initEClawMachineGame = function(canvasId, onGameOver) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let animationId;
  let score = 0;
  let attempts = 3;
  let wonPrizes = [];
  let isDropping = false;
  let isReturning = false;
  let isGameOver = false;

  let claw = {
    x: canvas.width / 2,
    y: 80,
    z: 200, // Depth inside cabinet
    openAngle: 35, // degrees
    cableLength: 60,
    maxDrop: canvas.height - 180,
    speed: 4,
    grabbedPrize: null
  };

  let keys = { left: false, right: false, up: false, down: false };

  // Prize Pit Items inside the 3D Arcade Cabinet
  let prizes = [
    { id: 1, name: 'Pro Beyblade', x: canvas.width * 0.25, y: canvas.height - 130, width: 44, height: 44, color: '#3b82f6', icon: '🌀', tickets: 120 },
    { id: 2, name: 'Speed Yo-Yo', x: canvas.width * 0.40, y: canvas.height - 120, width: 38, height: 38, color: '#ef4444', icon: '🪀', tickets: 80 },
    { id: 3, name: 'Doraemon Plush', x: canvas.width * 0.58, y: canvas.height - 140, width: 52, height: 52, color: '#00f0ff', icon: '🐱', tickets: 180 },
    { id: 4, name: 'Barbie Fashion', x: canvas.width * 0.72, y: canvas.height - 135, width: 46, height: 50, color: '#ec4899', icon: '👗', tickets: 150 },
    { id: 5, name: 'Hero Keyring', x: canvas.width * 0.85, y: canvas.height - 120, width: 32, height: 32, color: '#eab308', icon: '🗝️', tickets: 50 }
  ];

  function handleKeyDown(e) {
    if (isDropping || isReturning) return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = true;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = true;
    if (e.key === ' ' || e.key === 'Enter') dropClaw();
  }

  function handleKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = false;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = false;
  }

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  function dropClaw() {
    if (isDropping || isReturning || isGameOver) return;
    isDropping = true;
    if (window.parkAudio) window.parkAudio.playEngineRev();
  }

  // Touch control helper
  window.eclawDropAction = dropClaw;
  window.eclawMoveAction = (dir) => {
    if (isDropping || isReturning) return;
    if (dir === 'left') claw.x = Math.max(canvas.width * 0.15, claw.x - 20);
    if (dir === 'right') claw.x = Math.min(canvas.width * 0.85, claw.x + 20);
  };

  function update() {
    if (isGameOver) return;

    if (!isDropping && !isReturning) {
      if (keys.left) claw.x = Math.max(canvas.width * 0.12, claw.x - claw.speed);
      if (keys.right) claw.x = Math.min(canvas.width * 0.88, claw.x + claw.speed);
    } else if (isDropping) {
      claw.cableLength += 4;
      claw.openAngle = 45; // open claws wide on descent

      if (claw.cableLength >= claw.maxDrop) {
        // Reached bottom - try grabbing!
        isDropping = false;
        isReturning = true;
        claw.openAngle = 10; // close claws

        // Collision check with prizes
        let caught = null;
        for (let p of prizes) {
          const dist = Math.abs(claw.x - p.x);
          if (dist < 32 && !p.caught) {
            caught = p;
            break;
          }
        }

        if (caught) {
          claw.grabbedPrize = caught;
          if (window.parkAudio) window.parkAudio.playWinFanfare();
        } else {
          if (window.parkAudio) window.parkAudio.playRingClank();
        }
      }
    } else if (isReturning) {
      claw.cableLength -= 3.5;

      if (claw.grabbedPrize) {
        claw.grabbedPrize.x = claw.x;
        claw.grabbedPrize.y = claw.y + claw.cableLength + 20;
      }

      if (claw.cableLength <= 60) {
        // Return to start position & drop to chute
        isReturning = false;
        attempts--;

        if (claw.grabbedPrize) {
          wonPrizes.push(claw.grabbedPrize);
          score += claw.grabbedPrize.tickets * 10;
          claw.grabbedPrize.caught = true;
          claw.grabbedPrize = null;
        }

        if (attempts <= 0) {
          isGameOver = true;
          const totalTickets = wonPrizes.reduce((sum, p) => sum + p.tickets, 30);
          if (onGameOver) onGameOver({ score, ticketsWon: totalTickets, wonPrizes });
        }
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 3D Claw Cabinet Interior (Neon Glass Box)
    ctx.fillStyle = '#0b0f24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Top Neon Gantry Bar
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, 50, canvas.width - 80, 18);
    ctx.strokeStyle = '#00f0ff';
    ctx.strokeRect(40, 50, canvas.width - 80, 18);

    // Drop Chute on Left Side
    ctx.fillStyle = '#020617';
    ctx.fillRect(canvas.width * 0.05, canvas.height - 160, 60, 120);
    ctx.strokeStyle = '#ff007f';
    ctx.strokeRect(canvas.width * 0.05, canvas.height - 160, 60, 120);
    ctx.fillStyle = '#ff007f';
    ctx.font = 'bold 10px Orbitron, sans-serif';
    ctx.fillText("PRIZE", canvas.width * 0.06, canvas.height - 100);
    ctx.fillText("CHUTE", canvas.width * 0.06, canvas.height - 85);

    // Draw Floor with Prizes
    prizes.forEach(p => {
      if (p.caught && p !== claw.grabbedPrize) return;

      ctx.save();
      ctx.translate(p.x, p.y);

      // Prize Box / Plushie
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(-p.width / 2, -p.height / 2, p.width, p.height);

      // Prize Emoji Icon
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.icon, 0, 8);

      // Label & Ticket Value
      ctx.fillStyle = '#ffd60a';
      ctx.font = 'bold 9px Orbitron, sans-serif';
      ctx.fillText(`${p.tickets} TIX`, 0, p.height / 2 + 12);

      ctx.restore();
    });

    // Render 3D Gantry Carriage & Cable
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(claw.x - 16, 45, 32, 28);

    // Steel Cable
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(claw.x, 70);
    ctx.lineTo(claw.x, claw.y + claw.cableLength);
    ctx.stroke();

    // Claw Mechanism Head
    const clawHeadY = claw.y + claw.cableLength;
    ctx.save();
    ctx.translate(claw.x, clawHeadY);

    // Center Housing
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    // 3 Metal Prongs (Left, Right, Center)
    const rad = (claw.openAngle * Math.PI) / 180;

    // Left Prong
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-8, 8);
    ctx.lineTo(-24 * Math.sin(rad), 24 * Math.cos(rad));
    ctx.lineTo(-18 * Math.sin(rad) + 6, 24 * Math.cos(rad) + 12);
    ctx.stroke();

    // Right Prong
    ctx.beginPath();
    ctx.moveTo(8, 8);
    ctx.lineTo(24 * Math.sin(rad), 24 * Math.cos(rad));
    ctx.lineTo(18 * Math.sin(rad) - 6, 24 * Math.cos(rad) + 12);
    ctx.stroke();

    ctx.restore();

    // HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`ATTEMPTS REMAINING: ${attempts}`, 20, 32);
    ctx.fillText(`PRIZES CAUGHT: ${wonPrizes.length}`, 20, 52);

    ctx.fillStyle = '#00f0ff';
    ctx.fillText(`[ARROWS] AIM  |  [SPACE / DROP] GRAB`, canvas.width - 320, 32);

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
