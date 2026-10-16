/**
 * HORIZON: OPEN ROADS - Persistence & Local Storage Service
 */

import { PlayerProfile, GameSettings } from '../types/game';

const PROFILE_KEY = 'horizon_open_roads_profile_v1';
const SETTINGS_KEY = 'horizon_open_roads_settings_v1';

export const DEFAULT_VEHICLES = ['apex_gt', 'veloce_hyperion', 'terra_raider'];

export const DEFAULT_PROFILE: PlayerProfile = {
  credits: 25000,
  xp: 0,
  level: 1,
  unlockedVehicles: ['apex_gt', 'veloce_hyperion', 'terra_raider'], // All 3 available from start for maximum player enjoyment!
  selectedVehicleId: 'apex_gt',
  vehiclePaints: {
    apex_gt: '#e63946',          // Crimson Sunset
    veloce_hyperion: '#ffd166',  // Horizon Gold
    terra_raider: '#2a9d8f',     // Emerald Forest
  },
  bestRaceTimes: {},
  bestDriftScores: {},
  speedTrapRecords: {},
  collectedBoards: [],
};

export const DEFAULT_SETTINGS: GameSettings = {
  graphicsQuality: 'medium',
  controlType: 'buttons',
  cameraDistance: 'medium',
  steeringSensitivity: 1.0,
  soundVolume: 0.8,
  musicVolume: 0.6,
  showFps: false,
  manualTransmission: false,
};

export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      unlockedVehicles: Array.isArray(parsed.unlockedVehicles) && parsed.unlockedVehicles.length > 0
        ? parsed.unlockedVehicles
        : DEFAULT_PROFILE.unlockedVehicles,
      vehiclePaints: { ...DEFAULT_PROFILE.vehiclePaints, ...parsed.vehiclePaints },
    };
  } catch (e) {
    console.warn('Failed to parse player profile, using defaults:', e);
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Failed to persist profile:', e);
  }
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    console.warn('Failed to parse settings, using defaults:', e);
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to persist settings:', e);
  }
}

export function resetSaveData(): { profile: PlayerProfile; settings: GameSettings } {
  try {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(SETTINGS_KEY);
  } catch (e) {
    console.warn('Failed to clear storage:', e);
  }
  return {
    profile: { ...DEFAULT_PROFILE },
    settings: { ...DEFAULT_SETTINGS },
  };
}
