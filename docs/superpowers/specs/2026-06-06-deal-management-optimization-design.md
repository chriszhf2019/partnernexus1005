# 商机管理系统全功能优化 — 设计规格说明书

**日期**: 2026-06-06
**状态**: 设计中
**对比基准**: commit `19377bf` — "Add new features: win/loss analysis, intelligent routing, extend request, custom views, quick peek"

---

## 一、背景与目标

### 当前状态

最新 commit 已实现约 70% 的用户优化方案功能点，主要差距集中在：

1. **丢单原因分布图** — 单条录入已支持，汇总分析图表缺失
2. **自动保护期规则引擎** — 数据结构已有（`protectionPeriodDays`），自动化逻辑缺失
3. **Inline Editing 行内编辑** — Quick Peek 只读，无行内编辑
4. **7天到期自动推送提醒** — 延期功能存在，自动提醒缺失
5. **预设快捷筛选按钮** — 自定义视图需手动保存，无一键预设

### 目标

补全上述 5 个功能，并将 1739 行的 DealRegistrationPage.tsx 拆分为可维护的子组件。

### 技术方案

- **前端**: React + TypeScript + Tailwind CSS + recharts + framer-motion
- **后端**: Supabase (Postgres + Edge Functions + pg_cron)
- **拆包策略**: 方案 B — 一次性全量拆分为 15 个子组件

---

## 二、文件结构变更

```
src/components/deals/
├── DealRegistrationPage.tsx              (编排层, ~250行)
├── DealRegistrationForm.tsx              (已有)
├── DealDetailPage.tsx                    (已有)
├── KanbanBoard.tsx                       (已有)
└── components/                           (新建)
    ├── index.ts
    ├── DealStatsCards.tsx                (~100行)
    ├── DealFunnel.tsx                    (~150行)
    ├── DealTable.tsx                     (~500行)
    ├── InlineEdit.tsx                    (~180行)  [NEW]
    ├── ActivityDrawer.tsx                (~160行)
    ├── QuickPeekPopover.tsx              (~120行)
    ├── WinLossModal.tsx                  (~120行)
    ├── WinLossPanel.tsx                  (~450行)  [NEW]
    ├── ConflictCenter.tsx                (~400行)
    ├── RuleEnginePanel.tsx               (~350行)  [NEW]
    ├── IntelligentAssignModal.tsx        (~220行)
    ├── ExtendRequestModal.tsx            (~110行)
    ├── CustomViewManager.tsx             (~200行)
    └── PresetFilterBar.tsx               (~180行)  [NEW]
```

---

## 三、数据库变更

### 3.1 新建表 (5张)

