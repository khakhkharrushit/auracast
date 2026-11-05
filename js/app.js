/**
 * AuraCast Master Application Controller
 * Coordinates Video Feed, Vision Tracking, Modes, HUD Telemetry, and Academic Modal
 */

class AuraCastApp {
  constructor() {
    this.currentMode = 'CANVAS'; // 'CANVAS', 'INSTRUMENTS', 'DECK', 'FILTERS'

    // Canvases
    this.bgCanvas = null;
    this.bgCtx = null;
    this.hudCanvas = null;
    this.hudCtx = null;
    this.drawCanvas = null;

    // Elements
    this.videoEl = null;

    // Telemetry state
    this.currentFps = 60;
    this.currentLatency = 5;
    this.detectedGestureText = 'SEARCHING FOR HANDS...';

    // Simulation status
    this.isSimulating = false;
  }

  async init() {
    console.log('Initializing AuraCast Virtual Multimedia Studio...');

    // Bind Canvases
    this.bgCanvas = document.getElementById('bg-canvas');
    this.bgCtx = this.bgCanvas.getContext('2d');

    this.drawCanvas = document.getElementById('draw-canvas');

    this.hudCanvas = document.getElementById('hud-canvas');
    this.hudCtx = this.hudCanvas.getContext('2d');

    this.videoEl = document.getElementById('webcam-video');

    // Handle Window Resizing
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    // Initialize Sub-engines
    window.airCanvas.init(this.drawCanvas);
    window.airInstruments.init(this.hudCanvas);
    window.mediaDeck.init();

    // Setup UI Bindings
    this.setupUI();

    // Initialize Computer Vision Tracker
    await window.visionTracker.init(
      this.videoEl,
      (frameData) => this.onVisionFrame(frameData),
      (gestureEvent) => this.onDynamicGesture(gestureEvent)
    );

    // Auto-attempt camera start
    await this.startCamera();

    // Start Master Render Loop
    this.startRenderLoop();
  }

  handleResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    [this.bgCanvas, this.drawCanvas, this.hudCanvas].forEach(c => {
      if (c) {
        c.width = w;
        c.height = h;
      }
    });

