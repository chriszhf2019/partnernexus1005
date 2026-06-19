-- =====================================================
-- 合作伙伴管理系统 - 数据库迁移脚本
-- 版本: v2.0
-- 描述: 添加评分配置表和月度统计数据表
-- =====================================================

-- 1. 评分配置表 - 支持运行时动态调整评分权重
CREATE TABLE IF NOT EXISTS scoring_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'scoring',
  is_active BOOLEAN DEFAULT true,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 月度统计数据表 - 支持同比/环比增长的历史数据积累
CREATE TABLE IF NOT EXISTS partner_monthly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  -- 伙伴变动数据
  is_new BOOLEAN DEFAULT false,
  is_lost BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT false,
  -- 业务数据
  pipeline_registered DECIMAL(15,2) DEFAULT 0,
  pipeline_won DECIMAL(15,2) DEFAULT 0,
  revenue DECIMAL(15,2) DEFAULT 0,
  -- 激励数据
  mdf_used DECIMAL(15,2) DEFAULT 0,
  mdf_total DECIMAL(15,2) DEFAULT 0,
  certification_count INTEGER DEFAULT 0,
  marketing_activity_count INTEGER DEFAULT 0,
  -- 约束
  UNIQUE(partner_id, year, month),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 认证培训记录表 - 支持能力画像的真实数据
CREATE TABLE IF NOT EXISTS partner_training_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  certification_name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('traditional_it', 'cloud_native', 'ai_ml', 'security', 'data', 'service')),
  level VARCHAR(50) CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  provider VARCHAR(255),
  certificate_id VARCHAR(100),
  obtained_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_scoring_config_category ON scoring_config(category);
CREATE INDEX IF NOT EXISTS idx_scoring_config_active ON scoring_config(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_monthly_stats_period ON partner_monthly_stats(year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_stats_partner ON partner_monthly_stats(partner_id);
CREATE INDEX IF NOT EXISTS idx_training_partner ON partner_training_records(partner_id);
CREATE INDEX IF NOT EXISTS idx_training_category ON partner_training_records(category);
CREATE INDEX IF NOT EXISTS idx_training_status ON partner_training_records(status) WHERE status = 'active';

-- =====================================================
-- 初始化评分配置数据
-- =====================================================

INSERT INTO scoring_config (config_key, config_value, description, category) VALUES
-- 1. 各等级期望基线
('tier_baseline', 
 '{"Diamond": 80, "Platinum": 70, "Gold": 58, "Silver": 45, "Standard": 35, "Registered": 25, "default": 40}',
 '各等级期望基线 - 不同等级伙伴用不同标准评估', 'tier') ON CONFLICT (config_key) DO NOTHING,

-- 2. 认证工程师数量基线期望
('tier_cert_expectation', 
 '{"Diamond": 15, "Platinum": 10, "Gold": 6, "Silver": 3, "Standard": 2, "Registered": 1, "default": 3}',
 '各等级认证工程师数量期望 - 用于增长力评分校准', 'tier') ON CONFLICT (config_key) DO NOTHING,

-- 3. 健康度评分权重
('health_weights', 
 '{"activity": 0.25, "capability": 0.25, "loyalty": 0.20, "pipelineHealth": 0.15, "growth": 0.15}',
 '健康度五维度权重 - 各项权重之和应为1', 'weight') ON CONFLICT (config_key) DO NOTHING,

-- 4. 增长力评分权重
('growth_weights', 
 '{"years": 0.15, "pipeline": 0.40, "certification": 0.30, "mdf": 0.15}',
 '增长力四维度权重 - 各项权重之和应为1', 'weight') ON CONFLICT (config_key) DO NOTHING,

-- 5. 意愿度评分权重
('willingness_weights', 
 '{"resource": 0.20, "capital": 0.15, "response": 0.20, "commitment": 0.25, "training": 0.20}',
 '意愿度五维度权重 - 各项权重之和应为1', 'weight') ON CONFLICT (config_key) DO NOTHING,

-- 6. 业务契合度权重
('fit_weights', 
 '{"customerOverlap": 0.30, "productComplement": 0.25, "modelSimilarity": 0.25, "geoMatch": 0.20}',
 '业务契合度四维度权重 - 各项权重之和应为1', 'weight') ON CONFLICT (config_key) DO NOTHING,

-- 7. 能力度权重
('capability_weights', 
 '{"sales": 0.25, "tech": 0.30, "delivery": 0.25, "marketing": 0.20}',
 '能力度四维度权重 - 各项权重之和应为1', 'weight') ON CONFLICT (config_key) DO NOTHING,

-- 8. 激励执行率权重
('incentive_weights', 
 '{"mdf": 0.40, "certification": 0.30, "marketing": 0.30}',
 '激励执行率三维度权重 - 各项权重之和应为1', 'weight') ON CONFLICT (config_key) DO NOTHING,

-- 9. 负反馈扣分阈值
('negative_penalty', 
 '{"noPipelineYears": 1, "noCertEngineersYears": 2, "noMdfYears": 1, "maxPenalty": 50, "noPipelinePenalty": 15, "noCertPenalty": 10, "noMdfPenalty": 8, "inactivePenalty": 25, "lowWinRatePenalty": 8}',
 '负反馈扣分阈值 - 长期无投入信号的扣分规则', 'penalty') ON CONFLICT (config_key) DO NOTHING,

-- 10. 流失风险阈值
('churn_thresholds', 
 '{"notCooperating": 35, "expiryThreshold": 2, "expiryBonus": 20, "pipelineThreshold": 1000000, "pipelineLow": 20, "winRateThreshold": 40, "winRateLow": 15, "mdfThreshold": 30, "mdfLow": 10}',
 '流失风险评估阈值', 'churn') ON CONFLICT (config_key) DO NOTHING,

-- 11. 月度快照配置
('monthly_snapshot', 
 '{"enabled": true, "autoRunDay": 1, "autoRunHour": 2, "retentionMonths": 36}',
 '月度数据快照配置 - autoRunDay: 每月第几天执行, autoRunHour: 执行时间(小时), retentionMonths: 数据保留月数', 'system') ON CONFLICT (config_key) DO NOTHING;

-- =====================================================
-- 创建更新 updated_at 的触发器函数
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为三个表创建触发器
DROP TRIGGER IF EXISTS update_scoring_config_updated_at ON scoring_config;
CREATE TRIGGER update_scoring_config_updated_at
  BEFORE UPDATE ON scoring_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_monthly_stats_updated_at ON partner_monthly_stats;
CREATE TRIGGER update_monthly_stats_updated_at
  BEFORE UPDATE ON partner_monthly_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_training_records_updated_at ON partner_training_records;
CREATE TRIGGER update_training_records_updated_at
  BEFORE UPDATE ON partner_training_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 验证脚本
-- =====================================================

-- 验证配置数据已插入
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM scoring_config) >= 11, '评分配置数据初始化失败';
  RAISE NOTICE '数据库迁移成功完成！';
END $$;
