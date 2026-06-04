# PartnerNexus 数据字典 & 关联关系

> 每次修改更新此文档，标注数据来源、用途和关联

---

## 1. 公司信息 (Settings → 公司信息)

### 基本信息

| 字段 | 类型 | 来源 | 用途 | 关联 |
|------|------|------|------|------|
| `companyName` | string | `settings.data` | 侧边栏 Footer "所属公司" | Sidebar.tsx |
| `companyNameEn` | string | `settings.data` | 备用（暂无UI展示） | - |
| `companyAddress` | string | `settings.data` | 侧边栏 Footer 地址行 | Sidebar.tsx |
| `companyPhone` | string | `settings.data` | 侧边栏 Footer 电话行 | Sidebar.tsx |
| `companyEmail` | string | `settings.data` | 侧边栏 Footer 邮箱行 | Sidebar.tsx |
| `companyWebsite` | string | `settings.data` | 备用（暂无UI展示） | - |

### 业务目标

| 字段 | 类型 | 来源 | 用途 | 关联 |
|------|------|------|------|------|
| `annualTarget` | string | `settings.data` | 备用（暂无UI展示） | - |
| `quarterlyTarget` | string | `settings.data` | 备用（暂无UI展示） | - |
| `partnerTarget` | string | `settings.data` | 备用（暂无UI展示） | - |
| `channelRegions` | string | `settings.data` | 备用（暂无UI展示） | - |
| `coreBusiness` | string | `settings.data` | 备用（暂无UI展示） | - |
| `businessModel` | string | `settings.data` | 备用（暂无UI展示） | - |

### 全局配置 → 影响全站

| 字段 | 类型 | 用途 | 关联文件 |
|------|------|------|----------|
| `currency` | CNY/USD/JPY | 金额格式 | utils.ts → formatCurrency() |
| `partnerTiers` | string[] | 等级筛选/表单下拉 | PartnerList, PartnerForm |
| `partnerTypes` | string[] | 类型筛选/表单下拉 | PartnerList, PartnerForm |
| `partnerStatuses` | string[] | 状态筛选 | PartnerList |
| `partnerVendors` | string[] | 厂商关联 | PartnerForm |
| `cooperationLevels` | string[] | 合作级别 | PartnerForm |
| `salesStages` | string[] | 销售阶段 | DealRegForm |
| `industries` | string[] | 行业筛选 | PartnerList, DealForm |
| `regions` | string[] | 区域筛选 | PartnerList, DealForm |
| `productTypes` | string[] | 产品类型 | DealRegForm |
| `ctaButtonLabel` | string | 侧边栏按钮文字 | Sidebar.tsx |
| `partnerCenterUrl` | string | 侧边栏按钮链接 | Sidebar.tsx |
| `authorizedLevels` | string[] | 授权级别 | Settings → 分类引擎 |

---

## 2. 合作伙伴 (Partners)

