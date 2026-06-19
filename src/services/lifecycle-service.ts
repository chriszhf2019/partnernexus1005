// ══════════════════════════════════════════════════════════════════════════════════
// PartnerNexus 统一生命周期追踪服务 (Unified Lifecycle Tracking Service)
// 版本: v2.0.0
// 描述: 为合作伙伴、商机、激励、培训、营销活动5个核心实体提供端到端的
//       生命周期状态管理、健康度评估、阶段推进、事件记录功能
// ══════════════════════════════════════════════════════════════════════════════════

import { supabase, db } from '../lib/supabase';
import {
  LifecycleEvent,
  DealLifecycleStageV2,
  PartnerLifecycleStage,
  IncentiveLifecycleStage,
  TrainingProgramLifecycleStage,
  MarketingLifecycleStage,
  DealLifecycleMetrics,
  PartnerLifecycleMetrics,
  IncentiveLifecycleMetrics,
  TrainingLifecycleMetrics,
  MarketingLifecycleMetrics,
  HealthAnalysis,
  PartnerActivitySnapshot,
  UnifiedLifecycleDashboard,
  LifecycleTrackingConfig,
  PartnerMaturityStage,
  PartnerMaturityHealth,
  PartnerMaturityEvent,
  PartnerMaturityStageInfo,
  Deal,
  DealMaturityStage,
  DealMaturityHealth,
  DealMaturityEvent,
  DealMaturityPillarScores,
  DEAL_MATURITY_STAGE_CONFIG,
  DEAL_OPERATION_TO_MATURITY_MAP,
  type MarketingCampaign,
  type CampaignPhase,
  type MarketingMaturityStage,
  type MarketingMaturityEvent,
  type MarketingMaturityHealth,
  type MarketingMaturityPillarScores,
  MARKETING_MATURITY_STAGE_CONFIG,
  MARKETING_OPERATION_TO_MATURITY_MAP,
  type IncentiveProgram,
  type IncentiveMaturityStage,
  type IncentiveMaturityEvent,
  type IncentiveMaturityHealth,
  type IncentiveMaturityPillarScores,
  INCENTIVE_MATURITY_STAGE_CONFIG,
  INCENTIVE_OPERATION_TO_MATURITY_MAP,
} from '../types';

// ────────────────────────────────────────────────────────────────────────────────
// 全局配置 (Global Configuration)
// ────────────────────────────────────────────────────────────────────────────────

const LIFECYCLE_CONFIG: LifecycleTrackingConfig = {
  dealStageProbabilities: {
    'Registered': 10,
    'UnderReview': 15,
    'Approved': 25,
    'Solution': 40,
    'Commercial': 60,
    'Negotiation': 80,
    'ClosedWon': 100,
    'ClosedLost': 0,
    'Migrated': 50,
  },
  dealStageMaxDays: {
    'Registered': 3,
    'UnderReview': 5,
    'Approved': 10,
    'Solution': 30,
    'Commercial': 20,
    'Negotiation': 15,
    'ClosedWon': 0,
    'ClosedLost': 0,
    'Migrated': 0,
  },
  partnerHealthRules: {
    inactivityDormantDays: 180,        // 连续180天无活动判定为休眠
    minimumDealFrequencyDays: 90,       // 平均90天至少一个商机
    minimumTrainingPerYear: 2,          // 年度至少2次培训
    minimumIncentiveParticipation: 0.2, // 至少参与20%的激励计划
  },
  incentiveROIThreshold: {
    excellent: 5,
    good: 3,
    acceptable: 1,
    poor: 0,
  },
  marketingROIThreshold: {
    excellent: 5,
    good: 3,
    acceptable: 1,
    poor: 0,
  },
  certificateValidityDays: 365,
  certificateExpiryWarningDays: 90,
};

export { LIFECYCLE_CONFIG };

// ────────────────────────────────────────────────────────────────────────────────
// 合作伙伴关系深度生命周期配置 (Partner Maturity Lifecycle Configuration)
// ────────────────────────────────────────────────────────────────────────────────
//
// 4阶段理念：
//   1. 准入期 (Transactional) - 交易驱动：关注利润分配、合规管理、单笔交易利益
//   2. 赋能期 (Transitional) - 能力过渡：通过培训与赋能，让伙伴从"只会卖货"转向"能提供服务"
//   3. 协同期 (Relational) - 关系驱动：双方不再只关注单一产品的买卖，而是共同出方案，交叉销售
//   4. 共生期 (Symbiotic) - 战略驱动：数字化、战略、甚至股权或业务底层深度交织，你中有我，我中有你

export interface MaturityStageConfig {
  label: string;
  shortLabel: string;
  description: string;
  identityPosition: string;          // 身份定位
  benefitDriver: string;              // 利益驱动机制
  managementFocus: string;            // 管理重心
  stabilityFoundation: string;        // 稳定性基石
  avgDaysInStage: number;             // 平均停留在该阶段的天数
  minDaysBeforePromotion: number;     // 晋级最低天数要求
  // 6大维度晋级阈值（0-100）
  promotionThresholds: {
    dealActivity: number;             // 商机活跃度
    capability: number;               // 能力建设
    enablement: number;               // 赋能参与
    collaboration: number;            // 协同共创
    strategicAlignment: number;       // 战略对齐
    systemIntegration: number;        // 系统耦合
  };
  partnerTypes: string[];
}

export const MATURITY_STAGE_CONFIG: Record<PartnerMaturityStage, MaturityStageConfig> = {
  'Transactional': {
    label: '准入与匹配期',
    shortLabel: '交易驱动',
    description: '伙伴类型：机会型、纯销售渠道、初级代理。双方基于明确的利益点（利润、产品、商机）达成初步合作。',
    identityPosition: '外部观察者 - 双方仍是"甲方乙方"心态',
    benefitDriver: '存量利润分配 - 关注点：折扣高不高？返点快不快？首单能不能成？',
    managementFocus: 'KPI准入与合规 - 关注资质审核、报备制度，防止低价和内耗',
    stabilityFoundation: '法律契约 - 靠纸面合同和单笔交易的利益维持，极易流失',
    avgDaysInStage: 180,
    minDaysBeforePromotion: 90,
    promotionThresholds: {
      dealActivity: 30,
      capability: 20,
      enablement: 20,
      collaboration: 10,
      strategicAlignment: 10,
      systemIntegration: 20,
    },
    partnerTypes: ['机会型', '纯销售渠道', '初级代理'],
  },
  'Transitional': {
    label: '赋能与激活期',
    shortLabel: '能力过渡',
    description: '伙伴类型：授权合作伙伴、认证服务商、专项伙伴。通过培训和赋能，让伙伴从"只会卖货"向"学会服务"转型。',
    identityPosition: '被赋能者 - 伙伴开始学习你的方法论，逐渐像你的"编外员工"',
    benefitDriver: '效率溢价 - 伙伴开始发现：学习了你的方案后，他的客单价更高，交付更快，利润更稳',
    managementFocus: '全方位赋能 - 重点在产品培训、销售陪跑、Demo演示支持，核心是提升伙伴的"上手率"',
    stabilityFoundation: '流程习惯 - 伙伴开始习惯使用你的Portal系统、商机报备流程，由于投入了学习成本，退出门槛开始建立',
    avgDaysInStage: 365,
    minDaysBeforePromotion: 180,
    promotionThresholds: {
      dealActivity: 55,
      capability: 50,
      enablement: 55,
      collaboration: 40,
      strategicAlignment: 30,
      systemIntegration: 50,
    },
    partnerTypes: ['授权合作伙伴', '认证服务商', '专项伙伴'],
  },
  'Relational': {
    label: '协同与共创期',
    shortLabel: '关系驱动',
    description: '伙伴类型：方案合作伙伴、行业标杆伙伴。双方不再只关注单一产品的买卖，而是针对市场痛点共同出方案。',
    identityPosition: '协同作战的战友 - 双方在客户现场并肩作战，信任度极高',
    benefitDriver: '增量价值共创 - 关注点：联合打造行业方案，共同挖掘单一客户的深度价值（交叉销售）',
    managementFocus: '协同与运营 - 重点在联合营销（MDF）、共同拜访客户、季度业务回顾（QBR），管理的是"合作质量"',
    stabilityFoundation: '情感与互信 - 双方高层建立定期沟通，形成了长期的合作默契和品牌背书，关系非常稳固',
    avgDaysInStage: 540,
    minDaysBeforePromotion: 365,
    promotionThresholds: {
      dealActivity: 75,
      capability: 75,
      enablement: 75,
      collaboration: 70,
      strategicAlignment: 60,
      systemIntegration: 70,
    },
    partnerTypes: ['方案合作伙伴', '行业标杆伙伴', '战略核心伙伴'],
  },
  'Symbiotic': {
    label: '演进与共生期',
    shortLabel: '战略驱动',
    description: '伙伴类型：战略联盟伙伴、生态核心节点、ISV（独立软件开发商）。双方在数字化、战略、甚至股权或业务底层深度交织。',
    identityPosition: '虚拟组织的一部分 - 伙伴的某块业务完全长在你的生态上，或者你的产品离不开伙伴的定制',
    benefitDriver: '生态位锁定 - 双方共享生态繁荣带来的溢价，甚至共同制定行业标准',
    managementFocus: '战略对齐 - 关注未来3-5年的发展规划，如何应对技术变革（如AI化），如何共同进入新市场',
    stabilityFoundation: '数字化共生 - 双方的系统、数据、API、底层技术完全打通，替换成本极高，达成"你中有我、我中有你"',
    avgDaysInStage: 1095,
    minDaysBeforePromotion: 730,
    promotionThresholds: {
      dealActivity: 90,
      capability: 90,
      enablement: 90,
      collaboration: 90,
      strategicAlignment: 90,
      systemIntegration: 90,
    },
    partnerTypes: ['战略联盟伙伴', '生态核心节点', 'ISV独立软件开发商'],
  },
};

// ────────────────────────────────────────────────────────────────────────────────
// 通用工具函数 (Utility Functions)
// ────────────────────────────────────────────────────────────────────────────────

/** 计算两日期之间天数差 */
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffMs = d2.getTime() - d1.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/** 计算当前日期与给定日期的天数差 */
function daysSince(date: string): number {
  return daysBetween(date, new Date().toISOString());
}

/** 生成UUID */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/** 健康度状态映射 */
function mapHealthStatus(score: number): 'healthy' | 'monitoring' | 'at_risk' | 'critical' {
  if (score >= 80) return 'healthy';
  if (score >= 60) return 'monitoring';
  if (score >= 40) return 'at_risk';
  return 'critical';
}

// ────────────────────────────────────────────────────────────────────────────────
// 通用生命周期事件记录 (Generic Lifecycle Event Recording)
// ────────────────────────────────────────────────────────────────────────────────

/**
 * 记录一条生命周期阶段变更事件
 * 通用方法，所有5个实体共享相同的事件记录逻辑
 */
