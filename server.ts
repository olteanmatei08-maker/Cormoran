import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Data storage paths
const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const EVENTS_FILE = path.join(DATA_DIR, 'calendar_events.json');
const RESOURCES_FILE = path.join(DATA_DIR, 'drive_resources.json');

// Helper to safely read JSON file
function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

// Helper to safely write JSON file
function writeJsonFile<T>(filePath: string, data: T): boolean {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// Helper function to categorize events
function categorizeEvent(summary = '', description = '') {
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

function parseICalDate(dStr: string): { dateStr: string; hasTime: boolean } {
  if (!dStr) return { dateStr: '', hasTime: false };
  const clean = dStr.replace(/[^0-9TZ]/g, '');
  if (clean.length === 8) {
    const y = clean.substring(0, 4);
    const m = clean.substring(4, 6);
    const d = clean.substring(6, 8);
    return { dateStr: `${y}-${m}-${d}`, hasTime: false };
  }
  if (clean.length >= 15) {
    const y = clean.substring(0, 4);
    const m = clean.substring(4, 6);
    const d = clean.substring(6, 8);
    const h = clean.substring(9, 11);
    const min = clean.substring(11, 13);
    const s = clean.substring(13, 15);
    const isUtc = clean.endsWith('Z');
    const iso = `${y}-${m}-${d}T${h}:${min}:${s}${isUtc ? 'Z' : ''}`;
    return { dateStr: iso, hasTime: true };
  }
  return { dateStr: dStr, hasTime: false };
}

function parseICal(ics: string) {
  const events = [];
  const entries = ics.split(/BEGIN:VEVENT\r?\n/);
  for (let i = 1; i < entries.length; i++) {
    const block = entries[i].split(/END:VEVENT/)[0];
    const getField = (name: string) => {
      const match = block.match(new RegExp(`(?:^|\\r?\\n)${name}(?:;[^:]*)?:(.*)(?:\\r?\\n|$)`));
      return match ? match[1].trim().replace(/\\,/g, ',').replace(/\\n/g, '\n').replace(/\\;/g, ';') : '';
    };

    const uid = getField('UID') || `ical-${i}-${Date.now()}`;
    const summary = getField('SUMMARY') || 'Eveniment Patrulă';
    const description = getField('DESCRIPTION');
    const location = getField('LOCATION');
    const dtstartRaw = getField('DTSTART');
    const dtendRaw = getField('DTEND') || dtstartRaw;

    const startParsed = parseICalDate(dtstartRaw);
    const endParsed = parseICalDate(dtendRaw);

    if (startParsed.dateStr) {
      events.push({
        id: uid,
        title: summary,
        description: description || undefined,
        location: location || undefined,
        start: startParsed.dateStr,
        end: endParsed.dateStr || startParsed.dateStr,
        hasTime: startParsed.hasTime,
        category: categorizeEvent(summary, description),
      });
    }
  }
  return events;
}

let lastCalendarFetchTime = 0;
let cachedCalendarEvents: any[] = [];

async function fetchLiveGoogleCalendarEvents(calendarId: string): Promise<any[]> {
  const now = Date.now();
  // 10-second throttle for super-fast live updates from Google Calendar
  if (cachedCalendarEvents.length > 0 && now - lastCalendarFetchTime < 10000) {
    return cachedCalendarEvents;
  }

  const agendaUrl = `https://calendar.google.com/calendar/htmlembed?src=${encodeURIComponent(
    calendarId
  )}&mode=AGENDA&_t=${now}`;

  try {
    const res = await fetch(agendaUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      throw new Error(`Google Calendar agenda HTTP ${res.status}`);
    }

    const html = await res.text();
    const eventLinkRegex = /href="event\?eid=([^"&]+)[^"]*"/g;
    const eids: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = eventLinkRegex.exec(html)) !== null) {
      if (!eids.includes(match[1])) {
        eids.push(match[1]);
      }
    }

    if (eids.length > 0) {
      const fetchedEvents: any[] = [];
      for (const eid of eids) {
        const eventUrl = `https://calendar.google.com/calendar/event?eid=${eid}`;
        try {
          const evRes = await fetch(eventUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept-Language': 'ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7',
            },
            signal: AbortSignal.timeout(3000),
          });

          if (evRes.ok) {
            const evHtml = await evRes.text();
            const idMatch = evHtml.match(/content="([a-zA-Z0-9_-]{10,})"/);
            const nameMatch = evHtml.match(/itemprop="name"[^>]*>([^<]+)<\/span>/);
            const startMatch = evHtml.match(/itemprop="startDate"\s+datetime="([^"]+)"/);
            const endMatch = evHtml.match(/itemprop="endDate"\s+datetime="([^"]+)"/);
            const locMatch = evHtml.match(
              /itemprop="location"[^>]*>[\s\S]*?<span itemprop="name"[^>]*>([^<]+)<\/span>/
            );
            const descMatch = evHtml.match(/itemprop="description"[^>]*>([\s\S]*?)<\/span>/);

            let id = idMatch ? idMatch[1] : null;
            if (!id) {
              try {
                id = Buffer.from(eid.split(' ')[0], 'base64').toString('utf-8').split(' ')[0];
              } catch {
                id = eid;
              }
            }

            const title = nameMatch ? nameMatch[1].trim() : 'Eveniment';
            const location = locMatch ? locMatch[1].trim() : undefined;
            const description = descMatch ? descMatch[1].trim() : undefined;

            const parseGCalTime = (s: string | null) => {
              if (!s) return '';
              if (s.includes('T')) {
                const y = s.slice(0, 4);
                const m = s.slice(4, 6);
                const d = s.slice(6, 8);
                const h = s.slice(9, 11);
                const min = s.slice(11, 13);
                const sec = s.slice(13, 15);
                return new Date(Date.UTC(+y, +m - 1, +d, +h, +min, +sec)).toISOString();
              } else {
                const y = s.slice(0, 4);
                const m = s.slice(4, 6);
                const d = s.slice(6, 8);
                return `${y}-${m}-${d}`;
              }
            };

            const start = parseGCalTime(startMatch ? startMatch[1] : null);
            const end = parseGCalTime(endMatch ? endMatch[1] : null);

            fetchedEvents.push({
              id,
              title,
              location,
              description,
              start,
              end: end || start,
              hasTime: start.includes('T'),
              category: 'adunare',
              htmlLink: `https://www.google.com/calendar/event?eid=${eid}`,
            });
          }
        } catch {
          // Continue to next event
        }
      }

      if (fetchedEvents.length > 0) {
        cachedCalendarEvents = fetchedEvents;
        lastCalendarFetchTime = now;
        writeJsonFile(EVENTS_FILE, fetchedEvents);
        return fetchedEvents;
      }
    }
  } catch (err: any) {
    console.warn('Live calendar sync error:', err?.message);
  }

  const stored = readJsonFile<any[]>(EVENTS_FILE, []);
  if (stored.length > 0) {
    cachedCalendarEvents = stored;
    return stored;
  }
  return cachedCalendarEvents;
}