| 字段 | 类型 | 来源 | 用途 | 关联 |
|------|------|------|------|------|
| `id` | string | Supabase/生成 | 唯一标识 | Deals.partner_id |
| `name` | string | 用户输入 | 列表/详情展示 | Deals.partner_name |
| `tier` | PartnerTier | 用户选择 | 等级徽章/筛选 | partnerTiers 配置 |
| `status` | PartnerStatus | 系统/用户 | 状态筛选/颜色 | STATUS_CONFIG |
| `type` | PartnerType | 用户选择 | 类型标签 | partnerTypes 配置 |
| `manager` | string | 用户输入 | 渠道经理 | - |
| `region` | string | 用户选择 | 区域筛选 | regions 配置 |
| `winRate` | number | 自动计算 | Profile 展示 | 赢单数/报备总数 |
| `years` | number | 自动计算 | Profile 展示 | startDate |
| `contacts` | PartnerContact[] | 用户输入 | 联系人列表 | partner_contacts 表 |
| `tags` | string[] | 渠道经理 | 标签筛选 | - |
| `pipeline_registered` | number | 自动/手动 | pipeline 漏斗 | Deals (按 stage 聚合) |
| `pipeline_solution` | number | 自动/手动 | pipeline 漏斗 | Deals (stage=Solution) |
| `pipeline_commercial` | number | 自动/手动 | pipeline 漏斗 | Deals (stage=Commercial) |
| `pipeline_won` | number | 自动/手动 | pipeline 漏斗 | Deals (stage=ClosedWon) |
| `mdf_total` | number | 手动 | MDF 配额 | - |
| `mdf_used` | number | 手动 | MDF 已用 | - |
| `certified_engineers` | number | 手动 | 赋能指标 | - |
| `startDate` | string | 用户输入 | 合作年限计算 | → years |
| `isCorePartner` | boolean | 用户选择 | 核心伙伴标记 | Profile 徽章 |
| `category` | PartnerCategory | 自动分类 | 分类标签 | 评分引擎计算 |

### 数据流

```
Settings.partnerTiers → PartnerForm (tier 下拉)
Settings.regions → PartnerList (region 筛选)
Deals (按 partner_id 聚合) → pipeline_registered/solution/commercial/won
partnerDataBuilder.ts → buildPartnerDetails() → PartnerProfile
```

---

## 3. 商机 (Deals)

| 字段 | 类型 | 来源 | 关联 |
|------|------|------|------|
| `id` | string | Supabase | - |
| `title` | string | 用户输入 | - |
| `customer` | string | 用户输入 | 旧字段(DB) → normalizeDeal → customerName |
| `value` | number | 用户输入 | Partners.pipeline (聚合) |
| `partner_id` | string | 用户选择 | → Partners.id |
| `partner_name` | string | 自动填充 | Partners.name |
| `partner_type` | string | 自动填充 | Partners.type |
| `status` | DealStatus | 流程变更 | Pending/Approved/Converted |
| `region` | string | 用户选择 | → Dashboard 区域统计 |
| `sales_name` | string | 用户输入 | 销售负责人 |
| `created_date` | string | 自动 | 报备日期 |
| `end_date` | string | 用户输入 | 预计关闭日期 → normalizeDeal → expectedCloseDate |
| `is_priority` | boolean | 用户选择 | 重点商机标记 |
| `has_conflict` | boolean | 系统检测 | 冲突标记 |
| `description` | string | 用户输入 | 备注 |

### 数据流

```
DealForm → dealService.create() → toSnakeDeal() → Supabase
Supabase → dealService.list() → normalizeDeal() → useDeals()
useDeals() → PartnerProfile (按 partner_id 聚合 pipeline)
```

---

## 4. 营销活动 (Marketing Activities)

| 字段 | 来源 | 关联 |
|------|------|------|
| `name` | 用户输入 | - |
| `type` | 用户选择 | 线下峰会/线下沙龙/Webinar/联合营销/渠道招募/行业大会/培训/其他 |
| `status` | 流程变更 | Planning/In Progress/Completed/Cancelled |
| `budget` | 用户输入 | → MDF 消耗统计 |
| `actual_spend` | 手动 | 实际支出 |
| `leads_generated` | 手动 | 线索数 → 转化率 |
| `event_date` | 用户选择 | 活动日期 |
| `host_type` | 用户选择 | vendor(厂商自办) / partner(代理商合办) |
| `partner_id` | 用户选择 | → `partners.id` (仅 host_type=partner 时) |
| `partner_name` | 自动填充 | → `partners.name` |
| `location` | 用户输入 | 活动地点 |
| `expected_attendees` | 用户输入 | 预计参会人数 |

### 数据流
```
marketing_activities.actual_spend (按 event_date 归属季度) → MarketingPlanPage 实际支出计算
marketing_activities (全表) → useMarketingData() → MDFModule / MarketingIncentivePage
marketing_activities → marketingService.getMDFActivities() → PartnerProfile 活动展示
```

