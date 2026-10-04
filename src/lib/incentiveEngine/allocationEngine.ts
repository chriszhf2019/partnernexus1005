/**
 * 激励分配引擎
 * Incentive Allocation Engine
 * 
 * 核心功能：
 * 1. 基于Policy ROI的动态预算分配
 * 2. 预算优化建议
 * 3. 激励效果预测
 */

import { EnrichedProgram, EnrichedApplication } from '../incentiveMetrics';

// ── 类型定义 ──────────────────────────────────────────

export type IncentiveCategory = 
  | 'new_partner_acquisition'  // 拉新激励
  | 'partner_activation'       // 激活激励
  | 'revenue_growth'           // 增长激励
  | 'training_certification'   // 培训认证
  | 'market_development'       // 市场拓展
  | 'loyalty_reward';          // 忠诚度奖励

export type AllocationAction = 'increase' | 'decrease' | 'maintain' | 'activate' | 'pause';

export interface PolicyAllocation {
  policyId: string;
  policyName: string;
  category: IncentiveCategory;
  currentBudget: number;
  suggestedBudget: number;
  action: AllocationAction;
  reason: string;
  expectedROI: number;
  expectedImpact: {
    partners: number;
    revenue: number;
    activation: number;
  };
  priority: number; // 0-100
}

export interface AllocationRecommendation {
  totalBudget: number;
  allocatedBudget: number;
  suggestions: PolicyAllocation[];
  totalExpectedROI: number;
  optimizationGain: number;
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  changes: Array<{
    policyId: string;
    budgetChange: number; // +/-金额
    percentageChange: number; // +/-百分比
  }>;
  predicted: {
    totalROI: number;
    totalRevenue: number;
    totalPartners: number;
    activationRate: number;
  };
  risk: 'low' | 'medium' | 'high';
}

// ── 激励类型映射 ──────────────────────────────────────

export const CATEGORY_LABELS: Record<IncentiveCategory, string> = {
  new_partner_acquisition: '拉新激励',
  partner_activation: '激活激励',
  revenue_growth: '增长激励',
  training_certification: '培训认证',
  market_development: '市场拓展',
  loyalty_reward: '忠诚度奖励',
};

// 激励类型ROI基线（实际数据）
export const CATEGORY_BASELINE_ROI: Record<IncentiveCategory, number> = {
  new_partner_acquisition: 3.2,  // 拉新ROI最高
  partner_activation: 1.8,
  revenue_growth: 2.5,
  training_certification: 0.9,   // 培训ROI较低
  market_development: 1.5,
  loyalty_reward: 2.0,
};

// ── 核心算法 ─────────────────────────────────────────

/**
 * 根据激励类型推断分类
 */
export function inferCategory(triggerType: string | undefined): IncentiveCategory {
  if (!triggerType) return 'revenue_growth';
  const t = triggerType.toLowerCase();
  if (t.includes('new') || t.includes('acquisition') || t.includes('拉新')) return 'new_partner_acquisition';
  if (t.includes('active') || t.includes('激活') || t.includes('唤醒')) return 'partner_activation';
  if (t.includes('training') || t.includes('cert') || t.includes('培训')) return 'training_certification';
  if (t.includes('market') || t.includes('market_development') || t.includes('拓展')) return 'market_development';
  if (t.includes('loyalty') || t.includes('retention') || t.includes('忠诚')) return 'loyalty_reward';
  return 'revenue_growth';
}

/**
 * 计算单个政策的ROI
 */
export function calculatePolicyROI(
  program: EnrichedProgram,
  applications: EnrichedApplication[]
): number {
  const totalPayout = program.claimed_amount || 0;
  const totalBudget = program.total_budget || 1;
  
  // 估算GMV贡献（简化：申请金额的转化率）
  const programApps = applications.filter(a => a.plan_id === program.id);
  const claimedValue = programApps.reduce((s, a) => s + (a.claimed_value || 0), 0);
  
  // ROI = 带来的价值 / 激励成本
  // 假设激励带来其申请价值10%的实际GMV
  const estimatedGMV = claimedValue * 0.1;
  const roi = totalPayout > 0 ? estimatedGMV / totalPayout : 0;
  
  return Math.max(0, roi);
}

/**
 * 生成预算分配建议
 */
