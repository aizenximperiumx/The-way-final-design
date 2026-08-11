/**
 * The one place the packaged app talks to the network.
 *
 * The page inside the app is served from localhost, so every call to the
 * server or to Supabase is cross-origin to the WebView. Going through the
 * WebView meant asking the browser for permission first, and those permission
 * requests hung: not refused, not answered, just held until the app gave up.
 * Sign-in never got past its first call.
 *
 * Capacitor's HTTP plugin makes the request from Android itself. A native
 * request is not a browser request, so there is no origin, no preflight and
 * no CORS - the whole category stops applying rather than being worked
 * around. It also accepts timeouts, which the patched fetch never passed on:
 * both native paths Capacitor installs leave HttpURLConnection with no limit
 * at all, which is why a stalled connection hung instead of failing.
 *
 * The website and the dev server keep the ordinary fetch, where a same-origin
 * call has none of these problems.
 */

import { CapacitorHttp } from '@capacitor/core';
import { API_HOST, isBundledApp } from './apiHost';

/** Long enough for a slow phone on mobile data, short enough to not look hung. */
const CONNECT_TIMEOUT = 10_000;
const READ_TIMEOUT = 20_000;

/**
 * The browser's own fetch, captured at import time.
 *
 * installNet replaces window.fetch further down, and everything here that
 * needs the real one must hold this reference rather than calling fetch by
 * name: a fallback that reached the patch would come straight back and loop.
 */
const webFetch: typeof fetch =
  typeof window !== 'undefined' && typeof window.fetch === 'function'
    ? window.fetch.bind(window)
    : ((input: RequestInfo | URL, init?: RequestInit) => fetch(input, init));

/** Header collections arrive in three shapes; the plugin wants one. */
const toHeaderRecord = (h: HeadersInit | undefined): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!h) return out;
  if (h instanceof Headers) {
    h.forEach((v, k) => { out[k] = v; });
  } else if (Array.isArray(h)) {
    for (const [k, v] of h) out[k] = v;
  } else {
    for (const [k, v] of Object.entries(h)) out[k] = String(v);
  }
  return out;
};

/** A body the native side can carry. Anything else stays on the web path. */
const nativeBody = (body: BodyInit | null | undefined): string | undefined => {
  if (body == null) return undefined;
  if (typeof body === 'string') return body;
  return undefined;
};

/** These statuses may not carry a body, and Response throws if given one. */
const isBodyless = (status: number) => status === 204 || status === 205 || status === 304;

/**
 * Make a request through Android rather than the WebView, returning the same
 * Response every caller already expects.
 */
export const nativeFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> => {
  const url =
    typeof input === 'string' ? input
    : input instanceof URL ? input.href
    : input.url;

  const headers = toHeaderRecord(init.headers);
  const data = nativeBody(init.body);

  // A body the plugin cannot carry (FormData, Blob, a stream) means an upload;
  // those keep the web path, where the WebView knows how to encode them.
  // webFetch, not fetch: the patched one would route straight back here.
  if (init.body != null && data === undefined) {
    return webFetch(input, init);
  }

  const res = await CapacitorHttp.request({
    url,
    method: (init.method ?? 'GET').toUpperCase(),
    headers,
    ...(data === undefined ? {} : { data }),
    connectTimeout: CONNECT_TIMEOUT,
    readTimeout: READ_TIMEOUT,
    responseType: 'text',
  });

  const text =
    typeof res.data === 'string' ? res.data
    : res.data == null ? ''
    : JSON.stringify(res.data);

  // Header values arrive loosely typed and a bad one would throw here, taking
  // a good response down with it.
  const responseHeaders = new Headers();
  for (const [k, v] of Object.entries(res.headers ?? {})) {
    try { responseHeaders.set(k, String(v)); } catch { /* skip unusable header */ }
  }

  const status = typeof res.status === 'number' && res.status >= 200 ? res.status : 500;
  return new Response(isBodyless(status) ? null : text, { status, headers: responseHeaders });
};

/**
 * The fetch the app should use everywhere: native inside the package, the
 * browser's own everywhere else. Falls back to the browser if the plugin is
 * unavailable, so a missing plugin degrades instead of breaking sign-in.
 */
export const appFetch: typeof fetch = (input, init) => {
  if (!isBundledApp()) return webFetch(input, init);
  return nativeFetch(input, init as RequestInit).catch((e) => {
    const detail = e instanceof Error ? e.message : String(e);
    // A genuine HTTP failure is a Response, not a throw; reaching here means
    // the native layer itself did not run, so the WebView is the better bet.
    if (/not implemented|unavailable|not available/i.test(detail)) {
      return webFetch(input, init);
    }
    throw e;
  });
};

/**
 * Point every /api call in the app at the server, over the native layer.
 *
 * There are around twenty places that call fetch('/api/...') directly - an
 * application being submitted, an account being created, a push token being
 * registered. Inside the package a relative path asks the app's own bundle,
 * which has no API and never answers, and going through the WebView is the
 * thing that was hanging. Patching here fixes all of them at once instead of
 * leaving twenty call sites to be found and corrected one at a time.
 *
 * This lives in net.ts rather than apiHost.ts on purpose: apiHost imports
 * nothing, which is what makes it safe to load first. An earlier version of
 * this patch sat in a module that imported the store while the store imported
 * back, and the cycle meant it was not always installed before the first
 * request.
 */
export const installNet = (): void => {
  if (typeof window === 'undefined' || !isBundledApp()) return;

  const original = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const href =
        typeof input === 'string' ? input
        : input instanceof URL ? input.href
        : input instanceof Request ? input.url
        : '';

      // Relative /api, or an absolute one already pointing at our own origin.
      const isOurApi =
        href.startsWith('/api/')
        || (href.startsWith(window.location.origin) && new URL(href).pathname.startsWith('/api/'));

      if (isOurApi) {
        const url = href.startsWith('/api/')
          ? `${API_HOST}${href}`
          : `${API_HOST}${new URL(href).pathname}${new URL(href).search}`;
        // A Request carries its own method, headers and body; without merging
        // them a POST would silently become a GET.
        const merged: RequestInit = input instanceof Request
          ? { method: input.method, headers: input.headers, body: init?.body ?? undefined, ...init }
          : (init ?? {});
        return appFetch(url, merged);
      }

      // Anything already absolute and elsewhere (Supabase, storage) still
      // benefits from the native path.
      if (/^https?:\/\//i.test(href)) return appFetch(input as RequestInfo, init);
    } catch {
      /* fall through to the untouched call */
    }
    return original(input as RequestInfo, init);
  };
};
