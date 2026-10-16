/**
 * HORIZON: OPEN ROADS - Settings Modal
 */

import React, { useState } from 'react';
import { GameSettings, GraphicsQuality, ControlType, CameraDistanceMode } from '../types/game';
import { X, Sliders, Smartphone, Eye, Volume2, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onResetSave: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetSave,
  onClose,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  const update = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  return (
    <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-40 text-white select-none">
      <div className="bg-slate-950 border border-white/20 rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-2">
            <Sliders className="w-6 h-6 text-rose-500" />
            <div className="text-xl font-black tracking-tight">GAME SETTINGS</div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-900 border border-white/15 flex items-center justify-center hover:bg-slate-800"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {/* Graphics Preset */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase text-slate-300">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>GRAPHICS PRESET</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
              <button
                key={q}
                onClick={() => update('graphicsQuality', q)}
                className={`py-2.5 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all ${
                  settings.graphicsQuality === q
                    ? 'bg-cyan-500 border-cyan-400 text-black shadow-lg shadow-cyan-500/30'
                    : 'bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-slate-400">
            {settings.graphicsQuality === 'low'
              ? 'Low: 1.0 pixel ratio, disabled dynamic shadows (fastest for older phones).'
              : settings.graphicsQuality === 'medium'
              ? 'Medium: Balanced 1.25 pixel ratio, soft shadows.'
              : 'High: Maximum 1.5 pixel ratio, full resolution shadows and reflections.'}
          </div>
        </div>

        {/* Mobile Steering Layout */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase text-slate-300">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span>TOUCH CONTROLS LAYOUT</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['buttons', 'wheel'] as ControlType[]).map((type) => (
              <button
                key={type}
                onClick={() => update('controlType', type)}
                className={`py-2.5 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all ${
                  settings.controlType === type
                    ? 'bg-amber-400 border-amber-300 text-black shadow-lg shadow-amber-400/30'
                    : 'bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {type === 'buttons' ? 'Touch Buttons' : 'Virtual Wheel'}
              </button>
            ))}
          </div>
        </div>

        {/* Steering Sensitivity */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-300">
            <span>STEERING SENSITIVITY</span>
            <span className="font-mono text-cyan-400">{settings.steeringSensitivity.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.6"
            max="1.4"
            step="0.1"
            value={settings.steeringSensitivity}
            onChange={(e) => update('steeringSensitivity', parseFloat(e.target.value))}
            className="w-full accent-cyan-400"
          />
        </div>

        {/* Camera Distance */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase text-slate-300">DEFAULT CAMERA VIEW</div>
          <div className="grid grid-cols-4 gap-2">
            {(['close', 'medium', 'far', 'hood'] as CameraDistanceMode[]).map((cam) => (
              <button
                key={cam}
                onClick={() => update('cameraDistance', cam)}
                className={`py-2 rounded-xl border font-bold text-[11px] uppercase tracking-wider transition-all ${
                  settings.cameraDistance === cam
                    ? 'bg-rose-500 border-rose-400 text-white shadow-lg'
                    : 'bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {cam}
              </button>
            ))}
          </div>
        </div>

        {/* Audio Volume Sliders */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase text-slate-300">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>AUDIO LEVELS</span>
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Sound Effects (Engine & Tires)</span>
              <span className="font-mono">{Math.round(settings.soundVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.soundVolume}
              onChange={(e) => update('soundVolume', parseFloat(e.target.value))}
              className="w-full accent-emerald-400"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Ambient Festival Synth</span>
              <span className="font-mono">{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={(e) => update('musicVolume', parseFloat(e.target.value))}
              className="w-full accent-emerald-400"
            />
          </div>
        </div>

        {/* Show FPS Toggle */}
        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          <span className="text-xs font-bold text-slate-300 uppercase">SHOW FPS COUNTER</span>
          <button
            onClick={() => update('showFps', !settings.showFps)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.showFps ? 'bg-emerald-500' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.showFps ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Reset Save Data */}
        <div className="border-t border-white/10 pt-3">
          {confirmReset ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  onResetSave();
                  setConfirmReset(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 font-bold text-xs uppercase tracking-wider text-white hover:bg-rose-700"
              >
                CONFIRM RESET ALL DATA
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 font-bold text-xs uppercase text-slate-300"
              >
                CANCEL
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 font-semibold text-xs transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>RESET SAVED PROGRESS & SETTINGS</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
