// Native (Capacitor) integration. Everything here no-ops on the web so the same
// build runs in the browser and inside the iOS/Android shell.
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { LocalNotifications } from '@capacitor/local-notifications';
import toast from 'react-hot-toast';
import { useAppStore, type Lead } from '../store/appStore';
import { isLeadDue } from './leads';

export const isNative = () => Capacitor.isNativePlatform();

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

  // Branded status bar.
  try {
    await StatusBar.setStyle({ style: Style.Dark });        // dark icons on light header
    if (Capacitor.getPlatform() === 'android') await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
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

  // Keep follow-up reminders in sync with the leads in the store.
  const run = () => {
    const s = useAppStore.getState();
    const sig = JSON.stringify(s.leads.map(l => [l.id, l.followUpDate, l.status, l.ownerId]));
    if (sig === lastLeadsSig) return;
    lastLeadsSig = sig;
    void syncFollowUpReminders(s.leads, s.currentUser?.id);
  };
  useAppStore.subscribe(() => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(run, 1500);
  });
  run();

  // Reveal the app once everything is wired.
  try { await SplashScreen.hide(); } catch { /* ignore */ }
}
