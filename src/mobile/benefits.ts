// ─────────────────────────────────────────────────────────────────────────────
// The Way Member Benefits — partner discounts unlocked once a student's case
// is closed (visa + residency done) or they are marked as arrived in Georgia.
// Placeholder partners ship as "coming soon" until real deals are signed;
// update this list (or later move it into app_state for CEO editing).
// ─────────────────────────────────────────────────────────────────────────────

import {
  ShoppingCart, Coffee, Dumbbell, Pill, Bus, Clapperboard,
  UtensilsCrossed, Smartphone, type LucideIcon,
} from 'lucide-react';

export interface BenefitPartner {
  name: string;
  deal: string;
  /** Not yet signed — shown greyed with a "soon" tag. */
  comingSoon?: boolean;
  /**
   * Position on the schematic Tbilisi partner map (0–100 × 0–100 space,
   * see PartnerMap.tsx) + the neighbourhood label shown when selected.
   * Delivery/ride services have no physical spot and stay off the map.
   */
  spot?: { x: number; y: number; area: string };
}

export interface BenefitCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  partners: BenefitPartner[];
}

export const BENEFIT_CATEGORIES: BenefitCategory[] = [
  {
    id: 'supermarkets',
    label: 'Supermarkets',
    icon: ShoppingCart,
    partners: [
      { name: 'Carrefour Georgia', deal: 'Member discount at checkout', comingSoon: true, spot: { x: 24, y: 62, area: 'Saburtalo' } },
      { name: 'Nikora', deal: 'Weekly student offers', comingSoon: true, spot: { x: 55, y: 34, area: 'Marjanishvili' } },
      { name: 'Agrohub', deal: 'Discount on fresh groceries', comingSoon: true, spot: { x: 33, y: 78, area: 'Vake' } },
    ],
  },
  {
    id: 'cafes',
    label: 'Cafés & Restaurants',
    icon: Coffee,
    partners: [
      { name: 'Coffeesta', deal: 'Student price on all drinks', comingSoon: true, spot: { x: 52, y: 56, area: 'Rustaveli' } },
      { name: 'Machakhela', deal: 'Discount on Georgian classics', comingSoon: true, spot: { x: 63, y: 70, area: 'Old Town' } },
    ],
  },
  {
    id: 'food',
    label: 'Food Delivery',
    icon: UtensilsCrossed,
    partners: [
      { name: 'Wolt', deal: 'New-member delivery credits', comingSoon: true },
      { name: 'Glovo', deal: 'Student promo codes', comingSoon: true },
    ],
  },
  {
    id: 'gyms',
    label: 'Gyms & Fitness',
    icon: Dumbbell,
    partners: [
      { name: 'Snap Fitness Tbilisi', deal: 'Reduced student membership', comingSoon: true, spot: { x: 40, y: 71, area: 'Vake' } },
    ],
  },
  {
    id: 'pharmacies',
    label: 'Pharmacies',
    icon: Pill,
    partners: [
      { name: 'PSP Pharmacy', deal: 'Member discount card', comingSoon: true, spot: { x: 47, y: 47, area: 'Rustaveli' } },
      { name: 'Aversi', deal: 'Discount on essentials', comingSoon: true, spot: { x: 29, y: 55, area: 'Saburtalo' } },
    ],
  },
  {
    id: 'transport',
    label: 'Transport',
    icon: Bus,
    partners: [
      { name: 'Bolt', deal: 'Ride credits for new members', comingSoon: true },
    ],
  },
  {
    id: 'mobile',
    label: 'Mobile & Internet',
    icon: Smartphone,
    partners: [
      { name: 'Magti', deal: 'Student SIM bundle', comingSoon: true, spot: { x: 58, y: 48, area: 'Rustaveli' } },
      { name: 'Silknet', deal: 'Home internet offer', comingSoon: true, spot: { x: 36, y: 44, area: 'Saburtalo' } },
    ],
  },
  {
    id: 'fun',
    label: 'Entertainment',
    icon: Clapperboard,
    partners: [
      { name: 'Cavea Cinemas', deal: 'Student ticket price', comingSoon: true, spot: { x: 72, y: 40, area: 'East Point' } },
    ],
  },
];
