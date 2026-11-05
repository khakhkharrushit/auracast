/**
 * AuraCast Gesture DJ & Media Deck
 * Natural Gesture Media Control: Hand Height = Volume, Swipe = Track Skip, Fist = Play/Pause
 * Integrated with real MP3 audio tracks starting >30 seconds from beginning
 * Dynamic Web Audio API Frequency Analysis & Audio-Reactive Vinyl Rendering
 * Covers Module 2 (Sound & Audio), Module 4 (Video & Animation), Module 7 (Real-time Interaction)
 */

class MediaDeck {
  constructor() {
    this.active = false;
    this.isPlaying = false;
    this.currentTrackIndex = 0;
    this.volume = 0.75;
    this.zoomScale = 1.0;

    // 3 Real User Tracks with start timestamps cued after 30 seconds
    this.tracks = [
      {
        title: 'Jamal Kudu',
        artist: 'Abrar’s Entry (Animal)',
        file: 'audio/jamal_kudu.mp3',
        startTime: 32.0, // Cued at 32 seconds (chorus beat)
        bpm: 128,
        genre: 'Bollywood / Qawwali'
      },
      {
        title: 'Oo Antava Oo Oo Antava',
        artist: 'Indravathi Chauhan (Pushpa)',
        file: 'audio/oo_antava.mp3',
        startTime: 35.0, // Cued at 35 seconds (hook groove)
        bpm: 132,
        genre: 'Telugu Item / Dance'
      },
      {
        title: 'Paththavaikkum',
        artist: 'Anirudh Ravichander (Jailer)',
        file: 'audio/paththavaikkum.mp3',
        startTime: 33.0, // Cued at 33 seconds (electronic drop)
        bpm: 130,
        genre: 'Tamil Kuthu / Electronic'
      }
    ];

    // Vinyl rotation angle for animation
    this.vinylAngle = 0;

    // Gesture debounce
    this.lastToggleTime = 0;
    this.toggleCooldown = 800; // ms

    // Visual notification on gesture trigger (e.g., SWIPE)
    this.notificationText = '';
    this.notificationAlpha = 0;

    // HTML5 Audio element for media deck playback
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.crossOrigin = 'anonymous';
    this.mediaSourceNode = null;
    this.isCued = false;

    this.setupAudioEvents();
  }

