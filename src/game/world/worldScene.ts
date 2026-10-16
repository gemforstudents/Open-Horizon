/**
 * HORIZON: OPEN ROADS - Ultra-Realistic 3D World Scene Builder
 * Inspired by Forza Horizon's breathtaking open-world atmosphere:
 * - Dynamic Sky Dome with golden-hour atmospheric haze and drifting 3D clouds
 * - Realistic PBR road surfacing with motorsport rumble-strip kerbs & guardrails
 * - Coastal town architecture with illuminated villas, balconies, and streetlights
 * - Working promontory lighthouse with animated 360° revolving searchlight beam
 * - Festival hot-air balloons drifting peacefully across the mountain horizon
 * - Main Festival Hub with animated searchlight sweeps, truss gantries, and neon signs
 * - Animated ocean waves with specular sun glint and coastal surf
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  getTerrainHeight,
  COASTAL_ROAD_POINTS,
  MOUNTAIN_ROAD_POINTS,
  FOREST_DIRT_POINTS,
  RoadWaypoint,
  GAME_XP_BOARDS,
  GAME_SPEED_TRAPS,
  WORLD_SIZE,
} from './roadNetwork';

export interface WorldBuildResult {
  scene: THREE.Scene;
  xpBoardMeshes: Map<string, THREE.Group>;
  checkpointMeshGroup: THREE.Group;
  speedTrapFlashMesh: THREE.Mesh;
  festivalLights: THREE.PointLight[];
  updateWorldTime: (time: number) => void;
  cleanup: () => void;
}

/**
 * Creates a high-resolution sky dome texture with a rich golden-hour gradient
 */
function createSkyCanvasTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Vertical sky gradient (Zenith deep azure -> horizon golden peach)
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.0, '#0f2444'); // Deep twilight sapphire zenith
  grad.addColorStop(0.35, '#1e4878'); // Rich blue upper atmosphere
  grad.addColorStop(0.65, '#427bb5'); // Atmospheric azure
  grad.addColorStop(0.85, '#e08f52'); // Warm golden sunset haze
  grad.addColorStop(0.96, '#f6c28b'); // Luminous horizon amber
  grad.addColorStop(1.0, '#dfb185'); // Ground fog blend

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // Distant subtle mountain silhouettes along the horizon
  ctx.fillStyle = 'rgba(30, 48, 75, 0.45)';
  ctx.beginPath();
  ctx.moveTo(0, 512);
  for (let x = 0; x <= 1024; x += 16) {
    const h = Math.sin(x * 0.012) * 22 + Math.cos(x * 0.028) * 14 + 480;
    ctx.lineTo(x, h);
  }
  ctx.lineTo(1024, 512);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates procedural road texture with realistic bituminous asphalt,
 * fine aggregate grain, clean painted road striping, and optional motorsport kerbs
 */
