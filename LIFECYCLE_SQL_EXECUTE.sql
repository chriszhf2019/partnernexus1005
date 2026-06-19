-- ============================================
-- 合作伙伴生命周期追踪系统 - 一键执行
-- 在 Supabase SQL Editor 中复制粘贴后执行
-- 项目: partner.velolabs.top
-- ============================================

-- 1. 合作伙伴表扩展
ALTER TABLE partners ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Active';
ALTER TABLE partners ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE partners ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS onboarding_completion INT DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS active_deals_count INTEGER DEFAULT 0;

-- 2. 商机表扩展
ALTER TABLE deals ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'Registered';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE deals ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS conversion_probability DECIMAL(5,2) DEFAULT 0.25;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS weighted_value DECIMAL(15,2) DEFAULT 0;

-- 3. 激励计划表扩展
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Active';
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0;
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80;
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS budget_utilization_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS roi_rate DECIMAL(8,2) DEFAULT 0;

-- 4. 培训认证表扩展
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Enrolling';
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0;
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80;
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS enrollment_count INTEGER DEFAULT 0;
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS completion_count INTEGER DEFAULT 0;

-- 5. 培训报名表扩展
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS enrollment_stage TEXT DEFAULT 'enrolled';
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS assessment_score INTEGER;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS assessment_passed BOOLEAN DEFAULT false;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS certificate_issued_at TIMESTAMPTZ;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS certificate_expires_at TIMESTAMPTZ;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS certificate_id TEXT;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS partner_id UUID;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS partner_name TEXT;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80;

-- 6. 营销活动表扩展
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Planning';
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS registered_attendees INTEGER DEFAULT 0;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS checked_in_attendees INTEGER DEFAULT 0;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS lead_conversion_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS deal_conversion_count INTEGER DEFAULT 0;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS total_deal_value_generated DECIMAL(15,2) DEFAULT 0;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS roi_rate DECIMAL(8,2) DEFAULT 0;

-- 7. 活动参会者表扩展
ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS attendee_lifecycle_stage TEXT DEFAULT 'registered';
ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 50;
ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS follow_up_assigned_to TEXT;
ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;
ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS deal_id UUID;

-- 8. 创建通用 exec 函数（供后续 API 调用使用）
CREATE OR REPLACE FUNCTION exec(query text)
RETURNS void AS $$
BEGIN
  EXECUTE query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 📊 验证：检查字段是否添加成功
-- ============================================
SELECT
  'partners' AS table_name,
  count(*) FILTER (WHERE column_name IN ('lifecycle_stage', 'health_score', 'stage_entered_at')) AS lifecycle_fields
FROM information_schema.columns WHERE table_name = 'partners'
UNION ALL
SELECT
  'deals' AS table_name,
  count(*) FILTER (WHERE column_name IN ('stage', 'health_score', 'stage_entered_at')) AS lifecycle_fields
FROM information_schema.columns WHERE table_name = 'deals'
UNION ALL
SELECT
  'incentive_programs' AS table_name,
  count(*) FILTER (WHERE column_name IN ('lifecycle_stage', 'health_score', 'stage_entered_at')) AS lifecycle_fields
FROM information_schema.columns WHERE table_name = 'incentive_programs'
UNION ALL
SELECT
  'certification_programs' AS table_name,
  count(*) FILTER (WHERE column_name IN ('lifecycle_stage', 'health_score', 'stage_entered_at')) AS lifecycle_fields
FROM information_schema.columns WHERE table_name = 'certification_programs'
UNION ALL
SELECT
  'user_enrollments' AS table_name,
  count(*) FILTER (WHERE column_name IN ('enrollment_stage', 'health_score', 'stage_entered_at')) AS lifecycle_fields
FROM information_schema.columns WHERE table_name = 'user_enrollments'
UNION ALL
SELECT
  'marketing_activities' AS table_name,
  count(*) FILTER (WHERE column_name IN ('lifecycle_stage', 'health_score', 'stage_entered_at')) AS lifecycle_fields
FROM information_schema.columns WHERE table_name = 'marketing_activities'
UNION ALL
SELECT
  'campaign_attendees' AS table_name,
  count(*) FILTER (WHERE column_name IN ('attendee_lifecycle_stage', 'lead_score', 'stage_entered_at')) AS lifecycle_fields
FROM information_schema.columns WHERE table_name = 'campaign_attendees'
ORDER BY table_name;
