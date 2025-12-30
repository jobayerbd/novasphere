
/**
 * Utility to handle Meta Pixel (Facebook Pixel) events with robustness
 */

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export const initPixel = (pixelId: string) => {
  if (typeof window === 'undefined' || !pixelId) return;

  // Standard Meta Pixel initialization snippet
  // We check if it's already initialized to avoid duplicates
  if (window.fbq) {
    console.debug('[Meta Pixel] Already initialized. Re-initializing with new ID.');
    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
    return;
  }

  (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    if (s && s.parentNode) {
      s.parentNode.insertBefore(t, s);
    } else {
      b.head.appendChild(t);
    }
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
  
  console.log(`%c[Meta Pixel] Initialized with ID: ${pixelId}`, 'color: #1877F2; font-weight: bold;');
};

export const trackPixelEvent = (event: string, data?: any) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event, data);
    console.debug(`%c[Meta Pixel] Event Tracked: ${event}`, 'color: #1877F2; font-weight: bold;', data);
  } else {
    console.warn(`[Meta Pixel] Cannot track ${event}: Pixel not initialized yet.`);
  }
};
