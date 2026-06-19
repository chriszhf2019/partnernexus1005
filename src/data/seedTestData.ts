import { supabase } from '../lib/supabase';
import type { Deal, Partner } from '../types';

export const testPartners: Omit<Partner, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: '神州数码集团股份有限公司',
    tier: 'Platinum',
    status: 'Cooperating',
    type: 'VAD',
    manager: '高波',
    location: '北京海淀区中关村大街1号',
    region: '华北',
    province: '北京',
    city: '北京市',
    startDate: '2018-03-15',
    years: 7,
    prevTier: 'Gold',
    tags: ['VAD', '信创', '全国覆盖', '金融'],
    winRate: 72,
    industry: '金融',
    isCorePartner: true,
    cooperationScope: '全国总代理，覆盖金融、政务、医疗三大行业',
    unifiedSocialCreditCode: '911100001000056537',
    contacts: [],
    logo: ''
  },
  {
    name: '华为技术有限公司',
    tier: 'Diamond',
    status: 'Cooperating',
    type: 'OEM',
    manager: '李娜',
    location: '深圳市龙岗区华为总部',
    region: '华南',
    province: '广东',
    city: '深圳市',
    startDate: '2016-05-01',
    years: 9,
    prevTier: 'Diamond',
    tags: ['OEM', '全行业', '全球覆盖', '5G'],
    winRate: 75,
    industry: '制造',
    isCorePartner: true,
    cooperationScope: '全行业基础设施伙伴',
    unifiedSocialCreditCode: '914403001922038216',
    contacts: [],
    logo: ''
  },
  {
    name: '东软集团股份有限公司',
    tier: 'Platinum',
    status: 'Cooperating',
    type: 'ISV',
    manager: '陈明',
    location: '沈阳市浑南区东软软件园',
    region: '华北',
    province: '辽宁',
    city: '沈阳市',
    startDate: '2017-06-01',
    years: 8,
    prevTier: 'Gold',
    tags: ['ISV', '医疗行业', '信创入围'],
    winRate: 68,
    industry: '医疗',
    isCorePartner: true,
    cooperationScope: '医疗行业核心ISV',
    unifiedSocialCreditCode: '91210100701796354X',
    contacts: [],
    logo: ''
  },
  {
    name: '浪潮电子信息产业股份有限公司',
    tier: 'Diamond',
    status: 'Cooperating',
    type: 'OEM',
    manager: '王强',
    location: '济南市高新区浪潮路1036号',
    region: '华东',
    province: '山东',
    city: '济南市',
    startDate: '2017-01-10',
    years: 8,
    prevTier: 'Platinum',
    tags: ['OEM', '政务', '制造', '信创'],
    winRate: 70,
    industry: '政务',
    isCorePartner: true,
    cooperationScope: '政务云基础设施核心伙伴',
    unifiedSocialCreditCode: '91370000267181296N',
    contacts: [],
    logo: ''
  },
  {
    name: '中科软科技股份有限公司',
    tier: 'Gold',
    status: 'Cooperating',
    type: 'ISV',
    manager: '刘洋',
    location: '北京中关村软件园',
    region: '华北',
    province: '北京',
    city: '北京市',
    startDate: '2018-09-20',
    years: 7,
    prevTier: 'Silver',
    tags: ['ISV', '金融', '保险行业'],
    winRate: 65,
    industry: '金融',
    isCorePartner: true,
    cooperationScope: '金融保险行业ISV',
    unifiedSocialCreditCode: '91110108726354867K',
    contacts: [],
    logo: ''
  },
  {
    name: '太极计算机股份有限公司',
    tier: 'Gold',
    status: 'Cooperating',
    type: 'SI',
    manager: '张伟',
    location: '北京海淀区信息路18号',
    region: '华北',
    province: '北京',
    city: '北京市',
    startDate: '2017-11-20',
    years: 7,
    prevTier: 'Silver',
    tags: ['SI', '政务', '信创'],
    winRate: 63,
    industry: '政务',
    isCorePartner: true,
    cooperationScope: '政务行业SI',
    unifiedSocialCreditCode: '91110108100007789R',
    contacts: [],
    logo: ''
  }
];

