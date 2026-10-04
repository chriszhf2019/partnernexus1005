/**
 * Budget Allocation Engine - 预算分配引擎
 * 
 * 核心功能：
 * 1. 分析各活动 ROI，确定优化方向
 * 2. 建议预算调整（增投/削减/保持）
 * 3. 预算模拟：预测调整后的效果
 * 
 * 解决的问题："钱应该投哪里？"
 */

import { safeDiv, clamp } from '../metricEngine/safeMath';

// ===== 预算分配类型 =====

export type BudgetAction = 'increase' | 'decrease' | 'maintain' | 'experiment';

export interface ActivityBudget {
  id: string;
  name: string;
  type: string;
  region?: string;
  
  // 财务数据
  budget: number;        // 当前预算
  spent: number;        // 已花费
  revenue: number;       // 带来的收入
  leads: number;         // 线索数
  conversions: number;   // 转化数
  
  // 计算指标
  roi: number;           // ROI = (收入-支出)/支出
  cac: number;           // 获客成本 = 支出/线索
  ltv: number;           // 客户终身价值
  roas: number;          // 广告支出回报率
  
  // 趋势
  trend: 'up' | 'down' | 'stable';
  trendValue: number;    // 趋势变化百分比
}

export interface BudgetAllocation {
  activityId: string;
  activityName: string;
  
  currentBudget: number;
  suggestedBudget: number;
  adjustment: number;     // 调整金额
  adjustmentPercent: number; // 调整百分比
  
  action: BudgetAction;
  
  reason: string;
  expectedImpact: {
    revenueChange: number;
    leadsChange: number;
    roiChange: number;
  };
  
  confidence: number;     // 置信度 0-100
}

export interface BudgetOptimizationResult {
  totalBudget: number;
  optimizedBudget: number;
  
  // 优化摘要
  increaseActivities: BudgetAllocation[];
  decreaseActivities: BudgetAllocation[];
  maintainActivities: BudgetAllocation[];
  experimentActivities: BudgetAllocation[];
  
  // 预计效果
  projectedRevenue: number;
  projectedLeads: number;
  projectedROI: number;
  
  // 改进空间
  currentROI: number;
  optimizedROI: number;
  roiImprovement: number;
  
  // 风险提示
  warnings: string[];
}

// ===== ROI 分级阈值 =====

const ROI_THRESHOLDS = {
  HIGH: 50,      // ROI > 50% 高回报
  MEDIUM: 20,   // ROI > 20% 中等回报
  LOW: 0,       // ROI > 0% 低回报
  NEGATIVE: 0,  // ROI < 0% 亏损
};

// ===== 核心算法 =====

/**
 * 计算活动的基本指标
 */
export function calculateActivityMetrics(activity: {
  id?: string;
  name?: string;
  type?: string;
  budget: number;
  spent: number;
  revenue: number;
  leads: number;
  conversions: number;
  previousRevenue?: number;
  previousLeads?: number;
}): ActivityBudget {
  const roi = activity.spent > 0 
    ? safeDiv((activity.revenue - activity.spent), activity.spent) * 100 
    : 0;
  
  const cac = activity.leads > 0 
    ? safeDiv(activity.spent, activity.leads) 
    : 0;
  
  // 计算趋势（如果有历史数据）
  let trend: 'up' | 'down' | 'stable' = 'stable';
  let trendValue = 0;
  
  if (activity.previousRevenue && activity.previousRevenue > 0) {
    trendValue = safeDiv((activity.revenue - activity.previousRevenue), activity.previousRevenue) * 100;
    if (trendValue > 5) trend = 'up';
    else if (trendValue < -5) trend = 'down';
  }
  
  return {
    id: activity.id || `activity-${Date.now()}`,
    name: activity.name || 'Unknown',
    type: activity.type || 'General',
    budget: activity.budget,
    spent: activity.spent,
    revenue: activity.revenue,
    leads: activity.leads,
    conversions: activity.conversions,
    roi: Math.round(roi * 10) / 10,
    cac: Math.round(cac),
    ltv: activity.conversions > 0 ? Math.round(safeDiv(activity.revenue, activity.conversions)) : 0,
    roas: activity.spent > 0 ? safeDiv(activity.revenue, activity.spent) : 0,
    trend,
    trendValue: Math.round(trendValue * 10) / 10,
  };
}

