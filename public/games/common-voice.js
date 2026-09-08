/**
 * CARTOON & SUPERHERO REAL-WORLD VOICE SYNTHESIZER ENGINE
 * Real-time SpeechSynthesis + Animated Communicator HUD Banner
 */

(function() {
  const VOICE_CATALOG = {
    spiderman: {
      name: "SPIDER-MAN (Manhattan Web-Slinger)",
      avatar: "🕷️",
      color: "#ef4444",
      pitch: 1.25,
      rate: 1.1,
      lines: [
        "With great power comes great responsibility... and some awesome flips!",
        "Woohoo! No gravity means infinite web-swinging! This is awesome!",
        "My Spidey-Sense is tingling! Everyone dodge right now!",
        "Hey, kid! Put your pants back on! We’re trying to save the city here!",
        "Web-line anchored. Time to slingshot across Manhattan!",
        "You think you can outrun a web-shooter? Think again!",
        "Nice trick, kid. But can you do this?",
        "Sorry I'm late, folks! Traffic was crazy... mostly because cars are floating.",
        "Web-fluid levels at 20%. Need to find a reload crate!"
      ]
    },
    batman: {
      name: "BATMAN (Arkham Dark Knight)",
      avatar: "🦇",
      color: "#0f172a",
      pitch: 0.55,
      rate: 0.88,
      lines: [
        "I am vengeance. I am the night. I am Batman!",
        "The darkness is my ally. You can't hide from the Bat.",
        "Grapple hook secured. Zipping up to the rooftop ledge.",
        "Disengaging anti-gravity field. Dropping in hot from the shadows.",
        "Tactical scanners online. Pinpointing the enemy base coordinates.",
        "The Batmobile is inbound. Clear the streets.",
        "Smoke pellet deployed. Moving unseen.",
        "This city needs a better class of hero... or at least one who wears socks."
      ]
    },
    superman: {
      name: "SUPERMAN (Man of Steel)",
      avatar: "🦸‍♂️",
      color: "#2563eb",
      pitch: 0.75,
      rate: 0.95,
      lines: [
        "Metropolis is under my protection. Stand down, villain!",
        "Launching into high-altitude flight orbit. Mach 3 achieved.",
        "Firing Heat Vision! Melting down the incoming obstacles!",
        "There is a superhero inside all of us. You just have to find the courage.",
        "Activate Freeze Breath! Putting out the building fires!",
        "Hold on to my cape, Shin-chan! We’re going for a ride!",
        "Gravity or no gravity, justice will always prevail.",
        "I can hear a citizen crying for help from three miles away. I'm on it!"
      ]
    },
    sonic: {
      name: "SONIC THE HEDGEHOG",
      avatar: "🦔",
      color: "#3b82f6",
      pitch: 1.2,
      rate: 1.25,
      lines: [
        "Got places to go, gotta follow my rainbow! You're too slow!",
        "Spin Dash fully charged! Smashed right through the robot line!",
        "Chaos Emerald located! Sonic speed, GO!",
        "We're entering a high-speed loop-de-loop! Hold on tight!"
      ]
    },
    racer: {
      name: "STREET RACER (Shuto Express)",
      avatar: "🏎️",
      color: "#f59e0b",
      pitch: 1.0,
      rate: 1.1,
      lines: [
        "Hit the Nitrous Oxide! See ya in the rearview mirror!",
        "Perfect drift! Tires smoking, score multiplier active!",
        "The cops are setting up a perimeter. Take the tunnel shortcut!"
      ]
    },
    atc: {
      name: "FLIGHT COMMAND & ATC",
      avatar: "✈️",
      color: "#06b6d4",
      pitch: 0.9,
      rate: 1.0,
      lines: [
        "This is Air Traffic Control. Flight 702, you are clear for takeoff.",
        "Pull back on the flight stick! Lift the nose up, up, and away!",
        "Landing gear deployed. Smooth landing on Runway 4.",
        "Engine check complete. All systems green for supersonic flight."
      ]
    },
    chopper: {
      name: "RESCUE HELICOPTER COMMAND",
      avatar: "🚁",
      color: "#10b981",
      pitch: 0.95,
      rate: 1.05,
      lines: [
        "Hold the chopper steady! Deploying the rescue winch now!",
        "Altitude dropping! Engage the secondary rotor engines!"
      ]
    },
    police: {
      name: "POLICE DISPATCH OFFICERS",
      avatar: "🚓",
      color: "#3b82f6",
      pitch: 0.9,
      rate: 1.08,
      lines: [
        "All units, we have a Code 3 vehicle fleeing westbound. Set up roadblocks!",
        "Spike strips deployed! The thief's tires are completely blown!",
        "Suspect captured! Put the handcuffs on him. Good job, team!",
        "Target locked. The getaway car has nowhere left to run.",
        "He's drifting around the fountain! Block the exit lanes now!"
      ]
    },
    candy: {
      name: "PATISSERIE ROYALE CHEF",
      avatar: "🍬",
      color: "#ec4899",
      pitch: 1.3,
      rate: 1.15,
      lines: [
        "SWEET COMBO! Delicious blast triggered!",
        "JELLY CRUSH! 4-in-a-row match created a Column Blast!",
        "RAINBOW DONUT UNLOCKED! Clear all sweets of the same color!",
        "Warning: Only 5 moves left! Make them count!",
        "Collect 10 more donuts to unlock the ultimate sugar shockwave!"
      ]
    },
    shinchan: {
      name: "SHIN-CHAN NOHARA",
      avatar: "👦",
      color: "#f43f5e",
      pitch: 1.5,
      rate: 1.15,
      lines: [
        "Game Over! Insert coin or spend Chocobi cookies to continue!",
        "Ultimate Butt-Dash charged up! Watch out Mom, here I come!",
        "Hey! Put your pants back on! We're saving Kasukabe!"
      ]
    },
    korosuke: {
      name: "KOROSUKE KARAKURI ROBO",
      avatar: "🤖",
      color: "#eab308",
      pitch: 1.4,
      rate: 1.1,
      lines: [
        "Karakuri Katana Slash ready, Nari!",
        "Kiteretsu's gadget inventions are unstoppable, Nari!",
        "Watch out for the clockwork trap gears!"
      ]
    },
    bomberman: {
      name: "BOMBERMAN HERO",
      avatar: "💣",
      color: "#6366f1",
      pitch: 1.2,
      rate: 1.15,
      lines: [
        "Bomb fuse lit! Clear the explosion zone!",
        "Power Bomb upgrade collected! Massive radius blast!",
        "Rescuing hostages from the robot fortress!"
      ]
    },
    universal: {
      name: "ARCADE ANNOUNCER",
      avatar: "🏆",
      color: "#a855f7",
      pitch: 1.0,
      rate: 1.0,
      lines: [
        "LEVEL CLEAR! Three stars awarded! You are a master!"
      ]
    }
  };

  let communicatorEl = null;
  let synth = window.speechSynthesis || null;

  function initCommunicatorUI() {
    if (document.getElementById('real-voice-communicator')) return;

    const el = document.createElement('div');
    el.id = 'real-voice-communicator';
    el.style.cssText = `
      position: fixed;
      top: 75px;
      left: 50%;
      transform: translateX(-50%) translateY(-20px);
      background: rgba(10, 15, 30, 0.92);
      border: 1.5px solid rgba(0, 240, 255, 0.5);
      border-radius: 14px;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6), 0 0 20px rgba(0,240,255,0.25);
      backdrop-filter: blur(16px);
      z-index: 10000;
      opacity: 0;
      pointer-events: none;
      transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      max-width: 90vw;
      width: 540px;
      color: #fff;
      font-family: 'Inter', sans-serif;
    `;

    el.innerHTML = `
      <div id="comm-avatar" style="font-size: 26px; line-height: 1; filter: drop-shadow(0 0 6px rgba(0,240,255,0.8));">🕷️</div>
      <div style="flex: 1; min-width: 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
          <span id="comm-name" style="font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #00f0ff; text-transform: uppercase;">COMMUNICATOR</span>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;"></span>
            <span style="font-size: 9px; opacity: 0.7; font-family: monospace;">LIVE AUDIO</span>
          </div>
        </div>
        <div id="comm-text" style="font-size: 13px; font-weight: 600; line-height: 1.35; text-shadow: 0 1px 4px rgba(0,0,0,0.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"></div>
      </div>
      <div style="display: flex; gap: 2px; align-items: flex-end; height: 18px;">
        <div class="wave-bar" style="width: 3px; background: #00f0ff; height: 60%; animation: waveAnim 0.6s ease-in-out infinite alternate;"></div>
        <div class="wave-bar" style="width: 3px; background: #00f0ff; height: 100%; animation: waveAnim 0.8s ease-in-out infinite alternate 0.15s;"></div>
        <div class="wave-bar" style="width: 3px; background: #00f0ff; height: 40%; animation: waveAnim 0.5s ease-in-out infinite alternate 0.3s;"></div>
      </div>
    `;

    // Keyframes for waveform
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes waveAnim {
        0% { height: 20%; opacity: 0.4; }
        100% { height: 100%; opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(el);
    communicatorEl = el;
  }

  let hideTimer = null;

  window.speakCartoonLine = function(speakerKey, customTextOrIndex) {
    initCommunicatorUI();

    const config = VOICE_CATALOG[speakerKey] || VOICE_CATALOG.universal;
    let text = "";

    if (typeof customTextOrIndex === "string") {
      text = customTextOrIndex;
    } else if (typeof customTextOrIndex === "number" && config.lines[customTextOrIndex]) {
      text = config.lines[customTextOrIndex];
    } else {
      text = config.lines[Math.floor(Math.random() * config.lines.length)];
    }

    // Update Communicator UI
    const nameEl = document.getElementById('comm-name');
    const avatarEl = document.getElementById('comm-avatar');
    const textEl = document.getElementById('comm-text');

    if (nameEl) {
      nameEl.innerText = config.name;
      nameEl.style.color = config.color || '#00f0ff';
    }
    if (avatarEl) avatarEl.innerText = config.avatar;
    if (textEl) textEl.innerText = `"${text}"`;

    if (communicatorEl) {
      communicatorEl.style.opacity = '1';
      communicatorEl.style.transform = 'translateX(-50%) translateY(0)';
      communicatorEl.style.borderColor = config.color || 'rgba(0, 240, 255, 0.5)';
      communicatorEl.style.boxShadow = `0 10px 30px rgba(0,0,0,0.6), 0 0 20px ${config.color || '#00f0ff'}66`;
    }

    // Speech Synthesis
    if (synth) {
      try {
        synth.cancel(); // Cancel active speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = config.pitch || 1.0;
        utterance.rate = config.rate || 1.0;
        
        // Pick an English voice if available
        const voices = synth.getVoices();
        if (voices && voices.length > 0) {
          const engVoice = voices.find(v => v.lang.startsWith('en') && (speakerKey === 'batman' ? v.name.includes('Male') || v.name.includes('David') : true)) || voices[0];
          if (engVoice) utterance.voice = engVoice;
        }

        synth.speak(utterance);
      } catch (e) {
        console.warn("Speech Synthesis error:", e);
      }
    }

    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (communicatorEl) {
        communicatorEl.style.opacity = '0';
        communicatorEl.style.transform = 'translateX(-50%) translateY(-20px)';
      }
    }, 4500);
  };

  // Expose Catalog
  window.CARTOON_VOICE_CATALOG = VOICE_CATALOG;

})();
