import React from 'react';
import { 
  ArrowRight, Shield, Activity, Compass, Cpu, Radio, 
  MapPin, Bell, Users, Eye, Sparkles, Sliders 
} from 'lucide-react';
import { SimulationState } from '../types';

interface HeroSectionProps {
  simulation: SimulationState;
  onOpenSimulation: () => void;
  onStartGuidedDemo: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  simulation,
  onOpenSimulation,
  onStartGuidedDemo,
}) => {
  const isCritical = simulation.waterLevel >= 80 || simulation.drainageCondition === 'POSSIBLE_BLOCKAGE';
  const isWarning = !isCritical && (simulation.waterLevel >= 50 || simulation.drainageCondition === 'POTENTIALLY_RESTRICTED');

  const pipelineStages = [
    {
      id: 'sensors',
      title: 'SENSORS',
      subtitle: 'HC-SR04 Array',
      desc: '40 kHz ultrasonic acoustic wave measures distance to water surface every 500ms.',
      icon: Radio,
      status: simulation.sensorStatus === 'ONLINE' ? 'NOMINAL' : simulation.sensorStatus,
      statusColor: simulation.sensorStatus === 'ONLINE' ? 'text-cyan-400' : 'text-rose-400',
    },
    {
      id: 'esp32',
      title: 'ESP32',
      subtitle: 'Edge Compute',
      desc: 'Dual-core processor calculates water rise velocity and runs outlier filtering.',
      icon: Cpu,
      status: 'PROCESSING',
      statusColor: 'text-cyan-400',
    },
    {
      id: 'telemetry',
      title: 'REAL-TIME DATA',
      subtitle: 'MQTT / Wi-Fi',
      desc: 'Low-latency telemetry streaming to cloud backend with cellular failover.',
      icon: Activity,
      status: '18ms LATENCY',
      statusColor: 'text-emerald-400',
    },
    {
      id: 'alert',
      title: 'ALERT SYSTEM',
      subtitle: 'Threshold Logic',
      desc: 'Autonomous multi-tier classification: Normal, Warning (50%), Critical (80%+).',
      icon: Bell,
      status: isCritical ? 'CRITICAL ALERT' : isWarning ? 'WARNING' : 'STANDBY',
      statusColor: isCritical ? 'text-rose-400 font-bold' : isWarning ? 'text-amber-400' : 'text-slate-400',
    },
    {
      id: 'response',
      title: 'BARANGAY / CENRO',
      subtitle: 'Municipal Portal',
      desc: 'Direct dispatch to Las Piñas City DRRMC and Talon Dos desiltation crews.',
      icon: Users,
      status: isCritical ? 'CREW ALERTED' : 'MONITORING',
      statusColor: isCritical ? 'text-rose-400' : 'text-slate-400',
    },
    {
      id: 'gis',
      title: 'FLOOD RISK MAP',
      subtitle: 'Geospatial Radar',
      desc: 'Dynamic risk contouring mapped over Talon Dos elevation & arterial catchments.',
      icon: MapPin,
      status: isCritical ? 'ZONE ELEVATED' : 'NOMINAL',
      statusColor: isCritical ? 'text-rose-400' : 'text-emerald-400',
    },
  ];

  return (
    <section id="hero" className="relative min-h-[90vh] flex flex-col justify-center pt-8 pb-16 overflow-hidden">
      {/* Background Graphic Scrim */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        {/* Radar GIS texture */}
        <img
          src="/src/assets/images/talon_dos_gis_radar_1790506422776.jpg"
          alt="Talon Dos GIS Terrain Radar"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-25 scale-105"
        />
        {/* Dark radial fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060a12]/80 via-[#060a12]/95 to-[#060a12]" />
        <div className="absolute inset-0 tech-grid-bg opacity-70" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Live System Indicator */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium border ${
              isCritical
                ? 'bg-rose-950/70 border-rose-500/50 text-rose-300'
                : isWarning
                ? 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isCritical ? 'bg-rose-400 animate-ping' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span>{isCritical ? 'CRITICAL DRAINAGE ALERT' : isWarning ? 'RESTRICTED RUNOFF DETECTED' : 'SYSTEM ONLINE'}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-300">Monitoring Talon Dos, Las Piñas City</span>
          </div>

          {/* Hackathon Demo Notice */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono bg-cyan-950/40 border border-cyan-800/40 text-cyan-300">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>DEMO ENVIRONMENT · SIMULATION ACTIVE</span>
          </div>
        </div>

        {/* Large Headline */}
        <div className="max-w-4xl space-y-4">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-white leading-[1.08] text-balance">
            See the Risk{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
              Before the Flood.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-3xl leading-relaxed font-normal">
            An intelligent drainage monitoring and geospatial risk visualization system designed to help
            communities detect abnormal drainage conditions, monitor vulnerable locations, and respond
            before flooding escalates.
          </p>
        </div>

        {/* Call to Actions */}
        <div className="flex flex-wrap items-center gap-4 mt-8">
          <a
            href="#gis-map"
            className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40 active:scale-95"
          >
            <Compass className="w-4 h-4" />
            <span>EXPLORE LIVE MAP</span>
          </a>

          <a
            href="#the-device"
            className="px-6 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-100 font-medium text-sm border border-slate-700 hover:border-cyan-500/40 flex items-center gap-2 transition-all active:scale-95"
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>VIEW SYSTEM</span>
          </a>

          <button
            onClick={onStartGuidedDemo}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-700/80 to-cyan-700/80 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold text-sm border border-cyan-400/40 flex items-center gap-2 shadow-lg shadow-blue-950/60 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            <span>LAUNCH GUIDED DEMO (90s)</span>
          </button>

          <button
            onClick={onOpenSimulation}
            className="px-4 py-3 rounded-xl text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors border border-transparent hover:border-slate-800"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Adjust Simulation</span>
          </button>
        </div>

        {/* Futuristic System Architecture Flow Pipeline */}
        <div className="mt-14 pt-8 border-t border-cyan-950/60">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4" />
              INTEGRATED CLOSED-LOOP TELEMETRY CHAIN
            </span>
            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
              LIVE DATASTREAM · 12 NODES MONITORED
            </span>
          </div>

          {/* Flow Stages */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {pipelineStages.map((stage, idx) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.id}
                  className="relative p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-800/50 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        0{idx + 1}
                      </span>
                    </div>

                    <h4 className="text-xs font-display font-bold text-white tracking-wide">
                      {stage.title}
                    </h4>
                    <p className="text-[10px] text-cyan-400 font-mono mb-1.5">
                      {stage.subtitle}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-3">
                      {stage.desc}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-500">STATE:</span>
                    <span className={`font-semibold ${stage.statusColor}`}>{stage.status}</span>
                  </div>

                  {/* Flow Arrow connecting stages */}
                  {idx < pipelineStages.length - 1 && (
                    <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-cyan-500/40">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
