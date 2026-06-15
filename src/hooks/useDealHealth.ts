import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchDealHealthData } from '../lib/dealHealthEngine';
import type { DealHealthScore, StageFunnelDiagnosis } from '../lib/dealHealthEngine';

interface DealHealthState {
  loading: boolean;
  healthScores: Map<string, DealHealthScore>;
  funnelDiagnosis: StageFunnelDiagnosis[];
  actions: { title: string; description: string; link: string; type: string }[];
  totalDeals: number;
}

export function useDealHealth() {
  const [state, setState] = useState<DealHealthState>({
    loading: true,
    healthScores: new Map(),
    funnelDiagnosis: [],
    actions: [],
    totalDeals: 0,
  });

  const load = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const data = await fetchDealHealthData();
      setState({ loading: false, ...data });
    } catch {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getDealHealth = useCallback((dealId: string): DealHealthScore | undefined => {
    return state.healthScores.get(dealId);
  }, [state.healthScores]);

  const bottlenecks = useMemo(() =>
    state.funnelDiagnosis.filter(f => f.isBottleneck),
  [state.funnelDiagnosis]);

  const stuckCount = useMemo(() =>
    Array.from(state.healthScores.values()).filter(h => h.status === 'STUCK').length,
  [state.healthScores]);

  return useMemo(() => ({
    ...state,
    bottlenecks,
    stuckCount,
    getDealHealth,
    refresh: load,
  }), [state, bottlenecks, stuckCount, getDealHealth, load]);
}
