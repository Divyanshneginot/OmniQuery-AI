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
  Code
} from 'lucide-react';
import type { QueryResultPayload } from '../types';
import { SemanticSearchWidget } from './SemanticSearchWidget';
import { downloadCsv } from '../utils';

interface ResultsWorkbenchProps {
  payload: QueryResultPayload;
  onSelectFollowup: (query: string) => void;
  isLoading?: boolean;
  onShowToast: (msg: string) => void;
  onDrilldown?: (query: string) => void;
}

const PALETTE = ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f43f5e', '#a78bfa'];

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
  const isCurrency = keys.length > 0 && keys.every(k => /revenue|profit|gross|budget|spend|cost|amount/i.test(k));
  const isTime = keys.length > 0 && keys.every(k => /latency|ms|duration/i.test(k));
  const isPct = keys.length > 0 && keys.every(k => /pct|percent|rate/i.test(k));

  return (val: number | string) => {
    const num = Number(val);
    if (isNaN(num) || num === 0) return String(val);
    if (isCurrency) return currencyFmt.format(num);
    if (isTime) return `${num} ms`;
    if (isPct) return `${num.toFixed(1)}%`;
    return compactFmt.format(num);
  };
};

const getSingleAxisFormatter = (key: string) => {
  const isCurrency = /revenue|profit|gross|budget|spend|cost|amount/i.test(key);
  const isTime = /latency|ms|duration/i.test(key);
  const isPct = /pct|percent|rate/i.test(key);

  return (val: number | string) => {
    const num = Number(val);
    if (isNaN(num) || num === 0) return String(val);
    if (isCurrency) return currencyFmt.format(num);
    if (isTime) return `${num} ms`;
    if (isPct) return `${num.toFixed(1)}%`;
    return compactFmt.format(num);
  };
};

