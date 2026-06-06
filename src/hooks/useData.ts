import { useMemo, useRef, useState, useEffect } from 'react';
import { dealService } from '../services/deal-service';
import type { CockpitData, Partner, Deal } from '../types';

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
    partnerDetails: null as any,
    partnerListRef,
  }), [partners]);
}

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState({
    yearNew: 0, quarterNew: 0, monthNew: 0, weekNew: 0, rejected: 0, closed: 0,
    totalPipelineValue: 0, avgCycleDays: 0, conversionRate: 0,
    stageDistribution: {} as any, sourceDistribution: {} as any,
    conflictCount: 0, overdueCount: 0,
  });

  useEffect(() => {
    dealService.list().then((result) => {
      const items = result.items;
      
      // 计算每个商机的额外字段
      const enrichedDeals = items.map((deal: Deal) => {
        // 计算当前阶段停留天数
        const lifecycleEvents = deal.lifecycle || [];
        const currentStageEvent = lifecycleEvents[lifecycleEvents.length - 1];
        const daysInCurrentStage = currentStageEvent?.durationDays || 0;
        
        // 判断是否异常停滞（超过该阶段平均周期的2倍）
        const avgDays = STAGE_PROBABILITIES[deal.stage]?.avgCycleDays || 7;
        const isStagnant = daysInCurrentStage > avgDays * 2;
        
        // 计算有效期剩余天数（假设报备有效期为90天）
        const createdDate = new Date(deal.createdDate || Date.now());
        const expireDate = new Date(createdDate.getTime() + 90 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const expiresInDays = Math.max(0, Math.ceil((expireDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
        
        // 计算加权金额
        const probability = STAGE_PROBABILITIES[deal.stage]?.probability || 0;
        const weightedValue = Math.round(deal.value * probability / 100);
        
        return {
          ...deal,
          daysInCurrentStage,
          isStagnant,
          expiresInDays,
          weightedValue,
        };
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
        }, {} as Record<string, number> as Record<string, number>),
        sourceDistribution: enrichedDeals.reduce((acc, d) => {
          const source = d.sourceInfo?.source || 'Unknown';
          acc[source] = (acc[source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        conflictCount: enrichedDeals.filter(d => d.hasConflict).length,
        overdueCount: enrichedDeals.filter(d => d.expectedCloseDate && new Date(d.expectedCloseDate) < now && d.status !== 'Closed Won' && d.status !== 'Closed Lost').length,
      });
    }).catch(() => {});
  }, []);

  return useMemo(() => ({ deals, stats }), [deals, stats]);
}

export function useActivities() {
  const [activities, setActivities] = useState<any[]>([]);
  useEffect(() => {
    import('../lib/supabase').then(({ supabase }) => {
      Promise.all([
        supabase.from('partner_operation_logs').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('jbp_meetings').select('*').order('created_at', { ascending: false }).limit(5),
      ]).then(([logRes, jbpRes]: any[]) => {
        const logs = (logRes.data || []).map((l: any) => ({
          id: l.id, type: l.action === 'create' ? 'registration' : l.action === 'approve' ? 'milestone' : l.action === 'edit' ? 'registration' : 'visit',
          title: l.action === 'create' ? '创建合作伙伴' : l.action === 'approve' ? '批复通过' : l.action === 'reject' ? '驳回申请' : l.action === 'edit' ? '编辑信息' : l.action,
          description: l.details ? JSON.stringify(l.details).slice(0, 60) : '', date: l.created_at?.split('T')[0] || '', time: l.created_at?.split('T')[1]?.slice(0, 5) || '',
        }));
        const jbps = (jbpRes.data || []).map((j: any) => ({
          id: j.id, type: 'milestone', title: `JBP: ${j.title}`, description: `${j.meeting_type} · ${j.location}`, date: j.meeting_date || '', time: '',
        }));
        setActivities([...jbps, ...logs].slice(0, 20));
      }, () => {}); // Keep empty on error
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
      ]).then(([pRes, dRes]: any[]) => {
        const partners = (pRes.data || []) as any[];
        const deals = (dRes.data || []) as any[];
        const active = partners.filter((p: any) => p.status === 'Cooperating').length;
        const totalDealValue = deals.reduce((s: number, d: any) => s + Number(d.value || 0), 0);
        const wonValue = deals.filter((d: any) => d.status === 'Converted' || d.status === 'Closed Won').reduce((s: number, d: any) => s + Number(d.value || 0), 0);
        setStats({
          activePartners: { value: active, growth: Math.round((active / Math.max(1, partners.length)) * 100) },
          pipelineValue: totalDealValue,
          revenueAchievement: deals.length > 0 ? Math.round((wonValue / Math.max(1, totalDealValue)) * 100) : 0,
          leadsConversion: 0,
        });
      }).catch(() => {});
    });
  }, []);
  return useMemo(() => ({ stats }), [stats]);
}

export function useMarketingData() {
  const [mdfActivities, setMdfActivities] = useState<any[]>([]);
  const [incentivePrograms, setIncentivePrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    import('../lib/supabase').then(({ supabase }) => {
      // Fetch marketing activities
      supabase.from('marketing_activities').select('*').order('event_date', { ascending: false }).then(({ data }: any) => {
        if (data?.length) {
          setMdfActivities(data.map((a: any) => ({
            id: a.id, name: a.name, type: a.type, date: a.event_date, status: a.status,
            budget: a.budget, actualSpend: a.actual_spend, leadsGenerated: a.leads_generated, progress: a.progress,
            hostType: a.host_type, partnerId: a.partner_id, partnerName: a.partner_name,
            location: a.location, description: a.description,
            contactName: a.contact_name, contactPhone: a.contact_phone,
            maxAttendees: a.max_attendees, enableQuestions: a.enable_questions,
            enableLottery: a.enable_lottery, lotteryReward: a.lottery_reward,
            signupPoints: a.signup_points, checkinPoints: a.checkin_points,
            invitationCode: a.invitation_code, expectedAttendees: a.expected_attendees,
            eventDate: a.event_date,
          })));
        }
        setLoading(false);
      }, () => setLoading(false));

      // Fetch incentive programs
      supabase.from('incentive_programs').select('*').order('created_at', { ascending: false }).then(({ data }: any) => {
        if (data?.length) {
          setIncentivePrograms(data.map((p: any) => ({
            id: p.id, title: p.title, trigger: p.trigger_type, status: p.status, payoutType: p.payout_type,
            totalBudget: p.total_budget, claimedAmount: p.claimed_amount, participantsCount: p.participants_count,
            description: p.description, startDate: p.start_date, endDate: p.end_date,
            type: p.trigger_type,
            quarter: p.quarter,
            year: p.year,
            budget: p.total_budget,
            used: p.claimed_amount,
            remaining: (p.total_budget || 0) - (p.claimed_amount || 0),
            targetDeals: p.target_deals,
            registeredDeals: p.registered_deals,
            conversionRate: p.target_deals > 0 ? Math.round((p.registered_deals || 0) / p.target_deals * 100) : 0,
            topPartners: p.top_partners || [],
            currentMonthPerformance: {
              target: Math.round((p.total_budget || 0) / 6),
              rate: p.total_budget > 0 ? Math.round((p.claimed_amount || 0) / p.total_budget * 100) : 0,
              growth: 12,
            },
          })));
        }
        setLoading(false);
      }, () => setLoading(false));
    }, () => setLoading(false));
  }, []);

  const mdfStats = useMemo(() => {
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
        ? mdfActivities.reduce((acc: { type: string; percentage: number; count: number }[], a) => {
            const existing = acc.find(x => x.type === (a.type || '活动'));
            if (existing) { existing.count++; }
            else { acc.push({ type: a.type || '活动', percentage: 0, count: 1 }); }
            return acc;
          }, []).map(x => ({ ...x, percentage: Math.round((x.count / mdfActivities.length) * 100) }))
        : [],
    };
  }, [mdfActivities]);

  const incentiveStats = useMemo(() => {
    const active = incentivePrograms.filter(p => p.status === 'Active');
    const totalPayout = incentivePrograms.reduce((s, p) => s + (p.claimedAmount || 0), 0);
    const totalBudget = incentivePrograms.reduce((s, p) => s + (p.totalBudget || 0), 0);
    // Count top trigger type from active programs
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
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    import('../lib/supabase').then(async ({ supabase }) => {
      try {
        const { data: rows } = await supabase.from('partners').select('region, industry');
        if (!rows?.length) return;
        const map = new Map<string, number>();
        rows.forEach((r: any) => {
          const key = `${r.region || '其他'}|${r.industry || '未分类'}`;
          map.set(key, (map.get(key) || 0) + 1);
        });
        const result: any[] = [];
        map.forEach((count, key) => {
          const [region, industry] = key.split('|');
          result.push({ industry, region, count });
        });
        setData(result);
      } catch {
        // ignore
      }
    });
  }, []);
  return useMemo(() => ({ data }), [data]);
}

export function useNetworkData() {
  const [data, setData] = useState({ nodes: [] as any[], links: [] as any[] });
  useEffect(() => {
    import('../lib/supabase').then(async ({ supabase }) => {
      try {
        const { data: rows } = await supabase.from('partners').select('id, name, type, tier').limit(20);
        if (!rows?.length) return;
        const nodes: any[] = rows.map((p: any) => ({ id: p.id, name: p.name, role: p.type || 'Reseller', size: p.tier === 'Platinum' ? 5 : p.tier === 'Gold' ? 4 : 3 }));
        setData({ nodes, links: [] });
      } catch {
        // ignore
      }
    });
  }, []);
  return useMemo(() => ({ nodes: data.nodes, links: data.links }), [data]);
}

export function useCockpitData(): { data: CockpitData; loading: boolean } {
  const [data, setData] = useState<CockpitData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    import('../lib/realCockpitData').then(({ getRealCockpitData }) => {
      getRealCockpitData().then((realData) => {
        setData(realData);
        setLoading(false);
      }).catch(() => {
        setData(null);
        setLoading(false);
      });
    }).catch(() => {
      setData(null);
      setLoading(false);
    });
  }, []);
  return { data: data || ({} as CockpitData), loading };
}
