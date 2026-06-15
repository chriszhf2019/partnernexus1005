import {
  Deal,
  DealConflict,
  Activity,
  DashboardStats,
  MatrixData,
  NetworkNode,
  NetworkLink,
  PartnerDetails,
  MDFStats,
  MDFMonthlyActivity,
  IncentiveProgram,
  IncentiveStats,
  DealRegistrationStats
} from './types';

export const PARTNER_DETAILS: PartnerDetails = {
  id: '1',
  name: '华东医卫云科技术有限公司',
  logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXS9FYi7XicrOOumDk0oS6rXLqcgz0gKRCEbJDmQU6FOtw-0T-xzUHPbpzBHLl7GIv8fapCoEcoJU-Mb-8CpaaP_Ybboitids6EsopxMaK7GPM3CYHfedlJPB4yUxAkmCe3YZ_wITMnRDFufcoXBEhE_p0OJs15Zz78mX3AAVV9RdPFB3EDpqjK51XO50Lr6IReH-mSD2h72KjvHkFHKnjFFwRu-ZOGjRdlZSJwJcfoY_xl7Ur3OIWA9pzikznuw42rkTZsUG7GsJS',
  tier: 'Diamond',
  status: 'Cooperating',
  type: 'ISV',
  manager: '陈伟 (Chen Wei)',
  location: '上海市徐汇区',
  region: '华东',
  startDate: '2018-05-20',
  years: 6,
  prevTier: 'Diamond',
  tags: ['ISV', '医疗行业', '信创入围'],
  winRate: 68,
  pipeline: {
    registered: 14200000,
    solution: 8500000,
    commercial: 3100000,
    won: 12800000
  },
  mdf: {
    total: 2500000,
    used: 2100000,
    remaining: 400000,
    activities: [
      { name: '华东医疗 CIO 沙龙', date: '2024-03-15', leads: 42 },
      { name: '智慧医院数字化转型研讨会', date: '2024-02-10', leads: 28 },
      { name: '信创医疗云生态合作伙伴大会', date: '2024-01-20', leads: 56 }
    ]
  },
  enablement: {
    certifiedEngineers: 24,
    specialists: 8,
    expiryRiskCount: 3,
    expiryDays: 14
  },
  followUps: [
    { id: 'f1', title: '提交 Q3 联合营销方案 (MDF 申请)', status: 'In Progress', priority: 'High', dueDate: '2024-09-25', owner: 'Alex Rivera', category: 'Marketing' },
    { id: 'f2', title: '安排 5 位架构师参加原厂高级认证培训', status: 'Pending', priority: 'High', dueDate: '2024-10-05', owner: '陈伟 (Chen Wei)', category: 'Enablement' },
    { id: 'f3', title: '对齐杭州数字孪生医院项目的最终报价', status: 'Completed', priority: 'Medium', dueDate: '2024-09-15', owner: 'Alex Rivera', category: 'Sales' },
    { id: 'f4', title: '更新 FY25 联合业务计划 (JBP) 最终版', status: 'Pending', priority: 'Medium', dueDate: '2024-09-30', owner: 'Alex Rivera', category: 'Operations' }
  ],
  topProjects: [
    { name: '浙江省立医院 CMS 升级项目', amount: 4500000, progress: 75, closeDate: '2024-10-20' },
    { name: '苏州市卫健委医疗数据湖', amount: 2800000, progress: 40, closeDate: '2024-11-15' },
    { name: '杭州市养老数字化平台', amount: 1200000, progress: 15, closeDate: '2024-12-05' }
  ],
  contacts: [],
};

export const DEAL_STATS: DealRegistrationStats = {
  yearNew: 156,
  quarterNew: 42,
  monthNew: 14,
  weekNew: 4,
  rejected: 12,
  closed: 28,
  totalPipelineValue: 45600000,
  avgCycleDays: 48,
  conversionRate: 35,
  stageDistribution: {
    'Registered': 45,
    'UnderReview': 18,
    'Approved': 32,
    'Migrated': 8,
    'Solution': 28,
    'Commercial': 21,
    'ClosedWon': 28,
    'ClosedLost': 12
  },
  sourceDistribution: {
    'PartnerInitiated': 78,
    'ChannelAssigned': 35,
    'MDFCampaign': 18,
    'MarketingEvent': 12,
    'IncentiveProgram': 8,
    'Referral': 5
  },
  conflictCount: 3,
  overdueCount: 15
};

