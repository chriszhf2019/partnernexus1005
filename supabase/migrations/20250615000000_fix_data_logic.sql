-- ═══════════════════════════════════════════════════════════════════════════════════
-- 数据逻辑修复迁移 - 20250615
--
-- 修复内容：
-- 1. 统一商机状态枚举值
-- 2. 增加 currency 货币字段
-- 3. 增加 data_source 数据来源标记
-- 4. 增加 origin_activity_id 营销活动来源关联
-- 5. 增加 incentive_program_id 激励计划关联
-- 6. 清理测试数据
-- ═══════════════════════════════════════════════════════════════════════════════════

-- ─── 1. 修改 deals 表 ─────────────────────────────────────────────────────────
-- 添加 currency 字段
ALTER TABLE deals ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'CNY';

-- 添加 data_source 字段
ALTER TABLE deals ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'seed';

-- 添加 origin_activity_id 关联营销活动
ALTER TABLE deals ADD COLUMN IF NOT EXISTS origin_activity_id UUID REFERENCES marketing_activities(id);

-- 添加 incentive_program_id 关联激励计划
ALTER TABLE deals ADD COLUMN IF NOT EXISTS incentive_program_id UUID REFERENCES incentive_programs(id);

-- 添加 weighted_value 加权金额（自动计算）
ALTER TABLE deals ADD COLUMN IF NOT EXISTS weighted_value DECIMAL(12,2);

-- 添加 stage 字段（统一使用商机阶段）
ALTER TABLE deals ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'Registered';

-- 更新现有数据：统一 stage 字段
UPDATE deals SET stage = 
  CASE 
    WHEN status = 'Pending' THEN 'Registered'
    WHEN status = 'Approved' THEN 'Approved'
    WHEN status = 'Rejected' THEN 'Rejected'
    WHEN status = 'Converted' THEN 'Solution'
    WHEN status = 'Closed Won' THEN 'ClosedWon'
    WHEN status = 'Closed Lost' THEN 'ClosedLost'
    WHEN status = 'Solution' THEN 'Solution'
    WHEN status = 'Commercial' THEN 'Commercial'
    WHEN status = 'Negotiation' THEN 'Negotiation'
    ELSE 'Registered'
  END
WHERE stage IS NULL OR stage = '';

-- 添加 weighted_value 计算（基于阶段概率）
UPDATE deals SET weighted_value = value * 
  CASE 
    WHEN stage = 'Registered' THEN 0.10
    WHEN stage = 'UnderReview' THEN 0.15
    WHEN stage = 'Approved' THEN 0.25
    WHEN stage = 'Solution' THEN 0.40
    WHEN stage = 'Commercial' THEN 0.60
    WHEN stage = 'Negotiation' THEN 0.80
    WHEN stage = 'ClosedWon' THEN 1.00
    WHEN stage = 'ClosedLost' THEN 0.00
    ELSE 0.10
  END
WHERE weighted_value IS NULL;

-- ─── 2. 修改 mdf_allocations 表 ─────────────────────────────────────────────
ALTER TABLE mdf_allocations ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'CNY';
ALTER TABLE mdf_allocations ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'seed';

-- ─── 3. 修改 incentive_programs 表 ─────────────────────────────────────────
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'seed';
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'CNY';

-- ─── 4. 修改 incentive_applications 表 ────────────────────────────────────
-- 先检查表是否存在，如果不存在则创建
CREATE TABLE IF NOT EXISTS incentive_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES incentive_programs(id),
  partner_id UUID REFERENCES partners(id),
  partner_name TEXT,
  application_date DATE DEFAULT CURRENT_DATE,
  deal_id UUID REFERENCES deals(id),
  deal_title TEXT,
  deal_value DECIMAL(12,2),
  claimed_amount DECIMAL(12,2),
  approved_amount DECIMAL(12,2),
  status TEXT DEFAULT 'pending',
  approval_date DATE,
  notes TEXT,
  data_source TEXT DEFAULT 'seed',
  currency TEXT DEFAULT 'CNY',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE incentive_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on incentive_applications" ON incentive_applications FOR ALL USING (true) WITH CHECK (true);

