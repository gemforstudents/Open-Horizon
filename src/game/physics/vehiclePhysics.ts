/**
 * HORIZON: OPEN ROADS - Vehicle Physics Engine
 * Semi-fixed timestep simulation, realistic arcade grip/drift dynamics,
 * speed-dependent steering, suspension roll/pitch, and terrain following.
 */

import * as THREE from 'three';
import { VehicleConfig, VehiclePhysicsState, PlayerInput } from '../../types/game';
import { getTerrainHeight, getSurfaceInfo, WORLD_SIZE } from '../world/roadNetwork';

// Pre-allocated math helpers for zero GC in frame loop
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _velocity = new THREE.Vector3();

export class VehiclePhysics {
  public state: VehiclePhysicsState;
  public config: VehicleConfig;

  // Internal physics timers & states
  private currentSteerAngle: number = 0;
  private driftDuration: number = 0;
  private driftComboTimer: number = 0;

  constructor(config: VehicleConfig, initialX: number = 0, initialZ: number = 0, initialHeading: number = 0) {
    this.config = config;
    const initialY = getTerrainHeight(initialX, initialZ) + 0.35;

    this.state = {
      x: initialX,
      y: initialY,
      z: initialZ,
      vx: 0,
      vy: 0,
      vz: 0,
      heading: initialHeading,
      pitch: 0,
      roll: 0,
      speedKmh: 0,
      steeringAngle: 0,
      wheelRotation: 0,
      rpm: 800,
      gear: 1,
      isGrounded: true,
      isDrifting: false,
      driftAngle: 0,
      driftScore: 0,
      driftMultiplier: 1.0,
      surfaceType: 'asphalt',
    };
  }

  public setConfig(config: VehicleConfig): void {
    this.config = config;
  }

