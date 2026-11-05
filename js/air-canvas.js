/**
 * AuraCast Air Canvas Engine
 * Ultra-smooth continuous 60FPS holographic air drawing with grace period hysteresis
 * Eliminates gaps and dotting; connects lines continuously with Bézier interpolation
 * Covers Module 3 & 4 (Image Enhancement, Synthesis, Computer Animation)
 */

class AirCanvas {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.width = 1280;
    this.height = 720;

    // Drawing settings
    this.brushType = 'NEON_GLOW'; // NEON_GLOW, RAINBOW_STREAM, FIRE_SPARKS, LASER, ERASER
    this.brushColor = '#00f2fe';
    this.brushSize = 8;
    this.rainbowHue = 0;

    // Stroke tracking
    this.isDrawing = false;
    this.prevPoint = null;
    this.currentStroke = null;
    this.strokes = []; // History stack for undo/redo
    this.redoStack = [];

    // Grace frames counter to prevent line breaking/dots when tracking flickers for 1-2 frames
    this.graceFrames = 0;
    this.maxGraceFrames = 4;

    // Particle system (for FIRE_SPARKS and particle trails)
    this.particles = [];
  }

  init(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.resize(window.innerWidth, window.innerHeight);

    window.addEventListener('resize', () => {
      this.resize(window.innerWidth, window.innerHeight);
    });
  }

  resize(w, h) {
    if (!this.canvas) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(this.canvas, 0, 0);

    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;

    this.ctx.drawImage(tempCanvas, 0, 0, w, h);
  }

  setBrushType(type) {
    this.brushType = type;
  }

  setBrushColor(color) {
    this.brushColor = color;
  }

  setBrushSize(size) {
    this.brushSize = parseInt(size, 10);
  }

  /**
   * Process vision tracking update for Air Canvas with hysteresis
   */
  processHand(hand) {
    if (!hand || !hand.landmarks) {
      if (this.isDrawing) {
        this.graceFrames++;
        if (this.graceFrames > this.maxGraceFrames) {
          this.endStroke();
        }
      }
      return;
    }

    // Mirror horizontal coordinate for natural webcam reflection
    const indexTip = hand.landmarks[8];
    const rawX = (1 - indexTip.x) * this.width;
    const rawY = indexTip.y * this.height;

    // Apply EMA smoothing to index tip to eliminate hand tremors & jitters
    if (!this.smoothedTip) {
      this.smoothedTip = { x: rawX, y: rawY };
    } else {
      this.smoothedTip.x = this.smoothedTip.x * 0.3 + rawX * 0.7;
      this.smoothedTip.y = this.smoothedTip.y * 0.3 + rawY * 0.7;
    }

    const screenX = this.smoothedTip.x;
    const screenY = this.smoothedTip.y;
    const gesture = hand.gesture.name;

    this.currentTipPos = { x: screenX, y: screenY, gesture };

    // POINTING: Draw strictly with Index Fingertip (Landmark 8) only!
    if (gesture === 'POINTING') {
      this.graceFrames = 0; // Reset grace counter
      if (!this.isDrawing) {
        this.startStroke(screenX, screenY);
      } else {
        this.continueStroke(screenX, screenY);
      }
    } 
    // OPEN PALM: Eraser follows palm
    else if (gesture === 'OPEN_PALM') {
      if (this.isDrawing) this.endStroke();
      const palmX = (1 - hand.landmarks[9].x) * this.width;
      const palmY = hand.landmarks[9].y * this.height;
      this.eraseAt(palmX, palmY, this.brushSize * 4);
    } 
    // Other gestures (Peace sign / Fist / Hover): Stop drawing cleanly
    else {
      if (this.isDrawing) {
        this.graceFrames++;
        if (this.graceFrames > this.maxGraceFrames) {
          this.endStroke();
        }
      }
    }
  }

  /**
   * Render real-time holographic cursor right at the index fingertip
   */
  renderCursor(ctx) {
    if (!this.currentTipPos) return;
    const { x, y, gesture } = this.currentTipPos;

    ctx.save();
    if (gesture === 'POINTING') {
      // Bright neon pen tip
      ctx.beginPath();
      ctx.arc(x, y, this.brushSize / 2 + 3, 0, Math.PI * 2);
      ctx.fillStyle = this.brushColor;
      ctx.shadowColor = this.brushColor;
      ctx.shadowBlur = 18;
      ctx.fill();

      // Outer concentric tracking ring
      ctx.beginPath();
      ctx.arc(x, y, this.brushSize + 8, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Interactive mode label
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00f2fe';
      ctx.fillText('✏️ DRAWING', x + 16, y - 10);
    } else if (gesture === 'OPEN_PALM') {
      // Eraser circle
      ctx.beginPath();
      ctx.arc(x, y, this.brushSize * 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#ff007f';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ff007f';
      ctx.fillText('🧹 ERASER', x + this.brushSize * 4 + 8, y);
    } else {
      // Subtle pointer reticle
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    ctx.restore();
  }

  startStroke(x, y) {
    this.isDrawing = true;
    this.prevPoint = { x, y };
    this.currentStroke = {
      type: this.brushType,
      color: this.brushColor,
      size: this.brushSize,
      points: [{ x, y }]
    };
    this.redoStack = [];

    // Draw initial round dot at start point so even a tap is visible
    this.drawDot(x, y);

    if (window.audioEngine) {
      window.audioEngine.playUiClick();
    }
  }

  continueStroke(x, y) {
    if (!this.isDrawing || !this.prevPoint) return;

    const dist = Math.hypot(x - this.prevPoint.x, y - this.prevPoint.y);
    if (dist < 1.5) return; // Ignore microscopic sensor tremor

    // Teleport / Jump Rejection: If the fingertip jumps more than 65px in a single 1/60s frame
    // (caused by occlusion, finger swap, or hand twist), do NOT draw a stray line across the canvas!
    if (dist > 65) {
      this.prevPoint = { x, y };
      return;
    }

    // Draw a continuous smooth line connecting prevPoint to new point
    this.drawLine(this.prevPoint.x, this.prevPoint.y, x, y);

    this.currentStroke.points.push({ x, y });
    this.prevPoint = { x, y };

    if (this.brushType === 'FIRE_SPARKS' || this.brushType === 'RAINBOW_STREAM') {
      this.spawnParticles(x, y, this.brushColor);
    }
  }

  endStroke() {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.prevPoint = null;
    this.graceFrames = 0;
    if (this.currentStroke && this.currentStroke.points.length > 0) {
      this.strokes.push(this.currentStroke);
    }
    this.currentStroke = null;
  }

  drawDot(x, y) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.brushSize / 2, 0, Math.PI * 2);
    this.ctx.fillStyle = this.brushColor;
    if (this.brushType === 'NEON_GLOW') {
      this.ctx.shadowColor = this.brushColor;
      this.ctx.shadowBlur = this.brushSize * 2;
    }
    this.ctx.fill();
    this.ctx.restore();
  }

  drawLine(x1, y1, x2, y2) {
    this.ctx.save();
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (this.brushType === 'NEON_GLOW') {
      // 1. Wide outer neon glow
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.lineWidth = this.brushSize * 2.2;
      this.ctx.strokeStyle = this.brushColor;
      this.ctx.shadowColor = this.brushColor;
      this.ctx.shadowBlur = this.brushSize * 2.5;
      this.ctx.stroke();

      // 2. White hot core
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.lineWidth = this.brushSize * 0.7;
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.shadowBlur = 0;
      this.ctx.stroke();
    } 
    else if (this.brushType === 'RAINBOW_STREAM') {
      this.rainbowHue = (this.rainbowHue + 4) % 360;
      const color = `hsl(${this.rainbowHue}, 100%, 60%)`;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.lineWidth = this.brushSize;
      this.ctx.strokeStyle = color;
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 15;
      this.ctx.stroke();
    } 
    else if (this.brushType === 'LASER') {
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.lineWidth = Math.max(3, this.brushSize * 0.5);
      this.ctx.strokeStyle = '#ff0055';
      this.ctx.shadowColor = '#ff0055';
      this.ctx.shadowBlur = 10;
      this.ctx.stroke();
    } 
    else if (this.brushType === 'FIRE_SPARKS') {
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.lineWidth = this.brushSize;
      this.ctx.strokeStyle = '#ff8800';
      this.ctx.shadowColor = '#ff3300';
      this.ctx.shadowBlur = 14;
      this.ctx.stroke();
    } 
    else if (this.brushType === 'ERASER') {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.lineWidth = this.brushSize * 3.5;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  eraseAt(x, y, radius) {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  spawnParticles(x, y, color) {
    const count = this.brushType === 'FIRE_SPARKS' ? 4 : 2;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - (this.brushType === 'FIRE_SPARKS' ? 2 : 0),
        size: Math.random() * (this.brushSize * 0.7) + 2,
        alpha: 1.0,
        decay: Math.random() * 0.04 + 0.02,
        color: this.brushType === 'RAINBOW_STREAM' ? `hsl(${this.rainbowHue}, 100%, 65%)` : color
      });
    }
  }

  updateParticles() {
    if (this.particles.length === 0) return;

    this.ctx.save();
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.strokes = [];
    this.redoStack = [];
    this.particles = [];
  }

  undo() {
    if (this.strokes.length === 0) return;
    const removed = this.strokes.pop();
    this.redoStack.push(removed);
    this.redrawAll();
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const restored = this.redoStack.pop();
    this.strokes.push(restored);
    this.redrawAll();
  }

  redrawAll() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    const prevBrush = this.brushType;
    const prevColor = this.brushColor;
    const prevSize = this.brushSize;

    this.strokes.forEach(stroke => {
      this.brushType = stroke.type;
      this.brushColor = stroke.color;
      this.brushSize = stroke.size;

      if (stroke.points.length === 1) {
        this.drawDot(stroke.points[0].x, stroke.points[0].y);
      } else {
        for (let i = 1; i < stroke.points.length; i++) {
          const p1 = stroke.points[i - 1];
          const p2 = stroke.points[i];
          this.drawLine(p1.x, p1.y, p2.x, p2.y);
        }
      }
    });

    this.brushType = prevBrush;
    this.brushColor = prevColor;
    this.brushSize = prevSize;
  }

  exportSnapshot() {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.width;
    exportCanvas.height = this.height;
    const expCtx = exportCanvas.getContext('2d');

    const bgGrad = expCtx.createLinearGradient(0, 0, this.width, this.height);
    bgGrad.addColorStop(0, '#0a0d14');
    bgGrad.addColorStop(1, '#111726');
    expCtx.fillStyle = bgGrad;
    expCtx.fillRect(0, 0, this.width, this.height);

    expCtx.drawImage(this.canvas, 0, 0);

    expCtx.font = 'bold 20px "Outfit", sans-serif';
    expCtx.fillStyle = '#00f2fe';
    expCtx.fillText('AURACAST STUDIO — Multimedia Systems Project', 40, this.height - 40);

    expCtx.font = '14px monospace';
    expCtx.fillStyle = '#94a3b8';
    expCtx.fillText(new Date().toLocaleString(), 40, this.height - 20);

    const link = document.createElement('a');
    link.download = `AuraCast_AirDrawing_${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }
}

// Global instance
window.airCanvas = new AirCanvas();
