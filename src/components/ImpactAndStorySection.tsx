import React, { useState } from 'react';
import { 
  ShieldAlert, Activity, CheckCircle, ArrowUpRight, 
  MapPin, Bell, Radio, Eye, Sparkles, AlertCircle 
} from 'lucide-react';

export const ImpactAndStorySection: React.FC = () => {
  const [activeInnovation, setActiveInnovation] = useState<number>(0);

  const innovations = [
    {
      title: 'SMART DETECTION',
      subtitle: 'ACOUSTIC WATER ELEVATION',
      desc: 'Non-contact ultrasonic acoustic sensing continuously measures distance to the drainage surface without corrosive water submersion or debris fouling.',
      impact: 'Eliminates optical sensor fouling · 0.3 cm precision · Edge computing on ESP32',
      tech: 'HC-SR04 Transducer Array + Rolling Median DSP Filter',
    },
    {
      title: 'CONNECTED RESPONSE',
      subtitle: 'CLOSED-LOOP ESCALATION',
      desc: 'Autonomous threshold rules trigger street-level audible piezo sirens and push instant incident tickets directly to CENRO and Barangay DRRMO dispatchers.',
      impact: 'Reduces reporting delay from 45 mins to < 2 seconds · Eliminates citizen call latency',
      tech: 'ESP32 GPIO Transistor + Encrypted MQTT Incident Bus',
    },
    {
      title: 'GEOSPATIAL AWARENESS',
      subtitle: 'GIS RISK VISUALIZATION',
      desc: 'Monitored culvert nodes are mapped onto Talon Dos digital elevation contours, displaying potential backwater accumulation zones on an interactive radar.',
      impact: 'Enables strategic prepositioning of vacuum trucks and emergency sandbagging',
      tech: 'WGS84 Leaflet Engine + Dynamic Elevation Runoff Contours',
    },
  ];

  return (
    <section id="impact" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      {/* 19. Project Story */}
      <div className="rounded-3xl bg-gradient-to-b from-[#090f1d] via-[#070c17] to-[#090f1d] border border-cyan-950 p-8 sm:p-12 relative overflow-hidden">
        <div className="max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-rose-950/60 border border-rose-500/40 text-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>THE REALITY OF URBAN FLOODING IN LAS PIÑAS</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight leading-[1.1] text-balance">
            A FLOOD DOESN'T START WHEN THE STREET IS ALREADY UNDERWATER.
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            It starts silently inside an underground box culvert along Alabang-Zapote Road or Casimiro Avenue, where accumulated silt, plastic trash, or fallen tree branches restrict stormwater outflow during an afternoon monsoon downpour.
          </p>

          {/* 5 Core Vulnerabilities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
              <span className="text-cyan-400 font-bold block mb-1">01. INVISIBLE ACCUMULATION</span>
              <p className="text-slate-400 font-sans text-xs">
                Drainage restrictions remain hidden underground until water breaches street curbs.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
              <span className="text-cyan-400 font-bold block mb-1">02. EXPONENTIAL RISE</span>
              <p className="text-slate-400 font-sans text-xs">
                During tropical Habagat squalls, culvert water rises by several centimeters every minute.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
              <span className="text-cyan-400 font-bold block mb-1">03. PATROL BOTTLENECK</span>
              <p className="text-slate-400 font-sans text-xs">
                CENRO officers cannot manually pry open hundreds of manholes during an active storm.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
              <span className="text-cyan-400 font-bold block mb-1">04. ISOLATED REPORTING</span>
              <p className="text-slate-400 font-sans text-xs">
                Citizen 911 phone reports arrive only after vehicles are already submerged and traffic is stranded.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono sm:col-span-2">
              <span className="text-cyan-400 font-bold block mb-1">05. LACK OF CENTRALIZED GEOSPATIAL CLARITY</span>
              <p className="text-slate-400 font-sans text-xs">
                Disaster managers need a single visual radar showing which specific culvert outfall has halted discharge.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-sm font-display font-bold text-cyan-300">
              "So we built a system that connects the drain directly to the decision-maker."
            </div>
          </div>
        </div>
      </div>

      {/* 20. The Innovation: 3 Interactive Cards */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-mono text-cyan-400 mb-1">CORE METHODOLOGY</div>
            <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
              THE THREE INNOVATION PILLARS
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {innovations.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setActiveInnovation(idx)}
              className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                activeInnovation === idx
                  ? 'bg-[#0b1324] border-cyan-400 shadow-2xl shadow-cyan-950/60 ring-1 ring-cyan-400/50'
                  : 'bg-[#080d19] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold block mb-1">
                  {item.subtitle}
                </span>
                <h4 className="text-xl font-display font-bold text-white mb-3">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-300 font-sans leading-relaxed mb-4">
                  {item.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-2 text-xs font-mono">
                <div className="text-cyan-300 font-semibold text-[11px]">
                  ✓ {item.impact}
                </div>
                <div className="text-[10px] text-slate-500">
                  STACK: {item.tech}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 18. Measurable System Goals */}
      <div className="p-8 rounded-2xl bg-[#080d19] border border-cyan-950 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cyan-950/60 mb-6">
          <div>
            <div className="text-xs font-mono text-cyan-400 mb-1">MEASURABLE OUTCOMES</div>
            <h3 className="text-xl sm:text-2xl font-display font-bold text-white">
              COMMUNITY DISASTER PREPAREDNESS IMPACT CHAIN
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded border border-slate-800">
            SIMULATED BENCHMARK GOALS
          </span>
        </div>

        {/* Chain Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold block mb-1">STAGE 1</span>
              <h5 className="font-display font-bold text-white text-sm mb-1">EARLIER DETECTION</h5>
              <p className="text-[11px] text-slate-400 leading-snug">
                Detects culvert surcharge 20–40 mins before surface street water pooling.
              </p>
            </div>
            <div className="mt-3 text-cyan-400 font-mono text-xs font-bold">
              ↑ +85% Lead Time
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold block mb-1">STAGE 2</span>
              <h5 className="font-display font-bold text-white text-sm mb-1">CENTRALIZED MONITORING</h5>
              <p className="text-[11px] text-slate-400 leading-snug">
                Continuous telemetry across 12 strategic drainage trunks simultaneously.
              </p>
            </div>
            <div className="mt-3 text-cyan-400 font-mono text-xs font-bold">
              ↑ 100% Drainage Visibility
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold block mb-1">STAGE 3</span>
              <h5 className="font-display font-bold text-white text-sm mb-1">LOCATION-BASED RESPONSE</h5>
              <p className="text-[11px] text-slate-400 leading-snug">
                Coordinates direct CENRO vacuum and desiltation crews to exact GPS nodes.
              </p>
            </div>
            <div className="mt-3 text-cyan-400 font-mono text-xs font-bold">
              ↑ Pinpoint Routing
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold block mb-1">STAGE 4</span>
              <h5 className="font-display font-bold text-white text-sm mb-1">FASTER INFORMATION FLOW</h5>
              <p className="text-[11px] text-slate-400 leading-snug">
                Replaces delayed citizen phone escalations with 2-second automated alert tickets.
              </p>
            </div>
            <div className="mt-3 text-cyan-400 font-mono text-xs font-bold">
              ↑ Instant Escalation
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-cyan-300 font-bold block mb-1">OUTCOME</span>
              <h5 className="font-display font-bold text-white text-sm mb-1">COMMUNITY PREPAREDNESS</h5>
              <p className="text-[11px] text-slate-300 leading-snug">
                Fewer impassable arterial roads, minimized business downtime, and safer barangay residents.
              </p>
            </div>
            <div className="mt-3 text-cyan-300 font-mono text-xs font-bold">
              ★ Flood Resilience
            </div>
          </div>
        </div>
      </div>

      {/* 28. Scientific Accuracy & Data Distinction Box */}
      <div className="p-6 rounded-2xl bg-[#060a14] border border-slate-800 font-mono text-xs text-slate-300 space-y-3">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>SCIENTIFIC INTEGRITY & DATA GOVERNANCE DISCLAIMER</span>
        </div>
        <p className="text-slate-400 leading-relaxed font-sans text-xs">
          To maintain utmost technical credibility during judging: AgosTalon is engineered to <strong>detect abnormal water-level and drainage surcharge conditions</strong> and <strong>visualize potential flood risk</strong>. The ultrasonic sensor measures non-contact acoustic distance and infers restrictions from abnormal rate-of-rise metrics—it does not claim direct optical imaging of subterranean debris.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px]">
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-emerald-400 font-bold block mb-0.5">● MONITORED DATA</span>
            <span className="text-slate-400">Live distance readings from prototype ESP32 ultrasonic transducer.</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-cyan-400 font-bold block mb-0.5">● SIMULATED DATA</span>
            <span className="text-slate-400">Interactive hydrological scenarios & What-If rainfall runoff testing.</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-amber-400 font-bold block mb-0.5">● HISTORICAL DATA</span>
            <span className="text-slate-400">Barangay Talon Dos elevation benchmarks & historical overflow basins.</span>
          </div>
        </div>
      </div>
    </section>
  );
};
