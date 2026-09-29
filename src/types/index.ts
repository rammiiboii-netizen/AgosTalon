export type NodeSeverity = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';

export interface DrainageNode {
  id: string;
  code: string; // e.g. TD-001
  name: string;
  locationDesc: string;
  coordinates: [number, number]; // [lat, lng]
  waterLevel: number; // 0 - 100 percentage
  waterDepthCm: number;
  maxCanalDepthCm: number;
  flowVelocityMps: number;
  drainageStatus: 'CLEAR' | 'POTENTIALLY RESTRICTED' | 'POSSIBLE BLOCKAGE' | 'OFFLINE';
  severity: NodeSeverity;
  floodRisk: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  sensorStatus: 'ONLINE' | 'INTERMITTENT' | 'OFFLINE';
  batteryPercent: number;
  signalRssi: number; // in -dBm
  lastUpdate: string;
  catchmentArea: string;
  elevationM: number;
  isKeyDemoNode?: boolean;
}

export type RainfallLevel = 'NONE' | 'LIGHT' | 'MODERATE' | 'HEAVY' | 'TORRENTIAL';
export type PhysicalDrainageCondition = 'NORMAL' | 'POTENTIALLY_RESTRICTED' | 'POSSIBLE_BLOCKAGE';
export type HardwareSensorState = 'ONLINE' | 'INTERMITTENT' | 'OFFLINE';

export interface SimulationState {
  waterLevel: number; // 0 - 100
  rainfall: RainfallLevel;
  drainageCondition: PhysicalDrainageCondition;
  sensorStatus: HardwareSensorState;
  soundAlertActive: boolean;
  affectedCount: number;
  activePresetName: string | null;
  scenarioTimeElapsedMinutes: number;
  isScenarioRunning: boolean;
}

export interface AlertItem {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'WARNING' | 'NORMAL' | 'INFO';
  nodeCode: string;
  location: string;
  waterLevel: number;
  drainageStatus: string;
  message: string;
  acknowledged: boolean;
  dispatched: boolean;
  dispatchedTeam?: string;
  dispatchTimestamp?: string;
}

export interface ScenarioResult {
  durationMinutes: number;
  intensity: RainfallLevel;
  drainageCondition: string;
  affectedNodesCount: number;
  elevatedRiskZonesCount: number;
  possibleBlockagesDetected: number;
  alertsGenerated: number;
  projectedRunoffCuM: number;
  recommendedAction: string;
}

export interface HardwareComponent {
  id: string;
  name: string;
  codeName: string;
  subtitle: string;
  description: string;
  scientificNote: string;
  pins: string;
  status: 'ACTIVE' | 'NORMAL' | 'ALERT' | 'STANDBY';
  specs: { label: string; value: string }[];
}
