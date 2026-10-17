/**
 * HORIZON: OPEN ROADS - Mobile Download & Install Modal
 * Provides 1-tap installation on Android/Chromium, guided iOS Safari instructions,
 * and a direct phone QR code for instant mobile setup.
 */

import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  X,
  Download,
  Smartphone,
  Share2,
  PlusSquare,
  CheckCircle2,
  WifiOff,
  Zap,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

interface InstallAppModalProps {
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const liveUrl = 'https://gemforstudents.github.io/Open-Horizon/';

  const handleCopy = () => {
    navigator.clipboard.writeText(liveUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 text-white select-none">
      <div className="bg-slate-950 border-2 border-amber-500/40 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl flex flex-col space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight flex items-center space-x-2">
                <span>DOWNLOAD FOR MOBILE</span>
              </div>
              <div className="text-xs text-amber-400 font-semibold">Standalone PWA Game Experience</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-900 border border-white/15 flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {/* If already running as installed app */}
        {isInstalled ? (
          <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-2xl p-4 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <div className="font-black text-emerald-300 text-sm">HORIZON IS INSTALLED!</div>
            <p className="text-xs text-slate-300 mt-1">
              You are currently playing in full-screen standalone mode with maximum performance.
            </p>
          </div>
        ) : (
          <>
            {/* Primary Action Button (Android / Desktop Chrome 1-tap install) */}
            {isInstallable && (
              <button
                onClick={handleInstallClick}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-black font-black text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow-2xl hover:brightness-110 active:scale-95 transition-all shadow-emerald-500/30"
              >
                <Download className="w-5 h-5" />
                <span>INSTALL APP TO HOME SCREEN</span>
              </button>
            )}

            {/* Android Chrome Instructions */}
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center space-x-2 text-emerald-400 font-black text-xs uppercase tracking-wider mb-2">
                <span>🤖 Android (Chrome / Edge)</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300">
                <li>
                  {isInstallable ? (
                    <span>Tap the green <strong>"INSTALL APP"</strong> button above, or:</span>
                  ) : (
                    <span>Open the link in Chrome browser</span>
                  )}
                </li>
                <li>Tap the <strong>3 dots menu (⋮)</strong> in the top right</li>
                <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></li>
                <li>Launches with icon on home screen, zero browser bars!</li>
              </ol>
            </div>

            {/* iPhone / iPad Safari Instructions */}
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center space-x-2 text-cyan-400 font-black text-xs uppercase tracking-wider mb-2">
                <span>🍎 iPhone / iPad (Safari)</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300">
                <li className="flex items-center space-x-1.5">
                  <span>1. Tap the <strong>Share button</strong></span>
                  <Share2 className="w-3.5 h-3.5 text-cyan-400 inline shrink-0" />
                  <span>in the bottom bar</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <span>2. Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                  <PlusSquare className="w-3.5 h-3.5 text-amber-400 inline shrink-0" />
                </li>
                <li>3. Tap <strong>Add</strong> at top right to complete installation</li>
              </ol>
            </div>

            {/* Direct Mobile Link & QR Code */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-3.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                DIRECT MOBILE URL
              </div>
              <div className="flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-xl border border-white/10 text-xs font-mono">
                <span className="truncate flex-1 text-slate-300">{liveUrl}</span>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-sans font-bold flex items-center space-x-1 shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Benefits of Installing */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
            <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <div className="text-[11px] font-black">FULLSCREEN</div>
            <div className="text-[9px] text-slate-400">Zero browser tabs</div>
          </div>
          <div className="bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
            <WifiOff className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <div className="text-[11px] font-black">OFFLINE READY</div>
            <div className="text-[9px] text-slate-400">Play anywhere</div>
          </div>
          <div className="bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
            <Smartphone className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <div className="text-[11px] font-black">FAST 60+ FPS</div>
            <div className="text-[9px] text-slate-400">Mobile optimized</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-slate-900 border border-white/20 font-bold text-xs uppercase tracking-wider hover:bg-slate-800 active:scale-95 transition-all text-center"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};
