// ══════════════════════════════════════════════════════════════════════════
// Marketing ROI Engine — 营销杠杆率 + CPL + 低效活动识别
// 核心：从 MDF 到 Lead 的全链路追踪
// ══════════════════════════════════════════════════════════════════════════

import { supabase } from './supabase';

// ── 类型定义 ──────────────────────────────────────────

export interface CampaignROI {
  campaignId: string;
  campaignName: string;
  campaignType: string;
  mdfInvestment: number;       // MDF 投入
  leadsGenerated: number;       // 产生线索数
  dealsCreated: number;         // 关联商机数
  dealValue: number;            // 关联商机总额
  roi: number;                  // ROI (倍数)
  cpl: number;                  // 单线索成本
  conversionRate: number;       // 线索→商机转化率
  isLowEfficiency: boolean;     // 是否低效
  alert: string | null;        // 诊断预警
}

export interface MarketingDiagnosis {
  type: 'low_roi' | 'high_cpl' | 'low_conversion' | 'budget_warning';
  title: string;
  content: string;
  severity: 'high' | 'medium' | 'low';
  tags: string[];
}

export interface MarketingROISummary {
  totalMDF: number;
  totalDealsValue: number;
  overallROI: number;
  avgCPL: number;
  campaigns: CampaignROI[];
  diagnoses: MarketingDiagnosis[];
}

// ── 1. ROI 计算 ───────────────────────────────────────
// ROI = 关联商机总金额 / MDF 基金投入总额
// CPL = MDF 投入总额 / 产生线索总数
export function computeCampaignROI(
  campaignId: string,
  campaignName: string,
  campaignType: string,
  mdfInvestment: number,
  leadsGenerated: number,
  dealsCreated: number,
  dealValue: number
): CampaignROI {
  const roi = mdfInvestment > 0 ? Math.round((dealValue / mdfInvestment) * 100) / 100 : 0;
  const cpl = leadsGenerated > 0 ? Math.round((mdfInvestment / leadsGenerated) * 100) / 100 : 0;
  const conversionRate = leadsGenerated > 0 ? Math.round((dealsCreated / leadsGenerated) * 100) : 0;

  // 低效判断: CPL > 2000 或 ROI < 0.5 或 转化率 < 5%
  const isLowEfficiency = cpl > 2000 || (roi > 0 && roi < 0.5) || (dealsCreated > 0 && conversionRate < 5);

  let alert: string | null = null;
  if (isLowEfficiency) {
    if (roi < 0.3) {
      alert = `「${campaignName}」ROI 仅 ${roi}x，建议停止此类活动，转向线上 SOP 赋能`;
    } else if (cpl > 5000) {
      alert = `「${campaignName}」单线索成本 ¥${cpl}，高于平均 2 倍，建议优化投放渠道`;
    } else if (conversionRate < 5) {
      alert = `「${campaignName}」线索转化率仅 ${conversionRate}%，跟进率不足，建议加强销售跟进`;
    }
  }

  return {
    campaignId, campaignName, campaignType,
    mdfInvestment, leadsGenerated, dealsCreated, dealValue,
    roi, cpl, conversionRate, isLowEfficiency, alert,
  };
}

