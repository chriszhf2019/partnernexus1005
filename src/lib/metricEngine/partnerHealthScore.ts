/**
 * Metric Engine — Partner Health Score Engine
 * 伙伴健康度统一评分模型
 *
 * 修复审计问题：健康度系统不可信（没有统一评分模型）
 *
 * 评分公式：
 * Health Score =
 *   0.40 × Revenue Contribution   （营收贡献）
 *   0.30 × Pipeline Conversion    （管线转化率）
 *   0.20 × Activity Frequency     （活跃度）
 *   0.10 × Strategic Tier         （战略等级）
 */

import { safeNumber, safePercent, safeDiv, clamp, safeSum } from './safeMath';
import type { Partner, Deal } from '../../types';

export interface PartnerHealthInput {
  partner: Partner;
  deals: Deal[];
  activities?: Array<{ activity_type: string; created_at: string }>;
  benchmarks?: {
    avgRevenue: number;
    avgWinRate: number;
    avgActivity: number;
  };
}

export interface PartnerHealthScore {
  overall: number;
  revenueScore: number;
  pipelineScore: number;
  activityScore: number;
  tierScore: number;
  breakdown: {
    revenueContribution: number;
    pipelineConversion: number;
    activityFrequency: number;
    strategicTier: number;
  };
  radar: Array<{ name: string; value: number }>;
  level: 'excellent' | 'good' | 'average' | 'at_risk' | 'critical';
  riskFactors: string[];
  strengths: string[];
  lastActiveDate: string | null;
  daysSinceLastActivity: number;
}

export const HEALTH_WEIGHTS = {
  revenue: 0.40,
  pipeline: 0.30,
  activity: 0.20,
  tier: 0.10,
} as const;

export const TIER_SCORES: Record<string, number> = {
  Diamond: 100,
  Platinum: 90,
  Gold: 75,
  Silver: 60,
  Bronze: 45,
  Standard: 40,
  Registered: 30,
};

export function calculatePartnerHealth(input: PartnerHealthInput): PartnerHealthScore {
  const { partner, deals, activities = [], benchmarks } = input;

  const partnerDeals = deals.filter(d => d.partnerId === partner.id);
  const wonDeals = partnerDeals.filter(d =>
    d.stage === 'ClosedWon' || d.status === 'Closed Won' || d.status === 'Converted'
  );
  const activeDeals = partnerDeals.filter(d =>
    !['ClosedWon', 'ClosedLost'].includes(d.stage || '')
  );

  const totalRevenue = safeSum(wonDeals.map(d => d.value));
  const winRate = partnerDeals.length > 0
    ? safePercent(wonDeals.length, partnerDeals.length, 0)
    : 0;

  const revenueScore = calculateRevenueScore(totalRevenue, benchmarks?.avgRevenue);
  const pipelineScore = calculatePipelineScore(winRate, activeDeals.length, benchmarks?.avgWinRate);
  const activityScore = calculateActivityScore(activities, benchmarks?.avgActivity);
  const tierScore = TIER_SCORES[partner.tier || ''] ?? 30;

  const overall = Math.round(
    revenueScore * HEALTH_WEIGHTS.revenue +
    pipelineScore * HEALTH_WEIGHTS.pipeline +
    activityScore * HEALTH_WEIGHTS.activity +
    tierScore * HEALTH_WEIGHTS.tier
  );

  const level = getHealthLevel(overall);

  const { riskFactors, strengths } = analyzeHealthFactors({
    revenueScore,
    pipelineScore,
    activityScore,
    tierScore,
    winRate,
    totalRevenue,
    daysSinceLastActivity: getDaysSinceLastActivity(activities),
    activeDealCount: activeDeals.length,
  });

  const lastActiveDate = getLastActiveDate(activities);
  const daysSinceLastActivity = getDaysSinceLastActivity(activities);

  return {
    overall: clamp(overall, 0, 100),
    revenueScore,
    pipelineScore,
    activityScore,
    tierScore,
    breakdown: {
      revenueContribution: revenueScore,
      pipelineConversion: pipelineScore,
      activityFrequency: activityScore,
      strategicTier: tierScore,
    },
    radar: [
      { name: '营收贡献', value: revenueScore },
      { name: '管线转化', value: pipelineScore },
      { name: '活跃度', value: activityScore },
      { name: '战略等级', value: tierScore },
    ],
    level,
    riskFactors,
    strengths,
    lastActiveDate,
    daysSinceLastActivity,
  };
}

function calculateRevenueScore(
  totalRevenue: number,
  avgRevenue: number = 500000
): number {
  if (avgRevenue === 0) return 50;
  const ratio = safeDiv(totalRevenue, avgRevenue, 0);
  return clamp(Math.round(ratio * 50), 0, 100);
}

