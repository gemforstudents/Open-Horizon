/**
 * HORIZON: OPEN ROADS - 3D World Scene Builder
 * Follows Three.js Skill directives: Instanced scenery, RoomEnvironment PBR,
 * atmospheric fog, and zero 404 external asset dependencies.
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
import { CollectibleBoard } from '../../types/game';

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
 * Creates procedural road texture with dashed yellow centerline and white edge lines
 */
function createRoadCanvasTexture(isDirt: boolean = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  if (isDirt) {
    ctx.fillStyle = '#6b5138';
    ctx.fillRect(0, 0, 512, 512);
    // Gravel specks
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#826549' : '#523e2b';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 4 + Math.random() * 6, 3 + Math.random() * 5);
    }
    // Tire ruts
    ctx.fillStyle = '#483523';
    ctx.fillRect(120, 0, 50, 512);
    ctx.fillRect(342, 0, 50, 512);
  } else {
    // Asphalt base
    ctx.fillStyle = '#23272e';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle asphalt grain
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#2d333b' : '#1b1d22';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }

    // White edge lines
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(24, 0, 16, 512);
    ctx.fillRect(472, 0, 16, 512);

    // Yellow dashed centerline
    ctx.fillStyle = '#ffd166';
    for (let y = 0; y < 512; y += 64) {
      ctx.fillRect(250, y + 12, 12, 40);
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

  const numSegments = waypoints.length * 28;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const defaultWidth = waypoints[0].width;

  for (let i = 0; i <= numSegments; i++) {
    const t = i / numSegments;
    const pt = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    // Adjust road Y flush with terrain
    const roadY = getTerrainHeight(pt.x, pt.z) + 0.08;
    const halfWidth = defaultWidth * 0.5;

    const leftX = pt.x - normal.x * halfWidth;
    const leftZ = pt.z - normal.z * halfWidth;
    const rightX = pt.x + normal.x * halfWidth;
    const rightZ = pt.z + normal.z * halfWidth;

    positions.push(leftX, roadY, leftZ);
    positions.push(rightX, roadY, rightZ);

    const v = t * (waypoints.length * 4);
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
    roughness: isDirt ? 0.95 : 0.75,
    metalness: 0.1,
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

  // 1. Atmosphere & Fog (Three.js Directive: match fog to horizon sky)
  const skyColor = new THREE.Color(0xa7c5eb);
  scene.background = skyColor;
  scene.fog = new THREE.FogExp2(0xa7c5eb, 0.0018);

  // 2. Studio PBR Environment Map via RoomEnvironment
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;
  pmremGenerator.dispose();

  // 3. Lighting Rig (Key Sun Light + Hemisphere Sky/Ground Light)
  const hemiLight = new THREE.HemisphereLight(0xe8f0fe, 0x475e3e, 0.7);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfff7e6, 1.3);
  sunLight.position.set(220, 340, 180);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 50;
  sunLight.shadow.camera.far = 700;
  const shadowRange = 180;
  sunLight.shadow.camera.left = -shadowRange;
  sunLight.shadow.camera.right = shadowRange;
  sunLight.shadow.camera.top = shadowRange;
  sunLight.shadow.camera.bottom = -shadowRange;
  sunLight.shadow.bias = -0.0005;
  sunLight.shadow.normalBias = 0.02;
  scene.add(sunLight);

  // 4. Procedural Terrain Mesh with Vertex Colors (Grass, Sand, Mountain Stone)
  const terrainRes = 120;
  const terrainGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, terrainRes, terrainRes);
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position;
  const count = posAttr.count;
  const colors = new Float32Array(count * 3);

  const grassColor = new THREE.Color(0x406a38);
  const dryGrassColor = new THREE.Color(0x60773d);
  const rockColor = new THREE.Color(0x64696e);
  const sandColor = new THREE.Color(0xd4b483);
  const tempCol = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const y = getTerrainHeight(x, z);
    posAttr.setY(i, y);

    // Color gradient based on elevation and ocean distance
    if (x < -310) {
      // Sandy coastal shoreline
      tempCol.copy(sandColor).lerp(grassColor, Math.max(0, Math.min(1, (x + 360) / 50)));
    } else if (y > 18) {
      // Mountain rock
      const t = Math.min((y - 18) / 16, 1.0);
      tempCol.copy(grassColor).lerp(rockColor, t);
    } else {
      // Rolling meadow & hills with natural patchiness
      const noise = Math.sin(x * 0.03) * Math.cos(z * 0.03);
      tempCol.copy(grassColor).lerp(dryGrassColor, noise * 0.5 + 0.5);
    }

    colors[i * 3] = tempCol.r;
    colors[i * 3 + 1] = tempCol.g;
    colors[i * 3 + 2] = tempCol.b;
  }

  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.9,
    metalness: 0.05,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  scene.add(terrainMesh);

  // 5. Ocean Water Plane along West Coast
  const waterGeo = new THREE.PlaneGeometry(800, WORLD_SIZE);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x1d5f8a,
    roughness: 0.15,
    metalness: 0.3,
    transparent: true,
    opacity: 0.88,
  });
  const ocean = new THREE.Mesh(waterGeo, waterMat);
  ocean.position.set(-550, -0.6, 0);
  scene.add(ocean);

  // 6. Roads (Coastal Highway, Mountain Pass, Forest Dirt Trail)
  const coastalRoad = buildRoadMesh(COASTAL_ROAD_POINTS, false);
  const mountainRoad = buildRoadMesh(MOUNTAIN_ROAD_POINTS, false);
  const dirtRoad = buildRoadMesh(FOREST_DIRT_POINTS, true);
  scene.add(coastalRoad, mountainRoad, dirtRoad);

  // 7. Instanced Pine Trees & Coastal Palms
  // Pine Tree Template
  const pineGroup = new THREE.Group();
  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 2.5, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1b, roughness: 0.9 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1.25;
  pineGroup.add(trunk);

  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x224928, roughness: 0.85 });
  for (let tier = 0; tier < 3; tier++) {
    const fGeo = new THREE.ConeGeometry(2.4 - tier * 0.5, 2.2, 7);
    const fMesh = new THREE.Mesh(fGeo, foliageMat);
    fMesh.position.y = 2.8 + tier * 1.4;
    pineGroup.add(fMesh);
  }

  // Scatter instanced trees across hills and forests (avoiding road centerlines)
  const treeCount = 450;
  const treeDummy = new THREE.Object3D();

  // Combine pine mesh into single geometry for InstancedMesh
  const trunkGeom = trunkGeo.clone();
  trunkGeom.translate(0, 1.25, 0);
  const cone1 = new THREE.ConeGeometry(2.4, 2.2, 6);
  cone1.translate(0, 2.8, 0);
  const cone2 = new THREE.ConeGeometry(1.9, 2.2, 6);
  cone2.translate(0, 4.2, 0);

  // Instanced trees mesh
  const treeInstGeo = cone1; // Main silhouette cone
  const treeInstMat = new THREE.MeshStandardMaterial({ color: 0x244f2b, roughness: 0.85 });
  const treeInstMesh = new THREE.InstancedMesh(treeInstGeo, treeInstMat, treeCount);
  treeInstMesh.castShadow = true;
  treeInstMesh.receiveShadow = true;

  let placedTrees = 0;
  const rand = (min: number, max: number) => min + Math.random() * (max - min);

  for (let i = 0; i < treeCount * 3 && placedTrees < treeCount; i++) {
    const tx = rand(-450, 450);
    const tz = rand(-450, 450);

    // Keep clear of festival hub center and water
    if (Math.hypot(tx, tz) < 45 || tx < -320) continue;

    const ty = getTerrainHeight(tx, tz);
    if (ty < 0) continue;

    const scale = rand(0.8, 1.4);
    treeDummy.position.set(tx, ty, tz);
    treeDummy.scale.set(scale, scale, scale);
    treeDummy.rotation.y = rand(0, Math.PI * 2);
    treeDummy.updateMatrix();

    treeInstMesh.setMatrixAt(placedTrees, treeDummy.matrix);
    placedTrees++;
  }
  treeInstMesh.computeBoundingSphere();
  scene.add(treeInstMesh);

  // 8. Instanced Rocks and Boulders along cliffs
  const rockCount = 180;
  const rockGeo = new THREE.DodecahedronGeometry(1.5, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x5a5e65, roughness: 0.8, metalness: 0.1 });
  const rockInstMesh = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  rockInstMesh.castShadow = true;
  rockInstMesh.receiveShadow = true;

  for (let i = 0; i < rockCount; i++) {
    const rx = rand(-400, 450);
    const rz = rand(-400, 450);
    const ry = getTerrainHeight(rx, rz);
    const scale = rand(0.8, 2.5);

    treeDummy.position.set(rx, ry + 0.4, rz);
    treeDummy.scale.set(scale * rand(0.8, 1.2), scale * rand(0.6, 1.0), scale * rand(0.8, 1.2));
    treeDummy.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
    treeDummy.updateMatrix();

    rockInstMesh.setMatrixAt(i, treeDummy.matrix);
  }
  rockInstMesh.computeBoundingSphere();
  scene.add(rockInstMesh);

  // 9. Festival Hub: Main Arch, Stage, Lights, Start Grid
  const festivalGroup = new THREE.Group();
  festivalGroup.position.set(0, getTerrainHeight(0, 0), 0);

  // Big Festival Truss Gantry
  const trussMat = new THREE.MeshStandardMaterial({ color: 0x111625, metalness: 0.8, roughness: 0.3 });
  const pillarGeo = new THREE.BoxGeometry(0.8, 8, 0.8);
  const pillarL = new THREE.Mesh(pillarGeo, trussMat);
  pillarL.position.set(-8, 4, 0);
  const pillarR = new THREE.Mesh(pillarGeo, trussMat);
  pillarR.position.set(8, 4, 0);

  const crossbarGeo = new THREE.BoxGeometry(17.5, 1.2, 1.2);
  const crossbar = new THREE.Mesh(crossbarGeo, trussMat);
  crossbar.position.set(0, 7.6, 0);

  // Festival Logo Signboard
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

  const signGeo = new THREE.BoxGeometry(14, 2.2, 0.3);
  const signMat = new THREE.MeshStandardMaterial({
    map: signTex,
    emissive: 0xff0044,
    emissiveIntensity: 0.4,
  });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(0, 8.8, 0);

  festivalGroup.add(pillarL, pillarR, crossbar, sign);

  // Festival DJ Stage with neon spotlights
  const stageGeo = new THREE.BoxGeometry(16, 1.2, 10);
  const stageMat = new THREE.MeshStandardMaterial({ color: 0x1a1e29, metalness: 0.6, roughness: 0.4 });
  const stage = new THREE.Mesh(stageGeo, stageMat);
  stage.position.set(22, 0.6, 18);
  festivalGroup.add(stage);

  // Spotlights around festival hub
  const festivalLights: THREE.PointLight[] = [];
  const lightColors = [0xff0066, 0x00f0ff, 0xffd000, 0xaa00ff];
  for (let i = 0; i < 4; i++) {
    const pl = new THREE.PointLight(lightColors[i], 1.8, 40);
    pl.position.set(16 + (i % 2) * 12, 7, 12 + Math.floor(i / 2) * 12);
    festivalGroup.add(pl);
    festivalLights.push(pl);
  }

  scene.add(festivalGroup);

  // 10. Checkpoint Gates System
  const checkpointMeshGroup = new THREE.Group();
  scene.add(checkpointMeshGroup);

  // 11. Speed Trap Flash Overlay Mesh (Camera screen flash effect)
  const flashGeo = new THREE.PlaneGeometry(2, 2);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthTest: false,
  });
  const speedTrapFlashMesh = new THREE.Mesh(flashGeo, flashMat);
  speedTrapFlashMesh.renderOrder = 999;

  // Speed Trap physical radar towers on roads
  for (const st of GAME_SPEED_TRAPS) {
    const towerGroup = new THREE.Group();
    towerGroup.position.set(st.x, getTerrainHeight(st.x, st.z), st.z);

    const poleGeo = new THREE.CylinderGeometry(0.18, 0.22, 5.5, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x333b4d, metalness: 0.8 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 2.75;

    const cameraGeo = new THREE.BoxGeometry(0.8, 0.6, 0.8);
    const cameraMat = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.5 });
    const camBox = new THREE.Mesh(cameraGeo, cameraMat);
    camBox.position.set(0, 5.2, 0);

    const lensGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.2, 12);
    lensGeo.rotateX(Math.PI / 2);
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 1.0 });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0, 5.2, 0.45);

    towerGroup.add(pole, camBox, lens);
    scene.add(towerGroup);
  }

  // 12. Horizon XP Boards (Collectible 3D signs)
  const xpBoardMeshes = new Map<string, THREE.Group>();
  for (const board of GAME_XP_BOARDS) {
    const bGroup = new THREE.Group();
    bGroup.position.set(board.x, getTerrainHeight(board.x, board.z), board.z);

    const boardMat = new THREE.MeshStandardMaterial({
      color: 0x9d4edd,
      emissive: 0x7b2cbf,
      emissiveIntensity: 0.8,
      metalness: 0.3,
      roughness: 0.2,
    });
    const panelGeo = new THREE.BoxGeometry(2.4, 1.4, 0.18);
    const panel = new THREE.Mesh(panelGeo, boardMat);
    panel.position.y = 1.6;

    const legsGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6);
    const legL = new THREE.Mesh(legsGeo, trussMat);
    legL.position.set(-0.9, 0.8, 0);
    const legR = new THREE.Mesh(legsGeo, trussMat);
    legR.position.set(0.9, 0.8, 0);

    bGroup.add(panel, legL, legR);
    scene.add(bGroup);
    xpBoardMeshes.set(board.id, bGroup);
  }

  // 13. Dynamic animation updater (spotlight pulses, festival beacon)
  const updateWorldTime = (time: number) => {
    // Pulse festival stage lights
    for (let i = 0; i < festivalLights.length; i++) {
      festivalLights[i].intensity = 1.4 + Math.sin(time * 3 + i * 1.5) * 0.9;
    }
    // Rotate XP boards gently for discoverability
    xpBoardMeshes.forEach((mesh) => {
      mesh.rotation.y = Math.sin(time * 1.2) * 0.15;
    });
  };

  const cleanup = () => {
    terrainGeo.dispose();
    terrainMat.dispose();
    treeInstGeo.dispose();
    treeInstMat.dispose();
    rockGeo.dispose();
    rockMat.dispose();
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
    emissiveIntensity: 1.4,
    roughness: 0.1,
  });

  // Glowing checkpoint ring/gate
  const ringGeo = new THREE.TorusGeometry(6.5, 0.35, 8, 24);
  const ring = new THREE.Mesh(ringGeo, archMat);
  ring.position.y = 5.5;
  archGroup.add(ring);

  // Chevron floating arrow
  const arrowGeo = new THREE.ConeGeometry(1.2, 2.0, 3);
  arrowGeo.rotateZ(Math.PI);
  const arrow = new THREE.Mesh(arrowGeo, archMat);
  arrow.position.y = 11.5;
  archGroup.add(arrow);

  return archGroup;
}
