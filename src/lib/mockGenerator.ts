import { TimeSeriesMetric, CockpitData } from '../types';

export const generateTimeSeriesMetric = (
  name: string,
  baseValue: number,
  target: number
): TimeSeriesMetric => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // 动态计算当前季度的月份索引
  const now = new Date();
  const currentQuarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const monthly_data = months.slice(currentQuarterStartMonth, currentQuarterStartMonth + 3).map((month, idx) => {
    const value = baseValue * (0.8 + Math.random() * 0.4);
    const prevValue = baseValue * (0.8 + Math.random() * 0.4);
    const qoq = ((value - prevValue) / prevValue) * 100;
    return { month, value, qoq };
  });

  const currentValue = monthly_data[monthly_data.length - 1].value;
  const prevMonthValue = monthly_data[monthly_data.length - 2].value;
  const mom = ((currentValue - prevMonthValue) / prevMonthValue) * 100;
  const qoq = (Math.random() * 15) + 2; 
  const yoy = (Math.random() * 20) + 5; 
  const linear_rate = (currentValue * 2.1 / target) * 100 * 0.95; // Simplified linearity calculation

  const metric: TimeSeriesMetric = {
    metric_name: name,
    current_value: currentValue,
    yoy,
    qoq,
    mom,
    linear_rate,
    achievements: {
      monthly: { current: currentValue, target: target / 3, rate: (currentValue / (target / 3)) * 100 },
      quarterly: { current: currentValue * 2.1, target, rate: (currentValue * 2.1 / target) * 100 },
      yearly: { current: currentValue * 5.2, target: target * 4, rate: (currentValue * 5.2 / (target * 4)) * 100 },
    },
    monthly_data
  };

  if (name === '营收完成度') {
    metric.strategic_revenue = {
      achievement_amount: currentValue * 2.1,
      forecast_landing: target * 0.98,
      pipeline_multiplier: 2.8,
      forces: {
        coverage: 'healthy',
        activity: 'healthy',
        capability: 'at_risk',
        will: 'healthy'
      },
      linearity_data: [
        { month: 'Apr', plan: target / 3, actual: baseValue * 0.9 },
        { month: 'May', plan: target / 3, actual: baseValue * 1.1 },
        { month: 'Jun', plan: target / 3, actual: currentValue }
      ]
    };
  }

  if (name === '活跃伙伴数') {
    metric.active_split = {
      order_placing: { value: Math.floor(currentValue * 0.45), target: Math.floor(currentValue * 0.40), rate: 112.5, yoy: 15.2, qoq: 3.4 },
      leads_reporting: { value: Math.floor(currentValue * 0.35), target: Math.floor(currentValue * 0.30), rate: 116.7, yoy: 22.1, qoq: 5.8 },
      pmdf_partners: { value: Math.floor(currentValue * 0.12), target: Math.floor(currentValue * 0.15), rate: 80, yoy: -4.2, qoq: 2.1 },
      incentive_participants: { value: Math.floor(currentValue * 0.08), target: Math.floor(currentValue * 0.05), rate: 160, yoy: 18.5, qoq: 7.2 }
    };
    
    metric.partner_ecosystem_details = {
      coverage: {
        total: Math.floor(currentValue),
        new_month: 12,
        new_quarter: 45,
        churn_quarter: 8,
        growth_rate: 3.2,
        yoy_quarter: 18.5,
        qoq_quarter: 5.2
      },
      tier_funnel: [
        { tier: 'Strategic Platinum', count: 24, percentage: 2 },
        { tier: 'Core Gold', count: 58, percentage: 5 },
        { tier: 'Standard Silver', count: 145, percentage: 12 },
        { tier: 'Registered Member', count: 1013, percentage: 81 }
      ],
      contribution_mix: {
        top_percent: 20,
        revenue_percent: 78
      },
      health_radar: {
        coverage: 85,
        activity: 72,
        capability: 64,
        will: 88
      },
      regional_coverage: [
        { region: '华东区', partner_count: 356, city_count: 82, new_cities: ['苏州', '无锡'] },
        { region: '华北区', partner_count: 218, city_count: 48, new_cities: ['廊坊'] },
        { region: '华南区', partner_count: 292, city_count: 55, new_cities: ['惠州', '江门'] },
        { region: '中西部', partner_count: 154, city_count: 42, new_cities: ['贵阳'] }
      ]
    };

    metric.dimensional_achievements = [
      {
        type: 'region',
        data: [
          { name: '华东区', current: 356, target: 320, rate: 111.2, new_recruits: 15, activity_rate: 85, contribution_percent: 42, segment_tag: 'Harvesting', analysis: '华东区密度极高，存在存量客户躺平现象，意愿维度存疑。', suggestion: '启动“深耕计划”激活老伙伴。' },
          { name: '华南区', current: 292, target: 310, rate: 94.2, new_recruits: 22, activity_rate: 92, contribution_percent: 28, segment_tag: 'Growth', analysis: '高活跃+低业绩，成长型新伙伴多，报备积极。', suggestion: '下发 PMDF 支持高意向报备项目。' },
          { name: '华北区', current: 218, target: 200, rate: 109, new_recruits: 5, activity_rate: 68, contribution_percent: 20, segment_tag: 'Stable', analysis: '传统行业渗透平稳，但创新业务覆盖不足。', suggestion: '联合大代理商进行联合开发。' },
          { name: '西北区', current: 42, target: 80, rate: 52.5, new_recruits: 2, activity_rate: 45, contribution_percent: 5, segment_tag: 'Risk', analysis: '西北区业绩虽然有，但只有 2 家银牌伙伴，覆盖力严重不足。', suggestion: '针对 SI/ISV 类型伙伴启动专项招募。' },
        ]
      },
      {
        type: 'industry',
        data: [
          { name: '金融', current: 125, target: 110, rate: 113.6, new_recruits: 4, activity_rate: 88, contribution_percent: 35, segment_tag: 'Stable', analysis: '金融行业伙伴虽多，但平均订单额在下降，说明需要新的行业方案。', suggestion: '推出定制化数字化转型金融方案。' },
          { name: '医疗', current: 85, target: 100, rate: 85, new_recruits: 8, activity_rate: 94, contribution_percent: 22, segment_tag: 'Growth', analysis: '政策利好带动新进入伙伴增加，报备数持续走高。', suggestion: '启动医疗行业标杆工程补贴。' },
          { name: '制造', current: 142, target: 150, rate: 94.7, new_recruits: 2, activity_rate: 62, contribution_percent: 30, segment_tag: 'Harvesting', analysis: '存量客户维护为主，缺乏新场景开拓动力。', suggestion: '开展“工业互联网”巡回赋能，提升能力。' },
        ]
      },
      {
        type: 'partner_type',
        data: [
          { name: '系统集成商 (SI)', current: 145, target: 160, rate: 90.6, new_recruits: 8, activity_rate: 78, contribution_percent: 45, segment_tag: 'Stable', analysis: '大单业绩支撑核心，转型期 SI 能力出现分化。', suggestion: '针对 SI 启动分级赋能计划。' },
          { name: '方案商 (ISV)', current: 86, target: 80, rate: 107.5, new_recruits: 12, activity_rate: 92, contribution_percent: 25, segment_tag: 'Growth', analysis: '联合方案竞争力强，生态融合加速。', suggestion: '增加云原生技术赋能包。' },
          { name: '转售商 (Reseller)', current: 812, target: 750, rate: 108.3, new_recruits: 25, activity_rate: 65, contribution_percent: 20, segment_tag: 'Harvesting', analysis: '跑量产品主力，忠诚度受返点政策波动大。', suggestion: '通过数字化平台提升处理效率。' },
        ]
      },
      {
        type: 'partner_tier',
        data: [
          { name: '白金伙伴 (Platinum)', current: 24, target: 20, rate: 120, activity_rate: 100, contribution_percent: 55, segment_tag: 'Stable', analysis: '金字塔尖贡献稳定，是战略产品的传声筒。', suggestion: '保持高频高管会唔。' },
          { name: '金牌伙伴 (Gold)', current: 58, target: 60, rate: 96.7, activity_rate: 85, contribution_percent: 25, segment_tag: 'Growth', analysis: '阶梯晋升主力军，表现分化严重。', suggestion: '通过 [意愿维度] 的激励政策拉一把。' },
          { name: '银牌伙伴 (Silver)', current: 145, target: 150, rate: 96.7, activity_rate: 55, contribution_percent: 15, segment_tag: 'Risk', analysis: '大量银牌伙伴徘徊不前，活跃度低。', suggestion: '启动末位淘汰与激活专项。' },
        ]
      },
      {
        type: 'product_expertise',
        data: [
          { name: '备份存储', current: 420, target: 400, rate: 105, activity_rate: 65, contribution_percent: 60, segment_tag: 'Harvesting', analysis: '80% 的伙伴只会卖“备份”，公司战略是推“云”，能力不匹配。', suggestion: '针对备份伙伴启动云原生技术认证培训。' },
          { name: '云原生/SaaS', current: 85, target: 150, rate: 56.7, activity_rate: 95, contribution_percent: 15, segment_tag: 'Growth', analysis: '云业务覆盖力极低，现有伙伴能力不足以支撑战略目标。', suggestion: '启动云业务 SI/ISV 伙伴专项招募。' },
          { name: '网络安全', current: 156, target: 160, rate: 97.5, activity_rate: 72, contribution_percent: 20, segment_tag: 'Stable', analysis: '合规性驱动明显，技术支持压力大。', suggestion: '下放安全赋能工具包。' },
        ]
      },
      {
        type: 'activity_health',
        data: [
          { 
            name: 'L1: 交易活跃 (下单)', 
            current: 450, 
            target: 400, 
            rate: 112, 
            yoy: 15, 
            qoq: 5,
            contribution_percent: 85,
            activity_rate: 100,
            segment_tag: 'Growth',
            analysis: '核心交易伙伴群体稳定，平均单笔订单金额上涨 12%。',
            suggestion: '启动周期性返点自动结算，提升核心伙伴周转效率。',
            sub_metrics: [
              { label: '平均复购率', value: '85%', status: 'success' },
              { label: '单笔客单价', value: '45.2w', status: 'success' }
            ]
          },
          { 
            name: 'L2: 项目活跃 (报备)', 
            current: 820, 
            target: 750, 
            rate: 109, 
            yoy: 22, 
            qoq: 8,
            contribution_percent: 45,
            activity_rate: 75,
            segment_tag: 'Growth',
            analysis: '报备项目数量激增，但从报备到 Won 的转化周期拉长了 10%。',
            suggestion: '启动“大单特战组”介入跟进 L2 高价值项目，提升转化率。',
            sub_metrics: [
              { label: '线索转化率', value: '32%', status: 'warning' },
              { label: '报备项目总额', value: '12.5亿', status: 'success' }
            ]
          },
          { 
            name: 'L3: 活动活跃 (赋能/激励)', 
            current: 1150, 
            target: 1000, 
            rate: 115, 
            yoy: 35, 
            qoq: 12,
            contribution_percent: 10,
            activity_rate: 45,
            segment_tag: 'Harvesting',
            analysis: '营销活动参与度极高，PMDF 使用率达历史峰值。',
            suggestion: '二季度重点考核营销活动产生的实物订单 ROI。',
            sub_metrics: [
              { label: '培训覆盖率', value: '92%', status: 'success' },
              { label: '激励达标率', value: '68%', status: 'warning' }
            ]
          }
        ]
      }
    ];
  }

  if (name === 'Open Pipeline') {
    metric.pipeline_batch = {
      current_q_target: currentValue * 0.6,
      next_q_count: 145,
      new_in_q_ratio: 35,
      historical_ratio: 65,
      historical_amount: currentValue * 0.65,
      new_amount: currentValue * 0.35,
    };
  }

  if (name === '线索转化率') {
    metric.conversion_details = {
      cycle_days: 18.5,
      funnel_stages: [
        { stage: 'MQL', count: 1240 },
        { stage: 'SQL', count: 850 },
        { stage: 'POC', count: 320 },
        { stage: 'Final', count: 112 },
      ]
    };
  }

  if (name === '营销与激励') {
    metric.marketing_details = {
      pmdf_utilization: 68.5,
      incentive_participation: 42.0,
      roi_index: 3.2,
      campaigns: [
        { name: 'Q3 金融云专项', status: 'active', budget: 500000 },
        { name: '华东区赋能周', status: 'active', budget: 200000 },
        { name: '半年末激励冲刺', status: 'completed', budget: 800000 },
      ]
    };
    metric.marketing_overview = {
      activities: {
        completed: 18,
        planned: 24,
        categories: [
          { label: '路演', value: 35 },
          { label: '线上研讨', value: 25 },
          { label: '展会', value: 20 },
          { label: '沙龙', value: 20 }
        ],
        yoy: 15,
        mom: -5
      },
      yield: {
        attendance: 1250,
        leads: 450,
        pipeline_gen: 85000000,
        yoy_amount: 22,
        mom_amount: 12,
        target_rate: 85
      },
      incentives: {
        active_programs: 12,
        payout_rate: 65,
        revenue_contribution: 125000000,
        yoy_participation: 8,
        mom_participation: 4,
        budget_consumption: 58
      },
      certification: {
        new_experts: 45,
        target_experts: 60,
        core_product_coverage: 72,
        expiry_warning_count: 5
      }
    };

    metric.dimensional_achievements = [
      {
        type: 'campaigns',
        data: [
          { name: 'Q4 云安全联合推广路演', current: 15, target: 12, rate: 125, yoy: 15, analysis: '参与度高但合格线索率仅 20%', suggestion: '加强活动前置筛客环节', sub_metrics: [{ label: '线索数', value: '45' }, { label: '转化金额', value: '¥12M' }] },
          { name: '行业标杆客户闭门研讨会', current: 8, target: 10, rate: 80, yoy: -5, analysis: 'CXO 级客户邀约难度增加', suggestion: '提升演讲嘉宾规格', sub_metrics: [{ label: '线索数', value: '12' }, { label: '转化金额', value: '¥25M' }] },
          { name: '华东区合作伙伴技术沙龙', current: 12, target: 12, rate: 100, yoy: 10, analysis: '技术人员参与极其踊跃', suggestion: '转化为常态化技术社区', sub_metrics: [{ label: '线索数', value: '8' }, { label: '转化金额', value: '¥5M' }] }
        ]
      },
      {
        type: 'incentive_tracker',
        data: [
          { name: '云业务 Q4 冲刺奖励', current: 4500000, target: 8000000, rate: 56.3, yoy: 12, analysis: '由于门槛过高，中小伙伴参与度低', suggestion: '设置阶梯式激励阶梯', sub_metrics: [{ label: '参与伙伴', value: '58' }, { label: '拉动商机', value: '¥85M' }] },
          { name: '新产品(AI智算)首单奖', current: 1200000, target: 1000000, rate: 120, yoy: 45, analysis: '政策精准点燃了伙伴热情', suggestion: '维持政策并增加带宽', sub_metrics: [{ label: '参与伙伴', value: '22' }, { label: '拉动商机', value: '¥30M' }] }
        ]
      },
      {
        type: 'certification_hub',
        data: [
          { name: '华东区 - 云方案专家', current: 85, target: 100, rate: 85, analysis: '头部伙伴认证率维持在 90%', suggestion: '加强腰部伙伴赋能' },
          { name: '华南区 - 备份架构师', current: 42, target: 60, rate: 70, analysis: '近期人员离职导致认证断档', suggestion: '启动紧急认证周' }
        ]
      },
      {
        type: 'regional_roi',
        data: [
          { name: '华东区', current: 1200000, target: 1000000, rate: 120, analysis: '投入产出比极高', suggestion: '继续保持' },
          { name: '中西部', current: 200000, target: 500000, rate: 40, analysis: '资源投入不足导致产出乏力', suggestion: '增加基础派驻支持' }
        ]
      }
    ];
  }

  if (name === '商机报备与流转' || name === 'Open Pipeline') {
    metric.reporting_overview = {
      pipeline: {
        total_count: 850,
        total_amount: 1250000000,
        target_achievement: 92,
        yoy: 18,
        mom: -2
      },
      approval: {
        submitted: 1240,
        approved: 850,
        rejected: 310,
        approval_rate: 68.5,
        yoy_approved: 12,
        mom_approved: 5
      },
      attribution: {
        sales_driven: 45,
        pmdf_driven: 35,
        incentive_driven: 20,
        yoy: { sales: 5, pmdf: 15, incentive: 25 },
        mom: { sales: 2, pmdf: 8, incentive: 12 }
      },
      tier_contribution: {
        platinum: 450,
        gold: 280,
        silver: 150,
        registered: 80,
        yoy_active: 14,
        mom_active: 6
      }
    };

    metric.dimensional_achievements = [
      {
        type: 'deals_tracking',
        data: [
          { name: '某省农信云原生改造项目', current: 15000000, target: 15000000, rate: 100, analysis: '处于 POC 阶段，竞争压力大', suggestion: '原厂售前加强介入', sub_metrics: [{ label: '当前阶段', value: 'POC' }, { label: '可能性', value: '60%' }] },
          { name: '跨国制造企业全球骨干网建设', current: 8500000, target: 8000000, rate: 106, analysis: '商务条款谈判中', suggestion: '关注法务合规风险', sub_metrics: [{ label: '当前阶段', value: 'Contract' }, { label: '可能性', value: '90%' }] }
        ]
      },
      {
        type: 'conversion_velocity',
        data: [
          { name: '报备 -> 批复', current: 1.5, target: 2.0, rate: 133, analysis: '审批流程极快', suggestion: '保持现状' },
          { name: 'POC -> 签约', current: 45, target: 30, rate: 66, analysis: '测试环节耗时过长', suggestion: '标准化测试用例' }
        ]
      },
      {
        type: 'source_efficiency',
        data: [
          { name: 'PMDF 活动转化', current: 45000000, target: 40000000, rate: 112, analysis: 'MDF 指向性强', suggestion: '增加高 ROI 活动预算' },
          { name: '激励政策驱动', current: 25000000, target: 30000000, rate: 83, analysis: '小额激励对大单拉动力弱', suggestion: '调整激励级数' }
        ]
      },
      {
        type: 'win_loss_analysis',
        data: [
          { name: '价格竞争', current: 35, target: 30, rate: 116, analysis: '友商低价策略激进', suggestion: '突出 TCO 优势' },
          { name: '伙伴方案能力不足', current: 25, target: 10, rate: 250, analysis: '丢标主因，需回溯赋能', suggestion: '强制方案审核机制' }
        ]
      }
    ];
  }

  if (name === '营收完成度') {
    const generateDimensionalItem = (name: string, current: number, target: number) => ({
      name,
      current,
      target,
      rate: (current / target) * 100,
      yoy: (Math.random() * 20) - 5,
      qoq: (Math.random() * 10) - 2,
    });

    metric.dimensional_achievements = [
      {
        type: 'region',
        data: [
          { ...generateDimensionalItem('华东区', 12000000, 10000000), analysis: '大客户活跃度超预期', suggestion: '追加 Q4 激励额度' },
          { ...generateDimensionalItem('华北区', 8500000, 9000000), analysis: '制造业转型需求放缓', suggestion: '关注高端政务云机会' },
          { ...generateDimensionalItem('华南区', 9800000, 8500000), analysis: '互联网行业反弹强劲', suggestion: '开展专项运营活动' },
          { ...generateDimensionalItem('中西部', 4200000, 5000000), analysis: '渠道覆盖深度不足', suggestion: '启动“拓星计划”招募' },
        ]
      },
      {
        type: 'channel_type',
        data: [
          { 
            ...generateDimensionalItem('Reseller', 15000000, 14000000),
            health_status: 'healthy',
            power_scores: { coverage: 95, activity: 85, contribution: 92, capability: 80 },
            analysis: '基础渠道表现稳健，二三线城市覆盖率提升明显', suggestion: '启动“深耕计划”返点激励' 
          },
          { 
            ...generateDimensionalItem('OEM', 8000000, 7500000),
            health_status: 'healthy',
            power_scores: { coverage: 60, activity: 90, contribution: 85, capability: 95 },
            analysis: '关键硬件厂商嵌入式合作顺利', suggestion: '联合举办季度产品发布会' 
          },
          { 
            ...generateDimensionalItem('ISV', 5000000, 7000000),
            health_status: 'at_risk',
            power_scores: { coverage: 40, activity: 55, contribution: 60, capability: 75 },
            analysis: '联合方案市场准入较慢，技术适配存在瓶颈', suggestion: '加快技术适配度验证，提供专项 PMDF' 
          },
          { 
            ...generateDimensionalItem('Service', 4200000, 4000000),
            health_status: 'healthy',
            power_scores: { coverage: 80, activity: 88, contribution: 75, capability: 92 },
            analysis: '运维及交付服务增长平稳', suggestion: '推出服务中心认证计划' 
          },
          { 
            ...generateDimensionalItem('SI', 9500000, 10000000),
            health_status: 'at_risk',
            power_scores: { coverage: 55, activity: 60, contribution: 90, capability: 85 },
            analysis: '大项目招投标节奏放缓', suggestion: '针对重点行业 SI 开展高层互访' 
          },
          { 
            ...generateDimensionalItem('Tech', 3000000, 2500000),
            health_status: 'healthy',
            power_scores: { coverage: 30, activity: 95, contribution: 50, capability: 98 },
            analysis: '技术生态伙伴对 AI 原生架构支撑力强', suggestion: '联合开发 AI 赋能包' 
          },
        ]
      },
      {
        type: 'team',
        data: [
          { ...generateDimensionalItem('战略大客户部', 15000000, 12000000), analysis: 'Top 10 项目结单率高', suggestion: '启动大客户满意度调研' },
          { ...generateDimensionalItem('通用行业部', 9500000, 10000000), analysis: '中小企业回款周期延长', suggestion: '收紧授信，加强催款' },
          { ...generateDimensionalItem('区域下沉部', 6000000, 7000000), analysis: '地市合作伙伴信心待恢复', suggestion: '下乡赋能，提供样板案例' },
          { ...generateDimensionalItem('新业务部', 4000000, 3500000), analysis: 'AI 方案市场认知度提升', suggestion: '增加 AI 基座产品补贴' },
        ]
      },
      {
        type: 'channel',
        data: [
          { ...generateDimensionalItem('总代理', 18000000, 15000000), analysis: '囤货能力及资源释放平稳', suggestion: '季度返点核销加速' },
          { ...generateDimensionalItem('核心', 12000000, 13000000), analysis: '受跨区窜货干扰严重', suggestion: '强化渠道合规巡检' },
          { ...generateDimensionalItem('非核心', 4500000, 4000000), analysis: '联合解决方案溢价能力强', suggestion: '举办 ISV 创新大赛' },
          { ...generateDimensionalItem('广域', 2500000, 3000000), analysis: '运维服务收入未达标', suggestion: '引导向混合云架构转型' },
        ]
      },
      {
        type: 'industry',
        data: [
          { 
            ...generateDimensionalItem('金融服务', 11000000, 10000000),
            health_status: 'healthy',
            power_scores: { coverage: 85, activity: 90, contribution: 95, capability: 88 },
            analysis: '核心系统上云需求爆发', suggestion: '推广高可靠存储方案' 
          },
          { 
            ...generateDimensionalItem('医疗美容', 9500000, 8000000),
            health_status: 'at_risk',
            power_scores: { coverage: 92, activity: 65, contribution: 88, capability: 70 },
            analysis: '私域流量运营投增', suggestion: '打包营销 SaaS 方案' 
          },
          { 
            ...generateDimensionalItem('高端制造', 7500000, 8500000),
            health_status: 'critical',
            power_scores: { coverage: 45, activity: 50, contribution: 55, capability: 60 },
            analysis: '供应链不确定性影响预算', suggestion: '推出“弹性用云”降本套餐' 
          },
          { 
            ...generateDimensionalItem('互联网/传媒', 6500000, 5500000),
            health_status: 'healthy',
            power_scores: { coverage: 80, activity: 95, contribution: 92, capability: 90 },
            analysis: '短视频出海业务激增', suggestion: '强化全球 CDN 节点优势' 
          },
        ]
      },
      {
        type: 'product_expertise',
        data: [
          { ...generateDimensionalItem('核心软件 (SaaS)', 12000000, 10000000), analysis: '年度授权增长稳健', suggestion: '推出跨产品套餐' },
          { ...generateDimensionalItem('硬件产品 (Storage)', 15000000, 14000000), analysis: '供应链恢复带动机房扩流', suggestion: '关注 Q4 库存预警' },
          { ...generateDimensionalItem('专业服务 (Service)', 3000000, 4000000), analysis: '运维外包意愿下降', suggestion: '转化为订阅服务模式' },
          { ...generateDimensionalItem('创新产品 (AI/Edge)', 1500000, 2000000), analysis: 'POC 周期较长', suggestion: '增加售前专访补贴' },
        ]
      },
      {
        type: 'order_size',
        data: [
          { ...generateDimensionalItem('超大单 (>500万)', 15000000, 12000000), analysis: '大项目转化率超出预期', suggestion: '关注 Q4 交付风险' },
          { ...generateDimensionalItem('大单 (100-500万)', 12000000, 14000000), analysis: '中间档项目出现断层', suggestion: '启动大单培育计划' },
          { ...generateDimensionalItem('中单 (20-100万)', 8000000, 9000000), analysis: '伙伴自主结单意愿下降', suggestion: '提高该档位激励比例' },
          { ...generateDimensionalItem('小单 (<20万)', 5000000, 5000000), analysis: '底量业务稳固', suggestion: '推广自动化结单平台' },
        ]
      }
    ];
  }

  return metric;
};

