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

// 1. GET CALENDAR EVENTS:
// Returns permanently persisted real events for any phone/device!
app.get('/api/calendar/events', async (req, res) => {
  try {
    // First, check persisted events from file
    const storedEvents = readJsonFile<any[]>(EVENTS_FILE, []);
    if (storedEvents.length > 0) {
      return res.json({ events: storedEvents, source: 'persisted' });
    }

    // If not yet persisted, attempt iCal feed if configured
    const calendarId = (req.query.calendarId as string) || process.env.GOOGLE_CALENDAR_ID || 'olteanmatei08@gmail.com';
    const icalUrl = (req.query.icalUrl as string) || process.env.GOOGLE_CALENDAR_ICAL_URL || `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;
    
    try {
      const icalRes = await fetch(icalUrl, { signal: AbortSignal.timeout(3500) });
      if (icalRes.ok) {
        const icsText = await icalRes.text();
        const parsed = parseICal(icsText);
        if (parsed.length > 0) {
          writeJsonFile(EVENTS_FILE, parsed);
          return res.json({ events: parsed, source: 'ical' });
        }
      }
    } catch {
      // Ignore network timeout
    }

    // Return empty list (NO DEMO EVENTS!)
    return res.json({ events: [], source: 'none' });
  } catch (err: any) {
    console.error('Calendar server endpoint error:', err);
    return res.status(500).json({ error: err?.message || 'Eroare calendar' });
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

// 3. GET DRIVE RESOURCES:
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
