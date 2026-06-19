-- ═══════════════════════════════════════════════════════════════════════════
-- PartnerNexus 真实业务数据 - 直接执行版
-- 复制以下所有内容到 Supabase Dashboard → SQL Editor 执行
-- 
-- 访问: https://supabase.com/dashboard/project/ezkbjufluczpxdixplxu/sql/new
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. 清空现有数据
TRUNCATE TABLE mp_orders, mp_scores, mp_users, mp_gifts, mp_events, deal_lifecycle_events, deals, pmdf_applications, mdf_allocations, marketing_activities, incentive_applications, incentive_programs, partner_contacts, partners, settings, market_benchmarks, partner_activity_logs CASCADE;

-- 2. 全局配置
INSERT INTO settings (id, data) VALUES ('global', '{
  "currency": "CNY",
  "regions": ["华北", "华东", "华南", "华中", "西部", "东北", "西南"],
  "industries": ["金融", "医疗", "政务", "制造", "教育", "能源", "互联网", "通信"],
  "partnerTiers": ["Diamond", "Platinum", "Gold", "Silver", "Registered"],
  "partnerTypes": ["Reseller", "ISV", "OEM", "Service", "VAD", "VAR", "SI"],
  "partnerStatuses": ["Cooperating", "Inactive", "Prospective", "Rejected"],
  "salesStages": ["Registered", "Solution", "Commercial", "Negotiation", "ClosedWon", "ClosedLost"],
  "companyName": "VeloCloud 渠道管理平台",
  "companyNameEn": "VeloCloud Partner Management",
  "companyAddress": "北京市朝阳区望京科技园A座20层",
  "companyPhone": "400-888-6666",
  "companyEmail": "partner@velolabs.top"
}');

