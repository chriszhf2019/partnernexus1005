import { useMemo, useRef, useState, useEffect } from 'react';
import { dealService } from '../services/deal-service';
import { marketingService } from '../services/marketing-service';
import type { CockpitData, Partner, Deal, MDFMonthlyActivity, IncentiveProgram, MDFStats, IncentiveStats } from '../types';
import type { MatrixData } from '../types';
import { debug } from '../lib/debug';

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  time: string;
}

interface DealStats {
  yearNew: number;
  quarterNew: number;
  monthNew: number;
  weekNew: number;
  rejected: number;
  closed: number;
  totalPipelineValue: number;
  avgCycleDays: number;
  conversionRate: number;
  stageDistribution: Record<string, number>;
  sourceDistribution: Record<string, number>;
  conflictCount: number;
  overdueCount: number;
}

interface NetworkData {
  nodes: { id: string; name: string; role: string; size: number }[];
  links: any[];
}

// 阶段概率配置
const STAGE_PROBABILITIES: Record<string, { probability: number; avgCycleDays: number }> = {
  'Registered':    { probability: 10, avgCycleDays: 3 },
  'UnderReview':  { probability: 20, avgCycleDays: 5 },
  'Approved':     { probability: 35, avgCycleDays: 7 },
  'Solution':     { probability: 50, avgCycleDays: 14 },
  'Commercial':   { probability: 80, avgCycleDays: 21 },
  'ClosedWon':    { probability: 100, avgCycleDays: 0 },
  'ClosedLost':   { probability: 0, avgCycleDays: 0 },
};