/**
 * 判断预算调整方向
 */
export function determineBudgetAction(
  activity: ActivityBudget,
  options: {
    minExperimentThreshold?: number;
    maxIncreaseThreshold?: number;
  } = {}
): BudgetAction {
  const { minExperimentThreshold = 10, maxIncreaseThreshold = 40 } = options;
  
  // 高ROI活动 → 增投
  if (activity.roi >= maxIncreaseThreshold && activity.trend !== 'down') {
    return 'increase';
  }
  
  // 中等ROI且趋势上升 → 保持
  if (activity.roi >= ROI_THRESHOLDS.MEDIUM && activity.trend === 'up') {
    return 'maintain';
  }
  
  // 低ROI活动 → 削减
  if (activity.roi < ROI_THRESHOLDS.MEDIUM || activity.trend === 'down') {
    return 'decrease';
  }
  
  // 无数据活动 → 实验
  if (activity.leads === 0 || activity.spent === 0) {
    return 'experiment';
  }
  
  return 'maintain';
}

/**
 * 计算建议的预算调整
 */
export function calculateBudgetAdjustment(
  activity: ActivityBudget,
  action: BudgetAction,
  options: {
    increasePercent?: number;
    decreasePercent?: number;
  } = {}
): { suggestedBudget: number; adjustment: number; adjustmentPercent: number } {
  const { increasePercent = 20, decreasePercent = 30 } = options;
  
  let suggestedBudget = activity.budget;
  let adjustmentPercent = 0;
  
  switch (action) {
    case 'increase':
      suggestedBudget = activity.budget * (1 + increasePercent / 100);
      adjustmentPercent = increasePercent;
      break;
    case 'decrease':
      suggestedBudget = activity.budget * (1 - decreasePercent / 100);
      adjustmentPercent = -decreasePercent;
      break;
    case 'maintain':
      suggestedBudget = activity.budget;
      adjustmentPercent = 0;
      break;
    case 'experiment':
      // 实验预算：小量尝试
      suggestedBudget = activity.budget * 0.5;
      adjustmentPercent = -50;
      break;
  }
  
  const adjustment = suggestedBudget - activity.budget;
  
  return {
    suggestedBudget: Math.round(suggestedBudget),
    adjustment: Math.round(adjustment),
    adjustmentPercent: Math.round(adjustmentPercent),
  };
}

/**
 * 预算优化引擎主函数
 */
