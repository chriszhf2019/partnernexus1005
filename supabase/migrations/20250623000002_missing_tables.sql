-- ============================================================
-- 缺失表补齐迁移 - 20260623000001
-- 创建以下缺失表:
--   - marketing_execution_phases  (活动执行阶段)
--   - marketing_materials         (活动物料)
--   - budget_change_log           (预算变更日志)
--   - plan_baselines              (计划基线)
--   - plan_audit_logs             (计划审计日志)
-- ============================================================

-- ══════════════════════════════════════════════════════════
-- 1. marketing_execution_phases (活动执行阶段)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS marketing_execution_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  phase_order INT DEFAULT 1,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_execution_phases_activity ON marketing_execution_phases(activity_id, phase_order);

-- ══════════════════════════════════════════════════════════
-- 2. marketing_materials (活动物料)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS marketing_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'other' CHECK (type IN ('brochure', 'gift', 'signage', 'badge', 'brochure', 'other')),
  quantity INT DEFAULT 0,
  responsible_person TEXT,
  deadline DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_materials_activity ON marketing_materials(activity_id);

-- ══════════════════════════════════════════════════════════
-- 3. budget_change_log (预算变更日志)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS budget_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id TEXT DEFAULT 'current',
  field_name TEXT,
  old_value DECIMAL(14,2),
  new_value DECIMAL(14,2),
  change_type TEXT DEFAULT 'adjustment' CHECK (change_type IN ('adjustment', 'transfer', 'replenishment', 'reduction')),
  change_reason TEXT,
  changed_by TEXT DEFAULT '渠道经理',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_budget_change_log_config ON budget_change_log(config_id, created_at DESC);

-- ══════════════════════════════════════════════════════════
-- 4. plan_baselines (计划基线)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS plan_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INT,
  quarter TEXT,
  activity_id UUID,
  field_name TEXT NOT NULL,
  planned_value JSONB DEFAULT '{}',
  actual_value JSONB DEFAULT '{}',
  variance DECIMAL(14,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'finalized')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_plan_baselines_year ON plan_baselines(year, quarter);
CREATE INDEX IF NOT EXISTS idx_plan_baselines_activity ON plan_baselines(activity_id);

-- ══════════════════════════════════════════════════════════
-- 5. plan_audit_logs (计划审计日志)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS plan_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_config_id TEXT DEFAULT 'current',
  activity_id UUID,
  field_changed TEXT,
  old_value JSONB DEFAULT '{}',
  new_value JSONB DEFAULT '{}',
  change_reason TEXT,
  changed_by TEXT DEFAULT '渠道经理',
  change_type TEXT DEFAULT 'manual' CHECK (change_type IN ('manual', 'auto', 'system', 'approval')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_plan_audit_logs_config ON plan_audit_logs(plan_config_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plan_audit_logs_activity ON plan_audit_logs(activity_id, created_at DESC);

-- ══════════════════════════════════════════════════════════
-- 6. RLS 策略
-- ══════════════════════════════════════════════════════════
ALTER TABLE IF NOT EXISTS marketing_execution_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF NOT EXISTS marketing_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF NOT EXISTS budget_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF NOT EXISTS plan_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF NOT EXISTS plan_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- marketing_execution_phases RLS
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Allow read marketing_execution_phases' AND tablename = 'marketing_execution_phases') THEN
    CREATE POLICY "Allow read marketing_execution_phases" ON marketing_execution_phases FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Allow write marketing_execution_phases' AND tablename = 'marketing_execution_phases') THEN
    CREATE POLICY "Allow write marketing_execution_phases" ON marketing_execution_phases FOR ALL USING (auth.role() = 'authenticated');
  END IF;

  -- marketing_materials RLS
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Allow read marketing_materials' AND tablename = 'marketing_materials') THEN
    CREATE POLICY "Allow read marketing_materials" ON marketing_materials FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Allow write marketing_materials' AND tablename = 'marketing_materials') THEN
    CREATE POLICY "Allow write marketing_materials" ON marketing_materials FOR ALL USING (auth.role() = 'authenticated');
  END IF;

  -- budget_change_log RLS
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Allow read budget_change_log' AND tablename = 'budget_change_log') THEN
    CREATE POLICY "Allow read budget_change_log" ON budget_change_log FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Allow write budget_change_log' AND tablename = 'budget_change_log') THEN
    CREATE POLICY "Allow write budget_change_log" ON budget_change_log FOR ALL USING (auth.role() = 'authenticated');
  END IF;

  -- plan_baselines RLS
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Allow read plan_baselines' AND tablename = 'plan_baselines') THEN
    CREATE POLICY "Allow read plan_baselines" ON plan_baselines FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Allow write plan_baselines' AND tablename = 'plan_baselines') THEN
    CREATE POLICY "Allow write plan_baselines" ON plan_baselines FOR ALL USING (auth.role() = 'authenticated');
  END IF;

  -- plan_audit_logs RLS
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Allow read plan_audit_logs' AND tablename = 'plan_audit_logs') THEN
    CREATE POLICY "Allow read plan_audit_logs" ON plan_audit_logs FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Allow write plan_audit_logs' AND tablename = 'plan_audit_logs') THEN
    CREATE POLICY "Allow write plan_audit_logs" ON plan_audit_logs FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════
-- 7. updated_at 触发器
-- ══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_marketing_execution_phases_updated_at ON marketing_execution_phases;
CREATE TRIGGER update_marketing_execution_phases_updated_at
  BEFORE UPDATE ON marketing_execution_phases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketing_materials_updated_at ON marketing_materials;
CREATE TRIGGER update_marketing_materials_updated_at
  BEFORE UPDATE ON marketing_materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plan_baselines_updated_at ON plan_baselines;
CREATE TRIGGER update_plan_baselines_updated_at
  BEFORE UPDATE ON plan_baselines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ══════════════════════════════════════════════════════════
-- 8. 刷新 schema 缓存
-- ══════════════════════════════════════════════════════════
NOTIFY pgrst, 'reload schema';
