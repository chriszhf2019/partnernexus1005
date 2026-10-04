/**
 * 执行2026年演示数据生成
 * 直接连接Supabase数据库插入数据
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ndcpzswdyhcjfdiobbgm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kY3B6c3dkeWhjamZkaW9iYmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwMTkyMTUsImV4cCI6MjA1MzU5NTIxNX0.XJmlQdwKcMRy7Id9lh4tK5JlIMflRqhRIML1qW0K8dM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed2026Data() {
  console.log('🚀 开始生成2026年演示数据...\n');

  try {
    // 1. 清空现有商机数据
    console.log('📦 步骤1: 清空现有商机数据...');
    const { error: deleteLifecycleError } = await supabase.from('deal_lifecycle_events').delete().neq('id', 0);
    if (deleteLifecycleError) console.log('  - deal_lifecycle_events 清空完成');
    
    const { error: deleteDealsError } = await supabase.from('deals').delete().neq('id', 0);
    if (deleteDealsError) {
      console.error('  - 清空deals失败:', deleteDealsError.message);
    } else {
      console.log('  ✅ deals 表已清空\n');
    }

    // 2. 获取合作伙伴列表
    console.log('📋 步骤2: 获取合作伙伴列表...');
    const { data: partners, error: partnersError } = await supabase.from('partners').select('id, name, region, tier');
    if (partnersError) {
      console.error('  ❌ 获取伙伴失败:', partnersError.message);
      return;
    }
    console.log(`  ✅ 获取到 ${partners.length} 个伙伴\n`);
    
    // 创建伙伴名称到ID的映射
    const partnerMap = {};
    partners.forEach(p => { partnerMap[p.name] = p.id; });
    
    // 3. 插入Q1-Q2成交商机
    console.log('💰 步骤3: 插入2026年Q1-Q2成交商机...');
    
    const closedWonDeals = [
      // Q1成交 - 华北
      { title: '2026年北京市政务云扩容项目', customer: '北京市经济和信息化局', value: 2800000, partner_id: partnerMap['神州数码集团股份有限公司'], partner_name: '神州数码集团股份有限公司', partner_type: 'VAD', status: 'ClosedWon', stage: 'ClosedWon', region: '华北', sales_name: '高波', sales_team: '政务事业部', product_type: '信创云平台', created_date: '2026-01-05', end_date: '2026-03-15', is_priority: true, has_conflict: false, description: 'Q1成交：北京市政务云平台扩容，覆盖50+委办局' },
      { title: '某国有银行核心系统云化项目', customer: '中国工商银行数据中心', value: 3500000, partner_id: partnerMap['中科软科技股份有限公司'], partner_name: '中科软科技股份有限公司', partner_type: 'ISV', status: 'ClosedWon', stage: 'ClosedWon', region: '华北', sales_name: '刘洋', sales_team: '金融事业部', product_type: '金融云平台', created_date: '2026-01-15', end_date: '2026-03-20', is_priority: true, has_conflict: false, description: 'Q1成交：银行核心系统迁移至金融云平台' },
      { title: '某省政务大数据平台一期', customer: '某省大数据发展中心', value: 2200000, partner_id: partnerMap['太极计算机股份有限公司'], partner_name: '太极计算机股份有限公司', partner_type: 'SI', status: 'ClosedWon', stage: 'ClosedWon', region: '华北', sales_name: '张伟', sales_team: '政务事业部', product_type: '大数据平台', created_date: '2026-02-01', end_date: '2026-03-25', is_priority: true, has_conflict: false, description: 'Q1成交：省级政务数据中台建设' },
      // Q1成交 - 华东
      { title: '上海市医疗云平台建设项目', customer: '上海市卫生健康委员会', value: 4200000, partner_id: partnerMap['华东医卫云科技术有限公司'], partner_name: '华东医卫云科技术有限公司', partner_type: 'ISV', status: 'ClosedWon', stage: 'ClosedWon', region: '华东', sales_name: '陈伟', sales_team: '医疗事业部', product_type: '医疗云平台', created_date: '2026-01-10', end_date: '2026-03-30', is_priority: true, has_conflict: false, description: 'Q1成交：区域医疗云平台，覆盖200+医疗机构' },
      { title: '某头部券商数据中台项目', customer: '中信证券股份有限公司', value: 1800000, partner_id: partnerMap['软通动力信息技术股份有限公司'], partner_name: '软通动力信息技术股份有限公司', partner_type: 'SI', status: 'ClosedWon', stage: 'ClosedWon', region: '华东', sales_name: '赵华', sales_team: '金融事业部', product_type: '数据中台', created_date: '2026-02-15', end_date: '2026-03-28', is_priority: true, has_conflict: false, description: 'Q1成交：券商数据中台建设' },
      // Q1成交 - 华南
      { title: '深圳市智慧城市数据治理项目', customer: '深圳市政务服务数据管理局', value: 3100000, partner_id: partnerMap['华为技术有限公司'], partner_name: '华为技术有限公司', partner_type: 'OEM', status: 'ClosedWon', stage: 'ClosedWon', region: '华南', sales_name: '李娜', sales_team: '智慧城市事业部', product_type: '数据治理平台', created_date: '2026-01-20', end_date: '2026-03-18', is_priority: true, has_conflict: false, description: 'Q1成交：城市数据资产治理与共享平台' },
      { title: '广东省人民医院智慧医院项目', customer: '广东省人民医院', value: 2600000, partner_id: partnerMap['广州广电运通金融电子股份有限公司'], partner_name: '广州广电运通金融电子股份有限公司', partner_type: 'ISV', status: 'ClosedWon', stage: 'ClosedWon', region: '华南', sales_name: '林杰', sales_team: '医疗事业部', product_type: '智慧医院整体解决方案', created_date: '2026-02-20', end_date: '2026-03-25', is_priority: true, has_conflict: false, description: 'Q1成交：三甲医院智慧医院整体建设' },
      // Q1成交 - 西部
      { title: '四川省政务云信创改造项目', customer: '四川省大数据发展管理局', value: 1950000, partner_id: partnerMap['成都四方伟业软件股份有限公司'], partner_name: '成都四方伟业软件股份有限公司', partner_type: 'ISV', status: 'ClosedWon', stage: 'ClosedWon', region: '西部', sales_name: '杨帆', sales_team: '政务事业部', product_type: '信创云平台', created_date: '2026-01-25', end_date: '2026-03-20', is_priority: true, has_conflict: false, description: 'Q1成交：省级政务云信创替代' },
      // Q2成交 - 华北
      { title: '某省政务云二期扩容项目', customer: '某省大数据局', value: 3200000, partner_id: partnerMap['神州数码集团股份有限公司'], partner_name: '神州数码集团股份有限公司', partner_type: 'VAD', status: 'ClosedWon', stage: 'ClosedWon', region: '华北', sales_name: '高波', sales_team: '政务事业部', product_type: '信创云平台', created_date: '2026-04-05', end_date: '2026-06-10', is_priority: true, has_conflict: false, description: 'Q2成交：政务云平台扩容，新增信创资源池' },
      { title: '某头部保险核心系统云化', customer: '中国人寿保险股份有限公司', value: 2900000, partner_id: partnerMap['中科软科技股份有限公司'], partner_name: '中科软科技股份有限公司', partner_type: 'ISV', status: 'ClosedWon', stage: 'ClosedWon', region: '华北', sales_name: '刘洋', sales_team: '金融事业部', product_type: '金融云平台', created_date: '2026-04-12', end_date: '2026-06-15', is_priority: true, has_conflict: false, description: 'Q2成交：保险核心系统迁移' },
      { title: '某三甲医院DRG分组系统项目', customer: '北京某三甲医院', value: 1500000, partner_id: partnerMap['东软集团股份有限公司'], partner_name: '东软集团股份有限公司', partner_type: 'ISV', status: 'ClosedWon', stage: 'ClosedWon', region: '华北', sales_name: '陈明', sales_team: '医疗事业部', product_type: '医疗信息化', created_date: '2026-05-10', end_date: '2026-06-20', is_priority: true, has_conflict: false, description: 'Q2成交：医院DRG医保支付改革系统' },
      // Q2成交 - 华东
      { title: '浙江省智慧城市数据中台', customer: '浙江省大数据发展管理局', value: 3800000, partner_id: partnerMap['浙江浙大网新科技股份有限公司'], partner_name: '浙江浙大网新科技股份有限公司', partner_type: 'SI', status: 'ClosedWon', stage: 'ClosedWon', region: '华东', sales_name: '赵阳', sales_team: '智慧城市事业部', product_type: '数据中台', created_date: '2026-04-08', end_date: '2026-06-18', is_priority: true, has_conflict: false, description: 'Q2成交：省级智慧城市数据中台' },
      { title: '上海市某区智慧养老项目', customer: '上海市某区民政局', value: 1650000, partner_id: partnerMap['上海智医信息科技有限公司'], partner_name: '上海智医信息科技有限公司', partner_type: 'ISV', status: 'ClosedWon', stage: 'ClosedWon', region: '华东', sales_name: '王浩', sales_team: '医疗事业部', product_type: '智慧养老平台', created_date: '2026-05-15', end_date: '2026-06-25', is_priority: true, has_conflict: false, description: 'Q2成交：智慧养老服务管理平台' },
      { title: '某钢铁集团数据安全项目', customer: '宝武钢铁集团有限公司', value: 2100000, partner_id: partnerMap['上海宝信软件股份有限公司'], partner_name: '上海宝信软件股份有限公司', partner_type: 'ISV', status: 'ClosedWon', stage: 'ClosedWon', region: '华东', sales_name: '陈强', sales_team: '制造事业部', product_type: '数据安全', created_date: '2026-04-20', end_date: '2026-06-22', is_priority: true, has_conflict: false, description: 'Q2成交：钢铁集团数据安全合规建设' },
      // Q2成交 - 华南
      { title: '深圳市某区智慧应急指挥系统', customer: '深圳市应急管理局', value: 2350000, partner_id: partnerMap['深圳云天励飞技术股份有限公司'], partner_name: '深圳云天励飞技术股份有限公司', partner_type: 'ISV', status: 'ClosedWon', stage: 'ClosedWon', region: '华南', sales_name: '陈可', sales_team: '智慧城市事业部', product_type: 'AI视觉平台', created_date: '2026-04-10', end_date: '2026-06-12', is_priority: true, has_conflict: false, description: 'Q2成交：应急指挥AI视觉系统' },
      { title: '某省农村信用社金融云项目', customer: '某省农村信用社联合社', value: 2450000, partner_id: partnerMap['中软国际有限公司'], partner_name: '中软国际有限公司', partner_type: 'Service', status: 'ClosedWon', stage: 'ClosedWon', region: '华南', sales_name: '吴明', sales_team: '金融事业部', product_type: '金融云平台', created_date: '2026-05-08', end_date: '2026-06-20', is_priority: true, has_conflict: false, description: 'Q2成交：农信社核心系统云化' },
    ];

    const { error: insertWonError } = await supabase.from('deals').insert(closedWonDeals);
    if (insertWonError) {
      console.error('  ❌ 插入成交商机失败:', insertWonError.message);
      return;
    }
    console.log(`  ✅ 插入 ${closedWonDeals.length} 条成交商机\n`);

    // 4. 插入进行中商机（Pipeline）
    console.log('📊 步骤4: 插入进行中商机...');
    
    const openDeals = [
      { title: '某市政务云三期建设（信创型）', customer: '某市大数据发展管理局', value: 4500000, partner_id: partnerMap['太极计算机股份有限公司'], partner_name: '太极计算机股份有限公司', partner_type: 'SI', status: 'Negotiation', stage: 'Negotiation', region: '华北', sales_name: '张伟', sales_team: '政务事业部', product_type: '信创云平台', created_date: '2026-05-01', end_date: '2026-09-30', is_priority: true, has_conflict: false, description: 'Q2跟进中：第三期信创政务云建设' },
      { title: '某省医保信息平台升级项目', customer: '某省医疗保障局', value: 2800000, partner_id: partnerMap['东软集团股份有限公司'], partner_name: '东软集团股份有限公司', partner_type: 'ISV', status: 'Commercial', stage: 'Commercial', region: '华北', sales_name: '陈明', sales_team: '医疗事业部', product_type: '医疗信息化', created_date: '2026-05-20', end_date: '2026-10-31', is_priority: true, has_conflict: false, description: 'Q2跟进中：医保信息系统升级' },
      { title: '某头部车企数据中台项目', customer: '某知名汽车制造商', value: 5500000, partner_id: partnerMap['用友网络科技股份有限公司'], partner_name: '用友网络科技股份有限公司', partner_type: 'ISV', status: 'Solution', stage: 'Solution', region: '华东', sales_name: '林芳', sales_team: '制造事业部', product_type: '数据中台', created_date: '2026-04-15', end_date: '2026-11-30', is_priority: true, has_conflict: false, description: 'Q2跟进中：车企数字化转型数据平台' },
      { title: '某省教育云平台扩容项目', customer: '某省教育厅', value: 3200000, partner_id: partnerMap['浙江浙大网新科技股份有限公司'], partner_name: '浙江浙大网新科技股份有限公司', partner_type: 'SI', status: 'Proposal', stage: 'Proposal', region: '华东', sales_name: '赵阳', sales_team: '教育事业部', product_type: '教育云平台', created_date: '2026-05-10', end_date: '2026-10-15', is_priority: true, has_conflict: false, description: 'Q2跟进中：教育云平台扩容' },
      { title: '某省智慧监狱安防系统', customer: '某省监狱管理局', value: 3800000, partner_id: partnerMap['深圳云天励飞技术股份有限公司'], partner_name: '深圳云天励飞技术股份有限公司', partner_type: 'ISV', status: 'Qualification', stage: 'Qualification', region: '华南', sales_name: '陈可', sales_team: '智慧城市事业部', product_type: 'AI视觉平台', created_date: '2026-05-25', end_date: '2026-11-30', is_priority: true, has_conflict: false, description: 'Q2跟进中：智慧监狱安防系统' },
      { title: '某股份银行AI风控系统', customer: '某股份制商业银行', value: 4200000, partner_id: partnerMap['华为技术有限公司'], partner_name: '华为技术有限公司', partner_type: 'OEM', status: 'Proposal', stage: 'Proposal', region: '华南', sales_name: '李娜', sales_team: '金融事业部', product_type: 'AI风控平台', created_date: '2026-04-20', end_date: '2026-09-30', is_priority: true, has_conflict: false, description: 'Q2跟进中：银行AI智能风控平台' },
      { title: '某省能源集团工业互联网平台', customer: '某省能源投资集团', value: 4800000, partner_id: partnerMap['西部矿业信息技术有限公司'], partner_name: '西部矿业信息技术有限公司', partner_type: 'ISV', status: 'Solution', stage: 'Solution', region: '西部', sales_name: '马强', sales_team: '能源事业部', product_type: '工业互联网平台', created_date: '2026-05-05', end_date: '2026-12-31', is_priority: true, has_conflict: false, description: 'Q2跟进中：能源集团工业互联网建设' },
      // 线索阶段
      { title: '某市智慧交通项目（潜在）', customer: '某市交通运输局', value: 3500000, partner_id: partnerMap['杭州数梦工场科技有限公司'], partner_name: '杭州数梦工场科技有限公司', partner_type: 'ISV', status: 'Lead', stage: 'Lead', region: '华东', sales_name: '王磊', sales_team: '智慧城市事业部', product_type: '智慧交通平台', created_date: '2026-06-01', end_date: '2026-12-31', is_priority: false, has_conflict: false, description: '线索阶段：智慧交通顶层规划' },
      { title: '某省医疗保障局数据平台', customer: '某省医疗保障局', value: 2200000, partner_id: partnerMap['华东医卫云科技术有限公司'], partner_name: '华东医卫云科技术有限公司', partner_type: 'ISV', status: 'Prospect', stage: 'Prospect', region: '华东', sales_name: '陈伟', sales_team: '医疗事业部', product_type: '医疗数据平台', created_date: '2026-06-10', end_date: '2026-12-31', is_priority: false, has_conflict: false, description: '线索阶段：医保数据治理平台' },
    ];

    const { error: insertOpenError } = await supabase.from('deals').insert(openDeals);
    if (insertOpenError) {
      console.error('  ❌ 插入进行中商机失败:', insertOpenError.message);
      return;
    }
    console.log(`  ✅ 插入 ${openDeals.length} 条进行中商机\n`);

    // 5. 插入流失商机
    console.log('❌ 步骤5: 插入流失商机...');
    
    const lostDeal = {
      title: '某中小企业云化项目（流失）', customer: '某制造企业', value: 800000, partner_id: partnerMap['北京华宇信息技术有限公司'], partner_name: '北京华宇信息技术有限公司', partner_type: 'Reseller', status: 'ClosedLost', stage: 'ClosedLost', region: '华北', sales_name: '李明', sales_team: 'SMB事业部', product_type: '企业云', created_date: '2026-03-01', end_date: '2026-05-31', is_priority: false, has_conflict: false, description: '流失：客户预算缩减，项目暂停'
    };

    const { error: insertLostError } = await supabase.from('deals').insert(lostDeal);
    if (insertLostError) {
      console.error('  ❌ 插入流失商机失败:', insertLostError.message);
      return;
    }
    console.log(`  ✅ 插入 1 条流失商机\n`);

    // 6. 验证数据
    console.log('📈 步骤6: 验证数据...\n');
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('deals')
      .select('stage, value')
      .eq('created_date', '2026-01-05');
    
    if (!verifyError) {
      // 统计各状态数量和金额
      const { data: allDeals } = await supabase.from('deals').select('stage, value');
      
      const stats = {};
      allDeals.forEach(d => {
        if (!stats[d.stage]) { stats[d.stage] = { count: 0, value: 0 }; }
        stats[d.stage].count++;
        stats[d.stage].value += d.value;
      });
      
      console.log('  📊 各状态商机统计:');
      Object.keys(stats).forEach(stage => {
        console.log(`    - ${stage}: ${stats[stage].count}笔, ¥${(stats[stage].value/10000).toFixed(0)}万`);
      });
      
      const wonValue = stats['ClosedWon']?.value || 0;
      const openValue = Object.keys(stats)
        .filter(k => k !== 'ClosedWon' && k !== 'ClosedLost')
        .reduce((sum, k) => sum + stats[k].value, 0);
      
      console.log(`\n  💵 Q1-Q2 成交总额: ¥${(wonValue/10000).toFixed(0)}万`);
      console.log(`  📊 Pipeline储备: ¥${(openValue/10000).toFixed(0)}万`);
    }

    console.log('\n✅ 2026年演示数据生成完成！\n');
    console.log('现在刷新 EcosystemDashboard 页面即可看到真实数据。');

  } catch (error) {
    console.error('❌ 执行失败:', error.message);
  }
}

seed2026Data();
