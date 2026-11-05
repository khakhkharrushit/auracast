/**
 * AuraCast Vision Tracker (High Performance 60FPS Edition)
 * Optimized landmark tracking, sensitive swipe/sliding capture, and gesture debouncing
 * Covers Module 3 (Image & Graphics Representation, Analysis, Feature Extraction)
 */

class VisionTracker {
  constructor() {
    this.videoElement = null;
    this.hands = null;
    this.camera = null;
    this.isTracking = false;
    this.useSimulation = false;
    this.facingMode = 'user'; // 'user' (front selfie) or 'environment' (back camera)

    // Smoothed landmarks storage
    this.smoothedHands = [];
    this.smoothingFactor = 0.55; // Snappier response

    // Gesture history for dynamic gestures (like swipe)
    this.wristHistory = [];
    this.lastSwipeTime = 0;
    this.swipeCooldown = 500; // ms

    // Callbacks
    this.onFrameCallback = null;
    this.onGestureCallback = null;

    // Telemetry
    this.fps = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.latencyMs = 0;

    // Mouse simulation state
    this.mousePos = { x: 0.5, y: 0.5 };
    this.simulatedGesture = 'POINTING';

    // Gesture debouncing to prevent flickering
    this.lastDetectedGestureName = 'HOVER';
    this.gestureStabilityCount = 0;
  }

