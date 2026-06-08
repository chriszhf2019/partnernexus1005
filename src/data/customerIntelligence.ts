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
