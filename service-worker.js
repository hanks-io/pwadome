const CACHE_NAME = 'pwa-demo-v1';
const BASE_PATH = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? ''
    : '/pwadome';

const urlsToCache = [
    `${BASE_PATH}/`,
    `${BASE_PATH}/index.html`,
    `${BASE_PATH}/style.css`,
    `${BASE_PATH}/manifest.json`,
    `${BASE_PATH}/icons/icon-192x192.svg`,
    `${BASE_PATH}/icons/icon-512x512.svg`
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
}); 