/**
 * Growth Priority Engine - 增长优先级引擎
 * 
 * 核心功能：
 * 1. 统一优先级评分（ROI × Pipeline Impact × Coverage Gap × Urgency）
 * 2. 生成增长任务队列
 * 3. 提供可执行的策略建议
 * 
 * 解决的问题："谁先做？哪个ROI最高？"
 */

import { safeDiv, clamp } from '../metricEngine/safeMath';

// ===== 增长任务类型 =====

export type GrowthTaskCategory = 
  | 'leads_nurture'      // 线索培育
  | 'region_expand'      // 区域拓展
  | 'activity_optimize'  // 活动优化
  | 'budget_realloc'    // 预算重分配
  | 'sop_replicate'      // SOP复制
  | 'conversion_boost'  // 转化提升
  | 'coverage_fill';     // 覆盖补充

export type GrowthTaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type GrowthTaskStatus = 'pending' | 'in_progress' | 'completed' | 'dismissed';

export interface GrowthTask {
  id: string;
  category: GrowthTaskCategory;
  title: string;
  description: string;
  
  // 四维优先级评分
  roiScore: number;          // ROI 潜力 (0-100)
  pipelineImpactScore: number; // Pipeline 影响 (0-100)
  coverageGapScore: number;   // 覆盖缺口 (0-100)
  urgencyScore: number;        // 紧迫度 (0-100)
  
  // 综合优先级分
  priorityScore: number;
  priority: GrowthTaskPriority;
  
  // 影响数据
  impact: {
    leadsAffected?: number;
    revenuePotential?: number;
    partnersAffected?: number;
    conversionLift?: number;    // 转化率提升
    coverageImprovement?: number; // 覆盖改善百分比
  };
  
  // 执行信息
  estimatedEffort: number;     // 预估工时（小时）
  estimatedCost: number;       // 预估成本
  successProbability: number;  // 成功概率 (0-100)
  
  // 建议动作
  suggestedActions: GrowthAction[];
  
  // 状态
  status: GrowthTaskStatus;
  createdAt: string;
  dueDate?: string;
}

// ===== 动作类型 =====

export type GrowthActionType = 'auto' | 'suggested' | 'manual';

export interface GrowthAction {
  id: string;
  label: string;
  type: GrowthActionType;
  description: string;
  
  // 效果
  expectedROI?: number;
  expectedRevenue?: number;
  expectedLeads?: number;
  conversionLift?: number;
  
  // 成本
  cost: number;
  effort: number; // 分钟
  
  // 风险
  risk: 'low' | 'medium' | 'high';
  
  // 成功率
  successProbability?: number;
}

// ===== 增长洞察 =====

export interface GrowthInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'optimization';
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedMetrics: string[];
  recommendation: string;
}

// ===== 权重配置 =====

export interface GrowthWeights {
  roi: number;
  pipelineImpact: number;
  coverageGap: number;
  urgency: number;
}

export const DEFAULT_GROWTH_WEIGHTS: GrowthWeights = {
  roi: 0.4,
  pipelineImpact: 0.3,
  coverageGap: 0.2,
  urgency: 0.1,
};

// ===== 核心算法 =====

/**
 * 计算综合优先级分
 */
export function calculateGrowthPriorityScore(
  task: {
    roiScore: number;
    pipelineImpactScore: number;
    coverageGapScore: number;
    urgencyScore: number;
  },
  weights: GrowthWeights = DEFAULT_GROWTH_WEIGHTS
): number {
  const score =
    task.roiScore * weights.roi +
    task.pipelineImpactScore * weights.pipelineImpact +
    task.coverageGapScore * weights.coverageGap +
    task.urgencyScore * weights.urgency;
  
  return Math.round(clamp(score, 0, 100));
}

/**
 * 获取优先级标签
 */
