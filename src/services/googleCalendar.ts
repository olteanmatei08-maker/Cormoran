import { CalendarEvent } from '../types';

export const EVENTS_CACHE_KEY = 'cormo_patrol_events_cache';

// Public Google Calendar Credentials provided for permanent read-only sync
export const GOOGLE_CALENDAR_PUBLIC_API_KEY = 'AIzaSyAAYnHYz7FZ1INDbjGNdt_Ttt7c4fMEnkw';
export const GOOGLE_CALENDAR_ID = 'olteanmatei08@gmail.com';
export const GOOGLE_CALENDAR_PUBLIC_URL =
  'https://calendar.google.com/calendar/u/0?cid=b2x0ZWFubWF0ZWkwOEBnbWFpbC5jb20';

// Baseline real events from olteanmatei08@gmail.com
// These are permanently embedded so every newly installed app or phone
// immediately displays the real events on the very first launch, even offline!
export const PERMANENT_PATROL_EVENTS: CalendarEvent[] = [
  {
    id: '1a1u1906q4i4o2kpd4ngiuqmk6',
    title: 'Ședință cu parinții',
    location: 'Cinema Mărăști, Strada Aurel Vlaicu 3A, 400612 Cluj-Napoca, România',
    start: '2026-09-28T18:30:00+03:00',
    end: '2026-09-28T19:30:00+03:00',
    hasTime: true,
    category: 'adunare',
    htmlLink: 'https://www.google.com/calendar/event?eid=MWExdTE5MDZxNGk0bzJrcGQ0bmdpdXFtazYgb2x0ZWFubWF0ZWkwOEBt',
  },
  {
    id: '37k0o6abm8mvqrugk8i7e7otqn',
    title: 'Achiziționare uniforme și calendare',
    location: 'Piața Timotei Cipariu, Cluj-Napoca, România',
    start: '2026-09-30T16:30:00+03:00',
    end: '2026-09-30T19:30:00+03:00',
    hasTime: true,
    category: 'adunare',
    htmlLink: 'https://www.google.com/calendar/event?eid=MzdrMG82YWJtOG12cXJ1Z2s4aTdlN290cW4gb2x0ZWFubWF0ZWkwOEBt',
  },
  {
    id: '2ta55u6tfpgp67esgtjf4rbf65',
    title: 'Deschidere an cercetășesc',
    start: '2026-10-03T09:00:00+03:00',
    end: '2026-10-03T19:00:00+03:00',
    hasTime: true,
    category: 'adunare',
    htmlLink: 'https://www.google.com/calendar/event?eid=MnRhNTV1NnRmcGdwNjdlc2d0amY0cmJmNjUgb2x0ZWFubWF0ZWkwOEBt',
  },
];

// Helper to categorize events
function categorizeEvent(summary = '', description = ''): 'drumetie' | 'campism' | 'tehnici' | 'ecologie' | 'ceremonie' | 'adunare' {
  const lower = `${summary} ${description}`.toLowerCase();
  if (lower.includes('vlădeasa') || lower.includes('vladeasa') || lower.includes('munte') || lower.includes('drumeție') || lower.includes('hike')) {
    return 'drumetie';
  } else if (lower.includes('camp') || lower.includes('tabără') || lower.includes('tabara') || lower.includes('cort')) {
    return 'campism';
  } else if (lower.includes('tehnic') || lower.includes('nod') || lower.includes('morse') || lower.includes('prim ajutor')) {
    return 'tehnici';
  } else if (lower.includes('ecolog') || lower.includes('curățenie') || lower.includes('curatenie') || lower.includes('pădure') || lower.includes('copaci')) {
    return 'ecologie';
  } else if (lower.includes('promisiune') || lower.includes('aniversare') || lower.includes('ceremonie')) {
    return 'ceremonie';
  }
  return 'adunare';
}

// Purge any legacy demo events if present in cache
function filterOutDemoEvents(events: CalendarEvent[]): CalendarEvent[] {
  if (!Array.isArray(events)) return [];
  return events.filter((e) => {
    const id = String(e.id || '');
    return !id.startsWith('cormo-event-') && !id.startsWith('demo-');
  });
}

// Immediately load cached events from localStorage or baseline permanent events
export function getCachedCalendarEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = filterOutDemoEvents(parsed);
        if (cleaned.length > 0) {
          return cleaned;
        }
      }
    }
  } catch (err) {
    console.warn('Eroare citire evenimente din cache:', err);
  }

  // Populate initial cache with user's real events
  saveCachedCalendarEvents(PERMANENT_PATROL_EVENTS);
  return PERMANENT_PATROL_EVENTS;
}

// Persist events to localStorage
export function saveCachedCalendarEvents(events: CalendarEvent[]) {
  try {
    const cleaned = filterOutDemoEvents(events);
    localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(cleaned));
  } catch {
    // Ignore storage quota errors
  }
}

// Direct client fetch using Google Calendar API v3 with the public API Key
export async function fetchPublicGoogleCalendarEvents(): Promise<{
  events: CalendarEvent[];
  updated: boolean;
  source: 'google_api' | 'server' | 'cache';
}> {
  const timeMin = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  // 1. Try direct Google Calendar API v3 with the provided Public API Key
  try {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      GOOGLE_CALENDAR_ID
    )}/events?key=${GOOGLE_CALENDAR_PUBLIC_API_KEY}&singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(
      timeMin
    )}&maxResults=100`;

    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        const items: CalendarEvent[] = data.items.map((item: any) => ({
          id: item.id,
          title: item.summary || 'Eveniment fără titlu',
          description: item.description || undefined,
          location: item.location || undefined,
          start: item.start?.dateTime || item.start?.date || '',
          end: item.end?.dateTime || item.end?.date || '',
          hasTime: !!item.start?.dateTime,
          category: categorizeEvent(item.summary, item.description),
          htmlLink: item.htmlLink,
        }));

        const cleaned = filterOutDemoEvents(items);
        saveCachedCalendarEvents(cleaned);

        // Sync to backend server in background
        fetch('/api/calendar/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: cleaned }),
        }).catch(() => {});

        return { events: cleaned, updated: true, source: 'google_api' };
      }
    }
  } catch {
    // Continue to server fallback
  }

  // 2. Fetch from backend server (persisted cross-device)
  try {
    const res = await fetch('/api/calendar/events', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.events) && data.events.length > 0) {
        const cleaned = filterOutDemoEvents(data.events);
        saveCachedCalendarEvents(cleaned);
        return { events: cleaned, updated: true, source: 'server' };
      }
    }
  } catch {
    // Continue to cache
  }

  // 3. Fallback to localStorage / baseline real events
  const cached = getCachedCalendarEvents();
  return { events: cached, updated: false, source: 'cache' };
}
