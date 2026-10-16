/**
 * HORIZON: OPEN ROADS - Smooth Chase Camera
 * High-speed dynamic FOV stretching, terrain collision clearance, and speed camera shake.
 */

import * as THREE from 'three';
import { CameraDistanceMode, VehiclePhysicsState } from '../../types/game';
import { getTerrainHeight } from '../world/roadNetwork';

export class ChaseCamera {
  public camera: THREE.PerspectiveCamera;
  public mode: CameraDistanceMode = 'medium';

  private currentTarget = new THREE.Vector3();
  private currentPosition = new THREE.Vector3();
  private shakeOffset = new THREE.Vector3();
  private shakeIntensity: number = 0;

  constructor(fov: number = 64, aspect: number = 16 / 9) {
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1500);
    this.camera.position.set(0, 10, -20);
    this.currentPosition.copy(this.camera.position);
  }

  public setMode(mode: CameraDistanceMode): void {
    this.mode = mode;
  }

  public triggerShake(intensity: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  public update(carState: VehiclePhysicsState, dt: number): void {
    const delta = Math.min(dt, 0.05);

    // Camera offset presets [height, distance behind car]
    let targetDist = 7.5;
    let targetHeight = 2.6;
    let lookHeight = 1.2;

    switch (this.mode) {
      case 'close':
        targetDist = 5.2;
        targetHeight = 2.0;
        lookHeight = 1.0;
        break;
      case 'far':
        targetDist = 10.5;
        targetHeight = 3.8;
        lookHeight = 1.4;
        break;
      case 'hood':
        targetDist = -0.4;
        targetHeight = 1.2;
        lookHeight = 1.1;
        break;
      case 'medium':
      default:
        targetDist = 7.5;
        targetHeight = 2.6;
        lookHeight = 1.2;
        break;
    }

    // High-speed FOV stretching (62 deg at rest -> 76 deg at high speed)
    const speedRatio = Math.min(carState.speedKmh / 280, 1.0);
    const targetFov = 62 + speedRatio * 14;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 4.0, delta);
    this.camera.updateProjectionMatrix();

    // Ideal camera position behind car
    const forwardX = Math.sin(carState.heading);
    const forwardZ = Math.cos(carState.heading);

    const idealX = carState.x - forwardX * targetDist;
    const idealZ = carState.z - forwardZ * targetDist;
    let idealY = carState.y + targetHeight;

    // Prevent terrain clipping
    const terrainUnderCam = getTerrainHeight(idealX, idealZ) + 1.2;
    if (idealY < terrainUnderCam) {
      idealY = terrainUnderCam;
    }

    // Smoothly damp position
    const followSpeed = this.mode === 'hood' ? 24.0 : (8.0 + speedRatio * 4.0);
    this.currentPosition.x = THREE.MathUtils.damp(this.currentPosition.x, idealX, followSpeed, delta);
    this.currentPosition.y = THREE.MathUtils.damp(this.currentPosition.y, idealY, followSpeed * 1.2, delta);
    this.currentPosition.z = THREE.MathUtils.damp(this.currentPosition.z, idealZ, followSpeed, delta);

    // Look-at point slightly ahead of car
    const lookAheadDist = this.mode === 'hood' ? 12 : 6;
    const idealLookX = carState.x + forwardX * lookAheadDist;
    const idealLookZ = carState.z + forwardZ * lookAheadDist;
    const idealLookY = carState.y + lookHeight;

    this.currentTarget.x = THREE.MathUtils.damp(this.currentTarget.x, idealLookX, followSpeed * 1.5, delta);
    this.currentTarget.y = THREE.MathUtils.damp(this.currentTarget.y, idealLookY, followSpeed * 1.5, delta);
    this.currentTarget.z = THREE.MathUtils.damp(this.currentTarget.z, idealLookZ, followSpeed * 1.5, delta);

    // Camera shake calculation (decaying)
    if (this.shakeIntensity > 0.01) {
      this.shakeIntensity = THREE.MathUtils.damp(this.shakeIntensity, 0, 8.0, delta);
      const shakeAmt = this.shakeIntensity * 0.18;
      this.shakeOffset.set(
        (Math.random() - 0.5) * shakeAmt,
        (Math.random() - 0.5) * shakeAmt,
        (Math.random() - 0.5) * shakeAmt
      );
    } else {
      this.shakeOffset.set(0, 0, 0);
    }

    // Apply to camera
    this.camera.position.copy(this.currentPosition).add(this.shakeOffset);
    this.camera.lookAt(this.currentTarget);
  }
}
