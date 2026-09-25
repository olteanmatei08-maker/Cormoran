import React, { useState, useEffect, useCallback } from 'react';
import { CalendarEvent } from '../types';
import {
  getStoredAuth,
  getValidAccessToken,
  requestGoogleCalendarAccess,
  fetchCalendarEvents,
} from '../services/googleCalendar';
import {
  Calendar as CalendarIcon,
  RefreshCw,
  Clock,
  MapPin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Info,
  CalendarDays,
  CloudSun,
  WifiOff,
} from 'lucide-react';
import { WeatherCluj } from '../components/WeatherCluj';
import { checkAndDispatchEventNotifications } from '../services/notificationService';
import {
  subscribeToFirestoreEvents,
  saveFirestoreEvent,
} from '../services/firebaseService';

const EVENTS_CACHE_KEY = 'cormo_patrol_events_cache';

// Load cached events from local storage immediately (even if offline)
function getCachedEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Persist events to local storage so they are always accessible offline
function saveCachedEvents(events: CalendarEvent[]) {
  try {
    localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(events));
  } catch {
    // Ignore storage quota
  }
}

// Safely parse local date strings without UTC shift
function parseDateSafe(dateStr: string): Date {
  if (dateStr.length === 10 && dateStr.includes('-')) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(dateStr);
}

// Extract exact hours only if set in Google Calendar. Never guess!
function getEventTimeDisplay(ev: CalendarEvent): string | null {
  if (ev.hasTime === false || !ev.start.includes('T') || ev.start.length === 10) {
    return null;
  }

  try {
    const startDate = new Date(ev.start);
    if (isNaN(startDate.getTime())) return null;

    const startFormatted = startDate.toLocaleTimeString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (ev.end && ev.end.includes('T')) {
      const endDate = new Date(ev.end);
      if (!isNaN(endDate.getTime())) {
        const endFormatted = endDate.toLocaleTimeString('ro-RO', {
          hour: '2-digit',
          minute: '2-digit',
        });
        if (startFormatted !== endFormatted) {
          return `${startFormatted} – ${endFormatted}`;
        }
      }
    }

    return startFormatted;
  } catch {
    return null;
  }
}

