-- PartnerNexus Seed Data
-- Realistic data for development and testing

-- ─── Clear existing test data ─────────────────────────
DELETE FROM mp_orders;
DELETE FROM mp_scores;
DELETE FROM mp_users;
DELETE FROM mp_gifts;
DELETE FROM mp_events;
DELETE FROM deal_lifecycle_events;
DELETE FROM deals;
DELETE FROM pmdf_applications;
DELETE FROM mdf_allocations;
DELETE FROM marketing_activities;
DELETE FROM incentive_programs;
DELETE FROM partner_contacts;
DELETE FROM partners;

-- ─── Partners (22 realistic partners) ─────────────────
INSERT INTO partners (name, tier, status, type, manager, location, region, start_date, years, prev_tier, tags, win_rate, industry, is_core_partner, cooperation_scope) VALUES
('华东医卫云科技术有限公司', 'Gold', 'Cooperating', 'ISV', '陈伟', '上海浦东', '华东', '2019-03-15', 6, 'Silver', ARRAY['ISV','医疗行业','信创'], 65, '医疗', true, '医疗行业核心ISV，全院级解决方案交付能力'),
('上海智医科技', 'Gold', 'Cooperating', 'ISV', '王浩', '上海张江', '华东', '2020-06-01', 5, 'Silver', ARRAY['ISV','医疗','AI'], 62, '医疗', true, 'AI医疗解决方案专家，与多家三甲医院合作'),
('华南智慧科技', 'Silver', 'Cooperating', 'SI', '刘洋', '深圳南山', '华南', '2020-09-20', 5, 'Registered', ARRAY['SI','医疗','智慧城市'], 58, '医疗', false, '华南区域医疗信息化SI，智慧医院建设专家'),
('华南系统集成', 'Silver', 'Cooperating', 'VAD', '赵敏', '广州天河', '华南', '2019-11-10', 6, 'Silver', ARRAY['VAD','分销','医疗'], 55, '医疗', false, '华南区域分销商，医疗行业覆盖广'),
('北方信科', 'Silver', 'Cooperating', 'VAR', '孙杰', '北京海淀', '华北', '2021-02-15', 4, 'Registered', ARRAY['VAR','医疗','集成'], 52, '医疗', false, '北方区域VAR，医疗信息化项目实施'),
('西部云智科技', 'Silver', 'Cooperating', 'ISV', '周琳', '成都高新', '西部', '2021-04-01', 4, 'Registered', ARRAY['ISV','教育','政务'], 48, '教育', false, '西部区域ISV，智慧教育和政务云专家'),
('华中智慧医疗', 'Silver', 'Cooperating', 'ISV', '吴涛', '武汉光谷', '华中', '2020-08-10', 5, 'Registered', ARRAY['ISV','医疗','大数据'], 55, '医疗', false, '华中区域医疗ISV，医联体解决方案专家'),
('西北云科技', 'Silver', 'Cooperating', 'VAR', '郑强', '西安雁塔', '西部', '2021-06-15', 4, 'Registered', ARRAY['VAR','医疗','云原生'], 50, '医疗', false, '西北区域VAR，医疗云平台建设专家'),
('深圳智慧城市科技', 'Gold', 'Cooperating', 'SI', '刘洋', '深圳南山', '华南', '2019-05-20', 6, 'Silver', ARRAY['SI','政务','智慧城市'], 68, '政务', true, '智慧城市和政务信息化SI，大型项目交付能力'),
('神州数码集团股份有限公司', 'Platinum', 'Cooperating', 'VAD', '高波', '北京海淀', '华北', '2016-03-15', 10, 'Gold', ARRAY['VAD','信创','全国覆盖'], 72, '金融', true, '全国总代理，覆盖金融、政务、医疗三大行业'),
('东软集团股份有限公司', 'Platinum', 'Cooperating', 'ISV', '陈明', '沈阳浑南', '华北', '2017-06-01', 8, 'Gold', ARRAY['ISV','医疗行业','信创入围'], 68, '医疗', true, '医疗行业核心ISV，具备全院级解决方案交付能力'),
('中科软科技股份有限公司', 'Gold', 'Cooperating', 'ISV', '刘洋', '北京中关村', '华北', '2018-09-20', 7, 'Silver', ARRAY['ISV','金融','保险行业'], 65, '金融', false, '金融保险行业ISV，核心系统迁移专家'),
('浪潮电子信息产业股份有限公司', 'Diamond', 'Cooperating', 'OEM', '王强', '济南高新区', '华东', '2017-01-10', 9, 'Platinum', ARRAY['OEM','政务','制造'], 70, '政务', true, '政务云基础设施核心伙伴，具备全国交付能力'),
('华为技术有限公司', 'Diamond', 'Cooperating', 'OEM', '李娜', '深圳龙岗', '华南', '2015-05-01', 11, 'Diamond', ARRAY['OEM','全行业','全球覆盖'], 75, '制造', true, '全行业基础设施伙伴，联合产品定义参与方'),
('软通动力信息技术股份有限公司', 'Gold', 'Cooperating', 'SI', '赵华', '北京朝阳', '华北', '2019-02-15', 7, 'Silver', ARRAY['SI','金融','互联网'], 62, '金融', false, '金融行业SI，核心业务系统集成能力'),
('亚信科技控股有限公司', 'Gold', 'Cooperating', 'ISV', '周伟', '北京西城', '华北', '2018-04-01', 8, 'Silver', ARRAY['ISV','通信','5G'], 58, '互联网', false, '通信行业ISV，5G核心网方案合作伙伴'),
('中软国际有限公司', 'Gold', 'Cooperating', 'Service', '吴明', '深圳南山', '华南', '2019-07-12', 6, 'Registered', ARRAY['Service','外包','金融'], 55, '金融', false, 'IT服务合作伙伴，具备大规模交付和运维能力'),
('太极计算机股份有限公司', 'Gold', 'Cooperating', 'SI', '张伟', '北京海淀', '华北', '2017-11-20', 8, 'Silver', ARRAY['SI','政务','信创'], 63, '政务', true, '政务行业SI，信创替代项目核心交付方'),
('上海宝信软件股份有限公司', 'Silver', 'Cooperating', 'ISV', '陈强', '上海浦东', '华东', '2020-03-08', 6, 'Registered', ARRAY['ISV','制造','钢铁'], 48, '制造', false, '制造业ISV，钢铁行业MES系统专家'),
('用友网络科技股份有限公司', 'Silver', 'Cooperating', 'ISV', '林芳', '北京海淀', '华北', '2019-10-01', 6, 'Registered', ARRAY['ISV','ERP','SaaS'], 52, '互联网', false, '企业管理软件ISV，ERP与财务系统合作伙伴'),
('广州赛意信息科技股份有限公司', 'Silver', 'Cooperating', 'Service', '黄磊', '广州天河', '华南', '2020-06-15', 5, 'Registered', ARRAY['Service','制造','实施'], 45, '制造', false, '制造行业实施服务伙伴，MES/WMS系统部署'),
('南京华苏科技有限公司', 'Silver', 'Inactive', 'Reseller', '孙鹏', '南京建邺', '华东', '2021-01-20', 5, 'Registered', ARRAY['Reseller','教育','SMB'], 32, '教育', false, '教育行业转售商，区域SMB市场覆盖'),
('武汉达梦数据库股份有限公司', 'Silver', 'Cooperating', 'ISV', '郑涛', '武汉光谷', '华中', '2020-08-10', 5, 'Registered', ARRAY['ISV','数据库','信创'], 55, '政务', false, '国产数据库ISV，信创替代核心伙伴'),
('成都四方伟业软件股份有限公司', 'Registered', 'Cooperating', 'ISV', '杨帆', '成都高新区', '西部', '2022-04-01', 4, 'Registered', ARRAY['ISV','大数据','能源'], 40, '能源', false, '大数据平台ISV，能源行业数据治理伙伴'),
('西安未来国际信息股份有限公司', 'Registered', 'Cooperating', 'SI', '马超', '西安雁塔', '西部', '2021-08-15', 4, 'Registered', ARRAY['SI','政务','西部'], 42, '政务', false, '西部政务SI，区域电子政务项目'),
('福建顶点软件股份有限公司', 'Registered', 'Cooperating', 'ISV', '何军', '福州鼓楼', '华东', '2022-02-28', 4, 'Registered', ARRAY['ISV','金融','证券'], 45, '金融', false, '金融证券ISV，交易系统合作伙伴'),
('湖南科创信息技术股份有限公司', 'Registered', 'Prospective', 'Reseller', '刘刚', '长沙岳麓', '华中', '2023-03-10', 3, 'Registered', ARRAY['Reseller','政务','教育'], 28, '教育', false, '华中区域潜在伙伴，政务教育行业'),
('重庆梅安森科技股份有限公司', 'Silver', 'Cooperating', 'ISV', '赵勇', '重庆渝北', '西部', '2020-11-05', 5, 'Registered', ARRAY['ISV','能源','安全'], 50, '能源', false, '能源安全ISV，煤矿智能化方案伙伴'),
('深圳华大智造科技股份有限公司', 'Registered', 'Prospective', 'Reseller', '钱进', '深圳南山', '华南', '2023-06-01', 2, 'Registered', ARRAY['Reseller','医疗','基因'], 25, '医疗', false, '生命科学领域潜在伙伴，基因测序设备代理'),
('山东半岛科技', 'Silver', 'Cooperating', 'VAD', '王芳', '青岛崂山', '华东', '2021-05-10', 4, 'Registered', ARRAY['VAD','政务','分销'], 52, '政务', false, '山东半岛区域VAD，政务云分销专家');

