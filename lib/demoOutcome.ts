// lib/demoOutcome.ts
// Routes a completed quiz to a single revenue outcome based on the answers.
// Bigger, more owner-dependent businesses are routed to a booked strategy call;
// lighter ones are routed to the low-ticket report purchase.
import { UserAnswers } from './types';

export type DemoOutcome = 'buy' | 'book';

/** Price of the low-ticket report, in whole USD. Drives the wall revenue tally. */
export const PURCHASE_VALUE_USD = 27;

/** Score at or above which a lead is routed to a booked call instead of a purchase. */
export const BOOK_THRESHOLD = 50;

// q-q2: annual revenue tier — the dominant fit signal.
const REVENUE_POINTS: Record<string, number> = {
  'under-100k': 0,
  '100k-300k': 15,
  '300k-1m': 30,
  '1m-5m': 45,
  '5m-plus': 60,
};

// q-q3: how the business holds up when the owner steps away.
const VACATION_POINTS: Record<string, number> = {
  'runs-fine': 0,
  'slows-down': 10,
  'grinds-to-halt': 20,
};

// q-q5: assets to leverage (multi-select) — more assets, more to build on.
const ASSET_POINTS_EACH = 7;
const ASSET_POINTS_MAX = 21;

/**
 * Derive a 0–100 readiness score and the resulting outcome from quiz answers.
 * Pure and deterministic: identical answers always yield the same result, so a
 * seeded auto-demo produces a stable, reproducible buy/book split across leads.
 */
export function deriveDemoOutcome(answers: UserAnswers): { outcome: DemoOutcome; score: number } {
  const revenue = REVENUE_POINTS[answers['q-q2']] ?? 0;
  const vacation = VACATION_POINTS[answers['q-q3']] ?? 0;
  const assetCount = (answers['q-q5'] ?? '').split(',').filter(Boolean).length;
  const assets = Math.min(ASSET_POINTS_MAX, assetCount * ASSET_POINTS_EACH);

  const score = Math.min(100, revenue + vacation + assets);
  const outcome: DemoOutcome = score >= BOOK_THRESHOLD ? 'book' : 'buy';

  return { outcome, score };
}