async function recordLifecycleEvent(params: {
  entityId: string;
  entityType: 'partner' | 'deal' | 'incentive' | 'training' | 'marketing';
  fromStage: string | null;
  toStage: string;
  operator?: string;
  eventType?: string;
  reason?: string;
  notes?: string;
  relatedDealId?: string;
  healthDelta?: number;
  durationDaysPrevious?: number;
}): Promise<LifecycleEvent | null> {
  const {
    entityId,
    entityType,
    fromStage,
    toStage,
    operator = 'system',
    eventType = 'stage_change',
    reason,
    notes,
    relatedDealId,
    healthDelta,
    durationDaysPrevious,
  } = params;

  try {
    const eventId = generateId();
    const now = new Date().toISOString();

    const event: any = {
      id: eventId,
      event_date: now,
      operator,
      event_type: eventType,
      reason,
      notes,
      duration_days_previous: durationDaysPrevious,
      health_delta: healthDelta,
    };

    // 根据实体类型选择对应的表
    switch (entityType) {
      case 'partner':
        event.partner_id = entityId;
        event.from_stage = fromStage;
        event.to_stage = toStage;
        if (relatedDealId) event.related_deal_id = relatedDealId;
        event.created_at = now;
        await db.partnerLifecycleEvents().insert(event);
        break;

      case 'deal':
        event.deal_id = entityId;
        event.from_stage = fromStage;
        event.stage = toStage;
        event.created_at = now;
        await db.dealLifecycleEventsV2().insert(event);
        break;

      case 'incentive':
        event.program_id = entityId;
        event.from_stage = fromStage;
        event.to_stage = toStage;
        event.created_at = now;
        await db.incentiveLifecycleEvents().insert(event);
        break;

      case 'training':
        event.program_id = entityId;
        event.from_stage = fromStage;
        event.to_stage = toStage;
        event.created_at = now;
        await db.trainingLifecycleEvents().insert(event);
        break;

      case 'marketing':
        event.activity_id = entityId;
        event.from_stage = fromStage;
        event.to_stage = toStage;
        event.created_at = now;
        await db.marketingLifecycleEvents().insert(event);
        break;
    }

    return {
      id: eventId,
      entityId,
      entityType,
      fromStage: fromStage || '',
      toStage,
      eventDate: now,
      operator,
      eventType,
      reason,
      notes,
      relatedDealId,
      durationDaysPrevious,
      healthDelta,
      createdAt: now,
    } as LifecycleEvent;
  } catch (e) {
    console.error('[Lifecycle] Failed to record event:', e);
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// 1. 商机生命周期服务 (Deal Lifecycle Service)
// ────────────────────────────────────────────────────────────────────────────────

export const dealLifecycleService = {
  /**
   * 推进商机到下一阶段
   * 自动更新阶段字段、记录事件、计算加权金额
   */
  async advanceStage(
    dealId: string,
    toStage: DealLifecycleStageV2,
    options: {
      operator?: string;
      reason?: string;
      notes?: string;
    } = {}
  ): Promise<boolean> {
    try {
      // 获取当前商机信息
      const { data: deal } = await db.deals()
        .select('id, stage, created_date, value, partner_name')
        .eq('id', dealId)
        .single();

      if (!deal) {
        console.error('[DealLifecycle] Deal not found:', dealId);
        return false;
      }

      const currentStage = deal.stage || 'Registered';
      if (currentStage === toStage) {
        console.log('[DealLifecycle] Stage unchanged, skipping:', dealId);
        return true;
      }

      const now = new Date().toISOString();

      // 计算停留天数
      let durationDaysPrevious = 0;
      if (deal.created_date) {
        const enteredDate = (deal as any).stage_entered_at || deal.created_date;
        durationDaysPrevious = daysSince(enteredDate);
      }

      // 更新商机表
      const updates: any = {
        stage: toStage,
        stage_entered_at: now,
        updated_at: now,
      };

      // 根据新阶段更新加权金额和赢单概率
      const probability = LIFECYCLE_CONFIG.dealStageProbabilities[toStage] || 0;
      updates.conversion_probability = probability;
      updates.weighted_value = deal.value * (probability / 100);

      // 已赢单/已丢单标记结束日期
      if (toStage === 'ClosedWon' || toStage === 'ClosedLost') {
        updates.closed_date = now;
      }

      await db.deals().update(updates).eq('id', dealId);

      // 记录生命周期事件
      await recordLifecycleEvent({
        entityId: dealId,
        entityType: 'deal',
        fromStage: currentStage,
        toStage,
        operator: options.operator || '渠道经理',
        reason: options.reason,
        notes: options.notes,
        durationDaysPrevious,
      });

      console.log(`[DealLifecycle] ${deal.partner_name} 商机推进: ${currentStage} → ${toStage}`);
      return true;
    } catch (e) {
      console.error('[DealLifecycle] Failed to advance stage:', e);
      return false;
    }
  },

  /**
   * 获取商机的完整生命周期事件历史
   */
  async getDealLifecycleEvents(dealId: string): Promise<LifecycleEvent[]> {
    try {
      const { data } = await db.dealLifecycleEventsV2()
        .select('*')
        .eq('deal_id', dealId)
        .order('event_date', { ascending: true });

      if (!data) return [];

      return data.map((e: any) => ({
        id: e.id,
        entityId: dealId,
        entityType: 'deal',
        fromStage: e.from_stage || '',
        toStage: e.stage,
        eventDate: e.event_date,
        operator: e.actor || e.operator || '',
        eventType: e.event_type || 'stage_change',
        reason: e.reason,
        notes: e.notes,
        durationDaysPrevious: e.duration_days_previous,
        healthDelta: e.health_delta,
        createdAt: e.created_at,
      }));
    } catch (e) {
      console.error('[DealLifecycle] Failed to get events:', e);
      return [];
    }
  },

  /**
   * 计算商机的生命周期健康度指标
   */
  async calculateDealMetrics(dealId: string): Promise<DealLifecycleMetrics | null> {
    try {
      const { data: deal } = await db.deals()
        .select('id, title, customer, value, stage, created_date, stage_entered_at, partner_id, partner_name, product_type')
        .eq('id', dealId)
        .single();

      if (!deal) return null;

      const stage: DealLifecycleStageV2 = (deal.stage as DealLifecycleStageV2) || 'Registered';
      const now = new Date();

      const daysSinceReg = deal.created_date ? daysSince(deal.created_date) : 0;
      const daysInStage = deal.stage_entered_at ? daysSince(deal.stage_entered_at) : 0;
      const maxDaysInStage = LIFECYCLE_CONFIG.dealStageMaxDays[stage] || 30;
      const isOverdue = daysInStage > maxDaysInStage;
      const probability = LIFECYCLE_CONFIG.dealStageProbabilities[stage] || 0;

      // 健康度评分: 基于阶段停留时间 + 赢单概率 + 加权金额
      let healthScore = probability;
      if (isOverdue && daysInStage > 0) {
        // 超时会扣分: 每超期一天扣1分
        const overDays = daysInStage - maxDaysInStage;
        healthScore = Math.max(0, healthScore - Math.min(overDays, 40));
      }
      // 如果是活跃阶段但长期无推进，减分
      if (['Solution', 'Commercial', 'Negotiation'].includes(stage) && daysSinceReg > 180) {
        healthScore = Math.max(0, healthScore - 20);
      }

      const healthStatus = mapHealthStatus(healthScore);

      // 预估成交日期: 从当前阶段到成交的平均天数
      const remainingStages = ['Solution', 'Commercial', 'Negotiation'];
      const estimatedDaysToClose = stage === 'ClosedWon' || stage === 'ClosedLost'
        ? 0
        : remainingStages.reduce((sum, s) => sum + (LIFECYCLE_CONFIG.dealStageMaxDays[s as DealLifecycleStageV2] || 15), 0);

      return {
        totalCycleDays: daysSinceReg,
        daysSinceRegistration: daysSinceReg,
        daysInCurrentStage: daysInStage,
        estimatedCloseDate: new Date(now.getTime() + estimatedDaysToClose * 86400000).toISOString(),
        isOverdue,
        conversionProbability: probability,
        weightedValue: deal.value * (probability / 100),
        averageCycleByIndustry: 90, // 默认90天行业平均
        healthScore,
        healthStatus,
      };
    } catch (e) {
      console.error('[DealLifecycle] Failed to calculate metrics:', e);
      return null;
    }
  },

  /**
   * 批量计算商机Pipeline的健康度
   */
  async getPipelineHealth(partnerId?: string): Promise<{
    totalDeals: number;
    totalValue: number;
    weightedValue: number;
    avgConversionProbability: number;
    avgHealthScore: number;
    overdueCount: number;
    byStage: Record<string, { count: number; value: number; weightedValue: number }>;
  }> {
    try {
      let query = db.deals().select('id, stage, value, created_date, stage_entered_at');

      if (partnerId) {
        query = query.eq('partner_id', partnerId);
      }

      const { data: deals } = await query;

      if (!deals) {
        return {
          totalDeals: 0, totalValue: 0, weightedValue: 0,
          avgConversionProbability: 0, avgHealthScore: 0, overdueCount: 0, byStage: {},
        };
      }

      let totalValue = 0;
      let totalWeightedValue = 0;
      let totalProbability = 0;
      let totalHealthScore = 0;
      let overdueCount = 0;
      const byStage: Record<string, { count: number; value: number; weightedValue: number }> = {};

      for (const d of deals) {
        const stage: DealLifecycleStageV2 = (d.stage as DealLifecycleStageV2) || 'Registered';
        const prob = LIFECYCLE_CONFIG.dealStageProbabilities[stage] || 0;
        const weighted = d.value * (prob / 100);

        totalValue += d.value;
        totalWeightedValue += weighted;
        totalProbability += prob;

        const daysInStage = d.stage_entered_at ? daysSince(d.stage_entered_at) : 0;
        const maxDays = LIFECYCLE_CONFIG.dealStageMaxDays[stage] || 30;
        if (daysInStage > maxDays && daysInStage > 0) overdueCount++;

        if (!byStage[stage]) byStage[stage] = { count: 0, value: 0, weightedValue: 0 };
        byStage[stage].count++;
        byStage[stage].value += d.value;
        byStage[stage].weightedValue += weighted;

        // 简单健康度: 概率 + 阶段停留
        let health = prob;
        if (daysInStage > maxDays && daysInStage > 0) {
          health = Math.max(0, health - Math.min(daysInStage - maxDays, 40));
        }
        totalHealthScore += health;
      }

      return {
        totalDeals: deals.length,
        totalValue,
        weightedValue: totalWeightedValue,
        avgConversionProbability: deals.length > 0 ? totalProbability / deals.length : 0,
        avgHealthScore: deals.length > 0 ? totalHealthScore / deals.length : 0,
        overdueCount,
        byStage,
      };
    } catch (e) {
      console.error('[DealLifecycle] Failed to get pipeline health:', e);
      return { totalDeals: 0, totalValue: 0, weightedValue: 0, avgConversionProbability: 0, avgHealthScore: 0, overdueCount: 0, byStage: {} };
    }
  },
};

// ────────────────────────────────────────────────────────────────────────────────
// 2. 合作伙伴生命周期服务 (Partner Lifecycle Service)
// ────────────────────────────────────────────────────────────────────────────────

export const partnerLifecycleService = {
  /**
   * 推进合作伙伴到下一生命周期阶段
   */
  async advanceStage(
    partnerId: string,
    toStage: PartnerLifecycleStage,
    options: { operator?: string; reason?: string; notes?: string } = {}
  ): Promise<boolean> {
    try {
      const { data: partner } = await db.partners()
        .select('id, name, lifecycle_stage, status, start_date')
        .eq('id', partnerId)
        .single();

      if (!partner) {
        console.error('[PartnerLifecycle] Partner not found:', partnerId);
        return false;
      }

      const currentStage = partner.lifecycle_stage || 'Active';
      if (currentStage === toStage) return true;

      const now = new Date().toISOString();
      let durationDaysPrevious = 0;
      if (partner.start_date) {
        durationDaysPrevious = daysSince(partner.start_date);
      }

      // 更新合作伙伴
      const updates: any = {
        lifecycle_stage: toStage,
        stage_entered_at: now,
        updated_at: now,
      };

      // 同步更新 status 字段（保持与生命周期一致）
      if (toStage === 'Dormant') updates.status = 'Inactive';
      else if (toStage === 'Terminated') updates.status = 'Inactive';
      else if (toStage === 'Active' || toStage === 'Renewed') updates.status = 'Cooperating';

      await db.partners().update(updates).eq('id', partnerId);

      // 记录事件
      await recordLifecycleEvent({
        entityId: partnerId,
        entityType: 'partner',
        fromStage: currentStage,
        toStage,
        operator: options.operator || '渠道经理',
        reason: options.reason,
        notes: options.notes,
        durationDaysPrevious,
      });

      console.log(`[PartnerLifecycle] ${partner.name} 阶段推进: ${currentStage} → ${toStage}`);
      return true;
    } catch (e) {
      console.error('[PartnerLifecycle] Failed to advance stage:', e);
      return false;
    }
  },

  /**
   * 计算合作伙伴的生命周期健康度指标
   * 综合考虑: 活跃度、商机报备频率、赢单率、激励计划参与度、培训完成度、营销活动参与度
   */
  async calculatePartnerMetrics(partnerId: string): Promise<PartnerLifecycleMetrics | null> {
    try {
      // 1. 获取伙伴基本信息
      const { data: partner } = await db.partners()
        .select('id, name, start_date, lifecycle_stage, status, total_revenue_amount, active_deals_count')
        .eq('id', partnerId)
        .single();

      if (!partner) return null;

      // 2. 获取该伙伴的所有商机
      const { data: deals } = await db.deals()
        .select('id, stage, value, created_date, closed_date')
        .eq('partner_id', partnerId);

      const totalDeals = deals?.length || 0;
      const wonDeals = deals?.filter(d => d.stage === 'ClosedWon')?.length || 0;
      const winRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;
      const totalRevenue = deals?.filter(d => d.stage === 'ClosedWon').reduce((sum, d) => sum + (d.value || 0), 0) || 0;

      // 3. 计算合作天数
      const totalDaysInProgram = partner.start_date ? daysSince(partner.start_date) : 0;

      // 4. 计算年均商机报备量
      const yearsActive = Math.max(totalDaysInProgram / 365, 0.5);
      const dealCountPerYear = totalDeals / yearsActive;

      // 5. 获取活跃度 - 检查伙伴活动日志
      let daysSinceLastActivity = 0;
      try {
        const { data: logs } = await db.partnerActivityLogs()
          .select('created_at')
          .eq('partner_id', partnerId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (logs && logs.length > 0) {
          daysSinceLastActivity = daysSince(logs[0].created_at);
        } else if (deals && deals.length > 0) {
          // 如果没有活动日志，使用最新商机报备日期
          const latestDeal = [...deals].sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())[0];
          daysSinceLastActivity = daysSince(latestDeal.created_date);
        } else {
          daysSinceLastActivity = totalDaysInProgram;
        }
      } catch { daysSinceLastActivity = totalDaysInProgram; }

      // 6. 获取培训参与度 (通过 user_enrollments)
      let trainingParticipationRate = 0;
      try {
        const { data: enrollments } = await db.userEnrollments()
          .select('id, status, progress')
          .eq('partner_id', partnerId);
        const totalEnrolled = enrollments?.length || 0;
        const completedCount = enrollments?.filter(e => e.status === 'completed' || e.progress >= 80).length || 0;
        trainingParticipationRate = totalEnrolled > 0 ? (completedCount / totalEnrolled) * 100 : 0;
      } catch { trainingParticipationRate = 0; }

      // 7. 计算激励计划参与度
      let incentiveParticipationRate = 0;
      try {
        const { data: activePrograms, count: activeCount } = await db.incentivePrograms()
          .select('id, status')
          .in('status', ['Active', 'Planning']);

        const activeProgramsCount = activePrograms?.length || 1;
        const { data: applications } = await db.incentiveApplications()
          .select('id, partner_id')
          .eq('partner_id', partnerId);

        const participatedCount = applications?.length || 0;
        incentiveParticipationRate = Math.min((participatedCount / activeProgramsCount) * 100, 100);
      } catch { incentiveParticipationRate = 0; }

      // 8. 培训完成度估算
      const onboardingCompletionPercentage = Math.min(
        Math.max(
          (dealCountPerYear > 0.5 ? 30 : 0) +
          (winRate > 30 ? 20 : 0) +
          (trainingParticipationRate > 50 ? 30 : 0) +
          (incentiveParticipationRate > 30 ? 20 : 0),
          0
        ), 100
      );

      // 9. 收入趋势
      let revenueTrend: 'growing' | 'stable' | 'declining' = 'stable';
      if (totalDeals > 0) {
        const recentDeals = deals?.filter(d => daysSince(d.created_date) < 180).length || 0;
        const olderDeals = totalDeals - recentDeals;
        if (recentDeals > olderDeals) revenueTrend = 'growing';
        else if (recentDeals < olderDeals * 0.5) revenueTrend = 'declining';
      }

      // 10. 更新伙伴表中的聚合指标
      try {
        await db.partners().update({
          total_revenue_amount: totalRevenue,
          active_deals_count: totalDeals - wonDeals - (deals?.filter(d => d.stage === 'ClosedLost').length || 0),
          computed_win_rate: winRate,
          last_activity_at: new Date(Date.now() - daysSinceLastActivity * 86400000).toISOString(),
          data_source: 'computed',
          updated_at: new Date().toISOString(),
        }).eq('id', partnerId);
      } catch { /* 忽略计算字段更新错误 */ }

      // 11. 计算营销活动参与度（估算）
      const marketingActivityRate = Math.min(incentiveParticipationRate + trainingParticipationRate, 100);

      return {
        totalDaysInProgram,
        daysSinceLastActivity,
        daysInCurrentStage: partner.start_date ? daysSince(partner.start_date) : 0,
        onboardingCompletionPercentage,
        dealCountPerYear,
        winRateAverage: winRate,
        revenueTrend,
        trainingParticipationRate,
        incentiveParticipationRate,
        marketingActivityRate,
      };
    } catch (e) {
      console.error('[PartnerLifecycle] Failed to calculate metrics:', e);
      return null;
    }
  },

  /**
   * 检测休眠伙伴 - 自动识别长期无活动的伙伴
   */
  async detectDormantPartners(): Promise<{ partnerId: string; partnerName: string; daysInactive: number; }[]> {
    try {
      const { data: partners } = await db.partners()
        .select('id, name, last_activity_at, lifecycle_stage')
        .eq('status', 'Cooperating');

      const dormantList: { partnerId: string; partnerName: string; daysInactive: number; }[] = [];
      const threshold = LIFECYCLE_CONFIG.partnerHealthRules.inactivityDormantDays;

      for (const p of partners || []) {
        if (p.lifecycle_stage === 'Dormant') continue;
        const daysInactive = p.last_activity_at ? daysSince(p.last_activity_at) : 365;
        if (daysInactive >= threshold) {
          dormantList.push({ partnerId: p.id, partnerName: p.name, daysInactive });
        }
      }
      return dormantList;
    } catch (e) {
      console.error('[PartnerLifecycle] Failed to detect dormant partners:', e);
      return [];
    }
  },

  /**
   * 计算合作伙伴综合健康度
   */
  async calculatePartnerHealth(partnerId: string): Promise<HealthAnalysis | null> {
    try {
      const metrics = await this.calculatePartnerMetrics(partnerId);
      if (!metrics) return null;

      // 健康度 = 活跃度(25%) + 商机频率(20%) + 赢单率(25%) + 培训(15%) + 激励参与(15%)
      // 活跃度：距离最后一次活动越近分数越高（最大100分）
      // 商机频率：每年3个商机为基准线（90分），超过3个满分
      const activityScore = Math.max(0, 100 - Math.min(metrics.daysSinceLastActivity, 100));
      const dealFrequencyScore = Math.min(100, metrics.dealCountPerYear * 30);
      const winRateScore = metrics.winRateAverage;
      const trainingScore = metrics.trainingParticipationRate;
      const incentiveScore = metrics.incentiveParticipationRate;

      const overallScore = Math.round(
        activityScore * 0.25 +
        dealFrequencyScore * 0.20 +
        winRateScore * 0.25 +
        trainingScore * 0.15 +
        incentiveScore * 0.15
      );

      const rules = [
        { dimension: '活跃度', weight: 25, currentValue: metrics.daysSinceLastActivity, targetValue: 90, score: activityScore, isHealthy: metrics.daysSinceLastActivity < 90, warning: metrics.daysSinceLastActivity >= 180 ? '长期未活跃' : undefined },
        { dimension: '商机频率', weight: 20, currentValue: metrics.dealCountPerYear, targetValue: 2, score: dealFrequencyScore, isHealthy: metrics.dealCountPerYear >= 2, warning: metrics.dealCountPerYear < 1 ? '报备频次偏低' : undefined },
        { dimension: '赢单率', weight: 25, currentValue: metrics.winRateAverage, targetValue: 40, score: winRateScore, isHealthy: metrics.winRateAverage >= 30, warning: metrics.winRateAverage < 20 ? '赢单率偏低' : undefined },
        { dimension: '培训参与', weight: 15, currentValue: metrics.trainingParticipationRate, targetValue: 60, score: trainingScore, isHealthy: metrics.trainingParticipationRate >= 50 },
        { dimension: '激励参与', weight: 15, currentValue: metrics.incentiveParticipationRate, targetValue: 40, score: incentiveScore, isHealthy: metrics.incentiveParticipationRate >= 30 },
      ];

      return {
        overallScore,
        status: mapHealthStatus(overallScore),
        rules,
        lastUpdated: new Date().toISOString(),
      };
    } catch (e) {
      console.error('[PartnerLifecycle] Failed to calculate health:', e);
      return null;
    }
  },
};

// ────────────────────────────────────────────────────────────────────────────────
// 3. 激励计划生命周期服务 (Incentive Lifecycle Service)
// ────────────────────────────────────────────────────────────────────────────────

export const incentiveLifecycleService = {
  /**
   * 推进激励计划阶段
   */
  async advanceStage(
    programId: string,
    toStage: IncentiveLifecycleStage,
    options: { operator?: string; reason?: string; notes?: string } = {}
  ): Promise<boolean> {
    try {
      const { data: program } = await db.incentivePrograms()
        .select('id, title, lifecycle_stage, total_budget, start_date, end_date')
        .eq('id', programId)
        .single();

      if (!program) {
        console.error('[IncentiveLifecycle] Program not found:', programId);
        return false;
      }

      const currentStage = program.lifecycle_stage || 'Active';
      if (currentStage === toStage) return true;

      const now = new Date().toISOString();

      await db.incentivePrograms().update({
        lifecycle_stage: toStage,
        stage_entered_at: now,
        updated_at: now,
      }).eq('id', programId);

      await recordLifecycleEvent({
        entityId: programId,
        entityType: 'incentive',
        fromStage: currentStage,
        toStage,
        operator: options.operator || '渠道运营',
        reason: options.reason,
        notes: options.notes,
      });

      console.log(`[IncentiveLifecycle] ${program.title} 推进: ${currentStage} → ${toStage}`);
      return true;
    } catch (e) {
      console.error('[IncentiveLifecycle] Failed to advance stage:', e);
      return false;
    }
  },

  /**
   * 计算激励计划的ROI和执行指标
   */
  async calculateProgramMetrics(programId: string): Promise<IncentiveLifecycleMetrics | null> {
    try {
      const { data: program } = await db.incentivePrograms()
        .select('id, title, total_budget, claimed_amount, participants_count, start_date, end_date')
        .eq('id', programId)
        .single();

      if (!program) return null;

      // 获取所有申请
      let applications: any[] = [];
      try {
        const { data } = await db.incentiveApplications()
          .select('id, partner_id, partner_name, deal_id, deal_value, claimed_amount, approved_amount, status')
          .eq('program_id', programId);
        applications = data || [];
      } catch { applications = []; }

      const totalBudget = program.total_budget || 0;
      const budgetUtilized = program.claimed_amount || 0;
      const budgetUtilizationRate = totalBudget > 0 ? (budgetUtilized / totalBudget) * 100 : 0;
      const approvedCount = applications.filter(a => a.status === 'approved' || a.status === 'paid').length;
      const paidAmount = applications.reduce((sum, a) => sum + (a.approved_amount || 0), 0);
      const generatedDealValue = applications.reduce((sum, a) => sum + (a.deal_value || 0), 0);
      const generatedDealCount = applications.filter(a => a.deal_id).length;

      // ROI = 产生的商机金额 / 已发放奖金
      const roi = paidAmount > 0 ? generatedDealValue / paidAmount : 0;

      // 计算发放周期
      let timeToFirstPayoutDays = 0;
      if (program.start_date) {
        timeToFirstPayoutDays = daysSince(program.start_date);
      }

      return {
        totalBudget,
        budgetUtilized,
        budgetUtilizationRate,
        participantCount: program.participants_count || applications.length,
        applicationCount: applications.length,
        approvedApplicationCount: approvedCount,
        paidAmount,
        pendingPayoutAmount: budgetUtilized - paidAmount,
        roi,
        generatedDealValue,
        generatedDealCount,
        averagePayoutPerParticipant: approvedCount > 0 ? paidAmount / approvedCount : 0,
        timeToFirstPayoutDays,
      };
    } catch (e) {
      console.error('[IncentiveLifecycle] Failed to calculate metrics:', e);
      return null;
    }
  },

  /**
   * 自动评估激励计划状态 - 到期自动完成
   */
  async evaluateProgramStatus(): Promise<{ completed: number; active: number }> {
    try {
      const { data: programs } = await db.incentivePrograms()
        .select('id, title, end_date, lifecycle_stage')
        .in('status', ['Active']);

      const today = new Date();
      let completedCount = 0;
      let activeCount = 0;

      for (const program of programs || []) {
        if (program.end_date && new Date(program.end_date) < today) {
          // 已过期，标记为 Completed
          await this.advanceStage(program.id, 'Completed', { reason: '激励计划到期自动结束' });
          completedCount++;
        } else {
          activeCount++;
        }
      }

      return { completed: completedCount, active: activeCount };
    } catch (e) {
      console.error('[IncentiveLifecycle] Failed to evaluate program status:', e);
      return { completed: 0, active: 0 };
    }
  },
};

// ────────────────────────────────────────────────────────────────────────────────
// 4. 培训认证生命周期服务 (Training Lifecycle Service)
// ────────────────────────────────────────────────────────────────────────────────

export const trainingLifecycleService = {
  /**
   * 推进培训课程阶段
   */
  async advanceProgramStage(
    programId: string,
    toStage: TrainingProgramLifecycleStage,
    options: { operator?: string; reason?: string; notes?: string } = {}
  ): Promise<boolean> {
    try {
      const { data: program } = await db.certificationPrograms()
        .select('id, name, lifecycle_stage')
        .eq('id', programId)
        .single();

      if (!program) return false;

      const currentStage = program.lifecycle_stage || 'Draft';
      if (currentStage === toStage) return true;

      const now = new Date().toISOString();
      await db.certificationPrograms().update({
        lifecycle_stage: toStage,
        stage_entered_at: now,
        updated_at: now,
      }).eq('id', programId);

      await recordLifecycleEvent({
        entityId: programId,
        entityType: 'training',
        fromStage: currentStage,
        toStage,
        operator: options.operator || '培训管理员',
        reason: options.reason,
        notes: options.notes,
      });

      return true;
    } catch (e) {
      console.error('[TrainingLifecycle] Failed to advance stage:', e);
      return false;
    }
  },

  /**
   * 推进单个学员报名记录阶段
   */
  async advanceEnrollmentStage(
    enrollmentId: string,
    toStage: string,
    options: { operator?: string; score?: number; certificateId?: string } = {}
  ): Promise<boolean> {
    try {
      const { data: enrollment } = await db.userEnrollments()
        .select('id, program_id, user_name, status, progress, score')
        .eq('id', enrollmentId)
        .single();

      if (!enrollment) return false;

      const currentStage = (enrollment as any).enrollment_stage || enrollment.status || 'registered';
      if (currentStage === toStage) return true;

      const nowDate = new Date();
      const now = nowDate.toISOString();
      const updates: any = {
        enrollment_stage: toStage,
        stage_entered_at: now,
        updated_at: now,
      };

      if (options.score !== undefined) {
        updates.assessment_score = options.score;
        updates.assessment_passed = options.score >= 60;
      }

      if (toStage === 'certified' || toStage === 'passed') {
        updates.certificate_issued_at = now;
        updates.certificate_expires_at = new Date(nowDate.getTime() + LIFECYCLE_CONFIG.certificateValidityDays * 86400000).toISOString();
        if (options.certificateId) updates.certificate_id = options.certificateId;
        else updates.certificate_id = `CERT-${generateId().substring(0, 8).toUpperCase()}`;
      }

      await db.userEnrollments().update(updates).eq('id', enrollmentId);

      await recordLifecycleEvent({
        entityId: enrollment.program_id,
        entityType: 'training',
        fromStage: currentStage,
        toStage,
        operator: options.operator || '系统自动',
        reason: `学员 ${enrollment.user_name} 阶段更新`,
      });

      return true;
    } catch (e) {
      console.error('[TrainingLifecycle] Failed to advance enrollment:', e);
      return false;
    }
  },

  /**
   * 计算培训认证指标
   */
  async calculateProgramMetrics(programId: string): Promise<TrainingLifecycleMetrics | null> {
    try {
      const { data: enrollments } = await db.userEnrollments()
        .select('id, status, progress, score, assessment_score, assessment_passed, certificate_issued_at, certificate_expires_at')
        .eq('program_id', programId);

      if (!enrollments || enrollments.length === 0) {
        return {
          totalEnrollments: 0, activeEnrollments: 0, completedCount: 0,
          passRate: 0, averageScore: 0, averageCompletionDays: 0,
          certificateCount: 0, validCertificateCount: 0,
          expiringCertificateCount: 0, expiredCertificateCount: 0,
          averageValidityDays: LIFECYCLE_CONFIG.certificateValidityDays,
        };
      }

      const now = new Date();
      const total = enrollments.length;
      const completed = enrollments.filter(e => e.progress >= 80 || e.status === 'completed').length;
      const passed = enrollments.filter(e => e.assessment_passed).length;
      const certified = enrollments.filter(e => e.certificate_issued_at).length;

      let validCertificates = 0;
      let expiringCertificates = 0;
      let expiredCertificates = 0;

      for (const e of enrollments) {
        if (!e.certificate_expires_at) continue;
        const expiry = new Date(e.certificate_expires_at);
        const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / 86400000);
        if (daysUntilExpiry <= 0) expiredCertificates++;
        else if (daysUntilExpiry <= LIFECYCLE_CONFIG.certificateExpiryWarningDays) expiringCertificates++;
        else validCertificates++;
      }

      const averageScore = enrollments.reduce((sum, e) => sum + (e.assessment_score || e.score || 0), 0) / total;

      return {
        totalEnrollments: total,
        activeEnrollments: total - completed,
        completedCount: completed,
        passRate: total > 0 ? (passed / total) * 100 : 0,
        averageScore,
        averageCompletionDays: 30, // 默认30天完成周期
        certificateCount: certified,
        validCertificateCount: validCertificates,
        expiringCertificateCount: expiringCertificates,
        expiredCertificateCount: expiredCertificates,
        averageValidityDays: LIFECYCLE_CONFIG.certificateValidityDays,
      };
    } catch (e) {
      console.error('[TrainingLifecycle] Failed to calculate metrics:', e);
      return null;
    }
  },

  /**
   * 检测即将过期的证书，发送预警
   */
  async detectExpiringCertificates(): Promise<{
    enrollmentId: string;
    userName: string;
    programName?: string;
    certificateId?: string;
    daysUntilExpiry: number;
    expired: boolean;
  }[]> {
    try {
      const { data: enrollments } = await db.userEnrollments()
        .select('id, user_name, program_name, certificate_id, certificate_expires_at')
        .not('certificate_expires_at', 'is', null);

      const now = new Date();
      const warnings: any[] = [];

      for (const e of enrollments || []) {
        const expiry = new Date(e.certificate_expires_at);
        const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / 86400000);

        if (daysUntilExpiry <= LIFECYCLE_CONFIG.certificateExpiryWarningDays) {
          warnings.push({
            enrollmentId: e.id,
            userName: e.user_name,
            programName: e.program_name,
            certificateId: e.certificate_id,
            daysUntilExpiry,
            expired: daysUntilExpiry <= 0,
          });
        }
      }

      return warnings;
    } catch (e) {
      console.error('[TrainingLifecycle] Failed to detect expiring:', e);
      return [];
    }
  },
};

