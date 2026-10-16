/**
 * HORIZON: OPEN ROADS - World Terrain, Road Splines & Environment Data
 */

import * as THREE from 'three';
import { RaceConfig, SpeedTrap, DriftZone, CollectibleBoard } from '../../types/game';

// Terrain bounds
export const WORLD_SIZE = 1400; // 1400 x 1400m continuous explorable region
export const HALF_WORLD = WORLD_SIZE / 2;

/**
 * Continuous procedural heightmap function
 * Combines hills, mountain ridges, flat coastal shoreline, and festival plateau
 */
export function getTerrainHeight(x: number, z: number): number {
  // Distance from ocean (west is ocean: x < -350)
  const oceanDist = x + 350;

  // Mountain ridge in north-east (x > 100, z > 100)
  const mountainX = Math.max(0, (x - 80) / 180);
  const mountainZ = Math.max(0, (z - 60) / 180);
  const mountainHeight = (mountainX * mountainX + mountainZ * mountainZ) * 8.5;

  // Rolling hills
  const rolling =
    Math.sin(x * 0.008) * Math.cos(z * 0.008) * 14 +
    Math.sin(x * 0.02 + 0.5) * Math.cos(z * 0.02 + 0.3) * 6 +
    Math.sin(x * 0.05) * Math.sin(z * 0.05) * 2;

  // Festival plateau flattening near origin
  const distFromCenter = Math.sqrt(x * x + z * z);
  const plateauFactor = Math.min(distFromCenter / 120, 1.0);

  let height = rolling + mountainHeight;

  // Coastal drop-off to the west
  if (oceanDist < 0) {
    height = Math.max(height * 0.3 - Math.abs(oceanDist) * 0.08, -12);
  }

  // Blend with festival plateau
  return THREE.MathUtils.lerp(3.5, height, plateauFactor);
}

// Key waypoint coordinates defining the primary road network
export interface RoadWaypoint {
  x: number;
  z: number;
  width: number;
  isDirt?: boolean;
}

// 1. Coastal Highway loop
export const COASTAL_ROAD_POINTS: RoadWaypoint[] = [
  { x: 0, z: 0, width: 14 },        // Festival Hub
  { x: -60, z: 40, width: 13 },
  { x: -140, z: 80, width: 13 },
  { x: -220, z: 140, width: 13 },
  { x: -290, z: 220, width: 14 },   // Ocean curve
  { x: -330, z: 320, width: 14 },
  { x: -340, z: 430, width: 14 },   // Ocean Lookout straight
  { x: -310, z: 520, width: 13 },
  { x: -220, z: 570, width: 13 },
  { x: -120, z: 540, width: 12 },
  { x: -30, z: 460, width: 12 },
  { x: 40, z: 360, width: 12 },
  { x: 50, z: 240, width: 13 },
  { x: 30, z: 120, width: 13 },
  { x: 0, z: 0, width: 14 },        // Back to Festival Hub
];

// 2. Mountain Pass & Serpentines loop
export const MOUNTAIN_ROAD_POINTS: RoadWaypoint[] = [
  { x: 0, z: 0, width: 14 },        // Festival Hub
  { x: 50, z: -70, width: 12 },
  { x: 120, z: -140, width: 12 },
  { x: 190, z: -190, width: 11 },   // Hairpin 1
  { x: 260, z: -160, width: 11 },
  { x: 320, z: -90, width: 11 },    // Hairpin 2
  { x: 360, z: -10, width: 11 },
  { x: 380, z: 80, width: 11 },     // Mountain Summit
  { x: 340, z: 180, width: 11 },    // Tunnel entrance
  { x: 270, z: 270, width: 11 },    // Tunnel exit
  { x: 180, z: 310, width: 12 },
  { x: 90, z: 270, width: 12 },
  { x: 20, z: 180, width: 13 },
  { x: 0, z: 0, width: 14 },        // Return to Hub
];

// 3. Forest Gravel Shortcut trail
export const FOREST_DIRT_POINTS: RoadWaypoint[] = [
  { x: -140, z: 80, width: 9, isDirt: true },
  { x: -110, z: -20, width: 8, isDirt: true },
  { x: -60, z: -120, width: 8, isDirt: true },
  { x: 20, z: -180, width: 9, isDirt: true },
  { x: 120, z: -140, width: 9, isDirt: true },
];

/**
 * Surface check helper: calculates distance to nearest road centerline
 */
export function getSurfaceInfo(x: number, z: number): {
  surfaceType: 'asphalt' | 'dirt' | 'grass';
  distToRoad: number;
  roadTangent: THREE.Vector2;
} {
  let minDist = 9999;
  let surface: 'asphalt' | 'dirt' | 'grass' = 'grass';
  const tangent = new THREE.Vector2(0, 1);

  // Helper to check line segments
  const checkSegments = (pts: RoadWaypoint[], isGravel: boolean) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];

      const dx = p2.x - p1.x;
      const dz = p2.z - p1.z;
      const lenSq = dx * dx + dz * dz;
      if (lenSq === 0) continue;

      let t = ((x - p1.x) * dx + (z - p1.z) * dz) / lenSq;
      t = Math.max(0, Math.min(1, t));

      const projX = p1.x + t * dx;
      const projZ = p1.z + t * dz;

      const dist = Math.sqrt((x - projX) * (x - projX) + (z - projZ) * (z - projZ));
      const halfW = p1.width * 0.5;

      if (dist < minDist) {
        minDist = dist;
        tangent.set(dx, dz).normalize();
        if (dist <= halfW) {
          surface = isGravel ? 'dirt' : 'asphalt';
        }
      }
    }
  };

  checkSegments(COASTAL_ROAD_POINTS, false);
  checkSegments(MOUNTAIN_ROAD_POINTS, false);
  checkSegments(FOREST_DIRT_POINTS, true);

  return {
    surfaceType: surface,
    distToRoad: minDist,
    roadTangent: tangent,
  };
}

