import React, { useState } from 'react';
import {
  X,
  LogOut,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { CormorantEmblem } from './CormorantEmblem';
import { VerifiedBadge } from './VerifiedBadge';
import {
  loginWithGoogle,
  logoutUser,
  getAuthErrorMessage,
  AppUser,
} from '../services/authService';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await loginWithGoogle();
      setSuccessMessage('Conectat cu succes prin Google!');
      setTimeout(() => {
        onClose();
        setError(null);
        setSuccessMessage(null);
      }, 800);
    } catch (err: any) {
      setError(getAuthErrorMessage(err.message || err.code || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await logoutUser();
      onClose();
      setError(null);
      setSuccessMessage(null);
    } catch (err: any) {
      setError('Nu s-a putut efectua deconectarea.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${
          currentUser ? 'max-w-sm p-6' : 'max-w-md p-7 sm:p-9'
        } bg-[#090d14] border border-slate-800/80 rounded-3xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200`}
      >
        {/* Subtle Ambient Emerald Aura */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-850 border border-slate-800/70 transition-colors cursor-pointer z-10"
          title="Închide"
          aria-label="Închide"
        >
          <X className="w-4 h-4" />
        </button>

        {/* -------------------- LOGGED IN VIEW -------------------- */}
        {currentUser ? (
          <div className="space-y-6 pt-1">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Utilizator'}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500/50"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 font-bold text-lg ring-1 ring-emerald-500/20">
                    {(currentUser.displayName || currentUser.email || 'C')[0].toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 flex items-center justify-center pointer-events-none">
                  <VerifiedBadge size="sm" />
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-base font-bold text-white truncate">
                    {currentUser.displayName || 'Cercetaș Cormoran'}
                  </h4>
                  <VerifiedBadge size="xs" />
                </div>
                <p className="text-xs text-slate-400 truncate">
                  {currentUser.email || 'Cont Google conectat'}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[11px] font-medium text-emerald-400">Cont Google verificat</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] shadow-lg shadow-red-950/60 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{loading ? 'Se deconectează...' : 'Deconectare'}</span>
            </button>
          </div>
        ) : (
          /* -------------------- NOT LOGGED IN: DOAR CONECTARE CU GOOGLE -------------------- */
          <div className="space-y-6 pt-2 text-center">
            {/* Cormorant Emblem */}
            <div className="relative inline-flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/90 flex items-center justify-center shadow-xl ring-1 ring-emerald-500/20">
                <CormorantEmblem size="sm" />
              </div>
            </div>

            {/* Title */}
            <div>
              <h3 className="text-2xl sm:text-[26px] font-bold text-white font-serif-title tracking-tight">
                Patrula Cormoran
              </h3>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex items-center gap-2 text-left animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2 text-left animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* THE SINGLE GOOGLE CONNECT BUTTON */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-3.5 transition-all duration-200 cursor-pointer shadow-xl shadow-white/5 active:scale-[0.99] disabled:opacity-60"
            >
              {/* Google 4-Color SVG Icon */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{loading ? 'Se conectează...' : 'Conectează-te cu Google'}</span>
            </button>

            {/* Subtle Footer */}
            <p className="text-[11px] text-slate-500 font-medium">
              Autentificare oficială Google · Date salvate securizat în Firestore
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
