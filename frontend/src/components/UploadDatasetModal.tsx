import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileSpreadsheet, Check, AlertCircle, RefreshCw, ArrowRight, Database } from 'lucide-react';

interface UploadDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (tableName: string) => void;
}

export const UploadDatasetModal: React.FC<UploadDatasetModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedResult, setUploadedResult] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '');
      const res = await fetch(`${apiBase}/dataset/upload`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Upload failed');
      }

      const data = await res.json();
      setUploadedResult(data.dataset);
      onUploadSuccess(data.dataset.table_name);
    } catch (err: any) {
      setError(err.message || 'Failed to upload dataset');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setUploadedResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn text-xs">
      <div className="bg-[var(--panel)] border border-[var(--line)] w-full max-w-lg shadow-2xl text-[var(--ink)]">
        
        {/* Header */}
        <div className="bg-[var(--panel-card)] px-5 py-4 border-b border-[var(--line)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-[var(--line)] text-[var(--accent)] bg-[var(--panel-input)]">
              <Database className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[var(--ink-bright)] uppercase tracking-wider font-mono-tech">
                Ingest Custom Studio Dataset
              </h3>
              <p className="text-[10px] text-[var(--muted)] font-mono-tech mt-0.5">
                Drop CSV, Parquet, or JSON to load into ClickHouse
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close upload modal"
            className="text-[var(--muted)] hover:text-[var(--ink-bright)] p-1.5 transition-colors border border-transparent hover:border-[var(--line)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          
          {!uploadedResult ? (
            <>
              {/* Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  dragActive
                    ? 'border-[var(--accent)] bg-[var(--accent-muted)]'
                    : file
                    ? 'border-[var(--success)] bg-[var(--success)]/10'
                    : 'border-[var(--line-strong)] bg-[var(--panel-card)] hover:border-[var(--accent)] hover:bg-[var(--panel-input)]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.parquet,.json,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {file ? (
                  <>
                    <FileSpreadsheet className="h-8 w-8 text-[var(--success)] animate-pulse" />
                    <div>
                      <p className="font-medium text-[var(--ink-bright)] text-sm font-mono-tech">{file.name}</p>
                      <p className="text-[10px] text-[var(--muted)] font-mono-tech mt-1">
                        {(file.size / 1024).toFixed(1)} KB · READY FOR CLICKHOUSE
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 border border-[var(--line)] bg-[var(--panel-input)] text-[var(--accent)]">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-mono-tech text-[11px] uppercase tracking-wider text-[var(--ink-bright)]">Drop dataset file here or click</p>
                      <p className="text-[10px] text-[var(--muted)] font-mono-tech mt-1">
                        Supports .csv, .parquet, .json (Up to 50MB)
                      </p>
                    </div>
                  </>
                )}
              </div>

              {error && (
                <div className="p-3 border border-[var(--coral)]/40 bg-[var(--coral-muted)] text-[var(--coral)] flex items-center gap-2 text-[10px] font-mono-tech">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </>
          ) : (
            /* Upload Success Preview */
            <div className="space-y-3">
              <div className="p-4 border border-[var(--success)]/40 bg-[var(--success)]/10 space-y-2 font-mono-tech">
                <div className="flex items-center gap-2 text-[var(--success)] font-semibold text-xs">
                  <Check className="h-3.5 w-3.5" />
                  <span>INGESTED INTO CLICKHOUSE TABLE: {uploadedResult.table_name}</span>
                </div>
                <div className="text-[10px] text-[var(--ink)] space-y-1 pl-5">
                  <p>• Rows: <strong>{uploadedResult.row_count.toLocaleString()}</strong></p>
                  <p>• Columns ({uploadedResult.columns.length}): <span className="text-[var(--accent)]">{uploadedResult.columns.join(', ')}</span></p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[var(--panel-card)] px-5 py-3.5 border-t border-[var(--line)] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--muted)] hover:text-[var(--ink)] text-[10px] font-mono-tech uppercase tracking-wider transition-colors"
          >
            Close
          </button>

          {!uploadedResult ? (
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--ink-bright)] text-[var(--paper)] hover:bg-[var(--accent)] font-mono-tech text-[10px] uppercase tracking-wider font-semibold transition-all disabled:opacity-30"
            >
              {uploading ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Ingesting...</span>
                </>
              ) : (
                <>
                  <span>Ingest Table</span>
                  <ArrowRight className="h-3 w-3" />
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-3 py-1.5 border border-[var(--line)] hover:border-[var(--line-strong)] bg-[var(--panel-input)] text-[var(--muted)] hover:text-[var(--ink)] text-[10px] font-mono-tech uppercase tracking-wider"
              >
                Upload Another
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-[var(--accent)] text-[var(--paper)] font-mono-tech text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5"
              >
                <span>Query Now ↘</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