export const getMockCockpitData = (): CockpitData => ({
  revenue: generateTimeSeriesMetric('营收完成度', 8000000, 10000000),
  activePartners: generateTimeSeriesMetric('活跃伙伴数', 420, 500),
  pipeline: generateTimeSeriesMetric('商机报备与流转', 25000000, 30000000),
  leadsConversion: generateTimeSeriesMetric('线索转化率', 28, 35),
  marketing: generateTimeSeriesMetric('营销与激励', 1000000, 1500000),
  insights: [
    {
      type: 'trend',
      title: '增长动能分析',
      content: '本季业绩虽然环比上升 10.5%，但同比去年低了 5.2%，说明去年的高增长红利正在消退，需寻找新增长点。',
      actionLabel: '查看历史趋势',
      actionId: 'trends'
    },
    {
      type: 'risk',
      title: '效率预警',
      content: '检测到“能力值”指标连续两个月停滞，平均订单金额（Deal Size）正在缩减，可能影响年度目标达成。',
      actionLabel: '启动赋能培训',
      actionId: 'training'
    },
    {
      type: 'opportunity',
      title: '行动对策',
      content: '建议：将剩余 30% 的 PMDF 专项用于“大客户打单培训”，并针对“金融行业”开启季度专项激励。',
      actionLabel: '配置PMDF',
      actionId: 'pmdf'
    }
  ]
});
