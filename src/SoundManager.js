/**
 * SoundManager.js — Procedural audio via Web Audio API
 * Zero external assets. All sounds synthesized in real-time.
 */

class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.muted = localStorage.getItem('laserparty_muted') === 'true';
    }

    /** Resume AudioContext (call on first user interaction) */
    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /** Toggle mute and persist to localStorage */
    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('laserparty_muted', this.muted);
        return this.muted;
    }

    /** Cell selection click — short sine sweep 800→400, 80ms */
    playClick() {
        if (this.muted) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(400, t + 0.08);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        osc.connect(gain).connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.08);
    }

    /** Laser charge warning — rising sawtooth 200→1200, 400ms */
    playLaserCharge() {
        if (this.muted) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.4);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.setValueAtTime(0.2, t + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain).connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.4);
    }

    /** Laser fire — white noise burst + low sine boom, 300ms */
    playLaserFire() {
        if (this.muted) return;
        const t = this.ctx.currentTime;

        // White noise burst
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        // Bandpass filter for shaped noise
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, t);
        filter.Q.setValueAtTime(0.5, t);

        noise.connect(filter).connect(noiseGain).connect(this.ctx.destination);
        noise.start(t);
        noise.stop(t + 0.3);

        // Low sine boom
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.3);

        oscGain.gain.setValueAtTime(0.4, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        osc.connect(oscGain).connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
    }

    /** Survived — two quick ascending tones, 500ms */
    playSurvive() {
        if (this.muted) return;
        const t = this.ctx.currentTime;

        // Tone 1: 400→600
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(400, t);
        osc1.frequency.exponentialRampToValueAtTime(600, t + 0.2);
        gain1.gain.setValueAtTime(0.25, t);
        gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc1.connect(gain1).connect(this.ctx.destination);
        osc1.start(t);
        osc1.stop(t + 0.25);

        // Tone 2: 600→800
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(600, t + 0.25);
        osc2.frequency.exponentialRampToValueAtTime(800, t + 0.45);
        gain2.gain.setValueAtTime(0.001, t);
        gain2.gain.setValueAtTime(0.3, t + 0.25);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc2.connect(gain2).connect(this.ctx.destination);
        osc2.start(t);
        osc2.stop(t + 0.5);
    }

    /** Cashout — ascending arpeggio C4→E4→G4→C5, 600ms */
    playCashout() {
        if (this.muted) return;
        const t = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        const noteDuration = 0.15;

        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const startTime = t + i * noteDuration;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.001, t);
            gain.gain.setValueAtTime(0.3, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

            osc.connect(gain).connect(this.ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + noteDuration);
        });
    }

    /** Bust — low rumble + distorted noise burst, 800ms */
    playBust() {
        if (this.muted) return;
        const t = this.ctx.currentTime;

        // Low frequency rumble (60Hz sine)
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, t);

        oscGain.gain.setValueAtTime(0.4, t);
        oscGain.gain.setValueAtTime(0.4, t + 0.5);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

        osc.connect(oscGain).connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.8);

        // Distorted noise burst
        const bufferSize = this.ctx.sampleRate * 0.8;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.35, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

        // Distortion via waveshaper
        const distortion = this.ctx.createWaveShaper();
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
            const x = (i * 2) / 256 - 1;
            curve[i] = (Math.PI + 10) * x / (Math.PI + 10 * Math.abs(x));
        }
        distortion.curve = curve;

        noise.connect(distortion).connect(noiseGain).connect(this.ctx.destination);
        noise.start(t);
        noise.stop(t + 0.8);
    }

    /** Bust skull appear — deep descending tone 400→80, 600ms with decay */
    playBustSkull() {
        if (this.muted) return;
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.6);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.setValueAtTime(0.3, t + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

        osc.connect(gain).connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.6);

        // Reverb-like decay tail using delayed quieter copy
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(200, t + 0.1);
        osc2.frequency.exponentialRampToValueAtTime(60, t + 0.7);

        gain2.gain.setValueAtTime(0.001, t);
        gain2.gain.setValueAtTime(0.12, t + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

        osc2.connect(gain2).connect(this.ctx.destination);
        osc2.start(t);
        osc2.stop(t + 0.7);
    }
}
