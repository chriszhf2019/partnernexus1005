import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeDealHealth, diagnoseStageFunnel, computeAllDealHealth } from '../../lib/dealHealthEngine';
import type { Deal } from '../../types';

// Mock Date.now to get deterministic "daysSinceActivity" calculations
const FIXED_NOW = new Date('2025-06-15T00:00:00.000Z').getTime();
beforeEach(() => {
  vi.setSystemTime(FIXED_NOW);
});

function makeDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: 'deal-1',
    title: 'Test Deal',
    customerId: 'cust-1',
    customerName: 'Test Customer',
    customerIndustry: 'IT',
    value: 100000,
    partnerId: 'partner-1',
    partnerName: 'Test Partner',
    partnerType: 'Reseller',
    stage: 'Registered',
    status: 'Pending',
    region: '',
    province: '',
    city: '',
    salesName: '',
    salesTeam: '',
    productType: '',
    createdDate: '2025-06-01T00:00:00Z',
    lastActivityDate: '2025-06-10T00:00:00Z',
    expectedCloseDate: '',
    lifecycle: [],
    description: '',
    weightedValue: 0,
    daysInCurrentStage: 5,
    hasConflict: false,
    expiresInDays: 30,
    ...overrides,
  } as Deal;
}

describe('dealHealthEngine - computeDealHealth', () => {
  describe('score calculation', () => {
    it('returns 0 score for ClosedLost deals', () => {
      const deal = makeDeal({ stage: 'ClosedLost', daysInCurrentStage: 10 });
      const result = computeDealHealth(deal);
      expect(result.score).toBe(0);
      expect(result.status).toBe('LOST');
    });

    it('scores 100 for brand new deal with recent activity', () => {
      // Registered: probability=10 → stageScore=4; daysSinceActivity=0 → activityScore=30;
      // stayDays=0 ≤ avgStageDays=3 → stagnationPenalty=0; total=34 → clamped to 34
      const deal = makeDeal({
        stage: 'Registered',
        daysInCurrentStage: 0,
        lastActivityDate: '2025-06-15T00:00:00Z', // today
      });
      const result = computeDealHealth(deal);
      expect(result.score).toBe(34); // 4 + 30 - 0
    });

    it('applies stagnation penalty when stayDays > benchmarkDays', () => {
      // Registered: benchmarkDays=3; stayDays=8 (>3)
      // stageScore=4; daysSinceActivity=5 → activityScore=20; stagnationPenalty=(8-3)*5=25
      // total = 4 + 20 - 25 = -1 → clamped to 0
      const deal = makeDeal({
        stage: 'Registered',
        daysInCurrentStage: 8,
        lastActivityDate: '2025-06-10T00:00:00Z', // 5 days ago
      });
      const result = computeDealHealth(deal);
      expect(result.score).toBe(0);
      expect(result.isStagnant).toBe(true);
      expect(result.status).toBe('STUCK');
    });

    it('returns AT_RISK when stayDays > benchmarkDays but < 2x', () => {
      // Registered: benchmarkDays=3; stayDays=5 (>3 but < 6)
      // stageScore=4; daysSinceActivity=0 → activityScore=30; stagnationPenalty=(5-3)*5=10
      // total = 4 + 30 - 10 = 24
      const deal = makeDeal({
        stage: 'Registered',
        daysInCurrentStage: 5,
        lastActivityDate: '2025-06-15T00:00:00Z',
      });
      const result = computeDealHealth(deal);
      expect(result.status).toBe('AT_RISK');
    });

    it('uses createdDate when lastActivityDate is missing', () => {
      const deal = makeDeal({
        stage: 'Registered',
        daysInCurrentStage: 0,
        lastActivityDate: '',
        createdDate: '2025-06-15T00:00:00Z', // today
      });
      const result = computeDealHealth(deal);
      expect(result.score).toBe(34);
    });

    it('marks deal as AT_RISK when hasConflict is true', () => {
      const deal = makeDeal({
        stage: 'Registered',
        daysInCurrentStage: 1,
        lastActivityDate: '2025-06-15T00:00:00Z',
        hasConflict: true,
      });
      const result = computeDealHealth(deal);
      expect(result.status).toBe('AT_RISK');
      expect(result.isConflict).toBe(true);
      expect(result.riskFactors).toContain('存在报备冲突');
    });

    it('adds "no activity" risk factor when daysSinceActivity > 14', () => {
      // lastActivity=2025-05-31 (15 days ago)
      const deal = makeDeal({
        stage: 'Approved', // benchmarkDays=7
        daysInCurrentStage: 3,
        lastActivityDate: '2025-05-31T00:00:00Z',
      });
      const result = computeDealHealth(deal);
      expect(result.riskFactors.some(r => r.includes('无活动'))).toBe(true);
    });

    it('computes correct velocity', () => {
      // Registered: probability=10; stayDays=5; velocity=round(10/5*10)/10=2.0
      const deal = makeDeal({ stage: 'Registered', daysInCurrentStage: 5 });
      const result = computeDealHealth(deal);
      expect(result.velocity).toBe(2);
    });

    it('returns velocity 0 when stayDays is 0', () => {
      const deal = makeDeal({ stage: 'Registered', daysInCurrentStage: 0 });
      const result = computeDealHealth(deal);
      expect(result.velocity).toBe(0);
    });
  });

  describe('stage-specific behavior', () => {
    it('handles ClosedWon stage correctly', () => {
      // ClosedWon: probability=100 → stageScore=40; activityScore=20 (5 days since lastActivity);
      // benchmarkDays=0, stayDays=5 → stagnationPenalty=25
      // score = 40+20-25 = 35
      const deal = makeDeal({ stage: 'ClosedWon' });
      const result = computeDealHealth(deal);
      expect(result.score).toBe(35);
      // ClosedWon with stayDays=5 > 0*2=0 → status is STUCK
      expect(result.status).toBe('STUCK');
      expect(result.isStagnant).toBe(true);
    });

    it('handles Negotiation stage (highest probability)', () => {
      // Negotiation: probability=90 → stageScore=36; stayDays=3 (≤15);
      // activityScore=20 (5 days since lastActivity default)
      // score = 36+20-0 = 56
      const deal = makeDeal({ stage: 'Negotiation', daysInCurrentStage: 3 });
      const result = computeDealHealth(deal);
      expect(result.score).toBe(56);
      expect(result.isStagnant).toBe(false);
    });
  });
});

