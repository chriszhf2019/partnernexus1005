# 数据库迁移说明

## 迁移状态：待执行

前端已部署完成，现在需要执行数据库迁移来创建新的表结构。

## 迁移文件位置

`supabase/migrations/20250606000009_marketing_activity_management.sql`

## 执行方法

### 方法一：通过 Supabase Dashboard（推荐）

1. 登录 Supabase Dashboard: https://supabase.com/dashboard
2. 选择项目: `sutfazpqcpwxfzzyhforj`
3. 进入 **SQL Editor**
4. 打开文件: `supabase/migrations/20250606000009_marketing_activity_management.sql`
5. 复制全部内容
6. 粘贴到 SQL Editor
7. 点击 **Run** 按钮执行

### 方法二：通过 Supabase CLI

```bash
supabase db push
```

## 迁移内容

本次迁移将创建以下表：

### 1. marketing_materials（活动物料表）
- 存储活动所需的物料信息
- 包含物料名称、类型、数量、状态、负责人等

### 2. marketing_guests（活动客户表）
- 存储活动邀请的客户名单
- 包含客户姓名、公司、职位、联系方式、状态等

### 3. marketing_execution_phases（执行阶段表）
- 存储活动的执行阶段
- 包含阶段名称、描述、排序、状态等

### 4. marketing_phase_tasks（阶段任务表）
- 存储每个阶段的具体任务
- 包含任务名称、描述、类型、状态等

### 5. marketing_evaluations（评估表）
- 存储活动评估数据
- 包含参与人数、线索数量、满意度等

### 6. marketing_evaluation_leads（评估商机表）
- 存储活动中发现的商机
- 包含商机信息、质量等级、转换状态等

### 7. marketing_activities 表扩展
- 添加缺失的字段（province、city、location等）

## 验证迁移

迁移执行后，可以验证以下内容：

1. 在 Supabase Dashboard 中查看 Tables，确认所有新表已创建
2. 访问 https://partner.velolabs.top/marketing
3. 创建或选择一个活动
4. 点击活动卡片进入详情页
5. 测试三个标签页功能：
   - 活动具体安排（物料、客户名单）
   - 活动执行过程（阶段、任务）
   - 活动后评估（评估、商机）

## 常见问题

### Q: 迁移执行失败怎么办？
A: 检查错误信息，通常是表已存在或权限问题。可以删除已存在的表后重新执行。

### Q: 可以分批执行吗？
A: 可以。将SQL文件内容分成多个部分，逐个执行。

### Q: 迁移会影响现有数据吗？
A: 不会。迁移只创建新表和添加新字段，不会修改或删除现有数据。

## 后续步骤

1. 执行数据库迁移
2. 访问 https://partner.velolabs.top/marketing
3. 创建测试活动
4. 测试新功能
5. 如有问题，查看浏览器控制台错误信息
