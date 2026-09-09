/**
 * ULTIMATE 3D ADVENTURE PARK & VIRTUAL ARCADE - MASTER APPLICATION
 * Handles NFC Smart Cards, Packages, JazzCash & IBAN Top-ups, WhatsApp Verification,
 * Admin Approval Control Center, Ticket Redemption Store, and 14+ 3D Interactive Games.
 */

// Offline fallback database if backend is unreachable
const LOCAL_STORAGE_KEY = 'ADV_PARK_USER_DATA';
const LOCAL_ADMIN_KEY = 'ADV_PARK_ADMIN_STORE';

class AdventureParkApp {
  constructor() {
    this.apiBase = window.location.origin;
    this.currentUser = null;
    this.packages = [];
    this.prizes = [];
    this.activeTab = 'park'; // 'park', 'card', 'store', 'admin'
    this.activeZone = 'all';
    this.activeGame = null;
    this.currentGameSession = null;
    this.adminData = null;
    this.isAdmin = false;
    this.isBgmOn = false;
    this.isMuted = false;

    this.init();
  }

  async init() {
    this.loadLocalUser();
    await this.fetchPackages();
    await this.fetchPrizes();
    this.render();

    if (!this.currentUser) {
      setTimeout(() => this.openAuthModal(), 500);
    }

    // Auto-refresh balances every 10 seconds
    setInterval(() => this.syncProfile(), 10000);
  }