-- ─── Partner Contacts ─────────────────────────────────
INSERT INTO partner_contacts (partner_id, last_name, first_name, title, department, phone, email, is_primary)
SELECT id, '伟', '陈', '技术总监', '技术部', '13901000001', 'chenw@huadongmedical.com', true FROM partners WHERE name = '华东医卫云科技术有限公司'
UNION ALL SELECT id, '浩', '王', '销售总监', '销售部', '13901000002', 'wangh@shanghaizhimei.com', true FROM partners WHERE name = '上海智医科技'
UNION ALL SELECT id, '洋', '刘', '技术总监', '技术部', '13901000003', 'liuy@huanansmart.com', true FROM partners WHERE name = '华南智慧科技'
UNION ALL SELECT id, '敏', '赵', '总经理', '管理层', '13901000004', 'zhaom@huanan-system.com', true FROM partners WHERE name = '华南系统集成'
UNION ALL SELECT id, '杰', '孙', '技术总监', '技术部', '13901000005', 'sunj@beifangxinke.com', true FROM partners WHERE name = '北方信科'
UNION ALL SELECT id, '琳', '周', '总经理', '管理层', '13901000006', 'zhoul@xibuyunzhi.com', true FROM partners WHERE name = '西部云智科技'
UNION ALL SELECT id, '涛', '吴', '技术总监', '技术部', '13901000007', 'wut@huananzhihui.com', true FROM partners WHERE name = '华中智慧医疗'
UNION ALL SELECT id, '强', '郑', '总经理', '管理层', '13901000008', 'zhengq@xibeicloud.com', true FROM partners WHERE name = '西北云科技'
UNION ALL SELECT id, '洋', '刘', '政务事业部总监', '政务事业部', '13901000009', 'liuy@shenzhen-smartcity.com', true FROM partners WHERE name = '深圳智慧城市科技'
UNION ALL SELECT id, '波', '高', '总经理', '管理层', '13801001001', 'gaobo@digitalchina.com', true FROM partners WHERE name = '神州数码集团股份有限公司'
UNION ALL SELECT id, '明', '陈', '副总裁', '管理层', '13901002001', 'chenm@neusoft.com', true FROM partners WHERE name = '东软集团股份有限公司'
UNION ALL SELECT id, '伟', '李', '解决方案架构师', '技术部', '13901002002', 'liw@neusoft.com', false FROM partners WHERE name = '东软集团股份有限公司'
UNION ALL SELECT id, '洋', '刘', '销售总监', '销售部', '13501003001', 'liuy@sinosoft.com', true FROM partners WHERE name = '中科软科技股份有限公司'
UNION ALL SELECT id, '强', '王', '政务事业部总经理', '政务事业部', '13701004001', 'wangq@inspur.com', true FROM partners WHERE name = '浪潮电子信息产业股份有限公司'
UNION ALL SELECT id, '娜', '李', '生态合作总监', '生态部', '13601005001', 'lina@huawei.com', true FROM partners WHERE name = '华为技术有限公司'
UNION ALL SELECT id, '华', '赵', '金融事业部总监', '金融事业部', '13401006001', 'zhaoh@isoftstone.com', true FROM partners WHERE name = '软通动力信息技术股份有限公司'
UNION ALL SELECT id, '伟', '周', 'CTO', '技术部', '13301007001', 'zhouw@asiainfo.com', true FROM partners WHERE name = '亚信科技控股有限公司'
UNION ALL SELECT id, '明', '吴', '交付总监', '交付部', '13201008001', 'wum@chinasofti.com', true FROM partners WHERE name = '中软国际有限公司'
UNION ALL SELECT id, '伟', '张', '政务事业部总监', '政务事业部', '13101009001', 'zhangw@taiji.com', true FROM partners WHERE name = '太极计算机股份有限公司'
UNION ALL SELECT id, '强', '陈', '总经理', '管理层', '13001010001', 'chenq@baosight.com', true FROM partners WHERE name = '上海宝信软件股份有限公司'
UNION ALL SELECT id, '芳', '林', 'ERP事业部总监', 'ERP事业部', '13001011001', 'linf@yonyou.com', true FROM partners WHERE name = '用友网络科技股份有限公司';