export const DEALS: Deal[] = [
  {
    id: 'd1',
    title: '浙江省立医院 CMS 升级项目',
    customerId: 'c1',
    customerName: '浙江省立医院',
    customerIndustry: '医疗',
    value: 4587650,
    partnerId: '1',
    partnerName: '华东医卫云科技术有限公司',
    partnerType: 'ISV',
    stage: 'Approved',
    status: 'Approved',
    region: '华东',
    province: '浙江',
    city: '杭州',
    salesName: '张伟',
    salesTeam: '医疗事业部',
    productType: '云原生平台',
    createdDate: '2024-08-15',
    lastActivityDate: '2024-09-20',
    expectedCloseDate: '2024-12-31',
    isPriority: true,
    hasConflict: false,
    lifecycle: [
      { stage: 'Registered', date: '2024-08-15', description: '合作伙伴提交报备', actor: '陈伟', durationDays: 0 },
      { stage: 'UnderReview', date: '2024-08-16', description: '渠道经理开始审核', actor: '张伟', durationDays: 1 },
      { stage: 'Approved', date: '2024-08-18', description: '审核通过，进入方案跟进阶段', actor: 'Alex Rivera', durationDays: 2 }
    ],
    sourceInfo: {
      source: 'PartnerInitiated',
      leadQuality: 'Hot',
      initialContactDate: '2024-08-10'
    },
    description: '浙江省立医院现有 CMS 系统升级，包括架构重构和云原生改造',
    nextAction: '提交技术方案初稿',
    nextActionDate: '2024-10-01',
    activities: [
      { id: 'a1', dealId: 'd1', type: 'meeting', content: '与客户CIO进行需求沟通，确认项目范围和时间节点', actor: '陈伟', createdAt: '2024-09-20 14:30' },
      { id: 'a2', dealId: 'd1', type: 'note', content: '@张伟 客户对云原生架构比较关注，建议下周二安排架构师技术交流', actor: '陈伟', createdAt: '2024-09-19 10:15', mentions: ['张伟'] },
      { id: 'a3', dealId: 'd1', type: 'update', content: '客户已确认技术选型，等待预算审批', actor: '张伟', createdAt: '2024-09-18 16:00' }
    ],
    daysInCurrentStage: 33,
    isStagnant: false,
    expiresInDays: 102
  },
  {
    id: 'd2',
    title: '苏州市卫健委医疗数据湖建设',
    customerId: 'c2',
    customerName: '苏州市卫生健康委员会',
    customerIndustry: '政府/医疗',
    value: 8523400,
    partnerId: '1',
    partnerName: '华东医卫云科技术有限公司',
    partnerType: 'ISV',
    stage: 'Solution',
    status: 'Approved',
    region: '华东',
    province: '江苏',
    city: '苏州',
    salesName: '李娜',
    salesTeam: '政府事业部',
    productType: '大数据平台',
    createdDate: '2024-07-01',
    lastActivityDate: '2024-09-18',
    expectedCloseDate: '2025-03-31',
    isPriority: true,
    hasConflict: false,
    lifecycle: [
      { stage: 'Registered', date: '2024-07-01', description: '合作伙伴提交报备', actor: '陈伟', durationDays: 0 },
      { stage: 'UnderReview', date: '2024-07-03', description: '渠道经理开始审核', actor: '李娜', durationDays: 2 },
      { stage: 'Approved', date: '2024-07-10', description: '审核通过', actor: 'Alex Rivera', durationDays: 7 },
      { stage: 'Solution', date: '2024-07-15', description: '进入方案设计阶段', actor: '李娜', durationDays: 5 }
    ],
    conversionMetrics: {
      registrationToApprovalDays: 9,
      approvalToSolutionDays: 5,
      solutionToCommercialDays: 0,
      commercialToCloseDays: 0,
      totalCycleDays: 14,
      isOverdue: false,
      expectedCloseDate: '2025-03-31'
    },
    sourceInfo: {
      source: 'MDFCampaign',
      relatedCampaignId: 'mdf1',
      leadQuality: 'Hot',
      initialContactDate: '2024-06-15'
    },
    description: '苏州市卫健委医疗健康数据湖平台建设，包含数据采集、存储、分析和应用',
    nextAction: '提交数据治理方案',
    nextActionDate: '2024-10-15',
    daysInCurrentStage: 71,
    isStagnant: true,
    expiresInDays: 193
  },
  {
    id: 'd3',
    title: '上海瑞金医院 AI 辅助诊断系统',
    customerId: 'c3',
    customerName: '上海瑞金医院',
    customerIndustry: '医疗',
    value: 3256800,
    partnerId: '2',
    partnerName: '上海智医科技',
    partnerType: 'ISV',
    stage: 'ClosedLost',
    status: 'Closed Lost',
    region: '华东',
    province: '上海',
    city: '上海',
    salesName: '王强',
    salesTeam: '医疗事业部',
    productType: 'AI 智算平台',
    createdDate: '2024-06-20',
    lastActivityDate: '2024-08-25',
    expectedCloseDate: '2024-09-30',
    actualCloseDate: '2024-08-25',
    hasConflict: true,
    conflictId: 'cf1',
    lifecycle: [
      { stage: 'Registered', date: '2024-06-20', description: '合作伙伴提交报备', actor: '王浩', durationDays: 0 },
      { stage: 'UnderReview', date: '2024-06-22', description: '渠道经理发现冲突', actor: '王强', durationDays: 2 },
      { stage: 'ClosedLost', date: '2024-08-25', description: '因与 d1 存在客户冲突，终止跟进', actor: 'Alex Rivera', durationDays: 64 }
    ],
    sourceInfo: {
      source: 'PartnerInitiated',
      leadQuality: 'Warm'
    },
    description: 'AI 辅助诊断系统建设，因与浙江省立医院项目存在客户归属冲突被终止',
    winLossAnalysis: {
      reason: 'Relationship',
      description: '因客户归属冲突导致丢单，浙江和上海两家瑞金医院同属一个医疗集团，根据区域划分原则，浙江省立医院项目由华东医卫云科负责',
      competitor: '华东医卫云科技术有限公司',
      keyFactors: ['客户归属规则', '区域划分', '合作伙伴关系']
    }
  },
  {
    id: 'd4',
    title: '深圳市人民医院智慧医院一期',
    customerId: 'c4',
    customerName: '深圳市人民医院',
    customerIndustry: '医疗',
    value: 6923500,
    partnerId: '3',
    partnerName: '华南智慧科技',
    partnerType: 'SI',
    stage: 'Commercial',
    status: 'Approved',
    region: '华南',
    province: '广东',
    city: '深圳',
    salesName: '刘洋',
    salesTeam: '医疗事业部',
    productType: '云原生平台',
    createdDate: '2024-05-15',
    lastActivityDate: '2024-09-22',
    expectedCloseDate: '2024-11-30',
    isPriority: true,
    hasConflict: false,
    lifecycle: [
      { stage: 'Registered', date: '2024-05-15', description: '合作伙伴提交报备', actor: '刘洋', durationDays: 0 },
      { stage: 'UnderReview', date: '2024-05-18', description: '渠道经理审核中', actor: '刘洋', durationDays: 3 },
      { stage: 'Approved', date: '2024-05-25', description: '审核通过', actor: 'Alex Rivera', durationDays: 7 },
      { stage: 'Solution', date: '2024-06-01', description: '方案设计阶段', actor: '刘洋', durationDays: 7 },
      { stage: 'Commercial', date: '2024-09-01', description: '进入商务洽谈', actor: '刘洋', durationDays: 92 }
    ],
    conversionMetrics: {
      registrationToApprovalDays: 10,
      approvalToSolutionDays: 7,
      solutionToCommercialDays: 92,
      commercialToCloseDays: 0,
      totalCycleDays: 109,
      isOverdue: false,
      expectedCloseDate: '2024-11-30'
    },
    sourceInfo: {
      source: 'MarketingEvent',
      relatedEventId: 'evt1',
      leadQuality: 'Hot',
      initialContactDate: '2024-04-20'
    },
    description: '智慧医院整体建设一期，包含HIS系统升级和院区网络改造',
    nextAction: '商务谈判最终报价',
    nextActionDate: '2024-10-10',
    daysInCurrentStage: 21,
    isStagnant: false,
    expiresInDays: 70
  },
  {
    id: 'd5',
    title: '广州市医保局数据中台项目',
    customerId: 'c5',
    customerName: '广州市医疗保障局',
    customerIndustry: '政府',
    value: 5187600,
    partnerId: '4',
    partnerName: '华南系统集成',
    partnerType: 'VAD',
    stage: 'Approved',
    status: 'Approved',
    region: '华南',
    province: '广东',
    city: '广州',
    salesName: '赵敏',
    salesTeam: '政府事业部',
    productType: '大数据平台',
    createdDate: '2024-08-01',
    lastActivityDate: '2024-09-15',
    expectedCloseDate: '2025-01-31',
    hasConflict: false,
    lifecycle: [
      { stage: 'Registered', date: '2024-08-01', description: '合作伙伴提交报备', actor: '赵敏', durationDays: 0 },
      { stage: 'UnderReview', date: '2024-08-03', description: '渠道经理审核中', actor: '赵敏', durationDays: 2 },
      { stage: 'Approved', date: '2024-08-12', description: '审核通过', actor: 'Michael Chen', durationDays: 9 }
    ],
    sourceInfo: {
      source: 'ChannelAssigned',
      leadQuality: 'Warm',
      initialContactDate: '2024-07-25'
    },
    description: '医保数据中台建设，实现与省级医保平台互联互通',
    daysInCurrentStage: 45,
    isStagnant: false,
    expiresInDays: 132
  },
  {
    id: 'd6',
    title: '北京协和医院数据中心现代化改造',
    customerId: 'c6',
    customerName: '北京协和医院',
    customerIndustry: '医疗',
    value: 3876500,
    partnerId: '5',
    partnerName: '北方信科',
    partnerType: 'VAR',
    stage: 'UnderReview',
    status: 'Pending',
    region: '华北',
    province: '北京',
    city: '北京',
    salesName: '孙杰',
    salesTeam: '医疗事业部',
    productType: '云原生平台',
    createdDate: '2024-09-18',
    lastActivityDate: '2024-09-20',
    expectedCloseDate: '2025-06-30',
    hasConflict: false,
    lifecycle: [
      { stage: 'Registered', date: '2024-09-18', description: '合作伙伴提交报备', actor: '孙杰', durationDays: 0 },
      { stage: 'UnderReview', date: '2024-09-20', description: '渠道经理审核中', actor: '孙杰', durationDays: 2 }
    ],
    sourceInfo: {
      source: 'Referral',
      leadQuality: 'Warm'
    },
    description: '数据中心虚拟化和容器化改造'
  },
  {
    id: 'd7',
    title: '成都市教育局智慧校园平台',
    customerId: 'c7',
    customerName: '成都市教育局',
    customerIndustry: '政府/教育',
    value: 2945800,
    partnerId: '6',
    partnerName: '西部云智科技',
    partnerType: 'ISV',
    stage: 'Registered',
    status: 'Pending',
    region: '西南',
    province: '四川',
    city: '成都',
    salesName: '周琳',
    salesTeam: '教育事业部',
    productType: '云原生平台',
    createdDate: '2024-09-22',
    lastActivityDate: '2024-09-22',
    expectedCloseDate: '2025-09-30',
    hasConflict: false,
    lifecycle: [
      { stage: 'Registered', date: '2024-09-22', description: '合作伙伴提交报备', actor: '周琳', durationDays: 0 }
    ],
    sourceInfo: {
      source: 'IncentiveProgram',
      incentiveProgramId: 'inc1',
      leadQuality: 'Cold',
      initialContactDate: '2024-09-15'
    },
    description: '智慧校园云平台建设，覆盖200所中小学'
  },
  {
    id: 'd8',
    title: '武汉市第一医院智慧医联体',
    customerId: 'c8',
    customerName: '武汉市第一医院',
    customerIndustry: '医疗',
    value: 4156700,
    partnerId: '7',
    partnerName: '华中智慧医疗',
    partnerType: 'ISV',
    stage: 'Solution',
    status: 'Approved',
    region: '华中',
    province: '湖北',
    city: '武汉',
    salesName: '吴涛',
    salesTeam: '医疗事业部',
    productType: 'AI 智算平台',
    createdDate: '2024-06-10',
    lastActivityDate: '2024-09-19',
    expectedCloseDate: '2024-12-31',
    hasConflict: false,
    lifecycle: [
      { stage: 'Registered', date: '2024-06-10', description: '合作伙伴提交报备', actor: '吴涛', durationDays: 0 },
      { stage: 'UnderReview', date: '2024-06-12', description: '渠道经理审核中', actor: '吴涛', durationDays: 2 },
      { stage: 'Approved', date: '2024-06-20', description: '审核通过', actor: '张伟', durationDays: 8 },
      { stage: 'Solution', date: '2024-07-01', description: '进入方案设计', actor: '吴涛', durationDays: 11 }
    ],
    conversionMetrics: {
      registrationToApprovalDays: 10,
      approvalToSolutionDays: 11,
      solutionToCommercialDays: 0,
      commercialToCloseDays: 0,
      totalCycleDays: 21,
      isOverdue: false,
      expectedCloseDate: '2024-12-31'
    },
    sourceInfo: {
      source: 'PartnerInitiated',
      leadQuality: 'Hot',
      initialContactDate: '2024-06-01'
    },
    description: '医联体信息平台，覆盖武汉市属10家医院',
    daysInCurrentStage: 81,
    isStagnant: true,
    expiresInDays: 100
  },
  {
    id: 'd9',
    title: '西安市第三医院云计算平台',
    customerId: 'c9',
    customerName: '西安市第三医院',
    customerIndustry: '医疗',
    value: 2234500,
    partnerId: '8',
    partnerName: '西北云科技',
    partnerType: 'VAR',
    stage: 'ClosedWon',
    status: 'Closed Won',
    region: '西南',
    province: '陕西',
    city: '西安',
    salesName: '郑强',
    salesTeam: '医疗事业部',
    productType: '云原生平台',
    createdDate: '2024-03-15',
    lastActivityDate: '2024-09-10',
    expectedCloseDate: '2024-09-30',
    actualCloseDate: '2024-09-10',
    hasConflict: false,
    lifecycle: [
      { stage: 'Registered', date: '2024-03-15', description: '合作伙伴提交报备', actor: '郑强', durationDays: 0 },
      { stage: 'UnderReview', date: '2024-03-18', description: '渠道经理审核中', actor: '郑强', durationDays: 3 },
      { stage: 'Approved', date: '2024-03-25', description: '审核通过', actor: 'Michael Chen', durationDays: 7 },
      { stage: 'Solution', date: '2024-04-01', description: '进入方案设计', actor: '郑强', durationDays: 7 },
      { stage: 'Commercial', date: '2024-07-15', description: '进入商务洽谈', actor: '郑强', durationDays: 105 },
      { stage: 'ClosedWon', date: '2024-09-10', description: '项目赢单', actor: 'Michael Chen', durationDays: 57 }
    ],
    conversionMetrics: {
      registrationToApprovalDays: 10,
      approvalToSolutionDays: 7,
      solutionToCommercialDays: 105,
      commercialToCloseDays: 57,
      totalCycleDays: 179,
      isOverdue: false,
      expectedCloseDate: '2024-09-30'
    },
    sourceInfo: {
      source: 'PartnerInitiated',
      leadQuality: 'Hot',
      initialContactDate: '2024-03-01'
    },
    description: '医院私有云平台建设',
    winLossAnalysis: {
      reason: 'Product',
      description: '产品方案满足客户需求，技术优势明显',
      keyFactors: ['技术方案', '服务能力', '价格竞争力']
    }
  },
  {
    id: 'd10',
    title: '南京市雨花台区政府云项目',
    customerId: 'c10',
    customerName: '南京市雨花台区人民政府',
    customerIndustry: '政府',
    value: 1856700,
    partnerId: '1',
    partnerName: '华东医卫云科技术有限公司',
    partnerType: 'ISV',
    stage: 'ClosedWon',
    status: 'Closed Won',
    region: '华东',
    province: '江苏',
    city: '南京',
    salesName: '张伟',
    salesTeam: '政府事业部',
    productType: '云原生平台',
    createdDate: '2024-04-01',
    lastActivityDate: '2024-08-20',
    expectedCloseDate: '2024-08-31',
    actualCloseDate: '2024-08-20',
    hasConflict: false,
    lifecycle: [
      { stage: 'Registered', date: '2024-04-01', description: '合作伙伴提交报备', actor: '张伟', durationDays: 0 },
      { stage: 'UnderReview', date: '2024-04-03', description: '渠道经理审核中', actor: '张伟', durationDays: 2 },
      { stage: 'Approved', date: '2024-04-10', description: '审核通过', actor: 'Alex Rivera', durationDays: 7 },
      { stage: 'Solution', date: '2024-04-15', description: '进入方案设计', actor: '张伟', durationDays: 5 },
      { stage: 'Commercial', date: '2024-06-01', description: '进入商务洽谈', actor: '张伟', durationDays: 47 },
      { stage: 'ClosedWon', date: '2024-08-20', description: '项目赢单', actor: 'Alex Rivera', durationDays: 80 }
    ],
    conversionMetrics: {
      registrationToApprovalDays: 9,
      approvalToSolutionDays: 5,
      solutionToCommercialDays: 47,
      commercialToCloseDays: 80,
      totalCycleDays: 141,
      isOverdue: false,
      expectedCloseDate: '2024-08-31'
    },
    sourceInfo: {
      source: 'ChannelAssigned',
      leadQuality: 'Warm',
      initialContactDate: '2024-03-20'
    },
    description: '区政府办公云平台建设'
  },
  {
    id: 'd11',
    title: '重庆市公安局智慧警务平台',
    customerId: 'c11',
    customerName: '重庆市公安局',
    customerIndustry: '政府',
    value: 7534500,
    partnerId: '9',
    partnerName: '西南系统集成',
    partnerType: 'SI',
    stage: 'Commercial',
    status: 'Approved',
    region: '西南',
    province: '重庆',
    city: '重庆',
    salesName: '陈刚',
    salesTeam: '政府事业部',
    productType: '大数据平台',
    createdDate: '2024-05-20',
    lastActivityDate: '2024-09-21',
    expectedCloseDate: '2024-12-31',
    isPriority: true,
    hasConflict: false,
    lifecycle: [
      { stage: 'Registered', date: '2024-05-20', description: '合作伙伴提交报备', actor: '陈刚', durationDays: 0 },
      { stage: 'UnderReview', date: '2024-05-22', description: '渠道经理审核中', actor: '陈刚', durationDays: 2 },
      { stage: 'Approved', date: '2024-06-01', description: '审核通过', actor: 'Michael Chen', durationDays: 10 },
      { stage: 'Solution', date: '2024-06-15', description: '进入方案设计', actor: '陈刚', durationDays: 14 },
      { stage: 'Commercial', date: '2024-09-01', description: '进入商务洽谈', actor: '陈刚', durationDays: 78 }
    ],
    conversionMetrics: {
      registrationToApprovalDays: 12,
      approvalToSolutionDays: 14,
      solutionToCommercialDays: 78,
      commercialToCloseDays: 0,
      totalCycleDays: 104,
      isOverdue: false,
      expectedCloseDate: '2024-12-31'
    },
    sourceInfo: {
      source: 'MDFCampaign',
      relatedCampaignId: 'mdf2',
      leadQuality: 'Hot',
      initialContactDate: '2024-05-10'
    },
    description: '智慧警务大数据分析平台，覆盖全市公安系统',
    daysInCurrentStage: 21,
    isStagnant: false,
    expiresInDays: 100
  },
  {
    id: 'd12',
    title: '天津市肿瘤医院精准医疗平台',
    customerId: 'c12',
    customerName: '天津市肿瘤医院',
    customerIndustry: '医疗',
    value: 5678900,
    partnerId: '5',
    partnerName: '北方信科',
    partnerType: 'VAR',
    stage: 'UnderReview',
    status: 'Pending',
    region: '华北',
    province: '天津',
    city: '天津',
    salesName: '孙杰',
    salesTeam: '医疗事业部',
    productType: 'AI 智算平台',
    createdDate: '2024-09-19',
    lastActivityDate: '2024-09-21',
    expectedCloseDate: '2025-06-30',
    hasConflict: true,
    conflictId: 'cf2',
    lifecycle: [
      { stage: 'Registered', date: '2024-09-19', description: '合作伙伴提交报备', actor: '孙杰', durationDays: 0 },
      { stage: 'UnderReview', date: '2024-09-21', description: '渠道经理审核中，发现潜在冲突', actor: '孙杰', durationDays: 2 }
    ],
    sourceInfo: {
      source: 'PartnerInitiated',
      leadQuality: 'Warm'
    },
    description: '精准医疗大数据分析平台'
  },
  {
    id: 'd13',
    title: '杭州市第一人民医院云HIS升级',
    customerId: 'c13',
    customerName: '杭州市第一人民医院',
    customerIndustry: '医疗',
    value: 3432100,
    partnerId: '1',
    partnerName: '华东医卫云科技术有限公司',
    partnerType: 'ISV',
    stage: 'Approved',
    status: 'Approved',
    region: '华东',
    province: '浙江',
    city: '杭州',
    salesName: '张伟',
    salesTeam: '医疗事业部',
    productType: '云原生平台',
    createdDate: '2024-08-10',
    lastActivityDate: '2024-09-18',
    expectedCloseDate: '2025-02-28',
    hasConflict: false,
    lifecycle: [
      { stage: 'Registered', date: '2024-08-10', description: '合作伙伴提交报备', actor: '张伟', durationDays: 0 },
      { stage: 'UnderReview', date: '2024-08-12', description: '渠道经理审核中', actor: '张伟', durationDays: 2 },
      { stage: 'Approved', date: '2024-08-20', description: '审核通过', actor: 'Alex Rivera', durationDays: 8 }
    ],
    sourceInfo: {
      source: 'PartnerInitiated',
      leadQuality: 'Hot',
      initialContactDate: '2024-08-05'
    },
    description: '医院信息系统云原生架构升级',
    daysInCurrentStage: 39,
    isStagnant: false,
    expiresInDays: 160
  },
  {
    id: 'd14',
    title: '青岛市医保局智慧医保平台',
    customerId: 'c14',
    customerName: '青岛市医疗保障局',
    customerIndustry: '政府',
    value: 4212300,
    partnerId: '10',
    partnerName: '山东半岛科技',
    partnerType: 'VAD',
    stage: 'Solution',
    status: 'Approved',
    region: '华东',
    province: '山东',
    city: '青岛',
    salesName: '王芳',
    salesTeam: '政府事业部',
    productType: '大数据平台',
    createdDate: '2024-06-25',
    lastActivityDate: '2024-09-17',
    expectedCloseDate: '2025-01-31',
    hasConflict: false,
    lifecycle: [
      { stage: 'Registered', date: '2024-06-25', description: '合作伙伴提交报备', actor: '王芳', durationDays: 0 },
      { stage: 'UnderReview', date: '2024-06-27', description: '渠道经理审核中', actor: '王芳', durationDays: 2 },
      { stage: 'Approved', date: '2024-07-05', description: '审核通过', actor: '李娜', durationDays: 8 },
      { stage: 'Solution', date: '2024-07-15', description: '进入方案设计', actor: '王芳', durationDays: 10 }
    ],
    conversionMetrics: {
      registrationToApprovalDays: 10,
      approvalToSolutionDays: 10,
      solutionToCommercialDays: 0,
      commercialToCloseDays: 0,
      totalCycleDays: 20,
      isOverdue: false,
      expectedCloseDate: '2025-01-31'
    },
    sourceInfo: {
      source: 'MarketingEvent',
      relatedEventId: 'evt2',
      leadQuality: 'Hot',
      initialContactDate: '2024-06-15'
    },
    description: '医保经办和结算云平台建设'
  },
  {
    id: 'd15',
    title: '复旦大学附属华山医院 AI 诊疗辅助',
    customerId: 'c15',
    customerName: '复旦大学附属华山医院',
    customerIndustry: '医疗',
    value: 4832100,
    partnerId: '2',
    partnerName: '上海智医科技',
    partnerType: 'ISV',
    stage: 'Commercial',
    status: 'Approved',
    region: '华东',
    province: '上海',
    city: '上海',
    salesName: '王强',
    salesTeam: '医疗事业部',
    productType: 'AI 智算平台',
    createdDate: '2024-05-08',
    lastActivityDate: '2024-09-20',
    expectedCloseDate: '2024-11-30',
    isPriority: true,
    hasConflict: true,
    conflictId: 'cf3',
    lifecycle: [
      { stage: 'Registered', date: '2024-05-08', description: '合作伙伴提交报备', actor: '王浩', durationDays: 0 },
      { stage: 'UnderReview', date: '2024-05-10', description: '渠道经理审核中', actor: '王强', durationDays: 2 },
      { stage: 'Approved', date: '2024-05-18', description: '审核通过', actor: 'Alex Rivera', durationDays: 8 },
      { stage: 'Solution', date: '2024-06-01', description: '进入方案设计', actor: '王浩', durationDays: 14 },
      { stage: 'Commercial', date: '2024-08-20', description: '进入商务洽谈', actor: '王强', durationDays: 80 }
    ],
    conversionMetrics: {
      registrationToApprovalDays: 10,
      approvalToSolutionDays: 14,
      solutionToCommercialDays: 80,
      commercialToCloseDays: 0,
      totalCycleDays: 104,
      isOverdue: false,
      expectedCloseDate: '2024-11-30'
    },
    sourceInfo: {
      source: 'IncentiveProgram',
      incentiveProgramId: 'inc2',
      leadQuality: 'Hot',
      initialContactDate: '2024-04-25'
    },
    description: 'AI 辅助诊疗系统，包含影像分析和临床决策支持',
    daysInCurrentStage: 32,
    isStagnant: false,
    expiresInDays: 71
  },
  {
    id: 'd18',
    title: '深圳市政府智慧政务平台二期',
    customerId: 'c18',
    customerName: '深圳市人民政府',
    customerIndustry: '政府',
    value: 12345600,
    partnerId: '9',
    partnerName: '深圳智慧城市科技',
    partnerType: 'SI',
    stage: 'UnderReview',
    status: 'Pending',
    region: '华南',
    province: '广东',
    city: '深圳',
    salesName: '刘洋',
    salesTeam: '政府事业部',
    productType: '云原生平台',
    createdDate: '2024-09-15',
    lastActivityDate: '2024-09-20',
    expectedCloseDate: '2025-03-31',
    hasConflict: true,
    conflictId: 'cf3',
    lifecycle: [
      { stage: 'Registered', date: '2024-09-15', description: '合作伙伴提交报备', actor: '刘洋', durationDays: 0 },
      { stage: 'UnderReview', date: '2024-09-18', description: '渠道经理审核中，发现与d15存在冲突', actor: '刘洋', durationDays: 3 }
    ],
    sourceInfo: {
      source: 'ChannelAssigned',
      leadQuality: 'Hot',
      initialContactDate: '2024-09-10'
    },
    description: '智慧政务平台二期建设，包含数据中台和AI能力平台'
  }
];

