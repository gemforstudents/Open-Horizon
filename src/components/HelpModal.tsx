/**
 * HORIZON: OPEN ROADS - Help & Controls Modal
 */

import React from 'react';
import { X, Navigation, Flame, Zap, Award, Flag } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-40 text-white select-none">
      <div className="bg-slate-950 border border-white/20 rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="text-xl font-black tracking-tight">HOW TO PLAY</div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-900 border border-white/15 flex items-center justify-center hover:bg-slate-800"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {/* Controls Breakdown */}
        <div className="space-y-3">
          <div className="text-xs font-black uppercase text-rose-500 tracking-wider">
            DRIVING CONTROLS
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10">
              <div className="font-bold text-white mb-1">KEYBOARD (DESKTOP)</div>
              <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
                <li>W / Up Arrow: Gas (Throttle)</li>
                <li>S / Down Arrow: Brake / Reverse</li>
                <li>A / D or Left / Right: Steer</li>
                <li>Space: Handbrake (Drift)</li>
                <li>C: Cycle Camera Mode</li>
                <li>R: Reset Car to Road</li>
                <li>Esc: Pause Menu</li>
              </ul>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10">
              <div className="font-bold text-white mb-1">TOUCH (MOBILE)</div>
              <ul className="space-y-1 text-slate-300 text-[11px]">
                <li>Bottom Left: Buttons or Steering Wheel</li>
                <li>Bottom Right: GAS and BRAKE Pedals</li>
                <li>Drift Button: Handbrake lock</li>
                <li>Top Right: Camera, Reset, and Pause</li>
                <li>Supports simultaneous multi-touch</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Game Activities Guide */}
        <div className="space-y-3">
          <div className="text-xs font-black uppercase text-amber-400 tracking-wider">
            OPEN-WORLD ACTIVITIES
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-start space-x-3 bg-slate-900/60 p-2.5 rounded-xl border border-white/10">
              <Flame className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">Drifting & Multipliers:</span> Tap or hold the
                handbrake while entering a corner at speed, then counter-steer to hold the drift.
                Chain continuous drifts to build up to a 4.0x multiplier!
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-slate-900/60 p-2.5 rounded-xl border border-white/10">
              <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">Speed Traps:</span> Blast through radar cameras on
                the coastal straight and mountain crest to set peak speed records and earn bonus credits.
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-slate-900/60 p-2.5 rounded-xl border border-white/10">
              <Award className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">Horizon XP Boards:</span> 8 collectible neon boards
                are hidden across scenic lookout ledges, forest dirt tracks, and cliff jumps. Smash them
                to earn massive XP bonuses!
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-slate-900/60 p-2.5 rounded-xl border border-white/10">
              <Flag className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">Festival Races:</span> Compete in point-to-point
                routes through illuminated checkpoint gates against AI rival racers. Finish on the
                podium to unlock cash rewards!
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all text-center"
        >
          LET'S DRIVE!
        </button>
      </div>
    </div>
  );
};
