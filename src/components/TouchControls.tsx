/**
 * HORIZON: OPEN ROADS - Touch Controls Overlay
 * Enterprise-grade multi-touch mobile driving controls.
 * Guarantees zero cross-cancellation: Holding Gas while tapping Steering
 * will NEVER cut power or drop speed. True multi-finger simultaneous control.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PlayerInput, ControlType } from '../types/game';
import { RotateCcw, Video, Pause, Disc, Maximize, Minimize, Smartphone, Download } from 'lucide-react';

interface TouchControlsProps {
  controlType: ControlType;
  isFullscreen?: boolean;
  isPortrait?: boolean;
  onInputChange: (input: PlayerInput) => void;
  onResetCar: () => void;
  onToggleCamera: () => void;
  onPause: () => void;
  onToggleFullscreen?: () => void;
  onOpenDownload?: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  controlType,
  isFullscreen,
  isPortrait = false,
  onInputChange,
  onResetCar,
  onToggleCamera,
  onPause,
  onToggleFullscreen,
  onOpenDownload,
}) => {
  // Stable mutable input state
  const currentInput = useRef<PlayerInput>({
    throttle: 0,
    brake: 0,
    steering: 0,
    handbrake: false,
    reverse: false,
  });

  // Independent active touch/pointer IDs for each control
  const gasPointers = useRef<Set<string | number>>(new Set());
  const brakePointers = useRef<Set<string | number>>(new Set());
  const handbrakePointers = useRef<Set<string | number>>(new Set());
  const leftPointers = useRef<Set<string | number>>(new Set());
  const rightPointers = useRef<Set<string | number>>(new Set());

  // Visual states for button presses
  const [activeSteerDir, setActiveSteerDir] = useState<'left' | 'right' | null>(null);
  const [isGasPressed, setIsGasPressed] = useState(false);
  const [isBrakePressed, setIsBrakePressed] = useState(false);
  const [isHandbrakePressed, setIsHandbrakePressed] = useState(false);
  const [wheelRotationDeg, setWheelRotationDeg] = useState(0);

  // Wheel tracking refs
  const wheelRef = useRef<HTMLDivElement>(null);
  const wheelPointerId = useRef<string | number | null>(null);
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

  // Global safety release: Only releases when pointers genuinely lift from the screen
  useEffect(() => {
    const handleGlobalPointerUp = (e: PointerEvent) => {
      const id = e.pointerId;

      if (wheelPointerId.current === id) {
        wheelPointerId.current = null;
        setWheelRotationDeg(0);
        currentInput.current.steering = 0;
        dispatchInput();
      }

      if (gasPointers.current.has(id)) {
        gasPointers.current.delete(id);
        if (gasPointers.current.size === 0) {
          currentInput.current.throttle = 0;
          setIsGasPressed(false);
          dispatchInput();
        }
      }

      if (brakePointers.current.has(id)) {
        brakePointers.current.delete(id);
        if (brakePointers.current.size === 0) {
          currentInput.current.brake = 0;
          setIsBrakePressed(false);
          dispatchInput();
        }
      }

      if (handbrakePointers.current.has(id)) {
        handbrakePointers.current.delete(id);
        if (handbrakePointers.current.size === 0) {
          currentInput.current.handbrake = false;
          setIsHandbrakePressed(false);
          dispatchInput();
        }
      }

      let steerChanged = false;
      if (leftPointers.current.has(id)) {
        leftPointers.current.delete(id);
        steerChanged = true;
      }
      if (rightPointers.current.has(id)) {
        rightPointers.current.delete(id);
        steerChanged = true;
      }
      if (steerChanged) {
        updateSteering();
      }
    };

    const handleWindowBlur = () => {
      // Tab lost focus
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

    window.addEventListener('pointerup', handleGlobalPointerUp, { passive: true });
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [dispatchInput, updateSteering]);

  // Keyboard controls for desktop convenience
  useEffect(() => {
    const keysDown = new Set<string>();

    const updateFromKeys = () => {
      const up = keysDown.has('ArrowUp') || keysDown.has('KeyW');
      const down = keysDown.has('ArrowDown') || keysDown.has('KeyS');
      const left = keysDown.has('ArrowLeft') || keysDown.has('KeyA');
      const right = keysDown.has('ArrowRight') || keysDown.has('KeyD');
      const space = keysDown.has('Space');

      // Only override if no touch input is currently overriding it
      if (gasPointers.current.size === 0) {
        currentInput.current.throttle = up ? 1.0 : 0;
        setIsGasPressed(up);
      }
      if (brakePointers.current.size === 0) {
        currentInput.current.brake = down ? 1.0 : 0;
        setIsBrakePressed(down);
      }
      if (leftPointers.current.size === 0 && rightPointers.current.size === 0) {
        currentInput.current.steering = left ? -1.0 : right ? 1.0 : 0;
        setActiveSteerDir(left ? 'left' : right ? 'right' : null);
      }
      if (handbrakePointers.current.size === 0) {
        currentInput.current.handbrake = space;
        setIsHandbrakePressed(space);
      }

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

  // Dedicated Gas Handlers (Pointer + Touch)
  const handleGasStart = (id: string | number) => {
    gasPointers.current.add(id);
    currentInput.current.throttle = 1.0;
    setIsGasPressed(true);
    dispatchInput();
  };

  const handleGasEnd = (id: string | number) => {
    gasPointers.current.delete(id);
    if (gasPointers.current.size === 0) {
      currentInput.current.throttle = 0;
      setIsGasPressed(false);
      dispatchInput();
    }
  };

  // Dedicated Brake Handlers (Pointer + Touch)
  const handleBrakeStart = (id: string | number) => {
    brakePointers.current.add(id);
    currentInput.current.brake = 1.0;
    setIsBrakePressed(true);
    dispatchInput();
  };

  const handleBrakeEnd = (id: string | number) => {
    brakePointers.current.delete(id);
    if (brakePointers.current.size === 0) {
      currentInput.current.brake = 0;
      setIsBrakePressed(false);
      dispatchInput();
    }
  };

  // Dedicated Handbrake Handlers
  const handleHandbrakeStart = (id: string | number) => {
    handbrakePointers.current.add(id);
    currentInput.current.handbrake = true;
    setIsHandbrakePressed(true);
    dispatchInput();
  };

  const handleHandbrakeEnd = (id: string | number) => {
    handbrakePointers.current.delete(id);
    if (handbrakePointers.current.size === 0) {
      currentInput.current.handbrake = false;
      setIsHandbrakePressed(false);
      dispatchInput();
    }
  };

  // Dedicated Steering Handlers
  const handleLeftStart = (id: string | number) => {
    leftPointers.current.add(id);
    updateSteering();
  };

  const handleLeftEnd = (id: string | number) => {
    leftPointers.current.delete(id);
    updateSteering();
  };

  const handleRightStart = (id: string | number) => {
    rightPointers.current.add(id);
    updateSteering();
  };

  const handleRightEnd = (id: string | number) => {
    rightPointers.current.delete(id);
    updateSteering();
  };

  // Virtual Steering Wheel Handlers
  const handleWheelStart = (clientX: number, clientY: number, id: string | number) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    wheelCenter.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    wheelPointerId.current = id;
    handleWheelMoveAt(clientX, clientY);
  };

  const handleWheelMoveAt = (clientX: number, clientY: number) => {
    const dx = clientX - wheelCenter.current.x;
    const dy = clientY - wheelCenter.current.y;
    let angleDeg = Math.atan2(dx, -dy) * (180 / Math.PI);
    angleDeg = Math.max(-95, Math.min(95, angleDeg));

    setWheelRotationDeg(angleDeg);
    currentInput.current.steering = angleDeg / 90;
    dispatchInput();
  };

  const handleWheelEnd = (id: string | number) => {
    if (wheelPointerId.current === id) {
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
        {/* Download / Install App Button */}
        {onOpenDownload && (
          <button
            onClick={onOpenDownload}
            className="px-3 h-11 sm:h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 border border-emerald-400/50 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-lg active:scale-95 transition-all"
            title="Download App to Mobile"
          >
            <Download className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">GET APP</span>
          </button>
        )}

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
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleWheelStart(e.clientX, e.clientY, e.pointerId);
            }}
            onPointerMove={(e) => {
              if (wheelPointerId.current === e.pointerId) {
                e.preventDefault();
                handleWheelMoveAt(e.clientX, e.clientY);
              }
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              handleWheelEnd(e.pointerId);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const touch = e.changedTouches[0];
              if (touch) handleWheelStart(touch.clientX, touch.clientY, touch.identifier);
            }}
            onTouchMove={(e) => {
              for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (wheelPointerId.current === touch.identifier) {
                  e.preventDefault();
                  handleWheelMoveAt(touch.clientX, touch.clientY);
                }
              }
            }}
            onTouchEnd={(e) => {
              for (let i = 0; i < e.changedTouches.length; i++) {
                handleWheelEnd(e.changedTouches[i].identifier);
              }
            }}
            className={`rounded-full bg-gradient-to-b from-slate-800/95 to-slate-950/95 border-4 border-slate-600/90 shadow-2xl flex items-center justify-center touch-none relative active:scale-[1.02] cursor-grab ${
              isPortrait ? 'w-28 h-28' : 'w-36 h-36'
            }`}
            style={{
              transform: `rotate(${wheelRotationDeg}deg)`,
              transition:
                wheelPointerId.current === null
                  ? 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
                  : 'none',
              touchAction: 'none',
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
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLeftStart(e.pointerId);
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLeftEnd(e.pointerId);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                for (let i = 0; i < e.changedTouches.length; i++) {
                  handleLeftStart(e.changedTouches[i].identifier);
                }
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                for (let i = 0; i < e.changedTouches.length; i++) {
                  handleLeftEnd(e.changedTouches[i].identifier);
                }
              }}
              onTouchCancel={(e) => {
                for (let i = 0; i < e.changedTouches.length; i++) {
                  handleLeftEnd(e.changedTouches[i].identifier);
                }
              }}
              className={`rounded-2xl sm:rounded-3xl border-2 flex items-center justify-center font-black select-none transition-all shadow-2xl active:scale-95 touch-none ${
                isPortrait ? 'w-16 h-16 text-2xl' : 'w-20 h-20 text-3xl'
              } ${
                activeSteerDir === 'left'
                  ? 'bg-cyan-500 border-cyan-300 text-white shadow-cyan-500/60 scale-95 ring-4 ring-cyan-400/40'
                  : 'bg-slate-900/90 border-white/20 text-slate-200 hover:border-white/40'
              }`}
              style={{ touchAction: 'none', userSelect: 'none' }}
            >
              ◀
            </button>

            <button
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRightStart(e.pointerId);
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRightEnd(e.pointerId);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                for (let i = 0; i < e.changedTouches.length; i++) {
                  handleRightStart(e.changedTouches[i].identifier);
                }
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                for (let i = 0; i < e.changedTouches.length; i++) {
                  handleRightEnd(e.changedTouches[i].identifier);
                }
              }}
              onTouchCancel={(e) => {
                for (let i = 0; i < e.changedTouches.length; i++) {
                  handleRightEnd(e.changedTouches[i].identifier);
                }
              }}
              className={`rounded-2xl sm:rounded-3xl border-2 flex items-center justify-center font-black select-none transition-all shadow-2xl active:scale-95 touch-none ${
                isPortrait ? 'w-16 h-16 text-2xl' : 'w-20 h-20 text-3xl'
              } ${
                activeSteerDir === 'right'
                  ? 'bg-cyan-500 border-cyan-300 text-white shadow-cyan-500/60 scale-95 ring-4 ring-cyan-400/40'
                  : 'bg-slate-900/90 border-white/20 text-slate-200 hover:border-white/40'
              }`}
              style={{ touchAction: 'none', userSelect: 'none' }}
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
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleHandbrakeStart(e.pointerId);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleHandbrakeEnd(e.pointerId);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            for (let i = 0; i < e.changedTouches.length; i++) {
              handleHandbrakeStart(e.changedTouches[i].identifier);
            }
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
              handleHandbrakeEnd(e.changedTouches[i].identifier);
            }
          }}
          onTouchCancel={(e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
              handleHandbrakeEnd(e.changedTouches[i].identifier);
            }
          }}
          className={`rounded-2xl sm:rounded-3xl border-2 flex flex-col items-center justify-center font-bold select-none transition-all shadow-2xl active:scale-95 touch-none ${
            isPortrait ? 'w-13 h-14 mb-0.5' : 'w-18 h-18 mb-1'
          } ${
            isHandbrakePressed
              ? 'bg-amber-400 border-amber-200 text-black shadow-amber-400/60 scale-95 ring-4 ring-amber-400/40'
              : 'bg-slate-900/90 border-amber-500/40 text-amber-400 hover:border-amber-400'
          }`}
          style={{ touchAction: 'none', userSelect: 'none' }}
          title="Handbrake Drift (Space)"
        >
          <span className={`font-black tracking-tight ${isPortrait ? 'text-xs' : 'text-base'}`}>
            DRIFT
          </span>
          {!isPortrait && <span className="text-[10px] opacity-75 font-semibold">HANDBRAKE</span>}
        </button>

        {/* Brake / Reverse Pedal */}
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleBrakeStart(e.pointerId);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleBrakeEnd(e.pointerId);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            for (let i = 0; i < e.changedTouches.length; i++) {
              handleBrakeStart(e.changedTouches[i].identifier);
            }
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
              handleBrakeEnd(e.changedTouches[i].identifier);
            }
          }}
          onTouchCancel={(e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
              handleBrakeEnd(e.changedTouches[i].identifier);
            }
          }}
          className={`rounded-2xl sm:rounded-3xl border-2 flex flex-col items-center justify-center font-black select-none transition-all shadow-2xl active:scale-95 touch-none ${
            isPortrait ? 'w-14 h-20' : 'w-20 h-26'
          } ${
            isBrakePressed
              ? 'bg-rose-600 border-rose-300 text-white shadow-rose-600/60 scale-95 ring-4 ring-rose-500/40'
              : 'bg-slate-900/90 border-rose-500/40 text-rose-400 hover:border-rose-400'
          }`}
          style={{ touchAction: 'none', userSelect: 'none' }}
        >
          <span className={isPortrait ? 'text-sm' : 'text-lg'}>BRAKE</span>
          <span className={`text-slate-400 font-semibold ${isPortrait ? 'text-[8px]' : 'text-[10px] mt-0.5'}`}>
            REV
          </span>
        </button>

        {/* Throttle (Gas) Pedal - Completely Isolated Multi-Touch */}
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleGasStart(e.pointerId);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleGasEnd(e.pointerId);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            for (let i = 0; i < e.changedTouches.length; i++) {
              handleGasStart(e.changedTouches[i].identifier);
            }
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
              handleGasEnd(e.changedTouches[i].identifier);
            }
          }}
          onTouchCancel={(e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
              handleGasEnd(e.changedTouches[i].identifier);
            }
          }}
          className={`rounded-2xl sm:rounded-3xl border-2 flex flex-col items-center justify-center font-black select-none transition-all shadow-2xl active:scale-95 touch-none ${
            isPortrait ? 'w-16 h-24' : 'w-22 h-34'
          } ${
            isGasPressed
              ? 'bg-emerald-500 border-emerald-300 text-black shadow-emerald-500/70 scale-95 ring-4 ring-emerald-400/40'
              : 'bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-emerald-500/50 text-emerald-400 hover:border-emerald-400'
          }`}
          style={{ touchAction: 'none', userSelect: 'none' }}
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