export const DEAL_CONFLICTS: DealConflict[] = [
  {
    id: 'cf1',
    type: 'SameCustomerSimilarProject',
    dealIds: ['d1', 'd3'],
    description: '上海瑞金医院与浙江省立医院存在相似 AI 辅助诊断项目冲突',
    status: 'Resolved',
    resolution: '上海瑞金医院项目终止，由上海智医科技负责后续跟进浙江省立医院项目',
    resolvedBy: 'Alex Rivera',
    resolvedDate: '2024-08-25',
    createdDate: '2024-08-22',
    protectionPeriodDays: 90,
    firstReportedDealId: 'd1'
  },
  {
    id: 'cf2',
    type: 'SameCustomerSameProduct',
    dealIds: ['d12', 'd6'],
    description: '天津市肿瘤医院 AI 智算平台项目可能存在多伙伴报备冲突',
    status: 'Pending',
    createdDate: '2024-09-21',
    protectionPeriodDays: 90,
    firstReportedDealId: 'd12'
  },
  {
    id: 'cf3',
    type: 'MultiPartnerSameDeal',
    dealIds: ['d15', 'd18'],
    description: '深圳市政府智慧政务平台项目存在三家伙伴同时报备',
    status: 'Pending',
    createdDate: '2024-09-18',
    protectionPeriodDays: 90,
    firstReportedDealId: 'd15'
  }
];

