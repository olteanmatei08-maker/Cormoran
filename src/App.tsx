/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { HomePage } from './pages/HomePage';
import { PedagogyPage } from './pages/PedagogyPage';
import { CalendarPage } from './pages/CalendarPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { AboutPage } from './pages/AboutPage';
import { ProgressPage } from './pages/ProgressPage';
import { NotificationPromptModal } from './components/NotificationPromptModal';
import { AccountModal } from './components/AccountModal';
import { subscribeToAuth, AppUser } from './services/authService';
import {
  registerServiceWorker,
  checkAndDispatchEventNotifications,
} from './services/notificationService';
import {
  getAppTheme,
  applyThemeToDOM,
  subscribeToTheme,
} from './services/themeService';
import { CalendarEvent } from './types';

const EVENTS_CACHE_KEY = 'cormo_patrol_events_cache';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('acasa');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Handle tab switching
  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    // Clear calendar hash if leaving calendar
    if (tab !== 'calendar' && window.location.hash === '#calendar') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  // Fallback to 'acasa' if user logs out while on 'progres' tab
  useEffect(() => {
    if (!currentUser && activeTab === 'progres') {
      setActiveTab('acasa');
    }
  }, [currentUser, activeTab]);

  // Initialize theme, notifications, auth, and navigation listeners
  useEffect(() => {
    applyThemeToDOM(getAppTheme());
    const unsubTheme = subscribeToTheme((t) => applyThemeToDOM(t));

    // Listen to Firebase auth state persistently across app sessions
    const unsubAuth = subscribeToAuth((user) => {
      setCurrentUser(user);
    });

    registerServiceWorker();

    const runNotificationCheck = () => {
      try {
        const raw = localStorage.getItem(EVENTS_CACHE_KEY);
        if (raw) {
          const events: CalendarEvent[] = JSON.parse(raw);
          if (Array.isArray(events)) {
            checkAndDispatchEventNotifications(events);
          }
        }
      } catch (err) {
        console.warn('Error running notification check:', err);
      }
    };

    // Run check on startup
    runNotificationCheck();

    // Check periodically every 5 minutes so 24h-before alerts trigger punctually
    const interval = setInterval(runNotificationCheck, 5 * 60 * 1000);

    // Also run check when window regains focus
    const handleFocus = () => runNotificationCheck();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    // 1. Listen for notification click messages from Service Worker
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.tab === 'calendar' || event.data?.type === 'NAVIGATE_TAB') {
        setActiveTab('calendar');
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    // 2. Listen for custom window event dispatched on desktop notification clicks
    const handleCustomNavigate = (e: any) => {
      if (e.detail === 'calendar') {
        setActiveTab('calendar');
      }
    };
    window.addEventListener('cormo_navigate_tab', handleCustomNavigate);

    // 3. Check hash or query param for '#calendar' or '?tab=calendar'
    const checkHashOrQuery = () => {
      if (
        window.location.hash === '#calendar' ||
        window.location.search.includes('tab=calendar')
      ) {
        setActiveTab('calendar');
      }
    };

    window.addEventListener('hashchange', checkHashOrQuery);
    checkHashOrQuery();

    return () => {
      unsubTheme();
      unsubAuth();
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('cormo_navigate_tab', handleCustomNavigate);
      window.removeEventListener('hashchange', checkHashOrQuery);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col font-sans selection:bg-emerald-500/30 selection:text-white transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-main)',
      }}
    >
      {/* Top Header */}
      <Header
        onNavigateToCalendar={() => handleSelectTab('calendar')}
        currentUser={currentUser}
        onOpenAccount={() => setIsAccountModalOpen(true)}
      />

      {/* Main Content Area - padded at bottom for the frozen bottom navigation bar */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 pb-24">
        {activeTab === 'acasa' && <HomePage />}
        {activeTab === 'pedagogie' && <PedagogyPage />}
        {activeTab === 'calendar' && <CalendarPage />}
        {activeTab === 'resurse' && <ResourcesPage />}
        {activeTab === 'despre' && <AboutPage />}
        {activeTab === 'progres' && currentUser && <ProgressPage currentUser={currentUser} />}
      </main>

      {/* Frozen Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        isLoggedIn={!!currentUser}
      />

      {/* Scout Notification Permission Modal (shown on first open) */}
      <NotificationPromptModal />

      {/* Scout Account Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
