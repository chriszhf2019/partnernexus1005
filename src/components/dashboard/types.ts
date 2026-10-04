/**
 * 三层 Dashboard 类型定义
 * 
 * Layer 1: Executive Summary（老板视角）
 * Layer 2: Operations Dashboard（运营视角）
 * Layer 3: Action Center（执行视角）
 */

import type { TimeProgressResult } from '../../lib/metricEngine/timeProgress';
import type { PortfolioHealthSummary, PartnerHealthScore } from '../../lib/metricEngine/partnerHealthScore';
import type { PipelineMetrics } from '../../lib/metricEngine/pipelineEngine';

// ===== Layer 1: Executive Summary =====

export interface ExecutiveKPI {
  id: string;
  label: string;
  value: number | string;
  target?: number | string;
  achievement?: number;
  trend: 'up' | 'down' | 'flat';
  trendValue?: number;
  status: 'excellent' | 'good' | 'warning' | 'danger';
  sparkline?: number[];
}

export interface ExecutiveSummaryData {
  // 核心三指标
  revenue: ExecutiveKPI;
  pipeline: ExecutiveKPI;
  partners: ExecutiveKPI;
  
  // 健康度评分
  overallHealth: {
    score: number;
    status: TimeProgressResult['healthStatus'];
    label: string;
    color: string;
  };
  
  // 伙伴健康度汇总
  partnerPortfolioHealth: PortfolioHealthSummary;
  
  // 一句话诊断
  diagnosisSummary: {
    level: 'healthy' | 'attention' | 'critical';
    message: string;
    actionCount: number;
  };
  
  // 时间进度
  timeProgress: TimeProgressResult;
  
