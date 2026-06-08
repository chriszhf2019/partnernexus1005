-- ─── Deal Conflicts ──────────────────────────────────
CREATE TABLE IF NOT EXISTS deal_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'SameCustomerSimilarProject',
  deal_ids TEXT[] DEFAULT '{}',
  description TEXT,
  status TEXT DEFAULT 'Pending',
  resolution TEXT,
  resolved_by TEXT,
  resolved_date DATE,
  created_date DATE DEFAULT CURRENT_DATE,
  protection_period_days INT DEFAULT 90,
  first_reported_deal_id TEXT
);

INSERT INTO deal_conflicts (type, deal_ids, description, status, resolution, resolved_by, resolved_date, protection_period_days, first_reported_deal_id) VALUES
('SameCustomerSimilarProject', '{头部保险企业AI理赔系统,央企数据安全合规改造}', '头部保险企业AI理赔系统与央企数据安全合规改造存在客户归属冲突', 'Resolved', '央企项目归属神州数码，保险项目归中科软跟进', 'Alex Rivera', '2025-04-10', 90, 'd005'),
('SameCustomerSameProduct', '{国家税务总局国产数据库信创替代项目,ERP系统云化升级}', '国家税务总局国产数据库信创替代项目的多伙伴报备冲突', 'Pending', NULL, NULL, NULL, 90, 'd012'),
('MultiPartnerSameDeal', '{钢铁行业工业互联网平台,5G核心网优化项目}', '钢铁行业工业互联网平台与5G核心网优化项目存在团队重叠', 'Pending', NULL, NULL, NULL, 90, 'd009');

-- ─── Partner Operation Logs ──────────────────────────
INSERT INTO partner_operation_logs (partner_id, action, operator, details, created_at) VALUES
('e7a907af-ceb2-454c-841b-a80b81602bc7', 'approve', 'Alex Rivera', '{"tier":"Platinum","status":"Cooperating"}', NOW() - INTERVAL '180 days'),
('55a5fa32-8b5a-4f8c-a5cb-8bb3278f3455', 'approve', 'Alex Rivera', '{"tier":"Platinum","status":"Cooperating"}', NOW() - INTERVAL '170 days');

-- ─── MDF Allocations ────────────────────────────────
INSERT INTO mdf_allocations (partner_id, partner_name, quarter, amount, status, applications, approved_apps) VALUES
('e7a907af-ceb2-454c-841b-a80b81602bc7', '上海测试公司', '2025-Q2', 500000, 'available', 3, 2),
('55a5fa32-8b5a-4f8c-a5cb-8bb3278f3455', '北京测试公司', '2025-Q3', 450000, 'allocated', 4, 3);

-- ─── Settings update ────────────────────────────────
UPDATE settings SET data = data || '{
  "currency":"CNY",
  "regions":["华北","华东","华南","华中","西部","东北","西南"],
  "industries":["金融","医疗","政务","制造","教育","能源","互联网","通信"],
  "partnerTiers":["Diamond","Platinum","Gold","Silver","Registered","Premier","Standard"],
  "partnerTypes":["Reseller","ISV","OEM","Service","VAD","VAR","SI"],
  "partnerStatuses":["Cooperating","Inactive","Prospective","Rejected"],
  "companyName":"PartnerNexus 渠道管理平台",
  "companyNameEn":"PartnerNexus",
  "companyAddress":"北京市朝阳区望京科技园",
  "companyPhone":"400-888-0000",
  "companyEmail":"support@partnernxus.com"
}'::jsonb WHERE id = 'global';