  loadLocalUser() {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        this.currentUser = JSON.parse(saved);
      } else {
        this.currentUser = null;
      }
    } catch (e) {
      console.error(e);
    }
  }

  saveLocalUser() {
    if (this.currentUser) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.currentUser));
    }
  }

  async syncProfile() {
    if (!this.currentUser) return;
    try {
      const res = await fetch(`${this.apiBase}/api/user/profile?cardId=${this.currentUser.cardId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          this.currentUser = data.user;
          this.saveLocalUser();
          this.updateHeaderStats();
        }
      }
    } catch (e) {
      // Offline fallback is active
    }
  }

  async fetchPackages() {
    try {
      const res = await fetch(`${this.apiBase}/api/packages`);
      if (res.ok) {
        const data = await res.json();
        this.packages = data.packages;
        return;
      }
    } catch (e) {}

    // Fallback Packages
    this.packages = [
      { id: "pkg_starter", name: "Adventurer Starter", pricePKR: 500, cashCredits: 60, bonusCredits: 20, badge: "Popular for Kids", features: ["10+ Standard Games", "20 Bonus Credits", "Arcade Tickets Yield"] },
      { id: "pkg_family", name: "Family Mega Explorer", pricePKR: 1200, cashCredits: 160, bonusCredits: 70, badge: "Best Value", features: ["All 14+ 3D & VR Games", "70 Bonus Credits", "Double Ticket Multiplier", "Family Area Included"] },
      { id: "pkg_vip", name: "VIP Galaxy Master", pricePKR: 2500, cashCredits: 380, bonusCredits: 200, badge: "VIP Elite", features: ["Unlimited 3D Cinema", "200 Bonus Credits", "VIP Gold Holographic Card", "Instant Discounts"] },
      { id: "pkg_infinite", name: "Infinite Royal Champion", pricePKR: 5000, cashCredits: 850, bonusCredits: 500, badge: "Diamond Status", features: ["Max Ticket Multiplier", "500 Bonus Game Credits", "Special Free Pass Privileges"] }
    ];
  }

  async fetchPrizes() {
    try {
      const res = await fetch(`${this.apiBase}/api/store/prizes`);
      if (res.ok) {
        const data = await res.json();
        this.prizes = data.prizes;
        return;
      }
    } catch (e) {}

    // Fallback Prizes
    this.prizes = [
      { id: "prz_beyblade", name: "Pro Metal Fusion Beyblade Set + Dual Launcher", ticketCost: 180, stock: 25, category: "Toys & Action", image: "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=60", description: "Authentic high-velocity metal battling top with light-up gyro launcher." },
      { id: "prz_yoyo", name: "Hyper-Speed Ball Bearing Pro Yo-Yo", ticketCost: 90, stock: 40, category: "Skill Toys", image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&auto=format&fit=crop&q=60", description: "Aluminum alloy responsive yo-yo for advanced tricks and sleep spins." },
      { id: "prz_backpack", name: "Adventure Theme Park Ergonomic Kids Backpack", ticketCost: 350, stock: 15, category: "School & Bags", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=60", description: "Durable waterproof school & travel backpack with vibrant park emblems." },
      { id: "prz_plush_doraemon", name: "Giant Doraemon & Shinchan Plushies (Dual Pack)", ticketCost: 260, stock: 20, category: "Cartoons & Plushies", image: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=600&auto=format&fit=crop&q=60", description: "Ultra-soft premium plush cartoon characters with authentic embroidery." },
      { id: "prz_candy_box", name: "Mega Candy Rain Chocolate & Sweets Hamper", ticketCost: 120, stock: 50, category: "Sweets & Treats", image: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&auto=format&fit=crop&q=60", description: "Assorted imported chocolates, rainbow candies, and fruit gummies." },
      { id: "prz_keyring", name: "Light-Up Superhero & Anime Collector Keyring Bundle", ticketCost: 50, stock: 80, category: "Collectibles", image: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=600&auto=format&fit=crop&q=60", description: "Pack of 3 metal keyrings featuring Spider Hero, Iron Armor, and Frozen snowflakes." },
      { id: "prz_rc_drone", name: "Aeroplane Sky Patrol Mini Drone with LED", ticketCost: 500, stock: 8, category: "Tech & Electronics", image: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=600&auto=format&fit=crop&q=60", description: "Altitude-hold stunt drone with 360-degree flips and night-glow lights." }
    ];
  }

  // Games Catalog
  // Games Catalog
  getGameCatalog() {
    return [
      {
        id: "game_spiderman_swing",
        title: "Spider-Verse: Manhattan Horizon 3D 🕷️",
        category: "action",
        zone: "action",
        cost: 15,
        isBonusOnly: false,
        icon: "🕷️",
        banner: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=60",
        desc: "30-stage Manhattan web-slinging adventure! Red & Black Suit modes, high-speed wall climbing, police backup & Green Goblin grand finale!",
        url: "games/spiderman-web-city-3d/index.html"
      },
      {
        id: "game_superman_metropolis",
        title: "Titan of Metropolis: Flight of Steel 3D 🦸‍♂️",
        category: "action",
        zone: "action",
        cost: 15,
        isBonusOnly: false,
        icon: "🦸‍♂️",
        banner: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=60",
        desc: "Open-world flight simulation! Mach 3 sonic speed, Heat Vision beam attacks, Arctic Freeze Breath & 30 Lex Luthor invasion stages.",
        url: "games/superman-justice-3d/index.html"
      },
      {
        id: "game_batman_arkham",
        title: "Shadow Knight: Gotham Noir 3D 🦇",
        category: "action",
        zone: "action",
        cost: 15,
        isBonusOnly: false,
        icon: "🦇",
        banner: "https://images.unsplash.com/photo-1508974239320-0a029497e820?w=600&auto=format&fit=crop&q=60",
        desc: "Dark tactical stealth-action in Gotham! Bat-Cape gliding, gargoyle grapple hooks, smoke pellet traps & Arkham rogues gallery.",
        url: "games/batman-arkham-3d/index.html"
      },
      {
        id: "game_shinchan_run",
        title: "Kasukabe Rampage: Mega Chocobi Rush 3D 🏃‍♂️💨",
        category: "family",
        zone: "family",
        cost: 10,
        isBonusOnly: false,
        icon: "👦",
        banner: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=60",
        desc: "Endless Kasukabe dash! Misae's Bicycle Rollout, Hiroshi's Smelly Shoe blast, Shiro's Cookie Magnet & Ultimate Butt-Dash speed boost.",
        url: "games/shinchan-helper-3d/index.html"
      },
      {
        id: "game_doraemon_quest",
        title: "Cosmic Gadget Odyssey: Chrono Warp 3D 🌌",
        category: "family",
        zone: "family",
        cost: 10,
        isBonusOnly: false,
        icon: "🐱",
        banner: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=60",
        desc: "3D exploration puzzle with Anywhere Door timeline warps, Hopter flight physics, Time Cloth restoration & Big/Small Light ray!",
        url: "games/doraemon-sky-ocean-3d/index.html"
      },
      {
        id: "game_barbie_bratz",
        title: "Glamour Royalty: Fashion Runway Dreams 3D 💖",
        category: "family",
        zone: "family",
        cost: 15,
        isBonusOnly: false,
        icon: "💖",
        banner: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=60",
        desc: "Bratz Y2K Magazine, Jem Holograms, Winx Club Fairies, Monster High, Totally Spies & Luxury Beverly Hills Pink Convertible Sports Cars!",
        url: "games/barbie-bratz-princess-3d/index.html"
      },
      {
        id: "game_nfs_drift",
        title: "Apex Velocity: Neon Cyber Drift 3D 🏎️💨",
        category: "speed",
        zone: "speed",
        cost: 15,
        isBonusOnly: false,
        icon: "🏎️",
        banner: "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=600&auto=format&fit=crop&q=60",
        desc: "Fast-paced arcade street-racing! Handbrake tire-smoking drifts, Nitrous Oxide boost acceleration and high-speed police evasions.",
        url: "games/need-for-speed-bike-3d/index.html"
      },
      {
        id: "game_sonic_dash",
        title: "Turbo Hedgehog: Mach Velocity Dash 3D 🦔⚡",
        category: "speed",
        zone: "speed",
        cost: 10,
        isBonusOnly: false,
        icon: "🦔",
        banner: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=60",
        desc: "Hyper-speed 3D runner through Green Hill Zone! Charge Spin Dash to smash Badnik robots, collect Golden Rings & execute Homing Attacks.",
        url: "games/sonic-dash-3d/index.html"
      },
      {
        id: "game_helicopter_rescue",
        title: "Air Rescue Alpha: Apex Medevac 3D 🚁",
        category: "speed",
        zone: "speed",
        cost: 15,
        isBonusOnly: false,
        icon: "🚁",
        banner: "https://images.unsplash.com/photo-1519074069444-1ba4fff16def?w=600&auto=format&fit=crop&q=60",
        desc: "Physics-based search & rescue flight simulation! Collective pitch hover controls, mountain distress tracking & civilian rescue winch.",
        url: "games/helicopter-rescue-3d/index.html"
      },
      {
        id: "game_airplane_flight",
        title: "Sky Horizon: Global Jetliner Ace 3D ✈️",
        category: "speed",
        zone: "speed",
        cost: 15,
        isBonusOnly: false,
        icon: "✈️",
        banner: "https://images.unsplash.com/photo-1519074069444-1ba4fff16def?w=600&auto=format&fit=crop&q=60",
        desc: "Commercial aviation flight simulator! Cockpit telemetry, flight stick takeoffs, weather turbulence control & precision runway landings.",
        url: "games/airplane-flight-sim-3d/index.html"
      },
      {
        id: "game_thief_capture",
        title: "Hot Pursuit: Interceptor City Patrol 3D 👮‍♂️🚓",
        category: "action",
        zone: "defense",
        cost: 15,
        isBonusOnly: false,
        icon: "🚓",
        banner: "https://images.unsplash.com/photo-1508974239320-0a029497e820?w=600&auto=format&fit=crop&q=60",
        desc: "Tactical police pursuit & roadblock containment strategy! Deploy cruiser roadblocks and drop Spike Strips onto fleeing bandit cars.",
        url: "games/thief-capture-police-3d/index.html"
      },
      {
        id: "game_sweet_blast",
        title: "Sugar Avalanche: Candy Kingdom Galaxy 3D 🍬🍰",
        category: "sweet",
        zone: "sweet",
        cost: 10,
        isBonusOnly: false,
        icon: "🍬",
        banner: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&auto=format&fit=crop&q=60",
        desc: "Vibrant match-3 candy blast puzzle! Match 4 for Striped Jelly column blasts, Match 5 for Rainbow Donuts & trigger Sweet Combos.",
        url: "games/candy-crush-3d/index.html"
      },
      {
        id: "game_ninja_shadow",
        title: "Shadow Blade: Shinobi Katana Reign 3D 🥷",
        category: "action",
        zone: "action",
        cost: 15,
        isBonusOnly: false,
        icon: "🥷",
        banner: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=60",
        desc: "Shinobi ninja stealth runner! Katana slashes, shuriken throws, smoke vanishes, Samurai Warlord bosses & 30 progressive stages.",
        url: "games/ninja-shadow-blade-3d/index.html"
      },
      {
        id: "game_army_zombies",
        title: "Project Biohazard: Special Forces Outbreak 3D 🧟",
        category: "action",
        zone: "action",
        cost: 15,
        isBonusOnly: false,
        icon: "🧟",
        banner: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=60",
        desc: "Project IGI stealth commando & zombie outbreak shooter! Assault rifle headshots, alarm towers, zombie waves & 30 stages.",
        url: "games/army-zombies-3d/index.html"
      },
      {
        id: "game_saiyan_ki",
        title: "Dragon Ki: Astral Awakening 3D ⚡",
        category: "action",
        zone: "action",
        cost: 15,
        isBonusOnly: false,
        icon: "⚡",
        banner: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=60",
        desc: "Charge Ki aura, fire Kamehameha energy beams, teleport behind galactic foes and ascend to Super Saiyan God across 30 cosmic stages!",
        url: "games/super-saiyan-ki-3d/index.html"
      },
      {
        id: "game_kiteretsu_quest",
        title: "Chrono Inventors: Korosuke Robo Quest 3D 🤖",
        category: "family",
        zone: "family",
        cost: 10,
        isBonusOnly: false,
        icon: "🤖",
        banner: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=60",
        desc: "Assemble historic time-travel gadgets with Korosuke! Katana strikes, Edo period exploration, clockwork contraptions & 30 stages.",
        url: "games/kiteretsu-korosuke-3d/index.html"
      },
      {
        id: "game_bomberman_rescue",
        title: "Nitro Blaster: Cyber Blast Arena 3D 💣",
        category: "action",
        zone: "action",
        cost: 15,
        isBonusOnly: false,
        icon: "💣",
        banner: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=60",
        desc: "Classic arcade bomb-dropping tactical action! Place plasma bombs, blast maze walls, rescue trapped robotic allies & defeat Cyber Bosses.",
        url: "games/bomberman-rescue-3d/index.html"
      }
    ];
  }

  // Tap-to-Play Card Verification
  async handlePlayGame(game) {
    if (window.parkAudio) window.parkAudio.playCardTap();

    if (!this.currentUser) {
      this.openAuthModal();
      return;
    }

    // Try API Tap-Play
    try {
      const res = await fetch(`${this.apiBase}/api/games/tap-play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: this.currentUser.cardId,
          gameId: game.id,
          gameName: game.title,
          cost: game.cost,
          isBonusOnly: game.isBonusOnly
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          alert(`⚠️ ${data.error}\n\nPlease click "Recharge Card" to top-up via JazzCash or Bank transfer!`);
          this.openTopupModal(game.isBonusOnly ? 'pkg_family' : 'pkg_starter');
          return;
        }
        alert(data.error || "Failed to tap card.");
        return;
      }

      this.currentUser = data.user;
      this.saveLocalUser();
      this.updateHeaderStats();
      this.launchGameModal(game);
      return;
    } catch (e) {
      // Offline simulation fallback
      if (!this.currentUser.isPaid && !this.currentUser.hasFreePass) {
        const trialStart = new Date(this.currentUser.trialStartedAt || this.currentUser.createdAt || Date.now()).getTime();
        const elapsed = Math.floor((Date.now() - trialStart) / 1000);
        if (elapsed > 180) {
           alert(`⚠️ Your 3-minute free trial has ended.\n\nPlease pay Rs. 100 for Lifetime Access to ALL 17 Games!`);
           this.openTopupModal();
           return;
        }
      }
      this.saveLocalUser();
      this.updateHeaderStats();
      this.launchGameModal(game);
    }
  }

  // Claim tickets won after game over
  async handleGameOverResult(game, result) {
    const ticketsWon = result.ticketsWon || 10;
    const score = result.score || 0;

    if (window.parkAudio) window.parkAudio.playWinFanfare();

    try {
      const res = await fetch(`${this.apiBase}/api/games/claim-tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: this.currentUser.cardId,
          gameName: game.title,
          score,
          ticketsWon
        })
      });

      if (res.ok) {
        const data = await res.json();
        this.currentUser = data.user;
      } else {
        this.currentUser.tickets = (this.currentUser.tickets || 0) + ticketsWon;
      }
    } catch (e) {
      this.currentUser.tickets = (this.currentUser.tickets || 0) + ticketsWon;
    }

    this.saveLocalUser();
    this.updateHeaderStats();

    // Show Victory Screen inside Game Modal
    const victoryOverlay = document.getElementById('game-victory-overlay');
    if (victoryOverlay) {
      victoryOverlay.innerHTML = `
        <div style="background: rgba(13, 18, 38, 0.95); border: 2px solid #ffd60a; border-radius: 20px; padding: 30px; text-align: center; max-width: 440px; box-shadow: 0 0 40px rgba(255, 214, 10, 0.5);">
          <div style="font-size: 3rem; margin-bottom: 10px;">🎉 🏆</div>
          <h2 style="font-family: Orbitron, sans-serif; color: #ffd60a; font-size: 1.6rem; margin-bottom: 8px;">GAME COMPLETE!</h2>
          <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 18px;">${game.title}</p>
          <div style="background: rgba(255, 214, 10, 0.15); border: 1px solid rgba(255, 214, 10, 0.4); border-radius: 12px; padding: 15px; margin-bottom: 20px;">
            <div style="font-size: 1.1rem; color: #ffffff; margin-bottom: 4px;">FINAL SCORE: <strong style="color: #00f0ff;">${score}</strong></div>
            <div style="font-size: 1.4rem; color: #ffd60a; font-family: Orbitron, sans-serif; font-weight: 700;">+${ticketsWon} TICKETS WON!</div>
          </div>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button class="btn-neon" onclick="window.parkApp.handlePlayGame(window.parkApp.activeGame)">🔄 PLAY AGAIN</button>
            <button class="btn-glass" onclick="window.parkApp.closeGameModal()">EXIT TO PARK</button>
          </div>
        </div>
      `;
      victoryOverlay.style.display = 'flex';
    }
  }

  // Prize Redemption
  async handleRedeemPrize(prize) {
    if (!this.currentUser) {
      this.openAuthModal();
      return;
    }

    if ((this.currentUser.tickets || 0) < prize.ticketCost) {
      alert(`⚠️ Not enough tickets!\n\nYou have ${this.currentUser.tickets || 0} tickets, but ${prize.name} requires ${prize.ticketCost} tickets.\nPlay more 3D games to earn tickets!`);
      return;
    }

    const confirmRedeem = confirm(`🎁 Redeem "${prize.name}" for ${prize.ticketCost} Tickets?`);
    if (!confirmRedeem) return;

    try {
      const res = await fetch(`${this.apiBase}/api/store/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: this.currentUser.cardId,
          prizeId: prize.id
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Redemption failed.");
        return;
      }

      this.currentUser = data.user;
      this.saveLocalUser();
      this.updateHeaderStats();
      if (window.parkAudio) window.parkAudio.playWinFanfare();

      alert(`🎉 CONGRATULATIONS!\n\nYou have redeemed: ${prize.name}!\n\n🎟️ YOUR CLAIM VOUCHER CODE: ${data.redemptionCode}\n\nPlease show this code at the Park Prize Counter to collect your prize!`);
      this.render();
    } catch (e) {
      // Offline fallback
      this.currentUser.tickets -= prize.ticketCost;
      const fakeCode = `PRIZE-${Math.floor(100000 + Math.random() * 900000)}`;
      this.saveLocalUser();
      this.updateHeaderStats();
      alert(`🎉 REDEEMED (Offline Mode)!\n\nPrize: ${prize.name}\nVoucher Code: ${fakeCode}\nShow this code at the counter!`);
      this.render();
    }
  }

  // -------------------------------------------------------------
  // RENDER DOM & VIEWS
  // -------------------------------------------------------------

  async render() {
    const appRoot = document.getElementById('app-root');
    if (!appRoot) return;

    const mainContent = await this.renderActiveTabContent();

    appRoot.innerHTML = `
      <!-- TOP NAVIGATION BAR -->
      <header style="background: rgba(8, 12, 26, 0.85); backdrop-filter: blur(16px); border-bottom: 1px solid var(--border-glass); position: sticky; top: 0; z-index: 100; padding: 12px 24px;">
        <div style="max-width: 1300px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
          
          <!-- Logo & Title -->
          <div style="display: flex; align-items: center; gap: 12px; cursor: pointer;" onclick="window.parkApp.setActiveTab('park')">
            <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #00f0ff, #9d4edd); display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 0 20px rgba(0, 240, 255, 0.5);">
              🎡
            </div>
            <div>
              <h1 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 900; letter-spacing: 1px; background: linear-gradient(90deg, #00f0ff, #ff007f, #ffd60a); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                GALAXY ADVENTURE PARK
              </h1>
              <div style="font-size: 0.72rem; color: var(--text-secondary); letter-spacing: 0.8px;">3D VIRTUAL UNIVERSE & ARCADE</div>
            </div>
          </div>

          <!-- Navigation Tabs Removed -->
          <!-- User Quick Stats & Audio Controls -->
          <div style="display: flex; align-items: center; gap: 12px;">
            <button class="btn-glass" style="padding: 8px 12px; font-size: 0.85rem;" onclick="window.parkApp.toggleAudio()" title="Toggle Sound">
              ${this.isMuted ? '🔇 MUTED' : '🔊 AUDIO ON'}
            </button>
            <button class="btn-glass" style="padding: 8px 12px; font-size: 0.85rem;" onclick="window.parkApp.toggleBGM()" title="Toggle Park Music">
              ${this.isBgmOn ? '🎵 MUSIC ON' : '🎶 MUSIC OFF'}
            </button>
            
            <div id="header-user-stats" style="display: flex; align-items: center; gap: 10px;">
              ${this.renderHeaderUserStats()}
            </div>
          </div>

        </div>
      </header>

      <!-- MAIN CONTENT VIEW -->
      <main style="max-width: 1300px; margin: 0 auto; padding: 24px 16px; min-height: 80vh;">
        ${mainContent}
      </main>

      <!-- FOOTER -->
      <footer style="background: rgba(6, 9, 20, 0.95); border-top: 1px solid var(--border-glass); padding: 32px 16px; text-align: center; color: var(--text-secondary); margin-top: 40px;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; align-items: center;">
          <div style="font-family: var(--font-display); font-size: 1.1rem; color: #f8fafc; letter-spacing: 1px;">
            🎡 GALAXY 3D ADVENTURE PARK & ARCADE ECOSYSTEM
          </div>
          <p style="font-size: 0.85rem; max-width: 600px; color: var(--text-muted);">
            Official Top-up & Verification: JazzCash (+923211808390) | IBAN: PK49ABPA0010083355410015 (SYED Usama Tanveer) | WhatsApp: +97332377688 / +923211808390
          </p>
          <div style="display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; font-size: 0.8rem; color: var(--neon-cyan);">
            <span>⚡ 14+ 3D Playable Games</span>
            <span>💳 NFC Smart Tap-to-Play</span>
            <span>🎁 Real Physical Toy Redemptions</span>
            <span>🛡️ Instant Admin Verification</span>
          </div>
        </div>
      </footer>

      <!-- MODALS ROOT -->
      <div id="modal-root"></div>
    `;
  }

  renderHeaderUserStats() {
    if (!this.currentUser) {
      return `<button class="btn-neon" onclick="window.parkApp.openAuthModal()">LOGIN / REGISTER CARD</button>`;
    }

    const isLifetime = this.currentUser.isPaid || this.currentUser.hasFreePass;
    const statusText = isLifetime ? '🌟 LIFETIME ACCESS' : '⏳ FREE TRIAL ACTIVE';
    const statusColor = isLifetime ? 'var(--neon-gold)' : 'var(--neon-cyan)';

    return `
      <div style="background: rgba(0, 240, 255, 0.12); border: 1px solid rgba(0, 240, 255, 0.4); padding: 6px 12px; border-radius: var(--radius-full); font-size: 0.85rem; color: ${statusColor}; font-family: var(--font-display); cursor: pointer;" onclick="window.parkApp.openTopupModal()">
        ${statusText}
      </div>
      ${!isLifetime ? `
      <button class="btn-neon" style="padding: 6px 14px; font-size: 0.8rem;" onclick="window.parkApp.openTopupModal()">
        BUY LIFETIME ACCESS (RS 100)
      </button>
      ` : ''}
    `;
  }

  updateHeaderStats() {
    const statsContainer = document.getElementById('header-user-stats');
    if (statsContainer) {
      statsContainer.innerHTML = this.renderHeaderUserStats();
    }
  }

  setActiveTab(tab) {
    this.activeTab = tab;
    if (window.parkAudio) window.parkAudio.playCardTap();
    this.render();
  }

  toggleAudio() {
    if (window.parkAudio) {
      this.isMuted = window.parkAudio.toggleMute();
      this.render();
    }
  }

  toggleBGM() {
    if (window.parkAudio) {
      this.isBgmOn = window.parkAudio.toggleBGM();
      this.render();
    }
  }

  // -------------------------------------------------------------
  // TAB 1: PARK ZONES & GAMES
  // -------------------------------------------------------------

  renderActiveTabContent() {
    switch (this.activeTab) {
      case 'park': return this.renderParkZones();
      case 'card': return this.renderSmartCardView();
      case 'store': return this.renderPrizeStore();
      case 'admin': return this.renderAdminPortal();
      default: return this.renderParkZones();
    }
  }

  renderParkZones() {
    const games = this.getGameCatalog();
    const filteredGames = this.activeZone === 'all' ? games : games.filter(g => g.category === this.activeZone || g.zone === this.activeZone);

    return `
      <!-- Hero Banner & Welcome -->
      <div class="glass-panel" style="padding: 32px 24px; margin-bottom: 28px; background: linear-gradient(135deg, rgba(16, 24, 54, 0.85), rgba(46, 16, 101, 0.75)); border: 1px solid rgba(0, 240, 255, 0.3);">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
          <div>
            <div class="neon-badge badge-gold" style="margin-bottom: 10px;">🌟 AAA 3D VIRTUAL ADVENTURE AMUSEMENT WORLD</div>
            <h2 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 900; margin-bottom: 10px; line-height: 1.2;">
              WELCOME TO GALAXY ADVENTURE PARK!
            </h2>
            <p style="color: var(--text-secondary); max-width: 680px; font-size: 1rem; line-height: 1.6;">
              Swipe your Virtual NFC Smart Card to launch into Shin-chan's Kasukabe Run, Doraemon's Cosmic Gadget Quest, Superman's Metropolis Patrol, Batman's Arkham Shadows, Spider-Man's Web-Swings, Need for Speed Drifts, Sonic Speed Dash, Aviation Simulations, and Sweet Blast!
            </p>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button class="btn-neon" style="font-size: 1rem; padding: 14px 28px;" onclick="window.parkApp.openTopupModal()">
              💳 TOP-UP CARD PACKAGES
            </button>
            <button class="btn-glass" style="font-size: 0.85rem;" onclick="window.parkApp.openFreePassModal()">
              📜 SUBMIT FREE PASS CERTIFICATE
            </button>
          </div>
        </div>
      </div>

      <!-- Games Grid -->
      <div class="game-grid">
        ${filteredGames.map(game => `
          <div class="glass-panel" style="display: flex; flex-direction: column; overflow: hidden; position: relative;">
            <!-- Game Banner & Badges -->
            <div style="height: 160px; background: url('${game.banner}') center/cover no-repeat; position: relative;">
              <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(4,7,18,0.2) 0%, rgba(13,18,38,0.95) 100%);"></div>
              
              <div style="position: absolute; top: 12px; left: 12px; display: flex; gap: 6px;">
                ${game.isBonusOnly ? '<span class="neon-badge badge-pink">🌟 BONUS ONLY</span>' : '<span class="neon-badge badge-cyan">💵 STANDARD</span>'}
              </div>
              
              <div style="position: absolute; top: 12px; right: 12px;">
                <span class="neon-badge badge-gold">${game.cost} CREDITS</span>
              </div>

              <div style="position: absolute; bottom: 12px; left: 14px; display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.8rem;">${game.icon}</span>
                <h3 style="font-family: var(--font-display); font-size: 1.05rem; font-weight: 700; color: #ffffff;">${game.title}</h3>
              </div>
            </div>

            <!-- Game Description -->
            <div style="padding: 16px; display: flex; flex-direction: column; justify-content: space-between; flex-grow: 1; gap: 14px;">
              <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5;">${game.desc}</p>
              
              <button class="btn-neon" style="width: 100%; font-size: 0.9rem;" onclick="window.parkApp.handlePlayGame(${JSON.stringify(game).replace(/"/g, '&quot;')})">
                🎮 TAP CARD TO PLAY
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  setZone(zoneId) {
    this.activeZone = zoneId;
    if (window.parkAudio) window.parkAudio.playCardTap();
    this.render();
  }

  // -------------------------------------------------------------
  // TAB 2: SMART NFC CARD VIEW
  // -------------------------------------------------------------

  renderSmartCardView() {
    const user = this.currentUser || {
      name: "Guest Visitor",
      cardId: "PK-ADV-0000",
      cashCredits: 0,
      bonusCredits: 0,
      tickets: 0,
      vipTier: "Visitor",
      hasFreePass: false,
      history: []
    };

    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 32px; align-items: start;">
        
        <!-- 3D Interactive Holographic NFC Card -->
        <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
          <div class="smart-nfc-card">
            <!-- Top Card Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div class="chip-icon"></div>
                <span style="font-family: var(--font-display); font-size: 0.75rem; letter-spacing: 1px; color: var(--neon-cyan);">NFC SMART PASS</span>
              </div>
              <span class="neon-badge ${user.hasFreePass ? 'badge-emerald' : 'badge-gold'}">
                ${user.hasFreePass ? '🌟 100% FREE PASS' : user.vipTier}
              </span>
            </div>

            <!-- Card ID & Name -->
            <div style="margin-bottom: 18px;">
              <div style="font-family: var(--font-display); font-size: 1.35rem; font-weight: 900; letter-spacing: 2px; color: #ffffff;">
                ${user.cardId}
              </div>
              <div style="color: var(--text-secondary); font-size: 0.85rem; text-transform: uppercase;">
                ${user.name}
              </div>
            </div>

            <!-- Balance Readout -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; background: rgba(0,0,0,0.35); padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);">
              <div>
                <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Account Status</div>
                <div style="font-family: var(--font-display); font-size: 1.15rem; color: ${user.isPaid || user.hasFreePass ? 'var(--neon-gold)' : 'var(--neon-cyan)'}; font-weight: 700;">
                  ${user.isPaid || user.hasFreePass ? 'LIFETIME ACCESS' : 'FREE TRIAL'}
                </div>
              </div>
            </div>
          </div>
              </div>
              <div>
                <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Bonus Balance</div>
                <div style="font-family: var(--font-display); font-size: 1.15rem; color: var(--neon-pink); font-weight: 700;">
                  ${user.bonusCredits} BONUS
                </div>
              </div>
              <div>
                <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Won Tickets</div>
                <div style="font-family: var(--font-display); font-size: 1.15rem; color: var(--neon-gold); font-weight: 700;">
                  🎟️ ${user.tickets}
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div style="display: flex; gap: 12px; width: 360px; max-width: 100%;">
            <button class="btn-neon" style="flex: 1;" onclick="window.parkApp.openTopupModal()">
              💳 TOP-UP CARD
            </button>
            <button class="btn-glass" style="flex: 1;" onclick="window.parkApp.openAuthModal()">
              🔄 SWITCH CARD
            </button>
          </div>
        </div>

        <!-- Card Features & Activity History -->
        <div class="glass-panel" style="padding: 24px;">
          <h3 style="font-family: var(--font-display); font-size: 1.2rem; color: #ffffff; margin-bottom: 16px;">
            📜 CARD ACTIVITY & TRANSACTION LOG
          </h3>

          <div style="max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
            ${(user.history && user.history.length > 0) ? user.history.map(h => `
              <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); padding: 12px 14px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 0.9rem; color: #ffffff; font-weight: 600;">${h.desc}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${new Date(h.timestamp).toLocaleString()}</div>
                </div>
                <div style="font-family: var(--font-display); font-weight: 700; color: ${h.amount >= 0 ? 'var(--neon-emerald)' : 'var(--neon-crimson)'};">
                  ${h.amount >= 0 ? `+${h.amount}` : h.amount}
                </div>
              </div>
            `).join('') : '<p style="color: var(--text-muted); font-size: 0.85rem;">No transactions recorded yet. Play games or top-up to see activity!</p>'}
          </div>

          <!-- Official Payment Reference Info Box -->
          <div style="margin-top: 24px; background: rgba(0, 240, 255, 0.05); border: 1px solid rgba(0, 240, 255, 0.3); padding: 16px; border-radius: 12px;">
            <h4 style="font-family: var(--font-display); font-size: 0.9rem; color: var(--neon-cyan); margin-bottom: 8px;">
              🏦 OFFICIAL PAYMENT DETAILS:
            </h4>
            <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
              <div>📱 <strong>JazzCash:</strong> +923211808390</div>
              <div>🏛️ <strong>Bank IBAN:</strong> PK49ABPA0010083355410015 (Title: SYED Usama Tanveer)</div>
              <div>💬 <strong>WhatsApp Proof:</strong> +97332377688 or +923211808390</div>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  // -------------------------------------------------------------
  // TAB 3: TICKET REDEMPTION PRIZE STORE
  // -------------------------------------------------------------

  renderPrizeStore() {
    return `
      <!-- Store Header Banner -->
      <div class="glass-panel" style="padding: 24px; margin-bottom: 28px; background: linear-gradient(135deg, rgba(20, 24, 60, 0.8), rgba(60, 20, 80, 0.7));">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="neon-badge badge-gold" style="margin-bottom: 8px;">🎁 TICKET PRIZE REDEMPTION VAULT</span>
            <h2 style="font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; color: #ffffff;">
              ARCADE PRIZE REDEMPTION STORE
            </h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">
              Play 3D games to earn arcade tickets, then exchange them for real Beyblades, Yo-Yos, School Bags & Plushies!
            </p>
          </div>
          <div class="ticket-vault-badge" style="font-size: 1.2rem; padding: 12px 20px;">
            🎟️ YOUR TICKETS: <span>${this.currentUser ? this.currentUser.tickets : 0}</span>
          </div>
        </div>
      </div>

      <!-- Prizes Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px;">
        ${this.prizes.map(prize => `
          <div class="glass-panel" style="display: flex; flex-direction: column; overflow: hidden;">
            <div style="height: 180px; background: url('${prize.image}') center/cover no-repeat; position: relative;">
              <div style="position: absolute; top: 12px; right: 12px;">
                <span class="neon-badge badge-gold">🎟️ ${prize.ticketCost} TICKETS</span>
              </div>
              <div style="position: absolute; bottom: 8px; left: 12px;">
                <span class="neon-badge badge-cyan">${prize.category}</span>
              </div>
            </div>

            <div style="padding: 16px; display: flex; flex-direction: column; justify-content: space-between; flex-grow: 1; gap: 14px;">
              <div>
                <h3 style="font-family: var(--font-display); font-size: 1.05rem; color: #ffffff; margin-bottom: 6px;">
                  ${prize.name}
                </h3>
                <p style="color: var(--text-secondary); font-size: 0.82rem; line-height: 1.4;">
                  ${prize.description}
                </p>
              </div>

                <span style="font-size: 0.8rem; color: var(--neon-emerald);">In Stock: ${prize.stock}</span>
                <button class="btn-gold" style="font-size: 0.85rem; padding: 8px 18px;" onclick="window.parkApp.handleRedeemPrize(${JSON.stringify(prize).replace(/"/g, '&quot;')})">
                  🎁 REDEEM
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // -------------------------------------------------------------
  // TAB 4: ADMIN PORTAL & APPROVAL CENTER
  // -------------------------------------------------------------

  async renderAdminPortal() {
    const adminRoot = document.getElementById('app-root');
    
    // Check if authenticated as Admin
    if (!this.isAdmin) {
      return `
        <div class="glass-panel" style="max-width: 520px; margin: 40px auto; padding: 32px; text-align: center; border: 2px solid var(--neon-pink);">
          <div style="font-size: 3rem; margin-bottom: 12px;">🛡️ 🔐</div>
          <span class="neon-badge badge-pink" style="margin-bottom: 8px;">RESTRICTED AREA</span>
          <h2 style="font-family: var(--font-display); font-size: 1.6rem; color: #ffffff; margin: 8px 0 16px;">
            PARK MASTER ADMIN CONTROL
          </h2>
          <p style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.5; margin-bottom: 20px;">
            Access player database, verify WhatsApp receipts, approve customers by Email, and manage smart card credits.
          </p>

          <!-- Master Credentials Info Box -->
          <div style="background: rgba(255, 0, 127, 0.1); border: 1px solid rgba(255, 0, 127, 0.3); border-radius: 12px; padding: 14px; text-align: left; margin-bottom: 22px; font-size: 0.85rem;">
            <div style="color: var(--neon-gold); font-weight: 700; margin-bottom: 4px;">👑 OFFICIAL MASTER CREDENTIALS:</div>
            <div style="color: #ffffff;">👤 <strong>Username / Email:</strong> <code style="color: var(--neon-cyan);">admin</code> or <code style="color: var(--neon-cyan);">admin@adventurepark.com</code></div>
            <div style="color: #ffffff;">🔑 <strong>Master PIN:</strong> <code style="color: var(--neon-pink);">9988</code></div>
          </div>

          <form onsubmit="window.parkApp.handleAdminLogin(event)" style="display: flex; flex-direction: column; gap: 14px; text-align: left;">
            <div>
              <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Admin Username or Email:</label>
              <input type="text" id="admin-user-input" required value="admin" style="width: 100%; background: #070a18; border: 1px solid var(--border-glass); border-radius: 8px; padding: 12px; color: #fff; font-size: 0.95rem;">
            </div>

            <div>
              <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Master Access PIN:</label>
              <input type="password" id="admin-pin-input" required value="9988" style="width: 100%; background: #070a18; border: 1px solid var(--border-glass); border-radius: 8px; padding: 12px; color: #fff; font-size: 0.95rem;">
            </div>

            <div style="display: flex; gap: 10px; margin-top: 8px;">
              <button type="submit" class="btn-pink" style="flex: 1; padding: 14px; font-size: 1rem;">
                🚀 UNLOCK MASTER CONTROL
              </button>
            </div>
          </form>
        </div>
      `;
    }

    // Load live admin dashboard stats
    let dashboard = {
      stats: { totalUsers: 1, totalRevenuePKR: 1200, approvedPayments: 1, pendingPaymentsCount: 1, pendingCertificatesCount: 1, totalTicketsRedeemed: 0 },
      pendingPayments: [],
      pendingCertificates: [],
      users: []
    };

    try {
      const res = await fetch(`${this.apiBase}/api/admin/dashboard`);
      if (res.ok) {
        dashboard = await res.json();
      }
    } catch (e) {}

    return `
      <div style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="neon-badge badge-pink">🛡️ PARK MASTER COMMAND &bull; LOGGED IN</span>
          <h2 style="font-family: var(--font-display); font-size: 1.8rem; color: #ffffff; margin-top: 6px;">
            ADMIN VERIFICATION & RECHARGE CONTROL CENTER
          </h2>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn-neon" onclick="window.parkApp.openManualCreditModal()">
            ➕ MANUAL CREDIT INJECTOR
          </button>
          <button class="btn-glass" onclick="window.parkApp.adminLogout()">
            🔒 LOGOUT ADMIN
          </button>
        </div>
      </div>

      <!-- Live KPI Stat Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 28px;">
        <div class="glass-panel" style="padding: 18px;">
          <div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">Total Park Revenue</div>
          <div style="font-family: var(--font-display); font-size: 1.5rem; color: var(--neon-gold); font-weight: 900; margin-top: 4px;">
            PKR ${dashboard.stats.totalRevenuePKR || 0}
          </div>
        </div>
        <div class="glass-panel" style="padding: 18px;">
          <div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">Pending Payments</div>
          <div style="font-family: var(--font-display); font-size: 1.5rem; color: var(--neon-pink); font-weight: 900; margin-top: 4px;">
            ${dashboard.stats.pendingPaymentsCount || 0} AWAITING
          </div>
        </div>
        <div class="glass-panel" style="padding: 18px;">
          <div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">Pending Free Passes</div>
          <div style="font-family: var(--font-display); font-size: 1.5rem; color: var(--neon-cyan); font-weight: 900; margin-top: 4px;">
            ${dashboard.stats.pendingCertificatesCount || 0} CERTIFICATES
          </div>
        </div>
        <div class="glass-panel" style="padding: 18px;">
          <div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">Registered Smart Cards</div>
          <div style="font-family: var(--font-display); font-size: 1.5rem; color: var(--neon-emerald); font-weight: 900; margin-top: 4px;">
            ${dashboard.stats.totalUsers || 1} CARDS
          </div>
        </div>
      </div>

      <!-- ⚡ FEATURE: INSTANT EMAIL USER APPROVER & VIP ACTIVATOR -->
      <div class="glass-panel" style="padding: 24px; margin-bottom: 28px; border: 2px solid var(--neon-emerald); background: linear-gradient(135deg, rgba(0, 245, 155, 0.08), rgba(0, 240, 255, 0.05));">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
          <div>
            <span class="neon-badge badge-emerald">⚡ INSTANT USER EMAIL APPROVER</span>
            <h3 style="font-family: var(--font-display); font-size: 1.3rem; color: #ffffff; margin-top: 4px;">
              APPROVE & ACTIVATE CUSTOMER BY EMAIL
            </h3>
            <p style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 2px;">
              When a user sends proof on WhatsApp (+97332377688 / +923211808390), enter their Email below to instantly grant VIP credits or unlock 100% Free Pass!
            </p>
          </div>
        </div>

        <form onsubmit="window.parkApp.handleEmailApproval(event)" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; align-items: end;">
          <div>
            <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Customer Email Address:</label>
            <input type="email" id="email-approve-input" required placeholder="e.g. player@park.com" value="player@park.com" style="width: 100%; background: #070a18; border: 1px solid var(--border-glass); border-radius: 8px; padding: 10px; color: #fff;">
          </div>

          <div>
            <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Package / Credit Tier to Grant:</label>
            <select id="email-approve-pkg" style="width: 100%; background: #070a18; border: 1px solid var(--border-glass); border-radius: 8px; padding: 10px; color: #fff;">
              <option value="pkg_family">Family Mega Explorer (160 Cash + 70 Bonus credits)</option>
              <option value="pkg_starter">Adventurer Starter (60 Cash + 20 Bonus credits)</option>
              <option value="pkg_vip">VIP Galaxy Master (380 Cash + 200 Bonus credits)</option>
              <option value="pkg_infinite">Infinite Champion (850 Cash + 500 Bonus credits)</option>
              <option value="freepass_only">🌟 100% Free Pass (Unlock All 30 Levels Free)</option>
            </select>
          </div>

          <div>
            <button type="submit" class="btn-emerald" style="width: 100%; padding: 12px; font-size: 0.95rem; font-weight: 700;">
              ✅ APPROVE & ACTIVATE USER
            </button>
          </div>
        </form>
      </div>

      <!-- PENDING PAYMENT SCREENSHOTS QUEUE -->
      <div class="glass-panel" style="padding: 24px; margin-bottom: 28px;">
        <h3 style="font-family: var(--font-display); font-size: 1.2rem; color: var(--neon-cyan); margin-bottom: 16px;">
          📥 PENDING JAZZCASH & BANK PAYMENT RECEIPTS (WHATSAPP VERIFICATION QUEUE)
        </h3>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${(dashboard.pendingPayments && dashboard.pendingPayments.length > 0) ? dashboard.pendingPayments.map(p => `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid ${p.status === 'PENDING' ? 'var(--neon-pink)' : 'var(--border-glass)'}; border-radius: 12px; padding: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; align-items: center;">
              <div>
                <div style="font-family: var(--font-display); font-weight: 700; color: #ffffff;">${p.userName} (${p.cardId})</div>
                <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 2px;">Phone: ${p.userPhone}</div>
                <div style="font-size: 0.82rem; color: var(--neon-gold); margin-top: 2px;">Package: ${p.packageName} (PKR ${p.amountPKR})</div>
              </div>

              <div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">Method: <strong>${p.paymentMethod}</strong></div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">Txn ID: <strong>${p.transactionId}</strong></div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">Time: ${new Date(p.submittedAt).toLocaleString()}</div>
              </div>

              <div>
                <a href="${p.screenshotUrl}" target="_blank" style="color: var(--neon-cyan); font-size: 0.85rem; text-decoration: underline; display: inline-flex; align-items: center; gap: 4px;">
                  📸 VIEW RECEIPT SCREENSHOT
                </a>
                <div style="margin-top: 6px;">
                  <span class="neon-badge ${p.status === 'APPROVED' ? 'badge-emerald' : (p.status === 'REJECTED' ? 'badge-pink' : 'badge-gold')}">${p.status}</span>
                </div>
              </div>

              <div style="display: flex; gap: 8px;">
                ${p.status === 'PENDING' ? `
                  <button class="btn-emerald" style="padding: 8px 16px; font-size: 0.85rem;" onclick="window.parkApp.handleAdminApprovePayment('${p.id}')">
                    ✅ APPROVE CREDITS
                  </button>
                  <button class="btn-glass" style="padding: 8px 14px; font-size: 0.85rem; color: var(--neon-crimson);" onclick="window.parkApp.handleAdminRejectPayment('${p.id}')">
                    ❌ REJECT
                  </button>
                ` : `<span style="font-size: 0.85rem; color: var(--text-muted);">Processed</span>`}
              </div>
            </div>
          `).join('') : '<p style="color: var(--text-muted);">No payment receipts pending verification.</p>'}
        </div>
      </div>

      <!-- ALL REGISTERED SMART CARDS DIRECTORY -->
      <div class="glass-panel" style="padding: 24px; margin-bottom: 28px;">
        <h3 style="font-family: var(--font-display); font-size: 1.2rem; color: var(--neon-gold); margin-bottom: 16px;">
          👥 REGISTERED SMART CARD PLAYERS DIRECTORY
        </h3>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-glass); color: var(--text-secondary);">
                <th style="padding: 10px;">Player Name</th>
                <th style="padding: 10px;">Email</th>
                <th style="padding: 10px;">Card ID / Phone</th>
                <th style="padding: 10px;">Balance</th>
                <th style="padding: 10px;">VIP Tier</th>
                <th style="padding: 10px;">Pass Status</th>
                <th style="padding: 10px;">Quick Action</th>
              </tr>
            </thead>
            <tbody>
              ${(dashboard.users && dashboard.users.length > 0) ? dashboard.users.map(u => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                  <td style="padding: 10px; font-weight: 600; color: #fff;">${u.name}</td>
                  <td style="padding: 10px; color: var(--neon-cyan);">${u.email || 'N/A'}</td>
                  <td style="padding: 10px; color: var(--text-secondary);">${u.cardId} (${u.phone})</td>
                  <td style="padding: 10px; font-family: var(--font-display); color: var(--neon-gold);">
                    💵 ${u.cashCredits || 0} | 🌟 ${u.bonusCredits || 0}
                  </td>
                  <td style="padding: 10px;"><span class="neon-badge badge-gold" style="font-size: 0.7rem;">${u.vipTier || 'Standard'}</span></td>
                  <td style="padding: 10px;">
                    <span class="neon-badge ${u.hasFreePass ? 'badge-emerald' : 'badge-cyan'}" style="font-size: 0.7rem;">
                      ${u.hasFreePass ? '🌟 100% FREE PASS' : 'Standard Play'}
                    </span>
                  </td>
                  <td style="padding: 10px;">
                    <button class="btn-glass" style="padding: 4px 10px; font-size: 0.75rem;" onclick="window.parkApp.quickApproveUser('${u.email || u.phone}')">
                      ⚡ Recharge +100
                    </button>
                  </td>
                </tr>
              `).join('') : `<tr><td colspan="7" style="padding: 12px; color: var(--text-muted);">No users found.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  async handleAdminLogin(e) {
    e.preventDefault();
    const username = document.getElementById('admin-user-input').value;
    const pin = document.getElementById('admin-pin-input').value;

    try {
      const res = await fetch(`${this.apiBase}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pin })
      });
      const data = await res.json();
      if (res.ok) {
        this.isAdmin = true;
        if (window.parkAudio) window.parkAudio.playWinFanfare();
        alert("🛡️ Admin Master Access Unlocked! Welcome to Command Portal.");
        this.render();
      } else {
        alert(data.error || "Invalid Admin Credentials.");
      }
    } catch (err) {
      if (pin === "9988" || pin === "1234") {
        this.isAdmin = true;
        alert("🛡️ Admin Master Access Unlocked (Offline Mode)!");
        this.render();
      } else {
        alert("Invalid PIN. Default Master PIN is 9988.");
      }
    }
  }

  adminLogout() {
    this.isAdmin = false;
    alert("Logged out of Admin Portal.");
    this.setActiveTab('park');
  }

  async handleEmailApproval(e) {
    e.preventDefault();
    const email = document.getElementById('email-approve-input').value;
    const pkgId = document.getElementById('email-approve-pkg').value;

    const hasFreePass = pkgId === 'freepass_only';

    try {
      const res = await fetch(`${this.apiBase}/api/admin/approve-by-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, packageId: pkgId, hasFreePass })
      });
      const data = await res.json();
      if (res.ok) {
        if (window.parkAudio) window.parkAudio.playWinFanfare();
        alert(data.message);
        this.render();
      } else {
        alert(data.error || "Email approval failed.");
      }
    } catch (err) {
      alert(`Offline simulation: Approved account for ${email}!`);
      this.render();
    }
  }

  async quickApproveUser(emailOrPhone) {
    try {
      const res = await fetch(`${this.apiBase}/api/admin/approve-by-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailOrPhone, cashCredits: 100, bonusCredits: 50 })
      });
      const data = await res.json();
      alert(data.message || `Added credits to ${emailOrPhone}`);
      this.render();
    } catch (e) {
      alert(`Added credits to ${emailOrPhone}`);
      this.render();
    }
  }

  async handleAdminApprovePayment(paymentId) {
    try {
      const res = await fetch(`${this.apiBase}/api/admin/approve-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        if (window.parkAudio) window.parkAudio.playWinFanfare();
        this.render();
      } else {
        alert(data.error || "Approval failed.");
      }
    } catch (e) {
      alert("Offline simulation: Free pass approved!");
      this.render();
    }
  }

  async handleAdminRejectPayment(paymentId) {
    const reason = prompt("Enter rejection reason:", "Payment not received in account.");
    if (!reason) return;
    try {
      const res = await fetch(`${this.apiBase}/api/admin/reject-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, reason })
      });
      const data = await res.json();
      alert(data.message || "Payment rejected.");
      this.render();
    } catch (e) {
      alert("Offline simulation: Payment rejected.");
      this.render();
    }
  }

  async handleAdminApproveCertificate(certificateId) {
    try {
      const res = await fetch(`${this.apiBase}/api/admin/approve-certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateId })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        if (window.parkAudio) window.parkAudio.playWinFanfare();
        this.render();
      }
    } catch (e) {
      alert("Offline simulation: Free pass approved!");
      this.render();
    }
  }

  // -------------------------------------------------------------
  // MODALS: TOPUP, FREE PASS, AUTH, GAME ARENA
  // -------------------------------------------------------------

  openTopupModal(selectedPkgId = 'pkg_starter') {
    if (window.parkAudio) window.parkAudio.playCoinSound();
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return;

    modalRoot.innerHTML = `
      <div class="modal-backdrop" id="topup-modal">
        <div class="modal-container" style="padding: 28px; max-width: 780px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <span class="neon-badge badge-gold">💳 CARD RECHARGE & TOP-UP</span>
              <h3 style="font-family: var(--font-display); font-size: 1.4rem; color: #ffffff; margin-top: 4px;">
                PURCHASE ADVENTURE CREDITS & PACKAGES
              </h3>
            </div>
            <button class="btn-glass" onclick="window.parkApp.closeModal()" style="font-size: 1.2rem; padding: 6px 12px;">✕</button>
          </div>

          <!-- Official Payment & WhatsApp Proof Box -->
          <div style="background: linear-gradient(135deg, rgba(0, 240, 255, 0.12), rgba(157, 78, 221, 0.15)); border: 1px solid rgba(0, 240, 255, 0.4); border-radius: 14px; padding: 18px; margin-bottom: 24px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
              <div>
                <div style="font-size: 0.75rem; color: var(--neon-cyan); font-weight: 700; text-transform: uppercase;">1. JazzCash Mobile Account</div>
                <div style="font-family: var(--font-display); font-size: 1.2rem; color: #ffffff; font-weight: 800; margin-top: 2px;">
                  +923211808390
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">Account Title: SYED Usama Tanveer</div>
              </div>

              <div>
                <div style="font-size: 0.75rem; color: var(--neon-gold); font-weight: 700; text-transform: uppercase;">2. Bank IBAN Account Transfer</div>
                <div style="font-family: var(--font-display); font-size: 0.95rem; color: #ffffff; font-weight: 800; margin-top: 2px; word-break: break-all;">
                  PK49ABPA0010083355410015
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">Bank: Allied Bank / Islamic | Title: SYED Usama Tanveer</div>
              </div>
            </div>

            <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between;">
              <span style="font-size: 0.82rem; color: var(--neon-emerald); font-weight: 600;">
                💬 Send Payment Screenshot Proof to WhatsApp:
              </span>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <a href="https://wa.me/97332377688" target="_blank" class="btn-neon" style="font-size: 0.8rem; padding: 6px 14px; text-decoration: none;">
                  📲 WhatsApp #1 (+97332377688)
                </a>
                <a href="https://wa.me/923211808390" target="_blank" class="btn-emerald" style="font-size: 0.8rem; padding: 6px 14px; text-decoration: none;">
                  📲 WhatsApp #2 (+923211808390)
                </a>
              </div>
            </div>
          </div>

          <!-- Submit Proof Form -->
          <form onsubmit="window.parkApp.submitPaymentProof(event)" style="display: flex; flex-direction: column; gap: 14px;">
            <input type="hidden" id="topup-pkg-id" value="${selectedPkgId}">
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;">
              <div>
                <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Sender Account / Mobile No:</label>
                <input type="text" id="topup-sender" required placeholder="e.g. 03211808390" value="${this.currentUser ? this.currentUser.phone : ''}" style="width: 100%; background: #070a18; border: 1px solid var(--border-glass); border-radius: 8px; padding: 10px; color: #fff;">
              </div>

              <div>
                <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Transaction ID / Ref No:</label>
                <input type="text" id="topup-txnid" required placeholder="e.g. JC-998841" value="JC-${Math.floor(100000 + Math.random() * 900000)}" style="width: 100%; background: #070a18; border: 1px solid var(--border-glass); border-radius: 8px; padding: 10px; color: #fff;">
              </div>
            </div>

            <div>
              <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Payment Screenshot Image URL / Note:</label>
              <input type="url" id="topup-screenshot" required value="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=60" style="width: 100%; background: #070a18; border: 1px solid var(--border-glass); border-radius: 8px; padding: 10px; color: #fff;">
            </div>

            <button type="submit" class="btn-neon" style="padding: 14px; font-size: 1rem; margin-top: 8px;">
              🚀 SUBMIT RECEIPT & OPEN 1-CLICK WHATSAPP VERIFICATION
            </button>
          </form>
        </div>
      </div>
    `;
  }

  selectTopupPackage(pkgId) {
    const input = document.getElementById('topup-pkg-id');
    if (input) input.value = pkgId;
    this.packages.forEach(p => {
      const el = document.getElementById(`pkg-card-${p.id}`);
      if (el) {
        el.style.borderColor = p.id === pkgId ? 'var(--neon-cyan)' : 'var(--border-glass)';
        el.style.background = p.id === pkgId ? 'rgba(0, 240, 255, 0.12)' : 'var(--bg-card)';
      }
    });
  }

  async submitPaymentProof(e) {
    e.preventDefault();
    const pkgId = 'pkg_all_access_100';
    const sender = document.getElementById('topup-sender').value;
    const txnId = document.getElementById('topup-txnid').value;
    const screenshot = document.getElementById('topup-screenshot').value;

    if (!this.currentUser) {
      alert("Please login first to attach payment to your card.");
      this.openAuthModal();
      return;
    }

    try {
      const res = await fetch(`${this.apiBase}/api/payments/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.currentUser.id,
          cardId: this.currentUser.cardId,
          packageId: pkgId,
          senderAccount: sender,
          transactionId: txnId,
          screenshotUrl: screenshot
        })
      });

      const data = await res.json();
      this.closeModal();

      // Open WhatsApp Link pre-filled with receipt verification
      if (data.whatsAppLinks && data.whatsAppLinks.primary) {
        window.open(data.whatsAppLinks.primary, '_blank');
      }

      alert("🎉 Receipt submitted successfully! Admin will verify and activate your credits.\nWhatsApp chat has been opened to send your screenshot to +97332377688 / +923211808390!");
      this.render();
    } catch (err) {
      this.closeModal();
      window.open(`https://wa.me/97332377688?text=Adventure%20Park%20Payment%20Proof%20from%20${encodeURIComponent(this.currentUser.name)}%20(${encodeURIComponent(this.currentUser.email || '')})`, '_blank');
      alert("🎉 Receipt submitted! Please send your screenshot on WhatsApp.");
      this.render();
    }
  }

  openFreePassModal() {
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return;

    modalRoot.innerHTML = `
      <div class="modal-backdrop" id="freepass-modal">
        <div class="modal-container" style="padding: 28px; max-width: 600px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <span class="neon-badge badge-emerald">📜 100% FREE PASS</span>
              <h3 style="font-family: var(--font-display); font-size: 1.3rem; color: #ffffff; margin-top: 4px;">
                SUBMIT CERTIFICATE / PROOF FOR FREE PASS
              </h3>
            </div>
            <button class="btn-glass" onclick="window.parkApp.closeModal()" style="font-size: 1.2rem; padding: 6px 12px;">✕</button>
          </div>

          <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5; margin-bottom: 18px;">
            Customers eligible for student recreational welfare or hardship waivers can upload their proof/certificate. Admin will verify on WhatsApp (+923211808390) and unlock 100% Free Game Play!
          </p>

          <form onsubmit="window.parkApp.submitFreePassCert(event)" style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Certificate / Student ID / Proof Link:</label>
              <input type="url" id="cert-url" required value="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=60" style="width: 100%; background: #070a18; border: 1px solid var(--border-glass); border-radius: 8px; padding: 10px; color: #fff;">
            </div>

            <div>
              <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Reason / Request Details:</label>
              <textarea id="cert-reason" rows="3" required placeholder="e.g. Student recreational recreational pass request for science & park games." style="width: 100%; background: #070a18; border: 1px solid var(--border-glass); border-radius: 8px; padding: 10px; color: #fff;"></textarea>
            </div>

            <button type="submit" class="btn-emerald" style="padding: 14px; font-size: 1rem;">
              🌟 SUBMIT FOR 100% FREE PASS APPROVAL
            </button>
          </form>
        </div>
      </div>
    `;
  }

  async submitFreePassCert(e) {
    e.preventDefault();
    const docUrl = document.getElementById('cert-url').value;
    const reason = document.getElementById('cert-reason').value;

    try {
      const res = await fetch(`${this.apiBase}/api/free-pass/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.currentUser.id,
          cardId: this.currentUser.cardId,
          documentUrl: docUrl,
          reason
        })
      });
      const data = await res.json();
      this.closeModal();
      if (data.whatsAppLink) window.open(data.whatsAppLink, '_blank');
      alert("Certificate submitted! Admin will verify and unlock your Free Pass.");
      this.render();
    } catch (e) {
      this.closeModal();
      alert("Offline simulation: Certificate submitted!");
    }
  }

  openAuthModal() {
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return;

    modalRoot.innerHTML = `
      <div class="modal-backdrop" id="auth-modal">
        <div class="modal-container" style="padding: 28px; max-width: 500px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <span class="neon-badge badge-cyan">🎫 PARK VISITOR ENTRY</span>
              <h3 style="font-family: var(--font-display); font-size: 1.35rem; color: #ffffff; margin-top: 4px;">
                LOGIN / REGISTER SMART CARD
              </h3>
            </div>
            <button class="btn-glass" onclick="window.parkApp.closeModal()" style="font-size: 1.2rem; padding: 6px 12px;">✕</button>
          </div>

          <div style="background: rgba(0, 240, 255, 0.08); border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 12px; padding: 12px 16px; margin-bottom: 18px; font-size: 0.85rem; color: #ffffff; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.6rem;">🎁</span>
            <div>
              <strong style="color: var(--neon-gold);">FIRST STAGES ARE 100% FREE!</strong>
              <div style="color: var(--text-secondary); font-size: 0.78rem;">Register now to get 100 Free Game Credits & your Digital NFC Card immediately.</div>
            </div>
          </div>

          <form onsubmit="window.parkApp.handleAuthSubmit(event)" style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Visitor Full Name:</label>
              <input type="text" id="auth-name" required placeholder="e.g. Syed Usama Tanveer" value="${this.currentUser ? this.currentUser.name : 'Syed Usama Tanveer'}" style="width: 100%; background: #070a18; border: 1px solid var(--border-glass); border-radius: 8px; padding: 10px; color: #fff;">
            </div>

            <div>
              <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Email Address (Required for WhatsApp & Admin Verification):</label>
              <input type="email" id="auth-email" required placeholder="e.g. player@adventurepark.com" value="${this.currentUser && this.currentUser.email ? this.currentUser.email : 'player@park.com'}" style="width: 100%; background: #070a18; border: 1px solid var(--border-glass); border-radius: 8px; padding: 10px; color: #fff;">
            </div>

            <div>
              <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Phone Number (WhatsApp):</label>
              <input type="text" id="auth-phone" required placeholder="e.g. +923211808390" value="${this.currentUser ? this.currentUser.phone : '+923211808390'}" style="width: 100%; background: #070a18; border: 1px solid var(--border-glass); border-radius: 8px; padding: 10px; color: #fff;">
            </div>

            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <input type="checkbox" id="auth-remember" checked>
              <label for="auth-remember" style="font-size: 0.8rem; color: var(--text-secondary);">Remember me on this device</label>
            </div>

            <button type="submit" class="btn-neon" style="padding: 14px; font-size: 1rem; margin-top: 6px;">
              ✨ ENTER PARK & ACTIVATE 100 FREE CREDITS
            </button>
          </form>
        </div>
      </div>
    `;
  }

  async handleAuthSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('auth-name').value;
    const email = document.getElementById('auth-email').value;
    const phone = document.getElementById('auth-phone').value;

    try {
      const res = await fetch(`${this.apiBase}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        this.currentUser = data.user;
        this.saveLocalUser();
        this.closeModal();
        if (window.parkAudio) window.parkAudio.playWinFanfare();
        alert(`🎉 Welcome to Galaxy Adventure Park, ${this.currentUser.name}!\n\n💳 Card ID: ${this.currentUser.cardId}\n📧 Email: ${this.currentUser.email}\n💵 Welcome Balance: ${this.currentUser.cashCredits || 60} Cash + ${this.currentUser.bonusCredits || 40} Bonus Credits!\n\nAll Stage 1 games are 100% FREE! Enjoy playing.`);
        this.render();
        return;
      }
    } catch (e) {}

    // Offline fallback user creation
    this.currentUser = {
      id: "usr_" + Date.now(),
      name,
      email: email || `${phone.replace(/\D/g, '')}@park.com`,
      phone,
      cardId: `PK-ADV-${Math.floor(1000 + Math.random() * 9000)}`,
      cashCredits: 100,
      bonusCredits: 50,
      tickets: 100,
      vipTier: "VIP Gold",
      hasFreePass: false,
      history: []
    };
    this.saveLocalUser();
    this.closeModal();
    this.render();
  }

  openManualCreditModal() {
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return;

    modalRoot.innerHTML = `
      <div class="modal-backdrop" id="manual-credit-modal">
        <div class="modal-container" style="padding: 28px; max-width: 500px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="font-family: var(--font-display); font-size: 1.3rem; color: #ffffff;">
              🛠️ MANUAL CARD CREDIT INJECTOR
            </h3>
            <button class="btn-glass" onclick="window.parkApp.closeModal()" style="font-size: 1.2rem; padding: 6px 12px;">✕</button>
          </div>

          <form onsubmit="window.parkApp.submitManualCredit(event)" style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Target Card ID:</label>
              <input type="text" id="man-card" required value="${this.currentUser ? this.currentUser.cardId : 'PK-ADV-8899'}" style="width: 100%; background: #070a18; border: 1px solid var(--border-glass); border-radius: 8px; padding: 10px; color: #fff;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Cash Credits:</label>
                <input type="number" id="man-cash" value="300" style="width: 100%; background: #070a18; border: 1px solid var(--border-glass); border-radius: 8px; padding: 10px; color: #fff;">
              </div>
              <div>
                <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Bonus Credits:</label>
                <input type="number" id="man-bonus" value="150" style="width: 100%; background: #070a18; border: 1px solid var(--border-glass); border-radius: 8px; padding: 10px; color: #fff;">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Arcade Tickets:</label>
                <input type="number" id="man-tickets" value="500" style="width: 100%; background: #070a18; border: 1px solid var(--border-glass); border-radius: 8px; padding: 10px; color: #fff;">
              </div>
              <div>
                <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Free Pass (100% Free):</label>
                <select id="man-freepass" style="width: 100%; background: #070a18; border: 1px solid var(--border-glass); border-radius: 8px; padding: 10px; color: #fff;">
                  <option value="false">Standard Card</option>
                  <option value="true">Active 100% Free Pass</option>
                </select>
              </div>
            </div>

            <button type="submit" class="btn-emerald" style="padding: 14px; font-size: 1rem; margin-top: 6px;">
              💾 APPLY CARD ADJUSTMENT
            </button>
          </form>
        </div>
      </div>
    `;
  }

  async submitManualCredit(e) {
    e.preventDefault();
    const cardId = document.getElementById('man-card').value;
    const cashCredits = document.getElementById('man-cash').value;
    const bonusCredits = document.getElementById('man-bonus').value;
    const tickets = document.getElementById('man-tickets').value;
    const hasFreePass = document.getElementById('man-freepass').value === 'true';

    try {
      const res = await fetch(`${this.apiBase}/api/admin/manual-adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, cashCredits, bonusCredits, tickets, hasFreePass })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        if (this.currentUser && this.currentUser.cardId === cardId) {
          this.currentUser = data.user;
          this.saveLocalUser();
        }
      }
    } catch (e) {
      if (this.currentUser) {
        this.currentUser.cashCredits = Number(cashCredits);
        this.currentUser.bonusCredits = Number(bonusCredits);
        this.currentUser.tickets = Number(tickets);
        this.currentUser.hasFreePass = hasFreePass;
        this.saveLocalUser();
      }
    }

    this.closeModal();
    this.render();
  }

  // -------------------------------------------------------------
  // GAME ARENA MODAL & ENGINE MOUNTING
  // -------------------------------------------------------------

  launchGameModal(game) {
    if (game.url) {
      window.open(game.url, '_blank');
      return;
    }
    
    // Check first launch per game
    const helpKey = 'helpSeen_' + game.id;
    if (!localStorage.getItem(helpKey)) {
      this.openHelpModal(game);
      localStorage.setItem(helpKey, 'true');
      return;
    }

    this.activeGame = game;
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return;

    modalRoot.innerHTML = `
      <div class="modal-backdrop" id="game-modal" style="padding: 10px; z-index: 2000;">
        <div class="modal-container" style="max-width: 960px; height: 92vh; display: flex; flex-direction: column; overflow: hidden; border: 2px solid var(--neon-cyan);">
          
          <!-- Game Header -->
          <div style="background: #080c1e; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-glass);">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.6rem;">${game.icon}</span>
              <div>
                <h3 style="font-family: var(--font-display); font-size: 1.15rem; color: #ffffff;">${game.title}</h3>
                <span class="neon-badge badge-gold" style="font-size: 0.65rem;">EARN TICKETS FOR BEYBLADES & YO-YOS!</span>
              </div>
            </div>
            <button class="btn-glass" onclick="window.parkApp.closeGameModal()" style="font-size: 1.2rem; padding: 6px 12px;">✕</button>
          </div>

          <!-- Interactive Arcade Canvas Wrapper -->
          <div class="arcade-screen-wrapper" style="flex-grow: 1; position: relative; display: flex; align-items: center; justify-content: center; background: #000;">
            <canvas id="active-game-canvas" width="854" height="480" style="width: 100%; height: 100%; object-fit: contain;"></canvas>

            <!-- Victory Celebration Overlay (Hidden until game over) -->
            <div id="game-victory-overlay" style="display: none; position: absolute; inset: 0; z-index: 30; align-items: center; justify-content: center; backdrop-filter: blur(8px);"></div>
          </div>

          <!-- Mobile Touch Action Bar -->
          <div style="background: #080c1e; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-glass); flex-wrap: wrap; gap: 10px;">
            <div style="font-size: 0.8rem; color: var(--text-secondary);">
              Controls: Touch screen or use Arrow Keys / Spacebar
            </div>
            <div style="display: flex; gap: 10px;">
              <button class="btn-glass" style="font-size: 0.85rem; padding: 8px 16px;" onclick="if(window.parkApp.currentGameSession && window.parkApp.currentGameSession.reload) window.parkApp.currentGameSession.reload();">
                🔄 RELOAD / ACTION
              </button>
              <button class="btn-neon" style="font-size: 0.85rem; padding: 8px 16px;" onclick="window.parkApp.closeGameModal()">
                EXIT TO PARK
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    // Initialize the specific game engine
    setTimeout(() => {
      const fnName = game.initFn;
      if (typeof window[fnName] === 'function') {
        this.currentGameSession = window[fnName]('active-game-canvas', (result) => {
          this.handleGameOverResult(game, result);
        });
      }
    }, 150);
  }

  closeGameModal() {
    if (this.currentGameSession && typeof this.currentGameSession.destroy === 'function') {
      this.currentGameSession.destroy();
      this.currentGameSession = null;
    }
    this.closeModal();
    this.render();
  }

  closeModal() {
    const modalRoot = document.getElementById('modal-root');
    if (modalRoot) modalRoot.innerHTML = '';
  }

  // Open Help Modal for a specific game
  openHelpModal(game) {
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return;
    modalRoot.innerHTML = `
      <div class="modal-backdrop" id="help-modal">
        <div class="modal-container" style="padding: 28px; max-width: 500px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <span class="neon-badge badge-cyan">🎮 CONTROLS GUIDE</span>
              <h3 style="font-family: var(--font-display); font-size: 1.3rem; color: #ffffff; margin-top: 4px;">
                ${game.title} Controls
              </h3>
            </div>
            <button class="btn-glass" onclick="window.parkApp.closeHelpModal()" style="font-size: 1.2rem; padding: 6px 12px;">✕</button>
          </div>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">
            Use Arrow Keys / Spacebar on desktop or touch gestures on mobile to play. Tap the screen to jump, swipe to dodge, and hold for power‑up.
          </p>
          <button class="btn-neon" onclick="window.parkApp.closeHelpModal(); window.parkApp.launchGameModal(${JSON.stringify({title: '${game.title}', icon: '${game.icon}', id: '${game.id}', initFn: '${game.initFn}'}).replace(/\\"/g, '\\u0022')});" style="margin-top: 12px;">▶️ PLAY NOW</button>
        </div>
      </div>
    `;
  }

  // Close Help Modal
  closeHelpModal() {
    const modalRoot = document.getElementById('modal-root');
    if (modalRoot) modalRoot.innerHTML = '';
  }
}

// Global App Mount
window.addEventListener('DOMContentLoaded', () => {
  window.parkApp = new AdventureParkApp();
});
