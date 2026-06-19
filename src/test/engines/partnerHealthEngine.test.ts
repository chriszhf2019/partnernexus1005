import { describe, it, expect } from 'vitest';
import { computeVitalityScore, computeSubMetrics } from '../../lib/partnerHealthEngine';

describe('partnerHealthEngine - vitality scoring', () => {
  describe('computeVitalityScore', () => {
    it('returns 0 for empty activities', () => {
      expect(computeVitalityScore([])).toBe(0);
    });

    it('returns max 100 when total weight >= 100', () => {
      const activities = [
        { activity_type: 'DEAL_WIN', weight_score: 20 },
        { activity_type: 'DEAL_WIN', weight_score: 20 },
        { activity_type: 'DEAL_WIN', weight_score: 20 },
        { activity_type: 'DEAL_WIN', weight_score: 20 },
        { activity_type: 'DEAL_WIN', weight_score: 20 },
      ];
      expect(computeVitalityScore(activities)).toBe(100);
    });

    it('computes weighted sum and normalizes to 0-100', () => {
      // LOGIN=1, LEAD_SUBMIT=10, MDF_CLAIM=15, TRAINING=5, DEAL_WIN=20, ACTIVITY_JOIN=8
      // 2x LOGIN(1) + 1x DEAL_WIN(20) = 22 → round(22/100*100) = 22
      const activities = [
        { activity_type: 'LOGIN' },
        { activity_type: 'LOGIN' },
        { activity_type: 'DEAL_WIN' },
      ];
      expect(computeVitalityScore(activities)).toBe(22);
    });

    it('uses custom weight_score when provided', () => {
      const activities = [{ activity_type: 'UNKNOWN', weight_score: 50 }];
      expect(computeVitalityScore(activities)).toBe(50);
    });

    it('ignores unknown activity types without weight_score', () => {
      const activities = [{ activity_type: 'UNKNOWN' }];
      expect(computeVitalityScore(activities)).toBe(0);
    });
  });

  describe('computeSubMetrics', () => {
    it('returns zeros for empty activities', () => {
      const result = computeSubMetrics([]);
      expect(result.market_activity).toBe(0);
      expect(result.incentive_execution).toBe(0);
      expect(result.business_interaction).toBe(0);
    });

    it('calculates market_activity as ACTIVITY_JOIN * 8 capped at 100', () => {
      const activities = [
        { activity_type: 'ACTIVITY_JOIN' },
        { activity_type: 'ACTIVITY_JOIN' },
        { activity_type: 'ACTIVITY_JOIN' },
      ];
      expect(computeSubMetrics(activities).market_activity).toBe(24); // 3 * 8
    });

    it('caps market_activity at 100', () => {
      const activities = Array.from({ length: 20 }, () => ({ activity_type: 'ACTIVITY_JOIN' }));
      expect(computeSubMetrics(activities).market_activity).toBe(100);
    });

    it('calculates incentive_execution as MDF_CLAIM * 15 capped at 100', () => {
      const activities = [{ activity_type: 'MDF_CLAIM' }];
      expect(computeSubMetrics(activities).incentive_execution).toBe(15);
    });

    it('calculates business_interaction from LEAD_SUBMIT and DEAL_WIN', () => {
      // (1*10 + 1*20) / 3 = 10
      const activities = [
        { activity_type: 'LEAD_SUBMIT' },
        { activity_type: 'DEAL_WIN' },
      ];
      expect(computeSubMetrics(activities).business_interaction).toBe(10);
    });

    it('cumulative sub_metrics do not affect each other', () => {
      const activities = [
        { activity_type: 'ACTIVITY_JOIN' },
        { activity_type: 'MDF_CLAIM' },
        { activity_type: 'LEAD_SUBMIT' },
      ];
      const result = computeSubMetrics(activities);
      expect(result.market_activity).toBe(8);
      expect(result.incentive_execution).toBe(15);
      expect(result.business_interaction).toBeCloseTo(3.3, 1);
    });
  });
});
