import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Unlock, Radio, Server, Activity, 
  Send, Users, CheckCircle, AlertTriangle, Battery, Wifi,
  ExternalLink, Bell, Smartphone, RefreshCw, Info, Check, AlertCircle
} from 'lucide-react';
import { DrainageNode, SimulationState } from '../types';
import { transmitNtfyMunicipalAlert, NTFY_TOPIC, NTFY_SERVER_URL, NtfyResponseResult } from '../utils/ntfy';

interface AuthorizedResponsePortalProps {
  nodes: DrainageNode[];
  simulation: SimulationState;
  activeNodeCode?: string;
  onViewOnMap?: (nodeCode: string) => void;
}

export const AuthorizedResponsePortal: React.FC<AuthorizedResponsePortalProps> = ({
  nodes,
  simulation,
  activeNodeCode = 'TD-004',
  onViewOnMap,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [officerBadge, setOfficerBadge] = useState('ENG-LP-9104');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [ntfyResult, setNtfyResult] = useState<NtfyResponseResult | null>(null);
  const [selectedTargetCode, setSelectedTargetCode] = useState<string>(activeNodeCode);

  // Sync selected target code if activeNodeCode changes and no manual override
  React.useEffect(() => {
    if (activeNodeCode) {
      setSelectedTargetCode(activeNodeCode);
    }
  }, [activeNodeCode]);

  // Find targeted drainage node from IoT Prototype
  const targetedNode = 
    nodes.find((n) => n.code === selectedTargetCode) || 
    nodes.find((n) => n.severity === 'CRITICAL') || 
    nodes[0];

  // Hydraulic data made from the dials in the IoT Prototype
  const waterLevel = targetedNode.waterLevel;
  const flowVelocity = targetedNode.flowVelocityMps ?? (targetedNode.severity === 'CRITICAL' ? 0.3 : 1.2);
  const distanceToSensorCm = Math.max(5, Math.round(150 - (waterLevel * 150) / 100));
  const waterDepthCm = targetedNode.waterDepthCm || Math.round((waterLevel * targetedNode.maxCanalDepthCm) / 100);

  const isClogged = 
    targetedNode.severity === 'CRITICAL' || 
    targetedNode.drainageStatus === 'POSSIBLE BLOCKAGE' ||
    (waterLevel >= 68 && flowVelocity <= 0.6);

  const isWarning = 
    !isClogged && (targetedNode.severity === 'WARNING' || waterLevel >= 50 || flowVelocity <= 0.8);

  const alertStatus: 'CRITICAL' | 'WARNING' | 'NORMAL' = isClogged
    ? 'CRITICAL'
    : isWarning
    ? 'WARNING'
    : 'NORMAL';

  // Compute live statistics based on nodes and simulation
  const criticalCount = nodes.filter((n) => n.severity === 'CRITICAL').length || (isClogged ? 1 : 0);
  const warningCount = nodes.filter((n) => n.severity === 'WARNING').length || (isWarning ? 1 : 0);
  const activeAlertsCount = criticalCount + warningCount;
  const offlineCount = simulation.sensorStatus === 'OFFLINE' ? 1 : 0;
  const activeNodesCount = 12 - offlineCount;

  // Transmit Municipal Alert via ntfy (Topic: barangay-drain-TDCSHS)
  const handleTransmitAlert = async () => {
    setIsTransmitting(true);
    setNtfyResult(null);

    const result = await transmitNtfyMunicipalAlert({
      nodeCode: targetedNode.code,
      nodeName: targetedNode.name,
      locationDesc: targetedNode.locationDesc,
      waterLevel,
      distanceToSensorCm,
      waterDepthCm,
      flowVelocity,
      isClogged,
      severity: alertStatus,
      officerBadge,
    });

    setIsTransmitting(false);
    setNtfyResult(result);

    // Auto-dismiss result banner after 12 seconds
    setTimeout(() => {
      setNtfyResult(null);
    }, 12000);
  };

  return (
    <section id="cenro-portal" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="rounded-2xl bg-[#090f1d] border border-cyan-500/30 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        {/* Top Municipal Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cyan-950/70 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400">
                  AUTHORIZED RESPONSE PORTAL
                </span>
                <span className="text-[10px] font-mono bg-cyan-900/60 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                  BARANGAY / CENRO ACCESS
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-tight">
                MUNICIPAL EMERGENCY COMMAND DESK
              </h2>
            </div>
          </div>

          {/* Simulated Authentication Badge */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>OFFICER: {officerBadge}</span>
            </div>

            <button
              onClick={() => setIsAuthenticated(!isAuthenticated)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isAuthenticated ? <Lock className="w-3.5 h-3.5 text-cyan-400" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{isAuthenticated ? 'Session Active' : 'Authenticate'}</span>
            </button>
          </div>
        </div>

        {/* Dashboard 4 Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-[#060a14] border border-cyan-950">
            <span className="text-xs font-mono text-slate-400 block mb-1">
              ACTIVE MONITORING NODES
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-display font-bold text-white tabular-nums">
                {activeNodesCount}
              </span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                ONLINE
              </span>
            </div>
            <div className="mt-2 text-[10px] font-mono text-slate-500">
              12 TOTAL SENSORS INSTALLED
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#060a14] border border-cyan-950">
            <span className="text-xs font-mono text-slate-400 block mb-1">
              ACTIVE INCIDENTS
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-display font-bold text-amber-400 tabular-nums">
                {activeAlertsCount}
              </span>
              <span className="text-xs font-mono text-amber-400">QUEUED</span>
            </div>
            <div className="mt-2 text-[10px] font-mono text-slate-500">
              {warningCount} WARNINGS · {criticalCount} CRITICAL
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#060a14] border border-cyan-950">
            <span className="text-xs font-mono text-slate-400 block mb-1">
              CRITICAL LOCATIONS
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-display font-bold text-rose-400 tabular-nums">
                {criticalCount}
              </span>
              <span className="text-xs font-mono text-rose-400">DISPATCH PRIORITY</span>
            </div>
            <div className="mt-2 text-[10px] font-mono text-slate-500">
              {targetedNode.code} OUTFLOW FOCUS
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#060a14] border border-cyan-950">
            <span className="text-xs font-mono text-slate-400 block mb-1">
              PUSH NOTIFICATION CHANNEL
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-mono font-bold text-cyan-400 truncate max-w-[140px]" title={NTFY_TOPIC}>
                {NTFY_TOPIC}
              </span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                NTFY
              </span>
            </div>
            <div className="mt-2 text-[10px] font-mono text-slate-500">
              ntfy.sh/{NTFY_TOPIC}
            </div>
          </div>
        </div>

        {/* Section 16: Sensor Health & Telemetry Inspection Table */}
        <div className="p-5 rounded-xl bg-[#060a14] border border-cyan-950 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 mb-4 gap-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold">
                NODE HEALTH & TELEMETRY REGISTRY
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              CLICK ANY ROW TO TARGET FOR MUNICIPAL PUSH NOTIFICATION
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="pb-2.5 font-semibold">NODE</th>
                  <th className="pb-2.5 font-semibold">LOCATION NAME</th>
                  <th className="pb-2.5 font-semibold">WATER LEVEL</th>
                  <th className="pb-2.5 font-semibold">STATUS</th>
                  <th className="pb-2.5 font-semibold">BATTERY</th>
                  <th className="pb-2.5 font-semibold">SIGNAL (RSSI)</th>
                  <th className="pb-2.5 font-semibold">LAST PING</th>
                  <th className="pb-2.5 font-semibold">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {nodes.slice(0, 8).map((node) => {
                  const isSelected = node.code === selectedTargetCode;
                  const nodeWater = node.waterLevel;
                  const isClog = node.severity === 'CRITICAL' || node.drainageStatus === 'POSSIBLE BLOCKAGE';
                  const isWarn = !isClog && (node.severity === 'WARNING' || nodeWater >= 50);

                  let statusBadge = (
                    <span className="inline-flex items-center gap-1.5 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      NORMAL
                    </span>
                  );

                  if (isClog) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 text-rose-400 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                        CRITICAL CLOG
                      </span>
                    );
                  } else if (isWarn) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 text-amber-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        WARNING
                      </span>
                    );
                  }

                  return (
                    <tr 
                      key={node.id} 
                      onClick={() => setSelectedTargetCode(node.code)}
                      className={`hover:bg-cyan-950/30 transition-colors cursor-pointer ${
                        isSelected ? 'bg-cyan-950/50 border-l-2 border-cyan-400' : ''
                      }`}
                    >
                      <td className="py-2.5 font-bold text-white flex items-center gap-1.5">
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                        <span>{node.code}</span>
                      </td>
                      <td className="py-2.5 text-slate-300 font-sans text-xs max-w-[200px] truncate">
                        {node.name}
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold tabular-nums ${
                              nodeWater >= 80 ? 'text-rose-400' : nodeWater >= 50 ? 'text-amber-400' : 'text-slate-300'
                            }`}
                          >
                            {nodeWater}%
                          </span>
                          <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                nodeWater >= 80 ? 'bg-rose-500' : nodeWater >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${nodeWater}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5">{statusBadge}</td>
                      <td className="py-2.5 text-slate-400 tabular-nums">
                        {node.batteryPercent}%
                      </td>
                      <td className="py-2.5 text-slate-400 tabular-nums">
                        {node.signalRssi} dBm
                      </td>
                      <td className="py-2.5 text-slate-500 text-[10px] tabular-nums">
                        {node.lastUpdate}
                      </td>
                      <td className="py-2.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTargetCode(node.code);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                            isSelected 
                              ? 'bg-cyan-600 text-white border-cyan-400 font-bold' 
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-cyan-400'
                          }`}
                        >
                          {isSelected ? 'SELECTED' : 'SELECT'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TRANSMIT MUNICIPAL ALERT COMMAND BAR (NTFY APP INTEGRATION) */}
        {/* ========================================================================= */}
        <div className="p-5 rounded-xl bg-gradient-to-r from-slate-950 via-[#0a1224] to-slate-950 border-2 border-cyan-500/70 shadow-2xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-cyan-900/60">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 shrink-0 mt-0.5">
                <Bell className="w-5 h-5 animate-pulse text-cyan-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white block">
                    TRANSMIT MUNICIPAL ALERT // NTFY PUSH NOTIFICATION
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono font-bold">
                    TOPIC: {NTFY_TOPIC}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Sends a real-time push notification to all subscribed disaster responders on the <strong>ntfy app</strong> ({NTFY_TOPIC}). Contains live ultrasonic & potentiometer dial metrics from the IoT Prototype, drainage clog location, and urgency severity.
                </p>
              </div>
            </div>

            {/* Direct Link to View ntfy Feed */}
            <a
              href={NTFY_SERVER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-cyan-950 border border-cyan-700/60 text-cyan-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors shrink-0 self-start lg:self-center"
              title="Open public ntfy.sh topic feed in new tab"
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>OPEN NTFY FEED</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Live Telemetry Payload Preview Card (Shows the data that is made from the dials) */}
          <div className="p-4 rounded-xl bg-[#050913] border border-cyan-900/80 text-xs font-mono space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                LIVE IOT PROTOTYPE DIAL METRICS READY FOR TRANSMISSION:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Target Node:</span>
                <select
                  value={selectedTargetCode}
                  onChange={(e) => setSelectedTargetCode(e.target.value)}
                  className="px-2 py-1 rounded bg-slate-900 border border-cyan-700 text-white font-bold text-xs"
                >
                  {nodes.map((n) => (
                    <option key={n.code} value={n.code}>
                      {n.code} - {n.name.split('//')[0].trim()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Dial 1: Ultrasonic Echo Metric */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">ULTRASONIC SENSOR DIAL</span>
                <div className="text-sm font-bold text-white">
                  {waterLevel}% <span className="text-[11px] font-normal text-slate-300">({waterDepthCm} cm depth)</span>
                </div>
                <div className={`text-[10px] mt-1 font-semibold ${distanceToSensorCm <= 25 ? 'text-rose-400' : 'text-cyan-400'}`}>
                  {distanceToSensorCm} cm to sensor {distanceToSensorCm <= 25 ? '(CLOSING IN!)' : ''}
                </div>
              </div>

              {/* Dial 2: Flow Velocity Potentiometer Metric */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">FLOW VELOCITY DIAL</span>
                <div className="text-sm font-bold text-white">
                  {flowVelocity.toFixed(1)} m/s <span className="text-[11px] font-normal text-slate-300">(~{Math.round(flowVelocity * 12)} L/min)</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  ADC: {Math.round((flowVelocity / 2.5) * 4095)} / 4095
                </div>
              </div>

              {/* Target Clogged Drainage Node */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">MONITORED DRAINAGE NODE</span>
                <div className="text-sm font-bold text-cyan-300 truncate" title={targetedNode.name}>
                  {targetedNode.code}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-1" title={targetedNode.locationDesc}>
                  {targetedNode.name.split('//')[0].trim()}
                </div>
              </div>

              {/* Alert Severity Status */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">ALERT CLASSIFICATION</span>
                <div className="text-sm font-bold flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      alertStatus === 'CRITICAL'
                        ? 'bg-rose-500 animate-ping'
                        : alertStatus === 'WARNING'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                  />
                  <span
                    className={
                      alertStatus === 'CRITICAL'
                        ? 'text-rose-400 font-bold'
                        : alertStatus === 'WARNING'
                        ? 'text-amber-400 font-bold'
                        : 'text-emerald-400 font-bold'
                    }
                  >
                    {alertStatus === 'CRITICAL'
                      ? 'CRITICAL ALERT'
                      : alertStatus === 'WARNING'
                      ? 'ALERT WARNING'
                      : 'NORMAL'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {isClogged ? 'Clogged / Debris Obstruction' : alertStatus === 'WARNING' ? 'Restricted Flow' : 'Clear Gravity Flow'}
                </div>
              </div>
            </div>
          </div>

          {/* Action Row: TRANSMIT MUNICIPAL ALERT BUTTON */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Target Subscription: <strong>https://ntfy.sh/{NTFY_TOPIC}</strong></span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleTransmitAlert}
                disabled={isTransmitting}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl ${
                  isTransmitting
                    ? 'bg-cyan-800 text-white cursor-wait opacity-80'
                    : alertStatus === 'CRITICAL'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/80 ring-2 ring-rose-400 active:scale-95'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950 active:scale-95'
                }`}
              >
                {isTransmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>TRANSMITTING TO NTFY...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>TRANSMIT MUNICIPAL ALERT</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Transmission Feedback Banner */}
          {ntfyResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-mono shadow-xl flex items-start justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                ntfyResult.success
                  ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
                  : 'bg-rose-950/90 border-rose-500 text-rose-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {ntfyResult.success ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {ntfyResult.success
                      ? `✓ NOTIFICATION TRANSMITTED TO NTFY // "${NTFY_TOPIC}"`
                      : `⚠️ TRANSMISSION FAILED: ${ntfyResult.error}`}
                  </div>
                  <p className="text-[11px] mt-0.5 text-slate-200">
                    {ntfyResult.success ? (
                      <>
                        Published {ntfyResult.statusType} telemetry for <strong>{targetedNode.code} ({targetedNode.name.split('//')[0].trim()})</strong> at {ntfyResult.timestamp}. Responders subscribed to topic <strong>{NTFY_TOPIC}</strong> have received this push alert.
                      </>
                    ) : (
                      'Could not reach ntfy.sh server. Please verify internet connectivity.'
                    )}
                  </p>
                </div>
              </div>

              {ntfyResult.success && (
                <a
                  href={NTFY_SERVER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1 transition-colors shrink-0"
                >
                  <span>VIEW ON NTFY</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Hackathon Disclaimer footer */}
        <div className="mt-4 text-[10px] font-mono text-slate-500 text-center">
          *LIVE PUSH SERVICE: Transmits to public topic <strong>ntfy.sh/{NTFY_TOPIC}</strong>. Install the free <em>ntfy</em> app on Android or iOS and subscribe to <strong>{NTFY_TOPIC}</strong> to receive live municipal flood alerts.
        </div>
      </div>
    </section>
  );
};
