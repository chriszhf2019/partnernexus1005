-- ═════════════════════════════════════════════════════════════════════════
-- 完整种子数据 — 在 Supabase SQL Editor 中执行此文件即可
-- ═════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. 合作伙伴数据
INSERT INTO partners (id, name, tier, status, type, manager, location, region, start_date, years, prev_tier, tags, win_rate, industry, is_core_partner, cooperation_scope, province, city) VALUES

('p001', '华东医卫云科技术有限公司', 'Gold', 'Cooperating', 'ISV', '陈伟', '上海浦东新区张江高科技园区', '华东', '2019-03-15', 6, 'Silver', ARRAY['ISV','医疗','信创'], 65, '医疗', true, '医疗行业核心ISV', '上海', '上海市'),
('p002', '上海智医科技', 'Gold', 'Cooperating', 'ISV', '王浩', '上海张江人工智能岛', '华东', '2020-06-01', 5, 'Silver', ARRAY['ISV','医疗','AI'], 62, '医疗', true, 'AI医疗解决方案专家', '上海', '上海市'),
('p003', '华南智慧科技', 'Silver', 'Cooperating', 'SI', '刘洋', '深圳南山区科技园', '华南', '2020-09-20', 5, 'Registered', ARRAY['SI','医疗','智慧城市'], 58, '医疗', false, '华南区域医疗信息化SI', '广东', '深圳市'),
('p004', '华南系统集成', 'Silver', 'Cooperating', 'VAD', '赵敏', '广州天河区珠江新城', '华南', '2019-11-10', 6, 'Silver', ARRAY['VAD','分销','医疗'], 55, '医疗', false, '华南区域分销商', '广东', '广州市'),
('p005', '北方信科', 'Silver', 'Cooperating', 'VAR', '孙杰', '北京海淀区中关村', '华北', '2021-02-15', 4, 'Registered', ARRAY['VAR','医疗','集成'], 52, '医疗', false, '北方区域VAR', '北京', '北京市'),
('p006', '西部云智科技', 'Silver', 'Cooperating', 'ISV', '周琳', '成都高新区天府软件园', '西部', '2021-04-01', 4, 'Registered', ARRAY['ISV','教育','政务'], 48, '教育', false, '西部区域ISV', '四川', '成都市'),
('p007', '华中智慧医疗', 'Silver', 'Cooperating', 'ISV', '吴涛', '武汉东湖高新区光谷', '华中', '2020-08-10', 5, 'Registered', ARRAY['ISV','医疗','大数据'], 55, '医疗', false, '华中区域医疗ISV', '湖北', '武汉市'),
('p008', '西北云科技', 'Silver', 'Cooperating', 'VAR', '郑强', '西安高新区锦业路', '西部', '2021-06-15', 4, 'Registered', ARRAY['VAR','医疗','云原生'], 50, '医疗', false, '西北区域VAR', '陕西', '西安市'),
('p009', '深圳智慧城市科技', 'Gold', 'Cooperating', 'SI', '刘洋', '深圳南山区科技园', '华南', '2019-05-20', 6, 'Silver', ARRAY['SI','政务','智慧城市'], 68, '政务', true, '智慧城市和政务信息化SI', '广东', '深圳市'),
('p010', '神州数码集团股份有限公司', 'Platinum', 'Cooperating', 'VAD', '高波', '北京海淀区上地信息路', '华北', '2016-03-15', 10, 'Gold', ARRAY['VAD','信创','全国覆盖'], 72, '金融', true, '全国总代理，覆盖金融政务医疗', '北京', '北京市'),
('p011', '东软集团股份有限公司', 'Platinum', 'Cooperating', 'ISV', '陈明', '沈阳浑南新区新秀街', '华北', '2017-06-01', 8, 'Gold', ARRAY['ISV','医疗','信创'], 68, '医疗', true, '医疗行业核心ISV', '辽宁', '沈阳市'),
('p012', '浪潮电子信息产业股份有限公司', 'Diamond', 'Cooperating', 'OEM', '王强', '济南高新区浪潮路', '华东', '2017-01-10', 9, 'Platinum', ARRAY['OEM','政务','制造'], 70, '政务', true, '政务云基础设施核心伙伴', '山东', '济南市'),
('p013', '华为技术有限公司', 'Diamond', 'Cooperating', 'OEM', '李娜', '深圳龙岗区坂田', '华南', '2015-05-01', 11, 'Diamond', ARRAY['OEM','全行业','全球覆盖'], 75, '制造', true, '全行业基础设施伙伴', '广东', '深圳市'),
('p014', '中科软科技股份有限公司', 'Gold', 'Cooperating', 'ISV', '刘洋', '北京海淀区中关村', '华北', '2018-09-20', 7, 'Silver', ARRAY['ISV','金融','保险'], 65, '金融', false, '金融保险行业ISV', '北京', '北京市'),
('p015', '软通动力信息技术股份有限公司', 'Gold', 'Cooperating', 'SI', '赵华', '北京朝阳区望京', '华北', '2019-02-15', 7, 'Silver', ARRAY['SI','金融','互联网'], 62, '金融', false, '金融行业SI', '北京', '北京市'),
('p016', '太极计算机股份有限公司', 'Gold', 'Cooperating', 'SI', '张伟', '北京海淀区北四环', '华北', '2017-11-20', 8, 'Silver', ARRAY['SI','政务','信创'], 63, '政务', true, '政务行业SI', '北京', '北京市'),
('p017', '用友网络科技股份有限公司', 'Silver', 'Cooperating', 'ISV', '林芳', '北京海淀区北清路', '华北', '2019-10-01', 6, 'Registered', ARRAY['ISV','ERP','SaaS'], 52, '互联网', false, '企业管理软件ISV', '北京', '北京市'),
('p018', '武汉达梦数据库股份有限公司', 'Silver', 'Cooperating', 'ISV', '郑涛', '武汉东湖高新区光谷', '华中', '2020-08-10', 5, 'Registered', ARRAY['ISV','数据库','信创'], 55, '政务', false, '国产数据库ISV', '湖北', '武汉市'),
('p019', '成都四方伟业软件股份有限公司', 'Registered', 'Cooperating', 'ISV', '杨帆', '成都高新区天府大道', '西部', '2022-04-01', 4, 'Registered', ARRAY['ISV','大数据','能源'], 40, '能源', false, '大数据平台ISV', '四川', '成都市'),
('p020', '山东半岛科技', 'Silver', 'Cooperating', 'VAD', '王芳', '青岛崂山区海尔路', '华东', '2021-05-10', 4, 'Registered', ARRAY['VAD','政务','分销'], 52, '政务', false, '山东半岛区域VAD', '山东', '青岛市'),
('p021', '亚信科技控股有限公司', 'Gold', 'Cooperating', 'ISV', '周伟', '北京西城区金融街', '华北', '2018-04-01', 8, 'Silver', ARRAY['ISV','通信','5G'], 58, '互联网', false, '通信行业ISV', '北京', '北京市'),
('p022', '上海宝信软件股份有限公司', 'Silver', 'Cooperating', 'ISV', '陈强', '上海浦东新区张江', '华东', '2020-03-08', 6, 'Registered', ARRAY['ISV','制造','钢铁'], 48, '制造', false, '制造业ISV', '上海', '上海市'),
('p023', '南京华苏科技有限公司', 'Silver', 'Inactive', 'Reseller', '孙鹏', '南京建邺区河西', '华东', '2021-01-20', 5, 'Registered', ARRAY['Reseller','教育','SMB'], 32, '教育', false, '教育行业转售商', '江苏', '南京市'),
('p024', '湖南科创信息技术股份有限公司', 'Registered', 'Prospective', 'Reseller', '刘刚', '长沙岳麓区梅溪湖', '华中', '2023-03-10', 3, 'Registered', ARRAY['Reseller','政务','教育'], 28, '教育', false, '华中区域潜在伙伴', '湖南', '长沙市'),
('p025', '重庆梅安森科技股份有限公司', 'Silver', 'Cooperating', 'ISV', '赵勇', '重庆渝北区金开大道', '西部', '2020-11-05', 5, 'Registered', ARRAY['ISV','能源','安全'], 50, '能源', false, '能源安全ISV', '重庆', '重庆市'),
('p026', '深圳华大智造科技股份有限公司', 'Registered', 'Prospective', 'Reseller', '钱进', '深圳南山区科技园', '华南', '2023-06-01', 2, 'Registered', ARRAY['Reseller','医疗','基因'], 25, '医疗', false, '生命科学领域潜在伙伴', '广东', '深圳市'),
('p027', '中软国际有限公司', 'Gold', 'Cooperating', 'Service', '吴明', '深圳南山区科技园', '华南', '2019-07-12', 6, 'Registered', ARRAY['Service','外包','金融'], 55, '金融', false, 'IT服务合作伙伴', '广东', '深圳市'),
('p028', '福建顶点软件股份有限公司', 'Registered', 'Cooperating', 'ISV', '何军', '福州鼓楼区软件大道', '华东', '2022-02-28', 4, 'Registered', ARRAY['ISV','金融','证券'], 45, '金融', false, '金融证券ISV', '福建', '福州市'),
('p029', '西安未来国际信息股份有限公司', 'Registered', 'Cooperating', 'SI', '马超', '西安高新区科技二路', '西部', '2021-08-15', 4, 'Registered', ARRAY['SI','政务','西部'], 42, '政务', false, '西部政务SI', '陕西', '西安市'),
('p030', '广州赛意信息科技股份有限公司', 'Silver', 'Cooperating', 'Service', '黄磊', '广州天河区珠江新城', '华南', '2020-06-15', 5, 'Registered', ARRAY['Service','制造','实施'], 45, '制造', false, '制造行业实施服务伙伴', '广东', '广州市');

