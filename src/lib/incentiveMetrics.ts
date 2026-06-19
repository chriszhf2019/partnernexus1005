/**
 * 激励模块实时计算工具
 * 统一 V1 (incentive_quarterly_plan + executions) 与 V2 (incentive_programs + applications) 的指标计算
 */

// ── 状态映射常量 ──────────────────────────────────────

/** V2 计划状态（DB 实际值） */
export const PROGRAM_STATUSES = ['Upcoming', 'Active', 'Ended'] as const;
export type ProgramStatus = typeof PROGRAM_STATUSES[number];

/** V2 申请状态 */
export const APPLICATION_STATUSES = ['pending', 'reviewing', 'approved', 'paid', 'rejected'] as const;
export type ApplicationStatus = typeof APPLICATION_STATUSES[number];

/** V1 计划状态（恢复 5 态） */
export const PLAN_STATUSES = ['draft', 'submitted', 'approved', 'completed', 'cancelled'] as const;
export type PlanStatus = typeof PLAN_STATUSES[number];

/** V1 兑现状态 */
export const EXECUTION_STATUSES = ['pending', 'reviewing', 'approved', 'paid', 'rejected'] as const;
export type ExecutionStatus = typeof EXECUTION_STATUSES[number];

/** 政策状态 */
export const POLICY_STATUSES = ['draft', 'approved', 'archived'] as const;
export type PolicyStatus = typeof POLICY_STATUSES[number];

/** 激励类型（设计意图） */
export const INCENTIVE_TYPES = [
  'volume_rebate',     // 量价返利
  'deal_registration', // 商机报备
  'new_product',       // 新品推广
  'training_cert',     // 培训认证
  'market_development',// 市场拓展
  'sales_acceleration',// 销售加速
  'competitive',       // 竞争应对
  'training',          // 培训
] as const;
export type IncentiveType = typeof INCENTIVE_TYPES[number];

/** 类型中文标签 */
export const INCENTIVE_TYPE_LABELS: Record<string, string> = {
  volume_rebate: '量价返利',
  deal_registration: '商机报备',
  new_product: '新品推广',
  training_cert: '培训认证',
  market_development: '市场拓展',
  sales_acceleration: '销售加速',
  competitive: '竞争应对',
  training: '培训',
};

/** 状态中文标签 */
export const PROGRAM_STATUS_LABELS: Record<string, string> = {
  Upcoming: '未开始',
  Active: '进行中',
  Ended: '已结束',
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  pending: '待审核',
  reviewing: '审核中',
  approved: '已通过',
  paid: '已发放',
  rejected: '已驳回',
};

export const PLAN_STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  submitted: '已提交',
  approved: '已审批',
  completed: '已完成',
  cancelled: '已取消',
};

export const EXECUTION_STATUS_LABELS: Record<string, string> = {
  pending: '待审核',
  reviewing: '审核中',
  approved: '已通过',
  paid: '已发放',
  rejected: '已驳回',
};

// ── 类型定义 ──────────────────────────────────────────

