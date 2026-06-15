-- Fix data integrity issues in seed data:
-- 1. Fix partner regions (西部→西南/西北)
-- 2. Add a sleeping partner (win_rate=0, Cooperating)
-- 3. Re-insert deals with correct partner FK references
-- 4. Re-insert deal lifecycle events
-- 5. Fix mdf_allocations partner_id references

-- ─── 1. Fix partner regions ─────────────────────────────
UPDATE partners SET region = '西南'
WHERE name IN ('西部云智科技', '成都四方伟业软件股份有限公司', '重庆梅安森科技股份有限公司');

UPDATE partners SET region = '西北'
WHERE name IN ('西北云科技', '西安未来国际信息股份有限公司');

-- ─── 2. Add a sleeping partner for testing ──────────────
INSERT INTO partners (id, name, tier, status, type, manager, location, region, start_date, years, prev_tier, tags, win_rate, industry)
VALUES (gen_random_uuid(), '测试沉睡伙伴', 'Registered', 'Cooperating', 'Reseller', '系统管理员', '默认地址', '华东', '2023-01-01', 3, 'Registered', ARRAY['测试'], 0, '其他')
ON CONFLICT DO NOTHING;

-- ─── 3. Re-insert deals with correct partner FK references ──
DELETE FROM deal_lifecycle_events;
DELETE FROM deals;

INSERT INTO deals (id, title, customer, value, partner_id, partner_name, partner_type, status, region, sales_name, sales_team, product_type, created_date, end_date, is_priority, has_conflict)
SELECT gen_random_uuid(), '某大型银行核心系统云化迁移项目', '中国工商银行', 12000000,
       (SELECT id FROM partners WHERE name = '中科软科技股份有限公司'),
       '中科软科技股份有限公司', 'ISV', 'Approved', '华北', '张伟', '金融事业部', '云原生平台', '2025-01-15'::date, '2025-09-30'::date, true, false
UNION ALL
SELECT gen_random_uuid(), '东部省份政务云三期扩容', '浙江省大数据局', 8500000,
       (SELECT id FROM partners WHERE name = '浪潮电子信息产业股份有限公司'),
       '浪潮电子信息产业股份有限公司', 'OEM', 'Approved', '华东', '王强', '政务事业部', '大数据平台', '2025-02-10'::date, '2025-08-31'::date, true, false
UNION ALL
SELECT gen_random_uuid(), '华南区三甲医院信息化升级', '广东省人民医院', 6200000,
       (SELECT id FROM partners WHERE name = '东软集团股份有限公司'),
       '东软集团股份有限公司', 'ISV', 'Approved', '华南', '李娜', '医疗事业部', '云原生平台', '2025-03-01'::date, '2025-11-30'::date, false, false
UNION ALL
SELECT gen_random_uuid(), '某直辖市智慧城市数据中台', '上海市大数据中心', 15000000,
       (SELECT id FROM partners WHERE name = '太极计算机股份有限公司'),
       '太极计算机股份有限公司', 'SI', 'Pending', '华东', '陈明', '政务事业部', '大数据平台', '2025-04-05'::date, '2025-12-31'::date, true, false
UNION ALL
SELECT gen_random_uuid(), '头部保险企业AI理赔系统', '中国平安', 9800000,
       (SELECT id FROM partners WHERE name = '中科软科技股份有限公司'),
       '中科软科技股份有限公司', 'ISV', 'Pending', '华南', '张伟', '金融事业部', 'AI 智算平台', '2025-03-20'::date, '2025-10-31'::date, true, true
UNION ALL
SELECT gen_random_uuid(), '西部省份教育云平台建设', '四川省教育厅', 4500000,
       (SELECT id FROM partners WHERE name = '西安未来国际信息股份有限公司'),
       '西安未来国际信息股份有限公司', 'SI', 'Approved', '西南', '马超', '政务事业部', '云原生平台', '2025-02-28'::date, '2025-09-30'::date, false, false
UNION ALL
SELECT gen_random_uuid(), '央企数据安全合规改造', '国家电网', 7200000,
       (SELECT id FROM partners WHERE name = '神州数码集团股份有限公司'),
       '神州数码集团股份有限公司', 'VAD', 'Converted', '华北', '赵华', '金融事业部', '安全合规', '2024-11-10'::date, '2025-06-30'::date, true, false
