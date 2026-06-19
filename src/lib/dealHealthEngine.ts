// ══════════════════════════════════════════════════════════════════════════
// Deal Health Engine — 商机健康度评分 + 漏斗瓶颈诊断
// 核心：销售速率 (Sales Velocity) + 阶段转化率 + 停滞惩罚
// ══════════════════════════════════════════════════════════════════════════

import type { Deal, DealLifecycleStage } from '../types';
import { supabase } from './supabase';

// ── 类型定义 ──────────────────────────────────────────

export type DealHealthStatus = 'HEALTHY' | 'AT_RISK' | 'STUCK' | 'LOST';

export interface DealHealthScore {
  dealId: string;
  score: number;               // 0-100 综合健康分
  status: DealHealthStatus;
  stage: DealLifecycleStage;
  stayDays: number;            // 当前阶段已停留天数
  avgStageDays: number;        // 行业基准天数
  isStagnant: boolean;         // 是否停滞
  isConflict: boolean;         // 是否冲突
  velocity: number;            // 销售速率（每日推进）
  riskFactors: string[];       // 风险因素
}

export interface StageFunnelDiagnosis {
  stage: DealLifecycleStage;
  entryCount: number;          // 进入该阶段的商机数
  exitCount: number;           // 退出到下一阶段的商机数
  conversionRate: number;      // 转化率 %
  avgStayDays: number;         // 平均停留天数
  benchmarkDays: number;       // 行业基准天数
  isBottleneck: boolean;       // 是否瓶颈环节
  alert: string | null;        // 诊断预警
}

// ── 阶段配置 ──────────────────────────────────────────
const STAGE_CONFIG: Record<DealLifecycleStage, { probability: number; benchmarkDays: number; label: string }> = {
  'Registered':    { probability: 10, benchmarkDays: 3,  label: '已报备' },
  'UnderReview':   { probability: 20, benchmarkDays: 5,  label: '审批中' },
  'Approved':      { probability: 35, benchmarkDays: 7,  label: '已批复' },
  'Migrated':      { probability: 40, benchmarkDays: 5,  label: '迁单' },
  'Solution':      { probability: 50, benchmarkDays: 14, label: '方案跟进' },
  'Commercial':    { probability: 80, benchmarkDays: 21, label: '商务洽谈' },
  'Negotiation':   { probability: 90, benchmarkDays: 15, label: '合同谈判' },
  'ClosedWon':     { probability: 100, benchmarkDays: 0, label: '赢单' },
  'ClosedLost':    { probability: 0,  benchmarkDays: 0,  label: '丢单' },
};

// ── 1. 商机健康度评分 ────────────────────────────────
// Score = (阶段胜率 × 40%) + (活跃度 × 30%) - (停滞惩罚 × 30%)
export function computeDealHealth(deal: Deal): DealHealthScore {
  const stageCfg = STAGE_CONFIG[deal.stage] || STAGE_CONFIG['Registered'];
  const stayDays = deal.daysInCurrentStage || 0;
  const avgStageDays = stageCfg.benchmarkDays;

  // 阶段胜率分 (0-40)
  const stageScore = stageCfg.probability * 0.4;

  // 活跃度分 (0-30): 最近7天有活动 = 满分，否则按天数递减
  const lastActivity = deal.lastActivityDate || deal.createdDate;
  const daysSinceActivity = lastActivity
    ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000)
    : 999;
  const activityScore = Math.max(0, 30 - daysSinceActivity * 2);

  // 停滞惩罚 (0-30): 超过基准天数后每天扣5分
  const stagnationPenalty = stayDays > avgStageDays
    ? Math.min(30, (stayDays - avgStageDays) * 5)
    : 0;

  const totalScore = Math.round(stageScore + activityScore - stagnationPenalty);
  const score = Math.max(0, Math.min(100, totalScore));

  // 状态判定
  let status: DealHealthStatus = 'HEALTHY';
  const riskFactors: string[] = [];
  if (deal.stage === 'ClosedLost') {
    status = 'LOST';
    riskFactors.push('已丢单');
  } else if (stayDays > avgStageDays * 2) {
    status = 'STUCK';
    riskFactors.push(`在「${stageCfg.label}」阶段已停滞 ${stayDays} 天（基准 ${avgStageDays} 天）`);
  } else if (stayDays > avgStageDays) {
    status = 'AT_RISK';
    riskFactors.push(`超过基准天数 ${avgStageDays} 天`);
  }
  if (deal.hasConflict) {
    status = status === 'HEALTHY' ? 'AT_RISK' : status;
    riskFactors.push('存在报备冲突');
  }
  if (daysSinceActivity > 14) {
    riskFactors.push(`已 ${daysSinceActivity} 天无活动`);
  }

  // 销售速率: 每阶段推进所需的日均速度
  const velocity = stayDays > 0
    ? Math.round((stageCfg.probability / Math.max(1, stayDays)) * 10) / 10
    : 0;

  return {
    dealId: deal.id,
    score,
    status,
    stage: deal.stage,
    stayDays,
    avgStageDays,
    isStagnant: stayDays > avgStageDays * 2,
    isConflict: !!deal.hasConflict,
    velocity,
    riskFactors,
  };
}

