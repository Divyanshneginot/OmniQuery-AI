import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Loader2, Database, Terminal, Wrench, Sparkles, ShieldCheck } from 'lucide-react';
import type { AgentStep } from '../types';

interface AgentTraceLogProps {
  steps: AgentStep[];
  isStreaming: boolean;
}

export const AgentTraceLog: React.FC<AgentTraceLogProps> = ({ steps, isStreaming }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (steps.length === 0 && !isStreaming) return null;

  const getStepIcon = (stepName: string) => {
    switch (stepName) {
      case 'schema_introspection':
        return <Database className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />;
      case 'sql_planning':
        return <Terminal className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />;
      case 'self_healing':
        return <Wrench className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />;
      case 'visualization_synthesis':
        return <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141620] overflow-hidden mb-5 text-xs shadow-2xs transition-all">
      
      {/* Header Bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2.5 bg-slate-50/80 dark:bg-[#161822]/80 flex items-center justify-between text-left hover:bg-slate-100/80 dark:hover:bg-[#1c1f2b] transition-colors"
        aria-expanded={isExpanded}
        aria-label="Toggle agent reasoning trace"
      >
        <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200 font-semibold text-xs">
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          )}
          <span>Agent Execution Trace</span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
            ({steps.length} {steps.length === 1 ? 'stage' : 'stages'})
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          {isStreaming ? (
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/50 font-medium max-w-[280px]">
              <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
              <span className="truncate">{steps[steps.length - 1]?.message || "Analyzing ClickHouse schema..."}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50 font-medium">
              <CheckCircle2 className="h-3 w-3" />
              <span>Pipeline Verified</span>
            </span>
          )}
        </div>
      </button>

      {/* Expanded Log Body */}
      {isExpanded && (
        <div className="p-3.5 space-y-2 max-h-64 overflow-y-auto border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0f1118]">
          {steps.map((step, idx) => {
            const isRunning = step.status === 'in_progress';
            const isRetry = step.status === 'retry';
            const isRepaired = step.status === 'repaired';

            return (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-xs leading-relaxed transition-all ${
                  isRetry
                    ? 'bg-amber-50 dark:bg-amber-950/25 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200'
                    : isRepaired
                    ? 'bg-emerald-50 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200'
                    : isRunning
                    ? 'bg-indigo-50/60 dark:bg-indigo-950/25 border-indigo-200 dark:border-indigo-800/50 text-indigo-900 dark:text-indigo-200'
                    : 'bg-slate-50 dark:bg-[#161822] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex-shrink-0">
                    {getStepIcon(step.step)}
                  </div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] select-none uppercase font-bold tracking-wider">
                    [{step.step.replace(/_/g, ' ')}]
                  </span>
                  <span className="flex-1 break-words font-medium">{step.message}</span>
                </div>

                {/* Show SQL or Error if present */}
                {step.data?.sql && (
                  <div className="mt-2 p-2.5 rounded-lg bg-slate-900 text-indigo-200 font-mono text-[11px] overflow-x-auto border border-slate-800">
                    <code>{step.data.sql}</code>
                  </div>
                )}
                {step.data?.error && (
                  <div className="mt-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-[11px] overflow-x-auto">
                    <code>Error: {step.data.error}</code>
                  </div>
                )}
                {step.data?.repaired_sql && (
                  <div className="mt-2 p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-900 text-emerald-300 font-mono text-[11px] overflow-x-auto">
                    <code>Repaired: {step.data.repaired_sql}</code>
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


