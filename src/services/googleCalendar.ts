import { GoogleCalendarItem, CalendarEvent } from '../types';

export const GOOGLE_OAUTH_CLIENT_ID =
  '979902519749-olg16cltl2ik5g5h1hv8ci13s1jb2ua3.apps.googleusercontent.com';

export const CALENDAR_SCOPES =
  'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events';

const TOKEN_KEY = 'cormo_google_access_token';
const TOKEN_EXPIRE_KEY = 'cormo_google_token_expiry';
const SELECTED_CALENDAR_KEY = 'cormo_selected_calendar_id';
const SELECTED_CALENDAR_SUMMARY_KEY = 'cormo_selected_calendar_summary';
const USER_EMAIL_KEY = 'cormo_google_user_email';
const CONNECTED_FLAG_KEY = 'cormo_google_connected';

export interface StoredAuth {
  accessToken: string | null;
  isValid: boolean;
  isConnected: boolean;
  userEmail: string | null;
  selectedCalendarId: string;
  selectedCalendarSummary: string;
}

export function getStoredAuth(): StoredAuth {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRE_KEY);
  const isConnected = localStorage.getItem(CONNECTED_FLAG_KEY) === 'true' || !!token;
  const userEmail = localStorage.getItem(USER_EMAIL_KEY);
  const selectedCalendarId = localStorage.getItem(SELECTED_CALENDAR_KEY) || 'primary';
  const selectedCalendarSummary = localStorage.getItem(SELECTED_CALENDAR_SUMMARY_KEY) || 'Calendar Principal';

  // Valid if token exists and hasn't expired (with 30s buffer)
  const isValid = !!(token && expiry && Number(expiry) > Date.now() + 30000);

  return {
    accessToken: token,
    isValid,
    isConnected,
    userEmail,
    selectedCalendarId,
    selectedCalendarSummary,
  };
}

export function saveAuthToken(accessToken: string, expiresInSeconds: number = 3500, email?: string) {
  const expiryTime = Date.now() + expiresInSeconds * 1000;
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(TOKEN_EXPIRE_KEY, expiryTime.toString());
  localStorage.setItem(CONNECTED_FLAG_KEY, 'true');
  if (email) {
    localStorage.setItem(USER_EMAIL_KEY, email);
  }
}

export function saveSelectedCalendar(id: string, summary: string) {
  localStorage.setItem(SELECTED_CALENDAR_KEY, id);
  localStorage.setItem(SELECTED_CALENDAR_SUMMARY_KEY, summary);
}

// User-initiated logout only. NEVER called on automatic network errors or 401s!
export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRE_KEY);
  localStorage.removeItem(CONNECTED_FLAG_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
}

let activeRefreshPromise: Promise<string | null> | null = null;

// Request Google OAuth Access Token via Google Identity Services
// With prompt: '' or 'select_account' to avoid re-triggering the full consent dialog
export function requestGoogleCalendarAccess(interactive: boolean = true): Promise<string> {
  return new Promise((resolve, reject) => {
    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      reject(
        new Error(
          'Serviciul Google Identity nu s-a încărcat încă. Vă rugăm să reîncărcați pagina sau să verificați conexiunea.'
        )
      );
      return;
    }

    const storedEmail = localStorage.getItem(USER_EMAIL_KEY);

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_OAUTH_CLIENT_ID,
        scope: CALENDAR_SCOPES,
        hint: storedEmail || undefined,
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          if (response.access_token) {
            const expiresIn = Number(response.expires_in) || 3600;
            saveAuthToken(response.access_token, expiresIn);
            resolve(response.access_token);
          } else {
            reject(new Error('Nu s-a primit niciun token de acces de la Google.'));
          }
        },
      });

      // Use prompt: '' for silent background refresh or when account is known
      // Use 'select_account' ONLY when first connecting interactively without known email
      // NEVER use prompt: 'consent' which repeatedly forces permission check dialogs
      const promptValue = interactive ? (storedEmail ? '' : 'select_account') : '';
      client.requestAccessToken({ prompt: promptValue });
    } catch (err: any) {
      reject(err);
    }
  });
}

