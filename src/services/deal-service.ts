import { db } from '../lib/supabase';
import type { Deal, DealLifecycleEvent, DealLifecycleStage, DealRegistrationStats } from '../types';

import type { PaginatedResponse, DealFilters } from './types';
import { debug } from '../lib/debug';

// ── DB ↔ TS normalization ────────────────────────────
// The Supabase deals table has a legacy schema. This normalizes old columns
// to the new TypeScript Deal type and vice versa.

function normalizeDeal(row: any): Deal {
  return {
    id: row.id,
    title: row.title || '',
    customerId: row.customer_id || row.customerId || '',
    customerName: row.customer_name || row.customer || '',
    customerIndustry: row.customer_industry || row.customerIndustry || '',
    value: Number(row.value || 0),
    partnerId: row.partner_id || row.partnerId || '',
    partnerName: row.partner_name || row.partnerName || '',
    partnerType: row.partner_type || row.partnerType || 'Reseller',
    stage: (row.stage || 'Registered') as DealLifecycleStage,
    status: row.status || 'Pending',
    region: row.region || '',
    province: row.province || '',
    city: row.city || '',
    salesName: row.sales_name || row.salesName || '',
    salesTeam: row.sales_team || row.salesTeam || '',
    productType: row.product_type || row.productType || '',
    createdDate: row.created_date || row.createdDate || '',
    lastActivityDate: row.last_activity_date || row.lastActivityDate || row.updated_at || row.created_date || '',
    expectedCloseDate: row.expected_close_date || row.expectedCloseDate || row.end_date || '',
    actualCloseDate: row.actual_close_date || row.actualCloseDate || undefined,
    isPriority: row.is_priority ?? row.isPriority ?? false,
    hasConflict: row.has_conflict ?? row.hasConflict ?? false,
    conflictId: row.conflict_id || row.conflictId || undefined,
    lifecycle: Array.isArray(row.lifecycle) ? row.lifecycle as DealLifecycleEvent[] : [],
    description: row.description || '',
    notes: row.notes || undefined,
    nextAction: row.next_action || row.nextAction || undefined,
    nextActionDate: row.next_action_date || row.nextActionDate || undefined,
    customerContact: row.customer_contact || row.customerContact || '',
    customerPhone: row.customer_phone || row.customerPhone || '',
    weightedValue: Number(row.weighted_value || row.weightedValue || 0),
    daysInCurrentStage: Number(row.days_in_current_stage || row.daysInCurrentStage || 0),
    isStagnant: row.is_stagnant ?? row.isStagnant ?? false,
    expiresInDays: Number(row.expires_in_days || row.expiresInDays || 0),
    activities: Array.isArray(row.activities) ? row.activities : [],
    originActivityId: row.origin_activity_id || undefined,
    originActivityName: row.origin_activity_name || undefined,
    originInvitationCode: row.origin_invitation_code || undefined,
    healthScore: Number(row.health_score) || 50,
    leadResponseTime: Number(row.lead_response_time) || undefined,
    isNewLogo: row.is_new_logo ?? false,
    protectionRemainingDays: Number(row.protection_remaining_days) || undefined,
    winLossAnalysis: row.win_loss_reason ? {
      reason: row.win_loss_reason,
      description: row.win_loss_description || undefined,
      competitor: row.win_loss_competitor || undefined,
      keyFactors: Array.isArray(row.win_loss_key_factors) ? row.win_loss_key_factors : undefined,
    } : undefined,
  };
}