---

## 5. 营销预算规划 (Marketing Budget Config & Plan)

### marketing_budget_config (预算配置)
| 字段 | 类型 | 来源 | 用途 | 关联 |
|------|------|------|------|------|
| `id` | TEXT | 固定 'current' | 唯一行标识 | - |
| `annual_budget` | DECIMAL | 自动计算 | 年度总预算 = SUM(q1-4_budget + adjust) | - |
| `q1_budget` ~ `q4_budget` | DECIMAL | 用户输入/批复 | 各季度基础预算 | → 季度预算显示 |
| `q1_adjust` ~ `q4_adjust` | DECIMAL | 预算调整 | 季度预算调整金额 | → 调整后预算 = base + adjust |
| `status` | TEXT | 流程变更 | draft/pending/approved | → 编辑权限控制 |
| `approved_at` | TIMESTAMPTZ | 自动 | 批复时间 | - |

### marketing_plan (活动计划)
| 字段 | 类型 | 来源 | 用途 | 关联 |
|------|------|------|------|------|
| `year` | INT | 用户选择 | 计划年份 | - |
| `quarter` | TEXT | 用户选择 | Q1/Q2/Q3/Q4 | → 按季度分组展示 |
| `activity_type` | TEXT | 用户选择 | Marketing(自办) / PMDF(伙伴合办) | - |
| `partner_id` | TEXT | 用户选择 | 合作伙伴ID | → `partners.id` |
| `partner_name` | TEXT | 自动填充 | 合作伙伴名称 | → `partners.name` |
| `category` | TEXT | 用户选择 | 线下峰会/线下沙龙/Webinar等 | - |
| `region` / `city` | TEXT | 用户输入 | 活动区域/城市 | - |
| `expected_date` | DATE | 用户输入 | 预期日期 | - |
| `total_budget` | DECIMAL | 用户输入 | 预算申请额 | → 预算申请总额统计 |
| `approved_amount` | DECIMAL | 批复 | 批复金额 | → 预算批复总额统计 |
| `expected_attendees` | INT | 用户输入 | 预计参加人数 | → 参会统计 |
| `expected_output` | TEXT | 用户输入 | 预期产出(线索/商机) | - |
| `responsible_person` | TEXT | 用户输入 | 负责人 | - |
| `execution_status` | TEXT | 流程变更 | Planning/In Progress/Completed/Cancelled | - |
| `plan_status` | TEXT | 流程变更 | draft/submitted/approved | → 季度计划状态标签 |

### budget_change_log (预算变更日志)
| 字段 | 关联 |
|------|------|
| `config_id` | → `marketing_budget_config.id` |
| `action` | 操作描述(保存/提交审批/批复通过/重新批复) |
| `q1_budget` ~ `q4_budget` | 变更时的各季度预算快照 |
| `created_at` | 操作时间 |

### global_settings (全局设置)
| 字段 | 类型 | 用途 |
|------|------|------|
| `id` | TEXT | 固定 'default' |
| `currency` | TEXT | CNY/USD/JPY → formatCurrency() 全站金额格式化 |

### 核心数据关系
```
global_settings.currency ──► formatCurrency() ──► 全站金额显示

marketing_budget_config ──► 年度/季度预算 + 调整
    │                        ├─ annualBudget = SUM(qBudgets)
    │                        ├─ qBudgets[i] = base + adjust
    │                        └─ status 控制编辑权限(draft可编辑/approved锁定)
    │
    ├──► marketing_plan (year + quarter)
    │       ├─ total_budget ──► 预算申请总额
    │       ├─ approved_amount ──► 预算批复总额
    │       ├─ partner_id ──► partners.id (仅 PMDF 类型)
    │       └─ execution_status / plan_status 状态追踪
    │
    ├──► marketing_activities.actual_spend (按季度聚合)
    │       └─ 计算: 预算执行率 = totalActual / annualBudget
    │
    └──► budget_change_log (预算变更审计追踪)
```

