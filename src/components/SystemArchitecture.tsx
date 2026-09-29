import React, { useState } from 'react';
import { 
  Cpu, Wifi, Database, LayoutDashboard, 
  Map, Server, Shield, Sparkles, Check 
} from 'lucide-react';

interface LayerInfo {
  id: string;
  name: string;
  category: string;
  components: string[];
  techStack: string;
  description: string;
  specs: { label: string; val: string }[];
}

const LAYERS: LayerInfo[] = [
  {
    id: 'physical',
    name: 'PHYSICAL SENSING LAYER',
    category: 'HARDWARE & EDGE TRANSDUCERS',
    components: ['ESP32 MCU (Dual-Core 240MHz)', 'HC-SR04 Ultrasonic Acoustic Sensor', 'Active Piezo Buzzer (85dB)', 'Calibration Potentiometer'],
    techStack: 'C++ / FreeRTOS / Arduino Framework / GPIO Interrupts',
    description:
      'Installed at culvert crowns and canal manholes across Talon Dos. Non-contact ultrasonic measurement measures water clearance continuously while the active buzzer provides autonomous local alarms.',
    specs: [
      { label: 'Sampling Rate', val: '2.0 Hz continuous' },
      { label: 'Power Draw', val: '80 mA active / 15 µA deep-sleep' },
      { label: 'Ingress Protection', val: 'IP65 Weatherproof Sealed' },
    ],
  },
  {
    id: 'connectivity',
    name: 'CONNECTIVITY LAYER',
    category: 'TELEMETRY TRANSMISSION BUS',
    components: ['Wi-Fi 802.11 b/g/n (2.4 GHz)', 'LoRaWAN Long-Range Fallback (433MHz)', 'TLS Encrypted MQTT Broker', 'Cellular GSM SIM7600 Backup'],
    techStack: 'MQTT v3.1.1 / WSS / HTTPS REST / QoS Level 1',
    description:
      'Transmits telemetry packets from street catch basins to cloud ingestion servers. Features store-and-forward offline buffer for uninterrupted data during typhoon signal loss.',
    specs: [
      { label: 'Payload Size', val: '128 Bytes / reading' },
      { label: 'Network Latency', val: '< 120 ms end-to-end' },
      { label: 'Retry Policy', val: 'Exponential backoff with SPIFFS cache' },
    ],
  },
  {
    id: 'backend',
    name: 'BACKEND & ANALYTICS LAYER',
    category: 'HYDRAULIC ENGINE & ALERT DISPATCH',
    components: ['Express / Node.js API Gateway', 'PostgreSQL / TimescaleDB Time-Series', 'Rate-of-Change dH/dt Alert Engine', 'Municipal SMS / Webhook Gateway'],
    techStack: 'TypeScript / Node.js / Drizzle ORM / Redis Cache',
    description:
      'Ingests streaming telemetry from all 12 Talon Dos nodes, filters anomalies, compares water-level rise against rainfall thresholds, and triggers multi-channel emergency escalations.',
    specs: [
      { label: 'Ingestion Throughput', val: '5,000 events/sec' },
      { label: 'Rule Evaluation', val: '< 5 ms per telemetry packet' },
      { label: 'Audit Trail', val: 'Immutable incident logging' },
    ],
  },
  {
    id: 'application',
    name: 'APPLICATION & DISPATCH LAYER',
    category: 'MUNICIPAL COMMAND CONSOLE',
    components: ['Authorized CENRO Las Piñas Portal', 'Barangay Talon Dos DRRMO Dispatch Desk', 'Automated Work Order Tickets', 'Citizen SMS Advisory Queue'],
    techStack: 'React / Tailwind CSS / WebSocket Live Feed / Role-Based Access',
    description:
      'Provides duty disaster officers with actionable insight: which canal is overflowing, why it is backing up, and which maintenance team is closest to resolve the hazard.',
    specs: [
      { label: 'Role Access', val: 'CENRO Officer / Barangay Admin / Field Tech' },
      { label: 'Work Orders', val: 'Automated GPS Ticket Generation' },
      { label: 'Device Support', val: 'Responsive Web Desktop & Mobile MDT' },
    ],
  },
  {
    id: 'gis',
    name: 'GEOSPATIAL RISK MAPPING LAYER',
    category: 'TALON DOS SPATIAL ENGINE',
    components: ['Interactive Leaflet Canvas', 'Digital Elevation Model (DEM) Contours', 'Zapote River Tributary Overlay', 'Dynamic Flood-Risk Heatmap'],
    techStack: 'GeoJSON / Leaflet / CartoDB Dark Matter / WGS84 Coordinates',
    description:
      'Translates raw millimeter water measurements into human-comprehensible spatial hazard zones. Visualizes backwater road flooding risk along Alabang-Zapote Road and Casimiro Village.',
    specs: [
      { label: 'Coordinate System', val: 'EPSG:4326 (Latitude / Longitude)' },
      { label: 'Heatmap Resolution', val: 'Dynamic 50m radial kernel' },
      { label: 'Layer Stacking', val: 'Multi-toggle vectorized vectors' },
    ],
  },
];

