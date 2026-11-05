# ✨ AuraCast — Virtual Multimedia Studio

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-00f2fe.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Mobile%20%7C%20Tablet-10b981.svg)](index.html)
[![MediaPipe](https://img.shields.io/badge/Vision-MediaPipe%20Hands-7928ca.svg)](https://developers.google.com/mediapipe)

> **AuraCast** is an open-source, touchless spatial computing studio engineered around real-time computer vision, client-side digital signal processing (DSP), and hardware-accelerated canvas compositing. Users control digital artwork, musical instruments, video filters, and media playback purely through natural physical hand gestures via their device camera.

---

## 📱 Installable on Mobile, Tablet & Desktop (PWA)

AuraCast is built as an **Installable Progressive Web App (PWA)**:
* **Android & Chrome:** Tap the in-app **`📲 Install App`** button or browser menu `Install AuraCast` to add it directly to your home screen.
* **iPhone & iPad (Safari):** Tap the **Share** button $\rightarrow$ **Add to Home Screen**.
* **Windows & macOS (Edge / Chrome):** Click the **Install** icon in your browser URL bar.
* **Camera Support:** Works with front selfie cameras and rear environment cameras (toggleable via the **`🔄 Flip Cam`** button).

---

## 🎮 Core Features

### 1. 🎨 Holographic Air Canvas
* Paint in 3D mid-air using your **Index Fingertip (☝️)**.
* 5 brush modes: **Neon Glow**, **Rainbow Stream**, **Fire Sparks**, **Laser Beam**, and **Eraser Circle**.
* Midpoint Quadratic Bézier curve interpolation for butter-smooth lines.
* Teleport jump rejection prevents stray lines when twisting hands.
* One-click **High-Resolution PNG Snapshot Export**.

### 2. 🥁 Virtual Air Audio (Air Drums & Synth)
* Floating 3D interactive percussion pads: **Crash, Hi-Hat, Snare, Tom, Kick**.
* 8-Key Melodic Synthesizer keyboard (**C4 through C5**).
* Synthesized in real-time on client hardware using the **Web Audio API** with linear ADSR envelopes and zero audio latency (<5ms).
* Live 128-bin **Fast Fourier Transform (FFT)** frequency spectrum visualizer.

### 3. 🎧 Gesture DJ Console
* **Hand Height (Vertical Y-Axis):** Continuous kinematic volume sliding (0% to 100%).
* **Horizontal Swipe Velocity (dx/dt):** Smooth track skip forward and backward.
* **Closed Fist (✊):** Instant media Play/Pause toggle.

### 4. 👁️ Real-Time Computer Vision Filter Lab
* **3x3 Sobel Operator:** Real-time spatial convolution edge detection kernel highlighting boundary gradients at 60 FPS.
* **Thermal Heatmap & Cyberpunk Shaders:** Direct pixel buffer false-color look-up tables.
* **Sci-Fi Iron-Man HUD:** Holographic targeting reticles and skeletal knuckle tracking.

### 5. 🖱️ Failsafe Mouse Simulation Mode
* Included for presentations in labs without physical webcam access. Simulates 21-point hand landmarks using mouse movements.

---

## 👥 Authors & Academic Credits

Developed as a capstone project for **Multimedia Systems** at **Vellore Institute of Technology (VIT), Vellore**:

* **Rushit Khakhkhar** — `23BIT0289`
* **Nischay Kumar** — `23BIT0191`
* **Sumit Kumar Singh** — `23BIT0144`
* **Project Guide:** **Prof. Maddela Shreshta**, Department of Information Technology, SCORE

---

## 🚀 Running Locally

No heavy frameworks or build steps required. AuraCast runs on vanilla open web standards:

```bash
# Clone the repository
git clone https://github.com/<your-username>/auracast.git
cd auracast

# Run with any static HTTP server (e.g., npx serve, python, or live-server)
npx serve -l 3000 .
# OR
python -m http.server 3000
```
Open `http://localhost:3000` in Google Chrome, Microsoft Edge, or Safari.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