-- 2. 合作伙伴联系人
INSERT INTO partner_contacts (partner_id, last_name, first_name, title, department, phone, email, is_primary) VALUES
('p001', '伟', '陈', '技术总监', '技术部', '13901000001', 'chenw@huadongmedical.com', true),
('p001', '丽', '张', '销售经理', '销售部', '13901000011', 'zhangl@huadongmedical.com', false),
('p002', '浩', '王', '销售总监', '销售部', '13901000002', 'wangh@shanghaizhimei.com', true),
('p003', '洋', '刘', '技术总监', '技术部', '13901000003', 'liuy@huanansmart.com', true),
('p004', '敏', '赵', '总经理', '管理层', '13901000004', 'zhaom@huanan-system.com', true),
('p005', '杰', '孙', '技术总监', '技术部', '13901000005', 'sunj@beifangxinke.com', true),
('p010', '波', '高', '总经理', '管理层', '13801001001', 'gaobo@digitalchina.com', true),
('p010', '芳', '王', '渠道总监', '渠道部', '13801001002', 'wangf@digitalchina.com', false),
('p011', '明', '陈', '副总裁', '管理层', '13901002001', 'chenm@neusoft.com', true),
('p011', '伟', '李', '架构师', '技术部', '13901002002', 'liw@neusoft.com', false),
('p012', '强', '王', '政务事业部总经理', '政务事业部', '13701004001', 'wangq@inspur.com', true),
('p013', '娜', '李', '生态合作总监', '生态部', '13601005001', 'lina@huawei.com', true),
('p013', '勇', '张', '技术经理', '技术部', '13601005002', 'zhangy@huawei.com', false),
('p014', '洋', '刘', '销售总监', '销售部', '13501003001', 'liuy@sinosoft.com', true),
('p016', '超', '马', '政务总监', '政务事业部', '13800001017', 'mac@taiji.com.cn', true),
('p017', '磊', '陈', '技术总监', '技术部', '13800001015', 'chenl@yonyou.com', true),
('p018', '丽', '赵', '项目经理', '项目部', '13800001018', 'zhaol@dameng.com', true),
('p020', '杰', '孙', '业务经理', '业务部', '13800001019', 'sunj@bandao.com', true);

