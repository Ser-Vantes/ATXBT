import React from 'react';
import { Download, Terminal } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onExportSpec: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, onExportSpec }) => {
  const navItems = [
    { id: 'nexus-analysis', label: 'Nexus Analysis' },
    { id: 'topology', label: 'Microservice Topology' },
    { id: 'matching-engine', label: 'Rust Engine Lab' },
    { id: 'kafka-stream', label: 'Kafka Event Log' },
    { id: 'fault-tolerance', label: 'Chaos & Failover' },
    { id: 'roadmap-code', label: 'Implementation Plan' },
    { id: 'mcp-agent', label: 'Nexus MCP Agent' },
  ];

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950 sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a 
          href="#architecture" 
          onClick={(e) => { e.preventDefault(); onTabChange('nexus-analysis'); }}
          className="text-base font-bold tracking-tight text-white whitespace-nowrap hover:text-emerald-400 transition-colors"
        >
          NexusCore Architecture
        </a>
      </div>

      {/* Zone 2: Concise single-line text navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-300">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`whitespace-nowrap transition-colors relative py-1 text-left ${
                isActive
                  ? 'text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onExportSpec}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors whitespace-nowrap shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Architecture Spec</span>
        </button>
      </div>
    </header>
  );
};
