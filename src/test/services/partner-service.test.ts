import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDb = {
  partners: vi.fn(),
  operationLogs: vi.fn(),
  contacts: vi.fn(),
};

vi.mock('../../lib/supabase', () => ({
  supabase: {} as any,
  db: mockDb,
}));

// Create a chainable query mock that is also thenable (awaitable)
function makeChain(terminalResult: any) {
  const chain: Record<string, any> = {};
  // Chain methods return the chain itself
  for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'in', 'order']) {
    chain[m] = vi.fn(() => chain);
  }
  // Make the chain thenable so `await chain` resolves to terminalResult
  chain.then = (onfulfilled: any) => Promise.resolve(terminalResult).then(onfulfilled);
  // single() returns a Promise that resolves to terminalResult
  chain.single = vi.fn(() => Promise.resolve(terminalResult));
  return chain;
}

describe('partnerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('returns empty array when DB unavailable', async () => {
      const chain = makeChain({ data: null, error: new Error('DB error') });
      mockDb.partners.mockReturnValue(chain);
      const { partnerService } = await import('../../services/partner-service');
      const result = await partnerService.list();
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getById', () => {
    it('returns null when partner not found', async () => {
      const chain = makeChain({ data: null, error: null });
      mockDb.partners.mockReturnValue(chain);
      const { partnerService } = await import('../../services/partner-service');
      const result = await partnerService.getById('nonexistent');
      expect(result).toBeNull();
    });

    it('normalizes partner data', async () => {
      const rawPartner = {
        id: 'test-1', name: 'Test Partner',
        tier: 'Gold', status: 'Cooperating', type: 'Reseller',
        start_date: '2020-06-15',
      };
      const chain = makeChain({ data: rawPartner, error: null });
      mockDb.partners.mockReturnValue(chain);
      const { partnerService } = await import('../../services/partner-service');
      const result = await partnerService.getById('test-1');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Test Partner');
      expect(result!.status).toBe('Cooperating');
      expect(result!.contacts).toEqual([]);
    });
  });

  describe('create', () => {
    it('creates partner with generated UUID', async () => {
      const chain = makeChain({ data: { id: 'new-id', name: 'New Partner', tier: 'Silver' }, error: null });
      mockDb.partners.mockReturnValue(chain);
      mockDb.operationLogs.mockReturnValue(makeChain({ data: [], error: null }));
      const { partnerService } = await import('../../services/partner-service');
      const result = await partnerService.create({
        name: 'New Partner', type: 'Reseller', region: '华东',
      });
      expect(result).toBeDefined();
      expect(result.name).toBe('New Partner');
    });
  });
});