// 1. GET CALENDAR EVENTS:
// Returns permanently persisted real events for any phone/device with 10s auto-sync!
app.get('/api/calendar/events', async (_req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'olteanmatei08@gmail.com';
    const events = await fetchLiveGoogleCalendarEvents(calendarId);
    return res.json({ events, source: 'live', timestamp: Date.now() });
  } catch (err: any) {
    console.error('Calendar server endpoint error:', err);
    const stored = readJsonFile<any[]>(EVENTS_FILE, []);
    return res.json({ events: stored, source: 'persisted', error: err?.message });
  }
});

// 2. POST CALENDAR SYNC:
// Receives imported real events from Google Calendar API and persists them permanently for all devices!
app.post('/api/calendar/sync', (req, res) => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Array-ul de evenimente este invalid.' });
    }

    // Filter out any dummy or demo events
    const cleanEvents = events.filter((ev: any) => {
      const id = String(ev.id || '');
      return !id.startsWith('cormo-event-') && !id.startsWith('demo-');
    });

    writeJsonFile(EVENTS_FILE, cleanEvents);
    console.log(`[Google Sync] Salvate ${cleanEvents.length} evenimente reale din calendar.`);
    return res.json({ success: true, count: cleanEvents.length, events: cleanEvents });
  } catch (err: any) {
    console.error('Eroare salvare evenimente:', err);
    return res.status(500).json({ error: err?.message || 'Eroare server la sincronizare' });
  }
});