-- ─── Deals (15 realistic deals) ───────────────────────
INSERT INTO deals (id, title, customer, value, partner_id, partner_name, partner_type, status, region, sales_name, sales_team, product_type, created_date, end_date, is_priority, has_conflict) VALUES
(DEFAULT, '某大型银行核心系统云化迁移项目', '中国工商银行', 12000000, 'p003', '中科软科技股份有限公司', 'ISV', 'Approved', '华北', '张伟', '金融事业部', '云原生平台', '2025-01-15', '2025-09-30', true, false),
(DEFAULT, '东部省份政务云三期扩容', '浙江省大数据局', 8500000, 'p004', '浪潮电子信息产业股份有限公司', 'OEM', 'Approved', '华东', '王强', '政务事业部', '大数据平台', '2025-02-10', '2025-08-31', true, false),
(DEFAULT, '华南区三甲医院信息化升级', '广东省人民医院', 6200000, 'p002', '东软集团股份有限公司', 'ISV', 'Approved', '华南', '李娜', '医疗事业部', '云原生平台', '2025-03-01', '2025-11-30', false, false),
(DEFAULT, '某直辖市智慧城市数据中台', '上海市大数据中心', 15000000, 'p009', '太极计算机股份有限公司', 'SI', 'Pending', '华东', '陈明', '政务事业部', '大数据平台', '2025-04-05', '2025-12-31', true, false),
(DEFAULT, '头部保险企业AI理赔系统', '中国平安', 9800000, 'p003', '中科软科技股份有限公司', 'ISV', 'Pending', '华南', '张伟', '金融事业部', 'AI 智算平台', '2025-03-20', '2025-10-31', true, true),
(DEFAULT, '西部省份教育云平台建设', '四川省教育厅', 4500000, 'p016', '西安未来国际信息股份有限公司', 'SI', 'Approved', '西部', '马超', '政务事业部', '云原生平台', '2025-02-28', '2025-09-30', false, false),
(DEFAULT, '央企数据安全合规改造', '国家电网', 7200000, 'p001', '神州数码集团股份有限公司', 'VAD', 'Converted', '华北', '赵华', '金融事业部', '安全合规', '2024-11-10', '2025-06-30', true, false),
(DEFAULT, '汽车制造MES系统迁移', '比亚迪', 5600000, 'p005', '华为技术有限公司', 'OEM', 'Approved', '华南', '王强', '制造事业部', '云原生平台', '2025-03-15', '2025-12-31', false, false),
(DEFAULT, '钢铁行业工业互联网平台', '宝武钢铁', 8800000, 'p010', '上海宝信软件股份有限公司', 'ISV', 'Pending', '华东', '陈强', '制造事业部', '大数据平台', '2025-05-01', '2026-03-31', false, false),
(DEFAULT, '股份制银行核心交易系统', '招商银行', 11000000, 'p006', '软通动力信息技术股份有限公司', 'SI', 'Approved', '华南', '李娜', '金融事业部', '云原生平台', '2025-01-10', '2025-10-31', true, false),
(DEFAULT, '西南区煤矿智能安全系统', '中煤集团', 3800000, 'p019', '重庆梅安森科技股份有限公司', 'ISV', 'Approved', '西部', '赵勇', '能源事业部', 'AI 智算平台', '2025-04-20', '2025-12-31', false, false),
(DEFAULT, '国产数据库信创替代项目', '国家税务总局', 6500000, 'p014', '武汉达梦数据库股份有限公司', 'ISV', 'Approved', '华中', '郑涛', '政务事业部', '大数据平台', '2025-02-01', '2025-09-30', false, false),
(DEFAULT, 'ERP系统云化升级', '海尔集团', 4200000, 'p011', '用友网络科技股份有限公司', 'ISV', 'Pending', '华东', '林芳', '制造事业部', '云原生平台', '2025-05-10', '2025-11-30', false, false),
(DEFAULT, '5G核心网优化项目', '中国移动', 9500000, 'p007', '亚信科技控股有限公司', 'ISV', 'Rejected', '华北', '周伟', '通信事业部', '云原生平台', '2025-01-20', '2025-07-31', false, true),
(DEFAULT, '证券交易系统升级', '中信证券', 7800000, 'p017', '福建顶点软件股份有限公司', 'ISV', 'Pending', '华东', '何军', '金融事业部', '云原生平台', '2025-03-25', '2025-11-30', false, false);

