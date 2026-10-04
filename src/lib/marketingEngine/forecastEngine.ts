/**
 * Forecast Engine - 预测引擎
 * 
 * 核心功能：
 * 1. 基于历史数据预测未来指标
 * 2. 趋势分析
 * 3. 风险识别
 * 
 * 解决的问题："未来会怎样？"
 */

import { safeDiv, clamp } from '../metricEngine/safeMath';

// ===== 预测类型 =====

export interface ForecastPeriod {
  start: Date;
  end: Date;
  label: string;
}

export interface MetricForecast {
  metric: string;
  label: string;
  
  // 历史数据
  historical: Array<{ date: string; value: number }>;
  
  // 预测值
  forecast: Array<{ date: string; value: number; confidence: number }>;
  
  // 趋势
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  
  // 预测偏差
  target?: number;
  gap?: number;
  gapPercent?: number;
}

export interface RevenueForecast {
  period: ForecastPeriod;
  
  // 预测值
  predicted: {
    revenue: number;
    leads: number;
    conversions: number;
    pipeline: number;
  };
  
  // 目标对比
  target: {
    revenue: number;
    leads: number;
    conversions: number;
    pipeline: number;
  };
  
  // 差距分析
  gap: {
    revenue: number;
    leads: number;
    revenuePercent: number;
  };
  
  // 风险评估
  risks: Array<{
    type: 'coverage' | 'conversion' | 'pipeline' | 'timing';
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    mitigation?: string;
  }>;
  
  // 置信区间
  confidence: {
    low: number;
    mid: number;
    high: number;
  };
}

export interface TrendAnalysis {
  metric: string;
  period: string;
  
  // 同比/环比
  yoy: number;  // 同比变化
  qoq: number;  // 环比变化
  mom: number;  // 月环比
  
  // 趋势
  direction: 'accelerating' | 'stable' | 'decelerating';
  velocity: number; // 变化速度
  
  // 季节性
  seasonality: 'high' | 'medium' | 'low';
  peakMonth?: number;
}

// ===== 预测算法 =====

/**
 * 简单移动平均预测
 */
export function simpleMovingAverage(
  data: number[],
  window: number = 3
): number {
  if (data.length === 0) return 0;
  const slice = data.slice(-window);
  return slice.reduce((sum, val) => sum + val, 0) / slice.length;
}

/**
 * 加权移动平均预测
 */
export function weightedMovingAverage(
  data: number[],
  weights: number[] = [0.5, 0.3, 0.2]
): number {
  if (data.length === 0) return 0;
  const slice = data.slice(-weights.length);
  const weightSum = weights.slice(0, slice.length).reduce((a, b) => a + b, 0);
  
  return slice.reduce((sum, val, idx) => {
    const weight = weights[idx] || 0;
    return sum + val * weight;
  }, 0) / weightSum;
}

/**
 * 线性回归预测
 */
export function linearRegression(
  data: Array<{ x: number; y: number }>
): { slope: number; intercept: number; r2: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };
  
  const sumX = data.reduce((sum, d) => sum + d.x, 0);
  const sumY = data.reduce((sum, d) => sum + d.y, 0);
  const sumXY = data.reduce((sum, d) => sum + d.x * d.y, 0);
  const sumX2 = data.reduce((sum, d) => sum + d.x * d.x, 0);
  const sumY2 = data.reduce((sum, d) => sum + d.y * d.y, 0);
  
  const slope = safeDiv(n * sumXY - sumX * sumY, n * sumX2 - sumX * sumX);
  const intercept = safeDiv(sumY - slope * sumX, n);
  
  // R² 计算
  const yMean = sumY / n;
  const ssTotal = data.reduce((sum, d) => sum + Math.pow(d.y - yMean, 2), 0);
  const ssResidual = data.reduce((sum, d) => {
    const predicted = slope * d.x + intercept;
    return sum + Math.pow(d.y - predicted, 2);
  }, 0);
  const r2 = ssTotal > 0 ? 1 - safeDiv(ssResidual, ssTotal) : 0;
  
  return { slope, intercept, r2: Math.round(r2 * 100) / 100 };
}

/**
 * 预测未来值
 */