-- 3. 合作伙伴 (31家)
INSERT INTO partners (name, tier, status, type, manager, location, region, province, city, start_date, years, prev_tier, tags, win_rate, industry, is_core_partner, cooperation_scope) VALUES
('神州数码集团股份有限公司', 'Platinum', 'Cooperating', 'VAD', '高波', '北京海淀区中关村大街1号', '华北', '北京', '北京市', '2018-03-15', 7, 'Gold', ARRAY['VAD','信创','全国覆盖','金融'], 72, '金融', true, '全国总代理，覆盖金融、政务、医疗三大行业'),
('华为技术有限公司', 'Diamond', 'Cooperating', 'OEM', '李娜', '深圳市龙岗区华为总部', '华南', '广东', '深圳市', '2016-05-01', 9, 'Diamond', ARRAY['OEM','全行业','全球覆盖','5G'], 75, '制造', true, '全行业基础设施伙伴，联合产品定义参与方'),
('东软集团股份有限公司', 'Platinum', 'Cooperating', 'ISV', '陈明', '沈阳市浑南区东软软件园', '华北', '辽宁', '沈阳市', '2017-06-01', 8, 'Gold', ARRAY['ISV','医疗行业','信创入围'], 68, '医疗', true, '医疗行业核心ISV，具备全院级解决方案交付能力'),
('浪潮电子信息产业股份有限公司', 'Diamond', 'Cooperating', 'OEM', '王强', '济南市高新区浪潮路1036号', '华东', '山东', '济南市', '2017-01-10', 8, 'Platinum', ARRAY['OEM','政务','制造','信创'], 70, '政务', true, '政务云基础设施核心伙伴，全国交付能力'),
('中科软科技股份有限公司', 'Gold', 'Cooperating', 'ISV', '刘洋', '北京中关村软件园', '华北', '北京', '北京市', '2018-09-20', 7, 'Silver', ARRAY['ISV','金融','保险行业'], 65, '金融', true, '金融保险行业ISV，核心系统迁移专家'),
('太极计算机股份有限公司', 'Gold', 'Cooperating', 'SI', '张伟', '北京海淀区信息路18号', '华北', '北京', '北京市', '2017-11-20', 7, 'Silver', ARRAY['SI','政务','信创'], 63, '政务', true, '政务行业SI，信创替代项目核心交付方'),
('软通动力信息技术股份有限公司', 'Gold', 'Cooperating', 'SI', '赵华', '北京朝阳区酒仙桥', '华北', '北京', '北京市', '2019-02-15', 6, 'Silver', ARRAY['SI','金融','互联网'], 62, '金融', false, '金融行业SI，核心业务系统集成能力'),
('华东医卫云科技术有限公司', 'Gold', 'Cooperating', 'ISV', '陈伟', '上海浦东新区张江高科技园区', '华东', '上海', '上海市', '2019-03-15', 6, 'Silver', ARRAY['ISV','医疗行业','信创','AI'], 65, '医疗', true, '医疗行业核心ISV，全院级解决方案交付能力'),
('上海智医信息科技有限公司', 'Gold', 'Cooperating', 'ISV', '王浩', '上海张江高科技园区碧波路690号', '华东', '上海', '上海市', '2020-06-01', 5, 'Silver', ARRAY['ISV','医疗','AI','智慧医院'], 62, '医疗', true, 'AI医疗解决方案专家，与多家三甲医院合作'),
('亚信科技控股有限公司', 'Gold', 'Cooperating', 'ISV', '周伟', '北京西城区金融街', '华北', '北京', '北京市', '2018-04-01', 7, 'Silver', ARRAY['ISV','通信','5G','运营商'], 58, '通信', false, '通信行业ISV，5G核心网方案合作伙伴'),
('中软国际有限公司', 'Gold', 'Cooperating', 'Service', '吴明', '深圳市南山区科技中三路', '华南', '广东', '深圳市', '2019-07-12', 6, 'Silver', ARRAY['Service','外包','金融','金融科技'], 55, '金融', false, 'IT服务合作伙伴，具备大规模交付和运维能力'),
('华南智慧医疗科技有限公司', 'Silver', 'Cooperating', 'SI', '刘洋', '深圳南山高新区', '华南', '广东', '深圳市', '2020-09-20', 5, 'Registered', ARRAY['SI','医疗','智慧城市'], 58, '医疗', false, '华南区域医疗信息化SI，智慧医院建设专家'),
('武汉达梦数据库股份有限公司', 'Silver', 'Cooperating', 'ISV', '郑涛', '武汉光谷软件园', '华中', '湖北', '武汉市', '2020-08-10', 5, 'Registered', ARRAY['ISV','数据库','信创','国产替代'], 55, '政务', false, '国产数据库ISV，信创替代核心伙伴'),
('用友网络科技股份有限公司', 'Silver', 'Cooperating', 'ISV', '林芳', '北京海淀区北清路68号', '华北', '北京', '北京市', '2019-10-01', 6, 'Registered', ARRAY['ISV','ERP','SaaS','企业软件'], 52, '互联网', false, '企业管理软件ISV，ERP与财务系统合作伙伴'),
('上海宝信软件股份有限公司', 'Silver', 'Cooperating', 'ISV', '陈强', '上海浦东新区金科路2889号', '华东', '上海', '上海市', '2020-03-08', 5, 'Registered', ARRAY['ISV','制造','钢铁','MES'], 48, '制造', false, '制造业ISV，钢铁行业MES系统专家'),
('重庆梅安森科技股份有限公司', 'Silver', 'Cooperating', 'ISV', '赵勇', '重庆渝北区黄山大道中段', '西部', '重庆', '重庆市', '2020-11-05', 5, 'Registered', ARRAY['ISV','能源','安全','煤矿'], 50, '能源', false, '能源安全ISV，煤矿智能化方案伙伴'),
('西安未来国际信息股份有限公司', 'Silver', 'Cooperating', 'SI', '马超', '西安高新区科技二路', '西部', '陕西', '西安市', '2021-08-15', 4, 'Registered', ARRAY['SI','政务','西部','电子政务'], 42, '政务', false, '西部政务SI，区域电子政务项目'),
('福建顶点软件股份有限公司', 'Silver', 'Cooperating', 'ISV', '何军', '福州鼓楼区软件园', '华东', '福建', '福州市', '2022-02-28', 3, 'Registered', ARRAY['ISV','金融','证券','交易系统'], 45, '金融', false, '金融证券ISV，交易系统合作伙伴'),
('北京华宇信息技术有限公司', 'Registered', 'Cooperating', 'Reseller', '李明', '北京海淀区上地信息路', '华北', '北京', '北京市', '2021-06-20', 4, 'Registered', ARRAY['Reseller','教育','SMB'], 40, '教育', false, '教育行业转售商，区域SMB市场覆盖'),
('杭州数梦工场科技有限公司', 'Registered', 'Cooperating', 'ISV', '王磊', '杭州滨江区海创基地', '华东', '浙江', '杭州市', '2021-09-15', 4, 'Registered', ARRAY['ISV','大数据','政务','城市大脑'], 48, '政务', false, '大数据平台ISV，智慧城市数据中台专家'),
('成都四方伟业软件股份有限公司', 'Registered', 'Cooperating', 'ISV', '杨帆', '成都高新区天府软件园', '西部', '四川', '成都市', '2022-04-01', 3, 'Registered', ARRAY['ISV','大数据','能源','数据治理'], 40, '能源', false, '大数据平台ISV，能源行业数据治理伙伴'),
('广州赛意信息科技股份有限公司', 'Registered', 'Cooperating', 'Service', '黄磊', '广州天河区软件路', '华南', '广东', '广州市', '2020-06-15', 5, 'Registered', ARRAY['Service','制造','实施','MES'], 45, '制造', false, '制造行业实施服务伙伴，MES/WMS系统部署'),
('湖南科创信息技术股份有限公司', 'Registered', 'Prospective', 'Reseller', '刘刚', '长沙岳麓区麓谷企业广场', '华中', '湖南', '长沙市', '2023-03-10', 2, 'Registered', ARRAY['Reseller','政务','教育','SMB'], 28, '教育', false, '华中区域潜在伙伴，政务教育行业覆盖'),
('深圳华大智造科技股份有限公司', 'Registered', 'Prospective', 'Reseller', '钱进', '深圳盐田区华大基因基地', '华南', '广东', '深圳市', '2023-06-01', 2, 'Registered', ARRAY['Reseller','医疗','生命科学','基因测序'], 25, '医疗', false, '生命科学领域潜在伙伴，基因测序设备代理'),
('北京百分点信息科技有限公司', 'Silver', 'Cooperating', 'ISV', '张鹏', '北京海淀区中关村', '华北', '北京', '北京市', '2020-01-15', 5, 'Registered', ARRAY['ISV','大数据','AI','数据智能'], 52, '政务', false, '数据智能ISV，政务大数据分析专家'),
('浙江浙大网新科技股份有限公司', 'Gold', 'Cooperating', 'SI', '赵阳', '杭州西湖区黄姑山路', '华东', '浙江', '杭州市', '2024-01-15', 1, 'Registered', ARRAY['SI','政务','教育','智慧城市'], 55, '政务', false, '浙江区域SI，智慧城市和政务信息化专家'),
('南京华苏科技有限公司', 'Silver', 'Inactive', 'Reseller', '孙鹏', '南京建邺区新城科技园', '华东', '江苏', '南京市', '2021-01-20', 4, 'Registered', ARRAY['Reseller','教育','SMB','运营商'], 32, '教育', false, '教育行业转售商，区域SMB市场覆盖'),
('深圳云天励飞技术股份有限公司', 'Gold', 'Cooperating', 'ISV', '陈可', '深圳福田区深港科技创新合作区', '华南', '广东', '深圳市', '2024-03-01', 1, 'Registered', ARRAY['ISV','AI','智慧城市','安防'], 58, '政务', false, 'AI视觉ISV，智慧城市和公共安全专家'),
('广州广电运通金融电子股份有限公司', 'Silver', 'Cooperating', 'ISV', '林杰', '广州天河区智慧城', '华南', '广东', '广州市', '2022-08-10', 3, 'Registered', ARRAY['ISV','金融','AI','智能终端'], 48, '金融', false, '金融智能终端ISV，银行AI转型伙伴'),
('山东半岛信息技术有限公司', 'Silver', 'Cooperating', 'VAD', '王芳', '青岛崂山区苗岭路', '华东', '山东', '青岛市', '2021-05-10', 4, 'Registered', ARRAY['VAD','政务','分销','山东半岛'], 52, '政务', false, '山东半岛区域VAD，政务云分销专家'),
('西部矿业信息技术有限公司', 'Silver', 'Cooperating', 'ISV', '马强', '西宁城西区黄河路', '西部', '青海', '西宁市', '2023-02-15', 2, 'Registered', ARRAY['ISV','能源','矿业','工业互联网'], 45, '能源', false, '矿业信息化ISV，工业互联网解决方案专家');

