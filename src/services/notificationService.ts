import { CalendarEvent } from '../types';

const NOTIFIED_STORAGE_KEY = 'cormo_notified_events_v2';
const PROMPT_DISMISSED_KEY = 'cormo_notification_prompt_dismissed';
const NOTIFICATIONS_ENABLED_KEY = 'cormo_notifications_active_toggle';
const PREFERRED_TIME_KEY = 'cormo_notification_preferred_time';
const EVENT_SNAPSHOTS_KEY = 'cormo_events_snapshot_v2';
export const DEFAULT_PREFERRED_TIME = '09:00';

export interface NotificationAlert {
  id: string;
  eventId: string;
  type: '7d' | '1d' | 'date_set' | 'location_set' | 'both_set';
  title: string;
  body: string;
  eventDate: string;
  eventTime: string | null;
  location?: string | null;
  timestamp: number;
}

interface EventSnapshot {
  id: string;
  title: string;
  start: string;
  hasTime: boolean;
  hasDate: boolean;
  hasLocation: boolean;
  location: string;
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export function areNotificationsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
  if (stored === null) return true; // Enabled by default
  return stored === 'true';
}

export function setNotificationsEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false');
}

export function getPreferredNotificationTime(): string {
  if (typeof window === 'undefined') return DEFAULT_PREFERRED_TIME;
  const stored = localStorage.getItem(PREFERRED_TIME_KEY);
  if (!stored || !stored.includes(':')) {
    return DEFAULT_PREFERRED_TIME;
  }
  return stored;
}

export function setPreferredNotificationTime(time: string) {
  if (typeof window === 'undefined') return;
  const valid = time && time.includes(':') ? time : DEFAULT_PREFERRED_TIME;
  localStorage.setItem(PREFERRED_TIME_KEY, valid);
}

export function isPromptDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(PROMPT_DISMISSED_KEY) === 'true';
}

export function setPromptDismissed(dismissed: boolean = true) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROMPT_DISMISSED_KEY, dismissed ? 'true' : 'false');
}

// Register service worker if supported
let swRegistration: ServiceWorkerRegistration | null = null;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    swRegistration = reg;
    return reg;
  } catch (err) {
    console.warn('Service worker registration failed:', err);
    return null;
  }
}

// Request permission from the user
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerServiceWorker();
    }
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return getNotificationPermission();
  }
}

// Check if a string is a placeholder indicating "not yet established"
export function isPlaceholderText(text?: string | null): boolean {
  if (!text) return true;
  const cleaned = text.trim().toLowerCase();
  if (cleaned.length === 0) return true;

  const placeholders = [
    'de stabilit',
    'nestabilit',
    'nestabilita',
    'nestabilită',
    'tba',
    'tbd',
    'nedecis',
    'in curand',
    'în curând',
    'urmeaza sa fie anuntat',
    'urmează să fie anunțat',
    'fara locatie',
    'fără locație',
    'fara ora',
    'fără oră',
    'fara data',
    'fără dată',
    '-',
    '--',
    '?',
  ];

  return placeholders.some((p) => cleaned.includes(p));
}

// Format event time ONLY if specific time was set. Returns null for all-day events.
export function getEventTimeFormatted(ev: CalendarEvent): string | null {
  if (ev.hasTime === false || !ev.start.includes('T') || ev.start.length === 10) {
    return null;
  }

  try {
    const startDate = new Date(ev.start);
    if (isNaN(startDate.getTime())) return null;

    const startFormatted = startDate.toLocaleTimeString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (ev.end && ev.end.includes('T')) {
      const endDate = new Date(ev.end);
      if (!isNaN(endDate.getTime())) {
        const endFormatted = endDate.toLocaleTimeString('ro-RO', {
          hour: '2-digit',
          minute: '2-digit',
        });
        if (startFormatted !== endFormatted) {
          return `${startFormatted} – ${endFormatted}`;
        }
      }
    }

    return startFormatted;
  } catch {
    return null;
  }
}