const formatXAxisTick = (val: unknown) => {
  const s = String(val ?? '');
  const stripped = s.replace(/^\/(api|stream)\/v\d+\//, '/');
  return stripped.length > 20 ? stripped.slice(0, 18) + '…' : stripped;
};

interface TooltipEntry {
  name: string;
  value: number | string;
  color?: string;
}

const CustomTooltip = ({ active, payload: tp, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) => {
  if (active && tp && tp.length) {
    return (
      <div className="bg-[var(--panel-card)] border border-[var(--line)] p-3 text-xs shadow-xl font-mono-tech">
        <p className="font-semibold text-[var(--ink-bright)] mb-1.5 pb-1 border-b border-[var(--line)]">
          {label}
        </p>
        {tp.map((entry, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 py-0.5 text-[var(--muted)]">
            <span className="flex items-center gap-1.5">
              {entry.color && <span className="h-1.5 w-1.5" style={{ backgroundColor: entry.color }} />}
              <span>{entry.name}:</span>
            </span>
            <span className="font-semibold text-[var(--ink-bright)]">
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
  onShowToast,
  onDrilldown
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

  const hasDualAxis = useMemo(() => {
    if (yKeys.length !== 2) return false;
    const isTime0 = /latency|ms|duration/i.test(yKeys[0]);
    const isTime1 = /latency|ms|duration/i.test(yKeys[1]);
    const isCurr0 = /revenue|profit|gross|budget|spend|cost|amount/i.test(yKeys[0]);
    const isCurr1 = /revenue|profit|gross|budget|spend|cost|amount/i.test(yKeys[1]);
    return (isTime0 !== isTime1) || (isCurr0 !== isCurr1);
  }, [yKeys]);

  const leftAxisFormatter = useMemo(() => getSingleAxisFormatter(yKeys[0] || ''), [yKeys]);
  const rightAxisFormatter = useMemo(() => getSingleAxisFormatter(yKeys[1] || ''), [yKeys]);

  const displayMetrics = useMemo(() => {
    const rawList = chart_spec.key_metrics || [];
    const list = rawList.map((m, idx) => {
      let label = m.label?.trim() || (m as any).title?.trim() || (m as any).name?.trim() || '';
      if (!label) {
        if (idx === 0) label = 'Top Segment';
        else if (idx === 1) label = 'Total Volume';
        else label = 'Key Margin / Share';
      }
      return {
        ...m,
        label,
        trend: m.trend || 'neutral'
      };
    });

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
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={rows} margin={{ top: 15, right: hasDualAxis ? 25 : 15, left: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.1)" />
              <XAxis dataKey={xKey} stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={formatXAxisTick} angle={-25} textAnchor="end" interval={0} height={55} />
              {hasDualAxis ? (
                <>
                  <YAxis yAxisId="left" orientation="left" stroke={PALETTE[0]} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={leftAxisFormatter} width={58} />
                  <YAxis yAxisId="right" orientation="right" stroke={PALETTE[1]} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={rightAxisFormatter} width={58} />
                </>
              ) : (
                <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={yAxisFormatter} width={58} />
              )}
              <Tooltip cursor={{ stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1, strokeDasharray: '3 3' }} content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 8, fontSize: '11px' }} />
              {yKeys.map((k, i) => (
                <Line
                  key={k}
                  yAxisId={hasDualAxis ? (i === 0 ? 'left' : 'right') : undefined}
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
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={rows} margin={{ top: 15, right: hasDualAxis ? 25 : 15, left: 10, bottom: 40 }}>
              <defs>
                {yKeys.map((k, i) => (
                  <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.1)" />
              <XAxis dataKey={xKey} stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={formatXAxisTick} angle={-25} textAnchor="end" interval={0} height={55} />
              {hasDualAxis ? (
                <>
                  <YAxis yAxisId="left" orientation="left" stroke={PALETTE[0]} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={leftAxisFormatter} width={58} />
                  <YAxis yAxisId="right" orientation="right" stroke={PALETTE[1]} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={rightAxisFormatter} width={58} />
                </>
              ) : (
                <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={yAxisFormatter} width={58} />
              )}
              <Tooltip cursor={{ stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1, strokeDasharray: '3 3' }} content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 8, fontSize: '11px' }} />
              {yKeys.map((k, i) => (
                <Area
                  key={k}
                  yAxisId={hasDualAxis ? (i === 0 ? 'left' : 'right') : undefined}
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
          <ResponsiveContainer width="100%" height={320}>
            <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 8, fontSize: '11px' }} />
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
                className="cursor-pointer hover:opacity-85 transition-opacity"
                onClick={(entry: any) => {
                  const target = entry?.name ?? entry?.[xKey] ?? entry?.payload?.[xKey];
                  if (target) {
                    const drillQuery = `Analyze audience reviews and streaming metrics for ${target}`;
                    (onDrilldown || onSelectFollowup)(drillQuery);
                    onShowToast(`Drilldown activated: "${target}"`);
                  }
                }}
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
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={rows} margin={{ top: 15, right: hasDualAxis ? 25 : 15, left: 10, bottom: 40 }} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.1)" />
              <XAxis dataKey={xKey} stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={formatXAxisTick} angle={-25} textAnchor="end" interval={0} height={55} />
              {hasDualAxis ? (
                <>
                  <YAxis yAxisId="left" orientation="left" stroke={PALETTE[0]} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={leftAxisFormatter} width={58} />
                  <YAxis yAxisId="right" orientation="right" stroke={PALETTE[1]} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={rightAxisFormatter} width={58} />
                </>
              ) : (
                <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={yAxisFormatter} width={58} />
              )}
              <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 8, fontSize: '11px' }} />
              {yKeys.map((k, i) => (
                <Bar
                  key={k}
                  yAxisId={hasDualAxis ? (i === 0 ? 'left' : 'right') : undefined}
                  dataKey={k}
                  name={chart_spec.series_names?.[i] || k.replace(/_/g, ' ').toUpperCase()}
                  fill={PALETTE[i % PALETTE.length]}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={44}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={(entry: any) => {
                    const target = entry?.[xKey] || entry?.payload?.[xKey];
                    if (target) {
                      const drillQuery = `Drill down into ${target}: break down gross revenue and territory performance`;
                      (onDrilldown || onSelectFollowup)(drillQuery);
                      onShowToast(`Drilldown activated: "${target}"`);
                    }
                  }}
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
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. Synthesis Card / Executive Finding */}
      {chart_spec.executive_summary && (
        <div className="border border-[var(--line)] bg-[var(--panel-card)] p-4 sm:p-5 flex items-start gap-3.5 group hover:border-[var(--line-strong)] transition-colors">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-1.5 flex-shrink-0" />
          <div className="flex-1 space-y-1">
            <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--accent)] block font-medium">
              Executive Finding
            </span>
            <p className="text-xs sm:text-sm text-[var(--ink-bright)] leading-relaxed font-normal">
              {chart_spec.executive_summary}
            </p>
          </div>
        </div>
      )}

      {/* 2. Balanced Metric Ledger Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {displayMetrics.map((metric, idx) => (
          <div
            key={idx}
            className="p-4 border border-[var(--line)] hover:border-[var(--line-strong)] bg-[var(--panel-card)] transition-colors flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between border-b border-[var(--line-subtle)] pb-2">
              <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--muted)]">
                {metric.label}
              </span>
              {renderTrendIcon(metric.trend)}
            </div>
            <div className="text-2xl sm:text-3xl font-light font-mono-tech text-[var(--ink-bright)] mt-3 tracking-tight">
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Main Analytical Workbench */}
      <div className="border border-[var(--line)] bg-[var(--panel-card)] overflow-hidden">
        
        {/* Head Bar */}
        <div className="px-4 sm:px-5 py-3 border-b border-[var(--line)] flex flex-wrap items-center justify-between gap-3 bg-[var(--panel)]">
          <div>
            <h3 className="text-xs font-semibold text-[var(--ink-bright)]">
              {chart_spec.title || 'Analytical Telemetry Synthesis'}
            </h3>
            <p className="font-mono-tech text-[9px] text-[var(--muted)] uppercase tracking-wider mt-0.5">
              ClickHouse OLAP · {total_rows} records returned
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border border-[var(--line)] bg-[var(--panel-input)] p-0.5">
              {isSingleRecord && (
                <button
                  onClick={() => setViewMode('spotlight')}
                  className={`px-2.5 py-1 font-mono-tech text-[10px] uppercase tracking-wider transition-all ${
                    viewMode === 'spotlight'
                      ? 'bg-[var(--ink-bright)] text-[var(--paper)] font-semibold'
                      : 'text-[var(--muted)] hover:text-[var(--ink-bright)]'
                  }`}
                >
                  Spotlight
                </button>
              )}
              <button
                onClick={() => setViewMode('chart')}
                className={`px-2.5 py-1 font-mono-tech text-[10px] uppercase tracking-wider transition-all ${
                  viewMode === 'chart'
                    ? 'bg-[var(--ink-bright)] text-[var(--paper)] font-semibold'
                    : 'text-[var(--muted)] hover:text-[var(--ink-bright)]'
                }`}
              >
                Chart
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 font-mono-tech text-[10px] uppercase tracking-wider transition-all ${
                  viewMode === 'table'
                    ? 'bg-[var(--ink-bright)] text-[var(--paper)] font-semibold'
                    : 'text-[var(--muted)] hover:text-[var(--ink-bright)]'
                }`}
              >
                Ledger
              </button>
              {isVectorSearch && (
                <button
                  onClick={() => setViewMode('vector')}
                  className={`px-2.5 py-1 font-mono-tech text-[10px] uppercase tracking-wider transition-all ${
                    viewMode === 'vector'
                      ? 'bg-[var(--ink-bright)] text-[var(--paper)] font-semibold'
                      : 'text-[var(--muted)] hover:text-[var(--ink-bright)]'
                  }`}
                >
                  Semantic
                </button>
              )}
            </div>

            <button
              onClick={handleExportCsv}
              aria-label="Download CSV"
              className="px-2.5 py-1 border border-[var(--line)] hover:border-[var(--accent)] text-[var(--muted)] hover:text-[var(--ink-bright)] bg-[var(--panel-input)] font-mono-tech text-[10px] uppercase tracking-wider flex items-center gap-1 transition-colors"
              title="Download CSV"
            >
              <Download className="h-3 w-3" />
              <span>CSV ↘</span>
            </button>
          </div>
        </div>

        {/* View Mode: Spotlight */}
        {viewMode === 'spotlight' && isSingleRecord && (
          <div className="p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border border-[var(--line)] bg-[var(--panel)]">
              <div className="space-y-1">
                <div className="font-mono-tech text-[9px] text-[var(--accent)] uppercase tracking-[0.14em]">
                  PRIMARY MATCH · CLICKHOUSE OLAP
                </div>
                <h4 className="text-xl sm:text-2xl font-light text-[var(--ink-bright)] tracking-tight">
                  {String(rows[0][xKey] ?? rows[0][columns[0]] ?? 'Result')}
                </h4>
                <p className="text-[11px] text-[var(--muted)]">
                  Primary record matching analytical criteria across studio dataset
                </p>
              </div>

              <div className="sm:text-right">
                <span className="font-mono-tech text-[9px] text-[var(--muted)] uppercase tracking-wider block">
                  {yKeys[0]?.replace(/_/g, ' ') || 'Metric'}
                </span>
                <span className="text-2xl sm:text-3xl font-light text-[var(--accent)] font-mono-tech tracking-tight block mt-0.5">
                  {typeof rows[0][yKeys[0]] === 'number'
                    ? formatNumericValue(rows[0][yKeys[0]], yKeys[0])
                    : String(rows[0][yKeys[0]] ?? '')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-mono-tech text-[9px] uppercase tracking-[0.14em] text-[var(--muted)]">
                Field Breakdown
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {columns.map((col) => (
                  <div
                    key={col}
                    className="p-3 border border-[var(--line)] bg-[var(--panel)] font-mono-tech"
                  >
                    <div className="text-[9px] text-[var(--muted)] truncate uppercase tracking-wider">
                      {col.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs font-medium text-[var(--ink-bright)] truncate mt-1">
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

        {/* View Mode: Chart */}
        {viewMode === 'chart' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="hidden sm:inline-flex items-center gap-1.5 font-mono-tech text-[9px] uppercase tracking-wider text-[var(--accent)] border border-[var(--accent)]/30 bg-[var(--accent-muted)] px-2 py-0.5">
                <span>⚡ Interactive · Click any bar or table row to drill down</span>
              </span>
              <div className="flex items-center gap-1 font-mono-tech text-[9px] uppercase ml-auto">
                {(['bar', 'line', 'area', 'pie'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`px-2 py-0.5 border transition-colors ${
                      chartType === type
                        ? 'border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)] font-semibold'
                        : 'border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink-bright)]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            {renderChart()}
          </div>
        )}

        {/* View Mode: Table / Ledger */}
        {viewMode === 'table' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="h-3.5 w-3.5 text-[var(--muted)] absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Filter records..."
                  className="w-full bg-[var(--panel)] border border-[var(--line)] px-2 py-1.5 pl-8 text-xs font-mono-tech text-[var(--ink-bright)] placeholder-[var(--muted-dim)] focus:outline-none focus:border-[var(--accent)]"
                />
                {tableSearch && (
                  <button
                    onClick={() => setTableSearch('')}
                    aria-label="Clear search filter"
                    className="absolute right-2.5 top-2.5 text-[var(--muted)] hover:text-[var(--ink)]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <span className="font-mono-tech text-[10px] uppercase text-[var(--muted)]">
                Showing {filteredAndSortedRows.length} rows
              </span>
            </div>

            <div className="overflow-x-auto border border-[var(--line)] text-xs">
              <table className="w-full text-left">
                <thead className="bg-[var(--panel-input)] text-[var(--muted)] border-b border-[var(--line)] select-none font-mono-tech text-[9px] uppercase tracking-wider">
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
                        className="px-4 py-2.5 font-medium cursor-pointer hover:text-[var(--ink-bright)]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{col}</span>
                          {sortCol === col && (
                            <span className="text-[var(--accent)]">{sortAsc ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line-subtle)] font-mono-tech text-[11px] text-[var(--ink)]">
                  {paginatedRows.map((row, rIdx) => {
                    const primaryVal = row[xKey] ?? row[columns[0]];
                    return (
                      <tr
                        key={rIdx}
                        onClick={() => {
                          if (primaryVal) {
                            const drillQuery = `Filter and examine detailed breakdown for ${primaryVal}`;
                            (onDrilldown || onSelectFollowup)(drillQuery);
                            onShowToast(`Drilldown activated: "${primaryVal}"`);
                          }
                        }}
                        className="hover:bg-[var(--panel-input)] cursor-pointer transition-colors group"
                        title="Click to drill down into this record"
                      >
                        {columns.map(col => {
                          const val = row[col];
                          const formatted = typeof val === 'number'
                            ? (Number.isInteger(val) ? val.toLocaleString() : val.toLocaleString(undefined, { maximumFractionDigits: 2 }))
                            : String(val ?? '');
                          return (
                            <td key={col} className="px-4 py-2 truncate max-w-[200px] group-hover:text-[var(--accent)] transition-colors">
                              {formatted}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between font-mono-tech text-[10px] text-[var(--muted)] pt-1">
                <span>Page {page} of {totalPages}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2.5 py-1 border border-[var(--line)] hover:border-[var(--accent)] disabled:opacity-30 uppercase"
                  >
                    Prev ←
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-2.5 py-1 border border-[var(--line)] hover:border-[var(--accent)] disabled:opacity-30 uppercase"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* View Mode: Vector Clusters */}
        {viewMode === 'vector' && (
          <div className="p-4">
            <SemanticSearchWidget rows={payload.rows} columns={payload.columns} />
          </div>
        )}
      </div>

      {/* 4. ClickHouse SQL Drawer (Core Formula) */}
      <div className="border border-[var(--line)] bg-[var(--panel)]">
        <button
          onClick={() => setIsSqlExpanded(!isSqlExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs text-[var(--muted)] hover:text-[var(--ink-bright)] transition-colors"
          aria-expanded={isSqlExpanded}
        >
          <span className="flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-[0.12em]">
            <Code className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span className="font-semibold text-[var(--ink)]">Core Formula / ClickHouse SQL</span>
            <span className="text-[var(--muted-dim)]">
              ({execution_time_ms}ms runtime)
            </span>
          </span>
          <span className="font-mono-tech text-[10px] text-[var(--accent)] uppercase">
            {isSqlExpanded ? '[-] Hide' : '[+] View Formula'}
          </span>
        </button>

        {isSqlExpanded && (
          <div className="px-4 pb-4 pt-2 border-t border-[var(--line)] bg-[var(--paper)] text-xs font-mono-tech">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--line)] text-[9px] uppercase tracking-wider text-[var(--muted)]">
              <span>Cluster: {payload.database_mode}</span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1 text-[var(--accent)] hover:underline font-medium"
              >
                {copiedSql ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre className="overflow-x-auto py-1 text-[var(--accent)]">
              <code>{sql_query}</code>
            </pre>
          </div>
        )}
      </div>

      {/* 5. Suggested Follow-Up Prompts */}
      {chart_spec.suggested_followups && chart_spec.suggested_followups.length > 0 && (
        <div className="pt-2 space-y-2.5">
          <div className="font-mono-tech text-[9px] uppercase tracking-[0.14em] text-[var(--muted)]">
            Suggested follow-up inquiries:
          </div>
          <div className="flex flex-wrap gap-2">
            {chart_spec.suggested_followups.map((followup, idx) => (
              <button
                key={idx}
                onClick={() => onSelectFollowup(followup)}
                className="px-3 py-1.5 border border-[var(--line)] hover:border-[var(--accent)] bg-[var(--panel-card)] hover:bg-[var(--panel-input)] text-xs text-[var(--ink)] hover:text-[var(--accent)] transition-all font-mono-tech text-left flex items-center gap-2"
              >
                <ArrowRight className="h-3 w-3 text-[var(--accent)] flex-shrink-0" />
                <span className="text-[11px]">{followup}</span>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};



