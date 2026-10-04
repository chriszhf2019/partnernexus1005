/**
 * Metric Engine — Unified Entry Point
 * 统一指标引擎入口：所有业务指标计算的单一来源
 *
 * 架构：
 *   safeMath.ts        → 安全计算基础（除零保护、边界处理）
 *   timeProgress.ts    → 时间进度模型（时间-业绩健康度）
 *   revenueEngine.ts   → 营收指标引擎
 *   pipelineEngine.ts  → Pipeline 指标引擎
 *   partnerHealthScore.ts → 伙伴健康度评分
 *
 * 设计原则：
 * 1. 单一数据源：所有指标计算必须通过 Metric Engine
 * 2. 安全优先：所有除法、比率、百分比都经过 safeMath
 * 3. 可测试：纯函数，输入输出明确
 * 4. 可诊断：每个指标都有对应的诊断函数
 */

export * from './safeMath';
export * from './timeProgress';
export * from './revenueEngine';
export * from './pipelineEngine';
export * from './partnerHealthScore';

import type { Partner, Deal } from '../../types';
import { safeNumber, safeSum, clamp } from './safeMath';
import { calculateRevenueMetrics, type RevenueMetrics, type RevenueMetricsInput } from './revenueEngine';
import { calculatePipelineMetrics, type PipelineMetrics, type PipelineMetricsInput } from './pipelineEngine';
import {
  calculatePartnerHealth,
  calculatePortfolioHealth,
  type PartnerHealthScore,
  type PortfolioHealthSummary,
} from './partnerHealthScore';

export interface CockpitEngineInput {
  partners: Partner[];
  deals: Deal[];
  yearlyTarget: number;
  quarterlyTarget: number;
  monthlyTarget?: number;
  activities?: Array<{ partner_id: string; activity_type: string; created_at: string }>;
  stageProbabilities?: Record<string, number>;
}

export interface CockpitEngineResult {
  revenue: RevenueMetrics;
  pipeline: PipelineMetrics;
  partnerHealth: PortfolioHealthSummary;
  partnerScores: Map<string, PartnerHealthScore>;
  topPartners: Array<{ partner: Partner; score: PartnerHealthScore }>;
  atRiskPartners: Array<{ partner: Partner; score: PartnerHealthScore }>;
  zeroOutputPartners: Array<{ partner: Partner; score: PartnerHealthScore }>;
  totalPartners: number;
  activePartners: number;
  partnerActivityRate: number;
}

export function computeCockpitMetrics(input: CockpitEngineInput): CockpitEngineResult {
  const {
    partners,
    deals,
    yearlyTarget,
    quarterlyTarget,
    monthlyTarget,
    activities = [],
    stageProbabilities,
  } = input;

  const revenueInput: RevenueMetricsInput = {
    deals,
    yearlyTarget,
    quarterlyTarget,
    monthlyTarget,
  };
  const revenue = calculateRevenueMetrics(revenueInput);

  const pipelineInput: PipelineMetricsInput = {
    deals,
    quarterlyTarget,
    stageProbabilities,
  };
  const pipeline = calculatePipelineMetrics(pipelineInput);

  const partnerScores = new Map<string, PartnerHealthScore>();
  const wonDealValuesByPartner: Record<string, number> = {};
  const wonDeals = deals.filter(d =>
    d.stage === 'ClosedWon' || d.status === 'Closed Won' || d.status === 'Converted'
  );
  wonDeals.forEach(d => {
    if (d.partnerId) {
      wonDealValuesByPartner[d.partnerId] =
        (wonDealValuesByPartner[d.partnerId] || 0) + safeNumber(d.value, 0);
    }
  });

  const avgRevenue = Object.values(wonDealValuesByPartner).length > 0
    ? safeSum(Object.values(wonDealValuesByPartner)) / Object.values(wonDealValuesByPartner).length
    : 500000;

  partners.forEach(partner => {
    const partnerActivities = activities.filter(a => a.partner_id === partner.id);
    const score = calculatePartnerHealth({
      partner,
      deals,
      activities: partnerActivities,
      benchmarks: {
        avgRevenue,
        avgWinRate: 30,
        avgActivity: 5,
      },
    });
    partnerScores.set(partner.id, score);
  });

  const partnerHealth = calculatePortfolioHealth(Array.from(partnerScores.values()));

  const sortedPartners = partners
    .map(p => ({ partner: p, score: partnerScores.get(p.id)! }))
    .filter(s => s.score)
    .sort((a, b) => b.score.overall - a.score.overall);

  const topPartners = sortedPartners.slice(0, 10);
  const atRiskPartners = sortedPartners.filter(s =>
    s.score.level === 'at_risk' || s.score.level === 'critical'
  );
  const zeroOutputPartners = sortedPartners.filter(s =>
    s.score.riskFactors.includes('零产出伙伴')
  );

  const totalPartners = partners.length;
  const activePartners = partners.filter(p =>
    p.status === 'Cooperating'
  ).length;
  const partnerActivityRate = totalPartners > 0
    ? clamp(Math.round((activePartners / totalPartners) * 100), 0, 100)
    : 0;

  return {
    revenue,
    pipeline,
    partnerHealth,
    partnerScores,
    topPartners,
    atRiskPartners,
    zeroOutputPartners,
    totalPartners,
    activePartners,
    partnerActivityRate,
  };
}

