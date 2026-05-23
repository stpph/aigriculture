// ============================================================
//  AIgriculture — Service Worker
//  Cache offline pentru functionalitate fara internet
// ============================================================

const CACHE_NAME = 'aigriculture-v1';
const CACHE_STATIC = 'aigriculture-static-v1';

// Fisierele care se cacheaza la instalare
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Fonturi Google
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lora:wght@500;600&display=swap',
  // Tabler Icons
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css',
  // Leaflet
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  // Chart.js
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// ============================================================
//  INSTALARE — precachare fisiere statice
// ============================================================
self.addEventListener('install', event => {
  console.log('[SW] Instalare AIgriculture PWA...');
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => {
        console.log('[SW] Cacheare fisiere statice...');
        // Cacham ce putem, ignoram erorile pentru resurse externe
        return Promise.allSettled(
          STATIC_ASSETS.map(url =>
            cache.add(url).catch(err => console.warn('[SW] Nu s-a putut cacha:', url, err))
          )
        );
      })
      .then(() => {
        console.log('[SW] Instalare completa!');
        return self.skipWaiting();
      })
  );
});

// ============================================================
//  ACTIVARE — stergere cache vechi
// ============================================================
self.addEventListener('activate', event => {
  console.log('[SW] Activare...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_STATIC && name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Stergere cache vechi:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Activat! Preluare control pagini...');
      return self.clients.claim();
    })
  );
});

// ============================================================
//  FETCH — strategie Network First cu fallback Cache
// ============================================================
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Nu interceptam cererile Supabase, Groq, meteo — necesita internet
  const apiDomains = [
    'supabase.co',
    'api.groq.com',
    'api.open-meteo.com',
    'geocoding-api.open-meteo.com',
    'api.rss2json.com',
    'nominatim.openstreetmap.org',
    'www.alphavantage.co'
  ];

  if (apiDomains.some(domain => url.hostname.includes(domain))) {
    return; // Lasam browserul sa se ocupe de API calls
  }

  // Pentru tile-urile hartii Google — nu cacham (prea mari)
  if (url.hostname.includes('google.com') || url.hostname.includes('googleapis.com')) {
    return;
  }

  // Strategie: Network First, fallback la Cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Daca am primit raspuns valid, il punem in cache
        if (response && response.status === 200 && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline — incercam din cache
        return caches.match(event.request).then(cached => {
          if (cached) {
            console.log('[SW] Servit din cache:', event.request.url);
            return cached;
          }
          // Daca nu e nici in cache si e o pagina HTML, servim index.html
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// ============================================================
//  MESAJE de la aplicatie
// ============================================================
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
