# 发现的问题汇总 — 全量更新

## 第四轮审查发现的新问题

### 🔴 Issue #30: vite.config.ts 硬编码 Supabase 凭证
**文件**: `vite.config.ts:18-19`

```typescript
define: {
  'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://ezkbjufluczpxdixplxu.supabase.co'),
  'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('sb_publishable_aVrd26m9Gq26oBamwvtKtQ_JdQy9pNf'),
},
```

`define` 中的值在构建时直接编译进前端 JS 包，**覆盖所有 `.env` 文件**。而且这里的 anon key (`sb_publishable_...`) 与 `.env` 文件中的 key (`eyJhbGciOi...`) **不同**，导致：
- 开发时用 `.env` 的 key
- 构建后用 `define` 的 key
- 无法配置多环境（无法通过环境变量更改）

### 🔴 Issue #31: Vercel OIDC Token 明文存储
**文件**: `.env.local:2`

包含 `VERCEL_OIDC_TOKEN`，这是一个 JWT 令牌，用于 Vercel API 认证。虽然 `.env.local` 在 `.gitignore` 中，但任何能访问文件系统的人都能读取。

### 🟡 Issue #32: /api/ai/vision 仅开发环境可用
**文件**: `vite-plugin-api.js:10-80`

`/api/ai/vision` endpoint 只在 `vite-plugin-api.js` 中实现（开发环境）。生产环境（Vercel）只有 `/api/ai/query.js`。因此 `ai-service.ts` 的 `visionQuery()` 在生产环境永远返回错误。

### 🟡 Issue #33: `.env` 包含真实 API 密钥
**文件**: `.env:15,18`

包含真实但未过期的 ARK_API_KEY 和 VITE_RESEND_API_KEY。虽然 `.env` 在 `.gitignore` 中，但 `.env.production` 不含这些 key。如果开发者在 CI/CD 中忘记设置环境变量，可能暴露密钥。

---

## 所有已知问题状态总表（29个）

| # | 严重度 | 问题 | 状态 |
|---|--------|------|------|
| 1 | 🔴 | UI 组件文件缺失 | ✅ 已确认为误报（文件存在） |
| 2 | 🔴 | campaign upsert + .eq() 无效 | ✅ 已修复 |
| 3 | 🔴 | tier 字符串比较 Bug | ✅ 已修复 |
| 4 | 🔴 | getStats() 赢单误判 | ✅ 已修复 |
| 5 | 🔴 | exec_sql 无声失败 | ✅ 已修复 |
| 6 | 🟡 | useData.ts ~100行重复代码 | ✅ 已修复 |
| 7 | 🟡 | Auth 降级无日志 | ✅ 已修复 |
| 8 | 🟡 | 驾驶舱指标名中英文混用 | ✅ 已修复 |
| 9 | 🟡 | errorSuppress 过度抑制 | ✅ 已修复 |
| 10 | 🟡 | _onError 未使用 | ✅ 已修复 |
| 11 | 🟡 | mockGenerator 硬编码Q2 | ✅ 已修复 |
| 12 | 🟢 | vision 路由不存在 | 🟡 部分修复（仅开发环境存在，生产仍缺失） |
| 13 | 🟢 | email 硬编码发件域 | ✅ 已修复 |
| 14 | 🟢 | Firestore users 集合 | ✅ 已修复 |
| 15 | 🟢 | useAsync 类型 | ✅ 已确认为误报 |
| 16 | 🟢 | types.test.ts 占位测试 | ✅ 已修复 |
| 17 | 🟢 | useData 死代码 | ✅ 已修复 |
| 18 | 🟡 | App.tsx 引用不存在表 | ✅ 已修复 |
| 19 | 🟢 | partner-service filter 死代码 | ✅ 已修复 |
| 20 | 🟡 | Edge Function 无效状态 '公海' | ✅ 已修复 |
| 21 | 🟢 | Edge Function 硬编码发件域 | ✅ 已修复 |
| 22 | 🟢 | setTimeout 清理 | ⏸️ 已知问题，影响极小 |
| 23 | 🔴 | 16个脚本硬编码密钥 | ✅ 已修复 |
| 24 | 🔴 | 客户情报硬编码到前端 | ✅ 已添加警告（需后续迁移） |
| 25 | 🟡 | 小程序模板ID占位符 | ✅ 已修复（添加注释） |
| 26 | 🟡 | 小程序API域名过时 | ✅ 已修复 |
| 27 | 🟢 | 重复迁移脚本 | ✅ 已整理并标记废弃 |
| 28 | 🟢 | 缓存策略 | ⏸️ 已记录，非优先 |
| 29 | 🟢 | Routes 缩进误导 | ⏸️ 已记录 |
| **30** | **🟡** | **vite.config.ts 硬编码 Supabase 凭证** | **⏳ 待修复** |
| **31** | **🔴** | **Vercel OIDC Token 明文存储** | **⏳ 待修复** |
| **32** | **🟡** | **vision API 仅开发环境可用** | **⏳ 需创建 Vercel Function** |
| **33** | **🟡** | **`.env` 含真实 API 密钥** | **⏳ 需轮换** |
