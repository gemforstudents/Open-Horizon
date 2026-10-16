/**
 * HORIZON: OPEN ROADS - High-Fidelity Procedural Audio Engine
 * 100% procedural Web Audio synthesis with:
 * - Multi-harmonic V8/V10 engine simulation with intake roar and load dynamics
 * - Warm analog-style soft saturation (no harsh digital buzz or mobile speaker clipping)
 * - Dynamic high-RPM turbocharger spool whine
 * - Authentic deceleration multi-crackle exhaust pops & blow-off valve release
 * - Dual-layer tire friction (asphalt screech vs dirt/gravel spray)
 * - Deep aerodynamic wind rush at high speed
 * - Heavy sub-bass metal collision punch
 * - Upbeat Forza-style festival synth music for Title and Garage screens
 * - Clean pause/silence engine methods to prevent droning during menus
 */

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Engine audio nodes
  private engineMasterGain: GainNode | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineOsc3: OscillatorNode | null = null;
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
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientBassOsc: OscillatorNode | null = null;
  private musicInterval: number | null = null;

  private soundVolume: number = 0.85;
  private musicVolume: number = 0.55;
  private isInitialized: boolean = false;
  private isMuted: boolean = false;
  private isEngineRunning: boolean = false;

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
      this.resume();
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
        this.isMuted ? 0 : musicVol * 0.22,
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

    // Warm resonant exhaust chamber filter
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(2.8, this.ctx.currentTime);

    // Smooth analog soft-saturation curve (prevents digital clipping/fuzz)
    const distortion = this.ctx.createWaveShaper();
    distortion.curve = this.makeWarmSaturationCurve() as any;
    distortion.oversample = '2x';

    // 1. Primary cylinder firing pulses (Sawtooth)
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(50, this.ctx.currentTime);

    // 2. Secondary firing harmonic (slightly detuned for natural engine rumble)
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'sawtooth';
    this.engineOsc2.frequency.setValueAtTime(101.2, this.ctx.currentTime);
    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.engineOsc2.connect(osc2Gain);

    // 3. High-order combustion overtone (Triangle with subtle rasp)
    this.engineOsc3 = this.ctx.createOscillator();
    this.engineOsc3.type = 'triangle';
    this.engineOsc3.frequency.setValueAtTime(150, this.ctx.currentTime);
    const osc3Gain = this.ctx.createGain();
    osc3Gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    this.engineOsc3.connect(osc3Gain);

    // 4. Sub-bass crankshaft punch (Sine)
    this.engineSubOsc = this.ctx.createOscillator();
    this.engineSubOsc.type = 'sine';
    this.engineSubOsc.frequency.setValueAtTime(25, this.ctx.currentTime);
    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
    this.engineSubOsc.connect(subGain);

    // Throttle intake boom filter & gain
    this.engineIntakeFilter = this.ctx.createBiquadFilter();
    this.engineIntakeFilter.type = 'bandpass';
    this.engineIntakeFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
    this.engineIntakeFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);
    this.engineIntakeGain = this.ctx.createGain();
    this.engineIntakeGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    // Node connections
    this.engineOsc1.connect(distortion);
    osc2Gain.connect(distortion);
    osc3Gain.connect(distortion);
    subGain.connect(distortion);

    distortion.connect(this.engineFilter);
    this.engineFilter.connect(this.engineMasterGain);

    distortion.connect(this.engineIntakeFilter);
    this.engineIntakeFilter.connect(this.engineIntakeGain);
    this.engineIntakeGain.connect(this.engineMasterGain);

    this.engineMasterGain.connect(this.masterGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
    this.engineOsc3.start();
    this.engineSubOsc.start();
  }

  private setupTurbo(): void {
    if (!this.ctx || !this.masterGain) return;

    this.turboOsc = this.ctx.createOscillator();
    this.turboOsc.type = 'sine';
    this.turboOsc.frequency.setValueAtTime(1200, this.ctx.currentTime);

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
    this.windFilter.frequency.setValueAtTime(280, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

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
    this.tireFilter.frequency.setValueAtTime(1150, this.ctx.currentTime);
    this.tireFilter.Q.setValueAtTime(4.5, this.ctx.currentTime);

    this.tireGain = this.ctx.createGain();
    this.tireGain.gain.setValueAtTime(0, this.ctx.currentTime);

    tireSource.connect(this.tireFilter);
    this.tireFilter.connect(this.tireGain);
    this.tireGain.connect(this.masterGain);

    tireSource.start();

    // Dirt / gravel spray
    const dirtSource = this.ctx.createBufferSource();
    dirtSource.buffer = noiseBuffer;
    dirtSource.loop = true;

    this.dirtSprayFilter = this.ctx.createBiquadFilter();
    this.dirtSprayFilter.type = 'bandpass';
    this.dirtSprayFilter.frequency.setValueAtTime(600, this.ctx.currentTime);
    this.dirtSprayFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

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
    this.ambientGain.gain.setValueAtTime(this.musicVolume * 0.22, this.ctx.currentTime);

    // Warm synthesizer chord pad for Horizon Festival atmosphere
    this.ambientOsc1 = this.ctx.createOscillator();
    this.ambientOsc1.type = 'sine';
    this.ambientOsc1.frequency.setValueAtTime(130.81, this.ctx.currentTime); // C3

    this.ambientOsc2 = this.ctx.createOscillator();
    this.ambientOsc2.type = 'triangle';
    this.ambientOsc2.frequency.setValueAtTime(196.0, this.ctx.currentTime); // G3

    this.ambientBassOsc = this.ctx.createOscillator();
    this.ambientBassOsc.type = 'sine';
    this.ambientBassOsc.frequency.setValueAtTime(65.4, this.ctx.currentTime); // C2

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, this.ctx.currentTime);

    const bassGain = this.ctx.createGain();
    bassGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    this.ambientBassOsc.connect(bassGain);

    this.ambientOsc1.connect(filter);
    this.ambientOsc2.connect(filter);
    bassGain.connect(filter);

    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);

    this.ambientOsc1.start();
    this.ambientOsc2.start();
    this.ambientBassOsc.start();

    // Subtle festival chord progression every 4 seconds
    const chords = [
      { c1: 130.81, c2: 196.0, bass: 65.4 }, // C
      { c1: 146.83, c2: 220.0, bass: 73.4 }, // Dm
      { c1: 164.81, c2: 246.9, bass: 82.4 }, // Em
      { c1: 174.61, c2: 261.6, bass: 87.3 }, // F
    ];
    let step = 0;
    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.ambientOsc1 || !this.ambientOsc2 || !this.ambientBassOsc) return;
      step = (step + 1) % chords.length;
      const target = chords[step];
      const now = this.ctx.currentTime;
      this.ambientOsc1.frequency.setTargetAtTime(target.c1, now, 0.8);
      this.ambientOsc2.frequency.setTargetAtTime(target.c2, now, 0.8);
      this.ambientBassOsc.frequency.setTargetAtTime(target.bass, now, 0.8);
    }, 4000);
  }

  /**
   * Warm tube saturation curve: smooth tanh-like curve that enriches bass harmonics
   * without creating harsh metallic square waves or crackles on phone speakers.
   */
  private makeWarmSaturationCurve(): Float32Array {
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      // Hyperbolic tangent saturation
      curve[i] = Math.tanh(x * 1.8);
    }
    return curve;
  }

  public silenceEngine(): void {
    if (!this.isInitialized || !this.ctx || !this.engineMasterGain) return;
    this.isEngineRunning = false;
    const now = this.ctx.currentTime;
    this.engineMasterGain.gain.setTargetAtTime(0.0, now, 0.08);
    if (this.turboGain) this.turboGain.gain.setTargetAtTime(0.0, now, 0.08);
    if (this.windGain) this.windGain.gain.setTargetAtTime(0.0, now, 0.08);
    if (this.tireGain) this.tireGain.gain.setTargetAtTime(0.0, now, 0.08);
    if (this.dirtSprayGain) this.dirtSprayGain.gain.setTargetAtTime(0.0, now, 0.08);
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
      !this.engineOsc3 ||
      !this.engineSubOsc ||
      !this.engineMasterGain ||
      !this.engineFilter ||
      !this.engineIntakeGain
    )
      return;

    this.isEngineRunning = true;
    const now = this.ctx.currentTime;

    const normRpm = Math.min(Math.max((rpm - 800) / 7700, 0), 1);

    // Natural engine firing frequency calculation
    const targetFreq = baseFreq + normRpm * 240;
    const targetFilter = 380 + normRpm * 2200 + throttle * 900;
    const targetGain = (0.24 + throttle * 0.32 + normRpm * 0.16) * (this.isMuted ? 0 : 1);

    this.engineOsc1.frequency.setTargetAtTime(targetFreq, now, 0.04);
    this.engineOsc2.frequency.setTargetAtTime(targetFreq * 2.02, now, 0.04);
    this.engineOsc3.frequency.setTargetAtTime(targetFreq * 3.01, now, 0.04);
    this.engineSubOsc.frequency.setTargetAtTime(targetFreq * 0.5, now, 0.04);
    this.engineFilter.frequency.setTargetAtTime(targetFilter, now, 0.04);
    this.engineMasterGain.gain.setTargetAtTime(targetGain, now, 0.04);

    // Throttle intake growl when stepping on gas
    this.engineIntakeGain.gain.setTargetAtTime(throttle * 0.4, now, 0.05);

    // High-RPM turbocharger spool whine
    if (this.turboOsc && this.turboGain) {
      const turboFreq = 1400 + normRpm * 3800;
      const turboVol = Math.max(0, (normRpm - 0.25) * 0.16 * throttle) * (this.isMuted ? 0 : 1);
      this.turboOsc.frequency.setTargetAtTime(turboFreq, now, 0.05);
      this.turboGain.gain.setTargetAtTime(turboVol, now, 0.05);
    }

    // High-speed aerodynamic wind rush
    if (this.windGain && this.windFilter) {
      const speedNorm = Math.min(speedKmh / 260, 1.0);
      const windVol = speedNorm * speedNorm * 0.24 * (this.isMuted ? 0 : 1);
      const windFreq = 240 + speedNorm * 1100;
      this.windGain.gain.setTargetAtTime(windVol, now, 0.08);
      this.windFilter.frequency.setTargetAtTime(windFreq, now, 0.08);
    }

    // Exhaust backfire crackle pops on sudden throttle release from high RPM
    if (this.lastThrottle > 0.65 && throttle < 0.15 && this.lastRpm > 4200 && this.popCooldown <= 0) {
      this.playExhaustPop();
      this.popCooldown = 0.5;
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
      const slipAmount = Math.min(Math.max(driftSlip, 0.25), 1.5);

      if (isAsphalt) {
        const targetTireGain = Math.min(slipAmount * 0.36, 0.42) * (this.isMuted ? 0 : 1);
        const targetFreq = 1250 + Math.min(slipAmount * 650, 1100);
        this.tireGain.gain.setTargetAtTime(targetTireGain, now, 0.04);
        this.tireFilter.frequency.setTargetAtTime(targetFreq, now, 0.04);
        this.dirtSprayGain.gain.setTargetAtTime(0, now, 0.05);
      } else {
        // Dirt / gravel sliding spray
        const targetDirtGain = Math.min(slipAmount * 0.38, 0.44) * (this.isMuted ? 0 : 1);
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
      // Multi-crackle backfire
      const pops = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < pops; i++) {
        const delay = i * (0.05 + Math.random() * 0.03);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140 + Math.random() * 60, now + delay);
        osc.frequency.exponentialRampToValueAtTime(30, now + delay + 0.06);

        gain.gain.setValueAtTime(0.24, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.065);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + delay);
        osc.stop(now + delay + 0.07);
      }
    } catch {}
  }

  public playGearShift(): void {
    if (!this.isInitialized || !this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Blow-off valve release "pssshh"
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.09);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.095);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.1);
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
      osc1.frequency.setValueAtTime(880.0, now + 0.07); // A5
      osc2.frequency.setValueAtTime(1174.66, now + 0.07); // D6

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now + 0.07);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch {}
  }

  public playSpeedTrap(): void {
    if (!this.isInitialized || !this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(2400, now + 0.15);

      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch {}
  }

  public playCollision(intensity: number = 1.0): void {
    if (!this.isInitialized || !this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      // Low sub-bass impact thud
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(130, now);
      subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.22);

      const vol = Math.min(intensity * 0.45, 0.55);
      subGain.gain.setValueAtTime(vol, now);
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subOsc.start(now);
      subOsc.stop(now + 0.26);

      // Crunch transient
      const crunchOsc = this.ctx.createOscillator();
      const crunchGain = this.ctx.createGain();
      crunchOsc.type = 'triangle';
      crunchOsc.frequency.setValueAtTime(260, now);
      crunchOsc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
      crunchGain.gain.setValueAtTime(vol * 0.6, now);
      crunchGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      crunchOsc.connect(crunchGain);
      crunchGain.connect(this.masterGain);
      crunchOsc.start(now);
      crunchOsc.stop(now + 0.13);
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
      osc.frequency.setValueAtTime(783.99, now + 0.07);
      osc.frequency.setValueAtTime(1046.5, now + 0.14);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.42);
    } catch {}
  }

  public playClick(): void {
    if (!this.isInitialized || !this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.035);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.045);
    } catch {}
  }
}

export const audio = new AudioManager();
