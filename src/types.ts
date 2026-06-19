export type PartnerTier = 'Platinum' | 'Gold' | 'Silver' | 'Registered' | 'Diamond' | 'Premier' | 'Standard';
export type PartnerStatus = 'Cooperating' | 'Inactive' | 'Prospective' | 'Rejected';
export type PartnerType = 'Reseller' | 'ISV' | 'OEM' | 'Service' | 'VAD' | 'VAR' | 'SI';
export type PartnerCategory = 'Champions' | 'RisingStars' | 'Opportunists' | 'Dormant' | 'Newcomers';

export type DealLifecycleStage =
  | 'Registered'    // 已报备
  | 'UnderReview'   // 审批中
  | 'Approved'      // 已批复
  | 'Migrated'      // 迁单
  | 'Solution'      // 方案跟进
  | 'Commercial'    // 商务洽谈
  | 'Negotiation'   // 合同谈判
  | 'ClosedWon'     // 赢单
  | 'ClosedLost';   // 丢单

export type DealStatus = 'Pending' | 'Approved' | 'Rejected' | 'Converted' | 'Closed Won' | 'Closed Lost';

export type DealSource =
  | 'PartnerInitiated'   // 伙伴自主报备
  | 'ChannelAssigned'    // 渠道经理指派
  | 'MDFCampaign'        // MDF活动转化
  | 'MarketingEvent'     // 市场活动
  | 'IncentiveProgram'   // 激励计划
  | 'Referral';          // 客户推荐

/** 判断商机是否已赢单（stage 或 status 任一符合即为赢单） */
export function isDealWon(deal: { stage?: string; status?: string }): boolean {
  return deal.stage === 'ClosedWon' || deal.status === 'Closed Won' || deal.status === 'Converted';
}

/** 判断商机是否已丢单 */
export function isDealLost(deal: { stage?: string; status?: string }): boolean {
  return deal.stage === 'ClosedLost' || deal.status === 'Closed Lost';
}

export type ConflictType =
  | 'SameCustomerSameProduct'   // 同客户同产品
  | 'SameCustomerSimilarProject' // 同客户相似项目
  | 'MultiPartnerSameDeal';     // 多伙伴同一商机

export interface Customer {
  id: string;
  name: string;
  industry: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  region: string;
  city: string;
  createdDate: string;
  totalDeals: number;
  totalValue: number;
  wonDeals: number;
}

export interface DealConflict {
  id: string;
  type: ConflictType;
  dealIds: string[];
  description: string;
  status: 'Pending' | 'Resolved' | 'Escalated';
  resolution?: string;
  resolvedBy?: string;
  resolvedDate?: string;
  createdDate: string;
  protectionPeriodDays?: number; // 自动保护期天数
  firstReportedDealId?: string; // 首报商机ID
}

export interface DealLifecycleEvent {
  stage: DealLifecycleStage;
  date: string;
  description: string;
  actor: string;
  durationDays?: number;
}

export interface DealConversionMetrics {
  registrationToApprovalDays: number;
  approvalToSolutionDays: number;
  solutionToCommercialDays: number;
  commercialToCloseDays: number;
  totalCycleDays: number;
  isOverdue: boolean;
  expectedCloseDate: string;
}

export interface DealSourceInfo {
  source: DealSource;
  relatedCampaignId?: string;
  relatedEventId?: string;
  incentiveProgramId?: string;
  referralPartnerId?: string;
  leadQuality: 'Hot' | 'Warm' | 'Cold';
  initialContactDate?: string;
}

export interface DealStageProbability {
  stage: DealLifecycleStage;
  probability: number; // 0-100
  avgCycleDays: number; // 该阶段平均停留天数
}

export interface DealActivity {
  id: string;
  dealId: string;
  type: 'note' | 'call' | 'meeting' | 'email' | 'task' | 'update';
  content: string;
  actor: string;
  createdAt: string;
  mentions?: string[];
  replyToId?: string;
}

export type WinLossReason = 
  | 'Price'           // 价格因素
  | 'Product'         // 产品力
  | 'Service'         // 服务差
  | 'Competitor'      // 对手强
  | 'Timing'          // 时机不合适
  | 'Budget'          // 预算问题
  | 'Relationship'    // 客户关系
  | 'Other';          // 其他

export interface WinLossAnalysis {
  reason: WinLossReason;
  description?: string;
  competitor?: string;
  keyFactors?: string[];
}

export interface PartnerCapability {
  id: string;
  partnerId: string;
  tags: string[];
  winRate: number;
  currentLoad: number;
  maxCapacity: number;
}

export interface DealAssignment {
  dealId: string;
  partnerId: string;
  assignedBy: string;
  assignedAt: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
}

// ── 保护规则 ─────────────────────────────────────────
export interface ProtectionRule {
  id: string;
  name: string;
  protectionDays: number;
  requireRecentActivity: boolean;
  recentActivityDays: number;
  expireAction: 'notify_only' | 'auto_release';
  notifyBeforeDays: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RuleExecutionLog {
  id: string;
  ruleId: string;
  dealId: string;
  action: 'notified' | 'released' | 'warned';
  details?: string;
  executedAt: string;
}

// ── 预设筛选 ─────────────────────────────────────────
export interface SavedView {
  id: string;
  userId: string;
  name: string;
  filters: Record<string, any>;
  isPreset: boolean;
  isAIRecommended: boolean;
  sortOrder: number;
  icon: string;
  badgeType: 'count' | 'value' | 'none';
  createdAt: string;
}

export interface PresetFilter {
  id: string;
  name: string;
  icon: string;
  filters: {
    status?: string[];
    stage?: string;
    isStagnant?: boolean;
    expiresInDaysMax?: number;
    minValue?: number;
    region?: string[];
    assignedTo?: string;
    productType?: string[];
  };
  isSystem: boolean;
  isAIRecommended: boolean;
  sortOrder: number;
  badge: 'count' | 'value' | 'none';
}

export interface FilterHistory {
  id: string;
  userId: string;
  filters: Record<string, any>;
  resultCount: number;
  createdAt: string;
}

export interface Deal {
  id: string;
  title: string;
  customerId?: string;
  customerName: string;
  customerIndustry?: string;
  customerContact?: string;
  customerPhone?: string;
  value: number;
  weightedValue?: number; // 加权金额
  weighted_value?: number; // 数据库字段名
  partnerId: string;       // 注册时的合作伙伴
  partnerName: string;     // 注册时的合作伙伴名称
  actualPartnerId?: string; // 结单时的实际合作伙伴（可能与注册时不同）
  actualPartnerName?: string; // 实际合作伙伴名称
  partnerType: PartnerType;
  stage: DealLifecycleStage | DealLifecycleStageV2; // 生命周期阶段
  lifecycleStage?: DealLifecycleStageV2; // 备用生命周期阶段
  stageEnteredAt?: string; // 进入当前阶段时间
  daysInCurrentStage?: number; // 当前阶段停留天数
  healthScore?: number; // 健康度评分 0-100
  conversionProbability?: number; // 赢单概率 0-1
  status: DealStatus;
  region: string;
  province?: string;
  city?: string;
  salesName: string;
  salesTeam: string;
  productType: string;
  createdDate: string;
  lastActivityDate: string;
  expectedCloseDate: string;
  actualCloseDate?: string;
  isPriority?: boolean;
  hasConflict?: boolean;
  conflictId?: string;
  lifecycle: DealLifecycleEvent[];
  conversionMetrics?: DealConversionMetrics;
  sourceInfo?: DealSourceInfo;
  description?: string;
  notes?: string;
  nextAction?: string;
  nextActionDate?: string;
  relatedDeals?: string[];
  parentDealId?: string;
  activities?: DealActivity[];
  isStagnant?: boolean; // 是否异常停滞
  expiresInDays?: number; // 有效期剩余天数
  winLossAnalysis?: WinLossAnalysis; // 赢单/丢单分析
  originActivityId?: string; // 关联营销活动ID
  originActivityName?: string; // 关联营销活动名称
  originInvitationCode?: string; // 关联邀请码
  incentiveProgramId?: string; // 关联激励计划ID
  leadResponseTime?: number; // 线索首次响应时长(小时)
  isNewLogo?: boolean; // 是否新客户
  protectionRemainingDays?: number; // 保护期剩余天数
  currency?: string; // 货币类型，默认 CNY
  dataSource?: string; // 数据来源标记：seed(演示数据) / real(真实数据)
  source?: string; // 商机来源：PartnerInitiated / ChannelAssigned / Marketing
  winProbability?: number; // 动态赢单概率 0-1
  partner_id?: string; // 数据库字段名（与 partnerId 对应）
  // ── 商机关系深度生命周期（4阶段理念）──
  maturityStage?: DealMaturityStage;       // 关系深度阶段：Registration / Collaboration / Closing / Expansion
  maturityHealthScore?: number;            // 4支柱综合评分 0-100
  pillarScoreIdentity?: number;            // 身份支柱评分 0-100
  pillarScoreValue?: number;               // 价值支柱评分 0-100
  pillarScoreManagement?: number;          // 管理支柱评分 0-100
  pillarScoreStickiness?: number;          // 粘性支柱评分 0-100
  maturityStatus?: 'healthy' | 'monitoring' | 'at_risk' | 'critical';
  maturityLastUpdated?: string;            // 最近一次评估时间
}

export interface DealRegistrationStats {
  yearNew: number;
  quarterNew: number;
  monthNew: number;
  weekNew: number;
  rejected: number;
  closed: number;
  totalPipelineValue: number;
  avgCycleDays: number;
  conversionRate: number;
  stageDistribution: Record<DealLifecycleStage, number>;
  sourceDistribution: Record<DealSource, number>;
  conflictCount: number;
  overdueCount: number;
}

export interface JBPFormData {
  title: string;
  type: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  objectives: string[];
  participants: { name: string; role: string; side: string }[];
  agenda: { time: string; topic: string }[];
}

export interface PartnerContact {
  salutation?: string;
  firstName: string;
  lastName: string;
  title: string;
  department?: string;
  phone: string;
  mobile: string;
  email: string;
  isPrimary: boolean;
}

export interface Partner {
  id: string;
  name: string;
  englishName?: string;
  logo: string;
  website?: string;
  tier: PartnerTier;
  status: PartnerStatus;
  type: PartnerType;
  lifecycleStage?: PartnerLifecycleStage;  // 生命周期阶段（操作流程）
  stageEnteredAt?: string;                // 进入当前阶段的时间
  healthScore?: number;                   // 健康度评分 0-100
  lastActivityAt?: string;                // 最后活跃时间

  // ── 关系深度生命周期（4阶段理念） ──
  maturityStage?: PartnerMaturityStage;      // 关系深度阶段：Transactional → Transitional → Relational → Symbiotic
  maturityStageEnteredAt?: string;           // 进入当前关系深度阶段的时间
  maturityDaysInCurrentStage?: number;       // 当前关系深度阶段已停留天数
  maturityHealthScore?: number;              // 关系深度健康度评分 0-100
  // 6 大维度细分指标（自动计算）
  maturityDimensions?: {
    dealActivity?: number;       // 商机活跃度 0-100
    capability?: number;          // 能力建设 0-100
    enablement?: number;          // 赋能参与 0-100
    collaboration?: number;       // 协同共创 0-100
    strategicAlignment?: number;  // 战略对齐 0-100
    systemIntegration?: number;   // 系统耦合 0-100
  };
  // 管理标记
  isMaturityAutoManaged?: boolean;           // 是否由系统自动管理成熟度
  nextPromotionReviewAt?: string;            // 下次晋级评审日期