export function getGrowthPriority(score: number): GrowthTaskPriority {
  if (score >= 85) return 'critical';
  if (score >= 65) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

// ===== 预设任务模板 =====

const TASK_TEMPLATES: Record<GrowthTaskCategory, {
  title: string;
  description: string;
  actions: Omit<GrowthAction, 'id'>[];
}> = {
  leads_nurture: {
    title: '线索培育',
    description: '对未跟进线索进行批量培育，提升转化率',
    actions: [
      { label: '自动催办', type: 'auto', description: '系统自动发送跟进提醒', expectedROI: 15, cost: 0, effort: 5, risk: 'low' },
      { label: '重新分配', type: 'suggested', description: '将线索重新分配给活跃销售', expectedROI: 25, cost: 100, effort: 30, risk: 'medium' },
      { label: '1对1跟进', type: 'manual', description: '高价值线索人工重点跟进', expectedROI: 40, cost: 500, effort: 120, risk: 'low' },
    ],
  },
  region_expand: {
    title: '区域拓展',
    description: '在覆盖不足区域开展营销活动',
    actions: [
      { label: '线上活动', type: 'auto', description: '低成本线上活动覆盖', expectedROI: 20, cost: 5000, effort: 60, risk: 'medium' },
      { label: '伙伴合作', type: 'suggested', description: '与当地伙伴联合举办活动', expectedROI: 35, cost: 15000, effort: 480, risk: 'low' },
      { label: '设立据点', type: 'manual', description: '建立区域营销团队', expectedROI: 50, cost: 100000, effort: 2400, risk: 'high' },
    ],
  },
  activity_optimize: {
    title: '活动优化',
    description: '优化低效活动，提升ROI',
    actions: [
      { label: '调整预算', type: 'auto', description: '自动削减低效活动预算', expectedROI: 10, cost: 0, effort: 10, risk: 'low' },
      { label: '优化内容', type: 'suggested', description: '改进活动策划和物料', expectedROI: 20, cost: 3000, effort: 240, risk: 'medium' },
      { label: '更换形式', type: 'manual', description: '完全改变活动形式', expectedROI: 30, cost: 20000, effort: 720, risk: 'high' },
    ],
  },
  budget_realloc: {
    title: '预算重分配',
    description: '将低效预算转移到高效渠道',
    actions: [
      { label: '自动优化', type: 'auto', description: 'AI自动调整预算分配', expectedROI: 15, cost: 0, effort: 5, risk: 'low' },
      { label: '人工审核', type: 'suggested', description: '基于ROI分析人工审核', expectedROI: 25, cost: 500, effort: 120, risk: 'medium' },
      { label: '重新规划', type: 'manual', description: '全面重新规划预算结构', expectedROI: 35, cost: 5000, effort: 480, risk: 'high' },
    ],
  },
  sop_replicate: {
    title: 'SOP复制',
    description: '将成功经验复制到其他区域',
    actions: [
      { label: '模板分享', type: 'auto', description: '自动分享SOP模板', expectedROI: 10, cost: 0, effort: 10, risk: 'low' },
      { label: '培训推广', type: 'suggested', description: '组织培训推广成功SOP', expectedROI: 20, cost: 2000, effort: 240, risk: 'low' },
      { label: '驻场指导', type: 'manual', description: '派人到现场指导实施', expectedROI: 30, cost: 10000, effort: 720, risk: 'medium' },
    ],
  },
  conversion_boost: {
    title: '转化提升',
    description: '提升线索到商机的转化率',
    actions: [
      { label: '邮件序列', type: 'auto', description: '自动化邮件培育序列', expectedROI: 15, cost: 100, effort: 60, risk: 'low' },
      { label: '内容优化', type: 'suggested', description: '优化转化页和内容', expectedROI: 25, cost: 3000, effort: 180, risk: 'low' },
      { label: '流程改造', type: 'manual', description: '全面改造转化流程', expectedROI: 40, cost: 30000, effort: 960, risk: 'high' },
    ],
  },
  coverage_fill: {
    title: '覆盖补充',
    description: '在空白行业或领域开展营销',
    actions: [
      { label: '线上渗透', type: 'auto', description: '低成本线上内容渗透', expectedROI: 10, cost: 1000, effort: 60, risk: 'low' },
      { label: '行业活动', type: 'suggested', description: '针对性行业活动', expectedROI: 25, cost: 20000, effort: 480, risk: 'medium' },
      { label: '战略合作', type: 'manual', description: '与行业龙头建立合作', expectedROI: 50, cost: 100000, effort: 2400, risk: 'high' },
    ],
  },
};

/**
 * 生成增长任务
 */
export function createGrowthTask(
  category: GrowthTaskCategory,
  context: {
    leads?: number;
    revenue?: number;
    coverage?: number; // 当前覆盖率
    daysUntilDeadline?: number;
    historicalSuccess?: number;
    urgencyScore?: number;
  } = {}
): GrowthTask {
  const template = TASK_TEMPLATES[category];
  
  // 计算各维度评分
  const roiScore = Math.min(100, (context.revenue || 0) / 10000); // 每万营收10分
  const pipelineImpactScore = Math.min(100, (context.leads || 0) * 2); // 每条线索2分
  const coverageGapScore = context.coverage !== undefined 
    ? Math.max(0, 100 - context.coverage) 
    : 50;
  const urgencyScore = context.urgencyScore ?? (context.daysUntilDeadline !== undefined
    ? Math.max(0, 100 - context.daysUntilDeadline * 3)
    : 50);
  
  // 历史成功率影响
  const successMod = (context.historicalSuccess || 0.5) * 0.5 + 0.5;
  
  const priorityScore = calculateGrowthPriorityScore({
    roiScore,
    pipelineImpactScore,
    coverageGapScore,
    urgencyScore,
  });
  
  const actions: GrowthAction[] = template.actions.map((action, idx) => ({
    ...action,
    id: `action-${category}-${idx}`,
    expectedROI: action.expectedROI || 0,
    successProbability: (100 - idx * 20) * successMod,
  }));
  
  // 最佳动作（第一个建议动作）
  const bestAction = actions[1] || actions[0];
  
  return {
    id: `growth-${category}-${Date.now()}`,
    category,
    title: template.title,
    description: template.description,
    roiScore: Math.round(roiScore),
    pipelineImpactScore: Math.round(pipelineImpactScore),
    coverageGapScore: Math.round(coverageGapScore),
    urgencyScore: Math.round(urgencyScore),
    priorityScore,
    priority: getGrowthPriority(priorityScore),
    impact: {
      leadsAffected: context.leads,
      revenuePotential: context.revenue,
      coverageImprovement: coverageGapScore * 0.3,
    },
    estimatedEffort: bestAction.effort / 60,
    estimatedCost: bestAction.cost,
    successProbability: bestAction.successProbability || 50,
    suggestedActions: actions,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

// ===== 增长任务队列 =====

export class GrowthQueue {
  private tasks: GrowthTask[] = [];
  private weights: GrowthWeights;

  constructor(weights: GrowthWeights = DEFAULT_GROWTH_WEIGHTS) {
    this.weights = weights;
  }

  /**
   * 添加任务
   */
  add(task: Omit<GrowthTask, 'priorityScore' | 'priority'>): GrowthTask {
    const priorityScore = calculateGrowthPriorityScore(task, this.weights);
    const priority = getGrowthPriority(priorityScore);
    
    const fullTask: GrowthTask = {
      ...task,
      priorityScore,
      priority,
    };
    
    this.tasks.push(fullTask);
    this.sort();
    return fullTask;
  }

  /**
   * 批量添加
   */
  addAll(tasks: Array<Omit<GrowthTask, 'priorityScore' | 'priority'>>): GrowthTask[] {
    return tasks.map(task => this.add(task));
  }

  /**
   * 按优先级排序
   */
  private sort(): void {
    this.tasks.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * 获取队列
   */
  getTasks(): GrowthTask[] {
    return [...this.tasks];
  }

  /**
   * 按优先级分组
   */
  getByPriority(): Record<GrowthTaskPriority, GrowthTask[]> {
    const result: Record<GrowthTaskPriority, GrowthTask[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };

    for (const task of this.tasks) {
      result[task.priority].push(task);
    }

    return result;
  }

  /**
   * 按类别分组
   */
  getByCategory(): Record<GrowthTaskCategory, GrowthTask[]> {
    const result = {} as Record<GrowthTaskCategory, GrowthTask[]>;
    
    for (const task of this.tasks) {
      if (!result[task.category]) {
        result[task.category] = [];
      }
      result[task.category].push(task);
    }

    return result;
  }

  /**
   * 获取 Top N
   */
  getTop(n: number): GrowthTask[] {
    return this.tasks.slice(0, n);
  }

  /**
   * 获取最高优先级的待处理任务
   */
  getNext(): GrowthTask | undefined {
    return this.tasks.find(task => task.status === 'pending');
  }

  /**
   * 更新任务状态
   */
  updateStatus(id: string, status: GrowthTaskStatus): void {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.status = status;
    }
  }

  /**
   * 获取队列统计
   */
  getStats(): {
    total: number;
    byPriority: Record<GrowthTaskPriority, number>;
    byCategory: Record<GrowthTaskCategory, number>;
    totalPotentialRevenue: number;
    totalEstimatedCost: number;
    avgPriority: number;
  } {
    const byPriority: Record<GrowthTaskPriority, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    const byCategory: Record<GrowthTaskCategory, number> = {
      leads_nurture: 0,
      region_expand: 0,
      activity_optimize: 0,
      budget_realloc: 0,
      sop_replicate: 0,
      conversion_boost: 0,
      coverage_fill: 0,
    };

    let totalPotentialRevenue = 0;
    let totalEstimatedCost = 0;
    let totalPriority = 0;

    for (const task of this.tasks) {
      byPriority[task.priority]++;
      byCategory[task.category]++;
      totalPotentialRevenue += task.impact.revenuePotential || 0;
      totalEstimatedCost += task.estimatedCost;
      totalPriority += task.priorityScore;
    }

    return {
      total: this.tasks.length,
      byPriority,
      byCategory,
      totalPotentialRevenue: Math.round(totalPotentialRevenue),
      totalEstimatedCost: Math.round(totalEstimatedCost),
      avgPriority: this.tasks.length > 0 ? Math.round(totalPriority / this.tasks.length) : 0,
    };
  }
}

// ===== 增长洞察生成 =====

/**
 * 从数据生成增长洞察
 */
export function generateGrowthInsights(data: {
  leads?: number;
  pendingLeads?: number;
  regions?: string[];
  activeRegions?: string[];
  activities?: Array<{ type: string; roi: number }>;
  coverage?: Record<string, number>;
}): GrowthInsight[] {
  const insights: GrowthInsight[] = [];
  
  // 线索流失风险
  if (data.pendingLeads && data.pendingLeads > 20) {
    insights.push({
      id: 'insight-leads-risk',
      type: 'risk',
      title: '线索积压风险',
      description: `有 ${data.pendingLeads} 条线索超过 7 天未跟进，存在流失风险`,
      severity: data.pendingLeads > 50 ? 'critical' : 'high',
      affectedMetrics: ['线索转化率', '营收'],
      recommendation: '建议立即启动线索培育任务，优先处理高价值线索',
    });
  }
  
  // 区域覆盖缺口
  if (data.regions && data.activeRegions) {
    const inactiveRegions = data.regions.filter(r => !data.activeRegions?.includes(r));
    if (inactiveRegions.length > 0) {
      insights.push({
        id: 'insight-region-gap',
        type: 'opportunity',
        title: '区域覆盖缺口',
        description: `${inactiveRegions.join('、')} 等区域暂无营销活动覆盖`,
        severity: inactiveRegions.length > 3 ? 'high' : 'medium',
        affectedMetrics: ['区域覆盖', '潜在营收'],
        recommendation: `建议在 ${inactiveRegions[0]} 等区域开展营销活动`,
      });
    }
  }
  
  // ROI 趋势分析
  if (data.activities && data.activities.length > 0) {
    const avgROI = data.activities.reduce((sum, a) => sum + a.roi, 0) / data.activities.length;
    const lowROI = data.activities.filter(a => a.roi < 0);
    
    if (lowROI.length > 0) {
      insights.push({
        id: 'insight-low-roi',
        type: 'risk',
        title: '低效活动告警',
        description: `${lowROI.length} 个活动 ROI 为负，建议削减或优化`,
        severity: lowROI.length > 3 ? 'critical' : 'high',
        affectedMetrics: ['ROI', '预算效率'],
        recommendation: '建议运行预算优化引擎，重新分配资源',
      });
    }
    
    if (avgROI < 20) {
      insights.push({
        id: 'insight-roi-trend',
        type: 'optimization',
        title: '整体 ROI 偏低',
        description: `当前平均 ROI 仅 ${avgROI.toFixed(1)}%，低于行业平均水平`,
        severity: avgROI < 10 ? 'critical' : 'medium',
        affectedMetrics: ['ROI', '利润率'],
        recommendation: '建议聚焦高 ROI 活动，减少低效投入',
      });
    }
  }
  
  return insights.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}