-- 3. 活动日志（让健康评分引擎有数据可算）
INSERT INTO partner_activity_logs (partner_id, activity_type, weight_score, created_at)
SELECT id, 'LOGIN', 1, now() - (random()*7||' days')::interval FROM partners WHERE status = 'Cooperating';
INSERT INTO partner_activity_logs (partner_id, activity_type, weight_score, created_at)
SELECT id, 'LEAD_SUBMIT', 10, now() - (random()*14||' days')::interval FROM partners WHERE tier IN ('Platinum','Diamond','Gold');
INSERT INTO partner_activity_logs (partner_id, activity_type, weight_score, created_at)
SELECT id, 'LEAD_SUBMIT', 10, now() - (random()*21||' days')::interval FROM partners WHERE tier IN ('Gold','Silver');
INSERT INTO partner_activity_logs (partner_id, activity_type, weight_score, created_at)
SELECT id, 'DEAL_WIN', 20, now() - (random()*30||' days')::interval FROM partners WHERE win_rate > 50;
INSERT INTO partner_activity_logs (partner_id, activity_type, weight_score, created_at)
SELECT id, 'MDF_CLAIM', 15, now() - (random()*20||' days')::interval FROM partners WHERE tier IN ('Platinum','Diamond','Gold');
INSERT INTO partner_activity_logs (partner_id, activity_type, weight_score, created_at)
SELECT id, 'TRAINING', 5, now() - (random()*45||' days')::interval FROM partners WHERE status = 'Cooperating';
INSERT INTO partner_activity_logs (partner_id, activity_type, weight_score, created_at)
SELECT id, 'ACTIVITY_JOIN', 8, now() - (random()*60||' days')::interval FROM partners WHERE status = 'Cooperating' AND tier IN ('Platinum','Diamond','Gold','Silver');

