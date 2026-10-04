/**
 * 真实驾驶舱数据模块（重构版）
 * 使用 Metric Engine 统一计算指标，修复审计问题
 * 
 * 修复问题：
 * 1. Pipeline 覆盖率 ∞ 问题（分母为0）
 * 2. 时间进度 vs 业绩进度冲突（逻辑错位）
 * 3. 健康度系统不可信（没有统一评分模型）
 */
import { supabase } from './supabase';
import {
  safePercent,
  safeDiv,
  safeNumber,
  safeSum,
  clamp,
  formatPercent,
} from './metricEngine/safeMath';
import {
  calculateTimeProgress,
  getCurrentQuarter,
  getQuarterDateRange,
  type TimeProgressResult,
} from './metricEngine/timeProgress';
import {
  calculatePipelineMetrics,
  diagnosePipeline,
  isActiveDeal,
  isWonDeal,
  type PipelineMetrics,
} from './metricEngine/pipelineEngine';
import {
  calculatePartnerHealth,
  calculatePortfolioHealth,
  type PartnerHealthScore,
  type PortfolioHealthSummary,
  getHealthLevelLabel,
} from './metricEngine/partnerHealthScore';

export interface CockpitMetric {
  metric_name: string;
  current_value: number;
  total_partners?: number;
  yoy: number;
  qoq: number;
  mom: number;
  linear_rate: number;
  achievements: {
    monthly: { current: number; target: number; rate: number };
    quarterly: { current: number; target: number; rate: number };
    yearly: { current: number; target: number; rate: number };
    q1?: { current: number; target: number; rate: number };
    q2?: { current: number; target: number; rate: number };
    q3?: { current: number; target: number; rate: number };
    q4?: { current: number; target: number; rate: number };
  };
  monthly_data: Array<{ month: string; value: number; qoq: number }>;
  partner_ecosystem_details?: {
    coverage: {
      total: number;
      new_month: number;
      new_quarter: number;
      churn_quarter: number;
      growth_rate: number;
      yoy_quarter: number;
      qoq_quarter: number;
    };
    regional_coverage: Array<{ region: string; partner_count: number; city_count: number; new_cities: string[] }>;
    tier_funnel: Array<{ tier: string; count: number; percentage: number }>;
    contribution_mix: { top_percent: number; revenue_percent: number };
    health_radar: { coverage: number; activity: number; capability: number; will: number };
  };
  active_split?: {
    order_placing: { value: number; target: number; rate: number; yoy: number; qoq: number };
    leads_reporting: { value: number; target: number; rate: number; yoy: number; qoq: number };
    pmdf_partners: { value: number; target: number; rate: number; yoy: number; qoq: number };
    incentive_participants: { value: number; target: number; rate: number; yoy: number; qoq: number };
  };
  dimensional_achievements?: Array<{
    type: string;
    data: Array<{ name: string; current: number; target: number; rate: number; yoy?: number; qoq?: number }>;
  }>;
  team_achievements?: Array<{ name: string; value?: number; current: number; target: number; rate: number; yoy?: number; qoq?: number }>;
  product_achievements?: Array<{ name: string; product_name?: string; product?: string; value?: number; current: number; target: number; rate: number; yoy?: number; qoq?: number }>;
  pipeline_batch?: {
    current_q_target: number;
    next_q_count: number;
    new_in_q_ratio: number;
    historical_ratio: number;
    historical_amount: number;
    new_amount: number;
  };
  conversion_details?: {
    cycle_days: number;
    funnel_stages: { stage: string; count: number }[];
  };
  // 新增：时间进度健康度（修复审计问题）
  time_health?: TimeProgressResult;
  // 新增：伙伴健康度汇总
  partner_health_summary?: PortfolioHealthSummary;
}

export interface CockpitData {
  revenue: CockpitMetric;
  activePartners: CockpitMetric;
  pipeline: CockpitMetric;
  leadsConversion: CockpitMetric;
  marketing: CockpitMetric;
  insights: Array<{ type: 'trend' | 'risk' | 'opportunity'; title: string; content: string; actionLabel: string; actionId: string; priority?: string; message?: string }>;
}

