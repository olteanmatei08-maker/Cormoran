import { CalendarEvent } from '../types';

export const EVENTS_CACHE_KEY = 'cormo_patrol_events_cache';
export const CALENDAR_ID_STORAGE_KEY = 'cormo_public_calendar_id';
export const API_KEY_STORAGE_KEY = 'cormo_public_calendar_api_key';
export const ICAL_URL_STORAGE_KEY = 'cormo_public_ical_url';

export const DEFAULT_CALENDAR_ID = 'olteanmatei08@gmail.com';

// Official Scout initial events so every newly installed phone or device
// displays the patrol agenda instantly even before network or if offline!
export const INITIAL_PATROL_EVENTS: CalendarEvent[] = [
  {
    id: 'cormo-event-1',
    title: 'Ieșire în Vlădeasa (Drumeție de Patrulă)',
    description: 'Drumeție de toamnă pe Vlădeasa. Plecarea la ora 08:30 din Gara Cluj-Napoca. Echipament necesar: bocanci de munte, pelerină de ploaie, recipient cu apă și carnet de patrulă.',
    location: 'Gara Cluj-Napoca (Întâlnire la intrarea principală)',
    start: '2026-10-11T08:30:00+03:00',
    end: '2026-10-11T18:30:00+03:00',
    hasTime: true,
    category: 'drumetie',
  },
  {
    id: 'cormo-event-2',
    title: 'Adunare de Patrulă: Noduri & Orientare Topografică',
    description: 'Atelier practic de noduri cercetășești (nodul cabestan, nodul de pescar, nodul de opt) și citirea hărții cu busola.',
    location: 'Sediul de Patrulă (Parcul Central, Cluj-Napoca)',
    start: '2026-10-18T10:00:00+03:00',
    end: '2026-10-18T13:00:00+03:00',
    hasTime: true,
    category: 'tehnici',
  },
  {
    id: 'cormo-event-3',
    title: 'Ceremonia Promisiunii de Cercetaș',
    description: 'Ceremonie solemnă în fața patrulei și a eșarfelor. Depunerea Promisiunii de Cercetaș și acordarea insignelor de etapă.',
    location: 'Dealul Feleacului, Cluj-Napoca',
    start: '2026-10-25T11:00:00+03:00',
    end: '2026-10-25T14:00:00+03:00',
    hasTime: true,
    category: 'ceremonie',
  },
  {
    id: 'cormo-event-4',
    title: 'Tabăra de Iarnă: Patrula Cormoran',
    description: 'Tabăra anuală de iarnă în Munții Apuseni. Activități de campism pe zăpadă, adăposturi, foc și viață în natură.',
    location: 'Cabana Vlădeasa, Apuseni',
    start: '2026-12-27T09:00:00+03:00',
    end: '2027-01-03T16:00:00+03:00',
    hasTime: true,
    category: 'campism',
  },
];

export interface PublicCalendarConfig {
  calendarId: string;
  apiKey: string;
  icalUrl: string;
}

export function getPublicCalendarConfig(): PublicCalendarConfig {
  return {
    calendarId: localStorage.getItem(CALENDAR_ID_STORAGE_KEY) || DEFAULT_CALENDAR_ID,
    apiKey: localStorage.getItem(API_KEY_STORAGE_KEY) || '',
    icalUrl: localStorage.getItem(ICAL_URL_STORAGE_KEY) || '',
  };
}

export function savePublicCalendarConfig(config: Partial<PublicCalendarConfig>) {
  if (config.calendarId !== undefined) {
    localStorage.setItem(CALENDAR_ID_STORAGE_KEY, config.calendarId.trim());
  }
  if (config.apiKey !== undefined) {
    localStorage.setItem(API_KEY_STORAGE_KEY, config.apiKey.trim());
  }
  if (config.icalUrl !== undefined) {
    localStorage.setItem(ICAL_URL_STORAGE_KEY, config.icalUrl.trim());
  }
}

// Immediately load cached events from localStorage (guaranteed instantaneous render)
export function getCachedCalendarEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading cached events:', err);
  }

  // First app launch: populate with initial patrol events
  saveCachedCalendarEvents(INITIAL_PATROL_EVENTS);
  return INITIAL_PATROL_EVENTS;
}

// Persist events to localStorage
export function saveCachedCalendarEvents(events: CalendarEvent[]) {
  try {
    localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(events));
  } catch {
    // Ignore localStorage quota errors
  }
}

// Fetch events from permanent read-only API without needing OAuth or login
export async function fetchPublicCalendarEvents(): Promise<{
  events: CalendarEvent[];
  updated: boolean;
}> {
  const config = getPublicCalendarConfig();
  const timeMin = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  try {
    // 1. Fetch through backend proxy endpoint (no CORS, no auth prompts)
    const query = new URLSearchParams({
      calendarId: config.calendarId,
      timeMin,
    });
    if (config.apiKey) query.set('apiKey', config.apiKey);
    if (config.icalUrl) query.set('icalUrl', config.icalUrl);

    const res = await fetch(`/api/calendar/events?${query.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.events) && data.events.length > 0) {
        // Merge and update cached events
        const map = new Map<string, CalendarEvent>();
        INITIAL_PATROL_EVENTS.forEach((e) => map.set(e.id, e));
        data.events.forEach((e: CalendarEvent) => map.set(e.id, e));
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
        );
        saveCachedCalendarEvents(merged);
        return { events: merged, updated: true };
      }
    }
  } catch (err) {
    console.warn('Network fetch error for calendar:', err);
  }

  // 2. Direct client fallback if API key is provided
  if (config.apiKey) {
    try {
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(config.calendarId)}/events?key=${encodeURIComponent(config.apiKey)}&singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(timeMin)}&maxResults=100`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const items: CalendarEvent[] = (data.items || []).map((item: any) => ({
          id: item.id,
          title: item.summary || 'Eveniment fără nume',
          description: item.description,
          location: item.location,
          start: item.start?.dateTime || item.start?.date || '',
          end: item.end?.dateTime || item.end?.date || '',
          hasTime: !!item.start?.dateTime,
          category: 'adunare',
          htmlLink: item.htmlLink,
        }));

        if (items.length > 0) {
          const map = new Map<string, CalendarEvent>();
          INITIAL_PATROL_EVENTS.forEach((e) => map.set(e.id, e));
          items.forEach((e) => map.set(e.id, e));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
          );
          saveCachedCalendarEvents(merged);
          return { events: merged, updated: true };
        }
      }
    } catch (directErr) {
      console.warn('Direct Google API fetch error:', directErr);
    }
  }

  // Fallback: return current cached events
  const cached = getCachedCalendarEvents();
  return { events: cached, updated: false };
}
