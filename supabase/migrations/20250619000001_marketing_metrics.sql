-- Marketing Metrics Enhancement
-- Adds business metrics columns to marketing_activities and marketing_budget_config tables

DO $$
BEGIN
  -- ─── marketing_activities: 线索质量与转化字段 ───

  -- MQL 营销合格线索数
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'mql_count') THEN
    ALTER TABLE marketing_activities ADD COLUMN mql_count INT DEFAULT 0;
  END IF;

  -- SQL 销售合格线索数
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'sql_count') THEN
    ALTER TABLE marketing_activities ADD COLUMN sql_count INT DEFAULT 0;
  END IF;

  -- 线索质量分级 A/B/C
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'grade_a_leads') THEN
    ALTER TABLE marketing_activities ADD COLUMN grade_a_leads INT DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'grade_b_leads') THEN
    ALTER TABLE marketing_activities ADD COLUMN grade_b_leads INT DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'grade_c_leads') THEN
    ALTER TABLE marketing_activities ADD COLUMN grade_c_leads INT DEFAULT 0;
  END IF;

  -- 新客户(New Logo) 转化
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'new_logo_count') THEN
    ALTER TABLE marketing_activities ADD COLUMN new_logo_count INT DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'new_logo_amount') THEN
    ALTER TABLE marketing_activities ADD COLUMN new_logo_amount DECIMAL(14,2) DEFAULT 0;
  END IF;

  -- 平均转化周期 (天)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'conversion_days') THEN
    ALTER TABLE marketing_activities ADD COLUMN conversion_days INT DEFAULT 0;
  END IF;

  -- 线索跟进率 (%)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'follow_up_rate') THEN
    ALTER TABLE marketing_activities ADD COLUMN follow_up_rate INT DEFAULT 0;
  END IF;

  -- 沉睡线索 (48h+ 未跟进)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'stale_leads') THEN
    ALTER TABLE marketing_activities ADD COLUMN stale_leads INT DEFAULT 0;
  END IF;

  -- SOP/话术下载次数
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'sop_downloads') THEN
    ALTER TABLE marketing_activities ADD COLUMN sop_downloads INT DEFAULT 0;
  END IF;

  -- 实际生成商机数
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'deals_created') THEN
    ALTER TABLE marketing_activities ADD COLUMN deals_created INT DEFAULT 0;
  END IF;

  -- 线索生成总数 (兼容旧版字段名)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'leads_generated') THEN
    ALTER TABLE marketing_activities ADD COLUMN leads_generated INT DEFAULT 0;
  END IF;

  -- 实际支出金额
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'actual_spend') THEN
    ALTER TABLE marketing_activities ADD COLUMN actual_spend DECIMAL(14,2) DEFAULT 0;
  END IF;

  -- 预算金额
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'budget') THEN
    ALTER TABLE marketing_activities ADD COLUMN budget DECIMAL(14,2) DEFAULT 0;
  END IF;

  RAISE NOTICE 'marketing_activities: 业务指标字段添加完成';

  -- ─── marketing_budget_config: 待核销审批字段 ───

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_budget_config' AND column_name = 'pending_approvals') THEN
    ALTER TABLE marketing_budget_config ADD COLUMN pending_approvals INT DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_budget_config' AND column_name = 'pending_amount') THEN
    ALTER TABLE marketing_budget_config ADD COLUMN pending_amount DECIMAL(14,2) DEFAULT 0;
  END IF;

  RAISE NOTICE 'marketing_budget_config: 待核销审批字段添加完成';
END $$;

-- Refresh schema cache so Supabase API picks up the new columns immediately
NOTIFY pgrst, 'reload schema';
