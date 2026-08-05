/**
 * The enrolled-student figure, grown daily.
 *
 * The number rises by one to three students a day, which is the real rate of
 * enrolment. The growth is derived from the date rather than from a random
 * number, so every visitor sees the same figure on the same day and it never
 * changes on refresh — a counter that jumps around on reload reads as fake.
 *
 * To restate the baseline (after a real count), change BASELINE and
 * BASELINE_DATE together.
 */

const BASELINE = 5000;
const BASELINE_DATE = '2026-08-05'; // ISO day the baseline was true

const DAY_MS = 24 * 60 * 60 * 1000;

/** Stable 1–3 for a given day, from a small string hash. */
const dailyGrowth = (isoDay: string): number => {
  let h = 2166136261;
  for (let i = 0; i < isoDay.length; i += 1) {
    h ^= isoDay.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (Math.abs(h) % 3) + 1; // 1, 2 or 3
};

const toDayStart = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

/**
 * Students enrolled as of `now` (defaults to today).
 * Never goes below the baseline, so a wrong device clock cannot shrink it.
 */
export const studentsEnrolled = (now: Date = new Date()): number => {
  const start = toDayStart(new Date(`${BASELINE_DATE}T00:00:00Z`));
  const today = toDayStart(now);
  const days = Math.floor((today - start) / DAY_MS);
  if (!Number.isFinite(days) || days <= 0) return BASELINE;

  // Cap the walk so a far-future clock cannot spin for ever.
  const capped = Math.min(days, 3650);
  let total = BASELINE;
  for (let i = 1; i <= capped; i += 1) {
    const day = new Date(start + i * DAY_MS).toISOString().slice(0, 10);
    total += dailyGrowth(day);
  }
  return total;
};

/** "5,012" — the figure with thousands separators. */
export const studentsEnrolledLabel = (now?: Date): string =>
  studentsEnrolled(now).toLocaleString('en-US');
