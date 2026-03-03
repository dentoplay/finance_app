const CACHE_NAME = "finance-app-v2";

// ВАЖНО: берем базовый путь (для GitHub Pages это /finance_app/)
const BASE = new URL(self.registration.scope).pathname;

const ASSETS = [
  BASE,
  BASE + "index.html",
  BASE + "style.css",
  BASE + "script.js",
  BASE + "manifest.json",
  BASE + "icon-192.png",
  BASE + "icon-512.png"
];

// Установка: кешируем
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Активация: удаляем старые кеши
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Fetch: сначала сеть, если нет — кеш
self.addEventListener("fetch", (event) => {
  // только GET
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});