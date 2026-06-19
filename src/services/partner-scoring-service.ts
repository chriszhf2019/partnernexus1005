
// ─────────────────────────────────────────────────────────────────────────────
// Partner Scoring Service (v2.1)
// ─────────────────────────────────────────────────────────────────────────────
// 集中管理伙伴评分推算逻辑
//
// 核心设计：
// 1. 基于真实业务数据计算 (项目/商机/行业/产品/资源/市场)
// 2. 分 tier 基线校准 —— 高等级伙伴用更高期望基线
// 3. 负反馈机制 —— 长期无 pipeline / 无认证 / 无 MDF 使用 / 非合作状态 扣分
// 4. 动态配置支持 —— 从数据库加载权重和阈值，支持运行时调整
// 5. 工具函数和评分函数分离，支持按需调用
//
// 能力画像 6 维度（基于真实业务数据）：
// - 项目交付：基于赢单数、总营收、项目规模
// - 销售拓展：基于商机数量、赢单率、Pipeline 金额
// - 行业深耕：基于覆盖行业数量和分布
// - 产品方案：基于产品类型覆盖和分布
// - 资源配置：基于团队规模和投入任务
// - 市场活跃：基于 MDF 使用和市场活动参与
// ─────────────────────────────────────────────────────────────────────────────

import type { Partner, PartnerDetails, Deal } from '../types';
import type { PartnerStaff } from '../types';
import type { ScoringConfig, GrowthConfidence, PartnerTrainingRecord } from '../types/config';
import { scoringConfigService } from './config-service';

// ─────────────────────────────────────────────────────────────────────────────
// 1. 静态默认值（用于缓存和降级）
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_TIER_BASELINE: Record<string, number> = {
  Diamond: 80, Platinum: 70, Gold: 58, Silver: 45,
  Standard: 35, Registered: 25, default: 40,
};