  manager: string;
  location: string;
  region: string;
  province?: string;
  city?: string;
  district?: string;
  startDate: string;       // 批复时间
  applicationDate?: string; // 申请提交时间
  years: number;            // 自动计算: 当前年份 - startDate年份
  prevTier: PartnerTier;
  tags: string[];           // 批复时渠道经理添加
  winRate: number;          // 自动计算: 赢单/报备
  computedWinRate?: number; // 数据库动态计算赢率
  totalDeals?: number;     // 总商机数
  wonDeals?: number;       // 赢单数
  totalRevenue?: number;    // 总收入
  dataSource?: string;     // 数据来源标记：seed(演示数据) / real(真实数据)
  contacts: PartnerContact[];
  unifiedSocialCreditCode?: string;
  industry?: string;
  industries?: string[];
  vendorQualifications?: Record<string, string>;
  registeredAddress?: string;
  cooperationScope?: string;
  isCorePartner?: boolean;
  customerPortfolio?: any[];
}

export interface DashboardStats {
  activePartners: { value: number; growth: number };
  pipelineValue: number;
  revenueAchievement: number;
  leadsConversion: number;
}

export interface MatrixData {
  industry: string;
  region: string;
  count: number;
}

export interface NetworkNode {
  id: string;
  name: string;
  role: 'VAD' | 'VAR' | 'ISV' | 'SI';
  size: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  type: 'distribution' | 'collaboration';
}

// ── Activity ─────────────────────────────────────────
export interface Activity {
  id: string;
  type: 'signing' | 'registration' | 'visit' | 'milestone' | 'deal_update' | 'partner_approved' | 'deal_created' | 'mdf_submitted' | 'deal_won' | 'enablement_cert';
  title: string;
  description: string;
  date?: string;
  time?: string;
  timestamp?: string;
  user?: string;
  metadata?: Record<string, any>;
}

// ── Partner Timeline Event Types ─────────────────────
export type TimelineEventType = 
  | 'approved'           // 合作伙伴批复
  | 'tier_upgrade'       // 级别提升
  | 'tier_downgrade'     // 级别降级
  | 'first_deal'         // 第一个商机报备
  | 'first_order'        // 第一个订单下单
  | 'manager_change'     // 主要负责人变更
  | 'milestone'          // 合作里程碑
  | 'contract_renewal'   // 合同续签
  | 'contract_expiry'    // 合同到期
  | 'certification'      // 认证获得
  | 'mdf_approved'       // MDF审批通过
  | 'award'              // 获得奖项
  | 'custom';            // 自定义事件

export interface PartnerTimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  date: string;
  operator?: string;
  metadata?: {
    fromTier?: PartnerTier;
    toTier?: PartnerTier;
    dealId?: string;
    dealTitle?: string;
    fromManager?: string;
    toManager?: string;
    amount?: number;
    certificationName?: string;
    milestoneStage?: string;
  };
}

// ── Partner Detail Types ─────────────────────────────
export interface PartnerPipeline {
  registered: number;
  solution: number;
  commercial: number;
  won: number;
}

export interface MDFData {
  total: number;
  used: number;
  remaining: number;
  activities: {
    name: string;
    date: string;
    leads: number;
  }[];
}

export interface EnablementData {
  certifiedEngineers: number;
  specialists: number;
  expiryRiskCount: number;
  expiryDays: number;
}

export interface FollowUpTask {
  id: string;
  title: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  owner: string;
  category: 'Sales' | 'Marketing' | 'Enablement' | 'Operations';
}

export interface CooperationPlan {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Completed' | 'Pending';
  description: string;
  revenueTarget?: number;
  actualRevenue?: number;
}

export interface CooperationRecord {
  id: string;
  date: string;
  type: 'meeting' | 'training' | 'activity' | 'deal' | 'other';
  title: string;
  description: string;
  participants: string[];
  outcome: string;
}

export interface SubPartner {
  id: string;
  name: string;
  type: PartnerType;
  contactPerson: string;
  phone: string;
  status: 'Active' | 'Inactive';
}

export interface PartnerDetails extends Partner {
  pipeline: PartnerPipeline;
  mdf: MDFData;
  enablement: EnablementData;
  followUps: FollowUpTask[];
  topProjects: {
    name: string;
    amount: number;
    progress: number;
    closeDate: string;
  }[];
  cooperationPlans?: CooperationPlan[];
  cooperationRecords?: CooperationRecord[];
  subPartners?: SubPartner[];
  orgStructure?: any[];
  milestones?: any[];
  qbrRecords?: any[];
  activitiesLog?: any[];
  tierHistory?: any[];
  customerPortfolio?: any[];
  ecosystemPartners?: any[];
  strategyRecommendations?: any[];
  timelineEvents?: PartnerTimelineEvent[];
  category?: PartnerCategory;
  marketingActivities?: number;
  loginFrequency?: string;
  ticketResponseTime?: string;
  orderAmount?: number;
}

// ── MDF & Incentive Types ────────────────────────────
export interface MDFStats {
  annualQuota: number;
  quarterlyQuota: number;
  usedAmount: number;
  remainingAmount: number;
  conversionRate: number;
  activityDistribution: { type: string; percentage: number; count: number }[];
}

export interface MDFMonthlyActivity {
  id: string;
  name: string;
  type: string;
  date: string;
  status: 'Planning' | 'In Progress' | 'Completed' | 'Cancelled';
  budget: number;
  actualSpend: number;
  leadsGenerated: number;
  progress: number;
  // 扩展字段：线索质量与转化数据
  mql_count?: number;
  sql_count?: number;
  mqlCount?: number;
  sqlCount?: number;
  grade_a_leads?: number;
  grade_b_leads?: number;
  grade_c_leads?: number;
  new_logo_count?: number;
  new_logo_amount?: number;
  conversion_days?: number;
  follow_up_rate?: number;
  stale_leads?: number;
  sop_downloads?: number;
  dealsCreated?: number;
  dealsAmount?: number;
  expected_attendees?: number;
  newLogoCount?: number;
  newLogoAmount?: number;
  conversionDays?: number;
}

export interface IncentiveProgram {
  id: string;
  title: string;
  type?: string;
  quarter?: string;
  year?: number;
  trigger?: 'Pipeline Gap' | 'New Product' | 'Competitive' | 'Sales Acceleration';
  status: 'Active' | 'Upcoming' | 'Ended' | 'Planning';
  lifecycleStage?: string; // 生命周期阶段
  stageEnteredAt?: string; // 进入当前阶段时间
  daysInCurrentStage?: number; // 当前阶段停留天数
  healthScore?: number; // 健康度评分 0-100
  budgetUtilizationRate?: number; // 预算使用率
  roiRate?: number; // ROI
  payoutType?: 'Rebate' | 'Cash' | 'Points';
  totalBudget?: number;
  budget?: number;
  used?: number;
  remaining?: number;
  claimedAmount?: number;
  participantsCount?: number;
  description?: string;
  startDate: string;
  endDate: string;
  targetDeals?: number;
  registeredDeals?: number;
  conversionRate?: number;
  topPartners?: any[];
  currentMonthPerformance?: {
    target: number;
    rate: number;
    growth: number;
  };
}

export interface IncentiveStats {
  totalActivePrograms?: number;
  totalPayoutYTD?: number;
  avgParticipationRate?: number;
  topTrigger?: string;
  totalBudget?: number;
  totalUsed?: number;
  totalRemaining?: number;
  activePrograms?: number;
  topEarners?: any[];
  topPerformers?: any[];
}

// ── 激励政策管理类型 ──────────────────────────

// 年度激励预算
export interface AnnualIncentiveBudget {
  id: string;
  year: number;
  totalBudget: number;                    // 年度总预算
  q1Budget: number;                       // Q1预算
  q2Budget: number;                       // Q2预算
  q3Budget: number;                       // Q3预算
  q4Budget: number;                       // Q4预算
  totalUsed: number;                      // 已使用
  totalRemaining: number;                // 剩余
  status: 'draft' | 'approved' | 'in_progress' | 'completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 激励类型
export type IncentiveScope = 'global' | 'targeted';  // 全范围 / 定向
export type IncentiveStatus = 'draft' | 'pending' | 'approved';
export type IncentiveCategory = 'volume_rebate' | 'new_product' | 'competitive' | 'velocity' | 'loyalty' | 'training';

// 激励方向/策略
export type IncentiveDirection = 'expand_market' | 'defend_territory' | 'accelerate_sales' | 'retain_partners' | 'develop_capability';
export interface IncentiveDirectionConfig {
  direction: IncentiveDirection;          // 激励方向
  focusArea?: string;                     // 重点领域
  targetRegions?: string[];               // 目标区域
  targetTiers?: string[];                 // 目标伙伴级别
  priorityLevel: 'high' | 'medium' | 'low'; // 优先级
}

// 激励节奏/速度
export interface IncentivePace {
  expectedStartPace: number;              // 预期起始节奏 (%/月)
  expectedMidPace: number;                // 预期中期节奏
  expectedEndPace: number;                // 预期收尾节奏
  milestoneSchedule: {                      // 里程碑计划
    milestone: string;                     // 里程碑名称
    targetDate: string;                    // 目标日期
    targetValue: number;                   // 目标值
    weight: number;                        // 权重
  }[];
}

// 季度激励计划
export interface QuarterlyIncentivePlan {
  id: string;
  year: number;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  title: string;
  description?: string;
  category: IncentiveCategory;
  scope: IncentiveScope;                  // 全范围或定向
  targetPartnerIds?: string[];            // 定向激励时指定渠道商
  targetPartnerNames?: string[];          // 定向激励时指定渠道商名称
  totalBudget: number;
  approvedAmount?: number;                // 批复金额
  status: IncentiveStatus;
  planContent?: string;                   // 计划内容JSON
  
  // 方向设定
  direction?: IncentiveDirectionConfig;    // 往哪里跑
  
  // 时间安排 - 跑多久
  startDate: string;
  endDate: string;
  durationDays?: number;                   // 持续天数
  
  // 节奏设定 - 跑多快
  pace?: IncentivePace;
  actualPace?: number;                     // 实际节奏
  
  // 目标设定
  targets: IncentiveTarget[];
  
  // 阶梯奖励规则
  tierRules?: IncentiveTierRule[];
  
  // 定向规则
  targetingRules?: IncentiveTargetingRule[];
  
  // 执行追踪
  executions?: IncentiveExecution[];
  
