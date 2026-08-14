/**
 * Send /api calls to the live server when the app is running from its own
 * bundle.
 *
 * Inside the packaged app the page is served from localhost, so a relative
 * `/api/...` request asks the app's own bundle — which has no API. It does not
 * fail fast either: the local server accepts the connection and never answers,
 * so the call hangs until it times out and the app looks broken.
 *
 * This module deliberately imports nothing. The patch used to live in
 * lib/native.ts, which imports the store, and the store imports back — the
 * cycle meant the patch could not be relied on to be installed before the
 * first request. With no imports it is safe to load first, and it always is.
 */

/**
 * The host the app talks to, and the host printed into member-card QR codes.
 *
 * www rather than the bare domain, deliberately. The apex resolves straight to
 * a single origin address; www is a CNAME onto Hostinger's CDN with several
 * edges in front of it. Networks that could not route to that one origin - a
 * whole office, and some mobile carriers - reached the CDN without trouble, and
 * the same API answers about three times faster through it.
 *
 * Verified before switching: the CDN does not cache API responses (they come
 * back marked dynamic), and CORS headers are still decided per request, so an
 * allowed origin cannot be served to a different one from a cache.
 */
export const API_HOST = 'https://www.theway.ge';

/** True when the page is the packaged app rather than the website or dev server. */
export const isBundledApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (import.meta.env.DEV) return false; // Vite proxies /api itself
  const { protocol, hostname } = window.location;
  if (protocol === 'capacitor:' || protocol === 'ionic:') return true;
  return hostname === 'localhost' || hostname === '127.0.0.1';
};

/** The absolute URL a request will actually be sent to. */
export const apiUrl = (path: string): string =>
  path.startsWith('/api/') && isBundledApp() ? `${API_HOST}${path}` : path;

// The fetch patch that used to live here now lives in net.ts, which can also
// send the request through Android instead of the WebView. This module stays
// free of imports so it remains safe to load before anything else.
