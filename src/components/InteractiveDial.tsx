import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCw, ArrowUpRight, ShieldAlert, Sparkles, Sliders, ChevronLeft, ChevronRight } from 'lucide-react';

interface InteractiveDialProps {
  label: string;
  sublabel: string;
  value: number; // Current value
  min: number;
  max: number;
  step?: number;
  unit: string;
  secondaryDisplay?: string;
  colorScheme: 'cyan' | 'amber' | 'rose' | 'emerald';
  onChange: (newValue: number) => void;
  statusBadge?: string;
  statusType?: 'normal' | 'warning' | 'critical';
  ticks?: { value: number; label: string }[];
  icon?: React.ReactNode;
}

export const InteractiveDial: React.FC<InteractiveDialProps> = ({
  label,
  sublabel,
  value,
  min,
  max,
  step = 1,
  unit,
  secondaryDisplay,
  colorScheme,
  onChange,
  statusBadge,
  statusType = 'normal',
  ticks = [],
  icon,
}) => {
  const dialRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Normalization 0 to 1
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));

  // Dial angles: Start at -135deg (bottom-left) to +135deg (bottom-right)
  const START_ANGLE = -135;
  const END_ANGLE = 135;
  const currentAngle = START_ANGLE + normalized * (END_ANGLE - START_ANGLE);

  // Color mapping
  const colorMap = {
    cyan: {
      ring: '#00f0ff',
      glow: 'rgba(0, 240, 255, 0.45)',
      bg: 'bg-cyan-950/60',
      border: 'border-cyan-500/50',
      text: 'text-cyan-300',
      thumb: 'accent-cyan-400',
    },
    amber: {
      ring: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.45)',
      bg: 'bg-amber-950/60',
      border: 'border-amber-500/50',
      text: 'text-amber-300',
      thumb: 'accent-amber-400',
    },
    rose: {
      ring: '#f43f5e',
      glow: 'rgba(244, 63, 94, 0.5)',
      bg: 'bg-rose-950/60',
      border: 'border-rose-500/50',
      text: 'text-rose-300',
      thumb: 'accent-rose-500',
    },
    emerald: {
      ring: '#10b981',
      glow: 'rgba(16, 185, 129, 0.45)',
      bg: 'bg-emerald-950/60',
      border: 'border-emerald-500/50',
      text: 'text-emerald-300',
      thumb: 'accent-emerald-400',
    },
  };

  const scheme = colorMap[colorScheme] || colorMap.cyan;

  // Ultra-smooth angle calculation from pointer
  const updateFromPointer = useCallback((clientX: number, clientY: number) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    // Angle from 12 o'clock in degrees (-180 to +180)
    // 12 o'clock = 0°, 3 o'clock = +90°, 6 o'clock = ±180°, 9 o'clock = -90°
    const angleDeg = Math.atan2(dx, -dy) * (180 / Math.PI);

    let clampedAngle = angleDeg;
    // Dead zone handling at bottom between -180..-135 and +135..+180
    if (angleDeg > 135) {
      clampedAngle = END_ANGLE;
    } else if (angleDeg < -135) {
      clampedAngle = START_ANGLE;
    }

    const ratio = Math.max(0, Math.min(1, (clampedAngle - START_ANGLE) / (END_ANGLE - START_ANGLE)));
    const rawVal = min + ratio * (max - min);

    // Stepping with precision
    const stepped = Math.round(rawVal / step) * step;
    const decimalPlaces = step < 1 ? 1 : 0;
    const finalVal = Number(Math.max(min, Math.min(max, stepped)).toFixed(decimalPlaces));

    onChange(finalVal);
  }, [min, max, step, onChange]);

  // Pointer event listeners on window
  useEffect(() => {
    const handlePointerMove = (e: MouseEvent) => {
      if (isDragging) {
        updateFromPointer(e.clientX, e.clientY);
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      lastPosRef.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        e.preventDefault(); // Prevent page scroll during dial drag
        updateFromPointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      lastPosRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, updateFromPointer]);

  // Mouse Wheel incremental adjustment
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? step : -step;
    const rawVal = value + delta;
    const decimalPlaces = step < 1 ? 1 : 0;
    const finalVal = Number(Math.max(min, Math.min(max, rawVal)).toFixed(decimalPlaces));
    onChange(finalVal);
  };

  // Nudge helpers
  const handleNudge = (direction: 'up' | 'down') => {
    const delta = direction === 'up' ? step * 2 : -step * 2;
    const rawVal = value + delta;
    const decimalPlaces = step < 1 ? 1 : 0;
    const finalVal = Number(Math.max(min, Math.min(max, rawVal)).toFixed(decimalPlaces));
    onChange(finalVal);
  };

  // SVG Arc configuration
  const radius = 56;
  const strokeWidth = 8;
  const arcLength = 2 * Math.PI * radius * (270 / 360); // 270 deg active span
  const strokeDashoffset = arcLength * (1 - normalized);

  return (
    <div className="p-4 rounded-2xl bg-[#080e1b]/95 border border-cyan-900/60 shadow-xl flex flex-col justify-between select-none">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white tracking-wide">
            {icon}
            <span>{label}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
            {sublabel}
          </span>
        </div>

        {statusBadge && (
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap ${
              statusType === 'critical'
                ? 'bg-rose-950 text-rose-300 border border-rose-600/60 animate-pulse'
                : statusType === 'warning'
                ? 'bg-amber-950 text-amber-300 border border-amber-600/60'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-600/60'
            }`}
          >
            {statusBadge}
          </span>
        )}
      </div>

      {/* Interactive Dial Center */}
      <div
        className="relative flex flex-col items-center justify-center my-1"
        onWheel={handleWheel}
      >
        <div
          ref={dialRef}
          onMouseDown={(e) => {
            setIsDragging(true);
            updateFromPointer(e.clientX, e.clientY);
          }}
          onTouchStart={(e) => {
            if (e.touches.length > 0) {
              setIsDragging(true);
              updateFromPointer(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          className={`relative w-36 h-36 rounded-full flex items-center justify-center cursor-pointer transition-transform ${
            isDragging ? 'scale-105' : 'hover:scale-102'
          }`}
          style={{ touchAction: 'none' }}
        >
          {/* SVG Gauge Track and Active Glow Arc */}
          <svg className="w-full h-full -rotate-[135deg]" viewBox="0 0 140 140">
            {/* Background Inactive Arc */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#131e33"
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} 999`}
              strokeLinecap="round"
            />
            {/* Active Colored Arc */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={scheme.ring}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} 999`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 6px ${scheme.glow})`,
                transition: isDragging ? 'none' : 'stroke-dashoffset 0.08s ease-out',
              }}
            />
          </svg>

          {/* Inner Physical Rotary Knob */}
          <div
            className="absolute w-22 h-22 rounded-full bg-gradient-to-b from-[#192842] via-[#0d1627] to-[#060c16] border border-cyan-800/80 shadow-2xl flex flex-col items-center justify-center pointer-events-none"
            style={{
              boxShadow: `0 4px 16px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.12), 0 0 12px ${scheme.glow}`,
            }}
          >
            {/* Rotating Pointer Notch */}
            <div
              className="absolute w-full h-full rounded-full"
              style={{
                transform: `rotate(${currentAngle}deg)`,
                transition: isDragging ? 'none' : 'transform 0.08s ease-out',
              }}
            >
              <div
                className="w-1.5 h-4.5 mx-auto rounded-full mt-1 shadow-md"
                style={{ backgroundColor: scheme.ring, boxShadow: `0 0 6px ${scheme.ring}` }}
              />
            </div>

            {/* Central Value Readout */}
            <div className="z-10 text-center px-1">
              <span className="font-mono font-extrabold text-lg text-white tabular-nums tracking-tight block leading-none">
                {value}
              </span>
              <span className="text-[10px] font-mono text-cyan-300 font-bold block mt-0.5">
                {unit}
              </span>
            </div>
          </div>
        </div>

        {/* Secondary Readout Pill */}
        {secondaryDisplay && (
          <div className="text-[10px] font-mono text-slate-300 font-medium mt-1 bg-slate-950/80 px-2.5 py-0.5 rounded border border-slate-800 text-center">
            {secondaryDisplay}
          </div>
        )}

        {/* Precision Smooth Slider Bar directly under Knob */}
        <div className="w-full mt-2 flex items-center gap-2 px-2">
          <button
            onClick={() => handleNudge('down')}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Nudge Down"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className={`w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer ${scheme.thumb} transition-all`}
          />

          <button
            onClick={() => handleNudge('up')}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Nudge Up"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preset Snapping Quick Buttons */}
      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-1 text-[10px] font-mono">
        <span className="text-slate-500">PRESETS:</span>
        <div className="flex items-center gap-1 flex-wrap justify-end">
          {ticks.map((t, idx) => (
            <button
              key={idx}
              onClick={() => onChange(t.value)}
              className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                Math.abs(value - t.value) < (step || 1)
                  ? 'bg-cyan-900/80 border-cyan-400 text-cyan-200 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
