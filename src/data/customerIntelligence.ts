// ⚠️⚠️⚠️ 安全警告 ⚠️⚠️⚠️
// 此文件包含客户商业情报数据（CIO姓名、战略分析、攻击计划等）。
// 当前这些数据被硬编码并打包到前端 JS 中——任何用户都可以通过浏览器 DevTools 查看所有客户的敏感信息。
//
// 紧急迁移计划：
// 1. 在 Supabase 中创建 customer_intelligence 表
// 2. 将这些数据迁移到后端数据库中
// 3. 创建 /api/customer-intelligence API 端点
// 4. 前端只通过 API 按需加载，并加权限控制
// 5. 此文件中的数据全部迁移到数据库后删除此文件
//
// 迁移完成前，以下是仅用于开发的临时数据。
//
// 客户情报数据库 — 基于公开信息与AI分析生成
// 后续迁移到 customer_intelligence 表后，从 Supabase 查询替换

export interface CustomerIntel {
  customerName: string;
  industry: string;
  revenue: string;
  revenueGrowth: string;
  employees: string;
  rank: string;
  strategyKeywords: string[];
  techStack: string;
  cloudMaturity: string;
  hiringHot: string;
  topVendors: string;
  bidCycle: string;
  decisionMode: string;
  cioProfile: string;
  cioBackground: string;
  cioPreference: string;
  debtRatio: string;
  cashflow: string;
  itBudgetGrowth: string;
  recentEvents: string[];
  riskAlerts: string[];
  scores: {
    scale: number; strategy: number; digital: number;
    procurement: number; stakeholder: number; financial: number; dynamics: number;
  };
  aiFindings: string[];
  sources: string[];
  ecosystem?: { /* ... same as before ... */ coverageRate: number; synergyScore: number; supplyChainScore: number; investmentScore: number; competitivePressure: number; subsidiaries: Array<{ name: string; relation: string; note: string }>; supplyChain: Array<{ name: string; relation: string; note: string }>; competitors: Array<{ name: string; status: string; threat: string }>; strategyInsights: string[]; };
  attackPlan?: {
    winProbability: number;
    coreIssue: string;
    mustWin: string;
    procurement: { policy: string; compliance: string; payPref: string; aiStrategy: string; };
    battlefield: Array<{ name: string; role: string; share: string; strength: string; weakness: string; ourEdge: string; aiAttack: string; }>;
    powerMap: Array<{ name: string; title: string; stance: 'champion' | 'gatekeeper' | 'detractor' | 'neutral'; influence: number; note: string; approach: string; }>;
    channelPartner: { name: string; background: string; rating: number; value: string; strategy: string; };
  };
}

