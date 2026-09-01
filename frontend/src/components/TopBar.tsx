import React from 'react';
import { Terminal, Sparkles, Settings, Cpu, Activity, Film } from 'lucide-react';
import type { HealthResponse } from '../types';

interface TopBarProps {
  health: HealthResponse | null;
  activeMode: 'agent' | 'sql' | 'monitor';
  setActiveMode: (mode: 'agent' | 'sql' | 'monitor') => void;
  onOpenSettings: () => void;
  latencyMs?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  health,
  activeMode,
  setActiveMode,
  onOpenSettings,
  latencyMs
}) => {
  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950 border-b border-zinc-800 px-4 flex items-center justify-between text-xs select-none sticky top-0 z-20 backdrop-blur-xl">
      
      {/* Breadcrumb path with studio branding */}
      <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px]">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-900/90 border border-zinc-800 text-zinc-300">
          <Film className="h-3 w-3 text-amber-400" />
          <span className="font-semibold text-white">STUDIO</span>
        </div>
        <span className="text-zinc-600">/</span>
        <span className="text-zinc-400">clickhouse-cluster</span>
        <span className="text-zinc-600">/</span>
        <span className="text-cyan-400 font-semibold uppercase tracking-wider text-[10px]">
          {activeMode === 'agent' ? 'AI-Analyst' : activeMode === 'sql' ? 'SQL-Studio' : 'Live-Telemetry'}
        </span>
      </div>

      {/* Center 3-Mode Switcher */}
      <div className="flex items-center bg-zinc-950/80 p-1 rounded-xl border border-zinc-800 font-mono text-[11px] shadow-inner">
        <button
          onClick={() => setActiveMode('agent')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
            activeMode === 'agent'
              ? 'bg-zinc-800 border border-zinc-700 text-zinc-100 font-bold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Natural Language AI Analyst (⌘1)"
        >
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>AI Analyst</span>
        </button>
        <button
          onClick={() => setActiveMode('sql')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
            activeMode === 'sql'
              ? 'bg-zinc-800 border border-zinc-700 text-zinc-100 font-bold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Raw ClickHouse SQL Editor (⌘2)"
        >
          <Terminal className="h-3.5 w-3.5 text-amber-400" />
          <span>SQL Studio</span>
        </button>
        <button
          onClick={() => setActiveMode('monitor')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
            activeMode === 'monitor'
              ? 'bg-zinc-800 border border-zinc-700 text-zinc-100 font-bold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Real-Time Streaming & Studio Monitor (⌘3)"
        >
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          <span>Live Telemetry</span>
        </button>
      </div>

      {/* Right Controls & Telemetry */}
      <div className="flex items-center gap-2.5 font-mono text-[11px]">
        {latencyMs !== undefined && (
          <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/30 px-2.5 py-1 rounded-lg border border-emerald-800/40 shadow-sm">
            <Cpu className="h-3 w-3" />
            <span className="font-bold">{latencyMs}ms</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-zinc-300 bg-zinc-950/80 px-3 py-1 rounded-lg border border-zinc-800 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-[10px] uppercase tracking-wider">{health?.database_mode ? "ClickHouse Columnar" : "Connecting..."}</span>
        </div>

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg bg-zinc-950/80 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-all shadow-sm"
          title="Configure API Keys & Endpoints"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
};

