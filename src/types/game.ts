/**
 * HORIZON: OPEN ROADS - Core Game Type Definitions
 */

export type GameScreen = 'title' | 'freeroam' | 'race' | 'garage' | 'settings';

export type GraphicsQuality = 'low' | 'medium' | 'high';
export type ControlType = 'buttons' | 'wheel';
export type CameraDistanceMode = 'close' | 'medium' | 'far' | 'hood';

export interface VehicleConfig {
  id: string;
  name: string;
  category: 'Sports' | 'Supercar' | 'Off-Road';
  description: string;
  topSpeedKmh: number;
  acceleration: number; // 0-100 kmh in seconds
  handling: number;     // 1-10
  braking: number;      // 1-10
  offroadRating: number;// 1-10
  weightKg: number;
  color: string;
  availableColors: string[];
  price: number;
  unlocked: boolean;
  engineSoundFreq: number; // Base oscillator Hz
}

export interface VehiclePhysicsState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  heading: number; // Radians (yaw)
  pitch: number;   // Radians (squat / dive)
  roll: number;    // Radians (cornering lean)
  speedKmh: number;
  steeringAngle: number;
  wheelRotation: number;
  rpm: number;
  gear: number; // 0 = R, 1-6 = gears
  isGrounded: boolean;
  isDrifting: boolean;
  driftAngle: number;
  driftScore: number;
  driftMultiplier: number;
  surfaceType: 'asphalt' | 'dirt' | 'grass';
}

export interface PlayerInput {
  throttle: number; // 0 to 1
  brake: number;    // 0 to 1
  steering: number; // -1 (left) to 1 (right)
  handbrake: boolean;
  reverse: boolean;
}

export interface Checkpoint {
  x: number;
  y: number;
  z: number;
  radius: number;
  index: number;
}

export interface RaceConfig {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  lengthKm: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  checkpoints: Checkpoint[];
  aiCount: number;
  rewards: {
    credits: number;
    xp: number;
  };
}

export interface SpeedTrap {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  heading: number;
  targetSpeedKmh: number;
  recordKmh: number;
}

export interface DriftZone {
  id: string;
  name: string;
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  targetScore: number;
  recordScore: number;
}

export interface CollectibleBoard {
  id: string;
  x: number;
  y: number;
  z: number;
  xpValue: number;
  collected: boolean;
}

export interface GameSettings {
  graphicsQuality: GraphicsQuality;
  controlType: ControlType;
  cameraDistance: CameraDistanceMode;
  steeringSensitivity: number; // 0.5 to 1.5
  soundVolume: number;         // 0 to 1
  musicVolume: number;         // 0 to 1
  showFps: boolean;
  manualTransmission: boolean;
}

export interface PlayerProfile {
  credits: number;
  xp: number;
  level: number;
  unlockedVehicles: string[];
  selectedVehicleId: string;
  vehiclePaints: Record<string, string>;
  bestRaceTimes: Record<string, number>;
  bestDriftScores: Record<string, number>;
  speedTrapRecords: Record<string, number>;
  collectedBoards: string[];
}
