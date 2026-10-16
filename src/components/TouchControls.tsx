/**
 * HORIZON: OPEN ROADS - Touch Controls Overlay
 * Highly robust multi-touch mobile driving controls.
 * Prevents pointer capture errors, supports simultaneous multi-touch,
 * keyboard fallback, and in-game screen rotation toggle.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PlayerInput, ControlType } from '../types/game';
import { RotateCcw, Video, Pause, Disc, RotateCw } from 'lucide-react';

interface TouchControlsProps {
  controlType: ControlType;
  isScreenRotated: boolean;
  onInputChange: (input: PlayerInput) => void;
  onResetCar: () => void;
  onToggleCamera: () => void;
  onPause: () => void;
  onToggleRotateScreen: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  controlType,
  isScreenRotated,
  onInputChange,
  onResetCar,
  onToggleCamera,
  onPause,
  onToggleRotateScreen,
}) => {
  // Stable mutable input state
  const currentInput = useRef<PlayerInput>({
    throttle: 0,
    brake: 0,
    steering: 0,
    handbrake: false,
    reverse: false,
  });

  // Active touch pointer tracking map (pointerId -> action)
  const activePointers = useRef<Map<number, string>>(new Map());

  // Visual state
  const [activeSteerDir, setActiveSteerDir] = useState<'left' | 'right' | null>(null);
  const [isGasPressed, setIsGasPressed] = useState(false);
  const [isBrakePressed, setIsBrakePressed] = useState(false);
  const [isHandbrakePressed, setIsHandbrakePressed] = useState(false);
  const [wheelRotationDeg, setWheelRotationDeg] = useState(0);

  // Wheel refs
  const wheelRef = useRef<HTMLDivElement>(null);
  const wheelPointerId = useRef<number | null>(null);
  const wheelCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Stable input dispatcher
  const dispatchInput = useCallback(() => {
    onInputChange({ ...currentInput.current });
  }, [onInputChange]);

  // Keyboard controls with Set to guarantee zero dropped keystrokes
  useEffect(() => {
    const keysDown = new Set<string>();

    const updateFromKeys = () => {
      const up = keysDown.has('ArrowUp') || keysDown.has('KeyW');
      const down = keysDown.has('ArrowDown') || keysDown.has('KeyS');
      const left = keysDown.has('ArrowLeft') || keysDown.has('KeyA');
      const right = keysDown.has('ArrowRight') || keysDown.has('KeyD');
      const space = keysDown.has('Space');

      currentInput.current.throttle = up ? 1.0 : 0;
      currentInput.current.brake = down ? 1.0 : 0;
      currentInput.current.steering = left ? -1.0 : right ? 1.0 : 0;
      currentInput.current.handbrake = space;

      setIsGasPressed(up);
      setIsBrakePressed(down);
      setActiveSteerDir(left ? 'left' : right ? 'right' : null);
      setIsHandbrakePressed(space);

      dispatchInput();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is inside an input or modifier keys are pressed
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'KeyC') {
        onToggleCamera();
        return;
      }
      if (e.code === 'KeyR') {
        onResetCar();
        return;
      }
      if (e.code === 'Escape') {
        onPause();
        return;
      }

      if (!keysDown.has(e.code)) {
        keysDown.add(e.code);
        updateFromKeys();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (keysDown.has(e.code)) {
        keysDown.delete(e.code);
        updateFromKeys();
      }
    };

    const handleWindowBlur = () => {
      keysDown.clear();
      updateFromKeys();
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [dispatchInput, onToggleCamera, onResetCar, onPause]);

  // Safe pointer capture helper
  const safeSetCapture = (el: HTMLElement, id: number) => {
    try {
      el.setPointerCapture(id);
    } catch {}
  };
  const safeReleaseCapture = (el: HTMLElement, id: number) => {
    try {
      el.releasePointerCapture(id);
    } catch {}
  };

  // Button Action Handlers
  const handleButtonDown = (action: 'left' | 'right' | 'gas' | 'brake' | 'handbrake', e: React.PointerEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    safeSetCapture(e.currentTarget, e.pointerId);
    activePointers.current.set(e.pointerId, action);

    if (action === 'gas') {
      currentInput.current.throttle = 1.0;
      setIsGasPressed(true);
    } else if (action === 'brake') {
      currentInput.current.brake = 1.0;
      setIsBrakePressed(true);
    } else if (action === 'left') {
      currentInput.current.steering = -1.0;
      setActiveSteerDir('left');
    } else if (action === 'right') {
      currentInput.current.steering = 1.0;
      setActiveSteerDir('right');
    } else if (action === 'handbrake') {
      currentInput.current.handbrake = true;
      setIsHandbrakePressed(true);
    }

    dispatchInput();
  };

  const handleButtonUp = (e: React.PointerEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    safeReleaseCapture(e.currentTarget, e.pointerId);

    const action = activePointers.current.get(e.pointerId);
    if (!action) return;
    activePointers.current.delete(e.pointerId);

    if (action === 'gas') {
      currentInput.current.throttle = 0;
      setIsGasPressed(false);
    } else if (action === 'brake') {
      currentInput.current.brake = 0;
      setIsBrakePressed(false);
    } else if (action === 'left') {
      if (currentInput.current.steering < 0) currentInput.current.steering = 0;
      setActiveSteerDir(null);
    } else if (action === 'right') {
      if (currentInput.current.steering > 0) currentInput.current.steering = 0;
      setActiveSteerDir(null);
    } else if (action === 'handbrake') {
      currentInput.current.handbrake = false;
      setIsHandbrakePressed(false);
    }

    dispatchInput();
  };

  // Virtual Steering Wheel Handlers
  const handleWheelDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!wheelRef.current) return;

    const rect = wheelRef.current.getBoundingClientRect();
    wheelCenter.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    wheelPointerId.current = e.pointerId;
    safeSetCapture(e.currentTarget, e.pointerId);
    handleWheelMove(e);
  };

  const handleWheelMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (wheelPointerId.current !== e.pointerId) return;
    e.preventDefault();

    const dx = e.clientX - wheelCenter.current.x;
    const dy = e.clientY - wheelCenter.current.y;

    // Angle calculation
    let angleDeg = Math.atan2(dx, -dy) * (180 / Math.PI);
    angleDeg = Math.max(-95, Math.min(95, angleDeg));

    setWheelRotationDeg(angleDeg);
    currentInput.current.steering = angleDeg / 90;
    dispatchInput();
  };

  const handleWheelUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (wheelPointerId.current === e.pointerId) {
      e.preventDefault();
      safeReleaseCapture(e.currentTarget, e.pointerId);
      wheelPointerId.current = null;
      setWheelRotationDeg(0);
      currentInput.current.steering = 0;
      dispatchInput();
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20">
      {/* Top Action Bar Buttons */}
      <div className="absolute top-4 right-4 flex items-center space-x-2.5 pointer-events-auto">
        {/* Rotate Screen Button */}
        <button
          onClick={onToggleRotateScreen}
          className={`w-12 h-12 rounded-2xl border flex items-center justify-center active:scale-95 transition-all shadow-xl backdrop-blur-none ${
            isScreenRotated
              ? 'bg-amber-500 border-amber-300 text-black shadow-amber-500/40'
              : 'bg-slate-900/85 border-white/20 text-amber-400 hover:bg-slate-800'
          }`}
          title="Rotate Screen (Landscape Mode)"
        >
          <RotateCw className="w-6 h-6" />
        </button>

        {/* Camera Toggle Button */}
        <button
          onClick={onToggleCamera}
          className="w-12 h-12 rounded-2xl bg-slate-900/85 border border-white/20 text-white flex items-center justify-center active:scale-95 transition-all shadow-xl hover:bg-slate-800 active:bg-cyan-600"
          title="Change Camera View (C)"
        >
          <Video className="w-6 h-6 text-cyan-400" />
        </button>

        {/* Car Reset / Recovery Button */}
        <button
          onClick={onResetCar}
          className="w-12 h-12 rounded-2xl bg-slate-900/85 border border-white/20 text-white flex items-center justify-center active:scale-95 transition-all shadow-xl hover:bg-slate-800 active:bg-amber-600"
          title="Recover Car to Road (R)"
        >
          <RotateCcw className="w-6 h-6 text-amber-400" />
        </button>

        {/* Pause Button */}
        <button
          onClick={onPause}
          className="w-12 h-12 rounded-2xl bg-slate-900/85 border border-white/20 text-white flex items-center justify-center active:scale-95 transition-all shadow-xl hover:bg-slate-800 active:bg-rose-600"
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
            onPointerDown={handleWheelDown}
            onPointerMove={handleWheelMove}
            onPointerUp={handleWheelUp}
            onPointerCancel={handleWheelUp}
            className="w-36 h-36 rounded-full bg-gradient-to-b from-slate-800/95 to-slate-950/95 border-4 border-slate-600/90 shadow-2xl flex items-center justify-center touch-none relative active:scale-[1.02] cursor-grab active:cursor-grabbing"
            style={{
              transform: `rotate(${wheelRotationDeg}deg)`,
              transition: wheelPointerId.current === null ? 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
            }}
          >
            {/* Wheel rim accent stripe */}
            <div className="absolute top-1 w-5 h-3.5 bg-rose-500 rounded-sm shadow-md" />
            <Disc className="w-16 h-16 text-slate-400 drop-shadow-md" />
            <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 h-4 bg-slate-700/80 rounded" />
          </div>
        ) : (
          /* Left / Right Steering Touch Buttons */
          <div className="flex space-x-3">
            <button
              onPointerDown={(e) => handleButtonDown('left', e)}
              onPointerUp={handleButtonUp}
              onPointerCancel={handleButtonUp}
              className={`w-20 h-20 rounded-3xl border-2 flex items-center justify-center font-black text-3xl transition-all shadow-2xl active:scale-95 touch-none ${
                activeSteerDir === 'left'
                  ? 'bg-cyan-500 border-cyan-300 text-white shadow-cyan-500/60 scale-95 ring-4 ring-cyan-400/40'
                  : 'bg-slate-900/90 border-white/20 text-slate-200 hover:border-white/40'
              }`}
            >
              ◀
            </button>

            <button
              onPointerDown={(e) => handleButtonDown('right', e)}
              onPointerUp={handleButtonUp}
              onPointerCancel={handleButtonUp}
              className={`w-20 h-20 rounded-3xl border-2 flex items-center justify-center font-black text-3xl transition-all shadow-2xl active:scale-95 touch-none ${
                activeSteerDir === 'right'
                  ? 'bg-cyan-500 border-cyan-300 text-white shadow-cyan-500/60 scale-95 ring-4 ring-cyan-400/40'
                  : 'bg-slate-900/90 border-white/20 text-slate-200 hover:border-white/40'
              }`}
            >
              ▶
            </button>
          </div>
        )}
      </div>

      {/* Bottom Right: Handbrake & Pedals */}
      <div className="absolute bottom-6 right-6 flex items-end space-x-3 pointer-events-auto">
        {/* Drift / Handbrake Lever */}
        <button
          onPointerDown={(e) => handleButtonDown('handbrake', e)}
          onPointerUp={handleButtonUp}
          onPointerCancel={handleButtonUp}
          className={`w-18 h-18 rounded-3xl border-2 flex flex-col items-center justify-center font-bold transition-all shadow-2xl active:scale-95 touch-none mb-1 ${
            isHandbrakePressed
              ? 'bg-amber-400 border-amber-200 text-black shadow-amber-400/60 scale-95 ring-4 ring-amber-400/40'
              : 'bg-slate-900/90 border-amber-500/40 text-amber-400 hover:border-amber-400'
          }`}
          title="Handbrake Drift (Space)"
        >
          <span className="text-base font-black tracking-tight">DRIFT</span>
          <span className="text-[10px] opacity-75 font-semibold">HANDBRAKE</span>
        </button>

        {/* Brake / Reverse Pedal */}
        <button
          onPointerDown={(e) => handleButtonDown('brake', e)}
          onPointerUp={handleButtonUp}
          onPointerCancel={handleButtonUp}
          className={`w-20 h-26 rounded-3xl border-2 flex flex-col items-center justify-center font-black transition-all shadow-2xl active:scale-95 touch-none ${
            isBrakePressed
              ? 'bg-rose-600 border-rose-300 text-white shadow-rose-600/60 scale-95 ring-4 ring-rose-500/40'
              : 'bg-slate-900/90 border-rose-500/40 text-rose-400 hover:border-rose-400'
          }`}
        >
          <span className="text-lg">BRAKE</span>
          <span className="text-[10px] text-slate-400 font-semibold mt-0.5">REVERSE</span>
        </button>

        {/* Throttle (Gas) Pedal */}
        <button
          onPointerDown={(e) => handleButtonDown('gas', e)}
          onPointerUp={handleButtonUp}
          onPointerCancel={handleButtonUp}
          className={`w-22 h-34 rounded-3xl border-2 flex flex-col items-center justify-center font-black transition-all shadow-2xl active:scale-95 touch-none ${
            isGasPressed
              ? 'bg-emerald-500 border-emerald-300 text-black shadow-emerald-500/70 scale-95 ring-4 ring-emerald-400/40'
              : 'bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-emerald-500/50 text-emerald-400 hover:border-emerald-400'
          }`}
        >
          <span className="text-2xl tracking-tight">GAS</span>
          <span className="text-[10px] text-emerald-300/80 font-bold uppercase tracking-widest mt-0.5">
            THROTTLE
          </span>
        </button>
      </div>
    </div>
  );
};