---

## 6. 激励计划 (Incentive Programs)

| 字段 | 关联 |
|------|------|
| `title` | 计划名称 |
| `trigger_type` | Pipeline Gap / New Product / Competitive / Sales Acceleration |
| `status` | Active/Upcoming/Ended |
| `payout_type` | Rebate/Cash/Points |
| `total_budget` | 总预算 |
| `claimed_amount` | 已申领/已发放 |
| `participants_count` | 参与伙伴数 |
| `description` | 计划描述 |
| `start_date` / `end_date` | 计划周期 |

### 数据流
```
incentive_programs → useMarketingData() → incentiveStats + incentivePrograms
                  → IncentiveModule (数值全由 props 动态计算)
                  → IncentivesPage (激励计划管理)
                  → marketingService.getIncentivePrograms() → PartnerProfile
```

---

## 6. 用户管理 (Settings → 用户管理)

### 本公司用户 (Internal)
| 字段 | 类型 | 来源 | 用途 | 关联 |
|------|------|------|------|------|
| `name` | string | 管理员输入 | 显示名称 | - |
| `email` | string | 管理员输入 | 登录账号 | - |
| `role` | UserRole | 管理员选择 | 权限控制 | permission-service.ts → 影响全站可见性 |
| `department` | string | 管理员输入 | 部门标签 | - |
| `phone` | string | 管理员输入 | 联系方式 | - |
| `status` | active/inactive | 管理员切换 | 账号启用/停用 | - |
| `source` | 'admin' | 自动标记 | 区分来源 | - |

**存储**: 当前存储在 localStorage，未来需接入 Supabase Auth Admin API (需要 service_role key)

### 合作伙伴用户 (Partner)
| 字段 | 来源 | 关联 |
|------|------|------|
| `partnerId` | `partner_contacts.partner_id` | → `partners.id` → `partners.name` |
| `partnerName` | JOIN `partners` 表 | 显示所属伙伴 |
| `name` | `partner_contacts.last_name + first_name` | 真实联系人数据 |
| `email` | `partner_contacts.email` | 真实邮箱 |
| `title` | `partner_contacts.title` | 职位 |
| `phone` | `partner_contacts.mobile / phone` | 联系方式 |

**数据流**:
```
partner_contacts (Supabase, 48 rows) → SettingsPage useEffect → allUsers
partners (Supabase) → JOIN partner_name
未来: 合作伙伴中心 ↔ 同一套 partner_contacts 数据
```

**当前状态**: 48个联系人，来自4个合作伙伴，只读展示（由合作伙伴中心管理）

---

## 已知问题

- [x] `marketing_budget_config` / `marketing_plan` / `budget_change_log` / `global_settings` 表定义添加到迁移 (20250603000004)
- [x] `useMarketingData` 移除初始 mock 数据回退，全部从 Supabase 实时获取
- [x] `IncentiveModule.tsx` 硬编码假数据替换为基于 props 的动态计算
- [x] `MDFModule.tsx` 硬编码漏斗/ROI 数据替换为基于 props 的动态计算
- [x] `marketing-service.ts` 从返回 mock 常量改为异步获取 Supabase 数据
- [ ] `companyNameEn` 无 UI 展示（仅 DB 存储）
- [ ] `annualTarget` / `quarterlyTarget` 无 Dashboard KPI 展示
- [ ] `companyWebsite` 无链接展示
- [ ] `businessModel` / `coreBusiness` / `channelRegions` 无展示
- [ ] Deals 表缺少 `stage` / `lifecycle` 列（需 migration）
- [ ] 大部分合作伙伴 pipeline 数据为空
- [ ] 认证到期风险(expiryRiskCount) 未关联真实证书数据