export const DASHBOARD_STATS: DashboardStats = {
  activePartners: { value: 1240, growth: 12.5 },
  pipelineValue: 45200000,
  revenueAchievement: 78,
  leadsConversion: 24.8
};

export const MATRIX_DATA: MatrixData[] = [
  { industry: '金融', region: '华北', count: 45 },
  { industry: '金融', region: '华东', count: 68 },
  { industry: '金融', region: '华南', count: 32 },
  { industry: '金融', region: '西部', count: 12 },
  { industry: '医疗', region: '华北', count: 28 },
  { industry: '医疗', region: '华东', count: 52 },
  { industry: '医疗', region: '华南', count: 41 },
  { industry: '医疗', region: '西部', count: 18 },
  { industry: '政务', region: '华北', count: 56 },
  { industry: '政务', region: '华东', count: 42 },
  { industry: '政务', region: '华南', count: 38 },
  { industry: '政务', region: '西部', count: 25 },
  { industry: '制造', region: '华北', count: 34 },
  { industry: '制造', region: '华东', count: 76 },
  { industry: '制造', region: '华南', count: 58 },
  { industry: '制造', region: '西部', count: 15 },
  { industry: '教育', region: '华北', count: 22 },
  { industry: '教育', region: '华东', count: 31 },
  { industry: '教育', region: '华南', count: 19 },
  { industry: '教育', region: '西部', count: 8 },
];

