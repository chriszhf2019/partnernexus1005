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
  orgStructure: 'org_structure', milestones: 'milestones',
  qbrRecords: 'qbr_records', cooperationPlans: 'cooperation_plans',
  activitiesLog: 'activities_log', topProjects: 'top_projects',
  tierHistory: 'tier_history', customerPortfolio: 'customer_portfolio',
  vendorQualifications: 'vendor_qualifications',
  ecosystemPartners: 'ecosystem_partners', subPartners: 'sub_partners',
  strategyRecommendations: 'strategy_recommendations',
  industries: 'industries',
};
const toSnake = (camel: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(camel)) {
    if (v === undefined) continue;
    out[SNAKE_KEYS[k] || k] = v;
  }
  return out;
};

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
  const status = (p.status || 'Prospective').trim();
  let years = p.years || 0;
  if (!years && startDate) {
    const d = new Date(startDate);
    if (!isNaN(d.getTime())) years = new Date().getFullYear() - d.getFullYear();
  }
  const winRate = p.winRate ?? p.win_rate ?? 0;
  const contacts = normalizeContacts(p.contacts);

  // ── industries 双向兼容：数组优先，从字符串解析降级 ──
  let industries: string[] = p.industries && Array.isArray(p.industries) && p.industries.length > 0
    ? p.industries
    : (typeof p.industry === 'string' && p.industry
      ? p.industry.split(/[、,\/]/).map(s => s.trim()).filter(Boolean)
      : []);

  // industry 字符串始终与 industries 保持一致（老代码兼容）
  const industry = industries.length > 0 ? industries.join('、') : (p.industry || '');

  // ── vendorQualifications 双向兼容 ──
  let vendorQualifications: Record<string, string> = {};
  if (p.vendorQualifications && typeof p.vendorQualifications === 'object' && !Array.isArray(p.vendorQualifications)) {
    vendorQualifications = p.vendorQualifications;
  } else if (p.vendor_qualifications && typeof p.vendor_qualifications === 'object' && !Array.isArray(p.vendor_qualifications)) {
    vendorQualifications = p.vendor_qualifications;
  }
  // 从 tags 中推断厂商名（降级兼容：旧数据只有厂商名标签，没有资质等级）
  const knownVendors = ['华为', '浪潮', '联想', 'Oracle', 'AWS', '阿里云', 'Microsoft', 'IBM', 'SAP', '新华三', '其他'];
  if (Object.keys(vendorQualifications).length === 0 && Array.isArray(p.tags)) {
    p.tags.forEach((tag: string) => {
      if (knownVendors.includes(tag)) {
        vendorQualifications[tag] = '合作中';
      }
    });
  }

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
    applicationDate: p.applicationDate || p.application_date || (startDate || ''),
    industry,
    industries,
    vendorQualifications,
    customerPortfolio: p.customerPortfolio || p.customer_portfolio || [],
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
    const today = new Date().toISOString().split('T')[0];
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
      start_date: input.startDate || input.start_date || null,
      years: input.years || 0,
      prev_tier: input.prevTier || input.prev_tier || 'Registered',
      tags: input.tags || [],
      win_rate: input.winRate || input.win_rate || 0,
      unified_social_credit_code: input.unifiedSocialCreditCode || input.unified_social_credit_code || '',
      industry: input.industry || '',
      industries: input.industries || input.industry ? [input.industry as string].filter(Boolean) : [],
      cooperation_scope: input.cooperationScope || input.cooperation_scope || '',
      is_core_partner: input.isCorePartner ?? input.is_core_partner ?? false,
      application_date: input.applicationDate || input.application_date || today,
      registered_address: input.registeredAddress || input.registered_address || input.location || '',
    };
    if (input.englishName || input.english_name) dbFields.english_name = input.englishName || input.english_name;
    if (input.website) dbFields.website = input.website;

    // JSONB fields
    if (input.vendorQualifications || input.vendor_qualifications) {
      dbFields.vendor_qualifications = input.vendorQualifications || input.vendor_qualifications;
    }
    if (input.customerPortfolio || input.customer_portfolio) {
      dbFields.customer_portfolio = input.customerPortfolio || input.customer_portfolio;
    }

    try {
      const { data, error } = await db.partners().insert(dbFields).select().single();
      if (error) throw new Error(error.message);

      const partnerId = (data as any).id;

      const contacts: any[] = (input.contacts as any) || [];
      if (contacts.length > 0) {
        await db.contacts().insert(contacts.map((c: Record<string, any>) => ({
          partner_id: partnerId,
          salutation: c.salutation || '',
          first_name: c.firstName || c.first_name || '',
          last_name: c.lastName || c.last_name || '',
          title: c.title || '', department: c.department || '',
          phone: c.phone || '', mobile: c.mobile || '',
          email: c.email || '',
          is_primary: c.isPrimary ?? c.is_primary ?? false,
        })));
      }

      // Save opportunities as Deal records (Fix #1: 商机不丢失)
      const opportunities: any[] = (input.opportunities as any) || [];
      if (opportunities.length > 0) {
        const nowDate = new Date().toISOString().split('T')[0];
        const expDate = new Date();
        expDate.setMonth(expDate.getMonth() + 6);
        await db.deals().insert(
          opportunities
            .filter((o: any) => o.name || o.customer)
            .map((o: any, idx: number) => ({
              id: crypto.randomUUID(),
              title: o.name || o.title || '商机',
              customer_name: o.customer || '待补充',
              customer_industry: o.industry || '',
              value: typeof o.amount === 'number'
                ? o.amount
                : parseFloat(String(o.amount).replace(/[^0-9.]/g, '')) || 0,
              partner_id: partnerId,
              partner_name: dbFields.name,
              partner_type: dbFields.type,
              stage: 'Registered',
              status: 'Pending',
              region: dbFields.region,
              province: dbFields.province || '',
              city: dbFields.city || '',
              product_type: '待补充',
              created_date: nowDate,
              last_activity_date: nowDate,
              expected_close_date: expDate.toISOString().split('T')[0],
              source: 'PartnerCreation',
              description: '新建伙伴时登记商机',
              conversion_probability: 30,
              health_score: 50,
              data_source: 'real',
            }))
        );
      }

      await logOp(String(partnerId || ''), 'create', String((input as any)._operator || 'system'), {
        name: dbFields.name,
        status: dbFields.status,
        deals_count: opportunities.length,
        contacts_count: contacts.length,
      });
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
      const dbIds = ids.filter(Boolean);
      if (dbIds.length > 0) {
        await db.partners().update({ tier: data.tier, status: data.status, manager: data.manager, tags: data.tags, start_date: new Date().toISOString().split('T')[0] }).in('id', dbIds);
        for (const id of dbIds) await logOp(id, 'approve', operator || 'system', { batch: true, ...data });
      }
    } catch (e) { debug.warn('[partnerService] batchApprove failed:', e); }
  },

  // ── Batch reject ─────────────────────────────────────
  batchReject: async (ids: string[], operator?: string): Promise<void> => {
    try {
      const dbIds = ids.filter(Boolean);
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

  // ── Partner-related data ─────────────────────────────
  /**
   * Get contacts for a partner
   */
  getContacts: async (partnerId: string): Promise<any[]> => {
    try {
      const { data } = await db.contacts().select('*').eq('partner_id', partnerId);
      if (!data) return [];
      return data.map((c: any) => ({
        salutation: c.salutation || '',
        firstName: c.first_name || c.firstName || '',
        lastName: c.last_name || c.lastName || '',
        title: c.title || '',
        department: c.department || '',
        phone: c.phone || '',
        mobile: c.mobile || '',
        email: c.email || '',
        isPrimary: c.is_primary ?? c.isPrimary ?? false,
      }));
    } catch (e) { debug.warn('[partnerService] getContacts failed:', e); return []; }
  },

  /**
   * Get deals for a partner (normalized to camelCase)
   */
  getDeals: async (partnerId: string): Promise<any[]> => {
    try {
      const { data } = await supabase
        .from('deals')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_date', { ascending: false });
      return data || [];
    } catch (e) { debug.warn('[partnerService] getDeals failed:', e); return []; }
  },

  /**
   * Get marketing plans (PMDF) for a partner
   */
  getMarketingPlans: async (partnerId: string): Promise<any[]> => {
    try {
      const { data } = await supabase
        .from('marketing_plan')
        .select('*')
        .eq('partner_id', partnerId)
        .eq('activity_type', 'PMDF');
      return data || [];
    } catch (e) { debug.warn('[partnerService] getMarketingPlans failed:', e); return []; }
  },

  /**
   * Get all related data for a partner in one call
   */
  getPartnerRelatedData: async (partnerId: string): Promise<{
    contacts: any[];
    deals: any[];
    marketingPlans: any[];
  }> => {
    const [contacts, deals, marketingPlans] = await Promise.all([
      partnerService.getContacts(partnerId),
      partnerService.getDeals(partnerId),
      partnerService.getMarketingPlans(partnerId),
    ]);
    return { contacts, deals, marketingPlans };
  },
};
