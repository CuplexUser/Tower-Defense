export class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // AudioContext is initialized on first user interaction
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  playShoot(type: string) {
    if (!this.enabled) return;
    this.init();
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'standard') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'slow') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'aoe') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  }

  playHit() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.05);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.05);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  playDeath() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.3);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  playWaveStart() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(400, now + 0.1);
    osc.frequency.linearRampToValueAtTime(300, now + 0.2);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);

    osc.start(now);
    osc.stop(now + 0.2);
  }
}
