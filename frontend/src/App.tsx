import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  AlertCircle, 
  CornerDownLeft, 
  Sparkles, 
  Film, 
  Zap, 
  BarChart3, 
  BrainCircuit, 
  Activity, 
  Database, 
  X, 
  SlidersHorizontal,
  ChevronRight,
  Flame
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { AgentTraceLog } from './components/AgentTraceLog';
import { ResultsWorkbench } from './components/ResultsWorkbench';
import { SettingsModal } from './components/SettingsModal';
import { SqlPlayground } from './components/SqlPlayground';
import { LiveMonitor } from './components/LiveMonitor';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { UploadDatasetModal } from './components/UploadDatasetModal';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import type { AgentStep, QueryResultPayload, HealthResponse, SchemaResponse } from './types';

const API_BASE_URL = 'http://localhost:8000/api';

const QUICK_PRESETS = [
  {
    icon: Film,
    label: 'Box Office ROI by Genre',
    query: 'Total gross revenue and average opening weekend by genre',
    color: 'text-zinc-400 border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:text-zinc-200'
  },
  {
    icon: Zap,
    label: 'p95 Streaming Latency',
    query: '95th percentile streaming CDN latency per service',
    color: 'text-zinc-400 border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:text-zinc-200'
  },
  {
    icon: BrainCircuit,
    label: 'Vector: Pacing Complaints',
    query: 'Find audience reviews complaining about pacing issues using semantic search',
    color: 'text-zinc-400 border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:text-zinc-200'
  },
  {
    icon: BarChart3,
    label: 'Top Studio Distributors',
    query: 'Which distributors have the highest net profit across all territories?',
    color: 'text-zinc-400 border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:text-zinc-200'
  },
  {
    icon: Flame,
    label: 'Vector: CGI & VFX Sentiment',
    query: 'Semantic search for negative audience feedback about bad CGI or visual effects',
    color: 'text-zinc-400 border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:text-zinc-200'
  }
];

