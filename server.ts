import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

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

// Read-only public Google Calendar endpoint (permanent, no OAuth needed)
app.get('/api/calendar/events', async (req, res) => {
  try {
    const calendarId = (req.query.calendarId as string) || process.env.GOOGLE_CALENDAR_ID || 'olteanmatei08@gmail.com';
    const apiKey = (req.query.apiKey as string) || process.env.GOOGLE_CALENDAR_API_KEY || '';
    const icalUrl = (req.query.icalUrl as string) || process.env.GOOGLE_CALENDAR_ICAL_URL || '';
    const timeMin = (req.query.timeMin as string) || new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

    // 1. If Google API Key provided, query Google Calendar API v3 directly
    if (apiKey) {
      try {
        const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${apiKey}&singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(timeMin)}&maxResults=100`;
        const response = await fetch(url, { signal: AbortSignal.timeout(3500) });
        if (response.ok) {
          const data = await response.json();
          const items = (data.items || []).map((item: any) => ({
            id: item.id,
            title: item.summary || 'Eveniment fără nume',
            description: item.description,
            location: item.location,
            start: item.start?.dateTime || item.start?.date || '',
            end: item.end?.dateTime || item.end?.date || '',
            hasTime: !!item.start?.dateTime,
            category: categorizeEvent(item.summary, item.description),
            htmlLink: item.htmlLink,
          }));
          return res.json({ events: items, source: 'google_api' });
        }
      } catch (apiErr) {
        console.warn('Google Calendar API fetch error:', apiErr);
      }
    }

    // 2. If iCal URL is provided or public Google Calendar iCal feed
    const candidateIcalUrl = icalUrl || `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;
    try {
      const icalRes = await fetch(candidateIcalUrl, { signal: AbortSignal.timeout(3500) });
      if (icalRes.ok) {
        const icsText = await icalRes.text();
        const parsed = parseICal(icsText);
        if (parsed.length > 0) {
          return res.json({ events: parsed, source: 'ical' });
        }
      }
    } catch (icalErr) {
      console.warn('iCal fetch error:', icalErr);
    }

    // 3. Fallback: Return empty array so client uses local offline cache
    return res.json({ events: [], source: 'none' });
  } catch (err: any) {
    console.error('Calendar server endpoint error:', err);
    return res.status(500).json({ error: err?.message || 'Eroare calendar' });
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
