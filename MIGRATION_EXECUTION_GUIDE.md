# 数据库迁移执行指南

## ⚠️ 重要提示

由于数据库连接需要正确的凭证信息，**最简单可靠的方法是通过 Supabase Dashboard 执行 SQL**。

## 方法一：通过 Supabase Dashboard（推荐）⭐

### 步骤 1: 登录 Supabase Dashboard
访问: https://supabase.com/dashboard

选择项目: **sutfazpqcpwxfzzyhforj**

### 步骤 2: 进入 SQL Editor
在左侧菜单中找到 **SQL Editor** (或点击 "New query")

### 步骤 3: 粘贴并执行 SQL

复制以下文件中的全部内容：
`supabase/migrations/20250606000009_marketing_activity_management.sql`

### 步骤 4: 执行
点击 **Run** 按钮（或按 Cmd+Enter）

### 步骤 5: 验证
执行成功后，在左侧菜单点击 **Table Editor**，确认看到以下新表：
- ✅ marketing_materials
- ✅ marketing_guests
- ✅ marketing_execution_phases
- ✅ marketing_phase_tasks
- ✅ marketing_evaluations
- ✅ marketing_evaluation_leads

---

## 方法二：通过 Supabase CLI

如果你已安装 Supabase CLI：

```bash
# 确保在项目目录
cd /Volumes/z/101/partner-management-1-main

# 链接项目（如果还没链接）
supabase link --project-ref sutfazpqcpwxfzzyhforj

# 执行迁移
supabase db push
```

---

## 方法三：通过 Node.js 脚本（需要数据库密码）

如果你知道数据库密码，可以使用项目中的脚本：

```bash
# 设置数据库密码环境变量
export SUPABASE_DB_PASSWORD="your-database-password"

# 运行迁移脚本
node scripts/migrate-db.cjs
```

**注意**: 数据库密码需要从 Supabase Dashboard 获取：
1. 进入项目设置 (Settings)
2. 点击 Database
3. 找到 "Connection string" 或 "Password"

---

## 迁移内容摘要

本次迁移将创建以下数据库表：

### 1. marketing_materials（活动物料表）
```sql
- id (UUID, 主键)
- activity_id (UUID, 外键)
- name (TEXT, 物料名称)
- type (TEXT, 类型：banner/brochure/gift/equipment/other)
- quantity (INT, 数量)
- status (TEXT, 状态：pending/preparing/ready/delivered)
- responsible_person (TEXT, 负责人)
- deadline (DATE, 截止日期)
- created_at, updated_at (时间戳)
```

### 2. marketing_guests（活动客户表）
```sql
- id (UUID, 主键)
- activity_id (UUID, 外键)
- name (TEXT, 客户姓名)
- company (TEXT, 公司)
- title (TEXT, 职位)
- phone (TEXT, 电话)
- email (TEXT, 邮箱)
- status (TEXT, 状态：invited/confirmed/attended/absent)
- partner_id, partner_name (关联合作伙伴)
- assigned_to (TEXT, 负责人)
- notes (TEXT, 备注)
- created_at, updated_at (时间戳)
```

### 3. marketing_execution_phases（执行阶段表）
```sql
- id (UUID, 主键)
- activity_id (UUID, 外键)
- name (TEXT, 阶段名称)
- description (TEXT, 描述)
- phase_order (INT, 排序)
- status (TEXT, 状态：pending/in_progress/completed/blocked)
- responsible_person (TEXT, 负责人)
- created_at, updated_at (时间戳)
```

### 4. marketing_phase_tasks（阶段任务表）
```sql
- id (UUID, 主键)
- phase_id (UUID, 外键)
- activity_id (UUID, 外键)
- name (TEXT, 任务名称)
- description (TEXT, 描述)
- status (TEXT, 状态)
- task_type (TEXT, 类型：manual/mini_program_sync/notification/reminder)
- assigned_to (TEXT, 负责人)
- deadline (DATE, 截止日期)
- completed_date (TIMESTAMPTZ, 完成时间)
- created_at, updated_at (时间戳)
```

### 5. marketing_evaluations（评估表）
```sql
- id (UUID, 主键)
- activity_id (UUID, 外键)
- total_attendees (INT, 参与人数)
- new_leads (INT, 获取线索)
- satisfaction_score (INT, 满意度 1-5)
- feedback_summary (TEXT, 反馈总结)
- lessons_learned (TEXT, 经验教训)
- recommendations (TEXT, 改进建议)
- is_completed (BOOLEAN, 是否完成)
- evaluated_by (TEXT, 评估人)
- evaluated_at (TIMESTAMPTZ, 评估时间)
- created_at, updated_at (时间戳)
```

### 6. marketing_evaluation_leads（评估商机表）
```sql
- id (UUID, 主键)
- evaluation_id (UUID, 外键)
- activity_id (UUID, 外键)
- guest_id (UUID, 外键)
- name, company, title, phone, email (客户信息)
- quality (TEXT, 质量：hot/warm/medium/cold)
- notes (TEXT, 备注)
- is_converted (BOOLEAN, 是否已转换)
- converted_deal_id (UUID, 转换后的商机ID)
- converted_at (TIMESTAMPTZ, 转换时间)
- created_at, updated_at (时间戳)
```

### 7. marketing_activities 表扩展
添加以下字段：
- province (TEXT, 省)
- city (TEXT, 市)
- district (TEXT, 区)
- location (TEXT, 详细地址)
- cover_image (TEXT, 封面图片)
- tags (TEXT, 标签)
- description (TEXT, 描述)
- contact_name, contact_phone (联系人)
- max_attendees (INT, 最大参与人数)
- enable_checkin, enable_questions, enable_lottery, enable_share (功能开关)
- lottery_reward (TEXT, 抽奖奖品)
- 各积分字段
- invitation_code (TEXT, 邀请码)
- host_type, partner_id, partner_name (主办方信息)
- start_time, end_time, end_date (时间信息)
- expected_attendees (INT, 预期参与人数)

---

## 验证功能

迁移完成后，访问：https://partner.velolabs.top/marketing

1. 点击任意活动卡片进入详情页
2. 切换三个标签页测试功能：
   - 活动具体安排（物料、客户名单）
   - 活动执行过程（阶段、任务）
   - 活动后评估（评估、商机转换）

---

## 常见问题

### Q: SQL 执行失败？
**A**: 检查错误信息，常见问题：
- 表已存在：使用 `CREATE TABLE IF NOT EXISTS` 会自动跳过已存在的表
- 权限不足：确保使用的是有管理员权限的账户

### Q: 迁移后数据丢失？
**A**: 不会。迁移只创建新表和添加字段，不会修改或删除现有数据。

### Q: 需要回滚怎么办？
**A**: 使用 `DROP TABLE` 删除新表，或使用 `ALTER TABLE` 删除添加的列。

---

## 支持

如有问题，请查看浏览器控制台错误信息或联系开发者。
