/**
 * Priority Engine - 全局优先级决策引擎
 * 
 * 核心模型：
 * Priority Score =
 *   (Revenue Risk × 0.4)     // 营收风险
 * + (Time Urgency × 0.3)     // 时间紧迫度
 * + (Strategic Value × 0.2)  // 战略价值
 * + (Effort Weight × 0.1)    // 执行难度（越低优先级越高，ROI 考虑）
 * 
 * 解决的问题：所有待办平级，不知道先做哪一个
 */

import { safeDiv, clamp } from '../metricEngine/safeMath';

// ===== 决策项类型 =====

export type DecisionCategory = 
  | 'sla_risk'           // SLA风险
  | 'revenue_risk'       // 营收风险
  | 'partner_activation' // 伙伴激活
  | 'pipeline_opportunity' // Pipeline机会
  | 'incentive_reminder'  // 激励提醒
  | 'data_quality'        // 数据质量
  | 'strategic_initiative' // 战略举措
  | 'compliance_risk';    // 合规风险

export type DecisionSeverity = 'critical' | 'high' | 'medium' | 'low';

export type ExecutionMode = 
  | 'auto'      // 自动执行
  | 'suggested' // 建议执行
  | 'manual';   // 人工执行

export interface DecisionItem {
  id: string;
  category: DecisionCategory;
  title: string;
  description: string;
  
  // 四维评分（0-100）
  revenueRisk: number;      // 营收风险：不做会损失多少钱
  timeUrgency: number;      // 时间紧迫：越晚越严重
  strategicValue: number;   // 战略价值：做了对战略有多大帮助
  effortWeight: number;     // 执行难度：越难权重越低（反向）
  
  // 综合优先级得分（0-100）
  priorityScore: number;
  severity: DecisionSeverity;
  
  // 影响范围
  impact: {
    affectedPartners?: number;
    affectedDeals?: number;
    revenueAtRisk?: number;    // 风险营收
    potentialRevenue?: number; // 潜在营收
    slaImpact?: number;        // SLA影响（项）
    dataQualityScore?: number; // 数据质量分
    pipelineIncrease?: number; // Pipeline增加
  };
  
  // 执行配置
  actions: DecisionAction[];
  executionMode: ExecutionMode;
  
  // 元数据
  createdAt: string;
  dueDate?: string;
  source: string;  // 来源：system / rule / ai
}

export interface DecisionAction {
  id: string;
  label: string;
  type: ExecutionMode;
  description: string;
  
  // 预计效果
  estimatedImpact: {
    revenueRecovered?: number;
    partnersActivated?: number;
    slaImprovement?: number;
    riskReduction?: number;
    pipelineIncrease?: number;
    dataQualityScore?: number;
  };
  
  // 预计消耗
  estimatedEffort: {
    minutes: number;       // 预计耗时（分钟）
    cost?: number;         // 预计成本
  };
  
  // 成功率预估
  successRate: number;     // 0-100
}

// ===== 权重配置 =====

export interface PriorityWeights {
  revenueRisk: number;
  timeUrgency: number;
  strategicValue: number;
  effortWeight: number;
}

export const DEFAULT_WEIGHTS: PriorityWeights = {
  revenueRisk: 0.4,
  timeUrgency: 0.3,
  strategicValue: 0.2,
  effortWeight: 0.1,
};

// ===== 类别基础权重 =====

const CATEGORY_BASE_SCORES: Record<DecisionCategory, {
  revenueRisk: number;
  timeUrgency: number;
  strategicValue: number;
  effortWeight: number;
}> = {
  sla_risk: { revenueRisk: 80, timeUrgency: 95, strategicValue: 70, effortWeight: 30 },
  revenue_risk: { revenueRisk: 95, timeUrgency: 80, strategicValue: 85, effortWeight: 50 },
  partner_activation: { revenueRisk: 60, timeUrgency: 50, strategicValue: 80, effortWeight: 40 },
  pipeline_opportunity: { revenueRisk: 70, timeUrgency: 60, strategicValue: 90, effortWeight: 45 },
  incentive_reminder: { revenueRisk: 50, timeUrgency: 70, strategicValue: 60, effortWeight: 20 },
  data_quality: { revenueRisk: 30, timeUrgency: 40, strategicValue: 75, effortWeight: 35 },
  strategic_initiative: { revenueRisk: 50, timeUrgency: 45, strategicValue: 95, effortWeight: 60 },
  compliance_risk: { revenueRisk: 75, timeUrgency: 90, strategicValue: 80, effortWeight: 55 },
};