/** V2 计划数据库行 */
export interface ProgramRow {
  id: string;
  title: string;
  trigger_type?: string;
  status?: string;
  payout_type?: string;
  total_budget?: number;
  claimed_amount?: number;
  participants_count?: number;
  description?: string;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

/** V2 申请数据库行 */
export interface ApplicationRow {
  id: string;
  plan_id: string;
  partner_id?: string;
  partner_name?: string;
  partner_tier?: string;
  metric?: string;
  claimed_value?: number;
  payout_amount?: number;
  status?: string;
  submitted_at?: string;
  approved_at?: string;
  paid_at?: string;
  related_deals?: string[];
  related_leads?: string[];
  notes?: string;
  created_at?: string;
}

/** V1 季度计划数据库行 */
export interface QuarterlyPlanRow {
  id: string;
  year: number;
  quarter: string;
  title?: string;
  description?: string;
  category?: string;
  scope?: string;
  target_partner_ids?: string[];
  target_partner_names?: string[];
  total_budget?: number;
  approved_amount?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  targets?: any[];
  direction?: any;
  pace?: any;
  submitted_at?: string;
  approved_at?: string;
  created_at?: string;
  updated_at?: string;
}

/** V1 兑现数据库行 */
export interface ExecutionRow {
  id: string;
  plan_id: string;
  partner_id?: string;
  partner_name?: string;
  partner_tier?: string;
  achieved_value?: number;
  metric?: string;
  payout_amount?: number;
  payout_status?: string;
  related_deals?: string[];
  related_leads?: string[];
  submitted_at?: string;
  approved_at?: string;
  paid_at?: string;
  notes?: string;
  created_at?: string;
}

/** V1 年度预算数据库行 */
export interface AnnualBudgetRow {
  id: string;
  year: number;
  total_budget: number;
  q1_budget?: number;
  q2_budget?: number;
  q3_budget?: number;
  q4_budget?: number;
  total_used?: number;
  total_remaining?: number;
  status?: string;
  notes?: string;
}

/** 增强后的 V2 计划 */
export interface EnrichedProgram extends ProgramRow {
  // 实时计算字段
  remainingBudget: number;
  utilizationRate: number;        // 预算使用率 (%)
  daysToStart: number | null;     // 距离开始天数
  daysToEnd: number | null;       // 距离结束天数
  durationDays: number;           // 活动天数
  isActive: boolean;              // 是否进行中
  isUpcoming: boolean;            // 是否即将开始
  isEnded: boolean;               // 是否已结束
  applicationCount: number;       // 申请数
  approvedCount: number;          // 已通过申请数
  paidCount: number;              // 已发放数
  pendingCount: number;           // 待审核数
  progress: number;               // 时间进度 (0-100)
  statusLabel: string;            // 状态中文标签
}

/** 增强后的 V2 申请 */
export interface EnrichedApplication extends ApplicationRow {
  statusLabel: string;
  payoutRate: number;            // 发放达成率 (paid / claimed)
  processingDays: number | null;  // 处理时长
  isOverdue: boolean;            // 是否超期未处理
  tierRank: number;              // 伙伴等级排序权重
}

// ── 工具函数 ──────────────────────────────────────────

/** 状态归一化（兼容旧值） */
export const normalizeProgramStatus = (status: string | null | undefined): ProgramStatus => {
  if (!status) return 'Upcoming';
  const s = status.toLowerCase();
  if (s === 'active' || s === 'ongoing' || s === 'in_progress' || s === 'in-progress') return 'Active';
  if (s === 'ended' || s === 'closed' || s === 'finished' || s === 'completed' || s === 'done') return 'Ended';
  if (s === 'upcoming' || s === 'planned' || s === 'pending' || s === 'draft') return 'Upcoming';
  return 'Active';
};

export const normalizeApplicationStatus = (status: string | null | undefined): ApplicationStatus => {
  if (!status) return 'pending';
  if (['pending', 'reviewing', 'approved', 'paid', 'rejected'].includes(status)) {
    return status as ApplicationStatus;
  }
  // 兼容旧值
  const legacyMap: Record<string, ApplicationStatus> = {
    draft: 'pending',
    submitted: 'reviewing',
    done: 'paid',
    cancelled: 'rejected',
  };
  return legacyMap[status] || 'pending';
};

export const normalizePlanStatus = (status: string | null | undefined): PlanStatus => {
  if (!status) return 'draft';
  if (['draft', 'submitted', 'approved', 'completed', 'cancelled'].includes(status)) {
    return status as PlanStatus;
  }
  // 兼容旧值 (如 'pending', 'in_progress')
  const legacyMap: Record<string, PlanStatus> = {
    pending: 'submitted',
    in_progress: 'approved',
    done: 'completed',
  };
  return legacyMap[status] || 'draft';
};

/** 计算两个日期之间的天数差 */
export const daysBetween = (date1: string | Date, date2: string | Date): number => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
};

/** 伙伴等级排序权重 */
export const getTierRank = (tier: string | null | undefined): number => {
  const map: Record<string, number> = {
    Diamond: 5, Platinum: 4, Gold: 3, Silver: 2, Bronze: 1, Authorized: 0,
  };
  return map[tier || ''] ?? -1;
};

/** 处理时长（天） */
export const calculateProcessingDays = (
  startDate: string | undefined,
  endDate: string | undefined
): number | null => {
  if (!startDate) return null;
  const end = endDate ? new Date(endDate) : new Date();
  return daysBetween(end, startDate);
};