UNION ALL
SELECT gen_random_uuid(), '汽车制造MES系统迁移', '比亚迪', 5600000,
       (SELECT id FROM partners WHERE name = '华为技术有限公司'),
       '华为技术有限公司', 'OEM', 'Approved', '华南', '王强', '制造事业部', '云原生平台', '2025-03-15'::date, '2025-12-31'::date, false, false
UNION ALL
SELECT gen_random_uuid(), '钢铁行业工业互联网平台', '宝武钢铁', 8800000,
       (SELECT id FROM partners WHERE name = '上海宝信软件股份有限公司'),
       '上海宝信软件股份有限公司', 'ISV', 'Pending', '华东', '陈强', '制造事业部', '大数据平台', '2025-05-01'::date, '2026-03-31'::date, false, false
UNION ALL
SELECT gen_random_uuid(), '股份制银行核心交易系统', '招商银行', 11000000,
       (SELECT id FROM partners WHERE name = '软通动力信息技术股份有限公司'),
       '软通动力信息技术股份有限公司', 'SI', 'Approved', '华南', '李娜', '金融事业部', '云原生平台', '2025-01-10'::date, '2025-10-31'::date, true, false
UNION ALL
SELECT gen_random_uuid(), '西南区煤矿智能安全系统', '中煤集团', 3800000,
       (SELECT id FROM partners WHERE name = '重庆梅安森科技股份有限公司'),
       '重庆梅安森科技股份有限公司', 'ISV', 'Approved', '西南', '赵勇', '能源事业部', 'AI 智算平台', '2025-04-20'::date, '2025-12-31'::date, false, false
UNION ALL
SELECT gen_random_uuid(), '国产数据库信创替代项目', '国家税务总局', 6500000,
       (SELECT id FROM partners WHERE name = '武汉达梦数据库股份有限公司'),
       '武汉达梦数据库股份有限公司', 'ISV', 'Approved', '华中', '郑涛', '政务事业部', '大数据平台', '2025-02-01'::date, '2025-09-30'::date, false, false
UNION ALL
SELECT gen_random_uuid(), 'ERP系统云化升级', '海尔集团', 4200000,
       (SELECT id FROM partners WHERE name = '用友网络科技股份有限公司'),
       '用友网络科技股份有限公司', 'ISV', 'Pending', '华东', '林芳', '制造事业部', '云原生平台', '2025-05-10'::date, '2025-11-30'::date, false, false
UNION ALL
SELECT gen_random_uuid(), '5G核心网优化项目', '中国移动', 9500000,
       (SELECT id FROM partners WHERE name = '亚信科技控股有限公司'),
       '亚信科技控股有限公司', 'ISV', 'Rejected', '华北', '周伟', '通信事业部', '云原生平台', '2025-01-20'::date, '2025-07-31'::date, false, true
UNION ALL
SELECT gen_random_uuid(), '证券交易系统升级', '中信证券', 7800000,
       (SELECT id FROM partners WHERE name = '福建顶点软件股份有限公司'),
       '福建顶点软件股份有限公司', 'ISV', 'Pending', '华东', '何军', '金融事业部', '云原生平台', '2025-03-25'::date, '2025-11-30'::date, false, false;