export function optimizeBudgetAllocation(
  activities: ActivityBudget[],
  totalBudget: number,
  options: {
    increasePercent?: number;
    decreasePercent?: number;
    targetROI?: number;
  } = {}
): BudgetOptimizationResult {
  const {
    increasePercent = 20,
    decreasePercent = 30,
    targetROI = 30,
  } = options;
  
  const allocations: BudgetAllocation[] = [];
  let optimizedBudget = 0;
  
  // 分类处理每个活动
  for (const activity of activities) {
    const action = determineBudgetAction(activity);
    const { suggestedBudget, adjustment, adjustmentPercent } = calculateBudgetAdjustment(
      activity,
      action,
      { increasePercent, decreasePercent }
    );
    
    // 计算预计影响
    const roiMultiplier = action === 'increase' ? 1 + (increasePercent / 100) * 0.5 :
                         action === 'decrease' ? 1 - (decreasePercent / 100) * 0.3 :
                         1;
    
    const expectedImpact = {
      revenueChange: Math.round(activity.revenue * (roiMultiplier - 1)),
      leadsChange: Math.round(activity.leads * (roiMultiplier - 1) * 0.8),
      roiChange: Math.round((activity.roi * roiMultiplier - activity.roi) * 10) / 10,
    };
    
    // 生成调整原因
    let reason = '';
    switch (action) {
      case 'increase':
        reason = `ROI ${activity.roi}% 优秀${activity.trend === 'up' ? '，趋势上升' : ''}，建议增投扩大效果`;
        break;
      case 'decrease':
        reason = `ROI ${activity.roi}% 偏低${activity.trend === 'down' ? '，趋势下降' : ''}，建议削减预算`;
        break;
      case 'maintain':
        reason = `ROI ${activity.roi}% 稳定，保持现有投入`;
        break;
      case 'experiment':
        reason = '缺乏数据支撑，建议小量实验验证效果';
        break;
    }
    
    allocations.push({
      activityId: activity.id,
      activityName: activity.name,
      currentBudget: activity.budget,
      suggestedBudget,
      adjustment,
      adjustmentPercent,
      action,
      reason,
      expectedImpact,
      confidence: activity.leads > 10 ? 90 : activity.leads > 0 ? 70 : 50,
    });
    
    optimizedBudget += suggestedBudget;
  }
  
  // 分类
  const increaseActivities = allocations.filter(a => a.action === 'increase');
  const decreaseActivities = allocations.filter(a => a.action === 'decrease');
  const maintainActivities = allocations.filter(a => a.action === 'maintain');
  const experimentActivities = allocations.filter(a => a.action === 'experiment');
  
  // 计算当前和预计总效果
  const currentRevenue = activities.reduce((sum, a) => sum + a.revenue, 0);
  const currentLeads = activities.reduce((sum, a) => sum + a.leads, 0);
  const currentROI = totalBudget > 0 ? safeDiv((currentRevenue - totalBudget), totalBudget) * 100 : 0;
  
  const projectedRevenue = currentRevenue + allocations.reduce((sum, a) => sum + a.expectedImpact.revenueChange, 0);
  const projectedLeads = currentLeads + allocations.reduce((sum, a) => sum + a.expectedImpact.leadsChange, 0);
  const projectedROI = optimizedBudget > 0 ? safeDiv((projectedRevenue - optimizedBudget), optimizedBudget) * 100 : 0;
  
  // 生成警告
  const warnings: string[] = [];
  if (projectedROI < targetROI) {
    warnings.push(`预计 ROI ${projectedROI.toFixed(1)}% 未达到目标 ${targetROI}%`);
  }
  if (decreaseActivities.length > activities.length * 0.5) {
    warnings.push('过多活动被建议削减，可能影响市场覆盖');
  }
  if (experimentActivities.length > activities.length * 0.3) {
    warnings.push('存在较多实验性活动，效果存在不确定性');
  }
  
  return {
    totalBudget,
    optimizedBudget: Math.round(optimizedBudget),
    increaseActivities,
    decreaseActivities,
    maintainActivities,
    experimentActivities,
    projectedRevenue: Math.round(projectedRevenue),
    projectedLeads: Math.round(projectedLeads),
    projectedROI: Math.round(projectedROI * 10) / 10,
    currentROI: Math.round(currentROI * 10) / 10,
    optimizedROI: Math.round(projectedROI * 10) / 10,
    roiImprovement: Math.round((projectedROI - currentROI) * 10) / 10,
    warnings,
  };
}

// ===== 预算模拟器 =====

export interface BudgetScenario {
  name: string;
  adjustments: Record<string, number>; // activityId -> 调整百分比
}

export interface BudgetSimulationResult {
  scenario: BudgetScenario;
  baseline: {
    totalBudget: number;
    totalRevenue: number;
    totalLeads: number;
    roi: number;
  };
  projected: {
    totalBudget: number;
    totalRevenue: number;
    totalLeads: number;
    roi: number;
  };
  delta: {
    budget: number;
    revenue: number;
    leads: number;
    roi: number;
  };
}

/**
 * 模拟预算调整场景
 */