function toSnakeDeal(deal: Partial<Deal>): Record<string, any> {
  const out: Record<string, any> = {};
  const map: Record<string, string> = {
    customerName: 'customer',
    partnerId: 'partner_id',
    partnerName: 'partner_name',
    partnerType: 'partner_type',
    salesName: 'sales_name',
    salesTeam: 'sales_team',
    productType: 'product_type',
    createdDate: 'created_date',
    lastActivityDate: 'last_activity_date',
    expectedCloseDate: 'end_date',
    actualCloseDate: 'actual_close_date',
    customerIndustry: 'customer_industry',
    isPriority: 'is_priority',
    hasConflict: 'has_conflict',
    conflictId: 'conflict_id',
    customerContact: 'customer_contact',
    customerPhone: 'customer_phone',
    weightedValue: 'weighted_value',
    daysInCurrentStage: 'days_in_current_stage',
    isStagnant: 'is_stagnant',
    expiresInDays: 'expires_in_days',
    nextAction: 'next_action',
    nextActionDate: 'next_action_date',
    originActivityId: 'origin_activity_id',
    originActivityName: 'origin_activity_name',
    originInvitationCode: 'origin_invitation_code',
    healthScore: 'health_score',
    leadResponseTime: 'lead_response_time',
    isNewLogo: 'is_new_logo',
    protectionRemainingDays: 'protection_remaining_days',
  };
  // Complex objects stored as JSONB
  const skipFields = new Set(['lifecycle', 'sourceInfo', 'conversionMetrics', 'activities', 'winLossAnalysis']);
  for (const [k, v] of Object.entries(deal)) {
    if (v === undefined || skipFields.has(k)) continue;
    out[map[k] || k] = v;
  }
  return out;
}

