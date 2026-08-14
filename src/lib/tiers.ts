// ─────────────────────────────────────────────────────────────────────────────
// Membership card tiers.
//
// The card is a discount card at partner shops and restaurants in Georgia. The
// tier decides how much comes off. Basic is included in the normal fee; Gold
// and Platinum are paid upgrades.
//
// The percentages are the business's numbers and are the only place they are
// written down. Changing one here changes the card, the partner directory, the
// upgrade screen and what a partner sees when they scan - nothing repeats them.
// ─────────────────────────────────────────────────────────────────────────────

export type CardTier = 'basic' | 'gold' | 'platinum';

export interface TierMeta {
  id: CardTier;
  label: string;
  /** Percentage off at partner businesses. */
  discountPct: number;
  /** One line, for the card and the upgrade comparison. */
  tagline: string;
  /** What this tier gives beyond the one below it. */
  perks: string[];
  /** Included in the standard fee, so not offered as an upgrade. */
  included: boolean;
  /** Card face colours: [from, to] gradient plus the ink used on top. */
  face: { from: string; to: string; ink: string; glow: string };
}

export const TIERS: TierMeta[] = [
  {
    id: 'basic',
    label: 'Basic',
    discountPct: 10,
    tagline: 'Included with your application',
    perks: [
      '10% off at every partner shop and restaurant',
      'Your student card, valid for your whole course',
      'Airport pickup and settling-in help',
    ],
    included: true,
    face: { from: '#12294a', to: '#0A1628', ink: '#E8EEF7', glow: 'rgba(120,160,220,0.30)' },
  },
  {
    id: 'gold',
    label: 'Gold',
    discountPct: 15,
    tagline: 'Half again on every discount',
    perks: [
      '15% off at every partner shop and restaurant',
      'Priority booking at partner clinics and gyms',
      'A named contact for anything you need in Georgia',
    ],
    included: false,
    face: { from: '#C9962C', to: '#8A6416', ink: '#1A1206', glow: 'rgba(245,168,0,0.42)' },
  },
  {
    id: 'platinum',
    label: 'Platinum',
    discountPct: 25,
    tagline: 'The most we can give',
    perks: [
      '25% off at every partner shop and restaurant',
      'Everything in Gold',
      'Airport pickup for family visiting you',
      'Help with housing, bank account and SIM, arranged before you land',
    ],
    included: false,
    face: { from: '#E7ECF2', to: '#A9B4C2', ink: '#0A1628', glow: 'rgba(220,230,245,0.55)' },
  },
];

export const DEFAULT_TIER: CardTier = 'basic';

export const getTier = (id: CardTier | undefined | null): TierMeta =>
  TIERS.find(t => t.id === id) ?? TIERS[0];

/** Tiers a student can move up to, given the one they hold. */
export const upgradesFrom = (current: CardTier | undefined | null): TierMeta[] => {
  const i = TIERS.findIndex(t => t.id === (current ?? DEFAULT_TIER));
  return TIERS.slice(i + 1);
};

/** What a partner takes off, for the tier on the card in front of them. */
export const discountFor = (id: CardTier | undefined | null): number => getTier(id).discountPct;

// ── Upgrade requests ─────────────────────────────────────────────────────────

export type TierRequestStatus = 'requested' | 'approved' | 'declined';

/**
 * A student asking to move up a tier.
 *
 * The app does not take the money: it records the ask, and the CEO confirms it
 * once payment has been arranged however they arrange it. Nothing here handles
 * a card number, which is deliberate - an app that never sees one cannot leak
 * one - and the CEO can also set a tier outright without a request existing.
 */
export interface TierRequest {
  id: string;
  studentId: string;
  studentName: string;
  /** The tier held when the request was made, for the record. */
  fromTier: CardTier;
  toTier: CardTier;
  status: TierRequestStatus;
  requestedAt: string;
  decidedAt?: string;
  decidedById?: string;
  decidedByName?: string;
  /** The CEO's note: how it was paid, or why it was declined. */
  note?: string;
}
