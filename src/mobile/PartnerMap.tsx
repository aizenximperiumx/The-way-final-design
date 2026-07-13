import React, { useMemo, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { BENEFIT_CATEGORIES, type BenefitCategory, type BenefitPartner } from './benefits';
import { GOLD, NAVY, card, dim, goldA } from './ui';
import { useI18n } from '../lib/i18n';
import { tap } from '../lib/native';

/**
 * Partner map — a stylized, offline schematic of Tbilisi (no map tiles, no
 * API keys): the Mtkvari river, the main student districts and a gold pin
 * for every physical partner. Tapping a pin shows the deal.
 */

interface Pin { partner: BenefitPartner; category: BenefitCategory }

const DISTRICTS: Array<{ x: number; y: number; en: string; ar: string }> = [
  { x: 18, y: 30, en: 'Didube', ar: 'ديدوبي' },
  { x: 24, y: 50, en: 'Saburtalo', ar: 'سابورتالو' },
  { x: 34, y: 87, en: 'Vake', ar: 'فاكي' },
  { x: 44, y: 24, en: 'Marjanishvili', ar: 'مارجانيشفيلي' },
  { x: 48, y: 65, en: 'Rustaveli', ar: 'روستافيلي' },
  { x: 70, y: 81, en: 'Old Town', ar: 'المدينة القديمة' },
  { x: 80, y: 18, en: 'Gldani · Isani', ar: 'غلداني · إيساني' },
];

const PartnerMap: React.FC = () => {
  const { t } = useI18n();
  const [selected, setSelected] = useState<Pin | null>(null);

  const pins = useMemo<Pin[]>(() =>
    BENEFIT_CATEGORIES.flatMap(category =>
      category.partners.filter(p => p.spot).map(partner => ({ partner, category }))),
    []);

  return (
    <div className="rounded-3xl overflow-hidden" style={card}>
      {/* The map */}
      <div className="relative">
        <svg viewBox="0 0 100 92" className="w-full block" style={{ background: 'linear-gradient(160deg, #0C1B33, #0A1628 70%)' }}>
          {/* Mtkvari river */}
          <path
            d="M 12 8 C 30 18, 34 26, 46 30 C 60 35, 60 44, 58 54 C 56 64, 66 72, 84 84"
            fill="none" stroke="#274A73" strokeWidth="6" strokeLinecap="round" opacity="0.65"
          />
          <path
            d="M 12 8 C 30 18, 34 26, 46 30 C 60 35, 60 44, 58 54 C 56 64, 66 72, 84 84"
            fill="none" stroke="#3A6390" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" strokeDasharray="0.5 4"
          />
          {/* Metro line hint */}
          <path d="M 18 66 L 34 52 L 50 44 L 64 40 L 80 34" fill="none" stroke={goldA(0.28)} strokeWidth="0.9" strokeDasharray="2.4 2" />
          {[[18, 66], [34, 52], [50, 44], [64, 40], [80, 34]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.1" fill={goldA(0.5)} />
          ))}

          {/* District labels */}
          {DISTRICTS.map(d => (
            <text key={d.en} x={d.x} y={d.y} textAnchor="middle" fontSize="3.1" fontWeight="700"
              fill={dim(0.34)} style={{ letterSpacing: 0.6, textTransform: 'uppercase' }}>
              {t(d.en, d.ar)}
            </text>
          ))}

          {/* Partner pins */}
          {pins.map(pin => {
            const { x, y } = pin.partner.spot!;
            const active = selected?.partner.name === pin.partner.name;
            return (
              <g key={pin.partner.name} onClick={() => { tap(); setSelected(active ? null : pin); }} style={{ cursor: 'pointer' }}>
                {active && (
                  <circle cx={x} cy={y} r="6" fill="none" stroke={GOLD} strokeWidth="0.7" opacity="0.8">
                    <animate attributeName="r" values="4;7;4" dur="1.6s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0.15;0.8" dur="1.6s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={x} cy={y} r="4.6" fill="transparent" />
                <circle cx={x} cy={y} r={active ? 3 : 2.2} fill={GOLD} stroke={NAVY} strokeWidth="0.9" />
              </g>
            );
          })}
        </svg>
        <span className="absolute top-3 left-4 text-[10px] font-black tracking-[2px] uppercase" style={{ color: dim(0.45) }}>
          {t('Tbilisi', 'تبليسي')}
        </span>
      </div>

      {/* Selected partner details */}
      {selected ? (
        <div className="flex items-center gap-3 p-4" style={{ borderTop: `1px solid ${goldA(0.14)}`, background: goldA(0.06) }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: goldA(0.15) }}>
            <selected.category.icon className="w-5 h-5" style={{ color: GOLD }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold truncate" style={{ color: '#fff' }}>
              {selected.partner.name}
              {selected.partner.comingSoon && (
                <span className="ml-2 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full align-middle" style={{ background: goldA(0.15), color: GOLD }}>
                  {t('Soon', 'قريباً')}
                </span>
              )}
            </p>
            <p className="text-[12px] truncate" style={{ color: dim(0.6) }}>
              {selected.partner.deal} · <span style={{ color: goldA(0.85) }}>{selected.partner.spot!.area}</span>
            </p>
          </div>
          <button onClick={() => { tap(); setSelected(null); }} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <X className="w-4 h-4" style={{ color: dim(0.6) }} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-4" style={{ borderTop: `1px solid ${goldA(0.14)}` }}>
          <MapPin className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
          <p className="text-[12px]" style={{ color: dim(0.6) }}>
            {t('Tap a gold pin to see the partner and your discount.', 'اضغط على أي نقطة ذهبية لرؤية الشريك وخصمك.')}
          </p>
        </div>
      )}
    </div>
  );
};

export default PartnerMap;
