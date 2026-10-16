/**
 * HORIZON: OPEN ROADS - Touch Controls Overlay
 * Multi-touch responsive mobile controls with Virtual Steering Wheel or Left/Right Buttons,
 * Gas & Brake Pedals, Handbrake, Camera switch, and Emergency Car Reset.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PlayerInput, ControlType } from '../types/game';
import { RotateCcw, Video, Pause, Disc } from 'lucide-react';

interface TouchControlsProps {
  controlType: ControlType;
  onInputChange: (input: PlayerInput) => void;
  onResetCar: () => void;
  onToggleCamera: () => void;
  onPause: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  controlType,
  onInputChange,
  onResetCar,
  onToggleCamera,
  onPause,
}) => {
  const currentInput = useRef<PlayerInput>({
    throttle: 0,
    brake: 0,
    steering: 0,
    handbrake: false,
    reverse: false,
  });

  const [activeSteerDir, setActiveSteerDir] = useState<'left' | 'right' | null>(null);
  const [isGasPressed, setIsGasPressed] = useState(false);
  const [isBrakePressed, setIsBrakePressed] = useState(false);
  const [isHandbrakePressed, setIsHandbrakePressed] = useState(false);
  const [wheelRotationDeg, setWheelRotationDeg] = useState(0);

  const wheelRef = useRef<HTMLDivElement>(null);
  const wheelTouchId = useRef<number | null>(null);
  const wheelCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const notifyChange = useCallback(() => {
    onInputChange({ ...currentInput.current });
  }, [onInputChange]);

  // Keyboard controls for desktop testing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let changed = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        currentInput.current.throttle = 1.0;
        setIsGasPressed(true);
        changed = true;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        currentInput.current.brake = 1.0;
        setIsBrakePressed(true);
        changed = true;
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        currentInput.current.steering = -1.0;
        setActiveSteerDir('left');
        changed = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        currentInput.current.steering = 1.0;
        setActiveSteerDir('right');
        changed = true;
      }
      if (e.key === ' ' || e.code === 'Space') {
        currentInput.current.handbrake = true;
        setIsHandbrakePressed(true);
        changed = true;
      }
      if (e.key === 'c' || e.key === 'C') {
        onToggleCamera();
      }
      if (e.key === 'r' || e.key === 'R') {
        onResetCar();
      }
      if (e.key === 'Escape') {
        onPause();
      }

      if (changed) notifyChange();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      let changed = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        currentInput.current.throttle = 0;
        setIsGasPressed(false);
        changed = true;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        currentInput.current.brake = 0;
        setIsBrakePressed(false);
        changed = true;
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (currentInput.current.steering < 0) currentInput.current.steering = 0;
        setActiveSteerDir(null);
        changed = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (currentInput.current.steering > 0) currentInput.current.steering = 0;
        setActiveSteerDir(null);
        changed = true;
      }
      if (e.key === ' ' || e.code === 'Space') {
        currentInput.current.handbrake = false;
        setIsHandbrakePressed(false);
        changed = true;
      }

      if (changed) notifyChange();
    };

    const handleBlur = () => {
      currentInput.current = {
        throttle: 0,
        brake: 0,
        steering: 0,
        handbrake: false,
        reverse: false,
      };
      setIsGasPressed(false);
      setIsBrakePressed(false);
      setIsHandbrakePressed(false);
      setActiveSteerDir(null);
      notifyChange();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [notifyChange, onToggleCamera, onResetCar, onPause]);

  // Touch Handlers for Virtual Steering Wheel
  const handleWheelPointerDown = (e: React.PointerEvent) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    wheelCenter.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    wheelTouchId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    handleWheelPointerMove(e);
  };

  const handleWheelPointerMove = (e: React.PointerEvent) => {
    if (wheelTouchId.current !== e.pointerId) return;
    const dx = e.clientX - wheelCenter.current.x;
    const dy = e.clientY - wheelCenter.current.y;
    // Calculate angle in degrees relative to vertical
    let angleDeg = Math.atan2(dx, -dy) * (180 / Math.PI);
    angleDeg = Math.max(-90, Math.min(90, angleDeg)); // Max 90 deg lock

    setWheelRotationDeg(angleDeg);
    currentInput.current.steering = angleDeg / 90;
    notifyChange();
  };

  const handleWheelPointerUp = (e: React.PointerEvent) => {
    if (wheelTouchId.current === e.pointerId) {
      wheelTouchId.current = null;
      setWheelRotationDeg(0);
      currentInput.current.steering = 0;
      notifyChange();
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20">
      {/* Top action bar buttons: Pause, Camera, Reset */}
      <div className="absolute top-4 right-4 flex items-center space-x-3 pointer-events-auto">
        <button
          onClick={onToggleCamera}
          className="w-12 h-12 rounded-xl bg-slate-900/80 border border-white/20 text-white flex items-center justify-center active:scale-95 transition-transform backdrop-blur-none shadow-lg active:bg-cyan-600"
          title="Change Camera View (C)"
        >
          <Video className="w-6 h-6 text-cyan-400" />
        </button>
        <button
          onClick={onResetCar}
          className="w-12 h-12 rounded-xl bg-slate-900/80 border border-white/20 text-white flex items-center justify-center active:scale-95 transition-transform backdrop-blur-none shadow-lg active:bg-amber-600"
          title="Recover Car to Road (R)"
        >
          <RotateCcw className="w-6 h-6 text-amber-400" />
        </button>
        <button
          onClick={onPause}
          className="w-12 h-12 rounded-xl bg-slate-900/80 border border-white/20 text-white flex items-center justify-center active:scale-95 transition-transform backdrop-blur-none shadow-lg active:bg-rose-600"
          title="Pause Game (Esc)"
        >
          <Pause className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Bottom Left: Steering Controls */}
      <div className="absolute bottom-6 left-6 pointer-events-auto">
        {controlType === 'wheel' ? (
          /* Virtual Analog Steering Wheel */
          <div
            ref={wheelRef}
            onPointerDown={handleWheelPointerDown}
            onPointerMove={handleWheelPointerMove}
            onPointerUp={handleWheelPointerUp}
            onPointerCancel={handleWheelPointerUp}
            className="w-36 h-36 rounded-full bg-gradient-to-b from-slate-800/90 to-slate-950/90 border-4 border-slate-600/80 shadow-2xl flex items-center justify-center touch-none relative"
            style={{
              transform: `rotate(${wheelRotationDeg}deg)`,
              transition: wheelTouchId.current === null ? 'transform 0.15s ease-out' : 'none',
            }}
          >
            {/* Wheel rim accent stripe */}
            <div className="absolute top-1 w-4 h-3 bg-rose-500 rounded-sm" />
            <Disc className="w-16 h-16 text-slate-400" />
            <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 h-4 bg-slate-700/80 rounded" />
          </div>
        ) : (
          /* Left / Right Steering Buttons */
          <div className="flex space-x-3">
            <button
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                currentInput.current.steering = -1.0;
                setActiveSteerDir('left');
                notifyChange();
              }}
              onPointerUp={(e) => {
                currentInput.current.steering = 0;
                setActiveSteerDir(null);
                notifyChange();
              }}
              onPointerCancel={(e) => {
                currentInput.current.steering = 0;
                setActiveSteerDir(null);
                notifyChange();
              }}
              className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center font-black text-2xl transition-all shadow-xl active:scale-95 touch-none ${
                activeSteerDir === 'left'
                  ? 'bg-cyan-500 border-cyan-300 text-white shadow-cyan-500/50'
                  : 'bg-slate-900/85 border-white/20 text-slate-200'
              }`}
            >
              ◀
            </button>
            <button
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                currentInput.current.steering = 1.0;
                setActiveSteerDir('right');
                notifyChange();
              }}
              onPointerUp={(e) => {
                currentInput.current.steering = 0;
                setActiveSteerDir(null);
                notifyChange();
              }}
              onPointerCancel={(e) => {
                currentInput.current.steering = 0;
                setActiveSteerDir(null);
                notifyChange();
              }}
              className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center font-black text-2xl transition-all shadow-xl active:scale-95 touch-none ${
                activeSteerDir === 'right'
                  ? 'bg-cyan-500 border-cyan-300 text-white shadow-cyan-500/50'
                  : 'bg-slate-900/85 border-white/20 text-slate-200'
              }`}
            >
              ▶
            </button>
          </div>
        )}
      </div>

      {/* Bottom Right: Pedals & Handbrake */}
      <div className="absolute bottom-6 right-6 flex items-end space-x-4 pointer-events-auto">
        {/* Handbrake Button */}
        <button
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            currentInput.current.handbrake = true;
            setIsHandbrakePressed(true);
            notifyChange();
          }}
          onPointerUp={(e) => {
            currentInput.current.handbrake = false;
            setIsHandbrakePressed(false);
            notifyChange();
          }}
          onPointerCancel={(e) => {
            currentInput.current.handbrake = false;
            setIsHandbrakePressed(false);
            notifyChange();
          }}
          className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center font-bold text-xs transition-all shadow-xl active:scale-95 touch-none mb-1 ${
            isHandbrakePressed
              ? 'bg-amber-500 border-amber-300 text-black shadow-amber-500/50 scale-95'
              : 'bg-slate-900/85 border-amber-500/40 text-amber-400'
          }`}
          title="Handbrake Drift (Space)"
        >
          <span className="text-sm font-black">DRIFT</span>
          <span className="text-[10px] opacity-75">BRAKE</span>
        </button>

        {/* Brake / Reverse Pedal */}
        <button
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            currentInput.current.brake = 1.0;
            setIsBrakePressed(true);
            notifyChange();
          }}
          onPointerUp={(e) => {
            currentInput.current.brake = 0;
            setIsBrakePressed(false);
            notifyChange();
          }}
          onPointerCancel={(e) => {
            currentInput.current.brake = 0;
            setIsBrakePressed(false);
            notifyChange();
          }}
          className={`w-20 h-24 rounded-2xl border-2 flex flex-col items-center justify-center font-black text-sm transition-all shadow-xl active:scale-95 touch-none ${
            isBrakePressed
              ? 'bg-rose-600 border-rose-300 text-white shadow-rose-600/50'
              : 'bg-slate-900/85 border-rose-500/40 text-rose-400'
          }`}
        >
          <span className="text-base">BRAKE</span>
          <span className="text-[10px] text-slate-400 font-normal">REVERSE</span>
        </button>

        {/* Throttle (Gas) Pedal */}
        <button
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            currentInput.current.throttle = 1.0;
            setIsGasPressed(true);
            notifyChange();
          }}
          onPointerUp={(e) => {
            currentInput.current.throttle = 0;
            setIsGasPressed(false);
            notifyChange();
          }}
          onPointerCancel={(e) => {
            currentInput.current.throttle = 0;
            setIsGasPressed(false);
            notifyChange();
          }}
          className={`w-22 h-32 rounded-2xl border-2 flex flex-col items-center justify-center font-black text-base transition-all shadow-2xl active:scale-95 touch-none ${
            isGasPressed
              ? 'bg-emerald-500 border-emerald-300 text-black shadow-emerald-500/60'
              : 'bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-emerald-500/50 text-emerald-400'
          }`}
        >
          <span className="text-xl">GAS</span>
          <span className="text-[10px] text-emerald-300/70 font-semibold uppercase tracking-wider">THROTTLE</span>
        </button>
      </div>
    </div>
  );
};
