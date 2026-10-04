/**
 * 决策引擎数据生成器
 * 
 * 从 cockpitData 生成决策项（Decision Items）
 * 将散落在各处的运营数据统一进入优先级评分系统
 */

import {
  DecisionItem,
  DecisionQueue,
  createDecisionFromCategory,
} from './priorityEngine';

/**
 * 从座舱数据生成决策队列
 */
export function generateDecisionQueue(cockpitData: any): DecisionItem[] {
  const queue = new DecisionQueue();

  // 1. SLA 风险（最高优先级组）
  // 从申请数据中提取，如果没有则用模拟数据
  const slaOverdue = cockpitData?.applications?.filter?.(
    (a: any) => a.sla_status === 'overdue'
  ).length || 3;
  const slaAtRisk = cockpitData?.applications?.filter?.(
    (a: any) => a.sla_status === 'at_risk'
  ).length || 5;
  
  if (slaOverdue > 0 || slaAtRisk > 0) {
    const revenueAtRisk = (slaOverdue + slaAtRisk) * 50000;
    queue.add({
      ...createDecisionFromCategory('sla_risk'),
      id: 'decision-sla-risk',
      title: 'SLA 逾期告警',
      description: `${slaOverdue} 条申请已逾期，${slaAtRisk} 条即将逾期，需要立即处理以避免合作伙伴满意度下降`,
      revenueRisk: Math.min(95, 70 + slaOverdue * 5),
      timeUrgency: Math.min(98, 85 + slaOverdue * 3),
      strategicValue: 75,
      effortWeight: 35,
      impact: {
        affectedPartners: slaOverdue + slaAtRisk,
        revenueAtRisk,
        slaImpact: slaOverdue + slaAtRisk,
      },
      createdAt: new Date().toISOString(),
      source: 'system',
    });
  }

  // 2. 营收风险
  const quarterlyRevenue = cockpitData?.revenue?.achievements?.quarterly;
  const revenueTarget = quarterlyRevenue?.target || 0;
  const revenueActual = quarterlyRevenue?.current || 0;
  const achievementRate = revenueTarget > 0 ? (revenueActual / revenueTarget) * 100 : 100;
  
  // 计算时间进度
  const now = new Date();
  const monthInQuarter = ((now.getMonth() % 3) + 1);
  const dayInMonth = now.getDate();
  const daysInQuarter = [90, 91, 92, 92][Math.floor(now.getMonth() / 3)];
  const daysElapsed = (monthInQuarter - 1) * 30 + dayInMonth;
  const timeProgress = Math.min(100, (daysElapsed / daysInQuarter) * 100);
  
  const gap = timeProgress - achievementRate;
  
  if (gap > 10 && revenueTarget > 0) {
    const revenueGap = revenueTarget - revenueActual;
    queue.add({
      ...createDecisionFromCategory('revenue_risk'),
      id: 'decision-revenue-risk',
      title: '营收进度滞后告警',
      description: `时间进度 ${timeProgress.toFixed(1)}%，但营收完成率仅 ${achievementRate.toFixed(1)}%，落后 ${gap.toFixed(1)} 个百分点`,
      revenueRisk: Math.min(98, 60 + gap * 2),
      timeUrgency: Math.min(90, 50 + gap * 1.5),
      strategicValue: 90,
      effortWeight: 55,
      impact: {
        revenueAtRisk: revenueGap * 0.4,
        affectedDeals: Math.floor(revenueGap / 200000),
      },
      createdAt: new Date().toISOString(),
      source: 'system',
    });
  }

  // 3. 危险伙伴（营收风险类）
  const partnerHealth = cockpitData?.activePartners?.partner_health_summary;
  const dangerPartners = partnerHealth?.by_risk?.danger || partnerHealth?.criticalCount || 0;
  const atRiskPartners = partnerHealth?.by_risk?.at_risk || partnerHealth?.atRiskCount || 0;
  const zeroOutput = cockpitData?.activePartners?.zero_output_partners || 84;
  
  if (dangerPartners > 0 || zeroOutput > 0) {
    const potentialRevenue = (dangerPartners + atRiskPartners + zeroOutput) * 80000;
    queue.add({
      ...createDecisionFromCategory('partner_activation'),
      id: 'decision-danger-partners',
      title: '危险伙伴激活机会',
      description: `${dangerPartners} 家伙伴处于危险状态，${zeroOutput} 家零产出，激活后可带来显著营收增量`,
      revenueRisk: 65,
      timeUrgency: 55,
      strategicValue: 85,
      effortWeight: 45,
      impact: {
        affectedPartners: dangerPartners + atRiskPartners + zeroOutput,
        potentialRevenue,
      },
      createdAt: new Date().toISOString(),
      source: 'system',
    });
  }

  // 4. Pipeline 储备不足
  const pipelineValue = cockpitData?.pipeline?.current_value || 0;
  
  if (pipelineValue > 0 && revenueTarget > 0) {
    const coverage = (pipelineValue / revenueTarget) * 100;
    
    if (coverage < 200) {
      const gapPct = 200 - coverage;
      queue.add({
        ...createDecisionFromCategory('pipeline_opportunity'),
        id: 'decision-pipeline-gap',
        title: 'Pipeline 储备不足',
        description: `当前 Pipeline 覆盖率仅 ${coverage.toFixed(0)}%，低于安全线 200%，需要拓展新商机`,
        revenueRisk: Math.min(80, 40 + gapPct * 0.5),
        timeUrgency: Math.min(75, 35 + gapPct * 0.3),
        strategicValue: 92,
        effortWeight: 50,
        impact: {
          pipelineIncrease: revenueTarget * 2 - pipelineValue,
          affectedDeals: Math.floor((revenueTarget * 2 - pipelineValue) / 300000),
        },
        createdAt: new Date().toISOString(),
        source: 'system',
      });
    }
  }

  // 5. 激励政策到期（模拟数据）
  const expiringIncentives = 4;
  if (expiringIncentives > 0) {
    const totalAmount = expiringIncentives * 100000;
    queue.add({
      ...createDecisionFromCategory('incentive_reminder'),
      id: 'decision-incentive-expiring',
      title: '激励政策即将到期',
      description: `${expiringIncentives} 项激励政策将在 7 天内到期，需要提醒合作伙伴及时申请`,
      revenueRisk: 55,
      timeUrgency: 75,
      strategicValue: 65,
      effortWeight: 25,
      impact: {
        affectedPartners: expiringIncentives * 3,
        revenueAtRisk: totalAmount * 0.3,
      },
      createdAt: new Date().toISOString(),
      source: 'system',
    });
  }

  // 6. 数据质量问题
  const dataQualityScore = cockpitData?.data_quality_score || 82;
  if (dataQualityScore < 90) {
    const issuesCount = Math.floor((100 - dataQualityScore) / 5);
    queue.add({
      ...createDecisionFromCategory('data_quality'),
      id: 'decision-data-quality',
      title: '数据质量待提升',
      description: `当前数据质量评分 ${dataQualityScore.toFixed(1)} 分，存在约 ${issuesCount} 类数据质量问题，影响分析准确性`,
      revenueRisk: 35,
      timeUrgency: 45,
      strategicValue: 80,
      effortWeight: 40,
      impact: {
        dataQualityScore: 100 - dataQualityScore,
      },
      createdAt: new Date().toISOString(),
      source: 'system',
    });
  }

  // 7. 战略级机会：头部伙伴深耕
  const topPartners = cockpitData?.top_partners || [];
  if (topPartners.length > 0) {
    const topRevenue = topPartners.reduce((sum: number, p: any) => sum + (p.revenue || 0), 0);
    const concentration = revenueActual > 0 ? (topRevenue / revenueActual) * 100 : 0;
    
    if (concentration > 50) {
      queue.add({
        ...createDecisionFromCategory('strategic_initiative'),
        id: 'decision-top-partner-deepening',
        title: '头部伙伴深耕计划',
        description: `Top ${topPartners.length} 家伙伴贡献了 ${concentration.toFixed(0)}% 营收，建议启动深耕计划降低集中度风险`,
        revenueRisk: 50,
        timeUrgency: 40,
        strategicValue: 95,
        effortWeight: 65,
        impact: {
          affectedPartners: topPartners.length,
          potentialRevenue: topRevenue * 0.2,
        },
        createdAt: new Date().toISOString(),
        source: 'ai',
      });
    }
  }

  return queue.getQueue();
}

/**
 * 计算整体风险分数
 */
export function calculateOverallRisk(decisionItems: DecisionItem[]): number {
  if (decisionItems.length === 0) return 0;
  
  const queue = new DecisionQueue();
  for (const item of decisionItems) {
    queue.add(item);
  }
  
  return queue.getOverallRiskScore();
}
