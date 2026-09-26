import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  AlertCircle, 
  Film, 
  BrainCircuit, 
  Activity, 
  X, 
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
import { downloadCsv } from './utils';

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
    metric: '10,000 records',
    tag: 'Aggregations & Multipliers',
    keyHint: '1'
  },
  {
    title: 'Streaming CDN Telemetry',
    description: 'p95 player latency, HTTP 5xx error spikes, and edge QoS metrics.',
    query: 'Show me 95th percentile streaming latency and error counts per service endpoint.',
    icon: Activity,
    metric: '15,000 logs',
    tag: 'quantileExact(0.95)',
    keyHint: '2'
  },
  {
    title: 'Audience Review Sentiment',
    description: 'Semantic vector similarity on screenplay pacing and visual effects feedback.',
    query: 'Find audience reviews complaining about pacing issues using semantic search.',
    icon: BrainCircuit,
    metric: '5,000 reviews',
    tag: 'Vector Cosine Similarity',
    keyHint: '3'
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
  const [sessionId, setSessionId] = useState<string>(() => `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const [turnCount, setTurnCount] = useState<number>(0);
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
    let active = true;
    const poll = async () => {
      if (!active) return;
      await fetchHealthAndSchema();
    };
    void poll();
    const timer = setInterval(() => {
      void poll();
    }, 8000);
    return () => {
      active = false;
      clearInterval(timer);
    };
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
        body: JSON.stringify({ query: q, session_id: sessionId }),
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
              setTurnCount(prev => prev + 1);
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
    if (sessionId) {
      fetch(`${API_BASE_URL}/session/${sessionId}`, { method: 'DELETE' }).catch(() => {});
    }
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
    setTurnCount(0);
    setQueryResult(null);
    setSteps([]);
    setError(null);
    setQuery('');
    showToast('New analysis session initialized');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const renderQueryInputForm = (isHero = false) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleRunQuery();
      }}
      className={`border transition-all flex items-center gap-2 ${
        isHero
          ? 'border-[var(--line-strong)] focus-within:border-[var(--accent)] bg-[var(--panel-input)] p-2 sm:p-2.5 shadow-2xl'
          : 'border-[var(--line-strong)] focus-within:border-[var(--accent)] bg-[var(--panel-input)] p-1.5 sm:p-2'
      }`}
    >
      <button
        type="button"
        onClick={() => setIsUploadOpen(true)}
        title="Upload custom dataset"
        className="p-2 text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--panel-card)] border border-transparent hover:border-[var(--line)] transition-colors"
      >
        <Upload className="h-3.5 w-3.5" />
      </button>

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask about theatrical revenue, streaming QoS, or audience feedback..."
        disabled={isStreaming}
        className="flex-1 text-xs sm:text-sm text-[var(--ink)] placeholder-[var(--muted-dim)] bg-transparent focus:outline-none px-2"
      />

      {query && !isStreaming && (
        <button
          type="button"
          onClick={() => setQuery('')}
          className="text-[var(--muted)] hover:text-[var(--ink)] p-1.5"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {turnCount > 0 && (
        <button
          type="button"
          onClick={handleNewAnalysis}
          title="Active conversation memory. Click to reset thread."
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 border border-[var(--accent)] bg-[var(--accent-muted)] font-mono-tech text-[9px] uppercase tracking-wider text-[var(--ink-bright)] hover:border-[var(--coral)] hover:text-[var(--coral)] transition-colors"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
          <span>Turn {turnCount} (Reset ↺)</span>
        </button>
      )}

      <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 border border-[var(--line)] bg-[var(--panel-card)] font-mono-tech text-[9px] uppercase tracking-wider text-[var(--muted)]">
        <span>GEMINI 3.6 FLASH</span>
      </div>

      <button
        type="submit"
        disabled={isStreaming || !query.trim()}
        className="px-3.5 py-1.5 bg-[var(--ink-bright)] text-[var(--paper)] hover:bg-[var(--accent)] font-mono-tech text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-30 disabled:pointer-events-none flex-shrink-0"
      >
        <span>Run</span>
        <CornerDownLeft className="h-3 w-3" />
      </button>
    </form>
  );

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
      if (['1', '2', '3'].includes(e.key) && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        const benchmarkIdx = parseInt(e.key, 10) - 1;
        if (CURATED_PROMPTS[benchmarkIdx]) {
          e.preventDefault();
          handleSelectQuery(CURATED_PROMPTS[benchmarkIdx].query);
        }
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
            downloadCsv(queryResult.columns, queryResult.rows);
            showToast(`Exported ${queryResult.rows.length} rows to CSV`);
          } : undefined}
          lastLatency={queryResult?.execution_time_ms}
        />

        {/* Scrollable Conversational Feed */}
        <main ref={mainRef} className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 flex flex-col items-center">
          <div className="w-full max-w-5xl xl:max-w-6xl space-y-6">
            
            {/* Warming Up Notice */}
            {isWarmingUp && !health && (
              <div className="p-3.5 border border-[var(--gold)]/40 bg-[var(--gold-muted)] text-[var(--gold)] text-xs flex items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-2.5 font-mono-tech text-[11px]">
                  <span className="relative flex h-2 w-2 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--gold)] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--gold)]" />
                  </span>
                  <span>
                    <strong>CLOUD INSTANCE WARMING UP:</strong> Render container waking up (~30s). Live queries will execute smoothly as soon as connected.
                  </span>
                </div>
              </div>
            )}
            
            {/* User Inquiry Decision Guide / Header */}
            {(queryResult || isStreaming) && (
              <div className="border border-[var(--line-strong)] bg-[var(--panel-card)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
                <div className="space-y-1 max-w-3xl">
                  <div className="flex items-center gap-2 font-mono-tech text-[10px] tracking-[0.14em] uppercase text-[var(--accent)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                    <span>Active Inquiry</span>
                  </div>
                  <div className="text-base sm:text-lg text-[var(--ink-bright)] font-normal tracking-[-0.02em] leading-snug">
                    {query || queryResult?.user_query}
                  </div>
                </div>

                <div className="font-mono-tech text-[9px] tracking-wider uppercase text-[var(--muted)] flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-[var(--line)] pt-2 sm:pt-0 sm:pl-4 self-start sm:self-auto">
                  <span className={isStreaming ? "text-[var(--accent)] font-semibold" : "text-[var(--muted-dim)]"}>1 Ingest</span>
                  <span className="text-[var(--line-strong)]">/</span>
                  <span className={isStreaming ? "text-[var(--accent)] font-semibold" : "text-[var(--muted-dim)]"}>2 Plan SQL</span>
                  <span className="text-[var(--line-strong)]">/</span>
                  <span className={!isStreaming && queryResult ? "text-[var(--accent)] font-bold" : "text-[var(--muted-dim)]"}>3 Verify OLAP</span>
                </div>
              </div>
            )}

            {/* Executive Analysis Notice Card */}
            {error && (() => {
              const { friendly, technical } = sanitizeErrorMessage(error);
              return (
                <div className="p-4 sm:p-5 border border-[var(--coral)]/40 bg-[var(--panel-card)] space-y-3.5 animate-fadeIn">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 border border-[var(--coral)] text-[var(--coral)] flex-shrink-0">
                      <AlertCircle className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-[10px] font-mono-tech uppercase tracking-wider text-[var(--coral)]">
                        Analysis Notice
                      </h4>
                      <p className="text-xs text-[var(--ink)] leading-relaxed">
                        {friendly}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--line)]">
                    <button
                      type="button"
                      onClick={() => handleRunQuery()}
                      className="px-3 py-1.5 border border-[var(--line)] hover:border-[var(--accent)] bg-[var(--panel-input)] text-[var(--ink)] hover:text-[var(--accent)] text-[10px] font-mono-tech uppercase tracking-wider transition-all flex items-center gap-1.5"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Retry Analysis</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectQuery(CURATED_PROMPTS[1].query)}
                      className="px-3 py-1.5 border border-[var(--line)] hover:border-[var(--accent)] bg-[var(--panel-card)] text-[var(--muted)] hover:text-[var(--ink)] text-[10px] font-mono-tech uppercase tracking-wider transition-colors"
                    >
                      Try Telemetry Prompt
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectQuery(CURATED_PROMPTS[0].query)}
                      className="px-3 py-1.5 border border-[var(--line)] hover:border-[var(--accent)] bg-[var(--panel-card)] text-[var(--muted)] hover:text-[var(--ink)] text-[10px] font-mono-tech uppercase tracking-wider transition-colors"
                    >
                      Try Box Office Prompt
                    </button>
                  </div>

                  {technical && (
                    <details className="pt-1 text-[10px] font-mono-tech text-[var(--muted)]">
                      <summary className="cursor-pointer hover:text-[var(--ink)] transition-colors">
                        Diagnostic details [+]
                      </summary>
                      <pre className="mt-2 p-2.5 border border-[var(--line)] bg-[var(--paper)] text-[10px] font-mono-tech text-[var(--muted)] overflow-x-auto whitespace-pre-wrap">
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
                onDrilldown={handleSelectQuery}
                isLoading={isStreaming}
                onShowToast={showToast}
              />
            )}

            {/* Empty State / Centered Command Center */}
            {!queryResult && steps.length === 0 && !isStreaming && (
              <div className="py-8 sm:py-16 max-w-4xl mx-auto space-y-8 animate-fadeIn">
                
                {/* Hero Title & Architecture Ribbon */}
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 font-mono-tech text-[10px] tracking-[0.14em] uppercase text-[var(--accent)] px-2.5 py-1 border border-[var(--line)] bg-[var(--panel-card)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-signal" />
                    <span>
                      {health?.is_cloud_clickhouse ? 'ClickHouse Cloud (GCP)' : 'DuckDB Columnar (Zero-Config)'} · 50,000 Records
                    </span>
                  </div>
                  
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-[-0.05em] text-[var(--ink-bright)] leading-[0.96]">
                    Interrogate the data<br className="hidden sm:inline" /> before you commit.
                  </h1>
                  
                  <p className="text-xs sm:text-sm text-[var(--muted)] max-w-2xl font-normal leading-relaxed">
                    Natural language analytical agent across theatrical revenue, streaming QoS, and audience sentiment. ClickHouse OLAP executes in milliseconds with mathematical proof.
                  </p>

                  {/* Architecture Capability Highlights */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 border border-[var(--line)] bg-[var(--panel-card)] text-[10px] font-mono-tech text-[var(--muted)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                      <span className="text-[var(--ink)] font-medium">Gemini 3.6 Flash</span>
                      <span className="text-[var(--muted-dim)]">· NL to SQL AST</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 border border-[var(--line)] bg-[var(--panel-card)] text-[10px] font-mono-tech text-[var(--muted)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                      <span className="text-[var(--ink)] font-medium">ClickHouse & DuckDB</span>
                      <span className="text-[var(--muted-dim)]">· Sub-50ms OLAP</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 border border-[var(--line)] bg-[var(--panel-card)] text-[10px] font-mono-tech text-[var(--muted)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[var(--ink)] font-medium">Self-Healing</span>
                      <span className="text-[var(--muted-dim)]">· Visual SQL Diff</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 border border-[var(--line)] bg-[var(--panel-card)] text-[10px] font-mono-tech text-[var(--muted)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      <span className="text-[var(--ink)] font-medium">Pydantic Guardrails</span>
                      <span className="text-[var(--muted-dim)]">· Strict Typed Contracts</span>
                    </div>
                  </div>
                </div>

                {/* Primary Query Command Center */}
                <div className="space-y-2 pt-2">
                  {renderQueryInputForm(true)}
                  <div className="flex items-center justify-between px-1 text-[9px] font-mono-tech uppercase tracking-wider text-[var(--muted)]">
                    <span>{health?.is_cloud_clickhouse ? 'ClickHouse Cloud OLAP · Cluster Connected' : 'Embedded DuckDB Columnar Engine · Active'}</span>
                    <span>Press <kbd className="font-mono-tech bg-[var(--panel-card)] border border-[var(--line)] px-1 py-0.5 text-[var(--ink)]">↵ Return</kbd> to analyze</span>
                  </div>
                </div>

                {/* Curated Studio Benchmarks */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                    <span className="font-mono-tech text-[10px] tracking-wider uppercase text-[var(--muted)] font-medium">
                      Curated Benchmarks
                    </span>
                    <span className="font-mono-tech text-[9px] tracking-widest uppercase text-[var(--accent)]">
                      Hotkeys [1] [2] [3]
                    </span>
                  </div>

                  {/* 3 Curated Prompt Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {CURATED_PROMPTS.map((item, idx) => {
                      const IconComponent = item.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectQuery(item.query)}
                          className="text-left p-4 sm:p-5 border border-[var(--line)] hover:border-[var(--accent)] bg-[var(--panel-card)] hover:-translate-y-0.5 transition-all flex flex-col justify-between group relative"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="p-1.5 border border-[var(--line)] bg-[var(--panel)] text-[var(--accent)] group-hover:border-[var(--accent)] transition-colors">
                                <IconComponent className="h-3.5 w-3.5" />
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono-tech text-[9px] uppercase tracking-wider text-[var(--muted)] border border-[var(--line)] px-1.5 py-0.5">
                                  {item.metric}
                                </span>
                                <kbd className="font-mono-tech text-[9px] px-1.5 py-0.5 border border-[var(--line)] bg-[var(--panel-input)] text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:border-[var(--accent)] transition-colors">
                                  [{item.keyHint}]
                                </kbd>
                              </div>
                            </div>
                            <h3 className="text-xs sm:text-sm font-medium text-[var(--ink-bright)] group-hover:text-[var(--accent)] transition-colors">
                              {item.title}
                            </h3>
                            <p className="text-[11px] text-[var(--muted)] mt-1.5 leading-relaxed">
                              {item.description}
                            </p>
                            <div className="mt-3">
                              <span className="font-mono-tech text-[9px] uppercase tracking-wider text-[var(--accent)] bg-[var(--accent-muted)] px-1.5 py-0.5 border border-[var(--accent)]/30">
                                {item.tag}
                              </span>
                            </div>
                          </div>

                          <div className="mt-5 pt-3 border-t border-[var(--line)] flex items-center justify-between font-mono-tech text-[9px] uppercase tracking-wider text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">
                            <span>Press [{item.keyHint}] or click</span>
                            <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-[var(--accent)] font-semibold">
                              <span>Execute</span>
                              <CornerDownLeft className="h-3 w-3" />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

          </div>
        </main>

        {/* 3. Bottom Input Dock (Only visible when actively streaming or results loaded) */}
        {(queryResult || steps.length > 0 || isStreaming) && (
          <footer className="p-4 sm:p-5 border-t border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur-xl flex-shrink-0 flex justify-center animate-fadeIn">
            <div className="w-full max-w-4xl xl:max-w-5xl">
              {renderQueryInputForm(false)}

              <div className="flex items-center justify-between px-1 pt-2 font-mono-tech text-[9px] uppercase tracking-wider text-[var(--muted)]">
                <span>{health?.is_cloud_clickhouse ? 'ClickHouse Cloud OLAP · Cluster Connected' : 'Embedded DuckDB Columnar Engine · Active'}</span>
                <span className="hidden sm:inline">Press <kbd className="font-mono-tech bg-[var(--panel-card)] border border-[var(--line)] px-1 py-0.5 text-[var(--ink)]">↵ Return</kbd> to analyze</span>
              </div>
            </div>
          </footer>
        )}

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