-- 4. 联系人
INSERT INTO partner_contacts (partner_id, salutation, last_name, first_name, title, department, phone, mobile, email, is_primary)
SELECT id, '先生', '波', '高', '总经理', '管理层', '010-88888801', '13800138001', 'gaobo@digitalchina.com', true FROM partners WHERE name = '神州数码集团股份有限公司'
UNION ALL SELECT id, '女士', '娜', '李', '生态合作总监', '生态合作部', '0755-88888801', '13900139001', 'lina@huawei.com', true FROM partners WHERE name = '华为技术有限公司'
UNION ALL SELECT id, '先生', '明', '陈', '副总裁', '战略合作部', '024-88888801', '13700137001', 'chenm@neusoft.com', true FROM partners WHERE name = '东软集团股份有限公司'
UNION ALL SELECT id, '先生', '强', '王', '政务事业部总经理', '政务事业部', '0531-88888801', '13600136001', 'wangq@inspur.com', true FROM partners WHERE name = '浪潮电子信息产业股份有限公司'
UNION ALL SELECT id, '先生', '洋', '刘', '销售总监', '销售部', '010-88888802', '13500135001', 'liuy@sinosoft.com', true FROM partners WHERE name = '中科软科技股份有限公司'
UNION ALL SELECT id, '先生', '伟', '张', '政务事业部总监', '政务事业部', '010-88888803', '13400134001', 'zhangw@taiji.com', true FROM partners WHERE name = '太极计算机股份有限公司'
UNION ALL SELECT id, '先生', '华', '赵', '金融事业部总监', '金融事业部', '010-88888804', '13300133001', 'zhaoh@isoftstone.com', true FROM partners WHERE name = '软通动力信息技术股份有限公司'
UNION ALL SELECT id, '先生', '伟', '陈', '技术总监', '技术部', '021-88888801', '13200132001', 'chenw@huadongmedical.com', true FROM partners WHERE name = '华东医卫云科技术有限公司'
UNION ALL SELECT id, '先生', '浩', '王', '销售总监', '销售部', '021-88888802', '13100131001', 'wangh@zhimei.com', true FROM partners WHERE name = '上海智医信息科技有限公司'
UNION ALL SELECT id, '先生', '伟', '周', 'CTO', '技术部', '010-88888805', '13000130001', 'zhouw@asiainfo.com', true FROM partners WHERE name = '亚信科技控股有限公司'
UNION ALL SELECT id, '先生', '明', '吴', '交付总监', '交付部', '0755-88888802', '13900139002', 'wum@chinasofti.com', true FROM partners WHERE name = '中软国际有限公司'
UNION ALL SELECT id, '先生', '可', '陈', 'CEO', '管理层', '0755-88888805', '13200132003', 'chenk@intellif.com', true FROM partners WHERE name = '深圳云天励飞技术股份有限公司'
UNION ALL SELECT id, '女士', '鹏', '张', '数据智能总经理', '数据智能事业部', '010-88888808', '13500135003', 'zhangp@baifendian.com', true FROM partners WHERE name = '北京百分点信息科技有限公司'
UNION ALL SELECT id, '先生', '阳', '赵', '政务事业部总监', '政务事业部', '0571-88888802', '13400134003', 'zhaoyang@inspur.com', true FROM partners WHERE name = '浙江浙大网新科技股份有限公司'
UNION ALL SELECT id, '先生', '磊', '王', 'CEO', '管理层', '0571-88888801', '13000130002', 'wanglei@datadream.com', true FROM partners WHERE name = '杭州数梦工场科技有限公司';

