/**
 * 市场活动指标实时计算模块
 * 基于 marketing_plan 和 marketing_activities 表数据实时计算各项指标
 */

import type { CampaignStatus, CampaignPhase } from '../types';

// ── 常量配置 ──────────────────────────────────────────

/** 执行状态 → 状态颜色 */
export const EXECUTION_STATUS_COLOR: Record<string, string> = {
  draft: 'text-neutral-500',
  approved: 'text-blue-600',
  executed: 'text-emerald-600',
};

/** 执行状态 → 状态标签 */
export const EXECUTION_STATUS_LABEL: Record<string, string> = {
  draft: '草稿',
  approved: '已批复',
  executed: '已完成',
};

/** 执行状态 → 阶段 */
export const EXECUTION_TO_PHASE: Record<string, CampaignPhase> = {
  draft: 'planning',
  approved: 'executing',
  executed: 'closed',
};

/** 计划状态 → 状态颜色 */
export const PLAN_STATUS_COLOR: Record<string, string> = {
  draft: 'text-neutral-500',
  submitted: 'text-amber-600',
  approved: 'text-emerald-600',
};

/** 计划状态 → 状态标签 */
export const PLAN_STATUS_LABEL: Record<string, string> = {
  draft: '草稿',
  submitted: '待批复',
  approved: '已批复',
};

// ── 类型定义 ──────────────────────────────────────────

/** 数据库返回的市场活动计划行 */
export interface CampaignPlanRow {
  id: string;
  year: number;
  quarter: string;
  activity_type?: string;
  category?: string;
  partner_id?: string;
  partner_name?: string;
  region?: string;
  city?: string;
  expected_date?: string;
  total_budget?: number;
  approved_amount?: number;
  expected_attendees?: number;
  expected_output?: string;
  responsible_person?: string;
  goal?: string;
  execution_status?: string;
  plan_status?: string;
  budget?: number;
  target_leads?: number;
  target_opps?: number;
  actual_spend?: number;
  actual_leads?: number;
  actual_opps?: number;
  forecast_pipeline?: number;
  baseline_locked?: boolean;
  budget_utilization?: number;
  business_objective?: string;
  created_at?: string;
  updated_at?: string;
}

/** 增强后的市场活动计划 */
export interface EnrichedCampaignPlan extends CampaignPlanRow {
  // 实时计算的指标
  budgetExecutionRate: number;       // 预算执行率 (%)
  targetLeadsRate: number;           // 目标线索达成率 (%)
  targetOppsRate: number;            // 目标商机达成率 (%)
  roi: number;                        // 投资回报率 (线索产出/支出)
  costPerLead: number;               // 单线索成本
  daysToEvent: number | null;        // 距离活动天数 (null=已结束)
  isUpcoming: boolean;               // 是否即将开始 (< 30天)
  isOverdue: boolean;                // 是否已逾期 (已批复但未执行)
  campaignPhase: CampaignPhase;      // 活动阶段
  campaignStatus: CampaignStatus;   // 活动状态
  progressPercent: number;           // 整体进度 (%)
  budgetWarning: 'normal' | 'warning' | 'overrun'; // 预算预警
}

// ── 工具函数 ──────────────────────────────────────────

/** 计算两个日期之间的天数差 */
export const daysBetween = (date1: string | Date, date2: string | Date): number => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
};

