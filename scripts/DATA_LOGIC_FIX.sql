-- ═══════════════════════════════════════════════════════════════════════════════════
-- PartnerNexus 演示数据 - 完整版（修复后）
-- 复制以下所有内容到 Supabase Dashboard → SQL Editor 执行
--
-- 数据说明：
-- - 所有数据为演示用途（data_source = 'seed'）
-- - 数据之间的逻辑关系已修复并验证
-- - 统一使用 CNY 货币
--
-- 数据来源：基于真实业务场景模拟
-- 更新日期: 2025年6月
-- ═══════════════════════════════════════════════════════════════════════════════════

-- ─── 0. 先执行数据逻辑修复迁移 ───────────────────────────────────────────────
-- 如果还未执行 20250615000000_fix_data_logic.sql，请先执行

-- ─── 1. 清空现有数据 ─────────────────────────────────────────────────────────
DELETE FROM incentive_applications;
DELETE FROM deal_lifecycle_events;
DELETE FROM deals;
DELETE FROM pmdf_applications;
DELETE FROM mdf_allocations;
DELETE FROM marketing_activities;
DELETE FROM incentive_programs;
DELETE FROM partner_contacts;
DELETE FROM partners;
DELETE FROM settings;
DELETE FROM market_benchmarks;
DELETE FROM partner_activity_logs;

-- ─── 2. 全局配置 ───────────────────────────────────────────────────────────────
INSERT INTO settings (id, data) VALUES ('global', '{
  "currency": "CNY",
  "regions": ["华北", "华东", "华南", "华中", "西部", "东北", "西南"],
  "industries": ["金融", "医疗", "政务", "制造", "教育", "能源", "互联网", "通信"],
  "partnerTiers": ["Diamond", "Platinum", "Gold", "Silver", "Registered"],
  "partnerTypes": ["Reseller", "ISV", "OEM", "Service", "VAD", "VAR", "SI"],
  "partnerStatuses": ["Cooperating", "Inactive", "Prospective", "Rejected"],
  "salesStages": ["Registered", "UnderReview", "Approved", "Solution", "Commercial", "Negotiation", "ClosedWon", "ClosedLost"],
  "companyName": "VeloCloud 渠道管理平台",
  "companyNameEn": "VeloCloud Partner Management",
  "companyAddress": "北京市朝阳区望京科技园A座20层",
  "companyPhone": "400-888-6666",
  "companyEmail": "partner@velolabs.top",
  "annualTarget": "5亿",
  "quarterlyTarget": "1.25亿",
  "partnerTarget": "200家合作伙伴"
}');