export function predictNextValue(
  historical: number[],
  periodsAhead: number = 1,
  method: 'sma' | 'wma' | 'linear' = 'linear'
): { value: number; confidence: number } {
  if (historical.length === 0) {
    return { value: 0, confidence: 0 };
  }
  
  let value = 0;
  let confidence = 0;
  
  switch (method) {
    case 'sma':
      value = simpleMovingAverage(historical);
      confidence = Math.min(90, 50 + historical.length * 5);
      break;
      
    case 'wma':
      value = weightedMovingAverage(historical);
      confidence = Math.min(85, 45 + historical.length * 4);
      break;
      
    case 'linear':
      const lrData = historical.map((y, x) => ({ x, y }));
      const { slope, intercept, r2 } = linearRegression(lrData);
      value = slope * (historical.length) + intercept;
      confidence = r2 * 80;
      
      // 如果趋势明显且历史数据充足，提高置信度
      if (Math.abs(slope) > 0.1 && historical.length >= 4) {
        confidence = Math.min(95, confidence + 15);
      }
      break;
  }
  
  return {
    value: Math.max(0, Math.round(value)),
    confidence: Math.round(clamp(confidence, 0, 100)),
  };
}

// ===== 预测生成 =====

/**
 * 生成收入预测
 */
export function generateRevenueForecast(data: {
  currentRevenue: number;
  targetRevenue: number;
  currentLeads: number;
  historicalRevenue?: number[];
  historicalLeads?: number[];
  historicalConversionRate?: number[];
  pipelineValue: number;
  conversionRate: number;
  daysRemaining: number;
  activities?: Array<{
    date: string;
    budget: number;
    expectedRevenue: number;
    status: 'planned' | 'active' | 'completed';
  }>;
  coverageByRegion?: Record<string, number>;
}): RevenueForecast {
  const now = new Date();
  const endDate = new Date();
  endDate.setDate(now.getDate() + data.daysRemaining);
  
  // 计算历史趋势
  const revenueTrend = data.historicalRevenue && data.historicalRevenue.length >= 2
    ? (data.historicalRevenue[data.historicalRevenue.length - 1] - data.historicalRevenue[0]) / data.historicalRevenue[0]
    : 0;
  
  // 预测未来营收
  const predictedRevenue = data.currentRevenue + data.currentRevenue * revenueTrend * (data.daysRemaining / 90);
  
  // 考虑计划中的活动
  const plannedActivitiesRevenue = data.activities
    ?.filter(a => a.status === 'planned')
    .reduce((sum, a) => sum + a.expectedRevenue, 0) || 0;
  
  // 最终预测
  const finalPredictedRevenue = predictedRevenue + plannedActivitiesRevenue;
  
  // 预测线索
  const leadTrend = data.historicalLeads && data.historicalLeads.length >= 2
    ? (data.historicalLeads[data.historicalLeads.length - 1] - data.historicalLeads[0]) / data.historicalLeads[0]
    : 0;
  const predictedLeads = data.currentLeads * (1 + leadTrend);
  
  // 预测转化
  const avgConversion = data.historicalConversionRate && data.historicalConversionRate.length > 0
    ? data.historicalConversionRate.reduce((a, b) => a + b, 0) / data.historicalConversionRate.length
    : data.conversionRate;
  const predictedConversions = Math.round(predictedLeads * (avgConversion / 100));
  
  // 风险评估
  const risks: RevenueForecast['risks'] = [];
  
  // 覆盖风险
  if (data.coverageByRegion) {
    const lowCoverage = Object.entries(data.coverageByRegion)
      .filter(([_, rate]) => rate < 50)
      .map(([region]) => region);
    
    if (lowCoverage.length > 0) {
      risks.push({
        type: 'coverage',
        severity: lowCoverage.length > 3 ? 'critical' : 'high',
        description: `${lowCoverage.join('、')} 等区域覆盖率偏低`,
        mitigation: '建议在低覆盖区域开展营销活动',
      });
    }
  }
  
  // 转化风险
  if (avgConversion < 20) {
    risks.push({
      type: 'conversion',
      severity: avgConversion < 10 ? 'critical' : 'medium',
      description: `转化率 ${avgConversion.toFixed(1)}% 偏低`,
      mitigation: '建议优化转化流程和培育策略',
    });
  }
  
  // Pipeline 风险
  if (data.pipelineValue < data.targetRevenue * 2) {
    risks.push({
      type: 'pipeline',
      severity: data.pipelineValue < data.targetRevenue ? 'critical' : 'high',
      description: 'Pipeline 储备不足，可能影响营收达成',
      mitigation: '建议加速商机推进或拓展新 Pipeline',
    });
  }
  
  // 时间风险
  if (data.daysRemaining < 30 && finalPredictedRevenue < data.targetRevenue * 0.8) {
    risks.push({
      type: 'timing',
      severity: 'critical',
      description: '时间紧迫，存在无法达成目标的风险',
      mitigation: '建议采取紧急措施加速营收',
    });
  }
  
  // 置信区间（基于风险数量）
  const riskFactor = Math.max(0.7, 1 - risks.length * 0.1);
  
  return {
    period: {
      start: now,
      end: endDate,
      label: `未来 ${data.daysRemaining} 天`,
    },
    predicted: {
      revenue: Math.round(finalPredictedRevenue),
      leads: Math.round(predictedLeads),
      conversions: predictedConversions,
      pipeline: data.pipelineValue,
    },
    target: {
      revenue: data.targetRevenue,
      leads: Math.round(data.targetRevenue / 50000), // 假设每线索5万
      conversions: Math.round(data.targetRevenue / 50000 * (avgConversion / 100)),
      pipeline: data.targetRevenue * 2, // Pipeline = 目标2倍
    },
    gap: {
      revenue: Math.round(data.targetRevenue - finalPredictedRevenue),
      leads: Math.round(data.targetRevenue / 50000 - predictedLeads),
      revenuePercent: Math.round(safeDiv(data.targetRevenue - finalPredictedRevenue, data.targetRevenue) * 100),
    },
    risks,
    confidence: {
      low: Math.round(finalPredictedRevenue * riskFactor * 0.9),
      mid: Math.round(finalPredictedRevenue * riskFactor),
      high: Math.round(finalPredictedRevenue * riskFactor * 1.1),
    },
  };
}

