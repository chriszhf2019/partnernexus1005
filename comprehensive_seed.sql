-- =============================================================================
-- Comprehensive Partner Data Seed
-- Run this in your Supabase Dashboard → SQL Editor
-- =============================================================================

-- 1. Fill missing detail fields for existing partners
BEGIN;

UPDATE partners SET
  province = CASE name
    WHEN '华东医卫云科技术有限公司' THEN '上海' WHEN '上海智医科技' THEN '上海'
    WHEN '华南智慧科技' THEN '广东' WHEN '华南系统集成' THEN '广东'
    WHEN '北方信科' THEN '北京' WHEN '西部云智科技' THEN '四川'
    WHEN '华中智慧医疗' THEN '湖北' WHEN '西北云科技' THEN '陕西'
    WHEN '深圳智慧城市科技' THEN '广东' WHEN '神州数码集团股份有限公司' THEN '北京'
    WHEN '东软集团股份有限公司' THEN '辽宁' WHEN '中科软科技股份有限公司' THEN '北京'
    WHEN '浪潮电子信息产业股份有限公司' THEN '山东' WHEN '华为技术有限公司' THEN '广东'
    WHEN '软通动力信息技术股份有限公司' THEN '北京' WHEN '亚信科技控股有限公司' THEN '北京'
    WHEN '中软国际有限公司' THEN '广东' WHEN '太极计算机股份有限公司' THEN '北京'
    WHEN '上海宝信软件股份有限公司' THEN '上海' WHEN '用友网络科技股份有限公司' THEN '北京'
    WHEN '广州赛意信息科技股份有限公司' THEN '广东' WHEN '南京华苏科技有限公司' THEN '江苏'
    WHEN '武汉达梦数据库股份有限公司' THEN '湖北' WHEN '成都四方伟业软件股份有限公司' THEN '四川'
    WHEN '西安未来国际信息股份有限公司' THEN '陕西' WHEN '福建顶点软件股份有限公司' THEN '福建'
    WHEN '湖南科创信息技术股份有限公司' THEN '湖南' WHEN '重庆梅安森科技股份有限公司' THEN '重庆'
    WHEN '深圳华大智造科技股份有限公司' THEN '广东' WHEN '山东半岛科技' THEN '山东'
  END,
  city = CASE name
    WHEN '华东医卫云科技术有限公司' THEN '上海市' WHEN '上海智医科技' THEN '上海市'
    WHEN '华南智慧科技' THEN '深圳市' WHEN '华南系统集成' THEN '广州市'
    WHEN '北方信科' THEN '北京市' WHEN '西部云智科技' THEN '成都市'
    WHEN '华中智慧医疗' THEN '武汉市' WHEN '西北云科技' THEN '西安市'
    WHEN '深圳智慧城市科技' THEN '深圳市' WHEN '神州数码集团股份有限公司' THEN '北京市'
    WHEN '东软集团股份有限公司' THEN '沈阳市' WHEN '中科软科技股份有限公司' THEN '北京市'
    WHEN '浪潮电子信息产业股份有限公司' THEN '济南市' WHEN '华为技术有限公司' THEN '深圳市'
    WHEN '软通动力信息技术股份有限公司' THEN '北京市' WHEN '亚信科技控股有限公司' THEN '北京市'
    WHEN '中软国际有限公司' THEN '深圳市' WHEN '太极计算机股份有限公司' THEN '北京市'
    WHEN '上海宝信软件股份有限公司' THEN '上海市' WHEN '用友网络科技股份有限公司' THEN '北京市'
    WHEN '广州赛意信息科技股份有限公司' THEN '广州市' WHEN '南京华苏科技有限公司' THEN '南京市'
    WHEN '武汉达梦数据库股份有限公司' THEN '武汉市' WHEN '成都四方伟业软件股份有限公司' THEN '成都市'
    WHEN '西安未来国际信息股份有限公司' THEN '西安市' WHEN '福建顶点软件股份有限公司' THEN '福州市'
    WHEN '湖南科创信息技术股份有限公司' THEN '长沙市' WHEN '重庆梅安森科技股份有限公司' THEN '重庆市'
    WHEN '深圳华大智造科技股份有限公司' THEN '深圳市' WHEN '山东半岛科技' THEN '青岛市'
  END,
  district = CASE city
    WHEN '上海市' THEN '浦东新区' WHEN '北京市' THEN '海淀区'
    WHEN '深圳市' THEN '南山区' WHEN '广州市' THEN '天河区'
    WHEN '成都市' THEN '高新区' WHEN '武汉市' THEN '东湖高新区'
    WHEN '西安市' THEN '雁塔区' WHEN '沈阳市' THEN '浑南区'
    WHEN '济南市' THEN '高新区' WHEN '青岛市' THEN '崂山区'
    WHEN '南京市' THEN '建邺区' WHEN '长沙市' THEN '岳麓区'
    WHEN '福州市' THEN '鼓楼区' WHEN '重庆市' THEN '渝北区'
    ELSE district
  END,
  english_name = CASE name
    WHEN '华东医卫云科技术有限公司' THEN 'Huadong Medical Cloud Technology Co., Ltd.'
    WHEN '神州数码集团股份有限公司' THEN 'Digital China Group Co., Ltd.'
    WHEN '东软集团股份有限公司' THEN 'Neusoft Corporation'
    WHEN '中科软科技股份有限公司' THEN 'Sinosoft Co., Ltd.'
    WHEN '浪潮电子信息产业股份有限公司' THEN 'Inspur Electronics Co., Ltd.'
    WHEN '华为技术有限公司' THEN 'Huawei Technologies Co., Ltd.'
    WHEN '软通动力信息技术股份有限公司' THEN 'iSoftStone Information Technology Co., Ltd.'
    WHEN '亚信科技控股有限公司' THEN 'AsiaInfo Technologies Limited'
    WHEN '中软国际有限公司' THEN 'China Software International Limited'
    WHEN '太极计算机股份有限公司' THEN 'Taiji Computer Corporation Limited'
    WHEN '上海宝信软件股份有限公司' THEN 'Shanghai Baosight Software Co., Ltd.'
    WHEN '用友网络科技股份有限公司' THEN 'Yonyou Network Technology Co., Ltd.'
    WHEN '武汉达梦数据库股份有限公司' THEN 'Wuhan Dameng Database Co., Ltd.'
  END,
  website = CASE name
    WHEN '华东医卫云科技术有限公司' THEN 'https://www.huadongmedical.com'
    WHEN '神州数码集团股份有限公司' THEN 'https://www.digitalchina.com'
    WHEN '东软集团股份有限公司' THEN 'https://www.neusoft.com'
    WHEN '浪潮电子信息产业股份有限公司' THEN 'https://www.inspur.com'
    WHEN '华为技术有限公司' THEN 'https://www.huawei.com'
    WHEN '太极计算机股份有限公司' THEN 'https://www.taiji.com.cn'
    WHEN '用友网络科技股份有限公司' THEN 'https://www.yonyou.com'
    WHEN '武汉达梦数据库股份有限公司' THEN 'https://www.dameng.com'
  END,
  unified_social_credit_code = CASE name
    WHEN '华东医卫云科技术有限公司' THEN '91310000MA1HA12345'
    WHEN '神州数码集团股份有限公司' THEN '911100001000000001'
    WHEN '东软集团股份有限公司' THEN '912100007234567890'
    WHEN '浪潮电子信息产业股份有限公司' THEN '913700001234567890'
    WHEN '华为技术有限公司' THEN '91440300279583368R'
    WHEN '太极计算机股份有限公司' THEN '911100008000000001'
    WHEN '用友网络科技股份有限公司' THEN '911100007234567890'
  END,
  application_date = CASE
    WHEN status = 'Prospective' THEN (CURRENT_DATE - INTERVAL '30 days')::text
    WHEN start_date IS NOT NULL THEN (start_date::date - INTERVAL '7 days')::text
    ELSE NULL
  END;