// 2 Complete Races
export const GAME_RACES: RaceConfig[] = [
  {
    id: 'coastal_sprint',
    name: 'Coastal Sprint',
    subtitle: 'Point-to-Point Ocean Highway Dash',
    description: 'High-speed blast from the Festival Hub down the scenic coastal highway to the Ocean Lookout promontory.',
    lengthKm: 2.4,
    difficulty: 'Easy',
    aiCount: 3,
    rewards: { credits: 15000, xp: 1200 },
    checkpoints: [
      { x: 0, y: 3.5, z: 15, radius: 14, index: 0 },
      { x: -55, y: 3.2, z: 38, radius: 14, index: 1 },
      { x: -135, y: 4.1, z: 76, radius: 14, index: 2 },
      { x: -215, y: 5.0, z: 135, radius: 14, index: 3 },
      { x: -285, y: 6.2, z: 215, radius: 14, index: 4 },
      { x: -325, y: 5.5, z: 315, radius: 14, index: 5 },
      { x: -338, y: 4.2, z: 425, radius: 14, index: 6 },
      { x: -308, y: 5.1, z: 515, radius: 14, index: 7 },
      { x: -218, y: 6.5, z: 565, radius: 14, index: 8 },
      { x: -118, y: 6.0, z: 535, radius: 14, index: 9 },
      { x: -32, y: 5.2, z: 455, radius: 14, index: 10 },
      { x: 42, y: 4.5, z: 355, radius: 16, index: 11 }, // Finish Line!
    ],
  },
  {
    id: 'mountain_pass_rally',
    name: 'Mountain Pass Rally',
    subtitle: 'Hill Climb & Tunnel Serpentines',
    description: 'Tackle treacherous hairpins up to the rocky summit, thunder through the mountain tunnel, and sprint back to the Hub.',
    lengthKm: 3.1,
    difficulty: 'Medium',
    aiCount: 3,
    rewards: { credits: 25000, xp: 2000 },
    checkpoints: [
      { x: 0, y: 3.5, z: -10, radius: 14, index: 0 },
      { x: 48, y: 5.2, z: -68, radius: 14, index: 1 },
      { x: 115, y: 8.4, z: -135, radius: 14, index: 2 },
      { x: 185, y: 14.1, z: -185, radius: 14, index: 3 },
      { x: 255, y: 19.5, z: -155, radius: 14, index: 4 },
      { x: 315, y: 24.2, z: -88, radius: 14, index: 5 },
      { x: 355, y: 27.6, z: -8, radius: 14, index: 6 },
      { x: 375, y: 28.5, z: 78, radius: 14, index: 7 }, // Summit!
      { x: 335, y: 22.0, z: 175, radius: 14, index: 8 }, // Tunnel In
      { x: 265, y: 15.5, z: 265, radius: 14, index: 9 }, // Tunnel Out
      { x: 175, y: 10.2, z: 305, radius: 14, index: 10 },
      { x: 88, y: 7.1, z: 265, radius: 14, index: 11 },
      { x: 18, y: 4.5, z: 175, radius: 14, index: 12 },
      { x: 0, y: 3.5, z: 25, radius: 16, index: 13 }, // Finish back at Festival!
    ],
  },
];

// Speed Traps positioned across the open-world
export const GAME_SPEED_TRAPS: SpeedTrap[] = [
  {
    id: 'ocean_radar',
    name: 'Ocean Highway Speed Trap',
    x: -340,
    y: 4.2,
    z: 430,
    heading: 0,
    targetSpeedKmh: 200,
    recordKmh: 0,
  },
  {
    id: 'summit_radar',
    name: 'Summit Crest Speed Trap',
    x: 375,
    y: 28.5,
    z: 78,
    heading: Math.PI / 2,
    targetSpeedKmh: 175,
    recordKmh: 0,
  },
];

// Drift Zones on open roads
export const GAME_DRIFT_ZONES: DriftZone[] = [
  {
    id: 'canyon_hairpins',
    name: 'Canyon Serpentines',
    startX: 120,
    startZ: -140,
    endX: 320,
    endZ: -90,
    targetScore: 25000,
    recordScore: 0,
  },
  {
    id: 'ocean_sweep',
    name: 'Ocean Lookout Sweeper',
    startX: -220,
    startZ: 140,
    endX: -330,
    endZ: 320,
    targetScore: 20000,
    recordScore: 0,
  },
];

// 8 Horizon XP Boards scattered across landmarks and secret trails
export const GAME_XP_BOARDS: CollectibleBoard[] = [
  { id: 'xp_hub_roof', x: -28, y: 4.0, z: -25, xpValue: 1000, collected: false },
  { id: 'xp_ocean_pier', x: -360, y: 2.2, z: 380, xpValue: 1500, collected: false },
  { id: 'xp_forest_clearing', x: -70, y: 5.5, z: -90, xpValue: 1000, collected: false },
  { id: 'xp_mountain_switchback', x: 210, y: 16.0, z: -190, xpValue: 2000, collected: false },
  { id: 'xp_summit_ledge', x: 395, y: 29.5, z: 65, xpValue: 3000, collected: false },
  { id: 'xp_tunnel_exit', x: 250, y: 15.0, z: 290, xpValue: 1500, collected: false },
  { id: 'xp_dirt_jump', x: 40, y: 7.0, z: -170, xpValue: 2000, collected: false },
  { id: 'xp_coastal_cove', x: -325, y: 3.0, z: 540, xpValue: 1500, collected: false },
];
