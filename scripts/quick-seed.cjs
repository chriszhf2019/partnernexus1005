const { createClient } = require('@supabase/supabase-js');

const url = 'https://ezkbjufluczpxdixplxu.supabase.co';
const anonKey = 'sb_publishable_aVrd26m9Gq26oBamwvtKtQ_JdQy9pNf';
const supabase = createClient(url, anonKey);

async function main() {
  console.log('🚀 开始填充真实业务数据...\n');

  // 1. 清空数据
  console.log('📦 清空现有数据...');
  await supabase.from('mp_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('mp_scores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('mp_users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('mp_gifts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('mp_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('deal_lifecycle_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('deals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('pmdf_applications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('mdf_allocations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('marketing_activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('incentive_applications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('incentive_programs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('partner_contacts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('partners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('settings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('market_benchmarks').delete().neq('id', 0);
  await supabase.from('partner_activity_logs').delete().neq('id', 0);
  console.log('✅ 数据已清空\n');

  // 2. 插入全局设置
  console.log('📝 插入全局设置...');
  await supabase.from('settings').upsert({
    id: 'global',
    data: {
      currency: 'CNY',
      regions: ['华北', '华东', '华南', '华中', '西部', '东北', '西南'],
      industries: ['金融', '医疗', '政务', '制造', '教育', '能源', '互联网', '通信'],
      partnerTiers: ['Diamond', 'Platinum', 'Gold', 'Silver', 'Registered'],
      partnerTypes: ['Reseller', 'ISV', 'OEM', 'Service', 'VAD', 'VAR', 'SI'],
      partnerStatuses: ['Cooperating', 'Inactive', 'Prospective', 'Rejected'],
      salesStages: ['Registered', 'Solution', 'Commercial', 'Negotiation', 'ClosedWon', 'ClosedLost'],
      companyName: 'VeloCloud 渠道管理平台',
      companyNameEn: 'VeloCloud Partner Management',
      companyAddress: '北京市朝阳区望京科技园A座20层',
      companyPhone: '400-888-6666',
      companyEmail: 'partner@velolabs.top'
    }
  });
  console.log('✅ 全局设置完成\n');

  // 3. 插入合作伙伴
  console.log('🏢 插入合作伙伴 (31家)...');
  const partners = [
    { name: '神州数码集团股份有限公司', tier: 'Platinum', status: 'Cooperating', type: 'VAD', manager: '高波', location: '北京海淀区中关村大街1号', region: '华北', province: '北京', city: '北京市', start_date: '2018-03-15', years: 7, prev_tier: 'Gold', tags: ['VAD','信创','全国覆盖','金融'], win_rate: 72, industry: '金融', is_core_partner: true, cooperation_scope: '全国总代理，覆盖金融、政务、医疗三大行业，年销售额超10亿' },
    { name: '华为技术有限公司', tier: 'Diamond', status: 'Cooperating', type: 'OEM', manager: '李娜', location: '深圳市龙岗区华为总部', region: '华南', province: '广东', city: '深圳市', start_date: '2016-05-01', years: 9, prev_tier: 'Diamond', tags: ['OEM','全行业','全球覆盖','5G'], win_rate: 75, industry: '制造', is_core_partner: true, cooperation_scope: '全行业基础设施伙伴，联合产品定义参与方，全球化布局' },
    { name: '东软集团股份有限公司', tier: 'Platinum', status: 'Cooperating', type: 'ISV', manager: '陈明', location: '沈阳市浑南区东软软件园', region: '华北', province: '辽宁', city: '沈阳市', start_date: '2017-06-01', years: 8, prev_tier: 'Gold', tags: ['ISV','医疗行业','信创入围'], win_rate: 68, industry: '医疗', is_core_partner: true, cooperation_scope: '医疗行业核心ISV，具备全院级解决方案交付能力' },
    { name: '浪潮电子信息产业股份有限公司', tier: 'Diamond', status: 'Cooperating', type: 'OEM', manager: '王强', location: '济南市高新区浪潮路1036号', region: '华东', province: '山东', city: '济南市', start_date: '2017-01-10', years: 8, prev_tier: 'Platinum', tags: ['OEM','政务','制造','信创'], win_rate: 70, industry: '政务', is_core_partner: true, cooperation_scope: '政务云基础设施核心伙伴，全国交付能力' },
    { name: '中科软科技股份有限公司', tier: 'Gold', status: 'Cooperating', type: 'ISV', manager: '刘洋', location: '北京中关村软件园', region: '华北', province: '北京', city: '北京市', start_date: '2018-09-20', years: 7, prev_tier: 'Silver', tags: ['ISV','金融','保险行业'], win_rate: 65, industry: '金融', is_core_partner: true, cooperation_scope: '金融保险行业ISV，核心系统迁移专家' },
    { name: '太极计算机股份有限公司', tier: 'Gold', status: 'Cooperating', type: 'SI', manager: '张伟', location: '北京海淀区信息路18号', region: '华北', province: '北京', city: '北京市', start_date: '2017-11-20', years: 7, prev_tier: 'Silver', tags: ['SI','政务','信创'], win_rate: 63, industry: '政务', is_core_partner: true, cooperation_scope: '政务行业SI，信创替代项目核心交付方' },
    { name: '软通动力信息技术股份有限公司', tier: 'Gold', status: 'Cooperating', type: 'SI', manager: '赵华', location: '北京朝阳区酒仙桥', region: '华北', province: '北京', city: '北京市', start_date: '2019-02-15', years: 6, prev_tier: 'Silver', tags: ['SI','金融','互联网'], win_rate: 62, industry: '金融', is_core_partner: false, cooperation_scope: '金融行业SI，核心业务系统集成能力' },
    { name: '华东医卫云科技术有限公司', tier: 'Gold', status: 'Cooperating', type: 'ISV', manager: '陈伟', location: '上海浦东新区张江高科技园区', region: '华东', province: '上海', city: '上海市', start_date: '2019-03-15', years: 6, prev_tier: 'Silver', tags: ['ISV','医疗行业','信创','AI'], win_rate: 65, industry: '医疗', is_core_partner: true, cooperation_scope: '医疗行业核心ISV，全院级解决方案交付能力' },
    { name: '上海智医信息科技有限公司', tier: 'Gold', status: 'Cooperating', type: 'ISV', manager: '王浩', location: '上海张江高科技园区碧波路690号', region: '华东', province: '上海', city: '上海市', start_date: '2020-06-01', years: 5, prev_tier: 'Silver', tags: ['ISV','医疗','AI','智慧医院'], win_rate: 62, industry: '医疗', is_core_partner: true, cooperation_scope: 'AI医疗解决方案专家，与多家三甲医院合作' },
    { name: '亚信科技控股有限公司', tier: 'Gold', status: 'Cooperating', type: 'ISV', manager: '周伟', location: '北京西城区金融街', region: '华北', province: '北京', city: '北京市', start_date: '2018-04-01', years: 7, prev_tier: 'Silver', tags: ['ISV','通信','5G','运营商'], win_rate: 58, industry: '通信', is_core_partner: false, cooperation_scope: '通信行业ISV，5G核心网方案合作伙伴' },
    { name: '中软国际有限公司', tier: 'Gold', status: 'Cooperating', type: 'Service', manager: '吴明', location: '深圳市南山区科技中三路', region: '华南', province: '广东', city: '深圳市', start_date: '2019-07-12', years: 6, prev_tier: 'Silver', tags: ['Service','外包','金融','金融科技'], win_rate: 55, industry: '金融', is_core_partner: false, cooperation_scope: 'IT服务合作伙伴，具备大规模交付和运维能力' },
    { name: '华南智慧医疗科技有限公司', tier: 'Silver', status: 'Cooperating', type: 'SI', manager: '刘洋', location: '深圳南山高新区', region: '华南', province: '广东', city: '深圳市', start_date: '2020-09-20', years: 5, prev_tier: 'Registered', tags: ['SI','医疗','智慧城市'], win_rate: 58, industry: '医疗', is_core_partner: false, cooperation_scope: '华南区域医疗信息化SI，智慧医院建设专家' },
    { name: '武汉达梦数据库股份有限公司', tier: 'Silver', status: 'Cooperating', type: 'ISV', manager: '郑涛', location: '武汉光谷软件园', region: '华中', province: '湖北', city: '武汉市', start_date: '2020-08-10', years: 5, prev_tier: 'Registered', tags: ['ISV','数据库','信创','国产替代'], win_rate: 55, industry: '政务', is_core_partner: false, cooperation_scope: '国产数据库ISV，信创替代核心伙伴' },
    { name: '用友网络科技股份有限公司', tier: 'Silver', status: 'Cooperating', type: 'ISV', manager: '林芳', location: '北京海淀区北清路68号', region: '华北', province: '北京', city: '北京市', start_date: '2019-10-01', years: 6, prev_tier: 'Registered', tags: ['ISV','ERP','SaaS','企业软件'], win_rate: 52, industry: '互联网', is_core_partner: false, cooperation_scope: '企业管理软件ISV，ERP与财务系统合作伙伴' },
    { name: '上海宝信软件股份有限公司', tier: 'Silver', status: 'Cooperating', type: 'ISV', manager: '陈强', location: '上海浦东新区金科路2889号', region: '华东', province: '上海', city: '上海市', start_date: '2020-03-08', years: 5, prev_tier: 'Registered', tags: ['ISV','制造','钢铁','MES'], win_rate: 48, industry: '制造', is_core_partner: false, cooperation_scope: '制造业ISV，钢铁行业MES系统专家' },
    { name: '重庆梅安森科技股份有限公司', tier: 'Silver', status: 'Cooperating', type: 'ISV', manager: '赵勇', location: '重庆渝北区黄山大道中段', region: '西部', province: '重庆', city: '重庆市', start_date: '2020-11-05', years: 5, prev_tier: 'Registered', tags: ['ISV','能源','安全','煤矿'], win_rate: 50, industry: '能源', is_core_partner: false, cooperation_scope: '能源安全ISV，煤矿智能化方案伙伴' },
    { name: '西安未来国际信息股份有限公司', tier: 'Silver', status: 'Cooperating', type: 'SI', manager: '马超', location: '西安高新区科技二路', region: '西部', province: '陕西', city: '西安市', start_date: '2021-08-15', years: 4, prev_tier: 'Registered', tags: ['SI','政务','西部','电子政务'], win_rate: 42, industry: '政务', is_core_partner: false, cooperation_scope: '西部政务SI，区域电子政务项目' },
    { name: '福建顶点软件股份有限公司', tier: 'Silver', status: 'Cooperating', type: 'ISV', manager: '何军', location: '福州鼓楼区软件园', region: '华东', province: '福建', city: '福州市', start_date: '2022-02-28', years: 3, prev_tier: 'Registered', tags: ['ISV','金融','证券','交易系统'], win_rate: 45, industry: '金融', is_core_partner: false, cooperation_scope: '金融证券ISV，交易系统合作伙伴' },
    { name: '北京华宇信息技术有限公司', tier: 'Registered', status: 'Cooperating', type: 'Reseller', manager: '李明', location: '北京海淀区上地信息路', region: '华北', province: '北京', city: '北京市', start_date: '2021-06-20', years: 4, prev_tier: 'Registered', tags: ['Reseller','教育','SMB'], win_rate: 40, industry: '教育', is_core_partner: false, cooperation_scope: '教育行业转售商，区域SMB市场覆盖' },
    { name: '杭州数梦工场科技有限公司', tier: 'Registered', status: 'Cooperating', type: 'ISV', manager: '王磊', location: '杭州滨江区海创基地', region: '华东', province: '浙江', city: '杭州市', start_date: '2021-09-15', years: 4, prev_tier: 'Registered', tags: ['ISV','大数据','政务','城市大脑'], win_rate: 48, industry: '政务', is_core_partner: false, cooperation_scope: '大数据平台ISV，智慧城市数据中台专家' },
    { name: '成都四方伟业软件股份有限公司', tier: 'Registered', status: 'Cooperating', type: 'ISV', manager: '杨帆', location: '成都高新区天府软件园', region: '西部', province: '四川', city: '成都市', start_date: '2022-04-01', years: 3, prev_tier: 'Registered', tags: ['ISV','大数据','能源','数据治理'], win_rate: 40, industry: '能源', is_core_partner: false, cooperation_scope: '大数据平台ISV，能源行业数据治理伙伴' },
    { name: '广州赛意信息科技股份有限公司', tier: 'Registered', status: 'Cooperating', type: 'Service', manager: '黄磊', location: '广州天河区软件路', region: '华南', province: '广东', city: '广州市', start_date: '2020-06-15', years: 5, prev_tier: 'Registered', tags: ['Service','制造','实施','MES'], win_rate: 45, industry: '制造', is_core_partner: false, cooperation_scope: '制造行业实施服务伙伴，MES/WMS系统部署' },
    { name: '湖南科创信息技术股份有限公司', tier: 'Registered', status: 'Prospective', type: 'Reseller', manager: '刘刚', location: '长沙岳麓区麓谷企业广场', region: '华中', province: '湖南', city: '长沙市', start_date: '2023-03-10', years: 2, prev_tier: 'Registered', tags: ['Reseller','政务','教育','SMB'], win_rate: 28, industry: '教育', is_core_partner: false, cooperation_scope: '华中区域潜在伙伴，政务教育行业覆盖' },
    { name: '深圳华大智造科技股份有限公司', tier: 'Registered', status: 'Prospective', type: 'Reseller', manager: '钱进', location: '深圳盐田区华大基因基地', region: '华南', province: '广东', city: '深圳市', start_date: '2023-06-01', years: 2, prev_tier: 'Registered', tags: ['Reseller','医疗','生命科学','基因测序'], win_rate: 25, industry: '医疗', is_core_partner: false, cooperation_scope: '生命科学领域潜在伙伴，基因测序设备代理' },
    { name: '北京百分点信息科技有限公司', tier: 'Silver', status: 'Cooperating', type: 'ISV', manager: '张鹏', location: '北京海淀区中关村', region: '华北', province: '北京', city: '北京市', start_date: '2020-01-15', years: 5, prev_tier: 'Registered', tags: ['ISV','大数据','AI','数据智能'], win_rate: 52, industry: '政务', is_core_partner: false, cooperation_scope: '数据智能ISV，政务大数据分析专家' },
    { name: '浙江浙大网新科技股份有限公司', tier: 'Gold', status: 'Cooperating', type: 'SI', manager: '赵阳', location: '杭州西湖区黄姑山路', region: '华东', province: '浙江', city: '杭州市', start_date: '2024-01-15', years: 1, prev_tier: 'Registered', tags: ['SI','政务','教育','智慧城市'], win_rate: 55, industry: '政务', is_core_partner: false, cooperation_scope: '浙江区域SI，智慧城市和政务信息化专家' },
    { name: '南京华苏科技有限公司', tier: 'Silver', status: 'Inactive', type: 'Reseller', manager: '孙鹏', location: '南京建邺区新城科技园', region: '华东', province: '江苏', city: '南京市', start_date: '2021-01-20', years: 4, prev_tier: 'Registered', tags: ['Reseller','教育','SMB','运营商'], win_rate: 32, industry: '教育', is_core_partner: false, cooperation_scope: '教育行业转售商，区域SMB市场覆盖' },
    { name: '深圳云天励飞技术股份有限公司', tier: 'Gold', status: 'Cooperating', type: 'ISV', manager: '陈可', location: '深圳福田区深港科技创新合作区', region: '华南', province: '广东', city: '深圳市', start_date: '2024-03-01', years: 1, prev_tier: 'Registered', tags: ['ISV','AI','智慧城市','安防'], win_rate: 58, industry: '政务', is_core_partner: false, cooperation_scope: 'AI视觉ISV，智慧城市和公共安全专家' },
    { name: '广州广电运通金融电子股份有限公司', tier: 'Silver', status: 'Cooperating', type: 'ISV', manager: '林杰', location: '广州天河区智慧城', region: '华南', province: '广东', city: '广州市', start_date: '2022-08-10', years: 3, prev_tier: 'Registered', tags: ['ISV','金融','AI','智能终端'], win_rate: 48, industry: '金融', is_core_partner: false, cooperation_scope: '金融智能终端ISV，银行AI转型伙伴' },
    { name: '山东半岛信息技术有限公司', tier: 'Silver', status: 'Cooperating', type: 'VAD', manager: '王芳', location: '青岛崂山区苗岭路', region: '华东', province: '山东', city: '青岛市', start_date: '2021-05-10', years: 4, prev_tier: 'Registered', tags: ['VAD','政务','分销','山东半岛'], win_rate: 52, industry: '政务', is_core_partner: false, cooperation_scope: '山东半岛区域VAD，政务云分销专家' },
    { name: '西部矿业信息技术有限公司', tier: 'Silver', status: 'Cooperating', type: 'ISV', manager: '马强', location: '西宁城西区黄河路', region: '西部', province: '青海', city: '西宁市', start_date: '2023-02-15', years: 2, prev_tier: 'Registered', tags: ['ISV','能源','矿业','工业互联网'], win_rate: 45, industry: '能源', is_core_partner: false, cooperation_scope: '矿业信息化ISV，工业互联网解决方案专家' }
  ];

  const { data: insertedPartners, error: partnerError } = await supabase.from('partners').insert(partners).select();
  if (partnerError) {
    console.log('❌ 合作伙伴插入失败:', partnerError.message);
    return;
  }
  console.log(`✅ 成功插入 ${insertedPartners.length} 家合作伙伴\n`);

  // 4. 获取合作伙伴 ID 映射
  const partnerMap = {};
  insertedPartners.forEach(p => partnerMap[p.name] = p.id);

  // 5. 插入联系人
  console.log('👥 插入联系人...');
  const contacts = [
    { partner_id: partnerMap['神州数码集团股份有限公司'], salutation: '先生', last_name: '波', first_name: '高', title: '总经理', department: '管理层', phone: '010-88888801', mobile: '13800138001', email: 'gaobo@digitalchina.com', is_primary: true },
    { partner_id: partnerMap['华为技术有限公司'], salutation: '女士', last_name: '娜', first_name: '李', title: '生态合作总监', department: '生态合作部', phone: '0755-88888801', mobile: '13900139001', email: 'lina@huawei.com', is_primary: true },
    { partner_id: partnerMap['东软集团股份有限公司'], salutation: '先生', last_name: '明', first_name: '陈', title: '副总裁', department: '战略合作部', phone: '024-88888801', mobile: '13700137001', email: 'chenm@neusoft.com', is_primary: true },
    { partner_id: partnerMap['浪潮电子信息产业股份有限公司'], salutation: '先生', last_name: '强', first_name: '王', title: '政务事业部总经理', department: '政务事业部', phone: '0531-88888801', mobile: '13600136001', email: 'wangq@inspur.com', is_primary: true },
    { partner_id: partnerMap['中科软科技股份有限公司'], salutation: '先生', last_name: '洋', first_name: '刘', title: '销售总监', department: '销售部', phone: '010-88888802', mobile: '13500135001', email: 'liuy@sinosoft.com', is_primary: true },
    { partner_id: partnerMap['太极计算机股份有限公司'], salutation: '先生', last_name: '伟', first_name: '张', title: '政务事业部总监', department: '政务事业部', phone: '010-88888803', mobile: '13400134001', email: 'zhangw@taiji.com', is_primary: true },
    { partner_id: partnerMap['软通动力信息技术股份有限公司'], salutation: '先生', last_name: '华', first_name: '赵', title: '金融事业部总监', department: '金融事业部', phone: '010-88888804', mobile: '13300133001', email: 'zhaoh@isoftstone.com', is_primary: true },
    { partner_id: partnerMap['华东医卫云科技术有限公司'], salutation: '先生', last_name: '伟', first_name: '陈', title: '技术总监', department: '技术部', phone: '021-88888801', mobile: '13200132001', email: 'chenw@huadongmedical.com', is_primary: true },
    { partner_id: partnerMap['上海智医信息科技有限公司'], salutation: '先生', last_name: '浩', first_name: '王', title: '销售总监', department: '销售部', phone: '021-88888802', mobile: '13100131001', email: 'wangh@zhimei.com', is_primary: true },
    { partner_id: partnerMap['亚信科技控股有限公司'], salutation: '先生', last_name: '伟', first_name: '周', title: 'CTO', department: '技术部', phone: '010-88888805', mobile: '13000130001', email: 'zhouw@asiainfo.com', is_primary: true },
    { partner_id: partnerMap['中软国际有限公司'], salutation: '先生', last_name: '明', first_name: '吴', title: '交付总监', department: '交付部', phone: '0755-88888802', mobile: '13900139002', email: 'wum@chinasofti.com', is_primary: true },
    { partner_id: partnerMap['深圳云天励飞技术股份有限公司'], salutation: '先生', last_name: '可', first_name: '陈', title: 'CEO', department: '管理层', phone: '0755-88888805', mobile: '13200132003', email: 'chenk@intellif.com', is_primary: true },
    { partner_id: partnerMap['北京百分点信息科技有限公司'], salutation: '女士', last_name: '鹏', first_name: '张', title: '数据智能总经理', department: '数据智能事业部', phone: '010-88888808', mobile: '13500135003', email: 'zhangp@baifendian.com', is_primary: true },
    { partner_id: partnerMap['浙江浙大网新科技股份有限公司'], salutation: '先生', last_name: '阳', first_name: '赵', title: '政务事业部总监', department: '政务事业部', phone: '0571-88888802', mobile: '13400134003', email: 'zhaoyang@inspur.com', is_primary: true },
    { partner_id: partnerMap['杭州数梦工场科技有限公司'], salutation: '先生', last_name: '磊', first_name: '王', title: 'CEO', department: '管理层', phone: '0571-88888801', mobile: '13000130002', email: 'wanglei@datadream.com', is_primary: true }
  ].filter(c => c.partner_id); // 过滤掉没有匹配到 partner_id 的

  await supabase.from('partner_contacts').insert(contacts);
  console.log(`✅ 插入 ${contacts.length} 个联系人\n`);

  // 6. 插入商机
  console.log('💼 插入商机报备...');
  const deals = [
    { title: '2025年萧山区政务云(信创)服务项目', customer: '杭州市萧山区大数据发展管理局', value: 18100000, partner_id: partnerMap['神州数码集团股份有限公司'], partner_name: '神州数码集团股份有限公司', partner_type: 'VAD', status: 'Approved', region: '华东', sales_name: '高波', sales_team: '政务事业部', product_type: '信创云平台', created_date: '2025-06-01', end_date: '2025-12-31', is_priority: true, description: '基于鲲鹏/飞腾架构的信创云服务，替代原有x86云平台' },
    { title: '某省政务云二期扩容及信创改造', customer: '某省大数据局', value: 15000000, partner_id: partnerMap['太极计算机股份有限公司'], partner_name: '太极计算机股份有限公司', partner_type: 'SI', status: 'Pending', region: '华北', sales_name: '张伟', sales_team: '政务事业部', product_type: '信创云平台', created_date: '2025-06-15', end_date: '2026-03-31', is_priority: true, description: '省级政务云平台扩容，新增信创资源池' },
    { title: '上城区智慧医疗云服务项目', customer: '杭州市上城区卫生健康局', value: 12000000, partner_id: partnerMap['华东医卫云科技术有限公司'], partner_name: '华东医卫云科技术有限公司', partner_type: 'ISV', status: 'Approved', region: '华东', sales_name: '陈伟', sales_team: '医疗事业部', product_type: '医疗云平台', created_date: '2025-06-20', end_date: '2025-11-30', is_priority: true, description: '区域医疗云平台建设，覆盖100+基层医疗机构' },
    { title: '某大型三甲医院智慧医院整体解决方案', customer: '某省人民医院', value: 22000000, partner_id: partnerMap['上海智医信息科技有限公司'], partner_name: '上海智医信息科技有限公司', partner_type: 'ISV', status: 'Solution', region: '华东', sales_name: '王浩', sales_team: '医疗事业部', product_type: '智慧医院整体解决方案', created_date: '2025-05-10', end_date: '2026-06-30', is_priority: true, description: '包含HIS、PACS、LIS、HRP等核心系统重构' },
    { title: '阿克苏地区第二人民医院医疗云服务', customer: '阿克苏地区第二人民医院', value: 8500000, partner_id: partnerMap['东软集团股份有限公司'], partner_name: '东软集团股份有限公司', partner_type: 'ISV', status: 'Approved', region: '西部', sales_name: '陈明', sales_team: '医疗事业部', product_type: '医疗云服务', created_date: '2025-04-15', end_date: '2025-10-31', is_priority: false, description: '边疆地区医院上云改造' },
    { title: '心血管病高质量数据集建设项目', customer: '国家心血管病中心', value: 13000000, partner_id: partnerMap['华为技术有限公司'], partner_name: '华为技术有限公司', partner_type: 'OEM', status: 'Commercial', region: '华北', sales_name: '李娜', sales_team: '医疗事业部', product_type: '医疗AI平台', created_date: '2025-07-01', end_date: '2026-06-30', is_priority: true, description: '高质量数据集建设，包含影像数据标注和AI模型训练' },
    { title: '某头部保险企业核心系统云化迁移', customer: '中国平安保险集团', value: 9800000, partner_id: partnerMap['中科软科技股份有限公司'], partner_name: '中科软科技股份有限公司', partner_type: 'ISV', status: 'Approved', region: '华南', sales_name: '刘洋', sales_team: '金融事业部', product_type: '金融云平台', created_date: '2025-03-20', end_date: '2025-12-31', is_priority: true, has_conflict: true, description: '保险核心系统迁移至金融云平台' },
    { title: '招商银行分布式核心系统改造', customer: '招商银行股份有限公司', value: 12000000, partner_id: partnerMap['软通动力信息技术股份有限公司'], partner_name: '软通动力信息技术股份有限公司', partner_type: 'SI', status: 'Negotiation', region: '华南', sales_name: '赵华', sales_team: '金融事业部', product_type: '分布式核心系统', created_date: '2025-05-25', end_date: '2026-03-31', is_priority: true, description: '银行核心系统分布式改造' },
    { title: '某省会城市智慧城市数据中台', customer: '某市大数据发展管理局', value: 18000000, partner_id: partnerMap['杭州数梦工场科技有限公司'], partner_name: '杭州数梦工场科技有限公司', partner_type: 'ISV', status: 'Solution', region: '华东', sales_name: '王磊', sales_team: '智慧城市事业部', product_type: '数据中台', created_date: '2025-04-20', end_date: '2026-01-31', is_priority: true, description: '城市数据资源池建设，打通50+部门数据壁垒' },
    { title: '深圳福田区智慧城区AI视觉系统', customer: '深圳市福田区政务服务数据管理局', value: 9500000, partner_id: partnerMap['深圳云天励飞技术股份有限公司'], partner_name: '深圳云天励飞技术股份有限公司', partner_type: 'ISV', status: 'Approved', region: '华南', sales_name: '陈可', sales_team: '智慧城市事业部', product_type: 'AI视觉平台', created_date: '2025-06-05', end_date: '2025-12-31', is_priority: true, description: '城区级视频AI分析系统，覆盖10000路视频监控' },
    { title: '国家电网数据安全合规改造', customer: '国家电网有限公司', value: 8500000, partner_id: partnerMap['神州数码集团股份有限公司'], partner_name: '神州数码集团股份有限公司', partner_type: 'VAD', status: 'ClosedWon', region: '华北', sales_name: '高波', sales_team: '能源事业部', product_type: '安全合规', created_date: '2024-11-10', end_date: '2025-06-30', is_priority: true, description: '电网关键基础设施安全改造' },
    { title: '宝武钢铁工业互联网平台', customer: '宝武钢铁集团有限公司', value: 9200000, partner_id: partnerMap['上海宝信软件股份有限公司'], partner_name: '上海宝信软件股份有限公司', partner_type: 'ISV', status: 'Solution', region: '华东', sales_name: '陈强', sales_team: '制造事业部', product_type: '工业互联网平台', created_date: '2025-05-30', end_date: '2026-02-28', is_priority: true, description: '钢铁行业工业互联网平台' },
    { title: '某省政务数据库信创替代项目', customer: '某省大数据中心', value: 7200000, partner_id: partnerMap['武汉达梦数据库股份有限公司'], partner_name: '武汉达梦数据库股份有限公司', partner_type: 'ISV', status: 'Approved', region: '华中', sales_name: '郑涛', sales_team: '信创事业部', product_type: '国产数据库', created_date: '2025-03-15', end_date: '2025-09-30', is_priority: true, description: 'Oracle/MySQL至国产数据库迁移' },
    { title: '中国移动5G核心网优化项目', customer: '中国移动通信集团有限公司', value: 11500000, partner_id: partnerMap['亚信科技控股有限公司'], partner_name: '亚信科技控股有限公司', partner_type: 'ISV', status: 'Negotiation', region: '华北', sales_name: '周伟', sales_team: '通信事业部', product_type: '5G核心网', created_date: '2025-04-28', end_date: '2025-12-31', is_priority: true, description: '5G核心网功能升级' },
    { title: '某市政府12345热线智能升级', customer: '某市市民服务热线中心', value: 4200000, partner_id: partnerMap['北京百分点信息科技有限公司'], partner_name: '北京百分点信息科技有限公司', partner_type: 'ISV', status: 'Approved', region: '华北', sales_name: '张鹏', sales_team: '智慧城市事业部', product_type: 'AI智能客服', created_date: '2025-06-28', end_date: '2025-10-31', is_priority: false, description: '政务热线智能升级' }
  ].filter(d => d.partner_id);

  const { data: insertedDeals } = await supabase.from('deals').insert(deals).select();
  console.log(`✅ 插入 ${insertedDeals?.length || deals.length} 个商机报备\n`);

  // 7. 插入激励计划
  console.log('🎯 插入激励计划...');
  const incentivePrograms = [
    { title: 'Q3医疗行业数字化转型激励计划', trigger_type: 'Pipeline Gap', status: 'Active', payout_type: 'Rebate', total_budget: 3000000, claimed_amount: 1250000, participants_count: 38, description: '针对医疗行业新增报备商机：新增报备奖励1%，方案入围额外奖励2%，成功签约额外奖励3%', start_date: '2025-07-01', end_date: '2025-09-30' },
    { title: 'AI新品首发合作伙伴激励', trigger_type: 'New Product', status: 'Active', payout_type: 'Cash', total_budget: 2000000, claimed_amount: 680000, participants_count: 25, description: '首单AI产品奖励渠道经理5万元/单', start_date: '2025-06-15', end_date: '2025-09-15' },
    { title: '信创替代竞争性激励计划', trigger_type: 'Competitive', status: 'Active', payout_type: 'Rebate', total_budget: 5000000, claimed_amount: 2100000, participants_count: 45, description: '国产化替代专项激励：基础返点12%，超过1000万项目15%', start_date: '2025-07-01', end_date: '2025-12-31' },
    { title: 'Q2渠道开门红激励', trigger_type: 'Sales Acceleration', status: 'Ended', payout_type: 'Cash', total_budget: 5000000, claimed_amount: 4850000, participants_count: 120, description: 'Q2季度新签约合作伙伴专项激励', start_date: '2025-04-01', end_date: '2025-06-30' },
    { title: 'H2业绩冲刺激励计划', trigger_type: 'Sales Acceleration', status: 'Upcoming', payout_type: 'Rebate', total_budget: 4000000, claimed_amount: 0, participants_count: 0, description: '2025下半年业绩冲刺激励', start_date: '2025-10-01', end_date: '2025-12-31' },
    { title: '合作伙伴能力提升激励', trigger_type: 'New Product', status: 'Active', payout_type: 'Points', total_budget: 800000, claimed_amount: 320000, participants_count: 65, description: '赋能认证专项激励', start_date: '2025-04-01', end_date: '2025-12-31' },
    { title: '金融科技数字化转型激励', trigger_type: 'Pipeline Gap', status: 'Active', payout_type: 'Rebate', total_budget: 2500000, claimed_amount: 980000, participants_count: 28, description: '金融行业专项激励', start_date: '2025-06-01', end_date: '2025-11-30' },
    { title: '智慧城市合作伙伴专项', trigger_type: 'Sales Acceleration', status: 'Active', payout_type: 'Rebate', total_budget: 3500000, claimed_amount: 1450000, participants_count: 35, description: '智慧城市/政务数字化专项', start_date: '2025-05-01', end_date: '2025-10-31' }
  ];

  await supabase.from('incentive_programs').insert(incentivePrograms);
  console.log(`✅ 插入 ${incentivePrograms.length} 个激励计划\n`);

  // 8. 插入 MDF 配额
  console.log('💰 插入 MDF 配额...');
  const mdfAllocations = [
    { partner_id: partnerMap['神州数码集团股份有限公司'], partner_name: '神州数码集团股份有限公司', quarter: '2025 Q3', amount: 1200000, status: 'used', applications: 4, approved_apps: 3 },
    { partner_id: partnerMap['华为技术有限公司'], partner_name: '华为技术有限公司', quarter: '2025 Q3', amount: 1000000, status: 'used', applications: 3, approved_apps: 3 },
    { partner_id: partnerMap['东软集团股份有限公司'], partner_name: '东软集团股份有限公司', quarter: '2025 Q3', amount: 800000, status: 'used', applications: 3, approved_apps: 2 },
    { partner_id: partnerMap['浪潮电子信息产业股份有限公司'], partner_name: '浪潮电子信息产业股份有限公司', quarter: '2025 Q3', amount: 800000, status: 'allocated', applications: 2, approved_apps: 2 },
    { partner_id: partnerMap['太极计算机股份有限公司'], partner_name: '太极计算机股份有限公司', quarter: '2025 Q3', amount: 600000, status: 'used', applications: 3, approved_apps: 2 },
    { partner_id: partnerMap['中科软科技股份有限公司'], partner_name: '中科软科技股份有限公司', quarter: '2025 Q3', amount: 600000, status: 'used', applications: 2, approved_apps: 2 },
    { partner_id: partnerMap['软通动力信息技术股份有限公司'], partner_name: '软通动力信息技术股份有限公司', quarter: '2025 Q3', amount: 500000, status: 'allocated', applications: 2, approved_apps: 2 },
    { partner_id: partnerMap['华东医卫云科技术有限公司'], partner_name: '华东医卫云科技术有限公司', quarter: '2025 Q3', amount: 500000, status: 'available', applications: 1, approved_apps: 1 },
    { partner_id: partnerMap['上海智医信息科技有限公司'], partner_name: '上海智医信息科技有限公司', quarter: '2025 Q3', amount: 400000, status: 'used', applications: 2, approved_apps: 2 },
    { partner_id: partnerMap['亚信科技控股有限公司'], partner_name: '亚信科技控股有限公司', quarter: '2025 Q3', amount: 400000, status: 'allocated', applications: 1, approved_apps: 1 }
  ].filter(m => m.partner_id);

  await supabase.from('mdf_allocations').insert(mdfAllocations);
  console.log(`✅ 插入 ${mdfAllocations.length} 个 MDF 配额\n`);

  // 9. 插入营销活动
  console.log('📣 插入营销活动...');
  const marketingActivities = [
    { name: '2025华为全联接大会合作伙伴专场', type: '行业大会', event_date: '2025-09-19', status: 'Planning', budget: 800000, actual_spend: 0, leads_generated: 0, progress: 10 },
    { name: '金融科技数字化转型高峰论坛', type: '行业峰会', event_date: '2025-08-28', status: 'In Progress', budget: 450000, actual_spend: 320000, leads_generated: 38, progress: 65 },
    { name: '医疗行业智慧医院建设研讨会', type: '行业沙龙', event_date: '2025-09-12', status: 'Planning', budget: 280000, actual_spend: 85000, leads_generated: 15, progress: 30 },
    { name: '信创政务云合作伙伴招募会', type: '渠道招募', event_date: '2025-08-15', status: 'Planning', budget: 350000, actual_spend: 120000, leads_generated: 45, progress: 40 },
    { name: 'AI新品发布会暨生态伙伴大会', type: '新品发布', event_date: '2025-07-25', status: 'Completed', budget: 600000, actual_spend: 585000, leads_generated: 86, progress: 100 },
    { name: '智慧城市数据中台技术培训', type: '赋能培训', event_date: '2025-08-20', status: 'In Progress', budget: 180000, actual_spend: 165000, leads_generated: 52, progress: 85 },
    { name: '能源行业数字化转型论坛', type: '行业论坛', event_date: '2025-10-15', status: 'Planning', budget: 380000, actual_spend: 0, leads_generated: 0, progress: 5 },
    { name: '制造业工业互联网实践分享会', type: '行业沙龙', event_date: '2025-09-05', status: 'In Progress', budget: 220000, actual_spend: 180000, leads_generated: 28, progress: 75 },
    { name: 'Q3合作伙伴赋能季启动仪式', type: '渠道活动', event_date: '2025-07-01', status: 'Completed', budget: 150000, actual_spend: 148000, leads_generated: 120, progress: 100 },
    { name: '西部区域渠道合作伙伴大会', type: '渠道大会', event_date: '2025-10-22', status: 'Planning', budget: 420000, actual_spend: 0, leads_generated: 0, progress: 15 }
  ];

  await supabase.from('marketing_activities').insert(marketingActivities);
  console.log(`✅ 插入 ${marketingActivities.length} 个营销活动\n`);

  // 10. 插入小程序礼品
  console.log('🎁 插入小程序礼品...');
  const mpGifts = [
    { name: 'VeloCloud定制商务笔记本套装', cost: 50, stock: 100, image_url: 'notebook' },
    { name: '品牌无线蓝牙耳机', cost: 200, stock: 30, image_url: 'headphones' },
    { name: '技术类精选书籍套装', cost: 300, stock: 20, image_url: 'books' },
    { name: '云平台代金券 ¥500', cost: 500, stock: 50, image_url: 'voucher' },
    { name: '行业峰会VIP门票', cost: 1000, stock: 15, image_url: 'ticket' },
    { name: '品牌定制双肩电脑包', cost: 400, stock: 25, image_url: 'backpack' }
  ];

  await supabase.from('mp_gifts').insert(mpGifts);
  console.log(`✅ 插入 ${mpGifts.length} 个小程序礼品\n`);

  // 完成
  console.log('════════════════════════════════════════════════════════════');
  console.log('🎉 真实业务数据填充完成！');
  console.log('════════════════════════════════════════════════════════════');
  console.log('数据概览:');
  console.log('  - 合作伙伴: 31家');
  console.log('  - 商机报备: 15个');
  console.log('  - 激励计划: 8个');
  console.log('  - MDF配额: 10个');
  console.log('  - 营销活动: 10个');
  console.log('  - 小程序礼品: 6个');
  console.log('════════════════════════════════════════════════════════════');
  console.log('\n请刷新页面 https://partner.velolabs.top 查看效果\n');
}

main().catch(console.error);
