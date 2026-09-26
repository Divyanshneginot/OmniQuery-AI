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
    { key: "1 / 2 / 3", desc: "Instantly trigger curated benchmark query" },
    { key: "↵ Return", desc: "Execute query across ClickHouse OLAP" },
    { key: "?", desc: "Toggle keyboard shortcuts guide" },
    { key: "Esc", desc: "Dismiss active dialog" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn text-xs">
      <div className="bg-[var(--panel)] border border-[var(--line)] w-full max-w-md shadow-2xl text-[var(--ink)]">
        
        {/* Header */}
        <div className="bg-[var(--panel-card)] px-5 py-3.5 border-b border-[var(--line)] flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-mono-tech text-[10px] uppercase tracking-wider font-semibold">
            <div className="p-1.5 border border-[var(--line)] text-[var(--accent)] bg-[var(--panel-input)]">
              <Keyboard className="h-3.5 w-3.5" />
            </div>
            <span className="text-[var(--ink-bright)]">Console Hotkeys Guide</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close shortcuts modal"
            className="text-[var(--muted)] hover:text-[var(--ink-bright)] p-1 transition-colors border border-transparent hover:border-[var(--line)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 space-y-1.5">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 px-3 border border-[var(--line)] bg-[var(--panel-card)] transition-colors"
            >
              <span className="text-[var(--ink)] text-[11px] font-mono-tech">{s.desc}</span>
              <kbd className="px-2 py-0.5 border border-[var(--line)] bg-[var(--panel-input)] text-[var(--accent)] text-[10px] font-mono-tech uppercase">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-[var(--panel-card)] px-5 py-2.5 border-t border-[var(--line)] text-right text-[10px] font-mono-tech text-[var(--muted)]">
          Press <span className="text-[var(--accent)]">Esc</span> to dismiss
        </div>
      </div>
    </div>
  );
};
