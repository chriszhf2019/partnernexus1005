-- ============================================================
-- 激励模块缺失表补齐迁移
-- 创建: incentive_policies / incentive_allocations / incentive_budget_alerts
-- 恢复: incentive_quarterly_plan 完整 5 态 (draft/submitted/approved/completed/cancelled)
-- ============================================================

-- 1. 激励政策表（V1 顶层政策中心）
CREATE TABLE IF NOT EXISTS incentive_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'volume_rebate',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'archived')),
  version TEXT DEFAULT 'v1.0',
  description TEXT,
  effective_date DATE,
  expiry_date DATE,
  total_budget DECIMAL(14,2) DEFAULT 0,
  allocated_budget DECIMAL(14,2) DEFAULT 0,
  used_budget DECIMAL(14,2) DEFAULT 0,
  rules JSONB DEFAULT '[]'::jsonb,
  applicable_products TEXT[] DEFAULT '{}',
  applicable_tiers TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  approved_at TIMESTAMPTZ,
  approved_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_incentive_policies_status ON incentive_policies(status);
CREATE INDEX IF NOT EXISTS idx_incentive_policies_type ON incentive_policies(type);
CREATE INDEX IF NOT EXISTS idx_incentive_policies_effective ON incentive_policies(effective_date, expiry_date);

-- 2. 激励分配表（政策 → 伙伴的额度分配）
CREATE TABLE IF NOT EXISTS incentive_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES incentive_policies(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  partner_name TEXT,
  partner_tier TEXT,
  allocated_amount DECIMAL(14,2) DEFAULT 0,
  used_amount DECIMAL(14,2) DEFAULT 0,
  remaining_amount DECIMAL(14,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'exhausted', 'revoked', 'expired')),
  allocated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incentive_allocations_policy ON incentive_allocations(policy_id);
CREATE INDEX IF NOT EXISTS idx_incentive_allocations_partner ON incentive_allocations(partner_id);
CREATE INDEX IF NOT EXISTS idx_incentive_allocations_status ON incentive_allocations(status);

-- 3. 预算告警表（80% 警告 / 100% 停止）
CREATE TABLE IF NOT EXISTS incentive_budget_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('policy', 'allocation', 'plan', 'program')),
  target_id UUID NOT NULL,
  threshold_pct INTEGER NOT NULL DEFAULT 80,
  current_usage_pct DECIMAL(5,2) DEFAULT 0,
  budget_amount DECIMAL(14,2) DEFAULT 0,
  used_amount DECIMAL(14,2) DEFAULT 0,
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical', 'exceeded')),
  message TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incentive_budget_alerts_target ON incentive_budget_alerts(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_incentive_budget_alerts_severity ON incentive_budget_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_incentive_budget_alerts_unresolved ON incentive_budget_alerts(is_resolved) WHERE is_resolved = false;

-- 4. 为 incentive_quarterly_plan 添加 policy_id 外键（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incentive_quarterly_plan' AND column_name = 'policy_id'
  ) THEN
    ALTER TABLE incentive_quarterly_plan ADD COLUMN policy_id UUID REFERENCES incentive_policies(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. 为 incentive_quarterly_plan 添加 submitted_at 字段（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incentive_quarterly_plan' AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE incentive_quarterly_plan ADD COLUMN submitted_at TIMESTAMPTZ;
  END IF;
END $$;

-- 6. 为 incentive_quarterly_plan 添加 completed_at 字段（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incentive_quarterly_plan' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE incentive_quarterly_plan ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
END $$;

-- 7. 恢复 incentive_quarterly_plan 的 5 态 status 约束
DO $$
BEGIN
  -- 先删除旧的约束
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'incentive_quarterly_plan' AND constraint_name LIKE '%status%check%'
  ) THEN
    ALTER TABLE incentive_quarterly_plan DROP CONSTRAINT IF EXISTS incentive_quarterly_plan_status_check;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No status check constraint to drop';
END $$;

-- 8. 添加新的 5 态约束
DO $$
BEGIN
  ALTER TABLE incentive_quarterly_plan
    ADD CONSTRAINT incentive_quarterly_plan_status_check
    CHECK (status IN ('draft', 'submitted', 'approved', 'completed', 'cancelled'));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Status check constraint already exists';
END $$;

-- 9. RLS 策略
ALTER TABLE IF EXISTS incentive_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS incentive_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS incentive_budget_alerts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- policies RLS
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Allow read incentive_policies') THEN
    CREATE POLICY "Allow read incentive_policies" ON incentive_policies FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Allow write incentive_policies') THEN
    CREATE POLICY "Allow write incentive_policies" ON incentive_policies FOR ALL USING (auth.role() = 'authenticated');
  END IF;

  -- allocations RLS
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Allow read incentive_allocations') THEN
    CREATE POLICY "Allow read incentive_allocations" ON incentive_allocations FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Allow write incentive_allocations') THEN
    CREATE POLICY "Allow write incentive_allocations" ON incentive_allocations FOR ALL USING (auth.role() = 'authenticated');
  END IF;

  -- alerts RLS
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Allow read incentive_budget_alerts') THEN
    CREATE POLICY "Allow read incentive_budget_alerts" ON incentive_budget_alerts FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Allow write incentive_budget_alerts') THEN
    CREATE POLICY "Allow write incentive_budget_alerts" ON incentive_budget_alerts FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- 10. 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_incentive_policies_updated_at ON incentive_policies;
CREATE TRIGGER update_incentive_policies_updated_at
  BEFORE UPDATE ON incentive_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_incentive_allocations_updated_at ON incentive_allocations;
CREATE TRIGGER update_incentive_allocations_updated_at
  BEFORE UPDATE ON incentive_allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_incentive_budget_alerts_updated_at ON incentive_budget_alerts;
CREATE TRIGGER update_incentive_budget_alerts_updated_at
  BEFORE UPDATE ON incentive_budget_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. 刷新 schema 缓存
NOTIFY pgrst, 'reload schema';