  // 评估结果
  evaluation?: IncentiveEvaluation;
  
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
}

// 激励目标
export interface IncentiveTarget {
  metric: string;                         // 指标名称
  targetValue: number;                   // 目标值
  unit?: string;                          // 单位
  weight?: number;                        // 权重
  description?: string;
}

// 阶梯奖励规则
export interface IncentiveTierRule {
  id?: string;
  planId: string;
  tierOrder: number;                      // 阶梯序号
  minThreshold: number;                   // 最低阈值
  maxThreshold?: number;                  // 最高阈值（undefined表示无上限）
  rewardAmount: number;                   // 奖励金额
  rewardType: 'fixed' | 'percentage';     // 固定金额或百分比
  description?: string;
}

// 定向规则
export interface IncentiveTargetingRule {
  id?: string;
  planId: string;
  ruleType: 'region' | 'tier' | 'industry' | 'partner_type' | 'custom';
  operator: 'in' | 'not_in' | 'contains' | 'equals';
  values: string[];
  description?: string;
}

// 激励模板
export interface IncentiveTemplate {
  id: string;
  name: string;                           // 模板名称
  category: string;                       // 模板类别
  description?: string;
  icon?: string;                          // 图标标识
  isActive: boolean;
  config: any;                            // 完整的计划配置JSON
  defaultBudget: number;                  // 默认预算
  defaultDurationDays: number;            // 默认持续天数
  usageCount: number;                     // 使用次数
  avgRoi?: number;                        // 平均ROI
  createdAt: string;
  updatedAt: string;
}

// 审批步骤
export interface ApprovalStep {
  step: number;
  role: string;                           // 审批角色
  approver?: string;                      // 审批人
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  approvedAt?: string;
}

// 激励申请
export interface IncentiveApplication {
  id: string;
  planId: string;
  planTitle?: string;
  partnerId: string;
  partnerName: string;
  partnerTier?: string;
  metric: string;                         // 申请的指标
  claimedValue: number;                   // 申报数值
  payoutAmount: number;                   // 申请奖励金额
  relatedDeals?: { id: string; title: string; value: number }[];
  supportingDocuments?: { name: string; url: string }[];
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  currentStep: number;
  workflowSteps: ApprovalStep[];
  approvalHistory?: { step: number; action: string; operator: string; timestamp: string; comment?: string }[];
  approvedBy?: string;
  approvedAt?: string;
  invoiceNumber?: string;                 // 发票号码
  taxId?: string;                         // 纳税人识别号
  bankAccount?: string;                   // 银行账户信息
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

// 预算预警配置
export interface IncentiveBudgetAlert {
  id: string;
  planId: string;
  warningThreshold: number;               // 软性预警阈值 (0.9 = 90%)
  stopThreshold: number;                  // 硬性止损阈值 (1.0 = 100%)
  warningNotified: boolean;
  stopTriggered: boolean;
  lastCheckedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ROI追踪
export interface IncentiveROITracking {
  id: string;
  planId: string;
  planTitle?: string;
  totalPayout: number;                    // 总发放金额
  totalBudgetUsed: number;                // 总预算使用
  totalRevenue: number;                   // 关联订单总金额
  totalPipeline: number;                  // 关联Pipeline金额
  dealsCreated: number;                   // 创建商机数
  dealsWon: number;                       // 赢单数量
  roi: number;                            // ROI = total_revenue / total_payout
  pipelineContribution: number;           // Pipeline贡献率
  costPerDeal: number;                    // 单商机成本
  trackingPeriod: 'monthly' | 'quarterly' | 'yearly';
  periodStart: string;
  periodEnd: string;
  calculatedAt: string;
  createdAt: string;
  updatedAt: string;
}

// 伙伴参与追踪
export interface IncentiveParticipationTracking {
  id: string;
  planId: string;
  partnerId: string;
  partnerName: string;
  partnerTier?: string;
  partnerRegion?: string;
  partnerIndustry?: string;
  isParticipated: boolean;
  firstApplicationAt?: string;
  totalApplications: number;
  totalPayoutReceived: number;
  dealsRegistered: number;
  dealsWon: number;
  revenueContributed: number;
  createdAt: string;
  updatedAt: string;
}

// 结算记录
export interface IncentiveSettlementRecord {
  id: string;
  applicationId: string;
  planId: string;
  partnerId: string;
  partnerName?: string;
  settlementAmount: number;               // 结算金额
  settlementCurrency: string;
  invoiceNumber?: string;
  invoiceAmount?: number;
  invoiceDate?: string;
  taxRate: number;
  paymentMethod: 'bank_transfer' | 'online' | 'cash';
  bankName?: string;
  bankAccount?: string;
  accountName?: string;
  status: 'pending' | 'invoiced' | 'paid' | 'completed';
  voucherNumber?: string;
  settledAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 激励政策4阶段关系深度生命周期
// 设计期（Design & Alignment）→ 引导期（Guidance & Motivation）→
// 兑现期（Realization & Audit）→ 演进期（Evolution & Optimization）
// ─────────────────────────────────────────────────────────────────────────────
/** 激励4阶段 */
export type IncentiveMaturityStage =
  | 'DesignAlignment'       // 第一阶段：设计与对齐期（规则确立 - 吸引伙伴入局）
  | 'GuidanceMotivation'    // 第二阶段：引导与激活期（过程干预 - 按战略走）
  | 'RealizationAudit'      // 第三阶段：兑现与评估期（承诺履行 - 建立长久信任）
  | 'EvolutionOptimization';// 第四阶段：演进与重构期（战略共生 - 利益共同体）

/** 激励4支柱评分 */
export interface IncentiveMaturityPillarScores {
  identity: {
    score: number;        // 0-100：政策设计的战略对齐度、差异化程度
    evidence: string[];
    trend: 'up' | 'flat' | 'down';
  };
  value: {
    score: number;        // 0-100：毛利空间/能力溢价/长期分红结构设计
    evidence: string[];
    trend: 'up' | 'flat' | 'down';
  };
  management: {
    score: number;        // 0-100：规则清晰度/透明度、KBI引导效果、结算效率
    evidence: string[];
    trend: 'up' | 'flat' | 'down';
  };
  stickiness: {
    score: number;        // 0-100：伙伴续约率/客户终身价值奖励/联合投资机制
    evidence: string[];
    trend: 'up' | 'flat' | 'down';
  };
}

/** 激励健康度评估 */
export interface IncentiveMaturityHealth {
  planId: string;
  planTitle: string;
  planCategory: string;
  currentStage: IncentiveMaturityStage;
  currentStageLabel: string;
  daysInCurrentStage: number;
  overallScore: number;
  status: 'healthy' | 'monitoring' | 'at_risk' | 'critical';
  pillarScores: IncentiveMaturityPillarScores;
  promotionReadiness: {
    canPromote: boolean;
    nextStage: IncentiveMaturityStage;
    nextStageLabel: string;
    readinessPercentage: number;
    gapAnalysis: {
      pillar: 'identity' | 'value' | 'management' | 'stickiness';
      pillarLabel: string;
      currentValue: number;
      requiredValue: number;
      priority: 'high' | 'medium' | 'low';
      recommendation: string;
    }[];
  };
  riskAlerts: {
    type: 'misaligned_strategy' | 'complex_rules' | 'low_participation' |
            'budget_risk' | 'settlement_delay' | 'fraud_risk' |
            'low_roi' | 'missing_long_term_incentive' | 'stage_stagnation' |
            'no_differential_design' | 'kbi_missing' | 'no_rebate_reward' |
            'no_ltv_reward' | 'settlement_trust';
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    detail: string;
    action?: string;
  }[];
  incentiveMix: {
    cashReward: number;      // 金钱激励占比
    resourceReward: number;  // 资源激励占比（MDF/培训/技术支持）
    capabilityReward: number;// 能力激励占比（认证/职级/话语权）
    ltvReward: number;       // 长期价值激励占比（续约/终身客户奖励）
  };
  lastUpdated: string;
}

/** 激励阶段事件 */
export interface IncentiveMaturityEvent {
  id: string;
  planId: string;
  fromStage: IncentiveMaturityStage | null;
  toStage: IncentiveMaturityStage;
  eventDate: string;
  operator?: string;
  reason?: string;
  snapshot?: {
    pillarScoresAtEvent: IncentiveMaturityPillarScores;
    overallScore: number;
  };
}

/** 激励4阶段配置 */
export interface IncentiveMaturityStageInfo {
  stage: IncentiveMaturityStage;
  label: string;
  shortLabel: string;
  description: string;
  identityPosition: string;
  benefitDriver: string;
  managementFocus: string;
  stabilityFoundation: string;
  avgDaysInStage: number;
  minDaysBeforePromotion: number;
  keyIncentiveTools: string[];  // 典型激励工具
  successMarkers: string[];     // 关键成功标志
}

export const INCENTIVE_MATURITY_STAGE_CONFIG: Record<IncentiveMaturityStage, IncentiveMaturityStageInfo> = {
  'DesignAlignment': {
    stage: 'DesignAlignment',
    label: '设计期',
    shortLabel: '利益对齐',
    description: '规则确立：解决"如何吸引伙伴入局"的问题。标准化 → 行业差异化。关注利润空间。',
    identityPosition: '规则制定者与接受者：政策是厂商吸引伙伴的"敲门砖"',
    benefitDriver: '获客红利：首单激励、开户奖励、高毛利空间',
    managementFocus: '清晰度与透明度：规则易懂、门槛合理、计算逻辑闭环',
    stabilityFoundation: '预期收益：伙伴对未来利益的可预见性',
    avgDaysInStage: 30,
    minDaysBeforePromotion: 3,
    keyIncentiveTools: ['毛利差价', '签约奖励', '首单激励', '开户奖金'],
    successMarkers: [
      '激励计划已发布（approved）',
      '明确的目标/门槛/奖励结构',
      '伙伴注册参与率 ≥ 40%',
      '有完整的规则说明文档',
      '支持行业/区域差异化版本',
    ],
  },
  'GuidanceMotivation': {
    stage: 'GuidanceMotivation',
    label: '引导期',
    shortLabel: '行为驱动',
    description: '过程干预：解决"如何让伙伴按照我的战略走"的问题。从公司级激励下沉到员工级激励。',
    identityPosition: '行为引导器：激励对象从"公司"下沉到"员工"（销售/工程师/管理者）',
    benefitDriver: '能力溢价：非金钱激励占比上升（培训抵用券、MDF、技术专家优先支持）',
    managementFocus: '关键行为激励（KBI）：培训、商机报备、联合方案、认证等行为指标',
    stabilityFoundation: '专业认可：伙伴"变强"的获得感',
    avgDaysInStage: 60,
    minDaysBeforePromotion: 15,
    keyIncentiveTools: ['培训奖励', '认证补贴', 'MDF活动基金', '销售个人开单奖', '工程师认证奖'],
    successMarkers: [
      '有明确的KBI（关键行为指标）追踪',
      '伙伴培训参与率 ≥ 60%',
      '非金钱激励（资源/能力）占比 ≥ 30%',
      '个人级激励已落地',
      '商机报备数量提升',
    ],
  },
  'RealizationAudit': {
    stage: 'RealizationAudit',
    label: '兑现期',
    shortLabel: '价值确认',
    description: '承诺履行：解决"如何建立长久信任"的问题。准时、准确的返利结算。',
    identityPosition: '信用试金石：伙伴从"规则执行者"变成"利润分享者"',
    benefitDriver: '实得利益：返利（Rebate）按时发放、MDF核销顺畅、无合规扣款',
    managementFocus: '效率与合规：PRM自动化结算、反舞弊审计、激励发放及时性',
    stabilityFoundation: '结算信任：钱的问题不掉链子，忠诚度固化',
    avgDaysInStage: 45,
    minDaysBeforePromotion: 10,
    keyIncentiveTools: ['季度返利（Rebate）', '商机保护奖励', 'MDF核销流程', '自动化结算系统'],
    successMarkers: [
      '按时结算率 ≥ 95%',
      '伙伴对结算过程满意度 ≥ 80%',
      '自动计算代替人工计算',
      '无重大合规扣款事件',
      '结算周期 ≤ 15 个工作日',
    ],
  },
  'EvolutionOptimization': {
    stage: 'EvolutionOptimization',
    label: '演进期',
    shortLabel: '战略共生',
    description: '利益共同体：解决"如何应对市场变化，共同进退"的问题。动态激励，长期分红。',
    identityPosition: '战略杠杆：伙伴从"挣钱者"变成"投资商"。联合投资计划。',
    benefitDriver: '长期增长分红：续约分成（SaaS）、客户终身价值奖励、联合研发分润',
    managementFocus: '预测性管理：动态调整激励方向（市场差时增"保命钱"，市场好时增"竞争奖"）',
    stabilityFoundation: '利益深度耦合：双方在业务底层、客户资产深度交织',
    avgDaysInStage: 60,
    minDaysBeforePromotion: 0,
    keyIncentiveTools: ['续约分成', '客户终身价值（LTV）奖励', '联合研发分润', '战略级股权/期权', '市场应急调节机制'],
    successMarkers: [
      '续约激励已落地',
      '至少有1个伙伴的联合投资计划在进行',
      'LTV奖励机制上线',
      '有市场响应性的动态调节机制（例如应急奖金池）',
      '激励年度复盘并根据市场反馈调整方案',
    ],
  },
};

/** 操作状态 → 激励4阶段的映射 */
export const INCENTIVE_OPERATION_TO_MATURITY_MAP: Record<string, IncentiveMaturityStage> = {
  'draft': 'DesignAlignment',        // 草稿 → 设计期
  'pending': 'DesignAlignment',      // 待审批 → 设计期
  'Active': 'GuidanceMotivation',    // 活跃 → 引导期
  'Upcoming': 'DesignAlignment',     // 即将开始 → 设计期（等待中）
  'in_progress': 'RealizationAudit', // 进行中 → 兑现期
  'Planning': 'DesignAlignment',     // 规划中 → 设计期
  'Ended': 'EvolutionOptimization',  // 已结束 → 演进期
  'completed': 'EvolutionOptimization', // 完成 → 演进期
  'approved': 'GuidanceMotivation',  // 已批复 → 引导期
};

// 激励执行记录
export interface IncentiveExecution {
  id: string;
  planId: string;
  partnerId: string;
  partnerName: string;
  partnerTier?: string;
  
  // 执行数据
  achievedValue: number;                  // 达成值
  metric: string;                         // 对应指标
  payoutAmount: number;                   // 发放金额
  payoutStatus: 'pending' | 'approved' | 'paid' | 'rejected';
  
  // 关联
  relatedDeals?: string[];                // 关联商机ID
  relatedLeads?: string[];                // 关联线索ID
  
  submittedAt: string;
  approvedAt?: string;
  paidAt?: string;
  notes?: string;
}

// 激励评估
export interface IncentiveEvaluation {
  id: string;
  planId: string;
  
  // 考核标准 - 达成率
  participationRate: number;              // 参与率
  achievementRate: number;                 // 整体目标达成率
  perMetricAchievement?: {                // 各指标达成率
    metric: string;
    targetValue: number;
    actualValue: number;
    achievementRate: number;
  }[];
  
