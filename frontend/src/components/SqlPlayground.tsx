import React, { useState } from 'react';
import { Play, Download, Clock, Database, RefreshCw, AlertCircle, Code, Layers } from 'lucide-react';

interface SqlPlaygroundProps {
  onExecuteRawSql: (sql: string) => Promise<any>;
}

const SAMPLE_SQL_QUERIES = [
  {
    label: "Box Office Genre Summary",
    sql: `SELECT genre, sum(gross_revenue) as total_box_office, count(*) as movie_count, round(avg(opening_weekend), 2) as avg_opening_weekend, sum(net_profit) as total_profit\nFROM box_office_revenue\nGROUP BY genre\nORDER BY total_box_office DESC\nLIMIT 10;`
  },
  {
    label: "p95 Latency by Service",
    sql: `SELECT service_name, round(avg(latency_ms), 1) as avg_latency, round(quantile_cont(0.95)(latency_ms), 1) as p95_latency, count(*) as req_count\nFROM streaming_platform_metrics\nGROUP BY service_name\nORDER BY p95_latency DESC;`
  },
  {
    label: "Top 5 Global Profit Movies",
    sql: `SELECT movie_title, distributor, release_date, gross_revenue, production_budget, net_profit\nFROM box_office_revenue\nORDER BY net_profit DESC\nLIMIT 5;`
  }
];

export const SqlPlayground: React.FC<SqlPlaygroundProps> = ({ onExecuteRawSql }) => {
  const [sql, setSql] = useState<string>(SAMPLE_SQL_QUERIES[0].sql);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    if (!sql.trim() || isRunning) return;
    setIsRunning(true);
    setError(null);
    try {
      const data = await onExecuteRawSql(sql);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Execution error');
      setResult(null);
    } finally {
      setIsRunning(false);
    }
  };

  const handleExportCsv = () => {
    if (!result || !result.rows || result.rows.length === 0) return;
    const headers = result.columns.join(',');
    const csvRows = result.rows.map((row: any) =>
      result.columns.map((col: string) => `"${String(row[col] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = [headers, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `clickhouse_query_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="cinema-glass rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden mb-6 space-y-4">
      
      {/* Console Header */}
      <div className="p-4 bg-gradient-to-r from-zinc-950/90 via-[#0d0e14]/90 to-zinc-950/90 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-md">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-sans tracking-wide">
              Raw ClickHouse SQL Console
            </h3>
            <p className="text-[11px] text-zinc-400 font-mono">
              Execute high-performance OLAP queries with sub-millisecond execution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRun}
            disabled={isRunning || !sql.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold font-mono shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>Execute SQL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Query Template Chips */}
      <div className="px-4 flex items-center gap-2 overflow-x-auto text-[11px] font-mono">
        <span className="text-zinc-500 text-[10px] uppercase font-bold flex-shrink-0">Quick Templates:</span>
        {SAMPLE_SQL_QUERIES.map((tmpl, idx) => (
          <button
            key={idx}
            onClick={() => setSql(tmpl.sql)}
            className="px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors whitespace-nowrap"
          >
            {tmpl.label}
          </button>
        ))}
      </div>

      {/* Editor Box */}
      <div className="px-4">
        <div className="relative rounded-xl overflow-hidden border border-zinc-800/80 bg-black/80 shadow-inner">
          <div className="bg-zinc-950/90 px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between text-[10px] font-mono text-zinc-500">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <Code className="h-3 w-3 text-cyan-400" />
              SQL Scratchpad (ClickHouse SQL Dialect)
            </span>
            <span>{sql.split('\n').length} lines</span>
          </div>
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            rows={6}
            className="w-full bg-transparent p-4 text-xs font-mono text-cyan-300 placeholder-zinc-600 focus:outline-none resize-y leading-relaxed"
            placeholder="Write ClickHouse SQL query here..."
          />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-4 p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs font-mono flex items-center gap-2.5 backdrop-blur-md">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="px-4 pb-4 space-y-3">
          {/* Result Metrics Bar */}
          <div className="cinema-glass-card rounded-xl px-4 py-2.5 flex items-center justify-between text-xs font-mono text-zinc-300 border border-white/[0.08]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Clock className="h-3.5 w-3.5" /> {result.execution_time_ms} ms
              </span>
              <span className="flex items-center gap-1 text-zinc-400">
                <Layers className="h-3.5 w-3.5 text-cyan-400" />
                {result.total_rows_returned} rows returned
              </span>
            </div>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 text-[11px] transition-colors"
            >
              <Download className="h-3 w-3 text-cyan-400" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto max-h-80 rounded-xl border border-zinc-800/80 bg-zinc-950/80 text-xs font-mono">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 select-none">
                  <th className="p-2.5 w-10 text-zinc-600 font-normal">#</th>
                  {result.columns.map((col: string, idx: number) => (
                    <th key={idx} className="p-2.5 font-bold text-zinc-200">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {result.rows.map((row: any, rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-cyan-500/[0.03] text-zinc-300 transition-colors">
                    <td className="p-2.5 text-zinc-600">{rIdx + 1}</td>
                    {result.columns.map((col: string, cIdx: number) => (
                      <td key={cIdx} className="p-2.5">
                        {typeof row[col] === 'number'
                          ? row[col].toLocaleString(undefined, { maximumFractionDigits: 2 })
                          : String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

