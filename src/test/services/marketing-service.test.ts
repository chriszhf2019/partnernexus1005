import { describe, it, expect, vi, beforeEach } from 'vitest';

// Build a chainable supabase query mock
function makeChain(terminalResult: any) {
  const chain: Record<string, any> = {};
  for (const m of ['select', 'order', 'eq']) {
    chain[m] = vi.fn(() => chain);
  }
  // Make the chain thenable so `await chain` resolves to terminalResult
  chain.then = (onfulfilled: any) => Promise.resolve(terminalResult).then(onfulfilled);
  chain.single = vi.fn(() => Promise.resolve(terminalResult));
  return chain;
}

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
  db: {
    marketingActivities: vi.fn(),
    incentivePrograms: vi.fn(),
  },
}));

describe('marketingService', () => {
  let marketingService: any;
  let supabase: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules(); // Reset module state so cache is fresh each test
    const mod = await import('../../services/marketing-service');
    marketingService = mod.marketingService;
    const supMod = await import('../../lib/supabase');
    supabase = supMod.supabase;
    // Invalidate cache so each test starts fresh
    marketingService.invalidateCache();
  });

  describe('getMDFStats', () => {
    it('returns zero stats when no activities', async () => {
      const activitiesChain = makeChain({ data: [], error: null });
      const programsChain = makeChain({ data: [], error: null });
      supabase.from.mockImplementation((table: string) => {
        if (table === 'marketing_activities') return activitiesChain;
        if (table === 'incentive_programs') return programsChain;
        return makeChain({ data: null, error: null });
      });

      const stats = await marketingService.getMDFStats();
      expect(stats.annualQuota).toBe(0);
      expect(stats.usedAmount).toBe(0);
      expect(stats.remainingAmount).toBe(0);
      expect(stats.conversionRate).toBe(0);
      expect(stats.activityDistribution).toEqual([]);
    });

    it('calculates MDF stats from activities', async () => {
      const activitiesChain = makeChain({
        data: [
          { id: '1', name: '活动A', type: '研讨会', budget: 100000, actual_spend: 60000, leads_generated: 20, event_date: '2025-06-01', status: 'Completed', progress: 100 },
          { id: '2', name: '活动B', type: '线上推广', budget: 50000, actual_spend: 30000, leads_generated: 50, event_date: '2025-06-15', status: 'InProgress', progress: 60 },
        ],
        error: null,
      });
      const programsChain = makeChain({ data: [], error: null });
      supabase.from.mockImplementation((table: string) => {
        if (table === 'marketing_activities') return activitiesChain;
        if (table === 'incentive_programs') return programsChain;
        return makeChain({ data: null, error: null });
      });

      const stats = await marketingService.getMDFStats();
      expect(stats.annualQuota).toBe(150000);
      expect(stats.usedAmount).toBe(90000);
      expect(stats.remainingAmount).toBe(60000);
      expect(stats.conversionRate).toBe(88); // Math.round((70/2)*2.5)=88
      expect(stats.activityDistribution).toHaveLength(2);
      expect(stats.activityDistribution[0].type).toBe('研讨会');
    });

    it('handles DB error gracefully', async () => {
      supabase.from.mockReturnValue(makeChain({ data: null, error: new Error('DB error') }));

      const stats = await marketingService.getMDFStats();
      expect(stats.annualQuota).toBe(0);
      expect(stats.usedAmount).toBe(0);
    });
  });

  describe('getMDFActivities', () => {
    it('returns cached activities after refresh', async () => {
      const activitiesChain = makeChain({
        data: [
          { id: '1', name: '活动A', type: '研讨会', budget: 100000, actual_spend: 60000, leads_generated: 20, event_date: '2025-06-01', status: 'Completed', progress: 100 },
        ],
        error: null,
      });
      const programsChain = makeChain({ data: [], error: null });
      supabase.from.mockImplementation((table: string) => {
        if (table === 'marketing_activities') return activitiesChain;
        if (table === 'incentive_programs') return programsChain;
        return makeChain({ data: null, error: null });
      });

      const activities = await marketingService.getMDFActivities();
      expect(activities).toHaveLength(1);
      expect(activities[0].name).toBe('活动A');
      expect(activities[0].budget).toBe(100000);
      expect(activities[0].actualSpend).toBe(60000);
    });

    it('returns empty array when DB fails', async () => {
      supabase.from.mockReturnValue(makeChain({ data: null, error: new Error('fail') }));
      const activities = await marketingService.getMDFActivities();
      expect(activities).toEqual([]);
    });
  });

  describe('getIncentivePrograms', () => {
    it('returns mapped programs with computed fields', async () => {
      const activitiesChain = makeChain({ data: [], error: null });
      const programsChain = makeChain({
        data: [
          {
            id: 'p1', title: '季度激励', trigger_type: 'Pipeline Gap', status: 'Active',
            payout_type: 'Cash', total_budget: 500000, claimed_amount: 200000,
            participants_count: 15, description: '激励描述', start_date: '2025-01-01',
            end_date: '2025-03-31', created_at: '2025-01-01',
          },
        ],
        error: null,
      });
      supabase.from.mockImplementation((table: string) => {
        if (table === 'marketing_activities') return activitiesChain;
        if (table === 'incentive_programs') return programsChain;
        return makeChain({ data: null, error: null });
      });

      const programs = await marketingService.getIncentivePrograms();
      expect(programs).toHaveLength(1);
      expect(programs[0].title).toBe('季度激励');
      expect(programs[0].trigger).toBe('Pipeline Gap');
      expect(programs[0].status).toBe('Active');
      expect(programs[0].totalBudget).toBe(500000);
      expect(programs[0].claimedAmount).toBe(200000);
      expect(programs[0].participantsCount).toBe(15);
      // camelCase and snake_case aliases
      expect(programs[0].total_budget).toBe(500000);
      expect(programs[0].claimed_amount).toBe(200000);
      expect(programs[0].participants_count).toBe(15);
      // Computed
      expect(programs[0].remaining).toBe(300000);
      expect(programs[0].currentMonthPerformance).toBeDefined();
      expect(programs[0].currentMonthPerformance.target).toBeGreaterThan(0);
      expect(programs[0].currentMonthPerformance.rate).toBeGreaterThan(0);
    });

    it('returns empty array when DB returns null', async () => {
      supabase.from.mockReturnValue(makeChain({ data: null, error: null }));
      const programs = await marketingService.getIncentivePrograms();
      expect(programs).toEqual([]);
    });
  });

  describe('getIncentiveStats', () => {
    it('computes stats from programs', async () => {
      const activitiesChain = makeChain({ data: [], error: null });
      const programsChain = makeChain({
        data: [
          { id: 'p1', title: '激励1', trigger_type: 'Pipeline Gap', status: 'Active', total_budget: 300000, claimed_amount: 100000, participants_count: 10, payout_type: 'Cash', created_at: '2025-01-01' },
          { id: 'p2', title: '激励2', trigger_type: 'New Product', status: 'Active', total_budget: 200000, claimed_amount: 50000, participants_count: 8, payout_type: 'Rebate', created_at: '2025-02-01' },
          { id: 'p3', title: '激励3', trigger_type: 'Competitive', status: 'Upcoming', total_budget: 150000, claimed_amount: 0, participants_count: 5, payout_type: 'Points', created_at: '2025-03-01' },
        ],
        error: null,
      });
      supabase.from.mockImplementation((table: string) => {
        if (table === 'marketing_activities') return activitiesChain;
        if (table === 'incentive_programs') return programsChain;
        return makeChain({ data: null, error: null });
      });

      const stats = await marketingService.getIncentiveStats();
      expect(stats.totalActivePrograms).toBe(2);
      expect(stats.totalBudget).toBe(650000);
      expect(stats.totalUsed).toBe(150000);
      expect(stats.totalRemaining).toBe(500000);
      expect(stats.totalPayoutYTD).toBe(150000);
      expect(stats.topTrigger).toBe('Pipeline Gap');
      expect(stats.avgParticipationRate).toBeGreaterThan(0);
    });

    it('returns defaults with no programs', async () => {
      supabase.from.mockReturnValue(makeChain({ data: [], error: null }));
      const stats = await marketingService.getIncentiveStats();
      expect(stats.totalActivePrograms).toBe(0);
      expect(stats.totalBudget).toBe(0);
      expect(stats.totalUsed).toBe(0);
      expect(stats.topTrigger).toBe('Pipeline Gap');
    });
  });

  describe('getIncentiveById', () => {
    it('returns matching program', async () => {
      await marketingService.invalidateCache();
      // Prime the cache by calling getIncentivePrograms first
      supabase.from.mockImplementation((table: string) => {
        if (table === 'marketing_activities') return makeChain({ data: [], error: null });
        if (table === 'incentive_programs') return makeChain({
          data: [
            { id: 'p1', title: '激励1', trigger_type: 'Pipeline Gap', status: 'Active', total_budget: 100000, claimed_amount: 50000, participants_count: 5, payout_type: 'Cash', start_date: '2025-01-01', end_date: '2025-03-31', created_at: '2025-01-01' },
            { id: 'p2', title: '激励2', trigger_type: 'New Product', status: 'Active', total_budget: 200000, claimed_amount: 80000, participants_count: 10, payout_type: 'Rebate', start_date: '2025-02-01', end_date: '2025-04-30', created_at: '2025-02-01' },
          ],
          error: null,
        });
        return makeChain({ data: null, error: null });
      });

      const found = await marketingService.getIncentiveById('p2');
      expect(found).toBeDefined();
      expect(found!.title).toBe('激励2');
      expect(found!.trigger).toBe('New Product');

      const notFound = await marketingService.getIncentiveById('nonexistent');
      expect(notFound).toBeUndefined();
    });
  });

  describe('getIncentiveApplications', () => {
    it('returns mapped applications', async () => {
      const chain = makeChain({ data: null, error: null }); // default for refreshCache calls
      // The getIncentiveApplications function calls supabase.from('incentive_applications').select('*').order(...)
      // It uses a separate query that doesn't go through refreshCache
      supabase.from.mockImplementation((table: string) => {
        if (table === 'incentive_applications') {
          return makeChain({
            data: [
              { id: 'a1', plan_id: 'p1', partner_id: 'pt1', partner_name: '伙伴A', partner_tier: '金牌', metric: 'pipeline', claimed_value: 50000, payout_amount: 10000, status: 'approved', submitted_at: '2025-03-01T00:00:00Z', approved_at: '2025-03-05T00:00:00Z' },
              { id: 'a2', plan_id: 'p2', partner_id: 'pt2', partner_name: '伙伴B', partner_tier: '银牌', metric: 'revenue', claimed_value: 80000, payout_amount: 16000, status: 'pending', submitted_at: '2025-03-10T00:00:00Z', approved_at: null },
            ],
            error: null,
          });
        }
        return makeChain({ data: [], error: null });
      });

      const apps = await marketingService.getIncentiveApplications();
      expect(apps).toHaveLength(2);
      expect(apps[0].id).toBe('a1');
      expect(apps[0].planId).toBe('p1');
      expect(apps[0].partnerName).toBe('伙伴A');
      expect(apps[0].partnerTier).toBe('金牌');
      expect(apps[0].claimedValue).toBe(50000);
      expect(apps[0].payoutAmount).toBe(10000);
      expect(apps[0].status).toBe('approved');
      expect(apps[1].status).toBe('pending');
    });

    it('filters by planId when provided', async () => {
      const chain = makeChain({ data: null, error: null });
      supabase.from.mockImplementation((table: string) => {
        if (table === 'incentive_applications') {
          return chain; // return the chain so we can assert .eq was called
        }
        return makeChain({ data: [], error: null });
      });
      // Override the chain mock to return non-empty data
      chain.then = (onfulfilled: any) => Promise.resolve({
        data: [
          { id: 'a1', plan_id: 'p1', partner_id: 'pt1', partner_name: 'A', partner_tier: '金牌', metric: 'pipeline', claimed_value: 50000, payout_amount: 10000, status: 'approved', submitted_at: '2025-03-01T00:00:00Z', approved_at: '2025-03-05T00:00:00Z' },
        ],
        error: null,
      }).then(onfulfilled);

      const apps = await marketingService.getIncentiveApplications('p1');
      expect(apps).toHaveLength(1);
      expect(apps[0].planId).toBe('p1');
      expect(chain.eq).toHaveBeenCalledWith('plan_id', 'p1');
    });

    it('returns empty array when DB returns null', async () => {
      supabase.from.mockImplementation((table: string) => {
        if (table === 'incentive_applications') {
          return makeChain({ data: null, error: null });
        }
        return makeChain({ data: [], error: null });
      });

      const apps = await marketingService.getIncentiveApplications();
      expect(apps).toEqual([]);
    });
  });

  describe('getIncentiveTopPartners', () => {
    it('aggregates top partners by total claimed value', async () => {
      supabase.from.mockImplementation((table: string) => {
        if (table === 'incentive_applications') {
          return makeChain({
            data: [
              { partner_id: 'pt1', partner_name: '伙伴A', partner_tier: '金牌', claimed_value: 50000, status: 'approved' },
              { partner_id: 'pt1', partner_name: '伙伴A', partner_tier: '金牌', claimed_value: 30000, status: 'approved' },
              { partner_id: 'pt2', partner_name: '伙伴B', partner_tier: '银牌', claimed_value: 60000, status: 'approved' },
              { partner_id: 'pt3', partner_name: '伙伴C', partner_tier: '铜牌', claimed_value: 10000, status: 'approved' },
            ],
            error: null,
          });
        }
        return makeChain({ data: [], error: null });
      });

      const top = await marketingService.getIncentiveTopPartners();
      expect(top).toHaveLength(3);
      expect(top[0].name).toBe('伙伴A');
      expect(top[0].total).toBe(80000);
      expect(top[0].count).toBe(2);
      expect(top[1].name).toBe('伙伴B');
      expect(top[1].total).toBe(60000);
      // Sorted descending
      expect(top[0].total).toBeGreaterThan(top[1].total);
      expect(top[1].total).toBeGreaterThan(top[2].total);
    });

    it('limits results', async () => {
      const data = Array.from({ length: 10 }, (_, i) => ({
        partner_id: `pt${i}`, partner_name: `伙伴${i}`, partner_tier: '普通', claimed_value: (i + 1) * 10000, status: 'approved',
      }));
      supabase.from.mockImplementation((table: string) => {
        if (table === 'incentive_applications') {
          return makeChain({ data, error: null });
        }
        return makeChain({ data: [], error: null });
      });

      const top = await marketingService.getIncentiveTopPartners(undefined, 3);
      expect(top).toHaveLength(3);
    });

    it('returns empty array when no data', async () => {
      supabase.from.mockImplementation((table: string) => {
        if (table === 'incentive_applications') {
          return makeChain({ data: null, error: null });
        }
        return makeChain({ data: [], error: null });
      });

      const top = await marketingService.getIncentiveTopPartners();
      expect(top).toEqual([]);
    });
  });

  describe('invalidateCache', () => {
    it('forces re-fetch on next call', async () => {
      const mockData1 = makeChain({
        data: [{ id: 'a1', name: 'First', budget: 100, event_date: '2025-01-01', status: 'Completed', progress: 100 }],
        error: null,
      });
      const mockData2 = makeChain({
        data: [
          { id: 'a1', name: 'First', budget: 100, event_date: '2025-01-01', status: 'Completed', progress: 100 },
          { id: 'a2', name: 'Second', budget: 200, event_date: '2025-02-01', status: 'Planning', progress: 0 },
        ],
        error: null,
      });
      const emptyChain = makeChain({ data: [], error: null });

      let callCount = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === 'marketing_activities') {
          callCount++;
          return callCount === 1 ? mockData1 : mockData2;
        }
        if (table === 'incentive_programs') return emptyChain;
        return makeChain({ data: null, error: null });
      });

      const first = await marketingService.getMDFActivities();
      expect(first).toHaveLength(1);

      const second = await marketingService.getMDFActivities();
      // Should return cached data, still length 1
      expect(second).toHaveLength(1);
      expect(callCount).toBe(1); // refreshCache called only once

      marketingService.invalidateCache();
      const third = await marketingService.getMDFActivities();
      expect(third).toHaveLength(2);
      expect(callCount).toBe(2); // refreshCache called again
    });
  });
});
