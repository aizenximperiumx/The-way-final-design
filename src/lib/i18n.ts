import { useAppStore } from '../store/appStore';

export type Lang = 'en' | 'ar';

// Lightweight bilingual helper for the visitor-facing pages (landing, universities,
// login). The authenticated dashboards intentionally ignore this and stay English.
// Usage: const { t, isRTL, dir, toggle } = useI18n();  <h1>{t('Welcome', 'مرحبا')}</h1>
export function useI18n() {
  const lang = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const isRTL = lang === 'ar';
  return {
    lang,
    isRTL,
    dir: (isRTL ? 'rtl' : 'ltr') as 'rtl' | 'ltr',
    fontFamily: isRTL ? 'var(--font-arabic)' : 'var(--font-sans)',
    t: (en: string, ar: string) => (isRTL ? ar : en),
    setLang: setLanguage,
    toggle: () => setLanguage(lang === 'ar' ? 'en' : 'ar'),
  };
}