export function simulateBudgetScenario(
  activities: ActivityBudget[],
  scenario: BudgetScenario
): BudgetSimulationResult {
  const baseline = {
    totalBudget: activities.reduce((sum, a) => sum + a.budget, 0),
    totalRevenue: activities.reduce((sum, a) => sum + a.revenue, 0),
    totalLeads: activities.reduce((sum, a) => sum + a.leads, 0),
    roi: 0,
  };
  baseline.roi = baseline.totalBudget > 0 
    ? safeDiv((baseline.totalRevenue - baseline.totalBudget), baseline.totalBudget) * 100 
    : 0;
  
  let projectedBudget = 0;
  let projectedRevenue = 0;
  let projectedLeads = 0;
  
  for (const activity of activities) {
    const adjustment = scenario.adjustments[activity.id] || 0;
    const newBudget = activity.budget * (1 + adjustment / 100);
    
    projectedBudget += newBudget;
    // 假设收入与预算成正比，弹性系数 0.8
    projectedRevenue += activity.revenue * (1 + adjustment / 100 * 0.8);
    // 线索也随预算调整
    projectedLeads += activity.leads * (1 + adjustment / 100 * 0.6);
  }
  
  const projectedROI = projectedBudget > 0 
    ? safeDiv((projectedRevenue - projectedBudget), projectedBudget) * 100 
    : 0;
  
  return {
    scenario,
    baseline,
    projected: {
      totalBudget: Math.round(projectedBudget),
      totalRevenue: Math.round(projectedRevenue),
      totalLeads: Math.round(projectedLeads),
      roi: Math.round(projectedROI * 10) / 10,
    },
    delta: {
      budget: Math.round(projectedBudget - baseline.totalBudget),
      revenue: Math.round(projectedRevenue - baseline.totalRevenue),
      leads: Math.round(projectedLeads - baseline.totalLeads),
      roi: Math.round((projectedROI - baseline.roi) * 10) / 10,
    },
  };
}

// ===== ROI 热力图数据 =====

export interface ROIHeatmapCell {
  row: string;
  col: string;
  roi: number;
  budget: number;
  leads: number;
  count: number;
}

export interface ROIHeatmapData {
  rows: string[];
  cols: string[];
  cells: ROIHeatmapCell[][];
  insights: {
    bestCombination: { row: string; col: string; roi: number };
    worstCombination: { row: string; col: string; roi: number };
    recommendations: string[];
  };
}

/**
 * 生成 ROI 热力图数据
 */
export function generateROIHeatmap(
  activities: ActivityBudget[]
): ROIHeatmapData {
  // 按区域和类型分组
  const regions = [...new Set(activities.map(a => a.region || '其他'))];
  const types = [...new Set(activities.map(a => a.type))];
  
  // 计算每个组合的指标
  const matrix: Map<string, ActivityBudget[]> = new Map();
  
  for (const activity of activities) {
    const key = `${activity.region || '其他'}-${activity.type}`;
    if (!matrix.has(key)) {
      matrix.set(key, []);
    }
    matrix.get(key)!.push(activity);
  }
  
  // 生成单元格
  const cells: ROIHeatmapCell[][] = [];
  
  for (const region of regions) {
    const row: ROIHeatmapCell[] = [];
    for (const type of types) {
      const key = `${region}-${type}`;
      const group = matrix.get(key) || [];
      
      const totalBudget = group.reduce((sum, a) => sum + a.budget, 0);
      const totalRevenue = group.reduce((sum, a) => sum + a.revenue, 0);
      const totalLeads = group.reduce((sum, a) => sum + a.leads, 0);
      const avgROI = totalBudget > 0 
        ? safeDiv((totalRevenue - totalBudget), totalBudget) * 100 
        : 0;
      
      row.push({
        row: region,
        col: type,
        roi: Math.round(avgROI * 10) / 10,
        budget: totalBudget,
        leads: totalLeads,
        count: group.length,
      });
    }
    cells.push(row);
  }
  
  // 找出最佳和最差组合
  let bestCombination = { row: regions[0], col: types[0], roi: 0 };
  let worstCombination = { row: regions[0], col: types[0], roi: 100 };
  const recommendations: string[] = [];
  
  for (const row of cells) {
    for (const cell of row) {
      if (cell.count > 0) {
        if (cell.roi > bestCombination.roi) {
          bestCombination = cell;
        }
        if (cell.roi < worstCombination.roi) {
          worstCombination = cell;
        }
      }
    }
  }
  
  // 生成建议
  if (bestCombination.roi > 0) {
    recommendations.push(`${bestCombination.row}+${bestCombination.col} 组合效果最佳，建议增投`);
  }
  if (worstCombination.roi < 0) {
    recommendations.push(`${worstCombination.row}+${worstCombination.col} 组合亏损，建议削减或优化策略`);
  }
  
  return {
    rows: regions,
    cols: types,
    cells,
    insights: {
      bestCombination,
      worstCombination,
      recommendations,
    },
  };
}
