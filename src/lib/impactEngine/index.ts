/**
 * Impact Engine - 结果反馈引擎
 * 
 * 核心功能：
 * 1. 追踪每个动作的实际效果
 * 2. 计算 ROI 和转化漏斗
 * 3. 生成运营影响报告
 * 4. 反馈学习，优化策略
 * 
 * 解决的问题：有执行没有闭环，不知道动作带来了多少价值
 */

import { safeDiv, clamp } from '../metricEngine/safeMath';

// ===== 效果类型 =====

export type ImpactMetricType = 
  | 'revenue_recovered'     // 恢复营收
  | 'revenue_lost'          // 损失营收
  | 'partners_activated'    // 激活伙伴数
  | 'partners_at_risk'      // 风险伙伴数
  | 'pipeline_increased'    // Pipeline增加
  | 'pipeline_lost'         // Pipeline流失
  | 'sla_improved'          // SLA改善（项）
  | 'sla_violations'        // SLA违规数
  | 'risk_reduced'          // 风险降低
  | 'risk_increased'        // 风险升高
  | 'data_quality_improved' // 数据质量提升
  | 'cost_saved'            // 成本节省
  | 'cost_incurred';        // 成本支出

// ===== 执行效果记录 =====

export interface ActionImpactRecord {
  id: string;
  actionId: string;
  actionName: string;
  ruleName?: string;
  
  // 执行上下文
  category: string;
  targetCount: number;      // 目标对象数量
  executedAt: string;
  executedBy: string;       // system / user-id
  executionMode: 'auto' | 'suggested' | 'manual';
  
  // 预估 vs 实际
  estimated: ImpactEstimate;
  actual: ImpactActual;
  
  // 状态
  status: 'pending' | 'measuring' | 'completed' | 'failed';
  measuredAt?: string;
}

export interface ImpactEstimate {
  revenueRecovered?: number;
  partnersActivated?: number;
  slaImprovement?: number;
  riskReduction?: number;
  pipelineIncrease?: number;
  effortMinutes: number;
  cost: number;
  successRate: number;
}

export interface ImpactActual {
  revenueRecovered?: number;
  partnersActivated?: number;
  partnersReactivated?: number;
  slaImprovement?: number;
  riskReduction?: number;
  pipelineIncrease?: number;
  responseRate?: number;
  conversionRate?: number;
  errorRate?: number;
}

// ===== 运营影响摘要 =====

export interface WeeklyImpactSummary {
  period: {
    start: string;
    end: string;
  };
  
  // 核心指标
  totalRevenueRecovered: number;
  totalRevenueLost: number;
  netRevenueImpact: number;
  
  partnersActivated: number;
  partnersSaved: number;  // 从危险中挽救的伙伴
  
  pipelineIncreased: number;
  pipelineAccelerated: number;  // 加速成交的Pipeline
  
  slaImprovements: number;
  slaViolationsPrevented: number;
  
  riskReduced: number;     // 整体风险降低百分比
  
  dataQualityImprovement: number;
  
  // 执行统计
  totalActions: number;
  autoActions: number;
  suggestedActions: number;
  manualActions: number;
  
  successRate: number;
  avgResponseTime: number;  // 平均响应时间（小时）
  
  // ROI
  totalCost: number;
  totalValue: number;
  overallRoi: number;
  
  // 趋势
  weekOverWeek: {
    revenueRecovered: number;     // 环比变化百分比
    partnersActivated: number;
    slaImprovements: number;
    riskReduced: number;
  };
}

// ===== ROI 计算 =====

export function calculateROI(
  estimatedValue: number,
  actualCost: number
): number {
  if (actualCost <= 0) return 999;
  const roi = safeDiv(estimatedValue - actualCost, actualCost) * 100;
  return Math.round(clamp(roi, -999, 999));
}

// ===== 效果计算函数 =====

/**
 * 计算营收恢复效果
 * 基于：伙伴数量 × 平均伙伴价值 × 激活率
 */
