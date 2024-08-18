self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open('consumption-tracker-v1').then((cache) => {
        return cache.addAll([
          './index.html',
          './script.js',
          './manifest.json',
          './icons/icon-192x192.png',
          './icons/icon-512x512.png',
          // Ajoutez d'autres fichiers nécessaires ici
        ]);
      })
    );
  });
  
  self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  });
  