// Partner statuses
export const PARTNER_STATUSES = [
  'PendingReview',
  'Cooperating',
  'Inactive',
  'Terminated',
] as const;

export type PartnerStatus = (typeof PARTNER_STATUSES)[number];

// Partner tiers
export const PARTNER_TIERS = [
  'Strategic',
  'Gold',
  'Silver',
  'Bronze',
  'Registered',
  'Prospective',
  'Terminated',
] as const;

export type PartnerTier = (typeof PARTNER_TIERS)[number];

export const PARTNER_TIER_WEIGHTS: Record<PartnerTier, number> = {
  Strategic: 10,
  Gold: 7,
  Silver: 5,
  Bronze: 3,
  Registered: 1,
  Prospective: 1,
  Terminated: 0,
};

// Deal lifecycle stages
export const DEAL_STAGES = [
  'Registered',
  'UnderReview',
  'Approved',
  'Migrated',
  'Solution',
  'Commercial',
  'Negotiation',
  'ClosedWon',
  'ClosedLost',
] as const;

export type DealLifecycleStage = (typeof DEAL_STAGES)[number];

export const DEAL_STAGES_WON = ['ClosedWon'] as const;
export const DEAL_STAGES_LOST = ['ClosedLost'] as const;
export const DEAL_STAGES_ACTIVE: DealLifecycleStage[] = [
  'Registered',
  'UnderReview',
  'Approved',
  'Migrated',
  'Solution',
  'Commercial',
  'Negotiation',
];

// Deal statuses (operational state, not the lifecycle stage)
export const DEAL_STATUSES = [
  'Pending',
  'Approved',
  'Rejected',
  'Converted',
  'ClosedWon',
  'ClosedLost',
] as const;

export type DealStatus = (typeof DEAL_STATUSES)[number];

// --- Stage configuration: win probability, benchmark days, label ---
export interface DealStageConfig {
  probability: number;
  benchmarkDays: number;
  label: string;
  weight: number;
}

export const DEAL_STAGE_CONFIG: Record<DealLifecycleStage, DealStageConfig> = {
  Registered: { probability: 10, benchmarkDays: 3, label: '已报备', weight: 0.1 },
  UnderReview: { probability: 20, benchmarkDays: 5, label: '审批中', weight: 0.15 },
  Approved: { probability: 35, benchmarkDays: 7, label: '已批复', weight: 0.2 },
  Migrated: { probability: 40, benchmarkDays: 5, label: '迁单', weight: 0.2 },
  Solution: { probability: 50, benchmarkDays: 14, label: '方案跟进', weight: 0.25 },
  Commercial: { probability: 80, benchmarkDays: 21, label: '商务洽谈', weight: 0.3 },
  Negotiation: { probability: 90, benchmarkDays: 15, label: '合同谈判', weight: 0.35 },
  ClosedWon: { probability: 100, benchmarkDays: 0, label: '赢单', weight: 1 },
  ClosedLost: { probability: 0, benchmarkDays: 0, label: '丢单', weight: 0 },
};

// --- Deal funnel bottleneck detection stages ---
export const DEAL_FUNNEL_STAGES: DealLifecycleStage[] = [
  'Registered',
  'UnderReview',
  'Approved',
  'Solution',
  'Commercial',
  'Negotiation',
  'ClosedWon',
];

// --- Stagnation threshold (days) used by health engine ---
export const DEAL_STAGNATION_PENALTY_PER_DAY = 5;
export const DEAL_MAX_STAGNATION_PENALTY = 30;

// --- Activity weights (partner health scoring) ---
export type ActivityType =
  | 'LOGIN'
  | 'LEAD_SUBMIT'
  | 'MDF_CLAIM'
  | 'TRAINING'
  | 'DEAL_WIN'
  | 'ACTIVITY_JOIN';

export const ACTIVITY_WEIGHTS: Record<ActivityType, number> = {
  LOGIN: 1,
  LEAD_SUBMIT: 10,
  MDF_CLAIM: 15,
  TRAINING: 5,
  DEAL_WIN: 20,
  ACTIVITY_JOIN: 8,
};

export const MAX_VITALITY_SCORE = 100;

// --- Partner health pillar weights ---
export const PARTNER_HEALTH_WEIGHTS = {
  ACTIVITY: 0.25,
  DEAL_FREQUENCY: 0.2,
  WIN_RATE: 0.25,
  TRAINING: 0.15,
  INCENTIVE: 0.15,
};