-- 5. 商机报备 (15个)
INSERT INTO deals (title, customer, value, partner_id, partner_name, partner_type, status, region, sales_name, sales_team, product_type, created_date, end_date, is_priority, has_conflict, description)
SELECT '2025年萧山区政务云(信创)服务项目', '杭州市萧山区大数据发展管理局', 18100000, id, '神州数码集团股份有限公司', 'VAD', 'Approved', '华东', '高波', '政务事业部', '信创云平台', '2025-06-01', '2025-12-31', true, false, '基于鲲鹏/飞腾架构的信创云服务' FROM partners WHERE name = '神州数码集团股份有限公司'
UNION ALL SELECT '某省政务云二期扩容及信创改造', '某省大数据局', 15000000, id, '太极计算机股份有限公司', 'SI', 'Pending', '华北', '张伟', '政务事业部', '信创云平台', '2025-06-15', '2026-03-31', true, false, '省级政务云平台扩容，新增信创资源池' FROM partners WHERE name = '太极计算机股份有限公司'
UNION ALL SELECT '上城区智慧医疗云服务项目', '杭州市上城区卫生健康局', 12000000, id, '华东医卫云科技术有限公司', 'ISV', 'Approved', '华东', '陈伟', '医疗事业部', '医疗云平台', '2025-06-20', '2025-11-30', true, false, '区域医疗云平台建设' FROM partners WHERE name = '华东医卫云科技术有限公司'
UNION ALL SELECT '某大型三甲医院智慧医院整体解决方案', '某省人民医院', 22000000, id, '上海智医信息科技有限公司', 'ISV', 'Solution', '华东', '王浩', '医疗事业部', '智慧医院整体解决方案', '2025-05-10', '2026-06-30', true, false, '包含HIS、PACS、LIS等核心系统重构' FROM partners WHERE name = '上海智医信息科技有限公司'
UNION ALL SELECT '阿克苏地区第二人民医院医疗云服务', '阿克苏地区第二人民医院', 8500000, id, '东软集团股份有限公司', 'ISV', 'Approved', '西部', '陈明', '医疗事业部', '医疗云服务', '2025-04-15', '2025-10-31', false, false, '边疆地区医院上云改造' FROM partners WHERE name = '东软集团股份有限公司'
UNION ALL SELECT '心血管病高质量数据集建设项目', '国家心血管病中心', 13000000, id, '华为技术有限公司', 'OEM', 'Commercial', '华北', '李娜', '医疗事业部', '医疗AI平台', '2025-07-01', '2026-06-30', true, false, '高质量数据集建设，包含影像数据标注' FROM partners WHERE name = '华为技术有限公司'
UNION ALL SELECT '某头部保险企业核心系统云化迁移', '中国平安保险集团', 9800000, id, '中科软科技股份有限公司', 'ISV', 'Approved', '华南', '刘洋', '金融事业部', '金融云平台', '2025-03-20', '2025-12-31', true, true, '保险核心系统迁移至金融云平台' FROM partners WHERE name = '中科软科技股份有限公司'
UNION ALL SELECT '招商银行分布式核心系统改造', '招商银行股份有限公司', 12000000, id, '软通动力信息技术股份有限公司', 'SI', 'Negotiation', '华南', '赵华', '金融事业部', '分布式核心系统', '2025-05-25', '2026-03-31', true, false, '银行核心系统分布式改造' FROM partners WHERE name = '软通动力信息技术股份有限公司'
UNION ALL SELECT '某省会城市智慧城市数据中台', '某市大数据发展管理局', 18000000, id, '杭州数梦工场科技有限公司', 'ISV', 'Solution', '华东', '王磊', '智慧城市事业部', '数据中台', '2025-04-20', '2026-01-31', true, false, '城市数据资源池建设，打通50+部门数据壁垒' FROM partners WHERE name = '杭州数梦工场科技有限公司'
UNION ALL SELECT '深圳福田区智慧城区AI视觉系统', '深圳市福田区政务服务数据管理局', 9500000, id, '深圳云天励飞技术股份有限公司', 'ISV', 'Approved', '华南', '陈可', '智慧城市事业部', 'AI视觉平台', '2025-06-05', '2025-12-31', true, false, '城区级视频AI分析系统' FROM partners WHERE name = '深圳云天励飞技术股份有限公司'
UNION ALL SELECT '国家电网数据安全合规改造', '国家电网有限公司', 8500000, id, '神州数码集团股份有限公司', 'VAD', 'ClosedWon', '华北', '高波', '能源事业部', '安全合规', '2024-11-10', '2025-06-30', true, false, '电网关键基础设施安全改造' FROM partners WHERE name = '神州数码集团股份有限公司'
UNION ALL SELECT '宝武钢铁工业互联网平台', '宝武钢铁集团有限公司', 9200000, id, '上海宝信软件股份有限公司', 'ISV', 'Solution', '华东', '陈强', '制造事业部', '工业互联网平台', '2025-05-30', '2026-02-28', true, false, '钢铁行业工业互联网平台' FROM partners WHERE name = '上海宝信软件股份有限公司'
UNION ALL SELECT '某省政务数据库信创替代项目', '某省大数据中心', 7200000, id, '武汉达梦数据库股份有限公司', 'ISV', 'Approved', '华中', '郑涛', '信创事业部', '国产数据库', '2025-03-15', '2025-09-30', true, false, 'Oracle/MySQL至国产数据库迁移' FROM partners WHERE name = '武汉达梦数据库股份有限公司'
UNION ALL SELECT '中国移动5G核心网优化项目', '中国移动通信集团有限公司', 11500000, id, '亚信科技控股有限公司', 'ISV', 'Negotiation', '华北', '周伟', '通信事业部', '5G核心网', '2025-04-28', '2025-12-31', true, false, '5G核心网功能升级' FROM partners WHERE name = '亚信科技控股有限公司'
UNION ALL SELECT '某市政府12345热线智能升级', '某市市民服务热线中心', 4200000, id, '北京百分点信息科技有限公司', 'ISV', 'Approved', '华北', '张鹏', '智慧城市事业部', 'AI智能客服', '2025-06-28', '2025-10-31', false, false, '政务热线智能升级' FROM partners WHERE name = '北京百分点信息科技有限公司';