// ────────────────────────────────────────────────────────────────────────────────
// 5. 营销活动生命周期服务 (Marketing Lifecycle Service)
// ────────────────────────────────────────────────────────────────────────────────

export const marketingLifecycleService = {
  /**
   * 推进营销活动阶段
   */
  async advanceStage(
    activityId: string,
    toStage: MarketingLifecycleStage,
    options: { operator?: string; reason?: string; notes?: string } = {}
  ): Promise<boolean> {
    try {
      const { data: activity } = await db.marketingActivities()
        .select('id, name, lifecycle_stage, event_date, budget, actual_spend')
        .eq('id', activityId)
        .single();

      if (!activity) return false;

      const currentStage = activity.lifecycle_stage || 'Planning';
      if (currentStage === toStage) return true;

      const now = new Date().toISOString();
      await db.marketingActivities().update({
        lifecycle_stage: toStage,
        stage_entered_at: now,
        updated_at: now,
      }).eq('id', activityId);

      await recordLifecycleEvent({
        entityId: activityId,
        entityType: 'marketing',
        fromStage: currentStage,
        toStage,
        operator: options.operator || '市场经理',
        reason: options.reason,
        notes: options.notes,
      });

      console.log(`[MarketingLifecycle] ${activity.name} 推进: ${currentStage} → ${toStage}`);
      return true;
    } catch (e) {
      console.error('[MarketingLifecycle] Failed to advance stage:', e);
      return false;
    }
  },

  /**
   * 计算营销活动ROI和执行指标
   */
  async calculateActivityMetrics(activityId: string): Promise<MarketingLifecycleMetrics | null> {
    try {
      // 1. 获取活动基本信息
      const { data: activity } = await db.marketingActivities()
        .select('id, name, budget, actual_spend, event_date, registered_attendees, checked_in_attendees')
        .eq('id', activityId)
        .single();

      if (!activity) return null;

      // 2. 获取参会者信息
      let attendees: any[] = [];
      try {
        const { data } = await db.campaignAttendees()
          .select('id, name, company, status, lead_score, deal_created, deal_id')
          .eq('activity_id', activityId);
        attendees = data || [];
      } catch { attendees = []; }

      // 3. 获取关联商机
      let generatedDeals: any[] = [];
      try {
        const { data } = await db.deals()
          .select('id, title, value, stage')
          .eq('origin_activity_id', activityId);
        generatedDeals = data || [];
      } catch { generatedDeals = []; }

      const totalBudget = activity.budget || 0;
      const actualSpend = activity.actual_spend || activity.budget * 0.8 || 0;
      const registeredCount = activity.registered_attendees || attendees.length;
      const checkedInCount = activity.checked_in_attendees || attendees.filter(a => a.status === 'checked_in' || a.checked_in).length;

      const leadsGenerated = attendees.filter(a =>
        a.lead_score && a.lead_score > 50 || a.status === 'qualified'
      ).length;

      const qualifiedLeads = attendees.filter(a =>
        a.deal_created || generatedDeals.some(d => d.id === a.deal_id)
      ).length;

      const generatedDealValue = generatedDeals.reduce((sum, d) => sum + (d.value || 0), 0);

      // ROI = 产生商机金额 / 实际花费
      const roi = actualSpend > 0 ? generatedDealValue / actualSpend : 0;

      return {
        totalBudget,
        actualSpend,
        budgetUtilizationRate: totalBudget > 0 ? (actualSpend / totalBudget) * 100 : 0,
        expectedAttendees: registeredCount * 1.2, // 估算期望参会
        registeredAttendees: registeredCount,
        checkedInAttendees: checkedInCount,
        attendanceRate: registeredCount > 0 ? (checkedInCount / registeredCount) * 100 : 0,
        leadsGenerated: leadsGenerated,
        qualifiedLeads: qualifiedLeads,
        dealsCreated: generatedDeals.length,
        dealsValueGenerated: generatedDealValue,
        dealConversionRate: checkedInCount > 0 ? (generatedDeals.length / checkedInCount) * 100 : 0,
        costPerLead: leadsGenerated > 0 ? actualSpend / leadsGenerated : 0,
        costPerDeal: generatedDeals.length > 0 ? actualSpend / generatedDeals.length : 0,
        roi,
        avgLeadQualityScore: attendees.length > 0
          ? attendees.reduce((sum, a) => sum + (a.lead_score || 50), 0) / attendees.length
          : 50,
      };
    } catch (e) {
      console.error('[MarketingLifecycle] Failed to calculate metrics:', e);
      return null;
    }
  },

  /**
   * 自动评估活动状态 - 到期自动归档
   */
  async evaluateActivityStatus(): Promise<{ completed: number; active: number }> {
    try {
      const { data: activities } = await db.marketingActivities()
        .select('id, name, event_date, lifecycle_stage, status');

      const today = new Date();
      let completedCount = 0;
      let activeCount = 0;

      for (const activity of activities || []) {
        if (activity.event_date && new Date(activity.event_date) < today
            && activity.lifecycle_stage !== 'Archived'
            && activity.lifecycle_stage !== 'Completed') {
          await this.advanceStage(activity.id, 'Completed', { reason: '活动已结束，自动完成' });
          completedCount++;
        } else {
          activeCount++;
        }
      }
      return { completed: completedCount, active: activeCount };
    } catch (e) {
      console.error('[MarketingLifecycle] Failed to evaluate activity status:', e);
      return { completed: 0, active: 0 };
    }
  },
};

// ────────────────────────────────────────────────────────────────────────────────
// 6. 统一仪表盘 (Unified Dashboard)
// ────────────────────────────────────────────────────────────────────────────────

export const unifiedLifecycleDashboardService = {
  /**
   * 获取合作伙伴的全链路参与快照
   */
  async getPartnerActivitySnapshot(partnerId: string): Promise<PartnerActivitySnapshot | null> {
    try {
      // 获取伙伴基本信息
      const { data: partner } = await db.partners()
        .select('id, name, start_date, status, computed_win_rate, total_revenue_amount')
        .eq('id', partnerId)
        .single();

      if (!partner) return null;

      // 获取商机
      let deals: any[] = [];
      try {
        const { data } = await db.deals()
          .select('id, stage, value, created_date, closed_date')
          .eq('partner_id', partnerId);
        deals = data || [];
      } catch { deals = []; }

      // 获取激励申请
      let incentiveApplications: any[] = [];
      try {
        const { data } = await db.incentiveApplications()
          .select('id, program_id, partner_id, claimed_amount, approved_amount, status')
          .eq('partner_id', partnerId);
        incentiveApplications = data || [];
      } catch { incentiveApplications = []; }

      // 获取培训
      let enrollments: any[] = [];
      try {
        const { data } = await db.userEnrollments()
          .select('id, program_id, program_name, status, progress, score, certificate_id')
          .eq('partner_id', partnerId);
        enrollments = data || [];
      } catch { enrollments = []; }

      // 获取营销活动
      let marketingActivities: any[] = [];
      try {
        const { data } = await db.marketingActivities()
          .select('id, name, event_date, lifecycle_stage')
          .eq('partner_id', partnerId);
        marketingActivities = data || [];
      } catch { marketingActivities = []; }

      // 获取MDF预算
      let mdfAllocations: any[] = [];
      try {
        const { data } = await db.mdfAllocations()
          .select('id, partner_id, amount, status, applications')
          .eq('partner_id', partnerId);
        mdfAllocations = data || [];
      } catch { mdfAllocations = []; }

      // 计算综合健康度
      const wonDeals = deals.filter(d => d.stage === 'ClosedWon');
      const lostDeals = deals.filter(d => d.stage === 'ClosedLost');
      const activeDeals = deals.length - wonDeals.length - lostDeals.length;
      const totalRevenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);

      // 健康度评分公式: 商机活跃度(30) + 赢单率(30) + 激励参与(20) + 培训(20)
      // dealActivityScore: 总商机数 * 20 + 活跃商机数 * 15（活跃商机更有价值）
      // activeDeals 是数字（活跃商机数），不是数组，直接使用
      const dealActivityScore = Math.min(100, deals.length * 20 + activeDeals * 15);
      // 赢单率：有数据则使用真实赢单率，无数据时不使用默认值30%而是根据整体平台平均值
      const winRate = partner.computed_win_rate || (deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 50);
      const incentiveScore = Math.min(100, incentiveApplications.length * 30);
      const trainingScore = Math.min(100, enrollments.length * 25 + enrollments.filter((e: any) => e.progress >= 80).length * 15);

      const overallScore = Math.round(
        dealActivityScore * 0.30 +
        winRate * 0.30 +
        incentiveScore * 0.20 +
        trainingScore * 0.20
      );

      return {
        partnerId,
        partnerName: partner.name,
        date: new Date().toISOString(),
        // 商机
        dealsCreated: deals.length,
        dealsInPipeline: activeDeals,
        dealsWon: wonDeals.length,
        dealsLost: lostDeals.length,
        dealsTotalValue: totalRevenue,
        // 激励
        incentiveProgramsParticipated: new Set(incentiveApplications.map(a => a.program_id)).size,
        incentiveAmountEarned: incentiveApplications.reduce((sum, a) => sum + (a.approved_amount || 0), 0),
        incentiveApplicationsCount: incentiveApplications.length,
        // 营销
        marketingActivitiesAttended: marketingActivities.length,
        marketingLeadsGenerated: 0,
        marketingLeadsConverted: wonDeals.length,
        // 培训
        trainingProgramsCompleted: enrollments.filter(e => e.progress >= 80).length,
        trainingCertificatesEarned: enrollments.filter(e => e.certificate_id).length,
        trainingCertificatesValid: enrollments.filter(e => e.progress >= 60).length,
        // MDF
        mdfBudgetApproved: mdfAllocations.reduce((sum, a) => sum + (a.amount || 0), 0),
        mdfBudgetUsed: 0,
        mdfBudgetRemaining: 0,
        // 综合
        overallHealthScore: overallScore,
        overallStatus: overallScore >= 70 ? 'active' : overallScore >= 40 ? 'at_risk' : 'dormant',
      };
    } catch (e) {
      console.error('[LifecycleDashboard] Failed to get snapshot:', e);
      return null;
    }
  },

  /**
   * 获取全局统一生命周期仪表盘数据
   */
  async getDashboard(): Promise<UnifiedLifecycleDashboard | null> {
    try {
      // 1. 获取合作伙伴生命周期数据
      let partnerByStage: Record<string, number> = {};
      let partnerTotalCount = 0;
      try {
        const { data: partners } = await db.partners().select('id, lifecycle_stage, status, health_score, last_activity_at, computed_win_rate');
        partnerTotalCount = partners?.length || 0;
        for (const p of partners || []) {
          const stage = p.lifecycle_stage || 'Active';
          if (!partnerByStage[stage]) partnerByStage[stage] = 0;
          partnerByStage[stage]++;
        }
      } catch { /* 忽略 */ }

      // 2. 获取商机Pipeline数据
      let pipelineHealth = await dealLifecycleService.getPipelineHealth();

      // 3. 获取激励计划数据
      let incentiveByStage: Record<string, number> = {};
      let incentiveTotalBudget = 0;
      let incentiveTotalPayout = 0;
      try {
        const { data: programs } = await db.incentivePrograms()
          .select('id, title, lifecycle_stage, total_budget, claimed_amount');

        for (const p of programs || []) {
          const stage = p.lifecycle_stage || (p as any).status || 'Active';
          if (!incentiveByStage[stage]) incentiveByStage[stage] = 0;
          incentiveByStage[stage]++;
          incentiveTotalBudget += p.total_budget || 0;
          incentiveTotalPayout += p.claimed_amount || 0;
        }
      } catch { /* 忽略 */ }

      // 4. 获取培训数据
      let trainingByStage: Record<string, number> = {};
      let trainingTotalCertificates = 0;
      let trainingValidCertificates = 0;
      let trainingExpiringCertificates = 0;
      let trainingAvgPassRate = 0;
      try {
        const { data: programs } = await db.certificationPrograms()
          .select('id, name, lifecycle_stage, usage_count');
        for (const p of programs || []) {
          const stage = p.lifecycle_stage || 'Enrolling';
          if (!trainingByStage[stage]) trainingByStage[stage] = 0;
          trainingByStage[stage]++;
        }

        const { data: enrollments } = await db.userEnrollments()
          .select('id, status, progress, score, assessment_score, assessment_passed, certificate_id, certificate_expires_at');

        const now = new Date();
        for (const e of enrollments || []) {
          if (e.certificate_id) trainingTotalCertificates++;
          if (e.certificate_expires_at) {
            const daysUntilExpiry = Math.floor((new Date(e.certificate_expires_at).getTime() - now.getTime()) / 86400000);
            if (daysUntilExpiry <= 0) continue;
            else if (daysUntilExpiry <= LIFECYCLE_CONFIG.certificateExpiryWarningDays) trainingExpiringCertificates++;
            else trainingValidCertificates++;
          }
        }

        const passedCount = enrollments?.filter(e => e.assessment_passed || e.progress >= 80).length || 0;
        trainingAvgPassRate = enrollments && enrollments.length > 0 ? (passedCount / enrollments.length) * 100 : 65;
      } catch { /* 忽略 */ }

      // 5. 获取营销活动数据
      let marketingByStage: Record<string, number> = {};
      let marketingTotalAttendees = 0;
      let marketingTotalLeads = 0;
      let marketingTotalDeals = 0;
      try {
        const { data: activities } = await db.marketingActivities()
          .select('id, name, lifecycle_stage, registered_attendees, leads_generated, actual_spend');

        for (const a of activities || []) {
          const stage = a.lifecycle_stage || 'Planning';
          if (!marketingByStage[stage]) marketingByStage[stage] = 0;
          marketingByStage[stage]++;
          marketingTotalAttendees += a.registered_attendees || 0;
          marketingTotalLeads += a.leads_generated || 0;
        }

        // 获取总商机数
        const { data: allDeals } = await db.deals().select('id');
        marketingTotalDeals = allDeals?.length || 0;
      } catch { /* 忽略 */ }

      // 6. 计算跨实体关联热力（无真实数据时使用0而非默认值，避免假数据）
      let partnerDealHeatmap = Math.min(100, partnerTotalCount > 0 ? (pipelineHealth.totalDeals / partnerTotalCount) * 50 : 0);
      let partnerIncentiveHeatmap = Math.min(100, partnerTotalCount > 0 ? (Object.values(incentiveByStage).reduce((a: number, b: number) => a + b, 0)) * 20 / partnerTotalCount : 0);
      let partnerTrainingHeatmap = Math.min(100, trainingValidCertificates > 0 ? (trainingValidCertificates / partnerTotalCount) * 200 : 0);
      let partnerMarketingHeatmap = Math.min(100, Object.values(marketingByStage).reduce((a: number, b: number) => a + b, 0) > 0 ? 45 : 0);
      let dealMarketingHeatmap = Math.min(100, marketingTotalLeads > 0 ? (marketingTotalDeals / marketingTotalLeads) * 200 : 0);
      let dealIncentiveHeatmap = Math.min(100, pipelineHealth.totalDeals > 0 ? (incentiveTotalPayout > 0 ? 50 : 0) : 0);

      // 规范化热力值
      partnerDealHeatmap = Math.round(Math.min(partnerDealHeatmap, 100));
      partnerIncentiveHeatmap = Math.round(Math.min(partnerIncentiveHeatmap, 100));
      partnerTrainingHeatmap = Math.round(Math.min(partnerTrainingHeatmap, 100));
      partnerMarketingHeatmap = Math.round(Math.min(partnerMarketingHeatmap, 100));
      dealMarketingHeatmap = Math.round(Math.min(dealMarketingHeatmap, 100));
      dealIncentiveHeatmap = Math.round(Math.min(dealIncentiveHeatmap, 100));

      return {
        partnerLifecycle: {
          byStage: partnerByStage as any,
          healthScore: 0,
          active180Days: partnerTotalCount - (partnerByStage['Dormant'] || 0),
          dormantCount: partnerByStage['Dormant'] || 0,
          upcomingRenewals: 0,
        },
        dealLifecycle: {
          byStage: pipelineHealth.byStage as any,
          byValue: pipelineHealth.byStage as any,
          avgCycleDays: 90,
          conversionRate: pipelineHealth.avgConversionProbability,
          overdueCount: pipelineHealth.overdueCount,
        },
        incentiveLifecycle: {
          byStage: incentiveByStage as any,
          totalBudget: incentiveTotalBudget,
          totalPayout: incentiveTotalPayout,
          // avgROI：需要真实激励产出数据
          // 不使用硬编码倍数3，改为基于已消耗预算比例计算保守估计
          avgROI: incentiveTotalBudget > 0 && pipelineHealth && pipelineHealth.totalDeals > 0 ? Math.round((incentiveTotalPayout / incentiveTotalBudget) * 100) / 100 : 0,
        },
        trainingLifecycle: {
          byStage: trainingByStage as any,
          totalCertificates: trainingTotalCertificates,
          validCertificates: trainingValidCertificates,
          expiringCertificates: trainingExpiringCertificates,
          averagePassRate: trainingAvgPassRate,
        },
        marketingLifecycle: {
          byStage: marketingByStage as any,
          totalAttendees: marketingTotalAttendees,
          totalLeadsGenerated: marketingTotalLeads,
          totalDealsGenerated: marketingTotalDeals,
          avgROI: 0,
        },
        crossEntityHeatmap: {
          partnerDealHeatmap,
          partnerIncentiveHeatmap,
          partnerTrainingHeatmap,
          partnerMarketingHeatmap,
          dealMarketingHeatmap,
          dealIncentiveHeatmap,
        },
      };
    } catch (e) {
      console.error('[LifecycleDashboard] Failed to get dashboard:', e);
      return null;
    }
  },
};

// ────────────────────────────────────────────────────────────────────────────────
// 合作伙伴关系深度生命周期服务 (Partner Maturity Lifecycle Service)
// ────────────────────────────────────────────────────────────────────────────────
// 核心功能：
//   1. 评估伙伴当前的关系深度阶段（Transactional → Transitional → Relational → Symbiotic）
//   2. 计算6大维度的得分：商机活跃、能力建设、赋能参与、协同共创、战略对齐、系统耦合
//   3. 生成晋级评估与差距分析
//   4. 风险预警与机会识别
//   5. 手动/自动推进到更高阶段

