/**
 * HORIZON: OPEN ROADS - AI Opponents Controller
 * Waypoint-following racers with PID steering, throttle/braking dynamics, and 3D car models.
 */

import * as THREE from 'three';
import { Checkpoint } from '../../types/game';
import { buildApexGT, buildVeloceHyperion, buildTerraRaider, CarMeshes } from '../vehicles/vehicleModels';
import { getTerrainHeight } from '../world/roadNetwork';

export interface AIRacer {
  id: string;
  name: string;
  vehicleId: string;
  color: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  heading: number;
  speedKmh: number;
  currentCheckpointIdx: number;
  distanceToNext: number;
  progressLapRatio: number;
  topSpeedKmh: number;
  skill: number; // 0.85 to 1.05
  meshes: CarMeshes;
}

export class AIController {
  public racers: AIRacer[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public setupRacers(checkpoints: Checkpoint[], count: number = 3): void {
    this.clearRacers();

    const aiConfigs = [
      { name: 'Elena Cruz', vehicleId: 'veloce_hyperion', color: '#ff385c', skill: 1.0 },
      { name: 'Marcus Vance', vehicleId: 'apex_gt', color: '#3a86ff', skill: 0.95 },
      { name: 'Kai Tanaka', vehicleId: 'terra_raider', color: '#fb5607', skill: 0.92 },
    ];

    const startCp = checkpoints[0] || { x: 0, y: 3.5, z: 0 };
    const nextCp = checkpoints[1] || { x: 0, y: 3.5, z: 20 };
    const startHeading = Math.atan2(nextCp.x - startCp.x, nextCp.z - startCp.z);

    const forwardX = Math.sin(startHeading);
    const forwardZ = Math.cos(startHeading);
    const rightX = Math.cos(startHeading);
    const rightZ = -Math.sin(startHeading);

    for (let i = 0; i < Math.min(count, aiConfigs.length); i++) {
      const cfg = aiConfigs[i];
      // Grid starting positions staggered
      const row = Math.floor(i / 2) + 1;
      const col = (i % 2 === 0 ? -1 : 1);

      const spawnX = startCp.x - forwardX * (row * 6.5) + rightX * (col * 3.5);
      const spawnZ = startCp.z - forwardZ * (row * 6.5) + rightZ * (col * 3.5);
      const spawnY = getTerrainHeight(spawnX, spawnZ) + 0.35;

      let meshes: CarMeshes;
      if (cfg.vehicleId === 'veloce_hyperion') {
        meshes = buildVeloceHyperion(cfg.color);
      } else if (cfg.vehicleId === 'terra_raider') {
        meshes = buildTerraRaider(cfg.color);
      } else {
        meshes = buildApexGT(cfg.color);
      }

      meshes.root.position.set(spawnX, spawnY, spawnZ);
      meshes.root.rotation.y = startHeading;
      this.scene.add(meshes.root);

      this.racers.push({
        id: `ai_${i}`,
        name: cfg.name,
        vehicleId: cfg.vehicleId,
        color: cfg.color,
        x: spawnX,
        y: spawnY,
        z: spawnZ,
        vx: 0,
        vz: 0,
        heading: startHeading,
        speedKmh: 0,
        currentCheckpointIdx: 0,
        distanceToNext: 999,
        progressLapRatio: 0,
        topSpeedKmh: 240 * cfg.skill,
        skill: cfg.skill,
        meshes,
      });
    }
  }

  public update(dt: number, checkpoints: Checkpoint[], raceStarted: boolean): void {
    if (checkpoints.length === 0 || !raceStarted) return;
    const delta = Math.min(dt, 0.05);

    for (let i = 0; i < this.racers.length; i++) {
      const racer = this.racers[i];
      const targetCp = checkpoints[racer.currentCheckpointIdx];
      if (!targetCp) continue;

      // Distance and angle to target checkpoint
      const dx = targetCp.x - racer.x;
      const dz = targetCp.z - racer.z;
      const dist = Math.hypot(dx, dz);
      racer.distanceToNext = dist;

      // Checkpoint reached check
      if (dist < targetCp.radius * 0.9) {
        if (racer.currentCheckpointIdx < checkpoints.length - 1) {
          racer.currentCheckpointIdx++;
        }
      }

      // Desired heading towards checkpoint
      const targetHeading = Math.atan2(dx, dz);
      let angleDiff = targetHeading - racer.heading;

      // Normalize angle diff to -PI .. PI
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      // Turn rate based on angle difference
      const turnRate = THREE.MathUtils.clamp(angleDiff * 4.0, -2.5, 2.5);
      racer.heading += turnRate * delta;

      // Speed control: slow down for sharp turns
      const turnSeverity = Math.abs(angleDiff);
      const maxTurnSpeedKmh = Math.max(60, 240 - turnSeverity * 140) * racer.skill;
      const targetSpeedMs = (Math.min(racer.topSpeedKmh, maxTurnSpeedKmh) / 3.6);

      const currentSpeedMs = Math.hypot(racer.vx, racer.vz);
      let newSpeedMs = currentSpeedMs;

      if (currentSpeedMs < targetSpeedMs) {
        newSpeedMs += 7.0 * racer.skill * delta;
      } else {
        newSpeedMs -= 12.0 * delta;
      }

      // Move racer
      racer.vx = Math.sin(racer.heading) * newSpeedMs;
      racer.vz = Math.cos(racer.heading) * newSpeedMs;

      racer.x += racer.vx * delta;
      racer.z += racer.vz * delta;
      racer.y = getTerrainHeight(racer.x, racer.z) + 0.35;
      racer.speedKmh = newSpeedMs * 3.6;

      // Update 3D meshes
      racer.meshes.root.position.set(racer.x, racer.y, racer.z);
      racer.meshes.root.rotation.y = racer.heading;

      // Spin wheels
      const wheelSpin = (newSpeedMs / 0.36) * delta;
      racer.meshes.frontLeftWheel.rotation.x += wheelSpin;
      racer.meshes.frontRightWheel.rotation.x += wheelSpin;
      racer.meshes.rearLeftWheel.rotation.x += wheelSpin;
      racer.meshes.rearRightWheel.rotation.x += wheelSpin;

      // Progress calculation for ranking
      racer.progressLapRatio = racer.currentCheckpointIdx + (1.0 - Math.min(dist / 120, 1.0));
    }
  }

  public clearRacers(): void {
    for (const r of this.racers) {
      this.scene.remove(r.meshes.root);
    }
    this.racers = [];
  }
}
