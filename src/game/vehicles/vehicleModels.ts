/**
 * HORIZON: OPEN ROADS - Vehicle 3D Procedural Models & Configurations
 * High-Realism Composite Procedural Vehicles with:
 * - Automotive MeshPhysicalMaterial paint with high-gloss clearcoat
 * - Tinted reflective glass and carbon fiber aero diffusers/spoilers
 * - Drilled metallic brake rotors with performance colored calipers
 * - Volumetric forward projector headlight beams illuminating the road
 * - High-intensity LED brake light glow bars
 * - Dynamic vehicle paint color updates
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
    acceleration: 3.5,
    handling: 8.8,
    braking: 8.5,
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
    acceleration: 2.4,
    handling: 9.6,
    braking: 9.6,
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
    topSpeedKmh: 225,
    acceleration: 4.0,
    handling: 7.5,
    braking: 8.0,
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
 * Creates an authentic wheel assembly with rubber tread, drilled steel rotor,
 * alloy rim, 5-spoke star, and performance colored brake caliper
 */
function createWheelAssembly(
  radius: number,
  width: number,
  isOffroad: boolean = false,
  caliperColor: number = 0xff1744
): THREE.Group {
  const wheelGroup = new THREE.Group();

  // Rubber Tire
  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 20, 1);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x181a1d,
    roughness: 0.94,
    metalness: 0.05,
  });
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.castShadow = true;
  wheelGroup.add(tire);

  // Drilled steel brake rotor disc
  const rotorRadius = radius * 0.72;
  const rotorGeo = new THREE.CylinderGeometry(rotorRadius, rotorRadius, 0.02, 16);
  rotorGeo.rotateZ(Math.PI / 2);
  const rotorMat = new THREE.MeshStandardMaterial({
    color: 0xa0a5ab,
    metalness: 0.95,
    roughness: 0.2,
  });
  const rotor = new THREE.Mesh(rotorGeo, rotorMat);
  wheelGroup.add(rotor);

  // Wheel Rim
  const rimRadius = radius * (isOffroad ? 0.65 : 0.74);
  const rimGeo = new THREE.CylinderGeometry(rimRadius, rimRadius, width + 0.015, 18, 1);
  rimGeo.rotateZ(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xdde2e8,
    metalness: 0.92,
    roughness: 0.18,
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  wheelGroup.add(rim);

  // Alloy 5-Spoke Pattern
  const spokeMat = new THREE.MeshStandardMaterial({
    color: 0x242830,
    metalness: 0.88,
    roughness: 0.22,
  });
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    const spokeGeo = new THREE.BoxGeometry(rimRadius * 1.6, 0.045, width + 0.02);
    const spoke = new THREE.Mesh(spokeGeo, spokeMat);
    spoke.rotation.x = angle;
    wheelGroup.add(spoke);
  }

  // Performance Brake Caliper
  const caliperGeo = new THREE.BoxGeometry(0.065, rimRadius * 0.68, 0.09);
  const caliperMat = new THREE.MeshStandardMaterial({
    color: caliperColor,
    metalness: 0.65,
    roughness: 0.25,
  });
  const caliper = new THREE.Mesh(caliperGeo, caliperMat);
  caliper.position.set(0, rimRadius * 0.45, 0);
  wheelGroup.add(caliper);

  return wheelGroup;
}

/**
 * Creates realistic volumetric forward projector light cones
 */
