// Service worker: keeps a copy of the site so the app starts offline, and picks up new releases.
// build.py fills in VERSION and FILES. A new release changes VERSION, so this file changes, so the browser
// installs the new worker (it fetches this file bypassing the HTTP cache), which downloads the new release.
"use strict";

const VERSION = "v0.9.14";
const FILES = ["./", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "manifest.webmanifest"];
const CACHE = `scallenger-${VERSION}`;

self.addEventListener("install", event => {
    // cache: "reload" skips the HTTP cache: otherwise we could store the previous release it still holds.
    event.waitUntil(
        caches.open(CACHE)
            .then(cache => cache.addAll(FILES.map(file => new Request(file, { cache: "reload" }))))
            .then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(key => key.startsWith("scallenger-") && key !== CACHE)
                .map(key => caches.delete(key))))
            .then(() => self.clients.claim()));
});

// Cached copy first (instant, works offline), network for anything not cached.
self.addEventListener("fetch", event => {
    const request = event.request;
    if (request.method !== "GET" || new URL(request.url).origin !== location.origin) return;
    const cached = request.mode === "navigate"
        ? caches.match("./", { cacheName: CACHE })
        : caches.match(request, { cacheName: CACHE, ignoreSearch: true });
    event.respondWith(cached.then(response => response ?? fetch(request)));
});