// Ensures an active, valid access token is available, automatically refreshing silently if expired
export async function getValidAccessToken(forceRefresh = false): Promise<string | null> {
  const auth = getStoredAuth();
  if (!forceRefresh && auth.isValid && auth.accessToken) {
    return auth.accessToken;
  }

  // Prevent multiple simultaneous token requests
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      // Attempt silent background refresh
      const refreshedToken = await requestGoogleCalendarAccess(false);
      return refreshedToken;
    } catch (silentErr) {
      console.warn('Silent token refresh failed, fallback to existing token:', silentErr);
      return auth.accessToken;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

function parseCalendarItems(items: any[]): CalendarEvent[] {
  return items.map((item) => {
    const hasSpecificTime = !!item.start?.dateTime;
    const startStr = item.start?.dateTime || item.start?.date || '';
    const endStr = item.end?.dateTime || item.end?.date || startStr;

    const lower = `${item.summary || ''} ${item.description || ''}`.toLowerCase();
    let category: CalendarEvent['category'] = 'adunare';
    if (lower.includes('vlădeasa') || lower.includes('munte') || lower.includes('drumeție') || lower.includes('hike')) {
      category = 'drumetie';
    } else if (lower.includes('camp') || lower.includes('tabără') || lower.includes('cort')) {
      category = 'campism';
    } else if (lower.includes('tehnic') || lower.includes('nod') || lower.includes('morse') || lower.includes('prim ajutor')) {
      category = 'tehnici';
    } else if (lower.includes('ecolog') || lower.includes('curățenie') || lower.includes('pădure') || lower.includes('copaci')) {
      category = 'ecologie';
    } else if (lower.includes('promisiune') || lower.includes('5 octombrie') || lower.includes('aniversare') || lower.includes('ceremonie')) {
      category = 'ceremonie';
    }

    return {
      id: item.id,
      googleEventId: item.id,
      title: item.summary || 'Eveniment fără nume',
      description: item.description,
      location: item.location,
      start: startStr,
      end: endStr,
      hasTime: hasSpecificTime,
      category,
      htmlLink: item.htmlLink,
    };
  });
}

// Fetch all available calendars for the user
export async function fetchUserCalendars(accessToken: string): Promise<GoogleCalendarItem[]> {
  const executeFetch = async (token: string) => {
    return fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
  };

  let res = await executeFetch(accessToken);

  if (!res.ok && res.status === 401) {
    // Attempt silent token refresh once
    const freshToken = await getValidAccessToken(true);
    if (freshToken && freshToken !== accessToken) {
      res = await executeFetch(freshToken);
    }
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Eroare la preluarea calendarelor (${res.status})`);
  }

  const data = await res.json();
  const items: any[] = data.items || [];

  // Automatically remember the user's primary email from the primary calendar
  const primaryCal = items.find((c) => c.primary);
  if (primaryCal?.id && primaryCal.id.includes('@')) {
    localStorage.setItem(USER_EMAIL_KEY, primaryCal.id);
  }

  return items.map((cal) => ({
    id: cal.id,
    summary: cal.summary || 'Calendar fără titlu',
    description: cal.description,
    primary: !!cal.primary,
    backgroundColor: cal.backgroundColor || '#059669',
    foregroundColor: cal.foregroundColor || '#ffffff',
    accessRole: cal.accessRole,
  }));
}

// Fetch events from selected calendar with automatic token renewal and persistent caching
export async function fetchCalendarEvents(
  accessToken: string,
  calendarId: string,
  timeMin?: string
): Promise<CalendarEvent[]> {
  const minTime = timeMin || new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const buildUrl = () => {
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('timeMin', minTime);
    url.searchParams.set('maxResults', '100');
    return url.toString();
  };

  const executeFetch = async (token: string) => {
    return fetch(buildUrl(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
  };

  let res = await executeFetch(accessToken);

  // If token expired, attempt silent token renewal once and retry
  if (!res.ok && res.status === 401) {
    try {
      const freshToken = await getValidAccessToken(true);
      if (freshToken && freshToken !== accessToken) {
        res = await executeFetch(freshToken);
      }
    } catch (renewErr) {
      console.warn('Auto-renewal during events fetch failed:', renewErr);
    }
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Eroare la descărcarea evenimentelor (${res.status})`);
  }

  const data = await res.json();
  const items: any[] = data.items || [];
  return parseCalendarItems(items);
}

// Create a new event in the user's selected Google calendar
export async function createGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: {
    title: string;
    description?: string;
    location?: string;
    start: string; // ISO
    end: string;   // ISO
  }
): Promise<any> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  const body = {
    summary: event.title,
    description: event.description,
    location: event.location,
    start: {
      dateTime: event.start.includes('T') ? event.start : `${event.start}T09:00:00Z`,
    },
    end: {
      dateTime: event.end.includes('T') ? event.end : `${event.end}T18:00:00Z`,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Eroare la crearea evenimentului în Google Calendar.');
  }

  return await res.json();
}

export async function insertCalendarEvent(accessToken: string, event: CalendarEvent): Promise<any> {
  return createGoogleCalendarEvent(accessToken, 'primary', {
    title: event.title,
    description: event.description,
    location: event.location,
    start: event.start,
    end: event.end || event.start,
  });
}

// Create a dedicated new calendar titled "Patrula Cormoran"
export async function createPatrolCalendar(accessToken: string, summary: string = 'Patrula Cormoran'): Promise<GoogleCalendarItem> {
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary,
      description: 'Calendar oficial pentru ieșirile, taberele și adunările Patrulei Cormoran (Cercetașii Munților).',
      timeZone: 'Europe/Bucharest',
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Nu s-a putut crea calendarul.');
  }

  const cal = await res.json();
  return {
    id: cal.id,
    summary: cal.summary,
    description: cal.description,
    primary: false,
    backgroundColor: '#059669',
    foregroundColor: '#ffffff',
  };
}