export function generateAllocationRecommendation(
  programs: EnrichedProgram[],
  applications: EnrichedApplication[],
  totalBudget: number
): AllocationRecommendation {
  const suggestions: PolicyAllocation[] = [];
  
  // 按政策分组计算
  programs.forEach(program => {
    const category = inferCategory(program.trigger_type);
    const baselineROI = CATEGORY_BASELINE_ROI[category];
    const currentROI = calculatePolicyROI(program, applications);
    
    // 计算建议
    let action: AllocationAction;
    let suggestedBudget: number;
    let reason: string;
    
    if (currentROI === 0 && !program.isActive) {
      // 未激活的政策
      action = 'activate';
      suggestedBudget = program.total_budget || 50000;
      reason = '政策未激活，建议启动以释放预算潜力';
    } else if (currentROI > baselineROI * 1.2) {
      // ROI高于基线20%以上，建议增加
      action = 'increase';
      suggestedBudget = Math.min(program.total_budget || 0 * 1.25, totalBudget * 0.3);
      reason = `ROI ${currentROI.toFixed(1)}x 高于基线 ${baselineROI}x，建议增投`;
    } else if (currentROI < baselineROI * 0.5) {
      // ROI低于基线50%以上，建议减少
      action = 'decrease';
      suggestedBudget = (program.total_budget || 0) * 0.7;
      reason = `ROI ${currentROI.toFixed(1)}x 低于基线 ${baselineROI}x，建议优化`;
    } else {
      // 维持现状
      action = 'maintain';
      suggestedBudget = program.total_budget || 0;
      reason = 'ROI处于合理区间，维持当前投入';
    }
    
    // 计算优先级
    const priority = Math.min(100, Math.round(currentROI * 30 + (program.participants_count || 0) * 2));
    
    suggestions.push({
      policyId: program.id,
      policyName: program.title || '未命名政策',
      category,
      currentBudget: program.total_budget || 0,
      suggestedBudget,
      action,
      reason,
      expectedROI: currentROI || baselineROI,
      expectedImpact: {
        partners: program.participants_count || 0,
        revenue: (program.claimed_amount || 0) * (currentROI || baselineROI),
        activation: program.isActive ? 100 : 0,
      },
      priority,
    });
  });
  
  // 计算总预期ROI
  const totalExpectedROI = suggestions.reduce((s, sg) => {
    return sg.currentBudget > 0 ? s + (sg.expectedImpact.revenue / sg.currentBudget) : s;
  }, 0) / (suggestions.length || 1);
  
  // 计算优化空间
  const currentUsed = programs.reduce((s, p) => s + (p.claimed_amount || 0), 0);
  const optimizedRevenue = suggestions.reduce((s, sg) => s + sg.expectedImpact.revenue, 0);
  const optimizationGain = optimizedRevenue - currentUsed;
  
  return {
    totalBudget,
    allocatedBudget: suggestions.reduce((s, sg) => s + sg.suggestedBudget, 0),
    suggestions: suggestions.sort((a, b) => b.priority - a.priority),
    totalExpectedROI,
    optimizationGain,
  };
}

/**
 * 模拟预算调整场景
 */
export function simulateBudgetScenario(
  currentState: AllocationRecommendation,
  scenario: SimulationScenario
): SimulationScenario {
  let totalBudget = 0;
  let totalRevenue = 0;
  let totalPartners = 0;
  
  // 应用场景变化
  scenario.changes.forEach(change => {
    const suggestion = currentState.suggestions.find(s => s.policyId === change.policyId);
    if (suggestion) {
      const newBudget = suggestion.suggestedBudget + change.budgetChange;
      totalBudget += newBudget;
      totalRevenue += newBudget * suggestion.expectedROI;
      totalPartners += suggestion.expectedImpact.partners * (1 + change.percentageChange / 100);
    }
  });
  
  const activationRate = currentState.suggestions.length > 0 
    ? (currentState.suggestions.filter(s => s.action !== 'pause').length / currentState.suggestions.length) * 100
    : 0;
  
  // 计算风险
  const budgetChangeRatio = Math.abs(totalBudget - currentState.totalBudget) / currentState.totalBudget;
  const risk = budgetChangeRatio > 0.3 ? 'high' : budgetChangeRatio > 0.15 ? 'medium' : 'low';
  
  return {
    ...scenario,
    predicted: {
      totalROI: totalRevenue / (totalBudget || 1),
      totalRevenue,
      totalPartners: Math.round(totalPartners),
      activationRate,
    },
    risk,
  };
}

/**
 * 生成默认模拟场景
 */
export function generateDefaultScenarios(
  currentState: AllocationRecommendation
): SimulationScenario[] {
  return [
    {
      id: 'aggressive_growth',
      name: '激进增长模式',
      description: '增加拉新激励25%，减少低ROI培训预算',
      changes: currentState.suggestions
        .filter(s => s.category === 'new_partner_acquisition')
        .map(s => ({
          policyId: s.policyId,
          budgetChange: s.suggestedBudget * 0.25,
          percentageChange: 25,
        })),
      predicted: {
        totalROI: 0,
        totalRevenue: 0,
        totalPartners: 0,
        activationRate: 0,
      },
      risk: 'medium',
    },
    {
      id: 'balanced_optimization',
      name: '均衡优化模式',
      description: '重新分配预算，聚焦高ROI政策',
      changes: currentState.suggestions
        .filter(s => s.action === 'decrease')
        .slice(0, 2)
        .map(s => ({
          policyId: s.policyId,
          budgetChange: -s.suggestedBudget * 0.2,
          percentageChange: -20,
        })),
      predicted: {
        totalROI: 0,
        totalRevenue: 0,
        totalPartners: 0,
        activationRate: 0,
      },
      risk: 'low',
    },
    {
      id: 'activation_focus',
      name: '激活聚焦模式',
      description: '激活沉睡政策，测试新激励类型',
      changes: currentState.suggestions
        .filter(s => s.action === 'activate' || !s.currentBudget)
        .slice(0, 2)
        .map(s => ({
          policyId: s.policyId,
          budgetChange: 30000,
          percentageChange: 100,
        })),
      predicted: {
        totalROI: 0,
        totalRevenue: 0,
        totalPartners: 0,
        activationRate: 0,
      },
      risk: 'medium',
    },
  ];
}
