import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "⌘ / Ctrl + K", desc: "Focus natural language prompt input" },
    { key: "⌘ / Ctrl + N", desc: "Start new analysis thread" },
    { key: "↵ Return", desc: "Execute query across ClickHouse OLAP" },
    { key: "?", desc: "Toggle keyboard shortcuts guide" },
    { key: "Esc", desc: "Dismiss active dialog" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm animate-fadeIn text-xs">
      <div className="bg-white dark:bg-[#141620] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="bg-slate-50/50 dark:bg-[#161824] px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold">
            <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center">
              <Keyboard className="h-3.5 w-3.5" />
            </div>
            <span className="text-slate-900 dark:text-white tracking-tight">Studio Keyboard Shortcuts</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close shortcuts modal"
            className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 p-1 transition-colors rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-5 space-y-2">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50/80 dark:bg-[#181a26] border border-slate-200/80 dark:border-slate-800/70 transition-colors"
            >
              <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium">{s.desc}</span>
              <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-[#10121a] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-mono font-semibold shadow-2xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-slate-50/50 dark:bg-[#161824] px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 text-right text-[11px] text-slate-400 dark:text-slate-500">
          Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 font-mono">Esc</kbd> to dismiss
        </div>
      </div>
    </div>
  );
};

