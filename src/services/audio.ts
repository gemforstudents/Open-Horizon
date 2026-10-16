/**
 * HORIZON: OPEN ROADS - High-Fidelity Procedural Audio Engine
 * 100% procedural Web Audio synthesis with:
 * - Multi-layer harmonic V8/V10 engine simulation with intake roar and load dynamics
 * - High-RPM turbocharger spool whine
 * - Deceleration exhaust pops and gear shift blow-off
 * - Dual-layer tire squeal with surface differentiation (asphalt screech vs dirt spray)
 * - Dynamic high-speed aerodynamic wind rush
 * - Heavy metal collision impact with sub-bass punch
 * - Crisp festival sound effects & ambient music
 */

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Engine audio nodes
  private engineMasterGain: GainNode | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineIntakeGain: GainNode | null = null;
  private engineIntakeFilter: BiquadFilterNode | null = null;

  // Turbocharger spool
  private turboOsc: OscillatorNode | null = null;
  private turboGain: GainNode | null = null;

  // Wind rush noise
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  // Tire skid noise
  private tireGain: GainNode | null = null;
  private tireFilter: BiquadFilterNode | null = null;
  private dirtSprayGain: GainNode | null = null;
  private dirtSprayFilter: BiquadFilterNode | null = null;

  // Ambient festival music
  private ambientGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientChordOsc: OscillatorNode | null = null;

  private soundVolume: number = 0.85;
  private musicVolume: number = 0.55;
  private isInitialized: boolean = false;
  private isMuted: boolean = false;

  private lastThrottle: number = 0;
  private lastRpm: number = 850;
  private popCooldown: number = 0;

  public init(): void {
    if (this.isInitialized) {
      this.resume();
      return;
    }
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.soundVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupEngine();
      this.setupTurbo();
      this.setupWindNoise();
      this.setupTireNoise();
      this.setupAmbient();

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio initialization error:', e);
    }
  }

  public resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolumes(soundVol: number, musicVol: number): void {
    this.soundVolume = soundVol;
    this.musicVolume = musicVol;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : soundVol, this.ctx.currentTime, 0.05);
    }
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(
        this.isMuted ? 0 : musicVol * 0.16,
        this.ctx.currentTime,
        0.05
      );
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.setVolumes(this.soundVolume, this.musicVolume);
    return this.isMuted;
  }

  private setupEngine(): void {
    if (!this.ctx || !this.masterGain) return;

    this.engineMasterGain = this.ctx.createGain();
    this.engineMasterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    // Main engine resonant filter
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(650, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(4.2, this.ctx.currentTime);

    // Distortion shaper for combustion growl
    const distortion = this.ctx.createWaveShaper();
    distortion.curve = this.makeDistortionCurve(35) as any;
    distortion.oversample = '2x';

    // Primary firing pulse (Sawtooth)
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(45, this.ctx.currentTime);

    // Secondary harmonic (Slightly detuned for multi-cylinder richness)
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'sawtooth';
    this.engineOsc2.frequency.setValueAtTime(90.5, this.ctx.currentTime);
    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.45, this.ctx.currentTime);
    this.engineOsc2.connect(osc2Gain);

    // Sub-bass crankshaft rumble (Triangle)
    this.engineSubOsc = this.ctx.createOscillator();
    this.engineSubOsc.type = 'triangle';
    this.engineSubOsc.frequency.setValueAtTime(22.5, this.ctx.currentTime);
    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.engineSubOsc.connect(subGain);

    // Throttle intake boom
    this.engineIntakeFilter = this.ctx.createBiquadFilter();
    this.engineIntakeFilter.type = 'bandpass';
    this.engineIntakeFilter.frequency.setValueAtTime(120, this.ctx.currentTime);
    this.engineIntakeFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);
    this.engineIntakeGain = this.ctx.createGain();
    this.engineIntakeGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

    // Connections
    this.engineOsc1.connect(distortion);
    osc2Gain.connect(distortion);
    subGain.connect(distortion);

    distortion.connect(this.engineFilter);
    this.engineFilter.connect(this.engineMasterGain);

    distortion.connect(this.engineIntakeFilter);
    this.engineIntakeFilter.connect(this.engineIntakeGain);
    this.engineIntakeGain.connect(this.engineMasterGain);

    this.engineMasterGain.connect(this.masterGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
    this.engineSubOsc.start();
  }

  private setupTurbo(): void {
    if (!this.ctx || !this.masterGain) return;

    this.turboOsc = this.ctx.createOscillator();
    this.turboOsc.type = 'sine';
    this.turboOsc.frequency.setValueAtTime(1400, this.ctx.currentTime);

    this.turboGain = this.ctx.createGain();
    this.turboGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.turboOsc.connect(this.turboGain);
    this.turboGain.connect(this.masterGain);

    this.turboOsc.start();
  }

  private setupWindNoise(): void {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const windSource = this.ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);

    windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    windSource.start();
  }

  private setupTireNoise(): void {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    // Asphalt tire screech
    const tireSource = this.ctx.createBufferSource();
    tireSource.buffer = noiseBuffer;
    tireSource.loop = true;

    this.tireFilter = this.ctx.createBiquadFilter();
    this.tireFilter.type = 'bandpass';
    this.tireFilter.frequency.setValueAtTime(1600, this.ctx.currentTime);
    this.tireFilter.Q.setValueAtTime(5.5, this.ctx.currentTime);

    this.tireGain = this.ctx.createGain();
    this.tireGain.gain.setValueAtTime(0, this.ctx.currentTime);

    tireSource.connect(this.tireFilter);
    this.tireFilter.connect(this.tireGain);
    this.tireGain.connect(this.masterGain);

    tireSource.start();

    // Dirt & Gravel spray
    const dirtSource = this.ctx.createBufferSource();
    dirtSource.buffer = noiseBuffer;
    dirtSource.loop = true;

    this.dirtSprayFilter = this.ctx.createBiquadFilter();
    this.dirtSprayFilter.type = 'bandpass';
    this.dirtSprayFilter.frequency.setValueAtTime(650, this.ctx.currentTime);
    this.dirtSprayFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);

    this.dirtSprayGain = this.ctx.createGain();
    this.dirtSprayGain.gain.setValueAtTime(0, this.ctx.currentTime);

    dirtSource.connect(this.dirtSprayFilter);
    this.dirtSprayFilter.connect(this.dirtSprayGain);
    this.dirtSprayGain.connect(this.masterGain);

    dirtSource.start();
  }

  private setupAmbient(): void {
    if (!this.ctx || !this.masterGain) return;

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(this.musicVolume * 0.16, this.ctx.currentTime);

    this.ambientOsc = this.ctx.createOscillator();
    this.ambientOsc.type = 'sine';
    this.ambientOsc.frequency.setValueAtTime(110, this.ctx.currentTime); // A2

    this.ambientChordOsc = this.ctx.createOscillator();
    this.ambientChordOsc.type = 'triangle';
    this.ambientChordOsc.frequency.setValueAtTime(164.81, this.ctx.currentTime); // E3

    const chordGain = this.ctx.createGain();
    chordGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    this.ambientChordOsc.connect(chordGain);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, this.ctx.currentTime);

    this.ambientOsc.connect(filter);
    chordGain.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);

    this.ambientOsc.start();
    this.ambientChordOsc.start();
  }

  private makeDistortionCurve(amount: number): Float32Array {
    const k = typeof amount === 'number' ? amount : 50;
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  public updateEngine(
    rpm: number,
    throttle: number,
    baseFreq: number = 48,
    speedKmh: number = 0
  ): void {
    if (
      !this.isInitialized ||
      !this.ctx ||
      !this.engineOsc1 ||
      !this.engineOsc2 ||
      !this.engineSubOsc ||
      !this.engineMasterGain ||
      !this.engineFilter ||
      !this.engineIntakeGain
    )
      return;

    const normRpm = Math.min(Math.max((rpm - 800) / 7700, 0), 1);
    const targetFreq = baseFreq + normRpm * 260;
    const targetFilter = 450 + normRpm * 2800 + throttle * 1100;
    const targetGain = (0.2 + throttle * 0.28 + normRpm * 0.18) * (this.isMuted ? 0 : 1);

    const now = this.ctx.currentTime;
    this.engineOsc1.frequency.setTargetAtTime(targetFreq, now, 0.035);
    this.engineOsc2.frequency.setTargetAtTime(targetFreq * 2.01, now, 0.035);
    this.engineSubOsc.frequency.setTargetAtTime(targetFreq * 0.5, now, 0.035);
    this.engineFilter.frequency.setTargetAtTime(targetFilter, now, 0.035);
    this.engineMasterGain.gain.setTargetAtTime(targetGain, now, 0.035);

    // Intake throttle roar
    this.engineIntakeGain.gain.setTargetAtTime(throttle * 0.35, now, 0.04);

    // Turbo spool sound
    if (this.turboOsc && this.turboGain) {
      const turboFreq = 1200 + normRpm * 4200;
      const turboVol = Math.max(0, (normRpm - 0.3) * 0.18 * throttle) * (this.isMuted ? 0 : 1);
      this.turboOsc.frequency.setTargetAtTime(turboFreq, now, 0.05);
      this.turboGain.gain.setTargetAtTime(turboVol, now, 0.05);
    }

    // High-speed wind noise
    if (this.windGain && this.windFilter) {
      const speedNorm = Math.min(speedKmh / 280, 1.0);
      const windVol = (speedNorm * speedNorm * 0.22) * (this.isMuted ? 0 : 1);
      const windFreq = 260 + speedNorm * 1200;
      this.windGain.gain.setTargetAtTime(windVol, now, 0.08);
      this.windFilter.frequency.setTargetAtTime(windFreq, now, 0.08);
    }

    // Exhaust pops on sudden throttle release from high RPM
    if (this.lastThrottle > 0.7 && throttle < 0.2 && this.lastRpm > 4500 && this.popCooldown <= 0) {
      this.playExhaustPop();
      this.popCooldown = 0.6;
    }
    if (this.popCooldown > 0) {
      this.popCooldown -= 0.03;
    }

    this.lastThrottle = throttle;
    this.lastRpm = rpm;
  }

  public updateTireSqueal(
    isDrifting: boolean,
    driftSlip: number,
    surface: 'asphalt' | 'dirt' | 'grass' = 'asphalt'
  ): void {
    if (!this.isInitialized || !this.ctx || !this.tireGain || !this.tireFilter || !this.dirtSprayGain)
      return;

    const now = this.ctx.currentTime;
    const isAsphalt = surface === 'asphalt';

    if (isDrifting) {
      const slipAmount = Math.min(Math.max(driftSlip, 0.2), 1.5);

      if (isAsphalt) {
        const targetTireGain = Math.min(slipAmount * 0.38, 0.45) * (this.isMuted ? 0 : 1);
        const targetFreq = 1400 + Math.min(slipAmount * 700, 1200);
        this.tireGain.gain.setTargetAtTime(targetTireGain, now, 0.04);
        this.tireFilter.frequency.setTargetAtTime(targetFreq, now, 0.04);
        this.dirtSprayGain.gain.setTargetAtTime(0, now, 0.05);
      } else {
        // Dirt / gravel sliding spray
        const targetDirtGain = Math.min(slipAmount * 0.42, 0.48) * (this.isMuted ? 0 : 1);
        this.dirtSprayGain.gain.setTargetAtTime(targetDirtGain, now, 0.04);
        this.tireGain.gain.setTargetAtTime(0, now, 0.05);
      }
    } else {
      this.tireGain.gain.setTargetAtTime(0, now, 0.06);
      this.dirtSprayGain.gain.setTargetAtTime(0, now, 0.06);
    }
  }

  public playExhaustPop(): void {
    if (!this.isInitialized || !this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Dual crackle pop
      for (let i = 0; i < 2; i++) {
        const delay = i * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110 + Math.random() * 40, now + delay);
        osc.frequency.exponentialRampToValueAtTime(25, now + delay + 0.06);

        gain.gain.setValueAtTime(0.28, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.07);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + delay);
        osc.stop(now + delay + 0.08);
      }
    } catch {}
  }

  public playGearShift(): void {
    if (!this.isInitialized || !this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Throttle dump + blow-off "psshh"
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.1);

      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.11);
    } catch {}
  }

  public playCheckpoint(): void {
    if (!this.isInitialized || !this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(880.0, now + 0.08); // A5
      osc2.frequency.setValueAtTime(1174.66, now + 0.08); // D6

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now + 0.08);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    } catch {}
  }

  public playSpeedTrap(): void {
    if (!this.isInitialized || !this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(850, now);
      osc.frequency.exponentialRampToValueAtTime(2800, now + 0.16);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  public playCollision(intensity: number = 1.0): void {
    if (!this.isInitialized || !this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Low sub bass impact
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(140, now);
      subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

      const vol = Math.min(intensity * 0.55, 0.6);
      subGain.gain.setValueAtTime(vol, now);
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subOsc.start(now);
      subOsc.stop(now + 0.3);

      // Crunch transient
      const crunchOsc = this.ctx.createOscillator();
      const crunchGain = this.ctx.createGain();
      crunchOsc.type = 'square';
      crunchOsc.frequency.setValueAtTime(320, now);
      crunchOsc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
      crunchGain.gain.setValueAtTime(vol * 0.7, now);
      crunchGain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

      crunchOsc.connect(crunchGain);
      crunchGain.connect(this.masterGain);
      crunchOsc.start(now);
      crunchOsc.stop(now + 0.15);
    } catch {}
  }

  public playXpBoard(): void {
    if (!this.isInitialized || !this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(783.99, now + 0.08);
      osc.frequency.setValueAtTime(1046.5, now + 0.16);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.48);
    } catch {}
  }

  public playClick(): void {
    if (!this.isInitialized || !this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.04);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }
}

export const audio = new AudioManager();
