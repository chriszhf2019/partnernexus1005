-- ═════════════════════════════════════════════════════════════════════════
-- 2026年度演示数据生成脚本
-- 为 EcosystemDashboard 提供真实数据
-- ═════════════════════════════════════════════════════════════════════════

-- ─── 1. 清空现有商机数据 ────────────────────────────────
DELETE FROM deal_lifecycle_events;
DELETE FROM deals;

-- ─── 2. 生成2026年Q1-Q2商机数据 ────────────────────────────────
-- 确保数据有正确的 stage 字段，且有 ClosedWon 记录产生营收

INSERT INTO deals (title, customer, value, partner_id, partner_name, partner_type, status, stage, region, sales_name, sales_team, product_type, created_date, end_date, is_priority, has_conflict, description)
VALUES
-- ═══════════════ Q1 已成交（产生营收）═════════════════════
-- 华北区域成交
('2026年北京市政务云扩容项目', '北京市经济和信息化局', 2800000,
 (SELECT id FROM partners WHERE name = '神州数码集团股份有限公司'), '神州数码集团股份有限公司', 'VAD', 'ClosedWon', 'ClosedWon', '华北', '高波', '政务事业部', '信创云平台', '2026-01-05', '2026-03-15', true, false,
 'Q1成交：北京市政务云平台扩容，覆盖50+委办局'),

('某国有银行核心系统云化项目', '中国工商银行数据中心', 3500000,
 (SELECT id FROM partners WHERE name = '中科软科技股份有限公司'), '中科软科技股份有限公司', 'ISV', 'ClosedWon', 'ClosedWon', '华北', '刘洋', '金融事业部', '金融云平台', '2026-01-15', '2026-03-20', true, false,
 'Q1成交：银行核心系统迁移至金融云平台'),

('某省政务大数据平台一期', '某省大数据发展中心', 2200000,
 (SELECT id FROM partners WHERE name = '太极计算机股份有限公司'), '太极计算机股份有限公司', 'SI', 'ClosedWon', 'ClosedWon', '华北', '张伟', '政务事业部', '大数据平台', '2026-02-01', '2026-03-25', true, false,
 'Q1成交：省级政务数据中台建设'),

-- 华东区域成交
('上海市医疗云平台建设项目', '上海市卫生健康委员会', 4200000,
 (SELECT id FROM partners WHERE name = '华东医卫云科技术有限公司'), '华东医卫云科技术有限公司', 'ISV', 'ClosedWon', 'ClosedWon', '华东', '陈伟', '医疗事业部', '医疗云平台', '2026-01-10', '2026-03-30', true, false,
 'Q1成交：区域医疗云平台，覆盖200+医疗机构'),

('某头部券商数据中台项目', '中信证券股份有限公司', 1800000,
 (SELECT id FROM partners WHERE name = '软通动力信息技术股份有限公司'), '软通动力信息技术股份有限公司', 'SI', 'ClosedWon', 'ClosedWon', '华东', '赵华', '金融事业部', '数据中台', '2026-02-15', '2026-03-28', true, false,
 'Q1成交：券商数据中台建设'),

-- 华南区域成交
('深圳市智慧城市数据治理项目', '深圳市政务服务数据管理局', 3100000,
 (SELECT id FROM partners WHERE name = '华为技术有限公司'), '华为技术有限公司', 'OEM', 'ClosedWon', 'ClosedWon', '华南', '李娜', '智慧城市事业部', '数据治理平台', '2026-01-20', '2026-03-18', true, false,
 'Q1成交：城市数据资产治理与共享平台'),

('广东省人民医院智慧医院项目', '广东省人民医院', 2600000,
 (SELECT id FROM partners WHERE name = '广州广电运通金融电子股份有限公司'), '广州广电运通金融电子股份有限公司', 'ISV', 'ClosedWon', 'ClosedWon', '华南', '林杰', '医疗事业部', '智慧医院整体解决方案', '2026-02-20', '2026-03-25', true, false,
 'Q1成交：三甲医院智慧医院整体建设'),

-- 西部区域成交
('四川省政务云信创改造项目', '四川省大数据发展管理局', 1950000,
 (SELECT id FROM partners WHERE name = '成都四方伟业软件股份有限公司'), '成都四方伟业软件股份有限公司', 'ISV', 'ClosedWon', 'ClosedWon', '西部', '杨帆', '政务事业部', '信创云平台', '2026-01-25', '2026-03-20', true, false,
 'Q1成交：省级政务云信创替代'),

