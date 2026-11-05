/**
 * AuraCast Virtual Air Instruments
 * Floating Air Drums and Synth Keyboard with Real-time Collision & Audio Feedback
 * Covers Module 2 (Sound Concepts, MIDI, Synthesis) & Module 3 (Spatial Coordinate Mapping)
 */

class AirInstruments {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.active = false;
    this.instrumentMode = 'DRUMS'; // 'DRUMS' or 'SYNTH'

    // Debounce hit tracking (prevent sound spam per pad)
    this.lastHitTimes = {};
    this.hitCooldown = 180; // ms

    // Active visual ripples on hit
    this.ripples = [];

    // Pads definition (coordinates normalized 0.0 to 1.0)
    this.drumPads = [
      { id: 'crash', name: 'CRASH', x: 0.15, y: 0.28, radius: 65, color: '#ff007f', sound: () => window.audioEngine.playCrash() },
      { id: 'hihat', name: 'HI-HAT', x: 0.35, y: 0.32, radius: 55, color: '#f59e0b', sound: () => window.audioEngine.playHiHat() },
      { id: 'snare', name: 'SNARE', x: 0.50, y: 0.52, radius: 60, color: '#00f2fe', sound: () => window.audioEngine.playSnare() },
      { id: 'tom',   name: 'TOM',   x: 0.65, y: 0.32, radius: 55, color: '#10b981', sound: () => window.audioEngine.playTom(150) },
      { id: 'kick',  name: 'KICK',  x: 0.82, y: 0.52, radius: 70, color: '#8b5cf6', sound: () => window.audioEngine.playKick() }
    ];

