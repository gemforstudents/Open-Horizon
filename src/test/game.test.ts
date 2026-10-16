/**
 * HORIZON: OPEN ROADS - Automated Unit Tests
 * Verifies vehicle physics, road networks, progression, and checkpoint logic.
 */

import { describe, it, expect } from 'vitest';
import { VEHICLE_CONFIGS } from '../game/vehicles/vehicleModels';
import { VehiclePhysics } from '../game/physics/vehiclePhysics';
import { getTerrainHeight, getSurfaceInfo, GAME_RACES, GAME_SPEED_TRAPS } from '../game/world/roadNetwork';
import { DEFAULT_PROFILE, DEFAULT_SETTINGS } from '../services/storage';

describe('Vehicle Configurations', () => {
  it('contains the 3 distinct original vehicles', () => {
    expect(VEHICLE_CONFIGS['apex_gt']).toBeDefined();
    expect(VEHICLE_CONFIGS['veloce_hyperion']).toBeDefined();
    expect(VEHICLE_CONFIGS['terra_raider']).toBeDefined();
  });

  it('verifies vehicle performance specifications', () => {
    const apex = VEHICLE_CONFIGS['apex_gt'];
    const hyperion = VEHICLE_CONFIGS['veloce_hyperion'];
    const raider = VEHICLE_CONFIGS['terra_raider'];

    // Veloce Hyperion has highest top speed
    expect(hyperion.topSpeedKmh).toBeGreaterThan(apex.topSpeedKmh);
    expect(apex.topSpeedKmh).toBeGreaterThan(raider.topSpeedKmh);

    // Terra Raider has highest off-road capability
    expect(raider.offroadRating).toBeGreaterThan(apex.offroadRating);
    expect(raider.offroadRating).toBeGreaterThan(hyperion.offroadRating);

    // All vehicles have positive acceleration (lower = faster)
    expect(hyperion.acceleration).toBeLessThan(apex.acceleration);
    expect(apex.acceleration).toBeLessThan(raider.acceleration);
  });
});

describe('Vehicle Physics Engine', () => {
  it('accelerates with throttle input', () => {
    const car = new VehiclePhysics(VEHICLE_CONFIGS['apex_gt'], 0, 0, 0);
    expect(car.state.speedKmh).toBe(0);

    // Step simulation with full throttle for 10 frames
    for (let i = 0; i < 10; i++) {
      car.update(0.033, {
        throttle: 1.0,
        brake: 0,
        steering: 0,
        handbrake: false,
        reverse: false,
      });
    }

    expect(car.state.speedKmh).toBeGreaterThan(0);
    expect(car.state.rpm).toBeGreaterThan(800);
  });

  it('brakes to reduce speed', () => {
    const car = new VehiclePhysics(VEHICLE_CONFIGS['apex_gt'], 0, 0, 0);

    // Accelerate first
    for (let i = 0; i < 20; i++) {
      car.update(0.033, {
        throttle: 1.0,
        brake: 0,
        steering: 0,
        handbrake: false,
        reverse: false,
      });
    }
    const peakSpeed = car.state.speedKmh;
    expect(peakSpeed).toBeGreaterThan(15);

    // Apply brake
    for (let i = 0; i < 15; i++) {
      car.update(0.033, {
        throttle: 0,
        brake: 1.0,
        steering: 0,
        handbrake: false,
        reverse: false,
      });
    }

    expect(car.state.speedKmh).toBeLessThan(peakSpeed);
  });

  it('triggers drift state with handbrake', () => {
    const car = new VehiclePhysics(VEHICLE_CONFIGS['apex_gt'], 0, 0, 0);

    // Reach drift entry speed
    for (let i = 0; i < 30; i++) {
      car.update(0.033, {
        throttle: 1.0,
        brake: 0,
        steering: 0,
        handbrake: false,
        reverse: false,
      });
    }

    // Pull handbrake and steer
    car.update(0.033, {
      throttle: 0.5,
      brake: 0,
      steering: 0.8,
      handbrake: true,
      reverse: false,
    });

    expect(car.state.isDrifting).toBe(true);
  });

  it('recovers to road with resetToRoad()', () => {
    const car = new VehiclePhysics(VEHICLE_CONFIGS['apex_gt'], 150, 150, 1.2);
    car.state.speedKmh = 100;
    car.state.pitch = 0.5;

    car.resetToRoad();

    expect(car.state.speedKmh).toBe(0);
    expect(car.state.pitch).toBe(0);
    expect(car.state.roll).toBe(0);
  });
});

describe('Road Network & Heightmap', () => {
  it('calculates deterministic terrain heights', () => {
    const h1 = getTerrainHeight(0, 0);
    const h2 = getTerrainHeight(0, 0);
    expect(h1).toBe(h2);

    // Mountain peak should be higher than coastal sea level
    const seaCoastH = getTerrainHeight(-420, 100);
    const summitH = getTerrainHeight(375, 78);
    expect(summitH).toBeGreaterThan(seaCoastH);
  });

  it('correctly identifies road surfaces', () => {
    // Festival hub road center at (0, 0)
    const hubSurface = getSurfaceInfo(0, 0);
    expect(hubSurface.surfaceType).toBe('asphalt');

    // Far off in the grass meadow
    const farOffroad = getSurfaceInfo(500, -500);
    expect(farOffroad.surfaceType).toBe('grass');
  });

  it('validates sanctioned festival races', () => {
    expect(GAME_RACES.length).toBeGreaterThanOrEqual(2);

    for (const race of GAME_RACES) {
      expect(race.checkpoints.length).toBeGreaterThanOrEqual(8);
      expect(race.rewards.credits).toBeGreaterThan(0);
      expect(race.rewards.xp).toBeGreaterThan(0);

      // Verify checkpoint indices are sequential
      race.checkpoints.forEach((cp, idx) => {
        expect(cp.index).toBe(idx);
        expect(cp.radius).toBeGreaterThan(5);
      });
    }
  });

  it('validates speed traps', () => {
    expect(GAME_SPEED_TRAPS.length).toBeGreaterThanOrEqual(2);
    for (const trap of GAME_SPEED_TRAPS) {
      expect(trap.targetSpeedKmh).toBeGreaterThan(100);
    }
  });
});

describe('Player Profile & Persistence Defaults', () => {
  it('provides safe starter defaults', () => {
    expect(DEFAULT_PROFILE.credits).toBeGreaterThanOrEqual(10000);
    expect(DEFAULT_PROFILE.level).toBe(1);
    expect(DEFAULT_PROFILE.unlockedVehicles.length).toBe(3);
    expect(DEFAULT_SETTINGS.graphicsQuality).toBe('medium');
  });
});
