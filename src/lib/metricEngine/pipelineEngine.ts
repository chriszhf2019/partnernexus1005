/**
 * Metric Engine — Pipeline Engine
 * Pipeline 指标计算引擎：覆盖率、加权金额、预测、阶段转化率
 *
 * 修复审计问题：
 * 1. Pipeline vs 目标异常（∞ 覆盖率）
 * 2. 加权 Pipeline 预测
 * 3. 阶段转化率诊断
 */

import { safePercent, safeDiv, safeNumber, clamp, safeSum } from './safeMath';
import type { Deal } from '../../types';

export interface PipelineMetricsInput {
  deals: Deal[];
  quarterlyTarget: number;
  remainingTarget?: number;
  stageProbabilities?: Record<string, number>;
}

export interface PipelineMetrics {
  totalValue: number;
  totalCount: number;
  weightedValue: number;
  coverageRatio: number;
  coverageToRemaining: number;
  newInQuarterValue: number;
  historicalValue: number;
  newInQuarterRatio: number;
  historicalRatio: number;
  avgDealSize: number;
  winRate: number;
  avgSalesCycle: number;
  stageBreakdown: Array<{
    stage: string;
    count: number;
    value: number;
    conversionRate: number;
  }>;
  forecastValue: number;
  forecastConfidence: 'high' | 'medium' | 'low';
}

const DEFAULT_STAGE_PROBABILITIES: Record<string, number> = {
  'Registered': 0.10,
  'UnderReview': 0.20,
  'Approved': 0.35,
  'Solution': 0.50,
  'Commercial': 0.80,
  'Negotiation': 0.90,
  'ClosedWon': 1.00,
  'ClosedLost': 0.00,
};

const ACTIVE_STAGES = [
  'Registered', 'UnderReview', 'Approved',
  'Solution', 'Commercial', 'Negotiation',
];

export function isActiveDeal(deal: Deal): boolean {
  return !['ClosedWon', 'ClosedLost'].includes(deal.stage || '');
}

export function isWonDeal(deal: Deal): boolean {
  return deal.stage === 'ClosedWon' || deal.status === 'Converted';
}

export function calculatePipelineMetrics(input: PipelineMetricsInput): PipelineMetrics {
  const {
    deals,
    quarterlyTarget,
    remainingTarget,
    stageProbabilities = DEFAULT_STAGE_PROBABILITIES,
  } = input;

  const activeDeals = deals.filter(isActiveDeal);
  const wonDeals = deals.filter(isWonDeal);

  const totalValue = safeSum(activeDeals.map(d => d.value));
  const totalCount = activeDeals.length;

  const weightedValue = calculateWeightedPipeline(activeDeals, stageProbabilities);

  const coverageRatio = safePercent(weightedValue, quarterlyTarget, 0);
  const remaining = remainingTarget !== undefined
    ? remainingTarget
    : Math.max(0, quarterlyTarget - safeSum(wonDeals.map(d => d.value)));
  const coverageToRemaining = safePercent(weightedValue, remaining, 999);

  const now = new Date();
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
  const currentYear = now.getFullYear();

  const newInQuarterDeals = activeDeals.filter(d => {
    const created = new Date(d.createdDate || '');
    return created.getFullYear() === currentYear &&
      Math.ceil((created.getMonth() + 1) / 3) === currentQuarter;
  });

  const newInQuarterValue = safeSum(newInQuarterDeals.map(d => d.value));
  const historicalValue = totalValue - newInQuarterValue;
  const newInQuarterRatio = safePercent(newInQuarterValue, totalValue, 0);
  const historicalRatio = safePercent(historicalValue, totalValue, 0);

  const avgDealSize = totalCount > 0 ? Math.round(totalValue / totalCount) : 0;

  const totalClosed = wonDeals.length + deals.filter(d => d.stage === 'ClosedLost').length;
  const winRate = totalClosed > 0
    ? safePercent(wonDeals.length, totalClosed, 0)
    : 0;

  const avgSalesCycle = calculateAvgSalesCycle(wonDeals);

  const stageBreakdown = calculateStageBreakdown(activeDeals, stageProbabilities);

  const forecastValue = Math.round(weightedValue * 0.7);
  const forecastConfidence = getForecastConfidence(coverageRatio, winRate);

  return {
    totalValue,
    totalCount,
    weightedValue,
    coverageRatio: clamp(coverageRatio, 0, 999),
    coverageToRemaining: clamp(coverageToRemaining, 0, 999),
    newInQuarterValue,
    historicalValue,
    newInQuarterRatio: clamp(newInQuarterRatio, 0, 100),
    historicalRatio: clamp(historicalRatio, 0, 100),
    avgDealSize,
    winRate,
    avgSalesCycle,
    stageBreakdown,
    forecastValue,
    forecastConfidence,
  };
}