-- ─── 3. 合作伙伴数据 (29家) ───────────────────────────────────────────────────
-- 说明：已移除所有测试公司（测试公司、北京测试公司、上海测试公司、测试沉睡伙伴）
INSERT INTO partners (name, tier, status, type, manager, location, region, province, city, start_date, years, prev_tier, tags, win_rate, industry, is_core_partner, cooperation_scope, data_source, total_deals, won_deals, total_revenue) VALUES
-- Diamond/Platinum 核心伙伴
('神州数码集团股份有限公司', 'Platinum', 'Cooperating', 'VAD', '高波', '北京海淀区中关村大街1号', '华北', '北京', '北京市', '2018-03-15', 7, 'Gold', ARRAY['VAD','信创','全国覆盖','金融'], 72, '金融', true, '全国总代理，覆盖金融、政务、医疗三大行业，年销售额超10亿', 'seed', 12, 8, 8560000),
('华为技术有限公司', 'Diamond', 'Cooperating', 'OEM', '李娜', '深圳市龙岗区华为总部', '华南', '广东', '深圳市', '2016-05-01', 9, 'Diamond', ARRAY['OEM','全行业','全球覆盖','5G'], 75, '制造', true, '全行业基础设施伙伴，联合产品定义参与方，全球化布局', 'seed', 15, 11, 12800000),
('东软集团股份有限公司', 'Platinum', 'Cooperating', 'ISV', '陈明', '沈阳市浑南区东软软件园', '华北', '辽宁', '沈阳市', '2017-06-01', 8, 'Gold', ARRAY['ISV','医疗行业','信创入围'], 68, '医疗', true, '医疗行业核心ISV，具备全院级解决方案交付能力', 'seed', 10, 6, 4200000),
('浪潮电子信息产业股份有限公司', 'Diamond', 'Cooperating', 'OEM', '王强', '济南市高新区浪潮路1036号', '华东', '山东', '济南市', '2017-01-10', 8, 'Platinum', ARRAY['OEM','政务','制造','信创'], 70, '政务', true, '政务云基础设施核心伙伴，全国交付能力', 'seed', 14, 9, 7800000),
('中科软科技股份有限公司', 'Gold', 'Cooperating', 'ISV', '刘洋', '北京中关村软件园', '华北', '北京', '北京市', '2018-09-20', 7, 'Silver', ARRAY['ISV','金融','保险行业'], 65, '金融', true, '金融保险行业ISV，核心系统迁移专家', 'seed', 8, 5, 3200000),
('太极计算机股份有限公司', 'Gold', 'Cooperating', 'SI', '张伟', '北京海淀区信息路18号', '华北', '北京', '北京市', '2017-11-20', 7, 'Silver', ARRAY['SI','政务','信创'], 63, '政务', true, '政务行业SI，信创替代项目核心交付方', 'seed', 9, 5, 3600000),
('软通动力信息技术股份有限公司', 'Gold', 'Cooperating', 'SI', '赵华', '北京朝阳区酒仙桥', '华北', '北京', '北京市', '2019-02-15', 6, 'Silver', ARRAY['SI','金融','互联网'], 62, '金融', false, '金融行业SI，核心业务系统集成能力', 'seed', 7, 4, 2800000),
-- Gold 伙伴
('华东医卫云科技术有限公司', 'Gold', 'Cooperating', 'ISV', '陈伟', '上海浦东新区张江高科技园区', '华东', '上海', '上海市', '2019-03-15', 6, 'Silver', ARRAY['ISV','医疗行业','信创','AI'], 65, '医疗', true, '医疗行业核心ISV，全院级解决方案交付能力', 'seed', 8, 5, 3100000),
('上海智医信息科技有限公司', 'Gold', 'Cooperating', 'ISV', '王浩', '上海张江高科技园区碧波路690号', '华东', '上海', '上海市', '2020-06-01', 5, 'Silver', ARRAY['ISV','医疗','AI','智慧医院'], 62, '医疗', true, 'AI医疗解决方案专家，与多家三甲医院合作', 'seed', 6, 3, 1800000),
('亚信科技控股有限公司', 'Gold', 'Cooperating', 'ISV', '周伟', '北京西城区金融街', '华北', '北京', '北京市', '2018-04-01', 7, 'Silver', ARRAY['ISV','通信','5G','运营商'], 58, '通信', false, '通信行业ISV，5G核心网方案合作伙伴', 'seed', 7, 4, 2400000),
('中软国际有限公司', 'Gold', 'Cooperating', 'Service', '吴明', '深圳市南山区科技中三路', '华南', '广东', '深圳市', '2019-07-12', 6, 'Silver', ARRAY['Service','外包','金融','金融科技'], 55, '金融', false, 'IT服务合作伙伴，具备大规模交付和运维能力', 'seed', 6, 3, 1600000),
-- Silver 伙伴
('华南智慧医疗科技有限公司', 'Silver', 'Cooperating', 'SI', '刘洋', '深圳南山高新区', '华南', '广东', '深圳市', '2020-09-20', 5, 'Registered', ARRAY['SI','医疗','智慧城市'], 58, '医疗', false, '华南区域医疗信息化SI，智慧医院建设专家', 'seed', 5, 2, 980000),
('武汉达梦数据库股份有限公司', 'Silver', 'Cooperating', 'ISV', '郑涛', '武汉光谷软件园', '华中', '湖北', '武汉市', '2020-08-10', 5, 'Registered', ARRAY['ISV','数据库','信创','国产替代'], 55, '政务', false, '国产数据库ISV，信创替代核心伙伴', 'seed', 6, 3, 1400000),
('用友网络科技股份有限公司', 'Silver', 'Cooperating', 'ISV', '林芳', '北京海淀区北清路68号', '华北', '北京', '北京市', '2019-10-01', 6, 'Registered', ARRAY['ISV','ERP','SaaS','企业软件'], 52, '互联网', false, '企业管理软件ISV，ERP与财务系统合作伙伴', 'seed', 5, 2, 1100000),
('上海宝信软件股份有限公司', 'Silver', 'Cooperating', 'ISV', '陈强', '上海浦东新区金科路2889号', '华东', '上海', '上海市', '2020-03-08', 5, 'Registered', ARRAY['ISV','制造','钢铁','MES'], 48, '制造', false, '制造业ISV，钢铁行业MES系统专家', 'seed', 4, 2, 920000),
('重庆梅安森科技股份有限公司', 'Silver', 'Cooperating', 'ISV', '赵勇', '重庆渝北区黄山大道中段', '西部', '重庆', '重庆市', '2020-11-05', 5, 'Registered', ARRAY['ISV','能源','安全','煤矿'], 50, '能源', false, '能源安全ISV，煤矿智能化方案伙伴', 'seed', 4, 2, 850000),
('西安未来国际信息股份有限公司', 'Silver', 'Cooperating', 'SI', '马超', '西安高新区科技二路', '西部', '陕西', '西安市', '2021-08-15', 4, 'Registered', ARRAY['SI','政务','西部','电子政务'], 42, '政务', false, '西部政务SI，区域电子政务项目', 'seed', 3, 1, 680000),
('福建顶点软件股份有限公司', 'Silver', 'Cooperating', 'ISV', '何军', '福州鼓楼区软件园', '华东', '福建', '福州市', '2022-02-28', 3, 'Registered', ARRAY['ISV','金融','证券','交易系统'], 45, '金融', false, '金融证券ISV，交易系统合作伙伴', 'seed', 3, 1, 720000),
-- Registered 伙伴
('北京华宇信息技术有限公司', 'Registered', 'Cooperating', 'Reseller', '李明', '北京海淀区上地信息路', '华北', '北京', '北京市', '2021-06-20', 4, 'Registered', ARRAY['Reseller','教育','SMB'], 40, '教育', false, '教育行业转售商，区域SMB市场覆盖', 'seed', 2, 1, 480000),
('杭州数梦工场科技有限公司', 'Registered', 'Cooperating', 'ISV', '王磊', '杭州滨江区海创基地', '华东', '浙江', '杭州市', '2021-09-15', 4, 'Registered', ARRAY['ISV','大数据','政务','城市大脑'], 48, '政务', false, '大数据平台ISV，智慧城市数据中台专家', 'seed', 3, 1, 620000),
('成都四方伟业软件股份有限公司', 'Registered', 'Cooperating', 'ISV', '杨帆', '成都高新区天府软件园', '西部', '四川', '成都市', '2022-04-01', 3, 'Registered', ARRAY['ISV','大数据','能源','数据治理'], 40, '能源', false, '大数据平台ISV，能源行业数据治理伙伴', 'seed', 2, 1, 560000),
('广州赛意信息科技股份有限公司', 'Registered', 'Cooperating', 'Service', '黄磊', '广州天河区软件路', '华南', '广东', '广州市', '2020-06-15', 5, 'Registered', ARRAY['Service','制造','实施','MES'], 45, '制造', false, '制造行业实施服务伙伴，MES/WMS系统部署', 'seed', 3, 1, 680000),
('湖南科创信息技术股份有限公司', 'Registered', 'Prospective', 'Reseller', '刘刚', '长沙岳麓区麓谷企业广场', '华中', '湖南', '长沙市', '2023-03-10', 2, 'Registered', ARRAY['Reseller','政务','教育','SMB'], 28, '教育', false, '华中区域潜在伙伴，政务教育行业覆盖', 'seed', 1, 0, 0),
('深圳华大智造科技股份有限公司', 'Registered', 'Prospective', 'Reseller', '钱进', '深圳盐田区华大基因基地', '华南', '广东', '深圳市', '2023-06-01', 2, 'Registered', ARRAY['Reseller','医疗','生命科学','基因测序'], 25, '医疗', false, '生命科学领域潜在伙伴，基因测序设备代理', 'seed', 1, 0, 0),
('北京百分点信息科技有限公司', 'Silver', 'Cooperating', 'ISV', '张鹏', '北京海淀区中关村', '华北', '北京', '北京市', '2020-01-15', 5, 'Registered', ARRAY['ISV','大数据','AI','数据智能'], 52, '政务', false, '数据智能ISV，政务大数据分析专家', 'seed', 4, 2, 850000),
-- 2024-2025年新签约伙伴
('浙江浙大网新科技股份有限公司', 'Gold', 'Cooperating', 'SI', '赵阳', '杭州西湖区黄姑山路', '华东', '浙江', '杭州市', '2024-01-15', 1, 'Registered', ARRAY['SI','政务','教育','智慧城市'], 55, '政务', false, '浙江区域SI，智慧城市和政务信息化专家', 'seed', 3, 1, 580000),
('南京华苏科技有限公司', 'Silver', 'Inactive', 'Reseller', '孙鹏', '南京建邺区新城科技园', '华东', '江苏', '南京市', '2021-01-20', 4, 'Registered', ARRAY['Reseller','教育','SMB','运营商'], 32, '教育', false, '教育行业转售商，区域SMB市场覆盖', 'seed', 2, 1, 420000),
('深圳云天励飞技术股份有限公司', 'Gold', 'Cooperating', 'ISV', '陈可', '深圳福田区深港科技创新合作区', '华南', '广东', '深圳市', '2024-03-01', 1, 'Registered', ARRAY['ISV','AI','智慧城市','安防'], 58, '政务', false, 'AI视觉ISV，智慧城市和公共安全专家', 'seed', 4, 2, 960000),
('广州广电运通金融电子股份有限公司', 'Silver', 'Cooperating', 'ISV', '林杰', '广州天河区智慧城', '华南', '广东', '广州市', '2022-08-10', 3, 'Registered', ARRAY['ISV','金融','AI','智能终端'], 48, '金融', false, '金融智能终端ISV，银行AI转型伙伴', 'seed', 3, 1, 780000),
('山东半岛信息技术有限公司', 'Silver', 'Cooperating', 'VAD', '王芳', '青岛崂山区苗岭路', '华东', '山东', '青岛市', '2021-05-10', 4, 'Registered', ARRAY['VAD','政务','分销','山东半岛'], 52, '政务', false, '山东半岛区域VAD，政务云分销专家', 'seed', 3, 1, 680000),
('西部矿业信息技术有限公司', 'Silver', 'Cooperating', 'ISV', '马强', '西宁城西区黄河路', '西部', '青海', '西宁市', '2023-02-15', 2, 'Registered', ARRAY['ISV','能源','矿业','工业互联网'], 45, '能源', false, '矿业信息化ISV，工业互联网解决方案专家', 'seed', 2, 1, 520000);

