import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  BarChart3,
  Table as TableIcon,
  Code2,
  Sparkles,
  Download,
  Copy,
  Check,
  Database,
  Layers,
  ArrowRight,
  ArrowUpDown,
  Search,
  X,
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Zap,
  Film
} from 'lucide-react';
import type { QueryResultPayload } from '../types';
import { SemanticSearchWidget } from './SemanticSearchWidget';

interface ResultsWorkbenchProps {
  payload: QueryResultPayload;
  onSelectFollowup: (query: string) => void;
  isLoading: boolean;
  onShowToast: (msg: string) => void;
}

const PALETTE = ['#06b6d4', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899', '#38bdf8'];

export const ResultsWorkbench: React.FC<ResultsWorkbenchProps> = ({
  payload,
  onSelectFollowup,
  isLoading,
  onShowToast
}) => {
  const isVectorSearch = payload.columns.some(c => 
    c.toLowerCase().includes('score') || 
    c.toLowerCase().includes('similarity') || 
    c.toLowerCase().includes('distance')
  );
  
  const [activeTab, setActiveTab] = useState<'chart' | 'table' | 'sql' | 'summary' | 'vector'>(
    isVectorSearch ? 'vector' : 'chart'
  );
  const [chartType, setChartType] = useState<string>(payload.chart_spec.chart_type || 'bar');
  const [copiedSql, setCopiedSql] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { chart_spec, rows, columns, sql_query, execution_time_ms, rows_scanned, total_rows } = payload;
  const xKey = chart_spec.x_axis_key || (columns[0] || 'category');
  const yKeys = chart_spec.y_axis_keys && chart_spec.y_axis_keys.length > 0
    ? chart_spec.y_axis_keys
    : (columns.slice(1, 3) || ['value']);

  const handleCopySql = () => {
    navigator.clipboard.writeText(sql_query);
    setCopiedSql(true);
    onShowToast("Copied SQL query to clipboard");
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleCopyCell = (val: any) => {
    navigator.clipboard.writeText(String(val));
    onShowToast(`Copied value: "${val}"`);
  };

  const handleExportCsv = () => {
    if (!rows || rows.length === 0) return;
    const headers = columns.join(',');
    const csvRows = rows.map((r) =>
      columns.map((c) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const content = [headers, ...csvRows].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omniquery_results_${Date.now()}.csv`;
    a.click();
    onShowToast(`Exported ${rows.length} rows to CSV`);
  };

  // Sort and filter table rows
  const filteredAndSortedRows = useMemo(() => {
    let result = [...rows];

    // Filter
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      result = result.filter(r =>
        columns.some(col => String(r[col] ?? '').toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortCol) {
      result.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc
          ? String(valA ?? '').localeCompare(String(valB ?? ''))
          : String(valB ?? '').localeCompare(String(valA ?? ''));
      });
    }

    return result;
  }, [rows, columns, tableSearch, sortCol, sortAsc]);

  const handleSort = (colName: string) => {
    if (sortCol === colName) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(colName);
      setSortAsc(true);
    }
  };

  const formatNumericValue = (val: number, keyName: string) => {
    const k = keyName.toLowerCase();
    if (k.includes('revenue') || k.includes('amount') || k.includes('price') || k.includes('profit') || k.includes('gross')) {
      if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
      if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}k`;
      return `$${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }
    if (k.includes('latency') || k.includes('ms')) {
      return `${val.toLocaleString(undefined, { maximumFractionDigits: 2 })} ms`;
    }
    return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const renderTrendIcon = (trend?: 'positive' | 'negative' | 'neutral') => {
    switch (trend) {
      case 'positive':
        return <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />;
      case 'negative':
        return <TrendingDown className="h-3.5 w-3.5 text-rose-400" />;
      default:
        return <Minus className="h-3.5 w-3.5 text-zinc-500" />;
    }
  };

  const CustomTooltip = ({ active, payload: tp, label }: any) => {
    if (active && tp && tp.length) {
      return (
        <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl shadow-2xl border border-white/10 text-xs font-mono backdrop-blur-xl">
          <p className="font-bold text-zinc-100 mb-1.5 pb-1 border-b border-white/10 flex items-center gap-1.5">
            <Film className="h-3 w-3 text-cyan-400" />
            <span>{label}</span>
          </p>
          {tp.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 py-0.5 text-zinc-300">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span 
                  className="h-2.5 w-2.5 rounded-sm shadow-sm" 
                  style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}80` }} 
                />
                {entry.name}:
              </span>
              <span className="font-bold text-white font-mono">
                {typeof entry.value === 'number'
                  ? formatNumericValue(entry.value, entry.name)
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChartContent = () => {
    if (!rows || rows.length === 0) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-zinc-500 text-xs font-mono space-y-2">
          <Database className="h-8 w-8 text-zinc-600 animate-pulse" />
          <span>No record entries returned from ClickHouse</span>
        </div>
      );
    }

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={rows} margin={{ top: 20, right: 25, left: 15, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey={xKey} stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
              <YAxis stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 12, fontSize: '11px', fontFamily: 'monospace' }} />
              {yKeys.map((k, i) => (
                <Line
                  key={k}
                  type="monotone"
                  dataKey={k}
                  name={chart_spec.series_names?.[i] || k.replace(/_/g, ' ').toUpperCase()}
                  stroke={PALETTE[i % PALETTE.length]}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: PALETTE[i % PALETTE.length], stroke: '#060709', strokeWidth: 1.5 }}
                  activeDot={{ r: 7, fill: '#ffffff', stroke: PALETTE[i % PALETTE.length], strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={rows} margin={{ top: 20, right: 25, left: 15, bottom: 20 }}>
              <defs>
                {yKeys.map((k, i) => (
                  <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.45} />
                    <stop offset="95%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey={xKey} stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
              <YAxis stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 12, fontSize: '11px', fontFamily: 'monospace' }} />
              {yKeys.map((k, i) => (
                <Area
                  key={k}
                  type="monotone"
                  dataKey={k}
                  name={chart_spec.series_names?.[i] || k.replace(/_/g, ' ').toUpperCase()}
                  stroke={PALETTE[i % PALETTE.length]}
                  fill={`url(#grad-${k})`}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const pieSlice = rows.slice(0, 8);
        return (
          <ResponsiveContainer width="100%" height={340}>
            <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 12, fontSize: '11px', fontFamily: 'monospace' }} />
              <Pie
                data={pieSlice}
                dataKey={yKeys[0] || 'count'}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                outerRadius={105}
                innerRadius={55}
                paddingAngle={3}
                label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {pieSlice.map((_, idx) => (
                  <Cell 
                    key={`cell-${idx}`} 
                    fill={PALETTE[idx % PALETTE.length]} 
                    stroke="rgba(0,0,0,0.5)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );

      case 'bar':
      default:
        return (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={rows} margin={{ top: 20, right: 25, left: 15, bottom: 20 }}>
              <defs>
                {yKeys.map((k, i) => (
                  <linearGradient key={`bar-grad-${k}`} id={`bar-grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={1} />
                    <stop offset="100%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.65} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey={xKey} stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
              <YAxis stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 12, fontSize: '11px', fontFamily: 'monospace' }} />
              {yKeys.map((k, i) => (
                <Bar
                  key={k}
                  dataKey={k}
                  name={chart_spec.series_names?.[i] || k.replace(/_/g, ' ').toUpperCase()}
                  fill={`url(#bar-grad-${k})`}
                  radius={[5, 5, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  const paginatedRows = filteredAndSortedRows.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredAndSortedRows.length / pageSize) || 1;

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden text-xs space-y-4">
      
      {/* 1. Header Strip */}
      <div className="p-4 bg-zinc-950 border-b border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center">
              <Film className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-sans tracking-wide">
                {chart_spec.title || "Studio Analytics Dossier"}
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                ClickHouse OLAP Synthesis • Gemini 2.5 Pipeline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 font-mono text-[11px] transition-all shadow-sm"
            >
              <Download className="h-3.5 w-3.5 text-zinc-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 4-Card HUD KPI Deck */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Card 1: Execution Latency */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Scan Latency</span>
              <Zap className="h-3 w-3 text-zinc-400" />
            </div>
            <div className="mt-1">
              <span className="text-lg font-bold text-zinc-100 font-mono">
                {execution_time_ms} ms
              </span>
            </div>
            <span className="text-[9px] text-zinc-500 font-mono mt-0.5">ClickHouse OLAP</span>
          </div>

          {/* Card 2: Aggregated Rows */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Total Rows</span>
              <Layers className="h-3 w-3 text-zinc-400" />
            </div>
            <div className="mt-1">
              <span className="text-lg font-bold text-zinc-100 font-mono">
                {total_rows.toLocaleString()}
              </span>
            </div>
            <span className="text-[9px] text-zinc-500 font-mono mt-0.5">Result matrix</span>
          </div>

          {/* Card 3: Cluster Scan Volume */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Rows Scanned</span>
              <Database className="h-3 w-3 text-zinc-400" />
            </div>
            <div className="mt-1">
              <span className="text-lg font-bold text-zinc-100 font-mono">
                {rows_scanned > 1000 ? `${(rows_scanned / 1000).toFixed(0)}k` : rows_scanned}
              </span>
            </div>
            <span className="text-[9px] text-zinc-500 font-mono mt-0.5">Partition scan</span>
          </div>

          {/* Card 4: AI Key Metric or Studio Signal */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-zinc-500 truncate">
                {chart_spec.key_metrics?.[0]?.label || "Studio Signal"}
              </span>
              {renderTrendIcon(chart_spec.key_metrics?.[0]?.trend)}
            </div>
            <div className="mt-1 truncate">
              <span className="text-lg font-bold text-zinc-100 font-mono truncate">
                {chart_spec.key_metrics?.[0]?.value || `${columns.length} Dimensions`}
              </span>
            </div>
            <span className="text-[9px] text-zinc-500 font-mono mt-0.5 truncate">
              {chart_spec.key_metrics?.[0]?.trend ? `${chart_spec.key_metrics[0].trend} trend` : 'Synthesized'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Glassmorphism Tab Bar */}
      <div className="px-4 flex flex-wrap items-center justify-between gap-3">
        
        {/* Navigation Tabs */}
        <div className="flex items-center bg-zinc-900 p-1 rounded-lg border border-zinc-800 font-mono text-[11px]">
          <button
            onClick={() => setActiveTab('chart')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'chart'
                ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Visual Analytics</span>
          </button>
          
          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'table'
                ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <TableIcon className="h-3.5 w-3.5" />
            <span>Data Matrix ({total_rows})</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'sql'
                ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>SQL Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'summary'
                ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Executive Brief</span>
          </button>

          {isVectorSearch && (
            <button
              onClick={() => setActiveTab('vector')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'vector'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <BrainCircuit className="h-3.5 w-3.5" />
              <span>Vector Radar</span>
            </button>
          )}
        </div>

        {/* Chart View Type Sub-Selector */}
        {activeTab === 'chart' && (
          <div className="flex items-center bg-zinc-950/80 border border-zinc-800 rounded-xl p-1 font-mono text-[10px]">
            {[
              { id: 'bar', label: 'Bar' },
              { id: 'area', label: 'Area' },
              { id: 'line', label: 'Line' },
              { id: 'pie', label: 'Donut' }
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setChartType(id)}
                className={`px-2.5 py-1 rounded-lg uppercase transition-all ${
                  chartType === id
                    ? 'bg-zinc-800 text-white font-bold border border-zinc-700 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Main Workspace Tab Body */}
      <div className="px-4 pb-4">
        
        {/* 1. Visual Analytics Chart View */}
        {activeTab === 'chart' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 border border-zinc-800">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.05] pb-3">
              <span className="font-bold text-zinc-100 font-mono text-xs flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-cyan-400" />
                {chart_spec.title || "Query Distribution"}
              </span>
              <span className="text-[11px] text-zinc-400 font-mono bg-zinc-900/80 px-2.5 py-0.5 rounded-md border border-zinc-800">
                Axis: <span className="text-cyan-300">{xKey}</span> vs <span className="text-amber-300">{yKeys.join(', ')}</span>
              </span>
            </div>
            {renderChartContent()}
          </div>
        )}

        {/* 2. Data Matrix Grid */}
        {activeTab === 'table' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 border border-zinc-800 space-y-3">
            
            {/* Table Search & Meta */}
            <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px]">
              <div className="relative w-72">
                <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => { setTableSearch(e.target.value); setPage(1); }}
                  placeholder="Filter records in memory..."
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-1.5 pl-8 text-[11px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
                />
                {tableSearch && (
                  <button
                    onClick={() => setTableSearch('')}
                    className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <span className="text-zinc-500 text-[10px]">
                Showing {paginatedRows.length} of {filteredAndSortedRows.length} matching rows • Click any cell to copy
              </span>
            </div>

            {/* Cyber Table */}
            <div className="overflow-x-auto border border-zinc-800/80 rounded-xl font-mono text-[11px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-950/90 border-b border-zinc-800 text-zinc-400 select-none">
                    <th className="p-2.5 w-12 text-zinc-600 font-normal">#</th>
                    {columns.map((col, idx) => (
                      <th
                        key={idx}
                        onClick={() => handleSort(col)}
                        className="p-2.5 font-bold cursor-pointer hover:text-cyan-300 hover:bg-white/[0.03] transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{col}</span>
                          <ArrowUpDown className={`h-3 w-3 ${sortCol === col ? 'text-cyan-400' : 'text-zinc-600'}`} />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {paginatedRows.map((row, rIdx) => (
                    <tr 
                      key={rIdx} 
                      className="hover:bg-cyan-500/[0.03] text-zinc-300 transition-colors"
                    >
                      <td className="p-2.5 text-zinc-600 font-mono">{(page - 1) * pageSize + rIdx + 1}</td>
                      {columns.map((col, cIdx) => (
                        <td
                          key={cIdx}
                          onClick={() => handleCopyCell(row[col])}
                          className="p-2.5 cursor-pointer hover:bg-zinc-800/50 hover:text-cyan-200 transition-colors"
                          title="Click to copy cell value"
                        >
                          {typeof row[col] === 'number'
                            ? formatNumericValue(row[col], col)
                            : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400 pt-1">
                <span>Page {page} of {totalPages}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 transition-colors"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. SQL Engine Inspector */}
        {activeTab === 'sql' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 border border-zinc-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-[11px] flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-cyan-400" />
                ClickHouse Columnar Generated SQL
              </span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-[11px] text-zinc-300 hover:text-white transition-all shadow-sm"
              >
                {copiedSql ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre className="p-4 bg-black/80 border border-zinc-800/80 rounded-xl text-cyan-300 overflow-x-auto leading-relaxed text-xs shadow-inner">
              <code>{sql_query}</code>
            </pre>
          </div>
        )}

        {/* 4. Executive Intelligence Brief */}
        {activeTab === 'summary' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 border border-zinc-800 space-y-4">
            
            {/* Narrative Brief */}
            <div className="relative rounded-xl bg-zinc-900 p-4 border-l-4 border-zinc-500 border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-cyan-300">
                  Director's Executive Brief
                </span>
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                {chart_spec.executive_summary}
              </p>
            </div>

            {/* Metric Highlights Grid */}
            {chart_spec.key_metrics && chart_spec.key_metrics.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {chart_spec.key_metrics.map((metric, idx) => (
                  <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">{metric.label}</span>
                      <p className="text-base font-extrabold text-white font-mono mt-0.5">{metric.value}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                      {renderTrendIcon(metric.trend)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Suggested Follow-up Queries */}
            {chart_spec.suggested_followups && chart_spec.suggested_followups.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <Activity className="h-3 w-3 text-cyan-400" />
                  Recommended Next Analytical Explorations
                </span>
                <div className="flex flex-wrap gap-2">
                  {chart_spec.suggested_followups.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => onSelectFollowup(f)}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-cyan-950/30 text-zinc-300 hover:text-cyan-200 border border-zinc-800 hover:border-cyan-500/40 text-[11px] font-mono transition-all flex items-center gap-2 group"
                    >
                      <span>{f}</span>
                      <ArrowRight className="h-3 w-3 text-zinc-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. Vector Radar Visualizer */}
        {activeTab === 'vector' && (
          <div className="h-full">
            <SemanticSearchWidget 
              query={payload.user_query}
              rows={rows} 
              columns={columns} 
            />
          </div>
        )}
      </div>

      {/* 4. Bottom Telemetry Strip */}
      <div className="bg-zinc-950/90 border-t border-zinc-800 px-4 py-2 flex items-center justify-between text-[10px] font-mono text-zinc-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ClickHouse OLAP: {execution_time_ms}ms</span>
          </span>
          <span className="flex items-center gap-1 text-zinc-400">
            <Layers className="h-3 w-3 text-cyan-400" /> {total_rows.toLocaleString()} rows
          </span>
          <span className="flex items-center gap-1 text-zinc-400">
            <Database className="h-3 w-3 text-amber-400" /> {rows_scanned.toLocaleString()} scanned
          </span>
        </div>
        <span className="text-zinc-500 hidden sm:inline">Engine: ClickHouse Columnar + Gemini 2.5</span>
      </div>
    </div>
  );
};

