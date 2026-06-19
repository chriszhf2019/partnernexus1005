// 商机指标实时计算工具
// 基于真实数据计算daysInCurrentStage、isStagnant等动态指标

import type { Deal, DealLifecycleStage } from '../types';

// 阶段停滞阈值（天）
export const STAGNATION_THRESHOLDS: Record<string, number> = {
  'Registered': 14,    // 报备后14天未推进视为停滞
  'UnderReview': 3,   // 审核超过3天
  'Approved': 30,     // 批复后30天未进入方案
  'Solution': 45,     // 方案阶段45天
  'Commercial': 30,   // 商务谈判30天
  'ClosedWon': 0,
  'ClosedLost': 0,
};

// 阶段转化概率（默认）
export const DEFAULT_STAGE_PROBABILITIES: Record<string, number> = {
  'Registered': 30,
  'UnderReview': 50,
  'Approved': 60,
  'Solution': 70,
  'Commercial': 85,
  'ClosedWon': 100,
  'ClosedLost': 0,
};

/**
 * 计算两个日期之间的天数差
 */
function daysBetween(date1: string | Date, date2: string | Date = new Date()): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 获取商机的最后活动日期
 * 优先级：lastActivityDate > lifecycle最后一条 > createdDate
 */
export function getLastActivityDate(deal: Deal): string {
  if (deal.lastActivityDate) return deal.lastActivityDate;
  
  const lifecycle = deal.lifecycle || [];
  if (lifecycle.length > 0) {
    const last = lifecycle[lifecycle.length - 1];
    if (last.date) return last.date;
  }
  
  return deal.createdDate || new Date().toISOString().split('T')[0];
}

/**
 * 获取商机的当前阶段开始时间
 * 从lifecycle中查找当前阶段的开始时间
 */
export function getStageEnteredAt(deal: Deal): string {
  const lifecycle = deal.lifecycle || [];
  
  // 从后往前找当前阶段的开始
  for (let i = lifecycle.length - 1; i >= 0; i--) {
    const event = lifecycle[i];
    if (event.stage === deal.stage && event.date) {
      return event.date;
    }
  }
  
  // 没找到则用最后活动日期
  return getLastActivityDate(deal);
}

/**
 * 计算商机在当前阶段停留的天数
 */
export function calculateDaysInCurrentStage(deal: Deal): number {
  const stageEnteredAt = getStageEnteredAt(deal);
  return daysBetween(stageEnteredAt);
}

/**
 * 判断商机是否停滞
 */
export function calculateIsStagnant(deal: Deal): boolean {
  if (['ClosedWon', 'ClosedLost'].includes(deal.stage)) return false;
  
  const days = calculateDaysInCurrentStage(deal);
  const threshold = STAGNATION_THRESHOLDS[deal.stage] || 30;
  return days > threshold;
}

/**
 * 增强商机对象，添加实时计算的指标
 */
export function enrichDealWithMetrics(deal: Deal): Deal {
  const winProbability = calculateDealWinProbability(deal);
  const value = deal.value || 0;
  return {
    ...deal,
    daysInCurrentStage: calculateDaysInCurrentStage(deal),
    isStagnant: calculateIsStagnant(deal),
    stageEnteredAt: getStageEnteredAt(deal),
    winProbability,
    weightedValue: Math.round(value * winProbability),
  };
}

/**
 * 获取阶段配置表（用于UI渲染）
 */
export function getDefaultProbabilityConfig(): Record<string, { probability: number; label: string }> {
  const labels: Record<string, string> = {
    'Registered': '已报备',
    'UnderReview': '审批中',
    'Approved': '已批复',
    'Solution': '方案跟进',
    'Commercial': '商务洽谈',
    'ClosedWon': '赢单',
    'ClosedLost': '丢单',
  };
  const config: Record<string, { probability: number; label: string }> = {};
  Object.keys(DEFAULT_STAGE_PROBABILITIES).forEach(stage => {
    config[stage] = {
      probability: DEFAULT_STAGE_PROBABILITIES[stage] / 100,
      label: labels[stage] || stage,
    };
  });
  return config;
}

/**
 * 批量增强商机数据
 */
export function enrichDealsWithMetrics(deals: Deal[]): Deal[] {
  return deals.map(enrichDealWithMetrics);
}

/**
 * 计算商机综合赢率（基于阶段转化概率）
 */