  // 考核标准 - 投入产出比
  roi?: number;                           // ROI (投入产出比)
  totalPayout: number;                    // 总发放金额
  totalRevenue?: number;                   // 带来的总收入
  pipelineCreated?: number;               // 创建的商机数
  pipelineValue?: number;                  // 商机金额
  costPerDeal?: number;                   // 单商机成本
  revenuePerIncentive?: number;           // 每元激励产出
  
  // 考核标准 - 公平性
  fairnessMetrics?: {
    distributionGini?: number;            // 分配基尼系数 (0-1, 越小越公平)
    topPartnerShare?: number;              // 头部伙伴占比
    bottomPartnerShare?: number;           // 尾部伙伴占比
    eligiblePartnersCount?: number;        // 符合资格伙伴数
    participatedPartnersCount?: number;    // 实际参与伙伴数
    participationFairnessScore?: number;   // 参与公平性评分 (1-10)
  };
  
  // 考核标准 - 满意度
  satisfactionMetrics?: {
    overallSatisfaction?: number;          // 整体满意度 (1-10)
    designSatisfaction?: number;           // 方案设计满意度
    processSatisfaction?: number;          // 执行流程满意度
    resultSatisfaction?: number;           // 结果满意度
    wouldRecommend?: boolean;              // 是否愿意推荐
    NPS?: number;                         // 净推荐值 (-100 ~ 100)
    comments?: string[];                   // 典型评价
  };
  
  // 各维度评分 (1-5)
  scores: {
    design: number;                       // 方案设计
    execution: number;                     // 执行力
    results: number;                       // 效果
    satisfaction: number;                  // 满意度
  };
  
  summary?: string;                       // 评估总结
  feedback?: string;                      // 改进建议
  
  evaluatedAt: string;
  evaluator?: string;
}

// 激励政策统计
export interface IncentivePolicyStats {
  annualBudget: number;
  quarterlyBudgets: { q: string; budget: number; used: number; }[];
  activePlansCount: number;
  totalPayoutYTD: number;
  avgAchievementRate: number;
  topPerformers: { partnerId: string; partnerName: string; earnings: number; }[];
}

// 激励成果 - 用于Pipeline转化
export interface IncentiveResult {
  id: string;
  planId: string;
  planTitle: string;
  partnerId: string;
  partnerName: string;
  metric: string;
  achievedValue: number;
  payoutAmount: number;
  convertedToDeal: boolean;
  dealId?: string;
  convertedAt?: string;
}

// ── 营销活动管理类型 ────────────────────────

// 活动执行阶段
export type CampaignPhase = 
  | 'planning'      // 计划阶段
  | 'preparing'     // 准备阶段
  | 'executing'     // 执行阶段
  | 'follow_up'     // 跟进阶段
  | 'evaluating'   // 评估阶段
  | 'closed';      // 已结束

// 活动状态
export type CampaignStatus = 
  | 'draft'         // 草稿
  | 'pending'       // 待审批
  | 'approved'      // 已批复
  | 'in_progress'   // 进行中
  | 'completed'     // 已完成
  | 'cancelled';    // 已取消

// 活动类型
export type CampaignType = 
  | 'vendor_self'   // 厂商自办
  | 'partner_joint' // 合作伙伴合办
  | 'mdf';          // MDF活动

// 活动目标类型
export type CampaignGoal = 
  | 'awareness'     // 打声量 - 提升品牌知名度、市场影响力
  | 'conversion'    // 做转化 - 产生商机、促进销售转化
  | 'engagement';   // 提粘性 - 增强客户粘性、提升忠诚度

// 活动目标及权重配置（带目标值）
export interface GoalTarget {
  metric: string;        // 指标名称
  targetValue: number;    // 目标值
  unit?: string;         // 单位（如：人、次、元、%等）
}

export interface CampaignGoalWeight {
  goal: CampaignGoal;
  weight: number;   // 权重百分比 (0-100)
  description?: string;
  targets?: GoalTarget[];  // 该目标下的指标目标值
}

// 活动主机类型
export type HostType = 'vendor' | 'partner';

// 参会者来源
export type AttendeeSource = 
  | 'invitation'    // 邀请
  | 'registration'  // 报名
  | 'walk_in';      // 现场登记

// 参会者类型
export type AttendeeType = 
  | 'prospect'      // 潜在客户
  | 'existing_customer' // 现有客户
  | 'partner';      // 合作伙伴

// 积分来源类型
export type PointSource = 
  | 'registration'  // 报名
  | 'check_in'       // 签到
  | 'question'       // 提问
  | 'lottery'        // 抽奖
  | 'sharing'        // 分享
  | 'feedback';      // 反馈

// 活动评估维度
export interface CampaignEvaluationDimension {
  name: string;
  score: number;        // 1-5分
  weight: number;        // 权重
  comments?: string;
}

// 活动评估
export interface CampaignEvaluation {
  id: string;
  campaignId: string;
  overallQuality: number;          // 整体质量 1-5
  dimensions: CampaignEvaluationDimension[];
  
  // 转化相关指标
  conversionRate: number;          // 转化率百分比
  leadConversionRate: number;     // 线索转化率
  dealConversionRate: number;     // 商机转化率
  
  // 参会者满意度
  attendeeSatisfaction: number;    // 参会者满意度
  
  // ROI
  roi: number;                     // 投资回报率
  
  // 打声量指标 (awareness)
  awarenessMetrics?: {
    brandExposure: number;         // 品牌曝光量（媒体报道、社交媒体传播等）
    mediaCoverage: number;         // 媒体报道数量
    socialMediaReach: number;      // 社交媒体触达人数
    socialMediaEngagement: number; // 社交媒体互动量（点赞、评论、转发）
    pressReleaseCount: number;     // 新闻稿发布数量
    influencerEngagement: number;  // KOL/意见领袖参与数量
    brandAwarenessScore: number;   // 品牌知名度提升评分 (1-5)
    marketImpactScore: number;     // 市场影响力评分 (1-5)
  };
  
  // 做转化指标 (conversion)
  conversionMetrics?: {
    leadsGenerated: number;        // 产生线索数量
    qualifiedLeads: number;        // 有效线索数量
    opportunitiesCreated: number;  // 创建商机数量
    pipelineValue: number;         // Pipeline金额
    dealsClosed: number;           // 成交数量
    dealsValue: number;            // 成交金额
    leadToOpportunityRate: number; // 线索转商机率
    opportunityToDealRate: number; // 商机转成交率
    costPerLead: number;           // 单线索成本
    costPerDeal: number;           // 单成交成本
    conversionEfficiencyScore: number; // 转化效率评分 (1-5)
  };
  
  // 提粘性指标 (engagement)
  engagementMetrics?: {
    repeatAttendees: number;       // 重复参会人数
    npsScore: number;              // NPS评分
    customerRetentionRate: number; // 客户留存率
    activeUserIncrease: number;    // 活跃用户增长数
    productUsageIncrease: number;  // 产品使用增长率
    customerFeedbackScore: number; // 客户反馈评分 (1-5)
    loyaltyScore: number;          // 客户忠诚度评分 (1-5)
    engagementDepth: number;       // 参与深度评分 (1-5)
  };
  
  // 综合评估
  strengths: string;               // 优点
  improvements: string;             // 改进点
  lessonsLearned?: string;         // 经验教训
  recommendations?: string;        // 后续建议
  
  evaluator: string;               // 评估人
  evaluatedAt: string;             // 评估时间
}

// 活动阶段记录
export interface CampaignPhaseRecord {
  phase: CampaignPhase;
  startDate?: string;
  endDate?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  notes?: string;
  deliverables?: string[];         // 交付物
}

// 活动参会者
export interface CampaignAttendee {
  id: string;
  campaignId: string;
  name: string;
  company: string;
  position?: string;
  phone?: string;
  email?: string;
  source: AttendeeSource;
  attendeeType: AttendeeType;
  registeredAt: string;
  checkedInAt?: string;
  checkedIn: boolean;
  totalPoints: number;
  status: 'registered' | 'checked_in' | 'no_show' | 'cancelled';
  interestTopics?: string[];       // 感兴趣的主题
  followUpStatus?: 'pending' | 'in_progress' | 'completed';
  dealCreated?: boolean;
  dealId?: string;
}

// 活动报名
export interface CampaignRegistration {
  id: string;
  campaignId: string;
  attendeeId?: string;
  attendeeName: string;
  attendeeCompany: string;
  attendeePhone: string;
  attendeeEmail?: string;
  registrationChannel?: string;    // 报名渠道
  registrationTime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  source?: AttendeeSource;
}

// 活动积分记录
export interface CampaignPointRecord {
  id: string;
  campaignId: string;
  attendeeId: string;
  attendeeName: string;
  source: PointSource;
  points: number;
  description?: string;
  createdAt: string;
}

// 活动商机关联
export interface CampaignDealLink {
  id: string;
  campaignId: string;
  dealId: string;
  attendeeId: string;
  attendeeName: string;
  linkedAt: string;
  status: 'potential' | 'qualified' | 'converted' | 'lost';
}

// 活动邀请
export interface CampaignInvitation {
  id: string;
  campaignId: string;
  inviteeName: string;
  inviteeCompany: string;
  inviteeEmail?: string;
  inviteePhone?: string;
  invitationCode?: string;
  invitedAt: string;
  respondedAt?: string;
  response?: 'accepted' | 'declined' | 'maybe';
  registered: boolean;
}

// 活动小程序配置
export interface CampaignMiniAppConfig {
  id: string;
  campaignId: string;
  enabled: boolean;
  allowRegistration: boolean;
  allowCheckIn: boolean;
  allowQuestions: boolean;
  allowLottery: boolean;
  allowSharing: boolean;
  allowFeedback: boolean;
  signupPoints: number;            // 报名积分
  checkInPoints: number;          // 签到积分
  questionPoints: number;           // 提问积分
  lotteryPoints: number;           // 抽奖积分
  sharingPoints: number;           // 分享积分
  feedbackPoints: number;          // 反馈积分
  maxAttendees?: number;           // 最大参会人数
  registrationDeadline?: string;   // 报名截止时间
}

// 年度营销预算
export interface AnnualMarketingBudget {
  id: string;
  year: number;
  totalBudget: number;           // 年度总预算
  totalSpent: number;            // 已支出
  remaining: number;             // 剩余
  status: BudgetStatus;          // 预算状态
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  quarterlyBudgets?: QuarterlyBudget[];  // 季度预算明细
  categoryBudgets?: CategoryBudget[];    // 分类预算明细
}

// 季度预算
export interface QuarterlyBudget {
  id: string;
  annualBudgetId: string;
  quarter: string;                // Q1, Q2, Q3, Q4
  allocatedBudget: number;        // 分配预算
  spent: number;                  // 已支出
  remaining: number;              // 剩余
  campaignCount: number;          // 活动数量
  expectedAttendees: number;      // 预期参会人数
  actualAttendees: number;        // 实际参会人数
  createdAt: string;
  updatedAt: string;
}

// 活动类别预算
export interface CategoryBudget {
  id: string;
  annualBudgetId: string;
  category: string;               // 活动类别
  allocatedBudget: number;        // 分配预算
  spent: number;                  // 已支出
  remaining: number;              // 剩余
  campaignCount: number;          // 活动数量
}

// 预算状态
export type BudgetStatus = 'draft' | 'pending' | 'approved' | 'locked';

// 营销活动
export interface MarketingCampaign {
  id: string;
  name: string;
  type: CampaignType;
  hostType: HostType;
  year: number;
  quarter: string;
  category?: string;              // 活动类别：线下峰会、线下沙龙、Webinar等
  region?: string;
  city?: string;
  
  // 预算信息
  budget: number;
  actualSpend: number;
  approvedAmount?: number;
  
  // 时间信息
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  
  // 参会者信息
  expectedAttendees: number;
  actualAttendees: number;
  registeredCount: number;
  checkedInCount: number;
  
  // 状态和阶段
  status: CampaignStatus;
  currentPhase: CampaignPhase;
  phaseRecords?: CampaignPhaseRecord[];
  
  // 关联信息
  partnerId?: string;             // 如果是合办活动，关联合作伙伴
  partnerName?: string;
  responsiblePerson?: string;
  
  // 描述和目标
  description?: string;
  goals?: CampaignGoalWeight[];   // 活动目标及权重配置
  primaryGoal?: CampaignGoal;     // 主要目标
  expectedOutputs?: string;
  
