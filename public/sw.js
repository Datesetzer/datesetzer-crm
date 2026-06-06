// public/sw.js — Datesetzer CRM Service Worker v1.0
const V       = "ds-1.0";
const STATIC  = `${V}-static`;
const PAGES   = `${V}-pages`;
const API_C   = `${V}-api`;

const PRE_CACHE = ["/", "/dashboard", "/offline", "/manifest.json"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(STATIC).then(c => c.addAll(PRE_CACHE).catch(() => {})));
});

self.addEventListener("activate", e => {
  e.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => ![STATIC,PAGES,API_C].includes(k)).map(k => caches.delete(k)))
    ),
  ]));
});

self.addEventListener("fetch", e => {
  const { request: req } = e;
  const url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (["/api/realtime", "/_next/webpack"].some(p => url.pathname.startsWith(p))) return;

  if (url.pathname.startsWith("/api/")) {
    e.respondWith(networkFirst(req, API_C)); return;
  }
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(cacheFirst(req, STATIC)); return;
  }
  e.respondWith(staleWhileRevalidate(req, PAGES));
});

async function cacheFirst(req, cache) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const fresh = await fetch(req).catch(() => null);
  if (fresh?.ok) (await caches.open(cache)).put(req, fresh.clone());
  return fresh || new Response("Offline", { status: 503 });
}

async function networkFirst(req, cache) {
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(cache)).put(req, res.clone());
    return res;
  } catch {
    return await caches.match(req) ||
      new Response(JSON.stringify({ error: "Offline" }), { headers: { "Content-Type": "application/json" } });
  }
}

async function staleWhileRevalidate(req, cache) {
  const c = await caches.open(cache);
  const cached = await c.match(req);
  const fetchP = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
  return cached || await fetchP || new Response("Offline", { status: 503 });
}

// ── PUSH ──────────────────────────────────────────────────
self.addEventListener("push", e => {
  if (!e.data) return;
  let p; try { p = e.data.json(); } catch { p = { title: "Datesetzer CRM", body: e.data.text() }; }
  e.waitUntil(self.registration.showNotification(p.title || "Datesetzer CRM", {
    body: p.body || "", icon: "/icon-192.png", badge: "/badge-96.png",
    tag: p.tag || "ds", renotify: true, data: { url: p.url || "/dashboard" },
    actions: [{ action:"open", title:"Öffnen" }, { action:"close", title:"Schließen" }],
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  if (e.action === "close") return;
  const url = e.notification.data?.url || "/dashboard";
  e.waitUntil(
    self.clients.matchAll({ type:"window", includeUncontrolled:true })
      .then(cs => { const c = cs.find(c => c.url.includes(self.location.origin)); return c ? c.focus() : self.clients.openWindow(url); })
  );
});
