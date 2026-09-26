import React, { useState } from 'react';
import { CheckCircle2, Database, Terminal, Wrench, Sparkles, ShieldCheck } from 'lucide-react';
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
        return <Database className="h-3 w-3 text-[var(--accent)]" />;
      case 'sql_planning':
        return <Terminal className="h-3 w-3 text-[var(--gold)]" />;
      case 'self_healing':
        return <Wrench className="h-3 w-3 text-[var(--coral)]" />;
      case 'visualization_synthesis':
        return <Sparkles className="h-3 w-3 text-[var(--accent)]" />;
      default:
        return <ShieldCheck className="h-3 w-3 text-[var(--success)]" />;
    }
  };

  return (
    <div className="border border-[var(--line)] bg-[var(--panel)] overflow-hidden mb-5 text-xs transition-all">
      
      {/* Header Bar / Witness Receipt */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-[var(--panel-card)] flex items-center justify-between text-left hover:bg-[var(--panel-input)] transition-colors border-b border-transparent hover:border-[var(--line)]"
        aria-expanded={isExpanded}
        aria-label="Toggle agent reasoning trace"
      >
        <div className="flex items-center gap-3 font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
          <span className="text-[var(--accent)]">
            {isExpanded ? '[-]' : '[+]'}
          </span>
          <span className="font-semibold text-[var(--ink)]">Pipeline Telemetry Receipt</span>
          <span className="text-[var(--muted-dim)]">
            ({steps.length} {steps.length === 1 ? 'stage' : 'stages'})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isStreaming ? (
            <span className="flex items-center gap-2 text-[var(--accent)] font-mono-tech text-[10px] uppercase tracking-wider px-2 py-0.5 border border-[var(--accent)]/30 bg-[var(--accent-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-signal flex-shrink-0" />
              <span className="truncate max-w-[240px]">{steps[steps.length - 1]?.message || "Analyzing ClickHouse..."}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[var(--success)] font-mono-tech text-[10px] uppercase tracking-wider px-2 py-0.5 border border-[var(--success)]/30 bg-[var(--success)]/10">
              <CheckCircle2 className="h-3 w-3" />
              <span>Pipeline Verified</span>
            </span>
          )}
        </div>
      </button>

      {/* Expanded Log Body */}
      {isExpanded && (
        <div className="p-3.5 space-y-2 max-h-72 overflow-y-auto border-t border-[var(--line)] bg-[var(--panel)]">
          {steps.map((step, idx) => {
            const isRunning = step.status === 'in_progress';
            const isRetry = step.status === 'retry';
            const isRepaired = step.status === 'repaired';

            return (
              <div
                key={idx}
                className={`p-3 border text-xs leading-relaxed transition-all ${
                  isRetry
                    ? 'border-[var(--coral)]/40 bg-[var(--coral-muted)] text-[var(--coral)]'
                    : isRepaired
                    ? 'border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--ink)]'
                    : isRunning
                    ? 'border-[var(--accent)]/40 bg-[var(--accent-muted)] text-[var(--ink)]'
                    : 'border-[var(--line)] bg-[var(--panel-card)] text-[var(--ink)]'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="font-mono-tech text-[9px] text-[var(--accent)] mt-0.5">
                    0{idx + 1}
                  </span>
                  <div className="mt-0.5 flex-shrink-0">
                    {getStepIcon(step.step)}
                  </div>
                  <span className="text-[9px] font-mono-tech uppercase tracking-wider text-[var(--muted)]">
                    [{step.step.replace(/_/g, ' ')}]
                  </span>
                  <span className="flex-1 font-medium text-xs break-words">{step.message}</span>
                </div>

                {/* Show SQL or Error if present */}
                {step.data?.sql && (
                  <div className="mt-2.5 p-2.5 border border-[var(--line)] bg-[var(--paper)] text-[var(--accent)] font-mono-tech text-[11px] overflow-x-auto">
                    <code>{step.data.sql}</code>
                  </div>
                )}
                {step.data?.error && (
                  <div className="mt-2 p-2 border border-[var(--coral)]/40 bg-[var(--paper)] text-[var(--coral)] font-mono-tech text-[10px] overflow-x-auto">
                    <code>Error: {step.data.error}</code>
                  </div>
                )}
                {/* Visual Dialect Repair Diff */}
                {step.data?.repaired_sql && (
                  <div className="mt-2.5 border border-[var(--line)] bg-[var(--paper)] overflow-hidden font-mono-tech text-[10px]">
                    <div className="px-2.5 py-1.5 bg-[var(--panel-input)] border-b border-[var(--line)] flex items-center justify-between text-[9px] uppercase tracking-wider text-[var(--muted)]">
                      <span className="flex items-center gap-1.5 text-[var(--accent)] font-medium">
                        <Wrench className="h-3 w-3" />
                        <span>Autonomous SQL Dialect Repair Diff</span>
                      </span>
                      <span className="text-[var(--success)] font-semibold">Repaired ✓</span>
                    </div>
                    {step.data.failed_sql && (
                      <div className="p-2 border-b border-[var(--line-subtle)] bg-[var(--coral-muted)]/20 text-[var(--coral)] overflow-x-auto flex items-start gap-2">
                        <span className="opacity-60 select-none font-bold">-</span>
                        <code className="break-all font-mono-tech">{step.data.failed_sql}</code>
                      </div>
                    )}
                    <div className="p-2 bg-[var(--success)]/10 text-[var(--success)] overflow-x-auto flex items-start gap-2">
                      <span className="opacity-60 select-none font-bold">+</span>
                      <code className="break-all font-mono-tech">{step.data.repaired_sql}</code>
                    </div>
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


