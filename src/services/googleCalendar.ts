import { CalendarEvent } from '../types';

export const EVENTS_CACHE_KEY = 'cormo_patrol_events_cache';
export const GOOGLE_CALENDAR_ID = 'olteanmatei08@gmail.com';
export const GOOGLE_CALENDAR_PUBLIC_URL =
  'https://calendar.google.com/calendar/u/0?cid=b2x0ZWFubWF0ZWkwOEBnbWFpbC5jb20';

// Baseline real events from olteanmatei08@gmail.com
export const PERMANENT_PATROL_EVENTS: CalendarEvent[] = [
  {
    id: '1a1u1906q4i4o2kpd4ngiuqmk6',
    title: 'Ședință cu parinții',
    location: 'Cinema Mărăști, Strada Aurel Vlaicu 3A, 400612 Cluj-Napoca, România',
    start: '2026-09-28T15:30:00.000Z',
    end: '2026-09-28T16:30:00.000Z',
    hasTime: true,
    category: 'adunare',
    htmlLink: 'https://www.google.com/calendar/event?eid=MWExdTE5MDZxNGk0bzJrcGQ0bmdpdXFtazYgb2x0ZWFubWF0ZWkwOEBt',
  },
  {
    id: '37k0o6abm8mvqrugk8i7e7otqn',
    title: 'Achiziționare uniforme și calendare',
    location: 'Piața Timotei Cipariu, Cluj-Napoca, România',
    start: '2026-09-30T13:30:00.000Z',
    end: '2026-09-30T16:30:00.000Z',
    hasTime: true,
    category: 'adunare',
    htmlLink: 'https://www.google.com/calendar/event?eid=MzdrMG82YWJtOG12cXJ1Z2s4aTdlN290cW4gb2x0ZWFubWF0ZWkwOEBt',
  },
  {
    id: '37t8u4flbtslvkgoeju8lal5nd',
    title: 'halal',
    start: '2026-10-02T07:00:00.000Z',
    end: '2026-10-02T07:30:00.000Z',
    hasTime: true,
    category: 'adunare',
    htmlLink: 'https://www.google.com/calendar/event?eid=Mzd0OHU0ZmxidHNsdmtnb2VqdThsYWw1bmQgb2x0ZWFubWF0ZWkwOEBt',
  },
  {
    id: '2ta55u6tfpgp67esgtjf4rbf65',
    title: 'Deschidere an cercetășesc',
    start: '2026-10-03T06:00:00.000Z',
    end: '2026-10-03T16:00:00.000Z',
    hasTime: true,
    category: 'adunare',
    htmlLink: 'https://www.google.com/calendar/event?eid=MnRhNTV1NnRmcGdwNjdlc2d0amY0cmJmNjUgb2x0ZWFubWF0ZWkwOEBt',
  },
];

function filterOutDemoEvents(events: CalendarEvent[]): CalendarEvent[] {
  if (!Array.isArray(events)) return [];
  return events.filter((e) => {
    const id = String(e.id || '');
    return !id.startsWith('cormo-event-') && !id.startsWith('demo-');
  });
}

// Load cached events from localStorage for instantaneous rendering on open
export function getCachedCalendarEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = filterOutDemoEvents(parsed);
        if (cleaned.length > 0) return cleaned;
      }
    }
  } catch (err) {
    console.warn('Eroare citire cache calendar:', err);
  }

  saveCachedCalendarEvents(PERMANENT_PATROL_EVENTS);
  return PERMANENT_PATROL_EVENTS;
}

export function saveCachedCalendarEvents(events: CalendarEvent[]) {
  try {
    const cleaned = filterOutDemoEvents(events);
    localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(cleaned));
  } catch {
    // Ignore storage quota
  }
}

// Seamless auto-sync function (queries the backend server which directly scrapes Google Calendar embed with 10s freshness)
// NO Google Login, NO OAuth tokens, NO permission error!
export async function fetchCalendarEventsWithAutoSync(): Promise<{
  events: CalendarEvent[];
  updated: boolean;
}> {
  try {
    const res = await fetch(`/api/calendar/events?_t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache' },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.events) && data.events.length > 0) {
        const cleaned = filterOutDemoEvents(data.events);
        saveCachedCalendarEvents(cleaned);
        window.dispatchEvent(new CustomEvent('cormo_events_updated', { detail: cleaned }));
        return { events: cleaned, updated: true };
      }
    }
  } catch (err) {
    console.warn('Eroare sincronizare calendar server:', err);
  }

  // Fallback to local device cache
  const cached = getCachedCalendarEvents();
  return { events: cached, updated: false };
}