// GET ICS FOR SINGLE EVENT (NATIVE DEVICE CALENDAR IMPORT)
app.get('/api/calendar/event/:id/ics', (req, res) => {
  try {
    const { id } = req.params;
    const storedEvents = readJsonFile<any[]>(EVENTS_FILE, []);
    const event = storedEvents.find((e) => e.id === id);
    if (!event) {
      return res.status(404).send('Evenimentul nu a fost găsit');
    }

    const formatIcsDate = (dStr: string) => {
      const d = new Date(dStr);
      return isNaN(d.getTime()) ? '' : d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const start = formatIcsDate(event.start);
    const end = formatIcsDate(event.end || event.start);

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Patrula Cormoran//RO',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${event.id}@patrulacormoran.ro`,
      `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${event.title || 'Eveniment Patrulă'}`,
      event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
      event.location ? `LOCATION:${event.location}` : '',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');

    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="${encodeURIComponent(event.title || 'eveniment')}.ics"`,
      'Cache-Control': 'no-cache',
    });
    return res.send(icsContent);
  } catch (err: any) {
    return res.status(500).send('Eroare generare calendar');
  }
});

// Helper to fetch Google Drive folder files
async function fetchDriveFolderFiles(folderId: string, apiKey: string) {
  // 1. First try Google Drive API v3
  try {
    const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
    const apiUrl = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,webViewLink,webContentLink,size,modifiedTime)&key=${apiKey}`;
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.files)) {
        return data.files.map((f: any) => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType || 'application/octet-stream',
          webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
          directViewLink: `https://drive.google.com/file/d/${f.id}/preview`,
          downloadUrl: `https://drive.google.com/uc?export=download&id=${f.id}`,
          size: f.size ? formatBytes(Number(f.size)) : undefined,
          modifiedTime: f.modifiedTime,
        }));
      }
    }
  } catch (err: any) {
    console.warn('Drive API direct request failed:', err?.message);
  }

  // 2. Fetch public HTML view of folder
  try {
    const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;
    const res = await fetch(folderUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const html = await res.text();
      const callbacks = html.match(/AF_initDataCallback\(\{.*?\}\);/gs) || [];
      const files: any[] = [];

      for (const cb of callbacks) {
        const jsonMatch = cb.match(/data:\s*(\[.*?\])\s*,\s*sideChannel:/s);
        if (!jsonMatch) continue;
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          function searchNodes(node: any) {
            if (!node || !Array.isArray(node)) return;
            let fileId: string | null = null;
            let fileName: string | null = null;
            let mimeType: string | null = null;
            let size: string | null = null;

            function extractFromItem(n: any) {
              if (!n || !Array.isArray(n)) return;
              if (n[1] === 'Download' && Array.isArray(n[5]) && n[5][0] && typeof n[5][0][1] === 'string') {
                fileId = n[5][0][1];
              }
              if (Array.isArray(n) && typeof n[0] === 'string' && n[0].includes('application/')) {
                mimeType = n[0];
              }
              if (n[0] === 16 && Array.isArray(n[2])) {
                const possibleName = n[2]?.[1]?.[0]?.[0]?.[0];
                if (typeof possibleName === 'string' && possibleName.length > 0) {
                  fileName = possibleName;
                }
              }
              if (n[0] === 1 && Array.isArray(n[2])) {
                const possibleSize = n[2]?.[1]?.[0]?.[0]?.[0];
                if (typeof possibleSize === 'string') size = possibleSize;
              }
              n.forEach(extractFromItem);
            }

            extractFromItem(node);
            if (fileId && fileName && !files.some((f) => f.id === fileId)) {
              files.push({
                id: fileId,
                name: fileName,
                mimeType: mimeType || 'application/pdf',
                size: size || undefined,
                webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
                directViewLink: `https://drive.google.com/file/d/${fileId}/preview`,
                downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
              });
            }
            node.forEach(searchNodes);
          }
          searchNodes(parsed);
        } catch {
          // Ignore parse errors on individual callbacks
        }
      }

      if (files.length > 0) {
        return files.reverse();
      }
    }
  } catch (err: any) {
    console.warn('Folder HTML scraping error:', err?.message);
  }

  return [];
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// 3. GET DRIVE RESOURCES (LIVE FOLDER SYNC):
// Interoghează live dosarul Google Drive 1qwQBgPB3vuCzWi6aor2t8OMZHEExzuXJ
app.get('/api/drive/files', async (_req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  const folderId = '1qwQBgPB3vuCzWi6aor2t8OMZHEExzuXJ';
  const apiKey = process.env.GOOGLE_API_KEY || 'AIzaSyAAYnHYz7FZ1INDbjGNdt_Ttt7c4fMEnkw';

  try {
    const liveFiles = await fetchDriveFolderFiles(folderId, apiKey);
    if (liveFiles.length > 0) {
      writeJsonFile(RESOURCES_FILE, liveFiles);
      return res.json({ files: liveFiles, source: 'live', timestamp: Date.now() });
    }

    // Fallback to persisted file if live fetch had temporary network timeout
    const stored = readJsonFile<any[]>(RESOURCES_FILE, []);
    return res.json({ files: stored, source: 'persisted', timestamp: Date.now() });
  } catch (err: any) {
    console.error('Eroare /api/drive/files:', err);
    const stored = readJsonFile<any[]>(RESOURCES_FILE, []);
    return res.json({ files: stored, source: 'persisted', error: err?.message });
  }
});

