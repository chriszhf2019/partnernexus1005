// ─────────────────────────────────────────────────────────────────────────────
// 评分配置类型定义
// ─────────────────────────────────────────────────────────────────────────────

/** 评分配置条目 */
export interface ScoringConfigItem {
  id: string;
  configKey: string;
  configValue: Record<string, any>;
  description?: string;
  category: 'tier' | 'weight' | 'penalty' | 'churn' | 'system';
  isActive: boolean;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/** 加载后的完整评分配置 */
export interface ScoringConfig {
  tierBaseline: Record<string, number>;
  tierCertExpectation: Record<string, number>;
  healthWeights: Record<string, number>;
  growthWeights: Record<string, number>;
  willingnessWeights: Record<string, number>;
  fitWeights: Record<string, number>;
  capabilityWeights: Record<string, number>;
  incentiveWeights: Record<string, number>;
  negativePenalty: NegativePenaltyConfig;
  churnThresholds: ChurnThresholdConfig;
  monthlySnapshot: MonthlySnapshotConfig;
}

/** 负反馈扣分配置 */
export interface NegativePenaltyConfig {
  noPipelineYears: number;        // 无 pipeline 年数阈值
  noCertEngineersYears: number;   // 无认证工程师年数阈值
  noMdfYears: number;             // 有 MDF 预算但未使用的年数阈值
  maxPenalty: number;             // 扣分上限
  noPipelinePenalty: number;      // 无 pipeline 扣分
  noCertPenalty: number;          // 无认证工程师扣分
  noMdfPenalty: number;           // MDF 未使用扣分
  inactivePenalty: number;        // 非合作状态扣分
  lowWinRatePenalty: number;      // 低赢单率扣分
}

/** 流失风险阈值配置 */
export interface ChurnThresholdConfig {
  notCooperating: number;         // 非合作中状态基础分
  expiryThreshold: number;         // 认证过期数量阈值
  expiryBonus: number;            // 认证过期扣分
  pipelineThreshold: number;      // Pipeline 金额阈值
  pipelineLow: number;            // Pipeline 低扣分
  winRateThreshold: number;       // 赢单率阈值
  winRateLow: number;             // 赢单率低扣分
  mdfThreshold: number;           // MDF 使用率阈值
  mdfLow: number;                // MDF 低扣分
}

/** 月度快照配置 */
export interface MonthlySnapshotConfig {
  enabled: boolean;
  autoRunDay: number;            // 每月第几天执行
  autoRunHour: number;          // 执行时间(小时)
  retentionMonths: number;       // 数据保留月数
}

/** 认证培训记录 */
export interface PartnerTrainingRecord {
  id: string;
  partnerId: string;
  certificationName: string;
  category: 'traditional_it' | 'cloud_native' | 'ai_ml' | 'security' | 'data' | 'service';
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  provider?: string;
  certificateId?: string;
  obtainedAt: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'pending';
  createdAt: string;
  updatedAt: string;
}

/** 月度统计数据 */
export interface PartnerMonthlyStats {
  id: string;
  partnerId: string;
  year: number;
  month: number;
  isNew: boolean;
  isLost: boolean;
  isActive: boolean;
  pipelineRegistered: number;
  pipelineWon: number;
  revenue: number;
  mdfUsed: number;
  mdfTotal: number;
  certificationCount: number;
  marketingActivityCount: number;
  createdAt: string;
  updatedAt: string;
}

/** 增长数据置信度 */
export interface GrowthConfidence {
  yoyGrowth: number | null;
  qoqGrowth: number | null;
  incentiveExecution: number | null;
  confidence: 'high' | 'medium' | 'low' | 'insufficient';
  dataMonths: number;
  dataHistoryYears: number;
}

/** 技术类别映射 */
export const TECH_CATEGORY_LABELS: Record<string, string> = {
  'traditional_it': '传统IT',
  'cloud_native': '云原生',
  'ai_ml': 'AI/ML',
  'security': '安全',
  'data': '数据',
  'service': '服务',
};

/** 技术类别颜色 */
export const TECH_CATEGORY_COLORS: Record<string, string> = {
  'traditional_it': '#52525b',
  'cloud_native': '#2563eb',
  'ai_ml': '#dc2626',
  'security': '#d97706',
  'data': '#059669',
  'service': '#7c3aed',
};