export function calculateWeightedPipeline(
  deals: Deal[],
  stageProbabilities: Record<string, number>
): number {
  return deals.reduce((sum, deal) => {
    const prob = stageProbabilities[deal.stage || ''] ?? 0;
    const value = safeNumber(deal.value, 0);
    return sum + Math.round(value * prob);
  }, 0);
}

function calculateStageBreakdown(
  deals: Deal[],
  stageProbabilities: Record<string, number>
): PipelineMetrics['stageBreakdown'] {
  return ACTIVE_STAGES.map(stage => {
    const stageDeals = deals.filter(d => d.stage === stage);
    const count = stageDeals.length;
    const value = safeSum(stageDeals.map(d => d.value));

    const stageIndex = ACTIVE_STAGES.indexOf(stage);
    const nextStage = ACTIVE_STAGES[stageIndex + 1];
    let conversionRate = 0;

    if (nextStage) {
      const nextStageDeals = deals.filter(d => d.stage === nextStage).length;
      const total = count + nextStageDeals;
      conversionRate = total > 0 ? safePercent(nextStageDeals, total, 0) : 0;
    } else {
      conversionRate = 100;
    }

    return { stage, count, value, conversionRate };
  });
}

function calculateAvgSalesCycle(wonDeals: Deal[]): number {
  const withDates = wonDeals.filter(d =>
    d.createdDate && (d as any).actualCloseDate
  );

  if (withDates.length === 0) return 0;

  const totalDays = withDates.reduce((sum, d) => {
    const start = new Date(d.createdDate!).getTime();
    const end = new Date((d as any).actualCloseDate).getTime();
    return sum + Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  }, 0);

  return Math.round(totalDays / withDates.length);
}

function getForecastConfidence(
  coverageRatio: number,
  winRate: number
): PipelineMetrics['forecastConfidence'] {
  if (coverageRatio >= 150 && winRate >= 30) return 'high';
  if (coverageRatio >= 100 && winRate >= 20) return 'medium';
  return 'low';
}

export interface PipelineDiagnosis {
  level: 'healthy' | 'warning' | 'danger';
  title: string;
  description: string;
  metric: string;
  suggestion: string;
}

export function diagnosePipeline(metrics: PipelineMetrics): PipelineDiagnosis[] {
  const diagnoses: PipelineDiagnosis[] = [];

  if (metrics.coverageRatio < 100) {
    diagnoses.push({
      level: 'danger',
      title: 'Pipeline 储备不足',
      description: `加权 Pipeline 仅覆盖季度目标的 ${metrics.coverageRatio}%，存在缺口`,
      metric: 'coverageRatio',
      suggestion: '建议加大商机拓展力度，重点提升报备数量',
    });
  } else if (metrics.coverageRatio < 150) {
    diagnoses.push({
      level: 'warning',
      title: 'Pipeline 储备偏紧',
      description: `加权 Pipeline 覆盖率 ${metrics.coverageRatio}%，安全边际不足`,
      metric: 'coverageRatio',
      suggestion: '建议保持商机拓展节奏，关注转化效率',
    });
  }

  if (metrics.newInQuarterRatio < 30 && metrics.totalValue > 0) {
    diagnoses.push({
      level: 'warning',
      title: '新增商机占比偏低',
      description: `本季度新增商机仅占 ${metrics.newInQuarterRatio}%，历史存量占比较高`,
      metric: 'newInQuarterRatio',
      suggestion: '建议推动老商机推进，同时开拓新商机源',
    });
  }

  if (metrics.winRate < 15) {
    diagnoses.push({
      level: 'danger',
      title: '赢单率偏低',
      description: `整体赢单率仅 ${metrics.winRate}%，低于健康水平 25%`,
      metric: 'winRate',
      suggestion: '建议加强商机质量把控和销售赋能培训',
    });
  }

  return diagnoses;
}
