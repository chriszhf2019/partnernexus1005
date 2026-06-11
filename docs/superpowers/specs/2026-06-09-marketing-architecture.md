# 营销模块架构规范

**最后更新**: 2026-06-09
**目的**: 防止功能重叠、确保数据真实、明确页面职责

---

## 页面职责划分

### `/marketing` — 当季市场活动（执行视图）
- **数据源**: `marketing_activities` 表，按 `event_date` 筛选当前季度
- **内容**: KPI看板(实时数据)、活动清单(可编辑展开)、新建活动、计划批复桥接
- **不包含**: 年度预算分配、季度规划、审批流程(这些在 /plan)

### `/marketing/plan` — 年度整体计划（规划视图）
- **数据源**: `marketing_plan` + `marketing_budget_config` + `budget_change_log`
- **内容**: 年度预算分配、季度活动规划、提交审批、批复(双人)、基线快照、偏差对比
- **联动**: 计划批复后 → `/marketing` 的"已批复待执行"区域显示

---

## 数据真实性格局

| 页面 | 关键数据 | 数据表 | 计算方式 |
|------|----------|--------|----------|
| `/marketing` | 活动列表 | `marketing_activities` WHERE Q | 直接查询 |
| `/marketing` | 总预算/实支/线索 | 同上 | SUM() |
| `/marketing` | KPI卡片 | 同上 | 实时聚合 |
| `/marketing/plan` | 季度预算 | `marketing_budget_config` | 直接查询 |
| `/marketing/plan` | 活动计划 | `marketing_plan` WHERE year | 直接查询 |
| `/marketing/plan` | 实际支出对比 | `marketing_plan.actual_spend` | 从执行回填 |
| `/partners` | 伙伴列表 | `partners` | 直接查询 |
| `/partners` | 赢单率 | `deals` GROUP BY partner | 实时计算 |
| `/deals` | 商机列表 | `deals` | 直接查询 |
| `/enablement` | 课程列表 | `certification_programs` | 直接查询 |
| `/enablement` | 学习进度 | `user_enrollments` | 实时查询 |
| `/incentives` | 激励计划 | `incentive_programs` | 直接查询 |

---

## 禁止事项

1. ❌ 不要在 `/marketing` 页面上放年度规划/预算分配功能
2. ❌ 不要在 `/marketing/plan` 页面上放当季活动执行列表
3. ❌ 不要使用硬编码数字替代数据库查询
4. ❌ 不要让两个页面有重复的 KPI 卡片
5. ❌ 不要在没有真实数据的情况下显示图表

---

## 页面间数据流

```
/marketing/plan (规划)
    │ 批复通过
    ▼
/marketing "已批复待执行" 区域
    │ 点击"开始执行"
    ▼
/marketing 活动清单 (status=In Progress)
    │ 执行完成 (status=Completed)
    ▼
actual_spend/leads 回填到 marketing_plan
    │
/marketing/plan "实际vs计划" 对比
```
