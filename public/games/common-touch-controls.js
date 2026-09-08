/**
 * UNIVERSAL 3D ARCADE MOBILE TOUCH & GESTURE CONTROLLER
 * Full touch drag, dynamic swipe gestures, responsive camera framing, zero-clutter HUD.
 */

(function () {
  'use strict';

  // Prevent default pull-to-refresh, zooming, and rubber banding
  document.addEventListener('touchmove', function (e) {
    if (e.target.closest('#controls-modal') || e.target.closest('#main-menu') || e.target.closest('#result-modal')) {
      return;
    }
    e.preventDefault();
  }, { passive: false });

  class UniversalTouchController {
    constructor() {
      this.touchStartX = 0;
      this.touchStartY = 0;
      this.touchLastX = 0;
      this.touchLastY = 0;
      this.touchStartTime = 0;
      this.isTouching = false;
      this.activeTouchId = null;

      this.callbacks = {
        steer: null,
        action1: null,
        action2: null,
        jump: null,
        swing: null
      };

      this.init();
    }

    init() {
      // Remove any lingering legacy arrow pads
      this.removeLegacyArrows();

      // Setup touch gestures
      window.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
      window.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
      window.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
      window.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });

      // Create floating controls toggle button & modal
      this.injectControlsToggle();
    }

    removeLegacyArrows() {
      const idsToRemove = ['mobile-pad', 'bottom-hud'];
      idsToRemove.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
      document.querySelectorAll('.dpad-btn, .dpad-row').forEach(el => el.remove());
    }

    handleTouchStart(e) {
      if (e.target.closest('#main-menu') || e.target.closest('#result-modal') || e.target.closest('#controls-modal') || e.target.closest('.modal-card')) {
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

      // Tap on right half can trigger primary action directly
      if (touch.clientX > window.innerWidth * 0.65) {
        if (this.callbacks.action1) this.callbacks.action1();
      }
    }

    handleTouchMove(e) {
      if (!this.isTouching) return;
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

      if (this.callbacks.steer) {
        this.callbacks.steer(dx, dy);
      }

      this.touchLastX = touch.clientX;
      this.touchLastY = touch.clientY;
      e.preventDefault();
    }

    handleTouchEnd(e) {
      if (!this.isTouching) return;
      this.isTouching = false;

      const duration = Date.now() - this.touchStartTime;
      const totalDx = this.touchLastX - this.touchStartX;
      const totalDy = this.touchLastY - this.touchStartY;

      // Quick tap on left side: jump / action
      if (duration < 220 && Math.abs(totalDx) < 16 && Math.abs(totalDy) < 16) {
        if (this.callbacks.jump) this.callbacks.jump();
      }
      // Swipe Up: Jump / Zip / Boost
      else if (totalDy < -45 && Math.abs(totalDy) > Math.abs(totalDx) * 1.2) {
        if (this.callbacks.jump) this.callbacks.jump();
      }
      // Swipe Down: Swing / Slide / Dive
      else if (totalDy > 45 && Math.abs(totalDy) > Math.abs(totalDx) * 1.2) {
        if (this.callbacks.swing) this.callbacks.swing();
      }
    }

    injectControlsToggle() {
      if (document.getElementById('btn-controls-toggle')) return;

      // Sleek top-right controls button
      const toggleBtn = document.createElement('button');
      toggleBtn.id = 'btn-controls-toggle';
      toggleBtn.innerHTML = '🎮 <span class="hide-mobile">Controls</span>';
      toggleBtn.title = 'View Controls';
      toggleBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 14px;
        z-index: 300;
        background: rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #fff;
        padding: 6px 14px;
        border-radius: 20px;
        font-family: inherit;
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.4);
        transition: all 0.2s ease;
      `;
      toggleBtn.onclick = () => this.toggleControlsModal();
      document.body.appendChild(toggleBtn);

      // Controls Modal (Hidden by default, easy to display and hide)
      const modal = document.createElement('div');
      modal.id = 'controls-modal';
      modal.style.cssText = `
        display: none;
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(14px);
        align-items: center;
        justify-content: center;
        padding: 16px;
      `;
      modal.innerHTML = `
        <div style="background: linear-gradient(145deg, #0d1527, #060913); border: 2px solid rgba(0, 240, 255, 0.5); border-radius: 24px; padding: 28px; max-width: 480px; width: 100%; box-shadow: 0 20px 60px rgba(0, 240, 255, 0.25); text-align: center; color: #fff;">
          <div style="font-size: 2.2rem; margin-bottom: 6px;">🎮</div>
          <h2 style="font-family: 'Orbitron', sans-serif; font-size: 1.4rem; color: #00f0ff; margin-bottom: 16px;">GAME CONTROLS</h2>
          
          <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 14px; text-align: left; margin-bottom: 14px;">
            <div style="font-weight: 800; color: #ffd60a; margin-bottom: 6px; font-size: 0.9rem;">📱 MOBILE CONTROLS</div>
            <p style="font-size: 0.82rem; color: #cbd5e1; line-height: 1.6;">
              • <strong>Drag Finger Left / Right</strong>: Steer & Move Hero<br>
              • <strong>Swipe Up</strong>: Jump / Web Zip / Boost Flight<br>
              • <strong>Swipe Down</strong>: Swing / Slide / Dive<br>
              • <strong>Tap Right Screen / Action Buttons</strong>: Primary Attack / Power
            </p>
          </div>

          <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 14px; text-align: left; margin-bottom: 20px;">
            <div style="font-weight: 800; color: #38bdf8; margin-bottom: 6px; font-size: 0.9rem;">💻 DESKTOP CONTROLS</div>
            <p style="font-size: 0.82rem; color: #cbd5e1; line-height: 1.6;">
              • <strong>A / D or Left / Right Arrows</strong>: Steer<br>
              • <strong>Spacebar</strong>: Jump / Zip<br>
              • <strong>Q / Left Click</strong>: Web Swing / Special<br>
              • <strong>E</strong>: Net / Shoot / Attack
            </p>
          </div>

          <button onclick="window.arcadeTouchController.toggleControlsModal()" style="width: 100%; padding: 14px; border-radius: 14px; border: none; background: linear-gradient(135deg, #00f0ff, #0284c7); color: #000; font-family: 'Orbitron', sans-serif; font-size: 0.95rem; font-weight: 800; cursor: pointer; box-shadow: 0 0 25px rgba(0, 240, 255, 0.5);">
            GOT IT (CLOSE)
          </button>
        </div>
      `;
      document.body.appendChild(modal);
    }

    toggleControlsModal() {
      const modal = document.getElementById('controls-modal');
      if (modal) {
        modal.style.display = (modal.style.display === 'flex') ? 'none' : 'flex';
      }
    }

    createMobileActionCluster(config) {
      if (document.getElementById('mobile-action-cluster')) return;

      const cluster = document.createElement('div');
      cluster.id = 'mobile-action-cluster';
      cluster.style.cssText = `
        position: absolute;
        bottom: 20px;
        right: 16px;
        z-index: 150;
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: center;
        pointer-events: all;
      `;

      if (config.primary) {
        const btn1 = document.createElement('button');
        btn1.innerHTML = config.primary.icon || '⚡';
        btn1.style.cssText = `
          width: 58px;
          height: 58px;
          border-radius: 50%;
          border: 2px solid ${config.primary.color || '#00f0ff'};
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(8px);
          font-size: 1.5rem;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px ${config.primary.color || 'rgba(0,240,255,0.4)'};
          transition: transform 0.1s;
        `;
        btn1.addEventListener('touchstart', (e) => {
          e.stopPropagation();
          btn1.style.transform = 'scale(0.9)';
          if (config.primary.action) config.primary.action();
        });
        btn1.addEventListener('touchend', (e) => {
          e.stopPropagation();
          btn1.style.transform = 'scale(1)';
        });
        btn1.addEventListener('click', (e) => {
          if (config.primary.action) config.primary.action();
        });
        cluster.appendChild(btn1);
      }

      if (config.secondary) {
        const btn2 = document.createElement('button');
        btn2.innerHTML = config.secondary.icon || '🕸️';
        btn2.style.cssText = `
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: 2px solid ${config.secondary.color || '#ffd60a'};
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(8px);
          font-size: 1.35rem;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 15px ${config.secondary.color || 'rgba(255,214,10,0.4)'};
          transition: transform 0.1s;
        `;
        btn2.addEventListener('touchstart', (e) => {
          e.stopPropagation();
          btn2.style.transform = 'scale(0.9)';
          if (config.secondary.action) config.secondary.action();
        });
        btn2.addEventListener('touchend', (e) => {
          e.stopPropagation();
          btn2.style.transform = 'scale(1)';
        });
        btn2.addEventListener('click', (e) => {
          if (config.secondary.action) config.secondary.action();
        });
        cluster.appendChild(btn2);
      }

      document.getElementById('game-container').appendChild(cluster);
    }
  }

  window.UniversalTouchController = UniversalTouchController;
  window.arcadeTouchController = new UniversalTouchController();
})();