-- 2. Fill missing contacts
INSERT INTO partner_contacts (partner_id, last_name, first_name, title, department, phone, email, is_primary)
SELECT id, '明', '张', '销售总监', '销售部', '13800001011', 'zhangm@inspur.com', true FROM partners WHERE name = '浪潮电子信息产业股份有限公司' AND id NOT IN (SELECT partner_id FROM partner_contacts)
UNION ALL SELECT id, '勇', '王', 'CEO', '管理层', '13800001013', 'wangy@huawei.com', true FROM partners WHERE name = '华为技术有限公司' AND id NOT IN (SELECT partner_id FROM partner_contacts)
UNION ALL SELECT id, '芳', '张', '生态合作经理', '生态部', '13800001014', 'zhangf@huawei.com', false FROM partners WHERE name = '华为技术有限公司' AND id NOT IN (SELECT partner_id FROM partner_contacts)
UNION ALL SELECT id, '磊', '陈', '技术总监', '技术部', '13800001015', 'chenl@yonyou.com', true FROM partners WHERE name = '用友网络科技股份有限公司' AND id NOT IN (SELECT partner_id FROM partner_contacts)
UNION ALL SELECT id, '婷', '刘', '销售经理', '销售部', '13800001016', 'liut@baosight.com', true FROM partners WHERE name = '上海宝信软件股份有限公司' AND id NOT IN (SELECT partner_id FROM partner_contacts)
UNION ALL SELECT id, '超', '马', '政务总监', '政务事业部', '13800001017', 'mac@taiji.com.cn', true FROM partners WHERE name = '太极计算机股份有限公司' AND id NOT IN (SELECT partner_id FROM partner_contacts)
UNION ALL SELECT id, '丽', '赵', '项目经理', '项目部', '13800001018', 'zhaol@dameng.com', true FROM partners WHERE name = '武汉达梦数据库股份有限公司' AND id NOT IN (SELECT partner_id FROM partner_contacts)
UNION ALL SELECT id, '杰', '孙', '业务经理', '业务部', '13800001019', 'sunj@bandao.com', true FROM partners WHERE name = '山东半岛科技' AND id NOT IN (SELECT partner_id FROM partner_contacts);

