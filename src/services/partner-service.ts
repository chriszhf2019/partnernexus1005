import { db, supabase } from '../lib/supabase';
import type { Partner } from '../types';
import type { PaginatedResponse, PartnerFilters } from './types';
import { debug } from '../lib/debug';

// ── Helpers ──────────────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (id: string) => UUID_RE.test(id);

const SNAKE_KEYS: Record<string, string> = {
  englishName: 'english_name', unifiedSocialCreditCode: 'unified_social_credit_code',
  cooperationScope: 'cooperation_scope', isCorePartner: 'is_core_partner',
  startDate: 'start_date', prevTier: 'prev_tier', winRate: 'win_rate',
  applicationDate: 'application_date', registeredAddress: 'registered_address',
  pipeline_registered: 'pipeline_registered', pipeline_solution: 'pipeline_solution',
  pipeline_commercial: 'pipeline_commercial', pipeline_won: 'pipeline_won',
  mdf_total: 'mdf_total', mdf_used: 'mdf_used',
  certified_engineers: 'certified_engineers', specialists_count: 'specialists_count',
  expiry_risk_count: 'expiry_risk_count', expiry_days: 'expiry_days',
  org_structure: 'org_structure', milestones: 'milestones',
  qbr_records: 'qbr_records', cooperation_plans: 'cooperation_plans',
  activities_log: 'activities_log', top_projects: 'top_projects',
  tier_history: 'tier_history', customer_portfolio: 'customer_portfolio',
  ecosystem_partners: 'ecosystem_partners', sub_partners: 'sub_partners',
  strategy_recommendations: 'strategy_recommendations',
};
const toSnake = (camel: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(camel)) {
    if (v === undefined) continue;
    out[SNAKE_KEYS[k] || k] = v;
  }
  return out;
};

// Generate a random start date within a reasonable range
function generateStartDate(): string {
  const now = new Date();
  const minYears = 1;
  const maxYears = 8;
  const randomDays = Math.floor(Math.random() * (maxYears - minYears) * 365) + minYears * 365;
  const date = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
  return date.toISOString().split('T')[0];
}

// Ensure contacts have proper isPrimary flag
function normalizeContacts(contacts: any[]): any[] {
  if (!contacts || contacts.length === 0) return [];
  // Find first contact with isPrimary=true, otherwise set first contact as primary
  const hasPrimary = contacts.some(c => c.isPrimary || c.is_primary);
  return contacts.map((c, i) => ({
    ...c,
    firstName: c.firstName || c.first_name || '',
    lastName: c.lastName || c.last_name || '',
    isPrimary: hasPrimary ? (c.isPrimary ?? c.is_primary ?? false) : (i === 0),
  }));
}

const normalizePartner = (p: Record<string, any>): Partner => {
  let startDate = p.startDate || p.start_date || '';
  // Normalize status to ensure consistent casing
  const status = (p.status || 'Prospective').trim();
  // Auto-generate startDate if missing for Cooperating partners
  if (!startDate && status === 'Cooperating') {
    startDate = generateStartDate();
  }
  // Auto-calculate years from startDate if not explicitly set
  let years = p.years || 0;
  if (!years && startDate) {
    const d = new Date(startDate);
    if (!isNaN(d.getTime())) years = new Date().getFullYear() - d.getFullYear();
  }
  // Auto-generate winRate: from DB, 0 if not set (no fake defaults)
  const winRate = p.winRate ?? p.win_rate ?? 0;
  
  const contacts = normalizeContacts(p.contacts);

  return {
    ...p,
    status,
    contacts,
    tags: p.tags || [],
    startDate,
    years: Math.max(0, years),
    prevTier: p.prevTier || p.prev_tier || 'Registered',
    winRate,
    unifiedSocialCreditCode: p.unifiedSocialCreditCode || p.unified_social_credit_code || '',
    cooperationScope: p.cooperationScope || p.cooperation_scope || '',
    isCorePartner: p.isCorePartner ?? p.is_core_partner ?? (p.tier === 'Diamond' || p.tier === 'Platinum'),
    englishName: p.englishName || p.english_name || '',
    website: p.website || '',
    applicationDate: p.applicationDate || p.application_date || startDate,
  } as Partner;
};