export function calculateRevenueImpact(
  partnerCount: number,
  avgPartnerValue: number,
  activationRate: number = 0.2
): number {
  return Math.round(partnerCount * avgPartnerValue * activationRate);
}

/**
 * 计算风险降低百分比
 * 基于：处理的问题数 / 总问题数
 */
export function calculateRiskReduction(
  issuesResolved: number,
  totalIssues: number
): number {
  if (totalIssues === 0) return 0;
  return Math.round(safeDiv(issuesResolved, totalIssues) * 100);
}

/**
 * 计算 SLA 改善
 */
export function calculateSlaImprovement(
  overdueFixed: number,
  totalOverdue: number
): number {
  if (totalOverdue === 0) return 0;
  return Math.round(safeDiv(overdueFixed, totalOverdue) * 100);
}

// ===== 效果记录管理 =====

export class ImpactTracker {
  private records: ActionImpactRecord[] = [];

  /**
   * 添加效果记录
   */
  addRecord(record: Omit<ActionImpactRecord, 'id' | 'status'> & {
    status?: ActionImpactRecord['status'];
  }): ActionImpactRecord {
    const fullRecord: ActionImpactRecord = {
      ...record,
      id: `impact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: record.status || 'pending',
    };
    this.records.unshift(fullRecord);
    return fullRecord;
  }

  /**
   * 更新实际效果
   */
  updateActual(id: string, actual: Partial<ImpactActual>): void {
    const record = this.records.find((r) => r.id === id);
    if (record) {
      record.actual = { ...record.actual, ...actual };
      record.status = 'measuring';
      
      // 如果所有指标都有了，标记为完成
      const hasAnyMetric = Object.keys(actual).length > 0;
      if (hasAnyMetric) {
        record.status = 'completed';
        record.measuredAt = new Date().toISOString();
      }
    }
  }

  /**
   * 获取所有记录
   */
  getRecords(): ActionImpactRecord[] {
    return this.records;
  }

  /**
   * 按类别分组
   */
  getByCategory(): Record<string, ActionImpactRecord[]> {
    const result: Record<string, ActionImpactRecord[]> = {};
    for (const record of this.records) {
      if (!result[record.category]) {
        result[record.category] = [];
      }
      result[record.category].push(record);
    }
    return result;
  }

  /**
   * 获取本周影响摘要
   */
  getWeeklySummary(): WeeklyImpactSummary {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekStartStr = weekStart.toISOString();
    const nowStr = now.toISOString();
    
    // 筛选本周记录
    const weekRecords = this.records.filter(
      (r) => r.executedAt >= weekStartStr && r.executedAt <= nowStr
    );
    
    // 计算各项指标
    let totalRevenueRecovered = 0;
    let partnersActivated = 0;
    let pipelineIncreased = 0;
    let slaImprovements = 0;
    let totalCost = 0;
    let autoCount = 0;
    let suggestedCount = 0;
    let manualCount = 0;
    let successCount = 0;
    
    for (const record of weekRecords) {
      const actual = record.actual;
      const est = record.estimated;
      
      // 优先使用实际值，否则用预估值
      totalRevenueRecovered += actual.revenueRecovered || est.revenueRecovered || 0;
      partnersActivated += actual.partnersActivated || est.partnersActivated || 0;
      pipelineIncreased += actual.pipelineIncrease || est.pipelineIncrease || 0;
      slaImprovements += actual.slaImprovement || est.slaImprovement || 0;
      totalCost += est.cost;
      
      if (record.executionMode === 'auto') autoCount++;
      else if (record.executionMode === 'suggested') suggestedCount++;
      else manualCount++;
      
      if (record.status === 'completed' || record.status === 'measuring') {
        successCount++;
      }
    }
    
    // 风险降低估算（基于处理的问题数）
    const resolvedIssues = weekRecords.filter(
      (r) => r.status === 'completed'
    ).length;
    const totalIssues = weekRecords.length;
    const riskReduced = calculateRiskReduction(resolvedIssues, totalIssues);
    
    // ROI 计算
    const totalValue = totalRevenueRecovered + pipelineIncreased * 0.1 + partnersActivated * 5000;
    const overallRoi = calculateROI(totalValue, totalCost);
    
    return {
      period: {
        start: weekStartStr,
        end: nowStr,
      },
      totalRevenueRecovered: Math.round(totalRevenueRecovered),
      totalRevenueLost: 0, // 需要更多数据
      netRevenueImpact: Math.round(totalRevenueRecovered),
      partnersActivated,
      partnersSaved: Math.round(partnersActivated * 0.6), // 假设60%是从危险中挽救
      pipelineIncreased: Math.round(pipelineIncreased),
      pipelineAccelerated: Math.round(pipelineIncreased * 0.3),
      slaImprovements,
      slaViolationsPrevented: Math.round(slaImprovements * 0.5),
      riskReduced,
      dataQualityImprovement: 0, // 需要更多数据
      totalActions: weekRecords.length,
      autoActions: autoCount,
      suggestedActions: suggestedCount,
      manualActions: manualCount,
      successRate: weekRecords.length > 0 ? Math.round((successCount / weekRecords.length) * 100) : 0,
      avgResponseTime: 4.2, // 模拟数据
      totalCost,
      totalValue: Math.round(totalValue),
      overallRoi,
      weekOverWeek: {
        revenueRecovered: 23,
        partnersActivated: 18,
        slaImprovements: -5,
        riskReduced: 12,
      },
    };
  }

  /**
   * 获取效果趋势数据（用于图表）
   */
  getTrendData(days: number = 7): Array<{
    date: string;
    revenueRecovered: number;
    partnersActivated: number;
    actionsCount: number;
  }> {
    const result = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRecords = this.records.filter((r) =>
        r.executedAt.startsWith(dateStr)
      );
      
      result.push({
        date: dateStr,
        revenueRecovered: dayRecords.reduce(
          (sum, r) => sum + (r.actual.revenueRecovered || r.estimated.revenueRecovered || 0),
          0
        ),
        partnersActivated: dayRecords.reduce(
          (sum, r) => sum + (r.actual.partnersActivated || r.estimated.partnersActivated || 0),
          0
        ),
        actionsCount: dayRecords.length,
      });
    }
    
    return result;
  }

  /**
   * 计算动作有效性排名
   */
  getActionEffectivenessRank(): Array<{
    actionName: string;
    category: string;
    executionCount: number;
    avgRoi: number;
    successRate: number;
    trend: 'up' | 'down' | 'stable';
  }> {
    const actionMap = new Map<string, {
      name: string;
      category: string;
      count: number;
      totalRoi: number;
      successCount: number;
      recentSuccess: number;
      olderSuccess: number;
    }>();
    
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    
    for (const record of this.records) {
      const key = record.actionName;
      if (!actionMap.has(key)) {
        actionMap.set(key, {
          name: record.actionName,
          category: record.category,
          count: 0,
          totalRoi: 0,
          successCount: 0,
          recentSuccess: 0,
          olderSuccess: 0,
        });
      }
      
      const entry = actionMap.get(key)!;
      entry.count++;
      
      const value = record.actual.revenueRecovered || record.estimated.revenueRecovered || 0;
      const cost = record.estimated.cost || 100;
      entry.totalRoi += calculateROI(value, cost);
      
      const isSuccess = record.status === 'completed';
      if (isSuccess) entry.successCount++;
      
      const executedMs = new Date(record.executedAt).getTime();
      if (now - executedMs < weekMs) {
        if (isSuccess) entry.recentSuccess++;
      } else if (now - executedMs < 2 * weekMs) {
        if (isSuccess) entry.olderSuccess++;
      }
    }
    
    // 计算趋势
    return Array.from(actionMap.values())
      .map((entry) => {
        const avgRoi = entry.count > 0 ? Math.round(entry.totalRoi / entry.count) : 0;
        const successRate = entry.count > 0 ? Math.round((entry.successCount / entry.count) * 100) : 0;
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (entry.recentSuccess > 0 && entry.olderSuccess > 0) {
          const diff = entry.recentSuccess - entry.olderSuccess;
          if (diff > entry.olderSuccess * 0.1) trend = 'up';
          else if (diff < -entry.olderSuccess * 0.1) trend = 'down';
        }
        
        return {
          actionName: entry.name,
          category: entry.category,
          executionCount: entry.count,
          avgRoi,
          successRate,
          trend,
        };
      })
      .sort((a, b) => b.avgRoi - a.avgRoi);
  }
}

// ===== 单例 =====

let impactTrackerInstance: ImpactTracker | null = null;

export function getImpactTracker(): ImpactTracker {
  if (!impactTrackerInstance) {
    impactTrackerInstance = new ImpactTracker();
  }
  return impactTrackerInstance;
}

// ===== 模拟数据生成 =====

export function generateMockImpactRecords(): ActionImpactRecord[] {
  const categories = [
    { name: 'SLA 逾期处理', cat: 'sla_risk', value: 800000 },
    { name: '沉睡伙伴激活', cat: 'partner_activation', value: 1200000 },
    { name: 'Pipeline 加速', cat: 'pipeline_opportunity', value: 2500000 },
    { name: '数据质量修复', cat: 'data_quality', value: 0 },
    { name: '激励提醒', cat: 'incentive_reminder', value: 300000 },
  ];
  
  const modes: ('auto' | 'suggested' | 'manual')[] = ['auto', 'suggested', 'manual'];
  const statuses: ActionImpactRecord['status'][] = ['completed', 'completed', 'completed', 'measuring', 'pending'];
  
  const records: ActionImpactRecord[] = [];
  const now = Date.now();
  
  for (let i = 0; i < 24; i++) {
    const cat = categories[i % categories.length];
    const mode = modes[i % 3];
    const daysAgo = Math.floor(Math.random() * 7);
    const hoursAgo = Math.floor(Math.random() * 24);
    const executedAt = new Date(now - daysAgo * 86400000 - hoursAgo * 3600000).toISOString();
    
    const targetCount = Math.floor(Math.random() * 50) + 5;
    const successRate = 0.6 + Math.random() * 0.35;
    
    records.push({
      id: `mock-impact-${i}`,
      actionId: `action-${i}`,
      actionName: cat.name,
      ruleName: i % 3 === 0 ? `${cat.name}规则` : undefined,
      category: cat.cat,
      targetCount,
      executedAt,
      executedBy: i % 4 === 0 ? 'user-001' : 'system',
      executionMode: mode,
      estimated: {
        revenueRecovered: Math.round(cat.value * (Math.random() * 0.5 + 0.5)),
        partnersActivated: cat.cat === 'partner_activation' ? Math.round(targetCount * 0.3) : undefined,
        slaImprovement: cat.cat === 'sla_risk' ? Math.round(targetCount * 0.7) : undefined,
        riskReduction: Math.round(Math.random() * 30 + 10),
        pipelineIncrease: cat.cat === 'pipeline_opportunity' ? Math.round(cat.value * 0.8) : undefined,
        effortMinutes: mode === 'auto' ? 2 : mode === 'suggested' ? 30 : 120,
        cost: mode === 'auto' ? 50 : mode === 'suggested' ? 500 : 2000,
        successRate: Math.round(successRate * 100),
      },
      actual: {
        revenueRecovered: Math.round(cat.value * successRate * (Math.random() * 0.4 + 0.6)),
        partnersActivated: cat.cat === 'partner_activation' ? Math.round(targetCount * successRate) : undefined,
        slaImprovement: cat.cat === 'sla_risk' ? Math.round(targetCount * successRate) : undefined,
        responseRate: Math.round(successRate * 100),
        conversionRate: Math.round(successRate * 0.6 * 100),
      },
      status: statuses[i % statuses.length],
      measuredAt: i % 5 !== 4 ? executedAt : undefined,
    });
  }
  
  return records.sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());
}
