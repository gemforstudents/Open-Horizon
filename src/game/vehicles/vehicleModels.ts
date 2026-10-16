/**
 * HORIZON: OPEN ROADS - Vehicle 3D Procedural Models & Configurations
 * Follows Three.js Skill Directives: Composite 8-12 Part Procedural Models (THREE.Group)
 * with distinct materials, wheel steer/spin pivots, and dynamic paint updates.
 */

import * as THREE from 'three';
import { VehicleConfig } from '../../types/game';

export const VEHICLE_CONFIGS: Record<string, VehicleConfig> = {
  apex_gt: {
    id: 'apex_gt',
    name: 'Apex GT-V8',
    category: 'Sports',
    description: 'A finely balanced front-engine V8 grand tourer with responsive rear-wheel drive drift dynamics.',
    topSpeedKmh: 280,
    acceleration: 3.6,
    handling: 8.5,
    braking: 8.0,
    offroadRating: 5.5,
    weightKg: 1450,
    color: '#e63946',
    availableColors: ['#e63946', '#1d3557', '#ffd166', '#2b2d42', '#f1faee', '#06d6a0', '#ff006e'],
    price: 0,
    unlocked: true,
    engineSoundFreq: 48,
  },
  veloce_hyperion: {
    id: 'veloce_hyperion',
    name: 'Veloce Hyperion',
    category: 'Supercar',
    description: 'A track-honed twin-turbo V10 carbon hypercar built for pure straight-line speed and high-downforce cornering.',
    topSpeedKmh: 345,
    acceleration: 2.5,
    handling: 9.4,
    braking: 9.5,
    offroadRating: 3.5,
    weightKg: 1280,
    color: '#ffd166',
    availableColors: ['#ffd166', '#ff5722', '#2196f3', '#00e676', '#e0e0e0', '#7b1fa2', '#263238'],
    price: 75000,
    unlocked: true,
    engineSoundFreq: 64,
  },
  terra_raider: {
    id: 'terra_raider',
    name: 'Terra Raider 4x4',
    category: 'Off-Road',
    description: 'A wide-track trophy raid off-roader with heavy-duty long-travel suspension, roof light-bars, and dirt dominance.',
    topSpeedKmh: 220,
    acceleration: 4.2,
    handling: 7.2,
    braking: 7.8,
    offroadRating: 9.8,
    weightKg: 1850,
    color: '#2a9d8f',
    availableColors: ['#2a9d8f', '#e76f51', '#f4a261', '#264653', '#8ac926', '#111827', '#e9c46a'],
    price: 45000,
    unlocked: true,
    engineSoundFreq: 40,
  },
};

export interface CarMeshes {
  root: THREE.Group;
  chassis: THREE.Group; // Subject to suspension pitch/roll
  bodyMeshes: THREE.Mesh[]; // Paint color updates
  frontLeftWheel: THREE.Group;
  frontRightWheel: THREE.Group;
  rearLeftWheel: THREE.Group;
  rearRightWheel: THREE.Group;
  brakeLights: THREE.Mesh[];
  headlights: THREE.Mesh[];
}

/**
 * Creates a wheel assembly with tire rubber, aluminum rim, spokes, and brake caliper
 */
function createWheelAssembly(radius: number, width: number, isOffroad: boolean = false): THREE.Group {
  const wheelGroup = new THREE.Group();

  // Rubber Tire
  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 18, 1);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1f2421,
    roughness: 0.92,
    metalness: 0.05,
  });
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.castShadow = true;
  wheelGroup.add(tire);

  // Wheel Rim
  const rimRadius = radius * (isOffroad ? 0.65 : 0.72);
  const rimGeo = new THREE.CylinderGeometry(rimRadius, rimRadius, width + 0.01, 16, 1);
  rimGeo.rotateZ(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xd6d6d6,
    metalness: 0.9,
    roughness: 0.2,
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  wheelGroup.add(rim);

  // Spokes pattern (5 spokes)
  const spokeMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.85,
    roughness: 0.25,
  });
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    const spokeGeo = new THREE.BoxGeometry(rimRadius * 1.6, 0.04, width + 0.015);
    const spoke = new THREE.Mesh(spokeGeo, spokeMat);
    spoke.rotation.x = angle;
    wheelGroup.add(spoke);
  }

  // Brake Caliper (accent color)
  const caliperGeo = new THREE.BoxGeometry(0.06, rimRadius * 0.7, 0.08);
  const caliperMat = new THREE.MeshStandardMaterial({
    color: 0xff1744, // Red performance caliper
    metalness: 0.6,
    roughness: 0.3,
  });
  const caliper = new THREE.Mesh(caliperGeo, caliperMat);
  caliper.position.set(0, rimRadius * 0.45, 0);
  wheelGroup.add(caliper);

  return wheelGroup;
}

