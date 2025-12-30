
/**
 * Utility to handle Meta Pixel (Facebook Pixel) events with robustness and blocker detection
 */

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export const initPixel = (pixelId: string) => {
  if (typeof window === 'undefined' || !pixelId) return;

  // Initialize the placeholder queue immediately so trackPixelEvent calls don't fail
  if (!window.fbq) {
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
      
      // Error handling for script loading
      t.onerror = function() {
        console.error('%c[Meta Pixel] Error: The script was blocked by the browser (likely an Ad-blocker).', 'background: #ff0000; color: #fff; padding: 2px 5px; border-radius: 3px;');
      };

      s = b.getElementsByTagName(e)[0];
      if (s && s.parentNode) {
        s.parentNode.insertBefore(t, s);
      } else {
        b.head.appendChild(t);
      }
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  }

  // Set the specific Pixel ID
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
  
  console.log(`%c[Meta Pixel] Initialized/Synced with ID: ${pixelId}`, 'color: #1877F2; font-weight: bold;');
};

export const trackPixelEvent = (event: string, data?: any) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event, data);
    console.debug(`%c[Meta Pixel] Event Tracked: ${event}`, 'color: #1877F2; font-weight: bold;', data);
  } else {
    console.warn(`[Meta Pixel] Cannot track ${event}: window.fbq is not defined.`);
  }
};

/**
 * Helper to check if the script is actually loaded or blocked
 */
export const isPixelBlocked = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    
    // Check if the script object exists but isn't "loaded"
    setTimeout(() => {
      const isLoaded = !!(window.fbq && window.fbq.loaded);
      resolve(!isLoaded);
    }, 2000);
  });
};
