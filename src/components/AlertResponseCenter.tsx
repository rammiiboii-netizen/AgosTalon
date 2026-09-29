import React, { useState } from 'react';
import { 
  ShieldAlert, AlertTriangle, CheckCircle, Bell, ArrowRight, 
  Send, Users, Radio, Filter, Eye, Truck, Check, MapPin 
} from 'lucide-react';
import { AlertItem, SimulationState } from '../types';

interface AlertResponseCenterProps {
  alerts: AlertItem[];
  simulation: SimulationState;
  onAcknowledgeAlert: (id: string) => void;
  onDispatchTeam: (id: string, team: string) => void;
  onViewOnMap: (nodeCode: string) => void;
}

export const AlertResponseCenter: React.FC<AlertResponseCenterProps> = ({
  alerts,
  simulation,
  onAcknowledgeAlert,
  onDispatchTeam,
  onViewOnMap,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'NORMAL'>('ALL');
  const [activeDispatchAlert, setActiveDispatchAlert] = useState<AlertItem | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>('CENRO Desiltation Crew Unit 1');

  // Dynamic critical alert when simulated
  const isSimulationCritical = simulation.waterLevel >= 80 || simulation.drainageCondition === 'POSSIBLE_BLOCKAGE';

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'ALL') return true;
    return alert.severity === filter;
  });

  const handleConfirmDispatch = () => {
    if (activeDispatchAlert) {
      onDispatchTeam(activeDispatchAlert.id, selectedTeam);
      setActiveDispatchAlert(null);
    }
  };

  return (
    <section id="alert-center" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>INCIDENT COMMAND SYSTEM</span>
            <span>·</span>
            <span>MUNICIPAL OPERATIONS PROTOCOL</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold text-white tracking-tight">
            ALERT // RESPONSE CENTER
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Autonomous threshold alerting and rapid municipal dispatch workflow for Talon Dos drainage interventions.
          </p>
        </div>

        {/* Live Incident Status indicator */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400">ACTIVE INCIDENTS:</span>
          <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/50 text-rose-300 font-bold tabular-nums">
            {isSimulationCritical ? '1 CRITICAL' : '0 CRITICAL'}
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 font-bold tabular-nums">
            2 WARNINGS
          </span>
        </div>
      </div>

      {/* Main Grid: Priority Incident Action Card & Filterable History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Priority Active Incident Action Card */}
        <div className="lg:col-span-5 space-y-4">
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isSimulationCritical
                ? 'bg-[#12080d] border-rose-500/70 shadow-2xl shadow-rose-950/50 ring-1 ring-rose-500/30'
                : 'bg-[#090f1d] border-cyan-950'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-rose-950/60 mb-4">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    isSimulationCritical ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
                  }`}
                />
                <span className="text-xs font-mono font-bold tracking-wider text-rose-300 uppercase">
                  {isSimulationCritical ? '🔴 CRITICAL ALERT' : 'STATUS NOMINAL'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                10:42 PM PHT
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  {isSimulationCritical
                    ? 'Possible drainage blockage detected.'
                    : 'All arterial drainage trunks operating normally.'}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {isSimulationCritical
                    ? 'Abnormal water-level rise velocity detected at Talon Dos Central Outfall. Inflow velocity decelerating rapidly.'
                    : 'Current flow rates and culvert heights are within nominal seasonal parameters.'}
                </p>
              </div>

              {/* Node Telemetry Snapshot */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-rose-900/40 text-xs font-mono space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">NODE:</span>
                  <span className="font-bold text-white">TD-004</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">LOCATION:</span>
                  <span className="text-cyan-300">Talon Dos Central Outfall Canal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">WATER LEVEL:</span>
                  <span className="font-bold text-rose-400 tabular-nums">
                    {simulation.waterLevel}% (138 cm / 150 cm)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">DRAINAGE STATUS:</span>
                  <span className="font-bold text-rose-400">
                    {simulation.drainageCondition.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                <button
                  onClick={() => onViewOnMap('TD-004')}
                  className="py-2.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-colors min-h-[44px] active:scale-98"
                >
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>VIEW MAP</span>
                </button>

                <button
                  onClick={() => onAcknowledgeAlert('alert-01')}
                  className="py-2.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-colors min-h-[44px] active:scale-98"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ACKNOWLEDGE</span>
                </button>

                <button
                  onClick={() => setActiveDispatchAlert(alerts[0])}
                  className="py-2.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-rose-950 min-h-[44px] active:scale-95"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>DISPATCH</span>
                </button>
              </div>
            </div>
          </div>

          {/* Municipal Emergency Hotlines info */}
          <div className="p-4 rounded-xl bg-[#090f1d] border border-cyan-950 text-xs font-mono text-slate-400 space-y-1.5">
            <span className="text-slate-300 font-bold block">
              MUNICIPAL EMERGENCY PROTOCOLS:
            </span>
            <div className="flex justify-between text-[11px]">
              <span>CENRO Las Piñas Operations:</span>
              <span className="text-cyan-400">(02) 8872-3591</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Barangay Talon Dos DRRMO:</span>
              <span className="text-cyan-400">(02) 8871-1240</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Las Piñas Rescue Base:</span>
              <span className="text-cyan-400">161 // CDRRMO</span>
            </div>
          </div>
        </div>

        {/* Right Column: Filterable Alert Event Timeline */}
        <div className="lg:col-span-7 bg-[#090f1d] p-5 rounded-2xl border border-cyan-950 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-950/60 mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                INCIDENT EVENT LOG TIMELINE
              </span>

              {/* Segmented Filter Control */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono">
                {(['ALL', 'CRITICAL', 'WARNING', 'NORMAL'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      filter === tab
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* List of alerts */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {filteredAlerts.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border text-xs font-mono transition-all ${
                    item.severity === 'CRITICAL'
                      ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                      : item.severity === 'WARNING'
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.severity === 'CRITICAL'
                            ? 'bg-rose-400'
                            : item.severity === 'WARNING'
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                      <span className="font-bold text-white">{item.nodeCode}</span>
                      <span className="text-slate-400 font-sans text-[11px]">
                        · {item.location}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 tabular-nums">
                      {item.timestamp}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 mb-2 font-sans leading-relaxed">
                    {item.message}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-[10px]">
                    <div className="flex items-center gap-3">
                      <span>
                        WATER: <strong className="tabular-nums">{item.waterLevel}%</strong>
                      </span>
                      <span>
                        DRAINAGE: <strong>{item.drainageStatus}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.dispatched ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-bold">
                          <CheckCircle className="w-3 h-3" />
                          {item.dispatchedTeam || 'DISPATCHED'}
                        </span>
                      ) : item.acknowledged ? (
                        <span className="text-cyan-400 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          ACKNOWLEDGED
                        </span>
                      ) : (
                        <button
                          onClick={() => setActiveDispatchAlert(item)}
                          className="px-2 py-0.5 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-500/40 text-[10px] font-bold"
                        >
                          DISPATCH TEAM
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-cyan-950 text-[11px] font-mono text-slate-500 flex items-center justify-between">
            <span>AUTOMATED INCIDENT ESCALATION PROTOCOL</span>
            <span>AUDIT TRAIL LOGGED</span>
          </div>
        </div>
      </div>

      {/* Dispatch Modal */}
      {activeDispatchAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#090f1d] border border-cyan-500/50 rounded-2xl p-6 shadow-2xl text-slate-100 font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-950 mb-4">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-400" />
                <h3 className="font-display font-bold text-base text-white">
                  MUNICIPAL DISPATCH ORDER
                </h3>
              </div>
              <button
                onClick={() => setActiveDispatchAlert(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block mb-1 text-[10px]">TARGET LOCATION:</span>
                <p className="font-bold text-white font-sans text-sm">
                  {activeDispatchAlert.location} ({activeDispatchAlert.nodeCode})
                </p>
                <p className="text-rose-400 mt-1">
                  Water: {activeDispatchAlert.waterLevel}% · Status: {activeDispatchAlert.drainageStatus}
                </p>
              </div>

              <div>
                <label className="text-slate-400 uppercase text-[10px] block mb-2 font-semibold">
                  SELECT RESPONSE CREW:
                </label>
                <div className="space-y-2">
                  {[
                    'CENRO Desiltation Crew Unit 1 (Heavy Suction)',
                    'Barangay Talon Dos Quick DRRMO Siphon Team',
                    'Traffic & Road Safety Flood Signage Unit',
                  ].map((team) => (
                    <button
                      key={team}
                      onClick={() => setSelectedTeam(team)}
                      className={`w-full p-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${
                        selectedTeam === team
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-200 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>{team}</span>
                      {selectedTeam === team && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={() => setActiveDispatchAlert(null)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDispatch}
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950 active:scale-95 transition-all"
                >
                  AUTHORIZE DISPATCH
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
