/**
 * REAL CARTOON & SUPERHERO THEME SONG AUDIO SYNTHESIZER
 * Synthesizes iconic cartoon & superhero melody themes using Web Audio API
 */

(function() {
  let audioCtx = null;
  let currentTheme = null;
  let activeOscillators = [];
  let isMuted = false;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Note frequency helper
  const NOTES = {
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
    REST: 0
  };

  // Melody Sequences
  const MELODIES = {
    doraemon: [
      { note: 'G4', dur: 0.25 }, { note: 'C5', dur: 0.25 }, { note: 'E5', dur: 0.25 }, { note: 'G5', dur: 0.4 },
      { note: 'F5', dur: 0.25 }, { note: 'E5', dur: 0.25 }, { note: 'D5', dur: 0.5 },
      { note: 'G4', dur: 0.25 }, { note: 'B4', dur: 0.25 }, { note: 'D5', dur: 0.25 }, { note: 'F5', dur: 0.4 },
      { note: 'E5', dur: 0.25 }, { note: 'D5', dur: 0.25 }, { note: 'C5', dur: 0.5 }
    ],
    shinchan: [
      { note: 'C5', dur: 0.2 }, { note: 'E5', dur: 0.2 }, { note: 'G5', dur: 0.2 }, { note: 'C5', dur: 0.2 },
      { note: 'A4', dur: 0.2 }, { note: 'C5', dur: 0.2 }, { note: 'F5', dur: 0.4 },
      { note: 'G4', dur: 0.2 }, { note: 'B4', dur: 0.2 }, { note: 'D5', dur: 0.2 }, { note: 'G5', dur: 0.4 }
    ],
    justice_league: [
      { note: 'C4', dur: 0.4 }, { note: 'G4', dur: 0.4 }, { note: 'C5', dur: 0.6 },
      { note: 'B4', dur: 0.2 }, { note: 'A4', dur: 0.2 }, { note: 'G4', dur: 0.6 },
      { note: 'F4', dur: 0.3 }, { note: 'G4', dur: 0.3 }, { note: 'A4', dur: 0.6 }
    ],
    ninja: [
      { note: 'E4', dur: 0.25 }, { note: 'G4', dur: 0.25 }, { note: 'A4', dur: 0.3 }, { note: 'E4', dur: 0.25 },
      { note: 'B4', dur: 0.25 }, { note: 'A4', dur: 0.25 }, { note: 'G4', dur: 0.4 },
      { note: 'E4', dur: 0.25 }, { note: 'D4', dur: 0.25 }, { note: 'E4', dur: 0.5 }
    ],
    zombie_igi: [
      { note: 'C3', dur: 0.15 }, { note: 'C3', dur: 0.15 }, { note: 'Eb3', dur: 0.3 },
      { note: 'F3', dur: 0.3 }, { note: 'F#3', dur: 0.2 }, { note: 'F3', dur: 0.2 }, { note: 'Eb3', dur: 0.4 }
    ]
  };

  window.playCartoonThemeSong = function(themeName) {
    initAudioContext();
    if (!audioCtx || isMuted) return;

    const melody = MELODIES[themeName] || MELODIES.doraemon;
    stopCartoonThemeSong();

    currentTheme = themeName;
    let stepIndex = 0;

    function playNextNote() {
      if (currentTheme !== themeName || isMuted) return;

      const step = melody[stepIndex];
      const freq = NOTES[step.note] || 0;

      if (freq > 0) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = themeName === 'ninja' ? 'sawtooth' : themeName === 'zombie_igi' ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + step.dur * 0.95);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + step.dur);
        activeOscillators.push(osc);
      }

      stepIndex = (stepIndex + 1) % melody.length;
      setTimeout(playNextNote, step.dur * 1000);
    }

    playNextNote();
  };

  window.stopCartoonThemeSong = function() {
    currentTheme = null;
    activeOscillators.forEach(osc => {
      try { osc.stop(); } catch(e) {}
    });
    activeOscillators = [];
  };

})();