export function usePartners() {
  const partnerListRef = useRef<Partner[]>([]);

  const partners = useMemo(() => {
    return [];
  }, []);

  return useMemo(() => ({
    partners,
    partnerDetails: null as Partner | null,
    partnerListRef,
  }), [partners]);
}

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<DealStats>({
    yearNew: 0, quarterNew: 0, monthNew: 0, weekNew: 0, rejected: 0, closed: 0,
    totalPipelineValue: 0, avgCycleDays: 0, conversionRate: 0,
    stageDistribution: {}, sourceDistribution: {},
    conflictCount: 0, overdueCount: 0,
  });

  useEffect(() => {
    dealService.list().then((result) => {
      const items = result.items;
      
      // 计算每个商机的额外字段
      const enrichedDeals = items.map((deal: Deal) => {
        const lifecycleEvents = deal.lifecycle || [];
        const currentStageEvent = lifecycleEvents[lifecycleEvents.length - 1];
        const daysInCurrentStage = currentStageEvent?.durationDays || 0;
        const avgDays = STAGE_PROBABILITIES[deal.stage]?.avgCycleDays || 7;
        const isStagnant = daysInCurrentStage > avgDays * 2;
        const createdDate = new Date(deal.createdDate || Date.now());
        const expireDate = new Date(createdDate.getTime() + 90 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const expiresInDays = Math.max(0, Math.ceil((expireDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
        const probability = STAGE_PROBABILITIES[deal.stage]?.probability || 0;
        const weightedValue = Math.round(deal.value * probability / 100);
        return { ...deal, daysInCurrentStage, isStagnant, expiresInDays, weightedValue };
      });
      
      setDeals(enrichedDeals);
      
      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const weekStart = new Date(now.getTime() - now.getDay() * 86400000);
      
      setStats({
        yearNew: enrichedDeals.filter(d => d.createdDate && new Date(d.createdDate) >= yearStart).length,
        quarterNew: enrichedDeals.filter(d => d.createdDate && new Date(d.createdDate) >= quarterStart).length,
        monthNew: enrichedDeals.filter(d => d.createdDate && new Date(d.createdDate) >= monthStart).length,
        weekNew: enrichedDeals.filter(d => d.createdDate && new Date(d.createdDate) >= weekStart).length,
        rejected: enrichedDeals.filter(d => d.status === 'Rejected').length,
        closed: enrichedDeals.filter(d => d.status === 'Converted' || d.status === 'Closed Won').length,
        totalPipelineValue: enrichedDeals.reduce((s, d) => s + Number(d.value || 0), 0),
        avgCycleDays: enrichedDeals.filter(d => d.conversionMetrics?.totalCycleDays).length > 0
          ? Math.round(enrichedDeals.reduce((s, d) => s + (d.conversionMetrics?.totalCycleDays || 0), 0) / enrichedDeals.filter(d => d.conversionMetrics?.totalCycleDays).length)
          : 0,
        conversionRate: enrichedDeals.length > 0
          ? Math.round((enrichedDeals.filter(d => d.status === 'Converted' || d.status === 'Closed Won').length / enrichedDeals.length) * 100)
          : 0,
        stageDistribution: enrichedDeals.reduce((acc, d) => {
          const stage = d.stage || 'Registered';
          acc[stage] = (acc[stage] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        sourceDistribution: enrichedDeals.reduce((acc, d) => {
          const source = d.sourceInfo?.source || 'Unknown';
          acc[source] = (acc[source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        conflictCount: enrichedDeals.filter(d => d.hasConflict).length,
        overdueCount: enrichedDeals.filter(d => d.expectedCloseDate && new Date(d.expectedCloseDate) < now && d.status !== 'Closed Won' && d.status !== 'Closed Lost').length,
      });
    }).catch(() => debug.warn('[useData] useDeals failed'));
  }, []);

  return useMemo(() => ({ deals, stats }), [deals, stats]);
}

export function useActivities() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  useEffect(() => {
    import('../lib/supabase').then(({ supabase }) => {
      Promise.all([
        supabase.from('partner_operation_logs').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('jbp_meetings').select('*').order('created_at', { ascending: false }).limit(5),
      ]).then(([logRes, jbpRes]) => {
        const logs: ActivityItem[] = ((logRes as any)?.data || []).map((l: Record<string, any>) => ({
          id: l.id, type: l.action === 'create' ? 'registration' : l.action === 'approve' ? 'milestone' : l.action === 'edit' ? 'registration' : 'visit',
          title: l.action === 'create' ? '创建合作伙伴' : l.action === 'approve' ? '批复通过' : l.action === 'reject' ? '驳回申请' : l.action === 'edit' ? '编辑信息' : (l.action || ''),
          description: l.details ? JSON.stringify(l.details).slice(0, 60) : '', date: l.created_at?.split('T')[0] || '', time: l.created_at?.split('T')[1]?.slice(0, 5) || '',
        }));
        const jbps: ActivityItem[] = ((jbpRes as any)?.data || []).map((j: Record<string, any>) => ({
          id: j.id, type: 'milestone', title: `JBP: ${j.title}`, description: `${j.meeting_type} · ${j.location}`, date: j.meeting_date || '', time: '',
        }));
        setActivities([...jbps, ...logs].slice(0, 20));
      }, () => {});
    });
  }, []);
  return useMemo(() => ({ activities }), [activities]);
}

export function useDashboardStats() {
  const [stats, setStats] = useState({ activePartners: { value: 0, growth: 0 }, pipelineValue: 0, revenueAchievement: 0, leadsConversion: 0 });
  useEffect(() => {
    import('../lib/supabase').then(({ supabase }) => {
      Promise.all([
        supabase.from('partners').select('status'),
        supabase.from('deals').select('value, status'),
      ]).then(([pRes, dRes]) => {
        const rawPartners: Record<string, any>[] = (pRes as any)?.data || [];
        const rawDeals: Record<string, any>[] = (dRes as any)?.data || [];
        const active = rawPartners.filter(p => p.status === 'Cooperating').length;
        const totalDealValue = rawDeals.reduce((s: number, d) => s + Number(d.value || 0), 0);
        const wonValue = rawDeals.filter(d => d.status === 'Converted' || d.status === 'Closed Won').reduce((s: number, d) => s + Number(d.value || 0), 0);
        setStats({
          activePartners: { value: active, growth: Math.round((active / Math.max(1, rawPartners.length)) * 100) },
          pipelineValue: totalDealValue,
          revenueAchievement: rawDeals.length > 0 ? Math.round((wonValue / Math.max(1, totalDealValue)) * 100) : 0,
          leadsConversion: 0,
        });
      }).catch(() => {});
    });
  }, []);
  return useMemo(() => ({ stats }), [stats]);
}

export function useMarketingData() {
  const [mdfActivities, setMdfActivities] = useState<MDFMonthlyActivity[]>([]);
  const [incentivePrograms, setIncentivePrograms] = useState<IncentiveProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      marketingService.getMDFActivities(),
      marketingService.getIncentivePrograms(),
    ]).then(([activities, programs]) => {
      setMdfActivities(activities);
      setIncentivePrograms(programs);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const mdfStats = useMemo((): MDFStats => {
    const total = mdfActivities.reduce((s, a) => s + (a.budget || 0), 0);
    const used = mdfActivities.reduce((s, a) => s + (a.actualSpend || 0), 0);
    const leads = mdfActivities.reduce((s, a) => s + (a.leadsGenerated || 0), 0);
    return {
      annualQuota: total,
      quarterlyQuota: Math.round(total / 4),
      usedAmount: used,
      remainingAmount: total - used,
      conversionRate: leads > 0 ? Math.round((leads / Math.max(1, mdfActivities.length)) * 2.5) : 0,
      activityDistribution: mdfActivities.length > 0
        ? mdfActivities.reduce((acc, a) => {
            const existing = acc.find(x => x.type === (a.type || '活动'));
            if (existing) { existing.count++; }
            else { acc.push({ type: a.type || '活动', percentage: 0, count: 1 }); }
            return acc;
          }, [] as { type: string; percentage: number; count: number }[]).map(x => ({ ...x, percentage: Math.round((x.count / mdfActivities.length) * 100) }))
        : [],
    };
  }, [mdfActivities]);

  const incentiveStats = useMemo((): IncentiveStats => {
    const active = incentivePrograms.filter(p => p.status === 'Active');
    const totalPayout = incentivePrograms.reduce((s, p) => s + (p.claimedAmount || 0), 0);
    const totalBudget = incentivePrograms.reduce((s, p) => s + (p.totalBudget || 0), 0);
    const triggerCounts: Record<string, number> = {};
    incentivePrograms.forEach(p => {
      const t = p.trigger || 'Pipeline Gap';
      triggerCounts[t] = (triggerCounts[t] || 0) + 1;
    });
    const topTrigger = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Pipeline Gap';
    return {
      totalActivePrograms: active.length,
      totalPayoutYTD: totalPayout,
      avgParticipationRate: incentivePrograms.length > 0
        ? Math.round(incentivePrograms.reduce((s, p) => s + (p.participantsCount || 0), 0) / incentivePrograms.length)
        : 0,
      topTrigger,
      totalBudget,
      totalUsed: totalPayout,
      totalRemaining: totalBudget - totalPayout,
      activePrograms: active.length,
    };
  }, [incentivePrograms]);

  return useMemo(() => ({ mdfStats, mdfActivities, incentivePrograms, incentiveStats, loading }), [mdfStats, mdfActivities, incentivePrograms, incentiveStats, loading]);
}

export function useMatrixData() {
  const [data, setData] = useState<MatrixData[]>([]);
  useEffect(() => {
    import('../lib/supabase').then(async ({ supabase }) => {
      try {
        const { data: rows } = await supabase.from('partners').select('region, industry');
        if (!rows?.length) return;
        const map = new Map<string, number>();
        rows.forEach((r: Record<string, any>) => {
          const key = `${r.region || '其他'}|${r.industry || '未分类'}`;
          map.set(key, (map.get(key) || 0) + 1);
        });
        const result: MatrixData[] = [];
        map.forEach((count, key) => {
          const [region, industry] = key.split('|');
          result.push({ industry, region, count });
        });
        setData(result);
      } catch { /* ignore */ }
    });
  }, []);
  return useMemo(() => ({ data }), [data]);
}

export function useNetworkData() {
  const [data, setData] = useState<NetworkData>({ nodes: [], links: [] });
  useEffect(() => {
    import('../lib/supabase').then(async ({ supabase }) => {
      try {
        const { data: rows } = await supabase.from('partners').select('id, name, type, tier').limit(20);
        if (!rows?.length) return;
        const nodes = rows.map((p: Record<string, any>) => ({
          id: p.id, name: p.name, role: p.type || 'Reseller', size: p.tier === 'Platinum' ? 5 : p.tier === 'Gold' ? 4 : 3,
        }));
        setData({ nodes, links: [] });
      } catch { /* ignore */ }
    });
  }, []);
  return useMemo(() => ({ nodes: data.nodes, links: data.links }), [data]);
}

function fallbackCockpitData(): CockpitData {
  const emptyMetric = (name: string): any => ({
    metric_name: name, current_value: 0, yoy: 0, qoq: 0, mom: 0, linear_rate: 0,
    achievements: { monthly: { current: 0, target: 100, rate: 0 }, quarterly: { current: 0, target: 100, rate: 0 }, yearly: { current: 0, target: 100, rate: 0 } },
    monthly_data: [{ month: '1月', value: 0 }, { month: '2月', value: 0 }, { month: '3月', value: 0 }, { month: '4月', value: 0 }, { month: '5月', value: 0 }, { month: '6月', value: 0 }],
    partner_ecosystem_details: {
      regional_coverage: [{ region: '华北', partner_count: 8, city_count: 20, deal_value: 19500000 }, { region: '华东', partner_count: 5, city_count: 12, deal_value: 35100000 }, { region: '华南', partner_count: 4, city_count: 10, deal_value: 58700000 }, { region: '华中', partner_count: 2, city_count: 8, deal_value: 14400000 }, { region: '西部', partner_count: 3, city_count: 6, deal_value: 4500000 }],
      tier_funnel: [{ tier: 'Diamond', count: 2, percentage: 9 }, { tier: 'Platinum', count: 2, percentage: 9 }, { tier: 'Gold', count: 5, percentage: 23 }, { tier: 'Silver', count: 7, percentage: 32 }, { tier: 'Registered', count: 6, percentage: 27 }],
    },
    active_split: { order_placing: { value: 11, target: 18, rate: 61 }, leads_reporting: { value: 8, target: 18, rate: 44 }, incentive_participants: { value: 6, target: 18, rate: 33 } },
    dimensional_achievements: [{ type: 'region', data: [{ name: '华北', rate: 72, activity_rate: 65, count: 8, value: 19500000 }, { name: '华东', rate: 68, activity_rate: 70, count: 5, value: 35100000 }, { name: '华南', rate: 55, activity_rate: 48, count: 4, value: 58700000 }, { name: '华中', rate: 80, activity_rate: 75, count: 2, value: 14400000 }] }, { type: 'partner_type', data: [{ name: 'Diamond', rate: 90, activity_rate: 85, count: 2 }, { name: 'Platinum', rate: 82, activity_rate: 78, count: 2 }, { name: 'Gold', rate: 70, activity_rate: 65, count: 5 }, { name: 'Silver', rate: 55, activity_rate: 50, count: 7 }] }],
  });
  return {
    revenue: { ...emptyMetric('Revenue'), current_value: 163900000, achievements: { monthly: { current: 49500000, target: 60000000, rate: 82 }, quarterly: { current: 49500000, target: 60000000, rate: 82 }, yearly: { current: 49500000, target: 80000000, rate: 62 } }, monthly_data: [{ month: '1月', value: 18000000 }, { month: '2月', value: 22000000 }, { month: '3月', value: 35000000 }, { month: '4月', value: 28000000 }, { month: '5月', value: 42000000 }, { month: '6月', value: 49500000 }] },
    activePartners: { ...emptyMetric('活跃伙伴数'), current_value: 18, achievements: { monthly: { current: 18, target: 22, rate: 82 }, quarterly: { current: 18, target: 22, rate: 82 }, yearly: { current: 18, target: 22, rate: 82 } }, monthly_data: [{ month: '1月', value: 15 }, { month: '2月', value: 16 }, { month: '3月', value: 17 }, { month: '4月', value: 16 }, { month: '5月', value: 17 }, { month: '6月', value: 18 }], partner_ecosystem_details: emptyMetric('').partner_ecosystem_details, active_split: emptyMetric('').active_split, dimensional_achievements: emptyMetric('').dimensional_achievements },
    pipeline: { ...emptyMetric('Pipeline'), current_value: 107100000, achievements: { monthly: { current: 15, target: 25, rate: 60 }, quarterly: { current: 15, target: 25, rate: 60 }, yearly: { current: 15, target: 30, rate: 50 } }, monthly_data: [{ month: '1月', value: 98200000 }, { month: '2月', value: 105000000 }, { month: '3月', value: 112000000 }, { month: '4月', value: 108000000 }, { month: '5月', value: 115000000 }, { month: '6月', value: 107100000 }] },
    leadsConversion: { ...emptyMetric('线索转化率'), current_value: 40, achievements: { monthly: { current: 40, target: 50, rate: 80 }, quarterly: { current: 40, target: 50, rate: 80 }, yearly: { current: 40, target: 50, rate: 80 } }, monthly_data: [{ month: '1月', value: 28 }, { month: '2月', value: 30 }, { month: '3月', value: 32 }, { month: '4月', value: 31 }, { month: '5月', value: 35 }, { month: '6月', value: 40 }] },
    marketing: emptyMetric('营销'),
    insights: [{ type: 'risk', title: '伙伴活跃度', content: '需激活沉睡伙伴', actionLabel: '查看', actionId: 'partners' }, { type: 'opportunity', title: 'MDF预算', content: '建议加速活动执行', actionLabel: '查看', actionId: 'marketing' }, { type: 'trend', title: '激励计划', content: '5个计划进行中', actionLabel: '查看', actionId: 'incentives' }],
  };
}

export function useCockpitData(): { data: CockpitData; loading: boolean } {
  const [data, setData] = useState<CockpitData>(fallbackCockpitData);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Static import - more reliable than dynamic import
    import('../lib/realCockpitData').then((mod) => {
      mod.getRealCockpitData().then((realData) => {
        if (realData?.revenue?.current_value > 0) {
          setData(realData);
        } else {
          console.warn('[useCockpitData] Empty real data, using fallback');
        }
        setLoading(false);
      }).catch((e) => {
        console.warn('[useCockpitData] Query failed:', e?.message || e);
        setLoading(false);
      });
    }).catch((e) => {
      console.warn('[useCockpitData] Import failed:', e?.message || e);
      setLoading(false);
    });
  }, []);
  return { data, loading };
}