/** 是否超期（>7 天未处理） */
export const isApplicationOverdue = (
  status: string | undefined,
  submittedAt: string | undefined
): boolean => {
  if (status === 'paid' || status === 'rejected') return false;
  if (!submittedAt) return false;
  const days = daysBetween(new Date(), submittedAt);
  return days > 7;
};

// ── 核心计算函数 ──────────────────────────────────────

/**
 * 增强单个 V2 计划
 */
export const enrichProgram = (
  program: ProgramRow,
  applications: ApplicationRow[] = []
): EnrichedProgram => {
  const totalBudget = Number(program.total_budget || 0);
  const claimedAmount = Number(program.claimed_amount || 0);
  const remainingBudget = totalBudget - claimedAmount;
  const utilizationRate = totalBudget > 0
    ? Math.min(Math.round((claimedAmount / totalBudget) * 100), 100)
    : 0;

  // 该计划的申请
  const programApps = applications.filter(a => a.plan_id === program.id);
  const applicationCount = programApps.length;
  const approvedCount = programApps.filter(a => a.status === 'approved' || a.status === 'paid').length;
  const paidCount = programApps.filter(a => a.status === 'paid').length;
  const pendingCount = programApps.filter(a => a.status === 'pending' || a.status === 'reviewing').length;

  // 时间相关
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = program.start_date;
  const endDate = program.end_date;

  const startTime = startDate ? new Date(startDate).getTime() : 0;
  const endTime = endDate ? new Date(endDate).getTime() : 0;
  const nowTime = today.getTime();

  const daysToStart = startTime > 0 ? daysBetween(new Date(startTime), today) : null;
  const daysToEnd = endTime > 0 ? daysBetween(new Date(endTime), today) : null;
  const durationDays = startTime > 0 && endTime > 0
    ? Math.max(daysBetween(new Date(endTime), new Date(startTime)), 1) : 0;

  // 活动进度（基于时间）
  let progress = 0;
  if (durationDays > 0) {
    const elapsed = Math.max(0, daysBetween(today, new Date(startTime)));
    progress = Math.min(100, Math.round((elapsed / durationDays) * 100));
  } else if (claimedAmount > 0) {
    // 没有时间时使用预算使用率作为进度
    progress = utilizationRate;
  }

  // 状态判断（实时纠正 DB 状态）
  const isActive = startTime > 0 && endTime > 0 && nowTime >= startTime && nowTime <= endTime;
  const isUpcoming = startTime > 0 && nowTime < startTime;
  const isEnded = endTime > 0 && nowTime > endTime;
  const status = normalizeProgramStatus(program.status);

  return {
    ...program,
    remainingBudget,
    utilizationRate,
    daysToStart,
    daysToEnd,
    durationDays,
    isActive,
    isUpcoming,
    isEnded,
    applicationCount,
    approvedCount,
    paidCount,
    pendingCount,
    progress,
    statusLabel: PROGRAM_STATUS_LABELS[status] || status,
  };
};

/**
 * 批量增强 V2 计划
 */
export const enrichPrograms = (
  programs: ProgramRow[],
  applications: ApplicationRow[] = []
): EnrichedProgram[] => {
  return programs.map(p => enrichProgram(p, applications));
};

/**
 * 增强单个 V2 申请
 */
export const enrichApplication = (app: ApplicationRow): EnrichedApplication => {
  const status = normalizeApplicationStatus(app.status);
  const claimedValue = Number(app.claimed_value || 0);
  const payoutAmount = Number(app.payout_amount || 0);
  const payoutRate = claimedValue > 0 ? Math.min(Math.round((payoutAmount / claimedValue) * 100), 100) : 0;
  const processingDays = calculateProcessingDays(app.submitted_at, app.approved_at || app.paid_at);
  const isOverdue = isApplicationOverdue(status, app.submitted_at);
  const tierRank = getTierRank(app.partner_tier);

  return {
    ...app,
    statusLabel: APPLICATION_STATUS_LABELS[status] || status,
    payoutRate,
    processingDays,
    isOverdue,
    tierRank,
  };
};

/**
 * 批量增强 V2 申请
 */
