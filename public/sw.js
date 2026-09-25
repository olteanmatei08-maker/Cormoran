// Service Worker for Patrula Cormoran PWA & Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle notification click to focus or open the app window and switch to Calendar
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const calendarUrl = '/#calendar';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and tell it to navigate to calendar
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'NAVIGATE_TAB', tab: 'calendar' });
          return client.focus();
        }
      }
      // If no window is open, open a new window pointing to the calendar section
      if (self.clients.openWindow) {
        return self.clients.openWindow(calendarUrl);
      }
    })
  );
});
