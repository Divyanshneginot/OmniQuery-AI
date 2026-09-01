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
      const res = await fetch('http://localhost:8000/api/dataset/upload', {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn text-xs font-mono">
      <div className="cinema-glass rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-white/[0.08]">
        
        {/* Header */}
        <div className="bg-zinc-950/90 px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shadow-md">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                Ingest Custom Studio Dataset
              </h3>
              <p className="text-[11px] text-zinc-400 font-sans">
                Drag and drop CSV, Parquet, or JSON to query in ClickHouse
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 p-1 transition-colors">
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
                    ? 'border-cyan-400 bg-cyan-950/30'
                    : file
                    ? 'border-emerald-500/60 bg-emerald-950/20'
                    : 'border-zinc-700/80 bg-zinc-950/50 hover:bg-zinc-900/60 hover:border-cyan-500/40'
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
                    <FileSpreadsheet className="h-10 w-10 text-emerald-400 animate-bounce" />
                    <div>
                      <p className="font-bold text-white text-sm">{file.name}</p>
                      <p className="text-[10px] text-zinc-400 mt-1">
                        {(file.size / 1024).toFixed(1)} KB • Ready for ClickHouse Engine
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                      <UploadCloud className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-200 text-xs">Drop dataset file here or browse</p>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Supports .csv, .parquet, .json (Up to 50MB)
                      </p>
                    </div>
                  </>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 flex items-center gap-2 text-[11px] backdrop-blur-md">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </>
          ) : (
            /* Upload Success Preview */
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Check className="h-4 w-4" />
                  <span>Ingested into ClickHouse table: {uploadedResult.table_name}</span>
                </div>
                <div className="text-[11px] text-zinc-300 space-y-1 pl-6">
                  <p>• Total Rows: <strong className="text-white">{uploadedResult.row_count.toLocaleString()}</strong></p>
                  <p>• Columns ({uploadedResult.columns.length}): <span className="text-cyan-300">{uploadedResult.columns.join(', ')}</span></p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-zinc-950/90 px-6 py-3.5 border-t border-white/[0.08] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Close
          </button>

          {!uploadedResult ? (
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold transition-all disabled:opacity-40 shadow-lg shadow-cyan-500/20"
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
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
              >
                Upload Another
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
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

