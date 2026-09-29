import React, { useState, useEffect } from 'react';
import { 
  Cpu, Radio, Volume2, RotateCw, ZoomIn, ZoomOut, 
  Layers, CheckCircle, Info, Sparkles, Sliders, AlertCircle,
  AlertTriangle, Navigation, RefreshCw, Zap, ArrowRight, Activity,
  VolumeX, Waves, ShieldAlert, Gauge, Compass, Send, ExternalLink, Bell
} from 'lucide-react';
import { HARDWARE_COMPONENTS } from '../data/mockNodes';
import { DrainageNode, HardwareComponent, SimulationState } from '../types';
import { 
  playSeriousEmergencyBuzzer, 
  startContinuousSeriousSiren, 
  stopContinuousSiren 
} from '../utils/audio';
import { 
  transmitNtfyMunicipalAlert, 
  NTFY_TOPIC, 
  NTFY_SERVER_URL, 
  NtfyResponseResult 
} from '../utils/ntfy';
import { ThreeDPrototypeViewer } from './ThreeDPrototypeViewer';
import { InteractiveDial } from './InteractiveDial';

interface PrototypeShowcaseProps {
  nodes: DrainageNode[];
  simulation: SimulationState;
  activeNodeCode?: string;
  onSelectActiveNodeCode?: (code: string) => void;
  onUpdateWaterLevel: (val: number) => void;
  onToggleDrainageClog: (nodeCode: string, isClogged: boolean) => void;
  onUpdateNodeHydraulics: (nodeCode: string, waterLevel: number, flowVelocity: number) => void;
  onClearAllClogs: () => void;
  onViewOnMap: (nodeCode: string) => void;
}