-- 6. 激励计划 (8个)
INSERT INTO incentive_programs (title, trigger_type, status, payout_type, total_budget, claimed_amount, participants_count, description, start_date, end_date) VALUES
('Q3医疗行业数字化转型激励计划', 'Pipeline Gap', 'Active', 'Rebate', 3000000, 1250000, 38, '新增报备奖励1%，方案入围额外奖励2%，成功签约额外奖励3%', '2025-07-01', '2025-09-30'),
('AI新品首发合作伙伴激励', 'New Product', 'Active', 'Cash', 2000000, 680000, 25, '首单AI产品奖励渠道经理5万元/单', '2025-06-15', '2025-09-15'),
('信创替代竞争性激励计划', 'Competitive', 'Active', 'Rebate', 5000000, 2100000, 45, '国产化替代专项激励：基础返点12%，超过1000万项目15%', '2025-07-01', '2025-12-31'),
('Q2渠道开门红激励', 'Sales Acceleration', 'Ended', 'Cash', 5000000, 4850000, 120, 'Q2季度新签约合作伙伴专项激励', '2025-04-01', '2025-06-30'),
('H2业绩冲刺激励计划', 'Sales Acceleration', 'Upcoming', 'Rebate', 4000000, 0, 0, '2025下半年业绩冲刺激励', '2025-10-01', '2025-12-31'),
('合作伙伴能力提升激励', 'New Product', 'Active', 'Points', 800000, 320000, 65, '赋能认证专项激励', '2025-04-01', '2025-12-31'),
('金融科技数字化转型激励', 'Pipeline Gap', 'Active', 'Rebate', 2500000, 980000, 28, '金融行业专项激励', '2025-06-01', '2025-11-30'),
('智慧城市合作伙伴专项', 'Sales Acceleration', 'Active', 'Rebate', 3500000, 1450000, 35, '智慧城市/政务数字化专项', '2025-05-01', '2025-10-31');

