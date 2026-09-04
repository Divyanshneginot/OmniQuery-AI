import React from 'react';
import { Settings, Sun, Moon, Menu, Share2, Download } from 'lucide-react';
import type { HealthResponse, ThemeMode } from '../types';

interface TopBarProps {
  health: HealthResponse | null;
  activeTitle?: string;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onShare?: () => void;
  onExport?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  health,
  activeTitle = 'Studio Analytics & Telemetry',
  theme,
  onToggleTheme,
  onOpenSettings,
  isSidebarCollapsed = false,
  onToggleSidebar,
  onShare,
  onExport
}) => {
  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0f1118]/90 px-4 sm:px-6 flex items-center justify-between text-xs select-none sticky top-0 z-20 backdrop-blur-md transition-colors">
      
      {/* Left: Sidebar Toggle & Title */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            aria-expanded={!isSidebarCollapsed}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label="Toggle navigation sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm tracking-tight">
            <span className="truncate max-w-[200px] sm:max-w-[360px]">{activeTitle}</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">ClickHouse Cloud</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        
        {/* Cluster Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-200/80 dark:border-slate-700/60">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="truncate max-w-[140px]">
            {health?.database_mode ? (health.is_cloud_clickhouse ? 'ClickHouse GCP' : 'DuckDB Fallback') : 'Connecting...'}
          </span>
        </div>

        {/* Share Button */}
        {onShare && (
          <button
            onClick={onShare}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Share report link"
          >
            <Share2 className="h-3 w-3" />
            <span>Share</span>
          </button>
        )}

        {/* Export Button */}
        {onExport && (
          <button
            onClick={onExport}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Export query data"
          >
            <Download className="h-3 w-3" />
            <span>Export</span>
          </button>
        )}

        {/* Theme Toggle (Sun / Moon) */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle color theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-600" />
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Configure API Keys & Settings"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};