// ── 2. 漏斗瓶颈诊断 ──────────────────────────────────
export function diagnoseStageFunnel(deals: Deal[]): StageFunnelDiagnosis[] {
  const stages: DealLifecycleStage[] = ['Registered', 'UnderReview', 'Approved', 'Solution', 'Commercial'];

  return stages.map((stage, i) => {
    const nextStage = stages[i + 1];
    const inStage = deals.filter(d => d.stage === stage);
    const passedToNext = deals.filter(d => {
      const events = d.lifecycle || [];
      return events.some(e => e.stage === nextStage);
    });

    const entryCount = inStage.length + passedToNext.length;
    const exitCount = passedToNext.length;
    const conversionRate = entryCount > 0 ? Math.round((exitCount / entryCount) * 100) : 0;
    const cfg = STAGE_CONFIG[stage];

    // 计算平均停留天数
    const stayDays = inStage.map(d => d.daysInCurrentStage || 0).filter(d => d > 0);
    const avgStayDays = stayDays.length > 0
      ? Math.round(stayDays.reduce((a, b) => a + b, 0) / stayDays.length)
      : 0;

    const isBottleneck = conversionRate < 30 || avgStayDays > cfg.benchmarkDays * 1.5;

    let alert: string | null = null;
    if (conversionRate < 20) {
      alert = `「${cfg.label}」转化率仅 ${conversionRate}%，存在严重瓶颈，建议排查${stage === 'Solution' ? '技术支持响应' : stage === 'Commercial' ? '商务谈判策略' : stage === 'UnderReview' ? '审批流程效率' : '报备质量'}问题`;
    } else if (conversionRate < 35) {
      alert = `「${cfg.label}」转化率 ${conversionRate}%，低于健康线，需关注`;
    }

    return {
      stage,
      entryCount,
      exitCount,
      conversionRate,
      avgStayDays,
      benchmarkDays: cfg.benchmarkDays,
      isBottleneck,
      alert,
    };
  });
}

// ── 3. 批量计算所有商机健康分 ─────────────────────────
export function computeAllDealHealth(deals: Deal[]): Map<string, DealHealthScore> {
  const scores = new Map<string, DealHealthScore>();
  deals.forEach(d => scores.set(d.id, computeDealHealth(d)));
  return scores;
}

// ── 4. 诊断预警 → 行动任务 ────────────────────────────
export function generateDealActions(
  healthScores: Map<string, DealHealthScore>,
  funnelDiagnosis: StageFunnelDiagnosis[]
): { title: string; description: string; link: string; type: string }[] {
  const actions: { title: string; description: string; link: string; type: string }[] = [];

  // 漏斗瓶颈
  for (const fd of funnelDiagnosis) {
    if (fd.isBottleneck && fd.alert) {
      actions.push({
        type: 'DEAL_BOTTLENECK',
        title: `漏斗预警：${fd.alert.split('，')[0]}`,
        description: fd.alert,
        link: `/deals?stage=${fd.stage}`,
      });
    }
  }

  // 停滞商机
  const stuckDeals = Array.from(healthScores.values()).filter(h => h.status === 'STUCK');
  if (stuckDeals.length > 0) {
    stuckDeals.slice(0, 3).forEach(h => {
      actions.push({
        type: 'DEAL_STUCK',
        title: `商机停滞：${h.stayDays}天未推进`,
        description: h.riskFactors[0] || '',
        link: `/deals/${h.dealId}`,
      });
    });
  }

  // 冲突商机
  const conflicts = Array.from(healthScores.values()).filter(h => h.isConflict);
  if (conflicts.length > 0) {
    actions.push({
      type: 'DEAL_CONFLICT',
      title: `报备冲突：${conflicts.length} 笔商机存在冲突`,
      description: '请尽快处理冲突解决，避免影响伙伴关系',
      link: '/deals?tab=conflicts',
    });
  }

  return actions;
}

// ── 5. 从数据库读取并计算 ─────────────────────────────
export async function fetchDealHealthData() {
  const { data: deals } = await supabase.from('deals').select('*');
  const allDeals = ((deals || []) as any[]).map((d: any) => ({
    ...d,
    lifecycle: Array.isArray(d.lifecycle) ? d.lifecycle : [],
    daysInCurrentStage: d.days_in_current_stage || 0,
  })) as Deal[];

  const healthScores = computeAllDealHealth(allDeals);
  const funnelDiagnosis = diagnoseStageFunnel(allDeals);
  const actions = generateDealActions(healthScores, funnelDiagnosis);

  return { healthScores, funnelDiagnosis, actions, totalDeals: allDeals.length };
}
