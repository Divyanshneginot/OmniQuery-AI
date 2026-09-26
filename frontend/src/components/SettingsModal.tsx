import React, { useState } from 'react';
import { X, Key, Database, Check, Server } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('geminiKey') || '');
  const [chHost, setChHost] = useState(() => localStorage.getItem('chHost') || '');
  const [chUser, setChUser] = useState(() => localStorage.getItem('chUser') || 'default');
  const [chPassword, setChPassword] = useState(() => localStorage.getItem('chPassword') || '');
  const [saved, setSaved] = useState(false);

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
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn text-xs">
      <div className="bg-[var(--panel)] border border-[var(--line)] w-full max-w-lg shadow-2xl text-[var(--ink)]">
        <div className="px-5 py-4 border-b border-[var(--line)] flex items-center justify-between bg-[var(--panel-card)]">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-[var(--line)] text-[var(--accent)] bg-[var(--panel-input)]">
              <Key className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[var(--ink-bright)] uppercase tracking-wider font-mono-tech">
                Engine & API Credentials
              </h3>
              <p className="text-[10px] text-[var(--muted)] font-mono-tech mt-0.5">
                Gemini 3.6 Flash & ClickHouse Cloud GCP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="text-[var(--muted)] hover:text-[var(--ink-bright)] p-1.5 transition-colors border border-transparent hover:border-[var(--line)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[var(--ink)] font-mono-tech text-[10px] uppercase tracking-wider flex items-center justify-between">
              <span>Google Gemini API Key</span>
              <a
                href="https://aistudio.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--accent)] hover:underline text-[9px] uppercase tracking-wider"
              >
                Get Key ↗
              </a>
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full bg-[var(--panel-input)] border border-[var(--line)] px-3 py-2 text-[var(--ink-bright)] placeholder-[var(--muted-dim)] focus:outline-none focus:border-[var(--accent)] font-mono-tech text-xs transition-colors"
            />
            <p className="text-[10px] text-[var(--muted)] font-mono-tech">
              Leave blank to use pre-configured backend Gemini 3.6 Flash.
            </p>
          </div>

          <div className="border-t border-[var(--line)] pt-4 space-y-3">
            <div className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--ink)] flex items-center gap-1.5">
              <Database className="h-3 w-3 text-[var(--gold)]" />
              <span>ClickHouse Cluster Override (Optional)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[var(--muted)] font-mono-tech text-[9px] uppercase tracking-wider">Host URL</label>
                <input
                  type="text"
                  placeholder="e.g. fvq6jahr7r.asia-southeast1.gcp.clickhouse.cloud"
                  value={chHost}
                  onChange={(e) => setChHost(e.target.value)}
                  className="w-full bg-[var(--panel-input)] border border-[var(--line)] px-2.5 py-1.5 text-[var(--ink-bright)] placeholder-[var(--muted-dim)] focus:outline-none focus:border-[var(--accent)] font-mono-tech text-xs mt-1 transition-colors"
                />
              </div>
              <div>
                <label className="text-[var(--muted)] font-mono-tech text-[9px] uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  value={chUser}
                  onChange={(e) => setChUser(e.target.value)}
                  className="w-full bg-[var(--panel-input)] border border-[var(--line)] px-2.5 py-1.5 text-[var(--ink-bright)] placeholder-[var(--muted-dim)] focus:outline-none focus:border-[var(--accent)] font-mono-tech text-xs mt-1 transition-colors"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[var(--muted)] font-mono-tech text-[9px] uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  placeholder="ClickHouse Password"
                  value={chPassword}
                  onChange={(e) => setChPassword(e.target.value)}
                  className="w-full bg-[var(--panel-input)] border border-[var(--line)] px-2.5 py-1.5 text-[var(--ink-bright)] placeholder-[var(--muted-dim)] focus:outline-none focus:border-[var(--accent)] font-mono-tech text-xs mt-1 transition-colors"
                />
              </div>
            </div>
            
            <div className="p-3 border border-[var(--line)] bg-[var(--panel-card)] text-[10px] font-mono-tech text-[var(--muted)] flex items-start gap-2.5">
              <Server className="h-3.5 w-3.5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                Connects directly to pre-configured <strong>ClickHouse Cloud GCP</strong> cluster with 30,000+ seeded records across box office revenue, CDN QoS telemetry, and audience reviews.
              </span>
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-[var(--line)] flex items-center justify-end gap-3 bg-[var(--panel-card)]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--muted)] hover:text-[var(--ink)] text-[10px] font-mono-tech uppercase tracking-wider transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--ink-bright)] text-[var(--paper)] hover:bg-[var(--accent)] text-[10px] font-mono-tech uppercase tracking-wider font-semibold transition-all"
          >
            {saved ? (
              <>
                <Check className="h-3 w-3 text-emerald-600" />
                <span>Saved</span>
              </>
            ) : (
              <span>Save & Apply ↘</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
