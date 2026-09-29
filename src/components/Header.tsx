import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Play, Sliders, Radio, Compass, Menu, X, Cpu, Sparkles, Layers, Users } from 'lucide-react';
import { SimulationState } from '../types';

interface HeaderProps {
  simulation: SimulationState;
  onOpenSimulation: () => void;
  onStartGuidedDemo: () => void;
  activeSection: string;
}

export const Header: React.FC<HeaderProps> = ({
  simulation,
  onOpenSimulation,
  onStartGuidedDemo,
}) => {
  const [phTime, setPhTime] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Philippines Time UTC+8
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Manila',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      setPhTime(new Intl.DateTimeFormat('en-GB', options).format(now) + ' PHT');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isCritical = simulation.waterLevel >= 80 || simulation.drainageCondition === 'POSSIBLE_BLOCKAGE';
  const isWarning = !isCritical && (simulation.waterLevel >= 50 || simulation.drainageCondition === 'POTENTIALLY_RESTRICTED');

  const navLinks = [
    { href: '#gis-map', label: 'Live Map', icon: Compass },
    { href: '#live-status', label: 'Status & Radar', icon: Activity },
    { href: '#the-device', label: 'The Device', icon: Cpu },
    { href: '#what-if', label: 'Simulator', icon: Sliders },
    { href: '#alert-center', label: 'Alert Center', icon: ShieldAlert },
    { href: '#cenro-portal', label: 'CENRO Portal', icon: Users },
    { href: '#architecture', label: 'Architecture', icon: Layers },
    { href: '#impact', label: 'Impact', icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-cyan-950/40 bg-[#060a12]/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Wordmark */}
        <a href="#hero" className="flex items-center gap-2 sm:gap-3 shrink-0 group">
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400/60 transition-colors">
            <Radio className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            <div className="absolute -inset-0.5 rounded-lg bg-cyan-500/10 blur-sm -z-10 group-hover:bg-cyan-500/20 transition-all" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-display font-bold text-base sm:text-lg tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                AgosTalon
              </span>
              <span className="text-[10px] sm:text-xs font-mono text-cyan-400/90 px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/50">
                TALON DOS
              </span>
            </div>
            <p className="hidden sm:block text-[10px] text-slate-400 font-mono tracking-wider">
              LAS PIÑAS DRRMC // IOT RISK RADAR
            </p>
          </div>
        </a>

        {/* Zone 2: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-xs font-medium tracking-wide text-slate-300">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-cyan-400 transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                <Icon className="w-3.5 h-3.5 text-cyan-500" />
                <span>{link.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Actions & System Status */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Live PHT Clock */}
          <div className="hidden md:flex flex-col text-right font-mono text-xs">
            <span className="text-slate-200 tabular-nums font-semibold">{phTime || '22:42:18 PHT'}</span>
            <span className="text-[10px] text-emerald-400 flex items-center justify-end gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              TELEMETRY SYNCED
            </span>
          </div>

          {/* System status pill */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-mono border ${
              isCritical
                ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                : isWarning
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isCritical ? 'bg-rose-400 animate-pulse' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span>{isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'ONLINE'}</span>
          </div>

          {/* Interactive Simulation Drawer Trigger */}
          <button
            onClick={onOpenSimulation}
            className="flex items-center justify-center min-h-[40px] px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/40 rounded-lg transition-all shadow-sm active:scale-95"
            title="Adjust simulation parameters"
            aria-label="Open Simulation Bench"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400 sm:mr-1.5" />
            <span className="hidden sm:inline">Simulation</span>
          </button>

          {/* The Hackathon Presentation Centerpiece: DEMO THE SYSTEM */}
          <button
            onClick={onStartGuidedDemo}
            className="relative group flex items-center justify-center min-h-[40px] px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-lg shadow-cyan-900/30 border border-cyan-400/40 transition-all active:scale-95 whitespace-nowrap"
            title="Start 90-Second Guided System Demonstration"
          >
            <Play className="w-3.5 h-3.5 fill-current text-white animate-pulse mr-1 sm:mr-1.5" />
            <span className="tracking-wide hidden xs:inline sm:inline">DEMO</span>
            <span className="tracking-wide hidden sm:inline">&nbsp;SYSTEM</span>
            <span className="ml-1 px-1 sm:px-1.5 py-0.2 text-[9px] font-mono font-bold bg-amber-400 text-slate-950 rounded uppercase shadow">
              90s
            </span>
          </button>

          {/* Mobile Hamburger Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900/90 border border-slate-700/70 text-slate-200 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#070d1a]/98 border-b border-cyan-900/60 px-4 pt-3 pb-5 shadow-2xl backdrop-blur-xl animate-fadeIn">
          {/* Mobile Status Header */}
          <div className="flex items-center justify-between pb-3 border-b border-cyan-950/80 mb-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isCritical ? 'bg-rose-400 animate-ping' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
              <span className="text-slate-300">
                {isCritical ? 'CRITICAL ALERT' : isWarning ? 'WARNING RUNOFF' : 'SYSTEM ONLINE'}
              </span>
            </div>
            <span className="text-cyan-400 tabular-nums">{phTime}</span>
          </div>

          {/* Navigation Links Grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-200 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-950/30 transition-all active:scale-98"
                >
                  <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="truncate">{link.label}</span>
                </a>
              );
            })}
          </div>

          {/* Mobile Fast Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-cyan-950/80">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSimulation();
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 active:scale-95"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Simulation Bench</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onStartGuidedDemo();
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-xs font-bold text-white shadow-lg shadow-cyan-950 active:scale-95"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Guided Demo (90s)</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