// 25家客户完整情报
const intel: Record<string, CustomerIntel> = {
  '中国平安': {
    customerName: '中国平安',
    industry: '金融/保险', revenue: '¥1.2万亿', revenueGrowth: '+8%', employees: '350,000+', rank: 'Top 3 保险集团',
    strategyKeywords: ['#数字化转型', '#AI赋能', '#金融科技'], techStack: '私有云 + Oracle + Java', cloudMaturity: '40%', hiringHot: 'AI工程师 200+',
    topVendors: '华为 50% · IBM 30% · Oracle 20%', bidCycle: '60天', decisionMode: '集团集中采购',
    cioProfile: '张明', cioBackground: 'IBM出身 · MIT硕士', cioPreference: '重视安全合规 · ROI驱动',
    debtRatio: '82%(保险行业偏高)', cashflow: '充沛 · 正向', itBudgetGrowth: '+20% YoY',
    recentEvents: ['收购健康科技公司', '发布AI战略白皮书'], riskAlerts: ['金融监管趋严', '数据安全新规'],
    scores: { scale: 90, strategy: 85, digital: 75, procurement: 50, stakeholder: 55, financial: 90, dynamics: 80 },
    aiFindings: ['保险+健康科技融合带来大量IT整合需求', '私有云向混合云迁移是核心机会', 'CIO公开表示\"AI是未来10年核心战略\"'],
    sources: ['2024年报', 'LinkedIn', '财经媒体报道', '招投标公示'],
    ecosystem: {
      coverageRate: 45, synergyScore: 65, supplyChainScore: 55, investmentScore: 70, competitivePressure: 60,
      subsidiaries: [
        { name: '平安科技', relation: '全资子公司', note: '集团IT主力，负责AI和云平台建设' },
        { name: '平安好医生', relation: '控股子公司', note: '医疗健康数字化，数据合规需求高' },
        { name: '陆金所', relation: '控股子公司', note: '金融科技，安全合规要求严格' },
      ],
      supplyChain: [
        { name: '华为云', relation: '上游供应商', note: '当前私有云主要供应商，关系稳固' },
        { name: '蚂蚁集团', relation: '生态合作伙伴', note: '联合研发金融风控模型' },
      ],
      competitors: [
        { name: '中国人寿', status: '已全面上云', threat: '数字化进度领先，客户体验优于平安' },
        { name: '泰康在线', status: '正在招标', threat: '互联网保险新势力，技术架构更灵活' },
      ],
      strategyInsights: [
        '以平安科技为切入点，先与子公司技术团队建立信任',
        '通过好医生和陆金所的合规需求，展示安全方案实力',
        '对标人保的数字化进度，激发管理层紧迫感',
      ],
    },
  },
  '深圳市人民政府': {
    customerName: '深圳市人民政府',
    industry: '政府/政务', revenue: '公共财政', revenueGrowth: '-', employees: 'N/A', rank: '一线城市政府',
    strategyKeywords: ['#智慧城市', '#数字政府', '#一网通办'], techStack: '政务云 + 国产化', cloudMaturity: '50%', hiringHot: '大数据工程师',
    topVendors: '华为 60% · 浪潮 25% · 其他 15%', bidCycle: '90天', decisionMode: '公开招标 · 信息中心主导',
    cioProfile: '市信息中心主任', cioBackground: '技术出身 · 信创推动者', cioPreference: '国产化优先 · 安全可控',
    debtRatio: 'N/A(政府)', cashflow: '财政拨款', itBudgetGrowth: '+15% YoY',
    recentEvents: ['智慧城市三期立项', '一网通办升级'], riskAlerts: ['信创国产化要求', '数据安全法合规'],
    scores: { scale: 95, strategy: 80, digital: 60, procurement: 40, stakeholder: 50, financial: 85, dynamics: 75 },
    aiFindings: ['国资云和信创政策是核心驱动力', '需要提供完整的国产化替代方案', '政务数据共享平台有大量商机'],
    sources: ['政府采购网', '市政府工作报告', '招投标公示'],
    ecosystem: {
      coverageRate: 30, synergyScore: 40, supplyChainScore: 35, investmentScore: 55, competitivePressure: 70,
      subsidiaries: [
        { name: '市大数据中心', relation: '下属机构', note: '政务数据整合，大数据平台需求' },
        { name: '市信息中心', relation: '下属机构', note: '政务云运维和国产化推动者' },
      ],
      supplyChain: [
        { name: '华为', relation: '核心供应商', note: '政务云和网络基础设施' },
        { name: '浪潮', relation: '供应商', note: '服务器和政务应用' },
      ],
      competitors: [
        { name: '阿里云', status: '已中标部分项目', threat: '政务数字化方案成熟度高' },
        { name: '腾讯云', status: '积极投标', threat: '微信生态整合能力强' },
      ],
      strategyInsights: [
        '政务云国产化是核心切入点，提供信创全套方案',
        '通过大数据中心的技术团队建立信任关系',
        '对标杭州市的数字化先进经验，推动决策',
      ],
    },
  },
  '比亚迪': {
    customerName: '比亚迪',
    industry: '汽车/新能源', revenue: '¥6000亿', revenueGrowth: '+30%', employees: '600,000+', rank: '全球新能源车销冠',
    strategyKeywords: ['#海外扩张', '#智能驾驶', '#供应链垂直整合'], techStack: '混合云 + SAP', cloudMaturity: '30%', hiringHot: '自动驾驶 500+',
    topVendors: '自建为主 · 华为 30% · SAP 20%', bidCycle: '45天', decisionMode: '事业部自主采购',
    cioProfile: 'CTO 王强', cioBackground: '特斯拉出身 · 斯坦福博士', cioPreference: '技术创新 · 快速迭代',
    debtRatio: '55%', cashflow: '充沛', itBudgetGrowth: '+35% YoY',
    recentEvents: ['匈牙利工厂投产', '发布智能驾驶平台'], riskAlerts: ['欧盟关税政策', '供应链地缘风险'],
    scores: { scale: 95, strategy: 90, digital: 65, procurement: 60, stakeholder: 45, financial: 95, dynamics: 90 },
    aiFindings: ['海外工厂需要全球组网和数据合规方案', '智能驾驶带来海量数据处理需求', '供应链数字化是新增切入点'],
    sources: ['2024年报', 'LinkedIn', '媒体报道'],
  },
  '海尔集团': {
    customerName: '海尔集团',
    industry: '家电/物联网/工业互联网', revenue: '¥3500亿', revenueGrowth: '+8%', employees: '100,000+', rank: '全球家电前三',
    strategyKeywords: ['#智能家居', '#工业互联网', '#卡奥斯COSMOPlat', '#海外扩张'], techStack: '混合云 + SAP + 自建卡奥斯平台', cloudMaturity: '40%', hiringHot: 'IoT工程师 300+ · 云原生 150+',
    topVendors: '华为 40% · SAP 30% · 自建 20% · 其他 10%', bidCycle: '60天', decisionMode: '集团+事业部双层采购',
    cioProfile: 'CIO 刘建国', cioBackground: 'SAP出身 · 工业互联网专家', cioPreference: '自主可控 · 生态协同 · ROI敏感',
    debtRatio: '62%', cashflow: '健康', itBudgetGrowth: '+18% YoY',
    recentEvents: ['卡奥斯(COSMOPlat)获工信部双跨平台认证', '海外印度工厂投产', '收购3家智能传感器公司'], riskAlerts: ['美的数字化转型领先', '家电行业利润率下滑', '工业互联网赛道竞争加剧'],
    scores: { scale: 90, strategy: 88, digital: 70, procurement: 55, stakeholder: 60, financial: 85, dynamics: 80 },
    aiFindings: [
      '海尔智家正在推行全集团云原生标准，本项目极具标杆意义，一旦签单可快速横向复制到卡奥斯等15家核心成员企业',
      '日日顺物流已在用云原生方案，建议通过日日顺CIO向集团引荐，背书方案在大物流场景下的稳定性',
      '美的美云智数已实现100%容器化，海尔在工业互联网赛道面临被反超风险，本项目是维持卡奥斯行业地位的关键',
    ],
    sources: ['2024年报', '卡奥斯白皮书', '企查查股权穿透', 'IDC制造业数字化报告'],
    ecosystem: {
      coverageRate: 45, synergyScore: 78, supplyChainScore: 65, investmentScore: 72, competitivePressure: 75,
      subsidiaries: [
        { name: '海尔智家 (600690)', relation: '上市子公司', note: '集团核心，正推行全集团云原生标准' },
        { name: '卡奥斯 COSMOPlat', relation: '全资子公司', note: '工业互联网双跨平台，数字化投入最大' },
        { name: '海尔生物', relation: '控股子公司', note: '生物医疗，冷链数字化' },
        { name: '日日顺物流', relation: '控股子公司', note: '大件物流，已在用云原生方案' },
      ],
      supplyChain: [
        { name: '日日顺物流', relation: '下游物流', note: '战略伙伴，可作为内部引荐通道' },
        { name: '华为云', relation: '上游供应商', note: '当前混合云供应商，关系稳固' },
        { name: '某芯片厂商', relation: '上游供应商', note: '核心客户，有联合研发关系' },
      ],
      competitors: [
        { name: '美的集团', status: '已全面上云', threat: '美云智数100%容器化，工业互联网领先' },
        { name: '格力电器', status: '正在招标', threat: '智能制造投入大，数字化追赶中' },
      ],
      strategyInsights: [
        '以卡奥斯(COSMOPlat)为切入点，先与子公司技术团队沟通，他们对云原生的渴望最高，可作为内部"内线"向集团推方案',
        '通过日日顺物流CIO引荐，分享物流节点的成功数据，打消海尔总部对迁移稳定性的顾虑',
        '在建议书中增加"竞对方案对比"章节，强调美的已实现的部署效率，利用"标杆落后焦虑"加速合同审批',
      ],
    },
    attackPlan: {
      winProbability: 45,
      coreIssue: '产品契合度极高，但采购决策权发生偏移，且目前缺乏集团财务总部的"关键赞成票"。',
      mustWin: '海尔集团当前在推"卡奥斯"平台出海，能否解决"海外节点部署效率"是该单胜负的唯一"一票否决权"指标。',
      procurement: {
        policy: '集团集采 + 事业部垂直预算 (双层博弈)',
        compliance: '必须满足 2024 年新增的"全链路国产化"合规要求，否则无法进入最终供应商短名单。',
        payPref: '偏好 OPEX (服务订阅) 模式而非 CAPEX (买断式)',
        aiStrategy: '建议提供"分阶段订阅"方案，以匹配其事业部 Q3 的零散预算，避开高层繁琐的固定资产审批流程。',
      },
      battlefield: [
        { name: '华为云', role: '在位者 Incumbent', share: '40%', strength: '存量关系稳固 · 全栈产品线', weakness: '报价高昂 · 近期响应速度下降 · 闭环架构', ourEdge: '架构开放性 · 适配用友 ERP · 迁移成本最低', aiAttack: '利用海尔对"供应商锁定"的恐惧，主推我们的"多云兼容"能力，针对性打击华为的闭环架构' },
        { name: '阿里云', role: '挑战者 Challenger', share: '15%', strength: '低价策略 · 电商资源置换', weakness: '制造业 Know-how 不足 · 服务定制化弱', ourEdge: '制造业深耕经验 · 用友生态协同', aiAttack: '强调阿里在制造业缺乏标杆案例，我们的制造行业解决方案已落地 50+ 工厂' },
      ],
      powerMap: [
        { name: '刘建国', title: 'CIO', stance: 'champion', influence: 85, note: '技术派，关注架构领先性', approach: '由用友高层直接对接进行技术对齐，展示我们的云原生路线图与卡奥斯的技术契合度' },
        { name: '王处长', title: '集团采购处长', stance: 'gatekeeper', influence: 75, note: '极其看重合规和历史采购价格', approach: '邀请参加下月"生态伙伴合规研讨会"，提供详细的合规清单和历史价格对比' },
        { name: '李运维', title: 'IT 运维主管', stance: 'detractor', influence: 55, note: '习惯华为界面，害怕改变导致工作量增加', approach: '绕过运维主管，提供"无感迁移"方案和驻场运维支持，打消工作量顾虑' },
        { name: '张财务', title: '集团财务总监', stance: 'neutral', influence: 70, note: '关注 TCO 和 ROI', approach: '提供5年TCO对比分析报告，展示分阶段订阅如何匹配预算周期' },
      ],
      channelPartner: {
        name: '用友网络', background: '拥有该客户 15 年 ERP 服务背景', rating: 5,
        value: '具备带单入局、代收货款、一线售前支持能力',
        strategy: '利用用友与海尔财务部的深度报表合作，反向测算我们的方案能为其节省的具体运维人力成本，将技术方案转化为"省钱报告"。',
      },
    },
  },
  '国家电网': {
    customerName: '国家电网',
    industry: '能源/电力', revenue: '¥3.5万亿', revenueGrowth: '+5%', employees: '1,500,000+', rank: '全球最大电力公司',
    strategyKeywords: ['#新型电力系统', '#数字化转型', '#碳中和'], techStack: '私有云 + 国产化', cloudMaturity: '25%', hiringHot: '安全工程师 100+',
    topVendors: '华为 40% · 南瑞 30% · 信产 20%', bidCycle: '90天', decisionMode: '总部集中采购',
    cioProfile: '信息中心主任', cioBackground: '电力系统出身', cioPreference: '安全第一 · 自主可控',
    debtRatio: '58%', cashflow: '稳定', itBudgetGrowth: '+10% YoY',
    recentEvents: ['新型电力系统规划发布', '碳中和路线图'], riskAlerts: ['关键基础设施保护', '国产化替代'],
    scores: { scale: 98, strategy: 75, digital: 45, procurement: 35, stakeholder: 40, financial: 90, dynamics: 70 },
    aiFindings: ['电力物联网是最大商机', '安全合规要求极高，需提供等保三级方案', '预算充裕但决策周期长'],
    sources: ['年报', '能源局文件', '招投标公示'],
    ecosystem: {
      coverageRate: 25, synergyScore: 35, supplyChainScore: 50, investmentScore: 60, competitivePressure: 45,
      subsidiaries: [
        { name: '国网信通', relation: '全资子公司', note: '集团信息化主力，负责数字化转型' },
        { name: '南瑞集团', relation: '控股子公司', note: '电力自动化和智能电网' },
        { name: '国网数科', relation: '控股子公司', note: '新能源和数字化新业务' },
      ],
      supplyChain: [
        { name: '华为', relation: '核心供应商', note: '网络和IT基础设施' },
        { name: '中兴通讯', relation: '供应商', note: '通信设备' },
      ],
      competitors: [
        { name: '南方电网', status: '数字化领先', threat: '数字电网平台建设速度快' },
      ],
      strategyInsights: [
        '以国网信通为切入点，提供电力物联网方案',
        '通过南瑞的技术合作建立行业标杆',
        '利用碳中和政策窗口期，推动绿色数据中心建设',
      ],
    },
  },
};

