/**
 * AuraCast Audio Engine (Guaranteed Audible Output Edition)
 * Directly routed to AudioDestinationNode with linear envelopes and fail-safe volume levels
 * Covers Module 2 (Sound & Audio Concepts, Synthesis, Frequency Analysis)
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isInitialized = false;
    this.masterGain = null;
    this.analyser = null;
    this.fftData = null;
    this.waveData = null;
    this.isAudioUnlocked = false;

    // Musical scale frequencies (C Major)
    this.notes = {
      'C4': 261.63,
      'D4': 293.66,
      'E4': 329.63,
      'F4': 349.23,
      'G4': 392.00,
      'A4': 440.00,
      'B4': 493.88,
      'C5': 523.25,
      'G5': 783.99
    };

    // DJ Looper
    this.isLoopPlaying = false;
    this.loopTimer = null;
    this.bpm = 120;
    this.currentStep = 0;

    this.setupGlobalUnlockListeners();
  }

  setupGlobalUnlockListeners() {
    const unlocker = () => {
      this.ensureContext();
    };

    ['click', 'pointerdown', 'touchstart', 'keydown'].forEach(evt => {
      window.addEventListener(evt, unlocker, { passive: true });
    });
  }

  init() {
    if (this.isInitialized && this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain: Default loud and clear (0.9)
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.9;

      // Frequency Analyser
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      // Direct Dual Connection: Ensures audio ALWAYS reaches speakers regardless of analyser node
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.connect(this.analyser);

      this.fftData = new Uint8Array(this.analyser.frequencyBinCount);
      this.waveData = new Uint8Array(this.analyser.fftSize);

      this.isInitialized = true;
      console.log('AudioEngine initialized. AudioContext state:', this.ctx.state);
    } catch (e) {
      console.warn('AudioContext init error:', e);
    }
  }

  async ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn('AudioContext waiting for user gesture:', err);
      }
    }
    if (this.ctx && this.ctx.state === 'running') {
      this.isAudioUnlocked = true;
      this.updateAudioButtonUI(true);
    }
  }

  async unlockAudio() {
    await this.ensureContext();
    // Play loud, immediate test chime
    this.playTone(523.25, 0.2); // C5
    setTimeout(() => this.playTone(783.99, 0.3), 150); // G5
    this.updateAudioButtonUI(true);
  }

  updateAudioButtonUI(isActive) {
    const btn = document.getElementById('sound-toggle-btn');
    if (btn) {
      if (isActive) {
        btn.innerHTML = '🔊 Sound: Active (ON)';
        btn.classList.add('active');
        btn.style.borderColor = 'var(--accent-emerald)';
        btn.style.color = 'var(--accent-emerald)';
      } else {
        btn.innerHTML = '🔇 Enable Sound';
        btn.classList.remove('active');
      }
    }
  }

  setMasterVolume(level) {
    if (!this.masterGain || !this.ctx) return;
    // Minimum 0.15 so volume never accidentally kills all audio
    const clamped = Math.max(0.15, Math.min(1.0, level));
    this.masterGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
  }

  // --- BULLETPROOF TONE GENERATOR (Direct Speaker Output) ---
  playTone(freq = 440, duration = 0.3, type = 'sine') {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.linearRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    gain.connect(this.ctx.destination); // Direct bypass guarantee

    osc.start(now);
    osc.stop(now + duration);
  }

  // --- PERCUSSION SYNTHESIS (AIR DRUMS) ---

  // 1. Kick Drum
  playKick() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    gain.gain.setValueAtTime(0.95, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // 2. Snare Drum
  playSnare() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Body tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.12);
    oscGain.gain.setValueAtTime(0.7, now);
    oscGain.gain.linearRampToValueAtTime(0.001, now + 0.15);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);

    // Noise burst
    const noiseBuffer = this.createNoiseBuffer(0.25);
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.85, now);
      noiseGain.gain.linearRampToValueAtTime(0.001, now + 0.22);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.22);
    }
  }

  // 3. Hi-Hat
  playHiHat(open = false) {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const duration = open ? 0.3 : 0.09;

    const noiseBuffer = this.createNoiseBuffer(duration);
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(8500, now);
      filter.Q.setValueAtTime(2, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.75, now);
      gain.gain.linearRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + duration);
    }
  }

  // 4. Crash Cymbal
  playCrash() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const duration = 1.0;

    const noiseBuffer = this.createNoiseBuffer(duration);
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(4000, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.linearRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + duration);
    }
  }

  // 5. Tom-Tom Drum
  playTom(pitch = 160) {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.linearRampToValueAtTime(pitch * 0.5, now + 0.25);

    gain.gain.setValueAtTime(0.85, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  // --- MELODIC SYNTHESIS (AIR PIANO / SYNTH) ---

  playSynthNote(noteName, waveform = 'triangle', duration = 0.45) {
    this.ensureContext();
    if (!this.ctx) return;
    const freq = this.notes[noteName] || 440;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = waveform;
    osc.frequency.setValueAtTime(freq, now);

    // Clean, audible linear ADSR envelope
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.7, now + 0.04); // Attack
    gain.gain.linearRampToValueAtTime(0.35, now + 0.18); // Decay
    gain.gain.linearRampToValueAtTime(0.001, now + duration); // Release

    osc.connect(gain);
    gain.connect(this.masterGain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  // --- UI SOUNDS ---

  playUiClick() {
    this.playTone(880, 0.06, 'sine');
  }

  playSwipeWhoosh(direction = 1) {
    this.playTone(direction > 0 ? 587.33 : 392.00, 0.15, 'sine');
  }

  // --- PROCEDURAL DJ LOOPER ---

  toggleDjLoop() {
    this.ensureContext();
    this.isLoopPlaying = !this.isLoopPlaying;

    if (this.isLoopPlaying) {
      this.currentStep = 0;
      const stepDuration = (60 / this.bpm) / 4 * 1000;
      this.loopTimer = setInterval(() => {
        const step = this.currentStep % 16;
        if (step === 0 || step === 8 || step === 10) this.playKick();
        if (step === 4 || step === 12) this.playSnare();
        if (step % 2 === 0) this.playHiHat(step === 14);
        if (step === 2 || step === 6 || step === 11) {
          const notes = ['C4', 'E4', 'G4', 'A4'];
          this.playSynthNote(notes[Math.floor(step / 4)], 'triangle', 0.25);
        }
        this.currentStep++;
      }, stepDuration);
    } else {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }

    return this.isLoopPlaying;
  }

  getFrequencyData() {
    if (!this.analyser) return [];
    this.analyser.getByteFrequencyData(this.fftData);
    return this.fftData;
  }

  getWaveformData() {
    if (!this.analyser) return [];
    this.analyser.getByteTimeDomainData(this.waveData);
    return this.waveData;
  }

  createNoiseBuffer(duration) {
    if (!this.ctx) return null;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
}

// Global instance
window.audioEngine = new AudioEngine();