  // 评估信息
  evaluation?: CampaignEvaluation;
  hasEvaluation: boolean;
  
  // 小程序配置
  miniAppConfig?: CampaignMiniAppConfig;
  
  // 商机转化
  leadsGenerated: number;
  dealsCreated: number;
  dealsValue: number;
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
  createdBy?: string;

  // ── 市场活动关系深度生命周期字段 ──
  maturityStage?: MarketingMaturityStage;  // 关系深度阶段
  maturityHealthScore?: number;              // 4支柱综合评分 0-100
  pillarScoreIdentity?: number;              // 身份支柱评分
  pillarScoreValue?: number;                 // 价值支柱评分
  pillarScoreManagement?: number;            // 管理支柱评分
  pillarScoreStickiness?: number;            // 粘性支柱评分
  maturityStatus?: 'healthy' | 'monitoring' | 'at_risk' | 'critical';
  maturityLastUpdated?: string;               // 最近评估时间
}

// ─────────────────────────────────────────────────────────────────────────────
// 市场活动4阶段关系深度生命周期（与伙伴/商机 4支柱架构一致）
// ─────────────────────────────────────────────────────────────────────────────
/**
 * 市场活动4阶段
 * 策划期(Alignment) → 赋能期(Co-creation) → 执行期(Execution) → 闭环期(Optimization)
 */
export type MarketingMaturityStage =
  | 'Alignment'      // 第一阶段：战略对齐与策划期（目标共识）
  | 'CoCreation'     // 第二阶段：内容共创与赋能期（能力准备）
  | 'Execution'      // 第三阶段：联合执行与捕获期（协作爆发）
  | 'Optimization';  // 第四阶段：评估审计与循环期（价值闭环）

/** 市场活动4阶段配置信息 */
export interface MarketingMaturityStageInfo {
  stage: MarketingMaturityStage;
  label: string;           // 中文标签
  shortLabel: string;      // 简短标签
  description: string;     // 阶段描述
  identityPosition: string;  // 身份定位
  benefitDriver: string;   // 利益驱动
  managementFocus: string; // 管理重心
  stabilityFoundation: string;  // 稳定性基石
  avgDaysInStage: number;  // 平均停留天数
  minDaysBeforePromotion: number;  // 最低晋级天数
  successMarkers: string[];  // 关键成功标志
}

/** 操作阶段到4阶段的映射 */
export const MARKETING_OPERATION_TO_MATURITY_MAP: Record<CampaignPhase, MarketingMaturityStage> = {
  'planning':    'Alignment',   // 计划阶段 → 战略对齐与策划期
  'preparing':   'CoCreation',  // 准备阶段 → 内容共创与赋能期
  'executing':   'Execution',   // 执行阶段 → 联合执行与捕获期
  'follow_up':   'Optimization',// 跟进阶段 → 价值复盘
  'evaluating':  'Optimization',// 评估阶段 → 价值闭环
  'closed':      'Optimization',// 已结束 → 价值闭环
};

/** 市场活动4支柱评分 */
export interface MarketingMaturityPillarScores {
  identity: {
    score: number;  // 0-100：战略对齐度、共同发起者身份的确立
    evidence: string[];
    trend: 'up' | 'flat' | 'down';
  };
  value: {
    score: number;  // 0-100：内容共创/品牌溢价/联合方案价值
    evidence: string[];
    trend: 'up' | 'flat' | 'down';
  };
  management: {
    score: number;  // 0-100：MDF预算管理/审批流程/现场协同效率
    evidence: string[];
    trend: 'up' | 'flat' | 'down';
  };
  stickiness: {
    score: number;  // 0-100：线索转化/ROI闭环/案例沉淀
    evidence: string[];
    trend: 'up' | 'flat' | 'down';
  };
}

/** 市场活动关系深度健康评估 */
export interface MarketingMaturityHealth {
  campaignId: string;
  campaignName: string;
  partnerName: string;
  campaignType: string;

  currentStage: MarketingMaturityStage;
  currentStageLabel: string;
  daysInCurrentStage: number;

  overallScore: number;
  status: 'healthy' | 'monitoring' | 'at_risk' | 'critical';

  pillarScores: MarketingMaturityPillarScores;

  promotionReadiness: {
    canPromote: boolean;
    nextStage: MarketingMaturityStage;
    nextStageLabel: string;
    readinessPercentage: number;
    gapAnalysis: {
      pillar: 'identity' | 'value' | 'management' | 'stickiness';
      pillarLabel: string;
      currentValue: number;
      requiredValue: number;
      priority: 'high' | 'medium' | 'low';
      recommendation: string;
    }[];
  };

  riskAlerts: {
    type: 'mdf_budget_gap' | 'partner_disengagement' | 'no_joint_solution' |
            'low_attendance_expectation' | 'lead_quality_risk' | 'roi_gap' |
            'settlement_delay' | 'missing_case_study' | 'stage_stagnation';
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    detail: string;
    action?: string;
  }[];

  milestones: { label: string; completed: boolean; completedAt?: string }[];

  /** 活动ROI预估 */
  estimatedROI: number;

  lastUpdated: string;
}

/** 市场活动阶段演进事件 */
export interface MarketingMaturityEvent {
  id: string;
  campaignId: string;
  fromStage: MarketingMaturityStage | null;
  toStage: MarketingMaturityStage;
  eventDate: string;
  operator?: string;
  reason?: string;
  notes?: string;
  snapshot?: {
    pillarScoresAtEvent: MarketingMaturityPillarScores;
    overallScore: number;
    budgetUtilization: number;
    daysInPreviousStage: number;
  };
}

/** 市场活动4阶段完整配置 */
export const MARKETING_MATURITY_STAGE_CONFIG: Record<MarketingMaturityStage, MarketingMaturityStageInfo> = {
  'Alignment': {
    stage: 'Alignment',
    label: '策划期',
    shortLabel: '战略对齐',
    description: '意愿匹配：解决"为什么办、为谁办、钱谁出"的问题。MDF申请与战略目标对齐。',
    identityPosition: '共同发起者：从"你出钱我办事"转向"我们共同开拓市场"',
    benefitDriver: '获客成本对齐：ROI预估、MDF投入比例、预期线索数量与品牌曝光',
    managementFocus: '准入与预算审批：活动目标是否符合年度战略？伙伴执行能力是否匹配？MDF申请流程合规？',
    stabilityFoundation: '共同目标：双方对市场机会点的共识是此阶段最强纽带',
    avgDaysInStage: 21,
    minDaysBeforePromotion: 3,
    successMarkers: [
      'MDF预算申请已获批',
      '明确了活动目标（品牌/转化/粘性）',
      '伙伴已确认参与并提供资源',
      '活动时间地点已定',
      '关键决策人达成共识',
    ],
  },
  'CoCreation': {
    stage: 'CoCreation',
    label: '赋能期',
    shortLabel: '内容共创',
    description: '素材与能力的交织：解决"拿什么打动客户"的问题。厂商产品力 + 伙伴行业理解力 = 联合方案。',
    identityPosition: '联合价值传递者：将厂商的产品力与伙伴的本地服务/行业理解力融合成新方案',
    benefitDriver: '品牌溢价：伙伴借厂商的势（品牌大旗），厂商借伙伴的力（客户连接点）',
    managementFocus: '物料赋能与标准统一：联合LOGO PPT模板、短视频素材、宣讲培训',
    stabilityFoundation: '知识/资源沉淀：共同打磨方案的过程中建立深层内容耦合',
    avgDaysInStage: 30,
    minDaysBeforePromotion: 7,
    successMarkers: [
      '联合方案PPT已定稿',
      '有至少1份行业案例/标杆客户',
      '伙伴销售已完成宣讲培训',
      '短视频/社交媒体素材已准备',
      '活动宣传页/报名页已上线',
    ],
  },
  'Execution': {
    stage: 'Execution',
    label: '执行期',
    shortLabel: '线索捕获',
    description: '协作爆发：活动从"花钱"转向"赚钱"的关键节点。客户面对的是统一的服务体系。',
    identityPosition: '统一的作战方阵：客户面对的是完整服务体系，而非互相推诿的两家公司',
    benefitDriver: '高质量线索（Leads）：现场签到率、有效互动率、即时商机报备数',
    managementFocus: '现场协同与流程监控：数字化扫码获客、线索实时分配、社交媒体同步发声',
    stabilityFoundation: '即时成就感：活动现场的火爆与客户正向反馈极大增强伙伴信心',
    avgDaysInStage: 7,
    minDaysBeforePromotion: 1,
    successMarkers: [
      '实际签到率 ≥ 70%（相对于报名数）',
      '现场线索已录入CRM系统',
      '当天完成联合方案宣讲',
      '客户互动反馈正面',
      '社交媒体曝光已达预期 KPI',
    ],
  },
  'Optimization': {
    stage: 'Optimization',
    label: '闭环期',
    shortLabel: '价值复盘',
    description: '复盘与反哺：决定下一场活动是否还能合作的关键阶段。从单场合作演进为长期年度计划。',
    identityPosition: '成熟的区域市场主导者：从"单场活动合作"演进为"长期区域市场年度计划"',
    benefitDriver: 'ROI确认：MDF核销、线索转化实际销售贡献、客户数据库扩充',
    managementFocus: '绩效审计与奖励：KPI定量评分、MDF报销支付、优秀案例提炼与推广',
    stabilityFoundation: '数据共生与再投入：共享线索池（Shared Lead Pool），形成"投入-产出-再投入"良性循环',
    avgDaysInStage: 14,
    minDaysBeforePromotion: 0,
    successMarkers: [
      '活动 KPI 报告已完成（签到率/线索数/ROI）',
      '至少产生 3 个有效商机报备',
      'MDF核销流程已启动',
      '已发布标杆案例（Case Study）',
      '下一场活动或年度计划已在讨论中',
    ],
  },
};

// 季度活动统计
export interface QuarterlyCampaignStats {
  year: number;
  quarter: string;
  totalActivities: number;
  vendorSelfActivities: number;
  partnerJointActivities: number;
  mdfActivities: number;
  
  totalBudget: number;
  totalSpend: number;
  budgetUtilizationRate: number;
  
  totalExpectedAttendees: number;
  totalActualAttendees: number;
  attendanceRate: number;
  
  totalLeads: number;
  leadsConversionRate: number;
  
  totalDeals: number;
  dealsValue: number;
  dealsConversionRate: number;
  