// Format friendly date in Romanian
export function getEventDateFormatted(dateStr: string): string {
  try {
    let d: Date;
    if (dateStr.length === 10 && dateStr.includes('-')) {
      const [y, m, day] = dateStr.split('-').map(Number);
      d = new Date(y, m - 1, day);
    } else {
      d = new Date(dateStr);
    }
    if (isNaN(d.getTime())) return dateStr;

    return d.toLocaleDateString('ro-RO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  } catch {
    return dateStr;
  }
}

// Calculate diff in calendar days between today (00:00) and event start date (00:00)
export function getDaysUntilEvent(dateStr: string): number | null {
  try {
    let targetDate: Date;
    if (dateStr.length === 10 && dateStr.includes('-')) {
      const [y, m, d] = dateStr.split('-').map(Number);
      targetDate = new Date(y, m - 1, d);
    } else {
      targetDate = new Date(dateStr);
    }

    if (isNaN(targetDate.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventDay = new Date(targetDate);
    eventDay.setHours(0, 0, 0, 0);

    const diffMs = eventDay.getTime() - today.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

function getNotifiedRecord(): Record<string, number> {
  try {
    const raw = localStorage.getItem(NOTIFIED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function markAsNotified(key: string) {
  try {
    const current = getNotifiedRecord();
    current[key] = Date.now();
    localStorage.setItem(NOTIFIED_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage issues
  }
}

function getStoredSnapshots(): Record<string, EventSnapshot> {
  try {
    const raw = localStorage.getItem(EVENT_SNAPSHOTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredSnapshots(snapshots: Record<string, EventSnapshot>) {
  try {
    localStorage.setItem(EVENT_SNAPSHOTS_KEY, JSON.stringify(snapshots));
  } catch {
    // Ignore storage issues
  }
}

// Send a system native notification (mobile push / service worker / browser)
export async function sendNativeNotification(title: string, options: NotificationOptions): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions: any = {
    icon: '/cormoran_emblem.png',
    badge: '/cormoran_emblem.png',
    // Custom scout vibration pattern on mobile phones: vibrate 200ms, pause 100ms, vibrate 200ms
    vibrate: [200, 100, 200],
    data: {
      url: '/#calendar',
      tab: 'calendar',
    },
    ...options,
  };

  try {
    // Prefer service worker showNotification for mobile PWA support (Android / iOS)
    if (!swRegistration && 'serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      swRegistration = reg || null;
    }

    if (swRegistration && 'showNotification' in swRegistration) {
      await swRegistration.showNotification(title, notificationOptions);
      return true;
    }

    // Fallback to standard desktop Notification API
    const notif = new Notification(title, notificationOptions);
    notif.onclick = () => {
      window.focus();
      window.location.hash = 'calendar';
      window.dispatchEvent(new CustomEvent('cormo_navigate_tab', { detail: 'calendar' }));
    };
    return true;
  } catch (err) {
    console.warn('Native notification failed, attempting standard API:', err);
    try {
      const notif = new Notification(title, notificationOptions);
      notif.onclick = () => {
        window.focus();
        window.location.hash = 'calendar';
        window.dispatchEvent(new CustomEvent('cormo_navigate_tab', { detail: 'calendar' }));
      };
      return true;
    } catch {
      return false;
    }
  }
}

// In-app alert subscriber system
type AlertListener = (alerts: NotificationAlert[]) => void;
const listeners: Set<AlertListener> = new Set();
let cachedActiveAlerts: NotificationAlert[] = [];

export function subscribeToAlerts(listener: AlertListener): () => void {
  listeners.add(listener);
  listener(cachedActiveAlerts);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(alerts: NotificationAlert[]) {
  cachedActiveAlerts = alerts;
  listeners.forEach((fn) => fn(alerts));
}

export function getActiveReminders(): NotificationAlert[] {
  return cachedActiveAlerts;
}

/**
 * Main logic:
 * 1. Checks 7-day and 1-day reminders.
 * 2. Checks if an event that previously lacked date, time, or location now has them established!
 *    Dispatches instant notification to phone:
 *    - Date / Time set
 *    - Location set
 *    - Both Date & Location set
 */
export async function checkAndDispatchEventNotifications(
  events: CalendarEvent[]
): Promise<NotificationAlert[]> {
  if (!events || events.length === 0) return [];

  const notifiedRecord = getNotifiedRecord();
  const previousSnapshots = getStoredSnapshots();
  const isFirstSnapshotRun = Object.keys(previousSnapshots).length === 0;

  const currentAlerts: NotificationAlert[] = [];
  const updatedSnapshots: Record<string, EventSnapshot> = {};

  const permission = getNotificationPermission();
  const notificationsEnabled = areNotificationsEnabled();

  // Check preferred delivery time for 7d/1d reminders (default: 09:00)
  const prefTime = getPreferredNotificationTime();
  const [prefHourStr, prefMinStr] = prefTime.split(':');
  const prefHour = parseInt(prefHourStr, 10);
  const prefMin = parseInt(prefMinStr, 10);

  const now = new Date();
  const currentTotalMin = now.getHours() * 60 + now.getMinutes();
  const prefTotalMin = (isNaN(prefHour) ? 9 : prefHour) * 60 + (isNaN(prefMin) ? 0 : prefMin);
  const isTimeToSendScheduled = currentTotalMin >= prefTotalMin;

  for (const ev of events) {
    const timeStr = getEventTimeFormatted(ev);
    const hasExactTime = !!(ev.hasTime && ev.start.includes('T') && timeStr);
    const hasDateValue = !!(ev.start && !isNaN(new Date(ev.start).getTime()));
    const isDatePlaceholder = isPlaceholderText(ev.start) || isPlaceholderText(ev.title);
    const hasValidConfirmedDate = hasDateValue && !isDatePlaceholder;

    const hasLocation = !!(ev.location && ev.location.trim().length > 0 && !isPlaceholderText(ev.location));
    const locationClean = hasLocation ? ev.location!.trim() : '';

    const currentSnapshot: EventSnapshot = {
      id: ev.id,
      title: ev.title,
      start: ev.start,
      hasTime: hasExactTime,
      hasDate: hasValidConfirmedDate,
      hasLocation,
      location: locationClean,
    };
    updatedSnapshots[ev.id] = currentSnapshot;

    // Check if details were established compared to previous snapshot
    if (!isFirstSnapshotRun && previousSnapshots[ev.id]) {
      const prev = previousSnapshots[ev.id];

      // Did location get newly established?
      const locationNewlySet = !prev.hasLocation && hasLocation;

      // Did time get newly established (was all-day or lacked time, now has specific hour)?
      const timeNewlySet = !prev.hasTime && hasExactTime;

      // Did date get newly established (was placeholder/unconfirmed, now confirmed)?
      const dateNewlySet = !prev.hasDate && hasValidConfirmedDate;

      const dateOrTimeNewlySet = dateNewlySet || timeNewlySet;

      // Determine scenario:
      if (dateOrTimeNewlySet && locationNewlySet) {
        // SCENARIO 1: BOTH Date/Time AND Location established!
        const key = `update_both_${ev.id}_${ev.start}_${locationClean}`;
        const formattedDate = getEventDateFormatted(ev.start);
        const timePart = timeStr ? ` la ora ${timeStr}` : '';
        const title = `Patrula Cormoran • Detalii Stabilite`;
        const body = `La evenimentul „${ev.title}” s-a stabilit data (${formattedDate}${timePart}) și locul (${locationClean})!`;

        const alertItem: NotificationAlert = {
          id: key,
          eventId: ev.id,
          type: 'both_set',
          title,
          body,
          eventDate: ev.start,
          eventTime: timeStr,
          location: locationClean,
          timestamp: Date.now(),
        };
        currentAlerts.push(alertItem);

        if (notificationsEnabled && !notifiedRecord[key] && permission === 'granted') {
          const sent = await sendNativeNotification(title, {
            body,
            tag: key,
          });
          if (sent) markAsNotified(key);
        }
      } else if (dateOrTimeNewlySet) {
        // SCENARIO 2: Date or Time established!
        const key = `update_datetime_${ev.id}_${ev.start}_${timeStr || 'allday'}`;
        const formattedDate = getEventDateFormatted(ev.start);
        const title = timeNewlySet ? `Patrula Cormoran • Oră Stabilită` : `Patrula Cormoran • Dată Stabilită`;
        const body = timeNewlySet
          ? `La evenimentul „${ev.title}” s-a stabilit ora: ${timeStr} (${formattedDate}).`
          : `La evenimentul „${ev.title}” s-a stabilit data: ${formattedDate}${timeStr ? ` la ora ${timeStr}` : ''}.`;

        const alertItem: NotificationAlert = {
          id: key,
          eventId: ev.id,
          type: 'date_set',
          title,
          body,
          eventDate: ev.start,
          eventTime: timeStr,
          location: locationClean || null,
          timestamp: Date.now(),
        };
        currentAlerts.push(alertItem);

        if (notificationsEnabled && !notifiedRecord[key] && permission === 'granted') {
          const sent = await sendNativeNotification(title, {
            body,
            tag: key,
          });
          if (sent) markAsNotified(key);
        }
      } else if (locationNewlySet) {
        // SCENARIO 3: Location established!
        const key = `update_loc_${ev.id}_${locationClean}`;
        const title = `Patrula Cormoran • Locație Stabilită`;
        const body = `La evenimentul „${ev.title}” s-a stabilit locul: ${locationClean}.`;

        const alertItem: NotificationAlert = {
          id: key,
          eventId: ev.id,
          type: 'location_set',
          title,
          body,
          eventDate: ev.start,
          eventTime: timeStr,
          location: locationClean,
          timestamp: Date.now(),
        };
        currentAlerts.push(alertItem);

        if (notificationsEnabled && !notifiedRecord[key] && permission === 'granted') {
          const sent = await sendNativeNotification(title, {
            body,
            tag: key,
          });
          if (sent) markAsNotified(key);
        }
      }
    }

    // Standard 7-day and 1-day reminders
    const daysUntil = getDaysUntilEvent(ev.start);
    if (daysUntil !== null) {
      if (daysUntil === 7) {
        const key = `${ev.id}_7d`;
        const title = `Patrula Cormoran • Peste 7 zile`;
        const timePart = timeStr ? ` la ora ${timeStr}` : '';
        const body = `Peste 7 zile are loc: ${ev.title}${timePart}.`;

        const alertItem: NotificationAlert = {
          id: key,
          eventId: ev.id,
          type: '7d',
          title,
          body,
          eventDate: ev.start,
          eventTime: timeStr,
          location: locationClean || null,
          timestamp: Date.now(),
        };
        currentAlerts.push(alertItem);

        if (
          notificationsEnabled &&
          !notifiedRecord[key] &&
          permission === 'granted' &&
          isTimeToSendScheduled
        ) {
          const sent = await sendNativeNotification(title, {
            body,
            tag: key,
          });
          if (sent) markAsNotified(key);
        }
      }

      // 1-day before reminder:
      // If hour is chosen -> notify at the exact hour of the event (24h before start)
      // If NO hour is chosen -> notify at 09:00 AM on the day before
      const hasChosenHour = hasExactTime && !!timeStr && ev.start.includes('T');
      let shouldDeliver1dNow = false;
      let title1d = `Patrula Cormoran • Mâine!`;
      let body1d = `Mâine are loc: ${ev.title}.`;

      if (hasChosenHour) {
        const eventStartMs = new Date(ev.start).getTime();
        if (!isNaN(eventStartMs)) {
          // Exactly 24 hours before event starts
          const target24hBeforeMs = eventStartMs - 24 * 60 * 60 * 1000;
          // Eligible if current time reached the 24h before mark, and event hasn't started yet
          if (now.getTime() >= target24hBeforeMs && now.getTime() < eventStartMs) {
            shouldDeliver1dNow = true;
            title1d = `Patrula Cormoran • Peste 24 de ore`;
            body1d = `Peste 24 de ore are loc: ${ev.title} (la ora ${timeStr}).`;
          }
        }
      } else {
        // No hour set -> notify at 09:00 AM on the day before
        if (daysUntil === 1) {
          const currentTotalMin = now.getHours() * 60 + now.getMinutes();
          const nineAmTotalMin = 9 * 60; // 09:00 AM
          if (currentTotalMin >= nineAmTotalMin) {
            shouldDeliver1dNow = true;
            title1d = `Patrula Cormoran • Mâine!`;
            body1d = `Mâine are loc: ${ev.title}.`;
          }
        }
      }

      if (daysUntil === 1 || shouldDeliver1dNow) {
        const key = `${ev.id}_1d`;
        const alertItem: NotificationAlert = {
          id: key,
          eventId: ev.id,
          type: '1d',
          title: title1d,
          body: body1d,
          eventDate: ev.start,
          eventTime: timeStr,
          location: locationClean || null,
          timestamp: Date.now(),
        };
        currentAlerts.push(alertItem);

        if (
          notificationsEnabled &&
          !notifiedRecord[key] &&
          permission === 'granted' &&
          shouldDeliver1dNow
        ) {
          const sent = await sendNativeNotification(title1d, {
            body: body1d,
            tag: key,
          });
          if (sent) markAsNotified(key);
        }
      }
    }
  }

  // Save the latest snapshot of events
  saveStoredSnapshots(updatedSnapshots);

  notifyListeners(currentAlerts);
  return currentAlerts;
}

// Send standard test notification
export async function sendTestNotification(): Promise<boolean> {
  const title = 'Patrula Cormoran • Notificări Active';
  const body =
    'Notificările funcționează perfect pe telefon și calculator! Vei primi alerte automate când se stabilesc data sau locul unui eveniment.';

  return await sendNativeNotification(title, {
    body,
    tag: `test_${Date.now()}`,
  });
}

// Send test notification simulating when date & location were established
export async function sendTestDetailNotification(type: 'both' | 'location' | 'date' = 'both'): Promise<boolean> {
  let title = 'Patrula Cormoran • Detalii Stabilite';
  let body = 'La un eveniment de patrulă s-a stabilit data și locul!';

  if (type === 'location') {
    title = 'Patrula Cormoran • Locație Stabilită';
    body = 'La un eveniment din calendar s-a stabilit locația de întâlnire.';
  } else if (type === 'date') {
    title = 'Patrula Cormoran • Dată & Oră Stabilită';
    body = 'La un eveniment din calendar s-a stabilit data și ora de desfășurare.';
  }

  return await sendNativeNotification(title, {
    body,
    tag: `test_detail_${Date.now()}`,
  });
}
