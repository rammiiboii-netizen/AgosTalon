import React from 'react';
import { ArrowDown, Radio, Cpu, Bell, Globe, Activity, MapPin } from 'lucide-react';
import { SimulationState } from '../types';

interface HardwareDataFlowProps {
  simulation: SimulationState;
}

export const HardwareDataFlow: React.FC<HardwareDataFlowProps> = ({ simulation }) => {
  const isCritical = simulation.waterLevel >= 80 || simulation.drainageCondition === 'POSSIBLE_BLOCKAGE';

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="p-6 sm:p-8 rounded-2xl bg-[#080d19] border border-cyan-950 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cyan-950/70 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>CIRCUIT DATA PIPELINE & TRANSMISSION BUS</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-tight">
              HARDWARE DATA FLOW DIAGRAM
            </h2>
          </div>
          <div className="text-xs font-mono text-slate-400">
            SAMPLING RATE: 2 Hz · ROLLING MEDIAN WINDOW: 5
          </div>
        </div>

        {/* Visual Technical Diagram */}
        <div className="flex flex-col items-center max-w-2xl mx-auto text-xs font-mono">
          {/* Node 1: Water Surface */}
          <div className="w-full max-w-[260px] p-3 rounded-xl bg-slate-900 border border-slate-800 text-center shadow-lg">
            <span className="text-slate-400 text-[10px] block">ENVIRONMENTAL MEDIUM</span>
            <span className="font-bold text-cyan-300">CULVERT WATER LEVEL ({simulation.waterLevel}%)</span>
          </div>

          <div className="my-2 flex flex-col items-center text-cyan-500">
            <div className="w-0.5 h-6 bg-cyan-500/60 relative">
              <span className="w-2 h-2 rounded-full bg-cyan-400 absolute top-1/2 -left-[3px] animate-ping" />
            </div>
            <span className="text-[10px] text-cyan-400">40 kHz Ultrasonic Echo Burst</span>
          </div>

          {/* Node 2: Ultrasonic Sensor */}
          <div className="w-full max-w-[280px] p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-500/60 text-center shadow-lg">
            <div className="flex items-center justify-center gap-2 text-cyan-400 font-bold mb-0.5">
              <Radio className="w-4 h-4" />
              <span>ULTRASONIC SENSOR (HC-SR04)</span>
            </div>
            <span className="text-[10px] text-slate-300">Acoustic Flight Time Measurement (Δt)</span>
          </div>

          <div className="my-2 flex flex-col items-center text-cyan-500">
            <div className="w-0.5 h-6 bg-cyan-500/60 relative">
              <span className="w-2 h-2 rounded-full bg-cyan-400 absolute top-1/2 -left-[3px] animate-ping" />
            </div>
            <span className="text-[10px] text-slate-400">Echo Pulse Duration (GPIO 5)</span>
          </div>

          {/* Node 3: ESP32 Processing */}
          <div className="w-full max-w-[320px] p-4 rounded-xl bg-blue-950/60 border border-blue-500/60 text-center shadow-lg">
            <div className="flex items-center justify-center gap-2 text-blue-300 font-bold mb-0.5">
              <Cpu className="w-4 h-4" />
              <span>ESP32 PROCESSING & FILTER</span>
            </div>
            <span className="text-[10px] text-slate-300">Distance = (Δt × 0.0343) / 2 · Digital Filter</span>
          </div>

          <div className="my-2 flex flex-col items-center text-cyan-500">
            <div className="w-0.5 h-6 bg-cyan-500/60 relative">
              <span className="w-2 h-2 rounded-full bg-cyan-400 absolute top-1/2 -left-[3px] animate-ping" />
            </div>
            <span className="text-[10px] text-slate-400">Threshold Logic & Condition Check</span>
          </div>

          {/* Node 4: Condition Check Branch */}
          <div className="w-full max-w-xl p-3 rounded-xl bg-slate-900 border border-slate-700 text-center shadow-lg">
            <span className="font-bold text-white">CONDITION CLASSIFICATION ENGINE</span>
            <div className="text-[10px] text-slate-400 mt-1">
              NORMAL (&lt;50%) · WARNING (50-79%) · CRITICAL (&gt;=80% or Restricted)
            </div>
          </div>

          {/* Split Fork */}
          <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mt-4">
            {/* Left Fork: Physical Buzzer */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-6 bg-rose-500/60 relative">
                {isCritical && <span className="w-2 h-2 rounded-full bg-rose-400 absolute top-1/2 -left-[3px] animate-ping" />}
              </div>
              <div
                className={`w-full p-3.5 rounded-xl border text-center transition-colors ${
                  isCritical
                    ? 'bg-rose-950/70 border-rose-500 text-rose-200 shadow-lg shadow-rose-950'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 font-bold mb-0.5">
                  <Bell className="w-3.5 h-3.5" />
                  <span>LOCAL ACTIVE BUZZER</span>
                </div>
                <span className="text-[10px]">
                  {isCritical ? '85dB Street Alarm Active' : 'Silent (Threshold < 85%)'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Local Fail-safe Action</span>
            </div>

            {/* Right Fork: Internet / Cloud */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-6 bg-cyan-500/60 relative">
                <span className="w-2 h-2 rounded-full bg-cyan-400 absolute top-1/2 -left-[3px] animate-ping" />
              </div>
              <div className="w-full p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-500/60 text-center text-cyan-200 shadow-lg">
                <div className="flex items-center justify-center gap-1.5 font-bold mb-0.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>INTERNET / WI-FI GATEWAY</span>
                </div>
                <span className="text-[10px] text-slate-300">Encrypted MQTT / REST Telemetry</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Cloud Pipeline</span>

              <div className="w-0.5 h-4 bg-cyan-500/60 my-1" />

              {/* Sub-node: Monitoring App */}
              <div className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center text-slate-300">
                <div className="font-bold text-[11px]">AUTHORIZED MONITORING APP</div>
                <span className="text-[10px] text-slate-500">Barangay / CENRO Incident Desk</span>
              </div>

              <div className="w-0.5 h-4 bg-cyan-500/60 my-1" />

              {/* Sub-node: GIS Platform */}
              <div className="w-full p-2.5 rounded-lg bg-slate-900 border border-cyan-800 text-center text-cyan-300">
                <div className="flex items-center justify-center gap-1 font-bold text-[11px]">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span>TALON DOS GIS PLATFORM</span>
                </div>
                <span className="text-[10px] text-slate-400">Dynamic Risk Heatmap & Contour Layer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
