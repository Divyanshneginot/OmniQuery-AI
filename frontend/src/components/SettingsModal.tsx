import React, { useState, useEffect } from 'react';
import { X, Key, Database, Check, Sparkles, Server } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [chHost, setChHost] = useState('');
  const [chUser, setChUser] = useState('default');
  const [chPassword, setChPassword] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGeminiKey(localStorage.getItem('geminiKey') || '');
      setChHost(localStorage.getItem('chHost') || '');
      setChUser(localStorage.getItem('chUser') || 'default');
      setChPassword(localStorage.getItem('chPassword') || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('geminiKey', geminiKey);
    localStorage.setItem('chHost', chHost);
    localStorage.setItem('chUser', chUser);
    localStorage.setItem('chPassword', chPassword);
    
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onSave();
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn text-xs">
      <div className="cinema-glass rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-white/[0.08]">
        
        {/* Header */}
        <div className="bg-zinc-950/90 px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shadow-md">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-sans tracking-wide">
                Engine & API Credentials
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                Configure Gemini 2.5 & ClickHouse Cloud endpoints
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 p-1 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          
          {/* Gemini API Key */}
          <div className="space-y-1.5 font-mono">
            <label className="text-zinc-200 font-semibold flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                Google Gemini API Key
              </span>
              <a
                href="https://aistudio.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline text-[10px]"
              >
                Get API Key →
              </a>
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full bg-zinc-950/90 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/60 font-mono text-xs"
            />
            <p className="text-[10px] text-zinc-500 font-sans">
              Leave blank to use the built-in deterministic film studio analytics reasoning engine.
            </p>
          </div>

          <div className="border-t border-white/[0.06] pt-4 space-y-3 font-mono">
            <div className="flex items-center gap-1.5 text-zinc-200 font-semibold text-xs">
              <Database className="h-3.5 w-3.5 text-amber-400" />
              <span>ClickHouse Cloud Cluster (Optional)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 text-[10px]">Host URL</label>
                <input
                  type="text"
                  placeholder="e.g. xyz.clickhouse.cloud"
                  value={chHost}
                  onChange={(e) => setChHost(e.target.value)}
                  className="w-full bg-zinc-950/90 border border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/60 text-xs mt-1"
                />
              </div>
              <div>
                <label className="text-zinc-400 text-[10px]">Username</label>
                <input
                  type="text"
                  value={chUser}
                  onChange={(e) => setChUser(e.target.value)}
                  className="w-full bg-zinc-950/90 border border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-cyan-500/60 text-xs mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-zinc-400 text-[10px]">Password</label>
                <input
                  type="password"
                  placeholder="ClickHouse Password"
                  value={chPassword}
                  onChange={(e) => setChPassword(e.target.value)}
                  className="w-full bg-zinc-950/90 border border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/60 text-xs mt-1"
                />
              </div>
            </div>
            
            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/30 text-[11px] text-cyan-300 flex items-start gap-2.5">
              <Server className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span className="font-sans">
                If no cloud cluster is entered, OmniQuery AI operates against the ultra-fast embedded columnar engine with 140,000 film studio records.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-zinc-950/90 px-6 py-3.5 border-t border-white/[0.08] flex items-center justify-end gap-3 font-mono">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all"
          >
            {saved ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save & Apply</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

