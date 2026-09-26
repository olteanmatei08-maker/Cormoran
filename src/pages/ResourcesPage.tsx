import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText,
  ExternalLink,
  Eye,
  X,
  Download,
} from 'lucide-react';
import {
  DriveResourceFile,
  getCachedDriveFiles,
  fetchLiveDriveFolderFiles,
} from '../services/driveResourcesService';

const PRIORITY_ORDER = [
  'carnet de progres',
  'carnet de brevete',
  'carnet cu rugaciuni',
  'carnet cercetas ales',
  'ceremonial acm',
];

function sortResources(list: DriveResourceFile[]): DriveResourceFile[] {
  return [...list].sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    const idxA = PRIORITY_ORDER.findIndex((p) => nameA.includes(p));
    const idxB = PRIORITY_ORDER.findIndex((p) => nameB.includes(p));
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.name.localeCompare(b.name, 'ro');
  });
}

export const ResourcesPage: React.FC = () => {
  // Instant load from localStorage
  const [files, setFiles] = useState<DriveResourceFile[]>(() => sortResources(getCachedDriveFiles()));
  const [activeFile, setActiveFile] = useState<DriveResourceFile | null>(null);

  // Auto-sync function
  const refreshFiles = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      const updated = await fetchLiveDriveFolderFiles();
      if (updated && updated.length > 0) {
        setFiles(sortResources(updated));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  // Exact 60 seconds auto-refresh loop (files appear/disappear if modified in folder)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshFiles();
    }, 60000);
    return () => clearInterval(interval);
  }, [refreshFiles]);

  const sortedFiles = useMemo(() => sortResources(files), [files]);

  return (
    <div className="space-y-4 max-w-4xl mx-auto py-2">
      {/* File list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {sortedFiles.map((file) => {
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
                  <span>Deschide</span>
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
