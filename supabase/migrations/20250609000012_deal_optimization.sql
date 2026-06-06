-- Migration: Deal Management Optimization - New tables and extensions
-- Date: 2026-06-06

-- 1. Deal Activities table (跟进动态)
CREATE TABLE IF NOT EXISTS deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('note','call','meeting','email','task','update')),
  content TEXT NOT NULL,
  actor TEXT NOT NULL,
  mentions TEXT[] DEFAULT '{}',
  reply_to_id UUID REFERENCES deal_activities(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deal_activities_deal ON deal_activities(deal_id, created_at DESC);

-- 2. Protection Rules table (保护规则)
CREATE TABLE IF NOT EXISTS protection_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  protection_days INT NOT NULL DEFAULT 90,
  require_recent_activity BOOLEAN DEFAULT true,
  recent_activity_days INT DEFAULT 30,
  expire_action TEXT DEFAULT 'notify_only' CHECK (expire_action IN ('notify_only','auto_release')),
  notify_before_days INT DEFAULT 7,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Rule Execution Logs table (规则执行日志)
CREATE TABLE IF NOT EXISTS rule_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES protection_rules(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('notified','released','warned')),
  details TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rule_logs_deal ON rule_execution_logs(deal_id);
CREATE INDEX IF NOT EXISTS idx_rule_logs_executed ON rule_execution_logs(executed_at DESC);

-- 4. Saved Views table (保存视图/预设)
CREATE TABLE IF NOT EXISTS saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  is_preset BOOLEAN DEFAULT false,
  is_ai_recommended BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  icon TEXT DEFAULT 'star',
  badge_type TEXT DEFAULT 'count' CHECK (badge_type IN ('count','value','none')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_saved_views_user ON saved_views(user_id);

-- 5. Filter History table (筛选历史，AI推荐用)
CREATE TABLE IF NOT EXISTS filter_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  result_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_filter_history_user ON filter_history(user_id, created_at DESC);

-- 6. Extend deals table with new columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='win_loss_reason') THEN
    ALTER TABLE deals ADD COLUMN win_loss_reason TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='win_loss_description') THEN
    ALTER TABLE deals ADD COLUMN win_loss_description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='win_loss_competitor') THEN
    ALTER TABLE deals ADD COLUMN win_loss_competitor TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='win_loss_key_factors') THEN
    ALTER TABLE deals ADD COLUMN win_loss_key_factors JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='activities') THEN
    ALTER TABLE deals ADD COLUMN activities JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='days_in_current_stage') THEN
    ALTER TABLE deals ADD COLUMN days_in_current_stage INT DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='is_stagnant') THEN
    ALTER TABLE deals ADD COLUMN is_stagnant BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='weighted_value') THEN
    ALTER TABLE deals ADD COLUMN weighted_value INT DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='expires_in_days') THEN
    ALTER TABLE deals ADD COLUMN expires_in_days INT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='customer_contact') THEN
    ALTER TABLE deals ADD COLUMN customer_contact TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='customer_phone') THEN
    ALTER TABLE deals ADD COLUMN customer_phone TEXT DEFAULT '';
  END IF;
END $$;

-- 7. Seed default protection rules
INSERT INTO protection_rules (name, protection_days, require_recent_activity, recent_activity_days, expire_action, notify_before_days, enabled)
SELECT '首报保护期自动释放', 90, true, 30, 'auto_release', 7, true
WHERE NOT EXISTS (SELECT 1 FROM protection_rules WHERE name = '首报保护期自动释放');

INSERT INTO protection_rules (name, protection_days, require_recent_activity, recent_activity_days, expire_action, notify_before_days, enabled)
SELECT '异常停滞预警', 90, false, 30, 'notify_only', 3, true
WHERE NOT EXISTS (SELECT 1 FROM protection_rules WHERE name = '异常停滞预警');

-- 8. Seed system preset views (user_id='system' for global presets)
INSERT INTO saved_views (user_id, name, filters, is_preset, sort_order, icon, badge_type)
SELECT 'system', '本周待审批', '{"stage":"UnderReview"}', true, 1, 'clock', 'count'
WHERE NOT EXISTS (SELECT 1 FROM saved_views WHERE user_id='system' AND name='本周待审批');

INSERT INTO saved_views (user_id, name, filters, is_preset, sort_order, icon, badge_type)
SELECT 'system', '异常停滞', '{"isStagnant":true}', true, 2, 'alert-triangle', 'count'
WHERE NOT EXISTS (SELECT 1 FROM saved_views WHERE user_id='system' AND name='异常停滞');

INSERT INTO saved_views (user_id, name, filters, is_preset, sort_order, icon, badge_type)
SELECT 'system', '即将到期', '{"expiresInDaysMax":7}', true, 3, 'clock8', 'count'
WHERE NOT EXISTS (SELECT 1 FROM saved_views WHERE user_id='system' AND name='即将到期');

INSERT INTO saved_views (user_id, name, filters, is_preset, sort_order, icon, badge_type)
SELECT 'system', '重点项目(>100万)', '{"minValue":1000000}', true, 4, 'star', 'value'
WHERE NOT EXISTS (SELECT 1 FROM saved_views WHERE user_id='system' AND name='重点项目(>100万)');

INSERT INTO saved_views (user_id, name, filters, is_preset, sort_order, icon, badge_type)
SELECT 'system', '我的商机', '{"assignedTo":"me"}', true, 5, 'user', 'count'
WHERE NOT EXISTS (SELECT 1 FROM saved_views WHERE user_id='system' AND name='我的商机');

INSERT INTO saved_views (user_id, name, filters, is_preset, sort_order, icon, badge_type)
SELECT 'system', '区域视野', '{"regionFilter":"user_region"}', true, 6, 'map-pin', 'count'
WHERE NOT EXISTS (SELECT 1 FROM saved_views WHERE user_id='system' AND name='区域视野');