function getRelativeDateLabel(dateStr: string): string | null {
  const target = parseDateSafe(dateStr);
  if (isNaN(target.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDay = new Date(target);
  targetDay.setHours(0, 0, 0, 0);

  const diffDays = Math.round((targetDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Azi';
  if (diffDays === 1) return 'Mâine';
  if (diffDays === 2) return 'Poimâine';
  if (diffDays > 2 && diffDays <= 7) return `Peste ${diffDays} zile`;
  if (diffDays > 7 && diffDays <= 14) return 'Săptămâna viitoare';
  if (diffDays < 0) return 'Încheiat';
  return null;
}

interface CalendarPageProps {
  onCalendarChange?: (name: string, isConnected: boolean) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ onCalendarChange }) => {
  const [auth, setAuth] = useState(getStoredAuth());
  const [events, setEvents] = useState<CalendarEvent[]>(getCachedEvents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Main page mode: 'calendar' or 'meteo'
  const [activeSubTab, setActiveSubTab] = useState<'calendar' | 'meteo'>('calendar');

  // Calendar view mode: 'upcoming' or 'month'
  const [viewMode, setViewMode] = useState<'upcoming' | 'month'>('upcoming');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  // Real-time synchronization from Firestore
  useEffect(() => {
    const unsub = subscribeToFirestoreEvents((firestoreEvents) => {
      if (firestoreEvents.length > 0) {
        setEvents((prev) => {
          const map = new Map<string, CalendarEvent>();
          prev.forEach((ev) => map.set(ev.id, ev));
          firestoreEvents.forEach((ev) => map.set(ev.id, ev));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
          );
          saveCachedEvents(merged);
          checkAndDispatchEventNotifications(merged);
          return merged;
        });
      }
    });
    return () => unsub();
  }, []);

  // Notify parent of connection status
  useEffect(() => {
    if (onCalendarChange) {
      onCalendarChange('Google Calendar', auth.isConnected);
    }
  }, [auth.isConnected, onCalendarChange]);

  // Load events directly from user's primary Google Calendar with auto-renewing token
  const loadPrimaryCalendarEvents = useCallback(async (silent: boolean = false) => {
    // If offline, skip network requests silently and keep cached events
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    try {
      if (!silent) setLoading(true);
      setError(null);

      // Get valid access token (silently refreshed if expired)
      const token = await getValidAccessToken();
      if (!token) {
        if (!silent) {
          setError('Pentru sincronizarea completă, apasă pe Conectează Google Calendar.');
        }
        return;
      }

      const googleEvents = await fetchCalendarEvents(token, 'primary');
      googleEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

      if (googleEvents.length > 0) {
        setEvents((prev) => {
          const map = new Map<string, CalendarEvent>();
          // Keep non-google events if any
          prev.filter((e) => !e.googleEventId).forEach((ev) => map.set(ev.id, ev));
          googleEvents.forEach((ev) => map.set(ev.id, ev));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
          );
          saveCachedEvents(merged);
          checkAndDispatchEventNotifications(merged);
          return merged;
        });

        // Sync fetched Google events to Firestore in the background
        googleEvents.forEach((ev) => {
          saveFirestoreEvent(ev).catch(() => {});
        });
      }

      setAuth(getStoredAuth());
    } catch (err: any) {
      console.warn('Sync issue (keeping existing cached events):', err);
      // We NEVER wipe existing events or disconnect the user on network/temporary errors
      if (!silent && navigator.onLine) {
        setError(err?.message || 'Nu s-au putut actualiza evenimentele în acest moment.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Online / Offline event listener: automatically updates when connection returns
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setError(null);
      // Automatically refresh and fetch any new/modified events when connection is restored!
      loadPrimaryCalendarEvents(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadPrimaryCalendarEvents]);

  // Initial load when component mounts if connected
  useEffect(() => {
    if (auth.isConnected && isOnline) {
      loadPrimaryCalendarEvents(true);
    }
  }, [auth.isConnected, isOnline, loadPrimaryCalendarEvents]);

  // Auto-sync in background every 60 seconds (non-intrusive) when online
  useEffect(() => {
    if (!auth.isConnected || !isOnline) return;

    const interval = setInterval(() => {
      loadPrimaryCalendarEvents(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [auth.isConnected, isOnline, loadPrimaryCalendarEvents]);

  // Auto-sync when coming back to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && auth.isConnected && isOnline) {
        loadPrimaryCalendarEvents(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [auth.isConnected, isOnline, loadPrimaryCalendarEvents]);

  // Connect Google account
  const handleConnectGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      await requestGoogleCalendarAccess(true);
      const updatedAuth = getStoredAuth();
      setAuth(updatedAuth);
      await loadPrimaryCalendarEvents(false);
    } catch (err: any) {
      setError(err?.message || 'Conectarea a fost anulată.');
    } finally {
      setLoading(false);
    }
  };

  // Filter events into upcoming
  const now = new Date();
  const upcomingEvents = events.filter((ev) => {
    const end = parseDateSafe(ev.end || ev.start);
    return isNaN(end.getTime()) || end >= now;
  });

  // Month grid helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startDay = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getEventsForDay = (day: number) => {
    const dayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((ev) => ev.start.startsWith(dayDateStr));
  };

  const selectedDayEvents = getEventsForDay(selectedDay);
  const selectedDateObj = new Date(year, month, selectedDay);
  const selectedDateFormatted = selectedDateObj.toLocaleDateString('ro-RO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="space-y-5 max-w-4xl mx-auto py-1">
      {/* Top Navigation & Controls Switcher */}
      <section className="p-3 sm:p-4 rounded-2xl bg-[#0c1017] border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Switcher Button: Calendar vs Vremea Sâmbătă */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('calendar')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none ${
              activeSubTab === 'calendar'
                ? 'bg-emerald-900 border border-emerald-600/50 text-white shadow-md shadow-emerald-950/70'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </button>

          <button
            onClick={() => setActiveSubTab('meteo')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none ${
              activeSubTab === 'meteo'
                ? 'bg-emerald-900 border border-emerald-600/50 text-white shadow-md shadow-emerald-950/70'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CloudSun className="w-3.5 h-3.5" />
            <span>Vremea Sâmbătă</span>
          </button>
        </div>

        {/* Calendar Specific Actions (only when in calendar tab) */}
        {activeSubTab === 'calendar' && (
          <div className="flex items-center gap-2">
            {/* View toggle (Viitoare vs Lună) ALWAYS available */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('upcoming')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  viewMode === 'upcoming'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Viitoare
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  viewMode === 'month'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Lună
              </button>
            </div>

            {/* Refresh / Sync Button */}
            {auth.isConnected ? (
              <button
                onClick={() => loadPrimaryCalendarEvents(false)}
                disabled={loading || !isOnline}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer text-xs flex items-center gap-1.5 active:scale-95 shadow-sm disabled:opacity-50"
                title={isOnline ? 'Actualizează evenimentele din calendar' : 'Ești offline (evenimentele sunt salvate)'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">{loading ? 'Se actualizează...' : 'Actualizează'}</span>
              </button>
            ) : (
              <button
                onClick={handleConnectGoogle}
                disabled={loading || !isOnline}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 border border-emerald-600/50 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-950/60 disabled:opacity-50"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Conectează Google Calendar</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* Offline Status Badge */}
      {!isOnline && activeSubTab === 'calendar' && (
        <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Mod offline: Evenimentele sunt salvate pe dispozitiv. Se vor actualiza automat când revii online.</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 shrink-0">
            Offline
          </span>
        </div>
      )}

      {error && activeSubTab === 'calendar' && isOnline && (
        <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-red-300 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* METEO PAGE VIEW (SATURDAY ONLY) */}
      {activeSubTab === 'meteo' && <WeatherCluj />}

      {/* CALENDAR PAGE VIEW */}
      {activeSubTab === 'calendar' && (
        <>
          {/* Subtle connection hint if not yet connected */}
          {!auth.isConnected && (
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300 text-center sm:text-left">
                <CalendarIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Conectează contul Google pentru a menține sincronizate automat toate activitățile de patrulă.
                </span>
              </div>
              <button
                onClick={handleConnectGoogle}
                disabled={loading || !isOnline}
                className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs transition-all shrink-0 cursor-pointer shadow-md shadow-emerald-950/70 disabled:opacity-50"
              >
                {loading ? 'Se conectează...' : 'Conectează Google'}
              </button>
            </div>
          )}

          {/* UPCOMING EVENTS VIEW - ALWAYS VISIBLE EVEN OFFLINE */}
          {viewMode === 'upcoming' && (
            <section className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1 pb-1">
                <span className="font-semibold uppercase tracking-wider text-slate-400">
                  Evenimente care urmează ({upcomingEvents.length})
                </span>
                <span className="text-[11px] text-slate-500">
                  {!isOnline
                    ? 'Salvate local (Offline)'
                    : auth.isConnected
                    ? 'Sincronizat permanent'
                    : 'Date salvate'}
                </span>
              </div>

              <div className="space-y-3">
                {upcomingEvents.map((ev) => {
                  const startDate = parseDateSafe(ev.start);
                  const relativeBadge = getRelativeDateLabel(ev.start);
                  const timeDisplay = getEventTimeDisplay(ev);
                  const hasLocation = !!(ev.location && ev.location.trim().length > 0);

                  const dateDisplay = isNaN(startDate.getTime())
                    ? ev.start
                    : startDate.toLocaleDateString('ro-RO', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      });

                  return (
                    <div
                      key={ev.id}
                      className="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 shadow-xl space-y-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                              {dateDisplay}
                            </span>
                            {relativeBadge && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                                {relativeBadge}
                              </span>
                            )}
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-white">
                            {ev.title}
                          </h3>
                        </div>

                        {ev.htmlLink && (
                          <a
                            href={ev.htmlLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-500 hover:text-white p-1"
                            title="Deschide în Google Calendar"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        {timeDisplay && (
                          <div className="flex items-center gap-1.5 text-slate-200">
                            <Clock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span className="font-semibold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {timeDisplay}
                            </span>
                          </div>
                        )}
                        {/* Render location ONLY if available and non-empty */}
                        {hasLocation && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate max-w-[260px] sm:max-w-md">{ev.location!.trim()}</span>
                          </div>
                        )}
                      </div>

                      {ev.description && (
                        <p className="text-xs text-slate-400 pt-2 leading-relaxed border-t border-slate-800/80">
                          {ev.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {upcomingEvents.length === 0 && !loading && (
                <div className="p-10 text-center bg-[#0c1017] rounded-2xl border border-slate-800 text-slate-400 text-sm space-y-1.5">
                  <CalendarDays className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-200 font-semibold">Nu sunt evenimente viitoare programate.</p>
                  <p className="text-xs text-slate-500">
                    Orice eveniment adăugat în Google Calendar pe telefon sau PC va apărea automat aici.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* MOBILE-OPTIMIZED MONTH VIEW - ALWAYS VISIBLE EVEN OFFLINE */}
          {viewMode === 'month' && (
            <section className="space-y-4">
              <div className="p-4 sm:p-6 rounded-2xl bg-[#0c1017] border border-slate-800 shadow-xl space-y-4">
                {/* Month Navigation */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h2 className="text-base sm:text-lg font-bold text-white capitalize font-serif-title">
                    {monthName}
                  </h2>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const prev = new Date(year, month - 1, 1);
                        setCurrentDate(prev);
                        setSelectedDay(1);
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800 cursor-pointer transition-colors"
                      aria-label="Luna precedentă"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const now = new Date();
                        setCurrentDate(now);
                        setSelectedDay(now.getDate());
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 text-xs text-slate-300 hover:text-white border border-slate-800 cursor-pointer transition-colors font-medium"
                    >
                      Azi
                    </button>
                    <button
                      onClick={() => {
                        const next = new Date(year, month + 1, 1);
                        setCurrentDate(next);
                        setSelectedDay(1);
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800 cursor-pointer transition-colors"
                      aria-label="Luna următoare"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Weekday Row */}
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider pb-1">
                  <div>Lu</div>
                  <div>Ma</div>
                  <div>Mi</div>
                  <div>Jo</div>
                  <div>Vi</div>
                  <div>Sâ</div>
                  <div>Du</div>
                </div>

                {/* Responsive Day Grid */}
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {Array.from({ length: startDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square rounded-xl bg-transparent" />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isToday =
                      new Date().getDate() === day &&
                      new Date().getMonth() === month &&
                      new Date().getFullYear() === year;
                    const isSelected = selectedDay === day;
                    const dayEvents = getEventsForDay(day);
                    const hasEvents = dayEvents.length > 0;

                    return (
                      <button
                        key={`day-${day}`}
                        onClick={() => setSelectedDay(day)}
                        className={`aspect-square w-full rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-900 border border-emerald-600/60 text-white font-bold shadow-lg shadow-emerald-950/70 scale-[1.03]'
                            : isToday
                            ? 'bg-slate-900 border border-emerald-500/80 text-white font-bold'
                            : hasEvents
                            ? 'bg-slate-900 text-slate-200 hover:bg-slate-800/80 border border-slate-800'
                            : 'bg-slate-950/40 text-slate-400 hover:bg-slate-900/60 border border-slate-900/60'
                        }`}
                      >
                        <span className="text-xs sm:text-sm select-none">{day}</span>

                        {hasEvents && (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {isSelected ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            ) : (
                              dayEvents.slice(0, 3).map((_, dotIdx) => (
                                <span
                                  key={dotIdx}
                                  className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                                />
                              ))
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Date Agenda Card */}
              <div className="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 capitalize">
                    {selectedDateFormatted}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {selectedDayEvents.length === 0
                      ? 'Liber'
                      : `${selectedDayEvents.length} eveniment${selectedDayEvents.length > 1 ? 'e' : ''}`}
                  </span>
                </div>

                {selectedDayEvents.length > 0 ? (
                  <div className="space-y-2.5 pt-1">
                    {selectedDayEvents.map((ev) => {
                      const timeDisplay = getEventTimeDisplay(ev);
                      const hasLocation = !!(ev.location && ev.location.trim().length > 0);

                      return (
                        <div
                          key={ev.id}
                          className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="text-sm sm:text-base font-bold text-white">
                              {ev.title}
                            </h4>
                            {ev.htmlLink && (
                              <a
                                href={ev.htmlLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-500 hover:text-white p-1"
                                title="Deschide în Google Calendar"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                            {timeDisplay && (
                              <div className="flex items-center gap-1.5 text-slate-200">
                                <Clock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                <span className="font-semibold text-white bg-slate-800 px-2 py-0.5 rounded">
                                  {timeDisplay}
                                </span>
                              </div>
                            )}
                            {/* Render location ONLY if available and non-empty */}
                            {hasLocation && (
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span>{ev.location!.trim()}</span>
                              </div>
                            )}
                          </div>

                          {ev.description && (
                            <p className="text-xs text-slate-400 pt-1 leading-relaxed border-t border-slate-800/60">
                              {ev.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500">
                    Niciun eveniment programat în această zi.
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};