// ===== 核心计算函数 =====

/**
 * 计算优先级得分
 */
export function calculatePriorityScore(
  item: {
    revenueRisk: number;
    timeUrgency: number;
    strategicValue: number;
    effortWeight: number;
  },
  weights: PriorityWeights = DEFAULT_WEIGHTS
): number {
  const score =
    item.revenueRisk * weights.revenueRisk +
    item.timeUrgency * weights.timeUrgency +
    item.strategicValue * weights.strategicValue +
    (100 - item.effortWeight) * weights.effortWeight; // effort反向：越容易分越高

  return Math.round(clamp(score, 0, 100));
}

/**
 * 根据分数判断严重等级
 */
export function getSeverity(score: number): DecisionSeverity {
  if (score >= 85) return 'critical';
  if (score >= 65) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * 从类别生成基础决策项
 */
export function createDecisionFromCategory(
  category: DecisionCategory,
  overrides: Partial<DecisionItem> = {}
): DecisionItem {
  const base = CATEGORY_BASE_SCORES[category];
  const priorityScore = calculatePriorityScore(base);
  
  const defaultItem: DecisionItem = {
    id: `${category}-${Date.now()}`,
    category,
    title: getCategoryTitle(category),
    description: getCategoryDescription(category),
    revenueRisk: base.revenueRisk,
    timeUrgency: base.timeUrgency,
    strategicValue: base.strategicValue,
    effortWeight: base.effortWeight,
    priorityScore,
    severity: getSeverity(priorityScore),
    impact: {},
    actions: getDefaultActions(category),
    executionMode: getDefaultExecutionMode(category),
    createdAt: new Date().toISOString(),
    source: 'system',
  };

  return { ...defaultItem, ...overrides };
}

// ===== 辅助函数 =====

function getCategoryTitle(category: DecisionCategory): string {
  const titles: Record<DecisionCategory, string> = {
    sla_risk: 'SLA 逾期告警',
    revenue_risk: '营收风险预警',
    partner_activation: '伙伴激活机会',
    pipeline_opportunity: 'Pipeline 拓展机会',
    incentive_reminder: '激励政策到期',
    data_quality: '数据质量问题',
    strategic_initiative: '战略举措推进',
    compliance_risk: '合规风险预警',
  };
  return titles[category];
}

function getCategoryDescription(category: DecisionCategory): string {
  const descriptions: Record<DecisionCategory, string> = {
    sla_risk: '有服务级别协议即将或已经逾期，需要立即处理',
    revenue_risk: '营收目标存在缺口风险，需要采取干预措施',
    partner_activation: '发现可激活的沉睡伙伴，激活后可带来增量营收',
    pipeline_opportunity: 'Pipeline 储备不足，存在增长机会',
    incentive_reminder: '激励政策即将到期，需要提醒伙伴及时申请',
    data_quality: '检测到数据质量问题，影响分析准确性',
    strategic_initiative: '战略优先级项目需要推进',
    compliance_risk: '存在合规风险，需要及时处理',
  };
  return descriptions[category];
}

function getDefaultActions(category: DecisionCategory): DecisionAction[] {
  const actions: Record<DecisionCategory, DecisionAction[]> = {
    sla_risk: [
      {
        id: 'auto-reminder',
        label: '自动发送提醒',
        type: 'auto',
        description: '自动发送邮件和站内通知给相关负责人',
        estimatedImpact: { slaImprovement: 30, riskReduction: 20 },
        estimatedEffort: { minutes: 2 },
        successRate: 90,
      },
      {
        id: 'suggested-escalation',
        label: '升级处理',
        type: 'suggested',
        description: '建议分配客户经理进行专项跟进',
        estimatedImpact: { slaImprovement: 60, riskReduction: 50 },
        estimatedEffort: { minutes: 30 },
        successRate: 75,
      },
      {
        id: 'manual-batch',
        label: '批量延期审批',
        type: 'manual',
        description: '人工批量处理延期申请',
        estimatedImpact: { slaImprovement: 80, riskReduction: 70 },
        estimatedEffort: { minutes: 120 },
        successRate: 95,
      },
    ],
    partner_activation: [
      {
        id: 'auto-email',
        label: '自动激活邮件',
        type: 'auto',
        description: '批量发送个性化激活邮件',
        estimatedImpact: { partnersActivated: 15, revenueRecovered: 500000 },
        estimatedEffort: { minutes: 5 },
        successRate: 20,
      },
      {
        id: 'suggested-segment',
        label: '分层激活策略',
        type: 'suggested',
        description: '按价值分层执行激活策略，高价值伙伴优先',
        estimatedImpact: { partnersActivated: 35, revenueRecovered: 1200000 },
        estimatedEffort: { minutes: 60 },
        successRate: 40,
      },
      {
        id: 'manual-onetoone',
        label: '1对1 跟进',
        type: 'manual',
        description: '客户经理一对一跟进Top 20伙伴',
        estimatedImpact: { partnersActivated: 12, revenueRecovered: 1800000 },
        estimatedEffort: { minutes: 240 },
        successRate: 60,
      },
    ],
    revenue_risk: [
      {
        id: 'auto-alert',
        label: '自动告警',
        type: 'auto',
        description: '发送营收预警给管理层',
        estimatedImpact: { riskReduction: 10 },
        estimatedEffort: { minutes: 1 },
        successRate: 100,
      },
      {
        id: 'suggested-acceleration',
        label: '加速计划',
        type: 'suggested',
        description: '启动营收加速计划，推动高概率商机成交',
        estimatedImpact: { revenueRecovered: 2000000, riskReduction: 40 },
        estimatedEffort: { minutes: 120 },
        successRate: 55,
      },
    ],
    pipeline_opportunity: [
      {
        id: 'auto-suggest',
        label: '智能商机推荐',
        type: 'auto',
        description: 'AI推荐高潜力合作伙伴拓展新商机',
        estimatedImpact: { pipelineIncrease: 500000 },
        estimatedEffort: { minutes: 3 },
        successRate: 30,
      },
      {
        id: 'suggested-campaign',
        label: '营销活动',
        type: 'suggested',
        description: '开展Pipeline拓展营销活动',
        estimatedImpact: { pipelineIncrease: 2000000 },
        estimatedEffort: { minutes: 480 },
        successRate: 50,
      },
    ],
    incentive_reminder: [
      {
        id: 'auto-remind',
        label: '自动提醒',
        type: 'auto',
        description: '自动发送到期提醒邮件',
        estimatedImpact: { revenueRecovered: 200000 },
        estimatedEffort: { minutes: 2 },
        successRate: 85,
      },
      {
        id: 'suggested-extension',
        label: '政策延期',
        type: 'suggested',
        description: '建议延长激励政策期限',
        estimatedImpact: { revenueRecovered: 500000, pipelineIncrease: 800000 },
        estimatedEffort: { minutes: 60 },
        successRate: 70,
      },
    ],
    data_quality: [
      {
        id: 'auto-fix',
        label: '自动修复',
        type: 'auto',
        description: '自动修复可识别的数据质量问题',
        estimatedImpact: { dataQualityScore: 15 },
        estimatedEffort: { minutes: 5 },
        successRate: 60,
      },
      {
        id: 'suggested-cleanup',
        label: '数据清理计划',
        type: 'suggested',
        description: '执行数据清理专项工作',
        estimatedImpact: { dataQualityScore: 40 },
        estimatedEffort: { minutes: 180 },
        successRate: 85,
      },
    ],
    strategic_initiative: [
      {
        id: 'suggested-kickoff',
        label: '启动项目',
        type: 'suggested',
        description: '启动战略举措项目组',
        estimatedImpact: { pipelineIncrease: 3000000 },
        estimatedEffort: { minutes: 240 },
        successRate: 65,
      },
    ],
    compliance_risk: [
      {
        id: 'auto-audit',
        label: '自动审计',
        type: 'auto',
        description: '运行合规性自动检查',
        estimatedImpact: { riskReduction: 25 },
        estimatedEffort: { minutes: 10 },
        successRate: 80,
      },
      {
        id: 'suggested-review',
        label: '合规审查',
        type: 'suggested',
        description: '建议法务团队进行合规审查',
        estimatedImpact: { riskReduction: 70 },
        estimatedEffort: { minutes: 180 },
        successRate: 90,
      },
    ],
  };

  return actions[category];
}

function getDefaultExecutionMode(category: DecisionCategory): ExecutionMode {
  const modes: Record<DecisionCategory, ExecutionMode> = {
    sla_risk: 'auto',
    revenue_risk: 'suggested',
    partner_activation: 'suggested',
    pipeline_opportunity: 'suggested',
    incentive_reminder: 'auto',
    data_quality: 'auto',
    strategic_initiative: 'manual',
    compliance_risk: 'suggested',
  };
  return modes[category];
}

// ===== 决策队列管理 =====

export class DecisionQueue {
  private items: DecisionItem[] = [];
  private weights: PriorityWeights;

  constructor(weights: PriorityWeights = DEFAULT_WEIGHTS) {
    this.weights = weights;
  }

  /**
   * 添加决策项
   */
  add(item: Omit<DecisionItem, 'priorityScore' | 'severity'>): DecisionItem {
    const priorityScore = calculatePriorityScore(item, this.weights);
    const severity = getSeverity(priorityScore);
    
    const fullItem: DecisionItem = {
      ...item,
      priorityScore,
      severity,
    };
    
    this.items.push(fullItem);
    this.sort();
    return fullItem;
  }

  /**
   * 批量添加
   */
  addAll(items: Array<Omit<DecisionItem, 'priorityScore' | 'severity'>>): DecisionItem[] {
    return items.map((item) => this.add(item));
  }

  /**
   * 按优先级排序
   */
  private sort(): void {
    this.items.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * 获取排序后的队列
   */
  getQueue(): DecisionItem[] {
    return [...this.items];
  }

  /**
   * 按严重等级分组
   */
  getBySeverity(): Record<DecisionSeverity, DecisionItem[]> {
    const result: Record<DecisionSeverity, DecisionItem[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };

    for (const item of this.items) {
      result[item.severity].push(item);
    }

    return result;
  }

  /**
   * 按类别分组
   */
  getByCategory(): Record<DecisionCategory, DecisionItem[]> {
    const result = {} as Record<DecisionCategory, DecisionItem[]>;
    
    for (const item of this.items) {
      if (!result[item.category]) {
        result[item.category] = [];
      }
      result[item.category].push(item);
    }

    return result;
  }

  /**
   * 获取 Top N 优先级项
   */
  getTop(n: number): DecisionItem[] {
    return this.items.slice(0, n);
  }

  /**
   * 获取总体风险评分
   */
  getOverallRiskScore(): number {
    if (this.items.length === 0) return 0;
    
    // 加权平均，高权重给高优先级项
    const weightedSum = this.items.reduce(
      (sum, item, idx) => sum + item.priorityScore * (1 / (idx + 1)),
      0
    );
    const weightSum = this.items.reduce((sum, _, idx) => sum + 1 / (idx + 1), 0);
    
    return Math.round(weightedSum / weightSum);
  }

  /**
   * 重新计算所有优先级（权重变化时）
   */
  recalculate(weights?: PriorityWeights): void {
    if (weights) {
      this.weights = weights;
    }
    
    this.items = this.items.map((item) => ({
      ...item,
      priorityScore: calculatePriorityScore(item, this.weights),
      severity: getSeverity(calculatePriorityScore(item, this.weights)),
    }));
    
    this.sort();
  }

  /**
   * 移除项
   */
  remove(id: string): void {
    this.items = this.items.filter((item) => item.id !== id);
  }

  /**
   * 获取数量
   */
  size(): number {
    return this.items.length;
  }
}

// ===== 影响预估计算 =====

export interface ImpactEstimate {
  totalRevenueRecovered: number;
  totalPartnersActivated: number;
  totalSlaImprovement: number;
  totalRiskReduction: number;
  totalPipelineIncrease: number;
  totalEffortMinutes: number;
  roi: number;
}

/**
 * 计算执行某个动作的预计影响
 */
export function estimateActionImpact(action: DecisionAction, scale: number = 1): ImpactEstimate {
  const impact = action.estimatedImpact;
  const effort = action.estimatedEffort.minutes * scale;
  
  // ROI = 预估价值 / 预估成本（假设每分钟成本 10 元）
  const estimatedValue =
    (impact.revenueRecovered || 0) * 0.3 + // 30% 转化率计入
    (impact.pipelineIncrease || 0) * 0.1 + // 10% Pipeline 转化率计入
    (impact.riskReduction || 0) * 1000 +   // 每降低1%风险价值1000
    (impact.partnersActivated || 0) * 5000; // 每个激活伙伴价值5000
  
  const estimatedCost = effort * 10; // 每分钟10元成本
  const roi = estimatedCost > 0 ? safeDiv(estimatedValue - estimatedCost, estimatedCost) * 100 : 999;

  return {
    totalRevenueRecovered: (impact.revenueRecovered || 0) * scale,
    totalPartnersActivated: (impact.partnersActivated || 0) * scale,
    totalSlaImprovement: (impact.slaImprovement || 0),
    totalRiskReduction: (impact.riskReduction || 0),
    totalPipelineIncrease: (impact.pipelineIncrease || 0) * scale,
    totalEffortMinutes: effort,
    roi: Math.round(roi),
  };
}
