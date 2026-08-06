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

export const API_HOST = 'https://theway.ge';

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

/**
 * Rewrite every relative /api call, whatever shape it arrives in. Callers keep
 * using plain relative paths and the same code runs unchanged on the website.
 */
export const installApiHost = (): void => {
  if (typeof window === 'undefined' || !isBundledApp()) return;
  const original = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      if (typeof input === 'string' && input.startsWith('/api/')) {
        return original(`${API_HOST}${input}`, init);
      }
      if (input instanceof URL && input.origin === window.location.origin && input.pathname.startsWith('/api/')) {
        return original(`${API_HOST}${input.pathname}${input.search}`, init);
      }
      if (input instanceof Request) {
        const u = new URL(input.url);
        if (u.origin === window.location.origin && u.pathname.startsWith('/api/')) {
          return original(new Request(`${API_HOST}${u.pathname}${u.search}`, input), init);
        }
      }
    } catch { /* fall through to the untouched call */ }
    return original(input as RequestInfo, init);
  };
};
