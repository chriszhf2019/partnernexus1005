/**
 * Metric Engine — Time Progress Model
 * 时间进度模型：统一时间进度、期望营收、健康度评分的计算标准
 *
 * 核心概念：
 * - Time Progress: 当前时间在目标周期中的进度 (%)
 * - Expected Revenue: 按时间进度应该完成的营收
 * - Health Score: 实际营收 / 期望营收的比值（>100% = 超预期，<80% = 危险）
 *
 * 修复审计问题：时间进度 vs 业绩进度冲突（逻辑错位）
 */

import { safeDiv, safePercent, clamp, safeNumber } from './safeMath';

export interface TimeProgressInput {
  startDate: string | Date;
  endDate: string | Date;
  asOfDate?: string | Date;
  totalTarget: number;
  actualRevenue: number;
}

export interface TimeProgressResult {
  timeProgress: number;
  expectedRevenue: number;
  healthScore: number;
  healthStatus: 'ahead' | 'on_track' | 'at_risk' | 'danger';
  gap: number;
  gapPercent: number;
  isCompleted: boolean;
  daysRemaining: number;
  daysTotal: number;
}

export const HEALTH_THRESHOLDS = {
  AHEAD: 110,
  ON_TRACK: 95,
  AT_RISK: 80,
} as const;

export function calculateTimeProgress(input: TimeProgressInput): TimeProgressResult {
  const start = new Date(input.startDate).getTime();
  const end = new Date(input.endDate).getTime();
  const asOf = input.asOfDate ? new Date(input.asOfDate).getTime() : Date.now();

  const totalTarget = safeNumber(input.totalTarget, 0);
  const actualRevenue = safeNumber(input.actualRevenue, 0);

  const daysTotal = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.max(0, Math.min(daysTotal, Math.ceil((asOf - start) / (1000 * 60 * 60 * 24))));
  const daysRemaining = Math.max(0, daysTotal - daysElapsed);

  const timeProgress = safePercent(daysElapsed, daysTotal, 0);
  const expectedRevenue = Math.round(totalTarget * (timeProgress / 100));

  const healthRatio = safeDiv(actualRevenue, expectedRevenue, 0);
  const healthScore = Math.round(healthRatio * 100);

  let healthStatus: TimeProgressResult['healthStatus'] = 'on_track';
  if (healthScore >= HEALTH_THRESHOLDS.AHEAD) {
    healthStatus = 'ahead';
  } else if (healthScore >= HEALTH_THRESHOLDS.ON_TRACK) {
    healthStatus = 'on_track';
  } else if (healthScore >= HEALTH_THRESHOLDS.AT_RISK) {
    healthStatus = 'at_risk';
  } else {
    healthStatus = 'danger';
  }

  const gap = actualRevenue - expectedRevenue;
  const gapPercent = expectedRevenue > 0
    ? Math.round((gap / expectedRevenue) * 100)
    : 0;

  const isCompleted = asOf >= end;

  return {
    timeProgress: clamp(timeProgress, 0, 100),
    expectedRevenue,
    healthScore: clamp(healthScore, 0, 999),
    healthStatus,
    gap,
    gapPercent,
    isCompleted,
    daysRemaining,
    daysTotal,
  };
}

export function getQuarterDateRange(
  year: number,
  quarter: 1 | 2 | 3 | 4
): { start: Date; end: Date } {
  const startMonth = (quarter - 1) * 3;
  const endMonth = quarter * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, endMonth, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getCurrentQuarter(): { year: number; quarter: 1 | 2 | 3 | 4 } {
  const now = new Date();
  const year = now.getFullYear();
  const quarter = Math.ceil((now.getMonth() + 1) / 3) as 1 | 2 | 3 | 4;
  return { year, quarter };
}

export function calculateQuarterlyHealth(
  quarterlyTarget: number,
  actualRevenue: number
): TimeProgressResult {
  const { year, quarter } = getCurrentQuarter();
  const { start, end } = getQuarterDateRange(year, quarter);
  return calculateTimeProgress({
    startDate: start,
    endDate: end,
    totalTarget: quarterlyTarget,
    actualRevenue,
  });
}

export function getHealthStatusLabel(status: TimeProgressResult['healthStatus']): string {
  const labels: Record<string, string> = {
    ahead: '超预期',
    on_track: '正常',
    at_risk: '有风险',
    danger: '严重滞后',
  };
  return labels[status] || status;
}

export function getHealthStatusColor(status: TimeProgressResult['healthStatus']): string {
  const colors: Record<string, string> = {
    ahead: 'emerald',
    on_track: 'blue',
    at_risk: 'amber',
    danger: 'red',
  };
  return colors[status] || 'slate';
}
