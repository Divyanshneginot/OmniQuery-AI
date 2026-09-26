import React, { useState } from 'react';
import { Plus, BarChart2, Activity, MessageSquare, Upload, ChevronDown, ChevronRight, Table } from 'lucide-react';
import type { SchemaResponse, HealthResponse, TableInfo } from '../types';

interface SidebarProps {
  schema: SchemaResponse | null;
  health: HealthResponse | null;
  onSelectQuery: (query: string) => void;
  onNewAnalysis: () => void;
  onOpenUpload: () => void;
  history: string[];
  activeQuery?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  schema,
  health,
  onSelectQuery,
  onNewAnalysis,
  onOpenUpload,
  history,
  activeQuery = '',
  isCollapsed,
  onToggleCollapse
}) => {
  const [isTablesOpen, setIsTablesOpen] = useState(false);

  const curatedPresets = [
    {
      label: 'Q2 European Net Profits',
      query: 'Which movie genre yielded the highest net profit across European screens in Q2?',
      icon: BarChart2
    },
    {
      label: 'CDN Streaming Latency (p95)',
      query: 'Show me 95th percentile streaming latency using quantileExact(0.95) and error counts per service endpoint.',
      icon: Activity
    },
    {
      label: 'Audience Pacing & VFX',
      query: 'Find audience reviews complaining about pacing issues using semantic search.',
      icon: MessageSquare
    }
  ];

  if (isCollapsed) {
    return null;
  }

  return (
    <aside className="w-64 bg-[var(--panel)] border-r border-[var(--line)] flex flex-col h-screen flex-shrink-0 select-none text-xs z-30 transition-all duration-200">
      
      {/* Workspace Brand & Collapse Header */}
      <div className="p-3.5 border-b border-[var(--line)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 bg-[var(--accent)] text-[var(--paper)] flex items-center justify-center font-bold text-xs font-mono-tech">
            O
          </div>
          <div>
            <div className="font-semibold text-[var(--ink)] tracking-tight text-xs flex items-center gap-1">
              <span>OmniQuery</span>
              <span className="text-[var(--accent)] text-[10px]">●</span>
            </div>
            <div className="text-[9px] font-mono-tech uppercase tracking-wider text-[var(--muted)]">Studio Telemetry</div>
          </div>
        </div>
        <button
          onClick={onToggleCollapse}
          aria-label="Collapse sidebar"
          className="p-1 border border-[var(--line)] hover:border-[var(--accent)] text-[var(--muted)] hover:text-[var(--ink)] bg-[var(--panel-input)] transition-colors"
          title="Collapse sidebar"
        >
          <ChevronDown className="h-3.5 w-3.5 transform rotate-90" />
        </button>
      </div>

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        
        {/* New Analysis Action */}
        <button
          onClick={onNewAnalysis}
          className="w-full py-2 px-3 border border-[var(--line)] hover:border-[var(--accent)] bg-[var(--panel-input)] text-[var(--ink)] text-[11px] font-mono-tech uppercase tracking-wider flex items-center justify-between transition-all hover:-translate-y-0.5 group"
        >
          <span className="flex items-center gap-2">
            <Plus className="h-3.5 w-3.5 text-[var(--accent)] group-hover:rotate-90 transition-transform" />
            <span>New Analysis</span>
          </span>
          <kbd className="text-[9px] text-[var(--muted)] font-mono-tech bg-[var(--paper)] px-1.5 py-0.5 border border-[var(--line)]">⌘N</kbd>
        </button>

        {/* Featured Studio Inquiries */}
        <div>
          <div className="text-[9px] font-mono-tech font-semibold text-[var(--muted)] uppercase tracking-[0.14em] px-1 mb-2 flex items-center justify-between">
            <span>Inquiries</span>
            <span className="text-[var(--accent)]">LIVE</span>
          </div>
          <div className="space-y-1">
            {curatedPresets.map((preset, idx) => {
              const Icon = preset.icon;
              const isActive = activeQuery.toLowerCase().includes(preset.label.toLowerCase().slice(0, 10));
              return (
                <button
                  key={idx}
                  onClick={() => onSelectQuery(preset.query)}
                  className={`w-full text-left px-2.5 py-2 border transition-all text-xs flex items-start gap-2.5 ${
                    isActive
                      ? 'border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--ink-bright)]'
                      : 'border-[var(--line)] hover:border-[var(--accent)] bg-[var(--panel-card)] text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium leading-tight">{preset.label}</div>
                  </div>
                  <Icon className="h-3 w-3 text-[var(--muted)] flex-shrink-0 mt-0.5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Inquiries History */}
        {history.length > 0 && (
          <div>
            <div className="text-[9px] font-mono-tech font-semibold text-[var(--muted)] uppercase tracking-[0.14em] px-1 mb-2">
              History
            </div>
            <div className="space-y-1">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => onSelectQuery(h)}
                  className="w-full text-left px-2.5 py-1.5 border border-[var(--line-subtle)] hover:border-[var(--line-strong)] bg-[var(--panel-card)] text-[var(--muted)] hover:text-[var(--ink)] text-xs truncate transition-colors font-mono-tech"
                >
                  <span className="truncate block text-[11px]">{h}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ClickHouse Tables Accordion */}
        {schema && Object.keys(schema.tables).length > 0 && (
          <div className="pt-2 border-t border-[var(--line)]">
            <button
              onClick={() => setIsTablesOpen(!isTablesOpen)}
              aria-expanded={isTablesOpen}
              aria-label="Toggle schema tables list"
              className="w-full flex items-center justify-between px-1 py-1 text-[9px] font-mono-tech font-semibold text-[var(--muted)] uppercase tracking-[0.14em] hover:text-[var(--ink)] transition-colors"
            >
              <span>Catalog ({Object.keys(schema.tables).length})</span>
              {isTablesOpen ? <ChevronDown className="h-3 w-3 text-[var(--accent)]" /> : <ChevronRight className="h-3 w-3" />}
            </button>

            {isTablesOpen && (
              <div className="mt-2 space-y-1">
                {Object.entries(schema.tables).map(([tableName, info]: [string, TableInfo]) => (
                  <button
                    key={tableName}
                    onClick={() => onSelectQuery(`Inspect top 10 records from ${tableName}`)}
                    className="w-full text-left px-2.5 py-1.5 border border-[var(--line)] hover:border-[var(--accent)] bg-[var(--panel-card)] text-[var(--muted)] hover:text-[var(--ink)] text-xs flex items-center justify-between transition-colors font-mono-tech"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Table className="h-3 w-3 text-[var(--accent)]" />
                      <span className="truncate text-[10px]">{tableName}</span>
                    </span>
                    <span className="text-[9px] text-[var(--muted-dim)] border border-[var(--line)] px-1 py-0.2">
                      {info.row_count > 1000 ? `${(info.row_count / 1000).toFixed(0)}k` : info.row_count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer: Database Status & Custom CSV Ingestion */}
      <div className="p-3 border-t border-[var(--line)] bg-[var(--panel-input)] space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono-tech uppercase tracking-wider px-1">
          <span className="text-[var(--muted)]">Telemetry Engine</span>
          <span className="flex items-center gap-1.5 text-[var(--ink)] font-semibold">
            <span className={`h-1.5 w-1.5 rounded-full ${health?.status === 'healthy' ? 'bg-[var(--accent)] animate-pulse' : 'bg-[var(--gold)]'}`}></span>
            <span>{health?.status === 'healthy' ? 'Online' : 'Reconnecting'}</span>
          </span>
        </div>

        <button
          onClick={onOpenUpload}
          className="w-full py-2 px-2 border border-[var(--line)] hover:border-[var(--accent)] bg-[var(--panel-card)] text-[10px] font-mono-tech uppercase tracking-wider text-[var(--ink)] hover:text-[var(--accent)] flex items-center justify-center gap-1.5 transition-colors"
        >
          <Upload className="h-3 w-3 text-[var(--accent)]" />
          <span>Upload Dataset +</span>
        </button>
      </div>

    </aside>
  );
};



