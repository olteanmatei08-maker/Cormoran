import React, { useState, useEffect } from 'react';
import {
  FileText,
  ExternalLink,
  Eye,
  X,
  FileSpreadsheet,
  Presentation,
  Folder,
  FileCode,
  FolderOpen,
} from 'lucide-react';

export interface DriveResource {
  id: string;
  title: string;
  driveUrl: string;
  category: 'tehnici' | 'cantice' | 'tabere' | 'regulament' | 'diverse';
  type: 'doc' | 'sheet' | 'slides' | 'pdf' | 'folder' | 'other';
  description?: string;
  createdAt: string;
}

const STORAGE_KEY = 'cormo_patrol_drive_resources';

// Priority sorting order requested:
// 1. Carnet de progres
// 2. Carnet de brevet
// 3. Ceremonial
// 4. Carnet de rugăciuni
// 5. Carnet cercetaș ales
function getOrderPriority(title: string): number {
  const t = (title || '').toLowerCase();
  if (t.includes('progres')) return 1;
  if (t.includes('brevet')) return 2;
  if (t.includes('ceremonial')) return 3;
  if (t.includes('rugaciun') || t.includes('rugăciun')) return 4;
  if (t.includes('ales')) return 5;
  return 99;
}

function sortResources(items: DriveResource[]): DriveResource[] {
  return [...items].sort((a, b) => getOrderPriority(a.title) - getOrderPriority(b.title));
}

// Filter out initial sample files: "caiet de cantece", "ghid noduri", "fisa inscriere"
function isSampleFile(r: DriveResource): boolean {
  if (r.id === 'res-1' || r.id === 'res-2' || r.id === 'res-3') return true;
  const lower = (r.title || '').toLowerCase();
  return (
    lower.includes('caietul de cântece') ||
    lower.includes('caiet de cantece') ||
    lower.includes('ghid noduri') ||
    lower.includes('ghid tehnici') ||
    lower.includes('fișă înscriere') ||
    lower.includes('fisa inscriere') ||
    lower.includes('tabel echipament')
  );
}

const DEFAULT_RESOURCES: DriveResource[] = [
  {
    id: 'res-progres',
    title: 'Carnet de Progres',
    driveUrl: 'https://docs.google.com/document/d/1sample-progres',
    category: 'tehnici',
    type: 'doc',
    description: 'Etapele de progres și obiectivele de dezvoltare personală ale cercetașului.',
    createdAt: '2026-09-24',
  },
  {
    id: 'res-brevet',
    title: 'Carnet de Brevet',
    driveUrl: 'https://docs.google.com/document/d/1sample-brevet',
    category: 'tehnici',
    type: 'doc',
    description: 'Cerințe, probe și validări pentru obținerea brevetelor de specialitate.',
    createdAt: '2026-09-24',
  },
  {
    id: 'res-ceremonial',
    title: 'Ceremonial',
    driveUrl: 'https://docs.google.com/document/d/1sample-ceremonial',
    category: 'regulament',
    type: 'doc',
    description: 'Tradiții, protocoale oficiale, promisiunea și legile cercetășești.',
    createdAt: '2026-09-24',
  },
  {
    id: 'res-rugaciuni',
    title: 'Carnet de Rugăciuni',
    driveUrl: 'https://docs.google.com/document/d/1sample-rugaciuni',
    category: 'diverse',
    type: 'doc',
    description: 'Rugăciunile patrulei și momentele de reculegere la foc și drapel.',
    createdAt: '2026-09-24',
  },
  {
    id: 'res-cercetas-ales',
    title: 'Carnet Cercetaș Ales',
    driveUrl: 'https://docs.google.com/document/d/1sample-ales',
    category: 'regulament',
    type: 'doc',
    description: 'Ghidul și criteriile de merit pentru distincția Cercetaș Ales.',
    createdAt: '2026-09-24',
  },
];

function getStoredResources(): DriveResource[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RESOURCES));
      return DEFAULT_RESOURCES;
    }
    const parsed: DriveResource[] = JSON.parse(raw);
    const cleaned = parsed.filter((r) => !isSampleFile(r));

    if (cleaned.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RESOURCES));
      return DEFAULT_RESOURCES;
    }

    const sorted = sortResources(cleaned);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    return sorted;
  } catch {
    return DEFAULT_RESOURCES;
  }
}

export const ResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<DriveResource[]>(getStoredResources);
  const [previewResource, setPreviewResource] = useState<DriveResource | null>(null);

  useEffect(() => {
    const current = getStoredResources();
    setResources(current);
  }, []);

  const getEmbedUrl = (url: string) => {
    if (url.includes('docs.google.com') || url.includes('drive.google.com')) {
      if (url.includes('/edit')) return url.replace('/edit', '/preview');
      if (url.includes('/view')) return url.replace('/view', '/preview');
      if (!url.includes('/preview')) return `${url}${url.includes('?') ? '&' : '?'}embedded=true`;
    }
    return url;
  };

  const getTypeIcon = (type: DriveResource['type']) => {
    switch (type) {
      case 'doc':
        return <FileText className="w-5 h-5 text-sky-400" />;
      case 'sheet':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case 'slides':
        return <Presentation className="w-5 h-5 text-amber-400" />;
      case 'folder':
        return <Folder className="w-5 h-5 text-yellow-400" />;
      case 'pdf':
        return <FileCode className="w-5 h-5 text-red-400" />;
      default:
        return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto py-2">
      {/* Direct List of Files Ordered as Requested */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {resources.map((res) => (
          <div
            key={res.id}
            className="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 hover:border-slate-700 shadow-md space-y-3 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                    {getTypeIcon(res.type)}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white line-clamp-2">
                      {res.title}
                    </h3>
                  </div>
                </div>
              </div>

              {res.description && (
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-light">
                  {res.description}
                </p>
              )}
            </div>

            {/* Action Buttons: Preview and Open in Drive */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
              <button
                onClick={() => setPreviewResource(res)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Previzualizează</span>
              </button>

              <a
                href={res.driveUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60 flex items-center gap-1.5 transition-colors"
              >
                <span>Deschide în Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {resources.length === 0 && (
        <div className="p-12 text-center bg-[#0c1017] rounded-2xl border border-slate-800 text-slate-400 space-y-3">
          <FolderOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-white font-semibold">Niciun document încărcat</p>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewResource && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="w-full max-w-4xl h-[85vh] bg-[#0c1017] border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 truncate">
                {getTypeIcon(previewResource.type)}
                <span className="text-sm sm:text-base font-bold text-white truncate">
                  {previewResource.title}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewResource.driveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-1.5"
                >
                  <span>Deschide complet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setPreviewResource(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-950 relative">
              <iframe
                src={getEmbedUrl(previewResource.driveUrl)}
                title={previewResource.title}
                className="w-full h-full border-0"
                allow="autoplay"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