export function calculateDealWinProbability(deal: Deal): number {
  return (DEFAULT_STAGE_PROBABILITIES[deal.stage] || 0) / 100;
}

/**
 * 计算加权金额
 */
export function calculateWeightedValue(deal: Deal): number {
  const probability = calculateDealWinProbability(deal);
  return Math.round((deal.value || 0) * probability);
}

/**
 * 判断商机是否已赢单
 */
export function isDealWon(deal: Deal): boolean {
  return deal.stage === 'ClosedWon' || deal.status === 'Converted';
}

/**
 * 判断商机是否活跃
 */
export function isActiveDeal(deal: Deal): boolean {
  return !['ClosedWon', 'ClosedLost'].includes(deal.stage);
}

/**
 * 计算平均销售周期（基于已结单商机）
 */
export function calculateAvgSalesCycle(deals: Deal[]): number {
  const wonDeals = deals.filter(d => 
    d.stage === 'ClosedWon' && d.actualCloseDate && d.createdDate
  );
  
  if (wonDeals.length === 0) {
    // 无已结单数据，返回活跃商机的平均进度天数
    const activeDeals = deals.filter(d => isActiveDeal(d) && d.createdDate);
    if (activeDeals.length === 0) return 0;
    
    const totalDays = activeDeals.reduce((sum, d) => 
      sum + daysBetween(d.createdDate), 0);
    return Math.round(totalDays / activeDeals.length);
  }
  
  const totalDays = wonDeals.reduce((sum, d) => 
    sum + daysBetween(d.createdDate, d.actualCloseDate!), 0);
  
  return Math.round(totalDays / wonDeals.length);
}

/**
 * 计算商机老化率（活跃商机中停滞的占比）
 */
export function calculateStagnationRate(deals: Deal[]): number {
  const activeDeals = deals.filter(d => isActiveDeal(d));
  if (activeDeals.length === 0) return 0;
  
  const stagnantCount = activeDeals.filter(d => calculateIsStagnant(d)).length;
  return Math.round((stagnantCount / activeDeals.length) * 100);
}

/**
 * 计算推进效率（活跃商机中非停滞的占比）
 */
export function calculatePushEfficiency(deals: Deal[]): number {
  const activeDeals = deals.filter(d => isActiveDeal(d));
  if (activeDeals.length === 0) return 0;
  
  const progressing = activeDeals.filter(d => !calculateIsStagnant(d)).length;
  return Math.round((progressing / activeDeals.length) * 100);
}

/**
 * 计算阶段停留时长分析
 */
export function calculateStageDuration(deals: Deal[], stages: string[]): {
  stage: string;
  avgDays: number;
  overdueCount: number;
  totalCount: number;
}[] {
  return stages.map(stage => {
    const stageDeals = deals.filter(d => d.stage === stage);
    const totalCount = stageDeals.length;
    
    if (totalCount === 0) {
      return { stage, avgDays: 0, overdueCount: 0, totalCount: 0 };
    }
    
    const totalDays = stageDeals.reduce((sum, d) => 
      sum + calculateDaysInCurrentStage(d), 0);
    const avgDays = Math.round(totalDays / totalCount);
    
    const overdueCount = stageDeals.filter(d => calculateIsStagnant(d)).length;
    
    return { stage, avgDays, overdueCount, totalCount };
  });
}

/**
 * 计算综合赢率（近30天）
 */
export function calculateWinRate30d(deals: Deal[]): number {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentClosed = deals.filter(d => 
    d.stage === 'ClosedWon' && 
    d.actualCloseDate && 
    new Date(d.actualCloseDate) >= thirtyDaysAgo
  );
  
  const recentTotal = deals.filter(d => 
    (d.stage === 'ClosedWon' || d.stage === 'ClosedLost') && 
    d.actualCloseDate && 
    new Date(d.actualCloseDate) >= thirtyDaysAgo
  );
  
  if (recentTotal.length === 0) {
    // 无近30天结单数据，使用历史所有数据
    const allWon = deals.filter(d => d.stage === 'ClosedWon').length;
    const allClosed = deals.filter(d => 
      d.stage === 'ClosedWon' || d.stage === 'ClosedLost'
    ).length;
    if (allClosed === 0) return 0;
    return Math.round((allWon / allClosed) * 100);
  }
  
  return Math.round((recentClosed.length / recentTotal.length) * 100);
}