function emptyMetric(name: string): CockpitMetric {
  const zero = { current: 0, target: 0, rate: 0 };
  return {
    metric_name: name,
    current_value: 0,
    total_partners: 0,
    yoy: 0,
    qoq: 0,
    mom: 0,
    linear_rate: 0,
    achievements: {
      monthly: { ...zero },
      quarterly: { ...zero },
      yearly: { ...zero },
    },
    monthly_data: [],
    dimensional_achievements: [],
  };
}

export interface TargetConfig {
  yearlyTarget: number;
  quarterlyTargets: { [key: number]: number };
  monthlyRatios: { [quarter: number]: [number, number, number] };
}

const defaultTargetConfig: TargetConfig = {
  yearlyTarget: 60000000,
  quarterlyTargets: {
    1: 12000000,
    2: 15000000,
    3: 18000000,
    4: 15000000,
  },
  monthlyRatios: {
    1: [20, 30, 50],
    2: [25, 35, 40],
    3: [20, 35, 45],
    4: [30, 35, 35],
  },
};

function getMonthlyTarget(year: number, month: number, config: TargetConfig): number {
  const quarter = month <= 3 ? 1 : month <= 6 ? 2 : month <= 9 ? 3 : 4;
  const quarterTarget = config.quarterlyTargets[quarter] || config.yearlyTarget / 4;
  const ratios = config.monthlyRatios[quarter] || [33.33, 33.33, 33.34];
  const monthIndex = (month - 1) % 3;
  return Math.round(quarterTarget * ratios[monthIndex] / 100);
}

function createTargetConfigFromGlobalConfig(config: any): TargetConfig {
  if (!config) return defaultTargetConfig;
  
  return {
    yearlyTarget: config.yearlyTarget || defaultTargetConfig.yearlyTarget,
    quarterlyTargets: {
      1: config.q1Target || defaultTargetConfig.quarterlyTargets[1],
      2: config.q2Target || defaultTargetConfig.quarterlyTargets[2],
      3: config.q3Target || defaultTargetConfig.quarterlyTargets[3],
      4: config.q4Target || defaultTargetConfig.quarterlyTargets[4],
    },
    monthlyRatios: {
      1: [
        config.q1M1 || defaultTargetConfig.monthlyRatios[1][0],
        config.q1M2 || defaultTargetConfig.monthlyRatios[1][1],
        config.q1M3 || defaultTargetConfig.monthlyRatios[1][2],
      ],
      2: [
        config.q2M1 || defaultTargetConfig.monthlyRatios[2][0],
        config.q2M2 || defaultTargetConfig.monthlyRatios[2][1],
        config.q2M3 || defaultTargetConfig.monthlyRatios[2][2],
      ],
      3: [
        config.q3M1 || defaultTargetConfig.monthlyRatios[3][0],
        config.q3M2 || defaultTargetConfig.monthlyRatios[3][1],
        config.q3M3 || defaultTargetConfig.monthlyRatios[3][2],
      ],
      4: [
        config.q4M1 || defaultTargetConfig.monthlyRatios[4][0],
        config.q4M2 || defaultTargetConfig.monthlyRatios[4][1],
        config.q4M3 || defaultTargetConfig.monthlyRatios[4][2],
      ],
    },
  };
}

