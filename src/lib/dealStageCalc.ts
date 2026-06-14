// Calculate real stage probabilities and cycle days from actual deal lifecycle data.
// Falls back to defaults when not enough data is available.

import type { Deal, DealLifecycleStage } from '../types';

interface StageProb {
  probability: number;
  avgCycleDays: number;
}

const STAGES: DealLifecycleStage[] = ['Registered', 'UnderReview', 'Approved', 'Solution', 'Commercial', 'ClosedWon', 'ClosedLost'];

/**
 * Compute win rate per stage from lifecycle events.
 * For each stage, count deals that reached that stage,
 * then among them, what fraction eventually reached ClosedWon.
 */
function computeWinRates(deals: Deal[]): Record<string, number> {
  const reached: Record<string, Set<string>> = {};
  const won: Record<string, Set<string>> = {};
  STAGES.forEach(s => { reached[s] = new Set(); won[s] = new Set(); });

  deals.forEach(d => {
    const events = d.lifecycle || [];
    const stagesReached = new Set(events.map(e => e.stage));
    const isWon = stagesReached.has('ClosedWon') || d.status === 'Closed Won' || d.status === 'Converted';

    stagesReached.forEach(s => {
      reached[s]?.add(d.id);
      if (isWon) won[s]?.add(d.id);
    });
  });

  const rates: Record<string, number> = {};
  STAGES.forEach(s => {
    const count = reached[s]?.size || 0;
    rates[s] = count > 3 ? Math.round(((won[s]?.size || 0) / count) * 100) : 0;
  });
  return rates;
}

/**
 * Compute average days per stage from lifecycle events.
 * Events have a `durationDays` field. Average across deals that have data.
 */
function computeAvgCycleDays(deals: Deal[]): Record<string, number> {
  const days: Record<string, number[]> = {};
  STAGES.forEach(s => { days[s] = []; });

  deals.forEach(d => {
    const events = d.lifecycle || [];
    events.forEach(e => {
      if (e.durationDays && e.durationDays > 0 && days[e.stage]) {
        days[e.stage].push(e.durationDays);
      }
    });
  });

  const averages: Record<string, number> = {};
  STAGES.forEach(s => {
    const vals = days[s];
    averages[s] = vals.length > 3 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  });
  return averages;
}

// Industry-default fallbacks when real data is insufficient (< 4 deals)
const FALLBACK_PROB: Record<string, number> = {
  Registered: 10, UnderReview: 20, Approved: 35, Solution: 50,
  Commercial: 80, ClosedWon: 100, ClosedLost: 0,
};
const FALLBACK_DAYS: Record<string, number> = {
  Registered: 3, UnderReview: 5, Approved: 7, Solution: 14,
  Commercial: 21, ClosedWon: 0, ClosedLost: 0,
};

export function computeRealStageProbabilities(deals: Deal[]): Record<string, StageProb> {
  const winRates = computeWinRates(deals);
  const cycleDays = computeAvgCycleDays(deals);

  const result: Record<string, StageProb> = {};
  STAGES.forEach(s => {
    result[s] = {
      probability: winRates[s] > 0 ? winRates[s] : FALLBACK_PROB[s],
      avgCycleDays: cycleDays[s] > 0 ? cycleDays[s] : FALLBACK_DAYS[s],
    };
  });
  return result;
}

/** Default deal expiry period in days */
export const DEAL_EXPIRY_DAYS = 90;
