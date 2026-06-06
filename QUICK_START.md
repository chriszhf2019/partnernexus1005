# 🚀 快速数据库迁移指南（5分钟完成）

## 打开 Supabase SQL Editor（1分钟）

直接点击下面的链接，或手动访问：

👉 **https://supabase.com/dashboard/project/sutfazpqcpwxfzzyhforj/sql/new**

或者：
1. 访问 https://supabase.com/dashboard
2. 选择项目 **sutfazpqcpwxfzzyhforj**
3. 点击左侧菜单 **SQL Editor**
4. 点击 **New query**

---

## 复制 SQL（1分钟）

打开文件：`supabase/migrations/20250606000009_marketing_activity_management.sql`

复制全部内容（Ctrl+A → Ctrl+C）

---

## 执行 SQL（1分钟）

1. 在 SQL Editor 中粘贴内容（Ctrl+V）
2. 点击 **Run** 按钮（或按 Cmd+Enter）
3. 等待执行完成（通常几秒钟）

---

## 验证结果（1分钟）

在左侧菜单点击 **Table Editor**，确认看到以下表：
- ✅ marketing_materials
- ✅ marketing_guests
- ✅ marketing_execution_phases
- ✅ marketing_phase_tasks
- ✅ marketing_evaluations
- ✅ marketing_evaluation_leads

---

## 测试功能（1分钟）

访问：https://partner.velolabs.top/marketing

1. 点击任意活动卡片
2. 查看三个新标签页
3. 测试添加物料、添加客户等功能

---

## 完成！🎉

所有功能已准备就绪！

---

## 常见问题

**Q: 看不到新表？**
A: 刷新页面。如果还看不到，检查 SQL 是否执行成功（看底部是否有错误提示）。

**Q: SQL 执行报错？**
A: 常见错误通常是表已存在，可以忽略。或者复制错误信息搜索解决方案。

**Q: 还需要做什么？**
A: 不需要了！所有代码已部署，数据库已迁移，功能已就绪！

---

## 需要帮助？

查看完整文档：
- `MARKETING_ACTIVITY_GUIDE.md` - 功能说明
- `DATABASE_MIGRATION_GUIDE.md` - 迁移说明
