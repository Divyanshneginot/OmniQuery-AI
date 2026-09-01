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
    { key: "⌘ / Ctrl + K", desc: "Focus AI query command bar" },
    { key: "1", desc: "Switch to AI Analyst Studio" },
    { key: "2", desc: "Switch to Raw SQL Studio" },
    { key: "3", desc: "Switch to Live Telemetry Monitor" },
    { key: "?", desc: "Toggle Keyboard Shortcuts modal" },
    { key: "Esc", desc: "Dismiss active modal" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="cinema-glass rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-xs border border-white/[0.08]">
        
        {/* Header */}
        <div className="bg-zinc-950/90 px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-zinc-100 font-bold font-mono">
            <div className="h-7 w-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Keyboard className="h-3.5 w-3.5" />
            </div>
            <span>STUDIO KEYBOARD SHORTCUTS</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 p-1 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-5 space-y-2 font-mono">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 px-3 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/60 border border-white/[0.04] transition-colors"
            >
              <span className="text-zinc-300 text-[11px]">{s.desc}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-700/80 text-cyan-300 text-[11px] font-bold shadow-inner">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-zinc-950/90 px-5 py-3 border-t border-white/[0.08] text-right text-[10px] text-zinc-500 font-mono">
          Press <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-400">Esc</kbd> to dismiss
        </div>
      </div>
    </div>
  );
};

