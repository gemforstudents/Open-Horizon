/**
 * HORIZON: OPEN ROADS - Touch Controls Overlay
 * Highly robust multi-touch mobile driving controls.
 * Guarantees zero cross-cancellation: Holding Gas while tapping Steering
 * will NEVER cut power or drop speed. True multi-finger simultaneous control.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PlayerInput, ControlType } from '../types/game';
import { RotateCcw, Video, Pause, Disc, Maximize, Minimize, Smartphone } from 'lucide-react';

interface TouchControlsProps {
  controlType: ControlType;
  isFullscreen?: boolean;
  isPortrait?: boolean;
  onInputChange: (input: PlayerInput) => void;
  onResetCar: () => void;
  onToggleCamera: () => void;
  onPause: () => void;
  onToggleFullscreen?: () => void;
}

type ControlAction = 'left' | 'right' | 'gas' | 'brake' | 'handbrake';

export const TouchControls: React.FC<TouchControlsProps> = ({
  controlType,
  isFullscreen,
  isPortrait = false,
  onInputChange,
  onResetCar,
  onToggleCamera,
  onPause,
  onToggleFullscreen,
}) => {
  // Stable mutable input state
  const currentInput = useRef<PlayerInput>({
    throttle: 0,
    brake: 0,
    steering: 0,
    handbrake: false,
    reverse: false,
  });

  // Independent pressed states (tracked per pointer to completely isolate buttons)
  const gasPointers = useRef<Set<number>>(new Set());
  const brakePointers = useRef<Set<number>>(new Set());
  const handbrakePointers = useRef<Set<number>>(new Set());
  const leftPointers = useRef<Set<number>>(new Set());
  const rightPointers = useRef<Set<number>>(new Set());

  // Visual states
  const [activeSteerDir, setActiveSteerDir] = useState<'left' | 'right' | null>(null);
  const [isGasPressed, setIsGasPressed] = useState(false);
  const [isBrakePressed, setIsBrakePressed] = useState(false);
  const [isHandbrakePressed, setIsHandbrakePressed] = useState(false);
  const [wheelRotationDeg, setWheelRotationDeg] = useState(0);

  // Wheel tracking refs
  const wheelRef = useRef<HTMLDivElement>(null);
  const wheelPointerId = useRef<number | null>(null);
  const wheelCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Stable input dispatcher
  const dispatchInput = useCallback(() => {
    onInputChange({ ...currentInput.current });
  }, [onInputChange]);

  const updateSteering = useCallback(() => {
    const isLeft = leftPointers.current.size > 0;
    const isRight = rightPointers.current.size > 0;
    if (isLeft && isRight) {
      currentInput.current.steering = 0;
      setActiveSteerDir(null);
    } else if (isLeft) {
      currentInput.current.steering = -1.0;
      setActiveSteerDir('left');
    } else if (isRight) {
      currentInput.current.steering = 1.0;
      setActiveSteerDir('right');
    } else {
      currentInput.current.steering = 0;
      setActiveSteerDir(null);
    }
    dispatchInput();
  }, [dispatchInput]);

  // Global window pointer release (only releases the specific pointer that lifted)
  useEffect(() => {
    const handleGlobalPointerUp = (e: PointerEvent) => {
      // Check wheel
      if (wheelPointerId.current === e.pointerId) {
        wheelPointerId.current = null;
        setWheelRotationDeg(0);
        currentInput.current.steering = 0;
        dispatchInput();
      }

      // Check gas
      if (gasPointers.current.has(e.pointerId)) {
        gasPointers.current.delete(e.pointerId);
        if (gasPointers.current.size === 0) {
          currentInput.current.throttle = 0;
          setIsGasPressed(false);
          dispatchInput();
        }
      }

      // Check brake
      if (brakePointers.current.has(e.pointerId)) {
        brakePointers.current.delete(e.pointerId);
        if (brakePointers.current.size === 0) {
          currentInput.current.brake = 0;
          setIsBrakePressed(false);
          dispatchInput();
        }
      }

      // Check handbrake
      if (handbrakePointers.current.has(e.pointerId)) {
        handbrakePointers.current.delete(e.pointerId);
        if (handbrakePointers.current.size === 0) {
          currentInput.current.handbrake = false;
          setIsHandbrakePressed(false);
          dispatchInput();
        }
      }

      // Check left / right
      if (leftPointers.current.has(e.pointerId)) {
        leftPointers.current.delete(e.pointerId);
        updateSteering();
      }
      if (rightPointers.current.has(e.pointerId)) {
        rightPointers.current.delete(e.pointerId);
        updateSteering();
      }
    };

    const handleWindowBlur = () => {
      // Window genuinely lost focus (tab switched)
      gasPointers.current.clear();
      brakePointers.current.clear();
      handbrakePointers.current.clear();
      leftPointers.current.clear();
      rightPointers.current.clear();
      wheelPointerId.current = null;
      setWheelRotationDeg(0);
      currentInput.current.throttle = 0;
      currentInput.current.brake = 0;
      currentInput.current.steering = 0;
      currentInput.current.handbrake = false;
      setIsGasPressed(false);
      setIsBrakePressed(false);
      setIsHandbrakePressed(false);
      setActiveSteerDir(null);
      dispatchInput();
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [dispatchInput, updateSteering]);

  // Keyboard controls for desktop testing
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

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [dispatchInput, onToggleCamera, onResetCar, onPause]);

  // Specific Action Handlers - Strictly isolated
  const handleGasDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    gasPointers.current.add(e.pointerId);
    currentInput.current.throttle = 1.0;
    setIsGasPressed(true);
    dispatchInput();
  };

  const handleGasUp = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    gasPointers.current.delete(e.pointerId);
    if (gasPointers.current.size === 0) {
      currentInput.current.throttle = 0;
      setIsGasPressed(false);
      dispatchInput();
    }
  };

  const handleBrakeDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    brakePointers.current.add(e.pointerId);
    currentInput.current.brake = 1.0;
    setIsBrakePressed(true);
    dispatchInput();
  };

  const handleBrakeUp = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    brakePointers.current.delete(e.pointerId);
    if (brakePointers.current.size === 0) {
      currentInput.current.brake = 0;
      setIsBrakePressed(false);
      dispatchInput();
    }
  };

  const handleHandbrakeDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    handbrakePointers.current.add(e.pointerId);
    currentInput.current.handbrake = true;
    setIsHandbrakePressed(true);
    dispatchInput();
  };

  const handleHandbrakeUp = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    handbrakePointers.current.delete(e.pointerId);
    if (handbrakePointers.current.size === 0) {
      currentInput.current.handbrake = false;
      setIsHandbrakePressed(false);
      dispatchInput();
    }
  };

  const handleLeftDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    leftPointers.current.add(e.pointerId);
    updateSteering();
  };

  const handleLeftUp = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    leftPointers.current.delete(e.pointerId);
    updateSteering();
  };

  const handleRightDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    rightPointers.current.add(e.pointerId);
    updateSteering();
  };

  const handleRightUp = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    rightPointers.current.delete(e.pointerId);
    updateSteering();
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
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    handleWheelMove(e);
  };

  const handleWheelMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (wheelPointerId.current !== e.pointerId) return;
    e.preventDefault();

    const dx = e.clientX - wheelCenter.current.x;
    const dy = e.clientY - wheelCenter.current.y;

    let angleDeg = Math.atan2(dx, -dy) * (180 / Math.PI);
    angleDeg = Math.max(-95, Math.min(95, angleDeg));

    setWheelRotationDeg(angleDeg);
    currentInput.current.steering = angleDeg / 90;
    dispatchInput();
  };

  const handleWheelUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (wheelPointerId.current === e.pointerId) {
      e.preventDefault();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      wheelPointerId.current = null;
      setWheelRotationDeg(0);
      currentInput.current.steering = 0;
      dispatchInput();
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20 touch-none">
      {/* Top Action Bar Buttons */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center space-x-2 pointer-events-auto">
        {/* Fullscreen / Rotate Screen Toggle */}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border flex items-center justify-center active:scale-95 transition-all shadow-xl ${
              isFullscreen
                ? 'bg-amber-500 border-amber-300 text-black shadow-amber-500/40'
                : 'bg-slate-900/90 border-white/20 text-amber-400 hover:bg-slate-800'
            }`}
            title="Fullscreen / Rotate (F)"
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5" />
            ) : isPortrait ? (
              <Smartphone className="w-5 h-5 rotate-90 text-amber-400 animate-pulse" />
            ) : (
              <Maximize className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Camera Toggle Button */}
        <button
          onClick={onToggleCamera}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-900/90 border border-white/20 text-white flex items-center justify-center active:scale-95 transition-all shadow-xl hover:bg-slate-800"
          title="Change Camera View (C)"
        >
          <Video className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
        </button>

        {/* Car Reset / Recovery Button */}
        <button
          onClick={onResetCar}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-900/90 border border-white/20 text-white flex items-center justify-center active:scale-95 transition-all shadow-xl hover:bg-slate-800"
          title="Recover Car to Road (R)"
        >
          <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
        </button>

        {/* Pause Button */}
        <button
          onClick={onPause}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-900/90 border border-white/20 text-white flex items-center justify-center active:scale-95 transition-all shadow-xl hover:bg-slate-800"
          title="Pause Game (Esc)"
        >
          <Pause className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </button>
      </div>

      {/* Bottom Left: Steering Controls */}
      <div
        className={`absolute pointer-events-auto ${
          isPortrait ? 'bottom-4 left-3' : 'bottom-6 left-6'
        }`}
      >
        {controlType === 'wheel' ? (
          /* Virtual Analog Steering Wheel */
          <div
            ref={wheelRef}
            onPointerDown={handleWheelDown}
            onPointerMove={handleWheelMove}
            onPointerUp={handleWheelUp}
            onPointerCancel={handleWheelUp}
            className={`rounded-full bg-gradient-to-b from-slate-800/95 to-slate-950/95 border-4 border-slate-600/90 shadow-2xl flex items-center justify-center touch-none relative active:scale-[1.02] cursor-grab ${
              isPortrait ? 'w-28 h-28' : 'w-36 h-36'
            }`}
            style={{
              transform: `rotate(${wheelRotationDeg}deg)`,
              transition:
                wheelPointerId.current === null
                  ? 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
                  : 'none',
            }}
          >
            <div className="absolute top-1 w-4 h-3 bg-rose-500 rounded-sm shadow-md" />
            <Disc className={`text-slate-400 drop-shadow-md ${isPortrait ? 'w-12 h-12' : 'w-16 h-16'}`} />
            <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-3.5 bg-slate-700/80 rounded" />
          </div>
        ) : (
          /* Left / Right Steering Touch Buttons */
          <div className={`flex ${isPortrait ? 'space-x-2' : 'space-x-3'}`}>
            <button
              onPointerDown={handleLeftDown}
              onPointerUp={handleLeftUp}
              onPointerCancel={handleLeftUp}
              className={`rounded-2xl sm:rounded-3xl border-2 flex items-center justify-center font-black select-none transition-all shadow-2xl active:scale-95 touch-none ${
                isPortrait ? 'w-16 h-16 text-2xl' : 'w-20 h-20 text-3xl'
              } ${
                activeSteerDir === 'left'
                  ? 'bg-cyan-500 border-cyan-300 text-white shadow-cyan-500/60 scale-95 ring-4 ring-cyan-400/40'
                  : 'bg-slate-900/90 border-white/20 text-slate-200 hover:border-white/40'
              }`}
            >
              ◀
            </button>

            <button
              onPointerDown={handleRightDown}
              onPointerUp={handleRightUp}
              onPointerCancel={handleRightUp}
              className={`rounded-2xl sm:rounded-3xl border-2 flex items-center justify-center font-black select-none transition-all shadow-2xl active:scale-95 touch-none ${
                isPortrait ? 'w-16 h-16 text-2xl' : 'w-20 h-20 text-3xl'
              } ${
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
      <div
        className={`absolute pointer-events-auto flex items-end ${
          isPortrait ? 'bottom-4 right-3 space-x-2' : 'bottom-6 right-6 space-x-3'
        }`}
      >
        {/* Drift / Handbrake Button */}
        <button
          onPointerDown={handleHandbrakeDown}
          onPointerUp={handleHandbrakeUp}
          onPointerCancel={handleHandbrakeUp}
          className={`rounded-2xl sm:rounded-3xl border-2 flex flex-col items-center justify-center font-bold select-none transition-all shadow-2xl active:scale-95 touch-none ${
            isPortrait ? 'w-13 h-14 mb-0.5' : 'w-18 h-18 mb-1'
          } ${
            isHandbrakePressed
              ? 'bg-amber-400 border-amber-200 text-black shadow-amber-400/60 scale-95 ring-4 ring-amber-400/40'
              : 'bg-slate-900/90 border-amber-500/40 text-amber-400 hover:border-amber-400'
          }`}
          title="Handbrake Drift (Space)"
        >
          <span className={`font-black tracking-tight ${isPortrait ? 'text-xs' : 'text-base'}`}>
            DRIFT
          </span>
          {!isPortrait && <span className="text-[10px] opacity-75 font-semibold">HANDBRAKE</span>}
        </button>

        {/* Brake / Reverse Pedal */}
        <button
          onPointerDown={handleBrakeDown}
          onPointerUp={handleBrakeUp}
          onPointerCancel={handleBrakeUp}
          className={`rounded-2xl sm:rounded-3xl border-2 flex flex-col items-center justify-center font-black select-none transition-all shadow-2xl active:scale-95 touch-none ${
            isPortrait ? 'w-14 h-20' : 'w-20 h-26'
          } ${
            isBrakePressed
              ? 'bg-rose-600 border-rose-300 text-white shadow-rose-600/60 scale-95 ring-4 ring-rose-500/40'
              : 'bg-slate-900/90 border-rose-500/40 text-rose-400 hover:border-rose-400'
          }`}
        >
          <span className={isPortrait ? 'text-sm' : 'text-lg'}>BRAKE</span>
          <span className={`text-slate-400 font-semibold ${isPortrait ? 'text-[8px]' : 'text-[10px] mt-0.5'}`}>
            REV
          </span>
        </button>

        {/* Throttle (Gas) Pedal */}
        <button
          onPointerDown={handleGasDown}
          onPointerUp={handleGasUp}
          onPointerCancel={handleGasUp}
          className={`rounded-2xl sm:rounded-3xl border-2 flex flex-col items-center justify-center font-black select-none transition-all shadow-2xl active:scale-95 touch-none ${
            isPortrait ? 'w-16 h-24' : 'w-22 h-34'
          } ${
            isGasPressed
              ? 'bg-emerald-500 border-emerald-300 text-black shadow-emerald-500/70 scale-95 ring-4 ring-emerald-400/40'
              : 'bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-emerald-500/50 text-emerald-400 hover:border-emerald-400'
          }`}
        >
          <span className={`tracking-tight ${isPortrait ? 'text-xl' : 'text-2xl'}`}>GAS</span>
          <span
            className={`text-emerald-300/80 font-bold uppercase tracking-widest ${
              isPortrait ? 'text-[8px]' : 'text-[10px] mt-0.5'
            }`}
          >
            GO
          </span>
        </button>
      </div>
    </div>
  );
};