```sql
-- 1. deal_activities: 商机跟进动态
CREATE TABLE deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('note','call','meeting','email','task','update')),
  content TEXT NOT NULL,
  actor TEXT NOT NULL,
  mentions TEXT[] DEFAULT '{}',
  reply_to_id UUID REFERENCES deal_activities(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. protection_rules: 可配置保护规则
CREATE TABLE protection_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  protection_days INT NOT NULL DEFAULT 90,
  require_recent_activity BOOLEAN DEFAULT true,
  recent_activity_days INT DEFAULT 30,
  expire_action TEXT DEFAULT 'notify_only' CHECK (expire_action IN ('notify_only','auto_release')),
  notify_before_days INT DEFAULT 7,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. rule_execution_logs: 规则执行历史
CREATE TABLE rule_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES protection_rules(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('notified','released','warned')),
  details TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. saved_views: 筛选视图/预设
CREATE TABLE saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  is_preset BOOLEAN DEFAULT false,
  is_ai_recommended BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  icon TEXT DEFAULT 'star',
  badge_type TEXT DEFAULT 'count' CHECK (badge_type IN ('count','value','none')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. filter_history: 用户筛选历史 (AI推荐用)
CREATE TABLE filter_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  result_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 索引

```sql
CREATE INDEX idx_deal_activities_deal ON deal_activities(deal_id, created_at DESC);
CREATE INDEX idx_rule_logs_deal ON rule_execution_logs(deal_id);
CREATE INDEX idx_rule_logs_executed ON rule_execution_logs(executed_at DESC);
CREATE INDEX idx_saved_views_user ON saved_views(user_id);
CREATE INDEX idx_filter_history_user ON filter_history(user_id, created_at DESC);
```

### 3.3 deals 表扩展

```sql
ALTER TABLE deals ADD COLUMN IF NOT EXISTS win_loss_reason TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS win_loss_description TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS win_loss_competitor TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS win_loss_key_factors JSONB DEFAULT '[]'::jsonb;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS activities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS days_in_current_stage INT DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS is_stagnant BOOLEAN DEFAULT false;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS weighted_value INT DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS expires_in_days INT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS customer_contact TEXT DEFAULT '';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS customer_phone TEXT DEFAULT '';
```

### 3.4 种子数据

- `protection_rules`: 插入 2 条默认规则
  - "首报保护期自动释放" (90天 + 需近期跟进 + 自动释放)
  - "异常停滞预警" (停滞2倍平均周期 + 标记+通知)
- `saved_views`: 插入 6 条系统预设
- `deal_activities`: 从 `constants.ts` mock 数据迁移

---

## 四、各组件详细设计

### 4.1 InlineEdit (~180行)

**API**:
```typescript
interface InlineEditProps {
  value: string | number;
  type: 'text' | 'number' | 'currency' | 'date' | 'select';
  options?: { label: string; value: string }[];
  onSave: (newValue: string | number) => Promise<void>;
  onCancel?: () => void;
  validate?: (value: string) => string | null;
  placeholder?: string;
  editable?: boolean;
}
```

**交互流程**:
1. 默认态：只读文本
2. 点击 → 编辑态（自动聚焦）
3. Enter/失焦 → 验证 → onSave → 绿色闪烁确认
4. Esc → 取消 → 恢复原值

**DealTable 中可编辑列**: value (currency), expectedCloseDate (date), stage (select), nextAction (text), nextActionDate (date), customerName (text)

**权限控制**: `['ClosedWon', 'ClosedLost'].includes(stage)` 时 disabled

### 4.2 WinLossPanel (~450行)

**依赖**: recharts (已在项目中)

**面板布局**:
```
┌─────────────────────────────────────────────┐
│  📊 赢单/丢单分析              [时间段选择器] │
├───────────────────────┬─────────────────────┤
│ 🍩 丢单原因 PieChart   │ 🍩 赢单因素 PieChart │
├───────────────────────┴─────────────────────┤
│ 📈 各阶段丢单率 BarChart                     │
├───────────────────────┬─────────────────────┤
│ 🏢 竞品分布 TOP5       │ 📋 近期丢单清单       │
├───────────────────────┴─────────────────────┤
│ 💰 汇总统计栏                                │
└─────────────────────────────────────────────┘
```

**交互**:
- 时间段选择器: 全部/本季/本年/自定义
- 点击图表扇区 → 下方清单联动过滤
- 点击丢单清单行 → 跳转商机详情

### 4.3 RuleEnginePanel (~350行)

**功能**:
- 规则 CRUD（增删改、启用/禁用）
- 每条规则可配置：保护期天数、是否需要近期跟进、到期动作、提前通知天数
- 规则执行历史日志列表

**数据流**:
- 页面加载 → `supabase.from('protection_rules').select('*')`
- 规则变更 → `upsert` 到数据库
- 执行历史 → `rule_execution_logs` 查询

### 4.4 PresetFilterBar (~180行)

**系统内置预设 (6个)**:
| 名称 | 筛选逻辑 |
|------|---------|
| 🔥 本周待审批 | stage = UnderReview |
| ⚠️ 异常停滞 | isStagnant = true |
| ⏰ 即将到期 | expiresInDays ≤ 7 |
| 💎 重点项目 | value ≥ 1000000 |
| 👤 我的商机 | salesName = currentUser |
| 🏢 区域视野 | region = userRegion |

**AI 推荐预设**:
- 基于 `filter_history` 表分析用户高频筛选组合
- 算法: 频率分析 + 商机集中度检测 + 风险模式识别
- 每次最多推荐 3 个

**与 CustomViewManager 关系**:
- PresetFilterBar: 快捷按钮，一键切换
- CustomViewManager: 完整视图管理
- 共享 `saved_views` 数据，preset 是 `is_preset=true` 的子集

### 4.5 其余子组件 (拆分自 DealRegistrationPage)

| 组件 | 行数 | 说明 |
|------|------|------|
| DealStatsCards | ~100 | 统计卡片 (总额/加权/赢单/异常停滞) |
| DealFunnel | ~150 | 漏斗图 + 阶段转化率 + 点击联动 |
| DealTable | ~500 | 列表 + InlineEdit + 批量选择 |
| ActivityDrawer | ~160 | 跟进动态侧边抽屉 |
| QuickPeekPopover | ~120 | 鼠标悬停预览浮窗 |
| WinLossModal | ~120 | 赢单/丢单录入模态框 |
| ConflictCenter | ~400 | 冲突裁决左右分屏 + 规则引擎入口 |
| IntelligentAssignModal | ~220 | 智能分配推荐伙伴 |
| ExtendRequestModal | ~110 | 延期申请表单 |
| CustomViewManager | ~200 | 视图保存/命名/删除 |

---

## 五、Supabase Edge Functions

### 5.1 check-protection-rules (每天 2:00)

```typescript
// 逻辑:
// 1. SELECT * FROM protection_rules WHERE enabled = true
// 2. 对每条规则匹配 deals
// 3. 根据 expire_action: notify_only → 日志, auto_release → 更新 status + 日志
// 4. 返回执行摘要 { rulesChecked, dealsReleased, notificationsCreated }
```

### 5.2 check-expiry-reminders (每天 9:00)

```typescript
// 逻辑:
// 1. SELECT * FROM deals WHERE expiresInDays <= 7 AND stage NOT IN ('ClosedWon','ClosedLost')
// 2. 检查 deal_activities 最近一次跟进时间
// 3. 有跟进 → 自动续期 +30天
// 4. 无跟进 → 生成提醒 activity (type='update')
// 5. 返回 { dealsChecked, renewed, remindersCreated }
```

### 5.3 pg_cron 调度

```sql
SELECT cron.schedule('check-protection-rules', '0 2 * * *', ...);
SELECT cron.schedule('check-expiry-reminders', '0 9 * * *', ...);
```

---

## 六、数据流总览

```
Supabase DB
  ├── deals (扩展字段)
  ├── deal_activities [NEW]
  ├── protection_rules [NEW]
  ├── rule_execution_logs [NEW]
  ├── saved_views [NEW]
  └── filter_history [NEW]
       ↑                    ↑
       │ Supabase Client    │ Edge Functions (pg_cron)
       ▼                    ▼
  useData.ts           check-protection-rules
       │                check-expiry-reminders
       ▼
  DealRegistrationPage (编排层)
       │
       ├── DealStatsCards
       ├── PresetFilterBar [NEW]
       ├── DealFunnel
       ├── DealTable → InlineEdit [NEW]
       ├── WinLossPanel [NEW]
       ├── ConflictCenter → RuleEnginePanel [NEW]
       └── ... (其余子组件)
```

---

## 七、风险与约束

1. **Supabase Edge Functions** 需要项目开启 `pg_cron` 扩展和 `pg_net` 扩展
2. **recharts** 已存在依赖，不需要额外安装
3. **拆分后 Props 传递**: DealRegistrationPage 作为编排层，需要将 `deals`, `onDealUpdate`, `onDealDelete` 等通过 props 传递给子组件
4. **向后兼容**: 现有 `constants.ts` 中的 `DEALS` mock 数据保持可用，作为 Supabase 不可用时的 fallback
5. **迁移安全**: 所有 DDL 使用 `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`，可重复执行

---

## 八、实施顺序

1. **Phase 1**: 数据库迁移 + Supabase client 扩展
2. **Phase 2**: 子组件拆分（从 DealRegistrationPage 提取现有功能到独立文件）
3. **Phase 3**: InlineEdit 通用组件
4. **Phase 4**: WinLossPanel + recharts 图表
5. **Phase 5**: RuleEnginePanel + PresetFilterBar
6. **Phase 6**: Edge Functions 开发部署
7. **Phase 7**: 集成测试 + 端到端验证