/** 获取距离活动天数 */
export const getDaysToEvent = (expectedDate?: string): number | null => {
  if (!expectedDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(expectedDate);
  eventDate.setHours(0, 0, 0, 0);
  return daysBetween(eventDate, today);
};

/** 格式化预算 */
export const fmtBudget = (amount: number): string => {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  if (amount >= 1000) return `¥${(amount / 1000).toFixed(0)}千`;
  return `¥${amount.toFixed(0)}`;
};

// ── 核心计算函数 ──────────────────────────────────────

/**
 * 计算单个市场活动计划的实时指标
 */
export const enrichCampaignPlan = (plan: CampaignPlanRow): EnrichedCampaignPlan => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalBudget = Number(plan.total_budget || plan.budget || 0);
  const approvedAmount = Number(plan.approved_amount || 0);
  const actualSpend = Number(plan.actual_spend || 0);
  const targetLeads = Number(plan.target_leads || 0);
  const targetOpps = Number(plan.target_opps || 0);
  const actualLeads = Number(plan.actual_leads || 0);
  const actualOpps = Number(plan.actual_opps || 0);
  const expectedDate = plan.expected_date;

  // 预算执行率
  const budgetExecutionRate = approvedAmount > 0
    ? Math.min(Math.round((actualSpend / approvedAmount) * 100), 150)
    : 0;

  // 目标达成率
  const targetLeadsRate = targetLeads > 0
    ? Math.min(Math.round((actualLeads / targetLeads) * 100), 150)
    : 0;

  const targetOppsRate = targetOpps > 0
    ? Math.min(Math.round((actualOpps / targetOpps) * 100), 150)
    : 0;

  // 单线索成本
  const costPerLead = actualLeads > 0 ? actualSpend / actualLeads : 0;

  // ROI (简化: 线索数/万预算)
  const roi = totalBudget > 0 ? actualLeads / (totalBudget / 10000) : 0;

  // 距离活动天数
  const daysToEvent = getDaysToEvent(expectedDate);

  // 是否即将开始 (< 30天)
  const isUpcoming = daysToEvent !== null && daysToEvent >= 0 && daysToEvent <= 30;

  // 是否逾期 (已批复但未执行)
  const isOverdue = plan.execution_status === 'approved'
    && daysToEvent !== null && daysToEvent < 0;

  // 阶段映射
  const campaignPhase = EXECUTION_TO_PHASE[plan.execution_status || 'draft'] || 'planning';

  // 状态映射 (plan_status → CampaignStatus)
  const statusMap: Record<string, CampaignStatus> = {
    draft: 'draft',
    submitted: 'pending',
    approved: 'approved',
  };
  const campaignStatus = statusMap[plan.plan_status || 'draft'] || 'draft';

  // 整体进度
  const executionStatus = plan.execution_status || 'draft';
  let progressPercent = 0;
  if (executionStatus === 'draft') progressPercent = 10;
  else if (executionStatus === 'approved') progressPercent = 50;
  else if (executionStatus === 'executed') progressPercent = 100;

  // 预算预警
  let budgetWarning: 'normal' | 'warning' | 'overrun' = 'normal';
  if (budgetExecutionRate > 100) budgetWarning = 'overrun';
  else if (budgetExecutionRate > 85) budgetWarning = 'warning';

  return {
    ...plan,
    budgetExecutionRate,
    targetLeadsRate,
    targetOppsRate,
    roi,
    costPerLead,
    daysToEvent,
    isUpcoming,
    isOverdue,
    campaignPhase,
    campaignStatus,
    progressPercent,
    budgetWarning,
  };
};

/**
 * 批量增强市场活动计划
 */
export const enrichCampaignPlans = (plans: CampaignPlanRow[]): EnrichedCampaignPlan[] => {
  return plans.map(enrichCampaignPlan);
};

// ── 汇总统计计算 ──────────────────────────────────────

/** 季度汇总统计 */
export interface QuarterlyStats {
  totalBudget: number;
  approvedAmount: number;
  actualSpend: number;
  totalTargetLeads: number;
  totalActualLeads: number;
  totalTargetOpps: number;
  totalActualOpps: number;
  executionRate: number;
  leadsRate: number;
  avgCostPerLead: number;
  upcomingCount: number;
  overdueCount: number;
  executedCount: number;
  pendingCount: number;
}

/**
 * 计算季度汇总统计
 */
export const calculateQuarterlyStats = (
  plans: EnrichedCampaignPlan[]
): QuarterlyStats => {
  const totalBudget = plans.reduce((s, p) => s + (p.total_budget || 0), 0);
  const approvedAmount = plans.reduce((s, p) => s + (p.approved_amount || 0), 0);
  const actualSpend = plans.reduce((s, p) => s + (p.actual_spend || 0), 0);
  const totalTargetLeads = plans.reduce((s, p) => s + (p.target_leads || 0), 0);
  const totalActualLeads = plans.reduce((s, p) => s + (p.actual_leads || 0), 0);
  const totalTargetOpps = plans.reduce((s, p) => s + (p.target_opps || 0), 0);
  const totalActualOpps = plans.reduce((s, p) => s + (p.actual_opps || 0), 0);

  const executionRate = approvedAmount > 0
    ? Math.round((actualSpend / approvedAmount) * 100) : 0;
  const leadsRate = totalTargetLeads > 0
    ? Math.round((totalActualLeads / totalTargetLeads) * 100) : 0;
  const avgCostPerLead = totalActualLeads > 0
    ? Math.round(actualSpend / totalActualLeads) : 0;

  return {
    totalBudget,
    approvedAmount,
    actualSpend,
    totalTargetLeads,
    totalActualLeads,
    totalTargetOpps,
    totalActualOpps,
    executionRate,
    leadsRate,
    avgCostPerLead,
    upcomingCount: plans.filter(p => p.isUpcoming).length,
    overdueCount: plans.filter(p => p.isOverdue).length,
    executedCount: plans.filter(p => p.execution_status === 'executed').length,
    pendingCount: plans.filter(p => p.execution_status === 'approved').length,
  };
};

