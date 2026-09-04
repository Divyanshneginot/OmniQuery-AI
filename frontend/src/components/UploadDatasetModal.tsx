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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm animate-fadeIn text-xs">
      <div className="bg-white dark:bg-[#141620] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="bg-slate-50/50 dark:bg-[#161824] px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Ingest Custom Studio Dataset
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Drag and drop CSV, Parquet, or JSON to query in ClickHouse
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close upload modal"
            className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 p-1 transition-colors rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {!uploadedResult ? (
            <>
              {/* Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : file
                    ? 'border-emerald-500/60 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-[#161824] hover:bg-slate-100/60 dark:hover:bg-[#1a1c2b] hover:border-indigo-400 dark:hover:border-indigo-500/60'
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
                    <FileSpreadsheet className="h-10 w-10 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{file.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {(file.size / 1024).toFixed(1)} KB • Ready for ClickHouse Engine
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-12 w-12 rounded-2xl bg-white dark:bg-[#181a26] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shadow-2xs">
                      <UploadCloud className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Drop dataset file here or browse</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                        Supports .csv, .parquet, .json (Up to 50MB)
                      </p>
                    </div>
                  </>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-2 text-[11px]">
                  <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </>
          ) : (
            /* Upload Success Preview */
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                  <Check className="h-4 w-4" />
                  <span>Ingested into ClickHouse table: {uploadedResult.table_name}</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 pl-6">
                  <p>• Total Rows: <strong className="text-slate-900 dark:text-white">{uploadedResult.row_count.toLocaleString()}</strong></p>
                  <p>• Columns ({uploadedResult.columns.length}): <span className="font-mono text-indigo-600 dark:text-indigo-400">{uploadedResult.columns.join(', ')}</span></p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50/50 dark:bg-[#161824] px-6 py-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-medium transition-colors"
          >
            Close
          </button>

          {!uploadedResult ? (
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 text-white font-semibold text-xs transition-all disabled:opacity-40 shadow-2xs"
            >
              {uploading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Ingesting Table...</span>
                </>
              ) : (
                <>
                  <span>Ingest Table</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#181a26] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium"
              >
                Upload Another
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <span>Query Now</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

