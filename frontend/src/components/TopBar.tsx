import React from 'react';
import { Settings, Sun, Moon, Menu, Share2, Download } from 'lucide-react';
import type { HealthResponse, ThemeMode } from '../types';

interface TopBarProps {
  health: HealthResponse | null;
  isWarmingUp?: boolean;
  activeTitle?: string;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onShare?: () => void;
  onExport?: () => void;
  lastLatency?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  health,
  isWarmingUp = false,
  activeTitle = 'Studio Analytics & Telemetry',
  theme,
  onToggleTheme,
  onOpenSettings,
  isSidebarCollapsed = false,
  onToggleSidebar,
  onShare,
  onExport,
  lastLatency
}) => {
  return (
    <header className="h-14 border-b border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between text-xs select-none sticky top-0 z-20 transition-colors">
      
      {/* Left: Sidebar Toggle, Wordmark & Context */}
      <div className="flex items-center gap-3.5">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            aria-expanded={!isSidebarCollapsed}
            className="p-1.5 border border-[var(--line)] hover:border-[var(--accent)] bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--ink-bright)] transition-all"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label="Toggle navigation sidebar"
          >
            <Menu className="h-3.5 w-3.5" />
          </button>
        )}

        <div className="flex items-center gap-3">
          <a href="#top" className="font-semibold tracking-[-0.05em] text-sm text-[var(--ink)] flex items-center gap-0.5">
            <span className="text-[var(--accent)] font-bold">omni</span>query
            <span className="text-[var(--muted)] ml-1 font-mono-tech text-[11px]">↗</span>
          </a>
          <span className="text-[var(--line-strong)] hidden sm:inline">/</span>
          <span className="font-mono-tech text-[10px] tracking-[0.12em] uppercase text-[var(--muted)] hidden sm:inline truncate max-w-[240px]">
            {activeTitle}
          </span>
        </div>
      </div>

      {/* Center Instrument Tag (Elsewhere signature) */}
      <div className="hidden md:flex items-center gap-2 font-mono-tech text-[10px] tracking-[0.14em] uppercase text-[var(--muted)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
        <span>ANALYTICAL INSTRUMENT · {health?.is_cloud_clickhouse ? 'CLICKHOUSE' : 'DUCKDB'}</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        
        {/* Latency Telemetry Metric */}
        {lastLatency !== undefined && (
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono-tech tracking-wider uppercase text-[var(--accent)] bg-[var(--panel)] border border-[var(--line)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            <span>{lastLatency.toFixed(1)}ms</span>
          </div>
        )}
        
        {/* Cluster Status Pill */}
        <div className="flex items-center gap-2 text-[10px] font-mono-tech tracking-wider uppercase text-[var(--muted)] bg-[var(--panel)] px-2.5 py-1 border border-[var(--line)]">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${health?.database_mode ? 'bg-[var(--accent)]' : 'bg-[var(--gold)]'}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${health?.database_mode ? 'bg-[var(--accent)]' : 'bg-[var(--gold)]'}`} />
          </span>
          <span className="truncate max-w-[140px] text-[var(--ink)]">
            {health?.database_mode 
              ? (health.is_cloud_clickhouse ? 'CLICKHOUSE GCP' : 'DUCKDB LOCAL') 
              : (isWarmingUp ? 'WAKING CLOUD...' : 'OFFLINE')}
          </span>
        </div>

        {/* Share Button */}
        {onShare && (
          <button
            onClick={onShare}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono-tech tracking-wider uppercase text-[var(--muted)] hover:text-[var(--ink-bright)] border border-[var(--line)] hover:border-[var(--accent)] bg-[var(--panel)] transition-all hover:-translate-y-0.5"
            title="Share report link"
          >
            <Share2 className="h-3 w-3 text-[var(--accent)]" />
            <span>Share</span>
          </button>
        )}

        {/* Export Button */}
        {onExport && (
          <button
            onClick={onExport}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono-tech tracking-wider uppercase text-[var(--muted)] hover:text-[var(--ink-bright)] border border-[var(--line)] hover:border-[var(--accent)] bg-[var(--panel)] transition-all hover:-translate-y-0.5"
            title="Export query data"
          >
            <Download className="h-3 w-3 text-[var(--accent)]" />
            <span>Export</span>
          </button>
        )}

        {/* Theme Toggle (Sun / Moon) */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 border border-[var(--line)] hover:border-[var(--accent)] bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--ink-bright)] transition-all"
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle color theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-3.5 w-3.5 text-[var(--accent)]" />
          ) : (
            <Moon className="h-3.5 w-3.5 text-[var(--ink)]" />
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 border border-[var(--line)] hover:border-[var(--acid)] bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--ink-bright)] transition-all"
          title="Configure API Keys & Settings"
          aria-label="Settings"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
};