    if (window.airCanvas) window.airCanvas.resize(w, h);
  }

  async startCamera() {
    const camStatus = document.getElementById('cam-status');
    if (camStatus) camStatus.textContent = 'CONNECTING CAMERA...';

    try {
      await window.visionTracker.startCamera();
      if (camStatus) camStatus.textContent = 'CAMERA ONLINE';
    } catch (e) {
      if (camStatus) camStatus.textContent = 'SIMULATION MODE (MOUSE)';
    }
  }

  setMode(mode) {
    this.currentMode = mode;

    // Update active submodules
    window.airInstruments.active = (mode === 'INSTRUMENTS');
    window.mediaDeck.active = (mode === 'DECK');

    // Update UI tabs
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Show/hide relevant sidebar panels
    const canvasControls = document.getElementById('canvas-controls');
    const instrumentControls = document.getElementById('instrument-controls');
    const deckControls = document.getElementById('deck-controls');
    const filterControls = document.getElementById('filter-controls');

    if (canvasControls) canvasControls.style.display = (mode === 'CANVAS') ? 'block' : 'none';
    if (instrumentControls) instrumentControls.style.display = (mode === 'INSTRUMENTS') ? 'block' : 'none';
    if (deckControls) deckControls.style.display = (mode === 'DECK') ? 'block' : 'none';
    if (filterControls) filterControls.style.display = (mode === 'FILTERS') ? 'block' : 'none';

    // Show individual contextual gesture guide for this screen
    const guideCanvas = document.getElementById('guide-canvas');
    const guideInst = document.getElementById('guide-instruments');
    const guideDeck = document.getElementById('guide-deck');
    const guideFilters = document.getElementById('guide-filters');

    if (guideCanvas) guideCanvas.style.display = (mode === 'CANVAS') ? 'block' : 'none';
    if (guideInst) guideInst.style.display = (mode === 'INSTRUMENTS') ? 'block' : 'none';
    if (guideDeck) guideDeck.style.display = (mode === 'DECK') ? 'block' : 'none';
    if (guideFilters) guideFilters.style.display = (mode === 'FILTERS') ? 'block' : 'none';

    // Play sleek audio transition
    if (window.audioEngine) window.audioEngine.playUiClick();
  }

  setupUI() {
    // Mode Switcher Buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setMode(btn.dataset.mode);
      });
    });

    // Air Canvas Controls
    document.querySelectorAll('.brush-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.brush-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        window.airCanvas.setBrushType(btn.dataset.brush);
      });
    });

    document.querySelectorAll('.color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        window.airCanvas.setBrushColor(dot.dataset.color);
      });
    });

    const brushSizeSlider = document.getElementById('brush-size');
    if (brushSizeSlider) {
      brushSizeSlider.addEventListener('input', (e) => {
        window.airCanvas.setBrushSize(e.target.value);
        const valSpan = document.getElementById('brush-size-val');
        if (valSpan) valSpan.textContent = `${e.target.value}px`;
      });
    }

    document.getElementById('btn-undo')?.addEventListener('click', () => window.airCanvas.undo());
    document.getElementById('btn-redo')?.addEventListener('click', () => window.airCanvas.redo());
    document.getElementById('btn-clear')?.addEventListener('click', () => window.airCanvas.clear());
    document.getElementById('btn-export')?.addEventListener('click', () => window.airCanvas.exportSnapshot());

    // Instrument Controls
    document.getElementById('btn-inst-drums')?.addEventListener('click', (e) => {
      e.target.classList.add('active');
      document.getElementById('btn-inst-synth')?.classList.remove('active');
      window.airInstruments.setMode('DRUMS');
    });

    document.getElementById('btn-inst-synth')?.addEventListener('click', (e) => {
      e.target.classList.add('active');
      document.getElementById('btn-inst-drums')?.classList.remove('active');
      window.airInstruments.setMode('SYNTH');
    });

    // Media Deck Controls
    document.getElementById('dj-play-btn')?.addEventListener('click', () => window.mediaDeck.togglePlay());
    document.getElementById('dj-prev-btn')?.addEventListener('click', () => window.mediaDeck.prevTrack());
    document.getElementById('dj-next-btn')?.addEventListener('click', () => window.mediaDeck.nextTrack());

    // Filter Controls
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        window.visionFilters.setFilter(btn.dataset.filter);
      });
    });

    // Toggle HUD Rings
    document.getElementById('toggle-hud-btn')?.addEventListener('click', (e) => {
      const active = window.visionFilters.toggleHudRings();
      e.target.classList.toggle('active', active);
    });

    // Academic Modal Trigger
    const modal = document.getElementById('viva-modal');
    document.getElementById('viva-btn')?.addEventListener('click', () => {
      if (modal) modal.style.display = 'flex';
      if (window.audioEngine) window.audioEngine.playUiClick();
    });

    document.getElementById('close-modal-btn')?.addEventListener('click', () => {
      if (modal) modal.style.display = 'none';
    });

    // Fullscreen Toggle
    document.getElementById('fullscreen-btn')?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Camera Reset Button
    document.getElementById('cam-reset-btn')?.addEventListener('click', () => {
      window.visionTracker.startCamera();
    });

    // Camera Flip Button (Mobile/Tablet Front-Back switch)
    document.getElementById('cam-flip-btn')?.addEventListener('click', () => {
      window.visionTracker.toggleCameraFlip();
    });

    // Mobile Dock Mode Switcher
    document.querySelectorAll('.dock-btn[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setMode(btn.dataset.mode);
        document.querySelectorAll('.dock-btn[data-mode]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Mobile Tools Drawer Toggle
    const mobileToolsBtn = document.getElementById('mobile-toggle-tools-btn');
    const sidebarPanel = document.getElementById('sidebar-panel');
    mobileToolsBtn?.addEventListener('click', () => {
      if (sidebarPanel) {
        sidebarPanel.classList.toggle('mobile-open');
        mobileToolsBtn.classList.toggle('active', sidebarPanel.classList.contains('mobile-open'));
      }
    });

    // Simulation / Mouse fallback toggle
    document.getElementById('sim-toggle-btn')?.addEventListener('click', (e) => {
      window.visionTracker.enableSimulationMode();
      e.target.textContent = 'MOUSE SIMULATION (ACTIVE)';
      e.target.classList.add('active');
    });

    // Sound Enable & Test Audio Button
    document.getElementById('sound-toggle-btn')?.addEventListener('click', () => {
      window.audioEngine.unlockAudio();
    });

    // Set initial mode
    this.setMode('CANVAS');
  }

  onVisionFrame({ hands, videoImage, fps, latency }) {
    this.currentFps = fps;
    this.currentLatency = latency;

    // Process modes based on hands
    if (hands.length > 0) {
      const primary = hands[0];
      this.detectedGestureText = `${primary.type.toUpperCase()}: ${primary.gesture.name}`;

      if (this.currentMode === 'CANVAS') {
        window.airCanvas.processHand(primary);
      } else if (this.currentMode === 'INSTRUMENTS') {
        window.airInstruments.processHands(hands);
      } else if (this.currentMode === 'DECK') {
        window.mediaDeck.processHands(hands);
      }
    } else {
      this.detectedGestureText = 'LOOKING FOR HANDS...';
      if (this.currentMode === 'CANVAS') {
        window.airCanvas.processHand(null);
      }
    }

    // Update Telemetry Panel
    this.updateTelemetry(hands.length);
  }

  onDynamicGesture(gestureEvent) {
    if (this.currentMode === 'DECK') {
      window.mediaDeck.processGesture(gestureEvent);
    }
  }

  updateTelemetry(handCount) {
    const fpsEl = document.getElementById('telemetry-fps');
    const latEl = document.getElementById('telemetry-lat');
    const gestEl = document.getElementById('telemetry-gesture');
    const handsEl = document.getElementById('telemetry-hands');

    if (fpsEl) fpsEl.textContent = `${this.currentFps} FPS`;
    if (latEl) latEl.textContent = `${this.currentLatency} ms`;
    if (gestEl) gestEl.textContent = this.detectedGestureText;
    if (handsEl) handsEl.textContent = `${handCount} ACTIVE`;
  }

  startRenderLoop() {
    const render = () => {
      const w = this.bgCanvas.width;
      const h = this.bgCanvas.height;

      // 1. Layer 1: Background Video & Image Filters
      this.bgCtx.clearRect(0, 0, w, h);
      if (this.videoEl && this.videoEl.readyState >= 2) {
        window.visionFilters.applyFilter(this.bgCtx, this.videoEl, w, h);
      } else {
        // Fallback sci-fi grid background when webcam is off
        this.renderFallbackGrid(this.bgCtx, w, h);
      }

      // 2. Layer 2: Air Canvas Particles
      window.airCanvas.updateParticles();

      // 3. Layer 3: HUD, Instruments, Reticles, and DJ Deck
      this.hudCtx.clearRect(0, 0, w, h);

      // Render Sci-Fi Hand Reticles & Skeleton
      const hands = window.visionTracker.smoothedHands.map((landmarks, i) => {
        return {
          landmarks,
          type: i === 0 ? 'Right' : 'Left',
          gesture: window.visionTracker.classifyGesture(landmarks)
        };
      });
      window.visionFilters.renderHud(this.hudCtx, hands, w, h);

      // Render mode specific visual layers
      if (this.currentMode === 'CANVAS') {
        window.airCanvas.renderCursor(this.hudCtx);
      } else if (this.currentMode === 'INSTRUMENTS') {
        window.airInstruments.render(this.hudCtx, w, h);
      } else if (this.currentMode === 'DECK') {
        window.mediaDeck.render(this.hudCtx, w, h);
      }

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }

  renderFallbackGrid(ctx, w, h) {
    const grad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h) * 0.75);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#05070c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Perspective grid lines
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// Instantiate and boot on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new AuraCastApp();
  window.app.init();
});