/**
 * Creates the Apex GT-V8 sports car model
 */
export function buildApexGT(paintColorHex: string): CarMeshes {
  const root = new THREE.Group();
  const chassis = new THREE.Group();
  root.add(chassis);

  const bodyMeshes: THREE.Mesh[] = [];
  const brakeLights: THREE.Mesh[] = [];
  const headlights: THREE.Mesh[] = [];

  const paintMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(paintColorHex),
    metalness: 0.8,
    roughness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x111625,
    metalness: 0.9,
    roughness: 0.1,
    transmission: 0.6,
    thickness: 0.5,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.8,
    metalness: 0.2,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.1,
    metalness: 0.95,
  });

  // 1. Main lower chassis / body
  const bodyGeo = new THREE.BoxGeometry(1.85, 0.48, 4.3);
  const body = new THREE.Mesh(bodyGeo, paintMat);
  body.position.set(0, 0.5, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  chassis.add(body);
  bodyMeshes.push(body);

  // 2. Cabin / Greenhouse
  const cabinGeo = new THREE.BoxGeometry(1.5, 0.46, 2.1);
  const cabin = new THREE.Mesh(cabinGeo, glassMat);
  cabin.position.set(0, 0.88, -0.2);
  cabin.castShadow = true;
  chassis.add(cabin);

  // Roof cap
  const roofGeo = new THREE.BoxGeometry(1.42, 0.08, 1.8);
  const roof = new THREE.Mesh(roofGeo, paintMat);
  roof.position.set(0, 1.12, -0.2);
  roof.castShadow = true;
  chassis.add(roof);
  bodyMeshes.push(roof);

  // 3. Hood scoop / front wedge
  const hoodWedgeGeo = new THREE.BoxGeometry(1.65, 0.18, 1.3);
  const hood = new THREE.Mesh(hoodWedgeGeo, paintMat);
  hood.position.set(0, 0.68, 1.25);
  hood.rotation.x = -0.1;
  hood.castShadow = true;
  chassis.add(hood);
  bodyMeshes.push(hood);

  // 4. Front splitter
  const splitterGeo = new THREE.BoxGeometry(1.9, 0.06, 0.6);
  const splitter = new THREE.Mesh(splitterGeo, trimMat);
  splitter.position.set(0, 0.26, 2.05);
  splitter.castShadow = true;
  chassis.add(splitter);

  // 5. Rear ducktail spoiler
  const spoilerGeo = new THREE.BoxGeometry(1.7, 0.08, 0.35);
  const spoiler = new THREE.Mesh(spoilerGeo, trimMat);
  spoiler.position.set(0, 0.82, -2.05);
  spoiler.rotation.x = 0.2;
  spoiler.castShadow = true;
  chassis.add(spoiler);

  // 6. Dual Exhaust tips
  const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.2, 12);
  exhaustGeo.rotateX(Math.PI / 2);
  const exhaustL = new THREE.Mesh(exhaustGeo, chromeMat);
  exhaustL.position.set(-0.55, 0.32, -2.18);
  const exhaustR = new THREE.Mesh(exhaustGeo, chromeMat);
  exhaustR.position.set(0.55, 0.32, -2.18);
  chassis.add(exhaustL, exhaustR);

  // 7. Headlights (LED Xenon white)
  const headlightGeo = new THREE.BoxGeometry(0.35, 0.12, 0.08);
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xbbddff,
    emissiveIntensity: 0.8,
  });
  const headlightL = new THREE.Mesh(headlightGeo, headlightMat);
  headlightL.position.set(-0.65, 0.58, 2.14);
  const headlightR = new THREE.Mesh(headlightGeo, headlightMat);
  headlightR.position.set(0.65, 0.58, 2.14);
  chassis.add(headlightL, headlightR);
  headlights.push(headlightL, headlightR);

  // 8. Taillights (Red LED bar)
  const taillightGeo = new THREE.BoxGeometry(1.6, 0.1, 0.06);
  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xff1744,
    emissive: 0xff0020,
    emissiveIntensity: 0.9,
  });
  const taillight = new THREE.Mesh(taillightGeo, taillightMat);
  taillight.position.set(0, 0.62, -2.14);
  chassis.add(taillight);
  brakeLights.push(taillight);

  // Wheels
  const wheelRadius = 0.36;
  const wheelWidth = 0.28;
  const frontTrack = 0.92;
  const rearTrack = 0.94;
  const wheelbaseFront = 1.35;
  const wheelbaseRear = -1.35;

  const flGroup = createWheelAssembly(wheelRadius, wheelWidth);
  flGroup.position.set(-frontTrack, wheelRadius, wheelbaseFront);
  const frGroup = createWheelAssembly(wheelRadius, wheelWidth);
  frGroup.position.set(frontTrack, wheelRadius, wheelbaseFront);
  frGroup.rotation.y = Math.PI;

  const rlGroup = createWheelAssembly(wheelRadius, wheelWidth * 1.1);
  rlGroup.position.set(-rearTrack, wheelRadius, wheelbaseRear);
  const rrGroup = createWheelAssembly(wheelRadius, wheelWidth * 1.1);
  rrGroup.position.set(rearTrack, wheelRadius, wheelbaseRear);
  rrGroup.rotation.y = Math.PI;

  root.add(flGroup, frGroup, rlGroup, rrGroup);

  return {
    root,
    chassis,
    bodyMeshes,
    frontLeftWheel: flGroup,
    frontRightWheel: frGroup,
    rearLeftWheel: rlGroup,
    rearRightWheel: rrGroup,
    brakeLights,
    headlights,
  };
}

