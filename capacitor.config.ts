import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ge.theway.app',
  appName: 'The Way',
  webDir: 'dist',
  // FULLY SELF-CONTAINED app: the UI ships inside the binary (instant open,
  // offline member card / cached data) — only DATA goes over the network.
  // src/lib/native.ts rewrites relative `/api/*` calls to https://theway.ge
  // when running natively, and Supabase auth uses the baked-in public config
  // (.env.app). Build with `npm run build:app`.
  // For over-the-air JS updates without store resubmission, add Capgo
  // (@capgo/capacitor-updater) later — see MOBILE.md.
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  backgroundColor: '#0A1628',
  plugins: {
    // Deliberately off. This flag does not decide whether native HTTP is
    // available - the plugin is always there and src/lib/net.ts calls it
    // directly. All it does is replace window.fetch with a version that
    // routes GET through a local proxy URL and POST through the message
    // bridge, which made every request behave differently depending on its
    // method and hid where calls were actually going. With it off, fetch is
    // the WebView's own again, so the two paths stay distinguishable.
    CapacitorHttp: {
      enabled: false,
    },
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: false,
      backgroundColor: '#0A1628',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT',
      backgroundColor: '#0A1628',
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