  setupAudioEvents() {
    // When track ends, advance to next track starting after 30s
    this.audio.addEventListener('ended', () => {
      this.nextTrack();
    });

    // Real-time time progress updates
    this.audio.addEventListener('timeupdate', () => {
      this.updateProgressUI();
    });

    // When metadata loads, seek immediately to target startTime (>30s)
    this.audio.addEventListener('loadedmetadata', () => {
      this.applyCuePoint();
      this.updateTrackDisplay();
    });

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.updatePlayStateUI();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updatePlayStateUI();
    });

    // Fallback if network or relative URL needs retry
    this.audio.addEventListener('error', (e) => {
      console.warn('Audio playback load note:', e);
    });
  }

  init() {
    console.log('MediaDeck initialized with 3 local MP3 tracks cued >30s.');
    this.loadTrack(0, false);
    this.updateTrackDisplay();
  }

  applyCuePoint() {
    const track = this.tracks[this.currentTrackIndex];
    const targetStartTime = track?.startTime || 32.0;
    try {
      this.audio.currentTime = targetStartTime;
      this.isCued = true;
    } catch (e) {
      console.warn('Seeking to cue point deferred until playback:', e);
    }
  }

  loadTrack(index, autoPlay = false) {
    this.currentTrackIndex = (index + this.tracks.length) % this.tracks.length;
    const track = this.tracks[this.currentTrackIndex];
    if (!track) return;

    const targetStartTime = track.startTime || 32.0;
    this.isCued = false;
    this.audio.src = track.file;
    this.audio.volume = this.volume;
    this.audio.load();

    const cueAndPlay = () => {
      try {
        this.audio.currentTime = targetStartTime;
        this.isCued = true;
      } catch (e) {}
      this.updateTrackDisplay();
      this.updateProgressUI();
      if (autoPlay) {
        this.play();
      }
    };

    this.audio.oncanplay = () => {
      if (!this.isCued) {
        cueAndPlay();
      }
    };

    this.updateTrackDisplay();
  }

  ensureAudioNode() {
    // Route audio into Web Audio API for real-time FFT visualizers
    if (window.audioEngine) {
      window.audioEngine.ensureContext();
      if (window.audioEngine.ctx && !this.mediaSourceNode) {
        try {
          this.mediaSourceNode = window.audioEngine.ctx.createMediaElementSource(this.audio);
          // Connect to master gain (which routes to destination and FFT analyser)
          this.mediaSourceNode.connect(window.audioEngine.masterGain);
        } catch (e) {
          // If already connected or browser restricted, HTML5 audio still plays cleanly
          console.warn('Web Audio Graph node note:', e.message);
        }
      }
    }
    this.audio.volume = this.volume;
  }

  async play() {
    this.ensureAudioNode();
    const track = this.tracks[this.currentTrackIndex];
    const targetStartTime = track?.startTime || 32.0;

    // Enforce user requirement: never start before 30 seconds
    if (this.audio.currentTime < 30.0) {
      try {
        this.audio.currentTime = targetStartTime;
      } catch (e) {}
    }

    try {
      await this.audio.play();
      this.isPlaying = true;
      this.updatePlayStateUI();
    } catch (err) {
      console.warn('Audio play waiting for user interaction:', err);
    }
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.updatePlayStateUI();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
      this.showNotification('⏸ PAUSED (FIST)');
    } else {
      this.play();
      this.showNotification('▶ PLAYING (FIST)');
    }
    if (window.audioEngine) {
      window.audioEngine.playUiClick();
    }
  }

  nextTrack() {
    const wasPlaying = this.isPlaying;
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
    this.loadTrack(this.currentTrackIndex, wasPlaying);
    if (window.audioEngine) {
      window.audioEngine.playSwipeWhoosh(1);
    }
    this.showNotification(`⏭ ${this.tracks[this.currentTrackIndex].title} (SWIPE RIGHT)`);
  }

  prevTrack() {
    const wasPlaying = this.isPlaying;
    this.currentTrackIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
    this.loadTrack(this.currentTrackIndex, wasPlaying);
    if (window.audioEngine) {
      window.audioEngine.playSwipeWhoosh(-1);
    }
    this.showNotification(`⏮ ${this.tracks[this.currentTrackIndex].title} (SWIPE LEFT)`);
  }

  processGesture(event) {
    if (!this.active) return;

    if (event.type === 'SWIPE_RIGHT') {
      this.nextTrack();
    } else if (event.type === 'SWIPE_LEFT') {
      this.prevTrack();
    }
  }

  showNotification(text) {
    this.notificationText = text;
    this.notificationAlpha = 1.0;
  }

  processHands(hands) {
    if (!this.active || !hands || hands.length === 0) return;

    const primaryHand = hands[0];
    const now = performance.now();

    // 1. Hand Height -> Smooth Volume Sliding (Wrist Y coordinate from 0.85 down to 0.15)
    const wristY = primaryHand.landmarks[0].y;
    const normalizedVol = Math.max(0.15, Math.min(1.0, (0.85 - wristY) / 0.70));
    this.setVolume(normalizedVol);

    // 2. Fist -> Play / Pause Toggle
    const gestureName = primaryHand.gesture.name;
    if (gestureName === 'CLOSED_FIST' && (now - this.lastToggleTime > this.toggleCooldown)) {
      this.lastToggleTime = now;
      this.togglePlay();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0.05, Math.min(1.0, vol));
    this.audio.volume = this.volume;
    if (window.audioEngine) {
      window.audioEngine.setMasterVolume(this.volume);
    }
    const volFill = document.getElementById('volume-bar-fill');
    const volText = document.getElementById('volume-text');
    if (volFill) volFill.style.width = `${Math.round(this.volume * 100)}%`;
    if (volText) volText.textContent = `${Math.round(this.volume * 100)}%`;
  }

  formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  updateProgressUI() {
    const cur = this.audio.currentTime || 0;
    const dur = this.audio.duration || 0;
    const curTimeEl = document.getElementById('deck-current-time');
    const durEl = document.getElementById('deck-duration');
    const fillEl = document.getElementById('deck-progress-fill');

    if (curTimeEl) curTimeEl.textContent = this.formatTime(cur);
    if (durEl && dur > 0) durEl.textContent = this.formatTime(dur);
    if (fillEl && dur > 0) {
      const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
      fillEl.style.width = `${pct}%`;
    }
  }

  updatePlayStateUI() {
    const playBtn = document.getElementById('dj-play-btn');
    if (playBtn) {
      playBtn.textContent = this.isPlaying ? 'PAUSE (FIST)' : 'PLAY (FIST)';
      playBtn.classList.toggle('playing', this.isPlaying);
      playBtn.style.background = this.isPlaying ? 'var(--accent-pink)' : 'var(--accent-cyan)';
    }
  }

  updateTrackDisplay() {
    const track = this.tracks[this.currentTrackIndex];
    if (!track) return;
    const titleEl = document.getElementById('deck-track-title');
    const artistEl = document.getElementById('deck-track-artist');
    if (titleEl) titleEl.textContent = track.title;
    if (artistEl) artistEl.textContent = `${track.artist} • ${track.bpm} BPM`;
    this.updateProgressUI();
  }

  render(ctx, w, h) {
    if (!this.active) return;

    ctx.save();

    // 1. Audio-reactive bass frequency pulse
    let beatGlow = 0;
    if (window.audioEngine && this.isPlaying) {
      const freq = window.audioEngine.getFrequencyData();
      if (freq && freq.length > 4) {
        // Sample sub-bass and mid-low bins
        beatGlow = ((freq[1] || 0) + (freq[2] || 0) + (freq[3] || 0)) / (3 * 255);
      }
    }

    if (this.isPlaying) {
      this.vinylAngle += 0.035 + beatGlow * 0.02;
    }

    const discX = w * 0.5;
    const discY = h * 0.48;
    const radius = Math.min(w, h) * 0.22;

    // Glowing outer reactive ring
    ctx.beginPath();
    ctx.arc(discX, discY, radius + 14 + beatGlow * 8, 0, Math.PI * 2);
    ctx.strokeStyle = this.isPlaying ? `rgba(0, 242, 254, ${0.4 + beatGlow * 0.6})` : 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2 + beatGlow * 3;
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = this.isPlaying ? (20 + beatGlow * 30) : 4;
    ctx.stroke();

    // Track Progress Arc around the vinyl
    const cur = this.audio.currentTime || 0;
    const dur = this.audio.duration || 1;
    if (dur > 0) {
      const progressAngle = (cur / dur) * (Math.PI * 2);
      ctx.beginPath();
      ctx.arc(discX, discY, radius + 22, -Math.PI / 2, -Math.PI / 2 + progressAngle);
      ctx.strokeStyle = '#ff007f';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 12;
      ctx.stroke();

      // Cue marker at >30s mark
      const track = this.tracks[this.currentTrackIndex];
      const cueAngle = -Math.PI / 2 + ((track.startTime || 32) / dur) * (Math.PI * 2);
      const cueX = discX + Math.cos(cueAngle) * (radius + 22);
      const cueY = discY + Math.sin(cueAngle) * (radius + 22);
      ctx.beginPath();
      ctx.arc(cueX, cueY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#00f2fe';
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 10;
      ctx.fill();
    }

    // Vinyl Disc Base
    ctx.save();
    ctx.translate(discX, discY);
    ctx.rotate(this.vinylAngle);

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#0b0f19';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = this.isPlaying ? '#00f2fe' : 'rgba(0, 242, 254, 0.4)';
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = this.isPlaying ? 25 : 6;
    ctx.stroke();

    // Vinyl Grooves
    for (let r = radius * 0.45; r < radius * 0.9; r += 12) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.stroke();
    }

    // Center record label with gradient
    const labelGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, radius * 0.35);
    labelGrad.addColorStop(0, '#7928ca');
    labelGrad.addColorStop(1, '#ff007f');
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = labelGrad;
    ctx.fill();

    // Spindle hole
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#08090d';
    ctx.fill();

    ctx.restore();

    // Track Title HUD directly below vinyl
    const track = this.tracks[this.currentTrackIndex];
    ctx.font = 'bold 16px "Outfit", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText(`${track.title} (${track.artist.split('(')[0].trim()})`, discX, discY + radius + 40);

    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f2fe';
    const curTimeStr = this.formatTime(this.audio.currentTime);
    const durTimeStr = this.formatTime(this.audio.duration);
    ctx.fillText(`⏱ ${curTimeStr} / ${durTimeStr}  •  [Cued @ ${this.formatTime(track.startTime)}]`, discX, discY + radius + 62);

    // Big Gesture Swipe / Action Banner Notification
    if (this.notificationAlpha > 0) {
      this.notificationAlpha -= 0.015;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.notificationAlpha);
      ctx.font = 'bold 22px "Outfit", sans-serif';
      ctx.fillStyle = '#00f2fe';
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 15;
      ctx.textAlign = 'center';
      ctx.fillText(this.notificationText, discX, discY - radius - 35);
      ctx.restore();
    }

    // Live Volume Slide Bar on Left of Screen
    const volBarX = w * 0.08;
    const volBarTop = h * 0.25;
    const volBarH = h * 0.5;
    const volBarW = 14;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.roundRect(volBarX, volBarTop, volBarW, volBarH, 7);
    ctx.fill();

    const filledH = volBarH * this.volume;
    const grad = ctx.createLinearGradient(0, volBarTop + volBarH - filledH, 0, volBarTop + volBarH);
    grad.addColorStop(0, '#00f2fe');
    grad.addColorStop(1, '#7928ca');
    ctx.fillStyle = grad;
    ctx.roundRect(volBarX, volBarTop + volBarH - filledH, volBarW, filledH, 7);
    ctx.fill();

    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f2fe';
    ctx.textAlign = 'center';
    ctx.fillText(`VOL ${Math.round(this.volume * 100)}%`, volBarX + 7, volBarTop + volBarH + 22);

    ctx.restore();
  }
}

// Global instance
window.mediaDeck = new MediaDeck();
