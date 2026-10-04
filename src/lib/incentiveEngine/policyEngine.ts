/**
 * 政策ROI引擎
 * Policy ROI Engine
 * 
 * 核心功能：
 * 1. 计算政策级ROI
 * 2. 政策价值排行
 * 3. ROI趋势分析
 */

import { EnrichedProgram, EnrichedApplication } from '../incentiveMetrics';
import { IncentiveCategory, CATEGORY_BASELINE_ROI } from './allocationEngine';

// ── 类型定义 ──────────────────────────────────────────

export interface PolicyROIResult {
  policyId: string;
  policyName: string;
  category: IncentiveCategory;
  roi: number;
  rank: number;
  contribution: {
    gmv: number;
    partners: number;
    activation: number;
    training: number;
  };
  baseline: number;
  gap: number; // vs baseline
  verdict: 'outperform' | 'meet' | 'underperform';
  insights: string[];
}

export interface ROIRanking {
  period: string;
  totalPolicies: number;
  activePolicies: number;
  rankings: PolicyROIResult[];
  averageROI: number;
  topPerformer: PolicyROIResult | null;
  bottomPerformer: PolicyROIResult | null;
}

export interface ROITrend {
  period: string;
  roi: number;
  budget: number;
  revenue: number;
  partnerCount: number;
}

// ── 核心算法 ─────────────────────────────────────────

/**
 * 计算单个政策的详细ROI
 */
export function calculateDetailedPolicyROI(
  program: EnrichedProgram,
  applications: EnrichedApplication[]
): PolicyROIResult {
  const programApps = applications.filter(a => a.plan_id === program.id);
  const category = inferCategory(program.trigger_type);
  const baseline = CATEGORY_BASELINE_ROI[category];
  
  // 激励成本
  const incentiveCost = program.claimed_amount || 0;
  
  // GMV贡献（估算：申请金额的转化价值）
  const claimedValue = programApps.reduce((s, a) => s + (a.claimed_value || 0), 0);
  const estimatedGMV = claimedValue * 0.12; // 12%转化率
  
  // 伙伴贡献
  const uniquePartners = new Set(programApps.map(a => a.partner_id)).size;
  
  // 激活贡献（有申请的伙伴视为激活）
  const activatedPartners = programApps.filter(a => a.status === 'paid').length;
  
  // 培训贡献（如果有培训相关）
  const trainingCount = programApps.filter(a => 
    a.metric?.toLowerCase().includes('training') || 
    a.metric?.toLowerCase().includes('cert')
  ).length;
  
  // ROI计算
  const roi = incentiveCost > 0 ? estimatedGMV / incentiveCost : 0;
  
  // 与基线比较
  const gap = roi - baseline;
  const verdict = gap > baseline * 0.2 ? 'outperform' : gap < -baseline * 0.2 ? 'underperform' : 'meet';
  
  // 生成洞察
  const insights: string[] = [];
  if (roi > baseline * 1.5) {
    insights.push(`ROI显著高于同类基线，${program.title}策略有效`);
  }
  if (uniquePartners > 10) {
    insights.push(`覆盖${uniquePartners}家伙伴，参与度高`);
  }
  if (incentiveCost > 0 && roi < 0.5) {
    insights.push('ROI偏低，建议审查激励结构');
  }
  if (activatedPartners === 0 && program.isActive) {
    insights.push('政策已激活但无转化，需要激活方案');
  }
  
  return {
    policyId: program.id,
    policyName: program.title || '未命名政策',
    category,
    roi,
    rank: 0, // 稍后填充
    contribution: {
      gmv: estimatedGMV,
      partners: uniquePartners,
      activation: activatedPartners,
      training: trainingCount,
    },
    baseline,
    gap,
    verdict,
    insights,
  };
}

/**
 * 生成政策ROI排行
 */
export function generateROIRanking(
  programs: EnrichedProgram[],
  applications: EnrichedApplication[],
  period: string = '当前季度'
): ROIRanking {
  const activePrograms = programs.filter(p => p.isActive || p.isUpcoming);
  
  const rankings: PolicyROIResult[] = activePrograms.map(p => 
    calculateDetailedPolicyROI(p, applications)
  );
  
  // 按ROI排序
  rankings.sort((a, b) => b.roi - a.roi);
  
  // 填充排名
  rankings.forEach((r, idx) => {
    r.rank = idx + 1;
  });
  
  // 计算平均值
  const averageROI = rankings.length > 0
    ? rankings.reduce((s, r) => s + r.roi, 0) / rankings.length
    : 0;
  
  return {
    period,
    totalPolicies: programs.length,
    activePolicies: activePrograms.length,
    rankings,
    averageROI,
    topPerformer: rankings[0] || null,
    bottomPerformer: rankings[rankings.length - 1] || null,
  };
}

/**
 * 生成ROI趋势（模拟历史数据）
 */
export function generateROITrends(
  programs: EnrichedProgram[],
  months: number = 6
): ROITrend[] {
  const trends: ROITrend[] = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const period = `${date.getFullYear()}年${date.getMonth() + 1}月`;
    
    // 模拟历史数据（实际应从数据库读取）
    const baseBudget = programs.reduce((s, p) => s + (p.total_budget || 0), 0) / 4;
    const variance = 0.8 + Math.random() * 0.4; // 0.8-1.2
    const budget = baseBudget * variance;
    const revenue = budget * (1.5 + Math.random()); // 1.5-2.5x ROI
    
    trends.push({
      period,
      roi: revenue / budget,
      budget,
      revenue,
      partnerCount: Math.round((programs.length * 5 + Math.random() * 20)),
    });
  }
  
  return trends;
}

// 辅助函数
function inferCategory(triggerType: string | undefined): IncentiveCategory {
  if (!triggerType) return 'revenue_growth';
  const t = triggerType.toLowerCase();
  if (t.includes('new') || t.includes('acquisition') || t.includes('拉新')) return 'new_partner_acquisition';
  if (t.includes('active') || t.includes('激活') || t.includes('唤醒')) return 'partner_activation';
  if (t.includes('training') || t.includes('cert') || t.includes('培训')) return 'training_certification';
  if (t.includes('market') || t.includes('拓展')) return 'market_development';
  if (t.includes('loyalty') || t.includes('retention') || t.includes('忠诚')) return 'loyalty_reward';
  return 'revenue_growth';
}