/**
 * 计算全年汇总统计
 */
export const calculateAnnualStats = (
  plans: EnrichedCampaignPlan[]
): QuarterlyStats => {
  return calculateQuarterlyStats(plans);
};

// ── 分布分析 ──────────────────────────────────────────

/**
 * 按活动类型统计
 */
export const groupByActivityType = (
  plans: EnrichedCampaignPlan[]
): Record<string, { count: number; budget: number; actualSpend: number; leads: number }> => {
  const result: Record<string, { count: number; budget: number; actualSpend: number; leads: number }> = {};
  plans.forEach(p => {
    const type = p.activity_type || 'Marketing';
    if (!result[type]) result[type] = { count: 0, budget: 0, actualSpend: 0, leads: 0 };
    result[type].count++;
    result[type].budget += p.total_budget || 0;
    result[type].actualSpend += p.actual_spend || 0;
    result[type].leads += p.actual_leads || 0;
  });
  return result;
};

/**
 * 按执行状态统计
 */
export const groupByExecutionStatus = (
  plans: EnrichedCampaignPlan[]
): Record<string, { count: number; budget: number }> => {
  const result: Record<string, { count: number; budget: number }> = {};
  plans.forEach(p => {
    const status = p.execution_status || 'draft';
    if (!result[status]) result[status] = { count: 0, budget: 0 };
    result[status].count++;
    result[status].budget += p.total_budget || 0;
  });
  return result;
};

/**
 * 按区域统计
 */
export const groupByRegion = (
  plans: EnrichedCampaignPlan[]
): Record<string, { count: number; budget: number; leads: number }> => {
  const result: Record<string, { count: number; budget: number; leads: number }> = {};
  plans.forEach(p => {
    const region = p.region || '全国';
    if (!result[region]) result[region] = { count: 0, budget: 0, leads: 0 };
    result[region].count++;
    result[region].budget += p.total_budget || 0;
    result[region].leads += p.actual_leads || 0;
  });
  return result;
};

/**
 * 按合作伙伴PMDF统计
 */
export const groupByPartner = (
  plans: EnrichedCampaignPlan[]
): Record<string, { count: number; budget: number; leads: number; name: string }> => {
  const result: Record<string, { count: number; budget: number; leads: number; name: string }> = {};
  plans.forEach(p => {
    if (!p.partner_id) return;
    if (!result[p.partner_id]) result[p.partner_id] = { count: 0, budget: 0, leads: 0, name: p.partner_name || '' };
    result[p.partner_id].count++;
    result[p.partner_id].budget += p.total_budget || 0;
    result[p.partner_id].leads += p.actual_leads || 0;
  });
  return result;
};

// ── 预警与任务 ────────────────────────────────────────

/**
 * 获取需要关注的市场活动 (逾期、预算超支、即将开始)
 */
export const getCampaignAlerts = (
  plans: EnrichedCampaignPlan[]
): EnrichedCampaignPlan[] => {
  return plans.filter(p =>
    p.isOverdue ||
    p.budgetWarning === 'overrun' ||
    p.isUpcoming
  );
};

/**
 * 获取待执行的活动 (已批复未完成)
 */
export const getPendingExecution = (
  plans: EnrichedCampaignPlan[]
): EnrichedCampaignPlan[] => {
  return plans.filter(p => p.execution_status === 'approved');
};

/**
 * 获取已完成的最佳活动 (按线索产出排序)
 */
export const getTopPerformingCampaigns = (
  plans: EnrichedCampaignPlan[],
  limit = 5
): EnrichedCampaignPlan[] => {
  return plans
    .filter(p => p.execution_status === 'executed')
    .sort((a, b) => (b.actual_leads || 0) - (a.actual_leads || 0))
    .slice(0, limit);
};