export const NETWORK_NODES: NetworkNode[] = [
  { id: 'n1', name: 'CloudScale', role: 'ISV', size: 80 },
  { id: 'n2', name: 'Global Systems', role: 'SI', size: 60 },
  { id: 'n3', name: 'Apex Networks', role: 'VAD', size: 100 },
  { id: 'n4', name: 'MediTech', role: 'ISV', size: 40 },
  { id: 'n5', name: 'FinTech Pro', role: 'VAR', size: 30 },
  { id: 'n6', name: 'SecureLink', role: 'SI', size: 50 },
  { id: 'n7', name: 'DataHub', role: 'ISV', size: 45 },
  { id: 'n8', name: 'SmartCity SI', role: 'SI', size: 55 },
  { id: 'n9', name: 'HealthConnect', role: 'ISV', size: 35 },
  { id: 'n10', name: 'GovTech Solutions', role: 'SI', size: 65 },
  { id: 'n11', name: 'Mainland Disti', role: 'VAD', size: 90 },
  { id: 'n12', name: 'Local VAR 01', role: 'VAR', size: 25 },
];

export const NETWORK_LINKS: NetworkLink[] = [
  { source: 'n3', target: 'n1', type: 'distribution' },
  { source: 'n3', target: 'n2', type: 'distribution' },
  { source: 'n1', target: 'n4', type: 'collaboration' },
  { source: 'n2', target: 'n6', type: 'collaboration' },
  { source: 'n1', target: 'n7', type: 'collaboration' },
  { source: 'n5', target: 'n3', type: 'distribution' },
  { source: 'n11', target: 'n8', type: 'distribution' },
  { source: 'n11', target: 'n10', type: 'distribution' },
  { source: 'n8', target: 'n9', type: 'collaboration' },
  { source: 'n10', target: 'n4', type: 'collaboration' },
  { source: 'n11', target: 'n12', type: 'distribution' },
  { source: 'n2', target: 'n10', type: 'collaboration' },
];