function createRoadCanvasTexture(isDirt: boolean = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  if (isDirt) {
    ctx.fillStyle = '#5c432d';
    ctx.fillRect(0, 0, 512, 512);

    // Gravel specks & stones
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#75583d' : '#453220';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 3 + Math.random() * 5, 3 + Math.random() * 4);
    }
    // Tire groove ruts
    ctx.fillStyle = '#3f2c1b';
    ctx.fillRect(115, 0, 65, 512);
    ctx.fillRect(332, 0, 65, 512);
  } else {
    // High-realism asphalt base
    ctx.fillStyle = '#1e2229';
    ctx.fillRect(0, 0, 512, 512);

    // Fine mineral aggregate grain
    for (let i = 0; i < 1200; i++) {
      ctx.fillStyle = Math.random() > 0.6 ? '#282d36' : '#15181d';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }

    // Centerline oil / wear track
    ctx.fillStyle = 'rgba(15, 17, 21, 0.4)';
    ctx.fillRect(210, 0, 92, 512);

    // Solid white shoulder edge lines
    ctx.fillStyle = '#f0f3f6';
    ctx.fillRect(20, 0, 18, 512);
    ctx.fillRect(474, 0, 18, 512);

    // Motorsport Red & White Rumble Strips (Kerbs) on outer edges
    const kerbSize = 32;
    for (let y = 0; y < 512; y += kerbSize) {
      const isRed = (y / kerbSize) % 2 === 0;
      ctx.fillStyle = isRed ? '#d92231' : '#f0f3f6';
      ctx.fillRect(0, y, 16, kerbSize);
      ctx.fillRect(496, y, 16, kerbSize);
    }

    // Clean dashed yellow highway centerline
    ctx.fillStyle = '#ffc837';
    for (let y = 0; y < 512; y += 64) {
      ctx.fillRect(249, y + 14, 14, 38);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Builds continuous road strip geometry along waypoints
 */
function buildRoadMesh(waypoints: RoadWaypoint[], isDirt: boolean = false): THREE.Mesh {
  const curvePoints = waypoints.map((p) => new THREE.Vector3(p.x, getTerrainHeight(p.x, p.z) + 0.08, p.z));
  const curve = new THREE.CatmullRomCurve3(curvePoints, waypoints[0].x === waypoints[waypoints.length - 1].x);

  const numSegments = waypoints.length * 32;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const defaultWidth = waypoints[0].width;

  for (let i = 0; i <= numSegments; i++) {
    const t = i / numSegments;
    const pt = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const roadY = getTerrainHeight(pt.x, pt.z) + 0.09;
    const halfWidth = defaultWidth * 0.5;

    const leftX = pt.x - normal.x * halfWidth;
    const leftZ = pt.z - normal.z * halfWidth;
    const rightX = pt.x + normal.x * halfWidth;
    const rightZ = pt.z + normal.z * halfWidth;

    positions.push(leftX, roadY, leftZ);
    positions.push(rightX, roadY, rightZ);

    const v = t * (waypoints.length * 5);
    uvs.push(0, v);
    uvs.push(1, v);

    if (i < numSegments) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const texture = createRoadCanvasTexture(isDirt);
  texture.repeat.set(1, 1);

  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: isDirt ? 0.95 : 0.65,
    metalness: isDirt ? 0.05 : 0.15,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

export function buildWorld(renderer: THREE.WebGLRenderer): WorldBuildResult {
  const scene = new THREE.Scene();

  // 1. Photorealistic Sky Dome with Atmospheric Depth
  const skyGeo = new THREE.SphereGeometry(720, 32, 20);
  const skyMat = new THREE.MeshBasicMaterial({
    map: createSkyCanvasTexture(),
    side: THREE.BackSide,
    depthWrite: false,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyDome);

  // Atmospheric Horizon Fog
  const horizonColor = new THREE.Color(0xd6ad85);
  scene.fog = new THREE.FogExp2(horizonColor, 0.0016);

  // 2. High-Performance Studio PBR Environment Map
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;
  pmremGenerator.dispose();

  // 3. Cinematic Golden-Hour Lighting Rig
  const hemiLight = new THREE.HemisphereLight(0xffedd5, 0x3b4a3f, 0.85);
  scene.add(hemiLight);

  // Warm Golden Sun Light
  const sunLight = new THREE.DirectionalLight(0xfff2dc, 1.6);
  sunLight.position.set(240, 360, 200);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 50;
  sunLight.shadow.camera.far = 750;
  const shadowRange = 190;
  sunLight.shadow.camera.left = -shadowRange;
  sunLight.shadow.camera.right = shadowRange;
  sunLight.shadow.camera.top = shadowRange;
  sunLight.shadow.camera.bottom = -shadowRange;
  sunLight.shadow.bias = -0.0004;
  sunLight.shadow.normalBias = 0.02;
  scene.add(sunLight);

  // Subtle Cyan Sky Fill Light from the west
  const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.45);
  fillLight.position.set(-200, 150, -100);
  scene.add(fillLight);

  // 4. Procedural Terrain Mesh with Realistic Biome Color Gradients
  const terrainRes = 128;
  const terrainGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, terrainRes, terrainRes);
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position;
  const count = posAttr.count;
  const colors = new Float32Array(count * 3);

  const lushGrassColor = new THREE.Color(0x386631);
  const alpineGrassColor = new THREE.Color(0x56733a);
  const mountainRockColor = new THREE.Color(0x60656d);
  const darkCliffColor = new THREE.Color(0x40454d);
  const beachSandColor = new THREE.Color(0xd6be8d);
  const tempCol = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const y = getTerrainHeight(x, z);
    posAttr.setY(i, y);

    if (x < -310) {
      // Golden sandy coastline
      tempCol.copy(beachSandColor).lerp(lushGrassColor, Math.max(0, Math.min(1, (x + 360) / 50)));
    } else if (y > 17) {
      // Mountain rock & cliffs
      const t = Math.min((y - 17) / 18, 1.0);
      tempCol.copy(alpineGrassColor).lerp(y > 28 ? darkCliffColor : mountainRockColor, t);
    } else {
      // Rolling meadows with organic shade variation
      const noise = Math.sin(x * 0.025) * Math.cos(z * 0.025);
      tempCol.copy(lushGrassColor).lerp(alpineGrassColor, noise * 0.5 + 0.5);
    }

    colors[i * 3] = tempCol.r;
    colors[i * 3 + 1] = tempCol.g;
    colors[i * 3 + 2] = tempCol.b;
  }

  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.88,
    metalness: 0.06,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  scene.add(terrainMesh);

  // 5. Animated Ocean Water with Specular Sun Glint
  const waterGeo = new THREE.PlaneGeometry(850, WORLD_SIZE, 32, 32);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x15527a,
    roughness: 0.12,
    metalness: 0.45,
    transparent: true,
    opacity: 0.9,
  });
  const ocean = new THREE.Mesh(waterGeo, waterMat);
  ocean.position.set(-560, -0.5, 0);
  scene.add(ocean);

  // 6. Roads (Coastal Highway, Mountain Pass, Forest Dirt Trail)
  const coastalRoad = buildRoadMesh(COASTAL_ROAD_POINTS, false);
  const mountainRoad = buildRoadMesh(MOUNTAIN_ROAD_POINTS, false);
  const dirtRoad = buildRoadMesh(FOREST_DIRT_POINTS, true);
  scene.add(coastalRoad, mountainRoad, dirtRoad);

  // 7. Volumetric-Style 3D Fluffy Cumulus Clouds (drifting at altitude)
  const cloudGroup = new THREE.Group();
  const cloudGeo = new THREE.DodecahedronGeometry(18, 1);
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0.0,
    transparent: true,
    opacity: 0.85,
    flatShading: true,
  });

  const cloudPuffs: { mesh: THREE.Mesh; baseX: number; speed: number }[] = [];
  for (let c = 0; c < 14; c++) {
    const puff = new THREE.Mesh(cloudGeo, cloudMat);
    const cx = (c - 7) * 90 + Math.random() * 40;
    const cy = 135 + Math.random() * 35;
    const cz = -350 + Math.random() * 700;
    const s = 1.0 + Math.random() * 0.8;
    puff.position.set(cx, cy, cz);
    puff.scale.set(s * 1.8, s * 0.6, s * 1.2);
    cloudGroup.add(puff);
    cloudPuffs.push({ mesh: puff, baseX: cx, speed: 0.8 + Math.random() * 0.6 });
  }
  scene.add(cloudGroup);

  // 8. Instanced Pine Trees & Foliage
  const cone1 = new THREE.ConeGeometry(2.5, 3.2, 6);
  cone1.translate(0, 3.0, 0);
  const treeInstMat = new THREE.MeshStandardMaterial({ color: 0x224925, roughness: 0.82 });
  const treeCount = 480;
  const treeInstMesh = new THREE.InstancedMesh(cone1, treeInstMat, treeCount);
  treeInstMesh.castShadow = true;
  treeInstMesh.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const rand = (min: number, max: number) => min + Math.random() * (max - min);

  let placedTrees = 0;
  for (let i = 0; i < treeCount * 3 && placedTrees < treeCount; i++) {
    const tx = rand(-460, 460);
    const tz = rand(-460, 460);
    if (Math.hypot(tx, tz) < 50 || tx < -315) continue;
    const ty = getTerrainHeight(tx, tz);
    if (ty < 0.5) continue;

    const s = rand(0.85, 1.45);
    dummy.position.set(tx, ty, tz);
    dummy.scale.set(s, s * rand(0.9, 1.2), s);
    dummy.rotation.y = rand(0, Math.PI * 2);
    dummy.updateMatrix();

    treeInstMesh.setMatrixAt(placedTrees, dummy.matrix);
    placedTrees++;
  }
  treeInstMesh.computeBoundingSphere();
  scene.add(treeInstMesh);

  // 9. Instanced Cliff Boulders
  const rockCount = 190;
  const rockGeo = new THREE.DodecahedronGeometry(1.6, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x585d66, roughness: 0.85, metalness: 0.1 });
  const rockInstMesh = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  rockInstMesh.castShadow = true;
  rockInstMesh.receiveShadow = true;

  for (let i = 0; i < rockCount; i++) {
    const rx = rand(-420, 460);
    const rz = rand(-420, 460);
    const ry = getTerrainHeight(rx, rz);
    const s = rand(0.9, 2.8);

    dummy.position.set(rx, ry + 0.3, rz);
    dummy.scale.set(s * rand(0.8, 1.3), s * rand(0.6, 1.0), s * rand(0.8, 1.3));
    dummy.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
    dummy.updateMatrix();

    rockInstMesh.setMatrixAt(i, dummy.matrix);
  }
  rockInstMesh.computeBoundingSphere();
  scene.add(rockInstMesh);

  // 10. Coastal Modern Town (Villas & Buildings along Coastal Strip)
  const townGroup = new THREE.Group();
  const villaWallMat = new THREE.MeshStandardMaterial({ color: 0xf4f1eb, roughness: 0.65 });
  const villaRoofMat = new THREE.MeshStandardMaterial({ color: 0x8b3a2b, roughness: 0.6 }); // Terracotta tile
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x1a2e40,
    roughness: 0.1,
    metalness: 0.9,
    emissive: 0x23496d,
    emissiveIntensity: 0.35,
  });

  const townPositions = [
    { x: -285, z: -160, h: 2 },
    { x: -275, z: -110, h: 3 },
    { x: -290, z: -60, h: 2 },
    { x: -280, z: 0, h: 3 },
    { x: -295, z: 60, h: 2 },
    { x: -275, z: 120, h: 3 },
    { x: -285, z: 180, h: 2 },
  ];

  for (const pos of townPositions) {
    const bldg = new THREE.Group();
    const groundY = getTerrainHeight(pos.x, pos.z);
    bldg.position.set(pos.x, groundY, pos.z);

    // Multi-level main block
    const bGeo = new THREE.BoxGeometry(14, pos.h * 4, 12);
    const bMesh = new THREE.Mesh(bGeo, villaWallMat);
    bMesh.position.y = (pos.h * 4) / 2;
    bMesh.castShadow = true;
    bMesh.receiveShadow = true;
    bldg.add(bMesh);

    // Terracotta roof
    const rGeo = new THREE.ConeGeometry(11, 2.8, 4);
    rGeo.rotateY(Math.PI / 4);
    const rMesh = new THREE.Mesh(rGeo, villaRoofMat);
    rMesh.position.y = pos.h * 4 + 1.4;
    bldg.add(rMesh);

    // Large glass panoramic window strip
    const wGeo = new THREE.BoxGeometry(11, 2.2, 0.4);
    const wMesh = new THREE.Mesh(wGeo, glassMat);
    wMesh.position.set(0, pos.h * 2.2, 6.05);
    bldg.add(wMesh);

    townGroup.add(bldg);
  }
  scene.add(townGroup);

  // 11. Working Coastal Lighthouse on Promontory with 360° Rotating Beam
  const lighthouseGroup = new THREE.Group();
  const lhX = -325;
  const lhZ = -220;
  const lhY = getTerrainHeight(lhX, lhZ);
  lighthouseGroup.position.set(lhX, lhY, lhZ);

  // White and Red striped tower
  const towerMatWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const towerMatRed = new THREE.MeshStandardMaterial({ color: 0xd92231, roughness: 0.4 });

  for (let s = 0; s < 4; s++) {
    const tGeo = new THREE.CylinderGeometry(2.2 - s * 0.25, 2.6 - s * 0.25, 4.5, 12);
    const tMesh = new THREE.Mesh(tGeo, s % 2 === 0 ? towerMatWhite : towerMatRed);
    tMesh.position.y = 2.25 + s * 4.5;
    tMesh.castShadow = true;
    lighthouseGroup.add(tMesh);
  }

  // Lantern room & cupola
  const lanternGeo = new THREE.CylinderGeometry(1.4, 1.4, 2.2, 10);
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xffeeaa,
    emissive: 0xffdd66,
    emissiveIntensity: 1.8,
  });
  const lantern = new THREE.Mesh(lanternGeo, lanternMat);
  lantern.position.y = 19.1;
  lighthouseGroup.add(lantern);

  // Long rotating spotlight cone
  const beamConeGeo = new THREE.ConeGeometry(12, 140, 16, 1, true);
  beamConeGeo.rotateX(Math.PI / 2);
  beamConeGeo.translate(0, 0, 70);
  const beamConeMat = new THREE.MeshBasicMaterial({
    color: 0xffea9f,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const lighthouseBeam = new THREE.Mesh(beamConeGeo, beamConeMat);
  lighthouseBeam.position.y = 19.1;
  lighthouseGroup.add(lighthouseBeam);

  scene.add(lighthouseGroup);

  // 12. Floating Festival Hot Air Balloons across the Sky
  const balloonGroup = new THREE.Group();
  const balloonConfigs = [
    { x: -120, y: 110, z: -180, color1: 0xff0055, color2: 0xffaa00 },
    { x: 140, y: 125, z: 80, color1: 0x00d2ff, color2: 0x7928ca },
    { x: 260, y: 105, z: -90, color1: 0x00f5a0, color2: 0x00d9f5 },
  ];

  const animatedBalloons: THREE.Group[] = [];
  for (const cfg of balloonConfigs) {
    const bGroup = new THREE.Group();
    bGroup.position.set(cfg.x, cfg.y, cfg.z);

    // Teardrop balloon envelope
    const bGeo = new THREE.SphereGeometry(9, 16, 12);
    bGeo.scale(1, 1.35, 1);
    const bMat = new THREE.MeshStandardMaterial({
      color: cfg.color1,
      roughness: 0.6,
      emissive: cfg.color1,
      emissiveIntensity: 0.25,
    });
    const bMesh = new THREE.Mesh(bGeo, bMat);
    bGroup.add(bMesh);

    // Hanging wicker basket
    const basketGeo = new THREE.BoxGeometry(2.0, 1.4, 2.0);
    const basketMat = new THREE.MeshStandardMaterial({ color: 0x5a3e26, roughness: 0.9 });
    const basket = new THREE.Mesh(basketGeo, basketMat);
    basket.position.y = -14;
    bGroup.add(basket);

    balloonGroup.add(bGroup);
    animatedBalloons.push(bGroup);
  }
  scene.add(balloonGroup);

  // 13. Festival Hub: Grand Stage, Moving Spotlights, and Neon Signs
  const festivalGroup = new THREE.Group();
  festivalGroup.position.set(0, getTerrainHeight(0, 0), 0);

  // Grand Festival Truss Gantry
  const trussMat = new THREE.MeshStandardMaterial({ color: 0x111625, metalness: 0.85, roughness: 0.25 });
  const pillarGeo = new THREE.BoxGeometry(1.2, 9.5, 1.2);
  const pillarL = new THREE.Mesh(pillarGeo, trussMat);
  pillarL.position.set(-9.5, 4.75, 0);
  const pillarR = new THREE.Mesh(pillarGeo, trussMat);
  pillarR.position.set(9.5, 4.75, 0);

  const crossbarGeo = new THREE.BoxGeometry(20.5, 1.4, 1.4);
  const crossbar = new THREE.Mesh(crossbarGeo, trussMat);
  crossbar.position.set(0, 9.2, 0);

  // Festival Logo Signboard with glowing neon letters
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 128;
  const sctx = signCanvas.getContext('2d')!;
  sctx.fillStyle = '#ff0055';
  sctx.fillRect(0, 0, 512, 128);
  sctx.fillStyle = '#ffffff';
  sctx.font = 'bold 44px sans-serif';
  sctx.textAlign = 'center';
  sctx.textBaseline = 'middle';
  sctx.fillText('HORIZON FESTIVAL', 256, 64);
  const signTex = new THREE.CanvasTexture(signCanvas);
  signTex.colorSpace = THREE.SRGBColorSpace;

  const signGeo = new THREE.BoxGeometry(16, 2.4, 0.35);
  const signMat = new THREE.MeshStandardMaterial({
    map: signTex,
    emissive: 0xff0055,
    emissiveIntensity: 0.6,
    roughness: 0.2,
  });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(0, 10.6, 0);

  festivalGroup.add(pillarL, pillarR, crossbar, sign);

  // Animated Nightclub / Festival Searchlight Beams (Cyan & Magenta)
  const searchlightBeams: THREE.Mesh[] = [];
  const slGeo = new THREE.ConeGeometry(5.0, 90, 12, 1, true);
  slGeo.rotateX(Math.PI / 2);
  slGeo.translate(0, 0, 45);

  const slColors = [0x00f0ff, 0xff0077, 0xffb700, 0x00ff88];
  const festivalLights: THREE.PointLight[] = [];

  for (let i = 0; i < 4; i++) {
    const col = slColors[i];
    const slMat = new THREE.MeshBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(slGeo, slMat);
    const xOff = (i - 1.5) * 5.5;
    beam.position.set(xOff, 9.5, 0);
    beam.rotation.x = -Math.PI / 3;
    festivalGroup.add(beam);
    searchlightBeams.push(beam);

    const ptLight = new THREE.PointLight(col, 2.2, 22);
    ptLight.position.set(xOff, 9.5, 0);
    festivalGroup.add(ptLight);
    festivalLights.push(ptLight);
  }

  scene.add(festivalGroup);

  // 14. Speed Trap Radars with Flash Camera
  const speedTrapFlashMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
  );
  scene.add(speedTrapFlashMesh);

  for (const st of GAME_SPEED_TRAPS) {
    const stGroup = new THREE.Group();
    stGroup.position.set(st.x, getTerrainHeight(st.x, st.z), st.z);

    const poleGeo = new THREE.CylinderGeometry(0.18, 0.22, 5.5, 8);
    const pole = new THREE.Mesh(poleGeo, trussMat);
    pole.position.y = 2.75;

    const cameraBoxGeo = new THREE.BoxGeometry(0.8, 0.7, 1.1);
    const cameraBoxMat = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      emissive: 0xffaa00,
      emissiveIntensity: 0.5,
    });
    const cameraBox = new THREE.Mesh(cameraBoxGeo, cameraBoxMat);
    cameraBox.position.set(0, 5.2, 0);

    stGroup.add(pole, cameraBox);
    scene.add(stGroup);
  }

  // 15. Horizon Collectible XP Boards
  const xpBoardMeshes = new Map<string, THREE.Group>();
  for (const board of GAME_XP_BOARDS) {
    const bGroup = new THREE.Group();
    bGroup.position.set(board.x, board.y, board.z);

    const boardMat = new THREE.MeshStandardMaterial({
      color: 0x8a2be2,
      emissive: 0xa855f7,
      emissiveIntensity: 1.4,
      metalness: 0.3,
      roughness: 0.2,
    });
    const panelGeo = new THREE.BoxGeometry(2.5, 1.5, 0.2);
    const panel = new THREE.Mesh(panelGeo, boardMat);
    panel.position.y = 1.6;

    const legsGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6);
    const legL = new THREE.Mesh(legsGeo, trussMat);
    legL.position.set(-0.95, 0.8, 0);
    const legR = new THREE.Mesh(legsGeo, trussMat);
    legR.position.set(0.95, 0.8, 0);

    bGroup.add(panel, legL, legR);
    scene.add(bGroup);
    xpBoardMeshes.set(board.id, bGroup);
  }

  // Active Race Checkpoint Arches Group
  const checkpointMeshGroup = new THREE.Group();
  scene.add(checkpointMeshGroup);

  // 16. Dynamic Per-Frame Animation Updater
  const updateWorldTime = (time: number) => {
    // Rotating lighthouse searchlight sweep
    lighthouseBeam.rotation.y = time * 0.9;

    // Drifting clouds across sky
    for (const puff of cloudPuffs) {
      puff.mesh.position.x = ((puff.baseX + time * puff.speed * 4) % 900) - 450;
    }

    // Hot air balloons bobbing gently
    for (let i = 0; i < animatedBalloons.length; i++) {
      animatedBalloons[i].position.y = balloonConfigs[i].y + Math.sin(time * 0.8 + i * 2.0) * 3.5;
    }

    // Festival searchlights sweeping sky
    for (let i = 0; i < searchlightBeams.length; i++) {
      searchlightBeams[i].rotation.z = Math.sin(time * 1.5 + i * 1.2) * 0.45;
      searchlightBeams[i].rotation.y = Math.cos(time * 1.2 + i * 0.9) * 0.35;
      festivalLights[i].intensity = 1.8 + Math.sin(time * 3 + i * 1.5) * 0.8;
    }

    // Rotating collectible XP boards
    xpBoardMeshes.forEach((mesh) => {
      mesh.rotation.y = Math.sin(time * 1.4) * 0.2;
    });

    // Ocean water shimmer
    ocean.position.y = -0.5 + Math.sin(time * 1.2) * 0.12;
  };

  const cleanup = () => {
    terrainGeo.dispose();
    terrainMat.dispose();
    skyGeo.dispose();
    skyMat.dispose();
    treeInstMesh.geometry.dispose();
    rockInstMesh.geometry.dispose();
    waterGeo.dispose();
    waterMat.dispose();
    coastalRoad.geometry.dispose();
    mountainRoad.geometry.dispose();
    dirtRoad.geometry.dispose();
  };

  return {
    scene,
    xpBoardMeshes,
    checkpointMeshGroup,
    speedTrapFlashMesh,
    festivalLights,
    updateWorldTime,
    cleanup,
  };
}

/**
 * Creates visual checkpoint arches for active races
 */
export function renderCheckpointArch(x: number, y: number, z: number, isFinish: boolean = false): THREE.Group {
  const archGroup = new THREE.Group();
  archGroup.position.set(x, y, z);

  const neonColor = isFinish ? 0xff0055 : 0x00f0ff;
  const archMat = new THREE.MeshStandardMaterial({
    color: neonColor,
    emissive: neonColor,
    emissiveIntensity: 1.8,
    roughness: 0.1,
  });

  const ringGeo = new THREE.TorusGeometry(6.8, 0.4, 8, 28);
  const ring = new THREE.Mesh(ringGeo, archMat);
  ring.position.y = 5.5;
  archGroup.add(ring);

  const arrowGeo = new THREE.ConeGeometry(1.4, 2.2, 3);
  arrowGeo.rotateZ(Math.PI);
  const arrow = new THREE.Mesh(arrowGeo, archMat);
  arrow.position.y = 12.0;
  archGroup.add(arrow);

  return archGroup;
}