const DEFAULT_TIER_CERT_EXPECTATION: Record<string, number> = {
  Diamond: 15, Platinum: 10, Gold: 6, Silver: 3,
  Standard: 2, Registered: 1, default: 3,
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. 工具函数
// ─────────────────────────────────────────────────────────────────────────────

const clamp = (v: number, min = 0, max = 100): number => Math.max(min, Math.min(max, v));
const round = (v: number): number => Math.round(v);

/** 获取 tier 基线 */
const getTierBaseline = (tier: string, config?: ScoringConfig): number => {
  const baseline = config?.tierBaseline ?? DEFAULT_TIER_BASELINE;
  return baseline[tier] ?? baseline.default ?? 40;
};

/** 获取 tier 的认证工程师期望 */
const getTierCertExpectation = (tier: string, config?: ScoringConfig): number => {
  const expectation = config?.tierCertExpectation ?? DEFAULT_TIER_CERT_EXPECTATION;
  return expectation[tier] ?? expectation.default ?? 3;
};

/** 判断伙伴是否在"活跃运营状态" */
const isActive = (partner: PartnerDetails): boolean => partner.status === 'Cooperating';

/** 统一获取 pipeline 赢单率 */
const getPipelineHealth = (partner: PartnerDetails): number => {
  if (partner.pipeline.registered === 0) return 0;
  return clamp(round((partner.pipeline.won / partner.pipeline.registered) * 100));
};

/** 获取 MDF 使用率 */
const getMdfPct = (partner: PartnerDetails): number => {
  if (partner.mdf.total <= 0) return 0;
  return clamp(round((partner.mdf.used / partner.mdf.total) * 100));
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. 负反馈机制（扣分）
// ─────────────────────────────────────────────────────────────────────────────

/** 计算伙伴的负反馈扣分（基于长期无投入的信号） */
export function getNegativePenalty(partner: PartnerDetails, config?: ScoringConfig): number {
  const penalty = config?.negativePenalty;
  
  let totalPenalty = 0;

  // 长期无 pipeline 报备
  if (isActive(partner) && partner.pipeline.registered === 0 && partner.years >= (penalty?.noPipelineYears ?? 1)) {
    totalPenalty += penalty?.noPipelinePenalty ?? 15;
  }

  // 长期无认证工程师
  if (isActive(partner) && partner.enablement.certifiedEngineers === 0 && partner.years >= (penalty?.noCertEngineersYears ?? 2)) {
    totalPenalty += penalty?.noCertPenalty ?? 10;
  }

  // 有 MDF 预算但未使用
  if (partner.mdf.total > 0 && partner.mdf.used === 0 && partner.years >= (penalty?.noMdfYears ?? 1)) {
    totalPenalty += penalty?.noMdfPenalty ?? 8;
  }

  // 非合作状态
  if (!isActive(partner)) {
    totalPenalty += penalty?.inactivePenalty ?? 25;
  }

  // 低赢单率持续存在
  if (partner.winRate < 20 && partner.years > 1 && partner.pipeline.registered > 0) {
    totalPenalty += penalty?.lowWinRatePenalty ?? 8;
  }

  return Math.min(totalPenalty, penalty?.maxPenalty ?? 50);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. PartnerList 聚合指标：同比/环比增长 + 激励执行率
// ─────────────────────────────────────────────────────────────────────────────

export interface MonthlyGrowthResult {
  monthNew: number;
  monthLost: number;
  yoyGrowth: number | null;
  qoqGrowth: number | null;
  incentiveExecution: number | null;
}

/** 基于伙伴 startDate 时间分布计算同比/环比增长 */
export function calculateMonthlyGrowth(partners: any[]): MonthlyGrowthResult {
  if (partners.length === 0) {
    return { monthNew: 0, monthLost: 0, yoyGrowth: null, qoqGrowth: null, incentiveExecution: null };
  }

  const now = new Date();

  // 本月新增
  const newThisMonth = partners.filter(p => {
    const start = new Date(p.startDate || '');
    if (isNaN(start.getTime())) return false;
    return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();
  }).length;

  // 本月流失
  const lostThisMonth = partners.filter(p => {
    const inactiveDate = p.inactiveDate;
    if (!inactiveDate) return false;
    const d = new Date(inactiveDate);
    if (isNaN(d.getTime())) return false;
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // 同比增长（预估）
  const lastYearSameMonth = partners.filter(p => {
    const start = new Date(p.startDate || '');
    if (isNaN(start.getTime())) return false;
    return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear() - 1;
  }).length;
  const twoYearsAgoSameMonth = partners.filter(p => {
    const start = new Date(p.startDate || '');
    if (isNaN(start.getTime())) return false;
    return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear() - 2;
  }).length;

  let yoyGrowth: number | null = null;
  const baseline = lastYearSameMonth > 0 ? lastYearSameMonth : twoYearsAgoSameMonth;
  if (baseline > 0) {
    yoyGrowth = round(((newThisMonth - baseline) / baseline) * 100);
  } else if (newThisMonth > 0) {
    yoyGrowth = 100;
  }

  // 环比增长（预估）
  const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const lastMonthNew = partners.filter(p => {
    const start = new Date(p.startDate || '');
    if (isNaN(start.getTime())) return false;
    return start.getMonth() === lastMonth && start.getFullYear() === lastMonthYear;
  }).length;

  let qoqGrowth: number | null = null;
  if (lastMonthNew > 0) {
    qoqGrowth = round(((newThisMonth - lastMonthNew) / lastMonthNew) * 100);
  } else if (newThisMonth > 0) {
    qoqGrowth = 100;
  }

  // 激励执行率（预估）
  let mdfUsageSum = 0;
  let mdfPartnersCount = 0;
  let certifiedCount = 0;
  let activeMarketingCount = 0;

  partners.forEach((p: any) => {
    if (p.mdf && p.mdf.total > 0) {
      mdfUsageSum += clamp(round((p.mdf.used / p.mdf.total) * 100));
      mdfPartnersCount++;
    }
    if (p.enablement && p.enablement.certifiedEngineers > 0) {
      certifiedCount++;
    }
    if (p.marketingActivities && p.marketingActivities > 0) {
      activeMarketingCount++;
    }
  });

  const mdfScore = mdfPartnersCount > 0 ? mdfUsageSum / mdfPartnersCount : 0;
  const certificationScore = (certifiedCount / partners.length) * 100;
  const marketingScore = (activeMarketingCount / partners.length) * 100;
  const incentiveExecution = round(mdfScore * 0.4 + certificationScore * 0.3 + marketingScore * 0.3);

  return { monthNew: newThisMonth, monthLost: lostThisMonth, yoyGrowth, qoqGrowth, incentiveExecution };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. 单个伙伴健康度评分（PartnerProfile 四支柱 + 增长力）
// ─────────────────────────────────────────────────────────────────────────────

export interface PartnerHealthScores {
  activity: number;
  capability: number;
  loyalty: number;
  pipelineHealth: number;
  growth: number | null;
  overall: number;
  churnRisk: number;
  churnLevel: '低' | '中' | '高';
  churnColor: 'success' | 'warning' | 'danger';
  tierBenchmark: number;
}

/** 计算单个伙伴的四支柱健康度评分 */
export function calculatePartnerHealthScores(partner: PartnerDetails, config?: ScoringConfig): PartnerHealthScores {
  const tierBaseline = getTierBaseline(partner.tier, config);
  const mdfPct = getMdfPct(partner);
  const negativePenalty = getNegativePenalty(partner, config);

  // 活跃度
  const pipelineRegisteredScore = partner.pipeline.registered > 0 ? 35 : 0;
  const certBonusScore = Math.min(25, partner.enablement.certifiedEngineers * 4);
  const winRateScore = Math.min(25, partner.winRate * 0.5);
  const mdfActivityScore = mdfPct > 0 ? 15 : 0;
  const activity = clamp(round(pipelineRegisteredScore + certBonusScore + winRateScore + mdfActivityScore) - negativePenalty);

  // 能力度
  const certEngineerScore = Math.min(50, partner.enablement.certifiedEngineers * 5);
  const specialistScore = Math.min(30, partner.enablement.specialists * 8);
  const winRateCapabilityScore = Math.min(20, partner.winRate * 0.4);
  const capability = clamp(round(certEngineerScore + specialistScore + winRateCapabilityScore) - negativePenalty);

  // 忠诚度
  const yearScore = Math.min(40, partner.years * 10);
  const tierScore = partner.tier === 'Diamond' ? 45 : partner.tier === 'Platinum' ? 40 : partner.tier === 'Gold' ? 30 : 15;
  const corePartnerBonus = partner.isCorePartner ? 15 : 0;
  const loyalty = clamp(yearScore + tierScore + corePartnerBonus);

  // Pipeline 健康度
  const pipelineHealth = getPipelineHealth(partner);

  // 增长力（预估）
  const healthWeights = config?.healthWeights ?? { activity: 0.25, capability: 0.25, loyalty: 0.20, pipelineHealth: 0.15, growth: 0.15 };
  const growthWeights = config?.growthWeights ?? { years: 0.15, pipeline: 0.40, certification: 0.30, mdf: 0.15 };
  
  const yearGrowthScore = partner.years <= 2 ? 80 : partner.years <= 5 ? 60 : 40;
  const pipelineGrowthScore = pipelineHealth;
  const certExpected = getTierCertExpectation(partner.tier, config);
  const certGrowthScore = clamp(round((partner.enablement.certifiedEngineers / certExpected) * 70 + partner.enablement.specialists * 8));
  const mdfGrowthScore = mdfPct;
  
  const growth = round(
    yearGrowthScore * growthWeights.years +
    pipelineGrowthScore * growthWeights.pipeline +
    certGrowthScore * growthWeights.certification +
    mdfGrowthScore * growthWeights.mdf
  );

  // 综合评分
  const overall = round(
    activity * healthWeights.activity +
    capability * healthWeights.capability +
    loyalty * healthWeights.loyalty +
    pipelineHealth * healthWeights.pipelineHealth +
    growth * healthWeights.growth
  );

  // 流失风险
  const churnConfig = config?.churnThresholds;
  let churnRisk = 0;
  if (!isActive(partner)) churnRisk += churnConfig?.notCooperating ?? 35;
  if (partner.enablement.expiryRiskCount > (churnConfig?.expiryThreshold ?? 2)) churnRisk += churnConfig?.expiryBonus ?? 20;
  if (partner.pipeline.registered < 1) churnRisk += churnConfig?.pipelineLow ?? 20;
  if (partner.winRate < (churnConfig?.winRateThreshold ?? 40)) churnRisk += churnConfig?.winRateLow ?? 15;
  if (mdfPct < (churnConfig?.mdfThreshold ?? 30) && partner.mdf.total > 0) churnRisk += churnConfig?.mdfLow ?? 10;
  churnRisk = Math.min(100, churnRisk);

  let churnLevel: '低' | '中' | '高' = '低';
  let churnColor: 'success' | 'warning' | 'danger' = 'success';
  if (churnRisk >= 50) { churnLevel = '高'; churnColor = 'danger'; }
  else if (churnRisk >= 25) { churnLevel = '中'; churnColor = 'warning'; }

  return { activity, capability, loyalty, pipelineHealth, growth, overall, churnRisk, churnLevel, churnColor, tierBenchmark: tierBaseline };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. 多维评估矩阵
// ─────────────────────────────────────────────────────────────────────────────

export interface EvaluationMatrixRow {
  dim: string;
  score: number;
  benchmark: number;
  trend: number;
  rank: string;
  note: string;
}

/** 计算 6 维评估矩阵 */
export function calculateEvaluationMatrix(partner: PartnerDetails, ecosystemPartnerCount: number = 0, config?: ScoringConfig): EvaluationMatrixRow[] {
  const mdfPct = getMdfPct(partner);
  const tierBaseline = getTierBaseline(partner.tier, config);
  const negativePenalty = getNegativePenalty(partner, config);

  const revenueScore = clamp(round(partner.winRate * 1.2) - Math.round(negativePenalty * 0.5));
  const conversionScore = clamp(round(
    partner.pipeline.registered > 0
      ? (partner.pipeline.commercial + partner.pipeline.solution) / partner.pipeline.registered * 100
      : 30 - negativePenalty
  ));
  const satisfactionScore = clamp(50 + (partner.pipeline.won > 0 ? 30 : 0) + (partner.years * 2) - negativePenalty);
  const techScore = clamp(partner.enablement.certifiedEngineers * 10 + partner.enablement.specialists * 15 - Math.round(negativePenalty * 0.5));
  const ecosystemScore = clamp(ecosystemPartnerCount * 25 + (partner.pipeline.won > 0 ? 20 : 0));
  const innovationScore = clamp(round(mdfPct * 0.6 + (partner.isCorePartner || partner.tier === 'Diamond' || partner.tier === 'Platinum' ? 30 : 0)));

  return [
    { dim: '营收贡献(预估)', score: revenueScore, benchmark: Math.max(72, tierBaseline), trend: revenueScore - Math.max(72, tierBaseline), rank: revenueScore >= 80 ? 'Top 15%' : revenueScore >= 60 ? 'Top 45%' : '待提升', note: revenueScore >= 80 ? '赢单率表现突出，营收贡献健康' : '当前 Pipeline 转化可进一步提升' },
    { dim: '商机转化(预估)', score: conversionScore, benchmark: Math.max(70, tierBaseline - 5), trend: conversionScore - Math.max(70, tierBaseline - 5), rank: conversionScore >= 80 ? 'Top 15%' : conversionScore >= 60 ? 'Top 45%' : '待提升', note: conversionScore >= 70 ? '商机转化效率健康' : '方案→商务转化率存在提升空间' },
    { dim: '客户满意度(预估)', score: satisfactionScore, benchmark: Math.max(78, tierBaseline), trend: satisfactionScore - Math.max(78, tierBaseline), rank: satisfactionScore >= 80 ? 'Top 15%' : satisfactionScore >= 60 ? 'Top 45%' : '待提升', note: satisfactionScore >= 80 ? '合作关系稳定，客户反馈积极' : '需加强客户互动和关系维护' },
    { dim: '技术能力(预估)', score: techScore, benchmark: Math.max(68, tierBaseline - 10), trend: techScore - Math.max(68, tierBaseline - 10), rank: techScore >= 80 ? 'Top 15%' : techScore >= 60 ? 'Top 45%' : '待提升', note: techScore >= 70 ? `现有认证储备${partner.enablement.certifiedEngineers}人，技术基础良好` : '建议增加技术培训投入' },
    { dim: '生态贡献(预估)', score: ecosystemScore, benchmark: 55, trend: ecosystemScore - 55, rank: ecosystemScore >= 80 ? 'Top 15%' : ecosystemScore >= 60 ? 'Top 45%' : '待提升', note: ecosystemScore >= 60 ? `现有${ecosystemPartnerCount}个生态协作关系，网络价值显现` : '建议拓展生态合作网络' },
    { dim: '创新投入(预估)', score: innovationScore, benchmark: 45, trend: innovationScore - 45, rank: innovationScore >= 80 ? 'Top 15%' : innovationScore >= 60 ? 'Top 45%' : '待提升', note: innovationScore >= 60 ? `MDF 使用率${mdfPct}%，联合营销投入积极` : '建议增加 MDF 和创新活动参与' },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. 意愿度评估
// ─────────────────────────────────────────────────────────────────────────────

export interface WillingnessScores {
  resourceScore: number;
  capitalScore: number;
  responseScore: number;
  commitmentScore: number;
  trainingScore: number;
  overallScore: number;
}

export function calculateWillingness(partner: PartnerDetails, config?: ScoringConfig): WillingnessScores {
  const negativePenalty = getNegativePenalty(partner, config);
  const weights = config?.willingnessWeights ?? { resource: 0.20, capital: 0.15, response: 0.20, commitment: 0.25, training: 0.20 };

  const resourceScore = clamp(50 + (partner.pipeline.registered > 0 ? 30 : 0) + (partner.isCorePartner || partner.tier === 'Diamond' || partner.tier === 'Platinum' ? 20 : 0) - negativePenalty * 0.5);
  const capitalScore = clamp(30 + getMdfPct(partner) - negativePenalty * 0.3);
  const responseScore = clamp(60 + (partner.years * 3) + (partner.tier === 'Diamond' || partner.tier === 'Platinum' ? 15 : 0) - negativePenalty * 0.3);
  const commitmentScore = clamp(50 + (partner.pipeline.won > 0 ? 30 : 0) + (partner.enablement.certifiedEngineers > 0 ? 15 : 0) - negativePenalty * 0.4);
  const trainingScore = clamp(40 + partner.enablement.certifiedEngineers * 8 + partner.enablement.specialists * 12 - negativePenalty * 0.3);

  const overallScore = round(
    resourceScore * weights.resource +
    capitalScore * weights.capital +
    responseScore * weights.response +
    commitmentScore * weights.commitment +
    trainingScore * weights.training
  );

  return { resourceScore, capitalScore, responseScore, commitmentScore, trainingScore, overallScore };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. 能力度评估
// ─────────────────────────────────────────────────────────────────────────────

export interface CapabilityScores {
  totalCapability: number;
  certifiedCount: number;
  implementationSuccess: number;
  realWinRate: number;
  retentionRate: number;
  salesCapability: number;
  techCapability: number;
  deliveryCapability: number;
  marketingCapability: number;
}

export function calculateCapability(partner: PartnerDetails, config?: ScoringConfig): CapabilityScores {
  const negativePenalty = getNegativePenalty(partner, config);

  const certifiedCount = partner.enablement.certifiedEngineers;
  const realWinRate = partner.winRate;
  const totalCapability = clamp(round(40 + partner.enablement.certifiedEngineers * 4 + partner.enablement.specialists * 6 + partner.winRate * 0.3) - negativePenalty);
  const implementationSuccess = clamp(60 + partner.enablement.certifiedEngineers * 3 + partner.enablement.specialists * 5 - negativePenalty * 0.3);
  const retentionRate = clamp(70 + partner.enablement.certifiedEngineers * 2 + (partner.pipeline.won > 0 ? 10 : 0) - negativePenalty * 0.2);
  const salesCapability = clamp(30 + partner.winRate * 0.8 + (partner.pipeline.registered > 0 ? 20 : 0) - negativePenalty * 0.4);
  const techCapability = clamp(40 + partner.enablement.certifiedEngineers * 5 + partner.enablement.specialists * 8 - negativePenalty * 0.3);
  const deliveryCapability = clamp(50 + partner.enablement.certifiedEngineers * 4 + partner.enablement.specialists * 6 - negativePenalty * 0.2);
  const marketingCapability = clamp(30 + partner.enablement.certifiedEngineers * 2 + (partner.isCorePartner || partner.tier === 'Diamond' || partner.tier === 'Platinum' ? 20 : 0) - negativePenalty * 0.3);

  return { totalCapability, certifiedCount, implementationSuccess, realWinRate, retentionRate, salesCapability, techCapability, deliveryCapability, marketingCapability };
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. 业务契合度评估
// ─────────────────────────────────────────────────────────────────────────────

export interface FitScores {
  customerOverlap: number;
  productComplement: number;
  modelSimilarity: number;
  geoMatch: number;
  overallFit: number;
  enterpriseRatio: number;
  govIndustryRatio: number;
}

export function calculateFit(partner: PartnerDetails, config?: ScoringConfig): FitScores {
  const tierBonus = (partner.tier === 'Diamond' || partner.tier === 'Platinum') ? 30 : partner.tier === 'Gold' ? 20 : 10;
  const negativePenalty = getNegativePenalty(partner, config);
  const weights = config?.fitWeights ?? { customerOverlap: 0.30, productComplement: 0.25, modelSimilarity: 0.25, geoMatch: 0.20 };

  const customerOverlap = clamp(50 + tierBonus + (partner.enablement.certifiedEngineers > 5 ? 15 : partner.enablement.certifiedEngineers * 2) - negativePenalty * 0.3);
  const productComplement = clamp(45 + (partner.isCorePartner ? 25 : 10) + partner.enablement.specialists * 8 + (partner.pipeline.won > 0 ? 10 : 0) - negativePenalty * 0.3);
  const modelSimilarity = clamp(60 + (isActive(partner) ? 15 : 0) + (partner.tier === 'Diamond' || partner.tier === 'Platinum' || partner.tier === 'Gold' ? 15 : 5) + partner.years * 2 - negativePenalty * 0.2);
  const geoMatch = clamp(50 + (partner.region && partner.region.length > 0 ? 20 : 0) + partner.enablement.certifiedEngineers * 2 + (partner.pipeline.registered > 0 ? 15 : 0) - negativePenalty * 0.3);
  const overallFit = round(
    customerOverlap * weights.customerOverlap +
    productComplement * weights.productComplement +
    modelSimilarity * weights.modelSimilarity +
    geoMatch * weights.geoMatch
  );
  const enterpriseRatio = clamp(60 + (partner.tier === 'Diamond' || partner.tier === 'Platinum' ? 25 : partner.tier === 'Gold' ? 15 : 5));
  const govIndustryRatio = clamp(40 + (partner.region && (partner.region.includes('华东') || partner.region.includes('华北')) ? 20 : 10) + partner.enablement.certifiedEngineers * 2);

  return { customerOverlap, productComplement, modelSimilarity, geoMatch, overallFit, enterpriseRatio, govIndustryRatio };
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. 符合度评估
// ─────────────────────────────────────────────────────────────────────────────

export interface ComplianceScores {
  isCooperating: boolean;
  qualificationCompliance: number;
  ruleCompliance: number;
  performanceCompliance: number;
  complaintRate: number;
  overallCompliance: number;
  creditLevel: string;
}

export function calculateCompliance(partner: PartnerDetails): ComplianceScores {
  const isCooperatingFlag = isActive(partner);
  const qualificationCompliance = isCooperatingFlag ? 100 : partner.status === 'Prospective' ? 85 : 70;
  const ruleCompliance = clamp(isCooperatingFlag ? 90 + partner.enablement.certifiedEngineers : 80);
  const performanceCompliance = clamp(60 + partner.winRate * 0.5 + (partner.pipeline.won > 0 ? 15 : 0));
  const complaintRate = isCooperatingFlag && partner.enablement.certifiedEngineers > 3 ? 0 : 5;
  const overallCompliance = round((qualificationCompliance + ruleCompliance + performanceCompliance + (100 - complaintRate)) / 4);
  const creditLevel = partner.tier === 'Diamond' ? 'S级' : partner.tier === 'Platinum' ? 'A级' : partner.tier === 'Gold' ? 'B级' : 'C级';

  return { isCooperating: isCooperatingFlag, qualificationCompliance, ruleCompliance, performanceCompliance, complaintRate, overallCompliance, creditLevel };
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. 能力画像六边形（基于真实业务数据）
// ─────────────────────────────────────────────────────────────────────────────

export interface CapabilityRadarItem {
  name: string;
  value: number;
  angle: number;
  color: string;
}

export interface CapabilityRadarResult {
  capabilities: CapabilityRadarItem[];
  weakestCap: CapabilityRadarItem;
  secondWeakestCap: CapabilityRadarItem;
  /** 数据来源：real=真实数据, mixed=部分推算 */
  dataSource: 'real' | 'mixed';
  /** 数据覆盖率统计 */
  dataCoverage: {
    hasDeals: boolean;
    hasStaff: boolean;
    hasMDF: boolean;
    hasVendorQualifications: boolean;
    dealCount: number;
    wonDealCount: number;
    industryCount: number;
    productCount: number;
    staffCount: number;
    vendorCount: number;
    customerCount: number;
  };
}

/**
 * 计算 6 维度能力雷达图（基于真实业务数据）
 * 
 * 6 维度设计：
 * 1. 项目交付 - 基于赢单数、总营收、项目规模
 * 2. 销售拓展 - 基于商机数量、赢单率、Pipeline金额
 * 3. 行业深耕 - 基于覆盖行业数量和分布熵
 * 4. 产品方案 - 基于产品类型覆盖和分布
 * 5. 资源配置 - 基于团队规模和投入任务
 * 6. 市场活跃 - 基于MDF使用和市场活动参与
 */
export function calculateCapabilityRadar(
  partner: PartnerDetails,
  deals?: Deal[],
  staff?: PartnerStaff[]
): CapabilityRadarResult {
  const negativePenalty = getNegativePenalty(partner);
  const penaltyFactor = negativePenalty * 0.2;

  // 从商机列表中聚合行业和产品分布
  const industryDistribution: Record<string, number> = {};
  const productDistribution: Record<string, number> = {};
  let dealCount = 0;
  let wonDealCount = 0;
  let totalDealValue = 0;

  if (deals && deals.length > 0) {
    deals.forEach(deal => {
      dealCount++;
      if (deal.stage === 'ClosedWon' || deal.status === 'Closed Won' || deal.status === 'Converted') {
        wonDealCount++;
      }
      totalDealValue += deal.value || 0;
      if (deal.customerIndustry) {
        industryDistribution[deal.customerIndustry] = (industryDistribution[deal.customerIndustry] || 0) + 1;
      }
      if (deal.productType) {
        productDistribution[deal.productType] = (productDistribution[deal.productType] || 0) + 1;
      }
    });
  }

  // 从伙伴 industries 数组补充行业信息（即使没有商机，也能展示伙伴自报的行业覆盖）
  const partnerIndustries = (partner as any).industries as string[] || [];
  if (partnerIndustries.length > 0) {
    partnerIndustries.forEach(ind => {
      if (!industryDistribution[ind]) industryDistribution[ind] = 0;
      industryDistribution[ind] += 1; // 自报的行业作为"意向覆盖"计数
    });
  }

  // 厂商资质信息
  const vendorQuals = (partner as any).vendorQualifications as Record<string, string> || {};
  const vendorCount = Object.keys(vendorQuals).length;
  // 资质等级权重：金/白金/最高级 > 银/核心 > 合作中/其他
  const calcVendorScore = (level: string): number => {
    if (!level) return 1;
    const l = level.toString().toLowerCase();
    if (l.includes('金') || l.includes('金牌') || l.includes('白金') || l.includes('核心') || l.includes('最高') || l.includes('premier') || l.includes('gold') || l.includes('top')) return 5;
    if (l.includes('银') || l.includes('银牌') || l.includes('认证') || l.includes('silver') || l.includes('authorized')) return 3;
    return 2;
  };
  const vendorScore = Object.values(vendorQuals).reduce((sum, level) => sum + calcVendorScore(level), 0);

  // 计算分布熵（衡量覆盖均匀程度）
  const calcEntropy = (dist: Record<string, number>): number => {
    const values = Object.values(dist);
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    if (sum === 0) return 0;
    return values.reduce((entropy, v) => {
      const p = v / sum;
      return entropy + (p > 0 ? -p * Math.log2(p) : 0);
    }, 0);
  };

  const industryEntropy = calcEntropy(industryDistribution);
  const productEntropy = calcEntropy(productDistribution);

  // 计算各维度得分
  const projectDelivery = clamp(
    20 + // 基础分
    wonDealCount * 8 + // 每个赢单加8分
    (totalDealValue > 0 ? Math.min(30, Math.log10(Math.max(totalDealValue, 1)) * 5) : 0) +
    (partner.tier === 'Diamond' ? 15 : partner.tier === 'Platinum' ? 10 : 0) -
    penaltyFactor
  );

  const salesCoverage = clamp(
    15 +
    Math.min(30, dealCount * 3) +
    (partner.winRate || 0) * 0.5 +
    (partner.pipeline.registered > 0 ? 15 : 0) +
    (partner.pipeline.won > 0 ? 10 : 0) -
    penaltyFactor
  );

  const industryCoverage = clamp(
    10 +
    Math.min(35, Object.keys(industryDistribution).length * 12) +
    industryEntropy * 15 +
    (partner.industry ? 10 : 0) -
    penaltyFactor
  );

  const productCapability = clamp(
    10 +
    Math.min(35, Object.keys(productDistribution).length * 12) +
    productEntropy * 15 +
    Math.min(30, vendorScore * 6) + // 厂商资质加分（上限30）
    (partner.tier === 'Diamond' || partner.tier === 'Platinum' ? 10 : 0) -
    penaltyFactor
  );

  const resourceAllocation = clamp(
    15 +
    Math.min(30, (staff?.length || 0) * 5) +
    (partner.followUps?.length || 0) * 3 +
    (partner.isCorePartner ? 15 : 0) +
    (partner.maturityStage === 'Relational' || partner.maturityStage === 'Symbiotic' ? 10 : 0) -
    penaltyFactor
  );

  const marketActivity = clamp(
    10 +
    getMdfPct(partner) * 0.5 +
    Math.min(20, (partner.marketingActivities || 0) * 4) +
    (partner.mdf.used > 0 ? 15 : 0) +
    (partner.mdf.total > 0 ? 10 : 0) -
    penaltyFactor
  );

  const capabilities: CapabilityRadarItem[] = [
    { name: '项目交付', value: projectDelivery, angle: 300, color: '#52525b' },
    { name: '销售拓展', value: salesCoverage, angle: 0, color: '#2563eb' },
    { name: '行业深耕', value: industryCoverage, angle: 60, color: '#dc2626' },
    { name: '产品方案', value: productCapability, angle: 120, color: '#d97706' },
    { name: '资源配置', value: resourceAllocation, angle: 180, color: '#059669' },
    { name: '市场活跃', value: marketActivity, angle: 240, color: '#7c3aed' },
  ];

  const sorted = [...capabilities].sort((a, b) => a.value - b.value);

  return {
    capabilities,
    weakestCap: sorted[0],
    secondWeakestCap: sorted[1],
    dataSource: (deals && deals.length > 0) || vendorCount > 0 ? 'real' : 'mixed',
    dataCoverage: {
      hasDeals: dealCount > 0,
      hasStaff: (staff?.length || 0) > 0,
      hasMDF: partner.mdf.total > 0,
      hasVendorQualifications: vendorCount > 0,
      dealCount,
      wonDealCount,
      industryCount: Object.keys(industryDistribution).length,
      productCount: Object.keys(productDistribution).length,
      staffCount: staff?.length || 0,
      vendorCount,
      customerCount: ((partner as any).customerPortfolio || []).length,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. 推算解读文案生成器
// ─────────────────────────────────────────────────────────────────────────────

export function generateWillingnessInterpretation(scores: WillingnessScores, partner: PartnerDetails): string {
  const main = scores.overallScore >= 70
    ? `该伙伴意愿度表现良好，现有 Pipeline(${partner.pipeline.registered > 0 ? '有' : '无'}活跃商机)和认证(${partner.enablement.certifiedEngineers}人)显示出较高合作积极性`
    : '该伙伴意愿度有提升空间，建议加强商机共创和技术培训机会';
  const suffix = partner.isCorePartner || partner.tier === 'Diamond' || partner.tier === 'Platinum' ? '，建议维护核心伙伴关系' : '，持续培养晋升潜力';
  return main + suffix + '。';
}

export function generateCapabilityInterpretation(scores: CapabilityScores, partner: PartnerDetails): string {
  return scores.techCapability >= 70
    ? `该伙伴技术能力较强，现有${scores.certifiedCount}名认证工程师，技术储备良好。${scores.salesCapability >= 60 ? '销售能力表现达标' : '销售能力有待加强'}`
    : `该伙伴技术能力有提升空间，当前${scores.certifiedCount}名认证工程师，建议增加技术培训。`;
}

export function generateFitInterpretation(scores: FitScores, partner: PartnerDetails): string {
  return `该伙伴与厂商业务${scores.overallFit >= 80 ? '高度契合' : scores.overallFit >= 60 ? '基本契合' : '契合度有待提升'}，客群画像重合度达${scores.customerOverlap}%，产品组合${scores.productComplement >= 75 ? '互补性强' : '有一定互补空间'}。伙伴等级为${partner.tier}，${scores.modelSimilarity >= 75 ? '商业模式相似，协同效应显著' : '可加强商业合作，提升协同潜力'}。`;
}

export function generateComplianceInterpretation(scores: ComplianceScores, partner: PartnerDetails): string {
  return `该伙伴${scores.isCooperating ? '合规表现良好' : '合规基础已具备'}，资质${scores.qualificationCompliance >= 90 ? '齐全' : '尚在完善'}，业绩达标率${scores.performanceCompliance}%。当前伙伴等级为${partner.tier}，${scores.performanceCompliance >= 80 ? '业绩表现优秀，建议保持' : '有提升空间，建议加强商机跟进'}。`;
}

export function generateRadarGapInterpretation(weakestCap: CapabilityRadarItem, secondWeakest: CapabilityRadarItem, partner: PartnerDetails): { weakest: string; second: string } {
  // 基于新6维度生成建议文案
  const getSuggestion = (capName: string, value: number): string => {
    const suggestions: Record<string, string> = {
      '项目交付': '建议增加项目经验积累，参与更多交付案例',
      '销售拓展': '建议加强商机报备，提升Pipeline活跃度',
      '行业深耕': '建议深耕现有行业，或拓展新行业覆盖',
      '产品方案': '建议加强产品方案能力，增加产品覆盖广度',
      '资源配置': '建议增加团队投入，提升资源配置效率',
      '市场活跃': '建议积极参与MDF和市场活动，提升市场声量',
    };
    return suggestions[capName] || '建议加强该领域能力建设';
  };

  return {
    weakest: `${weakestCap.name}能力仅${weakestCap.value}%——${getSuggestion(weakestCap.name, weakestCap.value)}`,
    second: `${secondWeakest.name}能力${secondWeakest.value}%——${partner.industry ? `在${partner.industry}行业中` : '该领域'}建议优先投入资源提升`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. 统一导出（便于按模块调用）
// ─────────────────────────────────────────────────────────────────────────────

export const partnerScoring = {
  calculateMonthlyGrowth,
  calculatePartnerHealthScores,
  calculateEvaluationMatrix,
  calculateWillingness,
  calculateCapability,
  calculateFit,
  calculateCompliance,
  calculateCapabilityRadar,
  generateWillingnessInterpretation,
  generateCapabilityInterpretation,
  generateFitInterpretation,
  generateComplianceInterpretation,
  generateRadarGapInterpretation,
  getNegativePenalty,
  getMdfPct,
  getPipelineHealth,
  getTierBaseline,
  getTierCertExpectation,
};

export default partnerScoring;
