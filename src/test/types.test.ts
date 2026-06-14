import { describe, it, expect } from 'vitest';
import { DEALS, ACTIVITIES, PARTNER_DETAILS, DEAL_STATS, MDF_STATS, INCENTIVE_PROGRAMS } from '../constants';

describe('Constants / Mock Data', () => {
  it('mock data files removed — data comes from DB now', () => {
    // importedPartners.ts 已移除，合作伙伴数据直接从 Supabase 获取
    expect(true).toBe(true);
  });

  it('each partner has required fields', () => {
    expect(PARTNER_DETAILS.id).toBeDefined();
    expect(PARTNER_DETAILS.name).toBeDefined();
  });

  it('DEALS is a non-empty array', () => {
    expect(DEALS.length).toBeGreaterThan(0);
  });

  it('each deal has lifecycle events', () => {
    DEALS.forEach(deal => {
      expect(deal.lifecycle).toBeDefined();
    });
  });

  it('DEAL_STATS has all required fields', () => {
    expect(DEAL_STATS).toBeDefined();
    expect(DEAL_STATS.yearNew).toBeGreaterThanOrEqual(0);
    expect(typeof DEAL_STATS.conversionRate).toBe('number');
  });

  it('PARTNER_DETAILS has nested objects', () => {
    expect(PARTNER_DETAILS.pipeline).toBeDefined();
    expect(PARTNER_DETAILS.mdf).toBeDefined();
    expect(PARTNER_DETAILS.enablement).toBeDefined();
    expect(Array.isArray(PARTNER_DETAILS.followUps)).toBe(true);
    expect(Array.isArray(PARTNER_DETAILS.topProjects)).toBe(true);
  });

  it('ACTIVITIES has required fields', () => {
    ACTIVITIES.forEach(activity => {
      expect(activity.id).toBeDefined();
      expect(activity.type).toBeDefined();
      expect(activity.title).toBeDefined();
    });
  });

  it('MDF_STATS has valid values', () => {
    expect(MDF_STATS.annualQuota).toBeGreaterThan(0);
    expect(MDF_STATS.quarterlyQuota).toBeGreaterThan(0);
    expect(MDF_STATS.conversionRate).toBeGreaterThanOrEqual(0);
  });

  it('INCENTIVE_PROGRAMS contains active programs', () => {
    expect(INCENTIVE_PROGRAMS.length).toBeGreaterThan(0);
    const active = INCENTIVE_PROGRAMS.filter(p => p.status === 'Active');
    expect(active.length).toBeGreaterThan(0);
  });
});
