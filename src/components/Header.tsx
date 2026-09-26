import React from 'react';
import { CormorantEmblem } from './CormorantEmblem';

interface HeaderProps {
  onNavigateToCalendar?: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
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
      </div>
    </header>
  );
};
