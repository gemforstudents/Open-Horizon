/**
 * HORIZON: OPEN ROADS
 * Main Game Application Entry Point
 * Orchestrates Three.js rendering, physics simulation, AI opponents,
 * sound synthesis, game state transitions, and responsive touch HUD.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  GameScreen,
  PlayerProfile,
  GameSettings,
  PlayerInput,
  RaceConfig,
  VehiclePhysicsState,
} from './types/game';
import {
  loadProfile,
  saveProfile,
  loadSettings,
  saveSettings,
  resetSaveData,
} from './services/storage';
import { audio } from './services/audio';
import {
  VEHICLE_CONFIGS,
  buildVehicleModel,
  updateCarPaint,
  CarMeshes,
} from './game/vehicles/vehicleModels';
import { buildWorld, renderCheckpointArch, WorldBuildResult } from './game/world/worldScene';
import { VehiclePhysics } from './game/physics/vehiclePhysics';
import { ChaseCamera } from './game/camera/chaseCamera';
import { AIController } from './game/ai/aiController';
import { ParticleSystem } from './game/particles/particleSystem';
import {
  GAME_RACES,
  GAME_SPEED_TRAPS,
  GAME_XP_BOARDS,
  getTerrainHeight,
} from './game/world/roadNetwork';

import { TitleScreen } from './components/TitleScreen';
import { DrivingHUD } from './components/DrivingHUD';
import { TouchControls } from './components/TouchControls';
import { GarageScreen } from './components/GarageScreen';
import { EventSelectModal } from './components/EventSelectModal';
import { PauseModal } from './components/PauseModal';
import { RaceResultsModal } from './components/RaceResultsModal';
import { SettingsModal } from './components/SettingsModal';
import { HelpModal } from './components/HelpModal';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);

  // Persistence State
  const [profile, setProfile] = useState<PlayerProfile>(loadProfile);
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [screen, setScreen] = useState<GameScreen>('title');
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Modals State
  const [showEventSelect, setShowEventSelect] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showRaceResults, setShowRaceResults] = useState(false);
  const [webGlError, setWebGlError] = useState<string | null>(null);

  // Active Race & Event State
  const [activeRace, setActiveRace] = useState<RaceConfig | null>(null);
  const [raceCountdown, setRaceCountdown] = useState<number | null>(null);
  const [racePosition, setRacePosition] = useState<number>(1);
  const [currentCheckpointIdx, setCurrentCheckpointIdx] = useState<number>(0);
  const [raceTimer, setRaceTimer] = useState<number>(0);
  const [raceResultData, setRaceResultData] = useState<{
    position: number;
    time: number;
    isNewRecord: boolean;
  } | null>(null);

  // HUD Realtime Notifications
  const [speedTrapNotif, setSpeedTrapNotif] = useState<{ speed: number; name: string } | null>(null);
  const [xpNotif, setXpNotif] = useState<string | null>(null);
  const [measuredFps, setMeasuredFps] = useState<number>(60);

  // React state for HUD telemetry (throttled at 15Hz to avoid per-frame re-renders)
  const [hudTelemetry, setHudTelemetry] = useState<VehiclePhysicsState>({
    x: 0,
    y: 3.5,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    heading: 0,
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
  });

  // Game Engine Mutable References (avoiding React re-renders)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const worldRef = useRef<WorldBuildResult | null>(null);
  const playerCarMeshesRef = useRef<CarMeshes | null>(null);
  const physicsRef = useRef<VehiclePhysics | null>(null);
  const cameraRef = useRef<ChaseCamera | null>(null);
  const aiRef = useRef<AIController | null>(null);
  const particlesRef = useRef<ParticleSystem | null>(null);

  // Input & Timers
  const inputRef = useRef<PlayerInput>({
    throttle: 0,
    brake: 0,
    steering: 0,
    handbrake: false,
    reverse: false,
  });

  const screenRef = useRef<GameScreen>(screen);
  screenRef.current = screen;

  const isPausedRef = useRef<boolean>(isPaused);
  isPausedRef.current = isPaused;

  const activeRaceRef = useRef<RaceConfig | null>(activeRace);
  activeRaceRef.current = activeRace;

  const currentCpIdxRef = useRef<number>(0);
  const raceTimerRef = useRef<number>(0);
  const raceStartedRef = useRef<boolean>(false);

  // Turntable interaction for Garage mode
  const isPointerDownRef = useRef<boolean>(false);
  const lastPointerXRef = useRef<number>(0);
  const turntableAngleRef = useRef<number>(0);

  // Apply settings to renderer and camera
  const applySettingsToEngine = useCallback(
    (newSettings: GameSettings) => {
      setSettings(newSettings);
      saveSettings(newSettings);
      audio.setVolumes(newSettings.soundVolume, newSettings.musicVolume);

      if (cameraRef.current) {
        cameraRef.current.setMode(newSettings.cameraDistance);
      }

      if (rendererRef.current) {
        let pixelRatio = 1.0;
        if (newSettings.graphicsQuality === 'medium') pixelRatio = Math.min(window.devicePixelRatio, 1.3);
        if (newSettings.graphicsQuality === 'high') pixelRatio = Math.min(window.devicePixelRatio, 1.6);
        rendererRef.current.setPixelRatio(pixelRatio);
        rendererRef.current.shadowMap.enabled = newSettings.graphicsQuality !== 'low';
      }
    },
    []
  );

  // Vehicle Switcher Helper
  const spawnVehicle = useCallback(
    (vehicleId: string, customColor?: string) => {
      if (!worldRef.current) return;
      const scene = worldRef.current.scene;

      // Remove existing player car meshes
      if (playerCarMeshesRef.current) {
        scene.remove(playerCarMeshesRef.current.root);
      }

      const cfg = VEHICLE_CONFIGS[vehicleId] || VEHICLE_CONFIGS['apex_gt'];
      const paintHex = customColor || profile.vehiclePaints[vehicleId] || cfg.color;

      const meshes = buildVehicleModel(vehicleId, paintHex);
      scene.add(meshes.root);
      playerCarMeshesRef.current = meshes;

      if (!physicsRef.current) {
        physicsRef.current = new VehiclePhysics(cfg, 0, 0, 0);
      } else {
        physicsRef.current.setConfig(cfg);
      }
    },
    [profile.vehiclePaints]
  );

  // Setup Three.js Scene and Game Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: settings.graphicsQuality !== 'low',
        powerPreference: 'high-performance',
      });
    } catch (e) {
      setWebGlError('WebGL 2 is not supported or was blocked by your browser/device settings.');
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = settings.graphicsQuality !== 'low';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    let pr = 1.0;
    if (settings.graphicsQuality === 'medium') pr = Math.min(window.devicePixelRatio, 1.3);
    if (settings.graphicsQuality === 'high') pr = Math.min(window.devicePixelRatio, 1.6);
    renderer.setPixelRatio(pr);

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Build World (Terrain, Roads, Trees, Rocks, Lighting, Festival Hub)
    const world = buildWorld(renderer);
    worldRef.current = world;

    // Initialize Chase Camera
    const cameraSystem = new ChaseCamera(64, container.clientWidth / container.clientHeight);
    cameraSystem.setMode(settings.cameraDistance);
    cameraRef.current = cameraSystem;

    // Initialize Particle System
    const particleSystem = new ParticleSystem(world.scene);
    particlesRef.current = particleSystem;

    // Initialize AI Opponents Controller
    const ai = new AIController(world.scene);
    aiRef.current = ai;

    // Spawn Initial Vehicle
    spawnVehicle(profile.selectedVehicleId);

    // Warm-up shaders to avoid mid-race stutter
    renderer.compile(world.scene, cameraSystem.camera);

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      cameraRef.current.camera.aspect = width / height;
      cameraRef.current.camera.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Pointer events for Turntable rotation in Garage & Title
    const onPointerDown = (e: PointerEvent) => {
      if (screenRef.current === 'garage' || screenRef.current === 'title') {
        isPointerDownRef.current = true;
        lastPointerXRef.current = e.clientX;
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (isPointerDownRef.current && (screenRef.current === 'garage' || screenRef.current === 'title')) {
        const deltaX = e.clientX - lastPointerXRef.current;
        lastPointerXRef.current = e.clientX;
        turntableAngleRef.current += deltaX * 0.01;
      }
    };
    const onPointerUp = () => {
      isPointerDownRef.current = false;
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Main Game Animation Loop
    let animId: number;
    let lastTime = performance.now();
    let hudThrottleTimer = 0;
    let fpsFrames = 0;
    let fpsTimer = 0;

    const clock = new THREE.Clock();

    const gameLoop = () => {
      animId = requestAnimationFrame(gameLoop);

      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      // FPS tracking
      fpsFrames++;
      fpsTimer += dt;
      if (fpsTimer >= 0.5) {
        setMeasuredFps(Math.round(fpsFrames / fpsTimer));
        fpsFrames = 0;
        fpsTimer = 0;
      }

      const currentScreen = screenRef.current;
      const paused = isPausedRef.current;

      const physics = physicsRef.current;
      const carMeshes = playerCarMeshesRef.current;
      const chaseCam = cameraRef.current;
      const currentWorld = worldRef.current;

      if (!physics || !carMeshes || !chaseCam || !currentWorld) return;

      // Update animated spotlights and festival beacon
      currentWorld.updateWorldTime(clock.getElapsedTime());

      if (currentScreen === 'title') {
        // Slow cinematic orbit around vehicle at Festival Hub
        turntableAngleRef.current += dt * 0.2;
        const orbitRadius = 11;
        const camX = Math.sin(turntableAngleRef.current) * orbitRadius;
        const camZ = Math.cos(turntableAngleRef.current) * orbitRadius;
        const camY = getTerrainHeight(camX, camZ) + 3.8;

        chaseCam.camera.position.set(camX, camY, camZ);
        chaseCam.camera.lookAt(0, 1.2, 0);

        carMeshes.root.position.set(0, getTerrainHeight(0, 0) + 0.35, 0);
        carMeshes.root.rotation.set(0, 0.4, 0);
      } else if (currentScreen === 'garage') {
        // Turntable vehicle inspection
        carMeshes.root.position.set(0, getTerrainHeight(0, 0) + 0.35, 0);
        carMeshes.root.rotation.set(0, turntableAngleRef.current, 0);

        // Position camera nicely framed on the vehicle
        chaseCam.camera.position.set(0, 2.2, 6.2);
        chaseCam.camera.lookAt(0, 0.9, 0);
      } else if ((currentScreen === 'freeroam' || currentScreen === 'race') && !paused) {
        // Active Driving Simulation Step
        const simResult = physics.update(dt, inputRef.current, settings.steeringSensitivity);

        // Audio updates
        audio.updateEngine(physics.state.rpm, inputRef.current.throttle, physics.config.engineSoundFreq);
        audio.updateTireSqueal(physics.state.isDrifting, physics.state.driftAngle);

        if (simResult.collisionIntensity > 0.2) {
          audio.playCollision(simResult.collisionIntensity);
          chaseCam.triggerShake(simResult.collisionIntensity * 1.5);
        }

        // Particle emissions: tire smoke when drifting or burnout
        if (physics.state.isDrifting && physics.state.speedKmh > 20) {
          particlesRef.current?.emit(
            physics.state.x - Math.sin(physics.state.heading) * 1.5,
            physics.state.y,
            physics.state.z - Math.cos(physics.state.heading) * 1.5,
            physics.state.surfaceType === 'asphalt' ? 'smoke' : 'dirt',
            3
          );
        }
        particlesRef.current?.update(dt);

        // Update player 3D car position & orientation
        carMeshes.root.position.set(physics.state.x, physics.state.y, physics.state.z);
        carMeshes.root.rotation.set(0, physics.state.heading, 0);

        // Suspension pitch (squat/dive) and roll (cornering lean)
        carMeshes.chassis.rotation.set(physics.state.pitch, 0, physics.state.roll);

        // Front wheels steering angle
        carMeshes.frontLeftWheel.rotation.y = physics.state.steeringAngle;
        carMeshes.frontRightWheel.rotation.y = Math.PI + physics.state.steeringAngle;

        // All wheels spin rotation
        carMeshes.frontLeftWheel.rotation.x = physics.state.wheelRotation;
        carMeshes.frontRightWheel.rotation.x = -physics.state.wheelRotation;
        carMeshes.rearLeftWheel.rotation.x = physics.state.wheelRotation;
        carMeshes.rearRightWheel.rotation.x = -physics.state.wheelRotation;

        // Brake lights illumination
        const isBraking = inputRef.current.brake > 0 || inputRef.current.handbrake;
        for (const bl of carMeshes.brakeLights) {
          if (bl.material && (bl.material as THREE.MeshStandardMaterial).emissiveIntensity !== undefined) {
            (bl.material as THREE.MeshStandardMaterial).emissiveIntensity = isBraking ? 2.5 : 0.8;
          }
        }

        // Chase Camera Update
        chaseCam.update(physics.state, dt);

        // --- Speed Trap Detections in Open-World ---
        for (const st of GAME_SPEED_TRAPS) {
          const distToSt = Math.hypot(physics.state.x - st.x, physics.state.z - st.z);
          if (distToSt < 12 && physics.state.speedKmh > 75) {
            audio.playSpeedTrap();
            chaseCam.triggerShake(0.8);
            setSpeedTrapNotif({ speed: Math.round(physics.state.speedKmh), name: st.name });

            // Reward Credits & save record
            setProfile((prev) => {
              const currentRecord = prev.speedTrapRecords[st.id] || 0;
              const newRecord = Math.max(currentRecord, Math.round(physics.state.speedKmh));
              const updated = {
                ...prev,
                credits: prev.credits + 500,
                speedTrapRecords: { ...prev.speedTrapRecords, [st.id]: newRecord },
              };
              saveProfile(updated);
              return updated;
            });

            setTimeout(() => setSpeedTrapNotif(null), 3000);
          }
        }

        // --- Horizon XP Board Collisions ---
        for (const board of GAME_XP_BOARDS) {
          if (profile.collectedBoards.includes(board.id)) continue;
          const distToBoard = Math.hypot(physics.state.x - board.x, physics.state.z - board.z);
          if (distToBoard < 4.0) {
            audio.playXpBoard();
            chaseCam.triggerShake(1.2);
            particlesRef.current?.emit(board.x, board.y + 1, board.z, 'spark', 15);

            // Hide the 3D board mesh
            const bMesh = currentWorld.xpBoardMeshes.get(board.id);
            if (bMesh) bMesh.visible = false;

            setXpNotif(`+${board.xpValue.toLocaleString()} XP`);
            setTimeout(() => setXpNotif(null), 3000);

            // Save to profile
            setProfile((prev) => {
              const newXp = prev.xp + board.xpValue;
              const newLevel = 1 + Math.floor(newXp / 5000);
              const updated = {
                ...prev,
                xp: newXp,
                level: newLevel,
                collectedBoards: [...prev.collectedBoards, board.id],
              };
              saveProfile(updated);
              return updated;
            });
          }
        }

        // --- Active Race Manager ---
        if (currentScreen === 'race' && activeRaceRef.current && raceStartedRef.current) {
          raceTimerRef.current += dt;
          setRaceTimer(raceTimerRef.current);

          const race = activeRaceRef.current;
          const cpIdx = currentCpIdxRef.current;
          const targetCp = race.checkpoints[cpIdx];

          if (targetCp) {
            const distToCp = Math.hypot(physics.state.x - targetCp.x, physics.state.z - targetCp.z);
            if (distToCp < targetCp.radius) {
              audio.playCheckpoint();
              if (cpIdx < race.checkpoints.length - 1) {
                currentCpIdxRef.current = cpIdx + 1;
                setCurrentCheckpointIdx(cpIdx + 1);
                updateCheckpointVisuals(race, cpIdx + 1);
              } else {
                // Finish Line Passed!
                finishRace(race, raceTimerRef.current);
              }
            }
          }

          // AI Opponents Simulation
          if (aiRef.current) {
            aiRef.current.update(dt, race.checkpoints, raceStartedRef.current);

            // Calculate player placement relative to AI opponents
            let playerRank = 1;
            const playerProgress = cpIdx + (1.0 - Math.min((targetCp ? Math.hypot(physics.state.x - targetCp.x, physics.state.z - targetCp.z) : 0) / 100, 1.0));
            for (const aiRacer of aiRef.current.racers) {
              if (aiRacer.progressLapRatio > playerProgress) {
                playerRank++;
              }
            }
            setRacePosition(playerRank);
          }
        }

        // Throttle React state telemetry updates to 15 Hz for peak performance
        hudThrottleTimer += dt;
        if (hudThrottleTimer >= 0.065) {
          hudThrottleTimer = 0;
          setHudTelemetry({ ...physics.state });
        }
      }

      // Render Three.js Scene
      renderer.render(world.scene, chaseCam.camera);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      world.cleanup();
      particlesRef.current?.cleanup();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [applySettingsToEngine, spawnVehicle, profile.selectedVehicleId, settings.graphicsQuality, settings.cameraDistance, profile.collectedBoards]);

  // Update 3D Checkpoint gate rings in the world
  const updateCheckpointVisuals = (race: RaceConfig, currentIdx: number) => {
    if (!worldRef.current) return;
    const group = worldRef.current.checkpointMeshGroup;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    // Render active target checkpoint and next checkpoint
    const cp = race.checkpoints[currentIdx];
    if (cp) {
      const isFinish = currentIdx === race.checkpoints.length - 1;
      const arch = renderCheckpointArch(cp.x, cp.y, cp.z, isFinish);
      group.add(arch);
    }
  };

  // Start Free Roam
  const handleStartFreeRoam = () => {
    audio.init();
    audio.resume();
    audio.playClick();

    if (physicsRef.current) {
      physicsRef.current.state.x = 0;
      physicsRef.current.state.z = 10;
      physicsRef.current.state.y = getTerrainHeight(0, 10) + 0.4;
      physicsRef.current.state.heading = 0;
      physicsRef.current.state.vx = 0;
      physicsRef.current.state.vz = 0;
      physicsRef.current.state.speedKmh = 0;
    }

    if (worldRef.current) {
      while (worldRef.current.checkpointMeshGroup.children.length > 0) {
        worldRef.current.checkpointMeshGroup.remove(worldRef.current.checkpointMeshGroup.children[0]);
      }
    }

    setActiveRace(null);
    activeRaceRef.current = null;
    aiRef.current?.clearRacers();
    setScreen('freeroam');
    setIsPaused(false);
  };

  // Start Race Event with Countdown
  const handleStartRace = (race: RaceConfig) => {
    audio.init();
    audio.resume();
    audio.playClick();
    setShowEventSelect(false);
    setShowRaceResults(false);

    setActiveRace(race);
    activeRaceRef.current = race;
    currentCpIdxRef.current = 0;
    setCurrentCheckpointIdx(0);
    raceTimerRef.current = 0;
    setRaceTimer(0);
    setRacePosition(1);

    const startCp = race.checkpoints[0];
    const nextCp = race.checkpoints[1];
    const heading = Math.atan2(nextCp.x - startCp.x, nextCp.z - startCp.z);

    if (physicsRef.current) {
      physicsRef.current.state.x = startCp.x;
      physicsRef.current.state.z = startCp.z;
      physicsRef.current.state.y = getTerrainHeight(startCp.x, startCp.z) + 0.35;
      physicsRef.current.state.heading = heading;
      physicsRef.current.state.vx = 0;
      physicsRef.current.state.vz = 0;
      physicsRef.current.state.speedKmh = 0;
    }

    // Spawn AI racers
    if (aiRef.current) {
      aiRef.current.setupRacers(race.checkpoints, race.aiCount);
    }

    // Display first checkpoint arch
    updateCheckpointVisuals(race, 0);

    setScreen('race');
    setIsPaused(false);
    raceStartedRef.current = false;

    // Countdown: 3, 2, 1, GO!
    setRaceCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setRaceCountdown(count);
        audio.playClick();
      } else if (count === 0) {
        setRaceCountdown(0); // GO!
        audio.playCheckpoint();
        raceStartedRef.current = true;
      } else {
        clearInterval(interval);
        setRaceCountdown(null);
      }
    }, 900);
  };

  // Finish Race and show results
  const finishRace = (race: RaceConfig, finalTime: number) => {
    raceStartedRef.current = false;
    audio.playCheckpoint();

    const finalPos = racePosition;
    const prevBest = profile.bestRaceTimes[race.id];
    const isNewRecord = !prevBest || finalTime < prevBest;

    // Rewards
    const multiplier = finalPos === 1 ? 1.0 : finalPos === 2 ? 0.75 : finalPos === 3 ? 0.5 : 0.3;
    const earnedCredits = Math.round(race.rewards.credits * multiplier);
    const earnedXp = Math.round(race.rewards.xp * multiplier);

    setProfile((prev) => {
      const newXp = prev.xp + earnedXp;
      const updated: PlayerProfile = {
        ...prev,
        credits: prev.credits + earnedCredits,
        xp: newXp,
        level: 1 + Math.floor(newXp / 5000),
        bestRaceTimes: {
          ...prev.bestRaceTimes,
          [race.id]: isNewRecord ? finalTime : prevBest,
        },
      };
      saveProfile(updated);
      return updated;
    });

    setRaceResultData({
      position: finalPos,
      time: finalTime,
      isNewRecord,
    });
    setShowRaceResults(true);
  };

  // Touch & Keyboard input updates
  const handleInputChange = (input: PlayerInput) => {
    inputRef.current = input;
  };

  // Toggle Camera View Mode
  const handleToggleCamera = () => {
    audio.playClick();
    const modes: ('close' | 'medium' | 'far' | 'hood')[] = ['close', 'medium', 'far', 'hood'];
    const curIdx = modes.indexOf(settings.cameraDistance);
    const nextMode = modes[(curIdx + 1) % modes.length];
    const updatedSettings = { ...settings, cameraDistance: nextMode };
    applySettingsToEngine(updatedSettings);
  };

  // Emergency Car Reset
  const handleResetCar = () => {
    audio.playClick();
    physicsRef.current?.resetToRoad();
  };

  // Vehicle Selection in Garage
  const handleSelectVehicle = (vehicleId: string) => {
    audio.playClick();
    setProfile((prev) => {
      const updated = { ...prev, selectedVehicleId: vehicleId };
      saveProfile(updated);
      return updated;
    });
    spawnVehicle(vehicleId);
  };

  // Paint Color Selection
  const handleChangeColor = (colorHex: string) => {
    audio.playClick();
    setProfile((prev) => {
      const updated = {
        ...prev,
        vehiclePaints: { ...prev.vehiclePaints, [profile.selectedVehicleId]: colorHex },
      };
      saveProfile(updated);
      return updated;
    });
    if (playerCarMeshesRef.current) {
      updateCarPaint(playerCarMeshesRef.current, colorHex);
    }
  };

  // Audio Mute Toggle
  const handleToggleMute = () => {
    audio.init();
    audio.resume();
    const muted = audio.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {/* WebGL 3D Canvas Mount Point */}
      <div ref={mountRef} className="absolute inset-0 z-0 overflow-hidden touch-none" />

      {/* WebGL Error State Fallback */}
      {webGlError && (
        <div className="absolute inset-0 bg-slate-950 flex items-center justify-center p-6 text-white text-center z-50">
          <div className="max-w-md bg-slate-900 border border-white/20 p-8 rounded-3xl shadow-2xl">
            <div className="text-rose-500 text-3xl font-black mb-3">GRAPHICS UNAVAILABLE</div>
            <p className="text-slate-300 text-sm mb-6">{webGlError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-2xl bg-rose-600 font-bold uppercase tracking-wider text-sm hover:bg-rose-700"
            >
              RELOAD PAGE
            </button>
          </div>
        </div>
      )}

      {/* Race Countdown Overlay (3, 2, 1, GO!) */}
      {raceCountdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 select-none">
          <div
            className={`font-black tracking-tighter drop-shadow-[0_8px_32px_rgba(0,0,0,0.9)] ${
              raceCountdown === 0
                ? 'text-8xl md:text-9xl text-emerald-400 animate-ping'
                : 'text-9xl md:text-[12rem] text-amber-400 animate-scaleIn'
            }`}
          >
            {raceCountdown === 0 ? 'GO!' : raceCountdown}
          </div>
        </div>
      )}

      {/* Title Screen Overlay */}
      {screen === 'title' && (
        <TitleScreen
          profile={profile}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onStartFreeRoam={handleStartFreeRoam}
          onOpenEvents={() => {
            audio.init();
            audio.playClick();
            setShowEventSelect(true);
          }}
          onOpenGarage={() => {
            audio.init();
            audio.playClick();
            setScreen('garage');
          }}
          onOpenSettings={() => {
            audio.init();
            audio.playClick();
            setShowSettingsModal(true);
          }}
          onOpenHelp={() => {
            audio.init();
            audio.playClick();
            setShowHelpModal(true);
          }}
        />
      )}

      {/* Garage Screen Overlay */}
      {screen === 'garage' && (
        <GarageScreen
          profile={profile}
          selectedVehicleId={profile.selectedVehicleId}
          onSelectVehicle={handleSelectVehicle}
          onChangeColor={handleChangeColor}
          onBackToTitle={() => {
            audio.playClick();
            setScreen('title');
          }}
          onStartDrive={handleStartFreeRoam}
        />
      )}

      {/* Active Driving HUD & Controls (Free Roam or Race) */}
      {(screen === 'freeroam' || screen === 'race') && (
        <>
          <DrivingHUD
            physics={hudTelemetry}
            activeRace={activeRace}
            raceTimer={raceTimer}
            currentCheckpointIdx={currentCheckpointIdx}
            racePosition={racePosition}
            totalRacers={(activeRace?.aiCount || 0) + 1}
            speedTrapNotification={speedTrapNotif}
            xpNotification={xpNotif}
            fps={measuredFps}
            showFps={settings.showFps}
          />

          {!isPaused && (
            <TouchControls
              controlType={settings.controlType}
              onInputChange={handleInputChange}
              onResetCar={handleResetCar}
              onToggleCamera={handleToggleCamera}
              onPause={() => {
                audio.playClick();
                setIsPaused(true);
              }}
            />
          )}
        </>
      )}

      {/* Modals */}
      {showEventSelect && (
        <EventSelectModal
          profile={profile}
          onSelectRace={handleStartRace}
          onStartFreeRoam={() => {
            setShowEventSelect(false);
            handleStartFreeRoam();
          }}
          onClose={() => {
            audio.playClick();
            setShowEventSelect(false);
          }}
        />
      )}

      {isPaused && (
        <PauseModal
          onResume={() => {
            audio.playClick();
            setIsPaused(false);
          }}
          onRestart={() => {
            audio.playClick();
            if (activeRace) {
              handleStartRace(activeRace);
            } else {
              handleStartFreeRoam();
            }
          }}
          onOpenSettings={() => {
            audio.playClick();
            setShowSettingsModal(true);
          }}
          onReturnToGarage={() => {
            audio.playClick();
            setIsPaused(false);
            setScreen('garage');
          }}
          onReturnToTitle={() => {
            audio.playClick();
            setIsPaused(false);
            setScreen('title');
          }}
        />
      )}

      {showRaceResults && activeRace && raceResultData && (
        <RaceResultsModal
          race={activeRace}
          position={raceResultData.position}
          timeSeconds={raceResultData.time}
          isNewRecord={raceResultData.isNewRecord}
          onRestart={() => {
            audio.playClick();
            handleStartRace(activeRace);
          }}
          onOpenEvents={() => {
            audio.playClick();
            setShowRaceResults(false);
            setShowEventSelect(true);
          }}
          onContinueFreeRoam={() => {
            audio.playClick();
            setShowRaceResults(false);
            handleStartFreeRoam();
          }}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={applySettingsToEngine}
          onResetSave={() => {
            audio.playClick();
            const reset = resetSaveData();
            setProfile(reset.profile);
            setSettings(reset.settings);
            applySettingsToEngine(reset.settings);
            spawnVehicle(reset.profile.selectedVehicleId);
          }}
          onClose={() => {
            audio.playClick();
            setShowSettingsModal(false);
          }}
        />
      )}

      {showHelpModal && (
        <HelpModal
          onClose={() => {
            audio.playClick();
            setShowHelpModal(false);
          }}
        />
      )}
    </div>
  );
}
