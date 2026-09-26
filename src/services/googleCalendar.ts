import { CalendarEvent } from '../types';

export const EVENTS_CACHE_KEY = 'cormo_patrol_events_cache';
export const CALENDAR_ID_STORAGE_KEY = 'cormo_public_calendar_id';
export const DEFAULT_CALENDAR_ID = 'olteanmatei08@gmail.com';

// Purge any legacy demo events if present in cache
function filterOutDemoEvents(events: CalendarEvent[]): CalendarEvent[] {
  if (!Array.isArray(events)) return [];
  return events.filter((e) => {
    const id = String(e.id || '');
    return !id.startsWith('cormo-event-') && !id.startsWith('demo-');
  });
}

// Immediately load cached events from localStorage (strictly real events only)
export function getCachedCalendarEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = filterOutDemoEvents(parsed);
        if (cleaned.length !== parsed.length) {
          saveCachedCalendarEvents(cleaned);
        }
        return cleaned;
      }
    }
  } catch (err) {
    console.warn('Eroare citire evenimente din cache:', err);
  }

  return [];
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

// Fetch events from server storage (permanent cross-device sync, no login needed on other phones)
export async function fetchServerCalendarEvents(): Promise<{
  events: CalendarEvent[];
  updated: boolean;
}> {
  try {
    const res = await fetch('/api/calendar/events');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.events)) {
        const cleaned = filterOutDemoEvents(data.events);
        saveCachedCalendarEvents(cleaned);
        return { events: cleaned, updated: true };
      }
    }
  } catch (err) {
    console.warn('Eroare citire evenimente de pe server:', err);
  }

  const cached = getCachedCalendarEvents();
  return { events: cached, updated: false };
}
