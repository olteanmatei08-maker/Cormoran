import React, { useState, useEffect } from 'react';
import emblemWhite from '../assets/emblem_transparent_white.png';
import emblemBlack from '../assets/emblem_transparent_black.png';
import { getAppTheme, subscribeToTheme } from '../services/themeService';

interface CormorantEmblemProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  color?: string;
}

export const CormorantEmblem: React.FC<CormorantEmblemProps> = ({
  className = '',
  size = 'md',
}) => {
  const [theme, setTheme] = useState(getAppTheme());

  useEffect(() => {
    const unsub = subscribeToTheme((t) => setTheme(t));
    return () => unsub();
  }, []);

  const sizeMap = {
    xs: 'w-7 h-7',
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-44 h-44 sm:w-56 sm:h-56',
    '2xl': 'w-60 h-60 sm:w-72 sm:h-72',
  };

  const isLight = theme === 'light';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 bg-transparent select-none transition-transform duration-300 hover:scale-[1.02] ${sizeMap[size]} ${className}`}
    >
      <img
        src={isLight ? emblemBlack : emblemWhite}
        alt="Emblema Oficială Patrula Cormoran"
        className="w-full h-full object-contain filter drop-shadow-sm"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
