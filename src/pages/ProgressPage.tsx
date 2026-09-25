import React, { useEffect, useState } from 'react';
import {
  Compass,
  CheckCircle2,
  CloudCheck,
  Shield,
  Sparkles,
} from 'lucide-react';
import { AppUser } from '../services/authService';
import { VerifiedBadge } from '../components/VerifiedBadge';
import {
  UserProgressData,
  subscribeToUserProgress,
  getDefaultProgress,
} from '../services/progressService';

interface ProgressPageProps {
  currentUser?: AppUser | null;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({ currentUser }) => {
  const [progress, setProgress] = useState<UserProgressData>(() =>
    currentUser
      ? getDefaultProgress(currentUser.uid, currentUser.email || '', currentUser.displayName || '')
      : getDefaultProgress('guest')
  );
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid) return;

    setIsSynced(false);
    const unsubscribe = subscribeToUserProgress(
      currentUser.uid,
      currentUser.email || '',
      currentUser.displayName || '',
      (updatedData) => {
        setProgress(updatedData);
        setIsSynced(true);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid, currentUser?.email, currentUser?.displayName]);

  if (!currentUser) {
    return (
      <div className="py-12 text-center space-y-4">
        <Compass className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
        <h3 className="text-lg font-bold text-white">Conectează-te pentru a vedea progresul</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Progresul tău este legat în siguranță de contul tău Google în baza de date.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 min-h-[50vh]">
      {/* Scout Profile Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#090d14] border border-slate-800/80 shadow-xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Cercetaș'}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/60"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 font-bold text-xl ring-1 ring-emerald-500/20">
                  {(currentUser.displayName || currentUser.email || 'C')[0].toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 flex items-center justify-center pointer-events-none">
                <VerifiedBadge size="sm" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-lg font-bold text-white font-serif-title">
                  {currentUser.displayName || 'Cercetaș Cormoran'}
                </h3>
                <VerifiedBadge size="xs" />
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                  {progress.stage || 'Cercetaș'}
                </span>
              </div>
              <p className="text-xs text-slate-400">{currentUser.email}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {progress.patrolRole || 'Membru Patrula Cormoran'}
              </p>
            </div>
          </div>

          {/* Sync Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 self-start sm:self-auto">
            {isSynced ? (
              <>
                <CloudCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] font-semibold text-emerald-400">
                  Sincronizat în Firestore
                </span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                <span className="text-[11px] font-medium text-slate-400">Se sincronizează...</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cloud Persistence Notice */}
      <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 flex items-start gap-3">
        <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-emerald-300">
            Cont conectat la baza de date Firestore
          </h4>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Orice etapă, insignă sau progres pe care îl bifezi este salvat permanent în contul tău Google.
            Când te conectezi pe telefon, tabletă sau calculator, datele tale apar sincronizate instantaneu.
          </p>
        </div>
      </div>

      {/* Badges / Competente Container - Ready for user's detailed instructions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Insigne & Competențe Cercetășești</span>
          </h4>
          <span className="text-xs text-slate-400">
            {progress.badges?.filter((b) => b.status === 'obtinut').length || 0} din{' '}
            {progress.badges?.length || 6} obținute
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {progress.badges?.map((badge) => (
            <div
              key={badge.id}
              className="p-4 rounded-2xl bg-[#090d14] border border-slate-800/80 flex items-center justify-between gap-3 transition-colors hover:border-slate-700"
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-white block">{badge.name}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400/80">
                  {badge.category}
                </span>
              </div>

              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                  badge.status === 'obtinut'
                    ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                    : badge.status === 'in_lucru'
                    ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {badge.status === 'obtinut'
                  ? 'Obținut'
                  : badge.status === 'in_lucru'
                  ? 'În lucru'
                  : 'Neînceput'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
