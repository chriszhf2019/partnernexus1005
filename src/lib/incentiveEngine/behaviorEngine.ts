/**
 * 行为归因引擎
 * Behavior Attribution Engine
 * 
 * 核心功能：
 * 1. 激励 → 行为变化 → 业务结果归因
 * 2. 行为影响分析
 * 3. 因果链路追踪
 */

import { EnrichedApplication } from '../incentiveMetrics';
import { IncentiveCategory } from './allocationEngine';

// ── 类型定义 ──────────────────────────────────────────

export type BehaviorType = 
  | 'partner_acquisition'    // 伙伴获取行为
  | 'deal_registration'      // 商机报备行为
  | 'revenue_generation'      // 收入产生行为
  | 'training_completion'    // 培训完成行为
  | 'activation'             // 激活行为
  | 'dormant_awakening';      // 沉睡唤醒行为

export interface BehaviorAttribution {
  behavior: BehaviorType;
  label: string;
  trigger: string; // 触发的激励类型
  count: number;
  conversionRate: number;
  attributedRevenue: number;
  attributedPartners: number;
  cost: number;
  efficiency: number; // revenue / cost
  trend: 'up' | 'stable' | 'down';
}

export interface AttributionSummary {
  totalAttributedRevenue: number;
  totalCost: number;
  overallEfficiency: number;
  topAttribution: BehaviorAttribution | null;
  attributionByCategory: Record<IncentiveCategory, BehaviorAttribution>;
  insights: string[];
}

export interface IncentiveAction {
  id: string;
  label: string;
  type: 'approve' | 'reject' | 'follow_up' | 'activate' | 'optimize';
  priority: number;
  estimatedRevenue: number;
  cost: number;
  risk: 'low' | 'medium' | 'high';
  reason: string;
}

// ── 行为类型映射 ──────────────────────────────────────

export const BEHAVIOR_LABELS: Record<BehaviorType, string> = {
  partner_acquisition: '伙伴获取',
  deal_registration: '商机报备',
  revenue_generation: '收入产生',
  training_completion: '培训完成',
  activation: '伙伴激活',
  dormant_awakening: '沉睡唤醒',
};

// ── 核心算法 ─────────────────────────────────────────

/**
 * 从申请数据中提取行为归因
 */
export function analyzeBehaviorAttribution(
  applications: EnrichedApplication[]
): AttributionSummary {
  const attributionByCategory: Record<string, BehaviorAttribution> = {};
  
  // 按激励类型分组分析
  applications.forEach(app => {
    const behavior = inferBehavior(app.metric || '');
    
    if (!attributionByCategory[behavior]) {
      attributionByCategory[behavior] = {
        behavior,
        label: BEHAVIOR_LABELS[behavior],
        trigger: app.metric || 'unknown',
        count: 0,
        conversionRate: 0,
        attributedRevenue: 0,
        attributedPartners: 0,
        cost: 0,
        efficiency: 0,
        trend: 'stable',
      };
    }
    
    const attr = attributionByCategory[behavior];
    attr.count += 1;
    attr.attributedRevenue += app.claimed_value || 0;
    attr.cost += app.payout_amount || 0;
    
    if (app.status === 'paid') {
      attr.attributedPartners += 1;
    }
  });
  
  // 计算效率
  Object.values(attributionByCategory).forEach(attr => {
    attr.efficiency = attr.cost > 0 ? attr.attributedRevenue / attr.cost : 0;
    attr.conversionRate = attr.count > 0 ? (attr.attributedPartners / attr.count) * 100 : 0;
  });
  
  // 汇总
  const totalRevenue = Object.values(attributionByCategory).reduce((s, a) => s + a.attributedRevenue, 0);
  const totalCost = Object.values(attributionByCategory).reduce((s, a) => s + a.cost, 0);
  
  const summaries = Object.values(attributionByCategory) as BehaviorAttribution[];
  const topAttribution = summaries.sort((a, b) => b.efficiency - a.efficiency)[0] || null;
  
  // 生成洞察
  const insights: string[] = [];
  if (topAttribution) {
    insights.push(`${topAttribution.label}效率最高，达到 ${topAttribution.efficiency.toFixed(1)}x ROI`);
  }
  
  const lowEfficiency = summaries.filter(a => a.efficiency < 1);
  if (lowEfficiency.length > 0) {
    insights.push(`${lowEfficiency.length}个激励类型效率低于1x，需要优化`);
  }
  
  return {
    totalAttributedRevenue: totalRevenue,
    totalCost,
    overallEfficiency: totalCost > 0 ? totalRevenue / totalCost : 0,
    topAttribution,
    attributionByCategory: attributionByCategory as Record<IncentiveCategory, BehaviorAttribution>,
    insights,
  };
}

