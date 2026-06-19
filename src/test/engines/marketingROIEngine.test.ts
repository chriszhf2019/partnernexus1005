import { describe, it, expect } from 'vitest';
import { computeCampaignROI, diagnoseMarketing, sanitizeMetric, computePartnerMarketingScore } from '../../lib/marketingROIEngine';

describe('marketingROIEngine - computeCampaignROI', () => {
  it('returns zero ROI when mdfInvestment is 0', () => {
    const result = computeCampaignROI('c1', 'Campaign', '线下活动', 0, 10, 2, 50000);
    expect(result.roi).toBe(0);
    expect(result.cpl).toBe(0);
  });

  it('calculates ROI = dealValue / mdfInvestment', () => {
    const result = computeCampaignROI('c1', 'Campaign', '线下活动', 10000, 10, 2, 50000);
    // roi = 50000 / 10000 = 5
    expect(result.roi).toBe(5);
  });

  it('calculates CPL = mdfInvestment / leadsGenerated', () => {
    const result = computeCampaignROI('c1', 'Campaign', '线下活动', 10000, 10, 2, 50000);
    // cpl = 10000 / 10 = 1000
    expect(result.cpl).toBe(1000);
  });

  it('calculates conversionRate = dealsCreated / leadsGenerated', () => {
    const result = computeCampaignROI('c1', 'Campaign', '线下活动', 10000, 20, 5, 50000);
    // conversionRate = 5/20*100 = 25
    expect(result.conversionRate).toBe(25);
  });

  it('marks as low efficiency when CPL > 2000', () => {
    const result = computeCampaignROI('c1', 'Campaign', '线下活动', 30000, 5, 1, 10000);
    // cpl = 30000/5 = 6000 > 2000
    expect(result.isLowEfficiency).toBe(true);
    expect(result.alert).toContain('单线索成本');
  });

  it('marks as low efficiency when ROI < 0.5', () => {
    const result = computeCampaignROI('c1', 'Campaign', '线下活动', 20000, 10, 2, 5000);
    // roi = 5000/20000 = 0.25 < 0.5
    expect(result.isLowEfficiency).toBe(true);
    expect(result.alert).toContain('ROI');
  });

  it('marks as low efficiency when conversionRate < 5%', () => {
    const result = computeCampaignROI('c1', 'Campaign', '线下活动', 10000, 100, 3, 50000);
    // conversionRate = 3/100*100 = 3 < 5
    expect(result.isLowEfficiency).toBe(true);
    expect(result.alert).toContain('线索转化率');
  });

  it('does not flag low efficiency when all metrics are healthy', () => {
    const result = computeCampaignROI('c1', 'Campaign', '线下活动', 10000, 100, 10, 200000);
    expect(result.isLowEfficiency).toBe(false);
    expect(result.alert).toBeNull();
  });

  it('returns all fields correctly', () => {
    const result = computeCampaignROI('c1', 'Campaign A', '线下活动', 10000, 10, 2, 50000);
    expect(result.campaignId).toBe('c1');
    expect(result.campaignName).toBe('Campaign A');
    expect(result.campaignType).toBe('线下活动');
    expect(result.mdfInvestment).toBe(10000);
    expect(result.leadsGenerated).toBe(10);
    expect(result.dealsCreated).toBe(2);
    expect(result.dealValue).toBe(50000);
  });
});

describe('marketingROIEngine - diagnoseMarketing', () => {
  it('returns empty array for no campaigns', () => {
    expect(diagnoseMarketing([])).toEqual([]);
  });

  it('flags low ROI campaigns', () => {
    const campaigns = [
      computeCampaignROI('c1', 'Bad Campaign', '活动', 10000, 10, 1, 2000),
      computeCampaignROI('c2', 'Good Campaign', '活动', 10000, 10, 10, 200000),
    ];
    const result = diagnoseMarketing(campaigns);
    expect(result.some(d => d.type === 'low_roi')).toBe(true);
  });

  it('flags high CPL campaigns', () => {
    const campaigns = [
      computeCampaignROI('c1', 'Expensive', '活动', 60000, 5, 1, 10000),
    ];
    const result = diagnoseMarketing(campaigns);
    expect(result.some(d => d.type === 'high_cpl')).toBe(true);
  });

  it('flags budget warning when total ROI < 0.5', () => {
    const campaigns = [
      computeCampaignROI('c1', 'Campaign', '活动', 100000, 10, 1, 20000),
    ];
    const result = diagnoseMarketing(campaigns);
    expect(result.some(d => d.type === 'budget_warning')).toBe(true);
  });
});

describe('marketingROIEngine - sanitizeMetric', () => {
  it('returns fallback for null/undefined', () => {
    expect(sanitizeMetric(null as any)).toBe(0);
    expect(sanitizeMetric(undefined as any)).toBe(0);
    expect(sanitizeMetric(NaN)).toBe(0);
  });

  it('returns 100 for Infinity', () => {
    expect(sanitizeMetric(Infinity)).toBe(100);
  });

  it('rounds to 1 decimal place', () => {
    expect(sanitizeMetric(1.2345)).toBe(1.2);
    expect(sanitizeMetric(5.6789)).toBe(5.7);
  });

  it('respects custom fallback', () => {
    expect(sanitizeMetric(null as any, 99)).toBe(99);
  });
});

describe('marketingROIEngine - computePartnerMarketingScore', () => {
  it('calculates marketActivity capped at 100', () => {
    // marketActivity = campaignCount * 8
    const result = computePartnerMarketingScore(15, 0, 0, 0);
    expect(result.marketActivity).toBe(100);
  });

  it('calculates incentiveExecution = totalMDFUsed / 10000 capped at 100', () => {
    const result = computePartnerMarketingScore(0, 80000, 0, 0);
    expect(result.incentiveExecution).toBe(8);
  });

  it('calculates businessInteraction = dealsFromMarketing * 10 capped at 100', () => {
    const result = computePartnerMarketingScore(0, 0, 0, 12);
    expect(result.businessInteraction).toBe(100);
  });

  it('returns all three metrics', () => {
    const result = computePartnerMarketingScore(3, 50000, 100, 5);
    expect(result.marketActivity).toBe(24);
    expect(result.incentiveExecution).toBe(5);
    expect(result.businessInteraction).toBe(50);
  });
});