-- 4. 商机数据
INSERT INTO deals (title, customer, customer_name, value, stage, status, partner_id, partner_name, region, sales_name, created_date, expected_close_date, is_priority)
VALUES
('浙江省立医院信息平台升级', '浙江省立医院', '浙江省立医院', 4500000, 'Approved', 'Approved', 'p001', '华东医卫云科技术有限公司', '华东', '陈伟', '2024-08-15', '2024-12-31', true),
('上海中山医院AI诊断系统', '上海中山医院', '上海中山医院', 3200000, 'Solution', 'Pending', 'p002', '上海智医科技', '华东', '王浩', '2024-09-01', '2025-03-31', true),
('深圳智慧城市大脑项目', '深圳市政务数据局', '深圳市政务数据局', 5800000, 'Commercial', 'Pending', 'p009', '深圳智慧城市科技', '华南', '刘洋', '2024-07-20', '2025-06-30', true),
('中国银行核心系统迁移', '中国银行', '中国银行', 12000000, 'Solution', 'Pending', 'p010', '神州数码集团股份有限公司', '华北', '高波', '2024-06-01', '2025-12-31', true),
('北京协和医院信息化项目', '北京协和医院', '北京协和医院', 3800000, 'Registered', 'Pending', 'p011', '东软集团股份有限公司', '华北', '陈明', '2024-10-10', '2025-06-30', false),
('山东省政务云平台扩容', '山东省大数据局', '山东省大数据局', 2500000, 'ClosedWon', 'Closed Won', 'p012', '浪潮电子信息产业股份有限公司', '华东', '王强', '2024-03-01', '2024-09-30', true),
('华为云鲲鹏生态合作项目', '中国移动', '中国移动', 8000000, 'Commercial', 'Pending', 'p013', '华为技术有限公司', '华南', '李娜', '2024-05-15', '2025-06-30', true),
('中国人寿保险核心系统', '中国人寿', '中国人寿', 6500000, 'UnderReview', 'Pending', 'p014', '中科软科技股份有限公司', '华北', '刘洋', '2024-11-01', '2025-08-31', true),
('国家税务总局电子政务项目', '国家税务总局', '国家税务总局', 4200000, 'Approved', 'Approved', 'p016', '太极计算机股份有限公司', '华北', '张伟', '2024-08-20', '2025-03-31', true),
('武汉达梦数据库信创替代', '湖北省政务办', '湖北省政务办', 1800000, 'Solution', 'Pending', 'p018', '武汉达梦数据库股份有限公司', '华中', '郑涛', '2024-09-10', '2025-06-30', false),
('青岛崂山区智慧政务项目', '青岛市崂山区政府', '青岛市崂山区政府', 1200000, 'Registered', 'Pending', 'p020', '山东半岛科技', '华东', '王芳', '2024-12-01', '2025-09-30', false),
('成都智慧能源管理平台', '四川能投集团', '四川能投集团', 2200000, 'UnderReview', 'Pending', 'p019', '成都四方伟业软件股份有限公司', '西部', '杨帆', '2024-10-20', '2025-05-31', false);

-- 5. 市场基准数据（已存在的会跳过）
INSERT INTO market_benchmarks (region, industry, target_revenue, required_partners) VALUES
('华东', '金融', 100000000, 10), ('华东', '医疗', 70000000, 8), ('华东', '制造', 50000000, 6), ('华东', '政务', 40000000, 5),
('华北', '金融', 80000000, 8), ('华北', '政务', 60000000, 6), ('华北', '医疗', 40000000, 5),
('华南', '金融', 60000000, 6), ('华南', '政务', 50000000, 5), ('华南', '医疗', 40000000, 5),
('西部', '政务', 30000000, 4), ('西部', '能源', 25000000, 3),
('华中', '医疗', 20000000, 3), ('华中', '政务', 15000000, 2)
ON CONFLICT (region, industry) DO NOTHING;

-- 6. 操作日志（时间线）
INSERT INTO partner_operation_logs (partner_id, action, operator, details, created_at)
SELECT id, 'create', '系统管理员', jsonb_build_object('name', name, 'status', status), (start_date::date + interval '1 day')::timestamp
FROM partners WHERE start_date IS NOT NULL;
INSERT INTO partner_operation_logs (partner_id, action, operator, details, created_at)
SELECT id, 'approve', '渠道经理', jsonb_build_object('tier', COALESCE(prev_tier, 'Registered')), (start_date::date + interval '2 days')::timestamp
FROM partners WHERE status = 'Cooperating' AND start_date IS NOT NULL;

COMMIT;