export const enrichApplications = (applications: ApplicationRow[]): EnrichedApplication[] => {
  return applications.map(enrichApplication);
};

// ── 汇总统计 ──────────────────────────────────────────

/** V2 计划汇总统计 */
export interface ProgramStats {
  totalBudget: number;
  totalClaimed: number;
  totalRemaining: number;
  utilizationRate: number;
  activeCount: number;
  upcomingCount: number;
  endedCount: number;
  totalApplications: number;
  totalApproved: number;
  totalPaid: number;
  totalPending: number;
  approvalRate: number;
  payoutRate: number;
  avgApplicationAmount: number;
}

/**
 * 计算 V2 计划汇总统计
 */
export const calculateProgramStats = (
  programs: EnrichedProgram[],
  applications: EnrichedApplication[] = []
): ProgramStats => {
  const totalBudget = programs.reduce((s, p) => s + (p.total_budget || 0), 0);
  const totalClaimed = programs.reduce((s, p) => s + (p.claimed_amount || 0), 0);
  const totalRemaining = totalBudget - totalClaimed;
  const utilizationRate = totalBudget > 0 ? Math.round((totalClaimed / totalBudget) * 100) : 0;

  const totalApplications = applications.length;
  const totalApproved = applications.filter(a => a.status === 'approved' || a.status === 'paid').length;
  const totalPaid = applications.filter(a => a.status === 'paid').length;
  const totalPending = applications.filter(a => a.status === 'pending' || a.status === 'reviewing').length;
  const approvalRate = totalApplications > 0 ? Math.round((totalApproved / totalApplications) * 100) : 0;
  const payoutRate = totalApproved > 0 ? Math.round((totalPaid / totalApproved) * 100) : 0;
  const avgApplicationAmount = totalApplications > 0
    ? Math.round(applications.reduce((s, a) => s + (a.claimed_value || 0), 0) / totalApplications) : 0;

  return {
    totalBudget,
    totalClaimed,
    totalRemaining,
    utilizationRate,
    activeCount: programs.filter(p => p.isActive).length,
    upcomingCount: programs.filter(p => p.isUpcoming).length,
    endedCount: programs.filter(p => p.isEnded).length,
    totalApplications,
    totalApproved,
    totalPaid,
    totalPending,
    approvalRate,
    payoutRate,
    avgApplicationAmount,
  };
};

/** V1 季度计划汇总统计 */
export interface QuarterlyStats {
  totalBudget: number;
  totalApproved: number;
  totalUsed: number;
  totalRemaining: number;
  planCount: number;
  draftCount: number;
  submittedCount: number;
  approvedCount: number;
  completedCount: number;
  cancelledCount: number;
  achievementRate: number;       // 达成率
  participationRate: number;     // 参与率
  totalPayout: number;
  totalRevenue: number;
  roi: number;
  pipelineValue: number;
}

/**
 * 计算 V1 季度汇总统计
 */
export const calculateQuarterlyStats = (
  plans: QuarterlyPlanRow[],
  executions: ExecutionRow[] = []
): QuarterlyStats => {
  const totalBudget = plans.reduce((s, p) => s + (p.total_budget || 0), 0);
  const totalApproved = plans.reduce((s, p) => s + (p.approved_amount || 0), 0);
  const totalUsed = executions.reduce((s, e) => s + (e.payout_amount || 0), 0);
  const totalRemaining = totalApproved - totalUsed;

  const planCount = plans.length;
  const draftCount = plans.filter(p => normalizePlanStatus(p.status) === 'draft').length;
  const submittedCount = plans.filter(p => normalizePlanStatus(p.status) === 'submitted').length;
  const approvedCount = plans.filter(p => normalizePlanStatus(p.status) === 'approved').length;
  const completedCount = plans.filter(p => normalizePlanStatus(p.status) === 'completed').length;
  const cancelledCount = plans.filter(p => normalizePlanStatus(p.status) === 'cancelled').length;

  // 参与率：有过 execution 的 partner 数 / 计划的 target_partner_ids 数
  const targetPartnerIds = new Set<string>();
  plans.forEach(p => p.target_partner_ids?.forEach(id => targetPartnerIds.add(id)));
  const activePartnerIds = new Set<string>();
  executions.forEach(e => e.partner_id && activePartnerIds.add(e.partner_id));
  const participationRate = targetPartnerIds.size > 0
    ? Math.min(100, Math.round((activePartnerIds.size / targetPartnerIds.size) * 100)) : 0;

  // 达成率：实际 payout / 计划 budget
  const achievementRate = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0;

  // ROI 计算
  const totalPayout = totalUsed;
  const totalRevenue = executions.reduce((s, e) => s + ((e as any).revenue || 0), 0);
  const roi = totalPayout > 0 ? Number((totalRevenue / totalPayout).toFixed(2)) : 0;
  const pipelineValue = executions.reduce((s, e) => s + ((e as any).pipeline_value || 0), 0);

  return {
    totalBudget,
    totalApproved,
    totalUsed,
    totalRemaining,
    planCount,
    draftCount,
    submittedCount,
    approvedCount,
    completedCount,
    cancelledCount,
    achievementRate,
    participationRate,
    totalPayout,
    totalRevenue,
    roi,
    pipelineValue,
  };
};

