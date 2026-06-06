-- 阶梯奖励配置表
CREATE TABLE IF NOT EXISTS incentive_tier_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES incentive_programs(id) ON DELETE CASCADE,
  tier_order INT NOT NULL, -- 阶梯序号
  min_threshold NUMERIC NOT NULL DEFAULT 0, -- 最低阈值
  max_threshold NUMERIC, -- 最高阈值（NULL表示无上限）
  reward_amount NUMERIC NOT NULL, -- 奖励金额
  reward_type TEXT DEFAULT 'fixed', -- 'fixed' 固定金额, 'percentage' 百分比
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incentive_tier_rules_plan ON incentive_tier_rules(plan_id);

-- 定向规则表（支持多维度筛选）
CREATE TABLE IF NOT EXISTS incentive_targeting_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES incentive_programs(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL, -- 'region', 'tier', 'industry', 'partner_type', 'custom'
  operator TEXT DEFAULT 'in', -- 'in', 'not_in', 'contains', 'equals'
  values JSONB NOT NULL, -- 目标值列表
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incentive_targeting_rules_plan ON incentive_targeting_rules(plan_id);

-- 激励模板表
CREATE TABLE IF NOT EXISTS incentive_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- 模板名称
  category TEXT NOT NULL, -- 模板类别
  description TEXT,
  icon TEXT, -- 图标标识
  is_active BOOLEAN DEFAULT true,
  -- 模板配置
  config JSONB NOT NULL, -- 完整的计划配置JSON
  default_budget NUMERIC, -- 默认预算
  default_duration_days INT DEFAULT 30,
  -- 统计信息
  usage_count INT DEFAULT 0,
  avg_roi NUMERIC,
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incentive_templates_category ON incentive_templates(category);
CREATE INDEX IF NOT EXISTS idx_incentive_templates_active ON incentive_templates(is_active);

-- 激励申请审批表
CREATE TABLE IF NOT EXISTS incentive_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES incentive_programs(id) ON DELETE CASCADE,
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL,
  partner_tier TEXT,
  -- 申请数据
  metric TEXT NOT NULL, -- 申请的指标
  claimed_value NUMERIC NOT NULL, -- 申报数值
  payout_amount NUMERIC NOT NULL, -- 申请奖励金额
  -- 关联数据
  related_deals JSONB, -- 关联商机列表
  supporting_documents JSONB, -- 支持文件
  -- 审批流程
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewing', 'approved', 'rejected', 'paid', 'cancelled'
  current_step INT DEFAULT 1,
  workflow_steps JSONB, -- 审批步骤配置
  -- 审批记录
  approval_history JSONB, -- 审批历史记录
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  -- 财务信息
  invoice_number TEXT, -- 发票号码
  tax_id TEXT, -- 纳税人识别号
  bank_account TEXT, -- 银行账户信息
  -- 时间戳
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incentive_applications_plan ON incentive_applications(plan_id);
CREATE INDEX IF NOT EXISTS idx_incentive_applications_partner ON incentive_applications(partner_id);
CREATE INDEX IF NOT EXISTS idx_incentive_applications_status ON incentive_applications(status);

-- 预算预警配置表
CREATE TABLE IF NOT EXISTS incentive_budget_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES incentive_programs(id) ON DELETE CASCADE,
  warning_threshold NUMERIC DEFAULT 0.9, -- 软性预警阈值 (0.9 = 90%)
  stop_threshold NUMERIC DEFAULT 1.0, -- 硬性止损阈值 (1.0 = 100%)
  warning_notified BOOLEAN DEFAULT false,
  stop_triggered BOOLEAN DEFAULT false,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incentive_budget_alerts_plan ON incentive_budget_alerts(plan_id);

-- 激励ROI追踪表
CREATE TABLE IF NOT EXISTS incentive_roi_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES incentive_programs(id) ON DELETE CASCADE,
  -- 投入数据
  total_payout NUMERIC DEFAULT 0, -- 总发放金额
  total_budget_used NUMERIC DEFAULT 0, -- 总预算使用
  -- 产出数据
  total_revenue NUMERIC DEFAULT 0, -- 关联订单总金额
  total_pipeline NUMERIC DEFAULT 0, -- 关联Pipeline金额
  deals_created INT DEFAULT 0, -- 创建商机数
  deals_won INT DEFAULT 0, -- 赢单数量
  -- 计算指标
  roi NUMERIC, -- ROI = total_revenue / total_payout
  pipeline_contribution NUMERIC, -- Pipeline贡献率
  cost_per_deal NUMERIC, -- 单商机成本
  -- 时间范围
  tracking_period TEXT, -- 'monthly', 'quarterly', 'yearly'
  period_start DATE,
  period_end DATE,
  -- 时间戳
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incentive_roi_tracking_plan ON incentive_roi_tracking(plan_id);

-- 伙伴参与追踪表
CREATE TABLE IF NOT EXISTS incentive_participation_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES incentive_programs(id) ON DELETE CASCADE,
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL,
  partner_tier TEXT,
  partner_region TEXT,
  partner_industry TEXT,
  -- 参与状态
  is_participated BOOLEAN DEFAULT false,
  first_application_at TIMESTAMPTZ,
  total_applications INT DEFAULT 0,
  total_payout_received NUMERIC DEFAULT 0,
  -- 业绩贡献
  deals_registered INT DEFAULT 0,
  deals_won INT DEFAULT 0,
  revenue_contributed NUMERIC DEFAULT 0,
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incentive_participation_plan ON incentive_participation_tracking(plan_id);
CREATE INDEX IF NOT EXISTS idx_incentive_participation_partner ON incentive_participation_tracking(partner_id);
CREATE INDEX IF NOT EXISTS idx_incentive_participation_status ON incentive_participation_tracking(is_participated);

-- 结算记录表
CREATE TABLE IF NOT EXISTS incentive_settlement_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES incentive_applications(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES incentive_programs(id) ON DELETE CASCADE,
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  -- 结算信息
  settlement_amount NUMERIC NOT NULL, -- 结算金额
  settlement_currency TEXT DEFAULT 'CNY',
  -- 发票信息
  invoice_number TEXT,
  invoice_amount NUMERIC,
  invoice_date DATE,
  tax_rate NUMERIC DEFAULT 0.06,
  -- 支付信息
  payment_method TEXT, -- 'bank_transfer', 'online', 'cash'
  bank_name TEXT,
  bank_account TEXT,
  account_name TEXT,
  -- 状态
  status TEXT DEFAULT 'pending', -- 'pending', 'invoiced', 'paid', 'completed'
  -- 财务凭证
  voucher_number TEXT,
  -- 时间戳
  settled_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incentive_settlement_application ON incentive_settlement_records(application_id);
CREATE INDEX IF NOT EXISTS idx_incentive_settlement_partner ON incentive_settlement_records(partner_id);
CREATE INDEX IF NOT EXISTS idx_incentive_settlement_status ON incentive_settlement_records(status);

-- 插入默认激励模板数据
INSERT INTO incentive_templates (name, category, description, config, default_budget, default_duration_days) VALUES
(
  '拉新激励',
  'new_customer',
  '针对新客户拓展的激励政策，鼓励伙伴开发新客户资源',
  '{
    "category": "new_product",
    "scope": "global",
    "targets": [{"metric": "新客户数量", "targetValue": 100, "unit": "家", "weight": 100}],
    "direction": {"direction": "expand_market", "priorityLevel": "high"},
    "pace": {"expectedStartPace": 20, "expectedMidPace": 50, "expectedEndPace": 30},
    "tierRules": [
      {"tierOrder": 1, "minThreshold": 1, "maxThreshold": 5, "rewardAmount": 500, "rewardType": "fixed"},
      {"tierOrder": 2, "minThreshold": 6, "maxThreshold": 10, "rewardAmount": 800, "rewardType": "fixed"},
      {"tierOrder": 3, "minThreshold": 11, "maxThreshold": null, "rewardAmount": 1200, "rewardType": "fixed"}
    ]
  }',
  100000,
  90
),
(
  '存量续费激励',
  'renewal',
  '鼓励伙伴促进现有客户续约，提升客户留存率',
  '{
    "category": "loyalty",
    "scope": "global",
    "targets": [{"metric": "续费率", "targetValue": 85, "unit": "%", "weight": 100}],
    "direction": {"direction": "retain_partners", "priorityLevel": "medium"},
    "pace": {"expectedStartPace": 30, "expectedMidPace": 40, "expectedEndPace": 30},
    "tierRules": [
      {"tierOrder": 1, "minThreshold": 70, "maxThreshold": 79, "rewardAmount": 0.02, "rewardType": "percentage"},
      {"tierOrder": 2, "minThreshold": 80, "maxThreshold": 89, "rewardAmount": 0.03, "rewardType": "percentage"},
      {"tierOrder": 3, "minThreshold": 90, "maxThreshold": null, "rewardAmount": 0.05, "rewardType": "percentage"}
    ]
  }',
  50000,
  90
),
(
  '特价机促销激励',
  'promotion',
  '针对特定产品型号的促销激励，加速库存周转',
  '{
    "category": "velocity",
    "scope": "targeted",
    "targets": [{"metric": "特价机销量", "targetValue": 500, "unit": "台", "weight": 100}],
    "direction": {"direction": "accelerate_sales", "priorityLevel": "high"},
    "pace": {"expectedStartPace": 25, "expectedMidPace": 50, "expectedEndPace": 25},
    "tierRules": [
      {"tierOrder": 1, "minThreshold": 1, "maxThreshold": 50, "rewardAmount": 100, "rewardType": "fixed"},
      {"tierOrder": 2, "minThreshold": 51, "maxThreshold": 100, "rewardAmount": 150, "rewardType": "fixed"},
      {"tierOrder": 3, "minThreshold": 101, "maxThreshold": 200, "rewardAmount": 200, "rewardType": "fixed"},
      {"tierOrder": 4, "minThreshold": 201, "maxThreshold": null, "rewardAmount": 250, "rewardType": "fixed"}
    ]
  }',
  80000,
  30
),
(
  '竞品替换阻击激励',
  'competitive',
  '针对竞争对手客户的替换激励，抢占市场份额',
  '{
    "category": "competitive",
    "scope": "targeted",
    "targets": [{"metric": "竞品替换数量", "targetValue": 30, "unit": "个", "weight": 100}],
    "direction": {"direction": "defend_territory", "priorityLevel": "high"},
    "pace": {"expectedStartPace": 20, "expectedMidPace": 50, "expectedEndPace": 30},
    "tierRules": [
      {"tierOrder": 1, "minThreshold": 1, "maxThreshold": 5, "rewardAmount": 2000, "rewardType": "fixed"},
      {"tierOrder": 2, "minThreshold": 6, "maxThreshold": 10, "rewardAmount": 2500, "rewardType": "fixed"},
      {"tierOrder": 3, "minThreshold": 11, "maxThreshold": null, "rewardAmount": 3000, "rewardType": "fixed"}
    ]
  }',
  120000,
  60
),
(
  '销售结单加速激励',
  'acceleration',
  '缩短销售周期，加速商机结单的激励政策',
  '{
    "category": "velocity",
    "scope": "global",
    "targets": [{"metric": "平均销售周期", "targetValue": 30, "unit": "天", "weight": 100}],
    "direction": {"direction": "accelerate_sales", "priorityLevel": "medium"},
    "pace": {"expectedStartPace": 20, "expectedMidPace": 60, "expectedEndPace": 20},
    "tierRules": [
      {"tierOrder": 1, "minThreshold": 15, "maxThreshold": 20, "rewardAmount": 1000, "rewardType": "fixed"},
      {"tierOrder": 2, "minThreshold": 21, "maxThreshold": 30, "rewardAmount": 500, "rewardType": "fixed"}
    ]
  }',
  60000,
  60
);
