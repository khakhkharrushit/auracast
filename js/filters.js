/**
 * AuraCast AR Vision & Real-time Image Filters
 * Convolution Kernels, Sobel Edge Detection, Thermal Mapping, and Sci-Fi HUD
 * Covers Module 3 (Image Enhancement, Segmentation, Spatial Filtering) & Module 4 (Display Animation)
 */

class VisionFilters {
  constructor() {
    this.activeFilter = 'NORMAL'; // Default to clean, crisp webcam feed!
    this.showHudRings = true;
    this.hudPulse = 0;

    // Thermal color ramp lookup table (256 colors)
    this.thermalLUT = this.generateThermalLUT();
  }

  setFilter(filterName) {
    this.activeFilter = filterName;
  }

  toggleHudRings() {
    this.showHudRings = !this.showHudRings;
    return this.showHudRings;
  }

  applyFilter(ctx, videoEl, w, h) {
    if (!videoEl || videoEl.readyState < 2) return;

    // Draw mirrored video frame directly via hardware-accelerated GPU drawImage
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoEl, 0, 0, w, h);
    ctx.restore();

    // In NORMAL mode, return immediately — 60 FPS with ZERO lag!
    if (this.activeFilter === 'NORMAL') return;

    // Only run pixel buffer manipulation for explicit experimental filter effects
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    if (this.activeFilter === 'SOBEL_EDGE') {
      this.applySobel(imgData, w, h);
    } else if (this.activeFilter === 'CYBERPUNK') {
      this.applyCyberpunk(data);
    } else if (this.activeFilter === 'THERMAL') {
      this.applyThermal(data);
    } else if (this.activeFilter === 'MATRIX') {
      this.applyMatrix(data);
    }

