/**
 * 激励模块统一服务入口
 * 整合 V1 (incentive_policies + incentive_allocations + incentive_budget_alerts)
 *    与 V2 (incentive_programs + incentive_applications)
 * 提供一致的 API 给前端消费
 */

import { supabase } from '../lib/supabase';
import {
  enrichProgram,
  enrichApplication,
  enrichPrograms,
  enrichApplications,
  calculateProgramStats,
  calculateQuarterlyStats,
} from '../lib/incentiveMetrics';

// ── V2 API: Programs + Applications ──────────────────

export const incentiveService = {
  // ─── Programs ─────────────────────────────────────
  /** 获取所有计划（V2） */
  async listPrograms(filter?: { status?: string; year?: number }) {
    let query = supabase.from('incentive_programs').select('*').order('created_at', { ascending: false });
    if (filter?.status) query = query.eq('status', filter.status);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /** 获取单个计划 */
  async getProgram(id: string) {
    const { data, error } = await supabase
      .from('incentive_programs')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  /** 创建计划 */
  async createProgram(payload: {
    title: string;
    trigger_type?: string;
    payout_type?: string;
    total_budget: number;
    description?: string;
    start_date: string;
    end_date: string;
    status?: string;
  }) {
    const { data, error } = await supabase
      .from('incentive_programs')
      .insert({
        ...payload,
        claimed_amount: 0,
        participants_count: 0,
        status: payload.status || 'Upcoming',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** 更新计划 */
  async updateProgram(id: string, patch: any) {
    const { data, error } = await supabase
      .from('incentive_programs')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** 删除计划 */
  async deleteProgram(id: string) {
    const { error } = await supabase.from('incentive_programs').delete().eq('id', id);
    if (error) throw error;
  },

  // ─── Applications ─────────────────────────────────
  /** 获取所有申请 */
  async listApplications(filter?: { planId?: string; status?: string }) {
    let query = supabase.from('incentive_applications').select('*').order('submitted_at', { ascending: false });
    if (filter?.planId) query = query.eq('plan_id', filter.planId);
    if (filter?.status) query = query.eq('status', filter.status);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /** 创建申请 */
  async createApplication(payload: {
    plan_id: string;
    partner_id?: string;
    partner_name?: string;
    partner_tier?: string;
    metric?: string;
    claimed_value: number;
    related_deals?: string[];
    related_leads?: string[];
  }) {
    const { data, error } = await supabase
      .from('incentive_applications')
      .insert({
        ...payload,
        status: 'pending',
        payout_amount: 0,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** 更新申请状态 */
  async updateApplicationStatus(id: string, status: string, payoutAmount?: number) {
    const patch: any = { status };
    if (status === 'approved' || status === 'paid') patch.approved_at = new Date().toISOString();
    if (status === 'paid') patch.paid_at = new Date().toISOString();
    if (payoutAmount !== undefined) patch.payout_amount = payoutAmount;
    const { data, error } = await supabase
      .from('incentive_applications')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ─── V1 Policies ──────────────────────────────────
  /** 获取政策 */
  async listPolicies(filter?: { status?: string; type?: string }) {
    let query = supabase.from('incentive_policies').select('*').order('created_at', { ascending: false });
    if (filter?.status) query = query.eq('status', filter.status);
    if (filter?.type) query = query.eq('type', filter.type);
    const { data, error } = await query;
    if (error) {
      // 表可能还未建，静默返回空数组
      console.warn('incentive_policies 表不可用:', error.message);
      return [];
    }
    return data || [];
  },

  /** 创建政策 */
  async createPolicy(payload: {
    name: string;
    type: string;
    total_budget: number;
    description?: string;
    effective_date?: string;
    expiry_date?: string;
    applicable_products?: string[];
    applicable_tiers?: string[];
    rules?: any[];
  }) {
    const { data, error } = await supabase
      .from('incentive_policies')
      .insert({
        ...payload,
        status: 'draft',
        allocated_budget: 0,
        used_budget: 0,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** 更新政策 */
  async updatePolicy(id: string, patch: any) {
    const { data, error } = await supabase
      .from('incentive_policies')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ─── Allocations ──────────────────────────────────
  /** 获取分配记录 */
  async listAllocations(filter?: { policyId?: string; partnerId?: string }) {
    let query = supabase.from('incentive_allocations').select('*').order('allocated_at', { ascending: false });
    if (filter?.policyId) query = query.eq('policy_id', filter.policyId);
    if (filter?.partnerId) query = query.eq('partner_id', filter.partnerId);
    const { data, error } = await query;
    if (error) {
      console.warn('incentive_allocations 表不可用:', error.message);
      return [];
    }
    return data || [];
  },

  /** 创建分配 */
  async createAllocation(payload: {
    policy_id: string;
    partner_id?: string;
    partner_name?: string;
    partner_tier?: string;
    allocated_amount: number;
  }) {
    const { data, error } = await supabase
      .from('incentive_allocations')
      .insert({
        ...payload,
        used_amount: 0,
        remaining_amount: payload.allocated_amount,
        status: 'active',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ─── Budget Alerts ────────────────────────────────
  /** 获取预算告警 */
  async listBudgetAlerts(filter?: { resolved?: boolean; severity?: string }) {
    let query = supabase.from('incentive_budget_alerts').select('*').order('created_at', { ascending: false });
    if (filter?.resolved !== undefined) query = query.eq('is_resolved', filter.resolved);
    if (filter?.severity) query = query.eq('severity', filter.severity);
    const { data, error } = await query;
    if (error) {
      console.warn('incentive_budget_alerts 表不可用:', error.message);
      return [];
    }
    return data || [];
  },

  /** 创建预算告警 */
  async createBudgetAlert(payload: {
    target_type: 'policy' | 'allocation' | 'plan' | 'program';
    target_id: string;
    current_usage_pct: number;
    severity: 'info' | 'warning' | 'critical' | 'exceeded';
    message: string;
    budget_amount?: number;
    used_amount?: number;
  }) {
    const { data, error } = await supabase
      .from('incentive_budget_alerts')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** 解决告警 */
  async resolveBudgetAlert(id: string, resolvedBy?: string) {
    const { data, error } = await supabase
      .from('incentive_budget_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ─── 复合操作：计算预算告警并写入 ────────────────
  /** 自动检查并生成预算告警（80% 警告 / 100% 临界） */
  async checkBudgetAlertsAndInsert(targetType: 'policy' | 'allocation' | 'plan' | 'program', targetId: string, totalBudget: number, usedAmount: number) {
    if (totalBudget <= 0) return null;
    const usagePct = Math.round((usedAmount / totalBudget) * 100);
    if (usagePct < 80) return null;
    const severity = usagePct >= 100 ? 'exceeded' : usagePct >= 95 ? 'critical' : 'warning';
    return this.createBudgetAlert({
      target_type: targetType,
      target_id: targetId,
      current_usage_pct: usagePct,
      severity: severity as any,
      message: `预算使用率已达 ${usagePct}%,${severity === 'exceeded' ? '已超支' : severity === 'critical' ? '即将超支' : '请关注'}`,
      budget_amount: totalBudget,
      used_amount: usedAmount,
    });
  },

  // ─── 组合数据 API（带实时计算） ──────────────────
  /** 获取所有增强后的计划 + 申请 */
  async getEnrichedPrograms() {
    const [programs, applications] = await Promise.all([
      this.listPrograms(),
      this.listApplications(),
    ]);
    return enrichPrograms(programs, applications);
  },

  /** 获取汇总统计 */
  async getProgramStats() {
    const [programs, applications] = await Promise.all([
      this.listPrograms(),
      this.listApplications(),
    ]);
    const enrichedPrograms = enrichPrograms(programs, applications);
    const enrichedApps = enrichApplications(applications);
    return calculateProgramStats(enrichedPrograms, enrichedApps);
  },

  /** 同步计划聚合字段（claimed_amount, participants_count） */
  async syncProgramAggregates(programId: string) {
    const applications = await this.listApplications({ planId: programId });
    const claimed = applications.reduce((s: number, a: any) => {
      if (a.status === 'approved' || a.status === 'paid') {
        return s + (a.payout_amount || 0);
      }
      return s;
    }, 0);
    const participants = new Set(applications.map((a: any) => a.partner_id).filter(Boolean)).size;

    return this.updateProgram(programId, {
      claimed_amount: claimed,
      participants_count: participants,
    });
  },
};

export default incentiveService;
