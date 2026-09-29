import React, { useState } from 'react';
import { 
  Radio, Cpu, Layers, Bell, MapPin, Truck, 
  CheckCircle, ArrowRight, Sparkles 
} from 'lucide-react';

export const SensorToCityTimeline: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: '01',
      title: 'DETECT',
      headline: 'Non-contact Ultrasonic Measurement',
      desc: 'The HC-SR04 acoustic transducer fires 40 kHz sound waves downward into the drainage culvert every 500ms, measuring air-gap distance to the rising water surface with 0.3 cm precision.',
      icon: Radio,
      detail: 'Eliminates sensor fouling caused by dirty runoff water and floating trash.',
    },
    {
      num: '02',
      title: 'PROCESS',
      headline: 'Edge Microcontroller Computation',
      desc: 'The ESP32 processes raw sensor readings, runs rolling-median outlier filters to remove water ripples, calculates the rate of water level rise (dH/dt), and packages telemetry into lightweight JSON packets.',
      icon: Cpu,
      detail: 'Edge intelligence guarantees instant local decisions even during cellular dropouts.',
    },
    {
      num: '03',
      title: 'CLASSIFY',
      headline: 'Multi-Factor Drainage Condition Assessment',
      desc: 'The system classifies conditions into NORMAL (<50%), WARNING (50–79%), or CRITICAL (>=80%). If water accumulates rapidly without downstream discharge, a suspected drainage restriction is flagged.',
      icon: Layers,
      detail: 'Avoids false alarms from temporary surface splashing by validating sustained hydraulic trends.',
    },
    {
      num: '04',
      title: 'ALERT',
      headline: 'Immediate Dual-Channel Notification',
      desc: 'Locally, the 85dB active piezo buzzer triggers audible street alarms. Simultaneously, cloud APIs push prioritized incident alerts to CENRO Las Piñas duty dispatchers and Barangay Talon Dos DRRMO.',
      icon: Bell,
      detail: 'Emergency notification arrives in seconds, eliminating reliance on delayed resident reports.',
    },
    {
      num: '05',
      title: 'VISUALIZE',
      headline: 'Geospatial Flood-Risk Radar Display',
      desc: 'The interactive GIS platform highlights the affected culvert node in bright red and projects dynamic flood-risk contour heatmaps over low-lying catchment neighborhoods in Talon Dos.',
      icon: MapPin,
      detail: 'City engineers see exactly which streets and intersections are at risk of backwater pooling.',
    },
    {
      num: '06',
      title: 'RESPOND',
      headline: 'Targeted Municipal Field Intervention',
      desc: 'Barangay patrol units and CENRO vacuum desiltation crews are dispatched with GPS precision to unclog the specific canal grate before surface water spills over roads and halts traffic.',
      icon: Truck,
      detail: 'Proactive maintenance replaces reactive disaster recovery.',
    },
  ];

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>INCIDENT LIFECYCLE STORYTELLING</span>
            <span>·</span>
            <span>END-TO-END PIPELINE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold text-white tracking-tight">
            FROM SENSOR TO CITY // INCIDENT FLOW
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            How a single millimeter of water-level rise in a street drain triggers automated municipal mitigation in Las Piñas City.
          </p>
        </div>
      </div>

      {/* Horizontal Interactive Timeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isSelected = activeStep === idx;
          return (
            <div
              key={s.num}
              onClick={() => setActiveStep(idx)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-cyan-950/60 border-cyan-400 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-400/40'
                  : 'bg-[#080d19] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-500">{s.num}</span>
                </div>

                <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold mb-1">
                  STAGE {s.num}
                </div>
                <h4 className="text-sm font-display font-bold text-white mb-2">
                  {s.title}
                </h4>
                <p className="text-xs text-slate-400 font-sans leading-snug line-clamp-3">
                  {s.headline}
                </p>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                <span>PHASE {idx + 1}</span>
                <span className="text-cyan-400 font-semibold">{isSelected ? 'ACTIVE' : 'SELECT'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Active Step Detail Stage */}
      <div className="mt-6 p-6 rounded-2xl bg-[#090f1d] border border-cyan-950 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <span>DETAILED SPECIFICATION // STAGE {steps[activeStep].num}: {steps[activeStep].title}</span>
          </div>
          <h3 className="text-xl font-display font-bold text-white">
            {steps[activeStep].headline}
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            {steps[activeStep].desc}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 min-w-[260px] shrink-0">
          <span className="text-[10px] uppercase text-cyan-400 font-bold block mb-1">
            KEY SYSTEM ADVANTAGE:
          </span>
          <p className="leading-snug">{steps[activeStep].detail}</p>
        </div>
      </div>
    </section>
  );
};