export const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResultPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'agent' | 'sql' | 'monitor'>('agent');
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  
  // Modals & Toasts
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    fetchHealthAndSchema();
  }, []);

  const fetchHealthAndSchema = async () => {
    try {
      const [healthRes, schemaRes] = await Promise.all([
        fetch(`${API_BASE_URL}/health`),
        fetch(`${API_BASE_URL}/schema`)
      ]);
      if (healthRes.ok) setHealth(await healthRes.json());
      if (schemaRes.ok) setSchema(await schemaRes.json());
    } catch (err) {
      console.warn('Backend offline or initializing...');
    }
  };

  const handleRunQuery = async (targetQuery?: string) => {
    const q = (targetQuery || query).trim();
    if (!q || isStreaming) return;

    setError(null);
    setSteps([]);
    setQueryResult(null);
    setIsStreaming(true);

    if (!queryHistory.includes(q)) {
      setQueryHistory(prev => [q, ...prev.slice(0, 8)]);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/query/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to stream query`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to open event stream reader');

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6));
              if (eventData.type === 'step') {
                setSteps((prev) => {
                  const existingIdx = prev.findIndex((s) => s.step === eventData.step);
                  if (existingIdx >= 0) {
                    const copy = [...prev];
                    copy[existingIdx] = eventData;
                    return copy;
                  }
                  return [...prev, eventData];
                });
              } else if (eventData.type === 'complete') {
                setQueryResult(eventData.payload);
                showToast(`Executed in ${eventData.payload.execution_time_ms}ms (${eventData.payload.total_rows} rows)`);
              } else if (eventData.type === 'error') {
                setError(eventData.message);
                showToast(eventData.message, 'error');
              }
            } catch (jsonErr) {
              console.error('Error parsing SSE line:', jsonErr);
            }
          }
        }
      }
    } catch (err: any) {
      const msg = err.message || 'Server connection error';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsStreaming(false);
    }
  };

  const handleExecuteRawSql = async (sql: string) => {
    const res = await fetch(`${API_BASE_URL}/sql/raw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql }),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'SQL query failed');
    }
    const data = await res.json();
    showToast(`SQL executed in ${data.execution_time_ms}ms`);
    return data;
  };

  const handleSelectQuery = (selectedQuery: string) => {
    setQuery(selectedQuery);
    setActiveMode('agent');
    handleRunQuery(selectedQuery);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘+K or Ctrl+K -> Focus Search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveMode('agent');
        setTimeout(() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        }, 50);
      }
      // 1, 2, 3 -> Switch Mode (when not typing in an input)
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        if (e.key === '1') setActiveMode('agent');
        if (e.key === '2') setActiveMode('sql');
        if (e.key === '3') setActiveMode('monitor');
      }
      // ? -> Open Shortcuts Modal
      if (e.key === '?' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
      }
      // Esc -> Close modals
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsShortcutsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 selection:bg-zinc-800 selection:text-zinc-100 overflow-hidden font-sans relative">
      
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        schema={schema}
        health={health}
        onSelectQuery={handleSelectQuery}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        history={queryHistory}
        activeMode={activeMode}
        setActiveMode={setActiveMode}
      />

      {/* 2. Main Studio Canvas */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden z-10">
        
        {/* Top Bar with 3-Mode switcher */}
        <TopBar
          health={health}
          activeMode={activeMode}
          setActiveMode={setActiveMode}
          onOpenSettings={() => setIsSettingsOpen(true)}
          latencyMs={queryResult?.execution_time_ms}
        />

        {/* Scrollable Work Area */}
        <main className="flex-1 overflow-y-auto p-5 max-w-6xl w-full mx-auto space-y-5">
          
          {/* Mode 1: AI Analyst */}
          {activeMode === 'agent' && (
            <>
              {/* Command Bar Input */}
              <div className="relative group">
                <div className="relative bg-zinc-950 rounded-xl p-2.5 shadow-sm border border-zinc-800 focus-within:border-zinc-700 transition duration-200">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRunQuery();
                    }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 flex-shrink-0">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask film studio intelligence (e.g. 'Box office gross by genre', 'p95 streaming latency', 'Pacing issues in reviews')..."
                      disabled={isStreaming}
                      className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono tracking-wide"
                    />

                    {query && !isStreaming && (
                      <button
                        type="button"
                        onClick={() => setQuery('')}
                        className="text-zinc-500 hover:text-zinc-300 p-1 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-mono shadow-inner">
                        ⌘K
                      </kbd>
                      
                      <button
                        type="submit"
                        disabled={isStreaming || !query.trim()}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 text-[11px] font-mono font-semibold transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <span>{isStreaming ? 'Synthesizing...' : 'Execute'}</span>
                        <CornerDownLeft className="h-3 w-3 text-zinc-500" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Quick Presets Ribbon */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1 flex-shrink-0 mr-1">
                  <SlidersHorizontal className="h-3 w-3 text-zinc-600" />
                  <span>Presets:</span>
                </span>
                {QUICK_PRESETS.map((preset, idx) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectQuery(preset.query)}
                      disabled={isStreaming}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono whitespace-nowrap transition-all duration-150 ${preset.color}`}
                    >
                      <Icon className="h-3 w-3" />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/70 text-red-300 text-xs font-mono flex items-center gap-3 backdrop-blur-md shadow-lg shadow-red-950/20 animate-shake">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <span className="flex-1">{error}</span>
                </div>
              )}

              {/* Execution Trace Stream */}
              <AgentTraceLog steps={steps} isStreaming={isStreaming} />

              {/* Query Results & Workbench */}
              {queryResult && (
                <ResultsWorkbench
                  payload={queryResult}
                  onSelectFollowup={handleSelectQuery}
                  isLoading={isStreaming}
                  onShowToast={showToast}
                />
              )}

              {/* Empty State */}
              {!queryResult && steps.length === 0 && !isStreaming && (
                <div className="py-8 space-y-6">
                  
                  {/* Header */}
                  <div className="relative rounded-2xl bg-zinc-950 border border-zinc-800 p-8 text-center overflow-hidden">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] font-mono mb-4">
                      <span className="h-2 w-2 rounded-full bg-zinc-500" />
                      <span>SYSTEM READY</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 font-sans">
                      OmniQuery Analytics
                    </h2>
                    
                    <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-6 font-sans">
                      Autonomous NL-to-SQL synthesis & vector similarity querying powered by ClickHouse columnar OLAP across 50,000 film studio financial records, CDN stream metrics, and audience sentiments.
                    </p>

                    {/* Telemetry Status Ticker */}
                    <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] font-mono text-zinc-400">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800">
                        <Database className="h-3 w-3 text-zinc-400" />
                        <span>50,000 Records Seeded</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800">
                        <Zap className="h-3 w-3 text-zinc-400" />
                        <span>Sub-5ms Execution Latency</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800">
                        <BrainCircuit className="h-3 w-3 text-zinc-400" />
                        <span>Gemini 2.5 Pipeline</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800">
                        <Activity className="h-3 w-3 text-zinc-400" />
                        <span>SQL Engine</span>
                      </div>
                    </div>
                  </div>

                  {/* 3 Interactive Launch Deck Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Card 1 */}
                    <div 
                      onClick={() => handleSelectQuery("Total gross revenue and average opening weekend by genre")}
                      className="group bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 cursor-pointer transition-colors flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center group-hover:text-zinc-200 transition-colors">
                            <Film className="h-4 w-4" />
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">50k Movies</span>
                        </div>
                        <h4 className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">
                          Box Office & Financial ROI
                        </h4>
                        <p className="text-[11px] text-zinc-400 leading-normal">
                          Explore worldwide gross revenue, opening multipliers, and net profits categorized by film genre and studio distributor.
                        </p>
                      </div>
                      <div className="pt-3 flex items-center justify-between text-[10px] font-mono text-zinc-500 group-hover:text-zinc-300 transition-colors">
                        <span>Launch Analytics</span>
                        <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div 
                      onClick={() => handleSelectQuery("95th percentile streaming CDN latency per service")}
                      className="group bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 cursor-pointer transition-colors flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center group-hover:text-zinc-200 transition-colors">
                            <Activity className="h-4 w-4" />
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">75k Telemetry Logs</span>
                        </div>
                        <h4 className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">
                          Streaming CDN Infrastructure
                        </h4>
                        <p className="text-[11px] text-zinc-400 leading-normal">
                          Aggregate p95/p99 streaming edge latency, 4K bitrate consumption, and HTTP 5xx error spikes per distribution node.
                        </p>
                      </div>
                      <div className="pt-3 flex items-center justify-between text-[10px] font-mono text-zinc-500 group-hover:text-zinc-300 transition-colors">
                        <span>Inspect Stream Health</span>
                        <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Card 3 */}
                    <div 
                      onClick={() => handleSelectQuery("Find audience reviews complaining about pacing issues using semantic search")}
                      className="group bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 cursor-pointer transition-colors flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center group-hover:text-zinc-200 transition-colors">
                            <BrainCircuit className="h-4 w-4" />
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">15k Embeddings</span>
                        </div>
                        <h4 className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">
                          Vector Semantic Search
                        </h4>
                        <p className="text-[11px] text-zinc-400 leading-normal">
                          Run 16-dimensional cosine vector similarity against audience feedback to isolate screenplay pacing and CGI critique.
                        </p>
                      </div>
                      <div className="pt-3 flex items-center justify-between text-[10px] font-mono text-zinc-500 group-hover:text-zinc-300 transition-colors">
                        <span>Scan Vector Radar</span>
                        <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </>
          )}

          {/* Mode 2: Raw SQL Studio */}
          {activeMode === 'sql' && (
            <SqlPlayground onExecuteRawSql={handleExecuteRawSql} />
          )}

          {/* Mode 3: Live Telemetry Monitor */}
          {activeMode === 'monitor' && (
            <LiveMonitor onExecuteSql={handleExecuteRawSql} />
          )}

        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={() => fetchHealthAndSchema()}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Custom Dataset Upload Modal */}
      <UploadDatasetModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={(tableName) => {
          fetchHealthAndSchema();
          showToast(`Ingested table '${tableName}' into ClickHouse!`);
          handleSelectQuery(`Show overview and column statistics for ${tableName}`);
        }}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;

