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
      query: 'Show me 95th percentile streaming latency and error counts per service endpoint.',
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
    <aside className="w-64 bg-white dark:bg-[#0f1118] border-r border-slate-200 dark:border-slate-800/80 flex flex-col h-screen flex-shrink-0 select-none text-xs z-30 transition-all duration-200">
      
      {/* Workspace Brand & Collapse Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            O
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white tracking-tight text-xs">OmniQuery</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">Film Studio Analytics</div>
          </div>
        </div>
        <button
          onClick={onToggleCollapse}
          aria-label="Collapse sidebar"
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          title="Collapse sidebar"
        >
          <ChevronDown className="h-4 w-4 transform rotate-90" />
        </button>
      </div>

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        
        {/* New Analysis Action */}
        <button
          onClick={onNewAnalysis}
          className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161822] hover:bg-slate-100 dark:hover:bg-[#1c1f2b] text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between transition-all shadow-xs"
        >
          <span className="flex items-center gap-2">
            <Plus className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>New Analysis</span>
          </span>
          <kbd className="text-[10px] text-slate-400 dark:text-slate-500 font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">⌘N</kbd>
        </button>

        {/* Featured Studio Inquiries */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-1.5">
            Featured Inquiries
          </div>
          <div className="space-y-0.5">
            {curatedPresets.map((preset, idx) => {
              const Icon = preset.icon;
              const isActive = activeQuery.toLowerCase().includes(preset.label.toLowerCase().slice(0, 10));
              return (
                <button
                  key={idx}
                  onClick={() => onSelectQuery(preset.query)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-colors ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold border border-indigo-200/60 dark:border-indigo-800/40'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  <span className="truncate">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Inquiries History */}
        {history.length > 0 && (
          <div>
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-1.5">
              Recent Queries
            </div>
            <div className="space-y-0.5">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => onSelectQuery(h)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 text-xs truncate transition-colors"
                >
                  <span className="truncate block">{h}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ClickHouse Tables Accordion (Progressive Disclosure) */}
        {schema && Object.keys(schema.tables).length > 0 && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
            <button
              onClick={() => setIsTablesOpen(!isTablesOpen)}
              aria-expanded={isTablesOpen}
              aria-label="Toggle schema tables list"
              className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              <span>Schema ({Object.keys(schema.tables).length} Tables)</span>
              {isTablesOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>

            {isTablesOpen && (
              <div className="mt-1 space-y-0.5 pl-1">
                {Object.entries(schema.tables).map(([tableName, info]: [string, TableInfo]) => (
                  <button
                    key={tableName}
                    onClick={() => onSelectQuery(`Inspect top 10 records from ${tableName}`)}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-xs flex items-center justify-between transition-colors font-mono"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Table className="h-3 w-3 text-slate-400" />
                      <span className="truncate text-[11px]">{tableName}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
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
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#0c0e15] space-y-2">
        <div className="flex items-center justify-between text-[11px] px-1">
          <span className="text-slate-500 dark:text-slate-400 font-medium">OLAP Status</span>
          <span className="flex items-center gap-1.5 font-semibold text-[11px]">
            <span className={`h-1.5 w-1.5 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            <span className={health?.status === 'healthy' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
              {health?.status === 'healthy' ? 'Online' : 'Connecting'}
            </span>
          </span>
        </div>

        <button
          onClick={onOpenUpload}
          className="w-full py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161822] hover:bg-slate-50 dark:hover:bg-[#1c1f2b] text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
        >
          <Upload className="h-3 w-3 text-slate-400" />
          <span>Upload Studio CSV</span>
        </button>
      </div>

    </aside>
  );
};