/**
 * Creates the Veloce Hyperion supercar model
 */
export function buildVeloceHyperion(paintColorHex: string): CarMeshes {
  const root = new THREE.Group();
  const chassis = new THREE.Group();
  root.add(chassis);

  const bodyMeshes: THREE.Mesh[] = [];
  const brakeLights: THREE.Mesh[] = [];
  const headlights: THREE.Mesh[] = [];

  const paintMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(paintColorHex),
    metalness: 0.85,
    roughness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.4,
    metalness: 0.6,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a0f1d,
    metalness: 0.95,
    roughness: 0.05,
    transmission: 0.7,
  });

  // 1. Wedge Hypercar Body
  const bodyGeo = new THREE.BoxGeometry(1.95, 0.4, 4.6);
  const body = new THREE.Mesh(bodyGeo, paintMat);
  body.position.set(0, 0.44, 0);
  body.castShadow = true;
  chassis.add(body);
  bodyMeshes.push(body);

  // 2. Cockpit canopy (Teardrop shape)
  const canopyGeo = new THREE.CylinderGeometry(0.55, 0.75, 1.9, 16);
  canopyGeo.rotateX(Math.PI / 2);
  canopyGeo.scale(1.25, 0.55, 1.0);
  const canopy = new THREE.Mesh(canopyGeo, glassMat);
  canopy.position.set(0, 0.78, 0.1);
  canopy.castShadow = true;
  chassis.add(canopy);

  // 3. Front aggressive nose cone
  const noseGeo = new THREE.ConeGeometry(0.95, 1.2, 4);
  noseGeo.rotateX(Math.PI / 2);
  noseGeo.scale(1.0, 0.35, 1.0);
  const nose = new THREE.Mesh(noseGeo, paintMat);
  nose.position.set(0, 0.42, 2.3);
  nose.castShadow = true;
  chassis.add(nose);
  bodyMeshes.push(nose);

  // 4. Side intake pods
  const podLGeo = new THREE.BoxGeometry(0.25, 0.35, 1.4);
  const podL = new THREE.Mesh(podLGeo, carbonMat);
  podL.position.set(-0.95, 0.48, -0.4);
  const podR = new THREE.Mesh(podLGeo, carbonMat);
  podR.position.set(0.95, 0.48, -0.4);
  chassis.add(podL, podR);

  // 5. Huge GT rear wing on carbon uprights
  const wingGeo = new THREE.BoxGeometry(2.1, 0.06, 0.45);
  const wing = new THREE.Mesh(wingGeo, carbonMat);
  wing.position.set(0, 1.05, -2.15);
  wing.castShadow = true;
  chassis.add(wing);

  const uprightGeo = new THREE.BoxGeometry(0.04, 0.4, 0.25);
  const uprightL = new THREE.Mesh(uprightGeo, carbonMat);
  uprightL.position.set(-0.6, 0.85, -2.1);
  const uprightR = new THREE.Mesh(uprightGeo, carbonMat);
  uprightR.position.set(0.6, 0.85, -2.1);
  chassis.add(uprightL, uprightR);

  // 6. Quad exhaust in center
  for (let i = -1.5; i <= 1.5; i++) {
    const pipeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 8);
    pipeGeo.rotateX(Math.PI / 2);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x334466, metalness: 0.95, roughness: 0.1 });
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.position.set(i * 0.12, 0.48, -2.32);
    chassis.add(pipe);
  }

  // 7. Blade Headlights
  const bladeLGeo = new THREE.BoxGeometry(0.3, 0.06, 0.2);
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x99ccff, emissiveIntensity: 1.2 });
  const bladeL = new THREE.Mesh(bladeLGeo, bladeMat);
  bladeL.position.set(-0.7, 0.52, 2.2);
  const bladeR = new THREE.Mesh(bladeLGeo, bladeMat);
  bladeR.position.set(0.7, 0.52, 2.2);
  chassis.add(bladeL, bladeR);
  headlights.push(bladeL, bladeR);

  // 8. Continuous rear neon brake diffuse bar
  const rearBarGeo = new THREE.BoxGeometry(1.8, 0.06, 0.06);
  const rearBarMat = new THREE.MeshStandardMaterial({ color: 0xff0044, emissive: 0xff0033, emissiveIntensity: 1.2 });
  const rearBar = new THREE.Mesh(rearBarGeo, rearBarMat);
  rearBar.position.set(0, 0.62, -2.3);
  chassis.add(rearBar);
  brakeLights.push(rearBar);

  // Wheels
  const wheelRadius = 0.35;
  const wheelWidth = 0.32;
  const flGroup = createWheelAssembly(wheelRadius, wheelWidth);
  flGroup.position.set(-0.95, wheelRadius, 1.45);
  const frGroup = createWheelAssembly(wheelRadius, wheelWidth);
  frGroup.position.set(0.95, wheelRadius, 1.45);
  frGroup.rotation.y = Math.PI;

  const rlGroup = createWheelAssembly(wheelRadius * 1.05, wheelWidth * 1.2);
  rlGroup.position.set(-0.98, wheelRadius * 1.05, -1.45);
  const rrGroup = createWheelAssembly(wheelRadius * 1.05, wheelWidth * 1.2);
  rrGroup.position.set(0.98, wheelRadius * 1.05, -1.45);
  rrGroup.rotation.y = Math.PI;

  root.add(flGroup, frGroup, rlGroup, rrGroup);

  return {
    root,
    chassis,
    bodyMeshes,
    frontLeftWheel: flGroup,
    frontRightWheel: frGroup,
    rearLeftWheel: rlGroup,
    rearRightWheel: rrGroup,
    brakeLights,
    headlights,
  };
}

