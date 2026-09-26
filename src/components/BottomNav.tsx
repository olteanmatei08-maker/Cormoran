import React from 'react';
import { Compass, BookOpen, Calendar, FolderKanban, Users } from 'lucide-react';

export type NavTab = 'acasa' | 'pedagogie' | 'calendar' | 'resurse' | 'despre';

interface BottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const tabs = [
    {
      id: 'acasa' as const,
      label: 'Acasă',
      icon: Compass,
    },
    {
      id: 'pedagogie' as const,
      label: 'Pedagogie',
      icon: BookOpen,
    },
    {
      id: 'calendar' as const,
      label: 'Calendar',
      icon: Calendar,
    },
    {
      id: 'resurse' as const,
      label: 'Resurse',
      icon: FolderKanban,
    },
    {
      id: 'despre' as const,
      label: 'Despre',
      icon: Users,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t shadow-[0_-8px_30px_rgba(0,0,0,0.8)] transition-colors duration-200"
      style={{
        backgroundColor: 'var(--nav-bg)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="max-w-lg mx-auto px-1 sm:px-4 h-16 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all duration-150 cursor-pointer select-none ${
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all relative ${
                  isActive
                    ? 'bg-emerald-900 border border-emerald-600/50 text-white shadow-lg shadow-emerald-950/80 scale-105'
                    : ''
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>

              <span
                className={`text-[9.5px] sm:text-[11px] tracking-tight sm:tracking-wide mt-1 transition-colors ${
                  isActive ? 'text-white font-bold' : 'text-slate-400 font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