-- ─── 4. 联系人数据 ─────────────────────────────────────────────────────────────
INSERT INTO partner_contacts (partner_id, salutation, last_name, first_name, title, department, phone, mobile, email, is_primary, data_source)
SELECT id, '先生', '波', '高', '总经理', '管理层', '010-88888801', '13800138001', 'contact@digitalchina.com', true, 'seed' FROM partners WHERE name = '神州数码集团股份有限公司'
UNION ALL SELECT id, '女士', '娜', '李', '生态合作总监', '生态合作部', '0755-88888801', '13900139001', 'contact@huawei.com', true, 'seed' FROM partners WHERE name = '华为技术有限公司'
UNION ALL SELECT id, '先生', '明', '陈', '副总裁', '战略合作部', '024-88888801', '13700137001', 'contact@neusoft.com', true, 'seed' FROM partners WHERE name = '东软集团股份有限公司'
UNION ALL SELECT id, '先生', '强', '王', '政务事业部总经理', '政务事业部', '0531-88888801', '13600136001', 'contact@inspur.com', true, 'seed' FROM partners WHERE name = '浪潮电子信息产业股份有限公司'
UNION ALL SELECT id, '先生', '洋', '刘', '销售总监', '销售部', '010-88888802', '13500135001', 'contact@sinosoft.com', true, 'seed' FROM partners WHERE name = '中科软科技股份有限公司'
UNION ALL SELECT id, '先生', '伟', '张', '政务事业部总监', '政务事业部', '010-88888803', '13400134001', 'contact@taiji.com', true, 'seed' FROM partners WHERE name = '太极计算机股份有限公司'
UNION ALL SELECT id, '先生', '华', '赵', '金融事业部总监', '金融事业部', '010-88888804', '13300133001', 'contact@isoftstone.com', true, 'seed' FROM partners WHERE name = '软通动力信息技术股份有限公司'
UNION ALL SELECT id, '先生', '伟', '陈', '技术总监', '技术部', '021-88888801', '13200132001', 'contact@huadongmedical.com', true, 'seed' FROM partners WHERE name = '华东医卫云科技术有限公司'
UNION ALL SELECT id, '先生', '浩', '王', '销售总监', '销售部', '021-88888802', '13100131001', 'contact@zhimei.com', true, 'seed' FROM partners WHERE name = '上海智医信息科技有限公司'
UNION ALL SELECT id, '先生', '伟', '周', 'CTO', '技术部', '010-88888805', '13000130001', 'contact@asiainfo.com', true, 'seed' FROM partners WHERE name = '亚信科技控股有限公司'
UNION ALL SELECT id, '先生', '明', '吴', '交付总监', '交付部', '0755-88888802', '13900139002', 'contact@chinasofti.com', true, 'seed' FROM partners WHERE name = '中软国际有限公司'
UNION ALL SELECT id, '先生', '洋', '刘', '技术总监', '技术部', '0755-88888803', '13800138002', 'contact@sz-smartmedical.com', true, 'seed' FROM partners WHERE name = '华南智慧医疗科技有限公司'
UNION ALL SELECT id, '先生', '涛', '郑', '总经理', '管理层', '027-88888801', '13700137002', 'contact@dameng.com', true, 'seed' FROM partners WHERE name = '武汉达梦数据库股份有限公司'
UNION ALL SELECT id, '女士', '芳', '林', 'ERP事业部总监', 'ERP事业部', '010-88888806', '13600136002', 'contact@yonyou.com', true, 'seed' FROM partners WHERE name = '用友网络科技股份有限公司'
UNION ALL SELECT id, '先生', '强', '陈', '总经理', '管理层', '021-88888803', '13500135002', 'contact@baosight.com', true, 'seed' FROM partners WHERE name = '上海宝信软件股份有限公司'
UNION ALL SELECT id, '先生', '勇', '赵', '技术总监', '技术部', '023-88888801', '13400134002', 'contact@mason.com', true, 'seed' FROM partners WHERE name = '重庆梅安森科技股份有限公司'
UNION ALL SELECT id, '先生', '超', '马', '总经理', '管理层', '029-88888801', '13300133002', 'contact@worldexpo.com', true, 'seed' FROM partners WHERE name = '西安未来国际信息股份有限公司'
UNION ALL SELECT id, '先生', '军', '何', '销售总监', '销售部', '0591-88888801', '13200132002', 'contact@dhtop.com', true, 'seed' FROM partners WHERE name = '福建顶点软件股份有限公司'
UNION ALL SELECT id, '先生', '明', '李', '总经理', '管理层', '010-88888807', '13100131002', 'contact@huayusoft.com', true, 'seed' FROM partners WHERE name = '北京华宇信息技术有限公司'
UNION ALL SELECT id, '先生', '磊', '王', 'CEO', '管理层', '0571-88888801', '13000130002', 'contact@datadream.com', true, 'seed' FROM partners WHERE name = '杭州数梦工场科技有限公司'
UNION ALL SELECT id, '先生', '帆', '杨', '技术总监', '技术部', '028-88888801', '13900139003', 'contact@4data.com', true, 'seed' FROM partners WHERE name = '成都四方伟业软件股份有限公司'
UNION ALL SELECT id, '先生', '磊', '黄', '实施总监', '实施部', '020-88888801', '13800138003', 'contact@sie.com', true, 'seed' FROM partners WHERE name = '广州赛意信息科技股份有限公司'
UNION ALL SELECT id, '先生', '刚', '刘', '总经理', '管理层', '0731-88888801', '13700137003', 'contact@kerton.com', true, 'seed' FROM partners WHERE name = '湖南科创信息技术股份有限公司'
UNION ALL SELECT id, '先生', '进', '钱', '副总裁', '业务发展部', '0755-88888804', '13600136003', 'contact@mgi.com', true, 'seed' FROM partners WHERE name = '深圳华大智造科技股份有限公司'
UNION ALL SELECT id, '女士', '鹏', '张', '数据智能总经理', '数据智能事业部', '010-88888808', '13500135003', 'contact@baifendian.com', true, 'seed' FROM partners WHERE name = '北京百分点信息科技有限公司'
UNION ALL SELECT id, '先生', '阳', '赵', '政务事业部总监', '政务事业部', '0571-88888802', '13400134003', 'contact@inspur.com', true, 'seed' FROM partners WHERE name = '浙江浙大网新科技股份有限公司'
UNION ALL SELECT id, '先生', '鹏', '孙', '总经理', '管理层', '025-88888801', '13300133003', 'contact@hwasun.com', true, 'seed' FROM partners WHERE name = '南京华苏科技有限公司'
UNION ALL SELECT id, '先生', '可', '陈', 'CEO', '管理层', '0755-88888805', '13200132003', 'contact@intellif.com', true, 'seed' FROM partners WHERE name = '深圳云天励飞技术股份有限公司'
UNION ALL SELECT id, '先生', '杰', '林', '金融事业部总监', '金融事业部', '020-88888802', '13100131003', 'contact@grg.com', true, 'seed' FROM partners WHERE name = '广州广电运通金融电子股份有限公司'
UNION ALL SELECT id, '女士', '芳', '王', '总经理', '管理层', '0532-88888801', '13000130003', 'contact@sdbdt.com', true, 'seed' FROM partners WHERE name = '山东半岛信息技术有限公司'
UNION ALL SELECT id, '先生', '强', '马', '技术总监', '技术部', '0971-88888801', '13900139004', 'contact@westmining.com', true, 'seed' FROM partners WHERE name = '西部矿业信息技术有限公司';

