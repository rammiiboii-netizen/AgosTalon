import React from 'react';
import { Radio, Github, FileText, Server, ExternalLink } from 'lucide-react';

interface FooterProps {
  onOpenSystemDocs: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenSystemDocs }) => {
  return (
    <footer className="border-t border-cyan-950/60 bg-[#04070d] py-12 px-4 sm:px-6 lg:px-8 text-slate-400 font-mono text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
        <div className="space-y-3 max-w-md">
          <div className="flex items-center gap-2 text-white">
            <Radio className="w-5 h-5 text-cyan-400" />
            <span className="font-display font-bold text-base tracking-wide">
              AgosTalon // Talon Dos
            </span>
          </div>

          <p className="font-sans text-xs text-slate-400 leading-relaxed">
            Smart Drainage & Flood Risk Monitoring System designed for community-level environmental monitoring, early surcharge detection, and proactive disaster preparedness.
          </p>

          <div className="text-[11px] text-cyan-400 font-semibold tracking-wider">
            TALON DOS · LAS PIÑAS CITY · PHILIPPINES
          </div>

          <p className="text-slate-300 italic font-serif text-sm pt-1">
            "Detect early. Visualize clearly. Respond faster."
          </p>
        </div>

        {/* Links & Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-12">
          <div className="space-y-2">
            <span className="text-white font-bold tracking-wider text-[11px] uppercase block mb-1">
              SYSTEM NAVIGATION
            </span>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <a href="#gis-map" className="hover:text-cyan-400 transition-colors">
                  GIS Flood Risk Map
                </a>
              </li>
              <li>
                <a href="#live-status" className="hover:text-cyan-400 transition-colors">
                  Live Status & Weather Trends
                </a>
              </li>
              <li>
                <a href="#the-device" className="hover:text-cyan-400 transition-colors">
                  Hardware Prototype Showcase
                </a>
              </li>
              <li>
                <a href="#what-if" className="hover:text-cyan-400 transition-colors">
                  "What-If" Flood Simulator
                </a>
              </li>
              <li>
                <a href="#alert-center" className="hover:text-cyan-400 transition-colors">
                  Alert & Incident Response
                </a>
              </li>
              <li>
                <a href="#cenro-portal" className="hover:text-cyan-400 transition-colors">
                  Barangay / CENRO Portal
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <span className="text-white font-bold tracking-wider text-[11px] uppercase block mb-1">
              TECHNICAL REFERENCES
            </span>
            <div className="flex flex-col gap-2">
              <a
                href="#architecture"
                className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-2 transition-colors"
              >
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                <span>SYSTEM ARCHITECTURE</span>
              </a>

              <button
                onClick={onOpenSystemDocs}
                className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-2 transition-colors text-left"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>PROJECT DOCUMENTATION</span>
              </button>

              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-2 transition-colors"
              >
                <Github className="w-3.5 h-3.5 text-cyan-400" />
                <span>SOURCE CODE REPO</span>
                <ExternalLink className="w-3 h-3 text-slate-500 ml-auto" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-400">
        <div>
          © 2026 AgosTalon Engineering Team · Built for Talon Dos DRRMO & CENRO Las Piñas.
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            TELEMETRY BUS: SECURE TLS 1.3
          </span>
          <span>WGS84 GEOSPATIAL ENGINE</span>
        </div>
      </div>
    </footer>
  );
};