export const MDF_STATS: MDFStats = {
  annualQuota: 10000000,
  quarterlyQuota: 2500000,
  usedAmount: 1850000,
  remainingAmount: 650000,
  conversionRate: 28.5,
  activityDistribution: [
    { type: '行业沙龙', percentage: 35, count: 12 },
    { type: '线上研讨会', percentage: 25, count: 8 },
    { type: '展会赞助', percentage: 20, count: 4 },
    { type: '联合广告', percentage: 15, count: 6 },
    { type: '其他', percentage: 5, count: 2 }
  ]
};

export const MDF_MONTHLY_ACTIVITIES: MDFMonthlyActivity[] = [
  { id: 'm1', name: '华东区医疗数字化转型峰会', type: '行业沙龙', date: '2024-09-15', status: 'In Progress', budget: 450000, actualSpend: 320000, leadsGenerated: 145, progress: 75 },
  { id: 'm2', name: '云原生架构师线上特训营', type: '线上研讨会', date: '2024-09-22', status: 'Planning', budget: 120000, actualSpend: 0, leadsGenerated: 0, progress: 20 },
  { id: 'm3', name: '大湾区制造企业 CIO 闭门会', type: '行业沙龙', date: '2024-09-08', status: 'Completed', budget: 280000, actualSpend: 275000, leadsGenerated: 86, progress: 100 },
  { id: 'm4', name: '全国信创生态巡展 - 西安站', type: '展会赞助', date: '2024-09-28', status: 'Planning', budget: 550000, actualSpend: 150000, leadsGenerated: 0, progress: 45 }
];

