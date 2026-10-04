import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { createHandlerBoundToURL } from "workbox-precaching";
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL("/index.html")));
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("push", (event) => {
  let data = {
    title: "Mortify",
    body: "New message",
    url: "/brethren/messages",
  };
  try {
    Object.assign(data, event.data?.json());
  } catch {
    /* Plain fallback if payload cannot be read. */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url },
      tag: data.tag,
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = ["/brethren/messages", "/reading", "/examine"].includes(
    event.notification.data?.url,
  )
    ? event.notification.data.url
    : "/brethren/messages";
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const existing = windows.find(
        (client) => new URL(client.url).origin === self.location.origin,
      );
      if (existing) {
        await existing.navigate(path);
        return existing.focus();
      }
      return self.clients.openWindow(path);
    })(),
  );
});
