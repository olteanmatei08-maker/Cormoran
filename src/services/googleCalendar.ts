import { CalendarEvent } from '../types';

export const EVENTS_CACHE_KEY = 'cormo_patrol_events_cache';
export const TOKEN_STORAGE_KEY = 'cormo_gcal_token';
export const TOKEN_EXPIRY_KEY = 'cormo_gcal_token_exp';

export const GOOGLE_OAUTH_CLIENT_ID =
  '979902519749-olg16cltl2ik5g5h1hv8ci13s1jb2ua3.apps.googleusercontent.com';
export const GOOGLE_CALENDAR_ID = 'olteanmatei08@gmail.com';
export const GOOGLE_CALENDAR_PUBLIC_URL =
  'https://calendar.google.com/calendar/u/0?cid=b2x0ZWFubWF0ZWkwOEBnbWFpbC5jb20';

// Baseline real events from olteanmatei08@gmail.com
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

function filterOutDemoEvents(events: CalendarEvent[]): CalendarEvent[] {
  if (!Array.isArray(events)) return [];
  return events.filter((e) => {
    const id = String(e.id || '');
    return !id.startsWith('cormo-event-') && !id.startsWith('demo-');
  });
}

// Load cached events from localStorage
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

// Helper to get active Google token or request one
function getStoredGoogleToken(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const expStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (token && expStr) {
      const exp = parseInt(expStr, 10);
      if (Date.now() < exp - 60000) {
        return token;
      }
    }
  } catch {
    // Ignore
  }
  return null;
}

function saveGoogleToken(token: string, expiresInSeconds: number = 3600) {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + expiresInSeconds * 1000));
  } catch {
    // Ignore
  }
}

// Request access token from Google Identity Services
export function requestGoogleToken(interactive: boolean = false): Promise<string> {
  return new Promise((resolve, reject) => {
    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      reject(new Error('Serviciul Google nu este disponibil'));
      return;
    }

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_OAUTH_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/calendar.readonly',
        hint: GOOGLE_CALENDAR_ID,
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }
          if (response.access_token) {
            saveGoogleToken(response.access_token, response.expires_in || 3600);
            resolve(response.access_token);
          } else {
            reject(new Error('Nu s-a primit token'));
          }
        },
      });

      // If interactive, prompt consent; otherwise attempt completely silent refresh
      client.requestAccessToken({ prompt: interactive ? 'consent' : '' });
    } catch (err: any) {
      reject(err);
    }
  });
}

// Fetch events from Google Calendar API v3 using an access token
async function fetchFromGoogleApi(accessToken: string): Promise<CalendarEvent[]> {
  const timeMin = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(
    timeMin
  )}&maxResults=250`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(6000),
  });

  if (!res.ok) {
    throw new Error(`Google Calendar API HTTP ${res.status}`);
  }

  const data = await res.json();
  const items = data.items || [];

  return items.map((item: any) => ({
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
}

// Direct sync from Google Calendar
export async function syncGoogleCalendarLive(interactive: boolean = false): Promise<CalendarEvent[] | null> {
  let token = getStoredGoogleToken();

  if (!token) {
    try {
      token = await requestGoogleToken(interactive);
    } catch {
      return null;
    }
  }

  if (!token) return null;

  try {
    const rawEvents = await fetchFromGoogleApi(token);
    const cleaned = filterOutDemoEvents(rawEvents);

    if (cleaned.length > 0) {
      saveCachedCalendarEvents(cleaned);

      // Persist to backend server so any other phone or browser receives them
      fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: cleaned }),
      }).catch(() => {});

      window.dispatchEvent(new CustomEvent('cormo_events_updated', { detail: cleaned }));
      return cleaned;
    }
  } catch (err: any) {
    console.warn('Google Calendar fetch error with token:', err?.message);
    // Token may have expired, clear it
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    if (interactive) {
      // Retry once interactively
      try {
        const freshToken = await requestGoogleToken(true);
        const rawEvents = await fetchFromGoogleApi(freshToken);
        const cleaned = filterOutDemoEvents(rawEvents);
        if (cleaned.length > 0) {
          saveCachedCalendarEvents(cleaned);
          fetch('/api/calendar/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events: cleaned }),
          }).catch(() => {});
          window.dispatchEvent(new CustomEvent('cormo_events_updated', { detail: cleaned }));
          return cleaned;
        }
      } catch {
        // Fallback
      }
    }
  }

  return null;
}

// Master refresh function called every minute:
// 1. Attempts live Google Calendar API sync in background.
// 2. Polls backend server for updates.
// 3. Fallbacks to localStorage cache.
export async function fetchCalendarEventsWithAutoSync(interactive: boolean = false): Promise<{
  events: CalendarEvent[];
  updated: boolean;
}> {
  // 1. First, attempt live Google sync
  try {
    const liveEvents = await syncGoogleCalendarLive(interactive);
    if (liveEvents && liveEvents.length > 0) {
      return { events: liveEvents, updated: true };
    }
  } catch {
    // Continue
  }

  // 2. Query backend server with cache-busting timestamp
  try {
    const res = await fetch(`/api/calendar/events?_t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache' },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.events) && data.events.length > 0) {
        const cleaned = filterOutDemoEvents(data.events);
        saveCachedCalendarEvents(cleaned);
        return { events: cleaned, updated: true };
      }
    }
  } catch {
    // Continue
  }

  // 3. Cached fallback
  const cached = getCachedCalendarEvents();
  return { events: cached, updated: false };
}