-- ─── Deal Lifecycle Events ────────────────────────────
INSERT INTO deal_lifecycle_events (deal_id, stage, event_date, description, actor) VALUES
(DEFAULT, 'Registered', '2025-01-15', '合作伙伴提交报备', '刘洋'),
(DEFAULT, 'Approved', '2025-01-18', '渠道经理审核通过，Pipeline确认', 'Alex Rivera'),
(DEFAULT, 'Registered', '2025-02-10', '合作伙伴提交报备', '王强'),
(DEFAULT, 'Approved', '2025-02-14', '渠道经理审核通过，项目进入方案阶段', 'Alex Rivera'),
(DEFAULT, 'Registered', '2025-03-01', '合作伙伴提交报备', '陈明'),
(DEFAULT, 'Approved', '2025-03-04', '渠道经理审核通过', 'Alex Rivera'),
(DEFAULT, 'Registered', '2025-04-05', '合作伙伴提交报备', '张伟'),
(DEFAULT, 'Registered', '2025-03-20', '合作伙伴提交报备', '刘洋'),
(DEFAULT, 'Registered', '2024-11-10', '合作伙伴提交报备', '高波'),
(DEFAULT, 'Approved', '2024-11-15', '渠道经理审核通过', 'Alex Rivera'),
(DEFAULT, 'Converted', '2025-01-10', '正式转化为商机，进入POC阶段', 'Alex Rivera'),
(DEFAULT, 'Registered', '2025-01-20', '合作伙伴提交报备', '周伟'),
(DEFAULT, 'Rejected', '2025-01-23', '存在存量商机冲突，拒绝报备', 'Alex Rivera');

