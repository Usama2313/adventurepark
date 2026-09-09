/**
 * STAGE-SPECIFIC UI THEME SYSTEM
 * Applies unique visual identity to each stage group across ALL games.
 * Call: window.StageUI.apply(stageNumber, gameName)
 */
(function() {
  'use strict';

  /* ─────────────────────────────────────────────
     STAGE THEME DEFINITIONS
     Each entry covers a range of stages with:
     - bg: background gradient for HUD / overlays
     - accent: primary neon accent color
     - secondary: secondary highlight color
     - hudBg: HUD panel background
     - fog: Three.js fog hex (if scene accessible)
     - title: stage era / world name displayed in HUD badge
     - icon: emoji icon for the stage world
     - particles: floating particle color class
     - font: Google Fonts import name override (optional)
  ─────────────────────────────────────────────── */
  const STAGE_THEMES = [
    // Stages 1-3: Home / Town / School
    {
      range: [1, 3],
      bg: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      accent: '#00f0ff',
      secondary: '#38bdf8',
      hudBg: 'rgba(15,32,39,0.92)',
      borderColor: 'rgba(0,240,255,0.5)',
      fogColor: '#2c5364',
      title: '🏘️ HOMETOWN',
      icon: '🏘️',
      particleClass: 'stage-particles-blue',
      topBarBg: 'linear-gradient(90deg, #0f2027, #203a43)',
      glowColor: '0,240,255',
      vignetteColor: 'rgba(0,240,255,0.08)',
    },
    // Stages 4-6: School / Park / Playground
    {
      range: [4, 6],
      bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      accent: '#f59e0b',
      secondary: '#fbbf24',
      hudBg: 'rgba(26,26,46,0.92)',
      borderColor: 'rgba(245,158,11,0.5)',
      fogColor: '#0f3460',
      title: '🏫 SCHOOL GROUNDS',
      icon: '🎒',
      particleClass: 'stage-particles-gold',
      topBarBg: 'linear-gradient(90deg, #1a1a2e, #0f3460)',
      glowColor: '245,158,11',
      vignetteColor: 'rgba(245,158,11,0.07)',
    },
    // Stages 7-9: Forest / Nature / Mountains
    {
      range: [7, 9],
      bg: 'linear-gradient(135deg, #052e16 0%, #065f46 50%, #047857 100%)',
      accent: '#10b981',
      secondary: '#34d399',
      hudBg: 'rgba(5,46,22,0.92)',
      borderColor: 'rgba(16,185,129,0.5)',
      fogColor: '#065f46',
      title: '🌲 ENCHANTED FOREST',
      icon: '🌿',
      particleClass: 'stage-particles-green',
      topBarBg: 'linear-gradient(90deg, #052e16, #047857)',
      glowColor: '16,185,129',
      vignetteColor: 'rgba(16,185,129,0.07)',
    },
    // Stages 10-12: Dinosaur / Ancient Age
    {
      range: [10, 12],
      bg: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #92400e 100%)',
      accent: '#f97316',
      secondary: '#fb923c',
      hudBg: 'rgba(69,26,3,0.94)',
      borderColor: 'rgba(249,115,22,0.5)',
      fogColor: '#78350f',
      title: '🦕 CRETACEOUS AGE',
      icon: '🦴',
      particleClass: 'stage-particles-orange',
      topBarBg: 'linear-gradient(90deg, #451a03, #92400e)',
      glowColor: '249,115,22',
      vignetteColor: 'rgba(249,115,22,0.09)',
    },
    // Stages 13-15: Underwater / Ocean / Atlantis
    {
      range: [13, 15],
      bg: 'linear-gradient(135deg, #0c1445 0%, #1a237e 50%, #0d47a1 100%)',
      accent: '#38bdf8',
      secondary: '#7dd3fc',
      hudBg: 'rgba(12,20,69,0.94)',
      borderColor: 'rgba(56,189,248,0.5)',
      fogColor: '#0d47a1',
      title: '🌊 ATLANTIS DEPTHS',
      icon: '🐠',
      particleClass: 'stage-particles-cyan',
      topBarBg: 'linear-gradient(90deg, #0c1445, #0d47a1)',
      glowColor: '56,189,248',
      vignetteColor: 'rgba(56,189,248,0.10)',
    },
    // Stages 16-18: Space / Galaxy / Cosmos
    {
      range: [16, 18],
      bg: 'linear-gradient(135deg, #0d0221 0%, #1a0533 50%, #2d0b5c 100%)',
      accent: '#a855f7',
      secondary: '#c084fc',
      hudBg: 'rgba(13,2,33,0.95)',
      borderColor: 'rgba(168,85,247,0.5)',
      fogColor: '#2d0b5c',
      title: '🚀 COSMIC NEBULA',
      icon: '🌌',
      particleClass: 'stage-particles-purple',
      topBarBg: 'linear-gradient(90deg, #0d0221, #2d0b5c)',
      glowColor: '168,85,247',
      vignetteColor: 'rgba(168,85,247,0.10)',
    },
    // Stages 19-21: Ice / Arctic / Snow
    {
      range: [19, 21],
      bg: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
      accent: '#bae6fd',
      secondary: '#e0f2fe',
      hudBg: 'rgba(15,23,42,0.93)',
      borderColor: 'rgba(186,230,253,0.6)',
      fogColor: '#1e40af',
      title: '❄️ ARCTIC BLIZZARD',
      icon: '🧊',
      particleClass: 'stage-particles-ice',
      topBarBg: 'linear-gradient(90deg, #0f172a, #1e40af)',
      glowColor: '186,230,253',
      vignetteColor: 'rgba(186,230,253,0.08)',
    },
    // Stages 22-24: Volcano / Fire / Hell
    {
      range: [22, 24],
      bg: 'linear-gradient(135deg, #1c0000 0%, #7f1d1d 50%, #b91c1c 100%)',
      accent: '#ef4444',
      secondary: '#fca5a5',
      hudBg: 'rgba(28,0,0,0.94)',
      borderColor: 'rgba(239,68,68,0.5)',
      fogColor: '#7f1d1d',
      title: '🌋 VOLCANIC INFERNO',
      icon: '🔥',
      particleClass: 'stage-particles-fire',
      topBarBg: 'linear-gradient(90deg, #1c0000, #b91c1c)',
      glowColor: '239,68,68',
      vignetteColor: 'rgba(239,68,68,0.10)',
    },
    // Stages 25-27: Futuristic City / Neo Tokyo
    {
      range: [25, 27],
      bg: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #0a0a2e 100%)',
      accent: '#22d3ee',
      secondary: '#67e8f9',
      hudBg: 'rgba(0,0,0,0.95)',
      borderColor: 'rgba(34,211,238,0.5)',
      fogColor: '#0a0a2e',
      title: '🌃 NEO-TOKYO 2099',
      icon: '🤖',
      particleClass: 'stage-particles-neon',
      topBarBg: 'linear-gradient(90deg, #000000, #0a0a2e)',
      glowColor: '34,211,238',
      vignetteColor: 'rgba(34,211,238,0.09)',
    },
    // Stages 28-30: Final Boss / Heaven / Gold
    {
      range: [28, 30],
      bg: 'linear-gradient(135deg, #1c1005 0%, #3b2005 50%, #7c4a00 100%)',
      accent: '#ffd700',
      secondary: '#fbbf24',
      hudBg: 'rgba(28,16,5,0.96)',
      borderColor: 'rgba(255,215,0,0.6)',
      fogColor: '#3b2005',
      title: '👑 FINAL SHOWDOWN',
      icon: '🏆',
      particleClass: 'stage-particles-gold',
      topBarBg: 'linear-gradient(90deg, #1c1005, #7c4a00)',
      glowColor: '255,215,0',
      vignetteColor: 'rgba(255,215,0,0.10)',
    },
  ];

  /* ─────────────────────────────────────────────
     GAME-SPECIFIC STAGE LABELS
     Keyed by game folder name, each stage title
     overrides the generic world label for that game
  ─────────────────────────────────────────────── */
  const GAME_STAGE_LABELS = {
    'doraemon-sky-ocean-3d': {
      1: '🏘️ Nerima District', 2: '🏫 Nobita\'s School', 3: '🎵 Gian\'s Stage',
      4: '🏰 Suneo\'s Villa', 5: '🎹 Shizuka\'s Piano Plaza', 6: '🌸 Sakura Festival',
      7: '🦕 Dino Safari', 8: '🌊 Deep Sea Atlantis', 9: '☁️ Cloud Kingdom',
      10: '🦴 Cretaceous Jungle', 11: '🌋 Volcano Island', 12: '❄️ Ice Mountains',
      13: '🌀 Time Vortex', 14: '🔮 Mirror World', 15: '🌊 Sea Monster Lair',
      16: '🚀 Space Station', 17: '🌌 Galaxy Express', 18: '☄️ Meteor Belt',
      19: '🧊 Arctic Blizzard', 20: '☁️ Cosmic Cloud Kingdom', 21: '🌠 Star Road',
      22: '🔥 Magma Core', 23: '💀 Demon Realm', 24: '⚡ Thunder Fortress',
      25: '🤖 Robot Factory', 26: '🌃 Neo-Tokyo 2099', 27: '🛸 Alien Mothership',
      28: '⚡ Galaxy Train Station', 29: '🌟 22nd Century', 30: '👑 Final Quest',
    },
    'shinchan-helper-3d': {
      1: '🏘️ Kasukabe Town', 2: '🏫 Futaba Kindergarten', 3: '🛒 Supermarket Chase',
      4: '🌲 Spring Land', 5: '🎠 Amusement Park', 6: '🏕️ Camping Adventure',
      7: '🦁 Animal Land', 8: '🌸 Hanami Festival', 9: '⚡ Storm World',
      10: '🦸 Action Mask Lair', 11: '🔥 Volcano Escape', 12: '🌊 Ocean Adventure',
      13: '🌀 Time Machine Trip', 14: '🚀 Space Mission', 15: '❄️ Blizzard Hill',
      16: '🏰 Haunted Castle', 17: '🌃 Future City', 18: '🎭 Circus World',
      19: '🧊 Ice Kingdom', 20: '⚡ Lightning Valley', 21: '☁️ Cloud Sky',
      22: '🔥 Fire Dragon Lair', 23: '💀 Shadow Realm', 24: '🌋 Magma Mountain',
      25: '🤖 Robot Land', 26: '🌌 Galaxy Quest', 27: '🛸 UFO Chase',
      28: '👹 Demon Boss Stage', 29: '🌟 Nohara Final Run', 30: '👑 SHINCHAN CHAMPION',
    },
    'batman-arkham-3d': {
      1: '🌃 Gotham Streets', 2: '🏦 Gotham Bank', 3: '⚗️ Arkham Laboratory',
      4: '🃏 Joker\'s Funhouse', 5: '🧪 Poison Ivy Greenhouse', 6: '❄️ Mr. Freeze Tower',
      7: '🦇 Bat Cave', 8: '🌉 Gotham Bridge', 9: '🏛️ Gotham Museum',
      10: '🎪 Scarecrow Circus', 11: '⚡ Electrocutioner Arena', 12: '🌀 Ra\'s al Ghul Temple',
      13: '🔥 Firefly Airfield', 14: '🌆 Wayne Tower', 15: '🏰 Arkham Asylum',
      16: '🌑 Dark Knight Stage', 17: '🃏 Joker Final Battle', 18: '💀 Deadshot Sniper',
      19: '❄️ Freeze Zone', 20: '🧪 Chemical Plant', 21: '🌃 Night Gotham',
      22: '⚡ Storm Tower', 23: '🔮 Scarecrow Nightmare', 24: '🦅 Tribunal Sky',
      25: '🤖 Steel Mill', 26: '🌌 Gotham Galaxy', 27: '🛸 Alien Invasion',
      28: '👹 Hugo Strange', 29: '🌟 Ra\'s Final Lair', 30: '👑 BATMAN CHAMPION',
    },
    'superman-justice-3d': {
      1: '🏙️ Metropolis Streets', 2: '🗞️ Daily Planet', 3: '🏦 Luthor Corp Tower',
      4: '❄️ Arctic Fortress', 5: '🌋 Krypton Memory', 6: '🤖 Brainiac Assault',
      7: '🌆 Smallville Farm', 8: '🌌 Phantom Zone', 9: '🚀 Space Defense',
      10: '⚡ Zod Duel', 11: '🔮 Kryptonite Trap', 12: '🌊 Ocean Rescue',
      13: '🏰 Fortress of Solitude', 14: '🌃 Night Metropolis', 15: '💥 Nuclear Crisis',
      16: '🚀 Moon Battle', 17: '🌌 Satellite Orbit', 18: '☄️ Meteor Shower',
      19: '❄️ Frozen City', 20: '⚡ Lightning Storm', 21: '🌪️ Tornado Alley',
      22: '🔥 Inferno Bridge', 23: '💀 Darkseid Lair', 24: '⚡ Anti-Monitor',
      25: '🌟 Apokolips', 26: '🌌 New Genesis', 27: '🛸 Warworld',
      28: '👹 Doomsday Battle', 29: '🌟 Final Crisis', 30: '👑 MAN OF STEEL',
    },
    'spiderman-web-city-3d': {
      1: '🌆 Queens, New York', 2: '🏫 Midtown High', 3: '🕷️ Empire State Swing',
      4: '🌉 Brooklyn Bridge', 5: '🏙️ Manhattan Chase', 6: '🧪 Oscorp Lab',
      7: '🌃 Night Patrol', 8: '🏦 Bank Robbery', 9: '🌊 Harbor Fight',
      10: '⚡ Shocker Blast', 11: '❄️ Mr. Negative', 12: '🔥 Vulture Airspace',
      13: '🤖 Doc Ock Robot', 14: '💀 Venom Chase', 15: '🔮 Mysterio Illusion',
      16: '🌀 Electro Lightning', 17: '🎪 Carnage Chaos', 18: '🧫 Lizard Sewers',
      19: '❄️ Rhino Rampage', 20: '⚡ Sinister Six Stage', 21: '🌃 Night Oscorp',
      22: '🔥 Green Goblin Sky', 23: '💥 Times Square Battle', 24: '🌌 Multiverse Crack',
      25: '🤖 Doctor Strange Aid', 26: '🌌 Alternate NYC', 27: '🛸 Alien Web',
      28: '👹 Kingpin Tower', 29: '🌟 Symbiote Realm', 30: '👑 SPIDER-CHAMPION',
    },
    'thief-capture-police-3d': {
      1: '🏪 Shop Alley Chase', 2: '🏦 Bank Heist', 3: '🛤️ Train Yard',
      4: '🌃 Night City Run', 5: '🚢 Harbor Escape', 6: '✈️ Airport Chase',
      7: '🏰 Museum Theft', 8: '⚡ Power Plant', 9: '🌆 Rooftop Leap',
      10: '🚂 Moving Train', 11: '🏗️ Construction Site', 12: '🌊 Bridge Chase',
      13: '🔥 Burning Building', 14: '🌀 Tunnel Escape', 15: '🛣️ Highway Race',
      16: '🌃 Underground Lair', 17: '🗝️ Safe House', 18: '💰 Vault Robbery',
      19: '❄️ Cold Storage', 20: '⚡ Electric Grid', 21: '🏙️ Downtown Showdown',
      22: '🔮 Casino Heist', 23: '💀 Gang Territory', 24: '🌋 Volcano Hideout',
      25: '🤖 Cyber Lair', 26: '🌌 Space Prison', 27: '🛸 Alien Smuggler',
      28: '👹 Crime Boss Arena', 29: '🌟 Final Heist', 30: '👑 TOP COP',
    },
    'sonic-dash-3d': {
      1: '🌿 Green Hill Zone', 2: '🌊 Marble Zone', 3: '🌀 Spring Yard Zone',
      4: '🌲 Labyrinth Zone', 5: '⭐ Star Light Zone', 6: '🚀 Scrap Brain Zone',
      7: '🏔️ Aquatic Ruin', 8: '🎪 Casino Night', 9: '🌿 Hill Top Zone',
      10: '🌀 Mystic Cave', 11: '🌊 Oil Ocean', 12: '🌌 Metropolis Zone',
      13: '☁️ Sky Chase', 14: '🌲 Wing Fortress', 15: '🛸 Death Egg',
      16: '❄️ Ice Cap Zone', 17: '🏔️ Pumpkin Hill', 18: '⚡ Mad Space',
      19: '🔥 Lava Reef', 20: '🌌 Sky Sanctuary', 21: '🤖 Eggman Carrier',
      22: '⚡ Final Egg', 23: '💀 Biolizard Lair', 24: '🌟 ARK Cannon',
      25: '🛸 Egg Fleet', 26: '🌌 Grand Metropolis', 27: '🤖 Lost Jungle',
      28: '👹 Egg Emperor', 29: '🌟 Final Rush', 30: '👑 SONIC CHAMPION',
    },
  };

  /* ─────────────────────────────────────────────
     PARTICLE CSS TEMPLATES
  ─────────────────────────────────────────────── */
  const PARTICLE_CSS = `
    @keyframes stageParticleFloat {
      0%   { transform: translateY(100vh) scale(0); opacity: 0; }
      10%  { opacity: 0.8; }
      90%  { opacity: 0.4; }
      100% { transform: translateY(-20vh) scale(1.2); opacity: 0; }
    }
    @keyframes stageParticleDrift {
      0%   { transform: translateX(0) scale(0.8); }
      50%  { transform: translateX(30px) scale(1.0); }
      100% { transform: translateX(-20px) scale(0.8); }
    }
    .stage-particle {
      position: fixed;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      pointer-events: none;
      z-index: 5;
      animation: stageParticleFloat var(--dur) linear infinite,
                 stageParticleDrift calc(var(--dur) * 0.6) ease-in-out infinite;
      animation-delay: var(--delay);
      left: var(--x);
      top: 100%;
      background: var(--color);
      box-shadow: 0 0 6px var(--color);
      filter: blur(0.5px);
    }

    /* Stage transition flash */
    @keyframes stageTransitionFlash {
      0%   { opacity: 0; }
      30%  { opacity: 0.85; }
      70%  { opacity: 0.85; }
      100% { opacity: 0; }
    }
    #stage-transition-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      pointer-events: none;
      display: none;
      animation: stageTransitionFlash 1.2s ease forwards;
    }

    /* Stage announce banner */
    @keyframes stageBannerSlide {
      0%   { transform: translateY(-80px); opacity: 0; }
      15%  { transform: translateY(0); opacity: 1; }
      75%  { transform: translateY(0); opacity: 1; }
      100% { transform: translateY(-80px); opacity: 0; }
    }
    #stage-announce-banner {
      position: fixed;
      top: 70px;
      left: 50%;
      transform: translateX(-50%) translateY(-80px);
      z-index: 8000;
      padding: 14px 40px;
      border-radius: 40px;
      font-family: 'Orbitron', 'Inter', sans-serif;
      font-weight: 800;
      font-size: 1.1rem;
      letter-spacing: 0.1em;
      text-align: center;
      pointer-events: none;
      white-space: nowrap;
      display: none;
    }
    #stage-announce-banner.active {
      display: block;
      animation: stageBannerSlide 3.0s ease forwards;
    }

    /* HUD theme update transition */
    #real-telemetry-cluster-wrapper, .real-telemetry-cluster {
      transition: background 0.6s ease, border-color 0.6s ease, box-shadow 0.6s ease;
    }
    .stage-control-bar, .camera-control-bar {
      transition: background 0.6s ease, border-color 0.6s ease;
    }

    /* Glowing stage badge */
    #stage-world-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 14px 4px 8px;
      border-radius: 20px;
      font-family: 'Orbitron', sans-serif;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.07em;
      transition: background 0.5s, border-color 0.5s, box-shadow 0.5s, color 0.5s;
    }
  `;

  /* ─────────────────────────────────────────────
     HELPERS
  ─────────────────────────────────────────────── */
  function getTheme(stageNum) {
    return STAGE_THEMES.find(t => stageNum >= t.range[0] && stageNum <= t.range[1])
      || STAGE_THEMES[0];
  }

  function getGameLabel(gameName, stageNum) {
    const labels = GAME_STAGE_LABELS[gameName];
    if (labels && labels[stageNum]) return labels[stageNum];
    const theme = getTheme(stageNum);
    return `${theme.icon} ${theme.title}`;
  }

  function injectBaseCSS() {
    if (document.getElementById('stage-ui-css')) return;
    const style = document.createElement('style');
    style.id = 'stage-ui-css';
    style.textContent = PARTICLE_CSS;
    document.head.appendChild(style);
  }

  function injectTransitionOverlay() {
    if (document.getElementById('stage-transition-overlay')) return;
    const el = document.createElement('div');
    el.id = 'stage-transition-overlay';
    document.body.appendChild(el);
  }

  function injectAnnounceBanner() {
    if (document.getElementById('stage-announce-banner')) return;
    const el = document.createElement('div');
    el.id = 'stage-announce-banner';
    document.body.appendChild(el);
  }

  function injectWorldBadge() {
    if (document.getElementById('stage-world-badge')) return;
    const el = document.createElement('span');
    el.id = 'stage-world-badge';
    // Try to append after HUD stage number
    const stageEl = document.getElementById('hud-stage-num');
    if (stageEl && stageEl.parentElement) {
      stageEl.parentElement.appendChild(el);
    } else {
      document.body.appendChild(el);
    }
  }

  /* Spawn floating particles matching the current stage theme */
  function spawnParticles(theme) {
    // Remove old particles
    document.querySelectorAll('.stage-particle').forEach(p => p.remove());

    const colors = [theme.accent, theme.secondary, '#ffffff'];
    const count = 18;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'stage-particle';
      const dur = (4 + Math.random() * 6).toFixed(2) + 's';
      const delay = (Math.random() * 8).toFixed(2) + 's';
      const x = (Math.random() * 100).toFixed(1) + '%';
      const color = colors[Math.floor(Math.random() * colors.length)];
      p.style.cssText = `--dur:${dur}; --delay:-${delay}; --x:${x}; --color:${color};`;
      document.body.appendChild(p);
    }
  }

  /* Flash the transition overlay with the stage color */
  function flashTransition(theme) {
    const el = document.getElementById('stage-transition-overlay');
    if (!el) return;
    el.style.background = `rgba(${theme.glowColor},0.35)`;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 1300);
  }

  /* Show stage announcement banner */
  function showBanner(stageNum, label, theme) {
    const el = document.getElementById('stage-announce-banner');
    if (!el) return;
    el.style.background = theme.hudBg;
    el.style.border = `2px solid ${theme.accent}`;
    el.style.color = theme.accent;
    el.style.boxShadow = `0 0 30px rgba(${theme.glowColor},0.5), 0 4px 20px rgba(0,0,0,0.7)`;
    el.textContent = `✦ STAGE ${stageNum} — ${label} ✦`;
    el.classList.remove('active');
    // Force reflow so animation restarts
    void el.offsetWidth;
    el.classList.add('active');
  }

  /* Apply CSS variables to :root for all HUD elements to pick up */
  function applyRootVars(theme) {
    const root = document.documentElement;
    root.style.setProperty('--stage-accent', theme.accent);
    root.style.setProperty('--stage-secondary', theme.secondary);
    root.style.setProperty('--stage-hud-bg', theme.hudBg);
    root.style.setProperty('--stage-border', theme.borderColor);
    root.style.setProperty('--stage-glow', `rgba(${theme.glowColor},0.35)`);
    root.style.setProperty('--stage-top-bar', theme.topBarBg);
    root.style.setProperty('--stage-vignette', theme.vignetteColor);
  }

  /* Update visible HUD elements */
  function updateHUD(theme, label, stageNum) {
    // Telemetry cluster
    const tc = document.querySelector('.real-telemetry-cluster');
    if (tc) {
      tc.style.background = theme.hudBg;
      tc.style.borderColor = theme.borderColor;
      tc.style.boxShadow = `0 0 20px rgba(${theme.glowColor},0.3), 0 4px 24px rgba(0,0,0,0.5)`;
    }
    // Stage number text
    const stageEl = document.getElementById('hud-stage-num');
    if (stageEl) stageEl.style.color = theme.accent;

    // Stage world badge
    const badge = document.getElementById('stage-world-badge');
    if (badge) {
      badge.style.background = `rgba(${theme.glowColor},0.18)`;
      badge.style.border = `1px solid ${theme.accent}`;
      badge.style.color = theme.accent;
      badge.style.boxShadow = `0 0 12px rgba(${theme.glowColor},0.3)`;
      badge.textContent = label;
    }

    // Gadget toolbar
    const gt = document.getElementById('gadget-toolbar');
    if (gt) {
      gt.style.background = theme.hudBg;
      gt.style.borderColor = theme.accent;
      gt.style.boxShadow = `0 0 20px rgba(${theme.glowColor},0.25)`;
    }

    // Stage control bar
    const scb = document.querySelector('.stage-control-bar');
    if (scb) {
      scb.style.background = theme.hudBg;
      scb.style.borderColor = theme.borderColor;
    }

    // Camera bar
    const ccb = document.querySelector('.camera-control-bar');
    if (ccb) {
      ccb.style.background = theme.hudBg;
      ccb.style.borderColor = theme.borderColor;
    }

    // Active HUD buttons glow
    document.querySelectorAll('.hud-btn.active').forEach(btn => {
      btn.style.borderColor = theme.accent;
      btn.style.boxShadow = `0 0 10px rgba(${theme.glowColor},0.5)`;
    });

    // Touch controls color
    document.querySelectorAll('.touch-btn').forEach(btn => {
      btn.style.borderColor = theme.accent;
      btn.style.background = `rgba(${theme.glowColor},0.2)`;
    });

    // Boss HP bar gradient
    const bossHp = document.getElementById('boss-hp-fill');
    if (bossHp) {
      bossHp.style.background = `linear-gradient(90deg, ${theme.accent}, ${theme.secondary})`;
    }

    // Real vignette
    const vig = document.querySelector('.real-vignette');
    if (vig) {
      vig.style.background = `radial-gradient(ellipse at center, transparent 50%, ${theme.vignetteColor} 100%)`;
    }

    // Permanent top bar
    const ptb = document.getElementById('permanent-top-bar');
    if (ptb) {
      ptb.style.background = 'transparent';
    }

    // Score color
    const scoreEl = document.getElementById('hud-score');
    if (scoreEl) scoreEl.style.color = theme.secondary;

    // Active gadget label
    const gadgetEl = document.getElementById('hud-active-gadget');
    if (gadgetEl) gadgetEl.style.color = theme.accent;
  }

  /* ─────────────────────────────────────────────
     MAIN PUBLIC API
  ─────────────────────────────────────────────── */
  window.StageUI = {
    currentTheme: null,
    currentGame: null,

    /**
     * Call this whenever the stage changes.
     * @param {number} stageNum - Current stage number (1-30)
     * @param {string} gameName - Game folder name (e.g. 'doraemon-sky-ocean-3d')
     * @param {boolean} [animate=true] - Whether to play transition animations
     */
    apply(stageNum, gameName, animate = true) {
      const theme = getTheme(stageNum);
      const label = getGameLabel(gameName, stageNum);

      this.currentTheme = theme;
      this.currentGame = gameName;

      // Inject helpers on first call
      injectBaseCSS();
      injectTransitionOverlay();
      injectAnnounceBanner();
      injectWorldBadge();

      // Apply CSS variables
      applyRootVars(theme);

      // Update HUD visuals
      updateHUD(theme, label, stageNum);

      // Spawn particles
      spawnParticles(theme);

      if (animate) {
        flashTransition(theme);
        showBanner(stageNum, label, theme);
      }
    },

    /** Returns the current stage theme object */
    getTheme(stageNum) {
      return getTheme(stageNum);
    },

    /** Returns a stage-specific label for a game */
    getLabel(gameName, stageNum) {
      return getGameLabel(gameName, stageNum);
    },
  };

  // Auto-detect game name from the URL path
  function detectGame() {
    const parts = window.location.pathname.split('/');
    const gamesIdx = parts.indexOf('games');
    if (gamesIdx >= 0 && parts[gamesIdx + 1]) return parts[gamesIdx + 1];
    return 'unknown';
  }

  // Auto-apply stage 1 on load
  window.addEventListener('DOMContentLoaded', () => {
    const game = detectGame();
    window.StageUI.apply(1, game, false);
  });

})();