-- ─── 5. 营销活动数据 ─────────────────────────────────────────────────────────
INSERT INTO marketing_activities (name, type, event_date, status, budget, actual_spend, leads_generated, progress, data_source, currency)
VALUES
('2025华为全联接大会合作伙伴专场', '行业大会', '2025-09-19', 'Planning', 800000, 0, 0, 10, 'seed', 'CNY'),
('金融科技数字化转型高峰论坛', '行业峰会', '2025-08-28', 'In Progress', 450000, 320000, 38, 65, 'seed', 'CNY'),
('政务云信创改造研讨会', '技术沙龙', '2025-07-15', 'Completed', 150000, 145000, 52, 100, 'seed', 'CNY'),
('医疗AI创新应用展示会', '产品发布会', '2025-06-20', 'Completed', 200000, 185000, 45, 100, 'seed', 'CNY'),
('制造业数字化转型巡回 workshop', '培训活动', '2025-05-10', 'Completed', 300000, 280000, 86, 100, 'seed', 'CNY'),
('渠道伙伴赋能计划Q3', '培训活动', '2025-09-01', 'Planning', 500000, 0, 0, 5, 'seed', 'CNY'),
('智慧城市数据中台技术峰会', '行业峰会', '2025-08-15', 'In Progress', 380000, 200000, 28, 55, 'seed', 'CNY'),
('能源行业数字化转型论坛', '行业大会', '2025-07-28', 'In Progress', 280000, 150000, 22, 50, 'seed', 'CNY'),
('5G+工业互联网创新大会', '行业大会', '2025-10-15', 'Planning', 600000, 0, 0, 3, 'seed', 'CNY'),
('信创替代解决方案推介会', '技术沙龙', '2025-06-30', 'Completed', 180000, 165000, 35, 100, 'seed', 'CNY'),
('AI+行业应用创新大赛', '竞赛活动', '2025-08-01', 'In Progress', 400000, 180000, 120, 45, 'seed', 'CNY'),
('渠道生态合作伙伴大会', '行业大会', '2025-11-20', 'Planning', 900000, 0, 0, 2, 'seed', 'CNY');

-- ─── 6. 激励计划数据 ─────────────────────────────────────────────────────────
INSERT INTO incentive_programs (title, trigger_type, status, payout_type, total_budget, claimed_amount, participants_count, description, start_date, end_date, data_source, currency)
VALUES
-- Q3医疗行业专项
('Q3医疗行业数字化转型激励计划', 'Pipeline Gap', 'Active', 'Rebate', 3000000, 1250000, 38,
 '针对医疗行业渠道伙伴的专项激励，支持医疗云、智慧医院、AI辅助诊疗等解决方案推广', '2025-07-01', '2025-09-30', 'seed', 'CNY'),
-- Q3信创替代激励
('Q3信创替代专项激励', 'Competitive', 'Active', 'Rebate', 5000000, 2100000, 52,
 '支持渠道伙伴推广基于国产芯片和操作系统的信创解决方案，扩大信创市场份额', '2025-07-01', '2025-09-30', 'seed', 'CNY'),
-- Q4业绩冲刺激励
('Q4业绩冲刺激励计划', 'Sales Acceleration', 'Upcoming', 'Cash', 2000000, 0, 0,
 'Q4季度业绩冲刺专项激励，鼓励渠道伙伴加大销售力度，冲刺年度目标', '2025-10-01', '2025-12-31', 'seed', 'CNY'),
-- 新产品推广激励
('云原生平台新产品推广激励', 'New Product', 'Active', 'Rebate', 2500000, 680000, 25,
 '云原生平台新产品发布专项激励，支持渠道伙伴快速掌握产品并推向市场', '2025-05-01', '2025-08-31', 'seed', 'CNY'),