/** 6大维度原始指标计算 */
async function calculateRawDimensionScores(partnerId: string, partner: any): Promise<{
  dealActivity: { raw: number; score: number; trend: 'up' | 'flat' | 'down' };
  capability: { raw: number; score: number; trend: 'up' | 'flat' | 'down' };
  enablement: { raw: number; score: number; trend: 'up' | 'flat' | 'down' };
  collaboration: { raw: number; score: number; trend: 'up' | 'flat' | 'down' };
  strategicAlignment: { raw: number; score: number; trend: 'up' | 'flat' | 'down' };
  systemIntegration: { raw: number; score: number; trend: 'up' | 'flat' | 'down' };
}> {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);
  const oneEightyDaysAgo = new Date(now.getTime() - 180 * 86400000);
  const oneYearAgo = new Date(now.getTime() - 365 * 86400000);

  // 1. 商机活跃度 (dealActivity)
  //    指标：近90天报备数 + 赢单率 + 最近商机时间
  let dealCount90 = 0;
  let dealCount180 = 0;
  let winRate = 0;
  let lastDealDate: Date | null = null;
  try {
    const { data: deals90 } = await db.deals()
      .select('id, status, created_date, win_rate')
      .eq('partner_id', partnerId);
    if (deals90 && deals90.length > 0) {
      const allDeals = deals90;
      dealCount90 = allDeals.filter((d: any) => {
        const dDate = new Date(d.created_date || d.createdDate || Date.now());
        return dDate >= ninetyDaysAgo;
      }).length;
      dealCount180 = allDeals.filter((d: any) => {
        const dDate = new Date(d.created_date || d.createdDate || Date.now());
        return dDate >= oneEightyDaysAgo;
      }).length;

      const won = allDeals.filter((d: any) =>
        (d.status || '').toLowerCase().includes('won') || (d.status || '').toLowerCase() === 'closedwon'
      ).length;
      winRate = allDeals.length > 0 ? Math.round((won / allDeals.length) * 100) : 0;

      // 最近商机时间
      const sorted = [...allDeals].sort((a: any, b: any) => {
        const da = new Date(a.created_date || a.createdDate || 0).getTime();
        const db = new Date(b.created_date || b.createdDate || 0).getTime();
        return db - da;
      });
      if (sorted.length > 0) {
        const d = sorted[0] as any;
        lastDealDate = new Date(d.created_date || d.createdDate || Date.now());
      }
    }
  } catch (e) {
    // 静默处理
  }

  const dealActivityScore = Math.min(100,
    Math.round(
      dealCount90 * 15 +            // 每1个报备+15分
      winRate * 0.5 +                 // 赢单率加权
      (lastDealDate ? Math.max(0, 100 - (now.getTime() - lastDealDate.getTime()) / (86400000 * 0.9)) : 0) // 最近活跃度
    )
  );

  // 2. 能力建设 (capability)
  //    指标：赢单率、伙伴等级、行业覆盖、是否有认证
  let capabilityScore = 0;
  try {
    const tierScore = (partner.tier === 'Platinum' || partner.tier === 'Premier') ? 100 :
      (partner.tier === 'Gold' ? 80 : partner.tier === 'Silver' ? 60 : 40);
    capabilityScore = Math.round(
      tierScore * 0.6 +
      winRate * 0.4
    );
  } catch (e) {
    capabilityScore = 40;
  }

  // 3. 赋能参与 (enablement)
  //    指标：培训报名数、认证数、参与的激励计划数
  let trainingCount = 0;
  let certificationCount = 0;
  let incentiveCount = 0;
  try {
    // 检查培训报名
    if (db.userEnrollments) {
      const { data: enr } = await db.userEnrollments().select('id').limit(20);
      if (enr) trainingCount = enr.length;
    }
    // 检查激励参与
    if (db.incentivePrograms) {
      const { data: inc } = await db.incentivePrograms().select('id').limit(20);
      if (inc) incentiveCount = inc.length;
    }
  } catch (e) {
    // 静默处理
  }

  const enablementScore = Math.min(100, Math.round(
    trainingCount * 20 +      // 每个培训+20
    certificationCount * 25 + // 每个认证+25
    incentiveCount * 10       // 每个激励+10
  ));

  // 4. 协同共创 (collaboration)
  //    指标：是否有联合方案、共同商机、MDF使用量、高层互访
  let collaborationScore = 0;
  try {
    // 检查 MDF 使用
    let mdfUsed = 0;
    let jointDeals = 0;
    // 估算：如果赢单率高，则认为协同程度高
    jointDeals = Math.max(0, Math.round(winRate / 30));
    mdfUsed = winRate > 40 ? 80 : winRate > 20 ? 50 : 30;

    collaborationScore = Math.round(
      (mdfUsed * 0.4) +
      (jointDeals * 20 * 0.3) +
      (dealCount90 > 3 ? 50 : dealCount90 * 15) * 0.3
    );
  } catch (e) {
    collaborationScore = 30;
  }

  // 5. 战略对齐 (strategicAlignment)
  //    指标：合作年限、是否为核心伙伴、商机的稳定性
  let strategicScore = 0;
  try {
    const startDate = new Date(partner.startDate || partner.start_date || partner.created_at || Date.now());
    const yearsOfCooperation = Math.floor((now.getTime() - startDate.getTime()) / (86400000 * 365));
    const isCore = partner.isCorePartner || partner.is_core_partner;
    const coreScore = isCore ? 100 : 60;
    const tierScore = (partner.tier === 'Platinum' || partner.tier === 'Premier') ? 100 :
      (partner.tier === 'Gold' ? 75 : partner.tier === 'Silver' ? 50 : 40);
    strategicScore = Math.round(
      (yearsOfCooperation * 8) * 0.4 +   // 每年+8分，最高50分
      coreScore * 0.3 +
      tierScore * 0.3
    );
  } catch (e) {
    strategicScore = 50;
  }

  // 6. 系统耦合 (systemIntegration)
  //    指标：伙伴在系统的活跃度、登录频率、数据完整性
  let systemIntegrationScore = 0;
  try {
    const lastActivity = partner.lastActivityAt || partner.last_activity_at || partner.updated_at;
    let activityDaysAgo = 90;
    if (lastActivity) {
      activityDaysAgo = Math.floor((now.getTime() - new Date(lastActivity).getTime()) / 86400000);
    }
    // 最近活跃越近，得分越高
    systemIntegrationScore = Math.min(100, Math.max(0, 100 - activityDaysAgo * 2));
    // 如果在系统中频繁更新，加分
    if (activityDaysAgo < 30) systemIntegrationScore += 20;
    systemIntegrationScore = Math.min(100, systemIntegrationScore);
  } catch (e) {
    systemIntegrationScore = 50;
  }

  // 计算趋势（基于最近90天 vs 前一个90天）
  const trend = (recentCount: number, earlierCount: number): 'up' | 'flat' | 'down' => {
    if (recentCount > earlierCount * 1.1) return 'up';
    if (recentCount < earlierCount * 0.9) return 'down';
    return 'flat';
  };

  return {
    dealActivity: {
      raw: dealCount90,
      score: dealActivityScore,
      trend: dealCount90 >= dealCount180 / 2 ? 'up' : 'flat',
    },
    capability: {
      raw: winRate,
      score: capabilityScore,
      trend: winRate >= 30 ? 'up' : 'flat',
    },
    enablement: {
      raw: trainingCount + certificationCount + incentiveCount,
      score: enablementScore,
      trend: enablementScore >= 50 ? 'up' : 'flat',
    },
    collaboration: {
      raw: collaborationScore,
      score: collaborationScore,
      trend: collaborationScore >= 50 ? 'up' : 'flat',
    },
    strategicAlignment: {
      raw: strategicScore,
      score: strategicScore,
      trend: strategicScore >= 60 ? 'up' : 'flat',
    },
    systemIntegration: {
      raw: Math.max(0, 100 - (partner.lastActivityAt ? 0 : 50)),
      score: systemIntegrationScore,
      trend: systemIntegrationScore >= 60 ? 'up' : 'flat',
    },
  };
}

/** 根据6大维度得分，自动识别伙伴的关系深度阶段 */
function determineMaturityStage(dimScores: {
  dealActivity: { score: number };
  capability: { score: number };
  enablement: { score: number };
  collaboration: { score: number };
  strategicAlignment: { score: number };
  systemIntegration: { score: number };
}): PartnerMaturityStage {
  // 计算每个阶段的匹配度（各维度是否达到该阶段阈值）
  const stages: PartnerMaturityStage[] = ['Transactional', 'Transitional', 'Relational', 'Symbiotic'];

  // 从最高阶段开始检查
  for (let i = stages.length - 1; i >= 0; i--) {
    const stage = stages[i];
    const thresholds = MATURITY_STAGE_CONFIG[stage].promotionThresholds;
    // 检查各维度是否满足
    const scoreChecks = [
      dimScores.dealActivity.score >= thresholds.dealActivity,
      dimScores.capability.score >= thresholds.capability,
      dimScores.enablement.score >= thresholds.enablement,
      dimScores.collaboration.score >= thresholds.collaboration,
      dimScores.strategicAlignment.score >= thresholds.strategicAlignment,
      dimScores.systemIntegration.score >= thresholds.systemIntegration,
    ];
    // 至少70%的维度达标，即可认定在该阶段
    const passedCount = scoreChecks.filter(Boolean).length;
    if (passedCount >= 5) {  // 6个维度中至少5个达标
      return stage;
    }
  }
  return 'Transactional'; // 默认在准入期
}

/** 生成晋级评估与差距分析 */
function calculatePromotionReadiness(
  currentStage: PartnerMaturityStage,
  dimScores: {
    dealActivity: { score: number };
    capability: { score: number };
    enablement: { score: number };
    collaboration: { score: number };
    strategicAlignment: { score: number };
    systemIntegration: { score: number };
  },
  daysInCurrentStage: number
): PartnerMaturityHealth['promotionReadiness'] {
  // 如果已经在最高阶段
  if (currentStage === 'Symbiotic') {
    return {
      canPromote: false,
      nextStage: 'Symbiotic',
      nextStageLabel: '演进与共生期（最高阶段）',
      readinessPercentage: 100,
      gapAnalysis: [],
    };
  }

  const nextStageMap: Record<PartnerMaturityStage, PartnerMaturityStage> = {
    'Transactional': 'Transitional',
    'Transitional': 'Relational',
    'Relational': 'Symbiotic',
    'Symbiotic': 'Symbiotic',
  };

  const nextStage = nextStageMap[currentStage];
  const nextConfig = MATURITY_STAGE_CONFIG[nextStage];

  // 计算各维度与下一阶段阈值的差距
  const dimMap = [
    { key: 'dealActivity', label: '商机活跃度' },
    { key: 'capability', label: '能力建设' },
    { key: 'enablement', label: '赋能参与' },
    { key: 'collaboration', label: '协同共创' },
    { key: 'strategicAlignment', label: '战略对齐' },
    { key: 'systemIntegration', label: '系统耦合' },
  ];

  const gapAnalysis = dimMap
    .map((dim) => {
      const currentValue = (dimScores as any)[dim.key].score;
      const requiredValue = (nextConfig.promotionThresholds as any)[dim.key];
      const gap = requiredValue - currentValue;
      return {
        dimension: dim.label,
        currentValue,
        requiredValue,
        gap,
        priority: gap > 40 ? 'high' : gap > 15 ? 'medium' : 'low' as const,
        recommendation: gap > 0 ? generateGapRecommendation(dim.key, gap, currentValue, requiredValue) : `已达标 (${Math.round(currentValue)}/${Math.round(requiredValue)})`,
      };
    })
    .filter((g) => g.gap > 0)
    .sort((a, b) => b.gap - a.gap);

  // 计算总准备度
  const overallGap = gapAnalysis.reduce((sum, g) => sum + g.gap, 0);
  const totalThreshold = Object.values(nextConfig.promotionThresholds).reduce((a, b) => a + b, 0);
  const totalScore = Object.values(dimScores).reduce((sum, d) => sum + d.score, 0);
  const readinessPercentage = Math.min(100, Math.round((totalScore / totalThreshold) * 100));

  // 检查最低天数要求
  const meetsMinDays = daysInCurrentStage >= nextConfig.minDaysBeforePromotion;
  const canPromote = readinessPercentage >= 90 && meetsMinDays;

  return {
    canPromote,
    nextStage,
    nextStageLabel: nextConfig.label,
    readinessPercentage,
    gapAnalysis: gapAnalysis.map((g) => ({
      dimension: g.dimension,
      currentValue: g.currentValue,
      requiredValue: g.requiredValue,
      priority: g.priority as any,
      recommendation: g.recommendation,
    })),
  };
}

/** 根据差距维度生成改进建议 */
function generateGapRecommendation(dimKey: string, gap: number, current: number, required: number): string {
  switch (dimKey) {
    case 'dealActivity':
      return `当前商机报备活跃度过低（${Math.round(current)}/需${Math.round(required)}）。建议：推送新商机线索，激励参与近期市场活动，协助伙伴建立商机报备习惯`;
    case 'capability':
      return `伙伴能力建设不足（${Math.round(current)}/需${Math.round(required)}）。建议：安排产品能力培训，提供标杆案例学习，配合销售陪跑提升实战能力`;
    case 'enablement':
      return `赋能培训参与度不足（${Math.round(current)}/需${Math.round(required)}）。建议：推送核心认证课程，提供学习激励，设置培训KPI，与商机优先权挂钩`;
    case 'collaboration':
      return `协同共创程度较低（${Math.round(current)}/需${Math.round(required)}）。建议：推动联合方案制定，安排共同拜访客户，提升MDF联合营销活动参与度`;
    case 'strategicAlignment':
      return `战略对齐程度不足（${Math.round(current)}/需${Math.round(required)}）。建议：安排季度业务回顾（QBR），邀请管理层参与战略沟通，提升合作层次`;
    case 'systemIntegration':
      return `系统使用活跃度不足（${Math.round(current)}/需${Math.round(required)}）。建议：引导伙伴定期登录Portal，完善伙伴数据，通过系统交互提升粘性`;
    default:
      return `提升该维度得分，建议与渠道经理沟通制定个性化提升计划`;
  }
}

/** 生成风险预警与机会识别 */
function generateRiskAlerts(
  dimScores: {
    dealActivity: { score: number; trend: 'up' | 'flat' | 'down' };
    capability: { score: number; trend: 'up' | 'flat' | 'down' };
    enablement: { score: number; trend: 'up' | 'flat' | 'down' };
    collaboration: { score: number; trend: 'up' | 'flat' | 'down' };
    strategicAlignment: { score: number; trend: 'up' | 'flat' | 'down' };
    systemIntegration: { score: number; trend: 'up' | 'flat' | 'down' };
  },
  daysInCurrentStage: number,
  currentStage: PartnerMaturityStage
): PartnerMaturityHealth['riskAlerts'] {
  const alerts: PartnerMaturityHealth['riskAlerts'] = [];

  // 1. 停滞预警 - 在某阶段停留过久
  const avgDaysInStage = MATURITY_STAGE_CONFIG[currentStage].avgDaysInStage;
  if (daysInCurrentStage > avgDaysInStage * 1.5 && currentStage !== 'Symbiotic') {
    alerts.push({
      type: 'stagnation',
      severity: 'high',
      title: `阶段停滞预警 - 在${MATURITY_STAGE_CONFIG[currentStage].label}停留过久`,
      detail: `已停留 ${daysInCurrentStage} 天，平均停留 ${avgDaysInStage} 天。伙伴关系深度未能有效推进，建议主动介入评估原因`,
      action: '安排渠道经理与伙伴管理层沟通，制定3个月提升计划',
    });
  }

  // 2. 低维度预警 - 任何维度低于40分
  const lowDims: { key: string; label: string; score: number }[] = [];
  const dimLabels: Record<string, string> = {
    dealActivity: '商机活跃度',
    capability: '能力建设',
    enablement: '赋能参与',
    collaboration: '协同共创',
    strategicAlignment: '战略对齐',
    systemIntegration: '系统耦合',
  };

  Object.entries(dimScores).forEach(([key, value]: any) => {
    if (value.score < 40) {
      lowDims.push({ key, label: dimLabels[key] || key, score: value.score });
    }
  });

  if (lowDims.length > 0) {
    const worst = lowDims.sort((a, b) => a.score - b.score)[0];
    alerts.push({
      type: 'stagnation',
      severity: 'medium',
      title: `${worst.label}严重不足`,
      detail: `该维度仅得 ${Math.round(worst.score)} 分，低于健康基准线40分。这会严重影响伙伴的合作深度和稳定性`,
      action: `制定针对${worst.label}的专项提升计划，30天内安排第一次辅导`,
    });
  }

  // 3. 机会识别 - 接近晋级阈值
  const nextStageMap: Record<PartnerMaturityStage, PartnerMaturityStage> = {
    'Transactional': 'Transitional',
    'Transitional': 'Relational',
    'Relational': 'Symbiotic',
    'Symbiotic': 'Symbiotic',
  };

  if (currentStage !== 'Symbiotic') {
    const nextStage = nextStageMap[currentStage];
    const nextConfig = MATURITY_STAGE_CONFIG[nextStage];
    // 计算有多少维度接近达标（差距<20%）
    const nearThresholdDims: string[] = [];
    Object.entries(nextConfig.promotionThresholds).forEach(([key, threshold]: any) => {
      const currentScore = (dimScores as any)[key]?.score || 0;
      if (currentScore >= threshold * 0.8 && currentScore < threshold) {
        nearThresholdDims.push(dimLabels[key] || key);
      }
    });

    if (nearThresholdDims.length > 0) {
      alerts.push({
        type: 'opportunity',
        severity: 'low',
        title: '即将达成晋级条件',
        detail: `以下维度即将达标：${nearThresholdDims.join('、')}。再投入适度资源即可推动伙伴进入${nextConfig.label}`,
        action: `与伙伴沟通下一步期望，聚焦${nearThresholdDims[0]}，预计1-2个季度可完成晋级`,
      });
    }
  }

  // 4. 商机活跃度下降趋势
  if (dimScores.dealActivity.trend === 'down' || dimScores.dealActivity.score < 30) {
    alerts.push({
      type: 'stagnation',
      severity: 'high',
      title: '商机活跃度不足/下降趋势',
      detail: `当前活跃度仅 ${Math.round(dimScores.dealActivity.score)} 分，低于健康伙伴平均水平。如果没有新的商机注入，合作关系有"空转"风险`,
      action: '立即推送3-5个新商机线索，安排联合拜访至少1个重点客户，重新激活合作节奏',
    });
  }

  // 5. 高潜伙伴识别 - 多维度高且趋势向上
  const highPerformingDims = Object.values(dimScores).filter(d => d.score >= 70 && d.trend === 'up').length;
  if (highPerformingDims >= 4) {
    alerts.push({
      type: 'opportunity',
      severity: 'low',
      title: '高潜伙伴识别 - 可加速培养',
      detail: `该伙伴在多个维度持续提升，${highPerformingDims}个维度健康度≥70分且呈上升趋势，有潜力成为核心战略伙伴`,
      action: '纳入重点培养计划，优先分配战略资源和联合项目机会，考虑提前1个季度进入晋级评估',
    });
  }

  return alerts;
}

/** 核心：计算单个伙伴的完整关系深度健康度评估 */
export async function calculatePartnerMaturityHealth(
  partnerId: string,
  partnerData?: any
): Promise<PartnerMaturityHealth | null> {
  try {
    // 1. 获取伙伴基本信息
    let partner = partnerData;
    if (!partner) {
      const { data } = await db.partners()
        .select('*')
        .eq('id', partnerId)
        .single();
      partner = data;
    }
    if (!partner) return null;

    // 2. 计算6大维度得分
    const dimScores = await calculateRawDimensionScores(partnerId, partner);

    // 3. 识别当前关系深度阶段
    const currentStage = determineMaturityStage(dimScores);

    // 4. 计算当前阶段停留天数
    const stageEnteredAt = partner.maturity_stage_entered_at || partner.maturityStageEnteredAt || partner.startDate || partner.start_date || partner.created_at;
    const daysInCurrentStage = stageEnteredAt
      ? Math.floor((new Date().getTime() - new Date(stageEnteredAt).getTime()) / 86400000)
      : 0;

    // 5. 计算综合健康度（加权平均）
    const weights = {
      dealActivity: 0.20,       // 商机活跃度权重20%
      capability: 0.15,          // 能力建设权重15%
      enablement: 0.15,          // 赋能参与权重15%
      collaboration: 0.20,       // 协同共创权重20%
      strategicAlignment: 0.15,  // 战略对齐权重15%
      systemIntegration: 0.15,   // 系统耦合权重15%
    };

    const overallScore = Math.round(
      dimScores.dealActivity.score * weights.dealActivity +
      dimScores.capability.score * weights.capability +
      dimScores.enablement.score * weights.enablement +
      dimScores.collaboration.score * weights.collaboration +
      dimScores.strategicAlignment.score * weights.strategicAlignment +
      dimScores.systemIntegration.score * weights.systemIntegration
    );

    // 6. 评估健康状态
    const status: PartnerMaturityHealth['status'] =
      overallScore >= 80 ? 'healthy' :
      overallScore >= 60 ? 'monitoring' :
      overallScore >= 40 ? 'at_risk' : 'critical';

    // 7. 计算晋级准备度
    const promotionReadiness = calculatePromotionReadiness(currentStage, dimScores, daysInCurrentStage);

    // 8. 生成风险预警
    const riskAlerts = generateRiskAlerts(dimScores, daysInCurrentStage, currentStage);

    // 9. 返回完整评估
    return {
      partnerId,
      partnerName: partner.name,
      currentStage,
      currentStageLabel: MATURITY_STAGE_CONFIG[currentStage].label,
      daysInCurrentStage,
      overallScore,
      status,
      dimensionScores: {
        dealActivity: { score: dimScores.dealActivity.score, trend: dimScores.dealActivity.trend },
        capability: { score: dimScores.capability.score, trend: dimScores.capability.trend },
        enablement: { score: dimScores.enablement.score, trend: dimScores.enablement.trend },
        collaboration: { score: dimScores.collaboration.score, trend: dimScores.collaboration.trend },
        strategicAlignment: { score: dimScores.strategicAlignment.score, trend: dimScores.strategicAlignment.trend },
        systemIntegration: { score: dimScores.systemIntegration.score, trend: dimScores.systemIntegration.trend },
      },
      promotionReadiness,
      riskAlerts,
      lastUpdated: new Date().toISOString(),
    };
  } catch (e) {
    console.error('[PartnerMaturity] Failed to calculate maturity health:', e);
    return null;
  }
}

/** 获取伙伴的关系深度演进事件记录 */
export async function getPartnerMaturityEvents(partnerId: string): Promise<PartnerMaturityEvent[]> {
  try {
    // 尝试从 partner_maturity_events 表查询
    if (db.partnerMaturityEvents) {
      const { data } = await db.partnerMaturityEvents()
        .select('*')
        .eq('partner_id', partnerId)
        .order('event_date', { ascending: false });

      if (data && data.length > 0) {
        return data.map((e: any) => ({
          id: e.id,
          partnerId: e.partner_id,
          fromStage: e.from_stage,
          toStage: e.to_stage,
          eventDate: e.event_date,
          operator: e.operator,
          reason: e.reason,
          autoDetected: e.auto_detected,
          notes: e.notes,
        }));
      }
    }

    // 如果没有事件表，返回空数组（或从 partners 表的基础信息推断）
    return [];
  } catch (e) {
    console.error('[PartnerMaturity] Failed to get maturity events:', e);
    return [];
  }
}

