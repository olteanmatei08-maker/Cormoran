import React, { useState } from 'react';
import { CormorantEmblem } from '../components/CormorantEmblem';
import {
  PATROL_TESTAMENT,
  PATROL_HISTORY,
  PATROL_LEADERS,
} from '../data/patrolData';
import { Search } from 'lucide-react';

function getPatrolYears(): number {
  const today = new Date();
  const currentYear = today.getFullYear();
  // Month is 0-indexed: October is 9
  const hasPassedOct5 =
    today.getMonth() > 9 || (today.getMonth() === 9 && today.getDate() >= 5);
  return hasPassedOct5 ? currentYear - 2002 : currentYear - 2002 - 1;
}

export const HomePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const patrolYears = getPatrolYears();

  const filteredLeaders = PATROL_LEADERS.filter((l) =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.period.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-16 max-w-4xl mx-auto py-4">
      {/* App Header & Cormorant Bird Emblem */}
      <section className="min-h-[calc(100vh-14rem)] sm:min-h-[calc(100vh-16rem)] flex flex-col justify-center items-center text-center space-y-6 pt-4 pb-12">
        <div className="flex justify-center">
          <CormorantEmblem size="xl" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-serif-title uppercase">
            Patrula Cormoran
          </h1>
          <p className="text-sm sm:text-base text-slate-400 font-medium">
            Cercetașii Munților
          </p>
          <p className="text-xs text-slate-500 font-medium tracking-wide">
            {patrolYears} de ani de activitate
          </p>
        </div>
      </section>

      {/* Testament */}
      <section className="p-8 sm:p-10 rounded-2xl bg-[#0c1017] border border-slate-800 shadow-xl space-y-6">
        <h2 className="text-2xl font-bold text-white font-serif-title pb-4 border-b border-slate-800">
          {PATROL_TESTAMENT.title}
        </h2>

        <div className="space-y-5 text-slate-300 text-base sm:text-lg leading-relaxed font-light">
          <p>{PATROL_TESTAMENT.text1}</p>
          <p>{PATROL_TESTAMENT.text2}</p>
          <p className="text-white font-normal italic">
            „{PATROL_TESTAMENT.text3}”
          </p>
        </div>

        <div className="pt-4 border-t border-slate-800/80 text-right">
          <span className="text-sm sm:text-base font-semibold text-slate-200">
            — {PATROL_TESTAMENT.author}
          </span>
        </div>
      </section>

      {/* Scurt istoric */}
      <section className="p-8 sm:p-10 rounded-2xl bg-[#0c1017] border border-slate-800 shadow-xl space-y-5">
        <h2 className="text-2xl font-bold text-white font-serif-title pb-4 border-b border-slate-800">
          {PATROL_HISTORY.title}
        </h2>

        <div className="space-y-4 text-slate-300 text-base sm:text-lg leading-relaxed font-light">
          <p>{PATROL_HISTORY.paragraph1}</p>
          <p>{PATROL_HISTORY.paragraph2}</p>
        </div>
      </section>

      {/* Istoric șefi · Cormoran */}
      <section className="p-8 sm:p-10 rounded-2xl bg-[#0c1017] border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <h2 className="text-2xl font-bold text-white font-serif-title">
            Istoric șefi · Cormoran
          </h2>

          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Caută în istoric..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-800/80">
          {filteredLeaders.map((leader) => (
            <div
              key={leader.name + leader.period}
              className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-3">
                  <span className="text-base sm:text-lg font-bold text-white">
                    {leader.name}
                  </span>
                  {leader.isCurrent && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-600 text-white">
                      ACTUAL
                    </span>
                  )}
                </div>
              </div>

              <div className="text-sm sm:text-base font-medium text-slate-400 font-mono shrink-0">
                {leader.period}
              </div>
            </div>
          ))}
        </div>

        {filteredLeaders.length === 0 && (
          <div className="text-center py-6 text-slate-500 text-sm">
            Niciun rezultat găsit.
          </div>
        )}
      </section>
    </div>
  );
};
