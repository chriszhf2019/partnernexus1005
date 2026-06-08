import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDb = {
  deals: vi.fn(),
};

vi.mock('../../lib/supabase', () => ({
  supabase: {} as any,
  db: mockDb,
}));

function makeChain(terminalResult: any) {
  const chain: Record<string, any> = {};
  for (const m of ['select', 'insert', 'update', 'eq', 'in', 'order']) {
    chain[m] = vi.fn(() => chain);
  }
  chain.then = (onfulfilled: any) => Promise.resolve(terminalResult).then(onfulfilled);
  chain.single = vi.fn(() => Promise.resolve(terminalResult));
  return chain;
}

describe('dealService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('returns empty array when DB returns null', async () => {
      const chain = makeChain({ data: null, error: null });
      mockDb.deals.mockReturnValue(chain);
      const { dealService } = await import('../../services/deal-service');
      const result = await dealService.list();
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('returns empty array when DB throws', async () => {
      mockDb.deals.mockImplementation(() => { throw new Error('Network error'); });
      const { dealService } = await import('../../services/deal-service');
      const result = await dealService.list();
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getById', () => {
    it('returns null when DB returns null', async () => {
      const chain = makeChain({ data: null, error: null });
      mockDb.deals.mockReturnValue(chain);
      const { dealService } = await import('../../services/deal-service');
      const result = await dealService.getById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getStats', () => {
    it('returns zero stats on empty data', async () => {
      const chain = makeChain({ data: [], error: null });
      mockDb.deals.mockReturnValue(chain);
      const { dealService } = await import('../../services/deal-service');
      const stats = await dealService.getStats();
      expect(stats.yearNew).toBe(0);
      expect(stats.quarterNew).toBe(0);
      expect(stats.conversionRate).toBe(0);
    });
  });

  describe('create', () => {
    it('throws on DB error', async () => {
      const chain = {
        insert: vi.fn(() => chain),
        select: vi.fn(() => chain),
        single: vi.fn(() => Promise.reject(new Error('DB error'))),
      };
      mockDb.deals.mockReturnValue(chain);
      const { dealService } = await import('../../services/deal-service');
      await expect(dealService.create({
        title: 'Test Deal', customerName: 'Test Customer', value: 10000,
        partnerId: 'p1', partnerName: 'Test Partner', partnerType: 'Reseller',
        stage: 'Registered' as const, status: 'Pending' as const, region: '华东',
        salesName: 'Test', salesTeam: 'Test Team', productType: 'Software',
        createdDate: '2024-01-01', expectedCloseDate: '2024-06-01',
        lastActivityDate: '2024-03-01', lifecycle: [],
      })).rejects.toThrow();
    });
  });
});
