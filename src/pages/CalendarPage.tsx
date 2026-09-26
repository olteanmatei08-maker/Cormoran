import React, { useState, useEffect, useCallback } from 'react';
import { CalendarEvent } from '../types';
import {
  getCachedCalendarEvents,
  fetchCalendarEventsWithAutoSync,
  GOOGLE_CALENDAR_PUBLIC_URL,
} from '../services/googleCalendar';
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
  Navigation,
  CalendarPlus,
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

function getRelativeDateLabel(dateStr: string): { label: string; isUrgent: boolean } | null {
  const target = parseDateSafe(dateStr);
  if (isNaN(target.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDay = new Date(target);
  targetDay.setHours(0, 0, 0, 0);

  const diffDays = Math.round((targetDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { label: 'Azi', isUrgent: true };
  if (diffDays === 1) return { label: 'Mâine', isUrgent: true };
  if (diffDays === 2) return { label: 'Poimâine', isUrgent: false };
  if (diffDays > 2 && diffDays <= 7) return { label: `Peste ${diffDays} zile`, isUrgent: false };
  if (diffDays > 7 && diffDays <= 14) return { label: 'Săptămâna viitoare', isUrgent: false };
  if (diffDays < 0) return { label: 'Încheiat', isUrgent: false };
  return null;
}

// Generate downloadable RFC-5545 iCalendar file
function downloadEventIcs(ev: CalendarEvent) {
  const formatIcsDate = (dStr: string) => {
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? '' : d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const start = formatIcsDate(ev.start);
  const end = formatIcsDate(ev.end || ev.start);

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Patrula Cormoran//RO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${ev.id || Date.now()}@patrulacormoran.ro`,
    `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${ev.title || 'Eveniment Patrulă'}`,
    ev.description ? `DESCRIPTION:${ev.description.replace(/\n/g, '\\n')}` : '',
    ev.location ? `LOCATION:${ev.location}` : '',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(ev.title || 'eveniment').replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// Directly open the mobile device's native Calendar app (Google Calendar or default phone calendar)
function handleAddToDeviceCalendar(ev: CalendarEvent) {
  const ua = navigator.userAgent || '';
  const isAndroid = /android/i.test(ua);
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const startDate = new Date(ev.start);
  const startMs = isNaN(startDate.getTime()) ? Date.now() : startDate.getTime();
  const endDate = ev.end ? new Date(ev.end) : new Date(startMs + 60 * 60 * 1000);
  const endMs = isNaN(endDate.getTime()) ? startMs + 60 * 60 * 1000 : endDate.getTime();

  if (isAndroid) {
    // Direct Android intent to Google Calendar / default phone Calendar application
    const intentUrl = `intent:#Intent;action=android.intent.action.INSERT;type=vnd.android.cursor.item/event;S.title=${encodeURIComponent(
      ev.title
    )};S.eventLocation=${encodeURIComponent(ev.location || '')};S.description=${encodeURIComponent(
      ev.description || ''
    )};l.beginTime=${startMs};l.endTime=${endMs};end`;

    const timer = setTimeout(() => {
      downloadEventIcs(ev);
    }, 1200);

    window.location.href = intentUrl;
    return;
  }

  if (isIOS) {
    // On iPhone/iPad, opening the .ics stream prompts native iOS Calendar event sheet directly
    window.location.href = `/api/calendar/event/${encodeURIComponent(ev.id)}/ics`;
    return;
  }

  // Universal / Desktop fallback (downloads .ics file to open directly in Calendar app)
  downloadEventIcs(ev);
}

export const CalendarPage: React.FC = () => {
  // Real patrol events loaded instantaneously from localStorage
  const [events, setEvents] = useState<CalendarEvent[]>(getCachedCalendarEvents);
  const [loading, setLoading] = useState(false);

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Main page mode: 'calendar' or 'meteo'
  const [activeSubTab, setActiveSubTab] = useState<'calendar' | 'meteo'>('calendar');

  // Calendar view mode: 'upcoming' or 'month'
  const [viewMode, setViewMode] = useState<'upcoming' | 'month'>('upcoming');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  // Background fetch function (queries live Google Calendar API & server)
  const refreshEvents = useCallback(async (interactive: boolean = false) => {
    if (!navigator.onLine) return;

    try {
      if (interactive) setLoading(true);
      const res = await fetchCalendarEventsWithAutoSync(interactive);
      if (res.events && res.events.length > 0) {
        setEvents(res.events);
        checkAndDispatchEventNotifications(res.events);
      }
    } catch (err) {
      console.warn('Eroare actualizare calendar:', err);
    } finally {
      if (interactive) setLoading(false);
    }
  }, []);

  // Listen to background updates from anywhere in the app
  useEffect(() => {
    const handleEventsUpdated = (e: any) => {
      if (Array.isArray(e.detail) && e.detail.length > 0) {
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
      refreshEvents(false);
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
    refreshEvents(false);
  }, [refreshEvents]);

  // AUTO-REFRESH EXACTLY EVERY 1 MINUTE (60000ms)
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(() => {
      refreshEvents(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [isOnline, refreshEvents]);

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
    <div className="space-y-5 max-w-4xl mx-auto py-2">
      {/* Top Header Card */}
      <section className="p-5 sm:p-6 rounded-3xl bg-[#0c1017] border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-wider font-serif-title">
              Calendarul Patrulei
            </h1>
          </div>

          {/* Quick Actions (Open in Google & Manual Refresh) */}
          <div className="flex items-center gap-2">
            <a
              href={GOOGLE_CALENDAR_PUBLIC_URL}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
              title="Deschide calendarul direct în Google Calendar"
            >
              <span>Deschide în Google</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <button
              onClick={() => refreshEvents(true)}
              disabled={loading || !isOnline}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer text-xs active:scale-95 disabled:opacity-50"
              title="Actualizează acum evenimentele"
              aria-label="Actualizează calendar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-slate-200' : 'text-slate-400'}`} />
            </button>
          </div>
        </div>

        {/* View Switchers Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-800/80">
          {/* Calendar vs Vremea Sâmbătă */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveSubTab('calendar')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                activeSubTab === 'calendar'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Evenimente</span>
            </button>

            <button
              onClick={() => setActiveSubTab('meteo')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                activeSubTab === 'meteo'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CloudSun className="w-3.5 h-3.5" />
              <span>Vremea Sâmbătă</span>
            </button>
          </div>

          {/* Toggle Agenda (Viitoare) vs Lună (Grid) */}
          {activeSubTab === 'calendar' && (
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('upcoming')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  viewMode === 'upcoming'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Agendă ({upcomingEvents.length})
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  viewMode === 'month'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Vedere Lună
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Offline Status Badge */}
      {!isOnline && activeSubTab === 'calendar' && (
        <div className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-2xl text-amber-200 text-xs flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Mod offline activ: Evenimentele sunt încărcate instantaneu din memoria locală a telefonului.</span>
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
          {/* UPCOMING AGENDA VIEW */}
          {viewMode === 'upcoming' && (
            <section className="space-y-4">
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3.5">
                  {upcomingEvents.map((ev) => {
                    const startDate = parseDateSafe(ev.start);
                    const relativeBadge = getRelativeDateLabel(ev.start);
                    const timeDisplay = getEventTimeDisplay(ev);
                    const hasLocation = !!(ev.location && ev.location.trim().length > 0);

                    // Formatted day numbers and names
                    const dayNumber = !isNaN(startDate.getTime()) ? startDate.getDate() : '';
                    const monthShort = !isNaN(startDate.getTime())
                      ? startDate.toLocaleDateString('ro-RO', { month: 'short' }).toUpperCase()
                      : '';
                    const weekdayFull = !isNaN(startDate.getTime())
                      ? startDate.toLocaleDateString('ro-RO', { weekday: 'long' })
                      : '';

                    const mapsUrl = ev.location
                      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.location)}`
                      : null;

                    return (
                      <article
                        key={ev.id}
                        className="p-5 sm:p-6 rounded-3xl bg-[#0c1017] border border-slate-800 hover:border-slate-700 shadow-xl space-y-4 transition-all"
                      >
                        {/* Top row: Date badge, relative label, external links */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            {/* Visual Date Badge */}
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center shrink-0 shadow-inner">
                              <span className="text-[10px] font-bold tracking-wider text-slate-400 leading-none">
                                {monthShort}
                              </span>
                              <span className="text-xl sm:text-2xl font-black text-white leading-none mt-1">
                                {dayNumber}
                              </span>
                            </div>

                            {/* Title & Weekday */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-slate-400 capitalize">
                                  {weekdayFull}
                                </span>
                                {relativeBadge && (
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                      relativeBadge.isUrgent
                                        ? 'bg-slate-800 text-slate-200 border border-slate-600'
                                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                                    }`}
                                  >
                                    {relativeBadge.label}
                                  </span>
                                )}
                              </div>
                              <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
                                {ev.title}
                              </h2>
                            </div>
                          </div>

                          {/* Quick Add / Open */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleAddToDeviceCalendar(ev)}
                              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                              title="Adaugă direct în aplicația de calendar a telefonului"
                              aria-label="Adaugă în aplicația de calendar"
                            >
                              <CalendarPlus className="w-4 h-4 text-slate-400 hover:text-white" />
                            </button>

                            {ev.htmlLink && (
                              <a
                                href={ev.htmlLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                                title="Deschide în Google Calendar"
                                aria-label="Deschide în Google Calendar"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Details row: Time & Location */}
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          {timeDisplay && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-semibold text-white">{timeDisplay}</span>
                            </div>
                          )}

                          {hasLocation && (
                            <a
                              href={mapsUrl || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors group"
                              title="Deschide pe Google Maps"
                            >
                              <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                              <span className="truncate max-w-[220px] sm:max-w-md">{ev.location!.trim()}</span>
                              <Navigation className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors ml-0.5 shrink-0" />
                            </a>
                          )}
                        </div>

                        {/* Description */}
                        {ev.description && (
                          <div className="pt-3 border-t border-slate-800/80">
                            <p className="text-xs text-slate-300 leading-relaxed font-light">
                              {ev.description}
                            </p>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="p-10 sm:p-14 text-center bg-[#0c1017] rounded-3xl border border-slate-800 space-y-3">
                  <CalendarDays className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-white font-bold text-base sm:text-lg">
                    Nu sunt evenimente viitoare programate
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Evenimentele nou adăugate în calendar vor apărea automat aici.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* MONTH VIEW GRID */}
          {viewMode === 'month' && (
            <section className="space-y-4">
              <div className="p-5 sm:p-6 rounded-3xl bg-[#0c1017] border border-slate-800 shadow-xl space-y-4">
                {/* Month Navigation */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h2 className="text-base sm:text-lg font-bold text-white capitalize font-serif-title">
                    {monthName}
                  </h2>
                  <div className="flex items-center gap-1.5">
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
                      className="px-3 py-1 rounded-lg bg-slate-900 text-xs text-slate-300 hover:text-white border border-slate-800 cursor-pointer transition-colors font-medium"
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
                        className={`aspect-square w-full rounded-2xl flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-700 text-white font-bold shadow-lg scale-[1.03]'
                            : isToday
                            ? 'bg-slate-900 border border-slate-600 text-white font-bold'
                            : hasEvents
                            ? 'bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-800'
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
                                  className="w-1.5 h-1.5 rounded-full bg-slate-400"
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

              {/* Selected Day Agenda Card */}
              <div className="p-5 sm:p-6 rounded-3xl bg-[#0c1017] border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 capitalize">
                    {selectedDateFormatted}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {selectedDayEvents.length === 0
                      ? 'Niciun eveniment'
                      : `${selectedDayEvents.length} eveniment${selectedDayEvents.length > 1 ? 'e' : ''}`}
                  </span>
                </div>

                {selectedDayEvents.length > 0 ? (
                  <div className="space-y-3 pt-1">
                    {selectedDayEvents.map((ev) => {
                      const timeDisplay = getEventTimeDisplay(ev);
                      const hasLocation = !!(ev.location && ev.location.trim().length > 0);

                      return (
                        <div
                          key={ev.id}
                          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-sm sm:text-base font-bold text-white">
                              {ev.title}
                            </h3>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleAddToDeviceCalendar(ev)}
                                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                title="Adaugă direct în aplicația de calendar a telefonului"
                                aria-label="Adaugă în aplicația de calendar"
                              >
                                <CalendarPlus className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
                              </button>
                              {ev.htmlLink && (
                                <a
                                  href={ev.htmlLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-slate-400 hover:text-white p-1"
                                  title="Deschide în Google Calendar"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            {timeDisplay && (
                              <div className="flex items-center gap-1.5 text-slate-200">
                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="font-semibold text-white bg-slate-800 px-2 py-0.5 rounded-lg">
                                  {timeDisplay}
                                </span>
                              </div>
                            )}

                            {hasLocation && (
                              <div className="flex items-center gap-1.5 text-slate-300">
                                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                <span className="truncate max-w-[240px] sm:max-w-md">{ev.location!.trim()}</span>
                              </div>
                            )}
                          </div>

                          {ev.description && (
                            <p className="text-xs text-slate-400 pt-1 leading-relaxed border-t border-slate-800/80">
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