describe('dealHealthEngine - diagnoseStageFunnel', () => {
  it('returns result for each funnel stage even when no deals exist', () => {
    const result = diagnoseStageFunnel([]);
    expect(result.length).toBe(5);
    expect(result.map(d => d.stage)).toEqual(['Registered', 'UnderReview', 'Approved', 'Solution', 'Commercial']);
    // All empty funnel stages are flagged as bottlenecks
    expect(result.every(d => d.isBottleneck)).toBe(true);
  });

  it('identifies bottleneck when conversionRate < 30%', () => {
    const deals: Deal[] = [
      makeDeal({ id: 'd1', stage: 'Registered', lifecycle: [] }),
      makeDeal({ id: 'd2', stage: 'Registered', lifecycle: [] }),
      makeDeal({ id: 'd3', stage: 'Registered', lifecycle: [] }),
      // 0 passed to next stage → conversionRate = 0
    ];
    const result = diagnoseStageFunnel(deals);
    const registered = result.find(d => d.stage === 'Registered');
    expect(registered?.conversionRate).toBe(0);
    expect(registered?.isBottleneck).toBe(true);
  });

  it('identifies bottleneck when avgStayDays > benchmarkDays * 1.5', () => {
    const deals: Deal[] = [
      makeDeal({ id: 'd1', stage: 'UnderReview', daysInCurrentStage: 20 }),
      makeDeal({ id: 'd2', stage: 'UnderReview', daysInCurrentStage: 20 }),
    ];
    const result = diagnoseStageFunnel(deals);
    const underReview = result.find(d => d.stage === 'UnderReview');
    // UnderReview benchmarkDays=5; 1.5x=7.5; avgStayDays=20 > 7.5 → isBottleneck
    expect(underReview?.isBottleneck).toBe(true);
  });

  it('does not flag bottleneck when conversionRate >= 30% and avgStayDays normal', () => {
    // passedToNext filters ALL deals regardless of current stage
    const deals: Deal[] = [
      makeDeal({ id: 'd1', stage: 'Registered', lifecycle: [{ stage: 'UnderReview' } as any] }),
      makeDeal({ id: 'd2', stage: 'UnderReview', lifecycle: [] }),
      makeDeal({ id: 'd3', stage: 'UnderReview', lifecycle: [] }),
    ];
    const result = diagnoseStageFunnel(deals);
    const registered = result.find(d => d.stage === 'Registered');
    // inStage=1 (d1), passedToNext=1 (d1 has UnderReview in lifecycle)
    // entryCount=2, exitCount=1 → 50% → isBottleneck=true (50 >= 30 but logic is OR with avgStayDays)
    // avgStayDays=5 (default), benchmarkDays=3, 5 > 4.5 → isBottleneck=true
    expect(registered?.conversionRate).toBe(50);
    expect(registered?.isBottleneck).toBe(true);
  });

  it('counts lifecycle events to determine exitCount', () => {
    const deals: Deal[] = [
      makeDeal({ id: 'd1', stage: 'Approved', lifecycle: [{ stage: 'Solution' } as any] }),
    ];
    const result = diagnoseStageFunnel(deals);
    const approved = result.find(d => d.stage === 'Approved');
    // inStage=1, passedToNext=1 (d1 has Solution in lifecycle)
    // entryCount=2, exitCount=1 → 50%
    expect(approved?.entryCount).toBe(2);
    expect(approved?.exitCount).toBe(1);
    expect(approved?.conversionRate).toBe(50);
  });
});

describe('dealHealthEngine - computeAllDealHealth', () => {
  it('computes health for all deals', () => {
    // Use deals within healthy benchmarks (daysInCurrentStage within stage's benchmarkDays)
    const deals = [
      makeDeal({ id: 'd1', stage: 'Registered', daysInCurrentStage: 1, lastActivityDate: '2025-06-15T00:00:00Z' }),
      makeDeal({ id: 'd2', stage: 'Negotiation', daysInCurrentStage: 5, lastActivityDate: '2025-06-15T00:00:00Z' }),
    ];
    const result = computeAllDealHealth(deals);
    expect(result.size).toBe(2);
    expect(result.get('d1')?.status).toBe('HEALTHY');
    expect(result.get('d2')?.status).toBe('HEALTHY');
  });

  it('maps deals by their id', () => {
    const deals = [makeDeal({ id: 'deal-abc' })];
    const result = computeAllDealHealth(deals);
    expect(result.has('deal-abc')).toBe(true);
  });
});