export const INCENTIVE_PROGRAMS: IncentiveProgram[] = [
  {
    id: 'i1',
    title: 'Q3 医疗行业商机冲刺计划',
    type: 'Growth',
    quarter: 'Q3',
    year: 2024,
    startDate: '2024-07-01',
    endDate: '2024-09-30',
    status: 'Active',
    budget: 500000,
    used: 320000,
    remaining: 180000,
    targetDeals: 15,
    registeredDeals: 18,
    conversionRate: 65,
    topPartners: [
      { partnerId: '1', partnerName: '华东医卫云科技术有限公司', deals: 5, value: 12500000 },
      { partnerId: '2', partnerName: '上海智医科技', deals: 3, value: 8200000 },
    ]
  },
  {
    id: 'i2',
    title: 'FY25 Q1 政府行业激励计划',
    type: 'Government',
    quarter: 'Q1',
    year: 2025,
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    status: 'Planning',
    budget: 800000,
    used: 0,
    remaining: 800000,
    targetDeals: 20,
    registeredDeals: 0,
    conversionRate: 0,
    topPartners: []
  }
];

export const INCENTIVE_STATS: IncentiveStats = {
  totalBudget: 2800000,
  totalUsed: 1650000,
  totalRemaining: 1150000,
  activePrograms: 3,
  topPerformers: [
    { partnerId: '1', partnerName: '华东医卫云科技术有限公司', incentiveEarned: 380000, dealsWon: 8 },
    { partnerId: '2', partnerName: '上海智医科技', incentiveEarned: 280000, dealsWon: 5 },
    { partnerId: '3', partnerName: '华南智慧科技', incentiveEarned: 220000, dealsWon: 4 },
  ]
};

