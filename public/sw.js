/* Service Worker for system notifications and click handling */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle notification clicks: focus existing client or open a new one
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const data = notification.data || {};
  const url = data.url || '/chats';
  event.notification.close();

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      let client = allClients.find((c) => c.url.includes(url));
      if (client) {
        await client.focus();
      } else if (allClients[0]) {
        // focus the first client and navigate
        await allClients[0].focus();
        allClients[0].navigate(url);
      } else {
        await self.clients.openWindow(url);
      }
    })()
  );
});

// Handle push events to show notifications even when the site is closed
self.addEventListener('push', (event) => {
  const getPayload = () => {
    try {
      if (!event.data) return {};
      const text = event.data.text();
      try { return JSON.parse(text); } catch { return { body: text }; }
    } catch (_) {
      return {};
    }
  };
  const payload = getPayload();
  const title = payload.title || 'New message';
  const options = payload.options || {
    body: payload.body || '',
    icon: payload.icon || '/favicon.ico',
    badge: payload.badge || '/favicon.ico',
    data: { url: payload.url || '/chats' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
