/**
 * HORIZON: OPEN ROADS - Garage & Customization Screen
 * Turntable vehicle inspection, technical specs readout, paint color customizer, and vehicle selector.
 */

import React from 'react';
import { VehicleConfig, PlayerProfile } from '../types/game';
import { VEHICLE_CONFIGS } from '../game/vehicles/vehicleModels';
import { ArrowLeft, Check, Gauge, Zap, Compass, Shield, Palette } from 'lucide-react';

interface GarageScreenProps {
  profile: PlayerProfile;
  selectedVehicleId: string;
  onSelectVehicle: (vehicleId: string) => void;
  onChangeColor: (colorHex: string) => void;
  onBackToTitle: () => void;
  onStartDrive: () => void;
}

export const GarageScreen: React.FC<GarageScreenProps> = ({
  profile,
  selectedVehicleId,
  onSelectVehicle,
  onChangeColor,
  onBackToTitle,
  onStartDrive,
}) => {
  const currentVehicle: VehicleConfig = VEHICLE_CONFIGS[selectedVehicleId] || VEHICLE_CONFIGS['apex_gt'];
  const currentColor = profile.vehiclePaints[selectedVehicleId] || currentVehicle.color;

  const vehicleList = Object.values(VEHICLE_CONFIGS);

  return (
    <div className="absolute inset-0 select-none flex flex-col justify-between p-6 md:p-8 z-30 pointer-events-none text-white">
      {/* Top Bar: Back Button & Credits */}
      <div className="flex items-center justify-between pointer-events-auto">
        <button
          onClick={onBackToTitle}
          className="flex items-center space-x-2 bg-slate-950/85 px-4 py-2.5 rounded-2xl border border-white/15 hover:bg-slate-900 active:scale-95 transition-all shadow-xl"
        >
          <ArrowLeft className="w-5 h-5 text-slate-300" />
          <span className="text-sm font-bold uppercase tracking-wider">TITLE</span>
        </button>

        <div className="flex items-center space-x-2 bg-slate-950/85 px-5 py-2.5 rounded-2xl border border-white/15 shadow-xl">
          <span className="text-xs font-bold text-slate-400 uppercase">CREDITS</span>
          <span className="text-lg font-black text-amber-400 tabular-nums">
            {profile.credits.toLocaleString()} CR
          </span>
        </div>
      </div>

      {/* Middle Center: Drag to Rotate Hint for 3D Turntable */}
      <div className="self-center bg-slate-950/70 px-4 py-1.5 rounded-full border border-white/10 text-xs font-medium text-slate-300 pointer-events-none">
        Drag around screen to rotate vehicle 360°
      </div>

      {/* Bottom Panel: Vehicle Switcher, Specs & Paint Customizer */}
      <div className="flex flex-col md:flex-row gap-4 items-end justify-between pointer-events-auto">
        {/* Left: Vehicle Selector Cards */}
        <div className="flex space-x-3 overflow-x-auto max-w-full pb-2">
          {vehicleList.map((veh) => {
            const isSelected = veh.id === selectedVehicleId;
            return (
              <button
                key={veh.id}
                onClick={() => onSelectVehicle(veh.id)}
                className={`flex flex-col text-left p-4 rounded-2xl border-2 transition-all min-w-[200px] shadow-2xl active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-rose-500 shadow-rose-500/20'
                    : 'bg-slate-950/80 border-white/15 hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">
                    {veh.category}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-rose-400" />}
                </div>
                <div className="text-base font-black tracking-tight">{veh.name}</div>
                <div className="text-xs text-slate-400 font-mono mt-1">
                  {veh.topSpeedKmh} KM/H · 0-100 {veh.acceleration}s
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Technical Stats, Paint Swatches & Drive CTA */}
        <div className="bg-slate-950/90 p-5 rounded-3xl border border-white/20 shadow-2xl flex flex-col space-y-4 w-full md:w-96">
          <div>
            <div className="text-xl font-black">{currentVehicle.name}</div>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{currentVehicle.description}</p>
          </div>

          {/* Stats Bars */}
          <div className="space-y-2 text-xs">
            {/* Top Speed */}
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-0.5">
                <span className="flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" /> TOP SPEED
                </span>
                <span className="font-mono">{currentVehicle.topSpeedKmh} KM/H</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full"
                  style={{ width: `${(currentVehicle.topSpeedKmh / 360) * 100}%` }}
                />
              </div>
            </div>

            {/* Acceleration */}
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-0.5">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> ACCELERATION (0-100)
                </span>
                <span className="font-mono">{currentVehicle.acceleration}s</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${((5.0 - currentVehicle.acceleration) / 3.0) * 100}%` }}
                />
              </div>
            </div>

            {/* Handling */}
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-0.5">
                <span className="flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-emerald-400" /> HANDLING & DRIFT
                </span>
                <span className="font-mono">{currentVehicle.handling} / 10</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${currentVehicle.handling * 10}%` }}
                />
              </div>
            </div>

            {/* Off-Road Rating */}
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-0.5">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-orange-400" /> OFF-ROAD & DIRT
                </span>
                <span className="font-mono">{currentVehicle.offroadRating} / 10</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-400 rounded-full"
                  style={{ width: `${currentVehicle.offroadRating * 10}%` }}
                />
              </div>
            </div>
          </div>

          {/* Paint Swatches */}
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 mb-2">
              <Palette className="w-4 h-4 text-rose-400" />
              <span>FACTORY PAINT FINISH</span>
            </div>
            <div className="flex items-center space-x-2">
              {currentVehicle.availableColors.map((hex) => (
                <button
                  key={hex}
                  onClick={() => onChangeColor(hex)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform active:scale-90 ${
                    currentColor === hex ? 'scale-125 border-white shadow-lg' : 'border-black/50 opacity-80'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          {/* Start Driving CTA */}
          <button
            onClick={onStartDrive}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 font-black text-sm uppercase tracking-wider shadow-xl hover:brightness-110 active:scale-95 transition-all text-center"
          >
            TAKE TO OPEN ROADS
          </button>
        </div>
      </div>
    </div>
  );
};