-- ─── 5. 修改 marketing_activities 表 ─────────────────────────────────────
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'seed';
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'CNY';

-- ─── 6. 修改 pmdf_applications 表 ──────────────────────────────────────────
ALTER TABLE pmdf_applications ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'CNY';
ALTER TABLE pmdf_applications ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'seed';

-- ─── 7. 修改 partners 表 ────────────────────────────────────────────────────
-- 添加 computed_win_rate 字段（动态计算赢率）
ALTER TABLE partners ADD COLUMN IF NOT EXISTS computed_win_rate DECIMAL(5,2);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'seed';
ALTER TABLE partners ADD COLUMN IF NOT EXISTS total_deals INT DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS won_deals INT DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(15,2) DEFAULT 0;

-- 计算各伙伴的赢单率和统计数据
UPDATE partners p SET 
  computed_win_rate = CASE 
    WHEN t.total > 0 THEN ROUND((t.won::DECIMAL / t.total) * 100, 2)
    ELSE 0 
  END,
  total_deals = COALESCE(t.total, 0),
  won_deals = COALESCE(t.won, 0),
  total_revenue = COALESCE(t.revenue, 0)
FROM (
  SELECT 
    partner_id,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE deals.stage = 'ClosedWon' OR deals.status = 'Closed Won') as won,
    COALESCE(SUM(value) FILTER (WHERE deals.stage = 'ClosedWon' OR deals.status = 'Closed Won'), 0) as revenue
  FROM deals
  GROUP BY partner_id
) t
WHERE p.id = t.partner_id;

-- ─── 8. 清理测试数据 ─────────────────────────────────────────────────────────
-- 删除测试公司
DELETE FROM partners WHERE name LIKE '%测试%' OR name LIKE '%Test%' OR name LIKE '%test%';
DELETE FROM partners WHERE name = '测试沉睡伙伴';

-- 删除测试联系人
DELETE FROM partner_contacts WHERE partner_id IS NULL OR NOT EXISTS (SELECT 1 FROM partners WHERE partners.id = partner_contacts.partner_id);

-- 删除测试商机
DELETE FROM deals WHERE customer LIKE '%测试%' OR title LIKE '%测试%';
DELETE FROM deals WHERE partner_id IS NULL;

-- 删除测试商机事件
DELETE FROM deal_lifecycle_events WHERE deal_id IS NULL OR NOT EXISTS (SELECT 1 FROM deals WHERE deals.id = deal_lifecycle_events.deal_id);

-- ─── 9. 重建序列（清理已删除数据后的ID序列）────────────────────────────────
-- 清理无效的外键引用
UPDATE deals SET partner_id = NULL WHERE partner_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM partners WHERE partners.id = deals.partner_id);
UPDATE deals SET origin_activity_id = NULL WHERE origin_activity_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM marketing_activities WHERE marketing_activities.id = deals.origin_activity_id);
UPDATE deals SET incentive_program_id = NULL WHERE incentive_program_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM incentive_programs WHERE incentive_programs.id = deals.incentive_program_id);

-- ─── 10. 添加索引优化查询性能 ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_deals_partner_id ON deals(partner_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_region ON deals(region);
CREATE INDEX IF NOT EXISTS idx_partners_region ON partners(region);
CREATE INDEX IF NOT EXISTS idx_partners_tier ON partners(tier);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_computed_win_rate ON partners(computed_win_rate);

-- ─── 11. 更新数据来源标记 ───────────────────────────────────────────────────
UPDATE partners SET data_source = 'seed';
UPDATE deals SET data_source = 'seed';
UPDATE partner_contacts SET data_source = 'seed';
UPDATE mdf_allocations SET data_source = 'seed';
UPDATE incentive_programs SET data_source = 'seed';
UPDATE marketing_activities SET data_source = 'seed';
UPDATE pmdf_applications SET data_source = 'seed';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 完成
-- ═══════════════════════════════════════════════════════════════════════════════════
