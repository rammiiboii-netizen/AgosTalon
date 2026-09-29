import React, { useState } from 'react';
import { X, FileText, CheckCircle, Cpu, Shield, BookOpen, Layers } from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BOM' | 'CIRCUIT' | 'SOP'>('OVERVIEW');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#090f1d] border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden text-slate-200 font-sans">
        {/* Header */}
        <div className="p-5 border-b border-cyan-950 bg-[#060a14] flex items-center justify-between shrink-0 font-mono">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-display font-bold text-base text-white">
                PROJECT TECHNICAL SPECIFICATIONS & DOCUMENTATION
              </h3>
              <p className="text-[10px] text-cyan-400">
                AEGISDRAIN // HACKATHON RESEARCH PAPER & FIELD MANUAL
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

        {/* Tab Strip */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-[#080d19] border-b border-cyan-950 text-xs font-mono shrink-0">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'OVERVIEW' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Project Summary
          </button>
          <button
            onClick={() => setActiveTab('BOM')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'BOM' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bill of Materials (BOM)
          </button>
          <button
            onClick={() => setActiveTab('CIRCUIT')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'CIRCUIT' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Firmware & Math
          </button>
          <button
            onClick={() => setActiveTab('SOP')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'SOP' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Barangay / CENRO SOP
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm leading-relaxed">
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              <h4 className="text-lg font-display font-bold text-white">
                Executive Hackathon Summary
              </h4>
              <p className="text-slate-300">
                <strong>AgosTalon</strong> is an Internet of Things (IoT) and geospatial disaster-risk mitigation system engineered specifically for Barangay Talon Dos, Las Piñas City. Talon Dos suffers frequent localized road inundation due to rapid stormwater runoff converging into subterranean box culverts along Alabang-Zapote Road, Casimiro Avenue, and low-lying Zapote River tributaries.
              </p>
              <p className="text-slate-300">
                Rather than treating flooding as an inevitable disaster to react to, AgosTalon monitors early hydraulic accumulation directly inside drainage culverts. By measuring acoustic air-gap clearance with an ultrasonic sensor and calculating rise velocity, the system identifies surcharge conditions long before water rises to road level.
              </p>
              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/40 font-mono text-xs text-cyan-300">
                <strong>Core Thesis:</strong> "Connecting the drain to the decision-maker allows municipal desiltation crews to clear localized trash blockages before street inundation occurs."
              </div>
            </div>
          )}

          {activeTab === 'BOM' && (
            <div className="space-y-4 font-mono text-xs">
              <h4 className="text-base font-display font-bold text-white">
                Physical Prototype Hardware Bill of Materials (BOM)
              </h4>
              <table className="w-full text-left divide-y divide-slate-800">
                <thead>
                  <tr className="text-slate-400 text-[11px]">
                    <th className="py-2">COMPONENT</th>
                    <th className="py-2">PART NUMBER / SPEC</th>
                    <th className="py-2">QTY</th>
                    <th className="py-2">EST. COST (PHP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="py-2 font-bold text-white">ESP32 Dev Board</td>
                    <td className="py-2 text-slate-300">ESP-WROOM-32 38-Pin Dual-Core 2.4GHz</td>
                    <td className="py-2">1</td>
                    <td className="py-2">₱240.00</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-white">Ultrasonic Sensor</td>
                    <td className="py-2 text-slate-300">HC-SR04 40kHz (or JSN-SR04T Waterproof)</td>
                    <td className="py-2">1</td>
                    <td className="py-2">₱85.00</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-white">Active Piezo Buzzer</td>
                    <td className="py-2 text-slate-300">5V 85dB Continuous Tone 2.3kHz</td>
                    <td className="py-2">1</td>
                    <td className="py-2">₱25.00</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-white">Rotary Potentiometer</td>
                    <td className="py-2 text-slate-300">10kΩ Linear Test Input / Calibration</td>
                    <td className="py-2">1</td>
                    <td className="py-2">₱20.00</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-white">NPN Transistor Buffer</td>
                    <td className="py-2 text-slate-300">2N2222 with 1kΩ base resistor for buzzer</td>
                    <td className="py-2">1</td>
                    <td className="py-2">₱8.00</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-white">Status LEDs + Enclosure</td>
                    <td className="py-2 text-slate-300">RGB Diffused LEDs + IP65 Junction Box</td>
                    <td className="py-2">1</td>
                    <td className="py-2">₱160.00</td>
                  </tr>
                </tbody>
              </table>
              <div className="text-right text-cyan-300 font-bold pt-2">
                TOTAL NODE PROTOTYPE COST: ~₱538.00 ($9.60 USD)
              </div>
            </div>
          )}

          {activeTab === 'CIRCUIT' && (
            <div className="space-y-4 font-mono text-xs">
              <h4 className="text-base font-display font-bold text-white">
                Edge Computation & Signal Processing Equations
              </h4>
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-cyan-400 font-bold block">1. Distance to Water Surface:</span>
                <code>Distance = (Duration_Echo_µs × 0.0343 cm/µs) / 2</code>
                <p className="text-slate-400 text-[11px] font-sans">
                  Where sound velocity is calibrated for 28°C ambient air temperature inside underground culverts.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-cyan-400 font-bold block">2. Rate-of-Rise (dH/dt) Condition Check:</span>
                <code>dH/dt = [ WaterLevel(t) - WaterLevel(t - Δt) ] / Δt</code>
                <p className="text-slate-400 text-[11px] font-sans">
                  If dH/dt &gt; 1.5 cm/min while downstream node exhibits baseline outflow, the system automatically infers potential hydraulic restriction rather than simple volume surge.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'SOP' && (
            <div className="space-y-3 font-sans text-xs">
              <h4 className="text-base font-display font-bold text-white font-mono">
                LGU Las Piñas CENRO & Barangay Talon Dos Operating Protocol
              </h4>
              <ol className="list-decimal pl-5 space-y-2 text-slate-300">
                <li>
                  <strong>Level 1 (Water &lt; 50%):</strong> Nominal drainage. Nodes log telemetry every 60 seconds.
                </li>
                <li>
                  <strong>Level 2 (Water 50% - 79%):</strong> Warning state. Sampling increases to 2 Hz. Barangay tanods alerted via automated SMS advisory.
                </li>
                <li>
                  <strong>Level 3 (Water &gt;= 80% or Potential Restriction):</strong> Critical threshold. Local 85dB street buzzer triggers. Emergency incident ticket automatically pushed to CENRO duty dispatch for immediate desiltation crew routing.
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cyan-950 bg-[#060a14] flex justify-end font-mono">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