/**
 * 生成趋势分析
 */
export function generateTrendAnalysis(
  historical: Array<{ date: string; value: number }>,
  options: {
    comparePrevious?: Array<{ date: string; value: number }>;
    periodDays?: number;
  } = {}
): TrendAnalysis {
  if (historical.length < 2) {
    return {
      metric: '',
      period: '',
      yoy: 0,
      qoq: 0,
      mom: 0,
      direction: 'stable',
      velocity: 0,
      seasonality: 'low',
    };
  }
  
  const recent = historical.slice(-3);
  const older = historical.slice(-6, -3);
  
  // 计算趋势
  const recentAvg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
  const olderAvg = older.length > 0 
    ? older.reduce((sum, d) => sum + d.value, 0) / older.length 
    : recentAvg;
  
  const mom = olderAvg > 0 ? safeDiv(recentAvg - olderAvg, olderAvg) * 100 : 0;
  
  // 同比（假设有对比数据）
  let yoy = 0;
  if (options.comparePrevious && options.comparePrevious.length >= 3) {
    const prevRecent = options.comparePrevious.slice(-3);
    const prevAvg = prevRecent.reduce((sum, d) => sum + d.value, 0) / prevRecent.length;
    yoy = prevAvg > 0 ? safeDiv(recentAvg - prevAvg, prevAvg) * 100 : 0;
  }
  
  // 方向判断
  let direction: TrendAnalysis['direction'] = 'stable';
  let velocity = 0;
  
  if (mom > 5) {
    direction = 'accelerating';
    velocity = Math.min(100, mom);
  } else if (mom < -5) {
    direction = 'decelerating';
    velocity = Math.min(100, -mom);
  }
  
  // 季节性（简化版：检查月间波动）
  const values = historical.map(d => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const volatility = avg > 0 ? safeDiv(max - min, avg) : 0;
  
  const seasonality: TrendAnalysis['seasonality'] = 
    volatility > 0.5 ? 'high' : volatility > 0.2 ? 'medium' : 'low';
  
  return {
    metric: '',
    period: options.periodDays ? `${options.periodDays} 天` : '',
    yoy: Math.round(yoy * 10) / 10,
    qoq: Math.round(mom * 10) / 10,
    mom: Math.round(mom * 10) / 10,
    direction,
    velocity: Math.round(velocity),
    seasonality,
  };
}

// ===== 场景模拟 =====

export interface ForecastScenario {
  name: string;
  description: string;
  
  // 假设
  assumptions: {
    budgetChange?: number;       // 预算变化百分比
    leadsChange?: number;        // 线索变化百分比
    conversionChange?: number;   // 转化率变化
    pipelineChange?: number;     // Pipeline 变化
  };
  
  // 预测结果
  result: {
    revenue: number;
    leads: number;
    conversions: number;
    roi: number;
  };
  
  // 达成概率
  probability: number;
}

/**
 * 生成预测场景
 */
export function generateScenarios(
  baseline: {
    budget: number;
    revenue: number;
    leads: number;
    conversionRate: number;
    pipeline: number;
  },
  scenarios: Array<{
    name: string;
    description: string;
    assumptions: ForecastScenario['assumptions'];
  }>
): ForecastScenario[] {
  return scenarios.map(scenario => {
    const { assumptions } = scenario;
    
    const adjustedBudget = baseline.budget * (1 + (assumptions.budgetChange || 0) / 100);
    const adjustedLeads = baseline.leads * (1 + (assumptions.leadsChange || 0) / 100);
    const adjustedConversion = baseline.conversionRate * (1 + (assumptions.conversionChange || 0) / 100);
    const adjustedPipeline = baseline.pipeline * (1 + (assumptions.pipelineChange || 0) / 100);
    
    // 收入 = 转化数 × 客单价
    const avgDealValue = baseline.revenue / (baseline.leads * baseline.conversionRate / 100) || 50000;
    const conversions = adjustedLeads * (adjustedConversion / 100);
    const revenue = conversions * avgDealValue * 0.8; // 80% 成交率
    
    // ROI
    const roi = adjustedBudget > 0 
      ? safeDiv(revenue - adjustedBudget, adjustedBudget) * 100 
      : 0;
    
    // 达成概率（基于假设的合理性）
    let probability = 70;
    if (assumptions.budgetChange && Math.abs(assumptions.budgetChange) > 30) {
      probability -= 20;
    }
    if (assumptions.leadsChange && Math.abs(assumptions.leadsChange) > 50) {
      probability -= 15;
    }
    if (assumptions.conversionChange && Math.abs(assumptions.conversionChange) > 30) {
      probability -= 10;
    }
    
    return {
      ...scenario,
      result: {
        revenue: Math.round(revenue),
        leads: Math.round(adjustedLeads),
        conversions: Math.round(conversions),
        roi: Math.round(roi * 10) / 10,
      },
      probability: Math.max(10, Math.min(95, probability)),
    };
  });
}

// ===== 月度预测 =====

export interface MonthlyForecast {
  month: string;
  predicted: {
    revenue: number;
    leads: number;
    conversions: number;
    spend: number;
  };
  actual?: {
    revenue: number;
    leads: number;
    conversions: number;
    spend: number;
  };
  achievementRate?: number;
}

/**
 * 生成月度预测
 */
export function generateMonthlyForecast(
  currentMonthData: {
    revenue: number;
    leads: number;
    conversions: number;
    spend: number;
    daysElapsed: number;
    daysTotal: number;
  },
  historicalMonths: Array<{
    month: string;
    revenue: number;
    leads: number;
  }>,
  monthsAhead: number = 3
): MonthlyForecast[] {
  const forecasts: MonthlyForecast[] = [];
  
  // 当前月预测（基于时间进度）
  const currentMonthProgress = safeDiv(currentMonthData.daysElapsed, currentMonthData.daysTotal);
  const currentMonthPredicted = currentMonthData.revenue / currentMonthProgress;
  const currentMonthAchievement = Math.min(100, currentMonthProgress * 100);
  
  forecasts.push({
    month: '本月',
    predicted: {
      revenue: Math.round(currentMonthPredicted),
      leads: Math.round(currentMonthData.leads / currentMonthProgress),
      conversions: Math.round(currentMonthData.conversions / currentMonthProgress),
      spend: currentMonthData.spend,
    },
    actual: {
      revenue: currentMonthData.revenue,
      leads: currentMonthData.leads,
      conversions: currentMonthData.conversions,
      spend: currentMonthData.spend,
    },
    achievementRate: Math.round(currentMonthAchievement),
  });
  
  // 未来月预测
  const trend = historicalMonths.length >= 2
    ? safeDiv(
        historicalMonths[historicalMonths.length - 1].revenue - historicalMonths[0].revenue,
        historicalMonths[0].revenue
      ) * 100
    : 0;
  
  for (let i = 1; i <= monthsAhead; i++) {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() + i);
    const monthName = `${monthDate.getMonth() + 1}月`;
    
    // 趋势外推
    const growthRate = Math.pow(1 + trend / 100, i / 12);
    const predictedRevenue = currentMonthPredicted * growthRate;
    
    forecasts.push({
      month: monthName,
      predicted: {
        revenue: Math.round(predictedRevenue),
        leads: Math.round(currentMonthData.leads * growthRate),
        conversions: Math.round(currentMonthData.conversions * growthRate),
        spend: currentMonthData.spend,
      },
    });
  }
  
  return forecasts;
}
