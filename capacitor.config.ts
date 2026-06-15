import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ge.theway.app',
  appName: 'The Way',
  webDir: 'dist',
  // The app is online-only (Supabase + Render backend), so the native shell
  // loads the live site directly. This keeps all `/api/*` calls same-origin and
  // means the app always runs the latest deploy (no app-store resubmit for web
  // changes). To ship a fully self-contained build instead, remove `server.url`
  // and point the app's `/api` calls at https://theway.ge.
  server: {
    url: 'https://theway.ge',
    androidScheme: 'https',
    cleartext: false,
  },
  backgroundColor: '#0A1628',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: false,
      backgroundColor: '#0A1628',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#FFFFFF',
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#F5A800',
    },
    Keyboard: {
      resize: 'body',
    },
  },
};

export default config;
