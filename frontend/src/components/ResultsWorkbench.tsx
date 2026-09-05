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
  Download,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Search,
  X,
  Code,
  Award,
  Sparkles
} from 'lucide-react';
import type { QueryResultPayload } from '../types';
import { SemanticSearchWidget } from './SemanticSearchWidget';
import { downloadCsv } from '../utils';

interface ResultsWorkbenchProps {
  payload: QueryResultPayload;
  onSelectFollowup: (query: string) => void;
  isLoading?: boolean;
  onShowToast: (msg: string) => void;
}

const PALETTE = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

const currencyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 });
const compactFmt = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 });

const formatNumericValue = (val: number, keyName: string) => {
  const k = keyName.toLowerCase();
  if (/revenue|amount|profit|gross|budget|spend|cost/.test(k)) return currencyFmt.format(val);
  if (/latency|ms|duration/.test(k)) return `${val.toLocaleString()} ms`;
  if (/pct|percent|rate/.test(k)) return `${val.toFixed(1)}%`;
  return Math.abs(val) >= 1000 ? compactFmt.format(val) : val.toLocaleString();
};

const getYAxisFormatter = (keys: string[]) => {
  const isCurrency = keys.some(k => /revenue|profit|gross|budget|spend|cost|amount/i.test(k));
  const isTime = keys.some(k => /latency|ms|duration/i.test(k));
  const isPct = keys.some(k => /pct|percent|rate/i.test(k));

  return (val: number | string) => {
    const num = Number(val);
    if (isNaN(num) || num === 0) return String(val);
    if (isCurrency) return currencyFmt.format(num);
    if (isTime) return `${num} ms`;
    if (isPct) return `${num.toFixed(1)}%`;
    return compactFmt.format(num);
  };
};

interface TooltipEntry {
  name: string;
  value: number | string;
  color?: string;
}

