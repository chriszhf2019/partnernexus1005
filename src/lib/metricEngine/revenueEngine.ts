/**
 * Metric Engine — Revenue Engine
 * 营收指标计算引擎：达成率、时间进度健康度、月度趋势、预测
 *
 * 修复审计问题：时间进度 vs 业绩进度冲突（逻辑错位）
 */

import { safeNumber, safePercent, safeSum, clamp, safeDiv } from './safeMath';
import {
  calculateTimeProgress,
  calculateQuarterlyHealth,
  type TimeProgressResult,
} from './timeProgress';
import type { Deal } from '../../types';

export interface RevenueMetricsInput {
  deals: Deal[];
  yearlyTarget: number;
  quarterlyTarget: number;
  monthlyTarget?: number;
  asOfDate?: string | Date;
}

export interface RevenueMetrics {
  totalRevenue: number;
  quarterlyRevenue: number;
  monthlyRevenue: number;
  yearlyAchievement: number;
  quarterlyAchievement: number;
  monthlyAchievement: number;
  timeProgress: TimeProgressResult;
  monthlyTrend: Array<{
    month: string;
    value: number;
    target: number;
    achievement: number;
    growth: number;
  }>;
  avgDealSize: number;
  wonDealCount: number;
  forecastYearEnd: number;
  runRate: number;
}

export function calculateRevenueMetrics(input: RevenueMetricsInput): RevenueMetrics {
  const { deals, yearlyTarget, quarterlyTarget, asOfDate = new Date() } = input;

  const now = new Date(asOfDate);
  const currentYear = now.getFullYear();
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3) as 1 | 2 | 3 | 4;
  const currentMonth = now.getMonth();

  const wonDeals = deals.filter(d =>
    d.stage === 'ClosedWon' || d.status === 'Closed Won' || d.status === 'Converted'
  );

  const totalRevenue = safeSum(wonDeals.map(d => d.value));

  const quarterlyDeals = wonDeals.filter(d => {
    const date = new Date(d.lastActivityDate || d.createdDate || '');
    return date.getFullYear() === currentYear &&
      Math.ceil((date.getMonth() + 1) / 3) === currentQuarter;
  });
  const quarterlyRevenue = safeSum(quarterlyDeals.map(d => d.value));

  const monthlyDeals = wonDeals.filter(d => {
    const date = new Date(d.lastActivityDate || d.createdDate || '');
    return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
  });
  const monthlyRevenue = safeSum(monthlyDeals.map(d => d.value));

  const yearlyAchievement = safePercent(totalRevenue, yearlyTarget, 0);
  const quarterlyAchievement = safePercent(quarterlyRevenue, quarterlyTarget, 0);
  const monthlyTarget = input.monthlyTarget || quarterlyTarget / 3;
  const monthlyAchievement = safePercent(monthlyRevenue, monthlyTarget, 0);

  const timeProgress = calculateQuarterlyHealth(quarterlyTarget, quarterlyRevenue);

  const monthlyTrend = buildMonthlyTrend(wonDeals, yearlyTarget, currentYear, currentQuarter);

  const wonDealCount = wonDeals.length;
  const avgDealSize = wonDealCount > 0 ? Math.round(totalRevenue / wonDealCount) : 0;

  const daysInQuarter = timeProgress.daysTotal;
  const daysElapsed = timeProgress.daysTotal - timeProgress.daysRemaining;
  const runRate = daysElapsed > 0
    ? Math.round((quarterlyRevenue / daysElapsed) * daysInQuarter)
    : quarterlyRevenue;

  const quartersCompleted = currentQuarter - 1;
  const forecastYearEnd = totalRevenue +
    Math.max(0, quarterlyTarget * (4 - currentQuarter)) * 0.7;

  return {
    totalRevenue,
    quarterlyRevenue,
    monthlyRevenue,
    yearlyAchievement: clamp(yearlyAchievement, 0, 999),
    quarterlyAchievement: clamp(quarterlyAchievement, 0, 999),
    monthlyAchievement: clamp(monthlyAchievement, 0, 999),
    timeProgress,
    monthlyTrend,
    avgDealSize,
    wonDealCount,
    forecastYearEnd,
    runRate,
  };
}

function buildMonthlyTrend(
  wonDeals: Deal[],
  yearlyTarget: number,
  currentYear: number,
  currentQuarter: number
): RevenueMetrics['monthlyTrend'] {
  const monthlyData: Map<string, number> = new Map();

  wonDeals.forEach(deal => {
    const date = new Date(deal.lastActivityDate || deal.createdDate || '');
    if (date.getFullYear() !== currentYear) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData.set(key, (monthlyData.get(key) || 0) + safeNumber(deal.value, 0));
  });

  const trend: RevenueMetrics['monthlyTrend'] = [];
  const quarterlyMonths = [(currentQuarter - 1) * 3, (currentQuarter - 1) * 3 + 1, (currentQuarter - 1) * 3 + 2];
  const monthlyTarget = yearlyTarget / 12;

  quarterlyMonths.forEach(monthIdx => {
    const key = `${currentYear}-${String(monthIdx + 1).padStart(2, '0')}`;
    const value = monthlyData.get(key) || 0;
    const prevKey = `${currentYear}-${String(monthIdx).padStart(2, '0')}`;
    const prevValue = monthlyData.get(prevKey) || 0;

    const achievement = safePercent(value, monthlyTarget, 0);
    const growth = prevValue > 0
      ? Math.round(((value - prevValue) / prevValue) * 100)
      : value > 0 ? 100 : 0;

    trend.push({
      month: `${monthIdx + 1}月`,
      value,
      target: Math.round(monthlyTarget),
      achievement: clamp(achievement, 0, 999),
      growth,
    });
  });

  return trend;
}

export interface RevenueDiagnosis {
  level: 'healthy' | 'warning' | 'danger';
  title: string;
  description: string;
  metric: string;
  suggestion: string;
}

export function diagnoseRevenue(metrics: RevenueMetrics): RevenueDiagnosis[] {
  const diagnoses: RevenueDiagnosis[] = [];

  const { healthStatus, healthScore } = metrics.timeProgress;

  if (healthStatus === 'danger') {
    diagnoses.push({
      level: 'danger',
      title: '营收严重滞后',
      description: `时间进度 ${metrics.timeProgress.timeProgress}%，但营收仅完成 ${metrics.quarterlyAchievement}%，健康度 ${healthScore}%`,
      metric: 'healthScore',
      suggestion: '建议紧急加派商机拓展资源，关注高价值商机推进',
    });
  } else if (healthStatus === 'at_risk') {
    diagnoses.push({
      level: 'warning',
      title: '营收进度偏慢',
      description: `健康度 ${healthScore}%，低于预期节奏，需要加速推进`,
      metric: 'healthScore',
      suggestion: '建议梳理高潜商机清单，制定专项推进计划',
    });
  } else if (healthStatus === 'ahead') {
    diagnoses.push({
      level: 'healthy',
      title: '营收超预期',
      description: `健康度 ${healthScore}%，超越时间进度，表现优秀`,
      metric: 'healthScore',
      suggestion: '建议保持节奏，同时关注 Q4 储备',
    });
  }

  if (metrics.wonDealCount > 0 && metrics.avgDealSize < 100000) {
    diagnoses.push({
      level: 'warning',
      title: '客单价偏低',
      description: `平均客单价 ¥${(metrics.avgDealSize / 10000).toFixed(1)}万，低于预期`,
      metric: 'avgDealSize',
      suggestion: '建议关注中大客户拓展，提升商机质量',
    });
  }

  return diagnoses;
}
