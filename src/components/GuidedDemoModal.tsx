import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Play, Pause, ChevronRight, ChevronLeft, Volume2, VolumeX, 
  AlertTriangle, Radio, Shield, MapPin, CheckCircle, ArrowRight, Zap 
} from 'lucide-react';
import { SimulationState } from '../types';
import { playBuzzerBeep, triggerDoubleAlertBeep } from '../utils/audio';

interface GuidedDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyState: (state: Partial<SimulationState>) => void;
}

interface StepData {
  step: number;
  title: string;
  tagline: string;
  waterLevel: number;
  rainfall: SimulationState['rainfall'];
  drainageCondition: SimulationState['drainageCondition'];
  sensorStatus: SimulationState['sensorStatus'];
  buzzerActive: boolean;
  alertVisible: boolean;
  gisHighlight: 'GREEN' | 'YELLOW' | 'RED';
  presenterScript: string;
  technicalMechanism: string;
  actionOutput: string;
}

const DEMO_STEPS: StepData[] = [
  {
    step: 1,
    title: '01. Baseline Nominal Conditions',
    tagline: 'Dry weather baseline across Talon Dos drainage network',
    waterLevel: 24,
    rainfall: 'NONE',
    drainageCondition: 'NORMAL',
    sensorStatus: 'ONLINE',
    buzzerActive: false,
    alertVisible: false,
    gisHighlight: 'GREEN',
    presenterScript:
      'We start at dry baseline in Barangay Talon Dos. All 12 IoT nodes along Alabang-Zapote Road and Casimiro culverts report normal water clearance. Water level is at 24% depth, telemetry is nominal.',
    technicalMechanism:
      'HC-SR04 ultrasonic sensor measures 114 cm distance from culvert crown to water surface (24% water depth). ESP32 reports rolling median over Wi-Fi.',
    actionOutput: 'Status: NOMINAL · All 12 nodes green on GIS radar.',
  },
  {
    step: 2,
    title: '02. Heavy Rainfall Onset',
    tagline: 'Southwest Monsoon (Habagat) rainbands enter Las Piñas',
    waterLevel: 46,
    rainfall: 'HEAVY',
    drainageCondition: 'NORMAL',
    sensorStatus: 'ONLINE',
    buzzerActive: false,
    alertVisible: false,
    gisHighlight: 'GREEN',
    presenterScript:
      'Sudden torrential monsoon rain arrives over Talon Dos. Runoff from surrounding commercial strips starts entering arterial catch basins. Rain sensors report heavy precipitation (>35 mm/hr).',
    technicalMechanism:
      'Precipitation surge increases surface runoff coefficient. Siphon velocity increases to 1.8 m/s as designed culvert discharge handles inflow.',
    actionOutput: 'Rainfall telemetry logged: 38 mm/hr · Inflow velocity elevated.',
  },
  {
    step: 3,
    title: '03. Rapid Water Accumulation',
    tagline: 'Runoff velocity decelerates at central outfall confluence',
    waterLevel: 68,
    rainfall: 'HEAVY',
    drainageCondition: 'POTENTIALLY_RESTRICTED',
    sensorStatus: 'ONLINE',
    buzzerActive: false,
    alertVisible: true,
    gisHighlight: 'YELLOW',
    presenterScript:
      'Water reaches 68% capacity. Notice that while upstream nodes are draining freely, Node TD-004 at the Talon Dos Central Outfall shows decelerating velocity—indicating potential hydraulic restriction.',
    technicalMechanism:
      'ESP32 onboard rate-of-change algorithm detects dH/dt > 1.4 cm/min without corresponding downstream outfall increase. State switches to WARNING.',
    actionOutput: 'Warning Advisory queued: TD-004 approaching 70% threshold.',
  },
  {
    step: 4,
    title: '04. Critical Threshold Reached',
    tagline: 'Possible blockage detected — water level surges to 92%',
    waterLevel: 92,
    rainfall: 'HEAVY',
    drainageCondition: 'POSSIBLE_BLOCKAGE',
    sensorStatus: 'ONLINE',
    buzzerActive: true,
    alertVisible: true,
    gisHighlight: 'RED',
    presenterScript:
      'Water surges to 92%! The ultrasonic sensor detects water just 12 cm from the street grate. Because flow velocity has halted despite heavy rain, the system flags a SUSPECTED DRAINAGE BLOCKAGE.',
    technicalMechanism:
      'Scientific criteria met: Level >= 85% + Flow restriction proxy. ESP32 triggers autonomous on-board interrupt for fail-safe street alert.',
    actionOutput: 'CRITICAL ALERT DISPATCHED: Possible blockage at TD-004!',
  },
  {
    step: 5,
    title: '05. Geospatial GIS Risk Propagation',
    tagline: 'Map node turns red and highlights high-risk backwater flooding zone',
    waterLevel: 92,
    rainfall: 'HEAVY',
    drainageCondition: 'POSSIBLE_BLOCKAGE',
    sensorStatus: 'ONLINE',
    buzzerActive: true,
    alertVisible: true,
    gisHighlight: 'RED',
    presenterScript:
      'Instantly on the GIS command map, Node TD-004 turns red with an animated pulsing radar contour. The geospatial engine visualizes the low-lying catchment zones at risk of backwater road flooding.',
    technicalMechanism:
      'Geospatial layer dynamically activates 300m flood-risk contour polygon over Casimiro Village & Alabang-Zapote intersection based on digital elevation.',
    actionOutput: 'GIS Zone: HIGH RISK · Catchment population alerted.',
  },
  {
    step: 6,
    title: '06. Municipal Response Dashboard Notification',
    tagline: 'CENRO Las Piñas & Barangay Talon Dos receive dispatch ticket',
    waterLevel: 92,
    rainfall: 'HEAVY',
    drainageCondition: 'POSSIBLE_BLOCKAGE',
    sensorStatus: 'ONLINE',
    buzzerActive: true,
    alertVisible: true,
    gisHighlight: 'RED',
    presenterScript:
      'At the Authorized Municipal Response Center, duty officers receive a prioritized incident ticket with GPS coordinates, live camera link, and calculated drainage volume. No more waiting for citizen 911 calls.',
    technicalMechanism:
      'Automated dispatch payload compiled: Node ID, Water Height (138cm/150cm), Blockage Probability (High), Recommended Action (Siphon clearance).',
    actionOutput: 'Incident Ticket #TD-9402 generated · SMS to DRRM Team.',
  },
  {
    step: 7,
    title: '07. Local Physical Alarm Buzzer Activates',
    tagline: 'Street-level piezo buzzer alerts pedestrian & barangay tanods',
    waterLevel: 92,
    rainfall: 'HEAVY',
    drainageCondition: 'POSSIBLE_BLOCKAGE',
    sensorStatus: 'ONLINE',
    buzzerActive: true,
    alertVisible: true,
    gisHighlight: 'RED',
    presenterScript:
      'Listen and look at the physical prototype. The local 85dB active piezo buzzer triggers high-frequency acoustic pulses. Even if cellular networks are congested, pedestrians and local watchmen receive an immediate audible warning.',
    technicalMechanism:
      'ESP32 GPIO 23 drives transistor switch with 2.4 kHz square wave in burst pattern. Fail-safe independent of network latency.',
    actionOutput: 'Local Street Siren Active: 85 dB audible alert triggered.',
  },
  {
    step: 8,
    title: '08. Rapid Intervention Before Flooding Escalates',
    tagline: 'CENRO maintenance crew dispatched to clear debris grate',
    waterLevel: 92,
    rainfall: 'HEAVY',
    drainageCondition: 'POSSIBLE_BLOCKAGE',
    sensorStatus: 'ONLINE',
    buzzerActive: true,
    alertVisible: true,
    gisHighlight: 'RED',
    presenterScript:
      'The CENRO desiltation truck is routed directly to the specific blockage at TD-004 before water spills onto the highway. We stopped a city-stopping flood before it even happened.',
    technicalMechanism:
      'Closed-loop cycle complete: Detect (Sensor) -> Process (ESP32) -> Classify (Cloud) -> Alert (CENRO) -> Mitigate (Field Team).',
    actionOutput: 'Crew En Route: ETA 8 mins · Pre-flood mitigation achieved.',
  },
];