-- ═══════════════ Q2 已成交（产生营收）═════════════════════
-- 华北Q2成交
('某省政务云二期扩容项目', '某省大数据局', 3200000,
 (SELECT id FROM partners WHERE name = '神州数码集团股份有限公司'), '神州数码集团股份有限公司', 'VAD', 'ClosedWon', 'ClosedWon', '华北', '高波', '政务事业部', '信创云平台', '2026-04-05', '2026-06-10', true, false,
 'Q2成交：政务云平台扩容，新增信创资源池'),

('某头部保险核心系统云化', '中国人寿保险股份有限公司', 2900000,
 (SELECT id FROM partners WHERE name = '中科软科技股份有限公司'), '中科软科技股份有限公司', 'ISV', 'ClosedWon', 'ClosedWon', '华北', '刘洋', '金融事业部', '金融云平台', '2026-04-12', '2026-06-15', true, false,
 'Q2成交：保险核心系统迁移'),

('某三甲医院DRG分组系统项目', '北京某三甲医院', 1500000,
 (SELECT id FROM partners WHERE name = '东软集团股份有限公司'), '东软集团股份有限公司', 'ISV', 'ClosedWon', 'ClosedWon', '华北', '陈明', '医疗事业部', '医疗信息化', '2026-05-10', '2026-06-20', true, false,
 'Q2成交：医院DRG医保支付改革系统'),

-- 华东Q2成交
('浙江省智慧城市数据中台', '浙江省大数据发展管理局', 3800000,
 (SELECT id FROM partners WHERE name = '浙江浙大网新科技股份有限公司'), '浙江浙大网新科技股份有限公司', 'SI', 'ClosedWon', 'ClosedWon', '华东', '赵阳', '智慧城市事业部', '数据中台', '2026-04-08', '2026-06-18', true, false,
 'Q2成交：省级智慧城市数据中台'),

('上海市某区智慧养老项目', '上海市某区民政局', 1650000,
 (SELECT id FROM partners WHERE name = '上海智医信息科技有限公司'), '上海智医信息科技有限公司', 'ISV', 'ClosedWon', 'ClosedWon', '华东', '王浩', '医疗事业部', '智慧养老平台', '2026-05-15', '2026-06-25', true, false,
 'Q2成交：智慧养老服务管理平台'),

('某钢铁集团数据安全项目', '宝武钢铁集团有限公司', 2100000,
 (SELECT id FROM partners WHERE name = '上海宝信软件股份有限公司'), '上海宝信软件股份有限公司', 'ISV', 'ClosedWon', 'ClosedWon', '华东', '陈强', '制造事业部', '数据安全', '2026-04-20', '2026-06-22', true, false,
 'Q2成交：钢铁集团数据安全合规建设'),

-- 华南Q2成交
('深圳市某区智慧应急指挥系统', '深圳市应急管理局', 2350000,
 (SELECT id FROM partners WHERE name = '深圳云天励飞技术股份有限公司'), '深圳云天励飞技术股份有限公司', 'ISV', 'ClosedWon', 'ClosedWon', '华南', '陈可', '智慧城市事业部', 'AI视觉平台', '2026-04-10', '2026-06-12', true, false,
 'Q2成交：应急指挥AI视觉系统'),

('某省农村信用社金融云项目', '某省农村信用社联合社', 2450000,
 (SELECT id FROM partners WHERE name = '中软国际有限公司'), '中软国际有限公司', 'Service', 'ClosedWon', 'ClosedWon', '华南', '吴明', '金融事业部', '金融云平台', '2026-05-08', '2026-06-20', true, false,
 'Q2成交：农信社核心系统云化'),

-- ═══════════════ Q2 进行中商机（Pipeline）═════════════════════
-- 华北进行中
('某市政务云三期建设（信创型）', '某市大数据发展管理局', 4500000,
 (SELECT id FROM partners WHERE name = '太极计算机股份有限公司'), '太极计算机股份有限公司', 'SI', 'Negotiation', 'Negotiation', '华北', '张伟', '政务事业部', '信创云平台', '2026-05-01', '2026-09-30', true, false,
 'Q2跟进中：第三期信创政务云建设'),

('某省医保信息平台升级项目', '某省医疗保障局', 2800000,
 (SELECT id FROM partners WHERE name = '东软集团股份有限公司'), '东软集团股份有限公司', 'ISV', 'Commercial', 'Commercial', '华北', '陈明', '医疗事业部', '医疗信息化', '2026-05-20', '2026-10-31', true, false,
 'Q2跟进中：医保信息系统升级'),

