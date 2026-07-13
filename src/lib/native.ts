// Native (Capacitor) integration. Everything here no-ops on the web so the same
// build runs in the browser and inside the iOS/Android shell.
//
// The app ships FULLY SELF-CONTAINED (no server.url): the UI lives inside the
// binary and only data crosses the network. That's why this module rewrites
// relative `/api/*` calls to the live backend and boots the shell into /app.
import { Capacitor, registerPlugin } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import toast from 'react-hot-toast';
import { useAppStore, type Lead } from '../store/appStore';
import { isLeadDue } from './leads';

export const isNative = () => Capacitor.isNativePlatform();

/** Where the bundled app sends its data requests. */
export const API_ORIGIN = 'https://theway.ge';

// ── Bundled-mode plumbing (runs synchronously at import, before any fetch) ──
// Inside the binary the origin is capacitor://localhost — relative /api/*
// calls would go nowhere, so they are rewritten to the live server.
const installBundledMode = () => {
  if (!Capacitor.isNativePlatform()) return;
  const original = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      if (typeof input === 'string' && input.startsWith('/api/')) {
        return original(`${API_ORIGIN}${input}`, init);
      }
      if (input instanceof URL && input.origin === window.location.origin && input.pathname.startsWith('/api/')) {
        return original(`${API_ORIGIN}${input.pathname}${input.search}`, init);
      }
      if (input instanceof Request) {
        const u = new URL(input.url);
        if (u.origin === window.location.origin && u.pathname.startsWith('/api/')) {
          return original(new Request(`${API_ORIGIN}${u.pathname}${u.search}`, input), init);
        }
      }
    } catch { /* fall through to the original call */ }
    return original(input as RequestInfo, init);
  };
  // Boot straight into the student app.
  if (window.location.pathname === '/') {
    window.history.replaceState(null, '', '/app');
  }
};
installBundledMode();

// ── Haptics ──────────────────────────────────────────────────────────────────
/** Light tick for taps (tabs, buttons). Silent no-op on the web. */
export const tap = () => {
  if (!isNative()) return;
  void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
};

/** Slightly stronger feedback for confirmations. */
export const thud = () => {
  if (!isNative()) return;
  void Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
};

// ── Biometric unlock (activates once the native plugin is installed) ────────
// Same dormant pattern as push: install @capgo/capacitor-native-biometric and
// `npx cap sync`, and fingerprint/Face-ID unlock lights up with no code changes.
type BiometricPlugin = {
  isAvailable: () => Promise<{ isAvailable?: boolean }>;
  verifyIdentity: (opts: { reason?: string; title?: string; subtitle?: string }) => Promise<void>;
};

let biometricProxy: BiometricPlugin | null = null;
const getBiometricPlugin = (): BiometricPlugin | undefined => {
  if (!isNative() || !Capacitor.isPluginAvailable('NativeBiometric')) return undefined;
  if (!biometricProxy) biometricProxy = registerPlugin<BiometricPlugin>('NativeBiometric');
  return biometricProxy;
};

/** True when the device offers fingerprint/face unlock (native only). */
export const biometricAvailable = async (): Promise<boolean> => {
  try {
    const plugin = getBiometricPlugin();
    if (!plugin) return false;
    const r = await plugin.isAvailable();
    return Boolean(r?.isAvailable);
  } catch { return false; }
};

/** Shows the native biometric prompt; resolves true on success. */
export const biometricVerify = async (reason: string): Promise<boolean> => {
  try {
    const plugin = getBiometricPlugin();
    if (!plugin) return false;
    await plugin.verifyIdentity({ reason, title: 'The Way' });
    return true;
  } catch { return false; }
};

// ── Push notifications (activates once the native plugin is installed) ──────
// The JS talks to the plugin through the Capacitor bridge proxy, so no npm
// wrapper is required: install @capacitor/push-notifications + drop
// google-services.json into android/app/, run `npx cap sync`, rebuild — and
// this code starts working without any further changes.
type PushPlugin = {
  requestPermissions: () => Promise<{ receive: string }>;
  register: () => Promise<void>;
  addListener: (event: string, cb: (data: Record<string, unknown>) => void) => Promise<unknown>;
};

let pushRegisteredFor = '';