export const ACTIVITIES: Activity[] = [
  {
    id: 'a1',
    type: 'deal_update',
    title: '苏州市卫健委医疗数据湖 阶段更新',
    description: '方案设计已完成，进入技术验证阶段',
    timestamp: '2024-09-20T14:30:00Z',
    user: '李娜',
    metadata: { dealId: 'd2', stage: 'Solution', value: 8500000 }
  },
  {
    id: 'a2',
    type: 'partner_approved',
    title: '新合作伙伴加入审核',
    description: '华中智慧医疗提交合作申请',
    timestamp: '2024-09-19T10:15:00Z',
    user: '系统管理员',
    metadata: { partnerId: '7', partnerName: '华中智慧医疗' }
  },
  {
    id: 'a3',
    type: 'deal_created',
    title: '新商机报备',
    description: '成都市教育局智慧校园平台 报备成功',
    timestamp: '2024-09-18T16:45:00Z',
    user: '周琳',
    metadata: { dealId: 'd7', value: 2900000 }
  },
  {
    id: 'a4',
    type: 'mdf_submitted',
    title: 'MDF 申请提交',
    description: '华东医卫云科技术有限公司提交 Q3 联合营销方案',
    timestamp: '2024-09-17T11:20:00Z',
    user: '陈伟',
    metadata: { mdfId: 'mdf1', amount: 450000 }
  },
  {
    id: 'a5',
    type: 'deal_won',
    title: '商机赢单',
    description: '西安市第三医院云计算平台 成功结单',
    timestamp: '2024-09-10T15:00:00Z',
    user: '郑强',
    metadata: { dealId: 'd9', value: 2200000 }
  },
  {
    id: 'a6',
    type: 'enablement_cert',
    title: '工程师认证通过',
    description: '3 位工程师通过云原生架构师认证',
    timestamp: '2024-09-08T09:30:00Z',
    user: '培训系统',
    metadata: { partnerId: '1', engineers: 3, certification: '云原生架构师' }
  }
];