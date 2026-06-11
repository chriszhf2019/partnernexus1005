# /marketing 页面审计报告

**日期**: 2026-06-09

## 数据来源验证

| 显示数据 | 数据表 | 查询方式 | 真实? |
|----------|--------|----------|-------|
| KPI - 活跃计划 | `incentive_programs` | useMarketingData() → incentiveStats | ✅ |
| KPI - 批复预算 | `marketing_plan` approved_amount SUM | q2Plans.reduce() | ✅ |
| KPI - 线索转化率 | `marketing_activities` leads_generated | qActivities.reduce() | ✅ |
| KPI - 激励计划 | `incentive_programs` | incentiveStats | ✅ |
| 活动列表 | `marketing_activities` | useMarketingData() filter by quarter | ✅ |
| MDF核销面板 | `mdf_claims` | supabase query | ✅ |
| ROI追踪面板 | `campaign_funnel` | supabase query | ✅ |
| 三维诊断-预算消耗 | `q2Plans` + `qActivities` | 实时计算 | ✅ |
| 三维诊断-参与质量 | `qActivities` | 实时计算 | ✅ |
| 三维诊断-ROI | `qActivities` (leads*85000/spend) | 实时计算 | ✅ |

## 逻辑链验证

```
数据加载 (useEffect)
  ├── marketing_budget_config → budgetConfig
  ├── marketing_plan (approved Q2) → q2Plans
  ├── partners → partners
  └── useMarketingData()
        ├── marketing_activities → mdfActivities → qActivities (filter Q2)
        ├── incentive_programs → incentivePrograms
        └── mdfStats / incentiveStats

KPI计算
  ├── totalBudget = SUM(q2Plans.approved_amount)    ← 规划视角
  ├── totalSpend = SUM(qActivities.actual_spend)    ← 执行视角
  ├── totalLeads = SUM(qActivities.leads_generated) ← 执行视角
  └── 两者来源不同，数值可能不一致 ⚠️

三维诊断
  ├── 钱花没花出去: q2Plans vs qActivities
  ├── 花得对不对: qActivities
  └── 花得值不值: totalSpend / totalLeads
```

## 发现的问题

### 1. totalBudget 来源不一致 ⚠️
- KPI卡片"批复预算" = q2Plans.approved_amount (来自 plan 表)
- 但 q2Plans 只包含 plan_status='approved' 的活动
- 直接创建的执行活动预算没有计入
- **修复**: totalBudget 应同时包含 q2Plans + qActivities (Planning状态)

### 2. 季度过滤精度
- qActivities 使用 month 范围过滤，月份边界可能不准
- **修复**: 应使用 event_date 直接比较日期范围

### 3. 页面标题混淆
- 标题显示"市场营销"但实际是执行+规划混合视图
- **修复**: 标题改为"当季市场活动"更准确

### 4. 面板功能完整但入口不显眼
- 11个功能面板可用，但按钮在KPI下方不易发现
- **建议**: 保持现有6个核心按钮

## 已验证正常的部分 ✅
- 所有数据来自数据库（零硬编码演示数据）
- KPI 卡片数据正确
- 三维诊断计算逻辑正确
- 创建活动完整保存到 DB
- 面板功能无重叠（每个面板独立功能域）