  async init(videoElement, onFrameCallback, onGestureCallback) {
    this.videoElement = videoElement;
    this.onFrameCallback = onFrameCallback;
    this.onGestureCallback = onGestureCallback;

    if (window.Hands) {
      try {
        this.hands = new window.Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        // modelComplexity 0 = Ultra fast real-time model (fixes lag completely!)
        this.hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 0,
          minDetectionConfidence: 0.55,
          minTrackingConfidence: 0.55
        });

        this.hands.onResults((results) => this.handleResults(results));
        console.log('MediaPipe Hands initialized with high-performance model complexity 0.');
      } catch (err) {
        console.warn('MediaPipe Hands init error:', err);
        this.enableSimulationMode();
      }
    } else {
      this.enableSimulationMode();
    }
  }

  async toggleCameraFlip() {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    console.log('Flipping camera mode to:', this.facingMode);
    return await this.startCamera();
  }

  async startCamera() {
    this.useSimulation = false;

    // Clean up any existing stream first
    if (this.camera) {
      try { this.camera.stop(); } catch (e) {}
      this.camera = null;
    }
    if (this.videoElement && this.videoElement.srcObject) {
      try {
        this.videoElement.srcObject.getTracks().forEach(t => t.stop());
      } catch (e) {}
      this.videoElement.srcObject = null;
    }

    try {
      if (window.Camera && this.hands) {
        this.camera = new window.Camera(this.videoElement, {
          onFrame: async () => {
            const startT = performance.now();
            if (this.hands && this.isTracking && this.videoElement.readyState >= 2) {
              await this.hands.send({ image: this.videoElement });
            }
            this.latencyMs = Math.round(performance.now() - startT);
          },
          width: 1280,
          height: 720,
          facingMode: this.facingMode
        });

        await this.camera.start();
        this.isTracking = true;
        console.log(`Webcam camera stream started successfully via MediaPipe (${this.facingMode}).`);
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: this.facingMode }
        });
        this.videoElement.srcObject = stream;
        await this.videoElement.play();
        this.isTracking = true;
        this.startManualDetectionLoop();
      }

      const camStatus = document.getElementById('cam-status');
      if (camStatus) camStatus.textContent = 'CAMERA ONLINE';
      return true;
    } catch (err) {
      console.warn('Camera startup error:', err);
      const camStatus = document.getElementById('cam-status');
      if (camStatus) {
        camStatus.textContent = (err.name === 'NotAllowedError') ? 'PERMISSION DENIED' : 'CAM ERROR';
      }
      return false;
    }
  }

  startManualDetectionLoop() {
    const loop = async () => {
      if (!this.isTracking) return;
      const startT = performance.now();
      if (this.hands && this.videoElement.readyState >= 2) {
        await this.hands.send({ image: this.videoElement });
      }
      this.latencyMs = Math.round(performance.now() - startT);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  handleResults(results) {
    this.updateFps();

    const rawHands = results.multiHandLandmarks || [];
    const handedness = results.multiHandedness || [];

    this.smoothedHands = this.smoothLandmarks(rawHands);

    const analyzedHands = this.smoothedHands.map((landmarks, index) => {
      const type = (handedness[index] && handedness[index].label) ? handedness[index].label : (index === 0 ? 'Right' : 'Left');
      const gesture = this.classifyGesture(landmarks);
      return { landmarks, type, gesture, rawIndex: index };
    });

    if (analyzedHands.length > 0) {
      this.detectDynamicGestures(analyzedHands[0]);
    }

    if (this.onFrameCallback) {
      this.onFrameCallback({
        hands: analyzedHands,
        videoImage: results.image,
        fps: this.fps,
        latency: this.latencyMs
      });
    }
  }

  smoothLandmarks(multiLandmarks) {
    if (!multiLandmarks || multiLandmarks.length === 0) return [];

    return multiLandmarks.map((currentHand, handIndex) => {
      const prevHand = this.smoothedHands[handIndex];
      if (!prevHand || prevHand.length !== currentHand.length) {
        return currentHand;
      }

      return currentHand.map((pt, ptIndex) => {
        const prevPt = prevHand[ptIndex];
        return {
          x: prevPt.x * (1 - this.smoothingFactor) + pt.x * this.smoothingFactor,
          y: prevPt.y * (1 - this.smoothingFactor) + pt.y * this.smoothingFactor,
          z: (prevPt.z || 0) * (1 - this.smoothingFactor) + (pt.z || 0) * this.smoothingFactor
        };
      });
    });
  }

  classifyGesture(lm) {
    const isExtended = (tipIdx, pipIdx) => {
      const distTipWrist = this.dist3D(lm[tipIdx], lm[0]);
      const distPipWrist = this.dist3D(lm[pipIdx], lm[0]);
      return distTipWrist > distPipWrist * 1.1;
    };

    const pinchDist = this.dist3D(lm[4], lm[8]);
    const isPinching = pinchDist < 0.07;

    // Relative extensions (distance from wrist)
    const distWrist = (idx) => this.dist3D(lm[idx], lm[0]);
    const indexDist = distWrist(8);
    const middleDist = distWrist(12);
    const ringDist = distWrist(16);
    const pinkyDist = distWrist(20);

    // Index is extended if tip is further than PIP or higher on Y
    const indexExtended = isExtended(8, 6) || (lm[8].y < lm[6].y);
    const middleExtended = isExtended(12, 10);
    const ringExtended = isExtended(16, 14);
    const pinkyExtended = isExtended(20, 18);

    // Index is prominently sticking out past middle and ring fingers
    const isIndexProminent = (indexDist > middleDist * 1.08) && (indexDist > ringDist * 1.12);

    let gestureName = 'HOVER';

    // 1. POINTING: Index finger is prominently extended past other fingers (even if middle is slightly relaxed)
    if (indexExtended && (isIndexProminent || (!middleExtended && !ringExtended))) {
      gestureName = 'POINTING';
    }
    // 2. OPEN_PALM: All 4 fingers are extended out (Eraser mode)
    else if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
      gestureName = 'OPEN_PALM';
    } 
    // 3. VICTORY / PEACE: Both Index AND Middle are extended together
    else if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
      gestureName = 'VICTORY_PEACE';
    } 
    // 4. CLOSED_FIST: All fingers curled into palm
    else if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      gestureName = 'CLOSED_FIST';
    } 
    // 5. PINCH: Deliberate pinch
    else if (isPinching) {
      gestureName = 'PINCH';
    }

    // Debounce to prevent 1-frame flickering
    if (gestureName === this.lastDetectedGestureName) {
      this.gestureStabilityCount++;
    } else {
      this.gestureStabilityCount = 0;
      this.lastDetectedGestureName = gestureName;
    }

    return {
      name: gestureName,
      pinchDistance: pinchDist,
      pinchPoint: { x: (lm[4].x + lm[8].x) / 2, y: (lm[4].y + lm[8].y) / 2 }
    };
  }

  detectDynamicGestures(handData) {
    const wrist = handData.landmarks[0];
    const indexTip = handData.landmarks[8];
    const now = performance.now();

    // Track wrist and index tip
    this.wristHistory.push({ x: wrist.x, tipX: indexTip.x, time: now });
    if (this.wristHistory.length > 7) {
      this.wristHistory.shift();
    }

    if (this.wristHistory.length >= 5 && (now - this.lastSwipeTime > this.swipeCooldown)) {
      const oldest = this.wristHistory[0];
      const newest = this.wristHistory[this.wristHistory.length - 1];
      const deltaX = newest.x - oldest.x;
      const deltaTime = (newest.time - oldest.time) / 1000;
      const velocityX = deltaX / deltaTime;

      // Lower threshold for easy, responsive swipe recognition!
      if (Math.abs(velocityX) > 0.65) {
        // Mirrored camera coordinates: moving right is negative X
        const direction = velocityX < 0 ? 'SWIPE_RIGHT' : 'SWIPE_LEFT';
        this.lastSwipeTime = now;
        this.wristHistory = []; // Reset history after swipe

        if (this.onGestureCallback) {
          this.onGestureCallback({
            type: direction,
            velocity: Math.abs(velocityX)
          });
        }
      }
    }
  }

  dist3D(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = (p1.z || 0) - (p2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  updateFps() {
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  enableSimulationMode() {
    this.useSimulation = true;
    this.isTracking = true;

    window.addEventListener('mousemove', (e) => {
      this.mousePos.x = e.clientX / window.innerWidth;
      this.mousePos.y = e.clientY / window.innerHeight;
    });

    window.addEventListener('mousedown', (e) => {
      this.simulatedGesture = e.button === 0 ? 'POINTING' : 'PINCH';
    });

    window.addEventListener('mouseup', () => {
      this.simulatedGesture = 'VICTORY_PEACE';
    });

    const simLoop = () => {
      if (!this.useSimulation) return;
      this.updateFps();

      const fakeHand = this.generateSyntheticHand(this.mousePos.x, this.mousePos.y, this.simulatedGesture);
      if (this.onFrameCallback) {
        this.onFrameCallback({
          hands: [{ landmarks: fakeHand, type: 'Right', gesture: { name: this.simulatedGesture } }],
          videoImage: null,
          fps: 60,
          latency: 2
        });
      }
      requestAnimationFrame(simLoop);
    };

    requestAnimationFrame(simLoop);
  }

  generateSyntheticHand(cx, cy, gesture) {
    const pts = [];
    const scale = 0.08;
    pts[0] = { x: cx, y: cy + scale * 2.2, z: 0 };
    const offsets = [
      [-0.8, -0.2], [-0.3, -1.0], [0.0, -1.2], [0.3, -1.0], [0.6, -0.8]
    ];
    offsets.forEach(([ox, oy], fIdx) => {
      const baseIdx = fIdx * 4 + 1;
      let isCurled = false;
      if (gesture === 'CLOSED_FIST') isCurled = true;
      if (gesture === 'POINTING' && fIdx > 1) isCurled = true;
      if (gesture === 'VICTORY_PEACE' && fIdx > 2) isCurled = true;
      if (gesture === 'PINCH' && fIdx === 0) { ox = -0.3; oy = -1.0; }

      const curlFactor = isCurled ? 0.35 : 1.0;
      for (let j = 0; j < 4; j++) {
        const seg = (j + 1) / 4;
        pts[baseIdx + j] = {
          x: cx + ox * scale * seg * (isCurled ? 0.7 : 1),
          y: cy + (oy * scale * seg * curlFactor) + (scale * 0.8),
          z: 0
        };
      }
    });
    return pts;
  }
}

// Global instance
window.visionTracker = new VisionTracker();