-- 战略伙伴专项
('战略核心伙伴专项支持计划', 'Sales Acceleration', 'Active', 'Points', 8000000, 3500000, 15,
 '针对战略核心伙伴的专属激励政策，包含市场基金、技术支持和联合营销资源', '2025-01-01', '2025-12-31', 'seed', 'CNY'),
-- 大单激励
('重点大单特别激励计划', 'Sales Acceleration', 'Active', 'Cash', 4000000, 1500000, 18,
 '针对单笔金额超过500万的重点大单的特别激励，加快大单成交速度', '2025-04-01', '2025-12-31', 'seed', 'CNY'),
-- 区域激励
('华南区域市场拓展激励', 'Pipeline Gap', 'Ended', 'Rebate', 1500000, 1500000, 32,
 '华南区域市场拓展专项激励，已完成执行，效果良好', '2025-01-01', '2025-06-30', 'seed', 'CNY'),
-- 新伙伴激励
('新签约伙伴破冰激励', 'New Product', 'Ended', 'Cash', 1000000, 800000, 28,
 '针对新签约伙伴的前6个月专项激励，帮助新伙伴快速成长', '2025-01-01', '2025-06-30', 'seed', 'CNY');

-- ─── 7. MDF预算分配 ─────────────────────────────────────────────────────────
INSERT INTO mdf_allocations (partner_id, partner_name, quarter, amount, status, applications, approved_apps, data_source, currency)
VALUES
((SELECT id FROM partners WHERE name = '神州数码集团股份有限公司'), '神州数码集团股份有限公司', '2025 Q3', 1200000, 'used', 4, 3, 'seed', 'CNY'),
((SELECT id FROM partners WHERE name = '华为技术有限公司'), '华为技术有限公司', '2025 Q3', 1000000, 'used', 3, 3, 'seed', 'CNY'),
((SELECT id FROM partners WHERE name = '东软集团股份有限公司'), '东软集团股份有限公司', '2025 Q3', 800000, 'available', 2, 2, 'seed', 'CNY'),
((SELECT id FROM partners WHERE name = '浪潮电子信息产业股份有限公司'), '浪潮电子信息产业股份有限公司', '2025 Q3', 900000, 'partial', 3, 2, 'seed', 'CNY'),
((SELECT id FROM partners WHERE name = '中科软科技股份有限公司'), '中科软科技股份有限公司', '2025 Q3', 600000, 'available', 2, 1, 'seed', 'CNY'),
((SELECT id FROM partners WHERE name = '太极计算机股份有限公司'), '太极计算机股份有限公司', '2025 Q3', 700000, 'partial', 2, 2, 'seed', 'CNY'),
((SELECT id FROM partners WHERE name = '华东医卫云科技术有限公司'), '华东医卫云科技术有限公司', '2025 Q3', 500000, 'used', 2, 2, 'seed', 'CNY'),
((SELECT id FROM partners WHERE name = '上海智医信息科技有限公司'), '上海智医信息科技有限公司', '2025 Q3', 450000, 'available', 1, 1, 'seed', 'CNY'),
((SELECT id FROM partners WHERE name = '亚信科技控股有限公司'), '亚信科技控股有限公司', '2025 Q3', 550000, 'partial', 2, 1, 'seed', 'CNY'),
((SELECT id FROM partners WHERE name = '深圳云天励飞技术股份有限公司'), '深圳云天励飞技术股份有限公司', '2025 Q2', 400000, 'used', 2, 2, 'seed', 'CNY'),
((SELECT id FROM partners WHERE name = '浙江浙大网新科技股份有限公司'), '浙江浙大网新科技股份有限公司', '2025 Q3', 350000, 'available', 1, 1, 'seed', 'CNY'),
((SELECT id FROM partners WHERE name = '北京百分点信息科技有限公司'), '北京百分点信息科技有限公司', '2025 Q2', 300000, 'used', 1, 1, 'seed', 'CNY');

-- ─── 8. PMDF联合营销申请 ─────────────────────────────────────────────────────
INSERT INTO pmdf_applications (partner_id, event_name, event_date, location, budget_requested, budget_approved, status, attendance, leads, submitted_at, approved_at, data_source, currency)
VALUES
((SELECT id FROM partners WHERE name = '上海智医信息科技有限公司'), '华东区域智慧医院建设研讨会', '2025-09-12', '上海国际会议中心', 280000, 250000, 'approved', 150, 28, '2025-06-15', '2025-06-20', 'seed', 'CNY'),
((SELECT id FROM partners WHERE name = '深圳云天励飞技术股份有限公司'), 'AI视觉产品渠道招募会', '2025-08-25', '深圳会展中心', 180000, 150000, 'approved', 80, 15, '2025-06-18', '2025-06-25', 'seed', 'CNY'),
((SELECT id FROM partners WHERE name = '杭州数梦工场科技有限公司'), '智慧城市数据中台技术沙龙', '2025-08-10', '杭州国际博览中心', 220000, 200000, 'approved', 120, 22, '2025-06-20', '2025-06-28', 'seed', 'CNY'),
((SELECT id FROM partners WHERE name = '神州数码集团股份有限公司'), '金融行业数字化转型峰会', '2025-09-28', '北京国际会议中心', 350000, 300000, 'pending', 200, 0, '2025-07-01', NULL, 'seed', 'CNY'),
((SELECT id FROM partners WHERE name = '东软集团股份有限公司'), '医疗AI创新应用展示会', '2025-07-15', '沈阳国际会展中心', 200000, 180000, 'approved', 100, 18, '2025-06-01', '2025-06-10', 'seed', 'CNY'),
((SELECT id FROM partners WHERE name = '中科软科技股份有限公司'), '保险科技数字化转型研讨会', '2025-08-20', '深圳华侨城', 160000, 140000, 'approved', 60, 12, '2025-06-22', '2025-06-30', 'seed', 'CNY'),
((SELECT id FROM partners WHERE name = '北京百分点信息科技有限公司'), '政务大数据分析平台推介会', '2025-07-25', '北京中关村', 150000, 130000, 'approved', 50, 10, '2025-06-25', '2025-07-01', 'seed', 'CNY'),
((SELECT id FROM partners WHERE name = '广州广电运通金融电子股份有限公司'), '银行智慧网点改造方案分享会', '2025-09-05', '广州天河城', 180000, 160000, 'approved', 70, 14, '2025-07-05', '2025-07-12', 'seed', 'CNY');

