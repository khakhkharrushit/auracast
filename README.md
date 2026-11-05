# ✨ AuraCast — Virtual Multimedia Studio

[![Live App](https://img.shields.io/badge/Live%20App-khakhkharrushit.github.io%2Fauracast-00f2fe.svg?style=for-the-badge&logo=googlechrome)](https://khakhkharrushit.github.io/auracast/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-00f2fe.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Android%20%7C%20iOS%20%7C%20Tablet-10b981.svg)](https://khakhkharrushit.github.io/auracast/)
[![Vision](https://img.shields.io/badge/Vision-MediaPipe%20Hands%20%4060FPS-7928ca.svg)](https://developers.google.com/mediapipe)

> **AuraCast** is an open-source, touchless spatial computing studio engineered around real-time computer vision, client-side digital signal processing (DSP), and hardware-accelerated canvas compositing. Users control digital artwork, musical instruments, video filters, and media playback purely through natural physical hand gestures via their device camera.

🌐 **Try the Live App:** [https://khakhkharrushit.github.io/auracast/](https://khakhkharrushit.github.io/auracast/)

---

## 📲 How to Install as an App on Any Device

AuraCast is a **Progressive Web App (PWA)** that installs directly onto your device without needing an app store. Once installed, it runs full-screen, works with front/rear cameras, and functions offline.

### 🤖 Android (Phones & Tablets)
1. Open **Google Chrome** on your Android device and visit:  
   👉 **[https://khakhkharrushit.github.io/auracast/](https://khakhkharrushit.github.io/auracast/)**
2. Tap the **`📲 Install App`** button on the top menu (or tap the **three dots `⋮`** at top-right $\rightarrow$ **Install app** / **Add to Home screen**).
3. Tap **Install**. The AuraCast app icon will now appear on your home screen and app drawer.
4. Open it, tap **Allow** for camera access, and enjoy!

### 🍏 iPhone & iPad (iOS / iPadOS)
1. Open **Safari** on your iPhone or iPad and visit:  
   👉 **[https://khakhkharrushit.github.io/auracast/](https://khakhkharrushit.github.io/auracast/)**
2. Tap the **Share button** at the bottom (the square with an arrow pointing upward).
3. Scroll down the menu and tap **Add to Home Screen**.
4. Tap **Add** in the top right corner.
5. AuraCast will now launch from your home screen in standalone full-screen mode like a native iOS app.

### 💻 Windows, Mac & Chromebook
1. Open **Google Chrome** or **Microsoft Edge** and go to:  
   👉 **[https://khakhkharrushit.github.io/auracast/](https://khakhkharrushit.github.io/auracast/)**
2. Click the **Install icon** in the right corner of the URL address bar (or click **`📲 Install App`** in the top navigation bar).
3. Tap **Install** to add AuraCast to your desktop / taskbar.

---

## ⚡ Optimal Setup for 60 FPS Smooth Performance

To get the smoothest tracking and zero audio lag on any phone, tablet, or PC, follow these quick tips:

1. **Camera Permissions:** When prompted, select **"Allow"** for Camera.
   * *Tip:* If the camera doesn't start, ensure no other application (Zoom, Teams, another tab) is actively using the webcam. You can also tap **`📷 Restart Cam`** anytime.
2. **Audio Activation:** Modern mobile browsers restrict audio until first touch. Tap the **`🔊 Enable Sound`** button once to activate the Web Audio synthesizer.
3. **Lighting & Distance:**
   * Keep your hand **1.5 to 3 feet** away from the camera in a reasonably lit room.
   * Frame your hand so the palm faces the camera.
4. **Camera Switching (Mobile / Tablets):**
   * Tap the **`🔄 Flip Cam`** button to switch between the front selfie camera (for mid-air drawing) and the rear camera.
5. **No Camera? (Presentation / Testing Mode):**
   * Tap **`🖱️ Mouse Mode`** to simulate 21-point hand landmarks and drawing using mouse drag or touchscreen touch!

---

## 🎮 Core Features & Gesture Guide

| Gesture | Mode | Function |
| :--- | :--- | :--- |
| **☝️ Index Point** | **Air Canvas** | Hold & move in mid-air to paint with glowing neon lines. |
| **✋ Open Palm** | **Air Canvas** | Hand turns into a circular eraser to wipe off ink. |
| **☝️ Tap Fingertip** | **Air Synth & Drums** | Strike floating pads (Crash, Hi-Hat, Snare, Tom, Kick) & piano keys. |
| **↕️ Move Hand Up/Down** | **Gesture DJ Deck** | Smoothly slide master volume from 20% to 100%. |
| **💨 Swipe Left / Right** | **Gesture DJ Deck** | Fast hand wave skips to next or previous track. |
| **✊ Closed Fist** | **Gesture DJ Deck** | Instant media Play / Pause toggle. |
| **🔘 Filters** | **Vision Filters** | Real-time 3x3 Sobel spatial edge detection & thermal heatmaps. |

---

## 🛠️ Technical Architecture

* **Vision Engine:** MediaPipe Hands running at 60 FPS (`modelComplexity: 0`) with relative finger extension ratios and Exponential Moving Average (EMA) coordinate smoothing.
* **Audio Synthesis:** Client-side Web Audio API (`AudioContext`) with custom oscillators, noise buffers, and linear ADSR envelopes—**zero external audio sample files, < 2ms latency**.
* **Canvas Compositor:** 3-layer hardware-accelerated HTML5 Canvas with Midpoint Quadratic Bézier curve interpolation and particle physics.
* **PWA & Offline Shell:** Service Worker caching (`sw.js`) with Web App Manifest (`manifest.json`) compliant with modern installability criteria.

---

## 💻 Running Locally from Source

If you want to clone and run or modify the source code locally on your machine:

```bash
# 1. Clone the repository
git clone https://github.com/khakhkharrushit/auracast.git
cd auracast

# 2. Start a local static HTTP server (Node.js or Python)
npx serve -l 3000 .
# OR
python -m http.server 3000
```
Open **`http://localhost:3000`** in your browser.

---

## 👥 Authors & Academic Credits

Developed as a capstone project for the course **Multimedia Systems** at **Vellore Institute of Technology (VIT), Vellore**:

* **Rushit Khakhkhar** — `23BIT0289`
* **Nischay Kumar** — `23BIT0191`
* **Sumit Kumar Singh** — `23BIT0144`
* **Project Guide:** **Prof. Maddela Shreshta**, Department of Information Technology, School of Computer Science Engineering and Information Systems (SCORE)

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