-- 3. Partner operation logs for timeline
INSERT INTO partner_operation_logs (partner_id, action, operator, details, created_at)
SELECT p.id, 'create', '系统管理员', jsonb_build_object('name', p.name, 'status', p.status), p.start_date::timestamp
FROM partners p WHERE p.status = 'Cooperating' AND p.start_date IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM partner_operation_logs WHERE partner_id = p.id);

INSERT INTO partner_operation_logs (partner_id, action, operator, details, created_at)
SELECT p.id, 'approve', '渠道经理', jsonb_build_object('tier', COALESCE(p.prev_tier, 'Registered'), 'notes', '审批通过'), (p.start_date::timestamp + interval '1 day')
FROM partners p WHERE p.status = 'Cooperating' AND p.start_date IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM partner_operation_logs WHERE partner_id = p.id AND action = 'approve');

INSERT INTO partner_operation_logs (partner_id, action, operator, details, created_at)
SELECT p.id, 'edit', '渠道经理', jsonb_build_object('changes', jsonb_build_object('tier', p.tier)), (p.start_date::timestamp + interval '90 days')
FROM partners p WHERE p.prev_tier IS NOT NULL AND p.prev_tier != p.tier AND p.tier != 'Registered' AND p.start_date IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM partner_operation_logs WHERE partner_id = p.id AND action = 'edit');

-- 4. JBP meetings for top partners
INSERT INTO jbp_meetings (partner_id, title, meeting_type, location, meeting_date, notes, created_at)
SELECT p.id, '2026年Q1联合业务规划', '季度复盘', p.location || '会议室', '2026-01-15', '双方回顾Q4业绩，制定Q1目标', '2026-01-10'
FROM partners p WHERE p.tier IN ('Platinum', 'Diamond', 'Gold') AND p.status = 'Cooperating'
AND NOT EXISTS (SELECT 1 FROM jbp_meetings WHERE partner_id = p.id);

INSERT INTO jbp_meetings (partner_id, title, meeting_type, location, meeting_date, notes, created_at)
SELECT p.id, '2026年Q2业务推进会', '季度复盘', p.location || '会议室', '2026-04-10', '评估H1进展，调整下半年策略', '2026-04-05'
FROM partners p WHERE p.tier IN ('Platinum', 'Diamond') AND p.status = 'Cooperating'
AND (SELECT COUNT(*) FROM jbp_meetings WHERE partner_id = p.id) < 2;

COMMIT;
