// public/js/common-touch-controls.js
// Enables mobile touch controls across all games and provides a toggle for the control deck.

(function () {
  // Detect touch capability
  function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  // Show touch controls UI on mobile devices and hide desktop control deck
  function initTouchControls() {
    const touchControls = document.getElementById('touch-controls');
    const controlDeck = document.getElementById('hidden-controls') || document.querySelector('.control-deck');
    if (isTouchDevice()) {
      if (touchControls) touchControls.style.display = 'flex';
      if (controlDeck) controlDeck.style.display = 'none';
    }
  }

  // Bind touch buttons to game actions
  function bindTouchButtons() {
    const actionMap = ['jump', 'left', 'slide', 'right'];
    const tButtons = document.querySelectorAll('#touch-controls .tbtn');
    tButtons.forEach((btn, idx) => {
      const action = actionMap[idx];
      btn.addEventListener('click', () => {
        if (typeof window.doAction === 'function') {
          window.doAction(action);
        } else if (typeof window.handleAction === 'function') {
          window.handleAction(action);
        }
      });
    });
  }

  // Toggle hidden control deck visibility when SHOW CONTROLS button is clicked
  function bindControlToggle() {
    const toggleBtn = document.querySelector('.btn-real-secondary[onclick*="hidden-controls"]');
    const controlDeck = document.getElementById('hidden-controls') || document.querySelector('.control-deck');
    if (!toggleBtn || !controlDeck) return;
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isHidden = getComputedStyle(controlDeck).display === 'none';
      controlDeck.style.display = isHidden ? 'flex' : 'none';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTouchControls();
    bindTouchButtons();
    bindControlToggle();
  });
})();
