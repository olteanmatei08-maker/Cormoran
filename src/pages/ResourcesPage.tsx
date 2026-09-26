import React, { useState } from 'react';
import {
  BookOpen,
  ExternalLink,
  ChevronRight,
  Search,
  X,
  Award,
  Compass,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { CARNET_PROGRES_DATA } from '../data/carnetProgresData';
import { CARNET_BREVETE_CATEGORIES } from '../data/carnetBreveteData';

export const ResourcesPage: React.FC = () => {
  // Modal viewer state: null | 'progres' | 'brevete'
  const [activeReader, setActiveReader] = useState<'progres' | 'brevete' | null>(null);

  // Carnet de progres sub-view: section id
  const [selectedProgresSection, setSelectedProgresSection] = useState<string>('promisiunea');
  const [progresSearch, setProgresSearch] = useState('');

  // Carnet de brevete sub-view: category id
  const [selectedBrevetCat, setSelectedBrevetCat] = useState<string>('misiune');
  const [breveteSearch, setBreveteSearch] = useState('');

  const DRIVE_LINKS = {
    progres: 'https://drive.google.com/file/d/1hXqLPzMTk1vjCBAF78hn2kE1RF8JdtDa/view',
    brevete: 'https://docs.google.com/document/d/1dhh4k7Jns1cdKYgZ8PJtKGUzVQH6UOTd/edit',
  };

  const currentProgres = CARNET_PROGRES_DATA.sections.find(
    (s) => s.id === selectedProgresSection
  ) || CARNET_PROGRES_DATA.sections[0];

  const currentBrevetCategory = CARNET_BREVETE_CATEGORIES.find(
    (c) => c.id === selectedBrevetCat
  ) || CARNET_BREVETE_CATEGORIES[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Header */}
      <section className="p-6 rounded-2xl bg-[#0c1017] border border-slate-800 shadow-xl space-y-2">
        <h1 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-wider font-serif-title">
          Resurse & Carnete Oficiale
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Documentele fundamentale ale patrulei pentru progresul cercetășesc și dobândirea brevetelor de specialitate.
        </p>
      </section>

      {/* Exactly the 2 requested documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Carnet de progres (primul fisier) */}
        <div className="p-6 rounded-2xl bg-[#0c1017] border border-emerald-500/30 hover:border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.08)] transition-all flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                Primul fișier · Document de bază
              </span>
              <BookOpen className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-white font-serif-title">
                Carnet de progres
              </h2>
              <p className="text-xs text-emerald-400 font-medium">
                Poteci și probe: Promisiune · Clasa a II-a · Clasa I
              </p>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-light">
              Ghidul complet al etapelor de formare cercetășească: MIBP (Minimum Internațional Baden-Powell), probe personalizate pe potecile Albă, Galbenă, Roșie, Albastră și Verde, precum și regulile raidurilor de patrulă.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              onClick={() => setActiveReader('progres')}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/60"
            >
              <BookOpen className="w-4 h-4" />
              <span>Citește în aplicație</span>
            </button>

            <a
              href={DRIVE_LINKS.progres}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              title="Deschide PDF-ul original pe Google Drive"
            >
              <span>Google Drive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 2. Carnet de brevete (al doilea fisier) */}
        <div className="p-6 rounded-2xl bg-[#0c1017] border border-blue-500/30 hover:border-blue-500/60 shadow-[0_0_20px_rgba(37,99,235,0.08)] transition-all flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-950 text-blue-400 border border-blue-800/60">
                Al doilea fișier · Specialități
              </span>
              <Award className="w-5 h-5 text-blue-400" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-white font-serif-title">
                Carnet de brevete
              </h2>
              <p className="text-xs text-blue-400 font-medium">
                Caiet de brevete ACM · Toate domeniile cercetășești
              </p>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-light">
              Toate cerințele și probele pentru brevetele de merit: Misiune, Liturghist, Campism, Bucătar, Fochist, Inginer constructor, Orientare, Sanitar, Topograf, Alpinist, Meteorolog, Botanist, Animator și multe altele.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              onClick={() => setActiveReader('brevete')}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-950/60"
            >
              <Award className="w-4 h-4" />
              <span>Citește în aplicație</span>
            </button>

            <a
              href={DRIVE_LINKS.brevete}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              title="Deschide documentul pe Google Drive"
            >
              <span>Google Drive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* MODAL CITITOR 1: CARNET DE PROGRES */}
      {activeReader === 'progres' && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-6">
          <div className="w-full max-w-4xl h-[92vh] bg-[#0c1017] border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            {/* Top Bar */}
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 truncate">
                <BookOpen className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <h3 className="text-sm sm:text-base font-bold text-white truncate font-serif-title">
                    Carnet de Progres
                  </h3>
                  <span className="text-[11px] text-emerald-400 block truncate">
                    Asociația Cercetașii Munților
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={DRIVE_LINKS.progres}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-1.5 font-medium"
                >
                  <span className="hidden sm:inline">Deschide pe</span> Drive
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setActiveReader(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  aria-label="Închide"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs (Promisiune, Clasa II, Clasa I) */}
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
              {CARNET_PROGRES_DATA.sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => {
                    setSelectedProgresSection(sec.id);
                    setProgresSearch('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none ${
                    selectedProgresSection === sec.id
                      ? 'bg-emerald-900 border border-emerald-600 text-white shadow-md'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {sec.title}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Section Description */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-1">
                <h4 className="text-sm font-bold text-white">
                  {currentProgres.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  {currentProgres.description}
                </p>
              </div>

              {/* Poteci & Requirements */}
              <div className="space-y-6">
                {currentProgres.poteci.map((poteca, pIdx) => (
                  <div key={pIdx} className="space-y-3">
                    <h5 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <Compass className="w-4 h-4" />
                      <span>{poteca.name}</span>
                    </h5>

                    <div className="space-y-3">
                      {poteca.items.map((item, iIdx) => (
                        <div
                          key={iIdx}
                          className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                              {item.category || item.type}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                              {item.type}
                            </span>
                          </div>

                          <ul className="space-y-2 text-xs text-slate-300">
                            {item.requirements.map((req, rIdx) => (
                              <li key={rIdx} className="flex items-start gap-2.5 leading-relaxed">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CITITOR 2: CARNET DE BREVETE */}
      {activeReader === 'brevete' && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-6">
          <div className="w-full max-w-4xl h-[92vh] bg-[#0c1017] border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            {/* Top Bar */}
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 truncate">
                <Award className="w-5 h-5 text-blue-400 shrink-0" />
                <div className="truncate">
                  <h3 className="text-sm sm:text-base font-bold text-white truncate font-serif-title">
                    Caiet de Brevete
                  </h3>
                  <span className="text-[11px] text-blue-400 block truncate">
                    Asociația Cercetașii Munților 2017
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={DRIVE_LINKS.brevete}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-blue-950 border border-blue-800 text-blue-300 text-xs flex items-center gap-1.5 font-medium"
                >
                  <span className="hidden sm:inline">Deschide pe</span> Drive
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setActiveReader(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  aria-label="Închide"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Categories Navigation Bar */}
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
              {CARNET_BREVETE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedBrevetCat(cat.id);
                    setBreveteSearch('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none ${
                    selectedBrevetCat === cat.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-950/60'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Brevets Content List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-base font-bold text-white">
                  {currentBrevetCategory.name}
                </h4>
                <span className="text-xs text-slate-500 font-medium">
                  {currentBrevetCategory.brevets.length} brevete
                </span>
              </div>

              <div className="space-y-4">
                {currentBrevetCategory.brevets.map((b) => (
                  <div
                    key={b.id}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 px-2 py-0.5 rounded bg-blue-950 border border-blue-800/60">
                          {b.badgeCode}
                        </span>
                        <h5 className="text-base font-bold text-white">
                          {b.title}
                        </h5>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-light">
                      {b.summary}
                    </p>

                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Probe & Cerințe oficiale:
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {b.probes.map((probe, pIdx) => (
                          <li key={pIdx} className="flex items-start gap-2.5 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                            <span>{probe}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
