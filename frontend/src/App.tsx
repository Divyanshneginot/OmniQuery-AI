import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  AlertCircle, 
  Film, 
  BrainCircuit, 
  Activity, 
  X, 
  ChevronRight,
  Upload,
  CornerDownLeft,
  RotateCcw
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { AgentTraceLog } from './components/AgentTraceLog';
import { ResultsWorkbench } from './components/ResultsWorkbench';
import { SettingsModal } from './components/SettingsModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { UploadDatasetModal } from './components/UploadDatasetModal';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import type { AgentStep, QueryResultPayload, HealthResponse, SchemaResponse, ThemeMode } from './types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '');

function sanitizeErrorMessage(msg: string): { friendly: string; technical?: string } {
  if (!msg) return { friendly: 'An unexpected issue occurred while analyzing data. Please try again.' };
  
  if (msg.includes('ClickHouse exception') || msg.includes('DB::Exception') || msg.includes('quantile_cont') || msg.includes('http') || msg.includes('concurrent queries')) {
    const strippedTech = msg
      .replace(/https?:\/\/[^\s)]+/g, '[clickhouse-cloud]')
      .replace(/Code:\s*\d+\.?/g, '')
      .replace(/DB::Exception:\s*/g, '')
      .replace(/Received ClickHouse exception.*server response:\s*/gi, '')
      .trim();

    return {
      friendly: 'A cloud database dialect adjustment is being completed on the backend. Please click Retry Analysis to rerun with the native ClickHouse dialect.',
      technical: strippedTech
    };
  }

  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Server connection error')) {
    return {
      friendly: 'Unable to reach the analytical backend. The cloud container may be completing a zero-downtime deployment or waking up. Please wait a few seconds and retry.',
    };
  }

  return { friendly: msg };
}

const CURATED_PROMPTS = [
  {
    title: 'Box Office & Margins',
    description: 'Theatrical gross revenue, opening multipliers, and net profits by genre.',
    query: 'Which movie genres yielded the highest net profit across European screens in Q2?',
    icon: Film,
    metric: '10,000 records'
  },
  {
    title: 'Streaming CDN Telemetry',
    description: 'p95 player latency, HTTP 5xx error spikes, and edge QoS metrics.',
    query: 'Show me 95th percentile streaming latency and error counts per service endpoint.',
    icon: Activity,
    metric: '15,000 logs'
  },
  {
    title: 'Audience Review Sentiment',
    description: 'Semantic vector similarity on screenplay pacing and visual effects feedback.',
    query: 'Find audience reviews complaining about pacing issues using semantic search.',
    icon: BrainCircuit,
    metric: '5,000 reviews'
  }
];

