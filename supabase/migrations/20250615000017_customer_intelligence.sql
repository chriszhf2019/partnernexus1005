-- 客户情报表：支撑 CustomerAnalysis 的 7 要素分析
-- 在 Supabase SQL Editor 中执行

CREATE TABLE IF NOT EXISTS public.customer_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL UNIQUE,
  industry TEXT,
  revenue TEXT,
  revenue_growth TEXT,
  employees TEXT,
  rank TEXT,
  strategy_keywords TEXT[],
  tech_stack TEXT,
  cloud_maturity TEXT,
  hiring_hot TEXT,
  top_vendors TEXT,
  bid_cycle TEXT,
  decision_mode TEXT,
  cio_profile TEXT,
  cio_background TEXT,
  cio_preference TEXT,
  debt_ratio TEXT,
  cashflow TEXT,
  it_budget_growth TEXT,
  recent_events TEXT[],
  risk_alerts TEXT[],
  scores JSONB DEFAULT '{}',
  ai_findings TEXT[],
  sources TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.customer_intelligence IS '客户情报数据库：支撑客户7要素分析和AI策略生成';
