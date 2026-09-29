import React from 'react';
import { 
  X, Sliders, CloudRain, Droplets, AlertTriangle, Radio, 
  RotateCcw, Sparkles, Volume2, VolumeX, ShieldCheck, Check 
} from 'lucide-react';
import { SimulationState, RainfallLevel, PhysicalDrainageCondition, HardwareSensorState } from '../types';
import { playBuzzerBeep } from '../utils/audio';

interface SimulationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  simulation: SimulationState;
  onUpdateSimulation: (updates: Partial<SimulationState>) => void;
  onReset: () => void;
  onOpenGuidedDemo: () => void;
}

export const SimulationDrawer: React.FC<SimulationDrawerProps> = ({
  isOpen,
  onClose,
  simulation,
  onUpdateSimulation,
  onReset,
  onOpenGuidedDemo,
}) => {
  if (!isOpen) return null;

  const handleWaterLevelChange = (val: number) => {
    let condition: PhysicalDrainageCondition = simulation.drainageCondition;
    if (val >= 80) condition = 'POSSIBLE_BLOCKAGE';
    else if (val >= 50) condition = 'POTENTIALLY_RESTRICTED';
    else condition = 'NORMAL';

    onUpdateSimulation({
      waterLevel: val,
      drainageCondition: condition,
      activePresetName: null,
    });
  };

  const applyPreset = (
    name: string,
    water: number,
    rain: RainfallLevel,
    drainage: PhysicalDrainageCondition,
    sensor: HardwareSensorState
  ) => {
    onUpdateSimulation({
      waterLevel: water,
      rainfall: rain,
      drainageCondition: drainage,
      sensorStatus: sensor,
      activePresetName: name,
    });
    if (water >= 85) {
      playBuzzerBeep(350, 2400);
    }
  };

  const isCritical = simulation.waterLevel >= 80 || simulation.drainageCondition === 'POSSIBLE_BLOCKAGE';
  const isWarning = !isCritical && (simulation.waterLevel >= 50 || simulation.drainageCondition === 'POTENTIALLY_RESTRICTED');

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#090e1a] border-l border-cyan-500/30 shadow-2xl flex flex-col h-full text-slate-100 overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-cyan-950/60 bg-[#060a14] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">Live System Simulator</h3>
              <p className="text-[11px] font-mono text-cyan-400">
                CLOSED-LOOP TEST BENCH // TALON DOS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo banner */}
        <div className="p-4 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-blue-950/60 border-b border-cyan-950/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-cyan-300 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              WANT A GUIDED WALKTHROUGH?
            </span>
            <button
              onClick={() => {
                onClose();
                onOpenGuidedDemo();
              }}
              className="text-xs font-semibold px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
            >
              Start 90s Demo
            </button>
          </div>
        </div>

        {/* Controls Container */}
        <div className="p-5 space-y-6 flex-1">
          {/* Quick Presets */}
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2 font-semibold">
              Scenario Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => applyPreset('Normal Dry', 24, 'NONE', 'NORMAL', 'ONLINE')}
                className={`p-2.5 rounded-lg text-left border text-xs transition-all ${
                  simulation.activePresetName === 'Normal Dry'
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="font-semibold text-emerald-400 flex items-center justify-between">
                  <span>🟢 Normal Dry</span>
                  {simulation.activePresetName === 'Normal Dry' && <Check className="w-3.5 h-3.5" />}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">24% Water · Clear</div>
              </button>

              <button
                onClick={() => applyPreset('Afternoon Cloudburst', 58, 'MODERATE', 'POTENTIALLY_RESTRICTED', 'ONLINE')}
                className={`p-2.5 rounded-lg text-left border text-xs transition-all ${
                  simulation.activePresetName === 'Afternoon Cloudburst'
                    ? 'bg-amber-950/60 border-amber-500/60 text-amber-300'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="font-semibold text-amber-400 flex items-center justify-between">
                  <span>🟡 Afternoon Rain</span>
                  {simulation.activePresetName === 'Afternoon Cloudburst' && <Check className="w-3.5 h-3.5" />}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">58% Water · Restricted</div>
              </button>

              <button
                onClick={() => applyPreset('Monsoon Surge', 88, 'HEAVY', 'POSSIBLE_BLOCKAGE', 'ONLINE')}
                className={`p-2.5 rounded-lg text-left border text-xs transition-all ${
                  simulation.activePresetName === 'Monsoon Surge'
                    ? 'bg-rose-950/60 border-rose-500/60 text-rose-300'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="font-semibold text-rose-400 flex items-center justify-between">
                  <span>🔴 Habagat Surge</span>
                  {simulation.activePresetName === 'Monsoon Surge' && <Check className="w-3.5 h-3.5" />}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">88% Water · High Risk</div>
              </button>

              <button
                onClick={() => applyPreset('Sensor Offline Drill', 65, 'LIGHT', 'POTENTIALLY_RESTRICTED', 'OFFLINE')}
                className={`p-2.5 rounded-lg text-left border text-xs transition-all ${
                  simulation.activePresetName === 'Sensor Offline Drill'
                    ? 'bg-slate-800 border-slate-500 text-slate-200'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>⚫ Offline Drill</span>
                  {simulation.activePresetName === 'Sensor Offline Drill' && <Check className="w-3.5 h-3.5" />}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">ESP32 Offline simulation</div>
              </button>
            </div>
          </div>

          {/* Control 1: Water Level Slider */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-semibold">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                WATER LEVEL
              </span>
              <span
                className={`font-mono font-bold text-sm tabular-nums px-2 py-0.5 rounded ${
                  isCritical
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : isWarning
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                {simulation.waterLevel}%
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              value={simulation.waterLevel}
              onChange={(e) => handleWaterLevelChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />

            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>0% (Empty)</span>
              <span>50% (Caution)</span>
              <span>80%+ (Critical)</span>
            </div>

            <div className="mt-3 p-2.5 rounded bg-slate-950 border border-slate-800/80 text-[11px] font-mono flex items-center justify-between text-slate-400">
              <span>ULTRASONIC AIR GAP:</span>
              <span className="text-cyan-300">
                {Math.round(150 - (simulation.waterLevel * 150) / 100)} cm clearance
              </span>
            </div>
          </div>

          {/* Control 2: Rainfall Intensity */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-semibold">
                <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                RAINFALL INTENSITY
              </span>
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase">
                {simulation.rainfall}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1">
              {(['NONE', 'LIGHT', 'MODERATE', 'HEAVY', 'TORRENTIAL'] as RainfallLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => onUpdateSimulation({ rainfall: level, activePresetName: null })}
                  className={`py-1.5 text-[10px] font-mono rounded border transition-colors ${
                    simulation.rainfall === level
                      ? 'bg-cyan-600 border-cyan-400 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  {level.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Control 3: Drainage Condition Dropdown */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block mb-2 font-semibold">
              DRAINAGE CONDITION
            </label>
            <select
              value={simulation.drainageCondition}
              onChange={(e) =>
                onUpdateSimulation({
                  drainageCondition: e.target.value as PhysicalDrainageCondition,
                  activePresetName: null,
                })
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:border-cyan-400 focus:outline-none"
            >
              <option value="NORMAL">NORMAL — Free Discharge</option>
              <option value="POTENTIALLY_RESTRICTED">POTENTIALLY RESTRICTED — Reduced Inflow Siphon</option>
              <option value="POSSIBLE_BLOCKAGE">POSSIBLE BLOCKAGE — Suspected Grate/Canal Obstruction</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
              *Scientific parameter note: Physical clogs are inferred from abnormal water accumulation rate and lack of discharge, not direct optical imaging.
            </p>
          </div>

          {/* Control 4: Sensor Status */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block mb-2 font-semibold">
              ESP32 SENSOR STATUS
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['ONLINE', 'INTERMITTENT', 'OFFLINE'] as HardwareSensorState[]).map((status) => (
                <button
                  key={status}
                  onClick={() => onUpdateSimulation({ sensorStatus: status, activePresetName: null })}
                  className={`py-2 px-2 text-xs font-mono rounded border flex items-center justify-center gap-1.5 transition-colors ${
                    simulation.sensorStatus === status
                      ? status === 'ONLINE'
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : status === 'INTERMITTENT'
                        ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                        : 'bg-rose-950/80 border-rose-500 text-rose-300'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      status === 'ONLINE' ? 'bg-emerald-400' : status === 'INTERMITTENT' ? 'bg-amber-400' : 'bg-rose-400'
                    }`}
                  />
                  <span>{status}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Resulting Impact Summary */}
          <div
            className={`p-4 rounded-xl border text-xs font-mono space-y-1.5 ${
              isCritical
                ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                : isWarning
                ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                : 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
            }`}
          >
            <div className="font-bold flex items-center gap-2">
              <Radio className="w-4 h-4 shrink-0" />
              SYSTEM CASCADE STATUS: {isCritical ? 'CRITICAL ALERT' : isWarning ? 'WARNING' : 'NORMAL'}
            </div>
            <p className="text-[11px] text-slate-300">
              {isCritical
                ? 'Node TD-004 red on GIS map · Piezo buzzer strobing · CENRO emergency ticket dispatched.'
                : isWarning
                ? 'Water accumulation elevated · Monitoring nodes yellow on GIS radar.'
                : 'All culverts discharging smoothly · Low community flood risk.'}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-cyan-950/60 bg-[#060a14] flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onReset}
            className="px-3 py-2 text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5 rounded hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors shadow-md shadow-cyan-950"
          >
            Apply to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