const CustomTooltip = ({ active, payload: tp, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) => {
  if (active && tp && tp.length) {
    return (
      <div className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-lg text-xs">
        <p className="font-semibold text-slate-900 dark:text-white mb-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
          {label}
        </p>
        {tp.map((entry, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 py-0.5 text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              {entry.color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />}
              <span>{entry.name}:</span>
            </span>
            <span className="font-semibold text-slate-900 dark:text-white font-mono">
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

export const ResultsWorkbench: React.FC<ResultsWorkbenchProps> = ({
  payload,
  onSelectFollowup,
  isLoading: _isLoading,
  onShowToast
}) => {
  const isVectorSearch = payload.columns.some(c => 
    c.toLowerCase().includes('score') || 
    c.toLowerCase().includes('similarity') || 
    c.toLowerCase().includes('distance')
  );

  const isSingleRecord = payload.rows.length === 1;

  const [viewMode, setViewMode] = useState<'spotlight' | 'chart' | 'table' | 'vector'>(
    isVectorSearch ? 'vector' : (isSingleRecord ? 'spotlight' : 'chart')
  );
  const [chartType, setChartType] = useState<string>(payload.chart_spec.chart_type || 'bar');
  const [isSqlExpanded, setIsSqlExpanded] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { chart_spec, rows, columns, sql_query, execution_time_ms, rows_scanned, total_rows } = payload;
  const xKey = chart_spec.x_axis_key || (columns[0] || 'category');
  const yKeys = useMemo(() => {
    const fallbackY = columns.length > 1 ? columns.slice(1, 3) : columns.slice(0, 1);
    return chart_spec.y_axis_keys && chart_spec.y_axis_keys.length > 0
      ? chart_spec.y_axis_keys
      : (fallbackY.length > 0 ? fallbackY : ['value']);
  }, [chart_spec.y_axis_keys, columns]);

  const yAxisFormatter = useMemo(() => getYAxisFormatter(yKeys), [yKeys]);

  const displayMetrics = useMemo(() => {
    const list = [...(chart_spec.key_metrics || [])];
    if (list.length === 0) {
      return [
        { label: 'Execution Latency', value: `${execution_time_ms} ms`, trend: 'positive' as const },
        { label: 'Rows Scanned', value: rows_scanned.toLocaleString(), trend: 'neutral' as const },
        { label: 'Result Records', value: total_rows.toLocaleString(), trend: 'neutral' as const }
      ];
    }
    if (list.length === 1) {
      list.push(
        { label: 'Execution Latency', value: `${execution_time_ms} ms`, trend: 'positive' as const },
        { label: 'Rows Scanned', value: rows_scanned.toLocaleString(), trend: 'neutral' as const }
      );
    } else if (list.length === 2) {
      list.push(
        { label: 'Execution Latency', value: `${execution_time_ms} ms`, trend: 'positive' as const }
      );
    }
    return list.slice(0, 3);
  }, [chart_spec.key_metrics, execution_time_ms, rows_scanned, total_rows]);

  const handleCopySql = () => {
    navigator.clipboard.writeText(sql_query);
    setCopiedSql(true);
    onShowToast("ClickHouse SQL copied to clipboard");
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleExportCsv = () => {
    if (!rows || rows.length === 0) return;
    downloadCsv(columns, rows);
    onShowToast(`Exported ${rows.length} rows to CSV`);
  };

  const filteredAndSortedRows = useMemo(() => {
    let result = [...rows];
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      result = result.filter(r =>
        columns.some(col => String(r[col] ?? '').toLowerCase().includes(q))
      );
    }
    if (sortCol) {
      result.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        const numA = typeof valA === 'number' ? valA : Number(valA);
        const numB = typeof valB === 'number' ? valB : Number(valB);
        if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '' && valA !== null && valB !== null) {
          return sortAsc ? numA - numB : numB - numA;
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

  const renderTrendIcon = (trend?: 'positive' | 'negative' | 'neutral') => {
    switch (trend) {
      case 'positive':
        return <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'negative':
        return <TrendingDown className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />;
      default:
        return <Minus className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  const renderChart = () => {
    if (!rows || rows.length === 0) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
          <span>No records returned from ClickHouse</span>
        </div>
      );
    }

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={rows} margin={{ top: 15, right: 20, left: 10, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.1)" />
              <XAxis dataKey={xKey} stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={yAxisFormatter} width={58} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 12, fontSize: '11px' }} />
              {yKeys.map((k, i) => (
                <Line
                  key={k}
                  type="monotone"
                  dataKey={k}
                  name={chart_spec.series_names?.[i] || k.replace(/_/g, ' ').toUpperCase()}
                  stroke={PALETTE[i % PALETTE.length]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: PALETTE[i % PALETTE.length] }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={rows} margin={{ top: 15, right: 20, left: 10, bottom: 15 }}>
              <defs>
                {yKeys.map((k, i) => (
                  <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.1)" />
              <XAxis dataKey={xKey} stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={yAxisFormatter} width={58} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 12, fontSize: '11px' }} />
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

      case 'pie': {
        const pieSlice = rows.slice(0, 8);
        return (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 12, fontSize: '11px' }} />
              <Pie
                data={pieSlice}
                dataKey={yKeys[0] || 'count'}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={50}
                paddingAngle={3}
                label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`}
              >
                {pieSlice.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={PALETTE[idx % PALETTE.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );
      }

      case 'bar':
      default:
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={rows} margin={{ top: 15, right: 20, left: 10, bottom: 15 }} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.1)" />
              <XAxis dataKey={xKey} stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={yAxisFormatter} width={58} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 12, fontSize: '11px' }} />
              {yKeys.map((k, i) => (
                <Bar
                  key={k}
                  dataKey={k}
                  name={chart_spec.series_names?.[i] || k.replace(/_/g, ' ').toUpperCase()}
                  fill={PALETTE[i % PALETTE.length]}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={44}
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
    <div className="space-y-5 animate-fadeIn">
      
      {chart_spec.executive_summary && (
        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal bg-slate-50 dark:bg-[#141620] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <p>{chart_spec.executive_summary}</p>
        </div>
      )}

      {/* 3 Balanced Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {displayMetrics.map((metric, idx) => (
          <div key={idx} className="p-3.5 rounded-xl bg-white dark:bg-[#141620] border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{metric.label}</span>
              {renderTrendIcon(metric.trend)}
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141620] overflow-hidden shadow-2xs">
        
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              {chart_spec.title || 'Analysis Visualization'}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              ClickHouse OLAP • {total_rows} records returned
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#1e2130] text-xs">
              {isSingleRecord && (
                <button
                  onClick={() => setViewMode('spotlight')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                    viewMode === 'spotlight'
                      ? 'bg-white dark:bg-[#12141d] text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles className="h-3 w-3 text-indigo-500" />
                  <span>Spotlight</span>
                </button>
              )}
              <button
                onClick={() => setViewMode('chart')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  viewMode === 'chart'
                    ? 'bg-white dark:bg-[#12141d] text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Chart
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-[#12141d] text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Table
              </button>
              {isVectorSearch && (
                <button
                  onClick={() => setViewMode('vector')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    viewMode === 'vector'
                      ? 'bg-white dark:bg-[#12141d] text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Semantic Clusters
                </button>
              )}
            </div>

            <button
              onClick={handleExportCsv}
              aria-label="Download CSV"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Download CSV"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {viewMode === 'spotlight' && isSingleRecord && (
          <div className="p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-[#161925] border border-slate-200/80 dark:border-slate-800">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold border border-indigo-200/60 dark:border-indigo-800/60">
                  <Award className="h-3 w-3" />
                  <span>Top Match • ClickHouse OLAP</span>
                </div>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {String(rows[0][xKey] ?? rows[0][columns[0]] ?? 'Result')}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Primary record matching analytical criteria across studio dataset
                </p>
              </div>

              <div className="sm:text-right">
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  {yKeys[0]?.replace(/_/g, ' ') || 'Metric'}
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tracking-tight block mt-0.5">
                  {typeof rows[0][yKeys[0]] === 'number'
                    ? formatNumericValue(rows[0][yKeys[0]], yKeys[0])
                    : String(rows[0][yKeys[0]] ?? '')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Record Breakdown
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {columns.map((col) => (
                  <div
                    key={col}
                    className="p-3 rounded-xl bg-white dark:bg-[#12141e] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs"
                  >
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate uppercase tracking-wider">
                      {col.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-1 font-mono">
                      {typeof rows[0][col] === 'number'
                        ? formatNumericValue(rows[0][col], col)
                        : String(rows[0][col] ?? '-')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'chart' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-end gap-1 text-[11px]">
              {(['bar', 'line', 'area', 'pie'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`px-2 py-0.5 rounded capitalize transition-colors ${
                    chartType === type
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {renderChart()}
          </div>
        )}

        {viewMode === 'table' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Filter records..."
                  className="w-full bg-slate-50 dark:bg-[#161822] border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 pl-8 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {tableSearch && (
                  <button
                    onClick={() => setTableSearch('')}
                    aria-label="Clear search filter"
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Showing {filteredAndSortedRows.length} matching rows
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-[#181a26] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 select-none">
                  <tr>
                    {columns.map(col => (
                      <th
                        key={col}
                        role="columnheader"
                        tabIndex={0}
                        aria-sort={sortCol === col ? (sortAsc ? "ascending" : "descending") : "none"}
                        onClick={() => handleSort(col)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSort(col);
                          }
                        }}
                        className="px-4 py-2.5 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-white focus-visible:outline-indigo-500"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{col}</span>
                          {sortCol === col && (
                            <span className="text-indigo-600 dark:text-indigo-400">{sortAsc ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300 font-mono">
                  {paginatedRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      {columns.map(col => (
                        <td key={col} className="px-4 py-2 truncate max-w-[200px]">
                          {String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Page {page} of {totalPages}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === 'vector' && (
          <div className="p-4">
            <SemanticSearchWidget rows={payload.rows} columns={payload.columns} />
          </div>
        )}
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/70 dark:bg-[#12141e]">
        <button
          onClick={() => setIsSqlExpanded(!isSqlExpanded)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          aria-expanded={isSqlExpanded}
        >
          <span className="flex items-center gap-2">
            <Code className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold">ClickHouse SQL Query</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
              ({execution_time_ms}ms execution)
            </span>
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            {isSqlExpanded ? 'Hide code' : 'View SQL'}
          </span>
        </button>

        {isSqlExpanded && (
          <div className="px-4 pb-4 pt-1 border-t border-slate-200 dark:border-slate-800/80 bg-slate-900 text-slate-200 text-xs font-mono">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400">
              <span>Cluster: {payload.database_mode}</span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
              >
                {copiedSql ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre className="overflow-x-auto py-1 text-indigo-200">
              <code>{sql_query}</code>
            </pre>
          </div>
        )}
      </div>

      {/* 5. Suggested Follow-Up Prompts */}
      {chart_spec.suggested_followups && chart_spec.suggested_followups.length > 0 && (
        <div className="pt-1 space-y-2">
          <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            Suggested follow-up inquiries:
          </div>
          <div className="flex flex-wrap gap-2">
            {chart_spec.suggested_followups.map((followup, idx) => (
              <button
                key={idx}
                onClick={() => onSelectFollowup(followup)}
                className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141620] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 transition-all shadow-2xs flex items-center gap-1.5 text-left"
              >
                <ArrowRight className="h-3 w-3 text-indigo-500 flex-shrink-0" />
                <span>{followup}</span>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};