    this.synthKeys = [
      { id: 'C4', label: 'C4', note: 'C4', x: 0.12, y: 0.40, w: 0.08, h: 0.28, color: '#3b82f6' },
      { id: 'D4', label: 'D4', note: 'D4', x: 0.22, y: 0.40, w: 0.08, h: 0.28, color: '#06b6d4' },
      { id: 'E4', label: 'E4', note: 'E4', x: 0.32, y: 0.40, w: 0.08, h: 0.28, color: '#10b981' },
      { id: 'F4', label: 'F4', note: 'F4', x: 0.42, y: 0.40, w: 0.08, h: 0.28, color: '#84cc16' },
      { id: 'G4', label: 'G4', note: 'G4', x: 0.52, y: 0.40, w: 0.08, h: 0.28, color: '#eab308' },
      { id: 'A4', label: 'A4', note: 'A4', x: 0.62, y: 0.40, w: 0.08, h: 0.28, color: '#f97316' },
      { id: 'B4', label: 'B4', note: 'B4', x: 0.72, y: 0.40, w: 0.08, h: 0.28, color: '#ef4444' },
      { id: 'C5', label: 'C5', note: 'C5', x: 0.82, y: 0.40, w: 0.08, h: 0.28, color: '#ec4899' }
    ];
  }

  init(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');

    // Enable direct mouse and touch clicking on drum pads & synth keys
    window.addEventListener('pointerdown', (e) => {
      if (!this.active) return;
      const now = performance.now();
      const w = this.canvas.width;
      const h = this.canvas.height;
      const px = e.clientX;
      const py = e.clientY;

      if (this.instrumentMode === 'DRUMS') {
        this.checkDrumCollisions(px, py, now, w, h);
      } else {
        this.checkSynthCollisions(px, py, now, w, h);
      }
    });
  }

  setMode(mode) {
    this.instrumentMode = mode;
  }

  /**
   * Process fingertips from all detected hands
   */
  processHands(hands) {
    if (!this.active || !hands || hands.length === 0) return;

    const now = performance.now();
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Tips to check: Index (8), Middle (12), Thumb (4)
    const tipIndices = [8, 12, 4];

    hands.forEach(hand => {
      tipIndices.forEach(idx => {
        const pt = hand.landmarks[idx];
        if (!pt) return;

        // Mirrored coordinate
        const px = (1 - pt.x) * w;
        const py = pt.y * h;

        if (this.instrumentMode === 'DRUMS') {
          this.checkDrumCollisions(px, py, now, w, h);
        } else {
          this.checkSynthCollisions(px, py, now, w, h);
        }
      });
    });
  }

  checkDrumCollisions(px, py, now, w, h) {
    this.drumPads.forEach(pad => {
      const padX = pad.x * w;
      const padY = pad.y * h;
      const dist = Math.hypot(px - padX, py - padY);

      if (dist <= pad.radius) {
        const lastHit = this.lastHitTimes[pad.id] || 0;
        if (now - lastHit > this.hitCooldown) {
          this.lastHitTimes[pad.id] = now;
          pad.sound();
          this.spawnRipple(padX, padY, pad.color, pad.radius * 1.8);
        }
      }
    });
  }

  checkSynthCollisions(px, py, now, w, h) {
    this.synthKeys.forEach(key => {
      const kx = key.x * w;
      const ky = key.y * h;
      const kw = key.w * w;
      const kh = key.h * h;

      if (px >= kx && px <= kx + kw && py >= ky && py <= ky + kh) {
        const lastHit = this.lastHitTimes[key.id] || 0;
        if (now - lastHit > this.hitCooldown) {
          this.lastHitTimes[key.id] = now;
          window.audioEngine.playSynthNote(key.note, 'triangle', 0.5);
          this.spawnRipple(kx + kw / 2, ky + kh / 2, key.color, kw * 1.6);
        }
      }
    });
  }

  spawnRipple(x, y, color, maxRadius) {
    this.ripples.push({
      x, y, color,
      radius: 10,
      maxRadius,
      alpha: 1.0
    });
  }

  render(ctx, w, h) {
    if (!this.active) return;

    ctx.save();

    if (this.instrumentMode === 'DRUMS') {
      this.renderDrumPads(ctx, w, h);
    } else {
      this.renderSynthKeys(ctx, w, h);
    }

    this.renderRipples(ctx);
    this.renderVisualizer(ctx, w, h);

    ctx.restore();
  }

  renderDrumPads(ctx, w, h) {
    const now = performance.now();

    this.drumPads.forEach(pad => {
      const x = pad.x * w;
      const y = pad.y * h;
      const timeSinceHit = now - (this.lastHitTimes[pad.id] || 0);
      const isRecentHit = timeSinceHit < 120;

      // Holographic Pad Ring
      ctx.beginPath();
      ctx.arc(x, y, pad.radius, 0, Math.PI * 2);
      ctx.fillStyle = isRecentHit ? pad.color : 'rgba(15, 23, 42, 0.65)';
      ctx.fill();

      ctx.lineWidth = isRecentHit ? 6 : 3;
      ctx.strokeStyle = pad.color;
      ctx.shadowColor = pad.color;
      ctx.shadowBlur = isRecentHit ? 30 : 15;
      ctx.stroke();

      // Inner decorative ring
      ctx.beginPath();
      ctx.arc(x, y, pad.radius * 0.65, 0, Math.PI * 2);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.stroke();

      // Label
      ctx.font = 'bold 15px "Outfit", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 4;
      ctx.fillText(pad.name, x, y);
    });
  }

  renderSynthKeys(ctx, w, h) {
    const now = performance.now();

    this.synthKeys.forEach(key => {
      const x = key.x * w;
      const y = key.y * h;
      const kw = key.w * w;
      const kh = key.h * h;
      const timeSinceHit = now - (this.lastHitTimes[key.id] || 0);
      const isHit = timeSinceHit < 120;

      ctx.beginPath();
      ctx.roundRect(x, y, kw, kh, 12);
      ctx.fillStyle = isHit ? key.color : 'rgba(15, 23, 42, 0.7)';
      ctx.fill();

      ctx.lineWidth = isHit ? 5 : 2;
      ctx.strokeStyle = key.color;
      ctx.shadowColor = key.color;
      ctx.shadowBlur = isHit ? 25 : 12;
      ctx.stroke();

      // Key Note Label
      ctx.font = 'bold 16px "Outfit", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(key.label, x + kw / 2, y + kh - 20);
    });
  }

  renderRipples(ctx) {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += 4;
      r.alpha -= 0.05;

      if (r.alpha <= 0) {
        this.ripples.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = r.alpha;
      ctx.shadowColor = r.color;
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.restore();
    }
  }

  renderVisualizer(ctx, w, h) {
    if (!window.audioEngine) return;
    const freq = window.audioEngine.getFrequencyData();
    if (!freq || freq.length === 0) return;

    // Draw spectrum bar HUD along bottom
    const barWidth = w / 40;
    const bottomY = h - 15;

    ctx.save();
    for (let i = 0; i < 40; i++) {
      const val = freq[i * 2] || 0;
      const barHeight = (val / 255) * 80;
      const x = i * barWidth;

      const grad = ctx.createLinearGradient(0, bottomY - barHeight, 0, bottomY);
      grad.addColorStop(0, '#00f2fe');
      grad.addColorStop(1, '#7928ca');

      ctx.fillStyle = grad;
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 8;
      ctx.fillRect(x + 2, bottomY - barHeight, barWidth - 4, barHeight);
    }
    ctx.restore();
  }
}

// Global instance
window.airInstruments = new AirInstruments();
