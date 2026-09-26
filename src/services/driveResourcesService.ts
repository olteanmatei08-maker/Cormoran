export interface DriveResourceFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink: string;
  directViewLink: string;
  downloadUrl?: string;
  modifiedTime?: string;
}

export const DRIVE_RESOURCES_CACHE_KEY = 'cormo_drive_folder_resources_cache';
export const DRIVE_FOLDER_ID = '1qwQBgPB3vuCzWi6aor2t8OMZHEExzuXJ';
export const DRIVE_API_KEY = 'AIzaSyAAYnHYz7FZ1INDbjGNdt_Ttt7c4fMEnkw';

// Permanent baseline files so newly installed apps / phones load instantly on launch
export const BASELINE_DRIVE_FILES: DriveResourceFile[] = [
  {
    id: '1hXqLPzMTk1vjCBAF78hn2kE1RF8JdtDa',
    name: 'Carnet de progres',
    mimeType: 'application/pdf',
    size: '3.6 MB',
    webViewLink: 'https://drive.google.com/file/d/1hXqLPzMTk1vjCBAF78hn2kE1RF8JdtDa/view',
    directViewLink: 'https://drive.google.com/file/d/1hXqLPzMTk1vjCBAF78hn2kE1RF8JdtDa/preview',
    downloadUrl: 'https://drive.google.com/uc?export=download&id=1hXqLPzMTk1vjCBAF78hn2kE1RF8JdtDa',
  },
  {
    id: '1hnK6HcltW1dG0K6JC8bnGjBckdaz72wl',
    name: 'Carnet de brevete',
    mimeType: 'application/pdf',
    size: '632 KB',
    webViewLink: 'https://drive.google.com/file/d/1hnK6HcltW1dG0K6JC8bnGjBckdaz72wl/view',
    directViewLink: 'https://drive.google.com/file/d/1hnK6HcltW1dG0K6JC8bnGjBckdaz72wl/preview',
    downloadUrl: 'https://drive.google.com/uc?export=download&id=1hnK6HcltW1dG0K6JC8bnGjBckdaz72wl',
  },
  {
    id: '1wZHYrGqW8Rnogzcs1rDmLRk5gdaKsMF1',
    name: 'Carnet cu rugaciuni.pdf',
    mimeType: 'application/pdf',
    size: '569 KB',
    webViewLink: 'https://drive.google.com/file/d/1wZHYrGqW8Rnogzcs1rDmLRk5gdaKsMF1/view',
    directViewLink: 'https://drive.google.com/file/d/1wZHYrGqW8Rnogzcs1rDmLRk5gdaKsMF1/preview',
    downloadUrl: 'https://drive.google.com/uc?export=download&id=1wZHYrGqW8Rnogzcs1rDmLRk5gdaKsMF1',
  },
  {
    id: '1fh1z2iOAG52tmzvXX9D6kAhZyZGubGql',
    name: 'Carnet Cercetas Ales',
    mimeType: 'application/pdf',
    size: '1 MB',
    webViewLink: 'https://drive.google.com/file/d/1fh1z2iOAG52tmzvXX9D6kAhZyZGubGql/view',
    directViewLink: 'https://drive.google.com/file/d/1fh1z2iOAG52tmzvXX9D6kAhZyZGubGql/preview',
    downloadUrl: 'https://drive.google.com/uc?export=download&id=1fh1z2iOAG52tmzvXX9D6kAhZyZGubGql',
  },
  {
    id: '1HcPLmU_H0qJBMJSr5GB28uIASIfWvWbM',
    name: 'CEREMONIAL ACM',
    mimeType: 'application/pdf',
    size: '2.9 MB',
    webViewLink: 'https://drive.google.com/file/d/1HcPLmU_H0qJBMJSr5GB28uIASIfWvWbM/view',
    directViewLink: 'https://drive.google.com/file/d/1HcPLmU_H0qJBMJSr5GB28uIASIfWvWbM/preview',
    downloadUrl: 'https://drive.google.com/uc?export=download&id=1HcPLmU_H0qJBMJSr5GB28uIASIfWvWbM',
  },
];

// Load files instantaneously from localStorage
export function getCachedDriveFiles(): DriveResourceFile[] {
  try {
    const raw = localStorage.getItem(DRIVE_RESOURCES_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Eroare citire cache resurse drive:', err);
  }

  saveCachedDriveFiles(BASELINE_DRIVE_FILES);
  return BASELINE_DRIVE_FILES;
}

// Persist files in localStorage
export function saveCachedDriveFiles(files: DriveResourceFile[]) {
  try {
    localStorage.setItem(DRIVE_RESOURCES_CACHE_KEY, JSON.stringify(files));
  } catch {
    // Ignore quota errors
  }
}

// Live fetch function called on mount and every 60 seconds
export async function fetchLiveDriveFolderFiles(): Promise<DriveResourceFile[]> {
  try {
    const res = await fetch(`/api/drive/files?_t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache' },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.files) && data.files.length > 0) {
        saveCachedDriveFiles(data.files);
        return data.files;
      }
    }
  } catch (err) {
    console.warn('Eroare la actualizarea fișierelor din Google Drive:', err);
  }

  return getCachedDriveFiles();
}
