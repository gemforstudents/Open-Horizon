/**
 * HORIZON: OPEN ROADS - Help & Mobile Guide Modal
 */

import React from 'react';
import { X, Smartphone, Monitor, Flame, Zap, Award, Flag, RotateCcw, Share2, PlusSquare } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
  onToggleFullscreen?: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose, onToggleFullscreen }) => {
  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 text-white select-none">
      <div className="bg-slate-950 border border-white/20 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl flex flex-col space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <div className="text-xl font-black tracking-tight text-white flex items-center space-x-2">
              <span>HOW TO PLAY</span>
              <span className="text-xs bg-rose-500/30 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold">
                GUIDE
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Controls, Mobile Installation & Open World Tips</div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-900 border border-white/15 flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {/* Mobile Setup & Installation Banner */}
        <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 border border-amber-500/30 rounded-2xl p-4">
          <div className="flex items-center space-x-2 text-amber-400 font-black text-sm mb-2">
            <Smartphone className="w-5 h-5" />
            <span>PLAY ON MOBILE (FULLSCREEN PWA)</span>
          </div>

          <p className="text-xs text-slate-300 mb-3 leading-relaxed">
            For the best Horizon festival driving feel, play in <strong>Landscape Mode</strong>. You can install it directly to your home screen with zero app store downloads:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/90 p-3 rounded-xl border border-white/10">
              <div className="font-bold text-emerald-400 flex items-center space-x-1.5 mb-1">
                <span>🤖 Android (Chrome)</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                <li>Open page in Chrome browser</li>
                <li>Tap the <strong>3 dots (⋮)</strong> menu</li>
                <li>Tap <strong>"Install app"</strong> or "Add to Home screen"</li>
                <li>Launches fullscreen with no address bar!</li>
              </ol>
            </div>

            <div className="bg-slate-900/90 p-3 rounded-xl border border-white/10">
              <div className="font-bold text-cyan-400 flex items-center space-x-1.5 mb-1">
                <span>🍎 iPhone (Safari)</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                <li>Open page in Safari</li>
                <li>Tap the <strong>Share button</strong> (box with arrow)</li>
                <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                <li>Tap Add to enjoy native fullscreen!</li>
              </ol>
            </div>
          </div>

          {onToggleFullscreen && (
            <button
              onClick={() => {
                onToggleFullscreen();
                onClose();
              }}
              className="mt-3 w-full py-2.5 rounded-xl bg-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              <span>LOCK LANDSCAPE & FULLSCREEN NOW</span>
            </button>
          )}
        </div>

        {/* Driving Controls Breakdown */}
        <div className="space-y-2.5">
          <div className="text-xs font-black uppercase text-rose-400 tracking-wider flex items-center space-x-1.5">
            <Monitor className="w-4 h-4" />
            <span>DRIVING CONTROLS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10">
              <div className="font-bold text-white mb-1.5 flex items-center justify-between">
                <span>TOUCH CONTROLS</span>
                <span className="text-[10px] text-amber-400 font-normal">Multi-Touch Ready</span>
              </div>
              <ul className="space-y-1 text-slate-300 text-[11px]">
                <li>• <strong>Bottom Right</strong>: Large GAS & BRAKE/REV Pedals</li>
                <li>• <strong>DRIFT button</strong>: Handbrake lock for high-speed slides</li>
                <li>• <strong>Bottom Left</strong>: Steer Buttons or Analog Wheel</li>
                <li>• <strong>Top Right</strong>: Reset Car (R), Camera (C), Pause (Esc)</li>
              </ul>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10">
              <div className="font-bold text-white mb-1.5 flex items-center justify-between">
                <span>KEYBOARD (DESKTOP)</span>
                <span className="text-[10px] text-cyan-400 font-mono">WASD / ARROWS</span>
              </div>
              <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
                <li>• W / ↑: Throttle (Gas)</li>
                <li>• S / ↓: Brake / Reverse</li>
                <li>• A / D or ← / →: Steering</li>
                <li>• Space: Handbrake (Drift)</li>
                <li>• C: Cycle Camera · R: Reset Car</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Open World Activities */}
        <div className="space-y-2.5">
          <div className="text-xs font-black uppercase text-amber-400 tracking-wider">
            FESTIVAL ACTIVITIES
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-start space-x-2.5 bg-slate-900/60 p-2.5 rounded-xl border border-white/10">
              <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">Drifting:</span> Tap DRIFT when cornering at speed to start sliding. Build up to a 4.0x multiplier!
              </div>
            </div>

            <div className="flex items-start space-x-2.5 bg-slate-900/60 p-2.5 rounded-xl border border-white/10">
              <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">Speed Traps:</span> Blitz through radar speed cameras on straights and mountain crests for bonus CR.
              </div>
            </div>

            <div className="flex items-start space-x-2.5 bg-slate-900/60 p-2.5 rounded-xl border border-white/10">
              <Award className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">XP Boards:</span> 8 collectible neon boards hidden across cliff jumps and forest trails. Smash them!
              </div>
            </div>

            <div className="flex items-start space-x-2.5 bg-slate-900/60 p-2.5 rounded-xl border border-white/10">
              <Flag className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">Festival Races:</span> Point-to-point checkpoint routes against rival AI racers. Claim podium finishes!
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500 font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all text-center shadow-xl"
        >
          HIT THE OPEN ROADS
        </button>
      </div>
    </div>
  );
};
