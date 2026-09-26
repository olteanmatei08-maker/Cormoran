import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  ExternalLink,
  Eye,
  X,
  RefreshCw,
  Download,
} from 'lucide-react';
import {
  DriveResourceFile,
  getCachedDriveFiles,
  fetchLiveDriveFolderFiles,
} from '../services/driveResourcesService';

export const ResourcesPage: React.FC = () => {
  // Instant load from localStorage
  const [files, setFiles] = useState<DriveResourceFile[]>(getCachedDriveFiles);
  const [activeFile, setActiveFile] = useState<DriveResourceFile | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-sync function
  const refreshFiles = useCallback(async (showIndicator = false) => {
    if (!navigator.onLine) return;
    try {
      if (showIndicator) setLoading(true);
      const updated = await fetchLiveDriveFolderFiles();
      if (updated && updated.length > 0) {
        setFiles(updated);
      }
    } finally {
      if (showIndicator) setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    refreshFiles(false);
  }, [refreshFiles]);

  // Exact 60 seconds auto-refresh loop (files appear/disappear if modified in folder)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshFiles(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [refreshFiles]);

  return (
    <div className="space-y-4 max-w-4xl mx-auto py-2">
      {/* File list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {files.map((file) => {
          const cleanTitle = file.name.replace(/\.pdf$/i, '').trim();

          return (
            <div
              key={file.id}
              className="p-5 rounded-3xl bg-[#0c1017] border border-slate-800 hover:border-slate-700 shadow-xl flex flex-col justify-between space-y-4 transition-all"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                  <FileText className="w-6 h-6 text-slate-400" />
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <h2 className="text-base font-bold text-white tracking-wide truncate">
                    {cleanTitle}
                  </h2>
                  {file.size && (
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      {file.size}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => setActiveFile(file)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Eye className="w-4 h-4 text-slate-300" />
                  <span>Aplicație</span>
                </button>

                <a
                  href={file.webViewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Browser</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Direct in-app preview modal */}
      {activeFile && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-5">
          <div className="w-full max-w-4xl h-[94vh] bg-[#0c1017] border border-slate-800 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
            {/* Modal header */}
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 truncate">
                <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {activeFile.name.replace(/\.pdf$/i, '')}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={activeFile.webViewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span className="hidden sm:inline">Deschide în</span> Browser
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>

                {activeFile.downloadUrl && (
                  <a
                    href={activeFile.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
                    title="Descarcă"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}

                <button
                  onClick={() => setActiveFile(null)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer transition-colors"
                  aria-label="Închide"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Embedded viewer frame */}
            <div className="flex-1 bg-black relative">
              <iframe
                src={activeFile.directViewLink}
                className="w-full h-full border-0"
                title={activeFile.name}
                allow="autoplay"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
