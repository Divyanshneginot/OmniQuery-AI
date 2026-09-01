import React, { useState, useMemo } from 'react';
import { Table, ChevronDown, ChevronRight, History, Settings, Terminal, Search, X, Sparkles, Activity, Plus, Film } from 'lucide-react';
import type { SchemaResponse, HealthResponse } from '../types';

interface SidebarProps {
  schema: SchemaResponse | null;
  health: HealthResponse | null;
  onSelectQuery: (query: string) => void;
  onOpenSettings: () => void;
  onOpenUpload: () => void;
  history: string[];
  activeMode: 'agent' | 'sql' | 'monitor';
  setActiveMode: (mode: 'agent' | 'sql' | 'monitor') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  schema,
  health,
  onSelectQuery,
  onOpenSettings,
  onOpenUpload,
  history,
  activeMode,
  setActiveMode
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({
    box_office_revenue: true,
    streaming_platform_metrics: false,
    audience_reviews: false
  });

  const toggleTable = (tableName: string) => {
    setExpandedTables(prev => ({ ...prev, [tableName]: !prev[tableName] }));
  };

  const sampleQueries = [
    { label: "Vector: Pacing Sentiment", query: "Find audience reviews complaining about pacing issues using semantic search" },
    { label: "Vector: CGI / VFX Quality", query: "Semantic search for negative audience feedback about bad CGI or visual effects" },
    { label: "Box Office by Genre", query: "Total gross revenue and average opening weekend by genre" },
    { label: "p95 Streaming Latency", query: "95th percentile streaming CDN latency per service" },
    { label: "Top Distributors ROI", query: "Which distributors have the highest net profit across all territories?" }
  ];

  // Filtered schema tables & columns based on search
  const filteredTables = useMemo(() => {
    if (!schema) return {};
    if (!searchFilter.trim()) return schema.tables;
    
    const filter = searchFilter.toLowerCase();
    const result: Record<string, any> = {};

    for (const [tName, info] of Object.entries(schema.tables)) {
      const matchTable = tName.toLowerCase().includes(filter);
      const matchingCols = info.columns.filter((c: any) =>
        (c.column_name || c.name || '').toLowerCase().includes(filter)
      );

      if (matchTable || matchingCols.length > 0) {
        result[tName] = {
          ...info,
          columns: matchTable ? info.columns : matchingCols
        };
      }
    }
    return result;
  }, [schema, searchFilter]);

