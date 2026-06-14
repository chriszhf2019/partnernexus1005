# 数据库脚本使用指南

## 快速开始

```bash
# 1. 配置环境变量
cp scripts/.env.scripts.example .env.scripts
# 编辑 .env.scripts 填入密钥

# 2. 加载环境变量
set -a; source .env.scripts; set +a

# 3. 执行迁移
npx tsx scripts/run-migration.ts
```

## 脚本清单

### 必备脚本（推荐使用）

| 脚本 | 用途 | 所需环境变量 |
|------|------|-------------|
| `scripts/run-migration.ts` | **主迁移脚本** — 按顺序执行 `supabase/migrations/` 下所有 SQL 文件 | `SUPABASE_SERVICE_ROLE_KEY` |
| `scripts/execute-migration.ts` | 执行单个迁移 SQL 文件 | `SUPABASE_SERVICE_ROLE_KEY` |
| `scripts/seed-marketing-data.cjs` | 从 `marketing_activities` 生成营销计划和预算数据 | `SUPABASE_SERVICE_ROLE_KEY` |
| `scripts/setup-production.ts` | 生产环境初始化（创建设置数据、测试用户） | `SUPABASE_SERVICE_ROLE_KEY` |
| `scripts/setup-cron.cjs` | 设置 Edge Function 定时任务 | `SUPABASE_DB_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY` |
| `scripts/run-optimization-migration.cjs` | 执行激励政策优化迁移 | `SUPABASE_SERVICE_ROLE_KEY` |
| `scripts/check-tables.cjs` | 验证数据库表是否已创建 | `SUPABASE_DB_PASSWORD` |
| `scripts/create-remaining-tables.cjs` | 创建剩余的数据表 | `SUPABASE_DB_PASSWORD` |
| `scripts/.env.scripts.example` | 环境变量模板 | — |

### 已废弃/重复的脚本（请勿使用）

以下脚本已被上述脚本取代，保留仅用于兼容性参考：

| 脚本 | 被替代者 | 原因 |
|------|---------|------|
| `verify.cjs` | `scripts/check-tables.cjs` | 同一用途 |
| `fix-tables.cjs` | `scripts/create-remaining-tables.cjs` | 同一用途 |
| `update-eval-table.cjs` | 手动 SQL | 一次性升级脚本 |
| `run-migrate.cjs` | `scripts/run-migration.ts` | 同一用途 |
| `run-incentive-migration.cjs` | `scripts/execute-migration.ts` | 同一用途 |
| `scripts/migrate.mjs` | `scripts/run-migration.ts` | 旧版 ESM 版本 |
| `scripts/migrate-db.cjs` | `scripts/run-migration.ts` | 旧版 CJS 版本 |
| `scripts/add-agenda-column.js` | 手动 SQL | 一次性升级脚本 |
| `scripts/add-agenda-column.mjs` | 手动 SQL | 一次性升级脚本 |
| `scripts/run-migration.sh` | `scripts/run-migration.ts` | Shell 脚本版 |