function calculatePipelineScore(
  winRate: number,
  activeDealCount: number,
  avgWinRate: number = 30
): number {
  const winRateScore = avgWinRate > 0
    ? clamp(Math.round((winRate / avgWinRate) * 50), 0, 50)
    : 30;
  const pipelineCountScore = clamp(activeDealCount * 5, 0, 50);
  return Math.round((winRateScore + pipelineCountScore) / 2);
}

function calculateActivityScore(
  activities: Array<{ activity_type: string }>,
  avgActivity: number = 10
): number {
  const count = activities.length;
  if (avgActivity === 0) return 50;
  const ratio = safeDiv(count, avgActivity, 0);
  return clamp(Math.round(ratio * 50), 0, 100);
}

function getHealthLevel(score: number): PartnerHealthScore['level'] {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 50) return 'average';
  if (score >= 30) return 'at_risk';
  return 'critical';
}

function analyzeHealthFactors(input: {
  revenueScore: number;
  pipelineScore: number;
  activityScore: number;
  tierScore: number;
  winRate: number;
  totalRevenue: number;
  daysSinceLastActivity: number;
  activeDealCount: number;
}): { riskFactors: string[]; strengths: string[] } {
  const riskFactors: string[] = [];
  const strengths: string[] = [];

  if (input.revenueScore >= 70) strengths.push('营收贡献突出');
  else if (input.revenueScore < 30) riskFactors.push('营收贡献偏低');

  if (input.pipelineScore >= 70) strengths.push('管线转化能力强');
  else if (input.pipelineScore < 30) riskFactors.push('管线转化效率低');

  if (input.activityScore >= 70) strengths.push('活跃度高');
  else if (input.activityScore < 30) riskFactors.push('活跃度不足');

  if (input.daysSinceLastActivity > 60) riskFactors.push('长期无活动（>60天）');
  else if (input.daysSinceLastActivity > 30) riskFactors.push('近期活动减少（>30天）');

  if (input.activeDealCount === 0 && input.winRate === 0) {
    riskFactors.push('零产出伙伴');
  }

  if (input.tierScore >= 80) strengths.push('战略等级高');

  return { riskFactors, strengths };
}

function getLastActiveDate(
  activities: Array<{ created_at: string }>
): string | null {
  if (activities.length === 0) return null;
  const sorted = [...activities].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return sorted[0]?.created_at || null;
}

function getDaysSinceLastActivity(
  activities: Array<{ created_at: string }>
): number {
  const lastDate = getLastActiveDate(activities);
  if (!lastDate) return 999;
  const diff = Date.now() - new Date(lastDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export interface PortfolioHealthSummary {
  overallAvg: number;
  distribution: Record<PartnerHealthScore['level'], number>;
  atRiskCount: number;
  criticalCount: number;
  excellentCount: number;
  avgRevenueScore: number;
  avgPipelineScore: number;
  avgActivityScore: number;
  avgTierScore: number;
}

export function calculatePortfolioHealth(
  scores: PartnerHealthScore[]
): PortfolioHealthSummary {
  const total = scores.length || 1;

  const distribution: PortfolioHealthSummary['distribution'] = {
    excellent: 0,
    good: 0,
    average: 0,
    at_risk: 0,
    critical: 0,
  };

  scores.forEach(s => {
    distribution[s.level] = (distribution[s.level] || 0) + 1;
  });

  const overallAvg = Math.round(safeSum(scores.map(s => s.overall)) / total);
  const avgRevenueScore = Math.round(safeSum(scores.map(s => s.revenueScore)) / total);
  const avgPipelineScore = Math.round(safeSum(scores.map(s => s.pipelineScore)) / total);
  const avgActivityScore = Math.round(safeSum(scores.map(s => s.activityScore)) / total);
  const avgTierScore = Math.round(safeSum(scores.map(s => s.tierScore)) / total);

  return {
    overallAvg,
    distribution,
    atRiskCount: distribution.at_risk,
    criticalCount: distribution.critical,
    excellentCount: distribution.excellent,
    avgRevenueScore,
    avgPipelineScore,
    avgActivityScore,
    avgTierScore,
  };
}

export function getHealthLevelLabel(level: PartnerHealthScore['level']): string {
  const labels: Record<string, string> = {
    excellent: '优秀',
    good: '良好',
    average: '一般',
    at_risk: '预警',
    critical: '危险',
  };
  return labels[level] || level;
}

export function getHealthLevelColor(level: PartnerHealthScore['level']): string {
  const colors: Record<string, string> = {
    excellent: 'emerald',
    good: 'blue',
    average: 'slate',
    at_risk: 'amber',
    critical: 'red',
  };
  return colors[level] || 'slate';
}