export async function getRealCockpitData(config?: any): Promise<CockpitData> {
  const targetConfig = createTargetConfigFromGlobalConfig(config);
  const { year, quarter } = getCurrentQuarter();
  const { start, end } = getQuarterDateRange(year, quarter);

  try {
    const [
      dealsResult,
      partnersResult,
      applicationsResult,
      activitiesResult,
    ] = await Promise.all([
      supabase.from('deals').select('*').limit(1000),
      supabase.from('partners').select('*').limit(500),
      supabase.from('incentive_applications').select('*').limit(500),
      supabase.from('partner_activity_logs').select('partner_id, activity_type, created_at').limit(1000),
    ]);

    const rawDeals = dealsResult.data || [];
    const rawPartners = partnersResult.data || [];
    const applications = applicationsResult.data || [];
    const activities = activitiesResult.data || [];

    // 数据转换：数据库字段 → TypeScript 接口
    const deals = rawDeals.map((d: any) => ({
      ...d,
      partnerId: d.partner_id || d.partnerId,
      createdDate: d.created_at || d.createdDate,
      lastActivityDate: d.updated_at || d.lastActivityDate,
    }));

    const partners = rawPartners.map((p: any) => ({
      ...p,
      id: p.id,
      name: p.name,
      tier: p.tier,
      status: p.status,
      region: p.region,
      industry: p.industry,
    }));

    // ===== 使用 Metric Engine 计算 Pipeline =====
    const quarterlyTarget = targetConfig.quarterlyTargets[quarter] || targetConfig.yearlyTarget / 4;
    const pipelineMetrics = calculatePipelineMetrics({
      deals: deals as any[],
      quarterlyTarget,
    });

    // ===== 计算营收（使用 safeMath）=====
    const wonDeals = deals.filter((d: any) =>
      d.stage === 'ClosedWon' || d.status === 'Closed Won' || d.status === 'Converted'
    );
    
    const monthlyRevenue = new Map<string, number>();
    wonDeals.forEach((d: any) => {
      const date = new Date(d.lastActivityDate || d.createdDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue.set(monthKey, (monthlyRevenue.get(monthKey) || 0) + safeNumber(d.value, 0));
    });

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const monthlyData: Array<{ month: string; value: number; qoq: number }> = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const value = monthlyRevenue.get(key) || 0;
      const prevMonthKey = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      const prevValue = monthlyRevenue.get(prevMonthKey) || 0;
      monthlyData.push({
        month: `${d.getMonth() + 1}月`,
        value,
        qoq: safePercent(value - prevValue, Math.max(prevValue, 1), 0),
      });
    }

    const currentQuarterRevenue = wonDeals
      .filter((d: any) => {
        const date = new Date(d.lastActivityDate || d.createdDate);
        return date.getFullYear() === year && Math.ceil((date.getMonth() + 1) / 3) === quarter;
      })
      .reduce((sum, d) => sum + safeNumber(d.value, 0), 0);

    const yearlyRevenue = wonDeals
      .filter((d: any) => {
        const date = new Date(d.lastActivityDate || d.createdDate);
        return date.getFullYear() === year;
      })
      .reduce((sum, d) => sum + safeNumber(d.value, 0), 0);

    // ===== 使用时间进度模型（修复审计问题）=====
    const timeHealth = calculateTimeProgress({
      startDate: start,
      endDate: end,
      totalTarget: quarterlyTarget,
      actualRevenue: currentQuarterRevenue,
    });

    // ===== 计算伙伴健康度 =====
    const partnerScores = new Map<string, PartnerHealthScore>();
    const avgRevenue = wonDeals.length > 0
      ? safeSum(wonDeals.map(d => safeNumber(d.value, 0))) / wonDeals.length
      : 500000;

    partners.forEach((partner: any) => {
      const partnerActivities = activities.filter((a: any) => a.partner_id === partner.id);
      const score = calculatePartnerHealth({
        partner: partner as any,
        deals: deals as any[],
        activities: partnerActivities,
        benchmarks: {
          avgRevenue,
          avgWinRate: 30,
          avgActivity: 5,
        },
      });
      partnerScores.set(partner.id, score);
    });

    const partnerHealthSummary = calculatePortfolioHealth(Array.from(partnerScores.values()));

    // ===== 计算活跃伙伴 =====
    const totalPartners = partners.length;
    const activePartners = partners.filter((p: any) => p.status === 'Cooperating');
    const activeCount = activePartners.length;

    // 按区域统计
    const regionMap = new Map<string, number>();
    const regionRevenueMap = new Map<string, number>();
    
    partners.forEach((p: any) => {
      const region = p.region || '其他';
      regionMap.set(region, (regionMap.get(region) || 0) + 1);
    });

    wonDeals.forEach((d: any) => {
      const partner = partners.find((p: any) => p.id === d.partnerId);
      if (partner) {
        const region = partner.region || '其他';
        regionRevenueMap.set(region, (regionRevenueMap.get(region) || 0) + safeNumber(d.value, 0));
      }
    });

    const estimatedMonthlyTarget = getMonthlyTarget(year, currentMonth, targetConfig);
    const regionAchievements: Array<{ name: string; value: number; rate: number }> = [];
    
    regionRevenueMap.forEach((value, name) => {
      const regionTarget = estimatedMonthlyTarget * (regionMap.get(name) || 1);
      regionAchievements.push({
        name,
        value,
        rate: safePercent(value, regionTarget, 0),
      });
    });
    regionAchievements.sort((a, b) => b.value - a.value);

    // ===== 计算 Q1-Q4 季度数据 =====
    const qData: Array<{ quarter: number; current: number; target: number; rate: number }> = [];
    for (let q = 1; q <= 4; q++) {
      const qRevenue = wonDeals
        .filter((d: any) => {
          const date = new Date(d.lastActivityDate || d.createdDate);
          return date.getFullYear() === year && Math.ceil((date.getMonth() + 1) / 3) === q;
        })
        .reduce((sum, d) => sum + safeNumber(d.value, 0), 0);
      const qTarget = targetConfig.quarterlyTargets[q] || targetConfig.yearlyTarget / 4;
      qData.push({
        quarter: q,
        current: qRevenue,
        target: qTarget,
        rate: safePercent(qRevenue, qTarget, 0),
      });
    }

    // ===== 构建返回数据 =====
    const revenueMetric: CockpitMetric = {
      metric_name: '营收完成度',
      current_value: currentQuarterRevenue,
      yoy: 0,
      qoq: monthlyData.length >= 2
        ? safePercent(monthlyData[monthlyData.length - 1].value - monthlyData[monthlyData.length - 2].value, Math.max(monthlyData[monthlyData.length - 2].value, 1), 0)
        : 0,
      mom: monthlyData[monthlyData.length - 1]?.qoq || 0,
      linear_rate: safePercent(currentQuarterRevenue, quarterlyTarget, 0),
      achievements: {
        monthly: {
          current: monthlyData[monthlyData.length - 1]?.value || 0,
          target: estimatedMonthlyTarget,
          rate: safePercent(monthlyData[monthlyData.length - 1]?.value || 0, estimatedMonthlyTarget, 0),
        },
        quarterly: {
          current: currentQuarterRevenue,
          target: quarterlyTarget,
          rate: safePercent(currentQuarterRevenue, quarterlyTarget, 0),
        },
        yearly: {
          current: yearlyRevenue,
          target: targetConfig.yearlyTarget,
          rate: safePercent(yearlyRevenue, targetConfig.yearlyTarget, 0),
        },
        q1: { current: qData[0]?.current || 0, target: qData[0]?.target || 0, rate: clamp(qData[0]?.rate || 0, 0, 999) },
        q2: { current: qData[1]?.current || 0, target: qData[1]?.target || 0, rate: clamp(qData[1]?.rate || 0, 0, 999) },
        q3: { current: qData[2]?.current || 0, target: qData[2]?.target || 0, rate: clamp(qData[2]?.rate || 0, 0, 999) },
        q4: { current: qData[3]?.current || 0, target: qData[3]?.target || 0, rate: clamp(qData[3]?.rate || 0, 0, 999) },
      },
      monthly_data: monthlyData,
      dimensional_achievements: [
        { type: 'region', data: regionAchievements.map(r => ({ name: r.name, current: r.value, target: estimatedMonthlyTarget, rate: clamp(r.rate, 0, 999) })) },
      ],
      time_health: timeHealth,
    };

    const activePartnersMetric: CockpitMetric = {
      metric_name: '活跃伙伴数',
      current_value: activeCount,
      total_partners: totalPartners,
      yoy: 0,
      qoq: 0,
      mom: 0,
      linear_rate: safePercent(activeCount, totalPartners, 0),
      achievements: {
        monthly: { current: activeCount, target: totalPartners, rate: safePercent(activeCount, totalPartners, 0) },
        quarterly: { current: activeCount, target: totalPartners, rate: safePercent(activeCount, totalPartners, 0) },
        yearly: { current: activeCount, target: totalPartners, rate: safePercent(activeCount, totalPartners, 0) },
      },
      monthly_data: [],
      partner_ecosystem_details: {
        coverage: {
          total: totalPartners,
          new_month: 0,
          new_quarter: 0,
          churn_quarter: 0,
          growth_rate: 0,
          yoy_quarter: 0,
          qoq_quarter: 0,
        },
        regional_coverage: regionAchievements.map(r => ({ region: r.name, partner_count: regionMap.get(r.name) || 0, city_count: 0, new_cities: [] })),
        tier_funnel: [
          { tier: '铂金/钻石', count: partners.filter((p: any) => ['Diamond', 'Platinum'].includes(p.tier)).length, percentage: safePercent(partners.filter((p: any) => ['Diamond', 'Platinum'].includes(p.tier)).length, totalPartners, 0) },
          { tier: '金牌', count: partners.filter((p: any) => p.tier === 'Gold').length, percentage: safePercent(partners.filter((p: any) => p.tier === 'Gold').length, totalPartners, 0) },
          { tier: '银牌', count: partners.filter((p: any) => p.tier === 'Silver').length, percentage: safePercent(partners.filter((p: any) => p.tier === 'Silver').length, totalPartners, 0) },
          { tier: '标准', count: partners.filter((p: any) => !p.tier || p.tier === 'Standard').length, percentage: safePercent(partners.filter((p: any) => !p.tier || p.tier === 'Standard').length, totalPartners, 0) },
        ],
        contribution_mix: { top_percent: 0, revenue_percent: 0 },
        health_radar: {
          coverage: partnerHealthSummary.avgTierScore,
          activity: partnerHealthSummary.avgActivityScore,
          capability: partnerHealthSummary.avgPipelineScore,
          will: partnerHealthSummary.avgRevenueScore,
        },
      },
      active_split: {
        order_placing: { value: activeCount, target: totalPartners, rate: safePercent(activeCount, totalPartners, 0), yoy: 0, qoq: 0 },
        leads_reporting: { value: pipelineMetrics.totalCount, target: totalPartners, rate: safePercent(pipelineMetrics.totalCount, totalPartners, 0), yoy: 0, qoq: 0 },
        pmdf_partners: { value: applications.filter((a: any) => a?.program_type === 'PMDF' || a?.type === 'PMDF').length, target: totalPartners, rate: safePercent(applications.filter((a: any) => a?.program_type === 'PMDF' || a?.type === 'PMDF').length, totalPartners, 0), yoy: 0, qoq: 0 },
        incentive_participants: { value: applications.length, target: totalPartners, rate: safePercent(applications.length, totalPartners, 0), yoy: 0, qoq: 0 },
      },
      partner_health_summary: partnerHealthSummary,
    };

    // ===== Pipeline 指标（使用 Metric Engine，修复 ∞ 问题）=====
    const pipelineDiagnoses = diagnosePipeline(pipelineMetrics);
    const pipelineMetric: CockpitMetric = {
      metric_name: '商机报备与流转',
      current_value: pipelineMetrics.totalValue,
      yoy: 0,
      qoq: 0,
      mom: 0,
      linear_rate: clamp(pipelineMetrics.coverageRatio, 0, 999),
      achievements: {
        monthly: { current: pipelineMetrics.totalValue, target: estimatedMonthlyTarget * 2, rate: clamp(safePercent(pipelineMetrics.totalValue, estimatedMonthlyTarget * 2, 0), 0, 999) },
        quarterly: { current: pipelineMetrics.totalValue, target: quarterlyTarget * 2, rate: clamp(safePercent(pipelineMetrics.totalValue, quarterlyTarget * 2, 0), 0, 999) },
        yearly: { current: pipelineMetrics.totalValue, target: targetConfig.yearlyTarget * 2, rate: clamp(safePercent(pipelineMetrics.totalValue, targetConfig.yearlyTarget * 2, 0), 0, 999) },
      },
      monthly_data: [],
      pipeline_batch: {
        current_q_target: quarterlyTarget * 2,
        next_q_count: pipelineMetrics.totalCount,
        new_in_q_ratio: clamp(pipelineMetrics.newInQuarterRatio, 0, 100),
        historical_ratio: clamp(pipelineMetrics.historicalRatio, 0, 100),
        historical_amount: pipelineMetrics.historicalValue,
        new_amount: pipelineMetrics.newInQuarterValue,
      },
    };

    // ===== 线索转化率 =====
    const leadsDeals = deals.filter((d: any) =>
      d.stage === 'Lead' || d.stage === 'Prospect' || d.stage === 'Qualification'
    );
    const totalLeads = leadsDeals.length + pipelineMetrics.totalCount;
    const conversionRate = safePercent(wonDeals.length, Math.max(totalLeads, 1), 0);

    const leadsConversionMetric: CockpitMetric = {
      metric_name: '线索转化率',
      current_value: conversionRate,
      yoy: 0,
      qoq: 0,
      mom: 0,
      linear_rate: clamp(conversionRate, 0, 100),
      achievements: {
        monthly: { current: conversionRate, target: 30, rate: clamp(safePercent(conversionRate, 30, 0), 0, 999) },
        quarterly: { current: conversionRate, target: 30, rate: clamp(safePercent(conversionRate, 30, 0), 0, 999) },
        yearly: { current: conversionRate, target: 30, rate: clamp(safePercent(conversionRate, 30, 0), 0, 999) },
      },
      monthly_data: [],
      conversion_details: {
        cycle_days: pipelineMetrics.avgSalesCycle,
        funnel_stages: pipelineMetrics.stageBreakdown.map(s => ({ stage: s.stage, count: s.count })),
      },
    };

    const marketingMetric: CockpitMetric = {
      metric_name: '营销与激励',
      current_value: safeSum(applications.map((a: any) => safeNumber(a.total_amount || 0, 0))),
      yoy: 0,
      qoq: 0,
      mom: 0,
      linear_rate: 0,
      achievements: {
        monthly: { current: 0, target: 0, rate: 0 },
        quarterly: { current: 0, target: 0, rate: 0 },
        yearly: { current: 0, target: 0, rate: 0 },
      },
      monthly_data: [],
    };

    // ===== 生成 Insights（基于诊断）=====
    const insights: CockpitData['insights'] = [];

    if (timeHealth.healthStatus === 'danger') {
      insights.push({
        type: 'risk',
        title: '营收严重滞后',
        content: `时间进度 ${timeHealth.timeProgress}%，但营收仅完成 ${timeHealth.healthScore}%，差距 ${timeHealth.gapPercent}%`,
        actionLabel: '查看商机列表',
        actionId: 'view-deals',
        priority: 'high',
      });
    } else if (timeHealth.healthStatus === 'at_risk') {
      insights.push({
        type: 'risk',
        title: '营收进度偏慢',
        content: `健康度 ${timeHealth.healthScore}%，低于预期节奏`,
        actionLabel: '查看高潜商机',
        actionId: 'view-high-potential',
        priority: 'medium',
      });
    }

    if (pipelineMetrics.coverageRatio < 100) {
      insights.push({
        type: 'risk',
        title: 'Pipeline 储备不足',
        content: `加权 Pipeline 仅覆盖季度目标的 ${formatPercent(pipelineMetrics.coverageRatio)}%`,
        actionLabel: '拓展新商机',
        actionId: 'expand-pipeline',
        priority: 'high',
      });
    }

    if (partnerHealthSummary.criticalCount > 0) {
      insights.push({
        type: 'risk',
        title: `${partnerHealthSummary.criticalCount} 家伙伴处于危险状态`,
        content: `建议优先关注危险伙伴，制定激活或淘汰策略`,
        actionLabel: '查看危险伙伴',
        actionId: 'view-critical-partners',
        priority: 'high',
      });
    }

    return {
      revenue: revenueMetric,
      activePartners: activePartnersMetric,
      pipeline: pipelineMetric,
      leadsConversion: leadsConversionMetric,
      marketing: marketingMetric,
      insights,
    };

  } catch (error) {
    console.error('[realCockpitData] Error fetching data:', error);
    return {
      revenue: emptyMetric('营收完成度'),
      activePartners: emptyMetric('活跃伙伴数'),
      pipeline: emptyMetric('商机报备与流转'),
      leadsConversion: emptyMetric('线索转化率'),
      marketing: emptyMetric('营销与激励'),
      insights: [],
    };
  }
}