  // 快速洞察（最多 3 条）
  quickInsights: Array<{
    type: 'trend' | 'risk' | 'opportunity';
    title: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

// ===== Layer 2: Operations Dashboard =====

export interface OperationsMetricCard {
  id: string;
  category: 'revenue' | 'pipeline' | 'partners' | 'conversion' | 'marketing';
  title: string;
  currentValue: number;
  targetValue: number;
  achievementRate: number;
  yoy: number;
  qoq: number;
  monthlyTrend: Array<{ month: string; value: number; rate: number }>;
  breakdown?: Array<{ name: string; value: number; rate: number }>;
  drilldownPath?: string;
}

export interface OperationsDashboardData {
  // 详细指标卡片
  metrics: OperationsMetricCard[];
  
  // 区域/伙伴类型/产品维度分析
  dimensionalAnalysis: {
    dimension: 'region' | 'partner_type' | 'partner_tier' | 'industry' | 'product';
    data: Array<{ name: string; current: number; target: number; rate: number; yoy?: number }>;
    diagnosis?: {
      finding: string;
      detail: string;
      action: string;
    };
  }[];
  
  // Pipeline 详情
  pipelineDetails: PipelineMetrics;
  
  // TOP 伙伴列表（可下钻）
  topPartners: Array<{
    id: string;
    name: string;
    tier: string;
    revenue: number;
    pipelineCount: number;
    healthScore: PartnerHealthScore;
  }>;
  
  // 问题伙伴列表（可下钻）
  atRiskPartners: Array<{
    id: string;
    name: string;
    status: string;
    daysInactive: number;
    healthScore: PartnerHealthScore;
    riskFactors: string[];
  }>;
  
  // 诊断横幅
  diagnosticsBanner: {
    hasIssues: boolean;
    issues: Array<{
      dimension: string;
      status: 'success' | 'warning' | 'danger';
      title: string;
      description: string;
      actions?: { label: string; path: string }[];
    }>;
  };
}

// ===== Layer 3: Action Center =====

export interface ActionItem {
  id: string;
  type: 'partner_activation' | 'deal_followup' | 'incentive_reminder' | 'sla_alert' | 'data_quality';
  title: string;
  description: string;
  priority: number; // 计算公式：(逾期天数 × 0.5) + (商机价值 × 0.5)
  priorityLabel: 'urgent' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  createdAt: string;
  dueDate?: string;
  overdueDays?: number;
  
  // 关联对象
  relatedPartner?: {
    id: string;
    name: string;
    tier: string;
  };
  relatedDeal?: {
    id: string;
    title: string;
    value: number;
    stage: string;
  };
  
  // 执行动作
  actions: Array<{
    label: string;
    type: 'email' | 'call' | 'visit' | 'task' | 'view';
    auto?: boolean;
  }>;
  
  // 成效反馈
  feedback?: {
    executedAt?: string;
    result?: string;
    followUpRequired?: boolean;
  };
}

export interface ActionCenterData {
  // 待办总数
  pendingCount: number;
  urgentCount: number;
  
  // 待办列表（按优先级排序）
  actions: ActionItem[];
  
  // 自动触发规则状态
  autoTriggers: Array<{
    rule: string;
    triggerCount: number;
    lastTriggered?: string;
    enabled: boolean;
  }>;
  
  // 本周执行统计
  weeklyExecution: {
    completed: number;
    dismissed: number;
    pending: number;
    completionRate: number;
  };
  
  // SLA 状态
  slaStatus: {
    overdueItems: number;
    atRiskItems: number; // 3 天内到期
    healthyItems: number;
  };
}

// ===== Dashboard 视图切换 =====

export type DashboardView = 'executive' | 'operations' | 'action_center';

export interface DashboardViewState {
  currentView: DashboardView;
  canSwitch: boolean;
  userRole: 'executive' | 'operations' | 'sales' | 'admin';
}

// ===== Partner Ops Intelligence System 类型定义 =====

// Layer 0: Executive Decision（系统级决策判断）
export interface ExecutiveDecision {
  id: string;
  level: 'critical' | 'warning' | 'healthy';
  headline: string; // 系统级判断句，如"渠道体系进入高风险失衡状态"
  rootCauses: Array<{
    factor: string;
    impact: number; // 影响百分比
  }>;
  systemRecommendation: string; // 系统建议
  riskMonetized: number; // 风险货币化（金额）
  autoMonitoring: boolean; // 是否自动监控中
}

// Layer 1: Priority Engine（优先级引擎）
export interface PriorityItem {
  id: string;
  rank: number; // 优先级排名 P0, P1, P2
  title: string;
  description: string;
  category: 'revenue' | 'pipeline' | 'partner_health' | 'data_quality';
  
  // IUE 模型
  impact: {
    value: number; // 金额影响
    percentage: number; // 百分比影响
    description: string;
  };
  urgency: {
    daysLeft: number; // 剩余天数
    level: 'critical' | 'high' | 'medium';
    description: string;
  };
  effort: {
    hours: number; // 预计工时
    resources: string; // 需要的资源
    difficulty: 'easy' | 'medium' | 'hard';
  };
  
  // 综合评分
  priorityScore: number; // IUE 综合分
  recommendedAction: string;
}

// Layer 2: Action Recommendation Engine（行动推荐引擎）
export interface ActionStrategy {
  id: string;
  name: string; // 方案名称，如"快速止血"
  type: 'quick_win' | 'structural' | 'long_term';
  priority: number; // 推荐优先级
  
  // 预期效果
  expectedOutcome: {
    revenueLift: number; // 预计收入提升
    achievementRate: number; // 达成率变化
    timeToImpact: string; // 生效时间
  };
  
  // 成本
  cost: {
    hours: number;
    resources: string[];
    investment: number;
  };
  
  // 执行步骤
  steps: Array<{
    order: number;
    action: string;
    owner: string;
    duration: string;
  }>;
  
  // ROI
  roi: {
    ratio: number; // 投入产出比
    paybackPeriod: string; // 回本周期
  };
  
  // 状态
  status: 'recommended' | 'executing' | 'completed';
  confidence: number; // 置信度 0-100
}

// Layer 3: Partner Intelligence（伙伴智能层）
export interface PartnerIntelligence {
  id: string;
  name: string;
  tier: string;
  healthScore: number;
  healthTrend: 'up' | 'down' | 'stable';
  
  // 可解释分析
  explanation: {
    score: number;
    factors: Array<{
      name: string;
      contribution: number; // 贡献度
      trend: 'up' | 'down';
    }>;
  };
  
  // 收入贡献
  contribution: {
    currentRevenue: number;
    pipelineValue: number;
    conversionRate: number;
  };
  
  // 风险原因
  riskFactors: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
  }>;
  
  // AI 建议
  aiRecommendations: Array<{
    action: string;
    expectedImpact: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

// Layer 4: Forecast & Simulation（预测与情景模拟）
export interface ForecastScenario {
  id: string;
  name: string;
  type: 'no_action' | 'quick_win' | 'structural' | 'full_optimization';
  
  // 预测指标
  forecast: {
    revenue: number;
    achievementRate: number;
    partnerHealth: number;
  };
  
  // 概率
  probability: number;
  
  // 行动要求
  actions: string[];
  confidence: number;
}

export interface ForecastData {
  currentStatus: {
    achievementRate: number;
    daysRemaining: number;
    gapToTarget: number;
  };
  
  scenarios: ForecastScenario[];
  
  // 风险预测
  riskPrediction: {
    ifNoAction: {
      projectedAchievement: number;
      riskAmount: number;
      probability: number;
    };
  };
  
  // AI 建议
  recommendation: string;
}

// 完整的 Partner Ops Intelligence System Data
export interface PartnerOpsIntelligenceData {
  // 系统元数据
  systemStatus: {
    lastUpdated: string;
    monitoringActive: boolean;
    alertCount: number;
    strategyCount: number;
  };
  
  // 5 层结构
  executiveDecision: ExecutiveDecision;
  priorityEngine: PriorityItem[];
  actionStrategies: ActionStrategy[];
  partnerIntelligence: PartnerIntelligence[];
  forecast: ForecastData;
}

// ===== Autonomous Revenue System 类型定义 =====

// 执行任务状态
export type ExecutionStatus = 'completed' | 'in_progress' | 'pending' | 'needs_human' | 'failed';

// 执行任务
export interface ExecutionTask {
  id: string;
  title: string;
  description: string;
  
  // 执行状态
  status: ExecutionStatus;
  progress: number; // 0-100
  
  // 关联
  priorityItemId?: string;
  strategyId?: string;
  partnerId?: string;
  
  // 执行详情
  autoExecution: {
    enabled: boolean;
    channel: 'email' | 'slack' | 'wecom' | 'crm' | 'internal';
    lastAction?: string;
    nextAction?: string;
  };
  
  // 反馈结果
  feedback?: {
    executedAt: string;
    openRate?: number; // 邮件打开率
    responseRate?: number; // 响应率
    conversionRate?: number; // 转化率
    revenueImpact?: number; // 收入影响
    notes?: string;
  };
  
  // 时间
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// 决策自动驾驶
export interface DecisionAutopilot {
  active: boolean;
  selectedStrategyId: string;
  selectedStrategyName: string;
  
  // 选择理由
  reasoning: Array<{
    factor: string;
    weight: number;
    value: string;
  }>;
  
  // 替代方案对比
  alternatives: Array<{
    strategyId: string;
    strategyName: string;
    roiDiff: number;
    timeDiff: string;
    riskDiff: string;
  }>;
  
  // 自动执行状态
  autoExecutionEnabled: boolean;
}

// 闭环学习
export interface LearningFeedback {
  id: string;
  actionType: 'email' | 'call' | 'visit' | 'discount' | 'incentive';
  
  // 样本数据
  sampleSize: number;
  
  // 效果指标
  effectiveness: {
    avgOpenRate: number;
    avgResponseRate: number;
    avgConversionRate: number;
    avgRevenueLift: number;
  };
  
  // 学习结论
  insights: Array<{
    type: 'success' | 'warning' | 'learning';
    title: string;
    description: string;
    confidence: number;
  }>;
  
  // 优化建议
  optimizationTips: string[];
  
  // 学习时间
  lastUpdated: string;
}

// 数字孪生预测
export interface DigitalTwinPrediction {
  scenario: string;
  timeline: string;
  
  // 预测结果
  predicted: {
    revenue: number;
    achievementRate: number;
    partnerHealth: number;
    pipelineHealth: number;
  };
  
  // 置信区间
  confidenceInterval: {
    low: number;
    high: number;
    confidence: number;
  };
  
  // 触发条件
  triggers: Array<{
    action: string;
    probability: number;
    expectedImpact: number;
  }>;
}

// Autonomous System 完整数据
export interface AutonomousRevenueSystemData {
  // 系统状态
  systemStatus: {
    mode: 'autonomous' | 'supervised' | 'manual';
    uptime: string;
    tasksProcessed: number;
    successRate: number;
  };
  
  // 自动执行流
  executionStream: {
    completed: ExecutionTask[];
    inProgress: ExecutionTask[];
    pending: ExecutionTask[];
    needsHumanIntervention: ExecutionTask[];
  };
  
  // 决策自动驾驶
  autopilot: DecisionAutopilot;
  
  // 闭环学习
  learningFeedback: LearningFeedback[];
  
  // 数字孪生
  digitalTwin: {
    currentState: DigitalTwinPrediction;
    simulations: DigitalTwinPrediction[];
    whatIfScenarios: Array<{
      condition: string;
      result: DigitalTwinPrediction;
    }>;
  };
  
  // 自主优先级
  autonomousPriority: {
    calculated: boolean;
    lastCalculated: string;
    priorities: Array<{
      rank: number;
      itemId: string;
      title: string;
      autonomousScore: number;
      factors: Array<{
        name: string;
        weight: number;
        value: number;
      }>;
    }>;
  };
}