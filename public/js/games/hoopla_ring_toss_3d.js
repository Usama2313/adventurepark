/**
 * 3D CARNIVAL HOOPLA RING TOSS & BALL DROP
 * Aim trajectory & launch rings on prize bottles / drop balls into cascade multiplier holes!
 */

window.initHooplaRingTossGame = function(canvasId, onGameOver) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let animationId;
  let score = 0;
  let ringsLeft = 5;
  let ringsLanded = 0;
  let isGameOver = false;

  // Ring Toss Physics
  let ring = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    z: 50,
    vx: 0,
    vy: 0,
    vz: 0,
    isFlying: false,
    radius: 28,
    color: '#ffd60a'
  };

  let aimAngle = 0; // -30 to +30 deg
  let power = 50; // 20 to 100
  let powerDir = 1;

  // 3D Prize Pegs / Bottles
  let pegs = [
    { id: 1, x: -120, z: 450, radius: 14, height: 65, color: '#ec4899', name: 'Barbie Ring', tickets: 50, hasRing: false },
    { id: 2, x: 0, z: 500, radius: 14, height: 75, color: '#ffd60a', name: 'JACKPOT BEYBLADE', tickets: 150, hasRing: false },
    { id: 3, x: 120, z: 450, radius: 14, height: 65, color: '#00f0ff', name: 'Sonic Ring', tickets: 50, hasRing: false },
    { id: 4, x: -60, z: 350, radius: 12, height: 55, color: '#3b82f6', name: 'Yo-Yo Bottle', tickets: 35, hasRing: false },
    { id: 5, x: 60, z: 350, radius: 12, height: 55, color: '#10b981', name: 'Keyring Bottle', tickets: 35, hasRing: false }
  ];

  // Aiming Controls
  function handleKeyDown(e) {
    if (ring.isFlying) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') aimAngle = Math.max(-25, aimAngle - 3);
    if (e.key === 'ArrowRight' || e.key === 'd') aimAngle = Math.min(25, aimAngle + 3);
    if (e.key === ' ' || e.key === 'Enter') throwRing();
  }

  window.addEventListener('keydown', handleKeyDown);

  function throwRing() {
    if (ring.isFlying || ringsLeft <= 0 || isGameOver) return;
    ring.isFlying = true;
    ringsLeft--;

    const rad = (aimAngle * Math.PI) / 180;
    ring.vx = Math.sin(rad) * (power * 0.12);
    ring.vz = (power * 0.16) + 4;
    ring.vy = -Math.cos(rad) * (power * 0.11);

    if (window.parkAudio) window.parkAudio.playRingClank();
  }

  // Touch Throw
  canvas.addEventListener('click', (e) => {
    if (!ring.isFlying) throwRing();
  });

  window.hooplaThrowAction = throwRing;

  function update() {
    if (isGameOver) return;

    // Power Meter Oscillation
    if (!ring.isFlying) {
      power += powerDir * 1.5;
      if (power >= 100 || power <= 20) powerDir *= -1;
    } else {
      // Ring Physics
      ring.x += ring.vx * 3;
      ring.z += ring.vz * 4;
      ring.y += ring.vy * 3;
      ring.vy += 0.35; // Gravity

      // Check collision with pegs at similar depth
      pegs.forEach(peg => {
        const distZ = Math.abs(ring.z - peg.z);
        if (distZ < 25 && !peg.hasRing && ring.y >= canvas.height * 0.45) {
          const pegScreenX = canvas.width / 2 + peg.x;
          const distXY = Math.hypot(ring.x - pegScreenX, ring.y - (canvas.height * 0.55));
          if (distXY < 35) {
            // Ring Landed on Peg!
            peg.hasRing = true;
            ringsLanded++;
            score += peg.tickets * 10;
            if (window.parkAudio) window.parkAudio.playWinFanfare();
          }
        }
      });

      // Ground or out of bounds
      if (ring.z > 650 || ring.y > canvas.height - 30) {
        // Reset ring
        ring.isFlying = false;
        ring.x = canvas.width / 2;
        ring.y = canvas.height - 50;
        ring.z = 50;

        if (ringsLeft <= 0) {
          isGameOver = true;
          const ticketsWon = pegs.reduce((sum, p) => sum + (p.hasRing ? p.tickets : 0), 20);
          if (onGameOver) onGameOver({ score, ticketsWon, ringsLanded });
        }
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Carnival Tent Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#1a0b2e');
    bgGrad.addColorStop(0.5, '#2e1065');
    bgGrad.addColorStop(1, '#090514');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Carnival Stripes Roof
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.fillStyle = (x / 40) % 2 === 0 ? '#ff007f' : '#ffd60a';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 40, 0);
      ctx.lineTo(canvas.width / 2, 80);
      ctx.fill();
    }

    // Carnival Table Surface in 3D Perspective
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.15, canvas.height * 0.45);
    ctx.lineTo(canvas.width * 0.85, canvas.height * 0.45);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.fill();
    ctx.strokeStyle = '#00f0ff';
    ctx.stroke();

    // Render 3D Pegs (Back to Front)
    pegs.sort((a, b) => b.z - a.z);
    pegs.forEach(peg => {
      const scale = 320 / Math.max(1, peg.z);
      const screenX = canvas.width / 2 + peg.x * scale;
      const screenY = canvas.height * 0.45 + (canvas.height * 0.4) * ((peg.z - 300) / 400);

      ctx.save();
      ctx.translate(screenX, screenY);

      // Peg Base Cylinder
      ctx.fillStyle = peg.color;
      ctx.fillRect(-peg.radius * scale, -peg.height * scale, peg.radius * 2 * scale, peg.height * scale);

      // Peg Cap
      ctx.beginPath();
      ctx.arc(0, -peg.height * scale, peg.radius * scale, 0, Math.PI * 2);
      ctx.fill();

      // If Ring Landed on this peg
      if (peg.hasRing) {
        ctx.strokeStyle = '#ffd60a';
        ctx.lineWidth = 6 * scale;
        ctx.beginPath();
        ctx.ellipse(0, -peg.height * scale * 0.5, 30 * scale, 12 * scale, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Ticket Label
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(9, 12 * scale)}px Orbitron, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`${peg.tickets} TIX`, 0, 18 * scale);

      ctx.restore();
    });

    // Render Active Ring
    if (ring.isFlying) {
      const scale = 250 / Math.max(1, ring.z);
      ctx.save();
      ctx.translate(ring.x, ring.y);
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 5 * scale;
      ctx.beginPath();
      ctx.ellipse(0, 0, ring.radius * scale, (ring.radius * 0.4) * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else {
      // Aiming Guide Line & Ring Ready
      const rad = (aimAngle * Math.PI) / 180;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, canvas.height - 50);
      ctx.lineTo(canvas.width / 2 + Math.sin(rad) * 160, canvas.height - 50 - Math.cos(rad) * 160);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ring in hand
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(canvas.width / 2, canvas.height - 50, ring.radius, ring.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // HUD & Power Meter
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`RINGS LEFT: ${ringsLeft}`, 20, 35);
    ctx.fillText(`LANDED: ${ringsLanded}`, 20, 60);

    // Power Meter Bar
    ctx.fillStyle = '#334155';
    ctx.fillRect(canvas.width - 160, 20, 140, 16);
    ctx.fillStyle = power > 75 ? '#ff007f' : (power > 45 ? '#ffd60a' : '#00f0ff');
    ctx.fillRect(canvas.width - 160, 20, (140 * power) / 100, 16);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(canvas.width - 160, 20, 140, 16);
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText("POWER GAUGE", canvas.width - 160, 50);

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