async function registerPushIfAvailable(userId: string) {
  if (!isNative() || !userId || pushRegisteredFor === userId) return;
  if (!Capacitor.isPluginAvailable('PushNotifications')) return; // native plugin not installed yet
  try {
    const Push = (Capacitor as unknown as { Plugins?: Record<string, unknown> }).Plugins?.PushNotifications as PushPlugin | undefined;
    if (!Push) return;
    const perm = await Push.requestPermissions();
    if (perm.receive !== 'granted') return;

    await Push.addListener('registration', (data) => {
      const token = typeof data.value === 'string' ? data.value : '';
      if (!token) return;
      void (async () => {
        try {
          const { tryGetSupabase } = await import('./supabase');
          const supabase = tryGetSupabase();
          const auth = supabase ? (await supabase.auth.getSession()).data.session?.access_token : undefined;
          await fetch('/api/register-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
            body: JSON.stringify({ token, platform: Capacitor.getPlatform() }),
          });
        } catch { /* best-effort */ }
      })();
    });

    // Tapping a push opens the deep link it carries.
    await Push.addListener('pushNotificationActionPerformed', (data) => {
      const notif = (data.notification && typeof data.notification === 'object') ? data.notification as Record<string, unknown> : null;
      const payload = (notif?.data && typeof notif.data === 'object') ? notif.data as Record<string, unknown> : null;
      const link = typeof payload?.link === 'string' ? payload.link : '';
      if (link && link.startsWith('/')) window.location.assign(link);
    });

    await Push.register();
    pushRegisteredFor = userId;
  } catch { /* push unavailable — ignore */ }
}

// ── Local follow-up reminders (sales leads) ─────────────────────────────────
// Stable positive 31-bit integer id from a lead id (LocalNotifications need ints).
const notifId = (leadId: string) => {
  let h = 0;
  for (let i = 0; i < leadId.length; i++) h = (h * 31 + leadId.charCodeAt(i)) | 0;
  return Math.abs(h) % 2_000_000_000;
};

// Schedule a 9 AM reminder on each open lead's follow-up date (+ a "due now" nudge
// for anything overdue). Re-run whenever leads change.
async function syncFollowUpReminders(leads: Lead[], userId?: string) {
  if (!isNative() || !userId) return;
  try {
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return;

    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
    }

    const mine = leads.filter(l => l.ownerId === userId && l.followUpDate && l.status !== 'won' && l.status !== 'lost');
    const now = new Date();
    const toSchedule = mine.flatMap((l) => {
      const at = new Date(`${l.followUpDate}T09:00:00`);
      const when = at.getTime() > now.getTime() ? at : (isLeadDue(l) ? new Date(now.getTime() + 60_000) : null);
      if (!when) return [];
      return [{
        id: notifId(l.id),
        title: 'Lead follow-up due',
        body: `${l.name || l.phone || 'A lead'} — ${l.universityInterested || 'follow up today'}`,
        schedule: { at: when },
        smallIcon: 'ic_stat_icon_config_sample',
      }];
    });
    if (toSchedule.length) await LocalNotifications.schedule({ notifications: toSchedule });
  } catch { /* notifications unavailable — ignore */ }
}

let lastLeadsSig = '';
let debounce: ReturnType<typeof setTimeout> | null = null;

export async function initNative() {
  if (!isNative()) return;

  // Branded status bar (light icons on the dark navy app).
  try {
    await StatusBar.setStyle({ style: Style.Light });
    if (Capacitor.getPlatform() === 'android') await StatusBar.setBackgroundColor({ color: '#0A1628' });
  } catch { /* ignore */ }

  // Android hardware back button: go back in history, else exit at root.
  try {
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) window.history.back();
      else void CapApp.exitApp();
    });
  } catch { /* ignore */ }

  // Offline / online awareness.
  try {
    Network.addListener('networkStatusChange', (s) => {
      if (!s.connected) toast.error('You are offline — changes will sync when you reconnect.', { id: 'net' });
      else toast.success('Back online', { id: 'net' });
    });
  } catch { /* ignore */ }

  // Keep follow-up reminders in sync with the leads in the store, and
  // register for push as soon as someone is signed in.
  const run = () => {
    const s = useAppStore.getState();
    const sig = JSON.stringify(s.leads.map(l => [l.id, l.followUpDate, l.status, l.ownerId]));
    if (sig !== lastLeadsSig) {
      lastLeadsSig = sig;
      void syncFollowUpReminders(s.leads, s.currentUser?.id);
    }
    if (s.currentUser?.id && s.authStatus === 'signed_in') {
      void registerPushIfAvailable(s.currentUser.id);
    }
  };
  useAppStore.subscribe(() => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(run, 1500);
  });
  run();

  // Reveal the app once everything is wired.
  try { await SplashScreen.hide(); } catch { /* ignore */ }
}
