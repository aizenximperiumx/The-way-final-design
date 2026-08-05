// Shared visual tokens for the companion apps (/app/*).
//
// The identity is deep navy and gold, but the material is spatial: surfaces
// are translucent glass lit from above, laid over ambient colour, so the
// screen reads as lit rather than painted. Depth carries hierarchy — the
// member card sits above the panels, the panels above the light.

import type { CSSProperties } from 'react';

export const NAVY = '#0A1628';
export const NAVY_2 = '#0D1F3C';
export const NAVY_DEEP = '#070F1E';
export const GOLD = '#F5A800';
export const GOLD_LIGHT = '#FFD87A';
export const CREAM = '#F5F0E8';

export const dim = (opacity: number) => `rgba(245,240,232,${opacity})`;
export const goldA = (opacity: number) => `rgba(245,168,0,${opacity})`;

/**
 * Translucent panel. Blurred and saturated with a lit top edge, so it catches
 * the ambient colour behind it instead of sitting flat on the background.
 */
export const card: CSSProperties = {
  background: 'rgba(255,255,255,0.055)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 20,
  boxShadow: '0 8px 26px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.14)',
  backdropFilter: 'blur(14px) saturate(150%)',
  WebkitBackdropFilter: 'blur(14px) saturate(150%)',
};

/** The same material, gold-tinted, for the one thing that matters on a screen. */
export const goldCard: CSSProperties = {
  background: `linear-gradient(135deg, ${goldA(0.18)}, ${goldA(0.04)})`,
  border: `1px solid ${goldA(0.28)}`,
  borderRadius: 24,
  boxShadow: `0 10px 30px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.16)`,
  backdropFilter: 'blur(14px) saturate(150%)',
  WebkitBackdropFilter: 'blur(14px) saturate(150%)',
};

/** Heavier glass for chrome that floats over content — the tab bar, sheets. */
export const glassChrome: CSSProperties = {
  background: 'rgba(16,30,54,0.62)',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 16px 40px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.18)',
  backdropFilter: 'blur(22px) saturate(170%)',
  WebkitBackdropFilter: 'blur(22px) saturate(170%)',
};

/** Page background: navy with ambient colour bloom, so glass has something to bend. */
export const spatialBackground =
  `radial-gradient(90% 55% at 15% -5%, ${goldA(0.13)}, transparent 60%),` +
  ` radial-gradient(75% 50% at 95% 15%, rgba(70,130,220,0.14), transparent 62%),` +
  ` linear-gradient(180deg, ${NAVY} 0%, ${NAVY_2} 55%, ${NAVY_DEEP} 100%)`;

/** A soft out-of-focus light source. Place behind glass, never in front. */
export const ambient = (color: string, size = 260): CSSProperties => ({
  position: 'absolute',
  width: size,
  height: size,
  borderRadius: '50%',
  background: color,
  filter: 'blur(52px)',
  pointerEvents: 'none',
});

export const sectionLabel: CSSProperties = {
  color: dim(0.5),
  fontSize: 11,
  letterSpacing: 2,
  textTransform: 'uppercase',
  fontWeight: 700,
};

export const daysUntil = (dateStr?: string): number | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};