/**
 * Creates the Terra Raider 4x4 Trophy off-road vehicle
 */
export function buildTerraRaider(paintColorHex: string): CarMeshes {
  const root = new THREE.Group();
  const chassis = new THREE.Group();
  root.add(chassis);

  const bodyMeshes: THREE.Mesh[] = [];
  const brakeLights: THREE.Mesh[] = [];
  const headlights: THREE.Mesh[] = [];

  const paintMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(paintColorHex),
    metalness: 0.5,
    roughness: 0.35,
    clearcoat: 0.6,
  });

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x222629,
    metalness: 0.8,
    roughness: 0.4,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x152238,
    roughness: 0.2,
    metalness: 0.8,
  });

  // 1. Lifted Boxy Body
  const bodyGeo = new THREE.BoxGeometry(1.9, 0.65, 4.1);
  const body = new THREE.Mesh(bodyGeo, paintMat);
  body.position.set(0, 0.85, 0);
  body.castShadow = true;
  chassis.add(body);
  bodyMeshes.push(body);

  // 2. High Cab
  const cabGeo = new THREE.BoxGeometry(1.65, 0.65, 2.2);
  const cab = new THREE.Mesh(cabGeo, glassMat);
  cab.position.set(0, 1.45, -0.1);
  cab.castShadow = true;
  chassis.add(cab);

  const cabRoofGeo = new THREE.BoxGeometry(1.6, 0.1, 2.1);
  const cabRoof = new THREE.Mesh(cabRoofGeo, paintMat);
  cabRoof.position.set(0, 1.8, -0.1);
  chassis.add(cabRoof);
  bodyMeshes.push(cabRoof);

  // 3. Heavy-Duty Steel Bullbar
  const bullbarGeo = new THREE.BoxGeometry(1.95, 0.45, 0.25);
  const bullbar = new THREE.Mesh(bullbarGeo, steelMat);
  bullbar.position.set(0, 0.75, 2.15);
  bullbar.castShadow = true;
  chassis.add(bullbar);

  // 4. Roof LED Light Bar
  const lightbarGeo = new THREE.BoxGeometry(1.4, 0.1, 0.15);
  const lightbarMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffeeaa,
    emissiveIntensity: 1.5,
  });
  const lightbar = new THREE.Mesh(lightbarGeo, lightbarMat);
  lightbar.position.set(0, 1.9, 0.5);
  chassis.add(lightbar);
  headlights.push(lightbar);

  // 5. External Roll Cage Tubes
  const tubeMat = steelMat;
  const tubeLGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.3);
  tubeLGeo.rotateX(Math.PI / 2);
  const tubeL = new THREE.Mesh(tubeLGeo, tubeMat);
  tubeL.position.set(-0.85, 1.8, -0.1);
  const tubeR = new THREE.Mesh(tubeLGeo, tubeMat);
  tubeR.position.set(0.85, 1.8, -0.1);
  chassis.add(tubeL, tubeR);

  // 6. Rear Spare Tire mounted in pickup bed
  const spareWheel = createWheelAssembly(0.44, 0.34, true);
  spareWheel.position.set(0, 1.25, -1.55);
  spareWheel.rotation.x = 0.4;
  spareWheel.scale.set(0.9, 0.9, 0.9);
  chassis.add(spareWheel);

  // 7. Dual Heavy Round Headlights
  const roundGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.1, 16);
  roundGeo.rotateX(Math.PI / 2);
  const hlMat = new THREE.MeshStandardMaterial({ color: 0xfff0dd, emissive: 0xffeedd, emissiveIntensity: 1.2 });
  const hl1 = new THREE.Mesh(roundGeo, hlMat);
  hl1.position.set(-0.65, 0.85, 2.2);
  const hl2 = new THREE.Mesh(roundGeo, hlMat);
  hl2.position.set(0.65, 0.85, 2.2);
  chassis.add(hl1, hl2);
  headlights.push(hl1, hl2);

  // 8. Square Taillights
  const tailGeo = new THREE.BoxGeometry(0.25, 0.25, 0.08);
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff1122, emissive: 0xee0011, emissiveIntensity: 0.9 });
  const tailL = new THREE.Mesh(tailGeo, tailMat);
  tailL.position.set(-0.75, 0.9, -2.08);
  const tailR = new THREE.Mesh(tailGeo, tailMat);
  tailR.position.set(0.75, 0.9, -2.08);
  chassis.add(tailL, tailR);
  brakeLights.push(tailL, tailR);

  // Big Knobby All-Terrain Wheels
  const wheelRadius = 0.46;
  const wheelWidth = 0.38;
  const flGroup = createWheelAssembly(wheelRadius, wheelWidth, true);
  flGroup.position.set(-1.0, wheelRadius, 1.35);
  const frGroup = createWheelAssembly(wheelRadius, wheelWidth, true);
  frGroup.position.set(1.0, wheelRadius, 1.35);
  frGroup.rotation.y = Math.PI;

  const rlGroup = createWheelAssembly(wheelRadius, wheelWidth, true);
  rlGroup.position.set(-1.0, wheelRadius, -1.35);
  const rrGroup = createWheelAssembly(wheelRadius, wheelWidth, true);
  rrGroup.position.set(1.0, wheelRadius, -1.35);
  rrGroup.rotation.y = Math.PI;

  root.add(flGroup, frGroup, rlGroup, rrGroup);

  return {
    root,
    chassis,
    bodyMeshes,
    frontLeftWheel: flGroup,
    frontRightWheel: frGroup,
    rearLeftWheel: rlGroup,
    rearRightWheel: rrGroup,
    brakeLights,
    headlights,
  };
}

/**
 * Factory builder function for any vehicle model
 */
export function buildVehicleModel(vehicleId: string, paintColor: string): CarMeshes {
  switch (vehicleId) {
    case 'veloce_hyperion':
      return buildVeloceHyperion(paintColor);
    case 'terra_raider':
      return buildTerraRaider(paintColor);
    case 'apex_gt':
    default:
      return buildApexGT(paintColor);
  }
}

/**
 * Updates the paint color on an existing car model without recreating geometry
 */
export function updateCarPaint(carMeshes: CarMeshes, colorHex: string): void {
  const color = new THREE.Color(colorHex);
  for (const mesh of carMeshes.bodyMeshes) {
    if (mesh.material && (mesh.material as THREE.MeshPhysicalMaterial).color) {
      (mesh.material as THREE.MeshPhysicalMaterial).color.copy(color);
    }
  }
}
