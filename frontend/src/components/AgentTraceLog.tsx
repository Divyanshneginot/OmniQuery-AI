import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Terminal, CheckCircle2, Loader2, Sparkles, ShieldCheck, Wrench, Database } from 'lucide-react';
import type { AgentStep } from '../types';

interface AgentTraceLogProps {
  steps: AgentStep[];
  isStreaming: boolean;
}

export const AgentTraceLog: React.FC<AgentTraceLogProps> = ({ steps, isStreaming }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (steps.length === 0 && !isStreaming) return null;

  const getStepIcon = (stepName: string) => {
    switch (stepName) {
      case 'schema_introspection':
        return <Database className="h-3 w-3 text-cyan-400" />;
      case 'sql_planning':
        return <Terminal className="h-3 w-3 text-amber-400" />;
      case 'self_healing':
        return <Wrench className="h-3 w-3 text-rose-400" />;
      case 'visualization_synthesis':
        return <Sparkles className="h-3 w-3 text-violet-400" />;
      default:
        return <ShieldCheck className="h-3 w-3 text-emerald-400" />;
    }
  };

  return (
    <div className="cinema-glass rounded-xl border border-white/[0.08] overflow-hidden mb-4 text-xs font-mono shadow-2xl">
      
      {/* Header Bar */}
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="px-4 py-2.5 bg-zinc-950/80 border-b border-white/[0.08] flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5 text-zinc-200 font-semibold text-[11px]">
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5 text-zinc-500" /> : <ChevronDown className="h-3.5 w-3.5 text-cyan-400" />}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
            <Sparkles className="h-3 w-3" />
            <span className="font-bold">AGENT REASONING TRACE</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-normal">({steps.length} stages)</span>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          {isStreaming ? (
            <span className="flex items-center gap-1.5 text-cyan-400 bg-cyan-950/40 px-2.5 py-0.5 rounded-md border border-cyan-800/50">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Synthesizing pipeline...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-md border border-emerald-800/50">
              <CheckCircle2 className="h-3 w-3" />
              <span>Pipeline Verified</span>
            </span>
          )}
        </div>
      </div>

      {/* Log Body */}
      {!isCollapsed && (
        <div className="p-3 space-y-2 max-h-64 overflow-y-auto bg-[#07080b]/90">
          {steps.map((step, idx) => {
            const isRunning = step.status === 'in_progress';
            const isRetry = step.status === 'retry';
            const isRepaired = step.status === 'repaired';

            return (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-[11px] leading-relaxed transition-all ${
                  isRetry
                    ? 'bg-amber-950/25 border-amber-800/50 text-amber-300 shadow-sm'
                    : isRepaired
                    ? 'bg-emerald-950/25 border-emerald-800/50 text-emerald-300 shadow-sm'
                    : isRunning
                    ? 'bg-cyan-950/25 border-cyan-800/50 text-cyan-300 shadow-sm animate-pulse'
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex-shrink-0">
                    {getStepIcon(step.step)}
                  </div>
                  <span className="text-zinc-500 text-[10px] select-none uppercase font-bold tracking-wider">
                    [{step.step.replace(/_/g, ' ')}]
                  </span>
                  <span className="flex-1 break-words text-zinc-200">{step.message}</span>
                </div>

                {/* Show SQL or Error if present */}
                {step.data?.sql && (
                  <div className="mt-2 p-2.5 rounded-md bg-black/80 border border-zinc-800 text-cyan-300 text-[10px] overflow-x-auto">
                    <code>{step.data.sql}</code>
                  </div>
                )}
                {step.data?.error && (
                  <div className="mt-2 p-2.5 rounded-md bg-red-950/50 border border-red-900/60 text-red-300 text-[10px] overflow-x-auto">
                    <code>Error: {step.data.error}</code>
                  </div>
                )}
                {step.data?.repaired_sql && (
                  <div className="mt-2 p-2.5 rounded-md bg-emerald-950/50 border border-emerald-900/60 text-emerald-300 text-[10px] overflow-x-auto">
                    <code>Repaired SQL: {step.data.repaired_sql}</code>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