export const PrototypeShowcase: React.FC<PrototypeShowcaseProps> = ({
  nodes,
  simulation,
  activeNodeCode = 'TD-004',
  onSelectActiveNodeCode,
  onUpdateWaterLevel,
  onToggleDrainageClog,
  onUpdateNodeHydraulics,
  onClearAllClogs,
  onViewOnMap,
}) => {
  const [selectedCompId, setSelectedCompId] = useState<string>('esp32');
  const [viewMode, setViewMode] = useState<'3D' | 'PHOTO' | 'EXPLODED' | 'WIRING'>('3D');
  const [selectedNodeCode, setSelectedNodeCode] = useState<string>(activeNodeCode);
  const [isBuzzerActive, setIsBuzzerActive] = useState<boolean>(false);
  const [isContinuousSirenRunning, setIsContinuousSirenRunning] = useState<boolean>(false);
  const [broadcastNotice, setBroadcastNotice] = useState<string | null>(null);

  // ntfy Push Notification State
  const [isTransmittingNtfy, setIsTransmittingNtfy] = useState<boolean>(false);
  const [ntfyStatus, setNtfyStatus] = useState<NtfyResponseResult | null>(null);

  // Sync node code if external activeNodeCode updates
  useEffect(() => {
    if (activeNodeCode) {
      setSelectedNodeCode(activeNodeCode);
    }
  }, [activeNodeCode]);

  const handleSelectNode = (code: string) => {
    setSelectedNodeCode(code);
    if (onSelectActiveNodeCode) {
      onSelectActiveNodeCode(code);
    }
  };

  // Studio Photo mode zoom and rotation
  const [rotationAngle, setRotationAngle] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showLabels, setShowLabels] = useState(true);

  // Active targeted drainage node
  const activeTargetNode =
    nodes.find((n) => n.code === selectedNodeCode) ||
    nodes.find((n) => n.isKeyDemoNode) ||
    nodes[0];

  const currentWaterLevel = activeTargetNode.waterLevel;
  const currentFlowVelocity = activeTargetNode.flowVelocityMps ?? (activeTargetNode.severity === 'CRITICAL' ? 0.3 : 1.2);

  // Distance from culvert ceiling / ultrasonic sensor to water surface (total depth = 150 cm)
  const distanceToSensorCm = Math.max(5, Math.round(150 - (currentWaterLevel * 150) / 100));

  // Physical clog detection analysis based on Ultrasonic distance + Potentiometer flow velocity
  const isPhysicallyClogged = currentWaterLevel >= 68 && currentFlowVelocity <= 0.6;
  const isElevatedRisk = currentWaterLevel >= 50 || currentFlowVelocity <= 0.8;

  const isTargetClogged =
    activeTargetNode.severity === 'CRITICAL' ||
    activeTargetNode.drainageStatus === 'POSSIBLE BLOCKAGE' ||
    isPhysicallyClogged;

  const selectedComponent =
    HARDWARE_COMPONENTS.find((c) => c.id === selectedCompId) || HARDWARE_COMPONENTS[0];

  // Serious Buzzer Handlers
  const handleTestSeriousBuzzer = () => {
    setIsBuzzerActive(true);
    playSeriousEmergencyBuzzer(4, () => {
      setIsBuzzerActive(false);
    });
  };

  const handleToggleContinuousSiren = () => {
    if (isContinuousSirenRunning) {
      stopContinuousSiren();
      setIsContinuousSirenRunning(false);
      setIsBuzzerActive(false);
    } else {
      setIsContinuousSirenRunning(true);
      setIsBuzzerActive(true);
      startContinuousSeriousSiren(4.0, () => {
        setIsContinuousSirenRunning(false);
        setIsBuzzerActive(false);
      });
    }
  };

  // Dial Change Handlers (Affects GIS Map in Real Time)
  const handleUltrasonicChange = (newWaterLevel: number) => {
    onUpdateNodeHydraulics(activeTargetNode.code, newWaterLevel, currentFlowVelocity);
    const newDist = Math.max(5, Math.round(150 - (newWaterLevel * 150) / 100));
    setBroadcastNotice(
      `📡 ULTRASONIC TELEMETRY: Water closing in on sensor at [${activeTargetNode.code}]: ${newDist} cm to transducer (${newWaterLevel}% height) · GIS Map Updated!`
    );
    setTimeout(() => setBroadcastNotice(null), 3500);
  };

  const handleFlowVelocityChange = (newVelocity: number) => {
    onUpdateNodeHydraulics(activeTargetNode.code, currentWaterLevel, newVelocity);
    setBroadcastNotice(
      `📡 POTENTIOMETER TELEMETRY: Flow velocity adjusted to ${newVelocity.toFixed(1)} m/s at [${activeTargetNode.code}] · GIS Map Updated!`
    );
    setTimeout(() => setBroadcastNotice(null), 3500);
  };

  // Direct Clog Simulation Override
  const handleClogToggle = (clog: boolean) => {
    onToggleDrainageClog(activeTargetNode.code, clog);
    if (clog) {
      handleTestSeriousBuzzer();
    }
    setBroadcastNotice(
      clog
        ? `⚠️ CRITICAL: Node [${activeTargetNode.code}] marked CLOGGED. Water surged to 92%, flow dropped, serious alarm sounded, GIS Map highlighted in RED!`
        : `✓ CLEARED: Node [${activeTargetNode.code}] flushed. Free gravity flow restored on GIS Map!`
    );
    setTimeout(() => setBroadcastNotice(null), 4000);
  };

  // Transmit Municipal Alert via ntfy (Topic: barangay-drain-TDCSHS)
  const handleTransmitMunicipalAlert = async () => {
    setIsTransmittingNtfy(true);
    setNtfyStatus(null);

    const result = await transmitNtfyMunicipalAlert({
      nodeCode: activeTargetNode.code,
      nodeName: activeTargetNode.name,
      locationDesc: activeTargetNode.locationDesc,
      waterLevel: currentWaterLevel,
      distanceToSensorCm,
      waterDepthCm: activeTargetNode.waterDepthCm || Math.round((currentWaterLevel * activeTargetNode.maxCanalDepthCm) / 100),
      flowVelocity: currentFlowVelocity,
      isClogged: isTargetClogged,
      severity: isTargetClogged ? 'CRITICAL' : isElevatedRisk ? 'WARNING' : 'NORMAL',
    });

    setIsTransmittingNtfy(false);
    setNtfyStatus(result);

    setTimeout(() => {
      setNtfyStatus(null);
    }, 10000);
  };

  const hotspots = [
    { id: 'esp32', name: 'ESP32 (The Brain)', top: '48%', left: '42%' },
    { id: 'ultrasonic', name: 'HC-SR04 Ultrasonic Sensor', top: '32%', left: '72%' },
    { id: 'buzzer', name: 'Serious Piezo Siren (Alarm)', top: '64%', left: '30%' },
    { id: 'potentiometer', name: 'Flow Potentiometer Dial', top: '68%', left: '60%' },
    { id: 'leds', name: 'Status LED Matrix', top: '36%', left: '26%' },
  ];

  return (
    <section id="the-device" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold">PHYSICAL TELEMETRY RIG</span>
            <span>·</span>
            <span className="text-slate-400">PBR 3D MODEL & DUAL PRECISION HARDWARE DIALS</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold text-white tracking-tight">
            THE DEVICE // 3D IOT PROTOTYPE & DUAL DIALS
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
            Interact with the photorealistic 3D hardware rig. Turn the <strong className="text-cyan-300">Ultrasonic Dial</strong> to watch water close in on the sensor, rotate the <strong className="text-amber-300">Potentiometer Dial</strong> to regulate culvert flow velocity, and trigger the <strong className="text-rose-400">Serious Industrial Buzzer</strong> to test city-level alert response.
          </p>
        </div>

        {/* View Perspective Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setViewMode('3D')}
            className={`px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              viewMode === '3D' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3D Realistic Model</span>
          </button>
          <button
            onClick={() => setViewMode('PHOTO')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              viewMode === 'PHOTO' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Studio Photo
          </button>
          <button
            onClick={() => setViewMode('EXPLODED')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              viewMode === 'EXPLODED' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Exploded Layers
          </button>
          <button
            onClick={() => setViewMode('WIRING')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              viewMode === 'WIRING' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Schematic Pinout
          </button>
        </div>
      </div>

      {/* Broadcast Telemetry Banner */}
      {broadcastNotice && (
        <div className="mb-4 p-3 rounded-xl bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-xs font-mono shadow-xl flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-semibold">{broadcastNotice}</span>
          </div>
          <button
            onClick={() => onViewOnMap(activeTargetNode.code)}
            className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>SEE ON GIS MAP</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* TOP ROW: DUAL HARDWARE DIALS (Ultrasonic & Potentiometer) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        
        {/* DIAL 1: ULTRASONIC WATER PROXIMITY DIAL */}
        <InteractiveDial
          label="ULTRASONIC SENSOR ECHO DIAL"
          sublabel="Height of water closing in to ultrasonic transducer"
          value={currentWaterLevel}
          min={0}
          max={100}
          step={1}
          unit="%"
          secondaryDisplay={`Echo Flight: ${((distanceToSensorCm * 2) / 34.3).toFixed(2)}ms · Distance: ${distanceToSensorCm} cm · Depth: ${Math.round((currentWaterLevel * 150) / 100)} cm`}
          colorScheme={distanceToSensorCm <= 30 ? 'rose' : distanceToSensorCm <= 65 ? 'amber' : 'cyan'}
          onChange={handleUltrasonicChange}
          statusBadge={
            distanceToSensorCm <= 20
              ? 'CRITICAL PROXIMITY (CLOSING IN!)'
              : distanceToSensorCm <= 60
              ? 'ELEVATED WATER LEVEL'
              : 'SAFE ECHO CLEARANCE'
          }
          statusType={distanceToSensorCm <= 30 ? 'critical' : distanceToSensorCm <= 65 ? 'warning' : 'normal'}
          ticks={[
            { value: 15, label: 'Empty (128cm)' },
            { value: 40, label: 'Normal (90cm)' },
            { value: 70, label: 'Elevated (45cm)' },
            { value: 92, label: 'Spillover (12cm)' },
          ]}
          icon={<Waves className="w-4 h-4 text-cyan-400" />}
        />

        {/* DIAL 2: POTENTIOMETER FLOW VELOCITY DIAL */}
        <InteractiveDial
          label="POTENTIOMETER FLOW VELOCITY DIAL"
          sublabel="Water flow rate through culvert (ADC 0-4095)"
          value={currentFlowVelocity}
          min={0.0}
          max={2.5}
          step={0.1}
          unit="m/s"
          secondaryDisplay={`ADC Value: ${Math.round((currentFlowVelocity / 2.5) * 4095)} / 4095 · Flow: ${
            currentFlowVelocity <= 0.4 ? 'Stagnant / Backflow' : currentFlowVelocity <= 0.9 ? 'Sluggish / Restricted' : 'Active Gravity Flush'
          }`}
          colorScheme={currentFlowVelocity <= 0.4 ? 'rose' : currentFlowVelocity <= 0.9 ? 'amber' : 'emerald'}
          onChange={handleFlowVelocityChange}
          statusBadge={
            currentFlowVelocity <= 0.4
              ? 'STAGNANT / BACKFLOW'
              : currentFlowVelocity <= 0.9
              ? 'SLUGGISH RESTRICTION'
              : 'ACTIVE GRAVITY FLUSH'
          }
          statusType={currentFlowVelocity <= 0.4 ? 'critical' : currentFlowVelocity <= 0.9 ? 'warning' : 'normal'}
          ticks={[
            { value: 0.2, label: 'Stagnant (0.2)' },
            { value: 0.6, label: 'Sluggish (0.6)' },
            { value: 1.3, label: 'Normal (1.3)' },
            { value: 2.2, label: 'Torrential (2.2)' },
          ]}
          icon={<Sliders className="w-4 h-4 text-amber-400" />}
        />
      </div>

      {/* MAIN SECTION: 3D MODEL & SERIOUS ALARM RESPONSE RIG */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Stage (7 cols): Photorealistic 3D Model with Water Chamber */}
        <div className="lg:col-span-7 bg-[#060b16] rounded-2xl border border-cyan-900/80 p-4 sm:p-5 relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[520px]">
          
          {/* Header over canvas */}
          <div className="flex items-center justify-between mb-2 z-20">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-200">
                PROTOTYPE RIG // ESP32 · HC-SR04 · WATER CHAMBER
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-bold">
                PHYSICALLY ACCURATE
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <span className="text-[11px]">
                Targeting: <strong className="text-cyan-300">{activeTargetNode.code}</strong>
              </span>
            </div>
          </div>

          {/* Interactive Hardware Stage Area */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-[#040813]">
            
            {/* View Mode 1: 3D Photorealistic Model with Rising Water Chamber */}
            {viewMode === '3D' && (
              <ThreeDPrototypeViewer
                waterLevel={currentWaterLevel}
                flowVelocity={currentFlowVelocity}
                isClogged={isTargetClogged}
                isBuzzerActive={isBuzzerActive || isContinuousSirenRunning}
                selectedComponentId={selectedCompId}
                onSelectComponent={(id) => setSelectedCompId(id)}
                onRotatePotentiometer={handleUltrasonicChange}
              />
            )}

            {/* View Mode 2: Studio Photo with Hotspots */}
            {viewMode === 'PHOTO' && (
              <div
                className="relative transition-transform duration-500 ease-out max-w-full p-4"
                style={{
                  transform: `rotate(${rotationAngle}deg) scale(${zoomLevel})`,
                }}
              >
                <img
                  src="/src/assets/images/prototype_hardware_esp32_1790506408100.jpg"
                  alt="ESP32 Smart Drainage Prototype Rig"
                  referrerPolicy="no-referrer"
                  className="rounded-xl object-contain max-h-[360px] sm:max-h-[420px] shadow-2xl border border-cyan-900/40"
                />

                {/* Hotspot Pins */}
                {showLabels &&
                  hotspots.map((hs) => {
                    const isSelected = selectedCompId === hs.id;
                    const isBuzzer = hs.id === 'buzzer';
                    return (
                      <button
                        key={hs.id}
                        onClick={() => setSelectedCompId(hs.id)}
                        className="absolute group z-20 transform -translate-x-1/2 -translate-y-1/2 transition-transform cursor-pointer"
                        style={{ top: hs.top, left: hs.left }}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                            isSelected
                              ? 'bg-cyan-500/80 border-white text-slate-950 scale-125 shadow-lg shadow-cyan-400'
                              : isBuzzer && isTargetClogged
                              ? 'bg-rose-500 border-white text-white animate-bounce shadow-lg shadow-rose-500'
                              : 'bg-slate-950/80 border-cyan-400 text-cyan-300 hover:scale-110 hover:border-white'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-current" />
                        </div>

                        <div className="absolute left-1/2 -translate-x-1/2 top-7 whitespace-nowrap bg-black/90 text-white font-mono text-[10px] px-2 py-0.5 rounded border border-cyan-500/40 opacity-90 group-hover:opacity-100 pointer-events-none shadow">
                          {hs.name.split(' ')[0]}
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}

            {/* View Mode 3: Exploded Blueprint */}
            {viewMode === 'EXPLODED' && (
              <div className="w-full max-w-lg p-6 space-y-4 font-mono text-xs text-slate-300">
                <div className="text-center pb-2 border-b border-cyan-950 text-cyan-400 font-bold">
                  EXPLODED STRUCTURAL STACK
                </div>
                <div className="space-y-3">
                  <div
                    onClick={() => setSelectedCompId('ultrasonic')}
                    className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-600/50 hover:border-cyan-400 cursor-pointer transition-colors"
                  >
                    <div className="font-bold text-cyan-300">LAYER 01: SENSING HEAD (HC-SR04)</div>
                    <div className="text-[11px] text-slate-400">Waterproof dual-transducer acoustic cone · Tracks water surface distance from 150cm down to 5cm</div>
                  </div>
                  <div
                    onClick={() => setSelectedCompId('esp32')}
                    className="p-3 rounded-lg bg-blue-950/40 border border-blue-600/50 hover:border-blue-400 cursor-pointer transition-colors"
                  >
                    <div className="font-bold text-blue-300">LAYER 02: COMPUTE CORE (ESP-WROOM-32)</div>
                    <div className="text-[11px] text-slate-400">Xtensa dual core 240MHz · Hydrological clog detection algorithm & LoRa/MQTT telemetry</div>
                  </div>
                  <div
                    onClick={() => setSelectedCompId('buzzer')}
                    className="p-3 rounded-lg bg-rose-950/40 border border-rose-600/50 hover:border-rose-400 cursor-pointer transition-colors"
                  >
                    <div className="font-bold text-rose-300">LAYER 03: LOCAL NOTIFIER (SERIOUS PIEZO SIREN)</div>
                    <div className="text-[11px] text-slate-400">High-decibel acoustic driver · Transistor switched via GPIO 23 for emergency alerts</div>
                  </div>
                  <div
                    onClick={() => setSelectedCompId('potentiometer')}
                    className="p-3 rounded-lg bg-amber-950/40 border border-amber-600/50 hover:border-amber-400 cursor-pointer transition-colors"
                  >
                    <div className="font-bold text-amber-300">LAYER 04: FLOW VELOCITY INPUT (POTENTIOMETER)</div>
                    <div className="text-[11px] text-slate-400">10kΩ linear trimmer on ADC pin GPIO 34 simulating culvert flow velocity (0.0 - 2.5 m/s)</div>
                  </div>
                </div>
              </div>
            )}

            {/* View Mode 4: Pinout Wiring */}
            {viewMode === 'WIRING' && (
              <div className="w-full max-w-lg p-5 font-mono text-xs space-y-3">
                <div className="text-center pb-2 border-b border-cyan-950 text-cyan-400 font-bold">
                  ESP32 HARDWARE PINOUT MAPPING
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-cyan-400 font-bold block">GPIO 18 (Trig)</span>
                    <span className="text-slate-400">HC-SR04 10µs ultrasonic trigger</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-cyan-400 font-bold block">GPIO 5 (Echo)</span>
                    <span className="text-slate-400">Acoustic return pulse time-of-flight</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-rose-400 font-bold block">GPIO 23 (Buzzer)</span>
                    <span className="text-slate-400">2.8kHz resonant active piezo alarm</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-amber-400 font-bold block">GPIO 34 (ADC1)</span>
                    <span className="text-slate-400">Potentiometer culvert flow velocity</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-emerald-400 font-bold block">GPIO 19/21/22</span>
                    <span className="text-slate-400">Green / Amber / Red status LEDs</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-blue-400 font-bold block">VIN / 3.3V / GND</span>
                    <span className="text-slate-400">AMS1117-3.3 power regulation</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Component Selector Strip */}
          <div className="mt-3 pt-3 border-t border-cyan-950/60 flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              SELECT COMPONENT TO INSPECT:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {HARDWARE_COMPONENTS.map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => setSelectedCompId(comp.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium whitespace-nowrap border transition-all cursor-pointer ${
                    selectedCompId === comp.id
                      ? 'bg-cyan-600 border-cyan-400 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {comp.subtitle}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Stage (5 cols): Serious Buzzer Alarm & GIS Drainage Link Controller */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* HARDWARE-TO-GIS LIVE CONTROLLER */}
          <div className="p-5 rounded-2xl bg-[#090f1d] border-2 border-cyan-500/60 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-950 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <h3 className="text-base font-display font-bold text-white tracking-tight">
                  HARDWARE-TO-GIS LIVE LINK
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-bold">
                AFFECTS GIS MAP
              </span>
            </div>

            {/* Target Drainage Node Selector */}
            <div className="space-y-1.5 mb-3">
              <label className="text-[11px] font-mono text-slate-300 font-semibold block flex items-center justify-between">
                <span>1. SELECT TARGET ROAD DRAINAGE:</span>
                <span className="text-cyan-400 font-mono text-[10px]">{nodes.length} Talon Dos Culverts</span>
              </label>

              <select
                value={selectedNodeCode}
                onChange={(e) => setSelectedNodeCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-cyan-900/80 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
              >
                {nodes.map((node) => (
                  <option key={node.code} value={node.code}>
                    {node.code} — {node.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                <span>Road: {activeTargetNode.locationDesc.slice(0, 42)}...</span>
                <button
                  onClick={() => onViewOnMap(activeTargetNode.code)}
                  className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-0.5 underline cursor-pointer"
                >
                  Locate on Map
                </button>
              </div>
            </div>

            {/* Hydrological Clog Diagnostic Card (Result of Both Dials) */}
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 mb-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-slate-200">
                  2. HYDRAULIC BLOCKAGE STATUS:
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isTargetClogged
                      ? 'bg-rose-950 text-rose-300 border border-rose-500 animate-pulse'
                      : isElevatedRisk
                      ? 'bg-amber-950 text-amber-300 border border-amber-500'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                  }`}
                >
                  {isTargetClogged ? 'DRAINAGE CLOGGED / CRITICAL' : isElevatedRisk ? 'RESTRICTED RUNOFF' : 'CLEAR / GRAVITY FLOW'}
                </span>
              </div>

              {/* Physical explanation */}
              <p className="text-[11px] font-mono text-slate-300 leading-snug">
                {isTargetClogged ? (
                  <span className="text-rose-300">
                    ⚠️ <strong>BLOCKAGE SIGNATURE DETECTED:</strong> Water has risen to within <strong>{distanceToSensorCm} cm</strong> of the ultrasonic sensor head while flow velocity has dropped to <strong>{currentFlowVelocity.toFixed(1)} m/s</strong>. Severe debris restriction! Culvert on GIS map is flashing <strong>CRITICAL RED</strong>.
                  </span>
                ) : isElevatedRisk ? (
                  <span className="text-amber-300">
                    ⚡ <strong>PARTIAL RESTRICTION:</strong> Elevated water depth ({Math.round((currentWaterLevel * 150) / 100)} cm) with sluggish conveyance ({currentFlowVelocity.toFixed(1)} m/s). Monitored node marked <strong>WARNING</strong>.
                  </span>
                ) : (
                  <span className="text-emerald-300">
                    ✓ <strong>FREE DISCHARGE:</strong> Ultrasonic echo distance is safe ({distanceToSensorCm} cm) and flow velocity is healthy ({currentFlowVelocity.toFixed(1)} m/s). Monitored node is <strong>NORMAL GREEN</strong>.
                  </span>
                )}
              </p>

              {/* Direct Clog Simulation Override Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleClogToggle(false)}
                  className={`py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    !isTargetClogged
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950 ring-2 ring-emerald-400'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>CLEAR DRAIN</span>
                </button>

                <button
                  onClick={() => handleClogToggle(true)}
                  className={`py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isTargetClogged
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-950 ring-2 ring-rose-400 animate-pulse'
                      : 'bg-slate-900 hover:bg-rose-950 text-rose-300 border border-rose-900/60'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>SIMULATE CLOG</span>
                </button>
              </div>
            </div>

            {/* SERIOUS DISASTER-GRADE ALARM BUZZER CONTROLS */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950/40 via-slate-950 to-rose-950/40 border border-rose-600/50 space-y-2 mb-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                  <Volume2 className={`w-4 h-4 ${isBuzzerActive ? 'animate-bounce text-rose-300' : ''}`} />
                  <span>SERIOUS INDUSTRIAL PIEZO BUZZER</span>
                </div>
                <span className="text-[10px] text-rose-300 font-mono font-bold px-1.5 py-0.5 rounded bg-rose-950 border border-rose-700/60">
                  CALIBRATED LEVEL · 2850Hz/3720Hz
                </span>
              </div>

              <p className="text-[10px] font-mono text-slate-300 leading-snug">
                Simulates real-world active piezo buzzer hardware with dual-frequency resonant wave-shaping at a balanced, comfortable listening volume.
              </p>

              {/* Buzzer Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleTestSeriousBuzzer}
                  className={`py-2.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isBuzzerActive && !isContinuousSirenRunning
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-950 ring-2 ring-rose-300 animate-pulse'
                      : 'bg-rose-950 hover:bg-rose-900 border border-rose-500/80 text-rose-200'
                  }`}
                >
                  <Volume2 className="w-4 h-4 text-rose-300" />
                  <span>4-PULSE BURST ALARM</span>
                </button>

                <button
                  onClick={handleToggleContinuousSiren}
                  className={`py-2.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isContinuousSirenRunning
                      ? 'bg-red-600 text-white shadow-xl shadow-red-950 ring-2 ring-white animate-bounce'
                      : 'bg-slate-900 hover:bg-rose-950 border border-slate-700 text-slate-200'
                  }`}
                >
                  {isContinuousSirenRunning ? (
                    <>
                      <VolumeX className="w-4 h-4 text-white" />
                      <span>STOP SIREN</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <span>CONTINUOUS SIREN</span>
                    </>
                  )}
                </button>
              </div>

              {isBuzzerActive && (
                <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-rose-300 pt-1 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span>PIEZO TRANSDUCER VIBRATING AT 2850Hz & 3720Hz WITH ACOUSTIC HARMONICS</span>
                </div>
              )}
            </div>

            {/* NTFY PUSH NOTIFICATION TRANSMITTER (Topic: barangay-drain-TDCSHS) */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-800/80 space-y-2 mb-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  <span>MUNICIPAL PUSH NOTIFICATION</span>
                </div>
                <span className="text-[10px] text-cyan-300 font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-700/60">
                  NTFY: {NTFY_TOPIC}
                </span>
              </div>

              <p className="text-[10px] font-mono text-slate-300 leading-snug">
                Pushes live IoT Prototype dial metrics (Ultrasonic clearance: <strong>{distanceToSensorCm} cm</strong>, Flow: <strong>{currentFlowVelocity.toFixed(1)} m/s</strong>, Clog: <strong>{isTargetClogged ? 'CRITICAL' : isElevatedRisk ? 'WARNING' : 'NORMAL'}</strong> at <strong>{activeTargetNode.code}</strong>) directly to the <strong>ntfy app</strong>.
              </p>

              <div className="flex items-center gap-2 pt-0.5">
                <button
                  onClick={handleTransmitMunicipalAlert}
                  disabled={isTransmittingNtfy}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                    isTransmittingNtfy
                      ? 'bg-cyan-800 text-white cursor-wait opacity-80'
                      : isTargetClogged
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/80 ring-2 ring-rose-400 active:scale-95'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950 active:scale-95'
                  }`}
                >
                  {isTransmittingNtfy ? (
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

                <a
                  href={NTFY_SERVER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 hover:text-white text-xs font-mono flex items-center gap-1 transition-colors"
                  title="View live notifications on ntfy.sh"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Feedback toast / banner */}
              {ntfyStatus && (
                <div
                  className={`p-2.5 rounded-lg border text-[11px] font-mono shadow flex items-center justify-between gap-2 animate-in fade-in duration-150 ${
                    ntfyStatus.success
                      ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
                      : 'bg-rose-950/90 border-rose-500 text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {ntfyStatus.success ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                    <span className="truncate">
                      {ntfyStatus.success
                        ? `✓ Pushed ${ntfyStatus.statusType} telemetry to ntfy // "${NTFY_TOPIC}"`
                        : `⚠️ Transmission error: ${ntfyStatus.error}`}
                    </span>
                  </div>

                  {ntfyStatus.success && (
                    <a
                      href={NTFY_SERVER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-300 hover:text-white font-bold underline shrink-0"
                    >
                      OPEN NTFY
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions & Reset */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={onClearAllClogs}
                className="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/60 text-cyan-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>RESET ALL 12 DRAINS</span>
              </button>

              <button
                onClick={() => onViewOnMap(activeTargetNode.code)}
                className="py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>VIEW {activeTargetNode.code} ON MAP</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* INSPECTED COMPONENT SPECIFICATION CARD */}
          <div className="p-4 rounded-2xl bg-[#090f1d] border border-cyan-900/60 text-xs font-mono text-slate-300 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-950">
              <span className="text-cyan-400 font-bold uppercase">
                INSPECTING: {selectedComponent.name}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                {selectedComponent.codeName}
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-snug font-sans">
              {selectedComponent.description}
            </p>

            <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] space-y-1">
              <span className="text-slate-500 block font-semibold">PINOUT & CONNECTIONS:</span>
              <span className="text-cyan-300">{selectedComponent.pins}</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              {selectedComponent.specs.slice(0, 4).map((s, i) => (
                <div key={i} className="p-1.5 rounded bg-slate-950/70 border border-slate-800/80">
                  <span className="text-slate-400 block">{s.label}:</span>
                  <span className="text-white font-semibold">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