function createHeadlightBeams(xOffset: number, y: number, z: number): THREE.Group {
  const beamGroup = new THREE.Group();
  const beamGeo = new THREE.ConeGeometry(3.6, 32, 16, 1, true);
  beamGeo.rotateX(Math.PI / 2);
  beamGeo.translate(0, 0, 16);

  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xdbeafe,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const beamL = new THREE.Mesh(beamGeo, beamMat);
  beamL.position.set(-xOffset, y, z);
  const beamR = new THREE.Mesh(beamGeo, beamMat);
  beamR.position.set(xOffset, y, z);

  beamGroup.add(beamL, beamR);
  return beamGroup;
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

  // Deep automotive clearcoat paint
  const paintMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(paintColorHex),
    metalness: 0.82,
    roughness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    reflectivity: 0.9,
  });

  // Dark tinted reflective glass
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0c111d,
    metalness: 0.95,
    roughness: 0.05,
    transmission: 0.65,
    thickness: 0.6,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x14161a,
    roughness: 0.35,
    metalness: 0.7,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xdcdcdc,
    roughness: 0.1,
    metalness: 0.95,
  });

  // 1. Sculpted Body & Wheel Arches
  const bodyGeo = new THREE.BoxGeometry(1.88, 0.48, 4.3);
  const body = new THREE.Mesh(bodyGeo, paintMat);
  body.position.set(0, 0.5, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  chassis.add(body);
  bodyMeshes.push(body);

  // 2. Cabin / Greenhouse
  const cabinGeo = new THREE.BoxGeometry(1.5, 0.46, 2.15);
  const cabin = new THREE.Mesh(cabinGeo, glassMat);
  cabin.position.set(0, 0.88, -0.2);
  cabin.castShadow = true;
  chassis.add(cabin);

  // Roof panel
  const roofGeo = new THREE.BoxGeometry(1.42, 0.08, 1.85);
  const roof = new THREE.Mesh(roofGeo, paintMat);
  roof.position.set(0, 1.12, -0.2);
  roof.castShadow = true;
  chassis.add(roof);
  bodyMeshes.push(roof);

  // 3. Sloped Hood with power bulge
  const hoodGeo = new THREE.BoxGeometry(1.68, 0.18, 1.35);
  const hood = new THREE.Mesh(hoodGeo, paintMat);
  hood.position.set(0, 0.68, 1.25);
  hood.rotation.x = -0.1;
  hood.castShadow = true;
  chassis.add(hood);
  bodyMeshes.push(hood);

  // 4. Front Carbon Splitter
  const splitterGeo = new THREE.BoxGeometry(1.92, 0.06, 0.65);
  const splitter = new THREE.Mesh(splitterGeo, carbonMat);
  splitter.position.set(0, 0.26, 2.05);
  splitter.castShadow = true;
  chassis.add(splitter);

  // 5. Rear Ducktail Spoiler
  const spoilerGeo = new THREE.BoxGeometry(1.72, 0.09, 0.38);
  const spoiler = new THREE.Mesh(spoilerGeo, carbonMat);
  spoiler.position.set(0, 0.82, -2.05);
  spoiler.rotation.x = 0.22;
  spoiler.castShadow = true;
  chassis.add(spoiler);

  // 6. Dual Chrome Exhaust Tips
  const exhaustGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.25, 14);
  exhaustGeo.rotateX(Math.PI / 2);
  const exhaustL = new THREE.Mesh(exhaustGeo, chromeMat);
  exhaustL.position.set(-0.55, 0.32, -2.18);
  const exhaustR = new THREE.Mesh(exhaustGeo, chromeMat);
  exhaustR.position.set(0.55, 0.32, -2.18);
  chassis.add(exhaustL, exhaustR);

  // 7. Projector LED Headlights & Forward Beams
  const headlightGeo = new THREE.BoxGeometry(0.36, 0.12, 0.08);
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x93c5fd,
    emissiveIntensity: 1.6,
  });
  const headlightL = new THREE.Mesh(headlightGeo, headlightMat);
  headlightL.position.set(-0.66, 0.58, 2.14);
  const headlightR = new THREE.Mesh(headlightGeo, headlightMat);
  headlightR.position.set(0.66, 0.58, 2.14);
  chassis.add(headlightL, headlightR);
  headlights.push(headlightL, headlightR);

  // Volumetric Headlight Beams illuminating the road ahead
  chassis.add(createHeadlightBeams(0.66, 0.58, 2.15));

  // 8. Full-Width Glowing LED Taillight Bar
  const taillightGeo = new THREE.BoxGeometry(1.68, 0.12, 0.06);
  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xff1744,
    emissive: 0xff0033,
    emissiveIntensity: 1.2,
  });
  const taillight = new THREE.Mesh(taillightGeo, taillightMat);
  taillight.position.set(0, 0.62, -2.14);
  chassis.add(taillight);
  brakeLights.push(taillight);

  // Wheels
  const wheelRadius = 0.36;
  const wheelWidth = 0.28;
  const frontTrack = 0.93;
  const rearTrack = 0.95;
  const wheelbaseFront = 1.35;
  const wheelbaseRear = -1.35;

  const flGroup = createWheelAssembly(wheelRadius, wheelWidth, false, 0xff1744);
  flGroup.position.set(-frontTrack, wheelRadius, wheelbaseFront);
  const frGroup = createWheelAssembly(wheelRadius, wheelWidth, false, 0xff1744);
  frGroup.position.set(frontTrack, wheelRadius, wheelbaseFront);
  frGroup.rotation.y = Math.PI;

  const rlGroup = createWheelAssembly(wheelRadius, wheelWidth * 1.1, false, 0xff1744);
  rlGroup.position.set(-rearTrack, wheelRadius, wheelbaseRear);
  const rrGroup = createWheelAssembly(wheelRadius, wheelWidth * 1.1, false, 0xff1744);
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
 * Creates the Veloce Hyperion twin-turbo V10 carbon hypercar
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
    metalness: 0.88,
    roughness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    reflectivity: 0.95,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x0f1114,
    roughness: 0.35,
    metalness: 0.75,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x090e18,
    metalness: 0.96,
    roughness: 0.04,
    transmission: 0.7,
  });

  // 1. Ultra-Low Slung Wedge Hypercar Body
  const bodyGeo = new THREE.BoxGeometry(2.0, 0.38, 4.65);
  const body = new THREE.Mesh(bodyGeo, paintMat);
  body.position.set(0, 0.42, 0);
  body.castShadow = true;
  chassis.add(body);
  bodyMeshes.push(body);

  // 2. Teardrop Fighter Jet Canopy
  const canopyGeo = new THREE.CylinderGeometry(0.55, 0.78, 2.0, 18);
  canopyGeo.rotateX(Math.PI / 2);
  canopyGeo.scale(1.25, 0.52, 1.0);
  const canopy = new THREE.Mesh(canopyGeo, glassMat);
  canopy.position.set(0, 0.76, 0.05);
  canopy.castShadow = true;
  chassis.add(canopy);

  // 3. Aerodynamic Sharp Front Nose
  const noseGeo = new THREE.ConeGeometry(0.98, 1.3, 4);
  noseGeo.rotateX(Math.PI / 2);
  noseGeo.scale(1.0, 0.35, 1.0);
  const nose = new THREE.Mesh(noseGeo, paintMat);
  nose.position.set(0, 0.41, 2.35);
  nose.castShadow = true;
  chassis.add(nose);
  bodyMeshes.push(nose);

  // 4. Large Side Carbon Air Intakes
  const podLGeo = new THREE.BoxGeometry(0.28, 0.36, 1.5);
  const podL = new THREE.Mesh(podLGeo, carbonMat);
  podL.position.set(-0.98, 0.46, -0.4);
  const podR = new THREE.Mesh(podLGeo, carbonMat);
  podR.position.set(0.98, 0.46, -0.4);
  chassis.add(podL, podR);

  // 5. Massive High-Downforce Carbon GT Wing
  const wingGeo = new THREE.BoxGeometry(2.1, 0.08, 0.48);
  const wing = new THREE.Mesh(wingGeo, carbonMat);
  wing.position.set(0, 1.02, -2.15);
  wing.rotation.x = 0.16;
  wing.castShadow = true;
  chassis.add(wing);

  // Wing carbon struts
  const strutGeo = new THREE.BoxGeometry(0.06, 0.45, 0.25);
  const strutL = new THREE.Mesh(strutGeo, carbonMat);
  strutL.position.set(-0.55, 0.8, -2.12);
  const strutR = new THREE.Mesh(strutGeo, carbonMat);
  strutR.position.set(0.55, 0.8, -2.12);
  chassis.add(strutL, strutR);

  // 6. Quad Titanium Exhausts
  const quadGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.22, 12);
  quadGeo.rotateX(Math.PI / 2);
  const exMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.95, roughness: 0.1 });
  for (let e = 0; e < 4; e++) {
    const ex = new THREE.Mesh(quadGeo, exMat);
    ex.position.set((e - 1.5) * 0.16, 0.48, -2.34);
    chassis.add(ex);
  }

  // 7. Sharp Slit LED Headlights & Volumetric Beams
  const headlightGeo = new THREE.BoxGeometry(0.42, 0.07, 0.08);
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.8,
  });
  const headlightL = new THREE.Mesh(headlightGeo, headlightMat);
  headlightL.position.set(-0.7, 0.5, 2.3);
  headlightL.rotation.y = 0.25;
  const headlightR = new THREE.Mesh(headlightGeo, headlightMat);
  headlightR.position.set(0.7, 0.5, 2.3);
  headlightR.rotation.y = -0.25;
  chassis.add(headlightL, headlightR);
  headlights.push(headlightL, headlightR);

  // Volumetric Headlight Beams
  chassis.add(createHeadlightBeams(0.7, 0.5, 2.32));

  // 8. Aggressive Rear Diffuser & Light Bar
  const taillightGeo = new THREE.BoxGeometry(1.85, 0.08, 0.06);
  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xff0044,
    emissive: 0xff0044,
    emissiveIntensity: 1.5,
  });
  const taillight = new THREE.Mesh(taillightGeo, taillightMat);
  taillight.position.set(0, 0.58, -2.32);
  chassis.add(taillight);
  brakeLights.push(taillight);

  // Wheels (Low profile hypercar rims with yellow ceramic calipers)
  const wheelRadius = 0.35;
  const wheelWidth = 0.32;
  const frontTrack = 0.98;
  const rearTrack = 1.02;
  const wheelbaseFront = 1.45;
  const wheelbaseRear = -1.45;

  const flGroup = createWheelAssembly(wheelRadius, wheelWidth, false, 0xffd600);
  flGroup.position.set(-frontTrack, wheelRadius, wheelbaseFront);
  const frGroup = createWheelAssembly(wheelRadius, wheelWidth, false, 0xffd600);
  frGroup.position.set(frontTrack, wheelRadius, wheelbaseFront);
  frGroup.rotation.y = Math.PI;

  const rlGroup = createWheelAssembly(wheelRadius, wheelWidth * 1.15, false, 0xffd600);
  rlGroup.position.set(-rearTrack, wheelRadius, wheelbaseRear);
  const rrGroup = createWheelAssembly(wheelRadius, wheelWidth * 1.15, false, 0xffd600);
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
 * Creates the Terra Raider 4x4 off-road trophy truck
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
    metalness: 0.65,
    roughness: 0.3,
    clearcoat: 0.8,
    clearcoatRoughness: 0.15,
  });

  const rollbarMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.6,
    metalness: 0.85,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    metalness: 0.9,
    roughness: 0.1,
    transmission: 0.6,
  });

  // 1. Heavy-duty Boxy Raid Body
  const bodyGeo = new THREE.BoxGeometry(2.05, 0.65, 4.4);
  const body = new THREE.Mesh(bodyGeo, paintMat);
  body.position.set(0, 0.72, 0);
  body.castShadow = true;
  chassis.add(body);
  bodyMeshes.push(body);

  // 2. High-roof Cabin
  const cabinGeo = new THREE.BoxGeometry(1.65, 0.62, 2.2);
  const cabin = new THREE.Mesh(cabinGeo, glassMat);
  cabin.position.set(0, 1.25, -0.15);
  cabin.castShadow = true;
  chassis.add(cabin);

  // Roof cap
  const roofGeo = new THREE.BoxGeometry(1.58, 0.08, 2.1);
  const roof = new THREE.Mesh(roofGeo, paintMat);
  roof.position.set(0, 1.58, -0.15);
  roof.castShadow = true;
  chassis.add(roof);
  bodyMeshes.push(roof);

  // 3. Heavy-Duty Steel Bull-Bar on Front Bumper
  const bullbarGeo = new THREE.BoxGeometry(2.1, 0.4, 0.35);
  const bullbar = new THREE.Mesh(bullbarGeo, rollbarMat);
  bullbar.position.set(0, 0.58, 2.25);
  bullbar.castShadow = true;
  chassis.add(bullbar);

  // 4. Roof-Mounted LED Baja Light-Bar
  const lightbarGeo = new THREE.BoxGeometry(1.4, 0.14, 0.18);
  const lightbarMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffeedd,
    emissiveIntensity: 2.2,
  });
  const lightbar = new THREE.Mesh(lightbarGeo, lightbarMat);
  lightbar.position.set(0, 1.7, 0.8);
  chassis.add(lightbar);
  headlights.push(lightbar);

  // 5. External Roll Cage Tubing in Rear Bed
  const tubeMat = rollbarMat;
  const tubeGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8);
  const t1 = new THREE.Mesh(tubeGeo, tubeMat);
  t1.position.set(-0.75, 1.15, -1.5);
  const t2 = new THREE.Mesh(tubeGeo, tubeMat);
  t2.position.set(0.75, 1.15, -1.5);
  chassis.add(t1, t2);

  // 6. Spare Tire mounted on rear
  const spareWheel = createWheelAssembly(0.42, 0.34, true);
  spareWheel.position.set(0, 1.0, -2.15);
  spareWheel.rotation.x = Math.PI / 2;
  chassis.add(spareWheel);

  // 7. Rugged Round Headlights & Volumetric Beams
  const headlightGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16);
  headlightGeo.rotateX(Math.PI / 2);
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffddaa,
    emissiveIntensity: 1.8,
  });
  const headlightL = new THREE.Mesh(headlightGeo, headlightMat);
  headlightL.position.set(-0.72, 0.75, 2.22);
  const headlightR = new THREE.Mesh(headlightGeo, headlightMat);
  headlightR.position.set(0.72, 0.75, 2.22);
  chassis.add(headlightL, headlightR);
  headlights.push(headlightL, headlightR);

  // Volumetric Headlight Beams
  chassis.add(createHeadlightBeams(0.72, 0.75, 2.25));

  // 8. Dual Vertical Taillights
  const taillightGeo = new THREE.BoxGeometry(0.18, 0.45, 0.08);
  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xff1744,
    emissive: 0xff0020,
    emissiveIntensity: 1.2,
  });
  const taillightL = new THREE.Mesh(taillightGeo, taillightMat);
  taillightL.position.set(-0.85, 0.8, -2.2);
  const taillightR = new THREE.Mesh(taillightGeo, taillightMat);
  taillightR.position.set(0.85, 0.8, -2.2);
  chassis.add(taillightL, taillightR);
  brakeLights.push(taillightL, taillightR);

  // Off-Road Large Diameter Wheels with Deep Tread
  const wheelRadius = 0.45;
  const wheelWidth = 0.36;
  const frontTrack = 1.05;
  const rearTrack = 1.05;
  const wheelbaseFront = 1.4;
  const wheelbaseRear = -1.4;

  const flGroup = createWheelAssembly(wheelRadius, wheelWidth, true, 0x00f0ff);
  flGroup.position.set(-frontTrack, wheelRadius, wheelbaseFront);
  const frGroup = createWheelAssembly(wheelRadius, wheelWidth, true, 0x00f0ff);
  frGroup.position.set(frontTrack, wheelRadius, wheelbaseFront);
  frGroup.rotation.y = Math.PI;

  const rlGroup = createWheelAssembly(wheelRadius, wheelWidth, true, 0x00f0ff);
  rlGroup.position.set(-rearTrack, wheelRadius, wheelbaseRear);
  const rrGroup = createWheelAssembly(wheelRadius, wheelWidth, true, 0x00f0ff);
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
 * Updates paint color on any instantiated vehicle model
 */
export function updateCarPaint(carMeshes: CarMeshes, colorHex: string): void {
  const newColor = new THREE.Color(colorHex);
  for (const mesh of carMeshes.bodyMeshes) {
    if (mesh.material instanceof THREE.MeshPhysicalMaterial || mesh.material instanceof THREE.MeshStandardMaterial) {
      mesh.material.color = newColor;
    }
  }
}

/**
 * Universal vehicle model builder
 */
export function buildVehicleModel(vehicleId: string, paintColorHex: string): CarMeshes {
  if (vehicleId === 'veloce_hyperion') {
    return buildVeloceHyperion(paintColorHex);
  }
  if (vehicleId === 'terra_raider') {
    return buildTerraRaider(paintColorHex);
  }
  return buildApexGT(paintColorHex);
}
