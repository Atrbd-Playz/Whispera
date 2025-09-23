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
  // Properly await and parse payload text (payload may be JSON or simple text)
  const handle = async () => {
    try {
      if (!event.data) {
        // No payload, show a generic notification
        return self.registration.showNotification('New message', { body: '' });
      }

      let text = '';
      try {
        text = await event.data.text();
      } catch (e) {
        // Fallback: try to treat data as already a string-like object
        try { text = String(event.data); } catch { text = ''; }
      }

      let payload = {};
      try {
        payload = JSON.parse(text || '{}');
      } catch (_) {
        // Not JSON, treat whole text as body
        payload = { body: text };
      }

      const title = payload.title || 'New message';
      const options = (payload.options && typeof payload.options === 'object') ? payload.options : {
        body: payload.body || '',
        icon: payload.icon || '/favicon.ico',
        badge: payload.badge || '/favicon.ico',
        data: { url: payload.url || '/chats' },
      };

      await self.registration.showNotification(title, options);
    } catch (err) {
      // Ensure the event stays alive long enough for errors to be visible in SW logs
      console.error('[sw] push handler error', err);
    }
  };

  event.waitUntil(handle());
});