// --- Marketing activity cache TTL ---
export const MARKETING_CACHE_TTL_MS = 30_000;
export const MARKETING_CACHE_TTL_SECONDS = 30;

// --- Deal registration conflict rules ---
export const DEAL_CONFLICT_DUPLICATE_WINDOW_DAYS = 90;

// --- Partner inactivity / dormancy thresholds ---
export const PARTNER_INACTIVITY_DORMANT_DAYS = 180;
export const PARTNER_MIN_DEAL_FREQUENCY_DAYS = 90;
export const PARTNER_MIN_TRAINING_PER_YEAR = 2;
export const PARTNER_MIN_INCENTIVE_PARTICIPATION = 0.2;

// --- Certificate lifecycle ---
export const CERTIFICATE_VALIDITY_DAYS = 365;
export const CERTIFICATE_EXPIRY_WARNING_DAYS = 90;

// --- Marketing ROI thresholds ---
export interface ROIThresholds {
  excellent: number;
  good: number;
  acceptable: number;
  poor: number;
}

export const INCENTIVE_ROI_THRESHOLDS: ROIThresholds = {
  excellent: 5,
  good: 3,
  acceptable: 1,
  poor: 0,
};

export const MARKETING_ROI_THRESHOLDS: ROIThresholds = {
  excellent: 5,
  good: 3,
  acceptable: 1,
  poor: 0,
};

// --- 4-pillar health scoring weights (per entity type) ---
export type EntityType = 'partner' | 'deal' | 'incentive' | 'marketing';

export const HEALTH_PILLAR_WEIGHTS: Record<EntityType, {
  identity: number;
  value: number;
  management: number;
  stickiness: number;
}> = {
  partner: { identity: 0.2, value: 0.3, management: 0.3, stickiness: 0.2 },
  deal: { identity: 0.15, value: 0.4, management: 0.25, stickiness: 0.2 },
  incentive: { identity: 0.2, value: 0.35, management: 0.25, stickiness: 0.2 },
  marketing: { identity: 0.2, value: 0.4, management: 0.2, stickiness: 0.2 },
};

// Validate weights sum to 1 for each entity
export function validatePillarWeights(): Record<EntityType, boolean> {
  const result: Record<EntityType, boolean> = {
    partner: false,
    deal: false,
    incentive: false,
    marketing: false,
  };
  (Object.keys(HEALTH_PILLAR_WEIGHTS) as EntityType[]).forEach((type) => {
    const w = HEALTH_PILLAR_WEIGHTS[type];
    result[type] = Math.abs(w.identity + w.value + w.management + w.stickiness - 1) < 0.01;
  });
  return result;
}

// --- Partner relationship maturity stages ---
export const PARTNER_MATURITY_STAGES = [
  'Transactional',
  'Transitional',
  'Relational',
  'Symbiotic',
] as const;

export type PartnerMaturityStage = (typeof PARTNER_MATURITY_STAGES)[number];

// --- Incentive program maturity stages ---
export const INCENTIVE_MATURITY_STAGES = [
  'DesignAlignment',
  'GuidanceMotivation',
  'RealizationAudit',
  'EvolutionOptimization',
] as const;

export type IncentiveMaturityStage = (typeof INCENTIVE_MATURITY_STAGES)[number];

export interface MaturityStageMeta {
  label: string;
  avgDays: number;
  minPromotionDays: number;
}

export const INCENTIVE_MATURITY_CONFIG: Record<IncentiveMaturityStage, MaturityStageMeta> = {
  DesignAlignment: { label: '方案对齐期', avgDays: 30, minPromotionDays: 15 },
  GuidanceMotivation: { label: '引导激励期', avgDays: 60, minPromotionDays: 30 },
  RealizationAudit: { label: '兑现审计期', avgDays: 90, minPromotionDays: 45 },
  EvolutionOptimization: { label: '迭代优化期', avgDays: 120, minPromotionDays: 60 },
};

// --- Incentive operation status to maturity mapping ---
export const INCENTIVE_OPERATION_TO_MATURITY_MAP: Record<string, IncentiveMaturityStage> = {
  'Draft': 'DesignAlignment',
  'Planning': 'DesignAlignment',
  'Active': 'GuidanceMotivation',
  'Paused': 'GuidanceMotivation',
  'Evaluating': 'RealizationAudit',
  'Completed': 'EvolutionOptimization',
  'Archived': 'EvolutionOptimization',
};