export const testDeals: Omit<Deal, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    title: '2025年萧山区政务云(信创)服务项目',
    customerName: '杭州市萧山区大数据发展管理局',
    customerIndustry: '政务',
    value: 18100000,
    partnerId: '',
    partnerName: '',
    partnerType: 'VAD',
    stage: 'Approved',
    status: 'Approved',
    region: '华东',
    salesName: '高波',
    salesTeam: '政务事业部',
    productType: '信创云平台',
    createdDate: '2025-06-01',
    lastActivityDate: '2025-06-15',
    expectedCloseDate: '2025-12-31',
    description: '基于鲲鹏/飞腾架构的信创云服务，替代原有x86云平台',
    lifecycle: [
      { stage: 'Registered', date: '2025-06-01', description: '合作伙伴提交商机报备', actor: '高波' },
      { stage: 'Approved', date: '2025-06-05', description: '渠道经理审核通过', actor: '渠道总监' }
    ]
  },
  {
    title: '某大型三甲医院智慧医院整体解决方案',
    customerName: '某省人民医院',
    customerIndustry: '医疗',
    value: 22000000,
    partnerId: '',
    partnerName: '',
    partnerType: 'ISV',
    stage: 'Solution',
    status: 'Approved',
    region: '华东',
    salesName: '王浩',
    salesTeam: '医疗事业部',
    productType: '智慧医院整体解决方案',
    createdDate: '2025-05-10',
    lastActivityDate: '2025-07-01',
    expectedCloseDate: '2026-06-30',
    description: '包含HIS、PACS、LIS、HRP等核心系统重构',
    lifecycle: [
      { stage: 'Registered', date: '2025-05-10', description: '合作伙伴提交商机报备', actor: '王浩' },
      { stage: 'Approved', date: '2025-05-15', description: '渠道经理审核通过', actor: '渠道总监' },
      { stage: 'Solution', date: '2025-06-01', description: '进入解决方案设计阶段', actor: '技术总监' }
    ]
  },
  {
    title: '某头部保险企业核心系统云化迁移',
    customerName: '中国平安保险集团',
    customerIndustry: '金融',
    value: 9800000,
    partnerId: '',
    partnerName: '',
    partnerType: 'ISV',
    stage: 'Commercial',
    status: 'Approved',
    region: '华南',
    salesName: '刘洋',
    salesTeam: '金融事业部',
    productType: '金融云平台',
    createdDate: '2025-03-20',
    lastActivityDate: '2025-07-10',
    expectedCloseDate: '2025-12-31',
    description: '保险核心系统迁移至金融云平台',
    hasConflict: true,
    lifecycle: [
      { stage: 'Registered', date: '2025-03-20', description: '合作伙伴提交商机报备', actor: '刘洋' },
      { stage: 'Approved', date: '2025-03-25', description: '渠道经理审核通过', actor: '渠道总监' },
      { stage: 'Commercial', date: '2025-06-15', description: '进入商务谈判阶段', actor: '销售总监' }
    ]
  },
  {
    title: '国家电网数据安全合规改造',
    customerName: '国家电网有限公司',
    customerIndustry: '能源',
    value: 8500000,
    partnerId: '',
    partnerName: '',
    partnerType: 'VAD',
    stage: 'ClosedWon',
    status: 'Approved',
    region: '华北',
    salesName: '高波',
    salesTeam: '能源事业部',
    productType: '安全合规',
    createdDate: '2024-11-10',
    lastActivityDate: '2025-06-15',
    expectedCloseDate: '2025-06-30',
    actualCloseDate: '2025-06-15',
    description: '电网关键基础设施安全改造，等保三级合规建设',
    lifecycle: [
      { stage: 'Registered', date: '2024-11-10', description: '合作伙伴提交商机报备', actor: '高波' },
      { stage: 'Approved', date: '2024-11-15', description: '渠道经理审核通过', actor: '渠道总监' },
      { stage: 'Commercial', date: '2025-01-10', description: '商机转化成功', actor: '渠道总监' },
      { stage: 'ClosedWon', date: '2025-06-15', description: '项目签约，合同金额850万', actor: '销售总监' }
    ]
  },
  {
    title: '深圳福田区智慧城区AI视觉系统',
    customerName: '深圳市福田区政务服务数据管理局',
    customerIndustry: '政务',
    value: 9500000,
    partnerId: '',
    partnerName: '',
    partnerType: 'ISV',
    stage: 'Approved',
    status: 'Approved',
    region: '华南',
    salesName: '陈可',
    salesTeam: '智慧城市事业部',
    productType: 'AI视觉平台',
    createdDate: '2025-06-05',
    lastActivityDate: '2025-07-01',
    expectedCloseDate: '2025-12-31',
    description: '城区级视频AI分析系统，覆盖10000路视频监控',
    lifecycle: [
      { stage: 'Registered', date: '2025-06-05', description: '合作伙伴提交商机报备', actor: '陈可' },
      { stage: 'Approved', date: '2025-06-08', description: '渠道经理审核通过，列为重点孵化项目', actor: '渠道总监' }
    ]
  },
  {
    title: '某省政务云二期扩容及信创改造',
    customerName: '某省大数据局',
    customerIndustry: '政务',
    value: 15000000,
    partnerId: '',
    partnerName: '',
    partnerType: 'SI',
    stage: 'Registered',
    status: 'Approved',
    region: '华北',
    salesName: '张伟',
    salesTeam: '政务事业部',
    productType: '信创云平台',
    createdDate: '2025-06-15',
    lastActivityDate: '2025-06-15',
    expectedCloseDate: '2026-03-31',
    description: '省级政务云平台扩容，新增信创资源池',
    lifecycle: [
      { stage: 'Registered', date: '2025-06-15', description: '合作伙伴提交商机报备', actor: '张伟' }
    ]
  },
  {
    title: '招商银行分布式核心系统改造',
    customerName: '招商银行股份有限公司',
    customerIndustry: '金融',
    value: 12000000,
    partnerId: '',
    partnerName: '',
    partnerType: 'SI',
    stage: 'Negotiation',
    status: 'Approved',
    region: '华南',
    salesName: '赵华',
    salesTeam: '金融事业部',
    productType: '分布式核心系统',
    createdDate: '2025-05-25',
    lastActivityDate: '2025-07-15',
    expectedCloseDate: '2026-03-31',
    description: '银行核心系统分布式改造，提升交易处理能力',
    lifecycle: [
      { stage: 'Registered', date: '2025-05-25', description: '合作伙伴提交商机报备', actor: '赵华' },
      { stage: 'Approved', date: '2025-05-30', description: '渠道经理审核通过', actor: '渠道总监' },
      { stage: 'Solution', date: '2025-06-15', description: '方案设计完成', actor: '技术总监' },
      { stage: 'Negotiation', date: '2025-07-01', description: '进入商务谈判阶段', actor: '销售总监' }
    ]
  },
  {
    title: '心血管病高质量数据集建设项目',
    customerName: '国家心血管病中心',
    customerIndustry: '医疗',
    value: 13000000,
    partnerId: '',
    partnerName: '',
    partnerType: 'OEM',
    stage: 'Commercial',
    status: 'Approved',
    region: '华北',
    salesName: '李娜',
    salesTeam: '医疗事业部',
    productType: '医疗AI平台',
    createdDate: '2025-07-01',
    lastActivityDate: '2025-07-15',
    expectedCloseDate: '2026-06-30',
    description: '高质量数据集建设，包含影像数据标注和AI模型训练',
    lifecycle: [
      { stage: 'Registered', date: '2025-07-01', description: '合作伙伴提交商机报备', actor: '李娜' },
      { stage: 'Approved', date: '2025-07-03', description: '渠道经理审核通过', actor: '渠道总监' },
      { stage: 'Commercial', date: '2025-07-10', description: '进入商务阶段', actor: '销售总监' }
    ]
  }
];