// ── Audit Logger ─────────────────────────────────────
async function logOp(partnerId: string, action: string, operator: string = 'system', details: Record<string, unknown> = {}) {
  try { await db.operationLogs().insert({ partner_id: partnerId, action, operator, details }); } catch (e) { debug.warn('[partnerService] logOp failed:', e); }
}

export const partnerService = {
  // ── List ─────────────────────────────────────────────
  list: async (filters: PartnerFilters = {}): Promise<PaginatedResponse<Partner>> => {
    try {
      let query = db.partners().select('*');
      if (filters.tier?.length) query = query.in('tier', filters.tier);
      if (filters.status?.length) query = query.in('status', filters.status);
      if (filters.type?.length) query = query.in('type', filters.type);
      if (filters.region?.length) query = query.in('region', filters.region);
      const { data } = await query;
      let partners = ((data || []) as Partner[]).map(normalizePartner);

      if (filters.search) {
        const s = filters.search.toLowerCase();
        partners = partners.filter((p) => p.name.toLowerCase().includes(s) || (p.tags || []).some((t) => t.toLowerCase().includes(s)) || (p.manager || '').toLowerCase().includes(s));
      }
      return { items: partners, total: partners.length, page: 1, pageSize: partners.length };
    } catch {
      return { items: [], total: 0, page: 1, pageSize: 0 };
    }
  },

  getById: async (id: string): Promise<Partner | null> => {
    try {
      const { data } = await db.partners().select('*').eq('id', id).single();
      if (data) return normalizePartner(data);
    } catch (e) { debug.warn('[partnerService] getById failed:', e); }
    return null;
  },

  // ── Create ───────────────────────────────────────────
  create: async (input: Record<string, unknown>): Promise<Partner> => {
    const dbFields: Record<string, unknown> = {
      id: crypto.randomUUID(),
      name: input.name,
      logo: input.logo || '',
      tier: input.tier || 'Registered',
      status: input.status || 'Prospective',
      type: input.type || 'Reseller',
      manager: input.manager || '',
      location: input.location || '',
      region: input.region || '华北',
      province: input.province || '',
      city: input.city || '',
      district: input.district || '',
      start_date: input.startDate || input.start_date || new Date().toISOString().split('T')[0],
      years: input.years || 0,
      prev_tier: input.prevTier || input.prev_tier || 'Registered',
      tags: input.tags || [],
      win_rate: input.winRate || input.win_rate || 0,
      unified_social_credit_code: input.unifiedSocialCreditCode || input.unified_social_credit_code || '',
      industry: input.industry || '',
      cooperation_scope: input.cooperationScope || input.cooperation_scope || '',
      is_core_partner: input.isCorePartner ?? input.is_core_partner ?? false,
    };
    if (input.englishName || input.english_name) dbFields.english_name = input.englishName || input.english_name;
    if (input.website) dbFields.website = input.website;
    if (input.applicationDate || input.application_date) dbFields.application_date = input.applicationDate || input.application_date;
    if (input.registeredAddress || input.registered_address) dbFields.registered_address = input.registeredAddress || input.registered_address;

    try {
      const { data, error } = await db.partners().insert(dbFields).select().single();
      if (error) throw new Error(error.message);

      const contacts: any[] = (input.contacts as any) || [];
      if (contacts.length > 0) {
        await db.contacts().insert(contacts.map((c: Record<string, any>) => ({
          partner_id: (data as any).id,
          salutation: c.salutation || '',
          first_name: c.firstName || c.first_name || '',
          last_name: c.lastName || c.last_name || '',
          title: c.title || '', department: c.department || '',
          phone: c.phone || '', mobile: c.mobile || '',
          email: c.email || '',
          is_primary: c.isPrimary ?? c.is_primary ?? false,
        })));
      }

      await logOp(String((data as any)?.id || ''), 'create', String((input as any)._operator || 'system'), { name: dbFields.name, status: dbFields.status });
      return normalizePartner(data);
    } catch (err: any) {
      throw new Error('创建合作伙伴失败: ' + (err.message || '未知错误'));
    }
  },

  // ── Update ──────────────────────────────────────────
  update: async (id: string, data: Partial<Partner> & { _operator?: string }, operator?: string): Promise<void> => {
    const dbData = toSnake(data as Record<string, unknown>);
    delete dbData._operator;
    delete dbData.contacts;
    try {
      const { error } = await db.partners().update({ ...dbData, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw new Error(error.message);
      await logOp(id, 'edit', String(data._operator || operator || 'system'), { changes: dbData });
    } catch (err: any) {
      if (!err.message?.includes('not configured')) throw err;
    }
  },

  // ── Delete ──────────────────────────────────────────
  delete: async (id: string, operator?: string): Promise<void> => {
    try {
      const { error } = await db.partners().delete().eq('id', id);
      if (error) throw new Error(error.message);
      await logOp(id, 'delete', operator || 'system', {});
    } catch (err: any) {
      if (err.message?.includes('not configured')) return;
      throw err;
    }
  },

  // ── Approve ──────────────────────────────────────────
  approve: async (id: string, data: { tier: string; status: string; manager: string; tags: string[] }, operator?: string): Promise<void> => {
    try {
      await db.partners().update({ tier: data.tier, status: data.status, manager: data.manager, tags: data.tags, start_date: new Date().toISOString().split('T')[0] }).eq('id', id);
      await logOp(id, 'approve', operator || 'system', data);
    } catch (e) { debug.warn('[partnerService] approve failed:', e); }
  },

  // ── Reject ───────────────────────────────────────────
  reject: async (id: string, operator?: string): Promise<void> => {
    try { await db.partners().update({ status: 'Prospective' }).eq('id', id); await logOp(id, 'reject', operator || 'system', {}); } catch (e) { debug.warn('[partnerService] reject failed:', e); }
  },

  // ── Batch approve ────────────────────────────────────
  batchApprove: async (ids: string[], data: { tier: string; status: string; manager: string; tags: string[] }, operator?: string): Promise<void> => {
    try {
      const dbIds = ids.filter(id => !false);
      if (dbIds.length > 0) {
        await db.partners().update({ tier: data.tier, status: data.status, manager: data.manager, tags: data.tags, start_date: new Date().toISOString().split('T')[0] }).in('id', dbIds);
        for (const id of dbIds) await logOp(id, 'approve', operator || 'system', { batch: true, ...data });
      }
    } catch (e) { debug.warn('[partnerService] batchApprove failed:', e); }
  },

  // ── Batch reject ─────────────────────────────────────
  batchReject: async (ids: string[], operator?: string): Promise<void> => {
    try {
      const dbIds = ids.filter(id => !false);
      if (dbIds.length > 0) { await db.partners().update({ status: 'Prospective' }).in('id', dbIds); for (const id of dbIds) await logOp(id, 'reject', operator || 'system', { batch: true }); }
    } catch (e) { debug.warn('[partnerService] batchReject failed:', e); }
  },

  // ── JBP Meetings ─────────────────────────────────────
  getJBPs: async (partnerId: string): Promise<any[]> => {
    try { const { data } = await supabase.from('jbp_meetings').select('*').eq('partner_id', partnerId).order('meeting_date', { ascending: false }); return (data || []) as any[]; } catch (e) { debug.warn('[partnerService] getJBPs failed:', e); return []; }
  },
  createJBP: async (partnerId: string, jbp: Record<string, unknown>): Promise<void> => {
    try { const { error } = await supabase.from('jbp_meetings').insert({ ...jbp, partner_id: partnerId }); if (error) throw new Error(error.message); } catch (e) { debug.warn('[partnerService] createJBP failed:', e); }
  },

  // ── Operation logs ───────────────────────────────────
  getOperationLogs: async (partnerId: string): Promise<any[]> => {
    try {
      const { data } = await db.operationLogs().select('*').eq('partner_id', partnerId).order('created_at', { ascending: false });
      return (data || []) as any[];
    } catch (e) { debug.warn('[partnerService] getOperationLogs failed:', e); return []; }
  },
};
