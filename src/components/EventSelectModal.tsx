/**
 * HORIZON: OPEN ROADS - Festival Events Selector
 */

import React from 'react';
import { GAME_RACES } from '../game/world/roadNetwork';
import { RaceConfig, PlayerProfile } from '../types/game';
import { X, Play, Trophy, Navigation, Award } from 'lucide-react';

interface EventSelectModalProps {
  profile: PlayerProfile;
  onSelectRace: (race: RaceConfig) => void;
  onStartFreeRoam: () => void;
  onClose: () => void;
}

export const EventSelectModal: React.FC<EventSelectModalProps> = ({
  profile,
  onSelectRace,
  onStartFreeRoam,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-40 text-white select-none">
      <div className="bg-slate-950 border border-white/20 rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-rose-500">
              HORIZON FESTIVAL
            </div>
            <div className="text-2xl font-black tracking-tight">SELECT ACTIVITY</div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-900 border border-white/15 flex items-center justify-center hover:bg-slate-800"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {/* Free Roam Card */}
        <div
          onClick={onStartFreeRoam}
          className="bg-gradient-to-r from-slate-900 to-slate-950 border-2 border-white/20 hover:border-emerald-500 rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                <Navigation className="w-6 h-6" />
              </div>
              <div>
                <div className="text-lg font-black group-hover:text-emerald-400 transition-colors">
                  FREE ROAM EXPLORATION
                </div>
                <div className="text-xs text-slate-400">
                  Drive without timers or boundaries. Find speed traps, drift zones, and secret XP boards.
                </div>
              </div>
            </div>
            <Play className="w-6 h-6 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </div>
        </div>

        {/* Race Events List */}
        <div className="space-y-4">
          <div className="text-xs font-black uppercase tracking-wider text-slate-400">
            SANCTIONED FESTIVAL RACES
          </div>

          {GAME_RACES.map((race) => {
            const bestTime = profile.bestRaceTimes[race.id];
            return (
              <div
                key={race.id}
                onClick={() => onSelectRace(race)}
                className="bg-gradient-to-r from-slate-900 to-slate-950 border-2 border-white/15 hover:border-rose-500 rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-xl"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-black shrink-0">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-black group-hover:text-rose-400 transition-colors">
                          {race.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                          {race.difficulty}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{race.description}</div>
                      <div className="flex items-center space-x-4 text-xs font-mono text-slate-300 mt-2">
                        <span>{race.lengthKm} KM</span>
                        <span>·</span>
                        <span>{race.checkpoints.length} CHECKPOINTS</span>
                        <span>·</span>
                        <span className="text-amber-400 font-bold">
                          +{race.rewards.credits.toLocaleString()} CR
                        </span>
                      </div>
                    </div>
                  </div>

                  {bestTime && (
                    <div className="text-right shrink-0">
                      <div className="text-[10px] uppercase font-bold text-slate-400">BEST TIME</div>
                      <div className="text-base font-mono font-black text-cyan-300">
                        {Math.floor(bestTime / 60)}:{(bestTime % 60).toFixed(2).padStart(5, '0')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