// ── 预警与任务 ────────────────────────────────────────

/**
 * 获取需要关注的计划（即将开始/进行中/已结束）
 */
export const getActivePrograms = (programs: EnrichedProgram[]): EnrichedProgram[] => {
  return programs.filter(p => p.isActive || p.isUpcoming);
};

/**
 * 获取超期未处理的申请
 */
export const getOverdueApplications = (applications: EnrichedApplication[]): EnrichedApplication[] => {
  return applications.filter(a => a.isOverdue);
};

/**
 * 获取即将开始的计划（30 天内）
 */
export const getUpcomingPrograms = (programs: EnrichedProgram[], withinDays = 30): EnrichedProgram[] => {
  return programs.filter(p =>
    p.isUpcoming && p.daysToStart !== null && p.daysToStart <= withinDays
  );
};

/**
 * 按激励类型分组统计
 */
export const groupByTriggerType = (programs: EnrichedProgram[]): Record<string, { count: number; budget: number; claimed: number }> => {
  const result: Record<string, { count: number; budget: number; claimed: number }> = {};
  programs.forEach(p => {
    const t = p.trigger_type || 'Other';
    if (!result[t]) result[t] = { count: 0, budget: 0, claimed: 0 };
    result[t].count++;
    result[t].budget += p.total_budget || 0;
    result[t].claimed += p.claimed_amount || 0;
  });
  return result;
};

/**
 * 按伙伴等级统计申请
 */
export const groupByPartnerTier = (applications: EnrichedApplication[]): Record<string, { count: number; amount: number; payout: number }> => {
  const result: Record<string, { count: number; amount: number; payout: number }> = {};
  applications.forEach(a => {
    const t = a.partner_tier || 'Unspecified';
    if (!result[t]) result[t] = { count: 0, amount: 0, payout: 0 };
    result[t].count++;
    result[t].amount += a.claimed_value || 0;
    result[t].payout += a.payout_amount || 0;
  });
  return result;
};

/**
 * 获取表现最佳的伙伴（按已发放金额）
 */
export const getTopPartners = (
  applications: EnrichedApplication[],
  limit = 5
): EnrichedApplication[] => {
  return [...applications]
    .filter(a => a.partner_id)
    .sort((a, b) => (b.payout_amount || 0) - (a.payout_amount || 0))
    .slice(0, limit);
};

// ── 预算计算 ──────────────────────────────────────────

/**
 * 计算季度预算使用率
 */
export const calculateQuarterBudgetUsage = (
  budget: AnnualBudgetRow,
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'
): { quarterBudget: number; used: number; remaining: number; rate: number } => {
  const quarterBudget = Number(budget[`${quarter.toLowerCase()}_budget` as keyof AnnualBudgetRow] || 0);
  // 这里简化处理：假设 total_used 是按时间比例分摊的
  const totalBudget = Number(budget.total_budget || 0);
  const totalUsed = Number(budget.total_used || 0);
  const used = totalBudget > 0 ? Math.round((quarterBudget / totalBudget) * totalUsed) : 0;
  const remaining = quarterBudget - used;
  const rate = quarterBudget > 0 ? Math.round((used / quarterBudget) * 100) : 0;
  return { quarterBudget, used, remaining, rate };
};
