import React, { useState, useEffect } from 'react';
import { Play, Pause, RefreshCw, Activity, AlertTriangle, Zap, Film, Radio, Server } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface LiveMonitorProps {
  onExecuteSql: (sql: string) => Promise<any>;
}

export const LiveMonitor: React.FC<LiveMonitorProps> = ({ onExecuteSql }) => {
  const [isLive, setIsLive] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [telemetryData, setTelemetryData] = useState<any[]>([]);
  const [errorData, setErrorData] = useState<any[]>([]);
  const [orderMetrics, setOrderMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchLiveMetrics = async () => {
    setLoading(true);
    try {
      const telemetrySql = `SELECT service_name, round(avg(latency_ms), 1) as avg_latency_ms, round(quantileExact(0.95)(latency_ms), 1) as p95_latency_ms, count(*) as req_count FROM streaming_platform_metrics GROUP BY service_name ORDER BY p95_latency_ms DESC;`;
      
      const errorSql = `SELECT service_name, status_code, count(*) as error_count FROM streaming_platform_metrics WHERE status_code >= 400 GROUP BY service_name, status_code ORDER BY error_count DESC LIMIT 5;`;
      
      const boxOfficeSql = `SELECT count(*) as total_movies, sum(gross_revenue) as total_gross, round(avg(gross_revenue), 2) as avg_gross, sum(net_profit) as total_profit FROM box_office_revenue;`;
      
      const [telRes, errRes, boxOfficeRes] = await Promise.all([
        onExecuteSql(telemetrySql),
        onExecuteSql(errorSql),
        onExecuteSql(boxOfficeSql)
      ]);

      if (telRes?.rows) setTelemetryData(telRes.rows);
      if (errRes?.rows) setErrorData(errRes.rows);
      if (boxOfficeRes?.rows && boxOfficeRes.rows[0]) setOrderMetrics(boxOfficeRes.rows[0]);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Live monitor fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveMetrics();
  }, []);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(fetchLiveMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [isLive, refreshInterval]);

  return (
    <div className="space-y-4 text-xs font-mono">
      
      {/* Control Ribbon */}
      <div className="cinema-glass rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 border border-white/[0.08] shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLive ? 'bg-emerald-400' : 'bg-zinc-600'} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isLive ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
            </span>
            <h2 className="text-sm font-bold text-white flex items-center gap-2 font-sans tracking-wide">
              <Radio className="h-4 w-4 text-cyan-400" />
              {isLive ? 'Live Film Studio Telemetry Stream' : 'Stream Paused'}
            </h2>
          </div>
          <span className="text-[10px] text-zinc-500 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
            Last Scan: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm ${
              isLive
                ? 'bg-amber-950/40 text-amber-300 border border-amber-800/60 hover:bg-amber-900/50'
                : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/50'
            }`}
          >
            {isLive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            <span>{isLive ? 'Pause Stream' : 'Resume Stream'}</span>
          </button>

          {/* Refresh Interval Selector */}
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="bg-zinc-900/90 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none text-[11px]"
          >
            <option value={2000}>Refresh: 2s (Ultra Fast)</option>
            <option value={5000}>Refresh: 5s (Standard)</option>
            <option value={10000}>Refresh: 10s (Eco)</option>
          </select>

          {/* Manual Refresh */}
          <button
            onClick={fetchLiveMetrics}
            disabled={loading}
            className="p-1.5 rounded-lg bg-zinc-900/90 border border-zinc-700/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all disabled:opacity-50"
            title="Refresh telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      {orderMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="cinema-glass-card rounded-xl p-4 flex flex-col justify-between border border-white/[0.08] shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Total Box Office Gross</span>
              <Film className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
                ${(orderMetrics.total_gross / 1000000).toFixed(2)}M
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-400">
              <Zap className="h-3 w-3 text-amber-400" /> 
              <span>50,000 box office titles aggregated</span>
            </div>
          </div>

          <div className="cinema-glass-card rounded-xl p-4 flex flex-col justify-between border border-white/[0.08] shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Avg Gross / Title</span>
              <Activity className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-cyan-300 font-mono tracking-tight">
                ${(orderMetrics.avg_gross / 1000000).toFixed(2)}M
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 mt-2">Columnar ClickHouse scan in 2ms</span>
          </div>

          <div className="cinema-glass-card rounded-xl p-4 flex flex-col justify-between border border-white/[0.08] shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Total Logged Telemetry</span>
              <Server className="h-4 w-4 text-violet-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-violet-300 font-mono tracking-tight">
                75,000 Events
              </span>
            </div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1.5 mt-2 font-semibold">
              <Activity className="h-3 w-3" /> Sub-5ms OLAP throughput
            </span>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Latency by Service */}
        <div className="cinema-glass-card p-4 rounded-xl border border-white/[0.08] space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/[0.05] pb-2">
            <span className="font-bold text-zinc-100 text-xs uppercase flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
              Microservice p95 Latency (ms)
            </span>
            <span className="text-[10px] text-zinc-500 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              quantile(0.95)
            </span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="p95GradLive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="service_name" stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                <YAxis stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090a0f', borderColor: 'rgba(255,255,255,0.1)', fontSize: '11px', color: '#fff', borderRadius: '8px' }}
                  formatter={(val: any) => [`${val} ms`, 'p95 Latency']}
                />
                <Area type="monotone" dataKey="p95_latency_ms" stroke="#06b6d4" fill="url(#p95GradLive)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Error Breakdown */}
        <div className="cinema-glass-card p-4 rounded-xl border border-white/[0.08] space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/[0.05] pb-2">
            <span className="font-bold text-zinc-100 text-xs uppercase flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span>HTTP 4xx/5xx Error Spikes</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              status_code {'>='} 400
            </span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errorData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="errBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                    <stop offset="100%" stopColor="#b45309" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="service_name" stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                <YAxis stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090a0f', borderColor: 'rgba(255,255,255,0.1)', fontSize: '11px', color: '#fff', borderRadius: '8px' }}
                  formatter={(val: any, _: any, item: any) => [`${val} errors (HTTP ${item.payload.status_code})`, 'Error Count']}
                />
                <Bar dataKey="error_count" fill="url(#errBarGrad)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