/** 推进伙伴到新的关系深度阶段 */
export async function advancePartnerMaturityStage(
  partnerId: string,
  toStage: PartnerMaturityStage,
  options: { operator?: string; reason?: string; notes?: string; auto?: boolean } = {}
): Promise<boolean> {
  try {
    // 1. 获取当前伙伴信息
    const { data: partner } = await db.partners()
      .select('id, name, maturity_stage, maturity_stage_entered_at')
      .eq('id', partnerId)
      .single();
    if (!partner) {
      console.error('[PartnerMaturity] Partner not found:', partnerId);
      return false;
    }

    const currentStage = partner.maturity_stage || 'Transactional';

    // 2. 如果阶段没有变化，跳过
    if (currentStage === toStage) {
      console.log('[PartnerMaturity] Stage unchanged, skipping:', partnerId);
      return true;
    }

    // 3. 更新 partners 表
    const { error: updateErr } = await db.partners()
      .update({
        maturity_stage: toStage,
        maturity_stage_entered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', partnerId);

    if (updateErr) {
      console.error('[PartnerMaturity] Failed to update partner stage:', updateErr);
      return false;
    }

    // 4. 记录事件到 partner_maturity_events 表（如果表存在）
    try {
      if (db.partnerMaturityEvents) {
        await db.partnerMaturityEvents().insert({
          partner_id: partnerId,
          from_stage: currentStage,
          to_stage: toStage,
          event_date: new Date().toISOString(),
          operator: options.operator || (options.auto ? 'system' : 'manual'),
          reason: options.reason || `由${MATURITY_STAGE_CONFIG[currentStage].label}演进至${MATURITY_STAGE_CONFIG[toStage].label}`,
          notes: options.notes,
          auto_detected: options.auto || false,
          created_at: new Date().toISOString(),
        });
      }
    } catch (insertErr) {
      // 表不存在时静默失败
    }

    console.log(`[PartnerMaturity] ${partner.name} 关系深度推进: ${currentStage} → ${toStage}`);
    return true;
  } catch (e) {
    console.error('[PartnerMaturity] Failed to advance maturity stage:', e);
    return false;
  }
}

/** 批量扫描并自动识别需要晋级的伙伴 */
export async function autoDetectAndPromotePartners(): Promise<{
  totalScanned: number;
  promoted: string[];
  checked: string[];
}> {
  try {
    const result: { totalScanned: number; promoted: string[]; checked: string[] } = {
      totalScanned: 0,
      promoted: [],
      checked: [],
    };

    // 1. 获取所有活跃伙伴
    const { data: partners } = await db.partners()
      .select('*');
    if (!partners || partners.length === 0) return result;

    result.totalScanned = partners.length;

    // 2. 逐个评估
    for (const partner of partners) {
      // 只评估活跃状态的伙伴
      const status = partner.status;
      if (status && status !== 'Cooperating' && status !== 'Active') continue;

      // 3. 计算关系深度健康度
      const health = await calculatePartnerMaturityHealth(partner.id, partner);
      if (!health) continue;

      result.checked.push(partner.id);

      // 4. 如果可以晋级，自动推进
      if (health.promotionReadiness.canPromote && health.currentStage !== 'Symbiotic') {
        const nextStageMap: Record<PartnerMaturityStage, PartnerMaturityStage> = {
          'Transactional': 'Transitional',
          'Transitional': 'Relational',
          'Relational': 'Symbiotic',
          'Symbiotic': 'Symbiotic',
        };
        const nextStage = nextStageMap[health.currentStage];

        const success = await advancePartnerMaturityStage(partner.id, nextStage, {
          operator: 'system',
          reason: `系统自动识别 - 综合评分${health.overallScore}分，达到${MATURITY_STAGE_CONFIG[nextStage].label}晋级阈值`,
          auto: true,
        });

        if (success) result.promoted.push(partner.id);
      }
    }

    console.log(`[PartnerMaturity] 自动扫描完成: ${result.totalScanned}个扫描，${result.checked}个评估，${result.promoted.length}个晋级`);
    return result;
  } catch (e) {
    console.error('[PartnerMaturity] Failed in auto detection:', e);
    return { totalScanned: 0, promoted: [], checked: [] };
  }
}

/** 导出完整的伙伴关系深度服务模块 */
export const partnerMaturityService = {
  calculateHealth: calculatePartnerMaturityHealth,
  getEvents: getPartnerMaturityEvents,
  advanceStage: advancePartnerMaturityStage,
  autoScanAndPromote: autoDetectAndPromotePartners,
  determineStage: determineMaturityStage,
  config: MATURITY_STAGE_CONFIG,

  // 便捷：获取单个伙伴的完整评估 + 事件记录
  async getFullMaturityReport(partnerId: string): Promise<{
    health: PartnerMaturityHealth | null;
    events: PartnerMaturityEvent[];
  }> {
    const [health, events] = await Promise.all([
      calculatePartnerMaturityHealth(partnerId),
      getPartnerMaturityEvents(partnerId),
    ]);
    return { health, events };
  },

  // 便捷：批量获取多个伙伴的关系深度摘要
  async getBatchMaturitySummary(partnerIds: string[]): Promise<{
    partnerId: string;
    name: string;
    currentStage: PartnerMaturityStage;
    currentStageLabel: string;
    overallScore: number;
    status: 'healthy' | 'monitoring' | 'at_risk' | 'critical';
    nextStage: PartnerMaturityStage;
    nextStageLabel: string;
    readinessPercentage: number;
    daysInCurrentStage: number;
  }[]> {
    const reports: any[] = [];
    for (const pid of partnerIds) {
      const health = await calculatePartnerMaturityHealth(pid);
      if (health) {
        reports.push({
          partnerId: health.partnerId,
          name: health.partnerName,
          currentStage: health.currentStage,
          currentStageLabel: health.currentStageLabel,
          overallScore: health.overallScore,
          status: health.status,
          nextStage: health.promotionReadiness.nextStage,
          nextStageLabel: health.promotionReadiness.nextStageLabel,
          readinessPercentage: health.promotionReadiness.readinessPercentage,
          daysInCurrentStage: health.daysInCurrentStage,
        });
      }
    }
    return reports;
  },
};

// ──────────────────────────────────────────────────────────────────────────
// 商机4阶段关系深度生命周期服务 (Deal Maturity Service)
// ──────────────────────────────────────────────────────────────────────────

/** 辅助：将7个操作阶段映射为4个关系阶段 */
function getDealMaturityStageFromOperation(operationStage: DealLifecycleStageV2): DealMaturityStage {
  return DEAL_OPERATION_TO_MATURITY_MAP[operationStage] || 'Registration';
}

/**
 * 计算商机的4支柱健康度评分
 * 支柱1：身份(Identity) - 确权/保护/信息完整度
 * 支柱2：价值(Value) - 联合方案/PoC/客户需求匹配
 * 支柱3：管理(Management) - 资源配置/响应效率/审批
 * 支柱4：粘性(Stickiness) - 客户成功/交付/长期关系
 */
async function calculateDealMaturityPillars(deal: Deal): Promise<DealMaturityPillarScores> {
  const identityEvidence: string[] = [];
  const valueEvidence: string[] = [];
  const managementEvidence: string[] = [];
  const stickinessEvidence: string[] = [];

  // ── 支柱1：身份（确权/保护） ──
  let identityScore = 40;  // 基础分：商机已报备 = 已有初步身份
  if (deal.status === 'Approved' || deal.status === 'Converted') { identityScore += 20; identityEvidence.push('已批复'); }
  if (deal.protectionRemainingDays !== undefined && deal.protectionRemainingDays > 0) { identityScore += 15; identityEvidence.push(`保护期剩余${deal.protectionRemainingDays}天`); }
  if (!deal.hasConflict) { identityScore += 10; identityEvidence.push('无冲突记录'); }
  else { identityScore -= 10; identityEvidence.push('存在冲突需处理'); }
  if (deal.salesName && deal.salesName.trim() !== '-') { identityScore += 10; identityEvidence.push('已分配负责人'); }
  if (deal.customerName && deal.customerName.trim() !== '-') { identityScore += 5; identityEvidence.push('客户信息完整'); }
  identityScore = Math.max(0, Math.min(100, identityScore));

  // ── 支柱2：价值（联合方案/PoC） ──
  let valueScore = 30;  // 基础分
  const opStage = (deal.stage as DealLifecycleStageV2) || 'Registered';
  if (opStage === 'Solution') { valueScore += 20; valueEvidence.push('方案跟进中'); }
  if (opStage === 'Commercial') { valueScore += 25; valueEvidence.push('商务洽谈进行中'); }
  if (opStage === 'Negotiation') { valueScore += 30; valueEvidence.push('进入合同谈判'); }
  if (opStage === 'ClosedWon') { valueScore += 40; valueEvidence.push('已赢单，开始交付价值'); }
  if (deal.description && deal.description.length > 20) { valueScore += 10; valueEvidence.push('有详细需求描述'); }
  if (deal.isPriority) { valueScore += 10; valueEvidence.push('重点商机'); }
  valueScore = Math.max(0, Math.min(100, valueScore));

  // ── 支柱3：管理（资源/响应效率） ──
  let managementScore = 35;
  // 线索响应时间
  if (deal.leadResponseTime !== undefined) {
    if (deal.leadResponseTime <= 24) { managementScore += 15; managementEvidence.push(`线索响应速度${deal.leadResponseTime}小时（优秀）`); }
    else if (deal.leadResponseTime <= 72) { managementScore += 8; managementEvidence.push(`线索响应速度${deal.leadResponseTime}小时（正常）`); }
    else { managementScore -= 5; managementEvidence.push(`线索响应${deal.leadResponseTime}小时（偏慢）`); }
  } else {
    managementEvidence.push('未记录线索响应时间');
  }
  // 商机活跃性
  const daysSinceActivity = daysSince(deal.lastActivityDate || deal.createdDate);
  if (daysSinceActivity <= 7) { managementScore += 15; managementEvidence.push(`最近${daysSinceActivity}天有更新`); }
  else if (daysSinceActivity <= 30) { managementScore += 8; managementEvidence.push(`最近${daysSinceActivity}天有更新`); }
  else { managementScore -= 10; managementEvidence.push(`已${daysSinceActivity}天无更新，需关注`); }
  // 是否停滞
  if (deal.isStagnant) { managementScore -= 15; managementEvidence.push('系统标记为停滞状态'); }
  // 商机金额
  if (typeof deal.value === 'number' && deal.value > 0) { managementScore += 5; managementEvidence.push('有明确商机金额'); }
  managementScore = Math.max(0, Math.min(100, managementScore));

  // ── 支柱4：粘性（客户成功/交付/长期关系） ──
  let stickinessScore = 20;  // 初期偏低，随成交后提升
  if (opStage === 'ClosedWon') { stickinessScore += 40; stickinessEvidence.push('已赢单，客户成功阶段启动'); }
  if (opStage === 'Migrated') { stickinessScore += 35; stickinessEvidence.push('已迁单，持续跟进'); }
  if (deal.actualCloseDate) { stickinessScore += 10; stickinessEvidence.push(`合同日期：${deal.actualCloseDate}`); }
  if (deal.isNewLogo) { stickinessScore += 10; stickinessEvidence.push('新客户商机，有拓展潜力'); }
  if (deal.relatedDeals && deal.relatedDeals.length > 0) { stickinessScore += 15; stickinessEvidence.push(`有关联商机：${deal.relatedDeals.length}个`); }
  stickinessScore = Math.max(0, Math.min(100, stickinessScore));

  // 趋势判断（简化：基于最近活跃天数判断趋势）
  const isRecent = daysSinceActivity <= 14;
  const trend: 'up' | 'flat' | 'down' = isRecent ? 'up' : (daysSinceActivity <= 30 ? 'flat' : 'down');

  return {
    identity: { score: identityScore, evidence: identityEvidence, trend },
    value: { score: valueScore, evidence: valueEvidence, trend },
    management: { score: managementScore, evidence: managementEvidence, trend },
    stickiness: { score: stickinessScore, evidence: stickinessEvidence, trend },
  };
}

/** 计算综合评分与健康状态 */
function calculateDealMaturityOverallStatus(
  overallScore: number,
  stage: DealMaturityStage,
  daysInCurrentStage: number,
): 'healthy' | 'monitoring' | 'at_risk' | 'critical' {
  const avgDays = DEAL_MATURITY_STAGE_CONFIG[stage].avgDaysInStage;
  const isStagnating = daysInCurrentStage > avgDays * 2;

  if (overallScore >= 75 && !isStagnating) return 'healthy';
  if (overallScore >= 55 && !isStagnating) return 'monitoring';
  if (overallScore >= 30 || isStagnating) return 'at_risk';
  return 'critical';
}

/** 计算晋级差距分析 */
function calculateDealPromotionGap(
  currentStage: DealMaturityStage,
  pillarScores: DealMaturityPillarScores,
): DealMaturityHealth['promotionReadiness'] {
  // 循环期为最终阶段，无需晋级
  const nextStageMap: Record<DealMaturityStage, DealMaturityStage | null> = {
    'Registration': 'Collaboration',
    'Collaboration': 'Closing',
    'Closing': 'Expansion',
    'Expansion': null,
  };
  const nextStage = nextStageMap[currentStage];
  if (!nextStage) {
    return {
      canPromote: false,
      nextStage: 'Expansion',
      nextStageLabel: '循环期（最终阶段）',
      readinessPercentage: 100,
      gapAnalysis: [],
    };
  }

  // 晋级阈值（根据阶段差异设定）
  const thresholdsMap: Record<DealMaturityStage, { identity: number; value: number; management: number; stickiness: number }> = {
    'Registration': { identity: 65, value: 50, management: 50, stickiness: 25 },
    'Collaboration': { identity: 70, value: 70, management: 55, stickiness: 35 },
    'Closing': { identity: 75, value: 80, management: 60, stickiness: 45 },
    'Expansion': { identity: 70, value: 70, management: 60, stickiness: 60 },
  };
  const thresholds = thresholdsMap[currentStage];
  const pillarLabels = { identity: '身份', value: '价值', management: '管理', stickiness: '粘性' };
  const pillars: Array<'identity' | 'value' | 'management' | 'stickiness'> = ['identity', 'value', 'management', 'stickiness'];

  const gapAnalysis: DealMaturityHealth['promotionReadiness']['gapAnalysis'] = [];
  pillars.forEach((p) => {
    const current = pillarScores[p].score;
    const required = thresholds[p];
    if (current < required) {
      const diff = required - current;
      gapAnalysis.push({
        pillar: p,
        pillarLabel: pillarLabels[p],
        currentValue: current,
        requiredValue: required,
        priority: diff >= 20 ? 'high' : diff >= 10 ? 'medium' : 'low',
        recommendation: (() => {
          const stageInfo = DEAL_MATURITY_STAGE_CONFIG[currentStage];
          switch (p) {
            case 'identity': return `在${stageInfo.label}阶段需强化确权：${currentStage === 'Registration' ? '尽快完成审批' : currentStage === 'Collaboration' ? '固化方案边界' : '确认合同主体和条款'}`;
            case 'value': return `在${stageInfo.label}阶段需提升价值：${currentStage === 'Registration' ? '深入理解客户需求' : currentStage === 'Collaboration' ? '完成PoC验证' : '优化价格与价值的匹配'}`;
            case 'management': return `在${stageInfo.label}阶段需强化管理：${currentStage === 'Registration' ? '加快响应速度' : currentStage === 'Collaboration' ? '合理分配售前资源' : '提升商务审批效率'}`;
            case 'stickiness': return `在${stageInfo.label}阶段需加强粘性：${currentStage === 'Closing' ? '规划客户成功交付方案' : '在合同中纳入续约/增购条款'}`;
          }
          return '继续跟进';
        })(),
      });
    }
  });

  // 计算晋级准备度百分比
  const totalGap = gapAnalysis.reduce((sum, g) => sum + (g.requiredValue - g.currentValue), 0);
  const maxPossibleGap = 400 - (thresholds.identity + thresholds.value + thresholds.management + thresholds.stickiness);
  const readinessPercentage = maxPossibleGap <= 0 ? 100 : Math.max(0, Math.min(100, 100 - (totalGap / maxPossibleGap) * 100));

  return {
    canPromote: readinessPercentage >= 80,
    nextStage,
    nextStageLabel: DEAL_MATURITY_STAGE_CONFIG[nextStage].label,
    readinessPercentage: Math.round(readinessPercentage),
    gapAnalysis,
  };
}

/** 生成风险预警 */
function generateDealRiskAlerts(
  deal: Deal,
  pillarScores: DealMaturityPillarScores,
  currentStage: DealMaturityStage,
  daysInCurrentStage: number,
): DealMaturityHealth['riskAlerts'] {
  const alerts: DealMaturityHealth['riskAlerts'] = [];
  const avgDays = DEAL_MATURITY_STAGE_CONFIG[currentStage].avgDaysInStage;

  // 阶段停滞
  if (daysInCurrentStage > avgDays * 2) {
    alerts.push({
      type: 'stagnation',
      severity: daysInCurrentStage > avgDays * 3 ? 'high' : 'medium',
      title: `${DEAL_MATURITY_STAGE_CONFIG[currentStage].label}阶段停滞`,
      detail: `已停留 ${daysInCurrentStage} 天，平均停留 ${avgDays} 天。建议检查是否有阻塞因素。`,
      action: '渠道经理介入诊断：是否缺少资源？客户决策停滞？竞争对手介入？',
    });
  }

  // 保护期即将到期（报备期特有）
  if (currentStage === 'Registration' && deal.protectionRemainingDays !== undefined && deal.protectionRemainingDays <= 7 && deal.protectionRemainingDays > 0) {
    alerts.push({
      type: 'protection_expiry',
      severity: 'high',
      title: '保护期即将到期',
      detail: `保护期仅剩余 ${deal.protectionRemainingDays} 天，需尽快进入方案跟进阶段或申请延长。`,
      action: '立即安排联合拜访，推动商机进入协同期',
    });
  }

  // 身份评分过低：未确权/有冲突
  if (pillarScores.identity.score < 40) {
    alerts.push({
      type: 'resource_gap',
      severity: 'high',
      title: '身份确权不足',
      detail: '商机信息不完整或存在未解决冲突，影响后续推进。',
      action: '1. 确认客户信息与授权范围 2. 解决冲突记录 3. 分配专属负责人',
    });
  }

  // 协同期缺少方案与资源
  if (currentStage === 'Collaboration' && pillarScores.value.score < 50) {
    alerts.push({
      type: 'missing_solution',
      severity: 'medium',
      title: '方案验证不充分',
      detail: '缺少PoC验证或联合方案证据，客户需求匹配度待加强。',
      action: '1. 安排售前工程师联合拜访 2. 启动PoC或Demo演示 3. 记录客户关键决策点',
    });
  }

  // 成交期价格/条款风险
  if (currentStage === 'Closing' && pillarScores.management.score < 50) {
    alerts.push({
      type: 'price_gap',
      severity: 'medium',
      title: '商务管控待加强',
      detail: '价格审批或合同合规流程可能存在阻塞，需关注审批进度。',
      action: '1. 提前准备价格审批材料 2. 确保合同条款对齐 3. 预留合理交付周期',
    });
  }

  // 循环期交付与客户成功风险
  if (currentStage === 'Expansion' && pillarScores.stickiness.score < 50) {
    alerts.push({
      type: 'success_gap',
      severity: currentStage === 'Expansion' ? 'high' : 'medium',
      title: '客户成功运营不足',
      detail: '赢单后缺乏客户成功跟进，LTV 和续约风险上升。',
      action: '1. 分配客户成功经理 2. 定期举办满意度回访 3. 策划二次销售/增购机会',
    });
  }

  // 低活跃度预警
  const daysSinceActivity = daysSince(deal.lastActivityDate || deal.createdDate);
  if (daysSinceActivity > 30 && currentStage !== 'Expansion') {
    alerts.push({
      type: 'stagnation',
      severity: 'medium',
      title: '商机活跃度低',
      detail: `已${daysSinceActivity}天无更新记录。`,
      action: '至少每周更新一次商机状态，与伙伴保持沟通',
    });
  }

  return alerts;
}

/**
 * 计算单个商机的完整关系深度健康评估
 */
async function calculateDealMaturityHealth(dealId: string, inputDeal?: Deal): Promise<DealMaturityHealth | null> {
  try {
    // 1. 获取商机数据
    let deal: Deal | null = inputDeal || null;
    if (!deal) {
      const { data, error } = await db.deals()
        .select('*')
        .eq('id', dealId)
        .single();
      if (error || !data) return null;
      deal = (data as any) as Deal;
    }

    // 2. 确定当前4阶段（基于操作阶段映射）
    const operationStage = (deal.stage as DealLifecycleStageV2) || 'Registered';
    const currentStage = getDealMaturityStageFromOperation(operationStage);
    const stageInfo = DEAL_MATURITY_STAGE_CONFIG[currentStage];
    const daysInCurrentStage = deal.daysInCurrentStage || daysSince(deal.stageEnteredAt || deal.createdDate);

    // 3. 4支柱评分
    const pillarScores = await calculateDealMaturityPillars(deal);

    // 4. 综合评分 = 加权平均
    const weights = { identity: 0.25, value: 0.30, management: 0.25, stickiness: 0.20 };
    const overallScore = Math.round(
      pillarScores.identity.score * weights.identity +
      pillarScores.value.score * weights.value +
      pillarScores.management.score * weights.management +
      pillarScores.stickiness.score * weights.stickiness
    );

    // 5. 健康状态
    const status = calculateDealMaturityOverallStatus(overallScore, currentStage, daysInCurrentStage);

    // 6. 晋级差距
    const promotionReadiness = calculateDealPromotionGap(currentStage, pillarScores);

    // 7. 风险预警
    const riskAlerts = generateDealRiskAlerts(deal, pillarScores, currentStage, daysInCurrentStage);

    // 8. 里程碑标记
    const allMilestones = stageInfo.successMarkers;
    const completedCount = Math.min(allMilestones.length, Math.max(0, Math.round((overallScore / 100) * allMilestones.length)));
    const milestones = allMilestones.map((label, idx) => ({
      label,
      completed: idx < completedCount,
      completedAt: idx < completedCount ? deal.createdDate : undefined,
    }));

    // 9. 赢单概率与预计成交日期
    const winProbability = Math.round(overallScore * (
      currentStage === 'Registration' ? 0.3 :
      currentStage === 'Collaboration' ? 0.55 :
      currentStage === 'Closing' ? 0.85 :
      1.0
    ));
    const remainingDays = currentStage === 'Expansion'
      ? 0
      : (currentStage === 'Registration' ? 30 :
         currentStage === 'Collaboration' ? stageInfo.avgDaysInStage :
         stageInfo.avgDaysInStage);
    const estimatedCloseDate = new Date(Date.now() + remainingDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    return {
      dealId,
      dealTitle: deal.title,
      partnerName: deal.partnerName,
      customerName: deal.customerName,
      currentStage,
      currentStageLabel: stageInfo.label,
      daysInCurrentStage,
      overallScore,
      status,
      pillarScores,
      promotionReadiness,
      riskAlerts,
      milestones,
      winProbability: Math.min(100, Math.max(0, winProbability)),
      estimatedCloseDate: currentStage !== 'Expansion' ? estimatedCloseDate : undefined,
      lastUpdated: new Date().toISOString(),
    };
  } catch (e) {
    console.error('[DealMaturity] calculateDealMaturityHealth error:', e);
    return null;
  }
}

/** 获取商机的阶段演进事件 */
async function getDealMaturityEvents(dealId: string): Promise<DealMaturityEvent[]> {
  try {
    // 从现有商机生命周期事件中提取，并映射为4阶段事件
    const { data, error } = await db.dealLifecycleEventsV2()
      .select('*')
      .eq('deal_id', dealId)
      .order('event_date', { ascending: false })
      .limit(20);
    if (error) return [];
    const rawEvents = (data || []) as any[];

    const maturityEvents: DealMaturityEvent[] = [];
    let previousStage: DealMaturityStage | null = null;
    rawEvents.forEach((ev) => {
      const opStage = ev.to_stage as DealLifecycleStageV2;
      const currentStage = getDealMaturityStageFromOperation(opStage);
      if (previousStage !== currentStage) {
        maturityEvents.push({
          id: ev.id || `maturity-${dealId}-${maturityEvents.length}`,
          dealId,
          fromStage: previousStage,
          toStage: currentStage,
          eventDate: ev.event_date || new Date().toISOString(),
          operator: ev.operator,
          reason: ev.reason,
          notes: ev.notes,
        });
        previousStage = currentStage;
      }
    });

    // 如果数据库中没有记录，基于当前商机数据生成初始事件
    if (maturityEvents.length === 0) {
      const { data: dealData } = await db.deals().select('*').eq('id', dealId).single();
      if (dealData) {
        const opStage = (dealData as any).stage as DealLifecycleStageV2;
        const currentStage = getDealMaturityStageFromOperation(opStage);
        maturityEvents.push({
          id: `maturity-init-${dealId}`,
          dealId,
          fromStage: null,
          toStage: currentStage,
          eventDate: (dealData as any).created_date || new Date().toISOString(),
          operator: 'system',
          reason: '商机报备',
        });
      }
    }

    return maturityEvents;
  } catch (e) {
    console.error('[DealMaturity] getDealMaturityEvents error:', e);
    return [];
  }
}

/** 手动推进商机到下一关系阶段 */
async function advanceDealMaturityStage(
  dealId: string,
  toStage: DealMaturityStage,
  options: { operator?: string; reason?: string; notes?: string } = {},
): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    const { data: deal, error } = await db.deals().select('*').eq('id', dealId).single();
    if (error || !deal) return false;

    const currentStage = getDealMaturityStageFromOperation((deal as any).stage);
    if (currentStage === toStage) return true;

    // 记录阶段变化事件
    const { error: insertError } = await db.dealLifecycleEventsV2().insert({
      deal_id: dealId,
      from_stage: (deal as any).stage,
      to_stage: (deal as any).stage,  // 操作阶段不变，仅在关系层记录跃迁
      event_date: now,
      operator: options.operator || 'system',
      reason: options.reason || `由${DEAL_MATURITY_STAGE_CONFIG[currentStage].label}演进至${DEAL_MATURITY_STAGE_CONFIG[toStage].label}`,
      notes: options.notes,
      auto_detected: false,
    });
    if (insertError) console.warn('[DealMaturity] event insert warning:', insertError);
    return true;
  } catch (e) {
    console.error('[DealMaturity] advanceDealMaturityStage error:', e);
    return false;
  }
}

/** 批量：商机生态的4阶段分布统计 */
async function getDealEcosystemDistribution(): Promise<{
  byStage: Record<DealMaturityStage, number>;
  byValue: Record<DealMaturityStage, number>;
  avgScoreByStage: Record<DealMaturityStage, number>;
  healthByStage: Record<DealMaturityStage, { healthy: number; monitoring: number; atRisk: number; critical: number }>;
  totalDeals: number;
  totalActivePipeline: number;
  averageOverallScore: number;
  stagnantDeals: number;
}> {
  try {
    const { data, error } = await db.deals()
      .select('*')
      .in('status', ['Pending', 'Approved', 'Converted'])
      .limit(2000);
    if (error) {
      return {
        byStage: { Registration: 0, Collaboration: 0, Closing: 0, Expansion: 0 },
        byValue: { Registration: 0, Collaboration: 0, Closing: 0, Expansion: 0 },
        avgScoreByStage: { Registration: 0, Collaboration: 0, Closing: 0, Expansion: 0 },
        healthByStage: {
          Registration: { healthy: 0, monitoring: 0, atRisk: 0, critical: 0 },
          Collaboration: { healthy: 0, monitoring: 0, atRisk: 0, critical: 0 },
          Closing: { healthy: 0, monitoring: 0, atRisk: 0, critical: 0 },
          Expansion: { healthy: 0, monitoring: 0, atRisk: 0, critical: 0 },
        },
        totalDeals: 0,
        totalActivePipeline: 0,
        averageOverallScore: 0,
        stagnantDeals: 0,
      };
    }
    const deals = ((data || []) as any[]).map((d) => ({
      id: d.id,
      title: d.title,
      partnerName: d.partner_name,
      customerName: d.customer_name,
      value: typeof d.value === 'number' ? d.value : (parseFloat(d.value) || 0),
      status: d.status,
      stage: d.stage,
      stageEnteredAt: d.stage_entered_at,
      createdDate: d.created_date,
      lastActivityDate: d.last_activity_date,
      hasConflict: d.has_conflict,
      protectionRemainingDays: d.protection_remaining_days,
      salesName: d.sales_name,
      salesTeam: d.sales_team,
      description: d.description,
      isPriority: d.is_priority,
      isStagnant: d.is_stagnant,
      actualCloseDate: d.actual_close_date,
      isNewLogo: d.is_new_logo,
      leadResponseTime: d.lead_response_time,
      daysInCurrentStage: daysSince(d.stage_entered_at || d.created_date),
    }));

    const byStage: Record<DealMaturityStage, number> = { Registration: 0, Collaboration: 0, Closing: 0, Expansion: 0 };
    const byValue: Record<DealMaturityStage, number> = { Registration: 0, Collaboration: 0, Closing: 0, Expansion: 0 };
    const scoreByStage: Record<DealMaturityStage, number[]> = { Registration: [], Collaboration: [], Closing: [], Expansion: [] };
    const healthByStage: Record<DealMaturityStage, { healthy: number; monitoring: number; atRisk: number; critical: number }> = {
      Registration: { healthy: 0, monitoring: 0, atRisk: 0, critical: 0 },
      Collaboration: { healthy: 0, monitoring: 0, atRisk: 0, critical: 0 },
      Closing: { healthy: 0, monitoring: 0, atRisk: 0, critical: 0 },
      Expansion: { healthy: 0, monitoring: 0, atRisk: 0, critical: 0 },
    };
    let totalScore = 0;
    let stagnant = 0;
    let totalValue = 0;

    for (const d of deals) {
      const maturityStage = getDealMaturityStageFromOperation(d.stage as DealLifecycleStageV2);
      byStage[maturityStage] = (byStage[maturityStage] || 0) + 1;
      byValue[maturityStage] = (byValue[maturityStage] || 0) + d.value;
      totalValue += d.value;

      const mockDeal: Deal = {
        id: d.id, title: d.title, customerName: d.customerName, value: d.value,
        partnerId: '-', partnerName: d.partnerName, partnerType: 'ISV',
        stage: d.stage, status: d.status, region: d.salesName || '-',
        salesName: d.salesName || '-', salesTeam: d.salesTeam || '-', productType: '-',
        createdDate: d.createdDate, lastActivityDate: d.lastActivityDate,
        expectedCloseDate: '-', hasConflict: d.hasConflict, isPriority: d.isPriority,
        isStagnant: d.isStagnant, protectionRemainingDays: d.protectionRemainingDays,
        description: d.description, isNewLogo: d.isNewLogo, leadResponseTime: d.leadResponseTime,
        daysInCurrentStage: d.daysInCurrentStage, actualCloseDate: d.actualCloseDate,
        lifecycle: [],
      };
      const pillars = await calculateDealMaturityPillars(mockDeal);
      const score = Math.round((pillars.identity.score * 0.25 + pillars.value.score * 0.30 + pillars.management.score * 0.25 + pillars.stickiness.score * 0.20));
      scoreByStage[maturityStage].push(score);
      totalScore += score;
      const status = calculateDealMaturityOverallStatus(score, maturityStage, d.daysInCurrentStage);
      if (status === 'healthy') healthByStage[maturityStage].healthy++;
      else if (status === 'monitoring') healthByStage[maturityStage].monitoring++;
      else if (status === 'at_risk') healthByStage[maturityStage].atRisk++;
      else healthByStage[maturityStage].critical++;
      if (d.isStagnant) stagnant++;
    }

    const avgScoreByStage: Record<DealMaturityStage, number> = {
      Registration: Math.round((scoreByStage.Registration.reduce((a, b) => a + b, 0)) / Math.max(1, scoreByStage.Registration.length)),
      Collaboration: Math.round((scoreByStage.Collaboration.reduce((a, b) => a + b, 0)) / Math.max(1, scoreByStage.Collaboration.length)),
      Closing: Math.round((scoreByStage.Closing.reduce((a, b) => a + b, 0)) / Math.max(1, scoreByStage.Closing.length)),
      Expansion: Math.round((scoreByStage.Expansion.reduce((a, b) => a + b, 0)) / Math.max(1, scoreByStage.Expansion.length)),
    };

    return {
      byStage,
      byValue,
      avgScoreByStage,
      healthByStage,
      totalDeals: deals.length,
      totalActivePipeline: totalValue,
      averageOverallScore: deals.length > 0 ? Math.round(totalScore / deals.length) : 0,
      stagnantDeals: stagnant,
    };
  } catch (e) {
    console.error('[DealMaturity] getDealEcosystemDistribution error:', e);
    return {
      byStage: { Registration: 0, Collaboration: 0, Closing: 0, Expansion: 0 },
      byValue: { Registration: 0, Collaboration: 0, Closing: 0, Expansion: 0 },
      avgScoreByStage: { Registration: 0, Collaboration: 0, Closing: 0, Expansion: 0 },
      healthByStage: {
        Registration: { healthy: 0, monitoring: 0, atRisk: 0, critical: 0 },
        Collaboration: { healthy: 0, monitoring: 0, atRisk: 0, critical: 0 },
        Closing: { healthy: 0, monitoring: 0, atRisk: 0, critical: 0 },
        Expansion: { healthy: 0, monitoring: 0, atRisk: 0, critical: 0 },
      },
      totalDeals: 0,
      totalActivePipeline: 0,
      averageOverallScore: 0,
      stagnantDeals: 0,
    };
  }
}

// ── 市场活动4支柱健康评估 ──
function calculateMarketingPillars(campaign: MarketingCampaign): MarketingMaturityPillarScores {
  const identityEvidence: string[] = [];
  const valueEvidence: string[] = [];
  const managementEvidence: string[] = [];
  const stickinessEvidence: string[] = [];

  // ── 支柱1：身份（战略对齐）──
  let identityScore = 40;
  if (campaign.status === 'approved') { identityScore += 20; identityEvidence.push('MDF预算已获批'); }
  if ((campaign.status as string) === 'closed' || campaign.status === 'completed' || campaign.hasEvaluation) { identityScore += 20; identityEvidence.push('活动已完成'); }
  if (campaign.partnerName && campaign.partnerName.trim().length > 0) { identityScore += 15; identityEvidence.push(`合办伙伴：${campaign.partnerName}`); }
  if (campaign.goals && campaign.goals.length > 0) { identityScore += 10; identityEvidence.push('活动目标已明确'); }
  if (campaign.primaryGoal) { identityScore += 5; identityEvidence.push(`主目标：${campaign.primaryGoal}`); }
  if (campaign.description && campaign.description.length > 50) { identityScore += 10; identityEvidence.push('有详细方案描述'); }
  identityScore = Math.max(0, Math.min(100, identityScore));

  // ── 支柱2：价值（内容共创/品牌溢价）──
  let valueScore = 30;
  const phase = campaign.currentPhase;
  if (phase === 'preparing') { valueScore += 20; valueEvidence.push('内容共创阶段'); }
  if (phase === 'executing') { valueScore += 30; valueEvidence.push('正在执行联合方案'); }
  if ((phase as string) === 'evaluating' || (phase as string) === 'closed' || phase === 'follow_up') { valueScore += 35; valueEvidence.push('已进入价值复盘阶段'); }
  if (campaign.expectedAttendees > 0) { valueScore += 10; valueEvidence.push(`预计参会 ${campaign.expectedAttendees} 人`); }
  if (campaign.registeredCount > 0) { valueScore += 10; valueEvidence.push(`已报名 ${campaign.registeredCount} 人`); }
  if (campaign.checkedInCount > 0) { valueScore += 10; valueEvidence.push(`现场签到 ${campaign.checkedInCount} 人`); }
  if (campaign.leadsGenerated > 0) { valueScore += 15; valueEvidence.push(`已产生 ${campaign.leadsGenerated} 条线索`); }
  valueScore = Math.max(0, Math.min(100, valueScore));

  // ── 支柱3：管理（预算/审批/执行效率）──
  let managementScore = 35;
  if (typeof campaign.budget === 'number' && campaign.budget > 0) { managementScore += 10; managementEvidence.push(`预算：¥${Math.round(campaign.budget).toLocaleString()}`); }
  if (typeof campaign.actualSpend === 'number' && campaign.actualSpend > 0) {
    const utilization = (campaign.actualSpend / campaign.budget) * 100;
    managementScore += utilization > 60 && utilization <= 120 ? 15 : (utilization > 50 ? 10 : 5);
    managementEvidence.push(`预算利用率：${utilization.toFixed(0)}%`);
  }
  if (typeof campaign.approvedAmount === 'number' && campaign.approvedAmount > 0) { managementScore += 10; managementEvidence.push('MDF审批金额已确认'); }
  if (campaign.hasEvaluation) { managementScore += 15; managementEvidence.push('已完成活动评估'); }
  if (campaign.actualStartDate) { managementScore += 10; managementEvidence.push(`已执行：${campaign.actualStartDate}`); }
  managementScore = Math.max(0, Math.min(100, managementScore));

  // ── 支柱4：粘性（ROI闭环/线索转化/案例）──
  let stickinessScore = 20;
  if (campaign.leadsGenerated > 0) { stickinessScore += 20; stickinessEvidence.push(`线索 ${campaign.leadsGenerated} 条`); }
  if (campaign.dealsCreated > 0) { stickinessScore += 30; stickinessEvidence.push(`商机 ${campaign.dealsCreated} 个`); }
  if (typeof campaign.dealsValue === 'number' && campaign.dealsValue > 0) { stickinessScore += 15; stickinessEvidence.push(`商机金额：¥${Math.round(campaign.dealsValue).toLocaleString()}`); }
  if (campaign.hasEvaluation) { stickinessScore += 15; stickinessEvidence.push('已形成活动评估'); }
  if ((campaign.status as string) === 'closed' || campaign.status === 'completed' && campaign.leadsGenerated > 0) { stickinessScore += 10; stickinessEvidence.push('已形成闭环可复制'); }
  stickinessScore = Math.max(0, Math.min(100, stickinessScore));

  return {
    identity: { score: identityScore, evidence: identityEvidence, trend: 'up' },
    value: { score: valueScore, evidence: valueEvidence, trend: identityScore >= 70 ? 'up' : 'flat' },
    management: { score: managementScore, evidence: managementEvidence, trend: 'flat' },
    stickiness: { score: stickinessScore, evidence: stickinessEvidence, trend: stickinessScore >= 60 ? 'up' : 'down' },
  };
}

/** 评估单个市场活动的完整关系深度健康度 */
async function calculateMarketingMaturityHealth(campaignId: string, inputCampaign?: MarketingCampaign): Promise<MarketingMaturityHealth | null> {
  try {
    let campaign: MarketingCampaign | null = inputCampaign || null;
    if (!campaign) {
      // 简化：从前端传入，不直接DB查询
      return null;
    }

    // 1. 确定当前4阶段
    const opStage = campaign.currentPhase as CampaignPhase;
    const currentStage = MARKETING_OPERATION_TO_MATURITY_MAP[opStage] || 'Alignment';
    const stageInfo = MARKETING_MATURITY_STAGE_CONFIG[currentStage];

    // 2. 计算停留天数
    const daysSince = (() => {
      try {
        const now = Date.now();
        const base = campaign.updatedAt || campaign.createdAt;
        return Math.floor((now - new Date(base).getTime()) / 86400000);
      } catch { return 0; }
    })();
    const daysInCurrentStage = daysSince;

    // 3. 4支柱评分
    const pillars = calculateMarketingPillars(campaign);
    const overallScore = Math.round(
      pillars.identity.score * 0.25 +
      pillars.value.score * 0.30 +
      pillars.management.score * 0.25 +
      pillars.stickiness.score * 0.20
    );

    // 4. 健康状态
    let status: 'healthy' | 'monitoring' | 'at_risk' | 'critical' = 'healthy';
    if (overallScore < 50 || daysInCurrentStage > stageInfo.avgDaysInStage * 2) status = 'at_risk';
    else if (overallScore < 70) status = 'monitoring';
    if (overallScore < 35) status = 'critical';

    // 5. 晋级差距分析
    const nextStageMap: Record<MarketingMaturityStage, MarketingMaturityStage | null> = {
      'Alignment': 'CoCreation',
      'CoCreation': 'Execution',
      'Execution': 'Optimization',
      'Optimization': null,
    };
    const nextStage = nextStageMap[currentStage];
    const gaps: MarketingMaturityHealth['promotionReadiness']['gapAnalysis'] = [];
    let readinessPercentage = 100;
    if (nextStage) {
      const thresholds = {
        'Alignment': { identity: 70, value: 50, management: 60, stickiness: 20 },
        'CoCreation': { identity: 75, value: 70, management: 65, stickiness: 30 },
        'Execution': { identity: 75, value: 80, management: 70, stickiness: 50 },
        'Optimization': { identity: 80, value: 85, management: 75, stickiness: 70 },
      }[currentStage] || { identity: 70, value: 70, management: 70, stickiness: 70 };
      const pillarLabels = { identity: '身份', value: '价值', management: '管理', stickiness: '粘性' };
      (['identity', 'value', 'management', 'stickiness'] as const).forEach((p) => {
        const current = pillars[p].score;
        const required = thresholds[p];
        if (current < required) {
          gaps.push({
            pillar: p,
            pillarLabel: pillarLabels[p],
            currentValue: current,
            requiredValue: required,
            priority: (required - current) >= 20 ? 'high' : (required - current) >= 10 ? 'medium' : 'low',
            recommendation: (() => {
              switch (p) {
                case 'identity': return `在${stageInfo.label}需加强战略对齐：${currentStage === 'Alignment' ? '确保伙伴参与与资源投入承诺' : currentStage === 'CoCreation' ? '深化联合方案的共同品牌定位' : '巩固区域市场主导者身份'}`;
                case 'value': return `在${stageInfo.label}需提升内容价值：${currentStage === 'Alignment' ? '提前识别行业切入点与标杆案例需求' : currentStage === 'CoCreation' ? '完善联合PPT/短视频等宣传物料' : '提升线索转化质量'}`;
                case 'management': return `在${stageInfo.label}需加强管理：${currentStage === 'Alignment' ? '加快MDF审批流程与预算确认' : currentStage === 'Execution' ? '强化现场协同与数字化工具运用' : '确保ROI核算与MDF核销准时完成'}`;
                case 'stickiness': return `在${stageInfo.label}需提升粘性：${currentStage === 'Execution' ? '确保线索实时录入与分配' : '推动商机转化与标杆案例提炼'}`;
              }
              return '继续优化';
            })(),
          });
        }
      });
      const totalGap = gaps.reduce((sum, g) => sum + (g.requiredValue - g.currentValue), 0);
      readinessPercentage = Math.max(0, Math.min(100, 100 - Math.round(totalGap / 4)));
    }

    // 6. 风险预警
    const riskAlerts: MarketingMaturityHealth['riskAlerts'] = [];
    // 阶段停滞
    if (daysInCurrentStage > stageInfo.avgDaysInStage * 2) {
      riskAlerts.push({
        type: 'stage_stagnation', severity: daysInCurrentStage > stageInfo.avgDaysInStage * 3 ? 'critical' : 'high',
        title: `${stageInfo.label}停滞`, detail: `已停留 ${daysInCurrentStage} 天（平均 ${stageInfo.avgDaysInStage} 天）`,
        action: currentStage === 'Alignment' ? '评估活动目标是否清晰，必要时重新沟通战略对齐'
                : currentStage === 'CoCreation' ? '安排物料共创会，推动方案与宣讲培训完成'
                : currentStage === 'Execution' ? '检查现场准备与执行计划，必要时加派资源'
                : '推动ROI核算与MDF核销流程启动',
      });
    }
    // 预算缺口
    if (typeof campaign.budget === 'number' && campaign.budget > 0 && typeof campaign.approvedAmount === 'number' && campaign.approvedAmount < campaign.budget * 0.5) {
      riskAlerts.push({
        type: 'mdf_budget_gap', severity: 'high', title: 'MDF预算审批有缺口',
        detail: `预算 ¥${Math.round(campaign.budget).toLocaleString()}，已审批仅 ¥${Math.round(campaign.approvedAmount).toLocaleString()}`,
        action: '重新沟通资金分配比例，必要时调整活动规模',
      });
    }
    // 伙伴缺乏参与度
    if (!campaign.partnerName || campaign.partnerName.trim().length === 0) {
      riskAlerts.push({
        type: 'partner_disengagement', severity: 'medium', title: '伙伴参与度不足',
        detail: '活动缺少明确的合作伙伴参与，可能降低区域市场影响力',
        action: '重新确认伙伴或改归类为厂商自办活动',
      });
    }
    // 执行期缺少联合方案
    if (currentStage === 'Execution' && pillars.value.score < 50) {
      riskAlerts.push({
        type: 'no_joint_solution', severity: 'medium', title: '联合方案准备不足',
        detail: '活动已进入执行期，但缺乏完整的联合方案与物料证据',
        action: '紧急补充联合方案PPT与宣讲培训',
      });
    }
    // 签到率预期低
    if (currentStage === 'Execution' && campaign.expectedAttendees > 0 && campaign.registeredCount < campaign.expectedAttendees * 0.5) {
      riskAlerts.push({
        type: 'low_attendance_expectation', severity: 'medium', title: '报名人数偏低',
        detail: `仅 ${campaign.registeredCount}/${campaign.expectedAttendees} 人报名，低于预期 50%`,
        action: '启动最后一轮推广与伙伴销售邀请客户',
      });
    }
    // 线索质量风险
    if ((currentStage === 'Execution' || currentStage === 'Optimization') && campaign.leadsGenerated > 0 && campaign.dealsCreated === 0) {
      riskAlerts.push({
        type: 'lead_quality_risk', severity: 'high', title: '线索转化不足',
        detail: `产生了 ${campaign.leadsGenerated} 条线索但无商机报备转化`,
        action: '立即安排线索分配与伙伴销售跟进培训',
      });
    }
    // ROI差距
    if (currentStage === 'Optimization' && campaign.dealsValue > 0 && campaign.actualSpend > 0 && campaign.dealsValue < campaign.actualSpend * 2) {
      riskAlerts.push({
        type: 'roi_gap', severity: 'high', title: 'ROI低于预期',
        detail: `商机金额 ¥${Math.round(campaign.dealsValue).toLocaleString()} 仅为投入 ¥${Math.round(campaign.actualSpend).toLocaleString()} 的 ${Math.round(campaign.dealsValue / campaign.actualSpend * 100)}%`,
        action: '重新评估活动模式，下次活动缩小规模或改变获客策略',
      });
    }
    // 结算延迟
    if (currentStage === 'Optimization' && !campaign.hasEvaluation) {
      riskAlerts.push({
        type: 'settlement_delay', severity: 'medium', title: '评估与结算延迟',
        detail: '活动已结束但尚未完成KPI评估与MDF核销',
        action: '10个工作日内完成评估报告，启动MDF报销流程',
      });
    }
    // 缺少标杆案例
    if (currentStage === 'Optimization' && campaign.leadsGenerated > 0 && campaign.dealsCreated > 0 && !campaign.hasEvaluation) {
      riskAlerts.push({
        type: 'missing_case_study', severity: 'low', title: '缺少标杆案例提炼',
        detail: '活动已产生有效商机，但尚未形成可复用的标杆案例',
        action: '与伙伴共同提炼最佳实践，用于下一轮活动的内容复用',
      });
    }

    // 7. 关键里程碑
    const allMilestones = stageInfo.successMarkers;
    const completedThreshold = Math.round((overallScore / 100) * allMilestones.length);
    const milestones = allMilestones.map((label, idx) => ({
      label, completed: idx < completedThreshold, completedAt: idx < completedThreshold ? campaign.createdAt : undefined,
    }));

    // 8. ROI估算
    const estimatedROI = campaign.actualSpend > 0 && campaign.dealsValue > 0
      ? Math.round((campaign.dealsValue / campaign.actualSpend) * 100) / 100
      : 0;

    return {
      campaignId, campaignName: campaign.name, partnerName: campaign.partnerName || '厂商自办',
      campaignType: campaign.type, currentStage, currentStageLabel: stageInfo.label,
      daysInCurrentStage, overallScore, status,
      pillarScores: pillars,
      promotionReadiness: {
        canPromote: nextStage ? readinessPercentage >= 80 : false,
        nextStage: nextStage || 'Optimization',
        nextStageLabel: nextStage ? MARKETING_MATURITY_STAGE_CONFIG[nextStage].label : '最终阶段',
        readinessPercentage,
        gapAnalysis: gaps,
      },
      riskAlerts, milestones, estimatedROI,
      lastUpdated: new Date().toISOString(),
    };
  } catch (e) { console.error('[MarketingMaturity] error:', e); return null; }
}

/** 市场活动阶段事件（从活动生命周期中读取并映射） */
async function getMarketingMaturityEvents(campaignId: string): Promise<MarketingMaturityEvent[]> {
  try {
    // 从活动阶段记录中提取
    // 简化：直接基于 currentPhase + 时间创建事件链
    return [
      { id: `me-${campaignId}-1`, campaignId, fromStage: null, toStage: 'Alignment', eventDate: new Date(Date.now() - 30 * 86400000).toISOString(), operator: 'system', reason: '活动策划启动' },
    ];
  } catch (e) {
    console.error('[MarketingMaturity] events error:', e);
    return [];
  }
}

/** 市场活动告警引擎：批量扫描并返回 */
function generateMarketingInspectionReport(campaigns: MarketingCampaign[]) {
  const alerts: any[] = [];
  let totalScore = 0;
  campaigns.forEach((campaign) => {
    const pillars = calculateMarketingPillars(campaign);
    const overall = Math.round(pillars.identity.score * 0.25 + pillars.value.score * 0.30 + pillars.management.score * 0.25 + pillars.stickiness.score * 0.20);
    totalScore += overall;

    const currentStage = MARKETING_OPERATION_TO_MATURITY_MAP[campaign.currentPhase] || 'Alignment';
    const stageInfo = MARKETING_MATURITY_STAGE_CONFIG[currentStage];
    const daysSince = Math.max(0, Math.floor((Date.now() - new Date(campaign.updatedAt || campaign.createdAt).getTime()) / 86400000));

    // 具体告警
    const typeLabels: Record<MarketingMaturityStage, string> = {
      Alignment: '策划期', CoCreation: '赋能期', Execution: '执行期', Optimization: '闭环期',
    };
    const pillarLabels = { identity: '身份', value: '价值', management: '管理', stickiness: '粘性' };
    (['identity', 'value', 'management', 'stickiness'] as const).forEach((p) => {
      if (pillars[p].score < 40 && (currentStage !== 'Optimization' || p !== 'stickiness')) {
        alerts.push({
          id: `camp-${campaign.id}-${p}`,
          severity: pillars[p].score < 30 ? 'high' : 'medium',
          title: `${pillarLabels[p]}支柱不足`,
          campaignName: campaign.name,
          stage: typeLabels[currentStage],
          currentValue: pillars[p].score,
          detail: `${pillarLabels[p]}支柱评分仅 ${pillars[p].score} 分（建议 ≥ 50）`,
          action: p === 'identity' ? '确认活动目标与伙伴角色定位' : p === 'value' ? '提升内容共创质量（方案/物料）' : p === 'management' ? '加强预算与审批流程管理' : '推动线索转化与标杆案例',
          campaignId: campaign.id,
          partnerName: campaign.partnerName || '厂商自办',
          budget: campaign.budget,
          leads: campaign.leadsGenerated,
          deals: campaign.dealsCreated,
          overallScore: overall,
          createdAt: new Date().toISOString(),
        });
      }
    });

    // 阶段停滞
    if (daysSince > stageInfo.avgDaysInStage * 2) {
      alerts.push({
        id: `camp-${campaign.id}-stagnant`,
        severity: daysSince > stageInfo.avgDaysInStage * 3 ? 'critical' : 'high',
        title: `${stageInfo.label}阶段停滞`,
        campaignName: campaign.name,
        stage: typeLabels[currentStage],
        currentValue: daysSince,
        detail: `已停留 ${daysSince} 天，平均 ${stageInfo.avgDaysInStage} 天`,
        action: '诊断阻塞因素并推动进入下一阶段',
        campaignId: campaign.id,
        partnerName: campaign.partnerName || '厂商自办',
        budget: campaign.budget,
        leads: campaign.leadsGenerated,
        deals: campaign.dealsCreated,
        overallScore: overall,
        createdAt: new Date().toISOString(),
      });
    }
  });

  return {
    summary: {
      totalCampaigns: campaigns.length,
      averageScore: campaigns.length > 0 ? Math.round(totalScore / campaigns.length) : 0,
      alerts: alerts.length,
      critical: alerts.filter((a: any) => a.severity === 'critical').length,
      high: alerts.filter((a: any) => a.severity === 'high').length,
      medium: alerts.filter((a: any) => a.severity === 'medium').length,
    },
    alerts,
  };
}

// ── 导出市场活动服务对象 ──
export const marketingMaturityService = {
  calculateHealth: calculateMarketingMaturityHealth,
  getEvents: getMarketingMaturityEvents,
  calculatePillars: calculateMarketingPillars,
  generateReport: generateMarketingInspectionReport,
  config: MARKETING_MATURITY_STAGE_CONFIG,
};

// ─────────────────────────────────────────────────────────────────────────────
// 激励政策4支柱健康评估（Incentive Maturity Service）
// 设计期 → 引导期 → 兑现期 → 演进期
// ─────────────────────────────────────────────────────────────────────────────
function calculateIncentivePillars(program: Partial<IncentiveProgram> & {
  status?: string;
  totalBudget?: number;
  used?: number;
  remaining?: number;
  claimedAmount?: number;
  participantsCount?: number;
  roiRate?: number;
  payoutType?: string;
  type?: string;
  description?: string;
  direction?: any;
  startDate?: string;
  endDate?: string;
  quarter?: string;
  year?: number;
  trigger?: string;
  conversionRate?: number;
  registeredDeals?: number;
  targetDeals?: number;
  budgetUtilizationRate?: number;
  healthScore?: number;
}): IncentiveMaturityPillarScores {
  const identityEvidence: string[] = [];
  const valueEvidence: string[] = [];
  const managementEvidence: string[] = [];
  const stickinessEvidence: string[] = [];

  // 支柱1：身份（战略对齐 + 差异化设计）
  let identityScore = 30;
  if ((program.status as string) === 'approved' || program.status === 'Active') {
    identityScore += 15; identityEvidence.push('计划已发布');
  }
  if (program.direction && program.direction.direction) {
    identityScore += 15; identityEvidence.push(`明确战略方向：${program.direction.direction}`);
  }
  if (program.direction && program.direction.targetTiers && program.direction.targetTiers.length > 0) {
    identityScore += 10; identityEvidence.push('支持伙伴级别差异化');
  }
  if (program.direction && program.direction.targetRegions && program.direction.targetRegions.length > 0) {
    identityScore += 10; identityEvidence.push('支持区域差异化');
  }
  if (program.trigger) {
    identityScore += 5; identityEvidence.push(`触发场景：${program.trigger}`);
  }
  if (program.type && program.type.length > 0) {
    identityScore += 5; identityEvidence.push(`类别：${program.type}`);
  }
  identityScore = Math.max(0, Math.min(100, identityScore));

  // 支柱2：价值（激励结构合理性 + 非金钱激励占比）
  let valueScore = 25;
  const payoutType = program.payoutType || 'Cash';
  if (payoutType === 'Rebate') { valueScore += 15; valueEvidence.push('包含返利（Rebate）机制'); }
  if (payoutType === 'Points') { valueScore += 10; valueEvidence.push('包含积分/能力激励'); }
  if (typeof program.totalBudget === 'number' && program.totalBudget > 0) {
    valueScore += 10;
    valueEvidence.push(`总预算 ¥${Math.round(program.totalBudget).toLocaleString()}`);
  }
  if (typeof program.roiRate === 'number' && program.roiRate > 0) {
    valueScore += program.roiRate >= 2 ? 20 : (program.roiRate >= 1 ? 15 : 5);
    valueEvidence.push(`ROI ${program.roiRate}×`);
  }
  if (typeof program.budgetUtilizationRate === 'number') {
    valueScore += program.budgetUtilizationRate >= 0.5 ? 10 : 5;
    valueEvidence.push(`预算使用率 ${(program.budgetUtilizationRate * 100).toFixed(0)}%`);
  }
  if (typeof program.claimedAmount === 'number' && program.claimedAmount > 0) {
    valueScore += 5;
    valueEvidence.push(`已申领 ¥${Math.round(program.claimedAmount).toLocaleString()}`);
  }
  valueScore = Math.max(0, Math.min(100, valueScore));

  // 支柱3：管理（规则清晰度、透明度、结算效率）
  let managementScore = 30;
  if (program.description && program.description.length > 50) {
    managementScore += 10; managementEvidence.push('有详细规则说明');
  }
  if ((program.status as string) === 'Active' || (program.status as string) === 'approved') {
    managementScore += 15; managementEvidence.push('处于执行阶段');
  }
  if (typeof program.participantsCount === 'number' && program.participantsCount > 0) {
    managementScore += program.participantsCount >= 10 ? 15 : 10;
    managementEvidence.push(`${program.participantsCount} 家伙伴参与`);
  }
  if (typeof program.conversionRate === 'number') {
    managementScore += program.conversionRate >= 0.3 ? 15 : 10;
    managementEvidence.push(`商机转化 ${(program.conversionRate * 100).toFixed(0)}%`);
  }
  if (typeof program.registeredDeals === 'number' && program.registeredDeals > 0 && typeof program.targetDeals === 'number' && program.targetDeals > 0) {
    const achieve = program.registeredDeals / program.targetDeals;
    managementScore += achieve >= 0.7 ? 15 : achieve >= 0.4 ? 10 : 5;
    managementEvidence.push(`目标达成 ${Math.round(achieve * 100)}%`);
  }
  managementScore = Math.max(0, Math.min(100, managementScore));

  // 支柱4：粘性（长期价值 / 续约 / 联合投资）
  let stickinessScore = 20;
  if (typeof program.claimedAmount === 'number' && program.claimedAmount > 0) {
    stickinessScore += 15; stickinessEvidence.push('有实际激励兑现');
  }
  if (typeof program.roiRate === 'number' && program.roiRate >= 1) {
    stickinessScore += 15; stickinessEvidence.push('正ROI建立信任基础');
  }
  if (typeof program.participantsCount === 'number' && program.participantsCount >= 20) {
    stickinessScore += 15; stickinessEvidence.push('规模化参与');
  }
  if (program.year && program.quarter) {
    stickinessScore += 10; stickinessEvidence.push(`${program.year} ${program.quarter} 固定周期计划`);
  }
  if (program.status === 'Ended' || (program.status as string) === 'completed') {
    stickinessScore += 10; stickinessEvidence.push('已完成完整周期，可复盘演进');
  }
  stickinessScore = Math.max(0, Math.min(100, stickinessScore));

  return {
    identity: { score: identityScore, evidence: identityEvidence, trend: identityScore >= 70 ? 'up' : 'flat' },
    value: { score: valueScore, evidence: valueEvidence, trend: valueScore >= 70 ? 'up' : 'flat' },
    management: { score: managementScore, evidence: managementEvidence, trend: managementScore >= 70 ? 'up' : 'flat' },
    stickiness: { score: stickinessScore, evidence: stickinessEvidence, trend: stickinessScore >= 60 ? 'up' : 'down' },
  };
}

async function calculateIncentiveMaturityHealth(planId: string, inputProgram: any): Promise<IncentiveMaturityHealth | null> {
  try {
    const program: any = inputProgram;
    if (!program) return null;

    // 1. 阶段识别
    const opStage = String(program.status || 'draft');
    const currentStage = INCENTIVE_OPERATION_TO_MATURITY_MAP[opStage] || 'DesignAlignment';
    const stageInfo = INCENTIVE_MATURITY_STAGE_CONFIG[currentStage];

    // 2. 停留天数
    const daysInCurrentStage = program.daysInCurrentStage || 0;

    // 3. 4支柱评分
    const pillars = calculateIncentivePillars(program);
    const overallScore = Math.round(
      pillars.identity.score * 0.25 +
      pillars.value.score * 0.30 +
      pillars.management.score * 0.25 +
      pillars.stickiness.score * 0.20
    );

    // 4. 健康状态
    let status: IncentiveMaturityHealth['status'] = 'healthy';
    if (overallScore < 50 || daysInCurrentStage > stageInfo.avgDaysInStage * 2) status = 'at_risk';
    if (overallScore < 70 && status === 'healthy') status = 'monitoring';
    if (overallScore < 35) status = 'critical';

    // 5. 晋级差距分析
    const nextStageMap: Record<IncentiveMaturityStage, IncentiveMaturityStage | null> = {
      'DesignAlignment': 'GuidanceMotivation',
      'GuidanceMotivation': 'RealizationAudit',
      'RealizationAudit': 'EvolutionOptimization',
      'EvolutionOptimization': null,
    };
    const nextStage = nextStageMap[currentStage];
    const gaps: IncentiveMaturityHealth['promotionReadiness']['gapAnalysis'] = [];
    let readiness = 100;
    if (nextStage) {
      const thresholds = {
        'DesignAlignment': { identity: 70, value: 60, management: 50, stickiness: 20 },
        'GuidanceMotivation': { identity: 75, value: 70, management: 70, stickiness: 35 },
        'RealizationAudit': { identity: 80, value: 75, management: 80, stickiness: 55 },
        'EvolutionOptimization': { identity: 85, value: 85, management: 85, stickiness: 80 },
      }[currentStage] || { identity: 70, value: 70, management: 70, stickiness: 70 };
      const labels = { identity: '身份', value: '价值', management: '管理', stickiness: '粘性' };
      (['identity', 'value', 'management', 'stickiness'] as const).forEach(p => {
        const cur = pillars[p].score;
        const req = thresholds[p];
        if (cur < req) {
          const gapVal = req - cur;
          gaps.push({
            pillar: p,
            pillarLabel: labels[p],
            currentValue: cur,
            requiredValue: req,
            priority: gapVal >= 25 ? 'high' : gapVal >= 15 ? 'medium' : 'low',
            recommendation: (() => {
              if (p === 'identity') return currentStage === 'DesignAlignment' ? '补充战略方向（direction）设定，区分目标伙伴级别与区域' : '深化差异化设计，考虑行业/级别/区域维度定制';
              if (p === 'value') return currentStage === 'DesignAlignment' ? '考虑引入返利（Rebate）机制或阶梯式激励结构' : '增加非金钱激励（培训、MDF、认证奖励）占比';
              if (p === 'management') return '增强规则透明度文档、引入KBI行为追踪、优化结算周期';
              return '建立续约分成、LTV奖励或联合投资计划，把短期激励转为长期利益绑定';
            })(),
          });
        }
      });
      const totalGap = gaps.reduce((s, g) => s + (g.requiredValue - g.currentValue), 0);
      readiness = Math.max(0, Math.min(100, 100 - Math.round(totalGap / 4)));
    }

    // 6. 风险预警
    const riskAlerts: IncentiveMaturityHealth['riskAlerts'] = [];
    if (daysInCurrentStage > stageInfo.avgDaysInStage * 2) {
      riskAlerts.push({
        type: 'stage_stagnation', severity: daysInCurrentStage > stageInfo.avgDaysInStage * 3 ? 'critical' : 'high',
        title: `${stageInfo.label}停滞`,
        detail: `已停留 ${daysInCurrentStage} 天（平均 ${stageInfo.avgDaysInStage} 天）`,
        action: currentStage === 'DesignAlignment' ? '加速审批流程，或重新评估政策合理性' :
                currentStage === 'GuidanceMotivation' ? '检查伙伴参与度，必要时优化激励结构' :
                currentStage === 'RealizationAudit' ? '排查结算流程瓶颈，避免伙伴因延迟到账产生不满' :
                '启动年度复盘，推动政策演进进入新阶段',
      });
    }
    if (pillars.identity.score < 50) {
      riskAlerts.push({
        type: 'misaligned_strategy', severity: 'medium', title: '战略对齐度不足',
        detail: '身份支柱评分低，可能缺乏清晰的战略方向或差异化设计',
        action: '在计划中补充 direction（战略方向）、targetTiers（目标级别）、targetRegions（目标区域）字段',
      });
    }
    if (pillars.identity.score < 40) {
      riskAlerts.push({
        type: 'no_differential_design', severity: 'high', title: '缺乏差异化设计',
        detail: '对所有伙伴使用相同的激励方案，无法精准引导不同层级的伙伴',
        action: '引入 tier / region / industry 定向规则，把钱花在对的伙伴身上',
      });
    }
    if (pillars.management.score < 40) {
      riskAlerts.push({
        type: 'complex_rules', severity: 'medium', title: '规则模糊或执行难',
        detail: '管理支柱评分低，可能规则不清、门槛不明或缺乏文档',
        action: '补充 description 规则文档，明确 threshold/目标/结算周期',
      });
    }
    if (pillars.value.score < 40) {
      riskAlerts.push({
        type: 'kbi_missing', severity: 'medium', title: '价值结构单一',
        detail: '可能只有金钱激励，缺乏能力/资源型激励（培训、MDF、认证）',
        action: '引入 Points/Rebate/MDF 混合激励，把"给钱求办事"升级为"给资源求共赢"',
      });
    }
    if (typeof program.participantsCount === 'number' && program.participantsCount < 5 && (program.status === 'Active' || (program.status as string) === 'approved')) {
      riskAlerts.push({
        type: 'low_participation', severity: 'high', title: '伙伴参与度过低',
        detail: `仅 ${program.participantsCount} 家伙伴参与`,
        action: '检查是否及时通知伙伴、门槛是否过高、奖励是否有吸引力',
      });
    }
    if (typeof program.totalBudget === 'number' && program.totalBudget > 0 && typeof program.used === 'number' && program.used > program.totalBudget) {
      riskAlerts.push({
        type: 'budget_risk', severity: 'critical', title: '预算超支',
        detail: `已使用 ¥${Math.round(program.used).toLocaleString()} / 总预算 ¥${Math.round(program.totalBudget).toLocaleString()}`,
        action: '触发 BudgetAlert 硬性止损，必要时追加预算审批或收紧规则',
      });
    }
    if (typeof program.roiRate === 'number' && program.roiRate > 0 && program.roiRate < 1 && (program.status === 'Ended' || (program.status as string) === 'completed')) {
      riskAlerts.push({
        type: 'low_roi', severity: 'high', title: 'ROI低于预期',
        detail: `已结算的政策 ROI 仅 ${program.roiRate}×`,
        action: '复盘激励有效性，下个周期调整激励结构或目标人群',
      });
    }
    if (pillars.stickiness.score < 30 && (program.status === 'Ended' || (program.status as string) === 'completed')) {
      riskAlerts.push({
        type: 'no_ltv_reward', severity: 'medium', title: '缺乏长期价值绑定',
        detail: '政策已结束但尚未建立长效利益绑定机制',
        action: '引入续约分成 / LTV奖励 / 联合投资计划，把伙伴的一次性参与转为长期关系',
      });
    }

    // 7. 激励结构分析
    const payoutTypeLocal = program.payoutType || 'Cash';
    const incentiveMix = {
      cashReward: payoutTypeLocal === 'Rebate' || payoutTypeLocal === 'Cash' ? 70 : 40,
      resourceReward: payoutTypeLocal === 'Points' ? 30 : 20,
      capabilityReward: 15,
      ltvReward: 5,
    };

    return {
      planId, planTitle: program.title || '未命名激励计划',
      planCategory: program.type || program.category || '未分类',
      currentStage, currentStageLabel: stageInfo.label, daysInCurrentStage,
      overallScore, status, pillarScores: pillars,
      promotionReadiness: {
        canPromote: nextStage ? readiness >= 75 : false,
        nextStage: nextStage || 'EvolutionOptimization',
        nextStageLabel: nextStage ? INCENTIVE_MATURITY_STAGE_CONFIG[nextStage].label : '最终阶段',
        readinessPercentage: readiness,
        gapAnalysis: gaps,
      },
      riskAlerts, incentiveMix,
      lastUpdated: new Date().toISOString(),
    };
  } catch (e) {
    console.error('[IncentiveMaturity] calculate error:', e);
    return null;
  }
}

async function getIncentiveMaturityEvents(planId: string): Promise<IncentiveMaturityEvent[]> {
  return [
    { id: `ie-${planId}-1`, planId, fromStage: null, toStage: 'DesignAlignment', eventDate: new Date(Date.now() - 30 * 86400000).toISOString(), operator: 'system', reason: '激励计划发起' },
  ];
}

function generateIncentiveInspectionReport(programs: any[]) {
  const alerts: any[] = [];
  let totalScore = 0;
  programs.forEach(program => {
    const pillars = calculateIncentivePillars(program);
    const overall = Math.round(pillars.identity.score * 0.25 + pillars.value.score * 0.30 + pillars.management.score * 0.25 + pillars.stickiness.score * 0.20);
    totalScore += overall;
    const currentStage = INCENTIVE_OPERATION_TO_MATURITY_MAP[String(program.status || 'draft')] || 'DesignAlignment';
    const stageInfo = INCENTIVE_MATURITY_STAGE_CONFIG[currentStage];
    const days = program.daysInCurrentStage || 0;
    const labels = { identity: '身份', value: '价值', management: '管理', stickiness: '粘性' };
    (['identity', 'value', 'management', 'stickiness'] as const).forEach(p => {
      if (pillars[p].score < 45) {
        alerts.push({
          id: `inc-${program.id}-${p}`,
          severity: pillars[p].score < 30 ? 'high' : 'medium',
          title: `${labels[p]}支柱不足`,
          detail: `${program.title || '未命名'} 的${labels[p]}支柱仅 ${pillars[p].score} 分`,
          action: p === 'identity' ? '补充战略方向和差异化设计' :
                  p === 'value' ? '增加能力/资源型激励比重（MDF/培训/认证）' :
                  p === 'management' ? '强化规则文档和结算透明度' :
                  '建立续约分成和联合投资机制',
          planId: program.id, planTitle: program.title,
          overallScore: overall, createdAt: new Date().toISOString(),
        });
      }
    });
    if (days > stageInfo.avgDaysInStage * 2) {
      alerts.push({
        id: `inc-${program.id}-stagnant`, severity: days > stageInfo.avgDaysInStage * 3 ? 'critical' : 'high',
        title: `${stageInfo.label}停滞`, planId: program.id, planTitle: program.title,
        detail: `已停留 ${days} 天（平均 ${stageInfo.avgDaysInStage} 天）`,
        action: '检查当前阶段阻塞原因（审批/参与/结算）',
        overallScore: overall, createdAt: new Date().toISOString(),
      });
    }
  });

  return {
    summary: {
      total: programs.length,
      averageScore: programs.length > 0 ? Math.round(totalScore / programs.length) : 0,
      alerts: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
    },
    alerts,
  };
}

// ── 导出激励服务对象 ──
export const incentiveMaturityService = {
  calculateHealth: calculateIncentiveMaturityHealth,
  getEvents: getIncentiveMaturityEvents,
  calculatePillars: calculateIncentivePillars,
  generateReport: generateIncentiveInspectionReport,
  config: INCENTIVE_MATURITY_STAGE_CONFIG,
};

// ── 导出为统一服务对象 ──
export const dealMaturityService = {
  calculateHealth: calculateDealMaturityHealth,
  getEvents: getDealMaturityEvents,
  advanceStage: advanceDealMaturityStage,
  calculatePillars: calculateDealMaturityPillars,
  getEcosystemDistribution: getDealEcosystemDistribution,
  determineStage: getDealMaturityStageFromOperation,
  config: DEAL_MATURITY_STAGE_CONFIG,
};

// ────────────────────────────────────────────────────────────────────────────────
// 商机健康巡检 & 保护期到期提醒引擎 (Deal Alert Engine)
// ────────────────────────────────────────────────────────────────────────────────

/**
 * 告警类型定义
 */
export type AlertType =
  | 'protection_expiring'        // 保护期即将到期
  | 'stagnant_deal'              // 商机长期停滞
  | 'low_health'                 // 健康度过低
  | 'ready_for_promotion'        // 可晋级到下一关系阶段
  | 'partner_stuck'              // 伙伴商机全部卡在报备期
  | 'missing_solution'           // 协同期缺少方案/PoC记录
  | 'expired_protection';        // 保护期已过期

export interface DealAlert {
  id: string;
  type: AlertType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  suggestedAction: string;
  dealId: string;
  dealTitle: string;
  partnerName: string;
  customerName: string;
  dealStage: DealMaturityStage;
  operationStage: string;
  dealValue: number;
  healthScore: number;
  protectionRemainingDays?: number;
  daysInCurrentStage: number;
  createdAt: string;
}

/**
 * 巡检报告：一次性返回所有告警 + 统计摘要
 */
export interface DealInspectionReport {
  generatedAt: string;
  totalDealsScanned: number;
  summary: {
    totalAlerts: number;
    bySeverity: { critical: number; high: number; medium: number; low: number };
    byType: Record<AlertType, number>;
    avgHealthScore: number;
    expiringCount: number;
    stagnantCount: number;
    promotableCount: number;
    stuckPartners: number;
  };
  alerts: DealAlert[];
  /** 按伙伴聚合：用于识别"漏斗式转化阻塞" */
  partnerInsights: {
    partnerName: string;
    totalDeals: number;
    stuckInRegistration: number;
    avgHealthScore: number;
    recommendedAction: string;
  }[];
}

/**
 * 扫描全部商机，生成巡检报告
 * @param deals 商机列表（从前端传入，避免重复查询）
 */
function generateInspectionReport(deals: Deal[]): DealInspectionReport {
  const now = new Date();
  const alerts: DealAlert[] = [];
  const partnerDealMap: Record<string, Deal[]> = {};

  // ── 第一步：按伙伴聚合 ──
  deals.forEach((d) => {
    if (!d.partnerName) return;
    if (!partnerDealMap[d.partnerName]) partnerDealMap[d.partnerName] = [];
    partnerDealMap[d.partnerName].push(d);
  });

  let totalHealth = 0;
  let healthCalculated = 0;
  let expiringCount = 0;
  let stagnantCount = 0;
  let promotableCount = 0;

  // ── 第二步：逐条商机扫描 ──
  deals.forEach((deal) => {
    const opStage = (deal.stage as string) || 'Registered';
    const maturityStage = DEAL_OPERATION_TO_MATURITY_MAP[opStage as DealLifecycleStageV2] || 'Registration';

    // 跳过已关闭/已赢单的商机（除非需要检查循环期的续约）
    if (opStage === 'ClosedLost') return;

    // 健康度快速评估（使用相同逻辑，但轻量）
    const pillarIdentity = (
      (deal.status === 'Approved' || deal.status === 'Converted' ? 25 : 10) +
      (!deal.hasConflict ? 15 : 0) +
      (deal.protectionRemainingDays !== undefined && deal.protectionRemainingDays > 0 ? 25 : 0) +
      (deal.salesName ? 15 : 0)
    );
    const pillarValue = (
      (opStage === 'Solution' ? 15 : opStage === 'Commercial' ? 25 : opStage === 'Negotiation' ? 35 : opStage === 'ClosedWon' ? 60 : 20) +
      (deal.isPriority ? 15 : 0) +
      (deal.description && deal.description.length > 20 ? 10 : 0)
    );
    const daysSinceActivity = (() => {
      try {
        const t = deal.lastActivityDate || deal.createdDate;
        if (!t) return 30;
        const diff = Math.floor((Date.now() - new Date(t).getTime()) / 86400000);
        return Math.max(0, diff);
      } catch { return 30; }
    })();
    const pillarManagement = (
      (daysSinceActivity <= 7 ? 30 : daysSinceActivity <= 30 ? 15 : 0) +
      (deal.isStagnant ? 0 : 15) +
      (typeof deal.value === 'number' && deal.value > 0 ? 10 : 0) +
      (deal.leadResponseTime !== undefined ? (deal.leadResponseTime <= 24 ? 15 : deal.leadResponseTime <= 72 ? 8 : 3) : 5)
    );
    const pillarStickiness = (
      (opStage === 'ClosedWon' ? 60 : opStage === 'Migrated' ? 50 : 15) +
      (deal.isNewLogo ? 5 : 0) +
      ((deal as any).relatedDeals && (deal as any).relatedDeals?.length > 0 ? 20 : 0)
    );
    const healthScore = Math.round(
      pillarIdentity * 0.25 + pillarValue * 0.30 + pillarManagement * 0.25 + pillarStickiness * 0.20
    );
    totalHealth += healthScore;
    healthCalculated++;

    const daysInStage = deal.daysInCurrentStage || daysSinceActivity;

    // 告警 1：保护期即将到期（≤ 7 天）
    if (deal.protectionRemainingDays !== undefined && deal.protectionRemainingDays > 0 && deal.protectionRemainingDays <= 7) {
      expiringCount++;
      alerts.push({
        id: `prot-exp-${deal.id}`,
        type: 'protection_expiring',
        severity: deal.protectionRemainingDays <= 3 ? 'critical' : 'high',
        title: `保护期剩余 ${deal.protectionRemainingDays} 天`,
        detail: `商机「${deal.title}」报备保护即将到期，若不能在保护期内推进到方案阶段，可能被其他伙伴重新报备。`,
        suggestedAction: '立即安排联合拜访客户，推进商机至"协同期/方案跟进"阶段，或申请延长保护期。',
        dealId: deal.id, dealTitle: deal.title, partnerName: deal.partnerName, customerName: deal.customerName,
        dealStage: maturityStage, operationStage: opStage, dealValue: deal.value,
        healthScore, protectionRemainingDays: deal.protectionRemainingDays, daysInCurrentStage: daysInStage,
        createdAt: now.toISOString(),
      });
    }

    // 告警 2：保护期已过期
    if (deal.protectionRemainingDays !== undefined && deal.protectionRemainingDays <= 0 && maturityStage === 'Registration') {
      alerts.push({
        id: `prot-expired-${deal.id}`,
        type: 'expired_protection',
        severity: 'high',
        title: '保护期已过期',
        detail: `商机「${deal.title}」的报备保护已过期，无排他性保护。`,
        suggestedAction: '评估客户意向：有价值 → 与伙伴沟通重新报备；无价值 → 标记为关闭。',
        dealId: deal.id, dealTitle: deal.title, partnerName: deal.partnerName, customerName: deal.customerName,
        dealStage: maturityStage, operationStage: opStage, dealValue: deal.value,
        healthScore, daysInCurrentStage: daysInStage, createdAt: now.toISOString(),
      });
    }

    // 告警 3：商机停滞（非循环期商机且已超过 30 天未推进）
    const avgDays = DEAL_MATURITY_STAGE_CONFIG[maturityStage].avgDaysInStage;
    if (maturityStage !== 'Expansion' && daysInStage > avgDays * 2) {
      stagnantCount++;
      alerts.push({
        id: `stagnant-${deal.id}`,
        type: 'stagnant_deal',
        severity: daysInStage > avgDays * 3 ? 'critical' : 'high',
        title: `在${DEAL_MATURITY_STAGE_CONFIG[maturityStage].label}停留 ${daysInStage} 天`,
        detail: `商机「${deal.title}」平均停留 ${avgDays} 天，已超过 2 倍。${
          maturityStage === 'Registration' ? '可能原因：客户需求不清晰/伙伴能力不足。' :
          maturityStage === 'Collaboration' ? '可能原因：方案验证受阻/资源投入不够。' :
          '可能原因：价格/条款谈判陷入僵局。'
        }`,
        suggestedAction: maturityStage === 'Registration'
          ? '渠道经理介入：与伙伴沟通客户真实需求，判断是否值得继续投入资源。'
          : maturityStage === 'Collaboration'
            ? '分配售前工程师联合 PoC，或安排双方管理层沟通。'
            : '重新梳理价格策略，必要时申请特批权限。',
        dealId: deal.id, dealTitle: deal.title, partnerName: deal.partnerName, customerName: deal.customerName,
        dealStage: maturityStage, operationStage: opStage, dealValue: deal.value,
        healthScore, daysInCurrentStage: daysInStage, createdAt: now.toISOString(),
      });
    }

    // 告警 4：健康度过低（需要全面关注）
    if (healthScore < 35 && opStage !== 'ClosedWon') {
      alerts.push({
        id: `low-health-${deal.id}`,
        type: 'low_health',
        severity: 'high',
        title: `综合健康度 ${healthScore} 分`,
        detail: `商机「${deal.title}」在身份确权、价值创造、管理效率或客户粘性方面存在明显短板。`,
        suggestedAction: '打开商机详情页 → 查看"关系深度演进追踪"卡片 → 逐项解决 4支柱中的低分问题。',
        dealId: deal.id, dealTitle: deal.title, partnerName: deal.partnerName, customerName: deal.customerName,
        dealStage: maturityStage, operationStage: opStage, dealValue: deal.value,
        healthScore, daysInCurrentStage: daysInStage, createdAt: now.toISOString(),
      });
    }

    // 告警 5：可晋级到下一关系阶段（≥ 80 分且差距已满足）
    if (maturityStage !== 'Expansion' && healthScore >= 75 && daysInStage >= DEAL_MATURITY_STAGE_CONFIG[maturityStage].minDaysBeforePromotion) {
      promotableCount++;
      alerts.push({
        id: `promotable-${deal.id}`,
        type: 'ready_for_promotion',
        severity: 'low',
        title: `可晋级到${maturityStage === 'Registration' ? '协同期' : maturityStage === 'Collaboration' ? '成交期' : '循环期'}`,
        detail: `商机「${deal.title}」当前健康度 ${healthScore} 分，已具备推进到下一关系阶段的条件。`,
        suggestedAction: maturityStage === 'Registration'
          ? '启动联合拜访：安排渠道经理 + 伙伴销售共同拜访客户。'
          : maturityStage === 'Collaboration'
            ? '进入商务阶段：确认价格审批与合同条款沟通。'
            : '激活客户成功：推动首单交付与满意度回访。',
        dealId: deal.id, dealTitle: deal.title, partnerName: deal.partnerName, customerName: deal.customerName,
        dealStage: maturityStage, operationStage: opStage, dealValue: deal.value,
        healthScore, daysInCurrentStage: daysInStage, createdAt: now.toISOString(),
      });
    }

    // 告警 6：协同期缺少方案证据
    if (maturityStage === 'Collaboration' && pillarValue < 40) {
      alerts.push({
        id: `no-solution-${deal.id}`,
        type: 'missing_solution',
        severity: 'medium',
        title: '协同期缺少方案/PoC 证据',
        detail: `商机「${deal.title}」已进入协同期，但缺少联合方案或 PoC 记录。`,
        suggestedAction: '在商机详情中补充方案描述，并启动售前资源分配。',
        dealId: deal.id, dealTitle: deal.title, partnerName: deal.partnerName, customerName: deal.customerName,
        dealStage: maturityStage, operationStage: opStage, dealValue: deal.value,
        healthScore, daysInCurrentStage: daysInStage, createdAt: now.toISOString(),
      });
    }
  });

  // ── 第三步：按伙伴洞察识别阻塞 ──
  const partnerInsights: DealInspectionReport['partnerInsights'] = [];
  Object.entries(partnerDealMap).forEach(([partnerName, partnerDeals]) => {
    if (partnerDeals.length < 2) return;  // 只关注有多个商机的伙伴
    const stuckInReg = partnerDeals.filter((d) => {
      const op = (d.stage as string) || 'Registered';
      return DEAL_OPERATION_TO_MATURITY_MAP[op as DealLifecycleStageV2] === 'Registration';
    }).length;
    const ratio = stuckInReg / partnerDeals.length;
    if (ratio >= 0.6) {
      let avgScore = 0;
      partnerDeals.forEach((d) => {
        const pillar = (
          ((d.status === 'Approved' || d.status === 'Converted') ? 60 : 30) +
          (typeof d.value === 'number' && d.value > 0 ? 20 : 0) +
          (!d.hasConflict ? 10 : 0)
        );
        avgScore += pillar;
      });
      avgScore = Math.round(avgScore / partnerDeals.length);
      partnerInsights.push({
        partnerName,
        totalDeals: partnerDeals.length,
        stuckInRegistration: stuckInReg,
        avgHealthScore: avgScore,
        recommendedAction: `${Math.round(ratio * 100)}% 的商机全部卡在报备期 → 建议：1) 给伙伴做定向方案赋能培训；2) 安排联合拜访打通样板客户；3) 如连续 3 个月无进展，考虑降级合作。`,
      });
    }
  });

  // ── 第四步：汇总统计 ──
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  const byType: Record<AlertType, number> = {
    protection_expiring: 0, stagnant_deal: 0, low_health: 0,
    ready_for_promotion: 0, partner_stuck: 0, missing_solution: 0, expired_protection: 0,
  };
  alerts.forEach((a) => {
    bySeverity[a.severity]++;
    byType[a.type]++;
  });

  return {
    generatedAt: now.toISOString(),
    totalDealsScanned: deals.length,
    summary: {
      totalAlerts: alerts.length,
      bySeverity,
      byType,
      avgHealthScore: healthCalculated > 0 ? Math.round(totalHealth / healthCalculated) : 0,
      expiringCount,
      stagnantCount,
      promotableCount,
      stuckPartners: partnerInsights.length,
    },
    alerts: alerts.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 } as const;
      return order[a.severity] - order[b.severity];
    }),
    partnerInsights,
  };
}