-- 华东进行中
('某头部车企数据中台项目', '某知名汽车制造商', 5500000,
 (SELECT id FROM partners WHERE name = '用友网络科技股份有限公司'), '用友网络科技股份有限公司', 'ISV', 'Solution', 'Solution', '华东', '林芳', '制造事业部', '数据中台', '2026-04-15', '2026-11-30', true, false,
 'Q2跟进中：车企数字化转型数据平台'),

('某省教育云平台扩容项目', '某省教育厅', 3200000,
 (SELECT id FROM partners WHERE name = '浙江浙大网新科技股份有限公司'), '浙江浙大网新科技股份有限公司', 'SI', 'Proposal', 'Proposal', '华东', '赵阳', '教育事业部', '教育云平台', '2026-05-10', '2026-10-15', true, false,
 'Q2跟进中：教育云平台扩容'),

-- 华南进行中
('某省智慧监狱安防系统', '某省监狱管理局', 3800000,
 (SELECT id FROM partners WHERE name = '深圳云天励飞技术股份有限公司'), '深圳云天励飞技术股份有限公司', 'ISV', 'Qualification', 'Qualification', '华南', '陈可', '智慧城市事业部', 'AI视觉平台', '2026-05-25', '2026-11-30', true, false,
 'Q2跟进中：智慧监狱安防系统'),

('某股份银行AI风控系统', '某股份制商业银行', 4200000,
 (SELECT id FROM partners WHERE name = '华为技术有限公司'), '华为技术有限公司', 'OEM', 'Proposal', 'Proposal', '华南', '李娜', '金融事业部', 'AI风控平台', '2026-04-20', '2026-09-30', true, false,
 'Q2跟进中：银行AI智能风控平台'),

-- 西部进行中
('某省能源集团工业互联网平台', '某省能源投资集团', 4800000,
 (SELECT id FROM partners WHERE name = '西部矿业信息技术有限公司'), '西部矿业信息技术有限公司', 'ISV', 'Solution', 'Solution', '西部', '马强', '能源事业部', '工业互联网平台', '2026-05-05', '2026-12-31', true, false,
 'Q2跟进中：能源集团工业互联网建设'),

-- ═══════════════ 线索阶段商机 ══════════════════════
('某市智慧交通项目（潜在）', '某市交通运输局', 3500000,
 (SELECT id FROM partners WHERE name = '杭州数梦工场科技有限公司'), '杭州数梦工场科技有限公司', 'ISV', 'Lead', 'Lead', '华东', '王磊', '智慧城市事业部', '智慧交通平台', '2026-06-01', '2026-12-31', false, false,
 '线索阶段：智慧交通顶层规划'),

('某省医疗保障局数据平台', '某省医疗保障局', 2200000,
 (SELECT id FROM partners WHERE name = '华东医卫云科技术有限公司'), '华东医卫云科技术有限公司', 'ISV', 'Prospect', 'Prospect', '华东', '陈伟', '医疗事业部', '医疗数据平台', '2026-06-10', '2026-12-31', false, false,
 '线索阶段：医保数据治理平台'),

-- ═══════════════ 流失商机 ══════════════════════
('某中小企业云化项目（流失）', '某制造企业', 800000,
 (SELECT id FROM partners WHERE name = '北京华宇信息技术有限公司'), '北京华宇信息技术有限公司', 'Reseller', 'ClosedLost', 'ClosedLost', '华北', '李明', 'SMB事业部', '企业云', '2026-03-01', '2026-05-31', false, false,
 '流失：客户预算缩减，项目暂停');

-- ─── 3. 验证数据 ────────────────────────────────
-- 检查成交记录
SELECT 'Q1-Q2成交统计' as metric, 
       COUNT(*) as deal_count, 
       SUM(value) as total_value 
FROM deals 
WHERE stage = 'ClosedWon' AND EXTRACT(YEAR FROM end_date) = 2026;

-- 检查各区域成交
SELECT region, 
       COUNT(*) as deal_count, 
       SUM(value) as total_value 
FROM deals 
WHERE stage = 'ClosedWon' 
GROUP BY region 
ORDER BY total_value DESC;

-- 检查各伙伴成交
SELECT partner_name, 
       COUNT(*) as deal_count, 
       SUM(value) as total_value 
FROM deals 
WHERE stage = 'ClosedWon' 
GROUP BY partner_name 
ORDER BY total_value DESC;

-- 检查Pipeline状态分布
SELECT stage, 
       COUNT(*) as deal_count, 
       SUM(value) as total_value 
FROM deals 
WHERE stage != 'ClosedWon' AND stage != 'ClosedLost'
GROUP BY stage;
