import { GOOGLE_OAUTH_CLIENT_ID } from './googleCalendar';

export const DRIVE_SCOPES =
  'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  description?: string;
  modifiedTime?: string;
  size?: string;
}

export function requestGoogleDriveAccess(): Promise<string> {
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

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_OAUTH_CLIENT_ID,
        scope: DRIVE_SCOPES,
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(`Eroare de autorizare Google Drive: ${response.error}`));
            return;
          }
          if (response.access_token) {
            resolve(response.access_token);
          } else {
            reject(new Error('Nu s-a primit niciun token de acces de la Google.'));
          }
        },
      });

      client.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      reject(err);
    }
  });
}

export async function fetchDriveFiles(accessToken: string): Promise<GoogleDriveFile[]> {
  const query = "trashed = false";
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', query);
  url.searchParams.set('pageSize', '50');
  url.searchParams.set(
    'fields',
    'nextPageToken, files(id, name, mimeType, webViewLink, webContentLink, iconLink, thumbnailLink, description, modifiedTime, size)'
  );
  url.searchParams.set('orderBy', 'modifiedTime desc');

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Eroare la accesarea fișierelor din Google Drive (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
}

export function mapMimeTypeToType(mimeType: string): 'doc' | 'sheet' | 'slides' | 'pdf' | 'folder' | 'other' {
  if (mimeType.includes('document')) return 'doc';
  if (mimeType.includes('spreadsheet')) return 'sheet';
  if (mimeType.includes('presentation')) return 'slides';
  if (mimeType.includes('folder')) return 'folder';
  if (mimeType.includes('pdf')) return 'pdf';
  return 'other';
}
