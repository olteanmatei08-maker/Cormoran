import React from 'react';
import {
  Shield,
  Heart,
  Users,
  Compass,
  Scroll,
  Mountain,
  ExternalLink,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const dimensions = [
    {
      title: 'Natura',
      desc: 'Locul desfășurării tuturor activităţilor.',
      icon: Mountain,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40 border-emerald-800/50',
    },
    {
      title: 'Patrula',
      desc: 'Unitatea de bază a cercetășiei.',
      icon: Users,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40 border-emerald-800/50',
    },
    {
      title: 'Legea',
      desc: 'Ghid al comportamentului cercetășesc.',
      icon: Scroll,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40 border-emerald-800/50',
    },
    {
      title: 'Promisiunea',
      desc: 'Promisiune făcută în mod liber.',
      icon: Heart,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40 border-emerald-800/50',
    },
    {
      title: 'Spiritul civic',
      desc: 'Promovarea responsabilității față de comunitate.',
      icon: Shield,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40 border-emerald-800/50',
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {/* Header Ramura Verde */}
      <section className="text-center space-y-4 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>12 – 17 ani</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-serif-title">
            Ramura Verde
          </h1>
          <div className="flex items-center justify-center text-base sm:text-lg font-serif-title">
            <span className="text-emerald-400 font-semibold italic">Totdeauna gata!</span>
          </div>
        </div>
      </section>

      {/* Continut Principal Ramura Verde */}
      <section className="p-7 sm:p-10 rounded-2xl bg-[#0c1017] border border-slate-800 shadow-xl space-y-8">
        <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-light">
          Ramura verde este constituită din cercetașe și cercetași şi se adresează tinerilor cu vârsta cuprinsă între <span className="text-white font-semibold">12 şi 17 ani</span>.
        </p>

        {/* Cele 5 Dimensiuni */}
        <div className="space-y-3.5">
          <h2 className="text-sm uppercase tracking-widest font-bold text-slate-400">
            Cele cinci dimensiuni care definesc cadrul jocului cercetăşesc:
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {dimensions.map((dim) => {
              const Icon = dim.icon;
              return (
                <div
                  key={dim.title}
                  className={`p-4 rounded-xl border ${dim.bg} space-y-1.5 transition-all`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${dim.color}`} />
                    <h3 className="text-sm font-bold text-white font-serif-title">
                      {dim.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    {dim.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Patrula și Trupa */}
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3.5">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-emerald-400 shrink-0" />
            <h3 className="text-base sm:text-lg font-bold text-white font-serif-title">
              Patrula și Trupa
            </h3>
          </div>

          <div className="space-y-3 text-slate-300 text-sm sm:text-base leading-relaxed font-light">
            <p>
              <strong className="text-white font-semibold">Patrula</strong> este formată din 5-8 membri, are un Șef și un Asistent de Patrulă, un steag, un strigăt şi un caiet de aur în care sunt notate amintirile patrulei de la activitățile la care participă.
            </p>
            <p>
              În momentul în care într-un grup există două sau mai multe patrule, se formează o <strong className="text-white font-semibold">trupă</strong> care este condusă la rândul ei de un Șef de Trupă ajutat de doi sau mai mulți asistenți.
            </p>
          </div>
        </div>

        {/* Link Site Patrulă */}
        <div className="pt-2 flex justify-center">
          <a
            href="https://sites.google.com/view/patrulacormoran/patrula-cormo"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 active:scale-95 border border-emerald-500/70 text-white font-bold text-sm sm:text-base tracking-wide shadow-lg shadow-emerald-950/80 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5 text-center group"
          >
            <span>Vezi site-ul patrulei</span>
            <ExternalLink className="w-4 h-4 text-emerald-300 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </section>
    </div>
  );
};