  /**
   * Main physics step
   */
  public update(dt: number, input: PlayerInput, sensitivity: number = 1.0): {
    collisionIntensity: number;
    driftEventScore: number;
    isDriftBanked: boolean;
  } {
    // Clamp delta time to avoid physics explosion on lag spikes
    const delta = Math.min(Math.max(dt, 0.001), 0.05);

    let collisionIntensity = 0;
    let driftEventScore = 0;
    let isDriftBanked = false;

    // 1. Current velocity magnitude and direction
    const currentSpeedMs = Math.hypot(this.state.vx, this.state.vz);
    this.state.speedKmh = currentSpeedMs * 3.6;

    // Forward and Right vectors from heading
    const forwardX = Math.sin(this.state.heading);
    const forwardZ = Math.cos(this.state.heading);
    const rightX = Math.cos(this.state.heading);
    const rightZ = -Math.sin(this.state.heading);

    // Speed projection onto local car axes
    const forwardSpeed = this.state.vx * forwardX + this.state.vz * forwardZ;
    const lateralSpeed = this.state.vx * rightX + this.state.vz * rightZ;

    // 2. Surface detection (asphalt, dirt, grass)
    const surfaceInfo = getSurfaceInfo(this.state.x, this.state.z);
    this.state.surfaceType = surfaceInfo.surfaceType;

    let gripMultiplier = 1.0;
    let rollingResistance = 0.015;

    if (this.state.surfaceType === 'dirt') {
      gripMultiplier = this.config.offroadRating >= 8 ? 0.95 : 0.75;
      rollingResistance = 0.04;
    } else if (this.state.surfaceType === 'grass') {
      gripMultiplier = this.config.offroadRating >= 8 ? 0.8 : 0.55;
      rollingResistance = 0.08;
    }

    // 3. Speed-dependent steering smoothing
    // At 0 km/h: max 38 deg steering. At 250+ km/h: smooth down to 12 deg for high stability.
    const speedRatio = Math.min(this.state.speedKmh / 240, 1.0);
    const maxSteerRadians = THREE.MathUtils.degToRad(38 - speedRatio * 26);
    const targetSteerAngle = input.steering * maxSteerRadians * sensitivity;

    // Smooth steering rate
    const steerSpeed = 8.0 * (1.0 - speedRatio * 0.4);
    this.currentSteerAngle = THREE.MathUtils.damp(this.currentSteerAngle, targetSteerAngle, steerSpeed, delta);
    this.state.steeringAngle = this.currentSteerAngle;

    // 4. Engine, Gears & RPM Simulation
    const topSpeedMs = (this.config.topSpeedKmh / 3.6);
    const gearRatios = [0, 3.8, 2.6, 1.8, 1.3, 1.0, 0.8]; // 6-speed gearbox
    const maxRpm = 8500;
    const idleRpm = 850;

    let targetGear = 1;
    if (forwardSpeed < -0.5) {
      targetGear = 0; // Reverse
    } else {
      for (let g = 1; g <= 6; g++) {
        if (currentSpeedMs > (topSpeedMs / 6) * (g - 0.35)) {
          targetGear = Math.min(g + 1, 6);
        }
      }
    }
    this.state.gear = targetGear;

    // Calculate RPM based on current gear speed
    const gearFactor = targetGear === 0 ? 2.5 : gearRatios[targetGear];
    const gearSpeedRatio = Math.min(Math.abs(forwardSpeed) / (topSpeedMs / (7 - targetGear)), 1.0);
    const baseRpm = idleRpm + gearSpeedRatio * (maxRpm - idleRpm) * (gearFactor / 2.0);
    const throttleBonus = input.throttle * 900;
    this.state.rpm = Math.min(Math.max(baseRpm + throttleBonus, idleRpm), maxRpm);

    // 5. Acceleration & Braking Forces
    // 0-100 km/h acceleration curve
    const enginePowerFactor = (100 / 3.6) / this.config.acceleration; // ~7.5 to 11 m/s²
    let engineAccel = 0;

    if (input.throttle > 0) {
      // Smooth power curve with high-speed aerodynamic drag taper
      const speedTaper = Math.max(0.05, 1.0 - Math.pow(currentSpeedMs / topSpeedMs, 2.2));
      engineAccel = input.throttle * enginePowerFactor * speedTaper;
    }

    let brakeDecel = 0;
    if (input.brake > 0) {
      if (forwardSpeed > 1.0) {
        brakeDecel = input.brake * (this.config.braking * 2.2);
      } else {
        // Reverse gear
        engineAccel = -input.brake * (enginePowerFactor * 0.5);
      }
    }

    // 6. Drift & Lateral Traction
    const handbrakeActive = input.handbrake;
    const slipSpeed = Math.abs(lateralSpeed);
    const isHighAngle = Math.abs(lateralSpeed) > 4.2 && currentSpeedMs > 12.0;

    this.state.isDrifting = (handbrakeActive && currentSpeedMs > 6.0) || isHighAngle;

    // Lateral grip response: high arcade grip when not drifting
    let lateralGrip = this.state.isDrifting ? 0.42 : 0.96;
    if (handbrakeActive) {
      lateralGrip *= 0.4;
    }

    // Heading yaw turn rate (High-speed stability + sharp agile turn response)
    let yawTurnRate = 0;
    if (Math.abs(forwardSpeed) > 0.2) {
      const directionSign = forwardSpeed >= 0 ? 1 : -1;
      // High-speed natural turn radius
      const effectiveSpeed = Math.min(Math.max(currentSpeedMs, 4.0), 55.0);
      const baseTurnRate = (effectiveSpeed / 2.6) * Math.tan(this.currentSteerAngle);
      yawTurnRate = baseTurnRate * directionSign * (this.config.handling / 8.5);

      // Oversteer swing when drifting with handbrake or at high angle
      if (this.state.isDrifting) {
        const driftSign = lateralSpeed > 0 ? 1 : -1;
        yawTurnRate += driftSign * 0.45 * Math.min(slipSpeed / 8, 1.6);
      }
    }

    // Apply heading yaw change
    const deltaHeading = yawTurnRate * delta;
    this.state.heading += deltaHeading;

    // 7. Velocity Integration with Centripetal Momentum Preservation
    // Conserves full kinetic energy through turns - power never drops when steering!
    const aeroDrag = 0.0006 * currentSpeedMs * currentSpeedMs;
    const totalForwardAccel = engineAccel - (forwardSpeed > 0 ? (brakeDecel + rollingResistance * 3.0 + aeroDrag) : -aeroDrag);

    // Forward speed along chassis integrates engine power
    let newForwardSpeed = forwardSpeed + totalForwardAccel * delta;
    if (targetGear > 0 && newForwardSpeed < 0 && input.throttle > 0) {
      newForwardSpeed = 0;
    }

    // Centripetal motion: rotate the velocity vector smoothly with car's new heading
    // This ensures cornering DOES NOT kill speed!
    let newLateralSpeed = lateralSpeed;
    if (this.state.isDrifting) {
      // Controlled slip during drift
      newLateralSpeed = lateralSpeed * Math.exp(-lateralGrip * 3.0 * delta);
    } else {
      // When gripping, lateral momentum transfers seamlessly into forward motion (conservation of speed)
      const totalSpeedBeforeTurn = Math.hypot(newForwardSpeed, lateralSpeed);
      newLateralSpeed = lateralSpeed * Math.exp(-lateralGrip * 9.0 * delta);
      // Re-normalize forward speed to maintain momentum through curves
      if (input.throttle > 0 && totalSpeedBeforeTurn > newForwardSpeed) {
        newForwardSpeed = Math.max(newForwardSpeed, totalSpeedBeforeTurn * 0.99);
      }
    }

    // Compute updated forward/right vectors based on new heading
    const newForwardX = Math.sin(this.state.heading);
    const newForwardZ = Math.cos(this.state.heading);
    const newRightX = Math.cos(this.state.heading);
    const newRightZ = -Math.sin(this.state.heading);

    // Reconstruct world velocity from updated axes
    this.state.vx = newForwardX * newForwardSpeed + newRightX * newLateralSpeed;
    this.state.vz = newForwardZ * newForwardSpeed + newRightZ * newLateralSpeed;

    // 8. Drift Scoring System
    if (this.state.isDrifting && this.state.speedKmh > 30) {
      this.driftDuration += delta;
      this.driftComboTimer = 2.0; // Reset combo decay timer
      this.state.driftAngle = Math.abs(Math.atan2(lateralSpeed, forwardSpeed));

      // Drift multiplier increases up to x4.0 with continuous sustained angle
      this.state.driftMultiplier = Math.min(1.0 + Math.floor(this.driftDuration / 1.5) * 0.5, 4.0);
      const pointsPerSec = Math.floor(this.state.speedKmh * 8 * this.state.driftAngle * this.state.driftMultiplier);
      this.state.driftScore += Math.floor(pointsPerSec * delta);
    } else {
      this.driftDuration = 0;
      if (this.driftComboTimer > 0) {
        this.driftComboTimer -= delta;
        if (this.driftComboTimer <= 0) {
          // Drift ended successfully: bank score!
          if (this.state.driftScore > 300) {
            driftEventScore = this.state.driftScore;
            isDriftBanked = true;
          }
          this.state.driftScore = 0;
          this.state.driftMultiplier = 1.0;
        }
      }
    }

    // 9. Position update
    this.state.x += this.state.vx * delta;
    this.state.z += this.state.vz * delta;

    // Clamp inside world bounds
    const worldLimit = (WORLD_SIZE / 2) - 30;
    if (Math.abs(this.state.x) > worldLimit || Math.abs(this.state.z) > worldLimit) {
      this.state.x = Math.max(-worldLimit, Math.min(worldLimit, this.state.x));
      this.state.z = Math.max(-worldLimit, Math.min(worldLimit, this.state.z));
      this.state.vx *= -0.3;
      this.state.vz *= -0.3;
      collisionIntensity = 0.8;
    }

    // 10. Terrain Height & Suspension Grounding
    const terrainY = getTerrainHeight(this.state.x, this.state.z);
    const targetY = terrainY + 0.35;

    // Vertical spring suspension follow
    this.state.y = THREE.MathUtils.damp(this.state.y, targetY, 14.0, delta);
    this.state.isGrounded = Math.abs(this.state.y - targetY) < 0.2;

    // 11. Dynamic Suspension Pitch & Roll
    // Squat on acceleration, dive on braking
    const targetPitch = THREE.MathUtils.clamp((engineAccel - brakeDecel) * -0.015, -0.09, 0.08);
    this.state.pitch = THREE.MathUtils.damp(this.state.pitch, targetPitch, 9.0, delta);

    // Roll towards outside of turn based on lateral acceleration
    const latAcc = lateralSpeed * yawTurnRate;
    const targetRoll = THREE.MathUtils.clamp(-latAcc * 0.02, -0.12, 0.12);
    this.state.roll = THREE.MathUtils.damp(this.state.roll, targetRoll, 9.0, delta);

    // 12. Wheel Spin Rotation
    // Wheel circumference approx 2.2m
    const wheelAngularSpeed = (newForwardSpeed / 0.36);
    this.state.wheelRotation += wheelAngularSpeed * delta;

    return {
      collisionIntensity,
      driftEventScore,
      isDriftBanked,
    };
  }

  /**
   * Reset / Recover vehicle back onto nearest road facing forward
   */
  public resetToRoad(): void {
    const surfaceInfo = getSurfaceInfo(this.state.x, this.state.z);

    // Target nearest road center
    const roadX = this.state.x - surfaceInfo.distToRoad * (surfaceInfo.distToRoad > 0.1 ? 0.3 : 0);
    const roadZ = this.state.z;

    this.state.x = roadX;
    this.state.z = roadZ;
    this.state.y = getTerrainHeight(roadX, roadZ) + 0.4;
    this.state.vx = 0;
    this.state.vy = 0;
    this.state.vz = 0;
    this.state.speedKmh = 0;
    this.state.pitch = 0;
    this.state.roll = 0;

    // Align heading with road direction
    this.state.heading = Math.atan2(surfaceInfo.roadTangent.x, surfaceInfo.roadTangent.y);
    this.state.driftScore = 0;
    this.state.driftMultiplier = 1.0;
  }
}
