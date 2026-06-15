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
  partnerId: string;
  partnerName: string;
  partnerType: PartnerType;
  stage: DealLifecycleStage;
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
  daysInCurrentStage?: number; // 当前阶段停留天数
  isStagnant?: boolean; // 是否异常停滞
  expiresInDays?: number; // 有效期剩余天数
  winLossAnalysis?: WinLossAnalysis; // 赢单/丢单分析
  originActivityId?: string; // 关联营销活动ID
  originActivityName?: string; // 关联营销活动名称
  originInvitationCode?: string; // 关联邀请码
  healthScore?: number; // 商机健康度评分 (0-100)
  leadResponseTime?: number; // 线索首次响应时长(小时)
  isNewLogo?: boolean; // 是否新客户
  protectionRemainingDays?: number; // 保护期剩余天数
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
  contacts: PartnerContact[];
  unifiedSocialCreditCode?: string;
  industry?: string;
  registeredAddress?: string;
  cooperationScope?: string;
  isCorePartner?: boolean;
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
}

export interface IncentiveProgram {
  id: string;
  title: string;
  type?: string;
  quarter?: string;
  year?: number;
  trigger?: 'Pipeline Gap' | 'New Product' | 'Competitive' | 'Sales Acceleration';
  status: 'Active' | 'Upcoming' | 'Ended' | 'Planning';
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
  | 'evaluating';   // 评估阶段

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
}

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
