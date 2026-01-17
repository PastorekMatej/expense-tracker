// Minimal Service Worker for PWA Installability
// This service worker enables the app to be installed but doesn't provide offline functionality

const CACHE_NAME = 'expense-tracker-install-only';

// Install event - skip waiting and activate immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Service worker installing...');
  // Skip waiting to activate the service worker immediately
  self.skipWaiting();
});

// Activate event - claim all clients immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activating...');
  // Claim all clients to ensure the service worker is active for all tabs
  event.waitUntil(self.clients.claim());
});

// Fetch event - pass through all requests without caching (install-only mode)
self.addEventListener('fetch', (event) => {
  // Simply pass through all requests to the network
  // No caching strategy since this is install-only mode
  event.respondWith(fetch(event.request));
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('[SW] Service worker error:', event.error);
});

// Handle messages from the main thread (if needed for future features)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service worker script loaded');


