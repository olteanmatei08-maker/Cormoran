import { CalendarEvent } from '../types';
import { DriveResource } from '../pages/ResourcesPage';

export const GOOGLE_OAUTH_CLIENT_ID =
  '979902519749-olg16cltl2ik5g5h1hv8ci13s1jb2ua3.apps.googleusercontent.com';

export const GOOGLE_SYNC_SCOPES =
  'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/drive.readonly';

export const USER_EMAIL_HINT = 'olteanmatei08@gmail.com';

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

function mapMimeTypeToType(mimeType: string): 'doc' | 'sheet' | 'slides' | 'pdf' | 'folder' | 'other' {
  if (mimeType.includes('document')) return 'doc';
  if (mimeType.includes('spreadsheet')) return 'sheet';
  if (mimeType.includes('presentation')) return 'slides';
  if (mimeType.includes('folder')) return 'folder';
  if (mimeType.includes('pdf')) return 'pdf';
  return 'other';
}

function categorizeResource(title: string): 'tehnici' | 'cantice' | 'tabere' | 'regulament' | 'diverse' {
  const lower = title.toLowerCase();
  if (lower.includes('nod') || lower.includes('brevet') || lower.includes('progres') || lower.includes('tehnic') || lower.includes('morse')) {
    return 'tehnici';
  }
  if (lower.includes('cantec') || lower.includes('cântec') || lower.includes('chitara') || lower.includes('chitară')) {
    return 'cantice';
  }
  if (lower.includes('tabara') || lower.includes('tabără') || lower.includes('camp') || lower.includes('cort')) {
    return 'tabere';
  }
  if (lower.includes('ceremonial') || lower.includes('promisiune') || lower.includes('regulament') || lower.includes('ales') || lower.includes('lege')) {
    return 'regulament';
  }
  return 'diverse';
}

// Request OAuth token from Google Identity Services
export function requestGoogleAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      reject(
        new Error(
          'Serviciul Google nu s-a încărcat încă. Vă rugăm să reîncărcați pagina sau să verificați conexiunea.'
        )
      );
      return;
    }

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_OAUTH_CLIENT_ID,
        scope: GOOGLE_SYNC_SCOPES,
        hint: USER_EMAIL_HINT,
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(`Eroare autentificare Google: ${response.error}`));
            return;
          }
          if (response.access_token) {
            resolve(response.access_token);
          } else {
            reject(new Error('Nu s-a primit token de acces de la Google.'));
          }
        },
      });

      client.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      reject(err);
    }
  });
}

// Fetch calendar events from Google API using active token
export async function fetchUserGoogleCalendarEvents(accessToken: string): Promise<CalendarEvent[]> {
  const timeMin = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(timeMin)}&maxResults=250`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Eroare Google Calendar (${res.status})`);
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

// Fetch user Drive files from Google API using active token
export async function fetchUserGoogleDriveFiles(accessToken: string): Promise<DriveResource[]> {
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', 'trashed = false');
  url.searchParams.set('pageSize', '100');
  url.searchParams.set(
    'fields',
    'files(id, name, mimeType, webViewLink, webContentLink, iconLink, thumbnailLink, description, modifiedTime, size)'
  );
  url.searchParams.set('orderBy', 'modifiedTime desc');

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Eroare Google Drive (${res.status})`);
  }

  const data = await res.json();
  const files = data.files || [];

  return files.map((file: any) => ({
    id: file.id,
    title: file.name,
    driveUrl: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
    category: categorizeResource(file.name),
    type: mapMimeTypeToType(file.mimeType || ''),
    description: file.description || undefined,
    createdAt: file.modifiedTime || new Date().toISOString(),
  }));
}

// Complete synchronization: imports from user's Google Account and saves permanently to server + localStorage
export async function syncGoogleAccountData(): Promise<{
  eventsCount: number;
  resourcesCount: number;
}> {
  const token = await requestGoogleAccessToken();

  // 1. Fetch real events from Google Calendar
  const events = await fetchUserGoogleCalendarEvents(token);

  // 2. Fetch real documents from Google Drive
  const resources = await fetchUserGoogleDriveFiles(token);

  // 3. Save permanently to backend server so EVERY phone/device gets the real data immediately
  try {
    await fetch('/api/calendar/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    });

    await fetch('/api/resources/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resources }),
    });
  } catch (err) {
    console.warn('Eroare salvare date pe server:', err);
  }

  // 4. Save to local storage for offline use
  try {
    localStorage.setItem('cormo_patrol_events_cache', JSON.stringify(events));
    localStorage.setItem('cormo_patrol_drive_resources', JSON.stringify(resources));
  } catch (err) {
    console.warn('Eroare salvare date local:', err);
  }

  // 5. Notify UI to re-render immediately
  window.dispatchEvent(new CustomEvent('cormo_events_updated', { detail: events }));
  window.dispatchEvent(new CustomEvent('cormo_resources_updated', { detail: resources }));

  return {
    eventsCount: events.length,
    resourcesCount: resources.length,
  };
}
