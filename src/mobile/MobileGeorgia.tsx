import React, { useEffect, useMemo, useState } from 'react';
import {
  Phone, Smartphone, Landmark, Bus, UtensilsCrossed, ArrowLeftRight,
  ChevronDown, Siren, Info,
} from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { tap } from '../lib/native';
import { GOLD, dim, goldA, card, sectionLabel } from './ui';
import MobileLayout from './MobileLayout';
import PartnerMap from './PartnerMap';

/**
 * Life in Georgia — app-exclusive survival guide for arriving students:
 * emergency numbers, SIM cards, banks, transport, food tips and a GEL
 * currency converter (live rate, cached for offline use).
 */

type Rates = { USD: number; EUR: number; EGP: number; at: number };
const FALLBACK: Rates = { USD: 0.37, EUR: 0.34, EGP: 18.2, at: 0 }; // per 1 GEL
const RATES_KEY = 'tw_gel_rates';

const useGelRates = (): Rates => {
  const [rates, setRates] = useState<Rates>(() => {
    try {
      const cached = localStorage.getItem(RATES_KEY);
      if (cached) return JSON.parse(cached) as Rates;
    } catch { /* ignore */ }
    return FALLBACK;
  });
  useEffect(() => {
    if (Date.now() - rates.at < 12 * 3600_000) return; // fresh enough
    void (async () => {
      try {
        const resp = await fetch('https://open.er-api.com/v6/latest/GEL');
        const json = await resp.json() as { result?: string; rates?: Record<string, number> };
        if (json.result === 'success' && json.rates) {
          const next: Rates = {
            USD: json.rates.USD ?? FALLBACK.USD,
            EUR: json.rates.EUR ?? FALLBACK.EUR,
            EGP: json.rates.EGP ?? FALLBACK.EGP,
            at: Date.now(),
          };
          localStorage.setItem(RATES_KEY, JSON.stringify(next));
          setRates(next);
        }
      } catch { /* offline — keep cached/fallback */ }
    })();
  }, [rates.at]);
  return rates;
};