-- ─── MDF Allocations ──────────────────────────────────
INSERT INTO mdf_allocations (partner_id, partner_name, quarter, amount, status, applications, approved_apps) VALUES
(DEFAULT, '神州数码集团股份有限公司', '2025 Q3', 800000, 'used', 3, 2),
(DEFAULT, '东软集团股份有限公司', '2025 Q3', 600000, 'used', 2, 2),
(DEFAULT, '浪潮电子信息产业股份有限公司', '2025 Q3', 500000, 'allocated', 1, 1),
(DEFAULT, '华为技术有限公司', '2025 Q3', 500000, 'used', 2, 2),
(DEFAULT, '太极计算机股份有限公司', '2025 Q3', 400000, 'allocated', 2, 1),
(DEFAULT, '中科软科技股份有限公司', '2025 Q3', 300000, 'available', 0, 0),
(DEFAULT, '软通动力信息技术股份有限公司', '2025 Q3', 300000, 'allocated', 1, 1),
(DEFAULT, '上海宝信软件股份有限公司', '2025 Q3', 200000, 'available', 1, 0);

-- ─── Marketing Activities ─────────────────────────────
INSERT INTO marketing_activities (name, type, event_date, status, budget, actual_spend, leads_generated, progress) VALUES
('华北金融行业数字化转型峰会', '行业沙龙', '2025-08-15', 'Planning', 450000, 120000, 0, 25),
('华东医疗CIO闭门研讨会', '行业沙龙', '2025-09-08', 'In Progress', 280000, 185000, 42, 65),
('云原生架构师线上特训营', '线上研讨会', '2025-09-22', 'Planning', 120000, 0, 0, 10),
('大湾区制造企业数字化转型论坛', '行业沙龙', '2025-08-05', 'Completed', 350000, 345000, 86, 100),
('全国信创生态巡展-西安站', '展会赞助', '2025-09-28', 'Planning', 550000, 150000, 0, 30);