-- 7. MDF配额 (10个)
INSERT INTO mdf_allocations (partner_id, partner_name, quarter, amount, status, applications, approved_apps)
SELECT id, '神州数码集团股份有限公司', '2025 Q3', 1200000, 'used', 4, 3 FROM partners WHERE name = '神州数码集团股份有限公司'
UNION ALL SELECT id, '华为技术有限公司', '2025 Q3', 1000000, 'used', 3, 3 FROM partners WHERE name = '华为技术有限公司'
UNION ALL SELECT id, '东软集团股份有限公司', '2025 Q3', 800000, 'used', 3, 2 FROM partners WHERE name = '东软集团股份有限公司'
UNION ALL SELECT id, '浪潮电子信息产业股份有限公司', '2025 Q3', 800000, 'allocated', 2, 2 FROM partners WHERE name = '浪潮电子信息产业股份有限公司'
UNION ALL SELECT id, '太极计算机股份有限公司', '2025 Q3', 600000, 'used', 3, 2 FROM partners WHERE name = '太极计算机股份有限公司'
UNION ALL SELECT id, '中科软科技股份有限公司', '2025 Q3', 600000, 'used', 2, 2 FROM partners WHERE name = '中科软科技股份有限公司'
UNION ALL SELECT id, '软通动力信息技术股份有限公司', '2025 Q3', 500000, 'allocated', 2, 2 FROM partners WHERE name = '软通动力信息技术股份有限公司'
UNION ALL SELECT id, '华东医卫云科技术有限公司', '2025 Q3', 500000, 'available', 1, 1 FROM partners WHERE name = '华东医卫云科技术有限公司'
UNION ALL SELECT id, '上海智医信息科技有限公司', '2025 Q3', 400000, 'used', 2, 2 FROM partners WHERE name = '上海智医信息科技有限公司'
UNION ALL SELECT id, '亚信科技控股有限公司', '2025 Q3', 400000, 'allocated', 1, 1 FROM partners WHERE name = '亚信科技控股有限公司';

