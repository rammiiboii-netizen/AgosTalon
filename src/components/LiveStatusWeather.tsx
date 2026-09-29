import React, { useState } from 'react';
import { 
  CloudRain, Droplets, Wind, Waves, AlertTriangle, 
  ChevronRight, Compass, ShieldAlert, Sparkles, TrendingUp,
  CloudLightning, Sun, Cloud, Clock, RefreshCw, Radio
} from 'lucide-react';
import { DrainageNode, SimulationState } from '../types';
import { getMockWeatherForecast } from '../data/mockWeather';

interface LiveStatusWeatherProps {
  nodes: DrainageNode[];
  simulation: SimulationState;
  onOpenSimulation: () => void;
}

export const LiveStatusWeather: React.FC<LiveStatusWeatherProps> = ({
  nodes,
  simulation,
  onOpenSimulation,
}) => {
  const [selectedHourIdx, setSelectedHourIdx] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const weather = getMockWeatherForecast(simulation);
  const selectedTrend = weather.hourlyTrends[selectedHourIdx];

  // Dynamic system counts reacting to live simulation
  const isKeyDemoCritical = simulation.waterLevel >= 80 || simulation.drainageCondition === 'POSSIBLE_BLOCKAGE';
  const isKeyDemoWarning = !isKeyDemoCritical && (simulation.waterLevel >= 50 || simulation.drainageCondition === 'POTENTIALLY_RESTRICTED');
  const isOffline = simulation.sensorStatus === 'OFFLINE';

  const criticalNodesCount = nodes.filter((n) => {
    if (n.isKeyDemoNode) return isKeyDemoCritical && !isOffline;
    return n.severity === 'CRITICAL';
  }).length;

  const warningNodesCount = nodes.filter((n) => {
    if (n.isKeyDemoNode) return isKeyDemoWarning && !isOffline;
    return n.severity === 'WARNING';
  }).length;

  const offlineNodesCount = isOffline ? 1 : 0;
  const normalNodesCount = 12 - criticalNodesCount - warningNodesCount - offlineNodesCount;

  const handleRefreshFeed = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const getWeatherIcon = (iconType: string) => {
    switch (iconType) {
      case 'thunder':
        return <CloudLightning className="w-5 h-5 text-amber-400" />;
      case 'heavy-rain':
        return <CloudRain className="w-5 h-5 text-rose-400 animate-bounce" />;
      case 'rain':
        return <CloudRain className="w-5 h-5 text-cyan-400" />;
      case 'clear':
        return <Sun className="w-5 h-5 text-amber-300" />;
      default:
        return <Cloud className="w-5 h-5 text-slate-300" />;
    }
  };

  return (
    <section id="live-status" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>METEOROLOGICAL & TELEMETRY SURVEILLANCE</span>
            <span>·</span>
            <span>TALON DOS BASIN</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold text-white tracking-tight">
            LIVE SYSTEM STATUS & METEOROLOGICAL FORECAST
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Live municipal drainage node metrics synchronized with real-time precipitation radar and coastal tidal conditions influencing Talon Dos outfall hydraulics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshFeed}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition-colors"
            title="Refresh Doppler Weather Radar Feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Radar</span>
          </button>

          <button
            onClick={onOpenSimulation}
            className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <span>Simulate Rainfall</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Section 15 Animated System Status Counters + Section Integrated Weather Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live System Counters (Section 15) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-[#090f1d] border border-cyan-950 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-950/60">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isKeyDemoCritical ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
                SYSTEM TELEMETRY SUMMARY
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                12 NODES MONITORED
              </span>
            </div>

            {/* Animated Counters Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              {/* NORMAL */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  NORMAL
                </span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-display font-bold text-emerald-400 tabular-nums">
                    {normalNodesCount}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">nodes</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 font-mono">&lt; 50% capacity</span>
              </div>

              {/* WARNING */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  WARNING
                </span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-display font-bold text-amber-400 tabular-nums">
                    {warningNodesCount}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">nodes</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 font-mono">50% - 79% surcharge</span>
              </div>

              {/* CRITICAL */}
              <div className={`p-3.5 rounded-xl border flex flex-col justify-between transition-colors ${
                criticalNodesCount > 0 ? 'bg-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-950/40' : 'bg-slate-950 border-slate-800'
              }`}>
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${criticalNodesCount > 0 ? 'bg-rose-500 animate-ping' : 'bg-slate-500'}`} />
                  CRITICAL
                </span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className={`text-3xl font-display font-bold tabular-nums ${criticalNodesCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {criticalNodesCount}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">nodes</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 font-mono">&ge; 80% / blockage</span>
              </div>

              {/* OFFLINE */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  OFFLINE
                </span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-display font-bold text-slate-400 tabular-nums">
                    {offlineNodesCount}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">node</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 font-mono">Heartbeat nominal</span>
              </div>
            </div>

            {/* Quick Surcharge Bar */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>AVERAGE BASIN WATER LEVEL</span>
                <span className="text-cyan-400 font-bold">{Math.round((simulation.waterLevel + 32) / 2)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${(normalNodesCount / 12) * 100}%` }} 
                  title="Normal"
                />
                <div 
                  className="bg-amber-500 h-full transition-all duration-500" 
                  style={{ width: `${(warningNodesCount / 12) * 100}%` }} 
                  title="Warning"
                />
                <div 
                  className="bg-rose-500 h-full transition-all duration-500" 
                  style={{ width: `${(criticalNodesCount / 12) * 100}%` }} 
                  title="Critical"
                />
              </div>
            </div>

            {/* System Inflow status */}
            <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-[11px] font-mono text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">INFLOW STATE:</span>
                <span className="text-cyan-300 font-bold uppercase">{simulation.rainfall} RAINFALL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CANAL DISCHARGE:</span>
                <span className={`font-bold ${isKeyDemoCritical ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {simulation.drainageCondition.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Integrated Mock Weather & Precipitation Trends Feed */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-[#090f1d] border border-cyan-500/40 shadow-xl space-y-6">
            {/* Header: Station & Doppler Source */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-cyan-950/60">
              <div>
                <div className="flex items-center gap-2">
                  <CloudRain className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-display font-bold text-base text-white">
                    LOCAL PRECIPITATION RADAR & HYDRAULIC TRENDS
                  </h3>
                </div>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Source: {weather.source}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  DOPPLER FEED ONLINE
                </span>
              </div>
            </div>

            {/* Current Precipitation Telemetry Gauge Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Metric 1: Precipitation Rate */}
              <div className="p-3.5 rounded-xl bg-[#060a14] border border-cyan-950">
                <span className="text-[10px] font-mono text-slate-400 block mb-1">
                  PRECIPITATION RATE
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-mono font-bold text-cyan-400 tabular-nums">
                    {weather.currentPrecipitationRateMmHr}
                  </span>
                  <span className="text-xs font-mono text-slate-400">mm/hr</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                  {weather.currentPrecipitationRateMmHr >= 30 ? 'Intense Downpour' : weather.currentPrecipitationRateMmHr >= 10 ? 'Moderate Rain' : 'Trace / Light'}
                </span>
              </div>

              {/* Metric 2: 24h Accumulation */}
              <div className="p-3.5 rounded-xl bg-[#060a14] border border-cyan-950">
                <span className="text-[10px] font-mono text-slate-400 block mb-1">
                  24H ACCUMULATION
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-mono font-bold text-white tabular-nums">
                    {weather.accumulatedRainfall24hMm}
                  </span>
                  <span className="text-xs font-mono text-slate-400">mm</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                  Talon Dos Watershed
                </span>
              </div>

              {/* Metric 3: Manila Bay Tide Gate Level */}
              <div className="p-3.5 rounded-xl bg-[#060a14] border border-cyan-950">
                <span className="text-[10px] font-mono text-slate-400 block mb-1 flex items-center gap-1">
                  <Waves className="w-3.5 h-3.5 text-sky-400" />
                  COASTAL TIDE ELEVATION
                </span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-mono font-bold tabular-nums ${
                    weather.tideCondition.manilaBayBackwaterRisk === 'CRITICAL' ? 'text-rose-400' : 'text-sky-300'
                  }`}>
                    +{weather.tideCondition.peakHeightMeters}m
                  </span>
                  <span className="text-xs font-mono text-slate-400">MSL</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-1 block truncate">
                  Peak: {weather.tideCondition.peakTime}
                </span>
              </div>

              {/* Metric 4: Atmospheric Pressure & Wind */}
              <div className="p-3.5 rounded-xl bg-[#060a14] border border-cyan-950">
                <span className="text-[10px] font-mono text-slate-400 block mb-1 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-cyan-400" />
                  WIND & HUMIDITY
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-mono font-bold text-slate-200 tabular-nums">
                    {weather.windSpeedKph} <span className="text-xs font-normal">km/h</span>
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                  RH: {weather.relativeHumidity}% · {weather.windDirection}
                </span>
              </div>
            </div>

            {/* Hourly Precipitation Trends Bar Chart (6-Hour Projection) */}
            <div className="p-4 rounded-xl bg-[#060a14] border border-cyan-950 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  6-HOUR PROJECTED RAINFALL INTENSITY & RUNOFF RISK
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  CLICK BAR TO INSPECT HYDRAULIC IMPACT
                </span>
              </div>

              {/* 6 Hour Forecast Columns */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2">
                {weather.hourlyTrends.map((trend, idx) => {
                  const isSelected = selectedHourIdx === idx;
                  const heightPercent = Math.min(100, Math.max(16, (trend.rainfallMmHr / 70) * 100));

                  let barColor = 'bg-cyan-500';
                  if (trend.runoffSurgeRisk === 'HIGH') barColor = 'bg-gradient-to-t from-rose-600 to-red-400';
                  else if (trend.runoffSurgeRisk === 'ELEVATED') barColor = 'bg-gradient-to-t from-amber-600 to-yellow-400';
                  else if (trend.runoffSurgeRisk === 'MODERATE') barColor = 'bg-gradient-to-t from-sky-600 to-cyan-400';

                  return (
                    <button
                      key={trend.time}
                      onClick={() => setSelectedHourIdx(idx)}
                      className={`group p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-950/60 border-cyan-400 ring-1 ring-cyan-400/50 shadow-lg'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-[10px] font-mono text-slate-400 mb-1">{trend.time}</span>

                      {/* Icon */}
                      <div className="my-1">
                        {getWeatherIcon(trend.icon)}
                      </div>

                      {/* Mini Bar Height Container */}
                      <div className="w-full h-16 bg-slate-950 rounded-lg p-1 flex items-end justify-center my-1.5 overflow-hidden">
                        <div
                          className={`w-full rounded transition-all duration-500 ${barColor}`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>

                      <div className="text-[11px] font-mono font-bold text-white tabular-nums">
                        {trend.rainfallMmHr} <span className="text-[9px] text-slate-400 font-normal">mm</span>
                      </div>

                      <span className={`text-[9px] font-mono font-bold mt-1 px-1.5 py-0.2 rounded uppercase ${
                        trend.runoffSurgeRisk === 'HIGH' ? 'text-rose-400 bg-rose-950' : trend.runoffSurgeRisk === 'ELEVATED' ? 'text-amber-400 bg-amber-950' : 'text-cyan-400 bg-cyan-950'
                      }`}>
                        {trend.runoffSurgeRisk}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Hour In-Depth Impact on Talon Dos Drainage */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-800/80">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  TIMELINE FOCUS: {selectedTrend.time} · {selectedTrend.condition}
                </span>
                <span className="text-[11px] text-slate-400">
                  Precipitation Probability: <strong>{selectedTrend.precipitationProb}%</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300 font-sans text-xs pt-1">
                <div>
                  <span className="font-mono text-[10px] uppercase text-slate-400 font-semibold block mb-0.5">
                    DRAINAGE RUNOFF IMPACT ON TALON DOS:
                  </span>
                  <p className="leading-relaxed">
                    {selectedTrend.rainfallMmHr >= 30
                      ? 'Severe cloudburst rates exceed box culvert gravity siphon capacity. Water inverts at Alabang-Zapote and Casimiro culverts will surge rapidly towards 85% critical overflow threshold.'
                      : selectedTrend.rainfallMmHr >= 15
                      ? 'Sustained moderate precipitation accelerates street gutter accumulation. Continuous flow expected; culvert velocity remaining at nominal 0.9 m/s.'
                      : 'Rainfall within nominal intake capacity. Gravity discharge to Zapote River tributaries expected to keep roadside gutters clear.'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#060a14] border border-cyan-950 font-mono text-[11px] text-slate-300 space-y-1">
                  <span className="text-sky-400 font-bold block mb-1">
                    MANILA BAY BACKWATER HYDRAULIC FACTOR:
                  </span>
                  <p className="leading-snug text-slate-400 text-[10px]">
                    {weather.tideCondition.explanation}
                  </p>
                  <div className="text-[10px] text-amber-400 pt-1 font-bold">
                    Risk Assessment: {weather.tideCondition.manilaBayBackwaterRisk} Backwater Drag
                  </div>
                </div>
              </div>
            </div>

            {/* Synoptic Bulletin Banner */}
            <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs font-mono text-slate-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-cyan-300 font-bold block text-[11px]">
                  METEOROLOGICAL ADVISORY FOR DRRMO TALON DOS:
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  {weather.synopticAdvisory}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