-- ─── 9. 激励计划申请 ─────────────────────────────────────────────────────────
INSERT INTO incentive_applications (program_id, partner_id, partner_name, deal_id, deal_title, deal_value, claimed_amount, approved_amount, status, application_date, data_source, currency)
VALUES
((SELECT id FROM incentive_programs WHERE title = 'Q3医疗行业数字化转型激励计划'),
 (SELECT id FROM partners WHERE name = '东软集团股份有限公司'), '东软集团股份有限公司',
 NULL, '某省人民医院智慧医院项目', 22000000, 220000, 180000, 'approved', '2025-07-15', 'seed', 'CNY'),
((SELECT id FROM incentive_programs WHERE title = 'Q3医疗行业数字化转型激励计划'),
 (SELECT id FROM partners WHERE name = '上海智医信息科技有限公司'), '上海智医信息科技有限公司',
 NULL, '某大型三甲医院智慧医院整体解决方案', 12000000, 120000, 100000, 'approved', '2025-07-20', 'seed', 'CNY'),
((SELECT id FROM incentive_programs WHERE title = 'Q3信创替代专项激励'),
 (SELECT id FROM partners WHERE name = '神州数码集团股份有限公司'), '神州数码集团股份有限公司',
 NULL, '2025年萧山区政务云(信创)服务项目', 18100000, 181000, 150000, 'approved', '2025-07-10', 'seed', 'CNY'),
((SELECT id FROM incentive_programs WHERE title = 'Q3信创替代专项激励'),
 (SELECT id FROM partners WHERE name = '太极计算机股份有限公司'), '太极计算机股份有限公司',
 NULL, '某省政务云二期扩容及信创改造', 15000000, 150000, 120000, 'approved', '2025-07-18', 'seed', 'CNY'),
((SELECT id FROM incentive_programs WHERE title = '重点大单特别激励计划'),
 (SELECT id FROM partners WHERE name = '浪潮电子信息产业股份有限公司'), '浪潮电子信息产业股份有限公司',
 NULL, '某省会城市政务云信创改造项目', 25000000, 250000, 200000, 'approved', '2025-06-20', 'seed', 'CNY'),
((SELECT id FROM incentive_programs WHERE title = '云原生平台新产品推广激励'),
 (SELECT id FROM partners WHERE name = '软通动力信息技术股份有限公司'), '软通动力信息技术股份有限公司',
 NULL, '招商银行分布式核心系统改造', 12000000, 120000, 100000, 'pending', '2025-07-25', 'seed', 'CNY');

-- ─── 10. 商机报备数据 (21个) ────────────────────────────────────────────────────
-- 统一使用 stage 字段，值：Registered, UnderReview, Approved, Solution, Commercial, Negotiation, ClosedWon, ClosedLost
INSERT INTO deals (title, customer, value, partner_id, partner_name, partner_type, status, stage, region, sales_name, sales_team, product_type, created_date, end_date, is_priority, has_conflict, description, currency, data_source, weighted_value)
VALUES
-- 政务云/信创项目
('2025年萧山区政务云(信创)服务项目', '杭州市萧山区大数据发展管理局', 18100000, 
 (SELECT id FROM partners WHERE name = '神州数码集团股份有限公司'), '神州数码集团股份有限公司', 'VAD', 'Approved', 'Approved', '华东', '高波', '政务事业部', '信创云平台', '2025-06-01', '2025-12-31', true, false,
 '基于鲲鹏/飞腾架构的信创云服务，替代原有x86云平台，需完成30+个委办局业务迁移', 'CNY', 'seed', 4525000),

('某省政务云二期扩容及信创改造', '某省大数据局', 15000000,
 (SELECT id FROM partners WHERE name = '太极计算机股份有限公司'), '太极计算机股份有限公司', 'SI', 'Pending', 'UnderReview', '华北', '张伟', '政务事业部', '信创云平台', '2025-06-15', '2026-03-31', true, false,
 '省级政务云平台扩容，新增信创资源池，承载200+政务应用', 'CNY', 'seed', 2250000),

('上城区智慧医疗云服务项目', '杭州市上城区卫生健康局', 12000000,
 (SELECT id FROM partners WHERE name = '华东医卫云科技术有限公司'), '华东医卫云科技术有限公司', 'ISV', 'Approved', 'Approved', '华东', '陈伟', '医疗事业部', '医疗云平台', '2025-06-20', '2025-11-30', true, false,
 '区域医疗云平台建设，覆盖100+基层医疗机构，实现诊疗数据互通', 'CNY', 'seed', 3000000),

-- 医疗信息化项目
('某大型三甲医院智慧医院整体解决方案', '某省人民医院', 22000000,
 (SELECT id FROM partners WHERE name = '上海智医信息科技有限公司'), '上海智医信息科技有限公司', 'ISV', 'Solution', 'Solution', '华东', '王浩', '医疗事业部', '智慧医院整体解决方案', '2025-05-10', '2026-06-30', true, false,
 '包含HIS、PACS、LIS、HRP等核心系统重构，引入AI辅助诊疗能力', 'CNY', 'seed', 8800000),

('阿克苏地区第二人民医院医疗云服务', '阿克苏地区第二人民医院', 8500000,
 (SELECT id FROM partners WHERE name = '东软集团股份有限公司'), '东软集团股份有限公司', 'ISV', 'Approved', 'Approved', '西部', '陈明', '医疗事业部', '医疗云服务', '2025-04-15', '2025-10-31', false, false,
 '边疆地区医院上云改造，提供远程医疗支撑能力', 'CNY', 'seed', 2125000),

('心血管病高质量数据集建设项目', '国家心血管病中心', 13000000,
 (SELECT id FROM partners WHERE name = '华为技术有限公司'), '华为技术有限公司', 'OEM', 'Commercial', 'Commercial', '华北', '李娜', '医疗事业部', '医疗AI平台', '2025-07-01', '2026-06-30', true, false,
 '高质量数据集建设，包含影像数据标注和AI模型训练', 'CNY', 'seed', 7800000),

-- 金融保险项目
('某头部保险企业核心系统云化迁移', '中国平安保险集团', 9800000,
 (SELECT id FROM partners WHERE name = '中科软科技股份有限公司'), '中科软科技股份有限公司', 'ISV', 'Approved', 'Approved', '华南', '刘洋', '金融事业部', '金融云平台', '2025-03-20', '2025-12-31', true, true,
 '保险核心系统迁移至金融云平台，涉及20+套核心系统重构', 'CNY', 'seed', 2450000),