export const SystemArchitecture: React.FC = () => {
  const [activeLayerId, setActiveLayerId] = useState<string>('physical');

  const activeLayer = LAYERS.find((l) => l.id === activeLayerId) || LAYERS[0];

  return (
    <section id="architecture" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>FULL-STACK SYSTEM TOPOLOGY</span>
            <span>·</span>
            <span>HARDWARE TO GEOSPATIAL CLOUD</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold text-white tracking-tight">
            SYSTEM ARCHITECTURE & DATA STACK
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Modular multi-tier architecture enabling scalable municipal environmental monitoring and automated emergency alerting.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Stack of Layers */}
        <div className="lg:col-span-6 space-y-2.5">
          {LAYERS.map((layer, idx) => {
            const isSelected = activeLayerId === layer.id;
            return (
              <div
                key={layer.id}
                onMouseEnter={() => setActiveLayerId(layer.id)}
                onClick={() => setActiveLayerId(layer.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-400 shadow-xl shadow-cyan-950/50 ring-1 ring-cyan-400/40 translate-x-1'
                    : 'bg-[#080d19] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-cyan-400 font-bold">
                      LAYER 0{idx + 1}
                    </span>
                    <span className="text-slate-500 text-xs">·</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {layer.category}
                    </span>
                  </div>

                  {isSelected && (
                    <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-900/60 px-2 py-0.5 rounded border border-cyan-700/60">
                      INSPECTING
                    </span>
                  )}
                </div>

                <h3 className="text-base font-display font-bold text-white mb-2">
                  {layer.name}
                </h3>

                {/* Sub components pills */}
                <div className="flex flex-wrap gap-1.5">
                  {layer.components.map((c, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Stage: Detailed Technical Layer Inspection */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-[#090f1d] border border-cyan-500/40 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cyan-950">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-widest block">
                {activeLayer.category}
              </span>
              <h3 className="text-xl font-display font-bold text-white">
                {activeLayer.name}
              </h3>
            </div>
          </div>

          <div className="space-y-3 text-xs font-sans text-slate-300 leading-relaxed">
            <p className="text-sm">{activeLayer.description}</p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1">
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                TECHNOLOGY IMPLEMENTATION:
              </span>
              <p className="text-cyan-300 font-semibold">{activeLayer.techStack}</p>
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-semibold">
                SYSTEM SPECIFICATIONS & GUARANTEES
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
                {activeLayer.specs.map((s, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">{s.label}</span>
                    <span className="text-white font-bold">{s.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-[11px] font-mono text-slate-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Production-ready design: Separated concerns allow future expansion to all 20 barangays of Las Piñas.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