// ── Service ──────────────────────────────────────────
export const dealService = {
  list: async (filters: DealFilters = {}): Promise<PaginatedResponse<Deal>> => {
    try {
      let query = db.deals().select('*');
      if (filters.status?.length) query = query.in('status', filters.status);
      if (filters.region?.length) query = query.in('region', filters.region);
      if (filters.partnerId) query = query.eq('partner_id', filters.partnerId);
      const { data } = await query.order('created_date', { ascending: false });
      let deals = ((data || []) as any[]).map(normalizeDeal);
      if (filters.search) {
        const s = filters.search.toLowerCase();
        deals = deals.filter((d) => d.title.toLowerCase().includes(s) || d.customerName.toLowerCase().includes(s));
      }
      return { items: deals, total: deals.length, page: 1, pageSize: deals.length };
    } catch (e) {
      debug.warn('[dealService] list failed:', e);
      return { items: [], total: 0, page: 1, pageSize: 0 };
    }
  },

  getById: async (id: string): Promise<Deal | null> => {
    try {
      const { data } = await db.deals().select('*').eq('id', id).single();
      if (data) return normalizeDeal(data);
      return null;
    } catch (e) {
      debug.warn('[dealService] getById failed:', e);
      return null;
    }
  },

  create: async (deal: Omit<Deal, 'id'>): Promise<Deal> => {
    // Build insert object directly with only DB columns
    const insertData: Record<string, any> = {
      title: deal.title || '',
      customer: deal.customerName || '',
      value: Number(deal.value || 0),
      stage: deal.stage || 'Registered',
      partner_id: deal.partnerId || null,
      partner_name: deal.partnerName || '',
      partner_type: deal.partnerType || 'Reseller',
      status: deal.status || 'Pending',
      region: deal.region || '',
      province: deal.province || '',
      city: deal.city || '',
      sales_name: deal.salesName || '',
      sales_team: deal.salesTeam || (deal.partnerId ? '渠道报备' : '销售自建'),
      product_type: deal.productType || '',
      customer_industry: deal.customerIndustry || '',
      customer_contact: deal.customerContact || '',
      customer_phone: deal.customerPhone || '',
      created_date: deal.createdDate || new Date().toISOString().split('T')[0],
      end_date: deal.expectedCloseDate || '',
      actual_close_date: deal.actualCloseDate || null,
      is_priority: deal.isPriority ?? false,
      has_conflict: deal.hasConflict ?? false,
      conflict_id: deal.conflictId || null,
      description: deal.description || '',
      notes: deal.notes || null,
      next_action: deal.nextAction || null,
      next_action_date: deal.nextActionDate || null,
      weighted_value: deal.weightedValue || 0,
      days_in_current_stage: deal.daysInCurrentStage || 0,
      is_stagnant: deal.isStagnant || false,
      expires_in_days: deal.expiresInDays || null,
      last_activity_date: deal.lastActivityDate || null,
      health_score: deal.healthScore || 50,
      lead_response_time: deal.leadResponseTime || null,
      is_new_logo: deal.isNewLogo ?? false,
      protection_remaining_days: deal.protectionRemainingDays || null,
      origin_activity_id: deal.originActivityId || null,
      origin_activity_name: deal.originActivityName || null,
      origin_invitation_code: deal.originInvitationCode || null,
    };
    const { data, error } = await db.deals().insert(insertData).select().single();
    if (error) throw new Error(error.message);
    return normalizeDeal(data);
  },

  update: async (id: string, dealData: Partial<Deal>): Promise<void> => {
    const snake = toSnakeDeal(dealData);
    if (dealData.customerName && !snake.customer) snake.customer = dealData.customerName;
    const { error } = await db.deals().update(snake).eq('id', id);
    if (error) throw new Error(error.message);
  },

  getStats: async (): Promise<DealRegistrationStats> => {
    try {
      const { data } = await db.deals().select('*');
      const deals = ((data || []) as any[]).map(normalizeDeal);
      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const weekStart = new Date(now.getTime() - now.getDay() * 86400000);

      const wonDeals = deals.filter(d => d.status === 'Converted' || d.status === 'Closed Won' || d.status === 'Approved');
      const stageDist = {} as Record<DealLifecycleStage, number>;
      const sourceDist = {} as Record<string, number>;
      deals.forEach(d => {
        stageDist[d.stage] = (stageDist[d.stage] || 0) + 1;
        const src = d.sourceInfo?.source || 'PartnerInitiated';
        sourceDist[src] = (sourceDist[src] || 0) + 1;
      });

      return {
        yearNew: deals.filter(d => d.createdDate && new Date(d.createdDate) >= yearStart).length,
        quarterNew: deals.filter(d => d.createdDate && new Date(d.createdDate) >= quarterStart).length,
        monthNew: deals.filter(d => d.createdDate && new Date(d.createdDate) >= monthStart).length,
        weekNew: deals.filter(d => d.createdDate && new Date(d.createdDate) >= weekStart).length,
        rejected: deals.filter(d => d.status === 'Rejected').length,
        closed: wonDeals.length,
        totalPipelineValue: deals.reduce((s, d) => s + Number(d.value || 0), 0),
        avgCycleDays: deals.filter(d => d.conversionMetrics?.totalCycleDays).length > 0
          ? Math.round(deals.reduce((s, d) => s + (d.conversionMetrics?.totalCycleDays || 0), 0) / deals.filter(d => d.conversionMetrics?.totalCycleDays).length)
          : 0,
        conversionRate: deals.length > 0
          ? Math.round((wonDeals.length / deals.length) * 100)
          : 0,
        stageDistribution: stageDist as Record<DealLifecycleStage, number>,
        sourceDistribution: sourceDist as Record<any, number>,
        conflictCount: deals.filter(d => d.hasConflict).length,
        overdueCount: deals.filter(d => d.expectedCloseDate && new Date(d.expectedCloseDate) < now && d.status !== 'Closed Won' && d.status !== 'Closed Lost' && d.status !== 'Converted').length,
      };
    } catch {
      return {
        yearNew: 0, quarterNew: 0, monthNew: 0, weekNew: 0,
        rejected: 0, closed: 0, totalPipelineValue: 0, avgCycleDays: 0,
        conversionRate: 0,
        stageDistribution: {} as Record<DealLifecycleStage, number>,
        sourceDistribution: {} as Record<string, number>,
        conflictCount: 0, overdueCount: 0,
      };
    }
  },
};
