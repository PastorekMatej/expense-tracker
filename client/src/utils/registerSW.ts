/**
 * Service Worker Registration Utility
 * Registers the service worker for PWA functionality
 */

export async function registerSW(): Promise<void> {
  // Check if service workers are supported by the browser
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service workers are not supported in this browser');
    return;
  }

  try {
    console.log('[SW] Registering service worker...');
    
    // Register the service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/', // Service worker will control all pages under this scope
    });

    console.log('[SW] Service worker registered successfully:', registration);

    // Handle service worker updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        console.log('[SW] New service worker found, installing...');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content available, service worker updated
              console.log('[SW] New content is available; please refresh');
              
              // Optionally, you could show a notification to the user here
              // or automatically reload the page
            } else {
              // Content is cached for offline use
              console.log('[SW] Content is cached for offline use');
            }
          }
        });
      }
    });

    // Check if there's an active service worker
    if (registration.active) {
      console.log('[SW] Service worker is active and controlling pages');
    }

    // Listen for when the service worker starts controlling this page
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Service worker controller changed');
      // The service worker is now controlling the page
      // You might want to reload the page or update the UI here
    });

  } catch (error) {
    console.error('[SW] Service worker registration failed:', error);
    
    // Don't throw the error - PWA functionality should be optional
    // The app should still work normally without the service worker
  }
}

/**
 * Unregister service worker (useful for development/testing)
 */
export async function unregisterSW(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('[SW] Service worker unregistered');
      }
    } catch (error) {
      console.error('[SW] Service worker unregistration failed:', error);
    }
  }
}

/**
 * Check if the app is installed as a PWA
 */
export function isPWAInstalled(): boolean {
  // Check if the app is running in standalone mode
  return window.matchMedia('(display-mode: standalone)').matches ||
         // Check for iOS Safari standalone mode
         (window.navigator as any).standalone === true ||
         // Check if launched from home screen on Android
         document.referrer.includes('android-app://');
}

/**
 * Get installation prompt (if available)
 * Note: This requires capturing the beforeinstallprompt event
 */
export function getInstallPrompt(): any {
  return (window as any).installPrompt || null;
}