export interface MetricAuditIssue {
  severity: 'error' | 'warning' | 'info';
  metric: string;
  description: string;
  suggestion: string;
  currentValue: number | string;
  expectedValue?: number | string;
}

export function auditCockpitMetrics(result: CockpitEngineResult): MetricAuditIssue[] {
  const issues: MetricAuditIssue[] = [];

  if (result.pipeline.coverageRatio > 500) {
    issues.push({
      severity: 'error',
      metric: 'pipeline.coverageRatio',
      description: `Pipeline 覆盖率 ${result.pipeline.coverageRatio}% 异常偏高，可能存在分母为 0 或数据质量问题`,
      suggestion: '检查剩余目标计算是否正确，确认 Pipeline 数据是否有重复或虚高',
      currentValue: `${result.pipeline.coverageRatio}%`,
      expectedValue: '100%-300%',
    });
  }

  if (result.revenue.timeProgress.healthStatus === 'danger') {
    issues.push({
      severity: 'warning',
      metric: 'revenue.healthScore',
      description: `营收健康度 ${result.revenue.timeProgress.healthScore}%，严重低于时间进度`,
      suggestion: '建议评估目标合理性或加速商机推进',
      currentValue: `${result.revenue.timeProgress.healthScore}%`,
    });
  }

  if (result.partnerHealth.criticalCount > 0) {
    issues.push({
      severity: 'warning',
      metric: 'partnerHealth.criticalCount',
      description: `${result.partnerHealth.criticalCount} 家伙伴处于危险状态`,
      suggestion: '建议优先关注危险伙伴，制定激活或淘汰策略',
      currentValue: result.partnerHealth.criticalCount,
    });
  }

  if (result.zeroOutputPartners.length > result.totalPartners * 0.3) {
    issues.push({
      severity: 'warning',
      metric: 'zeroOutputRatio',
      description: `零产出伙伴占比 ${Math.round((result.zeroOutputPartners.length / result.totalPartners) * 100)}%，超过 30% 警戒线`,
      suggestion: '建议梳理零产出伙伴原因，启动激活或优化伙伴结构',
      currentValue: `${Math.round((result.zeroOutputPartners.length / result.totalPartners) * 100)}%`,
      expectedValue: '<30%',
    });
  }

  if (result.pipeline.totalCount > 0 && result.pipeline.avgDealSize < 10000) {
    issues.push({
      severity: 'info',
      metric: 'pipeline.avgDealSize',
      description: `平均商机规模 ¥${result.pipeline.avgDealSize}，偏低`,
      suggestion: '可关注中大客户拓展，提升商机质量',
      currentValue: `¥${result.pipeline.avgDealSize}`,
    });
  }

  return issues;
}
