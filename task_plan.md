# PartnerNexus 应用修复计划

## 目标
按严重程度优先级逐步修复 PartnerNexus 应用中发现的 17 个问题。

## 优先级分级
- 🔴 P0 - 严重 (导致崩溃或数据错误)
- 🟡 P1 - 中等 (逻辑缺陷/代码异味)
- 🟢 P2 - 轻微 (代码质量/可维护性)

## 修复阶段

### 阶段一：P0 严重问题修复
- [x] 1. 创建缺失的 UI 组件文件
- [x] 2. 修复 campaign-service.ts upsert 逻辑
- [x] 3. 修复 partnerDataBuilder.ts 层级字符串比较
- [x] 4. 修复 deal-service.ts getStats() 赢单判断
- [x] 5. 修复 databaseInit.ts exec_sql 问题

### 阶段二：P1 中等问题修复
- [x] 6. 提取 useData.ts 重复代码为共享函数
- [x] 7. 优化 Auth 默认角色降级逻辑
- [x] 8. 统一驾驶舱指标名中英文
- [x] 9. 改进 errorSuppress.ts 错误抑制
- [x] 10. 修复 config-service.ts _onError 未使用
- [x] 11. 修复 mockGenerator.ts 硬编码季度数据

### 阶段三：P2 轻微问题修复
- [x] 12. 修复 ai-service.ts vision 路由或标记
- [x] 13. email-service.ts 发件域名改为配置
- [x] 14. Firestore rules 添加 users 集合注释
- [x] 15. 修复 useAsync 类型一致性
- [x] 16. 移除 types.test.ts 占位测试
- [x] 17. 清理 useData.ts 未使用的导出

### 阶段四：二轮审查新增修复
- [x] 18. 修复 App.tsx 引用不存在的 marketing_plan 表
- [x] 19. 修复 partner-service.ts 死代码 filter
- [x] 20. 修复 protection-rules Edge Function 无效状态值
- [x] 21. 修复 send-invite Edge Function 硬编码发件域

### 阶段五：验证
- [x] 所有修改文件语法正确
- [x] 修复不破坏现有逻辑
- [x] 22项发现均已记录并处理