export const GuidedDemoModal: React.FC<GuidedDemoModalProps> = ({
  isOpen,
  onClose,
  onApplyState,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const step = DEMO_STEPS[currentStepIndex];

  // Auto-play advances every 11 seconds (total ~88-90s)
  useEffect(() => {
    if (!isOpen) return;

    if (isPlaying) {
      timerRef.current = setTimeout(() => {
        setCurrentStepIndex((prev) => (prev < DEMO_STEPS.length - 1 ? prev + 1 : 0));
      }, 11000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen, isPlaying, currentStepIndex]);

  // Sync state to parent simulation preview
  useEffect(() => {
    if (!isOpen) return;
    onApplyState({
      waterLevel: step.waterLevel,
      rainfall: step.rainfall,
      drainageCondition: step.drainageCondition,
      sensorStatus: step.sensorStatus,
    });

    if (step.buzzerActive && soundEnabled) {
      triggerDoubleAlertBeep();
    }
  }, [currentStepIndex, isOpen, soundEnabled]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < DEMO_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setCurrentStepIndex(0);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleFinishAndApply = () => {
    onApplyState({
      waterLevel: step.waterLevel,
      rainfall: step.rainfall,
      drainageCondition: step.drainageCondition,
      sensorStatus: step.sensorStatus,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-[#090f1d] border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/60 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-cyan-950/60 bg-[#060a14]/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base text-white">
                  90-Second Guided System Demonstration
                </span>
                <span className="text-[10px] font-mono bg-cyan-900/60 text-cyan-300 px-2 py-0.5 rounded border border-cyan-700/50">
                  HACKATHON SHOWCASE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                End-to-end incident cycle: Ultrasonic detection → ESP32 logic → GIS risk map → CENRO municipal response
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playBuzzerBeep(200, 2200);
              }}
              className={`p-2 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-all ${
                soundEnabled
                  ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-900 border-slate-700 text-slate-500'
              }`}
              title="Toggle Piezo Buzzer Audio Simulation"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Buzzer Audio ON' : 'Muted'}</span>
            </button>

            {/* Play / Pause Auto-advance */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
              <span className="hidden sm:inline">{isPlaying ? 'Pause Demo' : 'Resume'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Progress Line */}
        <div className="px-6 py-2 bg-[#080d19] border-b border-cyan-950/40 flex items-center justify-between gap-1 overflow-x-auto">
          {DEMO_STEPS.map((s, idx) => (
            <button
              key={s.step}
              onClick={() => setCurrentStepIndex(idx)}
              className={`flex-1 min-w-[70px] py-1 text-center transition-all ${
                idx === currentStepIndex
                  ? 'border-b-2 border-cyan-400 text-cyan-300 font-semibold'
                  : idx < currentStepIndex
                  ? 'border-b-2 border-emerald-500/50 text-slate-400'
                  : 'border-b-2 border-slate-800 text-slate-600'
              }`}
            >
              <div className="text-[10px] font-mono tracking-wider">
                STEP {String(s.step).padStart(2, '0')}
              </div>
            </button>
          ))}
        </div>

        {/* Modal Main Content Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Presenter Script & Explanations */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-cyan-950/50 border border-cyan-800/60 text-cyan-300 text-xs font-mono mb-2">
                <span>STAGE {step.step} OF 8</span>
                <span>·</span>
                <span className="uppercase text-slate-300">{step.rainfall} RAIN</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
                {step.title}
              </h3>
              <p className="text-xs sm:text-sm text-cyan-400/90 font-medium mt-1">
                {step.tagline}
              </p>

              {/* Presenter Talking Point */}
              <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-cyan-900/50 relative">
                <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 mb-1.5">
                  <Radio className="w-3.5 h-3.5" /> Presenter Talking Script
                </div>
                <p className="text-sm text-slate-200 leading-relaxed italic">
                  "{step.presenterScript}"
                </p>
              </div>

              {/* Technical Mechanism */}
              <div className="mt-3 p-3.5 rounded-xl bg-[#070c17] border border-slate-800 text-xs text-slate-300 space-y-1">
                <span className="font-mono text-[10px] uppercase text-slate-400 block font-semibold">
                  Engineering Telemetry & Physics:
                </span>
                <p className="text-slate-300 leading-relaxed">{step.technicalMechanism}</p>
              </div>
            </div>

            {/* Output Banner */}
            <div
              className={`p-3 rounded-lg text-xs font-mono flex items-center gap-2 border ${
                step.gisHighlight === 'RED'
                  ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                  : step.gisHighlight === 'YELLOW'
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                  : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
              }`}
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{step.actionOutput}</span>
            </div>
          </div>

          {/* Right Column: Live Telemetry & System Synchronization Stage */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="p-4 rounded-xl bg-[#060a14] border border-cyan-900/40 relative overflow-hidden">
              <div className="text-[11px] font-mono text-cyan-400 mb-3 flex items-center justify-between">
                <span>SIMULTANEOUS SYSTEM CASCADE</span>
                <span className="text-[10px] text-slate-500">SYNCHRONIZED REACTIVE CANVAS</span>
              </div>

              {/* Multi-Component Reactive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Water Level & Ultrasonic Column */}
                <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                    <span>ULTRASONIC LEVEL</span>
                    <span className={`font-bold ${step.waterLevel >= 80 ? 'text-rose-400' : 'text-cyan-400'}`}>
                      {step.waterLevel}%
                    </span>
                  </div>

                  {/* Level Gauge Column */}
                  <div className="relative h-20 w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800 p-1 flex items-end">
                    <div
                      className={`w-full rounded transition-all duration-700 ease-out flex items-center justify-center font-mono text-[10px] font-bold ${
                        step.waterLevel >= 80
                          ? 'bg-gradient-to-t from-rose-700 via-rose-500 to-red-400 text-white shadow-lg shadow-rose-900/50'
                          : step.waterLevel >= 50
                          ? 'bg-gradient-to-t from-amber-600 to-yellow-400 text-slate-950'
                          : 'bg-gradient-to-t from-cyan-700 to-cyan-400 text-slate-950'
                      }`}
                      style={{ height: `${Math.max(step.waterLevel, 15)}%` }}
                    >
                      {step.waterLevel >= 30 && `${step.waterLevel}% FULL`}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>SENSOR: HC-SR04</span>
                    <span>DISTANCE: {Math.round(150 - (step.waterLevel * 150) / 100)} cm</span>
                  </div>
                </div>

                {/* 2. Physical Prototype Buzzer & LED State */}
                <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                    <span>HARDWARE BUZZER</span>
                    <span
                      className={`font-bold text-[11px] ${
                        step.buzzerActive ? 'text-rose-400 animate-pulse' : 'text-slate-500'
                      }`}
                    >
                      {step.buzzerActive ? 'AUDIO STROBE ON' : 'STANDBY'}
                    </span>
                  </div>

                  <div
                    className={`h-20 w-full rounded-lg flex flex-col items-center justify-center border transition-all duration-300 ${
                      step.buzzerActive
                        ? 'bg-rose-950/40 border-rose-500/80 shadow-lg shadow-rose-950/60'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border transition-transform ${
                        step.buzzerActive
                          ? 'bg-rose-500/20 border-rose-400 text-rose-300 scale-110 animate-bounce'
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}
                    >
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono mt-1 text-slate-400">
                      {step.buzzerActive ? '85dB PIEZO PULSE ACTIVE' : 'THRESHOLD < 85%'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>PIN: GPIO 23</span>
                    <span>NPN BUFFER: ENGAGED</span>
                  </div>
                </div>

                {/* 3. GIS Node Status Indicator */}
                <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                    <span>GIS NODE TD-004</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        step.gisHighlight === 'RED'
                          ? 'bg-rose-900/60 text-rose-300'
                          : step.gisHighlight === 'YELLOW'
                          ? 'bg-amber-900/60 text-amber-300'
                          : 'bg-emerald-900/60 text-emerald-300'
                      }`}
                    >
                      {step.gisHighlight}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                        step.gisHighlight === 'RED'
                          ? 'bg-rose-500/20 border-rose-400 text-rose-300 animate-ping'
                          : step.gisHighlight === 'YELLOW'
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="text-[11px] overflow-hidden">
                      <div className="font-semibold text-slate-200 truncate">Talon Dos Outfall Canal</div>
                      <div className="text-[10px] text-slate-500 font-mono">14.4372° N, 120.9988° E</div>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-slate-400">
                    FLOOD RISK: {step.gisHighlight === 'RED' ? 'HIGH / OVERFLOW' : 'MONITORED'}
                  </div>
                </div>

                {/* 4. Municipal Response Center Dispatch Status */}
                <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                    <span>CENRO DISPATCH QUEUE</span>
                    <span className="text-[10px] text-cyan-400">LGU LAS PIÑAS</span>
                  </div>

                  <div
                    className={`p-2.5 rounded border text-[11px] font-mono ${
                      step.step >= 6
                        ? 'bg-rose-950/30 border-rose-500/60 text-rose-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <Shield className="w-3.5 h-3.5 text-cyan-400" />
                      {step.step >= 6 ? 'TICKET #TD-9402 ISSUED' : 'MONITORING DISPATCH QUEUE'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {step.step >= 6
                        ? 'Dispatched: CENRO Desiltation Crew Unit 1'
                        : 'Standing by · Zero critical alarms active'}
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-slate-500">
                    BARANGAY TALON DOS DRRMO
                  </div>
                </div>
              </div>
            </div>

            {/* Live Data packet stream visual */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                TELEMETRY STREAM: TD-004 &gt;&gt; MQTT://lgu-cenro.gov.ph
              </span>
              <span className="text-cyan-400">LATENCY: 18ms</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-cyan-950/60 bg-[#060a14] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md shadow-cyan-950 transition-all active:scale-95"
            >
              {currentStepIndex === DEMO_STEPS.length - 1 ? 'Restart Demo' : 'Next Step'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleFinishAndApply}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 text-xs font-medium flex items-center gap-2 transition-colors"
            >
              <span>Explore Site in this State</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
