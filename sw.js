const CACHE_NAME = 'caprompt-shell-v1';

// R9: setiap berkas baru di js/ wajib ditambahkan ke daftar ini.
const SHELL = [
  './',
  'index.html',
  'css/styles.css',
  'js/app.js',
  'js/parser.js',
  'js/engine.js',
  'js/store.js',
  'js/ui.js',
  'js/seed.js',
  'js/icons.js',
  'js/theme.js',
  'js/version.js',
  'js/views/library.js',
  'js/views/builder.js',
  'js/views/history.js',
  'js/views/settings.js',
  'js/views/placeholder.js',
  'js/views/buat-baru.js',
  'manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