    ctx.putImageData(imgData, 0, 0);
  }

  applyCyberpunk(data) {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;

      // Enhance blues/cyans in shadows, purples/pinks in highlights
      data[i] = Math.min(255, (r * 0.8) + (luma > 128 ? 60 : 0)); // Red/Pink
      data[i + 1] = Math.min(255, g * 0.9 + 20); // Cyan tint
      data[i + 2] = Math.min(255, b * 1.3 + 40); // Deep electric blue
    }
  }

  applyThermal(data) {
    for (let i = 0; i < data.length; i += 4) {
      const luma = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      const rgb = this.thermalLUT[luma];
      data[i] = rgb[0];
      data[i + 1] = rgb[1];
      data[i + 2] = rgb[2];
    }
  }

  applyMatrix(data) {
    for (let i = 0; i < data.length; i += 4) {
      const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = 0; // Drop red
      data[i + 1] = Math.min(255, luma * 1.5 + 10); // Boost phosphor green
      data[i + 2] = Math.min(60, luma * 0.3); // Faint blue
    }
  }

  /**
   * 3x3 Sobel Operator (Spatial Image Enhancement - Module 3)
   */
  applySobel(imgData, w, h) {
    const src = new Uint8ClampedArray(imgData.data);
    const dst = imgData.data;

    // Sobel Kernels:
    // Gx: [-1, 0, 1], [-2, 0, 2], [-1, 0, 1]
    // Gy: [-1, -2, -1], [0, 0, 0], [1, 2, 1]

    for (let y = 1; y < h - 1; y += 2) { // Step 2 for high performance
      for (let x = 1; x < w - 1; x += 2) {
        const idx = (y * w + x) * 4;

        // Neighbor luminance
        const getLum = (ox, oy) => {
          const pIdx = ((y + oy) * w + (x + ox)) * 4;
          return 0.299 * src[pIdx] + 0.587 * src[pIdx + 1] + 0.114 * src[pIdx + 2];
        };

        const gx =
          -1 * getLum(-1, -1) + 1 * getLum(1, -1) +
          -2 * getLum(-1,  0) + 2 * getLum(1,  0) +
          -1 * getLum(-1,  1) + 1 * getLum(1,  1);

        const gy =
          -1 * getLum(-1, -1) - 2 * getLum(0, -1) - 1 * getLum(1, -1) +
           1 * getLum(-1,  1) + 2 * getLum(0,  1) + 1 * getLum(1,  1);

        const mag = Math.min(255, Math.hypot(gx, gy));

        // Neon cyan edge on black background
        dst[idx] = mag > 60 ? 0 : 5;
        dst[idx + 1] = mag > 60 ? mag : 5;
        dst[idx + 2] = mag > 60 ? 255 : 10;
        dst[idx + 3] = 255;
      }
    }
  }

  generateThermalLUT() {
    const lut = [];
    for (let i = 0; i < 256; i++) {
      const norm = i / 255;
      let r = 0, g = 0, b = 0;
      if (norm < 0.25) {
        // Black to Blue
        b = norm * 4 * 255;
      } else if (norm < 0.5) {
        // Blue to Cyan/Green
        b = (1 - (norm - 0.25) * 4) * 255;
        g = (norm - 0.25) * 4 * 255;
      } else if (norm < 0.75) {
        // Green to Yellow
        g = 255;
        r = (norm - 0.5) * 4 * 255;
      } else {
        // Yellow to Red/White
        r = 255;
        g = (1 - (norm - 0.75) * 4) * 255;
        b = (norm - 0.75) * 4 * 255;
      }
      lut.push([Math.round(r), Math.round(g), Math.round(b)]);
    }
    return lut;
  }

  /**
   * Render Sci-Fi Iron Man / Cyberpunk HUD over hands
   */
  renderHud(ctx, hands, w, h) {
    if (!this.showHudRings || !hands || hands.length === 0) return;

    this.hudPulse = (this.hudPulse + 0.04) % (Math.PI * 2);
    const pulseFactor = Math.sin(this.hudPulse) * 4;

    ctx.save();

    hands.forEach(hand => {
      const lm = hand.landmarks;

      // 1. Draw Skeleton Lines
      this.drawHandConnections(ctx, lm, w, h);

      // 2. Wrist Targeting Arc & Rotation Reticle
      const wristX = (1 - lm[0].x) * w;
      const wristY = lm[0].y * h;

      ctx.beginPath();
      ctx.arc(wristX, wristY, 28 + pulseFactor, 0, Math.PI * 1.5);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#00f2fe';
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 12;
      ctx.stroke();

      // Rotating dashed outer ring
      ctx.save();
      ctx.translate(wristX, wristY);
      ctx.rotate(this.hudPulse * 1.2);
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#7928ca';
      ctx.stroke();
      ctx.restore();

      // 3. Fingertip Nodes
      const tips = [4, 8, 12, 16, 20];
      tips.forEach(idx => {
        const tx = (1 - lm[idx].x) * w;
        const ty = lm[idx].y * h;

        ctx.beginPath();
        ctx.arc(tx, ty, idx === 8 ? 7 : 4, 0, Math.PI * 2);
        ctx.fillStyle = idx === 8 ? '#00f2fe' : '#ffffff';
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 10;
        ctx.fill();
      });

      // 4. Floating Holographic Gesture Badge above hand
      const midKnuckleX = (1 - lm[9].x) * w;
      const midKnuckleY = lm[9].y * h - 45;

      const badgeText = `${hand.type.toUpperCase()}: ${hand.gesture.name}`;
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      const textMetrics = ctx.measureText(badgeText);
      const bgW = textMetrics.width + 20;

      ctx.fillStyle = 'rgba(8, 14, 26, 0.85)';
      ctx.roundRect(midKnuckleX - bgW / 2, midKnuckleY - 14, bgW, 22, 6);
      ctx.fill();

      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#00f2fe';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, midKnuckleX, midKnuckleY - 3);
    });

    ctx.restore();
  }

  drawHandConnections(ctx, lm, w, h) {
    const connections = [
      // Palm
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [5, 9], [9, 10], [10, 11], [11, 12], // Middle
      [9, 13], [13, 14], [14, 15], [15, 16], // Ring
      [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [0, 17] // Wrist to pinky base
    ];

    ctx.beginPath();
    connections.forEach(([i, j]) => {
      const x1 = (1 - lm[i].x) * w;
      const y1 = lm[i].y * h;
      const x2 = (1 - lm[j].x) * w;
      const y2 = lm[j].y * h;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    });

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.45)';
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 6;
    ctx.stroke();
  }
}

// Global instance
window.visionFilters = new VisionFilters();
