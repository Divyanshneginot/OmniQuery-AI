import React, { useState } from 'react';
import { X, Key, Database, Check, Sparkles, Server } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  if (!isOpen) return null;
  return <SettingsModalContent onClose={onClose} onSave={onSave} />;
};

const SettingsModalContent: React.FC<{ onClose: () => void; onSave: () => void }> = ({ onClose, onSave }) => {
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('geminiKey') || '');
  const [chHost, setChHost] = useState(() => localStorage.getItem('chHost') || '');
  const [chUser, setChUser] = useState(() => localStorage.getItem('chUser') || 'default');
  const [chPassword, setChPassword] = useState(() => localStorage.getItem('chPassword') || '');
  const [saved, setSaved] = useState(false);

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
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm animate-fadeIn text-xs">
      <div className="bg-white dark:bg-[#141620] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-[#161824]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Engine & API Credentials
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Configure Gemini 3.6 Flash & ClickHouse Cloud on GCP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 p-1 transition-colors rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          
          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                Google Gemini API Key
              </span>
              <a
                href="https://aistudio.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:underline text-[11px] font-medium"
              >
                Get API Key →
              </a>
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#181a26] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs transition-colors"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Leave blank to use the backend's active Gemini 3.6 Flash pipeline.
            </p>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold text-xs">
              <Database className="h-3.5 w-3.5 text-amber-500" />
              <span>ClickHouse Cloud Cluster (Optional Override)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Host URL</label>
                <input
                  type="text"
                  placeholder="e.g. fvq6jahr7r.asia-southeast1.gcp.clickhouse.cloud"
                  value={chHost}
                  onChange={(e) => setChHost(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#181a26] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs mt-1 transition-colors"
                />
              </div>
              <div>
                <label className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Username</label>
                <input
                  type="text"
                  value={chUser}
                  onChange={(e) => setChUser(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#181a26] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs mt-1 transition-colors"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Password</label>
                <input
                  type="password"
                  placeholder="ClickHouse Password"
                  value={chPassword}
                  onChange={(e) => setChPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#181a26] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs mt-1 transition-colors"
                />
              </div>
            </div>
            
            <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-950 dark:text-indigo-200 flex items-start gap-2.5">
              <Server className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                If custom cluster credentials are not provided, OmniQuery AI connects directly to our pre-configured <strong>ClickHouse Cloud cluster on GCP</strong> with 30,000+ seeded studio records across box office revenue, streaming CDN QoS telemetry, and audience sentiment.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-[#161824]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 text-white text-xs font-semibold shadow-2xs transition-all"
          >
            {saved ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
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

