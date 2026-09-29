import React, { useState } from 'react';
import { Compass, Cpu, Sliders, ShieldAlert } from 'lucide-react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { GisMapSection } from './components/GisMapSection';
import { PrototypeShowcase } from './components/PrototypeShowcase';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { LiveStatusWeather } from './components/LiveStatusWeather';
import { AlertResponseCenter } from './components/AlertResponseCenter';
import { AuthorizedResponsePortal } from './components/AuthorizedResponsePortal';
import { HardwareDataFlow } from './components/HardwareDataFlow';
import { SensorToCityTimeline } from './components/SensorToCityTimeline';
import { SystemArchitecture } from './components/SystemArchitecture';
import { ImpactAndStorySection } from './components/ImpactAndStorySection';
import { Footer } from './components/Footer';
import { SimulationDrawer } from './components/SimulationDrawer';
import { GuidedDemoModal } from './components/GuidedDemoModal';
import { DocumentationModal } from './components/DocumentationModal';
import { INITIAL_NODES, INITIAL_ALERTS } from './data/mockNodes';
import { DrainageNode, SimulationState, AlertItem, RainfallLevel, NodeSeverity } from './types';
import { triggerDoubleAlertBeep, playBuzzerBeep } from './utils/audio';

export default function App() {
  const [nodes, setNodes] = useState<DrainageNode[]>(INITIAL_NODES);
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [selectedNode, setSelectedNode] = useState<DrainageNode | null>(
    INITIAL_NODES.find((n) => n.isKeyDemoNode) || INITIAL_NODES[0]
  );
  const [activePrototypeNodeCode, setActivePrototypeNodeCode] = useState<string>('TD-004');

  // Centralized Simulation State
  const [simulation, setSimulation] = useState<SimulationState>({
    waterLevel: 28,
    rainfall: 'NONE',
    drainageCondition: 'NORMAL',
    sensorStatus: 'ONLINE',
    soundAlertActive: true,
    affectedCount: 3,
    activePresetName: null,
    scenarioTimeElapsedMinutes: 0,
    isScenarioRunning: false,
  });

  // Modal / Drawer visibility
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [isGuidedDemoOpen, setIsGuidedDemoOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  // Update simulation state and react globally
  const handleUpdateSimulation = (updates: Partial<SimulationState>) => {
    setSimulation((prev) => {
      const next = { ...prev, ...updates };

      // If transitioning to critical, trigger alert beep
      if (next.waterLevel >= 80 && prev.waterLevel < 80 && next.soundAlertActive) {
        triggerDoubleAlertBeep();
      }

      return next;
    });
  };

  // Reset simulation to dry baseline
  const handleResetSimulation = () => {
    setSimulation({
      waterLevel: 24,
      rainfall: 'NONE',
      drainageCondition: 'NORMAL',
      sensorStatus: 'ONLINE',
      soundAlertActive: true,
      affectedCount: 1,
      activePresetName: 'Normal Dry',
      scenarioTimeElapsedMinutes: 0,
      isScenarioRunning: false,
    });
  };

  // Run What-If Scenario Result
  const handleRunScenarioResult = (
    finalWater: number,
    rain: RainfallLevel,
    drainage: SimulationState['drainageCondition']
  ) => {
    setSimulation((prev) => ({
      ...prev,
      waterLevel: finalWater,
      rainfall: rain,
      drainageCondition: drainage,
      activePresetName: 'What-If Simulation',
    }));

    if (finalWater >= 80) {
      triggerDoubleAlertBeep();
    }
  };

  // Acknowledge Alert in Alert Center
  const handleAcknowledgeAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  };

  // Dispatch Team in Alert Center
  const handleDispatchTeam = (id: string, team: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              dispatched: true,
              dispatchedTeam: team,
              dispatchTimestamp: timeStr,
              acknowledged: true,
            }
          : a
      )
    );
  };

  // Simulate Blockage directly on a node
  const handleSimulateNodeBlockage = (nodeCode: string) => {
    handleToggleDrainageClog(nodeCode, true);
  };

  // Toggle clog on a specific drainage node from IoT Prototype
  const handleToggleDrainageClog = (nodeCode: string, isClogged: boolean) => {
    const target = nodes.find((n) => n.code === nodeCode);
    const newWater = isClogged ? 92 : 24;
    const newSeverity = isClogged ? 'CRITICAL' : 'NORMAL';
    const newStatus = isClogged ? 'POSSIBLE BLOCKAGE' : 'CLEAR';
    const newRisk = isClogged ? 'HIGH' : 'LOW';

    setNodes((prevNodes) =>
      prevNodes.map((n) => {
        if (n.code === nodeCode) {
          return {
            ...n,
            waterLevel: newWater,
            waterDepthCm: Math.round((newWater * n.maxCanalDepthCm) / 100),
            severity: newSeverity,
            drainageStatus: newStatus,
            floodRisk: newRisk,
            lastUpdate: 'Just now (IoT Telemetry)',
          };
        }
        return n;
      })
    );

    // If clogged, generate alert item
    if (isClogged) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const newAlert: AlertItem = {
        id: `alert-iot-${Date.now()}`,
        timestamp: timeStr,
        severity: 'CRITICAL',
        nodeCode: nodeCode,
        location: target?.name || nodeCode,
        waterLevel: 92,
        drainageStatus: 'POSSIBLE BLOCKAGE',
        message: `Abnormal drainage restriction detected by ESP32 prototype at ${nodeCode}. Immediate inspection advised.`,
        acknowledged: false,
        dispatched: false,
      };
      setAlerts((prev) => [newAlert, ...prev]);
      triggerDoubleAlertBeep();
    }

    // Synchronize simulation state
    setSimulation((prev) => ({
      ...prev,
      waterLevel: isClogged ? 92 : 28,
      drainageCondition: isClogged ? 'POSSIBLE_BLOCKAGE' : 'NORMAL',
      activePresetName: isClogged ? `Clogged: ${nodeCode}` : `Clear: ${nodeCode}`,
    }));
  };

  // Update a specific drainage node's water level and flow velocity from hardware dials
  const handleUpdateNodeHydraulics = (nodeCode: string, waterLevel: number, flowVelocity: number) => {
    const isBlocked = waterLevel >= 68 && flowVelocity <= 0.6;
    const isRestricted = (waterLevel >= 50 && flowVelocity <= 0.8) || (waterLevel >= 75 && flowVelocity <= 1.0);
    
    const severity: NodeSeverity = isBlocked ? 'CRITICAL' : (isRestricted || waterLevel >= 75) ? 'WARNING' : 'NORMAL';
    const drainageStatus: 'CLEAR' | 'POTENTIALLY RESTRICTED' | 'POSSIBLE BLOCKAGE' = isBlocked
      ? 'POSSIBLE BLOCKAGE'
      : isRestricted
      ? 'POTENTIALLY RESTRICTED'
      : 'CLEAR';
    const floodRisk = isBlocked ? 'HIGH' : isRestricted ? 'MODERATE' : 'LOW';

    const target = nodes.find((n) => n.code === nodeCode);

    setNodes((prevNodes) =>
      prevNodes.map((n) => {
        if (n.code === nodeCode) {
          return {
            ...n,
            waterLevel,
            waterDepthCm: Math.round((waterLevel * n.maxCanalDepthCm) / 100),
            flowVelocityMps: Number(flowVelocity.toFixed(1)),
            severity,
            drainageStatus,
            floodRisk,
            lastUpdate: 'Just now (Hardware Dials)',
          };
        }
        return n;
      })
    );

    // If new blockage condition triggered, generate alert item and buzzer
    if (isBlocked && target?.severity !== 'CRITICAL') {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const newAlert: AlertItem = {
        id: `alert-hydraulics-${Date.now()}`,
        timestamp: timeStr,
        severity: 'CRITICAL',
        nodeCode: nodeCode,
        location: target?.name || nodeCode,
        waterLevel,
        drainageStatus: 'POSSIBLE BLOCKAGE',
        message: `High water closing in on ultrasonic sensor while flow velocity dropped to ${flowVelocity.toFixed(1)} m/s at ${nodeCode}. Blockage detected!`,
        acknowledged: false,
        dispatched: false,
      };
      setAlerts((prev) => [newAlert, ...prev]);
      triggerDoubleAlertBeep();
    }

    handleUpdateSimulation({
      waterLevel,
      drainageCondition: isBlocked ? 'POSSIBLE_BLOCKAGE' : isRestricted ? 'POTENTIALLY_RESTRICTED' : 'NORMAL',
    });
  };

  // Clear all drainage clogs across Talon Dos
  const handleClearAllClogs = () => {
    setNodes((prevNodes) =>
      prevNodes.map((n) => ({
        ...n,
        waterLevel: 22,
        waterDepthCm: 33,
        severity: 'NORMAL',
        drainageStatus: 'CLEAR',
        floodRisk: 'LOW',
        lastUpdate: 'Just now (All Cleared)',
      }))
    );
    handleUpdateSimulation({
      waterLevel: 22,
      drainageCondition: 'NORMAL',
      rainfall: 'NONE',
      activePresetName: 'All Drains Clear',
    });
  };

  // View on Map handler
  const handleViewOnMap = (nodeCode: string) => {
    const target = nodes.find((n) => n.code === nodeCode);
    if (target) {
      setSelectedNode(target);
    }
    const mapEl = document.getElementById('gis-map');
    if (mapEl) {
      mapEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Header with Clock and Live Actions */}
      <Header
        simulation={simulation}
        onOpenSimulation={() => setIsSimulationOpen(true)}
        onStartGuidedDemo={() => setIsGuidedDemoOpen(true)}
        activeSection="hero"
      />

      <main className="flex-1 pb-20 lg:pb-0">
        {/* 2. Hero Section */}
        <HeroSection
          simulation={simulation}
          onOpenSimulation={() => setIsSimulationOpen(true)}
          onStartGuidedDemo={() => setIsGuidedDemoOpen(true)}
        />

        {/* 4 & 5. GIS Flood-Risk Map & Heatmap */}
        <GisMapSection
          nodes={nodes}
          simulation={simulation}
          onSelectNode={(node) => setSelectedNode(node)}
          selectedNode={selectedNode}
          onSimulateNodeBlockage={handleSimulateNodeBlockage}
        />

        {/* 15. Live System Status & Meteorological Precipitation Trends Feed */}
        <LiveStatusWeather
          nodes={nodes}
          simulation={simulation}
          onOpenSimulation={() => setIsSimulationOpen(true)}
        />

        {/* 10 & 11. Hardware Prototype Showcase: "THE DEVICE" */}
        <PrototypeShowcase
          nodes={nodes}
          simulation={simulation}
          activeNodeCode={activePrototypeNodeCode}
          onSelectActiveNodeCode={(code) => setActivePrototypeNodeCode(code)}
          onUpdateWaterLevel={(val) => handleUpdateSimulation({ waterLevel: val })}
          onToggleDrainageClog={handleToggleDrainageClog}
          onUpdateNodeHydraulics={handleUpdateNodeHydraulics}
          onClearAllClogs={handleClearAllClogs}
          onViewOnMap={handleViewOnMap}
        />

        {/* 12. Hardware Data Flow Diagram */}
        <HardwareDataFlow simulation={simulation} />

        {/* 7. "What If?" Flood Scenario Simulator */}
        <WhatIfSimulator
          simulation={simulation}
          onRunScenarioResult={handleRunScenarioResult}
        />

        {/* 8 & 17. Real-Time Alert Response Center */}
        <AlertResponseCenter
          alerts={alerts}
          simulation={simulation}
          onAcknowledgeAlert={handleAcknowledgeAlert}
          onDispatchTeam={handleDispatchTeam}
          onViewOnMap={handleViewOnMap}
        />

        {/* 9 & 16. Authorized Barangay & CENRO Monitoring Portal */}
        <AuthorizedResponsePortal 
          nodes={nodes} 
          simulation={simulation} 
          activeNodeCode={activePrototypeNodeCode}
          onViewOnMap={handleViewOnMap}
        />

        {/* 13. "From Sensor To City" Storytelling Horizontal Timeline */}
        <SensorToCityTimeline />

        {/* 14. System Architecture 5-Layer Interactive Diagram */}
        <SystemArchitecture />

        {/* 18, 19, 20 & 28. Project Story, Innovation Pillars, Measurable Goals & Scientific Rigor */}
        <ImpactAndStorySection />
      </main>

      {/* 26. Technical Footer */}
      <Footer onOpenSystemDocs={() => setIsDocsOpen(true)} />

      {/* Mobile Bottom Tab Bar (Thumb-Zone Ergonomics) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#060a12]/95 backdrop-blur-md border-t border-cyan-950/80 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
        <a
          href="#gis-map"
          className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] text-slate-400 hover:text-cyan-400 active:scale-95 transition-colors"
        >
          <Compass className="w-4 h-4 mb-0.5 text-cyan-400" />
          <span className="text-[10px] font-mono font-medium">Map</span>
        </a>

        <a
          href="#the-device"
          className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] text-slate-400 hover:text-cyan-400 active:scale-95 transition-colors"
        >
          <Cpu className="w-4 h-4 mb-0.5 text-sky-400" />
          <span className="text-[10px] font-mono font-medium">Device</span>
        </a>

        <a
          href="#what-if"
          className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] text-slate-400 hover:text-cyan-400 active:scale-95 transition-colors"
        >
          <Sliders className="w-4 h-4 mb-0.5 text-indigo-400" />
          <span className="text-[10px] font-mono font-medium">Simulate</span>
        </a>

        <a
          href="#alert-center"
          className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] text-slate-400 hover:text-cyan-400 active:scale-95 transition-colors relative"
        >
          <ShieldAlert className={`w-4 h-4 mb-0.5 ${simulation.waterLevel >= 80 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
          <span className="text-[10px] font-mono font-medium">Alerts</span>
          {simulation.waterLevel >= 80 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
        </a>

        <button
          onClick={() => setIsSimulationOpen(true)}
          className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] text-cyan-400 hover:text-cyan-300 active:scale-95 transition-colors"
        >
          <div className="w-5 h-5 rounded-md bg-cyan-950 border border-cyan-500/40 flex items-center justify-center mb-0.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <span className="text-[10px] font-mono font-medium">Controls</span>
        </button>
      </nav>

      {/* Persistent Drawer: Interactive Live Simulation Bench */}
      <SimulationDrawer
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        simulation={simulation}
        onUpdateSimulation={handleUpdateSimulation}
        onReset={handleResetSimulation}
        onOpenGuidedDemo={() => setIsGuidedDemoOpen(true)}
      />

      {/* Centerpiece Modal: 90-Second Guided System Demonstration */}
      <GuidedDemoModal
        isOpen={isGuidedDemoOpen}
        onClose={() => setIsGuidedDemoOpen(false)}
        onApplyState={(state) => handleUpdateSimulation(state)}
      />

      {/* Documentation & Bill of Materials Modal */}
      <DocumentationModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />
    </div>
  );
}
