/**
 * UNIVERSAL 3D ARCADE MOBILE TOUCH & GESTURE CONTROLLER
 * Full touch drag, dynamic swipe gestures, ergonomic corner controls, zero-clutter HUD.
 * Hides clutter from center screen to keep the 3D player 100% visible.
 * Displays controls modal on game launch and tucks controls under a dedicated Controls tab.
 */

(function () {
  'use strict';

  // Helper to dispatch synthesized keyboard events so all games respond instantly
  function simulateKey(keyName, codeName, keyCodeNum) {
    try {
      const downEvt = new KeyboardEvent('keydown', {
        key: keyName,
        code: codeName,
        keyCode: keyCodeNum,
        which: keyCodeNum,
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(downEvt);

      setTimeout(() => {
        const upEvt = new KeyboardEvent('keyup', {
          key: keyName,
          code: codeName,
          keyCode: keyCodeNum,
          which: keyCodeNum,
          bubbles: true,
          cancelable: true
        });
        window.dispatchEvent(upEvt);
      }, 100);
    } catch (err) {
      console.warn('Keyboard simulation error:', err);
    }
  }

  class UniversalTouchController {
    constructor() {
      this.touchStartX = 0;
      this.touchStartY = 0;
      this.touchLastX = 0;
      this.touchLastY = 0;
      this.touchStartTime = 0;
      this.isTouching = false;
      this.activeTouchId = null;
      this.dragSteerThreshold = 10;

      this.callbacks = {
        steer: null,
        action1: null,
        action2: null,
        jump: null,
        swing: null,
        slide: null
      };

      this.init();
    }

    init() {
      // Clean up legacy intrusive elements that block view
      this.cleanIntrusiveElements();

      // Setup touch gestures on window & canvas
      window.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
      window.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
      window.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
      window.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });

      // Create floating Controls button & modal
      this.injectControlsToggle();

      // Create ergonomic corner touch controls for mobile/touch screens
      this.injectCornerTouchControls();

      // Auto-display controls on initial launch, then user hides under Controls tab
      setTimeout(() => {
        this.showControlsModalAtStart();
      }, 350);
    }

    cleanIntrusiveElements() {
      // Inject global stylesheet to permanently ensure clutter is hidden and player is unobstructed
      if (!document.getElementById('universal-no-clutter-style')) {
        const style = document.createElement('style');
        style.id = 'universal-no-clutter-style';
        style.textContent = `
          #ability-bar, .action-ability-bar, #mobile-pad, #touch-controls {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }
        `;
        document.head.appendChild(style);
      }

      // Hide or reposition center ability-bars so they never block the player
      const hideCenteredClutter = () => {
        const centerBars = document.querySelectorAll('#ability-bar, .action-ability-bar, #mobile-pad, #touch-controls');
        centerBars.forEach(bar => {
          bar.style.setProperty('display', 'none', 'important');
          bar.style.setProperty('visibility', 'hidden', 'important');
          bar.style.setProperty('pointer-events', 'none', 'important');
        });
      };

      hideCenteredClutter();
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hideCenteredClutter);
      }
      window.addEventListener('load', hideCenteredClutter);
      setInterval(hideCenteredClutter, 1000);
    }

    handleTouchStart(e) {
      if (e.target.closest('#main-menu') || e.target.closest('#result-modal') || 
          e.target.closest('#controls-modal') || e.target.closest('.modal-card') ||
          e.target.closest('.universal-touch-btn') || e.target.closest('#btn-controls-toggle')) {
        return;
      }

      const touch = e.touches[0];
      this.activeTouchId = touch.identifier;
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.touchLastX = touch.clientX;
      this.touchLastY = touch.clientY;
      this.touchStartTime = Date.now();
      this.isTouching = true;
    }

    handleTouchMove(e) {
      if (!this.isTouching) return;
      if (e.target.closest('#controls-modal') || e.target.closest('#main-menu') || e.target.closest('#result-modal')) {
        return;
      }
      e.preventDefault();

      let touch = null;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === this.activeTouchId) {
          touch = e.touches[i];
          break;
        }
      }
      if (!touch) touch = e.touches[0];

      const dx = touch.clientX - this.touchLastX;
      const dy = touch.clientY - this.touchLastY;

      // Handle steering via callback or key emulation
      if (this.callbacks.steer) {
        this.callbacks.steer(dx, dy);
      } else {
        if (dx < -this.dragSteerThreshold) {
          this.triggerSteerLeft();
        } else if (dx > this.dragSteerThreshold) {
          this.triggerSteerRight();
        }
      }

      this.touchLastX = touch.clientX;
      this.touchLastY = touch.clientY;
    }

    handleTouchEnd(e) {
      if (!this.isTouching) return;
      this.isTouching = false;

      const duration = Date.now() - this.touchStartTime;
      const totalDx = this.touchLastX - this.touchStartX;
      const totalDy = this.touchLastY - this.touchStartY;

      // Quick tap -> Primary action
      if (duration < 250 && Math.abs(totalDx) < 18 && Math.abs(totalDy) < 18) {
        this.triggerPrimaryAction();
      }
      // Swipe Up -> Jump / Boost
      else if (totalDy < -40 && Math.abs(totalDy) > Math.abs(totalDx) * 1.1) {
        this.triggerJump();
      }
      // Swipe Down -> Slide / Duck / Brake
      else if (totalDy > 40 && Math.abs(totalDy) > Math.abs(totalDx) * 1.1) {
        this.triggerSlide();
      }
    }

    triggerSteerLeft() {
      simulateKey('ArrowLeft', 'ArrowLeft', 37);
      simulateKey('a', 'KeyA', 65);
      if (typeof window.doAction === 'function') window.doAction('left');
      if (typeof window.targetX !== 'undefined') window.targetX = Math.max(-16, window.targetX - 2.5);
    }

    triggerSteerRight() {
      simulateKey('ArrowRight', 'ArrowRight', 39);
      simulateKey('d', 'KeyD', 68);
      if (typeof window.doAction === 'function') window.doAction('right');
      if (typeof window.targetX !== 'undefined') window.targetX = Math.min(16, window.targetX + 2.5);
    }

    triggerJump() {
      if (this.callbacks.jump) {
        this.callbacks.jump();
      } else {
        simulateKey('ArrowUp', 'ArrowUp', 38);
        simulateKey('w', 'KeyW', 87);
        simulateKey(' ', 'Space', 32);
        if (typeof window.doAction === 'function') window.doAction('jump');
        if (typeof window.triggerJump === 'function') window.triggerJump();
      }
    }

    triggerSlide() {
      if (this.callbacks.slide || this.callbacks.swing) {
        if (this.callbacks.slide) this.callbacks.slide();
        else this.callbacks.swing();
      } else {
        simulateKey('ArrowDown', 'ArrowDown', 40);
        simulateKey('s', 'KeyS', 83);
        if (typeof window.doAction === 'function') window.doAction('slide');
        if (typeof window.triggerSlide === 'function') window.triggerSlide();
      }
    }

    triggerPrimaryAction() {
      if (this.callbacks.action1) {
        this.callbacks.action1();
      } else {
        simulateKey(' ', 'Space', 32);
        simulateKey('e', 'KeyE', 69);
        simulateKey('k', 'KeyK', 75);
        if (typeof window.triggerAction === 'function') window.triggerAction();
        if (typeof window.shootWebNet === 'function') window.shootWebNet();
        if (typeof window.triggerButtDash === 'function') window.triggerButtDash();
        if (typeof window.triggerActionKamenBeam === 'function') window.triggerActionKamenBeam();
        if (typeof window.deploySpikeStrip === 'function') window.deploySpikeStrip();
      }
    }

    triggerSecondaryAction() {
      if (this.callbacks.action2) {
        this.callbacks.action2();
      } else {
        simulateKey('q', 'KeyQ', 81);
        simulateKey('b', 'KeyB', 66);
        simulateKey('m', 'KeyM', 77);
        if (typeof window.triggerBuriBuriZaimon === 'function') window.triggerBuriBuriZaimon();
        if (typeof window.triggerCallMom === 'function') window.triggerCallMom();
        if (typeof window.triggerCallDad === 'function') window.triggerCallDad();
        if (typeof window.deploySquadBlockade === 'function') window.deploySquadBlockade();
      }
    }

    injectControlsToggle() {
      if (document.getElementById('btn-controls-toggle')) return;

      const toggleBtn = document.createElement('button');
      toggleBtn.id = 'btn-controls-toggle';
      toggleBtn.innerHTML = '🎮 <span>CONTROLS</span>';
      toggleBtn.title = 'View Game Controls';
      toggleBtn.style.cssText = `
        position: fixed;
        top: 12px;
        right: 14px;
        z-index: 2500;
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.85));
        backdrop-filter: blur(12px);
        border: 1.5px solid #00f0ff;
        color: #00f0ff;
        padding: 8px 16px;
        border-radius: 24px;
        font-family: 'Orbitron', 'Chakra Petch', sans-serif;
        font-size: 0.82rem;
        font-weight: 800;
        letter-spacing: 1px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 0 16px rgba(0, 240, 255, 0.35);
        transition: all 0.2s ease;
      `;
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleControlsModal();
      });
      document.body.appendChild(toggleBtn);

      // Controls Modal Overlay
      const modal = document.createElement('div');
      modal.id = 'controls-modal';
      modal.style.cssText = `
        display: none;
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(4, 8, 20, 0.88);
        backdrop-filter: blur(16px);
        align-items: center;
        justify-content: center;
        padding: 16px;
      `;
      modal.innerHTML = `
        <div style="background: linear-gradient(145deg, #0b1329, #050814); border: 2px solid #00f0ff; border-radius: 24px; padding: 26px; max-width: 500px; width: 100%; box-shadow: 0 20px 60px rgba(0, 240, 255, 0.28); text-align: center; color: #fff; max-height: 90vh; overflow-y: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.6rem;">🎮</span>
              <h2 style="font-family: 'Orbitron', sans-serif; font-size: 1.15rem; color: #00f0ff; margin: 0; letter-spacing: 1px;">
                ${(document.title || 'GAME').replace(/[^\w\s:!'-]/g, '').trim()} CONTROLS
              </h2>
            </div>
            <button onclick="window.arcadeTouchController.toggleControlsModal()" style="background: transparent; border: none; color: #94a3b8; font-size: 1.4rem; cursor: pointer; padding: 4px 8px;">✕</button>
          </div>
          
          <div style="background: rgba(0, 240, 255, 0.06); border: 1px solid rgba(0, 240, 255, 0.2); border-radius: 14px; padding: 14px; text-align: left; margin-bottom: 12px;">
            <div style="font-weight: 800; color: #ffd60a; margin-bottom: 6px; font-size: 0.88rem; display: flex; align-items: center; gap: 6px;">
              📱 MOBILE TOUCH CONTROLS
            </div>
            <p style="font-size: 0.82rem; color: #e2e8f0; line-height: 1.65; margin: 0;">
              • <strong>On-Screen D-Pad (Bottom-Left)</strong>: Tap ⬅️ / ➡️ to steer.<br>
              • <strong>Action Buttons (Bottom-Right)</strong>: Tap ⬆️ Jump, ⚡ Action / Attack, 🍑 Slide.<br>
              • <strong>Full Touch Screen</strong>: Drag finger left/right to steer, swipe up to jump, swipe down to slide, tap to trigger abilities!
            </p>
          </div>

          <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 14px; text-align: left; margin-bottom: 12px;">
            <div style="font-weight: 800; color: #38bdf8; margin-bottom: 6px; font-size: 0.88rem; display: flex; align-items: center; gap: 6px;">
              💻 DESKTOP KEYBOARD CONTROLS
            </div>
            <p style="font-size: 0.82rem; color: #cbd5e1; line-height: 1.65; margin: 0;">
              • <strong>Arrow Keys or A / D</strong>: Steer Left / Right<br>
              • <strong>Spacebar or W / Up Arrow</strong>: Jump / Boost<br>
              • <strong>S or Down Arrow</strong>: Slide / Duck / Brake<br>
              • <strong>K / E / Space</strong>: Primary Attack / Kamen Beam / Net<br>
              • <strong>B / M / D</strong>: Special Abilities / Buri Buri / Mom & Dad
            </p>
          </div>

          <p style="font-size: 0.76rem; color: #94a3b8; margin-bottom: 18px;">
            ✨ The game screen is kept clean and unobstructed so you always have a crystal clear view of your player!
          </p>

          <button onclick="window.arcadeTouchController.toggleControlsModal()" style="width: 100%; padding: 14px; border-radius: 14px; border: none; background: linear-gradient(135deg, #00f0ff, #0284c7); color: #000; font-family: 'Orbitron', sans-serif; font-size: 0.95rem; font-weight: 900; cursor: pointer; letter-spacing: 1px; box-shadow: 0 0 25px rgba(0, 240, 255, 0.5);">
            🎮 GOT IT (START PLAYING)
          </button>
        </div>
      `;
      document.body.appendChild(modal);
    }

    showControlsModalAtStart() {
      const modal = document.getElementById('controls-modal');
      if (modal && !sessionStorage.getItem('controlsShown_' + window.location.pathname)) {
        modal.style.display = 'flex';
        sessionStorage.setItem('controlsShown_' + window.location.pathname, 'true');
      }
    }

    toggleControlsModal() {
      const modal = document.getElementById('controls-modal');
      if (modal) {
        modal.style.display = (modal.style.display === 'flex') ? 'none' : 'flex';
      }
    }

    injectCornerTouchControls() {
      if (document.getElementById('universal-touch-deck')) return;

      const deck = document.createElement('div');
      deck.id = 'universal-touch-deck';
      deck.style.cssText = `
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 1800;
      `;

      // Bottom-Left D-Pad Cluster (Steering)
      const leftPad = document.createElement('div');
      leftPad.className = 'universal-touch-cluster left-cluster';
      leftPad.style.cssText = `
        position: absolute;
        bottom: 22px;
        left: 18px;
        display: flex;
        gap: 12px;
        pointer-events: auto;
      `;

      const btnLeft = this.createTouchBtn('⬅️', '#00f0ff', () => this.triggerSteerLeft());
      const btnRight = this.createTouchBtn('➡️', '#00f0ff', () => this.triggerSteerRight());
      leftPad.appendChild(btnLeft);
      leftPad.appendChild(btnRight);

      // Bottom-Right Action Cluster (Jump, Slide, Action)
      const rightPad = document.createElement('div');
      rightPad.className = 'universal-touch-cluster right-cluster';
      rightPad.style.cssText = `
        position: absolute;
        bottom: 22px;
        right: 18px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        align-items: flex-end;
        pointer-events: auto;
      `;

      const actionRow1 = document.createElement('div');
      actionRow1.style.cssText = 'display: flex; gap: 10px;';
      const btnSlide = this.createTouchBtn('🍑', '#ff007f', () => this.triggerSlide(), '48px');
      const btnJump = this.createTouchBtn('⬆️', '#ffd60a', () => this.triggerJump(), '56px');
      actionRow1.appendChild(btnSlide);
      actionRow1.appendChild(btnJump);

      const actionRow2 = document.createElement('div');
      actionRow2.style.cssText = 'display: flex; gap: 10px;';
      const btnSpecial = this.createTouchBtn('🐷', '#f43f5e', () => this.triggerSecondaryAction(), '48px');
      const btnAction = this.createTouchBtn('⚡', '#10b981', () => this.triggerPrimaryAction(), '56px');
      actionRow2.appendChild(btnSpecial);
      actionRow2.appendChild(btnAction);

      rightPad.appendChild(actionRow1);
      rightPad.appendChild(actionRow2);

      deck.appendChild(leftPad);
      deck.appendChild(rightPad);
      document.body.appendChild(deck);
    }

    createTouchBtn(icon, glowColor, onTrigger, size = '52px') {
      const btn = document.createElement('button');
      btn.className = 'universal-touch-btn';
      btn.innerHTML = icon;
      btn.style.cssText = `
        width: ${size};
        height: ${size};
        border-radius: 50%;
        border: 2px solid ${glowColor};
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(10px);
        color: #fff;
        font-size: 1.35rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 16px ${glowColor}55;
        touch-action: none;
        user-select: none;
        transition: transform 0.1s ease, background 0.15s ease;
      `;

      const press = (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.style.transform = 'scale(0.9)';
        btn.style.background = 'rgba(255, 255, 255, 0.25)';
        onTrigger();
      };

      const release = (e) => {
        btn.style.transform = 'scale(1)';
        btn.style.background = 'rgba(15, 23, 42, 0.6)';
      };

      btn.addEventListener('touchstart', press, { passive: false });
      btn.addEventListener('touchend', release, { passive: false });
      btn.addEventListener('touchcancel', release, { passive: false });
      btn.addEventListener('mousedown', press);
      btn.addEventListener('mouseup', release);
      btn.addEventListener('mouseleave', release);

      return btn;
    }

    createMobileActionCluster(config) {
      // Retained for backward compatibility with spiderman / superman
      if (config.primary && config.primary.action) {
        this.callbacks.action1 = config.primary.action;
      }
      if (config.secondary && config.secondary.action) {
        this.callbacks.action2 = config.secondary.action;
      }
    }
  }

  window.UniversalTouchController = UniversalTouchController;
  window.arcadeTouchController = new UniversalTouchController();
})();
