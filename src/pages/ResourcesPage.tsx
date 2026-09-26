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
  RefreshCw,
  Plus,
  CheckCircle2,
  CloudLightning,
} from 'lucide-react';
import {
  syncGoogleAccountData,
  USER_EMAIL_HINT,
} from '../services/googleSyncService';

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

// Priority sorting order:
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

// Strictly filter out any old broken sample/dummy placeholders
function cleanDummyResources(items: DriveResource[]): DriveResource[] {
  if (!Array.isArray(items)) return [];
  return items.filter((r) => {
    const url = String(r.driveUrl || '');
    const id = String(r.id || '');
    return !url.includes('1sample-') && !id.startsWith('res-1') && !id.startsWith('res-2') && !id.startsWith('res-3');
  });
}

function getStoredResources(): DriveResource[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: DriveResource[] = JSON.parse(raw);
      const cleaned = cleanDummyResources(parsed);
      return sortResources(cleaned);
    }
  } catch {
    // Ignore parse error
  }
  return [];
}

export const ResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<DriveResource[]>(getStoredResources);
  const [previewResource, setPreviewResource] = useState<DriveResource | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncErr, setSyncErr] = useState<string | null>(null);

  // Manual link addition modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Fetch real resources persisted on the server (works across all devices and phones)
  const fetchServerResources = async () => {
    try {
      const res = await fetch('/api/resources');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.resources)) {
          const cleaned = cleanDummyResources(data.resources);
          const sorted = sortResources(cleaned);
          setResources(sorted);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
        }
      }
    } catch (err) {
      console.warn('Eroare preluare resurse:', err);
    }
  };

  useEffect(() => {
    fetchServerResources();

    const handleUpdated = (e: any) => {
      if (Array.isArray(e.detail)) {
        const cleaned = cleanDummyResources(e.detail);
        setResources(sortResources(cleaned));
      }
    };
    window.addEventListener('cormo_resources_updated', handleUpdated);
    return () => window.removeEventListener('cormo_resources_updated', handleUpdated);
  }, []);

  const handleSyncGoogle = async () => {
    setSyncing(true);
    setSyncErr(null);
    setSyncMsg(null);

    try {
      const res = await syncGoogleAccountData();
      setSyncMsg(`Sincronizat! S-au preluat ${res.resourcesCount} documente din Google Drive.`);
      fetchServerResources();
      setTimeout(() => setSyncMsg(null), 4000);
    } catch (err: any) {
      setSyncErr(err?.message || 'Eroare la conectarea cu Google Drive.');
      setTimeout(() => setSyncErr(null), 5000);
    } finally {
      setSyncing(false);
    }
  };

  const handleAddManualResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    let type: DriveResource['type'] = 'doc';
    const u = newUrl.toLowerCase();
    if (u.includes('spreadsheets')) type = 'sheet';
    else if (u.includes('presentation')) type = 'slides';
    else if (u.includes('drive.google.com/drive/folders')) type = 'folder';
    else if (u.endsWith('.pdf')) type = 'pdf';

    const item: DriveResource = {
      id: `manual-${Date.now()}`,
      title: newTitle.trim(),
      driveUrl: newUrl.trim(),
      category: 'diverse',
      type,
      description: newDesc.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updated = sortResources([item, ...resources]);
    setResources(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    try {
      await fetch('/api/resources/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resources: updated }),
      });
    } catch {
      // server save fallback
    }

    setNewTitle('');
    setNewUrl('');
    setNewDesc('');
    setIsAddOpen(false);
  };

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
    <div className="space-y-5 max-w-4xl mx-auto py-2">
      {/* Top Header & Sync Action */}
      <section className="p-4 sm:p-5 rounded-2xl bg-[#0c1017] border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider font-serif-title">
            Documente & Resurse
          </h2>
          <span className="text-xs text-blue-400 block">
            Google Drive · {USER_EMAIL_HINT}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Adaugă un link de document Google"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Adaugă Document</span>
          </button>

          <button
            onClick={handleSyncGoogle}
            disabled={syncing}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-md disabled:opacity-50"
            title="Sincronizează fișierele din contul Google Drive"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Se importă...' : 'Sincronizează Drive'}</span>
          </button>
        </div>
      </section>

      {/* Sync feedback alerts */}
      {syncMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-600 rounded-xl text-emerald-200 text-xs flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncMsg}</span>
        </div>
      )}

      {syncErr && (
        <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-200 text-xs flex items-center gap-2">
          <CloudLightning className="w-4 h-4 text-red-400 shrink-0" />
          <span>{syncErr}</span>
        </div>
      )}

      {/* Direct List of Real Files */}
      {resources.length > 0 ? (
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
                  className="px-3.5 py-1.5 rounded-lg bg-blue-950/60 border border-blue-700/60 text-blue-300 hover:bg-blue-900/60 flex items-center gap-1.5 transition-colors"
                >
                  <span>Deschide în Drive</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 sm:p-12 text-center bg-[#0c1017] rounded-2xl border border-slate-800 space-y-4">
          <FolderOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <p className="text-white font-bold text-base sm:text-lg">
              Niciun document încărcat încă din Google Drive
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Fișierele reale din contul Google ({USER_EMAIL_HINT}) nu au fost încă sincronizate.
              Apasă pe butonul de mai jos pentru a le importa o singură dată; acestea vor rămâne disponibile permanent pe orice telefon sau dispozitiv.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleSyncGoogle}
              disabled={syncing}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Se importă fișierele...' : 'Importă din Google Drive'}</span>
            </button>

            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Adaugă Link Manual</span>
            </button>
          </div>
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
                  className="px-3 py-1.5 rounded-lg bg-blue-950 border border-blue-700 text-blue-200 text-xs flex items-center gap-1.5"
                >
                  <span>Deschide complet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setPreviewResource(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  aria-label="Închide"
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

      {/* ADD RESOURCE MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c1017] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Adaugă Document Google</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-white p-1"
                aria-label="Închide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddManualResource} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Titlu Document:
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="ex: Carnet de Progres Patrulă"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Link Google Docs / Drive:
                </label>
                <input
                  type="url"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://docs.google.com/document/d/..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descriere (Opțional):
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detalii scurte despre document..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-xs text-slate-400 hover:text-white border border-slate-800"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md"
                >
                  Salvează Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