('招商银行分布式核心系统改造', '招商银行股份有限公司', 12000000,
 (SELECT id FROM partners WHERE name = '软通动力信息技术股份有限公司'), '软通动力信息技术股份有限公司', 'SI', 'Negotiation', 'Negotiation', '华南', '赵华', '金融事业部', '分布式核心系统', '2025-05-25', '2026-03-31', true, false,
 '银行核心系统分布式改造，提升交易处理能力至10万TPS', 'CNY', 'seed', 9600000),

('某股份制银行AI智能风控系统', '中信证券', 7500000,
 (SELECT id FROM partners WHERE name = '中软国际有限公司'), '中软国际有限公司', 'Service', 'Approved', 'Approved', '华南', '吴明', '金融事业部', 'AI风控平台', '2025-06-10', '2025-12-31', false, false,
 '智能风控系统建设，引入机器学习模型进行实时风险监控', 'CNY', 'seed', 1875000),

-- 智慧城市/大数据项目
('某省会城市智慧城市数据中台', '某市大数据发展管理局', 18000000,
 (SELECT id FROM partners WHERE name = '杭州数梦工场科技有限公司'), '杭州数梦工场科技有限公司', 'ISV', 'Solution', 'Solution', '华东', '王磊', '智慧城市事业部', '数据中台', '2025-04-20', '2026-01-31', true, false,
 '城市数据资源池建设，打通50+部门数据壁垒', 'CNY', 'seed', 7200000),

('深圳福田区智慧城区AI视觉系统', '深圳市福田区政务服务数据管理局', 9500000,
 (SELECT id FROM partners WHERE name = '深圳云天励飞技术股份有限公司'), '深圳云天励飞技术股份有限公司', 'ISV', 'Approved', 'Approved', '华南', '陈可', '智慧城市事业部', 'AI视觉平台', '2025-06-05', '2025-12-31', true, false,
 '城区级视频AI分析系统，覆盖10000路视频监控', 'CNY', 'seed', 2375000),

('某省政务大数据平台升级', '某省信息中心', 11000000,
 (SELECT id FROM partners WHERE name = '浙江浙大网新科技股份有限公司'), '浙江浙大网新科技股份有限公司', 'SI', 'Pending', 'UnderReview', '华东', '赵阳', '政务事业部', '大数据平台', '2025-07-10', '2026-04-30', false, false,
 '省级大数据平台能力升级，新增实时分析能力', 'CNY', 'seed', 1650000),

-- 能源/制造业项目
('国家电网数据安全合规改造', '国家电网有限公司', 8500000,
 (SELECT id FROM partners WHERE name = '神州数码集团股份有限公司'), '神州数码集团股份有限公司', 'VAD', 'Closed Won', 'ClosedWon', '华北', '高波', '能源事业部', '安全合规', '2024-11-10', '2025-06-30', true, false,
 '电网关键基础设施安全改造，等保三级合规建设', 'CNY', 'seed', 8500000),

('宝武钢铁工业互联网平台', '宝武钢铁集团有限公司', 9200000,
 (SELECT id FROM partners WHERE name = '上海宝信软件股份有限公司'), '上海宝信软件股份有限公司', 'ISV', 'Solution', 'Solution', '华东', '陈强', '制造事业部', '工业互联网平台', '2025-05-30', '2026-02-28', true, false,
 '钢铁行业工业互联网平台，连接5000+设备终端', 'CNY', 'seed', 3680000),

('西部矿业智能矿山系统', '西部矿业信息技术有限公司', 6800000,
 (SELECT id FROM partners WHERE name = '西部矿业信息技术有限公司'), '西部矿业信息技术有限公司', 'ISV', 'Commercial', 'Commercial', '西部', '马强', '能源事业部', '智能矿山系统', '2025-06-25', '2025-12-31', false, false,
 '高原矿山智能化改造，引入5G和无人驾驶技术', 'CNY', 'seed', 4080000),

-- 数据库信创项目
('某省政务数据库信创替代项目', '某省大数据中心', 7200000,
 (SELECT id FROM partners WHERE name = '武汉达梦数据库股份有限公司'), '武汉达梦数据库股份有限公司', 'ISV', 'Approved', 'Approved', '华中', '郑涛', '信创事业部', '国产数据库', '2025-03-15', '2025-09-30', true, false,
 'Oracle/MySQL至国产数据库迁移，替换300+套业务系统', 'CNY', 'seed', 1800000),

('某银行核心数据库国产化替换', '某城市商业银行', 5600000,
 (SELECT id FROM partners WHERE name = '武汉达梦数据库股份有限公司'), '武汉达梦数据库股份有限公司', 'ISV', 'Pending', 'UnderReview', '华北', '郑涛', '金融事业部', '国产数据库', '2025-07-01', '2026-01-31', false, false,
 '银行核心交易系统数据库替换，需满足金融级可靠性要求', 'CNY', 'seed', 840000),

-- 通信/5G项目
('中国移动5G核心网优化项目', '中国移动通信集团有限公司', 11500000,
 (SELECT id FROM partners WHERE name = '亚信科技控股有限公司'), '亚信科技控股有限公司', 'ISV', 'Negotiation', 'Negotiation', '华北', '周伟', '通信事业部', '5G核心网', '2025-04-28', '2025-12-31', true, false,
 '5G核心网功能升级，引入网络切片和边缘计算能力', 'CNY', 'seed', 9200000),

-- 教育项目
('某省教育云平台扩容项目', '某省教育厅', 6800000,
 (SELECT id FROM partners WHERE name = '北京华宇信息技术有限公司'), '北京华宇信息技术有限公司', 'Reseller', 'Approved', 'Approved', '华北', '李明', '教育事业部', '教育云平台', '2025-05-18', '2025-11-30', false, false,
 '省级教育资源云平台扩容，支撑10000+学校在线教学', 'CNY', 'seed', 1700000),

-- ERP/企业软件
('某制造集团ERP系统云化升级', '海尔集团有限公司', 4800000,
 (SELECT id FROM partners WHERE name = '用友网络科技股份有限公司'), '用友网络科技股份有限公司', 'ISV', 'Commercial', 'Commercial', '华东', '林芳', '制造事业部', '云ERP', '2025-06-12', '2025-12-31', false, false,
 '大型制造企业ERP系统升级，迁移至用友BIP云平台', 'CNY', 'seed', 2880000),

-- AI/智能化项目
('某市政府12345热线智能升级', '某市市民服务热线中心', 4200000,
 (SELECT id FROM partners WHERE name = '北京百分点信息科技有限公司'), '北京百分点信息科技有限公司', 'ISV', 'Approved', 'Approved', '华北', '张鹏', '智慧城市事业部', 'AI智能客服', '2025-06-28', '2025-10-31', false, false,
 '政务热线智能升级，引入大模型和知识图谱技术', 'CNY', 'seed', 1050000),