-- 8. 营销活动 (10个)
INSERT INTO marketing_activities (name, type, event_date, status, budget, actual_spend, leads_generated, progress) VALUES
('2025华为全联接大会合作伙伴专场', '行业大会', '2025-09-19', 'Planning', 800000, 0, 0, 10),
('金融科技数字化转型高峰论坛', '行业峰会', '2025-08-28', 'In Progress', 450000, 320000, 38, 65),
('医疗行业智慧医院建设研讨会', '行业沙龙', '2025-09-12', 'Planning', 280000, 85000, 15, 30),
('信创政务云合作伙伴招募会', '渠道招募', '2025-08-15', 'Planning', 350000, 120000, 45, 40),
('AI新品发布会暨生态伙伴大会', '新品发布', '2025-07-25', 'Completed', 600000, 585000, 86, 100),
('智慧城市数据中台技术培训', '赋能培训', '2025-08-20', 'In Progress', 180000, 165000, 52, 85),
('能源行业数字化转型论坛', '行业论坛', '2025-10-15', 'Planning', 380000, 0, 0, 5),
('制造业工业互联网实践分享会', '行业沙龙', '2025-09-05', 'In Progress', 220000, 180000, 28, 75),
('Q3合作伙伴赋能季启动仪式', '渠道活动', '2025-07-01', 'Completed', 150000, 148000, 120, 100),
('西部区域渠道合作伙伴大会', '渠道大会', '2025-10-22', 'Planning', 420000, 0, 0, 15);

-- 9. 小程序礼品 (6个)
INSERT INTO mp_gifts (name, cost, stock, image_url) VALUES
('VeloCloud定制商务笔记本套装', 50, 100, 'notebook'),
('品牌无线蓝牙耳机', 200, 30, 'headphones'),
('技术类精选书籍套装', 300, 20, 'books'),
('云平台代金券 ¥500', 500, 50, 'voucher'),
('行业峰会VIP门票', 1000, 15, 'ticket'),
('品牌定制双肩电脑包', 400, 25, 'backpack');

-- 完成提示
DO $$
DECLARE
    v_partners INTEGER;
    v_deals INTEGER;
    v_incentives INTEGER;
    v_mdf NUMERIC;
BEGIN
    SELECT COUNT(*) INTO v_partners FROM partners;
    SELECT COUNT(*) INTO v_deals FROM deals;
    SELECT COUNT(*) INTO v_incentives FROM incentive_programs;
    SELECT COALESCE(SUM(amount), 0) INTO v_mdf FROM mdf_allocations;
    
    RAISE NOTICE '';
    RAISE NOTICE '╔═══════════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║          PartnerNexus 真实业务数据填充完成                     ║';
    RAISE NOTICE '╠═══════════════════════════════════════════════════════════════╣';
    RAISE NOTICE '║  合作伙伴:    % 家', v_partners;
    RAISE NOTICE '║  商机报备:    % 个', v_deals;
    RAISE NOTICE '║  激励计划:    % 个', v_incentives;
    RAISE NOTICE '║  MDF总配额:  ¥%', v_mdf;
    RAISE NOTICE '╚═══════════════════════════════════════════════════════════════╝';
END $$;
