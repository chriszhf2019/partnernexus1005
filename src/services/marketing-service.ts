import { supabase } from '../lib/supabase';
import type { MDFStats, MDFMonthlyActivity, IncentiveProgram, IncentiveStats } from '../types';

// Helper: map DB row to MDFMonthlyActivity
function mapActivity(a: any): MDFMonthlyActivity {
  return {
    id: a.id,
    name: a.name,
    type: a.type || '活动',
    date: a.event_date || a.date || '',
    status: a.status || 'Planning',
    budget: Number(a.budget || 0),
    actualSpend: Number(a.actual_spend || 0),
    leadsGenerated: Number(a.leads_generated || 0),
    progress: Number(a.progress || 0),
  };
}

// Helper: map DB row to IncentiveProgram
function mapProgram(p: any): IncentiveProgram {
  return {
    id: p.id,
    title: p.title,
    trigger: p.trigger_type as any,
    status: p.status as any,
    payoutType: p.payout_type as any,
    totalBudget: Number(p.total_budget || 0),
    claimedAmount: Number(p.claimed_amount || 0),
    participantsCount: Number(p.participants_count || 0),
    description: p.description || '',
    startDate: p.start_date || '',
    endDate: p.end_date || '',
    budget: Number(p.total_budget || 0),
    used: Number(p.claimed_amount || 0),
    remaining: Number(p.total_budget || 0) - Number(p.claimed_amount || 0),
    currentMonthPerformance: {
      target: Math.round(Number(p.total_budget || 0) / 6),
      rate: Number(p.total_budget || 0) > 0 ? Math.round((Number(p.claimed_amount || 0) / Number(p.total_budget || 1)) * 100) : 0,
      growth: 12,
    },
  };
}

// Cached data
let cachedActivities: MDFMonthlyActivity[] | null = null;
let cachedPrograms: IncentiveProgram[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30000; // 30 seconds

async function refreshCache() {
  if (Date.now() - cacheTimestamp < CACHE_TTL && cachedActivities && cachedPrograms) return;

  try {
    const [actRes, progRes] = await Promise.all([
      supabase.from('marketing_activities').select('*').order('event_date', { ascending: false }),
      supabase.from('incentive_programs').select('*').order('created_at', { ascending: false }),
    ]);

    if (actRes.data) {
      cachedActivities = actRes.data.map(mapActivity);
    }
    if (progRes.data) {
      cachedPrograms = progRes.data.map(mapProgram);
    }
    cacheTimestamp = Date.now();
  } catch (e) {
    console.warn('Failed to refresh marketing cache:', e);
  }
}

export const marketingService = {
  async getMDFStats(): Promise<MDFStats> {
    await refreshCache();
    const activities = cachedActivities || [];
    const total = activities.reduce((s, a) => s + (a.budget || 0), 0);
    const used = activities.reduce((s, a) => s + (a.actualSpend || 0), 0);
    const leads = activities.reduce((s, a) => s + (a.leadsGenerated || 0), 0);
    return {
      annualQuota: total,
      quarterlyQuota: Math.round(total / 4),
      usedAmount: used,
      remainingAmount: total - used,
      conversionRate: leads > 0 ? Math.round((leads / Math.max(1, activities.length)) * 2.5) : 0,
      activityDistribution: activities.length > 0
        ? activities.reduce((acc: { type: string; percentage: number; count: number }[], a) => {
            const existing = acc.find(x => x.type === (a.type || '活动'));
            if (existing) { existing.count++; }
            else { acc.push({ type: a.type || '活动', percentage: 0, count: 1 }); }
            return acc;
          }, []).map(x => ({ ...x, percentage: Math.round((x.count / activities.length) * 100) }))
        : [],
    };
  },

  async getMDFActivities(): Promise<MDFMonthlyActivity[]> {
    await refreshCache();
    return cachedActivities || [];
  },

  async getIncentivePrograms(): Promise<IncentiveProgram[]> {
    await refreshCache();
    return cachedPrograms || [];
  },

  async getIncentiveStats(): Promise<IncentiveStats> {
    await refreshCache();
    const programs = cachedPrograms || [];
    const active = programs.filter(p => p.status === 'Active');
    const totalBudget = programs.reduce((s, p) => s + (p.totalBudget || 0), 0);
    const totalUsed = programs.reduce((s, p) => s + (p.claimedAmount || 0), 0);
    const triggerCounts: Record<string, number> = {};
    programs.forEach(p => {
      const t = p.trigger || 'Pipeline Gap';
      triggerCounts[t] = (triggerCounts[t] || 0) + 1;
    });
    const topTrigger = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Pipeline Gap';

    return {
      totalActivePrograms: active.length,
      totalPayoutYTD: totalUsed,
      avgParticipationRate: programs.length > 0
        ? Math.round(programs.reduce((s, p) => s + (p.participantsCount || 0), 0) / programs.length)
        : 0,
      topTrigger,
      totalBudget,
      totalUsed,
      totalRemaining: totalBudget - totalUsed,
      activePrograms: active.length,
    };
  },

  async getIncentiveById(id: string): Promise<IncentiveProgram | undefined> {
    await refreshCache();
    return (cachedPrograms || []).find((p) => p.id === id);
  },
};
