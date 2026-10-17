/**
 * HORIZON: OPEN ROADS - Driving HUD
 * Low-occlusion perimeter clusters, digital tachometer, speedometer, gear indicator,
 * drift multiplier combo banner, speed trap notification, race position, and mini-map.
 */

import React from 'react';
import { VehiclePhysicsState, RaceConfig } from '../types/game';
import { Trophy, Timer, Flame, Zap, Award } from 'lucide-react';

interface DrivingHUDProps {
  physics: VehiclePhysicsState;
  activeRace: RaceConfig | null;
  raceTimer: number;
  currentCheckpointIdx: number;
  racePosition: number;
  totalRacers: number;
  speedTrapNotification: { speed: number; name: string } | null;
  xpNotification: string | null;
  fps: number;
  showFps: boolean;
  isPortrait?: boolean;
}

export const DrivingHUD: React.FC<DrivingHUDProps> = ({
  physics,
  activeRace,
  raceTimer,
  currentCheckpointIdx,
  racePosition,
  totalRacers,
  speedTrapNotification,
  xpNotification,
  fps,
  showFps,
  isPortrait = false,
}) => {
  // Format race time MM:SS.cc
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds * 100) % 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const speedKmh = Math.round(physics.speedKmh);
  const rpm = Math.round(physics.rpm);
  const rpmPercent = Math.min(Math.max((rpm - 850) / 7650, 0), 1);
  const isRedline = rpmPercent > 0.88;

  // Mini-map coordinates translation (-700..700 -> 0..120)
  const mapSize = 110;
  const mapScale = mapSize / 1000;
  const playerMapX = mapSize / 2 + physics.x * mapScale;
  const playerMapZ = mapSize / 2 + physics.z * mapScale;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-10 text-white font-sans">
      {/* High-Speed Adrenaline Velocity Vignette & Dynamic Wind Streaks (>135 km/h) */}
      {speedKmh > 135 && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-200 overflow-hidden"
          style={{
            opacity: Math.min((speedKmh - 135) / 120, 0.75),
            background:
              'radial-gradient(circle at center, transparent 45%, rgba(56, 189, 248, 0.08) 75%, rgba(2, 6, 23, 0.6) 100%)',
          }}
        >
          {/* Radial speed motion lines along the viewport edge */}
          <svg className="w-full h-full opacity-60 mix-blend-screen" viewBox="0 0 1000 600" preserveAspectRatio="none">
            <line x1="0" y1="40" x2="220" y2="100" stroke="#7dd3fc" strokeWidth="2" strokeDasharray="40 25" />
            <line x1="0" y1="180" x2="260" y2="210" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="60 30" />
            <line x1="0" y1="460" x2="240" y2="390" stroke="#7dd3fc" strokeWidth="2" strokeDasharray="50 30" />
            <line x1="1000" y1="50" x2="780" y2="110" stroke="#7dd3fc" strokeWidth="2" strokeDasharray="40 25" />
            <line x1="1000" y1="220" x2="740" y2="230" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="70 35" />
            <line x1="1000" y1="470" x2="760" y2="400" stroke="#7dd3fc" strokeWidth="2" strokeDasharray="50 30" />
          </svg>
        </div>
      )}

      {/* Top Left: FPS Counter (if enabled) & Horizon Branding */}
      <div className="absolute top-4 left-4 flex flex-col space-y-1">
        <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-white/10">
          <span className="text-xs font-black tracking-widest text-rose-500 uppercase">HORIZON</span>
          <span className="text-[11px] text-slate-400 font-semibold uppercase">OPEN ROADS</span>
          {showFps && (
            <span className="text-[11px] text-emerald-400 font-mono ml-2 border-l border-white/10 pl-2">
              {fps} FPS
            </span>
          )}
        </div>
      </div>

      {/* Top Center: Race Info Bar (when racing) */}
      {activeRace && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center space-x-3 bg-slate-950/90 px-5 py-2.5 rounded-2xl border border-white/20 shadow-2xl">
          <div className="flex items-center space-x-1.5 border-r border-white/15 pr-3">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-xl font-black tabular-nums">
              {racePosition}
              <span className="text-xs text-slate-400 font-normal">/{totalRacers}</span>
            </span>
          </div>

          <div className="flex items-center space-x-1.5 border-r border-white/15 pr-3">
            <Timer className="w-4 h-4 text-cyan-400" />
            <span className="text-lg font-mono font-bold tabular-nums text-cyan-300">
              {formatTime(raceTimer)}
            </span>
          </div>

          <div className="text-xs font-semibold text-slate-300">
            CHECKPOINT{' '}
            <span className="text-white font-black">
              {Math.min(currentCheckpointIdx + 1, activeRace.checkpoints.length)}
            </span>{' '}
            / {activeRace.checkpoints.length}
          </div>
        </div>
      )}

      {/* Speed Trap Radar Notification Toast */}
      {speedTrapNotification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col items-center bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-black px-6 py-2.5 rounded-2xl font-black shadow-2xl animate-bounce">
          <div className="flex items-center space-x-2 text-xs uppercase tracking-wider text-black/80">
            <Zap className="w-4 h-4 fill-black" />
            <span>SPEED TRAP TRIGGERED</span>
          </div>
          <div className="text-3xl tracking-tight">
            {speedTrapNotification.speed} <span className="text-lg font-bold">KM/H</span>
          </div>
          <div className="text-[11px] text-black/75 uppercase tracking-wide">
            {speedTrapNotification.name} · +500 CR
          </div>
        </div>
      )}

      {/* Horizon XP Board Notification Toast */}
      {xpNotification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center space-x-3 bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 rounded-2xl font-black shadow-2xl border border-purple-300 animate-pulse">
          <Award className="w-6 h-6 text-amber-300" />
          <div>
            <div className="text-xs uppercase text-purple-200">COLLECTIBLE SMASHED</div>
            <div className="text-xl tracking-tight text-white">{xpNotification}</div>
          </div>
        </div>
      )}

      {/* Center Drift Score Popup */}
      {(physics.isDrifting || physics.driftScore > 0) && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="flex items-center space-x-2 bg-slate-950/85 px-4 py-1.5 rounded-full border border-amber-500/40 shadow-lg">
            <Flame className={`w-5 h-5 ${physics.isDrifting ? 'text-amber-400 animate-spin' : 'text-slate-500'}`} />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300">DRIFT</span>
            <span className="text-xs font-black bg-amber-500 text-black px-2 py-0.5 rounded-full">
              x{physics.driftMultiplier.toFixed(1)}
            </span>
          </div>
          <div className="text-3xl font-black tracking-tight text-white drop-shadow-[0_4px_12px_rgba(255,180,0,0.6)] tabular-nums mt-1">
            {physics.driftScore.toLocaleString()}
          </div>
        </div>
      )}

      {/* Bottom Center: Dashboard Cluster (Speedometer, Tachometer, Gear) */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 flex flex-col items-center transition-all ${
          isPortrait ? 'bottom-22 scale-90 origin-bottom' : 'bottom-6 scale-100'
        }`}
      >
        {/* RPM Bar */}
        <div className="w-48 sm:w-56 h-2 bg-slate-950/90 rounded-full overflow-hidden p-0.5 border border-white/20 mb-1.5 sm:mb-2">
          <div
            className={`h-full rounded-full transition-all duration-75 ${
              isRedline
                ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-red-600 animate-pulse'
                : 'bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400'
            }`}
            style={{ width: `${rpmPercent * 100}%` }}
          />
        </div>

        {/* Speed & Gear Capsule */}
        <div className="flex items-baseline space-x-3 bg-slate-950/85 px-6 py-2 rounded-2xl border border-white/20 shadow-2xl">
          {/* Gear Indicator */}
          <div className="flex flex-col items-center mr-2 border-r border-white/15 pr-3">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">GEAR</span>
            <span className="text-2xl font-black text-amber-400">
              {physics.gear === 0 ? 'R' : physics.gear}
            </span>
          </div>

          {/* Digital Speedometer */}
          <div className="flex items-baseline space-x-1">
            <span className="text-5xl font-black tracking-tighter tabular-nums drop-shadow-md">
              {speedKmh}
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              KM/H
            </span>
          </div>

          {/* Surface Indicator */}
          <div className="ml-3 border-l border-white/15 pl-3 flex flex-col items-end">
            <span className="text-[9px] text-slate-400 font-semibold uppercase">SURFACE</span>
            <span
              className={`text-xs font-bold uppercase ${
                physics.surfaceType === 'asphalt'
                  ? 'text-cyan-400'
                  : physics.surfaceType === 'dirt'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {physics.surfaceType}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Left Mini-Map Radar (Above left touch controls) */}
      <div className="absolute top-16 left-4 bg-slate-950/85 p-2 rounded-2xl border border-white/15 shadow-xl">
        <svg width={mapSize} height={mapSize} className="rounded-xl overflow-hidden bg-slate-900/90">
          {/* Coastal road circuit outline */}
          <circle cx={mapSize / 2} cy={mapSize / 2} r={38} fill="none" stroke="#334155" strokeWidth="6" />
          <path
            d={`M ${mapSize / 2} ${mapSize / 2} C ${mapSize / 2 - 35} ${mapSize / 2 + 25}, ${mapSize / 2 - 40} ${mapSize / 2 + 45}, ${mapSize / 2 - 25} ${mapSize / 2 + 50}`}
            fill="none"
            stroke="#475569"
            strokeWidth="5"
          />
          {/* Mountain climb outline */}
          <path
            d={`M ${mapSize / 2} ${mapSize / 2} C ${mapSize / 2 + 25} ${mapSize / 2 - 20}, ${mapSize / 2 + 45} ${mapSize / 2 - 15}, ${mapSize / 2 + 40} ${mapSize / 2 + 30}`}
            fill="none"
            stroke="#475569"
            strokeWidth="5"
          />

          {/* Player vehicle arrow */}
          <g transform={`translate(${playerMapX}, ${playerMapZ}) rotate(${physics.heading * (180 / Math.PI)})`}>
            <polygon points="0,-7 5,6 -5,6" fill="#ff0055" stroke="#ffffff" strokeWidth="1.5" />
          </g>

          {/* Active Checkpoint Marker */}
          {activeRace && activeRace.checkpoints[currentCheckpointIdx] && (
            <circle
              cx={mapSize / 2 + activeRace.checkpoints[currentCheckpointIdx].x * mapScale}
              cy={mapSize / 2 + activeRace.checkpoints[currentCheckpointIdx].z * mapScale}
              r="4"
              fill="#00f0ff"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          )}
        </svg>
      </div>
    </div>
  );
};