// ── 2. 营销诊断 ───────────────────────────────────────
export function diagnoseMarketing(campaigns: CampaignROI[]): MarketingDiagnosis[] {
  const diagnoses: MarketingDiagnosis[] = [];

  const lowEfficiency = campaigns.filter(c => c.isLowEfficiency);
  if (lowEfficiency.length > 0) {
    diagnoses.push({
      type: 'low_roi',
      title: `${lowEfficiency.length} 个活动 ROI 低于健康线`,
      content: lowEfficiency.slice(0, 3).map(c => `「${c.campaignName}」ROI ${c.roi}x，CPL ¥${c.cpl}`).join('；'),
      severity: 'high',
      tags: ['低效活动', 'ROI预警'],
    });
  }

  const highCPL = campaigns.filter(c => c.cpl > 5000);
  if (highCPL.length > 0) {
    diagnoses.push({
      type: 'high_cpl',
      title: `${highCPL.length} 个活动单线索成本过高`,
      content: `平均 CPL ¥${Math.round(highCPL.reduce((s, c) => s + c.cpl, 0) / highCPL.length)}，建议优化投放策略`,
      severity: 'medium',
      tags: ['成本过高', 'CPL预警'],
    });
  }

  // 总预算预警
  const totalMDF = campaigns.reduce((s, c) => s + c.mdfInvestment, 0);
  const totalDeals = campaigns.reduce((s, c) => s + c.dealValue, 0);
  if (totalMDF > 0 && totalDeals < totalMDF * 0.5) {
    diagnoses.push({
      type: 'budget_warning',
      title: '营销投入产出比偏低',
      content: `累计投入 ¥${(totalMDF / 10000).toFixed(0)}万，产出商机 ¥${(totalDeals / 10000).toFixed(0)}万，整体 ROI ${(totalDeals / totalMDF).toFixed(1)}x`,
      severity: 'warning' as any,
      tags: ['预算预警', 'ROI'],
    });
  }

  return diagnoses;
}

// ── 3. 数据消毒器 ─────────────────────────────────────
export function sanitizeMetric(value: number, fallback: number = 0): number {
  if (value === null || value === undefined || isNaN(value)) return fallback;
  if (!isFinite(value)) return 100;
  return Math.round(value * 10) / 10;
}

export function sanitizeROIData(data: CampaignROI): CampaignROI {
  return {
    ...data,
    roi: sanitizeMetric(data.roi),
    cpl: sanitizeMetric(data.cpl),
    conversionRate: sanitizeMetric(data.conversionRate),
    mdfInvestment: sanitizeMetric(data.mdfInvestment),
    leadsGenerated: sanitizeMetric(data.leadsGenerated),
    dealsCreated: sanitizeMetric(data.dealsCreated),
    dealValue: sanitizeMetric(data.dealValue),
  };
}

// ── 4. 跨模块联动 ─────────────────────────────────────
export function computePartnerMarketingScore(
  campaignCount: number,
  totalMDFUsed: number,
  leadsGenerated: number,
  dealsFromMarketing: number
): { marketActivity: number; incentiveExecution: number; businessInteraction: number } {
  return {
    marketActivity: Math.min(100, campaignCount * 8),
    incentiveExecution: Math.min(100, Math.round(totalMDFUsed / 10000)),
    businessInteraction: Math.min(100, dealsFromMarketing * 10),
  };
}

// ── 5. 从数据库读取 ───────────────────────────────────
export async function fetchMarketingROI(): Promise<MarketingROISummary> {
  const [{ data: activities }, { data: deals }] = await Promise.all([
    supabase.from('marketing_activities').select('*'),
    supabase.from('deals').select('value, partner_id, stage, origin_activity_id'),
  ]);

  const allActivities = (activities || []) as any[];
  const allDeals = (deals || []) as any[];

  const campaigns: CampaignROI[] = allActivities.map(a => {
    const relatedDeals = allDeals.filter((d: any) =>
      d.origin_activity_id === a.id || d.partner_id === a.partner_id
    );
    const dealsCreated = relatedDeals.length;
    const dealValue = relatedDeals.reduce((s: number, d: any) => s + Number(d.value || 0), 0);
    const leadsGenerated = Number(a.leads_generated || 0);

    const roi = computeCampaignROI(
      a.id, a.name || '未命名活动', a.type || '活动',
      Number(a.budget || 0), leadsGenerated, dealsCreated, dealValue
    );
    return sanitizeROIData(roi);
  });

  const totalMDF = campaigns.reduce((s, c) => s + c.mdfInvestment, 0);
  const totalDealsValue = campaigns.reduce((s, c) => s + c.dealValue, 0);
  const overallROI = totalMDF > 0 ? sanitizeMetric(totalDealsValue / totalMDF) : 0;
  const avgCPL = campaigns.length > 0
    ? sanitizeMetric(campaigns.reduce((s, c) => s + c.cpl, 0) / campaigns.length)
    : 0;
  const diagnoses = diagnoseMarketing(campaigns);

  return { totalMDF, totalDealsValue, overallROI, avgCPL, campaigns, diagnoses };
}