export const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResultPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queryHistory, setQueryHistory] = useState<string[]>([
    'Which movie genres yielded the highest net profit across European screens in Q2?',
    'Show me 95th percentile streaming latency and error counts per service endpoint.',
    'Find audience reviews complaining about pacing issues using semantic search.'
  ]);

  // Theme & Sidebar State
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modals & Notifications
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const fetchHealthAndSchema = useCallback(async () => {
    try {
      const [healthRes, schemaRes] = await Promise.all([
        fetch(`${API_BASE_URL}/health`),
        fetch(`${API_BASE_URL}/schema`)
      ]);
      if (healthRes.ok) {
        setHealth(await healthRes.json());
        setIsWarmingUp(false);
      } else {
        setIsWarmingUp(true);
      }
      if (schemaRes.ok) setSchema(await schemaRes.json());
    } catch {
      setIsWarmingUp(true);
      console.warn('Backend offline or warming up from sleep...');
    }
  }, []);

  useEffect(() => {
    fetchHealthAndSchema();
    const timer = setInterval(() => {
      fetchHealthAndSchema();
    }, 8000);
    return () => clearInterval(timer);
  }, [fetchHealthAndSchema]);

  const handleRunQuery = async (targetQuery?: string) => {
    const q = (targetQuery || query).trim();
    if (!q || isStreaming) return;

    setError(null);
    setSteps([]);
    setQueryResult(null);
    setIsStreaming(true);
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

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

      const processLine = (line: string) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const eventData = JSON.parse(trimmed.slice(6));
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
            } else if (eventData.type === 'complete' || eventData.type === 'result') {
              const payload = eventData.payload ?? eventData.data ?? eventData;
              setQueryResult(payload);
              mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              showToast(`Executed in ${payload.execution_time_ms}ms (${payload.total_rows} rows)`);
            } else if (eventData.type === 'error') {
              setError(eventData.message);
              showToast(eventData.message, 'error');
            }
          } catch (jsonErr) {
            console.error('Error parsing SSE line:', jsonErr);
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (buffer.trim()) {
            buffer.split(/\r?\n/).forEach(processLine);
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n\r?\n/);
        buffer = lines.pop() || '';

        for (const block of lines) {
          block.split(/\r?\n/).forEach(processLine);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Server connection error';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSelectQuery = (selectedQuery: string) => {
    setQuery(selectedQuery);
    handleRunQuery(selectedQuery);
  };

  const handleNewAnalysis = () => {
    setQueryResult(null);
    setSteps([]);
    setError(null);
    setQuery('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewAnalysis();
      }
      if (e.key === '?' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsShortcutsOpen(false);
        setIsUploadOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0b0d13] text-slate-900 dark:text-slate-100 overflow-hidden font-sans selection:bg-indigo-500/20">
      
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        schema={schema}
        health={health}
        onSelectQuery={handleSelectQuery}
        onNewAnalysis={handleNewAnalysis}
        onOpenUpload={() => setIsUploadOpen(true)}
        history={queryHistory}
        activeQuery={query}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
      />

      {/* 2. Main Studio Canvas */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden z-10">
        
        {/* Top Navigation Bar */}
        <TopBar
          health={health}
          isWarmingUp={isWarmingUp}
          activeTitle={queryResult ? (queryResult.chart_spec.title || queryResult.user_query) : "Studio Analytics & Telemetry"}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
          onShare={() => {
            navigator.clipboard.writeText(window.location.href);
            showToast("Report URL copied to clipboard");
          }}
          onExport={queryResult ? () => {
            const headers = queryResult.columns.join(',');
            const csvRows = queryResult.rows.map(r =>
              queryResult.columns.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',')
            );
            const content = [headers, ...csvRows].join('\n');
            const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `omniquery_studio_${Date.now()}.csv`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            showToast(`Exported ${queryResult.rows.length} rows to CSV`);
          } : undefined}
        />

        {/* Scrollable Conversational Feed */}
        <main ref={mainRef} className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 flex flex-col items-center">
          <div className="w-full max-w-3xl space-y-6">
            
            {/* Warming Up Notice */}
            {isWarmingUp && !health && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2 w-2 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                  <span>
                    <strong>Cloud Instance Warming Up:</strong> Render free tier instance is waking up (~30s). Live queries will execute smoothly as soon as connected.
                  </span>
                </div>
              </div>
            )}
            
            {/* User Inquiry Message */}
            {(queryResult || isStreaming) && (
              <div className="flex items-start gap-3.5 pb-2">
                <div className="h-8 w-8 rounded-full bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                  DN
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-1">You</div>
                  <div className="text-base text-slate-900 dark:text-white font-semibold leading-relaxed">
                    {query || queryResult?.user_query}
                  </div>
                </div>
              </div>
            )}

            {/* Executive Analysis Notice Card */}
            {error && (() => {
              const { friendly, technical } = sanitizeErrorMessage(error);
              return (
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141620] border border-amber-200/80 dark:border-amber-900/40 shadow-xs space-y-3.5 animate-fadeIn">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/80 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Analysis Notice
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {friendly}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleRunQuery()}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Retry Analysis</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectQuery(CURATED_PROMPTS[1].query)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Try Telemetry Prompt
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectQuery(CURATED_PROMPTS[0].query)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Try Box Office Prompt
                    </button>
                  </div>

                  {technical && (
                    <details className="pt-1 text-[11px] text-slate-400 dark:text-slate-500">
                      <summary className="cursor-pointer hover:text-slate-600 dark:hover:text-slate-400 transition-colors font-medium">
                        Diagnostic details
                      </summary>
                      <pre className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400 overflow-x-auto whitespace-pre-wrap">
                        {technical}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })()}

            {/* Execution Trace Stream */}
            <AgentTraceLog steps={steps} isStreaming={isStreaming} />

            {/* Query Results & Executive Memo */}
            {queryResult && (
              <ResultsWorkbench
                payload={queryResult}
                onSelectFollowup={handleSelectQuery}
                isLoading={isStreaming}
                onShowToast={showToast}
              />
            )}

            {/* Empty State / Welcome Screen */}
            {!queryResult && steps.length === 0 && !isStreaming && (
              <div className="py-8 space-y-8 animate-fadeIn">
                
                {/* Header Welcome */}
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 text-xs font-medium border border-slate-200 dark:border-slate-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>ClickHouse GCP • 30k Live Records</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                    OmniQuery Studio
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                    Instant natural language intelligence across theatrical box office returns, streaming CDN QoS telemetry, and audience sentiment.
                  </p>
                </div>

                {/* 3 Curated Prompt Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {CURATED_PROMPTS.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectQuery(item.query)}
                        className="text-left p-4 rounded-2xl bg-white dark:bg-[#141620] border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/60 shadow-2xs transition-all flex flex-col justify-between group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              {item.metric}
                            </span>
                          </div>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        <div className="pt-3 flex items-center justify-between text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                          <span>Explore</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </button>
                    );
                  })}
                </div>

              </div>
            )}

          </div>
        </main>

        {/* 3. Bottom Input Dock (Linear / Julius Style) */}
        <footer className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0f1118]/90 backdrop-blur-md flex-shrink-0 flex justify-center">
          <div className="w-full max-w-3xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunQuery();
              }}
              className="relative rounded-2xl border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-[#161822] shadow-xs focus-within:border-slate-900 dark:focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-900 dark:focus-within:ring-slate-400 transition-all p-1.5 sm:p-2 flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                title="Upload custom dataset"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Upload className="h-4 w-4" />
              </button>

              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about theatrical revenue, streaming QoS, or audience feedback..."
                disabled={isStreaming}
                className="flex-1 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-transparent focus:outline-none px-1"
              />

              {query && !isStreaming && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                <span>Gemini 3.6 Flash</span>
              </div>

              <button
                type="submit"
                disabled={isStreaming || !query.trim()}
                className="h-8 w-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-30 disabled:pointer-events-none flex-shrink-0 shadow-2xs"
              >
                <CornerDownLeft className="h-3.5 w-3.5" />
              </button>
            </form>

            <div className="flex items-center justify-between px-2 pt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
              <span>Connected to ClickHouse Cloud on GCP</span>
              <span className="hidden sm:inline">Press <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-500 dark:text-slate-400">↵ Return</kbd> to analyze</span>
            </div>
          </div>
        </footer>

      </div>

      {/* Modals & Dialogs */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={() => fetchHealthAndSchema()}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

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