export async function seedTestData(): Promise<void> {
  try {
    for (const partner of testPartners) {
      const { data: existing } = await supabase
        .from('partners')
        .select('id')
        .eq('unified_social_credit_code', partner.unifiedSocialCreditCode);
      
      if (!existing || existing.length === 0) {
        const { error } = await supabase.from('partners').insert([partner]);
        if (error) console.error('Error inserting partner:', error);
      }
    }

    const { data: partners } = await supabase.from('partners').select('id, name, type');
    
    for (const deal of testDeals) {
      const partner = partners?.find(p => 
        (deal.partnerType === 'VAD' && p.name.includes('神州数码')) ||
        (deal.partnerType === 'ISV' && p.name.includes('东软')) ||
        (deal.partnerType === 'OEM' && p.name.includes('华为')) ||
        (deal.partnerType === 'SI' && p.name.includes('太极'))
      ) || partners?.[0];
      
      if (partner) {
        const { data: existing } = await supabase
          .from('deals')
          .select('id')
          .eq('title', deal.title);
        
        if (!existing || existing.length === 0) {
          const { error } = await supabase.from('deals').insert([{
            ...deal,
            partnerId: partner.id,
            partnerName: partner.name,
            partnerType: partner.type
          }]);
          if (error) console.error('Error inserting deal:', error);
        }
      }
    }

    console.log('Test data seeded successfully!');
  } catch (error) {
    console.error('Error seeding test data:', error);
  }
}
