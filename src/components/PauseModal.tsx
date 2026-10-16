/**
 * HORIZON: OPEN ROADS - Pause Modal
 */

import React from 'react';
import { Play, RotateCcw, Wrench, Settings, Home } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onReturnToGarage: () => void;
  onReturnToTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenSettings,
  onReturnToGarage,
  onReturnToTitle,
}) => {
  return (
    <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-40 text-white select-none">
      <div className="bg-slate-950 border border-white/20 rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col space-y-4">
        <div className="text-center pb-2 border-b border-white/10">
          <div className="text-xs font-black uppercase tracking-widest text-rose-500">HORIZON</div>
          <div className="text-2xl font-black tracking-tight">GAME PAUSED</div>
        </div>

        <button
          onClick={onResume}
          className="flex items-center justify-center space-x-2 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-xl"
        >
          <Play className="w-5 h-5 fill-white" />
          <span>RESUME DRIVING</span>
        </button>

        <button
          onClick={onRestart}
          className="flex items-center justify-center space-x-2 py-3 rounded-2xl bg-slate-900 border border-white/15 hover:bg-slate-850 font-bold text-sm uppercase tracking-wider active:scale-95 transition-all"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>RESTART EVENT</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="flex items-center justify-center space-x-2 py-3 rounded-2xl bg-slate-900 border border-white/15 hover:bg-slate-850 font-bold text-sm uppercase tracking-wider active:scale-95 transition-all"
        >
          <Settings className="w-4 h-4 text-cyan-400" />
          <span>SETTINGS</span>
        </button>

        <button
          onClick={onReturnToGarage}
          className="flex items-center justify-center space-x-2 py-3 rounded-2xl bg-slate-900 border border-white/15 hover:bg-slate-850 font-bold text-sm uppercase tracking-wider active:scale-95 transition-all"
        >
          <Wrench className="w-4 h-4 text-slate-300" />
          <span>CHANGE CAR (GARAGE)</span>
        </button>

        <button
          onClick={onReturnToTitle}
          className="flex items-center justify-center space-x-2 py-3 rounded-2xl bg-slate-900/60 border border-white/10 hover:bg-slate-850 font-semibold text-xs uppercase tracking-wider text-slate-400 active:scale-95 transition-all"
        >
          <Home className="w-4 h-4" />
          <span>TITLE SCREEN</span>
        </button>
      </div>
    </div>
  );
};
