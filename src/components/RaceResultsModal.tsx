/**
 * HORIZON: OPEN ROADS - Race Results Screen
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RaceConfig } from '../types/game';
import { Trophy, Award, Timer, RotateCcw, Flag, Navigation } from 'lucide-react';

interface RaceResultsModalProps {
  race: RaceConfig;
  position: number;
  timeSeconds: number;
  isNewRecord: boolean;
  onRestart: () => void;
  onOpenEvents: () => void;
  onContinueFreeRoam: () => void;
}

export const RaceResultsModal: React.FC<RaceResultsModalProps> = ({
  race,
  position,
  timeSeconds,
  isNewRecord,
  onRestart,
  onOpenEvents,
  onContinueFreeRoam,
}) => {
  useEffect(() => {
    if (position <= 3) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [position]);

  const mins = Math.floor(timeSeconds / 60);
  const secs = (timeSeconds % 60).toFixed(2);
  const timeFormatted = `${mins}:${secs.padStart(5, '0')}`;

  const positionLabel =
    position === 1 ? '1ST PLACE' : position === 2 ? '2ND PLACE' : position === 3 ? '3RD PLACE' : '4TH PLACE';

  const positionColor =
    position === 1
      ? 'from-amber-400 to-yellow-500 text-black'
      : position === 2
      ? 'from-slate-300 to-slate-400 text-black'
      : position === 3
      ? 'from-amber-700 to-orange-800 text-white'
      : 'from-slate-700 to-slate-800 text-white';

  return (
    <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-40 text-white select-none">
      <div className="bg-slate-950 border border-white/20 rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col space-y-6 animate-scaleIn">
        {/* Placement Badge */}
        <div className="flex flex-col items-center">
          <div
            className={`px-6 py-2 rounded-2xl bg-gradient-to-r ${positionColor} font-black text-xl tracking-wider shadow-xl flex items-center space-x-2`}
          >
            <Trophy className="w-6 h-6" />
            <span>{positionLabel}</span>
          </div>

          <div className="text-2xl font-black tracking-tight mt-3">{race.name}</div>
          <div className="text-xs text-slate-400 uppercase tracking-widest">{race.subtitle}</div>
        </div>

        {/* Time & Record */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Timer className="w-6 h-6 text-cyan-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">FINAL TIME</div>
              <div className="text-2xl font-mono font-black text-cyan-300 tabular-nums">
                {timeFormatted}
              </div>
            </div>
          </div>

          {isNewRecord && (
            <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider">
              NEW RECORD!
            </div>
          )}
        </div>

        {/* Reward Payout */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-3 flex items-center space-x-3">
            <Award className="w-6 h-6 text-amber-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">CREDITS</div>
              <div className="text-lg font-black text-amber-400">
                +{race.rewards.credits.toLocaleString()} CR
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-3 flex items-center space-x-3">
            <Award className="w-6 h-6 text-rose-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">EXPERIENCE</div>
              <div className="text-lg font-black text-rose-400">
                +{race.rewards.xp.toLocaleString()} XP
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2.5 pt-2">
          <button
            onClick={onRestart}
            className="flex items-center justify-center space-x-2 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-xl"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RACE AGAIN</span>
          </button>

          <button
            onClick={onOpenEvents}
            className="flex items-center justify-center space-x-2 py-3 rounded-2xl bg-slate-900 border border-white/15 hover:bg-slate-850 font-bold text-sm uppercase tracking-wider active:scale-95 transition-all"
          >
            <Flag className="w-4 h-4 text-amber-400" />
            <span>MORE EVENTS</span>
          </button>

          <button
            onClick={onContinueFreeRoam}
            className="flex items-center justify-center space-x-2 py-2.5 rounded-2xl bg-slate-900/60 border border-white/10 hover:bg-slate-850 font-semibold text-xs uppercase tracking-wider text-slate-400 active:scale-95 transition-all"
          >
            <Navigation className="w-4 h-4" />
            <span>CONTINUE FREE ROAM</span>
          </button>
        </div>
      </div>
    </div>
  );
};