/**
 * 生成激励行动建议
 */
export function generateIncentiveActions(
  applications: EnrichedApplication[],
  programs: { id: string; title: string; isActive: boolean; claimed_amount: number }[]
): IncentiveAction[] {
  const actions: IncentiveAction[] = [];
  
  // 1. 待审核申请 - 高优先级
  const pendingApps = applications.filter(a => a.status === 'pending' || a.status === 'reviewing');
  if (pendingApps.length > 0) {
    const totalValue = pendingApps.reduce((s, a) => s + (a.claimed_value || 0), 0);
    actions.push({
      id: 'pending_approval',
      label: `审核${pendingApps.length}笔待审批申请`,
      type: 'approve',
      priority: 95,
      estimatedRevenue: totalValue * 0.8, // 假设80%转化
      cost: totalValue,
      risk: 'low',
      reason: `涉及金额¥${(totalValue / 10000).toFixed(1)}万，影响伙伴信心`,
    });
  }
  
  // 2. 沉睡伙伴激活
  const dormantApps = applications.filter(a => {
    // 简化：超过30天未申请的伙伴视为沉睡
    if (!a.submitted_at) return false;
    const days = (Date.now() - new Date(a.submitted_at).getTime()) / (1000 * 60 * 60 * 24);
    return days > 30;
  });
  if (dormantApps.length > 0) {
    actions.push({
      id: 'dormant_activation',
      label: `激活${dormantApps.length}家伙伴`,
      type: 'activate',
      priority: 82,
      estimatedRevenue: dormantApps.length * 50000,
      cost: dormantApps.length * 5000,
      risk: 'medium',
      reason: '沉睡伙伴激活成本低，潜在回报高',
    });
  }
  
  // 3. 低效率政策优化
  const lowEfficiencyPrograms = programs.filter(p => {
    const roi = (p.claimed_amount || 0) / (p.claimed_amount || 1);
    return roi < 1;
  });
  if (lowEfficiencyPrograms.length > 0) {
    actions.push({
      id: 'policy_optimization',
      label: `优化${lowEfficiencyPrograms.length}个低ROI政策`,
      type: 'optimize',
      priority: 60,
      estimatedRevenue: lowEfficiencyPrograms.reduce((s, p) => s + (p.claimed_amount || 0), 0) * 0.2,
      cost: 0,
      risk: 'low',
      reason: '调整激励结构，预计提升ROI 15%',
    });
  }
  
  // 4. 超期未处理跟进
  const overdueApps = applications.filter(a => a.isOverdue);
  if (overdueApps.length > 0) {
    actions.push({
      id: 'follow_up',
      label: `跟进${overdueApps.length}笔超期申请`,
      type: 'follow_up',
      priority: 88,
      estimatedRevenue: overdueApps.reduce((s, a) => s + (a.claimed_value || 0), 0) * 0.6,
      cost: 0,
      risk: 'low',
      reason: '超期未处理影响伙伴满意度，需及时跟进',
    });
  }
  
  return actions.sort((a, b) => b.priority - a.priority);
}

/**
 * 推断行为类型
 */
function inferBehavior(metric: string): BehaviorType {
  const m = metric.toLowerCase();
  if (m.includes('new') || m.includes('partner') || m.includes('acquisition')) return 'partner_acquisition';
  if (m.includes('deal') || m.includes('registration') || m.includes('报备')) return 'deal_registration';
  if (m.includes('revenue') || m.includes('sales') || m.includes('收入')) return 'revenue_generation';
  if (m.includes('training') || m.includes('cert') || m.includes('培训')) return 'training_completion';
  if (m.includes('active') || m.includes('唤醒') || m.includes('激活')) return 'dormant_awakening';
  return 'activation';
}
