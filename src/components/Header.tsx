import React from 'react';
import { CormorantEmblem } from './CormorantEmblem';
import { User as UserIcon } from 'lucide-react';
import { VerifiedBadge } from './VerifiedBadge';
import { AppUser } from '../services/authService';

interface HeaderProps {
  onNavigateToCalendar?: () => void;
  currentUser?: AppUser | null;
  onOpenAccount?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenAccount,
}) => {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-200"
      style={{
        backgroundColor: 'var(--header-bg)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between relative">
        {/* Logo & Denumire Patrulă în stânga */}
        <div className="flex items-center gap-3.5">
          <CormorantEmblem size="sm" />
          <span
            className="text-xl sm:text-2xl font-bold font-serif-title tracking-tight block select-none"
            style={{ color: 'var(--text-main)' }}
          >
            Patrula Cormoran
          </span>
        </div>

        {/* Buton de cont în colțul dreapta sus: fără margini și fără fundal */}
        {onOpenAccount && (
          <button
            type="button"
            onClick={onOpenAccount}
            className="bg-transparent border-0 p-2 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center relative active:scale-95"
            title={currentUser ? `Conectat: ${currentUser.displayName || currentUser.email || currentUser.phoneNumber || 'Cont'}` : 'Cont Cercetaș (Conectare / Înregistrare)'}
            aria-label="Cont Cercetaș"
          >
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Cont"
                className="w-7 h-7 rounded-full object-cover ring-1 ring-emerald-500/70"
              />
            ) : (
              <UserIcon className="w-6 h-6 text-slate-300 hover:text-emerald-400 transition-colors" />
            )}

            {/* Pictogramă verde cu bifă albă ca la conturile verificate de la Instagram */}
            {currentUser && (
              <span className="absolute top-0.5 right-0.5 flex items-center justify-center pointer-events-none">
                <VerifiedBadge size="xs" />
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
