// Service worker de Carbz : garde une copie des fichiers de l'app
// pour qu'elle s'ouvre même sans réseau (les prix, eux, sont gardés par la page).
const CACHE = "carbz-v1";
const FICHIERS = ["./", "index.html", "leaflet.js", "leaflet.css", "manifest.webmanifest",
                  "icone.svg", "icone-180.png", "icone-192.png", "icone-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)));
  self.skipWaiting();
});

// Supprime les copies d'une ancienne version
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(cles =>
    Promise.all(cles.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// Réseau d'abord (pour avoir la dernière version), copie en secours.
// Les prix (API) et le fond de carte (IGN) ne passent pas par ici.
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(reponse => {
        if (reponse.ok) {
          const copie = reponse.clone();
          caches.open(CACHE).then(c => c.put(e.request, copie));
        }
        return reponse;
      })
      .catch(() => caches.match(e.request, {ignoreSearch: true})
        .then(r => r || caches.match("index.html"))));
});