  return (
    <aside className="w-64 bg-[#08090c] border-r border-white/[0.08] flex flex-col h-screen flex-shrink-0 select-none text-xs z-20">
      
      {/* Workspace Brand Header */}
      <div className="p-3.5 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-extrabold text-white text-xs shadow-md">
            <Film className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white tracking-tight text-[13px]">OmniQuery</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                AI Studio
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Settings"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        
        {/* Navigation Modes */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold mb-2 px-1">
            Studio Workspaces
          </div>
          <div className="space-y-1">
            <button
              onClick={() => setActiveMode('agent')}
              className={`w-full text-left px-2.5 py-2 rounded-xl font-medium transition-all flex items-center gap-2.5 ${
                activeMode === 'agent'
                  ? 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <Sparkles className={`h-4 w-4 ${activeMode === 'agent' ? 'text-cyan-400' : 'text-zinc-500'}`} />
              <span>AI Analyst Studio</span>
            </button>
            <button
              onClick={() => setActiveMode('sql')}
              className={`w-full text-left px-2.5 py-2 rounded-xl font-medium transition-all flex items-center gap-2.5 ${
                activeMode === 'sql'
                  ? 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <Terminal className={`h-4 w-4 ${activeMode === 'sql' ? 'text-amber-400' : 'text-zinc-500'}`} />
              <span>SQL Studio</span>
            </button>
            <button
              onClick={() => setActiveMode('monitor')}
              className={`w-full text-left px-2.5 py-2 rounded-xl font-medium transition-all flex items-center gap-2.5 ${
                activeMode === 'monitor'
                  ? 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <Activity className={`h-4 w-4 ${activeMode === 'monitor' ? 'text-emerald-400' : 'text-zinc-500'}`} />
              <span>Live Telemetry</span>
            </button>
          </div>
        </div>

        {/* Quick Starred Templates */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold mb-2 px-1 flex items-center justify-between">
            <span>Film Studio Queries</span>
          </div>
          <div className="space-y-1">
            {sampleQueries.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSelectQuery(item.query)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] font-medium transition-colors flex items-center gap-2 truncate"
              >
                <Terminal className="h-3 w-3 text-zinc-600 flex-shrink-0" />
                <span className="truncate text-[11px] font-mono">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Database Schema Tree with Instant Search & Upload */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold mb-2 px-1 flex items-center justify-between">
            <span>ClickHouse Tables</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenUpload}
                className="px-2 py-0.5 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center gap-1 text-[10px] transition-colors border border-white/[0.08]"
                title="Upload custom CSV/Parquet dataset"
              >
                <Plus className="h-2.5 w-2.5 text-cyan-400" />
                <span>Upload</span>
              </button>
              {schema && (
                <span className="text-[10px] text-zinc-500 font-mono">
                  {Object.keys(schema.tables).length}
                </span>
              )}
            </div>
          </div>

          {/* Schema Search Input */}
          <div className="relative mb-2">
            <Search className="h-3 w-3 text-zinc-500 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search tables & cols..."
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2 py-1 pl-7 text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 font-mono"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="space-y-1">
            {Object.keys(filteredTables).length > 0 ? (
              Object.entries(filteredTables).map(([tableName, info]: [string, any]) => {
                const isExpanded = searchFilter ? true : !!expandedTables[tableName];
                return (
                  <div key={tableName} className="rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleTable(tableName)}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/[0.04] text-zinc-300 flex items-center justify-between transition-colors font-mono"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3 text-cyan-400" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-zinc-600" />
                        )}
                        <Table className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="truncate font-semibold text-[11px]">{tableName}</span>
                      </span>
                      <span className="text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.2 rounded border border-zinc-800">
                        {info.row_count > 1000 ? `${(info.row_count / 1000).toFixed(0)}k` : info.row_count}
                      </span>
                    </button>

                    {/* Expanded Columns List */}
                    {isExpanded && (
                      <div className="ml-4 pl-2 border-l border-zinc-800 my-1 space-y-0.5 font-mono text-[11px]">
                        {info.columns.map((col: any, cIdx: number) => (
                          <div
                            key={cIdx}
                            onClick={() => onSelectQuery(`Query ${tableName} grouping by ${col.column_name || col.name}`)}
                            className="px-1.5 py-0.5 rounded text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/10 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <span className="truncate">{col.column_name || col.name}</span>
                            <span className="text-[9px] text-zinc-600 truncate max-w-[60px]">
                              {col.column_type || col.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-zinc-600 text-[11px] px-2 py-1 font-mono">No matching columns</div>
            )}
          </div>
        </div>

        {/* Recent Execution History */}
        {history.length > 0 && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold mb-2 px-1 flex items-center gap-1">
              <History className="h-3 w-3" />
              <span>Recent Prompts</span>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => onSelectQuery(h)}
                  className="w-full text-left px-2 py-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] truncate transition-colors"
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* System Telemetry Footer */}
      <div className="p-3.5 border-t border-white/[0.08] bg-[#07080a] text-[11px] font-mono space-y-1.5">
        <div className="flex items-center justify-between text-zinc-300">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <span className="font-semibold">ClickHouse Engine</span>
          </span>
          <span className="text-zinc-500 text-[10px]">140k Rows</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-zinc-500">
          <span>AI: {health?.model || "Gemini 2.5"}</span>
          <span className="text-emerald-400">Online</span>
        </div>
      </div>
    </aside>
  );
};

