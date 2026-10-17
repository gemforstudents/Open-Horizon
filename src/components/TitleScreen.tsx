/**
 * HORIZON: OPEN ROADS - Title Screen
 * Bespoke SVG Title Lockup, prominent Start CTA, live 3D preview backdrop,
 * quick access to Garage, Events, Settings, and Fullscreen Landscape.
 */

import React from 'react';
import { PlayerProfile } from '../types/game';
import { Play, Flag, Wrench, Settings, HelpCircle, Volume2, VolumeX, Sparkles, Maximize, Minimize, Download } from 'lucide-react';

interface TitleScreenProps {
  profile: PlayerProfile;
  isMuted: boolean;
  isFullscreen?: boolean;
  onToggleMute: () => void;
  onToggleFullscreen?: () => void;
  onStartFreeRoam: () => void;
  onOpenEvents: () => void;
  onOpenGarage: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenDownload?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  profile,
  isMuted,
  isFullscreen,
  onToggleMute,
  onToggleFullscreen,
  onStartFreeRoam,
  onOpenEvents,
  onOpenGarage,
  onOpenSettings,
  onOpenHelp,
  onOpenDownload,
}) => {
  return (
    <div className="absolute inset-0 select-none flex flex-col justify-between p-6 md:p-12 z-30 pointer-events-none text-white">
      {/* Top Header: Player Level, Credits, Fullscreen & Audio Mute */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="flex items-center space-x-3 bg-slate-950/80 px-4 py-2 rounded-2xl border border-white/15 shadow-xl">
          <div className="flex items-center space-x-1.5 text-amber-400 font-black">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider text-slate-300">LEVEL</span>
            <span className="text-base text-amber-300 tabular-nums">{profile.level}</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="text-sm font-bold tracking-tight text-white tabular-nums">
            {profile.credits.toLocaleString()} <span className="text-xs text-amber-400">CR</span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {onOpenDownload && (
            <button
              onClick={onOpenDownload}
              className="h-12 px-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/80 text-emerald-300 flex items-center space-x-1.5 active:scale-95 transition-all shadow-lg font-bold text-xs uppercase tracking-wider hover:bg-emerald-500/30 shadow-emerald-500/20"
              title="Download Horizon Open Roads on Mobile"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>GET APP</span>
            </button>
          )}

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className={`h-12 px-3.5 rounded-2xl border flex items-center space-x-2 active:scale-95 transition-all shadow-xl font-bold text-xs uppercase tracking-wider ${
                isFullscreen
                  ? 'bg-amber-500 border-amber-300 text-black shadow-amber-500/40'
                  : 'bg-slate-950/80 border-white/20 text-amber-400 hover:bg-slate-900'
              }`}
              title="Fullscreen Landscape Mode"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              <span className="hidden sm:inline">
                {isFullscreen ? 'WINDOWED' : 'FULLSCREEN'}
              </span>
            </button>
          )}

          <button
            onClick={onToggleMute}
            className="w-12 h-12 rounded-2xl bg-slate-950/80 border border-white/20 text-white flex items-center justify-center active:scale-95 transition-all shadow-xl hover:bg-slate-900"
            title="Toggle Audio Mute"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Center Left: Bespoke Inline SVG Title Lockup */}
      <div className="max-w-xl my-auto pointer-events-auto">
        <div className="mb-4">
          <svg viewBox="0 0 600 130" className="w-full max-w-lg drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)]">
            <defs>
              <linearGradient id="horizonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#ff385c" />
                <stop offset="100%" stopColor="#ff8c00" />
              </linearGradient>
            </defs>
            <polygon points="10,18 28,18 20,4 2,4" fill="#ff385c" />
            <polygon points="34,18 52,18 44,4 26,4" fill="#ffd166" />
            <polygon points="58,18 76,18 68,4 50,4" fill="#06d6a0" />
            <text
              x="2"
              y="68"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="64"
              fontStyle="italic"
              letterSpacing="6"
              fill="url(#horizonGrad)"
            >
              HORIZON
            </text>
            <text
              x="12"
              y="108"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="800"
              fontSize="24"
              letterSpacing="12"
              fill="#ffffff"
              opacity="0.95"
            >
              OPEN ROADS
            </text>
          </svg>
        </div>

        <p className="text-slate-300 text-sm md:text-base font-medium max-w-md mb-8 leading-relaxed drop-shadow-md">
          Explore coastal highways, mountain passes, and hidden forest shortcuts in high-performance sports cars.
        </p>

        {/* Action Button Row */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onStartFreeRoam}
            className="flex items-center space-x-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500 text-white font-black text-lg tracking-wider uppercase shadow-2xl hover:brightness-110 active:scale-95 transition-all drop-shadow-[0_4px_20px_rgba(255,56,92,0.5)]"
          >
            <Play className="w-6 h-6 fill-white" />
            <span>DRIVE NOW</span>
          </button>

          <button
            onClick={onOpenEvents}
            className="flex items-center space-x-2 px-6 py-4 rounded-2xl bg-slate-900/85 hover:bg-slate-800 text-white font-bold text-sm tracking-wider uppercase border border-white/20 active:scale-95 transition-all shadow-xl"
          >
            <Flag className="w-5 h-5 text-amber-400" />
            <span>EVENTS</span>
          </button>

          <button
            onClick={onOpenGarage}
            className="flex items-center space-x-2 px-6 py-4 rounded-2xl bg-slate-900/85 hover:bg-slate-800 text-white font-bold text-sm tracking-wider uppercase border border-white/20 active:scale-95 transition-all shadow-xl"
          >
            <Wrench className="w-5 h-5 text-cyan-400" />
            <span>GARAGE</span>
          </button>

          {onOpenDownload && (
            <button
              onClick={onOpenDownload}
              className="flex items-center space-x-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-black font-black text-sm tracking-wider uppercase active:scale-95 transition-all shadow-xl hover:brightness-110 shadow-emerald-500/30"
              title="Download App for Mobile (PWA)"
            >
              <Download className="w-5 h-5" />
              <span>GET APP</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="w-14 h-14 rounded-2xl bg-slate-900/85 hover:bg-slate-800 text-white flex items-center justify-center border border-white/20 active:scale-95 transition-all shadow-xl"
            title="Settings"
          >
            <Settings className="w-6 h-6 text-slate-300" />
          </button>

          <button
            onClick={onOpenHelp}
            className="w-14 h-14 rounded-2xl bg-slate-900/85 hover:bg-slate-800 text-white flex items-center justify-center border border-white/20 active:scale-95 transition-all shadow-xl"
            title="How to Play"
          >
            <HelpCircle className="w-6 h-6 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Bottom Hint Line */}
      <div className="flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 font-medium border-t border-white/10 pt-4 pointer-events-auto">
        <div className="font-mono text-slate-300 mb-2 md:mb-0">
          WASD / Arrows to Drive · Space to Drift · C Camera · R Reset · Esc Pause
        </div>
        <div className="text-[11px] text-slate-500">
          Mobile-Ready 3D Open-World Simulation · Three.js PBR Engine
        </div>
      </div>
    </div>
  );
};