const MobileGeorgia: React.FC = () => {
  const { t } = useI18n();
  const rates = useGelRates();
  const [open, setOpen] = useState<string | null>('emergency');
  const [gel, setGel] = useState('100');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'EGP'>('USD');

  const converted = useMemo(() => {
    const amount = Number(gel.replace(',', '.'));
    if (!Number.isFinite(amount)) return '—';
    return (amount * rates[currency]).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }, [gel, currency, rates]);

  const sections = [
    {
      id: 'emergency',
      icon: Siren,
      title: t('Emergency numbers', 'أرقام الطوارئ'),
      rows: [
        { k: t('All emergencies (police, ambulance, fire)', 'كل الطوارئ (شرطة، إسعاف، إطفاء)'), v: '112', tel: true },
        { k: t('The Way — your advisor', 'ذا واي — مستشارك'), v: '+995 571 009 550', tel: true },
      ],
    },
    {
      id: 'sim',
      icon: Smartphone,
      title: t('SIM card & internet', 'شريحة الهاتف والإنترنت'),
      rows: [
        { k: t('Main operators', 'شركات الاتصال'), v: 'Magti · Silknet (Geocell) · Cellfie' },
        { k: t('What you need', 'ما تحتاجه'), v: t('Just your passport — buy at the airport or any branch', 'جواز سفرك فقط — من المطار أو أي فرع') },
        { k: t('Typical cost', 'التكلفة التقريبية'), v: t('15–30 GEL / month with generous data', '15–30 لاري شهرياً مع باقة إنترنت كبيرة') },
      ],
    },
    {
      id: 'banks',
      icon: Landmark,
      title: t('Banks & money', 'البنوك والأموال'),
      rows: [
        { k: t('Student-friendly banks', 'بنوك مناسبة للطلاب'), v: 'Bank of Georgia · TBC Bank' },
        { k: t('To open an account', 'لفتح حساب'), v: t('Passport + student status — your advisor can help', 'جواز السفر + إثبات الدراسة — مستشارك يساعدك') },
        { k: t('Cards', 'البطاقات'), v: t('Visa/Mastercard accepted everywhere; Apple/Google Pay work widely', 'فيزا/ماستركارد مقبولة في كل مكان؛ Apple/Google Pay منتشرة') },
      ],
    },
    {
      id: 'transport',
      icon: Bus,
      title: t('Getting around Tbilisi', 'التنقل في تبليسي'),
      rows: [
        { k: t('Metro & buses', 'المترو والباصات'), v: t('Get a Travel Card at any metro station (~1 GEL per ride)', 'بطاقة مواصلات من أي محطة مترو (~1 لاري للرحلة)') },
        { k: t('Taxis', 'التاكسي'), v: t('Use Bolt or Yandex Go — cheap and safe', 'استخدم Bolt أو Yandex Go — رخيص وآمن') },
      ],
    },
    {
      id: 'food',
      icon: UtensilsCrossed,
      title: t('Food & essentials', 'الأكل والاحتياجات'),
      rows: [
        { k: t('Supermarkets', 'السوبرماركت'), v: 'Carrefour · Nikora · Agrohub · Spar' },
        { k: t('Halal food', 'الأكل الحلال'), v: t('Halal shops around Marjanishvili & Aghmashenebeli Ave', 'محلات حلال حول مرجانيشفيلي وشارع أغماشنبلي') },
        { k: t('Delivery apps', 'تطبيقات التوصيل'), v: 'Wolt · Glovo' },
      ],
    },
  ];

  return (
    <MobileLayout title={t('Life in Georgia', 'الحياة في جورجيا')}>
      {/* Currency converter */}
      <div className="rounded-3xl p-5" style={{ background: `linear-gradient(135deg, ${goldA(0.16)}, ${goldA(0.04)})`, border: `1px solid ${goldA(0.25)}`, borderRadius: 24 }}>
        <div className="flex items-center gap-2 mb-3">
          <ArrowLeftRight className="w-4 h-4" style={{ color: GOLD }} />
          <p style={sectionLabel}>{t('Currency converter', 'محول العملات')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: dim(0.5) }}>GEL ₾</p>
            <input
              value={gel}
              onChange={e => setGel(e.target.value)}
              inputMode="decimal"
              className="w-full rounded-xl px-4 py-3 text-[20px] font-black outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            />
          </div>
          <ArrowLeftRight className="w-5 h-5 mt-5 shrink-0" style={{ color: dim(0.4) }} />
          <div className="flex-1">
            <div className="flex gap-1 mb-1">
              {(['USD', 'EUR', 'EGP'] as const).map(c => (
                <button
                  key={c}
                  onClick={() => { tap(); setCurrency(c); }}
                  className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full"
                  style={{
                    background: currency === c ? GOLD : 'rgba(255,255,255,0.07)',
                    color: currency === c ? '#0A1628' : dim(0.5),
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="w-full rounded-xl px-4 py-3 text-[20px] font-black" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: GOLD }}>
              {converted}
            </div>
          </div>
        </div>
        <p className="mt-2 text-[10px]" style={{ color: dim(0.4) }}>
          {rates.at
            ? t(`Live rate · updated ${new Date(rates.at).toLocaleDateString()}`, `سعر مباشر · تحديث ${new Date(rates.at).toLocaleDateString()}`)
            : t('Approximate rate (offline)', 'سعر تقريبي (بدون إنترنت)')}
        </p>
      </div>

      {/* Partner map — physical partner spots across Tbilisi */}
      <p className="mt-6 mb-3" style={sectionLabel}>{t('Partner map', 'خريطة الشركاء')}</p>
      <PartnerMap />

      {/* Guide sections */}
      <p className="mt-6 mb-3" style={sectionLabel}>{t('Student survival guide', 'دليل الطالب')}</p>
      <div className="space-y-2.5 mb-3">
        {sections.map(s => {
          const isOpen = open === s.id;
          return (
            <div key={s.id} className="rounded-2xl overflow-hidden" style={card}>
              <button onClick={() => { tap(); setOpen(isOpen ? null : s.id); }} className="w-full flex items-center gap-3 p-4 text-left">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: goldA(0.12) }}>
                  <s.icon className="w-5 h-5" style={{ color: GOLD }} />
                </div>
                <p className="text-[14px] font-bold flex-1" style={{ color: '#fff' }}>{s.title}</p>
                <ChevronDown className="w-4 h-4 transition-transform" style={{ color: dim(0.5), transform: isOpen ? 'rotate(180deg)' : 'none' }} />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 space-y-2">
                  {s.rows.map((r, i) => (
                    <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: dim(0.45) }}>{r.k}</p>
                      {'tel' in r && r.tel ? (
                        <a href={`tel:${r.v.replace(/\s/g, '')}`} className="text-[16px] font-black inline-flex items-center gap-2 mt-0.5" style={{ color: GOLD }}>
                          <Phone className="w-4 h-4" /> {r.v}
                        </a>
                      ) : (
                        <p className="text-[13px] font-semibold mt-0.5" style={{ color: dim(0.85) }}>{r.v}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mb-2 rounded-2xl p-4 flex items-start gap-3" style={{ background: goldA(0.08), border: `1px dashed ${goldA(0.3)}`, borderRadius: 20 }}>
        <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: GOLD }} />
        <p className="text-[12px]" style={{ color: dim(0.7) }}>
          {t(
            'Need anything not covered here? Your advisor knows Tbilisi inside out — just ask.',
            'تحتاج شيئاً غير موجود هنا؟ مستشارك يعرف تبليسي جيداً — فقط اسأل.',
          )}
        </p>
      </div>
    </MobileLayout>
  );
};

export default MobileGeorgia;