-- ─── 4. Deal lifecycle events ───────────────────────────
INSERT INTO deal_lifecycle_events (id, deal_id, stage, event_date, description, actor)
SELECT gen_random_uuid(), d.id, 'Registered', '2025-01-15'::date, '合作伙伴提交报备', '刘洋'
FROM deals d WHERE d.title = '某大型银行核心系统云化迁移项目'
UNION ALL
SELECT gen_random_uuid(), d.id, 'Approved', '2025-01-18'::date, '渠道经理审核通过，Pipeline确认', 'Alex Rivera'
FROM deals d WHERE d.title = '某大型银行核心系统云化迁移项目'
UNION ALL
SELECT gen_random_uuid(), d.id, 'Registered', '2025-02-10'::date, '合作伙伴提交报备', '王强'
FROM deals d WHERE d.title = '东部省份政务云三期扩容'
UNION ALL
SELECT gen_random_uuid(), d.id, 'Approved', '2025-02-14'::date, '渠道经理审核通过，项目进入方案阶段', 'Alex Rivera'
FROM deals d WHERE d.title = '东部省份政务云三期扩容'
UNION ALL
SELECT gen_random_uuid(), d.id, 'Registered', '2025-03-01'::date, '合作伙伴提交报备', '陈明'
FROM deals d WHERE d.title = '华南区三甲医院信息化升级'
UNION ALL
SELECT gen_random_uuid(), d.id, 'Approved', '2025-03-04'::date, '渠道经理审核通过', 'Alex Rivera'
FROM deals d WHERE d.title = '华南区三甲医院信息化升级'
UNION ALL
SELECT gen_random_uuid(), d.id, 'Registered', '2025-04-05'::date, '合作伙伴提交报备', '张伟'
FROM deals d WHERE d.title = '某直辖市智慧城市数据中台'
UNION ALL
SELECT gen_random_uuid(), d.id, 'Registered', '2025-03-20'::date, '合作伙伴提交报备', '刘洋'
FROM deals d WHERE d.title = '头部保险企业AI理赔系统'
UNION ALL
SELECT gen_random_uuid(), d.id, 'Registered', '2024-11-10'::date, '合作伙伴提交报备', '高波'
FROM deals d WHERE d.title = '央企数据安全合规改造'
UNION ALL
SELECT gen_random_uuid(), d.id, 'Approved', '2024-11-15'::date, '渠道经理审核通过', 'Alex Rivera'
FROM deals d WHERE d.title = '央企数据安全合规改造'
UNION ALL
SELECT gen_random_uuid(), d.id, 'Converted', '2025-01-10'::date, '正式转化为商机，进入POC阶段', 'Alex Rivera'
FROM deals d WHERE d.title = '央企数据安全合规改造'
UNION ALL
SELECT gen_random_uuid(), d.id, 'Registered', '2025-01-20'::date, '合作伙伴提交报备', '周伟'
FROM deals d WHERE d.title = '5G核心网优化项目'
UNION ALL
SELECT gen_random_uuid(), d.id, 'Rejected', '2025-01-23'::date, '存在存量商机冲突，拒绝报备', 'Alex Rivera'
FROM deals d WHERE d.title = '5G核心网优化项目';

-- ─── 5. Fix MDF allocations partner_id references ──────
DELETE FROM pmdf_applications;
DELETE FROM mdf_allocations;

INSERT INTO mdf_allocations (partner_id, partner_name, quarter, amount, status, applications, approved_apps)
SELECT (SELECT id FROM partners WHERE name = '神州数码集团股份有限公司'), '神州数码集团股份有限公司', '2025 Q3', 800000, 'used', 3, 2
UNION ALL
SELECT (SELECT id FROM partners WHERE name = '东软集团股份有限公司'), '东软集团股份有限公司', '2025 Q3', 600000, 'used', 2, 2
UNION ALL
SELECT (SELECT id FROM partners WHERE name = '浪潮电子信息产业股份有限公司'), '浪潮电子信息产业股份有限公司', '2025 Q3', 500000, 'allocated', 1, 1
UNION ALL
SELECT (SELECT id FROM partners WHERE name = '华为技术有限公司'), '华为技术有限公司', '2025 Q3', 500000, 'used', 2, 2
UNION ALL
SELECT (SELECT id FROM partners WHERE name = '太极计算机股份有限公司'), '太极计算机股份有限公司', '2025 Q3', 400000, 'allocated', 2, 1
UNION ALL
SELECT (SELECT id FROM partners WHERE name = '中科软科技股份有限公司'), '中科软科技股份有限公司', '2025 Q3', 300000, 'available', 0, 0
UNION ALL
SELECT (SELECT id FROM partners WHERE name = '软通动力信息技术股份有限公司'), '软通动力信息技术股份有限公司', '2025 Q3', 300000, 'allocated', 1, 1
UNION ALL
SELECT (SELECT id FROM partners WHERE name = '上海宝信软件股份有限公司'), '上海宝信软件股份有限公司', '2025 Q3', 200000, 'available', 1, 0;