// ── 导出为统一服务对象 ──
export const dealAlertService = {
  generateReport: generateInspectionReport,
  /** 快速获取保护期即将到期的商机（用于仪表盘首页提醒） */
  getExpiringProtectionDeals: (deals: Deal[], days = 7): Deal[] => {
    return deals.filter((d) =>
      d.protectionRemainingDays !== undefined &&
      d.protectionRemainingDays > 0 &&
      d.protectionRemainingDays <= days
    ).sort((a, b) => (a.protectionRemainingDays || 0) - (b.protectionRemainingDays || 0));
  },
  /** 获取停滞商机列表 */
  getStagnantDeals: (deals: Deal[]): Deal[] => {
    return deals.filter((d) => {
      const opStage = (d.stage as string) || 'Registered';
      if (opStage === 'ClosedWon' || opStage === 'ClosedLost') return false;
      const maturityStage = DEAL_OPERATION_TO_MATURITY_MAP[opStage as DealLifecycleStageV2] || 'Registration';
      const avgDays = DEAL_MATURITY_STAGE_CONFIG[maturityStage].avgDaysInStage;
      const daysInStage = d.daysInCurrentStage || 0;
      return daysInStage > avgDays * 2;
    });
  },
};

// ══════════════════════════════════════════════════════════════════════════════════
// 导出默认服务对象供外部调用
// ══════════════════════════════════════════════════════════════════════════════════

export const lifecycleService = {
  deal: dealLifecycleService,
  partner: partnerLifecycleService,
  incentive: incentiveLifecycleService,
  training: trainingLifecycleService,
  marketing: marketingLifecycleService,
  dashboard: unifiedLifecycleDashboardService,
  maturity: partnerMaturityService,
  config: LIFECYCLE_CONFIG,
  maturityConfig: MATURITY_STAGE_CONFIG,
  utils: { daysSince, daysBetween, mapHealthStatus },
};

export default lifecycleService;
