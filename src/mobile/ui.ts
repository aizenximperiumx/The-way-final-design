// Shared visual tokens for the student companion app (/app/*).
// Its own identity: deep-navy dark UI with gold accents — shares the brand
// palette with the website but none of its layouts.

import type { CSSProperties } from 'react';

export const NAVY = '#0A1628';
export const NAVY_2 = '#0D1F3C';
export const GOLD = '#F5A800';
export const CREAM = '#F5F0E8';

export const dim = (opacity: number) => `rgba(245,240,232,${opacity})`;
export const goldA = (opacity: number) => `rgba(245,168,0,${opacity})`;

/** Standard glass card. */
export const card: CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${goldA(0.14)}`,
  borderRadius: 20,
};

/** Highlighted (gold-tinted) card. */
export const goldCard: CSSProperties = {
  background: `linear-gradient(135deg, ${goldA(0.16)}, ${goldA(0.04)})`,
  border: `1px solid ${goldA(0.25)}`,
  borderRadius: 24,
};

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