-- ─── Incentive Programs ───────────────────────────────
INSERT INTO incentive_programs (title, trigger_type, status, payout_type, total_budget, claimed_amount, participants_count, description, start_date, end_date) VALUES
('Q3 医疗行业商机冲刺', 'Pipeline Gap', 'Active', 'Rebate', 2000000, 850000, 45, '医疗行业新增报备商机成交后额外返点2%', '2025-07-01', '2025-09-30'),
('新一代AI智算平台首发激励', 'New Product', 'Active', 'Cash', 1500000, 620000, 28, '首单AI智算平台项目奖励渠道经理5万元', '2025-06-15', '2025-09-15'),
('国产化替代竞争性专项', 'Competitive', 'Active', 'Rebate', 3000000, 1200000, 32, '成功替换竞品项目返点提升至15%', '2025-07-01', '2025-12-31'),
('Q2 渠道开门红', 'Sales Acceleration', 'Ended', 'Cash', 5000000, 4850000, 120, '季度新签约伙伴专项激励', '2025-04-01', '2025-06-30'),
('合作伙伴认证激励', 'New Product', 'Upcoming', 'Points', 800000, 0, 0, '完成高级认证的工程师每人奖励500积分', '2025-10-01', '2025-12-31');

-- ─── Mini Program Gifts ───────────────────────────────
INSERT INTO mp_gifts (name, cost, stock, image_url) VALUES
('品牌定制笔记本套装', 50, 100, '📓'),
('无线蓝牙耳机', 200, 30, '🎧'),
('技术书籍套装', 300, 20, '📚'),
('云平台代金券 ¥500', 500, 50, '💳'),
('行业峰会门票', 1000, 10, '🎫'),
('品牌双肩包', 400, 25, '🎒');
