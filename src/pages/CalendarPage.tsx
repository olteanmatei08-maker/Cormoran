import React, { useState, useEffect, useCallback } from 'react';
import { CalendarEvent } from '../types';
import {
  getCachedCalendarEvents,
  fetchServerCalendarEvents,
} from '../services/googleCalendar';
import {
  syncGoogleAccountData,
  USER_EMAIL_HINT,
} from '../services/googleSyncService';
import {
  Calendar as CalendarIcon,
  RefreshCw,
  Clock,
  MapPin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CloudSun,
  WifiOff,
  CloudLightning,
  CheckCircle2,
} from 'lucide-react';
import { WeatherCluj } from '../components/WeatherCluj';
import { checkAndDispatchEventNotifications } from '../services/notificationService';

// Safely parse local date strings without UTC shift
function parseDateSafe(dateStr: string): Date {
  if (dateStr.length === 10 && dateStr.includes('-')) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(dateStr);
}

// Extract exact hours only if set in Calendar. Never guess!
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

export const CalendarPage: React.FC = () => {
  // Real events only (loaded instantly from cache, no demo events)
  const [events, setEvents] = useState<CalendarEvent[]>(getCachedCalendarEvents);
  const [loading, setLoading] = useState(false);
  const [syncingGoogle, setSyncingGoogle] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Main page mode: 'calendar' or 'meteo'
  const [activeSubTab, setActiveSubTab] = useState<'calendar' | 'meteo'>('calendar');

  // Calendar view mode: 'upcoming' or 'month'
  const [viewMode, setViewMode] = useState<'upcoming' | 'month'>('upcoming');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  // Background fetch function (loads real events stored permanently on server)
  const refreshEvents = useCallback(async (silent: boolean = false) => {
    if (!navigator.onLine) return;

    try {
      if (!silent) setLoading(true);
      const res = await fetchServerCalendarEvents();
      if (res.events) {
        setEvents(res.events);
        checkAndDispatchEventNotifications(res.events);
      }
    } catch (err) {
      console.warn('Eroare actualizare evenimente:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Sync directly with user's Google Account (olteanmatei08@gmail.com)
  const handleGoogleSync = async () => {
    setSyncingGoogle(true);
    setSyncError(null);
    setSyncSuccessMsg(null);

    try {
      const result = await syncGoogleAccountData();
      setSyncSuccessMsg(`Sincronizat cu succes! S-au importat ${result.eventsCount} evenimente și ${result.resourcesCount} documente.`);
      refreshEvents(false);
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err: any) {
      setSyncError(err?.message || 'Eroare la sincronizarea cu Google.');
      setTimeout(() => setSyncError(null), 5000);
    } finally {
      setSyncingGoogle(false);
    }
  };

  // Listen for sync event from other parts of the app
  useEffect(() => {
    const handleEventsUpdated = (e: any) => {
      if (Array.isArray(e.detail)) {
        setEvents(e.detail);
      }
    };
    window.addEventListener('cormo_events_updated', handleEventsUpdated);
    return () => window.removeEventListener('cormo_events_updated', handleEventsUpdated);
  }, []);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      refreshEvents(true);
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
  }, [refreshEvents]);

  // Initial background refresh on mount
  useEffect(() => {
    refreshEvents(true);
  }, [refreshEvents]);

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

        {/* Calendar Specific Actions */}
        {activeSubTab === 'calendar' && (
          <div className="flex items-center gap-2">
            {/* View toggle (Viitoare vs Lună) */}
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

            {/* Google Sync Button */}
            <button
              onClick={handleGoogleSync}
              disabled={syncingGoogle || !isOnline}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-md disabled:opacity-50"
              title="Sincronizează datele din Google Calendar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingGoogle ? 'animate-spin' : ''}`} />
              <span>{syncingGoogle ? 'Se importă...' : 'Sincronizează Google'}</span>
            </button>
          </div>
        )}
      </section>

      {/* Sync feedback alerts */}
      {syncSuccessMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-600 rounded-xl text-emerald-200 text-xs flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}

      {syncError && (
        <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-200 text-xs flex items-center gap-2">
          <CloudLightning className="w-4 h-4 text-red-400 shrink-0" />
          <span>{syncError}</span>
        </div>
      )}

      {/* Offline Status Badge */}
      {!isOnline && activeSubTab === 'calendar' && (
        <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Mod offline: Evenimentele sunt salvate pe dispozitiv.</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 shrink-0">
            Offline
          </span>
        </div>
      )}

      {/* METEO PAGE VIEW (SATURDAY ONLY) */}
      {activeSubTab === 'meteo' && <WeatherCluj />}

      {/* CALENDAR PAGE VIEW */}
      {activeSubTab === 'calendar' && (
        <>
          {/* UPCOMING EVENTS VIEW - NO DEMO EVENTS */}
          {viewMode === 'upcoming' && (
            <section className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1 pb-1">
                <span className="font-semibold uppercase tracking-wider text-slate-400">
                  Evenimente care urmează ({upcomingEvents.length})
                </span>
                <span className="text-[11px] text-blue-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>Cont: {USER_EMAIL_HINT}</span>
                </span>
              </div>

              {upcomingEvents.length > 0 ? (
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
              ) : (
                <div className="p-8 sm:p-12 text-center bg-[#0c1017] rounded-2xl border border-slate-800 space-y-4">
                  <CalendarDays className="w-12 h-12 text-slate-600 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-white font-bold text-base sm:text-lg">
                      Niciun eveniment importat încă din Google Calendar
                    </p>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      Evenimentele reale din contul tău Google ({USER_EMAIL_HINT}) nu au fost încă sincronizate.
                      Apasă butonul de mai jos pentru a le importa o singură dată; acestea vor rămâne salvate automat pe orice telefon și dispozitiv.
                    </p>
                  </div>

                  <button
                    onClick={handleGoogleSync}
                    disabled={syncingGoogle || !isOnline}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncingGoogle ? 'animate-spin' : ''}`} />
                    <span>{syncingGoogle ? 'Se importă evenimentele...' : 'Importă din Google Calendar'}</span>
                  </button>
                </div>
              )}
            </section>
          )}

          {/* MOBILE-OPTIMIZED MONTH VIEW */}
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
                            {hasLocation && (
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="truncate max-w-[260px] sm:max-w-md">{ev.location!.trim()}</span>
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
                  <p className="text-xs text-slate-500 py-3 text-center">
                    Niciun eveniment programat în această zi.
                  </p>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};
