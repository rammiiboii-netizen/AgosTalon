import React, { useState } from 'react';
import { 
  CloudRain, Clock, AlertTriangle, ShieldAlert, 
  Activity, Play, CheckCircle, RefreshCw, Sparkles, Droplets 
} from 'lucide-react';
import { RainfallLevel, SimulationState } from '../types';

interface WhatIfSimulatorProps {
  simulation: SimulationState;
  onRunScenarioResult: (water: number, rain: RainfallLevel, drainage: SimulationState['drainageCondition']) => void;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  simulation,
  onRunScenarioResult,
}) => {
  const [duration, setDuration] = useState<'15m' | '30m' | '1h' | '2h'>('30m');
  const [intensity, setIntensity] = useState<RainfallLevel>('HEAVY');
  const [drainageMaintenance, setDrainageMaintenance] = useState<'MAINTAINED' | 'PARTIALLY_BLOCKED' | 'SEVERELY_BLOCKED'>('PARTIALLY_BLOCKED');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasRun, setHasRun] = useState(false);

  // Dynamic calculated outcome based on parameters
  const calculateResult = () => {
    let affectedNodes = 4;
    let elevatedRisk = 2;
    let blockages = 1;
    let alerts = 3;
    let runoffCuM = 14500;
    let finalWater = 55;

    if (intensity === 'LIGHT') {
      affectedNodes = 2;
      elevatedRisk = 0;
      blockages = 0;
      alerts = 1;
      runoffCuM = 4200;
      finalWater = 38;
    } else if (intensity === 'MODERATE') {
      affectedNodes = 6;
      elevatedRisk = 2;
      blockages = 1;
      alerts = 3;
      runoffCuM = 12000;
      finalWater = 58;
    } else if (intensity === 'HEAVY') {
      affectedNodes = 9;
      elevatedRisk = 4;
      blockages = 2;
      alerts = 6;
      runoffCuM = 28000;
      finalWater = 84;
    } else if (intensity === 'TORRENTIAL') {
      affectedNodes = 12;
      elevatedRisk = 7;
      blockages = 4;
      alerts = 11;
      runoffCuM = 54000;
      finalWater = 95;
    }

    if (drainageMaintenance === 'PARTIALLY_BLOCKED') {
      elevatedRisk += 1;
      blockages += 1;
      finalWater = Math.min(finalWater + 10, 96);
    } else if (drainageMaintenance === 'SEVERELY_BLOCKED') {
      elevatedRisk += 2;
      blockages += 2;
      finalWater = Math.min(finalWater + 18, 98);
    }

    return {
      affectedNodes,
      elevatedRisk,
      blockages,
      alerts,
      runoffCuM,
      finalWater,
    };
  };

  const result = calculateResult();

  const handleRunScenario = () => {
    setIsRunning(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          setHasRun(true);
          // Apply to main simulation
          const condition =
            drainageMaintenance === 'MAINTAINED'
              ? 'NORMAL'
              : drainageMaintenance === 'PARTIALLY_BLOCKED'
              ? 'POTENTIALLY_RESTRICTED'
              : 'POSSIBLE_BLOCKAGE';
          onRunScenarioResult(result.finalWater, intensity, condition);
          return 100;
        }
        return prev + 20;
      });
    }, 280);
  };

  return (
    <section id="what-if" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="rounded-2xl bg-[#090f1d] border border-cyan-500/30 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-cyan-950/60">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>HYPOTHETICAL HYDRAULIC MODELING</span>
              <span>·</span>
              <span>PREDICTIVE DRILL BENCH</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
              "WHAT IF?" FLOOD SCENARIO SIMULATOR
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Simulate hypothetical heavy monsoon downpours and test community drainage resilience before a storm strikes Talon Dos.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-[11px] font-mono text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>HACKATHON DEMO MODULE</span>
          </div>
        </div>

        {/* Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-5 bg-[#060a14] p-5 rounded-xl border border-cyan-950">
            {/* Control 1: Duration */}
            <div>
              <label className="text-xs font-mono uppercase text-slate-300 block mb-2 font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                SIMULATION DURATION
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['15m', '30m', '1h', '2h'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`py-2 text-xs font-mono rounded-lg border transition-colors ${
                      duration === d
                        ? 'bg-cyan-600 border-cyan-400 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Control 2: Rainfall Intensity */}
            <div>
              <label className="text-xs font-mono uppercase text-slate-300 block mb-2 font-semibold flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                RAINFALL INTENSITY
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['LIGHT', 'MODERATE', 'HEAVY', 'TORRENTIAL'] as RainfallLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setIntensity(level)}
                    className={`py-2 text-[11px] font-mono rounded-lg border transition-colors ${
                      intensity === level
                        ? 'bg-cyan-600 border-cyan-400 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {level.slice(0, 4)}
                  </button>
                ))}
              </div>
            </div>

            {/* Control 3: Drainage Condition */}
            <div>
              <label className="text-xs font-mono uppercase text-slate-300 block mb-2 font-semibold flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                CANAL MAINTENANCE STATE
              </label>
              <div className="space-y-2">
                {[
                  { id: 'MAINTAINED', label: 'Cleaned / Well Maintained' },
                  { id: 'PARTIALLY_BLOCKED', label: 'Partially Restricted Debris' },
                  { id: 'SEVERELY_BLOCKED', label: 'Severely Blocked Culvert Grate' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setDrainageMaintenance(c.id as any)}
                    className={`w-full py-2 px-3 text-left text-xs font-mono rounded-lg border transition-colors flex items-center justify-between ${
                      drainageMaintenance === c.id
                        ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{c.label}</span>
                    <span className="text-[10px] text-slate-500">{c.id}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={handleRunScenario}
              disabled={isRunning}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-sm font-display tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-950 transition-all active:scale-95"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>SIMULATING RAINFALL RUNOFF...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>RUN WHAT-IF SCENARIO</span>
                </>
              )}
            </button>

            {/* Progress Bar */}
            {isRunning && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-cyan-400">
                  <span>COMPUTING RUNOFF ACCUMULATION</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Results Output Column */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="p-5 rounded-xl bg-[#060a14] border border-cyan-950">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  SIMULATION RESULT PREDICTION
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                  SCENARIO: {intensity} RAIN / {duration}
                </span>
              </div>

              {/* Metric Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 block">NODES AFFECTED</span>
                  <span className="text-xl font-mono font-bold text-white tabular-nums">
                    {result.affectedNodes} <span className="text-xs text-slate-500">/ 12</span>
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 block">ELEVATED TO HIGH RISK</span>
                  <span className="text-xl font-mono font-bold text-rose-400 tabular-nums">
                    {result.elevatedRisk} <span className="text-xs text-slate-500">zones</span>
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 block">POSSIBLE BLOCKAGES</span>
                  <span className="text-xl font-mono font-bold text-amber-400 tabular-nums">
                    {result.blockages} <span className="text-xs text-slate-500">detected</span>
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 block">ALERTS GENERATED</span>
                  <span className="text-xl font-mono font-bold text-cyan-400 tabular-nums">
                    {result.alerts} <span className="text-xs text-slate-500">tickets</span>
                  </span>
                </div>
              </div>

              {/* Dynamic Map Transition Breakdown */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 mb-4 text-xs font-mono">
                <div className="text-slate-400 mb-2 flex items-center justify-between">
                  <span>CULVERT TRANSITION SEQUENCE:</span>
                  <span className="text-slate-300">
                    🟢 Normal → 🟡 Warning → 🔴 Critical
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-300">
                  <p>
                    • TD-004 (Central Outfall) transitions to <span className="text-rose-400 font-bold">92% CRITICAL</span> within 18 minutes.
                  </p>
                  <p>
                    • TD-006 (Marcos Alvarez) and TD-009 (Pamplona Creek) elevate to <span className="text-amber-400 font-bold">WARNING</span> threshold.
                  </p>
                  <p>
                    • Projected surface accumulation: <span className="text-cyan-300 font-bold">~{result.runoffCuM.toLocaleString()} m³</span> peak runoff volume.
                  </p>
                </div>
              </div>

              {/* Recommended Municipal Action */}
              <div className="p-3.5 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-xs font-mono">
                <span className="text-cyan-400 font-bold block mb-1">
                  RECOMMENDED CENRO INTERVENTION:
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Dispatch mobile suction pumps to Alabang-Zapote intersection and alert Barangay Talon Dos DRRMC to clear surface trash grates along Casimiro Avenue prior to peak tide.
                </p>
              </div>
            </div>

            {/* Scientific Rigor Disclaimer */}
            <div className="text-[11px] font-mono text-slate-400 flex items-start gap-2 bg-[#060a14] p-3 rounded-lg border border-slate-800/60">
              <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Validation Note:</strong> This scenario engine is a hydrological test simulation designed for emergency tabletop planning and hackathon evaluation. Real-world flood occurrences depend on variable soil saturation, trash volume, and Manila Bay tidal gates.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
