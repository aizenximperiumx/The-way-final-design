import { Languages } from 'lucide-react';
import { useI18n } from '../lib/i18n';

// Compact EN / ع language switch for the visitor-facing pages.
// `variant` lets it sit on dark (landing/nav) or light (login) surfaces.
export default function LanguageToggle({ variant = 'light', className = '' }: { variant?: 'light' | 'dark'; className?: string }) {
  const { lang, toggle } = useI18n();
  const dark = variant === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      title={lang === 'ar' ? 'Switch to English' : 'Switch to Arabic'}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
        dark
          ? 'border-white/20 text-white/90 hover:bg-white/10'
          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
      } ${className}`}
    >
      <Languages className="w-3.5 h-3.5" />
      <span>{lang === 'ar' ? 'EN' : 'ع'}</span>
    </button>
  );
}