// 4. GET DRIVE RESOURCES:
// Returns permanently persisted real Google Drive files for all devices!
app.get('/api/resources', (_req, res) => {
  try {
    const stored = readJsonFile<any[]>(RESOURCES_FILE, []);
    return res.json({ resources: stored });
  } catch (err: any) {
    console.error('Eroare citire resurse:', err);
    return res.status(500).json({ error: err?.message || 'Eroare citire resurse' });
  }
});

// 4. POST DRIVE RESOURCES SYNC:
// Receives imported real Google Drive files and persists them permanently!
app.post('/api/resources/sync', (req, res) => {
  try {
    const { resources } = req.body;
    if (!Array.isArray(resources)) {
      return res.status(400).json({ error: 'Array-ul de resurse este invalid.' });
    }

    // Filter out sample/dummy files
    const cleanResources = resources.filter((r: any) => {
      const url = String(r.driveUrl || '');
      const id = String(r.id || '');
      return !url.includes('1sample-') && !id.startsWith('res-1') && !id.startsWith('res-2') && !id.startsWith('res-3');
    });

    writeJsonFile(RESOURCES_FILE, cleanResources);
    console.log(`[Google Sync] Salvate ${cleanResources.length} resurse reale din Google Drive.`);
    return res.json({ success: true, count: cleanResources.length, resources: cleanResources });
  } catch (err: any) {
    console.error('Eroare salvare resurse:', err);
    return res.status(500).json({ error: err?.message || 'Eroare server la salvare resurse' });
  }
});

// Chat endpoint for Patrula Cormoran AI Sfetnic
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, systemInstruction, model } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY lipsește din variabilele de mediu.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const selectedModel = model || 'models/gemini-3.8-flash';

    const contents = (messages || []).map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || '' }],
    }));

    try {
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config: systemInstruction ? { systemInstruction } : undefined,
      });
      return res.json({ reply: response.text || '' });
    } catch (primaryErr: any) {
      console.warn(`Primary model ${selectedModel} failed, trying gemini-2.5-flash fallback:`, primaryErr?.message);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: systemInstruction ? { systemInstruction } : undefined,
      });
      return res.json({ reply: fallbackResponse.text || '' });
    }
  } catch (err: any) {
    console.error('Gemini server error:', err);
    return res.status(500).json({ error: err?.message || 'A apărut o eroare la procesarea cererii către asistent.' });
  }
});

// Vite middleware in dev or static files in production
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Server Cormo pornit pe http://0.0.0.0:${port}`);
});