  avgQualityScore: number;
  avgSatisfaction: number;
}

// 活动阶段任务
export interface CampaignPhaseTask {
  id: string;
  campaignId: string;
  phase: CampaignPhase;
  title: string;
  description?: string;
  dueDate?: string;
  assignee?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  completedAt?: string;
  order: number;
}

// 活动反馈
export interface CampaignFeedback {
  id: string;
  campaignId: string;
  attendeeId?: string;
  attendeeName: string;
  attendeeCompany?: string;
  rating: number;                  // 1-5分
  content?: string;
  submittedAt: string;
  isAnonymity: boolean;
}

// 活动提问
export interface CampaignQuestion {
  id: string;
  campaignId: string;
  attendeeId?: string;
  attendeeName: string;
  content: string;
  isAnswered: boolean;
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
  upvotes: number;
  createdAt: string;
}

// ── Cockpit / Dashboard Types ────────────────────────
export interface AchievementData {
  current: number;
  target: number;
  rate: number;
}

export interface TimeSeriesMetric {
  metric_name: string;
  current_value: number;
  total_partners?: number;
  yoy: number;
  qoq: number;
  mom: number;
  linear_rate: number;
  achievements: {
    monthly: AchievementData;
    quarterly: AchievementData;
    yearly: AchievementData;
  };
  active_split?: {
    order_placing: { value: number; target: number; rate: number; yoy: number; qoq: number };
    leads_reporting: { value: number; target: number; rate: number; yoy: number; qoq: number };
    pmdf_partners: { value: number; target: number; rate: number; yoy: number; qoq: number };
    incentive_participants: { value: number; target: number; rate: number; yoy: number; qoq: number };
  };
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
  marketing_details?: {
    pmdf_utilization: number;
    incentive_participation: number;
    roi_index: number;
    campaigns: { name: string; status: 'active' | 'completed'; budget: number }[];
  };
  strategic_revenue?: {
    achievement_amount: number;
    forecast_landing: number;
    pipeline_multiplier: number;
    forces: {
      coverage: 'healthy' | 'at_risk';
      activity: 'healthy' | 'at_risk';
      capability: 'healthy' | 'at_risk';
      will: 'healthy' | 'at_risk';
    };
    linearity_data: { month: string; plan: number; actual: number }[];
  };
  dimensional_achievements?: {
    type: string;
    data: {
      name: string;
      current: number;
      target: number;
      rate: number;
      yoy?: number;
      qoq?: number;
      contribution_percent?: number;
      activity_rate?: number;
      new_recruits?: number;
      segment_tag?: 'Growth' | 'Harvesting' | 'Stable' | 'Risk';
      health_status?: 'healthy' | 'at_risk' | 'critical';
      power_scores?: {
        coverage: number;
        activity: number;
        contribution: number;
        capability: number;
      };
      sub_metrics?: {
        label: string;
        value: string | number;
        status?: 'success' | 'warning' | 'error';
        trend?: 'up' | 'down' | 'stable';
      }[];
      white_space_analysis?: {
        region: string;
        potential: string;
        gap: string;
      }[];
      analysis?: string;
      suggestion?: string;
    }[];
  }[];
  marketing_overview?: {
    activities: {
      completed: number;
      planned: number;
      categories: { label: string; value: number }[];
      yoy: number;
      mom: number;
    };
    yield: {
      attendance: number;
      leads: number;
      pipeline_gen: number;
      yoy_amount: number;
      mom_amount: number;
      target_rate: number;
    };
    incentives: {
      active_programs: number;
      payout_rate: number;
      revenue_contribution: number;
      yoy_participation: number;
      mom_participation: number;
      budget_consumption: number;
    };
    certification: {
      new_experts: number;
      target_experts: number;
      core_product_coverage: number;
      expiry_warning_count: number;
    };
  };
  reporting_overview?: {
    pipeline: {
      total_count: number;
      total_amount: number;
      target_achievement: number;
      yoy: number;
      mom: number;
    };
    approval: {
      submitted: number;
      approved: number;
      rejected: number;
      approval_rate: number;
      yoy_approved: number;
      mom_approved: number;
    };
    attribution: {
      sales_driven: number;
      pmdf_driven: number;
      incentive_driven: number;
      yoy: { sales: number; pmdf: number; incentive: number };
      mom: { sales: number; pmdf: number; incentive: number };
    };
    tier_contribution: {
      platinum: number;
      gold: number;
      silver: number;
      registered: number;
      yoy_active: number;
      mom_active: number;
    };
  };
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
    tier_funnel: { tier: string; count: number; percentage: number }[];
    contribution_mix: {
      top_percent: number;
      revenue_percent: number;
    };
    health_radar: {
      coverage: number;
      activity: number;
      capability: number;
      will: number;
    };
    regional_coverage: {
      region: string;
      partner_count: number;
      city_count: number;
      new_cities: string[];
    }[];
  };
  monthly_data: { month: string; value: number; qoq: number }[];
}

export interface AIInsight {
  type: 'trend' | 'risk' | 'opportunity';
  title: string;
  content: string;
  actionLabel: string;
  actionId: string;
}

export interface CockpitData {
  revenue: TimeSeriesMetric;
  activePartners: TimeSeriesMetric;
  pipeline: TimeSeriesMetric;
  leadsConversion: TimeSeriesMetric;
  marketing: TimeSeriesMetric;
  insights: AIInsight[];
}

export interface GlobalConfig {
  sections: {
    revenueAlignment: boolean;
    partnershipMatrix: boolean;
    ecosystemNetwork: boolean;
    mdfEfficiency: boolean;
  };
  partnerTiers: string[];
  partnerTypes: string[];
  partnerStatuses: string[];
  partnerVendors: string[];
  cooperationLevels: string[];
  salesStages: string[];
  industries: string[];
  regions: string[];
  currency: 'CNY' | 'USD';
  productTypes?: string[];
  ctaButtonLabel?: string;
  partnerCenterUrl?: string;
  companyName?: string;
  companyNameEn?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  annualTarget?: string;
  quarterlyTarget?: string;
  partnerTarget?: string;
  channelRegions?: string;
  coreBusiness?: string;
  businessModel?: string;
  authorizedLevels?: string[];
  require2FA?: boolean;
  sessionTimeoutMin?: number;
  passwordMinLength?: number;
  loginAttempts?: number;
  aiApiKey?: string;
  aiBaseUrl?: string;
  aiModel?: string;
  aiVisionApiKey?: string;
  aiVisionModel?: string;
  timelineEvents?: string[];
}

// ── Partner Staff Types ──────────────────────────────
export interface PointsRecord {
  id: string;
  staffId: string;
  type: 'training' | 'project' | 'certification' | 'activity' | 'bonus';
  points: number;
  source: string;
  description: string;
  date: string;
  operator: string;
}

export interface PartnerStaff {
  id: string;
  salutation?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  mobile: string;
  email: string;
  partnerId: string;
  partnerName: string;
  title: string;
  department: string;
  city: string;
  skills: string[];
  isPrimary: boolean;
  status: 'active' | 'inactive' | 'transferred';
  joinDate: string;
  points: number;
  pointsHistory: PointsRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkHistory {
  id: string;
  staffId: string;
  fromPartnerId: string;
  fromPartnerName: string;
  toPartnerId: string;
  toPartnerName: string;
  fromTitle: string;
  toTitle: string;
  changeDate: string;
  changeReason: string;
}

export interface StaffProject {
  id: string;
  staffId: string;
  dealId: string;
  dealTitle: string;
  partnerId: string;
  role: string;
  contribution: string;
  startDate: string;
  endDate?: string;
}

export interface StaffActivity {
  id: string;
  staffId: string;
  activityId: string;
  activityName: string;
  activityType: 'training' | 'activity' | 'meeting' | 'certification';
  points: number;
  attendanceDate: string;
  completionStatus: 'completed' | 'registered' | 'in_progress';
  certificate?: string;
}

export interface StaffCustomer {
  id: string;
  staffId: string;
  customerName: string;
  industry: string;
  contactPerson: string;
  contactPhone: string;
  annualRevenue: number;
  relationshipStart: string;
  keyProducts: string[];
}

// ══════════════════════════════════════════════════════════════════════════════════
// 统一生命周期追踪系统 (Unified Lifecycle Tracking System)
// 版本: v2.0
// 描述: 为 5 个核心业务实体提供端到端生命周期状态管理
// ══════════════════════════════════════════════════════════════════════════════════

// ────────────────────────────────────────────────────────────────────────────────
// 1. 通用生命周期事件接口 (所有实体共享)
// ────────────────────────────────────────────────────────────────────────────────

/** 通用生命周期事件 - 用于记录每个实体的每次状态变更 */
export interface LifecycleEvent {
  id: string;
  entityId: string;                    // 关联的实体ID
  entityType: 'partner' | 'deal' | 'incentive' | 'training' | 'marketing';
  fromStage: string;                    // 变更前阶段
  toStage: string;                      // 变更后阶段
  eventDate: string;                    // 事件发生时间
  operator: string;                     // 操作人
  eventType: string;                    // 事件类型标签
  reason?: string;                      // 变更原因
  notes?: string;                       // 备注
  relatedDealId?: string;               // 关联商机
  durationDaysPrevious?: number;        // 在上一阶段停留天数
  healthDelta?: number;                 // 健康度变化
  metadata?: Record<string, any>;       // 灵活扩展字段
  createdAt: string;
}

/** 每个阶段的详细追踪记录 */
export interface StageDetail {
  stage: string;                        // 阶段标识
  stageLabel: string;                   // 阶段显示名
  enteredAt: string;                    // 进入此阶段的时间
  exitedAt?: string;                    // 离开此阶段的时间
  durationDays: number;                 // 停留天数
  isActive: boolean;                    // 是否当前阶段
  expectedDurationDays?: number;        // 预期停留天数（用于判断是否超时）
  isOverdue?: boolean;                  // 是否超过预期停留时间
  operator?: string;                    // 进入此阶段的操作人
  events?: LifecycleEvent[];            // 此阶段内的操作事件
}

/** 阶段进度百分比配置 */
export interface StageProbabilityConfig {
  stage: string;
  probability: number;                  // 0-100 加权百分比
  avgCycleDays: number;                 // 平均周期天数
  typicalNextStage?: string;            // 典型的下一阶段
  exitToNextRate?: number;              // 进入下一阶段的转化率(0-100)
}

/** 健康度计算规则 */
export interface HealthScoreRule {
  dimension: string;                    // 评估维度
  weight: number;                       // 权重 (0-100)
  currentValue: number;                 // 当前值
  targetValue?: number;                 // 目标值
  score: number;                        // 评分 (0-100)
  isHealthy: boolean;                   // 是否健康
  warning?: string;                     // 警告信息
  suggestion?: string;                  // 改进建议
}

/** 综合健康度分析 */
export interface HealthAnalysis {
  overallScore: number;                 // 综合健康度 0-100
  status: 'healthy' | 'monitoring' | 'at_risk' | 'critical';
  rules: HealthScoreRule[];             // 各维度评分
  lastUpdated: string;
  aiSummary?: string;                   // AI 生成的健康度摘要
}

// ────────────────────────────────────────────────────────────────────────────────
// 2. 合作伙伴生命周期 (Partner Lifecycle)
// ────────────────────────────────────────────────────────────────────────────────

export type PartnerLifecycleStage =
  | 'Prospecting'      // 潜在客户（未签约，正在发掘）
  | 'Application'      // 已提交申请表
  | 'UnderReview'      // 渠道经理审核中
  | 'Approved'         // 正式签约批复
  | 'Onboarding'       // 入职培训期（签约后3个月）
  | 'Active'           // 活跃合作中
  | 'RetentionReview'  // 续约评估中（即将到期）
  | 'Renewed'          // 已续约
  | 'Dormant'          // 休眠（180天无活动）
  | 'Terminated';      // 终止合作

/** 合作伙伴生命周期事件 */
export interface PartnerLifecycleEvent extends LifecycleEvent {
  entityType: 'partner';
}

/** 合作伙伴生命周期指标 */
export interface PartnerLifecycleMetrics {
  totalDaysInProgram: number;           // 合作总天数
  daysSinceLastActivity: number;        // 距上次活动天数
  daysInCurrentStage: number;           // 当前阶段停留天数
  onboardingCompletionPercentage: number; // 入职完成度 0-100
  dealCountPerYear: number;             // 年均商机报备量
  winRateAverage: number;               // 平均赢单率
  revenueTrend: 'growing' | 'stable' | 'declining'; // 收入趋势
  trainingParticipationRate: number;    // 培训参与率
  incentiveParticipationRate: number;   // 激励计划参与率
  marketingActivityRate: number;        // 营销活动参与度
}

// ────────────────────────────────────────────────────────────────────────────────
// 2.1 合作伙伴关系深度生命周期 (Partner Maturity Lifecycle)
// ────────────────────────────────────────────────────────────────────────────────
//
// 核心理念：将伙伴从"外部独立的利益交易者"转化为"深度耦合的战略共生体"
// 这不是操作流程的线性推进，而是合作关系的四维跃迁路径。

/** 关系深度/战略成熟度阶段 */
export type PartnerMaturityStage =
  | 'Transactional'    // 第一阶段：准入与匹配期（交易驱动）
  | 'Transitional'     // 第二阶段：赋能与激活期（能力过渡）
  | 'Relational'       // 第三阶段：协同与共创期（关系驱动）
  | 'Symbiotic';       // 第四阶段：演进与共生期（战略驱动）

/** 关系深度阶段的详细配置 */
export interface PartnerMaturityStageInfo {
  stage: PartnerMaturityStage;
  label: string;                  // 中文标签
  shortLabel: string;             // 简短标签
  description: string;            // 阶段描述
  identityPosition: string;       // 身份定位
  benefitDriver: string;          // 利益驱动机制
  managementFocus: string;        // 管理重心
  stabilityFoundation: string;    // 稳定性基石
  color: string;                  // UI 颜色
  icon: string;                   // UI 图标
  avgDaysInStage: number;         // 平均停留天数
  minDaysBeforePromotion: number; // 最低晋级天数
  partnerType: string[];          // 典型伙伴类型
  // 跃迁条件阈值（0-100，每项达到指定值后可考虑晋级）
  promotionCriteria: {
    dealCount: number;            // 至少报备商机数
    winRate: number;              // 赢单率阈值 %
    trainingCount: number;        // 培训参与数
    incentiveParticipation: number; // 激励计划参与率 %
    mdfUtilization: number;       // MDF 利用率 %
    jointDeals: number;           // 联合赢单数
    systemUsage: number;          // 系统活跃度 %
    accountHealth: number;        // 账户健康度
  };
}

/** 关系深度跃迁事件 */
export interface PartnerMaturityEvent {
  id: string;
  partnerId: string;
  fromStage: PartnerMaturityStage | null;  // 之前阶段，null 表示新伙伴
  toStage: PartnerMaturityStage;            // 新阶段
  eventDate: string;
  operator?: string;                        // 操作人
  reason?: string;                          // 跃迁原因（手动/自动）
  autoDetected?: boolean;                   // 是否系统自动识别
  healthDelta?: number;                     // 健康度变化
  // 跃迁时的快照数据
  snapshot?: {
    totalDaysInProgram: number;
    dealCount: number;
    winRate: number;
    trainingParticipationRate: number;
    incentiveParticipationRate: number;
    marketingActivityRate: number;
    revenueLast365: number;
    jointDealCount: number;
    systemActiveDays: number;
  };
  notes?: string;
}

/** 关系深度健康度评估 */
export interface PartnerMaturityHealth {
  partnerId: string;
  partnerName: string;
  currentStage: PartnerMaturityStage;
  currentStageLabel: string;
  daysInCurrentStage: number;          // 当前阶段已停留天数
  overallScore: number;                 // 综合评分 0-100
  status: 'healthy' | 'monitoring' | 'at_risk' | 'critical';
  // 6 大维度评分
  dimensionScores: {
    dealActivity: { score: number; trend: 'up' | 'flat' | 'down' };  // 商机活跃度
    capability: { score: number; trend: 'up' | 'flat' | 'down' };     // 能力建设
    enablement: { score: number; trend: 'up' | 'flat' | 'down' };    // 赋能参与
    collaboration: { score: number; trend: 'up' | 'flat' | 'down' }; // 协同共创
    strategicAlignment: { score: number; trend: 'up' | 'flat' | 'down' }; // 战略对齐
    systemIntegration: { score: number; trend: 'up' | 'flat' | 'down' }; // 系统耦合
  };
  // 晋级评估
  promotionReadiness: {
    canPromote: boolean;
    nextStage: PartnerMaturityStage;
    nextStageLabel: string;
    readinessPercentage: number;      // 0-100
    gapAnalysis: {                    // 差距分析
      dimension: string;
      currentValue: number;
      requiredValue: number;
      priority: 'high' | 'medium' | 'low';
      recommendation: string;
    }[];
  };
  // 风险预警
  riskAlerts: {
    type: 'stagnation' | 'regression' | 'opportunity';
    severity: 'high' | 'medium' | 'low';
    title: string;
    detail: string;
    action?: string;
  }[];
  lastUpdated: string;
}

/** 关系深度事件日志条目 */
export interface PartnerMaturityLogEntry {
  id: string;
  partnerId: string;
  timestamp: string;
  category: 'stage_change' | 'milestone' | 'training' | 'deal' | 'collaboration' | 'alert' | 'action';
  title: string;
  description: string;
  operator?: string;
  relatedEntityId?: string;
  relatedEntityType?: 'deal' | 'training' | 'incentive' | 'campaign' | 'mdf';
  impactOnMaturity?: number;           // 对成熟度的影响 0-10
}

/** 成熟度跃迁矩阵（用于生态整体分析） */
export interface MaturityTransitionMatrix {
  totalPartners: number;
  byStage: Record<PartnerMaturityStage, number>;
  avgDaysInStage: Record<PartnerMaturityStage, number>;
  promotionRate: {
    'Transactional_to_Transitional': number;
    'Transitional_to_Relational': number;
    'Relational_to_Symbiotic': number;
  };
  averageTimeToPromotion: {
    'Transactional_to_Transitional': number;
    'Transitional_to_Relational': number;
    'Relational_to_Symbiotic': number;
  };
  healthByStage: Record<PartnerMaturityStage, { avg: number; healthy: number; atRisk: number; critical: number }>;
}

// ────────────────────────────────────────────────────────────────────────────────
// 3. 商机生命周期 (Deal Lifecycle)
// ────────────────────────────────────────────────────────────────────────────────

/**
 * 商机4阶段关系深度生命周期
 * 与合作伙伴生命周期对齐：
 * - 报备期：Lead → Opp，确权保护，解决"这单是谁的"
 * - 协同期：Co-selling，联合方案+PoC，解决"怎么赢"
 * - 成交期：Closing，利益博弈+价格保护，解决"怎么分"
 * - 循环期：Expansion，LTV+续约/二次开发，解决"怎么做大"
 */
export type DealMaturityStage =
  | 'Registration'   // 第一阶段：报备与识别期（Lead to Opp）
  | 'Collaboration'  // 第二阶段：方案与验证期（Co-selling）
  | 'Closing'        // 第三阶段：商务与成交期（Closing）
  | 'Expansion';     // 第四阶段：交付与增值期（Expansion / LTV）

/** 商机4阶段的配置信息 */
export interface DealMaturityStageInfo {
  stage: DealMaturityStage;
  label: string;                    // 中文标签
  shortLabel: string;               // 简短标签
  description: string;              // 阶段描述（解决什么问题）
  identityPosition: string;         // 身份定位
  benefitDriver: string;            // 利益驱动
  managementFocus: string;          // 管理重心
  stabilityFoundation: string;      // 稳定性基石
  color: string;                    // UI 颜色
  icon: string;                     // UI 图标
  avgDaysInStage: number;           // 平均停留天数
  minDaysBeforePromotion: number;   // 最低晋级天数
  /** 对应的7个操作阶段 */
  operationStages: DealLifecycleStageV2[];
  /** 关键成功标志 */
  successMarkers: string[];
}

/** 商机4支柱健康度评分 */
export interface DealMaturityPillarScores {
  identity: {
    score: number;           // 0-100：身份清晰度/确权程度
    evidence: string[];      // 证据：如"已批复"、"有保护期"、"方案已确认"
    trend: 'up' | 'flat' | 'down';
  };
  value: {
    score: number;           // 0-100：价值创造/协同能力
    evidence: string[];
    trend: 'up' | 'flat' | 'down';
  };
  management: {
    score: number;           // 0-100：管理效率/资源配置
    evidence: string[];
    trend: 'up' | 'flat' | 'down';
  };
  stickiness: {
    score: number;           // 0-100：粘性/客户成功
    evidence: string[];
    trend: 'up' | 'flat' | 'down';
  };
}

/** 商机关系深度健康评估 */
export interface DealMaturityHealth {
  dealId: string;
  dealTitle: string;
  partnerName: string;
  customerName: string;
  /** 当前所属4阶段 */
  currentStage: DealMaturityStage;
  currentStageLabel: string;
  daysInCurrentStage: number;
  /** 综合评分 0-100 */
  overallScore: number;
  /** 综合健康状态 */
  status: 'healthy' | 'monitoring' | 'at_risk' | 'critical';
  /** 4支柱评分 */
  pillarScores: DealMaturityPillarScores;
  /** 晋级评估 */
  promotionReadiness: {
    canPromote: boolean;
    nextStage: DealMaturityStage;
    nextStageLabel: string;
    readinessPercentage: number;        // 0-100
    gapAnalysis: {
      pillar: 'identity' | 'value' | 'management' | 'stickiness';
      pillarLabel: string;
      currentValue: number;
      requiredValue: number;
      priority: 'high' | 'medium' | 'low';
      recommendation: string;
    }[];
  };
  /** 风险预警 */
  riskAlerts: {
    type: 'stagnation' | 'resource_gap' | 'protection_expiry' | 'price_gap' | 'missing_solution' | 'success_gap';
    severity: 'high' | 'medium' | 'low';
    title: string;
    detail: string;
    action?: string;
  }[];
  /** 关键里程碑 */
  milestones: {
    label: string;
    completed: boolean;
    completedAt?: string;
  }[];
  /** 赢单概率（基于健康度自动推算） */
  winProbability: number;
  /** 预计成交日期（基于健康度+阶段平均天数） */
  estimatedCloseDate?: string;
  lastUpdated: string;
}

/** 商机关系深度事件（阶段变化/里程碑） */
export interface DealMaturityEvent {
  id: string;
  dealId: string;
  fromStage: DealMaturityStage | null;
  toStage: DealMaturityStage;
  eventDate: string;
  operator?: string;
  reason?: string;
  notes?: string;
  /** 关键标志 */
  snapshot?: {
    pillarScoresAtEvent: DealMaturityPillarScores;
    overallScore: number;
    dealValue: number;
    daysInPreviousStage: number;
  };
}

/** 商机4阶段配置（含阈值、晋级规则） */
export const DEAL_MATURITY_STAGE_CONFIG: Record<DealMaturityStage, DealMaturityStageInfo> = {
  'Registration': {
    stage: 'Registration',
    label: '报备期',
    shortLabel: 'Lead → Opp',
    description: '确权与保护：将伙伴口中的"线索"转化为受保护的商机，解决"这单是谁的、能不能做"',
    identityPosition: '潜在商机（受保护的线索）',
    benefitDriver: '规则保护：报备成功速度、排他性保护期、防冲突机制',
    managementFocus: '合规与准入：报备审核、客户/行业/区域授权查重、分配保护',
    stabilityFoundation: '流程信任：厂商反馈速度和公平性 → 伙伴愿意继续分享线索',
    color: 'text-sky-700 bg-sky-50',
    icon: 'FileText',
    avgDaysInStage: 3,
    minDaysBeforePromotion: 0,
    operationStages: ['Registered', 'UnderReview', 'Approved'],
    successMarkers: [
      '3个工作日内完成审批',
      '无冲突记录/冲突已裁决',
      '保护期内未被其他伙伴报备同一客户',
      '已分配渠道经理跟进',
    ],
  },
  'Collaboration': {
    stage: 'Collaboration',
    label: '协同期',
    shortLabel: 'Co-selling',
    description: '联合攻坚：厂商与伙伴通过能力互补打动客户，重点在售前支持/PoC/方案联合开发',
    identityPosition: '联合解决方案：从"卖产品"变成"解决客户问题"',
    benefitDriver: '能力溢价：伙伴关心技术支持/PoC资源，厂商关心伙伴客户关系深度',
    managementFocus: '资源赋能与配比：该给多少技术力量？方案联合迭代节奏',
    stabilityFoundation: '团队磨合：双方一线销售配合默契度 → 商机不掉队',
    color: 'text-indigo-700 bg-indigo-50',
    icon: 'Users',
    avgDaysInStage: 30,
    minDaysBeforePromotion: 7,
    operationStages: ['Solution', 'Commercial'],
    successMarkers: [
      '已提交至少1份技术方案',
      '有 PoC 安排或 PoC 已通过',
      '双方销售有过至少1次联合拜访',
      '售前资源已确认分配',
      '客户已确认关键决策人',
    ],
  },
  'Closing': {
    stage: 'Closing',
    label: '成交期',
    shortLabel: 'Closing',
    description: '利益博弈：临门一脚，从投标方案转变为法律生效的合同，重点在价格保护与合理利润',
    identityPosition: '确认订单：双方利益博弈的最终阶段',
    benefitDriver: '利润分配：最终折扣申请、商务条款谈判、返利测算',
    managementFocus: '商务管控：价格审批、合同合规、交付周期确认',
    stabilityFoundation: '契约保障：合同签署 → 前期投入获得法律回报',
    color: 'text-emerald-700 bg-emerald-50',
    icon: 'CheckCircle',
    avgDaysInStage: 21,
    minDaysBeforePromotion: 3,
    operationStages: ['Commercial', 'Negotiation'],
    successMarkers: [
      '价格审批流程已启动',
      '合同主要条款已对齐',
      '客户内部评审/采购流程进行中',
      '无重大竞争对手威胁',
    ],
  },
  'Expansion': {
    stage: 'Expansion',
    label: '循环期',
    shortLabel: 'Expansion',
    description: '生态循环：好的商机不应在成交时结束，应在续约和扩容中重生',
    identityPosition: '存量资产与标杆案例：从一次性交易转变为"订阅续费"或"二期项目"',
    benefitDriver: '终身价值（LTV）：续约佣金、增购收益、作为案例引流新商机',
    managementFocus: '成功运营：客户成功（Customer Success）、售后服务质量监督、伙伴满意度回访',
    stabilityFoundation: '深度耦合：客户业务跑在双方方案上 → 形成三方共赢的稳固关系',
    color: 'text-amber-700 bg-amber-50',
    icon: 'RefreshCw',
    avgDaysInStage: 365,
    minDaysBeforePromotion: 0,
    operationStages: ['ClosedWon', 'Migrated'],
    successMarkers: [
      '首单交付完成且客户满意度 ≥ 80',
      '至少1次续约/增购讨论',
      '已收录为案例或标杆客户',
      '客户成功经理定期回访中',
      '伙伴持续活跃并关联同客户新商机',
    ],
  },
};

/** 7操作阶段 → 4关系阶段 的映射 */
export const DEAL_OPERATION_TO_MATURITY_MAP: Record<DealLifecycleStageV2, DealMaturityStage> = {
  'Registered': 'Registration',
  'UnderReview': 'Registration',
  'Approved': 'Registration',      // 批复后进入协同期，但此处保持映射到报备直到 Solution 阶段
  'Solution': 'Collaboration',
  'Commercial': 'Collaboration',    // 商务洽谈早期仍属协同攻坚（方案确认+商务博弈过渡）
  'Negotiation': 'Closing',
  'ClosedWon': 'Expansion',
  'ClosedLost': 'Closing',          // 丢单仍计作 Closing 阶段的失败
  'Migrated': 'Expansion',
};

export type DealLifecycleStageV2 =
  | 'Registered'        // 已报备
  | 'UnderReview'       // 审核中
  | 'Approved'          // 已批复
  | 'Solution'          // 方案跟进
  | 'Commercial'        // 商务洽谈
  | 'Negotiation'       // 合同谈判
  | 'ClosedWon'         // 赢单
  | 'ClosedLost'        // 丢单
  | 'Migrated';         // 迁单

/** 商机生命周期事件 */
export interface DealLifecycleEventV2 extends LifecycleEvent {
  entityType: 'deal';
}

/** 商机生命周期转化漏斗 */
export interface DealConversionFunnel {
  stage: DealLifecycleStageV2;
  count: number;
  totalValue: number;
  weightedValue: number;
  conversionRateFromPrevious: number;  // 相对于上一阶段的转化率
  avgDaysInStage: number;
}

/** 商机生命周期指标 */
export interface DealLifecycleMetrics {
  totalCycleDays: number;               // 从报备到当前的天数
  daysSinceRegistration: number;        // 距报备天数
  daysInCurrentStage: number;           // 当前阶段停留天数
  estimatedCloseDate?: string;          // 预估成交日期
  isOverdue: boolean;                   // 是否超出预期周期
  conversionProbability: number;        // 赢单概率 0-100
  weightedValue: number;                // 加权金额 = 金额 * 赢单概率
  averageCycleByIndustry: number;       // 同行业平均周期（基准对比）
  healthScore: number;                  // 健康度 0-100
  healthStatus: 'healthy' | 'monitoring' | 'at_risk' | 'critical';
}

// ────────────────────────────────────────────────────────────────────────────────
// 4. 激励计划生命周期 (Incentive Lifecycle)
// ────────────────────────────────────────────────────────────────────────────────

export type IncentiveLifecycleStage =
  | 'Draft'             // 草拟
  | 'Planning'          // 规划中（配置预算/规则）
  | 'Active'            // 进行中（合作伙伴可参与）
  | 'Evaluation'        // 评估期（结算参与结果）
  | 'Payout'            // 奖金发放中
  | 'Completed'         // 完成（全部结算完成）
  | 'Expired'           // 过期（无参与）
  | 'Cancelled';        // 取消

/** 激励申请的子生命周期 */
export type IncentiveApplicationStage =
  | 'submitted'         // 已提交申请
  | 'reviewing'         // 审核中
  | 'approved'          // 审核通过
  | 'paid'              // 奖金已发放
  | 'rejected';         // 申请被拒

/** 激励计划生命周期事件 */
export interface IncentiveLifecycleEvent extends LifecycleEvent {
  entityType: 'incentive';
}

/** 激励计划生命周期指标 */
export interface IncentiveLifecycleMetrics {
  totalBudget: number;
  budgetUtilized: number;
  budgetUtilizationRate: number;        // 0-100 预算使用率
  participantCount: number;
  applicationCount: number;
  approvedApplicationCount: number;
  paidAmount: number;
  pendingPayoutAmount: number;
  roi: number;                          // ROI = 由激励产生的商机金额 / 预算
  generatedDealValue: number;
  generatedDealCount: number;
  averagePayoutPerParticipant: number;
  timeToFirstPayoutDays: number;
}

// ────────────────────────────────────────────────────────────────────────────────
// 5. 培训认证生命周期 (Training / Enablement Lifecycle)
// ────────────────────────────────────────────────────────────────────────────────

export type TrainingProgramLifecycleStage =
  | 'Draft'             // 课程草稿
  | 'Enrolling'         // 报名中（开放学员报名）
  | 'InProgress'        // 进行中（学员正在学习）
  | 'Assessing'         // 考核中（考试/测评）
  | 'Certified'         // 已认证（完成并获得证书）
  | 'Valid'             // 证书有效
  | 'Expiring'          // 即将过期（90天内）
  | 'Expired'           // 已过期
  | 'Renewed';          // 已续期

/** 培训报名子生命周期 */
export type TrainingEnrollmentStage =
  | 'registered'        // 已报名
  | 'in_progress'       // 学习中
  | 'assessing'         // 考核中
  | 'passed'            // 通过
  | 'failed'            // 未通过
  | 'certified'         // 已颁发证书
  | 'expired';          // 证书过期

/** 培训生命周期事件 */
export interface TrainingLifecycleEvent extends LifecycleEvent {
  entityType: 'training';
}

/** 培训认证生命周期指标 */
export interface TrainingLifecycleMetrics {
  totalEnrollments: number;
  activeEnrollments: number;
  completedCount: number;
  passRate: number;                     // 0-100
  averageScore: number;
  averageCompletionDays: number;
  certificateCount: number;
  validCertificateCount: number;
  expiringCertificateCount: number;
  expiredCertificateCount: number;
  averageValidityDays: number;          // 证书平均有效期
}

// ────────────────────────────────────────────────────────────────────────────────
// 6. 营销活动生命周期 (Marketing Lifecycle)
// ────────────────────────────────────────────────────────────────────────────────

export type MarketingLifecycleStage =
  | 'Draft'             // 活动草案
  | 'Planning'          // 策划中（方案/预算/人员配置）
  | 'Scheduled'         // 已排期（时间/地点已确定）
  | 'Active'            // 进行中（活动正在举行）
  | 'Converting'        // 转化追踪期（会后线索跟进）
  | 'Reporting'         // 复盘报告中
  | 'Completed'         // 完成（全流程结束并归档）
  | 'Archived'          // 已归档
  | 'Cancelled';        // 取消

/** 参会者子生命周期 */
export type MarketingAttendeeStage =
  | 'registered'        // 已报名
  | 'checked_in'        // 已签到
  | 'no_show'           // 未到场
  | 'lead_generated'    // 已产生线索
  | 'opportunity_created' // 已转为商机
  | 'closed_won'        // 已成交
  | 'lost';             // 已丢单

/** 营销活动生命周期事件 */
export interface MarketingLifecycleEvent extends LifecycleEvent {
  entityType: 'marketing';
}

/** 营销活动生命周期指标 */
export interface MarketingLifecycleMetrics {
  totalBudget: number;
  actualSpend: number;
  budgetUtilizationRate: number;
  expectedAttendees: number;
  registeredAttendees: number;
  checkedInAttendees: number;
  attendanceRate: number;               // 签到/预期
  leadsGenerated: number;
  qualifiedLeads: number;
  dealsCreated: number;
  dealsValueGenerated: number;
  dealConversionRate: number;           // 参会者转成交率
  costPerLead: number;
  costPerDeal: number;
  roi: number;                          // 产生商机金额 / 活动成本
  avgLeadQualityScore: number;          // 平均线索质量分
}

// ────────────────────────────────────────────────────────────────────────────────
// 7. 跨实体关联关系 (Cross-Entity Relationships)
// ────────────────────────────────────────────────────────────────────────────────

/** 合作伙伴参与的各实体活跃度快照 */
export interface PartnerActivitySnapshot {
  partnerId: string;
  partnerName: string;
  date: string;
  // 商机
  dealsCreated: number;
  dealsInPipeline: number;
  dealsWon: number;
  dealsLost: number;
  dealsTotalValue: number;
  // 激励
  incentiveProgramsParticipated: number;
  incentiveAmountEarned: number;
  incentiveApplicationsCount: number;
  // 营销
  marketingActivitiesAttended: number;
  marketingLeadsGenerated: number;
  marketingLeadsConverted: number;
  // 培训
  trainingProgramsCompleted: number;
  trainingCertificatesEarned: number;
  trainingCertificatesValid: number;
  // MDF
  mdfBudgetApproved: number;
  mdfBudgetUsed: number;
  mdfBudgetRemaining: number;
  // 综合
  overallHealthScore: number;
  overallStatus: 'active' | 'at_risk' | 'dormant';
}

/** 统一的生命周期仪表盘数据 */
export interface UnifiedLifecycleDashboard {
  partnerLifecycle: {
    byStage: Record<PartnerLifecycleStage, number>;
    healthScore: number;
    active180Days: number;
    dormantCount: number;
    upcomingRenewals: number;
  };
  dealLifecycle: {
    byStage: Record<DealLifecycleStageV2, number>;
    byValue: Record<DealLifecycleStageV2, number>;
    avgCycleDays: number;
    conversionRate: number;
    overdueCount: number;
  };
  incentiveLifecycle: {
    byStage: Record<IncentiveLifecycleStage, number>;
    totalBudget: number;
    totalPayout: number;
    avgROI: number;
  };
  trainingLifecycle: {
    byStage: Record<TrainingProgramLifecycleStage, number>;
    totalCertificates: number;
    validCertificates: number;
    expiringCertificates: number;
    averagePassRate: number;
  };
  marketingLifecycle: {
    byStage: Record<MarketingLifecycleStage, number>;
    totalAttendees: number;
    totalLeadsGenerated: number;
    totalDealsGenerated: number;
    avgROI: number;
  };
  // 跨实体关联热力
  crossEntityHeatmap: {
    partnerDealHeatmap: number;         // 伙伴-商机关联强度 0-100
    partnerIncentiveHeatmap: number;    // 伙伴-激励关联强度
    partnerTrainingHeatmap: number;     // 伙伴-培训关联强度
    partnerMarketingHeatmap: number;    // 伙伴-营销关联强度
    dealMarketingHeatmap: number;       // 商机-营销关联强度
    dealIncentiveHeatmap: number;       // 商机-激励关联强度
  };
}

// ────────────────────────────────────────────────────────────────────────────────
// 8. 统一生命周期追踪引擎配置
// ────────────────────────────────────────────────────────────────────────────────

export interface LifecycleTrackingConfig {
  // 商机阶段加权概率（用于计算 pipeline 加权金额）
  dealStageProbabilities: Record<DealLifecycleStageV2, number>;
  // 商机阶段最大停留天数（超时会触发健康度预警）
  dealStageMaxDays: Record<DealLifecycleStageV2, number>;
  // 合作伙伴健康度规则
  partnerHealthRules: {
    inactivityDormantDays: number;       // 连续N天无活动判定为休眠
    minimumDealFrequencyDays: number;     // 平均报备间隔
    minimumTrainingPerYear: number;       // 年度培训参与度
    minimumIncentiveParticipation: number; // 激励计划参与度阈值
  };
  // 激励计划ROI阈值
  incentiveROIThreshold: {
    excellent: number;    // >=5 视为优秀
    good: number;         // >=3 视为良好
    acceptable: number;   // >=1 视为合格
    poor: number;         // <1 视为不佳
  };
  // 营销活动ROI阈值
  marketingROIThreshold: {
    excellent: number;
    good: number;
    acceptable: number;
    poor: number;
  };
  // 证书有效期
  certificateValidityDays: number;
  certificateExpiryWarningDays: number;  // 提前N天预警
}

// ══════════════════════════════════════════════════════════════════════════════════
// 结束: 统一生命周期追踪系统
// ══════════════════════════════════════════════════════════════════════════════════