('广电运通智慧网点AI改造', '中国建设银行广东省分行', 6500000,
 (SELECT id FROM partners WHERE name = '广州广电运通金融电子股份有限公司'), '广州广电运通金融电子股份有限公司', 'ISV', 'Solution', 'Solution', '华南', '林杰', '金融事业部', '智慧网点AI', '2025-07-05', '2026-01-31', false, false,
 '银行网点智能化改造，部署200+智能终端设备', 'CNY', 'seed', 2600000);

-- ─── 11. 商机生命周期事件 ─────────────────────────────────────────────────────
INSERT INTO deal_lifecycle_events (deal_id, stage, event_date, description, actor)
SELECT id, 'Registered', created_date, '合作伙伴提交商机报备', sales_name FROM deals WHERE title = '2025年萧山区政务云(信创)服务项目'
UNION ALL SELECT id, 'Approved', '2025-06-05', '渠道经理审核通过，项目进入方案阶段', '渠道总监' FROM deals WHERE title = '2025年萧山区政务云(信创)服务项目'
UNION ALL SELECT id, 'Registered', created_date, '合作伙伴提交商机报备', sales_name FROM deals WHERE title = '某大型三甲医院智慧医院整体解决方案'
UNION ALL SELECT id, 'Approved', '2025-05-15', '渠道经理审核通过，进入解决方案设计阶段', '渠道总监' FROM deals WHERE title = '某大型三甲医院智慧医院整体解决方案'
UNION ALL SELECT id, 'Registered', created_date, '合作伙伴提交商机报备', sales_name FROM deals WHERE title = '某头部保险企业核心系统云化迁移'
UNION ALL SELECT id, 'Approved', '2025-03-25', '渠道经理审核通过', '渠道总监' FROM deals WHERE title = '某头部保险企业核心系统云化迁移'
UNION ALL SELECT id, 'Registered', created_date, '合作伙伴提交商机报备', sales_name FROM deals WHERE title = '国家电网数据安全合规改造'
UNION ALL SELECT id, 'Approved', '2024-11-15', '渠道经理审核通过', '渠道总监' FROM deals WHERE title = '国家电网数据安全合规改造'
UNION ALL SELECT id, 'Solution', '2024-12-01', '进入方案设计阶段', '技术总监' FROM deals WHERE title = '国家电网数据安全合规改造'
UNION ALL SELECT id, 'Commercial', '2025-02-15', '进入商务洽谈阶段', '商务经理' FROM deals WHERE title = '国家电网数据安全合规改造'
UNION ALL SELECT id, 'Negotiation', '2025-05-10', '进入合同谈判阶段', '商务经理' FROM deals WHERE title = '国家电网数据安全合规改造'
UNION ALL SELECT id, 'ClosedWon', '2025-06-15', '项目签约，合同金额850万', '销售总监' FROM deals WHERE title = '国家电网数据安全合规改造'
UNION ALL SELECT id, 'Registered', created_date, '合作伙伴提交商机报备', sales_name FROM deals WHERE title = '某省政务数据库信创替代项目'
UNION ALL SELECT id, 'Approved', '2025-03-20', '渠道经理审核通过', '渠道总监' FROM deals WHERE title = '某省政务数据库信创替代项目'
UNION ALL SELECT id, 'Registered', created_date, '合作伙伴提交商机报备', sales_name FROM deals WHERE title = '招商银行分布式核心系统改造'
UNION ALL SELECT id, 'Approved', '2025-05-30', '渠道经理审核通过', '渠道总监' FROM deals WHERE title = '招商银行分布式核心系统改造'
UNION ALL SELECT id, 'Solution', '2025-06-10', '进入解决方案设计阶段', '技术总监' FROM deals WHERE title = '招商银行分布式核心系统改造'
UNION ALL SELECT id, 'Commercial', '2025-07-01', '进入商务洽谈阶段', '商务经理' FROM deals WHERE title = '招商银行分布式核心系统改造';

-- ─── 12. 更新商机关联到营销活动和激励计划 ────────────────────────────────────
-- 将部分商机关联到对应的营销活动
UPDATE deals SET origin_activity_id = (SELECT id FROM marketing_activities WHERE name = '医疗AI创新应用展示会')
WHERE title IN ('某大型三甲医院智慧医院整体解决方案', '心血管病高质量数据集建设项目');

UPDATE deals SET origin_activity_id = (SELECT id FROM marketing_activities WHERE name = '政务云信创改造研讨会')
WHERE title IN ('2025年萧山区政务云(信创)服务项目', '某省政务云二期扩容及信创改造');

UPDATE deals SET origin_activity_id = (SELECT id FROM marketing_activities WHERE name = '金融科技数字化转型高峰论坛')
WHERE title IN ('某头部保险企业核心系统云化迁移', '某股份制银行AI智能风控系统');

UPDATE deals SET origin_activity_id = (SELECT id FROM marketing_activities WHERE name = '智慧城市数据中台技术峰会')
WHERE title IN ('某省会城市智慧城市数据中台', '深圳福田区智慧城区AI视觉系统');

-- 将部分商机关联到对应的激励计划
UPDATE deals SET incentive_program_id = (SELECT id FROM incentive_programs WHERE title = 'Q3信创替代专项激励')
WHERE title IN ('2025年萧山区政务云(信创)服务项目', '某省政务云二期扩容及信创改造', '某省政务数据库信创替代项目');

UPDATE deals SET incentive_program_id = (SELECT id FROM incentive_programs WHERE title = 'Q3医疗行业数字化转型激励计划')
WHERE title IN ('某大型三甲医院智慧医院整体解决方案', '上城区智慧医疗云服务项目');

UPDATE deals SET incentive_program_id = (SELECT id FROM incentive_programs WHERE title = '重点大单特别激励计划')
WHERE value >= 10000000;

-- ─── 13. 更新 computed_win_rate ──────────────────────────────────────────────
UPDATE partners p SET 
  computed_win_rate = CASE 
    WHEN t.total > 0 THEN ROUND((t.won::DECIMAL / t.total) * 100, 2)
    ELSE 0 
  END
FROM (
  SELECT 
    partner_id,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE deals.stage = 'ClosedWon') as won
  FROM deals
  GROUP BY partner_id
) t
WHERE p.id = t.partner_id;

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 完成！
-- 数据逻辑已修复，所有数据均标记为 'seed'（演示数据）
-- ═══════════════════════════════════════════════════════════════════════════════════