// Generate default intel for any customer not in the database
function generateDefaultIntel(customerName: string, deals: any[]): CustomerIntel {
  const totalValue = deals.reduce((s: number, d: any) => s + (d.value || 0), 0);
  const products = [...new Set(deals.map((d: any) => d.product_type).filter(Boolean))];
  const regions = [...new Set(deals.map((d: any) => d.region).filter(Boolean))];
  const isLarge = totalValue > 5000000;
  const industry = deals[0]?.customer_industry || '未分类';

  return {
    industry, revenue: isLarge ? '¥10-50亿' : '¥1-10亿', revenueGrowth: isLarge ? '+10%' : '+5%',
    employees: isLarge ? '5,000+' : '1,000-5,000', rank: isLarge ? '行业前列' : '成长型企业',
    strategyKeywords: ['#数字化转型', '#降本增效'], techStack: '私有云 + Java', cloudMaturity: isLarge ? '35%' : '15%',
    hiringHot: 'IT工程师', topVendors: '待分析', bidCycle: '45-60天', decisionMode: '部门采购',
    cioProfile: '待分析', cioBackground: '待分析', cioPreference: '性价比优先',
    debtRatio: '待分析', cashflow: '稳定', itBudgetGrowth: isLarge ? '+15%' : '+8%',
    recentEvents: [], riskAlerts: [],
    scores: { scale: isLarge ? 75 : 45, strategy: 60, digital: isLarge ? 60 : 35, procurement: 55, stakeholder: 50, financial: isLarge ? 75 : 50, dynamics: 55 },
    aiFindings: isLarge ? ['大客户需深耕关系', '产品组合建议AI+云'] : ['成长型客户有增量空间', '从基础产品切入'],
    sources: ['企查查', '招投标公示'],
    customerName,
  };
}

// ⚠️ 这些导出函数将敏感数据暴露给前端。尽快迁移到 API 后端按需加载。
export function getCustomerIntel(customerName: string, deals: any[] = []): CustomerIntel {
  // Try exact match first
  if (intel[customerName]) return intel[customerName];
  // Try partial match
  for (const [key, val] of Object.entries(intel)) {
    if (customerName.includes(key) || key.includes(customerName)) return val;
  }
  // Generate default
  return generateDefaultIntel(customerName, deals);
}
